#!/usr/bin/env node
// Gộp file bài ca làm do Gemini viết vào data/jobs.json (có kiểm tra lỗi trước khi ghi).
// Dùng: node tools/merge-jobs.js <file-gemini.json> [--dry]
// Định dạng file Gemini (xem docs/gemini/README.md):
//   { "job": "restaurant", "places": {...thêm mới...}, "cast": {...thêm mới...},
//     "roles": [ { "id": "dish", "icon": "🧽", "en": "...", "vi": "...", "desc": "...", "lessons": [ ... ] } ] }
// - Vị trí (role) đã có: bài trùng id thì THAY, bài mới thì THÊM vào cuối (giữ thứ tự trong file Gemini).
// - Vị trí chưa có: thêm mới. places / cast: thêm hoặc ghi đè theo khóa.
const fs = require('fs');
const path = require('path');
const { validate } = require('./validate-jobs');

const file = process.argv[2];
const dry = process.argv.includes('--dry');
if (!file) { console.log('Dùng: node tools/merge-jobs.js <file.json> [--dry]'); process.exit(1); }

const jobsPath = path.join(__dirname, '..', 'data', 'jobs.json');
const jobs = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));
let add;
try { add = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { console.log('File không phải JSON hợp lệ: ' + e.message); process.exit(1); }
const batches = Array.isArray(add) ? add : [add];

const report = [];
for (const b of batches) {
  if (!b.job) { console.log('Thiếu "job" (restaurant / delivery / ...)'); process.exit(1); }
  const j = jobs[b.job] || (jobs[b.job] = { places: {}, cast: {}, roles: [] });
  Object.assign(j.places, b.places || {});
  Object.assign(j.cast, b.cast || {});
  for (const r of b.roles || []) {
    let role = j.roles.find(x => x.id === r.id);
    if (!role) {
      role = { id: r.id, icon: r.icon, en: r.en, vi: r.vi, desc: r.desc, lessons: [] };
      j.roles.push(role);
      report.push(`+ vị trí mới: ${b.job}/${r.id} (${r.vi})`);
    } else for (const f of ['icon', 'en', 'vi', 'desc']) if (r[f]) role[f] = r[f];
    // "replaceLessons": true → bỏ hết bài cũ của vị trí này, dùng bộ bài mới (khi Gemini viết lại cả vị trí)
    if (r.replaceLessons) { report.push(`! bỏ ${role.lessons.length} bài cũ của ${r.id}`); role.lessons = []; }
    for (const l of r.lessons || []) {
      const k = role.lessons.findIndex(x => x.id === l.id);
      if (k >= 0) { role.lessons[k] = l; report.push(`~ thay bài ${l.id}: ${l.title}`); }
      else { role.lessons.push(l); report.push(`+ thêm bài ${l.id}: ${l.title}`); }
    }
  }
}

const { errors, warns } = validate(jobs);
report.forEach(x => console.log(x));
errors.forEach(e => console.log('ERROR ' + e));
warns.forEach(w => console.log('warn  ' + w));
if (errors.length) { console.log(`\n✖ ${errors.length} lỗi — CHƯA gộp. Sửa file rồi chạy lại.`); process.exit(1); }
if (dry) { console.log('\n(--dry) Không ghi file.'); process.exit(0); }
fs.writeFileSync(jobsPath, JSON.stringify(jobs, null, 2) + '\n');
console.log(`\n✔ Đã gộp vào data/jobs.json (${warns.length} cảnh báo). Tiếp theo: node tools/build-data.js, rồi thu âm (node tools/list-speech.js + make-audio.py).`);
