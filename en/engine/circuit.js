// DAILY CIRCUIT: five stations, each a game from one of the student's subjects, at their level.
// Short game 45 s → longer game 45 s → arcade game 60 s → longer game 45 s → short game 45 s (4 minutes): the English side
// since 25 Oct, the Chinese side since 26 Oct. Each English game is tagged short or long in GAMES (en/engine/app.js), the
// Chinese ones are listed in ZH_CIRCUIT there; the arcade station takes turns between the arcade games in CIRCUIT_ARCADE.
// This file does: the "I study this" switches and the Circuit card on en/index.html and zh/index.html,
// the Circuit page (en/circuit/, zh/circuit/: start and results) and the saved state.
// The stations themselves run on the topic pages (en/engine/app.js, address ending #circuit): the page chooses a game
// the student is ready for at their level, plays it for one minute and reports every answer here (count()).
(function(){
'use strict';
const SRC = (document.currentScript && document.currentScript.src) || '';
const ROOT = SRC ? SRC.replace(/en\/engine\/circuit\.js([?#].*)?$/, '') : location.origin + '/';
const KEY = 'aea:circuit:v1', STUDY = 'aea:studying:v1';
const STATIONS = 5, SECS = 60;
const PLAN = [['short',45], ['long',45], ['arcade',60], ['long',45], ['short',45]];   // both sides: [kind, seconds]
const STALE = 30*60*1000;               // a circuit left alone for 30 minutes is dropped
const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const read = (k,d) => { try{ const v=JSON.parse(localStorage.getItem(k)); return v==null ? d : v; }catch(e){ return d; } };
const write = (k,v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
const norm = p => String(p||'').replace(/^\/+/, '').replace(/index\.html$/, '');
const pathOf = href => { try{ return new URL(href, location.href).href.split('#')[0].split('?')[0].slice(ROOT.length); }catch(e){ return href; } };
const dayKey = (x=new Date()) => x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');
const shuffle = a => { a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const load = () => { const d=read(KEY, {}); d.days=d.days||{}; return d; };

// ----- Subjects the student studies (the switches): {en: {"en/web-design/index.html": "Web design"}, zh: {...}} -----
const studying = side => (read(STUDY, {})[side]) || {};
const setStudying = (side, path, name, on) => { const s=read(STUDY, {}); s[side]=s[side]||{}; if(on) s[side][path]=name; else delete s[side][path]; write(STUDY, s); };

// ----- The circuit in progress -----
// {side, started, touched, n, arcade, plan:[{path, kind, secs, tried}], i, cur:{path, topic, game, name, zh, secs, right, answered, pts, ends, left}, results:[…], skip:[…]}
// kind: 'short', 'long' or 'arcade'; arcade: which arcade game's turn it is
function active(side){ const r=load().run;
  if(!r || r.done || (side && r.side!==side)) return null;
  if(!r.plan || !r.plan[0] || !r.plan[0].kind) return null;   // a circuit saved in an old format (English before 25 Oct, Chinese before 26 Oct): start a new one
  if(Date.now()-(r.touched||r.started) > STALE) return null;
  return r; }
// One topic per station, mixed, never the same topic twice in a row when there is a choice
function makePlan(topics, side){ const out=[]; let last=null;
  while(out.length<STATIONS){ const round=shuffle(topics); if(round.length>1 && round[0]===last) round.push(round.shift());
    for(const t of round) if(out.length<STATIONS){ out.push(t); last=t; } }
  return out.map((path,i)=>({path, kind:PLAN[i][0], secs:PLAN[i][1]})); }
const go = path => { location.href = ROOT + path + '#circuit'; };
const resultsUrl = side => ROOT + side + '/circuit/index.html#done';
function start(side){ const topics=Object.keys(studying(side)); if(!topics.length) return false;
  const d=load(), now=Date.now();
  d.arcade=(d.arcade||0)+1;   // the arcade games take turns, one circuit each
  d.run={side, started:now, touched:now, n:STATIONS, arcade:d.arcade, plan:makePlan(topics, side), i:0, cur:null, results:[], skip:[]};
  write(KEY, d); go(d.run.plan[0].path); return true; }
function cont(side){ const r=active(side); if(!r) return false; go(r.cur ? r.cur.path : r.plan[r.i].path); return true; }
function mutate(fn){ const d=load(), r=d.run; if(!r || r.done) return null; const out=fn(r, d); r.touched=Date.now(); write(KEY, d); return out; }
// The topic page starts a station, pauses it (the student left the page) and resumes it
function begin(info){ return mutate(r=>{ const secs=(r.plan[r.i]||{}).secs||SECS;
  r.cur=Object.assign({}, info, {secs, right:0, answered:0, pts:0, ends:Date.now()+secs*1000, left:null}); return r.cur; }); }
// The station now: {path, kind, secs}, plus whose turn it is among the arcade games
function station(){ const r=active(); if(!r) return null; return Object.assign({arcade:r.arcade||0}, r.plan[r.i]); }
function resume(){ return mutate(r=>{ const c=r.cur; if(c && c.left!=null){ c.ends=Date.now()+c.left; c.left=null; } return c; }); }
function pause(path){ mutate(r=>{ const c=r.cur; if(c && c.left==null && norm(c.path)===norm(path)) c.left=Math.max(0, c.ends-Date.now()); }); }
function count(path, ok, pts){ mutate(r=>{ const c=r.cur;
  if(!c || c.left!=null || norm(c.path)!==norm(path) || Date.now()>c.ends+1500) return;
  c.answered++; if(ok) c.right++; c.pts+=pts||0; }); }
function finish(r, d){ r.done=true; r.finished=Date.now();
  const k=dayKey(), day=d.days[k]=d.days[k]||{}, s=day[r.side]=day[r.side]||{runs:0, right:0, answered:0, pts:0};
  r.results.forEach(x=>{ s.right+=x.right; s.answered+=x.answered; s.pts+=x.pts; });
  if(r.results.length) s.runs++;
  d.last=r; delete d.run; }
// Time is up at a station: save its result and say where to go next (null = the circuit is finished)
function endStation(){ return mutate((r, d)=>{ const c=r.cur; let res=null;
  if(c){ res={path:c.path, topic:c.topic, game:c.game, name:c.name, zh:c.zh||'', right:c.right, answered:c.answered, pts:c.pts}; r.results.push(res); }
  r.cur=null; r.i++;
  if(r.i>=r.n){ finish(r, d); return {res, next:null, i:r.i, n:r.n}; }
  return {res, next:r.plan[r.i].path, i:r.i, n:r.n}; }); }
// A topic page with no game ready at the student's level: use the student's other subjects instead
function skipTopic(path){
  const side=(active()||{}).side;
  const next=mutate((r, d)=>{ r.skip.push(norm(path));
    const pool=[...new Set([...Object.keys(studying(r.side)), ...r.plan.map(x=>x.path)])].filter(p=>!r.skip.includes(norm(p)));
    if(!pool.length){ r.empty=true; finish(r, d); return null; }
    for(let k=r.i; k<r.n; k++) if(r.skip.includes(norm(r.plan[k].path))) r.plan[k].path=pool[Math.floor(Math.random()*pool.length)];
    return r.plan[r.i].path; });
  if(next) go(next); else location.href=resultsUrl(side||'en');
}
// A topic page with no game of this station's kind (a long game or an arcade game) at the student's level: try another of
// their subjects for this station; when none has one, the station becomes a short game. Says where to go next.
function retryStation(path){
  return mutate(r=>{ const st=r.plan[r.i]; st.tried=st.tried||[]; if(!st.tried.includes(norm(path))) st.tried.push(norm(path));
    const pool=Object.keys(studying(r.side)).filter(p=>!st.tried.includes(norm(p)) && !r.skip.includes(norm(p)));
    if(pool.length){ st.path=pool[Math.floor(Math.random()*pool.length)]; return st.path; }
    st.kind='short'; st.secs=PLAN[0][1]; st.path=path; return path; });
}
const today = side => (load().days[dayKey()]||{})[side] || null;
function streak(side){ const d=load(), x=new Date(); let n=0;
  if(!(d.days[dayKey(x)]||{})[side]) x.setDate(x.getDate()-1);
  while(((d.days[dayKey(x)]||{})[side]||{}).runs){ n++; x.setDate(x.getDate()-1); }
  return n; }

window.AEA_CIRCUIT = {ROOT, STATIONS, SECS, norm, active, station, begin, resume, pause, count, endStation, skipTopic, retryStation, resultsUrl, studying, today, streak};

// ---------- the topic list pages (en/index.html, zh/index.html): switches and the Circuit card ----------
// Chinese side: both languages in their own spans; the page shows one (the English / 中文 switch, 26 Oct; see app.js T)
const T = (zh, en, z) => zh ? `<span class="t-en">${en}</span><span class="t-zh" lang="zh">${z}</span>` : en;
// A bilingual name ("Web design 网页设计") as T() on the Chinese side
const NT = (zh, s) => { s=String(s||''); const i=s.search(/[\u3400-\u9fff]/); return zh && i>0 ? T(zh, esc(s.slice(0,i).trim()), esc(s.slice(i).trim())) : esc(s); };
function indexPage(card){
  const side=card.dataset.side, zh=side==='zh', status=card.querySelector('[data-circuit-status]');
  const drawCard=()=>{ const subs=Object.keys(studying(side)).length, run=active(side), t=today(side), st=streak(side);
    let html;
    if(run) html=`<b>${T(zh, `In progress: station ${Math.min(run.i+1, run.n)} of ${run.n}`, `进行中：第 ${Math.min(run.i+1, run.n)} 站`)}</b>`;
    else if(!subs) html=T(zh, 'Switch on the subjects you study below to start.', '先在下面打开你在学的科目。');
    else if(t && t.runs) html=`<b class="cc-done">✓ ${T(zh, 'Done today', '今天已完成')}</b> · ${T(zh, `${t.right} right`, `答对 ${t.right}`)}${st>1?` · ${T(zh, `${st} days in a row`, `连续 ${st} 天`)}`:''}`;
    else html=`${T(zh, `${subs} subject${subs===1?'':'s'} switched on · not done today`, `已选 ${subs} 个科目 · 今天还没完成`)}${st?` · ${T(zh, `${st} day${st===1?'':'s'} in a row`, `连续 ${st} 天`)}`:''}`;
    if(status) status.innerHTML=html;
    const goBtn=card.querySelector('[data-circuit-go]');
    if(goBtn) goBtn.innerHTML=(run ? T(zh, 'Continue', '继续') : t && t.runs ? T(zh, 'Play again', '再玩一次') : T(zh, 'Start', '开始'))+' →'; };
  document.querySelectorAll('.topic-sw').forEach(el=>{
    const a=el.querySelector('.topic-link'), b=el.querySelector('button.sw'); if(!a||!b) return;
    const path=pathOf(a.getAttribute('href')), name=(el.querySelector('.topic-name')||a).textContent.replace(/\s+/g,' ').trim();
    const draw=()=>{ const on=!!studying(side)[path]; b.setAttribute('aria-checked', on?'true':'false'); el.classList.toggle('on', on); };
    b.addEventListener('click', ()=>{ setStudying(side, path, name, b.getAttribute('aria-checked')!=='true'); draw(); drawCard(); });
    draw(); });
  drawCard();
  window.addEventListener('pageshow', drawCard);
}

// ---------- the Circuit page (en/circuit/, zh/circuit/) ----------
function circuitPage(box){
  const side=box.dataset.side, zh=side==='zh', back=box.dataset.back||'../index.html';
  const draw=()=>{
    const subs=Object.values(studying(side)), run=active(side), d=load(), last=d.last && d.last.side===side ? d.last : null;
    const t=today(side), st=streak(side);
    const streakLine = st ? `<p class="cc-streak">${T(zh, `${st} day${st===1?'':'s'} in a row`, `连续 ${st} 天`)}</p>` : '';
    const subjects = subs.length ? `<p class="cc-k">${T(zh, 'Your subjects', '你的科目')}</p><p class="cc-chips">${subs.map(n=>`<span class="cc-chip">${NT(zh, n)}</span>`).join('')}</p>
      <p class="cc-small"><a href="${esc(back)}">${T(zh, 'Change your subjects', '修改科目')}</a></p>` : '';
    let main;
    if(location.hash==='#done' && last){
      const R=last.results, right=R.reduce((s,x)=>s+x.right,0), ans=R.reduce((s,x)=>s+x.answered,0), pts=R.reduce((s,x)=>s+x.pts,0);
      main = !R.length ? `<p class="cc-k">${T(zh, 'Circuit', '每日挑战')}</p><h2>${T(zh, 'Nothing to play yet', '还没有可玩的游戏')}</h2>
          <p>${zh ? T(zh, 'None of your subjects has a game ready at your level yet. Open a subject and use Learn the words first.', '你的科目还没有适合你水平的游戏，先去“学习单词”吧。')
                  : 'None of your subjects has a game ready at your level yet. Try switching on another subject.'}</p>
          <p class="cc-actions"><a class="cc-btn alt" href="${esc(back)}">${T(zh, 'Back to topics', '返回主题')}</a></p>`
        : `<p class="cc-k">${T(zh, 'Circuit complete!', '挑战完成！')}</p>
          <div class="cc-big">${right}<small> ${T(zh, `right of ${ans}`, `共 ${ans} 题`)}</small></div>
          <p>${T(zh, `+${pts} points`, `+${pts} 积分`)}</p>${streakLine}
          <ol class="cc-list">${R.map(x=>`<li><span><b>${NT(zh, x.topic)}</b> · ${zh&&x.zh ? T(zh, esc(x.name), esc(x.zh)) : esc(x.name)}</span><span class="cc-score">${x.right}/${x.answered}</span></li>`).join('')}</ol>
          <p class="cc-actions"><button class="cc-btn" data-start>${T(zh, 'Play again', '再玩一次')}</button><a class="cc-btn alt" href="${esc(back)}">${T(zh, 'Back to topics', '返回主题')}</a></p>`;
    } else if(run){
      main = `<p class="cc-k">${T(zh, 'In progress', '进行中')}</p><h2>${T(zh, `Station ${Math.min(run.i+1, run.n)} of ${run.n}`, `第 ${Math.min(run.i+1, run.n)} 站，共 ${run.n} 站`)}</h2>
        <p class="cc-actions"><button class="cc-btn" data-continue>${T(zh, 'Continue', '继续')} →</button><button class="cc-btn alt" data-start>${T(zh, 'Start again', '重新开始')}</button></p>`;
    } else if(!subs.length){
      main = `<p class="cc-k">${T(zh, 'First', '第一步')}</p><h2>${T(zh, 'Switch on your subjects', '打开你的科目')}</h2>
        <p>${T(zh, 'On the topic list, switch on each subject you study. The circuit chooses its games from those subjects.', '在主题列表里打开你在学的每个科目，挑战会从这些科目里选游戏。')}</p>
        <p class="cc-actions"><a class="cc-btn" href="${esc(back)}">${T(zh, 'Choose your subjects', '选择科目')} →</a></p>`;
    } else {
      main = `<p class="cc-k">${t && t.runs ? `✓ ${T(zh, 'Done today. You can play again', '今天已完成，可以再玩')}` : T(zh, 'Today', '今天')}</p>
        <h2>${T(zh, `${STATIONS} stations · 4 minutes`, `${STATIONS} 站 · 4 分钟`)}</h2>
        <p>${T(zh, 'A quick game, a longer one, an arcade game, another longer one and a quick one to finish, each from one of your subjects at your level. When the time is up, you move on to the next one.',
               '先玩一个快速游戏，再玩一个长一点的游戏、一个街机游戏、又一个长一点的游戏，最后用一个快速游戏结束。每个游戏都来自你的科目，难度适合你。时间到了就进入下一站。')}</p>${streakLine}
        <p class="cc-actions"><button class="cc-btn big" data-start>${T(zh, 'Start the circuit', '开始挑战')} →</button></p>`;
    }
    box.innerHTML = `<section class="cc-panel">${main}</section>${subjects?`<section class="cc-subjects">${subjects}</section>`:''}`;
    box.querySelectorAll('[data-start]').forEach(b=>b.onclick=()=>{ if(!start(side)){ location.href=back; } });
    const c=box.querySelector('[data-continue]'); if(c) c.onclick=()=>cont(side);
  };
  draw();
  window.addEventListener('hashchange', draw); window.addEventListener('pageshow', draw);
}

function init(){
  const card=document.querySelector('[data-circuit-card]'); if(card) indexPage(card);
  const box=document.getElementById('circuitPage'); if(box) circuitPage(box);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
