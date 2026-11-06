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
  {key:'rw',       name:'SPAG: Right or Wrong', blurb:'Does the sentence have a mistake?',           file:'right-wrong', hid:['rw']},
  {key:'question', name:'Answer the question',  blurb:'Exam questions: which answer does what the command word asks?', file:'questions', hid:['question']},
  {key:'gk',       name:'General knowledge',    blurb:'Pub-quiz questions. No levels: they play at any level.', file:'knowledge', hid:['gk','must']}
];
const LEVELS = [[1,'Foundation'],[2,'Foundation+'],[3,'Intermediate'],[4,'Intermediate+'],[5,'Advanced']];
const LEVEL_NAME = Object.fromEntries(LEVELS);
// Team colours: white text reads on all of them
const COLOURS = ['#c8344a', '#1f63c4', '#13804f', '#7343c9', '#b35300', '#b4286a', '#0b7a7a', '#4f5578'];
const SURPRISES = {
  bonus:  {icon:'🎁', name:'Bonus!',  blurb:'Free points for the team, no question.'},
  double: {icon:'⚡', name:'Double!', blurb:'A question worth double points.'},
  steal:  {icon:'🦝', name:'Steal!',  blurb:'Take points from another team.'},
  give:   {icon:'💝', name:'Gift!',   blurb:'Give points to another team.'},
  swap:   {icon:'🔄', name:'Swap!',   blurb:'Swap scores with another team (or keep yours).'},
  oops:   {icon:'💥', name:'Oops!',   blurb:'The team loses points.'}
};
const POINTS_BY_LEVEL = {1:10, 2:15, 3:20, 4:25, 5:30};
const MIXED = [5, 10, 15, 20, 25];
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
  else if (bank === 'rw') { q.k = 'rw'; q.s = it.s; q.why = it.why; q.fix = it.fix; q.opts = ['Right', 'Wrong']; q.a = it.ok ? 0 : 1; }
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

// ---------- a new game from a board ----------
function newGame(set, data){
  const cfg = JSON.parse(JSON.stringify(set));
  const n = Math.max(4, Math.min(40, +cfg.squares || 20));
  const kinds = cfg.surprise === 'none' ? [] : (cfg.kinds || []).filter(k => SURPRISES[k]);
  const nSur = kinds.length ? Math.max(1, Math.round(n * (cfg.surprise === 'lots' ? .25 : .12))) : 0;
  let sur = []; while (sur.length < nSur) sur = sur.concat(shuffle(kinds)); sur = sur.slice(0, nSur);
  const needQ = n - nSur + sur.filter(k => k === 'double').length;
  const used = new Set(), qs = draw(cfg, data, needQ, used);
  // Not enough questions: double squares go first, then the board gets smaller
  while (qs.length < n - sur.length + sur.filter(k => k === 'double').length && sur.includes('double')) sur.splice(sur.indexOf('double'), 1);
  const qTiles = Math.min(qs.length - sur.filter(k => k === 'double').length, n - sur.length);
  const pts = q => cfg.points === 'mixed' ? pick(MIXED) : cfg.points === 'level' ? (POINTS_BY_LEVEL[band(q.lv)] || 20) : 10;
  let tiles = [];
  for (let i = 0; i < qTiles; i++) { const q = qs.shift(); tiles.push({k: 'q', q, p: pts(q)}); }
  sur.forEach(k => { if (k === 'double') { const q = qs.shift(); if (q) tiles.push({k: 'double', q, p: pts(q)}); } else tiles.push({k}); });
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
    if (hash === '#/board/new') return form(null);
    if ((m = /^#\/board\/([\w-]+)$/.exec(hash))) return form(m[1]);
    return list();
  },
  stop
};

// ---------- the list of boards ----------
function list(){
  C.setTitle('Board games'); C.header();
  const all = sets();
  C.view.innerHTML =
    '<p style="margin:0 0 14px"><a class="backlink" href="#/">← All classes</a></p>' +
    '<div class="spread" style="margin-bottom:14px"><p class="note">Games for the whole class on one screen: open a board, then put it on the projector.</p>' +
    '<a class="btn" href="#/board/new">+ New board game</a></div>' +
    (all.length ? '<div class="bg-list">' + all.map(s => { const g = gameOf(s.id), left = g ? g.tiles.filter(t => !t.done).length : 0;
      return '<div class="card bg-item" data-id="' + esc(s.id) + '">' +
        '<h3>' + esc(s.title || 'Board game') + '</h3>' +
        (g ? '<span class="bg-going">Game in progress: ' + left + ' of ' + g.tiles.length + ' squares left</span>' : '') +
        '<p class="note">' + esc(s.topics.map(topicName).join(', ') || 'No topics') + '</p>' +
        '<p class="note">' + esc(s.banks.map(bankName).join(', ')) + ' · ' + esc(levelsText(s.levels)) + '</p>' +
        '<p class="note">' + s.squares + ' squares · ' + (s.teams || []).length + ' teams · ' + (s.secs ? s.secs + ' seconds' : 'no timer') + '</p>' +
        '<div class="row">' + (g ? '<a class="btn" href="#/board/play/' + esc(s.id) + '">Carry on</a><button class="btn alt" type="button" data-act="fresh">New game</button>'
          : '<a class="btn" href="#/board/play/' + esc(s.id) + '">Play</a>') +
        '<a class="btn small alt" href="#/board/' + esc(s.id) + '">Change</a>' +
        '<button class="btn small alt" type="button" data-act="copy">Copy</button>' +
        '<button class="btn small alt" type="button" data-act="del">Delete</button></div></div>'; }).join('') + '</div>'
      : '<div class="card narrow"><p class="note">No board games yet. Make one: choose the topics, the kinds of question and the levels, then the teams.</p>' +
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
function form(id){
  const old = id ? setOf(id) : null;
  if (id && !old) { location.hash = '#/board'; return; }
  const cfg = Object.assign(JSON.parse(JSON.stringify(DEFAULTS)), old ? JSON.parse(JSON.stringify(old)) : {});
  if (!cfg.teams || cfg.teams.length < 2) cfg.teams = funNames(4);
  C.setTitle(old ? 'Change the board' : 'New board game'); C.header();
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
    '<p class="bg-total" id="b-total" aria-live="polite">Choose at least one topic.</p>' +
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
      '<div class="bg-kinds" id="b-kinds">' + Object.keys(SURPRISES).map(k => '<label><input type="checkbox" value="' + k + '"' + (cfg.kinds.includes(k) ? ' checked' : '') + '><span><b>' + SURPRISES[k].icon + ' ' + SURPRISES[k].name.replace('!', '') + '</b><br><span class="note">' + SURPRISES[k].blurb + '</span></span></label>').join('') + '</div></fieldset>' +
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
    cfg.squares = +$('#b-squares').value; cfg.secs = +$('#b-secs').value; cfg.points = $('#b-points').value; cfg.options = $('#b-options').value;
    cfg.wrong = $('#b-wrong').value; cfg.surprise = $('#b-surprise').value; cfg.kinds = checked('#b-kinds');
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
    const total = countFor(cfg, data), kinds = cfg.surprise === 'none' ? 0 : cfg.kinds.length;
    const nSur = kinds ? Math.max(1, Math.round(cfg.squares * (cfg.surprise === 'lots' ? .25 : .12))) : 0, need = cfg.squares - nSur;
    const onlyGk = cfg.banks.every(b => b === 'gk');
    if (!cfg.levels.length && !onlyGk) { el.textContent = 'Choose at least one level.'; el.classList.add('bad'); return; }
    if (!total) { el.textContent = 'No questions match these choices yet.'; el.classList.add('bad'); return; }
    el.textContent = total + ' question' + (total === 1 ? '' : 's') + ' match. A board of ' + cfg.squares + ' squares uses ' + need + (nSur ? ' (and ' + nSur + ' surprise square' + (nSur === 1 ? '' : 's') + ')' : '') + ', different every game.' +
      (total < need ? ' There are not enough for every square, so the board will be smaller.' : '');
    if (total < need) el.classList.add('bad');
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
  ['#b-squares', '#b-surprise'].forEach(s => $(s).onchange = () => { read(); drawTotal(); kindsState(); });
  $$('#b-kinds input').forEach(i => i.onchange = () => { read(); drawTotal(); });
  const kindsState = () => { const off = $('#b-surprise').value === 'none'; $('#b-kinds').setAttribute('aria-disabled', off); $$('#b-kinds input').forEach(i => { i.disabled = off; }); };
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
    const s = Object.assign({}, cfg, {id: old ? old.id : uid(), created: old ? old.created : Date.now(),
      title: cfg.title || cfg.topics.map(topicName).join(' + ') + ' quiz'});
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
  document.title = game.title + ' · Board game';
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
    '<p class="bg-keys">Click a square, or type its number. In a question: <kbd>Space</kbd> pause the timer · <kbd>A</kbd>–<kbd>D</kbd> the team\'s answer · <kbd>S</kbd> show the answer · <kbd>Y</kbd> right · <kbd>N</kbd> wrong · <kbd>Esc</kbd> close</p>';
  document.body.appendChild(el);
  P.stage = el.querySelector('.bg-stage'); P.grid = el.querySelector('.bg-grid'); P.scores = el.querySelector('.bg-scores'); P.prompt = el.querySelector('.bg-prompt');
  el.querySelector('[data-t=sound]').onclick = () => { P.sound = !P.sound; setJ(K_SOUND, P.sound); tools(); if (P.sound) sfx('right'); };
  el.querySelector('[data-t=full]').onclick = () => { const d = document;
    if (d.fullscreenElement) d.exitFullscreen().catch(() => {}); else if (d.documentElement.requestFullscreen) d.documentElement.requestFullscreen().catch(() => {}); };
  el.querySelector('[data-t=end]').onclick = () => { if (!P.card) endScreen(); };
  el.querySelector('[data-t=exit]').onclick = () => { location.hash = '#/board'; };
  P.onResize = () => { sizeUp(); layoutGrid(); if (P.card) fitCard(); };
  P.onKey = onKey; P.onFs = () => tools();
  addEventListener('resize', P.onResize); addEventListener('keydown', P.onKey, true); document.addEventListener('fullscreenchange', P.onFs);
  tools(); sizeUp(); drawScores(); drawGrid(); drawPrompt();
  if (!P.data) dataFor(game.cfg.topics).then(d => { if (P && P.game === game) P.data = d; }).catch(() => {});   // for New question
  if (game.tiles.every(t => t.done)) endScreen();
}
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
  const g = P.game, left = g.tiles.filter(t => !t.done).length, t = g.teams[g.turn];
  P.prompt.innerHTML = left ? '<b style="color:' + t.c + '">' + esc(t.name) + '</b>, choose a square' : 'Every square is open!';
}
function layoutGrid(){
  const n = P.game.tiles.length, w = P.stage.clientWidth, h = P.stage.clientHeight;
  if (!w || !h) return;
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
function tileInner(t){
  const g = P.game;
  if (!t.done) return '<span class="face front">' + t.n + '</span><span class="face back">' + (t.k === 'q' ? '?' : '★') + '</span>';
  const r = t.r || {}, team = g.teams[r.team];
  let res;
  if (t.k !== 'q' && t.k !== 'double' || r.sur) res = '<span class="pts">' + SURPRISES[r.sur || t.k].icon + '</span><span class="nm" style="color:var(--ink)">' + esc(r.text || SURPRISES[t.k].name) + '</span>' + (team ? '<span class="nm">' + esc(team.name) + '</span>' : '');
  else if (r.ok && team) res = '<span class="dot" style="--tc:' + team.c + '"></span><span class="pts">' + (r.pts ? '+' + r.pts : '✓') + '</span><span class="nm">' + esc(team.name) + '</span>';
  else res = '<span class="pts" style="color:var(--muted)">✗</span><span class="nm">No points</span>';
  return '<span class="face front"><span class="res">' + res + '</span></span>';
}
function drawGrid(){
  P.grid.innerHTML = P.game.tiles.map((t, i) => '<button type="button" class="bg-tile' + (t.done ? ' done' : '') + '" data-i="' + i + '"' +
    ' aria-label="' + (t.done ? 'Square ' + t.n + ', open' : 'Square ' + t.n) + '"' + (t.done ? ' aria-disabled="true"' : '') + '><span class="in">' + tileInner(t) + '</span></button>').join('');
  P.grid.querySelectorAll('.bg-tile').forEach(b => b.onclick = () => openTile(+b.dataset.i));
  layoutGrid();
}
function redrawTile(i){
  const b = P.grid.children[i], t = P.game.tiles[i]; if (!b) return;
  b.className = 'bg-tile' + (t.done ? ' done' : ''); b.querySelector('.in').innerHTML = tileInner(t);
  b.setAttribute('aria-label', t.done ? 'Square ' + t.n + ', open' : 'Square ' + t.n);
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
    P.open = {i, turn: P.game.turn, team: P.game.turn, tried: [], shown: P.game.cfg.options !== 'hide', revealed: false, marked: false, award: true, double: t.k === 'double'};
    if (t.k === 'q') questionCard(); else surpriseCard(); }, reduced() ? 60 : 420);
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
function nextTurn(){ const g = P.game; g.turn = (P.open.turn + 1) % g.teams.length; }
function finishTile(result, bump){
  const g = P.game, t = g.tiles[P.open.i];
  t.done = true; t.r = result; nextTurn(); save();
  zoomOut(() => { drawScores(bump); drawPrompt(); if (g.tiles.every(x => x.done)) setTimeout(() => { if (P && !P.card) endScreen(); }, 900); });
}

// ---------- the question card ----------
const KIND = {word: 'What does it mean?', def: 'Which word?', zh: '中文 → English', gap: 'Fill the gap', tf: 'True or false', rw: 'SPAG: Right or Wrong', question: 'Answer the question', gk: 'General knowledge'};
function qBody(q){
  const instr = {word: 'What does this word mean?', def: 'Which word means this?', zh: 'Which English word is this?', gap: 'Which word fills the gap?',
    tf: 'True or false?', rw: 'Is this sentence right, or does it have a mistake?', question: 'Which answer does what the question asks?', gk: 'General knowledge'}[q.k];
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
const metaOf = q => [topicName(q.t), q.lv != null ? LEVEL_NAME[band(q.lv)] : '', q.focus || ''].filter(Boolean).join(' · ');
function questionCard(instant){
  const g = P.game, o = P.open, t = g.tiles[o.i], q = t.q, pts = t.p * (o.double ? 2 : 1), secs = +g.cfg.secs || 0;
  const meta = metaOf(q);
  const card = document.createElement('div');
  card.className = 'bg-card'; card.tabIndex = -1; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', 'Question ' + t.n);
  card.innerHTML =
    '<div class="bg-card-top"><span class="bg-num">' + t.n + '</span>' +
      '<div class="bg-meta"><span class="k">' + esc(KIND[q.k]) + '</span><span class="s">' + esc(meta) + '</span></div>' +
      '<button type="button" class="bg-btn small" data-a="swap" title="Put a different question on this square">New question</button>' +
      '<span class="bg-pts' + (o.double ? ' double' : '') + '">' + (o.double ? '⚡ ' : '') + pts + ' points</span>' +
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
  card.querySelector('[data-a=show]').onclick = () => reveal(null);
  card.querySelector('[data-a=right]').onclick = () => mark(true);
  card.querySelector('[data-a=wrong]').onclick = () => mark(false);
  card.querySelector('[data-a=swap]').onclick = () => swapQuestion();
  card.querySelector('[data-a=award]').onchange = e => { o.award = e.target.checked; drawWho(); };
  card.querySelectorAll('[data-team]').forEach(b => b.onclick = () => { if (o.tried.includes(+b.dataset.team) && !o.marked) return; o.team = +b.dataset.team; drawWho(); });
  const tb = card.querySelector('.bg-timer'); if (tb) tb.onclick = () => toggleTimer();
  drawOpts(card); zoomIn(card, instant); drawWho();
  startTimer(secs);
}
function drawOpts(card){
  card = card || P.card; const o = P.open, q = P.game.tiles[o.i].q, box = card.querySelector('.bg-opts');
  if (!o.shown) { box.innerHTML = '<button type="button" class="bg-btn solid bg-reveal-opts">Show the options <kbd>O</kbd></button>';
    box.querySelector('button').onclick = () => { o.shown = true; drawOpts(); fitCard(); }; return; }
  const two = q.opts.length === 2;
  box.innerHTML = q.opts.map((x, i) => '<button type="button" class="bg-opt" data-o="' + i + '" title="The team\'s answer">' + (two ? '' : '<span class="l">' + 'ABCD'[i] + '</span>') + '<span class="o">' + esc(x) + '</span></button>').join('');
  box.querySelectorAll('.bg-opt').forEach(b => b.onclick = () => reveal(+b.dataset.o));
  if (o.revealed) paintReveal();
}
function drawWho(){
  const o = P.open, card = P.card; if (!card || !card.querySelector('.bg-who')) return;
  const g = P.game, t = g.tiles[o.i], pts = t.p * (o.double ? 2 : 1);
  card.querySelectorAll('[data-team]').forEach(b => { const i = +b.dataset.team; b.setAttribute('aria-pressed', i === o.team); b.disabled = o.tried.includes(i); b.style.opacity = o.tried.includes(i) ? .4 : ''; });
  const r = card.querySelector('[data-a=right]'); r.innerHTML = '✓ Right' + (o.award ? ' +' + pts : '') + ' <kbd>Y</kbd>';
  const w = card.querySelector('[data-a=wrong]'); w.innerHTML = '✗ Wrong' + (o.award && g.cfg.wrong === 'lose' ? ' −' + pts : '') + ' <kbd>N</kbd>';
  w.disabled = o.tried.length >= g.teams.length;
  const sw = card.querySelector('[data-a=swap]'); if (sw) sw.hidden = o.revealed || o.marked;
}
// The teacher clicks the option the team chose (or Show answer): the right one goes green, a wrong choice red
function reveal(chosen){
  const o = P.open; if (!o || !P.card) return;
  if (!o.shown) { o.shown = true; drawOpts(); }
  o.revealed = true; if (chosen != null) o.chosen = chosen;
  paintReveal(); stopTimer(true); drawWho();
  const q = P.game.tiles[o.i].q;
  if (chosen != null && !o.marked) { const ok = chosen === q.a; P.card.querySelector('[data-a=' + (ok ? 'right' : 'wrong') + ']').classList.add('hint');
    P.card.querySelector('[data-a=' + (ok ? 'wrong' : 'right') + ']').classList.remove('hint'); }
  fitCard();
}
function paintReveal(){
  const o = P.open, q = P.game.tiles[o.i].q, card = P.card;
  card.querySelectorAll('.bg-opt').forEach((b, i) => { b.classList.toggle('ok', i === q.a); b.classList.toggle('no', i === o.chosen && i !== q.a); b.classList.toggle('dim', i !== q.a && i !== o.chosen); });
  const gap = card.querySelector('.bg-gap'); if (gap) { gap.textContent = q.opts[q.a]; gap.classList.add('filled'); }
  card.querySelector('.bg-more').innerHTML = qMore(q);
}
function mark(ok){
  const o = P.open, g = P.game; if (!o || !P.card || P.busy) return;
  const t = g.tiles[o.i], pts = t.p * (o.double ? 2 : 1), team = g.teams[o.team], said = P.card.querySelector('.bg-said');
  P.card.querySelectorAll('.hint').forEach(b => b.classList.remove('hint'));
  if (ok) {
    const got = o.award ? pts : 0; team.s += got;
    if (!o.revealed) reveal(null);
    said.className = 'bg-said good'; said.textContent = got ? '✓ ' + team.name + ' +' + got : '✓ ' + team.name + ' (no points)';
    sfx('right'); stopTimer(true);
    P.busy = true;
    setTimeout(() => { if (!P) return; P.busy = false; finishTile({ok: true, team: o.team, pts: got}, {[o.team]: got}); }, 1100);
    return;
  }
  if (o.tried.includes(o.team)) return;
  const lost = o.award && g.cfg.wrong === 'lose' ? Math.min(pts, team.s) : 0;
  team.s -= lost; o.tried.push(o.team); o.marked = true; o.lost = (o.lost || {}); if (lost) o.lost[o.team] = -lost;
  sfx('wrong'); stopTimer(true); save(); drawScores(lost ? {[o.team]: -lost} : null);
  const left = g.teams.map((_, i) => i).filter(i => !o.tried.includes(i));
  said.className = 'bg-said bad';
  said.textContent = '✗ ' + team.name + (lost ? ' −' + lost : '') + (left.length ? '. Another team can try, or close the question.' : '. Nobody got it: show the answer, then close.');
  if (left.length) { const after = left.find(i => i > o.team); o.team = after != null ? after : left[0]; }
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
  if (!P.data) { said.className = 'bg-said'; said.textContent = 'Still loading the other questions. Try again in a moment.'; return; }
  const used = new Set(g.used || []), cur = t.q.t + '|' + t.q.b + '|' + t.q.id;
  used.add(cur);
  const same = Object.assign({}, g.cfg, {banks: [t.q.b], topics: [t.q.t]});
  let q = draw(same, P.data, 1, used)[0] || draw(g.cfg, P.data, 1, used)[0];
  if (!q) { said.className = 'bg-said'; said.textContent = 'There are no more questions to swap in.'; return; }
  g.used = [...used]; t.q = q; if (g.cfg.points === 'level') t.p = POINTS_BY_LEVEL[band(q.lv)] || 20;
  save();
  const card = P.card, secs = +g.cfg.secs || 0;
  card.querySelector('.bg-q').innerHTML = qBody(q);
  card.querySelector('.bg-meta .k').textContent = KIND[q.k];
  card.querySelector('.bg-meta .s').textContent = metaOf(q);
  card.querySelector('.bg-pts').textContent = (o.double ? '⚡ ' : '') + t.p * (o.double ? 2 : 1) + ' points';
  card.querySelector('.bg-opts').className = 'bg-opts' + (q.opts.length === 2 ? ' two' : '');
  card.querySelector('.bg-more').innerHTML = ''; o.chosen = null; o.shown = g.cfg.options !== 'hide';
  said.textContent = ''; drawOpts(); drawWho(); fitCard(); startTimer(secs);
}
// Big text that still fits: the options shrink until they fit their half of the card, then the question fills the rest
function fitCard(){
  const card = P && P.card; if (!card) return;
  const u = P.u, opts = card.querySelector('.bg-opts'), q = card.querySelector('.bg-q'), text = card.querySelector('.bg-text');
  if (opts && opts.querySelector('.bg-opt')) {
    const os = [...opts.querySelectorAll('.o')], two = opts.classList.contains('two');
    // the options get up to 60% of the space between the top line and the marking bar (a third for True/False), the question the rest
    const cs = getComputedStyle(card), top = card.querySelector('.bg-card-top'), mk = card.querySelector('.bg-mark');
    const middle = card.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - (top ? top.offsetHeight : 0) - (mk ? mk.offsetHeight : 0) - 3 * (parseFloat(cs.rowGap) || 0);
    opts.style.maxHeight = Math.max(70 * u, middle * (two ? .34 : .6)) + 'px';
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
function surpriseCard(){
  const g = P.game, o = P.open, t = g.tiles[o.i], S = SURPRISES[t.k];
  const amt = g.cfg.points === 'same' ? 10 : 20;
  const card = document.createElement('div');
  card.className = 'bg-card surprise'; card.tabIndex = -1; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', 'Surprise: ' + S.name);
  const draw = () => {
    const team = g.teams[o.team], others = g.teams.map((x, i) => i).filter(i => i !== o.team);
    const pickBtns = (label) => '<div class="bg-sp-pick">' + others.map(i => '<button type="button" data-pick="' + i + '" style="--tc:' + g.teams[i].c + '">' + esc(g.teams[i].name) + (label ? '<span>' + g.teams[i].s + '</span>' : '') + '</button>').join('') + '</div>';
    let text = '', acts = '';
    const who = '<b>' + esc(team.name) + '</b>';
    if (t.k === 'bonus') { text = who + ' get ' + amt + ' points. No question!'; acts = '<button type="button" class="bg-btn solid" data-go="bonus" data-first>Add ' + amt + ' points</button>'; }
    else if (t.k === 'oops') { text = who + ' lose ' + amt + ' points.'; acts = '<button type="button" class="bg-btn solid" data-go="oops" data-first>Take ' + Math.min(amt, team.s) + ' points</button><button type="button" class="bg-btn" data-go="skip">Let them off</button>'; }
    else if (t.k === 'steal') { text = who + ': choose a team to take ' + amt + ' points from.'; acts = pickBtns(true); }
    else if (t.k === 'give') { text = who + ': choose a team to give ' + amt + ' points to.'; acts = pickBtns(true); }
    else if (t.k === 'swap') { text = who + ' (' + team.s + '): swap scores with any team, or keep your own.'; acts = pickBtns(true) + '<button type="button" class="bg-btn" data-go="skip">Keep our score</button>'; }
    card.innerHTML =
      '<div class="bg-card-top"><span class="bg-num">' + t.n + '</span><span style="flex:1"></span><button type="button" class="bg-x" title="Put it back (Esc)" aria-label="Put it back">×</button></div>' +
      '<div class="bg-sp-icon" aria-hidden="true">' + S.icon + '</div><p class="bg-sp-name">' + S.name + '</p><p class="bg-sp-text">' + text + '</p>' +
      '<div class="bg-sp-pick" style="gap:8px">' + acts + '</div>' +
      '<p class="note" style="color:#151935;opacity:.75">For a different team: <span class="bg-sp-for"></span></p>';
    const forBox = card.querySelector('.bg-sp-for');
    forBox.innerHTML = g.teams.map((x, i) => i === o.team ? '' : '<a href="#" data-for="' + i + '" style="color:#151935;font-weight:700;margin-right:10px">' + esc(x.name) + '</a>').join('');
    forBox.querySelectorAll('[data-for]').forEach(a => a.onclick = e => { e.preventDefault(); o.team = +a.dataset.for; draw(); });
    card.querySelector('.bg-x').onclick = () => { if (!P.busy) zoomOut(() => {}); };
    card.querySelectorAll('[data-go],[data-pick]').forEach(b => b.onclick = () => apply(b.dataset.go || t.k, b.dataset.pick != null ? +b.dataset.pick : null));
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
    else if (what === 'skip') { text = t.k === 'swap' ? 'Kept their score' : 'Let off'; }
    sfx(what === 'oops' ? 'wrong' : what === 'skip' ? 'open' : 'right');
    Object.keys(bump).forEach(k => { if (!bump[k]) delete bump[k]; });
    finishTile({sur: t.k, team: o.team, text}, bump);
  };
  if (t.k === 'double') {
    card.innerHTML = '<div class="bg-card-top"><span class="bg-num">' + t.n + '</span><span style="flex:1"></span><button type="button" class="bg-x" title="Put it back (Esc)" aria-label="Put it back">×</button></div>' +
      '<div class="bg-sp-icon" aria-hidden="true">' + S.icon + '</div><p class="bg-sp-name">' + S.name + '</p>' +
      '<p class="bg-sp-text">This question is worth <b>' + t.p * 2 + ' points</b>.</p>' +
      '<div class="bg-sp-pick"><button type="button" class="bg-btn solid" data-go="q" data-first>Show the question</button></div>';
    card.querySelector('.bg-x').onclick = () => { if (!P.busy) zoomOut(() => {}); };
    card.querySelector('[data-go=q]').onclick = () => { if (P.busy) return; card.remove(); P.card = null; questionCard(true); };   // the question takes its place, no second zoom
  } else draw();
  zoomIn(card);
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
  name.oninput = () => { t.name = name.value.trim() || t.name; save(); drawScores(); drawPrompt(); g.tiles.forEach((x, k) => { if (x.done) redrawTile(k); }); };
  const tb = pop.querySelector('[data-turn]'); if (tb) tb.onclick = () => { g.turn = i; save(); drawScores(); drawPrompt(); closePop(); };
  pop.querySelector('[data-done]').onclick = closePop;
  score.focus(); score.select();
  setTimeout(() => { const away = e => { if (!document.body.contains(pop)) return document.removeEventListener('pointerdown', away, true);
    if (!pop.contains(e.target) && !(e.target.closest && e.target.closest('.bg-team-chip'))) { closePop(); document.removeEventListener('pointerdown', away, true); } };
    document.addEventListener('pointerdown', away, true); }, 0);
}

// ---------- final scores ----------
function endScreen(){
  if (!P || P.card) return;
  closePop();
  const g = P.game, ranked = g.teams.map((t, i) => Object.assign({i}, t)).sort((a, b) => b.s - a.s);
  const top = ranked[0].s, winners = ranked.filter(t => t.s === top);
  let place = 0;
  const rows = ranked.map((t, k) => { if (k === 0 || t.s !== ranked[k - 1].s) place = k + 1;
    return '<li class="' + (t.s === top ? 'win' : '') + '" style="--tc:' + t.c + ';animation-delay:' + (k * .12) + 's"><span class="p">' + (t.s === top ? '🏆' : place) + '</span><span class="n">' + esc(t.name) + '</span><span class="s">' + t.s + '</span></li>'; }).join('');
  const left = g.tiles.filter(t => !t.done).length;
  const end = document.createElement('div');
  end.className = 'bg-end';
  end.innerHTML = '<div class="bg-confetti" aria-hidden="true"></div>' +
    '<h2>' + (winners.length === g.teams.length ? 'It\'s a draw!' : winners.length > 1 ? 'A tie for first place!' : esc(winners[0].name) + ' win!') + '</h2>' +
    '<p class="sub">' + (left ? left + ' square' + (left === 1 ? '' : 's') + ' not opened' : 'Final scores') + '</p>' +
    '<div class="bg-rank"><ol>' + rows + '</ol></div>' +
    '<div class="acts"><button type="button" class="bg-btn" data-e="back">Back to the board</button><button type="button" class="bg-btn" data-e="again">Play again (new questions)</button><button type="button" class="bg-btn solid" data-e="done">Finish</button></div>';
  P.stage.appendChild(end); P.endEl = end;
  if (!reduced()) { const box = end.querySelector('.bg-confetti'), cols = winners.map(w => w.c).concat(['#ffe14d', '#ffffff']);
    for (let k = 0; k < 90; k++) { const c = document.createElement('i'); c.style.left = Math.random() * 100 + '%'; c.style.background = pick(cols);
      c.style.animationDuration = (2.4 + Math.random() * 2.6) + 's'; c.style.animationDelay = (Math.random() * 1.2) + 's'; c.style.transform = 'rotate(' + Math.random() * 360 + 'deg)'; box.appendChild(c); } }
  sfx('win');
  end.querySelector('[data-e=back]').onclick = () => { end.remove(); P.endEl = null; };
  end.querySelector('[data-e=again]').onclick = () => {
    const set = setOf(g.set); if (!set) return;
    end.querySelector('.acts').innerHTML = '<p class="sub">Getting new questions…</p>';
    dataFor(set.topics).then(data => { const n = newGame(set, data); n.teams = g.teams.map(t => Object.assign({}, t, {s: 0})); saveGame(n); mount(n, data); })
      .catch(x => { end.querySelector('.acts').innerHTML = '<p class="err">' + esc(x.message) + '</p>'; });
  };
  end.querySelector('[data-e=done]').onclick = () => { dropGame(g.set); location.hash = '#/board'; };
  end.querySelector('[data-e=' + (left ? 'back' : 'done') + ']').focus({preventScroll: true});
}

// ---------- keys (a laptop at the front, or a keyboard by the board) ----------
function onKey(e){
  if (!P) return;
  if (e.target && (e.target.matches('input:not([type=checkbox]), textarea, select') || e.target.isContentEditable)) { if (e.key === 'Escape') closePop(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key, card = P.card;
  if (P.endEl) { if (k === 'Escape') { P.endEl.remove(); P.endEl = null; e.preventDefault(); } return; }
  if (document.querySelector('.bg-pop')) { if (k === 'Escape') { closePop(); e.preventDefault(); } return; }
  if (card && P.open) {
    const isQ = !card.classList.contains('surprise');
    if (k === 'Escape') { e.preventDefault(); if (isQ) closeQuestion(); else if (!P.busy) zoomOut(() => {}); return; }
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
  if (/^[0-9]$/.test(k)) {
    e.preventDefault(); clearTimeout(P.keyWait); P.keyBuf = (P.keyBuf + k).slice(-2);
    const n = +P.keyBuf, max = P.game.tiles.length, go = () => { const i = P.game.tiles.findIndex(t => t.n === +P.keyBuf); P.keyBuf = ''; if (i >= 0) openTile(i); };
    if (P.keyBuf.length === 2 || n * 10 > max) go(); else P.keyWait = setTimeout(go, 900);
    return;
  }
  if (/^Arrow/.test(k)) {
    const tiles = [...P.grid.children], cur = tiles.indexOf(document.activeElement), c = P.cols || 5;
    let i = cur < 0 ? 0 : cur + ({ArrowRight: 1, ArrowLeft: -1, ArrowDown: c, ArrowUp: -c})[k];
    i = Math.max(0, Math.min(tiles.length - 1, i)); tiles[i].focus(); e.preventDefault();
  }
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
