/* THE LANDING PAGE AND THE HOME PAGE (redesign stage 1, 8 Nov 2026).
   index.html [data-landing]: for visitors who are not logged in: what the site is, Log in, Play without logging in, the
     Daily Circuit and every subject. Students who are logged in (or have chosen to play without logging in) are sent
     straight to their home by a few lines in index.html's <head>.
   en/index.html [data-home]: the student's home: greeting and overall level, class games, the Daily Circuit with this
     week's circuits, this week's points, Your subjects (switched on: level, words known, last played, Continue) and
     More subjects (the rest, with their "I study this" switches), then the suggestions box.
   Everything comes from the subject list (subjects.js) and what the games save in this browser (or the account):
     aea:progress:v1 (levels, words, days), aea:points:v1, aea:circuit:v1, aea:studying:v1 (the switches, the same format as
     circuit.js), aea:lastgame:v1 (the last game played on each topic page: app.js).
   Load it last, after points.js, circuit.js, account.js, subjects.js and shell.js. */
(function(){
'use strict';
const SRC = (document.currentScript && document.currentScript.src) || '';
const ROOT = SRC ? SRC.replace(/en\/engine\/home\.js([?#].*)?$/, '') : location.origin + '/';
const SUBJ = window.AEA_SUBJECTS;
const HOME = document.querySelector('[data-home]'), LAND = document.querySelector('[data-landing]');
if(!SUBJ || !(HOME || LAND)) return;

const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const read = k => { try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } };
const write = (k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
const dayKey = x => x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');
const norm = p => String(p||'').split('#')[0].split('?')[0].replace(/^\/+/, '').replace(/index\.html$/, '');
const fmt = n => Number(n||0).toLocaleString('en-GB');
const svg = (d, size, sw) => `<svg width="${size||18}" height="${size||18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw||2.4}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const ARROW = '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>', CHECK = '<path d="m5 12 5 5 9-10"/>', RIGHT = '<path d="m9 6 6 6-6 6"/>';

// ----- levels (the same scale and names as the games: en/engine/app.js) -----
const LEVELS = ['', 'Foundation', 'Foundation+', 'Intermediate', 'Intermediate+', 'Advanced'], CAL = 10;
const label = r => { const b = Math.max(1, Math.min(5, Math.floor(r))); return {name: LEVELS[b], pct: b >= 5 ? 100 : Math.round((r - b) * 100), next: LEVELS[b + 1] || ''}; };
const progress = () => { const d = read('aea:progress:v1') || {}; d.topics = d.topics || {}; d.words = d.words || {}; d.days = d.days || {}; return d; };
// The overall level: every topic with 10 answers, weighted by answers (as My progress shows it)
function overall(d){ let sum = 0, n = 0; Object.values(d.topics).forEach(t=>{ if(t && t.n >= CAL){ sum += t.r * t.n; n += t.n; } }); return n ? sum / n : null; }
// The saved record for a subject's page (English side), the one with the most answers
function topicFor(d, path){
  const want = norm(path); let best = null;
  Object.values(d.topics).forEach(t=>{ if(!t || t.side === 'zh') return; const h = norm(String(t.href||'').replace(/^.*?\/(en|maths)\//, '$1/'));
    if(h === want && (!best || (t.n||0) > (best.n||0))) best = t; });
  return best;
}
const ago = t => { if(!t) return ''; const a = new Date(t), now = new Date(); const days = Math.round((new Date(now.toDateString()) - new Date(a.toDateString())) / 864e5);
  return days <= 0 ? 'today' : days === 1 ? 'yesterday' : days < 7 ? days + ' days ago' : days < 14 ? 'last week' : a.toLocaleDateString('en-GB', {day: 'numeric', month: 'short'}); };

// ----- the subjects switched on (the same storage as the Daily Circuit: circuit.js) -----
const studyingMap = () => ((read('aea:studying:v1') || {}).en) || {};
const isOn = s => s.always || !!studyingMap()[s.path];
function setStudying(s, on){
  const all = read('aea:studying:v1') || {}; all.en = all.en || {};
  if(on) all.en[s.path] = s.name; else delete all.en[s.path];
  write('aea:studying:v1', all);
  try{ window.dispatchEvent(new CustomEvent('aea:studying')); }catch(e){}
}
const sw = s => `<button type="button" class="aea-sw" role="switch" aria-checked="${isOn(s)}" data-sw="${esc(s.path)}" title="I study this"><span class="aea-sr">I study ${esc(s.name)}</span><span class="t" aria-hidden="true"></span></button>`;

// ---------- HOME ----------
function hello(d){
  const a = read('aea:account'), h = new Date().getHours(), when = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const ov = overall(d), L = ov != null ? label(ov) : null;
  const date = new Date().toLocaleDateString('en-GB', {weekday: 'long', day: 'numeric', month: 'long'});
  return `<div><p class="aea-eyebrow" style="margin-bottom:6px">${esc(date)}</p>
      <h1 class="aea-h1">${when}${a && a.name ? ', ' + esc(a.name) : ''}</h1></div>
    <div class="aea-hello-lvl">${L
      ? `<p class="aea-mono" style="margin:0">Your level: <b>${esc(L.name)}</b></p><div class="aea-bar" role="img" aria-label="${L.next ? `${L.pct}% of the way to ${esc(L.next)}` : 'Top level'}"><i style="width:${L.pct}%"></i></div>`
      : `<p class="aea-mono" style="margin:0">Your level</p><p style="margin:0;color:var(--sh-ink2)">It shows after ${CAL} answers in any subject.</p>`}</div>`;
}
function today(){
  const C = window.AEA_CIRCUIT, run = C ? C.active('en') : null, t = C ? C.today('en') : null;
  const st = run ? `In progress · station ${Math.min(run.i + 1, run.n)} of ${run.n}` : t && t.runs ? 'Done today' : 'Not done today';
  const go = run ? 'Continue' : t && t.runs ? 'Play again' : 'Start the circuit';
  // This week's circuits, Monday to Sunday
  const days = ((read('aea:circuit:v1') || {}).days) || {}, now = new Date(), mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], todayK = dayKey(now);
  const week = NAMES.map((n, i)=>{ const x = new Date(mon); x.setDate(mon.getDate() + i); const k = dayKey(x), done = !!((days[k] || {}).en || {}).runs;
    const isToday = k === todayK, future = k > todayK;
    return `<li><span class="c${done ? ' done' : isToday ? ' today' : ''}" aria-hidden="true">${done ? svg(CHECK, 18, 3) : ''}</span><span class="d" aria-hidden="true">${n[0]}</span><span class="aea-sr">${n}: ${done ? 'done' : isToday ? 'today, not done yet' : future ? 'still to come' : 'not done'}</span></li>`; }).join('');
  // Points this week, Monday to Sunday
  const P = window.AEA_POINTS, tot = P ? P.totals('en') : {w: 0}, target = P ? P.WEEKLY_TARGET : 200;
  const pdays = (((read('aea:points:v1') || {}).en) || {}).days || {};
  const pts = NAMES.map((n, i)=>{ const x = new Date(mon); x.setDate(mon.getDate() + i); return (pdays[dayKey(x)] || {}).p || 0; });
  const max = Math.max(1, ...pts), nowI = (now.getDay() + 6) % 7;
  const words = Object.values(progress().words), known = words.filter(w=>w && w.s >= 4).length, learning = words.filter(w=>w && w.s >= 1 && w.s < 4).length;
  return `<div class="aea-circuit">
      <div class="aea-circuit-main">
        <p style="display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px"><span class="aea-badge5">5 MIN</span><span class="aea-circuit-st">${esc(st)}</span></p>
        <h2>Daily Circuit</h2>
        <a class="aea-btn aea-btn-y" href="${ROOT}en/circuit/index.html">${esc(go)} ${svg(ARROW)}</a>
      </div>
      <div class="aea-week"><ol aria-label="Circuits this week">${week}</ol></div>
    </div>
    <div class="aea-card aea-thisweek">
      <div class="aea-thisweek-top"><h2>This week</h2><a href="${ROOT}progress/index.html?from=en" style="font-size:15px;font-weight:700">My progress</a></div>
      <p class="aea-big"><b>${fmt(tot.w)}</b> of ${target} points</p>
      <div class="aea-chart" aria-hidden="true">${pts.map((v, i)=>`<div><span class="col"><i class="${i === nowI ? 'now' : ''}" style="height:${Math.round(v / max * 100)}%"></i></span><span>${'MTWTFSS'[i]}</span></div>`).join('')}</div>
      <p class="aea-sr">Points this week: ${NAMES.map((n, i)=>`${n} ${pts[i]}`).join(', ')}.</p>
      <p class="aea-words">Words known: <b>${fmt(known)}</b> · Learning: <b>${fmt(learning)}</b></p>
    </div>`;
}
function mine(d){
  const list = SUBJ.ordered().filter(s=>!s.soon && isOn(s)), last = read('aea:lastgame:v1') || {};
  return list.map(s=>{
    const area = SUBJ.areaOf(s.area), t = topicFor(d, s.path), found = t && t.n >= CAL, L = found ? label(t.r) : null;
    const lg = last[s.path], w = t && t.words;
    const cta = lg && lg.key ? {href: ROOT + s.path + '#play-' + encodeURIComponent(lg.key), text: 'Continue: ' + lg.name} : {href: ROOT + s.path, text: t ? 'Open' : 'Start'};
    const lvl = found ? `<p class="aea-mono" style="margin:0">Your level: <b>${esc(L.name)}</b></p><div class="aea-bar" role="img" aria-label="${L.next ? `${L.pct}% of the way to ${esc(L.next)}` : 'Top level'}"><i style="width:${L.pct}%"></i></div>`
      : t && t.n ? `<p class="aea-mono" style="margin:0">Your level: <b>finding it</b> <span style="text-transform:none;letter-spacing:0">(${CAL - t.n} more answer${CAL - t.n === 1 ? '' : 's'})</span></p><div class="aea-bar" aria-hidden="true"><i style="width:${t.n * 100 / CAL}%"></i></div>`
      : `<p class="aea-mono" style="margin:0">Not played yet</p>`;
    return `<article class="aea-box">
      <div class="aea-box-top"><p class="aea-area-l" style="color:${area.color}">${esc(area.name)}</p>${s.always ? '<span class="aea-always">ALWAYS ON</span>' : sw(s)}</div>
      <h3><a href="${esc(ROOT + s.path)}">${esc(s.name)}</a></h3>
      <div>${lvl}</div>
      ${t ? `<p class="aea-meta">${w && w.total ? `Words known: ${fmt(w.known)} of ${fmt(w.total)} · ` : ''}Last played: ${esc(ago(t.last))}</p>` : ''}
      <a class="aea-btn aea-btn-line" href="${esc(cta.href)}">${esc(cta.text)} ${svg(ARROW, 16, 2.6)}</a>
    </article>`; }).join('');
}
function more(){
  const list = SUBJ.ordered().filter(s=>s.soon || !isOn(s));
  return list.map(s=>{
    const area = SUBJ.areaOf(s.area), dot = `<span class="aea-dot" aria-hidden="true"><i style="background:${area.color}"></i></span>`;
    if(s.soon) return `<li class="aea-rowi soon">${dot}<span class="nm">${esc(s.name)}</span><span class="note">Coming soon</span></li>`;
    return `<li class="aea-rowi">${dot}<a class="nm" href="${esc(ROOT + s.path)}">${esc(s.name)}</a>${SUBJ.switchable(s) ? sw(s) : `<span class="go">${svg(RIGHT, 18, 2.2)}</span>`}</li>`; }).join('');
}
function drawHome(){
  const d = progress();
  const put = (k, html) => { const el = HOME.querySelector(`[data-h="${k}"]`); if(el) el.innerHTML = html; };
  put('hello', hello(d)); put('today', today()); put('mine', mine(d)); put('more', more());
  const moreSec = HOME.querySelector('[data-h="more"]'); if(moreSec) moreSec.closest('section').hidden = !moreSec.children.length;
}
function wireHome(){
  HOME.addEventListener('click', e=>{
    const b = e.target.closest('[data-sw]'); if(!b) return;
    const s = SUBJ.SUBJECTS.find(x=>x.path === b.dataset.sw); if(!s) return;
    setStudying(s, b.getAttribute('aria-checked') !== 'true');
    const y = window.scrollY; drawHome(); window.scrollTo(0, y);
    const again = HOME.querySelector(`[data-sw="${CSS.escape(s.path)}"]`); if(again) again.focus({preventScroll: true});
  });
  // Visiting the English home means this browser plays: the landing page sends it straight to a home next time (the side
  // chosen in the language menu, or the side played last: index.html)
  try{ localStorage.setItem('aeaGuestPlay', '1'); }catch(e){}
  window.addEventListener('pageshow', e=>{ if(e.persisted) drawHome(); });
  window.addEventListener('aea:synced', drawHome);
  window.addEventListener('storage', e=>{ if(/^aea:(progress|points|circuit|studying|lastgame|account)/.test(e.key || '')) drawHome(); });
  // A link to a section (Got an idea?, All subjects) from another page: the page is drawn by now, so go there
  if(location.hash){ const el = document.getElementById(location.hash.slice(1)); if(el) setTimeout(()=>el.scrollIntoView(), 0); }
}

// ---------- LANDING ----------
function drawLanding(){
  const a = read('aea:account'), playing = !!a || (()=>{ try{ return localStorage.getItem('aeaGuestPlay') === '1'; }catch(e){ return false; } })();
  const from = encodeURIComponent((new URL(ROOT + 'en/index.html')).pathname);
  const btns = LAND.querySelector('[data-l="btns"]');
  if(btns) btns.innerHTML = playing
    ? `<a class="aea-btn aea-btn-dark" href="${ROOT}en/index.html">Go to my home ${svg(ARROW)}</a>${a && a.token ? '' : `<a class="aea-btn aea-btn-y" href="${ROOT}login/index.html?from=${from}">Log in</a>`}`
    : `<a class="aea-btn aea-btn-dark" href="${ROOT}login/index.html?from=${from}">Log in</a><a class="plain" href="${ROOT}en/index.html" data-guest>Play without logging in</a>`;
  const subj = LAND.querySelector('[data-l="subjects"]');
  if(subj){
    const ess = SUBJ.SUBJECTS.find(s=>s.always);
    const areas = SUBJ.AREAS.filter(x=>x.key !== 'every' && SUBJ.SUBJECTS.some(s=>s.area === x.key));
    subj.innerHTML = (ess ? `<article class="aea-card aea-ess"><div><p class="aea-eyebrow">Every subject</p><h3><a href="${esc(ROOT + ess.path)}">${esc(ess.name)}</a></h3></div>
        <span class="aea-always">${svg(CHECK, 16, 2.6)}Always in the Daily Circuit</span></article>` : '') +
      `<div class="aea-areas">${areas.map(x=>`<section class="aea-areabox" aria-label="${esc(x.name)}"><span class="rule" aria-hidden="true" style="background:${x.color}"></span><h3>${esc(x.name)}</h3>
        <ul>${SUBJ.SUBJECTS.filter(s=>s.area === x.key).map(s=> s.soon
          ? `<li><span class="soon"><span>${esc(s.name)}</span><small>Coming soon</small></span></li>`
          : `<li><a href="${esc(ROOT + s.path)}"><span>${esc(s.name)}</span>${svg(RIGHT, 16, 2.2)}</a></li>`).join('')}</ul></section>`).join('')}</div>`;
  }
  LAND.addEventListener('click', e=>{ if(e.target.closest('[data-guest]')){ try{ localStorage.setItem('aeaGuestPlay', '1'); }catch(err){} } });
}

if(HOME){ drawHome(); wireHome(); }
if(LAND) drawLanding();
})();
