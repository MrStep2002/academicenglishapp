/* Starters (7 Nov 2026, teacher): a few minutes of work on the projector at the start of a lesson. Students write their
   answers in their books; each answer stays hidden until the teacher shows it.
   Lives on the teacher page (teacher/index.html calls AEA_START.route for every address that starts #/starters):
     #/starters                  choose the topics, the levels and what goes on the board (six squares of room)
     #/starters/play             the starter on the board (the last one dealt; carried on after a reload)
     #/starters/gapfill          the teacher's own Gap Fill paragraphs
     #/starters/gapfill/new      make one: a paragraph from the bank (content/<topic>/reads.csv) or typed in, click words to make gaps
     #/starters/gapfill/<id>     change one
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
  {k: 'rw',       size: 'small', bank: 'rw',       name: 'SPAG: Right or Wrong',  blurb: 'Is the sentence right? If not, they correct it.'},
  {k: 'word',     size: 'small', bank: 'word',     name: 'What does it mean?',    blurb: 'A word: they write its meaning.'},
  {k: 'meaning',  size: 'small', bank: 'meaning',  name: 'Which word?',           blurb: 'A meaning: they write the word.'},
  {k: 'zh',       size: 'small', bank: 'zh',       name: '中文 → English',         blurb: 'A word in Chinese: they write it in English.'},
  {k: 'tf',       size: 'small', bank: 'tf',       name: 'True or false',         blurb: 'A statement: true or false?'},
  {k: 'anagram',  size: 'small', words: true,      name: 'Anagram',               blurb: 'A topic word with its letters mixed up.'},
  {k: 'vowels',   size: 'small', words: true,      name: 'Missing vowels',        blurb: 'A topic word with its vowels taken out.'},
  {k: 'question', size: 'small', bank: 'question', name: 'Answer the question',   blurb: 'An exam question and four answers to choose from.'},
  {k: 'gk',       size: 'small', bank: 'gk',       name: 'General knowledge',     blurb: 'A quiz question.'},
  {k: 'errors',   size: 'wide',                    name: 'Spot the error',        blurb: 'A short paragraph with mistakes to find and correct.'},
  {k: 'match',    size: 'full',  words: true,      name: 'Match-up',              blurb: 'Six words and six meanings to pair up.'},
  {k: 'wall',     size: 'full',                    name: 'Connecting Wall',       blurb: 'Sixteen words to sort into four groups of four.'},
  {k: 'gapfill',  size: 'full',                    name: 'Gap Fill',              blurb: 'A paragraph with gaps and a word bank: from the bank, or one of your own.'}
];
const ACT = Object.fromEntries(ACTS.map(a => [a.k, a]));
const NEED = {match: 6, wall: 4};
const GROUPS = [['small', 'One square each'], ['wide', 'Half the board'], ['full', 'The whole board']];
const DEFAULTS = {title: '', topics: [], levels: [1, 2, 3, 4, 5], items: [], secs: 300, choices: false, clue: true};
const PAIR = ['#c8344a', '#1f63c4', '#13804f', '#7343c9', '#b35300', '#b4286a'];   // Match-up pairs (white text reads on all of them)
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
const wordsAt = (D, lv) => eligible(D, 'word', lv);   // the topic page's word list at these levels, without words taken out through Reports
const errorsAt = (X, t, lv) => (X.errors || []).filter(r => (r.lv == null || lv.includes(band(r.lv))) && !B.hidden(t, 'error', r.id));
const readsAt = (X, t, lv) => (X.reads || []).filter(r => (r.lv == null || lv.includes(band(r.lv))) && !B.hidden(t, 'read', r.id));
function haveOf(k, cfg, lv){
  lv = lv || cfg.levels;
  const T = cfg.topics.filter(t => ALL.D[t] && ALL.X[t]), a = ACT[k];
  if (a.bank) return T.reduce((n, t) => n + eligible(ALL.D[t], a.bank, lv).length, 0);
  if (a.words) return T.reduce((n, t) => n + wordsAt(ALL.D[t], lv).filter(k === 'anagram' ? anagramOK : k === 'vowels' ? vowelsOK : matchOK).length, 0);
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
  const small = [], wide = [];
  size.forEach((s, i) => (s === 'small' ? small : wide).push(i));
  const split = {0: [], 1: [1], 2: [2], 3: [3], 4: [2, 2], 5: [3, 2], 6: [3, 3]}[Math.min(6, small.length)];
  const smallRows = []; let k = 0; split.forEach(n => { smallRows.push(small.slice(k, k + n)); k += n; });
  const wideFirst = wide.length && (!small.length || wide[0] < small[0]);
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
      if (chosen.some(g => low(g.name) === low(c.r.name))) continue;
      const taken = new Set(chosen.flatMap(g => g.all.map(low)));
      const free = c.r.words.filter(w => !taken.has(low(w)) && !chosen.some(g => g.all.map(low).includes(low(w))));
      const mine = new Set(c.r.words.map(low));
      if (chosen.some(g => g.words.some(w => mine.has(low(w))))) continue;   // one of the words already on the wall belongs here too
      if (free.length < 4) continue;
      chosen.push({name: c.r.name, words: shuffle(free).slice(0, 4), all: c.r.words});
      if (chosen.length === 4) break;
    }
    if (chosen.length < 4) return null;
    return {k: 'wall', groups: chosen.map(g => ({name: g.name, words: g.words})), order: shuffle([...Array(16).keys()])};
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
    return {k: 'gapfill', title, parts: gp, bank: gw.concat(extras).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())), extra: extras.length};
  }
  return null;
}
function gfParts(text){
  const out = []; let n = 0;
  String(text || '').split(/\[\[([^\]]*?)\]\]/).forEach((s, i) => { if (i % 2) { const w = s.split('|')[0].trim(); if (w) out.push({t: 'g', s: w, n: ++n}); } else if (s) out.push({t: 's', s}); });
  return out;
}
function dealAll(cfg){
  const used = new Set(), items = [], missing = [];
  cfg.items.forEach(it => { const x = dealOne(it, cfg, used, items); if (x) items.push(x); else missing.push(ACT[it.k].name); });
  return {items, missing};
}
const newDeal = (cfg, items) => ({v: 1, made: Date.now(), cfg: clone(cfg), items, state: {shown: {}, sub: {}, solved: {}, order: {}}});

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
    return build();
  },
  stop
};

// ---------- the Starters page: choose what goes on the board ----------
function build(){
  C.setTitle('Starters'); C.header();
  const cfg = cfgNow();
  cfg.items.forEach(it => { if (it.k === 'gapfill' && it.src && it.src !== 'bank' && !gapOf(it.src)) it.src = 'bank'; });
  const opt = (v, label, cur) => '<option value="' + v + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(label) + '</option>';
  C.view.innerHTML =
    '<p style="margin:0 0 14px"><a class="backlink" href="#/">← All classes</a></p>' +
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
      '<h2>The board</h2><div class="st-mini" id="s-mini"></div>' +
      '<div class="field"><label for="s-title">Name on the board</label><input type="text" id="s-title" maxlength="60" placeholder="Starter" value="' + esc(cfg.title) + '"></div>' +
      '<div class="field"><label for="s-secs">Timer</label><select id="s-secs">' + TIMES.map(x => opt(x[0], x[1], cfg.secs)).join('') + '</select></div>' +
      '<label class="choice"><input type="checkbox" id="s-choices"' + (cfg.choices ? ' checked' : '') + '><span><b>Show answer choices (A–D)</b><br>' +
        '<span class="note">Off: students write the answer from memory. Answer the question always shows its four answers.</span></span></label>' +
      '<label class="choice"><input type="checkbox" id="s-clue"' + (cfg.clue ? ' checked' : '') + '><span><b>Clues</b><br><span class="note">The meaning under each Anagram and Missing vowels.</span></span></label>' +
      '<p class="err" id="s-err" role="alert" hidden></p>' +
      '<div class="row"><button class="btn" type="button" id="s-go">Show on the board</button><button class="btn alt" type="button" id="s-clear">Clear the board</button></div>' +
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
      cfg.items.push(it); err(''); save(); drawAll();
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
        '<button type="button" class="st-x" data-x="' + c.i + '" title="Take it off the board" aria-label="Take ' + esc(a.name) + ' off the board">×</button></div>'; }).join('');
    box.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { cfg.items.splice(+b.dataset.x, 1); err(''); save(); drawAll(); });
    box.querySelectorAll('[data-src]').forEach(s => { s.value = cfg.items[+s.dataset.src].src || 'bank'; s.onchange = () => { cfg.items[+s.dataset.src].src = s.value; save(); }; });
  };
  const drawAll = () => { drawActs(); drawMini(); };
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
    const needTopics = cfg.items.some(it => !(it.k === 'gapfill' && it.src && it.src !== 'bank'));
    if (needTopics && !cfg.topics.length) return err('Choose at least one topic.');
    if (needTopics && !cfg.levels.length && !cfg.items.every(it => it.k === 'gk' || it.k === 'wall' || (it.k === 'gapfill' && it.src !== 'bank'))) return err('Choose at least one level.');
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
    '<p class="bg-keys">' + (one ? (d.items[0].k === 'wall' ? 'Click four tiles that belong together' : 'Click a ' + (d.items[0].k === 'match' ? 'word' : 'gap') + ', or type its number, to show its answer') + ' · <kbd>A</kbd> show all the answers'
      : 'Click a square, or type its number, to show its answer · <kbd>A</kbd> show all the answers') + (S.secs ? ' · <kbd>Space</kbd> start or pause the timer' : '') + '</p>';
  document.body.appendChild(el);
  S.board = el.querySelector('.st-board');
  [...S.board.children].forEach(p => drawPanel(+p.dataset.i, true));
  el.querySelector('[data-t=all]').onclick = e => { e.currentTarget.blur(); allToggle(); };
  el.querySelector('[data-t=new]').onclick = e => { e.currentTarget.blur(); redeal(); };
  el.querySelector('[data-t=sound]').onclick = e => { e.currentTarget.blur(); S.sound = !S.sound; setJ(K_SOUND, S.sound); tools(); if (S.sound) chime('right'); };
  el.querySelector('[data-t=full]').onclick = e => { e.currentTarget.blur(); const doc = document;
    if (doc.fullscreenElement) doc.exitFullscreen().catch(() => {}); else if (doc.documentElement.requestFullscreen) doc.documentElement.requestFullscreen().catch(() => {}); };
  el.querySelector('[data-t=exit]').onclick = () => { location.hash = '#/starters'; };
  if (S.secs) { el.querySelector('.st-time').onclick = e => { e.currentTarget.blur(); clockToggle(); };
    el.querySelector('.st-go').onclick = e => { e.currentTarget.blur(); clockToggle(); };
    el.querySelector('.st-reset').onclick = e => { e.currentTarget.blur(); clockReset(); }; }
  S.board.addEventListener('click', onBoardClick);
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
  S.el.querySelector('[data-t=all]').innerHTML = (allShown() ? 'Hide the answers' : 'Show all the answers') + ' <kbd>A</kbd>';
}
function redeal(){
  const d = S.d, b = S.el.querySelector('[data-t=new]');
  b.disabled = true; b.textContent = 'Dealing…';
  ensure(d.cfg.topics).then(() => {
    const r = dealAll(d.cfg);
    if (!r.items.length) { b.disabled = false; b.textContent = '🎲 New questions'; return; }
    const nd = newDeal(d.cfg, r.items); saveDeal(nd); if (S && S.d === d) mount(nd);
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
const subCount = it => it.k === 'match' ? 6 : it.k === 'gapfill' ? it.parts.filter(p => p.t === 'g').length : it.k === 'wall' ? 4 : 0;
function isShown(i){ const it = S.d.items[i];
  if (it.k === 'wall') return (S.st.solved[i] || []).length === 4;
  if (ACT[it.k].size === 'full') return (S.st.sub[i] || []).length === subCount(it);
  return !!S.st.shown[i]; }
const allShown = () => S.d.items.every((_, i) => isShown(i));
function setShown(i, on){
  const it = S.d.items[i];
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
function allToggle(){ const on = !allShown(); S.d.items.forEach((_, i) => setShown(i, on)); save(); S.d.items.forEach((_, i) => drawPanel(i)); tools(); }
function onBoardClick(e){
  const p = e.target.closest('.st-panel'); if (!p || !S) return;
  const i = +p.dataset.i, it = S.d.items[i];
  if (e.target.closest('.st-eye')) return toggle(i);
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
    case 'rw': return instr('Right or wrong? If it’s wrong, write it correctly.') + '<p class="st-t">' + esc(q.s) + '</p>' +
      ans(q.a === 0 ? '<b class="st-ok">✓ Right</b>' : '<b class="st-no">✗ Wrong.</b> ' + (q.fix ? '<span class="st-fix">' + esc(q.fix) + '</span>' : '<span class="st-why">' + rich(q.why) + '</span>'));
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
      '<span class="st-mto">' + 'ABCDEF'[it.order.indexOf(n)] + '</span></li>').join('') + '</ol>' +
    '<svg class="st-lines" aria-hidden="true"></svg>' +
    '<ol class="st-mr">' + it.order.map((n, r) => '<li data-sub="' + n + '" class="' + (on(n) ? 'on' : '') + '" style="--pc:' + PAIR[n] + '"><span class="st-mk">' + 'ABCDEF'[r] + '</span><span class="st-md">' + esc(it.pairs[n].def) + '</span></li>').join('') + '</ol></div>';
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
function drawPanel(i, first){
  const p = S.board.querySelector('.st-panel[data-i="' + i + '"]'); if (!p) return;
  const it = S.d.items[i], a = ACT[it.k], on = isShown(i), sub = S.st.sub[i] || [];
  const many = S.L.cells.length > 1, label = it.k === 'wall' ? (on ? 'Start again' : 'Solve the wall') : on ? 'Hide the answer' + (a.size === 'full' ? 's' : '') : 'Show the answer' + (a.size === 'full' ? 's' : '');
  p.classList.toggle('shown', on);
  p.innerHTML = '<div class="st-ph">' + (many ? '<span class="st-n">' + p.dataset.n + '</span>' : '') + '<span class="st-k">' + esc(a.name) + '</span>' +
    '<button type="button" class="st-eye" title="' + label + (many ? ' (' + p.dataset.n + ')' : '') + '">' + label + '</button></div>' +
    '<div class="st-body"><div class="st-in' + (it.k === 'wall' ? ' fill' : '') + (on ? ' on' : '') + '">' +
      (a.size === 'small' ? smallHTML(it, on) : it.k === 'errors' ? errorsHTML(it) : it.k === 'match' ? matchHTML(it, sub) : it.k === 'gapfill' ? gapfillHTML(it, sub) : wallHTML(i, it)) +
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
  const big = p.classList.contains('small') ? 64 : 52;
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
// ---------- Gap Fill: the teacher's own paragraphs ----------
function gfPreview(text, extras){ return String(text || '').replace(/\[\[([^\]]*?)\]\]/g, '____').slice(0, 170) + (String(text || '').length > 170 ? '…' : ''); }
function gfList(){
  C.setTitle('Gap Fill paragraphs'); C.header();
  const all = gapfills();
  C.view.innerHTML = '<p style="margin:0 0 14px"><a class="backlink" href="#/starters">← Starters</a></p>' +
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
