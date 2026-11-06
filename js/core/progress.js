/* Sự kiện, nhiệm vụ chính, nhiệm vụ hằng ngày, thống kê */
(function (LQ) {
  'use strict';
  const Q = () => (window.LQ_DATA && window.LQ_DATA.quests) || { main: [], daily: [] };

  // ---------- Sự kiện ----------
  // type: dig, learn, sell, buyfood, review, shift_restaurant, shift_delivery, shift_any, perfect, sect, room
  LQ.emit = (type, n) => {
    const s = LQ.state;
    s.counters[type] = (s.counters[type] || 0) + (n || 1);
    // Tiến độ nhiệm vụ hằng ngày
    for (const d of s.quests.daily) if (d.type === type && !d.claimed) d.progress = Math.min(d.count, (d.progress || 0) + (n || 1));
    LQ.refreshBadges && LQ.refreshBadges();
  };

  // ---------- Nhiệm vụ chính ----------
  LQ.currentMain = () => Q().main[LQ.state.quests.mainIndex] || null;

  LQ.startMainIfReady = () => {
    const q = LQ.currentMain();
    if (!q) return null;
    const st = LQ.state.quests.main[q.id];
    if (!st && LQ.state.level >= q.minLevel) {
      // Ghi lại mốc bộ đếm lúc nhận nhiệm vụ
      const base = {};
      for (const o of q.objectives) base[o.type] = LQ.state.counters[o.type] || 0;
      LQ.state.quests.main[q.id] = { started: Date.now(), base, done: false };
      return q;
    }
    return null;
  };

  LQ.objectiveProgress = (q, o) => {
    const s = LQ.state;
    const st = s.quests.main[q.id];
    if (!st) return 0;
    if (o.type === 'level') return Math.min(o.count, s.level);
    if (o.type === 'sect') return s.sect ? 1 : 0;
    if (o.type === 'room') return s.room > 0 ? 1 : 0;
    if (o.type === 'words_known') return Math.min(o.count, LQ.knownCount());
    return Math.min(o.count, (s.counters[o.type] || 0) - (st.base[o.type] || 0));
  };

  LQ.mainComplete = q => q && LQ.state.quests.main[q.id] && q.objectives.every(o => LQ.objectiveProgress(q, o) >= o.count);

  LQ.claimMain = () => {
    const q = LQ.currentMain();
    if (!LQ.mainComplete(q)) return null;
    LQ.state.quests.main[q.id].done = true;
    LQ.addMoney(q.reward.money || 0);
    LQ.addXP(q.reward.xp || 0);
    LQ.state.quests.mainIndex++;
    return q;
  };

  // ---------- Nhiệm vụ hằng ngày ----------
  LQ.ensureDaily = () => {
    const s = LQ.state;
    const today = LQ.todayKey();
    if (s.quests.dailyDate === today) return;
    const pool = Q().daily.filter(d => !d.minLevel || s.level >= d.minLevel);
    s.quests.daily = LQ.shuffle(pool).slice(0, 3).map(d => Object.assign({}, d, { progress: 0, claimed: false }));
    s.quests.dailyDate = today;
  };

  LQ.claimDaily = id => {
    const d = LQ.state.quests.daily.find(x => x.id === id);
    if (!d || d.claimed || d.progress < d.count) return null;
    d.claimed = true;
    LQ.addMoney(d.reward.money);
    LQ.addXP(d.reward.xp);
    return d;
  };

  LQ.pendingCount = () => {
    let n = LQ.state.quests.daily.filter(d => !d.claimed && d.progress >= d.count).length;
    if (LQ.mainComplete(LQ.currentMain())) n++;
    return n;
  };

  // ---------- Thống kê ----------
  LQ.trackDay = () => {
    const st = LQ.state.stats;
    const t = LQ.todayKey();
    if (!st.days.includes(t)) st.days.push(t);
  };
})(window.LQ);
