/* Xóm trọ: phòng của bạn, nghỉ ngơi, nâng cấp phòng. Đồ đã thuộc hiện ra trong phòng. */
(function (LQ) {
  'use strict';
  const C = () => LQ.CONFIG;
  const REST_GAP = 3 * 3600000; // 3 tiếng mới ngủ lại được

  LQ.screens.home = {
    render() {
      const s = LQ.state;
      const room = C().rooms[s.room];
      const next = C().rooms[s.room + 1];
      const decor = Object.keys(s.words).map(id => LQ.wordById[id])
        .filter(w => w && (w.topic === 'home' || w.topic === 'dig') && LQ.isObject(w) && LQ.stars(w.id) >= 2);
      const canRest = !s.lastRest || Date.now() - s.lastRest > REST_GAP;
      const wait = canRest ? 0 : Math.ceil((REST_GAP - (Date.now() - s.lastRest)) / 60000);
      return `
        <div class="row spread"><h1>${room.icon} Xóm trọ</h1><button class="btn small light" data-act="nav" data-to="map">← Bản đồ</button></div>
        <div class="card">
          <b>${room.name}</b>
          <p class="small muted">Đồ vật bạn đã thuộc (2 sao trở lên) sẽ xuất hiện trong phòng. Chạm vào để nghe lại.</p>
          <div class="room">
            ${decor.length ? decor.map(w => `<span data-act="showWord" data-id="${w.id}" title="${LQ.esc(w.word)}">${w.emoji}</span>`).join('') : '<span class="small muted" style="font-size:14px">Phòng còn trống. Đào đồ và ôn từ cho thuộc để trang trí phòng nhé!</span>'}
          </div>
        </div>
        <div class="card row">
          <span style="font-size:32px">😴</span>
          <div class="grow"><b>Ngủ một giấc</b><div class="small muted">Hồi đầy năng lượng. Mỗi 3 tiếng được ngủ 1 lần.</div></div>
          <button class="btn small" data-act="rest" ${canRest ? '' : 'disabled'}>${canRest ? 'Ngủ' : `Còn ${wait} phút`}</button>
        </div>
        ${next ? `
        <div class="card row">
          <span style="font-size:32px">${next.icon}</span>
          <div class="grow"><b>Chuyển lên: ${next.name}</b><div class="small muted">+${next.energyBonus - room.energyBonus} năng lượng tối đa</div></div>
          <button class="btn small gold" data-act="upgradeRoom" ${s.money >= next.price ? '' : 'disabled'}>${next.price} 🪙</button>
        </div>` : '<div class="card soft small">🏡 Bạn đang ở chỗ tốt nhất của bản này.</div>'}`;
    },
  };

  LQ.act.rest = () => {
    const s = LQ.state;
    s.lastRest = Date.now();
    s.energy = LQ.maxEnergy();
    s.energyTs = Date.now();
    LQ.speak('Good night!');
    LQ.toast('😴 Ngủ ngon! Năng lượng đã đầy.', 'good');
    LQ.render();
  };
  LQ.act.upgradeRoom = () => {
    const s = LQ.state;
    const next = C().rooms[s.room + 1];
    if (!next || s.money < next.price) return;
    LQ.addMoney(-next.price);
    s.room++;
    LQ.emit('room', 1);
    LQ.beep('level');
    LQ.toast(`🎉 Chuyển phòng thành công: ${next.name}`, 'gold');
    LQ.render();
    LQ.afterAction();
  };
})(window.LQ);
