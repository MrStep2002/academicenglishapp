/* QUICK FIRE MATHS: THE GAME (11 Nov 2026). Teacher: "There shouldn't be a Quick Fire Maths page, it should just take you to
   somewhere where you're getting pelted with maths stuff for fun… a race element… you should feel like you know what you're
   doing… We just want to find a way to get kids to continue playing once they've started. It's about working their brains."
   One button: Go! starts a 60-second round. Each question comes in one of four ways, at random: choose the answer (4),
   tap it (6 tiles), true or false, or type it on the number pad. Right: straight on (a streak, points). Wrong: the right
   answer shows for a second, then on. The clock keeps running: it's a race.
   The level looks after itself: each right answer nudges it up, a slip drops it back, so most answers are right (about 4 in
   5). It is saved between rounds (a little lower, so a round starts well). End: how many right, the best streak, the level
   reached, the best score, and Go again.
   Questions: maths/engine/mental.js (AEA_QUICKMATHS). Points: the maths points (AEA_POINTS, side "maths"), as on the Maths
   pages. Saved: aea:maths:v1 topics.mental {name, r (the level, 1–5.99), n, right, pts, best, lastScore, plays, last}, so it
   goes to a logged-in student's account. Keys: 1–4 / 1–6, T or F (← →), digits, − . Backspace Enter; Enter or Space for Go. */
(function(){
'use strict';
const M = window.AEA_QUICKMATHS, $app = document.getElementById('app');
if(!M || !$app) return;
const T = (en, zh) => `<span class="t-en">${en}</span><span class="t-zh" lang="zh-CN">${zh}</span>`;
const TX = (en, zh) => document.documentElement.getAttribute('data-ui') === 'zh' ? zh : en;
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const shuffle = a => { a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const SECS = 60, UP = 0.15, DOWN = 0.6, START = 1.5;   // UP and DOWN: about 4 right answers in 5 keep the level where it is
const LEVELS = ['', 'Foundation', 'Foundation+', 'Intermediate', 'Intermediate+', 'Advanced'], LEVELS_ZH = ['', '基础', '基础+', '中级', '中级+', '高级'];
const POINTS = {quick: [1, 1, 2, 2, 3], type: [2, 2, 3, 3, 4]};   // as the Maths pages: by level
const FORMATS = [['choose', .34], ['tiles', .2], ['tf', .2], ['type', .26]];
const lvName = d => { const b = Math.max(1, Math.min(5, Math.floor(d))); return T(LEVELS[b], LEVELS_ZH[b]); };

// ----- saved -----
const PKEY = 'aea:maths:v1', KEY = 'mental';
const load = () => { let d; try{ d = JSON.parse(localStorage.getItem(PKEY)) || {}; }catch(e){ d = {}; } d.topics = d.topics || {}; d.skills = d.skills || {}; return d; };
const save = d => { try{ localStorage.setItem(PKEY, JSON.stringify(d)); }catch(e){} };
const mine = () => load().topics[KEY] || null;

// ----- the screens -----
let G = null, keyHandler = null, raf = 0;
document.addEventListener('keydown', e => { if(keyHandler && !e.metaKey && !e.ctrlKey && !e.altKey) keyHandler(e); });
if(window.AEA_SHELL && AEA_SHELL.crumbs) AEA_SHELL.crumbs([{label: 'Home', zh: '首页', href: AEA_SHELL.home()}, {label: 'Quick Fire Maths', zh: '快速心算'}]);

function ready(){
  cancelAnimationFrame(raf); G = null;
  const r = mine(), d = r ? r.r : START;
  $app.innerHTML = `<section class="qf-ready">
    <p class="aea-eyebrow">${T('Every subject · mental maths, no calculator', '所有学科 · 心算，不用计算器')}</p>
    <h1 class="aea-h1">${T('Quick Fire Maths', '快速心算')}</h1>
    <p class="qf-lead">${T('60 seconds. No calculator. How many can you get right?', '60 秒，不用计算器。你能答对多少题？')}</p>
    <button type="button" class="qf-go" id="qfGo">${T('Go!', '开始！')}</button>
    <p class="qf-meta">${r && r.best ? T(`Your best: <b>${r.best}</b>`, `你的最高分：<b>${r.best}</b>`) + ' · ' : ''}${T('Level', '级别')}: <b>${lvName(d)}</b> <span class="qf-note">${T('(it changes as you play)', '（会随着你的表现变化）')}</span></p>
  </section>`;
  const go = document.getElementById('qfGo'); go.onclick = start; go.focus({preventScroll: true});
  keyHandler = e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); start(); } };
}

function start(){
  const r = mine();
  G = {d: r ? r.r : START, score: 0, answered: 0, streak: 0, best: 0, top: r ? r.r : START, left: SECS * 1000, last: 0, lock: true, over: false, paused: false, q: null, fmt: ''};
  $app.innerHTML = `<section class="qf-play" aria-label="${esc(TX('Quick Fire Maths', '快速心算'))}">
    <div class="qf-bar"><div class="qf-time" aria-hidden="true"><i id="qfTime"></i></div>
      <span class="qf-stat"><i>${T('Right', '答对')}</i><b id="qfScore">0</b></span>
      <span class="qf-stat qf-streak"><i>${T('Streak', '连对')}</i><b id="qfStreak">0</b></span>
      <span class="qf-stat"><i>${T('Level', '级别')}</i><b id="qfLevel">${lvName(G.d)}</b></span>
      <span class="qf-secs" id="qfSecs" aria-live="off">60</span></div>
    <div class="qf-stage" id="qfStage"><p class="qf-count" id="qfCount">3</p></div>
    <p class="qf-say" id="qfSay" aria-live="polite"></p>
  </section>`;
  keyHandler = null;
  // 3, 2, 1 (quick), then the clock starts
  let n = 3; const cnt = document.getElementById('qfCount');
  const tick = () => { if(!G || G.over) return; n--; if(n > 0){ cnt.textContent = n; setTimeout(tick, 380); } else { G.last = performance.now(); next(); loop(); } };
  setTimeout(tick, 380);
}

function loop(){
  raf = requestAnimationFrame(now => {
    if(!G || G.over) return;
    if(!G.paused){ G.left -= now - G.last; }
    G.last = now;
    const f = Math.max(0, G.left / (SECS * 1000)), bar = document.getElementById('qfTime'), secs = document.getElementById('qfSecs');
    if(bar) bar.style.width = (f * 100) + '%';
    if(secs){ const s = Math.ceil(Math.max(0, G.left) / 1000); if(secs.textContent !== String(s)) secs.textContent = s; secs.classList.toggle('low', s <= 10); }
    if(G.left <= 0) return end();
    loop();
  });
}

// ----- one question -----
function pickFormat(){ let k = Math.random(); for(const [f, w] of FORMATS){ if((k -= w) < 0) return f; } return 'choose'; }
const ask = q => q.prompt.includes('?') ? q.prompt.replace('?', '<span class="qf-q">?</span>') : `${q.prompt} <span class="qf-eq">= <span class="qf-q">?</span></span>`;
function next(){
  if(!G || G.over) return;
  const q = M.make(G.d), f = pickFormat(), stage = document.getElementById('qfStage');
  G.q = q; G.fmt = f; G.lock = false; G.typed = '';
  stage.className = 'qf-stage qf-f-' + f;   // (qf-f-: not qf-tf, which is the True / False buttons)
  let html = '';
  if(f === 'choose' || f === 'tiles'){
    const n = f === 'choose' ? 4 : 6, opts = shuffle([q.ans, ...M.distractors(q, n - 1)]);
    G.opts = opts;
    html = `<p class="qf-prompt">${ask(q)}</p>${f === 'tiles' ? `<p class="qf-ask">${T('Tap it!', '快点！')}</p>` : ''}
      <div class="qf-opts" role="group">${opts.map((v, i) => `<button type="button" class="qf-opt" data-i="${i}"><kbd>${i + 1}</kbd><span>${M.fmt(v)}</span></button>`).join('')}</div>`;
  } else if(f === 'tf'){
    const truth = Math.random() < .5, v = truth ? q.ans : M.distractors(q, 1)[0];
    G.truth = truth;
    html = `<p class="qf-ask">${T('True or false?', '对还是错？')}</p><p class="qf-prompt qf-stmt">${M.statement(q, v)}</p>
      <div class="qf-tf"><button type="button" class="qf-opt qf-true" data-v="1"><kbd>T</kbd><span>${T('True', '对')}</span></button><button type="button" class="qf-opt qf-false" data-v="0"><kbd>F</kbd><span>${T('False', '错')}</span></button></div>`;
  } else {
    const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', q.neg || q.ans < 0 ? '−' : '', '0', q.dp ? '.' : '', '⌫', 'OK'];
    html = `<p class="qf-prompt">${ask(q)}</p><div class="qf-typed" id="qfTyped" aria-live="polite">&nbsp;</div>
      <div class="qf-pad" role="group" aria-label="${esc(TX('Number pad', '数字键盘'))}">${keys.map(k => k ? `<button type="button" class="qf-key${k === 'OK' ? ' qf-ok' : ''}" data-k="${k}">${k === 'OK' ? T('OK', '确定') : k}</button>` : '<span></span>').join('')}</div>`;
  }
  stage.innerHTML = html;
  stage.querySelectorAll('.qf-opt').forEach(b => b.onclick = () => choose(b));
  stage.querySelectorAll('.qf-key').forEach(b => b.onclick = () => key(b.dataset.k));
  keyHandler = e => {
    if(!G || G.lock) return;
    if(G.fmt === 'type'){
      if(/^[0-9]$/.test(e.key)) key(e.key); else if(e.key === '-' || e.key === '−') key('−'); else if(e.key === '.') key('.');
      else if(e.key === 'Backspace'){ e.preventDefault(); key('⌫'); } else if(e.key === 'Enter'){ e.preventDefault(); key('OK'); }
      return;
    }
    if(G.fmt === 'tf'){ const k = e.key.toLowerCase(); if(k === 't' || e.key === 'ArrowLeft') choose(stage.querySelector('.qf-true')); else if(k === 'f' || e.key === 'ArrowRight') choose(stage.querySelector('.qf-false')); return; }
    const n = parseInt(e.key, 10); if(n >= 1 && n <= G.opts.length) choose(stage.querySelector(`.qf-opt[data-i="${n - 1}"]`));
  };
}
function choose(b){
  if(!G || G.lock || !b) return;
  if(G.fmt === 'tf') return result((b.dataset.v === '1') === G.truth, b);
  return result(M.fix(G.opts[+b.dataset.i]) === M.fix(G.q.ans), b);
}
// The number pad: right as soon as the right number is typed; wrong when it has as many characters as the answer (or OK)
function key(k){
  if(!G || G.lock || G.fmt !== 'type') return;
  const q = G.q, target = M.fmt(q.ans).replace(/,/g, '');
  if(k === '⌫') G.typed = G.typed.slice(0, -1);
  else if(k === '−'){ if(!(q.neg || q.ans < 0)) return; G.typed = G.typed.startsWith('−') ? G.typed.slice(1) : '−' + G.typed; }
  else if(k === '.'){ if(!q.dp || G.typed.includes('.')) return; G.typed += G.typed.replace('−', '') ? '.' : '0.'; }
  else if(k === 'OK'){ if(!G.typed.replace('−', '')) return; return result(G.typed === target); }
  else if(G.typed.replace(/[−.]/g, '').length < 7) G.typed += k;
  const el = document.getElementById('qfTyped'); if(el) el.innerHTML = esc(G.typed) || '&nbsp;';
  if(G.typed === target) return result(true);
  // as many digits as the answer and not it: wrong (the right digits with the wrong sign wait for − or OK)
  const abs = x => x.replace('−', '');
  if(abs(G.typed).length >= abs(target).length && abs(G.typed) !== abs(target)) return result(false);
}

function result(ok, btn){
  if(!G || G.lock) return;
  G.lock = true; G.answered++;
  const q = G.q, stage = document.getElementById('qfStage'), b = Math.max(1, Math.min(5, Math.floor(G.d)));
  // points (the maths points: right answers earn them, every 5 wrong take one off)
  const pts = ok ? POINTS[G.fmt === 'type' ? 'type' : 'quick'][b - 1] : 0;
  if(window.AEA_POINTS) AEA_POINTS.record('maths', pts, ok);
  const d = load(), t = d.topics[KEY] || (d.topics[KEY] = {name: 'Quick Fire Maths', r: START, n: 0, right: 0, pts: 0});
  t.n++; if(ok){ t.right++; t.pts += pts; } t.last = Date.now(); save(d);
  // the level looks after itself
  G.d = Math.max(1, Math.min(5.99, G.d + (ok ? UP : -DOWN))); G.top = Math.max(G.top, G.d);
  if(ok){ G.score++; G.streak++; G.best = Math.max(G.best, G.streak); } else G.streak = 0;
  document.getElementById('qfScore').textContent = G.score;
  document.getElementById('qfStreak').textContent = G.streak;
  document.getElementById('qfLevel').innerHTML = lvName(G.d);
  const say = document.getElementById('qfSay');
  stage.classList.add(ok ? 'right' : 'wrong');
  if(btn) btn.classList.add(ok ? 'ok' : 'no');
  if(ok){
    say.innerHTML = G.streak && G.streak % 5 === 0 ? T(`${G.streak} in a row!`, `连对 ${G.streak} 题！`) : `<span class="qf-plus">+${pts}</span>`;
    setTimeout(next, 230);
  } else {
    if(G.fmt !== 'type') stage.querySelectorAll('.qf-opt').forEach(x => { if(G.fmt === 'tf' ? (x.dataset.v === '1') === G.truth : M.fix(G.opts[+x.dataset.i]) === M.fix(q.ans)) x.classList.add('ok'); });
    say.innerHTML = `<span class="qf-fix">${q.prompt.includes('?') ? q.prompt.replace('?', `<b>${M.fmt(q.ans)}</b>`) : `${q.prompt} = <b>${M.fmt(q.ans)}</b>`}</span>`;
    setTimeout(next, 1100);
  }
}

function end(){
  if(!G || G.over) return;
  G.over = true; cancelAnimationFrame(raf); keyHandler = null;
  const d = load(), t = d.topics[KEY] || (d.topics[KEY] = {name: 'Quick Fire Maths', r: START, n: 0, right: 0, pts: 0});
  const before = t.best || 0, last = t.lastScore;
  t.best = Math.max(before, G.score); t.lastScore = G.score; t.plays = (t.plays || 0) + 1;
  t.r = Math.max(1, G.d - 0.3);   // the next round starts a little lower, so it starts well
  save(d);
  const isBest = G.score > before && t.plays > 1;
  const vsLast = last != null && G.score > last ? T(`${G.score - last} better than last time!`, `比上次多 ${G.score - last} 题！`) : '';
  const toBeat = !isBest && before && G.score < before ? T(`${before - G.score + 1} more to beat your best (${before}).`, `再多答对 ${before - G.score + 1} 题就能打破纪录（${before}）。`) : '';
  $app.innerHTML = `<section class="qf-end">
    <p class="aea-eyebrow">${T("Time's up!", '时间到！')}</p>
    ${isBest ? `<p class="qf-new">${T('New best!', '新纪录！')}</p>` : ''}
    <p class="qf-big"><b>${G.score}</b> ${T('right', '题答对')}</p>
    <p class="qf-sub">${T(`out of ${G.answered} · best streak ${G.best} · level reached ${LEVELS[Math.max(1, Math.min(5, Math.floor(G.top)))]}`, `共 ${G.answered} 题 · 最多连对 ${G.best} · 最高级别 ${LEVELS_ZH[Math.max(1, Math.min(5, Math.floor(G.top)))]}`)}</p>
    <p class="qf-sub">${vsLast || toBeat || (t.plays === 1 ? T('Now beat it!', '现在来打破它吧！') : '')}</p>
    <button type="button" class="qf-go" id="qfAgain">${T('Go again', '再来一次')}</button>
  </section>`;
  const again = document.getElementById('qfAgain'); again.onclick = start; again.focus({preventScroll: true});
  setTimeout(() => { keyHandler = e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); start(); } }; }, 600);   // not by a key still held from the last answer
}

// A round left open in a hidden tab waits; it carries on when the tab is back
document.addEventListener('visibilitychange', () => { if(!G || G.over) return; G.paused = document.hidden; G.last = performance.now(); });

// For the site's tests: the question on screen (read only)
window.AEA_QUICKFIRE = {now: () => G && !G.over && !G.lock ? {ans: G.q.ans, fmt: G.fmt, opts: G.opts, truth: G.truth, d: G.d} : null, playing: () => !!G && !G.over};
ready();
})();
