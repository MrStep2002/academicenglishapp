/* THE SITE SHELL (redesign stage 1, 8 Nov 2026): the sidebar and the top bar around every English page.
   It wraps whatever the page already has (the games, My progress, the Daily Circuit page…) and adds:
   - the sidebar: the logo, the language menu (English / 中文版), Subjects, Daily Circuit, My progress, Big Ideas (greyed
     until it exists), Staff Room (the teacher page), then My subjects (Essentials + the subjects ticked), About (Who are we?:
     greyed; Got an idea?). (9 Nov 2026, teacher: Big Ideas and Staff Room moved up; the Explore heading and The Future gone;
     For teachers renamed Staff Room.)
   - Subjects (11 Nov 2026, teacher: in place of Home, "people know to click on the mouse to go home"): a panel that pops out
     beside the sidebar with every subject there is, in its area, each with a tick box: the subjects ticked are the student's
     subjects (My subjects, the home page) and the ones the Daily Circuit uses (aea:studying:v1, as before). Academic
     Essentials and Reading are always ticked (greyed); no grey notes under the names (teacher, 11 Nov 2026). Any element with
     data-open-subjects opens it (the home page, the Daily Circuit page). My classes and the Subjects menu that was in the
     top bar are gone (11 Nov 2026), and the sidebar is tighter.
   - the top bar: the path on game pages (crumbs), then the days in a row, the points (points.js draws them) and the Log in
     button or the student's name (account.js puts it next to the points)
   - on phones (under 860px) the sidebar becomes a menu that slides in from the left (the ☰ button)
   The page's own points bar, Log in button and mouse logo are hidden (the shell shows them instead); its back link stays.
   Game pages (stage 2, 8 Nov 2026): the game engine (app.js) calls AEA_SHELL.crumbs([{label, href}, …]) and the top bar
   shows that path (Home / Descriptive language / Fill the gap); crumbs(null) takes it away.
   Load it on every English page after points.js, account.js and subjects.js, with css/site.css in the <head>:
     <script src="…/en/engine/subjects.js?v=…"></script><script src="…/en/engine/shell.js?v=…"></script>
   THE CHINESE VERSION (stage 4, 8 Nov 2026): with data-side="zh" the same shell is in Chinese (the English / 中文 switch from
   account.js still works: every label has both languages, class t-en / t-zh, and <html data-ui> shows one). Home, the
   Daily Circuit, My subjects and the Subjects panel are the Chinese version's (zh/; the list is ZH_SUBJECTS in subjects.js).
   Options on the script tag:
     data-side="zh|maths"  the side: zh = the Chinese version; maths = the maths points (default en)
     data-auto-side        a page both sides share (My progress, Maths, Log in): the Chinese shell when the student came from
                           the Chinese side (?from=zh, a link from a zh/ page, or Maths opened from the Chinese side in this tab).
                           (data-skip-zh, its old name, does the same.)
     data-staff            the Staff Room (teacher/index.html, 9 Nov 2026): no points or days in a row; the page's element with
                           data-staff-top (the teacher's name, Change password, Log out) goes in the top bar instead, and on
                           phones the sidebar shows the teacher's name and Change password. The page sets the path in the top
                           bar (Staff Room / …) with crumbs(), so the way back to the Staff Room is always there. */
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
const STAFF = !!me && me.hasAttribute('data-staff');
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
const activeNav = ['en/index.html', 'en/', '', 'index.html', 'zh/index.html', 'zh/'].indexOf(PAGE) >= 0 ? 'home'
  : PAGE.indexOf('en/circuit/') === 0 || PAGE.indexOf('zh/circuit/') === 0 ? 'circuit' : PAGE.indexOf('progress/') === 0 ? 'progress'
  : PAGE.indexOf('teacher/') === 0 ? 'staff' : '';
// The teacher logged in to the Staff Room (teacher/index.html keeps it as aea:account:teacher)
const teacher = () => { const t = read('aea:account:teacher'); return t && t.token && t.until > Date.now() ? t : null; };

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
  subjects: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>',
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
  const mine = studying();
  const home = ROOT + (ZH ? 'zh' : 'en') + '/index.html';
  const en = `<a href="${esc(enHome())}"${ZH ? '' : ' aria-current="true"'} data-lang="en">English${ZH ? '' : ' ' + icon('check', 16)}</a>`;
  const zh = `<a href="${ROOT}zh/index.html"${ZH ? ' aria-current="true"' : ''} data-lang="zh"><span lang="zh-CN">中文版</span>${ZH ? icon('check', 16) : '<small>Chinese</small>'}</a>`;
  return `
  <div class="aea-brand"><a class="aea-brand-a" href="${esc(homeHref())}">${logo('aea-logo')}</a>
    <button type="button" class="aea-close" aria-label="${A('Close menu', '关闭菜单')}">${icon('close', 22)}</button></div>
  ${STAFF ? (teacher() ? `<div class="aea-me aea-staff-me"><b>${esc(teacher().name)}</b><a href="#/password">Change password</a></div>` : '')
    : `<div class="aea-me"><div class="pts" data-points-bar="${esc(POINTS)}"></div></div>`}
  <div class="aea-lang">
    <button type="button" class="aea-lang-btn" aria-expanded="false" aria-controls="aea-lang-list">${icon('globe', 18)}<span${ZH ? ' lang="zh-CN"' : ''}>${ZH ? '中文版' : 'English'}</span>${icon('down', 16)}<span class="aea-sr"> ${L('(language)', '（语言）')}</span></button>
    <ul class="aea-lang-list" id="aea-lang-list" hidden>
      <li>${ZH ? zh : en}</li>
      <li>${ZH ? en : zh}</li>
    </ul>
  </div>
  <nav class="aea-navs" aria-label="${A('Main', '主菜单')}">
    <ul class="aea-list aea-first">
      <li><button type="button" class="aea-nav aea-subjects-btn" data-open-subjects aria-haspopup="dialog" aria-expanded="${pickOpen}" aria-controls="aea-pick">${icon('subjects')}<span>${L('Subjects', '科目')}</span>${icon('right', 16)}</button></li>
      ${link(ROOT + (ZH ? 'zh' : 'en') + '/circuit/index.html', L('Daily Circuit', '每日挑战'), 'circuit', activeNav === 'circuit')}
      ${link(ROOT + 'progress/index.html?from=' + LANG, L('My progress', '我的进步'), 'progress', activeNav === 'progress')}
      ${soon(L('Big Ideas', '大概念'), 'ideas')}
      ${link(ROOT + 'teacher/index.html', L('Staff Room', '教师办公室'), 'teach', activeNav === 'staff')}
    </ul>
    <div class="aea-sec"><p class="aea-sec-h">${L('My subjects', '我的科目')}</p>
      <ul class="aea-list aea-mine">${mine.map(s=>{ const on = here && here.path === s.path;
        return `<li><a class="aea-nav aea-subject${on?' on':''}" href="${esc(ROOT + s.path)}"${on?' aria-current="true"':''}><span class="aea-dot" aria-hidden="true"><i style="background:${SUBJ.areaOf(s.area).color}"></i></span><span>${nameOf(s)}</span></a></li>`; }).join('')}</ul>
      ${!mine.some(s=>!s.always) ? `<p class="aea-hint"><button type="button" class="aea-linkbtn" data-open-subjects>${L('Choose your subjects', '选择你的科目')}</button></p>` : ''}</div>
    <div class="aea-sec"><p class="aea-sec-h">${L('About', '关于')}</p>
      <ul class="aea-list">${soon(L('Who are we?', '我们是谁？'), 'who')}${link(home + '#suggest', L('Got an idea?', '有想法吗？'), 'idea', false)}</ul></div>
  </nav>`;
}

// ----- the Subjects panel (11 Nov 2026): every subject, in its area, with a tick box -----
let pickOpen = false;
const isTicked = s => !!(((read('aea:studying:v1') || {})[LANG]) || {})[s.path];
function setTicked(s, on){
  let all = read('aea:studying:v1'); if(!all || typeof all !== 'object') all = {}; all[LANG] = all[LANG] || {};
  // (the Chinese side saves a subject with both its names, "Web design 网页设计", as the Daily Circuit always has)
  if(on) all[LANG][s.path] = ZH && s.zh ? s.name + ' ' + s.zh : s.name; else delete all[LANG][s.path];
  try{ localStorage.setItem('aea:studying:v1', JSON.stringify(all)); }catch(e){}
  try{ window.dispatchEvent(new CustomEvent('aea:studying')); }catch(e){}   // the sidebar, the home page
}
function pickHtml(){
  const areas = SUBJ.AREAS.filter(a=>LIST.SUBJECTS.some(s=>s.area === a.key && !s.soon));
  const row = s => { const id = 'aea-pk-' + norm(s.path).replace(/[^a-z0-9]+/gi, '-');
    return `<li class="aea-pick-row${s.always ? ' always' : ''}">
      <input type="checkbox" id="${id}" data-pick="${esc(s.path)}"${s.always || isTicked(s) ? ' checked' : ''}${s.always ? ' disabled' : ''}>
      <label for="${id}"><span class="nm">${nameOf(s)}</span>${s.always ? `<span class="aea-sr"> ${L('(everyone has this)', '（所有人都有）')}</span>` : ''}</label>
      <a class="aea-pick-go" href="${esc(ROOT + s.path)}" title="${esc(A('Open ' + s.name, '打开' + (s.zh || s.name)))}"><span class="aea-sr">${ZH ? L('Open ' + esc(s.name), '打开' + esc(s.zh || s.name)) : 'Open ' + esc(s.name)}</span>${icon('right', 18)}</a></li>`; };
  return `<div class="aea-pick-head"><h2 id="aea-pick-h">${L('Subjects', '科目')}</h2>
      <button type="button" class="aea-pick-x" data-pick-close aria-label="${A('Close', '关闭')}">${icon('close', 22)}</button></div>
    <p class="aea-pick-lead">${L('Tick the subjects you study. They go on your home page and into your Daily Circuit.', '勾选你在学的科目。它们会出现在你的首页和每日挑战中。')}</p>
    <div class="aea-pick-groups">${areas.map(a=>`<section class="aea-pick-g" aria-label="${esc(A(a.name, a.zh || a.name))}">
      <h3 style="color:${a.color}">${nameOf(a)}</h3>
      <ul>${LIST.SUBJECTS.filter(s=>s.area === a.key && !s.soon).map(row).join('')}</ul></section>`).join('')}</div>
    <div class="aea-pick-foot"><button type="button" class="aea-pick-done" data-pick-close>${L('Done', '完成')}</button></div>`;
}
// Beside the sidebar on a computer, level with the Subjects button; the whole screen on a phone (css/site.css)
function placePick(){
  const pk = document.getElementById('aea-pick'), b = document.querySelector('.aea-subjects-btn'); if(!pk || !b) return;
  const top = Math.max(8, Math.min(b.getBoundingClientRect().top - 10, window.innerHeight - 320));
  pk.style.setProperty('--pick-top', top + 'px');
}
function setPick(open, focusBack){
  const pk = document.getElementById('aea-pick'); if(!pk) return;
  pickOpen = open;
  if(open){ pk.innerHTML = pickHtml(); pk.hidden = false; placePick(); const f = pk.querySelector('input:not([disabled])') || pk.querySelector('.aea-pick-x'); if(f) f.focus({preventScroll: true}); }
  else pk.hidden = true;
  document.documentElement.classList.toggle('aea-pick-open', open);
  document.querySelectorAll('.aea-subjects-btn').forEach(b=>{ b.setAttribute('aria-expanded', String(open)); b.classList.toggle('on', open); });
  if(!open && focusBack){ const b = document.querySelector('.aea-subjects-btn'); if(b && b.offsetParent) b.focus({preventScroll: true}); }
}

// ----- build it around the page -----
function build(){
  if(document.getElementById('aea-shell')) return;
  const html = document.documentElement;
  html.classList.add('aea-shelled'); if(ZH) html.classList.add('aea-zh');
  const shell = document.createElement('div'); shell.className = 'aea-shell'; shell.id = 'aea-shell';
  shell.innerHTML = `<a class="aea-skip" href="#aea-content">${L('Skip to content', '跳到正文')}</a>
    <aside class="aea-side" id="aea-side" aria-label="${A('Site menu', '网站菜单')}">${sideHtml()}</aside>
    <div class="aea-pick" id="aea-pick" role="dialog" aria-labelledby="aea-pick-h" hidden></div>
    <div class="aea-scrim" data-close></div>
    <div class="aea-main">
      <header class="aea-top">
        <button type="button" class="aea-menu-btn" aria-label="${A('Open menu', '打开菜单')}" aria-expanded="false" aria-controls="aea-side">${icon('menu', 24)}</button>
        <a class="aea-top-logo" href="${esc(homeHref())}">${logo('aea-logo-sm')}</a>
        <div class="aea-crumbs-slot">${crumbsHtml()}</div>
        <div class="aea-top-end">${STAFF ? '<div class="aea-staff-slot"></div>' : `
          <span class="aea-streak" hidden>${icon('flame', 18)}${ZH ? '<i class="t-zh" lang="zh-CN">连续</i>' : ''}<b></b><i>days in a row</i></span>
          <div class="pts" data-points-bar="${esc(POINTS)}"></div>`}
        </div>
      </header>
      <div class="aea-content" id="aea-content" tabindex="-1"></div>
    </div>`;
  const content = shell.querySelector('.aea-content');
  // Everything the page has so far moves into the content area (scripts too: they have already run)
  Array.from(document.body.childNodes).forEach(n=>content.appendChild(n));
  document.body.insertBefore(shell, document.body.firstChild);
  if(STAFF){ html.classList.add('aea-staffed'); const top = content.querySelector('[data-staff-top]'); if(top) shell.querySelector('.aea-staff-slot').appendChild(top); }
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
  const pk = shell.querySelector('#aea-pick');
  // Subjects: the sidebar's button, or any element with data-open-subjects on the page (it toggles from the sidebar's button)
  document.addEventListener('click', e=>{
    const o = e.target.closest('[data-open-subjects]'); if(!o) return;
    e.preventDefault(); e.stopPropagation();
    setPick(o.classList.contains('aea-subjects-btn') ? !pickOpen : true);
  }, true);
  pk.addEventListener('change', e=>{ const c = e.target.closest('[data-pick]'); if(!c) return;
    const s = LIST.SUBJECTS.find(x=>x.path === c.dataset.pick); if(s && !s.always) setTicked(s, c.checked); });
  pk.addEventListener('click', e=>{ if(e.target.closest('[data-pick-close]')) setPick(false, true); });
  window.addEventListener('resize', ()=>{ if(pickOpen) placePick(); });
  // Click outside a menu or press Escape: it closes
  document.addEventListener('click', e=>{
    if(pickOpen && !e.target.closest('#aea-pick') && !e.target.closest('[data-open-subjects]')) setPick(false);
    const ll = document.getElementById('aea-lang-list'); if(ll && !ll.hidden && !e.target.closest('.aea-lang')) setLang(false);
  });
  document.addEventListener('keydown', e=>{
    if(e.key !== 'Escape') return;
    if(pickOpen){ setPick(false, true); return; }
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

window.AEA_SHELL = {ROOT, redraw: redrawSide, streak, levelIn, studying, crumbs: setCrumbs, home: homeHref, side: LANG,
  openSubjects: () => setPick(true)};
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
