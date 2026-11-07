#!/usr/bin/env node
// Liệt kê MỌI câu tiếng Anh mà game có thể đọc to, để thu âm sẵn bằng tools/make-audio.py.
// Chạy game trong môi trường giả lập (không cần trình duyệt), rồi gom câu từ:
// từ vựng + câu ví dụ, kho câu thuyết minh, hướng dẫn, lời khách ở chợ, lời dẫn ca làm, bài xếp bậc, nhãn nút (data-en).
// Chạy: node tools/list-speech.js  → ghi tools/speech-list.json
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);

const noop = () => {};
const el = () => ({ classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, innerHTML: '', dataset: {}, style: {} });
const ctx = {
  console, setTimeout: noop, setInterval: noop, clearTimeout: noop, requestAnimationFrame: noop,
  document: { readyState: 'loading', addEventListener: noop, querySelector: el, querySelectorAll: () => [], createElement: el, hidden: false },
  localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
  location: { search: '', hostname: 'localhost' },
};
ctx.window = ctx;
vm.createContext(ctx);
for (const s of scripts) {
  if (/audio\.index\.js$/.test(s)) continue;
  vm.runInContext(fs.readFileSync(path.join(root, s), 'utf8'), ctx, { filename: s });
}
const LQ = ctx.LQ;
LQ.indexWords();
LQ.state = LQ.defaultState();

const out = new Set();
const add = t => { if (t && /[a-z]/i.test(t)) out.add(String(t).trim().replace(/\s+/g, ' ')); };
const C = LQ.CONFIG;

// 1. Từ vựng: từ + câu ví dụ
for (const w of LQ.words) { add(w.word); add(w.example); }

// 2. Kho câu thuyết minh (thay biến)
const diggable = LQ.words.filter(LQ.isDiggable);
for (const [key, set] of Object.entries(LQ.LINES)) {
  for (const [en] of set) {
    if (/\{n\}/.test(en)) {
      const max = key === 'gold' ? 80 : 20;
      for (let n = 1; n <= max; n++) add(en.replace('{n}', n));
    } else if (/\{[aAwW]\}/.test(en)) {
      if (key === 'newRegion') continue;
      for (const w of diggable) {
        const a = LQ.art(w.word);
        add(en.replace('{a}', a).replace('{A}', LQ.cap(a)));
      }
    } else add(en);
  }
}

// 3. Câu đọc trong code có ghép từ: đào trúng, rương kho báu, khách chê, mua đồ ăn, mở khu vực
for (const w of diggable) {
  const a = LQ.art(w.word.toLowerCase());
  add(`Wow! A treasure chest! Gold and ${LQ.art(w.word)}!`);
  add(`No, not that one. I need ${a}.`);
  for (const l of LQ.customerLines(w)) add(l);
}
for (const f of C.foods) add(`One ${f.word}, please.`);
for (const r of C.regions) { add(r.en); add(`A new place is open: ${r.en}!`); }
for (const j of Object.values(C.jobs)) j.lines.forEach(add);

// 3b. Tình huống ca làm nhập vai (data/jobs.json): lời thoại, câu hỏi, đáp án, lời giải thích
for (const j of Object.values(ctx.LQ_DATA.jobs || {})) {
  for (const sc of j.scenes) for (const st of sc.steps) {
    if (st.ask) { add(st.ask); for (const o of st.options) { add(o.en); add(o.why); } } else add(st.en);
  }
}

// 4. Bài xếp bậc (câu nghe)
for (const q of ctx.LQ_DATA.placement) add(q.audioText);

// 5. Câu cố định trong code: nhãn nút data-en, LQ.narrate('...'), LQ.speak('...'), hướng dẫn
const jsFiles = [];
const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
  const p = path.join(d, e.name);
  if (e.isDirectory()) walk(p); else if (/\.js$/.test(e.name) && !/(data\.bundle|audio\.index)\.js$/.test(e.name)) jsFiles.push(p);
});
walk(path.join(root, 'js'));
for (const f of jsFiles) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/data-en="([^"$]+)"/g)) add(m[1]);
  for (const m of src.matchAll(/LQ\.(?:speak|speakNext|narrate)\(\s*'((?:[^'\\]|\\.)+)'/g)) add(m[1].replace(/\\'/g, "'"));
  for (const m of src.matchAll(/LQ\.narrate\([^'`]*\?\s*'((?:[^'\\]|\\.)+)'\s*:\s*'((?:[^'\\]|\\.)+)'/g)) { add(m[1].replace(/\\'/g, "'")); add(m[2].replace(/\\'/g, "'")); }
  // Hướng dẫn: các cặp ['English.', 'Tiếng Việt.'] trong narration.js
  if (/narration\.js$/.test(f)) for (const m of src.matchAll(/\[\s*'((?:[^'\\]|\\.)+)',\s*'(?:[^'\\]|\\.)+'\s*\]/g)) {
    const en = m[1].replace(/\\'/g, "'");
    if (!/\{\w\}/.test(en)) add(en);
  }
}
// Nhãn tab dưới cùng
['Map', 'Quests', 'Review', 'Word book', 'Profile', 'Hello, how are you?'].forEach(add);

const list = [...out].sort();
fs.writeFileSync(path.join(__dirname, 'speech-list.json'), JSON.stringify(list, null, 1));
console.log(`Đã liệt kê ${list.length} câu cần thu âm → tools/speech-list.json`);
