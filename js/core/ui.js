/* Giao diện chung: điều hướng, thanh trên/dưới, hộp thoại, thông báo, bộ chạy câu hỏi */
(function (LQ) {
  'use strict';
  const C = () => LQ.CONFIG;
  LQ.screens = {};
  LQ.act = {};
  LQ.current = { name: null, params: {} };

  // ---------- Điều hướng ----------
  LQ.go = (name, params) => {
    LQ.current = { name, params: params || {} };
    LQ.render();
    window.scrollTo(0, 0);
  };
  LQ.render = () => {
    const scr = LQ.screens[LQ.current.name];
    if (!scr) return;
    LQ.tickEnergy();
    const root = LQ.$('#screen');
    root.innerHTML = scr.render(LQ.current.params);
    if (scr.mount) scr.mount(LQ.current.params);
    const inGame = !!(LQ.state.player && LQ.state.englishLevel !== null) && !scr.bare;
    LQ.$('#topbar').classList.toggle('hidden', !inGame);
    LQ.$('#nav').classList.toggle('hidden', !inGame);
    if (inGame) { LQ.renderTopbar(); LQ.renderNav(); }
    LQ.save();
  };

  LQ.renderTopbar = () => {
    const s = LQ.state;
    const need = C().xpForLevel(s.level);
    const xpPct = s.level >= C().maxLevel ? 100 : Math.round(s.xp / need * 100);
    const ePct = Math.round(s.energy / LQ.maxEnergy() * 100);
    LQ.$('#topbar').innerHTML = `
      <div class="tb-avatar">${s.player.avatar}</div>
      <div>
        <div class="tb-name">${LQ.esc(s.player.name)}</div>
        <div class="tb-sub">Cấp ${s.level} · ${LQ.stageName()}${s.sect ? ' · ' + LQ.esc(LQ.sectInfo().name) : ''}</div>
        <div class="bar"><i style="width:${xpPct}%"></i></div>
      </div>
      <div class="tb-right">
        <div id="tb-money">${LQ.fmtMoney(s.money)}</div>
        <div>⚡ ${s.energy}/${LQ.maxEnergy()}</div>
        <div class="bar energy"><i style="width:${ePct}%"></i></div>
      </div>`;
  };

  const TABS = [
    ['map', '🗺️', 'Bản đồ', 'Map'], ['quests', '📜', 'Nhiệm vụ', 'Quests'], ['review', '🔁', 'Ôn tập', 'Review'],
    ['wordbook', '📖', 'Sổ từ', 'Word book'], ['profile', '👤', 'Hồ sơ', 'Profile'],
  ];
  const TAB_OF = { dig: 'map', market: 'map', job: 'map', home: 'map', quiz: 'map' };
  LQ.renderNav = () => {
    const cur = TAB_OF[LQ.current.name] || LQ.current.name;
    LQ.$('#nav').innerHTML = TABS.map(([id, ic, label, en]) =>
      `<button data-act="nav" data-to="${id}" data-en="${en}" class="${cur === id ? 'on' : ''}">
        <span class="ic">${ic}</span>${label}<span class="dot hidden" id="dot-${id}"></span></button>`).join('');
    LQ.refreshBadges();
  };
  LQ.refreshBadges = () => {
    const set = (id, n) => {
      const d = LQ.$('#dot-' + id);
      if (!d) return;
      d.textContent = n; d.classList.toggle('hidden', !n);
    };
    set('quests', LQ.pendingCount ? LQ.pendingCount() : 0);
    const due = LQ.dueWords ? LQ.dueWords().length : 0;
    set('review', due > 99 ? '99+' : due);
  };
  LQ.act.nav = d => LQ.go(d.to);

  // ---------- Hộp thoại ----------
  LQ.modal = (html, opts) => {
    opts = opts || {};
    const root = LQ.$('#modal-root');
    root.innerHTML = `<div class="modal-back" data-back="1"><div class="modal" role="dialog">${html}</div></div>`;
    const back = root.firstChild;
    back.addEventListener('click', e => { if (e.target === back && !opts.locked) LQ.closeModal(); });
  };
  LQ.closeModal = () => { LQ.$('#modal-root').innerHTML = ''; };
  LQ.act.close = () => LQ.closeModal();
  LQ.act.closeAfter = () => { LQ.closeModal(); LQ.render(); LQ.afterAction(); };

  // ---------- Thông báo ----------
  LQ.toast = (msg, cls) => {
    const t = document.createElement('div');
    t.className = 'toast ' + (cls || '');
    t.innerHTML = msg;
    const root = LQ.$('#toast-root');
    root.appendChild(t);
    while (root.children.length > 3) root.firstChild.remove();
    setTimeout(() => t.remove(), 2200);
  };

  // ---------- Đọc to ----------
  LQ.act.say = d => LQ.speak(d.text);
  LQ.act.sayWord = d => { const w = LQ.wordById[d.id]; if (w) LQ.speak(w.word); };
  LQ.act.sayEx = d => { const w = LQ.wordById[d.id]; if (w) LQ.speak(w.example); };

  // ---------- Thẻ từ ----------
  LQ.wordCardHTML = (w, extra) => {
    const lv = LQ.state.englishLevel || 0;
    return `
    <div class="wordcard">
      <div class="big">${LQ.emo(w.emoji) || '📝'}</div>
      <div class="w">${LQ.esc(w.word)} <button class="icon-btn" data-act="sayWord" data-id="${w.id}" aria-label="Nghe">🔊</button></div>
      <div class="ipa">${LQ.esc(w.ipa)} · <span class="tag gray">${LQ.esc(LQ.typeName(w.type))}</span>
        ${w.region !== 'common' ? `<span class="tag gold">${w.region}</span>` : ''}
        ${w.register === 'slang' || w.register === 'informal' ? `<span class="tag gray">${w.register === 'slang' ? 'tiếng lóng' : 'thân mật'}</span>` : ''}</div>
      <div class="vi">${LQ.esc(w.vi)}</div>
      <div class="ex">
        <div class="row spread"><b>${LQ.esc(w.example)}</b><button class="icon-btn" data-act="sayEx" data-id="${w.id}" aria-label="Nghe câu">🔊</button></div>
        ${lv <= 3 ? `<div class="muted small">${LQ.esc(w.exampleVi)}</div>` : `<details class="small muted"><summary>Xem nghĩa</summary>${LQ.esc(w.exampleVi)}</details>`}
      </div>
      ${extra || ''}
    </div>`;
  };
  LQ.typeName = t => ({ word: 'từ', collocation: 'cụm từ', phrase: 'mẫu câu', idiom: 'thành ngữ', slang: 'tiếng lóng' }[t] || t);
  // Mở thẻ từ và tự đọc: (câu dẫn nếu có) → từ → câu ví dụ, không cần bấm 🔊
  LQ.showWord = (w, buttons, intro) => {
    LQ.modal(LQ.wordCardHTML(w, `<div class="stack" style="margin-top:14px">${buttons || '<button class="btn block" data-act="close">Đóng</button>'}</div>`));
    if (intro) { LQ.narrate(intro.en, intro.vi); LQ.speakNext(w.word); } else LQ.speak(w.word);
    LQ.speakNext(w.example);
  };
  LQ.act.showWord = d => { const w = LQ.wordById[d.id]; if (w) LQ.showWord(w); };

  // ---------- Hội thoại cốt truyện ----------
  LQ.storyHTML = lines => lines.map(l => `
    <div class="npc"><div class="face">${l.who}</div>
      <div class="bubble"><span class="small muted">${LQ.esc(l.name)}</span><br>${LQ.esc(l.en)}
        <button class="icon-btn" style="width:32px;height:32px;font-size:14px;float:right" data-act="say" data-text="${LQ.esc(l.en)}">🔊</button>
        <span class="vi">${LQ.esc(l.vi)}</span></div></div>`).join('');

  // ---------- Bộ chạy câu hỏi ----------
  // opts: { title, icon, questions:[q], npc: i => ({face,line,lineVi}), onFinish: ({correct,total,results}) => html, back }
  let quiz = null;
  LQ.runQuiz = opts => {
    const qs = opts.questions.filter(Boolean);
    if (!qs.length) { LQ.toast('Chưa đủ từ để tạo câu hỏi.'); return; }
    quiz = Object.assign({ i: 0, correct: 0, answered: false, results: [] }, opts, { questions: qs });
    LQ.go('quiz');
  };
  LQ.screens.quiz = {
    render() {
      if (!quiz) return '';
      if (quiz.i >= quiz.questions.length) return quizSummary();
      const q = quiz.questions[quiz.i];
      const n = quiz.npc ? quiz.npc(quiz.i, q) : null;
      quiz.curNpc = n;
      const pct = Math.round(quiz.i / quiz.questions.length * 100);
      return `
        <div class="q-head">
          <button class="icon-btn" data-act="quizExit" aria-label="Thoát">✕</button>
          <div class="q-progress"><div class="small muted">${quiz.icon || ''} ${LQ.esc(quiz.title)} · ${quiz.i + 1}/${quiz.questions.length}</div>
            <div class="bar light"><i style="width:${pct}%"></i></div></div>
        </div>
        ${n ? `<div class="npc"><div class="face">${n.face}</div><div class="bubble" data-act="say" data-text="${LQ.esc(n.line)}">${LQ.esc(n.line)} 🔊${n.lineVi && (LQ.state.englishLevel || 0) <= 2 ? `<span class="vi">${LQ.esc(n.lineVi)}</span>` : ''}</div></div>` : ''}
        <div class="card">
          <div class="row spread">
            <div class="q-prompt ${q.promptBig ? 'big grow' : ''}">${LQ.esc(q.prompt)}</div>
            ${q.audio ? `<button class="icon-btn" data-act="quizAudio" aria-label="Nghe lại">🔊</button>` : ''}
          </div>
          ${q.hint ? `<div class="muted small">${LQ.esc(q.hint)}</div>` : ''}
          <div class="q-opts ${q.grid ? 'emoji' : ''}" style="margin-top:12px">
            ${q.options.map((o, i) => `<button class="opt" data-act="quizAnswer" data-i="${i}">
              ${o.emoji ? `<span class="big">${LQ.emo(o.emoji)}</span>` : ''}${LQ.esc(o.label)}</button>`).join('')}
          </div>
          <div id="quiz-fb"></div>
        </div>`;
    },
    mount() {
      if (!quiz || quiz.i >= quiz.questions.length) return;
      const q = quiz.questions[quiz.i];
      quiz.answered = false;
      // Đọc lời dẫn tình huống trước, rồi đến câu hỏi (nếu là câu nghe)
      const n = quiz.curNpc;
      if (n && n.line) { LQ.speak(n.line); if (q.audio) LQ.speakNext(q.audio); }
      else if (q.audio) LQ.speak(q.audio);
    },
  };
  LQ.act.quizAudio = () => { const q = quiz && quiz.questions[quiz.i]; if (q) LQ.speak(q.audio); };
  LQ.act.quizAnswer = d => {
    if (!quiz || quiz.answered) return;
    quiz.answered = true;
    const q = quiz.questions[quiz.i];
    const i = +d.i;
    const ok = i === q.answer;
    const btns = LQ.$$('.opt');
    btns.forEach((b, k) => { b.disabled = true; if (k === q.answer) b.classList.add('good'); });
    if (!ok) btns[i].classList.add('bad');
    if (ok) quiz.correct++;
    quiz.results.push({ id: q.word.id, ok });
    LQ.markResult(q.word.id, ok);
    LQ.beep(ok ? 'good' : 'bad');
    setTimeout(() => LQ.speak(q.afterAudio || q.word.word), 200);
    const w = q.word;
    LQ.$('#quiz-fb').innerHTML = `
      <div class="feedback ${ok ? 'good' : 'bad'}">
        <b>${ok ? '✅ Chính xác!' : '❌ Chưa đúng. Đáp án: ' + LQ.esc(q.options[q.answer].label)}</b>
        <div style="margin-top:6px">${LQ.emo(w.emoji)} <b>${LQ.esc(w.word)}</b> <span class="muted">${LQ.esc(w.ipa)}</span> — ${LQ.esc(w.vi)}</div>
        <div class="small" style="margin-top:4px"><i>${LQ.esc(w.example)}</i><br><span class="muted">${LQ.esc(w.exampleVi)}</span></div>
      </div>
      <button class="btn block" style="margin-top:12px" data-act="quizNext">${quiz.i + 1 < quiz.questions.length ? 'Tiếp tục →' : 'Xem kết quả'}</button>`;
    LQ.$('#quiz-fb').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  LQ.act.quizNext = () => { quiz.i++; LQ.render(); window.scrollTo(0, 0); };
  LQ.act.quizExit = () => {
    LQ.modal(`<h3>Bỏ dở giữa chừng?</h3><p class="muted">Những câu đã trả lời vẫn được tính vào ôn tập, nhưng không nhận thưởng.</p>
      <div class="row"><button class="btn light grow" data-act="close">Làm tiếp</button>
      <button class="btn danger grow" data-act="quizQuit">Thoát</button></div>`);
  };
  LQ.act.quizQuit = () => { LQ.closeModal(); const back = quiz.back || 'map'; quiz = null; LQ.go(back); };
  function quizSummary() {
    if (!quiz.finished) {
      quiz.finished = true;
      quiz.summaryHTML = quiz.onFinish ? quiz.onFinish({ correct: quiz.correct, total: quiz.questions.length, results: quiz.results }) : '';
    }
    const pct = Math.round(quiz.correct / quiz.questions.length * 100);
    return `
      <div class="center" style="padding-top:20px">
        <div style="font-size:60px">${pct === 100 ? '🏆' : pct >= 60 ? '🎉' : '💪'}</div>
        <h1>${quiz.correct}/${quiz.questions.length} câu đúng</h1>
        <p class="muted">${pct === 100 ? 'Hoàn hảo!' : pct >= 60 ? 'Làm tốt lắm!' : 'Không sao, sai đâu ôn đó. Những từ sai sẽ quay lại trong phần Ôn tập.'}</p>
      </div>
      <div class="card gold center">${quiz.summaryHTML || ''}</div>
      <button class="btn block" data-act="quizDone">Xong</button>`;
  }
  LQ.act.quizDone = () => { const back = quiz.back || 'map'; quiz = null; LQ.go(back); LQ.afterAction(); };

  // Gọi sau mỗi hành động: kiểm tra nhiệm vụ mới, chọn môn phái
  LQ.afterAction = () => {
    const started = LQ.startMainIfReady();
    if (started) {
      LQ.render();
      LQ.modal(`<div class="tag gold">Nhiệm vụ chính mới</div><h2>📜 ${LQ.esc(started.title)}</h2>
        ${LQ.storyHTML(started.story)}
        <button class="btn block" data-act="closeAndQuests">Xem nhiệm vụ</button>`);
      return;
    }
    if (LQ.state.level >= C().sectLevel && !LQ.state.sect && LQ.showSectPicker) LQ.showSectPicker();
  };
  LQ.act.closeAndQuests = () => { LQ.closeModal(); LQ.go('quests'); };

  // Nhận sự kiện bấm toàn trang
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    // Nút nào có data-en thì đọc tên tiếng Anh khi chạm (hành động sau đó có thể đọc câu khác đè lên)
    if (t.dataset.en) LQ.speak(t.dataset.en);
    const fn = LQ.act[t.dataset.act];
    if (fn) { e.preventDefault(); fn(t.dataset, t, e); }
  });
})(window.LQ);
