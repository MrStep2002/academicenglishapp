/* MATHS engine (tester, 27 Oct 2026).
   A maths topic page (maths/<topic>/index.html) loads its topic file first (maths/engine/<topic>.js fills AEA_MATHS_TOPICS),
   then this file. Nothing is read from CSV: every question is made fresh by the topic's skills, at the chosen level.
   Same look, levels (Foundation … Advanced), points bar and login as the English pages; instructions follow the
   EN / 中文 switch (English unless the student chose 中文). Points are kept as their own side, "maths".
   Exam boards (boards.js): the student's board and tier decide which syllabus points this topic shows (27 Oct: Cambridge 0580).
   Chinese: questions with words carry their Chinese (q.zh), shown on hover or press-and-hold (wireZh).
   Games: Quick (Choose the answer, True or false), Work it out (Type the answer, Which calculation?), Check the working
   (Spot the mistake) and two arcade games (Whack-a-number, Speed round).
   Saved in the browser (and so to the student's account when logged in): progress in aea:maths:v1, settings and best
   scores under aea:maths-<topic>:… Routes: #play-<game>; nothing = the topic menu. */
(function(){
'use strict';
const ROOT = ((document.currentScript && document.currentScript.src) || '/maths/engine/maths.js').replace(/maths\/engine\/maths\.js([?#].*)?$/, '');
const $app = document.getElementById('app'), CFG = $app.dataset;
const TOPIC = (window.AEA_MATHS_TOPICS||{})[CFG.topic];
if(!TOPIC){ $app.innerHTML='<p class="notice">This maths topic could not be loaded.</p>'; return; }
const SIDE = 'maths', KEY = 'maths-'+TOPIC.key, fmt = TOPIC.fmt, fix = TOPIC.fix;

// ---------- language: one at a time (the switch next to the points bar, from account.js) ----------
const uiLang = () => document.documentElement.getAttribute('data-ui')==='zh' ? 'zh' : 'en';   // the language on show (set in the page's <head>, then by the switch)
const T = (en, zh) => `<span class="t-en">${en}</span><span class="t-zh" lang="zh-CN">${zh}</span>`;
const TX = (en, zh) => uiLang()==='zh' ? zh : en;

// ---------- helpers ----------
const esc = s => String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuffle = a => { a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random()*a.length)];
const store = {
  get(k,d){ try{ const v=localStorage.getItem('aea:'+KEY+':'+k); return v==null?d:JSON.parse(v); }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem('aea:'+KEY+':'+k, JSON.stringify(v)); }catch(e){} }
};
const LEVEL_NAMES = ['', 'Foundation', 'Foundation+', 'Intermediate', 'Intermediate+', 'Advanced'];
const LEVEL_ZH = ['', '基础', '基础+', '中级', '中级+', '高级'];
const levelT = b => T(LEVEL_NAMES[b], LEVEL_ZH[b]);
const isPhone = () => { const coarse=window.matchMedia && matchMedia('(pointer: coarse)').matches, small=Math.min(screen.width||9999, screen.height||9999)<600; return (coarse && small) || window.innerWidth<520; };
let PHONE = isPhone(); document.documentElement.classList.toggle('phone', PHONE);
const touch = () => PHONE || !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
let keyHandler=null, timers=[], stopGame=null;
document.addEventListener('keydown', e=>{ if(keyHandler && !e.metaKey && !e.ctrlKey && !e.altKey && e.target.tagName!=='INPUT') keyHandler(e); });
const later = (fn,ms) => { const t=setTimeout(fn,ms); timers.push(t); return t; };
const clearTimers = () => { timers.forEach(clearTimeout); timers=[]; };
const AUTO_MS = 700;
const HOME_MARK = '<svg viewBox="0 0 290 240" aria-hidden="true" focusable="false"><path fill="currentColor" fill-rule="evenodd" d="M143.1 233.8C141.4 233.7 138.2 232.7 136.3 231.8C130.2 228.9 126.4 223.1 126.1 216.1C126.0 213.8 126.0 213.0 126.5 211.3C127.8 205.8 131.2 201.7 136.3 199.1C138.9 197.8 140.7 197.4 144.5 197.4C148.4 197.4 150.2 197.7 153.4 199.3C160.6 202.7 164.8 211.0 163.1 218.6C162.3 222.0 159.5 227.3 157.4 229.2C155.5 230.9 152.6 232.6 150.0 233.4C148.6 233.8 144.9 234.0 143.1 233.8ZM167.9 212.3C167.5 212.2 167.4 211.9 167.1 210.2C167.0 209.5 166.7 208.4 166.4 207.9L165.9 206.8L166.8 205.1C167.3 204.1 167.8 203.1 167.9 202.8C168.3 201.4 171.6 195.0 173.2 192.6C173.6 191.8 174.0 191.2 174.0 191.1C174.0 190.7 177.1 185.8 178.5 183.9C183.0 177.7 184.9 175.4 187.4 172.7C189.1 171.0 191.0 168.8 191.9 167.9C194.1 165.3 196.2 163.2 200.1 159.9C209.5 151.8 217.1 143.0 219.4 137.2C221.3 132.2 221.8 130.1 221.9 124.4C222.0 120.2 222.0 119.3 221.5 116.6C220.8 112.7 220.0 110.4 218.4 107.4C215.5 101.8 212.3 97.8 207.9 93.8C202.3 88.9 199.4 86.9 192.9 83.7C184.1 79.3 177.5 77.2 164.0 74.6C155.8 73.0 154.1 72.9 144.6 72.9C137.6 72.9 135.7 73.0 132.0 73.5C124.9 74.4 117.5 76.0 109.0 78.6C98.4 81.7 88.7 86.9 81.4 93.4C79.5 95.0 74.4 101.2 73.0 103.6C72.5 104.4 71.9 105.5 71.5 106.0C70.6 107.3 69.2 110.4 68.6 112.1C66.8 117.4 66.4 125.9 67.7 131.5C69.0 136.8 70.5 140.0 73.9 144.6C78.8 151.1 81.9 154.3 87.6 158.9C89.9 160.7 92.5 163.1 94.6 165.3C96.4 167.3 99.5 170.6 101.5 172.7C105.7 176.9 107.3 179.0 110.5 184.1C111.8 186.0 113.8 189.1 115.0 190.9C116.2 192.8 117.8 195.5 118.5 196.9C122.2 204.5 122.7 205.8 122.7 206.7C122.7 207.8 121.2 211.8 120.7 212.1C120.2 212.4 111.3 211.1 107.1 210.1C102.5 209.1 91.7 205.2 86.3 202.6C80.4 199.8 69.0 191.3 63.7 185.8C58.3 180.2 52.7 172.4 50.5 167.2C50.1 166.2 49.5 164.9 49.3 164.4C48.0 161.7 46.0 155.6 45.5 153.4C44.3 147.4 43.9 143.2 44.1 137.1C44.2 132.8 44.3 130.7 44.7 128.5C45.6 123.7 46.7 119.4 47.7 116.6C48.4 114.3 48.4 114.2 45.9 113.5C43.4 112.7 38.6 110.7 35.9 109.4C30.9 107.0 25.2 102.5 20.6 97.5C16.4 92.8 15.7 92.1 14.1 89.4C12.2 86.1 11.2 84.1 9.7 79.9C7.0 72.7 6.2 68.2 6.2 60.6C6.1 53.7 6.8 49.6 9.0 43.5C11.8 35.7 14.2 31.5 19.0 25.9C24.9 19.1 30.1 15.1 37.7 11.5C42.3 9.4 46.0 8.2 53.1 6.6C57.2 5.7 67.2 5.6 70.4 6.4C71.1 6.6 72.1 6.8 72.8 6.9C73.9 7.0 76.6 7.8 79.2 8.6C82.1 9.6 88.8 12.6 90.5 13.7C90.8 14.0 91.8 14.6 92.6 15.1C96.2 17.4 102.4 23.1 105.1 26.6C109.5 32.3 111.2 35.5 113.9 43.4C115.2 47.3 115.7 49.2 115.9 51.9C116.2 55.1 116.3 55.2 119.2 54.0C120.5 53.6 122.7 53.0 128.4 51.6C129.2 51.4 131.4 51.0 133.4 50.7C136.5 50.2 137.7 50.1 144.6 50.1C151.5 50.1 152.8 50.2 155.9 50.7C161.4 51.6 167.7 53.1 171.3 54.3C174.1 55.2 174.1 55.2 174.4 52.3C175.0 44.8 178.2 35.8 182.2 30.0C186.0 24.6 192.2 18.2 196.5 15.5C202.7 11.4 210.5 8.2 217.5 6.7C222.9 5.6 233.1 5.5 237.6 6.7C246.6 8.9 254.0 11.9 259.4 15.6C264.8 19.3 267.9 22.3 272.0 27.6C275.7 32.5 276.6 33.8 278.1 37.0C281.9 44.9 283.5 52.1 283.5 60.8C283.5 67.2 282.8 72.0 281.4 76.4C278.8 84.1 277.1 87.4 272.6 93.4C270.4 96.3 264.9 101.9 262.4 103.7C257.7 107.1 256.5 107.9 254.6 109.0C252.1 110.4 249.3 111.6 244.9 113.0C243.2 113.6 241.6 114.2 241.3 114.4C240.6 114.9 240.6 114.7 241.9 120.0C244.1 128.4 244.8 132.6 244.8 139.3C244.8 145.9 244.2 149.8 242.2 156.4C241.8 157.8 241.3 159.5 241.1 160.2C240.2 163.5 236.9 170.5 234.8 173.4C231.1 178.9 229.2 181.3 225.8 184.9C219.5 191.7 216.1 194.3 206.1 200.5C202.4 202.8 192.2 207.3 188.0 208.6C183.3 210.0 175.4 211.6 171.3 212.0C169.9 212.1 168.6 212.3 168.5 212.3C168.5 212.4 168.2 212.4 167.9 212.3ZM107.6 152.2C104.2 151.2 102.4 150.1 100.7 147.7C97.5 143.6 96.6 138.9 98.1 134.9C99.8 130.3 103.0 127.3 107.4 126.1C109.3 125.6 113.2 125.6 115.1 126.1C119.9 127.4 123.3 130.7 124.5 135.4C125.4 138.8 125.0 142.5 123.5 145.7C122.7 147.2 119.8 150.2 118.1 151.1C115.3 152.7 110.7 153.2 107.6 152.2ZM175.6 152.2C172.6 151.8 168.8 149.2 167.0 146.2C165.9 144.3 165.0 141.1 165.0 139.0C165.0 134.7 168.3 129.1 171.8 127.5C175.2 125.8 174.9 125.9 178.6 125.9C181.7 125.9 182.3 125.9 183.6 126.5C186.4 127.6 187.8 128.6 189.7 130.9C192.4 134.2 193.2 141.0 191.2 145.4C190.2 147.7 187.1 150.5 184.5 151.5C182.1 152.4 178.7 152.7 175.6 152.2ZM234.9 95.0C240.8 93.7 246.5 91.0 250.7 87.4C253.5 85.0 254.6 83.8 256.6 81.2C259.8 76.8 262.2 70.9 262.8 65.9C263.3 61.2 262.8 54.9 261.5 50.6C260.1 46.1 255.7 39.2 251.8 35.4C248.2 32.0 243.6 29.5 237.8 27.6C231.9 25.8 224.3 25.7 218.1 27.5C216.0 28.1 211.5 30.3 208.9 32.0C206.1 33.8 202.3 37.8 200.1 41.0C197.0 45.6 196.4 47.2 195.1 54.0C194.5 57.2 194.7 63.0 195.6 65.3C197.3 70.0 199.7 73.0 208.4 81.3C212.1 84.8 216.7 89.2 218.7 91.0C220.7 92.9 222.7 94.6 223.1 94.9C225.2 95.8 230.7 95.9 234.9 95.0ZM62.6 95.1C66.5 94.5 68.2 93.6 72.2 89.5C73.7 88.1 77.5 84.5 80.7 81.5C87.9 74.9 91.6 70.8 93.3 67.5C93.5 66.9 94.1 65.5 94.4 64.4C95.0 62.5 95.1 62.0 95.1 57.8C95.1 53.7 95.1 52.8 94.5 50.9C93.4 46.3 91.5 42.5 88.6 39.0C83.2 32.3 76.1 28.1 68.1 26.8C64.1 26.2 60.8 26.1 57.3 26.6C48.7 27.8 43.2 30.5 37.4 36.4C33.9 39.9 32.6 41.8 30.5 46.1C27.8 51.8 27.1 54.9 27.1 61.6C27.1 67.9 27.5 69.9 29.9 75.5C31.5 79.2 33.3 81.9 35.8 84.7C39.0 88.4 42.7 91.0 47.1 92.8C53.0 95.2 57.4 95.9 62.6 95.1Z"/></svg>';   // the logo's mouse, as on every page

// ---------- progress: a level for the topic (as on the English pages), and how each skill is going ----------
const PKEY='aea:maths:v1', CAL=10;
const POINTS = {quick:[1,1,2,2,3], type:[2,2,3,3,4], which:[2,2,3,4,5], spot:[2,3,4,5,6]};   // by level, Foundation … Advanced
const KIND = {choose:'quick', tf:'quick', speed:'quick', whack:'quick', type:'type', which:'which', spot:'spot'};
const GUESS = {choose:.25, tf:.5, speed:.25, whack:.2, type:0, which:.25, spot:.25};   // the chance of a lucky guess
const P = (function(){
  const load = () => { let d; try{ d=JSON.parse(localStorage.getItem(PKEY))||{}; }catch(e){ d={}; } d.topics=d.topics||{}; d.skills=d.skills||{}; return d; };
  const save = d => { try{ localStorage.setItem(PKEY, JSON.stringify(d)); }catch(e){} };
  const topic = () => load().topics[TOPIC.key];
  const rating = () => { const t=topic(); return t ? t.r : 3; };   // a new student starts at Intermediate, as on the English side
  const known = () => { const t=topic(); return !!t && t.n>=CAL; };
  function record(game, q, ok){
    const d=load(), t=d.topics[TOPIC.key] || (d.topics[TOPIC.key]={name:TOPIC.name, r:3, n:0, right:0, pts:0}), before=t.n, lv=q.level||3, oldBand=Math.floor(t.r);
    t.n++; if(ok) t.right++; t.last=Date.now();
    const g=GUESS[game] ?? .25, p=g+(1-g)/(1+Math.exp(-2.5*(t.r-lv))), k=Math.max(.12, .8/Math.sqrt(before+1));
    t.r=Math.max(1, Math.min(5.99, t.r + k*((ok?1:0)-p)));
    const sk=d.skills[TOPIC.key+'.'+(q.skill||game)] || (d.skills[TOPIC.key+'.'+(q.skill||game)]={n:0, right:0}); sk.n++; if(ok) sk.right++;
    let pts=0; if(ok){ pts=POINTS[KIND[game]||'quick'][Math.max(1,Math.min(5,lv))-1]; t.pts+=pts; }
    save(d);
    let msg=''; if(t.n===CAL) msg=TX(`We've found your level: ${LEVEL_NAMES[Math.floor(t.r)]}`, `你的水平：${LEVEL_ZH[Math.floor(t.r)]}`);
    else if(t.n>CAL && Math.floor(t.r)>oldBand) msg=TX(`Level up! You've reached ${LEVEL_NAMES[Math.floor(t.r)]}`, `升级到${LEVEL_ZH[Math.floor(t.r)]}！`);
    if(msg) toast(msg);
    if(window.AEA_POINTS) earned(AEA_POINTS.record(SIDE, pts, ok));
  }
  return {record, topic, rating, known};
})();
function earned(change){
  if(!change) return; const v=document.querySelector('#feed .card .feedback .verdict'); if(!v) return;
  const b=document.createElement('span'); b.className='pts-earn '+(change>0?'up':'down');
  b.textContent = change>0 ? TX(`+${change} point${change===1?'':'s'}`, `+${change} 积分`) : TX('−1 point: 5 wrong answers', '−1 积分：答错 5 题'); v.appendChild(b);
}
function toast(msg){ const t=document.createElement('div'); t.className='lvl-toast'; t.setAttribute('role','status'); t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(), 3800); }

// ---------- the level: the student's own, or one they chose ----------
const myBand = () => Math.max(1, Math.min(5, Math.floor(P.rating())));
let pickedBand = store.get('level', null);
const chosenBand = () => pickedBand || myBand();
const chooseBand = b => { pickedBand=b; store.set('level', b); };
const tidyChoice = () => { if(pickedBand!=null && P.known() && pickedBand===myBand()) chooseBand(null); };

// ---------- the student's exam board: this topic's syllabus points (boards.js), all of them or the ones they picked ----------
// Each point lists the skills (recipes in the topic file) that practise it. Extended-only points are hidden for Core.
const BOARDS = window.AEA_MATHS_BOARDS || null, CHOICE = BOARDS ? BOARDS.choice() : {board:'', tier:'extended'};
const BOARD = BOARDS ? BOARDS[CHOICE.board] : null, TIER = CHOICE.tier;
const BTOPIC = BOARD && (BOARD.topics||[]).find(t=>t.key===TOPIC.key);
const PREFIX = BOARD && BOARD.codes ? (BOARD.codes[TIER]||'') : '';
const recipe = k => TOPIC.skills.find(s=>s.key===k);
const okAt = (r, L) => !!r && r.from<=L && L<=r.to;
const SUBS = BTOPIC ? BTOPIC.subs.filter(s=>!(s.ext && TIER==='core')) : TOPIC.skills.map(r=>({n:'', name:r.name, zh:r.zh, skills:[r.key]}));
const subKey = s => s.n || s.name;
const subsAt = L => SUBS.filter(s=>s.skills.some(k=>okAt(recipe(k), L)));
const skillsOf = (subs, L) => [...new Set(subs.flatMap(s=>s.skills))].map(recipe).filter(r=>okAt(r, L));
let picked = store.get('subs', []);
const pickedAt = L => subsAt(L).filter(s=>picked.includes(subKey(s)));
const skillsAt = L => skillsOf(subsAt(L), L);
const activeSkills = L => { const mine=pickedAt(L); return skillsOf(mine.length ? mine : subsAt(L), L); };
const subT = s => `${s.n?`<span class="m-code">${PREFIX}${s.n}</span> `:''}${T(esc(s.name), esc(s.zh))}`;
const tierT = () => { const t=BOARD && (BOARD.tiers||[]).find(x=>x[0]===TIER); return t ? T(t[1], t[2]) : ''; };

// ---------- Chinese for a question: hover over it (computer), press and hold it (phone), or Tab to it ----------
// Only questions with words have Chinese (q.zh); a small 中 marks them. The Chinese shows in a bubble under the question.
const zhBox = zh => `<span class="m-zh-tag" aria-hidden="true" title="${TX('Hover, or press and hold, for Chinese','悬停或长按显示中文')}">中</span><span class="m-zh" lang="zh-CN" role="tooltip" hidden>${zh}</span>`;
const qBox = (cls, inner, zh, tag) => { tag=tag||'div'; return `<${tag} class="${cls}${zh?' m-q':''}"${zh?' tabindex="0"':''}>${inner}${zh?zhBox(zh):''}</${tag}>`; };
function wireZh(el){
  if(!el || el._zh) return; el._zh=true;
  let t=null, x=0, y=0, touched=0;
  const show=on=>{ const z=el.querySelector('.m-zh'); if(!z) return; z.hidden=!on; el.classList.toggle('zh-on', on); };
  el.addEventListener('pointerenter', e=>{ if(e.pointerType==='mouse') show(true); });
  el.addEventListener('pointerleave', e=>{ if(e.pointerType==='mouse') show(false); });
  el.addEventListener('focus', ()=>{ if(Date.now()-touched>1000 && el.matches(':focus-visible')) show(true); });
  el.addEventListener('blur', ()=>show(false));
  el.addEventListener('touchstart', e=>{ const p=e.touches[0]; touched=Date.now(); x=p.clientX; y=p.clientY; clearTimeout(t); t=setTimeout(()=>show(true), 300); }, {passive:true});
  el.addEventListener('touchmove', e=>{ const p=e.touches[0]; if(Math.abs(p.clientX-x)>10 || Math.abs(p.clientY-y)>10){ clearTimeout(t); show(false); } }, {passive:true});
  const end=()=>{ clearTimeout(t); show(false); };
  el.addEventListener('touchend', end); el.addEventListener('touchcancel', end);
  el.addEventListener('contextmenu', e=>{ if(el.classList.contains('m-q')) e.preventDefault(); });
}

// The answer as it is shown (¥12, 25%) and the four choices: the answer and wrong answers from real mistakes
const show = (q, v) => (q.pre||'')+fmt(v)+(q.suf||'');
function prep(q){
  const seen=new Set([show(q,q.ans)]), vals=new Set(), opts=[{v:q.ans, txt:show(q,q.ans), ok:true, why:''}];
  for(const w of shuffle(q.wrongs||[])){ if(opts.length>=4) break; const txt=w.txt || show(q,w.v); if(Math.abs(w.v-q.ans)<1e-9 && !w.txt || seen.has(txt) || vals.has(w.v) || !isFinite(w.v)) continue; seen.add(txt); vals.add(w.v); opts.push({v:w.v, txt, why:w.why, ok:false}); }
  q.mistakes=opts.slice(1);
  if(!q.choice){   // not enough real mistakes: numbers close to the answer
    const s=String(fix(q.ans)), dp=s.includes('.') ? s.length-s.indexOf('.')-1 : 0, st=q.step || Math.pow(10,-dp);
    for(const v of shuffle([q.ans+st, q.ans-st, q.ans+2*st, q.ans-2*st, q.ans+10*st, q.ans-10*st, q.ans*10, q.ans/10])){
      if(opts.length>=4) break; const fv=fix(v), txt=show(q,fv); if(seen.has(txt) || (q.ans>0 && fv<=0)) continue; seen.add(txt); opts.push({v:fv, txt, why:'', ok:false}); }
  }
  q.opts=opts; return q;
}
// An endless supply of questions at the chosen level: one skill after another, never the same question twice in a row,
// and a missed question comes back once, a few questions later
function Source(opt){
  opt=opt||{}; const recent=[], again=[]; let n=0, last=null;
  return {
    next(){
      n++; const r=again.findIndex(x=>x.at<=n); if(r>=0) return again.splice(r,1)[0].q;
      const L=chosenBand(), sks=activeSkills(L);
      for(let t=0;t<80;t++){
        const sk=pick(sks); if(sks.length>1 && sk===last && t<6) continue;
        const q=sk.gen(L); if(!q || (opt.noChoice && q.choice)) continue;
        const k=q.prompt+'|'+q.ans; if(recent.includes(k) && t<50) continue;
        recent.push(k); if(recent.length>30) recent.shift(); last=sk; q.skill=sk.key; q.level=L; return prep(q);
      }
      return null;
    },
    retry(q){ if(q.again) return; q.again=true; again.push({q, at:n+3+Math.floor(Math.random()*3)}); }
  };
}

// ---------- page frame ----------
function frame(back, inner){
  clearTimers(); keyHandler=null; if(stopGame){ stopGame(); stopGame=null; }
  const bar = window.AEA_POINTS ? `<div class="pts" data-points-bar="${SIDE}"></div>` : '';
  $app.innerHTML = `<div class="topline"><span class="navline"><a class="home-mark" href="${ROOT}index.html" aria-label="Academic English App: home" title="Home">${HOME_MARK}</a>${back?`<a class="back" href="${esc(back.href)}">← ${back.html}</a>`:''}</span>${bar}</div>${inner}`;
  if(bar) AEA_POINTS.render(SIDE, 0);
  window.scrollTo(0,0);
}
function shell(title, note){
  frame({href:'#', html:T(esc(TOPIC.name), esc(TOPIC.zh))}, `<div class="bar"><span class="title">${title}</span><span class="spacer"></span><div class="stats" id="stats"></div></div>
    ${note?`<p class="hint">${note} ${T(`Questions marked 中 can be shown in Chinese: ${touch()?'press and hold the question':'hover over the question'}.`, `带“中”的题目可以显示中文：${touch()?'长按题目':'把鼠标放在题目上'}。`)}</p>`:''}<p class="m-level">${levelT(chosenBand())}${(()=>{ const L=chosenBand(), mine=pickedAt(L); return mine.length && mine.length<subsAt(L).length ? ' · '+mine.map(subT).join(', ') : ''; })()}</p><div class="feed" id="feed"></div>`);
}
function showCard(html){
  const feed=document.getElementById('feed'), old=feed.querySelector('.card'); if(old) old.remove();
  const card=document.createElement('div'); card.className='card enter'; card.innerHTML=html; feed.appendChild(card);
  card._q=current;   // the question on this card (handy when testing)
  card.querySelectorAll('.m-q').forEach(wireZh);
  const top=feed.getBoundingClientRect().top; if(top<0) window.scrollBy(0, top-16);
  return card;
}
function Stats(game){
  const s={answered:0, correct:0, streak:0, best:store.get('streak:'+game,0)};
  s.hit=q=>{ s.answered++; s.correct++; s.streak++; if(s.streak>s.best){ s.best=s.streak; store.set('streak:'+game, s.best); } s.draw(); P.record(game,q,true); };
  s.miss=q=>{ s.answered++; s.streak=0; s.draw(); P.record(game,q,false); };
  s.draw=()=>{ const el=document.getElementById('stats'); if(el) el.innerHTML=`<span>${T('Correct','答对')} <b>${s.correct}</b>/${s.answered}</span><span class="streak">${T('Streak','连对')} <b>${s.streak}</b></span><span>${T('Best','最佳')} <b>${s.best}</b></span>`; };
  return s;
}
const fbOk = (fb, html) => fb.innerHTML=`<div class="feedback ok"><span class="verdict">${T('Correct.','答对了！')}</span>${html||''}</div>`;
const fbNo = (fb, answer, html) => fb.innerHTML=`<div class="feedback no"><span class="verdict">${T(`Not quite.${answer?` The answer is ${answer}.`:''}`, `不对。${answer?`答案是 ${answer}。`:''}`)}</span>${html||''}</div>`;
const workHtml = q => q.work ? `<span class="wd m-work">${q.work}</span>` : '';
const whyHtml = (txt, why) => why ? `<span class="m-why"><b>${esc(txt)}</b>: ${why}</span>` : '';
function autoNext(card, next){
  const bar=document.createElement('div'); bar.className='auto'; bar.innerHTML='<i></i>'; bar.style.setProperty('--dur', AUTO_MS+'ms'); card.appendChild(bar);
  requestAnimationFrame(()=>requestAnimationFrame(()=>bar.classList.add('run')));
  let done=false; const fire=()=>{ if(done) return; done=true; clearTimers(); next(); };
  later(fire, AUTO_MS); card.addEventListener('click', e=>{ if(!e.target.closest('button')) fire(); });
  keyHandler=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); fire(); } };
}
function manualNext(card, next){
  const row=document.createElement('div'); row.className='next-row'; row.innerHTML=`<button class="btn">${T('Next','下一题')} →</button>`; card.appendChild(row);
  const b=row.querySelector('button'); b.onclick=next; b.focus({preventScroll:true});
  keyHandler=e=>{ if(e.key==='Enter'){ e.preventDefault(); next(); } };
}
const promptHtml = q => qBox(`m-prompt${q.long?' long':''}`, `${q.prompt}${q.long?'':' <span class="m-eq">= ?</span>'}`, q.zh);
const nothing = () => showCard(`<p>${T('There are no questions for this choice at this level yet. Go back and choose other topics, or another level.','这个级别暂时没有这些内容的题目。请返回选择其他内容或级别。')}</p><p><a class="btn" href="#">${T('Back','返回')}</a></p>`);

let current=null;   // the question being asked
// ================================ GAMES ================================
const GAMES = [
  {key:'choose', col:'quick', name:'Choose the answer', zh:'选择答案', blurb:'Work it out in your head and choose the answer. The wrong answers are the mistakes people really make.', zhBlurb:'心算，然后选出答案。错误选项都是大家常犯的错误。', run:()=>playChoose()},
  {key:'tf', col:'quick', name:'True or false', zh:'判断对错', blurb:'Is the calculation right? Decide quickly.', zhBlurb:'这个算式对吗？快速判断。', run:()=>playTF()},
  {key:'type', col:'work', name:'Type the answer', zh:'输入答案', blurb:'Work it out and type the answer on the number pad.', zhBlurb:'算出答案，用数字键盘输入。', run:()=>playType()},
  {key:'which', col:'work', name:'Which calculation?', zh:'哪个算式？', blurb:'Read a problem in words. Don\'t work it out: choose the calculation that answers it.', zhBlurb:'读一道文字题。不用计算，选出能解答它的算式。', run:()=>playWhich()},
  {key:'spot', col:'check', name:'Spot the mistake', zh:'找出错误', blurb:'Someone has worked it out and gone wrong. Tap the line where the mistake is.', zhBlurb:'有人算错了。点击出错的那一行。', run:()=>playSpot()},
  {key:'whack', col:'arcade', name:'Whack-a-number', zh:'数字打地鼠', blurb:'Numbers pop up and drop again. Tap the answer before it goes.', zhBlurb:'数字会冒出来又落下。在它消失前点中答案。', run:()=>playWhack(), challenge:true},
  {key:'speed', col:'arcade', name:'Speed round', zh:'限时挑战', blurb:'60 seconds. How many can you get right?', zhBlurb:'60 秒内你能答对多少题？', run:()=>playSpeed(), challenge:true}
];
const COLS = [['quick','Quick','快速练习','m-col-quick'], ['work','Work it out','动手算','m-col-work'], ['check','Check the working','检查过程','m-col-check']];
const gameT = g => T(esc(g.name), g.zh);

// ----- Choose the answer -----
function playChoose(){
  const g=GAMES[0], st=Stats('choose'), src=Source();
  shell(gameT(g), T('Tap the answer, or press 1–4.','点击答案，或按 1–4。')); st.draw();
  const step=()=>{ const q=src.next(); if(!q) return nothing(); current=q;
    const opts=shuffle(q.opts);
    const card=showCard(`<p class="instr">${T('Choose the answer','选择答案')}</p>${promptHtml(q)}
      <div class="opts m-opts">${opts.map((o,i)=>`<button class="opt" data-i="${i}"><kbd>${i+1}</kbd><span>${esc(o.txt)}</span></button>`).join('')}</div><div class="fb"></div>`);
    const btns=[...card.querySelectorAll('.opt')]; let done=false;
    const choose=b=>{ if(done) return; done=true; const o=opts[+b.dataset.i];
      btns.forEach(x=>{ x.disabled=true; const y=opts[+x.dataset.i]; if(y.ok) x.classList.add('ok'); else if(x===b) x.classList.add('no'); else x.classList.add('dim'); });
      const fb=card.querySelector('.fb');
      if(o.ok){ fbOk(fb, workHtml(q)); st.hit(q); autoNext(card, step); }
      else { fbNo(fb, esc(show(q,q.ans)), whyHtml(o.txt, o.why)+workHtml(q)); st.miss(q); src.retry(q); manualNext(card, step); } };
    btns.forEach(b=>b.onclick=()=>choose(b));
    keyHandler=e=>{ const n=parseInt(e.key,10); if(n>=1 && n<=btns.length) choose(btns[n-1]); };
  };
  step();
}

// ----- True or false -----
function playTF(){
  const g=GAMES[1], st=Stats('tf'), src=Source();
  shell(gameT(g), T('Is it right? Tap True or False, or press T or F.','对吗？点击“对”或“错”，或按 T / F。')); st.draw();
  const step=()=>{ const q=src.next(); if(!q) return nothing(); current=q;
    // A false statement uses one of the real mistakes (one shown as a plain number, so the sentence reads right)
    const plain=q.mistakes.filter(o=>o.txt===show(q,o.v)), pool=plain.length ? plain : q.opts.slice(1).filter(o=>o.txt===show(q,o.v));
    const truth=Math.random()<.5 || !pool.length, o=truth ? q.opts[0] : pick(pool), val=truth ? q.ans : o.v, txt=show(q,val);
    const sentence = q.stmt ? q.stmt(val) : `${q.prompt} = ${esc(txt)}`;
    const zs = q.zstmt ? q.zstmt(val) : q.zh && !q.long ? `${q.zh} = ${esc(txt)}` : '';
    const card=showCard(`<p class="instr">${T('True or false?','对还是错？')}</p>${qBox(`m-prompt m-statement${q.long?' long':''}`, sentence, zs)}
      <div class="tf-btns"><button class="tfb yes" data-v="1">${T('True','对')}</button><button class="tfb no" data-v="0">${T('False','错')}</button></div><div class="fb"></div>`);
    let done=false;
    const choose=v=>{ if(done) return; done=true; const ok=(v===1)===truth;
      card.querySelectorAll('.tfb').forEach(b=>{ b.disabled=true; b.classList.add(+b.dataset.v===(truth?1:0) ? 'ok' : 'dim'); });
      const fb=card.querySelector('.fb'), extra=(truth ? '' : whyHtml(txt, o.why))+workHtml(q);
      if(ok){ fbOk(fb, extra); st.hit(q); autoNext(card, step); }
      else { fbNo(fb, '', `<span>${truth ? T('It is true.','这是对的。') : T(`It is false: the answer is ${esc(show(q,q.ans))}.`, `这是错的：答案是 ${esc(show(q,q.ans))}。`)}</span>${extra}`); st.miss(q); src.retry(q); manualNext(card, step); } };
    card.querySelectorAll('.tfb').forEach(b=>b.onclick=()=>choose(+b.dataset.v));
    keyHandler=e=>{ const k=e.key.toLowerCase(); if(k==='t'||k==='1') choose(1); if(k==='f'||k==='2') choose(0); };
  };
  step();
}

// ----- Type the answer: an on-screen number pad (a computer keyboard works too) -----
const parseNum = s => { s=String(s).replace(/[,\s]/g,'').replace(/[−–]/g,'-'); if(!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return null; return +s; };
function playType(){
  const g=GAMES[2], st=Stats('type'), src=Source({noChoice:true});
  shell(gameT(g), T(touch() ? 'Tap the numbers, then Check.' : 'Type the answer (or click the numbers), then press Enter.', touch() ? '点击数字，然后点“检查”。' : '输入答案（或点击数字），然后按回车。')); st.draw();
  const step=()=>{ const q=src.next(); if(!q) return nothing(); current=q;
    let typed='', done=false;
    const keys=['7','8','9','4','5','6','1','2','3','−','0','.'];
    const card=showCard(`<p class="instr">${T('Type the answer','输入答案')}</p>${promptHtml(q)}
      <div class="m-ans" id="mAns" aria-live="polite">${q.pre?`<span class="m-unit">${esc(q.pre)}</span>`:''}<span class="m-typed" id="mTyped"></span><span class="m-caret" aria-hidden="true"></span>${q.suf?`<span class="m-unit">${esc(q.suf)}</span>`:''}</div>
      <div class="m-pad">${keys.map(k=>`<button type="button" class="m-key" data-k="${k}">${k}</button>`).join('')}
        <button type="button" class="m-key m-del" data-k="del" aria-label="${TX('Delete','删除')}">⌫</button><button type="button" class="m-key m-check" data-k="ok">${T('Check','检查')}</button></div>
      <p class="m-msg" id="mMsg"></p><div class="fb"></div>`);
    const box=card.querySelector('#mTyped'), msg=card.querySelector('#mMsg'), ans=card.querySelector('#mAns');
    const draw=()=>{ box.textContent=typed; ans.classList.toggle('empty', !typed); };
    const press=k=>{ if(done) return; msg.textContent='';
      if(k==='del') typed=typed.slice(0,-1);
      else if(k==='ok') return check();
      else if(k==='−'){ typed = typed.startsWith('−') ? typed.slice(1) : '−'+typed; }
      else if(k==='.'){ if(!typed.includes('.')) typed += (typed===''||typed==='−') ? '0.' : '.'; }
      else if(typed.replace(/[−.]/g,'').length<10) typed += k;
      draw(); };
    const check=()=>{ const v=parseNum(typed); if(v==null){ msg.textContent=TX('Type a number first.','请先输入一个数字。'); ans.classList.add('shake'); later(()=>ans.classList.remove('shake'), 400); return; }
      done=true; card.querySelectorAll('.m-key').forEach(b=>b.disabled=true);
      const ok=Math.abs(v-q.ans)<1e-9; ans.classList.add(ok?'ok':'no');
      const fb=card.querySelector('.fb');
      if(ok){ fbOk(fb, workHtml(q)); st.hit(q); autoNext(card, step); }
      else { const m=(q.wrongs||[]).find(w=>Math.abs(w.v-v)<1e-9 && Math.abs(w.v-q.ans)>1e-9);
        fbNo(fb, esc(show(q,q.ans)), (m ? whyHtml(show(q,v), m.why) : '')+workHtml(q)); st.miss(q); src.retry(q); manualNext(card, step); } };
    card.querySelectorAll('.m-key').forEach(b=>b.addEventListener('click', ()=>press(b.dataset.k)));
    keyHandler=e=>{ if(done) return; const k=e.key;
      if(/^[0-9]$/.test(k)) press(k); else if(k==='.'||k===',') press('.'); else if(k==='-'||k==='−') press('−');
      else if(k==='Backspace'){ e.preventDefault(); press('del'); } else if(k==='Enter'){ e.preventDefault(); press('ok'); } };
    draw();
  };
  step();
}

// ----- Which calculation? (word problems; the level's problems, not the skills) -----
const evalExpr = e => { const s=String(e).replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/,/g,''); if(!/^[\d\s.+\-*/()]+$/.test(s)) return null; try{ return fix(Function('"use strict";return ('+s+')')()); }catch(x){ return null; } };
function playWhich(){
  const g=GAMES[3], st=Stats('which');
  shell(gameT(g), T('Read the problem. Don\'t work it out: choose the calculation that answers it.','读题。不用计算，选出能解答它的算式。')); st.draw();
  let last=-1; const again=[]; let n=0;
  const nextQ=()=>{ n++; const r=again.findIndex(x=>x.at<=n); if(r>=0) return again.splice(r,1)[0].q;
    const L=chosenBand(), list=TOPIC.which[L]||[];
    for(let t=0;t<40;t++){ const i=Math.floor(Math.random()*list.length); if(i===last && list.length>1 && t<8) continue; const q=list[i](); if(q){ last=i; q.level=L; q.skill='which'; return q; } }
    return null; };
  const step=()=>{ const q=nextQ(); if(!q) return nothing(); current=q;
    const opts=shuffle([{e:q.right, ok:true}, ...q.wrongs]);
    const card=showCard(`<p class="instr">${T('Which calculation answers the question?','哪个算式能解答这个问题？')}</p>${qBox('m-problem', esc(q.text), q.zh, 'p')}
      <div class="opts m-opts m-exprs">${opts.map((o,i)=>`<button class="opt" data-i="${i}"><kbd>${i+1}</kbd><span>${esc(o.e)}</span></button>`).join('')}</div><div class="fb"></div>`);
    const btns=[...card.querySelectorAll('.opt')]; let done=false;
    const choose=b=>{ if(done) return; done=true; const o=opts[+b.dataset.i];
      btns.forEach(x=>{ x.disabled=true; const y=opts[+x.dataset.i]; if(y.ok) x.classList.add('ok'); else if(x===b) x.classList.add('no'); else x.classList.add('dim'); });
      const v=evalExpr(q.right), fb=card.querySelector('.fb'), work=v==null ? '' : `<span class="wd m-work">${esc(q.right)} = ${esc(fmt(v))}</span>`;
      if(o.ok){ fbOk(fb, work); st.hit(q); autoNext(card, step); }
      else { fbNo(fb, esc(q.right), whyHtml(o.e, o.why)+work); st.miss(q); if(!q.again){ q.again=true; again.push({q, at:n+3}); } manualNext(card, step); } };
    btns.forEach(b=>b.onclick=()=>choose(b));
    keyHandler=e=>{ const k=parseInt(e.key,10); if(k>=1 && k<=btns.length) choose(btns[k-1]); };
  };
  step();
}

// ----- Spot the mistake (worked answers; the level's workings, not the skills) -----
function playSpot(){
  const g=GAMES[4], st=Stats('spot');
  shell(gameT(g), T('One line is wrong. Tap the line where the mistake is (the lines after it carry the mistake on).','有一行是错的。点击出错的那一行（后面几行会沿用这个错误）。')); st.draw();
  let last=-1;
  const nextQ=()=>{ const L=chosenBand(), list=TOPIC.spot[L]||[];
    for(let t=0;t<40;t++){ const i=Math.floor(Math.random()*list.length); if(i===last && list.length>1 && t<8) continue; const q=list[i](); if(q){ last=i; q.level=L; q.skill='spot'; return q; } }
    return null; };
  const step=()=>{ const q=nextQ(); if(!q) return nothing(); current=q;
    const card=showCard(`<p class="instr">${T('Spot the mistake','找出错误')}</p>${qBox('m-task', q.task, q.zh, 'p')}
      <div class="m-lines">${q.lines.map((l,i)=>`<button class="m-line" data-i="${i}"><kbd>${i+1}</kbd><span>${l}</span></button>`).join('')}</div><div class="fb"></div>`);
    const btns=[...card.querySelectorAll('.m-line')]; let done=false;
    const choose=b=>{ if(done) return; done=true; const i=+b.dataset.i, ok=i===q.errAt;
      btns.forEach((x,j)=>{ x.disabled=true; if(j===q.errAt) x.classList.add(ok?'ok':'err'); else if(x===b) x.classList.add('no'); else x.classList.add('dim'); });
      btns[q.errAt].insertAdjacentHTML('afterend', `<p class="m-fix">${T('It should be','应该是')}: <b>${q.fix}</b></p>`);
      const fb=card.querySelector('.fb'), why=`<span class="m-why">${q.why}</span>`;
      if(ok){ fbOk(fb, why); st.hit(q); manualNext(card, step); }
      else { fbNo(fb, '', `<span>${T(`The mistake is in line ${q.errAt+1}.`, `错误在第 ${q.errAt+1} 行。`)}</span>${why}`); st.miss(q); manualNext(card, step); } };
    btns.forEach(b=>b.onclick=()=>choose(b));
    keyHandler=e=>{ const k=parseInt(e.key,10); if(k>=1 && k<=btns.length) choose(btns[k-1]); };
  };
  step();
}

// ----- the arcade games' end screen -----
function arcadeEnd(g, score, missed, again){
  clearTimers(); keyHandler=null; document.querySelector('.timer')?.remove();
  const prev=store.get('best:'+g.key,0), isBest=score>prev; if(isBest) store.set('best:'+g.key, score);
  const list=[...new Map(missed.map(q=>[q.prompt,q])).values()].slice(0,8);
  const card=showCard(`<div class="end"><p class="instr">${gameT(g)} · ${T("time's up","时间到")}</p>
    <div class="big">${score}</div><p class="end-sub">${T(score===1?'right answer':'right answers','题答对')}</p>
    <h2>${isBest ? T('New best score!','新纪录！') : T('Best score','最高分')+': '+Math.max(prev,score)}</h2>
    ${list.length?`<p class="instr" style="margin-top:22px">${T('Questions to practise','需要练习的题')}</p><ul class="review">${list.map(q=>`<li>${q.long?q.prompt:q.prompt+' ='} <b>${esc(show(q,q.ans))}</b></li>`).join('')}</ul>`:''}
    <div class="end-actions"><button class="btn" id="again">${T('Play again','再玩一次')}</button><a class="btn alt" href="#">${T('All games','所有游戏')}</a></div></div>`);
  card.querySelector('#again').onclick=again;
  keyHandler=e=>{ if(e.key==='Enter'){ e.preventDefault(); again(); } };
}
const timerBar = () => `<div class="timer"><i id="timeFill"></i></div>`;

// ----- Whack-a-number: the question at the top; numbers pop up from nine holes; tap the answer -----
function playWhack(){
  const g=GAMES[5], SECS=60, N=PHONE?4:5, MAXUP=3, STUN=1000, src=Source(), best=store.get('best:whack',0);
  let score=0; const missed=[];
  frame({href:'#', html:T(esc(TOPIC.name), esc(TOPIC.zh))}, `<div class="bar"><span class="title">${gameT(g)}</span><span class="spacer"></span><div class="stats" id="stats"></div></div>
    <p class="hint">${T(`${touch()?'Tap':'Click (or press its number on)'} the answer while it is up. A wrong number stops your hammer for a second.`, '数字冒出来时，点击正确答案。点错了，锤子会停一秒。')}</p>${timerBar()}<div class="feed" id="feed"></div>`);
  const stats=()=>{ const el=document.getElementById('stats'); if(el) el.innerHTML=`<span>${T('Score','得分')} <b>${score}</b></span><span><b id="wkSecs">${SECS}</b>s</span><span>${T('Best','最佳')} <b>${Math.max(best,score)}</b></span>`; };
  const card=showCard(`<p class="instr">${T('Find the answer','找出答案')}</p><div class="m-prompt m-arcade-q" id="wkQ"></div>
    <div class="whack m-whack" id="wkBoard">${[...Array(9)].map((_,i)=>`<div class="hole"><div class="well"><button type="button" class="mole" tabindex="-1" disabled><span></span></button></div>${touch()?'':`<kbd>${i+1}</kbd>`}</div>`).join('')}
      <div class="arcade-msg" id="wkMsg"><button type="button" class="btn" id="wkGo">${T('Start','开始')}</button></div></div>
    <p class="toast arcade-toast" id="toast" aria-live="polite"></p>`);
  card.classList.add('arcade-card');
  const board=card.querySelector('#wkBoard'), msg=card.querySelector('#wkMsg'), goBtn=card.querySelector('#wkGo');
  const alive=()=>document.body.contains(board);
  const holes=[...board.querySelectorAll('.hole')].map(el=>({el, mole:el.querySelector('.mole'), o:null, up:false, token:0}));
  let q=null, choices=[], target=null, firstTry=true, between=false, pops=0, sinceT=0, stunnedTill=0, upMs=PHONE?2700:2500, gap=PHONE?760:700;
  let started=false, paused=false, over=false, end=0, left=SECS*1000, loop=0;
  const say=(m,bad)=>{ const t=card.querySelector('#toast'); if(t){ t.textContent=m; t.className='toast arcade-toast'+(bad?' no':''); } };
  function newQuestion(){
    q=src.next(); if(!q){ over=true; return nothing(); } card._q=q; firstTry=true; between=false; pops=0; sinceT=0;
    choices=q.opts.slice(0, N); target=choices[0];
    const wq=card.querySelector('#wkQ'), zb=q.zh ? zhBox(q.zh) : ''; wq.innerHTML = q.long ? `<span class="long">${q.prompt}${zb}</span>` : `${q.prompt} <span class="m-eq">= ?</span>${zb}`;
    wq.classList.toggle('m-q', !!q.zh); wireZh(wq);
  }
  function up(h,o){ h.o=o; h.up=true; const my=++h.token, span=h.mole.querySelector('span'); span.textContent=o.txt; h.mole.className='mole'; h.mole.disabled=false;
    requestAnimationFrame(()=>{ if(h.token===my) h.mole.classList.add('up'); }); later(()=>{ if(h.token===my) down(h); }, upMs); }
  function down(h){ const my=++h.token; h.up=false; h.mole.classList.remove('up'); h.mole.disabled=true; later(()=>{ if(h.token===my){ h.o=null; h.mole.className='mole'; } }, 260); }
  function spawn(){
    if(between) return; const upNow=holes.filter(h=>h.up), free=holes.filter(h=>!h.up && !h.o); if(upNow.length>=MAXUP || !free.length) return;
    const targetUp=upNow.some(h=>h.o===target), others=choices.filter(o=>o!==target && !upNow.some(h=>h.o===o));
    const wantT=!targetUp && (pops===1 || sinceT>=2 || Math.random()<.35 || !others.length); if(!wantT && !others.length) return;
    const o=wantT ? target : pick(others); up(pick(free), o); pops++; sinceT = o===target ? 0 : sinceT+1;
  }
  const run=()=>{ const my=++loop; const t=()=>{ if(my!==loop || over || paused || !alive()) return; spawn(); later(t, gap); }; later(t, 250); };
  function tap(h){
    if(!started || paused || over || between || !h.up || performance.now()<stunnedTill) return;
    if(h.o===target){ score++; stats(); if(firstTry) P.record('whack', q, true); h.mole.classList.add('hit'); say('✓ '+target.txt);
      upMs=Math.max(PHONE?1700:1500, upMs-60); gap=Math.max(460, gap-15); between=true; holes.forEach(o=>{ if(o!==h && o.up) down(o); });
      later(()=>down(h), 380); later(newQuestion, 520); }
    else { h.mole.classList.add('bad'); if(firstTry){ firstTry=false; P.record('whack', q, false); missed.push(q); }
      say(`✗ ${h.o.txt}${h.o.why?': '+h.o.why.replace(/<sup>(.*?)<\/sup>/g,'^$1').replace(/<[^>]+>/g,''):''}`, true); stunnedTill=performance.now()+STUN; board.classList.add('stunned'); later(()=>board.classList.remove('stunned'), STUN); later(()=>down(h), 320); }
  }
  function start(){ if(started) return; started=true; msg.hidden=true; end=Date.now()+SECS*1000; run(); clock(); }
  function pause(){ if(!started || paused || over) return; paused=true; left=Math.max(0, end-Date.now()); holes.forEach(h=>{ if(h.up) down(h); }); goBtn.innerHTML=T('Carry on','继续'); msg.hidden=false; }
  function resume(){ if(!paused || over) return; paused=false; end=Date.now()+left; msg.hidden=true; run(); }
  function clock(){ if(over || !alive()) return; const l=paused ? left : Math.max(0, end-Date.now()), f=document.getElementById('timeFill'), s=document.getElementById('wkSecs');
    if(f) f.style.width=(100*l/(SECS*1000))+'%'; if(s) s.textContent=Math.ceil(l/1000);
    if(l<=0){ over=true; holes.forEach(h=>{ if(h.up) down(h); }); return arcadeEnd(g, score, missed, playWhack); } later(clock, 200); }
  holes.forEach(h=>h.mole.addEventListener('pointerdown', e=>{ e.preventDefault(); tap(h); }));
  goBtn.onclick=()=>{ started ? resume() : start(); };
  keyHandler=e=>{ const n=parseInt(e.key,10); if(n>=1 && n<=9){ e.preventDefault(); tap(holes[n-1]); } else if((e.key===' '||e.key==='Enter') && (!started||paused)){ e.preventDefault(); started ? resume() : start(); } };
  const onVis=()=>{ if(!alive()){ document.removeEventListener('visibilitychange', onVis); return; } if(document.hidden) pause(); };
  document.addEventListener('visibilitychange', onVis);
  stopGame=()=>{ over=true; };
  stats(); newQuestion(); goBtn.focus({preventScroll:true});
}

// ----- Speed round: 60 seconds of Choose the answer -----
function playSpeed(){
  const g=GAMES[6], SECS=60, src=Source(), best=store.get('best:speed',0); let score=0, missed=[], over=false, started=false, end=0;
  frame({href:'#', html:T(esc(TOPIC.name), esc(TOPIC.zh))}, `<div class="bar"><span class="title">${gameT(g)}</span><span class="spacer"></span><div class="stats" id="stats"></div></div>
    <p class="hint">${T('As many right answers as you can in 60 seconds. Press 1–4 or tap.','60 秒内尽量多答对。按 1–4 或点击。')}</p>${timerBar()}<div class="feed" id="feed"></div>`);
  const stats=()=>{ const el=document.getElementById('stats'); if(el) el.innerHTML=`<span>${T('Score','得分')} <b>${score}</b></span><span><b id="spSecs">${SECS}</b>s</span><span>${T('Best','最佳')} <b>${Math.max(best,score)}</b></span>`; };
  const clock=()=>{ if(over) return; const l=Math.max(0, end-Date.now()), f=document.getElementById('timeFill'), s=document.getElementById('spSecs');
    if(f) f.style.width=(100*l/(SECS*1000))+'%'; if(s) s.textContent=Math.ceil(l/1000);
    if(l<=0){ over=true; return arcadeEnd(g, score, missed, playSpeed); } later(clock, 200); };
  const step=()=>{ if(over) return; const q=src.next(); if(!q) return nothing(); current=q; const opts=shuffle(q.opts);
    const card=showCard(`<p class="instr">${T('Choose the answer','选择答案')}</p>${promptHtml(q)}<div class="opts m-opts">${opts.map((o,i)=>`<button class="opt" data-i="${i}"><kbd>${i+1}</kbd><span>${esc(o.txt)}</span></button>`).join('')}</div>`);
    const btns=[...card.querySelectorAll('.opt')]; let done=false;
    const choose=b=>{ if(done||over) return; done=true; const o=opts[+b.dataset.i];
      btns.forEach(x=>{ x.disabled=true; const y=opts[+x.dataset.i]; if(y.ok) x.classList.add('ok'); else if(x===b) x.classList.add('no'); else x.classList.add('dim'); });
      if(o.ok){ score++; P.record('speed', q, true); stats(); later(step, 250); } else { P.record('speed', q, false); missed.push(q); later(step, 900); } };
    btns.forEach(b=>b.onclick=()=>choose(b));
    keyHandler=e=>{ const n=parseInt(e.key,10); if(n>=1 && n<=btns.length) choose(btns[n-1]); };
  };
  const card=showCard(`<div class="end"><p class="instr">${gameT(g)}</p><h2>${T('Ready?','准备好了吗？')}</h2><p>${T('60 seconds, as many as you can.','60 秒，尽量多答。')}</p><div class="end-actions"><button class="btn" id="go">${T('Start','开始')}</button></div></div>`);
  const go=()=>{ if(started) return; started=true; end=Date.now()+SECS*1000; clock(); step(); };
  card.querySelector('#go').onclick=go; keyHandler=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); go(); } };
  stopGame=()=>{ over=true; };
  stats();
}

// ================================ THE TOPIC MENU ================================
function levelsHtml(){
  const mine=P.known() ? myBand() : null, cb=chosenBand();
  return `<p class="set-head levels-head">${T('Level','级别')}</p><div class="sets levels" role="group" aria-label="${TX('Level','级别')}">${[1,2,3,4,5].map(b=>
    `<button class="chip${b===mine?' chip-good':''}" data-band="${b}" aria-pressed="${b===cb}"><span class="chip-label"><span class="chip-en t-en">${LEVEL_NAMES[b].replace(/\+$/,'<span class="plus">+</span>')}</span><span class="chip-zh t-zh" lang="zh-CN">${LEVEL_ZH[b]}</span></span></button>`).join('')}</div>`;
}
function levelLine(){
  const t=P.topic(), n=t?t.n:0;
  if(n<CAL){ const left=CAL-n; return `<div class="lvl-line"><p class="lvl-k">${T('Your level','你的水平')}: <span class="lvl-now">${T('finding it','正在评估')}</span> <span class="lvl-more">(${T(`${left} more answer${left===1?'':'s'}`, `还需 ${left} 题`)})</span></p>
    <span class="lvl-bar lvl-divider" role="img" aria-label="Finding your level: ${n} of ${CAL} answers"><i style="width:${n*100/CAL}%"></i></span></div>`; }
  const b=Math.floor(t.r), pct=b>=5 ? 100 : Math.round((t.r-b)*100);
  return `<div class="lvl-line"><p class="lvl-k">${T('Your level','你的水平')}: <span class="lvl-now">${levelT(b)}</span></p>
    <span class="lvl-bar lvl-divider" role="img" aria-label="${pct}%"><i style="width:${pct}%"></i></span></div>`;
}
function skillsHtml(){
  const L=chosenBand(), at=subsAt(L), mine=new Set(pickedAt(L).map(subKey)), all=!mine.size || mine.size===at.length;
  const soon=SUBS.filter(s=>!s.skills.length && !s.calc);
  return `<section class="m-skills" aria-labelledby="mSkillsH"><p class="set-head" id="mSkillsH">${BTOPIC ? T('Syllabus topics at this level','本级别的考纲内容') : T('Skills at this level','本级别的技能')}</p>
    <div class="sets m-skill-chips"><button class="chip chip-all" data-skill="*" aria-pressed="${all}">${T('All','全部')}</button>${at.map(s=>`<button class="chip" data-skill="${esc(subKey(s))}" aria-pressed="${!all && mine.has(subKey(s))}">${subT(s)}</button>`).join('')}</div>
    <p class="setnote">${T('Choose one or more to practise just those. Which calculation? and Spot the mistake use the whole level.','可以只选一个或几个内容来练习。“哪个算式？”和“找出错误”使用整个级别的题目。')}</p>
    ${soon.length ? `<p class="setnote m-soon">${T('Still to come','即将推出')}: ${soon.map(s=>`${PREFIX}${s.n} ${T(esc(s.name), esc(s.zh))}`).join(', ')}</p>` : ''}</section>`;
}
function gameCard(g){
  const best=store.get((g.challenge?'best:':'streak:')+g.key, 0);
  return `<a class="game" href="#play-${g.key}">${g.challenge?`<span class="game-tag">${T('Arcade','街机')}</span>`:''}<h3>${gameT(g)}</h3><p>${T(esc(g.blurb), g.zhBlurb)}</p>
    <span class="best">${best ? (g.challenge?T('Best score','最高分'):T('Best streak','最佳连对'))+': '+best : T('Not played yet','还没玩过')}</span></a>`;
}
function menu(){
  tidyChoice();
  frame({href:CFG.back||'../index.html', html:T('Maths','数学')}, `
  <section class="hero hero-compact m-hero">
    <p class="eyebrow">${BOARD ? `${T(esc(BOARD.short), esc(BOARD.zh))} · ${tierT()} · <a href="${esc(CFG.back||'../index.html')}">${T('change','更改')}</a>` : T('Maths · tester','数学 · 测试版')}</p>
    <h1>${BTOPIC ? `<span class="m-topic-n">${esc(BTOPIC.n)}</span> ` : ''}${T(esc(BTOPIC ? BTOPIC.name : TOPIC.name), esc(BTOPIC ? BTOPIC.zh : TOPIC.zh))}</h1>
    ${levelsHtml()}
    ${levelLine()}
  </section>
  ${skillsHtml()}
  <div class="cols m-cols">${COLS.map(([k,en,zh,cls])=>`<section class="col ${cls}" aria-labelledby="mc-${k}"><h2 id="mc-${k}">${T(en,zh)}</h2>${GAMES.filter(g=>g.col===k).map(gameCard).join('')}</section>`).join('')}</div>
  <section class="m-arcade" aria-labelledby="mc-arcade"><h2 id="mc-arcade">${T('Arcade','街机游戏')}</h2><div class="m-arcade-games">${GAMES.filter(g=>g.col==='arcade').map(gameCard).join('')}</div></section>`);
  $app.querySelectorAll('.levels .chip').forEach(c=>c.onclick=()=>{ const y=window.scrollY; chooseBand(+c.dataset.band); menu(); window.scrollTo(0,y); });
  $app.querySelectorAll('.m-skill-chips .chip').forEach(c=>c.onclick=()=>{
    const y=window.scrollY, k=c.dataset.skill, L=chosenBand(), at=subsAt(L).map(subKey);
    if(k==='*') picked=[];
    else { const cur=new Set(pickedAt(L).map(subKey)); cur.has(k) ? cur.delete(k) : cur.add(k); picked=[...cur]; if(picked.length===at.length) picked=[]; }
    store.set('subs', picked); menu(); window.scrollTo(0,y); });
}

// ---------- router ----------
function route(){
  const h=location.hash.replace(/^#/,'');
  if(h.startsWith('play-')){ const g=GAMES.find(x=>x.key===h.slice(5)); if(g) return g.run(); }
  menu();
}
window.addEventListener('hashchange', route);
window.addEventListener('resize', ()=>{ const p=isPhone(); if(p!==PHONE){ PHONE=p; document.documentElement.classList.toggle('phone', PHONE); if(!location.hash) route(); } });
route();
})();
