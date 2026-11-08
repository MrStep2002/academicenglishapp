/* THE SITE SHELL (redesign stage 1, 8 Nov 2026): the sidebar and the top bar around every English page.
   It wraps whatever the page already has (the games, My progress, the Daily Circuit page…) and adds:
   - the sidebar: the logo, the language menu (English / 中文版), Home, Daily Circuit, My progress, Your classes (greyed for
     now), My subjects (Essentials + the subjects switched on), Explore (Big Ideas, The Future: greyed until they exist),
     About (Who are we?: greyed; For teachers; Got an idea?)
   - the top bar: the Subjects menu (areas on the left, their subjects on the right), then the days in a row, the points
     (points.js draws them) and the Log in button or the student's name (account.js puts it next to the points)
   - on phones (under 860px) the sidebar becomes a menu that slides in from the left (the ☰ button)
   The page's own points bar, Log in button and mouse logo are hidden (the shell shows them instead); its back link stays.
   Game pages (stage 2, 8 Nov 2026): the game engine (app.js) calls AEA_SHELL.crumbs([{label, href}, …]) and the top bar
   shows that path (Home / Descriptive language / Fill the gap) in place of the Subjects menu; crumbs(null) brings the menu back.
   Load it on every English page after points.js, account.js and subjects.js, with css/site.css in the <head>:
     <script src="…/en/engine/subjects.js?v=…"></script><script src="…/en/engine/shell.js?v=…"></script>
   THE CHINESE VERSION (stage 4, 8 Nov 2026): with data-side="zh" the same shell is in Chinese (the English / 中文 switch from
   account.js still works: every label has both languages, class t-en / t-zh, and <html data-ui> shows one). Home, the
   Daily Circuit, My subjects and the Subjects menu are the Chinese version's (zh/; the list is ZH_SUBJECTS in subjects.js).
   Options on the script tag:
     data-side="zh|maths"  the side: zh = the Chinese version; maths = the maths points (default en)
     data-auto-side        a page both sides share (My progress, Maths, Log in): the Chinese shell when the student came from
                           the Chinese side (?from=zh, a link from a zh/ page, or Maths opened from the Chinese side in this tab).
                           (data-skip-zh, its old name, does the same.) */
(function(){
'use strict';
const me = document.currentScript;
const SRC = (me && me.src) || '';
const ROOT = SRC ? SRC.replace(/en\/engine\/shell\.js([?#].*)?$/, '') : location.origin + '/';
const PAGE = location.href.split('#')[0].split('?')[0].slice(ROOT.length).replace(/^\/+/, '');   // e.g. en/descriptive/index.html
const SUBJ = window.AEA_SUBJECTS;
if(!SUBJ || !document.body) return;

const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const read = k => { try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } };
const raw = k => { try{ return localStorage.getItem(k); }catch(e){ return null; } };
const norm = p => String(p||'').split('#')[0].split('?')[0].replace(/^\/+/, '').replace(/index\.html$/, '');

// Opened from the Chinese side? (My progress ?from=zh or from a zh/ page; Maths remembers its side for the tab)
function fromZh(){
  const from = new URLSearchParams(location.search).get('from') || '';
  let mathsFrom = null; try{ mathsFrom = sessionStorage.getItem('aea:maths:from'); }catch(e){}
  let ref = ''; try{ ref = document.referrer && new URL(document.referrer).pathname; }catch(e){}
  const rootPath = (()=>{ try{ return new URL(ROOT).pathname; }catch(e){ return '/'; } })();
  return from === 'zh' || /^\/?zh\//.test(from.replace(rootPath, '')) || mathsFrom === 'zh' || (!from && !!ref && ref.indexOf(rootPath + 'zh/') === 0);
}
// LANG: the side the shell is for (en or zh). POINTS: whose points it shows (en, zh or maths).
let POINTS = (me && me.getAttribute('data-side')) || 'en';
const AUTO = !!me && (me.hasAttribute('data-auto-side') || me.hasAttribute('data-skip-zh'));
const LANG = POINTS === 'zh' || (AUTO && fromZh()) ? 'zh' : 'en';
if(LANG === 'zh' && POINTS === 'en') POINTS = 'zh';
const ZH = LANG === 'zh';
const LIST = SUBJ.forSide ? SUBJ.forSide(LANG) : {SUBJECTS: SUBJ.SUBJECTS, ordered: SUBJ.ordered};
// The instructions' language on the Chinese side (the English / 中文 switch: account.js): Chinese until the student picks English
const uiLang = () => { try{ return localStorage.getItem('aea:ui-lang') === 'en' ? 'en' : 'zh'; }catch(e){ return 'zh'; } };
if(ZH && !document.documentElement.hasAttribute('data-ui')) document.documentElement.setAttribute('data-ui', uiLang());
// A label in both languages on the Chinese side (the CSS shows one); A() for attributes, which can only hold one
const L = (en, zh) => ZH ? `<span class="t-en">${en}</span><span class="t-zh" lang="zh-CN">${zh}</span>` : en;
const A = (en, zh) => ZH && uiLang() === 'zh' ? zh : en;
// A subject's or an area's name: the Chinese name on the Chinese side
const nameOf = x => ZH && x.zh ? L(esc(x.name), esc(x.zh)) : esc(x.name);

// ----- what the student has -----
const account = () => read('aea:account');
const loggedIn = () => { const a = account(); return !!(a && a.token); };
const guest = () => raw('aeaGuestPlay') === '1';
const enHome = () => ROOT + (account() || guest() ? 'en/index.html' : 'index.html');
const homeHref = () => ZH ? ROOT + 'zh/index.html' : enHome();
const ESS = LIST.SUBJECTS.find(s=>s.always);
function studying(){
  const on = ((read('aea:studying:v1') || {})[LANG]) || {};
  return LIST.ordered().filter(s=>!s.soon && (s.always || on[s.path] || on[norm(s.path)+'index.html']));
}
// Days in a row with at least one answer (the same count as My progress)
function streak(){
  const days = ((read('aea:progress:v1') || {}).days) || {}, key = x => x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');
  const d = new Date(); let n = 0;
  if(!days[key(d)]) d.setDate(d.getDate()-1);
  while(days[key(d)]){ n++; d.setDate(d.getDate()-1); }
  return n;
}
// The student's level in a subject, when it has been found (10 answers): its name
const LEVELS = ['', 'Foundation', 'Foundation+', 'Intermediate', 'Intermediate+', 'Advanced'], LEVELS_ZH = ['', '基础', '基础+', '中级', '中级+', '高级'];
// (HTML: on the Chinese side the name is in both languages)
function levelIn(path){
  const topics = ((read('aea:progress:v1') || {}).topics) || {}, want = norm(path);
  let best = null;
  Object.values(topics).forEach(t=>{ if(!t || (!ZH && t.side === 'zh')) return; const h = norm(String(t.href||'').replace(/^.*?\/(en|maths|zh)\//, '$1/'));
    if(h === want && (!best || (t.n||0) > (best.n||0))) best = t; });
  if(!best || best.n < 10) return '';
  const b = Math.max(1, Math.min(5, Math.floor(best.r)));
  return ZH ? L(LEVELS[b], LEVELS_ZH[b]) : LEVELS[b];
}
// The subject this page belongs to (a topic page, or a page inside it such as Close reading)
const here = LIST.SUBJECTS.find(s=>s.path && PAGE.indexOf(norm(s.path)) === 0 && norm(s.path) !== '');
const LANDING = PAGE === '' || PAGE === 'index.html';   // the landing page: its own list of every subject is #all
const activeNav = ['en/index.html', 'en/', '', 'index.html', 'zh/index.html', 'zh/'].indexOf(PAGE) >= 0 ? 'home'
  : PAGE.indexOf('en/circuit/') === 0 || PAGE.indexOf('zh/circuit/') === 0 ? 'circuit' : PAGE.indexOf('progress/') === 0 ? 'progress' : '';

// ----- the path at the top of a game page (Home / Descriptive language / Fill the gap), set by app.js -----
// Each step: {label, href, zh}: zh (optional) is the Chinese, shown on the Chinese side
let CRUMBS = null;
function crumbsHtml(){
  if(!CRUMBS) return '';
  const last = CRUMBS.length - 1, lab = c => c.zh && ZH ? L(esc(c.label), esc(c.zh)) : esc(c.label);
  return `<nav class="aea-crumbs" aria-label="${A('Breadcrumb', '路径')}"><ol>${CRUMBS.map((c, i)=> (i ? '<li class="aea-crumb-sep" aria-hidden="true">/</li>' : '') +
    (i < last && c.href ? `<li><a href="${esc(c.href)}">${lab(c)}</a></li>` : `<li aria-current="page"><span>${lab(c)}</span></li>`)).join('')}</ol></nav>`;
}
function setCrumbs(list){
  CRUMBS = Array.isArray(list) && list.length ? list.map(c=>({label: String(c.label||''), href: c.href||'', zh: c.zh ? String(c.zh) : ''})) : null;
  document.documentElement.classList.toggle('aea-crumbed', !!CRUMBS);
  const slot = document.querySelector('.aea-crumbs-slot'); if(!slot) return;   // not built yet: build() draws them
  slot.innerHTML = crumbsHtml();
  if(CRUMBS) setSubjects(false);
}

// ----- icons -----
const I = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  circuit: '<circle cx="12" cy="14" r="8"/><path d="M12 10v4l2.5 2.5"/><path d="M10 2h4"/><path d="M12 2v4"/>',
  progress: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
  ideas: '<path d="M12 3l1.8 4.6 4.7 1.9-4.7 1.9L12 16l-1.8-4.6-4.7-1.9 4.7-1.9z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  future: '<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2z"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0"/><path d="M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5"/>',
  who: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4a4 4 0 0 1 0 8"/><path d="M22 21a7 7 0 0 0-5-6.7"/>',
  teach: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
  idea: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z"/>',
  down: '<path d="m6 9 6 6 6-6"/>', right: '<path d="m9 6 6 6-6 6"/>', check: '<path d="m5 12 5 5 9-10"/>',
  menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>', close: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
  flame: '<path d="M12 22c4 0 7-2.7 7-7 0-4-3-6.5-4-10-2 2-3 4-3 6-1-1-2-2-2.5-4C7 9 5 11.5 5 15c0 4.3 3 7 7 7z"/>'
};
const icon = (k, size) => `<svg class="aea-i" width="${size||20}" height="${size||20}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${I[k]}</svg>`;
const logo = cls => `<img class="${cls} aea-logo-light" src="${ROOT}images/logo/logo-wide-navy.svg" alt="${A('Academic English App: home', 'Academic English App：首页')}" width="180" height="33"><img class="${cls} aea-logo-dark" src="${ROOT}images/logo/logo-wide-white.svg" alt="" aria-hidden="true" width="180" height="33">`;

// ----- the sidebar -----
const link = (href, label, ico, on) => `<li><a class="aea-nav${on?' on':''}" href="${esc(href)}"${on?' aria-current="page"':''}>${icon(ico)}<span>${label}</span></a></li>`;
const soon = (label, ico) => `<li><span class="aea-nav off" aria-disabled="true" title="${A('Coming soon', '即将推出')}">${ico ? icon(ico) : ''}<span>${label}</span><span class="aea-sr"> ${L('(coming soon)', '（即将推出）')}</span></span></li>`;
function sideHtml(){
  const a = account(), mine = studying();
  const cls = a && a.className ? esc(a.className) : L('Your class', '我的班级');
  const badge = (a && a.className ? String(a.className) : '?').replace(/\s+/g, '').slice(0, 3);
  const home = ROOT + (ZH ? 'zh' : 'en') + '/index.html';
  const en = `<a href="${esc(enHome())}"${ZH ? '' : ' aria-current="true"'} data-lang="en">English${ZH ? '' : ' ' + icon('check', 16)}</a>`;
  const zh = `<a href="${ROOT}zh/index.html"${ZH ? ' aria-current="true"' : ''} data-lang="zh"><span lang="zh-CN">中文版</span>${ZH ? icon('check', 16) : '<small>Chinese</small>'}</a>`;
  return `
  <div class="aea-brand"><a class="aea-brand-a" href="${esc(homeHref())}">${logo('aea-logo')}</a>
    <button type="button" class="aea-close" aria-label="${A('Close menu', '关闭菜单')}">${icon('close', 22)}</button></div>
  <div class="aea-me"><div class="pts" data-points-bar="${esc(POINTS)}"></div></div>
  <div class="aea-lang">
    <button type="button" class="aea-lang-btn" aria-expanded="false" aria-controls="aea-lang-list">${icon('globe', 18)}<span${ZH ? ' lang="zh-CN"' : ''}>${ZH ? '中文版' : 'English'}</span>${icon('down', 16)}<span class="aea-sr"> ${L('(language)', '（语言）')}</span></button>
    <ul class="aea-lang-list" id="aea-lang-list" hidden>
      <li>${ZH ? zh : en}</li>
      <li>${ZH ? en : zh}</li>
    </ul>
  </div>
  <nav class="aea-navs" aria-label="${A('Main', '主菜单')}">
    <ul class="aea-list aea-first">
      ${link(homeHref(), L('Home', '首页'), 'home', activeNav === 'home')}
      ${link(ROOT + (ZH ? 'zh' : 'en') + '/circuit/index.html', L('Daily Circuit', '每日挑战'), 'circuit', activeNav === 'circuit')}
      ${link(ROOT + 'progress/index.html?from=' + LANG, L('My progress', '我的进步'), 'progress', activeNav === 'progress')}
    </ul>
    <div class="aea-sec"><p class="aea-sec-h">${L('Your classes', '我的班级')}</p>
      <ul class="aea-list"><li><span class="aea-nav off" aria-disabled="true" title="${A('Coming soon', '即将推出')}"><span class="aea-badge" aria-hidden="true">${esc(badge)}</span><span>${cls}</span><span class="aea-sr"> ${L('(coming soon)', '（即将推出）')}</span></span></li></ul></div>
    <div class="aea-sec"><p class="aea-sec-h">${L('My subjects', '我的科目')}</p>
      <ul class="aea-list">${mine.map(s=>{ const on = here && here.path === s.path;
        return `<li><a class="aea-nav aea-subject${on?' on':''}" href="${esc(ROOT + s.path)}"${on?' aria-current="true"':''}><span class="aea-dot" aria-hidden="true"><i style="background:${SUBJ.areaOf(s.area).color}"></i></span><span>${nameOf(s)}</span></a></li>`; }).join('')}</ul>
      ${mine.length < 2 ? `<p class="aea-hint"><a href="${home}#more">${L('Choose your subjects', '选择你的科目')}</a></p>` : ''}</div>
    <div class="aea-sec"><p class="aea-sec-h">${L('Explore', '探索')}</p>
      <ul class="aea-list">${soon(L('Big Ideas', '大概念'), 'ideas')}${soon(L('The Future', '未来'), 'future')}</ul></div>
    <div class="aea-sec"><p class="aea-sec-h">${L('About', '关于')}</p>
      <ul class="aea-list">${soon(L('Who are we?', '我们是谁？'), 'who')}${link(ROOT + 'teacher/index.html', L('For teachers', '教师'), 'teach', false)}${link(home + '#suggest', L('Got an idea?', '有想法吗？'), 'idea', false)}</ul></div>
  </nav>`;
}

// ----- the Subjects menu -----
let menuArea = (here && here.area !== 'every' && here.area) || (SUBJ.AREAS.find(a=>a.key!=='every') || {}).key;
function menuHtml(){
  const areas = SUBJ.AREAS.filter(a=>a.key !== 'every' && LIST.SUBJECTS.some(s=>s.area === a.key));
  const list = LIST.SUBJECTS.filter(s=>s.area === menuArea), area = SUBJ.areaOf(menuArea);
  const lvl = ESS ? levelIn(ESS.path) : '';
  return `<div class="aea-menu-areas">
      ${ESS ? `<a class="aea-mi aea-mi-ess" href="${esc(ROOT + ESS.path)}"><span>${nameOf(ESS)}</span>${lvl ? `<span class="aea-lvl">${lvl}</span>` : ''}</a><div class="aea-menu-rule"></div>` : ''}
      <ul>${areas.map(a=>`<li><button type="button" class="aea-mi aea-area${a.key === menuArea ? ' on' : ''}" data-area="${esc(a.key)}" aria-pressed="${a.key === menuArea}"><span class="aea-dot" aria-hidden="true"><i style="background:${a.color}"></i></span><span>${nameOf(a)}</span>${icon('right', 16)}</button></li>`).join('')}</ul>
    </div>
    <div class="aea-menu-list">
      <p class="aea-menu-h" style="color:${area.color}">${nameOf(area)}</p>
      <ul>${list.map(s=>{ if(s.soon) return `<li><span class="aea-mi off">${nameOf(s)}<span class="aea-soon">${L('Coming soon', '即将推出')}</span></span></li>`;
        const l = levelIn(s.path); return `<li><a class="aea-mi" href="${esc(ROOT + s.path)}"><span>${nameOf(s)}</span>${l ? `<span class="aea-lvl">${l}</span>` : ''}</a></li>`; }).join('')}</ul>
      <a class="aea-menu-all" href="${LANDING ? '#all' : ROOT + (ZH ? 'zh' : 'en') + '/index.html#subjects'}">${L('All subjects', '所有科目')}</a>
    </div>`;
}

// ----- build it around the page -----
function build(){
  if(document.getElementById('aea-shell')) return;
  const html = document.documentElement;
  html.classList.add('aea-shelled'); if(ZH) html.classList.add('aea-zh');
  const shell = document.createElement('div'); shell.className = 'aea-shell'; shell.id = 'aea-shell';
  shell.innerHTML = `<a class="aea-skip" href="#aea-content">${L('Skip to content', '跳到正文')}</a>
    <aside class="aea-side" id="aea-side" aria-label="${A('Site menu', '网站菜单')}">${sideHtml()}</aside>
    <div class="aea-scrim" data-close></div>
    <div class="aea-main">
      <header class="aea-top">
        <button type="button" class="aea-menu-btn" aria-label="${A('Open menu', '打开菜单')}" aria-expanded="false" aria-controls="aea-side">${icon('menu', 24)}</button>
        <a class="aea-top-logo" href="${esc(homeHref())}">${logo('aea-logo-sm')}</a>
        <div class="aea-subj">
          <button type="button" class="aea-subj-btn" aria-expanded="false" aria-controls="aea-subj-menu">${L('Subjects', '科目')} ${icon('down', 16)}</button>
          <div class="aea-subj-menu" id="aea-subj-menu" hidden>${menuHtml()}</div>
        </div>
        <div class="aea-crumbs-slot">${crumbsHtml()}</div>
        <div class="aea-top-end">
          <span class="aea-streak" hidden>${icon('flame', 18)}${ZH ? '<i class="t-zh" lang="zh-CN">连续</i>' : ''}<b></b><i>days in a row</i></span>
          <div class="pts" data-points-bar="${esc(POINTS)}"></div>
        </div>
      </header>
      <div class="aea-content" id="aea-content" tabindex="-1"></div>
    </div>`;
  const content = shell.querySelector('.aea-content');
  // Everything the page has so far moves into the content area (scripts too: they have already run)
  Array.from(document.body.childNodes).forEach(n=>content.appendChild(n));
  document.body.insertBefore(shell, document.body.firstChild);
  wire(shell);
  if(window.AEA_POINTS) window.AEA_POINTS.render(POINTS, 0);
  drawStreak();
}

function drawStreak(){
  const el = document.querySelector('.aea-streak'); if(!el) return;
  const n = streak();
  el.hidden = !n;
  el.querySelector('b').textContent = n;
  el.querySelector('b + i').innerHTML = L(n === 1 ? 'day in a row' : 'days in a row', '天');
  el.title = A(n + (n === 1 ? ' day' : ' days') + ' in a row', '连续 ' + n + ' 天');
}
// Things that change while the page is open: the subjects switched on, a login, progress from another device
function redrawSide(){
  const side = document.getElementById('aea-side'); if(!side) return;
  const open = document.documentElement.classList.contains('aea-menu-open');
  side.innerHTML = sideHtml();
  wireSide(side);
  if(window.AEA_POINTS) window.AEA_POINTS.render(POINTS, 0);
  if(open) side.querySelector('.aea-close').focus({preventScroll: true});
}

// ----- behaviour -----
const phone = () => window.matchMedia('(max-width: 859.98px)').matches;
function setMenu(open, focusBack){
  const html = document.documentElement, btn = document.querySelector('.aea-menu-btn'), side = document.getElementById('aea-side');
  html.classList.toggle('aea-menu-open', open);
  if(btn) btn.setAttribute('aria-expanded', String(open));
  if(open){ const c = side && side.querySelector('.aea-close'); if(c) c.focus({preventScroll: true}); }
  else if(focusBack && btn) btn.focus({preventScroll: true});
}
function setSubjects(open, focusBack){
  const btn = document.querySelector('.aea-subj-btn'), menu = document.getElementById('aea-subj-menu'); if(!btn || !menu) return;
  menu.hidden = !open; btn.setAttribute('aria-expanded', String(open));
  if(open){ menu.innerHTML = menuHtml(); }
  else if(focusBack) btn.focus({preventScroll: true});
}
function setLang(open){
  const btn = document.querySelector('.aea-lang-btn'), list = document.getElementById('aea-lang-list'); if(!btn || !list) return;
  list.hidden = !open; btn.setAttribute('aria-expanded', String(open));
}
function wireSide(side){
  side.querySelector('.aea-close').onclick = () => setMenu(false, true);
  side.querySelector('.aea-lang-btn').onclick = e => { e.stopPropagation(); setLang(side.querySelector('.aea-lang-list').hidden); };
  side.querySelectorAll('[data-lang]').forEach(a=>a.addEventListener('click', ()=>{ try{ localStorage.setItem('aea:lang', JSON.stringify(a.dataset.lang)); }catch(err){} }));
}
function wire(shell){
  wireSide(shell.querySelector('#aea-side'));
  shell.querySelector('.aea-menu-btn').onclick = () => setMenu(!document.documentElement.classList.contains('aea-menu-open'));
  shell.querySelector('.aea-scrim').onclick = () => setMenu(false, true);
  const sb = shell.querySelector('.aea-subj-btn'), sm = shell.querySelector('#aea-subj-menu');
  sb.onclick = e => { e.stopPropagation(); setSubjects(sm.hidden); };
  sm.addEventListener('click', e=>{ if(e.target.closest('a[href]')){ setTimeout(()=>setSubjects(false), 0); return; }
    const b = e.target.closest('[data-area]'); if(b){ e.stopPropagation(); menuArea = b.dataset.area; sm.innerHTML = menuHtml(); const again = sm.querySelector(`[data-area="${menuArea}"]`); if(again) again.focus({preventScroll: true}); } });
  sm.addEventListener('mouseover', e=>{ const b = e.target.closest('[data-area]'); if(b && b.dataset.area !== menuArea && window.matchMedia('(hover: hover)').matches){ menuArea = b.dataset.area;
    sm.querySelectorAll('[data-area]').forEach(x=>{ const on = x.dataset.area === menuArea; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
    const tmp = document.createElement('div'); tmp.innerHTML = menuHtml(); sm.querySelector('.aea-menu-list').replaceWith(tmp.querySelector('.aea-menu-list')); } });
  // Click outside a menu or press Escape: it closes
  document.addEventListener('click', e=>{
    if(!sm.hidden && !e.target.closest('.aea-subj')) setSubjects(false);
    const ll = document.getElementById('aea-lang-list'); if(ll && !ll.hidden && !e.target.closest('.aea-lang')) setLang(false);
  });
  document.addEventListener('keydown', e=>{
    if(e.key !== 'Escape') return;
    if(!sm.hidden){ setSubjects(false, true); return; }
    const ll = document.getElementById('aea-lang-list'); if(ll && !ll.hidden){ setLang(false); document.querySelector('.aea-lang-btn').focus(); return; }
    if(document.documentElement.classList.contains('aea-menu-open')) setMenu(false, true);
  });
  // Leaving phone width with the menu open: close it
  window.addEventListener('resize', ()=>{ if(!phone() && document.documentElement.classList.contains('aea-menu-open')) setMenu(false); });
  // A link in the phone menu that only changes the hash (Got an idea? on the home page): close the menu
  shell.querySelector('#aea-side').addEventListener('click', e=>{ if(e.target.closest('a[href]') && phone()) setTimeout(()=>setMenu(false), 0); });
  window.addEventListener('storage', e=>{ if(['aea:studying:v1', 'aea:account', 'aea:progress:v1'].indexOf(e.key) >= 0){ redrawSide(); drawStreak(); } });
  window.addEventListener('aea:synced', ()=>{ redrawSide(); drawStreak(); });
  window.addEventListener('aea:studying', redrawSide);   // the home page's switches
  setInterval(drawStreak, 30000);
}

window.AEA_SHELL = {ROOT, redraw: redrawSide, streak, levelIn, studying, crumbs: setCrumbs, home: homeHref, side: LANG};
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
