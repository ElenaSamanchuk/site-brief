/* Живой макет сайта клиента: собирается из ответов брифа — название, сфера, формат, функции, стиль, цвета */
(function () {
  'use strict';

  var ICONS = {
    food: '<path d="M4 3v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3 M6 12v9 M17 3c-2 0-3 2.5-3 6 0 2 1 3 3 3v9"/>',
    beauty: '<path d="M12 3l1.8 4.6L18.5 9l-4.7 1.6L12 15l-1.8-4.4L5.5 9l4.7-1.4z M18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
    health: '<path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z M9.5 12h5 M12 9.5v5"/>',
    edu: '<path d="M3 8l9-4 9 4-9 4z M7 10v5c0 1.5 2.2 3 5 3s5-1.5 5-3v-5 M21 8v6"/>',
    services: '<path d="M14.7 6.3a4 4 0 0 0-5 5L4 17v3h3l5.7-5.7a4 4 0 0 0 5-5l-2.4 2.4-2.6-.6-.6-2.6z"/>',
    shop: '<path d="M5 8h14l-1 12H6z M9 8V6a3 3 0 0 1 6 0v2"/>',
    tourism: '<path d="M3 20l6-9 4 6 3-4 5 7z M16 6.5a2 2 0 1 0 0 .01"/>',
    expert: '<path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.8z"/>',
    other: '<path d="M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l2.5 2.5 M15.5 15.5L18 18 M6 18l2.5-2.5 M15.5 8.5L18 6"/>',
    cart: '<path d="M4 5h2l2 10h9l2-7H7 M9 19.5h.01 M16 19.5h.01"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>'
  };

  var SPHERES = {
    food: { label: 'Кафе и ресторан', accent: '#e8743b', hero: ['#ffd9a8', '#e8664f'], tagline: 'Вкусно, как дома — ждём вас каждый день', cta: 'Забронировать стол', catalog: 'Меню', items: ['Завтраки', 'Горячее', 'Десерты'], prices: ['от 8 BYN', 'от 14 BYN', 'от 6 BYN'], quote: '«Очень вкусно и уютно, вернёмся ещё»', daily: [['Суп дня', '4,5 BYN'], ['Бизнес-ланч', '12 BYN'], ['Десерт дня', '5 BYN']], jobs: ['Повар', 'Официант', 'Бариста'] },
    beauty: { label: 'Салон красоты', accent: '#d9468f', hero: ['#ffd6e7', '#d9468f'], tagline: 'Красота без очередей — запись онлайн', cta: 'Записаться', catalog: 'Услуги', items: ['Стрижка', 'Окрашивание', 'Маникюр'], prices: ['от 30 BYN', 'от 90 BYN', 'от 35 BYN'], quote: '«Лучший мастер в городе!»', jobs: ['Мастер', 'Администратор'] },
    health: { label: 'Медицина и спорт', accent: '#0ea5a4', hero: ['#ccfbf1', '#0ea5a4'], tagline: 'Заботимся о здоровье всей семьи', cta: 'Записаться на приём', catalog: 'Услуги', items: ['Консультация', 'Диагностика', 'Процедуры'], prices: ['от 40 BYN', 'от 55 BYN', 'от 25 BYN'], quote: '«Внимательные врачи, без очередей»', jobs: ['Врач', 'Администратор'] },
    edu: { label: 'Обучение', accent: '#4f46e5', hero: ['#e0e7ff', '#4f46e5'], tagline: 'Учитесь с удовольствием и результатом', cta: 'Записаться на курс', catalog: 'Курсы', items: ['Для начинающих', 'Продвинутый', 'Индивидуально'], prices: ['от 120 BYN', 'от 180 BYN', 'от 40 BYN'], quote: '«Понятно, интересно и с результатом»', jobs: ['Преподаватель', 'Куратор'] },
    services: { label: 'Услуги', accent: '#0f766e', hero: ['#d1fae5', '#0f766e'], tagline: 'Делаем качественно и в срок', cta: 'Рассчитать стоимость', catalog: 'Услуги', items: ['Консультация', 'Под ключ', 'Гарантия'], prices: ['бесплатно', 'от 500 BYN', '2 года'], quote: '«Всё сделали быстро и аккуратно»', jobs: ['Мастер', 'Менеджер'] },
    shop: { label: 'Магазин', accent: '#2563eb', hero: ['#dbeafe', '#2563eb'], tagline: 'Выбирайте онлайн — доставим быстро', cta: 'В каталог', catalog: 'Каталог', items: ['Новинки', 'Хиты', 'Скидки'], prices: ['49 BYN', '29 BYN', '−20%'], quote: '«Быстрая доставка, всё как на фото»', jobs: ['Продавец', 'Кладовщик'] },
    tourism: { label: 'Отдых', accent: '#0284c7', hero: ['#e0f2fe', '#0284c7'], tagline: 'Отдых, который хочется повторить', cta: 'Забронировать', catalog: 'Номера и программы', items: ['Стандарт', 'Люкс', 'Семейный'], prices: ['от 120 BYN', 'от 220 BYN', 'от 180 BYN'], quote: '«Красиво, тихо и очень вкусно»', jobs: ['Администратор', 'Аниматор'] },
    expert: { label: 'Эксперт', accent: '#7c3aed', hero: ['#ede9fe', '#7c3aed'], tagline: 'Помогу прийти к результату быстрее', cta: 'Записаться на консультацию', catalog: 'Форматы работы', items: ['Консультация', 'Сопровождение', 'Курс'], prices: ['от 60 BYN', 'от 300 BYN', 'от 150 BYN'], quote: '«Результат превзошёл ожидания»', jobs: ['Ассистент'] },
    other: { label: 'Ваш бизнес', accent: '#0071e3', hero: ['#dbeafe', '#0071e3'], tagline: 'Коротко и ясно о главном для клиента', cta: 'Оставить заявку', catalog: 'Услуги', items: ['Услуга', 'Товар', 'Пакет'], prices: ['от 20 BYN', 'от 50 BYN', 'от 90 BYN'], quote: '«Рекомендую — всё чётко»', jobs: ['Менеджер'] }
  };

  var THEMES = {
    light: { label: 'Светлый', bg: '#ffffff', surface: '#f5f5f7', ink: '#1d1d1f', muted: '#6e6e73', line: 'rgba(0,0,0,.08)' },
    minimal: { label: 'Минимализм', bg: '#ffffff', surface: '#f3f3f3', ink: '#111111', muted: '#7a7a7a', line: 'rgba(0,0,0,.08)', accent: '#111111' },
    warm: { label: 'Тёплый', bg: '#f7efe6', surface: '#efe2d3', ink: '#3b2a22', muted: '#8a7466', line: 'rgba(59,42,34,.1)', accent: '#c96f55' },
    dark: { label: 'Тёмный премиум', bg: '#0d0d0d', surface: '#1b1b1b', ink: '#f3ede2', muted: '#a39e93', line: 'rgba(255,255,255,.1)', accent: '#c9a45c' },
    bright: { label: 'Яркий', bg: '#4b23c8', surface: '#5d36dd', ink: '#ffffff', muted: '#d7ccff', line: 'rgba(255,255,255,.14)', accent: '#ffd400' },
    natural: { label: 'Природный', bg: '#eef0e8', surface: '#e2e6d8', ink: '#2f3325', muted: '#6f7361', line: 'rgba(47,51,37,.1)', accent: '#6b7f4e' },
    photo: { label: 'Фото', bg: '#ffffff', surface: '#f4f4f5', ink: '#18181b', muted: '#71717a', line: 'rgba(0,0,0,.08)' },
    business: { label: 'Деловой', bg: '#f5f8ff', surface: '#e8eefb', ink: '#0f172a', muted: '#64748b', line: 'rgba(15,23,42,.08)', accent: '#2563eb' },
    folk: { label: 'Народный', bg: '#fffaf3', surface: '#f6ebdc', ink: '#3a1f16', muted: '#7d5b4c', line: 'rgba(58,31,22,.1)', accent: '#b3261e' },
    playful: { label: 'Игривый', bg: '#fff5fb', surface: '#f3e8ff', ink: '#2b1b3d', muted: '#7c6a93', line: 'rgba(43,27,61,.1)', accent: '#ec4899' },
    editorial: { label: 'Журнальный', bg: '#ffffff', surface: '#f3f3f3', ink: '#111111', muted: '#666666', line: 'rgba(0,0,0,.1)', accent: '#e03131' }
  };


  var COLORS = [
    [/бордо/i, '#9b1c31'], [/красн/i, '#e03131'], [/оранж/i, '#f08c00'], [/терракот/i, '#c8553d'], [/ж[её]лт/i, '#f2b705'], [/золот/i, '#c9a227'],
    [/олив/i, '#6b7f4e'], [/салат/i, '#74b816'], [/бирюз/i, '#12b886'], [/з[её]л[её]н/i, '#2f9e44'], [/голуб/i, '#3bc9db'], [/василь/i, '#4c6ef5'],
    [/сине|синий|синего|синим|син/i, '#1c7ed6'], [/фиолет/i, '#7048e8'], [/сирен|лаванд/i, '#9775fa'], [/розов|фукси/i, '#e64980'],
    [/бежев|песочн/i, '#c8a97e'], [/коричн|шоколад/i, '#8d5b3a'], [/ч[её]рн/i, '#111111'], [/сер/i, '#868e96']
  ];

  var PAGE_SHORT = { about: 'О нас', services: 'Услуги', catalog: 'Каталог', menu: 'Меню', prices: 'Цены', booking: 'Запись', delivery: 'Доставка', events: 'События', portfolio: 'Работы', team: 'Команда', reviews: 'Отзывы', faq: 'Вопросы', promo: 'Акции', blog: 'Блог', points: 'Адреса', jobs: 'Вакансии', certs: 'Сертификаты', partners: 'Партнёрам', contacts: 'Контакты' };
  var TYPE_LABEL = { landing: 'Лендинг', multi: 'Многостраничный', catalog: 'Каталог', shop: 'Магазин', taplink: 'Мини-сайт', advise: 'Подберу' };

  var mounts = [];
  var lastSig = '';
  var lastKeys = {};
  var lastName = '';
  var onChange = null;

  function el(tag, cls, kids, attrs) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (k) {
      if (k == null || k === false) return;
      n.appendChild(typeof k === 'string' ? document.createTextNode(k) : k);
    });
    return n;
  }
  function svg(name, cls) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    if (cls) s.setAttribute('class', cls);
    s.innerHTML = ICONS[name] || ICONS.other;
    return s;
  }
  function arr(v) { return Array.isArray(v) ? v : (v ? [v] : []); }
  function lum(hex) {
    var m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
    if (!m) return 0.5;
    var c = [m[1], m[2], m[3]].map(function (x) { x = parseInt(x, 16) / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function mix(hex, to, p) {
    var a = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex), b = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(to);
    if (!a || !b) return hex;
    var r = [1, 2, 3].map(function (i) { return Math.round(parseInt(a[i], 16) * (1 - p) + parseInt(b[i], 16) * p).toString(16).padStart(2, '0'); });
    return '#' + r.join('');
  }
  function translit(s) {
    var map = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', і: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ў: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
    return String(s || '').toLowerCase().replace(/ооо|оао|ип|чуп|«|»|"|'/g, '').split('').map(function (ch) { return map[ch] !== undefined ? map[ch] : ch; }).join('')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24) || 'vash-sajt';
  }
  function colorsFrom(text) {
    var found = [];
    String(text || '').split(/[\s,;\/+]+/).forEach(function (part) {
      for (var i = 0; i < COLORS.length; i++) if (COLORS[i][0].test(part)) { if (found.indexOf(COLORS[i][1]) < 0) found.push(COLORS[i][1]); break; }
    });
    return found;
  }

  /* ── что показать ── */
  function model(a, brands) {
    var sphereKey = a.b_sphere && SPHERES[a.b_sphere] ? a.b_sphere : 'other';
    var S = SPHERES[sphereKey];
    var food = sphereKey === 'food';
    var ds = a.d_style || {};
    if (Array.isArray(ds)) { var tmp = {}; ds.forEach(function (k) { tmp[k] = 'yes'; }); ds = tmp; }
    var order = (window.BRIEF_STYLES || []).map(function (x) { return x.id; });
    var style = order.filter(function (k) { return ds[k] === 'yes' && THEMES[k]; })[0] || 'light';
    var T = THEMES[style];
    var own = colorsFrom(a.ct_colors);
    var accent = own[0] && own[0] !== '#111111' ? own[0] : (T.accent || S.accent);
    var accent2 = own[1] || mix(accent, '#ffffff', 0.55);
    var names = brands.map(function (b) { return b[1]; });
    var name = (brands.length > 1 ? (a.b_name || '').trim() || names[0] : names[0]) || 'Ваш проект';
    if (name === 'Ваш проект' && a.b_name) name = a.b_name;
    var base = arr(a.f_base), fm = a.f_matrix || {}, goals = arr(a.g_goals);
    function want(k) { return fm[k] === 'now' || fm[k] === 'later'; }
    function b(k) { return base.indexOf(k) >= 0; }
    var type = a.s_type && a.s_type !== 'advise' ? a.s_type : '';
    var sells = type === 'catalog' || type === 'shop' || a.o_need === 'full' || a.o_need === 'cart' || b('cart');
    var main = a.g_main || '';
    var ctaBy = {
      leads: 'Оставить заявку', sell: 'Заказать', catalog: food ? 'Смотреть меню' : 'Смотреть каталог', booking: food ? 'Забронировать стол' : 'Записаться',
      points: 'Как добраться', banquets: 'Заказать банкет', brand: 'Узнать больше', portfolio: 'Смотреть работы', hr: 'Вакансии', promo: 'Все акции', blog: 'Читать'
    };
    var offer = (a.g_offer || '').trim() || String(a.b_about || '').split(/[.!?\n]/)[0].trim() || S.tagline;
    if (offer.length > 80) offer = offer.slice(0, 78).replace(/\s+\S*$/, '') + '…';

    var blocks = [];
    function add(key, when) { if (when && blocks.indexOf(key) < 0) blocks.push(key); }
    var mainMap = { catalog: 'catalog', sell: 'catalog', booking: 'booking', banquets: 'banquets', points: 'map', hr: 'jobs', promo: 'promo', portfolio: 'gallery' };
    add(mainMap[main], !!mainMap[main]);
    add('catalog', b('menu') || b('services') || b('courses') || b('rooms') || b('catalog') || goals.indexOf('catalog') >= 0 || sells || a.m_format === 'page' || a.m_format === 'catalog');
    add('daily', want('daily') || a.m_updates === 'daily' || arr(a.m_special).indexOf('daily') >= 0);
    add('booking', b('booking_req') || ['form', 'slots', 'service'].indexOf(a.bk_need) >= 0 || goals.indexOf('booking') >= 0);
    add('banquets', b('banquet_req') || arr(a.e_where).some(function (x) { return x === 'hall' || x === 'outside'; }) || goals.indexOf('banquets') >= 0);
    add('promo', want('promo') || goals.indexOf('promo') >= 0);
    add('quiz', want('quiz') || want('calc'));
    add('map', b('points') || b('map') || b('hours') || b('location') || ['2-3', '4-10', '10+'].indexOf(a.b_points) >= 0 || goals.indexOf('points') >= 0);
    add('delivery', b('delivery_links') || a.o_need === 'links' || arr(a.fd_aggregators).filter(function (x) { return x !== 'none'; }).length > 0 || want('delivery_zones'));
    add('team', b('masters') || b('specialists') || b('teachers'));
    add('gallery', b('gallery') || b('portfolio') || b('cases') || goals.indexOf('portfolio') >= 0);
    add('reviews', b('reviews') || want('reviews_collect'));
    add('certs', want('certs'));
    add('b2b', want('b2b'));
    add('jobs', goals.indexOf('hr') >= 0 || want('jobs'));

    var nav = [];
    var sp = a.s_pages || {};
    Object.keys(sp).forEach(function (row) { if (arr(sp[row]).length && PAGE_SHORT[row] && nav.indexOf(PAGE_SHORT[row]) < 0) nav.push(PAGE_SHORT[row]); });
    if (!nav.length) {
      var byBlock = { catalog: S.catalog.split(' ')[0], booking: food ? 'Бронь' : 'Запись', banquets: 'Банкеты', map: 'Адреса', gallery: 'Фото', reviews: 'Отзывы', jobs: 'Вакансии', promo: 'Акции' };
      blocks.forEach(function (k) { if (byBlock[k] && nav.indexOf(byBlock[k]) < 0) nav.push(byBlock[k]); });
      nav.push('Контакты');
    }
    var domain = (a.l_domain_name || '').trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '') || translit(name) + '.by';

    var fmNow = Object.keys(fm).filter(function (k) { return fm[k] === 'now'; }).length;
    var fmLater = Object.keys(fm).filter(function (k) { return fm[k] === 'later'; }).length;
    var pages = 0;
    Object.keys(sp).forEach(function (row) { pages += arr(sp[row]).length; });

    return {
      sphereKey: sphereKey, S: S, food: food, style: style, T: T, accent: accent, accent2: accent2,
      on: lum(accent) > 0.45 ? '#141414' : '#ffffff', name: name, brands: names, offer: offer,
      cta: ctaBy[main] || (a.bk_need === 'slots' || a.bk_need === 'form' ? (food ? 'Забронировать стол' : 'Записаться') : S.cta),
      type: a.s_type || '', sells: sells, blocks: blocks, nav: nav.slice(0, 3), domain: domain,
      chat: want('chat') || want('tgbot'), points: { '1': 1, '2-3': 3, '4-10': 6, '10+': 8 }[a.b_points] || 1,
      aggregators: arr(a.fd_aggregators), eventTypes: arr(a.e_types), calc: a.e_calc === 'yes' || want('calc'),
      stats: { type: TYPE_LABEL[a.s_type] || 'Подберу', pages: pages || nav.length + 1, now: base.length + fmNow, later: fmLater, style: T.label, sections: blocks.length + 2 }
    };
  }

  /* ── отрисовка блоков ── */
  function block(key, m) {
    var S = m.S;
    switch (key) {
      case 'catalog':
        return el('div', 'pv-block', [
          el('h5', '', [S.catalog, m.sells ? el('em', '', ['В корзину']) : null]),
          el('div', 'pv-grid', S.items.map(function (t, i) {
            return el('div', 'pv-card', [el('s'), el('i'), el('b', '', [S.prices[i] || ''])]);
          }))
        ]);
      case 'daily':
        return el('div', 'pv-block', [
          el('h5', '', [m.food ? 'Меню дня' : 'Предложение дня', el('em', '', ['сегодня'])]),
          el('div', 'pv-lines', (S.daily || [['Позиция дня', '—'], ['Спецпредложение', '—']]).map(function (r) { return el('i', '', [el('span', '', [r[0]]), el('span', '', [r[1]])]); }))
        ]);
      case 'booking':
        return el('div', 'pv-block', [
          el('h5', '', [m.food ? 'Бронь столика' : 'Онлайн-запись', el('em', '', ['онлайн'])]),
          el('div', 'pv-slots', ['12:00', '14:30', '18:00', '19:30'].map(function (t, i) { return el('span', i === 2 ? 'on' : '', [t]); }))
        ]);
      case 'banquets':
        var ev = (m.eventTypes.length ? m.eventTypes : ['Дни рождения', 'Корпоративы', 'Свадьбы']).slice(0, 3);
        return el('div', 'pv-block', [
          el('h5', '', [m.food ? 'Банкеты и праздники' : 'Мероприятия', m.calc ? el('em', '', ['калькулятор']) : null]),
          el('div', 'pv-row', ev.map(function (t) { return el('span', 'pv-chip', [t]); })),
          m.calc ? el('div', 'pv-progress', [el('i')]) : null
        ]);
      case 'map':
        var pins = [];
        var spots = [[18, 30], [62, 22], [40, 60], [78, 58], [28, 72], [86, 32], [50, 38], [10, 55]];
        for (var i = 0; i < Math.min(m.points, spots.length); i++) {
          pins.push(el('span', 'pv-pin', [], { style: 'left:' + spots[i][0] + '%;top:' + spots[i][1] + '%;animation-delay:' + (i * 0.3) + 's' }));
        }
        return el('div', 'pv-block', [
          el('h5', '', [m.points > 1 ? 'Наши адреса · ' + (m.points >= 8 ? '8+' : m.points) : 'Как нас найти']),
          el('div', 'pv-map', pins.concat([el('span', 'pv-open-now', ['● Открыто сейчас'])]))
        ]);
      case 'delivery':
        var ag = m.aggregators.filter(function (x) { return x !== 'none' && x !== '__other'; });
        var agName = { yandex: 'Яндекс Еда', delivio: 'Delivio', justeat: 'just-eat', own: 'Своя доставка' };
        var chips = ag.length ? ag.map(function (x) { return agName[x] || x; }) : ['Доставка', 'Самовывоз'];
        return el('div', 'pv-block', [el('h5', '', ['Доставка']), el('div', 'pv-row', chips.slice(0, 3).map(function (t, i) { return el('span', 'pv-chip' + (i === 0 ? ' on' : ''), [t]); }))]);
      case 'promo':
        return el('div', 'pv-block', [el('h5', '', ['Акция недели', el('em', '', ['−15%'])]), el('div', 'pv-timer', [el('span', '', ['02']), el('span', '', ['14']), el('span', '', ['37'])])]);
      case 'quiz':
        return el('div', 'pv-block', [el('h5', '', [m.food ? 'Подберём банкет за минуту' : 'Подберём за минуту']), el('div', 'pv-progress', [el('i')])]);
      case 'team':
        return el('div', 'pv-block', [el('h5', '', [m.sphereKey === 'edu' ? 'Преподаватели' : m.sphereKey === 'health' ? 'Специалисты' : 'Команда']), el('div', 'pv-avatars', [el('span'), el('span'), el('span'), el('span')])]);
      case 'gallery':
        return el('div', 'pv-block', [el('h5', '', [m.food ? 'Атмосфера' : 'Наши работы']), el('div', 'pv-grid', [el('div', 'pv-card', [el('s')]), el('div', 'pv-card', [el('s')]), el('div', 'pv-card', [el('s')])])]);
      case 'reviews':
        return el('div', 'pv-block', [el('h5', '', ['Отзывы', el('span', 'pv-stars', ['★★★★★'])]), el('div', 'pv-quote', [S.quote])]);
      case 'certs':
        return el('div', 'pv-block', [el('h5', '', ['Подарочный сертификат', el('em', '', ['онлайн'])]), el('div', 'pv-row', [el('span', 'pv-chip on', ['50 BYN']), el('span', 'pv-chip', ['100 BYN']), el('span', 'pv-chip', ['Свой номинал'])])]);
      case 'b2b':
        return el('div', 'pv-block', [el('h5', '', ['Для организаций']), el('div', 'pv-row', [el('span', 'pv-chip', [m.food ? 'Обеды в офис' : 'Опт']), el('span', 'pv-chip', ['Договор и счёт'])])]);
      case 'jobs':
        return el('div', 'pv-block', [el('h5', '', ['Мы нанимаем', el('em', '', ['откликнуться'])]), el('div', 'pv-row', (S.jobs || ['Специалист']).slice(0, 3).map(function (t) { return el('span', 'pv-chip', [t]); }))]);
    }
    return null;
  }

  function site(m) {
    var screen = el('div', 'pv-screen');
    var scroll = el('div', 'pv-scroll');
    var logo = el('span', 'pv-logo', [el('b', '', [m.name.replace(/[«»"']/g, '').trim().charAt(0).toUpperCase() || '•']), el('span', '', [m.name])]);
    if (lastName && lastName !== m.name) logo.classList.add('pv-flash');
    if (m.type === 'taplink') {
      scroll.appendChild(el('div', 'pv-hero', [el('div', '', [el('small', '', [m.S.label]), el('strong', '', [m.name]), el('p', '', [m.offer])]), el('div', 'pv-hero-img', [svg(m.sphereKey)])]));
      (m.blocks.length ? m.blocks : ['catalog', 'map']).slice(0, 5).forEach(function (k) {
        var t = { catalog: m.S.catalog, daily: 'Меню дня', booking: m.food ? 'Бронь столика' : 'Записаться', banquets: 'Банкеты', map: 'Адреса', delivery: 'Доставка', promo: 'Акции', quiz: 'Подбор', team: 'Команда', gallery: 'Фото', reviews: 'Отзывы', certs: 'Сертификаты', b2b: 'Организациям', jobs: 'Вакансии' }[k];
        scroll.appendChild(el('span', 'pv-chip on' + (lastKeys[k] ? '' : ' pv-new'), [t], { style: 'display:block;text-align:center;padding:7px' }));
      });
    } else {
      scroll.appendChild(el('div', 'pv-nav', [
        logo,
        el('span', 'pv-links', m.nav.map(function (t) { return el('span', '', [t]); })),
        m.sells ? el('span', 'pv-icon-btn', [svg('cart'), el('i', '', ['2'])]) : null
      ]));
      if (m.brands.length > 1) scroll.appendChild(el('div', 'pv-tabs', m.brands.slice(0, 4).map(function (t) { return el('span', '', [t]); })));
      scroll.appendChild(el('div', 'pv-hero', [
        el('div', '', [el('small', '', [m.S.label]), el('strong', '', [m.name]), el('p', '', [m.offer]), el('span', 'pv-cta', [m.cta])]),
        el('div', 'pv-hero-img', [svg(m.sphereKey)])
      ]));
      m.blocks.forEach(function (k) {
        var n = block(k, m);
        if (!n) return;
        if (lastSig && !lastKeys[k]) n.classList.add('pv-new');
        scroll.appendChild(n);
      });
      scroll.appendChild(el('div', 'pv-foot', [el('span', '', ['© ' + m.name]), el('span', '', [m.domain])]));
    }
    screen.appendChild(scroll);
    if (m.chat) screen.appendChild(el('span', 'pv-icon-btn', [svg('chat')], { style: 'position:absolute;right:10px;bottom:10px;width:28px;height:28px;background:' + m.accent }));
    var box = el('div', 'pv', [el('div', 'pv-bar', [el('span'), el('span'), el('span'), el('i', '', [m.domain])]), screen]);
    var T = m.T;
    var heroA = mix(m.accent, '#ffffff', 0.55), heroB = m.accent;
    box.style.cssText = '--pv-accent:' + m.accent + ';--pv-accent2:' + m.accent2 + ';--pv-on:' + m.on + ';--pv-bg:' + T.bg + ';--pv-surface:' + T.surface +
      ';--pv-ink:' + T.ink + ';--pv-muted:' + T.muted + ';--pv-line:' + T.line + ';--pv-hero:linear-gradient(135deg,' + heroA + ',' + heroB + ')';
    return box;
  }

  function stats(m) {
    var total = Math.max(1, m.stats.now + m.stats.later);
    return el('div', 'pv-info', [
      el('div', 'pv-stat', [el('b', '', [m.stats.type]), el('span', '', ['формат'])]),
      el('div', 'pv-stat', [el('b', '', [String(m.stats.sections)]), el('span', '', ['блоков на главной'])]),
      el('div', 'pv-stat wide', [
        el('b', '', [m.stats.now + ' сразу · ' + m.stats.later + ' потом']),
        el('span', '', ['функций в первом этапе и в плане развития']),
        el('div', 'pv-meter', [el('i', '', [], { style: 'flex-grow:' + m.stats.now }), el('i', '', [], { style: 'flex-grow:' + m.stats.later })], { 'aria-hidden': 'true' })
      ]),
      el('div', 'pv-stat wide', [el('b', '', [m.stats.style]), el('span', '', ['настроение дизайна — меняется от выбора стиля и фирменных цветов'])])
    ]);
  }

  function fit(mount) {
    var screen = mount.querySelector('.pv-screen'), scroll = mount.querySelector('.pv-scroll');
    if (!screen || !scroll || !screen.offsetHeight) return;
    var shift = Math.min(0, screen.clientHeight - scroll.scrollHeight - 4);
    scroll.style.setProperty('--pv-shift', shift + 'px');
    scroll.style.setProperty('--pv-dur', Math.max(10, Math.round(-shift / 14)) + 's');
    if (!shift) scroll.style.animation = 'none'; else scroll.style.animation = '';
  }

  // поворот телефона и изменение ширины — пересчитать, насколько прокручивать макет
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { mounts.forEach(function (x) { fit(x.node); }); }, 200);
  });

  window.BriefPreview = {
    mount: function (node, opts) {
      if (!node) return;
      mounts = mounts.filter(function (x) { return document.body.contains(x.node); });
      mounts.push({ node: node, opts: opts || {} });
      lastSig = '';
    },
    onChange: function (fn) { onChange = fn; },
    update: function (answers, brands) {
      var m = model(answers || {}, brands || [['b1', 'Ваш проект']]);
      var sig = JSON.stringify([m.name, m.brands, m.sphereKey, m.style, m.accent, m.offer, m.cta, m.type, m.sells, m.blocks, m.nav, m.domain, m.chat, m.points, m.aggregators, m.eventTypes, m.calc, m.stats]);
      if (sig === lastSig) return;
      var changed = !!lastSig;
      // какие блоки появились в макете от последнего ответа — для подсказки «в макете новый блок»
      var added = [];
      if (changed) m.blocks.forEach(function (k) {
        if (lastKeys[k]) return;
        var n = block(k, m), t = n && n.querySelector('h5');
        if (t && t.firstChild) added.push(String(t.firstChild.textContent || '').trim());
      });
      mounts = mounts.filter(function (x) { return document.body.contains(x.node); });
      mounts.forEach(function (x) {
        x.node.innerHTML = '';
        x.node.appendChild(site(m));
        if (!x.opts.noStats) x.node.appendChild(stats(m));
        requestAnimationFrame(function () { fit(x.node); });
      });
      lastSig = sig;
      lastKeys = {};
      m.blocks.forEach(function (k) { lastKeys[k] = true; });
      lastName = m.name;
      if (changed && onChange) onChange({ added: added.filter(Boolean) });
    },
    refit: function () { mounts.forEach(function (x) { fit(x.node); }); }
  };
})();
