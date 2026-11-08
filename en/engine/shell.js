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
   Options on the script tag:
     data-side="maths"   the points shown (default en)
     data-skip-zh        no shell when the page was opened from the Chinese side (My progress, Maths): stage 4 does those */
(function(){
'use strict';
const me = document.currentScript;
const SRC = (me && me.src) || '';
const ROOT = SRC ? SRC.replace(/en\/engine\/shell\.js([?#].*)?$/, '') : location.origin + '/';
const SIDE = (me && me.getAttribute('data-side')) || 'en';
const PAGE = location.href.split('#')[0].split('?')[0].slice(ROOT.length).replace(/^\/+/, '');   // e.g. en/descriptive/index.html
const SUBJ = window.AEA_SUBJECTS;
if(!SUBJ || !document.body) return;

const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const read = k => { try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } };
const raw = k => { try{ return localStorage.getItem(k); }catch(e){ return null; } };
const norm = p => String(p||'').split('#')[0].split('?')[0].replace(/^\/+/, '').replace(/index\.html$/, '');

// Opened from the Chinese side? (My progress ?from=zh or from a zh/ page; Maths remembers its side for the tab)
if(me && me.hasAttribute('data-skip-zh')){
  const from = new URLSearchParams(location.search).get('from') || '';
  let mathsFrom = null; try{ mathsFrom = sessionStorage.getItem('aea:maths:from'); }catch(e){}
  let ref = ''; try{ ref = document.referrer && new URL(document.referrer).pathname; }catch(e){}
  const rootPath = (()=>{ try{ return new URL(ROOT).pathname; }catch(e){ return '/'; } })();
  if(from === 'zh' || /^\/?zh\//.test(from.replace(rootPath, '')) || mathsFrom === 'zh' || (!from && ref && ref.indexOf(rootPath + 'zh/') === 0)) return;
}

// ----- what the student has -----
const account = () => read('aea:account');
const loggedIn = () => { const a = account(); return !!(a && a.token); };
const guest = () => raw('aeaGuestPlay') === '1';
const homeHref = () => ROOT + (account() || guest() ? 'en/index.html' : 'index.html');
const ESS = SUBJ.SUBJECTS.find(s=>s.always);
function studying(){
  const on = ((read('aea:studying:v1') || {})[SIDE === 'maths' ? 'en' : SIDE]) || {};
  return SUBJ.ordered().filter(s=>!s.soon && (s.always || on[s.path] || on[norm(s.path)+'index.html']));
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
const LEVELS = ['', 'Foundation', 'Foundation+', 'Intermediate', 'Intermediate+', 'Advanced'];
function levelIn(path){
  const topics = ((read('aea:progress:v1') || {}).topics) || {}, want = norm(path);
  let best = null;
  Object.values(topics).forEach(t=>{ if(!t || t.side === 'zh') return; const h = norm(String(t.href||'').replace(/^.*?\/(en|maths|zh)\//, '$1/'));
    if(h === want && (!best || (t.n||0) > (best.n||0))) best = t; });
  return best && best.n >= 10 ? LEVELS[Math.max(1, Math.min(5, Math.floor(best.r)))] : '';
}
// The subject this page belongs to (a topic page, or a page inside it such as Close reading)
const here = SUBJ.SUBJECTS.find(s=>s.path && PAGE.indexOf(norm(s.path)) === 0 && norm(s.path) !== '');
const LANDING = PAGE === '' || PAGE === 'index.html';   // the landing page: its own list of every subject is #all
const activeNav = PAGE === 'en/index.html' || PAGE === 'en/' || PAGE === '' || PAGE === 'index.html' ? 'home'
  : PAGE.indexOf('en/circuit/') === 0 ? 'circuit' : PAGE.indexOf('progress/') === 0 ? 'progress' : '';

// ----- the path at the top of a game page (Home / Descriptive language / Fill the gap), set by app.js -----
let CRUMBS = null;
function crumbsHtml(){
  if(!CRUMBS) return '';
  const last = CRUMBS.length - 1;
  return `<nav class="aea-crumbs" aria-label="Breadcrumb"><ol>${CRUMBS.map((c, i)=> (i ? '<li class="aea-crumb-sep" aria-hidden="true">/</li>' : '') +
    (i < last && c.href ? `<li><a href="${esc(c.href)}">${esc(c.label)}</a></li>` : `<li aria-current="page"><span>${esc(c.label)}</span></li>`)).join('')}</ol></nav>`;
}
function setCrumbs(list){
  CRUMBS = Array.isArray(list) && list.length ? list.map(c=>({label: String(c.label||''), href: c.href||''})) : null;
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
const logo = cls => `<img class="${cls} aea-logo-light" src="${ROOT}images/logo/logo-wide-navy.svg" alt="Academic English App: home" width="180" height="33"><img class="${cls} aea-logo-dark" src="${ROOT}images/logo/logo-wide-white.svg" alt="" aria-hidden="true" width="180" height="33">`;

// ----- the sidebar -----
const link = (href, label, ico, on) => `<li><a class="aea-nav${on?' on':''}" href="${esc(href)}"${on?' aria-current="page"':''}>${icon(ico)}<span>${label}</span></a></li>`;
const soon = (label, ico) => `<li><span class="aea-nav off" aria-disabled="true" title="Coming soon">${ico ? icon(ico) : ''}<span>${label}</span><span class="aea-sr"> (coming soon)</span></span></li>`;
function sideHtml(){
  const a = account(), mine = studying();
  const cls = a && a.className ? esc(a.className) : 'Your class';
  const badge = (a && a.className ? String(a.className) : '?').replace(/\s+/g, '').slice(0, 3);
  return `
  <div class="aea-brand"><a class="aea-brand-a" href="${esc(homeHref())}">${logo('aea-logo')}</a>
    <button type="button" class="aea-close" aria-label="Close menu">${icon('close', 22)}</button></div>
  <div class="aea-me"><div class="pts" data-points-bar="${esc(SIDE)}"></div></div>
  <div class="aea-lang">
    <button type="button" class="aea-lang-btn" aria-expanded="false" aria-controls="aea-lang-list">${icon('globe', 18)}<span>English</span>${icon('down', 16)}<span class="aea-sr"> (language)</span></button>
    <ul class="aea-lang-list" id="aea-lang-list" hidden>
      <li><a href="${esc(homeHref())}" aria-current="true" data-lang="en">English ${icon('check', 16)}</a></li>
      <li><a href="${ROOT}zh/index.html" data-lang="zh"><span lang="zh-CN">中文版</span><small>Chinese</small></a></li>
    </ul>
  </div>
  <nav class="aea-navs" aria-label="Main">
    <ul class="aea-list aea-first">
      ${link(homeHref(), 'Home', 'home', activeNav === 'home')}
      ${link(ROOT + 'en/circuit/index.html', 'Daily Circuit', 'circuit', activeNav === 'circuit')}
      ${link(ROOT + 'progress/index.html?from=en', 'My progress', 'progress', activeNav === 'progress')}
    </ul>
    <div class="aea-sec"><p class="aea-sec-h">Your classes</p>
      <ul class="aea-list"><li><span class="aea-nav off" aria-disabled="true" title="Coming soon"><span class="aea-badge" aria-hidden="true">${esc(badge)}</span><span>${cls}</span><span class="aea-sr"> (coming soon)</span></span></li></ul></div>
    <div class="aea-sec"><p class="aea-sec-h">My subjects</p>
      <ul class="aea-list">${mine.map(s=>{ const on = here && here.path === s.path;
        return `<li><a class="aea-nav aea-subject${on?' on':''}" href="${esc(ROOT + s.path)}"${on?' aria-current="true"':''}><span class="aea-dot" aria-hidden="true"><i style="background:${SUBJ.areaOf(s.area).color}"></i></span><span>${esc(s.name)}</span></a></li>`; }).join('')}</ul>
      ${mine.length < 2 ? `<p class="aea-hint"><a href="${ROOT}en/index.html#more">Choose your subjects</a></p>` : ''}</div>
    <div class="aea-sec"><p class="aea-sec-h">Explore</p>
      <ul class="aea-list">${soon('Big Ideas', 'ideas')}${soon('The Future', 'future')}</ul></div>
    <div class="aea-sec"><p class="aea-sec-h">About</p>
      <ul class="aea-list">${soon('Who are we?', 'who')}${link(ROOT + 'teacher/index.html', 'For teachers', 'teach', false)}${link(ROOT + 'en/index.html#suggest', 'Got an idea?', 'idea', false)}</ul></div>
  </nav>`;
}

// ----- the Subjects menu -----
let menuArea = (here && here.area !== 'every' && here.area) || (SUBJ.AREAS.find(a=>a.key!=='every') || {}).key;
function menuHtml(){
  const areas = SUBJ.AREAS.filter(a=>a.key !== 'every' && SUBJ.SUBJECTS.some(s=>s.area === a.key));
  const list = SUBJ.SUBJECTS.filter(s=>s.area === menuArea), area = SUBJ.areaOf(menuArea);
  const lvl = ESS ? levelIn(ESS.path) : '';
  return `<div class="aea-menu-areas">
      ${ESS ? `<a class="aea-mi aea-mi-ess" href="${esc(ROOT + ESS.path)}"><span>${esc(ESS.name)}</span>${lvl ? `<span class="aea-lvl">${esc(lvl)}</span>` : ''}</a><div class="aea-menu-rule"></div>` : ''}
      <ul>${areas.map(a=>`<li><button type="button" class="aea-mi aea-area${a.key === menuArea ? ' on' : ''}" data-area="${esc(a.key)}" aria-pressed="${a.key === menuArea}"><span class="aea-dot" aria-hidden="true"><i style="background:${a.color}"></i></span><span>${esc(a.name)}</span>${icon('right', 16)}</button></li>`).join('')}</ul>
    </div>
    <div class="aea-menu-list">
      <p class="aea-menu-h" style="color:${area.color}">${esc(area.name)}</p>
      <ul>${list.map(s=>{ if(s.soon) return `<li><span class="aea-mi off">${esc(s.name)}<span class="aea-soon">Coming soon</span></span></li>`;
        const l = levelIn(s.path); return `<li><a class="aea-mi" href="${esc(ROOT + s.path)}"><span>${esc(s.name)}</span>${l ? `<span class="aea-lvl">${esc(l)}</span>` : ''}</a></li>`; }).join('')}</ul>
      <a class="aea-menu-all" href="${LANDING ? '#all' : ROOT + 'en/index.html#subjects'}">All subjects</a>
    </div>`;
}

// ----- build it around the page -----
function build(){
  if(document.getElementById('aea-shell')) return;
  const html = document.documentElement;
  html.classList.add('aea-shelled');
  const shell = document.createElement('div'); shell.className = 'aea-shell'; shell.id = 'aea-shell';
  shell.innerHTML = `<a class="aea-skip" href="#aea-content">Skip to content</a>
    <aside class="aea-side" id="aea-side" aria-label="Site menu">${sideHtml()}</aside>
    <div class="aea-scrim" data-close></div>
    <div class="aea-main">
      <header class="aea-top">
        <button type="button" class="aea-menu-btn" aria-label="Open menu" aria-expanded="false" aria-controls="aea-side">${icon('menu', 24)}</button>
        <a class="aea-top-logo" href="${esc(homeHref())}">${logo('aea-logo-sm')}</a>
        <div class="aea-subj">
          <button type="button" class="aea-subj-btn" aria-expanded="false" aria-controls="aea-subj-menu">Subjects ${icon('down', 16)}</button>
          <div class="aea-subj-menu" id="aea-subj-menu" hidden>${menuHtml()}</div>
        </div>
        <div class="aea-crumbs-slot">${crumbsHtml()}</div>
        <div class="aea-top-end">
          <span class="aea-streak" hidden>${icon('flame', 18)}<b></b><i>days in a row</i></span>
          <div class="pts" data-points-bar="${esc(SIDE)}"></div>
        </div>
      </header>
      <div class="aea-content" id="aea-content" tabindex="-1"></div>
    </div>`;
  const content = shell.querySelector('.aea-content');
  // Everything the page has so far moves into the content area (scripts too: they have already run)
  Array.from(document.body.childNodes).forEach(n=>content.appendChild(n));
  document.body.insertBefore(shell, document.body.firstChild);
  wire(shell);
  if(window.AEA_POINTS) window.AEA_POINTS.render(SIDE, 0);
  drawStreak();
}

function drawStreak(){
  const el = document.querySelector('.aea-streak'); if(!el) return;
  const n = streak();
  el.hidden = !n;
  el.querySelector('b').textContent = n;
  el.querySelector('i').textContent = n === 1 ? 'day in a row' : 'days in a row';
  el.title = n + (n === 1 ? ' day' : ' days') + ' in a row';
}
// Things that change while the page is open: the subjects switched on, a login, progress from another device
function redrawSide(){
  const side = document.getElementById('aea-side'); if(!side) return;
  const open = document.documentElement.classList.contains('aea-menu-open');
  side.innerHTML = sideHtml();
  wireSide(side);
  if(window.AEA_POINTS) window.AEA_POINTS.render(SIDE, 0);
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

window.AEA_SHELL = {ROOT, redraw: redrawSide, streak, levelIn, studying, crumbs: setCrumbs, home: homeHref};
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
