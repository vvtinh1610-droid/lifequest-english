/* Chợ: bán đồ cho khách nói tiếng Anh, mua đồ ăn lấy năng lượng */
(function (LQ) {
  'use strict';
  const C = () => LQ.CONFIG;
  const FACES = ['👩', '🧔', '👵', '👨‍🦱', '👩‍🦰', '🧑', '👴', '👱‍♀️', '🧕', '👨‍🦳'];

  // Khách mua để làm gì: [tiếng Anh, tiếng Việt]. Không có trong danh sách thì dùng câu chung.
  const PURPOSE = {
    pot: ['to cook soup for my family', 'để nấu canh cho cả nhà'], pan: ['to fry some eggs', 'để chiên trứng'],
    bowl: ['for my noodles', 'để ăn mì'], cup: ['for my morning coffee', 'để uống cà phê buổi sáng'],
    spoon: ['to eat my soup', 'để ăn súp'], fork: ['for dinner tonight', 'cho bữa tối nay'], knife: ['to cut some meat', 'để cắt thịt'],
    'sharp knife': ['to cut some meat', 'để cắt thịt'], plate: ['for a family party', 'cho bữa tiệc gia đình'],
    'cutting board': ['for my kitchen', 'cho căn bếp của tôi'], bottle: ['for some water', 'để đựng nước'],
    coin: ['for my collection', 'để sưu tầm'], 'gold coin': ['as a gift for my son', 'làm quà cho con trai'],
    watch: ['so I am not late for work', 'để đi làm không bị trễ'], wallet: ['for my husband', 'tặng chồng tôi'],
    'silver ring': ['for my wife', 'tặng vợ tôi'], 'plastic bag': ['to carry my things', 'để đựng đồ'],
    apple: ['for my kids', 'cho con tôi ăn'], banana: ['for breakfast', 'cho bữa sáng'], orange: ['to make some juice', 'để làm nước cam'],
    mango: ['for dessert', 'để tráng miệng'], 'bunch of grapes': ['for my grandmother', 'cho bà tôi'],
    tomato: ['for a salad', 'để làm salad'], potato: ['to make french fries', 'để làm khoai tây chiên'],
    'sweet potato': ['to bake at home', 'để nướng ở nhà'], carrot: ['for my soup', 'để nấu súp'], onion: ['for dinner tonight', 'cho bữa tối nay'],
    garlic: ['to cook fried rice', 'để nấu cơm chiên'], cabbage: ['to make soup', 'để nấu canh'], 'fresh lemon': ['for my iced tea', 'để pha trà đá'],
    hammer: ['to fix my door', 'để sửa cửa'], nail: ['to hang a picture', 'để treo tranh'], 'rusty nail': ['for an art project', 'để làm đồ thủ công'],
    treasure: ['to make my family rich', 'để cả nhà giàu lên'],
    key: ['for my new room', 'cho phòng mới'], mop: ['to clean the floor', 'để lau nhà'], broom: ['to sweep my shop', 'để quét tiệm'],
    mirror: ['for my bathroom', 'cho phòng tắm'], pillow: ['for my bed', 'cho cái giường'], blanket: ['because it is cold at night', 'vì ban đêm trời lạnh'],
    fish: ['for dinner tonight', 'cho bữa tối nay'], chopsticks: ['for my restaurant', 'cho quán ăn của tôi'], glass: ['for my orange juice', 'để uống nước cam'],
    napkin: ['for the table', 'cho bàn ăn'], noodles: ['for lunch', 'cho bữa trưa'], box: ['to pack my things', 'để đóng gói đồ'],
    parcel: ['to send to my mom', 'để gửi cho mẹ'], helmet: ['for my new job', 'cho công việc mới'], 'hard hat': ['for my new job', 'cho công việc mới'],
    uniform: ['for work tomorrow', 'để mai đi làm'], 'safety glasses': ['to protect my eyes', 'để bảo vệ mắt'],
  };
  const GENERIC = ['for my family', 'cho gia đình tôi'];

  // Mẫu câu của khách: luôn là cả câu có lý do mua (học theo cụm, không học từ đơn lẻ)
  // a = "a pot", it = "it/them", one = "one/some", vi = "cái nồi", p/pv = lý do
  const TEMPLATES = [
    v => [`Give me ${v.a}, please. I need ${v.it} ${v.p}.`, `Đưa tôi ${v.vi} nhé. Tôi cần nó ${v.pv}.`],
    v => [`Hello! I need ${v.a} ${v.p}. Do you have ${v.one}?`, `Chào bạn! Tôi cần ${v.vi} ${v.pv}. Bạn có không?`],
    v => [`Excuse me, can I buy ${v.a}? It's ${v.p}.`, `Xin lỗi, cho tôi mua ${v.vi} được không? ${LQ.cap(v.pv)}.`],
    v => [`I'm looking for ${v.a} ${v.p}.`, `Tôi đang tìm ${v.vi} ${v.pv}.`],
    v => [`Hi there! Could you sell me ${v.a}? I want ${v.it} ${v.p}.`, `Chào bạn! Bán cho tôi ${v.vi} được không? Tôi muốn mua ${v.pv}.`],
  ];
  function customerLine(w, lvl) {
    const word = w.word.toLowerCase();
    const [p, pv] = PURPOSE[word] || GENERIC;
    const many = LQ.isPlural(word) && !LQ.isUncount(word);
    const v = { a: LQ.art(word), it: many ? 'them' : 'it', one: many || LQ.isUncount(word) ? 'any' : 'one', vi: w.vi, p, pv };
    // "It's for…" chỉ hợp với lý do bắt đầu bằng "for"
    const ok = TEMPLATES.filter((t, k) => k !== 2 || /^for /.test(p));
    const t = lvl <= 0 ? TEMPLATES[0] : LQ.pick(ok);
    const [en, vi] = t(v);
    return { en, vi };
  }

  let tab = 'sell';
  let cust = null;

  function nextCustomer() {
    const bag = LQ.state.bag;
    if (!bag.length) { cust = null; return; }
    const id = LQ.pick(bag);
    const w = LQ.wordById[id];
    const lvl = LQ.state.englishLevel || 0;
    const l = customerLine(w, lvl);
    cust = { face: LQ.pick(FACES), id, line: l.en, lineVi: l.vi, tries: 0, showText: lvl <= 1, showVi: lvl <= 0 };
  }

  LQ.screens.market = {
    render() {
      if (tab === 'sell' && (!cust || !LQ.state.bag.includes(cust.id))) nextCustomer();
      return `
        <div class="row spread"><h1>🧺 Chợ</h1>
          <div class="row">${LQ.helpBtn('market')}<button class="btn small light" data-act="nav" data-to="map" data-en="Back to the map">← Bản đồ</button></div></div>
        <div class="choice-grid" style="margin:8px 0">
          <button class="choice ${tab === 'sell' ? 'on' : ''}" data-act="mkTab" data-t="sell" data-en="Sell">🛍️ Bán hàng</button>
          <button class="choice ${tab === 'food' ? 'on' : ''}" data-act="mkTab" data-t="food" data-en="Buy food">🍜 Mua đồ ăn</button>
        </div>
        ${tab === 'sell' ? sellHTML() : foodHTML()}`;
    },
    mount(params) {
      const first = !params.welcomed && LQ.firstVisit('market');
      params.welcomed = true;
      if (first) return;
      // Khách mới nói ngay (đọc nối tiếp sau câu chào nếu có)
      if (tab === 'sell' && cust && !cust.spoken) { cust.spoken = true; LQ.narrate(cust.line, cust.showVi ? cust.lineVi : '', { queue: true, silent: false }); }
    },
  };
  LQ.act.mkTab = d => { tab = d.t; LQ.render(); if (tab === 'food') LQ.say('foodWelcome', null, { queue: true }); };

  function sellHTML() {
    const s = LQ.state;
    if (!s.bag.length) {
      return `<div class="card center"><div style="font-size:48px">🎒</div><p>Túi bạn đang trống.</p>
        <button class="btn" data-act="enterRegion" data-id="dig">⛏️ Đi đào đồ</button></div>`;
    }
    const lvl = s.englishLevel || 0;
    return `
      <div class="npc"><div class="face">${cust.face}</div>
        <div class="bubble">${cust.showText ? LQ.esc(cust.line) : '<span class="muted">(Khách đang nói…)</span>'}
          ${cust.showText && cust.showVi ? `<span class="vi">${LQ.esc(cust.lineVi)}</span>` : ''}
          <div class="row wrap" style="margin-top:6px">
            <button class="btn small light" data-act="say" data-text="${LQ.esc(cust.line)}">🔊 Nghe lại</button>
            <button class="btn small light" data-act="mkSlow">🐢 Nghe chậm</button>
            ${cust.showText ? (cust.showVi ? '' : '<button class="btn small light" data-act="mkVi">🇻🇳 Dịch</button>') : '<button class="btn small light" data-act="mkShow">👀 Hiện chữ</button>'}
          </div>
          ${cust.tries > 0 ? `<span class="vi">Gợi ý: khách muốn "${LQ.esc(LQ.wordById[cust.id].vi)}"</span>` : ''}
        </div></div>
      <p class="small muted">Chạm vào món khách cần trong túi:</p>
      <div class="bag">
        ${s.bag.map((id, i) => { const w = LQ.wordById[id]; return `<button class="item" data-act="mkSell" data-i="${i}">${LQ.emo(w.emoji)}${lvl === 0 ? `<small>${LQ.esc(w.word)}</small>` : ''}</button>`; }).join('')}
      </div>
      <p class="small muted center" style="margin-top:10px">Giá bán: ${LQ.fmtMoney(C().sellPrice(lvl))} / món · Đúng ngay lần đầu được nhiều tiền nhất</p>`;
  }
  LQ.act.mkShow = () => { cust.showText = true; LQ.render(); };
  LQ.act.mkVi = () => { cust.showVi = true; LQ.render(); };
  LQ.act.mkSlow = () => LQ.speak(cust.line, 0.6);

  LQ.act.mkSell = (d, el) => {
    const s = LQ.state;
    const id = s.bag[+d.i];
    if (!cust || !id) return;
    if (id === cust.id || LQ.norm(LQ.wordById[id].word) === LQ.norm(LQ.wordById[cust.id].word)) {
      const base = C().sellPrice(s.englishLevel || 0);
      let pay = cust.tries === 0 ? base : cust.tries === 1 ? Math.round(base / 2) : Math.round(base / 3);
      let tip = 0;
      if (s.player.personality === 'funny' && Math.random() < 0.35) tip = LQ.rand(2, 6);
      if (cust.tries === 0) LQ.markResult(cust.id, true);
      s.bag.splice(+d.i, 1);
      LQ.addMoney(pay + tip);
      LQ.addXP(cust.tries === 0 ? 6 : 3);
      s.stats.sells++;
      LQ.emit('sell', 1);
      LQ.beep('coin');
      LQ.toast(`✅ Thank you! +${pay}${tip ? ` +${tip} tip 😄` : ''} ${LQ.COIN}`, 'good');
      LQ.say('sold');
      nextCustomer();
      LQ.render();   // khách mới nói tiếp ngay sau lời cảm ơn
      LQ.afterAction();
    } else {
      if (cust.tries === 0) LQ.markResult(cust.id, false);
      cust.tries++;
      cust.showText = true;
      LQ.beep('bad');
      el.classList.add('bad');
      const want = LQ.art(LQ.wordById[cust.id].word.toLowerCase());
      LQ.narrate(`No, not that one. I need ${want}.`, `Không phải món đó. Tôi cần ${LQ.wordById[cust.id].vi}.`);
      if (cust.tries >= 2) {
        LQ.render();
        const idx = s.bag.indexOf(cust.id);
        const btn = LQ.$$('.bag .item')[idx];
        if (btn) btn.classList.add('good');
      } else {
        setTimeout(() => LQ.render(), 600);
      }
    }
  };

  function foodHTML() {
    const s = LQ.state;
    return `
      <div class="card">
        <p class="small muted">Năng lượng: ⚡ ${s.energy}/${LQ.maxEnergy()} · Tiền: ${LQ.fmtMoney(s.money)}</p>
        ${C().foods.map((f, i) => `
          <div class="shop-item"><span class="big">${f.icon}</span>
            <div class="grow"><b>${LQ.esc(f.word)}</b> <button class="icon-btn" style="width:30px;height:30px;font-size:13px" data-act="say" data-text="${LQ.esc(f.word)}">🔊</button>
              <div class="small muted">${LQ.esc(f.vi)} · +${f.energy} ⚡</div></div>
            <button class="btn small ${s.money >= f.price ? 'gold' : ''}" data-act="buyFood" data-i="${i}" ${s.money >= f.price ? '' : 'disabled'}>${f.price} ${LQ.COIN}</button>
          </div>`).join('')}
      </div>`;
  }
  LQ.act.buyFood = d => {
    const f = C().foods[+d.i];
    const s = LQ.state;
    if (s.money < f.price) return;
    if (s.energy >= LQ.maxEnergy()) { LQ.say('full'); LQ.toast('Bạn đang no rồi, năng lượng đã đầy!'); return; }
    LQ.addMoney(-f.price);
    LQ.addEnergy(f.energy);
    LQ.emit('buyfood', 1);
    LQ.narrate(`One ${f.word}, please.`, `Cho tôi một phần ${f.vi}.`);
    LQ.say('eat', null, { queue: true });
    LQ.toast(`${f.icon} Ngon! +${f.energy} ⚡`, 'good');
    LQ.render();
    LQ.afterAction();
  };
})(window.LQ);
