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

## Prompt 1 — Giáo trình nghề nhà hàng (mỗi lần 1 vị trí)

Đã xong: **dish** (Rửa chén) → `docs/gemini/outlines/restaurant-dish.json` (Claude Code đã duyệt và sửa).
Làm tiếp theo **thứ tự ưu tiên** (vị trí người mới làm được trước, vị trí quản lý / chuyên gia để sau khi người chơi lên cấp):
1. Nhân viên mới: busser, host, wait, cook (commis / phụ bếp), barista, cashier, clean, runner (Food Runner), reservation, cloakroom, valet, receiving (nhận hàng)
2. Lành nghề: linecook, garde (Garde Manger), pastry, bartender, steward (Chief Steward), expo (Aboyeur / điều phối bếp)
3. Chuyên gia: saucier, poissonnier, rotisseur, sommelier, mixologist, cdp (Chef de Partie), sous (Sous Chef), headwaiter (Maître d')
4. Quản lý: manager (quản lý ca), arm (phó quản lý), banquet, exec (Bếp trưởng điều hành), gm (Giám đốc nhà hàng), fnb (Giám đốc ẩm thực)

```
Bạn là chuyên gia đào tạo nhân viên nhà hàng ở Mỹ/Úc và là giáo viên tiếng Anh cho người Việt mất gốc (18+).
Tôi đang làm game học tiếng Anh "LifeQuest English": người chơi đi làm trong nhà hàng, học tiếng Anh QUA từng thao tác nghề thật,
như đang sống và làm việc thật trong nhà hàng.

Hãy lập GIÁO TRÌNH CỰC KỲ CHI TIẾT cho vị trí: <ĐIỀN 1 VỊ TRÍ, ví dụ: busser (Dọn bàn)>.
16–20 bài, đi từ ngày đầu đi làm đến thành thạo. Mỗi bài là MỘT công việc cụ thể.

CÁCH VIẾT MỖI THAO TÁC (bắt buộc, áp dụng cho MỌI thao tác, không chỉ vài cái):
- Làm GÌ, bằng TAY nào / DỤNG CỤ gì, đặt Ở ĐÂU, theo THỨ TỰ nào.
- DẤU HIỆU THÀNH CÔNG nhìn/nghe/sờ thấy được, và DẤU HIỆU THẤT BẠI.
- Nếu thất bại thì LÀM GÌ tiếp, khi nào phải BÁO ai.
Ví dụ chuẩn: "Chấm công vào ca bằng vân tay: đặt phẳng bụng ngón trỏ vào chính giữa ô quét, giữ yên 1–2 giây.
Thành công: máy kêu 'bíp', đèn xanh, hiện tên, mã số nhân viên và giờ vào ca. Thất bại: đèn đỏ, chữ 'Error', không hiện tên
→ lau khô ngón tay, đặt lại ngay giữa ô quét; 3 lần vẫn lỗi thì báo Quản lý ca ghi giờ bằng tay."
Một thao tác có thể dài 1–3 câu. Mỗi bài 10–14 thao tác như vậy.

LUẬT NHÀ (theo chuẩn vệ sinh an toàn thực phẩm Mỹ/Úc, KHÔNG được viết trái):
- Chén dĩa, xoong chảo sau khi khử trùng thì để HONG KHÔ TỰ NHIÊN (air dry), không lau bằng khăn.
- Dao muỗng nĩa sạch cất với CÁN hướng lên; không chạm tay vào đầu ăn, miệng ly, mặt trong chén dĩa sạch.
- Ly thủy tinh, chảo chống dính: dùng mặt mềm, không dùng búi sắt. Thớt: đỏ = thịt sống, xanh lá = rau, vàng = gà, xanh dương = hải sản.
- Rửa tay 20 giây có xà phòng: khi vào ca, sau khi đi vệ sinh, sau khi chạm rác / thịt sống / tiền / điện thoại, khi thay găng.
- Không đổ dầu mỡ xuống cống. Đồ vỡ: không nhặt bằng tay không. Sàn ướt: đặt biển "Wet Floor".
- Trong bếp gọi to khi di chuyển: "Behind!", "Corner!", "Hot!", "Sharp!". Đầu bếp được gọi chung là "Chef".
- Gọi đúng chức danh: Chef / Executive Chef (bếp trưởng), Sous Chef (bếp phó), line cook (đầu bếp đứng bếp), Manager (quản lý ca).
- Có số đo thật (nhiệt độ, thời gian) thì ghi cả °F và °C.

Ngoài thao tác tay, mỗi vị trí phải có bài về: an toàn, vệ sinh, giao tiếp với đồng nghiệp / khách (câu tiếng Anh cụ thể),
xử lý sự cố thường gặp, và tên các đồ vật / dụng cụ / máy móc có thật trong khu vực làm việc.

Chỉ trả về JSON (không giải thích), đúng dạng:
{
  "job": "restaurant",
  "roles": [
    { "id": "dish", "icon": "🧽", "en": "Dishwasher", "vi": "Rửa chén", "desc": "1 câu tiếng Việt mô tả vị trí",
      "lessons": [
        { "id": "dish_01", "title": "Tên bài tiếng Việt", "place": "sink",
          "actions": ["10–14 thao tác chi tiết theo CÁCH VIẾT ở trên, tiếng Việt, đúng thứ tự làm"],
          "vocab": ["15–25 từ/cụm từ tiếng Anh chính của bài, dạng 'english = tiếng Việt'"] }
      ] }
  ]
}
Quy định: id bài = <id vị trí>_<2 chữ số> (busser_01, busser_02…). "place" chọn trong: door, dining, table, kitchen, fridge, sink,
counter, bar, storage, restroom, office, backdoor (hoặc đề xuất địa điểm mới, ghi kèm "newPlaces": {"id": {"en","vi","props":"3–5 emoji"}}).
Không lặp lại bài đã có ở vị trí khác (ví dụ chấm công, thay đồ đã có ở dish_01 thì chỉ nhắc ngắn).
Chỉ làm 1 vị trí trong lần trả lời này.
```

Nếu Gemini viết còn chung chung, gửi thêm: *"Viết lại, áp dụng CÁCH VIẾT MỖI THAO TÁC cho TẤT CẢ thao tác (làm gì, tay/dụng cụ, ở đâu,
dấu hiệu thành công, dấu hiệu thất bại, xử lý khi thất bại). Chỉ trả về JSON."*

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
- Hỏi cả DẤU HIỆU thành công / thất bại và cách xử lý (ví dụ: "The screen shows a red light and 'Error'. What do you do?").
- Đúng chuẩn vệ sinh Mỹ/Úc: chén dĩa khử trùng xong để hong khô tự nhiên (không lau khăn); dao muỗng nĩa sạch cất cán hướng lên;
  ly và chảo chống dính dùng mặt mềm; rửa tay 20 giây; không đổ dầu xuống cống; đồ vỡ không nhặt tay không; gọi đầu bếp là "Chef".
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
