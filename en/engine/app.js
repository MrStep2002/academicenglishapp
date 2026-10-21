// English games engine: one set of games for every subject.
// A subject page loads its data (window.SUBJECT) and then this file.
// Routes (the part after # in the address): menu, #vocab, #grammar, #reading, #play-<game>, #words
(function(){
'use strict';
const S = window.SUBJECT;
const $app = document.getElementById('app');
const CFG = $app.dataset;               // data-name, data-blurb, data-back, data-back-label, data-only, data-sets, data-store
if(CFG.sets){ const keep=CFG.sets.split(','); S.sets=S.sets.filter(x=>keep.includes(x.id)); }
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

let chosen = store.get('sets', S.sets.map(s=>s.id));
chosen = chosen.filter(id=>S.sets.some(s=>s.id===id)); if(!chosen.length) chosen=S.sets.map(s=>s.id);
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
  let queue=[], last=null;
  const refill=()=>{ queue=shuffle(items); if(queue.length>1 && queue[0]===last) queue.push(queue.shift()); };
  return {
    next(){ if(!queue.length) refill(); last=queue.shift(); return last; },
    retry(item){ const pos=Math.min(queue.length, 3+Math.floor(Math.random()*3)); queue.splice(pos,0,item); }
  };
}
function Stats(game){
  const s={answered:0,correct:0,streak:0,best:store.get('streak:'+game,0)};
  s.hit=()=>{ s.answered++; s.correct++; s.streak++; if(s.streak>s.best){ s.best=s.streak; store.set('streak:'+game,s.best);} s.draw(); };
  s.miss=()=>{ s.answered++; s.streak=0; s.draw(); };
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
  {key:'own',      cat:'reading', name:'In your own words', blurb:'Paper 1 style: what does the writer mean by each underlined word, in context?', items:()=>pick(S.extracts), min:1, run:()=>playOwn()},
  {key:'read',     cat:'reading', name:'Read it',           blurb:'Read a short text about a media product and answer a question.', items:()=>pick(S.reads), min:1, run:()=>playRead()},
  {key:'question', cat:'reading', name:'Answer the question', blurb:'Read an exam question and choose the answer that does what it asks.', items:()=>pick(S.questions), min:1, run:()=>playQuestion()}
];
// Only games this subject has content for
const gamesIn = cat => GAMES.filter(g => g.cat===cat && (S[{match:'words',syn:'words',meaning:'words',gap:'gaps',build:'builds',error:'errors',tf:'tf',own:'extracts',read:'reads',question:'questions'}[g.key]]||[]).length && (g.key!=='syn' || S.words.some(w=>w.syn)));

// ---------- page frame ----------
function frame(back, inner){
  clearTimers(); keyHandler=null;
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
      ${S.sets.map(s=>`<button class="chip" data-set="${s.id}" aria-pressed="${chosen.includes(s.id)}">${esc(s.name)}${s.lv?` <small>${esc(s.lv)}</small>`:''}</button>`).join('')}
    </div>`:''}
    <p class="setnote">${n} words selected.</p>
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
}

// ---------- CATEGORY: list of games ----------
function category(cat){
  const c=CATS[cat];
  if(c.desktop && PHONE){
    frame({href:'#', label:CFG.name||'Back'}, `<section class="hero"><p class="eyebrow">${esc(CFG.name||'')}</p><h1>${c.name}</h1>
      <p class="notice">Reading games are only available on desktop devices. Open this page on a computer to play them.</p></section>`);
    return;
  }
  frame({href:'#', label:CFG.name||'Back'}, `
  <section class="hero"><p class="eyebrow">${esc(CFG.name||'')}</p><h1>${c.name}</h1><p>${c.blurb}</p></section>
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
  frame({href:'#'+game.cat, label:c.name}, `<div class="bar"><span class="title">${game.name}</span><span class="spacer"></span><div class="stats" id="stats"></div></div>
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

function mcCard({instr, promptHtml, options, answer, onResult, optClass}){
  const opts = shuffle(options);
  const card = showCard(`<p class="instr">${instr}</p>${promptHtml}
    <div class="opts${optClass?' '+optClass:''}">${opts.map((o,i)=>`<button class="opt" data-v="${esc(o)}"><kbd>${i+1}</kbd><span>${esc(o)}</span></button>`).join('')}</div>
    <div class="fb"></div>`);
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
  if(ok){ st.hit(); autoNext(card, next); } else { st.miss(); deck.retry(item); manualNext(card, next); }
}

// ---------- VOCABULARY: Match the meaning / Synonym groups ----------
function playMatch(mode, withZh){
  const game=withZh ? {key:'zhmatch', name:'Match the meaning', items:zhWords} : GAMES.find(g=>g.key===(mode==='def'?'match':'syn'));
  const PER=5, REFILL_AT=3;
  const p=game.items(), deck=Deck(p), st=Stats(game.key);
  if(withZh) zhShell(game.name,'Tap a word, then its English meaning. 点击单词，再点击它的英文释义。');
  else shell(game, mode==='def'?'Tap a word, then its meaning. New pairs appear as you clear them.':'Tap a word, then the group that means something similar.');
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
  const paint=fresh=>{
    tiles('L').forEach((t,i)=>{ const w=L[i]; t.className='tile word'+(w?'':' gone')+(w&&fresh&&fresh.includes(w)?' fresh':''); t.innerHTML=w?esc(w.w)+(withZh&&ZH[w.id]?`<small class="tile-zh" lang="zh-CN">${esc(ZH[w.id])}</small>`:''):''; t.dataset.id=w?w.id:''; t.disabled=!w; });
    tiles('R').forEach((t,i)=>{ const w=R[i]; t.className='tile '+mode+(w?'':' gone')+(w&&fresh&&fresh.includes(w)?' fresh':''); t.innerHTML=w?right(w):''; t.dataset.id=w?w.id:''; t.disabled=!w; });
  };
  paint(first);
  let sel=null; const wrongOn=new Set();
  const toast=(m,bad)=>{ const t=card.querySelector('#toast'); t.textContent=m; t.className='toast'+(bad?' no':''); };
  const refill=()=>{ const eL=[],eR=[]; L.forEach((w,i)=>{if(!w)eL.push(i);}); R.forEach((w,i)=>{if(!w)eR.push(i);});
    const fresh=draw(eL.length, L.filter(Boolean)); const sl=shuffle(eL), sr=shuffle(eR);
    fresh.forEach((w,i)=>{ L[sl[i]]=w; R[sr[i]]=w; }); paint(fresh); };
  card.addEventListener('click', e=>{
    const t=e.target.closest('.tile'); if(!t||t.disabled||t.classList.contains('done')) return;
    if(!sel||sel.dataset.side===t.dataset.side){ if(sel) sel.classList.remove('sel'); sel=t; t.classList.add('sel'); return; }
    const a=sel,b=t; a.classList.remove('sel'); sel=null;
    const left=a.dataset.side==='L'?a:b, id=left.dataset.id;
    if(a.dataset.id===b.dataset.id){
      [a,b].forEach(x=>{x.classList.add('done'); x.disabled=true;});
      if(wrongOn.has(id)){ wrongOn.delete(id); st.miss(); } else st.hit();
      toast('Correct: '+byId[id].w);
      later(()=>{ L[+(a.dataset.side==='L'?a:b).dataset.slot]=null; R[+(a.dataset.side==='R'?a:b).dataset.slot]=null;
        if(L.filter(x=>!x).length>=REFILL_AT) refill(); else paint(); }, 450);
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
        if(ok) st.hit(); else { st.miss(); allRight=false; }
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

// ---------- CHINESE SIDE (data-only="zh"): vocabulary games with Chinese support ----------
// Chinese appears next to the key word only. Answer options are always English.
const ZH = Object.fromEntries((window.SUBJECT_ZH||[]).map(x=>[x.id,x.zh]));
const zhWords = () => pick(S.words).filter(w=>ZH[w.id]);
const ZH_GAMES = [
  {key:'zh',      name:'中文 → English',  zh:'看中文，选英文', blurb:'See the Chinese meaning and choose the English word.', run:()=>playZh()},
  {key:'zhmatch', name:'Match the meaning', zh:'单词配释义', blurb:'Match each word to its English meaning. The Chinese is shown under the word.', run:()=>playMatch('def', true)},
  {key:'zhmean',  name:'Choose the meaning', zh:'选出释义', blurb:'See the word and its Chinese, then choose the English meaning.', run:()=>playZhMeaning()}
];
function zhMenu(){
  const n=zhWords().length;
  frame({href:CFG.back||'../index.html', label:CFG.backLabel||'中文版 Chinese version'}, `
  <section class="hero">
    <p class="eyebrow">Chinese version 中文版</p>
    <h1>${esc(CFG.name||'')}</h1>
    ${CFG.blurb?`<p>${esc(CFG.blurb)}</p>`:''}
    ${S.sets.length>1?`<div class="sets" role="group" aria-label="Word groups">${S.sets.map(s=>`<button class="chip" data-set="${s.id}" aria-pressed="${chosen.includes(s.id)}">${esc(s.name)}${s.lv?` <small>${esc(s.lv)}</small>`:''}</button>`).join('')}</div>`:''}
    <p class="setnote">${n} words selected. 已选 ${n} 个单词。</p>
  </section>
  <div class="games">${ZH_GAMES.map(g=>{ const best=store.get('streak:'+g.key,0);
    return `<a class="game" href="#play-${g.key}"><h3>${g.name}</h3><p lang="zh-CN" class="zh-sub">${g.zh}</p><p>${g.blurb}</p>
      <span class="best">${best?'Best streak: '+best:'Not played yet'}</span></a>`; }).join('')}</div>
  <div class="wl-link"><p>See every word with its Chinese meaning. 查看所有单词和中文释义。</p><a class="btn alt" href="#words">Word list 词汇表</a></div>`);
  $app.querySelectorAll('.chip').forEach(c=>c.onclick=()=>{ const s=c.dataset.set;
    if(chosen.includes(s)){ if(chosen.length>1) chosen=chosen.filter(x=>x!==s); } else chosen=S.sets.map(x=>x.id).filter(x=>x===s||chosen.includes(x));
    store.set('sets',chosen); zhMenu(); });
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
  if(CFG.only==='zh'){
    if(h==='words') return wordList();
    const g=ZH_GAMES.find(x=>'play-'+x.key===h);
    return g ? g.run() : zhMenu();
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
  const h=location.hash.replace(/^#/,''); if(!h||CATS[h]) route(); } });
route();
})();
