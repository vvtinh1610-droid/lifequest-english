/* Khởi động game */
(function (LQ) {
  'use strict';
  const C = () => LQ.CONFIG;

  LQ.onLevelUp = lv => {
    setTimeout(() => {
      LQ.toast(`⬆️ Lên cấp ${lv}!`, 'gold');
      const r = C().regions.find(x => x.minLevel === lv);
      if (r) LQ.toast(`🗺️ Mở vùng mới: ${r.icon} ${r.name}`, 'good');
      if (lv === C().maxLevel) LQ.toast('🏆 Bạn đã đạt cấp tối đa của bản thử nghiệm!', 'gold');
    }, 150);
    // Nhiệm vụ hằng ngày có thể có thêm loại mới khi lên cấp: giữ nguyên trong ngày
  };

  // Chỉ hỏi chọn môn phái một lần mỗi lần mở game
  const origAfter = LQ.afterAction;
  let sectAsked = false;
  LQ.afterAction = () => {
    const s = LQ.state;
    if (s.level >= C().sectLevel && !s.sect) {
      if (sectAsked) { const keep = LQ.showSectPicker; LQ.showSectPicker = null; origAfter(); LQ.showSectPicker = keep; return; }
      sectAsked = true;
    }
    origAfter();
  };

  function start() {
    LQ.indexWords();
    LQ.state = LQ.load();
    const s = LQ.state;
    s.stats.sessions++;
    LQ.trackDay();
    LQ.ensureDaily();

    if (!LQ.words.length) {
      LQ.$('#screen').innerHTML = '<div class="card">Không tải được dữ liệu từ vựng. Chạy <code>node tools/build-data.js</code> rồi mở lại.</div>';
      return;
    }
    if (!s.player) LQ.go('welcome');
    else if (s.englishLevel === null) LQ.go('placementIntro');
    else { LQ.go('map'); LQ.afterAction(); }

    // Mỗi 30 giây: hồi năng lượng, đếm thời gian chơi
    let ticks = 0;
    setInterval(() => {
      if (document.hidden || !LQ.state.player) return;
      ticks++;
      if (ticks % 2 === 0) { LQ.state.stats.minutes++; LQ.trackDay(); }
      const before = LQ.state.energy;
      LQ.tickEnergy();
      if (LQ.state.energy !== before && !LQ.$('#topbar').classList.contains('hidden')) LQ.renderTopbar();
      LQ.save();
    }, 30000);
    document.addEventListener('visibilitychange', () => { if (document.hidden) LQ.save(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(window.LQ);
