/* Стилевые схемы для вопроса «Какие стили нравятся, а какие точно нет».
   Это не дизайн, а наглядные направления: цвета, воздух, типографика, формы. Цвета — фиксированные (это «картинки»),
   живой макет берёт палитру по id из assets/preview.js → THEMES */
window.BRIEF_STYLES = [
  {
    id: 'minimal', title: 'Светлый минимализм', note: 'Много воздуха, чёрный текст, ничего лишнего',
    swatches: ['#ffffff', '#111111', '#e9e9e9'], example: { text: 'Yandex Pet Day', href: 'https://elenasamanchuk.github.io/yandex-pet-day/' },
    svg: '<svg viewBox="0 0 160 200" aria-hidden="true"><rect width="160" height="200" fill="#fff"/>' +
      '<rect x="14" y="14" width="22" height="5" rx="1" fill="#111"/><rect x="100" y="15" width="12" height="3" rx="1.5" fill="#9a9a9a"/><rect x="116" y="15" width="12" height="3" rx="1.5" fill="#9a9a9a"/><rect x="132" y="15" width="14" height="3" rx="1.5" fill="#9a9a9a"/>' +
      '<rect x="14" y="50" width="106" height="10" fill="#111"/><rect x="14" y="64" width="78" height="10" fill="#111"/>' +
      '<rect x="14" y="84" width="86" height="3" rx="1.5" fill="#bbb"/><rect x="14" y="90" width="64" height="3" rx="1.5" fill="#bbb"/>' +
      '<rect x="14.5" y="102.5" width="46" height="13" rx="6.5" fill="none" stroke="#111"/>' +
      '<line x1="14" y1="130" x2="146" y2="130" stroke="#ededed"/>' +
      '<rect x="14" y="140" width="62" height="46" fill="#f2f2f2"/><rect x="84" y="140" width="62" height="46" fill="#f2f2f2"/></svg>'
  },
  {
    id: 'warm', title: 'Тёплый и уютный', note: 'Кремовый фон, терракота, мягкие формы',
    swatches: ['#f7efe6', '#c96f55', '#3b2a22'], example: { text: 'Форма', href: 'https://yourforma.ru/' },
    svg: '<svg viewBox="0 0 160 200" aria-hidden="true"><defs><linearGradient id="st-w1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1c9ae"/><stop offset="1" stop-color="#c96f55"/></linearGradient></defs>' +
      '<rect width="160" height="200" fill="#f7efe6"/>' +
      '<circle cx="19" cy="17" r="5" fill="#c96f55"/><rect x="28" y="14" width="26" height="5" rx="2.5" fill="#3b2a22"/><rect x="118" y="15" width="28" height="4" rx="2" fill="#b89a86"/>' +
      '<rect x="14" y="44" width="72" height="9" rx="4.5" fill="#3b2a22"/><rect x="14" y="57" width="58" height="9" rx="4.5" fill="#3b2a22"/>' +
      '<rect x="14" y="74" width="66" height="3" rx="1.5" fill="#b89a86"/><rect x="14" y="80" width="54" height="3" rx="1.5" fill="#b89a86"/>' +
      '<rect x="14" y="92" width="48" height="14" rx="7" fill="#c96f55"/>' +
      '<circle cx="120" cy="72" r="30" fill="url(#st-w1)"/><circle cx="120" cy="72" r="15" fill="#fff6ee" opacity=".85"/>' +
      '<rect x="14" y="124" width="62" height="62" rx="14" fill="#fffaf4"/><circle cx="45" cy="146" r="12" fill="#efd3bf"/><rect x="26" y="166" width="38" height="4" rx="2" fill="#b89a86"/>' +
      '<rect x="84" y="124" width="62" height="62" rx="14" fill="#fffaf4"/><circle cx="115" cy="146" r="12" fill="#e9b99a"/><rect x="96" y="166" width="38" height="4" rx="2" fill="#b89a86"/></svg>'
  },
  {
    id: 'dark', title: 'Тёмный премиальный', note: 'Чёрный фон, золото, крупные заголовки',
    swatches: ['#0d0d0d', '#c9a45c', '#f3ede2'], example: { text: 'Still store', href: 'https://elenasamanchuk.github.io/still-store/' },
    svg: '<svg viewBox="0 0 160 200" aria-hidden="true"><defs><linearGradient id="st-d1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b2620"/><stop offset="1" stop-color="#6b5535"/></linearGradient></defs>' +
      '<rect width="160" height="200" fill="#0d0d0d"/><rect x="7.5" y="7.5" width="145" height="185" fill="none" stroke="#c9a45c" stroke-opacity=".55"/>' +
      '<rect x="66" y="18" width="28" height="4" rx="2" fill="#c9a45c"/>' +
      '<rect x="30" y="42" width="100" height="10" fill="#f3ede2"/><rect x="44" y="56" width="72" height="10" fill="#f3ede2"/>' +
      '<line x1="66" y1="76" x2="94" y2="76" stroke="#c9a45c"/>' +
      '<rect x="52.5" y="84.5" width="55" height="13" fill="none" stroke="#c9a45c"/>' +
      '<rect x="18" y="114" width="124" height="66" fill="url(#st-d1)"/><rect x="18" y="172" width="124" height="8" fill="#000" opacity=".35"/>' +
      '<rect x="26" y="162" width="40" height="3" fill="#c9a45c"/></svg>'
  },
  {
    id: 'bright', title: 'Яркий и сочный', note: 'Насыщенные цвета, стикеры, крупный шрифт',
    swatches: ['#5b2ee5', '#ffd400', '#ff5a36'], example: { text: 'Приём', href: 'https://priem.menu/?cmz=M3rW' },
    svg: '<svg viewBox="0 0 160 200" aria-hidden="true"><rect width="160" height="200" fill="#5b2ee5"/>' +
      '<rect x="14" y="14" width="30" height="7" rx="3.5" fill="#ffd400"/><rect x="118" y="13" width="28" height="9" rx="4.5" fill="#fff"/>' +
      '<rect x="14" y="38" width="96" height="14" rx="3" fill="#ffd400"/><rect x="14" y="56" width="74" height="14" rx="3" fill="#ffd400"/>' +
      '<rect x="14" y="78" width="70" height="4" rx="2" fill="#d7ccff"/><rect x="14" y="88" width="52" height="15" rx="7.5" fill="#fff"/>' +
      '<circle cx="124" cy="92" r="24" fill="#ffb4a3"/><circle cx="124" cy="92" r="16" fill="#fff" opacity=".9"/>' +
      '<g transform="rotate(-12 132 56)"><circle cx="132" cy="56" r="15" fill="#ff5a36"/><text x="132" y="60" font-family="Arial, sans-serif" font-size="11" font-weight="800" text-anchor="middle" fill="#fff">-30%</text></g>' +
      '<rect x="14" y="126" width="40" height="58" rx="10" fill="#fff"/><circle cx="34" cy="146" r="11" fill="#ffd400"/><rect x="21" y="164" width="26" height="4" rx="2" fill="#5b2ee5"/>' +
      '<rect x="60" y="126" width="40" height="58" rx="10" fill="#fff"/><circle cx="80" cy="146" r="11" fill="#ff5a36"/><rect x="67" y="164" width="26" height="4" rx="2" fill="#5b2ee5"/>' +
      '<rect x="106" y="126" width="40" height="58" rx="10" fill="#fff"/><circle cx="126" cy="146" r="11" fill="#7cf2c8"/><rect x="113" y="164" width="26" height="4" rx="2" fill="#5b2ee5"/></svg>'
  },
  {
    id: 'natural', title: 'Спокойный природный', note: 'Оливковый и бежевый, мягкие формы',
    swatches: ['#eef0e8', '#7d8f69', '#2f3325'], example: { text: 'Система Ясности', href: 'https://sistemayasnosti.com/' },
    svg: '<svg viewBox="0 0 160 200" aria-hidden="true"><defs><linearGradient id="st-n1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7dccb"/><stop offset="1" stop-color="#b9a98f"/></linearGradient></defs>' +
      '<rect width="160" height="200" fill="#eef0e8"/><path d="M104 0h56v70c-18 6-40-4-46-22S92 12 104 0z" fill="#c9d3b8"/>' +
      '<rect x="14" y="14" width="30" height="5" rx="2.5" fill="#2f3325"/>' +
      '<rect x="14" y="46" width="80" height="9" rx="2" fill="#2f3325"/><rect x="14" y="59" width="62" height="9" rx="2" fill="#2f3325"/>' +
      '<rect x="14" y="76" width="70" height="3" rx="1.5" fill="#8b8f7d"/><rect x="14" y="82" width="56" height="3" rx="1.5" fill="#8b8f7d"/>' +
      '<rect x="14" y="94" width="50" height="14" rx="7" fill="#7d8f69"/>' +
      '<path d="M96 120V92a25 25 0 0 1 50 0v28z" fill="url(#st-n1)"/>' +
      '<path d="M22 150c10-18 30-18 40 0-10 18-30 18-40 0z" fill="#9aab86"/><path d="M42 136v28" stroke="#eef0e8" stroke-width="1.5"/>' +
      '<rect x="14" y="176" width="132" height="10" rx="5" fill="#dfe4d3"/><rect x="96" y="132" width="50" height="4" rx="2" fill="#8b8f7d"/><rect x="96" y="140" width="38" height="4" rx="2" fill="#8b8f7d"/></svg>'
  },
  {
    id: 'photo', title: 'Фото на первом плане', note: 'Большие фотографии, минимум текста',
    swatches: ['#2b3a55', '#e3a36b', '#ffffff'], example: { text: 'Nasha', href: 'https://nashashop.ru/catalog' },
    svg: '<svg viewBox="0 0 160 200" aria-hidden="true"><defs><linearGradient id="st-p1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b3a55"/><stop offset=".65" stop-color="#b56f5b"/><stop offset="1" stop-color="#e3a36b"/></linearGradient>' +
      '<linearGradient id="st-p2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9c2a3"/><stop offset="1" stop-color="#8f6f53"/></linearGradient><linearGradient id="st-p3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a7b8c9"/><stop offset="1" stop-color="#4f6475"/></linearGradient></defs>' +
      '<rect width="160" height="200" fill="#fff"/><rect width="160" height="118" fill="url(#st-p1)"/><circle cx="118" cy="44" r="12" fill="#ffe2b8" opacity=".9"/>' +
      '<path d="M0 118l40-34 30 20 36-30 54 44z" fill="#1f2937" opacity=".45"/>' +
      '<rect x="14" y="14" width="24" height="5" rx="2.5" fill="#fff"/><rect x="118" y="15" width="28" height="3" rx="1.5" fill="#fff" opacity=".8"/>' +
      '<rect x="14" y="70" width="84" height="10" fill="#fff"/><rect x="14" y="84" width="60" height="10" fill="#fff"/><rect x="14" y="100" width="44" height="11" rx="5.5" fill="#fff"/>' +
      '<rect x="8" y="126" width="46" height="62" fill="url(#st-p2)"/><rect x="57" y="126" width="46" height="62" fill="url(#st-p3)"/><rect x="106" y="126" width="46" height="62" fill="url(#st-p2)"/></svg>'
  },
  {
    id: 'business', title: 'Деловой, технологичный', note: 'Синий, сетка карточек, цифры и иконки',
    swatches: ['#f5f8ff', '#2563eb', '#0f172a'], example: { text: 'Sender', href: 'https://nn99.ru/' },
    svg: '<svg viewBox="0 0 160 200" aria-hidden="true"><rect width="160" height="200" fill="#f5f8ff"/>' +
      '<rect x="14" y="14" width="10" height="10" rx="3" fill="#2563eb"/><rect x="28" y="16" width="26" height="5" rx="2.5" fill="#0f172a"/><rect x="116" y="13" width="30" height="11" rx="5.5" fill="#2563eb"/>' +
      '<rect x="14" y="42" width="72" height="8" rx="2" fill="#0f172a"/><rect x="14" y="54" width="56" height="8" rx="2" fill="#0f172a"/><rect x="14" y="70" width="60" height="3" rx="1.5" fill="#94a3b8"/>' +
      '<rect x="14" y="80" width="46" height="12" rx="6" fill="#2563eb"/>' +
      '<rect x="92" y="38" width="56" height="58" rx="8" fill="#fff" stroke="#dbe4f5"/><polyline points="98,84 108,74 116,78 126,62 134,68 142,52" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<rect x="98" y="44" width="22" height="4" rx="2" fill="#94a3b8"/>' +
      '<rect x="14" y="108" width="40" height="22" rx="6" fill="#fff" stroke="#dbe4f5"/><rect x="20" y="114" width="16" height="6" rx="2" fill="#2563eb"/><rect x="20" y="123" width="26" height="3" rx="1.5" fill="#94a3b8"/>' +
      '<rect x="60" y="108" width="40" height="22" rx="6" fill="#fff" stroke="#dbe4f5"/><rect x="66" y="114" width="16" height="6" rx="2" fill="#2563eb"/><rect x="66" y="123" width="26" height="3" rx="1.5" fill="#94a3b8"/>' +
      '<rect x="106" y="108" width="40" height="22" rx="6" fill="#fff" stroke="#dbe4f5"/><rect x="112" y="114" width="16" height="6" rx="2" fill="#2563eb"/><rect x="112" y="123" width="26" height="3" rx="1.5" fill="#94a3b8"/>' +
      '<rect x="14" y="140" width="62" height="46" rx="8" fill="#fff" stroke="#dbe4f5"/><rect x="22" y="148" width="12" height="12" rx="3" fill="#dbeafe"/><rect x="22" y="166" width="44" height="3" rx="1.5" fill="#94a3b8"/><rect x="22" y="173" width="32" height="3" rx="1.5" fill="#94a3b8"/>' +
      '<rect x="84" y="140" width="62" height="46" rx="8" fill="#fff" stroke="#dbe4f5"/><rect x="92" y="148" width="12" height="12" rx="3" fill="#dbeafe"/><rect x="92" y="166" width="44" height="3" rx="1.5" fill="#94a3b8"/><rect x="92" y="173" width="32" height="3" rx="1.5" fill="#94a3b8"/></svg>'
  },
  {
    id: 'folk', title: 'Народный колорит', note: 'Орнамент, красный и белый, домашнее тепло',
    swatches: ['#fffaf3', '#b3261e', '#3f5fae'],
    svg: '<svg viewBox="0 0 160 200" aria-hidden="true"><defs><pattern id="st-f1" width="16" height="12" patternUnits="userSpaceOnUse"><path d="M8 1l6 5-6 5-6-5z" fill="#b3261e"/><path d="M8 4l2.5 2L8 8 5.5 6z" fill="#fffaf3"/></pattern>' +
      '<linearGradient id="st-f2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3d9b5"/><stop offset="1" stop-color="#c77b4a"/></linearGradient></defs>' +
      '<rect width="160" height="200" fill="#fffaf3"/><rect width="160" height="12" fill="url(#st-f1)"/><rect y="188" width="160" height="12" fill="url(#st-f1)"/>' +
      '<rect x="14" y="22" width="30" height="6" rx="3" fill="#3a1f16"/><circle cx="140" cy="25" r="4" fill="#3f5fae"/>' +
      '<rect x="14" y="44" width="84" height="10" rx="2" fill="#3a1f16"/><rect x="14" y="58" width="64" height="10" rx="2" fill="#3a1f16"/>' +
      '<rect x="14" y="76" width="70" height="3" rx="1.5" fill="#a58a7b"/><rect x="14" y="82" width="54" height="3" rx="1.5" fill="#a58a7b"/>' +
      '<rect x="14" y="94" width="52" height="14" rx="7" fill="#b3261e"/>' +
      '<rect x="100" y="40" width="46" height="68" rx="23" fill="url(#st-f2)"/>' +
      '<rect x="14" y="122" width="132" height="56" rx="10" fill="#f6ebdc"/><path d="M26 150l8-8 8 8-8 8z" fill="#b3261e"/><path d="M118 150l8-8 8 8-8 8z" fill="#b3261e"/>' +
      '<rect x="50" y="140" width="60" height="5" rx="2.5" fill="#3a1f16"/><rect x="56" y="150" width="48" height="3" rx="1.5" fill="#a58a7b"/><rect x="60" y="157" width="40" height="3" rx="1.5" fill="#a58a7b"/></svg>'
  },
  {
    id: 'playful', title: 'Игривый пастельный', note: 'Нежные градиенты, скругления, лёгкость',
    swatches: ['#ffe4f1', '#b8f2e6', '#ec4899'],
    svg: '<svg viewBox="0 0 160 200" aria-hidden="true"><defs><linearGradient id="st-l1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe4f1"/><stop offset="1" stop-color="#e9e4ff"/></linearGradient><linearGradient id="st-l2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd1e8"/><stop offset="1" stop-color="#c9b6ff"/></linearGradient></defs>' +
      '<rect width="160" height="200" fill="url(#st-l1)"/><circle cx="140" cy="14" r="26" fill="#b8f2e6" opacity=".8"/><circle cx="8" cy="120" r="18" fill="#fff3b0" opacity=".9"/>' +
      '<rect x="14" y="14" width="30" height="8" rx="4" fill="#5b3fa8"/>' +
      '<rect x="14" y="44" width="78" height="11" rx="5.5" fill="#5b3fa8"/><rect x="14" y="59" width="60" height="11" rx="5.5" fill="#5b3fa8"/>' +
      '<rect x="14" y="78" width="66" height="4" rx="2" fill="#a898c8"/><rect x="14" y="90" width="52" height="15" rx="7.5" fill="#ec4899"/>' +
      '<rect x="98" y="44" width="50" height="60" rx="20" fill="url(#st-l2)"/><circle cx="112" cy="60" r="5" fill="#fff"/><circle cx="134" cy="88" r="7" fill="#fff" opacity=".7"/>' +
      '<rect x="14" y="124" width="62" height="60" rx="18" fill="#fff" opacity=".9"/><circle cx="45" cy="146" r="11" fill="#b8f2e6"/><rect x="28" y="164" width="34" height="5" rx="2.5" fill="#c9b6ff"/>' +
      '<rect x="84" y="124" width="62" height="60" rx="18" fill="#fff" opacity=".9"/><circle cx="115" cy="146" r="11" fill="#ffd1e8"/><rect x="98" y="164" width="34" height="5" rx="2.5" fill="#c9b6ff"/></svg>'
  },
  {
    id: 'editorial', title: 'Журнальный', note: 'Крупная типографика, колонки, акцентный цвет',
    swatches: ['#ffffff', '#111111', '#e03131'],
    svg: '<svg viewBox="0 0 160 200" aria-hidden="true"><defs><linearGradient id="st-e1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4d4d4"/><stop offset="1" stop-color="#6b6b6b"/></linearGradient></defs>' +
      '<rect width="160" height="200" fill="#fff"/><line x1="12" y1="12" x2="148" y2="12" stroke="#111" stroke-width="2"/>' +
      '<rect x="12" y="18" width="30" height="4" fill="#111"/><rect x="118" y="18" width="30" height="4" fill="#bbb"/>' +
      '<rect x="12" y="32" width="18" height="6" fill="#e03131"/>' +
      '<rect x="12" y="44" width="136" height="16" fill="#111"/><rect x="12" y="64" width="112" height="16" fill="#111"/><rect x="12" y="84" width="84" height="16" fill="#111"/>' +
      '<rect x="12" y="112" width="62" height="3" fill="#999"/><rect x="12" y="119" width="62" height="3" fill="#999"/><rect x="12" y="126" width="62" height="3" fill="#999"/><rect x="12" y="133" width="44" height="3" fill="#999"/>' +
      '<rect x="12" y="146" width="62" height="3" fill="#999"/><rect x="12" y="153" width="62" height="3" fill="#999"/><rect x="12" y="160" width="50" height="3" fill="#999"/>' +
      '<rect x="84" y="110" width="64" height="76" fill="url(#st-e1)"/><line x1="12" y1="190" x2="148" y2="190" stroke="#111"/></svg>'
  }
];
