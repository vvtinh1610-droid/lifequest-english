/* Thuyết minh tiếng Anh: mọi hành động đều có một câu tiếng Anh được đọc to,
   kèm phụ đề Anh + Việt ở cuối màn hình. Hướng dẫn từng khu vực (song ngữ, tự đọc). */
(function (LQ) {
  'use strict';

  // ---------- Kho câu thuyết minh ----------
  // Mỗi câu: [tiếng Anh, tiếng Việt]. {n}, {w}, {a} được thay khi dùng.
  LQ.LINES = {
    mineWelcome: [['Welcome to the mine! Tap a rock, then press Dig.', 'Chào mừng đến hầm mỏ! Chạm vào một tảng đá, rồi bấm Đào.'],
      ['Back to the mine. Let\'s find something!', 'Quay lại hầm mỏ. Tìm gì đó nào!'],
      ['Ready to dig? Pick a rock!', 'Sẵn sàng đào chưa? Chọn một tảng đá!']],
    pickRock: [['Let\'s dig this rock.', 'Đào tảng này nào.'], ['This one looks good.', 'Tảng này trông được đấy.'],
      ['Over here!', 'Bên này!'], ['I like this rock.', 'Tôi thích tảng này.']],
    hit: [['Dig!', 'Đào!'], ['Keep digging!', 'Đào tiếp đi!'], ['Harder!', 'Mạnh lên!'], ['Again!', 'Thêm lần nữa!'],
      ['Come on, dig!', 'Cố lên, đào đi!']],
    almost: [['Almost there!', 'Sắp được rồi!'], ['One more hit!', 'Thêm một nhát nữa!'], ['It\'s cracking!', 'Nó nứt rồi!']],
    gold: [['Gold! You found {n} gold coins!', 'Vàng! Bạn tìm được {n} đồng vàng!'],
      ['Shiny! {n} gold coins for you!', 'Lấp lánh quá! {n} đồng vàng cho bạn!']],
    found: [['You found {a}!', 'Bạn tìm được {w}!'], ['Look! It\'s {a}!', 'Nhìn kìa! Là {w}!'], ['Nice! {A}!', 'Tuyệt! {W}!']],
    nothing: [['Just rocks. Try another one!', 'Toàn đá thôi. Thử tảng khác nhé!'], ['Nothing here. Keep going!', 'Không có gì. Tiếp tục nào!'],
      ['Empty! Don\'t give up!', 'Trống trơn! Đừng bỏ cuộc!']],
    chest: [['Wow! A treasure chest!', 'Wow! Một rương kho báu!']],
    combo: [['Lucky streak! Three in a row!', 'Đang hên! Trúng ba lần liên tiếp!']],
    noEnergy: [['You\'re out of energy. Go and eat something.', 'Bạn hết năng lượng rồi. Đi ăn gì đó đi.']],
    bagFull: [['Your bag is full! Go and sell at the market.', 'Túi đầy rồi! Ra chợ bán đi.']],
    bagFullEarly: [['Your bag is full! Drop something you don\'t need.', 'Túi đầy rồi! Bỏ bớt món không cần.']],
    marketWelcome: [['Welcome to the market! Listen to the customer.', 'Chào mừng ra chợ! Nghe khách nói nhé.']],
    sold: [['Thank you! Here\'s your money.', 'Cảm ơn! Tiền của bạn đây.'], ['Great, thanks a lot!', 'Tuyệt, cảm ơn nhiều!'],
      ['Perfect! Have a nice day!', 'Đúng rồi! Chúc một ngày tốt lành!']],
    foodWelcome: [['Hungry? Buy some food to get energy.', 'Đói không? Mua đồ ăn để có năng lượng.']],
    full: [['You\'re full! Your energy is already high.', 'Bạn no rồi! Năng lượng vẫn còn đầy.']],
    eat: [['Yummy! You feel strong again.', 'Ngon quá! Bạn thấy khỏe lại rồi.']],
    sleep: [['Good night! Sleep well.', 'Chúc ngủ ngon!']],
    roomWelcome: [['This is your room. Rest here when you are tired.', 'Đây là phòng của bạn. Mệt thì nghỉ ở đây.']],
    shiftStart: [['Your shift starts now. Good luck!', 'Ca làm bắt đầu rồi. Chúc may mắn!']],
    shiftEnd: [['Your shift is over. Good job!', 'Hết ca rồi. Làm tốt lắm!']],
    levelUp: [['Level up! You are now level {n}!', 'Lên cấp! Bạn đã lên cấp {n}!']],
    newRegion: [['A new place is open: {w}!', 'Mở khu vực mới: {w}!']],
    locked: [['This place is locked for now.', 'Khu vực này chưa mở.']],
  };

  const fill = (s, v) => s.replace(/\{(\w)\}/g, (m, k) => (v && v[k] != null ? v[k] : m));
  // Lấy một câu ngẫu nhiên trong nhóm, thay biến
  LQ.line = (key, vars) => {
    const set = LQ.LINES[key];
    if (!set) return null;
    const [en, vi] = LQ.pick(set);
    return { en: fill(en, vars), vi: fill(vi, vars) };
  };

  // ---------- Phụ đề + giọng đọc ----------
  let hideTimer = null;
  // opts.queue: đọc nối tiếp, không cắt câu đang đọc. opts.silent: chỉ hiện phụ đề.
  LQ.narrate = (en, vi, opts) => {
    opts = opts || {};
    if (!en) return;
    if (!opts.silent) (opts.queue ? LQ.speakNext : LQ.speak)(en);
    const bar = LQ.$('#narrator');
    if (!bar) return;
    bar.innerHTML = `<span class="n-ic">🔊</span><div class="grow"><b>${LQ.esc(en)}</b>${vi ? `<span class="vi">${LQ.esc(vi)}</span>` : ''}</div>`;
    bar.dataset.text = en;
    bar.classList.remove('hidden', 'out');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => bar.classList.add('out'), Math.max(3500, en.length * 110));
  };
  // Thuyết minh theo kho câu
  LQ.say = (key, vars, opts) => { const l = LQ.line(key, vars); if (l) LQ.narrate(l.en, l.vi, opts); return l; };
  LQ.act.narratorReplay = (d, el) => LQ.speak(el.dataset.text);

  // Mạo từ cho từ tiếng Anh: a pot, an apple, some chopsticks, some fish
  const UNCOUNT = ['fish', 'meat', 'chicken', 'cash', 'garlic', 'treasure', 'rice', 'water', 'money', 'noodles', 'bling', 'loot'];
  LQ.isPlural = w => /s$/.test(w) && !/ss$/.test(w) && !/^(glass|bus)$/.test(w);
  LQ.isUncount = w => UNCOUNT.includes(w.toLowerCase()) || /^bunch of/.test(w);
  LQ.art = w => {
    if (LQ.isUncount(w) || LQ.isPlural(w)) return /^bunch of/.test(w) ? 'a ' + w : 'some ' + w;
    return (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
  };
  LQ.cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  // ---------- Hướng dẫn từng khu vực (song ngữ, tự đọc tiếng Anh) ----------
  const GUIDES = {
    map: { title: 'Bản đồ', icon: '🗺️', steps: [
      ['This is the map. Tap a place to go there.', 'Đây là bản đồ. Chạm vào một nơi để đi tới.'],
      ['Start at the mine. Dig rocks to find gold and things.', 'Bắt đầu ở hầm mỏ. Đào đá để tìm vàng và đồ vật.'],
      ['Every thing you find is a new English word.', 'Mỗi món bạn tìm được là một từ tiếng Anh mới.'],
      ['Level up to open new places.', 'Lên cấp để mở thêm nơi mới.'],
    ] },
    dig: { title: 'Hầm mỏ', icon: '⛏️', steps: [
      ['Tap a rock. Your character will walk to it.', 'Chạm vào một tảng đá. Nhân vật sẽ đi tới đó.'],
      ['Press the Dig button to hit the rock.', 'Bấm nút Đào để đập tảng đá.'],
      ['You can find gold, things, or a treasure chest.', 'Bạn có thể tìm được vàng, đồ vật, hoặc rương kho báu.'],
      ['Listen to every word. Sell your things at the market.', 'Nghe kỹ từng từ. Mang đồ ra chợ bán.'],
    ] },
    market: { title: 'Chợ', icon: '🧺', steps: [
      ['A customer will tell you what they need.', 'Khách sẽ nói họ cần gì.'],
      ['Listen carefully, then tap the right thing in your bag.', 'Nghe kỹ, rồi chạm đúng món trong túi.'],
      ['Right the first time? You get the most money.', 'Đúng ngay lần đầu? Bạn được nhiều tiền nhất.'],
      ['Buy food here when you need energy.', 'Mua đồ ăn ở đây khi cần năng lượng.'],
    ] },
    job: { title: 'Ca làm', icon: '💼', steps: [
      ['A shift is a set of real work situations.', 'Một ca làm là một chuỗi tình huống công việc thật.'],
      ['Listen, read, and choose the right answer.', 'Nghe, đọc và chọn câu trả lời đúng.'],
      ['Every right answer gives you money.', 'Mỗi câu đúng được trả tiền công.'],
      ['No mistakes? You get a big tip!', 'Không sai câu nào? Bạn được tip lớn!'],
    ] },
    home: { title: 'Xóm trọ', icon: '🏚️', steps: [
      ['This is your room. Sleep here to get full energy.', 'Đây là phòng của bạn. Ngủ ở đây để hồi đầy năng lượng.'],
      ['Words you know well appear in your room.', 'Những từ bạn đã thuộc sẽ xuất hiện trong phòng.'],
      ['Save money to move to a better room.', 'Để dành tiền để chuyển sang phòng tốt hơn.'],
    ] },
  };
  LQ.guide = key => {
    const g = GUIDES[key];
    if (!g) return;
    LQ.state.seenIntro[key] = true;
    LQ.save();
    LQ.modal(`<div class="center" style="font-size:44px">${g.icon}</div>
      <h2 class="center">Hướng dẫn: ${LQ.esc(g.title)}</h2>
      <div class="guide">${g.steps.map(([en, vi], i) => `
        <div class="guide-step"><span class="num">${i + 1}</span>
          <div class="grow"><b>${LQ.esc(en)}</b><span class="vi">${LQ.esc(vi)}</span></div>
          <button class="icon-btn" data-act="say" data-text="${LQ.esc(en)}" aria-label="Nghe">🔊</button></div>`).join('')}</div>
      <button class="btn block" data-act="guideOk" data-en="Let's go!">Bắt đầu thôi! · Let's go!</button>`);
    LQ.speak(g.steps[0][0]);
    g.steps.slice(1).forEach(([en]) => LQ.speakNext(en));
  };
  LQ.act.guideOk = () => { LQ.closeModal(); if (LQ.speakNext) LQ.speakNext('Let\'s go!'); };
  LQ.act.guide = d => LQ.guide(d.key);
  // Lần đầu vào khu vực thì tự mở hướng dẫn
  LQ.firstVisit = key => {
    if (LQ.state.seenIntro[key]) return false;
    setTimeout(() => { if (!LQ.$('#modal-root').innerHTML) LQ.guide(key); }, 250);
    return true;
  };
  LQ.helpBtn = key => `<button class="icon-btn help" data-act="guide" data-key="${key}" data-en="Help" aria-label="Hướng dẫn">❓</button>`;
})(window.LQ);
