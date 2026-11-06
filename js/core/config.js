/* Cấu hình cân bằng game — chỉnh số ở đây, không cần sửa logic */
(function (LQ) {
  'use strict';
  LQ.CONFIG = {
    maxLevel: 20,                 // Giai đoạn 1: cấp 1–20 (Người lao động)
    xpForLevel: lv => 40 + lv * 20, // XP cần để lên cấp tiếp theo
    startMoney: 30,
    baseEnergy: 100,
    energyRegenMinutes: 2,        // +1 năng lượng mỗi 2 phút
    bagSize: 10,
    digEnergy: 1,                 // năng lượng mỗi tảng đá
    shiftEnergy: 12,              // năng lượng mỗi ca làm
    shiftQuestions: 6,
    goldChance: 0.22,
    sellPrice: lv => 8 + lv * 3,  // tiền bán 1 món theo bậc tiếng Anh
    payPerCorrect: 9,
    sectLevel: 10,

    regions: [
      { id: 'home', name: 'Xóm trọ', icon: '🏚️', minLevel: 1, desc: 'Phòng của bạn, nghỉ ngơi, nâng cấp phòng' },
      { id: 'dig', name: 'Bãi đào', icon: '⛏️', minLevel: 1, desc: 'Đập đá, tìm vàng và đồ vật' },
      { id: 'market', name: 'Chợ', icon: '🧺', minLevel: 3, desc: 'Bán đồ cho khách, mua đồ ăn' },
      { id: 'restaurant', name: 'Nhà hàng', icon: '🍜', minLevel: 5, desc: 'Rửa chén, chạy bàn, nhận tip' },
      { id: 'city', name: 'Thành phố', icon: '🛵', minLevel: 8, desc: 'Giao hàng, chỉ đường' },
      { id: 'next', name: 'Sân bay', icon: '✈️', minLevel: 99, desc: 'Mở ở bản sau' },
    ],

    jobs: {
      restaurant: {
        name: 'Ca nhà hàng', icon: '🍜', topics: ['restaurant', 'market', 'dig'], mainTopic: 'restaurant',
        npcs: ['🧔', '👩', '👨‍🦰', '👵', '🧑‍🦱', '👱‍♀️', '👨‍🦳', '👩‍🦱'],
        lines: ['A customer is waving at you.', 'Table 3 needs you!', 'New customers just came in.', 'Someone is calling you.'],
        linesVi: ['Có khách đang vẫy bạn.', 'Bàn số 3 gọi kìa!', 'Khách mới vừa vào.', 'Có người đang gọi bạn.'],
      },
      delivery: {
        name: 'Ca giao hàng', icon: '🛵', topics: ['city', 'delivery', 'home'], mainTopic: 'delivery',
        npcs: ['🧑‍💼', '👩‍💻', '👨‍🔧', '👩‍🏫', '🧓', '👷'],
        lines: ['Your phone is ringing.', 'New order on the app!', 'The customer sent a message.', 'You stop at the corner.'],
        linesVi: ['Điện thoại bạn đổ chuông.', 'Có đơn mới trên app!', 'Khách vừa nhắn tin.', 'Bạn dừng ở góc đường.'],
      },
    },

    sects: [
      { id: 'amthuc', name: 'Ẩm Thực Môn', icon: '🍳', job: 'restaurant', desc: 'Nghề nhà hàng: bồi bàn, phụ bếp, đầu bếp. +20% tiền công ca nhà hàng.' },
      { id: 'tochanh', name: 'Tốc Hành Phái', icon: '🛵', job: 'delivery', desc: 'Nghề giao hàng, tài xế. +20% tiền công ca giao hàng, ít tốn năng lượng hơn.' },
    ],

    looks: [
      { id: 'asia', name: 'Châu Á', m: '👨🏻', f: '👩🏻' },
      { id: 'europe', name: 'Châu Âu', m: '👱🏼‍♂️', f: '👱🏼‍♀️' },
      { id: 'africa', name: 'Châu Phi', m: '👨🏿', f: '👩🏿' },
      { id: 'southasia', name: 'Nam Á', m: '👨🏽', f: '👩🏽' },
    ],

    personalities: [
      { id: 'hard', name: 'Chăm chỉ', icon: '💪', desc: '+10% kinh nghiệm' },
      { id: 'funny', name: 'Vui tính', icon: '😄', desc: 'Khách hay cho thêm tip' },
      { id: 'calm', name: 'Điềm tĩnh', icon: '🧘', desc: '+20 năng lượng tối đa' },
      { id: 'bold', name: 'Liều lĩnh', icon: '🎲', desc: 'Dễ đào trúng vàng hơn' },
    ],

    rooms: [
      { name: 'Phòng trọ 8m²', icon: '🏚️', price: 0, energyBonus: 0 },
      { name: 'Phòng trọ có máy lạnh', icon: '🏠', price: 300, energyBonus: 20 },
      { name: 'Căn hộ mini', icon: '🏡', price: 1200, energyBonus: 50 },
    ],

    foods: [
      { word: 'bread', vi: 'bánh mì', icon: '🥖', price: 10, energy: 15 },
      { word: 'sticky rice', vi: 'xôi', icon: '🍙', price: 15, energy: 25 },
      { word: 'broken rice', vi: 'cơm tấm', icon: '🍛', price: 25, energy: 40 },
      { word: 'pho', vi: 'phở', icon: '🍜', price: 40, energy: 70 },
    ],

    englishLevels: ['Mất gốc', 'Bắt đầu (A1)', 'Cơ bản (A2)', 'Trung cấp (B1)', 'Khá (B2)'],
    stages: [{ upTo: 20, name: 'Người lao động' }],
  };
})(window.LQ);
