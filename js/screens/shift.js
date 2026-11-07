/* Ca làm kiểu nhập vai: khung cảnh (nhà hàng, đường phố…), nhân vật bước vào và nói chuyện,
   người chơi chọn việc cần làm / câu cần nói. Sai thì đàn anh, đàn chị giải thích lý do.
   Dữ liệu: data/jobs.json → LQ_DATA.jobs[job] = { places, cast, scenes: [{ id, level, title, place, cast?, steps }] } */
(function (LQ) {
  'use strict';
  const C = () => LQ.CONFIG;
  let sh = null;

  const jobData = key => (window.LQ_DATA && window.LQ_DATA.jobs && window.LQ_DATA.jobs[key]) || null;
  const lvl = () => LQ.state.englishLevel || 0;

  // Chọn tình huống cho ca: hợp bậc tiếng Anh, ưu tiên tình huống chơi ít lần nhất
  function pickScenes(key, n) {
    const j = jobData(key);
    if (!j) return [];
    const played = LQ.state.scenes || (LQ.state.scenes = {});
    let pool = j.scenes.filter(s => s.level <= lvl() + 1);
    if (!pool.length) pool = j.scenes.slice();
    return LQ.shuffle(pool).sort((a, b) => (played[a.id] || 0) - (played[b.id] || 0)).slice(0, n);
  }

  LQ.startRolePlay = (key, onFinish) => {
    const scenes = pickScenes(key, C().shiftScenes);
    if (!scenes.length) return false;
    sh = { key, scenes, si: 0, step: 0, present: [], firstOk: 0, asks: 0, tries: 0, answered: false, showVi: false, onFinish, done: false };
    enterScene();
    LQ.go('shift');
    return true;
  };

  function scene() { return sh.scenes[sh.si]; }
  function cast() { return Object.assign({}, jobData(sh.key).cast, scene().cast || {}); }
  function step() { return scene().steps[sh.step]; }
  function enterScene() {
    sh.step = 0; sh.present = []; sh.tries = 0; sh.answered = false; sh.lastLine = null; sh.entering = null;
    applyStep();
  }
  // Nhân vật bước vào khung cảnh / câu thoại gần nhất (để hiện phía trên câu hỏi)
  function applyStep() {
    const st = step();
    sh.entering = null;
    if (!st) return;
    if (st.enter && !sh.present.includes(st.enter)) { sh.present.push(st.enter); sh.entering = st.enter; }
    if (st.who && !st.ask && st.who !== 'narrator' && !sh.present.includes(st.who)) { sh.present.push(st.who); sh.entering = st.who; }
    if (!st.ask) sh.lastLine = st;
    // Xáo thứ tự lựa chọn (trong dữ liệu, đáp án đúng thường để đầu tiên)
    sh.order = st.ask ? LQ.shuffle(st.options.map((o, i) => i)) : null;
  }

  const showVi = () => sh.showVi || lvl() <= 2;
  const showOptVi = () => sh.showVi || lvl() <= 1;

  function sceneHTML() {
    const j = jobData(sh.key), sc = scene(), place = j.places[sc.place], cs = cast();
    const st = step();
    const speaking = st && !st.ask ? st.who : null;
    const actors = sh.present.map(k => {
      const c = cs[k];
      return c ? `<div class="actor ${speaking === k ? 'talk' : ''} ${sh.entering === k ? 'enter' : ''}"><span class="face">${c.face}</span><small>${LQ.esc(c.en)}</small></div>` : '';
    }).join('');
    return `
      <div class="scene place-${sc.place}">
        <div class="scene-label">📍 ${LQ.esc(place.en)} <span>· ${LQ.esc(place.vi)}</span></div>
        <div class="scene-props">${place.props}</div>
        <div class="scene-cast">${actors}<div class="actor you ${st && st.ask ? 'talk' : ''}"><span class="face">${LQ.state.player.avatar}</span><small>You</small></div></div>
      </div>`;
  }

  function lineHTML(l, big) {
    if (!l) return '';
    const cs = cast();
    const who = l.who === 'narrator' ? null : cs[l.who];
    return `<div class="say-box ${big ? '' : 'small-ctx'} ${who ? '' : 'narr'}" data-act="say" data-text="${LQ.esc(l.en)}">
      <div class="who">${who ? `${who.face} ${LQ.esc(who.en)}` : '📢'}</div>
      <b>${LQ.esc(l.en)}</b> <span class="spk">🔊</span>
      ${showVi() ? `<span class="vi">${LQ.esc(l.vi)}</span>` : ''}</div>`;
  }

  LQ.screens.shift = {
    render() {
      if (!sh) return '';
      if (sh.done) return summaryHTML();
      const sc = scene(), st = step(), j = LQ.CONFIG.jobs[sh.key];
      const totalSteps = sh.scenes.reduce((n, s) => n + s.steps.length, 0);
      const doneSteps = sh.scenes.slice(0, sh.si).reduce((n, s) => n + s.steps.length, 0) + sh.step;
      let body;
      if (!st.ask) {
        body = `${lineHTML(st, true)}
          <button class="btn block" data-act="shNext">Tiếp tục ▶</button>`;
      } else {
        body = `${lineHTML(sh.lastLine, false)}
          <div class="card ask">
            <div class="row spread"><div class="q-prompt">${LQ.esc(st.ask)}</div>
              <button class="icon-btn" data-act="say" data-text="${LQ.esc(st.ask)}" aria-label="Nghe">🔊</button></div>
            ${showVi() ? `<div class="muted small">${LQ.esc(st.vi)}</div>` : ''}
            <div class="q-opts" style="margin-top:10px">
              ${sh.order.map(i => [st.options[i], i]).map(([o, i]) => `<button class="opt role" data-act="shAnswer" data-i="${i}">
                <span class="oe">${o.emoji || ''}</span><span class="grow"><b>${LQ.esc(o.en)}</b>${showOptVi() ? `<span class="vi">${LQ.esc(o.vi)}</span>` : ''}</span></button>`).join('')}
            </div>
            <div id="sh-fb"></div>
          </div>`;
      }
      return `
        <div class="q-head">
          <button class="icon-btn" data-act="shExit" aria-label="Thoát">✕</button>
          <div class="q-progress"><div class="small muted">${j.icon} ${LQ.esc(j.name)} · Tình huống ${sh.si + 1}/${sh.scenes.length}: <b>${LQ.esc(sc.title)}</b></div>
            <div class="bar light"><i style="width:${Math.round(doneSteps / totalSteps * 100)}%"></i></div></div>
          ${lvl() > 2 ? `<button class="icon-btn" data-act="shVi" aria-label="Dịch">🇻🇳</button>` : ''}
        </div>
        ${sceneHTML()}
        ${body}`;
    },
    mount() {
      if (!sh || sh.done) return;
      const st = step();
      if (!st.ask) LQ.speak(st.en);
      else { sh.answered = false; LQ.speak(st.ask); }
    },
  };

  LQ.act.shVi = () => { sh.showVi = !sh.showVi; LQ.render(); };

  LQ.act.shNext = () => {
    if (!sh || sh.done) return;
    sh.step++;
    sh.tries = 0;
    sh.answered = false;
    if (sh.step >= scene().steps.length) {
      LQ.state.scenes = LQ.state.scenes || {};
      LQ.state.scenes[scene().id] = (LQ.state.scenes[scene().id] || 0) + 1;
      sh.si++;
      if (sh.si >= sh.scenes.length) { finish(); LQ.render(); window.scrollTo(0, 0); return; }
      enterScene();
    } else applyStep();
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
      LQ.speak(o.en);
      LQ.speakNext(o.why);
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
        fb.innerHTML = `<div class="feedback bad"><b>❌ ${LQ.esc(o.why)}</b><div class="small">${LQ.esc(o.whyVi)}</div><div class="small" style="margin-top:4px">Chọn lại nhé!</div></div>`;
        LQ.speak(o.why);
      }
    }
    fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  function finish() {
    sh.done = true;
    sh.summary = sh.onFinish ? sh.onFinish({ correct: sh.firstOk, total: sh.asks }) : '';
  }
  function summaryHTML() {
    const pct = sh.asks ? Math.round(sh.firstOk / sh.asks * 100) : 0;
    return `
      <div class="center" style="padding-top:20px">
        <div style="font-size:60px">${pct === 100 ? '🏆' : pct >= 60 ? '🎉' : '💪'}</div>
        <h1>${sh.firstOk}/${sh.asks} lần làm đúng ngay</h1>
        <p class="muted">${pct === 100 ? 'Hoàn hảo! Bạn làm việc như người bản xứ.' : pct >= 60 ? 'Làm tốt lắm!' : 'Không sao, làm nhiều sẽ quen. Lần sau sẽ tốt hơn!'}</p>
      </div>
      <div class="card gold center">${sh.summary || ''}</div>
      <button class="btn block" data-act="shDone">Xong</button>`;
  }
  LQ.act.shDone = () => { sh = null; LQ.go('map'); LQ.afterAction(); };
  LQ.act.shExit = () => {
    LQ.modal(`<h3>Bỏ dở ca làm?</h3><p class="muted">Bạn sẽ không nhận được tiền công của ca này.</p>
      <div class="row"><button class="btn light grow" data-act="close">Làm tiếp</button>
      <button class="btn danger grow" data-act="shQuit">Thoát</button></div>`);
  };
  LQ.act.shQuit = () => { LQ.closeModal(); sh = null; LQ.go('map'); };
})(window.LQ);
