/* Hầm mỏ: chọn tảng đá, nhân vật chạy tới, bấm ĐÀO. Ra vàng, đồ vật (mỗi món là một từ) hoặc rương kho báu.
   Mọi hành động đều có thuyết minh tiếng Anh + phụ đề tiếng Việt. */
(function (LQ) {
  'use strict';
  const C = () => LQ.CONFIG;
  let rocks = null;
  let sel = null;          // tảng đá đang chọn
  let streak = 0;          // số lần đào trúng liên tiếp
  let busy = false;        // đang chạy tới tảng đá
  const newRock = () => ({ hp: LQ.rand(2, 3), max: 3, gone: false, icon: '' });

  LQ.screens.dig = {
    render() {
      if (!rocks) rocks = Array.from({ length: 9 }, newRock);
      const s = LQ.state;
      const full = s.bag.length >= C().bagSize;
      return `
        <div class="row spread"><h1>⛏️ Hầm mỏ</h1>
          <div class="row">${LQ.helpBtn('dig')}<button class="btn small light" data-act="nav" data-to="map" data-en="Back to the map">← Bản đồ</button></div></div>
        <div class="mine" id="mine">
          <div class="mine-top"><span>🏮</span><span class="small">THE MINE</span><span>🏮</span></div>
          <div class="mine-grid">
            ${rocks.map((r, i) => `<button class="rock ${r.gone ? 'gone' : ''} ${sel === i && !r.gone ? 'sel' : ''}" data-act="hit" data-i="${i}" aria-label="Tảng đá">
              ${r.gone ? `<span class="found">${LQ.emo(r.icon)}</span>` : `<span class="hp">${'●'.repeat(r.hp)}</span>`}</button>`).join('')}
          </div>
          <div class="miner no-anim" id="miner"><span class="who">${s.player.avatar}</span><span class="pick">⛏️</span></div>
          <div class="mine-rail"></div>
        </div>
        <div class="dig-bar">
          <button class="btn gold dig-btn" data-act="digNow">⛏️ DIG · Đào</button>
          <div class="small muted center">${C().digEnergy} ⚡ / tảng đá${streak >= 2 ? `<br><b class="streak">🔥 Trúng ${streak} lần liên tiếp</b>` : ''}</div>
        </div>
        <h3>🎒 Túi đồ (${s.bag.length}/${C().bagSize})</h3>
        ${bagHTML()}
        ${full ? `<div class="card gold small">Túi đầy rồi! ${s.level >= 3 ? 'Ra Chợ bán bớt nhé.' : 'Lên cấp 3 để mở Chợ, hoặc bỏ bớt đồ.'}</div>` : ''}
        ${s.level >= 3 ? '<button class="btn block light" data-act="enterRegion" data-id="market" data-en="Go to the market">🧺 Ra chợ bán đồ</button>' : ''}`;
    },
    mount(params) {
      placeMiner(false);
      if (!params.welcomed) {
        params.welcomed = true;
        if (!LQ.firstVisit('dig')) LQ.say('mineWelcome', null, { queue: true });
      }
    },
  };

  function bagHTML() {
    const s = LQ.state;
    const cells = [];
    for (let i = 0; i < C().bagSize; i++) {
      const w = LQ.wordById[s.bag[i]];
      cells.push(w ? `<button class="item" data-act="bagItem" data-i="${i}">${LQ.emo(w.emoji)}<small>${LQ.esc(w.word)}</small></button>` : '<div class="item empty"></div>');
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

  // ---------- Nhân vật ----------
  function placeMiner(animate) {
    const mine = LQ.$('#mine'), miner = LQ.$('#miner');
    if (!mine || !miner) return;
    let x, y;
    const btn = sel !== null ? LQ.$$('.mine-grid .rock')[sel] : null;
    if (btn) {
      x = btn.offsetLeft + btn.offsetWidth * 0.55;
      y = btn.offsetTop + btn.offsetHeight * 0.35;
    } else {
      x = 8; y = mine.clientHeight - 64;   // đứng ở cửa hầm
    }
    miner.classList.toggle('no-anim', !animate);
    miner.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    if (!animate) requestAnimationFrame(() => miner.classList.remove('no-anim'));
  }

  function selectRock(i, talk) {
    sel = i;
    LQ.$$('.mine-grid .rock').forEach((b, k) => b.classList.toggle('sel', k === i));
    const miner = LQ.$('#miner');
    if (miner) { miner.classList.add('walk'); setTimeout(() => miner.classList.remove('walk'), 380); }
    placeMiner(true);
    if (talk) LQ.say('pickRock');
  }

  LQ.act.hit = d => {
    const i = +d.i;
    const r = rocks[i];
    if (!r || r.gone || busy) return;
    if (sel !== i) { selectRock(i, true); return; }
    strike(i);
  };

  LQ.act.digNow = () => {
    if (busy) return;
    if (sel === null || !rocks[sel] || rocks[sel].gone) {
      const i = rocks.findIndex(r => !r.gone);
      if (i < 0) return;
      selectRock(i, false);
      busy = true;
      setTimeout(() => { busy = false; strike(i); }, 360);
      return;
    }
    strike(sel);
  };

  function strike(i) {
    const r = rocks[i];
    if (!r || r.gone) return;
    // Tốn năng lượng ở nhát đào đầu tiên của mỗi tảng
    if (!r.paid) {
      if (!LQ.useEnergy(C().digEnergy)) { LQ.say('noEnergy'); LQ.toast('⚡ Hết năng lượng! Mua đồ ăn ở Chợ hoặc nghỉ ở Xóm trọ.'); return; }
      r.paid = true;
      LQ.renderTopbar();
    }
    r.hp--;
    LQ.beep(r.hp > 0 ? 'tap' : 'break');
    const miner = LQ.$('#miner');
    if (miner) { miner.classList.remove('swing'); void miner.offsetWidth; miner.classList.add('swing'); }
    const el = LQ.$$('.mine-grid .rock')[i];
    if (el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
    if (r.hp > 0) {
      if (el) el.querySelector('.hp').textContent = '●'.repeat(r.hp);
      LQ.say(r.hp === 1 ? 'almost' : 'hit');
      return;
    }
    breakRock(r, i);
  }

  function popup(i, html) {
    const mine = LQ.$('#mine');
    const btn = LQ.$$('.mine-grid .rock')[i];
    if (!mine || !btn) return;
    const p = document.createElement('div');
    p.className = 'mine-pop';
    p.innerHTML = html;
    p.style.left = (btn.offsetLeft + btn.offsetWidth / 2) + 'px';
    p.style.top = btn.offsetTop + 'px';
    mine.appendChild(p);
    setTimeout(() => p.remove(), 1100);
  }

  function findItem() {
    return LQ.pickWords(Object.keys(LQ.byTopic), 1, LQ.isDiggable)[0] || null;
  }

  function giveGold(r, i) {
    const s = LQ.state;
    const amount = LQ.rand(4, 10) + s.level;
    r.icon = '🪙';
    LQ.addMoney(amount);
    s.stats.gold += amount;
    LQ.addXP(2);
    LQ.beep('coin');
    return amount;
  }

  function breakRock(r, i) {
    const s = LQ.state;
    const c = C();
    r.gone = true;
    s.stats.digs++;
    LQ.emit('dig', 1);
    const bagFull = s.bag.length >= c.bagSize;
    const bold = s.player.personality === 'bold' ? 0.08 : 0;
    const roll = Math.random();
    let kind;
    if (bagFull) kind = roll < 0.6 ? 'gold' : 'nothing';
    else if (roll < c.chestChance) kind = 'chest';
    else if (roll < c.chestChance + c.goldChance + bold) kind = 'gold';
    else if (roll < c.chestChance + c.goldChance + bold + c.itemChance) kind = 'item';
    else kind = 'nothing';

    let item = null;
    if (kind === 'item' || kind === 'chest') { item = findItem(); if (!item) kind = kind === 'chest' ? 'gold' : 'nothing'; }

    streak = kind === 'nothing' ? 0 : streak + 1;
    const combo = streak > 0 && streak % 3 === 0;
    if (combo) { LQ.addXP(c.comboBonusXP); LQ.toast(`🔥 Đào trúng ${streak} lần liên tiếp! +${c.comboBonusXP} KN`, 'gold'); }

    if (kind === 'nothing') {
      r.icon = '💨';
      LQ.addXP(1);
      LQ.render();
      popup(i, '💨');
      if (bagFull) { LQ.say(s.level >= 3 ? 'bagFull' : 'bagFullEarly'); LQ.toast('🎒 Túi đầy, chỉ nhặt được vàng.'); }
      else LQ.say('nothing');
      respawn(i);
      LQ.afterAction();
      return;
    }
    if (kind === 'gold') {
      const amount = giveGold(r, i);
      LQ.render();
      popup(i, `+${amount} ${LQ.COIN}`);
      LQ.say('gold', { n: amount });
      if (combo) LQ.say('combo', null, { queue: true });
      LQ.toast(`${LQ.COIN} Trúng vàng! +${amount}`, 'gold');
      respawn(i);
      LQ.afterAction();
      return;
    }
    // Đồ vật (có thể kèm vàng nếu là rương kho báu)
    let gold = 0;
    if (kind === 'chest') { gold = giveGold(r, i) * 2; LQ.addMoney(gold / 2); }
    r.icon = kind === 'chest' ? '🧰' : item.emoji;
    const isNew = LQ.markSeen(item.id);
    s.bag.push(item.id);
    LQ.addXP((isNew ? 5 : 3) + (kind === 'chest' ? 5 : 0));
    LQ.render();
    popup(i, `${LQ.emo(item.emoji)} +${isNew ? 5 : 3} KN`);
    const vars = { a: LQ.art(item.word), A: LQ.cap(LQ.art(item.word)), w: item.vi, W: LQ.cap(item.vi) };
    const found = LQ.line('found', vars);
    const intro = kind === 'chest'
      ? { en: `Wow! A treasure chest! Gold and ${vars.a}!`, vi: `Wow! Rương kho báu! Có vàng và ${item.vi}!` }
      : found;
    const tags = `${kind === 'chest' ? `<div class="tag gold">🧰 Rương kho báu · +${gold} ${LQ.COIN}</div> ` : ''}${isNew ? '<div class="tag gold">Từ mới!</div>' : ''}`;
    LQ.showWord(item, `${tags}<button class="btn block" data-act="closeAfter" data-en="Put it in my bag">Bỏ vào túi 🎒</button>`, intro);
    if (combo) LQ.say('combo', null, { queue: true, silent: false });
    respawn(i);
  }

  function respawn(i) {
    setTimeout(() => {
      if (!rocks) return;
      rocks[i] = newRock();
      if (sel === i) sel = null;
      if (LQ.current.name === 'dig' && !LQ.$('#modal-root').innerHTML) LQ.render();
    }, 1800);
  }
})(window.LQ);
