/* Ôn tập: từ đến hạn ôn theo lịch ngắt quãng */
(function (LQ) {
  'use strict';

  LQ.screens.review = {
    render() {
      const due = LQ.dueWords();
      const seen = LQ.seenCount();
      return `
        <h1>🔁 Ôn tập</h1>
        <div class="card soft">
          <p>Từ bạn hay sai hoặc lâu chưa gặp sẽ quay lại ở đây. Ôn đúng lúc giúp nhớ lâu hơn nhiều so với học dồn.</p>
          <p class="small muted">Đã gặp: ${seen} từ · Thuộc (2 sao trở lên): ${LQ.knownCount()} từ</p>
        </div>
        ${due.length ? `
          <div class="card center"><div style="font-size:44px">📚</div><h2>${due.length} từ cần ôn</h2>
            <p class="small muted">Mỗi lượt tối đa 10 câu · +4 kinh nghiệm mỗi câu đúng · không tốn năng lượng</p>
            <button class="btn block" data-act="startReview">Ôn ngay</button></div>`
          : seen ? `<div class="card center"><div style="font-size:44px">✨</div><p>Chưa có từ nào đến hạn ôn. Đi làm thêm để gặp từ mới nhé!</p>
            <button class="btn block light" data-act="startReview" data-all="1">Ôn ngẫu nhiên 10 từ đã gặp</button></div>`
          : `<div class="card center"><p>Bạn chưa gặp từ nào. Vào Hầm mỏ để bắt đầu!</p><button class="btn" data-act="enterRegion" data-id="dig">⛏️ Hầm mỏ</button></div>`}`;
    },
  };

  LQ.act.startReview = d => {
    let list = LQ.dueWords();
    if (!list.length || d.all) list = LQ.shuffle(Object.keys(LQ.state.words).map(id => LQ.wordById[id]).filter(Boolean));
    list = list.slice(0, 10);
    LQ.runQuiz({
      title: 'Ôn tập', icon: '🔁', back: 'review',
      questions: list.map(w => LQ.makeQuestion(w)),
      onFinish: r => {
        const xp = LQ.addXP(r.correct * 4);
        LQ.emit('review', r.total);
        return `<b>Ôn xong ${r.total} từ</b><br>Kinh nghiệm: +${xp}`;
      },
    });
  };
})(window.LQ);
