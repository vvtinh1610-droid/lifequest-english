/* Ca làm: nhà hàng, giao hàng. Mỗi ca là một chuỗi tình huống tiếng Anh. */
(function (LQ) {
  'use strict';
  const C = () => LQ.CONFIG;

  LQ.sectInfo = () => C().sects.find(x => x.id === LQ.state.sect) || null;
  const sectBonus = job => { const s = LQ.sectInfo(); return s && s.job === job ? 1.2 : 1; };
  const energyCost = job => { const s = LQ.sectInfo(); return C().shiftEnergy - (s && s.job === job && job === 'delivery' ? 4 : 0); };

  LQ.screens.job = {
    render(p) {
      const job = C().jobs[p.job];
      const s = LQ.state;
      const cost = energyCost(p.job);
      const bonus = sectBonus(p.job) > 1;
      return `
        <div class="row spread"><h1>${job.icon} ${job.name}</h1>
          <div class="row">${LQ.helpBtn('job')}<button class="btn small light" data-act="nav" data-to="map" data-en="Back to the map">← Bản đồ</button></div></div>
        <div class="card soft">
          ${p.job === 'restaurant'
            ? '<p>👨‍🍳 Bạn là nhân viên mới của một nhà hàng. Đón khách, ghi món, phụ bếp, rửa chén, tính tiền… Quản lý và chị Mai sẽ chỉ bạn từng việc.</p>'
            : '<p>🛵 Bạn là tài xế giao hàng. Lấy hàng ở quán, nghe khách chỉ đường, gặp bảo vệ chung cư, giao hàng và thu tiền.</p>'}
          <p class="small">Mỗi ca: ${C().shiftScenes} tình huống thực tế · tốn ${cost} ⚡ · ${C().payPerCorrect}${bonus ? ' (+20% môn phái)' : ''} ${LQ.COIN} mỗi lần làm đúng ngay · không sai lần nào được thêm tip.</p>
        </div>
        <button class="btn block" data-act="startShift" data-job="${p.job}" data-en="Start my shift" ${s.energy >= cost ? '' : 'disabled'}>Bắt đầu ca làm · Start</button>
        ${s.energy < cost ? '<p class="small muted center">Không đủ năng lượng. Mua đồ ăn ở Chợ hoặc chờ hồi năng lượng.</p>' : ''}
        <h3>Từ vựng của nghề</h3>
        <p class="small muted">Đã gặp ${countSeen(job.topics)} / ${countAll(job.topics)} từ thuộc nhóm này.</p>`;
    },
    mount(params) {
      if (params.welcomed) return;
      params.welcomed = true;
      if (!LQ.firstVisit('job')) {
        LQ.narrate(params.job === 'restaurant' ? 'Welcome to the restaurant. Ready to work?' : 'Welcome to the city. Ready to deliver?',
          params.job === 'restaurant' ? 'Chào mừng đến nhà hàng. Sẵn sàng làm việc chưa?' : 'Chào mừng ra thành phố. Sẵn sàng giao hàng chưa?', { queue: true });
      }
    },
  };
  const countAll = ts => ts.reduce((n, t) => n + (LQ.byTopic[t] || []).filter(LQ.allowed).length, 0);
  const countSeen = ts => ts.reduce((n, t) => n + (LQ.byTopic[t] || []).filter(w => LQ.state.words[w.id]).length, 0);

  LQ.act.startShift = d => {
    const key = d.job;
    const job = C().jobs[key];
    const cost = energyCost(key);
    if (!LQ.useEnergy(cost)) { LQ.toast('⚡ Không đủ năng lượng.'); return; }
    // Ca làm nhập vai theo tình huống thật (data/jobs.json), xem js/screens/shift.js
    const started = LQ.startRolePlay(key, r => {
      {
        const s = LQ.state;
        const perfect = r.correct === r.total;
        const pay = Math.round(r.correct * C().payPerCorrect * sectBonus(key));
        let tip = perfect ? LQ.rand(8, 16) + s.level : 0;
        if (s.player.personality === 'funny') tip += LQ.rand(2, 8);
        const xp = LQ.addXP(10 + r.correct * 6);
        LQ.addMoney(pay + tip);
        s.stats.shifts++;
        LQ.emit('shift_' + key, 1);
        LQ.emit('shift_any', 1);
        if (perfect) LQ.emit('perfect', 1);
        LQ.beep('coin');
        LQ.narrate(perfect ? 'Perfect shift! Here is your pay and a big tip!' : 'Your shift is over. Here is your pay. Good job!',
          perfect ? `Ca làm hoàn hảo! Tiền công và tip lớn đây! (+${pay + tip})` : `Hết ca rồi. Tiền công của bạn đây! (+${pay + tip})`);
        return `<b>Hết ca!</b><br>Tiền công: +${pay} ${LQ.COIN}${tip ? `<br>Tip: +${tip} ${LQ.COIN} ${perfect ? '(không sai câu nào!)' : '😄'}` : ''}<br>Kinh nghiệm: +${xp}`;
      }
    });
    if (!started) { LQ.addEnergy(cost); LQ.toast('Chưa có tình huống cho nghề này.'); }
  };

  // ---------- Chọn môn phái ----------
  LQ.showSectPicker = () => {
    LQ.modal(`<div class="tag gold">Cấp ${C().sectLevel}</div><h2>Chọn môn phái</h2>
      <p class="muted small">Môn phái là nghề chính của bạn. Sau này sẽ có thêm nhiều môn phái khác.</p>
      ${C().sects.map(x => `<div class="card"><div class="row"><span style="font-size:36px">${x.icon}</span>
        <div class="grow"><b>${x.name}</b><div class="small muted">${x.desc}</div></div></div>
        <button class="btn block" style="margin-top:8px" data-act="joinSect" data-id="${x.id}">Gia nhập ${x.name}</button></div>`).join('')}
      <button class="btn block ghost small" data-act="close">Để sau</button>`);
  };
  LQ.act.joinSect = d => {
    LQ.state.sect = d.id;
    LQ.emit('sect', 1);
    LQ.closeModal();
    LQ.beep('level');
    LQ.toast(`🎉 Bạn đã gia nhập ${LQ.sectInfo().name}!`, 'gold');
    LQ.render();
    LQ.afterAction();
  };
})(window.LQ);
