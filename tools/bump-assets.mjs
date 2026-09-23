// Проставляет свежую версию (?v=…) у скриптов и стилей в index.html, чтобы браузеры
// посетителей не брали из кэша старые config.js / app.js после обновления сайта
import fs from 'node:fs';
import path from 'node:path';

const file = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'index.html');
const v = new Date().toISOString().slice(0, 16).replace(/\D/g, '');
const html = fs.readFileSync(file, 'utf8').replace(
  /((?:src|href)=")((?:assets\/)?[\w.-]+\.(?:js|css))(?:\?v=\w+)?(")/g,
  (m, a, p, b) => a + p + '?v=' + v + b
);
fs.writeFileSync(file, html);
console.log('index.html → ?v=' + v);
