/* Чат-помощник на странице брифа: отвечает на частые вопросы (с ИИ, если в скрипте есть ключ Groq),
   а каждый вопрос с ответом приходит Елене в тот же Telegram-чат, что и брифы */
(function () {
  'use strict';
  var CFG = window.BRIEF_CONFIG || {};
  var KEY = 'site-brief-chat';
  var QUICK = ['Сколько времени займёт сайт?', 'Тильда или код — что лучше?', 'Что подготовить к запуску?', 'Как вы считаете стоимость?'];

  function endpoint() {
    var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    var q = new URLSearchParams(location.search).get('endpoint');
    return (local && q) ? q : (CFG.endpoint || '');
  }
  function uid() { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2); }
  function load() {
    try { var d = JSON.parse(sessionStorage.getItem(KEY) || 'null'); if (d && d.sid) return d; } catch (e) { }
    return { sid: uid(), n: 0, msgs: [] };
  }
  var st = load();
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } }
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
    var b = el('div', 'chat-msg chat-' + (role === 'user' ? 'me' : 'bot'), text);
    list.appendChild(b);
    list.scrollTop = list.scrollHeight;
    return b;
  }
  function renderAll() {
    list.innerHTML = '';
    bubble('assistant', 'Здравствуйте! Подскажу по брифу и работе над сайтом, а вопрос передам Елене — она ответит лично. Спросите что угодно');
    st.msgs.forEach(function (m) { bubble(m.role, m.text); });
    chips.innerHTML = '';
    if (!st.msgs.length) QUICK.forEach(function (q) {
      var c = el('button', 'chat-chip', q, { type: 'button' });
      c.onclick = function () { ask(q); };
      chips.appendChild(c);
    });
  }
  function open() {
    panel.hidden = false; launcher.setAttribute('aria-expanded', 'true'); document.body.classList.add('chat-open');
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
    if (url) {
      var payload = { type: 'chat', key: CFG.formKey || '', sid: st.sid, n: n, text: text, step: currentStep(), contact: contact(),
        tag: new URLSearchParams(location.search).get('tag') || '', history: st.msgs.slice(-7, -1) };
      try {
        slow = setTimeout(function () { if (typing.isConnected) typing.setAttribute('data-slow', 'Секунду, уточняю…'); }, 7000);
        var ctrl = new AbortController(); var t = setTimeout(function () { ctrl.abort(); }, 22000);
        var res = await fetch(url, { method: 'POST', body: JSON.stringify(payload), signal: ctrl.signal });
        clearTimeout(t);
        var j = await res.json(); if (j && j.ok && j.answer) answer = j.answer;
      } catch (e) { /* ответ Google мог потеряться — спросим ещё раз ниже */ }
      for (var i = 0; !answer && i < 5; i++) {
        await wait(2000);
        try { var g = await (await fetch(url + (url.indexOf('?') < 0 ? '?' : '&') + 'chat=' + encodeURIComponent(st.sid) + '&n=' + n, { cache: 'no-store' })).json(); if (g && g.answer) answer = g.answer; } catch (e) { }
      }
    }
    if (!answer) answer = 'Не получилось ответить сразу — напишите, пожалуйста, Елене в Telegram @ElaneDmitrievna. А бриф можно продолжать: ответы сохраняются';
    clearTimeout(slow);
    typing.remove();
    st.msgs.push({ role: 'assistant', text: answer }); save();
    bubble('assistant', answer);
    busy = false;
    input.focus();
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });
})();
