/* Chợ: bán đồ cho khách nói tiếng Anh, mua đồ ăn lấy năng lượng */
(function (LQ) {
  'use strict';
  const C = () => LQ.CONFIG;
  const FACES = ['👩', '🧔', '👵', '👨‍🦱', '👩‍🦰', '🧑', '👴', '👱‍♀️', '🧕', '👨‍🦳'];
  const LINES = [
    w => `${cap(w)}, please!`,
    w => `Do you have ${art(w)}?`,
    w => `I need ${art(w)}.`,
    w => `I'm looking for ${art(w)}.`,
  ];
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const art = w => {
    if (/s$/.test(w) && !/ss$/.test(w)) return w;          // số nhiều: chopsticks
    return (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
  };

  let tab = 'sell';
  let cust = null;

  function nextCustomer() {
    const bag = LQ.state.bag;
    if (!bag.length) { cust = null; return; }
    const id = LQ.pick(bag);
    const w = LQ.wordById[id];
    const lvl = LQ.state.englishLevel || 0;
    const line = lvl <= 0 ? LINES[0](w.word) : LQ.pick(LINES)(w.word);
    cust = { face: LQ.pick(FACES), id, line, tries: 0, showText: lvl <= 1 };
  }

  LQ.screens.market = {
    render() {
      if (tab === 'sell' && (!cust || !LQ.state.bag.includes(cust.id))) nextCustomer();
      return `
        <div class="row spread"><h1>🧺 Chợ</h1><button class="btn small light" data-act="nav" data-to="map">← Bản đồ</button></div>
        <div class="choice-grid" style="margin:8px 0">
          <button class="choice ${tab === 'sell' ? 'on' : ''}" data-act="mkTab" data-t="sell">🛍️ Bán hàng</button>
          <button class="choice ${tab === 'food' ? 'on' : ''}" data-act="mkTab" data-t="food">🍜 Mua đồ ăn</button>
        </div>
        ${tab === 'sell' ? sellHTML() : foodHTML()}`;
    },
    mount() {
      if (tab === 'sell' && cust && !cust.spoken) { cust.spoken = true; setTimeout(() => LQ.speak(cust.line), 300); }
    },
  };
  LQ.act.mkTab = d => { tab = d.t; LQ.render(); };

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
          <div class="row" style="margin-top:6px">
            <button class="btn small light" data-act="say" data-text="${LQ.esc(cust.line)}">🔊 Nghe lại</button>
            ${cust.showText ? '' : '<button class="btn small light" data-act="mkShow">👀 Hiện chữ</button>'}
          </div>
          ${cust.tries > 0 ? `<span class="vi">Gợi ý: khách muốn "${LQ.esc(LQ.wordById[cust.id].vi)}"</span>` : ''}
        </div></div>
      <p class="small muted">Chạm vào món khách cần trong túi:</p>
      <div class="bag">
        ${s.bag.map((id, i) => { const w = LQ.wordById[id]; return `<button class="item" data-act="mkSell" data-i="${i}">${w.emoji}${lvl === 0 ? `<small>${LQ.esc(w.word)}</small>` : ''}</button>`; }).join('')}
      </div>
      <p class="small muted center" style="margin-top:10px">Giá bán: ${LQ.fmtMoney(C().sellPrice(lvl))} / món · Đúng ngay lần đầu được nhiều tiền nhất</p>`;
  }
  LQ.act.mkShow = () => { cust.showText = true; LQ.render(); };

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
      LQ.toast(`✅ Thank you! +${pay}${tip ? ` +${tip} tip 😄` : ''} 🪙`, 'good');
      LQ.speak('Thank you!');
      nextCustomer();
      LQ.render();
      LQ.afterAction();
    } else {
      if (cust.tries === 0) LQ.markResult(cust.id, false);
      cust.tries++;
      cust.showText = true;
      LQ.beep('bad');
      el.classList.add('bad');
      LQ.speak(`No, ${cust.line.toLowerCase()}`);
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
            <button class="btn small ${s.money >= f.price ? 'gold' : ''}" data-act="buyFood" data-i="${i}" ${s.money >= f.price ? '' : 'disabled'}>${f.price} 🪙</button>
          </div>`).join('')}
      </div>`;
  }
  LQ.act.buyFood = d => {
    const f = C().foods[+d.i];
    const s = LQ.state;
    if (s.money < f.price) return;
    if (s.energy >= LQ.maxEnergy()) { LQ.toast('Bạn đang no rồi, năng lượng đã đầy!'); return; }
    LQ.addMoney(-f.price);
    LQ.addEnergy(f.energy);
    LQ.emit('buyfood', 1);
    LQ.speak(`One ${f.word}, please.`);
    LQ.toast(`${f.icon} Ngon! +${f.energy} ⚡`, 'good');
    LQ.render();
    LQ.afterAction();
  };
})(window.LQ);
