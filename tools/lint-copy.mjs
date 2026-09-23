// Проверка текстов брифа: точки в конце абзацев и подписей, двойные пробелы, «ё»-разнобой не трогаем.
// node tools/lint-copy.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'assets/schema.js'), 'utf8'), ctx);
const W = ctx.window;
const issues = [];
const check = (where, text) => {
  if (typeof text !== 'string' || !text) return;
  const t = text.replace(/<[^>]+>/g, '').trim();
  if (/[^.]\.$/.test(t) && !/\b(т\.\s?п|и\s?т\.\s?д|др|руб|ул|пр)\.$/.test(t)) issues.push(`точка в конце — ${where}: «${t.slice(-60)}»`);
  if (/ {2,}/.test(text)) issues.push(`двойной пробел — ${where}`);
};
const opt = (o) => (typeof o === 'string' ? [o] : [o[1], typeof o[2] === 'string' ? o[2] : '']);

for (const p of Object.values(W.BRIEF_PARTS)) { check('часть', p.title); check('часть', p.note); }
for (const w of W.BRIEF_WORKS) { check('работа ' + w.title, w.text); }
for (const s of W.BRIEF_SCHEMA) {
  check(s.id + ' заголовок', s.title);
  check(s.id + ' вступление', s.intro);
  for (const f of s.fields) {
    for (const k of ['label', 'hint', 'example', 'why', 'placeholder']) check(`${f.id}.${k}`, f[k]);
    if (f.html) for (const m of f.html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)) check(f.id + ' html', m[1]);
    const lists = [f.options, Array.isArray(f.rows) ? f.rows : null, Array.isArray(f.cols) ? f.cols : null]
      .concat(f.optionsBySphere ? Object.values(f.optionsBySphere) : []);
    for (const list of lists) if (list) for (const o of list) opt(o).forEach((t, i) => check(`${f.id} вариант${i ? ' (пояснение)' : ''}`, t));
  }
}
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const m of html.matchAll(/>([^<>]{3,})<\/(p|li|b|h1|h2|h3|span|a|button)>/g)) check('index.html', m[1]);

console.log(issues.length ? issues.join('\n') + `\n\nНайдено: ${issues.length}` : 'Тексты в порядке: точек в конце нет, двойных пробелов нет');
process.exitCode = issues.length ? 1 : 0;
