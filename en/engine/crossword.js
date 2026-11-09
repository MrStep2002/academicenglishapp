/* Crossword maker (9 Nov 2026, teacher: "Could we do a crosswords game? Can that be added to the board games, the subject
   pages, and the handout pages."). One maker for every place a crossword appears: the students' Crossword on the topic pages
   (en/engine/app.js), the Crossword board game and starter (teacher/board.js, teacher/starters.js) and the handout activity
   (teacher/handouts.js). Loaded by the topic pages and by the teacher page (../en/engine/crossword.js).

   make(items, opts) fits words into a grid where they cross. It tries many arrangements and keeps the best one: the most
   words, then the most crossings, then the smallest, squarest grid. A word that can't cross anything is left out.
   Rules, as in printed crosswords: every word crosses another; two words never run side by side or end to end; a word's
   letters in the grid are only its own (no extra words are spelt by accident).
   - items: [{L: 'LETTERS', …anything}] in the order they're wanted (the first ones are tried first); L from letters().
   - opts: {n: how many words, maxW, maxH: the largest grid (columns, rows), ms: time to spend (default 70 ms)}.
   - gives {w, h, cells: [letter or ''] row by row, words: [{…item, r, c, d: 'a'|'d', num, cells: [cell index…]}],
     across, down} (across and down: the words in clue order), or null when fewer than 3 words cross.
   letters('rule of thirds') → 'RULEOFTHIRDS'; enumeration('rule of thirds') → '(4,2,6)', ('close-up') → '(5-2)', as in
   printed crosswords. gives(word, clue): true when the clue gives the word away (it contains the word, or a form of it:
   "advertiser" / "a person who advertises"); such clues are never used (tools/check_content.py lists them too). */
(function(root){
'use strict';
const plain = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
// The word as students see it: the first of "visitor / user", without "(…)" notes
const show = s => String(s || '').split(/\s*\/\s*/)[0].replace(/\s*\([^)]*\)\s*/g, ' ').trim();
const letters = s => plain(show(s)).replace(/[^A-Za-z]/g, '').toUpperCase();
// "(4,2,6)": letters in each word; a hyphen shows as "-" ("(5-2)"); apostrophes don't count
function enumeration(s){
  const t = plain(show(s)).replace(/['’]/g, '');
  const parts = t.split(/([\s-]+)/).filter(x => x !== ''), out = [];
  for (const p of parts) {
    if (/^[\s-]+$/.test(p)) { if (out.length) out.push(p.includes('-') ? '-' : ','); continue; }
    const n = p.replace(/[^A-Za-z]/g, '').length; if (n) out.push(String(n));
  }
  while (out.length && /[,-]/.test(out[out.length - 1])) out.pop();
  return '(' + out.join('') + ')';
}
// Does the clue give the word away? Each part of the word with 3+ letters (not "of", "the"…) is looked for at the start of
// a word in the clue: the whole part when it's short, else its first letters (advertiser → "advertis", so "advertises" counts).
const SMALL = new Set(['the', 'and', 'for', 'with', 'from', 'into', 'onto', 'that', 'this', 'its', 'not', 'but', 'off', 'out']);
function stems(word){
  return plain(show(word)).toLowerCase().split(/[^a-z]+/).filter(p => p.length >= 3 && !SMALL.has(p))
    .map(p => p.length <= 5 ? p : p.slice(0, Math.max(5, p.length - 3)));
}
function gives(word, clue){
  const c = ' ' + plain(clue).toLowerCase().replace(/[^a-z]+/g, ' ') + ' ';
  return stems(word).some(s => c.includes(' ' + s));
}

function make(items, o){
  o = o || {};
  const n = o.n || 8, W = o.maxW || 13, H = o.maxH || 13, ms = o.ms || 70, R = o.rand || Math.random;
  const big = Math.max(W, H), seen = new Set();
  const pool = (items || []).filter(it => it && it.L && it.L.length >= 3 && it.L.length <= big && !seen.has(it.L) && seen.add(it.L));
  if (pool.length < 3) return null;
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const t0 = now(); let best = null, tries = 0;
  while (tries < 12 || (now() - t0 < ms && tries < 400)) {
    tries++;
    const got = attempt(pool, n, W, H, R);
    if (got && (!best || got.score > best.score)) best = got;
    if (best && best.words.length >= Math.min(n, pool.length) && tries >= 60 && now() - t0 > ms / 2) break;
  }
  return best && best.words.length >= 3 ? finish(best) : null;
}
// One try: the first word in the middle, then each next word where it crosses best
function attempt(pool, n, W, H, R){
  const g = new Map(), key = (r, c) => r + ',' + c, at = (r, c) => g.get(key(r, c));
  const placed = []; let r0 = 0, r1 = 0, c0 = 0, c1 = 0, crossings = 0, nA = 0, nD = 0;
  // the words in a loose version of the order wanted: early words first, a little shuffled
  const cand = pool.slice(0, Math.min(pool.length, n + 10)).map((it, i) => ({it, k: i + R() * 6})).sort((a, b) => a.k - b.k).map(x => x.it);
  // the first word: one of the three longest of the first n
  const head = cand.slice(0, n).map((it, i) => ({it, i})).sort((a, b) => b.it.L.length - a.it.L.length).slice(0, 3);
  const first = head[Math.floor(R() * head.length)].it;
  const fd = first.L.length <= W && (first.L.length > H || R() < .5) ? 'a' : first.L.length <= H ? 'd' : null;
  if (!fd) return null;
  const put = (it, r, c, d, x) => {
    const [dr, dc] = d === 'a' ? [0, 1] : [1, 0], cells = [];
    for (let i = 0; i < it.L.length; i++) { const rr = r + dr * i, cc = c + dc * i, k = key(rr, cc);
      const cell = g.get(k) || {ch: it.L[i]}; cell[d] = true; g.set(k, cell); cells.push([rr, cc]); }
    if (!placed.length) { r0 = r; c0 = c; r1 = r + dr * (it.L.length - 1); c1 = c + dc * (it.L.length - 1); }
    else { r0 = Math.min(r0, r); c0 = Math.min(c0, c); r1 = Math.max(r1, r + dr * (it.L.length - 1)); c1 = Math.max(c1, c + dc * (it.L.length - 1)); }
    placed.push({it, r, c, d, cells}); crossings += x; if (d === 'a') nA++; else nD++;
  };
  put(first, 0, 0, fd, 0);
  // Where a word can go: across or down through a letter it shares with a word already in, crossing that word
  const spots = it => {
    const L = it.L, out = [];
    for (const [k, cell] of g) {
      if (cell.a && cell.d) continue;
      const [cr, cc] = k.split(',').map(Number), d = cell.a ? 'd' : 'a';
      for (let i = 0; i < L.length; i++) {
        if (L[i] !== cell.ch) continue;
        const r = d === 'd' ? cr - i : cr, c = d === 'a' ? cc - i : cc, f = fits(L, r, c, d);
        if (f) out.push(Object.assign(f, {r, c, d}));
      }
    }
    return out;
  };
  const fits = (L, r, c, d) => {
    const [dr, dc] = d === 'a' ? [0, 1] : [1, 0], len = L.length;
    if (at(r - dr, c - dc) || at(r + dr * len, c + dc * len)) return null;   // nothing just before or just after
    let x = 0;
    for (let i = 0; i < len; i++) {
      const rr = r + dr * i, cc = c + dc * i, cell = at(rr, cc);
      if (cell) { if (cell.ch !== L[i] || cell[d]) return null; x++; }
      else if (at(rr + dc, cc + dr) || at(rr - dc, cc - dr)) return null;   // no letter beside a new letter
    }
    if (!x) return null;
    const nr0 = Math.min(r0, r), nc0 = Math.min(c0, c), nr1 = Math.max(r1, r + dr * (len - 1)), nc1 = Math.max(c1, c + dc * (len - 1));
    const w = nc1 - nc0 + 1, h = nr1 - nr0 + 1;
    if (w > W || h > H) return null;
    return {x, grow: w * h - (c1 - c0 + 1) * (r1 - r0 + 1), w, h};
  };
  const left = cand.filter(it => it !== first);
  for (let pass = 0; pass < 3 && placed.length < n && left.length; pass++) {
    for (let j = 0; j < left.length && placed.length < n; j++) {
      const it = left[j], s = spots(it); if (!s.length) continue;
      const lean = (nA - nD) * (/* fewer of one direction: prefer it */ 1);
      let top = null, topScore = -1e9;
      for (const p of s) {
        const sc = p.x * 6 - p.grow * 0.35 - Math.abs(p.w - p.h) * 0.8 + (p.d === 'd' ? lean : -lean) * 0.9 + R() * 3;
        if (sc > topScore) { topScore = sc; top = p; }
      }
      put(it, top.r, top.c, top.d, top.x); left.splice(j, 1); j--;
    }
  }
  const w = c1 - c0 + 1, h = r1 - r0 + 1;
  // the best try: the most words, then the most crossings, then the smallest and squarest grid
  const score = placed.length * 1000 + crossings * 12 - w * h * 0.6 - Math.abs(w - h) * 3;
  return {score, words: placed, r0, c0, w, h};
}
// Numbers in reading order (a square that starts an across word and a down word has one number), the grid's letters
function finish(b){
  const {w, h} = b, cells = Array(w * h).fill('');
  const words = b.words.map(p => {
    const r = p.r - b.r0, c = p.c - b.c0, idx = p.cells.map(([rr, cc]) => (rr - b.r0) * w + (cc - b.c0));
    idx.forEach((k, i) => { cells[k] = p.it.L[i]; });
    return Object.assign({}, p.it, {r, c, d: p.d, cells: idx});
  });
  const starts = [...new Set(words.map(x => x.cells[0]))].sort((a, b) => a - b), num = new Map(starts.map((k, i) => [k, i + 1]));
  words.forEach(x => { x.num = num.get(x.cells[0]); });
  const ord = (a, b) => a.num - b.num;
  return {w, h, cells, words, across: words.filter(x => x.d === 'a').sort(ord), down: words.filter(x => x.d === 'd').sort(ord),
    nums: Object.fromEntries([...num].map(([k, v]) => [k, v]))};
}

const XW = {make, letters, enumeration, gives, show};
root.AEA_XW = XW;
if (typeof module !== 'undefined' && module.exports) module.exports = XW;
})(typeof window !== 'undefined' ? window : globalThis);
