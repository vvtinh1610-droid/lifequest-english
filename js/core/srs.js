/* Kho từ và ôn tập ngắt quãng (spaced repetition) */
(function (LQ) {
  'use strict';
  const MIN = 60000, DAY = 86400000;
  // Khoảng cách ôn theo hộp 0–5
  const GAPS = [5 * MIN, 30 * MIN, DAY, 3 * DAY, 7 * DAY, 21 * DAY];

  LQ.words = [];
  LQ.wordById = {};
  LQ.byTopic = {};

  LQ.indexWords = () => {
    const list = (window.LQ_DATA && window.LQ_DATA.words) || [];
    LQ.words = list;
    LQ.wordById = {};
    LQ.byTopic = {};
    for (const w of list) {
      LQ.wordById[w.id] = w;
      (LQ.byTopic[w.topic] = LQ.byTopic[w.topic] || []).push(w);
    }
  };

  const rec = id => {
    const W = LQ.state.words;
    return W[id] || (W[id] = { s: 0, c: 0, w: 0, b: 0, due: 0, first: Date.now() });
  };
  LQ.wordRec = id => LQ.state.words[id];

  // Gặp từ mới (thẻ từ)
  LQ.markSeen = id => {
    const isNew = !LQ.state.words[id];
    const r = rec(id);
    r.s++;
    if (!r.due) r.due = Date.now() + GAPS[0];
    if (isNew) LQ.emit('learn', 1);
    return isNew;
  };

  // Ghi kết quả trả lời
  LQ.markResult = (id, correct) => {
    const isNew = !LQ.state.words[id];
    const r = rec(id);
    r.s++;
    if (correct) { r.c++; r.b = Math.min(5, r.b + 1); LQ.state.stats.correct++; }
    else { r.w++; r.b = Math.max(0, r.b - 2); LQ.state.stats.wrong++; }
    r.due = Date.now() + GAPS[r.b];
    if (isNew) LQ.emit('learn', 1);
  };

  LQ.stars = id => {
    const r = LQ.state.words[id];
    if (!r) return 0;
    return r.b >= 4 ? 3 : r.b >= 2 ? 2 : 1;
  };
  LQ.knownCount = () => Object.values(LQ.state.words).filter(r => r.b >= 2).length;
  LQ.seenCount = () => Object.keys(LQ.state.words).length;

  // Từ phù hợp với bậc tiếng Anh: bậc từ <= bậc người chơi + 1
  LQ.allowed = w => w.level <= (LQ.state.englishLevel || 0) + 1;

  LQ.dueWords = () => {
    const now = Date.now();
    return Object.entries(LQ.state.words)
      .filter(([id, r]) => LQ.wordById[id] && r.due <= now)
      .sort((a, b) => a[1].b - b[1].b || a[1].due - b[1].due)
      .map(([id]) => LQ.wordById[id]);
  };

  // Chọn n từ cho một hoạt động. Mỗi lượt bốc thăm: phần lớn là từ mới (newWordRatio),
  // còn lại là từ đến hạn ôn. Tránh lặp các từ vừa gặp. Gặp gần hết từ vừa sức thì mở thêm từ khó hơn.
  const recent = [];
  LQ.pickWords = (topics, n, filter) => {
    const C = LQ.CONFIG;
    const base = topics.flatMap(t => LQ.byTopic[t] || []).filter(filter || (() => true));
    const W = LQ.state.words;
    const lvl = LQ.state.englishLevel || 0;
    let pool = base.filter(LQ.allowed);
    if (pool.length && pool.filter(w => W[w.id]).length / pool.length >= C.unlockNextAt) {
      pool = base.filter(w => w.level <= lvl + 2);
    }
    if (!pool.length) return [];
    const now = Date.now();
    const notRecent = w => !recent.includes(w.id);
    const due = LQ.shuffle(pool.filter(w => W[w.id] && W[w.id].due <= now && notRecent(w)));
    const fresh = LQ.shuffle(pool.filter(w => !W[w.id]));
    const rest = LQ.shuffle(pool.filter(w => W[w.id] && W[w.id].due > now && notRecent(w)));
    const anyLeft = LQ.shuffle(pool);
    const out = [];
    const take = list => { while (list.length) { const w = list.shift(); if (!out.includes(w)) { out.push(w); return true; } } return false; };
    for (let k = 0; k < n; k++) {
      const wantNew = Math.random() < C.newWordRatio;
      const order = wantNew ? [fresh, due, rest, anyLeft] : [due, fresh, rest, anyLeft];
      for (const list of order) if (take(list)) break;
    }
    for (const w of out) { recent.push(w.id); if (recent.length > C.recentAvoid) recent.shift(); }
    return LQ.shuffle(out);
  };

  // Đồ vật đào được: danh từ có hình (không lấy cụm động từ như "dig a hole")
  const VERB_START = /^(dig|take|wash|do|go|pay|call|cross|clean|chop|wipe|sweep|sign|work|split|run|comp|drop|pick|pull|beat|hit)\b/i;
  LQ.isObject = w => (w.pos === 'noun' || w.type === 'collocation') && !!w.emoji && w.word.split(' ').length <= 3
    && !/[.?!]$/.test(w.word) && !VERB_START.test(w.word);
  LQ.isDiggable = w => (w.topic === 'dig' && LQ.isObject(w))
    || (LQ.CONFIG.digExtraWords.includes(w.word.toLowerCase()) && !!w.emoji);
})(window.LQ);
