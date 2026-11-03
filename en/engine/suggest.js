/* Suggestions box (3 Nov 2026). A student asked for one; the teacher chose: at the bottom of the topic lists, logged-in
   students only, and the teacher sees the student's fun name. 3 a day each (here and on the server).
   The home pages have an empty <section class="suggest" data-suggest data-side="en|zh"></section>; this file fills it:
   a short invitation and a button, then (on the same page) what the idea is about, the idea (up to 500 characters), Send.
   Not logged in: the button goes to the login page and comes back here. A browser logged in on the teacher page can send
   one too, to try it out (it shows as "You" on the teacher page). Sent to POST /api/suggest (server/server.js).
   The teacher reads them on the teacher page: Suggestions (#/suggestions).
   Load after account.js:  <script src="…/en/engine/suggest.js?v=…"></script> */
(function(){
'use strict';
const box = document.querySelector('[data-suggest]');
if(!box) return;
const ZH = box.getAttribute('data-side') === 'zh';
const MAX_A_DAY = 3, MAX_LEN = 500, LOG = 'aeaSuggest';   // not "aea:", so it isn't saved to the account
const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// Text in the page's language(s): the Chinese side has both, and its English / 中文 switch shows one (home.css)
const L = (en, zh) => ZH ? `<span class="t-en">${en}</span><span class="t-zh" lang="zh">${zh}</span>` : en;
const ACC = () => window.AEA_ACCOUNT;
const api = () => { try{ if(ACC() && ACC().api) return ACC().api(); }catch(e){} let a=''; try{ a=localStorage.getItem('aea:api')||''; }catch(e){} return (a||'https://api.academicenglishapp.com').replace(/\/+$/,''); };
const root = () => (ACC() && ACC().ROOT) || '../';
const teacher = () => { try{ const a=JSON.parse(localStorage.getItem('aea:account:teacher')); return a && a.token && a.until>Date.now() ? a : null; }catch(e){ return null; } };
// Who would send it: {who: 'Brave Panda', kind: 'student'|'teacher'}, {relogin: true}, or null (not logged in)
function sender(){
  let a = null; try{ a = ACC() && ACC().account(); }catch(e){}
  if(a && a.token) return {who: a.name, kind: 'student'};
  const t = teacher(); if(t) return {who: t.name || 'Teacher', kind: 'teacher'};
  return a ? {relogin: true, who: a.name} : null;
}
const today = () => { const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
const sentToday = who => { let r=null; try{ r=JSON.parse(localStorage.getItem(LOG)); }catch(e){} return r && r.day===today() && r.who===who ? r.n : 0; };
const setSent = (who, n) => { try{ localStorage.setItem(LOG, JSON.stringify({day: today(), who, n})); }catch(e){} };

const KINDS = [
  ['game', '🎮', 'A new game', '新游戏'],
  ['topic', '📚', 'A new topic or words', '新话题或词汇'],
  ['problem', '🔧', "Something isn't working", '有东西坏了'],
  ['other', '💬', 'Something else', '其他'],
];
const HEAD = `<span class="sg-icon" aria-hidden="true">💡</span>
  <div class="sg-text"><h2 id="sg-h" class="sg-title">${L('Got an idea for the site?', '你对网站有什么建议吗？')}</h2>
  <p class="sg-sub">${L("A new game, a topic you'd like, or something that isn't working: tell your teacher.", '新游戏、想学的话题，或者有什么问题：告诉老师吧。')}</p></div>`;
const LIMIT = L(`You've sent ${MAX_A_DAY} suggestions today. Thank you for your ideas! You can send more tomorrow.`, `你今天已经提了${MAX_A_DAY}条建议，谢谢你的想法！明天可以再提。`);

let mode = 'closed', note = '';
function render(){
  const s = sender();
  box.setAttribute('aria-labelledby', 'sg-h');
  if(mode === 'open' && s && !s.relogin) return form(s);
  let action;
  if(mode === 'sent' && s && !s.relogin){
    const more = s.kind === 'teacher' || sentToday(s.who) < MAX_A_DAY;
    action = `<p class="sg-msg ok" role="status">${L(`Thanks, ${esc(s.who)}! Your teacher will read your idea.`, `谢谢你，${esc(s.who)}！老师会看你的建议。`)}</p>` +
      (more ? `<button type="button" class="cc-btn alt sg-open">${L('Send another idea', '再提一条')}</button>` : '');
  } else if(!s || s.relogin){
    const href = root() + 'login/index.html?from=' + encodeURIComponent(location.pathname + location.search);
    action = `<a class="cc-btn sg-btn" href="${href}">${s ? L('Log in again to make a suggestion', '重新登录后提建议') : L('Log in to make a suggestion', '登录后提建议')}</a>`;
  } else if(s.kind === 'student' && sentToday(s.who) >= MAX_A_DAY){
    action = `<p class="sg-msg">${LIMIT}</p>`;
  } else {
    action = `<button type="button" class="cc-btn sg-btn sg-open">${L('Make a suggestion', '提建议')}</button>`;
  }
  box.innerHTML = `<div class="sg-top">${HEAD}<div class="sg-action">${action}</div></div>`;
  const o = box.querySelector('.sg-open');
  if(o) o.onclick = () => { mode = 'open'; render(); const f = box.querySelector('.sg-kind'); if(f) f.focus(); };
}
function form(s){
  box.innerHTML = `<div class="sg-top">${HEAD}</div>
    <div class="sg-form" role="group" aria-labelledby="sg-k">
      <p class="sg-k" id="sg-k">${L("What's your idea about?", '你的建议是关于什么的？')}</p>
      <div class="sg-kinds">${KINDS.map(([v, i, en, zh]) => `<button type="button" class="sg-kind" data-v="${v}" aria-pressed="false"><span aria-hidden="true">${i}</span> ${L(en, zh)}</button>`).join('')}</div>
      <label class="sg-k" for="sg-t">${L('Your idea', '你的建议')}</label>
      <textarea id="sg-t" class="sg-t" maxlength="${MAX_LEN}" rows="4" placeholder="${esc(ZH ? 'Write your idea here. 在这里写你的建议，中文或英文都可以。' : 'Write your idea here. The more you tell us, the better!')}"></textarea>
      <div class="sg-row">
        <span class="sg-who">${s.kind === 'teacher' ? L('You are logged in as the teacher, so this shows as “You”.', '你以老师身份登录，会显示为“You”。') : L(`Your teacher will see it's from <b>${esc(s.who)}</b>.`, `老师会看到这是 <b>${esc(s.who)}</b> 提的。`)}</span>
        <span class="sg-count" aria-live="off">0 / ${MAX_LEN}</span>
      </div>
      <div class="sg-row sg-btns"><button type="button" class="cc-btn sg-send" disabled>${L('Send', '发送')}</button><button type="button" class="cc-btn alt sg-cancel">${L('Cancel', '取消')}</button></div>
      <p class="sg-msg" role="status">${note}</p>
    </div>`;
  note = '';
  let kind = '';
  const t = box.querySelector('.sg-t'), send = box.querySelector('.sg-send'), msg = box.querySelector('.sg-msg'), count = box.querySelector('.sg-count');
  const ready = () => { send.disabled = !(kind && t.value.trim().length >= 3); count.textContent = t.value.length + ' / ' + MAX_LEN; };
  box.querySelectorAll('.sg-kind').forEach(b => b.onclick = () => {
    kind = b.dataset.v; box.querySelectorAll('.sg-kind').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); ready(); t.focus(); });
  t.oninput = ready;
  box.querySelector('.sg-cancel').onclick = () => { mode = 'closed'; render(); const o = box.querySelector('.sg-open'); if(o) o.focus(); };
  send.onclick = () => {
    send.disabled = true; msg.className = 'sg-msg'; msg.innerHTML = L('Sending…', '发送中…');
    const body = {kind, text: t.value, side: ZH ? 'zh' : 'en', page: location.pathname};
    const go = s.kind === 'student' && ACC() && ACC().request ? ACC().request('/api/suggest', body)
      : fetch(api() + '/api/suggest', {method: 'POST', headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + (teacher() || {}).token}, body: JSON.stringify(body)})
          .then(r => r.json().catch(() => ({})).then(d => { if(!r.ok){ const e = new Error(d.error || ''); e.status = r.status; throw e; } return d; }));
    go.then(d => {
      if(s.kind === 'student') setSent(s.who, d && typeof d.left === 'number' ? MAX_A_DAY - d.left : sentToday(s.who) + 1);
      mode = 'sent'; render(); const m = box.querySelector('.sg-msg'); if(m){ m.setAttribute('tabindex', '-1'); m.focus(); }
    }).catch(e => {
      if(e.status === 429){ setSent(s.who, MAX_A_DAY); msg.innerHTML = LIMIT; return; }
      if(e.status === 401){ mode = 'closed'; render(); return; }   // logged out on the server: the box now says "Log in again"
      send.disabled = false;
      msg.className = 'sg-msg err';
      msg.textContent = e.message && !/^Server error/.test(e.message) ? e.message : (ZH ? "Couldn't send. Check your internet connection and try again. 无法发送，请检查网络后再试。" : "Couldn't send. Check your internet connection and try again.");
    });
  };
}
// Logging in or out in another tab: show it here (but don't throw away an idea being written)
addEventListener('storage', e => { if((e.key === 'aea:account' || e.key === 'aea:account:teacher') && mode !== 'open') render(); });
render();
})();
