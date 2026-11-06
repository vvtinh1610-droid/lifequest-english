/* Sổ từ: tất cả từ đã gặp, theo chủ đề, có số sao */
(function (LQ) {
  'use strict';
  const TOPIC = { home: '🏚️ Nhà ở', dig: '⛏️ Đồ vật', market: '🧺 Chợ', restaurant: '🍜 Nhà hàng', city: '🏙️ Thành phố', delivery: '🛵 Giao hàng', work: '🏭 Công việc' };
  let filter = '';

  LQ.screens.wordbook = {
    render() {
      const s = LQ.state;
      const ids = Object.keys(s.words).filter(id => LQ.wordById[id]);
      const f = LQ.norm(filter);
      const list = ids.map(id => LQ.wordById[id]).filter(w => !f || LQ.norm(w.word).includes(f) || LQ.norm(w.vi).includes(f));
      const groups = {};
      for (const w of list) (groups[w.topic] = groups[w.topic] || []).push(w);
      return `
        <h1>📖 Sổ từ</h1>
        <p class="small muted">${ids.length} từ đã gặp · ${LQ.knownCount()} từ thuộc · ★ = mức độ nhớ</p>
        <input type="text" id="wb-search" placeholder="Tìm từ tiếng Anh hoặc tiếng Việt…" value="${LQ.esc(filter)}">
        ${!ids.length ? '<div class="card center muted">Sổ từ còn trống. Mỗi món đào được, mỗi câu trả lời đều ghi vào đây.</div>' : ''}
        ${Object.keys(groups).map(t => `
          <h3>${TOPIC[t] || t} <span class="small muted">(${groups[t].length})</span></h3>
          <div class="card">
            ${groups[t].sort((a, b) => a.word.localeCompare(b.word)).map(w => `
              <div class="wb-item" data-act="showWord" data-id="${w.id}" style="cursor:pointer">
                <span class="e">${w.emoji || '📝'}</span>
                <div class="grow"><b>${LQ.esc(w.word)}</b><div class="small muted">${LQ.esc(w.vi)}</div></div>
                <span class="stars">${'★'.repeat(LQ.stars(w.id))}${'☆'.repeat(3 - LQ.stars(w.id))}</span>
              </div>`).join('')}
          </div>`).join('')}`;
    },
    mount() {
      const inp = LQ.$('#wb-search');
      inp.addEventListener('input', () => {
        filter = inp.value;
        const pos = inp.selectionStart;
        LQ.render();
        const again = LQ.$('#wb-search');
        again.focus();
        again.setSelectionRange(pos, pos);
      });
    },
  };
})(window.LQ);
