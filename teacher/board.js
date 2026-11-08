/* Board games (6 Nov 2026, teacher): a Baamboozle-style board for the whole class, on one screen on the projector.
   Lives on the teacher page (teacher/index.html calls AEA_BOARD.route for every address that starts #/board):
     #/board              the teacher's boards (saved in this browser)
     #/board/new          make a board: topics, question types, levels, squares, time, teams, points, surprises
     #/board/<id>         change a board
     #/board/play/<id>    play it: the board fills the window; a square flips, then its question zooms out to fill the board
   Questions come straight from the content CSV files (content/<topic>/…), so new rows are on the boards as soon as they are pushed.
   Only the files that make one-screen questions are used (BANKS); the reading games and Spot the error are left out.
   Saved under "aeaBoard:…", not "aea:…": "aea:" keys are copied to a student's account when a student logs in on the same
   computer, and cleared when they log out. */
(function(){
'use strict';
const ROOT = '../';   // this page is teacher/index.html
const K_SETS = 'aeaBoard:sets', K_GAMES = 'aeaBoard:games', K_SOUND = 'aeaBoard:sound';

// ---------- what can be tested ----------
// list: the words a topic page uses (Representation's page plays only its "key" list; data-list in en/representation/index.html)
const TOPICS = [
  {key:'essentials', name:'Academic English Essentials'},
  {key:'descriptive', name:'Descriptive language'},
  // characters: Don't Say It! and Hints also play the topic's characters.csv (name, taboo1-4, hint1-4), 8 Nov 2026
  {key:'mockingbird', name:'To Kill a Mockingbird', characters:true},
  {key:'representation', name:'Representation', list:'key'},
  {key:'media-descriptors', name:'Media Descriptors'},
  {key:'web-design', name:'Web design'},
  {key:'advertising', name:'Advertising'},
  {key:'chemistry', name:'Chemistry'},
  {key:'physics', name:'Physics'},
  {key:'general', name:'Must-know general knowledge', only:['gk']}
];
// hid: the game keys a reported question can be hidden under (Reports on the teacher page; /api/hidden)
const BANKS = [
  {key:'word',     name:'What does it mean?',   blurb:'A word: choose its meaning.',                 file:'words', hid:['meaning','match']},
  {key:'meaning',  name:'Which word?',          blurb:'A meaning: choose the word.',                 file:'words', hid:['meaning','match']},
  {key:'zh',       name:'中文 → English',        blurb:'A word in Chinese: choose the English word.', file:'words', hid:['zh','zhmean','zhmatch']},
  {key:'gap',      name:'Fill the gap',         blurb:'Choose the word that fits the sentence.',     file:'gaps', hid:['gap']},
  {key:'tf',       name:'True or false',        blurb:'Two answers, so quick but guessable.',        file:'tf', hid:['tf']},
  {key:'rw',       name:'Grammar Check', blurb:'Good grammar or bad grammar?',           file:'right-wrong', hid:['rw']},
  {key:'question', name:'Answer the question',  blurb:'Exam questions: which answer does what the command word asks?', file:'questions', hid:['question']},
  {key:'gk',       name:'General knowledge',    blurb:'Pub-quiz questions. No levels: they play at any level.', file:'knowledge', hid:['gk','must']}
];
const LEVELS = [[1,'Foundation'],[2,'Foundation+'],[3,'Intermediate'],[4,'Intermediate+'],[5,'Advanced']];
const LEVEL_NAME = Object.fromEntries(LEVELS);
// Team colours: white text reads on all of them
const COLOURS = ['#c8344a', '#1f63c4', '#13804f', '#7343c9', '#b35300', '#b4286a', '#0b7a7a', '#4f5578'];
// q: the team has to answer a question right to win the surprise (6 Nov 2026, teacher: "they still need to answer a question to qualify")
const SURPRISES = {
  bonus:  {icon:'🎁', name:'Bonus!',  q:true, blurb:'Answer a question right to win extra points.'},
  double: {icon:'⚡', name:'Double!', q:true, blurb:'A question worth double points.'},
  steal:  {icon:'🦝', name:'Steal!',  q:true, blurb:'Answer a question right, then take points from another team.'},
  give:   {icon:'💝', name:'Gift!',   q:true, blurb:'Answer a question right, then give points to another team.'},
  swap:   {icon:'🔄', name:'Swap!',   q:true, blurb:'Answer a question right, then swap scores with another team (or keep yours).'},
  oops:   {icon:'💥', name:'Oops!',   blurb:'The team loses points. No question.'}
};
const needsQ = k => !!(SURPRISES[k] && SURPRISES[k].q);
// The games (6 Nov 2026): Squaring Up (the tile board, named by the teacher), Don't Say It! (Taboo-style) and Hints, both from content/<topic>/taboo.csv
const GAME_TYPES = {
  squares: {name: 'Squaring Up', blurb: 'Teams take turns to open a numbered square and answer the question under it, with surprises along the way.'},
  taboo: {name: "Don't Say It!", blurb: 'One player guesses while their team describes the word without saying any of the red words. Each team plays once a round: 60, then 30, then 15 seconds.'},
  hints: {name: 'Hints', blurb: 'Teams guess the word from its hints, shown one at a time: 4 points on the first hint, then 3, 2 and 1. A minute a turn. A word the team can\'t get goes to the wheel, which picks another team to answer.'},
  cats: {name: 'Categories', blurb: 'A board of categories, like Jeopardy: questions worth 100 to 500 that get harder down each column, Daily Doubles to bet on, and a final question every team bets on.'}
};
const gameType = s => { const k = s && (s.game || s.kind); return k === 'taboo' || k === 'hints' || k === 'cats' ? k : 'squares'; };
const wordGame = k => k === 'taboo' || k === 'hints';   // the two games played from taboo.csv, a turn at a time
const POINTS_BY_LEVEL = {1:10, 2:15, 3:20, 4:25, 5:30};
const MIXED = [5, 10, 15, 20, 25];
// Categories (7 Nov 2026): cols 'banks' (a column for each kind of question) or 'topics'; next 'winner' (the team that gets it right
// chooses next, as on TV) or 'turns'; dd: Daily Doubles; final: a last question every team bets on
const C_DEFAULTS = {title:'', topics:[], banks:['word','meaning','gap','tf','question'], levels:[1,2,3,4,5], cols:'banks', rows:5, secs:30, options:'show',
  wrong:'nothing', next:'winner', dd:1, final:true, teams:null};
const DEFAULTS = {title:'', topics:[], banks:['word','meaning','gap'], levels:[1,2,3,4,5], squares:20, secs:30, points:'same', options:'show',
  wrong:'nothing', surprise:'few', kinds:Object.keys(SURPRISES), teams:null};

// ---------- small helpers ----------
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const rich = s => esc(s || '').replace(/&lt;(\/?)(b|i)&gt;/g, '<$1$2>');   // explanations may use <b> and <i>, like the games
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const uid = () => 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const getJ = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const setJ = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const sets = () => getJ(K_SETS, []);
const setOf = id => sets().find(s => s.id === id) || null;
const saveSet = s => { const all = sets(), i = all.findIndex(x => x.id === s.id); s.updated = Date.now(); if (i < 0) all.unshift(s); else all[i] = s; setJ(K_SETS, all); };
const gameOf = id => (getJ(K_GAMES, {}) || {})[id] || null;
const saveGame = g => { const all = getJ(K_GAMES, {}) || {}; if (g) all[g.set] = g; setJ(K_GAMES, all); };
const dropGame = id => { const all = getJ(K_GAMES, {}) || {}; delete all[id]; setJ(K_GAMES, all); };
const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

// Team names: a cute adjective or a verb + a noun, all different within a game
const NAME_A = ['Sleepy', 'Fluffy', 'Tiny', 'Jolly', 'Sparkly', 'Cosmic', 'Fuzzy', 'Cheeky', 'Speedy', 'Mighty', 'Giggly', 'Wobbly', 'Snuggly', 'Sneaky',
  'Brave', 'Happy', 'Clever', 'Bouncy', 'Sunny', 'Dizzy', 'Shiny', 'Squishy', 'Zippy', 'Cuddly', 'Funky', 'Grumpy', 'Lucky', 'Super'];
const NAME_V = ['Dancing', 'Bouncing', 'Giggling', 'Juggling', 'Zooming', 'Snoozing', 'Singing', 'Twirling', 'Wiggling', 'Waddling', 'Hopping', 'Napping',
  'Skating', 'Surfing', 'Racing', 'Munching', 'Tumbling', 'Flying', 'Rolling', 'Sparkling'];
const NAME_N = ['Pandas', 'Otters', 'Penguins', 'Koalas', 'Llamas', 'Puffins', 'Hedgehogs', 'Narwhals', 'Dumplings', 'Pancakes', 'Muffins', 'Noodles',
  'Cupcakes', 'Dragons', 'Unicorns', 'Robots', 'Kittens', 'Sloths', 'Ducklings', 'Bunnies', 'Hamsters', 'Turtles', 'Dolphins', 'Foxes', 'Owls',
  'Bananas', 'Teapots', 'Marshmallows', 'Pickles', 'Donuts', 'Meerkats', 'Pineapples', 'Wombats', 'Snowmen', 'Jellyfish', 'Raccoons'];
function funName(others){
  const taken = (others || []).join(' ').toLowerCase().split(/\s+/);
  for (let i = 0; i < 60; i++) {
    const n = (Math.random() < .55 ? pick(NAME_A) : pick(NAME_V)) + ' ' + pick(NAME_N);
    if (!n.toLowerCase().split(' ').some(w => taken.includes(w))) return n;
  }
  return pick(NAME_A) + ' ' + pick(NAME_N);
}
function funNames(n){ const out = []; for (let i = 0; i < n; i++) out.push(funName(out)); return out; }

// ---------- the content files (the same format as en/engine/app.js reads; see content/README.md) ----------
function parseCSV(text){
  const rows = []; let row = [], cell = '', q = false;
  text = String(text || '').replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) { const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c; }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  const head = (rows.shift() || []).map(h => h.trim().toLowerCase());
  return rows.filter(r => r.some(x => x.trim())).map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] || '').trim()])));
}
// A1=1 … C1=5, "+" adds half a level; names work too. No level (or one the site doesn't know): every level (null).
const LEVEL_BY_NAME = {'foundation':1, 'foundation+':2, 'intermediate':3, 'intermediate+':4, 'advanced':5};
function levelNum(code){
  const s = String(code || '').trim(); if (!s) return null;
  const named = LEVEL_BY_NAME[s.toLowerCase().replace(/\s+/g, '')]; if (named) return named;
  const m = s.toUpperCase().match(/^([ABC])([12])(\+)?$/); if (!m) return null;
  return ({A:0, B:2, C:4})[m[1]] + (+m[2]) + (m[3] ? .5 : 0);
}
const band = lv => lv == null ? null : Math.floor(lv);
const listOf = v => String(v || '').split(';').map(s => s.trim()).filter(Boolean);
const wrongs = r => [1, 2, 3, 4].map(k => r['wrong' + k]).filter(Boolean);

const loaded = {};
function loadTopic(key){
  if (loaded[key]) return loaded[key];
  const t = TOPICS.find(x => x.key === key);
  if (!t) return Promise.resolve(null);
  const files = [...new Set(BANKS.filter(b => !t.only || t.only.includes(b.key)).map(b => b.file))];
  const p = Promise.all(files.map(f => fetch(ROOT + 'content/' + key + '/' + f + '.csv', {cache: 'no-cache'})
      .then(r => r.ok ? r.text() : '').then(parseCSV).catch(() => null)))
    .then(all => { if (all.every(x => x === null)) throw new Error("Couldn't load the questions for " + t.name + '.');
      const T = {}; files.forEach((f, i) => { T[f] = all[i] || []; }); return buildTopic(t, T); });
  loaded[key] = p; p.catch(() => { delete loaded[key]; });
  return p;
}
function buildTopic(t, T){
  const D = {key: t.key, name: t.name, words: [], items: {}, alike: new Set()};
  const ids = new Set();
  (T.words || []).forEach(r => { if (!r.id || !r.word || !r.meaning || ids.has(r.id)) return; ids.add(r.id);
    const lists = listOf(r.list).map(s => s.toLowerCase());
    D.words.push({id: r.id, lv: levelNum(r.level), w: r.word, pos: r.pos || '', def: r.meaning, ex: r.example || '', zh: r.zh || '',
      sim: listOf(r.similar), on: !t.list || !lists.length || lists.includes(t.list)}); });
  const byText = {}; D.words.forEach(w => { (byText[w.w.toLowerCase()] = byText[w.w.toLowerCase()] || []).push(w.id); });
  D.words.forEach(w => { w.sim.forEach(v => { (ids.has(v) ? [v] : (byText[v.toLowerCase()] || [])).forEach(o => { D.alike.add(w.id + '|' + o); D.alike.add(o + '|' + w.id); }); }); delete w.sim; });
  const onList = D.words.filter(w => w.on);
  D.items.word = onList; D.items.meaning = onList; D.items.zh = onList.filter(w => w.zh);
  D.items.gap = (T.gaps || []).filter(r => r.id && r.sentence && r.sentence.includes('___') && r.answer && wrongs(r).length)
    .map(r => ({id: r.id, lv: levelNum(r.level), s: r.sentence, ans: r.answer, wrong: wrongs(r), why: r.explanation || '', focus: r.focus || ''}));
  D.items.tf = (T.tf || []).map(r => { const a = String(r.answer || '').trim().toLowerCase(), t1 = /^(true|t|yes|y)$/.test(a);
    return r.id && r.statement && (t1 || /^(false|f|no|n)$/.test(a)) ? {id: r.id, lv: levelNum(r.level), s: r.statement, t: t1, why: r.explanation || ''} : null; }).filter(Boolean);
  D.items.rw = (T['right-wrong'] || []).map(r => { const a = String(r.answer || '').trim().toLowerCase(), ok = /^(right|r|correct|true|t|yes|y)$/.test(a);
    return r.id && r.statement && (ok || /^(wrong|w|incorrect|false|f|no|n)$/.test(a)) ? {id: r.id, lv: levelNum(r.level), s: r.statement, ok, why: r.explanation || '', fix: r.correction || ''} : null; }).filter(Boolean);
  D.items.question = (T.questions || []).filter(r => r.id && r.question && r.correct && wrongs(r).length)
    .map(r => ({id: r.id, lv: levelNum(r.level), cmd: r.command || '', q: r.question, ans: r.correct, wrong: wrongs(r), why: r.explanation || ''}));
  D.items.gk = (T.knowledge || []).filter(r => r.id && r.question && r.correct && wrongs(r).length)
    .map(r => ({id: r.id, lv: levelNum(r.level), q: r.question, ans: r.correct, wrong: wrongs(r), why: r.explanation || ''}));
  return D;
}

// Questions taken out through Reports (the same list the games use)
let HIDDEN = new Set();
const useHidden = list => { const h = new Set(); (Array.isArray(list) ? list : []).forEach(x => { if (!x) return;
  const id = String(x.item).split('#')[0]; h.add(x.topic + '|' + x.game + '|' + id); h.add('*|' + x.game + '|' + id); }); HIDDEN = h; };
let hiddenAsked = false;
function loadHidden(){
  if (hiddenAsked) return; hiddenAsked = true;
  useHidden(getJ('aeaHidden', []));
  let api = ''; try { api = localStorage.getItem('aea:api') || ''; } catch (e) {}
  api = (api || 'https://api.academicenglishapp.com').replace(/\/+$/, '');
  fetch(api + '/api/hidden', {cache: 'no-store'}).then(r => r.ok ? r.json() : null)
    .then(d => { if (d && Array.isArray(d.hidden)) { setJ('aeaHidden', d.hidden); useHidden(d.hidden); } }).catch(() => {});
}
const isHidden = (topic, bank, id) => { const b = BANKS.find(x => x.key === bank);
  return !!(HIDDEN.size && b && b.hid.some(g => HIDDEN.has((topic === 'general' ? '*' : topic) + '|' + g + '|' + id))); };

// The items a board can use: chosen topics × question types × levels (rows with no level play at any level)
function eligible(D, bank, levels){
  const t = TOPICS.find(x => x.key === D.key);
  if (t.only && !t.only.includes(bank)) return [];
  return (D.items[bank] || []).filter(it => (it.lv == null || levels.includes(band(it.lv))) && !isHidden(D.key, bank, it.id));
}
function distractors(w, D, levels, n){
  const atLevel = D.words.filter(x => x.on && x.lv != null && levels.includes(band(x.lv)));
  const pool = atLevel.length >= 8 ? atLevel : D.words.filter(x => x.on).length >= 8 ? D.words.filter(x => x.on) : D.words;
  const ok = x => x.id !== w.id && x.w.toLowerCase() !== w.w.toLowerCase() && x.def !== w.def && !D.alike.has(w.id + '|' + x.id) && !(w.zh && x.zh === w.zh);
  const same = shuffle(pool.filter(x => ok(x) && (!w.pos || x.pos === w.pos)));
  const rest = shuffle(pool.filter(x => ok(x) && !same.includes(x)));
  const out = [];
  for (const x of [...same, ...rest]) { if (out.some(o => D.alike.has(o.id + '|' + x.id) || o.w === x.w || o.def === x.def)) continue; out.push(x); if (out.length === n) break; }
  return out;
}
// One question, ready for the board (plain data, so a game in progress can be saved and carried on)
function makeQ(D, bank, it, levels){
  const q = {t: D.key, b: bank, id: it.id, lv: it.lv};
  const mc = (right, wrong) => { const opts = shuffle([right, ...wrong.slice(0, 3)]); q.opts = opts; q.a = opts.indexOf(right); };
  if (bank === 'word' || bank === 'meaning' || bank === 'zh') {
    const ds = distractors(it, D, levels, 3); if (ds.length < 2) return null;
    q.w = it.w; q.pos = it.pos; q.def = it.def; q.ex = it.ex; q.wid = it.id;
    if (bank === 'word') { q.k = 'word'; mc(it.def, ds.map(x => x.def)); }
    else if (bank === 'meaning') { q.k = 'def'; mc(it.w, ds.map(x => x.w)); }
    else { q.k = 'zh'; q.zh = it.zh; mc(it.w, ds.map(x => x.w)); }
  }
  else if (bank === 'gap') { q.k = 'gap'; q.s = it.s; q.focus = it.focus; q.why = it.why; mc(it.ans, it.wrong); }
  else if (bank === 'tf') { q.k = 'tf'; q.s = it.s; q.why = it.why; q.opts = ['True', 'False']; q.a = it.t ? 0 : 1; }
  else if (bank === 'rw') { q.k = 'rw'; q.s = it.s; q.why = it.why; q.fix = it.fix; q.opts = ['Good Grammar', 'Bad Grammar']; q.a = it.ok ? 0 : 1; }   // 8 Nov 2026 (teacher): Good Grammar / Bad Grammar, as on the topic pages
  else if (bank === 'question') { q.k = 'question'; q.s = it.q; q.cmd = it.cmd; q.why = it.why; mc(it.ans, it.wrong); }
  else if (bank === 'gk') { q.k = 'gk'; q.s = it.q; q.why = it.why; mc(it.ans, it.wrong); }
  else return null;
  return q;
}
// Draw n questions, taking turns between every topic × question type the teacher chose, never the same word twice
function draw(cfg, data, n, used){
  used = used || new Set();
  const buckets = [];
  cfg.topics.forEach(tk => { const D = data[tk]; if (!D) return;
    cfg.banks.forEach(bk => { const items = shuffle(eligible(D, bk, cfg.levels)); if (items.length) buckets.push({D, bk, items}); }); });
  const out = []; let live = shuffle(buckets);
  while (out.length < n && live.length) {
    live.forEach(bu => { if (out.length >= n) return;
      while (bu.items.length) { const it = bu.items.pop(), key = bu.D.key + '|' + bu.bk + '|' + it.id, wkey = it.w ? 'w|' + bu.D.key + '|' + it.id : '';
        if (used.has(key) || (wkey && used.has(wkey))) continue;
        const q = makeQ(bu.D, bu.bk, it, cfg.levels); if (!q) continue;
        used.add(key); if (wkey) used.add(wkey); out.push(q); break; } });
    live = live.filter(bu => bu.items.length);
  }
  return shuffle(out);
}
function countFor(cfg, data, bank, level){
  let n = 0;
  cfg.topics.forEach(tk => { const D = data[tk]; if (!D) return;
    (bank ? [bank] : cfg.banks).forEach(bk => { n += eligible(D, bk, level ? [level] : cfg.levels).filter(it => !level || it.lv != null).length; }); });
  return n;
}
function dataFor(topics){ loadHidden(); return Promise.all(topics.map(loadTopic)).then(all => Object.fromEntries(all.filter(Boolean).map(D => [D.key, D]))); }

// ---------- a Categories board: the columns, the level of each row, a question for every square ----------
function catCols(cfg){
  return cfg.cols === 'topics' ? cfg.topics.map(tk => ({name: topicName(tk), topics: [tk], banks: cfg.banks}))
    : BANKS.filter(b => cfg.banks.includes(b.key)).map(b => ({name: b.name, topics: cfg.topics, banks: [b.key]}));
}
function rowLevels(cfg, R){   // from the easiest level chosen down to the hardest, spread out (3 rows of 5 levels: 1, 3, 5)
  const L = (cfg.levels && cfg.levels.length ? cfg.levels : [1, 2, 3, 4, 5]).slice().sort((a, b) => a - b);
  return Array.from({length: R}, (_, r) => L[R > 1 ? Math.round(r * (L.length - 1) / (R - 1)) : 0]);
}
// A question for one square: at the row's level if the column has one, or the nearest level (the levels chosen first)
function drawAt(cc, lv, cfg, data, used){
  const near = a => a.slice().sort((x, y) => Math.abs(x - lv) - Math.abs(y - lv) || x - y), chosen = cfg.levels && cfg.levels.length ? cfg.levels : [1, 2, 3, 4, 5];
  for (const L of near(chosen).concat(near([1, 2, 3, 4, 5].filter(x => !chosen.includes(x))))) {
    const q = draw({topics: cc.topics, banks: cc.banks, levels: [L]}, data, 1, used)[0]; if (q) return q; }
  return null;
}
function newCatsGame(set, data){
  const cfg = JSON.parse(JSON.stringify(set)), cols = catCols(cfg).slice(0, 6), R = Math.max(3, Math.min(5, +cfg.rows || 5)), lv = rowLevels(cfg, R);
  const used = new Set(), tiles = [];
  for (let r = 0; r < R; r++) cols.forEach((cc, c) => { const q = drawAt(cc, lv[r], cfg, data, used);
    tiles.push(Object.assign({k: 'q', p: (r + 1) * 100, col: c, row: r, lvl: lv[r]}, q ? {q} : {empty: true})); });
  // Daily Doubles: hidden under a square, never on the top row, never two in one column
  const nDD = Math.max(0, Math.min(2, +cfg.dd || 0)), dcols = new Set();
  shuffle(tiles.filter(t => !t.empty && t.row > 0)).forEach(t => { if (dcols.size < nDD && !dcols.has(t.col)) { t.k = 'dd'; dcols.add(t.col); } });
  tiles.forEach((t, i) => Object.assign(t, {n: i + 1, done: !!t.empty, r: null}));
  let final = null;   // the final question: a random column, the hardest level chosen
  if (cfg.final && cols.length) { const c = Math.floor(Math.random() * cols.length), q = drawAt(cols[c], lv[R - 1], cfg, data, used);
    if (q) final = {q, col: cols[c].name, stage: 'bet', bets: {}, marks: {}, shown: false, opts: cfg.options !== 'hide'}; }
  const names = (cfg.teams && cfg.teams.length >= 2) ? cfg.teams : funNames(4);
  return {v: 1, kind: 'cats', set: set.id, title: cfg.title || 'Categories', cfg, started: Date.now(), turn: 0, cols: cols.map(c => c.name), rows: R,
    teams: names.map((nm, i) => ({name: nm, c: COLOURS[i % COLOURS.length], s: 0})), tiles, final, used: [...used]};
}

// ---------- a new game from a board ----------
function newGame(set, data){
  if (gameType(set) === 'cats') return newCatsGame(set, data);
  const cfg = JSON.parse(JSON.stringify(set));
  const n = Math.max(4, Math.min(40, +cfg.squares || 20));
  const kinds = cfg.surprise === 'none' ? [] : (cfg.kinds || []).filter(k => SURPRISES[k]);
  const nSur = kinds.length ? Math.max(1, Math.round(n * (cfg.surprise === 'lots' ? .25 : .12))) : 0;
  let sur = []; while (sur.length < nSur) sur = sur.concat(shuffle(kinds)); sur = sur.slice(0, nSur);
  const nSurQ = sur.filter(needsQ).length, needQ = n - nSur + nSurQ;
  const used = new Set(), qs = draw(cfg, data, needQ, used);
  // Not enough questions: the board gets smaller (a surprise square with no question left is dropped)
  const qTiles = Math.max(0, Math.min(qs.length - nSurQ, n - sur.length));
  const pts = q => cfg.points === 'mixed' ? pick(MIXED) : cfg.points === 'level' ? (POINTS_BY_LEVEL[band(q.lv)] || 20) : 10;
  let tiles = [];
  for (let i = 0; i < qTiles; i++) { const q = qs.shift(); tiles.push({k: 'q', q, p: pts(q)}); }
  sur.forEach(k => { if (needsQ(k)) { const q = qs.shift(); if (q) tiles.push({k, q, p: pts(q)}); } else tiles.push({k}); });
  tiles = shuffle(tiles).map((t, i) => Object.assign(t, {n: i + 1, done: false, r: null}));
  const names = (cfg.teams && cfg.teams.length >= 2) ? cfg.teams : funNames(4);
  return {v: 1, set: set.id, title: cfg.title || 'Board game', cfg, started: Date.now(), turn: 0, wanted: n,
    teams: names.map((nm, i) => ({name: nm, c: COLOURS[i % COLOURS.length], s: 0})), tiles, used: [...used]};
}

// ---------- describing a board in the list ----------
function levelsText(lv){
  lv = (lv || []).slice().sort((a, b) => a - b); if (!lv.length) return 'No levels';
  if (lv.length === 5) return 'All levels';
  const run = lv.every((x, i) => !i || x === lv[i - 1] + 1);
  return run && lv.length > 2 ? LEVEL_NAME[lv[0]] + ' to ' + LEVEL_NAME[lv[lv.length - 1]] : lv.map(x => LEVEL_NAME[x]).join(', ');
}
const topicName = k => (TOPICS.find(t => t.key === k) || {name: k}).name;
const bankName = k => (BANKS.find(b => b.key === k) || {name: k}).name;

// =====================================================================================================================
// The teacher page hands over: view (the page's main area), setTitle, header (the name/log out line), touch (keeps the login alive)
let C = null;
const AEA_BOARD = window.AEA_BOARD = {
  route(hash, ctx){
    C = ctx; stop();
    let m;
    if ((m = /^#\/board\/play\/([\w-]+)$/.exec(hash))) return play(m[1]);
    if (hash === '#/board/new') return chooser();
    if (hash === '#/board/new/squares') return form(null);
    if (hash === '#/board/new/cats') return form(null, 'cats');
    if (hash === '#/board/new/taboo') return tabooForm(null, 'taboo');
    if (hash === '#/board/new/hints') return tabooForm(null, 'hints');
    if ((m = /^#\/board\/([\w-]+)$/.exec(hash))) { const k = gameType(setOf(m[1])); return wordGame(k) ? tabooForm(m[1], k) : form(m[1], k); }
    return list();
  },
  stop
};
// Starters (teacher/starters.js, 7 Nov 2026) use the same topics, levels and content loading as the board games
AEA_BOARD.lib = {TOPICS, BANKS, LEVELS, LEVEL_NAME, parseCSV, levelNum, band, listOf, dataFor, eligible, makeQ, distractors, topicName,
  hidden: (topic, game, id) => !!(HIDDEN.size && (HIDDEN.has(topic + '|' + game + '|' + id) || HIDDEN.has('*|' + game + '|' + id))),
  loadHidden, esc, rich, shuffle, pick, uid, getJ, setJ, K_SOUND};

// ---------- the list of boards ----------
function list(){
  C.setTitle('Board games'); C.header();
  const all = sets();
  C.view.innerHTML =
    '<p style="margin:0 0 14px"><a class="backlink" href="#/">← All classes</a></p>' +
    '<div class="spread" style="margin-bottom:14px"><p class="note">Games for the whole class on one screen: open a board, then put it on the projector.</p>' +
    '<a class="btn" href="#/board/new">+ New board game</a></div>' +
    (all.length ? '<div class="bg-list">' + all.map(s => { const g = gameOf(s.id), left = g && g.tiles ? g.tiles.filter(t => !t.done).length : 0, all = g && g.tiles ? g.tiles.filter(t => !t.empty).length : 0;
      return '<div class="card bg-item" data-id="' + esc(s.id) + '">' +
        '<span class="bg-kind">' + esc(GAME_TYPES[gameType(s)].name) + '</span><h3>' + esc(s.title || 'Board game') + '</h3>' +
        (g ? '<span class="bg-going">' + (wordGame(g.kind) ? 'Game in progress: round ' + Math.min(g.round + 1, g.times.length) + ' of ' + g.times.length
          : g.kind === 'cats' ? 'Game in progress: ' + left + ' of ' + all + ' questions left' + (!left && g.final && g.final.stage !== 'done' ? ', then the final question' : '')
          : 'Game in progress: ' + left + ' of ' + g.tiles.length + ' squares left') + '</span>' : '') +
        '<p class="note">' + esc(s.topics.map(topicName).join(', ') || 'No topics') + '</p>' +
        (gameType(s) === 'hints'
          ? '<p class="note">' + esc(levelsText(s.levels)) + '</p>' +
            '<p class="note">' + (s.teams || []).length + ' teams · ' + (s.times || []).length + ' turn' + ((s.times || []).length === 1 ? '' : 's') + ' each of ' + ((s.times || [])[0] || 60) + ' seconds</p>'
          : gameType(s) === 'cats'
          ? '<p class="note">' + esc((s.cols === 'topics' ? s.topics.map(topicName) : BANKS.filter(b => s.banks.includes(b.key)).map(b => b.name)).join(' · ')) + '</p>' +
            '<p class="note">' + esc(levelsText(s.levels)) + ' · ' + (s.rows || 5) + ' rows · ' + (s.teams || []).length + ' teams · ' + (s.secs ? s.secs + ' seconds' : 'no timer') +
              (s.dd ? ' · ' + s.dd + ' Daily Double' + (s.dd > 1 ? 's' : '') : '') + (s.final ? ' · a final question' : '') + '</p>'
          : gameType(s) === 'taboo'
          ? '<p class="note">' + esc(levelsText(s.levels)) + ' · ' + (s.replay !== false ? 'the same words each round' : 'new words each round') + '</p>' +
            '<p class="note">' + (s.teams || []).length + ' teams · rounds of ' + (s.times || []).filter(Number).join(', ') + ' seconds</p>'
          : '<p class="note">' + esc(s.banks.map(bankName).join(', ')) + ' · ' + esc(levelsText(s.levels)) + '</p>' +
            '<p class="note">' + s.squares + ' squares · ' + (s.teams || []).length + ' teams · ' + (s.secs ? s.secs + ' seconds' : 'no timer') + '</p>') +
        '<div class="row">' + (g ? '<a class="btn" href="#/board/play/' + esc(s.id) + '">Carry on</a><button class="btn alt" type="button" data-act="fresh">New game</button>'
          : '<a class="btn" href="#/board/play/' + esc(s.id) + '">Play</a>') +
        '<a class="btn small alt" href="#/board/' + esc(s.id) + '">Change</a>' +
        '<button class="btn small alt" type="button" data-act="copy">Copy</button>' +
        '<button class="btn small alt" type="button" data-act="del">Delete</button></div></div>'; }).join('') + '</div>'
      : '<div class="card narrow"><p class="note">No board games yet. Make one: choose a game, the topics and the levels, then the teams.</p>' +
        '<div><a class="btn" href="#/board/new">+ New board game</a></div></div>') +
    '<p class="note" style="margin-top:16px">Your boards are saved in this browser on this computer. A game in progress is saved too, so you can carry on after closing the page.</p>';
  C.view.querySelectorAll('[data-act]').forEach(b => b.onclick = () => {
    const id = b.closest('[data-id]').dataset.id, s = setOf(id); if (!s) return; C.touch();
    if (b.dataset.act === 'fresh') { if (confirm('Start a new game? The scores of the game in progress will be lost.')) { dropGame(id); location.hash = '#/board/play/' + id; } }
    else if (b.dataset.act === 'copy') { const c = Object.assign(JSON.parse(JSON.stringify(s)), {id: uid(), title: (s.title || 'Board game') + ' (copy)', created: Date.now()}); saveSet(c); location.hash = '#/board/' + c.id; }
    else if (b.dataset.act === 'del') { if (confirm('Delete "' + (s.title || 'Board game') + '"?')) { setJ(K_SETS, sets().filter(x => x.id !== id)); dropGame(id); list(); } }
  });
}

// ---------- making or changing a board ----------
function form(id, kind){
  const cats = kind === 'cats', old = id ? setOf(id) : null;
  if (id && !old) { location.hash = '#/board'; return; }
  const cfg = Object.assign(JSON.parse(JSON.stringify(cats ? C_DEFAULTS : DEFAULTS)), old ? JSON.parse(JSON.stringify(old)) : {});
  if (!cfg.teams || cfg.teams.length < 2) cfg.teams = funNames(4);
  const gname = GAME_TYPES[cats ? 'cats' : 'squares'].name;
  C.setTitle(old ? 'Change: ' + gname : 'New ' + gname + ' game'); C.header();
  let data = {};
  const opt = (v, label, cur) => '<option value="' + v + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + label + '</option>';
  C.view.innerHTML =
    '<p style="margin:0 0 14px"><a class="backlink" href="#/board">← Board games</a></p>' +
    '<form class="card bg-form" id="bf" novalidate>' +
    '<div class="field"><label for="b-title">Name</label><input type="text" id="b-title" maxlength="80" placeholder="e.g. 8B Web design quiz" value="' + esc(cfg.title) + '"></div>' +
    '<fieldset><legend>Topics</legend><div class="bg-chips" id="b-topics">' + TOPICS.map(t =>
      '<label class="bg-chip"><input type="checkbox" value="' + t.key + '"' + (cfg.topics.includes(t.key) ? ' checked' : '') + '><span>' + esc(t.name) + '</span></label>').join('') + '</div></fieldset>' +
    '<fieldset><legend>Questions</legend><div class="bg-types" id="b-banks"></div>' +
    '<p class="note">Left out because they need more than one screen: Build the sentence, Spot the error, Complete the text, In your own words, Find the evidence and the reading passages.</p></fieldset>' +
    '<fieldset><legend>Levels</legend><div class="bg-chips" id="b-levels"></div></fieldset>' +
    (cats ? '<fieldset><legend>Columns</legend><div class="bg-kinds" id="b-cols">' +
      [['banks', 'A column for each kind of question', 'Best for one topic: What does it mean?, Fill the gap, True or false…'],
       ['topics', 'A column for each topic', 'For a review of several topics: each column mixes the kinds of question chosen.']].map(x =>
        '<label><input type="radio" name="b-cols" value="' + x[0] + '"' + (cfg.cols === x[0] ? ' checked' : '') + '><span><b>' + x[1] + '</b><br><span class="note">' + x[2] + '</span></span></label>').join('') +
      '</div><p class="note" id="b-colnames"></p></fieldset>' : '') +
    '<p class="bg-total" id="b-total" aria-live="polite">Choose at least one topic.</p>' +
    (cats ? '<hr><fieldset><legend>The game</legend><div class="bg-settings">' +
      '<div class="field"><label for="b-rows">Rows</label><select id="b-rows">' + [[3, '3: 100 to 300'], [4, '4: 100 to 400'], [5, '5: 100 to 500']].map(x => opt(x[0], x[1], cfg.rows)).join('') + '</select>' +
        '<span class="note">Each row is a level harder, from the easiest level chosen to the hardest.</span></div>' +
      '<div class="field"><label for="b-secs">Time to answer</label><select id="b-secs">' + [[0, 'No timer'], [10, '10 seconds'], [15, '15 seconds'], [20, '20 seconds'], [30, '30 seconds'], [45, '45 seconds'], [60, '1 minute'], [90, '90 seconds'], [120, '2 minutes']].map(x => opt(x[0], x[1], cfg.secs)).join('') + '</select></div>' +
      '<div class="field"><label for="b-options">Answer options</label><select id="b-options">' + opt('show', 'Show them with the question', cfg.options) + opt('hide', 'Hidden until you show them', cfg.options) + '</select>' +
        '<span class="note">Hidden: teams answer without choices first.</span></div>' +
      '<div class="field"><label for="b-wrong">Wrong answers</label><select id="b-wrong">' + opt('nothing', 'Score nothing', cfg.wrong) + opt('lose', 'Lose the points', cfg.wrong) + '</select></div>' +
      '<div class="field"><label for="b-next">Who chooses next</label><select id="b-next">' + opt('winner', 'The team that got it right', cfg.next) + opt('turns', 'Teams take turns', cfg.next) + '</select></div>' +
      '<div class="field"><label for="b-dd">Daily Doubles</label><select id="b-dd">' + [[0, 'None'], [1, '1'], [2, '2']].map(x => opt(x[0], x[1], cfg.dd)).join('') + '</select>' +
        '<span class="note">Hidden under a square: the team bets some of its points.</span></div>' +
    '</div><label class="choice"><input type="checkbox" id="b-final"' + (cfg.final ? ' checked' : '') + '><span><b>A final question</b><br>' +
      '<span class="note">When the board is finished: every team writes down a bet, then its answer. Right wins the bet, wrong loses it.</span></span></label></fieldset>' :
    '<hr><fieldset><legend>The game</legend><div class="bg-settings">' +
      '<div class="field"><label for="b-squares">Squares</label><select id="b-squares">' + [6, 9, 12, 15, 16, 20, 24, 25, 28, 30, 32, 36].map(n => opt(n, n, cfg.squares)).join('') + '</select></div>' +
      '<div class="field"><label for="b-secs">Time to answer</label><select id="b-secs">' + [[0, 'No timer'], [10, '10 seconds'], [15, '15 seconds'], [20, '20 seconds'], [30, '30 seconds'], [45, '45 seconds'], [60, '1 minute'], [90, '90 seconds'], [120, '2 minutes']].map(x => opt(x[0], x[1], cfg.secs)).join('') + '</select></div>' +
      '<div class="field"><label for="b-points">Points</label><select id="b-points">' + opt('same', '10 for every question', cfg.points) + opt('mixed', 'Mixed: 5 to 25, a surprise each time', cfg.points) + opt('level', 'By level: 10 (Foundation) to 30 (Advanced)', cfg.points) + '</select></div>' +
      '<div class="field"><label for="b-options">Answer options</label><select id="b-options">' + opt('show', 'Show them with the question', cfg.options) + opt('hide', 'Hidden until you show them', cfg.options) + '</select>' +
        '<span class="note">Hidden: teams answer without choices first.</span></div>' +
      '<div class="field"><label for="b-wrong">Wrong answers</label><select id="b-wrong">' + opt('nothing', 'Score nothing', cfg.wrong) + opt('lose', 'Lose the points', cfg.wrong) + '</select></div>' +
    '</div></fieldset>' +
    '<hr><fieldset><legend>Surprise squares</legend>' +
      '<div class="bg-settings"><div class="field"><label for="b-surprise">How many</label><select id="b-surprise">' + opt('none', 'None', cfg.surprise) + opt('few', 'A few (about 1 in 8)', cfg.surprise) + opt('lots', 'Lots (about 1 in 4)', cfg.surprise) + '</select></div></div>' +
      '<div class="bg-kinds" id="b-kinds">' + Object.keys(SURPRISES).map(k => '<label><input type="checkbox" value="' + k + '"' + (cfg.kinds.includes(k) ? ' checked' : '') + '><span><b>' + SURPRISES[k].icon + ' ' + SURPRISES[k].name.replace('!', '') + '</b><br><span class="note">' + SURPRISES[k].blurb + '</span></span></label>').join('') + '</div></fieldset>') +
    '<hr><fieldset><legend>Teams</legend>' +
      '<div class="row"><label class="lab" for="b-nteams">How many</label><select id="b-nteams">' + [2, 3, 4, 5, 6, 7, 8].map(n => opt(n, n, cfg.teams.length)).join('') + '</select>' +
      '<button class="btn small alt" type="button" id="b-renames">New names for every team</button></div>' +
      '<div class="bg-teams" id="b-teams"></div></fieldset>' +
    '<p class="err" id="err" role="alert" hidden></p>' +
    '<div class="row bg-saveline"><button class="btn" type="submit" data-go="play">Save and play</button><button class="btn alt" type="submit" data-go="list">Save</button><a class="btn alt" href="#/board">Cancel</a></div>' +
    '</form>';
  const $ = s => C.view.querySelector(s), $$ = s => [...C.view.querySelectorAll(s)];
  const checked = sel => $$(sel + ' input:checked').map(i => i.value);
  const read = () => {
    cfg.title = $('#b-title').value.trim();
    cfg.topics = checked('#b-topics');
    if ($$('#b-banks input').length) cfg.banks = $$('#b-banks input').filter(i => i.checked && !i.disabled).map(i => i.value);
    if ($$('#b-levels input').length) cfg.levels = $$('#b-levels input').filter(i => i.checked).map(i => +i.value);
    cfg.secs = +$('#b-secs').value; cfg.options = $('#b-options').value; cfg.wrong = $('#b-wrong').value;
    if (cats) { cfg.cols = (C.view.querySelector('#b-cols input:checked') || {}).value || 'banks'; cfg.rows = +$('#b-rows').value; cfg.next = $('#b-next').value; cfg.dd = +$('#b-dd').value; cfg.final = $('#b-final').checked; }
    else { cfg.squares = +$('#b-squares').value; cfg.points = $('#b-points').value; cfg.surprise = $('#b-surprise').value; cfg.kinds = checked('#b-kinds'); }
    cfg.teams = $$('#b-teams input').map((i, k) => i.value.trim() || 'Team ' + (k + 1));
  };
  // Question types and levels, with how many questions each has for the topics chosen
  let wantBanks = cfg.banks.slice();
  const drawBanks = () => {
    const ready = cfg.topics.every(t => data[t]);
    $('#b-banks').innerHTML = BANKS.map(b => {
      const n = ready ? cfg.topics.reduce((a, tk) => a + eligible(data[tk], b.key, cfg.levels).length, 0) : null;
      const anyLevel = ready ? cfg.topics.reduce((a, tk) => a + eligible(data[tk], b.key, [1, 2, 3, 4, 5]).length, 0) : null;
      const off = ready && cfg.topics.length && !anyLevel, on = wantBanks.includes(b.key) && !off;
      return '<label class="bg-type' + (on ? ' on' : '') + (off ? ' off' : '') + '"><input type="checkbox" value="' + b.key + '"' + (on ? ' checked' : '') + (off ? ' disabled' : '') + '>' +
        '<span><b>' + esc(b.name) + ' <span class="bg-count">' + (!cfg.topics.length ? '' : n == null ? '…' : off ? '' : n) + '</span></b>' +
        '<span class="note">' + (off ? 'None in ' + (cfg.topics.length > 1 ? 'these topics' : 'this topic') + ' yet.' : esc(b.blurb)) + '</span></span></label>'; }).join('');
    $$('#b-banks input').forEach(i => i.onchange = () => { wantBanks = $$('#b-banks input').filter(x => x.checked).map(x => x.value).concat(wantBanks.filter(k => $$('#b-banks input').some(x => x.value === k && x.disabled))); read(); drawCounts(); });
  };
  const drawLevels = () => {
    const ready = cfg.topics.length && cfg.topics.every(t => data[t]);
    $('#b-levels').innerHTML = LEVELS.map(([n, name]) => {
      const c = ready ? countFor(cfg, data, null, n) : null;
      return '<label class="bg-chip"><input type="checkbox" value="' + n + '"' + (cfg.levels.includes(n) ? ' checked' : '') + '><span>' + name + (c == null ? '' : ' <small>' + c + '</small>') + '</span></label>'; }).join('');
    $$('#b-levels input').forEach(i => i.onchange = () => { read(); drawCounts(); });
  };
  const drawTotal = () => {
    const el = $('#b-total'); el.classList.remove('bad');
    if (!cfg.topics.length) { el.textContent = 'Choose at least one topic.'; return; }
    if (!cfg.topics.every(t => data[t])) { el.textContent = 'Counting the questions…'; return; }
    if (!cfg.banks.length) { el.textContent = 'Choose at least one kind of question.'; el.classList.add('bad'); return; }
    if (cats) return catsTotal(el);
    const total = countFor(cfg, data), kinds = cfg.surprise === 'none' ? 0 : cfg.kinds.length;
    const nSur = kinds ? Math.max(1, Math.round(cfg.squares * (cfg.surprise === 'lots' ? .25 : .12))) : 0, need = cfg.squares - nSur;
    const onlyGk = cfg.banks.every(b => b === 'gk');
    if (!cfg.levels.length && !onlyGk) { el.textContent = 'Choose at least one level.'; el.classList.add('bad'); return; }
    if (!total) { el.textContent = 'No questions match these choices yet.'; el.classList.add('bad'); return; }
    el.textContent = total + ' question' + (total === 1 ? '' : 's') + ' match. A board of ' + cfg.squares + ' squares uses ' + need + (nSur ? ' (and ' + nSur + ' surprise square' + (nSur === 1 ? '' : 's') + ')' : '') + ', different every game.' +
      (total < need ? ' There are not enough for every square, so the board will be smaller.' : '');
    if (total < need) el.classList.add('bad');
  };
  // Categories: the columns, and whether every square can have a question
  const catsTotal = el => {
    read();   // the kinds of question just drawn (a kind the topic doesn't have is unticked)
    const cols = catCols(cfg), R = cfg.rows, lv = rowLevels(cfg, R), names = $('#b-colnames');
    if (names) names.textContent = cols.length ? 'Columns: ' + cols.map(c => c.name).join(' · ') : '';
    if (cols.length < 2) { el.textContent = cfg.cols === 'topics' ? 'Choose at least two topics for a column each (or a column for each kind of question).' : 'Choose at least two kinds of question for a column each (or a column for each topic).'; el.classList.add('bad'); return; }
    if (cols.length > 6) { el.textContent = 'At most 6 columns: you have ' + cols.length + '. Untick some ' + (cfg.cols === 'topics' ? 'topics.' : 'kinds of question.'); el.classList.add('bad'); return; }
    if (!cfg.levels.length && !cfg.banks.every(b => b === 'gk')) { el.textContent = 'Choose at least one level.'; el.classList.add('bad'); return; }
    const short = cols.map(cc => ({cc, n: countFor({topics: cc.topics, banks: cc.banks, levels: cfg.levels}, data)})).filter(x => x.n < R);
    el.textContent = cols.length + ' columns × ' + R + ' rows: 100 (' + LEVEL_NAME[lv[0]] + ') to ' + R * 100 + ' (' + LEVEL_NAME[lv[R - 1]] + ').' +
      (cfg.dd ? ' ' + cfg.dd + ' Daily Double' + (cfg.dd > 1 ? 's' : '') + '.' : '') + (cfg.final ? ' Then a final question.' : '') +
      (short.length ? ' Not enough questions in ' + short.map(x => x.cc.name + ' (' + x.n + ')').join(', ') + ': some squares will be empty.' : '');
    if (short.length) el.classList.add('bad');
  };
  const drawCounts = () => { drawBanks(); drawLevels(); drawTotal(); };
  const drawTeams = () => {
    const n = +$('#b-nteams').value;
    while (cfg.teams.length < n) cfg.teams.push(funName(cfg.teams));
    cfg.teams = cfg.teams.slice(0, n);
    $('#b-teams').innerHTML = cfg.teams.map((nm, i) => '<div class="bg-team"><span class="sw" style="background:' + COLOURS[i] + '"></span>' +
      '<input type="text" maxlength="30" aria-label="Team ' + (i + 1) + ' name" value="' + esc(nm) + '">' +
      '<button class="bg-dice" type="button" data-i="' + i + '" title="A new name" aria-label="A new name for team ' + (i + 1) + '">🎲</button></div>').join('');
    $$('#b-teams input').forEach((inp, i) => inp.oninput = () => { cfg.teams[i] = inp.value; });
    $$('#b-teams .bg-dice').forEach(b => b.onclick = () => { const i = +b.dataset.i; cfg.teams[i] = funName(cfg.teams.filter((_, k) => k !== i)); drawTeams(); });
  };
  const loadChosen = () => { read(); drawCounts();
    dataFor(cfg.topics).then(d => { Object.assign(data, d); read(); drawCounts(); })
      .catch(x => { const e = $('#err'); e.textContent = x.message + ' Check your internet connection and try again.'; e.hidden = false; }); };
  $$('#b-topics input').forEach(i => i.onchange = () => { C.touch(); loadChosen(); });
  ['#b-squares', '#b-surprise', '#b-rows', '#b-dd', '#b-final'].forEach(s => { if ($(s)) $(s).onchange = () => { read(); drawTotal(); kindsState(); }; });
  $$('#b-kinds input, #b-cols input').forEach(i => i.onchange = () => { read(); drawTotal(); });
  const kindsState = () => { if (cats) return; const off = $('#b-surprise').value === 'none'; $('#b-kinds').setAttribute('aria-disabled', off); $$('#b-kinds input').forEach(i => { i.disabled = off; }); };
  $('#b-nteams').onchange = () => { cfg.teams = $$('#b-teams input').map(i => i.value); drawTeams(); };
  $('#b-renames').onclick = () => { cfg.teams = funNames(cfg.teams.length); drawTeams(); };
  drawTeams(); kindsState(); loadChosen();
  let go = 'play';
  $$('#bf [type=submit]').forEach(b => b.onclick = () => { go = b.dataset.go; });
  $('#bf').onsubmit = e => {
    e.preventDefault(); C.touch(); read();
    const err = $('#err'), say = m => { err.textContent = m; err.hidden = false; err.scrollIntoView({block: 'center', behavior: 'smooth'}); };
    err.hidden = true;
    if (!cfg.topics.length) return say('Choose at least one topic.');
    if (!cfg.topics.every(t => data[t])) return say('Still counting the questions. Try again in a moment.');
    if (!cfg.banks.length) return say('Choose at least one kind of question.');
    if (!cfg.levels.length && !cfg.banks.every(b => b === 'gk')) return say('Choose at least one level.');
    if (!countFor(cfg, data)) return say('No questions match these choices yet. Choose more kinds of question, levels or topics.');
    if (cats) { const n = catCols(cfg).length;
      if (n < 2) return say(cfg.cols === 'topics' ? 'Choose at least two topics: each one is a column.' : 'Choose at least two kinds of question: each one is a column.');
      if (n > 6) return say('At most 6 columns: you have ' + n + '.'); }
    const s = Object.assign({}, cfg, {game: cats ? 'cats' : 'squares', id: old ? old.id : uid(), created: old ? old.created : Date.now(),
      title: cfg.title || cfg.topics.map(topicName).join(' + ') + (cats ? ' categories' : ' quiz')});
    saveSet(s);
    const g = gameOf(s.id);
    if (g && go === 'play' && !confirm('This board has a game in progress. Start a new game with the new settings? (Cancel keeps the game in progress.)')) { location.hash = '#/board/play/' + s.id; return; }
    if (g && go === 'play') dropGame(s.id);
    location.hash = go === 'play' ? '#/board/play/' + s.id : '#/board';
  };
}

// =====================================================================================================================
// ---------- playing: the board fills the window ----------
let P = null;   // the game on screen: {game, el, stage, grid, card, …}
function stop(){
  if (!P) return;
  clearInterval(P.tick); clearTimeout(P.keyWait);
  removeEventListener('resize', P.onResize); removeEventListener('keydown', P.onKey, true);
  document.removeEventListener('fullscreenchange', P.onFs);
  closePop();
  if (P.el) P.el.remove();
  document.documentElement.classList.remove('bg-on');
  if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  P = null;
}
function play(id){
  const set = setOf(id);
  if (!set) { location.hash = '#/board'; return; }
  const g = gameOf(id);
  if (g) return mount(g);
  C.setTitle(set.title || 'Board game'); C.header();
  C.view.innerHTML = '<p class="note">Getting the questions ready…</p>';
  if (wordGame(gameType(set))) {
    tabooData(set.topics).then(data => {
      const game = newTabooGame(set, data);
      if (!game.words) { C.view.innerHTML = '<p class="err">No words are ready for this game yet. <a href="#/board/' + esc(id) + '">Change it</a></p>'; return; }
      saveGame(game); if (location.hash === '#/board/play/' + id) mount(game);
    }).catch(x => { C.view.innerHTML = '<p><a class="backlink" href="#/board">← Board games</a></p><p class="err">' + esc(x.message) + ' Check your internet connection and try again.</p>'; });
    return;
  }
  dataFor(set.topics).then(data => {
    const game = newGame(set, data);
    if (!game.tiles.length) { C.view.innerHTML = '<p class="err">No questions match this board\'s choices. <a href="#/board/' + esc(id) + '">Change the board</a></p>'; return; }
    saveGame(game); if (location.hash === '#/board/play/' + id) mount(game, data);
  }).catch(x => { C.view.innerHTML = '<p><a class="backlink" href="#/board">← Board games</a></p><p class="err">' + esc(x.message) + ' Check your internet connection and try again.</p>'; });
}

const ICON = {
  full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  unfull: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
  on: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  off: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>'
};
function mount(game, data){
  stop();
  P = {game, data: data || null, card: null, open: null, busy: false, keyBuf: '', sound: getJ(K_SOUND, true)};
  document.documentElement.classList.add('bg-on');
  const taboo = wordGame(game.kind);   // Don't Say It! or Hints
  document.title = game.title + ' · ' + GAME_TYPES[gameType(game)].name;
  const el = P.el = document.createElement('div');
  el.className = 'bg-play';
  el.innerHTML =
    '<div class="bg-top"><h1 class="bg-title">' + esc(game.title) + '</h1><div class="bg-tools">' +
      '<button class="bg-tool" type="button" data-t="sound"></button>' +
      '<button class="bg-tool" type="button" data-t="full"></button>' +
      '<button class="bg-tool" type="button" data-t="end">End game</button>' +
      '<button class="bg-tool" type="button" data-t="exit" title="Back to your boards. The game is saved.">Exit</button></div></div>' +
    '<div class="bg-scores" role="group" aria-label="Scores. Click a team to change its score."></div>' +
    '<p class="bg-prompt" aria-live="polite"></p>' +
    '<div class="bg-stage"><div class="bg-grid"></div></div>' +
    (game.kind === 'hints' ? '<p class="bg-keys"><kbd>Space</kbd> start, pause, next team · <kbd>Y</kbd> got it · <kbd>N</kbd> next hint · <kbd>W</kbd> the wheel · <kbd>A</kbd> show the word · On the wheel: <kbd>Space</kbd> spin, <kbd>Y</kbd> right, <kbd>N</kbd> wrong</p>'
      : game.kind === 'cats' ? '<p class="bg-keys">Click a square, or move with the arrow keys and press <kbd>Enter</kbd>. In a question: <kbd>Space</kbd> pause the timer · <kbd>A</kbd>–<kbd>D</kbd> the team\'s answer · <kbd>S</kbd> show the answer · <kbd>Y</kbd> right · <kbd>N</kbd> wrong · <kbd>Esc</kbd> close</p>'
      : taboo ? '<p class="bg-keys"><kbd>Space</kbd> start, pause, next team · <kbd>G</kbd> got it · <kbd>S</kbd> skip · <kbd>X</kbd> said a red word · <kbd>H</kbd> hint</p>'
      : '<p class="bg-keys">Click a square, or type its number. In a question: <kbd>Space</kbd> pause the timer · <kbd>A</kbd>–<kbd>D</kbd> the team\'s answer · <kbd>S</kbd> show the answer · <kbd>Y</kbd> right · <kbd>N</kbd> wrong · <kbd>Esc</kbd> close</p>');
  document.body.appendChild(el);
  P.stage = el.querySelector('.bg-stage'); P.grid = el.querySelector('.bg-grid'); P.scores = el.querySelector('.bg-scores'); P.prompt = el.querySelector('.bg-prompt');
  el.querySelector('[data-t=sound]').onclick = () => { P.sound = !P.sound; setJ(K_SOUND, P.sound); tools(); if (P.sound) sfx('right'); };
  el.querySelector('[data-t=full]').onclick = () => { const d = document;
    if (d.fullscreenElement) d.exitFullscreen().catch(() => {}); else if (d.documentElement.requestFullscreen) d.documentElement.requestFullscreen().catch(() => {}); };
  el.querySelector('[data-t=end]').onclick = () => { if (taboo) { hFlashEnd(); tPause(true); endScreen(); } else if (P.fin) { P.card.remove(); P.card = null; P.fin = false; endScreen(); } else if (!P.card) endScreen(); };
  el.querySelector('[data-t=exit]').onclick = () => { location.hash = '#/board'; };
  P.onResize = () => { sizeUp(); if (taboo) fitWord(); else { layoutGrid(); if (P.card) fitCard(); } };
  P.onKey = onKey; P.onFs = () => tools();
  addEventListener('resize', P.onResize); addEventListener('keydown', P.onKey, true); document.addEventListener('fullscreenchange', P.onFs);
  tools(); sizeUp(); drawScores();
  if (taboo) { P.paused = game.stage === 'play'; drawTaboo(); if (game.stage === 'over') endScreen(); return; }   // carried on mid-turn: the clock waits for Space
  drawGrid(); drawPrompt();
  if (!P.data) dataFor(game.cfg.topics).then(d => { if (P && P.game === game) P.data = d; }).catch(() => {});   // for New question
  if (game.tiles.every(t => t.done)) allDone();
}
// Every square has been played: the final question (Categories), or the final scores
function allDone(){ const g = P.game; if (g.kind === 'cats' && g.final && g.final.stage !== 'done') return finalCard(); endScreen(); }
function tools(){
  if (!P) return;
  const s = P.el.querySelector('[data-t=sound]'), f = P.el.querySelector('[data-t=full]'), fs = !!document.fullscreenElement;
  s.innerHTML = (P.sound ? ICON.on : ICON.off) + '<span>' + (P.sound ? 'Sound on' : 'Sound off') + '</span>';
  f.innerHTML = (fs ? ICON.unfull : ICON.full) + '<span>' + (fs ? 'Exit full screen' : 'Full screen') + '</span>';
}
// Everything on the board is sized from the window, so it reads from the back of the room on any projector
function sizeUp(){ const u = Math.max(.55, Math.min(2.4, Math.min(innerWidth / 1280, innerHeight / 760))); P.u = u; P.el.style.setProperty('--u', u + 'px'); }
const save = () => { if (P) saveGame(P.game); if (C) C.touch(); };

function drawScores(bump){
  const g = P.game;
  P.scores.innerHTML = g.teams.map((t, i) => '<button type="button" class="bg-team-chip' + (i === g.turn ? ' turn' : '') + '" data-i="' + i + '" style="--tc:' + t.c + '" aria-label="' + esc(t.name) + ': ' + t.s + ' points' + (i === g.turn ? ', their turn' : '') + '. Change the score.">' +
    '<span class="nm">' + esc(t.name) + '</span><span class="sc' + (bump && bump[i] ? ' bump' : '') + '">' + t.s + '</span></button>').join('');
  P.scores.querySelectorAll('.bg-team-chip').forEach(b => b.onclick = () => scorePop(+b.dataset.i, b));
  if (bump) Object.keys(bump).forEach(i => { if (!bump[i]) return; const chip = P.scores.children[i], f = document.createElement('span');
    f.className = 'bg-float'; f.textContent = (bump[i] > 0 ? '+' : '') + bump[i]; chip.appendChild(f); setTimeout(() => f.remove(), 1500); });
}
function drawPrompt(){
  if (wordGame(P.game.kind)) return tPrompt();
  const g = P.game, left = g.tiles.filter(t => !t.done).length, t = g.teams[g.turn], cats = g.kind === 'cats';
  P.prompt.innerHTML = left ? '<b style="color:' + t.c + '">' + esc(t.name) + '</b>, choose a ' + (cats ? 'category and a value' : 'square')
    : cats && g.final && g.final.stage !== 'done' ? 'The final question' : cats ? 'Every question has been played!' : 'Every square is open!';
}
function layoutGrid(){
  const n = P.game.tiles.length, w = P.stage.clientWidth, h = P.stage.clientHeight;
  if (!w || !h) return;
  if (P.game.kind === 'cats') {   // Categories: a column for each category, its name on top
    const g = P.game, nc = g.cols.length, R = g.rows, gap = 10 * P.u, head = P.grid.querySelector('.bg-head');
    P.cols = nc; P.rows = R;
    P.grid.style.gridTemplateColumns = 'repeat(' + nc + ', minmax(0, 1fr))';
    P.grid.style.gridTemplateRows = 'auto repeat(' + R + ', minmax(0, 1fr))';
    const tw = (w - gap * (nc - 1)) / nc;
    P.grid.style.setProperty('--hf', Math.max(13, Math.min(26 * P.u, tw * .11)) + 'px');
    const th = (h - (head ? head.offsetHeight : 60) - gap * R) / R;
    P.grid.style.setProperty('--tf', Math.max(18, Math.min(tw * .3, th * .5)) + 'px');
    return;
  }
  let best = null;
  for (let c = 2; c <= 10; c++) { const r = Math.ceil(n / c), empty = c * r - n;
    const tw = w / c, th = h / r, score = Math.abs(Math.log((tw / th) / 1.45)) + empty * .12 + (empty >= c / 2 + .5 ? .5 : 0);
    if (!best || score < best.score) best = {c, r, score}; }
  P.cols = best.c; P.rows = best.r;
  P.grid.style.gridTemplateColumns = 'repeat(' + (best.c * 2) + ', 1fr)';
  P.grid.style.gridTemplateRows = 'repeat(' + best.r + ', 1fr)';
  const lastRow = n - (best.r - 1) * best.c;   // the last row is centred
  [...P.grid.children].forEach((b, i) => { const row = Math.floor(i / best.c), col = i % best.c;
    b.style.gridRow = String(row + 1);
    b.style.gridColumn = (row === best.r - 1 && lastRow < best.c ? (best.c - lastRow) + 1 + col * 2 : col * 2 + 1) + ' / span 2'; });
  const gap = 12 * P.u, tw = (w - gap * (best.c - 1)) / best.c, th = (h - gap * (best.r - 1)) / best.r;
  P.grid.style.setProperty('--tf', Math.max(18, Math.min(tw * .42, th * .55)) + 'px');
}
const tileName = t => P.game.kind === 'cats' ? P.game.cols[t.col] + ', ' + t.p : 'Square ' + t.n;
function tileInner(t){
  const g = P.game;
  if (t.empty) return '';
  if (!t.done) return '<span class="face front">' + (g.kind === 'cats' ? t.p : t.n) + '</span><span class="face back">' + (t.k === 'q' ? '?' : '★') + '</span>';
  const r = t.r || {}, team = g.teams[r.team];
  let res;
  if (r.sur) res = '<span class="pts">' + SURPRISES[r.sur].icon + '</span><span class="nm" style="color:var(--ink)">' + esc(r.text || SURPRISES[t.k].name) + '</span>' + (team ? '<span class="nm">' + esc(team.name) + '</span>' : '');
  else if (r.ok && team) res = '<span class="dot" style="--tc:' + team.c + '"></span><span class="pts">' + (r.pts ? '+' + r.pts : '✓') + '</span><span class="nm">' + esc(team.name) + '</span>';
  else res = '<span class="pts" style="color:var(--muted)">✗</span><span class="nm">No points</span>';
  return '<span class="face front"><span class="res">' + res + '</span></span>';
}
function drawGrid(){
  const g = P.game, cats = g.kind === 'cats';
  P.grid.classList.toggle('cats', cats);
  P.grid.innerHTML = g.tiles.map((t, i) => '<button type="button" class="bg-tile' + (t.done ? ' done' : '') + (t.empty ? ' empty' : '') + '" data-i="' + i + '"' +
    (cats ? ' style="grid-row:' + (t.row + 2) + ';grid-column:' + (t.col + 1) + '"' : '') + (t.empty ? ' tabindex="-1"' : '') +
    ' aria-label="' + esc(tileName(t) + (t.done ? ', open' : '')) + '"' + (t.done ? ' aria-disabled="true"' : '') + '><span class="in">' + tileInner(t) + '</span></button>').join('') +
    (cats ? g.cols.map((nm, c) => '<div class="bg-head" style="grid-row:1;grid-column:' + (c + 1) + '">' + esc(nm) + '</div>').join('') : '');
  P.grid.querySelectorAll('.bg-tile').forEach(b => b.onclick = () => openTile(+b.dataset.i));
  layoutGrid();
}
function redrawTile(i){
  const b = P.grid.children[i], t = P.game.tiles[i]; if (!b) return;
  b.className = 'bg-tile' + (t.done ? ' done' : ''); b.querySelector('.in').innerHTML = tileInner(t);
  b.setAttribute('aria-label', tileName(t) + (t.done ? ', open' : ''));
  if (t.done) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled');
}

// ---------- a square opens: flip, then the card zooms out of the square ----------
function openTile(i){
  if (!P || P.busy || P.card) return;
  const t = P.game.tiles[i]; if (!t || t.done) return;
  closePop(); P.busy = true; C.touch();
  const b = P.grid.children[i];
  b.classList.add('flip'); sfx(t.k === 'q' ? 'open' : 'surprise');
  setTimeout(() => { if (!P) return; P.busy = false;
    P.open = {i, turn: P.game.turn, team: P.game.turn, tried: [], shown: P.game.cfg.options !== 'hide', revealed: false, marked: false, award: true,
      double: t.k === 'double', sur: SURPRISES[t.k] && t.k !== 'double' && t.q ? t.k : null};
    if (t.k === 'q') questionCard(); else if (t.k === 'dd') ddCard(); else surpriseCard(); }, reduced() ? 60 : 420);
}
function zoomIn(card, instant){
  if (instant) { P.stage.appendChild(card); P.card = card; fitCard(); card.focus({preventScroll: true}); return; }
  const b = P.grid.children[P.open.i], s = P.stage.getBoundingClientRect(), r = b.getBoundingClientRect();
  card.classList.add('hush');
  card.style.transform = 'translate(' + (r.left - s.left) + 'px,' + (r.top - s.top) + 'px) scale(' + (r.width / s.width) + ',' + (r.height / s.height) + ')';
  P.stage.appendChild(card); P.card = card;
  card.getBoundingClientRect();
  card.classList.add('zoom'); card.style.transform = '';
  fitCard();
  setTimeout(() => { if (P && P.card === card) { card.classList.remove('hush'); fitCard(); card.focus({preventScroll: true}); } }, reduced() ? 0 : 400);
}
function zoomOut(then){
  const card = P.card, b = P.grid.children[P.open.i], s = P.stage.getBoundingClientRect(), r = b.getBoundingClientRect();
  stopTimer(); P.busy = true;
  card.classList.add('hush');
  card.style.transform = 'translate(' + (r.left - s.left) + 'px,' + (r.top - s.top) + 'px) scale(' + (r.width / s.width) + ',' + (r.height / s.height) + ')';
  card.style.opacity = '.2';
  setTimeout(() => { if (!P) return; card.remove(); P.card = null; P.busy = false; const i = P.open.i; P.open = null;
    b.classList.remove('flip'); redrawTile(i); b.focus({preventScroll: true}); then && then(); }, reduced() ? 0 : 430);
}
function nextTurn(r){ const g = P.game;
  if (g.kind === 'cats' && g.cfg.next !== 'turns') g.turn = r && r.ok && r.team != null ? r.team : P.open.turn;   // nobody right: the same team chooses again
  else g.turn = (P.open.turn + 1) % g.teams.length; }
function finishTile(result, bump){
  const g = P.game, t = g.tiles[P.open.i];
  t.done = true; t.r = result; nextTurn(result); save();
  zoomOut(() => { drawScores(bump); drawPrompt(); if (g.tiles.every(x => x.done)) setTimeout(() => { if (P && !P.card) allDone(); }, 900); });
}

// ---------- the question card ----------
const KIND = {word: 'What does it mean?', def: 'Which word?', zh: '中文 → English', gap: 'Fill the gap', tf: 'True or false', rw: 'Grammar Check', question: 'Answer the question', gk: 'General knowledge'};
function qBody(q){
  const instr = {word: 'What does this word mean?', def: 'Which word means this?', zh: 'Which English word is this?', gap: 'Which word fills the gap?',
    tf: 'True or false?', rw: 'Grammar check: is the grammar good or bad? (Not: is it true?)', question: 'Which answer does what the question asks?', gk: 'General knowledge'}[q.k];
  let text;
  if (q.k === 'word') text = '<p class="bg-text word">' + esc(q.w) + (q.pos ? '<small>' + esc(q.pos) + '</small>' : '') + '</p>';
  else if (q.k === 'def') text = '<p class="bg-text">' + esc(q.def) + '</p>';
  else if (q.k === 'zh') text = '<p class="bg-text word zh" lang="zh-CN">' + esc(q.zh) + '</p>';
  else if (q.k === 'gap') text = '<p class="bg-text">' + esc(q.s).replace(/_{3,}/, '<span class="bg-gap">&nbsp;</span>') + '</p>';
  else if (q.k === 'question' && q.cmd) { const s = esc(q.s), c = esc(q.cmd); text = '<p class="bg-text">' + (s.toLowerCase().startsWith(c.toLowerCase()) ? '<span class="cmdw">' + s.slice(0, c.length) + '</span>' + s.slice(c.length) : s) + '</p>'; }
  else text = '<p class="bg-text">' + esc(q.s) + '</p>';
  return '<p class="bg-instr">' + esc(instr) + '</p>' + text;
}
function qMore(q){
  if (q.k === 'word') return q.ex ? '<i>' + esc(q.ex) + '</i>' : '';
  if (q.k === 'def' || q.k === 'zh') return '<b>' + esc(q.w) + '</b>: ' + esc(q.def) + (q.k === 'zh' && q.ex ? ' <i>' + esc(q.ex) + '</i>' : '');
  if (q.k === 'rw') return q.fix ? '<b>Correct:</b> ' + esc(q.fix) : rich(q.why);
  return rich(q.why);
}
// "10 points", "⚡ 20 points", "🦝 10 points + Steal"
const ptsOf = (o, t) => o.wager != null ? o.wager : t.p * (o.double ? 2 : 1);
const ptsLabel = (o, t) => o.wager != null ? '🎯 ' + o.wager + ' points' :
  (o.double ? '⚡ ' : o.sur ? SURPRISES[o.sur].icon + ' ' : '') + t.p * (o.double ? 2 : 1) + ' points' + (o.sur ? ' + ' + SURPRISES[o.sur].name.replace('!', '') : '');
// The card's top line: Categories shows the category (and the kind of question, if that isn't the category)
const metaK = (t, q) => P.game.kind === 'cats' ? P.game.cols[t.col] : KIND[q.k];
const metaS = (t, q) => (P.game.kind === 'cats' && P.game.cols[t.col] !== KIND[q.k] ? KIND[q.k] + ' · ' : '') + metaOf(q);
const metaOf = q => [topicName(q.t), q.lv != null ? LEVEL_NAME[band(q.lv)] : '', q.focus || ''].filter(Boolean).join(' · ');
function questionCard(instant){
  const g = P.game, o = P.open, t = g.tiles[o.i], q = t.q, secs = +g.cfg.secs || 0;
  const card = document.createElement('div');
  card.className = 'bg-card'; card.tabIndex = -1; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', 'Question ' + t.n);
  card.innerHTML =
    '<div class="bg-card-top">' + (g.kind === 'cats' ? '' : '<span class="bg-num">' + t.n + '</span>') +
      '<div class="bg-meta"><span class="k">' + esc(metaK(t, q)) + '</span><span class="s">' + esc(metaS(t, q)) + '</span></div>' +
      '<button type="button" class="bg-btn small" data-a="swap" title="Put a different question on this square">New question</button>' +
      '<span class="bg-pts' + (o.double || o.wager != null ? ' double' : '') + '">' + ptsLabel(o, t) + '</span>' +
      (secs ? '<button type="button" class="bg-timer" title="Pause or restart the timer (Space)" aria-label="Timer"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="trk" cx="50" cy="50" r="42"/><circle class="arc" cx="50" cy="50" r="42"/></svg><span class="t"></span></button>' : '') +
      '<button type="button" class="bg-x" title="Close (Esc)" aria-label="Close">×</button></div>' +
    '<div class="bg-q">' + qBody(q) + '</div>' +
    '<div class="bg-opts' + (q.opts.length === 2 ? ' two' : '') + '"></div>' +
    '<p class="bg-more"></p>' +
    '<div class="bg-mark"><div class="bg-who"><span class="lab">Answering:</span>' + g.teams.map((tm, i) => '<button type="button" data-team="' + i + '" style="--tc:' + tm.c + '">' + esc(tm.name) + '</button>').join('') + '</div>' +
      '<div class="bg-acts">' +
        '<button type="button" class="bg-btn" data-a="show">Show answer <kbd>S</kbd></button>' +
        '<label class="bg-switch" title="Off: a right answer scores nothing"><input type="checkbox" data-a="award" checked><span class="tr"></span><span>Award points</span></label>' +
        '<button type="button" class="bg-btn right" data-a="right" data-first>✓ Right <kbd>Y</kbd></button>' +
        '<button type="button" class="bg-btn wrong" data-a="wrong">✗ Wrong <kbd>N</kbd></button>' +
      '</div><p class="bg-said" aria-live="polite"></p></div>';
  card.querySelector('.bg-x').onclick = () => closeQuestion();
  reportBtn(card, q);
  card.querySelector('[data-a=show]').onclick = () => reveal(null);
  card.querySelector('[data-a=right]').onclick = () => mark(true);
  card.querySelector('[data-a=wrong]').onclick = () => mark(false);
  card.querySelector('[data-a=swap]').onclick = () => swapQuestion();
  card.querySelector('[data-a=award]').onchange = e => { o.award = e.target.checked; drawWho(); };
  card.querySelectorAll('[data-team]').forEach(b => b.onclick = () => { if (o.tried.includes(+b.dataset.team) && !o.marked) return; o.team = +b.dataset.team; drawWho(); });
  const tb = card.querySelector('.bg-timer'); if (tb) tb.onclick = () => toggleTimer();
  drawOpts(card); zoomIn(card, instant); drawWho(); fitCard();
  startTimer(secs);
}
function drawOpts(card){
  card = card || P.card; const o = P.open, q = P.game.tiles[o.i].q, box = card.querySelector('.bg-opts');
  if (!o.shown) { box.innerHTML = '<button type="button" class="bg-btn solid bg-reveal-opts">Show the options <kbd>O</kbd></button>';
    box.querySelector('button').onclick = () => { o.shown = true; drawOpts(); fitCard(); }; return; }
  const two = q.opts.length === 2;
  box.innerHTML = q.opts.map((x, i) => '<button type="button" class="bg-opt" data-o="' + i + '" title="The team\'s answer">' + (two ? '' : '<span class="l">' + 'ABCD'[i] + '</span>') + '<span class="o">' + esc(x) + '</span></button>').join('');
  box.querySelectorAll('.bg-opt').forEach(b => b.onclick = () => reveal(+b.dataset.o));
  if (o.revealed || o.chosen != null || (o.out && o.out.length)) paintReveal();
}
function drawWho(){
  const o = P.open, card = P.card; if (!card || !card.querySelector('.bg-who')) return;
  const g = P.game, t = g.tiles[o.i], pts = ptsOf(o, t);
  card.querySelectorAll('[data-team]').forEach(b => { const i = +b.dataset.team, off = o.tried.includes(i) || !!o.over; b.setAttribute('aria-pressed', i === o.team && !o.over); b.disabled = off; b.style.opacity = off ? .4 : ''; });
  const r = card.querySelector('[data-a=right]'); r.innerHTML = '✓ Right' + (o.award ? ' +' + pts : '') + ' <kbd>Y</kbd>'; r.disabled = !!o.over;   // over: nobody else can answer
  const w = card.querySelector('[data-a=wrong]'); w.innerHTML = '✗ Wrong' + (o.award && (g.cfg.wrong === 'lose' || o.wager) ? ' −' + pts : '') + ' <kbd>N</kbd>';
  w.disabled = o.tried.length >= g.teams.length || !!o.over;
  const sw = card.querySelector('[data-a=swap]'); if (sw) sw.hidden = o.marked;   // until Right or Wrong is clicked (the teacher's marking buttons) (a disputed answer: put up another question)
}
// The teacher clicks the option the team chose. Right: it goes green and the explanation shows. Wrong: only that option goes
// red (crossed out once it's marked Wrong), so the right answer stays hidden for the next team (7 Nov 2026). Show answer: the
// right one, at any time.
function reveal(chosen){
  const o = P.open; if (!o || !P.card) return;
  if (!o.shown) { o.shown = true; drawOpts(); }
  const q = P.game.tiles[o.i].q;
  if (chosen != null) o.chosen = chosen;
  if (chosen == null || chosen === q.a) o.revealed = true;
  paintReveal(); stopTimer(true); drawWho();
  if (chosen != null && !o.over && !o.tried.includes(o.team)) { const ok = chosen === q.a; P.card.querySelector('[data-a=' + (ok ? 'right' : 'wrong') + ']').classList.add('hint');
    P.card.querySelector('[data-a=' + (ok ? 'wrong' : 'right') + ']').classList.remove('hint'); }
  fitCard();
}
function paintReveal(){
  const o = P.open, q = P.game.tiles[o.i].q, card = P.card, out = o.out || [], shown = !!o.revealed;
  card.querySelectorAll('.bg-opt').forEach((b, i) => { const bad = i !== q.a && (i === o.chosen || out.includes(i));
    b.classList.toggle('ok', shown && i === q.a); b.classList.toggle('no', bad); b.classList.toggle('out', i !== q.a && out.includes(i));
    b.classList.toggle('dim', shown && i !== q.a && !bad); });
  if (!shown) return;   // a wrong answer only: the gap and the explanation wait
  const gap = card.querySelector('.bg-gap'); if (gap) { gap.textContent = q.opts[q.a]; gap.classList.add('filled'); }
  card.querySelector('.bg-more').innerHTML = qMore(q);
}
function mark(ok){
  const o = P.open, g = P.game; if (!o || !P.card || P.busy) return;
  const t = g.tiles[o.i], pts = ptsOf(o, t), team = g.teams[o.team], said = P.card.querySelector('.bg-said');
  if (o.over) return;   // the answer is out and nobody else can answer: close the question
  P.card.querySelectorAll('.hint').forEach(b => b.classList.remove('hint'));
  if (ok) {
    const got = o.award ? pts : 0; team.s += got;
    if (!o.revealed) reveal(null);
    said.className = 'bg-said good'; said.textContent = got ? '✓ ' + team.name + ' +' + got : '✓ ' + team.name + ' (no points)';
    sfx('right'); stopTimer(true);
    P.busy = true;
    setTimeout(() => { if (!P) return; P.busy = false; if (o.sur && got) rewardCard(got); else finishTile({ok: true, team: o.team, pts: got}, {[o.team]: got}); }, 1100);
    return;
  }
  if (o.tried.includes(o.team) || o.over) return;
  const lost = o.award && (g.cfg.wrong === 'lose' || o.wager != null) ? Math.min(pts, team.s) : 0;   // a Daily Double's bet is always lost
  team.s -= lost; o.tried.push(o.team); o.marked = true; o.lost = (o.lost || {}); if (lost) o.lost[o.team] = -lost;
  const q = t.q;   // the answer they chose is out for the next team
  if (o.chosen != null && o.chosen !== q.a && !(o.out || []).includes(o.chosen)) o.out = (o.out || []).concat(o.chosen);
  o.chosen = null; paintReveal();
  sfx('wrong'); stopTimer(true); save(); drawScores(lost ? {[o.team]: -lost} : null);
  const left = g.teams.map((_, i) => i).filter(i => !o.tried.includes(i));
  const one = q.opts.length === 2 || q.opts.length - (o.out || []).length <= 1;   // True or false, or only one option left: the answer is plain
  said.className = 'bg-said bad';
  said.textContent = '✗ ' + team.name + (lost ? ' −' + lost : '') + (!left.length ? '. Nobody got it. Here is the answer.' : one ? '. That leaves only one answer, so here it is.' : '. Another team can try, or close the question.');
  if (!left.length || one) { o.over = true; reveal(null); }
  else { const after = left.find(i => i > o.team); o.team = after != null ? after : left[0]; }
  P.card.querySelector('.bg-x').title = 'Close the question (Esc)';
  drawWho(); fitCard();
}
function closeQuestion(){
  const o = P.open; if (!o || P.busy) return;
  if (!o.marked) {   // nobody has answered: the square goes back as it was
    P.busy = true; stopTimer();
    zoomOut(() => {}); return;
  }
  finishTile({ok: false, team: o.tried[o.tried.length - 1], pts: 0}, null);
}
function swapQuestion(){
  const o = P.open, g = P.game, t = g.tiles[o.i], said = P.card.querySelector('.bg-said');
  if (o.marked || P.busy) return;
  if (!P.data) { said.className = 'bg-said'; said.textContent = 'Still loading the other questions. Try again in a moment.'; return; }
  const used = new Set(g.used || []), cur = t.q.t + '|' + t.q.b + '|' + t.q.id;
  used.add(cur);
  const cats = g.kind === 'cats', same = Object.assign({}, g.cfg, {banks: [t.q.b], topics: [t.q.t]}, cats && t.lvl ? {levels: [t.lvl]} : {});
  let q = draw(same, P.data, 1, used)[0] || (cats ? drawAt(catCols(g.cfg)[t.col], t.lvl, g.cfg, P.data, used) : draw(g.cfg, P.data, 1, used)[0]);
  if (!q) { said.className = 'bg-said'; said.textContent = 'There are no more questions to swap in.'; return; }
  g.used = [...used]; t.q = q; if (g.cfg.points === 'level') t.p = POINTS_BY_LEVEL[band(q.lv)] || 20;
  save();
  const card = P.card, secs = +g.cfg.secs || 0;
  card.querySelector('.bg-q').innerHTML = qBody(q);
  card.querySelector('.bg-meta .k').textContent = metaK(t, q);
  card.querySelector('.bg-meta .s').textContent = metaS(t, q);
  card.querySelector('.bg-pts').textContent = ptsLabel(o, t);
  card.querySelector('.bg-opts').className = 'bg-opts' + (q.opts.length === 2 ? ' two' : '');
  card.querySelector('.bg-more').innerHTML = ''; o.chosen = null; o.revealed = false; o.out = []; o.over = false; o.shown = g.cfg.options !== 'hide';
  card.querySelectorAll('.hint').forEach(b => b.classList.remove('hint'));
  said.className = 'bg-said'; said.textContent = ''; drawOpts(); drawWho(); fitCard(); startTimer(secs); reportBtn(card, q);
}
// Big text that still fits: the options shrink until they fit their half of the card, then the question fills the rest
function fitCard(){
  const card = P && P.card; if (!card) return;
  const u = P.u, opts = card.querySelector('.bg-opts'), q = card.querySelector('.bg-q'), text = card.querySelector('.bg-text');
  if (opts && opts.querySelector('.bg-opt')) {
    const os = [...opts.querySelectorAll('.o')], two = opts.classList.contains('two');
    // the options get up to 60% of the space between the top line and the marking bar (a third for True/False), the question the rest
    const cs = getComputedStyle(card), top = card.querySelector('.bg-card-top'), mk = card.querySelector('.bg-mark');
    const more = card.querySelector('.bg-more'), moreH = more && more.textContent.trim() ? more.offsetHeight + (parseFloat(cs.rowGap) || 0) : 0;
    const middle = card.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - (top ? top.offsetHeight : 0) - (mk ? mk.offsetHeight : 0) - 3 * (parseFloat(cs.rowGap) || 0) - moreH;
    const rows = two ? 1 : Math.ceil(opts.querySelectorAll('.bg-opt').length / 2);
    opts.style.maxHeight = Math.max(rows * 76 * u + (rows - 1) * 12 * u, middle * (two ? .34 : .6)) + 'px';
    let s = (two ? 54 : 34) * u; const min = 13 * u;
    os.forEach(x => { x.style.fontSize = s + 'px'; });
    for (let k = 0; k < 30 && s > min && (opts.scrollHeight > opts.clientHeight + 1 || os.some(x => x.scrollWidth > x.clientWidth + 1)); k++) { s = Math.max(min, s * .92); os.forEach(x => { x.style.fontSize = s + 'px'; }); }
  }
  if (text && q) {
    q.style.overflow = 'hidden';
    const len = text.textContent.length, word = text.classList.contains('word');
    let s = (word ? (len < 14 ? 130 : 96) : len < 50 ? 64 : len < 110 ? 52 : 42) * u; const min = 15 * u;
    text.style.fontSize = s + 'px';
    // .bg-q centres its content, so overflow is measured from the children (scrollHeight misses what spills over the top)
    const gap = parseFloat(getComputedStyle(q).rowGap) || 0;
    const over = () => [...q.children].reduce((a, e) => a + e.offsetHeight, 0) + gap * (q.children.length - 1) > q.clientHeight + 1 || text.scrollWidth > text.clientWidth + 1;
    for (let k = 0; k < 40 && s > min && over(); k++) { s = Math.max(min, s * .92); text.style.fontSize = s + 'px'; }
  }
}

// ---------- Report (7 Nov 2026): a small button in the corner of the question card ----------
// One click: "Reported ✓", and the game carries on (no reasons to choose). The question goes to the Reports page on the
// teacher page, as a report from "You", with the question, its options and its answer; Remove there takes it out of every
// game, these boards included. The board remembers what it has reported (g.reported).
const repGame = q => { const b = BANKS.find(x => x.key === q.b); return b ? b.hid[0] : q.b; };
const repKey = q => q.t + '|' + repGame(q) + '|' + q.id;
const devId = () => { let d = ''; try { d = localStorage.getItem('aeaDevice') || '';
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(d)) { d = 'd' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36); localStorage.setItem('aeaDevice', d); } } catch (e) {} return d; };
function reportBtn(card, q){
  let b = card.querySelector('.bg-report');
  if (!b) { b = document.createElement('button'); b.type = 'button'; b.className = 'bg-report'; card.appendChild(b); }
  const done = (P.game.reported || []).includes(repKey(q));
  b.textContent = done ? 'Reported ✓' : '⚑ Report'; b.disabled = done;
  b.title = done ? 'This question is on your Reports page' : 'Report this question: it goes to your Reports page';
  b.onclick = () => sendReport(card, q, b);
}
function sendReport(card, q, b){
  const g = P.game, key = repKey(q);
  if ((g.reported || []).includes(key) || b.dataset.sending) return;
  b.dataset.sending = '1'; b.textContent = 'Reported ✓'; b.disabled = true;
  let token = null, api = '';
  try { const a = JSON.parse(localStorage.getItem('aea:account:teacher')); token = a && a.token && a.until > Date.now() ? a.token : null; } catch (e) {}
  try { api = localStorage.getItem('aea:api') || ''; } catch (e) {}
  api = (api || 'https://api.academicenglishapp.com').replace(/\/+$/, '');
  const box = card.querySelector('.bg-q'), shown = (box ? box.innerText.trim() : '') + (q.opts ? '\nOptions: ' + q.opts.join(' | ') : '');
  fetch(api + '/api/report', {method: 'POST', headers: Object.assign({'Content-Type': 'application/json'}, token ? {Authorization: 'Bearer ' + token} : {}),
    body: JSON.stringify({topic: q.t, game: repGame(q), item: String(q.id), reason: 'other', comment: 'Reported from a board game (' + GAME_TYPES[gameType(g)].name + ').',
      shown, chosen: '', feedback: q.opts ? 'Answer: ' + q.opts[q.a] : '', side: 'en', page: '', pageName: topicName(q.t), gameName: 'Board game: ' + (KIND[q.k] || q.k),
      level: q.lv != null ? LEVEL_NAME[band(q.lv)] || '' : '', device: devId()})})
    .then(r => { if (!r.ok) throw new Error('not sent');
      if (P && P.game === g) { g.reported = (g.reported || []).concat(key); save(); } })
    .catch(() => { if (b.isConnected) { b.textContent = '⚑ Not sent: try again'; b.disabled = false; } })
    .then(() => { delete b.dataset.sending; });
}

// ---------- the timer ----------
function startTimer(secs){
  stopTimer();
  const card = P.card, tb = card && card.querySelector('.bg-timer'); if (!tb || !secs) return;
  P.timer = {total: secs, left: secs, run: true};
  paintTimer(); runTimer();
}
function runTimer(){
  clearInterval(P.tick);
  P.tick = setInterval(() => { const T = P && P.timer; if (!T || !T.run) return;
    T.left--; paintTimer();
    if (T.left > 0 && T.left <= 5) sfx('tick');
    if (T.left <= 0) { T.run = false; clearInterval(P.tick); sfx('up'); } }, 1000);
}
function stopTimer(keep){ clearInterval(P && P.tick); if (P && P.timer) { P.timer.run = false; if (keep) { P.timer.stopped = true; paintTimer(); } else P.timer = null; } }
// Click the timer (or Space): pause and carry on; once it has run out or been stopped by an answer, it starts again (for the next team)
function toggleTimer(){
  const T = P.timer, secs = +P.game.cfg.secs || 0;
  if (!secs || !P.card) return;
  if (!T || T.left <= 0 || T.stopped) return startTimer(secs);
  T.run = !T.run; paintTimer();
  if (T.run) runTimer();
}
function paintTimer(){
  const T = P.timer, tb = P.card && P.card.querySelector('.bg-timer'); if (!T || !tb) return;
  const C2 = 2 * Math.PI * 42, arc = tb.querySelector('.arc');
  arc.style.strokeDasharray = C2; arc.style.strokeDashoffset = C2 * (1 - Math.max(0, T.left) / T.total);
  tb.querySelector('.t').innerHTML = T.left > 0 ? T.left : 'Time\'s<br>up!';
  tb.classList.toggle('low', T.left > 0 && T.left <= 5 && T.run);
  tb.classList.toggle('up', T.left <= 0);
  tb.classList.toggle('paused', !T.run && !T.stopped && T.left > 0);
  tb.setAttribute('aria-label', T.left > 0 ? T.left + ' seconds left' + (T.run ? '' : ', paused') : 'Time is up');
}

// ---------- surprise squares ----------
// Oops happens straight away. Every other surprise says what's on offer, then shows its question (Double: for double points);
// a right answer with Award points on earns the question's points and then the surprise (rewardCard). Nobody right: no surprise.
const surpriseAmt = () => P.game.cfg.points === 'same' ? 10 : 20;
const surpriseShell = (n, S, x) => '<div class="bg-card-top"><span class="bg-num">' + n + '</span><span style="flex:1"></span><button type="button" class="bg-x" title="' + x + ' (Esc)" aria-label="' + x + '">×</button></div>' +
  '<div class="bg-sp-icon" aria-hidden="true">' + S.icon + '</div><p class="bg-sp-name">' + S.name + '</p>';
function newCard(label){ const c = document.createElement('div'); c.className = 'bg-card surprise'; c.tabIndex = -1; c.setAttribute('role', 'dialog'); c.setAttribute('aria-label', label); return c; }
function surpriseCard(){
  const g = P.game, o = P.open, t = g.tiles[o.i], S = SURPRISES[t.k], amt = surpriseAmt();
  const card = newCard('Surprise: ' + S.name);
  if (t.q) {   // a question first
    const offer = {double: 'This question is worth <b>' + t.p * 2 + ' points</b>.',
      bonus: 'Answer the question right to win <b>' + amt + ' extra points</b>.',
      steal: 'Answer the question right, then take <b>' + amt + ' points</b> from another team.',
      give: 'Answer the question right, then give <b>' + amt + ' points</b> to another team.',
      swap: 'Answer the question right, then you can <b>swap scores</b> with another team.'}[t.k] || '';
    card.innerHTML = surpriseShell(t.n, S, 'Put it back') + '<p class="bg-sp-text">' + offer + '</p>' +
      '<div class="bg-sp-pick"><button type="button" class="bg-btn solid" data-go="q">Show the question</button></div>';
    card.querySelector('.bg-x').onclick = () => closeSurprise();
    card.querySelector('[data-go=q]').onclick = () => { if (P.busy) return; card.remove(); P.card = null; questionCard(true); };   // the question takes its place, no second zoom
  } else chooseSurprise(card, t.k, true, (text, bump) => finishTile({sur: t.k, team: o.team, text}, bump));   // Oops (and squares from games saved before 6 Nov b)
  zoomIn(card);
}
// After a right answer: the team that answered gets the surprise (the question's points are already theirs)
function rewardCard(got){
  const g = P.game, o = P.open, t = g.tiles[o.i];
  o.reward = got;
  const card = newCard(SURPRISES[t.k].name);
  P.card.remove(); P.card = null;
  chooseSurprise(card, t.k, false, (text, bump) => {
    bump[o.team] = (bump[o.team] || 0) + got;
    finishTile({ok: true, sur: t.k, team: o.team, pts: got, text: t.k === 'bonus' ? '+' + (got + surpriseAmt()) : '+' + got + (text ? ' · ' + text : '')}, bump); });
  zoomIn(card, true);
}
// × or Esc on a surprise: before the question, the square goes back; after a right answer, the team keeps the question's points but not the surprise
function closeSurprise(){
  const o = P.open; if (!o || P.busy) return;
  if (o.reward != null) return finishTile({ok: true, team: o.team, pts: o.reward}, {[o.team]: o.reward});
  zoomOut(() => {});
}
// What the surprise does to the scores, chosen on the card. done(text for the square, score changes)
function chooseSurprise(card, kind, otherTeam, done){
  const g = P.game, o = P.open, t = g.tiles[o.i], S = SURPRISES[kind], amt = surpriseAmt(), reward = o.reward != null;
  const draw = () => {
    const team = g.teams[o.team], others = g.teams.map((x, i) => i).filter(i => i !== o.team);
    const pickBtns = () => '<div class="bg-sp-pick">' + others.map(i => '<button type="button" data-pick="' + i + '" style="--tc:' + g.teams[i].c + '">' + esc(g.teams[i].name) + '<span>' + g.teams[i].s + '</span></button>').join('') + '</div>';
    const who = '<b>' + esc(team.name) + '</b>';
    let text = '', acts = '';
    if (kind === 'bonus') { text = who + (reward ? ' win ' : ' get ') + amt + ' extra points!'; acts = '<button type="button" class="bg-btn solid" data-go="bonus">Add ' + amt + ' points</button>'; }
    else if (kind === 'oops') { text = who + ' lose ' + amt + ' points.'; acts = '<button type="button" class="bg-btn solid" data-go="oops">Take ' + Math.min(amt, team.s) + ' points</button><button type="button" class="bg-btn" data-go="skip">Let them off</button>'; }
    else if (kind === 'steal') { text = who + ': choose a team to take ' + amt + ' points from.'; acts = pickBtns(); }
    else if (kind === 'give') { text = who + ': choose a team to give ' + amt + ' points to.'; acts = pickBtns(); }
    else if (kind === 'swap') { text = who + ' (' + team.s + '): swap scores with any team, or keep your own.'; acts = pickBtns() + '<button type="button" class="bg-btn" data-go="skip">Keep our score</button>'; }
    card.innerHTML = surpriseShell(t.n, S, reward ? 'Close without the surprise' : 'Put it back') +
      (reward ? '<p class="bg-sp-text" style="font-size:calc(22 * var(--u))">✓ Right! +' + o.reward + ' points</p>' : '') +
      '<p class="bg-sp-text">' + text + '</p><div class="bg-sp-pick" style="gap:8px">' + acts + '</div>' +
      (otherTeam ? '<p class="note" style="color:#151935;opacity:.75">For a different team: <span class="bg-sp-for"></span></p>' : '');
    const forBox = card.querySelector('.bg-sp-for');
    if (forBox) { forBox.innerHTML = g.teams.map((x, i) => i === o.team ? '' : '<a href="#" data-for="' + i + '" style="color:#151935;font-weight:700;margin-right:10px">' + esc(x.name) + '</a>').join('');
      forBox.querySelectorAll('[data-for]').forEach(a => a.onclick = e => { e.preventDefault(); o.team = +a.dataset.for; draw(); }); }
    card.querySelector('.bg-x').onclick = () => closeSurprise();
    card.querySelectorAll('[data-go],[data-pick]').forEach(b => b.onclick = () => apply(b.dataset.go || kind, b.dataset.pick != null ? +b.dataset.pick : null));
  };
  const apply = (what, other) => {
    if (P.busy) return;
    const me = g.teams[o.team], bump = {};
    let text = '';
    if (what === 'bonus') { me.s += amt; bump[o.team] = amt; text = '+' + amt; }
    else if (what === 'oops') { const x = Math.min(amt, me.s); me.s -= x; bump[o.team] = -x; text = x ? '−' + x : 'Nothing to lose'; }
    else if (what === 'steal') { const th = g.teams[other], x = Math.min(amt, th.s); th.s -= x; me.s += x; bump[o.team] = x; bump[other] = -x; text = x ? 'Stole ' + x : 'Nothing to take'; }
    else if (what === 'give') { g.teams[other].s += amt; bump[other] = amt; text = 'Gave ' + amt; }
    else if (what === 'swap') { const th = g.teams[other], a = me.s, b = th.s; me.s = b; th.s = a; bump[o.team] = b - a; bump[other] = a - b; text = 'Swapped scores'; }
    else if (what === 'skip') { text = kind === 'swap' ? 'Kept their score' : 'Let off'; }
    sfx(what === 'oops' ? 'wrong' : what === 'skip' ? 'open' : 'right');
    Object.keys(bump).forEach(k => { if (!bump[k]) delete bump[k]; });
    done(text, bump);
  };
  draw();
}

// ---------- changing a score (click a team on the scoreboard) ----------
function closePop(){ const p = document.querySelector('.bg-pop'); if (p) p.remove(); if (P) P.popFor = null; }
function scorePop(i, chip){
  if (P.popFor === i) return closePop();
  closePop(); C.touch();
  const g = P.game, t = g.teams[i], pop = document.createElement('div');
  pop.className = 'bg-pop'; pop.style.setProperty('--tc', t.c); pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Change ' + t.name + '\'s score');
  pop.innerHTML = '<div class="hd"><span class="sw"></span><input type="text" maxlength="30" aria-label="Team name" value="' + esc(t.name) + '"></div>' +
    '<div class="sc-row"><button type="button" class="step" data-d="-5">−5</button><button type="button" class="step" data-d="-1">−1</button>' +
    '<input type="number" inputmode="numeric" aria-label="Score" value="' + t.s + '">' +
    '<button type="button" class="step" data-d="1">+1</button><button type="button" class="step" data-d="5">+5</button></div>' +
    '<div class="row">' + (g.turn === i ? '' : '<button type="button" class="bg-btn" data-turn>Make it their turn</button>') + '<button type="button" class="bg-btn solid" data-done>Done</button></div>';
  document.body.appendChild(pop);
  const r = chip.getBoundingClientRect();
  pop.style.top = Math.min(innerHeight - pop.offsetHeight - 10, r.bottom + 10) + 'px';
  pop.style.left = Math.max(10, Math.min(innerWidth - pop.offsetWidth - 10, r.left + r.width / 2 - pop.offsetWidth / 2)) + 'px';
  P.popFor = i;
  const score = pop.querySelector('input[type=number]'), name = pop.querySelector('input[type=text]');
  const set = v => { t.s = Math.round(+v || 0); score.value = t.s; save(); drawScores(); };
  pop.querySelectorAll('[data-d]').forEach(b => b.onclick = () => set(t.s + +b.dataset.d));
  score.oninput = () => { if (score.value !== '' && !isNaN(+score.value)) { t.s = Math.round(+score.value); save(); drawScores(); } };
  name.oninput = () => { t.name = name.value.trim() || t.name; save(); drawScores(); drawPrompt(); (g.tiles || []).forEach((x, k) => { if (x.done) redrawTile(k); }); };
  const tb = pop.querySelector('[data-turn]'); if (tb) tb.onclick = () => { g.turn = i; save(); drawScores(); drawPrompt(); closePop(); };
  pop.querySelector('[data-done]').onclick = closePop;
  score.focus(); score.select();
  setTimeout(() => { const away = e => { if (!document.body.contains(pop)) return document.removeEventListener('pointerdown', away, true);
    if (!pop.contains(e.target) && !(e.target.closest && e.target.closest('.bg-team-chip'))) { closePop(); document.removeEventListener('pointerdown', away, true); } };
    document.addEventListener('pointerdown', away, true); }, 0);
}

// ---------- final scores ----------
function endScreen(){
  if (!P || (P.card && !wordGame(P.game.kind))) return;
  closePop();
  const g = P.game, ranked = g.teams.map((t, i) => Object.assign({i}, t)).sort((a, b) => b.s - a.s);
  const top = ranked[0].s, winners = ranked.filter(t => t.s === top);
  let place = 0;
  const rows = ranked.map((t, k) => { if (k === 0 || t.s !== ranked[k - 1].s) place = k + 1;
    return '<li class="' + (t.s === top ? 'win' : '') + '" style="--tc:' + t.c + ';animation-delay:' + (k * .12) + 's"><span class="p">' + (t.s === top ? '🏆' : place) + '</span><span class="n">' + esc(t.name) + '</span><span class="s">' + t.s + '</span></li>'; }).join('');
  const taboo = wordGame(g.kind), cats = g.kind === 'cats', finalLeft = cats && g.final && g.final.stage !== 'done' ? 1 : 0;
  const left = taboo ? (g.stage === 'over' ? 0 : 1) : g.tiles.filter(t => !t.done).length + finalLeft;
  const end = document.createElement('div');
  end.className = 'bg-end';
  end.innerHTML = '<div class="bg-confetti" aria-hidden="true"></div>' +
    '<h2>' + (winners.length === g.teams.length ? 'It\'s a draw!' : winners.length > 1 ? 'A tie for first place!' : esc(winners[0].name) + ' win!') + '</h2>' +
    '<p class="sub">' + (taboo ? (left ? 'The game was ended early' : 'Final scores') : cats ? (left ? 'Ended early: ' + left + ' question' + (left === 1 ? '' : 's') + ' not played' + (finalLeft ? ' (with the final question)' : '') : 'Final scores') : left ? left + ' square' + (left === 1 ? '' : 's') + ' not opened' : 'Final scores') + '</p>' +
    '<div class="bg-rank"><ol>' + rows + '</ol></div>' +
    '<div class="acts">' + (taboo && !left ? '' : '<button type="button" class="bg-btn" data-e="back">Back to the ' + (taboo ? 'game' : 'board') + '</button>') +
      '<button type="button" class="bg-btn" data-e="again">Play again (new ' + (taboo ? 'words' : 'questions') + ')</button><button type="button" class="bg-btn solid" data-e="done">Finish</button></div>';
  P.stage.appendChild(end); P.endEl = end;
  if (!reduced()) { const box = end.querySelector('.bg-confetti'), cols = winners.map(w => w.c).concat(['#ffe14d', '#ffffff']);
    for (let k = 0; k < 90; k++) { const c = document.createElement('i'); c.style.left = Math.random() * 100 + '%'; c.style.background = pick(cols);
      c.style.animationDuration = (2.4 + Math.random() * 2.6) + 's'; c.style.animationDelay = (Math.random() * 1.2) + 's'; c.style.transform = 'rotate(' + Math.random() * 360 + 'deg)'; box.appendChild(c); } }
  sfx('win');
  const back = end.querySelector('[data-e=back]'); if (back) back.onclick = () => { end.remove(); P.endEl = null; if (taboo) drawTaboo(); else if (finalLeft && g.tiles.every(t => t.done)) finalCard(); };
  end.querySelector('[data-e=again]').onclick = () => {
    const set = setOf(g.set); if (!set) return;
    end.querySelector('.acts').innerHTML = '<p class="sub">Getting new ' + (taboo ? 'words' : 'questions') + '…</p>';
    (taboo ? tabooData(set.topics) : dataFor(set.topics)).then(data => { const n = taboo ? newTabooGame(set, data) : newGame(set, data); n.teams = g.teams.map(t => Object.assign({}, t, {s: 0})); saveGame(n); mount(n, data); })
      .catch(x => { end.querySelector('.acts').innerHTML = '<p class="err">' + esc(x.message) + '</p>'; });
  };
  end.querySelector('[data-e=done]').onclick = () => { dropGame(g.set); location.hash = '#/board'; };
  (end.querySelector('[data-e=' + (left ? 'back' : 'done') + ']') || end.querySelector('[data-e=done]')).focus({preventScroll: true});
}

// ---------- keys (a laptop at the front, or a keyboard by the board) ----------
function onKey(e){
  if (!P) return;
  if (e.target && (e.target.matches('input:not([type=checkbox]), textarea, select') || e.target.isContentEditable)) { if (e.key === 'Escape') closePop(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key, card = P.card;
  if (P.endEl) { if (k === 'Escape') { P.endEl.remove(); P.endEl = null; e.preventDefault(); } return; }
  if (document.querySelector('.bg-pop')) { if (k === 'Escape') { closePop(); e.preventDefault(); } return; }
  if (P.fin) { const lk = k.toLowerCase(), b = P.card && P.card.querySelector(lk === 's' ? '[data-a=show]' : lk === 'o' ? '[data-a=opts]' : 'x-none');
    if (b) { e.preventDefault(); b.click(); } return; }
  if (P.game.kind === 'hints') return hKey(e);
  if (P.game.kind === 'taboo') return tKey(e);
  if (card && P.open) {
    const isQ = !card.classList.contains('surprise');
    if (k === 'Escape') { e.preventDefault(); if (isQ) closeQuestion(); else closeSurprise(); return; }
    if (!isQ) return;
    const lk = k.toLowerCase();
    if (k === ' ') { e.preventDefault(); toggleTimer(); return; }
    if (lk === 's') { e.preventDefault(); reveal(null); return; }
    if (lk === 'o') { e.preventDefault(); if (!P.open.shown) { P.open.shown = true; drawOpts(); fitCard(); } return; }
    if (lk === 'y') { e.preventDefault(); mark(true); return; }
    if (lk === 'n') { e.preventDefault(); mark(false); return; }
    const q = P.game.tiles[P.open.i].q, idx = 'abcd'.indexOf(lk) >= 0 ? 'abcd'.indexOf(lk) : '1234'.indexOf(k);
    if (idx >= 0 && idx < q.opts.length && P.open.shown) { e.preventDefault(); reveal(idx); }
    return;
  }
  // The board: type a square's number (two digits within a second), or move with the arrow keys
  if (/^[0-9]$/.test(k) && P.game.kind !== 'cats') {
    e.preventDefault(); clearTimeout(P.keyWait); P.keyBuf = (P.keyBuf + k).slice(-2);
    const n = +P.keyBuf, max = P.game.tiles.length, go = () => { const i = P.game.tiles.findIndex(t => t.n === +P.keyBuf); P.keyBuf = ''; if (i >= 0) openTile(i); };
    if (P.keyBuf.length === 2 || n * 10 > max) go(); else P.keyWait = setTimeout(go, 900);
    return;
  }
  if (/^Arrow/.test(k)) {
    const tiles = [...P.grid.querySelectorAll('.bg-tile')], cur = tiles.indexOf(document.activeElement), c = P.cols || 5;
    let i = cur < 0 ? 0 : cur + ({ArrowRight: 1, ArrowLeft: -1, ArrowDown: c, ArrowUp: -c})[k];
    i = Math.max(0, Math.min(tiles.length - 1, i)); tiles[i].focus(); e.preventDefault();
  }
}

// =====================================================================================================================
// ---------- Categories: the Daily Double (7 Nov 2026) ----------
// Hidden under a square. The team that chose it answers on its own, for a bet: up to its score, or the top value on the board
// if that is more (as on TV). Right wins the bet; wrong loses it (whatever the board says about wrong answers).
function ddCard(){
  const g = P.game, o = P.open, t = g.tiles[o.i], card = newCard('Daily Double');
  const maxOf = () => Math.max(g.teams[o.team].s, g.rows * 100);
  const go = () => {
    if (P.busy || !P.card) return;
    o.wager = Math.max(0, Math.min(maxOf(), Math.round(+card.querySelector('.cd-go input').value || 0)));
    o.tried = g.teams.map((x, i) => i).filter(i => i !== o.team);   // only this team answers
    card.remove(); P.card = null; questionCard(true);
  };
  const draw = () => {
    const team = g.teams[o.team], max = maxOf();
    const vals = [...new Set(Array.from({length: g.rows}, (_, r) => (r + 1) * 100).filter(v => v <= max).concat([max]))];
    card.innerHTML = '<div class="bg-card-top"><span style="flex:1"></span><button type="button" class="bg-x" title="Put it back (Esc)" aria-label="Put it back">×</button></div>' +
      '<div class="bg-sp-icon" aria-hidden="true">🎯</div><p class="bg-sp-name">Daily Double!</p>' +
      '<p class="bg-sp-text"><b>' + esc(team.name) + '</b> answer this one on their own. How many points do they bet? Up to ' + max + '.</p>' +
      '<div class="bg-sp-pick">' + vals.map(v => '<button type="button" data-bet="' + v + '" style="--tc:#151935">' + v + (v === max && v > g.rows * 100 ? ' (all)' : '') + '</button>').join('') + '</div>' +
      '<div class="cd-go"><input type="number" inputmode="numeric" min="0" max="' + max + '" step="10" value="' + Math.min(t.p, max) + '" aria-label="The bet">' +
        '<button type="button" class="bg-btn solid" data-go>Bet and show the question</button></div>' +
      '<p class="note" style="color:#151935;opacity:.75">For a different team: ' + g.teams.map((x, i) => i === o.team ? '' :
        '<a href="#" data-for="' + i + '" style="color:#151935;font-weight:700;margin-right:10px">' + esc(x.name) + '</a>').join('') + '</p>';
    const inp = card.querySelector('.cd-go input'), gb = card.querySelector('[data-go]');
    card.querySelectorAll('[data-bet]').forEach(b => b.onclick = () => { inp.value = b.dataset.bet; gb.focus(); });
    card.querySelectorAll('[data-for]').forEach(a => a.onclick = e => { e.preventDefault(); o.team = +a.dataset.for; draw(); });
    card.querySelector('.bg-x').onclick = () => closeSurprise();
    gb.onclick = go;
    inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); go(); } };
  };
  draw(); zoomIn(card);
}

// ---------- Categories: the final question ----------
// When the board is finished: the category is shown, every team writes down a bet (0 up to its score) and the teacher types
// the bets in; then the question, every team writes its answer; Show the answer; the teacher marks each team ✓ or ✗ and the
// bets are added or taken away. Saved as it goes (g.final: stage bet / q / done, bets, marks, shown, opts).
function finalCard(){
  const g = P.game, F = g.final; if (!F) return endScreen();
  if (P.card) P.card.remove();
  closePop(); P.prompt.textContent = 'The final question';
  const card = document.createElement('div');
  card.className = 'bg-card cf'; card.tabIndex = -1; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', 'The final question');
  P.card = card; P.fin = true;
  const top = '<div class="bg-card-top"><div class="bg-meta"><span class="k">The final question · ' + esc(F.col) + '</span><span class="s">' + esc(metaOf(F.q)) + '</span></div></div>';
  if (F.stage === 'bet') {
    card.innerHTML = top + '<div class="cf-bet"><p class="cf-h">The final question</p><p class="cf-cat">' + esc(F.col) + '</p>' +
      '<p class="cf-how">Each team writes down a bet, from 0 up to its score. A right answer wins the bet; a wrong answer loses it. Type in the bets:</p>' +
      '<div class="cf-teams">' + g.teams.map((t, i) => '<label class="cf-team" style="--tc:' + t.c + '"><span>' + esc(t.name) + ' <small>' + t.s + '</small></span>' +
        '<input type="number" inputmode="numeric" min="0" max="' + t.s + '" step="10" placeholder="0" value="' + (F.bets[i] != null ? F.bets[i] : '') + '" data-bet="' + i + '" aria-label="' + esc(t.name) + ': bet"></label>').join('') + '</div>' +
      '<button type="button" class="bg-btn solid tb-go" data-go>Show the question</button></div>';
    card.querySelectorAll('[data-bet]').forEach(inp => {
      const i = +inp.dataset.bet, t = g.teams[i];
      inp.oninput = () => { F.bets[i] = Math.max(0, Math.min(t.s, Math.round(+inp.value || 0))); save(); };
      inp.onchange = () => { if (inp.value !== '') inp.value = F.bets[i]; };
      inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); (card.querySelector('[data-bet="' + (i + 1) + '"]') || card.querySelector('[data-go]')).focus(); } };
    });
    card.querySelector('[data-go]').onclick = () => { g.teams.forEach((t, i) => { F.bets[i] = Math.max(0, Math.min(t.s, F.bets[i] || 0)); }); F.stage = 'q'; save(); sfx('open'); finalCard(); };
  } else {
    const q = F.q, two = q.opts.length === 2, all = g.teams.every((t, i) => F.marks[i] != null);
    card.innerHTML = top + '<div class="bg-q">' + qBody(q) + '</div>' +
      '<div class="bg-opts' + (two ? ' two' : '') + '">' + (F.opts || F.shown
        ? q.opts.map((x, i) => '<div class="bg-opt' + (F.shown ? (i === q.a ? ' ok' : ' dim') : '') + '">' + (two ? '' : '<span class="l">' + 'ABCD'[i] + '</span>') + '<span class="o">' + esc(x) + '</span></div>').join('')
        : '<button type="button" class="bg-btn solid bg-reveal-opts" data-a="opts">Show the options <kbd>O</kbd></button>') + '</div>' +
      '<p class="bg-more">' + (F.shown ? qMore(q) : '') + '</p>' +
      '<div class="bg-mark">' + (F.shown
        ? '<div class="cf-marks">' + g.teams.map((t, i) => '<span class="cf-m" style="--tc:' + t.c + '"><span>' + esc(t.name) + ' · bet ' + (F.bets[i] || 0) + '</span>' +
            '<button type="button" class="y" data-m="' + i + '" data-v="1" aria-pressed="' + (F.marks[i] === true) + '" aria-label="' + esc(t.name) + ': right">✓</button>' +
            '<button type="button" class="n" data-m="' + i + '" data-v="0" aria-pressed="' + (F.marks[i] === false) + '" aria-label="' + esc(t.name) + ': wrong">✗</button></span>').join('') + '</div>' +
          '<button type="button" class="bg-btn solid" data-a="add"' + (all ? '' : ' disabled') + '>' + (all ? 'Add up the scores' : 'Mark every team') + '</button>'
        : '<span class="cf-wait">Every team writes its answer down.</span><button type="button" class="bg-btn solid" data-a="show">Show the answer <kbd>S</kbd></button>') + '</div>';
    const on = (a, fn) => { const b = card.querySelector('[data-a=' + a + ']'); if (b) b.onclick = fn; };
    on('opts', () => { F.opts = true; save(); finalCard(); });
    on('show', () => { F.shown = true; F.opts = true; save(); sfx('surprise'); finalCard(); });
    on('add', finalScores);
    reportBtn(card, q);
    card.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { F.marks[+b.dataset.m] = b.dataset.v === '1'; save(); finalCard(); });
  }
  P.stage.appendChild(card); fitCard();
  const first = card.querySelector('[data-bet]'); (F.stage === 'bet' && first ? first : card).focus({preventScroll: true});
}
function finalScores(){
  const g = P.game, F = g.final, bump = {};
  if (!F || F.stage === 'done' || !g.teams.every((t, i) => F.marks[i] != null)) return;
  g.teams.forEach((t, i) => { const bet = F.bets[i] || 0, d = F.marks[i] ? bet : -Math.min(bet, t.s); t.s += d; if (d) bump[i] = d; });
  F.stage = 'done'; save(); drawScores(bump); sfx('right');
  const btn = P.card && P.card.querySelector('[data-a=add]'); if (btn) { btn.disabled = true; btn.textContent = 'Added up'; }
  setTimeout(() => { if (!P || P.game !== g) return; if (P.card) P.card.remove(); P.card = null; P.fin = false; drawPrompt(); endScreen(); }, 1600);
}

// =====================================================================================================================
// ---------- Don't Say It! (6 Nov 2026, teacher: "a variant on Taboo") ----------
// One player from the team that is playing guesses, with their back to the board; the rest of the team describe the word on
// the board without saying it or the four red words beside it. The teacher clicks Got it!, Skip or Said it! and the next word
// comes up. Every team plays once a round, and the rounds get shorter (60, 30, 15 seconds). "Replay Same Words in Next Round"
// (on by default): every word sent in round 1 comes back in the later rounds, for recall; off: new words each round.
// Words: content/<topic>/taboo.csv (word, taboo1-4, hint1-4; a word plays once it has a forbidden word). Hints show one at a time.
// Hints (the third game) uses the same file: a word plays there once it has at least two hints.
const T_DEFAULTS = {game: 'taboo', title: '', topics: [], levels: [1, 2, 3, 4, 5], times: [60, 30, 15], replay: true, said: 'skip', teams: null};
const H_DEFAULTS = {game: 'hints', title: '', topics: [], levels: [1, 2, 3, 4, 5], times: [60, 60, 60], teams: null};
const H_MIN = 2;   // hints a word needs before Hints plays it
const T_TOPICS = TOPICS.filter(t => !t.only);
const loadedT = {};
function loadTaboo(key){
  if (loadedT[key]) return loadedT[key];
  const t = TOPICS.find(x => x.key === key);
  if (!t || t.only) return Promise.resolve({key, items: []});
  const get = f => fetch(ROOT + 'content/' + key + '/' + f + '.csv', {cache: 'no-cache'}).then(r => r.ok ? r.text() : '').then(parseCSV).catch(() => null);
  const p = Promise.all([get('words'), get('taboo'), t.characters ? get('characters') : null]).then(([W, T, C]) => {
    if (W === null && T === null) throw new Error("Couldn't load the words for " + t.name + '.');
    const on = {};   // Representation plays only its key words, like its page
    (W || []).forEach(r => { const lists = listOf(r.list).map(x => x.toLowerCase()); on[r.id] = !t.list || !lists.length || lists.includes(t.list); });
    const rows = (T || []).concat((C || []).map(r => Object.assign({}, r, {word: r.name})));   // a character plays under its name
    const items = rows.map(r => ({id: r.id, lv: levelNum(r.level), w: r.word,
        taboo: [1, 2, 3, 4].map(k => r['taboo' + k]).filter(Boolean), hints: [1, 2, 3, 4].map(k => r['hint' + k]).filter(Boolean)}))
      .filter(it => it.id && it.w && (it.taboo.length || it.hints.length >= H_MIN) && on[it.id] !== false);
    return {key, name: t.name, items};
  });
  loadedT[key] = p; p.catch(() => { delete loadedT[key]; });
  return p;
}
function tabooData(topics){ return Promise.all(topics.map(loadTaboo)).then(all => Object.fromEntries(all.map(D => [D.key, D]))); }
const eligibleTaboo = (D, levels, kind) => (D.items || []).filter(it => (kind === 'hints' ? it.hints.length >= H_MIN : it.taboo.length) && (it.lv == null || levels.includes(band(it.lv))));
function countTaboo(topics, levels, data, level, kind){
  let n = 0;
  topics.forEach(tk => { const D = data[tk]; if (D) n += eligibleTaboo(D, level ? [level] : levels, kind).filter(it => !level || it.lv != null).length; });
  return n;
}

// ---------- which game? ----------
function chooser(){
  C.setTitle('New board game'); C.header();
  C.view.innerHTML = '<p style="margin:0 0 14px"><a class="backlink" href="#/board">← Board games</a></p>' +
    '<p class="note" style="margin:0 0 14px">Which game?</p><div class="bg-list">' +
    Object.keys(GAME_TYPES).map(k => '<a class="card bg-item bg-choice" href="#/board/new/' + k + '"><h3>' + esc(GAME_TYPES[k].name) + '</h3>' +
      '<p class="note">' + esc(GAME_TYPES[k].blurb) + '</p><span class="btn" style="align-self:flex-start;margin-top:6px">Make one</span></a>').join('') + '</div>';
}

// ---------- making or changing a Don't Say It! game ----------
function tabooForm(id, kind){
  kind = kind === 'hints' ? 'hints' : 'taboo';
  const hints = kind === 'hints', count = (t, l, d, lv) => countTaboo(t, l, d, lv, kind);
  const old = id ? setOf(id) : null;
  if (id && !old) { location.hash = '#/board'; return; }
  const cfg = Object.assign(JSON.parse(JSON.stringify(hints ? H_DEFAULTS : T_DEFAULTS)), old ? JSON.parse(JSON.stringify(old)) : {});
  if (!cfg.teams || cfg.teams.length < 2) cfg.teams = funNames(4);
  const name = GAME_TYPES[kind].name;
  C.setTitle(old ? 'Change: ' + name : 'New ' + name + ' game'); C.header();
  let data = null;
  const opt = (v, label, cur) => '<option value="' + v + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + label + '</option>';
  const sel = (sid, label, list, cur) => '<div class="field"><label for="' + sid + '">' + label + '</label><select id="' + sid + '">' + list.map(x => opt(x[0], x[1], cur)).join('') + '</select></div>';
  C.view.innerHTML =
    '<p style="margin:0 0 14px"><a class="backlink" href="#/board">← Board games</a></p>' +
    '<form class="card bg-form" id="bf" novalidate>' +
    '<div class="field"><label for="b-title">Name</label><input type="text" id="b-title" maxlength="80" placeholder="e.g. 9A Representation words" value="' + esc(cfg.title) + '"></div>' +
    '<fieldset><legend>Topics</legend><div class="bg-chips" id="b-topics">' + T_TOPICS.map(t =>
      '<label class="bg-chip"><input type="checkbox" value="' + t.key + '"' + (cfg.topics.includes(t.key) ? ' checked' : '') + '><span>' + esc(t.name) + ' <small data-n="' + t.key + '">…</small></span></label>').join('') + '</div>' +
      '<p class="note">' + (hints ? 'The words come from each topic\'s taboo.csv (and To Kill a Mockingbird\'s characters.csv). A word is ready once it has at least two hints.'
        : 'The words come from each topic\'s taboo.csv (and To Kill a Mockingbird\'s characters.csv). A word is ready once its forbidden words are written.') + '</p></fieldset>' +
    '<fieldset><legend>Levels</legend><div class="bg-chips" id="b-levels"></div></fieldset>' +
    '<p class="bg-total" id="b-total" aria-live="polite">Counting the words…</p>' +
    (hints ? '<hr><fieldset><legend>Turns</legend><div class="bg-settings">' +
      sel('b-turn', 'Each turn lasts', [[30, '30 seconds'], [45, '45 seconds'], [60, '1 minute'], [90, '90 seconds'], [120, '2 minutes']], cfg.times[0] || 60) +
      sel('b-rounds', 'Turns for each team', [[1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5']], cfg.times.length || 3) +
    '</div><p class="note">Points: 4 for a word guessed on the first hint, then 3, 2 and 1. The clock stops while the wheel picks another team; ' +
      'they answer for 1 point, and if they\'re wrong the wheel spins again.</p></fieldset>'
    : '<hr><fieldset><legend>Rounds</legend><div class="bg-settings">' +
      sel('b-t1', 'Round 1: each team plays for', [[30, '30 seconds'], [45, '45 seconds'], [60, '1 minute'], [90, '90 seconds'], [120, '2 minutes']], cfg.times[0] || 60) +
      sel('b-t2', 'Round 2', [[0, 'No round 2'], [15, '15 seconds'], [20, '20 seconds'], [30, '30 seconds'], [45, '45 seconds'], [60, '1 minute']], cfg.times[1] || 0) +
      sel('b-t3', 'Round 3', [[0, 'No round 3'], [10, '10 seconds'], [15, '15 seconds'], [20, '20 seconds'], [30, '30 seconds']], cfg.times[2] || 0) +
      sel('b-said', 'Saying a red word', [['skip', 'Next word, no point lost'], ['lose', 'Lose a point']], cfg.said) +
    '</div>' +
    '<label class="choice"><input type="checkbox" id="b-replay"' + (cfg.replay !== false ? ' checked' : '') + '><span><b>Replay Same Words in Next Round</b><br>' +
      '<span class="note">Every word sent in round 1 comes back in the later rounds: a reminder, for recall. Untick it for new words each round.</span></span></label></fieldset>') +
    '<hr><fieldset><legend>Teams</legend>' +
      '<div class="row"><label class="lab" for="b-nteams">How many</label><select id="b-nteams">' + [2, 3, 4, 5, 6, 7, 8].map(n => opt(n, n, cfg.teams.length)).join('') + '</select>' +
      '<button class="btn small alt" type="button" id="b-renames">New names for every team</button></div>' +
      '<div class="bg-teams" id="b-teams"></div></fieldset>' +
    '<p class="err" id="err" role="alert" hidden></p>' +
    '<div class="row bg-saveline"><button class="btn" type="submit" data-go="play">Save and play</button><button class="btn alt" type="submit" data-go="list">Save</button><a class="btn alt" href="#/board">Cancel</a></div>' +
    '</form>';
  const $ = q => C.view.querySelector(q), $$ = q => [...C.view.querySelectorAll(q)];
  const read = () => {
    cfg.title = $('#b-title').value.trim();
    cfg.topics = $$('#b-topics input:checked').map(i => i.value);
    if ($$('#b-levels input').length) cfg.levels = $$('#b-levels input:checked').map(i => +i.value);
    if (hints) cfg.times = Array(+$('#b-rounds').value || 3).fill(+$('#b-turn').value || 60);
    else { cfg.times = [+$('#b-t1').value, +$('#b-t2').value, +$('#b-t3').value]; cfg.said = $('#b-said').value; cfg.replay = $('#b-replay').checked; }
    cfg.teams = $$('#b-teams input').map((i, k) => i.value.trim() || 'Team ' + (k + 1));
  };
  const drawCounts = () => {
    $$('#b-topics [data-n]').forEach(x => { x.textContent = data ? count([x.dataset.n], cfg.levels, data) : '…'; });
    $('#b-levels').innerHTML = LEVELS.map(([n, name]) => { const c = data && cfg.topics.length ? count(cfg.topics, cfg.levels, data, n) : null;
      return '<label class="bg-chip"><input type="checkbox" value="' + n + '"' + (cfg.levels.includes(n) ? ' checked' : '') + '><span>' + name + (c == null ? '' : ' <small>' + c + '</small>') + '</span></label>'; }).join('');
    $$('#b-levels input').forEach(i => i.onchange = () => { read(); drawCounts(); });
    const el = $('#b-total'); el.classList.remove('bad');
    if (!data) { el.textContent = 'Counting the words…'; return; }
    if (!cfg.topics.length) { el.textContent = 'Choose at least one topic.'; return; }
    if (!cfg.levels.length) { el.textContent = 'Choose at least one level.'; el.classList.add('bad'); return; }
    const n = count(cfg.topics, cfg.levels, data), times = cfg.times.filter(Boolean);
    if (!n) { el.textContent = 'No words are ready yet in ' + (cfg.topics.length > 1 ? 'these topics' : 'this topic') + ' at these levels: their taboo.csv needs ' +
      (hints ? 'hints' : 'its forbidden words') + ' (content/README.md says how).'; el.classList.add('bad'); return; }
    if (hints) { const turns = cfg.times.length;
      el.textContent = n + ' word' + (n === 1 ? '' : 's') + ' ready. Each team has ' + turns + ' turn' + (turns === 1 ? '' : 's') + ' of ' + cfg.times[0] + ' seconds.' +
        (n < cfg.teams.length * turns * 3 ? ' Not many words for ' + cfg.teams.length + ' teams: some may come round again.' : '');
      return; }
    el.textContent = n + ' word' + (n === 1 ? '' : 's') + ' ready. Each team plays once a round: ' + times.map(x => x + ' seconds').join(', then ') + '.' +
      (times.length > 1 ? (cfg.replay ? ' The words from round 1 come back in the later rounds.' : ' New words each round.') : '') +
      (n < cfg.teams.length * 6 ? ' Not many words for ' + cfg.teams.length + ' teams: some may come round again.' : '');
  };
  const drawTeams = () => {
    const n = +$('#b-nteams').value;
    while (cfg.teams.length < n) cfg.teams.push(funName(cfg.teams));
    cfg.teams = cfg.teams.slice(0, n);
    $('#b-teams').innerHTML = cfg.teams.map((nm, i) => '<div class="bg-team"><span class="sw" style="background:' + COLOURS[i] + '"></span>' +
      '<input type="text" maxlength="30" aria-label="Team ' + (i + 1) + ' name" value="' + esc(nm) + '">' +
      '<button class="bg-dice" type="button" data-i="' + i + '" title="A new name" aria-label="A new name for team ' + (i + 1) + '">🎲</button></div>').join('');
    $$('#b-teams input').forEach((inp, i) => inp.oninput = () => { cfg.teams[i] = inp.value; });
    $$('#b-teams .bg-dice').forEach(b => b.onclick = () => { const i = +b.dataset.i; cfg.teams[i] = funName(cfg.teams.filter((_, k) => k !== i)); drawTeams(); });
  };
  $$('#b-topics input').forEach(i => i.onchange = () => { C.touch(); read(); drawCounts(); });
  ['#b-t1', '#b-t2', '#b-t3', '#b-replay', '#b-turn', '#b-rounds'].forEach(q => { if ($(q)) $(q).onchange = () => { read(); drawCounts(); }; });
  $('#b-nteams').onchange = () => { cfg.teams = $$('#b-teams input').map(i => i.value); drawTeams(); read(); drawCounts(); };
  $('#b-renames').onclick = () => { cfg.teams = funNames(cfg.teams.length); drawTeams(); };
  drawTeams(); drawCounts();
  tabooData(T_TOPICS.map(t => t.key)).then(d => { data = d; read(); drawCounts(); })
    .catch(x => { const e = $('#err'); e.textContent = x.message + ' Check your internet connection and try again.'; e.hidden = false; });
  let go = 'play';
  $$('#bf [type=submit]').forEach(b => b.onclick = () => { go = b.dataset.go; });
  $('#bf').onsubmit = e => {
    e.preventDefault(); C.touch(); read();
    const err = $('#err'), say = m => { err.textContent = m; err.hidden = false; err.scrollIntoView({block: 'center', behavior: 'smooth'}); };
    err.hidden = true;
    if (!cfg.topics.length) return say('Choose at least one topic.');
    if (!data) return say('Still counting the words. Try again in a moment.');
    if (!cfg.levels.length) return say('Choose at least one level.');
    if (!count(cfg.topics, cfg.levels, data)) return say('No words are ready yet for these topics and levels.');
    const s = Object.assign({}, cfg, {game: kind, id: old ? old.id : uid(), created: old ? old.created : Date.now(),
      title: cfg.title || cfg.topics.map(topicName).join(' + ') + (hints ? ' hints' : ' words')});
    saveSet(s);
    const g = gameOf(s.id);
    if (g && go === 'play' && !confirm('This game is in progress. Start a new game with the new settings? (Cancel keeps the game in progress.)')) { location.hash = '#/board/play/' + s.id; return; }
    if (g && go === 'play') dropGame(s.id);
    location.hash = go === 'play' ? '#/board/play/' + s.id : '#/board';
  };
}

// ---------- playing Don't Say It! ----------
// The game is saved as it goes: fresh (words not sent yet), deck (this round's replayed words), pool (every word sent so far),
// stage (ready, play, summary, over), cur (the word on the board), log (this turn's words and what happened to them).
function newTabooGame(set, data){
  const cfg = JSON.parse(JSON.stringify(set)), all = [], kind = gameType(set);
  cfg.topics.forEach(tk => { const D = data[tk]; if (D) eligibleTaboo(D, cfg.levels, kind).forEach(it => all.push({k: tk + '|' + it.id, t: tk, lv: it.lv, w: it.w, taboo: it.taboo, hints: it.hints})); });
  const times = (cfg.times || (kind === 'hints' ? H_DEFAULTS : T_DEFAULTS).times).map(Number).filter(x => x > 0);
  const names = (cfg.teams && cfg.teams.length >= 2) ? cfg.teams : funNames(4);
  return {v: 1, kind, set: set.id, title: cfg.title || GAME_TYPES[kind].name, cfg, started: Date.now(), times: times.length ? times : [60],
    teams: names.map((nm, i) => ({name: nm, c: COLOURS[i % COLOURS.length], s: 0})), turn: 0, round: 0, step: 0,
    fresh: shuffle(all), deck: [], pool: [], stage: 'ready', cur: null, log: [], left: 0, words: all.length};
}
function tPrompt(){
  const g = P.game, t = g.teams[g.turn];
  P.prompt.innerHTML = g.stage === 'over' ? 'Final scores' : 'Round ' + (g.round + 1) + ' of ' + g.times.length + ' · ' + g.times[g.round] + ' seconds a turn · ' +
    '<b style="color:' + t.c + '">' + esc(t.name) + '</b>' + (g.stage === 'play' ? ' are playing' : g.stage === 'summary' ? '' : ' are next');
}
function drawTaboo(){
  const g = P.game;
  if (g.stage === 'over') return;
  g.turn = (g.round + g.step) % g.teams.length;
  if (g.stage !== 'play') { clearInterval(P.tick); P.tick = null; }
  tPrompt(); drawScores();
  const card = document.createElement('div');
  const hn = g.kind === 'hints';
  card.className = 'bg-card tb' + (hn ? ' hn' : ''); card.tabIndex = -1; card.setAttribute('role', 'region'); card.setAttribute('aria-label', GAME_TYPES[g.kind].name);
  if (g.stage === 'ready') tReady(card); else if (g.stage === 'play') (hn ? hPlay : tPlay)(card); else (hn ? hSummary : tSummary)(card);
  P.stage.innerHTML = ''; P.stage.appendChild(card); P.card = card;
  if (g.stage === 'play') { fitWord(); if (!P.tick && !P.paused) tRun(); }
  card.focus({preventScroll: true});
}
function tReady(card){
  const g = P.game, t = g.teams[g.turn], first = g.step === 0;
  card.innerHTML = '<div class="tb-ready">' +
    '<p class="tb-round">' + (first ? 'Round ' + (g.round + 1) + ' of ' + g.times.length : 'Next team') + ' · ' + g.times[g.round] + ' seconds</p>' +
    (first && g.round > 0 && g.kind !== 'hints' ? '<p class="tb-note">' + (g.cfg.replay !== false ? 'The words from round 1 are back. Who remembers them?' : 'New words this round.') + '</p>' : '') +
    '<p class="tb-team" style="--tc:' + t.c + '">' + esc(t.name) + '</p>' +
    '<p class="tb-how">' + (g.kind === 'hints' ? 'Guess the word from its hints. The first hint is worth 4 points, then 3, 2 and 1. Talk it over, then give one answer.'
      : 'One player guesses, with their back to the board. The rest of the team describe the word without saying it or any of the red words.') + '</p>' +
    '<button type="button" class="bg-btn solid tb-go" data-go>Start <kbd>Space</kbd></button></div>';
  card.querySelector('[data-go]').onclick = () => tStart();
}
function tStart(){
  const g = P.game; if (g.stage !== 'ready') return;
  g.stage = 'play'; g.left = g.times[g.round]; g.log = []; P.paused = false;
  tNext(); sfx('open'); save(); drawTaboo();
}
// The next word: this round's replayed words first, then words not sent yet; when everything has been sent, round again
function tNext(){
  const g = P.game;
  let q = null, src = 'deck';
  if (g.deck.length) q = g.deck.pop();
  else if (g.fresh.length) { q = g.fresh.pop(); src = 'fresh'; if (!g.pool.some(x => x.k === q.k)) g.pool.push(q); }
  else if (g.pool.length) { g.deck = shuffle(g.pool.filter(x => !g.cur || x.k !== g.cur.q.k)); q = g.deck.pop() || g.pool[0]; }
  g.cur = q ? {q, src, hints: g.kind === 'hints' ? 1 : 0} : null;   // Hints starts with the first hint on the board
}
function tPlay(card){
  const g = P.game, c = g.cur, total = g.times[g.round], got = g.log.filter(x => x.r === 'got').length;
  if (!c) { card.innerHTML = '<div class="tb-ready"><p class="tb-how">There are no more words.</p></div>'; return; }
  const q = c.q;
  card.innerHTML =
    '<div class="tb-time' + (P.paused ? ' paused' : '') + (g.left <= 5 ? ' low' : '') + '"><div class="tb-bar"><i style="width:' + (100 * g.left / total) + '%"></i></div>' +
      '<span class="tb-secs">' + g.left + '</span><button type="button" class="bg-btn small" data-a="pause">' + (P.paused ? 'Carry on' : 'Pause') + '</button></div>' +
    '<div class="tb-main"><div class="tb-wordbox"><p class="tb-label">Describe</p><p class="tb-word">' + esc(q.w) + '</p>' +
      '<p class="tb-meta">' + esc([topicName(q.t), q.lv != null ? LEVEL_NAME[band(q.lv)] : ''].filter(Boolean).join(' · ')) + '</p>' +
      '<ol class="tb-hints">' + q.hints.slice(0, c.hints).map(h => '<li>' + esc(h) + '</li>').join('') + '</ol></div>' +
      '<div class="tb-ban"><p class="tb-ban-h">Don\'t say</p><ul>' + q.taboo.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></div></div>' +
    '<div class="tb-acts"><span class="tb-count">✓ ' + got + ' this turn</span>' +
      (q.hints.length ? '<button type="button" class="bg-btn" data-a="hint"' + (c.hints >= q.hints.length ? ' disabled' : '') + '>Hint ' + Math.min(c.hints + 1, q.hints.length) + ' of ' + q.hints.length + ' <kbd>H</kbd></button>' : '') +
      '<button type="button" class="bg-btn" data-a="skip">Skip <kbd>S</kbd></button>' +
      '<button type="button" class="bg-btn wrong" data-a="said">✗ Said it! <kbd>X</kbd></button>' +
      '<button type="button" class="bg-btn right tb-got" data-a="got">✓ Got it! <kbd>G</kbd></button></div>';
  card.querySelector('[data-a=pause]').onclick = () => tPause();
  card.querySelector('[data-a=skip]').onclick = () => tResult('skip');
  card.querySelector('[data-a=said]').onclick = () => tResult('said');
  card.querySelector('[data-a=got]').onclick = () => tResult('got');
  const h = card.querySelector('[data-a=hint]'); if (h) h.onclick = () => tHint();
}
// The word fills its half of the board
function fitWord(){
  if (P && P.game && P.game.kind === 'hints') return fitHints();
  const card = P && P.card, w = card && card.querySelector('.tb-word'), box = card && card.querySelector('.tb-wordbox');
  if (!w || !box) return;
  const len = w.textContent.length, u = P.u;
  let s = (len < 9 ? 150 : len < 15 ? 120 : 92) * u; const min = 28 * u;
  w.style.fontSize = s + 'px';
  const over = () => [...box.children].reduce((a, e) => a + e.offsetHeight, 0) + 40 * u > box.clientHeight || w.scrollWidth > w.clientWidth + 1;
  for (let k = 0; k < 40 && s > min && over(); k++) { s = Math.max(min, s * .92); w.style.fontSize = s + 'px'; }
}
function tRun(){
  clearInterval(P.tick);
  P.tick = setInterval(() => {
    const g = P && P.game; if (!g || g.stage !== 'play' || P.paused || P.endEl || P.flash || (g.cur && g.cur.wheel)) return;   // the clock stops for the wheel
    g.left--;
    const tb = P.card && P.card.querySelector('.tb-time');
    if (tb) { tb.querySelector('.tb-secs').textContent = Math.max(0, g.left); tb.querySelector('.tb-bar i').style.width = Math.max(0, 100 * g.left / g.times[g.round]) + '%'; tb.classList.toggle('low', g.left <= 5); }
    if (g.left > 0 && g.left <= 5) sfx('tick');
    if (g.left % 5 === 0) saveGame(g);
    if (g.left <= 0) tTimeUp();
  }, 1000);
}
function tPause(force){
  const g = P && P.game; if (!g || g.stage !== 'play') return;
  P.paused = force === true ? true : !P.paused;
  const tb = P.card && P.card.querySelector('.tb-time');
  if (tb) { tb.classList.toggle('paused', P.paused); tb.querySelector('[data-a=pause]').textContent = P.paused ? 'Carry on' : 'Pause'; }
  if (!P.paused && !P.tick) tRun();
}
function tHint(){
  const g = P.game, c = g.cur; if (g.stage !== 'play' || !c || c.hints >= c.q.hints.length) return;
  c.hints++; save(); drawTaboo();
}
// Got it! (+1), Skip (0) or Said it! (a red word: 0, or −1 if the board says so), then the next word
function tResult(r){
  const g = P.game; if (g.stage !== 'play' || !g.cur || P.busy) return;
  const team = g.teams[g.turn];
  let d = r === 'got' ? 1 : r === 'said' && g.cfg.said === 'lose' ? -Math.min(1, team.s) : 0;
  team.s += d;
  g.log.push({k: g.cur.q.k, w: g.cur.q.w, r, d});
  sfx(r === 'got' ? 'right' : r === 'said' ? 'wrong' : 'open');
  tNext(); save(); drawTaboo();
  if (d) drawScores({[g.turn]: d});
  if (r === 'got') { const box = P.card.querySelector('.tb-wordbox'); if (box) box.classList.add('ok'); }
}
// Time's up: the word on the board goes back for later, and the turn's words are listed (the teacher can change any of them)
function tTimeUp(){
  const g = P.game;
  clearInterval(P.tick); P.tick = null; sfx('up');
  if (g.cur) { if (g.cur.src === 'deck') g.deck.unshift(g.cur.q); else g.fresh.unshift(g.cur.q); }
  g.cur = null; g.stage = 'summary'; save(); drawTaboo();
}
function tSummary(card){
  const g = P.game, t = g.teams[g.turn], got = g.log.filter(x => x.r === 'got').length;
  const last = g.step === g.teams.length - 1, lastRound = g.round === g.times.length - 1;
  const mark = {got: '✓', skip: '–', said: '✗'};
  card.innerHTML = '<div class="tb-ready">' +
    '<p class="tb-round">Time\'s up!</p><p class="tb-team" style="--tc:' + t.c + '">' + esc(t.name) + ': ' + got + '</p>' +
    (g.log.length ? '<div class="tb-list">' + g.log.map((x, i) => '<button type="button" class="tb-w ' + x.r + '" data-i="' + i + '" title="Click to change">' + mark[x.r] + ' ' + esc(x.w) + '</button>').join('') + '</div>' +
      '<p class="note">Got one just as time ran out? Click a word to change it.</p>' : '<p class="tb-how">No words this turn.</p>') +
    '<button type="button" class="bg-btn solid tb-go" data-go>' + (last ? (lastRound ? 'Final scores' : 'Start round ' + (g.round + 2)) : 'Next team') + ' <kbd>Space</kbd></button></div>';
  card.querySelectorAll('.tb-w').forEach(b => b.onclick = () => {
    const x = g.log[+b.dataset.i], team = g.teams[g.turn];
    const r = x.r === 'got' ? 'skip' : 'got', d = r === 'got' ? 1 : 0;
    team.s += d - x.d; const change = d - x.d; x.r = r; x.d = d;
    save(); drawTaboo(); if (change) drawScores({[g.turn]: change});
  });
  card.querySelector('[data-go]').onclick = () => tAdvance();
}
function tAdvance(){
  const g = P.game; if (g.stage !== 'summary') return;
  g.step++;
  if (g.step >= g.teams.length) {
    g.step = 0; g.round++;
    if (g.round >= g.times.length) { g.stage = 'over'; g.round = g.times.length - 1; save(); tPrompt(); return endScreen(); }
    g.deck = g.cfg.replay !== false ? shuffle(g.pool.slice()) : [];   // Replay Same Words in Next Round
  }
  g.stage = 'ready'; save(); drawTaboo();
}
function tKey(e){
  const g = P.game, k = e.key, lk = k.toLowerCase();
  if (k === ' ' || (k === 'Enter' && g.stage !== 'play')) {
    e.preventDefault();
    if (g.stage === 'ready') tStart(); else if (g.stage === 'summary') tAdvance(); else if (g.stage === 'play' && k === ' ') tPause();
    return;
  }
  if (g.stage !== 'play') return;
  if (lk === 'g' || lk === 'y' || k === 'Enter') { e.preventDefault(); tResult('got'); }
  else if (lk === 's') { e.preventDefault(); tResult('skip'); }
  else if (lk === 'x' || lk === 'n') { e.preventDefault(); tResult('said'); }
  else if (lk === 'h') { e.preventDefault(); tHint(); }
}

// =====================================================================================================================
// ---------- Hints (6 Nov 2026, teacher: "They have to guess words based on the hints presented on the board") ----------
// The team that is playing sees hint 1 and guesses: right on hint 1 is 4 points, and each new hint takes a point off (3, 2, 1).
// A minute a turn, as many words as they can. A word the team can't get after the last hint can go to the class: the wheel
// picks one of the other teams to answer for 1 point; if they're wrong it spins again for the teams left. The clock stops meanwhile.
// The game runs on the Don't Say It! engine (ready, play, summary; turns and rounds); g.cur.wheel = {out, pick, rot} while the wheel is up.
const hPts = n => Math.max(1, 5 - n);   // points for a word guessed on hint n
const hCands = W => P.game.teams.map((t, i) => i).filter(i => i !== P.game.turn && !W.out.includes(i));
const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
// The word as blanks, hangman style: hint 1 shows only the blanks, each later hint fills in one more letter
const isLetter = ch => /[a-z\u00c0-\u024f]/i.test(ch);
function hOrder(w){   // the order letters appear: the first letter of each word, then the others, in an order fixed for the word
  const ch = [...w], firsts = [], rest = [];
  let h = 7, start = true;
  ch.forEach((x, i) => { h = (Math.imul(h, 31) + x.charCodeAt(0)) >>> 0;
    if (isLetter(x)) { (start ? firsts : rest).push(i); start = false; } else start = x === ' ' || x === '-'; });
  for (let i = rest.length - 1; i > 0; i--) { h = (Math.imul(h, 1103515245) + 12345) >>> 0; const j = h % (i + 1); [rest[i], rest[j]] = [rest[j], rest[i]]; }
  return firsts.concat(rest);
}
function hBlanks(w, k, fresh){
  const ch = [...w], letters = ch.filter(isLetter).length, n = Math.max(0, Math.min(k, letters - 2));
  const order = hOrder(w), show = new Set(order.slice(0, n)), newest = fresh && n > 0 ? order[n - 1] : -1;
  const groups = [''];
  ch.forEach((x, i) => {
    if (x === ' ') { groups.push(''); return; }
    groups[groups.length - 1] += !isLetter(x) ? '<span class="hn-p">' + esc(x) + '</span>'
      : '<span class="hn-l' + (show.has(i) ? ' on' + (i === newest ? ' new' : '') : '') + '">' + (show.has(i) ? esc(x) : '') + '</span>';
  });
  return '<p class="hn-word" aria-label="' + plural(letters, 'letter') + (n ? ', ' + n + ' shown' : '') + '">' +
    groups.filter(Boolean).map(g => '<span class="hn-g">' + g + '</span>').join('') + '</p>';
}
function hPlay(card){
  const g = P.game, c = g.cur, total = g.times[g.round];
  if (!c) { card.innerHTML = '<div class="tb-ready"><p class="tb-how">There are no more words.</p></div>'; return; }
  const q = c.q, n = q.hints.length, W = c.wheel, pts = hPts(c.hints), more = c.hints < n;
  const mine = g.log.filter(x => x.r === 'got'), turnPts = mine.reduce((a, x) => a + x.d, 0);
  card.innerHTML =
    '<div class="tb-time' + (P.paused || W ? ' paused' : '') + (g.left <= 5 ? ' low' : '') + '"><div class="tb-bar"><i style="width:' + (100 * g.left / total) + '%"></i></div>' +
      '<span class="tb-secs">' + g.left + '</span>' + (W ? '<span class="hn-stopped">Clock stopped</span>' : '') +
      '<button type="button" class="bg-btn small" data-a="pause"' + (W ? ' hidden' : '') + '>' + (P.paused ? 'Carry on' : 'Pause') + '</button></div>' +
    '<div class="hn-main' + (W ? ' wheel' : '') + '"><div class="hn-hints">' +
      '<div class="hn-top"><p class="hn-label">' + (W ? 'Over to the class · <b>1 point</b>' : 'What\'s the word? · Hint ' + c.hints + ' of ' + n + ' · <b>' + plural(pts, 'point') + '</b>') + '</p>' +
        hBlanks(q.w, c.hints - 1, !W) + '</div>' +
      '<ol class="hn-list">' + q.hints.map((h, i) => i < c.hints
        ? '<li class="hn-h' + (i === c.hints - 1 && !W ? ' new' : '') + '"><span class="hn-pts">' + hPts(i + 1) + '</span><span class="hn-t">' + esc(h) + '</span></li>'
        : '<li class="hn-h wait"><span class="hn-pts">' + hPts(i + 1) + '</span><span class="hn-t">Hint ' + (i + 1) + '</span></li>').join('') + '</ol>' +
      '<p class="tb-meta">' + esc([topicName(q.t), q.lv != null ? LEVEL_NAME[band(q.lv)] : ''].filter(Boolean).join(' · ')) + '</p></div>' +
      (W ? hWheelPanel(W) : '') + '</div>' +
    '<div class="tb-acts"><span class="tb-count">✓ ' + plural(mine.length, 'word') + ' · ' + plural(turnPts, 'point') + ' this turn</span>' +
      (W ? hWheelActs(W)
        : (more ? '<button type="button" class="bg-btn wrong" data-a="hint">✗ Next hint: ' + plural(hPts(c.hints + 1), 'point') + ' <kbd>N</kbd></button>'
          : '<button type="button" class="bg-btn" data-a="show">Show the word <kbd>A</kbd></button>' +
            '<button type="button" class="bg-btn hn-throw" data-a="wheel">🎡 Throw it out to the class <kbd>W</kbd></button>') +
          '<button type="button" class="bg-btn right tb-got" data-a="got">✓ Got it! +' + pts + ' <kbd>Y</kbd></button>') + '</div>';
  const on = (a, fn) => { const b = card.querySelector('[data-a=' + a + ']'); if (b) b.onclick = fn; };
  on('pause', () => tPause()); on('hint', hHint); on('show', hShow); on('wheel', hWheel); on('got', hGot);
  on('spin', hSpin); on('back', hWheelBack); on('yes', () => hWheelResult(true)); on('no', () => hWheelResult(false));
}
// The hints fill their side of the board; the wheel is as big as its side allows
function fitHints(){
  const card = P && P.card, box = card && card.querySelector('.hn-hints'), list = card && card.querySelector('.hn-list');
  if (!box || !list) return;
  const u = P.u, wp = card.querySelector('.hn-wheel'), wb = card.querySelector('.hn-wheelbox');
  if (wp && wb) { const rest = [...wp.children].filter(x => x !== wb).reduce((a, x) => a + x.offsetHeight, 0) + 30 * u;
    const sz = Math.max(60, Math.min(wp.clientWidth - 10 * u, wp.clientHeight - rest)); wb.style.width = wb.style.height = sz + 'px'; }
  // the blanks stay on the points line if they can (smaller for a long phrase), so the hints keep their room
  const wd = card.querySelector('.hn-word'), lb = card.querySelector('.hn-label');
  if (wd && lb) { let wf = 38 * u; wd.style.fontSize = wf + 'px';
    for (let k = 0; k < 20 && wf > 24 * u && wd.offsetTop >= lb.offsetTop + lb.offsetHeight; k++) { wf *= .93; wd.style.fontSize = wf + 'px'; } }
  let f = (wp ? 34 : 44) * u; const min = 14 * u, gap = parseFloat(getComputedStyle(box).rowGap) || 0;
  const over = () => [...box.children].reduce((a, x) => a + x.offsetHeight, 0) + gap * (box.children.length - 1) > box.clientHeight;
  list.style.setProperty('--hf', f + 'px');
  for (let k = 0; k < 40 && f > min && over(); k++) { f = Math.max(min, f * .92); list.style.setProperty('--hf', f + 'px'); }
}
function hHint(){
  const g = P.game, c = g.cur; if (g.stage !== 'play' || !c || c.wheel || P.flash || c.hints >= c.q.hints.length) return;
  c.hints++; sfx('open'); save(); drawTaboo();
}
function hGot(){
  const g = P.game, c = g.cur; if (g.stage !== 'play' || !c || c.wheel || P.flash) return;
  const d = hPts(c.hints), team = g.teams[g.turn];
  team.s += d; g.log.push({k: c.q.k, w: c.q.w, r: 'got', d, h: c.hints});
  sfx('right'); tNext(); save(); drawScores({[g.turn]: d});
  hFlash(c.q.w, '+' + d + ' · ' + team.name, team.c);
}
// Nobody got it: the teacher shows the word, and the team carries on with the next one
function hShow(){
  const g = P.game, c = g.cur; if (g.stage !== 'play' || !c || c.wheel || P.flash || c.hints < c.q.hints.length) return;
  hNobody();
}
function hNobody(){
  const g = P.game, c = g.cur;
  g.log.push({k: c.q.k, w: c.q.w, r: 'miss', d: 0}); sfx('wrong'); tNext(); save();
  hFlash(c.q.w, 'Nobody got it', null);
}
// The word fills the board for a moment (a click or Space moves on sooner), then the next word's first hint
function hFlash(w, line, colour){
  const card = P.card; if (!card) return drawTaboo();
  const el = document.createElement('div');
  el.className = 'hn-flash' + (colour ? '' : ' none'); if (colour) el.style.setProperty('--tc', colour);
  el.innerHTML = '<p class="hn-flash-w">' + esc(w) + '</p><p class="hn-flash-l">' + esc(line) + '</p>';
  card.appendChild(el);
  const we = el.firstChild; let f = (w.length < 9 ? 150 : w.length < 15 ? 118 : 92) * P.u;
  we.style.fontSize = f + 'px';
  for (let k = 0; k < 30 && f > 30 * P.u && (we.scrollWidth > we.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1); k++) { f *= .9; we.style.fontSize = f + 'px'; }
  const fl = P.flash = {done: () => { if (!P || P.flash !== fl) return; clearTimeout(fl.t); P.flash = null; drawTaboo(); }};
  fl.t = setTimeout(fl.done, 1900);
  el.onclick = fl.done;
}
function hFlashEnd(){ if (P && P.flash) P.flash.done(); }

// ---------- the wheel: "The remaining team names appear in the wheel which spins and selects a team" ----------
function hWheel(){
  const g = P.game, c = g.cur; if (g.stage !== 'play' || !c || c.wheel || P.flash || c.hints < c.q.hints.length) return;
  c.wheel = {out: [], pick: null, rot: 0}; sfx('surprise'); save(); drawTaboo();
}
function hWheelBack(){ const c = P.game.cur; if (!c || !c.wheel || P.spinning) return; c.wheel = null; save(); drawTaboo(); }
function wheelSvg(cands){
  const g = P.game, n = cands.length, s = 360 / Math.max(1, n), R = 96;
  const pt = (a, r) => { const t = (a - 90) * Math.PI / 180; return (Math.cos(t) * r).toFixed(2) + ' ' + (Math.sin(t) * r).toFixed(2); };
  let out = '<svg viewBox="-100 -100 200 200" aria-hidden="true"><circle r="99" class="rim"/>';
  if (!n) return out + '<circle r="' + R + '" class="empty"/></svg>';
  cands.forEach((ti, i) => {
    const t = g.teams[ti], a0 = i * s, mid = a0 + s / 2, flip = mid > 180;
    // the name in two lines (Zooming / Puffins), as big as its slice allows
    const nm = t.name.length > 28 ? t.name.slice(0, 27) + '…' : t.name;
    let lines = [nm];
    nm.split('').forEach((ch, k) => { if (ch === ' ' && Math.max(k, nm.length - k - 1) < Math.max(...lines.map(x => x.length))) lines = [nm.slice(0, k), nm.slice(k + 1)]; });
    const long = Math.max(5, ...lines.map(x => x.length));
    let fs = Math.min(n === 1 ? 22 : 17, 118 / long);
    if (n > 1) for (let k = 0; k < 30 && fs > 6; k++) { const inner = 58 - long * .62 * fs / 2; if (lines.length * 1.2 * fs <= inner * s * Math.PI / 180) break; fs *= .93; }
    const txt = at => '<text ' + at + ' text-anchor="middle" dominant-baseline="central" font-size="' + fs.toFixed(1) + '">' +
      lines.map((x, k) => '<tspan x="0" dy="' + (k ? 1.16 : -(lines.length - 1) * .58) + 'em">' + esc(x) + '</tspan>').join('') + '</text>';
    if (n === 1) { out += '<circle r="' + R + '" fill="' + t.c + '"/>' + txt('transform="translate(0 -52)"'); return; }
    out += '<path d="M0 0L' + pt(a0, R) + 'A' + R + ' ' + R + ' 0 ' + (s > 180 ? 1 : 0) + ' 1 ' + pt(a0 + s, R) + 'Z" fill="' + t.c + '"/>' +
      txt('transform="rotate(' + (flip ? mid + 90 : mid - 90).toFixed(2) + ') translate(' + (flip ? -58 : 58) + ' 0)"');
  });
  return out + '<circle r="13" class="hub"/></svg>';
}
function hWheelPanel(W){
  const g = P.game, cands = hCands(W), t = W.pick != null && !P.spinning ? g.teams[W.pick] : null;
  return '<div class="hn-wheel"><div class="hn-wheelbox"><div class="hn-spin" style="transform:rotate(' + W.rot + 'deg)">' + wheelSvg(cands) + '</div>' +
      '<svg class="hn-pointer" viewBox="0 0 40 40" aria-hidden="true"><path d="M5 5h30L20 33z"/></svg></div>' +
    '<p class="hn-pick"' + (t ? ' style="--tc:' + t.c + '"' : '') + ' aria-live="polite">' + (t ? esc(t.name) + '!' : P.spinning ? 'Spinning…' : 'Who will it be?') + '</p>' +
    (W.out.length ? '<p class="hn-out">Tried: ' + esc(W.out.map(i => g.teams[i].name).join(', ')) + '</p>' : '') + '</div>';
}
function hWheelActs(W){
  if (W.pick != null && !P.spinning) return '<button type="button" class="bg-btn wrong" data-a="no">✗ Wrong <kbd>N</kbd></button>' +
    '<button type="button" class="bg-btn right tb-got" data-a="yes">✓ Right +1 <kbd>Y</kbd></button>';
  return '<button type="button" class="bg-btn" data-a="back"' + (P.spinning ? ' disabled' : '') + '>Back <kbd>Esc</kbd></button>' +
    '<button type="button" class="bg-btn solid tb-got" data-a="spin"' + (P.spinning ? ' disabled' : '') + '>🎡 Spin <kbd>Space</kbd></button>';
}
function hSpin(){
  const g = P.game, c = g.cur, W = c && c.wheel; if (!W || P.spinning || W.pick != null || P.endEl || P.flash) return;
  const cands = hCands(W); if (!cands.length) return hNobody();
  const n = cands.length, s = 360 / n, i = Math.floor(Math.random() * n), a = (i + .15 + Math.random() * .7) * s;   // where on the wheel the pointer stops
  const from = W.rot, to = from - (from % 360) + 360 * (reduced() ? 1 : 5) + ((360 - a) % 360), ms = reduced() ? 500 : 4200;
  W.pick = cands[i]; W.rot = to; P.spinning = true; save();   // the pick is saved straight away: a reload shows it
  const card = P.card, spin = card.querySelector('.hn-spin');
  card.querySelectorAll('[data-a=spin],[data-a=back]').forEach(b => { b.disabled = true; });
  const pk = card.querySelector('.hn-pick'); if (pk) pk.textContent = 'Spinning…';
  spin.getBoundingClientRect();
  spin.style.transition = 'transform ' + ms + 'ms cubic-bezier(.12,.7,.12,1)'; spin.style.transform = 'rotate(' + to + 'deg)';
  let last = null;   // a tick each time a name passes the pointer
  const tick = setInterval(() => {
    if (!P || !P.spinning) return clearInterval(tick);
    const m = /matrix\(([^,]+),\s*([^,]+)/.exec(getComputedStyle(spin).transform); if (!m) return;
    const r = (Math.atan2(+m[2], +m[1]) * 180 / Math.PI + 360) % 360, k = Math.floor(((360 - r) % 360) / s);
    if (last !== null && k !== last) sfx('tick'); last = k;
  }, 40);
  setTimeout(() => {
    clearInterval(tick);
    if (!P || P.game !== g) return;
    P.spinning = false;
    if (g.cur !== c) return;
    sfx('surprise'); if (!P.endEl) drawTaboo();
  }, ms + 150);
}
function hWheelResult(right){
  const g = P.game, c = g.cur, W = c && c.wheel; if (!W || W.pick == null || P.spinning || P.flash) return;
  const ti = W.pick, team = g.teams[ti];
  if (right) {
    team.s += 1; g.log.push({k: c.q.k, w: c.q.w, r: 'stole', by: ti, d: 1});
    sfx('right'); tNext(); save(); drawScores({[ti]: 1});
    return hFlash(c.q.w, '+1 · ' + team.name, team.c);
  }
  W.out.push(ti); W.pick = null;
  if (!hCands(W).length) return hNobody();
  sfx('wrong'); save(); drawTaboo();
  setTimeout(() => { if (P && P.game === g && g.cur === c && c.wheel === W && W.pick == null) hSpin(); }, 900);   // "If they can't get it the wheel spins again"
}
function hSummary(card){
  const g = P.game, t = g.teams[g.turn], pts = g.log.filter(x => x.r === 'got').reduce((a, x) => a + x.d, 0);
  const last = g.step === g.teams.length - 1, lastRound = g.round === g.times.length - 1;
  card.innerHTML = '<div class="tb-ready">' +
    '<p class="tb-round">Time\'s up!</p><p class="tb-team" style="--tc:' + t.c + '">' + esc(t.name) + ': ' + plural(pts, 'point') + '</p>' +
    (g.log.length ? '<div class="tb-list">' + g.log.map(x => '<span class="tb-w hn-w ' + x.r + '">' +
        (x.r === 'got' ? '✓ ' + esc(x.w) + ' <b>+' + x.d + '</b>' : x.r === 'stole' ? '🎡 ' + esc(x.w) + ': ' + esc((g.teams[x.by] || {}).name || '') + ' <b>+1</b>' : '– ' + esc(x.w)) +
        '</span>').join('') + '</div><p class="note">To change a score, click the team at the top.</p>' : '<p class="tb-how">No words this turn.</p>') +
    '<button type="button" class="bg-btn solid tb-go" data-go>' + (last ? (lastRound ? 'Final scores' : 'Start round ' + (g.round + 2)) : 'Next team') + ' <kbd>Space</kbd></button></div>';
  card.querySelector('[data-go]').onclick = () => tAdvance();
}
function hKey(e){
  const g = P.game, k = e.key, lk = k.toLowerCase();
  if (P.flash) { if (k === ' ' || k === 'Enter' || k === 'Escape') { e.preventDefault(); P.flash.done(); } return; }
  if (g.stage !== 'play') return tKey(e);
  const W = g.cur && g.cur.wheel;
  if (W) {
    if (k === ' ' || k === 'Enter') { e.preventDefault(); hSpin(); }
    else if (lk === 'y' || lk === 'g') { e.preventDefault(); hWheelResult(true); }
    else if (lk === 'n' || lk === 'x') { e.preventDefault(); hWheelResult(false); }
    else if (k === 'Escape') { e.preventDefault(); hWheelBack(); }
    return;
  }
  if (k === ' ') { e.preventDefault(); tPause(); }
  else if (lk === 'y' || lk === 'g' || k === 'Enter') { e.preventDefault(); hGot(); }
  else if (lk === 'n' || lk === 'h' || lk === 'x') { e.preventDefault(); hHint(); }
  else if (lk === 'w') { e.preventDefault(); hWheel(); }
  else if (lk === 'a') { e.preventDefault(); hShow(); }
}

// ---------- sounds (made in the browser: no files to load) ----------
let AC = null;
function sfx(kind){
  if (!P || !P.sound) return;
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) { return; }
  const now = AC.currentTime;
  const tone = (f, t0, d, type, vol, f2) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, now + t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, now + t0 + d); g.gain.setValueAtTime(0, now + t0); g.gain.linearRampToValueAtTime(vol || .18, now + t0 + .015);
    g.gain.exponentialRampToValueAtTime(.0001, now + t0 + d); o.connect(g); g.connect(AC.destination); o.start(now + t0); o.stop(now + t0 + d + .05); };
  if (kind === 'open') tone(420, 0, .22, 'triangle', .16, 840);
  else if (kind === 'surprise') { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .08, .25, 'triangle', .14)); }
  else if (kind === 'right') { tone(660, 0, .14, 'triangle', .2); tone(990, .12, .3, 'triangle', .2); }
  else if (kind === 'wrong') { tone(220, 0, .18, 'square', .07); tone(165, .16, .32, 'square', .07); }
  else if (kind === 'tick') tone(1200, 0, .05, 'square', .05);
  else if (kind === 'up') { tone(300, 0, .5, 'sawtooth', .08, 140); }
  else if (kind === 'win') { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * .12, .3, 'triangle', .14)); }
}
})();
