/* Мини-анимации форматов сайта (вопрос «Какой сайт нужен»). Анимация — в brief.css (.an-*) */
window.BRIEF_ANIM = {
  landing:
    '<svg class="an an-landing" viewBox="0 0 56 72" aria-hidden="true">' +
    '<defs><clipPath id="an-clip-landing"><rect x="13" y="7" width="30" height="58" rx="3"/></clipPath></defs>' +
    '<rect class="an-frame" x="10" y="2" width="36" height="68" rx="7"/>' +
    '<g clip-path="url(#an-clip-landing)"><g class="an-scroll">' +
    '<rect class="an-fill" x="15" y="10" width="26" height="14" rx="2"/>' +
    '<rect class="an-line" x="15" y="27" width="18" height="3" rx="1.5"/><rect class="an-line" x="15" y="33" width="26" height="3" rx="1.5"/>' +
    '<rect class="an-fill b" x="15" y="40" width="12" height="12" rx="2"/><rect class="an-fill b" x="29" y="40" width="12" height="12" rx="2"/>' +
    '<rect class="an-line" x="15" y="56" width="26" height="3" rx="1.5"/><rect class="an-fill" x="15" y="62" width="26" height="12" rx="2"/>' +
    '<rect class="an-line" x="15" y="78" width="20" height="3" rx="1.5"/><rect class="an-accent" x="15" y="85" width="26" height="7" rx="3.5"/>' +
    '</g></g></svg>',

  multi:
    '<svg class="an an-multi" viewBox="0 0 56 72" aria-hidden="true">' +
    '<rect class="an-frame" x="3" y="10" width="50" height="52" rx="5"/>' +
    '<rect class="an-line" x="8" y="15" width="10" height="4" rx="2"/><rect class="an-line" x="21" y="15" width="10" height="4" rx="2"/><rect class="an-line" x="34" y="15" width="10" height="4" rx="2"/>' +
    '<rect class="an-accent an-tab" x="8" y="21" width="10" height="1.6" rx=".8"/>' +
    '<g class="an-page p1"><rect class="an-fill" x="8" y="27" width="40" height="14" rx="2"/><rect class="an-line" x="8" y="45" width="30" height="3" rx="1.5"/><rect class="an-line" x="8" y="51" width="36" height="3" rx="1.5"/></g>' +
    '<g class="an-page p2"><rect class="an-fill b" x="8" y="27" width="19" height="27" rx="2"/><rect class="an-fill b" x="29" y="27" width="19" height="27" rx="2"/></g>' +
    '<g class="an-page p3"><rect class="an-line" x="8" y="28" width="40" height="3" rx="1.5"/><rect class="an-line" x="8" y="34" width="34" height="3" rx="1.5"/><rect class="an-line" x="8" y="40" width="38" height="3" rx="1.5"/><rect class="an-fill" x="8" y="47" width="22" height="7" rx="2"/></g>' +
    '</svg>',

  catalog:
    '<svg class="an an-catalog" viewBox="0 0 56 72" aria-hidden="true">' +
    '<rect class="an-frame" x="3" y="6" width="50" height="60" rx="5"/>' +
    '<rect class="an-fill an-pick" x="8" y="11" width="19" height="19" rx="2"/><rect class="an-fill b" x="29" y="11" width="19" height="19" rx="2"/>' +
    '<rect class="an-fill b" x="8" y="33" width="19" height="19" rx="2"/><rect class="an-fill" x="29" y="33" width="19" height="19" rx="2"/>' +
    '<path class="an-cart" d="M34 56h3l2.4 6.2h7.2l1.8-4.6H38.4"/><circle class="an-cart-dot" cx="17.5" cy="20.5" r="2.4"/>' +
    '<circle class="an-badge" cx="48" cy="56" r="3"/>' +
    '</svg>',

  shop:
    '<svg class="an an-shop" viewBox="0 0 56 72" aria-hidden="true">' +
    '<rect class="an-frame" x="3" y="6" width="50" height="60" rx="5"/>' +
    '<rect class="an-fill" x="8" y="11" width="40" height="18" rx="2"/><rect class="an-line" x="8" y="33" width="26" height="3" rx="1.5"/>' +
    '<g class="an-card"><rect class="an-accent" x="8" y="40" width="26" height="17" rx="2.5"/><rect class="an-card-strip" x="8" y="44" width="26" height="3"/><rect class="an-card-chip" x="11" y="50" width="6" height="4" rx="1"/></g>' +
    '<circle class="an-ok-bg" cx="42" cy="49" r="7"/><path class="an-ok" d="M38.6 49.2l2.4 2.4 4.4-4.8"/>' +
    '</svg>',

  taplink:
    '<svg class="an an-taplink" viewBox="0 0 56 72" aria-hidden="true">' +
    '<rect class="an-frame" x="10" y="2" width="36" height="68" rx="7"/>' +
    '<circle class="an-fill" cx="28" cy="15" r="5"/><rect class="an-line" x="20" y="23" width="16" height="2.6" rx="1.3"/>' +
    '<rect class="an-btn b1" x="15" y="31" width="26" height="6" rx="3"/><rect class="an-btn b2" x="15" y="40" width="26" height="6" rx="3"/>' +
    '<rect class="an-btn b3" x="15" y="49" width="26" height="6" rx="3"/><rect class="an-btn b4" x="15" y="58" width="26" height="6" rx="3"/>' +
    '</svg>',

  advise:
    '<svg class="an an-advise" viewBox="0 0 56 72" aria-hidden="true">' +
    '<g class="an-rays"><path d="M28 12v-5M14 22l-4-3M42 22l4-3M10 36H5M46 36h5"/></g>' +
    '<path class="an-bulb" d="M28 18a13 13 0 0 1 7.6 23.6V47H20.4v-5.4A13 13 0 0 1 28 18z"/>' +
    '<path class="an-bulb-base" d="M22 51h12M24 55h8"/>' +
    '</svg>'
};
