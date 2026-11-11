/* Handouts (8 Nov 2026, teacher): "a handout that kids can use to learn the keywords. The teacher should select a topic,
   select the words and it will provide a Chinese language translation sheet with those words on it… words, definitions and
   some work that they can complete to learn them. A maximum of 15 words per sheet… a maximum of two sides of A4…
   downloadable as word files".
   Side 1: the words, their Chinese and their meaning. Side 2: activities to learn them, chosen by the teacher; a meter shows
   how full side 2 is, and an activity that won't fit is greyed out. A separate answer sheet can be downloaded too.
   Lives on the teacher page (teacher/index.html calls AEA_HANDOUT.route for #/handouts).
   Words from the topic's words.csv (content/<subject>/<topic>/) (word, pos, meaning, zh, example, group, level); Fill the gap uses gaps.csv sentences
   whose answer is the word (or a form of it), else the word's example sentence. The word search comes from the Starters'
   maker (AEA_START.ws in teacher/starters.js); the crossword from the site's crossword maker (en/engine/crossword.js, AEA_XW).
   The Word file is made here, in the browser: a .docx is a zip of XML files (docx() and zip() below), so nothing is loaded from
   outside the site. Sizes: twips (1 cm = 567). Saved in this browser: "aeaBoard:handout" (the last topic, words, title, activities). */
(function(){
'use strict';
const B = window.AEA_BOARD && window.AEA_BOARD.lib, WS = window.AEA_START && window.AEA_START.ws, XW = window.AEA_XW;
if (!B) return;
const {TOPICS, LEVELS, LEVEL_NAME, parseCSV, levelNum, band, esc, shuffle, getJ, setJ, topicName} = B;
const ROOT = '../', K = 'aeaBoard:handout', MAX = 15, SIDE2 = 24.3;   // cm of side 2 the activities may use
const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');

// ---------- side 2: the activities ----------
const ACTS = [
  {k: 'zh',       name: 'Chinese → English',          zh: '看中文，写英文', how: 'Write the English word for each Chinese meaning.', blurb: 'The Chinese of every word: they write the English.'},
  {k: 'lcwc',     name: 'Look, cover, write, check',  zh: '看、盖、写、查', how: 'Look at the word, cover it, write it, then check it. Do it twice.', blurb: 'Spelling practice: every word written twice.'},
  {k: 'ws',       name: 'Word search',                zh: '单词搜索',       how: 'Find the English words for these Chinese meanings. Words go across, down and diagonally.', blurb: 'Up to 10 of the words hidden in a square of letters, with Chinese clues.'},
  // Crossword (9 Nov 2026, teacher): the clues are the Chinese, with the letters in each word as in printed crosswords: (4,2,6)
  {k: 'xw',       name: 'Crossword',                  zh: '填字游戏',       how: 'Write the English word for each Chinese clue in the grid. The numbers in brackets are how many letters it has.', blurb: 'Up to 10 of the words in a crossword, with Chinese clues.'},
  {k: 'gap',      name: 'Fill the gap',               zh: '填空',           how: 'Write the missing word in each sentence. Use the word bank.', blurb: 'Up to 6 sentences with a word missing, and a word bank.'},
  {k: 'anagram',  name: 'Unscramble',                 zh: '字母重组',       how: 'Put the letters in order to make the word. The Chinese is a clue.', blurb: 'Up to 8 of the words with their letters mixed up.'},
  {k: 'sentence', name: 'Use it in a sentence',       zh: '造句',           how: 'Write a sentence of your own with each word.', blurb: 'Three of the words, with lines to write on.'}
];
const ACT = Object.fromEntries(ACTS.map(a => [a.k, a]));
const DEFAULTS = {topic: '', picks: {}, title: '', acts: ['zh', 'ws', 'anagram']};

// ---------- the words ----------
const loaded = {};
function loadTopic(key){
  if (loaded[key]) return loaded[key];
  const get = f => fetch(B.csvURL(key, f), {cache: 'no-cache'}).then(r => r.ok ? r.text() : '').then(parseCSV).catch(() => []);
  const p = Promise.all([get('words'), get('gaps')]).then(([w, g]) => {
    const ids = new Set(), words = [];
    w.forEach(r => { if (!r.id || !r.word || !r.meaning || ids.has(r.id)) return; ids.add(r.id);
      words.push({id: r.id, w: r.word.split(/\s*\/\s*/)[0].replace(/\s*\([^)]*\)\s*/g, ' ').trim(), full: r.word, pos: r.pos || '', def: r.meaning, zh: r.zh || '', ex: r.example || '',
        lv: levelNum(r.level), group: (r.group || '').trim()}); });
    if (!words.length) throw new Error("Couldn't load the words for " + topicName(key) + '.');
    return {key, words, gaps: g.filter(r => r.sentence && r.sentence.includes('___') && r.answer)};
  });
  loaded[key] = p; p.catch(() => { delete loaded[key]; });
  return p;
}
// A sentence with the word missing: a Fill the gap sentence whose answer is the word (or a form of it), or the word's example
const forms = w => { w = w.toLowerCase(); const f = new Set([w, w + 's', w + 'es', w + 'ed', w + 'd', w + 'ing', w + 'er', w + 'ly']);
  if (w.endsWith('e')) { f.add(w.slice(0, -1) + 'ing'); f.add(w.slice(0, -1) + 'ed'); }
  if (w.endsWith('y')) { f.add(w.slice(0, -1) + 'ies'); f.add(w.slice(0, -1) + 'ied'); } return f; };
function gapFor(w, T){
  const f = forms(w.w);
  const g = shuffle(T.gaps.filter(r => f.has(r.answer.trim().toLowerCase()) && r.sentence.length <= 150))[0];
  if (g) return {s: g.sentence.replace(/_{3,}/, '___'), a: g.answer.trim()};
  const re = new RegExp('\\b(' + w.w.split(/\s+/).map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+') + ')(s|es|ed|d|ing)?\\b', 'i'), m = w.ex && w.ex.length <= 150 && re.exec(w.ex);
  return m ? {s: w.ex.slice(0, m.index) + '___' + w.ex.slice(m.index + m[0].length), a: m[0]} : null;
}
const letters = s => String(s).replace(/[^A-Za-z]/g, '');
// Crossword: words of letters only (spaces, hyphens and apostrophes between words; 4 words at most), and a Chinese clue that
// doesn't contain the English word
const xwOK = w => { const t = XW.show(w.w).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return /^[a-z][a-z '’\-]*$/.test(t) && t.split(/[\s-]+/).filter(Boolean).length <= 4 && XW.letters(w.w).length >= 3 && XW.letters(w.w).length <= 13 && !XW.gives(w.w, zhShort(w.zh)); };
// Side 2's clues use the first, short Chinese meaning ("锚定（文字固定图像意义）" → "锚定"; "迅速走红；在网上疯传" → "迅速走红"); side 1 has it all
const zhShort = z => (String(z || '').split(/[；;，,]/)[0].replace(/（[^）]*）|\([^)]*\)/g, '').trim() || String(z || '').trim());
function scramble(word){
  const L = letters(word).toUpperCase(); if (new Set(L).size < 2) return null;
  for (let k = 0; k < 40; k++) { const s = shuffle(L.split('')).join(''); if (s !== L) return s; }
  return null;
}

// One activity from the words chosen (the same words give the same counts, so its height is known before it's added)
function makeAct(k, words, T){
  if (k === 'zh') return {k, items: shuffle(words).map(w => ({zh: zhShort(w.zh), w: w.w}))};
  if (k === 'lcwc') return {k, items: words.map(w => ({w: w.w}))};
  if (k === 'ws') {
    if (!WS) return null;
    const fit = shuffle(words.filter(w => WS.wsOK(w))).map(w => ({w: WS.wsShow(w), zh: zhShort(w.zh), def: w.def, L: WS.wsL(w)}))
      .filter((c, i, all) => !all.slice(0, i).some(o => o.L.includes(c.L) || c.L.includes(o.L)));
    if (fit.length < 4) return null;
    const n = Math.min(10, fit.length), size = fit.slice(0, n).some(c => c.L.length > 10) || n > 7 ? 12 : 10;
    const made = WS.wsMake(fit, n, size, WS.WS_DIRS[3]); if (!made) return null;
    return {k, size, b: made.b.map(r => r.join('')), words: shuffle(made.placed).map(p => ({w: p.w, zh: p.zh, n: p.L.length, cells: p.cells}))};
  }
  if (k === 'xw') {
    if (!XW) return null;
    const fit = shuffle(words.filter(xwOK)).map(w => ({w: w.w, zh: zhShort(w.zh), en: XW.enumeration(w.w), L: XW.letters(w.w)}))
      .filter((c, i, all) => !all.slice(0, i).some(o => o.L === c.L || o.zh === c.zh));
    if (fit.length < 4) return null;
    const lay = XW.make(fit, {n: Math.min(10, fit.length), maxW: 13, maxH: 13}); if (!lay || lay.words.length < 4) return null;
    const clue = x => ({num: x.num, zh: x.zh, en: x.en, w: x.w});
    return {k, w: lay.w, h: lay.h, cells: lay.cells, nums: lay.nums, across: lay.across.map(clue), down: lay.down.map(clue)};
  }
  if (k === 'gap') {
    const items = [];
    for (const w of shuffle(words)) { const g = gapFor(w, T); if (g && !items.some(x => x.a.toLowerCase() === g.a.toLowerCase())) items.push(g); if (items.length === 6) break; }
    return items.length >= 3 ? {k, items, bank: items.map(x => x.a).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))} : null;
  }
  if (k === 'anagram') {
    const items = [];
    for (const w of shuffle(words)) { const parts = w.w.split(/\s+/);
      if (parts.length > 2 || letters(w.w).length < 4 || letters(w.w).length > 14 || !/^[A-Za-z][A-Za-z'’ -]*$/.test(w.w)) continue;
      const mix = parts.map(scramble); if (mix.some(m => !m)) continue;
      items.push({mix, lens: parts.map(p => letters(p).length), zh: zhShort(w.zh), w: w.w}); if (items.length === 8) break; }
    return items.length >= 3 ? {k, items} : null;
  }
  if (k === 'sentence') { const items = shuffle(words).slice(0, 3).map(w => ({w: w.w, zh: zhShort(w.zh)})); return items.length ? {k, items} : null; }
  return null;
}
// Two items to a row: [item, line, item, line] in twips
const COLS = {zh: [2750, 2183, 2750, 2183], anagram: [3350, 1583, 3350, 1583]};
const cjk = s => (String(s).match(/[\u3000-\u9fff\uff00-\uffef]/g) || []).length;
const itemCm = (k, x) => k === 'zh' ? 0.75 + cjk(x.zh) * 0.43 + (x.zh.length - cjk(x.zh)) * 0.2
  : 0.75 + x.mix.join(' / ').length * 0.3 + 0.35 + cjk(x.zh) * 0.38;
const rowsCm = (k, items) => { const w = COLS[k][0] / 567 - 0.25; let h = 0;
  for (let i = 0; i < items.length; i += 2) h += items.slice(i, i + 2).some(x => itemCm(k, x) > w) ? 1.45 : 0.95; return h; };
// How tall each activity is on paper, in cm (checked against the Word files made by LibreOffice; generous on purpose)
const HEAD = 1.35;
function actHeight(a){
  switch (a.k) {
    case 'zh': return HEAD + rowsCm('zh', a.items);
    case 'lcwc': return HEAD + 0.75 + a.items.length * 0.72;
    case 'ws': return HEAD + Math.max(a.size * 0.6, a.words.length * 0.6 + 0.6) + 0.25;
    case 'xw': return HEAD + Math.max(a.h * 0.6, 1.4 + (a.across.length + a.down.length) * 0.6) + 0.3;
    case 'gap': return HEAD + a.items.reduce((h, x) => h + (x.s.length > 85 ? 1.25 : 0.8), 0) + 1.2;
    case 'anagram': return HEAD + rowsCm('anagram', a.items);
    case 'sentence': return HEAD + a.items.length * 2.15;
  }
  return 0;
}
// Side 1: the table of words. Long meanings take more lines: the meaning text gets smaller until the side fits.
const SIDE1 = 24.0;
function side1(words){
  for (const sz of [10, 9.5, 9, 8.5]) {
    const perLine = 5066 / 567 / (sz * 0.0185), h = 3.4 + words.reduce((t, w) => t + Math.max(1.0, Math.ceil(w.def.length / perLine) * sz * 0.045 + 0.3), 0);
    if (h <= SIDE1) return {sz, h, ok: true};
  }
  return {sz: 8.5, ok: false};
}

// =====================================================================================================================
let C = null;
const AEA_HANDOUT = window.AEA_HANDOUT = {
  route(hash, ctx){ C = ctx; return page(); },
  stop(){}
};
const state = () => Object.assign(JSON.parse(JSON.stringify(DEFAULTS)), getJ(K, {}) || {});
function page(){
  C.setTitle('Vocab handouts'); C.header();
  const st = state();
  const topics = TOPICS.filter(t => !t.only);
  if (!topics.some(t => t.key === st.topic)) st.topic = topics[0].key;
  st.acts = (st.acts || []).filter(k => ACT[k]);
  let T = null, find = '', group = '', lv = [1, 2, 3, 4, 5], model = null;
  const picked = () => (st.picks[st.topic] = st.picks[st.topic] || []);
  const save = () => { setJ(K, st); C.touch(); };
  C.view.innerHTML = '<p style="margin:0 0 14px"><a class="backlink" href="#/">← Staff Room</a></p>' +
    '<p class="note st-lead">A two-sided A4 sheet for learning a topic\'s key words. Choose a topic and up to ' + MAX + ' words: side 1 lists them with their Chinese and meaning, side 2 has activities to learn them. Download it as a Word file to print, or to change first.</p>' +
    '<div class="st-build"><div class="st-main"><section class="card st-sec">' +
      '<div class="mt-bar"><div class="field"><label for="ho-topic">Topic</label><select id="ho-topic">' + topics.map(t => '<option value="' + t.key + '"' + (t.key === st.topic ? ' selected' : '') + '>' + esc(t.name) + '</option>').join('') + '</select></div>' +
        '<div class="field" id="ho-groupf"><label for="ho-group">Group</label><select id="ho-group"></select></div>' +
        '<div class="field"><label for="ho-find">Search</label><input type="text" id="ho-find" placeholder="A word, its Chinese, or part of a meaning"></div></div>' +
      '<div class="bg-chips" id="ho-levels">' + LEVELS.map(([n, name]) => '<label class="bg-chip"><input type="checkbox" value="' + n + '" checked><span>' + name + '</span></label>').join('') + '</div>' +
      '<div class="mt-list ho-list" id="ho-list"><p class="note">Loading the words…</p></div></section></div>' +
    '<aside class="st-side"><div class="card st-sec st-stick">' +
      '<div class="spread"><h2>Your handout</h2><span class="st-room" id="ho-n"></span></div>' +
      '<div class="field"><label for="ho-title">Title</label><input type="text" id="ho-title" maxlength="70"></div>' +
      '<div class="row"><button class="btn" type="button" id="ho-dl">Download the Word file</button></div>' +
      '<div class="row"><button class="btn small alt" type="button" id="ho-ans" title="A Word file with the answers to side 2">Answers (Word file)</button><button class="btn small alt" type="button" id="ho-new" title="New word search, new order, other sentences">🎲 New version</button></div>' +
      '<p class="err" id="ho-err" role="alert" hidden></p>' +
      '<h3 class="ho-h">Side 2: activities</h3><div class="ho-meter" id="ho-meter"><i></i><span></span></div><div id="ho-acts" class="ho-acts"></div>' +
      '<h3 class="ho-h">Side 1: the words <span class="note" id="ho-n2"></span></h3>' +
      '<div class="row"><button class="btn small alt" type="button" id="ho-fill">🎲 Fill up to ' + MAX + '</button><button class="btn small alt" type="button" id="ho-clear">Clear</button></div>' +
      '<ol class="mt-picked" id="ho-picked"></ol>' +
    '</div></aside></div>' +
    '<section class="card st-sec ho-prev-card"><div class="spread"><h2>Preview</h2><span class="note">The Word file looks much the same; Word may wrap lines a little differently.</span></div><div class="ho-pages" id="ho-pages"></div></section>';
  const $ = s => C.view.querySelector(s), $$ = s => [...C.view.querySelectorAll(s)];
  const err = m => { const e = $('#ho-err'); e.textContent = m || ''; e.hidden = !m; };
  const title = () => st.title.trim() || topicName(st.topic) + ': key words';
  const chosen = () => { const by = Object.fromEntries((T ? T.words : []).map(w => [w.id, w])); return picked().map(id => by[id]).filter(Boolean); };
  const rows = () => { if (!T) return []; const f = find.trim().toLowerCase();
    return T.words.filter(w => (!group || w.group === group) && (w.lv == null || lv.includes(band(w.lv))) && (!f || w.w.toLowerCase().includes(f) || w.zh.includes(f) || w.def.toLowerCase().includes(f))); };
  // The handout: made again when the words or the activities change (or 🎲), not when the title changes
  const remake = () => { const ws = chosen(); model = {words: ws, s1: side1(ws), acts: T ? st.acts.map(k => makeAct(k, ws, T)).filter(Boolean) : []}; };
  const s2used = acts => acts.reduce((h, a) => h + actHeight(a), 0);
  const drawPicked = () => {
    const ws = chosen();
    $('#ho-n').textContent = ws.length + ' of ' + MAX + ' words';
    $('#ho-n2').textContent = '(' + ws.length + ' of ' + MAX + ')';
    $('#ho-picked').innerHTML = ws.length ? ws.map((w, k) => '<li title="' + esc(w.def) + '"><span class="st-mk">' + (k + 1) + '</span><span><b>' + esc(w.w) + '</b> <span class="ho-zh">' + esc(w.zh) + '</span></span>' +
      '<button type="button" class="st-x" data-k="' + k + '" aria-label="Take ' + esc(w.w) + ' out">×</button></li>').join('') : '<li class="mt-none">Tick words in the list.</li>';
    $$('#ho-picked [data-k]').forEach(b => b.onclick = () => { const id = chosen()[+b.dataset.k].id; st.picks[st.topic] = picked().filter(x => x !== id); save(); changed(); });
  };
  // Side 2's activities: ticked ones fill the meter; one that won't fit (or can't be made from these words) is greyed out
  const drawActs = () => {
    const ws = chosen(), used = model ? s2used(model.acts) : 0;
    const box = $('#ho-meter'), pct = Math.min(100, Math.round(100 * used / SIDE2));
    box.querySelector('i').style.width = pct + '%'; box.classList.toggle('full', pct >= 92);
    box.querySelector('span').textContent = !ws.length ? 'Choose some words first' : 'Side 2 is ' + pct + '% full';
    $('#ho-acts').innerHTML = ACTS.map(a => { const on = st.acts.includes(a.k), dry = ws.length && T ? makeAct(a.k, ws, T) : null;
      const h = dry ? actHeight(dry) : 0, fits = on || used + h <= SIDE2, can = !!dry, off = !on && (!can || !fits);
      const why = !ws.length ? '' : !can ? (a.k === 'ws' ? 'Needs 4 words of 4 to 12 letters' : a.k === 'xw' ? 'Needs 4 words of 3 to 13 letters that cross' : a.k === 'gap' ? 'Not enough sentences for these words' : a.k === 'anagram' ? 'Needs 3 one- or two-word words' : '') : !fits ? 'No room left on side 2' : '';
      return '<label class="ho-act' + (on ? ' on' : '') + (off ? ' off' : '') + '"><input type="checkbox" value="' + a.k + '"' + (on ? ' checked' : '') + (off ? ' disabled' : '') + '>' +
        '<span><b>' + esc(a.name) + '</b> <span class="ho-zh">' + esc(a.zh) + '</span><span class="note">' + esc(why || a.blurb) + '</span></span></label>'; }).join('');
    $$('#ho-acts input').forEach(i => i.onchange = () => { st.acts = ACTS.map(a => a.k).filter(k => k === i.value ? i.checked : st.acts.includes(k)); save(); remake(); drawActs(); drawPreview(); });
  };
  const drawList = () => {
    const box = $('#ho-list');
    if (!T) { box.innerHTML = '<p class="note">Loading the words…</p>'; return; }
    const list = rows(), full = picked().length >= MAX;
    box.innerHTML = !list.length ? '<p class="note">No words match.</p>' : '<p class="note">' + plural(list.length, 'word') + '</p>' + list.map((w, k) => { const on = picked().includes(w.id), no = !w.zh;
      return '<label class="mt-w' + (on ? ' on' : '') + (no ? ' off' : '') + '"><input type="checkbox" data-k="' + k + '"' + (on ? ' checked' : '') + ((full && !on) || no ? ' disabled' : '') + '>' +
        '<span><b>' + esc(w.w) + '</b> <span class="ho-zh">' + esc(w.zh || 'No Chinese yet') + '</span>' + (w.lv != null ? ' <small>' + esc(LEVEL_NAME[band(w.lv)] || '') + '</small>' : '') +
        '<span class="note">' + esc(w.def) + '</span></span></label>'; }).join('');
    box._list = list;
    box.querySelectorAll('input[data-k]').forEach(i => i.onchange = () => { const w = list[+i.dataset.k];
      if (i.checked && !picked().includes(w.id) && picked().length < MAX) picked().push(w.id); else if (!i.checked) st.picks[st.topic] = picked().filter(x => x !== w.id);
      save(); changed(); });
  };
  // Ticks and greyed boxes brought up to date without drawing the list again (it keeps its scroll)
  const sync = () => { const box = $('#ho-list'), list = box._list || [], full = picked().length >= MAX;
    box.querySelectorAll('input[data-k]').forEach(i => { const w = list[+i.dataset.k], on = picked().includes(w.id); i.checked = on; i.disabled = (full && !on) || !w.zh; i.closest('.mt-w').classList.toggle('on', on); }); };
  const drawGroups = () => { const gs = T ? [...new Set(T.words.map(w => w.group).filter(Boolean))] : [];
    $('#ho-groupf').hidden = gs.length < 2;
    $('#ho-group').innerHTML = '<option value="">All of them</option>' + gs.map(g => '<option' + (g === group ? ' selected' : '') + '>' + esc(g) + '</option>').join(''); };
  const drawPreview = () => { $('#ho-pages').innerHTML = model && model.words.length ? previewHTML(title(), st.topic, model) : '<p class="note">Choose some words, and the handout appears here.</p>'; fitPreview(); };
  const changed = () => { err(''); remake(); drawPicked(); sync(); drawActs(); drawPreview(); };
  const loadIt = () => { T = null; group = ''; drawList(); drawGroups();
    const key = st.topic;
    loadTopic(key).then(d => { if (st.topic !== key) return; T = d; drawGroups(); drawList(); changed(); })
      .catch(x => { $('#ho-list').innerHTML = '<p class="err">' + esc(x.message) + ' Check your internet connection and try again.</p>'; }); };
  $('#ho-topic').onchange = () => { st.topic = $('#ho-topic').value; save(); $('#ho-title').placeholder = topicName(st.topic) + ': key words'; loadIt(); };
  $('#ho-group').onchange = () => { group = $('#ho-group').value; drawList(); };
  $('#ho-find').oninput = () => { find = $('#ho-find').value; drawList(); };
  $$('#ho-levels input').forEach(i => i.onchange = () => { lv = $$('#ho-levels input:checked').map(x => +x.value); drawList(); });
  $('#ho-title').value = st.title; $('#ho-title').placeholder = topicName(st.topic) + ': key words';
  $('#ho-title').oninput = () => { st.title = $('#ho-title').value; save(); drawPreview(); };
  $('#ho-clear').onclick = () => { st.picks[st.topic] = []; save(); changed(); };
  $('#ho-fill').onclick = () => { for (const w of shuffle(rows())) { if (picked().length >= MAX) break; if (w.zh && !picked().includes(w.id)) picked().push(w.id); } save(); changed(); };
  $('#ho-new').onclick = () => { remake(); drawActs(); drawPreview(); };
  const ready = () => { if (!model || !model.words.length) { err('Choose some words first.'); return false; } if (!model.s1.ok) { err('Side 1 is too full: take some words with long meanings out.'); return false; } return true; };
  const fname = s => (title().replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Handout') + s + '.docx';
  $('#ho-dl').onclick = () => { if (ready()) download(docx(handoutXML(title(), st.topic, model, false)), fname('')); };
  $('#ho-ans').onclick = () => { if (!ready()) return; if (!model.acts.some(a => a.k !== 'lcwc' && a.k !== 'sentence')) return err('Side 2 has no activities with answers.'); download(docx(handoutXML(title(), st.topic, model, true)), fname(' (answers)')); };
  addEventListener('resize', fitPreview);
  drawPicked(); drawActs(); loadIt();
}
function download(blob, name){
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

// =====================================================================================================================
// ---------- the preview: two A4 pages, drawn small (210 mm wide pages, scaled to fit the card) ----------
function fitPreview(){
  const box = document.getElementById('ho-pages'); if (!box) return;
  const pages = [...box.querySelectorAll('.ho-page')]; if (!pages.length) return;
  const gap = 16, each = Math.max(160, (box.clientWidth - gap * (pages.length - 1)) / pages.length), s = each / pages[0].offsetWidth;
  pages.forEach(p => { p.style.transform = 'scale(' + s + ')'; p.parentElement.style.width = each + 'px'; p.parentElement.style.height = p.offsetHeight * s + 'px'; });
}
function previewHTML(title, topic, m){
  const H = s => esc(s);
  const head = (n, a) => '<div class="hp-h"><b>' + n + '. ' + H(a.name) + '</b> <span class="hp-zh">' + H(a.zh) + '</span><div class="hp-how">' + H(a.how) + '</div></div>';
  const side1 = '<div class="hp-title">' + H(title) + '</div><div class="hp-sub">Key words 关键词 · ' + H(topicName(topic)) + '</div>' +
    '<div class="hp-name">Name ______________________ &nbsp; Class __________ &nbsp; Date __________</div>' +
    '<table class="hp-words" style="--msz:' + m.s1.sz + 'pt"><thead><tr><th>No.</th><th>Word 单词</th><th>中文</th><th>Meaning 释义</th></tr></thead><tbody>' +
    m.words.map((w, i) => '<tr><td>' + (i + 1) + '</td><td><b>' + H(w.w) + '</b>' + (w.pos ? ' <span class="hp-pos">' + H(w.pos) + '</span>' : '') + '</td><td class="hp-zh2">' + H(w.zh) + '</td><td class="hp-def">' + H(w.def) + '</td></tr>').join('') + '</tbody></table>';
  const act = (a, n) => { const d = ACT[a.k];
    if (a.k === 'zh') return head(n, d) + '<div class="hp-two">' + a.items.map((x, i) => '<div class="hp-line"><span>' + (i + 1) + '. ' + H(x.zh) + '</span><i></i></div>').join('') + '</div>';
    if (a.k === 'lcwc') return head(n, d) + '<table class="hp-lcwc"><tr><th>Word</th><th>Look, cover, write</th><th>✓</th><th>Write it again</th><th>✓</th></tr>' + a.items.map(x => '<tr><td>' + H(x.w) + '</td><td></td><td></td><td></td><td></td></tr>').join('') + '</table>';
    if (a.k === 'ws') return head(n, d) + '<div class="hp-ws"><table class="hp-grid">' + Array.from({length: a.size}, (_, r) => '<tr>' + a.b[r].split('').map(ch => '<td>' + ch + '</td>').join('') + '</tr>').join('') + '</table>' +
      '<div class="hp-clues">' + a.words.map(x => '<div>☐ ' + H(x.zh) + ' <span class="hp-pos">(' + x.n + ')</span></div>').join('') + '</div></div>';
    if (a.k === 'xw') return head(n, d) + '<div class="hp-ws"><table class="hp-xw">' + Array.from({length: a.h}, (_, r) => '<tr>' + Array.from({length: a.w}, (_, c) => { const k = r * a.w + c;
        return a.cells[k] ? '<td class="on">' + (a.nums[k] ? '<span class="hp-xn">' + a.nums[k] + '</span>' : '') + '</td>' : '<td></td>'; }).join('') + '</tr>').join('') + '</table>' +
      '<div class="hp-clues">' + [['Across 横向', a.across], ['Down 纵向', a.down]].map(([h, l]) => '<div class="hp-xh">' + h + '</div>' + l.map(x => '<div><b>' + x.num + '</b> ' + H(x.zh) + ' <span class="hp-pos">' + H(x.en) + '</span></div>').join('')).join('') + '</div></div>';
    if (a.k === 'gap') return head(n, d) + a.items.map((x, i) => '<div class="hp-gap">' + (i + 1) + '. ' + H(x.s).replace('___', '<span class="hp-blank"></span>') + '</div>').join('') + '<div class="hp-bank">' + a.bank.map(H).join(' &nbsp;·&nbsp; ') + '</div>';
    if (a.k === 'anagram') return head(n, d) + '<div class="hp-two k-anagram">' + a.items.map((x, i) => '<div class="hp-line"><span>' + (i + 1) + '. <b class="hp-mix">' + x.mix.map(H).join(' / ') + '</b> ' + H(x.zh) + '</span><i></i></div>').join('') + '</div>';
    if (a.k === 'sentence') return head(n, d) + a.items.map((x, i) => '<div class="hp-sent">' + (i + 1) + '. <b>' + H(x.w) + '</b> ' + H(x.zh) + '<i></i><i></i></div>').join('');
    return ''; };
  const side2 = '<div class="hp-title2">Learn the words 练一练</div>' + m.acts.map((a, i) => act(a, i + 1)).join('');
  return '<div class="ho-pw"><div class="ho-page">' + side1 + '</div></div><div class="ho-pw"><div class="ho-page">' + side2 + '</div></div>';
}

// =====================================================================================================================
// ---------- the Word file ----------
// WordprocessingML, written by hand. A4, margins 1.8 cm (1020 twips): 9866 twips wide. Arial for English, Microsoft YaHei
// for Chinese (Word on a Mac uses its own Chinese font in its place).
const X = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const WIDTH = 9866, cmT = v => Math.round(v * 567);
const GREY = '555555', ANS = '1F5FBF';
function run(text, o){ o = o || {};
  const pr = (o.font ? '<w:rFonts w:ascii="' + o.font + '" w:hAnsi="' + o.font + '" w:cs="' + o.font + '"/>' : '') + (o.b ? '<w:b/>' : '') + (o.i ? '<w:i/>' : '') +
    (o.color ? '<w:color w:val="' + o.color + '"/>' : '') + (o.spacing ? '<w:spacing w:val="' + o.spacing + '"/>' : '') +
    (o.sz ? '<w:sz w:val="' + Math.round(o.sz * 2) + '"/><w:szCs w:val="' + Math.round(o.sz * 2) + '"/>' : '') + (o.u ? '<w:u w:val="single"/>' : '');
  return '<w:r>' + (pr ? '<w:rPr>' + pr + '</w:rPr>' : '') + '<w:t xml:space="preserve">' + X(text) + '</w:t></w:r>';
}
function para(runs, o){ o = o || {};
  const pr = (o.keepNext ? '<w:keepNext/>' : '') + (o.pageBreak ? '<w:pageBreakBefore/>' : '') +
    '<w:spacing w:before="' + (o.before || 0) + '" w:after="' + (o.after || 0) + '"' + (o.line ? ' w:line="' + o.line + '" w:lineRule="' + (o.exact ? 'exact' : 'auto') + '"' : '') + '/>' +
    (o.ind ? '<w:ind w:left="' + o.ind + '"/>' : '') + (o.jc ? '<w:jc w:val="' + o.jc + '"/>' : '');
  return '<w:p><w:pPr>' + pr + '</w:pPr>' + (Array.isArray(runs) ? runs.join('') : (runs || '')) + '</w:p>';
}
const LINE = '<w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="single" w:sz="6" w:space="0" w:color="888888"/><w:right w:val="nil"/></w:tcBorders>';
const BOX = '<w:tcBorders>' + ['top', 'left', 'bottom', 'right'].map(s => '<w:' + s + ' w:val="single" w:sz="8" w:space="0" w:color="333333"/>').join('') + '</w:tcBorders>';   // a crossword square
// rows: [{h, exact, header, cells: [{x (paragraphs), w, shade, va, line}]}]
function table(widths, rows, o){ o = o || {};
  const W = widths.reduce((a, b) => a + b, 0), side = s => '<w:' + s + ' w:val="single" w:sz="4" w:space="0" w:color="' + (o.color || '999999') + '"/>';
  const borders = o.borders === false ? '<w:tblBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders>'
    : '<w:tblBorders>' + ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(side).join('') + '</w:tblBorders>';
  const pad = o.pad == null ? 80 : o.pad, padV = o.padV == null ? 30 : o.padV;
  return '<w:tbl><w:tblPr><w:tblW w:w="' + W + '" w:type="dxa"/>' + (o.jc ? '<w:jc w:val="' + o.jc + '"/>' : '') + borders + '<w:tblLayout w:type="fixed"/>' +
    '<w:tblCellMar><w:top w:w="' + padV + '" w:type="dxa"/><w:left w:w="' + pad + '" w:type="dxa"/><w:bottom w:w="' + padV + '" w:type="dxa"/><w:right w:w="' + pad + '" w:type="dxa"/></w:tblCellMar>' +
    '<w:tblLook w:val="0000" w:firstRow="0" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="1" w:noVBand="1"/></w:tblPr>' +
    '<w:tblGrid>' + widths.map(w => '<w:gridCol w:w="' + w + '"/>').join('') + '</w:tblGrid>' +
    rows.map(r => '<w:tr><w:trPr><w:cantSplit/>' + (r.h ? '<w:trHeight w:val="' + r.h + '" w:hRule="' + (r.exact ? 'exact' : 'atLeast') + '"/>' : '') + (r.header ? '<w:tblHeader/>' : '') + '</w:trPr>' +
      r.cells.map((c, i) => '<w:tc><w:tcPr><w:tcW w:w="' + (c.w || widths[i]) + '" w:type="dxa"/>' + (c.box ? BOX : c.line ? LINE : '') +
        (c.shade ? '<w:shd w:val="clear" w:color="auto" w:fill="' + c.shade + '"/>' : '') + '<w:vAlign w:val="' + (c.va || 'center') + '"/></w:tcPr>' + (c.x || para('')) + '</w:tc>').join('') + '</w:tr>').join('') +
    '</w:tbl>';
}
function heading(n, a){
  return para([run(n + '. ' + a.name + '  ', {b: true, sz: 12}), run(a.zh, {sz: 11, color: GREY})], {before: 200, after: 20, keepNext: true}) +
    para(run(a.how, {sz: 9.5, color: GREY}), {after: 80, keepNext: true});
}
// Two items to a row: the item, then a line to write on (answers: the answer on the line)
function twoUp(w, items, label, answer, ans){
  const rows = [];
  for (let i = 0; i < items.length; i += 2) rows.push({h: cmT(0.95), cells: [0, 1].flatMap(j => { const x = items[i + j];
    return x ? [{x: para(label(x, i + j)), va: 'bottom'}, {x: para(ans ? run(answer(x), {i: true, color: ANS, sz: 11}) : ''), va: 'bottom', line: true}] : [{x: para('')}, {x: para('')}]; })});
  return table(w, rows, {borders: false, pad: 60});
}
function actXML(a, n, ans){
  const d = ACT[a.k];
  if (a.k === 'zh') return heading(n, d) + twoUp(COLS.zh, a.items, (x, i) => [run((i + 1) + '.  ', {sz: 10.5}), run(x.zh, {sz: 12})], x => x.w, ans);
  if (a.k === 'lcwc') {
    if (ans) return heading(n, d) + para(run('Nothing to check here: they check their own spelling.', {i: true, color: GREY}));
    const w = [2600, 2983, 650, 2983, 650], hd = ['Word', 'Look, cover, write', '✓', 'Write it again', '✓'];
    return heading(n, d) + table(w, [{h: cmT(0.62), header: true, cells: hd.map(t => ({x: para(run(t, {b: true, sz: 9.5}), {jc: t === '✓' ? 'center' : ''}), shade: 'E8EAF2'}))}]
      .concat(a.items.map(x => ({h: cmT(0.72), cells: [{x: para(run(x.w, {b: true, sz: 11}))}, {}, {}, {}, {}]}))));
  }
  if (a.k === 'ws') return heading(n, d) + wsXML(a, ans);
  if (a.k === 'xw') return heading(n, d) + xwXML(a, ans);
  if (a.k === 'gap') {
    const items = a.items.map((x, i) => { const [pre, post] = x.s.split('___');
      return para([run((i + 1) + '.  '), run(pre), ans ? run(x.a, {b: true, u: true, color: ANS}) : run('______________'), run(post || '')], {after: 110, line: 264, ind: 0}); }).join('');
    const bank = table([WIDTH], [{cells: [{x: para([run('Word bank:  ', {b: true, sz: 10}), run(a.bank.join('   ·   '), {sz: 10.5})], {jc: 'center'})}]}], {pad: 120, padV: 70});
    return heading(n, d) + items + bank;
  }
  if (a.k === 'anagram') return heading(n, d) + twoUp(COLS.anagram, a.items, (x, i) => [run((i + 1) + '.  ', {sz: 10.5}), run(x.mix.join(' / '), {b: true, sz: 11, font: 'Courier New', spacing: 20}), run('  ' + x.zh, {sz: 10.5, color: GREY})], x => x.w, ans);
  if (a.k === 'sentence') {
    if (ans) return heading(n, d) + para(run('Their own sentences: check each uses the word correctly.', {i: true, color: GREY}));
    return heading(n, d) + a.items.map((x, i) => para([run((i + 1) + '.  '), run(x.w, {b: true}), run('  ' + x.zh, {color: GREY})], {before: 60, keepNext: true}) +
      table([WIDTH], [{h: cmT(0.85), cells: [{line: true, va: 'bottom'}]}, {h: cmT(0.85), cells: [{line: true, va: 'bottom'}]}], {borders: false, pad: 0})).join('');
  }
  return '';
}
// The word search and the crossword as Word tables (also used by the Homework sheets: homework.js)
function wsXML(a, ans){
  const cell = 340, on = new Set(ans ? a.words.flatMap(x => x.cells) : []);
  const grid = table(Array(a.size).fill(cell), Array.from({length: a.size}, (_, r) => ({h: cell, exact: true,
    cells: a.b[r].split('').map((ch, c) => ({x: para(run(ch, {b: true, sz: 11, font: 'Arial'}), {jc: 'center'}), shade: on.has(r * a.size + c) ? 'FFE766' : ''}))})), {pad: 0, padV: 0, color: 'BBBBBB'});
  const left = a.size * cell + 200, clues = a.words.map((x, i) => para([run(ans ? '☑ ' : '☐ ', {sz: 11}), run(x.zh, {sz: 11}), run('  (' + x.n + ')', {sz: 9, color: GREY}),
    ans ? run('   ' + x.w, {b: true, color: ANS, sz: 10.5}) : ''], {after: 70})).join('');
  return table([left, WIDTH - left], [{cells: [{x: grid + para(''), va: 'top'}, {x: clues, va: 'top'}]}], {borders: false, pad: 0});
}
function xwXML(a, ans, heads){
  heads = heads || ['Across 横向', 'Down 纵向'];
  // The grid: a square for each letter (its number small in the corner; the answers in blue on the answer sheet), nothing elsewhere
  const cell = 340, grid = table(Array(a.w).fill(cell), Array.from({length: a.h}, (_, r) => ({h: cell, exact: true, cells: Array.from({length: a.w}, (_, c) => {
    const k = r * a.w + c, ch = a.cells[k]; if (!ch) return {x: para('')};
    return {box: true, va: 'top', x: para(a.nums[k] ? run(String(a.nums[k]), {sz: 5.5, color: '333333'}) : '', {line: 120, exact: true, ind: 30}) +
      para(ans ? run(ch, {b: true, sz: 10.5, color: ANS}) : '', {jc: 'center', line: 210, exact: true})}; })})), {borders: false, pad: 0, padV: 0});
  const list = (h, l) => para(run(h, {b: true, sz: 10.5}), {before: 40, after: 50}) + l.map(x => para([run(x.num + '  ', {b: true, sz: 10.5}), run(x.zh, {sz: 11}), run('  ' + x.en, {sz: 9, color: GREY}),
    ans ? run('   ' + x.w, {b: true, color: ANS, sz: 10.5}) : ''], {after: 60, ind: 0})).join('');
  const left = a.w * cell + 260;
  return table([left, WIDTH - left], [{cells: [{x: grid + para(''), va: 'top'}, {x: list(heads[0], a.across) + list(heads[1], a.down), va: 'top'}]}], {borders: false, pad: 0});
}
function handoutXML(title, topic, m, ans){
  let body = '';
  if (!ans) {
    body += para(run(title, {b: true, sz: 18}), {after: 40}) + para(run('Key words 关键词  ·  ' + topicName(topic), {sz: 10.5, color: GREY}), {after: 160}) +
      para(run('Name ______________________________     Class ______________     Date ______________', {sz: 10}), {after: 200});
    const w = [600, 2450, 1750, 5066], sz = m.s1.sz;
    body += table(w, [{h: cmT(0.7), header: true, cells: ['No.', 'Word 单词', '中文', 'Meaning 释义'].map(t => ({x: para(run(t, {b: true, sz: 10})), shade: 'E8EAF2'}))}]
      .concat(m.words.map((x, i) => ({h: cmT(1.0), cells: [{x: para(run(String(i + 1), {sz: 10, color: GREY}), {jc: 'center'})},
        {x: para([run(x.w, {b: true, sz: 11})].concat(x.pos ? [run('  ' + x.pos, {sz: 8.5, color: GREY})] : []))},
        {x: para(run(x.zh, {sz: 12}))}, {x: para(run(x.def, {sz: sz}))}]}))));
    body += para(run('Learn the words 练一练', {b: true, sz: 14}), {pageBreak: true, after: 40});
  } else body += para(run('Answers: ' + title, {b: true, sz: 16}), {after: 80}) + para(run('Side 2 · Learn the words 练一练', {sz: 10.5, color: GREY}), {after: 60});
  body += m.acts.map((a, i) => actXML(a, i + 1, ans)).join('');
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>' + body +
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1020" w:right="1020" w:bottom="1020" w:left="1020" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>';
}
const STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
  '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:eastAsia="Microsoft YaHei" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:lang w:val="en-GB" w:eastAsia="zh-CN" w:bidi="ar-SA"/></w:rPr></w:rPrDefault>' +
  '<w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
  '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
  '<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:uiPriority w:val="99"/><w:semiHidden/><w:unhideWhenUsed/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/>' +
  '<w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>';
function docx(documentXML){
  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  return zip([
    {name: '[Content_Types].xml', text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
      '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
      '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>'},
    {name: '_rels/.rels', text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
      '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>'},
    {name: 'word/_rels/document.xml.rels', text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'},
    {name: 'word/document.xml', text: documentXML},
    {name: 'word/styles.xml', text: STYLES},
    {name: 'docProps/core.xml', text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
      '<dc:title>Handout</dc:title><dc:creator>Academic English App</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">' + now + '</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">' + now + '</dcterms:modified></cp:coreProperties>'},
    {name: 'docProps/app.xml', text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Academic English App</Application></Properties>'}
  ]);
}
// ---------- a zip file (stored, not compressed: Word reads it the same) ----------
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function zip(files){
  const enc = new TextEncoder(), parts = [], central = [], d = new Date();
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  let off = 0;
  files.forEach(f => {
    const name = enc.encode(f.name), data = enc.encode(f.text), crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, time, true); h.setUint16(12, date, true);
    h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
    parts.push(new Uint8Array(h.buffer), name, data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, time, true); c.setUint16(14, date, true);
    c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
    central.push(new Uint8Array(c.buffer), name);
    off += 30 + name.length + data.length;
  });
  const size = central.reduce((a, b) => a + b.length, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, size, true); e.setUint32(16, off, true);
  return new Blob([...parts, ...central, new Uint8Array(e.buffer)], {type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}
// Shared with the Homework sheets (homework.js, 10 Nov 2026): the Word file and its parts
AEA_HANDOUT.lib = {run, para, table, docx, download, X, WIDTH, cmT, GREY, ANS, twoUp, COLS, wsXML, xwXML};
})();
