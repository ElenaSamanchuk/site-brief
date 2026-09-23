/**
 * Приём брифа на сайт → Telegram + почта + Google Диск (+ черновик КП в Google Docs).
 *
 * Свойства скрипта (Настройки проекта → Свойства скрипта):
 *   TG_TOKEN         токен бота от @BotFather
 *   TG_CHAT_ID       ваш chat id — запустите findChatId(); можно несколько через запятую
 *   EMAIL_TO         куда слать письма; по умолчанию — почта аккаунта, от которого развёрнут скрипт
 *   FORM_KEY         то же слово, что formKey в config.js сайта
 *   DRIVE_FOLDER_ID  (необязательно) id папки для брифов; иначе создастся «Брифы — сайты» в корне Диска
 *   SHEET_ID         (необязательно) id Google-таблицы — журнал заявок
 */
var TZ = 'Europe/Minsk';
var ROOT_FOLDER_NAME = 'Брифы — сайты';
var MAIL_ATTACH_LIMIT = 18 * 1024 * 1024;
var TG_FILE_LIMIT = 45 * 1024 * 1024;

function doGet() {
  return json_({ ok: true, service: 'site-brief' });
}

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'Не удалось прочитать ответы' });
  }
  if (data.hp) return json_({ ok: true }); // скрытое поле заполнил бот
  var P = props_();
  if (P.FORM_KEY && data.key !== P.FORM_KEY) return json_({ ok: false, error: 'Неверный ключ формы' });

  var s = data.summary || {};
  var who = s.company || s.name || 'без имени';
  var stamp = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm');
  var title = 'Бриф ' + stamp + ' — ' + who;
  var res = { drive: false, telegram: false, email: false, errors: [] };

  // 1. Папка на Диске: файлы клиента, бриф, ответы
  var folder = null, folderUrl = '', uploads = [];
  var briefBlob = Utilities.newBlob(data.reportHtml || '', 'text/html', safeName_('Бриф — ' + who) + '.html');
  try {
    folder = rootFolder_(P).createFolder(safeName_(title));
    folderUrl = folder.getUrl();
    folder.createFile(briefBlob);
    folder.createFile(Utilities.newBlob(
      JSON.stringify({ summary: s, answers: data.answers, display: data.display, meta: data.meta }, null, 2),
      'application/json', 'answers.json'
    ));
    res.drive = true;
  } catch (err) {
    res.errors.push('Диск: ' + err);
  }
  (data.files || []).forEach(function (f) {
    try {
      var blob = Utilities.newBlob(Utilities.base64Decode(f.data), f.type || 'application/octet-stream', safeName_(f.name));
      if (folder) folder.createFile(blob);
      uploads.push({ blob: blob, size: f.size || 0, label: f.fieldLabel || '' });
    } catch (err) {
      res.errors.push('Файл ' + f.name + ': ' + err);
    }
  });

  // 2. Черновик КП (Proposal.gs)
  var kp = null, kpHtml = null, kpDocUrl = '';
  try {
    kp = buildProposal(data);
    kpHtml = Utilities.newBlob(renderProposalHtml(kp), 'text/html', safeName_('КП черновик — ' + who) + '.html');
    if (folder) {
      folder.createFile(kpHtml);
      kpDocUrl = createProposalDoc(kp, 'КП — ' + kp.titleShort + ' — ' + stamp, folder);
    }
  } catch (err) {
    res.errors.push('КП: ' + err);
  }

  // 3. Telegram
  if (P.TG_TOKEN && P.TG_CHAT_ID) {
    try {
      var text = telegramText_(data, kp, folderUrl, kpDocUrl, stamp);
      P.TG_CHAT_ID.split(',').map(trim_).filter(String).forEach(function (chat) {
        tg_(P.TG_TOKEN, 'sendMessage', { chat_id: chat, text: text, parse_mode: 'HTML', disable_web_page_preview: true });
        tgDoc_(P.TG_TOKEN, chat, briefBlob, 'Бриф целиком');
        if (kpHtml) tgDoc_(P.TG_TOKEN, chat, kpHtml, 'Черновик КП — суммы впиши сама');
        uploads.forEach(function (u) {
          if (u.size < TG_FILE_LIMIT) tgDoc_(P.TG_TOKEN, chat, u.blob, u.label);
        });
      });
      res.telegram = true;
    } catch (err) {
      res.errors.push('Telegram: ' + err);
    }
  }

  // 4. Почта
  try {
    var to = P.EMAIL_TO || Session.getEffectiveUser().getEmail();
    var attachments = [briefBlob];
    if (kpHtml) attachments.push(kpHtml);
    var sum = 0;
    uploads.forEach(function (u) {
      if (sum + u.size <= MAIL_ATTACH_LIMIT) { attachments.push(u.blob); sum += u.size; }
    });
    var mail = {
      to: to,
      subject: title,
      htmlBody: emailHtml_(data, kp, folderUrl, kpDocUrl, uploads.length, attachments.length - (kpHtml ? 2 : 1)),
      attachments: attachments,
      name: 'Бриф на сайт'
    };
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email || '')) mail.replyTo = s.email;
    try {
      MailApp.sendEmail(mail);
    } catch (bigErr) {
      // не прошло с файлами — шлём без них, файлы остаются в папке на Диске
      res.errors.push('Почта с вложениями: ' + bigErr);
      mail.attachments = [briefBlob].concat(kpHtml ? [kpHtml] : []);
      mail.htmlBody = '<p style="color:#d70015"><b>Файлы клиента не влезли в письмо — они в папке на Диске: ' + (folderUrl ? '<a href="' + folderUrl + '">открыть</a>' : 'папка не создалась, см. Telegram') + '</b></p>' + mail.htmlBody;
      MailApp.sendEmail(mail);
    }
    res.email = true;
  } catch (err) {
    res.errors.push('Почта: ' + err);
  }

  // 5. Журнал (необязательно)
  if (P.SHEET_ID) {
    try {
      var sh = SpreadsheetApp.openById(P.SHEET_ID).getSheets()[0];
      if (sh.getLastRow() === 0) sh.appendRow(['Когда', 'Проект', 'Имя', 'Телефон', 'Мессенджер', 'Сфера', 'Главная задача', 'Формат', 'Бюджет', 'Сроки', 'Метка', 'Папка', 'КП']);
      sh.appendRow([stamp, s.company, s.name, s.phone, s.messenger, s.sphere, s.main, s.type, s.budget, s.deadline, s.tag, folderUrl, kpDocUrl]);
    } catch (err) {
      res.errors.push('Таблица: ' + err);
    }
  }

  if (res.errors.length) console.warn(res.errors.join('\n'));
  var ok = res.telegram || res.email;
  if (ok && res.errors.length && res.telegram) {
    try {
      P.TG_CHAT_ID.split(',').map(trim_).filter(String).forEach(function (chat) {
        tg_(P.TG_TOKEN, 'sendMessage', { chat_id: chat, text: '⚠️ Бриф принят, но были ошибки:\n' + esc_(res.errors.join('\n')).slice(0, 3500), parse_mode: 'HTML' });
      });
    } catch (err) { /* уже сообщили, что могли */ }
  }
  return json_(ok ? { ok: true } : { ok: false, error: 'Не удалось доставить: ' + res.errors.join('; ') });
}

/* ───────── тексты уведомлений ───────── */

function telegramText_(data, kp, folderUrl, kpDocUrl, stamp) {
  var s = data.summary || {};
  var L = [];
  L.push('📝 <b>Новый бриф на сайт</b> · ' + esc_(stamp) + (s.tag ? ' · #' + esc_(s.tag) : ''));
  L.push('');
  if (s.company) L.push('🏢 <b>' + esc_(s.company) + '</b>' + (s.sphere ? ' · ' + esc_(s.sphere) : ''));
  if (s.brands) L.push('🏷 ' + esc_(s.brands));
  L.push('👤 ' + esc_(s.name || 'без имени') + (s.role ? ' · ' + esc_(s.role) : ''));
  if (s.phone) L.push('📞 ' + esc_(s.phone));
  if (s.messenger) L.push('💬 ' + esc_(s.messenger));
  if (s.email) L.push('✉️ ' + esc_(s.email));
  L.push('');
  if (s.main) L.push('🎯 Главное: ' + esc_(s.main));
  if (s.type) L.push('🧱 Сайт: ' + esc_(s.type));
  if (s.orders) L.push('🛒 Заказы: ' + esc_(s.orders));
  if (s.booking) L.push('📅 Запись: ' + esc_(s.booking));
  if (s.budget) L.push('💰 Бюджет: ' + esc_(s.budget));
  if (s.deadline) L.push('⏱ Сроки: ' + esc_(s.deadline));
  if (s.filesCount) L.push('📎 Файлов: ' + s.filesCount);
  if (kp && kp.internal) {
    L.push('');
    L.push('<b>Для тебя</b>');
    kp.internal.short.forEach(function (x) { L.push('• ' + esc_(x)); });
  }
  L.push('');
  var links = [];
  if (kpDocUrl) links.push('<a href="' + kpDocUrl + '">Черновик КП</a>');
  if (folderUrl) links.push('<a href="' + folderUrl + '">Папка с файлами</a>');
  if (links.length) L.push(links.join(' · '));
  var text = L.join('\n');
  return text.length > 4000 ? text.slice(0, 3990) + '…' : text;
}

function emailHtml_(data, kp, folderUrl, kpDocUrl, uploadsCount, attachedCount) {
  var s = data.summary || {};
  var box = 'style="background:#f5f5f7;border-radius:12px;padding:16px 18px;margin:0 0 18px;font:14px/1.5 Arial,sans-serif;color:#1d1d1f"';
  var h = [];
  h.push('<div style="max-width:720px;margin:0 auto;font:15px/1.5 Arial,sans-serif;color:#1d1d1f">');
  h.push('<p style="margin:0 0 4px;color:#6e6e73;font-size:13px">Бриф на сайт' + (s.tag ? ' · ' + esc_(s.tag) : '') + '</p>');
  h.push('<h1 style="margin:0 0 6px;font-size:22px">' + esc_(s.company || s.name || 'без имени') + (s.sphere ? ' · ' + esc_(s.sphere) : '') + '</h1>');
  h.push('<p style="margin:0 0 16px">' + [s.name, s.role, s.phone, s.messenger, s.email].filter(String).map(esc_).join(' · ') + '</p>');
  var links = [];
  if (kpDocUrl) links.push('<a href="' + kpDocUrl + '">Черновик КП в Google Docs</a>');
  if (folderUrl) links.push('<a href="' + folderUrl + '">Папка на Диске</a>');
  if (links.length) h.push('<p style="margin:0 0 16px">' + links.join(' · ') + '</p>');
  if (uploadsCount) h.push('<p style="margin:0 0 16px;color:#7a6e63;font-size:13px">Файлов от клиента: ' + uploadsCount + ', в письме: ' + attachedCount + (attachedCount < uploadsCount ? ' — остальные в папке на Диске' : '') + '</p>');
  if (kp && kp.internal) {
    h.push('<div ' + box + '><b style="font-size:15px">Для тебя: разбор и оценка</b>');
    h.push(kp.internal.html);
    h.push('</div>');
  }
  var body = data.reportBody || '';
  if (body.length > 150000) body = '<p>Ответы слишком длинные для письма — полный бриф во вложении.</p>';
  h.push(body);
  h.push('</div>');
  return h.join('\n');
}

/* ───────── Telegram ───────── */

function tg_(token, method, payload) {
  var r = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/' + method, {
    method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true
  });
  var j = JSON.parse(r.getContentText() || '{}');
  if (!j.ok) throw new Error(method + ': ' + (j.description || r.getResponseCode()));
  return j.result;
}

function tgDoc_(token, chat, blob, caption) {
  var r = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendDocument', {
    method: 'post',
    payload: { chat_id: String(chat), caption: String(caption || '').slice(0, 1000), document: blob },
    muteHttpExceptions: true
  });
  var j = JSON.parse(r.getContentText() || '{}');
  if (!j.ok) throw new Error('sendDocument ' + blob.getName() + ': ' + (j.description || r.getResponseCode()));
}

/* ───────── служебные ───────── */

function props_() {
  var p = PropertiesService.getScriptProperties().getProperties();
  Object.keys(p).forEach(function (k) { p[k] = trim_(p[k]); });
  return p;
}

function rootFolder_(P) {
  if (P.DRIVE_FOLDER_ID) return DriveApp.getFolderById(P.DRIVE_FOLDER_ID);
  var it = DriveApp.getRootFolder().getFoldersByName(ROOT_FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.getRootFolder().createFolder(ROOT_FOLDER_NAME);
}

function safeName_(s) {
  return String(s || 'file').replace(/[\\\/:*?"<>|\u0000-\u001f]+/g, '_').replace(/\s+/g, ' ').trim().slice(0, 120) || 'file';
}

function esc_(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function trim_(s) { return String(s == null ? '' : s).trim(); }

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* ───────── запускать вручную из редактора ───────── */

/** Напишите боту /start, затем запустите — в журнале появится ваш chat id */
function findChatId() {
  var P = props_();
  if (!P.TG_TOKEN) throw new Error('Сначала добавьте свойство TG_TOKEN');
  var updates = tg_(P.TG_TOKEN, 'getUpdates', {});
  var seen = {};
  updates.forEach(function (u) {
    var m = u.message || u.channel_post || u.my_chat_member || {};
    var c = m.chat;
    if (c && !seen[c.id]) {
      seen[c.id] = 1;
      console.log('chat id: ' + c.id + ' — ' + [c.first_name, c.last_name, c.username ? '@' + c.username : '', c.title].filter(String).join(' '));
    }
  });
  if (!Object.keys(seen).length) console.log('Пусто. Напишите боту /start и запустите ещё раз');
}

/** Проверка: тестовое сообщение в Telegram и письмо */
function testSend() {
  var P = props_();
  if (P.TG_TOKEN && P.TG_CHAT_ID) {
    P.TG_CHAT_ID.split(',').map(trim_).filter(String).forEach(function (chat) {
      tg_(P.TG_TOKEN, 'sendMessage', { chat_id: chat, text: '✅ Бриф подключён: сюда будут приходить ответы, файлы и черновики КП' });
    });
    console.log('Telegram — отправлено');
  } else {
    console.log('Telegram не настроен: нет TG_TOKEN или TG_CHAT_ID');
  }
  var to = P.EMAIL_TO || Session.getEffectiveUser().getEmail();
  MailApp.sendEmail(to, '✅ Бриф подключён', 'Сюда будут приходить ответы брифа на сайт — с файлами клиента во вложениях.');
  console.log('Письмо — отправлено на ' + to);
  rootFolder_(P);
  console.log('Папка на Диске — есть');
}
