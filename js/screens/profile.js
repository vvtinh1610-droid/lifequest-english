/* Hồ sơ: thông tin nhân vật, thống kê, cài đặt */
(function (LQ) {
  'use strict';
  const C = () => LQ.CONFIG;

  LQ.screens.profile = {
    render() {
      const s = LQ.state;
      const st = s.stats;
      const pers = C().personalities.find(p => p.id === s.player.personality);
      const acc = st.correct + st.wrong ? Math.round(st.correct / (st.correct + st.wrong) * 100) : 0;
      const sect = LQ.sectInfo();
      return `
        <div class="center"><div style="font-size:72px">${s.player.avatar}</div>
          <h1>${LQ.esc(s.player.name)}</h1>
          <p class="muted">Cấp ${s.level} · ${LQ.stageName()} · ${pers ? pers.icon + ' ' + pers.name : ''}</p></div>
        <div class="card">
          <div class="obj"><span>🎓 Bậc tiếng Anh</span><b>${C().englishLevels[s.englishLevel]}</b></div>
          <div class="obj"><span>🏯 Môn phái</span><b>${sect ? sect.icon + ' ' + sect.name : (s.level >= C().sectLevel ? '<a href="#" data-act="openSect">Chọn ngay</a>' : 'Mở ở cấp ' + C().sectLevel)}</b></div>
          <div class="obj"><span>🏠 Chỗ ở</span><b>${C().rooms[s.room].name}</b></div>
        </div>
        <h2>Thống kê</h2>
        <div class="card">
          <div class="obj"><span>📅 Số ngày đã chơi</span><b>${st.days.length}</b></div>
          <div class="obj"><span>⏱️ Tổng thời gian</span><b>${st.minutes} phút</b></div>
          <div class="obj"><span>📖 Từ đã gặp / đã thuộc</span><b>${LQ.seenCount()} / ${LQ.knownCount()}</b></div>
          <div class="obj"><span>🎯 Tỉ lệ trả lời đúng</span><b>${acc}%</b></div>
          <div class="obj"><span>⛏️ Đá đã đập</span><b>${st.digs}</b></div>
          <div class="obj"><span>🛍️ Món đã bán</span><b>${st.sells}</b></div>
          <div class="obj"><span>💼 Ca đã làm</span><b>${st.shifts}</b></div>
        </div>
        <button class="btn block light" data-act="copyStats">📋 Sao chép kết quả (gửi qua Zalo)</button>
        <h2>Cài đặt</h2>
        <div class="card">
          <div class="obj"><span>🗣️ Tốc độ đọc</span>
            <span><button class="btn small ${s.settings.rate < 0.8 ? '' : 'light'}" data-act="setRate" data-v="0.7">Chậm</button>
            <button class="btn small ${s.settings.rate >= 0.8 ? '' : 'light'}" data-act="setRate" data-v="0.9">Vừa</button></span></div>
          <div class="obj"><span>🔔 Âm thanh hiệu ứng</span><button class="btn small light" data-act="toggle" data-k="sound">${s.settings.sound ? 'Bật' : 'Tắt'}</button></div>
          <div class="obj"><span>🔊 Đọc tiếng Anh</span><button class="btn small light" data-act="toggle" data-k="voice">${s.settings.voice ? 'Bật' : 'Tắt'}</button></div>
        </div>
        <button class="btn block ghost" data-act="retakeTest">🧭 Làm lại bài xếp bậc</button>
        <div style="height:10px"></div>
        <button class="btn block ghost small" style="color:var(--bad);border-color:var(--bad)" data-act="askReset">Xóa dữ liệu, chơi lại từ đầu</button>
        <p class="center small muted" style="margin-top:16px">LifeQuest English · Skills first, money later.<br>Bản thử nghiệm giai đoạn 1</p>`;
    },
  };

  LQ.act.openSect = () => LQ.showSectPicker();
  LQ.act.setRate = d => { LQ.state.settings.rate = +d.v; LQ.speak('Hello, how are you?'); LQ.render(); };
  LQ.act.toggle = d => { LQ.state.settings[d.k] = !LQ.state.settings[d.k]; LQ.render(); };
  LQ.act.retakeTest = () => LQ.go('placementIntro');
  LQ.act.askReset = () => LQ.modal(`<h3>Xóa toàn bộ dữ liệu?</h3><p class="muted">Nhân vật, tiền, cấp độ và sổ từ sẽ mất hết, không lấy lại được.</p>
    <div class="row"><button class="btn light grow" data-act="close">Thôi</button><button class="btn danger grow" data-act="doReset">Xóa</button></div>`);
  LQ.act.doReset = () => { LQ.closeModal(); LQ.resetAll(); LQ.go('welcome'); };

  LQ.act.copyStats = () => {
    const s = LQ.state, st = s.stats;
    const acc = st.correct + st.wrong ? Math.round(st.correct / (st.correct + st.wrong) * 100) : 0;
    const text = [
      'LifeQuest English — kết quả của tôi',
      `Tên: ${s.player.name} · Cấp ${s.level} · ${C().englishLevels[s.englishLevel]}`,
      `Số ngày chơi: ${st.days.length} · Tổng thời gian: ${st.minutes} phút`,
      `Từ đã gặp: ${LQ.seenCount()} · Đã thuộc: ${LQ.knownCount()} · Đúng: ${acc}%`,
      `Ca đã làm: ${st.shifts} · Món đã bán: ${st.sells}`,
    ].join('\n');
    const done = () => LQ.toast('📋 Đã sao chép! Dán vào Zalo để gửi.', 'good');
    try {
      navigator.clipboard.writeText(text).then(done, () => fallback(text));
    } catch (e) { fallback(text); }
    function fallback(t) {
      LQ.modal(`<h3>Sao chép đoạn này</h3><textarea style="width:100%;height:140px;font-family:inherit">${LQ.esc(t)}</textarea><button class="btn block" data-act="close">Đóng</button>`);
    }
  };
})(window.LQ);
