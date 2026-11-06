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
        <div class="row spread"><h1>${job.icon} ${job.name}</h1><button class="btn small light" data-act="nav" data-to="map">← Bản đồ</button></div>
        <div class="card soft">
          ${p.job === 'restaurant'
            ? '<p>👨‍🍳 Quán đông khách nước ngoài. Nghe khách gọi món, hiểu yêu cầu, trả lời cho đúng.</p>'
            : '<p>🧑‍💼 Đơn hàng đến liên tục. Đọc chỉ đường, nghe khách gọi điện, giao đúng chỗ.</p>'}
          <p class="small">Mỗi ca: ${C().shiftQuestions} tình huống · tốn ${cost} ⚡ · ${C().payPerCorrect}${bonus ? ' (+20% môn phái)' : ''} 🪙 mỗi câu đúng · đúng hết được thêm tip.</p>
        </div>
        <button class="btn block" data-act="startShift" data-job="${p.job}" ${s.energy >= cost ? '' : 'disabled'}>Bắt đầu ca làm</button>
        ${s.energy < cost ? '<p class="small muted center">Không đủ năng lượng. Mua đồ ăn ở Chợ hoặc chờ hồi năng lượng.</p>' : ''}
        <h3>Từ vựng của nghề</h3>
        <p class="small muted">Đã gặp ${countSeen(job.topics)} / ${countAll(job.topics)} từ thuộc nhóm này.</p>`;
    },
  };
  const countAll = ts => ts.reduce((n, t) => n + (LQ.byTopic[t] || []).filter(LQ.allowed).length, 0);
  const countSeen = ts => ts.reduce((n, t) => n + (LQ.byTopic[t] || []).filter(w => LQ.state.words[w.id]).length, 0);

  LQ.act.startShift = d => {
    const key = d.job;
    const job = C().jobs[key];
    const cost = energyCost(key);
    if (!LQ.useEnergy(cost)) { LQ.toast('⚡ Không đủ năng lượng.'); return; }
    const n = C().shiftQuestions;
    const main = LQ.pickWords([job.mainTopic], Math.ceil(n * 0.67));
    const ids = new Set(main.map(w => w.id));
    const others = LQ.pickWords(job.topics.filter(t => t !== job.mainTopic), n, w => !ids.has(w.id));
    const words = LQ.shuffle(main.concat(others).slice(0, n));
    const faces = LQ.shuffle(job.npcs);
    LQ.runQuiz({
      title: job.name, icon: job.icon, back: 'map',
      questions: words.map(w => LQ.makeQuestion(w)),
      npc: i => { const k = i % job.lines.length; return { face: faces[i % faces.length], line: job.lines[k], lineVi: job.linesVi[k] }; },
      onFinish: r => {
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
        return `<b>Hết ca!</b><br>Tiền công: +${pay} 🪙${tip ? `<br>Tip: +${tip} 🪙 ${perfect ? '(không sai câu nào!)' : '😄'}` : ''}<br>Kinh nghiệm: +${xp}`;
      },
    });
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
