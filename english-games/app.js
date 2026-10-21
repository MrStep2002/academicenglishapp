// Golden 100 Word Games: continuous play.
// Data comes from data/words.js, data/gaps.js and data/extracts.js.
(function(){
const WORDS = window.WORDS_RAW.map(r=>({id:r[0],w:r[1],pos:r[2],def:r[3],ex:r[4],zh:r[5],syn:r[6],fam:r[7],set:Math.ceil(r[0]/20)}));
const SETS = window.SETS, GAPS = window.GAPS, EXTRACTS = window.EXTRACTS, ERRORS = window.ERRORS || [];
const byId = Object.fromEntries(WORDS.map(w=>[w.id,w]));
const $app = document.getElementById('app');
const AUTO_MS = 1500;

// ---------- helpers ----------
const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuffle = a => { a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const store = {
  get(k,d){ try{ const v=localStorage.getItem('g100:'+k); return v==null?d:JSON.parse(v);}catch(e){return d;} },
  set(k,v){ try{ localStorage.setItem('g100:'+k, JSON.stringify(v)); }catch(e){} }
};
let chosen = store.get('sets',[1,2,3,4,5]);
if(!Array.isArray(chosen)||!chosen.length) chosen=[1,2,3,4,5];
const inSets = id => chosen.includes(Math.ceil(id/20));
const pool = () => WORDS.filter(w=>inSets(w.id));
const descSets = () => chosen.filter(s=>s>1);

let keyHandler=null, timers=[];
document.addEventListener('keydown', e => { if(keyHandler && !e.metaKey && !e.ctrlKey && !e.altKey && e.target.tagName!=='INPUT') keyHandler(e); });
const later = (fn,ms) => { const t=setTimeout(fn,ms); timers.push(t); return t; };
const clearTimers = () => { timers.forEach(clearTimeout); timers=[]; };

// An endless deck: shuffled, refilled when empty, and missed items come back a few cards later.
function Deck(items){
  let queue=[], last=null;
  const refill=()=>{ queue=shuffle(items); if(queue.length>1 && queue[0]===last) queue.push(queue.shift()); };
  return {
    next(){ if(!queue.length) refill(); last=queue.shift(); return last; },
    retry(item){ const pos=Math.min(queue.length, 3+Math.floor(Math.random()*3)); queue.splice(pos,0,item); },
    peekAll(){ return queue; }
  };
}

// Session stats shown in the bar
function Stats(key){
  const s={answered:0,correct:0,streak:0,best:store.get('streak:'+key,0)};
  s.hit=()=>{ s.answered++; s.correct++; s.streak++; if(s.streak>s.best){ s.best=s.streak; store.set('streak:'+key,s.best);} s.draw(); };
  s.miss=()=>{ s.answered++; s.streak=0; s.draw(); };
  s.draw=()=>{ const el=document.getElementById('stats'); if(!el) return;
    el.innerHTML=`<span>Correct <b>${s.correct}</b>/${s.answered}</span><span class="streak">Streak <b>${s.streak}</b></span><span>Best streak <b>${s.best}</b></span>`; };
  return s;
}

const GAMES = [
  {key:'gap', name:'Fill the gap', blurb:'Choose the only word that fits the sentence. Check both meaning and grammar.',
   sample:'She <span class="gap-blank"></span> before opening the envelope.', run:()=>playGap()},
  {key:'def', name:'Match the meaning', blurb:'Pair words with their definitions. Cleared pairs are replaced, so it never ends.',
   sample:'<b>linger</b> &nbsp;⟷&nbsp; stay longer than expected', run:()=>playMatch('def')},
  {key:'syn', name:'Synonym groups', blurb:'Match each word to a group of words with a similar meaning.',
   sample:'<b>serene</b> &nbsp;⟷&nbsp; tranquil · calm · still', run:()=>playMatch('syn')},
  {key:'own', name:'In your own words', blurb:'Paper 1 style: what does the writer mean by each underlined word, in context? Uses the Describing sets.',
   sample:'The <u>oppressive</u> heat <u>lingered</u> long after sunset…', run:()=>playOwn(), needsDesc:true},
  {key:'err', name:'Spot the error', blurb:'Read a paragraph and tap every word with a grammar mistake. Academic sets give analysis paragraphs; Describing sets give description.',
   sample:'The wind was <u>harshly</u> and cold. The sky <u>become</u> darker…', run:()=>playErr()},
  {key:'zh', name:'中文 → English', blurb:'See the Chinese meaning and choose the English word. The only translation game.',
   sample:'<span class="zh">不祥的</span> → ominous?', run:()=>playZh()}
];

// Back link: on the games menu it goes to the site homepage (if the page says where that is);
// inside a game or the word list it goes back to the games menu.
const SITE_HOME = $app.dataset.siteHome || '';
function topbar(onMenu){
  const back = onMenu
    ? (SITE_HOME ? `<a class="back" href="${esc(SITE_HOME)}">← All games</a>` : '')
    : `<button class="back" id="backBtn">← Back to games</button>`;
  return `${back}<div class="top"><button class="brand" id="home" aria-label="Golden 100 games menu"><b>Golden 100</b><span>Word games · 0500 / 0408</span></button>
  <button class="ghost" id="wlBtn">Word list</button></div>`;
}
function wireTop(){
  document.getElementById('home').onclick=home; document.getElementById('wlBtn').onclick=wordList;
  const b=document.getElementById('backBtn'); if(b) b.onclick=home;
}

// ---------- HOME ----------
function home(){
  keyHandler=null; clearTimers();
  const n = pool().length, ownOff = descSets().length===0;
  $app.innerHTML = topbar(true) + `
  <section class="hero">
    <h1>Use the words, don't just translate them.</h1>
    <p>Six games built on the Golden 100, for students working from upper B1 towards C1. Pick the word sets, choose a game and keep going for as long as you like.</p>
    <div class="sets" role="group" aria-label="Word sets">
      ${SETS.map(s=>`<button class="chip" data-set="${s.n}" aria-pressed="${chosen.includes(s.n)}">${s.name} <small>${s.lvl}</small></button>`).join('')}
    </div>
    <p class="setnote">${n} words selected (${chosen.length===5?'all sets':chosen.length+' of 5 sets'}).</p>
  </section>
  <div class="games">
    ${GAMES.map(g=>{ const off = g.needsDesc && ownOff; const b=store.get('streak:'+g.key,0);
      return `<button class="game" data-g="${g.key}" ${off?'disabled aria-disabled="true"':''}>
      <span class="mono">Game</span>
      <h3>${g.name}</h3><p>${g.blurb}</p>
      <div class="sample">${g.sample}</div>
      ${off?'<span class="lock">Select at least one Describing set to play.</span>':`<span class="best">${b?'Best streak: '+b:'Not played yet'}</span>`}</button>`}).join('')}
  </div>
  <div class="wl-link"><p>Need to look a word up first? The word list has every definition, example and synonym group.</p><button class="btn alt" id="wl2">Open word list</button></div>
  <p class="footer">${GAPS.length} gap-fill sentences · ${EXTRACTS.length} extracts · ${ERRORS.length} error paragraphs · 100 words. Streaks are saved in this browser only.</p>`;
  wireTop();
  document.getElementById('wl2').onclick=wordList;
  $app.querySelectorAll('.chip').forEach(c=>c.onclick=()=>{
    const s=+c.dataset.set;
    if(chosen.includes(s)){ if(chosen.length>1) chosen=chosen.filter(x=>x!==s); }
    else chosen=[...chosen,s].sort();
    store.set('sets',chosen); home();
  });
  $app.querySelectorAll('.game').forEach(b=>b.onclick=()=>{ if(!b.disabled) GAMES.find(g=>g.key===b.dataset.g).run(); });
}

function shell(title, note){
  clearTimers();
  $app.innerHTML = topbar() + `<div class="bar"><span class="title">${title}</span><span class="spacer"></span><div class="stats" id="stats"></div></div>
    ${note?`<p class="hint" style="margin:-8px 0 14px">${note}</p>`:''}<div class="feed" id="feed"></div>`;
  wireTop();
}
// Slide the old card up and the new one in, like a feed.
function showCard(html){
  const feed=document.getElementById('feed');
  const old=feed.querySelector('.card');
  const card=document.createElement('div'); card.className='card enter'; card.innerHTML=html;
  if(old){ old.remove(); }
  feed.appendChild(card);
  const top=feed.getBoundingClientRect().top; if(top<0) window.scrollBy(0, top-16);
  return card;
}
// After a correct answer, move on automatically; Enter or a tap skips the wait.
function autoNext(card, go){
  const bar=document.createElement('div'); bar.className='auto'; bar.innerHTML='<i></i>';
  bar.style.setProperty('--dur', AUTO_MS+'ms');
  card.appendChild(bar);
  requestAnimationFrame(()=>requestAnimationFrame(()=>bar.classList.add('run')));
  let done=false; const fire=()=>{ if(done) return; done=true; clearTimers(); go(); };
  later(fire, AUTO_MS);
  card.addEventListener('click', e=>{ if(!e.target.closest('button')) fire(); });
  keyHandler = e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); fire(); } };
}
// After a wrong answer, wait for the student.
function manualNext(card, go, label){
  const row=document.createElement('div'); row.className='next-row';
  row.innerHTML=`<button class="btn">${label||'Next →'}</button>`;
  card.appendChild(row);
  const b=row.querySelector('button'); b.onclick=go; b.focus({preventScroll:true});
  keyHandler = e=>{ if(e.key==='Enter'){ e.preventDefault(); go(); } };
}
const wordNote = w => `<span class="wd"><b>${esc(w.w)}</b> (${w.pos}): ${esc(w.def)}</span>`;

// Multiple-choice card used by Fill the gap and 中文 → English
function mcCard({instr, promptHtml, options, answer, onResult}){
  const opts = shuffle(options);
  const card = showCard(`<p class="instr">${instr}</p>${promptHtml}
    <div class="opts">${opts.map((o,i)=>`<button class="opt" data-v="${esc(o)}"><kbd>${i+1}</kbd><span>${esc(o)}</span></button>`).join('')}</div>
    <div class="fb"></div>`);
  const btns=[...card.querySelectorAll('.opt')];
  let answered=false;
  const choose = b => {
    if(answered) return; answered=true;
    const ok=b.dataset.v===answer;
    btns.forEach(x=>{ x.disabled=true; if(x.dataset.v===answer) x.classList.add('ok'); else if(x===b) x.classList.add('no'); else x.classList.add('dim'); });
    onResult(ok, card, card.querySelector('.fb'));
  };
  btns.forEach(b=>b.onclick=()=>choose(b));
  keyHandler = e=>{ const n=parseInt(e.key,10); if(n>=1&&n<=btns.length) choose(btns[n-1]); };
}

// ---------- GAME: FILL THE GAP ----------
function playGap(){
  const items = GAPS.filter(g=>inSets(g[0]));
  const deck = Deck(items), st = Stats('gap');
  shell('Fill the gap', `${items.length} sentences in your selected sets. Correct answers move on by themselves.`);
  st.draw();
  const step = () => {
    const g=deck.next(), parts=g[1].split('___');
    mcCard({instr:'Choose the word that fits the gap',
      promptHtml:`<p class="sentence">${esc(parts[0])}<span class="slot">&nbsp;</span>${esc(parts[1])}</p>`,
      options:[g[2],...g[3]], answer:g[2],
      onResult:(ok,card,fb)=>{
        const s=card.querySelector('.slot'); s.textContent=g[2]; s.classList.add(ok?'ok':'no');
        if(ok){ st.hit(); fb.innerHTML=`<div class="feedback ok"><span class="verdict">Correct.</span><span>${g[4]}</span></div>`; autoNext(card, step); }
        else { st.miss(); deck.retry(g);
          fb.innerHTML=`<div class="feedback no"><span class="verdict">Not quite. The answer is ${esc(g[2])}.</span><span>${g[4]}</span>${wordNote(byId[g[0]])}</div>`;
          manualNext(card, step); }
      }});
  };
  step();
}

// ---------- GAME: 中文 → ENGLISH ----------
function playZh(){
  const p = pool(), deck = Deck(p), st = Stats('zh');
  shell('中文 → English', 'Correct answers move on by themselves.');
  st.draw();
  const step = () => {
    const w=deck.next();
    const ok = x => x.id!==w.id && (!w.fam || x.fam!==w.fam);
    let cand = shuffle(p.filter(x=>ok(x)&&x.pos===w.pos));
    cand = cand.concat(shuffle(WORDS.filter(x=>ok(x)&&x.pos===w.pos&&!cand.includes(x))));
    cand = cand.concat(shuffle(p.filter(x=>ok(x)&&x.pos!==w.pos)));
    const fams=new Set(), ds=[];
    for(const c of cand){ if(c.fam&&fams.has(c.fam)) continue; if(ds.includes(c.w)) continue; ds.push(c.w); if(c.fam) fams.add(c.fam); if(ds.length===3) break; }
    mcCard({instr:'Choose the English word',
      promptHtml:`<div class="zh-prompt" lang="zh-CN">${esc(w.zh)}</div><div class="pos">${w.pos}</div>`,
      options:[w.w,...ds], answer:w.w,
      onResult:(good,card,fb)=>{
        if(good){ st.hit(); fb.innerHTML=`<div class="feedback ok"><span class="verdict">Correct.</span><span class="wd"><i>${esc(w.ex)}</i></span></div>`; autoNext(card, step); }
        else { st.miss(); deck.retry(w);
          fb.innerHTML=`<div class="feedback no"><span class="verdict">Not quite. The answer is ${esc(w.w)}.</span>${wordNote(w)}<span class="wd"><i>${esc(w.ex)}</i></span></div>`;
          manualNext(card, step); }
      }});
  };
  step();
}

// ---------- GAMES: MATCH THE MEANING / SYNONYM GROUPS ----------
// Five pairs on screen. When three pairs are cleared, three new ones slide into the empty spaces.
function playMatch(mode){
  const title = mode==='def'?'Match the meaning':'Synonym groups';
  const PER=5, REFILL_AT=3;
  let p = pool(); if(p.length<8) p=WORDS;
  const deck = Deck(p), st = Stats(mode);
  shell(title, mode==='def'?'Tap a word, then its meaning. New pairs appear as you clear them.':'Tap a word, then the group that means something similar. New pairs appear as you clear them.');
  st.draw();
  const clash = (w, onBoard) => onBoard.some(o => o.id===w.id || (w.fam && o.fam===w.fam) || o.syn.some(s=>w.syn.includes(s)));
  const draw = (n, onBoard) => { // take n compatible words from the deck
    const out=[], skipped=[]; let guard=0;
    while(out.length<n && guard++<300){ const w=deck.next(); if(clash(w,[...onBoard,...out])) skipped.push(w); else out.push(w); }
    skipped.forEach(w=>deck.retry(w));
    return out;
  };
  const rightHtml = w => mode==='def' ? esc(w.def) : w.syn.map(s=>`<span>${esc(s)}</span>`).join('');
  const L=new Array(PER).fill(null), R=new Array(PER).fill(null);
  const first = draw(PER, []);
  const lo=shuffle([...Array(PER).keys()]), ro=shuffle([...Array(PER).keys()]);
  first.forEach((w,i)=>{ L[lo[i]]=w; R[ro[i]]=w; });
  const card = showCard(`<p class="instr">${mode==='def'?'Match each word to its meaning':'Match each word to its synonym group'}</p>
    <div class="match"><div class="col left">${L.map((_,i)=>`<button class="tile word" data-side="L" data-slot="${i}"></button>`).join('')}</div>
    <div class="col right">${R.map((_,i)=>`<button class="tile ${mode}" data-side="R" data-slot="${i}"></button>`).join('')}</div></div>
    <p class="toast" id="toast" aria-live="polite"></p>`);
  const tiles = side => [...card.querySelectorAll(`.tile[data-side="${side}"]`)];
  const paint = (fresh) => {
    tiles('L').forEach((t,i)=>{ const w=L[i]; t.className='tile word'+(w?'':' gone')+(w&&fresh&&fresh.includes(w)?' fresh':''); t.innerHTML=w?esc(w.w):''; t.dataset.id=w?w.id:''; t.disabled=!w; });
    tiles('R').forEach((t,i)=>{ const w=R[i]; t.className='tile '+mode+(w?'':' gone')+(w&&fresh&&fresh.includes(w)?' fresh':''); t.innerHTML=w?rightHtml(w):''; t.dataset.id=w?w.id:''; t.disabled=!w; });
  };
  paint(first);
  let sel=null; const wrongOn=new Set();
  const toast=(msg,bad)=>{ const t=card.querySelector('#toast'); t.textContent=msg; t.className='toast'+(bad?' no':''); };
  const refill = () => {
    const emptyL=[], emptyR=[]; L.forEach((w,i)=>{ if(!w) emptyL.push(i); }); R.forEach((w,i)=>{ if(!w) emptyR.push(i); });
    const onBoard=L.filter(Boolean);
    const fresh=draw(emptyL.length, onBoard);
    const sl=shuffle(emptyL), sr=shuffle(emptyR);
    fresh.forEach((w,i)=>{ L[sl[i]]=w; R[sr[i]]=w; });
    paint(fresh);
  };
  card.addEventListener('click', e=>{
    const t=e.target.closest('.tile'); if(!t||t.disabled||t.classList.contains('done')) return;
    if(!sel||sel.dataset.side===t.dataset.side){ if(sel) sel.classList.remove('sel'); sel=t; t.classList.add('sel'); return; }
    const a=sel, b=t; a.classList.remove('sel'); sel=null;
    const left = a.dataset.side==='L'?a:b, id=+left.dataset.id;
    if(a.dataset.id===b.dataset.id){
      [a,b].forEach(x=>{ x.classList.add('done'); x.disabled=true; });
      if(wrongOn.has(id)){ wrongOn.delete(id); st.miss(); } else st.hit();
      toast('Correct: '+byId[id].w);
      later(()=>{
        L[+(a.dataset.side==='L'?a:b).dataset.slot]=null; R[+(a.dataset.side==='R'?a:b).dataset.slot]=null;
        const empty=L.filter(x=>!x).length;
        if(empty>=REFILL_AT) refill(); else paint();
      }, 450);
    } else {
      if(!wrongOn.has(id)){ wrongOn.add(id); deck.retry(byId[id]); }
      toast('Not a match. Try again.', true);
      [a,b].forEach(x=>{ x.classList.remove('shake'); void x.offsetWidth; x.classList.add('shake'); later(()=>x.classList.remove('shake'),400); });
    }
  });
  keyHandler=null;
}

// ---------- GAME: IN YOUR OWN WORDS (0500 Paper 1 style) ----------
function playOwn(){
  const sets = descSets();
  if(!sets.length) return home();
  const items = EXTRACTS.filter(e=>sets.includes(e.s));
  const deck = Deck(items), st = Stats('own');
  const names = SETS.filter(s=>sets.includes(s.n)).map(s=>s.short).join(', ');
  shell('In your own words', `${items.length} extracts from ${names}. Get every word right and the next extract appears by itself.`);
  st.draw();
  const step = () => {
    const o=deck.next();
    const words=[]; let k=0;
    const textHtml = esc(o.t).replace(/\[([^\]]+)\]/g,(m,w)=>{ words.push(w); return `<u data-k="${k++}">${w}</u>`; });
    const card = showCard(`<p class="instr">Using your own words, explain what the writer means by each of the underlined words</p>
      <p class="extract">${textHtml}</p>
      ${o.qs.map((q,j)=>{ const opts=shuffle([q[0],...q[1]]);
        return `<div class="sub" data-j="${j}"><h4><b>${esc(words[j])}</b> means…</h4>
        <div class="opts">${opts.map((x,n)=>`<button class="opt" data-v="${esc(x)}"><kbd>${n+1}</kbd><span>${esc(x)}</span></button>`).join('')}</div><div class="why"></div></div>`;}).join('')}`);
    const subs=[...card.querySelectorAll('.sub')];
    let active=0, allRight=true;
    const highlight=()=>card.querySelectorAll('.extract u').forEach(u=>u.classList.toggle('now', +u.dataset.k===active));
    highlight();
    subs.forEach((sub,j)=>{
      const q=o.qs[j], btns=[...sub.querySelectorAll('.opt')];
      sub.addEventListener('pointerenter',()=>{ if(!sub.dataset.done){ active=j; highlight(); } });
      sub.addEventListener('focusin',()=>{ if(!sub.dataset.done){ active=j; highlight(); } });
      sub._choose = b => {
        if(sub.dataset.done) return; sub.dataset.done='1';
        const ok=b.dataset.v===q[0], w=byId[o.ids[j]];
        btns.forEach(x=>{ x.disabled=true; if(x.dataset.v===q[0]) x.classList.add('ok'); else if(x===b) x.classList.add('no'); else x.classList.add('dim'); });
        if(ok) st.hit(); else { st.miss(); allRight=false; }
        sub.querySelector('.why').innerHTML = ok ? `Correct. <b>${esc(w.w)}</b>: ${esc(w.def)}`
          : `In this extract it means “${esc(q[0])}”. <b>${esc(w.w)}</b>: ${esc(w.def)}`;
        const nextOpen = subs.findIndex(s=>!s.dataset.done);
        if(nextOpen>=0){ active=nextOpen; highlight(); return; }
        active=-1; highlight();
        if(allRight) autoNext(card, step);
        else { deck.retry(o); manualNext(card, step, 'Next extract →'); }
      };
      btns.forEach(b=>b.onclick=()=>sub._choose(b));
    });
    keyHandler = e=>{ const n=parseInt(e.key,10); if(active>=0 && n>=1 && n<=4){ const b=subs[active].querySelectorAll('.opt')[n-1]; if(b) subs[active]._choose(b); } };
  };
  step();
}

// ---------- GAME: SPOT THE ERROR ----------
// Paragraphs use [wrong|right|why]. Students tap the wrong words, then check.
function parseErrors(text){
  const out=[], re=/\[([^\]|]+)\|([^\]|]+)\|([^\]]+)\]|([^\s\[]+)/g; let m;
  while((m=re.exec(text))){
    if(m[1]) { out.push({text:m[1], err:{right:m[2], why:m[3]}}); continue; }
    const w=m[4], lead=w.match(/^[^\w'’]+/), trail=w.match(/[^\w'’]+$/);
    const core=w.replace(/^[^\w'’]+/,'').replace(/[^\w'’]+$/,'');
    if(!core){ out.push({text:w, punct:true}); continue; }
    if(lead) out.push({text:lead[0], punct:true, glue:'after'});
    out.push({text:core});
    if(trail) out.push({text:trail[0], punct:true});
  }
  return out;
}
function playErr(){
  const items = ERRORS.filter(e=>chosen.includes(e.s));
  const deck = Deck(items), st = Stats('err');
  let showCount = store.get('errCount', true);
  shell('Spot the error', `${items.length} paragraphs in your selected sets. Tap each wrong word, then press Check.`);
  st.draw();
  const bar=document.querySelector('.bar');
  const lab=document.createElement('label'); lab.className='toggle';
  lab.innerHTML=`<input type="checkbox" id="errCount" ${showCount?'checked':''}> Tell me how many`;
  bar.appendChild(lab);
  let current=null;
  lab.querySelector('input').onchange=e=>{ showCount=e.target.checked; store.set('errCount',showCount); if(current) current.updateCount(); };
  const step = () => {
    const it=deck.next(), toks=parseErrors(it.text), marked=new Set();
    const nErr=toks.filter(t=>t.err).length;
    const html = toks.map((t,i)=>{
      const prev=toks[i-1];
      const sp = i===0 || t.punct&&!t.glue || (prev&&prev.glue) ? '' : ' ';
      return sp + (t.punct ? `<span class="punct">${esc(t.text)}</span>` : `<button class="tok" data-i="${i}">${esc(t.text)}</button>`);
    }).join('');
    const card = showCard(`<p class="instr">${esc(it.title)} · <span id="errHint"></span></p>
      <div class="errtext">${html}</div>
      <div class="next-row check-row"><button class="btn" id="check">Check</button></div>
      <div class="fb"></div>`);
    const hint=card.querySelector('#errHint'), checkBtn=card.querySelector('#check');
    let checked=false;
    const updateCount=()=>{ if(checked) return;
      hint.textContent = showCount ? `There ${nErr===1?'is 1 error':'are '+nErr+' errors'}. Tap each one.` : 'Tap every word that is wrong.';
      checkBtn.textContent = `Check (${marked.size} marked)`; };
    current={updateCount}; updateCount();
    card.querySelectorAll('.tok').forEach(b=>b.onclick=()=>{
      if(checked) return; const i=+b.dataset.i;
      if(marked.has(i)){ marked.delete(i); b.classList.remove('t-marked'); } else { marked.add(i); b.classList.add('t-marked'); }
      updateCount();
    });
    const check=()=>{
      if(checked) return; checked=true;
      const errIdx=toks.map((t,i)=>t.err?i:-1).filter(i=>i>=0);
      const found=errIdx.filter(i=>marked.has(i)).length;
      const falseMarks=[...marked].filter(i=>!toks[i].err).length;
      const ok = found===errIdx.length && falseMarks===0;
      card.querySelectorAll('.tok').forEach(b=>{
        const i=+b.dataset.i, t=toks[i]; b.disabled=true;
        b.classList.remove('t-marked');
        if(t.err){ b.classList.add(marked.has(i)?'t-found':'t-missed'); b.innerHTML=`<s>${esc(t.text)}</s> <ins>${esc(t.err.right)}</ins>`; }
        else if(marked.has(i)) b.classList.add('t-false');
      });
      card.querySelector('.check-row').remove();
      const list=errIdx.map(i=>{ const t=toks[i]; return `<li class="${marked.has(i)?'got':'miss'}"><span><s>${esc(t.text)}</s> → <b>${esc(t.err.right)}</b></span><span class="why">${esc(t.err.why)}</span></li>`; }).join('');
      const summary=`You found ${found} of ${errIdx.length}${falseMarks?` and marked ${falseMarks} correct word${falseMarks>1?'s':''} as wrong`:''}.`;
      card.querySelector('.fb').innerHTML=`<div class="feedback ${ok?'ok':'no'}"><span class="verdict">${ok?'All found.':summary}</span><ul class="errlist">${list}</ul></div>`;
      if(ok){ st.hit(); autoNext(card, step); }
      else { st.miss(); deck.retry(it); manualNext(card, step); }
    };
    checkBtn.onclick=check;
    keyHandler = e=>{ if(e.key==='Enter'){ e.preventDefault(); check(); } };
  };
  step();
}

// ---------- WORD LIST ----------
function wordList(){
  keyHandler=null; clearTimers();
  let showZh = store.get('zh',true), q='';
  $app.innerHTML = topbar() + `<div class="bar"><span class="title">Word list</span><span class="spacer"></span>
    <label class="toggle"><input type="checkbox" id="zhT" ${showZh?'checked':''}> Show Chinese</label></div>
    <input class="search" id="q" type="search" placeholder="Search words, meanings or synonyms" aria-label="Search the word list">
    <div id="list"></div>`;
  wireTop();
  const draw=()=>{
    const t=q.trim().toLowerCase();
    let html='';
    for(const s of SETS){
      const ws=WORDS.filter(w=>w.set===s.n && (!t || w.w.includes(t) || w.def.toLowerCase().includes(t) || w.syn.some(x=>x.includes(t)) || w.zh.includes(t)));
      if(!ws.length) continue;
      html += `<p class="instr" style="margin:22px 0 8px">${s.name} · ${s.lvl}</p><div class="wl">${ws.map(w=>`<div class="wl-row"><span class="n">${w.id}</span>
        <div class="w">${esc(w.w)}<small>${w.pos}</small>${showZh?`<span class="zh" lang="zh-CN">${esc(w.zh)}</span>`:''}</div>
        <div class="d">${esc(w.def)}<br><i>${esc(w.ex)}</i><div class="syns">≈ ${esc(w.syn.join(' · '))}</div></div></div>`).join('')}</div>`;
    }
    document.getElementById('list').innerHTML = html || '<p>No words match that search.</p>';
  };
  document.getElementById('q').oninput=e=>{q=e.target.value; draw();};
  document.getElementById('zhT').onchange=e=>{showZh=e.target.checked; store.set('zh',showZh); draw();};
  draw();
}

home();
})();
