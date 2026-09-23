/* Движок брифа: рендер по схеме, условия, черновик, отправка */
(function () {
  'use strict';

  var SCHEMA = window.BRIEF_SCHEMA;
  var CFG = window.BRIEF_CONFIG || {};
  var DEV = window.BRIEF_DEV || {};
  var STORE_KEY = 'site-brief-v1';
  var MAX_TOTAL = 20 * 1024 * 1024;
  var MAX_FILE = 15 * 1024 * 1024;
  var RERENDER_ON = { b_brands: 1, b_name: 1, g_goals: 1, b_sphere: 1 };

  var answers = {};
  var files = {};
  var fieldIndex = {};
  var sent = false;
  var startedAt = Date.now();
  var tag = (new URLSearchParams(location.search).get('tag') || '').slice(0, 60);

  var form = document.getElementById('brief');
  var navList = document.getElementById('nav-list');
  var navSelect = document.getElementById('nav-select');
  var progressBar = document.getElementById('progress-bar');
  var progressText = document.getElementById('progress-text');
  var draftNote = document.getElementById('draft-note');

  SCHEMA.forEach(function (s) { s.fields.forEach(function (f) { f.section = s; fieldIndex[f.id] = f; }); });

  /* ───────── helpers ───────── */
  // Типографика: неразрывный пробел после коротких слов и предлогов, перед тире, между числом и словом
  var NB = '\u00A0';
  var SHORT_RE = /(^|[\s\u00A0(«„"—–\/])([А-Яа-яЁёA-Za-z]{1,3}|для|без|через|перед|после|около|между|чтобы|когда|если)\s+/g;
  function typo(str) {
    if (typeof str !== 'string' || str.indexOf(' ') < 0) return str;
    var t = str.replace(SHORT_RE, '$1$2' + NB).replace(SHORT_RE, '$1$2' + NB);
    t = t.replace(/ (—|–) /g, NB + '$1 ');
    t = t.replace(/(\d) (?=[А-Яа-яЁёA-Za-z%₽$€])/g, '$1' + NB);
    t = t.replace(/ (бы|ли|же)(?=[\s,.!?;:]|$)/g, NB + '$1');
    return t;
  }
  function typoTree(root) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var n;
    while ((n = w.nextNode())) n.nodeValue = typo(n.nodeValue);
  }

  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    // все внешние ссылки — в соседней вкладке
    if (tag === 'a' && attrs && /^https?:/.test(attrs.href || '') && !attrs.target) { attrs.target = '_blank'; attrs.rel = 'noopener'; }
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'html') { el.innerHTML = v; typoTree(el); }
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    (children || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      el.appendChild(typeof c === 'string' ? document.createTextNode(typo(c)) : c);
    });
    return el;
  }
  // 'Текст' | ['v', 'Текст', 'Пояснение' | {meta}, {meta}]
  function opt(o) {
    if (typeof o === 'string') return { v: o, l: o };
    var r = { v: o[0], l: o[1] };
    if (o[2] && typeof o[2] === 'object') r.m = o[2];
    else { r.h = o[2] || ''; r.m = o[3]; }
    return r;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmtSize(b) {
    if (b < 1024 * 1024) return Math.max(1, Math.round(b / 1024)) + ' КБ';
    return (b / 1024 / 1024).toFixed(1).replace('.', ',') + ' МБ';
  }
  function isFilled(v) {
    if (v === undefined || v === null) return false;
    if (typeof v === 'string') return v.trim() !== '';
    if (typeof v === 'boolean') return v;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object') return Object.keys(v).some(function (k) { return isFilled(v[k]); });
    return true;
  }
  function metaLinks(m) {
    if (!m) return [];
    if (m.links) return m.links;
    return m.href ? [{ href: m.href, text: m.link || 'пример' }] : [];
  }
  function linkEls(m, cls) {
    return metaLinks(m).map(function (l) {
      return h('a', { class: cls || 'ex-link', href: l.href, target: '_blank', rel: 'noopener' }, [l.text + ' ↗']);
    });
  }

  function brandList() {
    var raw = (answers.b_brands || '').split(/[,;\n]+/).map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 8);
    if (raw.length >= 2) return raw.map(function (name, i) { return ['b' + (i + 1), name]; });
    var single = raw[0] || (answers.b_name || '').trim() || 'Ваш проект';
    return [['b1', single]];
  }
  function sphere() {
    var s = answers.b_sphere;
    return s && s !== '__other' ? s : '';
  }
  // строки матрицы с { for: [...] } показываем только своей сфере
  function rowsOf(f) {
    var sp = sphere();
    return (f.rows === 'brands' ? brandList() : f.rows).map(opt).filter(function (r) {
      return !sp || !r.m || !r.m.for || r.m.for.indexOf(sp) >= 0;
    });
  }
  function colsOf(f) { return (f.cols === 'brands' ? brandList() : f.cols).map(opt); }
  function optionsOf(f) {
    if (f.optionsFrom) {
      var src = fieldIndex[f.optionsFrom];
      var chosen = answers[f.optionsFrom] || [];
      var list = src.options.map(opt).filter(function (o) { return chosen.indexOf(o.v) >= 0; });
      if (chosen.indexOf('__other') >= 0 && answers[f.optionsFrom + '__other']) list.push({ v: '__src_other', l: answers[f.optionsFrom + '__other'] });
      return list;
    }
    var all = (f.options || []).map(opt);
    if (f.optionsBySphere) {
      var by = f.optionsBySphere, sp = sphere() || 'other';
      var common = (by.common || []).filter(function (o) { return !(sp === 'food' && o[0] === 'map'); });
      all = (by[sp] || by.other || []).concat(common).map(opt);
    }
    if (f.other) all.push({ v: '__other', l: 'Другое' });
    return all;
  }
  // «Базовый набор»: по умолчанию отмечено всё для текущей сферы, пока клиент сам не поменял
  function ensureDefaults() {
    SCHEMA.forEach(function (s) {
      s.fields.forEach(function (f) {
        if (!f.defaultAll) return;
        var key = sphere() || 'other';
        if (answers[f.id + '__for'] === key) return;
        var vals = optionsOf(f).map(function (o) { return o.v; });
        answers[f.id] = answers[f.id + '__touched']
          ? (answers[f.id] || []).filter(function (v) { return vals.indexOf(v) >= 0; })
          : vals.filter(function (v) { return v !== '__other'; });
        answers[f.id + '__for'] = key;
      });
    });
  }

  /* ───────── conditions ───────── */
  function cond(c) {
    if (!c) return true;
    if (c.any) return c.any.some(cond);
    if (c.all) return c.all.every(cond);
    if (c.brands) return brandList().length >= c.brands;
    var v = answers[c.f];
    if (c.filled) return isFilled(v);
    var arr = Array.isArray(v) ? v : (v === undefined || v === '' ? [] : [v]);
    if (c['in']) return arr.some(function (x) { return c['in'].indexOf(x) >= 0; });
    if (c.has) return arr.some(function (x) { return c.has.indexOf(x) >= 0; });
    if (c.notIn) return !arr.some(function (x) { return c.notIn.indexOf(x) >= 0; });
    return true;
  }
  function visible(f) { return cond(f.section.showIf) && cond(f.showIf); }

  /* ───────── render ───────── */
  function renderField(f) {
    var wrap = h('div', { class: 'q q-' + f.type, 'data-id': f.id, id: 'q-' + f.id });
    if (f.type === 'info') {
      wrap.appendChild(h('div', { class: 'info', html: f.html }));
      return wrap;
    }
    var isGroup = ['radio', 'checkbox', 'matrix', 'perBrand', 'file', 'styleboard'].indexOf(f.type) >= 0;
    var req = f.required ? h('span', { class: 'req', 'aria-hidden': 'true' }, [' *']) : null;
    wrap.appendChild(isGroup
      ? h('div', { class: 'q-label', id: 'lbl-' + f.id }, [f.label, req])
      : h('label', { class: 'q-label', for: 'in-' + f.id }, [f.label, req]));
    var described = [];
    if (f.hint) { wrap.appendChild(h('p', { class: 'q-hint', id: 'hint-' + f.id }, [f.hint])); described.push('hint-' + f.id); }
    if (f.example) {
      wrap.appendChild(h('p', { class: 'q-example', id: 'ex-' + f.id }, [h('span', { class: 'q-example-k' }, ['Например: ']), f.example.replace(/\n/g, ' · ')]));
      described.push('ex-' + f.id);
    }
    if (f.why) {
      wrap.appendChild(h('details', { class: 'why' }, [h('summary', {}, ['Зачем спрашиваю']), h('p', {}, [f.why])]));
    }
    var control = renderControl(f, described.join(' ') || null);
    if (isGroup) {
      control.setAttribute('role', 'group');
      control.setAttribute('aria-labelledby', 'lbl-' + f.id);
    }
    wrap.appendChild(control);
    wrap.appendChild(h('p', { class: 'q-error', role: 'alert' }));
    return wrap;
  }

  function renderControl(f, describedBy) {
    var v = answers[f.id];
    switch (f.type) {
      case 'text': case 'email': case 'tel': case 'url': case 'date':
        return h('input', {
          class: 'inp', type: f.type, id: 'in-' + f.id, name: f.id, value: v || '',
          placeholder: f.placeholder || '', autocomplete: f.autocomplete || 'off',
          'aria-required': f.required ? 'true' : null, 'aria-describedby': describedBy,
          inputmode: f.type === 'tel' ? 'tel' : null,
          oninput: function (e) { setAnswer(f.id, e.target.value, true); },
          onchange: function (e) { if (RERENDER_ON[f.id]) setAnswer(f.id, e.target.value); }
        });
      case 'textarea':
        var ta = h('textarea', {
          class: 'inp', id: 'in-' + f.id, name: f.id, rows: f.lines || 3, placeholder: f.placeholder || '',
          'aria-describedby': describedBy,
          oninput: function (e) { setAnswer(f.id, e.target.value, true); autosize(e.target); },
          onchange: function (e) { if (RERENDER_ON[f.id]) setAnswer(f.id, e.target.value); }
        });
        ta.value = v || '';
        return ta;
      case 'radio': case 'checkbox': return renderChoice(f);
      case 'matrix': return renderMatrix(f);
      case 'styleboard': return renderStyleboard(f);
      case 'perBrand': return renderPerBrand(f);
      case 'file': return renderFile(f);
    }
    return h('div');
  }

  function renderChoice(f) {
    var multi = f.type === 'checkbox';
    var list = optionsOf(f);
    var layout = f.layout || (list.some(function (o) { return o.h || o.m; }) ? 'cards' : 'chips');
    var box = h('div', { class: 'opts ' + layout });
    var current = answers[f.id];
    if (!list.length) {
      box.appendChild(h('p', { class: 'muted' }, ['Сначала отметьте варианты в вопросе выше']));
      return box;
    }
    list.forEach(function (o) {
      var checked = multi ? (current || []).indexOf(o.v) >= 0 : current === o.v;
      var input = h('input', {
        type: multi ? 'checkbox' : 'radio', name: f.id, value: o.v, checked: checked ? true : null,
        onchange: function () { onChoice(f, multi); }
      });
      var soft = o.v === 'unk' || o.v === 'advise' ? ' opt-soft' : '';
      if (layout === 'visual' && o.m && o.m.img) {
        box.appendChild(h('div', { class: 'vis-wrap' }, [
          h('label', { class: 'opt opt-visual' + soft }, [
            input,
            h('span', { class: 'opt-body' }, [
              h('span', { class: 'vis-img' }, [h('img', { src: o.m.img, alt: '', loading: 'lazy', width: '160', height: '200' })]),
              h('span', { class: 'opt-title' }, [o.l])
            ])
          ]),
          linkEls(o.m, 'vis-link')[0] || null
        ]));
        return;
      }
      var links = linkEls(o.m);
      var text = [
        h('span', { class: 'opt-title' }, [o.l]),
        o.h ? h('span', { class: 'opt-hint' }, [o.h]) : null,
        links.length ? h('span', { class: 'opt-links' }, links) : null
      ];
      var anim = o.m && o.m.anim && window.BRIEF_ANIM && window.BRIEF_ANIM[o.m.anim];
      box.appendChild(h('label', { class: 'opt' + soft }, [
        input,
        anim
          ? h('span', { class: 'opt-body has-anim' }, [h('span', { class: 'opt-anim', html: anim }), h('span', { class: 'opt-text' }, text)])
          : h('span', { class: 'opt-body' }, text)
      ]));
    });
    if (f.other) {
      var otherOn = multi ? (current || []).indexOf('__other') >= 0 : current === '__other';
      var other = h('input', {
        class: 'inp inp-other', type: 'text', name: f.id + '__other', placeholder: 'Ваш вариант',
        value: answers[f.id + '__other'] || '', 'aria-label': f.label + ' — свой вариант',
        oninput: function (e) { setAnswer(f.id + '__other', e.target.value, true); }
      });
      other.hidden = !otherOn;
      box.appendChild(other);
    }
    return box;
  }

  function onChoice(f, multi) {
    if (f.defaultAll) answers[f.id + '__touched'] = true;
    var inputs = form.querySelectorAll('input[name="' + f.id + '"]');
    var val = multi ? [] : '';
    inputs.forEach(function (i) { if (i.checked) { if (multi) val.push(i.value); else val = i.value; } });
    var other = form.querySelector('input[name="' + f.id + '__other"]');
    if (other) {
      var on = multi ? val.indexOf('__other') >= 0 : val === '__other';
      other.hidden = !on;
      if (on && !other.value) other.focus();
    }
    setAnswer(f.id, val);
  }

  function renderMatrix(f) {
    var multi = f.mode !== 'radio';
    var rows = rowsOf(f), cols = colsOf(f);
    var state = answers[f.id] || {};
    // один бренд в колонках — это просто список галочек
    if (multi && f.cols === 'brands' && cols.length === 1) {
      var only = cols[0].v;
      var box1 = h('div', { class: 'opts chips' });
      rows.forEach(function (r) {
        box1.appendChild(h('label', { class: 'opt' }, [
          h('input', {
            type: 'checkbox', name: f.id + '::' + r.v, value: only, checked: (state[r.v] || []).indexOf(only) >= 0 ? true : null,
            onchange: function () { onMatrix(f, r.v, true); }
          }),
          h('span', { class: 'opt-body' }, [h('span', { class: 'opt-title' }, [r.l])])
        ]));
      });
      return box1;
    }
    var chars = cols.reduce(function (n, c) { return n + c.l.length; }, 0);
    var box = h('div', { class: 'matrix' + (multi ? '' : ' matrix-radio') + (chars > 34 || cols.length > 4 ? ' matrix-stack' : '') });
    rows.forEach(function (r) {
      var name = f.id + '::' + r.v;
      var cur = state[r.v];
      var opts = h('div', { class: 'mrow-opts' });
      cols.forEach(function (c) {
        var checked = multi ? (cur || []).indexOf(c.v) >= 0 : cur === c.v;
        opts.appendChild(h('label', { class: 'opt opt-mini' + (['no', 'none', 'unk'].indexOf(c.v) >= 0 ? ' opt-soft' : '') }, [
          h('input', {
            type: multi ? 'checkbox' : 'radio', name: name, value: c.v, checked: checked ? true : null,
            'data-was': checked ? '1' : null,
            onchange: function () { onMatrix(f, r.v, multi); },
            onclick: multi ? null : function (e) { toggleRadio(e, f, r.v); }
          }),
          h('span', { class: 'opt-body' }, [h('span', { class: 'opt-title' }, [c.l])])
        ]));
      });
      var links = linkEls(r.m);
      var rec = r.m && r.m.rec && r.m.rec.indexOf(sphere()) >= 0;
      box.appendChild(h('div', { class: 'mrow' + (rec ? ' mrow-rec' : ''), role: 'group', 'aria-label': r.l }, [
        h('div', { class: 'mrow-label' }, [rec ? h('span', { class: 'badge' }, ['часто нужно']) : null, r.l, links.length ? ' ' : null].concat(links)),
        opts
      ]));
    });
    return box;
  }
  // повторный клик по выбранной кнопке в матрице снимает выбор
  function toggleRadio(e, f, row) {
    if (e.target.dataset.was === '1') {
      e.target.checked = false;
      e.target.dataset.was = '';
      onMatrix(f, row, false);
      return;
    }
    form.querySelectorAll('input[name="' + f.id + '::' + row + '"]').forEach(function (i) { i.dataset.was = ''; });
    e.target.dataset.was = '1';
  }
  function onMatrix(f, row, multi) {
    var st = Object.assign({}, answers[f.id] || {});
    var inputs = form.querySelectorAll('input[name="' + f.id + '::' + row + '"]');
    if (multi) {
      var arr = [];
      inputs.forEach(function (i) { if (i.checked) arr.push(i.value); });
      if (arr.length) st[row] = arr; else delete st[row];
    } else {
      var one = '';
      inputs.forEach(function (i) { if (i.checked) one = i.value; });
      if (one) st[row] = one; else delete st[row];
    }
    setAnswer(f.id, st);
  }

  function renderStyleboard(f) {
    var st = answers[f.id] || {};
    if (Array.isArray(st)) { var conv = {}; st.forEach(function (k) { conv[k] = 'yes'; }); st = answers[f.id] = conv; }
    var box = h('div', { class: 'styles' });
    (window.BRIEF_STYLES || []).forEach(function (sty) {
      var name = f.id + '::' + sty.id;
      var cur = st[sty.id];
      var card = h('div', { class: 'style-card' + (cur ? ' ' + cur : ''), role: 'group', 'aria-label': sty.title });
      function paint() {
        var v = (answers[f.id] || {})[sty.id];
        card.classList.toggle('yes', v === 'yes');
        card.classList.toggle('no', v === 'no');
      }
      function btn(v, text) {
        return h('label', { class: 'opt opt-' + v }, [
          h('input', {
            type: 'radio', name: name, value: v, checked: cur === v ? true : null, 'data-was': cur === v ? '1' : null,
            onchange: function () { onMatrix(f, sty.id, false); paint(); },
            onclick: function (e) { toggleRadio(e, f, sty.id); paint(); }
          }),
          h('span', { class: 'opt-body' }, [h('span', { class: 'opt-title' }, [text])])
        ]);
      }
      card.appendChild(h('span', { class: 'style-art', html: sty.svg }));
      card.appendChild(h('div', { class: 'style-body' }, [
        h('span', { class: 'style-title' }, [sty.title]),
        h('span', { class: 'style-note' }, [sty.note]),
        h('span', { class: 'style-sw', 'aria-hidden': 'true' }, sty.swatches.map(function (c) { return h('i', { style: 'background:' + c }); })),
        sty.example ? h('a', { class: 'ex-link', href: sty.example.href, target: '_blank', rel: 'noopener' }, ['Пример: ' + sty.example.text + ' ↗']) : null,
        h('div', { class: 'style-actions' }, [btn('yes', '✓ Нравится'), btn('no', '✕ Не моё')])
      ]));
      box.appendChild(card);
    });
    return box;
  }

  function renderPerBrand(f) {
    var st = answers[f.id] || {};
    var brands = brandList();
    var box = h('div', { class: 'perbrand' + (brands.length === 1 ? ' perbrand-one' : '') });
    brands.forEach(function (b) {
      var id = 'in-' + f.id + '-' + b[0];
      var ta = h('textarea', {
        class: 'inp', rows: 3, id: id, 'aria-label': brands.length === 1 ? f.label : f.label + ' — ' + b[1],
        oninput: function (e) {
          var s = Object.assign({}, answers[f.id] || {});
          s[b[0]] = e.target.value;
          setAnswer(f.id, s, true);
          autosize(e.target);
        }
      });
      ta.value = st[b[0]] || '';
      box.appendChild(h('div', { class: 'pb-item' }, [brands.length > 1 ? h('label', { class: 'pb-label', for: id }, [b[1]]) : null, ta]));
    });
    return box;
  }

  function renderFile(f) {
    var box = h('div', { class: 'filebox' });
    var input = h('input', {
      type: 'file', multiple: true, id: 'in-' + f.id, class: 'visually-hidden',
      onchange: function (e) { addFiles(f, e.target.files); e.target.value = ''; }
    });
    var drop = h('label', { class: 'drop', for: 'in-' + f.id }, [
      h('span', { class: 'drop-icon', 'aria-hidden': 'true' }, ['+']),
      h('span', {}, [h('b', {}, ['Выбрать файлы']), ' или перетащить сюда'])
    ]);
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
    drop.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files) addFiles(f, e.dataTransfer.files); });
    box.appendChild(input);
    box.appendChild(drop);
    box.appendChild(h('ul', { class: 'file-list' }));
    box.appendChild(h('p', { class: 'file-note muted' }));
    paintFiles(f, box);
    return box;
  }
  function totalFiles() {
    var t = 0;
    Object.keys(files).forEach(function (k) { files[k].forEach(function (x) { t += x.size; }); });
    return t;
  }
  function addFiles(f, fileList) {
    var arr = files[f.id] || (files[f.id] = []);
    var notes = [];
    Array.prototype.forEach.call(fileList, function (file) {
      if (file.size > MAX_FILE) { notes.push('«' + file.name + '» больше 15 МБ — добавьте его ссылкой на Диск'); return; }
      if (totalFiles() + file.size > MAX_TOTAL) { notes.push('«' + file.name + '» не влезает в 20 МБ — добавьте ссылкой'); return; }
      if (arr.some(function (x) { return x.name === file.name && x.size === file.size; })) return;
      arr.push(file);
    });
    answers[f.id] = arr.map(function (x) { return x.name; });
    paintFiles(f, form.querySelector('[data-id="' + f.id + '"] .filebox'), notes.join('. '));
    afterChange(f.id);
  }
  function paintFiles(f, box, note) {
    if (!box) return;
    var list = box.querySelector('.file-list');
    list.innerHTML = '';
    (files[f.id] || []).forEach(function (file, i) {
      list.appendChild(h('li', {}, [
        h('span', { class: 'file-name' }, [file.name]),
        h('span', { class: 'muted' }, [fmtSize(file.size)]),
        h('button', {
          type: 'button', class: 'link-btn', 'aria-label': 'Убрать ' + file.name,
          onclick: function () {
            files[f.id].splice(i, 1);
            answers[f.id] = files[f.id].map(function (x) { return x.name; });
            paintFiles(f, box);
            afterChange(f.id);
          }
        }, ['убрать'])
      ]));
    });
    var lost = answers[f.id] && answers[f.id].length && !(files[f.id] || []).length;
    box.querySelector('.file-note').textContent = note || (lost ? 'Файлы не сохраняются в черновике — прикрепите их ещё раз перед отправкой' : '');
    if (lost) delete answers[f.id];
  }

  function autosize(ta) {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight + 2, 480) + 'px';
  }

  /* ───────── шаги ───────── */
  var cur = 'contacts';
  var shownStep = null;
  var submitArea = document.getElementById('submit-area');
  var stepNav, backBtn, nextBtn;

  function stepList() {
    var list = [];
    SCHEMA.forEach(function (s) { if (s.part === 1 && cond(s.showIf)) list.push({ id: s.id, kind: 'sec', part: 1, title: s.title, s: s }); });
    list.push({ id: 'break', kind: 'break', part: 1, title: 'Главное готово' });
    SCHEMA.forEach(function (s) { if (s.part === 2 && cond(s.showIf)) list.push({ id: s.id, kind: 'sec', part: 2, title: s.title, s: s }); });
    list.push({ id: 'finish', kind: 'finish', part: 2, title: 'Отправка' });
    return list;
  }
  function indexOfStep(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return i;
    return -1;
  }
  function minutes(s) {
    var n = s.fields.filter(function (f) { return f.type !== 'info' && visible(f); }).length;
    return Math.max(1, Math.round(n * 20 / 60));
  }
  function screen(id, title, text, actions) {
    return h('section', { class: 'sec screen screen-' + id, id: 'sec-' + id, 'aria-labelledby': 'h-' + id }, [
      h('div', { class: 'screen-mark', 'aria-hidden': 'true' }, ['✓']),
      h('h3', { id: 'h-' + id, tabindex: '-1' }, [title]),
      h('p', { class: 'screen-text' }, [text]),
      actions ? h('div', { class: 'screen-actions' }, actions) : null,
      h('div', { class: 'screen-preview' }, [
        h('h4', {}, ['Так по вашим ответам может выглядеть сайт']),
        h('div', { class: 'pv-screen-mount', id: 'pv-mount-' + id })
      ]),
      h('div', { class: 'submit-slot' })
    ]);
  }

  function render() {
    var focusId = document.activeElement && document.activeElement.id;
    var scrollY = window.scrollY;
    ensureDefaults();
    document.getElementById('main').appendChild(submitArea);
    form.innerHTML = '';
    SCHEMA.forEach(function (s) {
      var sec = h('section', { class: 'sec', id: 'sec-' + s.id, 'aria-labelledby': 'h-' + s.id }, [
        h('header', { class: 'sec-head' }, [
          h('p', { class: 'sec-kicker', id: 'kicker-' + s.id }),
          h('h3', { id: 'h-' + s.id, tabindex: '-1' }, [s.title]),
          s.intro ? h('p', { class: 'sec-intro' }, [s.intro]) : null
        ])
      ]);
      s.fields.forEach(function (f) { sec.appendChild(renderField(f)); });
      form.appendChild(sec);
    });
    form.appendChild(screen('break', 'Главное готово',
      'Этого уже хватит, чтобы подготовить предложение — можно отправить прямо сейчас. А если есть ещё 10–15 минут, ответьте на детали: предложение будет точнее, а вопросов потом меньше',
      [h('button', { type: 'button', class: 'btn', onclick: function () { go(neighbour('break', 1)); } }, ['Ответить на детали →']),
       h('span', { class: 'screen-or' }, ['или отправьте сейчас ↓'])]));
    form.appendChild(screen('finish', 'Всё готово', 'Спасибо, что ответили так подробно! Осталось поставить галочку и отправить', null));
    backBtn = h('button', { type: 'button', class: 'btn btn-ghost', onclick: function () { go(neighbour(cur, -1), { back: true }); } }, ['← Назад']);
    nextBtn = h('button', { type: 'button', class: 'btn', onclick: function () { go(neighbour(cur, 1)); } }, ['Далее →']);
    stepNav = h('div', { class: 'step-nav' }, [backBtn, h('span', { class: 'step-count', id: 'step-count' }), nextBtn]);
    form.appendChild(stepNav);
    form.appendChild(h('input', { type: 'text', name: 'company_website', class: 'hp', tabindex: '-1', autocomplete: 'off', 'aria-hidden': 'true' }));
    if (window.BriefPreview) {
      BriefPreview.mount(document.getElementById('pv-mount-break'));
      BriefPreview.mount(document.getElementById('pv-mount-finish'));
    }
    refresh();
    form.querySelectorAll('textarea').forEach(autosize);
    window.scrollTo(0, scrollY);
    if (focusId) { var el = document.getElementById(focusId); if (el) el.focus({ preventScroll: true }); }
  }

  function neighbour(id, dir) {
    var list = stepList();
    var i = indexOfStep(list, id);
    var j = Math.min(list.length - 1, Math.max(0, i + dir));
    return list[j].id;
  }

  function go(id, opts) {
    opts = opts || {};
    var list = stepList();
    var from = indexOfStep(list, cur), to = indexOfStep(list, id);
    if (!opts.back && !opts.force && to > from && list[from] && list[from].kind === 'sec') {
      var bad = validateSection(list[from].s);
      if (bad) { focusField(bad); return; }
    }
    cur = id;
    if (pendingRender) { pendingRender = false; render(); } else refresh();
    var top = document.getElementById('main').getBoundingClientRect().top + window.scrollY - 70;
    if (window.scrollY > top || !opts.stay) window.scrollTo({ top: Math.max(0, top), behavior: opts.instant ? 'auto' : 'smooth' });
    var hd = document.getElementById('h-' + id);
    if (hd && !opts.instant) setTimeout(function () { hd.focus({ preventScroll: true }); }, 300);
    form.querySelectorAll('#sec-' + id + ' textarea').forEach(autosize);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraft, 200);
  }

  /* ───────── бегущая строка работ ───────── */
  function workCard(w, clone) {
    return h('a', {
      class: 'work', href: w.href, target: '_blank', rel: 'noopener', draggable: 'false',
      tabindex: clone ? '-1' : null, 'aria-hidden': clone ? 'true' : null,
      'aria-label': clone ? null : w.title + ' — ' + w.text + ' (откроется в новой вкладке)'
    }, [
      h('span', { class: 'work-img' }, [
        h('img', { src: w.img, alt: '', loading: 'lazy', decoding: 'async', width: '156', height: '195', draggable: 'false' }),
        w.tags ? h('span', { class: 'work-tags' }, w.tags.map(function (t) { return h('span', {}, [t]); })) : null,
        w.badge ? h('span', { class: 'work-badge' }, [w.badge]) : null
      ]),
      h('span', { class: 'work-title' }, [w.title]),
      h('span', { class: 'work-text' }, [w.text])
    ]);
  }
  function marquee(row, track, dir, speed) {
    var x = 0, half = 0, last = 0;
    var hover = false, focus = false, dragging = false, visible = true;
    var startX = 0, startOff = 0, moved = 0, pid = null;
    function measure() { half = track.scrollWidth / 2; if (half && dir > 0 && x === 0) x = -half; }
    measure();
    window.addEventListener('resize', measure);
    track.querySelectorAll('img').forEach(function (img) { img.addEventListener('load', measure); });
    function tick(t) {
      var dt = last ? Math.min(64, t - last) / 1000 : 0;
      last = t;
      if (!hover && !focus && !dragging && visible && half) x += dir * speed * dt;
      if (half) { while (x <= -half) x += half; while (x > 0) x -= half; }
      track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    row.addEventListener('mouseenter', function () { hover = true; });
    row.addEventListener('mouseleave', function () { hover = false; });
    row.addEventListener('focusin', function () { focus = true; });
    row.addEventListener('focusout', function () { focus = false; });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(row);
    row.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pid = e.pointerId; startX = e.clientX; startOff = x; moved = 0;
    });
    row.addEventListener('pointermove', function (e) {
      if (pid !== e.pointerId) return;
      var dx = e.clientX - startX;
      if (!dragging && Math.abs(dx) > 6) { dragging = true; row.classList.add('grabbing'); try { row.setPointerCapture(pid); } catch (err) { /* нет захвата — не страшно */ } }
      if (dragging) { moved = dx; x = startOff + dx; }
    });
    function end() { pid = null; if (dragging) { dragging = false; row.classList.remove('grabbing'); } }
    row.addEventListener('pointerup', end);
    row.addEventListener('pointercancel', end);
    row.addEventListener('click', function (e) { if (Math.abs(moved) > 6) { e.preventDefault(); e.stopPropagation(); } moved = 0; }, true);
  }
  function renderWorks() {
    var box = document.getElementById('works');
    if (!box || !window.BRIEF_WORKS) return;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    [1, 2].forEach(function (rowNo, i) {
      var list = window.BRIEF_WORKS.filter(function (w) { return (w.row || 1) === rowNo; });
      if (!list.length) return;
      var track = h('div', { class: 'mq-track' });
      list.forEach(function (w) { track.appendChild(workCard(w, false)); });
      if (!reduce) {
        // половина дорожки должна быть шире самого широкого экрана, иначе появится разрыв
        var reps = Math.max(1, Math.ceil(2800 / (list.length * 170)));
        for (var r = 1; r < reps * 2; r++) list.forEach(function (w) { track.appendChild(workCard(w, true)); });
      }
      var row = h('div', { class: 'mq-row' + (reduce ? ' mq-static' : '') }, [track]);
      box.appendChild(row);
      if (!reduce) marquee(row, track, i % 2 ? 1 : -1, i % 2 ? 26 : 32);
    });
  }

  /* ───────── state ───────── */
  var saveTimer;
  function setAnswer(id, val, typing) {
    answers[id] = val;
    afterChange(id, typing);
  }
  var pendingRender = false;
  function afterChange(id, typing) {
    clearError(id.split('__')[0]);
    var f = fieldIndex[id];
    if (RERENDER_ON[id] && !typing) {
      // текстовые поля меняют разметку других шагов — перестроим при переходе, чтобы не съесть клик по соседнему варианту
      if (f && (f.type === 'text' || f.type === 'textarea')) { pendingRender = true; refresh(); }
      else render();
    } else refresh();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraft, 400);
  }
  function saveDraft() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ answers: answers, step: cur, savedAt: Date.now() }));
      draftNote.textContent = 'Черновик сохранён · ' + new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { /* приватный режим — без черновика */ }
  }
  function loadDraft() {
    try {
      var d = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (d && d.answers) {
        answers = d.answers;
        if (d.step) cur = d.step;
        var when = new Date(d.savedAt);
        draftNote.textContent = 'Восстановили черновик от ' + when.toLocaleDateString('ru-RU') + ', ' + when.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) { /* нет доступа к хранилищу */ }
  }
  function clearDraft() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
  }

  /* ───────── visibility + progress ───────── */
  function sectionStats(s) {
    var total = 0, done = 0;
    s.fields.forEach(function (f) {
      if (f.type === 'info' || !visible(f)) return;
      total++;
      if (isFilled(answers[f.id]) && !(f.defaultAll && !answers[f.id + '__touched'] && !answers[f.id + '__seen'])) done++;
    });
    return { total: total, done: done };
  }
  function refresh() {
    var list = stepList();
    if (indexOfStep(list, cur) < 0) cur = list[0].id;
    var idx = indexOfStep(list, cur);
    var step = list[idx];
    var PARTS = window.BRIEF_PARTS || {};
    var partSteps = list.filter(function (x) { return x.part === step.part && x.kind === 'sec'; });
    var changed = shownStep !== cur;
    shownStep = cur;
    SCHEMA.forEach(function (s) {
      var secEl = document.getElementById('sec-' + s.id);
      if (secEl) secEl.hidden = s.id !== cur;
      s.fields.forEach(function (f) {
        var el = document.getElementById('q-' + f.id);
        if (el) el.hidden = !visible(f);
      });
      if (s.id === cur) {
        if (s.fields.some(function (f) { return f.defaultAll; })) s.fields.forEach(function (f) { if (f.defaultAll) answers[f.id + '__seen'] = true; });
        var k = document.getElementById('kicker-' + s.id);
        var n = indexOfStep(partSteps, s.id) + 1;
        if (k) k.textContent = (PARTS[s.part] ? PARTS[s.part].title : 'Часть ' + s.part) + ' · шаг ' + n + ' из ' + partSteps.length + ' · ≈ ' + minutes(s) + ' мин' + (s.part === 2 ? ' · можно пропустить' : '');
      }
    });
    ['break', 'finish'].forEach(function (id) {
      var el = document.getElementById('sec-' + id);
      if (el) el.hidden = id !== cur;
    });
    if (changed) {
      var shown = document.getElementById('sec-' + cur);
      if (shown) { shown.classList.remove('enter'); void shown.offsetWidth; shown.classList.add('enter'); }
    }
    // кнопка отправки живёт на экранах «Главное готово» и «Всё готово»
    var slot = document.querySelector('#sec-' + cur + ' .submit-slot');
    if (slot) { slot.appendChild(submitArea); submitArea.hidden = false; }
    else submitArea.hidden = true;
    if (stepNav) {
      backBtn.hidden = idx === 0;
      nextBtn.hidden = step.kind !== 'sec';
      var nxt = list[idx + 1];
      nextBtn.textContent = nxt && nxt.kind === 'finish' ? 'К отправке →' : nxt && nxt.kind === 'break' ? 'Готово →' : 'Далее →';
      document.getElementById('step-count').textContent = step.kind === 'sec' ? (indexOfStep(partSteps, cur) + 1) + ' / ' + partSteps.length : '';
    }
    // навигация
    navList.innerHTML = '';
    navSelect.innerHTML = '';
    var lastPart = null, group = null;
    list.forEach(function (x, i) {
      if (x.part !== lastPart && x.kind === 'sec') {
        lastPart = x.part;
        var p = PARTS[x.part] || { title: 'Часть ' + x.part };
        navList.appendChild(h('li', { class: 'nav-part' }, [p.title]));
        group = h('optgroup', { label: p.title });
        navSelect.appendChild(group);
      }
      var st = x.kind === 'sec' ? sectionStats(x.s) : null;
      var cls = (x.id === cur ? 'active ' : '') + (st && st.total && st.done === st.total ? 'done' : st && st.done ? 'part' : '') + (x.kind !== 'sec' ? ' nav-screen' : '');
      navList.appendChild(h('li', {}, [h('a', {
        href: '#', 'data-sec': x.id, class: cls, 'aria-current': x.id === cur ? 'step' : null,
        onclick: function (e) { e.preventDefault(); go(x.id, { force: true }); }
      }, [h('span', { class: 'dot' }), h('span', {}, [x.title])])]));
      (group || navSelect).appendChild(h('option', { value: x.id, selected: x.id === cur ? true : null }, [x.title]));
    });
    // прогресс по шагам «Главного», потом — по деталям
    var mainSteps = list.filter(function (x) { return x.part === 1; });
    var pct;
    if (step.part === 1) pct = Math.round(indexOfStep(mainSteps, cur) / (mainSteps.length - 1) * 100);
    else pct = 100;
    progressBar.style.width = pct + '%';
    progressBar.parentNode.setAttribute('aria-valuenow', pct);
    var st2 = list.filter(function (x) { return x.part === 2 && x.kind === 'sec'; });
    schedulePreview();
    progressText.textContent = step.kind === 'sec'
      ? (step.part === 1 ? 'Главное · шаг ' + (indexOfStep(partSteps, cur) + 1) + ' из ' + partSteps.length : 'Детали · шаг ' + (indexOfStep(st2, cur) + 1) + ' из ' + st2.length)
      : step.title;
  }

  /* ───────── живой макет ───────── */
  var pvQueued = false;
  function schedulePreview() {
    if (!window.BriefPreview || pvQueued) return;
    pvQueued = true;
    (window.requestAnimationFrame || setTimeout)(function () {
      pvQueued = false;
      BriefPreview.update(answers, brandList());
      if (cur === 'break' || cur === 'finish') BriefPreview.refit();
    });
  }
  function openPreview() {
    var opener = document.activeElement;
    var mount = h('div', { id: 'pv-modal-mount' });
    var close = h('button', { type: 'button', class: 'pv-close', 'aria-label': 'Закрыть' }, ['×']);
    var modal = h('div', { class: 'pv-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Ваш будущий сайт' }, [
      h('div', { class: 'pv-modal-box' }, [
        h('div', { class: 'pv-modal-head' }, [h('b', {}, ['Ваш будущий сайт']), close]),
        mount,
        h('p', { class: 'pv-note' }, ['Это набросок, а не дизайн: он показывает, как ответы превращаются в структуру сайта'])
      ])
    ]);
    function shut() {
      document.removeEventListener('keydown', onKey);
      modal.remove();
      document.body.style.overflow = '';
      if (opener && opener.focus) opener.focus();
    }
    function onKey(e) { if (e.key === 'Escape') shut(); }
    close.addEventListener('click', shut);
    modal.addEventListener('click', function (e) { if (e.target === modal) shut(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    BriefPreview.mount(mount);
    BriefPreview.update(answers, brandList());
    close.focus();
  }

  /* ───────── display & report ───────── */
  function labelOf(f, v) {
    if (v === '__other') return 'Другое: ' + (answers[f.id + '__other'] || '—');
    if (v === '__src_other') return answers[f.optionsFrom + '__other'] || 'Другое';
    var src = f.optionsFrom ? fieldIndex[f.optionsFrom].options : (f.options || []);
    var o = (f.optionsBySphere ? optionsOf(f) : src.map(opt)).filter(function (x) { return x.v === v; })[0];
    return o ? o.l : v;
  }
  function display(f) {
    var v = answers[f.id];
    if (!isFilled(v)) return '';
    switch (f.type) {
      case 'radio': return labelOf(f, v);
      case 'checkbox':
        var txt = v.map(function (x) { return labelOf(f, x); }).join('\n');
        return f.defaultAll && !answers[f.id + '__touched'] ? txt + '\n(стандартный набор — клиент не менял)' : txt;
      case 'matrix':
        var rows = rowsOf(f), cols = colsOf(f);
        var single = f.cols === 'brands' && cols.length === 1;
        return rows.filter(function (r) { return isFilled(v[r.v]); }).map(function (r) {
          if (single) return r.l;
          return r.l + ' — ' + [].concat(v[r.v]).map(function (c) {
            var o = cols.filter(function (x) { return x.v === c; })[0];
            return o ? o.l : c;
          }).join(', ');
        }).join('\n');
      case 'styleboard':
        var yes = [], no = [];
        (window.BRIEF_STYLES || []).forEach(function (sty) { if (v[sty.id] === 'yes') yes.push(sty.title); if (v[sty.id] === 'no') no.push(sty.title); });
        return [yes.length ? 'Нравится: ' + yes.join(', ') : '', no.length ? 'Не моё: ' + no.join(', ') : ''].filter(Boolean).join('\n');
      case 'perBrand':
        var bl = brandList();
        return bl.filter(function (b) { return isFilled(v[b[0]]); }).map(function (b) {
          return (bl.length > 1 ? b[1] + ': ' : '') + v[b[0]].trim();
        }).join('\n\n');
      case 'file':
        return (files[f.id] || []).map(function (x) { return x.name + ' (' + fmtSize(x.size) + ')'; }).join('\n');
      case 'date':
        return new Date(v + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
      default: return String(v).trim();
    }
  }

  function collect() {
    var out = { answers: {}, display: {}, labels: {} };
    SCHEMA.forEach(function (s) {
      s.fields.forEach(function (f) {
        if (f.type === 'info' || !visible(f)) return;
        var v = answers[f.id];
        if (!isFilled(v)) return;
        out.answers[f.id] = v;
        if (answers[f.id + '__other']) out.answers[f.id + '__other'] = answers[f.id + '__other'];
        if (f.defaultAll) out.answers[f.id + '__touched'] = !!answers[f.id + '__touched'];
        out.display[f.id] = display(f);
        var lab = { label: f.label, section: s.title };
        if (f.options || f.optionsFrom) { lab.options = {}; optionsOf(f).forEach(function (o) { lab.options[o.v] = o.l; }); }
        if (f.type === 'styleboard') {
          lab.rows = {}; (window.BRIEF_STYLES || []).forEach(function (sty) { lab.rows[sty.id] = sty.title; });
          lab.cols = { yes: 'Нравится', no: 'Не моё' };
        }
        if (f.type === 'matrix') {
          lab.rows = {}; rowsOf(f).forEach(function (o) { lab.rows[o.v] = o.l; });
          lab.cols = {}; colsOf(f).forEach(function (o) { lab.cols[o.v] = o.l; });
        }
        out.labels[f.id] = lab;
      });
    });
    out.brands = brandList();
    return out;
  }

  function reportBody(c) {
    var parts = [];
    SCHEMA.forEach(function (s, i) {
      var rows = s.fields.filter(function (f) { return c.display[f.id]; });
      if (!rows.length) return;
      parts.push('<h2 style="font:600 18px/1.3 Arial,sans-serif;color:#1d1d1f;margin:28px 0 10px;border-bottom:2px solid #e8e8ed;padding-bottom:6px">' + (i + 1) + '. ' + esc(s.title) + '</h2>');
      rows.forEach(function (f) {
        parts.push('<div style="margin:0 0 14px"><div style="font:13px/1.4 Arial,sans-serif;color:#6e6e73;margin-bottom:3px">' + esc(f.label) + '</div>' +
          '<div style="font:15px/1.5 Arial,sans-serif;color:#1d1d1f;white-space:pre-wrap">' + esc(c.display[f.id]) + '</div></div>');
      });
    });
    return parts.join('\n');
  }
  function reportDoc(c) {
    var d = c.display;
    var title = d.b_name || d.c_name || 'без названия';
    return '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>Бриф — ' + esc(title) + '</title></head><body style="margin:0;background:#f5f5f7">' +
      '<div style="max-width:760px;margin:0 auto;padding:32px 20px;background:#fff">' +
      '<p style="font:13px Arial,sans-serif;color:#6e6e73;margin:0">Бриф на сайт · ' + new Date().toLocaleString('ru-RU') + (tag ? ' · ' + esc(tag) : '') + '</p>' +
      '<h1 style="font:700 26px/1.2 Arial,sans-serif;color:#1d1d1f;margin:6px 0 4px">' + esc(title) + '</h1>' +
      '<p style="font:15px Arial,sans-serif;color:#1d1d1f;margin:0 0 8px">' + [d.c_name, d.c_role, d.c_phone, d.c_messenger].filter(Boolean).map(esc).join(' · ') + '</p>' +
      reportBody(c) + '</div></body></html>';
  }
  function summaryOf(c) {
    var d = c.display;
    return {
      name: d.c_name || '', role: d.c_role || '', phone: d.c_phone || '', messenger: d.c_messenger || '', email: d.c_email || '',
      company: d.b_name || '', sphere: d.b_sphere || '', brands: c.brands.length > 1 ? c.brands.map(function (b) { return b[1]; }).join(', ') : '',
      main: d.g_main || '', type: d.s_type || '', orders: d.o_need || '', booking: d.bk_need || '',
      budget: d.g_budget || '', deadline: d.g_deadline || '', tag: tag,
      filesCount: Object.keys(files).reduce(function (n, k) { return n + files[k].length; }, 0)
    };
  }

  /* ───────── validation ───────── */
  function setError(id, msg) {
    var el = document.getElementById('q-' + id);
    if (!el) return;
    el.classList.add('has-error');
    el.querySelector('.q-error').textContent = msg;
  }
  function clearError(id) {
    var el = document.getElementById('q-' + id);
    if (el && el.classList.contains('has-error')) {
      el.classList.remove('has-error');
      el.querySelector('.q-error').textContent = '';
    }
  }
  function fieldError(f) {
    var v = answers[f.id];
    if (f.required && !isFilled(v)) return 'Заполните, пожалуйста';
    if (f.type === 'email' && isFilled(v) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Похоже, в почте опечатка';
    if (f.type === 'tel' && isFilled(v) && v.replace(/\D/g, '').length < 7) return 'Проверьте номер';
    return '';
  }
  function validateSection(s) {
    var first = null;
    s.fields.forEach(function (f) {
      if (!visible(f)) return;
      var msg = fieldError(f);
      if (msg) { setError(f.id, msg); if (!first) first = f.id; }
    });
    return first;
  }
  function focusField(id) {
    var el = document.getElementById('q-' + id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    var inp = el.querySelector('input,textarea');
    if (inp) setTimeout(function () { inp.focus({ preventScroll: true }); }, 350);
  }
  function validate() {
    var first = null;
    SCHEMA.forEach(function (s) {
      if (!cond(s.showIf)) return;
      var bad = validateSection(s);
      if (bad && !first) first = bad;
    });
    var consent = document.getElementById('consent');
    document.getElementById('consent-wrap').classList.toggle('has-error', !consent.checked);
    if (!consent.checked && !first) first = 'consent';
    return first;
  }

  /* ───────── submit ───────── */
  var statusBox = document.getElementById('submit-status');
  var submitBtn = document.getElementById('submit-btn');

  function endpoint() {
    var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    var q = new URLSearchParams(location.search).get('endpoint');
    return (local && q) ? q : (CFG.endpoint || '');
  }
  function readB64(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result).split(',')[1] || ''); };
      r.onerror = function () { reject(r.error); };
      r.readAsDataURL(file);
    });
  }
  function showStatus(kind, html) {
    statusBox.hidden = false;
    statusBox.className = 'status status-' + kind;
    statusBox.innerHTML = html;
  }
  function download(c) {
    var blob = new Blob([reportDoc(c)], { type: 'text/html;charset=utf-8' });
    var a = h('a', { href: URL.createObjectURL(blob), download: 'brif-na-sajt.html' });
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function offerDownload(c, prefix) {
    showStatus('error', prefix + ' Ответы не потерялись: попробуйте ещё раз или <button type="button" class="link-btn" id="dl-now">скачайте их файлом</button> и пришлите в <a href="' + esc(DEV.telegram) + '" target="_blank" rel="noopener">Telegram</a>');
    document.getElementById('dl-now').onclick = function () { download(c); };
  }

  async function submit(e) {
    e.preventDefault();
    var bad = validate();
    if (bad === 'consent') {
      document.getElementById('consent-wrap').scrollIntoView({ behavior: 'smooth', block: 'center' });
      showStatus('error', 'Поставьте галочку согласия — и можно отправлять');
      return;
    }
    if (bad) {
      go(fieldIndex[bad].section.id, { force: true, instant: true });
      focusField(bad);
      return;
    }
    var c;
    try {
      c = collect();
    } catch (err) {
      showStatus('error', 'Что-то пошло не так при сборке ответов (' + esc(err.message) + '). Напишите мне в <a href="' + esc(DEV.telegram) + '" target="_blank" rel="noopener">Telegram</a> — разберёмся, ответы сохранены в этом браузере');
      return;
    }
    var url = endpoint();
    if (!url) { offerDownload(c, 'Отправка ещё не подключена.'); return; }
    submitBtn.disabled = true;
    var totalSize = totalFiles();
    showStatus('info', totalSize > 2 * 1024 * 1024 ? 'Отправляем ответы и файлы (' + fmtSize(totalSize) + ') — это может занять минуту…' : 'Отправляем…');
    try {
      var list = [];
      for (var k in files) {
        for (var i = 0; i < files[k].length; i++) {
          var file = files[k][i];
          list.push({ field: k, fieldLabel: fieldIndex[k].label, name: file.name, type: file.type || 'application/octet-stream', size: file.size, data: await readB64(file) });
        }
      }
      var payload = {
        v: 2,
        hp: (form.querySelector('.hp') || {}).value || '',
        key: CFG.formKey || '',
        meta: { submittedAt: new Date().toISOString(), page: location.href, ua: navigator.userAgent, secondsSpent: Math.round((Date.now() - startedAt) / 1000), labels: c.labels, brands: c.brands, tag: tag },
        summary: summaryOf(c),
        answers: c.answers,
        display: c.display,
        reportHtml: reportDoc(c),
        reportBody: reportBody(c),
        files: list
      };
      var ctrl = new AbortController();
      var timer = setTimeout(function () { ctrl.abort(); }, 240000);
      var res = await fetch(url, { method: 'POST', body: JSON.stringify(payload), signal: ctrl.signal, redirect: 'follow' });
      clearTimeout(timer);
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok || !data.ok) throw new Error(data.error || ('HTTP ' + res.status));
      sent = true;
      clearDraft();
      done(c);
    } catch (err) {
      submitBtn.disabled = false;
      offerDownload(c, 'Не получилось отправить' + (err && err.name === 'AbortError' ? ' — слишком долго.' : ' (' + esc(err.message || err) + ').'));
    }
  }

  function done(c) {
    document.body.classList.add('is-done');
    var main = document.getElementById('main');
    main.innerHTML = '';
    main.appendChild(h('section', { class: 'thanks', tabindex: '-1', id: 'thanks' }, [
      h('div', { class: 'thanks-mark', 'aria-hidden': 'true' }, ['✓']),
      h('h2', {}, ['Спасибо, бриф у меня']),
      h('p', {}, ['Изучу ответы и вернусь с предложением: структура сайта, варианты и сроки. Если что-то вспомните — просто напишите в Telegram']),
      h('div', { class: 'thanks-actions' }, [
        h('button', { type: 'button', class: 'btn btn-ghost', onclick: function () { download(c); } }, ['Скачать копию ответов']),
        DEV.telegram ? h('a', { class: 'btn', href: DEV.telegram, target: '_blank', rel: 'noopener' }, ['Написать в Telegram']) : null
      ])
    ]));
    window.scrollTo({ top: 0 });
    document.getElementById('thanks').focus();
  }

  /* ───────── wiring ───────── */
  navSelect.addEventListener('change', function () { go(navSelect.value, { force: true }); });
  document.getElementById('reset-btn').addEventListener('click', function () {
    if (!confirm('Стереть все ответы и начать заново?')) return;
    answers = {}; files = {}; cur = 'contacts';
    clearDraft();
    draftNote.textContent = '';
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.getElementById('consent').addEventListener('change', function (e) {
    if (e.target.checked) document.getElementById('consent-wrap').classList.remove('has-error');
  });
  form.addEventListener('submit', submit);
  form.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'submit') e.preventDefault();
  });
  window.addEventListener('beforeunload', function (e) {
    if (!sent && totalFiles() > 0) { e.preventDefault(); e.returnValue = ''; }
  });

  document.querySelectorAll('[data-typo]').forEach(typoTree);
  document.querySelectorAll('a[href^="http"]').forEach(function (a) { a.target = '_blank'; a.rel = 'noopener'; });
  // тема: светлая по умолчанию, выбор запоминаем
  var themeBtn = document.getElementById('theme-toggle');
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    var meta = document.getElementById('meta-theme');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#000000' : '#fbfbfd');
    if (themeBtn) { themeBtn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false'); themeBtn.setAttribute('aria-label', t === 'dark' ? 'Светлая тема' : 'Тёмная тема'); }
  }
  applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(t);
    try { localStorage.setItem('site-brief-theme', t); } catch (e) { /* без запоминания */ }
  });
  var startBtn = document.getElementById('start-btn');
  if (startBtn) startBtn.addEventListener('click', function (e) {
    e.preventDefault();
    go(cur, { force: true });
    setTimeout(function () {
      var first = document.querySelector('#sec-' + cur + ' input:not([type=hidden]), #sec-' + cur + ' textarea');
      if (first) first.focus({ preventScroll: true });
    }, 450);
  });
  var proc = document.getElementById('process');
  if (proc) {
    if ('IntersectionObserver' in window) {
      var pio = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { proc.classList.add('in-view'); pio.disconnect(); }
      }, { threshold: 0.3 });
      pio.observe(proc);
    } else proc.classList.add('in-view');
  }
  loadDraft();
  var presetSphere = new URLSearchParams(location.search).get('sphere');
  if (presetSphere && !answers.b_sphere && fieldIndex.b_sphere.options.some(function (o) { return o[0] === presetSphere; })) answers.b_sphere = presetSphere;
  if (window.BriefPreview) {
    BriefPreview.mount(document.getElementById('pv-side-mount'));
    var pvBtn = document.getElementById('pv-open');
    if (pvBtn) {
      pvBtn.addEventListener('click', openPreview);
      BriefPreview.onChange(function () { pvBtn.classList.remove('bump'); void pvBtn.offsetWidth; pvBtn.classList.add('bump'); });
    }
  }
  renderWorks();
  render();
})();
