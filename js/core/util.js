/* Tiện ích chung: DOM, ngẫu nhiên, âm thanh, đọc tiếng Anh */
window.LQ = window.LQ || {};
(function (LQ) {
  'use strict';

  LQ.$ = (sel, root) => (root || document).querySelector(sel);
  LQ.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  // Chống chèn mã khi đưa chữ vào HTML
  LQ.esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  LQ.rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  LQ.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  LQ.shuffle = arr => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  LQ.norm = s => String(s).trim().replace(/\s+/g, ' ').replace(/[.?!]+$/, '').toLowerCase();
  LQ.todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  // Đồng vàng vẽ bằng CSS: emoji 🪙 trên nhiều điện thoại Android hiện màu bạc
  LQ.COIN = '<i class="coin" aria-label="vàng"></i>';
  LQ.emo = e => (e === '🪙' ? '<i class="coin big" aria-hidden="true"></i>' : (e || ''));
  LQ.fmtMoney = n => `${Math.round(n).toLocaleString('vi-VN')} ${LQ.COIN}`;

  // ---------- Đọc tiếng Anh ----------
  let voice = null;
  function chooseVoice() {
    if (!('speechSynthesis' in window)) return;
    const vs = window.speechSynthesis.getVoices();
    voice = vs.find(v => /en[-_]US/i.test(v.lang) && /Google|Samantha|Aria|Jenny|Natural/i.test(v.name))
      || vs.find(v => /en[-_]US/i.test(v.lang))
      || vs.find(v => /^en/i.test(v.lang)) || null;
  }
  if ('speechSynthesis' in window) {
    chooseVoice();
    window.speechSynthesis.onvoiceschanged = chooseVoice;
  }
  // Giọng đọc: ưu tiên file thu sẵn (giọng AI Kokoro, xem tools/make-audio.py và js/audio.index.js);
  // câu nào chưa có file thì dùng giọng có sẵn của máy (speechSynthesis).
  // LQ.speak(text): đọc ngay, cắt câu đang đọc. LQ.speakNext(text): đọc nối tiếp sau câu đang đọc.
  LQ.audioKey = t => String(t).trim().replace(/\s+/g, ' ').toLowerCase();
  const audioId = t => {
    const idx = window.LQ_AUDIO && window.LQ_AUDIO.ids;
    return idx ? idx[LQ.audioKey(t)] : null;
  };
  LQ.hasAudio = t => !!audioId(t);
  // Ghi lại câu chưa có file, để lần thu âm sau bổ sung (xem trong console: LQ.missingAudio)
  LQ.missingAudio = new Set();

  let player = null;           // một thẻ <audio> dùng chung (iPhone chỉ cho phát lại thẻ đã được "mở khóa")
  const queue = [];
  let playing = false;
  let current = null;
  const settings = () => (LQ.state && LQ.state.settings) || {};

  // Thư mục giọng: giọng người chơi chọn trước, rồi giọng còn lại (phòng khi câu đó chưa thu xong giọng này)
  const folders = () => {
    const v = (window.LQ_AUDIO && window.LQ_AUDIO.voices) || {};
    const first = v[settings().voiceGender] || v.female;
    return [first].concat(Object.values(v).filter(f => f !== first)).filter(Boolean);
  };
  let watchdog = null;
  // Một số điện thoại Android không báo "đọc xong" → tự chuyển câu sau một khoảng thời gian ước lượng
  const guard = (item, ms) => { clearTimeout(watchdog); watchdog = setTimeout(() => { if (current === item) next(); }, ms); };
  LQ.audioLog = [];            // nhật ký gần nhất, dùng cho nút "Thử âm thanh"
  const logA = m => { LQ.audioLog.push(m); if (LQ.audioLog.length > 12) LQ.audioLog.shift(); };

  // Gọi lại khi đọc hết hàng đợi (dùng để tự chuyển câu thoại). Bị hủy nếu có câu mới cắt ngang.
  const idleCbs = [];
  LQ.whenQuiet = cb => {
    if (!playing && !queue.length) { setTimeout(cb, 0); return; }
    idleCbs.push(cb);
  };
  function next() {
    clearTimeout(watchdog);
    playing = false;
    const item = queue.shift();
    current = item || null;
    if (!item) { const cbs = idleCbs.splice(0); cbs.forEach(cb => setTimeout(cb, 0)); return; }
    playing = true;
    const id = audioId(item.text);
    if (id) playFile(item, id, folders(), 0);
    else { LQ.missingAudio.add(item.text); synth(item); }
  }
  function playFile(item, id, dirs, k) {
    if (k >= dirs.length) { synth(item); return; }
    try {
      player = player || new Audio();
      let failed = false;
      // Lỗi tải / không phát được → thử giọng kia → cuối cùng đọc bằng giọng máy. Bỏ qua khi câu đã bị cắt ngang.
      const fail = e => {
        if (failed || current !== item) return;
        failed = true;
        logA(`lỗi file ${dirs[k]}/${id}: ${(e && (e.name || e.type)) || 'error'}`);
        playFile(item, id, dirs, k + 1);
      };
      player.onended = () => { if (current === item) next(); };
      player.onerror = fail;
      player.src = `audio/${dirs[k]}/${id}.mp3`;
      const s = settings();
      const r = item.rate || s.rate || 0.85;   // "Vừa" = bình thường, "Chậm" / Nghe chậm = 0.75–0.8
      player.playbackRate = r < 0.65 ? 0.75 : r < 0.8 ? 0.8 : 1;
      const p = player.play();
      if (p && p.then) p.then(() => logA(`phát file ${dirs[k]}`)).catch(fail);
      guard(item, 4000 + item.text.length * 150);
    } catch (e) { synth(item); }
  }
  function synth(item) {
    try {
      if (!('speechSynthesis' in window)) { logA('máy không có giọng đọc'); if (current === item) next(); return; }
      if (!voice) chooseVoice();
      const u = new SpeechSynthesisUtterance(item.text);
      u.lang = 'en-US';
      if (voice) u.voice = voice;
      u.rate = item.rate || settings().rate || 0.85;
      // Chỉ chuyển câu khi chính câu này đọc xong (câu bị hủy thì bỏ qua)
      const done = () => { if (current === item) next(); };
      u.onend = done;
      u.onerror = e => { logA(`lỗi giọng máy: ${e && e.error}`); done(); };
      window.speechSynthesis.speak(u);
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      logA(`giọng máy: ${voice ? voice.name : 'mặc định'}`);
      guard(item, 3000 + item.text.length * 120);
    } catch (e) { if (current === item) next(); }
  }
  function stopAll() {
    clearTimeout(watchdog);
    queue.length = 0;
    idleCbs.length = 0;
    current = null;
    if (player) { player.onended = null; player.onerror = null; try { player.pause(); } catch (e) { /* bỏ qua */ } }
    // Chỉ hủy giọng máy khi nó đang đọc: gọi cancel() thừa làm Chrome Android nuốt mất câu tiếp theo
    try { const ss = window.speechSynthesis; if (ss && (ss.speaking || ss.pending)) ss.cancel(); } catch (e) { /* bỏ qua */ }
    playing = false;
  }
  LQ.isSpeaking = () => playing || queue.length > 0;
  function utter(text, rate, append) {
    if (!text || settings().voice === false) return;
    if (!append) stopAll();
    queue.push({ text: String(text), rate });
    if (!playing) next();
  }
  LQ.speak = (text, rate) => utter(text, rate, false);
  LQ.speakNext = (text, rate) => utter(text, rate, true);

  // Điện thoại (nhất là iPhone) chỉ cho phát âm thanh sau lần chạm đầu tiên: mở khóa ngay lần chạm đó
  let unlocked = false;
  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    try { if ('speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; window.speechSynthesis.speak(u); } } catch (e) { /* bỏ qua */ }
    try {
      if (!player) {
        player = new Audio('audio/_silence.mp3');
        const p = player.play();
        if (p && p.catch) p.catch(() => {});
      }
    } catch (e) { /* bỏ qua */ }
  };
  document.addEventListener('touchend', unlock, { once: true, passive: true });
  document.addEventListener('click', unlock, { once: true });

  // ---------- Âm thanh hiệu ứng (tự tạo, không cần file) ----------
  let ctx = null;
  LQ.beep = type => {
    try {
      const s = LQ.state && LQ.state.settings;
      if (s && s.sound === false) return;
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const notes = {
        tap: [[300, .05]], good: [[660, .08], [880, .12]], bad: [[220, .18]],
        coin: [[988, .06], [1319, .12]], level: [[523, .1], [659, .1], [784, .1], [1047, .2]],
        break: [[160, .08], [110, .1]],
      }[type] || [[440, .1]];
      let t = ctx.currentTime;
      for (const [f, d] of notes) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = f; o.type = type === 'break' ? 'square' : 'sine';
        g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
        o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + d);
        t += d * .9;
      }
    } catch (e) { /* bỏ qua */ }
  };
})(window.LQ);
