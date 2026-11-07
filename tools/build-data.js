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

// Kiểm tra bài ca làm (xem tools/validate-jobs.js): mỗi câu hỏi đúng 1 đáp án đúng, nhân vật và địa điểm có thật
const { errors } = require('./validate-jobs').validate(jobs);
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
console.log(`Đã tạo js/data.bundle.js: ${words.length} từ từ ${files.length} file, ${bundle.placement.length} câu xếp bậc, ${bundle.quests.main.length} nhiệm vụ chính, ${Object.values(jobs).reduce((n, j) => n + j.roles.reduce((m, r) => m + r.lessons.length, 0), 0)} bài ca làm.`);
