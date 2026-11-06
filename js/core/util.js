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
  // LQ.speak(text): đọc ngay, cắt câu đang đọc. LQ.speakNext(text): đọc nối tiếp sau câu đang đọc.
  function utter(text, rate, queue) {
    try {
      if (!('speechSynthesis' in window) || !text) return;
      const s = LQ.state && LQ.state.settings;
      if (s && s.voice === false) return;
      const synth = window.speechSynthesis;
      if (!queue) synth.cancel();
      if (!voice) chooseVoice();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      if (voice) u.voice = voice;
      u.rate = rate || (s && s.rate) || 0.85;
      synth.speak(u);
      if (synth.paused) synth.resume();
    } catch (e) { /* bỏ qua */ }
  }
  LQ.speak = (text, rate) => utter(text, rate, false);
  LQ.speakNext = (text, rate) => utter(text, rate, true);

  // Điện thoại (nhất là iPhone) chỉ cho phát giọng đọc sau lần chạm đầu tiên: mở khóa ngay lần chạm đó
  let unlocked = false;
  const unlock = () => {
    if (unlocked || !('speechSynthesis' in window)) return;
    unlocked = true;
    try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; window.speechSynthesis.speak(u); } catch (e) { /* bỏ qua */ }
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
