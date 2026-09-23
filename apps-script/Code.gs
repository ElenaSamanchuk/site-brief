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
 *   GROQ_API_KEY     (необязательно) ключ https://console.groq.com/keys — чат-помощник на странице отвечает с ИИ;
 *                    без ключа отвечает готовыми ответами на частые вопросы. Вопросы в любом случае приходят в Telegram
 */
var TZ = 'Europe/Minsk';
var ROOT_FOLDER_NAME = 'Брифы — сайты';
var MAIL_ATTACH_LIMIT = 18 * 1024 * 1024;
var TG_FILE_LIMIT = 45 * 1024 * 1024;

var SEEN_TTL = 6 * 60 * 60; // сколько помнить номер отправки, сек
var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

function doGet(e) {
  // страница спрашивает «дошёл ли бриф», если ответ на отправку потерялся по дороге
  var id = sid_(e && e.parameter && e.parameter.status);
  var chatSid = sid_(e && e.parameter && e.parameter.chat);
  if (chatSid && e.parameter.replies) {
    var rc = cache_(), replies = [];
    try { replies = JSON.parse((rc && rc.get('chat-r:' + chatSid)) || '[]'); } catch (err) { }
    return json_({ ok: true, replies: replies });
  }
  if (chatSid) {
    var cc = cache_();
    var a = cc ? cc.get('chat-a:' + chatSid + ':' + String(e.parameter.n || '').replace(/\D/g, '')) : null;
    return json_({ ok: true, answer: a || null });
  }
  if (id) {
    var c = cache_();
    var detail = c ? c.get('brief-d:' + id) : null;
    return json_({ ok: true, state: (c && c.get('brief:' + id)) || 'unknown', detail: detail ? JSON.parse(detail) : null });
  }
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
  if (data.type === 'chat') return json_(chat_(data, P));

  // Google иногда теряет ответ по дороге к странице, и она отправляет бриф ещё раз с тем же номером — не дублируем
  var sid = sid_(data.id), cache = cache_();
  if (sid && cache) {
    var seen = null;
    try {
      var lock = LockService.getScriptLock();
      var locked = lock.tryLock(5000);
      try {
        seen = cache.get('brief:' + sid);
        if (!seen || seen === 'failed') cache.put('brief:' + sid, 'processing', SEEN_TTL);
      } finally {
        if (locked) lock.releaseLock();
      }
    } catch (err) { /* без защиты от дублей, но бриф важнее */ }
    if (seen && seen !== 'failed') return json_({ ok: true, repeat: true });
  }

  var s = data.summary || {};
  var who = s.company || s.name || 'без имени';
  var now = new Date();
  var stamp = Utilities.formatDate(now, TZ, 'yyyy-MM-dd HH:mm');
  var when = ruDate_(now);
  var title = 'Бриф ' + stamp + ' — ' + who;
  var res = { drive: false, telegram: false, tgFiles: 0, email: false, mailFiles: 0, errors: [] };

  // 1. Папка на Диске: файлы клиента, бриф, ответы
  var folder = null, folderUrl = '', uploads = [];
  var briefHtml = Utilities.newBlob(data.reportHtml || '', 'text/html', safeName_('Бриф — ' + who) + '.html');
  var brief = pdf_(briefHtml); // PDF открывается прямо в Telegram и почте на телефоне
  try {
    folder = rootFolder_(P).createFolder(safeName_(title));
    folderUrl = folder.getUrl();
    folder.createFile(briefHtml);
    if (brief !== briefHtml) folder.createFile(brief);
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
      uploads.push({ blob: blob, size: f.size || 0, label: f.fieldLabel || '', step: f.stepTitle || '' });
      if (folder) folder.createFile(blob);
    } catch (err) {
      res.errors.push('Файл ' + f.name + ': ' + err);
    }
  });

  // 2. Черновик КП (Proposal.gs)
  var kp = null, kpFile = null, kpDocUrl = '';
  try {
    kp = buildProposal(data);
    var kpHtml = Utilities.newBlob(renderProposalHtml(kp), 'text/html', safeName_('КП черновик — ' + who) + '.html');
    kpFile = pdf_(kpHtml);
    if (folder) {
      folder.createFile(kpFile);
      kpDocUrl = createProposalDoc(kp, 'КП — ' + kp.titleShort + ' — ' + stamp, folder);
    }
  } catch (err) {
    res.errors.push('КП: ' + err);
  }

  // 3. Telegram: сводка, затем альбом — бриф, КП и все файлы клиента
  if (P.TG_TOKEN && P.TG_CHAT_ID) {
    var items = [{ blob: brief, caption: '📋 Бриф целиком — все ответы клиента' }];
    if (kpFile) items.push({ blob: kpFile, caption: '💼 Черновик КП — суммы впиши сама' });
    uploads.forEach(function (u) {
      if (u.size < TG_FILE_LIMIT) items.push({ blob: u.blob, caption: '📎 ' + u.blob.getName() + (u.step ? ' · шаг «' + u.step + '»' : '') });
      else res.errors.push('Файл ' + u.blob.getName() + ' больше 45 МБ — только на Диске');
    });
    var text = telegramText_(data, kp, folderUrl, kpDocUrl, when, uploads.length);
    P.TG_CHAT_ID.split(',').map(trim_).filter(String).forEach(function (chat) {
      try {
        tgText_(P.TG_TOKEN, chat, text);
        res.telegram = true;
      } catch (err) {
        res.errors.push('Telegram, сводка: ' + err);
      }
      res.tgFiles = tgFiles_(P.TG_TOKEN, chat, items, res.errors, folderUrl);
      if (res.tgFiles) res.telegram = true;
    });
  }

  // 4. Почта
  try {
    var to = P.EMAIL_TO || Session.getEffectiveUser().getEmail();
    var base = [brief].concat(kpFile ? [kpFile] : []);
    var attachments = base.slice(), sum = 0;
    uploads.forEach(function (u) {
      if (sum + u.size <= MAIL_ATTACH_LIMIT) { attachments.push(u.blob); sum += u.size; }
    });
    var mail = {
      to: to,
      subject: '📝 Новый бриф на сайт — ' + who + (s.brands ? ' (' + s.brands + ')' : ''),
      htmlBody: emailHtml_(data, kp, folderUrl, kpDocUrl, when, uploads.length, attachments.length - base.length),
      attachments: attachments,
      name: 'Бриф на сайт'
    };
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email || '')) mail.replyTo = s.email;
    try {
      MailApp.sendEmail(mail);
      res.mailFiles = attachments.length - base.length;
    } catch (bigErr) {
      // не прошло с файлами — шлём без них, файлы остаются в папке на Диске
      res.errors.push('Почта с вложениями: ' + bigErr);
      mail.attachments = base;
      mail.htmlBody = emailHtml_(data, kp, folderUrl, kpDocUrl, when, uploads.length, 0);
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
    P.TG_CHAT_ID.split(',').map(trim_).filter(String).forEach(function (chat) {
      try {
        tg_(P.TG_TOKEN, 'sendMessage', { chat_id: chat, text: '⚠️ Бриф «' + who + '» принят, но не всё прошло гладко:\n\n' + res.errors.join('\n').slice(0, 3500) + (folderUrl ? '\n\nВсё, что пришло, — в папке: ' + folderUrl : '') });
      } catch (err) { /* уже сообщили, что могли */ }
    });
  }
  if (sid && cache) {
    try {
      cache.put('brief:' + sid, ok ? 'done' : 'failed', SEEN_TTL);
      cache.put('brief-d:' + sid, JSON.stringify({ telegram: res.telegram, tgFiles: res.tgFiles, email: res.email, mailFiles: res.mailFiles, drive: res.drive, clientFiles: uploads.length, errors: res.errors.slice(0, 10) }), SEEN_TTL);
    } catch (err) { }
  }
  return json_(ok ? { ok: true } : { ok: false, error: 'Не удалось доставить: ' + res.errors.join('; ') });
}

/* ───────── чат-помощник на странице брифа ───────── */

var CHAT_LIMIT_SESSION = 20;  // сообщений в час от одного посетителя
var CHAT_LIMIT_DAY = 150;     // всего за сутки — защита от спама в Telegram и квоты ИИ

var CHAT_FACTS = [
  'Елена Саманчук делает сайты на Tilda и кодом: лендинги, многостраничные сайты, каталоги с заявкой, интернет-магазины, онлайн-запись и бронь, игровые механики, акции и промокоды',
  'Как идёт работа: бриф (главное — 10–15 минут) → предложение за 1–2 дня: структура, этапы, сроки → прототип → дизайн → разработка и проверка на iPhone и Android → запуск: домен, аналитика, заявки в Telegram',
  'В каждый сайт входит: адаптив под телефоны, быстрая загрузка, SEO-база, аналитика и цели, защита форм от спама, проверка в разных браузерах, инструкция по управлению',
  'Тильда или код: Тильда — если сами часто меняете тексты, цены и фото без разработчика; код — если нужны особые механики, скорость и полная свобода. Можно выбрать в брифе «Посоветуйте»',
  'Поддержка после запуска — отдельная услуга: продление домена и хостинга, обновление меню и каталога, технические задачи; ежемесячно или разово по задаче',
  'Сроки зависят от объёма сайта и от того, насколько готовы тексты и фото. Елена рассчитает их по вашему брифу и пришлёт в предложении — можно стартовать с минимальной версии, а остальное добавить вторым этапом',
  'Материалы: логотип, фото, меню или прайс, тексты. Если чего-то нет — Елена поможет: тексты, съёмка, оцифровка меню, изображения для фонов',
  'Бриф: главное — на 10–15 минут, детали — по желанию; обязательны только имя и телефон; если сомневаетесь — вариант «Не знаю / обсудим»; ответы сохраняются в браузере, можно вернуться позже; файлы до 20 МБ, большие — ссылкой на Диск',
  'Домен, доступы и права на сайт — у клиента; исправление ошибок 30 дней после запуска — бесплатно',
  'Работы — в блоке «Мои работы» на этой странице и в портфолио elenasamanchuk.github.io/portfolio-neon; связь с Еленой — Telegram @ElaneDmitrievna',
  'Елена работает удалённо с клиентами из разных городов; в портфолио — еда и доставка, кафе, фитнес, образование, психология, магазины, мероприятия',
  'Менять цены, меню и акции можно самим: через Google-таблицу — сайт обновится сам — или в редакторе сайта; на Тильде — в визуальном редакторе. Как удобнее — отметьте в брифе',
  'На сайте можно сделать онлайн-оплату картой или через ЕРИП, бронь столиков, заказ с корзиной, доставку через агрегаторы или свою — нужное отметьте в брифе на шаге «Функции сайта»',
  'Связаться с Еленой можно в Telegram @ElaneDmitrievna — или оставьте телефон в брифе, и она свяжется с вами'
];

var CHAT_FAQ = [
  [/сам(и|им|а|ому)?\s+(менять|обновлять|редактир|править|изменять)|(менять|обновлять|изменить|править)\s+(сам|меню|цен|акци)|google.?таблиц|гугл.?таблиц/i, 11],
  [/онлайн.?оплат|оплат[а-яё]*\s+(на\s+сайте|онлайн|картой)|ерип|брон|доставк|корзин|оформ[а-яё]*\s+заказ|заказ[а-яё]*\s+на\s+сайте/i, 12],
  [/срок|долго|быстр|когда\s+будет\s+готов|сколько\s+(времени|недель|дней)|за\s+сколько/i, 5],
  [/тильд|tilda|конструктор|(^|[^а-яё])кодом?([^а-яё]|$)/i, 3],
  [/поддерж|сопровожд|хостинг|продлен|после\s+запуска/i, 4],
  [/что\s+(нужно\s+)?(подготов|собрат|прислать)|материал|нет\s+(фото|текст|логотип)|кто\s+(напишет|сделает|снимет)|съёмк|съемк|фотограф/i, 6],
  [/обязательн|пропуст|сохран|вернут|файл|долго\s+заполн|сколько\s+вопрос/i, 7],
  [/этап|процесс|как\s+(вы\s+)?(работаете|проходит|идёт|идет)|что\s+(будет\s+)?дальше|после\s+брифа/i, 1],
  [/что\s+входит|включ|адаптив|seo|сео|аналитик/i, 2],
  [/связат|связь|контакт|телеграм|telegram|написать\s+(вам|елене)|позвонить|перезвон/i, 13],
  [/пример|портфолио|кейс|(ваши|свои)\s+работ/i, 9],
  [/работаете\s+с|с\s+кем\s+работ|какие\s+(сферы|ниши|проекты)|город|удалённ|удаленн|минск|гомел|москв|беларус|росси/i, 10]
];

function chat_(data, P) {
  var sid = sid_(data.sid), n = String(data.n || '').replace(/\D/g, '').slice(0, 5);
  var text = String(data.text || '').trim().slice(0, 600);
  if (!sid || !n || !text) return { ok: false, error: 'Пустое сообщение' };
  var cache = cache_();
  var day = Utilities.formatDate(new Date(), TZ, 'yyyyMMdd');
  var perSession = cache ? Number(cache.get('chat-n:' + sid) || 0) : 0;
  var perDay = cache ? Number(cache.get('chat-day:' + day) || 0) : 0;
  if (perSession >= CHAT_LIMIT_SESSION || perDay >= CHAT_LIMIT_DAY) {
    return { ok: true, answer: 'Спасибо! Сейчас много вопросов — напишите, пожалуйста, Елене в Telegram @ElaneDmitrievna, она ответит лично' };
  }
  if (cache) { cache.put('chat-n:' + sid, String(perSession + 1), 3600); cache.put('chat-day:' + day, String(perDay + 1), 86400); }

  var answer = '', viaAi = false;
  if (P.GROQ_API_KEY) {
    try { answer = chatAi_(data, text, P.GROQ_API_KEY); viaAi = !!answer; } catch (err) { console.warn('ИИ не ответил: ' + err); }
  }
  if (!answer) answer = chatFaq_(text);
  if (cache) cache.put('chat-a:' + sid + ':' + n, answer, 900);

  // вопрос и ответ — Елене в тот же чат, что и брифы
  if (P.TG_TOKEN && P.TG_CHAT_ID) {
    var c = data.contact || {};
    var who = [c.name, c.phone, c.messenger].filter(function (x) { return x; }).join(' · ');
    var tag = chatTag_(sid);
    if (cache) { cache.put('chat-sid:' + tag, sid, 21600); cache.put('chat-active', '1', 21600); }
    var head = '💬 <b>Вопрос на странице брифа</b> · #chat #s' + tag + (data.tag ? ' · #' + esc_(String(data.tag).replace(/[^\wа-яё]/gi, '_')) : '');
    var msg = head + '\n' + (who ? '👤 ' + esc_(who) + '\n' : '') + (data.step ? '📍 Шаг: ' + esc_(String(data.step).slice(0, 80)) + '\n' : '') +
      '\n❓ ' + esc_(text) + '\n\n🤖 ' + esc_(answer) + (viaAi ? '' : '\n<i>(готовый ответ — ИИ не подключён)</i>') +
      '\n\n↩️ <i>Ответьте на это сообщение — ответ появится у человека в чате на сайте</i>';
    P.TG_CHAT_ID.split(',').map(trim_).filter(String).forEach(function (chat) {
      try { tgText_(P.TG_TOKEN, chat, msg); } catch (err) { console.warn('Чат → Telegram: ' + err); }
    });
  }
  return { ok: true, answer: answer };
}

function chatTag_(sid) { return String(sid).replace(/-/g, '').slice(0, 8); }

/** Ответы Елены из Telegram на сайт. Запускается триггером раз в минуту (installReplies), пока в чате есть активность */
function pollReplies() {
  var cache = cache_();
  if (!cache || !cache.get('chat-active')) return;
  var P = props_();
  if (!P.TG_TOKEN || !P.TG_CHAT_ID) return;
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    var sp = PropertiesService.getScriptProperties();
    var offset = Number(sp.getProperty('TG_OFFSET') || 0);
    var chats = P.TG_CHAT_ID.split(',').map(trim_);
    var updates = tg_(P.TG_TOKEN, 'getUpdates', { offset: offset, timeout: 0, allowed_updates: ['message'] }) || [];
    updates.forEach(function (u) {
      offset = Math.max(offset, u.update_id + 1);
      var m = u.message;
      if (!m || !m.text || !m.reply_to_message || chats.indexOf(String(m.chat.id)) < 0) return;
      var tag = ((m.reply_to_message.text || '').match(/#s([0-9a-z]{8})/i) || [])[1];
      if (!tag) return;
      var sid = cache.get('chat-sid:' + tag.toLowerCase());
      if (!sid) {
        try { tg_(P.TG_TOKEN, 'sendMessage', { chat_id: m.chat.id, reply_to_message_id: m.message_id, text: 'Не нашла этот разговор: прошло больше 6 часов. Лучше написать человеку напрямую — контакты есть в вопросе, если он их оставил' }); } catch (e) { }
        return;
      }
      var list = [];
      try { list = JSON.parse(cache.get('chat-r:' + sid) || '[]'); } catch (e) { }
      list.push({ t: String(m.text).slice(0, 1500), at: Date.now() });
      cache.put('chat-r:' + sid, JSON.stringify(list), 21600);
      try { tg_(P.TG_TOKEN, 'setMessageReaction', { chat_id: m.chat.id, message_id: m.message_id, reaction: [{ type: 'emoji', emoji: '👍' }] }); } catch (e) { }
    });
    sp.setProperty('TG_OFFSET', String(offset));
  } finally {
    lock.releaseLock();
  }
}

/** Запустить один раз: включает доставку ответов из Telegram на сайт (проверка раз в минуту) */
function installReplies() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'pollReplies') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('pollReplies').timeBased().everyMinutes(1).create();
  console.log('Готово: отвечайте в Telegram на сообщение с вопросом — ответ появится у человека в чате на сайте в течение минуты');
}

function chatFaq_(text) {
  for (var i = 0; i < CHAT_FAQ.length; i++) {
    if (CHAT_FAQ[i][0].test(text)) return CHAT_FACTS[CHAT_FAQ[i][1]] + '. Если нужно подробнее — Елена ответит лично';
  }
  if (/цен|стоим|стоит|бюджет|дорог|дёшев|дешев|оплат|₽|byn|руб/i.test(text)) {
    return 'Стоимость зависит от задач и объёма — Елена рассчитает её по вашему брифу и предложит варианты под ваш бюджет. Поэтому в брифе есть вопрос про бюджет: можно отметить ориентир или «Пока не знаю»';
  }
  return 'Спасибо за вопрос! Передала его Елене — она ответит лично в Telegram или по телефону из брифа. А пока можно продолжать — ответы сохраняются';
}

function chatAi_(data, text, key) {
  var system = 'Ты — помощник Елены Саманчук на странице брифа на разработку сайта. Отвечай по-русски, дружелюбно и коротко: 1–4 предложения, без markdown и списков со звёздочками. ' +
    'Помогай заполнить бриф и отвечай на вопросы о работе, опираясь только на факты ниже. Никогда не называй цены, суммы и сроки в днях, неделях или месяцах — говори, что стоимость и сроки зависят от брифа и Елена рассчитает их и пришлёт в предложении. ' +
    'Если ответа нет в фактах — не выдумывай: скажи, что передал вопрос Елене и она ответит лично. Не обещай скидок и сроков сверх фактов.\n\nФакты:\n- ' + CHAT_FACTS.join('\n- ') +
    (data.step ? '\n\nСейчас человек на шаге брифа: ' + String(data.step).slice(0, 80) : '');
  var messages = [{ role: 'system', content: system }];
  (data.history || []).slice(-6).forEach(function (m) {
    if (m && (m.role === 'user' || m.role === 'assistant' || m.role === 'elena') && m.text) messages.push({ role: m.role === 'user' ? 'user' : 'assistant', content: String(m.text).slice(0, 600) });
  });
  messages.push({ role: 'user', content: text });
  var r = UrlFetchApp.fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + key },
    payload: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: messages, temperature: 0.3, max_tokens: 320 })
  });
  if (r.getResponseCode() !== 200) throw new Error('Groq ' + r.getResponseCode() + ': ' + r.getContentText().slice(0, 200));
  var j = JSON.parse(r.getContentText());
  return String(((j.choices || [])[0] || {}).message ? j.choices[0].message.content : '').trim().replace(/\*\*/g, '').slice(0, 900);
}

/* ───────── тексты уведомлений ───────── */

function telegramText_(data, kp, folderUrl, kpDocUrl, when, filesCount) {
  var s = data.summary || {};
  var L = [];
  L.push('📝 <b>Новый бриф на сайт</b>');
  L.push(esc_(when) + (s.tag ? ' · #' + esc_(String(s.tag).replace(/[^\wа-яё]/gi, '_')) : ''));
  L.push('');
  L.push('🏢 <b>' + esc_(s.company || 'Без названия') + '</b>');
  if (s.sphere) L.push(esc_(s.sphere));
  if (s.brands) L.push('🏷 ' + esc_(s.brands));
  L.push('');
  L.push('👤 <b>' + esc_(s.name || 'Без имени') + '</b>');
  if (s.phone) L.push('📞 ' + esc_(s.phone));
  if (s.messenger) L.push('💬 ' + esc_(s.messenger));
  if (s.email) L.push('✉️ ' + esc_(s.email));
  var need = [];
  if (s.main) need.push('🎯 ' + esc_(s.main));
  if (s.type) need.push('🧱 Формат: ' + esc_(s.type));
  if (s.orders) need.push('🛒 Заказы: ' + esc_(s.orders));
  if (s.booking) need.push('📅 Бронь и запись: ' + esc_(s.booking));
  if (s.budget) need.push('💰 Бюджет: ' + esc_(s.budget));
  if (s.deadline) need.push('⏱ Сроки: ' + esc_(s.deadline));
  if (need.length) {
    L.push('');
    L.push('<b>Что нужно</b>');
    L = L.concat(need);
  }
  if (kp && kp.internal && kp.internal.short && kp.internal.short.length) {
    L.push('');
    L.push('<b>Для тебя</b>');
    L.push('<blockquote>' + kp.internal.short.map(function (x) { return '• ' + esc_(x); }).join('\n') + '</blockquote>');
  }
  var links = [];
  if (kpDocUrl) links.push('💼 <a href="' + esc_(kpDocUrl) + '">Черновик КП</a>');
  if (folderUrl) links.push('📁 <a href="' + esc_(folderUrl) + '">Папка на Диске</a>');
  L.push('');
  if (links.length) L.push(links.join('   '));
  L.push('⬇️ Ниже бриф целиком' + (kp ? ', черновик КП' : '') + (filesCount ? ' и файлы клиента: ' + filesCount : ''));
  return L.join('\n');
}

function emailHtml_(data, kp, folderUrl, kpDocUrl, when, uploadsCount, attachedCount) {
  var s = data.summary || {};
  var F = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;";
  var h = [];
  h.push('<div style="margin:0;padding:24px 12px;background:#f5f5f7;' + F + 'color:#1d1d1f">');
  h.push('<div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e8e8ed;border-radius:18px;overflow:hidden">');

  // шапка
  h.push('<div style="background:#0071e3;background-image:linear-gradient(135deg,#0071e3,#5856d6);padding:22px 26px;color:#ffffff">' +
    '<div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;opacity:.85">Новый бриф на сайт · ' + esc_(when) + (s.tag ? ' · #' + esc_(s.tag) : '') + '</div>' +
    '<div style="font-size:24px;font-weight:700;line-height:1.25;margin-top:6px">' + esc_(s.company || s.name || 'Без названия') + '</div>' +
    ((s.sphere || s.brands) ? '<div style="font-size:14px;opacity:.92;margin-top:4px">' + esc_([s.sphere, s.brands].filter(String).join(' · ')) + '</div>' : '') +
    '</div>');

  h.push('<div style="padding:20px 26px 8px">');

  // контакты — сразу кликабельные
  var rows = [];
  rows.push(['👤', '<b>' + esc_(s.name || 'Без имени') + '</b>']);
  if (s.phone) rows.push(['📞', '<a href="tel:' + esc_(String(s.phone).replace(/[^\d+]/g, '')) + '" style="color:#0071e3;text-decoration:none">' + esc_(s.phone) + '</a>']);
  if (s.messenger) {
    var m = String(s.messenger).trim();
    var tgLink = /^@?[a-z0-9_]{5,}$/i.test(m) ? 'https://t.me/' + m.replace(/^@/, '') : '';
    rows.push(['💬', tgLink ? '<a href="' + tgLink + '" style="color:#0071e3;text-decoration:none">' + esc_(m) + '</a>' : esc_(m)]);
  }
  if (s.email) rows.push(['✉️', '<a href="mailto:' + esc_(s.email) + '" style="color:#0071e3;text-decoration:none">' + esc_(s.email) + '</a>']);
  h.push('<table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 16px">' +
    rows.map(function (r) { return '<tr><td style="padding:3px 10px 3px 0;font-size:15px;vertical-align:top">' + r[0] + '</td><td style="padding:3px 0;font-size:15px">' + r[1] + '</td></tr>'; }).join('') +
    '</table>');

  // кнопки
  var btn = 'display:inline-block;margin:0 8px 8px 0;padding:10px 16px;border-radius:99px;font-size:14px;font-weight:600;text-decoration:none;';
  var buttons = [];
  if (kpDocUrl) buttons.push('<a href="' + kpDocUrl + '" style="' + btn + 'background:#0071e3;color:#ffffff">Черновик КП в Google Docs</a>');
  if (folderUrl) buttons.push('<a href="' + folderUrl + '" style="' + btn + 'background:#f5f5f7;color:#1d1d1f;border:1px solid #e8e8ed">Папка с файлами</a>');
  if (buttons.length) h.push('<div style="margin:0 0 10px">' + buttons.join('') + '</div>');

  // кратко
  var facts = [];
  if (s.main) facts.push(['Главная задача', s.main]);
  if (s.type) facts.push(['Формат', s.type]);
  if (s.orders) facts.push(['Заказы', s.orders]);
  if (s.booking) facts.push(['Бронь и запись', s.booking]);
  if (s.budget) facts.push(['Бюджет', s.budget]);
  if (s.deadline) facts.push(['Сроки', s.deadline]);
  if (facts.length) {
    h.push('<table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:8px 0 18px;border:1px solid #e8e8ed;border-radius:12px">' +
      facts.map(function (f, i) {
        return '<tr><td style="padding:10px 14px;font-size:13px;color:#6e6e73;width:34%;vertical-align:top;' + (i ? 'border-top:1px solid #e8e8ed;' : '') + '">' + esc_(f[0]) + '</td>' +
          '<td style="padding:10px 14px;font-size:14.5px;vertical-align:top;' + (i ? 'border-top:1px solid #e8e8ed;' : '') + '">' + esc_(f[1]) + '</td></tr>';
      }).join('') + '</table>');
  }

  // файлы
  if (uploadsCount) {
    h.push('<p style="margin:0 0 18px;font-size:13.5px;color:#6e6e73">📎 Файлов от клиента: <b style="color:#1d1d1f">' + uploadsCount + '</b>' +
      (attachedCount >= uploadsCount ? ' — все во вложениях' : ', во вложениях: ' + attachedCount + ' — остальные в <a href="' + (folderUrl || '#') + '" style="color:#0071e3">папке на Диске</a>') + '</p>');
  }

  // для тебя
  if (kp && kp.internal) {
    h.push('<div style="margin:0 0 22px;padding:16px 18px;border-radius:14px;background:#fff8e6;border:1px solid #f5d38a">' +
      '<div style="font-size:15px;font-weight:700;margin:0 0 6px">Для тебя: разбор и оценка</div>' +
      '<div style="font-size:14px;line-height:1.5">' + kp.internal.html + '</div></div>');
  }

  // все ответы
  var body = data.reportBody || '';
  if (body.length > 150000) body = '<p>Ответы слишком длинные для письма — полный бриф во вложении</p>';
  h.push('<div style="border-top:1px solid #e8e8ed;padding-top:4px">' + body + '</div>');
  h.push('</div>');
  h.push('<div style="padding:14px 26px 20px;font-size:12px;color:#86868b;border-top:1px solid #f0f0f3">Бриф целиком и черновик КП — во вложениях PDF. Ответить клиенту можно прямо на это письмо, если он указал почту</div>');
  h.push('</div></div>');
  return h.join('\n');
}

/* ───────── Telegram ───────── */

// Запрос к Telegram с повтором: «подождите N секунд» (429) и сбои на стороне Telegram (5xx)
function tgFetch_(token, method, options) {
  options.muteHttpExceptions = true;
  var j = {};
  for (var attempt = 0; attempt < 3; attempt++) {
    var r = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/' + method, options);
    var code = r.getResponseCode();
    try { j = JSON.parse(r.getContentText() || '{}'); } catch (e) { j = { description: 'HTTP ' + code }; }
    if (j.ok) return j.result;
    if (code === 429) { Utilities.sleep(Math.min((j.parameters && j.parameters.retry_after) || 3, 20) * 1000 + 300); continue; }
    if (code >= 500) { Utilities.sleep(1500); continue; }
    break;
  }
  throw new Error(method + ': ' + (j.description || 'нет ответа'));
}

function tg_(token, method, payload) {
  return tgFetch_(token, method, { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload) });
}

// Сводка с разметкой; если Telegram её не принял — тот же текст без разметки, лишь бы дошло
function tgText_(token, chat, html) {
  if (html.length <= 4000) {
    try {
      return tg_(token, 'sendMessage', { chat_id: chat, text: html, parse_mode: 'HTML', disable_web_page_preview: true });
    } catch (err) {
      console.warn('Telegram не принял разметку: ' + err);
    }
  }
  return tg_(token, 'sendMessage', { chat_id: chat, text: plain_(html).slice(0, 4000), disable_web_page_preview: true });
}

function tgDoc_(token, chat, blob, caption) {
  return tgFetch_(token, 'sendDocument', { method: 'post', payload: { chat_id: String(chat), caption: String(caption || '').slice(0, 1000), document: tgBlob_(blob) } });
}

// Google при отправке выкидывает из имён файлов кириллицу: «Тексты для сайта.docx» доходил как «docx» без имени,
// и телефон не понимал, чем его открыть. Поэтому в Telegram — имя латиницей с расширением, настоящее — в подписи
function tgBlob_(blob) {
  return blob.copyBlob().setName(asciiName_(blob.getName()));
}

var TRANSLIT = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', і: 'i', ў: 'u', ї: 'yi', є: 'ye', ґ: 'g' };

function asciiName_(name) {
  var m = String(name || '').normalize('NFC').match(/^(.*?)(\.[A-Za-z0-9]{1,8})?$/); // имена с Mac и iPhone приходят в NFD: «й» = «и» + знак
  var ext = (m[2] || '').toLowerCase();
  var base = m[1].split('').map(function (ch) {
    var lo = ch.toLowerCase(), r = TRANSLIT[lo];
    if (r === undefined) return ch;
    return ch === lo || !r ? r : r.charAt(0).toUpperCase() + r.slice(1);
  }).join('');
  base = base.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  return (base || 'file') + ext;
}

// Файлы — альбомами до 10 штук; альбом не прошёл — по одному; файл не прошёл — ссылка на Диск. Возвращает, сколько дошло
function tgFiles_(token, chat, items, errors, folderUrl) {
  var sent = 0;
  for (var i = 0; i < items.length; i += 10) {
    var group = items.slice(i, i + 10);
    if (group.length > 1) {
      try {
        var payload = { chat_id: String(chat) }, media = [];
        group.forEach(function (it, k) {
          payload['f' + k] = tgBlob_(it.blob);
          media.push({ type: 'document', media: 'attach://f' + k, caption: String(it.caption || '').slice(0, 1000) });
        });
        payload.media = JSON.stringify(media);
        tgFetch_(token, 'sendMediaGroup', { method: 'post', payload: payload });
        sent += group.length;
        continue;
      } catch (err) {
        console.warn('Альбом не прошёл, отправляю по одному: ' + err);
      }
    }
    group.forEach(function (it) {
      try {
        tgDoc_(token, chat, it.blob, it.caption);
        sent++;
      } catch (err) {
        errors.push('Telegram, файл ' + it.blob.getName() + ': ' + err);
        try { tg_(token, 'sendMessage', { chat_id: chat, text: '📎 Файл «' + it.blob.getName() + '» не прошёл в Telegram — он в папке на Диске' + (folderUrl ? ': ' + folderUrl : '') }); } catch (e) { }
      }
    });
  }
  return sent;
}

/* ───────── служебные ───────── */

function cache_() {
  try { return CacheService.getScriptCache(); } catch (e) { return null; }
}

function ruDate_(d) {
  var p = Utilities.formatDate(d, TZ, 'dd|MM|HH:mm').split('|');
  return (+p[0]) + ' ' + MONTHS[+p[1] - 1] + ', ' + p[2];
}

// HTML → PDF: так бриф и КП открываются прямо в Telegram и почте на телефоне; не вышло — остаётся HTML
function pdf_(htmlBlob) {
  try {
    var b = htmlBlob.getAs('application/pdf');
    b.setName(htmlBlob.getName().replace(/\.html?$/i, '') + '.pdf');
    return b;
  } catch (err) {
    console.warn('PDF не собрался, отправлю HTML: ' + err);
    return htmlBlob;
  }
}

function plain_(html) {
  return String(html).replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
}


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
  return String(s || 'file').normalize('NFC').replace(/[\\\/:*?"<>|\u0000-\u001f]+/g, '_').replace(/\s+/g, ' ').trim().slice(0, 120) || 'file';
}

function esc_(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function trim_(s) { return String(s == null ? '' : s).trim(); }

function sid_(s) { return String(s == null ? '' : s).replace(/[^\w-]/g, '').slice(0, 64); }

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
