/**
 * Черновик коммерческого предложения по ответам брифа.
 *
 * В документе для клиента суммы НЕ проставляются — там строки «___ BYN», их заполняете сами,
 * посмотрев бюджет. Внутренняя оценка (в Telegram и письме, клиент её не видит) считается по KP.modules.
 * Ставки — рыночные ориентиры в BYN, поправьте под себя; partnerDiscount — скидка «для своих»
 * в обмен на подпись в подвале и право показать проект в портфолио.
 */
var KP = {
  dev: {
    name: 'Елена Саманчук',
    telegram: '@ElaneDmitrievna',
    site: 'https://elenasamanchuk.github.io/elena-samanchuk/'
  },
  partnerDiscount: 0.4,
  budgets: { b300: 300, b600: 600, b1000: 1000, b2000: 2000, bmore: Infinity },
  // title — формулировка для клиента; rate — рынок, BYN (null — оценить отдельно); days — рабочие дни
  modules: {
    taplink: { title: 'Мини-сайт для соцсетей: кнопки, контакты, главное о вас', rate: 150, days: 3 },
    landing: { title: 'Одностраничный сайт: дизайн, адаптация под телефоны, форма заявки', rate: 450, days: 7 },
    landingBrand: { title: 'Ещё один бренд на странице — свой блок и характер', rate: 150, days: 2 },
    multi: { title: 'Сайт из нескольких страниц: дизайн, адаптация под телефоны, до 6 страниц', rate: 900, days: 14 },
    extraPage: { title: 'Дополнительные страницы', rate: 70, days: 1 },
    brandSection: { title: 'Раздел бренда со своим стилем', share: 0.35, days: 4 },
    brandSite: { title: 'Отдельный сайт бренда на общей основе', share: 0.6, days: 7 },
    linksPage: { title: 'Страница-мультиссылка для соцсетей', rate: 80, days: 1 },
    catalogPage: { title: 'Товары, услуги или меню с фото и ценами', rate: 250, days: 3 },
    teamPage: { title: 'Команда: мастера, специалисты или преподаватели', rate: 80, days: 1 },
    galleryPage: { title: 'Фото и работы: галерея или кейсы', rate: 80, days: 1 },
    schedule: { title: 'Расписание и старт групп', rate: 100, days: 2 },
    cart: { title: 'Корзина и оформление заказа — заказ приходит вам в Telegram', rate: 450, days: 6 },
    payment: { title: 'Онлайн-оплата картой и через ЕРИП, статусы оплаты', rate: 350, days: 5 },
    shopDocs: { title: 'Оферта, условия доставки и возврата', rate: 100, days: 1 },
    banquets: { title: 'Мероприятия и банкеты: залы, меню, форма заявки', rate: 150, days: 2 },
    bookingForm: { title: 'Заявка на запись или бронь', rate: 80, days: 1 },
    bookingService: { title: 'Подключение вашего сервиса записи', rate: 100, days: 1 },
    booking: { title: 'Онлайн-запись с выбором даты и времени', rate: 300, days: 4 },
    map: { title: 'Карта точек: «открыто сейчас», маршрут, ближайшая точка', rate: 150, days: 2 },
    daily: { title: 'Предложение или меню дня, которое вы обновляете сами', rate: 150, days: 2 },
    gsheet: { title: 'Цены из Google-таблицы — правите таблицу, сайт обновляется', rate: 250, days: 3 },
    pos_sync: { title: 'Выгрузка меню или товаров из учётной программы', rate: null, days: 5 },
    delivery_zones: { title: 'Зоны доставки на карте с разной ценой', rate: 200, days: 3 },
    b2b: { title: 'Раздел для организаций: обеды в офисы, опт, договоры', rate: 150, days: 2 },
    remind: { title: 'Напоминания клиентам о записи', rate: 150, days: 2 },
    lms: { title: 'Онлайн-обучение: доступ к урокам и заданиям', rate: null, days: 10 },
    compare: { title: 'Избранное и сравнение товаров', rate: 200, days: 3 },
    reviews_collect: { title: 'Сбор отзывов после визита или покупки', rate: 100, days: 2 },
    calc: { title: 'Калькулятор стоимости', rate: 250, days: 3 },
    banqcalc: { title: 'Калькулятор стоимости банкета', rate: 250, days: 3 },
    quiz: { title: 'Квиз: пара вопросов → расчёт или подборка → заявка', rate: 250, days: 3 },
    reviews: { title: 'Рейтинг и отзывы с Яндекс Карт', rate: 60, days: 1 },
    promo: { title: 'Акции с таймером и баннеры, которые включаете сами', rate: 120, days: 2 },
    game: { title: 'Игровая механика: колесо фортуны или карточки со скидками', rate: 250, days: 3 },
    blog: { title: 'Блог или раздел статей', rate: 200, days: 3 },
    events: { title: 'Афиша событий', rate: 150, days: 2 },
    jobs: { title: 'Вакансии с откликом и загрузкой резюме', rate: 150, days: 2 },
    certs: { title: 'Подарочные сертификаты', rate: 150, days: 2 },
    loyalty: { title: 'Бонусная программа, личный кабинет', rate: null, days: 5 },
    tgbot: { title: 'Telegram-бот: заявки, запись, уведомления клиентам', rate: 500, days: 6 },
    chat: { title: 'Кнопки мессенджеров и онлайн-чат', rate: 50, days: 1 },
    subscribe: { title: 'Сбор контактов для рассылок', rate: 80, days: 1 },
    qr: { title: 'QR-коды для точек: меню, отзывы, Wi-Fi', rate: 50, days: 1 },
    a11y: { title: 'Версия для слабовидящих', rate: 150, days: 2 },
    orderPromo: { title: 'Промокоды', rate: 100, days: 1 },
    account: { title: 'Личный кабинет клиента', rate: 400, days: 5 },
    orderStatus: { title: 'Статус заказа для клиента', rate: 200, days: 3 },
    orderRepeat: { title: 'Кнопка «повторить заказ»', rate: 60, days: 1 },
    lang: { title: 'Версия на другом языке', rate: 200, days: 3 },
    copy: { title: 'Тексты для сайта', rate: 40, days: 3 },
    copyEdit: { title: 'Редактура и доработка ваших текстов', rate: 20, days: 2 },
    styleKit: { title: 'Лёгкий фирменный стиль: цвета, шрифты, графические элементы', rate: 250, days: 3 },
    vectorize: { title: 'Перерисовка логотипа в вектор', rate: 60, days: 1 },
    seo: { title: 'Базовое SEO: заголовки, описания, карта сайта, разметка, Яндекс Вебмастер', rate: 150, days: 2 },
    analytics: { title: 'Яндекс Метрика и цели на заявки', rate: 50, days: 1 },
    privacy: { title: 'Политика обработки персональных данных и согласия в формах', rate: 50, days: 1 }
  },
  extras: {
    banners: 'Баннеры и сторис для соцсетей и рекламы',
    print: 'Печатное меню, прайс или буклет',
    qr: 'Таблички с QR-кодами',
    flyers: 'Листовки и вывески'
  },
  // что уточнить на созвоне, если клиент не ответил
  keyQuestions: {
    b_sphere: 'сфера бизнеса',
    g_goals: 'задачи сайта',
    s_type: 'формат сайта',
    o_need: 'нужны ли заказы и оплата',
    bk_need: 'запись или бронирование',
    m_updates: 'как часто меняются цены',
    ct_logo: 'логотип в векторе',
    ct_brandbook: 'фирменный стиль',
    g_budget: 'бюджет',
    g_deadline: 'сроки',
    s_pages: 'какие разделы нужны',
    f_matrix: 'какие функции сразу, какие потом',
    m_photos: 'фото',
    ct_texts: 'кто пишет тексты',
    sp_support: 'нужна ли поддержка после запуска',
    l_domain: 'домен'
  }
};

function buildProposal(data) {
  var a = data.answers || {};
  var s = data.summary || {};
  var labels = (data.meta && data.meta.labels) || {};
  var brandPairs = (data.meta && data.meta.brands && data.meta.brands.length) ? data.meta.brands : [['b1', a.b_name || 'проект']];
  var BN = {};
  brandPairs.forEach(function (b) { BN[b[0]] = b[1]; });
  var brandIds = brandPairs.map(function (b) { return b[0]; });
  var multiBrand = brandIds.length > 1;
  var M = KP.modules;
  var food = a.b_sphere === 'food';

  function arr(id) { var v = a[id]; return Array.isArray(v) ? v : (v ? [v] : []); }
  function has(id, v) { return arr(id).indexOf(v) >= 0; }
  function lab(id, v) {
    if (v === '__other' || v === '__src_other') return a[id + '__other'] || (s.main || 'другое');
    var L = labels[id];
    return (L && L.options && L.options[v]) || v;
  }
  function rowLab(id, r) { var L = labels[id]; return (L && L.rows && L.rows[r]) || r; }
  function q(n) { n = String(n || '').trim(); return /[«»"]/.test(n) ? n : '«' + n + '»'; }
  function names(list) {
    var xs = list.map(function (b) { return q(BN[b] || b); });
    return xs.length > 1 ? xs.slice(0, -1).join(', ') + ' и ' + xs[xs.length - 1] : (xs[0] || '');
  }
  function lcFirst(x) { return x ? x.charAt(0).toLowerCase() + x.slice(1) : x; }

  var projectName = (a.b_name || '').trim() || (multiBrand ? names(brandIds) : BN[brandIds[0]]);
  var budgetKey = a.g_budget || '';
  var lowBudget = budgetKey === 'b300' || budgetKey === 'b600' || a.g_priority === 'cheap';
  var manyPoints = ['2-3', '4-10', '10+'].indexOf(a.b_points) >= 0;
  // базовый набор: если клиент не открывал раздел — считаем, что нужен весь стандартный
  var baseSel = Array.isArray(a.f_base) ? a.f_base : null;
  function base_(k) { return !baseSel || baseSel.indexOf(k) >= 0; }
  function baseAny(list) { return baseSel ? list.some(function (k) { return baseSel.indexOf(k) >= 0; }) : false; }
  var notes = [];

  /* ── структура ── */
  var structure = a.s_structure || '';
  var structureAdvised = multiBrand && (!structure || structure === 'advise');
  if (!multiBrand) structure = 'single';
  else if (structureAdvised) structure = lowBudget ? 'one' : (a.d_brands_look === 'different' ? 'separate' : 'one');

  /* ── формат ── */
  var pageCells = 0, pagesByBrand = {};
  var sp = a.s_pages || {};
  Object.keys(sp).forEach(function (row) {
    (sp[row] || []).forEach(function (b) {
      pageCells++;
      (pagesByBrand[b] = pagesByBrand[b] || []).push(rowLab('s_pages', row));
    });
  });
  var type = a.s_type || '';
  var typeAdvised = !type || type === 'advise';
  if (typeAdvised) {
    if (a.o_need === 'full') type = 'shop';
    else if (a.o_need === 'cart') type = 'catalog';
    else if (pageCells >= 8 || has('g_goals', 'blog') || has('g_goals', 'hr') && has('g_goals', 'promo')) type = 'multi';
    else if (arr('g_goals').length === 1 && has('g_goals', 'links')) type = 'taplink';
    else type = 'landing';
    if (lowBudget && type === 'multi') {
      type = 'landing';
      notes.push('Бюджет небольшой — начать с одностраничника, отдельные страницы вторым этапом');
    }
  }
  var needPay = type === 'shop' || a.o_need === 'full';
  var needCart = needPay || type === 'catalog' || a.o_need === 'cart';
  if ((type === 'landing' || type === 'taplink') && needCart) notes.push('Выбрана одна страница, но нужны заказы — каталог и корзину можно поставить прямо на лендинг (блоки магазина Тильды)');

  /* ── модули ── */
  var phases = { 1: [], 2: [] };
  var added = {};
  var fm = a.f_matrix || {};
  function add(key, phase, opts) {
    opts = opts || {};
    if (added[key]) return;
    if (fm[key] === 'no') return;
    var ph = fm[key] === 'later' ? 2 : fm[key] === 'now' ? 1 : phase;
    added[key] = true;
    var m = M[key];
    phases[ph].push({ key: key, title: opts.title || m.title, qty: opts.qty || 1, rate: opts.rate !== undefined ? opts.rate : m.rate, days: opts.days || m.days });
  }

  var base = type === 'taplink' ? 'taplink' : (type === 'multi' || type === 'shop' || (type === 'catalog' && pageCells > 6)) ? 'multi' : 'landing';
  add(base, 1);
  var baseRate = M[base].rate;
  if (base === 'multi') {
    var extra = brandIds.reduce(function (sum, b) { return sum + Math.max(0, (pagesByBrand[b] || []).length - 6); }, 0);
    if (extra) add('extraPage', 1, { qty: extra, title: M.extraPage.title + ' — ' + extra });
  }
  if (multiBrand) {
    brandIds.slice(1).forEach(function (b, i) {
      var key = 'brand_' + b;
      M[key] = M[key] || {};
      var ph = structure === 'first' ? 2 : 1;
      if (structure === 'separate' || structure === 'first') {
        M[key] = { title: 'Сайт «' + BN[b].replace(/[«»"]/g, '') + '» на общей основе', rate: Math.round(baseRate * M.brandSite.share), days: M.brandSite.days };
      } else if (base === 'landing' || base === 'taplink') {
        M[key] = { title: '«' + BN[b].replace(/[«»"]/g, '') + '» на той же странице — свой блок и характер', rate: M.landingBrand.rate, days: M.landingBrand.days };
      } else {
        M[key] = { title: 'Раздел «' + BN[b].replace(/[«»"]/g, '') + '» со своим стилем', rate: Math.round(baseRate * M.brandSection.share), days: M.brandSection.days };
      }
      add(key, ph);
    });
  }
  if (has('g_goals', 'links') && base !== 'taplink') add('linksPage', 1);
  if (!needCart && (has('g_goals', 'catalog') || ['page', 'catalog'].indexOf(a.m_format) >= 0 || baseAny(['menu', 'services', 'courses', 'rooms', 'catalog']))) {
    add('catalogPage', 1, { title: food ? 'Меню с фото, категориями и ценами' : M.catalogPage.title });
  }
  if (needCart) {
    add('catalogPage', 1, { title: food ? 'Меню с фото, категориями и ценами' : M.catalogPage.title });
    add('cart', 1);
  } else if (a.o_need === 'later') add('cart', 2);
  if (needPay) { add('payment', 1); add('shopDocs', 1); }
  if (baseAny(['cart'])) { add('catalogPage', 1); add('cart', 1); }
  if (added.cart && baseAny(['delivery_info', 'returns'])) add('shopDocs', 1);
  if (baseAny(['masters', 'specialists', 'teachers'])) add('teamPage', 1);
  if (baseAny(['portfolio', 'cases', 'gallery'])) add('galleryPage', 1, food ? { title: 'Фотогалерея: зал и блюда' } : {});
  if (baseAny(['schedule'])) add('schedule', 1);
  if (has('g_goals', 'banquets') || has('e_where', 'hall') || has('e_where', 'outside') || baseAny(['banquet_req'])) add('banquets', 1, food ? {} : { title: 'Раздел мероприятий с формой заявки' });
  if (a.bk_need === 'slots') add('booking', 1);
  else if (a.bk_need === 'service') add('bookingService', 1);
  else if (a.bk_need === 'form' || baseAny(['booking_req'])) add('bookingForm', 1, { title: food ? 'Заявка на бронь столика' : M.bookingForm.title });
  if (has('g_goals', 'points') || manyPoints || baseAny(['points', 'hours'])) add('map', 1);
  if (base_('reviews') && (baseSel || has('g_goals', 'portfolio'))) add('reviews', 1);
  if (a.m_updates === 'daily' || has('m_special', 'daily')) add('daily', 1, food ? { title: 'Меню дня, которое администратор обновляет сам' } : {});
  if (a.m_self_edit === 'gsheet') add('gsheet', 1);
  if (a.m_self_edit === 'sync') add('pos_sync', 2);
  if (a.e_calc === 'yes' || a.e_menu === 'constructor') add('banqcalc', 1);
  if (has('g_goals', 'hr')) add('jobs', 1);
  if (has('g_goals', 'promo')) add('promo', 1);
  if (has('g_goals', 'blog')) add('blog', 1);
  if (has('o_extra', 'bonus')) add('loyalty', 2);
  if (needCart) {
    if (has('o_extra', 'promo')) add('orderPromo', 1);
    if (has('o_extra', 'account')) add('account', 2);
    if (has('o_extra', 'status')) add('orderStatus', 1);
    if (has('o_extra', 'repeat')) add('orderRepeat', 1);
    if (has('o_extra', 'certs')) add('certs', 1);
  }
  Object.keys(fm).forEach(function (k) {
    if (!M[k] || added[k]) return;
    if (fm[k] === 'now') add(k, 1);
    else if (fm[k] === 'later') add(k, 2);
  });
  var langs = arr('s_langs').filter(function (l) { return l !== 'ru'; });
  if (langs.length) add('lang', 2, { qty: langs.length, title: 'Версии на других языках: ' + langs.map(function (l) { return lcFirst(lab('s_langs', l)); }).join(', ') });

  var pagesForCopy = base === 'multi' ? Math.max(6, pageCells) : 4;
  if (a.ct_texts === 'none') add('copy', 1, { qty: pagesForCopy, title: 'Тексты для сайта с нуля' });
  else if (a.ct_texts !== 'ready') add('copyEdit', 1, { qty: pagesForCopy });
  if (a.ct_brandbook === 'none') add('styleKit', 1);
  var logos = a.ct_logo || {};
  var raster = Object.keys(logos).filter(function (b) { return logos[b] === 'raster'; });
  if (raster.length) add('vectorize', 1, { qty: raster.length, title: 'Перерисовка логотипа в вектор' + (multiBrand ? ': ' + names(raster) : '') });
  var noLogo = Object.keys(logos).filter(function (b) { return logos[b] === 'none'; });
  if (a.pr_seo !== 'no' && base_('seo')) add('seo', 1);
  if (base_('analytics')) add('analytics', 1);
  if (a.l_privacy !== 'yes' && base_('privacy')) add('privacy', 1);

  /* ── платформа (внутреннее решение) ── */
  var customKeys = ['gsheet', 'daily', 'banqcalc', 'calc', 'quiz', 'game', 'tgbot', 'booking', 'pos_sync', 'map', 'delivery_zones', 'remind', 'lms'];
  var custom = customKeys.filter(function (k) { return added[k]; });
  var wantsEdit = ['content', 'all'].indexOf(a.p_edit) >= 0 || ['self', 'staff'].indexOf(a.c_content_owner) >= 0 || a.sp_support === 'self';
  var platform, platformWhy;
  if (needPay) {
    platform = wantsEdit ? 'tilda' : 'code';
    platformWhy = wantsEdit
      ? 'Онлайн-оплата + клиент хочет править сам → магазин на Тильде; для Указа № 60 — экспорт на белорусский хостинг (тариф Business), проверить эквайринг в Тильде'
      : 'Онлайн-оплата → код на своём сервере в РБ: Торговый реестр, хостинг в Беларуси, любой эквайринг';
  } else if (custom.length && !wantsEdit) {
    platform = 'code';
    platformWhy = 'Нужны механики, которые проще кодом: ' + custom.map(function (k) { return lcFirst(M[k].title); }).join('; ');
  } else if (custom.length) {
    platform = 'hybrid';
    platformWhy = 'Клиент хочет править сам, но нужны нестандартные механики → Тильда + блоки кодом (T123): ' + custom.map(function (k) { return lcFirst(M[k].title); }).join('; ');
  } else {
    platform = 'tilda';
    platformWhy = 'Стандартные блоки, клиент может править сам';
  }

  /* ── оценка (внутренняя) ── */
  function sumRate(list) { return list.reduce(function (t, m) { return t + (m.rate == null ? 0 : m.rate * m.qty); }, 0); }
  function weeks(list) {
    var d = list.reduce(function (t, m) { return t + m.days * (m.qty > 1 && m.key !== 'copy' && m.key !== 'copyEdit' ? Math.min(m.qty, 3) : 1); }, 0);
    return d ? Math.max(1, Math.ceil((d * 0.8 + 4) / 5)) : 0;
  }
  function partner(x) { return Math.round(x * (1 - KP.partnerDiscount) / 10) * 10; }
  var est = {};
  [1, 2].forEach(function (p) {
    est[p] = { market: sumRate(phases[p]), weeks: weeks(phases[p]), unknown: phases[p].filter(function (m) { return m.rate == null; }) };
    est[p].partner = partner(est[p].market);
  });
  var startMarket = M.landing.rate + (multiBrand ? M.landingBrand.rate * (brandIds.length - 1) : 0) + (manyPoints ? M.map.rate : 0) + M.privacy.rate + M.analytics.rate;
  var budgetMax = KP.budgets[budgetKey];
  var fits = budgetMax === undefined ? null : est[1].partner <= budgetMax;

  var missing = Object.keys(KP.keyQuestions).filter(function (id) {
    var v = a[id];
    return v === undefined || v === '' || v === 'unk' || v === 'advise' || (Array.isArray(v) && !v.length) || (v && typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length);
  }).map(function (id) { return KP.keyQuestions[id]; });

  /* ── документ для клиента ── */
  var today = Utilities.formatDate(new Date(), 'Europe/Minsk', 'dd.MM.yyyy');
  var model = [];
  model.push({ t: 'h1', text: 'Сайт — ' + projectName });
  model.push({ t: 'meta', text: 'Коммерческое предложение · ' + today + ' · ' + KP.dev.name });
  model.push({ t: 'note', text: 'Черновик собран автоматически по брифу. Суммы не проставлены — впиши их вместо «___ BYN», проверь формулировки и удали этот абзац перед отправкой' });

  var understood = [];
  if (a.g_main) understood.push('Главная задача сайта — ' + lcFirst(lab('g_main', a.g_main)));
  if (a.g_offer) understood.push('Главное сообщение для клиента: «' + String(a.g_offer).trim() + '»');
  var goals = arr('g_goals').filter(function (g) { return g !== a.g_main; }).map(function (g) { return lcFirst(lab('g_goals', g)); });
  if (goals.length) understood.push('Ещё сайт должен ' + goals.join('; '));
  if (a.g_audience) understood.push('Ваши клиенты: ' + String(a.g_audience).trim());
  if (a.g_pain) understood.push('Что мешает сейчас: «' + String(a.g_pain).trim() + '»');
  if (a.g_priority) understood.push('Приоритет — ' + lcFirst(lab('g_priority', a.g_priority)));
  if (a.g_deadline) understood.push('Сроки — ' + lcFirst(lab('g_deadline', a.g_deadline)) + (a.g_deadline_why ? ' (' + a.g_deadline_why + ')' : ''));
  if (understood.length) {
    model.push({ t: 'h2', text: 'Что я поняла из брифа' });
    model.push({ t: 'ul', items: understood });
  }

  model.push({ t: 'h2', text: 'Что предлагаю' });
  if (multiBrand) {
    model.push({
      t: 'p', text: {
        one: 'Один сайт, в котором у ' + names(brandIds) + ' свои разделы со своим характером: общая шапка, общая система заявок, у каждого — свои фото, цены и контакты',
        separate: 'Отдельные сайты для ' + names(brandIds) + ' — у каждого свой домен и стиль, но общая основа. Так быстрее и дешевле, чем делать каждый с нуля',
        first: 'Начинаем с ' + BN[brandIds[0]] + ', остальные бренды добавим вторым этапом на той же основе'
      }[structure]
    });
  }
  model.push({
    t: 'p', text: {
      taplink: 'Формат — мини-сайт для соцсетей: одна ссылка в шапку профиля, кнопки, контакты и главное о вас',
      landing: 'Формат — одна длинная страница: быстро запускается, удобно с телефона, всё главное на одном экране',
      multi: 'Формат — сайт из нескольких страниц: у каждого направления своя страница, это лучше для поиска',
      catalog: 'Формат — сайт с каталогом и корзиной: клиент собирает заказ, вы получаете его в Telegram и подтверждаете',
      shop: 'Формат — интернет-магазин с оплатой картой или через ЕРИП'
    }[type]
  });
  model.push({
    t: 'p', text: platform === 'code'
      ? 'Сайт сделаю кодом: он быстрее загружается, лучше находится в поиске и позволяет любые механики. Цены вы правите в Google-таблице — сайт обновляется сам'
      : 'Сайт соберу на Тильде: вы сможете сами менять цены, акции и фото в визуальном редакторе' + (platform === 'hybrid' ? ', а нестандартные блоки я встрою кодом' : '')
  });
  var sitemap = [];
  if (base === 'multi' && Object.keys(pagesByBrand).length) {
    brandIds.forEach(function (b) {
      if (pagesByBrand[b] && pagesByBrand[b].length) sitemap.push((multiBrand ? BN[b] + ': ' : 'Страницы: ') + pagesByBrand[b].map(lcFirst).join(', '));
    });
  } else {
    var blocks = ['первый экран с главным предложением'];
    if (added.catalogPage) blocks.push(food ? 'меню' : 'товары или услуги с ценами');
    if (added.daily) blocks.push(food ? 'меню дня' : 'предложение дня');
    if (added.map) blocks.push('адреса на карте');
    if (added.banquets) blocks.push(food ? 'банкеты и заявка' : 'мероприятия');
    if (added.bookingForm || added.booking || added.bookingService) blocks.push(food ? 'бронь столика' : 'онлайн-запись');
    if (added.jobs) blocks.push('вакансии');
    blocks.push('о вас и отзывы', 'контакты');
    sitemap.push('Блоки страницы: ' + blocks.join(', '));
  }
  if (a.pr_keywords && added.seo) sitemap.push('SEO под запросы: ' + String(a.pr_keywords).trim());
  model.push({ t: 'ul', items: sitemap });
  model.push({ t: 'p', text: a.l_domain_name ? 'Адрес сайта: ' + a.l_domain_name : 'Адрес сайта: подберём и зарегистрируем домен' });

  model.push({ t: 'h2', text: 'Этапы и стоимость' });
  function wk(n) { return n ? '≈ ' + n + ' ' + plural(n, 'неделя', 'недели', 'недель') : '—'; }
  var rows = [];
  if (fits !== true) {
    var startList = ['Одностраничный сайт: дизайн, адаптация под телефоны, форма заявки'];
    if (multiBrand) startList.push('Блоки ' + names(brandIds.slice(1)) + ' на той же странице');
    if (manyPoints) startList.push('Адреса всех точек на карте');
    if (added.catalogPage) startList.push(food ? 'Меню с ценами' : 'Услуги или товары с ценами');
    if (added.banquets) startList.push(food ? 'Заявка на банкет' : 'Заявка на мероприятие');
    if (added.bookingForm || added.booking) startList.push(food ? 'Заявка на бронь столика' : 'Заявка на запись');
    startList.push('Заявки в Telegram, Яндекс Метрика, политика персональных данных');
    rows.push(['Старт — минимальный запуск', startList.join('; '), wk(Math.max(2, Math.ceil(est[1].weeks / 3))), '___ BYN']);
  }
  rows.push(['Этап 1 — ' + (fits !== true ? 'полная версия' : 'запуск'), phases[1].map(function (m) { return m.title; }).join('; '), wk(est[1].weeks), '___ BYN']);
  if (phases[2].length) rows.push(['Этап 2 — развитие', phases[2].map(function (m) { return m.title; }).join('; '), wk(est[2].weeks), '___ BYN']);
  model.push({ t: 'table', head: ['Этап', 'Что входит', 'Срок', 'Стоимость'], rows: rows });
  model.push({ t: 'p', text: 'Рыночная стоимость такого объёма — ___ BYN. Для вас — партнёрская цена на условиях ниже' });
  var extras = arr('d_creatives').filter(function (x) { return KP.extras[x]; }).map(function (x) { return KP.extras[x] + ' — ___ BYN'; });
  if (noLogo.length) extras.push('Логотип' + (multiBrand ? ' ' + names(noLogo) : '') + ': обновление или разработка — ___ BYN');
  if (extras.length) {
    model.push({ t: 'p', text: 'По желанию:' });
    model.push({ t: 'ul', items: extras });
  }

  model.push({ t: 'h2', text: 'Условия партнёрской цены' });
  model.push({
    t: 'ul', items: [
      'Небольшая подпись разработчика со ссылкой в подвале сайта',
      'Разрешение показать проект в портфолио и соцсетях',
      'По желанию — отметка в ваших соцсетях при запуске',
      a.g_payment === 'company' ? 'Оплата по договору, счёт и акт: 50% перед стартом, 50% после запуска' : 'Оплата: 50% перед стартом, 50% после запуска',
      'Два круга правок на каждом этапе',
      'Сроки считаются с момента, когда получены материалы: тексты или факты, фото, логотипы, цены'
    ]
  });

  var need = [];
  if (added.catalogPage || added.gsheet || added.daily) need.push((food ? 'Меню' : 'Прайс') + ' с ценами — в Excel или Google-таблице');
  var vectorOk = brandIds.filter(function (b) { return logos[b] === 'vector'; });
  if (vectorOk.length < brandIds.length) need.push('Логотип в векторе (AI, SVG или PDF) — если есть');
  if (a.ct_brandbook !== 'book' && a.ct_brandbook !== 'none' && a.ct_brandbook !== 'free') need.push('Фирменные цвета и шрифты, если есть');
  if (a.m_photos !== 'pro') need.push('Фото — или решение по съёмке');
  if (added.copy || added.copyEdit) need.push('Факты для текстов: история, фишки, цифры — тексты напишу сама');
  if (added.reviews) need.push('Доступ к Яндекс Бизнесу, чтобы подключить рейтинг и отзывы');
  if (added.banquets) need.push('Залы: вместимость, депозит, меню');
  if (manyPoints && !a.b_addresses) need.push('Адреса и часы работы всех точек');
  if (needPay) need.push('Договор интернет-эквайринга и регистрация в Торговом реестре');
  need.push('Telegram сотрудников, которые будут получать заявки');
  if (added.privacy) need.push('Данные для политики персональных данных: юрлицо, адрес, ответственный');
  if (!a.l_domain_name) need.push('Решение по домену');
  model.push({ t: 'h2', text: 'Что понадобится от вас' });
  model.push({ t: 'ul', items: need });

  var regular = [];
  regular.push('Домен' + (a.l_domain_name ? ' ' + a.l_domain_name : '') + ' — продление раз в год: ___ BYN');
  regular.push(platform === 'code' ? 'Хостинг: ___ BYN в месяц' : 'Размещение на Тильде: ___ BYN в месяц');
  if (a.sp_support === 'monthly') regular.push('Сопровождение: домен и хостинг, обновление меню и каталога, правки и техвопросы — ___ BYN в месяц');
  else if (a.sp_support === 'ondemand') regular.push('Разовые работы после запуска — по отдельной оценке');
  else if (a.sp_support === 'self') regular.push('Сайт ведёте сами — научу работать в редакторе, короткая видеоинструкция входит в запуск');
  if (needPay) regular.push('Комиссия банка за онлайн-оплату — по договору эквайринга');
  model.push({ t: 'h2', text: 'Регулярные расходы' });
  model.push({ t: 'ul', items: regular });

  var notIncluded = [];
  if (a.m_photos === 'none' || a.m_photos === 'amateur' || a.ct_shoot === 'yes' || a.e_media === 'need') notIncluded.push('Фотосъёмка — у фотографа по его прайсу, помогу подобрать');
  notIncluded.push('Бюджет на рекламу');
  if (added.lang) notIncluded.push('Перевод текстов на другие языки');
  if (added.pos_sync || added.bookingService || added.loyalty || added.lms) notIncluded.push('Абонентская плата сторонних сервисов, если понадобятся');
  model.push({ t: 'h2', text: 'Не входит в стоимость' });
  model.push({ t: 'ul', items: notIncluded });

  model.push({ t: 'h2', text: 'Следующие шаги' });
  model.push({
    t: 'ol', items: [
      'Короткий созвон на 20–30 минут — уточним детали и приоритеты',
      'Фиксируем объём первого этапа и стоимость, предоплата',
      'Структура и прототип — через несколько дней после получения материалов',
      'Дизайн и сборка, два круга правок',
      'Запуск: домен, аналитика, уведомления о заявках в Telegram, короткая инструкция'
    ]
  });
  model.push({ t: 'sign', text: KP.dev.name + ' · Telegram ' + KP.dev.telegram + ' · ' + KP.dev.site });

  /* ── внутренний разбор ── */
  var budgetText = a.g_budget ? lab('g_budget', a.g_budget) : 'не указан';
  var pct = Math.round(KP.partnerDiscount * 100);
  var inLines = [];
  inLines.push('Бюджет клиента: ' + budgetText + (a.g_budget_note ? ' («' + a.g_budget_note + '»)' : ''));
  inLines.push('Этап 1 по рыночным ставкам: ' + fmt(est[1].market) + ' BYN → партнёрская −' + pct + '%: ' + fmt(est[1].partner) + ' BYN, ≈ ' + est[1].weeks + ' нед.' +
    (est[1].unknown.length ? ' + отдельно: ' + est[1].unknown.map(function (m) { return lcFirst(m.title); }).join(', ') : ''));
  if (phases[2].length) inLines.push('Этап 2: ' + fmt(est[2].market) + ' → ' + fmt(est[2].partner) + ' BYN, ≈ ' + est[2].weeks + ' нед.' +
    (est[2].unknown.length ? ' + отдельно: ' + est[2].unknown.map(function (m) { return lcFirst(m.title); }).join(', ') : ''));
  var startText = '«Старт» (лендинг' + (multiBrand ? ' на все бренды' : '') + (manyPoints ? ', карта точек' : '') + ', политика ПД, метрика) ≈ ' + fmt(partner(startMarket)) + ' BYN партнёрская';
  if (fits === false) inLines.push('Этап 1 не влезает в бюджет. Минимум: ' + startText);
  else if (fits === true) inLines.push('Этап 1 влезает в бюджет');
  else inLines.push('Бюджет не назван. Ориентир минимума: ' + startText);
  inLines.push('Платформа: ' + { tilda: 'Тильда', code: 'код на своём сервере', hybrid: 'Тильда + блоки кодом' }[platform] + ' — ' + platformWhy);
  if (structureAdvised) inLines.push('Структуру клиент не выбрал — предложено: ' + (structure === 'one' ? 'один сайт с разделами брендов' : 'отдельные сайты'));
  if (typeAdvised) inLines.push('Формат клиент не выбрал — предложено: ' + { taplink: 'мини-сайт', landing: 'одна страница', multi: 'несколько страниц', catalog: 'каталог с заявкой', shop: 'магазин с оплатой' }[type]);
  notes.forEach(function (n) { inLines.push(n); });
  if (a.m_updates === 'daily') inLines.push('Цены или меню меняются каждый день — обновление без тебя: таблица или бот');
  if (a.m_photos === 'none' || a.m_photos === 'amateur') inLines.push('Хороших фото нет — заложить съёмку или подбор' + (a.ct_ai === 'yes' || a.ct_ai === 'decor' ? '; клиент не против ИИ-изображений' + (a.ct_ai === 'decor' ? ' для фонов и иллюстраций' : '') : ''));
  if (noLogo.length) inLines.push('Логотипа нет или хотят обновить' + (multiBrand ? ': ' + names(noLogo) : ''));
  if (missing.length) inLines.push('Уточнить на созвоне: ' + missing.join(', '));

  var short = [];
  short.push('Бюджет: ' + budgetText);
  short.push('Этап 1 ≈ ' + fmt(est[1].market) + ' рынок / ' + fmt(est[1].partner) + ' партнёрская, ' + est[1].weeks + ' нед.' + (fits === false ? ' — не влезает' : fits === true ? ' — влезает' : ''));
  if (fits !== true) short.push('Минимум ≈ ' + fmt(partner(startMarket)) + ' BYN партнёрская');
  short.push('Платформа: ' + { tilda: 'Тильда', code: 'код', hybrid: 'Тильда + код' }[platform]);
  if (missing.length) short.push('Уточнить: ' + missing.length + ' ' + plural(missing.length, 'вопрос', 'вопроса', 'вопросов'));

  return {
    titleShort: projectName.replace(/[«»"]/g, ''),
    model: model,
    phases: phases,
    estimate: est,
    platform: platform,
    structure: structure,
    type: type,
    internal: {
      lines: inLines,
      short: short,
      html: '<ul style="margin:8px 0 0;padding-left:18px">' + inLines.map(function (x) { return '<li style="margin:0 0 4px">' + escKp_(x) + '</li>'; }).join('') + '</ul>'
    }
  };
}

function plural(n, one, few, many) {
  var m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

function escKp_(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ───────── HTML-версия (для печати в PDF) ───────── */
function renderProposalHtml(kp) {
  var e = escKp_;
  var out = [];
  kp.model.forEach(function (b) {
    switch (b.t) {
      case 'h1': out.push('<h1>' + e(b.text) + '</h1>'); break;
      case 'meta': out.push('<p class="meta">' + e(b.text) + '</p>'); break;
      case 'note': out.push('<p class="note">' + e(b.text) + '</p>'); break;
      case 'h2': out.push('<h2>' + e(b.text) + '</h2>'); break;
      case 'p': out.push('<p>' + e(b.text) + '</p>'); break;
      case 'ul': out.push('<ul>' + b.items.map(function (i) { return '<li>' + e(i) + '</li>'; }).join('') + '</ul>'); break;
      case 'ol': out.push('<ol>' + b.items.map(function (i) { return '<li>' + e(i) + '</li>'; }).join('') + '</ol>'); break;
      case 'table':
        out.push('<table><thead><tr>' + b.head.map(function (x) { return '<th>' + e(x) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          b.rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + e(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>');
        break;
      case 'sign': out.push('<p class="sign">' + e(b.text) + '</p>'); break;
    }
  });
  return '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + e(kp.model[0].text) + '</title><style>' +
    'body{margin:0;background:#f5f5f7;color:#1d1d1f;font:16px/1.55 -apple-system,Segoe UI,Roboto,Arial,sans-serif}' +
    '.page{max-width:780px;margin:24px auto;background:#fff;padding:48px 52px;border-radius:18px}' +
    'h1{font-size:30px;line-height:1.15;margin:0 0 6px}h2{font-size:20px;margin:30px 0 10px;padding-bottom:6px;border-bottom:2px solid #e8e8ed}' +
    '.meta{color:#6e6e73;margin:0 0 18px}.note{background:#fff4ce;padding:10px 14px;border-radius:10px;font-style:italic}' +
    'table{width:100%;border-collapse:collapse;font-size:14.5px}th,td{border:1px solid #e8e8ed;padding:8px 10px;text-align:left;vertical-align:top}th{background:#e8f2fd}' +
    'td:last-child,th:last-child{white-space:nowrap}li{margin:0 0 4px}.sign{margin-top:32px;color:#6e6e73;font-size:14px}' +
    '@media print{body{background:#fff}.page{margin:0;padding:0}.note{display:none}}' +
    '@media (max-width:640px){.page{padding:28px 20px;margin:0;border-radius:0}}' +
    '</style></head><body><div class="page">' + out.join('\n') + '</div></body></html>';
}

/* ───────── Google Docs ───────── */
function createProposalDoc(kp, title, folder) {
  var doc = DocumentApp.create(title);
  var body = doc.getBody();
  body.setMarginTop(48).setMarginBottom(48).setMarginLeft(56).setMarginRight(56);
  var first = body.getNumChildren() ? body.getChild(0) : null;
  var H = DocumentApp.ParagraphHeading;
  kp.model.forEach(function (b) {
    var p;
    switch (b.t) {
      case 'h1': body.appendParagraph(b.text).setHeading(H.TITLE); break;
      case 'meta':
      case 'sign':
        p = body.appendParagraph(b.text);
        if (b.text) p.editAsText().setForegroundColor('#6e6e73').setFontSize(10);
        break;
      case 'note':
        p = body.appendParagraph(b.text);
        if (b.text) p.editAsText().setBackgroundColor('#fff4ce').setItalic(true);
        break;
      case 'h2': body.appendParagraph(b.text).setHeading(H.HEADING2); break;
      case 'p': body.appendParagraph(b.text); break;
      case 'ul': b.items.forEach(function (i) { body.appendListItem(i).setGlyphType(DocumentApp.GlyphType.BULLET); }); break;
      case 'ol': b.items.forEach(function (i) { body.appendListItem(i).setGlyphType(DocumentApp.GlyphType.NUMBER); }); break;
      case 'table':
        var t = body.appendTable([b.head].concat(b.rows));
        t.setBorderColor('#e8e8ed');
        var hr = t.getRow(0);
        for (var i = 0; i < hr.getNumCells(); i++) {
          hr.getCell(i).setBackgroundColor('#e8f2fd');
          hr.getCell(i).editAsText().setBold(true);
        }
        break;
    }
  });
  if (first && body.getNumChildren() > 1) {
    try { first.removeFromParent(); } catch (err) { /* первый абзац бывает несъёмным — не страшно */ }
  }
  doc.saveAndClose();
  DriveApp.getFileById(doc.getId()).moveTo(folder);
  return doc.getUrl();
}
