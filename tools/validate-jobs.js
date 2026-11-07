#!/usr/bin/env node
// Kiểm tra dữ liệu ca làm (data/jobs.json hoặc một file bài do Gemini viết).
// Dùng: node tools/validate-jobs.js [file.json]   (mặc định data/jobs.json)
// Trả về danh sách lỗi (ERROR, phải sửa) và cảnh báo (warn, nên xem lại).
const fs = require('fs');
const path = require('path');

function validate(jobs) {
  const errors = [], warns = [];
  const allIds = new Set();
  for (const [job, j] of Object.entries(jobs)) {
    if (!j.places || !j.cast) errors.push(`${job}: thiếu "places" hoặc "cast"`);
    if (!Array.isArray(j.roles) || !j.roles.length) { errors.push(`${job}: thiếu "roles"`); continue; }
    for (const r of j.roles) {
      for (const f of ['id', 'icon', 'en', 'vi', 'desc']) if (!r[f]) errors.push(`${job}/${r.id || '?'}: vị trí thiếu "${f}"`);
      if (!Array.isArray(r.lessons) || !r.lessons.length) errors.push(`${job}/${r.id}: vị trí chưa có bài nào`);
      for (const sc of r.lessons || []) {
        const where = `${job}/${r.id}/${sc.id || '?'}`;
        if (!sc.id || !sc.title || !sc.place || !Array.isArray(sc.steps)) { errors.push(`${where}: bài thiếu id/title/place/steps`); continue; }
        if (allIds.has(sc.id)) errors.push(`${where}: trùng id bài`);
        allIds.add(sc.id);
        if (!j.places || !j.places[sc.place]) errors.push(`${where}: không có địa điểm "${sc.place}" trong places`);
        const cast = Object.assign({}, j.cast, sc.cast || {});
        let asks = 0;
        sc.steps.forEach((st, i) => {
          const tag = `${where} bước ${i + 1}`;
          if (st.who && st.who !== 'narrator' && !cast[st.who]) errors.push(`${tag}: không có nhân vật "${st.who}"`);
          if (st.enter && !cast[st.enter]) errors.push(`${tag}: không có nhân vật "${st.enter}" để bước vào`);
          if (st.ask) {
            asks++;
            if (!st.vi) errors.push(`${tag}: câu hỏi thiếu "vi"`);
            const opts = st.options || [];
            const ok = opts.filter(o => o.ok).length;
            if (ok !== 1) errors.push(`${tag}: cần đúng 1 lựa chọn "ok": true (đang có ${ok})`);
            if (opts.length < 2) errors.push(`${tag}: cần ít nhất 2 lựa chọn`);
            if (opts.length > 4) warns.push(`${tag}: hơn 4 lựa chọn, đọc to sẽ dài`);
            for (const o of opts) {
              if (!o.en || !o.vi || !o.why || !o.whyVi) errors.push(`${tag}: lựa chọn "${o.en || '?'}" thiếu en/vi/why/whyVi`);
              if (!o.emoji) warns.push(`${tag}: lựa chọn "${o.en}" chưa có emoji`);
            }
            if (/\d/.test(st.ask)) warns.push(`${tag}: câu hỏi có chữ số, nên viết bằng chữ để đọc to tự nhiên`);
          } else {
            if (!st.en || !st.vi) errors.push(`${tag}: câu thoại thiếu en/vi`);
            if (!st.who) errors.push(`${tag}: câu thoại thiếu "who"`);
          }
          const en = st.ask || st.en || '';
          if (en.split(/\s+/).length > 22) warns.push(`${tag}: câu dài (${en.split(/\s+/).length} từ), nên ngắn hơn`);
        });
        if (asks < 3) warns.push(`${where}: chỉ có ${asks} câu hỏi, bài nên có 5–10 câu hỏi`);
      }
    }
  }
  return { errors, warns };
}
module.exports = { validate };

if (require.main === module) {
  const file = process.argv[2] || path.join(__dirname, '..', 'data', 'jobs.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const { errors, warns } = validate(data);
  errors.forEach(e => console.log('ERROR ' + e));
  warns.forEach(w => console.log('warn  ' + w));
  console.log(`${errors.length} lỗi, ${warns.length} cảnh báo`);
  process.exit(errors.length ? 1 : 0);
}
