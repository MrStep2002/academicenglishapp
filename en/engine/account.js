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
  const a = account(), zh = side === 'zh';
  const from = encodeURIComponent(location.pathname + location.search + location.hash);
  const href = ROOT + 'login/index.html?from=' + from;
  if(!a) return `<a class="acct-chip" href="${href}">${zh ? 'Log in 登录' : 'Log in'}</a>`;
  if(!a.token) return `<a class="acct-chip warn" href="${href}">${zh ? 'Log in again 重新登录' : 'Log in again'}</a>`;
  const tip = state === 'offline' ? 'Offline: your progress is saved on this device and goes to your account when you are back online.'
    : 'Logged in as ' + a.name + '. Your progress is saved to your account.';
  return `<a class="acct-chip on${state==='offline'?' off':''}" href="${href}" title="${esc(tip)}"><span class="acct-dot" aria-hidden="true"></span><span class="acct-name">${esc(a.name)}</span></a>`;
}
function style(){
  if(document.getElementById('acct-style')) return;
  const st = document.createElement('style'); st.id = 'acct-style';
  st.textContent =
    '.acct-wrap{display:inline-flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:flex-end;max-width:100%}' +
    '.acct-chip{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;line-height:1;padding:6px 10px;border-radius:99px;' +
      'border:1.5px solid currentColor;color:inherit;text-decoration:none;opacity:.85;white-space:nowrap;max-width:14em}' +
    '.acct-chip:hover{opacity:1}.acct-chip:focus-visible{outline:2px solid currentColor;outline-offset:2px}' +
    '.acct-chip.on{border-color:transparent;background:rgba(127,127,127,.14)}' +
    '.acct-chip.warn{color:#c0392b}@media (prefers-color-scheme:dark){.acct-chip.warn{color:#ff8a78}}' +
    '.acct-name{overflow:hidden;text-overflow:ellipsis}' +
    '.acct-dot{width:8px;height:8px;border-radius:50%;background:#23a05c;flex:none}.acct-chip.off .acct-dot{background:#9aa0b4}' +
    '.topline>.acct-chip{margin-left:auto}' +
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
  });
  if(!bars.length){
    const top = document.querySelector('.topline'); if(!top) return;
    const side = /^zh/.test((location.pathname.slice(new URL(ROOT, location.href).pathname.length))) ? 'zh' : 'en', html = chip(side);
    put(top, html);
  }
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
addEventListener('storage', e=>{ if(e.key === ACCT) render(); });

window.AEA_ACCOUNT = {account, login, finishLogin, logout, sync, guestProgress, api, ROOT};
})();
