// Прогон брифа в браузере: проходит шаги как клиент (кейс «кафе с двумя брендами»), снимает скриншоты, отправляет на мок.
// Нужны: python3 -m http.server 5601 (сайт), node tools/gas-mock.mjs (мок), Playwright.
// PLAYWRIGHT=/путь/к/node_modules/playwright/index.mjs node tools/e2e.mjs
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const pw = await import(process.env.PLAYWRIGHT || 'playwright');
const lib = pw.default || pw;
const BROWSER = process.env.BROWSER || 'chromium';
const engine = lib[BROWSER];
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const shots = path.join(root, 'tools', 'out', 'shots-' + BROWSER);
fs.mkdirSync(shots, { recursive: true });
const URL = process.env.BRIEF_URL || 'http://localhost:5601/?endpoint=http://localhost:8787&tag=test';

const browser = await engine.launch();
const errors = [];
const assert = (ok, msg) => { if (!ok) throw new Error('ПРОВЕРКА НЕ ПРОШЛА: ' + msg); console.log('✓', msg); };

async function run(viewport, name, fn) {
  const ctx = await browser.newContext({ viewport, locale: 'ru-RU', colorScheme: 'light' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { errors.push(name + ': ' + e.message); console.log('PAGEERROR', name, e.message); });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(name + ' console: ' + m.text()); });
  await page.goto(URL);
  await page.waitForSelector('#sec-contacts:not([hidden])');
  await page.screenshot({ path: path.join(shots, name + '-00-hero.png') });
  await fn(page, name);
  await ctx.close();
}

// кликаем по подписи, как человек: сам input визуально скрыт
const pick = async (page, name, value, want = true) => {
  const inp = page.locator(`input[name="${name}"][value="${value}"]`);
  if ((await inp.isChecked()) !== want) await page.locator('label', { has: inp }).click();
};
const next = async (page) => { await page.locator('.step-nav .btn:not(.btn-ghost)').click(); await page.waitForTimeout(450); };
const current = (page) => page.evaluate(() => [...document.querySelectorAll('#brief > .sec')].filter((s) => !s.hidden).map((s) => s.id).join(','));
const shot = async (page, file, full) => { await page.waitForTimeout(150); await page.screenshot({ path: path.join(shots, file + '.png'), fullPage: !!full }); };

await run({ width: 1280, height: 900 }, 'desktop', async (page, n) => {
  // шаг 1 — без имени дальше не пускает
  await next(page);
  assert((await current(page)) === 'sec-contacts', 'без имени и телефона остаёмся на первом шаге');
  assert(await page.locator('#q-c_name.has-error').count() === 1, 'у пустого имени появилась ошибка');
  await page.fill('#in-c_name', 'Тест Владелец');
  await page.fill('#in-c_phone', '+375 29 111-22-33');
  await page.fill('#in-c_messenger', '@test_owner');
  await pick(page, 'c_role', 'Владелец');
  await shot(page, n + '-01-contacts');
  await next(page);
  assert((await current(page)) === 'sec-business', 'шаг 2 — О бизнесе');
  await page.fill('#in-b_name', 'Тестовое кафе');
  await pick(page, 'b_sphere', 'food');
  await page.fill('#in-b_brands', 'Бацькі, ФаСоль');
  await page.locator('#in-b_brands').blur();
  await pick(page, 'b_points', '4-10');
  await page.fill('#in-b_addresses', 'Советская, 14 — 11:00–23:00\nСоветская, 36 — 9:00–23:00');
  await shot(page, n + '-02-business');
  await next(page);
  for (const v of ['catalog', 'points', 'banquets', 'booking', 'hr', 'links']) await pick(page, 'g_goals', v);
  await pick(page, 'g_main', 'banquets');
  await page.fill('#in-g_pain', 'Звонят спросить меню, заявки на банкеты теряются');
  await shot(page, n + '-03-goals');
  await next(page);
  await pick(page, 's_structure', 'one');
  await pick(page, 's_type', 'advise');
  await pick(page, 'o_need', 'links');
  await pick(page, 'bk_need', 'form');
  await pick(page, 'm_updates', 'daily');
  await shot(page, n + '-04-format', true);
  await next(page);
  assert((await current(page)) === 'sec-features', 'шаг «Функции сайта»');
  const baseChecked = await page.locator('input[name="f_base"]:checked').count();
  assert(baseChecked >= 10, 'базовый набор для кафе отмечен заранее (' + baseChecked + ')');
  await pick(page, 'f_base', 'delivery_links', false);
  const rows = await page.locator('#q-f_matrix .mrow').count();
  assert(rows < 24, 'расширенные функции отфильтрованы под сферу (' + rows + ' из 24)');
  const pvName = await page.textContent('#pv-side-mount .pv-logo span');
  assert(pvName === 'Тестовое кафе', 'живой макет подхватил название: ' + pvName);
  const pvTabs = await page.$$eval('#pv-side-mount .pv-tabs span', (els) => els.map((e) => e.textContent).join(' | '));
  assert(pvTabs === 'Бацькі | ФаСоль', 'в макете вкладки брендов: ' + pvTabs);
  await pick(page, 'f_matrix::daily', 'now');
  await pick(page, 'f_matrix::gsheet', 'now');
  await pick(page, 'f_matrix::qr', 'now');
  await pick(page, 'f_matrix::jobs', 'now');
  await pick(page, 'f_matrix::b2b', 'later');
  await pick(page, 'f_matrix::quiz', 'later');
  await pick(page, 'f_matrix::tgbot', 'no');
  await page.waitForTimeout(300);
  const pvBlocks = await page.$$eval('#pv-side-mount .pv-block h5', (els) => els.map((e) => e.firstChild.textContent));
  assert(pvBlocks.includes('Меню дня') && pvBlocks.includes('Бронь столика') && pvBlocks.some((t) => t.startsWith('Наши адреса')), 'в макете блоки из ответов: ' + pvBlocks.join(', '));
  await shot(page, n + '-05-features', true);
  await next(page);
  await pick(page, 'ct_logo::b1', 'raster');
  await pick(page, 'ct_logo::b2', 'vector');
  await pick(page, 'ct_brandbook', 'basic');
  await page.setInputFiles('#in-ct_files', [
    { name: 'logo.png', mimeType: 'image/png', buffer: Buffer.alloc(300000, 65) },
    { name: 'меню.csv', mimeType: 'text/csv', buffer: Buffer.from('блюдо;цена\nборщ;4.5') }
  ]);
  await shot(page, n + '-06-brand', true);
  await next(page);
  await pick(page, 'g_priority', 'balance');
  await pick(page, 'g_deadline', 'month');
  await page.fill('#in-g_deadline_why', 'к новогодним корпоративам');
  await pick(page, 'g_budget', 'b600');
  await pick(page, 'g_payment', 'company');
  await shot(page, n + '-07-budget', true);
  await next(page);
  assert((await current(page)) === 'sec-break', 'после главного — экран «Главное готово»');
  await shot(page, n + '-08-break');
  await page.getByRole('button', { name: 'Ответить на детали →' }).click();
  await page.waitForTimeout(400);
  await page.fill('#in-g_audience', 'Офисные сотрудники на обед, семьи, пассажиры вокзала');
  await page.fill('#in-g_usp-b1', 'Большие порции, домашняя кухня');
  await page.fill('#in-g_usp-b2', 'Мясо на углях, панорамные окна');
  await next(page);
  await pick(page, 's_pages::menu', 'b1');
  await pick(page, 's_pages::menu', 'b2');
  await pick(page, 's_pages::events', 'b2');
  await shot(page, n + '-09-pages', true);
  await next(page);
  await next(page); // каталог — пропускаем
  assert((await current(page)) === 'sec-food', 'для кафе появился шаг «Меню и доставка»');
  for (const v of ['canteen', 'restaurant', 'takeaway']) await pick(page, 'fd_formats', v);
  for (const v of ['daily', 'lunch', 'grill']) await pick(page, 'm_special', v);
  await next(page);
  await pick(page, 'e_where', 'hall');
  await page.fill('#in-e_halls', 'Банкетный зал — до 100 гостей');
  await pick(page, 'e_calc', 'yes');
  await shot(page, n + '-10-events', true);
  await next(page);
  assert((await current(page)) === 'sec-booking', 'бронь выбрана — шаг «Запись и бронирование»');
  await page.fill('#in-bk_what', 'Столики и банкетный зал');
  await next(page);
  assert((await current(page)) === 'sec-content', 'заказ через агрегаторы — шаг «Заказ» пропущен');
  await pick(page, 'ct_texts', 'partial');
  await next(page);
  await pick(page, 'd_style', 'photo');
  await pick(page, 'd_style', 'warm');
  await shot(page, n + '-11-design', true);
  await next(page);
  await next(page);
  await next(page);
  await pick(page, 'l_domain', 'have');
  await page.fill('#in-l_domain_name', 'batski.by');
  await next(page);
  await next(page);
  assert((await current(page)) === 'sec-finish', 'в конце — экран отправки');
  await page.check('#consent');
  await shot(page, n + '-12-finish');
  await page.click('#submit-btn');
  await page.waitForSelector('#thanks, .status-error', { timeout: 60000 });
  if (!(await page.$('#thanks'))) {
    await page.screenshot({ path: path.join(shots, n + '-13-error.png') });
    throw new Error('Отправка не прошла: ' + (await page.textContent('#submit-status')));
  }
  await shot(page, n + '-13-thanks');
  console.log('✓ desktop: бриф отправлен');
});

for (const w of [360, 390, 768, 1024, 1280, 1440]) {
  await run({ width: w, height: w < 800 ? 800 : 900 }, 'w' + w, async (page, n) => {
    await page.fill('#in-c_name', 'Тест');
    await page.fill('#in-c_phone', '+375291112233');
    await page.locator('.step-nav .btn:not(.btn-ghost)').click();
    await page.waitForTimeout(400);
    await pick(page, 'b_sphere', 'food');
    await page.locator('.step-nav .btn:not(.btn-ghost)').click();
    await page.waitForTimeout(300);
    await page.locator('.step-nav .btn:not(.btn-ghost)').click();
    await page.waitForTimeout(400);
    await shot(page, n + '-format');
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert(over <= 0, w + 'px: нет горизонтальной прокрутки');
  });
}

await run({ width: 390, height: 844 }, 'mobile', async (page, n) => {
  await page.fill('#in-c_name', 'Тест');
  await page.fill('#in-c_phone', '+375291112233');
  await page.evaluate(() => window.scrollTo(0, document.getElementById('main').offsetTop - 70));
  await shot(page, n + '-01-contacts');
  await next(page);
  await pick(page, 'b_sphere', 'beauty');
  await page.evaluate(() => window.scrollTo(0, document.getElementById('main').offsetTop - 70));
  await shot(page, n + '-02-business');
  await next(page); await next(page);
  await shot(page, n + '-03-format', true);
  await next(page);
  await shot(page, n + '-04-features-beauty', true);
  await page.click('#pv-open');
  await page.waitForSelector('.pv-modal .pv');
  await page.waitForTimeout(500);
  await shot(page, n + '-05-preview-modal');
  const pvOk = await page.textContent('.pv-modal .pv-hero small');
  assert(pvOk === 'Салон красоты', 'на телефоне макет открывается кнопкой «Ваш сайт» и знает сферу: ' + pvOk);
  await page.keyboard.press('Escape');
  assert(await page.locator('.pv-modal').count() === 0, 'окно макета закрывается по Esc');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert(overflow <= 0, 'на телефоне нет горизонтальной прокрутки');
});

await browser.close();
console.log(errors.length ? 'ОШИБКИ:\n' + errors.join('\n') : '✓ ошибок в консоли нет');
console.log('Скриншоты:', shots);
