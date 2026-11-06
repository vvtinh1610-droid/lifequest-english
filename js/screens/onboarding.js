/* Mở đầu: chào mừng, tạo nhân vật, bài xếp bậc tiếng Anh */
(function (LQ) {
  'use strict';
  const C = () => LQ.CONFIG;
  const draft = { name: '', gender: 'm', look: 'asia', personality: 'hard' };

  // ---------- Chào mừng ----------
  LQ.screens.welcome = {
    bare: true,
    render: () => `
      <div class="hero">
        <div class="logo">🌱</div>
        <h1>LifeQuest English</h1>
        <div class="slogan">Skills first, money later.</div>
        <p>Bắt đầu từ con số 0. Đi làm, kiếm tiền, lên cấp, và học tiếng Anh qua từng công việc như ngoài đời thật.</p>
      </div>
      <div class="card soft small">
        <b>Bạn sẽ:</b><br>⛏️ Đào đá tìm đồ, mỗi món là một từ mới<br>🧺 Bán hàng cho khách nói tiếng Anh<br>
        🍜 Chạy bàn, 🛵 giao hàng, nhận lương và tip<br>📈 Lên cấp, chọn môn phái, nâng cấp phòng trọ
      </div>
      <button class="btn block gold" data-act="toCreate">Bắt đầu cuộc đời mới</button>
      <p class="center small muted">Dành cho người từ 18 tuổi. Tiến độ lưu trên máy này.</p>`,
  };
  LQ.act.toCreate = () => LQ.go('create');

  // ---------- Tạo nhân vật ----------
  const avatarOf = (g, look) => (C().looks.find(l => l.id === look) || C().looks[0])[g];
  LQ.screens.create = {
    bare: true,
    render: () => `
      <h1>Tạo nhân vật</h1>
      <div class="center" style="font-size:72px" id="cr-avatar">${avatarOf(draft.gender, draft.look)}</div>
      <h3>Tên của bạn</h3>
      <input type="text" id="cr-name" maxlength="16" placeholder="Ví dụ: Tinh" value="${LQ.esc(draft.name)}">
      <h3>Giới tính</h3>
      <div class="choice-grid">
        ${[['m', 'Nam'], ['f', 'Nữ']].map(([id, n]) => `<button class="choice ${draft.gender === id ? 'on' : ''}" data-act="crSet" data-k="gender" data-v="${id}">${n}</button>`).join('')}
      </div>
      <h3>Dáng người</h3>
      <div class="choice-grid">
        ${C().looks.map(l => `<button class="choice ${draft.look === l.id ? 'on' : ''}" data-act="crSet" data-k="look" data-v="${l.id}"><span class="big">${l[draft.gender]}</span>${l.name}</button>`).join('')}
      </div>
      <h3>Tính cách</h3>
      <div class="choice-grid">
        ${C().personalities.map(p => `<button class="choice ${draft.personality === p.id ? 'on' : ''}" data-act="crSet" data-k="personality" data-v="${p.id}"><span class="big">${p.icon}</span>${p.name}<br><span class="small muted">${p.desc}</span></button>`).join('')}
      </div>
      <button class="btn block" style="margin-top:18px" data-act="crDone">Tạo nhân vật →</button>`,
    mount() {
      const inp = LQ.$('#cr-name');
      inp.addEventListener('input', () => { draft.name = inp.value; });
    },
  };
  LQ.act.crSet = d => { draft.name = LQ.$('#cr-name').value; draft[d.k] = d.v; LQ.render(); };
  LQ.act.crDone = () => {
    draft.name = LQ.$('#cr-name').value.trim();
    if (!draft.name) { LQ.toast('Bạn nhập tên nhân vật nhé.'); LQ.$('#cr-name').focus(); return; }
    LQ.state.player = {
      name: draft.name, gender: draft.gender, look: draft.look,
      personality: draft.personality, avatar: avatarOf(draft.gender, draft.look),
    };
    LQ.state.energy = LQ.maxEnergy();
    LQ.go('placementIntro');
  };

  // ---------- Bài xếp bậc ----------
  LQ.screens.placementIntro = {
    bare: true,
    render: () => `
      <div class="center" style="padding-top:20px;font-size:56px">🧭</div>
      <h1 class="center">Tiếng Anh của bạn đang ở đâu?</h1>
      <p class="center muted">Làm bài ngắn khoảng 3–5 phút để game chọn độ khó vừa sức. Sai cũng không sao, game sẽ tự điều chỉnh khi bạn chơi.</p>
      <button class="btn block" data-act="ptStart">Làm bài xếp bậc</button>
      <div style="height:10px"></div>
      <button class="btn block ghost" data-act="ptZero">Tôi mất gốc hoàn toàn, bắt đầu từ đầu</button>`,
  };
  LQ.act.ptZero = () => finishPlacement(0, null);

  let pt = null;
  LQ.act.ptStart = () => {
    const all = ((window.LQ_DATA && window.LQ_DATA.placement) || []).slice().sort((a, b) => a.level - b.level);
    pt = { qs: all, i: 0, score: {}, total: {}, answered: false };
    LQ.go('placement');
  };
  LQ.screens.placement = {
    bare: true,
    render: () => {
      const q = pt.qs[pt.i];
      const pct = Math.round(pt.i / pt.qs.length * 100);
      return `
        <div class="small muted">Câu ${pt.i + 1}/${pt.qs.length}</div>
        <div class="bar light"><i style="width:${pct}%"></i></div>
        <div class="card" style="margin-top:14px">
          <div class="row spread"><div class="q-prompt">${LQ.esc(q.prompt)}</div>
            ${q.audioText ? `<button class="icon-btn" data-act="say" data-text="${LQ.esc(q.audioText)}">🔊</button>` : ''}</div>
          <div class="q-opts">${q.options.map((o, i) => `<button class="opt" data-act="ptAnswer" data-i="${i}">${LQ.esc(o)}</button>`).join('')}</div>
          <div id="pt-fb"></div>
        </div>
        <button class="btn block ghost small" data-act="ptStop">Dừng bài, tính kết quả đến đây</button>`;
    },
    mount: () => {
      pt.answered = false;
      const q = pt.qs[pt.i];
      if (q.audioText && q.kind === 'listen_pick') setTimeout(() => LQ.speak(q.audioText), 300);
    },
  };
  LQ.act.ptAnswer = d => {
    if (pt.answered) return;
    pt.answered = true;
    const q = pt.qs[pt.i];
    const ok = +d.i === q.answer;
    pt.total[q.level] = (pt.total[q.level] || 0) + 1;
    if (ok) pt.score[q.level] = (pt.score[q.level] || 0) + 1;
    const btns = LQ.$$('.opt');
    btns.forEach((b, k) => { b.disabled = true; if (k === q.answer) b.classList.add('good'); });
    if (!ok) btns[+d.i].classList.add('bad');
    LQ.beep(ok ? 'good' : 'bad');
    LQ.$('#pt-fb').innerHTML = `<div class="feedback ${ok ? 'good' : 'bad'} small">${ok ? '✅' : '❌'} ${LQ.esc(q.explainVi || '')}</div>
      <button class="btn block" style="margin-top:10px" data-act="ptNext">Tiếp →</button>`;
  };
  LQ.act.ptNext = () => {
    pt.i++;
    // Dừng sớm nếu sai hết một bậc (trên bậc 0)
    const prev = pt.qs[pt.i - 1];
    const next = pt.qs[pt.i];
    if (next && next.level !== prev.level) {
      const lv = prev.level;
      if ((pt.score[lv] || 0) === 0 && lv > 0) return computePlacement();
    }
    if (pt.i >= pt.qs.length) return computePlacement();
    LQ.render();
  };
  LQ.act.ptStop = () => computePlacement();

  function computePlacement() {
    let level = 0;
    for (let lv = 0; lv <= 4; lv++) {
      const t = pt.total[lv] || 0, s = pt.score[lv] || 0;
      if (t && s / t >= 0.5) level = lv; else if (t) break;
    }
    // Bậc 0 mà vẫn đúng ≥ 50% thì lên A1 (vì bậc 0 = mất gốc)
    if (level === 0 && pt.total[0] && (pt.score[0] || 0) / pt.total[0] >= 0.75 && (pt.score[1] || 0) > 0) level = 1;
    finishPlacement(level, { score: pt.score, total: pt.total });
  }

  function finishPlacement(level, detail) {
    const s = LQ.state;
    const first = s.englishLevel === null;
    s.englishLevel = level;
    s.stats.tests.push({ type: 'placement', at: Date.now(), level, detail });
    pt = null;
    LQ.go('map');
    LQ.modal(`<div class="center"><div style="font-size:56px">🎯</div>
      <h2>Bậc tiếng Anh: ${C().englishLevels[level]}</h2>
      <p class="muted">Câu hỏi trong game sẽ vừa sức bạn. Bạn có thể làm lại bài này trong Hồ sơ.</p></div>
      <button class="btn block" data-act="${first ? 'introStory' : 'close'}">${first ? 'Vào game →' : 'Đóng'}</button>`, { locked: true });
  }
  LQ.act.introStory = () => { LQ.closeModal(); LQ.afterAction(); };
})(window.LQ);
