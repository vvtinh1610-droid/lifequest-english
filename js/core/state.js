/* Trạng thái người chơi: lưu/tải, tiền, kinh nghiệm, năng lượng */
(function (LQ) {
  'use strict';
  const KEY = 'lifequest_save_v1';
  const C = () => LQ.CONFIG;

  LQ.defaultState = () => ({
    v: 1,
    createdAt: Date.now(),
    player: null,          // { name, gender, look, personality, avatar }
    englishLevel: null,    // 0–4, null = chưa xếp bậc
    level: 1,
    xp: 0,
    money: C().startMoney,
    energy: C().baseEnergy,
    energyTs: Date.now(),
    sect: null,
    room: 0,
    bag: [],               // danh sách id từ (đồ vật trong túi)
    words: {},             // id -> { s: lần gặp, c: đúng, w: sai, b: hộp 0–5, due: thời điểm ôn, first: lần đầu }
    quests: { main: {}, mainIndex: 0, dailyDate: '', daily: [] },
    counters: {},          // bộ đếm sự kiện cho nhiệm vụ
    stats: { days: [], minutes: 0, sessions: 0, digs: 0, gold: 0, sells: 0, shifts: 0, correct: 0, wrong: 0, tests: [] },
    settings: { rate: 0.85, sound: true, voice: true, voiceGender: 'female' },   // voiceGender: female (Heart) | male (Adam)
    seenIntro: {},
    scenes: {},            // id tình huống ca làm -> số lần đã chơi
  });

  LQ.load = () => {
    let s = null;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) s = JSON.parse(raw);
    } catch (e) { s = null; }
    const base = LQ.defaultState();
    if (!s || s.v !== 1) return base;
    // Ghép với mặc định để thêm trường mới khi cập nhật game
    return Object.assign(base, s, {
      quests: Object.assign(base.quests, s.quests || {}),
      stats: Object.assign(base.stats, s.stats || {}),
      settings: Object.assign(base.settings, s.settings || {}),
    });
  };

  LQ.save = () => {
    try { window.localStorage.setItem(KEY, JSON.stringify(LQ.state)); } catch (e) { /* trình duyệt chặn lưu: vẫn chơi được */ }
  };

  LQ.resetAll = () => {
    try { window.localStorage.removeItem(KEY); } catch (e) { /* bỏ qua */ }
    LQ.state = LQ.defaultState();
  };

  // ---------- Năng lượng ----------
  LQ.maxEnergy = () => {
    const s = LQ.state;
    let m = C().baseEnergy + (C().rooms[s.room] ? C().rooms[s.room].energyBonus : 0);
    if (s.player && s.player.personality === 'calm') m += 20;
    return m;
  };
  LQ.tickEnergy = () => {
    const s = LQ.state;
    const per = C().energyRegenMinutes * 60000;
    const gained = Math.floor((Date.now() - s.energyTs) / per);
    if (gained > 0) {
      s.energy = Math.min(LQ.maxEnergy(), s.energy + gained);
      s.energyTs += gained * per;
    }
    if (s.energy >= LQ.maxEnergy()) s.energyTs = Date.now();
  };
  LQ.useEnergy = n => {
    LQ.tickEnergy();
    if (LQ.state.energy < n) return false;
    LQ.state.energy -= n;
    return true;
  };
  LQ.addEnergy = n => { LQ.state.energy = Math.min(LQ.maxEnergy(), LQ.state.energy + n); };

  // ---------- Tiền & kinh nghiệm ----------
  LQ.addMoney = n => { LQ.state.money = Math.max(0, LQ.state.money + Math.round(n)); };

  LQ.addXP = n => {
    const s = LQ.state;
    if (s.player && s.player.personality === 'hard') n = Math.round(n * 1.1);
    if (s.level >= C().maxLevel) return 0;
    s.xp += n;
    let leveled = false;
    while (s.level < C().maxLevel && s.xp >= C().xpForLevel(s.level)) {
      s.xp -= C().xpForLevel(s.level);
      s.level++;
      leveled = true;
      LQ.onLevelUp && LQ.onLevelUp(s.level);
    }
    if (s.level >= C().maxLevel) s.xp = 0;
    if (leveled) LQ.beep('level');
    return n;
  };

  LQ.stageName = () => 'Người lao động';
})(window.LQ);
