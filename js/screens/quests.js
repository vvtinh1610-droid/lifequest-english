/* Nhiệm vụ: chính tuyến + hằng ngày */
(function (LQ) {
  'use strict';

  LQ.screens.quests = {
    render() {
      LQ.ensureDaily();
      const s = LQ.state;
      const q = LQ.currentMain();
      const st = q && s.quests.main[q.id];
      let main;
      if (!q) main = '<div class="card soft">🏁 Bạn đã xong tất cả nhiệm vụ chính của bản này. Cốt truyện tiếp theo sẽ có ở bản cập nhật!</div>';
      else if (!st) main = `<div class="card soft">🔒 <b>${LQ.esc(q.title)}</b><br><span class="small">Mở khi đạt cấp ${q.minLevel}.</span></div>`;
      else {
        const done = LQ.mainComplete(q);
        main = `<div class="card quest ${done ? 'done' : ''}">
          <b>📜 ${LQ.esc(q.title)}</b>
          <details style="margin:6px 0"><summary class="small muted">Xem lại câu chuyện</summary>${LQ.storyHTML(q.story)}</details>
          ${q.objectives.map(o => { const p = LQ.objectiveProgress(q, o); return `<div class="obj ${p >= o.count ? 'ok' : ''}"><span>${p >= o.count ? '✅' : '▫️'} ${LQ.esc(o.label)}</span><span>${p}/${o.count}</span></div>`; }).join('')}
          <p class="small muted">Thưởng: ${q.reward.money} 🪙 · ${q.reward.xp} kinh nghiệm</p>
          <button class="btn block ${done ? 'gold' : ''}" data-act="claimMain" ${done ? '' : 'disabled'}>${done ? 'Nhận thưởng 🎁' : 'Chưa hoàn thành'}</button>
        </div>`;
      }
      return `
        <h1>📜 Nhiệm vụ</h1>
        <h2>Nhiệm vụ chính</h2>${main}
        <h2>Hằng ngày <span class="small muted">(làm mới mỗi ngày)</span></h2>
        ${s.quests.daily.map(d => `
          <div class="card row">
            <div class="grow"><b>${LQ.esc(d.label)}</b>
              <div class="bar light" style="margin:6px 0"><i style="width:${Math.round(d.progress / d.count * 100)}%"></i></div>
              <div class="small muted">${d.progress}/${d.count} · ${d.reward.money} 🪙 · ${d.reward.xp} KN</div></div>
            ${d.claimed ? '<span class="tag gray">Đã nhận</span>' : `<button class="btn small ${d.progress >= d.count ? 'gold' : ''}" data-act="claimDaily" data-id="${d.id}" ${d.progress >= d.count ? '' : 'disabled'}>Nhận</button>`}
          </div>`).join('')}`;
    },
  };

  LQ.act.claimMain = () => {
    const q = LQ.claimMain();
    if (!q) return;
    LQ.beep('level');
    LQ.toast(`🎁 Hoàn thành "${LQ.esc(q.title)}"! +${q.reward.money} 🪙`, 'gold');
    LQ.render();
    LQ.afterAction();
  };
  LQ.act.claimDaily = d => {
    const r = LQ.claimDaily(d.id);
    if (!r) return;
    LQ.beep('coin');
    LQ.toast(`🎁 +${r.reward.money} 🪙 · +${r.reward.xp} KN`, 'gold');
    LQ.render();
    LQ.afterAction();
  };
})(window.LQ);
