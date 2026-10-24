// How two copies of a student's saved progress are combined: the copy on the server and the copy in a browser.
// Each saved item is one browser storage key (e.g. "aea:progress:v1") holding JSON text.
// The aim: never lose work done on either device. Progress and points keep the bigger record;
// small settings (level choice, subject switches) simply take the browser's copy.
'use strict';

const parse = s => { try { return JSON.parse(s); } catch (e) { return undefined; } };
const obj = x => (x && typeof x === 'object' && !Array.isArray(x)) ? x : {};

// Per-key rules. Each gets the parsed server copy (a) and browser copy (b) and returns the combined value.
function progress(a, b) {
  a = obj(a); b = obj(b);
  const out = Object.assign({}, a, b);
  // Topics: the record with more answers is the newer one (n only grows); then more points, then later.
  const ta = obj(a.topics), tb = obj(b.topics), topics = {};
  for (const k of new Set([...Object.keys(ta), ...Object.keys(tb)])) {
    const x = ta[k], y = tb[k];
    if (!x) { topics[k] = y; continue; }
    if (!y) { topics[k] = x; continue; }
    const score = t => [t.n || 0, t.pts || 0, t.last || 0];
    const sx = score(x), sy = score(y);
    let pickY = true;
    for (let i = 0; i < 3; i++) { if (sx[i] !== sy[i]) { pickY = sy[i] > sx[i]; break; } }
    topics[k] = pickY ? y : x;
  }
  // Words: the higher stage wins; same stage, the later review date.
  const wa = obj(a.words), wb = obj(b.words), words = {};
  for (const k of new Set([...Object.keys(wa), ...Object.keys(wb)])) {
    const x = wa[k], y = wb[k];
    if (!x) { words[k] = y; continue; }
    if (!y) { words[k] = x; continue; }
    words[k] = ((y.s || 0) > (x.s || 0) || ((y.s || 0) === (x.s || 0) && (y.due || 0) >= (x.due || 0))) ? y : x;
  }
  // Days: answers per day, the bigger count.
  const da = obj(a.days), db = obj(b.days), days = {};
  for (const k of new Set([...Object.keys(da), ...Object.keys(db)])) days[k] = Math.max(+da[k] || 0, +db[k] || 0);
  out.topics = topics; out.words = words; out.days = days;
  return out;
}

function points(a, b) {
  a = obj(a); b = obj(b);
  const out = Object.assign({}, a, b);
  for (const side of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = obj(a[side]), y = obj(b[side]);
    if (!a[side] || !b[side]) { out[side] = a[side] || b[side]; continue; }
    const dx = obj(x.days), dy = obj(y.days), days = {};
    for (const k of new Set([...Object.keys(dx), ...Object.keys(dy)])) {
      const p = dx[k], q = dy[k];
      if (!p) { days[k] = q; continue; }
      if (!q) { days[k] = p; continue; }
      const act = d => (d.r || 0) + (d.w || 0);
      days[k] = (act(q) > act(p) || (act(q) === act(p) && (q.p || 0) >= (p.p || 0))) ? q : p;
    }
    out[side] = Object.assign({}, x, y, {days});
  }
  return out;
}

function circuit(a, b) {
  a = obj(a); b = obj(b);
  const out = Object.assign({}, a, b);   // run and last: the browser's copy
  const da = obj(a.days), db = obj(b.days), days = {};
  for (const date of new Set([...Object.keys(da), ...Object.keys(db)])) {
    const x = obj(da[date]), y = obj(db[date]), day = {};
    for (const side of new Set([...Object.keys(x), ...Object.keys(y)])) {
      const p = x[side], q = y[side];
      if (!p) { day[side] = q; continue; }
      if (!q) { day[side] = p; continue; }
      day[side] = ((q.runs || 0) > (p.runs || 0) || ((q.runs || 0) === (p.runs || 0) && (q.answered || 0) >= (p.answered || 0))) ? q : p;
    }
    days[date] = day;
  }
  out.days = days;
  return out;
}

// Combine one key. a = server text, b = browser text. Returns text.
function mergeKey(key, a, b) {
  if (a == null) return b;
  if (b == null) return a;
  if (a === b) return b;
  const x = parse(a), y = parse(b);
  if (x === undefined || y === undefined) return b;
  if (key === 'aea:progress:v1') return JSON.stringify(progress(x, y));
  if (key === 'aea:points:v1') return JSON.stringify(points(x, y));
  if (key === 'aea:circuit:v1') return JSON.stringify(circuit(x, y));
  // Best scores and streaks on each topic (aea:<topic>:best:… / aea:<topic>:streak:…): the higher number
  if (/^aea:[^:]+:(best|streak):/.test(key) && typeof x === 'number' && typeof y === 'number') return JSON.stringify(Math.max(x, y));
  return b;
}

module.exports = {mergeKey};
