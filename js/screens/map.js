/* Bản đồ: các vùng mở theo cấp */
(function (LQ) {
  'use strict';
  const C = () => LQ.CONFIG;
  const TARGET = { home: ['home'], dig: ['dig'], market: ['market'], restaurant: ['job', { job: 'restaurant' }], city: ['job', { job: 'delivery' }] };

  LQ.screens.map = {
    render() {
      const s = LQ.state;
      const q = LQ.currentMain();
      const qst = q && s.quests.main[q.id];
      const due = LQ.dueWords().length;
      return `
        <h1>Xin chào, ${LQ.esc(s.player.name)} 👋</h1>
        <p class="muted small">${C().englishLevels[s.englishLevel]} · Đã gặp ${LQ.seenCount()} từ · Thuộc ${LQ.knownCount()} từ</p>
        ${q && qst ? `
          <div class="card quest ${LQ.mainComplete(q) ? 'done' : ''}" data-act="nav" data-to="quests" style="cursor:pointer">
            <div class="row spread"><span class="tag">Nhiệm vụ chính</span>${LQ.mainComplete(q) ? '<span class="tag gold">Nhận thưởng!</span>' : ''}</div>
            <b>📜 ${LQ.esc(q.title)}</b>
            ${q.objectives.map(o => { const p = LQ.objectiveProgress(q, o); return `<div class="obj ${p >= o.count ? 'ok' : ''}"><span>${p >= o.count ? '✅' : '▫️'} ${LQ.esc(o.label)}</span><span>${p}/${o.count}</span></div>`; }).join('')}
          </div>` : q && s.level < q.minLevel ? `<div class="card soft small">🔒 Nhiệm vụ tiếp theo mở ở cấp ${q.minLevel}.</div>` : ''}
        ${due >= 5 ? `<div class="card gold row" data-act="nav" data-to="review" style="cursor:pointer"><span style="font-size:28px">🔁</span><div class="grow"><b>${due} từ cần ôn</b><div class="small">Ôn ngay để không quên, có thưởng kinh nghiệm.</div></div></div>` : ''}
        <h2>Bản đồ</h2>
        <div class="regions">
          ${C().regions.map(r => {
            const locked = s.level < r.minLevel;
            return `<button class="region ${locked ? 'locked' : ''}" data-act="${locked ? 'lockedRegion' : 'enterRegion'}" data-id="${r.id}" data-lv="${r.minLevel}">
              <span class="big">${r.icon}</span><b>${r.name}</b>
              <span class="small muted">${locked ? (r.minLevel > 90 ? 'Sắp ra mắt' : 'Mở ở cấp ' + r.minLevel) : r.desc}</span></button>`;
          }).join('')}
        </div>`;
    },
  };
  LQ.act.enterRegion = d => { const t = TARGET[d.id]; if (t) LQ.go(t[0], t[1]); };
  LQ.act.lockedRegion = d => LQ.toast(+d.lv > 90 ? '✈️ Sân bay và nước ngoài sẽ mở ở bản cập nhật sau.' : `🔒 Đạt cấp ${d.lv} để mở vùng này.`);
})(window.LQ);
