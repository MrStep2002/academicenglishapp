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
const write = (k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
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
const ago = t => { if(!t) return ''; const a = new Date(t), now = new Date(); const days = Math.round((new Date(now.toDateString()) - new Date(a.toDateString())) / 864e5);
  if(ZH) return days <= 0 ? L('today', '今天') : days === 1 ? L('yesterday', '昨天') : days < 7 ? L(days + ' days ago', days + ' 天前') : days < 14 ? L('last week', '上周')
    : L(esc(a.toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})), esc(a.toLocaleDateString('zh-CN', {month: 'long', day: 'numeric'})));
  return days <= 0 ? 'today' : days === 1 ? 'yesterday' : days < 7 ? days + ' days ago' : days < 14 ? 'last week' : a.toLocaleDateString('en-GB', {day: 'numeric', month: 'short'}); };

// ----- the subjects switched on (the same storage as the Daily Circuit: circuit.js) -----
// (On the Chinese side a subject is saved with both its names, "Web design 网页设计", as the Daily Circuit has always saved them)
const studyingMap = () => ((read('aea:studying:v1') || {})[SIDE]) || {};
const isOn = s => s.always || !!studyingMap()[s.path];
function setStudying(s, on){
  const all = read('aea:studying:v1') || {}; all[SIDE] = all[SIDE] || {};
  if(on) all[SIDE][s.path] = ZH && s.zh ? s.name + ' ' + s.zh : s.name; else delete all[SIDE][s.path];
  write('aea:studying:v1', all);
  try{ window.dispatchEvent(new CustomEvent('aea:studying')); }catch(e){}
}
const sw = s => `<button type="button" class="aea-sw" role="switch" aria-checked="${isOn(s)}" data-sw="${esc(s.path)}" title="${A('I study this', '我在学')}"><span class="aea-sr">${ZH ? L(`I study ${esc(s.name)}`, `我在学${esc(s.zh || s.name)}`) : `I study ${esc(s.name)}`}</span><span class="t" aria-hidden="true"></span></button>`;

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
  return list.map(s=>{
    const area = SUBJ.areaOf(s.area), t = topicFor(d, s.path), found = t && t.n >= CAL, lv = found ? label(t.r) : null;
    const lg = last[s.path], w = t && t.words;
    const cta = lg && lg.key ? {href: ROOT + s.path + '#play-' + encodeURIComponent(lg.key), html: ZH ? L('Continue: ' + esc(lg.name), '继续：' + esc(lg.zh || lg.name)) : esc('Continue: ' + lg.name)}
      : {href: ROOT + s.path, html: t ? L('Open', '打开') : L('Start', '开始')};
    const left = t ? CAL - t.n : 0;
    const lvl = found ? `<p class="aea-mono" style="margin:0">${L('Your level', '你的水平')}: <b>${lvName(lv)}</b></p><div class="aea-bar" role="img" aria-label="${ZH ? esc(lvTip(lv)) : lv.next ? `${lv.pct}% of the way to ${esc(lv.next)}` : 'Top level'}"><i style="width:${lv.pct}%"></i></div>`
      : t && t.n ? `<p class="aea-mono" style="margin:0">${L(`Your level: <b>finding it</b> <span style="text-transform:none;letter-spacing:0">(${left} more answer${left === 1 ? '' : 's'})</span>`, `你的水平：<b>正在评估</b>（还需 ${left} 题）`)}</p><div class="aea-bar" aria-hidden="true"><i style="width:${t.n * 100 / CAL}%"></i></div>`
      : `<p class="aea-mono" style="margin:0">${L('Not played yet', '还没玩过')}</p>`;
    return `<article class="aea-box">
      <div class="aea-box-top"><p class="aea-area-l" style="color:${area.color}">${nameOf(area)}</p>${s.always ? `<span class="aea-always">${L('ALWAYS ON', '一直包含')}</span>` : sw(s)}</div>
      <h3><a href="${esc(ROOT + s.path)}">${nameOf(s)}</a></h3>
      <div>${lvl}</div>
      ${t ? `<p class="aea-meta">${w && w.total ? L(`Words known: ${fmt(w.known)} of ${fmt(w.total)} · `, `已掌握 ${fmt(w.known)} / ${fmt(w.total)} 个单词 · `) : ''}${L('Last played', '上次玩')}: ${ZH ? ago(t.last) : esc(ago(t.last))}</p>` : ''}
      <a class="aea-btn aea-btn-line" href="${esc(cta.href)}">${cta.html} ${svg(ARROW, 16, 2.6)}</a>
    </article>`; }).join('');
}
function more(){
  const list = LIST.ordered().filter(s=>s.soon || !isOn(s));
  return list.map(s=>{
    const area = SUBJ.areaOf(s.area), dot = `<span class="aea-dot" aria-hidden="true"><i style="background:${area.color}"></i></span>`;
    if(s.soon) return `<li class="aea-rowi soon">${dot}<span class="nm">${nameOf(s)}</span><span class="note">${L('Coming soon', '即将推出')}</span></li>`;
    return `<li class="aea-rowi">${dot}<a class="nm" href="${esc(ROOT + s.path)}">${nameOf(s)}</a>${SUBJ.switchable(s) ? sw(s) : `<span class="go">${svg(RIGHT, 18, 2.2)}</span>`}</li>`; }).join('');
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
    const s = LIST.SUBJECTS.find(x=>x.path === b.dataset.sw); if(!s) return;
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
