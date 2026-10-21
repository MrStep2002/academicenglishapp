// English games engine: one set of games for every subject.
// A subject page loads its data (window.SUBJECT) and then this file.
// Routes (the part after # in the address): menu, #vocab, #grammar, #reading, #play-<game>, #words
(function(){
'use strict';
const S = window.SUBJECT;
// The site's top folder, worked out from where this file lives (en/engine/app.js), so links work on any host and from a local copy
const ROOT = ((document.currentScript && document.currentScript.src) || '/en/engine/app.js').replace(/en\/engine\/app\.js([?#].*)?$/, '');
const $app = document.getElementById('app');
const CFG = $app.dataset;               // data-name, data-blurb, data-back, data-back-label, data-only, data-sets, data-store
// data-sets: this page uses only some of the data's sets. Drop everything else, so the page only lists games it has content for.
if(CFG.sets){ const keep=CFG.sets.split(','); S.sets=S.sets.filter(x=>keep.includes(x.id));
  for(const k of ['words','gaps','builds','errors','tf','reads','questions','extracts']) if(Array.isArray(S[k])) S[k]=S[k].filter(x=>keep.includes(x.set)); }
const KEY = CFG.store || S.key;
const AUTO_MS = 1500;

// ---------- helpers ----------
const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuffle = a => { a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const store = {
  get(k,d){ try{ const v=localStorage.getItem('aea:'+KEY+':'+k); return v==null?d:JSON.parse(v);}catch(e){return d;} },
  set(k,v){ try{ localStorage.setItem('aea:'+KEY+':'+k, JSON.stringify(v)); }catch(e){} }
};
const byId = Object.fromEntries(S.words.map(w=>[w.id,w]));
const alikeOf = {}; (S.alike||[]).forEach((g,i)=>g.forEach(id=>{ (alikeOf[id]=alikeOf[id]||new Set()).add(i); }));
const areAlike = (a,b) => { const A=alikeOf[a], B=alikeOf[b]; if(!A||!B) return false; for(const x of A) if(B.has(x)) return true; return false; };

// ---------- LEVELS AND PROGRESS (saved in this browser) ----------
// One scale for the whole site: A1=1, A2=2, B1=3, B2=4, C1=5 ("+" adds half a level).
// Every answer moves the student's level for this topic towards the level of the work they get right
// (a rating that starts at B1 on the English side and A2 on the Chinese side, or at their overall level
// once they have one). Every word they meet moves through stages: new → learning → familiar → known,
// and can only move up again after a wait (10 minutes, 1 day, 3 days), so "known" means remembered over days.
// Games then deal work close to the student's level first, plus words that are due for review.
const LEVEL_CODES = ['', 'A1', 'A2', 'B1', 'B2', 'C1'];
const LEVEL_NAMES = {A1:'Foundation', A2:'Foundation+', B1:'Intermediate', B2:'Intermediate+', C1:'Advanced'};   // names students see (codes stay hidden)
const LEVEL_ZH = {A1:'基础', A2:'基础+', B1:'中级', B2:'中级+', C1:'高级'};   // beside the names on the Chinese side
const levelNum = code => { if(code==null || code==='') return null; if(typeof code==='number') return code;
  const m=String(code).trim().toUpperCase().match(/^([ABC])([12])(\+)?/); if(!m) return null;
  return ({A:0,B:2,C:4})[m[1]] + (+m[2]) + (m[3]?0.5:0); };
// The name students see for a level code. B1+ (the upper half of B1) has B1's name.
const levelName = code => { const n=levelNum(code); return n==null ? String(code||'') : LEVEL_NAMES[LEVEL_CODES[Math.max(1,Math.min(5,Math.floor(n)))]]; };
const setLevel = {}; S.sets.forEach(s=>{ setLevel[s.id]=levelNum(s.level); });
// For the big serif headings: the serif font's + is tiny, so it is set in the body font
const nameHtml = n => esc(n).replace(/\+$/, '<span class="plus">+</span>');
const wordOf = it => !it ? null : (byId[it.id]===it ? it : (it.wid && byId[it.wid]) || null);
const itemLevel = it => { if(!it) return null; const own=levelNum(it.level); if(own!=null) return own;
  const w=wordOf(it); if(w && w!==it){ const wl=levelNum(w.level); if(wl!=null) return wl; }
  return it.set!=null && setLevel[it.set]!=null ? setLevel[it.set] : null; };
const P = (function(){
  const STORE='aea:progress:v1', CAL=10, DAY=864e5, WAIT=[0, 6e5, DAY, 3*DAY, 7*DAY];
  const GUESS={match:.2, syn:.2, zhmatch:.2, tf:.5, zhtf:.5, zhtype:0, error:.1, build:.05};   // chance of a lucky guess
  // Always re-read before using, so two open tabs never overwrite each other's progress
  const load=()=>{ let d; try{ d=JSON.parse(localStorage.getItem(STORE))||{}; }catch(e){ d={}; }
    d.topics=d.topics||{}; d.words=d.words||{}; d.days=d.days||{}; return d; };
  let data=load();
  const save=()=>{ try{ localStorage.setItem(STORE, JSON.stringify(data)); }catch(e){} };
  const dayKey=x=>x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');
  const zhSide = CFG.only==='zh' || /^zh/.test(KEY);
  const overall = () => { let sum=0, n=0; Object.values(data.topics).forEach(t=>{ if(t.n>=CAL){ sum+=t.r*t.n; n+=t.n; } }); return n ? sum/n : null; };
  const topic = () => { data=load(); return data.topics[KEY]; };
  // A new topic starts from the student's level elsewhere, if there is one. That start is only a guess,
  // but it is better than nothing, so it counts as a few answers (h) and the first answers move it less.
  const ensure = () => { if(data.topics[KEY]) return data.topics[KEY]; const o=overall();
    return (data.topics[KEY]={name:CFG.name||KEY, side:zhSide?'zh':'en', href:location.pathname, r:o ?? (zhSide?2:3), h:o==null?0:3, n:0, right:0}); };
  const label = r => { const b=Math.max(1, Math.min(5, Math.floor(r))), code=LEVEL_CODES[b];
    return {code, name:LEVEL_NAMES[code]||'', zh:LEVEL_ZH[code]||'', pct: b>=5 ? 100 : Math.round((r-b)*100), next: LEVEL_NAMES[LEVEL_CODES[b+1]]||''}; };
  const record = (game, item, ok) => {
    try{
      data=load();
      const t=ensure(), before=t.n, now=Date.now(), d=itemLevel(item);
      t.n++; if(ok) t.right++; t.last=now; t.href=location.pathname; if(CFG.name) t.name=CFG.name;
      const dk=dayKey(new Date()); data.days[dk]=(data.days[dk]||0)+1;
      let msg='';
      if(d!=null){
        const g=GUESS[game] ?? .25, p=g+(1-g)/(1+Math.exp(-2.5*(t.r-d)));
        const k=Math.max(.12, .8/Math.sqrt(before+(t.h||0)+1)), oldBand=Math.floor(t.r);
        t.r=Math.max(1, Math.min(5.99, t.r + k*((ok?1:0)-p)));
        const L=label(t.r);
        if(t.n===CAL) msg=`We've found your level: ${L.name}`+(zhSide?` · 你的水平：${L.zh}`:'');
        else if(t.n>CAL && Math.floor(t.r)>oldBand) msg=`Level up! You've reached ${L.name}`+(zhSide?` · 升级到${L.zh}！`:'');
      }
      const words = item && item.ids ? item.ids.map(id=>byId[id]).filter(Boolean) : [wordOf(item)].filter(Boolean);
      words.forEach(w=>{ const rec=data.words[w.id] || (data.words[w.id]={s:0, due:0});
        if(ok){ if(now>=rec.due && rec.s<4){ rec.s++; rec.due=now+WAIT[rec.s]; } }
        else { rec.s=Math.max(rec.s?1:0, rec.s-1); rec.due=now; } });
      let known=0, fam=0, learn=0;
      S.words.forEach(w=>{ const s=(data.words[w.id]||{}).s||0; if(s>=4) known++; else if(s>=2) fam++; else if(s>=1) learn++; });
      t.words={total:S.words.length, known, fam, learn};
      save(); if(msg) toastLevel(msg);
    }catch(e){ console.warn('Progress not saved:', e); }
  };
  // Sets whose level is close to the student's (from this topic once found, otherwise their overall level)
  const recommended = () => { const t=topic(); const r = t && t.n>=CAL ? t.r : overall(); if(r==null) return [];
    return S.sets.filter(s=>{ const l=setLevel[s.id]; return l!=null && l>=r-0.75 && l<=r+1; }).map(s=>s.id); };
  const rating = () => { const t=topic(); return t ? t.r : (overall() ?? (zhSide?2:3)); };
  return {record, topic, label, recommended, overall, rating, CAL, refresh:()=>(data=load()), wordRec:id=>data.words[id], dayKey};
})();
// Order a round so that work near the student's level comes first, then words due for review;
// words already known come last. Items with no level are simply shuffled.
function rankForLevel(items){
  const target=P.rating()+0.25, now=Date.now();
  return items.map(it=>{ let sc=Math.random()*0.6; const d=itemLevel(it); if(d!=null) sc+=Math.abs(d-target);
      const w=wordOf(it), rec=w && P.wordRec(w.id);
      if(rec){ if(rec.s>=1 && rec.s<4 && rec.due<=now) sc-=0.6; else if(rec.s>=4 && rec.due>now) sc+=0.8; }
      return [sc,it]; }).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
}
function toastLevel(msg){ const t=document.createElement('div'); t.className='lvl-toast'; t.setAttribute('role','status'); t.textContent=msg;
  document.body.appendChild(t); setTimeout(()=>t.remove(), 3800); }

// First visit: the sets that suit the student's level (once it is known), otherwise the sets the data says to start with (S.start), otherwise all of them.
const startSets = () => { const rec=P.recommended(); if(rec.length) return rec; return S.start && S.start.length ? S.start : S.sets.map(s=>s.id); };
let chosen = store.get('sets', startSets());
chosen = chosen.filter(id=>S.sets.some(s=>s.id===id)); if(!chosen.length) chosen=startSets();
const inSets = x => chosen.includes(x.set);
const pick = list => (list||[]).filter(inSets);

// Phone or computer: decided automatically, and checked again if the window changes size.
const isPhone = () => {
  const coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  const small = Math.min(screen.width||9999, screen.height||9999) < 600;
  return (coarse && small) || window.innerWidth < 520;
};
let PHONE = isPhone();
document.documentElement.classList.toggle('phone', PHONE);

let keyHandler=null, timers=[];
document.addEventListener('keydown', e => { if(keyHandler && !e.metaKey && !e.ctrlKey && !e.altKey && e.target.tagName!=='INPUT') keyHandler(e); });
const later = (fn,ms) => { const t=setTimeout(fn,ms); timers.push(t); return t; };
const clearTimers = () => { timers.forEach(clearTimeout); timers=[]; };

// Endless deck: shuffled, refilled when empty; missed items come back a few cards later.
function Deck(items){
  let queue=[], last=null; const retried=new Set();
  const refill=()=>{ queue=rankForLevel(items); if(queue.length>1 && queue[0]===last) queue.push(queue.shift()); };
  return {
    next(){ if(!queue.length) refill(); last=queue.shift(); return last; },
    // A missed item comes back once, a few cards later. Missed again, it waits for the next round,
    // so a student who is struggling still meets new items instead of the same few on a loop.
    retry(item){ if(retried.has(item)){ retried.delete(item); return; } retried.add(item);
      const pos=Math.min(queue.length, 3+Math.floor(Math.random()*3)); queue.splice(pos,0,item); }
  };
}
function Stats(game){
  const s={answered:0,correct:0,streak:0,best:store.get('streak:'+game,0)};
  s.hit=(item)=>{ s.answered++; s.correct++; s.streak++; if(s.streak>s.best){ s.best=s.streak; store.set('streak:'+game,s.best);} s.draw(); P.record(game,item,true); };
  s.miss=(item)=>{ s.answered++; s.streak=0; s.draw(); P.record(game,item,false); };
  s.draw=()=>{ const el=document.getElementById('stats'); if(!el) return;
    el.innerHTML=`<span>Correct <b>${s.correct}</b>/${s.answered}</span><span class="streak">Streak <b>${s.streak}</b></span><span>Best <b>${s.best}</b></span>`; };
  return s;
}

// ---------- categories and games ----------
const CATS = {
  vocab:   {name:'Vocabulary', blurb:'Learn what the words mean and which words go together.'},
  grammar: {name:'Grammar',    blurb:'Use the words accurately: word forms, verb forms, sentence building.'},
  reading: {name:'Reading',    blurb:'Read longer texts and work out meaning in context.', desktop:true}
};
const GAMES = [
  {key:'match',    cat:'vocab',   name:'Match the meaning', blurb:'Pair words with their meanings. Cleared pairs are replaced, so it keeps going.', items:()=>pick(S.words), min:6, run:()=>playMatch('def')},
  {key:'syn',      cat:'vocab',   name:'Synonym groups',    blurb:'Match each word to a group of words with a similar meaning.', items:()=>pick(S.words).filter(w=>w.syn&&w.syn.length), min:6, run:()=>playMatch('syn')},
  {key:'meaning',  cat:'vocab',   name:'Word or meaning',   blurb:'See a word and choose its meaning, or see a meaning and choose the word.', items:()=>pick(S.words), min:4, run:()=>playMeaning()},
  {key:'gap',      cat:'grammar', name:'Fill the gap',      blurb:'Choose the word or form that fits the sentence.', items:()=>pick(S.gaps), min:1, run:()=>playGap()},
  {key:'build',    cat:'grammar', name:'Build the sentence',blurb:'Put the coloured pieces in order. Watch out for trap pieces.', items:()=>pick(S.builds), min:1, run:()=>playBuild()},
  {key:'error',    cat:'grammar', name:'Spot the error',    blurb:'Read a paragraph and tap every word with a grammar mistake.', items:()=>pick(S.errors), min:1, run:()=>playErr()},
  {key:'tf',       cat:'grammar', name:'True or false',     blurb:'Decide quickly whether each statement about the language is right.', items:()=>pick(S.tf), min:1, run:()=>playTF()},
  {key:'passage',  cat:'reading', name:'Read and answer',   blurb:'Read a passage, then choose the best answer to each question.', items:()=>S.passages||[], min:1, run:()=>playPassage()},
  {key:'own',      cat:'reading', name:'In your own words', blurb:'Paper 1 style: what does the writer mean by each underlined word, in context?', items:()=>pick(S.extracts), min:1, run:()=>playOwn()},
  {key:'read',     cat:'reading', name:'Read it',           blurb:'Read a short text about a media product and answer a question.', items:()=>pick(S.reads), min:1, run:()=>playRead()},
  {key:'question', cat:'reading', name:'Answer the question', blurb:'Read an exam question and choose the answer that does what it asks.', items:()=>pick(S.questions), min:1, run:()=>playQuestion()}
];
// Only games this subject has content for
const gamesIn = cat => GAMES.filter(g => g.cat===cat && (S[{match:'words',syn:'words',meaning:'words',gap:'gaps',build:'builds',error:'errors',tf:'tf',own:'extracts',read:'reads',question:'questions',passage:'passages'}[g.key]]||[]).length && (g.key!=='syn' || S.words.some(w=>w.syn)));

// ---------- page frame ----------
function frame(back, inner){
  clearTimers(); keyHandler=null; document.body.classList.remove('reading-wide');
  $app.innerHTML = `${back?`<a class="back" href="${esc(back.href)}">← ${esc(back.label)}</a>`:''}${inner}`;
  window.scrollTo(0,0);
}
function go(hash){ if(location.hash===hash || (!hash && !location.hash)) route(); else location.hash=hash; }

// ---------- SUBJECT MENU ----------
function menu(){
  const n = pick(S.words).length;
  frame({href:CFG.back||'../index.html', label:CFG.backLabel||'Subjects'}, `
  <section class="hero">
    <p class="eyebrow">English games</p>
    <h1>${esc(CFG.name||'')}</h1>
    <p>${esc(CFG.blurb||'')}</p>
    ${S.sets.length>1?`<div class="sets" role="group" aria-label="Topics and levels">
      ${S.sets.map(s=>{ const tag=s.level?levelName(s.level):s.lv;
        return `<button class="chip${P.recommended().includes(s.id)?' chip-good':''}" data-set="${s.id}" aria-pressed="${chosen.includes(s.id)}">${esc(s.name)}${tag&&tag!==s.name?` <small>${esc(tag)}</small>`:''}</button>`; }).join('')}
    </div>`:''}
    <p class="setnote">${n} words selected.</p>
    ${levelCard()}
  </section>
  <div class="cats">
    ${Object.entries(CATS).map(([k,c])=>{
      const off = c.desktop && PHONE, games = gamesIn(k);
      const none = !games.length;
      return `<a class="cat cat-${k}${off||none?' off':''}" ${off||none?'aria-disabled="true"':`href="#${k}"`}>
        <span class="cat-name">${c.name}</span>
        <span class="cat-blurb">${c.blurb}</span>
        <span class="cat-meta">${off?'Only available on desktop devices':none?'Coming soon':games.map(g=>esc(g.name)).join(' · ')}</span>
      </a>`;}).join('')}
  </div>
  <div class="wl-link"><p>The word list has every word, its meaning and an example sentence.</p><a class="btn alt" href="#words">Open word list</a></div>`);
  $app.querySelectorAll('.chip').forEach(c=>c.onclick=()=>{
    const s=c.dataset.set;
    if(chosen.includes(s)){ if(chosen.length>1) chosen=chosen.filter(x=>x!==s); } else chosen=S.sets.map(x=>x.id).filter(x=>x===s||chosen.includes(x));
    store.set('sets',chosen); menu();
  });
  wirePickLevel(menu);
}

// ---------- CATEGORY: list of games ----------
function category(cat){
  const c=CATS[cat];
  if(c.desktop && PHONE){
    frame({href:'#', label:CFG.name||'Back'}, `<section class="hero"><p class="eyebrow">${esc(CFG.name||'')}</p><h1>${c.name}</h1>
      <p class="notice">Reading games are only available on desktop devices. Open this page on a computer to play them.</p></section>`);
    return;
  }
  const note = cat==='reading' && readingState==='loading' ? '<p class="notice">Loading reading passages…</p>' : cat==='reading' && readingState==='failed' ? '<p class="notice">The reading passages could not be loaded. They load when the site is online.</p>' : '';
  frame({href:'#', label:CFG.name||'Back'}, `
  <section class="hero"><p class="eyebrow">${esc(CFG.name||'')}</p><h1>${c.name}</h1><p>${c.blurb}</p>${note}</section>
  <div class="games">${gamesIn(cat).map(g=>{
    const n=g.items().length, off=n<g.min, best=store.get('streak:'+g.key,0);
    return `<a class="game${off?' off':''}" ${off?'aria-disabled="true"':`href="#play-${g.key}"`}>
      <h3>${g.name}</h3><p>${g.blurb}</p>
      <span class="best">${off?'None in your selected topics':best?'Best streak: '+best:'Not played yet'}</span></a>`;}).join('')}
  </div>`);
}

// ---------- game shell ----------
function shell(game, note){
  const c=CATS[game.cat];
  frame(CFG.only ? {href:CFG.back||'../index.html', label:CFG.backLabel||'Back'} : {href:'#'+game.cat, label:c.name}, `<div class="bar"><span class="title">${game.name}</span><span class="spacer"></span><div class="stats" id="stats"></div></div>
    ${note?`<p class="hint">${note}</p>`:''}<div class="feed" id="feed"></div>`);
}
function showCard(html){
  const feed=document.getElementById('feed');
  const old=feed.querySelector('.card'); if(old) old.remove();
  const card=document.createElement('div'); card.className='card enter'; card.innerHTML=html;
  feed.appendChild(card);
  const top=feed.getBoundingClientRect().top; if(top<0) window.scrollBy(0, top-16);
  return card;
}
function autoNext(card, next){
  const bar=document.createElement('div'); bar.className='auto'; bar.innerHTML='<i></i>';
  bar.style.setProperty('--dur', AUTO_MS+'ms'); card.appendChild(bar);
  requestAnimationFrame(()=>requestAnimationFrame(()=>bar.classList.add('run')));
  let done=false; const fire=()=>{ if(done) return; done=true; clearTimers(); next(); };
  later(fire, AUTO_MS);
  card.addEventListener('click', e=>{ if(!e.target.closest('button')) fire(); });
  keyHandler = e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); fire(); } };
}
function manualNext(card, next, label){
  const row=document.createElement('div'); row.className='next-row';
  row.innerHTML=`<button class="btn">${label||'Next →'}</button>`; card.appendChild(row);
  const b=row.querySelector('button'); b.onclick=next; b.focus({preventScroll:true});
  keyHandler = e=>{ if(e.key==='Enter'){ e.preventDefault(); next(); } };
}
const wordNote = w => w ? `<span class="wd"><b>${esc(w.w)}</b>${w.pos?` (${esc(w.pos)})`:''}: ${esc(w.def)}</span>` : '';

function mcCard({instr, promptHtml, options, answer, onResult, optClass, cardClass}){
  const opts = shuffle(options);
  const card = showCard(`<p class="instr">${instr}</p>${promptHtml}
    <div class="opts${optClass?' '+optClass:''}">${opts.map((o,i)=>`<button class="opt" data-v="${esc(o)}"><kbd>${i+1}</kbd><span>${esc(o)}</span></button>`).join('')}</div>
    <div class="fb"></div>`);
  if(cardClass) card.classList.add(cardClass);
  const btns=[...card.querySelectorAll('.opt')]; let answered=false;
  const choose = b => {
    if(answered) return; answered=true;
    const ok=b.dataset.v===answer;
    btns.forEach(x=>{ x.disabled=true; if(x.dataset.v===answer) x.classList.add('ok'); else if(x===b) x.classList.add('no'); else x.classList.add('dim'); });
    onResult(ok, card, card.querySelector('.fb'));
  };
  btns.forEach(b=>b.onclick=()=>choose(b));
  keyHandler = e=>{ const n=parseInt(e.key,10); if(n>=1&&n<=btns.length) choose(btns[n-1]); };
}
const fbOk = (fb, html) => fb.innerHTML=`<div class="feedback ok"><span class="verdict">Correct.</span>${html||''}</div>`;
const fbNo = (fb, answer, html) => fb.innerHTML=`<div class="feedback no"><span class="verdict">Not quite.${answer?` The answer is ${esc(answer)}.`:''}</span>${html||''}</div>`;
// After an answer: right → move on by itself; wrong → explain, wait, and bring the item back later.
function settle(ok, card, st, deck, item, next){
  if(ok){ st.hit(item); autoNext(card, next); } else { st.miss(item); deck.retry(item); manualNext(card, next); }
}

// ---------- VOCABULARY: Match the meaning / Synonym groups ----------
function playMatch(mode, withZh){
  const game=withZh ? {key:'zhmatch', name:'Match the meaning', items:zhWords} : GAMES.find(g=>g.key===(mode==='def'?'match':'syn'));
  const PER=5, REFILL_AT=3;
  const p=game.items(), deck=Deck(p), st=Stats(game.key);
  if(withZh) zhShell(game.name,'Tap a word, then its English meaning. Matched pairs turn grey; after three, new pairs appear. 点击单词，再点击它的英文释义。');
  else shell(game, mode==='def'?'Tap a word, then its meaning. Matched pairs turn grey; after three, new pairs take their place.':'Tap a word, then the group that means something similar. Matched pairs turn grey; after three, new pairs take their place.');
  st.draw();
  const clash=(w,on)=>on.some(o=>o.id===w.id || areAlike(o.id,w.id) || o.w===w.w || (mode==='syn' && o.syn.some(s=>w.syn.includes(s))));
  const draw=(n,on)=>{ const out=[],skip=[]; let guard=0;
    while(out.length<n && guard++<400){ const w=deck.next(); if(clash(w,[...on,...out])) skip.push(w); else out.push(w); }
    skip.forEach(w=>deck.retry(w)); return out; };
  const right = w => mode==='def' ? esc(w.def) : w.syn.map(s=>`<span>${esc(s)}</span>`).join('');
  const L=new Array(PER).fill(null), R=new Array(PER).fill(null);
  const first=draw(PER,[]); const lo=shuffle([...Array(PER).keys()]), ro=shuffle([...Array(PER).keys()]);
  first.forEach((w,i)=>{ L[lo[i]]=w; R[ro[i]]=w; });
  const card=showCard(`<p class="instr">${mode==='def'?'Match each word to its meaning':'Match each word to its synonym group'}</p>
    <div class="match"><div class="col left">${L.map((_,i)=>`<button class="tile word" data-side="L" data-slot="${i}"></button>`).join('')}</div>
    <div class="col right">${R.map((_,i)=>`<button class="tile ${mode}" data-side="R" data-slot="${i}"></button>`).join('')}</div></div>
    <p class="toast" id="toast" aria-live="polite"></p>`);
  const tiles=side=>[...card.querySelectorAll(`.tile[data-side="${side}"]`)];
  // Matched pairs stay on the board, greyed out. Once three pairs are greyed, those three are replaced together.
  const spentL=new Set(), spentR=new Set();
  const paint=fresh=>{
    tiles('L').forEach((t,i)=>{ const w=L[i], sp=spentL.has(i); t.className='tile word'+(w?'':' gone')+(sp?' spent':'')+(w&&fresh&&fresh.includes(w)?' fresh':''); t.innerHTML=w?esc(w.w)+(withZh&&ZH[w.id]?`<small class="tile-zh" lang="zh-CN">${esc(ZH[w.id])}</small>`:''):''; t.dataset.id=w?w.id:''; t.disabled=!w||sp; });
    tiles('R').forEach((t,i)=>{ const w=R[i], sp=spentR.has(i); t.className='tile '+mode+(w?'':' gone')+(sp?' spent':'');  /* new meanings are not highlighted: that would give them away */ t.innerHTML=w?right(w):''; t.dataset.id=w?w.id:''; t.disabled=!w||sp; });
  };
  paint(first);
  let sel=null; const wrongOn=new Set();
  const toast=(m,bad)=>{ const t=card.querySelector('#toast'); t.textContent=m; t.className='toast'+(bad?' no':''); };
  const refill=()=>{
    const eL=[...spentL], eR=[...spentR]; eL.forEach(i=>L[i]=null); eR.forEach(i=>R[i]=null); spentL.clear(); spentR.clear();
    const fresh=draw(eL.length, L.filter(Boolean)); const sl=shuffle(eL), sr=shuffle(eR);
    fresh.forEach((w,i)=>{ L[sl[i]]=w; R[sr[i]]=w; });
    shuffle(R.slice()).forEach((w,i)=>{ R[i]=w; });          // all meanings move, not just the new ones
    if(sel){ sel.classList.remove('sel'); sel=null; }
    paint(fresh); };
  card.addEventListener('click', e=>{
    const t=e.target.closest('.tile'); if(!t||t.disabled||t.classList.contains('done')||t.classList.contains('spent')) return;
    if(!sel||sel.dataset.side===t.dataset.side){ if(sel) sel.classList.remove('sel'); sel=t; t.classList.add('sel'); return; }
    const a=sel,b=t; a.classList.remove('sel'); sel=null;
    const left=a.dataset.side==='L'?a:b, right_=a.dataset.side==='R'?a:b, id=left.dataset.id;
    if(a.dataset.id===b.dataset.id){
      [a,b].forEach(x=>{x.classList.add('done'); x.disabled=true;});
      if(wrongOn.has(id)){ wrongOn.delete(id); st.miss(byId[id]); } else st.hit(byId[id]);
      toast('Correct: '+byId[id].w);
      later(()=>{ spentL.add(+left.dataset.slot); spentR.add(+right_.dataset.slot);
        if(spentL.size>=REFILL_AT) refill(); else paint(); }, 450);
    } else {
      if(!wrongOn.has(id)){ wrongOn.add(id); deck.retry(byId[id]); }
      toast('Not a match. Try again.', true);
      [a,b].forEach(x=>{ x.classList.remove('shake'); void x.offsetWidth; x.classList.add('shake'); later(()=>x.classList.remove('shake'),400); });
    }
  });
}

// ---------- VOCABULARY: Word or meaning ----------
function distractors(w, pool, n){
  const ok=x=>x.id!==w.id && x.w!==w.w && x.def!==w.def && !areAlike(x.id,w.id);
  const same=shuffle(pool.filter(x=>ok(x) && (!w.pos || x.pos===w.pos)));
  const rest=shuffle(pool.filter(x=>ok(x) && !same.includes(x)));
  const out=[]; for(const x of [...same,...rest]){ if(out.some(o=>areAlike(o.id,x.id)||o.w===x.w)) continue; out.push(x); if(out.length===n) break; }
  return out;
}
function playMeaning(){
  const game=GAMES.find(g=>g.key==='meaning'), p=game.items(), deck=Deck(p), st=Stats('meaning');
  shell(game,'Correct answers move on by themselves.'); st.draw();
  const step=()=>{
    const w=deck.next(), ds=distractors(w, p.length>=8?p:S.words, 3), toDef=Math.random()<.5;
    if(toDef) mcCard({instr:'Choose the meaning', promptHtml:`<p class="prompt-word">${esc(w.w)}${w.pos?` <small>${esc(w.pos)}</small>`:''}</p>`,
      options:[w.def,...ds.map(x=>x.def)], answer:w.def, optClass:'long',
      onResult:(ok,card,fb)=>{ ok?fbOk(fb, w.ex?`<span class="wd"><i>${esc(w.ex)}</i></span>`:''):fbNo(fb,'',`${wordNote(w)}${w.ex?`<span class="wd"><i>${esc(w.ex)}</i></span>`:''}`); settle(ok,card,st,deck,w,step); }});
    else mcCard({instr:'Choose the word', promptHtml:`<p class="prompt-def">${esc(w.def)}</p>`,
      options:[w.w,...ds.map(x=>x.w)], answer:w.w,
      onResult:(ok,card,fb)=>{ ok?fbOk(fb, w.ex?`<span class="wd"><i>${esc(w.ex)}</i></span>`:''):fbNo(fb,w.w,`${wordNote(w)}${w.ex?`<span class="wd"><i>${esc(w.ex)}</i></span>`:''}`); settle(ok,card,st,deck,w,step); }});
  };
  step();
}

// ---------- GRAMMAR: Fill the gap ----------
function playGap(){
  const game=GAMES.find(g=>g.key==='gap'), items=game.items(), deck=Deck(items), st=Stats('gap');
  shell(game, `${items.length} sentences in your selected topics. Correct answers move on by themselves.`); st.draw();
  const step=()=>{
    const g=deck.next(), parts=g.s.split('___');
    mcCard({instr:g.pt?`Choose the word that fits · ${esc(g.pt)}`:'Choose the word that fits the gap',
      promptHtml:`<p class="sentence">${esc(parts[0])}<span class="slot">&nbsp;</span>${esc(parts[1]||'')}</p>`,
      options:[g.ans,...g.wrong], answer:g.ans,
      onResult:(ok,card,fb)=>{
        const s=card.querySelector('.slot'); s.textContent=g.ans; s.classList.add(ok?'ok':'no');
        if(ok) fbOk(fb,`<span>${g.why}</span>`); else fbNo(fb,g.ans,`<span>${g.why}</span>${wordNote(byId[g.wid])}`);
        settle(ok,card,st,deck,g,step);
      }});
  };
  step();
}

// ---------- GRAMMAR: Build the sentence ----------
const ROLES={topic:'Who or what',verb:'Verb',detail:'Detail',link:'Linking word',judge:'Judgement',hedge:'Hedge'};
function playBuild(){
  const game=GAMES.find(g=>g.key==='build'), items=game.items(), deck=Deck(items), st=Stats('build');
  shell(game,'Tap the pieces in order. Tap a placed piece to send it back.'); st.draw();
  const step=()=>{
    const b=deck.next();
    const pieces=shuffle([...b.tiles.map((t,i)=>({t:t[0],r:t[1],k:'t'+i})), ...(b.decoys||[]).map((t,i)=>({t:t[0],r:t[1],k:'d'+i,decoy:true}))]);
    const usedRoles=[...new Set(b.tiles.map(t=>t[1]))];
    const card=showCard(`<p class="instr">${esc(b.goal||'Build the sentence')}</p>
      <div class="answer" id="ans" aria-label="Your sentence"></div>
      <div class="pool" id="pool">${pieces.map(p=>`<button class="piece r-${p.r}" data-k="${p.k}">${esc(p.t)}</button>`).join('')}</div>
      <div class="rolekey">${usedRoles.map(r=>`<span class="r-${r}">${ROLES[r]||r}</span>`).join('')}</div>
      <div class="next-row check-row"><button class="btn" id="check" disabled>Check</button></div><div class="fb"></div>`);
    const ans=card.querySelector('#ans'), pool=card.querySelector('#pool'), check=card.querySelector('#check');
    let placed=[], done=false;
    const sync=()=>{ check.disabled=!placed.length; };
    pool.addEventListener('click',e=>{ const t=e.target.closest('.piece'); if(!t||done) return; placed.push(t.dataset.k); ans.appendChild(t); sync(); });
    ans.addEventListener('click',e=>{ const t=e.target.closest('.piece'); if(!t||done) return; placed=placed.filter(k=>k!==t.dataset.k); pool.appendChild(t); sync(); });
    const doCheck=()=>{
      if(done||!placed.length) return; done=true;
      const text=placed.map(k=>pieces.find(p=>p.k===k).t);
      const target=b.tiles.map(t=>t[0]);
      const same=(a,c)=>a.length===c.length && a.every((x,i)=>x===c[i]);
      const ok=same(text,target) || (b.alt||[]).some(a=>same(text,a));
      ans.classList.add(ok?'ok':'no'); card.querySelector('.check-row').remove();
      card.querySelectorAll('.piece').forEach(p=>p.disabled=true);
      const model=b.tiles.map(t=>`<span class="piece inline r-${t[1]}">${esc(t[0])}</span>`).join(' ');
      const fb=card.querySelector('.fb');
      if(ok) fbOk(fb, b.why?`<span>${esc(b.why)}</span>`:''); else fbNo(fb,'',`<div class="model">${model}</div>${b.why?`<span>${esc(b.why)}</span>`:''}`);
      settle(ok,card,st,deck,b,step);
    };
    check.onclick=doCheck;
    keyHandler=e=>{ if(e.key==='Enter'){ e.preventDefault(); doCheck(); } };
  };
  step();
}

// ---------- GRAMMAR: Spot the error ----------
function parseErrors(text){
  const out=[], re=/\[([^\]|]+)\|([^\]|]+)\|([^\]]+)\]|([^\s\[]+)/g; let m;
  while((m=re.exec(text))){
    if(m[1]){ out.push({text:m[1], err:{right:m[2], why:m[3]}}); continue; }
    const w=m[4], lead=w.match(/^[^\w'’]+/), trail=w.match(/[^\w'’%°]+$/);
    const core=w.replace(/^[^\w'’]+/,'').replace(/[^\w'’%°]+$/,'');
    if(!core){ out.push({text:w, punct:true}); continue; }
    if(lead) out.push({text:lead[0], punct:true, glue:true});
    out.push({text:core});
    if(trail) out.push({text:trail[0], punct:true});
  }
  return out;
}
function playErr(){
  const game=GAMES.find(g=>g.key==='error'), items=game.items(), deck=Deck(items), st=Stats('error');
  let showCount=store.get('errCount',true);
  shell(game, `${items.length} paragraphs in your selected topics. Tap each wrong word, then press Check.`); st.draw();
  const lab=document.createElement('label'); lab.className='toggle';
  lab.innerHTML=`<input type="checkbox" id="errCount" ${showCount?'checked':''}> Tell me how many`;
  document.querySelector('.bar').appendChild(lab);
  let current=null;
  lab.querySelector('input').onchange=e=>{ showCount=e.target.checked; store.set('errCount',showCount); if(current) current(); };
  const step=()=>{
    const it=deck.next(), toks=parseErrors(it.text), marked=new Set(), nErr=toks.filter(t=>t.err).length;
    const html=toks.map((t,i)=>{ const prev=toks[i-1]; const sp=(i===0||(t.punct&&!t.glue)||(prev&&prev.glue))?'':' ';
      return sp+(t.punct?`<span class="punct">${esc(t.text)}</span>`:`<button class="tok" data-i="${i}">${esc(t.text)}</button>`); }).join('');
    const card=showCard(`<p class="instr">${esc(it.title||'Spot the error')} · <span id="errHint"></span></p>
      <div class="errtext">${html}</div>
      <div class="next-row check-row"><button class="btn" id="check">Check</button></div><div class="fb"></div>`);
    const hint=card.querySelector('#errHint'), btn=card.querySelector('#check'); let checked=false;
    const upd=()=>{ if(checked) return; hint.textContent=showCount?`There ${nErr===1?'is 1 error':'are '+nErr+' errors'}. Tap each one.`:'Tap every word that is wrong.'; btn.textContent=`Check (${marked.size} marked)`; };
    current=upd; upd();
    card.querySelectorAll('.tok').forEach(b=>b.onclick=()=>{ if(checked) return; const i=+b.dataset.i;
      if(marked.has(i)){ marked.delete(i); b.classList.remove('t-marked'); } else { marked.add(i); b.classList.add('t-marked'); } upd(); });
    const check=()=>{
      if(checked) return; checked=true;
      const errIdx=toks.map((t,i)=>t.err?i:-1).filter(i=>i>=0);
      const found=errIdx.filter(i=>marked.has(i)).length, falseMarks=[...marked].filter(i=>!toks[i].err).length;
      const ok=found===errIdx.length && falseMarks===0;
      card.querySelectorAll('.tok').forEach(b=>{ const i=+b.dataset.i, t=toks[i]; b.disabled=true; b.classList.remove('t-marked');
        if(t.err){ b.classList.add(marked.has(i)?'t-found':'t-missed'); b.innerHTML=`<s>${esc(t.text)}</s> <ins>${esc(t.err.right)}</ins>`; }
        else if(marked.has(i)) b.classList.add('t-false'); });
      card.querySelector('.check-row').remove();
      const list=errIdx.map(i=>{ const t=toks[i]; return `<li class="${marked.has(i)?'got':'miss'}"><span><s>${esc(t.text)}</s> → <b>${esc(t.err.right)}</b></span><span class="why">${esc(t.err.why)}</span></li>`; }).join('');
      const summary=`You found ${found} of ${errIdx.length}${falseMarks?` and marked ${falseMarks} correct word${falseMarks>1?'s':''} as wrong`:''}.`;
      card.querySelector('.fb').innerHTML=`<div class="feedback ${ok?'ok':'no'}"><span class="verdict">${ok?'All found.':summary}</span><ul class="errlist">${list}</ul></div>`;
      settle(ok,card,st,deck,it,step);
    };
    btn.onclick=check; keyHandler=e=>{ if(e.key==='Enter'){ e.preventDefault(); check(); } };
  };
  step();
}

// ---------- GRAMMAR: True or false ----------
function playTF(){
  const game=GAMES.find(g=>g.key==='tf'), items=game.items(), deck=Deck(items), st=Stats('tf');
  shell(game,'Press T or F on a keyboard, or tap.'); st.draw();
  const step=()=>{
    const t=deck.next();
    const card=showCard(`<p class="instr">True or false?</p><p class="statement">${esc(t.s)}</p>
      <div class="tf-btns"><button class="tfb yes" data-v="1">True</button><button class="tfb no" data-v="0">False</button></div><div class="fb"></div>`);
    let done=false;
    const choose=v=>{ if(done) return; done=true; const ok=(v===1)===!!t.t;
      card.querySelectorAll('.tfb').forEach(b=>{ b.disabled=true; if(+b.dataset.v===(t.t?1:0)) b.classList.add('ok'); else b.classList.add('dim'); });
      const fb=card.querySelector('.fb'); ok?fbOk(fb,`<span>${esc(t.why||'')}</span>`):fbNo(fb,t.t?'True':'False',`<span>${esc(t.why||'')}</span>`);
      settle(ok,card,st,deck,t,step); };
    card.querySelectorAll('.tfb').forEach(b=>b.onclick=()=>choose(+b.dataset.v));
    keyHandler=e=>{ const k=e.key.toLowerCase(); if(k==='t'||e.key==='ArrowRight'||k==='1') choose(1); if(k==='f'||e.key==='ArrowLeft'||k==='2') choose(0); };
  };
  step();
}

// ---------- READING: In your own words ----------
function playOwn(){
  const game=GAMES.find(g=>g.key==='own'), items=game.items(), deck=Deck(items), st=Stats('own');
  shell(game, `${items.length} extracts in your selected topics. Get every word right and the next extract appears by itself.`); st.draw();
  const step=()=>{
    const o=deck.next(), words=[]; let k=0;
    const textHtml=esc(o.t).replace(/\[([^\]]+)\]/g,(m,w)=>{ words.push(w); return `<u data-k="${k++}">${w}</u>`; });
    const card=showCard(`<p class="instr">Using your own words, explain what the writer means by each of the underlined words</p>
      <p class="extract">${textHtml}</p>
      ${o.qs.map((q,j)=>{ const opts=shuffle([q[0],...q[1]]); return `<div class="sub" data-j="${j}"><h4><b>${esc(words[j])}</b> means…</h4>
        <div class="opts">${opts.map((x,n)=>`<button class="opt" data-v="${esc(x)}"><kbd>${n+1}</kbd><span>${esc(x)}</span></button>`).join('')}</div><div class="why"></div></div>`;}).join('')}`);
    const subs=[...card.querySelectorAll('.sub')]; let active=0, allRight=true;
    const hl=()=>card.querySelectorAll('.extract u').forEach(u=>u.classList.toggle('now', +u.dataset.k===active)); hl();
    subs.forEach((sub,j)=>{ const q=o.qs[j], btns=[...sub.querySelectorAll('.opt')];
      sub.addEventListener('pointerenter',()=>{ if(!sub.dataset.done){active=j; hl();} });
      sub.addEventListener('focusin',()=>{ if(!sub.dataset.done){active=j; hl();} });
      sub._choose=b=>{ if(sub.dataset.done) return; sub.dataset.done='1';
        const ok=b.dataset.v===q[0], w=byId[o.ids[j]];
        btns.forEach(x=>{ x.disabled=true; if(x.dataset.v===q[0]) x.classList.add('ok'); else if(x===b) x.classList.add('no'); else x.classList.add('dim'); });
        if(ok) st.hit(w||o); else { st.miss(w||o); allRight=false; }
        sub.querySelector('.why').innerHTML=(ok?'Correct. ':`In this extract it means “${esc(q[0])}”. `)+(w?`<b>${esc(w.w)}</b>: ${esc(w.def)}`:'');
        const n=subs.findIndex(s=>!s.dataset.done); if(n>=0){ active=n; hl(); return; }
        active=-1; hl();
        if(allRight) autoNext(card,step); else { deck.retry(o); manualNext(card,step,'Next extract →'); } };
      btns.forEach(b=>b.onclick=()=>sub._choose(b)); });
    keyHandler=e=>{ const n=parseInt(e.key,10); if(active>=0&&n>=1&&n<=4){ const b=subs[active].querySelectorAll('.opt')[n-1]; if(b) subs[active]._choose(b);} };
  };
  step();
}

// ---------- READING: Read it ----------
function playRead(){
  const game=GAMES.find(g=>g.key==='read'), items=game.items(), deck=Deck(items), st=Stats('read');
  shell(game,'Tap a highlighted word to see its meaning.'); st.draw();
  const step=()=>{
    const r=deck.next();
    const text=esc(r.text).replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g,(m,w,id)=>`<button class="kw" data-id="${esc(id)}">${w}</button>`);
    mcCard({instr:esc(r.title||'Read it'), promptHtml:`<div class="readtext">${text}</div><p class="peek" id="peek">Tap a highlighted word to see what it means.</p><p class="question">${esc(r.q)}</p>`,
      options:r.opts, answer:r.opts[r.a], optClass:'long',
      onResult:(ok,card,fb)=>{ ok?fbOk(fb):fbNo(fb,r.opts[r.a]); settle(ok,card,st,deck,r,step); }});
    const card=document.querySelector('#feed .card');
    card.querySelectorAll('.kw').forEach(b=>b.onclick=()=>{ const w=byId[b.dataset.id]; card.querySelector('#peek').innerHTML=w?`<b>${esc(w.w)}</b>: ${esc(w.def)}`:''; });
  };
  step();
}

// ---------- READING: Answer the question ----------
function playQuestion(){
  const game=GAMES.find(g=>g.key==='question'), items=game.items(), deck=Deck(items), st=Stats('question');
  shell(game,'Choose the answer that does what the question asks.'); st.draw();
  const step=()=>{
    const q=deck.next();
    const qHtml=esc(q.q).replace(new RegExp('^('+q.cmd.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','i'),'<mark>$1</mark>');
    mcCard({instr:'Exam question', promptHtml:`<div class="exam-q">${qHtml}</div>`, options:q.opts, answer:q.opts[q.a], optClass:'long',
      onResult:(ok,card,fb)=>{ ok?fbOk(fb,`<span>${esc(q.why||'')}</span>`):fbNo(fb,'',`<span>${esc(q.why||'')}</span>`); settle(ok,card,st,deck,q,step); }});
  };
  step();
}

// ---------- READING: Read and answer (questions come from a spreadsheet file, see en/reading/README.md) ----------
// The page says where the file is (data-reading) and which topic it is (data-topic).
// One CSV file per subject and topic (see en/reading/README.md).
// Columns: id, level, title, passage, question, correct, wrong1, wrong2, wrong3, explanation, source
// More questions on the same passage (optional): question2, correct2, wrong1_2, wrong2_2, wrong3_2, explanation2,
// then question3, correct3, wrong1_3 … and so on. They are asked in order, with the passage still on screen.
// Level codes are shown to students by name: see LEVEL_NAMES near the top of this file.
function parseCSV(text){
  const rows=[]; let row=[], cell='', q=false;
  text=text.replace(/^﻿/,'');
  for(let i=0;i<text.length;i++){ const c=text[i];
    if(q){ if(c==='"'){ if(text[i+1]==='"'){ cell+='"'; i++; } else q=false; } else cell+=c; }
    else if(c==='"') q=true;
    else if(c===','){ row.push(cell); cell=''; }
    else if(c==='\n'||c==='\r'){ if(c==='\r'&&text[i+1]==='\n') i++; row.push(cell); rows.push(row); row=[]; cell=''; }
    else cell+=c; }
  if(cell!==''||row.length){ row.push(cell); rows.push(row); }
  const head=(rows.shift()||[]).map(h=>h.trim().toLowerCase());
  return rows.filter(r=>r.some(x=>x.trim())).map(r=>Object.fromEntries(head.map((h,i)=>[h,(r[i]||'').trim()])));
}
// Question 1 uses the plain column names; question n uses questionN, correctN, wrong1_N, wrong2_N, wrong3_N, explanationN.
function questionsOf(r){ const qs=[];
  for(let n=1;n<=9;n++){ const a=n===1?'':String(n), b=n===1?'':'_'+n;
    const q={q:r['question'+a], opts:[r['correct'+a], r['wrong1'+b], r['wrong2'+b], r['wrong3'+b]], why:r['explanation'+a]||''};
    if(!q.q) continue;
    if(q.opts.every(Boolean)) qs.push(q); else console.warn('Reading row '+r.id+': question '+n+' skipped (an answer is missing)'); }
  return qs; }
// Note taking (data-format="notes"): id, level, title, passage, topic, select_count, option1…option6,
// correct_options (e.g. [1,3,5]), explanation, source. Students choose the select_count options that are good notes on the topic.
function notesRow(r){
  const opts=[]; for(let n=1;n<=9;n++) if(r['option'+n]) opts.push(r['option'+n]);
  let right=[]; try{ right=JSON.parse(r.correct_options||'[]'); }catch(e){ right=String(r.correct_options||'').split(/[^0-9]+/).filter(Boolean).map(Number); }
  right=[...new Set(right.map(Number))].filter(n=>n>=1 && n<=opts.length);
  const count=parseInt(r.select_count,10)||right.length;
  if(!r.id || !r.passage || opts.length<3 || !right.length || right.length!==count){ console.warn('Notes row '+(r.id||'?')+' skipped: check the options, select_count and correct_options'); return null; }
  return {id:r.id, level:r.level, title:r.title, text:r.passage, topic:r.topic||'', count, opts, right:right.map(n=>n-1), why:r.explanation||''};
}
let readingState = CFG.reading ? 'loading' : 'none';
if(CFG.reading){
  fetch(CFG.reading, {cache:'no-cache'}).then(r=>{ if(!r.ok) throw new Error(r.status); return r.text(); }).then(t=>{
    if(CFG.format==='notes'){ S.passages=parseCSV(t).map(notesRow).filter(Boolean); readingState='ok'; return; }
    const need=['id','title','passage','question','correct','wrong1','wrong2','wrong3'];
    S.passages = parseCSV(t).filter(r=>{
      if(CFG.topic && r.topic && r.topic!==CFG.topic) return false;   // one file per topic; a topic column is optional
      const miss=need.filter(k=>!r[k]); if(miss.length){ console.warn('Reading row '+(r.id||'?')+' skipped: missing '+miss.join(', ')); return false; }
      return true; }).map(r=>({id:r.id, level:r.level, title:r.title, text:r.passage, qs:questionsOf(r)}));
    readingState='ok';
  }).catch(e=>{ console.warn('Reading file not loaded:', e); readingState='failed'; })
    .finally(()=>{ const h=location.hash.replace(/^#/,''); if(CFG.only==='passage'||!h||CATS[h]) route(); });
}
function playPassage(){
  const game=GAMES.find(g=>g.key==='passage'), st=Stats('passage');
  shell(game, ''); const items=readingTop(playPassage), deck=Deck(items), nq=items.reduce((n,r)=>n+r.qs.length,0);
  document.querySelector('.feed').insertAdjacentHTML('beforebegin', `<p class="hint">${items.length} passage${items.length===1?'':'s'}${nq>items.length?`, ${nq} questions`:''}. Read carefully, then choose the best answer.</p>`); st.draw();
  const step=()=>{
    const r=deck.next(), many=r.qs.length>1; let missed=false;
    const paras=r.text.split(/\n\s*\n|\s*\|\|\s*/).map(p=>`<p>${esc(p.trim()).replace(/\n/g,'<br>')}</p>`).join('');
    // One card per question; the passage stays on every card. A miss brings the whole passage back later (once).
    const ask=i=>{ const q=r.qs[i], next=i+1<r.qs.length ? ()=>ask(i+1) : step, item={id:r.id+(i?'#'+(i+1):''), level:r.level};
      mcCard({instr:`${esc(r.title)}${r.level?` · ${esc(levelName(r.level))}`:''}${many?` · Question ${i+1} of ${r.qs.length}`:''}`,
        promptHtml:`<div class="passage">${paras}</div><p class="question">${esc(q.q)}</p>`, options:q.opts, answer:q.opts[0], optClass:'long', cardClass:'reading',
        onResult:(ok,card,fb)=>{ ok?fbOk(fb, q.why?`<span>${esc(q.why)}</span>`:''):fbNo(fb,'', `<span>The answer is: <b>${esc(q.opts[0])}</b></span>${q.why?`<span>${esc(q.why)}</span>`:''}`);
          if(ok){ st.hit(item); autoNext(card,next); } else { st.miss(item); if(!missed){ missed=true; deck.retry(r); } manualNext(card,next); } }});
    };
    ask(0);
  };
  step();
}

// Level buttons for the Reading Comprehension pages. The choice is shared by all three pages.
// First time: the student's level and the one above it (once known), otherwise every level.
const READ_LV='aea:reading-levels';
function readingLevels(all){
  const num=n=>({Foundation:1,'Foundation+':2,Intermediate:3,'Intermediate+':4,Advanced:5})[n]||0;
  const present=[...new Set(all.map(r=>r.level?levelName(r.level):'').filter(Boolean))].sort((a,b)=>num(a)-num(b));
  const t=P.topic(), r=t&&t.n>=P.CAL ? t.r : P.overall();
  const rec=r==null ? [] : present.filter(n=>num(n)>=Math.ceil(r-1) && num(n)<=Math.floor(r+0.75));
  let saved=null; try{ saved=JSON.parse(localStorage.getItem(READ_LV)); }catch(e){}
  let chosen=(Array.isArray(saved)?saved:[]).filter(n=>present.includes(n));
  if(!chosen.length) chosen = rec.length ? rec : present.slice();
  const items=all.filter(x=>!x.level || chosen.includes(levelName(x.level)));
  const html = present.length<2 ? '' : `<div class="sets read-levels" role="group" aria-label="Levels">${present.map(n=>
    `<button class="chip${rec.includes(n)?' chip-good':''}" data-lv="${esc(n)}" aria-pressed="${chosen.includes(n)}">${esc(n)} <small>${all.filter(x=>levelName(x.level)===n).length}</small></button>`).join('')}</div>`;
  const wire=again=>document.querySelectorAll('.read-levels .chip').forEach(c=>c.onclick=()=>{ const n=c.dataset.lv;
    let next = chosen.includes(n) ? chosen.filter(x=>x!==n) : [...chosen, n]; if(!next.length) return;
    try{ localStorage.setItem(READ_LV, JSON.stringify(next)); }catch(e){} again(); });
  return {items, html, wire};
}
function readingTop(again){   // the level buttons go between the hint and the game; the page goes wide
  document.body.classList.add('reading-wide');
  if(CFG.only!=='passage') return S.passages||[];
  const L=readingLevels(S.passages||[]); if(L.html){ document.getElementById('feed').insertAdjacentHTML('beforebegin', L.html); L.wire(again); }
  return L.items;
}

// Note taking: read the passage, then choose the notes that belong under the heading. Check marks them all at once.
function playNotes(){
  const st=Stats('notes'), game={key:'notes', name:CFG.name||'Note taking', cat:'reading'};
  shell(game, ''); const items=readingTop(playNotes), deck=Deck(items);
  document.querySelector('.feed').insertAdjacentHTML('beforebegin', `<p class="hint">${items.length} passage${items.length===1?'':'s'}. Read carefully, then choose the notes that belong under the heading.</p>`); st.draw();
  const step=()=>{
    const r=deck.next(), order=shuffle(r.opts.map((o,i)=>i)), picked=new Set();
    const paras=r.text.split(/\n\s*\n|\s*\|\|\s*/).map(p=>`<p>${esc(p.trim()).replace(/\n/g,'<br>')}</p>`).join('');
    const card=showCard(`<p class="instr">${esc(r.title)}${r.level?` · ${esc(levelName(r.level))}`:''}</p><div class="passage">${paras}</div>
      <div class="note-task"><span class="note-k">Notes on</span><b>${esc(r.topic)}</b></div>
      <p class="question">Choose the ${r.count} notes that belong under this heading.</p>
      <div class="opts long notes">${order.map((i,k)=>`<button class="opt" data-i="${i}" aria-pressed="false"><kbd>${k+1}</kbd><span>${esc(r.opts[i])}</span></button>`).join('')}</div>
      <div class="next-row check-row"><span class="pick-n" id="pickN">0 of ${r.count} chosen</span><button class="btn" id="check" disabled>Check</button></div><div class="fb"></div>`);
    card.classList.add('reading');
    const btns=[...card.querySelectorAll('.opt')], chk=card.querySelector('#check'), pn=card.querySelector('#pickN'); let done=false;
    const toggle=b=>{ if(done) return; const i=+b.dataset.i;
      if(picked.has(i)) picked.delete(i); else { if(picked.size>=r.count) return; picked.add(i); }
      b.setAttribute('aria-pressed', picked.has(i)); pn.textContent=`${picked.size} of ${r.count} chosen`; chk.disabled=picked.size!==r.count; };
    const check=()=>{ if(done || picked.size!==r.count) return; done=true; card.querySelector('.check-row').remove();
      const got=[...picked].filter(i=>r.right.includes(i)).length, ok=got===r.count;
      btns.forEach(b=>{ const i=+b.dataset.i, good=r.right.includes(i); b.disabled=true;
        b.classList.add(picked.has(i) ? (good?'ok':'no') : (good?'missed':'dim')); });
      const why=r.why ? `<div class="why">${r.why.split(/\n\s*\n/).map(p=>`<p>${esc(p.trim()).replace(/\n/g,'<br>')}</p>`).join('')}</div>` : '';
      const fb=card.querySelector('.fb'); ok ? fbOk(fb, why) : fbNo(fb, '', `<span>You found ${got} of ${r.count}. The notes with a dashed green border were missed.</span>${why}`);
      const item={id:r.id, level:r.level};
      if(ok){ st.hit(item); autoNext(card,step); } else { st.miss(item); deck.retry(r); manualNext(card,step); } };
    btns.forEach(b=>b.onclick=()=>toggle(b)); chk.onclick=check;
    keyHandler=e=>{ const n=parseInt(e.key,10); if(n>=1&&n<=btns.length) toggle(btns[n-1]); else if(e.key==='Enter'){ e.preventDefault(); check(); } };
  };
  step();
}

// ---------- CHINESE SIDE (data-only="zh"): vocabulary games with Chinese support ----------
// Chinese appears next to the key word only. Answer options are always English.
const ZH = Object.fromEntries((window.SUBJECT_ZH||[]).map(x=>[x.id,x.zh]));
const zhWords = () => pick(S.words).filter(w=>ZH[w.id]);
const ZH_GAMES = [
  {key:'zh',       type:'practice',  name:'中文 → English',     zh:'看中文，选英文', blurb:'See the Chinese meaning and choose the English word.', run:()=>playZh()},
  {key:'zhmatch',  type:'practice',  name:'Match the meaning',  zh:'单词配释义',     blurb:'Match each word to its English meaning. The Chinese is shown under the word.', run:()=>playMatch('def', true)},
  {key:'zhmean',   type:'practice',  name:'Choose the meaning', zh:'选出释义',       blurb:'See the word and its Chinese, then choose the English meaning.', run:()=>playZhMeaning()},
  {key:'zhtype',   type:'practice',  name:'Type it',            zh:'拼写单词',       blurb:'Read the meaning and the Chinese, then type the English word.', run:()=>playType()},
  {key:'zhtf',     type:'practice',  name:'True or false',      zh:'判断对错',       blurb:'See the word and its Chinese. Does the English meaning match? Decide quickly.', run:()=>playZhTF()},
  {key:'zhodd',    type:'practice',  name:'Odd one out',        zh:'找出不同类',     blurb:'Four words: three belong together. Find the one that doesn’t.', run:()=>playOdd(), needs:()=>oddReady()},
  {key:'zhspeed',  type:'challenge', name:'Speed round',        zh:'限时挑战',       blurb:'60 seconds. See the Chinese, choose the English word. How many can you get?', run:()=>playSpeed()},
  {key:'zhsurvive',type:'challenge', name:'Survival',           zh:'生存挑战',       blurb:'Three lives. See the word and its Chinese, then choose the English meaning before time runs out. It gets faster.', run:()=>playSurvival()}
];
const countIn = id => S.words.filter(w=>w.set===id && ZH[w.id]).length;
function chipHtml(s){
  // Keep the Chinese part of a group name together on its own span so it never splits mid-phrase
  const m=s.name.match(/^(.*?)\s+([第\u4e00-\u9fff].*)$/);
  const label=m?`<span class="chip-en">${esc(m[1])}</span> <span class="chip-zh" lang="zh-CN">${esc(m[2])}</span>`:esc(s.name);
  return `<button class="chip${P.recommended().includes(s.id)?' chip-good':''}" data-set="${s.id}" aria-pressed="${chosen.includes(s.id)}"><span class="chip-label">${label}</span> <span class="chip-n">${countIn(s.id)}</span></button>`; }
function chipsHtml(){
  if(S.sets.length<2) return '';
  const heads=[...new Set(S.sets.map(s=>s.head||''))];
  const all=`<button class="chip chip-all" data-all="1">${chosen.length===S.sets.length?'Clear 清除':'Select all 全选'}</button>`;
  if(heads.length===1 && !heads[0]) return `<div class="sets" role="group" aria-label="Word groups">${S.sets.map(chipHtml).join('')}${S.sets.length>4?all:''}</div>`;
  return heads.map(h=>`<p class="set-head">${esc(h)}</p><div class="sets" role="group" aria-label="${esc(h)}">${S.sets.filter(s=>(s.head||'')===h).map(chipHtml).join('')}</div>`).join('')+`<div class="sets">${all}</div>`;
}
function zhMenu(){
  const n=zhWords().length;
  const card=g=>{ const off=g.needs && !g.needs();
    const best=store.get((g.type==='challenge'?'best:':'streak:')+g.key,0);
    return `<a class="game${off?' off':''}" ${off?'aria-disabled="true"':`href="#play-${g.key}"`}><h3>${g.name}</h3><p lang="zh-CN" class="zh-sub">${g.zh}</p><p>${g.blurb}</p>
      <span class="best">${off?'Choose at least two groups 请至少选择两个组':best?(g.type==='challenge'?'Best score: ':'Best streak: ')+best:'Not played yet'}</span></a>`; };
  frame({href:CFG.back||'../index.html', label:CFG.backLabel||'中文版 Chinese version'}, `
  <section class="hero">
    <p class="eyebrow">Chinese version 中文版</p>
    <h1>${esc(CFG.name||'')}</h1>
    ${CFG.blurb?`<p>${esc(CFG.blurb)}</p>`:''}
    ${chipsHtml()}
    <p class="setnote">${n} words selected. 已选 ${n} 个单词。</p>
    ${levelCard()}
  </section>
  <p class="instr group-label">Practice 练习</p>
  <div class="games">${ZH_GAMES.filter(g=>g.type==='practice').map(card).join('')}</div>
  <p class="instr group-label">Challenge 挑战</p>
  <div class="games">${ZH_GAMES.filter(g=>g.type==='challenge').map(card).join('')}</div>
  <div class="wl-link"><p>See every word with its Chinese meaning. 查看所有单词和中文释义。</p><a class="btn alt" href="#words">Word list 词汇表</a></div>`);
  $app.querySelectorAll('.chip').forEach(c=>c.onclick=()=>{
    if(c.dataset.all){ chosen = chosen.length===S.sets.length ? [S.sets[0].id] : S.sets.map(x=>x.id); }
    else { const s=c.dataset.set;
      if(chosen.includes(s)){ if(chosen.length>1) chosen=chosen.filter(x=>x!==s); } else chosen=S.sets.map(x=>x.id).filter(x=>x===s||chosen.includes(x)); }
    const y=window.scrollY; store.set('sets',chosen); zhMenu(); window.scrollTo(0,y); });
  wirePickLevel(zhMenu);
}
function zhShell(title, note){
  frame({href:'#', label:CFG.name||'Back'}, `<div class="bar"><span class="title">${title}</span><span class="spacer"></span><div class="stats" id="stats"></div></div>
    ${note?`<p class="hint">${note}</p>`:''}<div class="feed" id="feed"></div>`);
}
function playZh(){
  const p=zhWords(), deck=Deck(p), st=Stats('zh');
  zhShell('中文 → English','See the Chinese meaning and choose the English word. 看中文，选出英文单词。'); st.draw();
  const step=()=>{
    const w=deck.next(), ds=distractors(w,p.length>=8?p:S.words,3);
    mcCard({instr:'Choose the English word 选出英文单词', promptHtml:`<div class="zh-prompt" lang="zh-CN">${esc(ZH[w.id])}</div><div class="pos">${esc(w.pos||'')}</div>`,
      options:[w.w,...ds.map(x=>x.w)], answer:w.w,
      onResult:(ok,card,fb)=>{ ok?fbOk(fb,w.ex?`<span class="wd"><i>${esc(w.ex)}</i></span>`:''):fbNo(fb,w.w,`${wordNote(w)}${w.ex?`<span class="wd"><i>${esc(w.ex)}</i></span>`:''}`); settle(ok,card,st,deck,w,step); }});
  };
  step();
}
function playZhMeaning(){
  const p=zhWords(), deck=Deck(p), st=Stats('zhmean');
  zhShell('Choose the meaning','Read the word and its Chinese, then choose the English meaning. 选出正确的英文释义。'); st.draw();
  const step=()=>{
    const w=deck.next(), ds=distractors(w,p.length>=8?p:S.words,3);
    mcCard({instr:'Choose the meaning 选出释义', promptHtml:`<p class="prompt-word">${esc(w.w)}${w.pos?` <small>${esc(w.pos)}</small>`:''}</p><p class="zh-under" lang="zh-CN">${esc(ZH[w.id])}</p>`,
      options:[w.def,...ds.map(x=>x.def)], answer:w.def, optClass:'long',
      onResult:(ok,card,fb)=>{ ok?fbOk(fb,w.ex?`<span class="wd"><i>${esc(w.ex)}</i></span>`:''):fbNo(fb,'',`${wordNote(w)}${w.ex?`<span class="wd"><i>${esc(w.ex)}</i></span>`:''}`); settle(ok,card,st,deck,w,step); }});
  };
  step();
}

// ----- Chinese side: Type it -----
const normAns = t => t.toLowerCase().replace(/\s*\(.*?\)\s*/g,' ').replace(/[’']/g,"'").replace(/\s+/g,' ').trim();
const answersFor = w => { const base=normAns(w.w); return [base, ...base.split(/\s*\/\s*/)].filter(Boolean); };
// Near-synonyms (data field "accept"): Type it takes any word in the same group as right.
const acceptOf = {}; (S.accept||[]).forEach(g=>g.forEach(id=>{ (acceptOf[id]=acceptOf[id]||new Set()); g.forEach(o=>{ if(o!==id) acceptOf[id].add(o); }); }));
const altsFor = w => [...(acceptOf[w.id]||[])].map(id=>byId[id]).filter(Boolean);
function playType(){
  const p=zhWords(), deck=Deck(p), st=Stats('zhtype');
  zhShell('Type it','Read the meaning, then type the English word. 看释义，拼写英文单词。'); st.draw();
  const step=()=>{
    const w=deck.next(), target=normAns(w.w).split(/\s*\/\s*/)[0];
    const card=showCard(`<p class="instr">Type the English word 拼写英文单词</p>
      <p class="prompt-def">${esc(w.def)}</p><p class="zh-under" lang="zh-CN">${esc(ZH[w.id])}</p>
      <form class="typeform" autocomplete="off"><input id="typeIn" type="text" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Type the word" placeholder="Type here 在此输入">
      <button class="btn" type="submit">Check</button><button class="btn alt" type="button" id="hint">Hint 提示</button></form>
      <p class="hint-line" id="hintLine"></p><div class="fb"></div>`);
    const input=card.querySelector('#typeIn'), form=card.querySelector('form'); let hints=0, done=false;
    setTimeout(()=>input.focus({preventScroll:true}),50);
    card.querySelector('#hint').onclick=()=>{ hints=Math.min(hints+1,target.length);
      card.querySelector('#hintLine').textContent='Starts with 开头是: '+target.slice(0,hints)+'…'; input.focus(); };
    form.onsubmit=e=>{ e.preventDefault(); if(done) return; const v=normAns(input.value); if(!v) return; done=true;
      const alt=altsFor(w).find(x=>answersFor(x).includes(v));
      const ok=answersFor(w).includes(v) || !!alt; input.disabled=true; form.querySelectorAll('button').forEach(b=>b.disabled=true);
      input.classList.add(ok?'ok':'no');
      const fb=card.querySelector('.fb'), ex=w.ex?`<span class="wd"><i>${esc(w.ex)}</i></span>`:'';
      const others=altsFor(w);
      if(alt) fbOk(fb, `<span><b>${esc(alt.w)}</b> also fits this meaning. Another word for it is <b>${esc(w.w)}</b>. <span lang="zh-CN">${esc(alt.w)} 也对；另一个词是 ${esc(w.w)}。</span></span>${ex}`);
      else if(ok) fbOk(fb, (others.length?`<span>Also correct 也对: ${others.map(x=>esc(x.w)).join(', ')}</span>`:'')+ex);
      else fbNo(fb, w.w+(others.length?' (or '+others.map(x=>x.w).join(', ')+')':''), ex);
      settle(ok,card,st,deck,w,step); };
    keyHandler=null;
  };
  step();
}

// ----- Chinese side: True or false (does this meaning match the word?) -----
function playZhTF(){
  const p=zhWords(), deck=Deck(p), st=Stats('zhtf');
  zhShell('True or false','Does the meaning match the word? Press T or F, or tap. 释义和单词是否匹配？'); st.draw();
  const step=()=>{
    const w=deck.next(), truth=Math.random()<.5, other=truth?w:(distractors(w,p.length>=8?p:S.words,1)[0]||w), real=truth||other===w;
    const card=showCard(`<p class="instr">True or false? 对还是错？</p>
      <p class="prompt-word">${esc(w.w)}${w.pos?` <small>${esc(w.pos)}</small>`:''}</p><p class="zh-under" lang="zh-CN">${esc(ZH[w.id])}</p>
      <p class="statement">means: ${esc(other.def)}</p>
      <div class="tf-btns"><button class="tfb yes" data-v="1">True 对</button><button class="tfb no" data-v="0">False 错</button></div><div class="fb"></div>`);
    let done=false;
    const choose=v=>{ if(done) return; done=true; const ok=(v===1)===real;
      card.querySelectorAll('.tfb').forEach(b=>{ b.disabled=true; if(+b.dataset.v===(real?1:0)) b.classList.add('ok'); else b.classList.add('dim'); });
      const fb=card.querySelector('.fb'), note=`<span class="wd"><b>${esc(w.w)}</b> <span lang="zh-CN">${esc(ZH[w.id])}</span>: ${esc(w.def)}</span>`;
      ok?fbOk(fb,note):fbNo(fb,real?'True':'False',note);
      settle(ok,card,st,deck,w,step); };
    card.querySelectorAll('.tfb').forEach(b=>b.onclick=()=>choose(+b.dataset.v));
    keyHandler=e=>{ const k=e.key.toLowerCase(); if(k==='t'||e.key==='ArrowRight'||k==='1') choose(1); if(k==='f'||e.key==='ArrowLeft'||k==='2') choose(0); };
  };
  step();
}

// ----- Chinese side: Odd one out (by word group, or by part of speech with data-odd="pos") -----
// Odd one out groups by part of speech (data-odd="pos"), by topic when the data has topics, otherwise by set.
const oddKey = w => CFG.odd==='pos' ? (w.pos||'') : (S.topics && w.topic ? w.topic : w.set);
const oddLabel = k => CFG.odd==='pos' ? k : (((S.topics||[]).find(t=>t.id===k)||S.sets.find(s=>s.id===k)||{}).name||k);
function oddGroups(){ const g={}; zhWords().forEach(w=>{ const k=oddKey(w); if(k) (g[k]=g[k]||[]).push(w); }); return g; }
function oddReady(){ const g=oddGroups(), keys=Object.keys(g); return keys.length>=2 && keys.some(k=>g[k].length>=3); }
function playOdd(){
  const st=Stats('zhodd');
  zhShell('Odd one out','Three words belong together. Tap the odd one out. 三个词属于同一类，找出不同的那个。'); st.draw();
  const step=()=>{
    const g=oddGroups(), big=Object.keys(g).filter(k=>g[k].length>=3);
    const main=big[Math.floor(Math.random()*big.length)], others=Object.keys(g).filter(k=>k!==main);
    const three=shuffle(g[main]).filter((w,i,a)=>a.findIndex(x=>x.w===w.w)===i).slice(0,3);
    const oddK=others[Math.floor(Math.random()*others.length)], odd=shuffle(g[oddK])[0];
    const words=shuffle([...three,odd]);
    const card=showCard(`<p class="instr">Which word is the odd one out? 哪个词不同类？</p>
      <div class="opts">${words.map((w,i)=>`<button class="opt" data-id="${esc(w.id)}"><kbd>${i+1}</kbd><span>${esc(w.w)}</span></button>`).join('')}</div><div class="fb"></div>`);
    const btns=[...card.querySelectorAll('.opt')]; let done=false;
    const choose=b=>{ if(done) return; done=true; const ok=b.dataset.id===odd.id;
      btns.forEach(x=>{ x.disabled=true; const w=byId[x.dataset.id];
        x.innerHTML+=`<small class="opt-zh" lang="zh-CN">${esc(ZH[w.id]||'')}</small>`;
        if(x.dataset.id===odd.id) x.classList.add('ok'); else if(x===b) x.classList.add('no'); else x.classList.add('dim'); });
      const why = CFG.odd==='pos'
        ? `<span><b>${esc(odd.w)}</b> is ${/^[aeiou]/i.test(oddK)?'an':'a'} ${esc(oddK)}. The others are ${esc(main)}s.</span>`
        : `<span><b>${esc(odd.w)}</b> belongs to <i>${esc(oddLabel(oddK))}</i>. The others belong to <i>${esc(oddLabel(main))}</i>.</span>`;
      const fb=card.querySelector('.fb'); ok?fbOk(fb,why):fbNo(fb,odd.w,why);
      if(ok){ st.hit(odd); autoNext(card,step); } else { st.miss(odd); manualNext(card,step); } };
    btns.forEach(b=>b.onclick=()=>choose(b));
    keyHandler=e=>{ const n=parseInt(e.key,10); if(n>=1&&n<=btns.length) choose(btns[n-1]); };
  };
  step();
}

// ----- Chinese side: Challenge games (Speed round, Survival) -----
function challengeEnd(key, title, score, missed, again){
  clearTimers();
  const prev=store.get('best:'+key,0), isBest=score>prev; if(isBest) store.set('best:'+key,score);
  const card=showCard(`<div class="end"><p class="instr">${esc(title)} · finished 结束</p>
    <div class="big">${score}</div><h2>${isBest?'New best score! 新纪录！':'Best score 最高分: '+Math.max(prev,score)}</h2>
    ${missed.length?`<p class="instr" style="margin-top:22px">Words to practise 需要练习的单词</p><ul class="review">${[...new Map(missed.map(w=>[w.id,w])).values()].map(w=>`<li><b>${esc(w.w)}</b> <span lang="zh-CN">${esc(ZH[w.id]||'')}</span> – ${esc(w.def)}</li>`).join('')}</ul>`:''}
    <div class="end-actions"><button class="btn" id="again">Play again 再玩一次</button><a class="btn alt" href="#">All games 所有游戏</a></div></div>`);
  card.querySelector('#again').onclick=again;
  keyHandler=e=>{ if(e.key==='Enter'){ e.preventDefault(); again(); } };
}
function timerBar(){ return `<div class="timer"><i id="timeFill"></i></div>`; }
function playSpeed(){
  const p=zhWords(), deck=Deck(p), SECS=60; let score=0, missed=[], end=Date.now()+SECS*1000, over=false;
  zhShell('Speed round','60 seconds: see the Chinese, choose the English word. 60秒内尽量多答对。');
  document.getElementById('stats').innerHTML=`<span>Score <b id="sc">0</b></span><span><b id="secs">${SECS}</b>s</span>`;
  const feed=document.getElementById('feed'); feed.insertAdjacentHTML('beforebegin', timerBar());
  const tick=()=>{ if(over) return; const left=Math.max(0,end-Date.now());
    const f=document.getElementById('timeFill'); if(!f) return; f.style.width=(100*left/(SECS*1000))+'%';
    document.getElementById('secs').textContent=Math.ceil(left/1000);
    if(left<=0){ over=true; document.querySelector('.timer')?.remove(); challengeEnd('zhspeed','Speed round',score,missed,playSpeed); } else later(tick,100); };
  const step=()=>{ if(over) return;
    const w=deck.next(), ds=distractors(w,p.length>=8?p:S.words,3);
    mcCard({instr:'Choose the English word 选出英文单词', promptHtml:`<div class="zh-prompt" lang="zh-CN">${esc(ZH[w.id])}</div>`,
      options:[w.w,...ds.map(x=>x.w)], answer:w.w,
      onResult:(ok)=>{ P.record('zhspeed',w,ok); if(ok){ score++; document.getElementById('sc').textContent=score; later(step,250); } else { missed.push(w); later(step,900); } }});
  };
  tick(); step();
}
function playSurvival(){
  const p=zhWords(), deck=Deck(p); let lives=3, score=0, missed=[], limit=10000, over=false;
  zhShell('Survival','Three lives. Choose the meaning before time runs out. 三条命，在时间用完前选出释义。');
  const draw=()=>{ document.getElementById('stats').innerHTML=`<span>Score <b>${score}</b></span><span class="lives" aria-label="${lives} lives left">${'♥'.repeat(lives)}<span class="lost">${'♥'.repeat(3-lives)}</span></span>`; };
  draw();
  const feed=document.getElementById('feed'); feed.insertAdjacentHTML('beforebegin', timerBar());
  const lose=(w)=>{ lives--; missed.push(w); draw(); if(lives<=0){ over=true; document.querySelector('.timer')?.remove(); later(()=>challengeEnd('zhsurvive','Survival',score,missed,playSurvival),1100); return false; } return true; };
  const step=()=>{ if(over) return;
    const w=deck.next(), ds=distractors(w,p.length>=8?p:S.words,3), start=Date.now(), my=limit; let answered=false;
    mcCard({instr:'Choose the meaning 选出释义', promptHtml:`<p class="prompt-word">${esc(w.w)}${w.pos?` <small>${esc(w.pos)}</small>`:''}</p><p class="zh-under" lang="zh-CN">${esc(ZH[w.id])}</p>`,
      options:[w.def,...ds.map(x=>x.def)], answer:w.def, optClass:'long',
      onResult:(ok,card,fb)=>{ answered=true; P.record('zhsurvive',w,ok);
        if(ok){ score++; limit=Math.max(4000,limit-300); draw(); later(step,300); }
        else { fb.innerHTML=`<div class="feedback no"><span class="wd"><b>${esc(w.w)}</b> <span lang="zh-CN">${esc(ZH[w.id])}</span>: ${esc(w.def)}</span></div>`; if(lose(w)) later(step,1400); } }});
    const card=document.querySelector('#feed .card');
    const tick=()=>{ if(answered||over) return; const left=Math.max(0,my-(Date.now()-start));
      const f=document.getElementById('timeFill'); if(f) f.style.width=(100*left/my)+'%';
      if(left<=0){ answered=true; P.record('zhsurvive',w,false); card.querySelectorAll('.opt').forEach(b=>{ b.disabled=true; if(b.dataset.v===w.def) b.classList.add('ok'); else b.classList.add('dim'); });
        card.querySelector('.fb').innerHTML=`<div class="feedback no"><span class="verdict">Time's up! 时间到！</span><span class="wd"><b>${esc(w.w)}</b> <span lang="zh-CN">${esc(ZH[w.id])}</span>: ${esc(w.def)}</span></div>`;
        keyHandler=null; if(lose(w)) later(step,1400); }
      else later(tick,100); };
    tick();
  };
  step();
}

// ---------- LEVEL CARD (topic menus) and MY PROGRESS page ----------
function levelCard(){
  const zh=CFG.only==='zh', t=P.topic(), n=t?t.n:0, left=P.CAL-n;
  const head=`<p class="lvl-k">Your level${zh?' 你的水平':''}</p>`;
  if(n<P.CAL) return `<div class="lvl-card">${head}<p class="lvl-v">Finding your level…${zh?' 正在评估':''}</p><span class="lvl-bar"><i style="width:${n*100/P.CAL}%"></i></span>
    <p class="lvl-s">Answer ${left} more question${left===1?'':'s'} in any game below and your level will appear here.${zh?` 再答 ${left} 题即可看到你的水平。`:''}</p></div>`;
  const L=P.label(t.r), w=t.words, rec=P.recommended(), same=rec.length===chosen.length && rec.every(x=>chosen.includes(x));
  return `<div class="lvl-card">${head}<p class="lvl-v"><b>${nameHtml(L.name)}</b>${zh&&L.zh?`<span lang="zh-CN">${L.zh}</span>`:''}</p><span class="lvl-bar"><i style="width:${L.pct}%"></i></span>
    <p class="lvl-s">${L.next?`${L.pct}% of the way to ${esc(L.next)}`:'Top level'}${w&&w.total?` · words: ${w.known} known, ${w.fam} familiar, ${w.learn} learning (of ${w.total})`:''} · <a href="${ROOT}progress/index.html">All my progress${zh?' 我的进步':''}</a></p>
    ${rec.length && !same && S.sets.length>1 ? `<p class="lvl-s"><span class="dot-good"></span> marks the sets that suit your level.${zh?' 绿点表示适合你水平的词组。':''} <button class="btn alt small" id="pickLevel">Choose these for me${zh?' 帮我选择':''}</button></p>`:''}</div>`;
}
function wirePickLevel(again){ const b=document.getElementById('pickLevel'); if(b) b.onclick=()=>{ const rec=P.recommended(); if(rec.length){ chosen=rec; store.set('sets',chosen); again(); } }; }
function progressPage(){
  const d=P.refresh(), list=Object.values(d.topics).sort((a,b)=>(b.last||0)-(a.last||0));
  const answers=list.reduce((s,t)=>s+t.n,0), right=list.reduce((s,t)=>s+t.right,0);
  const ws=Object.values(d.words), known=ws.filter(w=>w.s>=4).length, learning=ws.filter(w=>w.s>=1&&w.s<4).length;
  let streak=0; const dt=new Date(); if(!d.days[P.dayKey(dt)]) dt.setDate(dt.getDate()-1); while(d.days[P.dayKey(dt)]){ streak++; dt.setDate(dt.getDate()-1); }
  const last=[]; for(let i=13;i>=0;i--){ const x=new Date(); x.setDate(x.getDate()-i); last.push([x, d.days[P.dayKey(x)]||0]); }
  const max=Math.max(1,...last.map(x=>x[1])), ov=P.overall(), L=ov!=null?P.label(ov):null;
  const row=t=>{ const found=t.n>=P.CAL, l=found?P.label(t.r):null, w=t.words;
    return `<a class="prog-row" href="${esc(t.href||'#')}"><span class="prog-name">${esc(t.name)}<small>${t.side==='zh'?'中文版':'English'}</small></span>
      <span class="prog-lvl">${found?`<b>${nameHtml(l.name)}</b>${t.side==='zh'&&l.zh?` <span lang="zh-CN">${l.zh}</span>`:''}`:`Finding level · ${t.n} of ${P.CAL}`}</span>
      <span class="lvl-bar"><i style="width:${found?l.pct:t.n*100/P.CAL}%"></i></span>
      <span class="prog-meta">${w&&w.total?`${w.known} of ${w.total} words known · `:''}${t.n} answers · ${t.n?Math.round(100*t.right/t.n):0}% right</span></a>`; };
  let back={href:CFG.back||'../index.html', label:CFG.backLabel||'Back'};
  try{ const ref=document.referrer && new URL(document.referrer);
    if(ref && ref.origin===location.origin && ref.pathname!==location.pathname) back={href:ref.href, label:'Back'};
    else { const side=(list[0]||{}).side; if(side) back={href:ROOT+(side==='zh'?'zh':'en')+'/index.html', label:side==='zh'?'中文版 Chinese version':'English topics'}; }
  }catch(e){}
  frame(back, `
  <section class="hero"><p class="eyebrow">My progress 我的进步</p>
    <h1>${L?`${nameHtml(L.name)} <span class="h-sub" lang="zh-CN">${L.zh}</span>`:'Let’s find your level'}</h1>
    <p>${L?`Your overall level, from everything you have played.${L.next?` You are ${L.pct}% of the way to ${esc(L.next)}.`:''}`:`Play any game. After ${P.CAL} answers in a topic, your level appears here. 在任一主题答 ${P.CAL} 题后，这里会显示你的水平。`}</p>
    ${L?`<span class="lvl-bar lvl-big"><i style="width:${L.pct}%"></i></span>`:''}
  </section>
  <div class="stat-tiles"><div class="stat"><b>${answers}</b><span>answers</span></div><div class="stat"><b>${answers?Math.round(100*right/answers):0}%</b><span>right</span></div>
    <div class="stat"><b>${streak}</b><span>day${streak===1?'':'s'} in a row</span></div><div class="stat"><b>${known}</b><span>words known · ${learning} learning</span></div></div>
  <p class="instr">Answers, last 14 days</p>
  <div class="days" role="img" aria-label="Answers per day over the last 14 days">${last.map(([x,n])=>`<i class="${n?'':'zero'}" style="height:${n?Math.max(6,Math.round(100*n/max)):3}%" title="${x.toDateString()}: ${n} answers"></i>`).join('')}</div>
  <p class="instr">Topics</p>
  <div class="prog-list">${list.length?list.map(row).join(''):'<p class="notice">No games played yet on this device. 这台设备上还没有游戏记录。</p>'}</div>
  <p class="hint" style="margin-top:22px">Progress is saved in this browser on this device. Clearing browsing data, or using another computer, starts again.</p>`);
}

// ---------- WORD LIST ----------
function wordList(){
  frame({href:'#', label:CFG.name||'Back'}, `<div class="bar"><span class="title">Word list</span></div>
    <input class="search" id="q" type="search" placeholder="Search words or meanings" aria-label="Search the word list"><div id="list"></div>`);
  let q='';
  const draw=()=>{ const t=q.trim().toLowerCase(); let html='';
    for(const s of S.sets){ const ws=S.words.filter(w=>w.set===s.id && (!t||w.w.toLowerCase().includes(t)||w.def.toLowerCase().includes(t)||(w.syn||[]).some(x=>x.includes(t))||(ZH[w.id]||'').includes(t)));
      if(!ws.length) continue;
      html+=`<p class="instr" style="margin:22px 0 8px">${esc(s.name)}</p><div class="wl">${ws.map(w=>`<div class="wl-row">
        <div class="w">${esc(w.w)}${w.pos?`<small>${esc(w.pos)}</small>`:''}${ZH[w.id]&&CFG.only==='zh'?`<span class="zh" lang="zh-CN">${esc(ZH[w.id])}</span>`:''}</div>
        <div class="d">${esc(w.def)}${w.ex?`<br><i>${esc(w.ex)}</i>`:''}${w.syn&&w.syn.length?`<div class="syns">≈ ${esc(w.syn.join(' · '))}</div>`:''}</div></div>`).join('')}</div>`; }
    document.getElementById('list').innerHTML=html||'<p>No words match that search.</p>'; };
  document.getElementById('q').oninput=e=>{q=e.target.value; draw();}; draw();
}

// ---------- router ----------
function route(){
  const h=location.hash.replace(/^#/,'');
  if(CFG.only==='progress') return progressPage();
  if(CFG.only==='passage'){   // a page that is just one reading game (e.g. Close reading)
    const back={href:CFG.back||'../index.html', label:CFG.backLabel||'Back'};
    const msg = PHONE ? 'Reading games are only available on desktop devices. Open this page on a computer to play.'
      : readingState==='loading' ? 'Loading passages…'
      : readingState==='failed' ? 'The passages could not be loaded. They load when the site is online.'
      : !(S.passages||[]).length ? 'No passages yet. Check back soon.' : '';
    if(msg) return frame(back, `<section class="hero"><p class="eyebrow">${esc(CFG.eyebrow||'Reading')}</p><h1>${esc(CFG.name||'')}</h1>${CFG.blurb?`<p>${esc(CFG.blurb)}</p>`:''}<p class="notice">${msg}</p></section>`);
    if(CFG.format==='notes') return playNotes();
    GAMES.find(g=>g.key==='passage').name = CFG.name || 'Read and answer';
    return playPassage();
  }
  if(CFG.only==='zh'){
    if(h==='words') return wordList();
    const g=ZH_GAMES.find(x=>'play-'+x.key===h);
    return g && !(g.needs && !g.needs()) ? g.run() : zhMenu();
  }
  if(!h) return menu();
  if(h==='words') return wordList();
  if(CATS[h]) return category(h);
  if(h.startsWith('play-')){
    const g=GAMES.find(x=>x.key===h.slice(5));
    if(g && !(CATS[g.cat].desktop && PHONE) && g.items().length>=g.min) return g.run();
    return category(g?g.cat:'vocab');
  }
  menu();
}
window.addEventListener('hashchange', route);
window.addEventListener('resize', ()=>{ const p=isPhone(); if(p!==PHONE){ PHONE=p; document.documentElement.classList.toggle('phone',PHONE);
  // re-draw menus for the new screen size, but never wipe a game in progress on a computer
  const h=location.hash.replace(/^#/,''); if((!h||CATS[h]) && !(document.getElementById('feed') && !PHONE)) route(); } });
route();
})();
