// Локальная проверка без Google: запускает apps-script/*.gs с заглушками сервисов.
// node tools/gas-mock.mjs [порт]  → POST http://localhost:8787 принимает бриф как настоящий скрипт,
// а всё, что ушло бы в Telegram, почту, Диск и Google Docs, складывает в tools/out/<время>/
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PORT = Number(process.argv[2] || 8787);
const OUT = path.join(root, 'tools', 'out');
// LOSE=2 — первые 2 ответа на отправку «теряются» (как иногда у Google): бриф обработан, а страница ответа не видит
let lose = Number(process.env.LOSE || 0);
const cacheStore = new Map();
const CacheService = { getScriptCache: () => ({ get: (k) => cacheStore.get(k) ?? null, put: (k, v) => { cacheStore.set(k, v); } }) };
const LockService = { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => { } }) };

function makeContext(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const log = [];
  const write = (name, data) => fs.writeFileSync(path.join(dir, name.replace(/[\/\\]/g, '_')), data);
  class Blob {
    constructor(bytes, type, name) { this.bytes = Buffer.isBuffer(bytes) ? bytes : Buffer.from(String(bytes), 'utf8'); this.type = type; this.name = name; }
    getName() { return this.name; } getContentType() { return this.type; } getBytes() { return this.bytes; }
    setName(n) { this.name = n; return this; }
    getAs(t) { return new Blob(this.bytes, t, this.name); }
    copyBlob() { return new Blob(this.bytes, this.type, this.name); }
  }
  const folder = (name) => ({
    name,
    createFolder: (n) => { log.push('drive:folder ' + n); return folder(n); },
    createFile: (b) => { write('drive__' + b.getName(), b.getBytes()); log.push('drive:file ' + b.getName()); return { getUrl: () => 'https://drive.example/' + encodeURIComponent(b.getName()) }; },
    getUrl: () => 'https://drive.example/folder/' + encodeURIComponent(name),
    getFoldersByName: () => ({ hasNext: () => false }),
  });
  const docBody = [];
  const textStub = () => { const t = { setForegroundColor: () => t, setFontSize: () => t, setBackgroundColor: () => t, setItalic: () => t, setBold: () => t }; return t; };
  const para = (kind, text) => { docBody.push({ kind, text }); const p = { setHeading: (h) => { docBody[docBody.length - 1].heading = h; return p; }, setGlyphType: () => p, editAsText: textStub, removeFromParent: () => { } }; return p; };
  const ctx = {
    console: { log: (...a) => log.push('log: ' + a.join(' ')), warn: (...a) => log.push('warn: ' + a.join(' ')) },
    JSON, Math, Date, String, Object, Array, Number, RegExp, Error, Infinity,
    Utilities: {
      base64Decode: (s) => Buffer.from(s, 'base64'),
      newBlob: (data, type, name) => new Blob(data, type, name),
      formatDate: (d, tz, f) => {
        const p = new Intl.DateTimeFormat('ru-RU', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d).reduce((o, x) => (o[x.type] = x.value, o), {});
        return f.replace('yyyy', p.year).replace('MM', p.month).replace('dd', p.day).replace('HH', p.hour).replace('mm', p.minute);
      },
    },
    PropertiesService: { getScriptProperties: () => ({ getProperties: () => ({ TG_TOKEN: 'test-token', TG_CHAT_ID: '111', FORM_KEY: 'site-brief-2026' }) }) },
    Session: { getEffectiveUser: () => ({ getEmail: () => 'owner@example.com' }) },
    DriveApp: {
      getRootFolder: () => folder('root'),
      getFolderById: () => folder('byid'),
      getFileById: () => ({ moveTo: () => log.push('doc:moved') }),
    },
    DocumentApp: {
      ParagraphHeading: { TITLE: 'TITLE', HEADING2: 'HEADING2' },
      GlyphType: { BULLET: 'BULLET', NUMBER: 'NUMBER' },
      create: (title) => {
        log.push('doc:create ' + title);
        const body = {
          setMarginTop: () => body, setMarginBottom: () => body, setMarginLeft: () => body, setMarginRight: () => body,
          getNumChildren: () => docBody.length + 1, getChild: () => ({ removeFromParent: () => { } }),
          appendParagraph: (t) => para('p', t), appendListItem: (t) => para('li', t),
          appendTable: (cells) => { docBody.push({ kind: 'table', cells }); const cell = { setBackgroundColor: () => cell, editAsText: textStub }; return { setBorderColor: () => { }, getRow: () => ({ getNumCells: () => cells[0].length, getCell: () => cell }) }; },
        };
        return { getBody: () => body, saveAndClose: () => write('gdoc.json', JSON.stringify({ title, body: docBody }, null, 2)), getId: () => 'doc1', getUrl: () => 'https://docs.example/doc1' };
      },
    },
    MailApp: {
      sendEmail: (o) => {
        write('email.html', `<!-- to: ${o.to} | subject: ${o.subject} | replyTo: ${o.replyTo || ''} | attachments: ${(o.attachments || []).map((b) => b.getName()).join(', ')} -->\n` + (o.htmlBody || ''));
        log.push('mail → ' + o.to + ' (' + (o.attachments || []).length + ' вложений)');
      },
    },
    UrlFetchApp: {
      fetch: (url, o) => {
        const method = url.split('/').pop();
        if (method === 'sendMessage') {
          const p = JSON.parse(o.payload);
          fs.appendFileSync(path.join(dir, 'telegram.txt'), `── ${method} → ${p.chat_id}${p.parse_mode ? ' (' + p.parse_mode + ')' : ''}\n${p.text}\n\n`);
        } else if (method === 'sendMediaGroup') {
          const media = JSON.parse(o.payload.media);
          fs.appendFileSync(path.join(dir, 'telegram.txt'), `── ${method} → ${o.payload.chat_id}: ${media.length} файлов\n` + media.map((m) => {
            const b = o.payload[m.media.replace('attach://', '')];
            return `   ${b.getName()} (${b.getBytes().length} байт) «${m.caption}»`;
          }).join('\n') + '\n');
        } else {
          fs.appendFileSync(path.join(dir, 'telegram.txt'), `── ${method} → ${o.payload.chat_id}: ${o.payload.document.getName()} (${o.payload.document.getBytes().length} байт) «${o.payload.caption}»\n`);
        }
        return { getContentText: () => '{"ok":true,"result":[]}', getResponseCode: () => 200 };
      },
    },
    CacheService, LockService,
    SpreadsheetApp: { openById: () => ({ getSheets: () => [{ getLastRow: () => 0, appendRow: (r) => log.push('sheet ' + r.join(' | ')) }] }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (s) => ({ body: s, setMimeType() { return this; } }) },
  };
  vm.createContext(ctx);
  const gs = (fs.existsSync(path.join(root, 'apps-script', 'Rates.local.gs')) ? ['Rates.local.gs'] : []).concat(['Proposal.gs', 'Code.gs']);
  for (const f of gs) vm.runInContext(fs.readFileSync(path.join(root, 'apps-script', f), 'utf8'), ctx, { filename: f });
  return { ctx, log, write };
}

export function runOnce(body, dir) {
  const { ctx, log, write } = makeContext(dir);
  const out = ctx.doPost({ postData: { contents: body } });
  write('log.txt', log.join('\n'));
  return JSON.parse(out.body);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
    if (req.method !== 'POST') {
      const status = new URL(req.url, 'http://x').searchParams.get('status');
      const out = makeContext(path.join(OUT, '_get')).ctx.doGet({ parameter: status ? { status } : {} });
      if (status) console.log('status?', status, '→', out.body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(out.body);
    }
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const dir = path.join(OUT, new Date().toISOString().replace(/[:.]/g, '-'));
      try {
        const body = Buffer.concat(chunks).toString('utf8');
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'request.json'), body);
        const result = runOnce(body, dir);
        console.log('→', dir, JSON.stringify(result));
        if (lose > 0) {
          lose--;
          console.log('   (ответ «потерян» — как у Google)');
          res.removeHeader('Access-Control-Allow-Origin');
          res.writeHead(404, { 'Content-Type': 'text/html' });
          return res.end('<html>Seite nicht gefunden</html>');
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: String(err) }));
      }
    });
  }).listen(PORT, () => console.log('GAS mock on http://localhost:' + PORT));
}
