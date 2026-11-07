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
js/audio.index.js     TỰ ĐỘNG TẠO bởi tools/make-audio.py: bảng tra câu tiếng Anh → file audio/<giọng>/<mã>.mp3
audio/am_adam/, audio/af_heart/   Giọng đọc thu sẵn (Kokoro): giọng nam Adam, giọng nữ Heart
js/core/util.js       DOM, ngẫu nhiên, LQ.speak / LQ.speakNext (đọc tiếng Anh), LQ.beep (âm thanh), LQ.COIN / LQ.emo (đồng vàng CSS)
js/core/config.js     LQ.CONFIG: số liệu cân bằng, vùng, nghề, môn phái, phòng, đồ ăn
js/core/state.js      Trạng thái người chơi, lưu/tải, tiền, XP, năng lượng
js/core/srs.js        Chỉ mục từ, ôn tập ngắt quãng (hộp 0–5), chọn từ cho hoạt động
js/core/questions.js  Tạo câu hỏi: listen / meaning / fill / reverse
js/core/progress.js   Sự kiện LQ.emit, nhiệm vụ chính và hằng ngày
js/core/ui.js         Điều hướng LQ.go, thanh trên/dưới, modal, toast, bộ chạy câu hỏi LQ.runQuiz
js/core/narration.js  Thuyết minh tiếng Anh + phụ đề (LQ.LINES, LQ.say, LQ.narrate), hướng dẫn từng khu (LQ.guide, LQ.helpBtn)
js/screens/*.js       Mỗi màn hình đăng ký LQ.screens.<tên> = { render(params) → HTML, mount(params)? }
js/main.js            Khởi động
data/words/*.json     Từ vựng (mỗi chủ đề một file, 400 từ Gemini). _seed.json (nếu có) = từ mẫu tạm thời
data/placement.json   Bài xếp bậc tiếng Anh
data/quests.json      Nhiệm vụ chính (main) và hằng ngày (daily)
tools/validate-words.js  Kiểm tra file từ vựng
tools/build-data.js      Gộp dữ liệu thành js/data.bundle.js
tools/list-speech.js     Liệt kê mọi câu game có thể đọc → tools/speech-list.json
tools/make-audio.py      Thu âm các câu đó bằng Kokoro (2 giọng), tạo audio/ và js/audio.index.js
tools/voice-samples.py   Tạo trang nghe thử các giọng Kokoro (audio-samples/, không đưa lên git)
tests/smoke.py        Chạy thử toàn bộ luồng chơi bằng Playwright, chụp ảnh vào tests/shots/
```

## Quy ước code
- Nút bấm dùng `data-act="<tên>"` + `data-*`; xử lý trong `LQ.act.<tên> = (dataset, element) => {}`. Không gắn onclick trực tiếp.
- Mọi chữ từ dữ liệu đưa vào HTML phải qua `LQ.esc()`.
- Màn hình vẽ lại bằng `LQ.render()`; sau hành động có thưởng gọi `LQ.afterAction()` (mở nhiệm vụ mới, chọn môn phái).
- Sự kiện cho nhiệm vụ: `LQ.emit(type, n)` với type: `dig, learn, sell, buyfood, review, shift_restaurant, shift_delivery, shift_any, perfect, sect, room`.
- Giao diện tiếng Việt, đơn giản, thân thiện. Nội dung học bằng tiếng Anh. Không dùng `alert/confirm/prompt`.
- Thay đổi số liệu cân bằng → sửa `js/core/config.js`, không rải số trong code.
- **Mọi hành động đều có thuyết minh tiếng Anh** (đọc to tự động, không đợi người chơi bấm 🔊) kèm phụ đề Việt:
  dùng `LQ.say('<nhóm câu>', vars)` với câu trong `LQ.LINES`, hoặc `LQ.narrate(en, vi)`. Đọc nối tiếp thì thêm `{ queue: true }`.
- Nút có `data-en="..."` sẽ tự đọc tên tiếng Anh khi chạm. Mỗi khu có nút ❓ (`LQ.helpBtn(key)`) và hướng dẫn song ngữ lần đầu (`LQ.firstVisit(key)`).
- Thẻ từ (`LQ.showWord`) tự đọc từ rồi câu ví dụ. Câu khách nói phải là cả câu có ngữ cảnh/lý do, không chỉ một từ.
- Không dùng emoji 🪙 trong giao diện (Android hiện màu bạc): dùng `LQ.COIN`, hoặc `LQ.emo(w.emoji)` khi in emoji của từ.

## Thêm từ vựng (quy trình)
1. Lưu file JSON (theo mẫu bên dưới) vào `data/words/<topic>.json` (vd. `dig.json`, `market.json`).
2. Chạy `node tools/validate-words.js data/words/*.json`. Sửa hết **ERROR**. **warn** là để người xem lại (tiếng lóng, thành ngữ, trùng từ).
3. Khi đã có file thật cho một chủ đề, xóa các mục `seed_<topic>_*` tương ứng trong `data/words/_seed.json` để tránh trùng (hết mục thì xóa luôn file).
   Một chủ đề có nhiều đợt (vd. restaurant×2) thì gộp chung vào một file `<topic>.json`, giữ nguyên `id`.
4. Chạy `node tools/build-data.js`.
5. Thu âm câu mới: `node tools/list-speech.js` rồi `tools\.venv\Scripts\python.exe tools\make-audio.py` (chỉ thu câu còn thiếu). Rồi chạy thử.

## Ca làm nhập vai (data/jobs.json → js/screens/shift.js)
Mỗi ca = `shiftScenes` (2) tình huống. Người chơi ở trong một khung cảnh, nghe quản lý / đồng nghiệp / khách nói, rồi chọn việc cần làm
hoặc câu cần nói. Sai thì được giải thích (Anh + Việt) và chọn lại; sai 2 lần thì hiện đáp án. Tiền công tính theo số lần đúng ngay.
```json
"restaurant": {
  "places": { "sink": { "en": "Washing area", "vi": "Khu rửa chén", "props": "🚰🫧🍽️🧽" } },
  "cast":   { "senior": { "face": "👩‍🦱", "en": "Mai (senior)", "vi": "Chị Mai" } },
  "scenes": [ { "id": "r_dishes", "level": 0, "title": "Rửa chén", "place": "sink", "cast": { ...ghi đè... },
    "steps": [
      { "who": "senior", "en": "These plates are very greasy.", "vi": "...", "enter": "senior" },
      { "ask": "What do you need to remove the grease?", "vi": "...", "options": [
        { "emoji": "🧴", "en": "Dish soap and hot water", "vi": "...", "ok": true, "why": "...", "whyVi": "..." },
        { "emoji": "💧", "en": "Cold water only", "vi": "...", "why": "Cold water alone can't remove oil.", "whyVi": "..." } ] } ] } ]
}
```
- `who`: một nhân vật trong `cast` hoặc `narrator` (lời dẫn). `enter`: nhân vật bước vào khung cảnh. Mỗi `ask` có đúng 1 lựa chọn `ok`.
- Viết như đời thật: nhân vật nói gì, người chơi phải làm gì; tình huống nhiều bước (vd. rửa chén: chọn nước rửa → dùng bao nhiêu → chùi nồi → xả, để ráo).
- `level` 0–4 theo bậc tiếng Anh. Thứ tự lựa chọn được xáo khi chơi. `node tools/build-data.js` báo lỗi nếu dữ liệu sai.
- Thêm tình huống mới → chạy lại 2 lệnh thu âm (bước 5 ở phần Thêm từ vựng).

## Giọng đọc thu sẵn (Kokoro)
- `LQ.speak(text)` tìm câu trong `js/audio.index.js` (so khớp không phân biệt hoa thường, gộp khoảng trắng) → phát `audio/<giọng>/<mã>.mp3`.
  Không có file thì tự dùng giọng của máy (speechSynthesis) và ghi vào `LQ.missingAudio` (xem trong console).
- Người chơi chọn giọng nam (Adam, `am_adam`) hoặc nữ (Heart, `af_heart`) ở màn tạo nhân vật và trong Hồ sơ (`settings.voiceGender`).
- Câu đọc to nên **cố định** (không chèn số hay tên biến đổi) để thu sẵn được. Câu có `{n}` trong `LQ.LINES` chỉ được thu với số 1–80 (vàng) và 1–20 (cấp).
  Thêm câu đọc mới → chạy lại 2 lệnh ở bước 5.
- Cài trên máy mới (một lần): `python -m venv tools\.venv`, `tools\.venv\Scripts\python.exe -m pip install kokoro-onnx soundfile`,
  tải `kokoro-v1.0.onnx` và `voices-v1.0.bin` từ github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0 vào `tools\.models\`. Cần có ffmpeg.
  Máy chưa cài vẫn chạy game bình thường; chỉ không thu được câu mới.

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
- Chủ đề đang dùng: `home, dig, market, restaurant, city, delivery, work`. Đồ đào được lấy từ chủ đề `dig` (danh từ có emoji)
  cộng danh sách `digExtraWords` trong `config.js`. Thêm đồ đào mới thì nên thêm lý do mua vào `PURPOSE` trong `js/screens/market.js`.

## Trạng thái giai đoạn 1
Đã xong:
- [x] Tạo nhân vật (giới tính, dáng người, tính cách), bài xếp bậc 40 câu Gemini (xáo đáp án, sai hết một bậc thì dừng)
- [x] Bản đồ 6 vùng mở theo cấp: Xóm trọ, Hầm mỏ, Chợ (cấp 3), Nhà hàng (5), Thành phố (8), Sân bay (khóa)
- [x] Hầm mỏ: nhân vật chạy tới tảng đá, nút ĐÀO, vàng / đồ vật / rương kho báu, chuỗi trúng liên tiếp; túi đồ 10 ô
- [x] Chợ: khách nói cả câu có lý do mua (nghe lại, nghe chậm, dịch) + mua đồ ăn
- [x] Thuyết minh tiếng Anh tự động + phụ đề cho mọi hành động; hướng dẫn song ngữ từng khu; chọn từ xen kẽ từ mới theo bậc
- [x] Giọng đọc AI thu sẵn (Kokoro, ~1.500 câu × 2 giọng nam/nữ), người chơi tự chọn giọng
- [x] Ca nhà hàng, ca giao hàng nhập vai theo tình huống thật (18 tình huống trong `data/jobs.json`), chọn môn phái ở cấp 10
- [x] Cấp 1–20, năng lượng hồi theo thời gian, ngủ, nâng cấp phòng, đồ đã thuộc hiện trong phòng
- [x] 7 nhiệm vụ chính, nhiệm vụ hằng ngày, ôn tập ngắt quãng, sổ từ, hồ sơ, sao chép kết quả gửi Zalo
- [x] Từ vựng Gemini 8 đợt (400 từ: home, dig, market, restaurant×2, city, delivery, work) trong `data/words/`, đã bỏ từ mẫu

Việc tiếp theo:
- [ ] Thêm nhiều tình huống hơn cho mỗi nghề (nhờ Gemini viết theo định dạng `data/jobs.json`), thêm nghề mới (đi học, giải trí…)
- [ ] Gắn Cloudflare Web Analytics vào `index.html`
- [ ] Thử kín với 20–50 người, đo tỉ lệ quay lại ngày hôm sau
