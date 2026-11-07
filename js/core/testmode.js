/* Chế độ test (chỉ dành cho người làm game): mở bằng địa chỉ có ?test, ví dụ http://192.168.1.8:8123/?test
   - Màn chào có nút "Vào nhanh bằng tài khoản test" (cấp 10, nhiều vàng, mở hết khu vực, túi có sẵn đồ).
   - Hồ sơ có bảng công cụ test: thêm vàng, đầy năng lượng, đổi cấp, đổi bậc tiếng Anh, làm lại hướng dẫn…
   Tắt: mở địa chỉ có ?test=off */
(function (LQ) {
  'use strict';
  const KEY = 'lq_test_mode';
  try {
    const q = window.location.search;
    if (/[?&]test=off\b/.test(q)) window.localStorage.removeItem(KEY);
    else if (/[?&]test\b/.test(q)) window.localStorage.setItem(KEY, '1');
    LQ.testMode = window.localStorage.getItem(KEY) === '1';
  } catch (e) { LQ.testMode = /[?&]test\b/.test(window.location.search); }

  LQ.act.testAccount = () => {
    const s = LQ.defaultState();
    LQ.state = s;
    s.player = { name: 'Tester', gender: 'm', look: 'asia', personality: 'hard', avatar: LQ.CONFIG.looks[0].m };
    s.englishLevel = 1;
    s.level = 10;
    s.money = 2000;
    s.energy = LQ.maxEnergy();
    s.bag = LQ.shuffle(LQ.words.filter(LQ.isDiggable)).slice(0, 8).map(w => w.id);
    LQ.save();
    LQ.toast('🧪 Đã tạo tài khoản test: cấp 10, 2000 vàng, mở hết khu vực.', 'gold');
    LQ.go('map');
    LQ.afterAction();
  };

  LQ.testPanelHTML = () => !LQ.testMode ? '' : `
    <h2>🧪 Công cụ test</h2>
    <div class="card">
      <div class="row wrap">
        <button class="btn small light" data-act="tMoney">+1000 vàng</button>
        <button class="btn small light" data-act="tEnergy">Đầy năng lượng</button>
        <button class="btn small light" data-act="tLevel" data-v="1">Cấp +1</button>
        <button class="btn small light" data-act="tLevel" data-v="10">Lên cấp 10</button>
        <button class="btn small light" data-act="tBag">Đầy túi đồ</button>
        <button class="btn small light" data-act="tIntro">Xem lại hướng dẫn</button>
        <button class="btn small light" data-act="tScenes">Chơi lại tình huống</button>
        <button class="btn small light" data-act="testAccount">Tạo lại tài khoản test</button>
      </div>
      <div class="small muted" style="margin-top:8px">Bậc tiếng Anh (ảnh hưởng độ khó, phụ đề):</div>
      <div class="row wrap">${[0, 1, 2, 3, 4].map(n => `<button class="btn small ${LQ.state.englishLevel === n ? '' : 'light'}" data-act="tEng" data-v="${n}">${n}</button>`).join('')}</div>
      <div class="small muted" style="margin-top:8px">Tắt chế độ test: mở địa chỉ có <b>?test=off</b></div>
    </div>`;

  const done = msg => { LQ.save(); LQ.render(); LQ.toast('🧪 ' + msg); };
  LQ.act.tMoney = () => { LQ.addMoney(1000); done('+1000 vàng'); };
  LQ.act.tEnergy = () => { LQ.state.energy = LQ.maxEnergy(); done('Đầy năng lượng'); };
  LQ.act.tLevel = d => {
    const s = LQ.state;
    const target = +d.v === 1 ? s.level + 1 : Math.max(s.level, +d.v);
    while (s.level < Math.min(target, LQ.CONFIG.maxLevel)) LQ.addXP(LQ.CONFIG.xpForLevel(s.level) - s.xp);
    done('Cấp ' + s.level);
    LQ.afterAction();
  };
  LQ.act.tBag = () => {
    const s = LQ.state;
    const pool = LQ.shuffle(LQ.words.filter(LQ.isDiggable));
    while (s.bag.length < LQ.CONFIG.bagSize && pool.length) s.bag.push(pool.shift().id);
    done('Đã đầy túi đồ');
  };
  LQ.act.tIntro = () => { LQ.state.seenIntro = {}; done('Hướng dẫn sẽ hiện lại ở mỗi khu'); };
  LQ.act.tScenes = () => { LQ.state.scenes = {}; done('Tình huống ca làm sẽ chơi lại từ đầu'); };
  LQ.act.tEng = d => { LQ.state.englishLevel = +d.v; done('Bậc tiếng Anh: ' + d.v); };

  // ---------- Thử âm thanh (cho mọi người, nằm trong Hồ sơ) ----------
  LQ.act.soundTest = () => {
    LQ.audioLog.length = 0;
    const s = LQ.state.settings;
    LQ.speak('Hello! This is a sound test.');
    setTimeout(() => {
      const ss = window.speechSynthesis;
      const voices = ss ? ss.getVoices().filter(v => /^en/i.test(v.lang)).length : 0;
      LQ.modal(`<h3>🔊 Kết quả thử âm thanh</h3>
        <div class="small">
          <div class="obj"><span>Đọc tiếng Anh</span><b>${s.voice === false ? '❌ đang TẮT' : '✅ bật'}</b></div>
          <div class="obj"><span>Giọng thu sẵn</span><b>${window.LQ_AUDIO ? Object.keys(window.LQ_AUDIO.ids || {}).length + ' câu' : '❌ không tải được'}</b></div>
          <div class="obj"><span>Giọng của máy (tiếng Anh)</span><b>${ss ? voices + ' giọng' : '❌ không có'}</b></div>
          <div style="margin-top:8px"><b>Nhật ký:</b><br>${LQ.audioLog.map(LQ.esc).join('<br>') || '(trống)'}</div>
        </div>
        <p class="small muted">Nếu không nghe gì: kiểm tra nút âm lượng, chế độ im lặng của điện thoại, rồi bấm thử lại.</p>
        <button class="btn block" data-act="soundTest">Thử lại</button>
        <button class="btn block light" style="margin-top:8px" data-act="close">Đóng</button>`);
    }, 1500);
  };
})(window.LQ);
