/* Ca làm kiểu nhập vai, học tay nghề từng bước.
   Mỗi nghề có nhiều vị trí (roles: rửa chén, phục vụ, phụ bếp, tài xế…), mỗi vị trí có các bài (lessons) học theo thứ tự.
   Trong bài: nhân vật nói (tự chuyển câu khi đọc xong), rồi nhân vật hỏi → người chơi chọn việc cần làm / câu cần nói.
   Máy đọc câu hỏi, đọc từng lựa chọn, rồi mời chọn. Sai thì được giải thích (Anh + Việt) và chọn lại.
   Dữ liệu: data/jobs.json → LQ_DATA.jobs[job] = { places, cast, roles: [{ id, icon, en, vi, desc, lessons: [{ id, title, place, cast?, steps }] }] } */
(function (LQ) {
  'use strict';
  const C = () => LQ.CONFIG;
  let sh = null;

  const jobData = key => (window.LQ_DATA && window.LQ_DATA.jobs && window.LQ_DATA.jobs[key]) || null;
  const lvl = () => LQ.state.englishLevel || 0;
  const progress = () => LQ.state.jobProgress || (LQ.state.jobProgress = {});
  LQ.roleOf = (key, roleId) => { const j = jobData(key); return j ? j.roles.find(r => r.id === roleId) : null; };
  LQ.rolesOf = key => { const j = jobData(key); return j ? j.roles : []; };
  // Số bài đã học xong của một vị trí
  LQ.roleDone = roleId => progress()[roleId] || 0;

  // Bắt đầu bài: bài tiếp theo chưa học, hoặc bài chọn để ôn lại (lessonIdx)
  LQ.startRolePlay = (key, roleId, lessonIdx, onFinish) => {
    const role = LQ.roleOf(key, roleId);
    if (!role || !role.lessons.length) return false;
    const done = LQ.roleDone(roleId);
    const idx = lessonIdx != null ? lessonIdx : (done < role.lessons.length ? done : LQ.rand(0, role.lessons.length - 1));
    sh = { key, role, idx, lesson: role.lessons[idx], step: 0, present: [], log: [], firstOk: 0, asks: 0, tries: 0,
      answered: false, showVi: false, onFinish, done: false, tick: 0 };
    applyStep();
    LQ.go('shift');
    return true;
  };

  const scene = () => sh.lesson;
  const cast = () => Object.assign({}, jobData(sh.key).cast, scene().cast || {});
  const step = () => scene().steps[sh.step];

  // Nhân vật bước vào / lên tiếng → có mặt trong khung cảnh. Xáo thứ tự lựa chọn.
  function applyStep() {
    const st = step();
    sh.entering = null;
    if (!st) return;
    for (const k of [st.enter, st.who]) {
      if (k && k !== 'narrator' && !sh.present.includes(k)) { sh.present.push(k); sh.entering = k; }
    }
    sh.order = st.ask ? LQ.shuffle(st.options.map((o, i) => i)) : null;
  }

  const showVi = () => sh.showVi || lvl() <= 2;
  const showOptVi = () => sh.showVi || lvl() <= 1;

  function sceneHTML() {
    const j = jobData(sh.key), place = j.places[scene().place], cs = cast();
    const st = step();
    const speaking = st ? st.who : null;
    const actors = sh.present.map(k => {
      const c = cs[k];
      return c ? `<div class="actor ${speaking === k ? 'talk' : ''} ${sh.entering === k ? 'enter' : ''}"><span class="face">${c.face}</span><small>${LQ.esc(c.en)}</small></div>` : '';
    }).join('');
    return `
      <div class="scene place-${scene().place}">
        <div class="scene-label">📍 ${LQ.esc(place.en)} <span>· ${LQ.esc(place.vi)}</span></div>
        <div class="scene-props">${place.props}</div>
        <div class="scene-cast">${actors}<div class="actor you ${st && st.ask && !sh.answered ? 'talk' : ''}"><span class="face">${LQ.state.player.avatar}</span><small>You</small></div></div>
      </div>`;
  }

  // Một câu nói của nhân vật (hoặc lời dẫn), có nút 🔊 nghe lại
  function sayHTML(who, en, vi, cls) {
    const c = who && who !== 'narrator' ? cast()[who] : null;
    return `<div class="say-box ${cls || ''} ${c ? '' : 'narr'}">
      <div class="who">${c ? `${c.face} ${LQ.esc(c.en)}` : '📢'}</div>
      <div class="row" style="align-items:flex-start"><b class="grow">${LQ.esc(en)}</b>
        <button class="spk-btn" data-act="say" data-text="${LQ.esc(en)}" aria-label="Nghe lại">🔊</button></div>
      ${showVi() && vi ? `<span class="vi">${LQ.esc(vi)}</span>` : ''}</div>`;
  }

  LQ.screens.shift = {
    render() {
      if (!sh) return '';
      if (sh.done) return summaryHTML();
      const st = step(), j = C().jobs[sh.key];
      const pct = Math.round(sh.step / scene().steps.length * 100);
      // Vài câu thoại trước đó (nhạt hơn) để giữ mạch câu chuyện
      const prev = sh.log.slice(-2).map(l => sayHTML(l.who, l.en, l.vi, 'small-ctx')).join('');
      let body;
      if (!st.ask) {
        body = `${prev}${sayHTML(st.who, st.en, st.vi)}
          <button class="btn block light small" data-act="shNext">⏩ Tiếp</button>`;
      } else {
        body = `${prev}${sayHTML(st.who, st.ask, st.vi, 'asking')}
          <div class="small muted" style="margin:2px 2px 6px">👇 Bạn làm gì / nói gì? · <i>Choose your answer.</i></div>
          <div class="q-opts">
            ${sh.order.map(i => [st.options[i], i]).map(([o, i]) => `<div class="opt-row">
              <button class="opt role" data-act="shAnswer" data-i="${i}">
                <span class="oe">${o.emoji || ''}</span><span class="grow"><b>${LQ.esc(o.en)}</b>${showOptVi() ? `<span class="vi">${LQ.esc(o.vi)}</span>` : ''}</span></button>
              <button class="spk-btn" data-act="say" data-text="${LQ.esc(o.en)}" aria-label="Nghe lựa chọn">🔊</button></div>`).join('')}
          </div>
          <div id="sh-fb"></div>`;
      }
      return `
        <div class="q-head">
          <button class="icon-btn" data-act="shExit" aria-label="Thoát">✕</button>
          <div class="q-progress"><div class="small muted">${sh.role.icon} ${LQ.esc(sh.role.vi)} · Bài ${sh.idx + 1}/${sh.role.lessons.length}: <b>${LQ.esc(scene().title)}</b></div>
            <div class="bar light"><i style="width:${pct}%"></i></div></div>
          ${lvl() > 2 ? `<button class="icon-btn" data-act="shVi" aria-label="Dịch">🇻🇳</button>` : ''}
        </div>
        ${sceneHTML()}
        ${body}`;
    },
    mount() {
      if (!sh || sh.done) return;
      // Lời thoại đã hiện trên màn hình → ẩn thanh phụ đề ở đáy cho khỏi che đáp án
      const bar = LQ.$('#narrator');
      if (bar) bar.classList.add('out');
      const st = step();
      const tick = ++sh.tick;
      if (!st.ask) {
        // Câu thoại: đọc xong thì tự chuyển sang câu tiếp theo
        LQ.speak(st.en);
        autoNext(tick, 700, 1200 + st.en.length * 55);
      } else {
        sh.answered = false;
        // Câu hỏi: đọc câu hỏi → đọc từng lựa chọn theo thứ tự trên màn hình → mời chọn
        LQ.speak(st.ask);
        sh.order.forEach(i => LQ.speakNext(st.options[i].en));
        LQ.speakNext('Choose your answer.');
      }
    },
  };

  // Tự chuyển bước khi đọc xong (hoặc sau một lúc nếu đang tắt giọng đọc). Hủy nếu người chơi đã bấm sang bước khác.
  function autoNext(tick, pause, fallback) {
    const go = () => { if (sh && sh.tick === tick && !sh.done && LQ.current.name === 'shift') LQ.act.shNext(); };
    if (LQ.state.settings.voice === false || !LQ.isSpeaking()) setTimeout(go, fallback);
    else LQ.whenQuiet(() => setTimeout(go, pause));
  }

  LQ.act.shVi = () => { sh.showVi = !sh.showVi; LQ.render(); };

  LQ.act.shNext = () => {
    if (!sh || sh.done) return;
    const st = step();
    if (st) sh.log.push(st.ask ? { who: st.who, en: st.ask, vi: st.vi } : st);
    sh.step++;
    sh.tries = 0;
    sh.answered = false;
    if (sh.step >= scene().steps.length) { finish(); LQ.render(); window.scrollTo(0, 0); return; }
    applyStep();
    LQ.render();
    window.scrollTo(0, 0);
  };

  // Từ vựng xuất hiện trong đáp án đúng → ghi vào ôn tập
  function wordsIn(text) {
    const t = ' ' + LQ.norm(text).replace(/[^a-z' -]/g, ' ') + ' ';
    return LQ.words.filter(w => {
      const k = LQ.norm(w.word);
      return k.length > 2 && !/[.?!,]/.test(w.word) && t.includes(' ' + k + ' ');
    }).sort((a, b) => b.word.length - a.word.length).slice(0, 2);
  }

  LQ.act.shAnswer = (d, el) => {
    const st = step();
    if (!st || !st.ask || sh.answered) return;
    const o = st.options[+d.i];
    const fb = LQ.$('#sh-fb');
    const tick = ++sh.tick;
    if (o.ok) {
      sh.answered = true;
      const first = sh.tries === 0;
      sh.asks++;
      if (first) sh.firstOk++;
      wordsIn(o.en + ' ' + st.ask).forEach(w => LQ.markResult(w.id, first));
      LQ.$$('.opt.role').forEach(b => { b.disabled = true; });
      el.classList.add('good');
      LQ.beep('good');
      fb.innerHTML = `<div class="feedback good"><b>✅ ${LQ.esc(o.why)}</b><div class="small">${LQ.esc(o.whyVi)}</div></div>
        <button class="btn block" style="margin-top:10px" data-act="shNext">Tiếp tục ▶</button>`;
      // Đọc lại câu trả lời đúng, rồi lời khen / giải thích, rồi tự sang bước sau
      LQ.speak(o.en);
      LQ.speakNext(o.why);
      autoNext(tick, 900, 2500 + o.why.length * 45);
    } else {
      sh.tries++;
      el.disabled = true;
      el.classList.add('bad');
      LQ.beep('bad');
      const reveal = sh.tries >= 2 || st.options.length - sh.tries <= 1;
      if (reveal) {
        sh.answered = true;
        sh.asks++;
        const right = st.options.findIndex(x => x.ok);
        wordsIn(st.options[right].en + ' ' + st.ask).forEach(w => LQ.markResult(w.id, false));
        LQ.$$('.opt.role').forEach(b => { b.disabled = true; if (+b.dataset.i === right) b.classList.add('good'); });
        fb.innerHTML = `<div class="feedback bad"><b>❌ ${LQ.esc(o.why)}</b><div class="small">${LQ.esc(o.whyVi)}</div>
            <div style="margin-top:6px">👉 <b>${LQ.esc(st.options[right].en)}</b><div class="small muted">${LQ.esc(st.options[right].vi)}</div></div></div>
          <button class="btn block" style="margin-top:10px" data-act="shNext">Tiếp tục ▶</button>`;
        LQ.speak(o.why);
        LQ.speakNext(st.options[right].en);
      } else {
        fb.innerHTML = `<div class="feedback bad"><b>❌ ${LQ.esc(o.why)}</b><div class="small">${LQ.esc(o.whyVi)}</div><div class="small" style="margin-top:4px">Chọn lại nhé! · <i>Try again.</i></div></div>`;
        LQ.speak(o.why);
        LQ.speakNext('Try again.');
      }
    }
    fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  function finish() {
    sh.done = true;
    // Lần đầu học xong bài này → mở bài tiếp theo của vị trí
    const p = progress();
    if ((p[sh.role.id] || 0) === sh.idx) p[sh.role.id] = sh.idx + 1;
    LQ.state.scenes = LQ.state.scenes || {};
    LQ.state.scenes[scene().id] = (LQ.state.scenes[scene().id] || 0) + 1;
    sh.summary = sh.onFinish ? sh.onFinish({ correct: sh.firstOk, total: sh.asks }) : '';
  }
  function summaryHTML() {
    const pct = sh.asks ? Math.round(sh.firstOk / sh.asks * 100) : 0;
    const nextLesson = sh.role.lessons[sh.idx + 1];
    return `
      <div class="center" style="padding-top:20px">
        <div style="font-size:60px">${pct === 100 ? '🏆' : pct >= 60 ? '🎉' : '💪'}</div>
        <h1>Xong bài: ${LQ.esc(scene().title)}</h1>
        <p class="muted">${sh.firstOk}/${sh.asks} lần làm đúng ngay. ${pct === 100 ? 'Hoàn hảo! Bạn làm việc như dân chuyên nghiệp.' : pct >= 60 ? 'Làm tốt lắm!' : 'Không sao, làm nhiều sẽ quen tay.'}</p>
      </div>
      <div class="card gold center">${sh.summary || ''}</div>
      ${nextLesson ? `<div class="card soft small">⏭️ Bài tiếp theo: <b>${LQ.esc(nextLesson.title)}</b></div>` : `<div class="card soft small">🎓 Bạn đã học hết vị trí <b>${LQ.esc(sh.role.vi)}</b>! Làm tiếp sẽ ôn lại các bài.</div>`}
      <button class="btn block" data-act="shDone">Xong</button>`;
  }
  LQ.act.shDone = () => { const key = sh.key; sh = null; LQ.go('job', { job: key }); LQ.afterAction(); };
  LQ.act.shExit = () => {
    LQ.modal(`<h3>Bỏ dở ca làm?</h3><p class="muted">Bạn sẽ không nhận được tiền công của bài này.</p>
      <div class="row"><button class="btn light grow" data-act="close">Làm tiếp</button>
      <button class="btn danger grow" data-act="shQuit">Thoát</button></div>`);
  };
  LQ.act.shQuit = () => { LQ.closeModal(); const key = sh && sh.key; sh = null; LQ.go(key ? 'job' : 'map', key ? { job: key } : undefined); };
})(window.LQ);
