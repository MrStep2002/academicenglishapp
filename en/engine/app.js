// English games engine: one set of games for every subject.
// A topic page says where its content is (data-content: a folder of CSV files, see content/README.md); this file loads it.
// Routes (the part after # in the address): menu, #vocab, #grammar, #reading, #play-<game>, #words
(function(){
'use strict';
// The site's top folder, worked out from where this file lives (en/engine/app.js), so links work on any host and from a local copy
const ROOT = ((document.currentScript && document.currentScript.src) || '/en/engine/app.js').replace(/en\/engine\/app\.js([?#].*)?$/, '');
const $app = document.getElementById('app');
const CFG = $app.dataset;   // data-name, data-blurb, data-back, data-back-label, data-only, data-content, data-reading, data-format, data-store, data-odd, data-hide
const KEY = CFG.store || (CFG.content||'').replace(/\/+$/,'').split('/').pop() || 'topic';   // where this page's progress is saved
const SIDE = (CFG.only==='zh' || /^zh/.test(KEY)) ? 'zh' : 'en';
// Chinese side: instructions in ONE language at a time (26 Oct; teacher: both languages together "look super messy").
// The English / 中文 switch next to the points bar (account.js) saves 'en' or 'zh' in aea:ui-lang and sets
// <html data-ui="en|zh">; the CSS then hides the other language. Chinese is the default. The words being learned
// (English words, their Chinese, meanings, examples) are content: they always show, whatever the switch says.
// T(en, zh): both, each in its own span, for HTML (the English side just gets the English).
// TX(en, zh): only the chosen one, for text that can't hold HTML (textContent, placeholders, aria-labels).
function uiLang(){ try{ return localStorage.getItem('aea:ui-lang')==='en' ? 'en' : 'zh'; }catch(e){ return 'zh'; } }
function T(en, zh){ return SIDE==='zh' ? `<span class="t-en">${en}</span><span class="t-zh" lang="zh-CN">${zh}</span>` : en; }
function TX(en, zh){ return SIDE==='zh' && uiLang()==='zh' ? zh : en; }
// A bilingual name from the page ("Web design 网页设计"): the English, the Chinese, and both as T()
function splitName(s){ s=String(s||''); const i=s.search(/[\u3400-\u9fff]/); return i>0 ? {en:s.slice(0,i).trim(), zh:s.slice(i).trim()} : {en:s, zh:''}; }
function nameT(s){ const n=splitName(s); return n.zh ? T(esc(n.en), esc(n.zh)) : esc(n.en); }
const PAGE = location.href.split('#')[0].split('?')[0].slice(ROOT.length);   // this page, from the site's top folder (e.g. zh/web-design/index.html)
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
    const q={q:r['question'+a], opts:[r['correct'+a], r['wrong1'+b], r['wrong2'+b], r['wrong3'+b]], why:r['explanation'+a]||'', quote:r['quote'+a]||''};
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
  const S={key:KEY, words:[], alike:[], accept:[], gaps:[], builds:[], errors:[], tf:[], rw:[], reads:[], questions:[], extracts:[], passages:[]};
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
    S.builds.push({id:r.id, level:lv('builds',r), goal:r.goal||'', zh:r.zh||'', tiles, decoys:pieces(r,r.decoys), alt, why:r.explanation||''}); });
  (T.errors||[]).forEach(r=>{ if(!/\[[^\]|]+\|[^\]|]+\|[^\]]+\]/.test(r.text||'')) return warn('errors',r,'skipped: the text needs at least one [wrong|right|why]');
    S.errors.push({id:r.id, level:lv('errors',r), title:r.title||'', text:r.text}); });
  (T.tf||[]).forEach(r=>{ const a=String(r.answer||'').trim().toLowerCase(), t=/^(true|t|yes|y)$/.test(a);
    if(!r.statement||(!t && !/^(false|f|no|n)$/.test(a))) return warn('tf',r,'skipped: it needs a statement and an answer of TRUE or FALSE');
    S.tf.push({id:r.id, level:lv('tf',r), s:r.statement, t, why:r.explanation||''}); });
  // Right or wrong (right-wrong.csv): is the sentence right, or does it have a mistake? Optional column: correction
  (T['right-wrong']||[]).forEach(r=>{ const a=String(r.answer||'').trim().toLowerCase(), ok=/^(right|r|correct|true|t|yes|y)$/.test(a);
    if(!r.statement||(!ok && !/^(wrong|w|incorrect|false|f|no|n)$/.test(a))) return warn('right-wrong',r,'skipped: it needs a statement and an answer of RIGHT or WRONG');
    S.rw.push({id:r.id, level:lv('right-wrong',r), s:r.statement, ok, fix:r.correction||'', why:r.explanation||''}); });
  // Complete the text (reads.csv): every [[word]] in the text becomes a gap, and the gap can be any word or form (25 Oct).
  // When it is a word in words.csv, or a simple form of one (drifts → drift, carried → carry, grabbed → grab, making → make),
  // the gap is linked to that word: its meaning is shown after Check and the student's progress with it is kept.
  // [[shown text|word]] names the word directly. Any other word still makes a gap, just without a meaning behind it.
  // A text needs at least 2 gaps. Optional extra1–extra3: the text's own extra words for the word bank (any words);
  // without them the bank has only the text's own gap words.
  const FORM_POS={s:['noun','verb'], ed:['verb'], ing:['verb']};   // a form's base word must be one of these (when its pos is given)
  const formOf=v=>{ const t=String(v||'').trim().toLowerCase(); if(!t) return null; if(byText[t]) return byText[t][0];
    const tries=[], add=(b,k)=>{ if(b.length>=2) tries.push([b,k]); };
    if(/ies$/.test(t)) add(t.slice(0,-3)+'y','s');
    if(/es$/.test(t)) add(t.slice(0,-2),'s');
    if(/[^s]s$/.test(t)) add(t.slice(0,-1),'s');
    if(/ied$/.test(t)) add(t.slice(0,-3)+'y','ed');
    if(/ed$/.test(t)){ add(t.slice(0,-2),'ed'); add(t.slice(0,-1),'ed'); if(/(.)\1ed$/.test(t)) add(t.slice(0,-3),'ed'); }
    if(/ing$/.test(t)){ add(t.slice(0,-3),'ing'); add(t.slice(0,-3)+'e','ing'); if(/(.)\1ing$/.test(t)) add(t.slice(0,-4),'ing'); }
    for(const [b,k] of tries){ const id=(byText[b]||[]).find(id=>{ const p=(byId[id].pos||'').toLowerCase(); return !p || FORM_POS[k].some(x=>p.includes(x)); }); if(id) return id; }
    return null; };
  (T.reads||[]).forEach(r=>{
    if(!r.text) return warn('reads',r,'skipped: it needs a text');
    const text=r.text.replace(/\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g,(m,shown,w)=>`[[${shown}|${(w ? ref1('reads',r,w.trim()) : formOf(shown)) || ''}]]`);
    if((text.match(/\[\[[^\]]+\]\]/g)||[]).length<2) return warn('reads',r,'skipped: the text needs at least 2 [[gaps]]');
    const extras=['extra1','extra2','extra3'].map(k=>(r[k]||'').trim()).filter(Boolean);
    S.reads.push({id:r.id, level:lv('reads',r), title:r.title||'', text, extras}); });
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
// Load the page's files, then start. The Chinese version only needs the words, and builds.csv for Build the sentence.
// A topic folder's files. Reading passages are not among them: the Reading Comprehension pages load theirs with data-reading
// (Read and answer on the topic pages was replaced by Close reading, and the empty reading.csv files were removed, 25 Oct).
const FILES = ['words','gaps','builds','errors','tf','right-wrong','reads','questions','extracts'];
let readingState = 'none';
function boot(){
  const dir=CFG.content ? CFG.content.replace(/\/*$/,'/') : '';
  const jobs=(dir ? (SIDE==='zh' ? ['words','builds'] : FILES) : []).map(f=>[f, dir+f+'.csv']);
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
const POINT_KIND = {zhbuild:'build', learn:'word', match:'word', syn:'word', meaning:'word', zh:'word', zhmatch:'word', zhmean:'word', zhtf:'word', zhodd:'word', zhspeed:'word', zhsurvive:'word', snake:'word', whack:'word', invaders:'word',
  zhtype:'type', gap:'grammar', tf:'grammar', rw:'grammar', build:'build', error:'build', own:'build', read:'short', question:'short', passage:'passage', notes:'passage', listen:'passage'};
const POINT_KINDS = [['word','Word games: Learn the words, Match the meaning, Word or meaning, Word Snake, Whack-a-word, Word Invaders, 中文 → English, Choose the meaning, True or false (中文版), Odd one out, Speed round, Survival'],
  ['type','Type it'], ['grammar','Fill the gap, True or false, SPAG: Right or Wrong'], ['build','Build the sentence (中文版), Spot the error, In your own words'],
  ['short','Complete the text (shared between its gaps), Answer the question'], ['passage','A reading passage or listening test: Close reading, Big idea, Note taking, Listening']];
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
  const GUESS={match:.2, syn:.2, zhmatch:.2, tf:.5, rw:.5, zhtf:.5, zhbuild:.05, zhtype:0, error:.1, build:.05};   // chance of a lucky guess
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
        if(t.n===CAL) msg=zhSide && uiLang()==='zh' ? `你的水平：${L.zh}` : `We've found your level: ${L.name}`;
        else if(t.n>CAL && Math.floor(t.r)>oldBand) msg=zhSide && uiLang()==='zh' ? `升级到${L.zh}！` : `Level up! You've reached ${L.name}`;
      }
      const words = item && item.ids ? item.ids.map(id=>byId[id]).filter(Boolean) : [wordOf(item)].filter(Boolean);
      words.forEach(w=>{ const fresh=!data.words[w.id], rec=data.words[w.id] || (data.words[w.id]={s:0, due:0});
        if(fresh && ok && (GUESS[game] ?? .25)<=.25) rec.f=1;   // right the first time it was met (not a 50/50 guess): they already knew it
        if(ok){ if(now>=rec.due && rec.s<4){ rec.s++; rec.due=now+WAIT[rec.s]; } rec.c=(rec.c||0)+1; }
        else { rec.s=Math.max(rec.s?1:0, rec.s-1); rec.due=now; rec.c=0; } });   // c: right answers in a row (Chinese side: 2 = confident)
      let known=0, fam=0, learn=0;
      S.words.forEach(w=>{ const s=(data.words[w.id]||{}).s||0; if(s>=4) known++; else if(s>=2) fam++; else if(s>=1) learn++; });
      t.words={total:S.words.length, known, fam, learn};
      // Points: only right answers earn them (level of the item, or the side's starting level if it has none)
      let pts=0;
      if(ok){ const band=d==null ? (zhSide?2:3) : Math.max(1, Math.min(5, Math.floor(d))), row=POINTS[POINT_KIND[game]||'word'];
        pts=row[band-1]; if(item && item.qs>1) pts=Math.ceil(pts/item.qs); t.pts=(t.pts||0)+pts; }
      save(); if(msg && !zhSide) toastLevel(msg);
      if(zhSide && !classRun){ const r=store.get('zhrecent', []); r.push(ok?1:0); store.set('zhrecent', r.slice(-20)); }   // pace of new words (zhPace)   // the Chinese side has its own level-up message (zhPoolWords)
      if(classRun) classCount(ok);   // a class game: +1 / -1
      else if(inCircuit && window.AEA_CIRCUIT) AEA_CIRCUIT.count(PAGE, ok, pts);
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
  // Chinese side (31 Oct): no level target; shaky words first, words never answered soon after, confident ones less often, known ones last
  if(SIDE==='zh' && !classRun) return items.map(it=>{ let sc=Math.random()*0.8; const w=wordOf(it), rec=w && P.wordRec(w.id);
      if(w){ if(!rec) sc-=0.3; else if(!zhConfident(w)) sc-=0.6; else if(rec.s>=4 && rec.due>now) sc+=0.9; else sc+=0.3; }
      return [sc,it]; }).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
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
const ON_PAGE = SIDE==='zh' ? S.words.filter(w=>w.zh) : ['words','gaps','errors','tf','rw','reads','questions','extracts','passages'].flatMap(k=>S[k]||[]);
const bandOf = x => { const n=itemLevel(x); return n==null ? null : Math.max(1, Math.min(5, Math.floor(n))); };
const BAND_N = {}; ON_PAGE.forEach(x=>{ const b=bandOf(x); if(b!=null) BAND_N[b]=(BAND_N[b]||0)+1; });
let LEVELS = Object.keys(BAND_N).map(Number).filter(b=>BAND_N[b]>=MIN_LEVEL).sort((a,b)=>a-b);
if(!LEVELS.length && Object.keys(BAND_N).length) LEVELS=[+Object.keys(BAND_N).sort((a,b)=>BAND_N[b]-BAND_N[a])[0]];
const nearestLevel = b => LEVELS.length ? LEVELS.reduce((best,x)=>Math.abs(x-b)<Math.abs(best-b)?x:best) : null;   // a tie goes to the lower level
const playBand = x => { const b=bandOf(x); return b==null ? null : nearestLevel(b); };
const myBand = () => nearestLevel(Math.max(1, Math.min(5, Math.floor(P.rating()))));
let pickedBand = (()=>{ const n=levelNum(store.get('level', null)); return n==null ? null : Math.floor(n); })();
let inCircuit = false;   // playing a station of the Daily Circuit: the student's own level on the English side
// Chinese side: the circuit uses the level the student chose on that topic, because that is where their word bank is
// (Learn the words teaches at the chosen level and doesn't move their level; 27 Oct). No level chosen: their own level.
// Chinese side (31 Oct): no level buttons; the level is the one their words have reached (zhBand), never chosen.
const chosenBand = () => classRun ? classBand() : SIDE==='zh' ? zhBand() : !inCircuit && pickedBand!=null && LEVELS.includes(pickedBand) ? pickedBand : myBand();
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
// Daily Circuit: when a station's time is up, circuitFinish marks a long task the student has started (what they did counts)
// and circuitStop stops an arcade game, so nothing is recorded after the station ends
let circuitFinish=null, circuitStop=null;
document.addEventListener('keydown', e => { if(keyHandler && !e.metaKey && !e.ctrlKey && !e.altKey && e.target.tagName!=='INPUT') keyHandler(e); });
const later = (fn,ms) => { const t=setTimeout(fn,ms); timers.push(t); return t; };
const clearTimers = () => { timers.forEach(clearTimeout); timers=[]; };

// Endless deck: shuffled, refilled when empty; missed items come back a few cards later.
function Deck(items){   // items: a list, or a function giving the list (read again on refill, and every 4 cards for newcomers)
  let queue=[], last=null, calls=0; const retried=new Set(), dealt=new Set(), live=typeof items==='function', src=live ? items : ()=>items;
  const newcomers=()=>{ const inQ=new Set(queue); src().filter(x=>!inQ.has(x) && !dealt.has(x) && x!==last).forEach(x=>queue.splice(Math.min(queue.length, 1+Math.floor(Math.random()*4)), 0, x)); };
  const refill=()=>{ dealt.clear(); queue=rankForLevel(src()); if(queue.length>1 && queue[0]===last) queue.push(queue.shift()); };
  return {
    next(){ if(!queue.length) refill(); else if(live && ++calls%4===0) newcomers(); last=queue.shift(); dealt.add(last); return last; },
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
    el.innerHTML=`<span>${T('Correct','答对')} <b>${s.correct}</b>/${s.answered}</span><span class="streak">${T('Streak','连对')} <b>${s.streak}</b></span><span>${T('Best','最佳')} <b>${s.best}</b></span>`; };
  return s;
}

// ---------- categories and games ----------
const CATS = {
  vocab:   {name:'Vocabulary', blurb:'Learn what the words mean and which words go together.'},
  grammar: {name:'Grammar',    blurb:'Use the words accurately: word forms, verb forms, sentence building.'},
  reading: {name:'Reading',    blurb:'Read longer texts and work out meaning in context.', desktop:true}
};
// form: short (one quick answer at a time) or long (read something, then several answers): the Daily Circuit's
// short and long stations choose from these. A game with no form (Read and answer) is never in the circuit.
// Columns (26 Oct, teacher): True or false moved from Grammar to Vocabulary, Spot the error from Grammar to Reading.
// 31 Oct (teacher): Spot the error back in Grammar ("its natural home"); Right or wrong renamed "SPAG: Right or Wrong".
// Reading games are for computers only, except the ones marked phone:true.
const GAMES = [
  // Match the meaning (31 Oct, teacher): Synonym groups merged in. The right-hand column mixes meanings and synonym groups
  // (a word with synonyms shows either). data-hide="syn" on a topic page keeps it to meanings only (Essentials).
  {key:'match',    form:'short', cat:'vocab',   name:'Match the meaning', blurb:'Pair each word with its meaning or with a group of words that mean something similar. Cleared pairs are replaced, so it keeps going.', items:()=>pick(S.words), min:6, run:()=>playMatch(matchMode())},
  // {key:'syn',      form:'short', cat:'vocab',   name:'Synonym groups',    blurb:'Match each word to a group of words with a similar meaning.', items:()=>pick(S.words).filter(w=>w.syn&&w.syn.length), min:6, run:()=>playMatch('syn')},
  {key:'meaning',  form:'short', cat:'vocab',   name:'Word or meaning',   blurb:'See a word and choose its meaning, or see a meaning and choose the word.', items:()=>pick(S.words), min:4, run:()=>playMeaning()},
  {key:'tf',       form:'short', cat:'vocab',   name:'True or false',     blurb:'Decide quickly whether each statement about the language is right.', items:()=>pick(S.tf), min:1, run:()=>playTF()},
  {key:'gap',      form:'short', cat:'grammar', name:'Fill the gap',      blurb:'Choose the word or form that fits the sentence.', items:()=>pick(S.gaps), min:1, run:()=>playGap()},
  {key:'rw',       form:'short', cat:'grammar', name:'SPAG: Right or Wrong',    blurb:'Read a sentence and decide: is it right, or does it have a mistake?', items:()=>pick(S.rw), min:1, run:()=>playRW()},
  {key:'error',    form:'long', cat:'grammar', phone:true, name:'Spot the error',    blurb:'Read a paragraph and tap every word with a grammar mistake.', items:()=>pick(S.errors), min:1, run:()=>playErr()},
  // passage: only on the Reading Comprehension pages (Close reading, Big idea), which give it their own name
  {key:'passage',  cat:'reading', name:'Read and answer',   blurb:'Read a passage, then choose the best answer to each question.', items:()=>pick(S.passages), min:1, run:()=>playPassage()},
  {key:'own',      form:'long', cat:'reading', name:'In your own words', blurb:'Paper 1 style: what does the writer mean by each underlined word, in context?', items:()=>pick(S.extracts), min:1, run:()=>playOwn()},
  {key:'read',     form:'long', cat:'reading', name:'Complete the text', blurb:'Read a short text and put the key words into the gaps.', items:()=>pick(S.reads), min:1, run:()=>playRead()},
  {key:'question', form:'long', cat:'reading', name:'Answer the question', blurb:'Read an exam question and choose the answer that does what it asks.', items:()=>pick(S.questions), min:1, run:()=>playQuestion()}
];
// A game that can't be played on this device: a Reading game on a phone (unless it is marked phone:true)
const phoneOff = g => PHONE && !!CATS[g.cat].desktop && !g.phone;
// Games switched off on this page: data-hide="syn" (a game's key; several with spaces or commas). Its content stays in the files.
const HIDE = new Set(String(CFG.hide||'').split(/[\s,]+/).filter(Boolean));
// Match the meaning: meanings and synonym groups mixed, unless this topic has no synonyms or hides them (data-hide="syn")
const matchMode = () => !HIDE.has('syn') && S.words.some(w=>w.syn&&w.syn.length) ? 'mix' : 'def';
// Only games this subject has content for (and has not switched off)
const gamesIn = cat => GAMES.filter(g => g.cat===cat && !HIDE.has(g.key) && (S[{match:'words',syn:'words',meaning:'words',gap:'gaps',build:'builds',error:'errors',tf:'tf',rw:'rw',own:'extracts',read:'reads',question:'questions',passage:'passages'}[g.key]]||[]).length && (g.key!=='syn' || S.words.some(w=>w.syn)));

// ---------- page frame ----------
function frame(back, inner){
  clearTimers(); keyHandler=null; circuitFinish=null; circuitStop=null; document.body.classList.remove('reading-wide');
  if(ttsStop){ ttsStop(); ttsStop=null; }   // Listening: stop the voice when the page moves on
  const bar = CFG.only==='progress' || !window.AEA_POINTS ? '' : `<div class="pts" data-points-bar="${SIDE}"></div>`;
  $app.innerHTML = `<div class="topline"><span class="navline"><a class="home-mark" href="${ROOT}index.html" aria-label="Academic English App: home" title="Home">${HOME_MARK}</a>${back?`<a class="back" href="${esc(back.href)}">← ${back.html||esc(back.label)}</a>`:''}</span>${bar}</div>${inner}`;
  if(bar) AEA_POINTS.render(SIDE, 0);
  window.scrollTo(0,0);
}
function go(hash){ if(location.hash===hash || (!hash && !location.hash)) route(); else location.hash=hash; }

// ---------- SUBJECT MENU ----------
// data-layout="compact" on a topic page (Descriptive language first, 24 Oct): no blurb, a one-line level under the level
// buttons with the level bar as the divider, and every game listed in three columns (Vocabulary, Grammar, Reading), so
// there is no category page in between. Without it, the page keeps the older layout below.
const COMPACT = CFG.layout==='compact';
function menu(){
  if(COMPACT) return menuCompact();
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
      const games = gamesIn(k), off = c.desktop && PHONE && games.every(phoneOff), here = games.filter(g=>!phoneOff(g) && g.items().length>=g.min);
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

function menuCompact(){
  tidyChoice();
  frame({href:CFG.back||'../index.html', label:CFG.backLabel||'Subjects'}, `
  <section class="hero hero-compact">
    <p class="eyebrow">English games</p>
    <h1>${esc(CFG.name||'')}</h1>
    ${levelsHtml()}
    ${levelLine()}
  </section>
  <div class="cols">
    ${Object.entries(CATS).map(([k,c])=>{
      const all=gamesIn(k), games=all.filter(g=>!phoneOff(g)), off=c.desktop && PHONE && !games.length;
      const note = off ? 'Only available on desktop devices'
        : k==='reading' && readingState==='failed' ? 'The reading passages could not be loaded. They load when the site is online.'
        : !all.length ? 'Coming soon' : '';
      // On a phone, a column with some computer-only games shows the others and says so underneath
      const rest = !off && games.length<all.length ? `<p class="col-note">The other ${c.name.toLowerCase()} games are only available on desktop devices.</p>` : '';
      return `<section class="col col-${k}${off?' off':''}" aria-labelledby="col-${k}"><h2 id="col-${k}">${c.name}</h2>
        ${note?`<p class="col-note">${note}</p>`:''}${off?'':games.map(gameCard).join('')}${rest}</section>`; }).join('')}
  </div>
  <div class="wl-link"><p>The word list has every word, its meaning and an example sentence.</p><a class="btn alt" href="#words">Open word list</a></div>`);
  wireLevels(menu);
}
// "Your level: Advanced" in small type, then the level bar, which is also the line between the levels and the games
function levelLine(){
  const t=P.topic(), n=t?t.n:0, zh=SIDE==='zh';   // the Chinese topic menus use it too (26 Oct), with the Chinese added
  if(n<P.CAL){ const left=P.CAL-n;
    return `<div class="lvl-line"><p class="lvl-k">${T('Your level','你的水平')}: <span class="lvl-now">${T('finding it','正在评估')}</span> <span class="lvl-more">(${T(`${left} more answer${left===1?'':'s'}`, `还需 ${left} 题`)})</span></p>
      <span class="lvl-bar lvl-divider" role="img" aria-label="Finding your level: ${n} of ${P.CAL} answers"><i style="width:${n*100/P.CAL}%"></i></span></div>`; }
  const L=P.label(t.r), tip=L.next?`${L.pct}% of the way to ${L.next}`:'Top level';
  return `<div class="lvl-line"><p class="lvl-k">${T('Your level','你的水平')}: <span class="lvl-now">${zh&&L.zh ? T(esc(L.name), L.zh) : esc(L.name)}</span></p>
    <span class="lvl-bar lvl-divider" role="img" aria-label="${esc(tip)}" title="${esc(tip)}"><i style="width:${L.pct}%"></i></span></div>`;
}
// One game on a menu: its name, what it is, and the student's best streak (greyed when the level has too few items)
function gameCard(g){
  const n=g.items().length, off=n<g.min, best=store.get('streak:'+g.key,0);
  return `<a class="game${off?' off':''}" ${off?'aria-disabled="true"':`href="#play-${g.key}"`}>
    <h3>${g.name}</h3><p>${g.blurb}</p>
    <span class="best">${off?(n?'Not enough at this level yet':'None at this level yet'):best?'Best streak: '+best:'Not played yet'}</span></a>`;
}

// ---------- CATEGORY: list of games ----------
function category(cat){
  if(COMPACT) return menu();
  const c=CATS[cat];
  if(c.desktop && PHONE && gamesIn(cat).every(phoneOff)){
    frame({href:'#', label:CFG.name||'Back'}, `<section class="hero"><p class="eyebrow">${esc(CFG.name||'')}</p><h1>${c.name}</h1>
      <p class="notice">Reading games are only available on desktop devices. Open this page on a computer to play them.</p></section>`);
    return;
  }
  const note = cat==='reading' && readingState==='loading' ? '<p class="notice">Loading reading passages…</p>' : cat==='reading' && readingState==='failed' ? '<p class="notice">The reading passages could not be loaded. They load when the site is online.</p>' : '';
  frame({href:'#', label:CFG.name||'Back'}, `
  <section class="hero"><p class="eyebrow">${esc(CFG.name||'')}${chosenBand()!=null?' · '+esc(bandName(chosenBand())):''}</p><h1>${c.name}</h1><p>${c.blurb}</p>${note}</section>
  <div class="games">${gamesIn(cat).filter(g=>!phoneOff(g)).map(gameCard).join('')}</div>`);
}

// ---------- game shell ----------
function shell(game, note){
  const c=CATS[game.cat];
  frame(CFG.only ? {href:CFG.back||'../index.html', label:CFG.backLabel||'Back'} : COMPACT ? {href:'#', label:CFG.name||'Back'} : {href:'#'+game.cat, label:c.name}, `<div class="bar"><span class="title">${game.name}</span><span class="spacer"></span><div class="stats" id="stats"></div></div>
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
  row.innerHTML=`<button class="btn">${label||T('Next','下一个')+' →'}</button>`; card.appendChild(row);
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
const fbOk = (fb, html) => fb.innerHTML=`<div class="feedback ok"><span class="verdict">${T('Correct.','答对了！')}</span>${html||''}</div>`;
const fbNo = (fb, answer, html) => fb.innerHTML=`<div class="feedback no"><span class="verdict">${T(`Not quite.${answer?` The answer is ${esc(answer)}.`:''}`, `不对。${answer?`答案是 ${esc(answer)}。`:''}`)}</span>${html||''}</div>`;
// After an answer: right → move on by itself; wrong → explain, wait, and bring the item back later.
function settle(ok, card, st, deck, item, next){
  if(ok){ st.hit(item); autoNext(card, next); } else { st.miss(item); deck.retry(item); manualNext(card, next); }
}

// ---------- VOCABULARY: Match the meaning / Synonym groups ----------
// mode: 'def' (meanings), 'syn' (synonym groups) or 'mix' (each word on the board shows one or the other, chosen as it is dealt)
function playMatch(mode, withZh){
  const game=withZh ? {key:'zhmatch', name:'Match the meaning', items:zhWords} : GAMES.find(g=>g.key===(mode==='syn'?'syn':'match'));
  const PER=5, REFILL_AT=3;
  const p=game.items(), deck=Deck(withZh ? zhWords : p), st=Stats(game.key);
  if(withZh) zhShell(T('Match the meaning','单词配释义'), T('Tap a word, then its English meaning. Matched pairs turn grey; after three, new pairs appear.','点击单词，再点击它的英文释义。配好的会变灰，配好三对后会出现新的单词。'));
  else shell(game, mode==='def'?'Tap a word, then its meaning. Matched pairs turn grey; after three, new pairs take their place.'
    : mode==='mix'?'Tap a word, then its meaning or the group of words that means something similar. Matched pairs turn grey; after three, new pairs take their place.'
    :'Tap a word, then the group that means something similar. Matched pairs turn grey; after three, new pairs take their place.');
  st.draw();
  const kind=new Map(), kindOf=w=>kind.get(w.id)||(mode==='syn'?'syn':'def');
  const synClash=(a,b)=>!!(a.syn&&b.syn&&a.syn.some(s=>b.syn.includes(s))) || !!(a.syn&&a.syn.includes(b.w)) || !!(b.syn&&b.syn.includes(a.w));
  const clash=(w,on)=>on.some(o=>o.id===w.id || areAlike(o.id,w.id) || o.w===w.w || (mode!=='def' && synClash(o,w)));
  const draw=(n,on)=>{ const out=[],skip=[]; let guard=0;
    while(out.length<n && guard++<400){ const w=deck.next(); if(clash(w,[...on,...out])) skip.push(w); else out.push(w); }
    skip.forEach(w=>deck.retry(w));
    if(mode==='mix') out.forEach(w=>kind.set(w.id, w.syn&&w.syn.length&&Math.random()<.5 ? 'syn' : 'def'));
    return out; };
  const right = w => kindOf(w)==='def' ? esc(w.def) : w.syn.map(s=>`<span>${esc(s)}</span>`).join('');
  const L=new Array(PER).fill(null), R=new Array(PER).fill(null);
  const first=draw(PER,[]); const lo=shuffle([...Array(PER).keys()]), ro=shuffle([...Array(PER).keys()]);
  first.forEach((w,i)=>{ L[lo[i]]=w; R[ro[i]]=w; });
  const card=showCard(`<p class="instr">${withZh||mode==='def'?'Match each word to its meaning':mode==='mix'?'Match each word to its meaning or its synonyms':'Match each word to its synonym group'}</p>
    <div class="match"><div class="col left">${L.map((_,i)=>`<button class="tile word" data-side="L" data-slot="${i}"></button>`).join('')}</div>
    <div class="col right">${R.map((_,i)=>`<button class="tile ${mode==='syn'?'syn':'def'}" data-side="R" data-slot="${i}"></button>`).join('')}</div></div>
    <p class="toast" id="toast" aria-live="polite"></p>`);
  const tiles=side=>[...card.querySelectorAll(`.tile[data-side="${side}"]`)];
  // Matched pairs stay on the board, greyed out. Once three pairs are greyed, those three are replaced together.
  const spentL=new Set(), spentR=new Set();
  const paint=fresh=>{
    tiles('L').forEach((t,i)=>{ const w=L[i], sp=spentL.has(i); t.className='tile word'+(w?'':' gone')+(sp?' spent':'')+(w&&fresh&&fresh.includes(w)?' fresh':''); t.innerHTML=w?esc(w.w)+(withZh&&ZH[w.id]?`<small class="tile-zh" lang="zh-CN">${esc(ZH[w.id])}</small>`:''):''; t.dataset.id=w?w.id:''; t.disabled=!w||sp; });
    tiles('R').forEach((t,i)=>{ const w=R[i], sp=spentR.has(i); t.className='tile '+(w?kindOf(w):'def')+(w?'':' gone')+(sp?' spent':'');  /* new meanings are not highlighted: that would give them away */ t.innerHTML=w?right(w):''; t.dataset.id=w?w.id:''; t.disabled=!w||sp; });
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
// Build the sentence: on the Chinese version since 25 Oct (off the English side). The Chinese sentence (builds.csv, zh column)
// is shown at the top; students build it in English from the coloured pieces, avoiding the trap pieces.
const ROLES_ZH={topic:'主语',verb:'动词',detail:'细节',link:'连接词',judge:'评价',hedge:'委婉语'};
function playBuild(){
  const game=ZH_GAMES.find(g=>g.key==='zhbuild'), items=zhBuilds(), deck=Deck(items), st=Stats('zhbuild');
  zhShell(T(game.name, game.zh), T('Tap the pieces in order. Tap a placed piece to send it back.','按顺序点击词块，点击已放好的词块可以退回。')); st.draw();
  const step=()=>{
    const b=deck.next();
    const pieces=shuffle([...b.tiles.map((t,i)=>({t:t[0],r:t[1],k:'t'+i})), ...(b.decoys||[]).map((t,i)=>({t:t[0],r:t[1],k:'d'+i,decoy:true}))]);
    const usedRoles=[...new Set(b.tiles.map(t=>t[1]))];
    const card=showCard(`<p class="instr">${T('Build this sentence in English','用英文组成这个句子')}</p>
      <p class="zh-sentence" lang="zh-CN">${esc(b.zh)}</p>
      <div class="answer" id="ans" aria-label="Your sentence"></div>
      <div class="pool" id="pool">${pieces.map(p=>`<button class="piece r-${p.r}" data-k="${p.k}">${esc(p.t)}</button>`).join('')}</div>
      <div class="rolekey">${usedRoles.map(r=>`<span class="r-${r}">${T(ROLES[r]||r, ROLES_ZH[r]||'')}</span>`).join('')}</div>
      <div class="next-row check-row"><button class="btn" id="check" disabled>${T('Check','检查')}</button></div><div class="fb"></div>`);
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
    // partial: the Daily Circuit's time is up. If the student has tapped anything, the paragraph is marked as it stands;
    // a paragraph they had not finished is not held against them (see partialCredit)
    const check=(partial)=>{
      if(checked || (partial && !marked.size)) return; checked=true;
      const errIdx=toks.map((t,i)=>t.err?i:-1).filter(i=>i>=0);
      // A missing word written only on the word after the gap ([stay|to stay|…]) also counts when the student taps the word
      // before it (and the other way round), since either word marks the gap. New content puts both words in the brackets.
      const near=i=>{ const t=toks[i], w=t.text.toLowerCase().trim(), r=t.err.right.toLowerCase().trim(), step=r.endsWith(' '+w) ? -1 : r.startsWith(w+' ') ? 1 : 0;
        if(!step) return -1;
        for(let j=i+step; j>=0 && j<toks.length; j+=step){ if(toks[j].punct) continue; return toks[j].err ? -1 : j; }
        return -1; };
      const viaNear=new Set(), hit=i=>{ if(marked.has(i)) return true; const j=near(i); if(j>=0 && marked.has(j)){ viaNear.add(j); return true; } return false; };
      const got=new Set(errIdx.filter(hit));
      const found=got.size, falseMarks=[...marked].filter(i=>!toks[i].err && !viaNear.has(i)).length;
      const ok=found===errIdx.length && falseMarks===0;
      card.querySelectorAll('.tok').forEach(b=>{ const i=+b.dataset.i, t=toks[i]; b.disabled=true; b.classList.remove('t-marked');
        if(t.err){ b.classList.add(got.has(i)?'t-found':'t-missed'); b.innerHTML=`<s>${esc(t.text)}</s> <ins>${esc(t.err.right)}</ins>`; }
        else if(viaNear.has(i)) b.classList.add('t-near');
        else if(marked.has(i)) b.classList.add('t-false'); });
      card.querySelector('.check-row').remove();
      const list=errIdx.map(i=>{ const t=toks[i]; return `<li class="${got.has(i)?'got':'miss'}"><span><s>${esc(t.text)}</s> → <b>${esc(t.err.right)}</b></span><span class="why">${esc(t.err.why)}</span></li>`; }).join('');
      const summary=`You found ${found} of ${errIdx.length}${falseMarks?` and marked ${falseMarks} correct word${falseMarks>1?'s':''} as wrong`:''}.`;
      card.querySelector('.fb').innerHTML=`<div class="feedback ${ok?'ok':'no'}"><span class="verdict">${ok?'All found.':summary}</span><ul class="errlist">${list}</ul></div>`;
      if(partial && !ok){ partialCredit('error', it, found, falseMarks, errIdx.length); return; }
      settle(ok,card,st,deck,it,step);
    };
    btn.onclick=()=>check(); keyHandler=e=>{ if(e.key==='Enter'){ e.preventDefault(); check(); } };
    circuitFinish=()=>check(true);
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

// ---------- GRAMMAR: Right or wrong (right-wrong.csv) ----------
function playRW(){
  const game=GAMES.find(g=>g.key==='rw'), items=game.items(), deck=Deck(items), st=Stats('rw');
  shell(game,'Press R or W on a keyboard, or tap.'); st.draw();
  const step=()=>{
    const t=deck.next();
    const card=showCard(`<p class="instr">Right or wrong?</p><p class="statement">${esc(t.s)}</p>
      <div class="tf-btns"><button class="tfb yes" data-v="1">Right</button><button class="tfb no" data-v="0">Wrong</button></div><div class="fb"></div>`);
    let done=false;
    const choose=v=>{ if(done) return; done=true; const ok=(v===1)===t.ok;
      card.querySelectorAll('.tfb').forEach(b=>{ b.disabled=true; if(+b.dataset.v===(t.ok?1:0)) b.classList.add('ok'); else b.classList.add('dim'); });
      const more=(!t.ok && t.fix ? `<span class="rw-fix">Correct: <b>${esc(t.fix)}</b></span>` : '')+(t.why?`<span>${rich(t.why)}</span>`:'');
      const fb=card.querySelector('.fb'); ok?fbOk(fb,more):fbNo(fb,'',`<span>The sentence is <b>${t.ok?'right':'wrong'}</b>.</span>${more}`);
      settle(ok,card,st,deck,t,step); };
    card.querySelectorAll('.tfb').forEach(b=>b.onclick=()=>choose(+b.dataset.v));
    keyHandler=e=>{ const k=e.key.toLowerCase(); if(k==='r'||k==='1') choose(1); if(k==='w'||k==='2') choose(0); };
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
  // Complete the text (key 'read', so best streaks and progress carry on from the old Read it).
  // The text's [[key words]] become gaps; the word bank under it has those words (as they appear in the text) and the
  // text's own extra words (extra1–extra3), if it has any. Tap a word to put it in the selected gap (or the first empty one),
  // tap a filled gap to take the word back. Check marks every gap: each counts as one answer for the key word it tests.
  const game=GAMES.find(g=>g.key==='read'), items=game.items(), deck=Deck(items), st=Stats('read');
  shell(game,'Tap a word to put it in the next gap. Tap a filled gap to take the word out. Then press Check.'); st.draw();
  const step=()=>{
    const r=deck.next(), gaps=[], parts=[];
    let last=0; const re=/\[\[([^|\]]+)\|([^\]]*)\]\]/g, m0=r.text; let m;   // [[shown|word id]]: the id is empty for a word not in words.csv
    while((m=re.exec(m0))){ const before=m0.slice(0, m.index), cap=/(^|[.!?]["”’)]?\s+)$/.test(before) && /^[A-Z][a-z]/.test(m[1]);
      parts.push(esc(m0.slice(last, m.index))); parts.push({i:gaps.length}); gaps.push({ans:m[1], show:cap ? m[1][0].toLowerCase()+m[1].slice(1) : m[1], cap, id:m[2]}); last=re.lastIndex; }
    const inGap=(i,t)=>gaps[i].cap ? t[0].toUpperCase()+t.slice(1) : t;
    parts.push(esc(m0.slice(last)));
    // Extra words: only the text's own (extra1–extra3), so the writer decides how many (none is fine, e.g. at the easiest
    // levels). The game never adds words of its own. An extra word that is already one of the gaps is left out.
    const lc=x=>x.toLowerCase(), answers=new Set(gaps.map(g=>lc(g.ans)));
    const extra=[...new Set((r.extras||[]).filter(x=>!answers.has(lc(x)) && !gaps.some(g=>lc(g.show)===lc(x))))];
    const bank=shuffle([...gaps.map(g=>g.show), ...extra]).map((t,i)=>({t, i, used:false}));
    const filled=gaps.map(()=>null); let sel=0, checked=false;
    const card=showCard(`<p class="instr">${esc(r.title||'Complete the text')}</p>
      <div class="readtext ctext">${parts.map(p=>typeof p==='string'?p:`<button class="gapslot" type="button" data-i="${p.i}"></button>`).join('')}</div>
      <p class="peek" id="peek"></p>
      <div class="bank" role="group" aria-label="Word bank">${bank.map(x=>`<button class="bank-w" type="button" data-b="${x.i}"><kbd>${x.i+1}</kbd><span>${esc(x.t)}</span></button>`).join('')}</div>
      <div class="next-row"><button class="btn" id="ctCheck" disabled>Check</button></div><div class="fb"></div>`);
    card.classList.add('ct-card');
    const slots=[...card.querySelectorAll('.gapslot')], chips=[...card.querySelectorAll('.bank-w')], check=card.querySelector('#ctCheck');
    const firstEmpty=()=>filled.findIndex(x=>x==null);
    const draw=()=>{
      if(!checked) slots.forEach((s,i)=>{ const f=filled[i]; s.textContent=f==null?'':inGap(i, bank[f].t); s.classList.toggle('full', f!=null); s.classList.toggle('sel', !checked && i===sel && f==null);
        s.setAttribute('aria-label', `Gap ${i+1}${f==null?', empty':': '+bank[f].t}`); });
      chips.forEach(c=>{ const x=bank[+c.dataset.b]; c.disabled=checked || x.used; c.classList.toggle('used', x.used); });
      check.disabled=checked || firstEmpty()!==-1;
    };
    const put=bi=>{ const x=bank[bi]; if(checked || x.used) return;
      let g=(filled[sel]==null) ? sel : firstEmpty(); if(g===-1) return;
      filled[g]=bi; x.used=true; const nx=firstEmpty(); sel=nx===-1?g:nx; draw();
      if(firstEmpty()===-1) check.focus({preventScroll:true}); };
    const takeOut=i=>{ if(checked) return; const f=filled[i]; if(f!=null){ bank[f].used=false; filled[i]=null; } sel=i; draw(); };
    chips.forEach(c=>c.onclick=()=>put(+c.dataset.b));
    slots.forEach(s=>s.onclick=()=>{ const i=+s.dataset.i;
      if(checked){ const w=byId[gaps[i].id]; card.querySelector('#peek').innerHTML=w?`<b>${esc(w.w)}</b>: ${esc(w.def)}`:`<b>${esc(gaps[i].ans)}</b>`; return; }
      takeOut(i); });
    // partial: the Daily Circuit's time is up. The gaps the student has filled are marked (each is one answer, as usual);
    // empty gaps just show their word and are not counted
    const doCheck=(partial)=>{ if(checked || (!partial && firstEmpty()!==-1) || (partial && filled.every(x=>x==null))) return; checked=true; card.classList.add('done'); let got=0;
      gaps.forEach((g,i)=>{ const s=slots[i];
        if(filled[i]==null){ s.classList.add('no'); s.textContent=g.ans; return; }
        const right=lc(bank[filled[i]].t)===lc(g.ans), item={id:r.id+'#'+(i+1), level:r.level, wid:g.id, qs:gaps.length};
        if(right){ got++; s.classList.add('ok'); st.hit(item); }
        else { s.classList.add('no'); s.innerHTML=`<s>${esc(inGap(i, bank[filled[i]].t))}</s> ${esc(g.ans)}`; st.miss(item); } });
      draw(); check.parentNode.remove();
      card.querySelector('#peek').textContent='Tap a word in the text to see what it means.';
      const fb=card.querySelector('.fb'), n=gaps.length;
      const notes=gaps.filter((g,i)=>filled[i]==null || lc(bank[filled[i]].t)!==lc(g.ans)).map(g=>wordNote(byId[g.id])).join('');
      if(got===n) fbOk(fb, `<span>All ${n} gaps right.</span>`);
      else { fb.innerHTML=`<div class="feedback no"><span class="verdict">${got} of ${n} right.</span><span>The right words are shown in the text.</span>${notes}</div>`; deck.retry(r); }
      manualNext(card, step, 'Next text →'); };
    check.onclick=()=>doCheck();
    circuitFinish=()=>doCheck(true);
    keyHandler=e=>{ if(checked) return; const k=parseInt(e.key,10);
      if(k>=1 && k<=bank.length){ e.preventDefault(); put(k-1); }
      else if(e.key==='Backspace'){ e.preventDefault(); const lastF=[...filled.keys()].filter(i=>filled[i]!=null).pop(); if(lastF!=null) takeOut(lastF); }
      else if(e.key==='Enter'){ e.preventDefault(); doCheck(); } };
    draw();
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

// ---------- READING: a passage and its questions (the Reading Comprehension pages: Close reading, Big idea; passages from the file in data-reading) ----------
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

// ---------- LISTENING (en/listening/, data-format="listening", built 26 Oct) ----------
// A test is a script the student never sees while answering. The browser's own voice reads it aloud (speechSynthesis:
// no audio files, nothing to upload) and the student answers multiple-choice questions on what they heard.
// File (data-reading): the reading columns, id, level, title, passage (= the script), question, correct, wrong1-3,
// explanation, source, then question2, correct2, wrong1_2… for more questions. Optional quote, quote2…: the words in the
// script that give each answer; they are marked when the script is shown after Check.
// Speakers: a line that starts with a name and a colon ("Anna: …") is spoken by that person, and each person gets a
// different voice when the device has more than one English voice. Voices take turns: the first speaker a woman's voice,
// the next a man's, and so on, unless the name starts with Mr / Ms / Mrs / Miss (then it follows the title). Lines
// without a name are read in the main voice (the first speaker's). Blank line = new paragraph.
// The student can play the recording as often as they like (teacher, 26 Oct), pause, start again, slow it down and choose
// the voice (kept in aea:voice and aea:voice-rate). Levels: a row of level buttons at the top (aea:listen-level).
// Works on phones too (unlike the reading games). Browsers only allow speech after the student has tapped the page:
// the Play button is that tap.
const TTS_OK = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
let ttsStop = null;   // stops the voice when the page moves on (called by frame())
const ttsVoices = () => TTS_OK ? speechSynthesis.getVoices().filter(v=>/^en([-_]|$)/i.test(v.lang||'')) : [];
const ttsLoad = (()=>{ let p=null; return ()=> p || (p=new Promise(res=>{
  if(!TTS_OK) return res([]); if(ttsVoices().length) return res(ttsVoices());
  let done=false; const fin=()=>{ if(!done){ done=true; res(ttsVoices()); } };
  speechSynthesis.addEventListener('voiceschanged', fin); setTimeout(fin, 2000); })); })();
if(TTS_OK && CFG.format==='listening') ttsLoad();   // the voices load in the background while the page opens
const V_FEMALE=/\b(sonia|libby|maisie|hollie|bella|abbi|olivia|mia|aria|jenny|michelle|emma|ava|natasha|clara|serena|kate|stephanie|martha|hazel|susan|moira|karen|samantha|tessa|fiona|zira|catherine|emily|female)\b/i;
const V_MALE=/\b(ryan|thomas|alfie|elliot|ethan|noah|oliver|guy|davis|andrew|brian|christopher|eric|roger|steffan|william|daniel|arthur|george|james|david|mark|aaron|fred|gordon|lee|alex|rishi|tom|male)\b/i;
const vSex = v => V_FEMALE.test(v.name) ? 'f' : V_MALE.test(v.name) ? 'm' : '';
// Best first: the natural / neural / premium voices, British English, then other English
const vScore = v => (/natural|neural|online|premium|enhanced/i.test(v.name)?6:0) + (/^en[-_]gb/i.test(v.lang)?3:/^en[-_](ie|au|nz)/i.test(v.lang)?1.5:/^en[-_]us/i.test(v.lang)?1:0)
  + (/google/i.test(v.name)?1:0) + (vSex(v)?.5:0);
const vRanked = () => ttsVoices().sort((a,b)=>vScore(b)-vScore(a));
// The script as a list of spoken pieces: one sentence each, with who says it and the pause after it
function ttsScript(text){
  const segs=[], speakers=[], paras=String(text||'').split(/\n\s*\n|\s*\|\|\s*/);
  paras.forEach((para, pi)=>{ let who=null;
    para.split(/\n/).map(l=>l.trim()).filter(Boolean).forEach(line=>{
      const m=line.match(/^([A-Z][A-Za-z.'’ -]{0,24}):\s+(.+)$/);
      if(m){ who=m[1].trim(); line=m[2]; if(!speakers.includes(who)) speakers.push(who); }
      const safe=line.replace(/\b(Mr|Mrs|Ms|Dr|St|Prof)\./g, '$1․');
      const sents=(safe.match(/[^.!?]+[.!?]+["”’)]*\s*|[^.!?]+$/g)||[safe]).map(s=>s.replace(/․/g,'.').trim()).filter(Boolean);
      sents.forEach((s,k)=>segs.push({who, text:s, line:segs.length && k===0, para:pi, gap:k===sents.length-1 ? 650 : 280})); });
    if(segs.length) segs[segs.length-1].gap=900; });
  return {segs, speakers};
}
// A voice for each speaker. The student's chosen voice (if any) goes to the first speaker; otherwise the best voice of the
// sex wanted. Wanted: the title (Mr → man; Ms, Mrs, Miss → woman), otherwise turn about, starting with a woman.
const spkSex = n => /^(mr|sir)\b/i.test(n) ? 'm' : /^(ms|mrs|miss|madam|lady)\b/i.test(n) ? 'f' : '';
function ttsCast(speakers, chosenName){
  const list=vRanked(); if(!list.length) return ()=>null;
  const chosen=list.find(v=>v.name===chosenName), cast=[], want=[], n=Math.max(1, speakers.length);
  for(let i=0;i<n;i++){
    want[i]=spkSex(speakers[i]||'') || (i===0 ? (chosen && vSex(chosen)) || 'f' : want[i-1]==='f' ? 'm' : 'f');
    const pick=(i===0 && chosen) || list.find(v=>!cast.includes(v) && vSex(v)===want[i]) || list.find(v=>!cast.includes(v)) || cast[0] || list[0];
    cast.push(pick); }
  return who=>{ const i=speakers.indexOf(who); return cast[i<0 ? 0 : i]; };
}
const lNorm = s => String(s||'').toLowerCase().replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[^a-z0-9' ]+/g,' ').replace(/\s+/g,' ').trim();
const LISTEN_LV='aea:listen-level';
function playListening(){
  const st=Stats('listen'), game={key:'listen', name:CFG.name||'Listening', cat:'reading'};
  const all=S.passages||[], names=Object.values(LEVEL_NAMES), have=names.filter(n=>all.some(r=>levelName(r.level)===n));
  let choice=null; try{ choice=localStorage.getItem(LISTEN_LV); }catch(e){}
  if(choice!==ALL_LEVELS && !have.includes(choice)){ const r=P.overall(), mine=r==null ? null : levelName(Math.max(1,Math.min(5,Math.floor(r)))); choice=have.includes(mine) ? mine : ALL_LEVELS; }
  shell(game, '');
  const items=choice===ALL_LEVELS ? all : all.filter(r=>levelName(r.level)===choice), feed=document.getElementById('feed');
  feed.insertAdjacentHTML('beforebegin', `${have.length>1 ? `<div class="sets levels listen-levels" role="group" aria-label="Level">${[ALL_LEVELS, ...have].map(n=>`<button class="chip" data-lv="${esc(n)}" aria-pressed="${n===choice}">${esc(n)}</button>`).join('')}</div>` : ''}
    <p class="hint">${items.length} test${items.length===1?'':'s'}${choice!==ALL_LEVELS?` at ${esc(choice)}`:''}. Read the questions, then press Play. You can listen as many times as you like.</p>`);
  document.querySelectorAll('.listen-levels .chip').forEach(b=>b.onclick=()=>{ try{ localStorage.setItem(LISTEN_LV, b.dataset.lv); }catch(e){} playListening(); });
  st.draw();
  if(!TTS_OK){ feed.innerHTML='<p class="notice">This browser can’t read text aloud. Try Microsoft Edge, Google Chrome or Safari.</p>'; return; }
  if(!items.length){ feed.innerHTML=`<p class="notice">There are no ${esc(choice)} listening tests yet. Choose another level above.</p>`; return; }
  const deck=Deck(items);
  let rate=1; try{ rate=+localStorage.getItem('aea:voice-rate')||1; }catch(e){}
  const step=()=>{
    if(ttsStop){ ttsStop(); ttsStop=null; }
    const r=deck.next(), {segs, speakers}=ttsScript(r.text), n=r.qs.length;
    const qs=r.qs.map(q=>({...q, order:shuffle([0,1,2,3])})), picked=qs.map(()=>null);
    const card=showCard(`<p class="instr">${esc(r.title)}${r.level?` · ${esc(levelName(r.level))}`:''}${speakers.length>1?` · ${speakers.length} speakers`:''}</p>
      <div class="lp" role="group" aria-label="Recording">
        <button class="btn lp-play" id="lpPlay" type="button"><span class="lp-ico" aria-hidden="true">▶</span> <span id="lpLabel">Play</span></button>
        <button class="btn alt lp-restart" id="lpRestart" type="button" disabled>↺ Start again</button>
        <span class="lp-bar" aria-hidden="true"><i id="lpFill"></i></span>
        <span class="lp-n" id="lpN">Not played yet</span>
      </div>
      <div class="lp-opts"><span class="lp-k">Speed</span><span class="lp-seg" role="group" aria-label="Speed"><button type="button" data-rate="1" aria-pressed="${rate>=1}">Normal</button><button type="button" data-rate="0.85" aria-pressed="${rate<1}">Slower</button></span>
        <label class="lp-k" for="lpVoice">Voice</label><select id="lpVoice"><option value="">Best available</option></select></div>
      <ol class="lq">${qs.map((q,i)=>`<li class="lq-item" data-i="${i}"><p class="question">${esc(q.q)}</p>
        <div class="opts long">${q.order.map((k,j)=>`<button class="opt" type="button" data-k="${k}" aria-pressed="false"><kbd>${'ABCD'[j]}</kbd><span>${esc(q.opts[k])}</span></button>`).join('')}</div><div class="lq-why"></div></li>`).join('')}</ol>
      <div class="next-row check-row"><span class="pick-n" id="pickN">0 of ${n} answered</span><button class="btn" id="check" disabled>Check</button></div><div class="fb"></div>
      <div class="lscript" id="lScript" hidden></div>`);
    card.classList.add('listen-card');
    // ----- the player -----
    const playB=card.querySelector('#lpPlay'), label=card.querySelector('#lpLabel'), ico=card.querySelector('.lp-ico'), again=card.querySelector('#lpRestart');
    const fill=card.querySelector('#lpFill'), count=card.querySelector('#lpN'), vsel=card.querySelector('#lpVoice');
    let idx=0, playing=false, run=0, plays=0, cur=null, chosen=''; try{ chosen=localStorage.getItem('aea:voice')||''; }catch(e){}
    let voiceOf=ttsCast(speakers, chosen);
    const fillVoices=()=>{ const list=vRanked(); if(!list.length) return;
      vsel.innerHTML='<option value="">Best available</option>'+list.map(v=>`<option value="${esc(v.name)}"${v.name===chosen?' selected':''}>${esc(v.name.replace(/^Microsoft\s+|\s*-\s*English.*$|\s*\(.*?\)\s*$/g,''))} (${esc((v.lang||'').replace('_','-'))})</option>`).join('');
      voiceOf=ttsCast(speakers, chosen); };
    ttsLoad().then(()=>{ if(document.body.contains(card)) fillVoices(); });
    const show=()=>{ label.textContent=playing ? 'Pause' : idx>0 ? 'Carry on' : plays ? 'Play again' : 'Play'; ico.textContent=playing ? '❚❚' : '▶';
      playB.setAttribute('aria-pressed', playing); again.disabled=!plays && !idx && !playing;
      fill.style.width=(segs.length ? 100*idx/segs.length : 0)+'%';
      count.textContent=playing ? 'Playing…' : plays ? `Played ${plays} time${plays===1?'':'s'}` : idx ? 'Paused' : 'Not played yet';
      card.querySelectorAll('.lscript .seg.now').forEach(s=>s.classList.remove('now'));
      if(playing){ const s=card.querySelector(`.lscript .seg[data-s="${idx}"]`); if(s) s.classList.add('now'); } };
    const sayFrom=i=>{ const my=run;
      if(i>=segs.length){ playing=false; idx=0; plays++; show(); return; }
      idx=i; show();
      const s=segs[i], u=new SpeechSynthesisUtterance(s.text), v=voiceOf(s.who);
      if(v){ u.voice=v; u.lang=v.lang; } else u.lang='en-GB';
      u.rate=rate; cur=u;   // kept, so the browser doesn't drop the utterance before it ends
      const next=()=>{ if(my!==run || !playing) return; later(()=>{ if(my===run && playing) sayFrom(i+1); }, s.gap); };
      u.onend=next; u.onerror=e=>{ if(e && (e.error==='interrupted' || e.error==='canceled')) return; next(); };
      speechSynthesis.speak(u); };
    const stop=()=>{ run++; playing=false; try{ speechSynthesis.cancel(); }catch(e){} };
    const play=()=>{ if(playing){ stop(); show(); return; }   // Pause: the sentence it stopped in is read again on Carry on
      stop(); playing=true; sayFrom(idx); };
    playB.onclick=play;
    again.onclick=()=>{ stop(); idx=0; playing=true; later(()=>sayFrom(0), 60); };
    card.querySelectorAll('.lp-seg button').forEach(b=>b.onclick=()=>{ rate=+b.dataset.rate; try{ localStorage.setItem('aea:voice-rate', String(rate)); }catch(e){}
      card.querySelectorAll('.lp-seg button').forEach(x=>x.setAttribute('aria-pressed', x===b)); if(playing){ stop(); playing=true; sayFrom(idx); } });
    vsel.onchange=()=>{ chosen=vsel.value; try{ localStorage.setItem('aea:voice', chosen); }catch(e){} voiceOf=ttsCast(speakers, chosen); if(playing){ stop(); playing=true; sayFrom(idx); } };
    ttsStop=()=>{ stop(); };
    const onHide=()=>{ if(!document.body.contains(card)){ document.removeEventListener('visibilitychange', onHide); return; } if(document.hidden && playing){ stop(); show(); } };
    document.addEventListener('visibilitychange', onHide);
    // ----- the questions -----
    const chk=card.querySelector('#check'), pn=card.querySelector('#pickN'); let done=false;
    card.querySelectorAll('.lq-item').forEach(li=>{ const i=+li.dataset.i;
      li.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{ if(done) return; picked[i]=+b.dataset.k;
        li.querySelectorAll('.opt').forEach(x=>x.setAttribute('aria-pressed', x===b));
        const k=picked.filter(x=>x!=null).length; pn.textContent=`${k} of ${n} answered`; chk.disabled=k<n; }); });
    const check=()=>{ if(done || picked.some(x=>x==null)) return; done=true; card.querySelector('.check-row').remove();
      let got=0;
      qs.forEach((q,i)=>{ const li=card.querySelector(`.lq-item[data-i="${i}"]`), ok=picked[i]===0, item={id:r.id+(i?'#'+(i+1):''), level:r.level, qs:n};
        li.querySelectorAll('.opt').forEach(b=>{ const k=+b.dataset.k; b.disabled=true; b.classList.add(k===0 ? 'ok' : k===picked[i] ? 'no' : 'dim'); });
        li.classList.add(ok?'lq-ok':'lq-no');
        li.querySelector('.lq-why').innerHTML=(ok?'':`<p><b>The answer is:</b> ${esc(q.opts[0])}</p>`)+(q.why?`<p>${rich(q.why)}</p>`:'')+(q.quote?`<p class="lq-q"><span>${i+1}</span> is marked in the script below.</p>`:'');
        if(ok){ got++; st.hit(item); } else st.miss(item); });
      if(got<n) deck.retry(r);
      const fb=card.querySelector('.fb');
      fb.innerHTML=`<div class="done-msg${got===n?' all':''}">${got===n ? `<b>Well done!</b> ${n===2?'You got both questions right.':n>2?`You got all ${n} questions right.`:'You got it right.'}`
        : `You got ${got} of ${n} right. Read the script below and listen again. This test will come back later.`}</div>`;
      // The script: each sentence in its own span (so the one being read is lit up during playback), answers marked
      const marks=segs.map(()=>[]);
      qs.forEach((q,i)=>{ const Q=lNorm(q.quote); if(!Q) return;
        segs.forEach((s,k)=>{ const T2=lNorm(s.text); if(T2 && (T2.includes(Q) || Q.includes(T2))) marks[k].push(i+1); }); });
      let html='', lastPara=-1;
      segs.forEach((s,k)=>{ if(s.para!==lastPara){ if(lastPara>=0) html+='</p>'; html+='<p>'; lastPara=s.para; }
        else if(s.line) html+='<br>';
        if((s.line || k===0 || segs[k-1].para!==s.para) && s.who) html+=`<b class="spk">${esc(s.who)}:</b> `;
        html+=`<span class="seg${marks[k].length?' q-mark':''}" data-s="${k}">${marks[k].map(m=>`<sup class="q-n">${m}</sup>`).join('')}${esc(s.text)}</span> `; });
      if(lastPara>=0) html+='</p>';
      const box=card.querySelector('#lScript'); box.innerHTML=`<p class="instr">The script</p><p class="lscript-note">Press Play to listen again and follow the words.</p><div class="passage">${html}</div>`; box.hidden=false;
      manualNext(card, step, 'Next test →'); };
    chk.onclick=check;
    keyHandler=e=>{ if(e.target && /^(SELECT|INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
      if(e.key==='p' || e.key==='P'){ e.preventDefault(); play(); } else if(e.key==='Enter' && !done){ e.preventDefault(); check(); } };
    show();
  };
  step();
}

// Daily Circuit, time up with a long task half done: each part the student got right counts as a right answer at this
// station, with its share of the task's points; each wrong part counts as an answer. Nothing is recorded against their
// level or their words, because they simply ran out of time.
function partialCredit(game, item, right, wrong, parts){
  if(!inCircuit || !(classRun || window.AEA_CIRCUIT)) return;
  const n=itemLevel(item), band=n==null ? 3 : Math.max(1, Math.min(5, Math.floor(n))), per=Math.ceil(POINTS[POINT_KIND[game]||'word'][band-1]/Math.max(1,parts));
  const tally=(ok, pts)=>{ if(classRun) classCount(ok); else AEA_CIRCUIT.count(PAGE, ok, pts); };   // a class game: +1 / -1
  for(let k=0;k<right;k++){ tally(true, per); if(window.AEA_POINTS) AEA_POINTS.record(SIDE, per, true); }
  for(let k=0;k<wrong;k++) tally(false, 0);
}

// ---------- ARCADE GAMES: the "proper game" in the middle of the Daily Circuit (Word Snake first, 25 Oct) ----------
// Every arcade game asks the same question: a meaning at the top, and the student goes for its word among a few on the
// board. The words are this topic's, at the student's level. The first go at each meaning is recorded like any other
// answer (word points, word stages, level). A game lasts one minute and never ends early: a mistake costs length or
// points, not the game. Not on the topic menus yet: open one by adding #play-snake, #play-whack or #play-invaders to an English topic page's address.
const ARCADE = [
  {key:'snake', name:'Word Snake', blurb:'Steer the snake into the word that matches the meaning.', items:()=>pick(S.words), min:6, run:()=>playSnake()},
  {key:'whack', name:'Whack-a-word', zh:'单词打地鼠', blurb:'Words pop up and drop again. Tap the one that matches the meaning before it goes.', items:()=>pick(S.words), min:6, run:()=>playWhack()},
  {key:'invaders', name:'Word Invaders', zh:'单词入侵者', blurb:'The words come down in formation. Fire at the one that matches the meaning before they land.', items:()=>pick(S.words), min:6, run:()=>playInvaders()}
];
// The shared question: the word to find, and the words on the board with it (the same part of speech where possible,
// never two that are alike). Same choice of wrong answers as Word or meaning.
// Chinese side (Daily Circuit, 26 Oct): the word to find comes from all the words at the chosen level, like the other Chinese games,
// and the meaning at the top has its Chinese under it (arcadeDef).
function arcadeQuestions(n){
  const zh=SIDE==='zh', p=zh ? zhWords() : pick(S.words), deck=Deck(p), pool=zh ? zhPool(p) : p.length>=8 ? p : S.words;
  return ()=>{ const w=deck.next(); return {w, words:[w, ...distractors(w, pool, n-1)], retry:()=>deck.retry(w)}; };
}
const arcadeName = g => SIDE==='zh' && g.zh ? T(g.name, g.zh) : g.name;
function arcadeDef(el, w){ if(!el) return; el.textContent=w.def;
  if(SIDE==='zh' && ZH[w.id]){ const z=document.createElement('span'); z.className='arcade-zh'; z.lang='zh-CN'; z.textContent=ZH[w.id]; el.appendChild(z); } }
// A long word or phrase gets smaller type so it fits on its card (the word cards in Whack-a-word and Word Invaders)
function fitLabel(box, span){ span.style.fontSize=''; let px=parseFloat(getComputedStyle(span).fontSize)||16;
  while(px>11 && (span.scrollWidth>box.clientWidth-10 || span.scrollHeight>box.clientHeight-6)){ px--; span.style.fontSize=px+'px'; } }
// Time's up (outside the circuit): score, best score and the words to practise
function arcadeEnd(game, score, missed, again){
  clearTimers(); keyHandler=null; document.querySelector('.timer')?.remove();
  const prev=store.get('best:'+game.key,0), isBest=score>prev; if(isBest) store.set('best:'+game.key,score);
  const list=[...new Map(missed.map(w=>[w.id,w])).values()];
  const card=showCard(`<div class="end"><p class="instr">${esc(game.name)} · time's up</p>
    <div class="big">${score}</div><p class="end-sub">${score===1?'word':'words'} found</p>
    <h2>${isBest ? 'New best score!' : 'Best score: '+Math.max(prev,score)}</h2>
    ${list.length?`<p class="instr" style="margin-top:22px">Words to practise</p><ul class="review">${list.map(w=>`<li><b>${esc(w.w)}</b> – ${esc(w.def)}</li>`).join('')}</ul>`:''}
    <div class="end-actions"><button class="btn" id="again">Play again</button><a class="btn alt" href="#">All games</a></div></div>`);
  card.querySelector('#again').onclick=again;
  keyHandler=e=>{ if(e.key==='Enter'){ e.preventDefault(); again(); } };
}

// ----- Word Snake -----
// The board is a grid (24 x 14 on computers, 14 x 14 on phones). The words sit on it as labels; steer the snake's head
// into the one that matches the meaning. Right: the snake grows and speeds up a little, and a new meaning appears.
// Wrong: the snake loses two pieces and the word's own meaning is shown. The walls let the snake through, and running
// into its own tail just bites that part off. Computers: arrow keys or WASD. Phones: swipe on the board, or the arrows.
function playSnake(){
  const game=ARCADE.find(g=>g.key==='snake'), SECS=60;
  const touch=PHONE || !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
  const COLS=PHONE?14:24, ROWS=14, N=PHONE?3:4;
  const nextQ=arcadeQuestions(N), best=store.get('best:snake',0);
  let score=0; const missed=[];
  frame({href:'#', label:CFG.name||'Back'}, `<div class="bar"><span class="title">${game.name}</span><span class="spacer"></span><div class="stats" id="stats"></div></div>
    <p class="hint">${PHONE?'Swipe on the board or tap the arrows to steer into the right word. Wrong words make the snake shorter.':`${touch?'Swipe on the board (or use the arrows)':'Use the arrow keys or WASD'} to steer into the word that matches the meaning. A wrong word makes the snake shorter. You can go through the walls.`}</p>
    ${inCircuit?'':timerBar()}<div class="feed" id="feed"></div>`);
  const stats=()=>{ const el=document.getElementById('stats'); if(el) el.innerHTML=`<span>Found <b>${score}</b></span>${inCircuit?'':`<span><b id="snSecs">${SECS}</b>s</span>`}<span>Best <b>${Math.max(best,score)}</b></span>`; };
  const card=showCard(`<p class="instr">Find the word that means</p><p class="arcade-def" id="snDef"></p>
    <div class="snake-board" id="snBoard"><canvas id="snCanvas" role="img" aria-label="Word Snake board"></canvas><p class="snake-msg" id="snMsg">${touch?'Swipe to start':'Press an arrow key to start'}</p></div>
    <p class="toast arcade-toast" id="toast" aria-live="polite"></p>
    ${touch?`<div class="snake-pad">${[['up','▲'],['left','◀'],['right','▶'],['down','▼']].map(([d,s])=>`<button type="button" class="pad-${d}" data-d="${d}" aria-label="${d}">${s}</button>`).join('')}</div>`:''}`);
  card.classList.add('arcade-card');
  const box=card.querySelector('#snBoard'), cv=card.querySelector('#snCanvas'), cx=cv.getContext('2d'), msg=card.querySelector('#snMsg');
  const alive=()=>document.body.contains(cv);   // false once the student has moved on to another page or game

  // Colours come from the page's own palette, so the board follows light and dark mode
  let col={}, cell=20, fontPx=14;
  const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const colours=()=>{ col={paper:css('--paper'), sheet:css('--sheet'), ink:css('--ink'), rule:css('--rule'), mark:css('--mark'), good:css('--good'), goodSoft:css('--good-soft'), bad:css('--bad'), badSoft:css('--bad-soft'), font:css('--f-body')||'sans-serif'}; };
  const font=px=>`700 ${px}px ${col.font}`;
  // The board fills the card's width, but stays short enough for the meaning, the board (and the arrows) to fit on the screen together
  const size=()=>{ const dpr=window.devicePixelRatio||1, fitH=Math.floor((window.innerHeight-(touch?360:240))/ROWS);
    cell=Math.max(12, Math.min(Math.floor(box.clientWidth/COLS), fitH));
    cv.style.width=cell*COLS+'px'; cv.style.height=cell*ROWS+'px'; cv.width=Math.round(cell*COLS*dpr); cv.height=Math.round(cell*ROWS*dpr);
    cx.setTransform(dpr,0,0,dpr,0,0); fontPx=Math.max(11, Math.min(16, Math.round(cell*(PHONE?0.58:0.5)))); };

  // A word's label: how many cells wide it is. A long phrase goes on two lines (split at the space nearest the middle).
  const layout=w=>{ cx.font=font(fontPx); const pad=cell*0.9, widest=Math.floor(COLS*(PHONE?0.65:0.42));
    const one=Math.ceil((cx.measureText(w.w).width+pad)/cell);
    if(one<=widest || !/\s/.test(w.w)) return {lines:[w.w], len:Math.min(one, COLS-2), h:1};
    const spaces=[...w.w.matchAll(/\s/g)].map(m=>m.index), mid=w.w.length/2, at=spaces.reduce((a,b)=>Math.abs(b-mid)<Math.abs(a-mid)?b:a);
    const lines=[w.w.slice(0,at), w.w.slice(at+1)];
    return {lines, len:Math.min(COLS-2, Math.ceil((Math.max(...lines.map(l=>cx.measureText(l).width))+pad)/cell)), h:2}; };

  const DIRS={up:{x:0,y:-1}, down:{x:0,y:1}, left:{x:-1,y:0}, right:{x:1,y:0}};
  const key=(x,y)=>x+','+y, wx=x=>(x+COLS)%COLS, wy=y=>(y+ROWS)%ROWS;
  const midY=Math.floor(ROWS/2);
  let snake=[0,1,2,3].map(i=>({x:5-i, y:midY})), dir=DIRS.right, queue=[], grow=0, step=PHONE?190:170;
  let prevHead=null, prevTail=null, lastTick=0, pills=[], flash=null, q=null, firstTry=true;
  let started=false, paused=false, over=false, end=0, left=SECS*1000, loop=0;

  const say=(m, bad)=>{ const t=card.querySelector('#toast'); if(t){ t.textContent=m; t.className='toast arcade-toast'+(bad?' no':''); } };
  // Free cells for a label: not on the snake, not right beside or straight ahead of its head, and one cell clear of other labels
  function spot(L, block, near){
    for(let t=0;t<500;t++){ const x=Math.floor(Math.random()*(COLS-L.len+1)), y=Math.floor(Math.random()*(ROWS-L.h+1)); let ok=true;
      for(let i=0;i<L.len && ok;i++) for(let j=0;j<L.h && ok;j++){ const k=key(x+i,y+j); if(block.has(k)||near.has(k)) ok=false; }
      if(ok) return {x,y}; }
    return null; }
  function newQuestion(){
    q=nextQ(); firstTry=true;
    const def=card.querySelector('#snDef'); if(def) def.textContent=q.w.def;
    const body=new Set(snake.map(p=>key(p.x,p.y))), block=new Set(body), h=snake[0], near=new Set();
    for(let dx=-2;dx<=2;dx++) for(let dy=-2;dy<=2;dy++) block.add(key(wx(h.x+dx), wy(h.y+dy)));
    for(let k=1;k<=7;k++) block.add(key(wx(h.x+dir.x*k), wy(h.y+dir.y*k)));
    if(flash) for(let i=0;i<flash.len;i++) for(let j=0;j<flash.h;j++) near.add(key(flash.x+i, flash.y+j));
    pills=[];
    q.words.forEach(w=>{   // the right word is first, so it always finds a place
      const L=layout(w), at=spot(L, block, near) || (w===q.w ? spot(L, body, new Set()) : null); if(!at) return;
      pills.push(Object.assign({w, state:''}, L, at));
      for(let i=-1;i<=L.len;i++) for(let j=-1;j<=L.h;j++) near.add(key(at.x+i, at.y+j)); });
  }
  const pillAt=(x,y)=>pills.find(p=>p.state==='' && x>=p.x && x<p.x+p.len && y>=p.y && y<p.y+p.h);

  function right(p){
    score++; stats(); if(firstTry) P.record('snake', q.w, true);
    grow+=2; step=Math.max(115, step-4);
    say('✓ '+q.w.w);
    flash=Object.assign({}, p, {until:performance.now()+500});
    newQuestion();
  }
  function wrong(p){
    p.state='bad'; p.until=performance.now()+700;   // shown in red for a moment, then gone
    if(firstTry){ firstTry=false; P.record('snake', q.w, false); missed.push(q.w); q.retry(); }
    const cut=Math.min(2, snake.length-3); if(cut>0){ snake.splice(snake.length-cut, cut); prevTail=null; }
    say(`✗ ${p.w.w}: ${p.w.def}`, true);
  }
  function advance(){
    if(queue.length) dir=queue.shift();
    const h=snake[0], nh={x:wx(h.x+dir.x), y:wy(h.y+dir.y)};
    const bite=snake.findIndex((p,i)=>i>0 && i<snake.length-(grow?0:1) && p.x===nh.x && p.y===nh.y);
    prevHead=h; snake.unshift(nh);
    if(grow>0){ grow--; prevTail=null; } else prevTail=snake.pop();
    if(bite>0){ snake=snake.slice(0, bite+1); prevTail=null; say('Ouch! You bit your tail.', true); }
    const now=performance.now(); pills=pills.filter(p=>p.state!=='bad' || now<p.until); lastTick=now;
    const p=pillAt(nh.x, nh.y); if(p){ if(p.w===q.w) right(p); else wrong(p); }
  }
  const run=()=>{ const my=++loop; lastTick=performance.now();
    const t=()=>{ if(my!==loop || over || paused || !alive()) return; advance(); later(t, step); }; later(t, step); };

  function turn(name){
    if(over) return; const d=DIRS[name]; if(!d) return;
    const last=queue.length ? queue[queue.length-1] : dir;
    if(!(d.x===last.x && d.y===last.y) && !(d.x===-last.x && d.y===-last.y) && queue.length<3) queue.push(d);
    if(!started) start(); else if(paused) resume();
  }
  function start(){ if(started) return; started=true; msg.hidden=true; if(!inCircuit) end=Date.now()+SECS*1000; run(); clock();
    // if the game does not fit on the screen, scroll so the timer and the whole card are in view
    if(card.getBoundingClientRect().bottom>window.innerHeight){ const top=document.querySelector('#app .timer') || card; window.scrollTo({top:top.getBoundingClientRect().top+window.scrollY-8, behavior:'smooth'}); } }
  function pause(){ if(!started || paused || over) return; paused=true; if(!inCircuit) left=Math.max(0, end-Date.now());
    msg.textContent=touch?'Paused. Swipe to carry on':'Paused. Press an arrow key to carry on'; msg.hidden=false; }
  function resume(){ if(!paused || over) return; paused=false; if(!inCircuit) end=Date.now()+left; msg.hidden=true; run(); }
  // The game's own minute (in the Daily Circuit, the circuit's clock ends the station instead)
  function clock(){ if(over || inCircuit || !alive()) return;
    const l=paused ? left : Math.max(0, end-Date.now()), f=document.getElementById('timeFill'), s=document.getElementById('snSecs');
    if(f) f.style.width=(100*l/(SECS*1000))+'%'; if(s) s.textContent=Math.ceil(l/1000);
    if(l<=0){ over=true; return arcadeEnd(game, score, missed, playSnake); }
    later(clock, 200); }

  // Drawing: about 60 times a second, sliding the head and tail between cells so the snake moves smoothly
  const near1=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y)===1;
  const mid=p=>({x:(p.x+.5)*cell, y:(p.y+.5)*cell}), lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t, y:a.y+(b.y-a.y)*t});
  function label(p, fill, stroke, ink, alpha){
    const x=p.x*cell+2, y=p.y*cell+3, w=p.len*cell-4, h=p.h*cell-6;
    cx.globalAlpha=alpha; cx.beginPath(); if(cx.roundRect) cx.roundRect(x,y,w,h,Math.min(h/2, cell*0.5)); else cx.rect(x,y,w,h);
    cx.fillStyle=fill; cx.fill(); cx.lineWidth=1.5; cx.strokeStyle=stroke; cx.stroke();
    let px=fontPx; cx.font=font(px); const widest=()=>Math.max(...p.lines.map(l=>cx.measureText(l).width));
    while(px>9 && widest()>w-cell*0.4){ px--; cx.font=font(px); }
    cx.fillStyle=ink; cx.textAlign='center'; cx.textBaseline='middle';
    const lh=px*1.15, top=y+h/2-(p.lines.length-1)*lh/2;
    p.lines.forEach((l,i)=>cx.fillText(l, x+w/2, top+i*lh+1));
    cx.globalAlpha=1;
  }
  function draw(now){
    if(!alive()) return;
    const W=cell*COLS, H=cell*ROWS, t=started && !paused && !over ? Math.min(1, (now-lastTick)/step) : 1;
    cx.fillStyle=col.paper; cx.fillRect(0,0,W,H);
    cx.fillStyle=col.rule; for(let x=1;x<COLS;x++) for(let y=1;y<ROWS;y++) cx.fillRect(x*cell-1, y*cell-1, 2, 2);
    if(flash && now<flash.until) label(flash, col.goodSoft, col.good, col.good, (flash.until-now)/500);
    pills.forEach(p=>{ if(p.state==='bad') label(p, col.badSoft, col.bad, col.bad, Math.max(0,(p.until-now)/700)); else label(p, col.sheet, col.rule, col.ink, 1); });
    // the snake: one thick ink line through the middle of its cells (broken where it goes through a wall)
    const pts=snake.map(mid);
    if(prevHead && near1(prevHead, snake[0])) pts[0]=lerp(mid(prevHead), pts[0], t);
    if(prevTail && near1(prevTail, snake[snake.length-1])) pts.push(lerp(mid(prevTail), pts[pts.length-1], t));
    cx.strokeStyle=col.ink; cx.lineWidth=cell*0.62; cx.lineCap='round'; cx.lineJoin='round'; cx.beginPath();
    pts.forEach((p,i)=>{ if(i && Math.hypot(p.x-pts[i-1].x, p.y-pts[i-1].y)<cell*1.5) cx.lineTo(p.x,p.y); else { cx.moveTo(p.x,p.y); cx.lineTo(p.x+.01,p.y); } });
    cx.stroke();
    const hd=pts[0], fx=dir.x, fy=dir.y;   // the head, with two highlighter-yellow eyes looking the way it is going
    cx.fillStyle=col.ink; cx.beginPath(); cx.arc(hd.x, hd.y, cell*0.42, 0, Math.PI*2); cx.fill();
    cx.fillStyle=col.mark; [-1,1].forEach(s=>{ cx.beginPath(); cx.arc(hd.x+fx*cell*0.14-fy*s*cell*0.19, hd.y+fy*cell*0.14+fx*s*cell*0.19, cell*0.1, 0, Math.PI*2); cx.fill(); });
    requestAnimationFrame(draw);
  }

  // Controls: keys, swipes on the board (several turns in one swipe are fine), and the arrow buttons
  const KEYS={ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right', w:'up', s:'down', a:'left', d:'right', W:'up', S:'down', A:'left', D:'right'};
  keyHandler=e=>{ const n=KEYS[e.key]; if(n){ e.preventDefault(); turn(n); }
    else if((e.key===' ' || e.key==='Enter') && (!started || paused)){ e.preventDefault(); started ? resume() : start(); } };
  let sw=null;
  cv.addEventListener('pointerdown', e=>{ sw={x:e.clientX, y:e.clientY, id:e.pointerId, moved:false}; if(e.pointerType!=='mouse') e.preventDefault(); });
  cv.addEventListener('pointermove', e=>{ if(!sw || e.pointerId!==sw.id) return; const dx=e.clientX-sw.x, dy=e.clientY-sw.y;
    if(Math.max(Math.abs(dx), Math.abs(dy))<20) return;
    turn(Math.abs(dx)>Math.abs(dy) ? (dx>0?'right':'left') : (dy>0?'down':'up')); sw={x:e.clientX, y:e.clientY, id:e.pointerId, moved:true}; });
  cv.addEventListener('pointerup', ()=>{ if(sw && !sw.moved){ if(!started) start(); else if(paused) resume(); } sw=null; });
  cv.addEventListener('pointercancel', ()=>{ sw=null; });
  card.querySelectorAll('.snake-pad button').forEach(b=>{
    b.addEventListener('pointerdown', e=>{ e.preventDefault(); turn(b.dataset.d); });
    b.addEventListener('click', e=>{ if(e.detail===0) turn(b.dataset.d); }); });   // keyboard on the buttons
  // Away from the tab: the snake waits (and so does the game's minute)
  const onVis=()=>{ if(!alive()){ document.removeEventListener('visibilitychange', onVis); return; } if(document.hidden) pause(); };
  document.addEventListener('visibilitychange', onVis);
  const dark=window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  if(dark && dark.addEventListener) dark.addEventListener('change', colours);
  if(window.ResizeObserver){ const ro=new ResizeObserver(()=>{ if(!alive()){ ro.disconnect(); return; } size(); }); ro.observe(box); }

  circuitStop=()=>{ over=true; };
  colours(); size(); stats();
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(()=>{ if(!alive()) return; newQuestion(); requestAnimationFrame(draw); });
}

// ----- Whack-a-word -----
// Nine holes. Words pop up out of them for a moment and drop back. Tap (or click, or press its number) the word that
// matches the meaning while it is up. Right: it is highlighted, and a new meaning comes with a new set of words.
// Wrong: that word's meaning is shown and the hammer stops for a second (so tapping everything does not pay).
// The right word comes up within a second or two of each new meaning, and again and again until it is found.
// Words come up a little faster and stay up a little less as the score grows.
function playWhack(){
  const game=ARCADE.find(g=>g.key==='whack'), SECS=60, N=PHONE?4:5, MAXUP=3, STUN=1000;
  const touch=PHONE || !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
  const nextQ=arcadeQuestions(N), best=store.get('best:whack',0);
  let score=0; const missed=[];
  frame({href:'#', label:CFG.name||'Back'}, `<div class="bar"><span class="title">${arcadeName(game)}</span><span class="spacer"></span><div class="stats" id="stats"></div></div>
    <p class="hint">${T(`${touch?'Tap':'Click (or press its number on)'} the word that matches the meaning while it is up. A wrong word stops your hammer for a second.`, '单词冒出来时，点击意思对的那个。点错了，锤子会停一秒。')}</p>
    ${inCircuit?'':timerBar()}<div class="feed" id="feed"></div>`);
  const stats=()=>{ const el=document.getElementById('stats'); if(el) el.innerHTML=`<span>${T('Found','找到')} <b>${score}</b></span>${inCircuit?'':`<span><b id="wkSecs">${SECS}</b>s</span>`}<span>${T('Best','最佳')} <b>${Math.max(best,score)}</b></span>`; };
  const card=showCard(`<p class="instr">${T('Find the word that means','找出这个意思的单词')}</p><p class="arcade-def" id="wkDef"></p>
    <div class="whack" id="wkBoard">${[...Array(9)].map((_,i)=>`<div class="hole"><div class="well"><button type="button" class="mole" tabindex="-1" disabled><span></span></button></div>${touch?'':`<kbd>${i+1}</kbd>`}</div>`).join('')}
      <div class="arcade-msg" id="wkMsg"${inCircuit?' hidden':''}><button type="button" class="btn" id="wkGo">Start</button></div></div>
    <p class="toast arcade-toast" id="toast" aria-live="polite"></p>`);
  card.classList.add('arcade-card');
  const board=card.querySelector('#wkBoard'), msg=card.querySelector('#wkMsg'), goBtn=card.querySelector('#wkGo');
  const alive=()=>document.body.contains(board);
  const holes=[...board.querySelectorAll('.hole')].map(el=>({el, mole:el.querySelector('.mole'), w:null, up:false, token:0}));
  let q=null, firstTry=true, between=false, pops=0, sinceT=0, stunnedTill=0;
  let upMs=PHONE?2500:2300, gap=PHONE?720:660;
  let started=false, paused=false, over=false, end=0, left=SECS*1000, loop=0;
  const say=(m, bad)=>{ const t=card.querySelector('#toast'); if(t){ t.textContent=m; t.className='toast arcade-toast'+(bad?' no':''); } };

  function up(h, w){
    h.w=w; h.up=true; const my=++h.token, span=h.mole.querySelector('span');
    span.textContent=w.w; h.mole.className='mole'; fitLabel(h.mole, span); h.mole.disabled=false;
    requestAnimationFrame(()=>{ if(h.token===my) h.mole.classList.add('up'); });
    later(()=>{ if(h.token===my) down(h); }, upMs);
  }
  function down(h){
    const my=++h.token; h.up=false; h.mole.classList.remove('up'); h.mole.disabled=true;
    later(()=>{ if(h.token===my){ h.w=null; h.mole.className='mole'; } }, 260);   // free again once it has dropped out of sight
  }
  function newQuestion(){
    q=nextQ(); firstTry=true; between=false; pops=0; sinceT=0;
    arcadeDef(card.querySelector('#wkDef'), q.w);
  }
  // Every so often a word comes up in an empty hole: never more than three up at once, never the same word twice at once.
  // The right word is the second to come up for each meaning, and after that comes up at least every third time.
  function spawn(){
    if(between) return;
    const upNow=holes.filter(h=>h.up), free=holes.filter(h=>!h.up && !h.w); if(upNow.length>=MAXUP || !free.length) return;
    const targetUp=upNow.some(h=>h.w===q.w), others=q.words.filter(w=>w!==q.w && !upNow.some(h=>h.w===w));
    const wantT=!targetUp && (pops===1 || sinceT>=2 || Math.random()<0.35 || !others.length);
    if(!wantT && !others.length) return;
    const w=wantT ? q.w : others[Math.floor(Math.random()*others.length)];
    up(free[Math.floor(Math.random()*free.length)], w); pops++; sinceT = w===q.w ? 0 : sinceT+1;
  }
  const run=()=>{ const my=++loop; const t=()=>{ if(my!==loop || over || paused || !alive()) return; spawn(); later(t, gap); }; later(t, 250); };

  function tap(h){
    if(!started || paused || over || between || !h.up || performance.now()<stunnedTill) return;
    if(h.w===q.w){
      score++; stats(); if(firstTry) P.record('whack', q.w, true);
      h.mole.classList.add('hit'); say('✓ '+q.w.w);
      upMs=Math.max(PHONE?1600:1400, upMs-60); gap=Math.max(440, gap-15);
      between=true; holes.forEach(o=>{ if(o!==h && o.up) down(o); });
      later(()=>down(h), 380); later(newQuestion, 520);
    } else {
      h.mole.classList.add('bad');
      if(firstTry){ firstTry=false; P.record('whack', q.w, false); missed.push(q.w); q.retry(); }
      say(`✗ ${h.w.w}: ${h.w.def}`, true);
      stunnedTill=performance.now()+STUN; board.classList.add('stunned'); later(()=>board.classList.remove('stunned'), STUN);
      later(()=>down(h), 320);
    }
  }
  function start(){ if(started) return; started=true; msg.hidden=true; if(!inCircuit) end=Date.now()+SECS*1000; run(); clock(); }
  function pause(){ if(!started || paused || over) return; paused=true; if(!inCircuit) left=Math.max(0, end-Date.now());
    holes.forEach(h=>{ if(h.up) down(h); }); goBtn.textContent=TX('Carry on','继续'); msg.hidden=false; }
  function resume(){ if(!paused || over) return; paused=false; if(!inCircuit) end=Date.now()+left; msg.hidden=true; run(); }
  function clock(){ if(over || inCircuit || !alive()) return;
    const l=paused ? left : Math.max(0, end-Date.now()), f=document.getElementById('timeFill'), s=document.getElementById('wkSecs');
    if(f) f.style.width=(100*l/(SECS*1000))+'%'; if(s) s.textContent=Math.ceil(l/1000);
    if(l<=0){ over=true; return arcadeEnd(game, score, missed, playWhack); }
    later(clock, 200); }

  holes.forEach(h=>h.mole.addEventListener('pointerdown', e=>{ e.preventDefault(); tap(h); }));
  goBtn.onclick=()=>{ started ? resume() : start(); };
  keyHandler=e=>{ const n=parseInt(e.key,10);
    if(n>=1 && n<=9){ e.preventDefault(); tap(holes[n-1]); }
    else if((e.key===' ' || e.key==='Enter') && (!started || paused)){ e.preventDefault(); started ? resume() : start(); } };
  const onVis=()=>{ if(!alive()){ document.removeEventListener('visibilitychange', onVis); return; } if(document.hidden) pause(); };
  document.addEventListener('visibilitychange', onVis);

  circuitStop=()=>{ over=true; };
  stats(); newQuestion();
  if(inCircuit) start(); else goBtn.focus({preventScroll:true});
}

// ----- Word Invaders -----
// The words come down the board together in formation, swaying from side to side. Tap (or click, or press its number)
// the word that matches the meaning, and the highlighter at the bottom fires at it. Right: the word is highlighted and the
// next wave comes down with a new meaning. Wrong: the word is crossed out, its meaning is shown and the highlighter needs a
// second to cool down. If the words reach the line at the bottom first, the right word is shown and the next wave starts.
// Each wave comes down a little faster than the last one the student cleared.
function playInvaders(){
  const game=ARCADE.find(g=>g.key==='invaders'), SECS=60, N=PHONE?4:5, COLS=PHONE?2:3, COOL=1000;
  const touch=PHONE || !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
  const calm=!!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const nextQ=arcadeQuestions(N), best=store.get('best:invaders',0);
  let score=0; const missed=[];
  frame({href:'#', label:CFG.name||'Back'}, `<div class="bar"><span class="title">${arcadeName(game)}</span><span class="spacer"></span><div class="stats" id="stats"></div></div>
    <p class="hint">${T(`${touch?'Tap':'Click (or press its number on)'} the word that matches the meaning before the words reach the line at the bottom. After a wrong word, the highlighter needs a second to cool down.`, '在单词落到底线之前，点击意思对的那个。点错了，荧光笔要等一秒才能再用。')}</p>
    ${inCircuit?'':timerBar()}<div class="feed" id="feed"></div>`);
  const stats=()=>{ const el=document.getElementById('stats'); if(el) el.innerHTML=`<span>${T('Found','找到')} <b>${score}</b></span>${inCircuit?'':`<span><b id="ivSecs">${SECS}</b>s</span>`}<span>${T('Best','最佳')} <b>${Math.max(best,score)}</b></span>`; };
  const card=showCard(`<p class="instr">${T('Find the word that means','找出这个意思的单词')}</p><p class="arcade-def" id="ivDef"></p>
    <div class="invaders" id="ivBoard"><div class="iv-ground"></div><div class="iv-gun" id="ivGun"></div>
      <div class="arcade-msg" id="ivMsg"${inCircuit?' hidden':''}><button type="button" class="btn" id="ivGo">Start</button></div></div>
    <p class="toast arcade-toast" id="toast" aria-live="polite"></p>`);
  card.classList.add('arcade-card');
  const board=card.querySelector('#ivBoard'), gun=card.querySelector('#ivGun'), msg=card.querySelector('#ivMsg'), goBtn=card.querySelector('#ivGo');
  const alive=()=>document.body.contains(board);
  const say=(m, bad)=>{ const t=card.querySelector('#toast'); if(t){ t.textContent=m; t.className='toast arcade-toast'+(bad?' no':''); } };

  // Sizes, worked out from the board: the formation takes about two thirds of the width and sways across the rest
  const CH=PHONE?50:54, GUN_TOP=57;   // a word's height; how far the highlighter's tip is from the bottom of the board
  let W=0, H=0, cw=0, rh=0, formW=0, amp=0, groundY=0;
  const sizeWord=x=>{ x.el.style.width=Math.round(cw-12)+'px'; x.el.style.height=CH+'px'; fitLabel(x.el, x.el.querySelector('span')); };
  const measure=()=>{ W=board.clientWidth; H=board.clientHeight; formW=W*(PHONE?0.8:0.68); amp=calm ? 0 : (W-formW)/2-6;
    cw=formW/COLS; rh=CH+14; groundY=H-58; if(wave) wave.words.forEach(sizeWord); };

  let q=null, firstTry=true, wave=null, fall=PHONE?10000:9000, coolTill=0, last=0;   // fall: how long a wave takes to come down
  let started=false, paused=false, over=false, end=0, left=SECS*1000;
  function newWave(){
    if(!alive() || over) return;
    q=nextQ(); firstTry=true;
    arcadeDef(card.querySelector('#ivDef'), q.w);
    board.querySelectorAll('.iv-word').forEach(e=>e.remove());
    const words=shuffle(q.words).map((w,i)=>{
      const el=document.createElement('button'); el.type='button'; el.className='iv-word'; el.tabIndex=-1;
      el.innerHTML=`${touch?'':`<kbd>${i+1}</kbd>`}<span>${esc(w.w)}</span>`; board.insertBefore(el, msg);
      const x={w, el, col:i%COLS, row:Math.floor(i/COLS), state:''};
      el.addEventListener('pointerdown', e=>{ e.preventDefault(); fire(x); });
      return x; });
    wave={words, t:0, T:fall, done:false};
    words.forEach(sizeWord); place();
  }
  // Where the formation is now: p = how far down (0 at the top, 1 when its bottom row reaches the line)
  function place(){
    if(!wave) return 0;
    const rows=Math.ceil(wave.words.length/COLS), p=Math.min(1, wave.t/wave.T), y=8+p*Math.max(0, groundY-rows*rh-8+14);
    const x0=(W-formW)/2+amp*Math.sin(wave.t/900);
    wave.words.forEach(x=>{ const inRow=Math.min(COLS, wave.words.length-x.row*COLS), off=(COLS-inRow)*cw/2;
      x.el.style.transform=`translate(${Math.round(x0+off+x.col*cw+6)}px, ${Math.round(y+x.row*rh)}px)`; });
    return p;
  }
  function tick(now){
    if(!alive()) return;
    const dt=last ? Math.min(100, now-last) : 0; last=now;
    if(started && !paused && !over && wave && !wave.done){ wave.t+=dt; if(place()>=1) landed(); }
    requestAnimationFrame(tick);
  }
  // The highlighter slides under the word and fires a yellow beam up at it
  function beam(x){
    const r=x.el.getBoundingClientRect(), b=board.getBoundingClientRect(), cx=r.left+r.width/2-b.left, top=r.bottom-b.top;
    gun.style.left=cx+'px';
    const bm=document.createElement('div'); bm.className='iv-beam'; bm.style.left=cx+'px'; bm.style.top=top+'px'; bm.style.height=Math.max(0, H-GUN_TOP-top)+'px';
    board.insertBefore(bm, msg); later(()=>bm.remove(), 260);
  }
  function fire(x){
    if(!started || paused || over || !wave || wave.done || x.state) return;
    const now=performance.now(); if(now<coolTill) return;
    beam(x);
    if(x.w===q.w){
      x.state='hit'; x.el.classList.add('hit'); wave.done=true;
      score++; stats(); if(firstTry) P.record('invaders', q.w, true); say('✓ '+q.w.w);
      fall=Math.max(PHONE?6000:5500, fall-350);
      wave.words.forEach(o=>{ if(o!==x) o.el.classList.add('gone'); });
      later(newWave, 650);
    } else {
      x.state='bad'; x.el.classList.add('bad');
      if(firstTry){ firstTry=false; P.record('invaders', q.w, false); missed.push(q.w); q.retry(); }
      say(`✗ ${x.w.w}: ${x.w.def}`, true);
      coolTill=now+COOL; gun.classList.add('hot'); later(()=>gun.classList.remove('hot'), COOL);
    }
  }
  function landed(){
    wave.done=true;
    if(firstTry){ firstTry=false; P.record('invaders', q.w, false); missed.push(q.w); q.retry(); }
    const right=wave.words.find(o=>o.w===q.w); if(right) right.el.classList.add('reveal');
    wave.words.forEach(o=>{ if(o!==right) o.el.classList.add('gone'); });
    say(TX(`Too late! It was ${q.w.w}.`, `太晚了！答案是 ${q.w.w}。`), true); later(newWave, 1200);
  }
  function start(){ if(started) return; started=true; msg.hidden=true; last=0; if(!inCircuit) end=Date.now()+SECS*1000; clock();
    if(card.getBoundingClientRect().bottom>window.innerHeight){ const top=document.querySelector('#app .timer') || card; window.scrollTo({top:top.getBoundingClientRect().top+window.scrollY-8, behavior:'smooth'}); } }
  function pause(){ if(!started || paused || over) return; paused=true; if(!inCircuit) left=Math.max(0, end-Date.now()); goBtn.textContent=TX('Carry on','继续'); msg.hidden=false; }
  function resume(){ if(!paused || over) return; paused=false; last=0; if(!inCircuit) end=Date.now()+left; msg.hidden=true; }
  function clock(){ if(over || inCircuit || !alive()) return;
    const l=paused ? left : Math.max(0, end-Date.now()), f=document.getElementById('timeFill'), s=document.getElementById('ivSecs');
    if(f) f.style.width=(100*l/(SECS*1000))+'%'; if(s) s.textContent=Math.ceil(l/1000);
    if(l<=0){ over=true; return arcadeEnd(game, score, missed, playInvaders); }
    later(clock, 200); }

  goBtn.onclick=()=>{ started ? resume() : start(); };
  keyHandler=e=>{ const n=parseInt(e.key,10);
    if(n>=1 && wave && n<=wave.words.length){ e.preventDefault(); fire(wave.words[n-1]); }
    else if((e.key===' ' || e.key==='Enter') && (!started || paused)){ e.preventDefault(); started ? resume() : start(); } };
  const onVis=()=>{ if(!alive()){ document.removeEventListener('visibilitychange', onVis); return; } if(document.hidden) pause(); };
  document.addEventListener('visibilitychange', onVis);
  if(window.ResizeObserver){ const ro=new ResizeObserver(()=>{ if(!alive()){ ro.disconnect(); return; } measure(); place(); }); ro.observe(board); }

  circuitStop=()=>{ over=true; };
  stats(); measure(); newWave(); requestAnimationFrame(tick);
  if(inCircuit) start(); else goBtn.focus({preventScroll:true});
}

// ---------- CHINESE SIDE (data-only="zh"): vocabulary games with Chinese support ----------
// Chinese appears next to the key word only. Answer options are always English.
const ZH = Object.fromEntries(S.words.filter(w=>w.zh).map(w=>[w.id,w.zh]));   // the zh column of words.csv
// ----- Chinese side: the student's words (31 Oct 2026, teacher) -----
// "It doesn't really teach you the words… the learning comes through repeated use of the vocabulary, not explicit teaching."
// No Learn the words step and no level buttons: every game uses the student's own set of words for this topic. A new
// student starts with ZH_START words from the lowest level (Foundation first, in words.csv order). Whenever few enough of the
// set are still shaky, a batch more join; how many, and how few is "few enough", follow how the student is doing (zhPace).
// A word is confident after two right answers in a row in any game, or one right answer if it was right the first time it
// came up (they already knew it), or once it is Familiar and last answered right. New words are slipped into a game
// already being played (Deck checks every few cards). Words from the
// next level only join once ZH_CROSS of the set is confident. "Your level" is the lowest level that still has words not yet
// in the set or not yet confident; when it goes up, the student sees "Level up!". The set is saved per topic (aea:<topic>:pool, synced like other aea: keys).
const ZH_START=12, ZH_CROSS=.8;   // batch size and shaky limit: zhPace()
function zhOrdered(){ return S.words.filter(w=>w.zh).map((w,i)=>[bandOf(w)??9, i, w]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]).map(x=>x[2]); }
function zhConfident(w){ const r=P.wordRec(w.id); if(!r) return false; return r.c!=null ? (r.c>=2 || (r.f===1 && r.c>=1) || (r.s>=2 && r.c>=1)) : r.s>=2; }
// Pace (31 Oct, teacher: "if they're getting a long streak they should move up faster, if they're getting them wrong they
// should move slower"): from their last 20 answers on this topic. add = words per batch; shaky = how many shaky words are
// allowed before a batch joins.
function zhPace(){
  const r=store.get('zhrecent', []); if(r.length<8) return {add:4, shaky:4};
  const acc=r.reduce((a,b)=>a+b,0)/r.length; let run=0; for(let i=r.length-1;i>=0 && r[i];i--) run++;
  if(acc>=.9 || run>=12) return {add:6, shaky:6};   // flying: bigger batches, more new words at once
  if(acc>=.75) return {add:4, shaky:4};
  if(acc>=.6) return {add:2, shaky:3};
  return {add:2, shaky:1};                          // struggling: new words wait until the current ones settle
}
function zhPoolWords(){
  P.refresh();
  const all=zhOrdered(), byid=Object.fromEntries(all.map(w=>[w.id,w])), saved=store.get('pool', null);
  // First visit: start from the words they have already met here (earlier Learn the words, or the English side)
  const pool=(Array.isArray(saved) ? saved : all.filter(w=>P.wordRec(w.id)).map(w=>w.id)).map(id=>byid[id]).filter(Boolean);
  const have=new Set(pool.map(w=>w.id)), rest=all.filter(w=>!have.has(w.id));
  if(pool.length<ZH_START) pool.push(...rest.splice(0, ZH_START-pool.length));
  const pace=zhPace();
  for(let guard=0; guard<200 && rest.length; guard++){
    const shaky=pool.filter(w=>!zhConfident(w)).length; if(shaky>pace.shaky) break;
    const top=Math.max(0, ...pool.map(w=>bandOf(w)??9)), nb=bandOf(rest[0])??9;
    if(nb>top && pool.length && (pool.length-shaky)/pool.length<ZH_CROSS) break;
    const batch=[]; while(rest.length && batch.length<pace.add && (bandOf(rest[0])??9)===nb) batch.push(rest.shift());
    pool.push(...batch);
  }
  const ids=pool.map(w=>w.id); if(!Array.isArray(saved) || saved.join()!==ids.join()) store.set('pool', ids);
  // Their level: the lowest level that still has words not yet in the set or not yet confident. Level up when it rises.
  const inSet=new Set(ids), open_=all.find(w=>!inSet.has(w.id) || !zhConfident(w)), b=open_ ? (bandOf(open_) ?? zhTop(pool)) : zhTop(pool), was=store.get('zhband', null);
  if(b!=null){ if(was!=null && b>was && LEVEL_CODES[b]){ const c=LEVEL_CODES[b]; toastLevel(uiLang()==='zh' ? `升级到${LEVEL_ZH[c]}！` : `Level up! You've reached ${LEVEL_NAMES[c]}`); }
    if(was!==b) store.set('zhband', b); }
  return pool;
}
function zhTop(pool){ const bs=pool.map(w=>bandOf(w)).filter(b=>b!=null); return bs.length ? Math.max(...bs) : null; }
function zhBand(){ zhPoolWords(); const b=store.get('zhband', null); return b==null ? myBand() : (nearestLevel(b) ?? b); }
// "Your level" on a Chinese topic page: the level of the words joining now; the bar is how many words at that level are confident
function zhLevelLine(){
  const b=zhBand(), code=LEVEL_CODES[b]||'', at=S.words.filter(w=>w.zh && bandOf(w)===b), conf=at.filter(zhConfident).length;
  const pct=at.length ? Math.round(100*conf/at.length) : 0, tip=`${conf} of ${at.length} ${LEVEL_NAMES[code]||''} words going well`;
  return `<div class="lvl-line"><p class="lvl-k">${T('Your level','你的水平')}: <span class="lvl-now">${T(esc(LEVEL_NAMES[code]||''), LEVEL_ZH[code]||'')}</span></p>
    <span class="lvl-bar lvl-divider" role="img" aria-label="${esc(tip)}" title="${esc(tip)}"><i style="width:${pct}%"></i></span></div>`;
}
const zhLevelWords = () => zhWords();   // (was: every word at the chosen level; now the student's own set)
// The games use every word at the chosen level (29 Oct, teacher: "I don't like the words to unlock screens… the kids
// kinda know most of the words and they're quite supported within the game"). Until then they only used the student's
// word bank (words met in Learn the words), and a game stayed locked until there were enough of them. Learn the words
// is still there as an optional start; the word stages still move as words are answered in any game.
const inBank = w => !!P.wordRec(w.id);
const zhWords = () => zhPoolWords();
const zhBankAll = () => S.words.filter(w=>ZH[w.id]);   // every word with its Chinese, at every level
// Wrong answers come from the word bank when it is big enough, otherwise from all the words at the level
const zhPool = p => { if(p.length>=8) return p; const all=S.words.filter(w=>ZH[w.id]), b=zhBand(), l=all.filter(w=>(bandOf(w)??9)<=b); return l.length>=8 ? l : all; };
const ZH_GAMES = [
  {key:'zh',       type:'practice',  name:'中文 → English',     zh:'看中文，选英文', blurb:'See the Chinese meaning and choose the English word.', zhBlurb:'看中文意思，选出英文单词。', run:()=>playZh()},
  {key:'zhmatch',  type:'practice',  name:'Match the meaning',  zh:'单词配释义',     blurb:'Match each word to its English meaning. The Chinese is shown under the word.', zhBlurb:'把每个单词和它的英文释义配对，单词下面有中文。', min:6, run:()=>playMatch('def', true)},
  {key:'zhmean',   type:'practice',  name:'Choose the meaning', zh:'选出释义',       blurb:'See the word and its Chinese, then choose the English meaning.', zhBlurb:'看单词和中文，选出正确的英文释义。', run:()=>playZhMeaning()},
  {key:'zhtype',   type:'practice',  name:'Type it',            zh:'拼写单词',       blurb:'Read the meaning and the Chinese, then type the English word.', zhBlurb:'看释义和中文，拼写出英文单词。', run:()=>playType()},
  {key:'zhtf',     type:'practice',  name:'True or false',      zh:'判断对错',       blurb:'See the word and its Chinese. Does the English meaning match? Decide quickly.', zhBlurb:'看单词和中文，判断英文释义对不对，要快！', run:()=>playZhTF()},
  {key:'zhbuild',  type:'practice',  name:'Build the sentence', zh:'连词成句',       blurb:'See the sentence in Chinese, then build it in English from the coloured pieces.', zhBlurb:'看中文句子，用彩色词块拼出英文句子。', run:()=>playBuild(), ready:()=>zhBuilds().length>0, lock:'No sentences at this level yet 本级别还没有句子'},
  // Odd one out was taken off the Chinese side on 26 Oct (teacher: replace it with Build the sentence). playOdd() is still
  // below; to bring it back, remove the // from the next line.
  // {key:'zhodd',    type:'practice',  name:'Odd one out',        zh:'找出不同类',     blurb:'Four words: three belong together. Find the one that doesn’t.', zhBlurb:'四个词里有三个是一类的，找出不同的那个。', run:()=>playOdd(), needs:()=>oddReady()},
  {key:'zhspeed',  type:'challenge', name:'Speed round',        zh:'限时挑战',       blurb:'60 seconds. See the Chinese, choose the English word. How many can you get?', zhBlurb:'60 秒内看中文选英文，看你能答对多少个！', min:8, run:()=>playSpeed()},
  {key:'zhsurvive',type:'challenge', name:'Survival',           zh:'生存挑战',       blurb:'Three lives. See the word and its Chinese, then choose the English meaning before time runs out. It gets faster.', zhBlurb:'三条命。看单词和中文，在时间用完前选出英文释义，会越来越快。', min:8, run:()=>playSurvival()}
];
// A Chinese-version game needs at least 4 words in the word bank at the chosen level (Match the meaning 6, the challenges 8,
// or every word when the level has fewer). Build the sentence needs sentences with their Chinese at the level instead.
const zhNeed = g => Math.max(4, Math.min(g.min||4, zhLevelWords().length));
const zhReady = g => g.ready ? g.ready() : zhLevelWords().length>=4 && zhWords().length>=zhNeed(g) && !(g.needs && !g.needs());
// Build the sentence (Chinese version): the sentences at the chosen level that have their Chinese (builds.csv, zh column)
const zhBuilds = () => pick(S.builds).filter(b=>b.zh);
// The Chinese topic menu (cleaned up 26 Oct; teacher: a student landing here should want to join in and know how).
// Title (Chinese on its own line), one row of level buttons and "Your level" as on the English compact layout, then ONE
// start card (Learn the words) and the games. Games that are open are full cards; locked ones shrink to small tiles that
// say what opens them; a game that learning can't open at this level (Build the sentence before any sentence has its
// Chinese) is left out. The old layout (level panel on the right, two paragraphs of instructions, every game a grey
// card) was replaced; levelCard(true) and levelNote() are no longer used here.
const LOCK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
function zhMenu(){
  tidyChoice(); P.refresh(); const n=zhLevelWords().length, have=zhWords().length;
  const need=g=>zhNeed(g)-have;
  const lockText=g=> n<4 ? T('Not enough words at this level yet','本级别单词不够')
    : need(g)>0 ? T(`${need(g)} more word${need(g)===1?'':'s'}`, `再学 ${need(g)} 个单词`)
    : T('Words from more groups','学习更多类别的单词');
  const shown=ZH_GAMES.filter(g=>!g.ready || g.ready()), open=shown.filter(zhReady), locked=shown.filter(g=>!zhReady(g));
  // What the next words unlock: "Learn 4 words to unlock 4 games"
  const needs=n>=4 ? locked.filter(g=>need(g)>0).map(need) : [], next=needs.length ? Math.min(...needs) : 0, opens=locked.filter(g=>need(g)===next && !g.needs).length;
  const teaser=next ? T(`Learn ${next}${have?' more':''} word${next===1?'':'s'} to unlock ${opens} game${opens===1?'':'s'}.`, `再学 ${next} 个单词，解锁 ${opens} 个游戏。`) : '';
  const card=g=>{ const best=store.get((g.type==='challenge'?'best:':'streak:')+g.key,0);
    return `<a class="game" href="#play-${g.key}">${g.type==='challenge'?`<span class="game-tag">${T('Challenge','挑战')}</span>`:''}<h3>${T(g.name, g.zh)}</h3><p>${T(g.blurb, g.zhBlurb)}</p>
      <span class="best">${best?(g.type==='challenge'?T('Best score','最高分'):T('Best streak','最佳连对'))+': '+best:T('Not played yet','还没玩过')}</span></a>`; };
  const tile=g=>`<div class="game-lock" aria-disabled="true">${LOCK_SVG}<span class="gl-name">${T(g.name, g.zh)}</span><span class="gl-need">${lockText(g)}</span></div>`;
  frame({href:CFG.back||'../index.html', label:CFG.backLabel||'中文版 Chinese version', html:T('Chinese version','中文版')}, `
  <section class="hero hero-compact hero-zhc">
    <p class="eyebrow">${T('Chinese version','中文版')}</p>
    <h1>${nameT(CFG.name)}</h1>
    ${zhLevelLine()}
  </section>
  <h2 class="zh-games-h">${T('Games','游戏')}</h2>
  ${open.length ? `<div class="games">${open.map(card).join('')}</div>` : ''}
  ${locked.length ? `${open.length?`<p class="instr group-label">${T('Still locked','还没解锁')}</p>`:''}<div class="locks">${locked.map(tile).join('')}</div>` : ''}
  <div class="wl-link"><p>${T('See every word with its Chinese meaning.','查看所有单词和中文释义。')}</p><a class="btn alt" href="#words">${T('Word list','词汇表')}</a></div>`);
  wireLevels(zhMenu);
}
function zhShell(title, note){
  frame({href:'#', label:CFG.name||'Back', html:CFG.name?nameT(CFG.name):''}, `<div class="bar"><span class="title">${title}</span><span class="spacer"></span><div class="stats" id="stats"></div></div>
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
// The start card on a Chinese topic menu. The button sits beside the title (30 Oct 2026; the line of text next to it was removed,
// so teaser, from zhMenu, is no longer shown).
function learnHtml(teaser){
  P.refresh();
  const p=zhLevelWords(), c={known:0, fam:0, learn:0, new:0}; p.forEach(w=>c[stageOf(w)]++);
  const total=p.length, met=total-c.new, ready=total>=4, next=Math.min(LEARN_N, c.new), b=chosenBand();
  const pct=k=>total ? (100*c[k]/total).toFixed(2) : 0;
  const go = !ready ? `<span class="btn big off" aria-disabled="true">${T('Learn the words','学习单词')}</span>`
    : !c.new ? `<a class="btn big" href="#learn">${T('Review the words','复习单词')} →</a>`
    : met ? `<a class="btn big" href="#learn">${T(`Learn ${next} more`, `再学 ${next} 个`)} →</a>`
    : `<a class="btn big" href="#learn">${T('Start','开始')} →</a>`;
  return `<section class="learn" aria-labelledby="learnH">
    <div class="learn-top"><div class="learn-title">
    <p class="learn-k">${met ? T('Your words','你的单词') : T('New words?','新单词？')}${b!=null && LEVELS.length>1 ? ' · '+T(esc(bandName(b)), LEVEL_ZH[LEVEL_CODES[b]]) : ''}</p>
    <h2 id="learnH">${T('Learn the words','学习单词')}</h2></div>
    ${go}</div>
    ${met ? '' : `<p class="learn-how">${T(`${LEARN_N} new words at a time: look at them, then match them.`, `每次 ${LEARN_N} 个新单词：先看一看，再配一配。`)}</p>`}
    ${total ? `<div class="wb"><p class="wb-count">${T(`<b>${met}</b> / ${total} words learned`, `已学 <b>${met}</b> / ${total} 个单词`)}</p>
      <span class="wb-bar" role="img" aria-label="${c.known} known, ${c.fam} familiar, ${c.learn} learning, ${c.new} new">${STAGES.filter(x=>x[0]!=='new').map(([k])=>`<i class="wb-${k}" style="width:${pct(k)}%"></i>`).join('')}</span>
      ${met ? `<p class="wb-legend">${STAGES.map(([k,en,zh])=>`<span><i class="sw wb-${k}"></i>${T(en, zh)} <b>${c[k]}</b></span>`).join('')}</p>` : ''}</div>` : ''}
  </section>`;
}
function playLearn(){
  P.refresh();
  const p=zhLevelWords(), pool=p.length>=8 ? p : S.words.filter(w=>ZH[w.id]), now=Date.now();
  const batch=p.filter(w=>stageOf(w)==='new').slice(0, LEARN_N), review=!batch.length;
  const isDue=w=>{ const r=P.wordRec(w.id); return r && r.s<4 && (r.due||0)<=now; };
  const quiz = review ? rankForLevel(p).slice(0, LEARN_REVIEW)
    : shuffle([...batch, ...rankForLevel(p.filter(w=>!batch.includes(w) && stageOf(w)!=='new')).filter(isDue).slice(0, LEARN_EXTRA)]);
  let total=batch.length+quiz.length, done=0, answered=0, right=0;
  const firstTry=new Set(), again=new Set(), queue=quiz.slice();
  zhShell(review ? T('Review the words','复习单词') : T('Learn the words','学习单词'),
    review ? T('See the Chinese, choose the English word.','看中文，选出英文单词。')
           : T('Meet the new words, then match each Chinese word to its English word.','先认识新单词，再把中文和英文配对。'));
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
    statsEl.innerHTML=`<span>${T('New word','新单词')} <b>${i+1}</b>/${batch.length}</span>`;
    const card=showCard(`<p class="instr">${T(`New word · ${i+1} of ${batch.length}`, `新单词 · 第 ${i+1} 个，共 ${batch.length} 个`)}</p>
      <div class="zh-prompt" lang="zh-CN">${esc(ZH[w.id])}</div>
      <p class="prompt-word learn-en">${esc(w.w)}${w.pos?` <small>${esc(w.pos)}</small>`:''}</p>
      <p class="learn-def">${esc(w.def)}</p>${w.ex?`<p class="learn-ex"><i>${esc(w.ex)}</i></p>`:''}`);
    card.classList.add('learn-card');
    manualNext(card, ()=>{ done++; tick(); intro(i+1); }, i+1<batch.length ? T('Next word','下一个')+' →' : T('Now match them','开始配对')+' →');
  };
  const quizStep=()=>{
    const w=queue.shift(); if(!w) return finish();
    statsEl.innerHTML=`<span>${T('Right','答对')} <b>${right}</b>/${answered}</span>`;
    const old=!review && !batch.includes(w);
    mcCard({instr:T('Choose the English word','选出英文单词'), promptHtml:`<div class="zh-prompt" lang="zh-CN">${esc(ZH[w.id])}</div>${old?`<p class="learn-tag">${T('Review','复习')}</p>`:''}`,
      options:[w.w, ...wrongFor(w).map(x=>x.w)], answer:w.w,
      onResult:(ok,card,fb)=>{ P.record('learn', w, ok, {noRate:true}); answered++;
        const note=`<span class="wd"><b>${esc(w.w)}</b> <span lang="zh-CN">${esc(ZH[w.id])}</span>: ${esc(w.def)}</span>`;
        statsEl.innerHTML=`<span>${T('Right','答对')} <b>${right+(ok?1:0)}</b>/${answered}</span>`;
        if(ok){ right++; if(!again.has(w)) firstTry.add(w); done++; tick(); fbOk(fb, note); autoNext(card, quizStep); }
        else { fbNo(fb, w.w, note);
          // A missed word comes back once, two cards later (or at the end)
          if(!again.has(w)){ again.add(w); queue.splice(Math.min(queue.length, 2), 0, w); total++; } else { done++; }
          tick(); manualNext(card, quizStep); }
      }});
  };
  const finish=()=>{
    done=total; tick(); P.refresh();
    const left=zhLevelWords().filter(x=>stageOf(x)==='new').length, more=Math.min(LEARN_N, left), shown=review ? quiz : batch;
    statsEl.innerHTML=`<span>${T('Right','答对')} <b>${right}</b>/${answered}</span>`;
    const card=showCard(`<div class="end"><p class="instr">${review?T('Review the words','复习单词'):T('Learn the words','学习单词')} · ${T('finished','完成')}</p>
      <h2>${review ? T('Review done!','复习完成！') : T(`${batch.length} new word${batch.length===1?'':'s'} in your word bank`, `${batch.length} 个新单词已加入你的词库`)}</h2>
      <p class="end-sub">${T(`${firstTry.size} of ${quiz.length} right first time.`, `第一次就答对 ${firstTry.size} / ${quiz.length}。`)}</p>
      <ul class="review">${shown.map(w=>`<li><b>${esc(w.w)}</b> <span lang="zh-CN">${esc(ZH[w.id])}</span> – ${esc(w.def)}</li>`).join('')}</ul>
      ${!left && !review ? `<p class="end-sub">${T('You have met every word at this level!','本级别的单词你都学过了！')}</p>` : ''}
      <div class="end-actions"><button class="btn" id="more">${left ? T(`Learn ${more} more`, `再学 ${more} 个`) : T('Review the words','复习单词')}</button>
        <a class="btn alt" href="#play-zh">${T('Practise: 中文 → English','练习：看中文，选英文')}</a><a class="btn alt" href="#">${T('All games','所有游戏')}</a></div></div>`);
    card.querySelector('#more').onclick=playLearn;
    keyHandler=e=>{ if(e.key==='Enter'){ e.preventDefault(); playLearn(); } };
  };
  if(review){ total=quiz.length; quizStep(); } else intro(0);
}
function playZh(){
  const p=zhWords(), deck=Deck(zhWords), st=Stats('zh');
  zhShell(T('中文 → English','看中文，选英文'), T('See the Chinese meaning and choose the English word.','看中文意思，选出英文单词。')); st.draw();
  const step=()=>{
    const w=deck.next(), ds=distractors(w,zhPool(p),3);
    mcCard({instr:T('Choose the English word','选出英文单词'), promptHtml:`<div class="zh-prompt" lang="zh-CN">${esc(ZH[w.id])}</div><div class="pos">${esc(w.pos||'')}</div>`,
      options:[w.w,...ds.map(x=>x.w)], answer:w.w,
      onResult:(ok,card,fb)=>{ ok?fbOk(fb,w.ex?`<span class="wd"><i>${esc(w.ex)}</i></span>`:''):fbNo(fb,w.w,`${wordNote(w)}${w.ex?`<span class="wd"><i>${esc(w.ex)}</i></span>`:''}`); settle(ok,card,st,deck,w,step); }});
  };
  step();
}
function playZhMeaning(){
  const p=zhWords(), deck=Deck(zhWords), st=Stats('zhmean');
  zhShell(T('Choose the meaning','选出释义'), T('Read the word and its Chinese, then choose the English meaning.','看单词和中文，选出正确的英文释义。')); st.draw();
  const step=()=>{
    const w=deck.next(), ds=distractors(w,zhPool(p),3);
    mcCard({instr:T('Choose the meaning','选出释义'), promptHtml:`<p class="prompt-word">${esc(w.w)}${w.pos?` <small>${esc(w.pos)}</small>`:''}</p><p class="zh-under" lang="zh-CN">${esc(ZH[w.id])}</p>`,
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
  const p=zhWords(), deck=Deck(zhWords), st=Stats('zhtype');
  zhShell(T('Type it','拼写单词'), T('Read the meaning, then type the English word.','看释义，拼写出英文单词。')); st.draw();
  const step=()=>{
    const w=deck.next(), target=normAns(w.w).split(/\s*\/\s*/)[0];
    const card=showCard(`<p class="instr">${T('Type the English word','拼写英文单词')}</p>
      <p class="prompt-def">${esc(w.def)}</p><p class="zh-under" lang="zh-CN">${esc(ZH[w.id])}</p>
      <form class="typeform" autocomplete="off"><input id="typeIn" type="text" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="${TX('Type the word','输入单词')}" placeholder="${TX('Type here','在此输入')}">
      <button class="btn" type="submit">${T('Check','检查')}</button><button class="btn alt" type="button" id="hint">${T('Hint','提示')}</button></form>
      <p class="hint-line" id="hintLine"></p><div class="fb"></div>`);
    const input=card.querySelector('#typeIn'), form=card.querySelector('form'); let hints=0, done=false;
    setTimeout(()=>input.focus({preventScroll:true}),50);
    card.querySelector('#hint').onclick=()=>{ hints=Math.min(hints+1,target.length);
      card.querySelector('#hintLine').textContent=TX('Starts with','开头是')+': '+target.slice(0,hints)+'…'; input.focus(); };
    form.onsubmit=e=>{ e.preventDefault(); if(done) return; const v=normAns(input.value); if(!v) return; done=true;
      const alt=altsFor(w).find(x=>answersFor(x).includes(v));
      const ok=answersFor(w).includes(v) || !!alt; input.disabled=true; form.querySelectorAll('button').forEach(b=>b.disabled=true);
      input.classList.add(ok?'ok':'no');
      const fb=card.querySelector('.fb'), ex=w.ex?`<span class="wd"><i>${esc(w.ex)}</i></span>`:'';
      const others=altsFor(w);
      if(alt) fbOk(fb, `<span>${T(`<b>${esc(alt.w)}</b> also fits this meaning. Another word for it is <b>${esc(w.w)}</b>.`, `<b>${esc(alt.w)}</b> 也对；另一个词是 <b>${esc(w.w)}</b>。`)}</span>${ex}`);
      else if(ok) fbOk(fb, (others.length?`<span>${T('Also correct','也对')}: ${others.map(x=>esc(x.w)).join(', ')}</span>`:'')+ex);
      else fbNo(fb, w.w+(others.length?' (or '+others.map(x=>x.w).join(', ')+')':''), ex);
      settle(ok,card,st,deck,w,step); };
    keyHandler=null;
  };
  step();
}

// ----- Chinese side: True or false (does this meaning match the word?) -----
function playZhTF(){
  const p=zhWords(), deck=Deck(zhWords), st=Stats('zhtf');
  zhShell(T('True or false','判断对错'), T('Does the meaning match the word? Press T or F, or tap.','释义和单词匹配吗？按 T 或 F，或点击按钮。')); st.draw();
  const step=()=>{
    const w=deck.next(), truth=Math.random()<.5, other=truth?w:(distractors(w,zhPool(p),1)[0]||w), real=truth||other===w;
    const card=showCard(`<p class="instr">${T('True or false?','对还是错？')}</p>
      <p class="prompt-word">${esc(w.w)}${w.pos?` <small>${esc(w.pos)}</small>`:''}</p><p class="zh-under" lang="zh-CN">${esc(ZH[w.id])}</p>
      <p class="statement">${T('means','意思是')}: ${esc(other.def)}</p>
      <div class="tf-btns"><button class="tfb yes" data-v="1">${T('True','对')}</button><button class="tfb no" data-v="0">${T('False','错')}</button></div><div class="fb"></div>`);
    let done=false;
    const choose=v=>{ if(done) return; done=true; const ok=(v===1)===real;
      card.querySelectorAll('.tfb').forEach(b=>{ b.disabled=true; if(+b.dataset.v===(real?1:0)) b.classList.add('ok'); else b.classList.add('dim'); });
      const fb=card.querySelector('.fb'), note=`<span class="wd"><b>${esc(w.w)}</b> <span lang="zh-CN">${esc(ZH[w.id])}</span>: ${esc(w.def)}</span>`;
      ok?fbOk(fb,note):fbNo(fb,real?TX('True','对'):TX('False','错'),note);
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
  return big.length>0 && (Object.keys(g).length>=2 || Object.keys(groupsOf(zhBankAll())).length>=2); }
function playOdd(){
  const st=Stats('zhodd');
  zhShell(T('Odd one out','找出不同类'), T('Three words belong together. Tap the odd one out.','三个词属于同一类，找出不同的那个。')); st.draw();
  const step=()=>{
    const g=oddGroups(), big=Object.keys(g).filter(k=>distinctWords(g[k]).length>=3);
    const main=big[Math.floor(Math.random()*big.length)];
    const three=distinctWords(shuffle(g[main])).slice(0,3);
    let pool=g, others=Object.keys(g).filter(k=>k!==main);
    if(!others.length){ pool=groupsOf(zhBankAll()); others=Object.keys(pool).filter(k=>k!==main); }
    const oddK=others[Math.floor(Math.random()*others.length)], cands=shuffle(pool[oddK]);
    const odd=cands.find(w=>!three.some(t=>t.w===w.w)) || cands[0];
    const words=shuffle([...three,odd]);
    const card=showCard(`<p class="instr">${T('Which word is the odd one out?','哪个词不同类？')}</p>
      <div class="opts">${words.map((w,i)=>`<button class="opt" data-id="${esc(w.id)}"><kbd>${i+1}</kbd><span>${esc(w.w)}</span></button>`).join('')}</div><div class="fb"></div>`);
    const btns=[...card.querySelectorAll('.opt')]; let done=false;
    const choose=b=>{ if(done) return; done=true; const ok=b.dataset.id===odd.id;
      btns.forEach(x=>{ x.disabled=true; const w=byId[x.dataset.id];
        x.innerHTML+=`<small class="opt-zh" lang="zh-CN">${esc(ZH[w.id]||'')}</small>`;
        if(x.dataset.id===odd.id) x.classList.add('ok'); else if(x===b) x.classList.add('no'); else x.classList.add('dim'); });
      const why = CFG.odd==='pos'
        ? `<span>${T(`<b>${esc(odd.w)}</b> is ${/^[aeiou]/i.test(oddK)?'an':'a'} ${esc(oddK)}. The others are ${esc(main)}s.`, `<b>${esc(odd.w)}</b> 是 ${esc(oddK)}，其他三个是 ${esc(main)}。`)}</span>`
        : `<span>${T(`<b>${esc(odd.w)}</b> belongs to <i>${esc(oddLabel(oddK))}</i>. The others belong to <i>${esc(oddLabel(main))}</i>.`, `<b>${esc(odd.w)}</b> 属于 <i>${esc(oddLabel(oddK))}</i>，其他三个属于 <i>${esc(oddLabel(main))}</i>。`)}</span>`;
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
  const card=showCard(`<div class="end"><p class="instr">${title} · ${T('finished','结束')}</p>
    <div class="big">${score}</div><h2>${isBest?T('New best score!','新纪录！'):T('Best score','最高分')+': '+Math.max(prev,score)}</h2>
    ${missed.length?`<p class="instr" style="margin-top:22px">${T('Words to practise','需要练习的单词')}</p><ul class="review">${[...new Map(missed.map(w=>[w.id,w])).values()].map(w=>`<li><b>${esc(w.w)}</b> <span lang="zh-CN">${esc(ZH[w.id]||'')}</span> – ${esc(w.def)}</li>`).join('')}</ul>`:''}
    <div class="end-actions"><button class="btn" id="again">${T('Play again','再玩一次')}</button><a class="btn alt" href="#">${T('All games','所有游戏')}</a></div></div>`);
  card.querySelector('#again').onclick=again;
  keyHandler=e=>{ if(e.key==='Enter'){ e.preventDefault(); again(); } };
}
function timerBar(){ return `<div class="timer"><i id="timeFill"></i></div>`; }
function playSpeed(){
  const p=zhWords(), deck=Deck(zhWords), SECS=60; let score=0, missed=[], end=Date.now()+SECS*1000, over=false;
  zhShell(T('Speed round','限时挑战'), T('60 seconds: see the Chinese, choose the English word.','60 秒内看中文选英文，尽量多答对。'));
  document.getElementById('stats').innerHTML=`<span>${T('Score','得分')} <b id="sc">0</b></span><span><b id="secs">${SECS}</b>s</span>`;
  const feed=document.getElementById('feed'); feed.insertAdjacentHTML('beforebegin', timerBar());
  const tick=()=>{ if(over) return; const left=Math.max(0,end-Date.now());
    const f=document.getElementById('timeFill'); if(!f) return; f.style.width=(100*left/(SECS*1000))+'%';
    document.getElementById('secs').textContent=Math.ceil(left/1000);
    if(left<=0){ over=true; document.querySelector('.timer')?.remove(); challengeEnd('zhspeed',T('Speed round','限时挑战'),score,missed,playSpeed); } else later(tick,100); };
  const step=()=>{ if(over) return;
    const w=deck.next(), ds=distractors(w,zhPool(p),3);
    mcCard({instr:T('Choose the English word','选出英文单词'), promptHtml:`<div class="zh-prompt" lang="zh-CN">${esc(ZH[w.id])}</div>`,
      options:[w.w,...ds.map(x=>x.w)], answer:w.w,
      onResult:(ok)=>{ P.record('zhspeed',w,ok); if(ok){ score++; document.getElementById('sc').textContent=score; later(step,250); } else { missed.push(w); later(step,900); } }});
  };
  tick(); step();
}
function playSurvival(){
  const p=zhWords(), deck=Deck(zhWords); let lives=3, score=0, missed=[], limit=10000, over=false;
  zhShell(T('Survival','生存挑战'), T('Three lives. Choose the meaning before time runs out.','三条命，在时间用完前选出释义。'));
  const draw=()=>{ document.getElementById('stats').innerHTML=`<span>${T('Score','得分')} <b>${score}</b></span><span class="lives" aria-label="${lives} lives left">${'♥'.repeat(lives)}<span class="lost">${'♥'.repeat(3-lives)}</span></span>`; };
  draw();
  const feed=document.getElementById('feed'); feed.insertAdjacentHTML('beforebegin', timerBar());
  const lose=(w)=>{ lives--; missed.push(w); draw(); if(lives<=0){ over=true; document.querySelector('.timer')?.remove(); later(()=>challengeEnd('zhsurvive',T('Survival','生存挑战'),score,missed,playSurvival),1100); return false; } return true; };
  const step=()=>{ if(over) return;
    const w=deck.next(), ds=distractors(w,zhPool(p),3), start=Date.now(), my=limit; let answered=false;
    mcCard({instr:T('Choose the meaning','选出释义'), promptHtml:`<p class="prompt-word">${esc(w.w)}${w.pos?` <small>${esc(w.pos)}</small>`:''}</p><p class="zh-under" lang="zh-CN">${esc(ZH[w.id])}</p>`,
      options:[w.def,...ds.map(x=>x.def)], answer:w.def, optClass:'long',
      onResult:(ok,card,fb)=>{ answered=true; P.record('zhsurvive',w,ok);
        if(ok){ score++; limit=Math.max(4000,limit-300); draw(); later(step,300); }
        else { fb.innerHTML=`<div class="feedback no"><span class="wd"><b>${esc(w.w)}</b> <span lang="zh-CN">${esc(ZH[w.id])}</span>: ${esc(w.def)}</span></div>`; if(lose(w)) later(step,1400); } }});
    const card=document.querySelector('#feed .card');
    const tick=()=>{ if(answered||over) return; const left=Math.max(0,my-(Date.now()-start));
      const f=document.getElementById('timeFill'); if(f) f.style.width=(100*left/my)+'%';
      if(left<=0){ answered=true; P.record('zhsurvive',w,false); card.querySelectorAll('.opt').forEach(b=>{ b.disabled=true; if(b.dataset.v===w.def) b.classList.add('ok'); else b.classList.add('dim'); });
        card.querySelector('.fb').innerHTML=`<div class="feedback no"><span class="verdict">${T("Time's up!",'时间到！')}</span><span class="wd"><b>${esc(w.w)}</b> <span lang="zh-CN">${esc(ZH[w.id])}</span>: ${esc(w.def)}</span></div>`;
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
  return `<p class="set-head levels-head">${T('Level','级别')}</p><div class="sets levels" role="group" aria-label="${TX('Level','级别')}">${LEVELS.map(b=>{ const c=LEVEL_CODES[b], n=list.filter(w=>playBand(w)===b).length;
    return `<button class="chip${b===mine?' chip-good':''}" data-band="${b}" aria-pressed="${b===cb}"><span class="chip-label">${zh?`<span class="chip-en t-en">${esc(LEVEL_NAMES[c])}</span><span class="chip-zh t-zh" lang="zh-CN">${LEVEL_ZH[c]}</span>`:`<span class="chip-en">${esc(LEVEL_NAMES[c])}</span>`}</span>${n?` <span class="chip-n" title="${n} words">${n}</span>`:''}</button>`; }).join('')}</div>`;
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
  <p class="hint" style="margin-top:22px">${loggedIn()?'Your progress is saved to your account, so it is the same on every device you log in on.':'Progress is saved in this browser on this device. Clearing browsing data, or using another computer, starts again. Log in to keep it in your account.'}</p>`);
}

const loggedIn = () => { try{ const a=window.AEA_ACCOUNT && AEA_ACCOUNT.account(); return !!(a && a.token); }catch(e){ return false; } };

// ---------- WORD LIST ----------
function wordList(){
  frame({href:'#', label:CFG.name||'Back', html:SIDE==='zh'&&CFG.name?nameT(CFG.name):''}, `<div class="bar"><span class="title">${T('Word list','词汇表')}</span></div>
    <input class="search" id="q" type="search" placeholder="${TX('Search words or meanings','搜索单词或释义')}" aria-label="${TX('Search the word list','搜索词汇表')}"><div id="list"></div>`);
  let q='';
  const draw=()=>{ const t=q.trim().toLowerCase(); let html='';
    // One heading per level, the chosen level first
    const order=[chosenBand(), ...LEVELS.filter(b=>b!==chosenBand()), null].filter((b,i,a)=>a.indexOf(b)===i);
    for(const lb of order){ const ws=S.words.filter(w=>(playBand(w)??null)===lb && (!t||w.w.toLowerCase().includes(t)||w.def.toLowerCase().includes(t)||(w.syn||[]).some(x=>x.includes(t))||(ZH[w.id]||'').includes(t)));
      if(!ws.length) continue;
      const chosen=lb===chosenBand()&&LEVELS.length>1;
      const head=lb==null ? (LEVELS.length?T('Other words','其他单词'):'') : T(esc(bandName(lb))+(chosen?' · chosen level':''), LEVEL_ZH[LEVEL_CODES[lb]]+(chosen?' · 当前级别':''));
      html+=`${head?`<p class="instr" style="margin:22px 0 8px">${head}</p>`:''}<div class="wl">${ws.map(w=>`<div class="wl-row">
        <div class="w">${esc(w.w)}${w.pos?`<small>${esc(w.pos)}</small>`:''}${ZH[w.id]&&CFG.only==='zh'?`<span class="zh" lang="zh-CN">${esc(ZH[w.id])}</span>`:''}</div>
        <div class="d">${esc(w.def)}${w.ex?`<br><i>${esc(w.ex)}</i>`:''}${w.syn&&w.syn.length?`<div class="syns">≈ ${esc(w.syn.join(' · '))}</div>`:''}</div></div>`).join('')}</div>`; }
    document.getElementById('list').innerHTML=html||`<p>${T('No words match that search.','没有找到匹配的单词。')}</p>`; };
  document.getElementById('q').oninput=e=>{q=e.target.value; draw();}; draw();
}

// ---------- DAILY CIRCUIT: one station (the circuit is planned and saved by en/engine/circuit.js) ----------
// The address ends #circuit. This page chooses a game the student is ready for at their own level (not a level they
// picked), preferring one not played yet in this circuit, and plays it until the station's time is up; every answer counts.
// English side: the station's kind says which games it can use: short or long (the form in GAMES), or arcade (the games
// in CIRCUIT_ARCADE take turns, one circuit each). No long game here at the student's level: another subject is tried,
// then a short game is used. Time up in the middle of a long task: what the student has done is marked (circuitFinish).
// Chinese side (26 Oct, teacher: the same format as the English one): the same five stations and times; short = True or
// false, long = Type it, Build the sentence, Match the meaning or Choose the meaning (ZH_CIRCUIT), arcade = the same
// arcade games, with the Chinese under each meaning and every word at the chosen level. Only these games (27 Oct:
// Learn the words is no longer a station). A subject with no game ready for a station: another subject is tried for it;
// none has one: the subject is dropped from the circuit; nothing anywhere: the circuit says so.
// Left out of the circuit: Read and answer (whole passages), Word Snake, Speed round and Survival; on the Chinese side
// also 中文 → English.
// Leaving the page or the game pauses the station; coming back with #circuit carries on with the time that was left.
const CIRCUIT_ARCADE = ['invaders', 'whack'];   // Word Snake is left out for now (teacher, 25 Oct)
const ZH_CIRCUIT = {short:['zhtf'], long:['zhtype','zhbuild','zhmatch','zhmean']};
let ccTick = null;
function circuitGames(kind){
  if(SIDE==='zh'){
    if(kind==='arcade') return zhWords().length>=4 ? ARCADE.filter(g=>CIRCUIT_ARCADE.includes(g.key)).map(g=>({key:g.key, name:g.name, zh:g.zh, run:g.run})) : [];
    const keys=ZH_CIRCUIT[kind]||ZH_CIRCUIT.short;
    return ZH_GAMES.filter(g=>keys.includes(g.key) && zhReady(g)).map(g=>({key:g.key, name:g.name, zh:g.zh, run:g.run}));
  }
  if(kind==='arcade') return ARCADE.filter(g=>CIRCUIT_ARCADE.includes(g.key) && g.items().length>=g.min).map(g=>({key:g.key, name:g.name, run:g.run}));
  return GAMES.filter(g=>g.form && (!kind || g.form===kind) && !phoneOff(g) && gamesIn(g.cat).includes(g) && g.items().length>=g.min)
    .map(g=>({key:g.key, name:g.name, run:g.run}));
}
function circuitStation(){
  const C=window.AEA_CIRCUIT, run=C && C.active(SIDE);
  if(!run){ leaveCircuit(); history.replaceState(null, '', location.pathname+location.search); return route(); }
  inCircuit=true;
  const st=(C.station && C.station()) || {}, kind=st.kind||null;
  const games=circuitGames(kind);
  let cur=run.cur;
  if(cur && C.norm(cur.path)===C.norm(PAGE) && games.some(g=>g.key===cur.game)) cur=C.resume();
  else {
    if(!games.length){ inCircuit=false;
      if(kind==='long' || kind==='arcade' || SIDE==='zh' && kind==='short'){   // try another of their subjects for this station, or make it a short game
        const next=C.retryStation(PAGE);
        if(next===null && kind==='short') return C.skipTopic(PAGE);   // Chinese side: no True or false in any subject
        if(!next) return;
        if(C.norm(next)===C.norm(PAGE)) return circuitStation();
        location.href=ROOT+next+'#circuit'; return; }
      return C.skipTopic(PAGE); }   // nothing ready here: another of their subjects instead
    let g;
    if(kind==='arcade') g=games.find(x=>x.key===CIRCUIT_ARCADE[(st.arcade||0)%CIRCUIT_ARCADE.length]) || games[0];
    else { const played=run.results.map(r=>r.game), fresh=games.filter(x=>!played.includes(x.key)), from=fresh.length ? fresh : games;
      g=from[Math.floor(Math.random()*from.length)]; }
    cur=C.begin({path:PAGE, topic:CFG.name||'', game:g.key, name:g.name, zh:g.zh||''});
  }
  games.find(g=>g.key===cur.game).run();
  circuitBar(cur);
}
function stopCircuitBar(){
  if(ccTick){ clearInterval(ccTick); ccTick=null; }
  ['ccBar','ccOver'].forEach(id=>{ const el=document.getElementById(id); if(el) el.remove(); });
  document.body.classList.remove('in-circuit');
}
function leaveCircuit(){ if(inCircuit){ inCircuit=false; if(window.AEA_CIRCUIT) AEA_CIRCUIT.pause(PAGE); } stopCircuitBar(); }
// The bar along the bottom: station, game, time left, Stop
function circuitBar(cur){
  const C=window.AEA_CIRCUIT, zh=SIDE==='zh', run=C.active(SIDE); stopCircuitBar(); if(!run) return;
  document.body.classList.add('in-circuit');
  const bar=document.createElement('div'); bar.id='ccBar'; bar.className='cc-bar';
  bar.innerHTML=`<div class="cc-in"><span class="cc-st">${T('Daily Circuit','每日挑战')} · <b>${Math.min(run.i+1, run.n)}</b>/${run.n}</span>
    <span class="cc-game">${zh ? nameT(cur.topic) : esc(cur.topic)} · ${zh&&cur.zh ? T(esc(cur.name), esc(cur.zh)) : esc(cur.name)}</span>
    <span class="cc-time" aria-hidden="true"><i id="ccFill"></i></span><b class="cc-secs" id="ccSecs" aria-label="seconds left"></b>
    <button class="cc-stop" type="button">${T('Stop','暂停')}</button></div>`;
  document.body.appendChild(bar);
  bar.querySelector('.cc-stop').onclick=()=>{ leaveCircuit(); location.href=ROOT+SIDE+'/circuit/index.html'; };
  const total=(cur.secs||run.secs||60)*1000;
  const tick=()=>{ const r=C.active(SIDE), c=r && r.cur; if(!c || !inCircuit || c.left!=null){ stopCircuitBar(); return; }
    const left=Math.max(0, c.ends-Date.now()), f=document.getElementById('ccFill'), sx=document.getElementById('ccSecs');
    if(f) f.style.width=(100*left/total)+'%'; if(sx) sx.textContent=Math.ceil(left/1000)+'s';
    if(left<=0) stationOver(); };
  tick(); if(document.getElementById('ccBar')) ccTick=setInterval(tick, 250);
}
// The station's time is up: show its score, then go on to the next station (or the results)
function stationOver(){
  if(ccTick){ clearInterval(ccTick); ccTick=null; }
  if(circuitFinish){ try{ circuitFinish(); }catch(e){ console.warn(e); } circuitFinish=null; }   // mark a half-done long task
  if(circuitStop){ circuitStop(); circuitStop=null; }   // stop an arcade game
  clearTimers(); keyHandler=null;
  const C=window.AEA_CIRCUIT, zh=SIDE==='zh', out=C.endStation(); if(!out) return leaveCircuit();
  const r=out.res || {right:0, answered:0, pts:0};
  const over=document.createElement('div'); over.className='cc-over'; over.id='ccOver';
  over.innerHTML=`<div class="cc-box" role="dialog" aria-modal="true" aria-labelledby="ccH"><p class="instr">${T(`Station ${out.i} of ${out.n} done`, `第 ${out.i} 站完成（共 ${out.n} 站）`)}</p>
    <h2 id="ccH">${T(`${r.right} right`, `答对 ${r.right} 题`)}</h2>
    <p class="cc-sub">${T(`${r.answered} answer${r.answered===1?'':'s'}${r.pts?` · +${r.pts} point${r.pts===1?'':'s'}`:''}`, `作答 ${r.answered} 次${r.pts?` · +${r.pts} 积分`:''}`)}</p>
    <button class="btn" id="ccNext">${out.next ? T('Next station','下一站')+' →' : T('See your results','查看结果')+' →'}</button><p class="cc-auto" id="ccAuto"></p></div>`;
  document.body.appendChild(over);
  let n=4, gone=false, cd=null;
  const go=()=>{ if(gone) return; gone=true; clearInterval(cd);
    if(!out.next){ inCircuit=false; location.href=C.resultsUrl(SIDE); return; }
    if(C.norm(out.next)===C.norm(PAGE)){ over.remove(); circuitStation(); }
    else { inCircuit=false; location.href=ROOT+out.next+'#circuit'; } };
  const say=()=>{ const a=document.getElementById('ccAuto'); if(a) a.textContent=n>0 ? TX(`Next in ${n}…`, `${n} 秒后继续…`) : ''; };
  say(); cd=setInterval(()=>{ n--; say(); if(n<=0) go(); }, 1000);
  const b=document.getElementById('ccNext'); b.onclick=go; b.focus({preventScroll:true});
  keyHandler=e=>{ if(e.key==='Enter'){ e.preventDefault(); go(); } };
}
window.addEventListener('pagehide', ()=>{ if(inCircuit && window.AEA_CIRCUIT) AEA_CIRCUIT.pause(PAGE); });
window.addEventListener('pageshow', e=>{ if(e.persisted && location.hash==='#circuit'){ inCircuit=false; route(); } });
window.addEventListener('pageshow', e=>{ if(e.persisted && /^#class-/.test(location.hash)){ leaveClass(); route(); } });

// ---------- CLASS GAME (29 Oct 2026): a game the teacher set for the class (teacher page → Class games) ----------
// The address ends #class-<game id>; the card on the topic lists (en/engine/classgame.js) links here. The game is the
// Daily Circuit's five stations (quick, longer, arcade, longer, quick) on this one subject, each a fifth of the time the
// teacher set (10 minutes: two minutes each). Differences from the circuit:
// - Level: the student's own level for this subject (Chinese version: the level they chose, as in the circuit), but never
//   below the lowest level the teacher set for them; higher is fine (classBand).
// - Score: +1 for each right answer, -1 for each wrong one, never below 0, the same at every level (classCount). Points
//   and word stages are earned as usual.
// - The clock is the server's: it starts when the student presses Start and keeps running when they leave the page.
//   Coming back (a crash, a closed tab) carries on with the time that is left; which station they are on comes from the
//   time, so nothing has to be saved for that. The score is sent to the server every few seconds and at the end, so the
//   teacher sees it live.
// - At the end: the score, and whether it reaches the score the teacher set. Below it: Play again (a new go).
const CLASS_KEY = 'aea:classgame:v1', CLASS_PLAN = ['short','long','arcade','long','short'];
let classRun = null, classTick = null, classSendT = null;
const classLocal = () => { try{ return JSON.parse(localStorage.getItem(CLASS_KEY)) || {}; }catch(e){ return {}; } };
function classSave(){ const c=classRun; if(!c) return; const all=classLocal(), now=Date.now();
  Object.keys(all).forEach(k=>{ if(now-(all[k].t||0) > 864e5) delete all[k]; });
  all[c.attempt]={score:c.score, right:c.right, wrong:c.wrong, games:c.games, t:now};
  try{ localStorage.setItem(CLASS_KEY, JSON.stringify(all)); }catch(e){} }
// The level a class game plays at: the student's own (or chosen, on the Chinese version), never below the teacher's lowest
// level. A subject without that level uses the next one up, or its top level.
function classBand(){
  if(!LEVELS.length) return null;
  const own=SIDE==='zh' && pickedBand!=null && LEVELS.includes(pickedBand) ? pickedBand : myBand();
  const want=Math.max(own||1, (classRun && classRun.minLevel)||1);
  const up=LEVELS.find(b=>b>=want); return up!=null ? up : LEVELS[LEVELS.length-1];
}
// Every answer in a class game: +1 right, -1 wrong (not below 0)
function classCount(ok){
  const c=classRun; if(!c || Date.now()>c.ends+1500) return;
  if(ok){ c.right++; c.score++; } else { c.wrong++; c.score=Math.max(0, c.score-1); }
  classSave(); classScore(ok); classSend();
}
// The score to the server: at most every 4 seconds while playing, and straight away at the end (final) or when the
// student leaves the game (now)
function classSend(final, now){
  const c=classRun; if(!c || !window.AEA_ACCOUNT) return Promise.resolve(null);
  const body={score:c.score, right:c.right, wrong:c.wrong, level:chosenBand(), games:c.games, finished:!!final};
  if(!final && !now){ const wait=4000-(Date.now()-(c.sent||0)); if(wait>0){ if(!classSendT) classSendT=setTimeout(()=>{ classSendT=null; classSend(); }, wait); return Promise.resolve(null); } }
  clearTimeout(classSendT); classSendT=null; c.sent=Date.now();
  return AEA_ACCOUNT.request('/api/student/attempts/'+c.attempt, body).catch(e=>{ console.warn('Class game score not sent:', e.message); return null; });
}
const classClock = ms => { const s=Math.max(0, Math.ceil(ms/1000)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
function classPanel(html){
  frame({href:'../index.html', label:'', html:T('All topics','所有主题')}, `<section class="cg-panel">${html}</section>`);
}
// Open #class-<id>: check the game, say how it works, start (or carry on with time left)
async function classOpen(id){
  leaveClass(); stopCircuitBar(); inCircuit=false;
  const A=window.AEA_ACCOUNT, acct=A && A.account();
  if(!acct || !acct.token) return classPanel(`<p class="cg-k">${T('Class game','课堂游戏')}</p><h1>${T('Log in to play','请先登录')}</h1>
    <p>${T('Class games are saved to your account, so log in with the name and password from your teacher.','课堂游戏的成绩保存在你的账户里，请用老师给你的名字和密码登录。')}</p>
    <p class="cg-actions"><a class="btn" href="${ROOT}login/index.html?from=${encodeURIComponent(location.pathname+location.hash)}">${T('Log in','登录')} →</a></p>`);
  classPanel(`<p class="cg-k">${T('Class game','课堂游戏')}</p><p>${T('Loading…','加载中…')}</p>`);
  let list;
  try{ list=await A.request('/api/student/games'); }
  catch(e){ return classPanel(`<p class="cg-k">${T('Class game','课堂游戏')}</p><h1>${T('Can’t load the game','无法加载游戏')}</h1><p>${esc(e.message)}</p>
    <p class="cg-actions"><a class="btn" href="#class-${id}" onclick="location.reload();return false">${T('Try again','再试一次')}</a></p>`); }
  if(location.hash!=='#class-'+id) return;
  const g=(list.games||[]).find(x=>x.id===id);
  if(!g) return classPanel(`<p class="cg-k">${T('Class game','课堂游戏')}</p><h1>${T('This game has finished','这个游戏已经结束了')}</h1>
    <p>${T('Your teacher has closed it, or it is for another class.','老师已经关闭了它，或者它是别的班级的。')}</p>`);
  const bare=p=>String(p).replace(/index\.html$/, '');
  if(bare(g.path)!==bare(PAGE)){ location.replace(ROOT+g.path+'#class-'+id); return; }   // the student's version of the subject is the other one
  const name=T(esc(g.name), esc(g.zh||g.name));
  if(g.status==='passed') return classPanel(`<p class="cg-k">${T('Class game','课堂游戏')} · ${name}</p><h1>✓ ${T('Done','完成')}</h1>
    <div class="cg-big">${g.score}<small> ${T('points','分')}</small></div><p>${T(`Score needed: ${g.minScore}.`, `目标分数：${g.minScore}。`)}${g.late?' '+T('Handed in late.','迟交。'):''}</p>
    <p class="cg-actions"><a class="btn alt" href="../index.html">${T('Back to topics','返回主题')}</a></p>`);
  if(g.status==='playing') return classBegin(id);
  const per=Math.round(g.minutes*60/CLASS_PLAN.length), perTxt=per%60 ? `${per} seconds` : `${per/60} minute${per===60?'':'s'}`, perZh=per%60 ? `${per} 秒` : `${per/60} 分钟`;
  classPanel(`<p class="cg-k">${T('Class game','课堂游戏')}${g.status==='below'?' · '+T('Play again','再玩一次'):''}</p><h1>${name}</h1>
    <ul class="cg-facts"><li><b>${T(`${g.minutes} minute${g.minutes===1?'':'s'}`, `${g.minutes} 分钟`)}</b>: ${T(`five games of ${perTxt} each, at your level.`, `五个游戏，每个 ${perZh}，难度适合你。`)}</li>
      <li><b>+1</b> ${T('for each right answer,','答对一题加 1 分，')} <b>−1</b> ${T('for each wrong one.','答错一题减 1 分。')}</li>
      ${g.minScore?`<li>${T(`Score needed: <b>${g.minScore}</b>.`, `目标分数：<b>${g.minScore}</b>。`)}</li>`:''}
      ${g.status==='below'?`<li>${T(`Last time: <b>${g.score}</b>.`, `上一次：<b>${g.score}</b> 分。`)}</li>`:''}
      <li>${T('The clock starts when you press Start and doesn’t stop, even if you leave the page.','按“开始”后计时开始，离开页面也不会停。')}</li></ul>
    <p class="cg-actions"><button class="btn big" type="button" id="cgGo">${T('Start','开始')} →</button></p><p class="cg-err" id="cgErr" hidden></p>`);
  const go=document.getElementById('cgGo'); go.focus({preventScroll:true});
  go.onclick=()=>{ go.disabled=true; classBegin(id, ()=>{ go.disabled=false; }); };
  keyHandler=e=>{ if(e.key==='Enter'){ e.preventDefault(); go.click(); } };
}
async function classBegin(id, failed){
  let r;
  try{ r=await AEA_ACCOUNT.request('/api/student/games/'+id+'/start', {}); }
  catch(e){ const el=document.getElementById('cgErr'); if(el){ el.textContent=e.message; el.hidden=false; } else classPanel(`<h1>${T('Can’t start the game','无法开始游戏')}</h1><p>${esc(e.message)}</p>`); if(failed) failed(); return; }
  if(location.hash!=='#class-'+id) return;
  const a=r.attempt, here=classLocal()[a.id], mine=here && (here.right+here.wrong)>=(a.right+a.wrong) ? here : null;
  classRun={id, attempt:a.id, n:a.n, ends:Date.now()+a.msLeft, total:a.msTotal, minLevel:r.minLevel, minScore:r.game.minScore,
    name:r.game.name, zh:r.game.zh, score:mine?mine.score:a.score, right:mine?mine.right:a.right, wrong:mine?mine.wrong:a.wrong,
    games:(mine && mine.games) || a.games || [], station:-1, sent:0};
  classSave();
  if(a.msLeft<=0) return classEnd();
  classTick=setInterval(classStep, 250); classStep();
}
// Every quarter second: the time, and moving on to the next station when its time is up
function classStep(){
  const c=classRun; if(!c) return;
  const left=c.ends-Date.now();
  if(left<=0) return classEnd();
  const i=Math.min(CLASS_PLAN.length-1, Math.floor((c.total-left)/(c.total/CLASS_PLAN.length)));
  if(i!==c.station){
    const first=c.station<0; c.station=i;
    if(first) classStation(i);
    else { classStop(); classBetween(i); }
  }
  const f=document.getElementById('ccFill'), s=document.getElementById('ccSecs');
  if(f) f.style.width=(100*left/c.total)+'%'; if(s) s.textContent=classClock(left);
}
// Stop the game on screen (a long task half done is marked, an arcade game stopped), as at the end of a circuit station
function classStop(){
  if(circuitFinish){ try{ circuitFinish(); }catch(e){ console.warn(e); } circuitFinish=null; }
  if(circuitStop){ circuitStop(); circuitStop=null; }
  clearTimers(); keyHandler=null;
}
// Between stations: two seconds to see the score and what's next (the clock keeps going)
function classBetween(i){
  const c=classRun, over=document.createElement('div'); over.className='cc-over'; over.id='ccOver';
  over.innerHTML=`<div class="cc-box" role="dialog" aria-modal="true" aria-labelledby="ccH"><p class="instr">${T(`Game ${i} of ${CLASS_PLAN.length} done`, `第 ${i} 个游戏完成（共 ${CLASS_PLAN.length} 个）`)}</p>
    <h2 id="ccH">${T(`Score: ${c.score}`, `得分：${c.score}`)}</h2><p class="cc-sub">${T('Next game…','下一个游戏…')}</p></div>`;
  document.body.appendChild(over);
  setTimeout(()=>{ over.remove(); if(classRun===c && c.station===i) classStation(i); }, 2000);
}
// One station: a game of the station's kind at the class level; nothing of that kind here: another kind
function classStation(i){
  const c=classRun; if(!c) return;
  inCircuit=true; P.refresh();
  const kinds=[CLASS_PLAN[i], ...({short:['long','arcade'], long:['short','arcade'], arcade:['short','long']})[CLASS_PLAN[i]]];
  let games=[], kind=null;
  for(const k of kinds){ games=circuitGames(k); if(games.length){ kind=k; break; } }
  if(!games.length){ classPanel(`<p class="cg-k">${T('Class game','课堂游戏')}</p><h1>${T('No game at your level here','这里没有适合你水平的游戏')}</h1><p>${T('Tell your teacher.','请告诉老师。')}</p>`); return classBar(null); }
  let g=games.find(x=>x.key===c.games[i]);
  if(!g){
    if(kind==='arcade') g=games.find(x=>x.key===CIRCUIT_ARCADE[(c.attempt+i)%CIRCUIT_ARCADE.length]) || games[0];
    else { const fresh=games.filter(x=>!c.games.includes(x.key)), from=fresh.length ? fresh : games; g=from[Math.floor(Math.random()*from.length)]; }
    c.games[i]=g.key; classSave();
  }
  g.run(); classBar(g);
}
// The bar along the bottom: which game, the time left (the whole game), the score
function classBar(g){
  const c=classRun; stopCircuitBar(); if(!c) return;
  document.body.classList.add('in-circuit');
  const bar=document.createElement('div'); bar.id='ccBar'; bar.className='cc-bar cg-bar';
  bar.innerHTML=`<div class="cc-in"><span class="cc-st">${T('Class game','课堂游戏')} · <b>${c.station+1}</b>/${CLASS_PLAN.length}</span>
    <span class="cc-game">${SIDE==='zh' ? T(esc(c.name), esc(c.zh||c.name)) : esc(c.name)}${g?` · ${SIDE==='zh'&&g.zh ? T(esc(g.name), esc(g.zh)) : esc(g.name)}`:''}</span>
    <span class="cc-time" aria-hidden="true"><i id="ccFill"></i></span><b class="cc-secs" id="ccSecs" aria-label="time left"></b>
    <span class="cg-score">${T('Score','得分')} <b id="cgScore">${c.score}</b></span></div>`;
  document.body.appendChild(bar); classStep();
}
function classScore(ok){
  const b=document.getElementById('cgScore'); if(!b || !classRun) return;
  b.textContent=classRun.score; const p=b.parentNode; p.classList.remove('up','down'); void p.offsetWidth; p.classList.add(ok?'up':'down');
}
// Time is up: stop, send the final score, show the result
async function classEnd(){
  const c=classRun; if(!c || c.ending) return; c.ending=true;
  clearInterval(classTick); classTick=null;
  classStop(); stopCircuitBar(); inCircuit=false;
  const over=document.getElementById('ccOver'); if(over) over.remove();
  classPanel(`<p class="cg-k">${T('Class game','课堂游戏')}</p><h1>${T('Time’s up!','时间到！')}</h1><p>${T('Saving your score…','正在保存成绩…')}</p>`);
  let r=null; for(let k=0;k<3 && !r;k++){ r=await classSend(true); if(!r) await new Promise(ok=>setTimeout(ok, 2500)); }
  classRun=null;
  if(location.hash!=='#class-'+c.id) return;
  const score=r ? r.score : c.score, need=c.minScore, passed=score>=need;
  const name=SIDE==='zh' ? T(esc(c.name), esc(c.zh||c.name)) : esc(c.name);
  classPanel(`<p class="cg-k">${T('Class game','课堂游戏')} · ${name}</p><h1>${T('Time’s up!','时间到！')}</h1>
    <div class="cg-big">${score}<small> ${T('points','分')}</small></div>
    <p>${T(`${c.right} right · ${c.wrong} wrong`, `答对 ${c.right} · 答错 ${c.wrong}`)}</p>
    ${!r ? `<p class="cg-err">${T('Your score couldn’t be sent to your teacher yet (no connection). It was saved during the game; tell your teacher if it doesn’t show.','暂时无法把成绩发给老师（没有网络）。游戏中的成绩已经保存；如果老师看不到，请告诉老师。')}</p>` : ''}
    ${need ? (passed ? `<p class="cg-pass">✓ ${T(`You reached the score needed (${need}). Well done!`, `你达到了目标分数（${need}）。真棒！`)}${r && r.late?' '+T('(Late.)','（迟交。）'):''}</p>`
      : `<p class="cg-below">${T(`You need ${need} to pass. Have another go!`, `需要 ${need} 分才能通过，再试一次吧！`)}</p>`) : ''}
    <p class="cg-actions">${need && !passed ? `<a class="btn" href="#class-${c.id}" id="cgAgain">${T('Play again','再玩一次')} →</a>` : ''}<a class="btn alt" href="../index.html">${T('Back to topics','返回主题')}</a></p>`);
  const again=document.getElementById('cgAgain'); if(again) again.onclick=e=>{ e.preventDefault(); classOpen(c.id); };
}
// Leaving the game (another page or another part of this page): the clock keeps running on the server; send the score
function leaveClass(){
  if(!classRun) return;
  clearInterval(classTick); classTick=null; classStop(); classSend(false, true); classRun=null; inCircuit=false; stopCircuitBar();
}
window.addEventListener('pagehide', ()=>{ const c=classRun; if(c && window.AEA_ACCOUNT && AEA_ACCOUNT.beacon)
  AEA_ACCOUNT.beacon('/api/student/attempts/'+c.attempt, {score:c.score, right:c.right, wrong:c.wrong, level:chosenBand(), games:c.games}); });

// ---------- router ----------
function route(){
  const h=location.hash.replace(/^#/,''), cg=/^class-(\d+)$/.exec(h);
  if(cg && (!CFG.only || CFG.only==='zh')){ if(!classRun || classRun.id!==+cg[1]) classOpen(+cg[1]); return; }
  if(classRun) leaveClass();
  if(h==='circuit' && !CFG.only || h==='circuit' && CFG.only==='zh') return circuitStation();
  if(inCircuit || document.getElementById('ccBar')) leaveCircuit();
  if(CFG.only==='progress') return progressPage();
  if(CFG.only==='passage'){   // a page that is just one reading game (e.g. Close reading)
    const back={href:CFG.back||'../index.html', label:CFG.backLabel||'Back'};
    const listen=CFG.format==='listening', what=listen ? 'listening tests' : 'passages';   // Listening also works on phones
    const msg = PHONE && !listen ? 'Reading games are only available on desktop devices. Open this page on a computer to play.'
      : readingState==='loading' ? `Loading ${what}…`
      : readingState==='failed' ? `The ${what} could not be loaded. They load when the site is online.`
      : !(S.passages||[]).length ? `No ${what} yet. Check back soon.` : '';
    if(msg) return frame(back, `<section class="hero"><p class="eyebrow">${esc(CFG.eyebrow||'Reading')}</p><h1>${esc(CFG.name||'')}</h1>${CFG.blurb?`<p>${esc(CFG.blurb)}</p>`:''}<p class="notice">${msg}</p></section>`);
    if(CFG.format==='notes') return playNotes();
    if(listen) return playListening();
    GAMES.find(g=>g.key==='passage').name = CFG.name || 'Read and answer';
    return playPassage();
  }
  if(CFG.only==='zh'){
    if(h==='words') return wordList();
    if(h==='learn') return zhLevelWords().length>=4 ? playLearn() : zhMenu();
    const g=ZH_GAMES.find(x=>'play-'+x.key===h);
    return g && zhReady(g) ? g.run() : zhMenu();
  }
  if(!h) return menu();
  if(h==='words') return wordList();
  if(CATS[h]) return category(h);
  if(h.startsWith('play-')){
    const a=ARCADE.find(x=>x.key===h.slice(5));   // arcade games (not on the menu yet)
    if(a) return a.items().length>=a.min ? a.run() : menu();
    const g=GAMES.find(x=>x.key===(h==='play-syn'?'match':h.slice(5)));   // Synonym groups is now part of Match the meaning
    if(g && !HIDE.has(g.key) && !phoneOff(g) && g.items().length>=g.min) return g.run();
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
