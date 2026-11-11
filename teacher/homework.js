/* Homework (10 Nov 2026, teacher): "extend the Handouts section to include one called: 'Homework.' Where teachers can select
   a single topic but then pick any of the tasks to include, with just a tick box." Then: "teachers should be able to swap out
   questions". Ticked: task types (the topic page's games); as long as it needs (no two-side limit, unlike the Vocab handout).
   Lives on the teacher page (teacher/index.html calls AEA_HOMEWORK.route for #/handouts/homework). Staff Room → Handouts.
   - One topic, the levels, then a tick box for each kind of task the topic has (Fill the gap, Spot the error, Crossword…) and
     how many of each. The site deals the questions at those levels; Swap beside any question deals another of the same kind,
     🎲 New set deals the whole task again. Questions taken out through Reports are never dealt (AEA_BOARD.lib.hidden).
   - The Word file: the title, Name / Class / Date, then each task with its instructions. Answers: the same sheet with the
     answers in blue (and the explanations, where the content has them), as a separate Word file.
   - Everything dealt is saved in this browser ("aeaBoard:homework", not "aea:…"), options in the order dealt, so the answer
     sheet still matches the homework after a reload. A saved question that has gone from the content (or been taken out
     through Reports) is replaced by another.
   Content: the topic's CSV files (see content/README.md); the Word file from handouts.js (AEA_HANDOUT.lib); the word search
   from the Starters' maker (AEA_START.ws) and the crossword from en/engine/crossword.js (AEA_XW), with meanings as clues. */
(function(){
'use strict';
const B = window.AEA_BOARD && window.AEA_BOARD.lib, H = window.AEA_HANDOUT && window.AEA_HANDOUT.lib, WS = window.AEA_START && window.AEA_START.ws, XW = window.AEA_XW;
if (!B || !H) return;
const {TOPICS, LEVELS, LEVEL_NAME, parseCSV, levelNum, band, listOf, esc, shuffle, getJ, setJ, topicName} = B;
const {para, table, docx, download, X, WIDTH, cmT, GREY, ANS, twoUp, COLS, wsXML, xwXML} = H;
const ROOT = '../', K = 'aeaBoard:homework', ABC = 'abcdefghij';
const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
// Explanations may have <b> and <i>: plain text here
const plain = s => String(s || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim();
const show = w => String(w || '').split(/\s*\/\s*/)[0].replace(/\s*\([^)]*\)\s*/g, ' ').trim();   // "visitor / user" → visitor
const zhShort = z => (String(z || '').split(/[；;，,]/)[0].replace(/（[^）]*）|\([^)]*\)/g, '').trim() || String(z || '').trim());

// ---------- the tasks: the topic page's games, in its columns ----------
// src: where the items come from (D.items). hid: the game keys a question can be taken out under through Reports.
// n: how many by default, opts: the choices. unit: what one is called. text: one item is a whole text (Swap deals another text).
const TASKS = [
  {k: 'match',      col: 'Vocabulary', name: 'Match the meaning', hid: ['match', 'meaning'], n: 8, opts: [5, 6, 8, 10, 12], unit: ['word', 'words'],
    how: 'Write the letter of the right meaning next to each word.', blurb: 'Words and meanings to pair up.'},
  {k: 'zh',         col: 'Vocabulary', name: '中文 → English', hid: ['zh', 'zhmean', 'zhmatch'], n: 10, opts: [6, 8, 10, 12, 16, 20], unit: ['word', 'words'],
    how: 'Write the English word for each Chinese meaning.', blurb: 'A word in Chinese: they write it in English.'},
  {k: 'tf',         col: 'Vocabulary', name: 'True or false', hid: ['tf'], n: 8, opts: [5, 6, 8, 10, 12, 15], unit: ['statement', 'statements'],
    how: 'Read each statement. Circle True or False.', blurb: 'Statements about the topic: true or false?'},
  {k: 'wchoice',    col: 'Vocabulary', name: 'Word choice', hid: ['wchoice'], n: 1, opts: [1, 2, 3], unit: ['text', 'texts'], text: true,
    how: 'Choose the word (a, b, c or d) that best fits each gap.', blurb: 'Use of English Part 1: a short text with gaps and four choices for each.'},
  {k: 'crossword',  col: 'Vocabulary', name: 'Crossword', hid: ['match', 'meaning'], n: 10, opts: [6, 8, 10, 12], unit: ['word', 'words'], puzzle: true,
    how: 'Each clue is a word’s meaning. Write the words in the grid. The numbers in brackets are how many letters.', blurb: 'Topic words in a crossword, with their meanings as clues.'},
  {k: 'wordsearch', col: 'Vocabulary', name: 'Word search', hid: ['match', 'meaning'], n: 8, opts: [6, 8, 10], unit: ['word', 'words'], puzzle: true,
    how: 'Find the word for each meaning in the square. Words go across, down and diagonally. Tick each one you find.', blurb: 'Topic words hidden in a square of letters; the list gives their meanings.'},
  {k: 'gap',        col: 'Grammar', name: 'Fill the gap', hid: ['gap'], n: 8, opts: [5, 6, 8, 10, 12, 15, 20], unit: ['sentence', 'sentences'],
    how: 'Choose the word (a, b, c or d) that fits the gap.', blurb: 'A sentence with a word missing and four choices.'},
  {k: 'rw',         col: 'Grammar', name: 'Grammar Check', hid: ['rw'], n: 8, opts: [5, 6, 8, 10, 12, 15], unit: ['sentence', 'sentences'],
    how: 'Is the grammar good (✓) or bad (✗)? Circle one. If it’s bad, write the sentence correctly on the line.', blurb: 'Good grammar or bad grammar? If it’s bad, they correct it.'},
  {k: 'error',      col: 'Grammar', name: 'Spot the error', hid: ['error'], n: 1, opts: [1, 2, 3], unit: ['paragraph', 'paragraphs'], text: true,
    how: 'Find the mistakes. Underline each one and write the correction above it.', blurb: 'A short paragraph with mistakes to find and correct.'},
  {k: 'ocloze',     col: 'Grammar', name: 'Open cloze', hid: ['ocloze'], n: 1, opts: [1, 2, 3], unit: ['text', 'texts'], text: true,
    how: 'Write one word in each gap.', blurb: 'Use of English Part 2: one word in each gap of a short text.'},
  {k: 'wform',      col: 'Grammar', name: 'Word formation', hid: ['wform'], n: 1, opts: [1, 2, 3], unit: ['text', 'texts'], text: true,
    how: 'Use the word in capitals to make a word that fits the gap.', blurb: 'Use of English Part 3: change the word in capitals to fit the gap.'},
  {k: 'build',      col: 'Reading', name: 'Build the sentence', hid: ['build'], n: 5, opts: [3, 4, 5, 6, 8, 10], unit: ['sentence', 'sentences'],
    how: 'Put the pieces in order and write the sentence. Some have a piece that doesn’t belong.', blurb: 'Sentence pieces to put in order, with trap pieces.'},
  {k: 'read',       col: 'Reading', name: 'Complete the text', hid: ['read'], n: 1, opts: [1, 2, 3], unit: ['text', 'texts'], text: true,
    how: 'Put a word from the box into each gap. Some words in the box are not needed.', blurb: 'A short text with the key words missing, and a word box.'},
  {k: 'evidence',   col: 'Reading', name: 'Find the evidence', hid: ['evidence'], n: 2, opts: [1, 2, 3, 4], unit: ['task', 'tasks'],
    how: 'Read what the task says. Tick the details that show it: the number to tick is in brackets.', blurb: 'A task about a text and details: they tick the ones that show it.'},
  {k: 'own',        col: 'Reading', name: 'In your own words', hid: ['own'], n: 2, opts: [1, 2, 3, 4], unit: ['extract', 'extracts'], text: true,
    how: 'Read the extract. What does each underlined word mean here? Choose a, b, c or d.', blurb: 'An extract with underlined words: what does each mean here?'},
  {k: 'question',   col: 'Reading', name: 'Answer the question', hid: ['question'], n: 3, opts: [2, 3, 4, 5, 6], unit: ['question', 'questions'],
    how: 'Choose the answer (a, b, c or d) that does what the question asks.', blurb: 'Exam questions: which answer does what the command word asks?'},
  {k: 'translation', col: 'More', name: 'Translation', hid: ['zhtranslate'], n: 5, opts: [3, 4, 5, 6, 8, 10], unit: ['sentence', 'sentences'],
    how: 'Choose the English sentence (a, b, c or d) that means exactly the same as the Chinese.', blurb: 'A sentence in Chinese: which English sentence means the same?'},
  {k: 'gk',         col: 'More', name: 'General knowledge', hid: ['gk'], n: 8, opts: [5, 6, 8, 10, 12, 15], unit: ['question', 'questions'],
    how: 'Choose the right answer (a, b, c or d).', blurb: 'Questions about the wider world of the topic.'}
];
const TASK = Object.fromEntries(TASKS.map(t => [t.k, t]));
const COLS_ORDER = ['Vocabulary', 'Grammar', 'Reading', 'More'];

// ---------- the content ----------
const FILES = ['words', 'gaps', 'tf', 'right-wrong', 'errors', 'builds', 'reads', 'evidence', 'extracts', 'questions', 'knowledge', 'translation', 'word-choice', 'open-cloze', 'word-formation'];
const wrongs = (r, b) => [...new Set([1, 2, 3, 4].map(k => r['wrong' + k + (b || '')]).filter(Boolean))];
const ERR_RE = /\[([^\[\]|]*)\|([^\[\]|]*)\|([^\[\]]*)\]/g;
function errParts(text){
  const out = []; let last = 0, m; ERR_RE.lastIndex = 0;
  while ((m = ERR_RE.exec(text))) { if (m.index > last) out.push({s: text.slice(last, m.index)}); out.push({w: m[1], r: m[2], why: m[3]}); last = m.index + m[0].length; }
  if (last < text.length) out.push({s: text.slice(last)});
  return out;
}
// A text with [[gaps]]: [text, {g: 0}, text, {g: 1}…] and the gaps (Use of English files: as en/engine/app.js clozeRow)
function gapText(text, each){
  const parts = [], gaps = [], re = /\[\[([^\]]+)\]\]/g; let last = 0, m;
  while ((m = re.exec(text))) { parts.push(text.slice(last, m.index)); last = re.lastIndex; const g = each(m[1].split('|').map(s => s.trim())); if (!g) return null; parts.push({g: gaps.length}); gaps.push(g); }
  parts.push(text.slice(last));
  return gaps.length >= 2 ? {parts, gaps} : null;
}
const pieces = v => String(v || '').split('|').map(s => s.trim().replace(/^(topic|verb|detail|link|judge|hedge)\s*:\s*/i, '')).filter(Boolean);
// Crossword and word search: words of letters only, and a meaning that doesn't give the word away
const puzzleOK = w => w.def.length <= 130 && !(XW && XW.gives(w.full, w.def));
const xwOK = w => { if (!XW) return false; const t = XW.show(w.full).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return /^[a-z][a-z '’\-]*$/.test(t) && t.split(/[\s-]+/).filter(Boolean).length <= 4 && XW.letters(w.full).length >= 3 && XW.letters(w.full).length <= 13 && puzzleOK(w); };
const wsOK = w => !!WS && WS.wsOK({w: w.full}) && puzzleOK(w);

const loaded = {};
function loadTopic(key){
  if (loaded[key]) return loaded[key];
  const t = TOPICS.find(x => x.key === key);
  const get = f => fetch(ROOT + 'content/' + key + '/' + f + '.csv', {cache: 'no-cache'}).then(r => r.ok ? r.text() : '').then(parseCSV).catch(() => null);
  const p = Promise.all(FILES.map(get)).then(all => {
    if (all.every(x => x === null)) throw new Error("Couldn't load " + topicName(key) + '.');
    const T = Object.fromEntries(FILES.map((f, i) => [f, all[i] || []])), I = {}, L = r => levelNum(r.level);
    const ids = new Set(), words = [];
    T.words.forEach(r => { if (!r.id || !r.word || !r.meaning || ids.has(r.id)) return; ids.add(r.id);
      const lists = listOf(r.list).map(s => s.toLowerCase());
      if (t && t.list && lists.length && !lists.includes(t.list)) return;   // Representation: the key words
      words.push({id: r.id, lv: L(r), full: r.word, w: show(r.word), pos: r.pos || '', def: r.meaning, zh: r.zh || ''}); });
    I.match = words.filter(w => w.def.length <= 170);
    I.zh = words.filter(w => w.zh);
    I.crossword = words.filter(xwOK);
    I.wordsearch = words.filter(wsOK);
    I.gap = T.gaps.filter(r => r.id && /_{3,}/.test(r.sentence || '') && r.answer && wrongs(r).length)
      .map(r => ({id: r.id, lv: L(r), s: r.sentence, ans: r.answer, wrong: wrongs(r).filter(x => x !== r.answer), why: plain(r.explanation)}));
    I.tf = T.tf.map(r => { const a = String(r.answer || '').trim().toLowerCase(), yes = /^(true|t|yes|y)$/.test(a);
      return r.id && r.statement && (yes || /^(false|f|no|n)$/.test(a)) ? {id: r.id, lv: L(r), s: r.statement, t: yes, why: plain(r.explanation)} : null; }).filter(Boolean);
    I.rw = T['right-wrong'].map(r => { const a = String(r.answer || '').trim().toLowerCase(), ok = /^(right|r|correct|true|t|yes|y)$/.test(a);
      return r.id && r.statement && (ok || /^(wrong|w|incorrect|false|f|no|n)$/.test(a)) ? {id: r.id, lv: L(r), s: r.statement, ok, fix: r.correction || '', why: plain(r.explanation)} : null; }).filter(Boolean);
    I.error = T.errors.map(r => { if (!r.id || !r.text) return null; const parts = errParts(r.text);
      return parts.some(p => 'r' in p) ? {id: r.id, lv: L(r), title: r.title || '', parts} : null; }).filter(Boolean);
    I.build = T.builds.map(r => { const tiles = pieces(r.pieces);
      return r.id && tiles.length >= 2 ? {id: r.id, lv: L(r), goal: r.goal || '', tiles, decoys: pieces(r.decoys),
        alt: String(r.also_right || '').split('||').map(a => a.split('|').map(s => s.trim()).filter(Boolean).join(' ')).filter(Boolean)} : null; }).filter(Boolean);
    I.read = T.reads.map(r => { if (!r.id || !r.text) return null; const g = gapText(r.text, b => b[0] ? {ans: b[0]} : null);
      return g ? {id: r.id, lv: L(r), title: r.title || '', parts: g.parts, gaps: g.gaps, extras: [1, 2, 3].map(k => (r['extra' + k] || '').trim()).filter(Boolean)} : null; }).filter(Boolean);
    I.evidence = T.evidence.map(r => { const right = [...new Set([1, 2, 3, 4].map(k => r['right' + k]).filter(Boolean))], wrong = [...new Set([1, 2, 3, 4, 5].map(k => r['wrong' + k]).filter(Boolean))].filter(x => !right.includes(x));
      return r.id && r.statement && right.length && wrong.length >= 2 && !/^(zh|cn|chinese)/i.test(String(r.side || '').trim()) ? {id: r.id, lv: L(r), s: r.statement, right, wrong, why: plain(r.explanation)} : null; }).filter(Boolean);
    I.own = T.extracts.map(r => { const n = (String(r.extract || '').match(/\[[^\]]+\]/g) || []).length, qs = [];
      for (let k = 1; k <= 9; k++) { const a = k === 1 ? '' : String(k), b = k === 1 ? '' : '_' + k; if (!r['correct' + a]) break; qs.push({c: r['correct' + a], wrong: wrongs(r, b)}); }
      return r.id && n && n === qs.length && qs.every(q => q.wrong.length) ? {id: r.id, lv: L(r), t: r.extract, qs} : null; }).filter(Boolean);
    I.question = T.questions.filter(r => r.id && r.question && r.correct && wrongs(r).length)
      .map(r => ({id: r.id, lv: L(r), cmd: r.command || '', q: r.question, ans: r.correct, wrong: wrongs(r), why: plain(r.explanation)}));
    I.gk = T.knowledge.filter(r => r.id && r.question && r.correct && wrongs(r).length)
      .map(r => ({id: r.id, lv: L(r), q: r.question, ans: r.correct, wrong: wrongs(r), why: plain(r.explanation)}));
    I.translation = T.translation.map(r => { const wrong = wrongs(r).filter(x => x !== r.english);
      return r.id && r.zh && r.english && wrong.length >= 2 ? {id: r.id, lv: L(r), zh: r.zh, ans: r.english, wrong, why: plain(r.explanation)} : null; }).filter(Boolean);
    I.wchoice = T['word-choice'].map(r => { const g = r.id && r.text && gapText(r.text, b => { const o = [...new Set(b.filter(Boolean))]; return o.length >= 3 ? {opts: o} : null; });
      return g ? {id: r.id, lv: L(r), title: r.title || '', parts: g.parts, gaps: g.gaps} : null; }).filter(Boolean);
    I.ocloze = T['open-cloze'].map(r => { const g = r.id && r.text && gapText(r.text, b => { const a = String(b[0] || '').split('/').map(s => s.trim()).filter(Boolean); return a.length ? {ans: a} : null; });
      return g ? {id: r.id, lv: L(r), title: r.title || '', parts: g.parts, gaps: g.gaps} : null; }).filter(Boolean);
    I.wform = T['word-formation'].map(r => { const g = r.id && r.text && gapText(r.text, b => { const a = String(b[0] || '').split('/').map(s => s.trim()).filter(Boolean); return a.length && b[1] ? {ans: a, stem: b[1]} : null; });
      return g ? {id: r.id, lv: L(r), title: r.title || '', parts: g.parts, gaps: g.gaps} : null; }).filter(Boolean);
    return {key, I};
  });
  loaded[key] = p; p.catch(() => { delete loaded[key]; });
  return p;
}
// The items a task can use at these levels (a row with no level: every level), without questions taken out through Reports
const hiddenItem = (key, t, id) => t.hid.some(g => B.hidden(key, g, String(id)));
const poolOf = (D, k, levels) => (D.I[k] || []).filter(it => (it.lv == null || levels.includes(band(it.lv))) && !hiddenItem(D.key, TASK[k], it.id));

// ---------- dealing: a question as it goes on the sheet (options in the order dealt, kept so the answers still match) ----------
const mc = (right, wrong) => { const opts = shuffle([right, ...shuffle(wrong).slice(0, 3)]); return {opts, a: opts.indexOf(right)}; };
function deal(k, it){
  const base = {id: it.id};
  switch (k) {
    case 'match': return Object.assign(base, {w: it.w, pos: it.pos, def: it.def});
    case 'zh': return Object.assign(base, {w: it.w, zh: zhShort(it.zh)});
    case 'crossword': case 'wordsearch': return Object.assign(base, {w: it.w, full: it.full, def: it.def});
    case 'tf': return Object.assign(base, {s: it.s, t: it.t, why: it.why});
    case 'rw': return Object.assign(base, {s: it.s, ok: it.ok, fix: it.fix, why: it.why});
    case 'gap': return Object.assign(base, {s: it.s.replace(/_{3,}/, '___'), why: it.why}, mc(it.ans, it.wrong));
    case 'question': return Object.assign(base, {cmd: it.cmd, q: it.q, why: it.why}, mc(it.ans, it.wrong));
    case 'gk': return Object.assign(base, {q: it.q, why: it.why}, mc(it.ans, it.wrong));
    case 'translation': return Object.assign(base, {zh: it.zh, why: it.why}, mc(it.ans, it.wrong));
    case 'error': return Object.assign(base, {title: it.title, parts: it.parts});
    case 'build': { let p = shuffle(it.tiles.concat(it.decoys)); for (let i = 0; i < 8 && p.join(' ') === it.tiles.join(' '); i++) p = shuffle(p);
      return Object.assign(base, {goal: it.goal, tiles: it.tiles, decoys: it.decoys, alt: it.alt, pieces: p}); }
    case 'read': { const seen = new Set(), bank = it.gaps.map(g => g.ans).concat(it.extras).filter(w => { const l = w.toLowerCase(); if (seen.has(l)) return false; seen.add(l); return true; });
      return Object.assign(base, {title: it.title, parts: it.parts, gaps: it.gaps, bank: shuffle(bank)}); }
    case 'evidence': return Object.assign(base, {s: it.s, why: it.why, opts: shuffle(it.right.concat(it.wrong)), right: it.right});
    case 'own': return Object.assign(base, {t: it.t, qs: it.qs.map(q => mc(q.c, q.wrong))});
    case 'wchoice': return Object.assign(base, {title: it.title, parts: it.parts, gaps: it.gaps.map(g => mc(g.opts[0], g.opts.slice(1)))});
    case 'ocloze': case 'wform': return Object.assign(base, {title: it.title, parts: it.parts, gaps: it.gaps});
  }
  return base;
}
// The puzzles: made again whenever their words change. Meanings are the clues (in the "zh" field the shared Word tables read).
function makePuzzle(k, words, n){
  if (k === 'crossword') {
    if (!XW) return null;
    const fit = words.map(w => ({id: w.id, w: w.w, zh: w.def, en: XW.enumeration(w.full), L: XW.letters(w.full)})).filter((c, i, all) => !all.slice(0, i).some(o => o.L === c.L));
    const lay = XW.make(fit, {n: Math.min(n, fit.length), maxW: 13, maxH: 13}); if (!lay || lay.words.length < Math.min(4, n)) return null;
    const clue = x => ({id: x.id, num: x.num, zh: x.zh, en: x.en, w: x.w});
    return {w: lay.w, h: lay.h, cells: lay.cells, nums: lay.nums, across: lay.across.map(clue), down: lay.down.map(clue)};
  }
  if (!WS) return null;
  const fit = words.map(w => ({id: w.id, w: WS.wsShow({w: w.full}), zh: w.def, L: WS.wsL({w: w.full})})).filter((c, i, all) => !all.slice(0, i).some(o => o.L.includes(c.L) || c.L.includes(o.L)));
  const m = Math.min(n, fit.length); if (m < 4) return null;
  const size = fit.slice(0, m).some(c => c.L.length > 10) || m > 7 ? 12 : 10, made = WS.wsMake(fit, m, size, WS.WS_DIRS[3]);
  return made ? {size, b: made.b.map(r => r.join('')), words: made.placed.map(p => ({id: p.id, w: p.w, zh: p.zh, n: p.L.length, cells: p.cells}))} : null;
}
const puzWords = (k, p) => !p ? [] : k === 'crossword' ? p.across.concat(p.down) : p.words;
// Never the same thing twice in one task: the same sentence (some files have one sentence with different answers), or, in
// Fill the gap, the same answer word. Works on a content row or a question as dealt.
const norm = v => String(v || '').toLowerCase().replace(/_{3,}/g, '___').replace(/\s+/g, ' ').trim();
function keysOf(k, x){
  const out = ['id:' + x.id];
  if (k === 'gap') out.push('s:' + norm(x.s), 'a:' + norm(x.ans != null ? x.ans : x.opts[x.a]));
  else if (k === 'tf' || k === 'rw' || k === 'evidence') out.push('s:' + norm(x.s));
  else if (k === 'question' || k === 'gk') out.push('s:' + norm(x.q));
  else if (k === 'translation') out.push('s:' + norm(x.zh));
  else if (x.w) out.push('w:' + norm(x.w));
  return out;
}

// =====================================================================================================================
let C = null;
const AEA_HOMEWORK = window.AEA_HOMEWORK = {
  route(hash, ctx){ C = ctx; return page(); },
  stop(){}
};
const DEFAULTS = {topic: '', levels: [1, 2, 3, 4, 5], on: {gap: 8, error: 1, build: 5}, title: '', hw: {}};
const state = () => { const s = Object.assign(JSON.parse(JSON.stringify(DEFAULTS)), getJ(K, {}) || {});
  s.on = Object.fromEntries(Object.entries(s.on || {}).filter(([k, n]) => TASK[k] && n > 0)); s.levels = (s.levels || []).filter(n => LEVEL_NAME[n]);
  if (!s.levels.length) s.levels = [1, 2, 3, 4, 5]; s.hw = s.hw && typeof s.hw === 'object' ? s.hw : {}; return s; };
function page(){
  C.setTitle('Homework'); C.header();
  B.loadHidden();
  const st = state(), topics = TOPICS.filter(t => !t.only);
  if (!topics.some(t => t.key === st.topic)) st.topic = topics[0].key;
  let D = null, showAns = true;
  const save = () => { setJ(K, st); C.touch(); };
  const mine = () => (st.hw[st.topic] = st.hw[st.topic] || {});
  C.view.innerHTML = '<p style="margin:0 0 14px"><a class="backlink" href="#/">← Staff Room</a></p>' +
    '<p class="note st-lead">Homework from one topic. Tick the tasks you want and how many of each: the site chooses the questions at the levels you pick, and Swap changes any question you don\'t want. Download it as a Word file to print or change, and the answers as a separate file.</p>' +
    '<div class="st-build"><div class="st-main"><section class="card st-sec">' +
      '<div class="mt-bar"><div class="field"><label for="hw-topic">Topic</label><select id="hw-topic">' + topics.map(t => '<option value="' + t.key + '"' + (t.key === st.topic ? ' selected' : '') + '>' + esc(t.name) + '</option>').join('') + '</select></div></div>' +
      '<div class="bg-chips" id="hw-levels" role="group" aria-label="Levels">' + LEVELS.map(([n, name]) => '<label class="bg-chip"><input type="checkbox" value="' + n + '"' + (st.levels.includes(n) ? ' checked' : '') + '><span>' + name + '</span></label>').join('') + '</div>' +
      '<div id="hw-tasks" class="hw-tasks"><p class="note">Loading the topic…</p></div></section></div>' +
    '<aside class="st-side"><div class="card st-sec st-stick">' +
      '<div class="spread"><h2>Your homework</h2><span class="st-room" id="hw-n"></span></div>' +
      '<div class="field"><label for="hw-title">Title</label><input type="text" id="hw-title" maxlength="70"></div>' +
      '<div class="row"><button class="btn" type="button" id="hw-dl">Download the Word file</button></div>' +
      '<div class="row"><button class="btn small alt" type="button" id="hw-ans" title="The same sheet with the answers in blue">Answers (Word file)</button><button class="btn small alt" type="button" id="hw-new" title="Every task dealt again">🎲 New questions</button></div>' +
      '<p class="err" id="hw-err" role="alert" hidden></p>' +
      '<h3 class="ho-h">In this homework</h3><ol class="hw-sum" id="hw-sum"></ol>' +
    '</div></aside></div>' +
    '<section class="card st-sec hw-sheet-card"><div class="spread"><h2>The questions</h2><label class="hw-show"><input type="checkbox" id="hw-showans" checked> Show the answers</label></div>' +
      '<p class="note">This is what goes in the Word file. Swap puts another question of the same kind in its place; 🎲 New set changes the whole task.</p>' +
      '<div id="hw-sheet" class="hw-sheet show-ans"></div></section>';
  const $ = s => C.view.querySelector(s), $$ = s => [...C.view.querySelectorAll(s)];
  const err = m => { const e = $('#hw-err'); e.textContent = m || ''; e.hidden = !m; };
  const title = () => st.title.trim() || topicName(st.topic) + ': homework';
  const has = k => !!(D && (D.I[k] || []).length);
  const pool = k => D ? poolOf(D, k, st.levels) : [];
  const ticked = () => TASKS.filter(t => st.on[t.k] && has(t.k) && pool(t.k).length);
  const wanted = t => Math.min(st.on[t.k], t.puzzle ? 99 : pool(t.k).length);

  // Bring a task's questions up to date: keep the ones still allowed (in the order and with the options dealt), drop the
  // rest, deal more up to the number wanted. A puzzle is kept as it is while all its words are still allowed and the number
  // is the same (so its answer sheet still matches after a reload); otherwise it is made again.
  const fill = (k, fresh) => {
    const t = TASK[k], M = mine(), P = pool(k), ok = new Set(P.map(it => it.id)), n = wanted(t);
    let m = M[k]; if (fresh || !m) m = M[k] = {items: [], out: (m && m.out) || []};
    if (t.puzzle && !fresh && m.puz && m.n === n && puzWords(k, m.puz).every(x => ok.has(x.id))) return;
    const before = (m.items || []).map(x => x.id).join('|');
    m.items = (m.items || []).filter(x => ok.has(x.id)).slice(0, n);
    const used = new Set(m.items.flatMap(x => keysOf(k, x)));
    for (const it of shuffle(P)) { if (m.items.length >= n) break; const ks = keysOf(k, it); if (!ks.some(x => used.has(x))) { ks.forEach(x => used.add(x)); m.items.push(deal(k, it)); } }
    if (k === 'match' && (m.items.map(x => x.id).join('|') !== before || !m.perm || m.perm.length !== m.items.length)) m.perm = shuffle(m.items.map(x => x.id));
    if (t.puzzle) puzzle(k, m, n);
  };
  // A puzzle: its words first, then others in case some don't fit; the words that went in become the task's words
  const puzzle = (k, m, n) => {
    const P = pool(k), byId = Object.fromEntries(P.map(it => [it.id, it])), want = m.items.map(x => x.id);
    m.n = n;
    for (let tries = 0; tries < 6; tries++) {
      const extra = shuffle(P.filter(it => !want.includes(it.id) && !(m.out || []).includes(it.id))).map(it => deal(k, it));
      const p = makePuzzle(k, m.items.concat(extra), n);
      if (p) { m.puz = p; m.items = puzWords(k, p).map(x => deal(k, byId[x.id])); return; }
    }
    m.puz = null;
  };
  // Swap one question for another of the same kind (not one just swapped out, while there are others)
  const swap = (k, i) => {
    const t = TASK[k], m = mine()[k]; if (!m) return;
    const P = pool(k), cur = new Set(m.items.map(x => x.id)), out = new Set(m.out || []), taken = new Set(m.items.filter((x, j) => j !== i).flatMap(x => keysOf(k, x)));
    const free = it => !cur.has(it.id) && !keysOf(k, it).some(x => taken.has(x));
    let from = P.filter(it => free(it) && !out.has(it.id)); if (!from.length) { m.out = []; from = P.filter(free); }
    if (!from.length) { flash(k, i, 'No other ' + t.unit[1] + ' at these levels'); return; }
    const old = m.items[i]; m.out = (m.out || []).concat(old.id).slice(-40);
    if (t.puzzle) {
      m.items.splice(i, 1);
      for (const it of shuffle(from).slice(0, 12)) {
        const p = makePuzzle(k, m.items.concat(deal(k, it), shuffle(from.filter(x => x !== it)).map(x => deal(k, x))), st.on[k]);
        if (p && puzWords(k, p).some(x => x.id === it.id)) { const byId = Object.fromEntries(P.map(x => [x.id, x])); m.puz = p; m.items = puzWords(k, p).map(x => deal(k, byId[x.id])); return done(k); }
      }
      m.items.splice(i, 0, old); flash(k, i, 'No other word fits this puzzle'); return;
    }
    const it = shuffle(from)[0], nu = deal(k, it); m.items[i] = nu;
    if (k === 'match' && m.perm) m.perm = m.perm.map(id => id === old.id ? nu.id : id);
    done(k);
  };
  const done = k => { save(); drawSum(); drawTask(k); };
  const flash = (k, i, msg) => { const b = $('#hw-t-' + k + ' [data-i="' + i + '"]'); if (!b) return; const was = b.textContent; b.textContent = msg; b.disabled = true; setTimeout(() => { b.textContent = was; b.disabled = false; }, 1800); };

  // ---------- the left side: the levels and the tasks ----------
  const drawTasks = () => {
    const box = $('#hw-tasks');
    if (!D) { box.innerHTML = '<p class="note">Loading the topic…</p>'; return; }
    const there = TASKS.filter(t => has(t.k));
    if (!there.length) { box.innerHTML = '<p class="note">' + esc(topicName(st.topic)) + ' has no tasks for homework yet.</p>'; return; }
    box.innerHTML = COLS_ORDER.map(col => { const ts = there.filter(t => t.col === col); if (!ts.length) return '';
      return '<h3 class="ho-h hw-col">' + col + '</h3>' + ts.map(t => { const n = pool(t.k).length, on = !!st.on[t.k], off = !n;
        let vals = t.puzzle ? t.opts.slice() : t.opts.filter(v => v <= n); if (!vals.length) vals = [n];
        const cur = t.puzzle ? st.on[t.k] : Math.min(st.on[t.k] || t.n, n); if (on && !vals.includes(cur)) vals = vals.concat(cur).sort((a, b) => a - b);
        const sel = on && !off ? '<select class="hw-num" data-k="' + t.k + '" aria-label="How many ' + esc(t.unit[1]) + ' in ' + esc(t.name) + '">' +
          vals.map(v => '<option value="' + v + '"' + (v === cur ? ' selected' : '') + '>' + plural(v, t.unit[0]) + '</option>').join('') + '</select>' : '';
        return '<div class="hw-task' + (on && !off ? ' on' : '') + (off ? ' off' : '') + '"><label><input type="checkbox" value="' + t.k + '"' + (on ? ' checked' : '') + (off && !on ? ' disabled' : '') + '>' +
          '<span><b>' + esc(t.name) + '</b><span class="note">' + (off ? 'None at these levels' : esc(t.blurb) + ' · ' + plural(n, t.unit[0]) + ' at these levels') + '</span></span></label>' + sel + '</div>'; }).join(''); }).join('');
    $$('#hw-tasks input[type=checkbox]').forEach(i => i.onchange = () => { const k = i.value;
      if (i.checked) { st.on[k] = st.on[k] || TASK[k].n; fill(k); } else delete st.on[k];
      save(); drawTasks(); drawSum(); drawSheet(); });
    $$('#hw-tasks .hw-num').forEach(s => s.onchange = () => { st.on[s.dataset.k] = +s.value; fill(s.dataset.k); save(); drawSum(); drawTask(s.dataset.k); });
  };
  const drawSum = () => {
    const ts = ticked(), q = ts.reduce((a, t) => a + ((mine()[t.k] || {}).items || []).length, 0);
    $('#hw-n').textContent = ts.length ? plural(ts.length, 'task') : '';
    $('#hw-sum').innerHTML = ts.length ? ts.map(t => { const m = mine()[t.k] || {items: []}, n = m.items.length;
      return '<li><a href="#hw-t-' + t.k + '" data-jump="' + t.k + '">' + esc(t.name) + '</a> <span class="note">' + (t.puzzle && !m.puz ? 'couldn’t be made' : plural(n, t.unit[0])) + '</span></li>'; }).join('')
      : '<li class="mt-none">Tick some tasks.</li>';
    $$('#hw-sum [data-jump]').forEach(a => a.onclick = e => { e.preventDefault(); const s = $('#hw-t-' + a.dataset.jump); if (s) s.scrollIntoView({block: 'start', behavior: 'smooth'}); });
  };
  // ---------- the questions, as they go on the sheet ----------
  const drawTask = k => { const s = $('#hw-t-' + k), ts = ticked(), i = ts.findIndex(t => t.k === k); if (!s || i < 0) return drawSheet(); s.outerHTML = taskHTML(ts[i], i + 1, mine()[k]); };
  const drawSheet = () => { const ts = ticked();
    $('#hw-sheet').innerHTML = !D ? '<p class="note">Loading…</p>' : ts.length ? ts.map((t, i) => taskHTML(t, i + 1, mine()[t.k])).join('') : '<p class="note">Tick some tasks, and their questions appear here.</p>'; };
  $('#hw-sheet').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.swap) swap(b.dataset.swap, +b.dataset.i);
    else if (b.dataset.redo) { fill(b.dataset.redo, true); done(b.dataset.redo); } });
  $('#hw-showans').onchange = () => { showAns = $('#hw-showans').checked; $('#hw-sheet').classList.toggle('show-ans', showAns); };

  const loadIt = () => { D = null; drawTasks(); drawSum(); drawSheet(); err('');
    const key = st.topic;
    loadTopic(key).then(d => { if (st.topic !== key) return; D = d; TASKS.forEach(t => { if (st.on[t.k] && has(t.k)) fill(t.k); }); save(); drawTasks(); drawSum(); drawSheet(); })
      .catch(x => { $('#hw-tasks').innerHTML = '<p class="err">' + esc(x.message) + ' Check your internet connection and try again.</p>'; }); };
  $('#hw-topic').onchange = () => { st.topic = $('#hw-topic').value; save(); $('#hw-title').placeholder = topicName(st.topic) + ': homework'; loadIt(); };
  $$('#hw-levels input').forEach(i => i.onchange = () => { const lv = $$('#hw-levels input:checked').map(x => +x.value);
    if (!lv.length) { i.checked = true; return; }
    st.levels = lv; if (D) TASKS.forEach(t => { if (st.on[t.k] && has(t.k)) fill(t.k); }); save(); drawTasks(); drawSum(); drawSheet(); });
  $('#hw-title').value = st.title; $('#hw-title').placeholder = topicName(st.topic) + ': homework';
  $('#hw-title').oninput = () => { st.title = $('#hw-title').value; save(); };
  $('#hw-new').onclick = () => { if (!D) return; ticked().forEach(t => fill(t.k, true)); save(); drawSum(); drawSheet(); };
  const model = () => ticked().map(t => ({t, m: mine()[t.k]})).filter(x => x.m && x.m.items.length && (!x.t.puzzle || x.m.puz));
  const ready = () => { if (!D) return false; if (!model().length) { err('Tick at least one task first.'); return false; } err(''); return true; };
  const fname = s => (title().replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Homework') + s + '.docx';
  const sub = () => 'Homework  ·  ' + topicName(st.topic) + '  ·  ' + levelsName(st.levels);
  $('#hw-dl').onclick = () => { if (ready()) download(docx(sheetXML(title(), sub(), model(), false)), fname('')); };
  $('#hw-ans').onclick = () => { if (ready()) download(docx(sheetXML(title(), sub(), model(), true)), fname(' (answers)')); };
  loadIt();
}
const levelsName = lv => lv.length === 5 ? 'All levels' : lv.slice().sort().map(n => LEVEL_NAME[n]).join(', ');

// =====================================================================================================================
// ---------- on the page ----------
const H_ = s => esc(s);
const swapBtn = (k, i, what) => '<button type="button" class="btn small alt hw-swap" data-swap="' + k + '" data-i="' + i + '" title="Put another ' + esc(what) + ' in its place">⇄ Swap</button>';
const ansLine = (a, why) => '<div class="hw-a"><b>Answer:</b> ' + a + (why ? ' <span class="hw-why">' + H_(why) + '</span>' : '') + '</div>';
const optsHTML = (opts, a) => '<ol class="hw-opts">' + opts.map((o, j) => '<li' + (j === a ? ' class="hw-right"' : '') + '><b>' + ABC[j] + ')</b> ' + H_(o) + '</li>').join('') + '</ol>';
const textHTML = (parts, gap) => parts.map(p => typeof p === 'string' ? H_(p) : gap(p.g)).join('');
function taskHTML(t, n, m){
  const head = '<div class="hw-th"><h3>Task ' + n + ': ' + H_(t.name) + '</h3><button type="button" class="btn small alt" data-redo="' + t.k + '" title="Deal the whole task again">🎲 New set</button></div><p class="hw-how">' + H_(t.how) + '</p>';
  const items = m ? m.items : [], q = (i, body) => '<li class="hw-q"><div class="hw-qb">' + body + '</div>' + swapBtn(t.k, i, t.unit[0]) + '</li>';
  let body = '';
  const k = t.k;
  if (t.puzzle && (!m || !m.puz)) body = '<p class="err">Couldn’t make a ' + t.name.toLowerCase() + ' from these words. Try 🎲 New set, or fewer words.</p>';
  else if (k === 'match') { const by = Object.fromEntries(items.map(x => [x.id, x])), order = (m.perm || items.map(x => x.id)).filter(id => by[id]);
    body = '<ol class="hw-qs hw-inline">' + items.map((x, i) => q(i, '<b>' + H_(x.w) + '</b>' + (x.pos ? ' <span class="hw-pos">' + H_(x.pos) + '</span>' : '') + ' ……' + ansLine(ABC[order.indexOf(x.id)] + ')')) ).join('') + '</ol>' +
      '<div class="hw-box"><b>Meanings</b><ol class="hw-opts">' + order.map((id, j) => '<li><b>' + ABC[j] + ')</b> ' + H_(by[id].def) + '</li>').join('') + '</ol></div>'; }
  else if (k === 'crossword' || k === 'wordsearch') { const p = m.puz, ws = puzWords(k, p);
    body = '<div class="hw-puz">' + gridHTML(k, p) + '<ol class="hw-qs hw-clues">' + ws.map(x => { const i = items.findIndex(y => y.id === x.id);
      return q(i, (k === 'crossword' ? '<b>' + x.num + (p.across.includes(x) ? ' across' : ' down') + '</b> ' : '') + H_(x.zh) + ' <span class="hw-pos">' + (k === 'crossword' ? H_(x.en) : '(' + x.n + ')') + '</span>' + ansLine(H_(x.w))); }).join('') + '</ol></div>'; }
  else body = '<ol class="hw-qs' + (k === 'zh' ? ' hw-inline' : '') + '">' + items.map((x, i) => q(i, itemHTML(k, x, i))).join('') + '</ol>';
  return '<section class="hw-t" id="hw-t-' + k + '">' + head + body + '</section>';
}
function itemHTML(k, x){
  switch (k) {
    case 'zh': return '<span class="hw-zh">' + H_(x.zh) + '</span> ……' + ansLine(H_(x.w));
    case 'tf': return H_(x.s) + ' <span class="hw-pick">True / False</span>' + ansLine(x.t ? 'True' : 'False', x.why);
    case 'rw': return H_(x.s) + ' <span class="hw-pick">✓ / ✗</span>' + ansLine(x.ok ? '✓ Good grammar' : '✗ Bad grammar' + (x.fix ? ': ' + H_(x.fix) : ''), x.why);
    case 'gap': return H_(x.s).replace('___', '<span class="hw-blank"></span>') + optsHTML(x.opts, x.a) + ansLine(ABC[x.a] + ') ' + H_(x.opts[x.a]), x.why);
    case 'question': return (x.cmd ? '<b>' + H_(x.cmd) + ':</b> ' : '') + H_(x.q) + optsHTML(x.opts, x.a) + ansLine(ABC[x.a] + ')', x.why);
    case 'gk': return H_(x.q) + optsHTML(x.opts, x.a) + ansLine(ABC[x.a] + ') ' + H_(x.opts[x.a]), x.why);
    case 'translation': return '<span class="hw-zh">' + H_(x.zh) + '</span>' + optsHTML(x.opts, x.a) + ansLine(ABC[x.a] + ')', x.why);
    case 'error': { const n = x.parts.filter(p => 'r' in p).length;
      return (x.title ? '<b>' + H_(x.title) + '</b> ' : '') + '<span class="hw-pos">(' + plural(n, 'mistake') + ')</span><p class="hw-text">' + x.parts.map(p => 'r' in p ? '<span class="hw-err">' + (p.w ? H_(p.w) : '<span class="hw-a2">‸</span>') + '</span>' : H_(p.s)).join('') + '</p>' +
        ansLine(x.parts.filter(p => 'r' in p).map(p => (p.w ? '<s>' + H_(p.w) + '</s> → ' : 'add ') + '<b>' + H_(p.r || '(nothing)') + '</b>').join('; ')); }
    case 'build': return (x.goal ? '<span class="hw-pos">' + H_(x.goal) + '</span><br>' : '') + x.pieces.map(p => '<span class="hw-piece">' + H_(p) + '</span>').join(' ') +
      (x.decoys.length ? ' <span class="hw-pos">(' + (x.decoys.length === 1 ? 'one piece doesn’t belong' : x.decoys.length + ' pieces don’t belong') + ')</span>' : '') +
      ansLine(H_(x.tiles.join(' ')) + (x.alt.length ? ' <span class="hw-why">Also right: ' + H_(x.alt.join(' / ')) + '</span>' : ''));
    case 'read': return (x.title ? '<b>' + H_(x.title) + '</b>' : '') + '<p class="hw-text">' + textHTML(x.parts, g => '<span class="hw-gapn">(' + (g + 1) + ')</span><span class="hw-blank"></span>') + '</p>' +
      '<div class="hw-box">' + x.bank.map(H_).join(' · ') + '</div>' + ansLine(x.gaps.map((g, i) => (i + 1) + ' ' + H_(g.ans)).join(' · '));
    case 'evidence': return '<b>' + H_(x.s) + '</b> <span class="hw-pos">(tick ' + x.right.length + ')</span><ul class="hw-ticks">' + x.opts.map(o => '<li' + (x.right.includes(o) ? ' class="hw-right"' : '') + '>☐ ' + H_(o) + '</li>').join('') + '</ul>' +
      ansLine(x.right.map(H_).join(' · '), x.why);
    case 'own': { const words = (x.t.match(/\[([^\]]+)\]/g) || []).map(s => s.slice(1, -1));
      return '<p class="hw-text">' + H_(x.t).replace(/\[([^\]]+)\]/g, (m0, s) => '<u>' + s + '</u>') + '</p>' + x.qs.map((qq, j) => '<div class="hw-sub">What does <b>' + H_(words[j] || '') + '</b> mean here?' + optsHTML(qq.opts, qq.a) + '</div>').join('') +
        ansLine(x.qs.map((qq, j) => H_(words[j] || '') + ': ' + ABC[qq.a] + ') ' + H_(qq.opts[qq.a])).join(' · ')); }
    case 'wchoice': return (x.title ? '<b>' + H_(x.title) + '</b>' : '') + '<p class="hw-text">' + textHTML(x.parts, g => '<span class="hw-gapn">(' + (g + 1) + ')</span><span class="hw-blank"></span>') + '</p>' +
      '<ol class="hw-wc">' + x.gaps.map((g, i) => '<li><b>' + (i + 1) + '</b> ' + g.opts.map((o, j) => '<span' + (j === g.a ? ' class="hw-right"' : '') + '>' + ABC[j] + ') ' + H_(o) + '</span>').join('') + '</li>').join('') + '</ol>' +
      ansLine(x.gaps.map((g, i) => (i + 1) + ' ' + ABC[g.a] + ') ' + H_(g.opts[g.a])).join(' · '));
    case 'ocloze': case 'wform': return (x.title ? '<b>' + H_(x.title) + '</b>' : '') + '<p class="hw-text">' + textHTML(x.parts, g => '<span class="hw-gapn">(' + (g + 1) + ')</span><span class="hw-blank"></span>' +
        (k === 'wform' ? ' <b class="hw-stem">' + H_(x.gaps[g].stem) + '</b>' : '')) + '</p>' + ansLine(x.gaps.map((g, i) => (i + 1) + ' ' + H_(g.ans.join(' / '))).join(' · '));
  }
  return '';
}
function gridHTML(k, p){
  if (k === 'wordsearch') return '<table class="hw-grid" aria-label="Word search">' + p.b.map(r => '<tr>' + r.split('').map(ch => '<td>' + ch + '</td>').join('') + '</tr>').join('') + '</table>';
  let h = '<table class="hw-grid hw-xw" aria-label="Crossword">';
  for (let r = 0; r < p.h; r++) { h += '<tr>'; for (let c = 0; c < p.w; c++) { const i = r * p.w + c, ch = p.cells[i];
    h += ch ? '<td class="on">' + (p.nums[i] ? '<i>' + p.nums[i] + '</i>' : '') + '<span class="hw-a2">' + ch + '</span></td>' : '<td></td>'; } h += '</tr>'; }
  return h + '</table>';
}

// =====================================================================================================================
// ---------- the Word file (A4, the Vocab handout's margins and fonts; handouts.js) ----------
function run(text, o){ o = o || {};
  const pr = (o.font ? '<w:rFonts w:ascii="' + o.font + '" w:hAnsi="' + o.font + '" w:cs="' + o.font + '"/>' : '') + (o.b ? '<w:b/>' : '') + (o.i ? '<w:i/>' : '') + (o.strike ? '<w:strike/>' : '') +
    (o.color ? '<w:color w:val="' + o.color + '"/>' : '') + (o.sz ? '<w:sz w:val="' + Math.round(o.sz * 2) + '"/><w:szCs w:val="' + Math.round(o.sz * 2) + '"/>' : '') +
    (o.u ? '<w:u w:val="single"/>' : '') + (o.shade ? '<w:shd w:val="clear" w:color="auto" w:fill="' + o.shade + '"/>' : '');
  return '<w:r>' + (pr ? '<w:rPr>' + pr + '</w:rPr>' : '') + '<w:t xml:space="preserve">' + X(text) + '</w:t></w:r>';
}
const BLANK = '______________', IND = 360;
const blue = ans => ans ? {b: true, color: ANS} : {};
const why = (ans, s) => ans && s ? para(run(s, {sz: 9, color: GREY, i: true}), {ind: IND, after: 60}) : '';
const num = i => run((i + 1) + '.  ', {b: true});
const indent = (xml, tw) => xml.replace(/(<w:tblW [^>]*\/>)/, '$1<w:tblInd w:w="' + tw + '" w:type="dxa"/>');   // (tblInd comes after tblW)
const lines = k => indent(table([WIDTH - IND], Array.from({length: k}, () => ({h: cmT(0.85), cells: [{line: true, va: 'bottom'}]})), {borders: false, pad: 0}), IND);
// Options: on one line when they're short, else one under another
function opts(list, a, ans){
  const short = list.every(o => o.length <= 22) && list.join('').length <= 52;   // (with the letters and spaces, about one line of A4)
  if (short) return para(list.flatMap((o, j) => [run(ABC[j] + ')  ', {b: true, color: ans && j === a ? ANS : ''}), run(o, ans && j === a ? {b: true, color: ANS, u: true} : {}), run(j < list.length - 1 ? '        ' : '')]), {ind: IND, before: 40, after: 100});
  return list.map((o, j) => para([run(ABC[j] + ')  ', {b: true, color: ans && j === a ? ANS : ''}), run(o, ans && j === a ? {b: true, color: ANS} : {})], {ind: IND, before: j ? 0 : 40, after: j === list.length - 1 ? 100 : 30})).join('');
}
// A text with numbered gaps (Complete the text, the Use of English texts); answers in the gaps on the answer sheet
function gappedText(x, ans, gapAns, after){
  return para(x.parts.flatMap(p => typeof p === 'string' ? [run(p)] : [run('(' + (p.g + 1) + ') ', {b: true, sz: 9.5}), ans ? run(gapAns(p.g), {b: true, u: true, color: ANS}) : run(BLANK)].concat(after ? after(p.g) : [])), {line: 360, after: 120});
}
function head(n, t, ans){
  return para(run('Task ' + n + ':  ' + t.name, {b: true, sz: 12.5}), {before: 280, after: 30, keepNext: true}) + (ans ? '' : para(run(t.how, {sz: 9.5, color: GREY}), {after: 100, keepNext: true}));
}
function taskXML(t, n, m, ans){
  const k = t.k, it = m.items;
  let b = '';
  if (k === 'match') {
    const by = Object.fromEntries(it.map(x => [x.id, x])), order = (m.perm || it.map(x => x.id)).filter(id => by[id]);
    const rows = Array.from({length: Math.max(it.length, order.length)}, (_, i) => { const x = it[i], d = by[order[i]];
      return {cells: [{x: x ? para([num(i), run(x.w, {b: true}), run(x.pos ? '  ' + x.pos : '', {sz: 8.5, color: GREY}), run('   '), ans ? run(ABC[order.indexOf(x.id)] + ')', {b: true, color: ANS}) : run('____', {color: GREY})], {after: 60}) : para(''), va: 'top'},
        {x: d ? para([run(ABC[i] + ')  ', {b: true}), run(d.def, {sz: 10})], {after: 60}) : para(''), va: 'top'}]}; });
    b = table([3600, WIDTH - 3600], rows, {borders: false, pad: 60, padV: 40});
  }
  else if (k === 'zh') b = twoUp(COLS.zh, it, (x, i) => [run((i + 1) + '.  ', {sz: 10.5}), run(x.zh, {sz: 12})], x => x.w, ans);
  else if (k === 'crossword') b = xwXML(m.puz, ans, ['Across', 'Down']);
  else if (k === 'wordsearch') b = wsXML(m.puz, ans);
  else if (k === 'tf' || k === 'rw') b = it.map((x, i) => {
    const pick = k === 'tf' ? [['True', x.t], ['False', !x.t]] : [['✓', x.ok], ['✗', !x.ok]];
    const row = table([WIDTH - 2000, 2000], [{cells: [{x: para([num(i), run(x.s)]), va: 'top'}, {x: para(pick.flatMap(([w, on], j) => [run(w, ans && on ? {b: true, color: ANS, u: true} : {b: true}), run(j ? '' : '   /   ', {color: GREY})]), {jc: 'center'}), va: 'top'}]}], {borders: false, pad: 40, padV: 30});
    const fix = k === 'rw' ? (ans ? (!x.ok && x.fix ? para(run(x.fix, {b: true, color: ANS}), {ind: IND, after: 40}) : '') : lines(1)) : '';
    return row + fix + why(ans, x.why) + para('', {after: 60}); }).join('');
  else if (k === 'gap') b = it.map((x, i) => { const [pre, post] = x.s.split('___');
    return para([num(i), run(pre), ans ? run(x.opts[x.a], {b: true, u: true, color: ANS}) : run(BLANK), run(post || '')], {line: 276, keepNext: true}) + opts(x.opts, x.a, ans) + why(ans, x.why); }).join('');
  else if (k === 'question' || k === 'gk') b = it.map((x, i) => para([num(i)].concat(x.cmd ? [run(x.cmd + ':  ', {b: true})] : []).concat(run(x.q)), {line: 276, keepNext: true}) + opts(x.opts, x.a, ans) + why(ans, x.why)).join('');
  else if (k === 'translation') b = it.map((x, i) => para([num(i), run(x.zh, {sz: 12})], {keepNext: true}) + opts(x.opts, x.a, ans) + why(ans, x.why)).join('');
  else if (k === 'error') b = it.map((x, i) => { const n = x.parts.filter(p => 'r' in p).length;
    const words = x.parts.flatMap(p => !('r' in p) ? [run(p.s)] : ans ? [p.w ? run(p.w, {strike: true, color: 'C0392B'}) : '', run((p.w ? ' ' : '') + p.r, {b: true, color: ANS})] : [run(p.w)]);
    return (it.length > 1 || x.title ? para([run(it.length > 1 ? (i + 1) + '.  ' : '', {b: true}), run(x.title, {b: true})], {keepNext: true, after: 40}) : '') +
      para(run('There ' + (n === 1 ? 'is 1 mistake.' : 'are ' + n + ' mistakes.'), {sz: 9.5, color: GREY}), {keepNext: true, after: 40}) + para(words, {line: ans ? 300 : 520, after: 120}) +
      (ans ? x.parts.filter(p => 'r' in p).map(p => para([run((p.w ? p.w + ' → ' : 'add ') + p.r, {b: true, sz: 9.5, color: ANS}), run(p.why ? '   ' + plain(p.why) : '', {sz: 9, color: GREY, i: true})], {ind: IND, after: 30})).join('') : ''); }).join('');
  else if (k === 'build') b = it.map((x, i) => para([num(i)].concat(x.goal ? [run(x.goal + '   ', {i: true, sz: 9.5, color: GREY})] : []).concat(
      x.decoys.length ? [run('(' + (x.decoys.length === 1 ? 'one piece doesn’t belong' : x.decoys.length + ' pieces don’t belong') + ')', {sz: 9, color: GREY})] : []), {keepNext: true, after: 60}) +
    para(x.pieces.flatMap((p, j) => [run(' ' + p + ' ', {shade: 'E8EAF2', b: true}), run(j < x.pieces.length - 1 ? '     ' : '')]), {ind: IND, line: 320, keepNext: !ans, after: 40}) +
    (ans ? para(run(x.tiles.join(' '), {b: true, color: ANS}), {ind: IND, after: 30}) + (x.alt.length ? para(run('Also right: ' + x.alt.join(' / '), {sz: 9, color: GREY, i: true}), {ind: IND}) : '') +
      (x.decoys.length ? para(run('Not needed: ' + x.decoys.join(', '), {sz: 9, color: GREY, i: true}), {ind: IND}) : '') + para('', {after: 80}) : lines(2) + para('', {after: 60}))).join('');
  else if (k === 'read') b = it.map((x, i) => (x.title ? para(run((it.length > 1 ? (i + 1) + '.  ' : '') + x.title, {b: true}), {keepNext: true, after: 40}) : '') + gappedText(x, ans, g => x.gaps[g].ans) +
    table([WIDTH], [{cells: [{x: para(run(x.bank.join('     ·     '), {sz: 10.5}), {jc: 'center'})}]}], {pad: 120, padV: 70}) + para('', {after: 100})).join('');
  else if (k === 'wchoice') { let g0 = 0; b = it.map(x => { const off = g0; g0 += x.gaps.length; const y = Object.assign({}, x, {parts: x.parts.map(p => typeof p === 'string' ? p : {g: p.g + off})});
    return (x.title ? para(run(x.title, {b: true}), {keepNext: true, after: 40}) : '') + gappedText(y, ans, g => x.gaps[g - off].opts[x.gaps[g - off].a]) +
      table([600].concat(Array(4).fill((WIDTH - 600) / 4)), x.gaps.map((g, i) => ({cells: [{x: para(run(String(i + off + 1), {b: true}))}].concat([0, 1, 2, 3].map(j => ({x: para(g.opts[j] ? [run(ABC[j] + ')  ', {b: true, color: ans && j === g.a ? ANS : ''}), run(g.opts[j], ans && j === g.a ? {b: true, color: ANS} : {})] : '')})))})), {color: 'CCCCCC', pad: 70, padV: 40}) + para('', {after: 120}); }).join(''); }
  else if (k === 'ocloze' || k === 'wform') { let g0 = 0; b = it.map(x => { const off = g0; g0 += x.gaps.length; const y = Object.assign({}, x, {parts: x.parts.map(p => typeof p === 'string' ? p : {g: p.g + off})});
    return (x.title ? para(run(x.title, {b: true}), {keepNext: true, after: 40}) : '') + gappedText(y, ans, g => x.gaps[g - off].ans.join(' / '), k === 'wform' ? g => [run(' [' + x.gaps[g - off].stem.toUpperCase() + ']', {b: true, sz: 9.5})] : null); }).join(''); }
  else if (k === 'evidence') b = it.map((x, i) => para([num(i), run(x.s, {b: true}), run('   (tick ' + x.right.length + ')', {sz: 9.5, color: GREY})], {keepNext: true, after: 60}) +
    x.opts.map((o, j) => para([run(ans && x.right.includes(o) ? '☑  ' : '☐  ', ans && x.right.includes(o) ? {b: true, color: ANS} : {}), run(o, ans && x.right.includes(o) ? {b: true, color: ANS} : {})], {ind: IND, after: 40, keepNext: j < x.opts.length - 1})).join('') + why(ans, x.why) + para('', {after: 80})).join('');
  else if (k === 'own') { let q = 0; b = it.map((x, i) => { const words = (x.t.match(/\[([^\]]+)\]/g) || []).map(s => s.slice(1, -1));
    const text = x.t.split(/(\[[^\]]+\])/).map(s => /^\[[^\]]+\]$/.test(s) ? run(s.slice(1, -1), {u: true, b: true}) : run(s));
    return (it.length > 1 ? para(run('Extract ' + (i + 1), {b: true}), {keepNext: true, after: 40}) : '') + table([WIDTH], [{cells: [{x: para(text, {line: 300})}]}], {pad: 140, padV: 90, color: 'BBBBBB'}) + para('', {after: 60}) +
      x.qs.map((qq, j) => para([num(q++), run('What does '), run(words[j] || '', {b: true}), run(' mean here?')], {keepNext: true}) + opts(qq.opts, qq.a, ans)).join(''); }).join(''); }
  return head(n, t, ans) + b;
}
function sheetXML(title, sub, M, ans){
  let body = para(run((ans ? 'Answers: ' : '') + title, {b: true, sz: ans ? 16 : 18}), {after: 40}) + para(run(sub, {sz: 10.5, color: GREY}), {after: 160});
  if (!ans) body += para(run('Name ______________________________     Class ______________     Date ______________', {sz: 10}), {after: 120});
  body += M.map((x, i) => taskXML(x.t, i + 1, x.m, ans)).join('');
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>' + body +
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1020" w:right="1020" w:bottom="1020" w:left="1020" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>';
}
})();
