/* QUICK FIRE MATHS: THE QUESTIONS (11 Nov 2026). Teacher: "12 times tables should be bread and butter, as should adding and
   subtracting across the board… Everyone likes to get things right and this shouldn't feel like hard work. Often it should
   just have a race element to it and you should feel like you know what you're doing… They need a mental workout."
   Mental maths, no calculator (KS3). Every question is made fresh here; maths/engine/quickfire.js asks them.
   At EVERY level about two thirds of the questions are the bread and butter: times tables and division facts to 12 × 12, and
   adding and subtracting whole numbers. A higher level makes those bigger and faster (7 × 80, 398 + 246, 5,000 − 1,236) but
   never drops them. The other third grows with the level: number bonds, doubling and halving, fractions and percentages of
   amounts, × and ÷ by 10/100/1000, squares and roots, negative numbers, order of operations.
   Levels (bands): 1 Foundation, 2 Foundation+, 3 Intermediate, 4 Intermediate+, 5 Advanced.
   make(band) gives {skill, prompt (HTML), ans (a number), wrongs [numbers people really get], neg (answers can be below 0),
   dp (decimal places in the answer)}. A prompt with ? asks for the missing number ("? × 7 = 56").
   To grow it: add a maker to EXTRA (or to the core ones) with the bands it suits. */
(function(){
'use strict';
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const chance = p => Math.random() < p;
const fix = x => Math.round(x * 1e9) / 1e9;
// Numbers as they are written: a real minus sign, commas from 10,000 (as on the Maths pages)
function fmt(x){
  x = fix(+x); if(Object.is(x, -0)) x = 0;
  const neg = x < 0; let s = String(Math.abs(x));
  let [i, d] = s.split('.'); if(i.length >= 5) i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (neg ? '−' : '') + i + (d ? '.' + d : '');
}
const par = x => x < 0 ? '(' + fmt(x) + ')' : fmt(x);
const dpOf = x => { const s = String(fix(x)); return s.includes('.') ? s.split('.')[1].length : 0; };
const Q = (skill, prompt, ans, wrongs, o) => Object.assign({skill, prompt, ans: fix(ans), wrongs: (wrongs || []).map(fix), dp: dpOf(ans)}, o || {});
// The times tables: the hard ones (6, 7, 8, 9, 11, 12) come up more often from Intermediate
const TABLE = b => b === 1 ? pick([2, 2, 3, 4, 5, 5, 10, 10]) : b === 2 ? R(2, 12) : pick([3, 4, 6, 6, 7, 7, 8, 8, 9, 9, 11, 12, 12]);
const swapDigits = n => { const s = String(n); return s.length === 2 ? +(s[1] + s[0]) : n + 10; };

// ---------- the bread and butter ----------
function times(b){
  const a = TABLE(b), c = b === 1 ? R(1, 12) : R(2, 12), n = a * c;
  const fact = () => { const [x, y] = chance(.5) ? [a, c] : [c, a];
    return Q('times', `${x} × ${y}`, n, [a * (c + 1), a * (c - 1), (a + 1) * c, a + c, swapDigits(n)]); };
  const div = () => Q('times', `${fmt(n)} ÷ ${a}`, c, [c + 1, c - 1, n - a, a]);
  const miss = () => Q('times', chance(.5) ? `? × ${a} = ${n}` : `${a} × ? = ${n}`, c, [c + 1, c - 1, n - a]);
  if(b === 1) return chance(.8) || ![2, 5, 10].includes(a) ? fact() : div();
  if(b === 2) return chance(.7) ? fact() : div();
  if(b === 3) { const k = Math.random(); return k < .45 ? fact() : k < .8 ? div() : miss(); }
  if(b === 4) { const k = Math.random();
    if(k < .45) return chance(.5) ? fact() : chance(.5) ? div() : miss();
    if(k < .8) { const t = a * 10; return Q('times', chance(.5) ? `${t} × ${c}` : `${c} × ${t}`, t * c, [t * c / 10, t * (c + 1), t * c * 10, (a + 1) * c * 10]); }
    const t = c * 10; return Q('times', `${fmt(a * t)} ÷ ${a}`, t, [c, t + 10, t * 10]); }
  const k = Math.random();
  if(k < .35) return chance(.5) ? fact() : div();
  if(k < .7) { const x = a * 10, y = c * 10; return chance(.6)
    ? Q('times', `${x} × ${y}`, x * y, [x * y / 10, x * y * 10, (a * c) * 100 + 100])
    : Q('times', `${fmt(x * y)} ÷ ${x}`, y, [c, y * 10, y + 10]); }
  const d = a / 10; return chance(.6)
    ? Q('times', `${fmt(d)} × ${c}`, d * c, [a * c, d * c / 10, d * (c + 1)])
    : Q('times', `${fmt(d * c)} ÷ ${c}`, d, [a, d * 10 / 100, d + 0.1]);
}
const carry = (x, y) => (x % 10) + (y % 10) >= 10;
const borrow = (x, y) => (x % 10) < (y % 10);
function addsub(b){
  const add = chance(.5);
  let x, y;
  if(b === 1){
    if(add){ x = R(11, 79); y = chance(.5) ? R(2, 9) : R(11, 19); }
    else { x = R(15, 99); y = R(2, Math.min(9, x - 10)); }
  } else if(b === 2){
    if(add){ do { x = R(15, 89); y = R(12, 89); } while(!carry(x, y) && chance(.7)); }
    else if(chance(.25)) return Q('addsub', `100 − ${(y = R(11, 89))}`, 100 - y, [110 - y, 90 - y, 100 - y + 10]);
    else { do { x = R(41, 99); y = R(12, x - 9); } while(!borrow(x, y) && chance(.7)); }
  } else if(b === 3){
    if(chance(.3)) { const h = R(2, 9) * 100, d = R(1, 4); x = h - d; y = R(21, 89);   // near a hundred: 398 + 46, 503 − 48
      return add ? Q('addsub', `${x} + ${y}`, x + y, [x + y + 10, x + y - 10, h + y]) : Q('addsub', `${h + d} − ${y}`, h + d - y, [h + d - y + 10, h + d - y - 10, h - y]); }
    if(add){ x = R(120, 899); y = R(12, 99); } else { x = R(150, 999); y = R(12, 99); }
  } else if(b === 4){
    if(chance(.25)) { y = R(101, 899); return Q('addsub', `1000 − ${y}`, 1000 - y, [1100 - y, 900 - y, 1010 - y]); }
    if(chance(.3)) { const h = R(2, 7) * 100, d = R(1, 3); x = h - d; y = R(120, 499);   // 398 + 246, 503 − 198
      return add ? Q('addsub', `${x} + ${y}`, x + y, [x + y + 10, x + y - 10, h + y]) : Q('addsub', `${y + h} − ${x}`, y + h - x, [y + h - x - 10, y + h - x + 10, y - d]); }
    if(add){ x = R(120, 799); y = R(110, 899 - (x > 600 ? 300 : 0)); } else { x = R(400, 999); y = R(110, x - 50); }
  } else {
    const k = Math.random();
    if(k < .25) { const t = R(2, 9) * 1000; y = R(1101, t - 101); return Q('addsub', `${fmt(t)} − ${fmt(y)}`, t - y, [t - y + 10, t - y - 10, t - y + 100]); }
    if(k < .45) { const p = R(11, 89) / 10, q = R(11, 69) / 10;
      return add ? Q('addsub', `${fmt(p)} + ${fmt(q)}`, p + q, [p + q - 1, p + q + 0.1, p + q - 0.1], {}) : (p > q
        ? Q('addsub', `${fmt(p)} − ${fmt(q)}`, p - q, [p - q + 1, p - q + 0.1, p - q - 0.1])
        : Q('addsub', `${fmt(q + p)} − ${fmt(p)}`, q, [q + 1, q + 0.1, q - 0.1])); }
    if(add){ x = R(1100, 4999); y = R(120, 2999); } else { x = R(2100, 8999); y = R(120, x - 1000); }
  }
  const n = add ? x + y : x - y, big = b >= 3 ? 100 : 10;
  return Q('addsub', `${fmt(x)} ${add ? '+' : '−'} ${fmt(y)}`, n, [n + 10, n - 10, n + 1, n - 1, n + big, add ? Math.abs(x - y) : x + y]);
}

// ---------- the rest, by level ----------
const EXTRA = [
  {key: 'bonds', bands: [1, 2], make(b){   // number bonds to 10, 20, 100
    const t = b === 1 ? pick([10, 10, 20]) : 100, y = R(1, t - 1);
    return Q('bonds', `? + ${y} = ${t}`, t - y, [t - y + 1, t - y - 1, t - y + 10]); }},
  {key: 'double', bands: [1, 2, 3, 4, 5], make(b){   // doubling and halving
    const top = [0, 25, 50, 250, 500, 2500][b], d = chance(.5);
    if(b >= 4 && chance(.4)){ const x = R(11, 99) / 10; return d ? Q('double', `Double ${fmt(x)}`, 2 * x, [2 * x + 1, 2 * x - 0.1, x + 2]) : Q('double', `Half of ${fmt(2 * x)}`, x, [x + 1, x - 0.1, 2 * x - 1]); }
    const x = R(Math.max(3, top / 5), top);
    return d ? Q('double', `Double ${fmt(x)}`, 2 * x, [2 * x + 10, 2 * x - 10, x + 2]) : Q('double', `Half of ${fmt(2 * x)}`, x, [x + 10, x - 10, x + 5]); }},
  {key: 'fdp', bands: [2, 3, 4, 5], make(b){   // fractions and percentages of amounts
    const F = {2: [[1, 2], [1, 4], [1, 10]], 3: [[1, 3], [1, 5], [1, 4], [3, 4], [1, 10]], 4: [[2, 3], [3, 4], [2, 5], [3, 10], [3, 5]], 5: [[2, 3], [3, 8], [4, 5], [5, 6], [7, 10]]}[b];
    const P = {2: [50, 10], 3: [10, 25, 50], 4: [20, 5, 75, 30], 5: [15, 35, 12.5, 60, 45]}[b];
    if(chance(.55)){ const [t, d] = pick(F), x = d * R(2, b <= 3 ? 12 : 20), n = x / d * t;
      return Q('fdp', `<sup>${t}</sup>⁄<sub>${d}</sub> of ${fmt(x)}`, n, [x / d, n + t, x - n].filter(v => v !== n)); }
    const p = pick(P), base = p === 12.5 ? 8 * R(2, 15) : p % 10 === 5 ? 20 * R(1, 12) : 10 * R(2, 20), n = base * p / 100;
    return Q('fdp', `${fmt(p)}% of ${fmt(base)}`, n, [n * 10, base / p, n + base / 10].filter(v => isFinite(v) && fix(v) !== fix(n))); }},
  {key: 'place', bands: [2, 3, 4], make(b){   // × and ÷ by 10, 100, 1000 (a little of it)
    const x = b === 2 ? R(3, 99) : b === 3 ? R(11, 999) : R(11, 999) / 10;
    if(chance(.5)){ const m = b === 2 ? pick([10, 100]) : pick([10, 100, 1000]); return Q('place', `${fmt(x)} × ${fmt(m)}`, x * m, [x * m / 10, x * m * 10, x + m]); }
    const m = b === 2 ? pick([10, 100]) : 10, y = b === 2 ? x * m : b === 3 ? x : x * 10;   // answers with at most two decimal places
    return Q('place', `${fmt(y)} ÷ ${fmt(m)}`, y / m, [y / m * 10, y / m / 10, y - m].filter(v => v >= 0)); }},
  {key: 'squares', bands: [3, 4, 5], make(b){   // squares and square roots
    const x = b === 3 ? R(2, 10) : b === 4 ? R(6, 15) : pick([R(11, 20), 25, 30, 40]);
    return chance(.6) ? Q('squares', `${x}<sup>2</sup>`, x * x, [2 * x, x * x + x, (x - 1) * (x - 1)]) : Q('squares', `√${fmt(x * x)}`, x, [x + 1, x - 1, x * x / 2]); }},
  {key: 'neg', bands: [3, 4, 5], make(b){   // negative numbers
    if(b === 3){ const x = R(2, 9), y = R(x + 1, x + 9); return chance(.5) ? Q('neg', `${x} − ${y}`, x - y, [y - x, x - y - 1, x - y + 1], {neg: true}) : Q('neg', `−${y} + ${x}`, x - y, [y - x, x + y, x - y + 2], {neg: true}); }
    if(b === 4){ const x = R(2, 12), y = R(2, 12); return chance(.5) ? Q('neg', `−${x} − ${y}`, -x - y, [x + y, y - x, -x - y + 2], {neg: true}) : Q('neg', `−${x} × ${y}`, -x * y, [x * y, -x - y, -x * (y + 1)], {neg: true}); }
    const x = R(2, 12), y = R(2, 12); return chance(.5) ? Q('neg', `−${x} × −${y}`, x * y, [-x * y, x + y, x * y + x], {neg: true}) : Q('neg', `−${fmt(x * y)} ÷ ${y}`, -x, [x, -x - 1, -x + 1], {neg: true}); }},
  {key: 'order', bands: [4, 5], make(b){   // order of operations
    const x = R(2, 9), y = R(2, 9), z = R(2, 9), k = R(1, b === 4 ? 2 : 3);
    if(k === 1) return Q('order', `${x} + ${y} × ${z}`, x + y * z, [(x + y) * z, x * y + z, x + y + z]);
    if(k === 2) return Q('order', `(${x + y} − ${y}) × ${z}`, x * z, [x + y - y * z, (x + y) * z - y, x * z + y]);
    return Q('order', `${x * z + y} − ${x * z} ÷ ${z}`, x * z + y - x, [y / z, y, x * z + y - x * z]); }}
];

// One question at this band: two thirds bread and butter (tables a little more than adding and subtracting), a third the rest
function make(band){
  const b = Math.max(1, Math.min(5, Math.floor(band) || 1));
  for(let tries = 0; tries < 20; tries++){
    const k = Math.random(), extras = EXTRA.filter(e => e.bands.includes(b));
    const q = k < .36 ? times(b) : k < .67 ? addsub(b) : pick(extras).make(b);
    if(!q || !isFinite(q.ans)) continue;
    if(q.ans < 0 && !q.neg) continue;
    q.level = b;
    q.wrongs = [...new Set(q.wrongs.filter(w => isFinite(w) && w !== q.ans && (w >= 0 || q.neg || q.ans < 0)))];
    return q;
  }
  return Q('times', '6 × 7', 42, [48, 36, 13], {level: b});
}
// Wrong answers to show: the real mistakes first, then near neighbours (n wrong answers, all different, none the answer)
function distractors(q, n){
  const out = [], seen = new Set([fix(q.ans)]);
  const add = v => { v = fix(v); if(out.length < n && isFinite(v) && !seen.has(v) && (v >= 0 || q.neg || q.ans < 0) && dpOf(v) <= Math.max(2, q.dp)) { seen.add(v); out.push(v); } };
  q.wrongs.forEach(add);
  const step = q.dp ? Math.pow(10, -q.dp) : Math.abs(q.ans) >= 100 ? 10 : 1;
  [1, -1, 2, -2, 10, -10, 3, -3, 5, -5].forEach(k => add(q.ans + k * step));
  for(let i = 4; out.length < n && i < 40; i++) add(q.ans + (i % 2 ? i : -i) * step);
  return out.slice(0, n);
}
// The question as a statement with the value v, for True or false ("7 × 8 = 54"; "? × 7 = 56" becomes "8 × 7 = 56")
const statement = (q, v) => q.prompt.includes('?') ? q.prompt.replace('?', `<b>${fmt(v)}</b>`) : `${q.prompt} = <b>${fmt(v)}</b>`;

window.AEA_QUICKMATHS = {make, distractors, statement, fmt, fix, par};
})();
