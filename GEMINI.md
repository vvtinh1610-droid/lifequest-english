# LifeQuest English — hướng dẫn cho AI (Claude / Gemini)

> **Skills first, money later.** Game nhập vai cho người lớn (18+) mất gốc tiếng Anh. Người chơi sống một đời người, đi từ người lao động lên ông chủ, và học tiếng Anh qua từng công việc.
> Chủ dự án: Tinh (không phải lập trình viên). Giải thích ngắn gọn, bằng tiếng Việt, khi báo cáo cho Tinh.
> File `CLAUDE.md` và `GEMINI.md` phải luôn **giống hệt nhau**. Sửa file này thì chép sang file kia.

## Tài liệu thiết kế
Bản thiết kế đầy đủ (Claude Doc): "LifeQuest English – Tài liệu thiết kế game (bản 2)". Mục 15 là phạm vi giai đoạn 1.

## Công nghệ và cách chạy
- HTML + CSS + JavaScript thuần, **không framework, không bước build cho code**. Script thường (không dùng ES module) để mở được trực tiếp bằng `file://`.
- Mọi code nằm trong namespace toàn cục `window.LQ`. Mỗi file là một IIFE `(function (LQ) { ... })(window.LQ);`.
- Dữ liệu ở `data/*.json` được gộp thành `js/data.bundle.js` bằng `node tools/build-data.js`. **Không sửa tay `js/data.bundle.js`.**
- Chạy: mở `index.html` trong trình duyệt, hoặc đưa lên Cloudflare Pages / Netlify (thư mục gốc, không cần lệnh build).
- Lưu tiến độ: `localStorage` khóa `lifequest_save_v1`, luôn bọc `try/catch`.

## Cấu trúc
```
index.html            Khung trang, thứ tự nạp script
css/style.css         Toàn bộ giao diện (mobile-first, rộng tối đa 480px)
js/data.bundle.js     TỰ ĐỘNG TẠO từ data/
js/core/util.js       DOM, ngẫu nhiên, LQ.speak (đọc tiếng Anh), LQ.beep (âm thanh)
js/core/config.js     LQ.CONFIG: số liệu cân bằng, vùng, nghề, môn phái, phòng, đồ ăn
js/core/state.js      Trạng thái người chơi, lưu/tải, tiền, XP, năng lượng
js/core/srs.js        Chỉ mục từ, ôn tập ngắt quãng (hộp 0–5), chọn từ cho hoạt động
js/core/questions.js  Tạo câu hỏi: listen / meaning / fill / reverse
js/core/progress.js   Sự kiện LQ.emit, nhiệm vụ chính và hằng ngày
js/core/ui.js         Điều hướng LQ.go, thanh trên/dưới, modal, toast, bộ chạy câu hỏi LQ.runQuiz
js/screens/*.js       Mỗi màn hình đăng ký LQ.screens.<tên> = { render(params) → HTML, mount(params)? }
js/main.js            Khởi động
data/words/*.json     Từ vựng (mỗi chủ đề một file, 400 từ Gemini). _seed.json (nếu có) = từ mẫu tạm thời
data/placement.json   Bài xếp bậc tiếng Anh
data/quests.json      Nhiệm vụ chính (main) và hằng ngày (daily)
tools/validate-words.js  Kiểm tra file từ vựng
tools/build-data.js      Gộp dữ liệu thành js/data.bundle.js
tests/smoke.py        Chạy thử toàn bộ luồng chơi bằng Playwright, chụp ảnh vào tests/shots/
```

## Quy ước code
- Nút bấm dùng `data-act="<tên>"` + `data-*`; xử lý trong `LQ.act.<tên> = (dataset, element) => {}`. Không gắn onclick trực tiếp.
- Mọi chữ từ dữ liệu đưa vào HTML phải qua `LQ.esc()`.
- Màn hình vẽ lại bằng `LQ.render()`; sau hành động có thưởng gọi `LQ.afterAction()` (mở nhiệm vụ mới, chọn môn phái).
- Sự kiện cho nhiệm vụ: `LQ.emit(type, n)` với type: `dig, learn, sell, buyfood, review, shift_restaurant, shift_delivery, shift_any, perfect, sect, room`.
- Giao diện tiếng Việt, đơn giản, thân thiện. Nội dung học bằng tiếng Anh. Không dùng `alert/confirm/prompt`.
- Thay đổi số liệu cân bằng → sửa `js/core/config.js`, không rải số trong code.

## Thêm từ vựng (quy trình)
1. Lưu file JSON (theo mẫu bên dưới) vào `data/words/<topic>.json` (vd. `dig.json`, `market.json`).
2. Chạy `node tools/validate-words.js data/words/*.json`. Sửa hết **ERROR**. **warn** là để người xem lại (tiếng lóng, thành ngữ, trùng từ).
3. Khi đã có file thật cho một chủ đề, xóa các mục `seed_<topic>_*` tương ứng trong `data/words/_seed.json` để tránh trùng (hết mục thì xóa luôn file).
   Một chủ đề có nhiều đợt (vd. restaurant×2) thì gộp chung vào một file `<topic>.json`, giữ nguyên `id`.
4. Chạy `node tools/build-data.js`, rồi chạy thử.

Mẫu một từ (16 trường, bắt buộc đủ):
```json
{ "id": "market_001", "word": "How much is this?", "type": "phrase", "pos": "phrase", "ipa": "/haʊ mʌtʃ ɪz ðɪs/",
  "vi": "Cái này bao nhiêu tiền?", "level": 0, "region": "common", "register": "neutral", "topic": "market", "job": "none",
  "example": "Excuse me, how much is this?", "exampleVi": "Xin lỗi, cái này bao nhiêu tiền?",
  "blankExample": "Excuse me, ___?", "blankAnswer": "how much is this", "emoji": "💵" }
```
- `type`: word | collocation | phrase | idiom | slang · `level`: 0–4 · `region`: common | US | UK | AU | SG | IN
- `register`: formal | neutral | informal | slang · `job`: none | restaurant | delivery
- Điền `blankAnswer` vào `___` của `blankExample` phải ra đúng `example` (không tính dấu câu cuối).
- Chủ đề đang dùng: `home, dig, market, restaurant, city, delivery, work`. Đồ đào được lấy từ chủ đề `dig` (danh từ có emoji).

## Trạng thái giai đoạn 1
Đã xong:
- [x] Tạo nhân vật (giới tính, dáng người, tính cách), bài xếp bậc (10 câu mẫu)
- [x] Bản đồ 6 vùng mở theo cấp: Xóm trọ, Bãi đào, Chợ (cấp 3), Nhà hàng (5), Thành phố (8), Sân bay (khóa)
- [x] Bãi đào (vàng / đồ vật = từ mới), túi đồ 10 ô; Chợ bán theo lời khách nói + mua đồ ăn
- [x] Ca nhà hàng, ca giao hàng (6 câu, tiền công, tip), chọn môn phái ở cấp 10
- [x] Cấp 1–20, năng lượng hồi theo thời gian, ngủ, nâng cấp phòng, đồ đã thuộc hiện trong phòng
- [x] 7 nhiệm vụ chính, nhiệm vụ hằng ngày, ôn tập ngắt quãng, sổ từ, hồ sơ, sao chép kết quả gửi Zalo
- [x] Từ vựng Gemini 8 đợt (400 từ: home, dig, market, restaurant×2, city, delivery, work) trong `data/words/`, đã bỏ từ mẫu

Việc tiếp theo:
- [ ] Thay `data/placement.json` bằng 40 câu của Gemini
- [ ] Nhiệm vụ nghề có hội thoại riêng (khách gọi món nhiều bước, chỉ đường trên bản đồ) — cần thiết kế định dạng `data/jobs.json`
- [ ] Gắn Cloudflare Web Analytics vào `index.html`
- [ ] Thử kín với 20–50 người, đo tỉ lệ quay lại ngày hôm sau
