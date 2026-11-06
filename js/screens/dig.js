/* Bãi đào: đập đá, tìm vàng hoặc đồ vật (mỗi món là một từ) */
(function (LQ) {
  'use strict';
  const C = () => LQ.CONFIG;
  let rocks = null;
  const newRock = () => ({ hp: LQ.rand(2, 3), max: 3, gone: false, icon: '🪨' });

  LQ.screens.dig = {
    render() {
      if (!rocks) rocks = Array.from({ length: 9 }, newRock);
      const s = LQ.state;
      return `
        <div class="row spread"><h1>⛏️ Bãi đào</h1><button class="btn small light" data-act="nav" data-to="map">← Bản đồ</button></div>
        <p class="small muted">Chạm vào tảng đá để đập. Mỗi tảng tốn ${C().digEnergy} ⚡. Có thể ra vàng 🪙 hoặc đồ vật, mỗi món là một từ tiếng Anh.</p>
        <div class="dig-field">
          ${rocks.map((r, i) => `<button class="rock ${r.gone ? 'gone' : ''}" data-act="hit" data-i="${i}" aria-label="Tảng đá">
            ${r.gone ? r.icon : '🪨'}${r.gone ? '' : `<span class="hp">${'●'.repeat(r.hp)}</span>`}</button>`).join('')}
        </div>
        <h3>🎒 Túi đồ (${s.bag.length}/${C().bagSize})</h3>
        ${bagHTML()}
        ${s.bag.length >= C().bagSize ? `<div class="card gold small">Túi đầy rồi! ${s.level >= 3 ? 'Ra Chợ bán bớt nhé.' : 'Lên cấp 3 để mở Chợ, hoặc bỏ bớt đồ.'}</div>` : ''}
        ${s.level >= 3 ? '<button class="btn block light" data-act="enterRegion" data-id="market">🧺 Ra chợ bán đồ</button>' : ''}`;
    },
  };

  function bagHTML() {
    const s = LQ.state;
    const cells = [];
    for (let i = 0; i < C().bagSize; i++) {
      const w = LQ.wordById[s.bag[i]];
      cells.push(w ? `<button class="item" data-act="bagItem" data-i="${i}">${w.emoji}<small>${LQ.esc(w.word)}</small></button>` : '<div class="item empty"></div>');
    }
    return `<div class="bag">${cells.join('')}</div>`;
  }
  LQ.bagHTML = bagHTML;

  LQ.act.bagItem = d => {
    const id = LQ.state.bag[+d.i];
    const w = LQ.wordById[id];
    if (!w) return;
    LQ.showWord(w, `<button class="btn block light" data-act="dropItem" data-i="${d.i}">Bỏ món này</button><button class="btn block" data-act="close">Đóng</button>`);
  };
  LQ.act.dropItem = d => { LQ.state.bag.splice(+d.i, 1); LQ.closeModal(); LQ.render(); };

  LQ.act.hit = (d, el) => {
    const r = rocks[+d.i];
    if (!r || r.gone) return;
    // Tốn năng lượng ở cú đập đầu tiên của mỗi tảng
    if (!r.paid) {
      if (!LQ.useEnergy(C().digEnergy)) { LQ.toast('⚡ Hết năng lượng! Mua đồ ăn ở Chợ hoặc nghỉ ở Xóm trọ.'); return; }
      r.paid = true;
      LQ.renderTopbar();
    }
    r.hp--;
    LQ.beep(r.hp > 0 ? 'tap' : 'break');
    el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
    if (r.hp > 0) { el.querySelector('.hp').textContent = '●'.repeat(r.hp); return; }
    breakRock(r, +d.i);
  };

  function breakRock(r, i) {
    const s = LQ.state;
    r.gone = true;
    s.stats.digs++;
    LQ.emit('dig', 1);
    let chance = C().goldChance + (s.player.personality === 'bold' ? 0.1 : 0);
    const bagFull = s.bag.length >= C().bagSize;
    if (bagFull) chance = 0.6;
    const roll = Math.random();
    if (roll < chance) {
      const amount = LQ.rand(4, 10) + s.level;
      r.icon = '🪙';
      LQ.addMoney(amount);
      s.stats.gold += amount;
      LQ.addXP(2);
      LQ.beep('coin');
      LQ.toast(`🪙 Trúng vàng! +${amount}`, 'gold');
    } else if (roll < 0.9 && !bagFull) {
      // Đồ đào được lấy từ chủ đề 'dig' (đồ vật cụ thể); nếu chưa có thì lấy danh từ trong 'home'
      const pick = LQ.pickWords(['dig'], 1, LQ.isObject)[0] || LQ.pickWords(['home'], 1, w => w.type === 'word' && w.pos === 'noun' && !!w.emoji)[0];
      if (pick) {
        r.icon = pick.emoji;
        const isNew = LQ.markSeen(pick.id);
        s.bag.push(pick.id);
        LQ.addXP(isNew ? 5 : 3);
        LQ.render();
        LQ.showWord(pick, `${isNew ? '<div class="tag gold">Từ mới!</div>' : ''}<button class="btn block" data-act="closeAfter">Bỏ vào túi 🎒</button>`);
        respawn(i);
        return;
      }
      r.icon = '💨';
    } else {
      r.icon = '💨';
      LQ.addXP(1);
      LQ.toast(bagFull ? '🎒 Túi đầy, chỉ nhặt được vàng.' : '💨 Chỉ có đá thôi, thử tảng khác!');
    }
    LQ.render();
    respawn(i);
    LQ.afterAction();
  }

  function respawn(i) {
    setTimeout(() => {
      if (!rocks) return;
      rocks[i] = newRock();
      if (LQ.current.name === 'dig' && !LQ.$('#modal-root').innerHTML) LQ.render();
    }, 1800);
  }
})(window.LQ);
