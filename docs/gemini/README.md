# Giao việc cho Gemini: viết bài ca làm và từ vựng

**Chia việc:** Gemini viết nội dung số lượng lớn (giáo trình, bài học, câu hỏi, từ vựng, emoji).
Claude Code là trưởng nhóm: đặt khung, kiểm tra, sửa lỗi, gộp vào game, thu âm, chạy thử, commit.

## Quy trình mỗi đợt
1. Tinh copy **một prompt** bên dưới (đúng đợt) dán vào Gemini.
2. Gemini trả về JSON → tải về / lưu thành file `.json` trong `Downloads`.
3. Nói với Claude Code: **"Gộp file `<tên file>` của Gemini"**.
4. Claude Code chạy `node tools/merge-jobs.js <file> --dry` (bài) hoặc `node tools/validate-words.js` (từ vựng),
   đọc soát nội dung, sửa lỗi, gộp, build, thu âm, chạy thử rồi commit.

Thứ tự: **Prompt 1** (giáo trình, làm 1 lần cho mỗi nghề) → Claude Code duyệt → **Prompt 2** nhiều đợt (bài học) và **Prompt 3** nhiều đợt (từ vựng).

---

## Prompt 1 — Giáo trình nghề nhà hàng (làm 1 lần)

```
Bạn là chuyên gia đào tạo nhân viên nhà hàng ở Mỹ/Úc và là giáo viên tiếng Anh cho người Việt mất gốc (18+).
Tôi đang làm game học tiếng Anh "LifeQuest English": người chơi đi làm trong nhà hàng, học tiếng Anh QUA từng thao tác nghề thật.

Hãy lập GIÁO TRÌNH CHI TIẾT cho nghề nhà hàng, chia theo VỊ TRÍ (role). Gồm ít nhất các vị trí:
dish (Rửa chén), busser (Dọn bàn), host (Đón khách/Lễ tân), wait (Phục vụ bàn), barista (Pha chế cà phê/đồ uống),
cashier (Thu ngân), cook (Phụ bếp/sơ chế), linecook (Đầu bếp đứng bếp), clean (Vệ sinh nhà hàng), manager (Quản lý ca).
Mỗi vị trí 12–20 bài, đi từ ngày đầu đi làm đến thành thạo. Mỗi bài là MỘT công việc cụ thể, chia nhỏ tới từng thao tác tay
(ví dụ rửa chảo: chọn mặt nhám của mút → không dùng búi sắt cho chảo chống dính → chà trong, ngoài, đáy, cán → chỗ cháy chà mạnh,
chỗ khác chà nhẹ → xả → còn nhờn thì chà lại → lau khô → treo lên móc). Có cả an toàn, vệ sinh, giao tiếp với đồng nghiệp/khách,
xử lý sự cố, và các đồ vật/dụng cụ có thật trong nhà hàng.

Chỉ trả về JSON (không giải thích), đúng dạng:
{
  "job": "restaurant",
  "roles": [
    { "id": "dish", "icon": "🧽", "en": "Dishwasher", "vi": "Rửa chén", "desc": "1 câu tiếng Việt mô tả vị trí",
      "lessons": [
        { "id": "dish_01", "title": "Tên bài tiếng Việt", "place": "sink",
          "actions": ["8–12 thao tác/tình huống chi tiết, viết tiếng Việt, đúng thứ tự làm"],
          "vocab": ["15–25 từ/cụm từ tiếng Anh chính của bài, dạng 'english = tiếng Việt'"] }
      ] }
  ]
}
Quy định: id bài = <id vị trí>_<2 chữ số> (dish_01, dish_02…). "place" chọn trong: door, dining, table, kitchen, fridge, sink,
counter, bar, storage, restroom, office, backdoor (hoặc đề xuất địa điểm mới, ghi kèm "newPlaces": {"id": {"en","vi","props":"3–5 emoji"}}).
Vì dài, hãy trả lời theo từng phần: lần này chỉ làm 3 vị trí đầu (dish, busser, host). Tôi sẽ nói "tiếp" để làm các vị trí sau.
```

---

## Prompt 2 — Viết bài học (mỗi đợt 2 bài)

Dán kèm phần giáo trình của 2 bài cần viết (lấy từ kết quả Prompt 1 đã được duyệt).

```
Bạn viết bài học nhập vai cho game học tiếng Anh "LifeQuest English" (người học: người Việt mất gốc, 18+).
Người chơi đang làm vị trí <ĐIỀN VỊ TRÍ> trong nhà hàng. Mỗi bài: nhân vật nói, rồi HỎI người chơi phải làm gì / nói gì,
người chơi chọn 1 trong 2–3 lựa chọn. Sai thì được giải thích lý do.

Viết 2 bài sau, dựa đúng giáo trình:
<DÁN 2 BÀI TỪ GIÁO TRÌNH: id, title, place, actions, vocab>

YÊU CẦU NỘI DUNG
- Dạy TAY NGHỀ THẬT, chi tiết từng thao tác theo đúng thứ tự trong "actions". Mỗi bài 8–12 câu hỏi ("ask").
- Câu hỏi do CHÍNH NHÂN VẬT nói ("who" + "ask"), ví dụ: "Good. Now, how much soap do you use?" — không viết câu hỏi cụt kiểu "How much soap?".
- Xen 1–3 câu thoại dẫn dắt ("who" + "en"), nhưng KHÔNG viết 2 câu thoại liền nhau nếu có thể gộp vào câu hỏi.
- Lựa chọn sai phải là LỖI NGƯỜI MỚI HAY MẮC thật sự (không vô lý kiểu "dùng gối để lau sàn").
- "why" giải thích ngắn bằng tiếng Anh dễ (vì sao đúng / vì sao sai), "whyVi" dịch tự nhiên.
- Tiếng Anh đơn giản, tự nhiên, câu ≤ 15 từ. Số viết bằng chữ ("fifteen minutes", không "15 minutes").
- Tiếng Việt tự nhiên, xưng hô trong nhà hàng (anh/chị/em, quý khách).
- Dùng nhiều từ trong "vocab" của bài, đặt trong câu có ngữ cảnh.
- Mỗi lựa chọn có 1 emoji minh họa đúng nghĩa.
- Không dùng tên thương hiệu, không nội dung nhạy cảm.

NHÂN VẬT có sẵn (dùng khóa bên trái cho "who"/"enter"):
manager (🧑‍💼 Manager), senior (👩‍🦱 Mai – đàn chị), chef (👨‍🍳 Chef), customer (🧑 Customer), narrator (lời dẫn, không có mặt).
Có thể thêm nhân vật riêng cho bài bằng "cast": { "khóa": { "face": "emoji", "en": "Tên", "vi": "Tên" } }.

ĐỊNH DẠNG — chỉ trả về JSON, không giải thích, không chú thích:
{
  "job": "restaurant",
  "roles": [ { "id": "<id vị trí>", "icon": "<emoji>", "en": "<English>", "vi": "<Tiếng Việt>", "desc": "<1 câu>",
    "lessons": [
      { "id": "dish_03", "title": "Rửa đĩa cho sạch bóng", "place": "sink",
        "steps": [
          { "who": "senior", "en": "Now let's wash the plates. Take the sponge.", "vi": "Giờ mình rửa đĩa. Cầm miếng mút lên.", "enter": "senior" },
          { "who": "senior", "ask": "How much soap do you put on the sponge?", "vi": "Em cho bao nhiêu nước rửa chén lên miếng mút?",
            "options": [
              { "emoji": "💧", "en": "A few drops", "vi": "Vài giọt", "ok": true,
                "why": "Right. A few drops are enough. Too much soap is hard to rinse.", "whyVi": "Đúng. Vài giọt là đủ. Nhiều quá khó xả sạch." },
              { "emoji": "🫗", "en": "Half the bottle", "vi": "Nửa chai",
                "why": "That's too much! It wastes soap and is hard to rinse.", "whyVi": "Nhiều quá! Phí xà bông mà khó xả sạch." }
            ] }
        ] }
    ] } ]
}
Quy tắc định dạng: mỗi "ask" có ĐÚNG 1 lựa chọn "ok": true; câu thoại phải có "who", "en", "vi"; "enter" là nhân vật bước vào khung cảnh.
```

---

## Prompt 3 — Từ vựng nhà hàng (mỗi đợt 50 từ)

```
Tạo 50 mục từ vựng tiếng Anh cho game học tiếng Anh "LifeQuest English" (người Việt mất gốc, 18+), chủ đề NHÀ HÀNG,
nhóm: <ĐIỀN NHÓM, ví dụ: dụng cụ rửa chén / đồ dùng bàn ăn / thiết bị bếp / đồ uống & quầy bar / vệ sinh & an toàn / thanh toán>.
Lấy từ danh sách "vocab" trong giáo trình nếu có: <DÁN DANH SÁCH TỪ>.
Không lặp các từ đã có: <Claude Code sẽ điền danh sách từ đã có khi cần>.
id bắt đầu từ restaurant_<SỐ BẮT ĐẦU> (3 chữ số trở lên, tăng dần).

Chỉ trả về một mảng JSON, mỗi mục ĐỦ 16 trường, đúng mẫu:
{ "id": "restaurant_101", "word": "scrubber", "type": "word", "pos": "noun", "ipa": "/ˈskrʌbər/",
  "vi": "miếng chùi nồi", "level": 1, "region": "common", "register": "neutral", "topic": "restaurant", "job": "restaurant",
  "example": "Use the scrubber for the burnt pot.", "exampleVi": "Dùng miếng chùi nồi cho cái nồi bị cháy.",
  "blankExample": "Use the ___ for the burnt pot.", "blankAnswer": "scrubber", "emoji": "🧽" }
Quy định:
- type: word | collocation | phrase | idiom | slang · pos: noun, verb, adjective, adverb, phrase… · level 0–4 (0 = dễ nhất)
- region: common | US | UK | AU · register: formal | neutral | informal | slang · topic: "restaurant" · job: "restaurant"
- Điền blankAnswer vào ___ của blankExample phải ra ĐÚNG example (chỉ khác dấu câu cuối). blankExample có đúng một ___.
- example ≤ 12 từ, là câu thật trong công việc nhà hàng. emoji đúng nghĩa (đồ vật thì dùng hình đồ vật đó).
- Chia level: khoảng 15 từ level 0, 15 level 1, 10 level 2, 6 level 3, 4 level 4.
```

---

## Ghi chú cho Claude Code khi gộp
- Bài: `node tools/merge-jobs.js <file> --dry` → xem lỗi/cảnh báo → đọc soát nội dung (đúng nghề, tiếng Anh tự nhiên, lựa chọn sai hợp lý)
  → sửa → chạy không `--dry`. Thêm `"replaceLessons": true` vào vị trí khi muốn thay toàn bộ bài cũ của vị trí đó.
- Địa điểm mới (`newPlaces` ở giáo trình) → thêm vào `places` của file trước khi gộp, và thêm màu nền `.scene.place-<id>` trong `css/style.css`.
- Từ vựng: lưu `data/words/restaurant-<nhóm>.json`, chạy `node tools/validate-words.js data/words/*.json`, sửa ERROR, xử lý trùng từ.
- Sau đó: `node tools/build-data.js` → `node tools/list-speech.js` → `tools\.venv\Scripts\python.exe tools\make-audio.py` → chạy thử → commit.
