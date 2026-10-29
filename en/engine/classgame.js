/* CLASS GAMES (29 Oct 2026): the card a logged-in student sees at the top of the topic lists (index.html, en/index.html,
   zh/index.html) when their teacher has set a class game. The teacher sets it on the teacher page (subject, minutes, the
   score needed, an optional due time) and chooses each student's version (English or 中文版) and lowest level there.
   The card says what the game is and where the student is with it (not started / playing, with the time left / below the
   score needed: play again / done), and its button opens the subject's page for the student's version with #class-<id>:
   the game itself runs there (en/engine/app.js, "CLASS GAME"). Nothing shows without a login or without a game.
   Load it after account.js:  <script src="…/en/engine/classgame.js?v=…"></script> */
(function(){
'use strict';
const A = window.AEA_ACCOUNT; if(!A) return;
const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const two = n => String(n).padStart(2, '0');
const clock = ms => { const s=Math.ceil(ms/1000); return Math.floor(s/60)+':'+two(s%60); };
const LEVELS_ZH = ['', '基础', '基础+', '中级', '中级+', '高级'];
let side = 'en';
// English and Chinese: on a Chinese-side page each in its own span (the EN / 中文 switch shows one); elsewhere both for a
// student on the Chinese version, English only for the others
const L = (en, zh) => document.documentElement.hasAttribute('data-ui') ? `<span class="t-en">${en}</span> <span class="t-zh" lang="zh">${zh}</span>`
  : side === 'zh' && zh ? `${en} <span lang="zh">${zh}</span>` : en;
const dueText = t => { if(!t) return ''; const d=new Date(t), day=d.toLocaleDateString('en-GB', {weekday:'short', day:'numeric', month:'short'});
  return L(`due ${day} ${two(d.getHours())}:${two(d.getMinutes())}`, `截止 ${d.getMonth()+1}月${d.getDate()}日 ${two(d.getHours())}:${two(d.getMinutes())}`); };

function style(){
  if(document.getElementById('cg-style')) return;
  const st=document.createElement('style'); st.id='cg-style';
  st.textContent='.class-games{display:flex;flex-direction:column;gap:10px}' +
    '.class-box{border-color:var(--rep,#e4572e)}' +
    '.class-box .cc-badge{background:var(--rep,#e4572e);color:#fff}' +
    '.class-box .cc-k{font-size:.72rem;text-transform:uppercase;letter-spacing:.09em;font-weight:700;color:var(--muted);margin:0 0 2px}' +
    '.class-box .cg-ok{color:var(--ess,#23a05c);font-weight:700}.class-box .cg-late{color:#c0392b;font-weight:700}' +
    '@media (prefers-color-scheme:dark){.class-box .cg-late{color:#ff8a78}}';
  document.head.appendChild(st);
}

function card(g){
  const href=A.ROOT+g.path+'#class-'+g.id, name=L(esc(g.name), esc(g.zh||''));
  const sub=[L(`${g.minutes} minute${g.minutes===1?'':'s'}`, `${g.minutes} 分钟`), g.minScore ? L(`score needed: ${g.minScore}`, `目标分数：${g.minScore}`) : '', dueText(g.due)].filter(Boolean).join(' · ');
  let status='', btn='';
  if(g.status==='playing'){ status=`<b>${L(`In progress: ${clock(g.live.msLeft)} left · score ${g.live.score}`, `进行中：还剩 ${clock(g.live.msLeft)} · 得分 ${g.live.score}`)}</b>`;
    btn=`<a class="cc-btn" href="${esc(href)}">${L('Carry on','继续')} →</a>`; }
  else if(g.status==='passed'){ status=`<span class="cg-ok">✓ ${L(`Done: score ${g.score}`, `完成：得分 ${g.score}`)}</span>${g.late?` · <span class="cg-late">${L('late','迟交')}</span>`:''}`; }
  else if(g.status==='below'){ status=`<b>${L(`Your score: ${g.score}. You need ${g.minScore}: play again.`, `你的得分：${g.score}，需要 ${g.minScore} 分，再玩一次吧。`)}</b>${g.late?` · <span class="cg-late">${L('late','迟交')}</span>`:''}`;
    btn=`<a class="cc-btn" href="${esc(href)}">${L('Play again','再玩一次')} →</a>`; }
  else { status=g.late ? `<span class="cg-late">${L('Late: play it now','已过截止时间，现在就玩吧')}</span>` : L('Not started yet','还没开始');
    btn=`<a class="cc-btn" href="${esc(href)}">${L('Start','开始')} →</a>`; }
  return `<div class="circuit-box class-box">
    <span class="cc-badge" aria-hidden="true"><span>${g.minutes}</span><small>min</small></span>
    <div class="cc-text"><p class="cc-k">${L('Class game','课堂游戏')}</p><p class="cc-name">${name}</p><p class="cc-sub">${sub}</p><p class="cc-status">${status}</p></div>
    ${btn?`<div class="cc-box-actions">${btn}</div>`:''}</div>`;
}

let box=null, timer=null;
async function draw(){
  clearTimeout(timer);
  const a=A.account(); if(!a || !a.token){ if(box){ box.remove(); box=null; } return; }
  let r; try{ r=await A.request('/api/student/games'); }catch(e){ timer=setTimeout(draw, 60000); return; }
  side=r.side||'en';
  const list=(r.games||[]).filter(g=>g.status!=='passed' || Date.now()-(g.finished||0) < 3*864e5);   // done ones stay for 3 days
  if(!list.length){ if(box){ box.remove(); box=null; } timer=setTimeout(draw, 60000); return; }
  style();
  if(!box){
    box=document.createElement('section'); box.className='topic-group class-games'; box.setAttribute('aria-label', 'Class games 课堂游戏');
    const main=document.querySelector('main.home'), before=main && main.querySelector('.topic-group, nav.units');
    if(!main) return;
    if(before) main.insertBefore(box, before); else main.appendChild(box);
  }
  box.innerHTML=list.map(card).join('');
  timer=setTimeout(draw, list.some(g=>g.status==='playing') ? 15000 : 60000);
}
const start=()=>draw();
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', start); else start();
window.addEventListener('pageshow', e=>{ if(e.persisted) draw(); });
window.addEventListener('storage', e=>{ if(e.key==='aea:account') draw(); });
window.AEA_CLASSCARD={draw};
})();
