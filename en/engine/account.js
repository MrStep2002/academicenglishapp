/* Student logins. Without a login nothing changes: progress stays in this browser, as before.
   With a login, everything the games save in this browser ("aea:…" in localStorage: progress, points, the Daily Circuit,
   subject switches, levels chosen, best scores) is also saved to the student's account on the server
   (api.academicenglishapp.com, see server/), so it follows them to any device. Nothing in the games had to change.
   - Saving: when a page opens, every 15 seconds if something changed, and when the page is left.
     The server combines its copy with this browser's, keeping the bigger record (server/merge.js), and sends back the result.
   - Logging in on a device that has progress saved without a login asks whether to add it to the account
     (no: it is put aside and comes back when the student logs out).
   - Logging out takes the student's progress off this device (it is safe on the server).
   - The login button (or the student's fun name) sits next to the points bar on every page that loads this file.
   Load it on every page, after points.js:  <script src="…/en/engine/account.js?v=…"></script>
   Testing with a server on your own computer: localStorage.setItem('aea:api', 'http://localhost:3000') */
(function(){
'use strict';
const SRC = (document.currentScript && document.currentScript.src) || '';
const ROOT = SRC ? SRC.replace(/en\/engine\/account\.js([?#].*)?$/, '') : location.origin + '/';
const ACCT = 'aea:account', GUEST = 'aea:guest:', EVERY = 15000;
const api = () => { let a = ''; try{ a = localStorage.getItem('aea:api') || ''; }catch(e){} return (a || 'https://api.academicenglishapp.com').replace(/\/+$/, ''); };
const isSynced = k => /^aea:/.test(k) && !/^aea:(account|guest:|api|sync)/.test(k);
const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const read = k => { try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } };

// ----- the account on this device: {name, className, token} (token null = logged out by the server: "Log in again") -----
const account = () => read(ACCT);
const setAccount = a => { try{ if(a) localStorage.setItem(ACCT, JSON.stringify(a)); else localStorage.removeItem(ACCT); }catch(e){} };
const allKeys = test => { const out=[]; try{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k && test(k)) out.push(k); } }catch(e){} return out; };
const snapshot = () => { const s={}; allKeys(isSynced).forEach(k=>{ s[k]=localStorage.getItem(k); }); return s; };
const clearSynced = () => allKeys(isSynced).forEach(k=>{ try{ localStorage.removeItem(k); }catch(e){} });
const clearSession = () => { try{ sessionStorage.removeItem('aea:points:session'); }catch(e){} };
// Progress saved on this device without a login: {points, words}, or null if there is none worth asking about
function guestProgress(){
  const p = read('aea:points:v1') || {}, pr = read('aea:progress:v1') || {};
  let points = 0, answers = 0;
  ['en','zh'].forEach(s=>{ const days=(p[s]&&p[s].days)||{}; Object.values(days).forEach(d=>{ points+=(d&&d.p)||0; answers+=((d&&d.r)||0)+((d&&d.w)||0); }); });
  const words = Object.values(pr.words||{}).filter(w=>w && w.s>=1).length;
  return (answers || words || Object.keys(pr.topics||{}).length) ? {points, words} : null;
}
const stashGuest = () => allKeys(isSynced).forEach(k=>{ try{ localStorage.setItem(GUEST+k, localStorage.getItem(k)); localStorage.removeItem(k); }catch(e){} });
const restoreGuest = () => allKeys(k=>k.indexOf(GUEST)===0).forEach(g=>{ try{ localStorage.setItem(g.slice(GUEST.length), localStorage.getItem(g)); localStorage.removeItem(g); }catch(e){} });

async function call(path, body, token){
  const ctl = window.AbortController ? new AbortController() : null, t = ctl && setTimeout(()=>ctl.abort(), 20000);
  let r;
  try{
    r = await fetch(api()+path, {method: body ? 'POST' : 'GET', signal: ctl && ctl.signal,
      headers: Object.assign({'Content-Type':'application/json'}, token ? {Authorization:'Bearer '+token} : {}),
      body: body ? JSON.stringify(body) : undefined});
  }catch(e){ throw new Error("Can't reach the server. Check your internet connection and try again. 无法连接服务器，请检查网络后再试。"); }
  finally{ if(t) clearTimeout(t); }
  let out = {}; try{ out = await r.json(); }catch(e){}
  if(!r.ok){ const err = new Error(out.error || ('Server error ' + r.status)); err.status = r.status; throw err; }
  return out;
}

// ----- saving to the account -----
let lastSent = '', busy = false, again = false, state = '';
async function sync(opts){
  const a = account(); if(!a || !a.token) return false;
  if(busy){ again = true; return false; }
  busy = true;
  const snap = snapshot(), body = JSON.stringify({data: snap});
  try{
    const r = await fetch(api()+'/api/sync', {method:'POST', keepalive: !!(opts && opts.keepalive) && body.length < 60000,
      headers:{'Content-Type':'application/json', Authorization:'Bearer '+a.token}, body});
    if(r.status === 401 || r.status === 403){ const b = account(); if(b && b.token === a.token){ b.token = null; setAccount(b); } setState('relogin'); return false; }
    if(!r.ok) throw new Error('sync ' + r.status);
    const data = ((await r.json()) || {}).data || {};
    let changed = false;
    Object.keys(data).forEach(k=>{
      if(!isSynced(k) || typeof data[k] !== 'string') return;
      // Only write what this page has not changed since it sent its copy (a game may have saved an answer meanwhile)
      const now = localStorage.getItem(k), sent = Object.prototype.hasOwnProperty.call(snap, k) ? snap[k] : null;
      if(now === sent && now !== data[k]){ try{ localStorage.setItem(k, data[k]); changed = true; }catch(e){} }
    });
    lastSent = JSON.stringify(snapshot());
    setState('ok');
    if(changed) refreshed();
    return true;
  }catch(e){ setState('offline'); return false; }
  finally{ busy = false; if(again){ again = false; setTimeout(sync, 500); } }
}
const changedSince = () => JSON.stringify(snapshot()) !== lastSent;

// Progress came in from another device. A page nobody has touched yet is reloaded so it shows the new numbers.
const opened = Date.now(); let touched = false;
['pointerdown','keydown'].forEach(ev=>addEventListener(ev, ()=>{ touched = true; }, {once:true, capture:true}));
function refreshed(){
  try{ window.dispatchEvent(new CustomEvent('aea:synced')); }catch(e){}
  const h = location.hash || '';
  if(touched || Date.now()-opened > 8000 || /^#(play|learn|circuit)/.test(h)) return;
  let last = 0; try{ last = +sessionStorage.getItem('aea:sync:reload') || 0; }catch(e){}
  if(Date.now()-last < 60000) return;
  try{ sessionStorage.setItem('aea:sync:reload', String(Date.now())); }catch(e){}
  location.reload();
}

// ----- logging in and out (used by login/index.html) -----
let pending = null;
// Returns {needsChoice, guest} when this device has progress saved without a login: then call finishLogin(add)
async function login(name, password){
  const res = await call('/api/login', {name, password});
  const prev = account();
  if(prev && prev.name !== res.name){ clearSynced(); clearSession(); }   // another student's copy (they were logged out by the server)
  pending = res;
  const guest = prev ? null : guestProgress();
  if(guest) return {needsChoice: true, guest, hasData: res.hasData, name: res.name};
  await finishLogin(true);
  return {name: res.name};
}
async function finishLogin(addGuest){
  const res = pending; if(!res) throw new Error('Please log in again.');
  pending = null;
  if(!addGuest) stashGuest();
  clearSession();
  setAccount({name: res.name, className: res.className, token: res.token});
  lastSent = '';
  await sync();
  render();
}
async function logout(){
  const a = account();
  if(a && a.token){ await sync(); try{ await call('/api/logout', {}, a.token); }catch(e){} }
  clearSynced(); clearSession(); restoreGuest(); setAccount(null); lastSent = '';
  render();
}

// ----- the button next to the points bar -----
function setState(s){ state = s; render(); }
function chip(side){
  const a = account(), zh = side === 'zh' || side === 'maths';   // maths pages have the language switch too (27 Oct)
  const from = encodeURIComponent(location.pathname + location.search + location.hash);
  const href = ROOT + 'login/index.html?from=' + from;
  if(!a) return `<a class="acct-chip" href="${href}">${zh ? '<span class="t-en">Log in</span><span class="t-zh" lang="zh">登录</span>' : 'Log in'}</a>`;
  if(!a.token) return `<a class="acct-chip warn" href="${href}">${zh ? '<span class="t-en">Log in again</span><span class="t-zh" lang="zh">重新登录</span>' : 'Log in again'}</a>`;
  // Logged in: the name opens My progress, which also has the Log out button
  const tip = (state === 'offline' ? 'Offline: your progress is saved on this device and goes to your account when you are back online.'
    : 'Logged in as ' + a.name + '. Your progress is saved to your account.') + ' Open My progress (log out there).';
  return `<a class="acct-chip on${state==='offline'?' off':''}" href="${ROOT}progress/index.html?from=${from}" title="${esc(tip)}"><span class="acct-dot" aria-hidden="true"></span><span class="acct-name">${esc(a.name)}</span></a>`;
}
// My progress page: who is logged in, with Log out (or a Log in button), under the page's heading
function panel(){
  const a = account(), from = encodeURIComponent(location.pathname + location.search);
  const login = ROOT + 'login/index.html?from=' + from;
  if(a && a.token) return `<div class="acct-panel"><div class="acct-txt"><p class="acct-k">Your account 你的账户</p>` +
    `<p class="acct-who"><b>${esc(a.name)}</b>${a.className ? ' · Class ' + esc(a.className) : ''}</p>` +
    `<p class="acct-note">Your progress is saved to your account, so you can carry on from any computer or phone. On a shared computer, log out when you finish. ` +
    `<span lang="zh">进度保存在你的账户里。在公用电脑上，结束后请退出。</span></p></div>` +
    `<button class="acct-btn" type="button" data-acct-out>Log out 退出</button></div>`;
  if(a) return `<div class="acct-panel"><div class="acct-txt"><p class="acct-k">Your account 你的账户</p><p class="acct-who"><b>${esc(a.name)}</b></p>` +
    `<p class="acct-note">Please log in again to keep saving your progress to your account. <span lang="zh">请重新登录。</span></p></div>` +
    `<a class="acct-btn" href="${login}">Log in again 重新登录</a></div>`;
  return `<div class="acct-panel"><div class="acct-txt"><p class="acct-k">Your account 你的账户</p>` +
    `<p class="acct-note">You are not logged in, so your progress is saved on this device only. Log in with the name and password from your teacher to carry on from any device. ` +
    `<span lang="zh">登录后，在任何设备上都可以继续。</span></p></div><a class="acct-btn" href="${login}">Log in 登录</a></div>`;
}
function style(){
  if(document.getElementById('acct-style')) return;
  const st = document.createElement('style'); st.id = 'acct-style';
  st.textContent =
    '.acct-wrap{display:inline-flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:flex-end;max-width:100%}' +
    '.ui-sw{display:inline-flex;align-items:stretch;border:1.5px solid currentColor;border-radius:99px;overflow:hidden;opacity:.85;flex:none}' +
    '.ui-sw button{font:inherit;font-size:12.5px;font-weight:700;line-height:1;padding:5px 10px;margin:0;border:0;background:none;color:inherit;cursor:pointer;opacity:.6}' +
    '.ui-sw button[lang="zh"]{font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif;font-weight:600}' +
    '.ui-sw button[aria-pressed="true"]{background:rgba(127,127,127,.2);opacity:1}' +
    '.ui-sw button:focus-visible{outline:2px solid currentColor;outline-offset:-3px}' +
    '.acct-chip{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;line-height:1;padding:6px 10px;border-radius:99px;' +
      'border:1.5px solid currentColor;color:inherit;text-decoration:none;opacity:.85;white-space:nowrap;max-width:14em}' +
    '.acct-chip:hover{opacity:1}.acct-chip:focus-visible{outline:2px solid currentColor;outline-offset:2px}' +
    '.acct-chip.on{border-color:transparent;background:rgba(127,127,127,.14)}' +
    '.acct-chip.warn{color:#c0392b}@media (prefers-color-scheme:dark){.acct-chip.warn{color:#ff8a78}}' +
    '.acct-name{overflow:hidden;text-overflow:ellipsis}' +
    '.acct-dot{width:8px;height:8px;border-radius:50%;background:#23a05c;flex:none}.acct-chip.off .acct-dot{background:#9aa0b4}' +
    '.topline>.acct-chip{margin-left:auto}' +
    '.acct-panel{display:flex;align-items:center;justify-content:space-between;gap:12px 20px;flex-wrap:wrap;margin:0 0 22px;padding:14px 16px;' +
      'border:1px solid var(--rule,#dfe2ec);border-radius:12px;background:var(--sheet,#fff)}' +
    '.acct-txt{min-width:0;flex:1 1 320px}.acct-panel p{margin:0}' +
    '.acct-k{font-family:var(--f-mono,monospace);font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-2,#4a5270)}' +
    '.acct-who{font-size:18px;margin:2px 0 4px !important}.acct-note{font-size:14px;color:var(--ink-2,#4a5270)}' +
    '.acct-btn{font:inherit;font-weight:700;font-size:15px;padding:9px 16px;border-radius:10px;border:1.5px solid currentColor;background:transparent;color:inherit;cursor:pointer;text-decoration:none;white-space:nowrap}' +
    '.acct-btn:hover{background:rgba(127,127,127,.12)}.acct-btn:disabled{opacity:.5;cursor:default}' +
    '@media print{.acct-chip,.acct-wrap>.acct-chip{display:none}}';
  document.head.appendChild(st);
}
// Put the button next to every points bar (game pages redraw theirs, so keep watching), or at the top right on pages without one
function render(){
  if(!document.body) return;
  const bars = document.querySelectorAll('[data-points-bar]');
  Array.prototype.forEach.call(bars, bar=>{
    let wrap = bar.parentNode;
    if(!wrap.classList || !wrap.classList.contains('acct-wrap')){
      wrap = document.createElement('span'); wrap.className = 'acct-wrap';
      bar.parentNode.insertBefore(wrap, bar); wrap.appendChild(bar);
    }
    const side = bar.getAttribute('data-points-bar') || 'en', html = chip(side);
    put(wrap, html);
    if(side === 'zh' || side === 'maths') uiSwitch(wrap);
  });
  if(!bars.length){
    const top = document.querySelector('.topline');
    if(top){ const side = /^zh/.test((location.pathname.slice(new URL(ROOT, location.href).pathname.length))) ? 'zh' : 'en'; put(top, chip(side)); }
  }
  // My progress page: the account panel under the heading
  const hero = document.querySelector('#app[data-only="progress"] .hero');
  if(hero){
    const html = panel(); let p = hero.nextElementSibling;
    if(!p || !p.classList.contains('acct-panel') || p._html !== html){
      const t = document.createElement('div'); t.innerHTML = html; const n = t.firstChild; n._html = html;
      if(p && p.classList.contains('acct-panel')) p.replaceWith(n); else hero.after(n);
      const out = n.querySelector('[data-acct-out]');
      if(out) out.onclick = () => { out.disabled = true; logout().then(()=>location.reload(), ()=>location.reload()); };
    }
  }
}
// ----- Chinese side: the English / 中文 switch (26 Oct). Instructions show in one language at a time: the pages put each
// language in its own span (class t-en / t-zh) and the CSS hides the one not chosen, using <html data-ui="en|zh">.
// The choice is kept in aea:ui-lang (so it is saved to the account too); Chinese until the student picks English.
// A page can choose its own starting language: <html data-ui-default="en"> (the maths pages: English until the student picks 中文).
// Each Chinese page also sets data-ui in its <head>, so the page never shows both languages while it loads.
const UI = 'aea:ui-lang';
const uiDefault = () => document.documentElement.getAttribute('data-ui-default') === 'en' ? 'en' : 'zh';
const uiGet = () => { try{ const v=localStorage.getItem(UI); return v === 'en' || v === 'zh' ? v : uiDefault(); }catch(e){ return uiDefault(); } };
function uiApply(l){
  document.documentElement.setAttribute('data-ui', l);
  document.querySelectorAll('.ui-sw button').forEach(b=>b.setAttribute('aria-pressed', b.dataset.l === l ? 'true' : 'false'));
}
function uiSwitch(box){
  let sw = box.querySelector(':scope > .ui-sw');
  if(!sw){
    sw = document.createElement('span'); sw.className = 'ui-sw'; sw.setAttribute('role', 'group'); sw.setAttribute('aria-label', 'Instructions in English or Chinese 说明语言');
    sw.innerHTML = '<button type="button" data-l="en" lang="en" aria-pressed="false">EN</button><button type="button" data-l="zh" lang="zh" aria-pressed="false">中文</button>';
    sw.addEventListener('click', e=>{ const b = e.target.closest('button'); if(!b) return;
      try{ localStorage.setItem(UI, b.dataset.l); }catch(err){} uiApply(b.dataset.l); });
    box.insertBefore(sw, box.firstChild);
  }
  const l = uiGet(), on = sw.querySelector(`[data-l="${l}"]`);
  if(on.getAttribute('aria-pressed') !== 'true' || document.documentElement.getAttribute('data-ui') !== l) uiApply(l);
}
// Add or update the button inside box (only when it has changed, so watching the page doesn't loop)
function put(box, html){
  const c = box.querySelector(':scope > .acct-chip');
  if(c && c._html === html) return;
  const t = document.createElement('span'); t.innerHTML = html; const n = t.firstChild; n._html = html;
  if(c) c.replaceWith(n); else box.appendChild(n);
}
let queued = false;
const watch = () => {
  style(); render();
  new MutationObserver(()=>{ if(queued) return; queued = true; requestAnimationFrame(()=>{ queued = false; render(); }); })
    .observe(document.body, {childList: true, subtree: true});
};
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();

// ----- start: save now, then every 15 seconds if anything changed, and when the page is left -----
if((account() || {}).token) sync();
setInterval(()=>{ if((account() || {}).token && changedSince()) sync(); }, EVERY);
const leaving = () => { if((account() || {}).token && changedSince()) sync({keepalive: true}); };
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'hidden') leaving(); });
addEventListener('pagehide', leaving);
// Another tab logged in or out: show it here too
addEventListener('storage', e=>{ if(e.key === ACCT) render(); if(e.key === UI && document.querySelector('.ui-sw')) uiApply(uiGet()); });

// A call to the server as the logged-in student (class games use it: en/engine/classgame.js and app.js). A logged-out
// login (401) is remembered here, so the button says "Log in again".
async function request(path, body){
  const a = account(); if(!a || !a.token){ const e = new Error('Please log in. 请先登录。'); e.status = 401; throw e; }
  try{ return await call(path, body || null, a.token); }
  catch(e){ if(e.status === 401){ const b = account(); if(b && b.token === a.token){ b.token = null; setAccount(b); } setState('relogin'); } throw e; }
}
// The same, for the last message as the page closes (fetch with keepalive, so it still goes)
function beacon(path, body){
  const a = account(); if(!a || !a.token) return;
  try{ fetch(api()+path, {method:'POST', keepalive:true, headers:{'Content-Type':'application/json', Authorization:'Bearer '+a.token}, body:JSON.stringify(body)}).catch(()=>{}); }catch(e){}
}

window.AEA_ACCOUNT = {account, login, finishLogin, logout, sync, guestProgress, api, ROOT, request, beacon};
})();
