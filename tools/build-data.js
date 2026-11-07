#!/usr/bin/env node
// Gộp toàn bộ dữ liệu JSON thành js/data.bundle.js để game chạy được cả khi mở file trực tiếp (file://).
// Chạy: node tools/build-data.js   (chạy lại mỗi khi thêm/sửa file trong data/)

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const wordsDir = path.join(root, 'data', 'words');

const words = [];
const files = fs.readdirSync(wordsDir).filter(f => f.endsWith('.json')).sort();
for (const f of files) {
  const list = JSON.parse(fs.readFileSync(path.join(wordsDir, f), 'utf8'));
  for (const w of list) words.push(w);
}

const read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const jobs = read('data/jobs.json');

// Kiểm tra tình huống ca làm: mỗi câu hỏi đúng 1 đáp án đúng, nhân vật và địa điểm có thật
const errors = [];
for (const [job, j] of Object.entries(jobs)) {
  const ids = new Set();
  for (const sc of j.scenes) {
    if (ids.has(sc.id)) errors.push(`${job}/${sc.id}: trùng id`);
    ids.add(sc.id);
    if (!j.places[sc.place]) errors.push(`${job}/${sc.id}: không có địa điểm "${sc.place}"`);
    const cast = Object.assign({}, j.cast, sc.cast || {});
    sc.steps.forEach((st, i) => {
      const tag = `${job}/${sc.id} bước ${i + 1}`;
      if (st.ask) {
        const ok = (st.options || []).filter(o => o.ok).length;
        if (ok !== 1) errors.push(`${tag}: cần đúng 1 đáp án đúng (đang có ${ok})`);
        if ((st.options || []).length < 2) errors.push(`${tag}: cần ít nhất 2 lựa chọn`);
        for (const o of st.options || []) if (!o.en || !o.vi || !o.why || !o.whyVi) errors.push(`${tag}: lựa chọn thiếu en/vi/why/whyVi`);
      } else {
        if (st.who !== 'narrator' && !cast[st.who]) errors.push(`${tag}: không có nhân vật "${st.who}"`);
        if (!st.en || !st.vi) errors.push(`${tag}: thiếu en/vi`);
      }
      if (st.enter && !cast[st.enter]) errors.push(`${tag}: không có nhân vật "${st.enter}" để bước vào`);
    });
  }
}
if (errors.length) {
  console.log('LỖI trong data/jobs.json:\n  ' + errors.join('\n  '));
  process.exit(1);
}

const bundle = {
  builtAt: new Date().toISOString(),
  words,
  placement: read('data/placement.json'),
  quests: read('data/quests.json'),
  jobs,
};

const out = '/* TỰ ĐỘNG TẠO bởi tools/build-data.js — không sửa tay. */\n' +
  'window.LQ_DATA = ' + JSON.stringify(bundle) + ';\n';
fs.writeFileSync(path.join(root, 'js', 'data.bundle.js'), out);
console.log(`Đã tạo js/data.bundle.js: ${words.length} từ từ ${files.length} file, ${bundle.placement.length} câu xếp bậc, ${bundle.quests.main.length} nhiệm vụ chính, ${Object.values(jobs).reduce((n, j) => n + j.scenes.length, 0)} tình huống ca làm.`);
