/* Starters (7 Nov 2026, teacher): a few minutes of work on the projector at the start of a lesson. Students write their
   answers in their books; each answer stays hidden until the teacher shows it.
   Lives on the teacher page (teacher/index.html calls AEA_START.route for every address that starts #/starters):
     #/starters                  choose the topics, the levels and what goes on the board (six squares of room)
     #/starters/play             the starter on the board (the last one dealt; carried on after a reload)
     #/starters/gapfill          the teacher's own Gap Fill paragraphs
     #/starters/gapfill/new      make one: a paragraph from the bank (content/<topic>/reads.csv) or typed in, click words to make gaps
     #/starters/gapfill/<id>     change one
     #/starters/match-up, #/starters/gap-fill, #/starters/connecting-wall, #/starters/word-search: one activity on its own,
                                 filling the board (9 Nov 2026: listed under Starters in the Staff Room); #/starters/match-up/words
                                 chooses its words
   Room on the board: one square for a question, half the board for Spot the error, the whole board for Match-up,
   Connecting Wall and Gap Fill. Activities that won't fit are greyed out.
   Content: the same CSV files as the games (through board.js: AEA_BOARD.lib), plus errors.csv (Spot the error), reads.csv
   (Gap Fill from the bank) and wall.csv (Connecting Wall: a group name and four or more words on each row).
   Saved in this browser under "aeaBoard:starter" (the choices and the starter on the board) and "aeaBoard:gapfills", not "aea:…"
   (those keys are copied to a student's account when a student logs in on the same computer). */
(function(){
'use strict';
const B = window.AEA_BOARD && window.AEA_BOARD.lib;
if (!B) return;
const {TOPICS, LEVELS, LEVEL_NAME, parseCSV, levelNum, band, dataFor, eligible, makeQ, topicName, esc, rich, shuffle, uid, getJ, setJ, K_SOUND} = B;
const ROOT = '../';
const K_START = 'aeaBoard:starter', K_GAPS = 'aeaBoard:gapfills';

// ---------- what can go on the board ----------
// size: small = one square (the board has six), wide = half the board, full = the whole board
const ROOM = 6, UNITS = {small: 1, wide: 3, full: 6};
const ACTS = [
  {k: 'gap',      size: 'small', bank: 'gap',      name: 'Fill the gap',          blurb: 'A sentence with a word missing.'},
  {k: 'rw',       size: 'small', bank: 'rw',       name: 'Grammar Check',  blurb: 'Good grammar or bad grammar? If it’s bad, they correct it.'},
  {k: 'word',     size: 'small', bank: 'word',     name: 'What does it mean?',    blurb: 'A word: they write its meaning.'},
  {k: 'meaning',  size: 'small', bank: 'meaning',  name: 'Which word?',           blurb: 'A meaning: they write the word.'},
  {k: 'zh',       size: 'small', bank: 'zh',       name: '中文 → English',         blurb: 'A word in Chinese: they write it in English.'},
  {k: 'tf',       size: 'small', bank: 'tf',       name: 'True or false',         blurb: 'A statement: true or false?'},
  {k: 'anagram',  size: 'small', words: true,      name: 'Anagram',               blurb: 'A topic word with its letters mixed up.'},
  {k: 'vowels',   size: 'small', words: true,      name: 'Missing vowels',        blurb: 'A topic word with its vowels taken out.'},
  {k: 'question', size: 'small', bank: 'question', name: 'Answer the question',   blurb: 'An exam question and four answers to choose from.'},
  {k: 'gk',       size: 'small', bank: 'gk',       name: 'General knowledge',     blurb: 'A quiz question.'},
  // The Big Question (8 Nov 2026, teacher): your own question, typed on the Starters page. One square, always the last on
  // the board ("the kids can do a few little exercises and then finish with a big question")
  {k: 'big',      size: 'small',                   name: 'The Big Question',      blurb: 'Your own question to finish with. It always goes last on the board.'},
  {k: 'errors',   size: 'wide',                    name: 'Spot the error',        blurb: 'A short paragraph with mistakes to find and correct.'},
  {k: 'match',    size: 'full',  words: true,      name: 'Match-up',              blurb: 'Words and meanings to pair up: random, or words you choose.'},
  {k: 'wall',     size: 'full',                    name: 'Connecting Wall',       blurb: 'Sixteen words to sort into four groups of four.'},
  {k: 'gapfill',  size: 'full',                    name: 'Gap Fill',              blurb: 'A paragraph with gaps and a word bank: from the bank, or one of your own.'},
  {k: 'wordsearch', size: 'full', words: true,     name: 'Word search',           blurb: 'Topic words hidden in a square of letters. The list shows the words, or their meanings.'}
];
const ACT = Object.fromEntries(ACTS.map(a => [a.k, a]));
const NEED = {match: 6, wall: 4, wordsearch: 6};
const GROUPS = [['small', 'One square each'], ['wide', 'Half the board'], ['full', 'The whole board']];
const DEFAULTS = {title: '', topics: [], levels: [1, 2, 3, 4, 5], items: [], secs: 300, choices: false, clue: true};
const PAIR = ['#c8344a', '#1f63c4', '#13804f', '#7343c9', '#b35300', '#b4286a', '#0b7a7a', '#4f5578'];   // Match-up pairs (white text reads on all of them)
const WALL = ['#1f63c4', '#13804f', '#b35300', '#7343c9'];                         // Connecting Wall: the colour of the 1st, 2nd… group found
const TIMES = [[0, 'No timer'], [60, '1 minute'], [120, '2 minutes'], [180, '3 minutes'], [240, '4 minutes'], [300, '5 minutes'], [360, '6 minutes'],
  [480, '8 minutes'], [600, '10 minutes'], [900, '15 minutes']];

// ---------- saved in this browser ----------
const clone = o => JSON.parse(JSON.stringify(o));
const store = () => getJ(K_START, {}) || {};
const cfgNow = () => { const c = Object.assign(clone(DEFAULTS), store().cfg || {}); c.items = (c.items || []).filter(it => it && ACT[it.k]); return c; };
const saveCfg = c => { const s = store(); s.cfg = c; setJ(K_START, s); };
const dealNow = () => { const d = store().deal; return d && Array.isArray(d.items) && d.items.length ? d : null; };
const saveDeal = d => { const s = store(); s.deal = d; setJ(K_START, s); };
const gapfills = () => getJ(K_GAPS, []) || [];
const gapOf = id => gapfills().find(g => g.id === id) || null;
const saveGapfill = g => { const all = gapfills(), i = all.findIndex(x => x.id === g.id); g.updated = Date.now(); if (i < 0) all.unshift(g); else all[i] = g; setJ(K_GAPS, all); };
const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');

// ---------- content the board games don't load: errors.csv, reads.csv, wall.csv ----------
const ERR_RE = /\[([^\[\]|]*)\|([^\[\]|]*)\|([^\[\]]*)\]/g;
function errParts(text){
  const out = []; let last = 0, m; ERR_RE.lastIndex = 0;
  while ((m = ERR_RE.exec(text))) { if (m.index > last) out.push({t: 's', s: text.slice(last, m.index)}); out.push({t: 'e', w: m[1], r: m[2]}); last = m.index + m[0].length; }
  if (last < text.length) out.push({t: 's', s: text.slice(last)});
  return out;
}
// "[[shown|word]]" plays as "shown" (the word after | only links it to words.csv in the students' game)
const gapText = s => String(s || '').replace(/\[\[([^\]]*?)\]\]/g, (m, x) => '[[' + x.split('|')[0].trim() + ']]');
const gapWords = text => [...String(text || '').matchAll(/\[\[([^\]]*?)\]\]/g)].map(m => m[1].split('|')[0].trim()).filter(Boolean);
const loadedX = {};
function loadExtra(key){
  if (loadedX[key]) return loadedX[key];
  const t = TOPICS.find(x => x.key === key);
  if (!t || t.only) return Promise.resolve({key, errors: [], reads: [], wall: []});
  const get = f => fetch(ROOT + 'content/' + key + '/' + f + '.csv', {cache: 'no-cache'}).then(r => r.ok ? r.text() : '').then(parseCSV).catch(() => []);
  const p = Promise.all(['errors', 'reads', 'wall'].map(get)).then(([e, r, w]) => ({key,
    errors: e.map(row => { if (!row.id || !row.text) return null; const parts = errParts(row.text), n = parts.filter(x => x.t === 'e').length;
      return n ? {id: row.id, lv: levelNum(row.level), title: row.title || '', parts, n} : null; }).filter(Boolean),
    reads: r.map(row => { if (!row.id || !row.text) return null; const text = gapText(row.text);
      return gapWords(text).length >= 2 ? {id: row.id, lv: levelNum(row.level), title: row.title || '', text, extras: [1, 2, 3].map(k => (row['extra' + k] || '').trim()).filter(Boolean)} : null; }).filter(Boolean),
    wall: w.map(row => { const words = [], seen = new Set();
      Object.keys(row).filter(h => /^word\d+$/.test(h)).sort((a, b) => +a.slice(4) - +b.slice(4)).forEach(h => { const v = row[h].trim(); if (v && !seen.has(v.toLowerCase())) { seen.add(v.toLowerCase()); words.push(v); } });
      return row.id && row.group && words.length >= 4 ? {id: row.id, lv: levelNum(row.level), name: row.group, words} : null; }).filter(Boolean)}));
  loadedX[key] = p;
  return p;
}
// Everything a starter can use for the topics chosen: D (board.js: words and the question files) and X (the files above)
const ALL = {D: {}, X: {}};
function ensure(topics){
  return Promise.all([dataFor(topics), Promise.all(topics.map(loadExtra))]).then(([D, xs]) => {
    Object.assign(ALL.D, D); xs.forEach(x => { if (x) ALL.X[x.key] = x; }); return ALL; });
}
const ready = topics => topics.every(t => ALL.D[t] && ALL.X[t]);

// ---------- what each activity can use ----------
const letters = w => String(w).replace(/[^A-Za-z]/g, '');
const parts = w => String(w).trim().split(/\s+/);
const anagramOK = x => /^[A-Za-z][A-Za-z'’ -]*$/.test(x.w.trim()) && parts(x.w).length <= 2 && letters(x.w).length >= 4 && letters(x.w).length <= 14 && parts(x.w).every(p => letters(p).length >= 2);
const vowelsOK = x => { if (!anagramOK(x)) return false; const v = (x.w.match(/[aeiou]/gi) || []).length; return v >= 2 && letters(x.w).length - v >= 3; };
const matchOK = x => x.def && x.def.length <= 140;
// Word search (8 Nov 2026): the same rules as the students' game (playWordSearch in en/engine/app.js; keep the two in step).
// Letters only on the board (close-up is CLOSEUP; "visitor / user" is visitor), 4 to 12 letters; size and directions by the
// hardest level chosen; every word once only; the random letters never spell a rude word.
const wsShow = x => String(x.w).split(/\s*\/\s*/)[0].replace(/\s*\([^)]*\)\s*/g, ' ').trim();
const wsPlain = x => wsShow(x).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const wsL = x => wsPlain(x).replace(/[^a-z]/g, '').toUpperCase();
const wsOK = x => { const t = wsPlain(x), n = t.replace(/[^a-z]/g, '').length; return /^[a-z][a-z '’\-]*$/.test(t) && t.split(/\s+/).length <= 3 && n >= 4 && n <= 12; };
const WS_DIRS = [null, [[0,1],[1,0]], [[0,1],[1,0],[1,1]], [[0,1],[1,0],[1,1],[-1,1]],
  [[0,1],[1,0],[1,1],[-1,1],[0,-1],[-1,0]], [[0,1],[1,0],[1,1],[-1,1],[0,-1],[-1,0],[-1,-1],[1,-1]]];
const WS_SAY = [null, 'Words go across and down.', 'Words go across, down and diagonally down.', 'Words go across, down and diagonally.',
  'Words go across, down and diagonally, and some are backwards.', 'Words go in every direction, backwards too.'];
const WS_FILL = 'EEEEEEAAAAAIIIIOOOOTTTTNNNNSSSSRRRRLLLHHHDDDCCCUUMMPPGGBBFFYWWKV';
const WS_RUDE = ['kcuf','tihs','tnuc','kcid','kcoc','ssip','tawt','tuls','gaf','stit','esra','ssa','nrop','knaw','izan','epar','hctib','xes','erohw'];   // written backwards
const WS_COL = ['#f2a93b','#4ea3e8','#5cc97a','#f27fa6','#a98bf0','#f5795a','#3fc7bb','#d9c52f','#7fb6e0','#e78ae0'];
function wsMake(cands, n, size, dirs){
  const inside = (r, c) => r >= 0 && r < size && c >= 0 && c < size;
  for (let t = 0; t < 30; t++) {
    const g = Array.from({length: size}, () => Array(size).fill('')), placed = [];
    for (const it of [...cands.slice(0, n).sort((a, b) => b.L.length - a.L.length), ...cands.slice(n)]) {
      if (placed.length >= n) break;
      const L = it.L; let spot = null;
      for (const [dr, dc] of shuffle(dirs)) {
        const spots = [];
        for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
          if (!inside(r + dr * (L.length - 1), c + dc * (L.length - 1))) continue;
          let ov = 0, ok = true;
          for (let i = 0; i < L.length; i++) { const ch = g[r + dr * i][c + dc * i]; if (ch) { if (ch !== L[i]) { ok = false; break; } ov++; } }
          if (ok && ov < L.length) spots.push({r, c, dr, dc, ov});
        }
        if (spots.length) { const cross = spots.filter(x => x.ov), from = cross.length && Math.random() < .4 ? cross : spots; spot = from[Math.floor(Math.random() * from.length)]; break; }
      }
      if (!spot) continue;
      for (let i = 0; i < L.length; i++) g[spot.r + spot.dr * i][spot.c + spot.dc * i] = L[i];
      placed.push(Object.assign({}, it, {cells: [...Array(L.length).keys()].map(i => (spot.r + spot.dr * i) * size + spot.c + spot.dc * i)}));
    }
    if (placed.length < Math.min(n, 6)) continue;
    for (let f = 0; f < 60; f++) {
      const b = g.map(row => row.map(ch => ch || WS_FILL[Math.floor(Math.random() * WS_FILL.length)]));
      if (wsClean(b, placed, size)) return {b, placed};
    }
  }
  return null;
}
function wsClean(b, placed, size){
  const scan = W => { const out = [], seen = new Set();
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) { if (b[r][c] !== W[0]) continue;
      for (const [dr, dc] of WS_DIRS[5]) { const er = r + dr * (W.length - 1), ec = c + dc * (W.length - 1); if (er < 0 || er >= size || ec < 0 || ec >= size) continue;
        let ok = true; for (let i = 1; i < W.length; i++) if (b[r + dr * i][c + dc * i] !== W[i]) { ok = false; break; }
        if (!ok) continue; const a = r * size + c, z = er * size + ec, k = Math.min(a, z) + '-' + Math.max(a, z);
        if (!seen.has(k)) { seen.add(k); out.push([...Array(W.length).keys()].map(i => (r + dr * i) * size + c + dc * i)); } } }
    return out; };
  if (placed.some(p => scan(p.L).length !== 1)) return false;
  const inWord = cells => placed.some(p => cells.every(x => p.cells.includes(x)));
  return WS_RUDE.every(x => scan([...x].reverse().join('').toUpperCase()).every(inWord));
}
const wordsAt = (D, lv) => eligible(D, 'word', lv);   // the topic page's word list at these levels, without words taken out through Reports
const errorsAt = (X, t, lv) => (X.errors || []).filter(r => (r.lv == null || lv.includes(band(r.lv))) && !B.hidden(t, 'error', r.id));
const readsAt = (X, t, lv) => (X.reads || []).filter(r => (r.lv == null || lv.includes(band(r.lv))) && !B.hidden(t, 'read', r.id));
function haveOf(k, cfg, lv){
  lv = lv || cfg.levels;
  const T = cfg.topics.filter(t => ALL.D[t] && ALL.X[t]), a = ACT[k];
  if (a.bank) return T.reduce((n, t) => n + eligible(ALL.D[t], a.bank, lv).length, 0);
  if (a.words) return T.reduce((n, t) => n + wordsAt(ALL.D[t], lv).filter(k === 'anagram' ? anagramOK : k === 'vowels' ? vowelsOK : k === 'wordsearch' ? wsOK : matchOK).length, 0);
  if (k === 'errors') return T.reduce((n, t) => n + errorsAt(ALL.X[t], t, lv).length, 0);
  if (k === 'wall') return T.reduce((n, t) => n + (ALL.X[t].wall || []).length, 0);   // groups at the levels chosen come first; others fill the wall
  if (k === 'gapfill') return T.reduce((n, t) => n + readsAt(ALL.X[t], t, lv).length, 0);
  return 0;
}
const unitsOf = items => items.reduce((n, it) => n + UNITS[ACT[it.k].size], 0);

// ---------- the board's layout: a 6-column grid; questions share rows (2 to 3 a row), half-board activities get a row each ----------
function layout(items){
  if (!items.length) return {rows: 0, cells: []};
  const size = items.map(it => ACT[it.k].size);
  if (size.includes('full')) return {rows: 1, cells: [{i: size.indexOf('full'), r: 1, c: 1, span: 6}]};
  const small = [], wide = [], big = i => items[i].k === 'big' ? 1 : 0;
  size.forEach((s, i) => (s === 'small' ? small : wide).push(i));
  small.sort((a, b) => big(a) - big(b) || a - b);   // the Big Question finishes the board
  const split = {0: [], 1: [1], 2: [2], 3: [3], 4: [2, 2], 5: [3, 2], 6: [3, 3]}[Math.min(6, small.length)];
  const smallRows = []; let k = 0; split.forEach(n => { smallRows.push(small.slice(k, k + n)); k += n; });
  const wideFirst = wide.length && (!small.length || wide[0] < small[0] || small.some(big));
  const rows = wideFirst ? wide.map(i => [i]).concat(smallRows) : smallRows.concat(wide.map(i => [i]));
  const cells = [];
  rows.forEach((row, r) => row.forEach((i, c) => cells.push({i, r: r + 1, c: c * (6 / row.length) + 1, span: 6 / row.length})));
  return {rows: rows.length, cells};
}

// ---------- dealing: a question for every square ----------
const words = s => new Set((String(s).toLowerCase().match(/[a-z']+/g) || []));
function alike(a, b){ const A = words(a), Bw = words(b); let n = 0; A.forEach(w => { if (Bw.has(w)) n++; }); return n / Math.max(1, A.size + Bw.size - n) >= .6; }
function scramble(w){
  const L = letters(w).toUpperCase(); if (new Set(L).size < 2) return null;
  for (let k = 0; k < 40; k++) { const s = shuffle(L.split('')).join(''); if (s !== L) return s; }
  return null;
}
function dealOne(it, cfg, used, done){
  const a = ACT[it.k], lv = cfg.levels, T = shuffle(cfg.topics.filter(t => ALL.D[t] && ALL.X[t]));
  const wkey = (t, id) => 'w|' + t + '|' + id;
  if (it.k === 'big') return String(it.text || '').trim() ? {k: 'big', text: String(it.text).trim()} : null;
  // Match-up with the words the teacher chose (#/starters/matchup): the same words every time, in a new order
  if (it.k === 'match' && it.pick && it.pick.length >= 4) {
    it.pick.forEach(p => used.add(wkey(p.t, p.id)));
    return {k: 'match', pairs: it.pick.map(p => ({w: p.w, def: p.def})), order: shuffle([...Array(it.pick.length).keys()]), picked: true};
  }
  if (a.bank) {
    for (const t of T) { const D = ALL.D[t];
      for (const x of shuffle(eligible(D, a.bank, lv))) {
        const key = t + '|' + a.bank + '|' + x.id, wk = x.w ? wkey(t, x.id) : '';
        if (used.has(key) || (wk && used.has(wk))) continue;
        if (a.bank === 'rw' && done.some(d => d.k === 'rw' && alike(d.q.s, x.s))) continue;   // a right and a wrong version of one sentence
        const q = makeQ(D, a.bank, x, lv); if (!q) continue;
        used.add(key); if (wk) used.add(wk);
        return {k: it.k, t, q};
      } }
    return null;
  }
  if (it.k === 'anagram' || it.k === 'vowels') {
    for (const t of T) for (const x of shuffle(wordsAt(ALL.D[t], lv).filter(it.k === 'anagram' ? anagramOK : vowelsOK))) {
      if (used.has(wkey(t, x.id))) continue;
      const out = {k: it.k, t, w: x.w, def: x.def, lv: x.lv, lens: parts(x.w).map(p => letters(p).length)};
      if (it.k === 'anagram') { const mix = parts(x.w).map(scramble); if (mix.some(m => !m)) continue; out.mix = mix; }
      else out.cons = parts(x.w).map(p => letters(p).replace(/[aeiou]/gi, '').toUpperCase());
      used.add(wkey(t, x.id)); return out;
    }
    return null;
  }
  if (it.k === 'match') {
    const pool = shuffle(T.flatMap(t => wordsAt(ALL.D[t], lv).filter(matchOK).map(x => ({t, x}))));
    const pick = [];
    for (const p of pool) {
      if (used.has(wkey(p.t, p.x.id))) continue;
      if (pick.some(q => q.x.w.toLowerCase() === p.x.w.toLowerCase() || q.x.def === p.x.def || (q.t === p.t && ALL.D[p.t].alike.has(q.x.id + '|' + p.x.id)))) continue;
      pick.push(p); if (pick.length === 6) break;
    }
    if (pick.length < 6) return null;
    pick.forEach(p => used.add(wkey(p.t, p.x.id)));
    return {k: 'match', pairs: pick.map(p => ({w: p.x.w, def: p.x.def})), order: shuffle([0, 1, 2, 3, 4, 5])};
  }
  if (it.k === 'errors') {
    for (const t of T) for (const r of shuffle(errorsAt(ALL.X[t], t, lv))) {
      if (used.has('e|' + t + '|' + r.id)) continue;
      used.add('e|' + t + '|' + r.id); return {k: 'errors', t, title: r.title, parts: r.parts, n: r.n};
    }
    return null;
  }
  if (it.k === 'wall') {
    // groups at the levels chosen first, then the nearest levels; no word may belong to two groups on the wall
    const near = r => r.lv == null || lv.includes(band(r.lv)) ? 0 : Math.min(...lv.map(l => Math.abs(l - band(r.lv))));
    const cands = shuffle(T.flatMap(t => ALL.X[t].wall.map(r => ({t, r})))).sort((x, y) => near(x.r) - near(y.r));
    const chosen = [], low = s => s.toLowerCase();
    for (const c of cands) {
      if (used.has('g|' + low(c.r.name)) || chosen.some(g => low(g.name) === low(c.r.name))) continue;
      const taken = new Set(chosen.flatMap(g => g.all.map(low)));
      const free = c.r.words.filter(w => !taken.has(low(w)) && !chosen.some(g => g.all.map(low).includes(low(w))));
      const mine = new Set(c.r.words.map(low));
      if (chosen.some(g => g.words.some(w => mine.has(low(w))))) continue;   // one of the words already on the wall belongs here too
      if (free.length < 4) continue;
      chosen.push({name: c.r.name, words: shuffle(free).slice(0, 4), all: c.r.words});
      if (chosen.length === 4) break;
    }
    if (chosen.length < 4) return null;
    chosen.forEach(g => used.add('g|' + low(g.name)));
    return {k: 'wall', groups: chosen.map(g => ({name: g.name, words: g.words})), order: shuffle([...Array(16).keys()])};
  }
  if (it.k === 'wordsearch') {
    // The hardest level chosen sets the size and the directions; the words come from every level chosen
    const top = Math.max(...(lv.length ? lv : [3])), big = top >= 3, size = big ? 12 : 10, n = big ? 9 : 8, cands = [];
    for (const p of shuffle(T.flatMap(t => wordsAt(ALL.D[t], lv).filter(wsOK).map(x => ({t, x}))))) {
      if (used.has(wkey(p.t, p.x.id))) continue;
      const L = wsL(p.x), R = [...L].reverse().join('');
      if (L.length > size || cands.some(o => o.L.includes(L) || L.includes(o.L) || o.L.includes(R) || o.def === p.x.def)) continue;
      cands.push({t: p.t, id: p.x.id, w: wsShow(p.x), def: p.x.def, L}); if (cands.length >= n + 10) break;
    }
    if (cands.length < 6) return null;
    const made = wsMake(cands, n, size, WS_DIRS[top]); if (!made) return null;
    made.placed.forEach(p => used.add(wkey(p.t, p.id)));
    // the list in a random order (not the order they were placed in, longest first), each word with its colour
    const words = shuffle(made.placed).map((p, k) => ({w: p.w, def: p.def, n: p.L.length, a: p.cells[0], z: p.cells[p.cells.length - 1], col: WS_COL[k % WS_COL.length]}));
    return {k: 'wordsearch', size, lv: top, b: made.b.map(r => r.join('')), words, show: it.show === 'meanings' ? 'meanings' : 'words'};
  }
  if (it.k === 'gapfill') {
    let src = it.src && it.src !== 'bank' ? gapOf(it.src) : null, title, text, extras;
    if (src) { title = src.title; text = src.text; extras = src.extras || []; }
    else {
      const c = shuffle(T.flatMap(t => readsAt(ALL.X[t], t, lv).map(r => ({t, r})))).find(c => !used.has('r|' + c.t + '|' + c.r.id));
      if (!c) return null;
      used.add('r|' + c.t + '|' + c.r.id); title = c.r.title; text = c.r.text; extras = c.r.extras;
    }
    const gp = gfParts(text), gw = gp.filter(p => p.t === 'g').map(p => p.s);
    if (!gw.length) return null;
    return {k: 'gapfill', title, parts: gp, bank: gw.concat(extras).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())), extra: extras.length, own: !!src};
  }
  return null;
}
function gfParts(text){
  const out = []; let n = 0;
  String(text || '').split(/\[\[([^\]]*?)\]\]/).forEach((s, i) => { if (i % 2) { const w = s.split('|')[0].trim(); if (w) out.push({t: 'g', s: w, n: ++n}); } else if (s) out.push({t: 's', s}); });
  return out;
}
// Each item keeps what it used (keys: so a new question for one square never repeats one on the board) and what it was
// dealt from (from: so the ‹ › arrows on the board can deal another of the same kind)
function dealAll(cfg){
  const used = new Set(), items = [], missing = [];
  cfg.items.forEach(it => { const before = new Set(used), x = dealOne(it, cfg, used, items);
    if (x) { x.keys = [...used].filter(k => !before.has(k)); x.from = clone(it); items.push(x); } else missing.push(ACT[it.k].name); });
  return {items, missing};
}
const newDeal = (cfg, items) => ({v: 1, made: Date.now(), cfg: clone(cfg), items, hist: {}, pos: {}, state: {shown: {}, sub: {}, solved: {}, order: {}}});
// Its own Gap Fill, the teacher's Match-up words and the Big Question never change; everything else can be dealt again
const canNew = x => x.k !== 'big' && !x.own && !x.picked;

// =====================================================================================================================
// The teacher page hands over: view (the page's main area), setTitle, header (the name/log out line), touch (keeps the login alive)
let C = null;
const AEA_START = window.AEA_START = {
  route(hash, ctx){
    C = ctx; stop();
    let m;
    if (hash === '#/starters/play') return play();
    if (hash === '#/starters/gapfill') return gfList();
    if (hash === '#/starters/gapfill/new') return gfEdit(null);
    if ((m = /^#\/starters\/gapfill\/([\w-]+)$/.exec(hash))) return gfEdit(m[1]);
    if (hash === '#/starters/matchup') return mtChoose();
    if (hash === '#/starters/match-up/words') return mtChoose(true);
    const o = Object.keys(ONE).find(k => hash === '#/starters/' + ONE[k].path);
    if (o) return one(o);
    return build();
  },
  stop,
  ws: {wsMake, wsOK, wsL, wsShow, WS_DIRS}   // the word search maker, for the handouts (teacher/handouts.js)
};

// ---------- the Starters page: choose what goes on the board ----------
function build(){
  C.setTitle('Build the Board'); C.header(); gfFrom = 'board';
  const cfg = cfgNow();
  cfg.items.forEach(it => { if (it.k === 'gapfill' && it.src && it.src !== 'bank' && !gapOf(it.src)) it.src = 'bank'; });
  const opt = (v, label, cur) => '<option value="' + v + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(label) + '</option>';
  C.view.innerHTML =
    '<p style="margin:0 0 14px"><a class="backlink" href="#/">← Staff Room</a></p>' +
    '<p class="note st-lead">Something to do as students come in. Choose what goes on the board and put it on the projector. Students write their answers in their books, and every answer stays hidden until you show it.</p>' +
    '<div class="st-build"><div class="st-main">' +
      '<section class="card st-sec"><h2>Topics</h2><div class="bg-chips" id="s-topics">' + TOPICS.map(t =>
        '<label class="bg-chip"><input type="checkbox" value="' + t.key + '"' + (cfg.topics.includes(t.key) ? ' checked' : '') + '><span>' + esc(t.name) + '</span></label>').join('') + '</div>' +
        '<h2>Levels</h2><div class="bg-chips" id="s-levels">' + LEVELS.map(([n, name]) =>
        '<label class="bg-chip"><input type="checkbox" value="' + n + '"' + (cfg.levels.includes(n) ? ' checked' : '') + '><span>' + name + '</span></label>').join('') + '</div></section>' +
      '<section class="card st-sec"><div class="spread"><h2>What goes on the board</h2><span class="st-room" id="s-room" aria-live="polite"></span></div>' +
        '<p class="note">Click an activity to add it, as many times as you like. The board has room for six squares.</p><div id="s-acts"></div>' +
        '<p class="note">Gap Fill uses a paragraph from the bank, or <a href="#/starters/gapfill">one of your own</a>.</p></section>' +
    '</div><aside class="st-side"><div class="card st-sec st-stick">' +
      '<div class="spread"><h2>The board</h2><button class="btn small alt" type="button" id="s-clear" title="Take everything off the board">Clear the board</button></div>' +
      '<div class="st-mini" id="s-mini"></div><div id="s-big"></div>' +
      '<div class="field"><label for="s-title">Name on the board</label><input type="text" id="s-title" maxlength="60" placeholder="Starter" value="' + esc(cfg.title) + '"></div>' +
      '<div class="field"><label for="s-secs">Timer</label><select id="s-secs">' + TIMES.map(x => opt(x[0], x[1], cfg.secs)).join('') + '</select></div>' +
      '<label class="choice"><input type="checkbox" id="s-choices"' + (cfg.choices ? ' checked' : '') + '><span><b>Show answer choices (A–D)</b><br>' +
        '<span class="note">Off: students write the answer from memory. Answer the question always shows its four answers.</span></span></label>' +
      '<label class="choice"><input type="checkbox" id="s-clue"' + (cfg.clue ? ' checked' : '') + '><span><b>Clues</b><br><span class="note">The meaning under each Anagram and Missing vowels.</span></span></label>' +
      '<p class="err" id="s-err" role="alert" hidden></p>' +
      '<div class="row"><button class="btn" type="button" id="s-go">Show on the board</button></div>' +
      '<p class="note" id="s-last"></p>' +
    '</div></aside></div>';
  const $ = s => C.view.querySelector(s), $$ = s => [...C.view.querySelectorAll(s)];
  const err = m => { const e = $('#s-err'); e.textContent = m || ''; e.hidden = !m; };
  const save = () => { saveCfg(cfg); C.touch(); };
  let loading = false, failed = '';
  const drawLast = () => { const d = dealNow(), el = $('#s-last');
    el.innerHTML = d ? '<a href="#/starters/play">Back to the last starter</a> (' + esc(new Date(d.made).toLocaleString([], {weekday: 'short', hour: '2-digit', minute: '2-digit'})) + ')' : ''; };
  // The activities: greyed out when there's no room for them, or nothing to put in them
  const status = a => {
    const left = ROOM - unitsOf(cfg.items), units = UNITS[a.size], saved = a.k === 'gapfill' ? gapfills().length : 0;
    if (units > left) return {off: true, say: a.size === 'full' && cfg.items.length ? 'Takes the whole board: remove the others first' : 'No room left on the board'};
    if (a.k === 'big') return {say: 'You type the question'};
    if (!cfg.topics.length) return saved ? {say: plural(saved, 'paragraph') + ' of your own'} : {off: true, say: 'Choose a topic first'};
    if (failed) return {off: !saved, say: failed};
    if (loading || !ready(cfg.topics)) return {say: 'Counting…', wait: true};
    const n = haveOf(a.k, cfg), need = NEED[a.k] || 1;
    if (a.k === 'gapfill') return n || saved ? {say: [n ? n + ' from the bank' : '', saved ? saved + ' of your own' : ''].filter(Boolean).join(' · ')}
      : {off: true, say: haveOf(a.k, cfg, [1, 2, 3, 4, 5]) ? 'None at these levels' : 'None in ' + (cfg.topics.length > 1 ? 'these topics' : 'this topic') + ' yet'};
    if (a.k === 'wall') return n >= need ? {say: plural(n, 'group') + ' to choose from'} : {off: true, say: n ? 'Needs 4 groups: ' + n + ' so far (wall.csv)' : 'No groups yet (wall.csv)'};
    if (n >= need) return {say: n + ' ready'};
    const any = haveOf(a.k, cfg, [1, 2, 3, 4, 5]);
    return {off: true, say: any >= need ? 'Not enough at these levels' : 'None in ' + (cfg.topics.length > 1 ? 'these topics' : 'this topic') + ' yet'};
  };
  const drawActs = () => {
    $('#s-acts').innerHTML = GROUPS.map(([size, label]) => '<div class="st-group"><h3>' + label + '</h3><div class="st-acts">' +
      ACTS.filter(a => a.size === size).map(a => { const s = status(a), n = cfg.items.filter(it => it.k === a.k).length;
        return '<button type="button" class="st-act' + (s.off ? ' off' : '') + '" data-k="' + a.k + '"' + (s.off ? ' aria-disabled="true"' : '') + '>' +
          '<span class="st-act-top"><b>' + esc(a.name) + '</b>' + (n ? '<span class="st-badge">' + (a.size === 'small' ? '× ' + n : 'On the board') + '</span>' : '') + '<span class="st-plus" aria-hidden="true">+</span></span>' +
          '<span class="note">' + esc(a.blurb) + '</span><span class="st-have' + (s.off ? ' off' : '') + '">' + esc(s.say) + '</span></button>'; }).join('') + '</div></div>').join('');
    $$('.st-act').forEach(b => b.onclick = () => {
      const a = ACT[b.dataset.k], s = status(a); if (s.off) return;
      const it = {k: a.k}; if (a.k === 'gapfill') it.src = haveOf('gapfill', cfg) || !gapfills().length ? 'bank' : gapfills()[0].id;
      if (a.k === 'wordsearch') it.show = 'words';
      if (a.k === 'big') it.text = '';
      cfg.items.push(it); err(''); save(); drawAll();
      if (a.k === 'big') { const q = $('#s-bigq' + (cfg.items.length - 1)); if (q) q.focus(); }
    });
    const used = unitsOf(cfg.items);
    $('#s-room').textContent = used >= ROOM ? 'The board is full' : (ROOM - used) + ' of 6 squares free';
  };
  // A small copy of the board, laid out as it will be on the projector
  const drawMini = () => {
    const box = $('#s-mini'), L = layout(cfg.items);
    if (!L.rows) { box.innerHTML = '<p class="st-empty">Nothing on the board yet. Add activities on the left.</p>'; box.style.gridTemplateRows = ''; return; }
    box.style.gridTemplateRows = 'repeat(' + L.rows + ', minmax(0, 1fr))';
    box.innerHTML = L.cells.map((c, n) => { const it = cfg.items[c.i], a = ACT[it.k];
      return '<div class="st-mb ' + a.size + '" style="grid-row:' + c.r + ';grid-column:' + c.c + ' / span ' + c.span + '">' +
        (L.cells.length > 1 ? '<span class="st-mn">' + (n + 1) + '</span>' : '') + '<b>' + esc(a.name) + '</b>' +
        (it.k === 'gapfill' ? '<select class="small" data-src="' + c.i + '" aria-label="Which paragraph">' + '<option value="bank">From the bank: a different one each time</option>' +
          gapfills().map(g => '<option value="' + esc(g.id) + '"' + (it.src === g.id ? ' selected' : '') + '>' + esc(g.title || 'Untitled') + '</option>').join('') + '</select>' : '') +
        (it.k === 'wordsearch' ? '<select class="small" data-show="' + c.i + '" aria-label="The list shows"><option value="words">The list shows the words</option><option value="meanings">The list shows their meanings</option></select>' : '') +
        (it.k === 'match' ? '<span class="st-mbn">' + (it.pick && it.pick.length ? plural(it.pick.length, 'word') + ' you chose' : 'Random words') + '</span><a class="st-mbl" href="#/starters/matchup">Choose the words</a>' : '') +
        (it.k === 'big' ? '<span class="st-mbn" data-bigmini="' + c.i + '">' + esc(it.text || 'Type your question below') + '</span>' : '') +
        '<button type="button" class="st-x" data-x="' + c.i + '" title="Take it off the board" aria-label="Take ' + esc(a.name) + ' off the board">×</button></div>'; }).join('');
    box.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { cfg.items.splice(+b.dataset.x, 1); err(''); save(); drawAll(); });
    box.querySelectorAll('[data-src]').forEach(s => { s.value = cfg.items[+s.dataset.src].src || 'bank'; s.onchange = () => { cfg.items[+s.dataset.src].src = s.value; save(); }; });
    box.querySelectorAll('[data-show]').forEach(s => { s.value = cfg.items[+s.dataset.show].show || 'words'; s.onchange = () => { cfg.items[+s.dataset.show].show = s.value; save(); }; });
  };
  // The Big Question: its text box, under the small board, while it is on the board
  let bigSig = null;   // drawn again only when Big Questions are added or taken off (so typing isn't interrupted)
  const drawBig = () => {
    const box = $('#s-big'), idx = cfg.items.map((it, i) => it.k === 'big' ? i : -1).filter(i => i >= 0), sig = idx.join();
    if (sig === bigSig) return; bigSig = sig;
    box.innerHTML = !idx.length ? '' : idx.map((i, n) => '<div class="field"><label for="s-bigq' + i + '">The Big Question' + (idx.length > 1 ? ' ' + (n + 1) : '') + '</label>' +
      '<textarea id="s-bigq' + i + '" data-big="' + i + '" rows="3" maxlength="200" placeholder="e.g. Is it ever right for an advert to use fear?"></textarea></div>').join('') +
      '<span class="note">It shares the board, so keep it short. Press Enter for a new line.</span>';
    box.querySelectorAll('[data-big]').forEach(q => { const i = +q.dataset.big; q.value = cfg.items[i].text || '';
      q.oninput = () => { if (!cfg.items[i] || cfg.items[i].k !== 'big') return; cfg.items[i].text = q.value; save();
        const m = C.view.querySelector('[data-bigmini="' + i + '"]'); if (m) m.textContent = q.value.trim() || 'Type your question below'; }; });
  };
  const drawAll = () => { drawActs(); drawMini(); drawBig(); };
  const load = () => {
    failed = '';
    if (!cfg.topics.length) { drawAll(); return; }
    loading = true; drawAll();
    const want = cfg.topics.slice();
    ensure(want).then(() => { if (want.join() === cfg.topics.join()) { loading = false; drawAll(); } })
      .catch(x => { loading = false; failed = "Couldn't load the questions"; drawAll(); err(x.message + ' Check your internet connection and try again.'); });
  };
  $$('#s-topics input').forEach(i => i.onchange = () => { cfg.topics = $$('#s-topics input:checked').map(x => x.value); save(); load(); });
  $$('#s-levels input').forEach(i => i.onchange = () => { cfg.levels = $$('#s-levels input:checked').map(x => +x.value); save(); drawAll(); });
  $('#s-title').oninput = () => { cfg.title = $('#s-title').value.trim(); save(); };
  $('#s-secs').onchange = () => { cfg.secs = +$('#s-secs').value; save(); };
  $('#s-choices').onchange = () => { cfg.choices = $('#s-choices').checked; save(); };
  $('#s-clue').onchange = () => { cfg.clue = $('#s-clue').checked; save(); };
  $('#s-clear').onclick = () => { cfg.items = []; err(''); save(); drawAll(); };
  $('#s-go').onclick = () => {
    err('');
    if (!cfg.items.length) return err('Add something to the board first.');
    const empty = cfg.items.findIndex(it => it.k === 'big' && !String(it.text || '').trim());
    if (empty >= 0) { const q = $('#s-bigq' + empty); if (q) q.focus(); return err('Type your Big Question first.'); }
    // Activities that need nothing from the topics: your own Gap Fill, the Match-up words you chose, the Big Question
    const own = it => it.k === 'big' || (it.k === 'gapfill' && it.src && it.src !== 'bank') || (it.k === 'match' && it.pick && it.pick.length >= 4);
    const needTopics = cfg.items.some(it => !own(it));
    if (needTopics && !cfg.topics.length) return err('Choose at least one topic.');
    if (needTopics && !cfg.levels.length && !cfg.items.every(it => own(it) || it.k === 'gk' || it.k === 'wall')) return err('Choose at least one level.');
    const go = $('#s-go'); go.disabled = true; go.textContent = 'Getting it ready…';
    ensure(cfg.topics).then(() => {
      const r = dealAll(cfg);
      if (r.missing.length) { go.disabled = false; go.textContent = 'Show on the board';
        return err('Not enough questions for: ' + [...new Set(r.missing)].join(', ') + '. Choose more topics or levels, or take ' + (r.missing.length > 1 ? 'them' : 'it') + ' off the board.'); }
      saveDeal(newDeal(cfg, r.items)); C.touch(); location.hash = '#/starters/play';
    }).catch(x => { go.disabled = false; go.textContent = 'Show on the board'; err(x.message + ' Check your internet connection and try again.'); });
  };
  drawLast(); load();
}

// =====================================================================================================================
// ---------- the starter on the board: fills the window ----------
let S = null;
function stop(){
  if (!S) return;
  clearInterval(S.tick); clearTimeout(S.fitWait);
  removeEventListener('resize', S.onResize); removeEventListener('keydown', S.onKey, true);
  document.removeEventListener('fullscreenchange', S.onFs);
  if (S.el) S.el.remove();
  document.documentElement.classList.remove('bg-on');
  if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  S = null;
}
function play(){
  const d = dealNow();
  if (!d) { location.hash = '#/starters'; return; }
  mount(d);
}
const ICON = {
  full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  unfull: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
  on: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  off: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>'
};
function mount(d){
  stop();
  const st = d.state = Object.assign({shown: {}, sub: {}, solved: {}, order: {}}, d.state || {});
  S = {d, st, sel: new Set(), u: 1, secs: +d.cfg.secs || 0, left: +d.cfg.secs || 0, run: false, tick: null, sound: getJ(K_SOUND, true)};
  document.documentElement.classList.add('bg-on');
  const title = d.cfg.title || 'Starter';
  document.title = title + ' · Starters';
  const L = S.L = layout(d.items), one = L.cells.length === 1 && ACT[d.items[L.cells[0].i].k].size === 'full';
  const el = S.el = document.createElement('div');
  el.className = 'bg-play st-play';
  el.innerHTML =
    '<div class="bg-top"><h1 class="bg-title">' + esc(title) + '</h1>' +
      (S.secs ? '<div class="st-clock"><button type="button" class="st-time" title="Start or pause the timer (Space)"></button>' +
        '<button type="button" class="bg-tool st-go"></button><button type="button" class="bg-tool st-reset" title="Start the timer again">↺</button></div>' : '') +
      '<div class="bg-tools">' +
        '<button class="bg-tool" type="button" data-t="all"></button>' +
        '<button class="bg-tool" type="button" data-t="new" title="The same activities with different questions">🎲 New questions</button>' +
        '<button class="bg-tool" type="button" data-t="sound"></button>' +
        '<button class="bg-tool" type="button" data-t="full"></button>' +
        '<button class="bg-tool" type="button" data-t="exit" title="Back to Starters. This starter is kept.">Exit</button></div></div>' +
    '<div class="st-board" style="grid-template-rows:repeat(' + L.rows + ', minmax(0, 1fr))">' +
      L.cells.map((c, n) => { const it = d.items[c.i];
        return '<section class="st-panel ' + ACT[it.k].size + ' k-' + it.k + '" data-i="' + c.i + '" data-n="' + (n + 1) + '" style="grid-row:' + c.r + ';grid-column:' + c.c + ' / span ' + c.span + '"></section>'; }).join('') +
    '</div>' +
    '<p class="bg-keys">' + (one && d.items[0].k === 'big' ? (S.secs ? '<kbd>Space</kbd> start or pause the timer' : '') + '</p>'
      : (one ? (d.items[0].k === 'wordsearch' ? 'Drag across a word, or click its first and last letters, to mark it · click a word in the list, or type its number, to show it'
      : d.items[0].k === 'wall' ? 'Click four tiles that belong together' : 'Click a ' + (d.items[0].k === 'match' ? 'word' : 'gap') + ', or type its number, to show its answer') + ' · <kbd>A</kbd> show all the answers'
      : 'Click a square, or type its number, to show its answer · <kbd>A</kbd> show all the answers') + (d.items.some(canNew) ? ' · ‹ › a different question' : '') + (S.secs ? ' · <kbd>Space</kbd> start or pause the timer' : '') + '</p>');
  document.body.appendChild(el);
  S.board = el.querySelector('.st-board');
  [...S.board.children].forEach(p => drawPanel(+p.dataset.i, true));
  el.querySelector('[data-t=all]').onclick = e => { e.currentTarget.blur(); allToggle(); };
  el.querySelector('[data-t=new]').onclick = e => { e.currentTarget.blur(); redeal(); };
  el.querySelector('[data-t=sound]').onclick = e => { e.currentTarget.blur(); S.sound = !S.sound; setJ(K_SOUND, S.sound); tools(); if (S.sound) chime('right'); };
  el.querySelector('[data-t=full]').onclick = e => { e.currentTarget.blur(); const doc = document;
    if (doc.fullscreenElement) doc.exitFullscreen().catch(() => {}); else if (doc.documentElement.requestFullscreen) doc.documentElement.requestFullscreen().catch(() => {}); };
  el.querySelector('[data-t=exit]').onclick = () => { location.hash = d.back || '#/starters'; };   // back: a single-activity page (one())
  if (S.secs) { el.querySelector('.st-time').onclick = e => { e.currentTarget.blur(); clockToggle(); };
    el.querySelector('.st-go').onclick = e => { e.currentTarget.blur(); clockToggle(); };
    el.querySelector('.st-reset').onclick = e => { e.currentTarget.blur(); clockReset(); }; }
  S.board.addEventListener('click', onBoardClick);
  ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].forEach(t => S.board.addEventListener(t, wsPointer));
  S.onResize = () => { sizeUp(); fitAll(); }; S.onKey = onKey; S.onFs = () => tools();
  addEventListener('resize', S.onResize); addEventListener('keydown', S.onKey, true); document.addEventListener('fullscreenchange', S.onFs);
  sizeUp(); tools(); clockDraw(); fitAll();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (S && S.el === el) fitAll(); });
}
const save = () => { if (S) saveDeal(S.d); if (C) C.touch(); };
function sizeUp(){ const u = Math.max(.55, Math.min(2.4, Math.min(innerWidth / 1280, innerHeight / 760))); S.u = u; S.el.style.setProperty('--u', u + 'px'); }
function tools(){
  if (!S) return;
  const s = S.el.querySelector('[data-t=sound]'), f = S.el.querySelector('[data-t=full]'), fs = !!document.fullscreenElement;
  s.innerHTML = (S.sound ? ICON.on : ICON.off) + '<span>' + (S.sound ? 'Sound on' : 'Sound off') + '</span>';
  f.innerHTML = (fs ? ICON.unfull : ICON.full) + '<span>' + (fs ? 'Exit full screen' : 'Full screen') + '</span>';
  const all = S.el.querySelector('[data-t=all]'); all.hidden = S.d.items.every(x => x.k === 'big');
  all.innerHTML = (allShown() ? 'Hide the answers' : 'Show all the answers') + ' <kbd>A</kbd>';
  S.el.querySelector('[data-t=new]').hidden = !S.d.items.some(canNew);
}
function redeal(){
  const d = S.d, b = S.el.querySelector('[data-t=new]');
  b.disabled = true; b.textContent = 'Dealing…';
  ensure(d.cfg.topics).then(() => {
    const r = dealAll(d.cfg);
    if (!r.items.length) { b.disabled = false; b.textContent = '🎲 New questions'; return; }
    const nd = newDeal(d.cfg, r.items); if (d.back) nd.back = d.back; saveDeal(nd); if (S && S.d === d) mount(nd);
  }).catch(() => { if (b.isConnected) { b.disabled = false; b.textContent = '🎲 New questions'; } });
}

// ---------- the timer: starts when the teacher is ready (students may still be coming in) ----------
const mmss = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
function clockDraw(){
  if (!S || !S.secs) return;
  const c = S.el.querySelector('.st-clock'), t = c.querySelector('.st-time'), go = c.querySelector('.st-go');
  const up = S.left <= 0;
  t.textContent = up ? "Time's up!" : mmss(S.left);
  c.classList.toggle('low', !up && S.left <= 10 && S.run); c.classList.toggle('up', up); c.classList.toggle('run', S.run);
  go.innerHTML = up ? '' : S.run ? 'Pause' : S.left === S.secs ? '▶ Start' : '▶ Carry on';
  go.hidden = up;
}
function clockToggle(){
  if (!S || !S.secs) return;
  if (S.left <= 0) return clockReset();
  S.run = !S.run; clearInterval(S.tick);
  if (S.run) S.tick = setInterval(() => { if (!S) return; S.left--; if (S.left <= 0) { S.left = 0; S.run = false; clearInterval(S.tick); chime('up'); } else if (S.left <= 5) chime('tick'); clockDraw(); }, 1000);
  clockDraw();
}
function clockReset(){ if (!S) return; clearInterval(S.tick); S.run = false; S.left = S.secs; clockDraw(); }

// ---------- showing the answers ----------
const kindOf = i => ACT[S.d.items[i].k];
const subCount = it => it.k === 'match' ? it.pairs.length : it.k === 'gapfill' ? it.parts.filter(p => p.t === 'g').length : it.k === 'wall' ? 4 : it.k === 'wordsearch' ? it.words.length : 0;
function isShown(i){ const it = S.d.items[i];
  if (it.k === 'big') return true;   // nothing to show
  if (it.k === 'wall') return (S.st.solved[i] || []).length === 4;
  if (ACT[it.k].size === 'full') return (S.st.sub[i] || []).length === subCount(it);
  return !!S.st.shown[i]; }
const allShown = () => S.d.items.every((_, i) => isShown(i));
function setShown(i, on){
  const it = S.d.items[i];
  if (it.k === 'big') return;
  if (it.k === 'wall') { S.st.solved[i] = on ? wallSolveAll(i) : []; S.sel.clear(); }
  else if (ACT[it.k].size === 'full') S.st.sub[i] = on ? [...Array(subCount(it)).keys()] : [];
  else S.st.shown[i] = on;
}
function toggle(i){ setShown(i, !isShown(i)); save(); drawPanel(i); tools(); }
function toggleSub(i, n){
  const it = S.d.items[i]; if (n < 0 || n >= subCount(it)) return;
  const s = S.st.sub[i] = (S.st.sub[i] || []).slice(), k = s.indexOf(n);
  if (k < 0) s.push(n); else s.splice(k, 1);
  save(); drawPanel(i); tools();
}
// ‹ › on a square (8 Nov 2026, teacher: "two little arrows so I can change individual questions without refreshing the
// whole board"): › deals another of the same kind (never one already on the board, or one this square has had), ‹ goes back
// to the one before. Each square keeps its own list (deal.hist, deal.pos), saved with the starter.
function navPanel(i, dir){
  const d = S.d; d.hist = d.hist || {}; d.pos = d.pos || {};
  const h = d.hist[i] = d.hist[i] || [d.items[i]], p = d.pos[i] != null ? d.pos[i] : h.length - 1;
  const show = x => { d.items[i] = x; d.pos[i] = h.indexOf(x); ['shown', 'sub', 'solved', 'order'].forEach(k => { if (S.st[k]) delete S.st[k][i]; });
    S.sel.clear(); S.wsPend = S.wsDrag = S.wsFlash = null; save(); drawPanel(i); tools(); };
  if (dir < 0) { if (p > 0) show(h[p - 1]); return; }
  if (p < h.length - 1) return show(h[p + 1]);
  const cur = d.items[i]; if (!canNew(cur)) return;
  ensure(d.cfg.topics).then(() => {
    if (!S || S.d !== d) return;
    const others = d.items.filter((_, k) => k !== i), base = others.flatMap(x => x.keys || []);
    const from = cur.from || d.cfg.items[i] || {k: cur.k};
    const deal = used => { const before = new Set(used), x = dealOne(from, d.cfg, used, others); if (x) { x.keys = [...used].filter(k => !before.has(k)); x.from = from; } return x; };
    // a new one if there is one; when this square has had them all, any but the one on it now
    const x = deal(new Set(base.concat(h.flatMap(y => y.keys || [])))) || deal(new Set(base.concat(cur.keys || [])));
    if (!x) { const b = S.board.querySelector('.st-panel[data-i="' + i + '"] [data-nav="1"]'); if (b) { b.title = 'There are no others like this one'; b.classList.remove('none'); void b.offsetWidth; b.classList.add('none'); } return; }
    h.push(x); show(x);
  }).catch(() => {});
}
function allToggle(){ const on = !allShown(); S.d.items.forEach((_, i) => setShown(i, on)); save(); S.d.items.forEach((_, i) => drawPanel(i)); tools(); }
function onBoardClick(e){
  const p = e.target.closest('.st-panel'); if (!p || !S) return;
  const i = +p.dataset.i, it = S.d.items[i], nav = e.target.closest('[data-nav]');
  if (nav) return navPanel(i, +nav.dataset.nav);
  if (it.k === 'big') return;
  if (it.k === 'wall') { const t = e.target.closest('.st-tile'); if (t && !t.classList.contains('solved')) wallPick(i, +t.dataset.t);
    const w = e.target.closest('[data-wall]'); if (w) wallAct(i, w.dataset.wall); return; }
  if (ACT[it.k].size === 'full') { const s = e.target.closest('[data-sub]'); if (s) toggleSub(i, +s.dataset.sub); return; }
  toggle(i);
}
function onKey(e){
  if (!S) return;
  if (e.target && e.target.matches && e.target.matches('input, textarea, select')) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key;
  if (k === ' ' || k === 'Spacebar') { e.preventDefault(); clockToggle(); return; }
  if (k === 'a' || k === 'A') { e.preventDefault(); allToggle(); return; }
  if (/^[1-9]$/.test(k)) {
    e.preventDefault();
    const cells = S.L.cells, n = +k;
    if (cells.length === 1 && kindOf(cells[0].i).size === 'full') { const i = cells[0].i; if (S.d.items[i].k !== 'wall') toggleSub(i, n - 1); return; }
    if (cells[n - 1]) toggle(cells[n - 1].i);
  }
}

// ---------- the panels ----------
const instr = s => '<p class="st-i">' + s + '</p>';
const blank = (w, on) => '<span class="st-blank' + (on ? ' on' : '') + '"><span>' + esc(w) + '</span></span>';
function optsHTML(q, on){
  return '<ol class="st-opts' + (q.opts.length === 2 ? ' two' : '') + '">' + q.opts.map((o, n) => '<li class="' + (on && n === q.a ? 'ok' : on ? 'dim' : '') + '"><b>' + 'ABCD'[n] + '</b><span>' + esc(o) + '</span></li>').join('') + '</ol>';
}
function smallHTML(it, on){
  const q = it.q, cfg = S.d.cfg, opts = q && q.opts && q.opts.length > 2 && (cfg.choices || it.k === 'question');
  const ans = s => '<div class="st-a">' + s + '</div>', aw = s => '<b class="st-aw">' + esc(s) + '</b>';
  const clue = () => cfg.clue ? '<p class="st-clue"><b>Clue:</b> ' + esc(it.def) + '</p>' : '';
  switch (it.k) {
    case 'gap': return instr('Write the missing word.') + '<p class="st-t">' + esc(q.s).replace(/_{3,}/, blank(q.opts[q.a], on)) + '</p>' + (opts ? optsHTML(q, on) : '');
    case 'rw': return instr('Grammar check: good grammar or bad grammar? If it’s bad, write it correctly.') + '<p class="st-t">' + esc(q.s) + '</p>' +
      ans(q.a === 0 ? '<b class="st-ok">✓ Good grammar</b>' : '<b class="st-no">✗ Bad grammar.</b> ' + (q.fix ? '<span class="st-fix">' + esc(q.fix) + '</span>' : '<span class="st-why">' + rich(q.why) + '</span>'));
    case 'word': return instr('Write what it means.') + '<p class="st-big">' + esc(q.w) + (q.pos ? '<small>' + esc(q.pos) + '</small>' : '') + '</p>' + (opts ? optsHTML(q, on) : ans('<span class="st-def">' + esc(q.def) + '</span>'));
    case 'meaning': return instr('Write the word that means:') + '<p class="st-t">' + esc(q.def) + '</p>' + (opts ? optsHTML(q, on) : ans(aw(q.w)));
    case 'zh': return instr('Write the English word.') + '<p class="st-big zh" lang="zh-CN">' + esc(q.zh) + '</p>' + (opts ? optsHTML(q, on) : ans(aw(q.w)));
    case 'tf': return instr('Write true or false.') + '<p class="st-t">' + esc(q.s) + '</p>' + ans('<b class="' + (q.a === 0 ? 'st-ok">True.' : 'st-no">False.') + '</b>' + (q.why ? ' <span class="st-why">' + rich(q.why) + '</span>' : ''));
    case 'anagram': return instr('Unscramble the letters.') + '<div class="st-letters">' + it.mix.map(m => '<span class="st-lw">' + m.split('').map(c => '<span class="st-lt">' + c + '</span>').join('') + '</span>').join('') + '</div>' +
      (it.lens.length > 1 ? '<p class="st-lens">' + it.lens.length + ' words: ' + it.lens.join(' + ') + ' letters</p>' : '') + clue() + ans(aw(it.w));
    case 'vowels': return instr('Put the vowels back.') + '<p class="st-cons">' + it.cons.map(esc).join('<span class="st-sp"></span>') + '</p>' + clue() + ans(aw(it.w));
    case 'question': { const s = esc(q.s), c = esc(q.cmd || '');
      return instr('Write the letter of the answer that does what the question asks.') + '<p class="st-t">' + (c && s.toLowerCase().startsWith(c.toLowerCase()) ? '<span class="st-cmd">' + s.slice(0, c.length) + '</span>' + s.slice(c.length) : s) + '</p>' + optsHTML(q, on); }
    case 'gk': return instr('Write the answer.') + '<p class="st-t">' + esc(q.s) + '</p>' + (opts ? optsHTML(q, on) : ans(aw(q.opts[q.a])));
  }
  return '';
}
function errorsHTML(it){
  return instr('Find and correct the ' + (it.n === 1 ? 'mistake' : it.n + ' mistakes') + '.') + (it.title ? '<p class="st-sub">' + esc(it.title) + '</p>' : '') +
    '<p class="st-t st-para">' + it.parts.map(p => p.t === 's' ? esc(p.s) : '<span class="st-err"><span class="w">' + esc(p.w) + '</span><span class="r">' + esc(p.r) + '</span></span>').join('') + '</p>';
}
function matchHTML(it, sub){
  const on = n => sub.includes(n);
  return instr('Match each word to its meaning. Write the number and the letter, like <b>1 C</b>.') + '<div class="st-match">' +
    '<ol class="st-ml">' + it.pairs.map((p, n) => '<li data-sub="' + n + '" class="' + (on(n) ? 'on' : '') + '" style="--pc:' + PAIR[n] + '"><span class="st-mk">' + (n + 1) + '</span><span class="st-mw st-ck">' + esc(p.w) + '</span>' +
      '<span class="st-mto">' + 'ABCDEFGH'[it.order.indexOf(n)] + '</span></li>').join('') + '</ol>' +
    '<svg class="st-lines" aria-hidden="true"></svg>' +
    '<ol class="st-mr">' + it.order.map((n, r) => '<li data-sub="' + n + '" class="' + (on(n) ? 'on' : '') + '" style="--pc:' + PAIR[n] + '"><span class="st-mk">' + 'ABCDEFGH'[r] + '</span><span class="st-md">' + esc(it.pairs[n].def) + '</span></li>').join('') + '</ol></div>';
}
function gapfillHTML(it, sub){
  const shownWords = it.parts.filter(p => p.t === 'g' && sub.includes(p.n - 1)).map(p => p.s.toLowerCase());
  const crossed = it.bank.map(w => { const k = shownWords.indexOf(w.toLowerCase()); if (k < 0) return false; shownWords.splice(k, 1); return true; });
  return instr(it.extra ? 'Write the missing words. Choose from the word bank: not every word is needed.' : 'Write the missing words. Use each word in the word bank once.') +
    (it.title ? '<p class="st-sub">' + esc(it.title) + '</p>' : '') +
    '<p class="st-t st-para" style="--gw:' + Math.max(5, ...it.parts.filter(p => p.t === 'g').map(p => p.s.length)) + 'ch">' + it.parts.map(p => p.t === 's' ? esc(p.s) : '<button type="button" class="st-gb' + (sub.includes(p.n - 1) ? ' on' : '') + '" data-sub="' + (p.n - 1) + '" aria-label="Gap ' + p.n + '"><i>' + p.n + '</i><span>' + esc(p.s) + '</span></button>').join('') + '</p>' +
    '<div class="st-bank"><span class="st-bl">Word bank</span>' + it.bank.map((w, k) => '<span class="st-bw' + (crossed[k] ? ' used' : '') + '">' + esc(w) + '</span>').join('') + '</div>';
}
// Connecting Wall: the groups found go to the top in the order they were found, in their colour, with the group's name
function wallHTML(i, it){
  const solved = S.st.solved[i] || [], order = S.st.order[i] || it.order, rows = [];
  solved.forEach((g, k) => rows.push('<div class="st-wrow solved" style="--gc:' + WALL[k] + '">' + it.groups[g].words.map(w => '<span class="st-tile solved"><span class="st-ck">' + esc(w) + '</span></span>').join('') +
    '<span class="st-wname">' + esc(it.groups[g].name) + '</span></div>'));
  const rest = order.filter(t => !solved.includes(Math.floor(t / 4)));
  for (let r = 0; r < rest.length; r += 4) rows.push('<div class="st-wrow">' + rest.slice(r, r + 4).map(t => '<button type="button" class="st-tile' + (S.sel.has(t) ? ' sel' : '') + '" data-t="' + t + '"><span class="st-ck">' +
    esc(it.groups[Math.floor(t / 4)].words[t % 4]) + '</span></button>').join('') + '</div>');
  return instr('Sort the sixteen words into four groups of four.') + '<div class="st-wall">' + rows.join('') + '</div>' +
    '<div class="st-wacts">' + (solved.length < 4 ? '<button type="button" class="bg-btn small" data-wall="shuffle">Shuffle</button><button type="button" class="bg-btn small" data-wall="next">Show a group</button>' :
      '<button type="button" class="bg-btn small" data-wall="reset">Start the wall again</button>') + '</div>';
}
// Word search: the square on the left (marks under the letters), the list on the right. Words found (or shown) get their
// colour on the board and in the list; with the meanings listed, the word appears where "7 letters" was.
function wsHTML(i, it, sub){
  const n = it.size, words = it.show !== 'meanings';
  return instr(words ? 'Find the words and write them in your book.' : 'Find the word for each meaning and write it in your book.') +
    '<div class="st-ws"><div class="st-wsb" style="--n:' + n + '"><svg class="st-wsm" viewBox="0 0 ' + n * 10 + ' ' + n * 10 + '" aria-hidden="true">' + wsMarks(i, it, sub) + '</svg>' +
      '<div class="st-wsg" role="img" aria-label="The square of letters">' + it.b.join('').split('').map(ch => '<span>' + ch + '</span>').join('') + '</div></div>' +
    '<ol class="st-wsl' + (words ? '' : ' clues') + '">' + it.words.map((w, k) => '<li data-sub="' + k + '" class="' + (sub.includes(k) ? 'on' : '') + '" style="--wc:' + w.col + '"><span class="st-mk">' + (k + 1) + '</span>' +
      '<span class="st-wst st-ck">' + (words ? '<b>' + esc(w.w) + '</b>' : '<span class="st-wsd">' + esc(w.def) + '</span><span class="st-wsa"><i>' + w.n + ' letters</i><b>' + esc(w.w) + '</b></span>') + '</span></li>').join('') + '</ol></div>';
}
function wsMarks(i, it, sub){
  const c = k => [(k % it.size) * 10 + 5, Math.floor(k / it.size) * 10 + 5];
  const ln = (a, z, cls, col) => { const [x1, y1] = c(a), [x2, y2] = c(z);
    return a === z ? '<circle class="' + cls + '" cx="' + x1 + '" cy="' + y1 + '" r="3.9"/>' : '<line class="' + cls + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"' + (col ? ' style="stroke:' + col + '"' : '') + '/>'; };
  const d = S.wsDrag, p = S.wsPend, f = S.wsFlash;
  return it.words.map((w, k) => sub.includes(k) ? ln(w.a, w.z, 'f', w.col) : '').join('') + (f && f.i === i ? ln(f.a, f.z, 'x') : '') +
    (d && d.i === i ? ln(d.a, d.z, 's') : p && p.i === i ? ln(p.a, p.a, 's') : '');
}
function wsRedraw(i){ const svg = S && S.board.querySelector('.st-panel[data-i="' + i + '"] .st-wsm'); if (svg) svg.innerHTML = wsMarks(i, S.d.items[i], S.st.sub[i] || []); }
// Drag from the first letter to the last (it snaps to the nearest of the 8 directions), or click one end, then the other
function wsPointer(e){
  if (!S) return;
  const d = S.wsDrag;
  if (e.type === 'pointerdown') {
    const g = e.target.closest && e.target.closest('.st-wsg'); if (!g || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const i = +g.closest('.st-panel').dataset.i, it = S.d.items[i], [x, y] = wsPos(e, g, it.size); if (x < 0 || y < 0 || x >= it.size || y >= it.size) return;
    e.preventDefault(); try { g.setPointerCapture(e.pointerId); } catch (err) {}
    const a = Math.floor(y) * it.size + Math.floor(x);
    S.wsDrag = {i, g, a, z: a, id: e.pointerId, moved: false}; wsRedraw(i); return;
  }
  if (!d || e.pointerId !== d.id) return;
  const n = S.d.items[d.i].size;
  if (e.type === 'pointermove') {
    const [x, y] = wsPos(e, d.g, n), ar = Math.floor(d.a / n), ac = d.a % n, dx = x - .5 - ac, dy = y - .5 - ar;
    let z = d.a;
    if (Math.abs(dx) >= .5 || Math.abs(dy) >= .5) {
      const k = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)), dc = Math.round(Math.cos(k * Math.PI / 4)), dr = Math.round(Math.sin(k * Math.PI / 4));
      let len = Math.max(0, Math.round((dx * dc + dy * dr) / (dr && dc ? 2 : 1)));
      while (len > 0 && !(ar + dr * len >= 0 && ar + dr * len < n && ac + dc * len >= 0 && ac + dc * len < n)) len--;
      z = (ar + dr * len) * n + ac + dc * len;
    }
    if (z !== d.z) { d.z = z; if (z !== d.a) d.moved = true; wsRedraw(d.i); }
    return;
  }
  S.wsDrag = null;
  if (e.type === 'pointercancel') return wsRedraw(d.i);
  if (d.moved && d.z !== d.a) { S.wsPend = null; return wsPick(d.i, d.a, d.z); }
  const p = S.wsPend, line = (a, z) => { const dr = Math.floor(z / n) - Math.floor(a / n), dc = z % n - a % n; return a !== z && (!dr || !dc || Math.abs(dr) === Math.abs(dc)); };
  if (p && p.i === d.i && line(p.a, d.a)) { S.wsPend = null; return wsPick(d.i, p.a, d.a); }
  S.wsPend = p && p.i === d.i && p.a === d.a ? null : {i: d.i, a: d.a}; wsRedraw(d.i);
}
const wsPos = (e, g, n) => { const r = g.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * n, (e.clientY - r.top) / r.height * n]; };
function wsPick(i, a, z){
  const it = S.d.items[i], k = it.words.findIndex(w => (w.a === a && w.z === z) || (w.a === z && w.z === a));
  if (k < 0) { chime('wrong'); S.wsFlash = {i, a, z}; wsRedraw(i); setTimeout(() => { if (S && S.wsFlash && S.wsFlash.i === i) { S.wsFlash = null; wsRedraw(i); } }, 450); return; }
  const sub = S.st.sub[i] = (S.st.sub[i] || []).slice();
  if (sub.includes(k)) return wsRedraw(i);
  sub.push(k); chime('right'); save(); drawPanel(i); tools();
}
function drawPanel(i, first){
  const p = S.board.querySelector('.st-panel[data-i="' + i + '"]'); if (!p) return;
  const it = S.d.items[i], a = ACT[it.k], on = isShown(i), sub = S.st.sub[i] || [];
  const many = S.L.cells.length > 1;   // no Show the answer button (8 Nov 2026, teacher): click the question; the line under the board says so
  const hist = (S.d.hist || {})[i] || [], pos = (S.d.pos || {})[i] || 0, nav = canNew(it) || hist.length > 1;
  p.classList.toggle('shown', on && it.k !== 'big');
  p.innerHTML = '<div class="st-ph">' + (many ? '<span class="st-n">' + p.dataset.n + '</span>' : '') + '<span class="st-k">' + esc(a.name) + (it.k === 'wordsearch' ? ' · ' + esc(WS_SAY[it.lv]) : '') + '</span>' +
    (nav ? '<span class="st-nav"><button type="button" data-nav="-1" title="Back to the one before" aria-label="Back to the one before"' + (pos > 0 ? '' : ' disabled') + '>‹</button>' +
      '<button type="button" data-nav="1" title="A different one" aria-label="A different one"' + (canNew(it) || pos < hist.length - 1 ? '' : ' disabled') + '>›</button></span>' : '') +
    '</div>' +
    '<div class="st-body"><div class="st-in' + (it.k === 'wall' || it.k === 'wordsearch' ? ' fill' : '') + (on ? ' on' : '') + '">' +
      (it.k === 'big' ? '<p class="st-bigq">' + esc(it.text) + '</p>' : a.size === 'small' ? smallHTML(it, on) : it.k === 'errors' ? errorsHTML(it) : it.k === 'match' ? matchHTML(it, sub) : it.k === 'gapfill' ? gapfillHTML(it, sub) : it.k === 'wordsearch' ? wsHTML(i, it, sub) : wallHTML(i, it)) +
    '</div></div>';
  if (!first) fitPanel(p);
}
// Text as big as it can be: the panel's font size goes down until everything in it fits (answers hidden but in place,
// so showing one doesn't move anything)
function fitPanel(p){
  if (!S) return;
  const body = p.querySelector('.st-body'), inn = body && body.firstElementChild; if (!inn) return;
  const H = body.clientHeight, W = body.clientWidth; if (H < 10 || W < 10) return;
  const checks = [...inn.querySelectorAll('.st-ck')], fill = inn.classList.contains('fill');
  const fits = s => { body.style.fontSize = s + 'px';
    if (!fill && inn.offsetHeight > H + 1) return false;
    if (inn.scrollWidth > inn.clientWidth + 1 || inn.scrollHeight > inn.clientHeight + 1 && fill) return false;
    return checks.every(c => c.scrollWidth <= c.clientWidth + 1 && c.offsetHeight <= c.parentElement.clientHeight + 1); };
  const big = p.classList.contains('k-big') ? 100 : p.classList.contains('small') ? 64 : 52;
  let lo = 7, hi = Math.max(8, Math.min(H * .4, big * S.u)), best = lo;
  if (fits(hi)) best = hi;
  else for (let k = 0; k < 14; k++) { const m = (lo + hi) / 2; if (fits(m)) { best = m; lo = m; } else hi = m; }
  body.style.fontSize = best + 'px';
  if (p.classList.contains('k-match')) drawLines(p);
}
function fitAll(){ if (!S) return; S.board.querySelectorAll('.st-panel').forEach(fitPanel); }
// Match-up: a line from each word shown to its meaning
function drawLines(p){
  const svg = p.querySelector('.st-lines'), box = p.querySelector('.st-match'); if (!svg || !box) return;
  const b = box.getBoundingClientRect(), it = S.d.items[+p.dataset.i], sub = S.st.sub[+p.dataset.i] || [];
  svg.setAttribute('viewBox', '0 0 ' + b.width + ' ' + b.height);
  const w = Math.max(2, parseFloat(getComputedStyle(box).fontSize) * .12);
  svg.innerHTML = sub.map(n => { const l = box.querySelector('.st-ml [data-sub="' + n + '"]'), r = box.querySelector('.st-mr [data-sub="' + n + '"]'); if (!l || !r) return '';
    const L = l.getBoundingClientRect(), R = r.getBoundingClientRect(), x1 = L.right - b.left, y1 = L.top + L.height / 2 - b.top, x2 = R.left - b.left, y2 = R.top + R.height / 2 - b.top;
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + PAIR[n] + '" stroke-width="' + w + '" stroke-linecap="round"/>'; }).join('');
  void it;
}

// ---------- Connecting Wall: click four tiles ----------
function wallSolveAll(i){ const s = (S.st.solved[i] || []).slice(); [0, 1, 2, 3].forEach(g => { if (!s.includes(g)) s.push(g); }); return s; }
function wallPick(i, t){
  if (S.busy) return;
  if (S.sel.has(t)) S.sel.delete(t); else if (S.sel.size < 4) S.sel.add(t);
  drawPanel(i);
  if (S.sel.size < 4) return;
  const gs = [...S.sel].map(x => Math.floor(x / 4)), ok = gs.every(g => g === gs[0]);
  S.busy = true;
  setTimeout(() => {
    if (!S) return; S.busy = false;
    const p = S.board.querySelector('.st-panel[data-i="' + i + '"]');
    if (ok) { const s = S.st.solved[i] = (S.st.solved[i] || []).concat(gs[0]); S.sel.clear();
      if (s.length === 3) S.st.solved[i] = wallSolveAll(i);   // three found: the last four go together
      chime('right'); save(); drawPanel(i); tools();
      const rows = p.querySelectorAll('.st-wrow.solved'), row = rows[s.length - 1]; if (row) row.classList.add('pop');
      if (s.length === 3 && rows[3]) rows[3].classList.add('pop');
    } else { chime('wrong'); p.querySelectorAll('.st-tile.sel').forEach(x => x.classList.add('shake')); S.busy = true;
      setTimeout(() => { if (!S) return; S.busy = false; S.sel.clear(); drawPanel(i); }, 520); }
  }, 260);
}
function wallAct(i, what){
  const it = S.d.items[i];
  if (what === 'shuffle') { const solved = S.st.solved[i] || [], cur = S.st.order[i] || it.order;
    const rest = shuffle(cur.filter(t => !solved.includes(Math.floor(t / 4)))); S.st.order[i] = cur.filter(t => solved.includes(Math.floor(t / 4))).concat(rest); S.sel.clear(); }
  else if (what === 'next') { const s = S.st.solved[i] = (S.st.solved[i] || []).slice(), g = [0, 1, 2, 3].find(x => !s.includes(x)); if (g != null) s.push(g); if (s.length === 3) S.st.solved[i] = wallSolveAll(i); S.sel.clear(); }
  else if (what === 'reset') { S.st.solved[i] = []; S.st.order[i] = shuffle(it.order); S.sel.clear(); }
  save(); drawPanel(i); tools();
}

// ---------- sound (the board games' "Sound on/off" setting) ----------
let AC = null;
function chime(kind){
  if (!S || !S.sound) return;
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) { return; }
  const now = AC.currentTime;
  const tone = (f, t0, d, type, vol) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, now + t0);
    g.gain.setValueAtTime(0, now + t0); g.gain.linearRampToValueAtTime(vol || .18, now + t0 + .015); g.gain.exponentialRampToValueAtTime(.0001, now + t0 + d);
    o.connect(g); g.connect(AC.destination); o.start(now + t0); o.stop(now + t0 + d + .05); };
  if (kind === 'right') { tone(660, 0, .14, 'triangle', .2); tone(990, .12, .3, 'triangle', .2); }
  else if (kind === 'wrong') { tone(220, 0, .18, 'square', .07); tone(165, .16, .32, 'square', .07); }
  else if (kind === 'tick') tone(1200, 0, .05, 'square', .05);
  else if (kind === 'up') { [784, 659, 523].forEach((f, k) => tone(f, k * .22, .45, 'triangle', .18)); }
}

// =====================================================================================================================
// ---------- Match-up: the words the teacher chooses (8 Nov 2026, teacher: "a screen similar to the Gap Fill one where teachers
// can select which words they want in the matchup… words from the chosen word bank") ----------
// The words of the topics chosen on the Starters page (at any level; the level chips filter the list). 4 to 8 words; saved
// on the Match-up on the board (item.pick: word and meaning as they were), so it stays the same until it's changed.
const MT_MIN = 4, MT_MAX = 8, MT_BEST = 6;
// single: for the Match Up page on its own (one('match')): its words are saved with that page, and Use comes back to it
function mtChoose(single){
  const back = single ? '#/starters/' + ONE.match.path : '#/starters';
  const cfg = single ? oneCfg('match') : cfgNow(), idx = single ? 0 : cfg.items.findIndex(it => it.k === 'match'), item = single ? cfg.item : cfg.items[idx];
  const topics = cfg.topics.filter(t => !(TOPICS.find(x => x.key === t) || {}).only);
  if (idx < 0 || !topics.length) { location.hash = back; return; }
  C.setTitle(single ? 'Match Up: choose the words' : 'Match-up: choose the words'); C.header();
  let picked = (item.pick || []).slice(), find = '', lv = cfg.levels.length ? cfg.levels.slice() : [1, 2, 3, 4, 5], topic = 'all';
  C.view.innerHTML = '<p style="margin:0 0 14px"><a class="backlink" href="' + back + '">← ' + (single ? 'Match Up' : 'Build the Board') + '</a></p>' +
    '<p class="note st-lead">Choose the words for today\'s Match-up from ' + esc(topics.map(topicName).join(', ')) + '. Six works best; you can choose from ' + MT_MIN + ' to ' + MT_MAX + '.</p>' +
    '<div class="st-build"><div class="st-main"><section class="card st-sec">' +
      '<div class="mt-bar">' + (topics.length > 1 ? '<div class="field"><label for="mt-topic">Topic</label><select id="mt-topic"><option value="all">All of them</option>' +
        topics.map(t => '<option value="' + t + '">' + esc(topicName(t)) + '</option>').join('') + '</select></div>' : '') +
        '<div class="field"><label for="mt-find">Search</label><input type="text" id="mt-find" placeholder="A word, or part of a meaning"></div></div>' +
      '<div class="bg-chips" id="mt-levels">' + LEVELS.map(([n, name]) => '<label class="bg-chip"><input type="checkbox" value="' + n + '"' + (lv.includes(n) ? ' checked' : '') + '><span>' + name + '</span></label>').join('') + '</div>' +
      '<div class="mt-list" id="mt-list"><p class="note">Loading the words…</p></div></section></div>' +
    '<aside class="st-side"><div class="card st-sec st-stick">' +
      '<div class="spread"><h2>Your words</h2><span class="st-room" id="mt-n"></span></div>' +
      '<div class="row"><button class="btn" type="button" id="mt-use">Use these words</button><a class="btn alt" href="' + back + '">Cancel</a></div>' +
      '<p class="err" id="mt-err" role="alert" hidden></p>' +
      '<div class="row"><button class="btn small alt" type="button" id="mt-fill">🎲 Fill up to ' + MT_BEST + '</button><button class="btn small alt" type="button" id="mt-clear">Clear</button>' +
        '<button class="mt-link" type="button" id="mt-random">Use random words instead</button></div>' +
      '<ol class="mt-picked" id="mt-picked"></ol>' +
    '</div></aside></div>';
  const $ = s => C.view.querySelector(s), $$ = s => [...C.view.querySelectorAll(s)];
  const err = m => { const e = $('#mt-err'); e.textContent = m || ''; e.hidden = !m; };
  const key = p => p.t + '|' + p.id, has = p => picked.some(x => key(x) === key(p));
  const rows = () => {   // the words on offer, as the filters say
    const f = find.trim().toLowerCase();
    return (topic === 'all' ? topics : [topic]).flatMap(t => ALL.D[t] ? wordsAt(ALL.D[t], [1, 2, 3, 4, 5]).filter(matchOK).map(x => ({t, id: x.id, w: x.w, def: x.def, lv: x.lv})) : [])
      .filter(x => (x.lv == null || lv.includes(band(x.lv))) && (!f || x.w.toLowerCase().includes(f) || x.def.toLowerCase().includes(f)));
  };
  const drawPicked = () => {
    $('#mt-n').textContent = picked.length + ' of ' + MT_MAX + (picked.length === MT_BEST ? ' · just right' : '');
    $('#mt-picked').innerHTML = picked.length ? picked.map((p, k) => '<li><span class="st-mk">' + (k + 1) + '</span><span><b>' + esc(p.w) + '</b><span class="note">' + esc(p.def) + '</span></span>' +
      '<button type="button" class="st-x" data-k="' + k + '" aria-label="Take ' + esc(p.w) + ' out">×</button></li>').join('') : '<li class="mt-none">Tick words in the list.</li>';
    $$('#mt-picked [data-k]').forEach(b => b.onclick = () => { picked.splice(+b.dataset.k, 1); draw(); });
  };
  const drawList = () => {
    const box = $('#mt-list');
    if (!topics.every(t => ALL.D[t])) { box.innerHTML = '<p class="note">Loading the words…</p>'; return; }
    const list = rows(), full = picked.length >= MT_MAX;
    box.innerHTML = !list.length ? '<p class="note">No words match.</p>' : '<p class="note">' + plural(list.length, 'word') + '</p>' + list.map((x, k) => { const on = has(x);
      return '<label class="mt-w' + (on ? ' on' : '') + '"><input type="checkbox" data-k="' + k + '"' + (on ? ' checked' : '') + (full && !on ? ' disabled' : '') + '>' +
        '<span><b>' + esc(x.w) + '</b>' + (x.lv != null ? ' <small>' + esc(LEVEL_NAME[band(x.lv)] || '') + '</small>' : '') + '<span class="note">' + esc(x.def) + '</span></span></label>'; }).join('');
    box.querySelectorAll('input[data-k]').forEach(i => i.onchange = () => { const x = list[+i.dataset.k];
      if (i.checked && !has(x)) picked.push({t: x.t, id: x.id, w: x.w, def: x.def}); else if (!i.checked) picked = picked.filter(p => key(p) !== key(x));
      err(''); drawPicked(); sync(); });
    box._list = list;
  };
  // Ticks and greyed boxes brought up to date without drawing the list again (so it stays where it was scrolled to)
  const sync = () => { const box = $('#mt-list'), list = box._list || [], full = picked.length >= MT_MAX;
    box.querySelectorAll('input[data-k]').forEach(i => { const on = has(list[+i.dataset.k]); i.checked = on; i.disabled = full && !on; i.closest('.mt-w').classList.toggle('on', on); }); };
  const draw = () => { drawPicked(); sync(); };
  if ($('#mt-topic')) $('#mt-topic').onchange = () => { topic = $('#mt-topic').value; drawList(); };
  $('#mt-find').oninput = () => { find = $('#mt-find').value; drawList(); };
  $$('#mt-levels input').forEach(i => i.onchange = () => { lv = $$('#mt-levels input:checked').map(x => +x.value); drawList(); });
  $('#mt-clear').onclick = () => { picked = []; err(''); draw(); };
  // Fill up with random words from the list as it is filtered (never two with the same meaning)
  $('#mt-fill').onclick = () => { for (const x of shuffle(rows())) { if (picked.length >= MT_BEST) break;
      if (!has(x) && !picked.some(p => p.def === x.def || p.w.toLowerCase() === x.w.toLowerCase())) picked.push({t: x.t, id: x.id, w: x.w, def: x.def}); }
    err(''); draw(); };
  const saveTo = pick => {
    if (single) { const c = oneCfg('match'); if (pick) c.item.pick = pick; c.words = pick ? 'pick' : 'random'; saveOne('match', c); C.touch(); location.hash = back; return; }
    const c = cfgNow(), k = c.items.findIndex(it => it.k === 'match'); if (k < 0) return;
    if (pick) c.items[k].pick = pick; else delete c.items[k].pick; saveCfg(c); C.touch(); location.hash = '#/starters'; };
  $('#mt-use').onclick = () => { if (picked.length < MT_MIN) return err('Choose at least ' + MT_MIN + ' words.'); saveTo(picked); };
  $('#mt-random').onclick = () => saveTo(null);
  drawPicked();
  ensure(topics).then(drawList).catch(x => { $('#mt-list').innerHTML = '<p class="err">' + esc(x.message) + ' Check your internet connection and try again.</p>'; });
}

// ---------- One activity on its own (9 Nov 2026, teacher) ----------
// The Staff Room lists Match Up, Gap Fill, Connecting Wall and Wordsearch under Starters, each with a page of its own: the
// same activity as on Build the Board, filling the whole board, with its own topics, levels and settings, saved apart from
// Build the Board's (aeaBoard:starter → one[k]). Exit on the board comes back to the page (deal.back).
const ONE = {match: {path: 'match-up', name: 'Match Up'}, gapfill: {path: 'gap-fill', name: 'Gap Fill'},
  wall: {path: 'connecting-wall', name: 'Connecting Wall'}, wordsearch: {path: 'word-search', name: 'Wordsearch'}};
let gfFrom = 'board';   // where the Gap Fill paragraphs page was opened from: Build the Board, or the Gap Fill page ('one')
function oneCfg(k){
  const m = cfgNow(), o = (store().one || {})[k] || {};
  const c = Object.assign({title: '', topics: m.topics.slice(), levels: m.levels.slice(), secs: m.secs, words: 'random'}, clone(o));
  c.item = Object.assign({k}, k === 'wordsearch' ? {show: 'words'} : k === 'gapfill' ? {src: 'bank'} : {}, o.item ? clone(o.item) : {}, {k});
  if (k === 'gapfill' && c.item.src !== 'bank' && !gapOf(c.item.src)) c.item.src = 'bank';
  return c;
}
const saveOne = (k, c) => { const s = store(); s.one = s.one || {}; s.one[k] = clone(c); setJ(K_START, s); };
// What gets dealt: one item, with the Match Up words chosen only when the page says so
function oneDeal(c){
  const item = clone(c.item); if (item.k === 'match' && c.words !== 'pick') delete item.pick;
  return {title: c.title || ONE[item.k].name, topics: c.topics.slice(), levels: c.levels.slice(), items: [item], secs: c.secs, choices: false, clue: true};
}
const ONE_LEAD = {
  match: 'Words and meanings to pair up, on the whole board. Students write the pairs in their books; you show the answers one by one or all at once.',
  gapfill: 'A paragraph with gaps and a word bank, on the whole board: one from the bank for the topics you choose, or one of your own.',
  wall: 'Sixteen words to sort into four groups of four, on the whole board. Click four tiles that belong together to check them.',
  wordsearch: 'Topic words hidden in a square of letters, on the whole board. The size and the directions follow the hardest level you choose.'
};
function one(k){
  const o = ONE[k], c = oneCfg(k); if (k === 'gapfill') gfFrom = 'one';
  C.setTitle(o.name); C.header();
  const opt = (v, label, cur) => '<option value="' + v + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(label) + '</option>';
  const radio = (name, v, cur, html) => '<label class="choice"><input type="radio" name="' + name + '" value="' + v + '"' + (v === cur ? ' checked' : '') + '><span>' + html + '</span></label>';
  const own = {
    match: '<section class="card st-sec"><h2>The words</h2>' +
      radio('o-words', 'random', c.words === 'pick' ? '' : 'random', '<b>Random words</b><br><span class="note">Six from the topics and levels you choose: different ones each time.</span>') +
      radio('o-words', 'pick', c.words === 'pick' ? 'pick' : '', '<b>Words you choose</b> <span class="note" id="o-picked"></span><br><a href="#/starters/' + o.path + '/words" id="o-choose">Choose the words</a>') + '</section>',
    gapfill: '<section class="card st-sec"><h2>The paragraph</h2><div class="field"><label for="o-src">Which paragraph</label><select id="o-src">' +
      opt('bank', 'From the bank: a different one each time', c.item.src) + gapfills().map(g => opt(g.id, g.title || 'Untitled', c.item.src)).join('') + '</select></div>' +
      '<p class="note"><a href="#/starters/gapfill">Your own paragraphs</a>: take one from the bank or type your own, then click the words that should be gaps.</p></section>',
    wall: '<section class="card st-sec"><h2>The wall</h2><p class="note">The groups come from the topics\' Connecting Wall lists (wall.csv). Groups at the levels you choose come first; others fill the wall if needed.</p></section>',
    wordsearch: '<section class="card st-sec"><h2>The list beside the letters</h2>' +
      radio('o-show', 'words', c.item.show === 'meanings' ? '' : 'words', '<b>The words</b><br><span class="note">Students find the words they can see.</span>') +
      radio('o-show', 'meanings', c.item.show === 'meanings' ? 'meanings' : '', '<b>Their meanings</b><br><span class="note">Students work out each word from its meaning, then find it.</span>') + '</section>'
  }[k];
  C.view.innerHTML =
    '<p class="note st-lead">' + esc(ONE_LEAD[k]) + '</p>' +
    '<div class="st-build"><div class="st-main">' +
      '<section class="card st-sec"><h2>Topics</h2><div class="bg-chips" id="o-topics">' + TOPICS.filter(t => !t.only).map(t =>
        '<label class="bg-chip"><input type="checkbox" value="' + t.key + '"' + (c.topics.includes(t.key) ? ' checked' : '') + '><span>' + esc(t.name) + '</span></label>').join('') + '</div>' +
        '<h2>Levels</h2><div class="bg-chips" id="o-levels">' + LEVELS.map(([n, name]) =>
        '<label class="bg-chip"><input type="checkbox" value="' + n + '"' + (c.levels.includes(n) ? ' checked' : '') + '><span>' + name + '</span></label>').join('') + '</div></section>' +
      own +
    '</div><aside class="st-side"><div class="card st-sec st-stick">' +
      '<h2>On the board</h2><p class="st-have" id="o-have"></p>' +
      '<div class="field"><label for="o-title">Name on the board</label><input type="text" id="o-title" maxlength="60" placeholder="' + esc(o.name) + '" value="' + esc(c.title) + '"></div>' +
      '<div class="field"><label for="o-secs">Timer</label><select id="o-secs">' + TIMES.map(x => opt(x[0], x[1], c.secs)).join('') + '</select></div>' +
      '<p class="err" id="o-err" role="alert" hidden></p>' +
      '<div class="row"><button class="btn" type="button" id="o-go">Show on the board</button></div>' +
      '<p class="note" id="o-last"></p>' +
    '</div></aside></div>';
  const $ = s => C.view.querySelector(s), $$ = s => [...C.view.querySelectorAll(s)];
  const err = m => { const e = $('#o-err'); e.textContent = m || ''; e.hidden = !m; };
  const save = () => { saveOne(k, c); C.touch(); };
  const ownOnly = () => (k === 'gapfill' && c.item.src !== 'bank') || (k === 'match' && c.words === 'pick' && (c.item.pick || []).length >= MT_MIN);
  let loading = false, failed = '';
  // How much there is to choose from (the same counts as Build the Board)
  const have = () => {
    if (ownOnly()) return k === 'gapfill' ? 'Your own paragraph' : plural(c.item.pick.length, 'word') + ' you chose';
    if (!c.topics.length) return 'Choose a topic';
    if (failed) return failed;
    if (loading || !ready(c.topics)) return 'Counting…';
    const n = haveOf(k, c), need = NEED[k] || 1;
    if (k === 'wall') return n >= need ? plural(n, 'group') + ' to choose from' : n ? 'Needs 4 groups: ' + n + ' so far' : 'No groups in ' + (c.topics.length > 1 ? 'these topics' : 'this topic') + ' yet';
    if (n >= need) return k === 'gapfill' ? plural(n, 'paragraph') + ' in the bank' : n + ' words ready';
    return haveOf(k, c, [1, 2, 3, 4, 5]) >= need ? 'Not enough at these levels' : 'None in ' + (c.topics.length > 1 ? 'these topics' : 'this topic') + ' yet';
  };
  const draw = () => { $('#o-have').textContent = have();
    if (k === 'match') $('#o-picked').textContent = (c.item.pick || []).length ? '(' + plural(c.item.pick.length, 'word') + ')' : '';
    const d = dealNow(), el = $('#o-last');
    el.innerHTML = d && d.back === '#/starters/' + o.path ? '<a href="#/starters/play">Back to the last one</a> (' + esc(new Date(d.made).toLocaleString([], {weekday: 'short', hour: '2-digit', minute: '2-digit'})) + ')' : ''; };
  const load = () => { failed = '';
    if (!c.topics.length) { draw(); return; }
    loading = true; draw(); const want = c.topics.slice();
    ensure(want).then(() => { if (want.join() === c.topics.join()) { loading = false; draw(); } })
      .catch(x => { loading = false; failed = "Couldn't load the topics"; draw(); err(x.message + ' Check your internet connection and try again.'); }); };
  $$('#o-topics input').forEach(i => i.onchange = () => { c.topics = $$('#o-topics input:checked').map(x => x.value); save(); load(); });
  $$('#o-levels input').forEach(i => i.onchange = () => { c.levels = $$('#o-levels input:checked').map(x => +x.value); save(); draw(); });
  $('#o-title').oninput = () => { c.title = $('#o-title').value.trim(); save(); };
  $('#o-secs').onchange = () => { c.secs = +$('#o-secs').value; save(); };
  if (k === 'match') $$('[name=o-words]').forEach(r => r.onchange = () => { c.words = r.value; save(); draw(); });
  if (k === 'match') $('#o-choose').onclick = e => { if (!c.topics.length) { e.preventDefault(); err('Choose at least one topic first.'); } else { c.words = 'pick'; save(); } };
  if (k === 'wordsearch') $$('[name=o-show]').forEach(r => r.onchange = () => { c.item.show = r.value; save(); });
  if (k === 'gapfill') $('#o-src').onchange = () => { c.item.src = $('#o-src').value; save(); draw(); };
  $('#o-go').onclick = () => {
    err('');
    if (k === 'match' && c.words === 'pick' && (c.item.pick || []).length < MT_MIN) {
      if (!c.topics.length) return err('Choose at least one topic first.');
      location.hash = '#/starters/' + o.path + '/words'; return; }
    if (!ownOnly()) {
      if (!c.topics.length) return err('Choose at least one topic.');
      if (!c.levels.length && k !== 'wall') return err('Choose at least one level.');
    }
    const go = $('#o-go'); go.disabled = true; go.textContent = 'Getting it ready…';
    ensure(c.topics).then(() => {
      const cfg = oneDeal(c), r = dealAll(cfg);
      if (r.missing.length) { go.disabled = false; go.textContent = 'Show on the board';
        return err('Not enough for a ' + o.name + ' here. Choose more topics or levels.'); }
      const d = newDeal(cfg, r.items); d.back = '#/starters/' + o.path;
      saveDeal(d); C.touch(); location.hash = '#/starters/play';
    }).catch(x => { go.disabled = false; go.textContent = 'Show on the board'; err(x.message + ' Check your internet connection and try again.'); });
  };
  load();
}

// ---------- Gap Fill: the teacher's own paragraphs ----------
function gfPreview(text, extras){ return String(text || '').replace(/\[\[([^\]]*?)\]\]/g, '____').slice(0, 170) + (String(text || '').length > 170 ? '…' : ''); }
function gfList(){
  C.setTitle('Gap Fill paragraphs'); C.header();
  const all = gapfills();
  C.view.innerHTML = '<p style="margin:0 0 14px"><a class="backlink" href="' + (gfFrom === 'one' ? '#/starters/' + ONE.gapfill.path + '">← Gap Fill' : '#/starters">← Build the Board') + '</a></p>' +
    '<div class="spread" style="margin-bottom:14px"><p class="note">Your own Gap Fill paragraphs. Each one fills the whole board in a starter.</p><a class="btn" href="#/starters/gapfill/new">+ New Gap Fill</a></div>' +
    (all.length ? '<div class="bg-list">' + all.map(g => { const n = gapWords(g.text).length;
      return '<div class="card bg-item" data-id="' + esc(g.id) + '"><h3>' + esc(g.title || 'Untitled') + '</h3><p class="note">' + esc(gfPreview(g.text)) + '</p>' +
        '<p class="note">' + plural(n, 'gap') + ' · ' + plural((g.extras || []).length, 'extra word') + '</p>' +
        '<div class="row"><button class="btn" type="button" data-act="use">Use it in a starter</button><a class="btn small alt" href="#/starters/gapfill/' + esc(g.id) + '">Change</a>' +
        '<button class="btn small alt" type="button" data-act="copy">Copy</button><button class="btn small alt" type="button" data-act="del">Delete</button></div></div>'; }).join('') + '</div>'
      : '<div class="card narrow"><p class="note">No paragraphs yet. Take one from the bank or type your own, then click the words that should be gaps.</p><div><a class="btn" href="#/starters/gapfill/new">+ New Gap Fill</a></div></div>') +
    '<p class="note" style="margin-top:16px">Saved in this browser on this computer.</p>';
  C.view.querySelectorAll('[data-act]').forEach(b => b.onclick = () => {
    const id = b.closest('[data-id]').dataset.id, g = gapOf(id); if (!g) return; C.touch();
    if (b.dataset.act === 'use') useInStarter(id);
    else if (b.dataset.act === 'copy') { const c = Object.assign(clone(g), {id: uid(), title: (g.title || 'Untitled') + ' (copy)', created: Date.now()}); saveGapfill(c); location.hash = '#/starters/gapfill/' + c.id; }
    else if (b.dataset.act === 'del') { if (confirm('Delete "' + (g.title || 'Untitled') + '"?')) { setJ(K_GAPS, gapfills().filter(x => x.id !== id)); gfList(); } }
  });
}
// A Gap Fill fills the whole board, so it replaces whatever the starter had on it
function useInStarter(id){
  if (gfFrom === 'one') { const c = oneCfg('gapfill'); c.item.src = id; saveOne('gapfill', c); location.hash = '#/starters/' + ONE.gapfill.path; return; }
  const cfg = cfgNow();
  if (cfg.items.length && !(cfg.items.length === 1 && cfg.items[0].k === 'gapfill') && !confirm('A Gap Fill takes the whole board, so it replaces what is on the starter board now. Carry on?')) return;
  cfg.items = [{k: 'gapfill', src: id}]; saveCfg(cfg); location.hash = '#/starters';
}
// The paragraph as pieces: words (w) the teacher can click, gaps (g), and everything in between (x)
const WORD_RE = /[A-Za-z0-9À-ÖØ-öø-ÿ]+(?:['’\-][A-Za-z0-9À-ÖØ-öø-ÿ]+)*/g;
function toSegs(text){
  const out = [];
  String(text || '').split(/\[\[([^\]]*?)\]\]/).forEach((s, i) => {
    if (i % 2) { const w = s.split('|')[0].trim(); if (w) out.push({t: 'g', s: w}); return; }
    let last = 0; s.replace(WORD_RE, (m, at) => { if (at > last) out.push({t: 'x', s: s.slice(last, at)}); out.push({t: 'w', s: m}); last = at + m.length; return m; });
    if (last < s.length) out.push({t: 'x', s: s.slice(last)});
  });
  return out;
}
const fromSegs = segs => segs.map(x => x.t === 'g' ? '[[' + x.s + ']]' : x.s).join('');
function gfEdit(id){
  const old = id ? gapOf(id) : null;
  if (id && !old) { location.hash = '#/starters/gapfill'; return; }
  const g = old ? clone(old) : {id: null, title: '', text: '', extras: [], topic: ''};
  C.setTitle(old ? 'Change: ' + (g.title || 'Gap Fill') : 'New Gap Fill'); C.header();
  let segs = g.text ? toSegs(g.text) : null, mode = segs ? 'gaps' : 'bank', bank = {topic: g.topic || '', levels: [1, 2, 3, 4, 5], find: ''}, sugg = [];
  C.view.innerHTML = '<p style="margin:0 0 14px"><a class="backlink" href="#/starters/gapfill">← Gap Fill paragraphs</a></p>' +
    '<div class="card bg-form gf-form">' +
      '<div class="field"><label for="gf-title">Name</label><input type="text" id="gf-title" maxlength="80" placeholder="e.g. A perfume advert" value="' + esc(g.title) + '"></div>' +
      '<section id="gf-text"></section><section id="gf-extras"></section><section id="gf-prev"></section>' +
      '<p class="err" id="gf-err" role="alert" hidden></p>' +
      '<div class="row bg-saveline"><button class="btn" type="button" id="gf-use">Save and use it in a starter</button><button class="btn alt" type="button" id="gf-save">Save</button><a class="btn alt" href="#/starters/gapfill">Cancel</a></div>' +
    '</div>';
  const $ = s => C.view.querySelector(s), $$ = s => [...C.view.querySelectorAll(s)];
  const err = m => { const e = $('#gf-err'); e.textContent = m || ''; e.hidden = !m; if (m) e.scrollIntoView({block: 'center', behavior: 'smooth'}); };
  const nGaps = () => (segs || []).filter(x => x.t === 'g').length;
  const tabs = () => '<div class="gf-tabs" role="tablist"><button type="button" role="tab" data-mode="bank" aria-selected="' + (mode === 'bank') + '">Choose one from the bank</button>' +
    '<button type="button" role="tab" data-mode="type" aria-selected="' + (mode === 'type') + '">Type or paste your own</button></div>';
  const drawText = () => {
    const box = $('#gf-text');
    if (mode === 'gaps' && segs) {
      let n = 0;
      box.innerHTML = '<div class="spread"><h2>Choose the gaps</h2><span class="note" id="gf-n">' + plural(nGaps(), 'gap') + '</span></div>' +
        '<p class="note">Click a word to make it a gap, and click a gap to put the word back. To make a gap of two or more words, hold <kbd>Shift</kbd> and click the word next to a gap.</p>' +
        '<p class="gf-para">' + segs.map((x, i) => x.t === 'w' ? '<button type="button" class="gf-w" data-i="' + i + '">' + esc(x.s) + '</button>'
          : x.t === 'g' ? '<button type="button" class="gf-w gap" data-i="' + i + '"><i>' + (++n) + '</i>' + esc(x.s) + '</button>' : esc(x.s)).join('') + '</p>' +
        '<div class="row"><button class="btn small alt" type="button" id="gf-edit">Change the text</button><button class="btn small alt" type="button" id="gf-none">Take out every gap</button><button class="btn small alt" type="button" id="gf-other">Choose a different paragraph</button></div>';
      $$('.gf-w').forEach(b => b.onclick = e => clickWord(+b.dataset.i, e.shiftKey));
      $('#gf-edit').onclick = () => { mode = 'type'; drawText(); const t = $('#gf-type'); if (t) t.focus(); };
      $('#gf-none').onclick = () => { segs = toSegs(fromSegs(segs).replace(/\[\[([^\]]*?)\]\]/g, '$1')); drawAll(); };
      $('#gf-other').onclick = () => { mode = 'bank'; drawText(); };
      return;
    }
    if (mode === 'type') {
      box.innerHTML = '<h2>The paragraph</h2>' + tabs() +
        '<div class="field"><label for="gf-type">Your paragraph</label><textarea id="gf-type" placeholder="Type or paste a paragraph here.">' + esc(segs ? fromSegs(segs) : '') + '</textarea>' +
        '<span class="note">Words in [[double brackets]] are gaps. You can also choose the gaps on the next step by clicking them.</span></div>' +
        '<div class="row"><button class="btn" type="button" id="gf-next">Next: choose the gaps</button></div>';
      $('#gf-next').onclick = () => { const t = $('#gf-type').value.trim(); if (!t) return err('Type or paste a paragraph first.'); err(''); segs = toSegs(t); mode = 'gaps'; drawAll(); };
    } else {
      const topics = TOPICS.filter(t => !t.only);
      if (!bank.topic) bank.topic = (cfgNow().topics.find(t => topics.some(x => x.key === t))) || topics[0].key;
      box.innerHTML = '<h2>The paragraph</h2>' + tabs() +
        '<div class="gf-bankbar"><div class="field"><label for="gf-topic">Topic</label><select id="gf-topic">' + topics.map(t => '<option value="' + t.key + '"' + (t.key === bank.topic ? ' selected' : '') + '>' + esc(t.name) + '</option>').join('') + '</select></div>' +
          '<div class="field"><label for="gf-find">Search</label><input type="text" id="gf-find" placeholder="A word in the title or the text" value="' + esc(bank.find) + '"></div></div>' +
        '<div class="bg-chips" id="gf-levels">' + LEVELS.map(([n, name]) => '<label class="bg-chip"><input type="checkbox" value="' + n + '"' + (bank.levels.includes(n) ? ' checked' : '') + '><span>' + name + '</span></label>').join('') + '</div>' +
        '<div id="gf-results" class="gf-results"><p class="note">Loading the paragraphs…</p></div>';
      $('#gf-topic').onchange = () => { bank.topic = $('#gf-topic').value; drawResults(); };
      $('#gf-find').oninput = () => { bank.find = $('#gf-find').value; drawResults(); };
      $$('#gf-levels input').forEach(i => i.onchange = () => { bank.levels = $$('#gf-levels input:checked').map(x => +x.value); drawResults(); });
      drawResults();
    }
    $$('.gf-tabs [data-mode]').forEach(b => b.onclick = () => { mode = b.dataset.mode; drawText(); });
  };
  const drawResults = () => {
    const box = $('#gf-results'), key = bank.topic;
    loadExtra(key).then(X => {
      if (!box.isConnected || bank.topic !== key) return;
      const f = bank.find.trim().toLowerCase();
      const rows = X.reads.filter(r => (r.lv == null || bank.levels.includes(band(r.lv))) && (!f || (r.title + ' ' + r.text).toLowerCase().includes(f)));
      box.innerHTML = !X.reads.length ? '<p class="note">' + esc(topicName(key)) + ' has no paragraphs in the bank yet (reads.csv).</p>'
        : !rows.length ? '<p class="note">No paragraphs match.</p>'
        : '<p class="note">' + plural(rows.length, 'paragraph') + (rows.length > 40 ? ': the first 40' : '') + '. The words underlined are its gaps; you can change them on the next step.</p>' +
          rows.slice(0, 40).map(r => '<div class="gf-res"><div><b>' + esc(r.title || 'Untitled') + '</b> <span class="note">' + (r.lv != null ? LEVEL_NAME[band(r.lv)] : '') + '</span>' +
            '<p>' + esc(r.text).replace(/\[\[([^\]]*?)\]\]/g, '<u>$1</u>') + '</p></div><button class="btn small" type="button" data-id="' + esc(r.id) + '">Use this</button></div>').join('');
      box.querySelectorAll('[data-id]').forEach(b => b.onclick = () => { const r = X.reads.find(x => x.id === b.dataset.id); if (!r) return;
        segs = toSegs(r.text); g.extras = r.extras.slice(); g.topic = key; if (!$('#gf-title').value.trim()) $('#gf-title').value = r.title; mode = 'gaps'; err(''); drawAll();
        $('#gf-text').scrollIntoView({block: 'start', behavior: 'smooth'}); });
    }).catch(() => { box.innerHTML = '<p class="err">Couldn\'t load the paragraphs. Check your internet connection.</p>'; });
  };
  const clickWord = (i, shift) => {
    const x = segs[i]; if (!x) return;
    if (x.t === 'g') { segs.splice(i, 1, ...toSegs(x.s)); return drawAll(); }
    if (shift) {   // join with the gap beside it (only spaces between)
      const side = d => { let j = i + d; while (segs[j] && segs[j].t === 'x' && /^\s+$/.test(segs[j].s)) j += d; return segs[j] && segs[j].t === 'g' ? j : -1; };
      const l = side(-1), r = side(1), j = l >= 0 ? l : r;
      if (j >= 0) { const a = Math.min(i, j), b = Math.max(i, j); const s = segs.slice(a, b + 1).map(y => y.s).join(''); segs.splice(a, b - a + 1, {t: 'g', s}); return drawAll(); }
    }
    segs[i] = {t: 'g', s: x.s}; drawAll();
  };
  // Extra words: they go into the word bank but fit no gap
  const drawExtras = () => {
    const box = $('#gf-extras');
    if (!segs) { box.innerHTML = ''; return; }
    const topics = TOPICS.filter(t => !t.only);
    if (!g.topic) g.topic = (cfgNow().topics.find(t => topics.some(x => x.key === t))) || topics[0].key;
    box.innerHTML = '<h2>Extra words for the word bank</h2><p class="note">Words that fit no gap, so the last gap isn\'t a giveaway. Two or three is usually enough.</p>' +
      '<div class="gf-chips">' + (g.extras || []).map((w, k) => '<span class="gf-chip">' + esc(w) + '<button type="button" data-k="' + k + '" aria-label="Take out ' + esc(w) + '">×</button></span>').join('') +
        '<span class="gf-add"><input type="text" id="gf-word" maxlength="40" placeholder="Type a word"><button class="btn small" type="button" id="gf-addb">Add</button></span></div>' +
      '<div class="gf-sugg"><span class="note">Suggestions from</span><select class="small" id="gf-stopic">' + topics.map(t => '<option value="' + t.key + '"' + (t.key === g.topic ? ' selected' : '') + '>' + esc(t.name) + '</option>').join('') + '</select>' +
        '<span id="gf-slist" class="gf-chips"></span><button class="btn small alt" type="button" id="gf-more">🎲 Others</button></div>';
    box.querySelectorAll('.gf-chip button').forEach(b => b.onclick = () => { g.extras.splice(+b.dataset.k, 1); drawExtras(); drawPrev(); });
    const add = w => { w = String(w || '').trim(); if (!w) return; if ((g.extras || []).some(x => x.toLowerCase() === w.toLowerCase())) return;
      if (segs.some(x => x.t === 'g' && x.s.toLowerCase() === w.toLowerCase())) return err('"' + w + '" is already one of the gaps.');
      err(''); g.extras = (g.extras || []).concat(w); sugg = sugg.filter(x => x.toLowerCase() !== w.toLowerCase()); drawExtras(); drawPrev(); const i = $('#gf-word'); if (i) i.focus(); };
    $('#gf-addb').onclick = () => add($('#gf-word').value);
    $('#gf-word').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); add($('#gf-word').value); } };
    $('#gf-stopic').onchange = () => { g.topic = $('#gf-stopic').value; sugg = []; drawSugg(add); };
    $('#gf-more').onclick = () => { sugg = []; drawSugg(add); };
    drawSugg(add);
  };
  // Suggestions: words from the topic, the same kind of word as the gaps (noun, verb…) where the word list says
  const drawSugg = add => {
    const box = $('#gf-slist'), key = g.topic; if (!box) return;
    if (sugg.length) return paint();
    box.innerHTML = '<span class="note">…</span>';
    dataFor([key]).then(D => { if (g.topic !== key || !segs) return; const T = D[key]; if (!T) return;
      const gw = segs.filter(x => x.t === 'g').map(x => x.s.toLowerCase()), have = new Set(gw.concat((g.extras || []).map(x => x.toLowerCase())));
      const stem = w => w.replace(/(ing|ed|es|s)$/, '');
      const pos = new Set(T.words.filter(w => gw.some(x => x === w.w.toLowerCase() || stem(x) === stem(w.w.toLowerCase()))).map(w => w.pos).filter(Boolean));
      const pool = shuffle(T.words.filter(w => w.on && !have.has(w.w.toLowerCase()) && w.w.split(/\s+/).length <= 2));
      sugg = pool.filter(w => !pos.size || pos.has(w.pos)).concat(pool.filter(w => pos.size && !pos.has(w.pos))).slice(0, 8).map(w => w.w);
      paint(); }).catch(() => { box.innerHTML = ''; });
    function paint(){ box.innerHTML = sugg.map(w => '<button type="button" class="gf-s">+ ' + esc(w) + '</button>').join('');
      box.querySelectorAll('.gf-s').forEach((b, k) => b.onclick = () => add(sugg[k])); }
  };
  // How it will look on the board
  const drawPrev = () => {
    const box = $('#gf-prev'); if (!segs) { box.innerHTML = ''; return; }
    const text = fromSegs(segs), gp = gfParts(text), bankW = gp.filter(p => p.t === 'g').map(p => p.s).concat(g.extras || []).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    box.innerHTML = '<h2>On the board</h2><div class="gf-prevbox">' + (($('#gf-title').value.trim()) ? '<p class="st-sub">' + esc($('#gf-title').value.trim()) + '</p>' : '') +
      '<p class="st-para">' + gp.map(p => p.t === 's' ? esc(p.s) : '<span class="st-gb"><i>' + p.n + '</i><span>' + esc(p.s) + '</span></span>').join('') + '</p>' +
      (bankW.length ? '<div class="st-bank"><span class="st-bl">Word bank</span>' + bankW.map(w => '<span class="st-bw">' + esc(w) + '</span>').join('') + '</div>' : '') + '</div>';
  };
  const drawAll = () => { drawText(); drawExtras(); drawPrev(); const n = $('#gf-n'); if (n) n.textContent = plural(nGaps(), 'gap'); };
  $('#gf-title').oninput = () => drawPrev();
  const doSave = () => {
    err('');
    if (mode === 'type') { const t = $('#gf-type').value.trim(); if (t) segs = toSegs(t); }
    if (!segs || !fromSegs(segs).trim()) { err('Choose a paragraph from the bank, or type your own.'); return null; }
    if (!nGaps()) { err('Click at least one word to make it a gap.'); return null; }
    const text = fromSegs(segs).trim();
    const out = Object.assign(g, {id: g.id || uid(), title: $('#gf-title').value.trim() || text.replace(/\[\[|\]\]/g, '').split(/\s+/).slice(0, 6).join(' ') + '…', text, created: g.created || Date.now()});
    saveGapfill(out); C.touch(); return out;
  };
  $('#gf-save').onclick = () => { if (doSave()) location.hash = '#/starters/gapfill'; };
  $('#gf-use').onclick = () => { const s = doSave(); if (s) useInStarter(s.id); };
  drawAll();
}
})();
