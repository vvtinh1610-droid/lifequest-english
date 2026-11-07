/* Tạo câu hỏi từ một từ: nghe chọn, chọn nghĩa, điền chỗ trống, Việt → Anh */
(function (LQ) {
  'use strict';

  function distractors(word, field, n) {
    const seen = new Set([LQ.norm(word[field])]);
    const out = [];
    const tryPool = pool => {
      for (const w of LQ.shuffle(pool)) {
        if (out.length >= n) return;
        const v = w[field];
        if (!v) continue;
        const k = LQ.norm(v);
        if (seen.has(k)) continue;
        if (field === 'blankAnswer') {
          // Ưu tiên đáp án có độ dài gần giống
          const a = word.blankAnswer.split(' ').length, b = v.split(' ').length;
          if (Math.abs(a - b) > 2) continue;
        }
        seen.add(k);
        out.push(w);
      }
    };
    // Đáp án nhiễu cùng loại với đáp án đúng (từ đi với từ, mẫu câu đi với mẫu câu) để không lộ đáp án
    const isSentence = w => /[.?!]$/.test(w.word) || w.word.split(' ').length > 3;
    const same = w => isSentence(w) === isSentence(word) && (w.type === word.type || (w.type !== 'phrase' && word.type !== 'phrase'));
    tryPool((LQ.byTopic[word.topic] || []).filter(w => w.type === word.type));
    tryPool((LQ.byTopic[word.topic] || []).filter(same));
    tryPool(LQ.words.filter(same));
    tryPool(LQ.byTopic[word.topic] || []);
    tryPool(LQ.words);
    return out.slice(0, n);
  }

  function chooseKind(word) {
    const lv = LQ.state.englishLevel || 0;
    const sentence = /[.?!]$/.test(word.word) || word.word.split(' ').length > 3;
    const r = Math.random();
    if (lv === 0) return sentence ? 'meaning' : (r < 0.5 ? 'listen' : 'meaning');
    if (lv === 1) return r < 0.35 ? 'listen' : r < 0.7 ? 'meaning' : 'fill';
    if (sentence) return r < 0.5 ? 'fill' : 'reverse';
    return r < 0.45 ? 'fill' : r < 0.75 ? 'listen' : 'reverse';
  }

  // Trả về { word, kind, prompt, promptBig, hint, audio, options:[{label, emoji}], answer }
  LQ.makeQuestion = (word, forcedKind) => {
    const lv = LQ.state.englishLevel || 0;
    const kind = forcedKind || chooseKind(word);
    let q;
    if (kind === 'listen') {
      const ds = distractors(word, 'word', 3);
      const opts = LQ.shuffle([word, ...ds]);
      const showEmoji = opts.every(w => w.emoji) && new Set(opts.map(w => w.emoji)).size === opts.length;
      q = {
        kind, prompt: 'Nghe và chọn đúng 🔊', audio: word.word,
        options: opts.map(w => ({ label: w.word, emoji: showEmoji ? w.emoji : '' })),
        answer: opts.indexOf(word), grid: showEmoji,
      };
    } else if (kind === 'meaning') {
      const ds = distractors(word, 'vi', 3);
      const opts = LQ.shuffle([word, ...ds]);
      q = {
        kind, prompt: word.word, promptBig: true, hint: 'nghĩa là gì?', audio: word.word,
        options: opts.map(w => ({ label: w.vi })), answer: opts.indexOf(word),
      };
    } else if (kind === 'fill') {
      const ds = distractors(word, 'blankAnswer', 3);
      const opts = LQ.shuffle([word, ...ds]);
      q = {
        kind, prompt: word.blankExample, hint: lv <= 2 ? word.exampleVi : '', audio: '',
        options: opts.map(w => ({ label: w.blankAnswer })), answer: opts.indexOf(word),
        afterAudio: word.example,
      };
    } else { // reverse: Việt → Anh
      const ds = distractors(word, 'word', 3);
      const opts = LQ.shuffle([word, ...ds]);
      q = {
        kind: 'reverse', prompt: `"${word.vi}"`, hint: 'tiếng Anh là gì?', audio: '',
        options: opts.map(w => ({ label: w.word })), answer: opts.indexOf(word), afterAudio: word.word,
      };
    }
    q.word = word;
    if (q.options.length < 2) return null;
    return q;
  };
})(window.LQ);
