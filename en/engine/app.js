// English games engine: one set of games for every subject.
// A topic page says where its content is (data-content: a folder of CSV files, see content/README.md); this file loads it.
// Routes (the part after # in the address): menu, #vocab, #grammar, #reading, #play-<game>, #words
(function(){
'use strict';
// The site's top folder, worked out from where this file lives (en/engine/app.js), so links work on any host and from a local copy
const ROOT = ((document.currentScript && document.currentScript.src) || '/en/engine/app.js').replace(/en\/engine\/app\.js([?#].*)?$/, '');
const $app = document.getElementById('app');
const CFG = $app.dataset;   // data-name, data-blurb, data-back, data-back-label, data-only, data-content, data-reading, data-format, data-store, data-odd
const KEY = CFG.store || (CFG.content||'').replace(/\/+$/,'').split('/').pop() || 'topic';   // where this page's progress is saved
const SIDE = (CFG.only==='zh' || /^zh/.test(KEY)) ? 'zh' : 'en';
// The logo's mouse, top left of every page: a link to the homepage
const HOME_MARK = '<svg viewBox="0 0 290 240" aria-hidden="true" focusable="false"><path fill="currentColor" fill-rule="evenodd" d="M143.1 233.8C141.4 233.7 138.2 232.7 136.3 231.8C130.2 228.9 126.4 223.1 126.1 216.1C126.0 213.8 126.0 213.0 126.5 211.3C127.8 205.8 131.2 201.7 136.3 199.1C138.9 197.8 140.7 197.4 144.5 197.4C148.4 197.4 150.2 197.7 153.4 199.3C160.6 202.7 164.8 211.0 163.1 218.6C162.3 222.0 159.5 227.3 157.4 229.2C155.5 230.9 152.6 232.6 150.0 233.4C148.6 233.8 144.9 234.0 143.1 233.8ZM167.9 212.3C167.5 212.2 167.4 211.9 167.1 210.2C167.0 209.5 166.7 208.4 166.4 207.9L165.9 206.8L166.8 205.1C167.3 204.1 167.8 203.1 167.9 202.8C168.3 201.4 171.6 195.0 173.2 192.6C173.6 191.8 174.0 191.2 174.0 191.1C174.0 190.7 177.1 185.8 178.5 183.9C183.0 177.7 184.9 175.4 187.4 172.7C189.1 171.0 191.0 168.8 191.9 167.9C194.1 165.3 196.2 163.2 200.1 159.9C209.5 151.8 217.1 143.0 219.4 137.2C221.3 132.2 221.8 130.1 221.9 124.4C222.0 120.2 222.0 119.3 221.5 116.6C220.8 112.7 220.0 110.4 218.4 107.4C215.5 101.8 212.3 97.8 207.9 93.8C202.3 88.9 199.4 86.9 192.9 83.7C184.1 79.3 177.5 77.2 164.0 74.6C155.8 73.0 154.1 72.9 144.6 72.9C137.6 72.9 135.7 73.0 132.0 73.5C124.9 74.4 117.5 76.0 109.0 78.6C98.4 81.7 88.7 86.9 81.4 93.4C79.5 95.0 74.4 101.2 73.0 103.6C72.5 104.4 71.9 105.5 71.5 106.0C70.6 107.3 69.2 110.4 68.6 112.1C66.8 117.4 66.4 125.9 67.7 131.5C69.0 136.8 70.5 140.0 73.9 144.6C78.8 151.1 81.9 154.3 87.6 158.9C89.9 160.7 92.5 163.1 94.6 165.3C96.4 167.3 99.5 170.6 101.5 172.7C105.7 176.9 107.3 179.0 110.5 184.1C111.8 186.0 113.8 189.1 115.0 190.9C116.2 192.8 117.8 195.5 118.5 196.9C122.2 204.5 122.7 205.8 122.7 206.7C122.7 207.8 121.2 211.8 120.7 212.1C120.2 212.4 111.3 211.1 107.1 210.1C102.5 209.1 91.7 205.2 86.3 202.6C80.4 199.8 69.0 191.3 63.7 185.8C58.3 180.2 52.7 172.4 50.5 167.2C50.1 166.2 49.5 164.9 49.3 164.4C48.0 161.7 46.0 155.6 45.5 153.4C44.3 147.4 43.9 143.2 44.1 137.1C44.2 132.8 44.3 130.7 44.7 128.5C45.6 123.7 46.7 119.4 47.7 116.6C48.4 114.3 48.4 114.2 45.9 113.5C43.4 112.7 38.6 110.7 35.9 109.4C30.9 107.0 25.2 102.5 20.6 97.5C16.4 92.8 15.7 92.1 14.1 89.4C12.2 86.1 11.2 84.1 9.7 79.9C7.0 72.7 6.2 68.2 6.2 60.6C6.1 53.7 6.8 49.6 9.0 43.5C11.8 35.7 14.2 31.5 19.0 25.9C24.9 19.1 30.1 15.1 37.7 11.5C42.3 9.4 46.0 8.2 53.1 6.6C57.2 5.7 67.2 5.6 70.4 6.4C71.1 6.6 72.1 6.8 72.8 6.9C73.9 7.0 76.6 7.8 79.2 8.6C82.1 9.6 88.8 12.6 90.5 13.7C90.8 14.0 91.8 14.6 92.6 15.1C96.2 17.4 102.4 23.1 105.1 26.6C109.5 32.3 111.2 35.5 113.9 43.4C115.2 47.3 115.7 49.2 115.9 51.9C116.2 55.1 116.3 55.2 119.2 54.0C120.5 53.6 122.7 53.0 128.4 51.6C129.2 51.4 131.4 51.0 133.4 50.7C136.5 50.2 137.7 50.1 144.6 50.1C151.5 50.1 152.8 50.2 155.9 50.7C161.4 51.6 167.7 53.1 171.3 54.3C174.1 55.2 174.1 55.2 174.4 52.3C175.0 44.8 178.2 35.8 182.2 30.0C186.0 24.6 192.2 18.2 196.5 15.5C202.7 11.4 210.5 8.2 217.5 6.7C222.9 5.6 233.1 5.5 237.6 6.7C246.6 8.9 254.0 11.9 259.4 15.6C264.8 19.3 267.9 22.3 272.0 27.6C275.7 32.5 276.6 33.8 278.1 37.0C281.9 44.9 283.5 52.1 283.5 60.8C283.5 67.2 282.8 72.0 281.4 76.4C278.8 84.1 277.1 87.4 272.6 93.4C270.4 96.3 264.9 101.9 262.4 103.7C257.7 107.1 256.5 107.9 254.6 109.0C252.1 110.4 249.3 111.6 244.9 113.0C243.2 113.6 241.6 114.2 241.3 114.4C240.6 114.9 240.6 114.7 241.9 120.0C244.1 128.4 244.8 132.6 244.8 139.3C244.8 145.9 244.2 149.8 242.2 156.4C241.8 157.8 241.3 159.5 241.1 160.2C240.2 163.5 236.9 170.5 234.8 173.4C231.1 178.9 229.2 181.3 225.8 184.9C219.5 191.7 216.1 194.3 206.1 200.5C202.4 202.8 192.2 207.3 188.0 208.6C183.3 210.0 175.4 211.6 171.3 212.0C169.9 212.1 168.6 212.3 168.5 212.3C168.5 212.4 168.2 212.4 167.9 212.3ZM107.6 152.2C104.2 151.2 102.4 150.1 100.7 147.7C97.5 143.6 96.6 138.9 98.1 134.9C99.8 130.3 103.0 127.3 107.4 126.1C109.3 125.6 113.2 125.6 115.1 126.1C119.9 127.4 123.3 130.7 124.5 135.4C125.4 138.8 125.0 142.5 123.5 145.7C122.7 147.2 119.8 150.2 118.1 151.1C115.3 152.7 110.7 153.2 107.6 152.2ZM175.6 152.2C172.6 151.8 168.8 149.2 167.0 146.2C165.9 144.3 165.0 141.1 165.0 139.0C165.0 134.7 168.3 129.1 171.8 127.5C175.2 125.8 174.9 125.9 178.6 125.9C181.7 125.9 182.3 125.9 183.6 126.5C186.4 127.6 187.8 128.6 189.7 130.9C192.4 134.2 193.2 141.0 191.2 145.4C190.2 147.7 187.1 150.5 184.5 151.5C182.1 152.4 178.7 152.7 175.6 152.2ZM234.9 95.0C240.8 93.7 246.5 91.0 250.7 87.4C253.5 85.0 254.6 83.8 256.6 81.2C259.8 76.8 262.2 70.9 262.8 65.9C263.3 61.2 262.8 54.9 261.5 50.6C260.1 46.1 255.7 39.2 251.8 35.4C248.2 32.0 243.6 29.5 237.8 27.6C231.9 25.8 224.3 25.7 218.1 27.5C216.0 28.1 211.5 30.3 208.9 32.0C206.1 33.8 202.3 37.8 200.1 41.0C197.0 45.6 196.4 47.2 195.1 54.0C194.5 57.2 194.7 63.0 195.6 65.3C197.3 70.0 199.7 73.0 208.4 81.3C212.1 84.8 216.7 89.2 218.7 91.0C220.7 92.9 222.7 94.6 223.1 94.9C225.2 95.8 230.7 95.9 234.9 95.0ZM62.6 95.1C66.5 94.5 68.2 93.6 72.2 89.5C73.7 88.1 77.5 84.5 80.7 81.5C87.9 74.9 91.6 70.8 93.3 67.5C93.5 66.9 94.1 65.5 94.4 64.4C95.0 62.5 95.1 62.0 95.1 57.8C95.1 53.7 95.1 52.8 94.5 50.9C93.4 46.3 91.5 42.5 88.6 39.0C83.2 32.3 76.1 28.1 68.1 26.8C64.1 26.2 60.8 26.1 57.3 26.6C48.7 27.8 43.2 30.5 37.4 36.4C33.9 39.9 32.6 41.8 30.5 46.1C27.8 51.8 27.1 54.9 27.1 61.6C27.1 67.9 27.5 69.9 29.9 75.5C31.5 79.2 33.3 81.9 35.8 84.7C39.0 88.4 42.7 91.0 47.1 92.8C53.0 95.2 57.4 95.9 62.6 95.1Z"/></svg>';   // English and Chinese points are kept apart
const AUTO_MS = 700;   // how long the green bar runs after a right answer before the next card

// ---------- helpers ----------
const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuffle = a => { a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const store = {
  get(k,d){ try{ const v=localStorage.getItem('aea:'+KEY+':'+k); return v==null?d:JSON.parse(v);}catch(e){return d;} },
  set(k,v){ try{ localStorage.setItem('aea:'+KEY+':'+k, JSON.stringify(v)); }catch(e){} }
};
// Explanations may use <b>bold</b> and <i>italic</i>; everything else is shown as plain text
const rich = s => esc(s||'').replace(/&lt;(\/?)(b|i)&gt;/g, '<$1$2>');

// One scale for the whole site: A1=1, A2=2, B1=3, B2=4, C1=5 ("+" adds half a level). The CSV files can use the codes or the names.
const LEVEL_CODES = ['', 'A1', 'A2', 'B1', 'B2', 'C1'];
const LEVEL_NAMES = {A1:'Foundation', A2:'Foundation+', B1:'Intermediate', B2:'Intermediate+', C1:'Advanced'};   // names students see (codes stay hidden)
const LEVEL_ZH = {A1:'基础', A2:'基础+', B1:'中级', B2:'中级+', C1:'高级'};   // beside the names on the Chinese side
const LEVEL_BY_NAME = {'foundation':1, 'foundation+':2, 'intermediate':3, 'intermediate+':4, 'advanced':5};
const levelNum = code => { if(code==null || code==='') return null; if(typeof code==='number') return code;
  const s=String(code).trim(), named=LEVEL_BY_NAME[s.toLowerCase().replace(/\s+/g,'')]; if(named) return named;
  const m=s.toUpperCase().match(/^([ABC])([12])(\+)?$/); if(!m) return null;
  return ({A:0,B:2,C:4})[m[1]] + (+m[2]) + (m[3]?0.5:0); };

// ---------- CONTENT: one folder of CSV files per topic (content/<topic>/), described in content/README.md ----------
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
// Reading passages. Question 1 uses the plain column names; question n uses questionN, correctN, wrong1_N, wrong2_N, wrong3_N, explanationN.
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
const listOf = v => String(v||'').split(';').map(s=>s.trim()).filter(Boolean);
// The CSV rows → the data the games use. A row that cannot be used is skipped, with a note in the browser console saying why.
function buildSubject(T){
  const S={key:KEY, words:[], alike:[], accept:[], gaps:[], builds:[], errors:[], tf:[], reads:[], questions:[], extracts:[], passages:[]};
  const warn=(file,r,msg)=>console.warn(`${file}.csv${r&&r.id?' ('+r.id+')':''}: ${msg}`);
  const lv=(file,r)=>{ const v=(r.level||'').trim();
    if(!v){ warn(file,r,'no level, so it is used at every level'); return ''; }
    if(levelNum(v)==null){ warn(file,r,`level "${v}" not recognised, so it is used at every level`); return ''; }
    return v; };
  const wrongs=(r,b)=>[1,2,3,4].map(k=>r['wrong'+k+(b||'')]).filter(Boolean);
  // Words. "similar": words never offered as wrong answers for this one; "accept": words Type it also accepts. Both list words (or ids), separated by ;
  const ids=new Set();
  (T.words||[]).forEach(r=>{ if(!r.id||!r.word||!r.meaning) return warn('words',r,'skipped: it needs an id, a word and a meaning');
    if(ids.has(r.id)) return warn('words',r,'skipped: this id is used twice'); ids.add(r.id);
    const syn=listOf(r.synonyms);
    S.words.push({id:r.id, level:lv('words',r), w:r.word, pos:r.pos||'', def:r.meaning, ex:r.example||'', syn:syn.length?syn:undefined,
      zh:r.zh||'', group:r.group||'', note:r.note||'', sim:listOf(r.similar), acc:listOf(r.accept)}); });
  const byId=Object.fromEntries(S.words.map(w=>[w.id,w])), byText={};
  S.words.forEach(w=>{ const k=w.w.toLowerCase(); (byText[k]=byText[k]||[]).push(w.id); });
  const refs=v=>byId[v] ? [v] : (byText[String(v).trim().toLowerCase()]||[]);
  const ref1=(file,r,v)=>{ if(!v) return null; const f=refs(v); if(!f.length) warn(file,r,`"${v}" is not in words.csv`); return f[0]||null; };
  S.words.forEach(w=>{
    w.sim.forEach(v=>{ const f=refs(v); if(!f.length) warn('words',w,`similar: "${v}" is not in words.csv`); f.forEach(id=>{ if(id!==w.id) S.alike.push([w.id,id]); }); });
    w.acc.forEach(v=>{ const f=refs(v); if(!f.length) warn('words',w,`accept: "${v}" is not in words.csv`); f.forEach(id=>{ if(id!==w.id) S.accept.push([w.id,id]); }); });
    delete w.sim; delete w.acc; });
  (T.gaps||[]).forEach(r=>{ const wrong=wrongs(r);
    if(!r.sentence||!r.sentence.includes('___')||!r.answer||!wrong.length) return warn('gaps',r,'skipped: it needs a sentence with ___, an answer and a wrong answer');
    S.gaps.push({id:r.id, level:lv('gaps',r), s:r.sentence, ans:r.answer, wrong, why:r.explanation||'', pt:r.focus||'', wid:ref1('gaps',r,r.word)}); });
  // Build the sentence: pieces are "colour: text", separated by |. Colours: topic, verb, detail, link, judge, hedge.
  const ROLE=/^(topic|verb|detail|link|judge|hedge)\s*:\s*/i;
  const pieces=(r,v)=>String(v||'').split('|').map(s=>s.trim()).filter(Boolean).map(p=>{ const m=p.match(ROLE);
    if(!m) warn('builds',r,`"${p}" needs a colour first (topic:, verb:, detail:, link:, judge: or hedge:)`); return m?[p.slice(m[0].length),m[1].toLowerCase()]:[p,'detail']; });
  (T.builds||[]).forEach(r=>{ const tiles=pieces(r,r.pieces);
    if(tiles.length<2) return warn('builds',r,'skipped: it needs at least two pieces');
    const alt=String(r.also_right||'').split('||').map(a=>a.split('|').map(s=>s.trim()).filter(Boolean)).filter(a=>a.length);
    alt.forEach(a=>{ if(a.length!==tiles.length || a.some(t=>!tiles.some(x=>x[0]===t))) warn('builds',r,'also_right should use exactly the same pieces'); });
    S.builds.push({id:r.id, level:lv('builds',r), goal:r.goal||'', tiles, decoys:pieces(r,r.decoys), alt, why:r.explanation||''}); });
  (T.errors||[]).forEach(r=>{ if(!/\[[^\]|]+\|[^\]|]+\|[^\]]+\]/.test(r.text||'')) return warn('errors',r,'skipped: the text needs at least one [wrong|right|why]');
    S.errors.push({id:r.id, level:lv('errors',r), title:r.title||'', text:r.text}); });
  (T.tf||[]).forEach(r=>{ const a=String(r.answer||'').trim().toLowerCase(), t=/^(true|t|yes|y)$/.test(a);
    if(!r.statement||(!t && !/^(false|f|no|n)$/.test(a))) return warn('tf',r,'skipped: it needs a statement and an answer of TRUE or FALSE');
    S.tf.push({id:r.id, level:lv('tf',r), s:r.statement, t, why:r.explanation||''}); });
  // Read it: [[word]] or [[shown text|word]] makes a word tappable (its meaning comes from words.csv)
  (T.reads||[]).forEach(r=>{ const wrong=wrongs(r);
    if(!r.text||!r.question||!r.correct||!wrong.length) return warn('reads',r,'skipped: it needs a text, a question, a correct answer and a wrong answer');
    const text=r.text.replace(/\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g,(m,shown,w)=>{ const id=ref1('reads',r,(w||shown).trim()); return id?`[[${shown}|${id}]]`:shown; });
    S.reads.push({id:r.id, level:lv('reads',r), title:r.title||'', text, q:r.question, opts:[r.correct,...wrong], a:0, why:r.explanation||''}); });
  (T.questions||[]).forEach(r=>{ const wrong=wrongs(r);
    if(!r.question||!r.correct||!wrong.length) return warn('questions',r,'skipped: it needs a question, a correct answer and a wrong answer');
    S.questions.push({id:r.id, level:lv('questions',r), cmd:r.command||'', q:r.question, opts:[r.correct,...wrong], a:0, why:r.explanation||''}); });
  // In your own words: each [underlined] word has word, correct, wrong1-3 (the first) or wordN, correctN, wrong1_N… (the Nth)
  (T.extracts||[]).forEach(r=>{ const n=(String(r.extract||'').match(/\[[^\]]+\]/g)||[]).length, qs=[], wids=[];
    for(let k=1;k<=9;k++){ const a=k===1?'':String(k), b=k===1?'':'_'+k; if(!r['correct'+a]) break; qs.push([r['correct'+a], wrongs(r,b)]); wids.push(ref1('extracts',r,r['word'+a])); }
    if(!n || n!==qs.length || qs.some(q=>!q[1].length)) return warn('extracts',r,`skipped: ${n} word${n===1?'':'s'} in [brackets] but ${qs.length} set${qs.length===1?'':'s'} of answers`);
    S.extracts.push({id:r.id, level:lv('extracts',r), t:r.extract, ids:wids, qs}); });
  if(T.reading){
    if(CFG.format==='notes') S.passages=T.reading.map(notesRow).filter(Boolean);
    else { const need=['id','title','passage','question','correct','wrong1','wrong2','wrong3'];
      S.passages=T.reading.filter(r=>{ const miss=need.filter(k=>!r[k]); if(miss.length){ warn('reading',r,'skipped: missing '+miss.join(', ')); return false; } return true; })
        .map(r=>({id:r.id, level:r.level, title:r.title, text:r.passage, qs:questionsOf(r)})); }
  }
  return S;
}
// Load the page's files, then start. The Chinese version only needs the words.
const FILES = ['words','gaps','builds','errors','tf','reads','questions','extracts','reading'];
let readingState = 'none';
function boot(){
  const dir=CFG.content ? CFG.content.replace(/\/*$/,'/') : '';
  const jobs=(dir ? (SIDE==='zh' ? ['words'] : FILES) : []).map(f=>[f, dir+f+'.csv']);
  if(CFG.reading) jobs.push(['reading', CFG.reading]);
  if(jobs.some(j=>j[0]==='reading')) readingState='loading';
  if(jobs.length) $app.innerHTML='<p class="notice loading">Loading…</p>';
  Promise.all(jobs.map(([f,url])=>fetch(url, {cache:'no-cache'}).then(r=>{ if(!r.ok) throw new Error(r.status+' '+url); return r.text(); })
    .then(t=>[f,parseCSV(t)], e=>{ console.warn('Not loaded: '+url, e); return [f,null]; })))
  .then(res=>{
    const T={}; res.forEach(([f,rows])=>{ T[f]=rows; });
    if('reading' in T) readingState = T.reading ? 'ok' : 'failed';
    if(dir && !T.words){ $app.innerHTML=`<p class="notice">The games could not be loaded. They load when the site is online. <a href="${esc(CFG.back||'../index.html')}">Back</a></p>`; return; }
    const S=buildSubject(T); window.AEA_SUBJECT=S;
    main(S);
  });
}

function main(S){
const byId = Object.fromEntries(S.words.map(w=>[w.id,w]));
const alikeOf = {}; (S.alike||[]).forEach((g,i)=>g.forEach(id=>{ (alikeOf[id]=alikeOf[id]||new Set()).add(i); }));
const areAlike = (a,b) => { const A=alikeOf[a], B=alikeOf[b]; if(!A||!B) return false; for(const x of A) if(B.has(x)) return true; return false; };

// ---------- LEVELS AND PROGRESS (saved in this browser) ----------
// One scale for the whole site: A1=1, A2=2, B1=3, B2=4, C1=5 ("+" adds half a level).
// Every answer moves the student's level for this topic towards the level of the work they get right
// (a rating that starts at B1 on the English side and A2 on the Chinese side, or at their overall level
// once they have one). Every word they meet moves through stages: new → learning → familiar → known,
// and can only move up again after a wait (10 minutes, 1 day, 3 days), so "known" means remembered over days.
// Games then deal work at the chosen level (the student's own, unless they choose another), words due for review first.
// POINTS for one right answer, by kind of task and level: [Foundation, Foundation+, Intermediate, Intermediate+, Advanced].
// Change the numbers here; the "How to earn points" table on My progress is built from this.
// A reading passage's points are shared between its questions (two questions at Intermediate: 8 + 8).
const POINTS = {
  word:    [1, 1, 2, 2, 3],      // recognising a word
  type:    [2, 2, 3, 3, 4],      // spelling a word
  grammar: [1, 2, 2, 3, 4],      // one quick grammar choice
  build:   [2, 3, 4, 5, 6],      // building a sentence, finding errors, a word in context
  short:   [3, 4, 5, 6, 8],      // a short text and its question
  passage: [8, 10, 15, 18, 22]   // a whole reading passage
};
const POINT_KIND = {learn:'word', match:'word', syn:'word', meaning:'word', zh:'word', zhmatch:'word', zhmean:'word', zhtf:'word', zhodd:'word', zhspeed:'word', zhsurvive:'word',
  zhtype:'type', gap:'grammar', tf:'grammar', build:'build', error:'build', own:'build', read:'short', question:'short', passage:'passage', notes:'passage'};
const POINT_KINDS = [['word','Word games: Learn the words, Match the meaning, Synonym groups, Word or meaning, 中文 → English, Choose the meaning, True or false (中文版), Odd one out, Speed round, Survival'],
  ['type','Type it'], ['grammar','Fill the gap, True or false'], ['build','Build the sentence, Spot the error, In your own words'],
  ['short','Read it, Answer the question'], ['passage','A reading passage: Close reading, Big idea, Note taking, Read and answer']];
// The name students see for a level code. B1+ (the upper half of B1) has B1's name.
const levelName = code => { const n=levelNum(code); return n==null ? String(code||'') : LEVEL_NAMES[LEVEL_CODES[Math.max(1,Math.min(5,Math.floor(n)))]]; };
// For the big serif headings: the serif font's + is tiny, so it is set in the body font
const nameHtml = n => esc(n).replace(/\+$/, '<span class="plus">+</span>');
const wordOf = it => !it ? null : (byId[it.id]===it ? it : (it.wid && byId[it.wid]) || null);
// An item's level: its own, or (with none) the level of the word it practises
const itemLevel = it => { if(!it) return null; const own=levelNum(it.level); if(own!=null) return own;
  const w=wordOf(it); if(w && w!==it){ const wl=levelNum(w.level); if(wl!=null) return wl; }
  return null; };
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
  // opts.noRate (Learn the words): the answer moves the word on and earns points, but does not count towards the student's level
  const record = (game, item, ok, opts) => {
    try{
      data=load();
      const rate=!(opts && opts.noRate), t=ensure(), before=t.n, now=Date.now(), d=itemLevel(item);
      if(rate){ t.n++; if(ok) t.right++; } t.last=now; t.href=location.pathname; if(CFG.name) t.name=CFG.name;
      const dk=dayKey(new Date()); data.days[dk]=(data.days[dk]||0)+1;
      let msg='';
      if(d!=null && rate){
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
      // Points: only right answers earn them (level of the item, or the side's starting level if it has none)
      let pts=0;
      if(ok){ const band=d==null ? (zhSide?2:3) : Math.max(1, Math.min(5, Math.floor(d))), row=POINTS[POINT_KIND[game]||'word'];
        pts=row[band-1]; if(item && item.qs>1) pts=Math.ceil(pts/item.qs); t.pts=(t.pts||0)+pts; }
      save(); if(msg) toastLevel(msg);
      if(window.AEA_POINTS) earned(AEA_POINTS.record(SIDE, pts, ok));
    }catch(e){ console.warn('Progress not saved:', e); }
  };
  // The student's rating for this topic (or their overall level, or the side's starting level), and whether it is known yet
  const rating = () => { const t=topic(); return t ? t.r : (overall() ?? (zhSide?2:3)); };
  const known = () => { const t=topic(); return (t && t.n>=CAL) || overall()!=null; };
  return {record, topic, label, known, overall, rating, CAL, refresh:()=>(data=load()), wordRec:id=>data.words[id], dayKey};
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
// Show the points just earned (or the point taken off) in the answer's feedback, when there is one
function earned(change){
  if(!change) return; const v=document.querySelector('#feed .card .feedback .verdict'); if(!v) return;
  if(change>0){ let b=v.querySelector('.pts-earn.up'); const n=(b?+b.dataset.n:0)+change;
    if(!b){ b=document.createElement('span'); b.className='pts-earn up'; v.appendChild(b); }
    b.dataset.n=n; b.textContent=`+${n} point${n===1?'':'s'}`; }
  else { const b=document.createElement('span'); b.className='pts-earn down'; b.textContent=`−1 point: ${window.AEA_POINTS?AEA_POINTS.DOCK_EVERY:5} wrong answers`; v.appendChild(b); }
}
function toastLevel(msg){ const t=document.createElement('div'); t.className='lvl-toast'; t.setAttribute('role','status'); t.textContent=msg;
  document.body.appendChild(t); setTimeout(()=>t.remove(), 3800); }

// ---------- LEVEL CHOICE (one row of level buttons on a topic page) ----------
// Every row in the CSV files has a level. A level gets its own button once it has MIN_LEVEL items on this page
// (words, sentences, passages…); a level with fewer is played with the nearest level, so nothing is left out.
// The games use the student's own level for this topic. A student can choose another level to push themselves;
// that choice is saved for this topic until they press "Use my level" (or their level reaches it).
const MIN_LEVEL = 6;
const ON_PAGE = SIDE==='zh' ? S.words.filter(w=>w.zh) : ['words','gaps','builds','errors','tf','reads','questions','extracts','passages'].flatMap(k=>S[k]||[]);
const bandOf = x => { const n=itemLevel(x); return n==null ? null : Math.max(1, Math.min(5, Math.floor(n))); };
const BAND_N = {}; ON_PAGE.forEach(x=>{ const b=bandOf(x); if(b!=null) BAND_N[b]=(BAND_N[b]||0)+1; });
let LEVELS = Object.keys(BAND_N).map(Number).filter(b=>BAND_N[b]>=MIN_LEVEL).sort((a,b)=>a-b);
if(!LEVELS.length && Object.keys(BAND_N).length) LEVELS=[+Object.keys(BAND_N).sort((a,b)=>BAND_N[b]-BAND_N[a])[0]];
const nearestLevel = b => LEVELS.length ? LEVELS.reduce((best,x)=>Math.abs(x-b)<Math.abs(best-b)?x:best) : null;   // a tie goes to the lower level
const playBand = x => { const b=bandOf(x); return b==null ? null : nearestLevel(b); };
const myBand = () => nearestLevel(Math.max(1, Math.min(5, Math.floor(P.rating()))));
let pickedBand = (()=>{ const n=levelNum(store.get('level', null)); return n==null ? null : Math.floor(n); })();
const chosenBand = () => pickedBand!=null && LEVELS.includes(pickedBand) ? pickedBand : myBand();
const chooseBand = b => { pickedBand = b; store.set('level', b==null ? null : LEVEL_CODES[b]); };
// A choice that has become the student's own level is dropped, so from then on the page follows their level again
const tidyChoice = () => { if(pickedBand!=null && P.known() && pickedBand===myBand()) chooseBand(null); };
const pick = list => { const b=chosenBand(); return (list||[]).filter(x=>{ const p=playBand(x); return p==null || b==null || p===b; }); };
const bandName = (b, zh) => { const c=LEVEL_CODES[b]; return c ? LEVEL_NAMES[c]+(zh?' '+LEVEL_ZH[c]:'') : ''; };

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
  {key:'passage',  cat:'reading', name:'Read and answer',   blurb:'Read a passage, then choose the best answer to each question.', items:()=>pick(S.passages), min:1, run:()=>playPassage()},
  {key:'own',      cat:'reading', name:'In your own words', blurb:'Paper 1 style: what does the writer mean by each underlined word, in context?', items:()=>pick(S.extracts), min:1, run:()=>playOwn()},
  {key:'read',     cat:'reading', name:'Read it',           blurb:'Read a short text about a media product and answer a question.', items:()=>pick(S.reads), min:1, run:()=>playRead()},
  {key:'question', cat:'reading', name:'Answer the question', blurb:'Read an exam question and choose the answer that does what it asks.', items:()=>pick(S.questions), min:1, run:()=>playQuestion()}
];
// Only games this subject has content for
const gamesIn = cat => GAMES.filter(g => g.cat===cat && (S[{match:'words',syn:'words',meaning:'words',gap:'gaps',build:'builds',error:'errors',tf:'tf',own:'extracts',read:'reads',question:'questions',passage:'passages'}[g.key]]||[]).length && (g.key!=='syn' || S.words.some(w=>w.syn)));

// ---------- page frame ----------
function frame(back, inner){
  clearTimers(); keyHandler=null; document.body.classList.remove('reading-wide');
  const bar = CFG.only==='progress' || !window.AEA_POINTS ? '' : `<div class="pts" data-points-bar="${SIDE}"></div>`;
  $app.innerHTML = `<div class="topline"><span class="navline"><a class="home-mark" href="${ROOT}index.html" aria-label="Academic English App: home" title="Home">${HOME_MARK}</a>${back?`<a class="back" href="${esc(back.href)}">← ${esc(back.label)}</a>`:''}</span>${bar}</div>${inner}`;
  if(bar) AEA_POINTS.render(SIDE, 0);
  window.scrollTo(0,0);
}
function go(hash){ if(location.hash===hash || (!hash && !location.hash)) route(); else location.hash=hash; }

// ---------- SUBJECT MENU ----------
function menu(){
  tidyChoice(); const n = pick(S.words).length;
  frame({href:CFG.back||'../index.html', label:CFG.backLabel||'Subjects'}, `
  <section class="hero">
    <p class="eyebrow">English games</p>
    <h1>${esc(CFG.name||'')}</h1>
    <p>${esc(CFG.blurb||'')}</p>
    ${levelsHtml()}
    <p class="setnote">${levelNote(n)}</p>
    ${levelCard()}
  </section>
  <div class="cats">
    ${Object.entries(CATS).map(([k,c])=>{
      const off = c.desktop && PHONE, games = gamesIn(k), here = games.filter(g=>g.items().length>=g.min);
      const none = !here.length;
      return `<a class="cat cat-${k}${off||none?' off':''}" ${off||none?'aria-disabled="true"':`href="#${k}"`}>
        <span class="cat-name">${c.name}</span>
        <span class="cat-blurb">${c.blurb}</span>
        <span class="cat-meta">${off?'Only available on desktop devices':!games.length?'Coming soon':none?'None at this level yet':here.map(g=>esc(g.name)).join(' · ')}</span>
      </a>`;}).join('')}
  </div>
  <div class="wl-link"><p>The word list has every word, its meaning and an example sentence.</p><a class="btn alt" href="#words">Open word list</a></div>`);
  wireLevels(menu);
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
  <section class="hero"><p class="eyebrow">${esc(CFG.name||'')}${chosenBand()!=null?' · '+esc(bandName(chosenBand())):''}</p><h1>${c.name}</h1><p>${c.blurb}</p>${note}</section>
  <div class="games">${gamesIn(cat).map(g=>{
    const n=g.items().length, off=n<g.min, best=store.get('streak:'+g.key,0);
    return `<a class="game${off?' off':''}" ${off?'aria-disabled="true"':`href="#play-${g.key}"`}>
      <h3>${g.name}</h3><p>${g.blurb}</p>
      <span class="best">${off?(n?'Not enough at this level yet':'None at this level yet'):best?'Best streak: '+best:'Not played yet'}</span></a>`;}).join('')}
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
  shell(game, `${items.length} sentences at this level. Correct answers move on by themselves.`); st.draw();
  const step=()=>{
    const g=deck.next(), parts=g.s.split('___');
    mcCard({instr:g.pt?`Choose the word that fits · ${esc(g.pt)}`:'Choose the word that fits the gap',
      promptHtml:`<p class="sentence">${esc(parts[0])}<span class="slot">&nbsp;</span>${esc(parts[1]||'')}</p>`,
      options:[g.ans,...g.wrong], answer:g.ans,
      onResult:(ok,card,fb)=>{
        const s=card.querySelector('.slot'); s.textContent=g.ans; s.classList.add(ok?'ok':'no');
        if(ok) fbOk(fb,`<span>${rich(g.why)}</span>`); else fbNo(fb,g.ans,`<span>${rich(g.why)}</span>${wordNote(byId[g.wid])}`);
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
      if(ok) fbOk(fb, b.why?`<span>${rich(b.why)}</span>`:''); else fbNo(fb,'',`<div class="model">${model}</div>${b.why?`<span>${rich(b.why)}</span>`:''}`);
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
  shell(game, `${items.length} paragraphs at this level. Tap each wrong word, then press Check.`); st.draw();
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
      const fb=card.querySelector('.fb'); ok?fbOk(fb,`<span>${rich(t.why)}</span>`):fbNo(fb,t.t?'True':'False',`<span>${rich(t.why)}</span>`);
      settle(ok,card,st,deck,t,step); };
    card.querySelectorAll('.tfb').forEach(b=>b.onclick=()=>choose(+b.dataset.v));
    keyHandler=e=>{ const k=e.key.toLowerCase(); if(k==='t'||e.key==='ArrowRight'||k==='1') choose(1); if(k==='f'||e.key==='ArrowLeft'||k==='2') choose(0); };
  };
  step();
}

// ---------- READING: In your own words ----------
function playOwn(){
  const game=GAMES.find(g=>g.key==='own'), items=game.items(), deck=Deck(items), st=Stats('own');
  shell(game, `${items.length} extracts at this level. Get every word right and the next extract appears by itself.`); st.draw();
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
      onResult:(ok,card,fb)=>{ const why=r.why?`<span>${rich(r.why)}</span>`:''; ok?fbOk(fb,why):fbNo(fb,r.opts[r.a],why); settle(ok,card,st,deck,r,step); }});
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
    const qHtml=q.cmd ? esc(q.q).replace(new RegExp('^('+esc(q.cmd).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','i'),'<mark>$1</mark>') : esc(q.q);
    mcCard({instr:'Exam question', promptHtml:`<div class="exam-q">${qHtml}</div>`, options:q.opts, answer:q.opts[q.a], optClass:'long',
      onResult:(ok,card,fb)=>{ ok?fbOk(fb,`<span>${rich(q.why)}</span>`):fbNo(fb,'',`<span>${rich(q.why)}</span>`); settle(ok,card,st,deck,q,step); }});
  };
  step();
}

// ---------- READING: Read and answer (passages come from a CSV file: reading.csv in the topic's folder, see content/README.md) ----------
// Columns: id, level, title, passage, question, correct, wrong1, wrong2, wrong3, explanation, source
// More questions on the same passage (optional): question2, correct2, wrong1_2, wrong2_2, wrong3_2, explanation2, and so on.
function playPassage(){
  const game=GAMES.find(g=>g.key==='passage'), st=Stats('passage');
  shell(game, ''); const items=readingTop(); if(!items) return; const deck=Deck(items), nq=items.reduce((n,r)=>n+r.qs.length,0);
  document.querySelector('.feed').insertAdjacentHTML('beforebegin', `<p class="hint">${items.length} passage${items.length===1?'':'s'}${nq>items.length?`, ${nq} questions`:''}. Read carefully, then choose the best answer.</p>`); st.draw();
  const step=()=>{
    const r=deck.next(), many=r.qs.length>1; let missed=false, got=0;
    const paras=r.text.split(/\n\s*\n|\s*\|\|\s*/).map(p=>`<p>${esc(p.trim()).replace(/\n/g,'<br>')}</p>`).join('');
    // One card per question; the passage stays on every card. A miss brings the whole passage back later (once).
    const ask=i=>{ const q=r.qs[i], next=i+1<r.qs.length ? ()=>ask(i+1) : step, item={id:r.id+(i?'#'+(i+1):''), level:r.level, qs:r.qs.length};
      mcCard({instr:`${esc(r.title)}${r.level?` · ${esc(levelName(r.level))}`:''}${many?` · Question ${i+1} of ${r.qs.length}`:''}`,
        promptHtml:`<div class="passage">${paras}</div><p class="question">${esc(q.q)}</p>`, options:q.opts, answer:q.opts[0], optClass:'long', cardClass:'reading',
        onResult:(ok,card,fb)=>{ ok?fbOk(fb, q.why?`<span>${rich(q.why)}</span>`:''):fbNo(fb,'', `<span>The answer is: <b>${esc(q.opts[0])}</b></span>${q.why?`<span>${rich(q.why)}</span>`:''}`);
          if(ok){ got++; st.hit(item); } else { st.miss(item); if(!missed){ missed=true; deck.retry(r); } }
          const last=i+1>=r.qs.length;
          if(last) passageDone(fb, got, r.qs.length);
          if(ok && !last) autoNext(card,next); else manualNext(card,next, last?'Next passage →':'Next question →'); }});
    };
    ask(0);
  };
  step();
}

// The reading level is chosen on the Reading Comprehension menu page (saved as aea:reading-levels): ONE level, or All levels.
// The games only read it. Nothing saved yet: the student's own level once it is known, otherwise All levels.
// If there are no passages at that level, the game says so (it never swaps in other levels).
const READ_LV='aea:reading-levels', ALL_LEVELS='All levels';
function readingChoice(){
  let saved=null; try{ saved=JSON.parse(localStorage.getItem(READ_LV)); }catch(e){}
  const names=Object.values(LEVEL_NAMES), r=P.overall(), mine=r==null ? null : levelName(Math.max(1,Math.min(5,Math.floor(r))));
  const pick=Array.isArray(saved) && saved.length===1 ? saved[0] : null;
  return pick===ALL_LEVELS || names.includes(pick) ? pick : (mine || ALL_LEVELS);
}
// Returns the passages to use, or null after showing a "none at this level" message
function readingTop(){
  document.body.classList.add('reading-wide');
  const all=S.passages||[];
  if(CFG.only!=='passage') return pick(all);   // a topic page: the level chosen on its menu
  const choice=readingChoice(), change=`<a href="${esc(CFG.back||'../index.html')}">Change level</a>`;
  const items = choice===ALL_LEVELS ? all : all.filter(x=>x.level && levelName(x.level)===choice);
  document.getElementById('feed').insertAdjacentHTML('beforebegin', `<p class="hint read-lv">${choice===ALL_LEVELS?'All levels':`Level: ${esc(choice)}`}. ${change}</p>`);
  if(!items.length){ document.getElementById('feed').innerHTML=`<p class="notice">There are no ${esc(choice)} passages in ${esc(CFG.name||'this activity')} yet. ${change} to choose another.</p>`; return null; }
  return items;
}

// End of a passage: always a clear finish and a Next button, so a good result is noticed
function passageDone(fb, got, of, msg){
  const all=got===of;
  fb.insertAdjacentHTML('beforeend', `<div class="done-msg${all?' all':''}">${all ? `<b>Well done!</b> ${msg || (of===2?'You got both questions right.':of>2?`You got all ${of} questions right.`:'You got it right.')}` : of>1 ? `You got ${got} of ${of} right. This passage will come back later.` : 'This passage will come back later.'}</div>`);
}
function playNotes(){
  const st=Stats('notes'), game={key:'notes', name:CFG.name||'Note taking', cat:'reading'};
  shell(game, ''); const items=readingTop(); if(!items) return; const deck=Deck(items);
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
      const why=r.why ? `<div class="why">${r.why.split(/\n\s*\n/).map(p=>`<p>${rich(p.trim()).replace(/\n/g,'<br>')}</p>`).join('')}</div>` : '';
      const fb=card.querySelector('.fb'); ok ? fbOk(fb, why) : fbNo(fb, '', `<span>You found ${got} of ${r.count}. The notes with a dashed green border were missed.</span>${why}`);
      const item={id:r.id, level:r.level};
      if(ok){ st.hit(item); } else { st.miss(item); deck.retry(r); }
      passageDone(fb, ok?1:0, 1, ok?'You found all three notes.':''); manualNext(card,step,'Next passage →'); };
    btns.forEach(b=>b.onclick=()=>toggle(b)); chk.onclick=check;
    keyHandler=e=>{ const n=parseInt(e.key,10); if(n>=1&&n<=btns.length) toggle(btns[n-1]); else if(e.key==='Enter'){ e.preventDefault(); check(); } };
  };
  step();
}

// ---------- CHINESE SIDE (data-only="zh"): vocabulary games with Chinese support ----------
// Chinese appears next to the key word only. Answer options are always English.
const ZH = Object.fromEntries(S.words.filter(w=>w.zh).map(w=>[w.id,w.zh]));   // the zh column of words.csv
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
// A Chinese-version game needs at least 4 words at the chosen level (and Odd one out needs word groups)
const zhReady = g => zhWords().length>=4 && !(g.needs && !g.needs());
function zhMenu(){
  tidyChoice(); const n=zhWords().length;
  const card=g=>{ const off=!zhReady(g);
    const best=store.get((g.type==='challenge'?'best:':'streak:')+g.key,0);
    return `<a class="game${off?' off':''}" ${off?'aria-disabled="true"':`href="#play-${g.key}"`}><h3>${g.name}</h3><p lang="zh-CN" class="zh-sub">${g.zh}</p><p>${g.blurb}</p>
      <span class="best">${off?(n<4?'Not enough words at this level yet 本级别单词不够':'Not enough word groups at this level yet 本级别词组不够'):best?(g.type==='challenge'?'Best score: ':'Best streak: ')+best:'Not played yet'}</span></a>`; };
  frame({href:CFG.back||'../index.html', label:CFG.backLabel||'中文版 Chinese version'}, `
  <section class="hero hero-zh">
    <div class="hero-main">
      <p class="eyebrow">Chinese version 中文版</p>
      <h1>${esc(CFG.name||'')}</h1>
      ${CFG.blurb?`<p>${esc(CFG.blurb)}</p>`:''}
    </div>
    <aside class="hero-side" aria-label="Level 级别">
      ${levelsHtml()}
      <p class="setnote">${levelNote(n)}</p>
      ${levelCard(true)}
    </aside>
  </section>
  ${learnHtml()}
  <p class="instr group-label">Practice 练习</p>
  <div class="games">${ZH_GAMES.filter(g=>g.type==='practice').map(card).join('')}</div>
  <p class="instr group-label">Challenge 挑战</p>
  <div class="games">${ZH_GAMES.filter(g=>g.type==='challenge').map(card).join('')}</div>
  <div class="wl-link"><p>See every word with its Chinese meaning. 查看所有单词和中文释义。</p><a class="btn alt" href="#words">Word list 词汇表</a></div>`);
  wireLevels(zhMenu);
}
function zhShell(title, note){
  frame({href:'#', label:CFG.name||'Back'}, `<div class="bar"><span class="title">${title}</span><span class="spacer"></span><div class="stats" id="stats"></div></div>
    ${note?`<p class="hint">${note}</p>`:''}<div class="feed" id="feed"></div>`);
}
// ----- Chinese side: LEARN THE WORDS (where every topic starts) -----
// New words are shown a few at a time: a card with the Chinese and the English, then a quick multiple choice
// (see the Chinese, choose the English word). Once answered, a word is in the student's word bank and the games
// keep bringing it back. Words are taught in the order of words.csv, at the chosen level. A few older words that
// are due come along too; when every word at the level has been met, the button gives a review round instead.
// These answers move words on and earn points, but don't count towards the student's level (they have just seen the answers).
const LEARN_N = 4, LEARN_EXTRA = 2, LEARN_REVIEW = 8;
const stageOf = w => { const r=P.wordRec(w.id); return !r ? 'new' : r.s>=4 ? 'known' : r.s>=2 ? 'fam' : 'learn'; };
const STAGES = [['known','Known','掌握'], ['fam','Familiar','熟悉'], ['learn','Learning','学习中'], ['new','New','新']];
function learnHtml(){
  P.refresh();
  const p=zhWords(), c={known:0, fam:0, learn:0, new:0}; p.forEach(w=>c[stageOf(w)]++);
  const total=p.length, met=total-c.new, ready=total>=4, next=Math.min(LEARN_N, c.new), b=chosenBand();
  const pct=k=>total ? (100*c[k]/total).toFixed(2) : 0;
  const status = !ready ? 'Not enough words at this level yet. 本级别单词不够。'
    : c.new ? (met ? `${met} of ${total} words learned. Next: ${next} new word${next===1?'':'s'}. 已学 ${met} / ${total} 个单词，下一组：${next} 个新单词。`
                   : `${total} words to learn. Start with the first ${next}. 共 ${total} 个单词，先学 ${next} 个。`)
    : `You have met all ${total} words at this level. Review them to make them Known. 本级别的单词你都学过了，复习一下吧。`;
  return `<section class="learn" aria-labelledby="learnH">
    <p class="learn-k">Start here 从这里开始${b!=null && LEVELS.length>1 ? ' · '+esc(bandName(b, true)) : ''}</p>
    <h2 id="learnH">Learn the words <span lang="zh-CN">学习单词</span></h2>
    <p>Meet ${LEARN_N} new words at a time, then match each Chinese word to its English word. They go into your word bank, and the games below help you remember them.</p>
    <p lang="zh-CN">每次认识 ${LEARN_N} 个新单词，然后把中文和英文配对。学过的单词会进入你的词库，下面的游戏帮你记住它们。</p>
    ${total ? `<div class="wb"><p class="wb-k">Your words at this level 本级别的单词</p>
      <span class="wb-bar" role="img" aria-label="${c.known} known, ${c.fam} familiar, ${c.learn} learning, ${c.new} new">${STAGES.filter(x=>x[0]!=='new').map(([k])=>`<i class="wb-${k}" style="width:${pct(k)}%"></i>`).join('')}</span>
      <p class="wb-legend">${STAGES.map(([k,en,zh])=>`<span><i class="sw wb-${k}"></i>${en} <span lang="zh-CN">${zh}</span> <b>${c[k]}</b></span>`).join('')}</p></div>` : ''}
    <div class="learn-row">${ready ? `<a class="btn big" href="#learn">${c.new ? 'Learn the words 学习单词' : 'Review the words 复习单词'} →</a>`
      : `<span class="btn big off" aria-disabled="true">Learn the words 学习单词</span>`}<p class="learn-status">${status}</p></div>
  </section>`;
}
function playLearn(){
  P.refresh();
  const p=zhWords(), pool=p.length>=8 ? p : S.words.filter(w=>ZH[w.id]), now=Date.now();
  const batch=p.filter(w=>stageOf(w)==='new').slice(0, LEARN_N), review=!batch.length;
  const isDue=w=>{ const r=P.wordRec(w.id); return r && r.s<4 && (r.due||0)<=now; };
  const quiz = review ? rankForLevel(p).slice(0, LEARN_REVIEW)
    : shuffle([...batch, ...rankForLevel(p.filter(w=>!batch.includes(w) && stageOf(w)!=='new')).filter(isDue).slice(0, LEARN_EXTRA)]);
  let total=batch.length+quiz.length, done=0, answered=0, right=0;
  const firstTry=new Set(), again=new Set(), queue=quiz.slice();
  zhShell(review ? 'Review the words 复习单词' : 'Learn the words 学习单词',
    review ? 'See the Chinese, choose the English word. 看中文，选出英文单词。'
           : 'Meet the new words, then match each Chinese word to its English word. 先认识新单词，再把中文和英文配对。');
  const sp=document.querySelector('.bar .spacer'); if(sp) sp.outerHTML='<span class="progress learn-progress" aria-hidden="true"><i id="learnFill"></i></span>';
  const statsEl=document.getElementById('stats');
  const tick=()=>{ const f=document.getElementById('learnFill'); if(f) f.style.width=(100*done/total)+'%'; };
  // Wrong answers: the other new words first (the ones to tell apart), then other words at the level
  const wrongFor=w=>{ const a=review ? [] : distractors(w, batch, Math.min(2, batch.length-1)).slice(0, Math.max(0, Math.min(2, batch.length-1)));
    const rest=pool.filter(x=>!a.some(o=>o.id===x.id || o.w===x.w || areAlike(o.id,x.id)));
    return [...a, ...distractors(w, rest, 3-a.length)].slice(0,3); };
  const intro=i=>{
    if(i>=batch.length) return quizStep();
    const w=batch[i];
    statsEl.innerHTML=`<span>New word <b>${i+1}</b>/${batch.length}</span>`;
    const card=showCard(`<p class="instr">New word 新单词 · ${i+1} of ${batch.length}</p>
      <div class="zh-prompt" lang="zh-CN">${esc(ZH[w.id])}</div>
      <p class="prompt-word learn-en">${esc(w.w)}${w.pos?` <small>${esc(w.pos)}</small>`:''}</p>
      <p class="learn-def">${esc(w.def)}</p>${w.ex?`<p class="learn-ex"><i>${esc(w.ex)}</i></p>`:''}`);
    card.classList.add('learn-card');
    manualNext(card, ()=>{ done++; tick(); intro(i+1); }, i+1<batch.length ? 'Next word 下一个 →' : 'Now match them 开始配对 →');
  };
  const quizStep=()=>{
    const w=queue.shift(); if(!w) return finish();
    statsEl.innerHTML=`<span>Right <b>${right}</b>/${answered}</span>`;
    const old=!review && !batch.includes(w);
    mcCard({instr:'Choose the English word 选出英文单词', promptHtml:`<div class="zh-prompt" lang="zh-CN">${esc(ZH[w.id])}</div>${old?'<p class="learn-tag">Review 复习</p>':''}`,
      options:[w.w, ...wrongFor(w).map(x=>x.w)], answer:w.w,
      onResult:(ok,card,fb)=>{ P.record('learn', w, ok, {noRate:true}); answered++;
        const note=`<span class="wd"><b>${esc(w.w)}</b> <span lang="zh-CN">${esc(ZH[w.id])}</span>: ${esc(w.def)}</span>`;
        statsEl.innerHTML=`<span>Right <b>${right+(ok?1:0)}</b>/${answered}</span>`;
        if(ok){ right++; if(!again.has(w)) firstTry.add(w); done++; tick(); fbOk(fb, note); autoNext(card, quizStep); }
        else { fbNo(fb, w.w, note);
          // A missed word comes back once, two cards later (or at the end)
          if(!again.has(w)){ again.add(w); queue.splice(Math.min(queue.length, 2), 0, w); total++; } else { done++; }
          tick(); manualNext(card, quizStep); }
      }});
  };
  const finish=()=>{
    done=total; tick(); P.refresh();
    const left=zhWords().filter(x=>stageOf(x)==='new').length, more=Math.min(LEARN_N, left), shown=review ? quiz : batch;
    statsEl.innerHTML=`<span>Right <b>${right}</b>/${answered}</span>`;
    const card=showCard(`<div class="end"><p class="instr">${review?'Review the words':'Learn the words'} · finished 完成</p>
      <h2>${review ? 'Review done! 复习完成！' : `${batch.length} new word${batch.length===1?'':'s'} in your word bank`}</h2>
      ${review ? '' : `<p class="end-zh" lang="zh-CN">${batch.length} 个新单词已加入你的词库。</p>`}
      <p class="end-sub">${firstTry.size} of ${quiz.length} right first time. 第一次就答对 ${firstTry.size} / ${quiz.length}。</p>
      <ul class="review">${shown.map(w=>`<li><b>${esc(w.w)}</b> <span lang="zh-CN">${esc(ZH[w.id])}</span> – ${esc(w.def)}</li>`).join('')}</ul>
      ${!left && !review ? '<p class="end-sub">You have met every word at this level! 本级别的单词你都学过了！</p>' : ''}
      <div class="end-actions"><button class="btn" id="more">${left ? `Learn ${more} more 再学 ${more} 个` : 'Review the words 复习单词'}</button>
        <a class="btn alt" href="#play-zhmatch">Play Match the meaning 单词配释义</a><a class="btn alt" href="#">All games 所有游戏</a></div></div>`);
    card.querySelector('#more').onclick=playLearn;
    keyHandler=e=>{ if(e.key==='Enter'){ e.preventDefault(); playLearn(); } };
  };
  if(review){ total=quiz.length; quizStep(); } else intro(0);
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

// ----- Chinese side: Odd one out (by the group column of words.csv, or by part of speech with data-odd="pos") -----
// Three words come from one group at the chosen level. The odd one comes from another group at that level,
// or from another group in the topic when the level has only one group.
const oddKey = w => CFG.odd==='pos' ? (w.pos||'') : (w.group||'');
const oddLabel = k => k;
const groupsOf = ws => { const g={}; ws.forEach(w=>{ const k=oddKey(w); if(k) (g[k]=g[k]||[]).push(w); }); return g; };
const distinctWords = ws => ws.filter((w,i,a)=>a.findIndex(x=>x.w===w.w)===i);
function oddGroups(){ return groupsOf(zhWords()); }
function oddReady(){ const g=oddGroups(), big=Object.keys(g).filter(k=>distinctWords(g[k]).length>=3);
  return big.length>0 && (Object.keys(g).length>=2 || Object.keys(groupsOf(S.words.filter(w=>ZH[w.id]))).length>=2); }
function playOdd(){
  const st=Stats('zhodd');
  zhShell('Odd one out','Three words belong together. Tap the odd one out. 三个词属于同一类，找出不同的那个。'); st.draw();
  const step=()=>{
    const g=oddGroups(), big=Object.keys(g).filter(k=>distinctWords(g[k]).length>=3);
    const main=big[Math.floor(Math.random()*big.length)];
    const three=distinctWords(shuffle(g[main])).slice(0,3);
    let pool=g, others=Object.keys(g).filter(k=>k!==main);
    if(!others.length){ pool=groupsOf(S.words.filter(w=>ZH[w.id])); others=Object.keys(pool).filter(k=>k!==main); }
    const oddK=others[Math.floor(Math.random()*others.length)], cands=shuffle(pool[oddK]);
    const odd=cands.find(w=>!three.some(t=>t.w===w.w)) || cands[0];
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
function levelCard(compact){
  const zh=CFG.only==='zh', t=P.topic(), n=t?t.n:0, left=P.CAL-n;
  const head=`<p class="lvl-k">Your level${zh?' 你的水平':''}</p>`;
  if(n<P.CAL) return `<div class="lvl-card">${head}<p class="lvl-v">Finding your level…${zh?' 正在评估':''}</p><span class="lvl-bar"><i style="width:${n*100/P.CAL}%"></i></span>
    <p class="lvl-s">Answer ${left} more question${left===1?'':'s'} in any game below and your level will appear here.${zh?` 再答 ${left} 题即可看到你的水平。`:''}</p></div>`;
  const L=P.label(t.r), w=t.words, mine=myBand(), off=LEVELS.length>1 && chosenBand()!==mine;
  // Compact (the level panel on a Chinese topic page): the word counts are shown in Learn the words instead
  if(compact) return `<div class="lvl-card">${head}<p class="lvl-v"><b>${nameHtml(L.name)}</b>${zh&&L.zh?`<span lang="zh-CN">${L.zh}</span>`:''}</p><span class="lvl-bar"><i style="width:${L.pct}%"></i></span>
    <p class="lvl-s">${L.next?`${L.pct}% of the way to ${esc(L.next)}`:'Top level'}${t.pts?` · ${Number(t.pts).toLocaleString('en-GB')} points`:''}</p>
    ${off ? `<p class="lvl-s"><span class="dot-good"></span> marks your level.${zh?' 绿点表示你的水平。':''}</p><p class="lvl-s"><button class="btn alt small" id="pickLevel">Use my level${zh?' 用我的水平':''}</button></p>`:''}
    <p class="lvl-s"><a href="${ROOT}progress/index.html?from=${encodeURIComponent(location.pathname+location.hash)}">All my progress${zh?' 我的进步':''}</a></p></div>`;
  return `<div class="lvl-card">${head}<p class="lvl-v"><b>${nameHtml(L.name)}</b>${zh&&L.zh?`<span lang="zh-CN">${L.zh}</span>`:''}</p><span class="lvl-bar"><i style="width:${L.pct}%"></i></span>
    <p class="lvl-s">${L.next?`${L.pct}% of the way to ${esc(L.next)}`:'Top level'}${w&&w.total?` · words: ${w.known} known, ${w.fam} familiar, ${w.learn} learning (of ${w.total})`:''}${t.pts?` · ${Number(t.pts).toLocaleString('en-GB')} points here`:''} · <a href="${ROOT}progress/index.html?from=${encodeURIComponent(location.pathname+location.hash)}">All my progress${zh?' 我的进步':''}</a></p>
    ${off ? `<p class="lvl-s"><span class="dot-good"></span> marks your level.${zh?' 绿点表示你的水平。':''} <button class="btn alt small" id="pickLevel">Use my level${zh?' 用我的水平':''}</button></p>`:''}</div>`;
}
// The row of level buttons on a topic menu (none when the page has only one level)
function levelsHtml(){
  if(LEVELS.length<2) return '';
  const zh=SIDE==='zh', mine=P.known()?myBand():null, cb=chosenBand(), list=zh?S.words.filter(w=>ZH[w.id]):S.words;
  return `<p class="set-head levels-head">Level${zh?' 级别':''}</p><div class="sets levels" role="group" aria-label="Level${zh?' 级别':''}">${LEVELS.map(b=>{ const c=LEVEL_CODES[b], n=list.filter(w=>playBand(w)===b).length;
    return `<button class="chip${b===mine?' chip-good':''}" data-band="${b}" aria-pressed="${b===cb}"><span class="chip-label"><span class="chip-en">${esc(LEVEL_NAMES[c])}</span>${zh?` <span class="chip-zh" lang="zh-CN">${LEVEL_ZH[c]}</span>`:''}</span>${n?` <span class="chip-n" title="${n} words">${n}</span>`:''}</button>`; }).join('')}</div>`;
}
// The line under the level buttons: how many words there are at this level
function levelNote(n){
  const zh=SIDE==='zh', b=chosenBand(), words=`${n} word${n===1?'':'s'}`;
  if(LEVELS.length>1) return zh ? `${words} at this level. 本级别共 ${n} 个单词。` : `${words} at this level.`;
  if(b!=null) return zh ? `${words} · ${esc(bandName(b))} ${LEVEL_ZH[LEVEL_CODES[b]]}. 共 ${n} 个单词。` : `${words} · ${esc(bandName(b))} level.`;
  return zh ? `${words}. 共 ${n} 个单词。` : `${words}.`;
}
function wireLevels(again){
  $app.querySelectorAll('.levels .chip').forEach(c=>c.onclick=()=>{ const y=window.scrollY; chooseBand(+c.dataset.band); again(); window.scrollTo(0,y); });
  const b=document.getElementById('pickLevel'); if(b) b.onclick=()=>{ chooseBand(null); again(); };
}
function progressPage(){
  const d=P.refresh(), list=Object.values(d.topics).sort((a,b)=>(b.last||0)-(a.last||0));
  const answers=list.reduce((s,t)=>s+t.n,0), right=list.reduce((s,t)=>s+t.right,0);
  const ws=Object.values(d.words), known=ws.filter(w=>w.s>=4).length, learning=ws.filter(w=>w.s>=1&&w.s<4).length;
  let streak=0; const dt=new Date(); if(!d.days[P.dayKey(dt)]) dt.setDate(dt.getDate()-1); while(d.days[P.dayKey(dt)]){ streak++; dt.setDate(dt.getDate()-1); }
  const ov=P.overall(), L=ov!=null?P.label(ov):null, PT=window.AEA_POINTS, fmt=n=>Number(n||0).toLocaleString('en-GB');
  // Points: English and Chinese apart
  const ptsCard=(side,label)=>{ const t=PT?PT.totals(side):{};
    return `<div class="pts-card"><p class="pts-card-k">${label}</p><div class="pts-nums">${[['s','this session'],['d','today'],['w','this week'],['m','this month'],['t','total']]
      .map(([k,l])=>`<div${k==='t'?' class="pts-total"':''}><b>${fmt(t[k])}</b><span>${l}</span></div>`).join('')}</div>
      ${PT?(()=>{ const goal=PT.WEEKLY_TARGET, w=t.w||0; return `<p class="pts-goal">${w>=goal?`<b>Weekly target reached!</b> ${fmt(w)} of ${goal} points`:`This week: ${fmt(w)} of ${goal} points · ${fmt(goal-w)} to go`}</p><span class="lvl-bar"><i style="width:${Math.min(100,100*w/goal)}%"></i></span>`; })():''}</div>`; };
  const days=PT?PT.lastDays(14):[], pmax=Math.max(1,...days.map(x=>x.en+x.zh));
  const chart=`<div class="days pts-days" role="img" aria-label="Points per day over the last 14 days">${days.map(x=>{ const tot=x.en+x.zh;
      return `<span class="pcol${tot?'':' zero'}" title="${x.date.toDateString()}: ${x.en} English, ${x.zh} Chinese version"><i class="zh" style="height:${100*x.zh/pmax}%"></i><i class="en" style="height:${100*x.en/pmax}%"></i></span>`; }).join('')}</div>
    <p class="legend"><span class="sw en"></span>English <span class="sw zh"></span>Chinese version 中文版</p>`;
  const how=`<details class="pts-how"><summary>How to earn points 如何获得积分</summary>
    <ul><li>Only right answers earn points. Harder levels and longer tasks earn more.</li>
      <li>Every ${PT?PT.DOCK_EVERY:5} wrong answers take 1 point off (never below 0 for the day).</li>
      <li>A reading passage's points are shared between its questions.</li>
      <li>English and Chinese version points are counted separately. The week starts on Monday.</li>
      <li>Weekly target: ${PT?PT.WEEKLY_TARGET:200} points.</li></ul>
    <div class="pts-table-wrap"><table class="pts-table"><thead><tr><th>Task</th>${Object.keys(LEVEL_NAMES).map(c=>`<th>${esc(LEVEL_NAMES[c])}</th>`).join('')}</tr></thead>
      <tbody>${POINT_KINDS.map(([k,label])=>`<tr><td>${esc(label)}</td>${POINTS[k].map(n=>`<td>${n}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
  const row=t=>{ const found=t.n>=P.CAL, l=found?P.label(t.r):null, w=t.words;
    return `<a class="prog-row" href="${esc(t.href||'#')}"><span class="prog-name">${esc(t.name)}<small>${t.side==='zh'?'中文版':'English'}</small></span>
      <span class="prog-lvl">${found?`<b>${nameHtml(l.name)}</b>${t.side==='zh'&&l.zh?` <span lang="zh-CN">${l.zh}</span>`:''}`:`Finding level · ${t.n} of ${P.CAL}`}</span>
      <span class="lvl-bar"><i style="width:${found?l.pct:t.n*100/P.CAL}%"></i></span>
      <span class="prog-meta">${w&&w.total?`${w.known} of ${w.total} words known · `:''}${t.n} answer${t.n===1?'':'s'} · ${t.n?Math.round(100*t.right/t.n):0}% right${t.pts?` · ${fmt(t.pts)} points`:''}</span></a>`; };
  let back={href:CFG.back||'../index.html', label:CFG.backLabel||'Back'};
  const from=new URLSearchParams(location.search).get('from')||'';
  try{ const ref=document.referrer && new URL(document.referrer);
    if(from==='en' || from==='zh') back={href:ROOT+from+'/index.html', label:from==='zh'?'中文版 Chinese version':'English topics'};
    else if(/^\/(?!\/)/.test(from)) back={href:from, label:'Back'};
    else
    if(ref && ref.origin===location.origin && ref.pathname!==location.pathname) back={href:ref.href, label:'Back'};
    else { const side=(list[0]||{}).side; if(side) back={href:ROOT+(side==='zh'?'zh':'en')+'/index.html', label:side==='zh'?'中文版 Chinese version':'English topics'}; }
  }catch(e){}
  frame(back, `
  <section class="hero"><p class="eyebrow">My progress 我的进步</p>
    <h1>${L?`${nameHtml(L.name)} <span class="h-sub" lang="zh-CN">${L.zh}</span>`:'Let’s find your level'}</h1>
    <p>${L?`Your overall level, from everything you have played.${L.next?` You are ${L.pct}% of the way to ${esc(L.next)}.`:''}`:`Play any game. After ${P.CAL} answers in a topic, your level appears here. 在任一主题答 ${P.CAL} 题后，这里会显示你的水平。`}</p>
    ${L?`<span class="lvl-bar lvl-big"><i style="width:${L.pct}%"></i></span>`:''}
  </section>
  <p class="instr">Points 积分</p>
  <div class="pts-cards">${ptsCard('en','English')}${ptsCard('zh','Chinese version 中文版')}</div>
  <p class="instr">Points, last 14 days</p>
  ${chart}
  <div class="stat-tiles"><div class="stat"><b>${answers}</b><span>answers</span></div><div class="stat"><b>${answers?Math.round(100*right/answers):0}%</b><span>right</span></div>
    <div class="stat"><b>${streak}</b><span>day${streak===1?'':'s'} in a row</span></div><div class="stat"><b>${known}</b><span>words known · ${learning} learning</span></div></div>
  <p class="instr">Topics</p>
  <div class="prog-list">${list.length?list.map(row).join(''):'<p class="notice">No games played yet on this device. 这台设备上还没有游戏记录。</p>'}</div>
  ${how}
  <p class="hint" style="margin-top:22px">Progress is saved in this browser on this device. Clearing browsing data, or using another computer, starts again.</p>`);
}

// ---------- WORD LIST ----------
function wordList(){
  frame({href:'#', label:CFG.name||'Back'}, `<div class="bar"><span class="title">Word list</span></div>
    <input class="search" id="q" type="search" placeholder="Search words or meanings" aria-label="Search the word list"><div id="list"></div>`);
  let q='';
  const draw=()=>{ const t=q.trim().toLowerCase(); let html='';
    // One heading per level, the chosen level first
    const order=[chosenBand(), ...LEVELS.filter(b=>b!==chosenBand()), null].filter((b,i,a)=>a.indexOf(b)===i);
    for(const lb of order){ const ws=S.words.filter(w=>(playBand(w)??null)===lb && (!t||w.w.toLowerCase().includes(t)||w.def.toLowerCase().includes(t)||(w.syn||[]).some(x=>x.includes(t))||(ZH[w.id]||'').includes(t)));
      if(!ws.length) continue;
      const head=lb==null ? (LEVELS.length?'Other words':'') : bandName(lb, CFG.only==='zh')+(lb===chosenBand()&&LEVELS.length>1?(CFG.only==='zh'?' · chosen level 当前级别':' · chosen level'):'');
      html+=`${head?`<p class="instr" style="margin:22px 0 8px">${esc(head)}</p>`:''}<div class="wl">${ws.map(w=>`<div class="wl-row">
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
    if(h==='learn') return zhWords().length>=4 ? playLearn() : zhMenu();
    const g=ZH_GAMES.find(x=>'play-'+x.key===h);
    return g && zhReady(g) ? g.run() : zhMenu();
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
window.addEventListener('resize', ()=>{ const p=isPhone(); if(p!==PHONE && CFG.only!=='progress'){ PHONE=p; document.documentElement.classList.toggle('phone',PHONE);
  // re-draw menus for the new screen size, but never wipe a game in progress on a computer
  const h=location.hash.replace(/^#/,''); if((!h||CATS[h]) && !(document.getElementById('feed') && !PHONE)) route(); } });
route();
}   // end of main()

boot();
})();
