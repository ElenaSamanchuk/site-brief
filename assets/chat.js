/* Чат-помощник на странице брифа: отвечает на частые вопросы (с ИИ, если в скрипте есть ключ Groq),
   а каждый вопрос с ответом приходит Елене в тот же Telegram-чат, что и брифы */
(function () {
  'use strict';
  var CFG = window.BRIEF_CONFIG || {};
  var KEY = 'site-brief-chat';
  var QUICK = ['Сколько времени займёт сайт?', 'Тильда или код — что лучше?', 'Что подготовить к запуску?', 'Как вы считаете стоимость?',
    'Что входит в каждый сайт?', 'Как проходит работа?', 'Нужна ли поддержка после запуска?', 'Можно пропустить вопросы в брифе?'];

  // Частые вопросы — те же факты и правила, что в скрипте (apps-script/Code.gs → CHAT_FACTS, CHAT_FAQ):
  // на них отвечаем сразу на странице, не дожидаясь Google, а вопрос с ответом всё равно уходит Елене в Telegram
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
  'Связаться с Еленой можно в Telegram @ElaneDmitrievna — или оставьте телефон в брифе, и она свяжется с вами',
  'Приложение можно сделать: сайт-приложение ставится на экран телефона иконкой, открывается мгновенно и может присылать уведомления, а для постоянных клиентов — приложение в App Store и Google Play. Что подойдёт вам, Елена посоветует по брифу — вопрос об этом есть на шаге «Функции сайта»'
];
  var CHAT_FAQ = [
  [/приложени|app\s*store|google\s*play|play\s*маркет|pwa/i, 14],
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
  function localAnswer(text) {
    for (var i = 0; i < CHAT_FAQ.length; i++) {
      if (CHAT_FAQ[i][0].test(text)) return CHAT_FACTS[CHAT_FAQ[i][1]] + '. Если нужно подробнее — Елена ответит лично';
    }
    if (/цен|стоим|стоит|бюджет|дорог|дёшев|дешев|оплат|₽|byn|руб/i.test(text)) {
      return 'Стоимость зависит от задач и объёма — Елена рассчитает её по вашему брифу и предложит варианты под ваш бюджет. Поэтому в брифе есть вопрос про бюджет: можно отметить ориентир или «Пока не знаю»';
    }
    return null;
  }

  function endpoint() {
    var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    var q = new URLSearchParams(location.search).get('endpoint');
    return (local && q) ? q : (CFG.endpoint || '');
  }
  function uid() { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2); }
  function load() {
    try { var d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d && d.sid && Date.now() - (d.at || 0) < 864e5) return d; } catch (e) { }
    return { sid: uid(), n: 0, msgs: [], replies: 0, at: Date.now() };
  }
  var st = load();
  function save() { st.at = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function el(tag, cls, text, attrs) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }
  // имя и телефон из черновика брифа — чтобы Елена знала, кто спрашивает
  function contact() {
    try {
      var a = (JSON.parse(localStorage.getItem('site-brief-v1') || 'null') || {}).answers || {};
      return { name: a.c_name || '', phone: a.c_phone || '', messenger: a.c_messenger || '' };
    } catch (e) { return {}; }
  }
  function currentStep() {
    var h = document.querySelector('#brief .sec:not([hidden]) h3, #thanks h2');
    return h ? h.textContent.trim() : '';
  }

  var launcher = el('button', 'chat-launch', null, { type: 'button', 'aria-haspopup': 'dialog', 'aria-expanded': 'false', 'aria-label': 'Есть вопрос? Помощник отвечает сразу' });
  launcher.innerHTML = '<span class="chat-launch-ava" aria-hidden="true">ЕС<i></i></span><span class="chat-launch-text"><b>Есть вопрос?</b><small>Отвечу сразу</small></span>';
  var panel = el('div', 'chat-panel', null, { role: 'dialog', 'aria-label': 'Вопрос Елене', hidden: '' });
  var head = el('div', 'chat-head');
  var who = el('div', 'chat-who');
  var ava = el('span', 'chat-ava', 'ЕС', { 'aria-hidden': 'true' });
  ava.appendChild(el('i'));
  who.appendChild(ava);
  var whoText = el('span');
  whoText.appendChild(el('b', null, 'Помощник по брифу'));
  whoText.appendChild(el('small', null, 'онлайн · сложное передаю Елене'));
  who.appendChild(whoText);
  var close = el('button', 'chat-close', '×', { type: 'button', 'aria-label': 'Закрыть' });
  head.appendChild(who); head.appendChild(close);
  var list = el('div', 'chat-list', null, { 'aria-live': 'polite' });
  var chips = el('div', 'chat-chips');
  var form = el('form', 'chat-form');
  var input = el('input', 'chat-input', null, { type: 'text', maxlength: '600', placeholder: 'Напишите вопрос', 'aria-label': 'Ваш вопрос', autocomplete: 'off' });
  var send = el('button', 'chat-send', null, { type: 'submit', 'aria-label': 'Отправить' });
  send.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>';
  form.appendChild(input); form.appendChild(send);
  panel.appendChild(head); panel.appendChild(list); panel.appendChild(chips); panel.appendChild(form);

  // кнопку показываем, только если скрипт на сервере уже умеет чат: старая версия приняла бы вопрос за пустой бриф
  (async function mountWhenSupported() {
    var url = endpoint();
    if (!url) return;
    await wait(1500);
    for (var i = 0; i < 3; i++) {
      try {
        var j = await (await fetch(url + (url.indexOf('?') < 0 ? '?' : '&') + 'chat=probe&n=0', { cache: 'no-store' })).json();
        if (j && Object.prototype.hasOwnProperty.call(j, 'answer')) {
          document.body.appendChild(launcher); document.body.appendChild(panel);
          setTimeout(function () { launcher.classList.add('chat-hello'); }, 5000);
          return;
        }
        return; // сервер ответил, но чат не умеет
      } catch (e) { await wait(4000); } // ответ Google потерялся — спросим ещё
    }
  })();

  function bubble(role, text) {
    var b = el('div', 'chat-msg chat-' + (role === 'user' ? 'me' : role === 'elena' ? 'elena' : 'bot'), text);
    if (role === 'elena') b.insertBefore(el('b', 'chat-from', 'Елена'), b.firstChild);
    list.appendChild(b);
    list.scrollTop = list.scrollHeight;
    return b;
  }
  function renderAll() {
    list.innerHTML = '';
    bubble('assistant', 'Здравствуйте! Подскажу по брифу и работе над сайтом. Каждый вопрос вижу не только я, но и Елена — она может ответить здесь же. Спросите что угодно');
    st.msgs.forEach(function (m) { bubble(m.role, m.text); });
    renderChips();
  }
  // подсказки — после каждого ответа: ещё не заданные вопросы
  function renderChips() {
    chips.innerHTML = '';
    var asked = st.msgs.filter(function (m) { return m.role === 'user'; }).map(function (m) { return m.text; });
    QUICK.filter(function (q) { return asked.indexOf(q) < 0; }).slice(0, st.msgs.length ? 3 : 4).forEach(function (q) {
      var c = el('button', 'chat-chip', q, { type: 'button' });
      c.onclick = function () { ask(q); };
      chips.appendChild(c);
    });
  }
  // фоновая пересылка вопроса Елене: скрипт отвечает тем же готовым ответом и шлёт пару «вопрос — ответ» в Telegram;
  // если за полминуты сервер так и не увидел сообщение — отправляем ещё раз
  function payloadFor(n, text, skip) {
    return { type: 'chat', key: CFG.formKey || '', sid: st.sid, n: n, text: text, step: currentStep(), contact: contact(),
      tag: new URLSearchParams(location.search).get('tag') || '',
      history: st.msgs.slice(-6 - skip, -skip).map(function (m) { return { role: m.role === 'user' ? 'user' : 'assistant', text: m.text }; }) };
  }
  async function forward(url, n, text) {
    for (var attempt = 0; attempt < 2; attempt++) {
      try { await fetch(url, { method: 'POST', body: JSON.stringify(payloadFor(n, text, 2)) }); } catch (e) { }
      if (await poll(url, n, 30000)) return;
    }
  }
  // ответ по номеру сообщения — если ответ на отправку потерялся или Google отвечает медленно
  async function poll(url, n, maxMs) {
    var start = Date.now();
    while (Date.now() - start < maxMs) {
      await wait(2500);
      var ctrl = new AbortController(), t = setTimeout(function () { ctrl.abort(); }, 12000);
      try {
        var g = await (await fetch(url + (url.indexOf('?') < 0 ? '?' : '&') + 'chat=' + encodeURIComponent(st.sid) + '&n=' + n, { cache: 'no-store', signal: ctrl.signal })).json();
        if (g && g.answer) return g.answer;
      } catch (e) { } finally { clearTimeout(t); }
    }
    return null;
  }
  function open() {
    panel.hidden = false; launcher.setAttribute('aria-expanded', 'true'); document.body.classList.add('chat-open'); launcher.classList.remove('chat-unread');
    renderAll();
    setTimeout(function () { input.focus(); }, 50);
  }
  function shut() { panel.hidden = true; launcher.setAttribute('aria-expanded', 'false'); document.body.classList.remove('chat-open'); launcher.focus(); }
  launcher.onclick = function () { panel.hidden ? open() : shut(); };
  close.onclick = shut;
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) shut(); });

  var busy = false;
  async function ask(text) {
    text = String(text || '').trim();
    if (!text || busy) return;
    busy = true; chips.innerHTML = ''; input.value = '';
    st.n++; st.msgs.push({ role: 'user', text: text }); save();
    bubble('user', text);
    var typing = el('div', 'chat-msg chat-bot chat-typing', null, { 'aria-label': 'Печатает' });
    typing.innerHTML = '<i></i><i></i><i></i>';
    list.appendChild(typing); list.scrollTop = list.scrollHeight;
    var url = endpoint(), answer = null, n = st.n, slow = null;
    var quick = localAnswer(text);
    if (quick) {
      // частый вопрос: отвечаем сразу, пересылка Елене — фоном
      await wait(650);
      typing.remove();
      st.msgs.push({ role: 'assistant', text: quick }); save();
      bubble('assistant', quick);
      if (url) forward(url, n, text);
      renderChips(); busy = false; input.focus();
      return;
    }
    if (url) {
      var payload = payloadFor(n, text, 1);
      slow = setTimeout(function () { if (typing.isConnected) typing.setAttribute('data-slow', 'Секунду, уточняю…'); }, 7000);
      var ctrl = new AbortController(), t = setTimeout(function () { ctrl.abort(); }, 25000);
      try {
        var res = await fetch(url, { method: 'POST', body: JSON.stringify(payload), signal: ctrl.signal });
        var j = await res.json(); if (j && j.ok && j.answer) answer = j.answer;
      } catch (e) { /* ответ Google мог потеряться — спросим по номеру сообщения */ } finally { clearTimeout(t); }
      if (!answer) answer = await poll(url, n, 30000);
    }
    clearTimeout(slow);
    typing.remove();
    if (answer) {
      st.msgs.push({ role: 'assistant', text: answer }); save();
      bubble('assistant', answer);
    } else {
      // Google медлит: не держим человека — ответ сам появится здесь, как только придёт
      var late = bubble('assistant', 'Отвечаю чуть дольше обычного — ответ появится здесь. А бриф можно продолжать');
      late.classList.add('chat-late');
      st.msgs.push({ role: 'assistant', text: late.textContent }); save();
      var idx = st.msgs.length - 1;
      (url ? poll(url, n, 90000) : Promise.resolve(null)).then(function (a) {
        var final = a || 'Не получилось ответить — напишите, пожалуйста, Елене в Telegram @ElaneDmitrievna. Ваш вопрос у неё уже есть';
        late.textContent = final; late.classList.remove('chat-late');
        st.msgs[idx].text = final; save();
        list.scrollTop = list.scrollHeight;
      });
    }
    renderChips();
    busy = false;
    input.focus();
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });

  var replyBusy = false;
  async function checkReplies() {
    var url = endpoint();
    if (!url || !st.n || replyBusy || document.hidden || Date.now() - (st.at || 0) > 864e5) return;
    replyBusy = true;
    var ctrl = new AbortController(), t = setTimeout(function () { ctrl.abort(); }, 15000);
    try {
      var j = await (await fetch(url + (url.indexOf('?') < 0 ? '?' : '&') + 'chat=' + encodeURIComponent(st.sid) + '&replies=1', { cache: 'no-store', signal: ctrl.signal })).json();
      var arr = (j && j.replies) || [];
      for (var i = st.replies || 0; i < arr.length; i++) {
        st.msgs.push({ role: 'elena', text: arr[i].t });
        if (!panel.hidden) bubble('elena', arr[i].t);
      }
      if (arr.length > (st.replies || 0)) {
        st.replies = arr.length; save();
        if (panel.hidden) launcher.classList.add('chat-unread');
      }
    } catch (e) { } finally { clearTimeout(t); replyBusy = false; }
  }
  setInterval(checkReplies, 20000);
})();
