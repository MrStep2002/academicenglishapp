/* THE LANDING PAGE AND THE HOME PAGE (redesign stage 1, 8 Nov 2026).
   index.html [data-landing]: for visitors who are not logged in: what the site is, Log in, Play without logging in, the
     Daily Circuit and every subject. Students who are logged in (or have chosen to play without logging in) are sent
     straight to their home by a few lines in index.html's <head>.
   en/index.html [data-home]: the student's home: greeting and overall level, class games, the Daily Circuit with this
     week's circuits, this week's points, Your subjects, then the suggestions box.
     Your subjects (11 Nov 2026, teacher): only the subjects the student has ticked (in Subjects, the panel at the top of
     the sidebar: shell.js), in their areas, four boxes across. Each box: the name (half the old size, two lines at most,
     then …), the level and an Open (or Continue) button, all the boxes the same size with the button at the same height.
     More subjects (the rest, with switches) and the words known / last played lines are gone.
   Everything comes from the subject list (subjects.js) and what the games save in this browser (or the account):
     aea:progress:v1 (levels, words, days), aea:points:v1, aea:circuit:v1, aea:studying:v1 (the switches, the same format as
     circuit.js), aea:lastgame:v1 (the last game played on each topic page: app.js).
   zh/index.html [data-home data-side="zh"] (stage 4, 8 Nov 2026): the Chinese version's home, the same page in Chinese with
     the Chinese version's subjects (ZH_SUBJECTS), circuit, points and levels. Every label has both languages (class t-en /
     t-zh; the English / 中文 switch in account.js shows one).
   Load it last, after points.js, circuit.js, account.js, subjects.js and shell.js. */
(function(){
'use strict';
const SRC = (document.currentScript && document.currentScript.src) || '';
const ROOT = SRC ? SRC.replace(/en\/engine\/home\.js([?#].*)?$/, '') : location.origin + '/';
const SUBJ = window.AEA_SUBJECTS;
const HOME = document.querySelector('[data-home]'), LAND = document.querySelector('[data-landing]');
if(!SUBJ || !(HOME || LAND)) return;
// The side: en, or zh (the Chinese version's home)
const SIDE = HOME && HOME.getAttribute('data-side') === 'zh' ? 'zh' : 'en', ZH = SIDE === 'zh';
const LIST = ZH && SUBJ.forSide ? SUBJ.forSide('zh') : {SUBJECTS: SUBJ.SUBJECTS, ordered: SUBJ.ordered};
// Both languages on the Chinese side (the CSS shows one); A() for attributes and other places that hold only text
const L = (en, zh) => ZH ? `<span class="t-en">${en}</span><span class="t-zh" lang="zh-CN">${zh}</span>` : en;
const uiZh = () => { try{ return localStorage.getItem('aea:ui-lang') !== 'en'; }catch(e){ return true; } };
const A = (en, zh) => ZH && uiZh() ? zh : en;
const nameOf = x => ZH && x.zh ? L(esc(x.name), esc(x.zh)) : esc(x.name);

const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const read = k => { try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } };
const dayKey = x => x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');
const norm = p => String(p||'').split('#')[0].split('?')[0].replace(/^\/+/, '').replace(/index\.html$/, '');
const fmt = n => Number(n||0).toLocaleString('en-GB');
const svg = (d, size, sw) => `<svg width="${size||18}" height="${size||18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw||2.4}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const ARROW = '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>', CHECK = '<path d="m5 12 5 5 9-10"/>', RIGHT = '<path d="m9 6 6 6-6 6"/>';

// ----- levels (the same scale and names as the games: en/engine/app.js) -----
const LEVELS = ['', 'Foundation', 'Foundation+', 'Intermediate', 'Intermediate+', 'Advanced'], CAL = 10;
const LEVELS_ZH = ['', '基础', '基础+', '中级', '中级+', '高级'];
const label = r => { const b = Math.max(1, Math.min(5, Math.floor(r))); return {name: LEVELS[b], zh: LEVELS_ZH[b], pct: b >= 5 ? 100 : Math.round((r - b) * 100), next: LEVELS[b + 1] || '', nextZh: LEVELS_ZH[b + 1] || ''}; };
// A level's name (HTML), and "40% of the way to Intermediate" (text, for an aria-label)
const lvName = x => ZH ? L(esc(x.name), esc(x.zh)) : esc(x.name);
const lvTip = x => x.next ? A(`${x.pct}% of the way to ${x.next}`, `距离${x.nextZh}还有 ${100 - x.pct}%`) : A('Top level', '最高级别');
const progress = () => { const d = read('aea:progress:v1') || {}; d.topics = d.topics || {}; d.words = d.words || {}; d.days = d.days || {}; return d; };
// The overall level: every topic with 10 answers, weighted by answers (as My progress shows it)
function overall(d){ let sum = 0, n = 0; Object.values(d.topics).forEach(t=>{ if(t && t.n >= CAL){ sum += t.r * t.n; n += t.n; } }); return n ? sum / n : null; }
// The saved record for a subject's page (this side's), the one with the most answers
function topicFor(d, path){
  const want = norm(path); let best = null;
  Object.values(d.topics).forEach(t=>{ if(!t || (!ZH && t.side === 'zh')) return; const h = norm(String(t.href||'').replace(/^.*?\/(en|maths|zh)\//, '$1/'));
    if(h === want && (!best || (t.n||0) > (best.n||0))) best = t; });
  return best;
}

// A subject whose progress the maths pages keep (progress: 'maths:<topic>', e.g. Quick Fire Maths): aea:maths:v1 {r, n, last}
function progressOf(d, s){
  const m = /^maths:(.+)$/.exec(s.progress || '');
  if(!m) return topicFor(d, s.path);
  const t = (((read('aea:maths:v1') || {}).topics) || {})[m[1]];
  return t && t.n ? {n: t.n, r: t.r, last: t.last} : null;
}
// ----- the subjects ticked (in Subjects: shell.js; the same storage as the Daily Circuit: circuit.js) -----
const studyingMap = () => ((read('aea:studying:v1') || {})[SIDE]) || {};
const isOn = s => s.always || !!studyingMap()[s.path];

// ---------- HOME ----------
function hello(d){
  const a = read('aea:account'), h = new Date().getHours(), when = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const ov = overall(d), lv = ov != null ? label(ov) : null;
  const date = new Date().toLocaleDateString('en-GB', {weekday: 'long', day: 'numeric', month: 'long'});
  if(ZH){
    const whenZh = h < 12 ? '早上好' : h < 18 ? '下午好' : '晚上好', dateZh = new Date().toLocaleDateString('zh-CN', {month: 'long', day: 'numeric', weekday: 'long'});
    const nm = a && a.name ? esc(a.name) : '';
    return `<div><p class="aea-eyebrow" style="margin-bottom:6px">${L(esc(date), esc(dateZh))}</p>
      <h1 class="aea-h1">${L(when + (nm ? ', ' + nm : ''), (nm ? nm + '，' : '') + whenZh)}</h1></div>
    <div class="aea-hello-lvl">${lv
      ? `<p class="aea-mono" style="margin:0">${L('Your level', '你的水平')}: <b>${lvName(lv)}</b></p><div class="aea-bar" role="img" aria-label="${esc(lvTip(lv))}"><i style="width:${lv.pct}%"></i></div>`
      : `<p class="aea-mono" style="margin:0">${L('Your level', '你的水平')}</p><p style="margin:0;color:var(--sh-ink2)">${L(`It shows after ${CAL} answers in any subject.`, `在任一科目答 ${CAL} 题后显示。`)}</p>`}</div>`;
  }
  const L_ = lv;
  return `<div><p class="aea-eyebrow" style="margin-bottom:6px">${esc(date)}</p>
      <h1 class="aea-h1">${when}${a && a.name ? ', ' + esc(a.name) : ''}</h1></div>
    <div class="aea-hello-lvl">${L_
      ? `<p class="aea-mono" style="margin:0">Your level: <b>${esc(L_.name)}</b></p><div class="aea-bar" role="img" aria-label="${L_.next ? `${L_.pct}% of the way to ${esc(L_.next)}` : 'Top level'}"><i style="width:${L_.pct}%"></i></div>`
      : `<p class="aea-mono" style="margin:0">Your level</p><p style="margin:0;color:var(--sh-ink2)">It shows after ${CAL} answers in any subject.</p>`}</div>`;
}
function today(){
  const C = window.AEA_CIRCUIT, run = C ? C.active(SIDE) : null, t = C ? C.today(SIDE) : null;
  const st = run ? L(`In progress · station ${Math.min(run.i + 1, run.n)} of ${run.n}`, `进行中 · 第 ${Math.min(run.i + 1, run.n)} 站，共 ${run.n} 站`) : t && t.runs ? L('Done today', '今天已完成') : L('Not done today', '今天还没完成');
  const go = run ? L('Continue', '继续') : t && t.runs ? L('Play again', '再玩一次') : L('Start the circuit', '开始挑战');
  // This week's circuits, Monday to Sunday
  const days = ((read('aea:circuit:v1') || {}).days) || {}, now = new Date(), mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], todayK = dayKey(now);
  const NAMES_ZH = ['星期一','星期二','星期三','星期四','星期五','星期六','星期日'], ONE_ZH = '一二三四五六日';
  const week = NAMES.map((n, i)=>{ const x = new Date(mon); x.setDate(mon.getDate() + i); const k = dayKey(x), done = !!((days[k] || {})[SIDE] || {}).runs;
    const isToday = k === todayK, future = k > todayK;
    const say = ZH ? L(`${n}: ${done ? 'done' : isToday ? 'today, not done yet' : future ? 'still to come' : 'not done'}`, `${NAMES_ZH[i]}：${done ? '已完成' : isToday ? '今天，还没完成' : future ? '还没到' : '没完成'}`)
      : `${n}: ${done ? 'done' : isToday ? 'today, not done yet' : future ? 'still to come' : 'not done'}`;
    return `<li><span class="c${done ? ' done' : isToday ? ' today' : ''}" aria-hidden="true">${done ? svg(CHECK, 18, 3) : ''}</span><span class="d" aria-hidden="true">${L(n[0], ONE_ZH[i])}</span><span class="aea-sr">${say}</span></li>`; }).join('');
  // Points this week, Monday to Sunday
  const P = window.AEA_POINTS, tot = P ? P.totals(SIDE) : {w: 0}, target = P ? P.WEEKLY_TARGET : 200;
  const pdays = (((read('aea:points:v1') || {})[SIDE]) || {}).days || {};
  const pts = NAMES.map((n, i)=>{ const x = new Date(mon); x.setDate(mon.getDate() + i); return (pdays[dayKey(x)] || {}).p || 0; });
  const max = Math.max(1, ...pts), nowI = (now.getDay() + 6) % 7;
  const words = Object.values(progress().words), known = words.filter(w=>w && w.s >= 4).length, learning = words.filter(w=>w && w.s >= 1 && w.s < 4).length;
  return `<div class="aea-circuit">
      <div class="aea-circuit-main">
        <p style="display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px"><span class="aea-badge5">${L('5 MIN', '5 分钟')}</span><span class="aea-circuit-st">${st}</span></p>
        <h2>${L('Daily Circuit', '每日挑战')}</h2>
        <a class="aea-btn aea-btn-y" href="${ROOT}${SIDE}/circuit/index.html">${go} ${svg(ARROW)}</a>
      </div>
      <div class="aea-week"><ol aria-label="${A('Circuits this week', '本周的挑战')}">${week}</ol></div>
    </div>
    <div class="aea-card aea-thisweek">
      <div class="aea-thisweek-top"><h2>${L('This week', '本周')}</h2><a href="${ROOT}progress/index.html?from=${SIDE}" style="font-size:15px;font-weight:700">${L('My progress', '我的进步')}</a></div>
      <p class="aea-big">${L(`<b>${fmt(tot.w)}</b> of ${target} points`, `<b>${fmt(tot.w)}</b> / ${target} 积分`)}</p>
      <div class="aea-chart" aria-hidden="true">${pts.map((v, i)=>`<div><span class="col"><i class="${i === nowI ? 'now' : ''}" style="height:${Math.round(v / max * 100)}%"></i></span><span>${L('MTWTFSS'[i], ONE_ZH[i])}</span></div>`).join('')}</div>
      <p class="aea-sr">${L(`Points this week: ${NAMES.map((n, i)=>`${n} ${pts[i]}`).join(', ')}.`, `本周积分：${NAMES_ZH.map((n, i)=>`${n} ${pts[i]}`).join('，')}。`)}</p>
      <p class="aea-words">${L(`Words known: <b>${fmt(known)}</b> · Learning: <b>${fmt(learning)}</b>`, `已掌握单词：<b>${fmt(known)}</b> · 学习中：<b>${fmt(learning)}</b>`)}</p>
    </div>`;
}
function mine(d){
  const list = LIST.ordered().filter(s=>!s.soon && isOn(s)), last = read('aea:lastgame:v1') || {};
  const box = s=>{
    const t = progressOf(d, s), found = t && t.n >= CAL, lv = found ? label(t.r) : null, lg = last[s.path];
    const cta = lg && lg.key ? {href: ROOT + s.path + '#play-' + encodeURIComponent(lg.key), html: ZH ? L('Continue: ' + esc(lg.name), '继续：' + esc(lg.zh || lg.name)) : esc('Continue: ' + lg.name)}
      : {href: ROOT + s.path, html: t ? L('Open', '打开') : L('Start', '开始')};
    const left = t ? CAL - t.n : 0;
    const lvl = found ? `<p class="aea-mono">${L('Your level', '你的水平')}: <b>${lvName(lv)}</b></p><div class="aea-bar" role="img" aria-label="${ZH ? esc(lvTip(lv)) : lv.next ? `${lv.pct}% of the way to ${esc(lv.next)}` : 'Top level'}"><i style="width:${lv.pct}%"></i></div>`
      : t && t.n ? `<p class="aea-mono">${L(`Your level: <b>finding it</b> (${left} more)`, `你的水平：<b>正在评估</b>（还需 ${left} 题）`)}</p><div class="aea-bar" aria-hidden="true"><i style="width:${t.n * 100 / CAL}%"></i></div>`
      : `<p class="aea-mono">${L('Not played yet', '还没玩过')}</p>`;
    return `<article class="aea-box">
      <h4 class="aea-box-t"><a href="${esc(ROOT + s.path)}" title="${esc(A(s.name, s.zh || s.name))}">${nameOf(s)}</a></h4>
      <div class="aea-box-lv">${lvl}</div>
      <a class="aea-btn aea-btn-line" href="${esc(cta.href)}"><span class="lbl">${cta.html}</span> ${svg(ARROW, 16, 2.6)}</a>
    </article>`; };
  // One group per area, in the areas' order (Every subject, English, Media, Maths, Science)
  const groups = SUBJ.AREAS.map(a=>({a, list: list.filter(s=>s.area === a.key)})).filter(g=>g.list.length).map(g=>`<section class="aea-group" aria-label="${esc(A(g.a.name, g.a.zh || g.a.name))}">
      <h3 class="aea-group-h" style="color:${g.a.color}">${nameOf(g.a)}</h3>
      <div class="aea-grid4">${g.list.map(box).join('')}</div></section>`).join('');
  // Only Essentials so far: how to add the others
  const few = list.filter(s=>!s.always).length ? '' : `<div class="aea-add"><p>${L('Add the subjects you study: they appear here and in your Daily Circuit.', '添加你在学的科目：它们会出现在这里和你的每日挑战中。')}</p>
      <button type="button" class="aea-btn aea-btn-dark" data-open-subjects>${L('Choose your subjects', '选择你的科目')}</button></div>`;
  return groups + few;
}
function drawHome(){
  const d = progress();
  const put = (k, html) => { const el = HOME.querySelector(`[data-h="${k}"]`); if(el) el.innerHTML = html; };
  put('hello', hello(d)); put('today', today()); put('mine', mine(d));
}
function wireHome(){
  // Ticking a subject in Subjects (shell.js) redraws Your subjects straight away
  window.addEventListener('aea:studying', ()=>{ const y = window.scrollY; drawHome(); window.scrollTo(0, y); });
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
