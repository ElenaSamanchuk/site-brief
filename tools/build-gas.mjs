// Собирает apps-script/dist/paste-into-google.gs — один файл для вставки в Google Apps Script.
// Если есть apps-script/secrets.local.json (в git не попадает) — вписывает настройки в функцию setup().
// node tools/build-gas.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dir = path.join(root, 'apps-script');
const secretsFile = path.join(dir, 'secrets.local.json');
const secrets = fs.existsSync(secretsFile) ? JSON.parse(fs.readFileSync(secretsFile, 'utf8')) : null;
const code = ['Proposal.gs', 'Code.gs'].map((f) => `/* ═════ ${f} ═════ */\n` + fs.readFileSync(path.join(dir, f), 'utf8')).join('\n\n');
const setup = secrets
  ? `/** 1. Запустите один раз: сохранит настройки, пришлёт тест в Telegram и на почту, попросит доступы */
function setup() {
  PropertiesService.getScriptProperties().setProperties(${JSON.stringify(secrets, null, 2).replace(/\n/g, '\n  ')});
  testSend();
}
`
  : `/** 1. Заполните свойства скрипта (TG_TOKEN, TG_CHAT_ID, EMAIL_TO, FORM_KEY) и запустите testSend */\n`;
const out = `/*
  Бриф на сайт — серверная часть. Вставьте этот файл целиком в редактор Google Apps Script (вместо Код.gs),
  сохраните, выберите функцию setup и нажмите «Выполнить». Затем «Развернуть → Новое развёртывание → Веб-приложение»:
  «Запуск от имени: я», «Доступ: все». Скопируйте адрес …/exec в config.js сайта.
  ВНИМАНИЕ: файл содержит токен бота — не публикуйте его
*/

${setup}
${code}
`;
fs.mkdirSync(path.join(dir, 'dist'), { recursive: true });
fs.writeFileSync(path.join(dir, 'dist', 'paste-into-google.gs'), out);
console.log('Готово: apps-script/dist/paste-into-google.gs' + (secrets ? ' (с настройками)' : ' (без настроек)'));
