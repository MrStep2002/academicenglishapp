// English games engine: one set of games for every subject.
// A topic page says where its content is (data-content: a folder of CSV files, see content/README.md); this file loads it.
// Routes (the part after # in the address): menu, #vocab, #grammar, #reading, #play-<game>, #words
(function(){
'use strict';
// The site's top folder, worked out from where this file lives (en/engine/app.js), so links work on any host and from a local copy
const ROOT = ((document.currentScript && document.currentScript.src) || '/en/engine/app.js').replace(/en\/engine\/app\.js([?#].*)?$/, '');
const $app = document.getElementById('app');
const CFG = $app.dataset;   // data-name, data-blurb, data-back, data-back-label, data-only, data-content, data-reading, data-format, data-store, data-odd, data-hide, data-list, data-linked
const KEY = CFG.store || (CFG.content||'').replace(/\/+$/,'').split('/').pop() || 'topic';   // where this page's progress is saved
const SIDE = (CFG.only==='zh' || /^zh/.test(KEY)) ? 'zh' : 'en';
// The new look (redesign stage 2, 8 Nov 2026): English pages with the site shell (en/engine/shell.js: sidebar and top bar)
// draw their games in the new layout: the path in the top bar (Home / Descriptive language / Fill the gap) instead of the
// back link, the game with a side panel beside it (This round, Playing at, Keys, More in this subject), and on the
// Reading Comprehension pages the passage beside both questions with one Confirm. See frame(), gameLayout() and
// css/site.css (4. Game pages). The Chinese side (stage 4, 8 Nov 2026): the same layout, in Chinese, when the page loads the
// shell with data-side="zh" (every label through T(), so the English / 中文 switch still works).
const NEW_UI = !!(window.AEA_SHELL && window.AEA_SHELL.crumbs);
// Generated games (Science, 3 Nov 2026): a page can load a module before this file that makes questions by rules from
// data tables (en/engine/chem.js sets window.AEA_GEN). See GENERATED GAMES and SYLLABUS TOPICS below. Every other page: null.
const GEN = window.AEA_GEN || null;
// Chinese side: instructions in ONE language at a time (26 Oct; teacher: both languages together "look super messy").
// The English / 中文 switch next to the points bar (account.js) saves 'en' or 'zh' in aea:ui-lang and sets
// <html data-ui="en|zh">; the CSS then hides the other language. Chinese is the default. The words being learned
// (English words, their Chinese, meanings, examples) are content: they always show, whatever the switch says.
// T(en, zh): both, each in its own span, for HTML (the English side just gets the English).
// TX(en, zh): only the chosen one, for text that can't hold HTML (textContent, placeholders, aria-labels).
// ZH_UI: the page is in both languages: the Chinese side, and My progress opened from it (stage 4: the shell says so)
const ZH_UI = SIDE==='zh' || (CFG.only==='progress' && !!window.AEA_SHELL && window.AEA_SHELL.side==='zh');
function uiLang(){ try{ return localStorage.getItem('aea:ui-lang')==='en' ? 'en' : 'zh'; }catch(e){ return 'zh'; } }
function T(en, zh){ return ZH_UI ? `<span class="t-en">${en}</span><span class="t-zh" lang="zh-CN">${zh}</span>` : en; }
function TX(en, zh){ return ZH_UI && uiLang()==='zh' ? zh : en; }
// A bilingual name from the page ("Web design 网页设计"): the English, the Chinese, and both as T()
function splitName(s){ s=String(s||''); const i=s.search(/[\u3400-\u9fff]/); return i>0 ? {en:s.slice(0,i).trim(), zh:s.slice(i).trim()} : {en:s, zh:''}; }
function nameT(s){ const n=splitName(s); return n.zh ? T(esc(n.en), esc(n.zh)) : esc(n.en); }
const PAGE = location.href.split('#')[0].split('?')[0].slice(ROOT.length);   // this page, from the site's top folder (e.g. zh/web-design/index.html)
// The logo's mouse, top left of every page: a link to the homepage
const HOME_MARK = '<svg viewBox="0 0 290 240" aria-hidden="true" focusable="false"><path fill="currentColor" fill-rule="evenodd" d="M143.1 233.8C141.4 233.7 138.2 232.7 136.3 231.8C130.2 228.9 126.4 223.1 126.1 216.1C126.0 213.8 126.0 213.0 126.5 211.3C127.8 205.8 131.2 201.7 136.3 199.1C138.9 197.8 140.7 197.4 144.5 197.4C148.4 197.4 150.2 197.7 153.4 199.3C160.6 202.7 164.8 211.0 163.1 218.6C162.3 222.0 159.5 227.3 157.4 229.2C155.5 230.9 152.6 232.6 150.0 233.4C148.6 233.8 144.9 234.0 143.1 233.8ZM167.9 212.3C167.5 212.2 167.4 211.9 167.1 210.2C167.0 209.5 166.7 208.4 166.4 207.9L165.9 206.8L166.8 205.1C167.3 204.1 167.8 203.1 167.9 202.8C168.3 201.4 171.6 195.0 173.2 192.6C173.6 191.8 174.0 191.2 174.0 191.1C174.0 190.7 177.1 185.8 178.5 183.9C183.0 177.7 184.9 175.4 187.4 172.7C189.1 171.0 191.0 168.8 191.9 167.9C194.1 165.3 196.2 163.2 200.1 159.9C209.5 151.8 217.1 143.0 219.4 137.2C221.3 132.2 221.8 130.1 221.9 124.4C222.0 120.2 222.0 119.3 221.5 116.6C220.8 112.7 220.0 110.4 218.4 107.4C215.5 101.8 212.3 97.8 207.9 93.8C202.3 88.9 199.4 86.9 192.9 83.7C184.1 79.3 177.5 77.2 164.0 74.6C155.8 73.0 154.1 72.9 144.6 72.9C137.6 72.9 135.7 73.0 132.0 73.5C124.9 74.4 117.5 76.0 109.0 78.6C98.4 81.7 88.7 86.9 81.4 93.4C79.5 95.0 74.4 101.2 73.0 103.6C72.5 104.4 71.9 105.5 71.5 106.0C70.6 107.3 69.2 110.4 68.6 112.1C66.8 117.4 66.4 125.9 67.7 131.5C69.0 136.8 70.5 140.0 73.9 144.6C78.8 151.1 81.9 154.3 87.6 158.9C89.9 160.7 92.5 163.1 94.6 165.3C96.4 167.3 99.5 170.6 101.5 172.7C105.7 176.9 107.3 179.0 110.5 184.1C111.8 186.0 113.8 189.1 115.0 190.9C116.2 192.8 117.8 195.5 118.5 196.9C122.2 204.5 122.7 205.8 122.7 206.7C122.7 207.8 121.2 211.8 120.7 212.1C120.2 212.4 111.3 211.1 107.1 210.1C102.5 209.1 91.7 205.2 86.3 202.6C80.4 199.8 69.0 191.3 63.7 185.8C58.3 180.2 52.7 172.4 50.5 167.2C50.1 166.2 49.5 164.9 49.3 164.4C48.0 161.7 46.0 155.6 45.5 153.4C44.3 147.4 43.9 143.2 44.1 137.1C44.2 132.8 44.3 130.7 44.7 128.5C45.6 123.7 46.7 119.4 47.7 116.6C48.4 114.3 48.4 114.2 45.9 113.5C43.4 112.7 38.6 110.7 35.9 109.4C30.9 107.0 25.2 102.5 20.6 97.5C16.4 92.8 15.7 92.1 14.1 89.4C12.2 86.1 11.2 84.1 9.7 79.9C7.0 72.7 6.2 68.2 6.2 60.6C6.1 53.7 6.8 49.6 9.0 43.5C11.8 35.7 14.2 31.5 19.0 25.9C24.9 19.1 30.1 15.1 37.7 11.5C42.3 9.4 46.0 8.2 53.1 6.6C57.2 5.7 67.2 5.6 70.4 6.4C71.1 6.6 72.1 6.8 72.8 6.9C73.9 7.0 76.6 7.8 79.2 8.6C82.1 9.6 88.8 12.6 90.5 13.7C90.8 14.0 91.8 14.6 92.6 15.1C96.2 17.4 102.4 23.1 105.1 26.6C109.5 32.3 111.2 35.5 113.9 43.4C115.2 47.3 115.7 49.2 115.9 51.9C116.2 55.1 116.3 55.2 119.2 54.0C120.5 53.6 122.7 53.0 128.4 51.6C129.2 51.4 131.4 51.0 133.4 50.7C136.5 50.2 137.7 50.1 144.6 50.1C151.5 50.1 152.8 50.2 155.9 50.7C161.4 51.6 167.7 53.1 171.3 54.3C174.1 55.2 174.1 55.2 174.4 52.3C175.0 44.8 178.2 35.8 182.2 30.0C186.0 24.6 192.2 18.2 196.5 15.5C202.7 11.4 210.5 8.2 217.5 6.7C222.9 5.6 233.1 5.5 237.6 6.7C246.6 8.9 254.0 11.9 259.4 15.6C264.8 19.3 267.9 22.3 272.0 27.6C275.7 32.5 276.6 33.8 278.1 37.0C281.9 44.9 283.5 52.1 283.5 60.8C283.5 67.2 282.8 72.0 281.4 76.4C278.8 84.1 277.1 87.4 272.6 93.4C270.4 96.3 264.9 101.9 262.4 103.7C257.7 107.1 256.5 107.9 254.6 109.0C252.1 110.4 249.3 111.6 244.9 113.0C243.2 113.6 241.6 114.2 241.3 114.4C240.6 114.9 240.6 114.7 241.9 120.0C244.1 128.4 244.8 132.6 244.8 139.3C244.8 145.9 244.2 149.8 242.2 156.4C241.8 157.8 241.3 159.5 241.1 160.2C240.2 163.5 236.9 170.5 234.8 173.4C231.1 178.9 229.2 181.3 225.8 184.9C219.5 191.7 216.1 194.3 206.1 200.5C202.4 202.8 192.2 207.3 188.0 208.6C183.3 210.0 175.4 211.6 171.3 212.0C169.9 212.1 168.6 212.3 168.5 212.3C168.5 212.4 168.2 212.4 167.9 212.3ZM107.6 152.2C104.2 151.2 102.4 150.1 100.7 147.7C97.5 143.6 96.6 138.9 98.1 134.9C99.8 130.3 103.0 127.3 107.4 126.1C109.3 125.6 113.2 125.6 115.1 126.1C119.9 127.4 123.3 130.7 124.5 135.4C125.4 138.8 125.0 142.5 123.5 145.7C122.7 147.2 119.8 150.2 118.1 151.1C115.3 152.7 110.7 153.2 107.6 152.2ZM175.6 152.2C172.6 151.8 168.8 149.2 167.0 146.2C165.9 144.3 165.0 141.1 165.0 139.0C165.0 134.7 168.3 129.1 171.8 127.5C175.2 125.8 174.9 125.9 178.6 125.9C181.7 125.9 182.3 125.9 183.6 126.5C186.4 127.6 187.8 128.6 189.7 130.9C192.4 134.2 193.2 141.0 191.2 145.4C190.2 147.7 187.1 150.5 184.5 151.5C182.1 152.4 178.7 152.7 175.6 152.2ZM234.9 95.0C240.8 93.7 246.5 91.0 250.7 87.4C253.5 85.0 254.6 83.8 256.6 81.2C259.8 76.8 262.2 70.9 262.8 65.9C263.3 61.2 262.8 54.9 261.5 50.6C260.1 46.1 255.7 39.2 251.8 35.4C248.2 32.0 243.6 29.5 237.8 27.6C231.9 25.8 224.3 25.7 218.1 27.5C216.0 28.1 211.5 30.3 208.9 32.0C206.1 33.8 202.3 37.8 200.1 41.0C197.0 45.6 196.4 47.2 195.1 54.0C194.5 57.2 194.7 63.0 195.6 65.3C197.3 70.0 199.7 73.0 208.4 81.3C212.1 84.8 216.7 89.2 218.7 91.0C220.7 92.9 222.7 94.6 223.1 94.9C225.2 95.8 230.7 95.9 234.9 95.0ZM62.6 95.1C66.5 94.5 68.2 93.6 72.2 89.5C73.7 88.1 77.5 84.5 80.7 81.5C87.9 74.9 91.6 70.8 93.3 67.5C93.5 66.9 94.1 65.5 94.4 64.4C95.0 62.5 95.1 62.0 95.1 57.8C95.1 53.7 95.1 52.8 94.5 50.9C93.4 46.3 91.5 42.5 88.6 39.0C83.2 32.3 76.1 28.1 68.1 26.8C64.1 26.2 60.8 26.1 57.3 26.6C48.7 27.8 43.2 30.5 37.4 36.4C33.9 39.9 32.6 41.8 30.5 46.1C27.8 51.8 27.1 54.9 27.1 61.6C27.1 67.9 27.5 69.9 29.9 75.5C31.5 79.2 33.3 81.9 35.8 84.7C39.0 88.4 42.7 91.0 47.1 92.8C53.0 95.2 57.4 95.9 62.6 95.1Z"/></svg>';   // English and Chinese points are kept apart
const AUTO_MS = 700;   // how long the green bar runs after a right answer before the next card
// (General knowledge waits twice as long, so the fact under the answer can be read: 1 Nov 2026, teacher)

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
  // (10 Nov 2026) A file saved from a spreadsheet can start with empty rows (only commas) above the headings, or have the
  // heading row again further down (big-idea.csv had both, and Big idea showed no passages): the headings are the first
  // row with something in it, and a row that repeats them (3 or more cells the same as their headings) is left out.
  while(rows.length && !rows[0].some(x=>x.trim())) rows.shift();
  const head=(rows.shift()||[]).map(h=>h.trim().toLowerCase());
  const again=r=>r.filter((x,i)=>head[i] && x.trim().toLowerCase()===head[i]).length>=Math.min(3, head.filter(Boolean).length);
  return rows.filter(r=>r.some(x=>x.trim()) && !again(r)).map(r=>Object.fromEntries(head.map((h,i)=>[h,(r[i]||'').trim()])));
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
// Recall (data-format="recall", 10 Nov 2026): id, level, title, passage, question (optional), select_count, option1…option9,
// correct_options, explanation, source: the Note taking columns, with question in place of topic. The statements that are
// true of the passage are chosen from memory, once the passage is hidden.
function recallRow(r){ const n=notesRow(Object.assign({topic:''}, r)); if(!n) return null; n.q=r.question||''; return n; }
// Total Recall (data-format="totalrecall", 10 Nov 2026): id, level, title, passage, then question, answer, question2,
// answer2… (up to 15), explanation, source. answer: what counts as right, more than one separated by ; (the first is shown).
function totalRow(r){
  const qs=[]; for(let n=1;n<=15;n++){ const a=n===1?'':String(n), q=r['question'+a], ans=String(r['answer'+a]||'').split(';').map(x=>x.trim()).filter(Boolean);
    if(q && ans.length) qs.push({q, ans}); else if(q || ans.length) console.warn('Total Recall row '+(r.id||'?')+': question '+n+' skipped (no '+(q?'answer':'question')+')'); }
  if(!r.id || !r.passage || !qs.length){ console.warn('Total Recall row '+(r.id||'?')+' skipped: it needs an id, a passage and questions with answers'); return null; }
  return {id:r.id, level:r.level, title:r.title, text:r.passage, qs, why:r.explanation||''};
}
const listOf = v => String(v||'').split(';').map(s=>s.trim()).filter(Boolean);
// Use of English (10 Nov 2026): Word choice (word-choice.csv), Open cloze (open-cloze.csv) and Word formation
// (word-formation.csv): Cambridge C1 Advanced Reading and Use of English Parts 1-3, in a topic's short texts. Columns: id,
// level, title, text, explanation (optional, shown after Check), source (where the text came from, for the writers; not
// shown). Every gap is in [[double brackets]] in the text:
//   Word choice     [[right|wrong1|wrong2|wrong3]]   the right word first, then two or three wrong ones
//   Open cloze      [[answer]] or [[answer/other]]   every answer that is right, separated by / (the first is shown)
//   Word formation  [[answer|STEM]]                  the word in capitals the answer is made from (answer/other also works)
// A text needs at least 2 gaps. Returns {id, title, parts (text and {i: gap number}), gaps, why}, or nothing (with a warning).
function clozeRow(file, r, warn){
  if(!r.text) return warn(file, r, 'skipped: it needs a text');
  const parts=[], gaps=[], re=/\[\[([^\]]+)\]\]/g; let last=0, m, bad='';
  while((m=re.exec(r.text))){
    parts.push(r.text.slice(last, m.index)); last=re.lastIndex;
    const bits=m[1].split('|').map(s=>s.trim()), g={};
    if(file==='word-choice'){ g.opts=[...new Set(bits.filter(Boolean))]; g.ans=[g.opts[0]];
      if(g.opts.length<3) bad=bad||`[[${m[1]}]] needs the right word and at least two wrong ones, separated by |`; }
    else { g.ans=String(bits[0]||'').split('/').map(s=>s.trim()).filter(Boolean);
      if(!g.ans.length) bad=bad||`[[${m[1]}]] has no answer`;
      if(file==='word-formation'){ g.stem=bits[1]||''; if(!g.stem) bad=bad||`[[${m[1]}]] needs the word in capitals after a |, e.g. [[unusual|USUAL]]`; } }
    parts.push({i:gaps.length}); gaps.push(g);
  }
  parts.push(r.text.slice(last));
  if(bad) return warn(file, r, 'skipped: '+bad);
  if(gaps.length<2) return warn(file, r, 'skipped: the text needs at least 2 [[gaps]]');
  return {id:r.id, title:r.title||'', parts, gaps, why:r.explanation||''};
}
const CLOZE_FILES = {'word-choice':'wchoice', 'open-cloze':'ocloze', 'word-formation':'wform'};   // file → where buildSubject keeps it
// The CSV rows → the data the games use. A row that cannot be used is skipped, with a note in the browser console saying why.
function buildSubject(T){
  const S={key:KEY, words:[], alike:[], accept:[], gaps:[], builds:[], errors:[], tf:[], rw:[], reads:[], questions:[], extracts:[], passages:[], gk:[], must:[], evidence:[], translations:[], wchoice:[], ocloze:[], wform:[]};
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
      zh:r.zh||'', group:r.group||'', note:r.note||'', sim:listOf(r.similar), acc:listOf(r.accept),
      lists:listOf(r.list).map(s=>s.toLowerCase())}); });
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
  // Find the evidence (English version) and All-in English (Chinese version), evidence.csv (3 Nov 2026, teacher): a statement
  // about a media text ("Explain how the advert presents the woman as wealthy.") and details; the student chooses the details
  // that show it. right1-right4: the details that do; wrong1-wrong5: details that don't (neutral, or evidence of something
  // else). Shuffled together; the student chooses as many as there are right ones. Optional: word (the word the statement is
  // about: its meaning after Check and the student's progress with it), side (zh = Chinese version only, en = English version
  // only, blank = both) and explanation (shown after Check; usually best left blank).
  (T.evidence||[]).forEach(r=>{ const right=[...new Set([1,2,3,4].map(k=>r['right'+k]).filter(Boolean))], wrong=[...new Set([1,2,3,4,5].map(k=>r['wrong'+k]).filter(Boolean))].filter(x=>!right.includes(x));
    if(!r.statement || !right.length || wrong.length<2) return warn('evidence',r,'skipped: it needs a statement, at least one right detail and two wrong ones');
    const side=String(r.side||'').trim().toLowerCase(), only=/^(zh|cn|chinese)/.test(side) ? 'zh' : /^(en|english)/.test(side) ? 'en' : '';
    if(only && only!==SIDE) return;
    S.evidence.push({id:r.id, level:lv('evidence',r), s:r.statement, right, wrong, wid:ref1('evidence',r,r.word), why:r.explanation||''}); });
  // Translation (Chinese version, 8 Nov 2026, teacher): a sentence in Chinese, then choose the English sentence that has the
  // whole meaning. translation.csv: id,level,zh,english,wrong1,wrong2,wrong3,word,source,explanation (source: where the
  // English came from, for the writers; not shown).
  (T.translation||[]).forEach(r=>{ const wrong=[...new Set([1,2,3,4].map(k=>r['wrong'+k]).filter(Boolean))].filter(x=>x!==r.english);
    if(!r.zh || !r.english || wrong.length<2) return warn('translation',r,'skipped: it needs zh, english and at least two wrong sentences');
    S.translations.push({id:r.id, level:lv('translation',r), zh:r.zh, en:r.english, wrong:wrong.slice(0,3), wid:ref1('translation',r,r.word), why:r.explanation||''}); });
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
  // Use of English: Word choice, Open cloze, Word formation (see clozeRow)
  Object.entries(CLOZE_FILES).forEach(([file,k])=>(T[file]||[]).forEach(r=>{ const it=clozeRow(file, r, warn); if(it){ it.level=lv(file, r); S[k].push(it); } }));
  (T.questions||[]).forEach(r=>{ const wrong=wrongs(r);
    if(!r.question||!r.correct||!wrong.length) return warn('questions',r,'skipped: it needs a question, a correct answer and a wrong answer');
    S.questions.push({id:r.id, level:lv('questions',r), cmd:r.command||'', q:r.question, opts:[r.correct,...wrong], a:0, why:r.explanation||''}); });
  // General knowledge (knowledge.csv, 31 Oct): id, question, correct, wrong1-3, optional explanation. No levels needed:
  // a row with no level plays at every level (a level, if given, works as everywhere else).
  (T.knowledge||[]).forEach((r,i)=>{ const wrong=wrongs(r);
    if(!r.question||!r.correct||!wrong.length) return warn('knowledge',r,'skipped: it needs a question, a correct answer and a wrong answer');
    const v=(r.level||'').trim(), level=v && levelNum(v)!=null ? v : '';
    if(v && !level) warn('knowledge',r,`level "${v}" not recognised, so it is used at every level`);
    S.gk.push({id:r.id||('gk-'+(i+1)), level, q:r.question, opts:[r.correct,...wrong], why:r.explanation||''}); });
  // Must-know general knowledge (content/general/knowledge.csv, the same columns; 1 Nov 2026), on every topic page.
  // Levels used since 8 Nov 2026 (MUST_LEVEL); a row with no level (or one not recognised) plays at every level.
  (T.general||[]).forEach((r,i)=>{ const wrong=wrongs(r); if(!r.question||!r.correct||!wrong.length) return;
    const v=(r.level||'').trim(), level=v && levelNum(v)!=null ? v : '';
    S.must.push({id:r.id||('gen-gk-'+(i+1)), level, q:r.question, opts:[r.correct,...wrong], why:r.explanation||''}); });
  // In your own words: each [underlined] word has word, correct, wrong1-3 (the first) or wordN, correctN, wrong1_N… (the Nth)
  (T.extracts||[]).forEach(r=>{ const n=(String(r.extract||'').match(/\[[^\]]+\]/g)||[]).length, qs=[], wids=[];
    for(let k=1;k<=9;k++){ const a=k===1?'':String(k), b=k===1?'':'_'+k; if(!r['correct'+a]) break; qs.push([r['correct'+a], wrongs(r,b)]); wids.push(ref1('extracts',r,r['word'+a])); }
    if(!n || n!==qs.length || qs.some(q=>!q[1].length)) return warn('extracts',r,`skipped: ${n} word${n===1?'':'s'} in [brackets] but ${qs.length} set${qs.length===1?'':'s'} of answers`);
    S.extracts.push({id:r.id, level:lv('extracts',r), t:r.extract, ids:wids, qs}); });
  if(T.reading){
    if(CFG.format==='notes') S.passages=T.reading.map(notesRow).filter(Boolean);
    else if(CFG.format==='recall') S.passages=T.reading.map(recallRow).filter(Boolean);
    else if(CFG.format==='totalrecall') S.passages=T.reading.map(totalRow).filter(Boolean);
    else { const need=['id','title','passage','question','correct','wrong1','wrong2','wrong3'];
      S.passages=T.reading.filter(r=>{ const miss=need.filter(k=>!r[k]); if(miss.length){ warn('reading',r,'skipped: missing '+miss.join(', ')); return false; } return true; })
        .map(r=>({id:r.id, level:r.level, title:r.title, text:r.passage, qs:questionsOf(r)})); }
  }
  // Word lists (31 Oct 2026; Representation first: key terms, describing words, academic words).
  // words.csv may have a "list" column: one or more list names, separated by ;  (e.g. "key" or "key; describing").
  // data-list on a page names the list(s) its WORD games deal (Match, Word or meaning, True or false cards made from words,
  // Save the mouse, arcade games, every Chinese word game and the words that flow in). A word with no list is dealt everywhere.
  // Every word, on any list, still links content: a gap's meaning after Check, a Complete the text word, word progress.
  // So content written for any list keeps working on the main page.
  // data-linked="yes" on a page: its other games use only content linked to its own words (Fill the gap rows whose word
  // is on the page); everything else stays on the main page. Used by Describing people.
  S.allWords=S.words;
  const want=String(CFG.list||'').split(/[\s,;]+/).map(x=>x.trim().toLowerCase()).filter(Boolean);
  if(want.length){
    S.words=S.words.filter(w=>!w.lists.length || w.lists.some(l=>want.includes(l)));
    if(CFG.linked){ const on=new Set(S.words.map(w=>w.id));
      S.gaps=S.gaps.filter(g=>g.wid && on.has(g.wid)); S.evidence=S.evidence.filter(g=>g.wid && on.has(g.wid));
      ['builds','errors','tf','rw','reads','questions','extracts','gk','wchoice','ocloze','wform'].forEach(k=>{ S[k]=[]; }); }
  }
  return S;
}
// Load the page's files, then start. The Chinese version only needs the words, builds.csv for Build the sentence and
// evidence.csv for All-in English, and translation.csv for Translation (a topic without that file just has none).
// A topic folder's files. Reading passages are not among them: the Reading Comprehension pages load theirs with data-reading
// (Read and answer on the topic pages was replaced by Close reading, and the empty reading.csv files were removed, 25 Oct).
// The Use of English files (10 Nov 2026) are only in the topic folders that have them so far; a topic without them just has
// none of those games (its browser console notes the missing files, as the Chinese side does for translation.csv).
const FILES = ['words','gaps','builds','errors','tf','right-wrong','reads','questions','extracts','knowledge','evidence', ...Object.keys(CLOZE_FILES)];
let readingState = 'none';
function boot(){
  const dir=CFG.content ? CFG.content.replace(/\/*$/,'/') : '';
  const jobs=(dir ? (SIDE==='zh' ? ['words','builds','evidence','translation'] : FILES) : []).map(f=>[f, dir+f+'.csv']);
  if(dir && GEN && GEN.files) GEN.files.forEach(f=>jobs.push([f, dir+f+'.csv']));   // a science page's data tables (both sides)
  // Must-know general knowledge for everyone (content/general/, 1 Nov 2026): one round in every Daily Circuit quick-fire station
  if(dir) jobs.push(['general', ROOT+'content/general/knowledge.csv']);
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
    if(GEN) genPrepare(S, T);
    main(S);
  });
}

// Science pages only (GEN): every row may have a "syllabus" column (codes such as 2.4, separated by ;) and an "extended"
// column (yes = Extended only). They are kept on the row as syl and ext for the topic choice. Then the module makes its questions.
function genPrepare(S, T){
  const tag=r=>({syl:listOf(r.syllabus), ext:/^(y|yes|e|ext|extended|s|supplement|true|1)$/i.test(String(r.extended||'').trim())});
  [['words','allWords'],['gaps','gaps'],['builds','builds'],['errors','errors'],['tf','tf'],['right-wrong','rw'],['reads','reads'],['questions','questions'],['extracts','extracts'],['knowledge','gk'],['evidence','evidence']].forEach(([f,k])=>{
    const by={}; (T[f]||[]).forEach(r=>{ if(r.id) by[r.id]=r; });
    (S[k]||(k==='allWords' ? S.words : [])||[]).forEach(x=>{ const r=by[x.id]; if(r) Object.assign(x, tag(r)); }); });
  try{ S.gen=(GEN.build && GEN.build(T)) || []; }catch(e){ console.warn('The generated games could not be made:', e); S.gen=[]; }
}

function main(S){
const byId = Object.fromEntries((S.allWords||S.words).map(w=>[w.id,w]));   // every word, on any list (see data-list)
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
const POINT_KIND = {zhtranslate:'grammar', mouse:'type', zhmouse:'type', zhbuild:'build', learn:'word', match:'word', syn:'word', meaning:'word', zh:'word', zhmatch:'word', zhmean:'word', zhtf:'word', zhodd:'word', zhspeed:'word', zhsurvive:'word', snake:'word', whack:'word', invaders:'word', wordsearch:'word', zhwordsearch:'word', crossword:'type', zhcrossword:'type',
  zhtype:'type', gap:'grammar', tf:'grammar', rw:'grammar', must:'grammar', build:'build', error:'build', own:'build', evidence:'build', zhevidence:'build', read:'short', wchoice:'short', ocloze:'short', wform:'short', question:'short', gk:'grammar', passage:'passage', notes:'passage', listen:'passage', recall:'passage', totalrecall:'passage'};
const POINT_KINDS = [['word','Word games: Learn the words, Match the meaning, Word or meaning, Word Snake, Whack-a-word, Word Invaders, Word search, 中文 → English, Choose the meaning, True or false (中文版), Odd one out, Speed round, Survival'],
  ['type','Type it, Save the mouse'], ['grammar','Fill the gap, True or false, Grammar Check, General knowledge, Translation (中文版)'], ['build','Build the sentence, Spot the error (shared between its errors), In your own words, Find the evidence, All-in English'],
  ['short','Complete the text, Word choice, Open cloze and Word formation (shared between the gaps), Answer the question'], ['passage','A reading passage or listening test: Close reading, Big idea, Note taking, Recall, Total Recall, Listening (Recall and Total Recall add a speed bonus)']];
// The same, in Chinese (My progress opened from the Chinese side, stage 4)
const POINT_KINDS_ZH = {word:'单词游戏：学习单词、单词配释义、看中文选英文、选出释义、判断对错、单词贪吃蛇、单词打地鼠、单词入侵者、单词搜索、限时挑战、生存挑战',
  type:'拼写单词、拯救小老鼠', grammar:'填空、判断对错、语法检查、常识题、翻译', build:'连词成句、找错（分摊到每个错误）、用自己的话说、找证据、全英文练习',
  short:'完成短文、选词填空、开放式填空、构词填空（分摊到每个空）、回答问题', passage:'阅读文章或听力测试：精读、主旨、笔记、听力'};
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
  const GUESS={mouse:.05, zhmouse:.05, wordsearch:.05, zhwordsearch:.05, crossword:.05, zhcrossword:.05, match:.2, syn:.2, zhmatch:.2, tf:.5, rw:.5, zhtf:.5, zhbuild:.05, zhtype:0, error:.1, build:.05, evidence:.05, zhevidence:.05, recall:.05, totalrecall:0, ocloze:0, wform:0};   // chance of a lucky guess
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
    return {code, name:LEVEL_NAMES[code]||'', zh:LEVEL_ZH[code]||'', pct: b>=5 ? 100 : Math.round((r-b)*100), next: LEVEL_NAMES[LEVEL_CODES[b+1]]||'', nextZh: LEVEL_ZH[LEVEL_CODES[b+1]]||''}; };
  // opts.noRate (Learn the words): the answer moves the word on and earns points, but does not count towards the student's level
  const record = (game, item, ok, opts) => {
    try{
      data=load();
      // Must-know (8 Nov 2026) has a level of its own (MUST_LEVEL): its answers move that, not this topic's level
      if(game==='must') MUST_LEVEL.update(item, ok);
      const rate=!(opts && opts.noRate) && game!=='must', t=ensure(), before=t.n, now=Date.now(), d=itemLevel(item);
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
        pts=row[band-1]; if(item && item.qs>1) pts=Math.ceil(pts/item.qs);
        if(item && item.bonus>0) pts+=Math.round(item.bonus);   // Recall's speed bonus (10 Nov 2026)
        t.pts=(t.pts||0)+pts; }
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
  if(SIDE==='zh' && !classRun) return spaceOut(items.map(it=>{ let sc=Math.random()*0.8; const w=wordOf(it), rec=w && P.wordRec(w.id);
      if(w){ if(!rec) sc-=0.3; else if(!zhConfident(w)) sc-=0.6; else if(rec.s>=4 && rec.due>now) sc+=0.9; else sc+=0.3; }
      return [sc,it]; }).sort((a,b)=>a[0]-b[0]).map(x=>x[1]));
  // A word due for review moves up once, not with every question made from it (8 Nov 2026: Fill the gap has five sentences
  // per word, and all five used to come first, one after another)
  const boosted=new Set();
  return spaceOut(shuffle(items).map(it=>{ let sc=Math.random()*0.6; const d=itemLevel(it); if(d!=null) sc+=Math.abs(d-target);
      const w=wordOf(it), rec=w && P.wordRec(w.id);
      if(rec){ if(rec.s>=1 && rec.s<4 && rec.due<=now){ if(!boosted.has(w.id)){ sc-=0.6; boosted.add(w.id); } } else if(rec.s>=4 && rec.due>now) sc+=0.8; }
      return [sc,it]; }).sort((a,b)=>a[0]-b[0]).map(x=>x[1]));
}
// The same word never comes back within SPACE questions while another word can go there instead (8 Nov 2026, teacher:
// "different variants on the same word four times in a row"). Questions not made from a word are never held back.
const SPACE = 5;
function spaceOut(list){
  const key=it=>{ const w=wordOf(it); return w ? w.id : null; };
  const gap=Math.min(SPACE, new Set(list.map(key).filter(k=>k!=null)).size-1); if(gap<1) return list;
  const out=[], rest=list.slice(), recent=[];
  while(rest.length){
    let j=0; for(let i=0; i<rest.length && i<60; i++){ const k=key(rest[i]); if(k==null || !recent.includes(k)){ j=i; break; } }
    const it=rest.splice(j,1)[0]; out.push(it); recent.push(key(it)); if(recent.length>gap) recent.shift();
  }
  return out;
}
// Show the points just earned (or the point taken off) in the answer's feedback, when there is one
function earned(change){
  if(!change) return; const v=document.querySelector('#feed .card .feedback .verdict, #feed .card .cr-end'); if(!v) return;
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
const ON_PAGE = SIDE==='zh' ? S.words.filter(w=>w.zh) : ['words','gaps','builds','errors','tf','rw','reads','questions','extracts','passages','evidence','wchoice','ocloze','wform'].flatMap(k=>S[k]||[]).concat((S.gen||[]).flatMap(g=>g.items||[]));   // + generated questions (science pages)
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

// ---------- SYLLABUS TOPICS (Science pages, 3 Nov 2026) ----------
// Each student ticks the syllabus topics they have studied or want to practise (teacher: the student's choice, not the
// teacher's), and chooses Core or Extended. A row with syllabus codes is used only when one of its topics is ticked; a row
// marked extended only on Extended. Rows without codes are always used. The choice is saved as aea:science:<subject>
// = {topics:['2','3'], course:'extended'}, shared by the English and Chinese pages (synced to the account like every aea: key).
// First visit: the list opens by itself and the games wait until a topic is ticked. Other pages: SYL is null, nothing changes.
const SYL = GEN && GEN.topics ? GEN.topics : null;
const SYL_KEY = SYL ? 'aea:science:'+(GEN.subject||KEY) : '';
const sylChoice = () => { let c=null; try{ c=JSON.parse(localStorage.getItem(SYL_KEY)); }catch(e){}
  return c && Array.isArray(c.topics) ? {topics:c.topics.map(String), course:c.course==='core'?'core':'extended', set:true} : {topics:[], course:'extended', set:false}; };
const sylSave = c => { try{ localStorage.setItem(SYL_KEY, JSON.stringify({topics:c.topics, course:c.course})); }catch(e){} };
// A row's code and a ticked topic match when one is inside the other. Chemistry ticks whole topics (topic 2 takes 2.4);
// Physics (4 Nov 2026) ticks subtopics (1.2 takes 1.2 and 1.2.3), and a row coded 1 belongs to every 1.x.
const sylIn = (code, topic) => { const k=String(code).trim(), t=String(topic); return k===t || k.startsWith(t+'.') || t.startsWith(k+'.'); };
const sylOk = (x, c) => !(x.ext && c.course==='core') && (!(x.syl||[]).length || x.syl.some(k=>c.topics.some(t=>sylIn(k, t))));
const SYL_FULL = {};   // every row of the page, before the choice (the games read the chosen ones from S as usual)
function sylApply(){ if(!SYL) return; const c=sylChoice(); Object.keys(SYL_FULL).forEach(k=>{ S[k]=SYL_FULL[k].filter(x=>sylOk(x, c)); }); }
if(SYL){ ['words','gaps','builds','errors','tf','rw','reads','questions','extracts','gk','evidence'].forEach(k=>{ SYL_FULL[k]=S[k]||[]; }); sylApply(); }
const sylNone = () => !!SYL && !sylChoice().topics.length;
// Topics with something to play; the others say "Coming soon"
const SYL_CODES = SYL ? [...new Set([...Object.values(SYL_FULL).flat(), ...(S.gen||[]).flatMap(g=>g.items||[])].flatMap(x=>x.syl||[]).map(k=>String(k).trim()))] : [];
const SYL_LIVE = new Set(SYL ? SYL.map(t=>String(t.n)).filter(n=>SYL_CODES.some(k=>sylIn(k, n))) : []);
// Topics in groups (Physics: 1.1-1.8 under 1 Motion, forces and energy…): GEN.groups names them; a group's tick box ticks all its topics
const SYL_GROUPS = SYL && GEN.groups ? Object.fromEntries(GEN.groups.map(g=>[String(g.n), g])) : null;
const sylGroupOf = t => String(t.n).split('.')[0];

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
document.addEventListener('keydown', e => { if(keyHandler && !e.metaKey && !e.ctrlKey && !e.altKey && e.target.tagName!=='INPUT' && !(e.target.closest && e.target.closest('.report'))) keyHandler(e); });
const later = (fn,ms) => { const t=setTimeout(fn,ms); timers.push(t); return t; };
const clearTimers = () => { timers.forEach(clearTimeout); timers=[]; };

// ---------- Reporting a question (31 Oct 2026, teacher) ----------
// "A report button next to the wrong answer for when a student thinks they've been hard done by or a question hasn't made
// sense." After a wrong answer, manualNext() puts a small Report button beside Next. The student chooses a reason (and can
// add a comment); the report goes to the server (POST /api/report, see server/README.md), with the question as they saw
// it. Limits: 5 a day per device (here and on the server) and per logged-in student; none for the teacher (a browser
// logged in on the teacher page sends the teacher's login, and the report shows as "You").
// The teacher keeps or removes each reported question on the teacher page (#/reports). Removed questions are left out of
// every game (Deck skips them): the list comes from GET /api/hidden when a page opens and is kept in this browser
// ("aeaHidden", not "aea:", so it isn't saved to accounts) for when the server can't be reached.
// A question is: this page's content folder (TOPIC) + the game + the row's id (or the word's id, for cards made from words).
const TOPIC = (()=>{ const m=String(CFG.content||CFG.reading||'').match(/content\/(.+?)\/*$/); return m ? m[1].replace(/\.csv$/,'') : ''; })();
const REPORT_MAX = 5, HID_KEY = 'aeaHidden', REP_KEY = 'aeaReports', DEV_KEY = 'aeaDevice';
const apiBase = () => { try{ if(window.AEA_ACCOUNT && AEA_ACCOUNT.api) return AEA_ACCOUNT.api(); }catch(e){}
  let a=''; try{ a=localStorage.getItem('aea:api')||''; }catch(e){} return (a||'https://api.academicenglishapp.com').replace(/\/+$/,''); };
let HIDDEN = new Set(), CUR_GAME = '', lastMiss = null;
const useHidden = list => { const h=new Set();
  (Array.isArray(list)?list:[]).forEach(x=>{ if(!x || x.topic!==TOPIC) return; const id=String(x.item); h.add(x.game+'|'+id); h.add(x.game+'|'+id.split('#')[0]); });   // part of a passage: the whole passage
  HIDDEN=h; };
try{ useHidden(JSON.parse(localStorage.getItem(HID_KEY)||'[]')); }catch(e){}
if(TOPIC && window.fetch) fetch(apiBase()+'/api/hidden', {cache:'no-store'}).then(r=>r.ok?r.json():null).then(d=>{
  if(d && Array.isArray(d.hidden)){ try{ localStorage.setItem(HID_KEY, JSON.stringify(d.hidden)); }catch(e){} useHidden(d.hidden); } }).catch(()=>{});
const hiddenItem = x => !!(HIDDEN.size && x && x.id!=null && HIDDEN.has(CUR_GAME+'|'+x.id));
const repDay = () => { const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
const repLog = () => { let r=null; try{ r=JSON.parse(localStorage.getItem(REP_KEY)); }catch(e){} return r && r.day===repDay() ? r : {day:repDay(), n:0, sent:[]}; };
const repSave = r => { try{ localStorage.setItem(REP_KEY, JSON.stringify(r)); }catch(e){} };
const device = () => { let d=''; try{ d=localStorage.getItem(DEV_KEY)||''; if(!/^[A-Za-z0-9_-]{8,40}$/.test(d)){ d='d'+Math.random().toString(36).slice(2,12)+Date.now().toString(36); localStorage.setItem(DEV_KEY, d); } }catch(e){} return d; };
const teacherLogin = () => { try{ const a=JSON.parse(localStorage.getItem('aea:account:teacher')); return a && a.token && a.until>Date.now() ? a.token : null; }catch(e){ return null; } };
const studentLogin = () => { try{ const a=window.AEA_ACCOUNT && AEA_ACCOUNT.account(); return a && a.token || null; }catch(e){ return null; } };
const gameNameOf = key => { const g=[...GAMES, ...ZH_GAMES, ...ARCADE].find(x=>x.key===key); return g ? g.name : (CFG.name||key); };
// The question as the student saw it: the card's text without the feedback, Next and the report panel
function cardText(card){
  if(card.querySelector('.cr')){   // Close reading / Big idea / Note taking in the new look: the passage, then each question and its options
    const pass=card.querySelector('.cr-pass'), qs=[...card.querySelectorAll('.cr-q')], txt=el=>el ? el.innerText.trim() : '';
    return {shown: [txt(pass), ...qs.map(q=>txt(q.querySelector('h3'))+'\nOptions: '+[...q.querySelectorAll('.opt span')].map(txt).join(' | '))].join('\n'),
      chosen: [...card.querySelectorAll('.opt.no span')].map(txt).filter(Boolean).join(' | '),
      feedback: qs.map(q=>txt(q.querySelector('.cr-why, .fb'))).filter(Boolean).join('\n')};
  }
  const skip='.fb,.next-row,.report,.opts,.tf-btns,kbd';
  const prompt=[...card.children].filter(el=>!el.matches(skip)).map(el=>el.innerText.trim()).filter(Boolean).join('\n');
  const opts=[...card.querySelectorAll('.opt')].map(b=>(b.querySelector('span')||b).innerText.trim()).filter(Boolean);
  return {shown: prompt+(opts.length ? '\nOptions: '+opts.join(' | ') : ''),
    chosen: [...card.querySelectorAll('.no:not(.feedback)')].map(el=>(el.querySelector('span')||el).innerText.trim()).filter(Boolean).join(' | '),
    feedback: ((card.querySelector('.fb')||{}).innerText||'').trim()};
}
function reportButton(card, row, miss){
  if(!TOPIC || !miss || !miss.item || miss.item.id==null) return;
  const key=miss.game+'|'+miss.item.id, teacher=!!teacherLogin();
  const b=document.createElement('button'); b.type='button'; b.className='report-btn';
  const done=()=>{ b.innerHTML=T('Reported ✓','已报告 ✓'); b.disabled=true; };
  b.innerHTML=T('⚑ Report this question','⚑ 报告这道题'); row.prepend(b);
  if(repLog().sent.includes(key)) return done();
  b.onclick=()=>{
    if(card.querySelector('.report')) return;
    const log=repLog(), seen=cardText(card), panel=document.createElement('div');
    panel.className='report'; panel.setAttribute('role','group'); panel.setAttribute('aria-label', TX('Report this question','报告这道题'));
    if(!teacher && log.n>=REPORT_MAX){
      panel.innerHTML=`<p class="report-msg">${T(`You've sent ${REPORT_MAX} reports today. Thank you for checking! You can send more tomorrow.`, `你今天已经报告了${REPORT_MAX}次，谢谢你的检查！明天可以再报告。`)}</p>`;
      card.appendChild(panel); b.disabled=true; return;
    }
    const R=[['answer', T('My answer should be right','我的答案应该是对的')], ['unclear', T("The question doesn't make sense",'这道题说不通')], ['other', T('Something else','其他问题')]];
    panel.innerHTML=`<p class="report-k">${T("What's wrong with this question?",'这道题有什么问题？')}</p>
      <div class="report-opts">${R.map(([v,l])=>`<button type="button" class="report-opt" data-v="${v}" aria-pressed="false">${l}</button>`).join('')}</div>
      <input type="text" class="report-note" maxlength="300" placeholder="${esc(TX('Anything to add? (optional)','还有什么要说的吗？（可选）'))}">
      <div class="report-row"><button type="button" class="btn report-send" disabled>${T('Send report','发送')}</button><button type="button" class="btn alt report-cancel">${T('Cancel','取消')}</button></div>
      <p class="report-msg" role="status"></p>`;
    card.appendChild(panel); panel.querySelector('.report-opt').focus({preventScroll:true});   // (so Enter doesn't move on to the next question)
    let reason='';
    const send=panel.querySelector('.report-send'), msg=panel.querySelector('.report-msg');
    panel.querySelectorAll('.report-opt').forEach(o=>o.onclick=()=>{ reason=o.dataset.v;
      panel.querySelectorAll('.report-opt').forEach(x=>x.setAttribute('aria-pressed', x===o?'true':'false')); send.disabled=false; });
    panel.querySelector('.report-cancel').onclick=()=>{ panel.remove(); b.focus({preventScroll:true}); };
    send.onclick=()=>{
      send.disabled=true; msg.textContent=TX('Sending…','发送中…');
      const token=teacherLogin()||studentLogin(), item=miss.item, lv=item.level!=null && item.level!=='' ? levelName(item.level) : bandName(chosenBand());
      fetch(apiBase()+'/api/report', {method:'POST', headers:Object.assign({'Content-Type':'application/json'}, token?{Authorization:'Bearer '+token}:{}),
        body:JSON.stringify({topic:TOPIC, game:miss.game, item:String(item.id), reason, comment:panel.querySelector('.report-note').value,
          shown:seen.shown, chosen:seen.chosen, feedback:seen.feedback, side:SIDE, page:PAGE, pageName:CFG.name||'', gameName:gameNameOf(miss.game), level:lv||'', device:device()})})
        .then(r=>r.json().catch(()=>({})).then(d=>{ if(!r.ok){ const err=new Error(d.error||''); err.server=true; err.full=r.status===429; throw err; }
          const l=repLog(); if(!teacher && !d.already) l.n++; l.sent.push(key); repSave(l); done();
          panel.innerHTML=`<p class="report-msg ok">${teacher ? T("Reported. It's on your Reports page.",'已报告。') : T('Thanks! Your teacher will check this question.','谢谢！老师会检查这道题。')}</p>`; }))
        .catch(e=>{ if(e.full){ const l=repLog(); l.n=Math.max(l.n, REPORT_MAX); repSave(l); } else send.disabled=false;
          msg.textContent=e.full ? TX(`You've sent ${REPORT_MAX} reports today. Thank you for checking! You can send more tomorrow.`, `你今天已经报告了${REPORT_MAX}次，谢谢你的检查！明天可以再报告。`) : (e.server && e.message) || TX("Couldn't send the report. Check your internet connection and try again.",'无法发送，请检查网络后再试。'); });
    };
  };
}

// ---------- DAILY CIRCUIT QUICK-FIRE (1 Nov 2026, teacher: "It's got to be a speed round… a high energy experience") ----------
// A quick-fire station (kind 'short') plays one game for three answers, then switches to another (never the same twice
// in a row, and the ones not played lately first). Games: those that ask one thing at a time (QF_GAMES).
// 8 Nov 2026 (teacher): a right answer moves on after a steady second, every game the same (QF_RIGHT_MS, with the green
// bar); a wrong answer waits for Continue ("so there is time to reflect"), and the station's clock keeps running.
// Match the meaning is no longer in quick-fire: it has a one-minute round of its own (kind 'match', see circuitGames).
// Only the Daily Circuit: class games and normal play are unchanged.
const QF_EACH = 3, QF_RIGHT_MS = 1000;
const QF_GAMES = {en:['meaning','tf','gap','rw'], zh:['zh','zhmean','zhtf','zhtype','zhodd','zhtranslate']};   // Translation added 8 Nov 2026 (teacher)
let qf = null;   // {pool, game, n (answers in this game), recent}
const qfDue = () => !!qf && qf.n>=QF_EACH;
function qfPlay(g){
  qf.game=g.key; qf.n=0; qf.recent=[...qf.recent, g.key].slice(-Math.max(1, qf.pool.length-2));
  g.run();
  const el=document.querySelector('#ccBar .cc-game'), c=(window.AEA_CIRCUIT && AEA_CIRCUIT.active(SIDE) || {}).cur;
  if(el && c) el.innerHTML=`${SIDE==='zh' ? nameT(c.topic) : esc(c.topic)} · ${T('Quick-fire','快速答题')}: ${SIDE==='zh'&&g.zh ? T(esc(g.name), esc(g.zh)) : esc(g.name)}`;
}
function qfSwitch(){
  if(!qf || !inCircuit) return;
  if(qf.round++===qf.mustAt) return qfPlay(MUST_GAME);   // the station's must-know round
  const others=qf.pool.filter(g=>g.key!==qf.game), fresh=others.filter(g=>!qf.recent.includes(g.key)), from=fresh.length ? fresh : others.length ? others : qf.pool;
  qfPlay(from[Math.floor(Math.random()*from.length)]);
}
const qfNext = (next, ms) => { later(()=>{ if(!qf) return; qfDue() ? qfSwitch() : next(); }, ms); };
// After a right answer: the green bar runs for QF_RIGHT_MS, then the next question (or the next game)
function qfRight(card, next){
  const bar=document.createElement('div'); bar.className='auto'; bar.innerHTML='<i></i>';
  bar.style.setProperty('--dur', QF_RIGHT_MS+'ms'); card.appendChild(bar);
  requestAnimationFrame(()=>requestAnimationFrame(()=>bar.classList.add('run')));
  qfNext(next, QF_RIGHT_MS);
}
// After a wrong answer: the right answer stays on screen until the student presses Continue (or Enter), with Report this
// question beside it (put back 8 Nov 2026, teacher)
function qfWrong(card, next){
  const miss=lastMiss; lastMiss=null;
  const row=document.createElement('div'); row.className='next-row';
  row.innerHTML=`<button class="btn">${T('Continue','继续')} →</button>`; card.appendChild(row);
  reportButton(card, row, miss);
  const b=row.querySelector('.btn'); let gone=false;
  const go=()=>{ if(gone || !qf) return; gone=true; b.disabled=true; qfDue() ? qfSwitch() : next(); };
  b.onclick=go; b.focus({preventScroll:true});
  keyHandler = e=>{ if(e.key==='Enter'){ e.preventDefault(); go(); } };
}

// Endless deck: shuffled, refilled when empty; missed items come back a few cards later.
// Questions the teacher removed after a report (hiddenItem, 31 Oct) are skipped; if every item is removed, all play.
function Deck(items){   // items: a list, or a function giving the list (read again on refill, and every 4 cards for newcomers)
  let queue=[], last=null, calls=0; const retried=new Set(), dealt=new Set(), live=typeof items==='function', src=live ? items : ()=>items;
  const newcomers=()=>{ const inQ=new Set(queue); shuffle(src().filter(x=>!inQ.has(x) && !dealt.has(x) && x!==last && !hiddenItem(x))).forEach(x=>queue.splice(Math.min(queue.length, 1+Math.floor(Math.random()*4)), 0, x)); };   // (shuffled: not in the file's order)
  const refill=()=>{ dealt.clear(); const all=src(), shown=all.filter(x=>!hiddenItem(x)); queue=rankForLevel(shown.length ? shown : all); if(queue.length>1 && queue[0]===last) queue.push(queue.shift()); };
  return {
    next(){ if(!queue.length) refill(); else if(live && ++calls%4===0) newcomers();
      while(queue.length>1 && hiddenItem(queue[0])) queue.shift();   // removed while this game was open
      last=queue.shift(); dealt.add(last); return last; },
    // A missed item comes back once, a few cards later. Missed again, it waits for the next round,
    // so a student who is struggling still meets new items instead of the same few on a loop.
    retry(item){ if(retried.has(item)){ retried.delete(item); return; } retried.add(item);
      const pos=Math.min(queue.length, 3+Math.floor(Math.random()*3)); queue.splice(pos,0,item); }
  };
}
function Stats(game){
  const s={answered:0,correct:0,streak:0,best:store.get('streak:'+game,0)}; CUR_GAME=game;
  s.hit=(item)=>{ if(qf) qf.n++; s.answered++; s.correct++; s.streak++; if(s.streak>s.best){ s.best=s.streak; store.set('streak:'+game,s.best);} s.draw(); P.record(game,item,true); drawLevelBox(); };
  s.miss=(item)=>{ if(qf) qf.n++; s.answered++; s.streak=0; s.draw(); P.record(game,item,false); lastMiss={game, item}; drawLevelBox(); };
  s.draw=()=>{ const el=document.getElementById('stats'); if(!el) return;
    if(NEW_UI) el.innerHTML=gStats([[T('Correct','答对'), s.correct, '/'+s.answered], [T('Streak','连对'), s.streak], [T('Best','最佳'), s.best]]);
    else el.innerHTML=`<span>${T('Correct','答对')} <b>${s.correct}</b>/${s.answered}</span><span class="streak">${T('Streak','连对')} <b>${s.streak}</b></span><span>${T('Best','最佳')} <b>${s.best}</b></span>`; };
  return s;
}

// ---------- categories and games ----------
const CATS = {
  vocab:   {name:'Vocabulary', blurb:'Learn what the words mean and which words go together.'},
  grammar: {name:'Grammar',    blurb:'Use the words accurately: word forms, verb forms, sentence building.'},
  // Reading on phones again (10 Nov 2026, teacher: "hiding them is proving a bit of a hassle… the kids can read on their
  // phones if they want"): no category is desktop-only now. desktop:true would grey a column out on phones again.
  reading: {name:'Reading',    blurb:'Read longer texts and work out meaning in context.'}
};
// Games (31 Oct, teacher): a section that runs across the bottom of the topic page, under the three columns.
// Not one of the columns (CATS), so the column loops leave it alone; menuCompact() draws it.
const GAME_ROW = {games: {name:'Games'}};
// form: short (one quick answer at a time) or long (read something, then several answers): the Daily Circuit's
// short and long stations choose from these. A game with no form (Read and answer) is never in the circuit.
// Columns (26 Oct, teacher): True or false moved from Grammar to Vocabulary, Spot the error from Grammar to Reading.
// 31 Oct (teacher): Spot the error back in Grammar ("its natural home"); Right or wrong renamed "SPAG: Right or Wrong".
// 8 Nov 2026 (teacher): SPAG: Right or Wrong renamed "Grammar Check", with Good Grammar / Bad Grammar buttons.
// Reading games were for computers only until 10 Nov 2026 (CATS.reading.desktop); every game now plays on phones too.
const GAMES = [
  // Match the meaning (31 Oct, teacher): Synonym groups merged in. The right-hand column mixes meanings and synonym groups
  // (a word with synonyms shows either). data-hide="syn" on a topic page keeps it to meanings only (Essentials).
  {key:'match',    form:'short', cat:'vocab',   name:'Match the meaning', blurb:'Pair each word with its meaning or with words close in meaning.', items:()=>pick(S.words), min:6, run:()=>playMatch(matchMode())},
  // {key:'syn',      form:'short', cat:'vocab',   name:'Synonym groups',    blurb:'Match each word to a group of words with a similar meaning.', items:()=>pick(S.words).filter(w=>w.syn&&w.syn.length), min:6, run:()=>playMatch('syn')},
  {key:'meaning',  form:'short', cat:'vocab',   name:'Word or meaning',   blurb:'See a word and choose its meaning, or the other way round.', items:()=>pick(S.words), min:4, run:()=>playMeaning()},
  {key:'tf',       form:'short', cat:'vocab',   name:'True or false',     blurb:'Read each statement and decide quickly: true or false?', items:()=>[...pick(S.tf), ...(pick(S.words).length>=4 ? pick(S.words) : [])], min:1, run:()=>playTF()},
  // Use of English (10 Nov 2026, teacher): C1 Advanced Reading and Use of English Parts 1-3 in short texts (playCloze).
  // Word choice in Vocabulary (collocations, fixed phrases, the word after the gap); Open cloze and Word formation in Grammar.
  {key:'wchoice',  form:'long', cat:'vocab',   phone:true, name:'Word choice',      blurb:'Use of English Part 1: choose the word that fits each gap in a short text.', items:()=>pick(S.wchoice), min:1, run:()=>playCloze('wchoice')},
  {key:'mouse',    cat:'games',   name:'Save the mouse',   blurb:'Guess the word one letter at a time before the mouse disappears.', items:()=>mouseWords(pick(S.words)), min:4, run:()=>playMouse()},
  // Word search (7 Nov 2026, teacher): in the Games row, after Save the mouse; plays on phones; not in the Daily Circuit
  {key:'wordsearch', cat:'games', phone:true, time:true, name:'Word search', blurb:'Find the topic\'s words hidden in a square of letters.', items:()=>wsFit(pick(S.words), PHONE?9:10), min:5, run:()=>playWordSearch()},
  // Crossword (9 Nov 2026, teacher): in the Games row, after Word search; plays on phones; not in the Daily Circuit
  {key:'crossword', cat:'games', phone:true, time:true, name:'Crossword', blurb:'Fill in the grid with the topic\'s words. Each clue is a word\'s meaning.', items:()=>xwFit(pick(S.words), false, 13), min:6, run:()=>playCrossword()},
  {key:'gap',      form:'short', cat:'grammar', name:'Fill the gap',      blurb:'Choose the word or form that fits the gap in each sentence.', items:()=>pick(S.gaps), min:1, run:()=>playGap()},
  {key:'rw',       form:'short', cat:'grammar', name:'Grammar Check',    blurb:'Good grammar or bad grammar? Judge the grammar, not the facts.', items:()=>pick(S.rw), min:1, run:()=>playRW()},
  {key:'error',    form:'long', cat:'grammar', phone:true, name:'Spot the error',    blurb:'Read a paragraph and tap every word with a grammar mistake.', items:()=>pick(S.errors), min:1, run:()=>playErr()},
  {key:'ocloze',   form:'long', cat:'grammar', phone:true, name:'Open cloze',        blurb:'Use of English Part 2: type the one word that fits each gap in a short text.', items:()=>pick(S.ocloze), min:1, run:()=>playCloze('ocloze')},
  {key:'wform',    form:'long', cat:'grammar', phone:true, name:'Word formation',    blurb:'Use of English Part 3: change the word in capitals so that it fits the gap.', items:()=>pick(S.wform), min:1, run:()=>playCloze('wform')},
  // passage: only on the Reading Comprehension pages (Close reading, Big idea), which give it their own name
  {key:'passage',  cat:'reading', name:'Read and answer',   blurb:'Read a passage, then choose the best answer to each question.', items:()=>pick(S.passages), min:1, run:()=>playPassage()},
  // Build the sentence back on the English side (31 Oct, teacher: "put it in the Reading column"); playable on phones
  {key:'build',    form:'short', cat:'reading', phone:true, name:'Build the sentence', blurb:'Put the coloured pieces in order, and watch out for trap pieces.', items:()=>pick(S.builds), min:1, run:()=>playBuild()},
  // Find the evidence (3 Nov 2026): All-in English's mechanic on the English version, for language analysis (evidence.csv)
  {key:'evidence', form:'long', cat:'reading', phone:true, name:'Find the evidence', blurb:'Read what the task says, then choose the details that show it.', items:()=>pick(S.evidence), min:1, run:()=>playEvidence()},
  {key:'own',      form:'long', cat:'reading', name:'In your own words', blurb:'Paper 1 style: what does each underlined word mean here?', items:()=>pick(S.extracts), min:1, run:()=>playOwn()},
  {key:'read',     form:'long', cat:'reading', name:'Complete the text', blurb:'Read a short text and put the key words into the gaps.', items:()=>pick(S.reads), min:1, run:()=>playRead()},
  // General knowledge (31 Oct, teacher): "things connected to the topic but more about cultural capital". In the Games
  // row across the bottom; plays on phones; no form, so not in the Daily Circuit.
  {key:'gk',       cat:'games', phone:true, name:'General knowledge', blurb:'Questions about the wider world of this topic. One answer is right.', items:()=>pick(S.gk), min:1, run:()=>playGK()},
  {key:'question', form:'long', cat:'reading', name:'Answer the question', blurb:'Read an exam question and choose the answer that does what it asks.', items:()=>pick(S.questions), min:1, run:()=>playQuestion()}
];
// ---------- GENERATED GAMES (Science pages, 3 Nov 2026) ----------
// The page's module (GEN, e.g. en/engine/chem.js) makes every question from its data tables: a prompt, the answer and
// wrong answers that are real mistakes, each with its reason. Every game is one quick choice (form short: in the Daily
// Circuit's quick-fire and class games), plays on phones, earns grammar points, and moves the topic level like any game.
// English side: the questions at the chosen level, or the levels next to it when that is too few (the nearest first).
// Chinese side: up to one level above the student's level. Only questions in the ticked syllabus topics (SYLLABUS TOPICS).
const GEN_GAMES = (S.gen||[]).map(g=>({key:g.key, cat:'chem', gen:true, form:'short', phone:true, name:g.name, zh:g.zh, blurb:g.blurb, zhBlurb:g.zhBlurb, all:g.items||[], min:g.min||4}));
const genPool = g => { const c=SYL ? sylChoice() : null; return c ? g.all.filter(x=>sylOk(x, c)) : g.all; };
function genItems(g){
  const pool=genPool(g);
  if(SIDE==='zh' && !classRun){ const top=Math.max(zhBand()||2, 2)+1, l=pool.filter(x=>(bandOf(x)??0)<=top); return l.length>=g.min ? l : pool; }
  const b=chosenBand(); if(b==null) return pool;
  const at=pool.filter(x=>playBand(x)===b); if(at.length>=8) return at;
  const near=pool.filter(x=>Math.abs((playBand(x)??b)-b)<=1); return near.length>=g.min ? near : pool;
}
GEN_GAMES.forEach(g=>{ g.items=()=>genItems(g); g.run=()=>playGen(g); POINT_KIND[g.key]='grammar'; });
if(SIDE!=='zh') GAMES.push(...GEN_GAMES);
if(GEN_GAMES.length){ const ks=GEN_GAMES.map(g=>g.key); QF_GAMES.en.push(...ks); QF_GAMES.zh.push(...ks); }
// One generated question: the prompt (the Chinese under it on the Chinese side), four answers (three wrong ones, the
// likeliest mistakes first), and after a wrong answer the reason for the mistake that was picked.
function playGen(g){
  const st=Stats(g.key), deck=Deck(()=>g.items()), zh=SIDE==='zh', hint=T('Choose the right answer. Correct answers move on by themselves.','选出正确答案。答对后会自动进入下一题。');
  if(zh) zhShell(T(esc(g.name), esc(g.zh||g.name)), hint); else shell(g, hint);
  st.draw();
  const step=()=>{
    const q=deck.next(); if(!q) return;
    const seen=new Set([q.answer]), wrong=shuffle(q.wrong).sort((a,b)=>(a.p||2)-(b.p||2)).filter(w=>!seen.has(w.h) && seen.add(w.h)).slice(0,3);
    const opts=shuffle([{h:q.answer, ok:true}, ...wrong]);
    const card=showCard(`<p class="instr">${T(esc(q.instr), esc(q.instrZh||q.instr))}</p><div class="gen-q">${q.html}${zh&&q.zh?`<p class="zh-under gen-zh" lang="zh-CN">${q.zh}</p>`:''}</div>
      <div class="opts gen-opts${q.long?' long':''}">${opts.map((o,i)=>`<button class="opt" data-i="${i}"><kbd>${i+1}</kbd><span>${o.h}</span></button>`).join('')}</div><div class="fb"></div>`);
    const btns=[...card.querySelectorAll('.opt')]; let done=false;
    const choose=b=>{ if(done) return; done=true; const o=opts[+b.dataset.i];
      btns.forEach(x=>{ x.disabled=true; const y=opts[+x.dataset.i]; x.classList.add(y.ok ? 'ok' : x===b ? 'no' : 'dim'); });
      const fb=card.querySelector('.fb');
      if(o.ok) fbOk(fb, '');
      else fb.innerHTML=`<div class="feedback no"><span class="verdict">${T('Not quite. The answer is ','不对。答案是 ')}${q.answer}${T('.','。')}</span>${o.why?`<span>${T(o.why, o.whyZh||o.why)}</span>`:''}</div>`;
      settle(o.ok, card, st, deck, q, step);
    };
    btns.forEach(b=>b.onclick=()=>choose(b));
    keyHandler=e=>{ const n=parseInt(e.key,10); if(n>=1 && n<=btns.length) choose(btns[n-1]); };
  };
  step();
}
// A game that can't be played on this device: a Reading game on a phone (unless it is marked phone:true)
const phoneOff = g => PHONE && !!(CATS[g.cat]||{}).desktop && !g.phone;
// Games switched off on this page: data-hide="syn" (a game's key; several with spaces or commas). Its content stays in the files.
const HIDE = new Set(String(CFG.hide||'').split(/[\s,]+/).filter(Boolean));
// Match the meaning: meanings and synonym groups mixed, unless this topic has no synonyms or hides them (data-hide="syn")
const matchMode = () => !HIDE.has('syn') && S.words.some(w=>w.syn&&w.syn.length) ? 'mix' : 'def';
// Only games this subject has content for (and has not switched off)
const ROWS = {match:'words',syn:'words',meaning:'words',wordsearch:'words',crossword:'words',gap:'gaps',build:'builds',error:'errors',tf:'words',mouse:'words',rw:'rw',own:'extracts',read:'reads',question:'questions',passage:'passages',gk:'gk',evidence:'evidence',wchoice:'wchoice',ocloze:'ocloze',wform:'wform'};
const hasRows = g => g.gen ? g.all.length>0 : ((SYL ? SYL_FULL : S)[ROWS[g.key]]||[]).length>0;
const gamesIn = cat => GAMES.filter(g => g.cat===cat && !HIDE.has(g.key) && hasRows(g) && (g.key!=='syn' || S.words.some(w=>w.syn)));
// Science pages: why a game card is greyed (no topic ticked yet; nothing in the ticked topics; nothing at this level)
const rowsNow = g => g.gen ? genPool(g) : g.arcade || g.key==='mouse' || g.key==='wordsearch' || g.key==='crossword' ? S.words : g.key==='tf' ? [...S.tf, ...S.words] : S[ROWS[g.key]]||[];
const offWhy = (g, n) => sylNone() ? 'Choose your topics first' : n ? 'Not enough at this level yet' : SYL && !rowsNow(g).length ? 'None in your topics yet' : 'None at this level yet';

// ---------- page frame ----------
// cur: the name of this screen, the last step of the path in the top bar (new look): a string, or {label, zh} on the
// Chinese side. view: 'game' (a game with its side panel), 'reading' (a Reading Comprehension page), 'topic' (a subject
// page), 'list' (the word list), 'progress' or the default 'page'
function frame(back, inner, cur, view){
  clearTimers(); keyHandler=null; circuitFinish=null; circuitStop=null; document.body.classList.remove('reading-wide');
  if(ttsStop){ ttsStop(); ttsStop=null; }   // Listening: stop the voice when the page moves on
  listenGame=null;   // Listen switch: no game on screen until shell() says so
  if(NEW_UI){
    $app.dataset.view = view || 'page';
    $app.innerHTML = inner;
    try{ AEA_SHELL.crumbs(crumbsFor(back, cur)); }catch(e){ console.warn(e); }
    window.scrollTo(0,0);
    return;
  }
  const bar =CFG.only==='progress' || !window.AEA_POINTS ? '' : `<div class="pts" data-points-bar="${SIDE}"></div>`;
  $app.innerHTML = `<div class="topline"><span class="navline"><a class="home-mark" href="${ROOT}index.html" aria-label="Academic English App: home" title="Home">${HOME_MARK}</a>${back?`<a class="back" href="${esc(back.href)}">← ${back.html||esc(back.label)}</a>`:''}</span>${bar}</div>${inner}`;
  if(bar) AEA_POINTS.render(SIDE, 0);
  window.scrollTo(0,0);
}
function go(hash){ if(location.hash===hash || (!hash && !location.hash)) route(); else location.hash=hash; }
// The path in the top bar: Home, then the topic (a link back to its menu) and where the back link went, then this screen.
// A back link to the English home (or the landing page) is just Home. On the Chinese side each step also has its Chinese (zh).
function crumbsFor(back, cur){
  const zh=SIDE==='zh', out=[ZH_UI ? {label:'Home', zh:'首页', href:AEA_SHELL.home()} : {label:'Home', href:AEA_SHELL.home()}];
  const homeLike=href=>{ try{ const r=new URL(href, location.href).href.split('#')[0].split('?')[0].slice(ROOT.length); return ['', 'index.html', 'en/', 'en/index.html', 'zh/', 'zh/index.html'].includes(r); }catch(e){ return false; } };
  const topic=()=>{ if(!zh) return {label:CFG.name||'Topic', href:'#'}; const n=splitName(CFG.name||''); return {label:n.en||'Topic', zh:n.zh, href:'#'}; };
  if(back && back.href){
    if(back.href.charAt(0)==='#'){ out.push(topic()); if(back.href!=='#') out.push({label:back.label||'', href:back.href}); }
    else if(!homeLike(back.href)) out.push({label:back.label||String(back.html||'').replace(/<[^>]*>/g,'')||'Back', href:back.href});
  }
  if(cur) out.push(typeof cur==='object' ? {label:cur.label, zh:cur.zh||''} : {label:cur});
  return out.filter((c,i)=>c.label && !(i && c.label===out[i-1].label && c.href===out[i-1].href));
}

// ---------- SUBJECT MENU ----------
// data-layout="compact" on a topic page (Descriptive language first, 24 Oct): no blurb, a one-line level under the level
// buttons with the level bar as the divider, and every game listed in three columns (Vocabulary, Grammar, Reading), so
// there is no category page in between. Without it, the page keeps the older layout below.
const COMPACT = CFG.layout==='compact';
function menu(){
  if(NEW_UI) return topicPage();
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
  <div class="wl-link"><p>The word list has every word, its meaning and an example sentence.</p><a class="btn alt" href="#words">Open word list</a></div>`, CFG.name);
  wireLevels(menu);
}

function menuCompact(){
  tidyChoice();
  frame({href:CFG.back||'../index.html', label:CFG.backLabel||'Subjects'}, `
  <section class="hero hero-compact">
    <p class="eyebrow">${esc(CFG.eyebrow||'English games')}</p>
    <h1>${esc(CFG.name||'')}</h1>${sylPicker()}
    ${levelsHtml()}
    ${levelLine()}
  </section>
  ${gameColumnsHtml()}
  <div class="wl-link"><p>The word list has every word, its meaning and an example sentence.</p><a class="btn alt" href="#words">Open word list</a></div>`, CFG.name);
  wireLevels(menu); wireSyl(menu);
}
// The games on a topic page: the three columns (Vocabulary, Grammar, Reading; or a science page's own), then the Games row
function gameColumnsHtml(){
  return `<div class="cols">
    ${GEN && GEN.columns ? genColumns() : Object.entries(CATS).map(([k,c])=>{
      const all=gamesIn(k), games=all.filter(g=>!phoneOff(g)), off=c.desktop && PHONE && !games.length;
      const note = off ? 'Only available on desktop devices'
        : k==='reading' && readingState==='failed' ? 'The reading passages could not be loaded. They load when the site is online.'
        : !all.length ? 'Coming soon' : '';
      // On a phone, a column with some computer-only games shows the others and says so underneath
      const rest = !off && games.length<all.length ? `<p class="col-note">The other ${c.name.toLowerCase()} games are only available on desktop devices.</p>` : '';
      return `<section class="col col-${k}${off?' off':''}" aria-labelledby="col-${k}"><h2 id="col-${k}">${c.name}</h2>
        ${note?`<p class="col-note">${note}</p>`:''}${off?'':games.map(gameCard).join('')}${rest}</section>`; }).join('')}
  </div>
  ${(()=>{ const ROW=['gk','mouse','wordsearch','crossword','whack','invaders','snake'], all=[...gamesIn('games'), ...ARCADE.filter(a=>!HIDE.has(a.key)).map(a=>({...a, arcade:true}))].sort((x,y)=>ROW.indexOf(x.key)-ROW.indexOf(y.key));
    return `<section class="col col-games games-row" aria-labelledby="col-games"><h2 id="col-games">${GAME_ROW.games.name}</h2>
      ${all.length ? `<div class="games-grid">${all.map(gameCard).join('')}</div>` : '<p class="col-note">Coming soon</p>'}</section>`; })()}`;
}

// ---------- THE NEW SUBJECT PAGE (redesign stage 3, 8 Nov 2026; only when NEW_UI) ----------
// The subject's area and name, its "I study this" switch (the same switch as on the home page and the Daily Circuit: Essentials
// is always on), the topics (science pages), the level buttons and the student's level; then Words at this level: word cards
// to flip (teacher: "have the flipping thing"), the word and its part of speech on the front, the meaning and an example on
// the back, each with a button to hear it, Previous / Next / Shuffle; beside them Your words (known, familiar, learning, new
// at this level); then the games in their columns and the Games row.
// (A word's stage, stageOf(), and the stage names, STAGES, are the Chinese side's: see "the student's words")
const SUBJECT = (()=>{ const L=window.AEA_SUBJECTS; if(!L) return null; const norm=x=>String(x||'').split('?')[0].replace(/index\.html$/, '');
  const list=SIDE==='zh' && L.forSide ? L.forSide('zh').SUBJECTS : L.SUBJECTS;   // the Chinese version's own list (stage 4)
  return list.find(x=>x.path && norm(x.path)===norm(PAGE)) || null; })();
// Hear a word or an example (the browser's own voice: the best English one it has)
function sayIt(text){
  if(!TTS_OK || !text) return;
  try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(String(text)), v=vRanked()[0];
    if(v){ u.voice=v; u.lang=v.lang; } else u.lang='en-GB'; u.rate=.95; speechSynthesis.speak(u); }catch(e){}
}
const SPEAK_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
function studyHtml(){
  const L=window.AEA_SUBJECTS, sub=SUBJECT; if(!L || !sub) return '';
  if(sub.always) return `<span class="t-always">${T('Always in the Daily Circuit','一直包含在每日挑战中')}</span>`;
  if(!L.switchable(sub)) return '';
  let on=false; try{ on=!!(((JSON.parse(localStorage.getItem('aea:studying:v1'))||{})[SIDE]||{})[sub.path]); }catch(e){}
  return `<button type="button" class="t-sw" role="switch" aria-checked="${on}" id="tStudy"><span class="t-sw-l">${T('I study this','我在学')}</span><span class="t-sw-t" aria-hidden="true"></span></button>`;
}
// (The Chinese side saves a subject with both its names, "Web design 网页设计", as the Daily Circuit always has)
function wireStudy(){
  const b=document.getElementById('tStudy'), sub=SUBJECT; if(!b || !sub) return;
  b.onclick=()=>{ const on=b.getAttribute('aria-checked')!=='true';
    try{ const all=JSON.parse(localStorage.getItem('aea:studying:v1'))||{}; all[SIDE]=all[SIDE]||{};
      if(on) all[SIDE][sub.path]=SIDE==='zh' && sub.zh ? sub.name+' '+sub.zh : sub.name; else delete all[SIDE][sub.path]; localStorage.setItem('aea:studying:v1', JSON.stringify(all)); }catch(e){}
    b.setAttribute('aria-checked', String(on));
    try{ window.dispatchEvent(new CustomEvent('aea:studying')); }catch(e){} };   // the sidebar's My subjects
}
let fcOrder=null;   // the word cards' order (Shuffle), for this level; null: the order of the word list
function topicPage(){
  tidyChoice();
  const sub=SUBJECT, area=sub && window.AEA_SUBJECTS ? AEA_SUBJECTS.areaOf(sub.area) : null;
  const eyebrow=CFG.eyebrow || (area ? area.name : 'English games');
  frame({href:CFG.back||'../index.html', label:CFG.backLabel||'Subjects'}, `
  <section class="t-head" aria-labelledby="tH">
    <div class="t-top"><div class="t-title"><p class="t-eyebrow"${area?` style="color:${area.color}"`:''}>${esc(eyebrow)}</p><h1 id="tH">${esc(CFG.name||'')}</h1></div>${studyHtml()}</div>
    ${sylPicker()}
    ${LEVELS.length>1 ? `<div class="t-lv"><div class="t-lv-btns">${levelsHtml()}</div>${levelLine()}</div>` : levelLine()}
  </section>
  ${wordCardsHtml()}
  ${gameColumnsHtml()}`, CFG.name, 'topic');
  wireLevels(()=>{ fcOrder=null; menu(); }); wireSyl(menu); wireStudy(); wireCards();
}
// The words the cards show: the chosen level's (as the games use them)
// (On the Chinese side, the words that have their Chinese)
const fcWords = () => pick(S.words).filter(w=>!hiddenItem(w) && (SIDE!=='zh' || ZH[w.id]));
const cardWords = () => { const ws=fcWords(); return fcOrder && fcOrder.length===ws.length ? fcOrder.map(i=>ws[i]).filter(Boolean) : ws; };
const fcKey = () => 'aea-fc:'+KEY+':'+chosenBand();   // where the card the student was on is kept (this tab only)
function wordCardsHtml(){
  const ws=fcWords(); if(!ws.length) return '';
  const counts={known:0, fam:0, learn:0, new:0}; ws.forEach(w=>counts[stageOf(w)]++);
  const b=chosenBand(), lvName=b!=null && LEVELS.length>1 ? (SIDE==='zh' && LEVEL_ZH[LEVEL_CODES[b]] ? T(esc(bandName(b)), LEVEL_ZH[LEVEL_CODES[b]]) : esc(bandName(b))) : '';
  return `<section class="t-words" aria-labelledby="tWordsH">
    <div class="t-sec-top"><h2 id="tWordsH">${LEVELS.length>1 ? T('Words at this level','本级别的单词') : T('Words','单词')}</h2><a href="#words">${T('Open the word list','查看词汇表')}</a></div>
    <div class="t-words-row">
      <div class="fc-area">
        <div class="fc-stack"><span class="fc-layer l3" aria-hidden="true"></span><span class="fc-layer l2" aria-hidden="true"></span><span class="fc-layer l1" aria-hidden="true"></span>
          <div class="fc" id="fc" aria-roledescription="word card"></div></div>
        <div class="fc-nav">
          <button type="button" class="fc-btn" id="fcPrev"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>${T('Previous','上一个')}</button>
          <span class="fc-n" id="fcN" aria-live="polite"></span>
          <button type="button" class="fc-btn fc-next" id="fcNext">${T('Next','下一个')}<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button>
          <button type="button" class="fc-btn fc-shuf" id="fcShuf" aria-label="${TX('Shuffle the words','打乱单词顺序')}" title="${TX('Shuffle','打乱')}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="M4 4l5 5"/></svg></button>
        </div>
      </div>
      <aside class="t-mine" aria-labelledby="tMineH">
        <h3 id="tMineH">${T('Your words','你的单词')}${lvName ? ' · '+lvName : ''}</h3>
        <p class="t-mine-big"><b>${counts.known+counts.fam}</b><span>${T(`of ${ws.length} known or familiar`, `/ ${ws.length} 个已掌握或熟悉`)}</span></p>
        <div class="t-mine-bar" aria-hidden="true">${STAGES.map(([k])=>`<i class="st-${k}" style="width:${100*counts[k]/ws.length}%"></i>`).join('')}</div>
        <ul class="t-mine-key">${STAGES.map(([k,name,zh])=>`<li><span class="sw st-${k}" aria-hidden="true"></span><span>${T(name, zh)}</span><b>${counts[k]}</b></li>`).join('')}</ul>
        <p class="t-mine-note">${T('Words move up as you get them right on different days.','在不同的日子答对，单词就会升级。')}</p>
      </aside>
    </div>
  </section>`;
}
function wireCards(){
  const fc=document.getElementById('fc'); if(!fc) return;
  let i=0; try{ i=+sessionStorage.getItem(fcKey())||0; }catch(e){}
  let back=false;
  const draw=(focusSel)=>{
    const ws=cardWords(), n=ws.length; if(!n) return; i=((i%n)+n)%n; const w=ws[i], st=stageOf(w), stage=STAGES.find(x=>x[0]===st)||[], stName=T(stage[1], stage[2]), zh=SIDE==='zh' && ZH[w.id];
    try{ sessionStorage.setItem(fcKey(), i); }catch(e){}
    const say=(what, label, cls)=>TTS_OK ? `<button type="button" class="fc-say${cls?' '+cls:''}" data-say="${what}" aria-label="${label}" title="${label}">${SPEAK_SVG}</button>` : '';
    const hearW=TX('Hear the word','听这个单词'), hearEx=TX('Hear the example','听例句');
    const top=`<div class="fc-top"><span class="fc-pos">${esc(w.pos||'')}</span><span class="fc-stage st-${st}">${stName}</span></div>`;
    fc.innerHTML=`<div class="fc-inner">
      <div class="fc-face fc-front"${back?' inert aria-hidden="true"':''}>${top}
        <div class="fc-word-row"><h3 class="fc-word">${esc(w.w)}</h3>${say('word', hearW)}</div>
        <p class="fc-tip">${T('What does it mean? Turn the card over to check.','这个词是什么意思？把卡片翻过来看看。')}</p></div>
      <div class="fc-face fc-back"${back?'':' inert aria-hidden="true"'}>${top}
        <div class="fc-word-row"><p class="fc-word sm">${esc(w.w)}</p>${say('word', hearW)}</div>
        ${zh ? `<p class="fc-zh" lang="zh-CN">${esc(zh)}</p>` : ''}<p class="fc-def">${esc(w.def)}</p>
        ${w.ex ? `<p class="fc-ex"><i>${esc(w.ex)}</i>${say('ex', hearEx, 'sm')}</p>` : ''}
        ${w.syn && w.syn.length ? `<p class="fc-syn">${T('Similar','近义词')}: ${esc(w.syn.join(', '))}</p>` : ''}</div>
    </div>
    <button type="button" class="fc-flip" aria-pressed="${back}">${back ? T('Show the word','看单词') : T('Turn over','翻过来')}</button>`;
    fc.classList.toggle('flipped', back);
    fc.setAttribute('aria-label', TX(`Word ${i+1} of ${n}: ${w.w}`, `第 ${i+1} 个单词，共 ${n} 个：${w.w}`));
    document.getElementById('fcN').textContent=`${i+1} / ${n}`;
    document.getElementById('fcPrev').disabled = n<2;
    document.getElementById('fcNext').disabled = n<2;
    fc.querySelectorAll('[data-say]').forEach(b=>b.onclick=e=>{ e.stopPropagation(); sayIt(b.dataset.say==='ex' ? w.ex : String(w.w).split(/\s*\/\s*/)[0]); });
    fc.querySelector('.fc-flip').onclick=e=>{ e.stopPropagation(); flip(true); };
    if(focusSel){ const f=fc.querySelector(focusSel); if(f) f.focus({preventScroll:true}); }
  };
  const flip=(keepFocus)=>{ back=!back; draw(keepFocus ? '.fc-flip' : null); };
  const go=d=>{ i+=d; back=false; draw(); };
  fc.addEventListener('click', e=>{ if(e.target.closest('button, a')) return; flip(false); });
  document.getElementById('fcPrev').onclick=()=>go(-1);
  document.getElementById('fcNext').onclick=()=>go(1);
  document.getElementById('fcShuf').onclick=()=>{ const n=fcWords().length; fcOrder=shuffle([...Array(n).keys()]); i=0; back=false; draw(); };
  // Keys, while the student is in the cards: ← → to move, Space or Enter on the card's button to turn it
  document.querySelector('.fc-area').addEventListener('keydown', e=>{ if(e.target.closest('input, textarea, select')) return;
    if(e.key==='ArrowLeft'){ e.preventDefault(); go(-1); document.getElementById('fcPrev').focus({preventScroll:true}); }
    else if(e.key==='ArrowRight'){ e.preventDefault(); go(1); document.getElementById('fcNext').focus({preventScroll:true}); } });
  draw();
}

// Science pages: the columns the page's module names (GEN.columns: e.g. Chemistry, Vocabulary, Explaining)
function genColumns(){
  return GEN.columns.map(col=>{ const all=(col.games||[]).map(k=>GAMES.find(g=>g.key===k)).filter(g=>g && !HIDE.has(g.key) && hasRows(g) && (g.key!=='syn' || S.words.some(w=>w.syn)));
    const games=all.filter(g=>!phoneOff(g)), k=esc(col.key);
    return `<section class="col col-${k}" aria-labelledby="col-${k}"><h2 id="col-${k}">${esc(col.name)}</h2>
      ${all.length ? '' : '<p class="col-note">Coming soon</p>'}${games.map(gameCard).join('')}${games.length<all.length ? '<p class="col-note">The other games here are only available on desktop devices.</p>' : ''}</section>`; }).join('');
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
  const n=g.items().length, off=n<g.min, best=store.get((g.arcade||g.time?'best:':'streak:')+g.key,0);
  return `<a class="game${off?' off':''}" ${off?'aria-disabled="true"':`href="#play-${g.key}"`}>
    <h3>${g.name}</h3><p>${g.blurb}</p>
    <span class="best">${off?offWhy(g, n):best?(g.time?'Best time: '+mmss(best):(g.arcade?'Best score: ':'Best streak: ')+best):'Not played yet'}</span></a>`;
}

// ---------- CATEGORY: list of games ----------
function category(cat){
  if(COMPACT) return menu();
  const c=CATS[cat];
  if(c.desktop && PHONE && gamesIn(cat).every(phoneOff)){
    frame({href:'#', label:CFG.name||'Back'}, `<section class="hero"><p class="eyebrow">${esc(CFG.name||'')}</p><h1>${c.name}</h1>
      <p class="notice">Reading games are only available on desktop devices. Open this page on a computer to play them.</p></section>`, c.name);
    return;
  }
  const note = cat==='reading' && readingState==='loading' ? '<p class="notice">Loading reading passages…</p>' : cat==='reading' && readingState==='failed' ? '<p class="notice">The reading passages could not be loaded. They load when the site is online.</p>' : '';
  frame({href:'#', label:CFG.name||'Back'}, `
  <section class="hero"><p class="eyebrow">${esc(CFG.name||'')}${chosenBand()!=null?' · '+esc(bandName(chosenBand())):''}</p><h1>${c.name}</h1><p>${c.blurb}</p>${note}</section>
  <div class="games">${gamesIn(cat).filter(g=>!phoneOff(g)).map(gameCard).join('')}</div>`, c.name);
}

// ---------- game shell ----------
function shell(game, note){
  if(NEW_UI) return gameLayout(game, note);
  const c=CATS[game.cat]||GAME_ROW[game.cat]||{name:'Back'}, lsn=listenCan(game);
  frame(CFG.only ? {href:CFG.back||'../index.html', label:CFG.backLabel||'Back'} : COMPACT ? {href:'#', label:CFG.name||'Back'} : {href:'#'+game.cat, label:c.name}, `<div class="bar"><span class="title">${game.name}</span>${lsn?listenSwitch():''}<span class="spacer"></span><div class="stats" id="stats"></div></div>
    ${note?`<p class="hint">${note}</p>`:''}<div class="feed" id="feed"></div>`);
  if(lsn){ listenGame=game; listenWire(); }
}
// ---------- THE NEW GAME LAYOUT (redesign stage 2, 8 Nov 2026; only when NEW_UI) ----------
// The heading (the game's column as a small label, its name, how to play), then the game on the left and a side panel on
// the right: This round (or This game), any settings (Tell me how many; Listen is beside the name), Playing at (the level, with Change), the
// keys, and More in this subject (not in the Daily Circuit or a class game, which choose the games). On a Reading
// Comprehension page there is no side panel: the level and the round's score sit beside the heading, and the passage gets
// the width. On phones the score comes first as one line and the keys and More are left out (css/site.css).
// o (optional): {top: HTML above the game card, e.g. an arcade game's timer}
const ARCADE_KEYS = ['snake','whack','invaders'];
const isArcade = g => !!g && ARCADE_KEYS.includes(g.key) && ARCADE.some(a=>a.key===g.key);
// The keys each game listens for (only shown on computers). Keep in step with the game's keyHandler.
const KEY_HELP = {
  meaning:[['1–4','choose an answer'],['Enter','next question']], gap:[['1–4','choose an answer'],['Enter','next question']],
  question:[['1–4','choose an answer'],['Enter','next question']], gk:[['1–4','choose an answer'],['Enter','next question']],
  must:[['1–4','choose an answer'],['Enter','next question']],
  tf:[['T','true'],['F','false'],['Enter','next question']], rw:[['G','good grammar'],['B','bad grammar'],['Enter','next question']],
  error:[['Enter','check']], build:[['Enter','check']], own:[['1–4','choose an answer']],
  evidence:[['1–9','choose a detail'],['Enter','check']], read:[['1–9','put a word in the next gap'],['Backspace','take the last one out'],['Enter','check']],
  wchoice:[['A–D','choose a word for the gap'],['← →','another gap'],['Enter','check']], ocloze:[['Enter','next gap, then check']], wform:[['Enter','next gap, then check']],
  mouse:[['A–Z','guess a letter'],['Enter','next word']],
  wordsearch:[['Arrow keys','move on the board'],['Enter','first and last letter of a word'],['Esc','start again']],
  crossword:[['A–Z','type a letter'],['Arrow keys','move on the grid'],['Space','across or down'],['Tab','next clue'],['Backspace','take a letter out']],
  passage:[['1–9','choose an answer'],['Enter','confirm']], notes:[['1–9','choose a note'],['Enter','check']],
  snake:[['Arrow keys','steer (or W A S D)'],['Space','start']], whack:[['1–9','whack that hole'],['Space','start']],
  invaders:[['1–9','fire at that word'],['Space','start']], listen:[['P','play or pause'],['Enter','check']]
};
// The Chinese side (stage 4): its games' keys (the same games underneath), and the Chinese for each key and what it does
const ZH_KEYS = {zh:KEY_HELP.meaning, zhmean:KEY_HELP.meaning, zhtranslate:KEY_HELP.meaning, learn:KEY_HELP.meaning, zhtf:KEY_HELP.tf,
  zhbuild:KEY_HELP.build, zhevidence:KEY_HELP.evidence, zhmouse:KEY_HELP.mouse, zhwordsearch:KEY_HELP.wordsearch, zhcrossword:KEY_HELP.crossword, zhodd:[['1–4','choose an answer']],
  zhtype:[['Enter','check']], zhspeed:[['1–4','choose an answer']], zhsurvive:[['1–4','choose an answer']], zhmatch:null};
const KEY_ZH = {'choose an answer':'选择答案', 'next question':'下一题', 'true':'对', 'false':'错', 'good grammar':'语法正确', 'bad grammar':'语法错误',
  'check':'检查', 'choose a detail':'选择细节', 'put a word in the next gap':'把单词填进下一个空', 'take the last one out':'拿出最后一个',
  'guess a letter':'猜一个字母', 'next word':'下一个单词', 'move on the board':'在方阵上移动', 'first and last letter of a word':'选单词的第一个和最后一个字母',
  'start again':'重新选', 'choose an answer ':'选择答案', 'confirm':'确认', 'choose a note':'选择笔记', 'steer (or W A S D)':'转向（或 W A S D）', 'start':'开始',
  'whack that hole':'打那个洞', 'type a letter':'输入字母', 'move on the grid':'在方格中移动', 'across or down':'横向或纵向', 'next clue':'下一条提示', 'take a letter out':'删除一个字母', 'fire at that word':'射击那个单词', 'play or pause':'播放或暂停', 'Arrow keys':'方向键', 'Space':'空格键'};
const keysFor = k => SIDE==='zh' && k in ZH_KEYS ? ZH_KEYS[k] : KEY_HELP[k];
const keyT = s => SIDE==='zh' && KEY_ZH[s] ? T(s, KEY_ZH[s]) : s;
// The score boxes: [[label, value, after the value, id of the value], …] as <dl> items
const gStats = items => items.map(([k,v,after,id])=>`<div><dt>${k}</dt><dd><b${id?` id="${id}"`:''}>${v}</b>${after?`<small>${after}</small>`:''}</dd></div>`).join('');
// The column a game sits in on the topic page, as the small label over its name (HTML; on the Chinese side, ZH_COLS)
function gameColumn(game){
  if(SIDE==='zh'){ const c=ZH_COLS.find(c=>c.games.includes(game.key)); if(c) return T(esc(c.name), esc(c.zh));
    if(game.gen) return T(esc(GEN.title||'Practice'), esc(GEN.titleZh||'练习'));
    if(game.key==='learn') return T('Words','单词');
    if(game.key==='must') return T('Games','游戏');
    return isArcade(game) ? T('Games · arcade','游戏 · 街机') : ''; }
  if(isArcade(game)) return 'Games · arcade';
  if(GEN && GEN.columns){ const col=GEN.columns.find(c=>(c.games||[]).includes(game.key)); if(col) return esc(col.name); }
  return esc((CATS[game.cat]||GAME_ROW[game.cat]||{}).name || '');
}
// A game's name (HTML): on the Chinese side its Chinese name too
const gameNameT = g => SIDE==='zh' && g.zh ? T(esc(g.name), esc(g.zh)) : esc(g.name);
// The game on screen on the Chinese side (set when a game starts: see ZH_GAMES), for the heading and the side panel
let ZH_NOW = null;
let layoutBand = null;   // the level the game on screen was dealt at (Playing at), fixed when the game starts
function gameLayout(game, note, o){
  o=o||{}; layoutBand=chosenBand();
  const reading=CFG.only==='passage', lsn=listenCan(game), zh=SIDE==='zh';
  const back=CFG.only && CFG.only!=='zh' ? {href:CFG.back||'../index.html', label:CFG.backLabel||'Back'} : {href:'#', label:CFG.name||'Back'};
  const eyebrow=reading ? esc(CFG.eyebrow||'Reading') : gameColumn(game);
  const title=o.titleHtml || gameNameT(game);
  // The Listen switch sits beside the game's name (8 Nov 2026, teacher: a feature to promote; it was in the side panel)
  const head=`<div class="g-head"><div class="g-title">${eyebrow?`<p class="g-eyebrow">${eyebrow}</p>`:''}<div class="g-name"><h1>${title}</h1>${lsn?listenSwitch():''}</div>${note?`<p class="g-hint">${note}</p>`:''}</div>
    ${reading?`<div class="g-hstats"><dl class="g-lv" id="gLevel" hidden></dl><dl class="g-stats" id="stats" aria-label="This round"></dl></div>`:''}</div>`;
  const cur=zh ? {label:game.name||String(title).replace(/<[^>]*>/g,''), zh:game.zh||''} : game.name;
  if(reading) frame(back, `${head}<div class="g-wide">${o.top||''}<div class="feed" id="feed"></div></div>`, cur, 'reading');
  else frame(back, `${head}<div class="g-layout"><div class="g-main">${o.top||''}<div class="feed" id="feed"></div></div>${sidePanel(game)}</div>`, cur, 'game');
  if(lsn){ listenGame=game; listenWire(); }
}
function sidePanel(game){
  const keys=keysFor(game.key), free=!inCircuit && !classRun;
  return `<aside class="g-side" aria-label="${TX('About this game','关于这个游戏')}">
    <section class="g-box g-round" aria-labelledby="gRoundH"><h2 id="gRoundH">${isArcade(game) || ['wordsearch','zhwordsearch','crossword','zhcrossword'].includes(game.key) ? T('This game','本局') : T('This round','本轮')}</h2><dl class="g-stats" id="stats"></dl></section>
    <section class="g-box g-tools" id="gTools" aria-label="${TX('Settings','设置')}" hidden></section>
    ${LEVELS.length ? `<section class="g-box g-level" id="gLevelBox" aria-labelledby="gLevelH">${levelBoxInner()}</section>` : ''}
    ${keys ? `<section class="g-box g-keys" aria-labelledby="gKeysH"><h2 id="gKeysH">${T('Keys','按键')}</h2><ul>${keys.map(([k,t])=>`<li><kbd>${keyT(k)}</kbd> ${keyT(t)}</li>`).join('')}</ul></section>` : ''}
    ${free ? moreBox(game) : ''}
  </aside>`;
}
// Playing at: the level the questions come from (when the game started: Change goes back to the topic's level buttons;
// the Chinese side has no Change, its level moves by itself),
// then the student's level in this topic (a bar, and how far they are to the next level, or how many answers until it is
// found), which moves with every answer
function levelBoxInner(){
  const b=layoutBand, t=P.topic(), n=t ? t.n||0 : 0, free=!inCircuit && !classRun, zh=SIDE==='zh';
  let bar, cap;
  if(n<P.CAL){ bar=n*100/P.CAL; cap=T(`Finding your level: ${n} of ${P.CAL} answers`, `正在评估你的水平：已答 ${n} / ${P.CAL} 题`); }
  else { const L=P.label(t.r); bar=L.pct;
    cap=zh ? T(`Your level: ${esc(L.name)}${L.next?` · ${L.pct}% of the way to ${esc(L.next)}`:''}`, `你的水平：${L.zh||esc(L.name)}${L.next?` · 距离下一级还有 ${100-L.pct}%`:''}`)
      : `Your level: ${esc(L.name)}${L.next?` · ${L.pct}% of the way to ${esc(L.next)}`:''}`; }
  const lv=b==null ? T('Every level','所有级别') : zh && LEVEL_ZH[LEVEL_CODES[b]] ? T(nameHtml(bandName(b)), LEVEL_ZH[LEVEL_CODES[b]]) : nameHtml(bandName(b));
  return `<h2 id="gLevelH">${T('Playing at','当前级别')}</h2><p class="g-lvl"><span>${lv}</span>${free && !zh?`<a href="#">${T('Change','更改')}</a>`:''}</p>
    <span class="g-bar" aria-hidden="true"><i style="width:${Math.round(bar)}%"></i></span><p class="g-cap">${cap}</p>`;
}
function drawLevelBox(){ if(!NEW_UI) return; const el=document.getElementById('gLevelBox'); if(el) el.innerHTML=levelBoxInner(); }
// More in this subject: two more from the game's own column, then others, then an arcade game (four in all). Arcade games
// and the Games row (Save the mouse, Word search, General knowledge): More games, the rest of that row.
function moreBox(game){
  if(SIDE==='zh') return zhMoreBox(game);
  const ready=g=>g.key!==game.key && !HIDE.has(g.key) && !phoneOff(g) && g.key!=='passage' && g.items().length>=g.min;
  const arcade=ARCADE.filter(a=>!HIDE.has(a.key) && a.key!==game.key && a.items().length>=a.min);
  const cols=Object.keys(CATS);
  const inCol=k=>GAMES.filter(g=>g.cat===k && gamesIn(k).includes(g) && ready(g));
  let list;
  if(isArcade(game) || game.cat==='games') list=[...inCol('games'), ...arcade].slice(0, 4);
  else {
    const same=GAMES.filter(g=>g.cat===game.cat && (game.gen || gamesIn(g.cat).includes(g)) && ready(g)).slice(0, 2);
    const others=[]; cols.filter(k=>k!==game.cat && k!=='games').forEach(k=>{ const g=inCol(k)[0]; if(g) others.push(g); });
    GAMES.filter(g=>g.gen && g.cat!==game.cat && ready(g)).forEach(g=>{ if(!others.some(x=>x.cat===g.cat)) others.push(g); });
    list=[...same, ...others].slice(0, 3); if(arcade[0]) list.push(arcade[0]);
    if(list.length<4) list=[...list, ...[...inCol('games'), ...arcade.slice(1)].filter(g=>!list.includes(g))].slice(0, 4);
  }
  if(!list.length) return '';
  const RIGHT='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m9 6 6 6-6 6"/></svg>';
  return `<section class="g-box g-more" aria-labelledby="gMoreH"><h2 id="gMoreH">${isArcade(game) || game.cat==='games' ? 'More games' : 'More in '+esc(CFG.name||'this subject')}</h2>
    <ul>${list.map(g=>`<li><a href="#play-${esc(g.key)}"><span>${esc(g.name)}</span>${RIGHT}</a></li>`).join('')}</ul></section>`;
}
// The Chinese side: two more from the game's own column (or the science page's own games), then the first open game of
// each other column (four in all)
function zhMoreBox(game){
  const get=k=>k==='snake' ? ZH_SNAKE : ZH_GAMES.find(g=>g.key===k), open=k=>{ const g=get(k); return g && g.key!==game.key && zhReady(g) ? g : null; };
  const col=ZH_COLS.find(c=>c.games.includes(game.key)), gen=GEN_ZH.filter(g=>g.key!==game.key && g.ready());
  const same=col ? col.games.map(open).filter(Boolean).slice(0, 2) : game.gen ? gen.slice(0, 2) : [];   // a science page's own game: two more of those first
  const others=ZH_COLS.filter(c=>c!==col).map(c=>c.games.map(open).find(Boolean)).filter(Boolean);
  const list=[...new Set([...same, ...others, ...gen, ...ZH_COLS.flatMap(c=>c.games.map(open)).filter(Boolean)])].slice(0, 4);
  if(!list.length) return '';
  const RIGHT='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m9 6 6 6-6 6"/></svg>';
  const n=splitName(CFG.name||'');
  return `<section class="g-box g-more" aria-labelledby="gMoreH"><h2 id="gMoreH">${T('More in '+esc(n.en||'this subject'), esc(n.zh||n.en)+'的更多游戏')}</h2>
    <ul>${list.map(g=>`<li><a href="#play-${esc(g.key)}"><span>${gameNameT(g)}</span>${RIGHT}</a></li>`).join('')}</ul></section>`;
}
// A place for a game's own settings (Spot the error: Tell me how many) in the side panel; the old bar without NEW_UI
function gameTools(){ if(!NEW_UI) return document.querySelector('.bar'); const t=document.getElementById('gTools'); if(t) t.hidden=false; return t; }

// The height of the top bar when it stays in view (computers only: css/site.css), so a card is never scrolled under it
const stickyTop = () => { const t=document.querySelector('.aea-top'); return t && getComputedStyle(t).position==='sticky' ? t.getBoundingClientRect().height : 0; };
function showCard(html){
  const feed=document.getElementById('feed');
  const old=feed.querySelector('.card'); if(old) old.remove();
  const card=document.createElement('div'); card.className='card enter'; card.innerHTML=html; lastMiss=null;
  feed.appendChild(card);
  if(listenGame && listenOn()) listenCard(card);   // Listen switch on: the text at the top is read out instead of shown
  const top=feed.getBoundingClientRect().top, bar=stickyTop(); if(top<bar) window.scrollBy(0, top-bar-16);
  return card;
}
function autoNext(card, next, ms){
  if(qf) return qfRight(card, next);   // Daily Circuit quick-fire: on after a steady second, whatever the game
  const dur=ms||AUTO_MS, bar=document.createElement('div'); bar.className='auto'; bar.innerHTML='<i></i>';
  bar.style.setProperty('--dur', dur+'ms'); card.appendChild(bar);
  requestAnimationFrame(()=>requestAnimationFrame(()=>bar.classList.add('run')));
  let done=false; const fire=()=>{ if(done) return; done=true; clearTimers(); next(); };
  later(fire, dur);
  card.addEventListener('click', e=>{ if(!e.target.closest('button')) fire(); });
  keyHandler = e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); fire(); } };
}
function manualNext(card, next, label, ms){
  if(qf) return qfWrong(card, next);   // Daily Circuit quick-fire: the answer stays until Continue
  const row=document.createElement('div'); row.className='next-row';
  row.innerHTML=`<button class="btn">${label||T('Next','下一个')+' →'}</button>`; card.appendChild(row);
  const b=row.querySelector('button'); b.onclick=next; b.focus({preventScroll:true});
  const miss=lastMiss; lastMiss=null; reportButton(card, row, miss);   // only after a wrong answer
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
const fbOk = (fb, html) => fb.innerHTML=`<div class="feedback ok"><span class="verdict">${T('Correct.','答对了！')}</span>${String(html||'').replace(/<span><\/span>/g,'')}</div>`;
const fbNo = (fb, answer, html) => fb.innerHTML=`<div class="feedback no"><span class="verdict">${T(`Not quite.${answer?` The answer is ${esc(answer)}.`:''}`, `不对。${answer?`答案是 ${esc(answer)}。`:''}`)}</span>${String(html||'').replace(/<span><\/span>/g,'')}</div>`;
// After an answer: right → move on by itself; wrong → explain, wait, and bring the item back later.
function settle(ok, card, st, deck, item, next, ms){   // ms: how long before moving on after a right answer (default AUTO_MS)
  listenReveal(card);   // Listen switch: the words appear once the student has answered
  if(ok){ st.hit(item); autoNext(card, next, ms); } else { st.miss(item); deck.retry(item); manualNext(card, next, undefined, ms); }
}

// ---------- VOCABULARY: Save the mouse (hangman with the logo mouse, 31 Oct, teacher) ----------
// Guess the word from its meaning (and its Chinese on the Chinese side), one letter at a time, on screen or with the
// keyboard. Every wrong letter takes one of the mouse's 8 pieces away (ears, cheeks, top of head, eyes, nose: the logo,
// HOME_MARK, cut up with clip paths); lose all 8 and the word is shown. One answer per word (right if guessed in time).
// Words need 4+ letters (parts in brackets and alternatives after "/" are left out). Not in the Daily Circuit.
const mouseTarget = w => String(w.w).split(/\s*\/\s*/)[0].replace(/\s*\([^)]*\)\s*/g,' ').trim().toLowerCase();
const mouseWords = list => { const ok=list.filter(w=>{ const t=mouseTarget(w); return /^[a-z][a-z '\-]*$/.test(t) && t.replace(/[^a-z]/g,'').length>=4; }); return ok.length>=4 ? ok : list; };
const MOUSE_ORDER = ['earL','earR','cheekL','cheekR','top','eyeL','eyeR','nose'];   // the order the pieces go
function mouseSvg(){
  const d=(HOME_MARK.match(/ d="([^"]+)"/)||[])[1]||'', sub=d.split('M').filter(x=>x.trim()).map(x=>'M'+x);
  if(sub.length<6) return HOME_MARK;
  const ring=sub[1]+sub[4]+sub[5], R={earL:'0,0 120,0 120,60 72,110 0,128', earR:'290,0 170,0 170,60 218,110 290,128',
    top:'120,0 170,0 170,60 218,110 72,110 120,60', cheekL:'0,128 72,110 145,110 145,240 0,240', cheekR:'290,128 218,110 145,110 145,240 290,240'};
  return `<svg class="mouse" viewBox="0 0 290 240" role="img" aria-label="The mouse"><defs>${Object.entries(R).map(([k,v])=>`<clipPath id="mc-${k}"><polygon points="${v}"/></clipPath>`).join('')}</defs>
    ${Object.keys(R).map(k=>`<path class="mp" data-part="${k}" clip-path="url(#mc-${k})" fill="currentColor" fill-rule="evenodd" d="${ring}"/>`).join('')}
    <path class="mp" data-part="nose" fill="currentColor" d="${sub[0]}"/><path class="mp" data-part="eyeL" fill="currentColor" d="${sub[2]}"/><path class="mp" data-part="eyeR" fill="currentColor" d="${sub[3]}"/></svg>`;
}
function playMouse(zh){
  const LIVES=MOUSE_ORDER.length, key=zh?'zhmouse':'mouse', st=Stats(key);
  const deck=zh ? Deck(()=>mouseWords(zhWords())) : Deck(mouseWords(pick(S.words)));
  if(zh) zhShell(T('Save the mouse','拯救小老鼠'), T('Guess the English word one letter at a time. Every wrong letter and the mouse loses a piece.','一个字母一个字母地猜英文单词。每猜错一次，小老鼠就少一块。'));
  else shell(GAMES.find(g=>g.key==='mouse'), 'Tap letters, or type them. Every wrong letter and the mouse loses a piece.');
  st.draw();
  const step=()=>{
    const w=deck.next(), target=mouseTarget(w), letters=new Set(target.replace(/[^a-z]/g,''));
    const card=showCard(`<p class="instr">${T('Guess the word','猜单词')}</p>
      <div class="hm"><div class="hm-mouse">${mouseSvg()}</div>
      <div class="hm-main"><p class="prompt-def">${esc(w.def)}${!zh&&w.pos?` <small class="hm-pos">${esc(w.pos)}</small>`:''}</p>${zh&&ZH[w.id]?`<p class="zh-under" lang="zh-CN">${esc(ZH[w.id])}</p>`:''}
        <p class="hm-word" aria-live="polite">${[...target].map(ch=>/[a-z]/.test(ch)?`<span class="hm-l" data-ch="${ch}"></span>`:ch===' '?'<span class="hm-sp"></span>':`<span class="hm-p">${esc(ch)}</span>`).join('')}</p>
        <p class="hm-left"></p></div></div>
      <div class="hm-keys">${'abcdefghijklmnopqrstuvwxyz'.split('').map(c=>`<button class="hm-k" data-k="${c}" aria-label="${c}">${c}</button>`).join('')}</div><div class="fb"></div>`);
    let wrong=0, done=false; const found=new Set();
    const left=()=>{ const n=LIVES-wrong; card.querySelector('.hm-left').innerHTML=T(`<b>${n}</b> wrong guess${n===1?'':'es'} left`, `还能猜错 <b>${n}</b> 次`); };
    left();
    const finish=ok=>{ done=true; keyHandler=null; card.querySelectorAll('.hm-k').forEach(b=>b.disabled=true);
      card.querySelectorAll('.hm-l').forEach(s=>{ if(!s.textContent){ s.textContent=s.dataset.ch; s.classList.add('miss'); } });
      const fb=card.querySelector('.fb'), ex=w.ex?`<span class="wd"><i>${esc(w.ex)}</i></span>`:'';
      ok ? fbOk(fb, ex) : fbNo(fb, w.w, ex);
      settle(ok, card, st, deck, w, step); };
    const guess=c=>{ if(done) return; const b=card.querySelector(`.hm-k[data-k="${c}"]`); if(!b || b.disabled) return; b.disabled=true;
      if(letters.has(c)){ b.classList.add('ok'); found.add(c); card.querySelectorAll(`.hm-l[data-ch="${c}"]`).forEach(s=>{ s.textContent=c; s.classList.add('in'); });
        if(found.size===letters.size) finish(true); }
      else { b.classList.add('no'); const part=card.querySelector(`.mp[data-part="${MOUSE_ORDER[wrong]}"]`); if(part) part.classList.add('gone'); wrong++; left();
        const m=card.querySelector('.hm-mouse'); m.classList.remove('shake'); void m.offsetWidth; m.classList.add('shake');
        if(wrong>=LIVES) finish(false); } };
    card.querySelectorAll('.hm-k').forEach(b=>b.onclick=()=>guess(b.dataset.k));
    keyHandler=e=>{ const k=e.key.toLowerCase(); if(/^[a-z]$/.test(k)) guess(k); };
  };
  step();
}

// ---------- GAMES: Word search (7 Nov 2026, teacher: "a board of letters, with the keywords hidden in it, and they have to click on them to find them") ----------
// The topic's words at the student's level are hidden in a square of letters. Drag from a word's first letter to its last
// (or click one end, then the other; or move with the arrow keys and press Enter at each end). The list beside the board
// shows the words, or (the switch above it) their meanings on the English side and their Chinese on the Chinese side, so the
// student works out the word first. A word found is marked in its own colour and its meaning shows in the list.
// How hard, by level: Foundation 10 × 10 (phones 9 × 9), 7 words (phones 6), across and down; Foundation+ diagonally down too;
// Intermediate and up 12 × 12 (phones 10 × 10), 9 words (phones 7), diagonals both ways; Intermediate+ some backwards;
// Advanced every direction (WS_DIRS). Spaces, hyphens and apostrophes are left out of the board (close-up is CLOSEUP);
// a word needs 4 letters or more, and no word on a board is inside another. Every word is on the board once only, and the
// random letters never spell a rude word (WS_RUDE) in any direction.
// Progress: each word found is a right answer (word points, and the word moves on). With the words shown it doesn't move
// the student's level (they were given the word); with meanings or Chinese it counts like any answer, and Show the rest
// counts the words not found as wrong. Best time (best:<key>): the fastest board finished without Show the rest.
const WS_DIRS = [null, [[0,1],[1,0]], [[0,1],[1,0],[1,1]], [[0,1],[1,0],[1,1],[-1,1]],
  [[0,1],[1,0],[1,1],[-1,1],[0,-1],[-1,0]], [[0,1],[1,0],[1,1],[-1,1],[0,-1],[-1,0],[-1,-1],[1,-1]]];
const WS_SAY = [null, ['Words go across and down.', '单词横向或纵向排列。'], ['Words go across, down and diagonally down.', '单词横向、纵向或斜向下排列。'],
  ['Words go across, down and diagonally.', '单词横向、纵向或斜向排列。'], ['Words go across, down and diagonally, and some are backwards.', '单词横向、纵向或斜向排列，有些是倒着的。'],
  ['Words go in every direction, backwards too.', '单词可以朝任何方向排列，也可以倒着。']];
const WS_FILL = 'EEEEEEAAAAAIIIIOOOOTTTTNNNNSSSSRRRRLLLHHHDDDCCCUUMMPPGGBBFFYWWKV';   // the random letters, roughly as common as in English
const WS_RUDE = ['kcuf','tihs','tnuc','kcid','kcoc','ssip','tawt','tuls','gaf','stit','esra','ssa','nrop','knaw','izan','epar','hctib','xes','erohw'];   // never spelt by the random letters (written backwards here)
const WS_COL = ['#f2a93b','#4ea3e8','#5cc97a','#f27fa6','#a98bf0','#f5795a','#3fc7bb','#d9c52f','#7fb6e0','#e78ae0'];
const wsPlain = w => mouseTarget(w).normalize('NFD').replace(/[̀-ͯ]/g, '');
const wsLetters = w => wsPlain(w).replace(/[^a-z]/g, '').toUpperCase();
const wsShow = w => String(w.w).split(/\s*\/\s*/)[0].replace(/\s*\([^)]*\)\s*/g, ' ').trim();
const wsFit = (list, size) => (list||[]).filter(w=>{ const t=wsPlain(w), n=t.replace(/[^a-z]/g,'').length;
  return /^[a-z][a-z '’\-]*$/.test(t) && t.split(/\s+/).length<=3 && n>=4 && n<=size; });
const mmss = s => Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
// The board: the chosen words first (longest placed first), a spare word whenever one won't fit; then the random letters
function wsMake(cands, n, size, dirs){
  const inside=(r,c)=>r>=0 && r<size && c>=0 && c<size;
  for(let t=0; t<30; t++){
    const g=Array.from({length:size}, ()=>Array(size).fill('')), placed=[];
    for(const it of [...cands.slice(0, n).sort((a,b)=>b.L.length-a.L.length), ...cands.slice(n)]){
      if(placed.length>=n) break;
      const L=it.L; let spot=null;
      for(const [dr,dc] of shuffle(dirs)){   // a direction at random, then a place in that direction
        const spots=[];
        for(let r=0;r<size;r++) for(let c=0;c<size;c++){
          if(!inside(r+dr*(L.length-1), c+dc*(L.length-1))) continue;
          let ov=0, ok=true;
          for(let i=0;i<L.length;i++){ const ch=g[r+dr*i][c+dc*i]; if(ch){ if(ch!==L[i]){ ok=false; break; } ov++; } }
          if(ok && ov<L.length) spots.push({r, c, dr, dc, ov});
        }
        if(spots.length){ const cross=spots.filter(s=>s.ov); const from=cross.length && Math.random()<.4 ? cross : spots; spot=from[Math.floor(Math.random()*from.length)]; break; }
      }
      if(!spot) continue;
      for(let i=0;i<L.length;i++) g[spot.r+spot.dr*i][spot.c+spot.dc*i]=L[i];
      placed.push(Object.assign({}, it, {cells:[...Array(L.length).keys()].map(i=>(spot.r+spot.dr*i)*size+spot.c+spot.dc*i)}));
    }
    if(placed.length<Math.min(n, 4)) continue;
    for(let f=0; f<60; f++){
      const b=g.map(row=>row.map(ch=>ch || WS_FILL[Math.floor(Math.random()*WS_FILL.length)]));
      if(wsClean(b, placed, size)) return {b, placed};
    }
  }
  return null;
}
// Every word once only, and no rude word made by the random letters (one inside a topic word, like "class", is fine)
function wsClean(b, placed, size){
  const D=WS_DIRS[5];
  const scan=W=>{ const out=[], seen=new Set();
    for(let r=0;r<size;r++) for(let c=0;c<size;c++){ if(b[r][c]!==W[0]) continue;
      for(const [dr,dc] of D){ const er=r+dr*(W.length-1), ec=c+dc*(W.length-1); if(er<0||er>=size||ec<0||ec>=size) continue;
        let ok=true; for(let i=1;i<W.length;i++) if(b[r+dr*i][c+dc*i]!==W[i]){ ok=false; break; }
        if(!ok) continue; const a=r*size+c, z=er*size+ec, k=Math.min(a,z)+'-'+Math.max(a,z);
        if(!seen.has(k)){ seen.add(k); out.push([...Array(W.length).keys()].map(i=>(r+dr*i)*size+c+dc*i)); } } }
    return out; };
  if(placed.some(p=>scan(p.L).length!==1)) return false;
  const inWord=cells=>placed.some(p=>cells.every(x=>p.cells.includes(x)));
  return WS_RUDE.every(x=>scan([...x].reverse().join('').toUpperCase()).every(inWord));
}
function playWordSearch(zh){
  const key=zh ? 'zhwordsearch' : 'wordsearch'; CUR_GAME=key;
  const lv=Math.max(1, Math.min(5, chosenBand() || 3)), big=lv>=3;
  const size=big ? (PHONE?10:12) : (PHONE?9:10), n=big ? (PHONE?7:9) : (PHONE?6:7), dirs=WS_DIRS[lv];
  const how=T(`${WS_SAY[lv][0]} Drag from the first letter of a word to the last, or click one end and then the other.`,
    `${WS_SAY[lv][1]}从单词的第一个字母拖到最后一个字母，或先点一头再点另一头。`);
  if(zh) zhShell(T('Word search','单词搜索'), how); else shell(GAMES.find(g=>g.key==='wordsearch'), how);
  let mode=store.get('wsmode', 'words')==='clues' ? 'clues' : 'words';
  // The words: the student's words at their level (Chinese side: their own set), due words first; topped up from nearby levels
  const cands=()=>{
    const main=wsFit(rankForLevel(zh ? zhWords() : pick(S.words)).filter(w=>!hiddenItem(w)), size);
    const more=wsFit(rankForLevel((zh ? zhBankAll().filter(w=>(bandOf(w)??9)<=zhBand()) : S.words).filter(w=>!main.includes(w))), size);
    const out=[];
    for(const w of [...main, ...more]){ const L=wsLetters(w), R=[...L].reverse().join('');
      if(out.some(o=>o.L.includes(L) || L.includes(o.L) || o.L.includes(R) || o.w.def===w.def)) continue;
      out.push({w, L}); if(out.length>=n+10) break; }
    return out; };
  const newBoard=()=>{
    clearTimers(); keyHandler=null;
    const made=wsMake(cands(), n, size, dirs);
    if(!made){ showCard(`<p class="instr">${T('There aren\'t enough words for a word search at this level yet.','这个级别的单词还不够做单词搜索。')}</p>`); return; }
    const {b, placed}=made, found=new Set(), best=store.get('best:'+key, 0), t0=Date.now();
    placed.forEach((p,k)=>{ p.col=WS_COL[k%WS_COL.length]; });
    let pend=null, drag=null, flash=null, cur=0, kb=false, done=0, gaveUp=false;
    const card=showCard(`<div class="ws"><div class="ws-left">
        <div class="ws-board" style="--n:${size}"><svg class="ws-marks" viewBox="0 0 ${size*10} ${size*10}" aria-hidden="true"></svg>
          <div class="ws-grid" tabindex="0" role="application" aria-label="${esc(TX('Word search board: use the arrow keys, and Enter at the first and last letter of a word','单词搜索：用方向键移动，在单词的第一个和最后一个字母上按回车'))}">${b.flat().map((ch,i)=>`<span class="ws-c" data-i="${i}">${ch}</span>`).join('')}</div></div>
          <div class="ws-acts"><button type="button" class="btn alt small ws-give">${T('Show the rest','显示剩下的')}</button><button type="button" class="btn alt small ws-new">${T('New puzzle','换一个')}</button></div>
          <div class="ws-end" aria-live="polite"></div></div>
        <div class="ws-side">
          <div class="ws-mode" role="group" aria-label="${esc(TX('The list shows','列表显示'))}"><button type="button" data-m="words">${T('Words','单词')}</button><button type="button" data-m="clues">${zh ? T('Chinese','中文') : 'Meanings'}</button></div>
          <ol class="ws-list"></ol>
        </div></div>`);
    card.classList.add('ws-card');
    const grid=card.querySelector('.ws-grid'), svg=card.querySelector('.ws-marks'), list=card.querySelector('.ws-list'), cells=[...grid.children];
    const centre=i=>[(i%size)*10+5, Math.floor(i/size)*10+5];
    const line=(a, z, cls, col)=>{ const [x1,y1]=centre(a), [x2,y2]=centre(z);
      return a===z ? `<circle class="${cls}" cx="${x1}" cy="${y1}" r="3.9"${col?` style="fill:${col}"`:''}/>` : `<line class="${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${col?` style="stroke:${col}"`:''}/>`; };
    const marks=()=>{ svg.innerHTML=placed.map((p,k)=>found.has(k) ? line(p.cells[0], p.cells[p.cells.length-1], 'f', p.col) : gaveUp ? line(p.cells[0], p.cells[p.cells.length-1], 'm') : '').join('')
      + (flash ? line(flash[0], flash[1], 'x') : '') + (drag ? line(drag.a, drag.z, 's') : pend!=null ? line(pend, pend, 's') : '');
      cells.forEach((c,i)=>c.classList.toggle('cur', kb && i===cur && !done)); grid.classList.toggle('kb', kb); };
    const stats=()=>{ const el=document.getElementById('stats'); if(!el) return; const s=Math.floor(((done||Date.now())-t0)/1000), bt=store.get('best:'+key, 0);
      el.innerHTML=NEW_UI ? gStats([[T('Found','找到'), found.size, '/'+placed.length], [T('Time','时间'), mmss(s)], [T('Best','最佳'), bt ? mmss(bt) : '–']])
        : `<span>${T('Found','找到')} <b>${found.size}</b>/${placed.length}</span><span>${T('Time','用时')} <b>${mmss(s)}</b></span>${bt?`<span>${T('Best','最快')} <b>${mmss(bt)}</b></span>`:''}`; };
    const tick=()=>{ if(done) return; stats(); later(tick, 1000); };
    const drawList=()=>{
      card.querySelectorAll('.ws-mode button').forEach(x=>x.setAttribute('aria-pressed', x.dataset.m===mode));
      list.classList.toggle('clues', mode==='clues');
      list.innerHTML=placed.map((p,k)=>{ const w=p.w, f=found.has(k), miss=gaveUp && !f, open=f||miss, zhw=zh && ZH[w.id] ? `<span class="ws-zh" lang="zh-CN">${esc(ZH[w.id])}</span>` : '';
        const word=`<b class="ws-w">${esc(wsShow(w))}</b>`, def=`<span class="ws-def">${esc(w.def)}</span>`, len=`<span class="ws-len">${T(`${p.L.length} letters`, `${p.L.length} 个字母`)}</span>`;
        const body = mode==='words' ? word + (open ? zhw + def : '')
          : open ? word + (zh ? zhw + def : def) : (zh ? zhw : `<span class="ws-clue">${esc(w.def)}</span>`) + len;
        return `<li class="${f?'found':''}${miss?' miss':''}" style="--wc:${p.col}">${body}</li>`; }).join(''); };
    // A word picked: right if its first and last letters are those of a word on the board (either way round)
    const tryPick=(a, z)=>{
      const k=placed.findIndex((p,k)=>!found.has(k) && ((p.cells[0]===a && p.cells[p.cells.length-1]===z) || (p.cells[0]===z && p.cells[p.cells.length-1]===a)));
      if(k<0){ if(placed.some((p,k)=>found.has(k) && ((p.cells[0]===a && p.cells[p.cells.length-1]===z) || (p.cells[0]===z && p.cells[p.cells.length-1]===a)))) return;
        flash=[a, z]; marks(); later(()=>{ flash=null; marks(); }, 450); return; }
      found.add(k); P.record(key, placed[k].w, true, mode==='words' ? {noRate:true} : null);
      marks(); drawList(); stats();
      const li=list.children[k]; if(li){ li.classList.add('pop'); if(PHONE) li.scrollIntoView({block:'nearest', behavior:'smooth'}); }
      if(found.size===placed.length) finish();
    };
    const aligned=(a, z)=>{ const dr=Math.floor(z/size)-Math.floor(a/size), dc=z%size-a%size; return a!==z && (!dr || !dc || Math.abs(dr)===Math.abs(dc)); };
    // Where the pointer is, as a cell; and the end of a straight line from a towards it (the nearest of the 8 directions)
    const pos=e=>{ const r=grid.getBoundingClientRect(); return [(e.clientX-r.left)/r.width*size, (e.clientY-r.top)/r.height*size]; };
    const cellAt=e=>{ const [x,y]=pos(e); return x<0||y<0||x>=size||y>=size ? null : Math.floor(y)*size+Math.floor(x); };
    const snap=(a, e)=>{ const [x,y]=pos(e), ar=Math.floor(a/size), ac=a%size, dx=x-.5-ac, dy=y-.5-ar;
      if(Math.abs(dx)<.5 && Math.abs(dy)<.5) return a;
      const k=Math.round(Math.atan2(dy, dx)/(Math.PI/4)), dc=Math.round(Math.cos(k*Math.PI/4)), dr=Math.round(Math.sin(k*Math.PI/4));
      let len=Math.max(0, Math.round((dx*dc+dy*dr)/(dr&&dc?2:1)));
      while(len>0 && !(ar+dr*len>=0 && ar+dr*len<size && ac+dc*len>=0 && ac+dc*len<size)) len--;
      return (ar+dr*len)*size+ac+dc*len; };
    grid.addEventListener('pointerdown', e=>{ if(done || (e.pointerType==='mouse' && e.button!==0)) return; const i=cellAt(e); if(i==null) return;
      e.preventDefault(); kb=false; cur=i; if(e.pointerType==='mouse') grid.focus({preventScroll:true}); try{ grid.setPointerCapture(e.pointerId); }catch(x){}
      drag={a:i, z:i, id:e.pointerId, moved:false}; marks(); });
    grid.addEventListener('pointermove', e=>{ if(!drag || e.pointerId!==drag.id) return; const z=snap(drag.a, e); if(z!==drag.z){ drag.z=z; if(z!==drag.a) drag.moved=true; marks(); } });
    const up=e=>{ if(!drag || e.pointerId!==drag.id) return; const d=drag; drag=null;
      if(e.type==='pointercancel'){ marks(); return; }
      if(d.moved && d.z!==d.a){ pend=null; marks(); tryPick(d.a, d.z); return; }
      // a click: the first end, then the other end
      if(pend!=null && aligned(pend, d.a)){ const a=pend; pend=null; marks(); tryPick(a, d.a); }
      else { pend = pend===d.a ? null : d.a; marks(); } };
    grid.addEventListener('pointerup', up); grid.addEventListener('pointercancel', up);
    grid.addEventListener('keydown', e=>{ if(done || e.metaKey || e.ctrlKey || e.altKey) return;
      const mv={ArrowUp:[-1,0], ArrowDown:[1,0], ArrowLeft:[0,-1], ArrowRight:[0,1]}[e.key];
      if(mv){ e.preventDefault(); e.stopPropagation(); kb=true; cur=Math.max(0, Math.min(size-1, Math.floor(cur/size)+mv[0]))*size + Math.max(0, Math.min(size-1, cur%size+mv[1])); marks(); return; }
      if(e.key==='Enter' || e.key===' '){ e.preventDefault(); e.stopPropagation(); kb=true;
        if(pend!=null && aligned(pend, cur)){ const a=pend; pend=null; marks(); tryPick(a, cur); } else { pend = pend===cur ? null : cur; marks(); } return; }
      if(e.key==='Escape'){ pend=null; marks(); } });
    grid.addEventListener('blur', ()=>{ if(kb){ kb=false; marks(); } });
    card.querySelectorAll('.ws-mode button').forEach(x=>x.onclick=()=>{ mode=x.dataset.m; store.set('wsmode', mode); drawList(); });
    card.querySelector('.ws-new').onclick=newBoard;
    card.querySelector('.ws-give').onclick=()=>{ if(done) return; gaveUp=true;
      if(mode==='clues') placed.forEach((p,k)=>{ if(!found.has(k)) P.record(key, p.w, false); });   // with the words shown, not finding one says nothing about knowing it
      finish(); };
    const finish=()=>{
      done=Date.now(); pend=null; drag=null; marks(); drawList(); stats(); card.classList.add('ws-over');
      const secs=Math.round((done-t0)/1000), prev=store.get('best:'+key, 0), isBest=!gaveUp && (!prev || secs<prev);
      if(isBest) store.set('best:'+key, secs);
      card.querySelector('.ws-give').hidden=true;
      const nb=card.querySelector('.ws-new'); nb.classList.remove('alt', 'small'); nb.focus({preventScroll:true});
      card.querySelector('.ws-end').innerHTML = gaveUp
        ? `<p class="ws-sum"><b>${T(`You found ${found.size} of ${placed.length}.`, `你找到了 ${found.size} 个，共 ${placed.length} 个。`)}</b> ${T('The others are marked on the board and in the list.', '其余的单词已在方阵和列表中标出。')}</p>`
        : `<p class="ws-sum"><b>${T(`All ${placed.length} words in ${mmss(secs)}!`, `全部 ${placed.length} 个单词，用时 ${mmss(secs)}！`)}</b> ${isBest ? T('A new best time.', '新纪录！') : prev ? T(`Your best time is ${mmss(prev)}.`, `你的最快纪录是 ${mmss(prev)}。`) : ''}</p>`;
      if(!gaveUp) sfxDone(card);
      keyHandler=e=>{ if(e.key==='Enter'){ e.preventDefault(); newBoard(); } };
    };
    drawList(); marks(); tick();
    if(!PHONE) grid.focus({preventScroll:true});
  };
  newBoard();
}
// All found: the board's marks light up one after another
function sfxDone(card){ card.querySelectorAll('.ws-marks .f').forEach((l,i)=>{ l.style.animationDelay=(i*70)+'ms'; l.classList.add('glow'); }); }

// ---------- GAMES: Crossword (9 Nov 2026, teacher: "Could we do a crosswords game?") ----------
// The topic's words at the student's level, fitted into a crossword by the maker in en/engine/crossword.js (shared with the
// teacher page's board game, starter and handout). The clues are the meanings; on the Chinese side the Chinese, or the
// meanings (the switch above the clues, remembered as xwmode). Each clue ends with its letter counts, "(4,2,6)" for a phrase,
// as in printed crosswords (teacher: "have them as 4,2,6 as normal crosswords do"). A word whose meaning (or Chinese) contains
// the word itself is left out, because that clue would give it away (tools/check_content.py lists those words).
// Words by level: Foundation 6, Foundation+ 7, Intermediate 8, Intermediate+ 9, Advanced 10; the grid is at most 11 × 11 at
// Foundation and Foundation+ and 13 × 13 above (phones: 10 squares across).
// Playing: click a square or a clue and type; the letters move along the word; click the square again (or Space) to go
// across or down; arrow keys move, Tab and Enter go to the next clue, Backspace takes a letter out. A word with every letter
// right is ticked in the list, its squares are kept, and the next clue comes up. Check turns the wrong letters red; Reveal a
// letter fills in the square you're on (or the first empty or wrong one in that word); Show the rest fills in everything.
// Progress: a word solved with none of its letters revealed is a right answer ('type' points, like Save the mouse); a word
// with a revealed letter, or filled in by Show the rest, is a wrong one. Best time (best:crossword / best:zhcrossword): the
// fastest puzzle finished with nothing revealed.
// Phones: a hidden text box over the square takes the typing, so the phone's keyboard comes up when a square is tapped (also
// typing through a Chinese input method: the letters are read as they are typed).
const XW_N = [0, 6, 7, 8, 9, 10];
const xwOK = w => { const t=wsPlain(w); return /^[a-z][a-z '’\-]*$/.test(t) && t.split(/[\s-]+/).filter(Boolean).length<=4 && wsLetters(w).length>=3; };
const xwSize = lv => ({w: PHONE ? 10 : lv>=3 ? 13 : 11, h: lv>=3 ? 13 : 11});
// Words that can be answers: letters only (spaces, hyphens and apostrophes between words), short enough, and a meaning (on the
// Chinese side a Chinese too) that doesn't give the word away
const xwFit = (list, zh, max) => !window.AEA_XW ? [] : (list||[]).filter(w=>xwOK(w) && wsLetters(w).length<=max && !AEA_XW.gives(w.w, w.def)
  && (!zh || (ZH[w.id] && !AEA_XW.gives(w.w, ZH[w.id]))));
function playCrossword(zh){
  const key=zh ? 'zhcrossword' : 'crossword', XW=window.AEA_XW; CUR_GAME=key;
  const lv=Math.max(1, Math.min(5, chosenBand() || 3)), n=XW_N[lv], sz=xwSize(lv), max=Math.max(sz.w, sz.h);
  const how=PHONE ? T('Tap a square or a clue and type. Tap the square again to go across or down.', '点一个方格或一条提示，然后输入。再点一次方格可以在横向和纵向之间切换。')
    : T('Click a square or a clue and type. Click the square again (or press Space) to go across or down.', '点一个方格或一条提示，然后输入。再点一次方格（或按空格键）可以在横向和纵向之间切换。');
  if(zh) zhShell(T('Crossword','填字游戏'), how); else shell(GAMES.find(g=>g.key==='crossword'), how);
  let mode=zh && store.get('xwmode', 'zh')!=='def' ? 'zh' : 'def';
  // The words: the student's words at their level (Chinese side: their own set), due words first; topped up from nearby levels.
  // Never two with the same letters, the same meaning, the same Chinese, or marked as similar in words.csv.
  const cands=()=>{
    const main=xwFit(rankForLevel(zh ? zhWords() : pick(S.words)).filter(w=>!hiddenItem(w)), zh, max);
    const more=xwFit(rankForLevel((zh ? zhBankAll().filter(w=>(bandOf(w)??9)<=zhBand()) : S.words).filter(w=>!main.includes(w) && !hiddenItem(w))), zh, max);
    const out=[];
    for(const w of [...main, ...more]){ const L=wsLetters(w);
      if(out.some(o=>o.L===L || o.w.def===w.def || (zh && ZH[o.w.id]===ZH[w.id]) || areAlike(o.w.id, w.id))) continue;
      out.push({w, L}); if(out.length>=n+12) break; }
    return out; };
  const newPuzzle=()=>{
    clearTimers(); keyHandler=null;
    const lay=XW ? XW.make(cands(), {n, maxW:sz.w, maxH:sz.h}) : null;
    if(!lay || lay.words.length<4){ showCard(`<p class="instr">${T('There aren\'t enough words for a crossword at this level yet.','这个级别的单词还不够做填字游戏。')}</p>`); return; }
    const {w:W, h:H, cells:ans, words}=lay, N=W*H, best=store.get('best:'+key, 0), t0=Date.now();
    const val=Array(N).fill(''), rev=new Set(), bad=new Set(), shown=new Set(), solved=new Set();
    const at={a:Array(N).fill(-1), d:Array(N).fill(-1)}; words.forEach((x,i)=>x.cells.forEach(k=>{ at[x.d][k]=i; }));
    const order=[...lay.across, ...lay.down].map(x=>words.indexOf(x));   // the clues in order: across, then down
    let cur={k:words[order[0]].cells[0], d:words[order[0]].d}, done=0, gaveUp=false, helped=false, comp='';
    const other=d=>d==='a' ? 'd' : 'a';
    const DIR={a:T('Across','横向'), d:T('Down','纵向')}, DIRX={a:TX('Across','横向'), d:TX('Down','纵向')};
    const enumOf=x=>XW.enumeration(x.w.w), clueOf=x=>mode==='zh' ? ZH[x.w.id] : x.w.def;
    const card=showCard(`<div class="xw"><div class="xw-left">
        <p class="xw-bar"></p>
        <div class="xw-board" style="--w:${W};--h:${H}"><div class="xw-grid">${ans.map((ch,k)=>ch ? `<div class="xw-c" data-k="${k}">${lay.nums[k]?`<span class="xw-n">${lay.nums[k]}</span>`:''}<span class="xw-l"></span></div>` : '<div class="xw-x"></div>').join('')}</div>
          <input class="xw-in" type="text" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" enterkeyhint="next" lang="en"></div>
        <div class="xw-acts"><button type="button" class="btn alt small xw-check">${T('Check','检查')}</button><button type="button" class="btn alt small xw-rev">${T('Reveal a letter','显示一个字母')}</button><button type="button" class="btn alt small xw-give">${T('Show the rest','显示剩下的')}</button><button type="button" class="btn alt small xw-new">${T('New puzzle','换一个')}</button></div>
        <p class="xw-msg" aria-live="polite"></p><div class="xw-end" aria-live="polite"></div></div>
        <div class="xw-side">${zh ? `<div class="ws-mode xw-mode" role="group" aria-label="${esc(TX('The clues are','提示是'))}"><button type="button" data-m="zh">${T('Chinese','中文')}</button><button type="button" data-m="def">${T('Meanings','英文释义')}</button></div>` : ''}
          ${['a','d'].map(d=>`<h3 class="xw-h">${DIR[d]}</h3><ol class="xw-list" data-d="${d}">${(d==='a' ? lay.across : lay.down).map(x=>`<li data-i="${words.indexOf(x)}"></li>`).join('')}</ol>`).join('')}</div></div>`);
    card.classList.add('xw-card');
    const grid=card.querySelector('.xw-grid'), inp=card.querySelector('.xw-in'), bar=card.querySelector('.xw-bar'), msg=card.querySelector('.xw-msg');
    const els=Array(N).fill(null); grid.querySelectorAll('.xw-c').forEach(el=>{ els[+el.dataset.k]=el; });
    const items=[...card.querySelectorAll('.xw-list li')];
    const wordOn=()=>{ const i=at[cur.d][cur.k]; return i>=0 ? i : at[other(cur.d)][cur.k]; };
    const locked=k=>rev.has(k) || (at.a[k]>=0 && solved.has(at.a[k])) || (at.d[k]>=0 && solved.has(at.d[k]));
    const stats=()=>{ const el=document.getElementById('stats'); if(!el) return; const s=Math.floor(((done||Date.now())-t0)/1000), bt=store.get('best:'+key, 0);
      el.innerHTML=NEW_UI ? gStats([[T('Solved','完成'), solved.size, '/'+words.length], [T('Time','时间'), mmss(s)], [T('Best','最佳'), bt ? mmss(bt) : '–']])
        : `<span>${T('Solved','完成')} <b>${solved.size}</b>/${words.length}</span><span>${T('Time','用时')} <b>${mmss(s)}</b></span>${bt?`<span>${T('Best','最快')} <b>${mmss(bt)}</b></span>`:''}`; };
    const tick=()=>{ if(done) return; stats(); later(tick, 1000); };
    const clueHtml=x=>`<span class="xw-clue${mode==='zh'?' xw-zh':''}"${mode==='zh'?' lang="zh-CN"':''}>${esc(clueOf(x))}</span> <span class="xw-enum">${enumOf(x)}</span>`;
    const drawList=()=>{
      card.querySelectorAll('.xw-mode button').forEach(b=>b.setAttribute('aria-pressed', b.dataset.m===mode));
      items.forEach(li=>{ const i=+li.dataset.i, x=words[i], ok=solved.has(i), miss=gaveUp && !ok;
        li.className=(ok?'ok':'')+(miss?' miss':'');
        li.innerHTML=`<span class="xw-num">${x.num}</span><span class="xw-txt">${clueHtml(x)}${ok||miss?` <b class="xw-ans">${esc(wsShow(x.w))}</b>`:''}</span>`; }); };
    const draw=()=>{
      const wi=done ? -1 : wordOn(), on=new Set(wi>=0 ? words[wi].cells : []);
      els.forEach((el,k)=>{ if(!el) return; el.lastChild.textContent=val[k];
        const ok=(at.a[k]>=0 && solved.has(at.a[k])) || (at.d[k]>=0 && solved.has(at.d[k]));
        el.className='xw-c'+(on.has(k)?' on':'')+(k===cur.k && !done?' cur':'')+(bad.has(k)?' bad':'')+(rev.has(k)?' rev':'')+(ok&&!rev.has(k)?' ok':'')+(shown.has(k)?' shown':''); });
      items.forEach(li=>li.classList.toggle('on', +li.dataset.i===wi));
      if(wi>=0){ const x=words[wi]; bar.innerHTML=`<b>${x.num} ${DIR[x.d]}</b>${clueHtml(x)}`;
        inp.setAttribute('aria-label', `${x.num} ${DIRX[x.d]}: ${clueOf(x)} ${enumOf(x)}`); }
      inp.style.left=(cur.k%W)*100/W+'%'; inp.style.top=Math.floor(cur.k/W)*100/H+'%'; };
    const say=t=>{ msg.innerHTML=t||''; };
    // Choosing: a word (its first empty square), a square (the same square again turns across into down)
    const go=i=>{ const x=words[i]; cur={d:x.d, k:x.cells.find(k=>!val[k] && !locked(k)) ?? x.cells.find(k=>!locked(k)) ?? x.cells[0]}; say(''); draw(); };
    const pickSq=k=>{ if(k===cur.k){ if(at[other(cur.d)][k]>=0) cur.d=other(cur.d); } else { cur.k=k; if(at[cur.d][k]<0) cur.d=other(cur.d); } say(''); draw(); };
    const nextClue=step=>{ const wi=wordOn(); let j=order.indexOf(wi);
      for(let t=0; t<order.length; t++){ j=(j+step+order.length)%order.length; if(!solved.has(order[j])) return go(order[j]); } };
    const flip=()=>{ if(at[other(cur.d)][cur.k]>=0){ cur.d=other(cur.d); draw(); } };
    const along=step=>{ const wi=wordOn(); if(wi<0) return false; const c=words[wi].cells; let j=c.indexOf(cur.k)+step;
      while(j>=0 && j<c.length && locked(c[j])) j+=step;
      if(j>=0 && j<c.length){ cur.k=c[j]; return true; } return false; };
    // A word with every letter right: ticked, kept, and counted (right unless one of its letters was revealed)
    const settle=()=>{ let fresh=-1;
      words.forEach((x,i)=>{ if(solved.has(i) || !x.cells.every(k=>val[k]===ans[k])) return; solved.add(i); fresh=i;
        x.cells.forEach(k=>bad.delete(k));
        P.record(key, x.w, !x.cells.some(k=>rev.has(k)));
        const li=items.find(l=>+l.dataset.i===i); if(li){ li.classList.add('pop'); } });
      drawList(); stats();
      if(solved.size===words.length) return finish();
      if(fresh>=0 && fresh===wordOn() && !along(1)) nextClue(1); else if(fresh>=0 && words[fresh].cells.every(locked) && solved.has(wordOn())) nextClue(1);
      draw(); };
    const type=ch=>{ if(done) return; const k=cur.k; if(!locked(k)){ val[k]=ch; bad.delete(k); } along(1); settle(); draw(); };
    const back=()=>{ if(done) return; const k=cur.k;
      if(val[k] && !locked(k)){ val[k]=''; bad.delete(k); }
      else if(along(-1) && !locked(cur.k)){ val[cur.k]=''; bad.delete(cur.k); }
      draw(); };
    const arrow=(dr,dc)=>{ const d=dc ? 'a' : 'd';
      if(cur.d!==d && at[d][cur.k]>=0){ cur.d=d; draw(); return; }
      let r=Math.floor(cur.k/W)+dr, c=cur.k%W+dc;
      while(r>=0 && r<H && c>=0 && c<W){ const k=r*W+c; if(ans[k]){ cur.k=k; if(at[cur.d][k]<0) cur.d=other(cur.d); break; } r+=dr; c+=dc; }
      draw(); };
    const keyed=e=>{ const k=e.key;
      if(done){ if(k==='Enter'){ e.preventDefault(); newPuzzle(); } return; }
      if(/^[a-zA-Z]$/.test(k)){ e.preventDefault(); type(k.toUpperCase()); return; }
      const mv={ArrowUp:[-1,0], ArrowDown:[1,0], ArrowLeft:[0,-1], ArrowRight:[0,1]}[k];
      if(mv){ e.preventDefault(); arrow(...mv); return; }
      if(k==='Backspace'){ e.preventDefault(); back(); return; }
      if(k==='Delete'){ e.preventDefault(); if(!locked(cur.k)){ val[cur.k]=''; bad.delete(cur.k); draw(); } return; }
      if(k==='Tab'){ e.preventDefault(); nextClue(e.shiftKey ? -1 : 1); return; }
      if(k==='Enter'){ e.preventDefault(); nextClue(1); return; }
      if(k===' '){ e.preventDefault(); flip(); } };
    // The hidden text box: keys on computers; on phones (and with an input method) the letters arrive as text instead
    const keep=()=>{ inp.value=' '; try{ inp.setSelectionRange(1, 1); }catch(x){} };
    const typeAll=s=>{ for(const ch of String(s).replace(/[^a-z]/gi, '').toUpperCase()) type(ch); };
    inp.addEventListener('keydown', e=>{ if(e.metaKey || e.ctrlKey || e.altKey || e.isComposing) return; keyed(e); });
    inp.addEventListener('beforeinput', e=>{ if(e.isComposing || /Composition/.test(e.inputType||'')) return;
      if(done){ e.preventDefault(); return; }
      if(/^insert/.test(e.inputType||'')){ e.preventDefault(); typeAll(e.data||''); keep(); }
      else if(/^delete/.test(e.inputType||'')){ e.preventDefault(); back(); keep(); } });
    inp.addEventListener('input', e=>{
      if(e.inputType==='deleteCompositionText') return;   // an input method putting in what was chosen: its letters are in already
      if(e.inputType==='insertFromComposition'){ keep(); return; }
      if(e.isComposing || e.inputType==='insertCompositionText'){ if(/[^\x00-\x7f]/.test(inp.value)) return;   // a Chinese word chosen: the letters stay
        const s=inp.value.replace(/[^a-z]/gi, '').toUpperCase();   // an input method: the letters so far
        if(s.length>comp.length && s.startsWith(comp)) typeAll(s.slice(comp.length));
        else if(s.length<comp.length && comp.startsWith(s)) for(let i=s.length; i<comp.length; i++) back();
        comp=s; return; }
      const v=inp.value; if(v===' ') return;   // a browser whose beforeinput can't be stopped
      if(!v) back(); else typeAll(v); keep(); });
    inp.addEventListener('compositionstart', ()=>{ comp=''; });
    inp.addEventListener('compositionend', ()=>{ comp=''; setTimeout(keep, 0); });
    keep();
    const focus=()=>{ if(!done) inp.focus(PHONE ? undefined : {preventScroll:true}); };
    keyHandler=e=>{ if(e.target && /^(BUTTON|A|SELECT|TEXTAREA)$/.test(e.target.tagName) && /^(Tab|Enter| )$/.test(e.key)) return;   // those keys keep working on buttons and links
      keyed(e); if(!done && (/^[a-z]$/i.test(e.key) || /^Arrow|^Backspace$/.test(e.key))) focus(); };
    grid.addEventListener('click', e=>{ const c=e.target.closest('.xw-c'); if(!c || done) return; pickSq(+c.dataset.k); focus(); });
    items.forEach(li=>li.addEventListener('click', ()=>{ if(done) return; go(+li.dataset.i); focus(); }));
    card.querySelectorAll('.xw-mode button').forEach(b=>b.onclick=()=>{ mode=b.dataset.m; store.set('xwmode', mode); drawList(); draw(); });
    card.querySelector('.xw-new').onclick=newPuzzle;
    card.querySelector('.xw-check').onclick=()=>{ if(done) return; let typed=0;
      val.forEach((v,k)=>{ if(!v || locked(k)) return; typed++; if(v!==ans[k]) bad.add(k); });
      const nb=[...bad].length;
      say(!typed ? T('Type some letters first.','先输入一些字母。') : nb ? T(`${nb} letter${nb===1?' is':'s are'} wrong: ${nb===1?'it\'s':'they\'re'} in red.`, `有 ${nb} 个字母错了，已标成红色。`)
        : T('Every letter so far is right.','到目前为止，所有字母都对。'));
      draw(); focus(); };
    card.querySelector('.xw-rev').onclick=()=>{ if(done) return; const wi=wordOn();
      const k=!locked(cur.k) && val[cur.k]!==ans[cur.k] ? cur.k : wi>=0 ? words[wi].cells.find(c=>!locked(c) && val[c]!==ans[c]) : undefined;
      if(k==null){ say(T('That word is already right.','这个单词已经对了。')); return; }
      val[k]=ans[k]; rev.add(k); bad.delete(k); helped=true; say(''); settle(); draw(); focus(); };
    card.querySelector('.xw-give').onclick=()=>{ if(done) return; gaveUp=true;
      words.forEach((x,i)=>{ if(!solved.has(i)) P.record(key, x.w, false); });
      val.forEach((v,k)=>{ if(ans[k] && v!==ans[k]){ val[k]=ans[k]; shown.add(k); } }); bad.clear();
      finish(); };
    const finish=()=>{
      done=Date.now(); inp.blur(); say(''); drawList(); draw(); stats(); card.classList.add('xw-over');
      const secs=Math.round((done-t0)/1000), prev=store.get('best:'+key, 0), isBest=!gaveUp && !helped && (!prev || secs<prev);
      if(isBest) store.set('best:'+key, secs);
      card.querySelectorAll('.xw-check, .xw-rev, .xw-give').forEach(b=>{ b.hidden=true; });
      const nb=card.querySelector('.xw-new'); nb.classList.remove('alt', 'small'); nb.focus({preventScroll:true});
      card.querySelector('.xw-end').innerHTML = gaveUp
        ? `<p class="xw-sum"><b>${T(`You solved ${solved.size} of ${words.length}.`, `你完成了 ${solved.size} 个，共 ${words.length} 个。`)}</b> ${T('The rest are filled in, in red.', '其余的已用红色填好。')}</p>`
        : `<p class="xw-sum"><b>${T(`All ${words.length} words in ${mmss(secs)}!`, `全部 ${words.length} 个单词，用时 ${mmss(secs)}！`)}</b> ${isBest ? T('A new best time.', '新纪录！') : helped ? T('Letters were revealed, so it doesn\'t count as a best time.', '因为显示过字母，这次不算最快纪录。') : prev ? T(`Your best time is ${mmss(prev)}.`, `你的最快纪录是 ${mmss(prev)}。`) : ''}</p>`;
      if(!gaveUp) card.querySelectorAll('.xw-c').forEach((el,i)=>{ el.style.animationDelay=(i*12)+'ms'; el.classList.add('glow'); });
      keyHandler=e=>{ if(e.key==='Enter'){ e.preventDefault(); newPuzzle(); } };
    };
    drawList(); draw(); tick(); focus();
  };
  newPuzzle();
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
  const card=showCard(`<p class="instr">${withZh ? T('Match each word to its meaning','把每个单词和它的释义配对') : mode==='def'?'Match each word to its meaning':mode==='mix'?'Match each word to its meaning or its synonyms':'Match each word to its synonym group'}</p>
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
      toast(TX('Correct: ','答对了：')+byId[id].w);
      if(qfDue()) return qfNext(()=>{}, 300);   // Daily Circuit quick-fire: three pairs, then another game
      later(()=>{ spentL.add(+left.dataset.slot); spentR.add(+right_.dataset.slot);
        if(spentL.size>=REFILL_AT) refill(); else paint(); }, 450);
    } else {
      if(!wrongOn.has(id)){ wrongOn.add(id); deck.retry(byId[id]); }
      toast(TX('Not a match. Try again.','不配对，再试一次。'), true);
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
// Both sides (31 Oct): the Chinese side shows the sentence in Chinese; the English side shows its goal (builds.csv goal column)
const BUILD_WHY = false;   // Build the sentence: show the explanation column after an answer? (off since 3 Nov 2026)
function playBuild(){
  const zh=SIDE==='zh', game=zh ? ZH_GAMES.find(g=>g.key==='zhbuild') : GAMES.find(g=>g.key==='build');
  const items=zh ? zhBuilds() : pick(S.builds), deck=Deck(items), st=Stats(zh?'zhbuild':'build');
  if(zh) zhShell(T(game.name, game.zh), T('Tap the pieces in order. Tap a placed piece to send it back.','按顺序点击词块，点击已放好的词块可以退回。'));
  else shell(game, 'Tap the pieces in order. Tap a placed piece to send it back.');
  st.draw();
  const step=()=>{
    const b=deck.next();
    const pieces=shuffle([...b.tiles.map((t,i)=>({t:t[0],r:t[1],k:'t'+i})), ...(b.decoys||[]).map((t,i)=>({t:t[0],r:t[1],k:'d'+i,decoy:true}))]);
    // The key under the pieces (Who or what, Verb, Detail, Linking word…) was taken off on 8 Nov 2026 (teacher: "just have the
    // colours with no definitions"). The pieces keep their colours (class r-topic etc.); ROLES and ROLES_ZH are kept in case it comes back.
    const card=showCard((zh ? `<p class="instr">${T('Build this sentence in English','用英文组成这个句子')}</p>
      <p class="zh-sentence" lang="zh-CN">${esc(b.zh)}</p>` : `<p class="instr">Build the sentence</p><p class="build-goal">${esc(b.goal||'Put the pieces in order.')}</p>`)+`
      <div class="answer" id="ans" aria-label="Your sentence"></div>
      <div class="pool" id="pool">${pieces.map(p=>`<button class="piece r-${p.r}" data-k="${p.k}">${esc(p.t)}</button>`).join('')}</div>
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
      // Explanations are not shown (3 Nov 2026, teacher: writing them made the sentences long-winded and content is the
      // priority; the explanation column stays in builds.csv in case they come back): set BUILD_WHY to true to show them again.
      const why=BUILD_WHY && b.why ? `<span>${rich(b.why)}</span>` : '';
      if(ok) fbOk(fb, why); else fbNo(fb,'',`<div class="model">${model}</div>${why}`);
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
  gameTools().appendChild(lab);
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
      // Nearly (8 Nov 2026, teacher: "A 'Nearly' would seem fairer"): at least as many right as wrong
      const wrongN=errIdx.length-found+falseMarks, nearly=!ok && found>0 && found>=wrongN;
      const marks=falseMarks ? ` You also marked ${falseMarks} correct word${falseMarks>1?'s':''} as wrong.` : '';
      const verdict=ok ? 'All found.' : `${nearly?'Nearly!':'Not quite.'} You found ${found} of ${errIdx.length}.${marks}`;
      card.querySelector('.fb').innerHTML=`<div class="feedback ${ok?'ok':nearly?'near':'no'}"><span class="verdict">${verdict}</span><ul class="errlist">${list}</ul></div>`;
      if(partial && !ok){ partialCredit('error', it, found, falseMarks, errIdx.length); return; }
      // Scored like Complete the text (8 Nov 2026, teacher): each error is one answer (found: right; missed: wrong), and so
      // is each correct word marked as wrong; the paragraph's points are shared between its errors
      const part=k=>({id:it.id+'#'+(k+1), level:it.level, qs:errIdx.length});
      errIdx.forEach((i,k)=>{ if(got.has(i)) st.hit(part(k)); else st.miss(part(k)); });
      for(let f=0; f<falseMarks; f++) st.miss({id:it.id, level:it.level, qs:errIdx.length});
      listenReveal(card);
      if(ok){ autoNext(card, step); return; }
      lastMiss={game:'error', item:it};   // a report is about the whole paragraph
      deck.retry(it); manualNext(card, step);
    };
    btn.onclick=()=>check(); keyHandler=e=>{ if(e.key==='Enter'){ e.preventDefault(); check(); } };
    circuitFinish=()=>check(true);
  };
  step();
}

// ---------- GRAMMAR: True or false ----------
// True or false mixes two sources (31 Oct, teacher): the written statements in tf.csv, and statements made from words.csv
// (a word with its own meaning = TRUE, or with another word's meaning = FALSE; wrong meanings chosen as in Word or meaning,
// so words marked similar never swap). Half and half when the level has both; otherwise whichever it has.
const lcFirst = x => x ? x.charAt(0).toLowerCase()+x.slice(1) : x;
function tfFromWord(w, pool){
  const truth=Math.random()<.5, other=truth ? w : (distractors(w, pool, 1)[0] || w), t=truth || other===w;
  return {w, t, s:`“${w.w}” means “${lcFirst(other.def)}”`, why: t ? `This is the meaning of “${w.w}”.` : `“${w.w}” means ${lcFirst(w.def)}`};
}
function playTF(){
  const game=GAMES.find(g=>g.key==='tf'), rows=pick(S.tf), words=pick(S.words), st=Stats('tf');
  const deck=rows.length ? Deck(rows) : null, wdeck=words.length>=4 ? Deck(words) : null, pool=words.length>=8 ? words : S.words;
  shell(game,'Press T or F on a keyboard, or tap.'); st.draw();
  const step=()=>{
    // 7 Nov 2026 (teacher: "more like 70/30, with the tf statements at 70… the definitions are a little boring"):
    // a statement from tf.csv 70% of the time, a word-and-meaning question from words.csv 30%
    const fromWords = wdeck && (!deck || Math.random()<.3);
    const t = fromWords ? tfFromWord(wdeck.next(), pool) : deck.next(), item = fromWords ? t.w : t, from = fromWords ? wdeck : deck;
    const card=showCard(`<p class="instr">True or false?</p><p class="statement">${esc(t.s)}</p>
      <div class="tf-btns"><button class="tfb yes" data-v="1">True</button><button class="tfb no" data-v="0">False</button></div><div class="fb"></div>`);
    let done=false;
    const choose=v=>{ if(done) return; done=true; const ok=(v===1)===!!t.t;
      card.querySelectorAll('.tfb').forEach(b=>{ b.disabled=true; if(+b.dataset.v===(t.t?1:0)) b.classList.add('ok'); else b.classList.add('dim'); });
      const fb=card.querySelector('.fb'); ok?fbOk(fb,`<span>${rich(t.why)}</span>`):fbNo(fb,t.t?'True':'False',`<span>${rich(t.why)}</span>`);
      settle(ok,card,st,from,item,step); };
    card.querySelectorAll('.tfb').forEach(b=>b.onclick=()=>choose(+b.dataset.v));
    keyHandler=e=>{ const k=e.key.toLowerCase(); if(k==='t'||e.key==='ArrowRight'||k==='1') choose(1); if(k==='f'||e.key==='ArrowLeft'||k==='2') choose(0); };
  };
  step();
}

// ---------- GRAMMAR: Grammar Check (right-wrong.csv; was SPAG: Right or Wrong) ----------
// 8 Nov 2026 (teacher): "It's not clear that it's a grammar question… The kids need to shift their heads from factual
// accuracy to grammatical accuracy." The card says Grammar check in a blue tag, asks "Is the grammar good or bad?" and
// tells them not to judge the facts; the buttons are Good Grammar and Bad Grammar (keys G and B, or 1 and 2).
function playRW(){
  const game=GAMES.find(g=>g.key==='rw'), items=game.items(), deck=Deck(items), st=Stats('rw');
  shell(game,'Judge the grammar, not the facts. Press G or B on a keyboard, or tap.'); st.draw();
  const step=()=>{
    const t=deck.next();
    const card=showCard(`<div class="gram-head"><span class="gram-tag">Grammar check</span><p class="gram-q">Is the grammar good or bad?</p>
      <p class="gram-note">Don't ask whether it's true. Ask whether it's written correctly.</p></div>
      <p class="statement gram-s">${esc(t.s)}</p>
      <div class="tf-btns"><button class="tfb yes" data-v="1">Good Grammar</button><button class="tfb no" data-v="0">Bad Grammar</button></div><div class="fb"></div>`);
    card.classList.add('gram');
    let done=false;
    const choose=v=>{ if(done) return; done=true; const ok=(v===1)===t.ok;
      card.querySelectorAll('.tfb').forEach(b=>{ b.disabled=true; if(+b.dataset.v===(t.ok?1:0)) b.classList.add('ok'); else b.classList.add('dim'); });
      const more=(!t.ok && t.fix ? `<span class="rw-fix">Correct: <b>${esc(t.fix)}</b></span>` : '')+(t.why?`<span>${rich(t.why)}</span>`:'');
      const fb=card.querySelector('.fb'); ok?fbOk(fb,more):fbNo(fb,'',`<span>The grammar is <b>${t.ok?'good':'bad'}</b>.</span>${more}`);
      settle(ok,card,st,deck,t,step); };
    card.querySelectorAll('.tfb').forEach(b=>b.onclick=()=>choose(+b.dataset.v));
    keyHandler=e=>{ const k=e.key.toLowerCase(); if(k==='g'||k==='1') choose(1); if(k==='b'||k==='2') choose(0); };
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
      const marks=[];   // each filled gap is one answer, recorded once the result is on screen (so the points show in it)
      gaps.forEach((g,i)=>{ const s=slots[i];
        if(filled[i]==null){ s.classList.add('no'); s.textContent=g.ans; return; }
        const right=lc(bank[filled[i]].t)===lc(g.ans), item={id:r.id+'#'+(i+1), level:r.level, wid:g.id, qs:gaps.length};
        if(right){ got++; s.classList.add('ok'); marks.push([true, item]); }
        else { s.classList.add('no'); s.innerHTML=`<s>${esc(inGap(i, bank[filled[i]].t))}</s> ${esc(g.ans)}`; marks.push([false, item]); } });
      draw(); check.parentNode.remove();
      card.querySelector('#peek').textContent='Tap a word in the text to see what it means.';
      const fb=card.querySelector('.fb'), n=gaps.length;
      const notes=gaps.filter((g,i)=>filled[i]==null || lc(bank[filled[i]].t)!==lc(g.ans)).map(g=>wordNote(byId[g.id])).join('');
      // Nearly (8 Nov 2026, teacher): at least half the gaps right
      const near=got>0 && got*2>=n;
      if(got===n) fbOk(fb, `<span>All ${n} gaps right.</span>`);
      else { fb.innerHTML=`<div class="feedback ${near?'near':'no'}"><span class="verdict">${near?'Nearly!':'Not quite.'} ${got} of ${n} right.</span><span>The right words are shown in the text.</span>${notes}</div>`; deck.retry(r); }
      marks.forEach(([ok, item])=>ok ? st.hit(item) : st.miss(item));
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

// ---------- USE OF ENGLISH: Word choice, Open cloze, Word formation (10 Nov 2026) ----------
// Teacher: games for the Cambridge C1 Advanced exam (Reading and Use of English Parts 1-3) made from a topic's own
// paragraphs, in texts about half the exam's length ("high turnover, which suits the site's mood"). Content: see clozeRow.
//   Word choice (Part 1): the selected gap's words (A–D) show under the text; choosing one fills the gap and moves to the
//     next empty one. Tap a gap (or ← →) to choose for another. Check once every gap has a word.
//   Open cloze (Part 2): type the one word that fits each gap. Word formation (Part 3): type a form of the word in capitals
//     shown at the gap. Enter goes to the next gap, and checks after the last; Check with gaps still empty asks once first.
// Typed answers are marked as in the exam: capitals don't matter, but the spelling must be right. A near miss (Total
// Recall's rule: one letter out in a word of 5+ letters, two in 9+) is still wrong, and the feedback points to the
// spelling. Each gap is one answer (the points are shared between the gaps, as in Complete the text). A text with a wrong
// gap comes back later, and Report reports the whole text (so the teacher can remove it from the game).
function playCloze(key){
  const game=GAMES.find(g=>g.key===key), typed=key!=='wchoice', st=Stats(key), deck=Deck(()=>game.items());
  shell(game, key==='wchoice' ? 'Choose the word that fits each gap. Tap a gap to change its word. Then press Check.'
    : key==='ocloze' ? 'Type one word in each gap. Then press Check.' : 'Change the word in capitals so that it fits the gap. Then press Check.');
  st.draw();
  const L='ABCD';
  const step=()=>{
    const r=deck.next(); if(!r) return;
    const n=r.gaps.length, opts=r.gaps.map(g=>typed ? null : shuffle(g.opts)), chosen=r.gaps.map(()=>null);
    let sel=0, checked=false;
    const textHtml=r.parts.map(p=>{ if(typeof p==='string') return esc(p);
      const i=p.i, g=r.gaps[i];
      if(!typed) return `<button class="gapslot cz-slot" type="button" data-i="${i}"><span class="cz-n">${i+1}</span><span class="cz-w"></span></button>`;
      return `<span class="cz-gap" data-i="${i}"><span class="cz-n">${i+1}</span>${g.stem ? `<span class="cz-stem">${esc(g.stem.toUpperCase())}</span>` : ''}<input class="cz-in" type="text" data-i="${i}"
        aria-label="Gap ${i+1}${g.stem ? ': a form of '+esc(g.stem.toUpperCase()) : ''}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="${i+1<n?'next':'done'}"></span>`; }).join('');
    const card=showCard(`<p class="instr">${esc(r.title||game.name)}</p>
      <div class="readtext ctext cz-text">${textHtml}</div>
      ${typed ? '' : '<div class="cz-pick" role="group"></div>'}
      <div class="next-row check-row"><span class="pick-n"></span><button class="btn" type="button" id="czCheck">Check</button></div><div class="fb"></div>`);
    card.classList.add('ct-card', 'cz-card', 'cz-'+key);
    const chk=card.querySelector('#czCheck'), pn=card.querySelector('.pick-n');
    const slots=[...card.querySelectorAll('.cz-slot')], ins=[...card.querySelectorAll('.cz-in')], panel=card.querySelector('.cz-pick');
    const filled=i=>typed ? !!ins[i].value.trim() : chosen[i]!=null;
    const count=()=>{ const k=r.gaps.filter((g,i)=>filled(i)).length;
      pn.textContent=`${k} of ${n} gap${n===1?'':'s'} filled`; if(!typed) chk.disabled=k<n; chk.textContent='Check'; delete chk.dataset.sure; };
    // Word choice: the gaps in the text and the selected gap's words under it
    const drawChoice=()=>{
      slots.forEach((s,i)=>{ s.querySelector('.cz-w').textContent=chosen[i]==null ? '' : opts[i][chosen[i]];
        s.classList.toggle('full', chosen[i]!=null); s.classList.toggle('sel', i===sel);
        s.setAttribute('aria-label', `Gap ${i+1}${chosen[i]==null ? ', empty' : ': '+opts[i][chosen[i]]}`); });
      panel.setAttribute('aria-label', `Words for gap ${sel+1}`);
      panel.innerHTML=`<p class="cz-pick-h">Gap ${sel+1}</p><div class="opts cz-opts">${opts[sel].map((o,k)=>`<button class="opt${chosen[sel]===k?' on':''}" type="button" data-k="${k}" aria-pressed="${chosen[sel]===k}"><kbd>${L[k]}</kbd><span>${esc(o)}</span></button>`).join('')}</div>`;
      panel.querySelectorAll('.opt').forEach(b=>b.onclick=()=>choose(+b.dataset.k));
      count(); };
    const choose=k=>{ if(checked || k>=opts[sel].length) return; chosen[sel]=k;
      const next=[...Array(n).keys()].map(d=>(sel+1+d)%n).find(i=>chosen[i]==null);
      if(next!=null) sel=next; drawChoice();
      if(next==null) chk.focus({preventScroll:true}); };
    const moveSel=d=>{ if(checked) return; sel=(sel+d+n)%n; drawChoice(); };
    if(!typed){ slots.forEach(s=>s.onclick=()=>{ if(checked) return; sel=+s.dataset.i; drawChoice(); }); drawChoice(); }
    else {
      ins.forEach((x,i)=>{ const size=()=>{ x.style.width=Math.max(7, x.value.length+2)+'ch'; };
        x.oninput=()=>{ size(); count(); };
        x.onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); e.stopPropagation(); if(i+1<n) ins[i+1].focus(); else doCheck(); } }; });
      count();
    }
    // partial: the Daily Circuit's time is up. Filled gaps are marked; empty ones just show their answer and are not counted.
    const doCheck=(partial)=>{
      if(checked) return;
      const empty=r.gaps.filter((g,i)=>!filled(i)).length;
      if(partial ? empty===n : (!typed && empty)) return;
      if(!partial && typed && empty && !chk.dataset.sure){ chk.dataset.sure='1'; chk.textContent='Check anyway';
        pn.textContent=`${empty} gap${empty===1?' is':'s are'} empty. Check anyway?`; (ins.find(x=>!x.value.trim())||ins[0]).focus(); return; }
      checked=true; card.classList.add('done'); card.querySelector('.check-row').remove(); if(panel) panel.remove();
      let got=0; const marks=[], spell=[], also=[];
      r.gaps.forEach((g,i)=>{
        const item={id:r.id+'#'+(i+1), level:r.level, qs:n}, show=esc(g.ans[0]);
        if(g.ans.length>1) also.push(`gap ${i+1}: ${g.ans.slice(1).map(esc).join(', ')}`);
        if(typed){ const x=ins[i], v=x.value.trim(), m=v ? trMatch(v, g.ans) : '', ok=m==='ok';
          const res=document.createElement('span'); res.className='cz-res '+(ok ? 'ok' : 'no');
          res.innerHTML=ok ? esc(v) : v ? `<s>${esc(v)}</s> ${show}` : show; x.replaceWith(res);
          if(!v && partial) return;   // the circuit's time ran out before this gap: not counted
          if(m==='close' && !ok) spell.push(`gap ${i+1} is spelt <b>${show}</b>`);
          if(ok) got++; marks.push([ok, item]); }
        else { const s=slots[i], c=chosen[i]; s.disabled=true; s.classList.remove('sel');
          if(c==null){ s.classList.add('no'); s.querySelector('.cz-w').textContent=g.ans[0]; return; }
          const ok=opts[i][c]===g.ans[0]; s.classList.add(ok ? 'ok' : 'no');
          if(!ok) s.querySelector('.cz-w').innerHTML=`<s>${esc(opts[i][c])}</s> ${show}`;
          if(ok) got++; marks.push([ok, item]); } });
      const fb=card.querySelector('.fb'), done=marks.length;
      const more=(spell.length ? `<span>Check the spelling: ${spell.join('; ')}.</span>` : '')
        + (also.length ? `<span>Also right: ${also.join('; ')}.</span>` : '') + (r.why ? `<span>${rich(r.why)}</span>` : '');
      if(got===done) fbOk(fb, `<span>${done===n ? `All ${n} gaps right.` : `${got} of ${n} right. The time ran out before the others.`}</span>`+more);
      else { const near=got>0 && got*2>=done;
        fb.innerHTML=`<div class="feedback ${near?'near':'no'}"><span class="verdict">${near?'Nearly!':'Not quite.'} ${got} of ${done} right.</span><span>The right ${typed?'answers are':'words are'} shown in the text.</span>${more}</div>`;
        deck.retry(r); }
      marks.forEach(([ok, item])=>ok ? st.hit(item) : st.miss(item));
      if(got<done) lastMiss={game:key, item:{id:r.id, level:r.level}};   // Report: the whole text
      manualNext(card, step, 'Next text →'); };
    chk.onclick=()=>doCheck();
    circuitFinish=()=>doCheck(true);
    // Word choice's keys: A–D (or 1–4) choose a word for the selected gap, ← → another gap, Enter checks.
    // (Typed games: Enter in a box is handled by the box; keys pressed in a box never reach keyHandler.)
    keyHandler=e=>{ if(checked) return;
      if(e.key==='Enter'){ e.preventDefault(); doCheck(); return; }
      if(typed) return;
      const k=/^[1-4]$/.test(e.key) ? +e.key-1 : L.toLowerCase().indexOf(String(e.key).toLowerCase());
      if(e.key.length===1 && k>=0){ e.preventDefault(); choose(k); }
      else if(e.key==='ArrowRight'){ e.preventDefault(); moveSel(1); } else if(e.key==='ArrowLeft'){ e.preventDefault(); moveSel(-1); } };
    if(typed && !PHONE) ins[0].focus({preventScroll:true});   // (on a phone the keyboard would cover the text straight away)
  };
  step();
}

// ---------- READING: Answer the question ----------
function playQuestion(){
  const game=GAMES.find(g=>g.key==='question'), items=game.items(), deck=Deck(items), st=Stats('question');
  shell(game,'Choose the answer that does what the question asks.'); st.draw();
  const step=()=>{
    const q=deck.next();
    // The command word is marked where it starts the question, or a sentence in it (7 Nov 2026: many questions start with a
    // short situation, e.g. "Club attendance fell after… Suggest one possible reason.")
    const qHtml=q.cmd ? esc(q.q).replace(new RegExp('(^|[.?!:;”’"]\\s+)('+esc(q.cmd).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')(?![a-z])','i'),'$1<mark>$2</mark>') : esc(q.q);
    mcCard({instr:'Exam question', promptHtml:`<div class="exam-q">${qHtml}</div>`, options:q.opts, answer:q.opts[q.a], optClass:'long',
      onResult:(ok,card,fb)=>{ ok?fbOk(fb,`<span>${rich(q.why)}</span>`):fbNo(fb,'',`<span>${rich(q.why)}</span>`); settle(ok,card,st,deck,q,step); }});
  };
  step();
}

// ---------- GAMES: General knowledge (knowledge.csv) ----------
// Must-know (1 Nov 2026, teacher: "general knowledge questions that are considered must know that will appear in all the
// Daily Circuits"): content/general/knowledge.csv, played as General knowledge. Not on the menus: the Daily Circuit plays
// one round of it (three questions) in every quick-fire station, on both sides (qfSwitch).
// 8 Nov 2026 (teacher: "I'd like the general knowledge questions applied to this system as they're tiered now"): Must-know
// has a level of its own on each side, not a topic's (aea:must:v1 = {en:{r, n, h}, zh:{…}}, saved to the account like
// every aea: key). It starts from the student's overall level (P.overall: their topic levels averaged), or Intermediate
// (Foundation+ on the Chinese side) for a new student, counted as 3 answers when it comes from their topics. Every Must-know
// answer moves it by the same rule as a topic level (P.record), with a 1 in 4 chance of a lucky guess. It chooses the questions:
// those at that level, or the nearest level with MIN_LEVEL (6) or more questions; a level with fewer is played with the
// nearest one. Rows with no level play at every level. Must-know answers earn points by the question's level and don't move
// any topic's level. Nothing on screen shows this level.
const MUST_LEVEL = (function(){
  const STORE='aea:must:v1', side=SIDE==='zh' ? 'zh' : 'en', GUESS_MUST=.25;
  const load=()=>{ try{ return JSON.parse(localStorage.getItem(STORE))||{}; }catch(e){ return {}; } };
  const get=()=>{ const m=load()[side]; if(m && typeof m.r==='number') return m;
    const o=P.overall(); return {r:o ?? (side==='zh'?2:3), n:0, h:o==null?0:3}; };
  const levels=()=>{ const N={}; S.must.forEach(x=>{ const b=bandOf(x); if(b!=null) N[b]=(N[b]||0)+1; });
    const L=Object.keys(N).map(Number).filter(b=>N[b]>=MIN_LEVEL).sort((a,b)=>a-b);
    return L.length || !Object.keys(N).length ? L : [+Object.keys(N).sort((a,b)=>N[b]-N[a])[0]]; };
  const near=(L,b)=>L.reduce((best,x)=>Math.abs(x-b)<Math.abs(best-b)?x:best);   // a tie goes to the lower level
  const band=()=>{ const L=levels(); return L.length ? near(L, Math.max(1, Math.min(5, Math.floor(get().r)))) : null; };
  // The questions for the student's Must-know level (all of them when no question has a level)
  const items=()=>{ const L=levels(), b=band(); if(b==null) return S.must;
    const out=S.must.filter(x=>{ const xb=bandOf(x); return xb==null || near(L, xb)===b; }); return out.length ? out : S.must; };
  const update=(item, ok)=>{ const d=itemLevel(item); if(d==null) return;
    const all=load(), m=get(), p=GUESS_MUST+(1-GUESS_MUST)/(1+Math.exp(-2.5*(m.r-d))), k=Math.max(.12, .8/Math.sqrt(m.n+(m.h||0)+1));
    m.r=Math.max(1, Math.min(5.99, m.r + k*((ok?1:0)-p))); m.n=(m.n||0)+1; all[side]=m;
    try{ localStorage.setItem(STORE, JSON.stringify(all)); }catch(e){} };
  return {get, band, items, update};
})();
const MUST_GAME = {key:'must', cat:'games', name:'Must-know', zh:'必知常识', items:()=>MUST_LEVEL.items(), min:1, run:()=>playGK(true)};
function playGK(must){
  const game=must ? MUST_GAME : GAMES.find(g=>g.key==='gk'), items=game.items(), deck=Deck(items), st=Stats(game.key);
  shell(game, T('Choose the right answer. Correct answers move on by themselves.','选出正确答案。答对后会自动进入下一题。')); st.draw();
  const step=()=>{
    const q=deck.next(), long=q.opts.some(o=>String(o).length>32);
    mcCard({instr:must ? T('Must-know','必知常识') : 'General knowledge', promptHtml:`<p class="gk-q">${esc(q.q)}</p>`, options:q.opts, answer:q.opts[0], optClass:long?'long':'',
      onResult:(ok,card,fb)=>{ const why=q.why?`<span>${rich(q.why)}</span>`:'';
        ok?fbOk(fb,why):fbNo(fb,q.opts[0],why); settle(ok,card,st,deck,q,step,AUTO_MS*2); }});   // time to read the fact
  };
  step();
}

// ---------- READING: a passage and its questions (the Reading Comprehension pages: Close reading, Big idea; passages from the file in data-reading) ----------
// Columns: id, level, title, passage, question, correct, wrong1, wrong2, wrong3, explanation, source
// More questions on the same passage (optional): question2, correct2, wrong1_2, wrong2_2, wrong3_2, explanation2, and so on.
function playPassage(){
  const game=GAMES.find(g=>g.key==='passage'), st=Stats('passage');
  shell(game, NEW_UI ? (CFG.only==='passage' && CFG.blurb ? esc(CFG.blurb) : 'Read the passage, then choose the best answers.') : ''); const items=readingTop(); if(!items) return; const deck=Deck(items), nq=items.reduce((n,r)=>n+r.qs.length,0);
  if(NEW_UI){ st.draw(); return passageBoth(st, deck); }
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

// Close reading and Big idea in the new look (8 Nov 2026, teacher: "both the questions appear one above the other";
// "Let's go with choose and then check"; the button says "Confirm" and floats, with no box round it). The passage is on
// the left and every question on the right. The student chooses an answer to each (and can change it); Confirm marks
// them all (each question is one answer, as before: points shared between them), shows why, and says how it went; then
// Next passage →. A passage with a question wrong comes back later (once). Keys: 1–4 for the first question, 5–8 for
// the second, and so on (up to 9); Enter confirms, then goes on.
function passageBoth(st, deck){
  const step=()=>{
    const r=deck.next(), qs=r.qs, picks=qs.map(()=>null); let checked=false;
    const paras=r.text.split(/\n\s*\n|\s*\|\|\s*/).map(p=>`<p>${esc(p.trim()).replace(/\n/g,'<br>')}</p>`).join('');
    const orders=qs.map(q=>shuffle(q.opts.map((o,i)=>i)));   // option 0 is the right one (the file's "correct" column)
    let k=0; const keyOf=qs.map(q=>q.opts.map(()=>++k));
    const card=showCard(`<div class="cr">
      <article class="cr-pass" aria-labelledby="crTitle"><p class="cr-k">Passage${r.level?` · ${esc(levelName(r.level))}`:''}</p><h2 id="crTitle">${esc(r.title||'')}</h2><div class="cr-text">${paras}</div></article>
      <div class="cr-qs">${qs.map((q,qi)=>`<section class="cr-q" aria-labelledby="crQ${qi}"><div class="cr-qtop"><p class="cr-k">${qs.length>1?`Question ${qi+1} of ${qs.length}`:'Question'}</p><span class="cr-tag" hidden></span></div>
        <h3 id="crQ${qi}">${esc(q.q)}</h3>
        <div class="opts long" role="group" aria-labelledby="crQ${qi}">${orders[qi].map((oi,j)=>`<button class="opt" type="button" data-q="${qi}" data-o="${oi}" aria-pressed="false">${keyOf[qi][j]<=9?`<kbd>${keyOf[qi][j]}</kbd>`:''}<span>${esc(q.opts[oi])}</span></button>`).join('')}</div>
        <div class="cr-why" hidden></div></section>`).join('')}
        <div class="cr-actions"><p class="cr-end" aria-live="polite"></p><button class="btn cr-go" type="button" disabled>Confirm</button></div></div></div>`);
    card.classList.add('cr-card');
    const go=card.querySelector('.cr-go'), btns=[...card.querySelectorAll('.cr-q .opt')], secs=[...card.querySelectorAll('.cr-q')];
    const choose=b=>{ if(checked) return; const qi=+b.dataset.q; picks[qi]=+b.dataset.o;
      btns.filter(x=>+x.dataset.q===qi).forEach(x=>x.setAttribute('aria-pressed', x===b ? 'true' : 'false'));
      go.disabled=picks.some(p=>p==null); };
    const next=()=>step();
    const confirm=()=>{
      if(checked || picks.some(p=>p==null)) return; checked=true;
      const oks=qs.map((q,qi)=>picks[qi]===0), got=oks.filter(Boolean).length, all=got===qs.length;
      qs.forEach((q,qi)=>{ const ok=oks[qi], sec=secs[qi];
        sec.classList.add(ok ? 'ok' : 'no');
        btns.filter(x=>+x.dataset.q===qi).forEach(x=>{ const o=+x.dataset.o; x.disabled=true; x.removeAttribute('aria-pressed'); x.classList.add(o===0 ? 'ok' : o===picks[qi] ? 'no' : 'dim'); });
        const tag=sec.querySelector('.cr-tag'); tag.textContent=ok ? '✓ Right' : '✗ Not quite'; tag.hidden=false;
        const why=sec.querySelector('.cr-why'); why.innerHTML=(ok ? '' : `<span class="cr-ans">The answer is: <b>${esc(q.opts[0])}</b></span>`)+(q.why ? `<span>${rich(q.why)}</span>` : ''); why.hidden=!why.innerHTML; });
      const end=card.querySelector('.cr-end');
      end.className='cr-end '+(all ? 'ok' : 'no');
      end.innerHTML=all ? `<b>Well done!</b> ${qs.length===2 ? 'You got both questions right.' : qs.length>2 ? `You got all ${qs.length} questions right.` : 'You got it right.'}`
        : qs.length>1 ? `You got ${got} of ${qs.length} right. This passage will come back later.` : 'Not quite. This passage will come back later.';
      // Each question is one answer (the points shown in the line above, by earned())
      let miss=null;
      qs.forEach((q,qi)=>{ const item={id:r.id+(qi?'#'+(qi+1):''), level:r.level, qs:qs.length};
        if(oks[qi]) st.hit(item); else { st.miss(item); if(!miss) miss={game:'passage', item}; } });
      lastMiss=null; if(!all) deck.retry(r);
      go.textContent='Next passage →'; go.disabled=false; go.onclick=next; go.focus({preventScroll:true});
      if(miss) reportButton(card, card.querySelector('.cr-actions'), miss);
      keyHandler=e=>{ if(e.key==='Enter'){ e.preventDefault(); next(); } };
    };
    btns.forEach(b=>b.onclick=()=>choose(b)); go.onclick=confirm;
    keyHandler=e=>{ if(checked) return; const n=parseInt(e.key,10);
      if(n>=1 && n<=9 && btns[n-1]) choose(btns[n-1]);
      else if(e.key==='Enter'){ e.preventDefault(); confirm(); } };
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
  const lv=NEW_UI && document.getElementById('gLevel');
  if(lv){ lv.innerHTML=`<div><dt>Level</dt><dd><b>${choice===ALL_LEVELS ? 'All levels' : nameHtml(choice)}</b><a href="${esc(CFG.back||'../index.html')}">Change</a></dd></div>`; lv.hidden=false; }
  else document.getElementById('feed').insertAdjacentHTML('beforebegin', `<p class="hint read-lv">${choice===ALL_LEVELS?'All levels':`Level: ${esc(choice)}`}. ${change}</p>`);
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
  shell(game, NEW_UI ? esc(CFG.blurb||'Read the passage, then choose the notes that belong under the heading.') : ''); const items=readingTop(); if(!items) return; const deck=Deck(items);
  if(!NEW_UI) document.querySelector('.feed').insertAdjacentHTML('beforebegin', `<p class="hint">${items.length} passage${items.length===1?'':'s'}. Read carefully, then choose the notes that belong under the heading.</p>`); st.draw();
  const step=()=>{
    const r=deck.next(), order=shuffle(r.opts.map((o,i)=>i)), picked=new Set();
    const paras=r.text.split(/\n\s*\n|\s*\|\|\s*/).map(p=>`<p>${esc(p.trim()).replace(/\n/g,'<br>')}</p>`).join('');
    const task=`<div class="note-task"><span class="note-k">Notes on</span><b>${esc(r.topic)}</b></div>
      <p class="question">Choose the ${r.count} notes that belong under this heading.</p>
      <div class="opts long notes">${order.map((i,k)=>`<button class="opt" data-i="${i}" aria-pressed="false"><kbd>${k+1}</kbd><span>${esc(r.opts[i])}</span></button>`).join('')}</div>
      <div class="next-row check-row"><span class="pick-n" id="pickN">0 of ${r.count} chosen</span><button class="btn" id="check" disabled>Check</button></div><div class="fb"></div>`;
    // New look: the passage on the left, the heading and the notes on the right (as Close reading)
    const card=showCard(NEW_UI ? `<div class="cr"><article class="cr-pass" aria-labelledby="crTitle"><p class="cr-k">Passage${r.level?` · ${esc(levelName(r.level))}`:''}</p><h2 id="crTitle">${esc(r.title||'')}</h2><div class="cr-text">${paras}</div></article>
      <div class="cr-qs"><section class="cr-q cr-notes">${task}</section></div></div>`
      : `<p class="instr">${esc(r.title)}${r.level?` · ${esc(levelName(r.level))}`:''}</p><div class="passage">${paras}</div>${task}`);
    card.classList.add(NEW_UI ? 'cr-card' : 'reading');
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
      passageDone(fb, ok?1:0, 1, ok?'You found all three notes.':''); manualNext(card,step,'Next passage →');
      const row=NEW_UI && card.querySelector(':scope > .next-row'); if(row) card.querySelector('.cr-q').appendChild(row); };
    btns.forEach(b=>b.onclick=()=>toggle(b)); chk.onclick=check;
    keyHandler=e=>{ const n=parseInt(e.key,10); if(n>=1&&n<=btns.length) toggle(btns[n-1]); else if(e.key==='Enter'){ e.preventDefault(); check(); } };
  };
  step();
}

// ---------- RECALL and TOTAL RECALL (10 Nov 2026, teacher) ----------
// "Students read a passage and have to remember stuff, then they click on something to see the questions and the passage
// is covered up." Read for as long as you like; I'm ready covers the passage and the questions appear; after Check the
// passage comes back so the student can see what they missed.
// Speed bonus (teacher: "they have a timer bonus and as the timer goes down so do their bonus points"): it starts at the
// passage's own points for its level and runs down to nothing over MEM_PAR seconds (more for a longer passage). What is
// left at I'm ready is added to the points if the answers are right: Recall all or nothing (as Note taking); Total Recall
// shared between its questions, so each right answer earns its share.
// Recall: choose the statements that are true of the passage (some are not). Total Recall: type the answers to a list of
// questions about a list ("nightmare lists"). Typed answers: capitals, punctuation, a/an/the and numbers as words or
// digits don't matter, and a small slip in a longer word is accepted (a number has to be exact).
const memWords = t => (String(t||'').match(/[A-Za-z0-9'’£$%.:-]+/g)||[]).length;
const MEM_PAR = r => Math.max(30, Math.min(150, Math.round(memWords(r.text)*0.6)));   // seconds until the bonus is gone
const memMax = r => { const n=levelNum(r.level); return POINTS.passage[n==null ? 2 : Math.max(0, Math.min(4, Math.floor(n)-1))]; };
// The passage on the left (on a phone: on top), and on the right the speed bonus and I'm ready. ready(card, bonus) is
// called when the student is ready: it fills the right-hand side with the questions.
function memCard(r, intro, ready){
  const paras=r.text.split(/\n\s*\n|\s*\|\|\s*/).map(p=>`<p>${esc(p.trim()).replace(/\n/g,'<br>')}</p>`).join('');
  const max=memMax(r), par=MEM_PAR(r), t0=Date.now();
  const card=showCard(`<div class="cr mem"><article class="cr-pass mem-pass" aria-labelledby="crTitle"><p class="cr-k">Passage${r.level?` · ${esc(levelName(r.level))}`:''}</p>
      <h2 id="crTitle">${esc(r.title||'')}</h2><div class="cr-text">${paras}</div>
      <div class="mem-cover"><b>The passage is hidden.</b><span>Answer from memory.</span></div></article>
    <div class="cr-qs"><section class="cr-q mem-ready"><p class="cr-k">Read it, then remember it</p><h3>${intro}</h3>
      <div class="mem-bonus" aria-live="off"><span class="mem-bonus-k">Speed bonus</span><b class="mem-bonus-n">+${max}</b><span class="mem-bar" aria-hidden="true"><i></i></span></div>
      <p class="mem-note">The bonus goes down while the passage is open. Take as long as you need: there is no time limit.</p>
      <div class="cr-actions"><button class="btn cr-go mem-go" type="button">I’m ready: hide the passage</button></div></section></div></div>`);
  card.classList.add('cr-card');
  const n=card.querySelector('.mem-bonus-n'), bar=card.querySelector('.mem-bar i'), box=card.querySelector('.mem-bonus');
  const left=()=>Math.max(0, Math.round(max*(1-(Date.now()-t0)/1000/par)));
  let on=true;
  const tick=()=>{ if(!on || !card.isConnected) return; const b=left(), f=Math.max(0, 1-(Date.now()-t0)/1000/par);
    n.textContent=b ? `+${b}` : 'Gone'; bar.style.width=(f*100).toFixed(1)+'%'; box.classList.toggle('low', f<.3); box.classList.toggle('gone', !b);
    if(f>0) later(tick, 250); };
  tick();
  const go=()=>{ if(!on) return; on=false; const bonus=left(), secs=Math.round((Date.now()-t0)/1000);
    card.querySelector('.mem-pass').classList.add('covered'); keyHandler=null;
    ready(card, bonus, secs); };
  card.querySelector('.mem-go').onclick=go; card.querySelector('.mem-go').focus({preventScroll:true});
  keyHandler=e=>{ if(e.key==='Enter'){ e.preventDefault(); go(); } };
  return card;
}
const memTime = s => s<60 ? `${s} second${s===1?'':'s'}` : `${Math.floor(s/60)} min ${String(s%60).padStart(2,'0')} s`;
// The line under the result: how long they read for, and the bonus (got: the bonus points earned; none: what to say if none)
const memBonusLine = (bonus, secs, got, none) => `<span class="mem-sum">You read it in ${memTime(secs)}. ${!bonus ? 'No speed bonus this time.' : got ? `Speed bonus: <b>+${got}</b>.` : none}</span>`;
function memReveal(card){ const p=card.querySelector('.mem-pass'); if(p){ p.classList.remove('covered'); p.classList.add('shown'); } }

function playRecall(){
  const st=Stats('recall'), game={key:'recall', name:CFG.name||'Recall', cat:'reading'};
  shell(game, esc(CFG.blurb||'Read the passage, then choose what it said from memory.')); const items=readingTop(); if(!items) return; const deck=Deck(items);
  st.draw();
  const step=()=>{
    const r=deck.next();
    memCard(r, 'Read the passage carefully. When you’re ready, it is hidden and you choose the statements that are true of it.', (card, bonus, secs)=>{
      const order=shuffle(r.opts.map((o,i)=>i)), picked=new Set();
      const side=card.querySelector('.cr-qs');
      side.innerHTML=`<section class="cr-q cr-notes mem-q"><p class="cr-k">From memory</p>
        <p class="question">${esc(r.q || `Which ${r.count===1?'statement is':`${r.count} statements are`} true of the passage?`)}</p>
        <div class="opts long notes">${order.map((i,k)=>`<button class="opt" type="button" data-i="${i}" aria-pressed="false"><kbd>${k+1}</kbd><span>${esc(r.opts[i])}</span></button>`).join('')}</div>
        <div class="next-row check-row"><span class="pick-n">0 of ${r.count} chosen</span><button class="btn" type="button" id="check" disabled>Check</button></div><div class="fb"></div></section>`;
      const sec=side.querySelector('.cr-q'), btns=[...sec.querySelectorAll('.opt')], chk=sec.querySelector('#check'), pn=sec.querySelector('.pick-n'); let done=false;
      const toggle=b=>{ if(done) return; const i=+b.dataset.i;
        if(picked.has(i)) picked.delete(i); else { if(picked.size>=r.count) return; picked.add(i); }
        b.setAttribute('aria-pressed', picked.has(i)); pn.textContent=`${picked.size} of ${r.count} chosen`; chk.disabled=picked.size!==r.count; };
      const check=()=>{ if(done || picked.size!==r.count) return; done=true; sec.querySelector('.check-row').remove();
        const got=[...picked].filter(i=>r.right.includes(i)).length, ok=got===r.count;
        btns.forEach(b=>{ const i=+b.dataset.i, good=r.right.includes(i); b.disabled=true; b.classList.add(picked.has(i) ? (good?'ok':'no') : (good?'missed':'dim')); });
        memReveal(card);
        const why=r.why ? `<div class="why">${r.why.split(/\n\s*\n/).map(p=>`<p>${rich(p.trim()).replace(/\n/g,'<br>')}</p>`).join('')}</div>` : '';
        const fb=sec.querySelector('.fb'), line=memBonusLine(bonus, secs, ok ? bonus : 0, `The speed bonus (+${bonus}) needs every statement right.`);
        ok ? fbOk(fb, line+why) : fbNo(fb, '', `<span>You found ${got} of ${r.count}. The ones with a dashed green border were missed. The passage is shown again.</span>${line}${why}`);
        const item={id:r.id, level:r.level, bonus: ok ? bonus : 0};
        if(ok) st.hit(item); else { st.miss(item); deck.retry(r); }
        passageDone(fb, ok?1:0, 1, ok ? (r.count===1 ? 'You remembered it.' : `You remembered all ${r.count}.`) : '');
        manualNext(card, step, 'Next passage →'); const row=card.querySelector(':scope > .next-row'); if(row) sec.appendChild(row); };
      btns.forEach(b=>b.onclick=()=>toggle(b)); chk.onclick=check;
      keyHandler=e=>{ const k=parseInt(e.key,10); if(k>=1 && k<=btns.length) toggle(btns[k-1]); else if(e.key==='Enter'){ e.preventDefault(); check(); } };
      sec.scrollIntoView({block:'nearest', behavior:'smooth'});
    });
  };
  step();
}

// Total Recall: typed answers. Each is compared with every answer the file accepts (answer column, separated by ;)
const NUM_W={zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,
  sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90};
function trNorm(v){
  let s=String(v||'').toLowerCase().replace(/[‘’`]/g,"'").replace(/&/g,' and ').replace(/(\d),(\d{3})\b/g,'$1$2')
    .replace(/(\d)[:.](\d)/g,'$1.$2').replace(/(\d+\.\d*?)0+\b/g,'$1').replace(/(\d)\.(?!\d)/g,'$1')   // 7:45 = 7.45; 4.50 = 4.5; 7.00 = 7
    .replace(/(\d)(st|nd|rd|th)\b/g,'$1')                                                                   // 8th = 8
    .replace(/(\d)([a-z])/g,'$1 $2').replace(/([a-z])(\d)/g,'$1 $2')                                         // 750ml = 750 ml; HF2291 = hf 2291
    .replace(/[^a-z0-9.' -]+/g,' ').replace(/(^|\s)'|'(\s|$)/g,' ').replace(/-/g,' ').replace(/\.(?!\d)/g,' ').replace(/\s+/g,' ').trim()
    .replace(/\b0+(\d)/g,'$1');                                                                              // 08.51 = 8.51
  const out=[]; s.split(' ').forEach(w=>{ if(w in NUM_W){ const n=NUM_W[w], prev=out.length ? out[out.length-1] : null;
      if(typeof prev==='number' && prev>=20 && prev%10===0 && n<10) out[out.length-1]=prev+n; else out.push(n); } else out.push(w); });
  return out.join(' ').replace(/^(the|a|an) /,'');
}
function trLev(a,b){ if(Math.abs(a.length-b.length)>2) return 9; let prev=[...Array(b.length+1).keys()];
  for(let i=1;i<=a.length;i++){ const cur=[i]; for(let j=1;j<=b.length;j++) cur[j]=Math.min(prev[j]+1, cur[j-1]+1, prev[j-1]+(a[i-1]===b[j-1]?0:1)); prev=cur; }
  return prev[b.length]; }
// 'ok' (right), 'close' (right, with a small slip: shown with the spelling), or '' (wrong)
function trMatch(typed, answers){
  const t=trNorm(typed); if(!t) return '';
  let best='';
  answers.forEach(a=>{ const n=trNorm(a); if(!n || best==='ok') return;
    if(t===n){ best='ok'; return; }
    if(/\d/.test(t) || /\d/.test(n)) return;   // a number has to be exact
    const allow=n.length>=9 ? 2 : n.length>=5 ? 1 : 0;
    if(allow && trLev(t, n)<=allow) best='close'; });
  return best;
}
function playTotalRecall(){
  const st=Stats('totalrecall'), game={key:'totalrecall', name:CFG.name||'Total Recall', cat:'reading'};
  shell(game, esc(CFG.blurb||'Read the list, then type what you remember.')); const items=readingTop(); if(!items) return; const deck=Deck(items);
  st.draw();
  const step=()=>{
    const r=deck.next(), n=r.qs.length;
    memCard(r, `Read it carefully. When you’re ready, it is hidden and you type the answers to ${n} question${n===1?'':'s'} about it.`, (card, bonus, secs)=>{
      const side=card.querySelector('.cr-qs');
      side.innerHTML=`<section class="cr-q tr mem-q"><p class="cr-k">From memory</p>
        <p class="question">Type each answer. Numbers can be words or digits, and a small spelling slip is fine.</p>
        <ol class="tr-list">${r.qs.map((q,i)=>`<li><label for="tr${i}"><span class="tr-n">${i+1}</span><span>${esc(q.q)}</span></label>
          <input id="tr${i}" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="${i+1<n?'next':'done'}"><span class="tr-mark" hidden></span></li>`).join('')}</ol>
        <div class="next-row check-row"><span class="pick-n">0 of ${n} answered</span><button class="btn" type="button" id="check">Check</button></div><div class="fb"></div></section>`;
      const sec=side.querySelector('.cr-q'), ins=[...sec.querySelectorAll('input')], chk=sec.querySelector('#check'), pn=sec.querySelector('.pick-n'); let done=false;
      const count=()=>{ const k=ins.filter(x=>x.value.trim()).length; pn.textContent=`${k} of ${n} answered`; };
      ins.forEach((x,i)=>{ x.oninput=count; x.onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); e.stopPropagation(); if(i+1<n) ins[i+1].focus(); else check(); } }; });
      const check=()=>{ if(done) return;
        const blank=ins.filter(x=>!x.value.trim()).length;
        if(blank && !chk.dataset.sure){ chk.dataset.sure='1'; pn.textContent=`${blank} left blank. Check anyway?`; chk.textContent='Check anyway'; (ins.find(x=>!x.value.trim())||ins[0]).focus(); return; }
        done=true; sec.querySelector('.check-row').remove();
        const res=r.qs.map((q,i)=>trMatch(ins[i].value, q.ans)), got=res.filter(Boolean).length, all=got===n, share=Math.ceil(bonus/n);
        sec.querySelectorAll('.tr-list li').forEach((li,i)=>{ const m=li.querySelector('.tr-mark'), q=r.qs[i]; ins[i].readOnly=true;
          li.classList.add(res[i] ? 'ok' : 'no');
          m.innerHTML=res[i]==='ok' ? '✓' : res[i]==='close' ? `✓ <span>Spelt: <b>${esc(q.ans[0])}</b></span>` : `✗ <span>${ins[i].value.trim() ? 'The answer' : 'Left blank. The answer'}: <b>${esc(q.ans[0])}</b></span>`;
          m.hidden=false; });
        memReveal(card);
        const why=r.why ? `<div class="why">${r.why.split(/\n\s*\n/).map(p=>`<p>${rich(p.trim()).replace(/\n/g,'<br>')}</p>`).join('')}</div>` : '';
        const fb=sec.querySelector('.fb'), line=memBonusLine(bonus, secs, share*got, `The speed bonus (+${bonus}) is shared between the answers you get right.`);
        all ? fbOk(fb, line+why) : fbNo(fb, '', `<span>You remembered ${got} of ${n}. The list is shown again.</span>${line}${why}`);
        r.qs.forEach((q,i)=>{ const item={id:r.id+(i?'#'+(i+1):''), level:r.level, qs:n, bonus: res[i] ? share : 0}; if(res[i]) st.hit(item); else st.miss(item); });
        if(!all) deck.retry(r);
        passageDone(fb, got, n, all ? `You remembered all ${n}.` : '');
        manualNext(card, step, 'Next list →'); const row=card.querySelector(':scope > .next-row'); if(row) sec.appendChild(row); };
      chk.onclick=check;
      keyHandler=null;   // Enter in a box goes to the next box (and Check after the last)
      ins[0].focus({preventScroll:true}); sec.scrollIntoView({block:'nearest', behavior:'smooth'});
    });
  };
  step();
}

// ---------- FIND THE EVIDENCE (English version) / ALL-IN ENGLISH (Chinese version), 3 Nov 2026 ----------
// Teacher: "I present a sentence and the student has to pick sentences, in English, that match the initial statement…
// it requires them to make connections between words and their broader meanings." On the Chinese version (All-in English,
// A1–B1) it is word association; on the English version (Find the evidence) the same mechanic is a step towards language
// analysis. A statement, then the right and wrong details shuffled; the student chooses as many as there are right ones,
// then Check: chosen and right green, chosen and wrong red, missed ones with a dashed green border (Note taking's marks).
// All right = a right answer; anything else = a wrong one (the statement comes back later). Content: evidence.csv.
const zhEvidence = () => pick(S.evidence);
function playEvidence(){
  const zh=SIDE==='zh', key=zh ? 'zhevidence' : 'evidence', st=Stats(key), deck=Deck(()=>pick(S.evidence));
  const hint=T('Read the statement, choose the details that show it, then press Check.','读句子，选出能说明它的细节，然后点“检查”。');
  if(zh) zhShell(T('All-in English','全英文练习'), hint); else shell(GAMES.find(g=>g.key==='evidence'), hint);
  st.draw();
  const step=()=>{
    const r=deck.next(); if(!r) return;
    const opts=shuffle([...r.right.map(t=>({t, ok:true})), ...r.wrong.map(t=>({t, ok:false}))]), n=r.right.length, picked=new Set();
    const long=opts.some(o=>o.t.length>44), chosen=k=>T(`${k} of ${n} chosen`, `已选 ${k} / ${n}`);
    // A paragraph instead of a statement (7 Nov 2026, Advertising: a description of an advert, then points of analysis, some of
    // which can't apply to it): shown like a reading passage, not in the big bold statement type, with its own instruction.
    const para=String(r.s).split(/\s+/).length>25;
    const instr=para ? (n===1 ? T('Choose the point of analysis that fits this text','选出适用于这段文字的分析') : T(`Choose the ${n} points of analysis that fit this text`, `选出适用于这段文字的 ${n} 条分析`))
      : (n===1 ? T('Choose the detail that shows this','选出能说明这一点的细节') : T(`Choose the ${n} details that show this`, `选出能说明这一点的 ${n} 个细节`));
    const card=showCard(`<p class="instr">${instr}</p>
      ${para ? `<div class="passage ev-passage"><p>${esc(r.s)}</p></div>` : `<p class="statement ev-statement">${esc(r.s)}</p>`}
      <div class="opts notes${long?' long':''}">${opts.map((o,i)=>`<button class="opt" data-i="${i}" aria-pressed="false"><kbd>${i+1}</kbd><span>${esc(o.t)}</span></button>`).join('')}</div>
      <div class="next-row check-row"><span class="pick-n" id="pickN">${chosen(0)}</span><button class="btn" id="check" disabled>${T('Check','检查')}</button></div><div class="fb"></div>`);
    const btns=[...card.querySelectorAll('.opt')], chk=card.querySelector('#check'), pn=card.querySelector('#pickN'); let done=false;
    const toggle=b=>{ if(done) return; const i=+b.dataset.i;
      if(picked.has(i)) picked.delete(i); else { if(picked.size>=n) return; picked.add(i); }
      b.setAttribute('aria-pressed', picked.has(i)); pn.innerHTML=chosen(picked.size); chk.disabled=picked.size!==n; };
    const check=()=>{ if(done || picked.size!==n) return; done=true; card.querySelector('.check-row').remove();
      const got=[...picked].filter(i=>opts[i].ok).length, ok=got===n;
      btns.forEach(b=>{ const i=+b.dataset.i, good=opts[i].ok; b.disabled=true;
        b.classList.add(picked.has(i) ? (good?'ok':'no') : (good?'missed':'dim')); });
      const w=r.wid && byId[r.wid], more=(r.why ? `<span>${rich(r.why)}</span>` : '')+wordNote(w);
      const fb=card.querySelector('.fb');
      if(ok) fbOk(fb, more);
      else fbNo(fb, '', `<span>${T(`You found ${got} of ${n}. ${n-got===1 ? 'The one' : 'The ones'} with a dashed green border ${n-got===1 ? 'was' : 'were'} missed.`, `你找到了 ${got} / ${n} 个。绿色虚线框的是漏掉的细节。`)}</span>${more}`);
      settle(ok, card, st, deck, r, step, AUTO_MS*2); };
    btns.forEach(b=>b.onclick=()=>toggle(b)); chk.onclick=check;
    keyHandler=e=>{ const k=parseInt(e.key,10); if(k>=1 && k<=btns.length) toggle(btns[k-1]); else if(e.key==='Enter'){ e.preventDefault(); check(); } };
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
// Best first: the natural / neural / premium voices, British English, then other English.
// Chrome's own Google voices on a computer (not built into the device: localService false) need Google's servers, which
// are blocked on mainland networks, so they come last (8 Nov 2026); Android's Google voices are on the phone and keep their place.
const vScore = v => (/natural|neural|online|premium|enhanced/i.test(v.name)?6:0) + (/^en[-_]gb/i.test(v.lang)?3:/^en[-_](ie|au|nz)/i.test(v.lang)?1.5:/^en[-_]us/i.test(v.lang)?1:0)
  + (/google/i.test(v.name) ? (v.localService===false ? -20 : 1) : 0) + (vSex(v)?.5:0);
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

// ---------- LISTEN SWITCH (8 Nov 2026, teacher: "Try that listening switch first") ----------
// A 🔊 Listen switch in the bar of True or false, Word or meaning, General knowledge, Answer the question and Find the
// evidence, on the English topic pages. When it is on, the statement, word, meaning or question at the top of each card is hidden and the
// browser's voice reads it out as the card appears; 🔊 Hear it again (or the R key) repeats it as often as they like.
// The words appear once the student has answered. The answer buttons stay on screen as usual. Points are as normal.
// The setting is the student's, for every topic (aea:listen, saved to their account like everything under aea:).
// Not in the Daily Circuit or class games (listening is slower than reading, so timed stations would score lower).
// Voice: the one chosen on the Listening page (aea:voice) if this device has it, otherwise the best English voice (vScore),
// at the speed chosen there (aea:voice-rate). Browsers only speak after a tap on the page: opening the game is that tap;
// after a refresh mid-game the button says "Tap to hear" until the student taps. If the voice fails, the words are shown.
// To add a game: its key in LISTEN_KEYS, and the class of its text at the top in LISTEN_SEL (the card must call settle()).
// Find the evidence added 8 Nov 2026 (teacher): its statement, or its paragraph (Advertising's descriptions of adverts,
// up to ~600 characters), is read out; the details to choose stay on screen; the words appear after Check.
const LISTEN_KEYS = new Set(['tf','meaning','gk','question','evidence']);
const LISTEN_SEL = '.statement, .gk-q, .prompt-word, .prompt-def, .exam-q, .ev-passage';
// A long text is read a sentence at a time (some voices stop after about 15 seconds of one utterance). Full stops in
// titles, abbreviations and decimals don't end a sentence.
const listenSplit = t => { const safe=t.replace(/\b(Mr|Mrs|Ms|Dr|St|Prof|e\.g|i\.e|etc|vs)\./g, m=>m.replace(/\./g,'․')).replace(/(\d)\.(\d)/g, '$1․$2');
  return (safe.match(/[^.!?]+[.!?]+["”’)]*\s*|[^.!?]+$/g)||[safe]).map(s=>s.replace(/․/g,'.').trim()).filter(Boolean); };
const LISTEN_KEY = 'aea:listen';
let listenGame = null, listenRun = 0, listenU = null, listenSpoke = false;
const listenCan = g => TTS_OK && SIDE==='en' && !inCircuit && !classRun && !!g && LISTEN_KEYS.has(g.key);
const listenOn = () => { try{ return localStorage.getItem(LISTEN_KEY)==='1'; }catch(e){ return false; } };
const listenSwitch = () => `<button class="chip lsn-tog" type="button" aria-pressed="${listenOn()}" title="Hear each question read aloud instead of reading it"><span aria-hidden="true">🔊</span> Listen<span class="lsn-state" aria-hidden="true"></span></button>`;
function listenWire(){
  const b=document.querySelector('.lsn-tog'); if(!b) return;
  if(listenOn()) ttsLoad();
  b.onclick=()=>{ const on=!listenOn(); try{ localStorage.setItem(LISTEN_KEY, on ? '1' : '0'); }catch(e){}
    b.setAttribute('aria-pressed', on);
    const card=document.querySelector('#feed .card');
    if(on){ ttsLoad(); if(card && !card.classList.contains('lsn') && !listenAnswered(card)) listenCard(card, true); }
    else { listenQuiet(); if(card) listenUndo(card); } };
}
const listenAnswered = card => !!(card.querySelector('.fb') && card.querySelector('.fb').innerHTML.trim());
// What the voice says: the text without the part of speech, and "a / b" as "a, or b"
function listenText(p){
  const c=p.cloneNode(true); c.querySelectorAll('small').forEach(x=>x.remove());
  return c.textContent.replace(/\s+\/\s+/g, ', or ').replace(/\s+/g,' ').trim();
}
function listenCard(card, fromTap){
  const p=card.querySelector(LISTEN_SEL), text=p && listenText(p); if(!text) return;
  card.classList.add('lsn'); p.classList.add('lsn-hide');
  const box=document.createElement('div'); box.className='lsn-box';
  box.innerHTML=`<button class="btn lsn-play" type="button"><span aria-hidden="true">🔊</span> <span class="lsn-l">Hear it</span></button>
    <span class="lsn-note">Listen, then answer. The words appear after you answer.${PHONE?'':' Press R to hear it again.'}</span>`;
  p.before(box);
  card._lsnSay=()=>listenSay(text, card);
  box.querySelector('.lsn-play').onclick=card._lsnSay;
  // Speech is only allowed once the student has tapped the page (after a refresh, they tap the button)
  const ua=navigator.userActivation;
  if(fromTap || !ua || ua.hasBeenActive) listenSay(text, card); else listenLabel(card, 'Tap to hear');
}
const listenLabel = (card, t) => { const l=card.querySelector('.lsn-l'); if(l) l.textContent=t; };
function listenSay(text, card){
  if(!document.body.contains(card)) return;
  const my=++listenRun;
  const go=()=>{ if(my!==listenRun || !document.body.contains(card)) return;
    const list=vRanked(), box=card.querySelector('.lsn-box');
    let chosen='', rate=1; try{ chosen=localStorage.getItem('aea:voice')||''; rate=+localStorage.getItem('aea:voice-rate')||1; }catch(e){}
    const v=list.find(x=>x.name===chosen) || list[0];
    const parts=text.length>200 ? listenSplit(text) : [text];   // short texts (most cards) in one go, as before
    // A voice that never starts (e.g. one that needs a server this network can't reach): after 6 s, show the words
    const dog=listenSpoke ? 0 : setTimeout(()=>{ if(my===listenRun && !listenSpoke){ listenQuiet(); listenLabel(card, 'Hear it again'); listenFail(card); } }, 6000);
    listenU=parts.map((t, k)=>{   // kept, so the browser doesn't drop an utterance before it ends
      const u=new SpeechSynthesisUtterance(t);
      if(v){ u.voice=v; u.lang=v.lang; } else u.lang='en-GB';
      u.rate=rate;
      if(k===0) u.onstart=()=>{ clearTimeout(dog); if(my!==listenRun) return; listenSpoke=true; if(box) box.classList.add('speaking'); listenLabel(card, 'Playing…'); };
      if(k===parts.length-1) u.onend=()=>{ if(my!==listenRun) return; if(box) box.classList.remove('speaking'); listenLabel(card, 'Hear it again'); };
      u.onerror=e=>{ if(my!==listenRun) return;
        const why=e && e.error;
        if(why==='interrupted' || why==='canceled') return;
        if(box) box.classList.remove('speaking');
        if(why==='not-allowed'){ listenLabel(card, 'Tap to hear'); return; }
        listenLabel(card, 'Hear it again');
        if(!listenSpoke) listenFail(card); };   // nothing has played on this page: show the words so the game still works
      return u; });
    ttsStop=listenQuiet;
    listenU.forEach(u=>speechSynthesis.speak(u)); };
  let busy=false; try{ busy=speechSynthesis.speaking || speechSynthesis.pending; if(busy) speechSynthesis.cancel(); }catch(e){}
  // Straight away when we can (a tap on an iPhone only counts if speech starts inside it); a moment's wait after cancel()
  // (Chrome can drop an utterance spoken in the same instant); and a wait for the voices list on its first load
  if(busy) setTimeout(go, 60); else if(ttsVoices().length) go(); else ttsLoad().then(go);
}
function listenQuiet(){ listenRun++; try{ if(TTS_OK) speechSynthesis.cancel(); }catch(e){} }
function listenFail(card){
  listenReveal(card);
  const n=card.querySelector('.lsn-note'); if(n){ n.textContent='This device couldn’t read it aloud, so the words are shown. Try Microsoft Edge.'; n.classList.add('lsn-warn'); }
}
function listenReveal(card){
  if(!card || !card.classList.contains('lsn')) return;
  card.classList.add('lsn-shown');
  card.querySelectorAll('.lsn-hide').forEach(x=>x.classList.remove('lsn-hide'));
}
function listenUndo(card){
  card.querySelectorAll('.lsn-box').forEach(x=>x.remove()); card.querySelectorAll('.lsn-hide').forEach(x=>x.classList.remove('lsn-hide'));
  card.classList.remove('lsn','lsn-shown'); delete card._lsnSay;
}
if(TTS_OK && SIDE==='en'){
  if(listenOn()) ttsLoad();   // the voices load in the background while the page opens
  // R hears it again (the games on the list don't use R)
  document.addEventListener('keydown', e=>{ if(e.metaKey || e.ctrlKey || e.altKey || e.repeat || (e.key!=='r' && e.key!=='R')) return;
    if(e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    const c=document.querySelector('#feed .card.lsn'); if(c && c._lsnSay){ e.preventDefault(); c._lsnSay(); } });
  // iPhones and iPads: speech has to start inside a tap the first time, so the first tap anywhere starts a silent one
  const unlock=e=>{ document.removeEventListener('pointerup', unlock, true);
    if(!listenOn() || listenSpoke || (e.target && e.target.closest && e.target.closest('.lsn-play, .lsn-tog'))) return;   // those two speak inside the tap themselves
    try{ const u=new SpeechSynthesisUtterance(' '); u.volume=0; speechSynthesis.speak(u); }catch(e){} };
  document.addEventListener('pointerup', unlock, true);
  document.addEventListener('visibilitychange', ()=>{ if(document.hidden && listenGame) listenQuiet(); });
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
// answer (word points, word stages, level). In the Daily Circuit (and class games) a game lasts one minute and never ends
// early: a mistake costs length or points, not the game. Played from the Games row, Word Snake has no clock instead: it
// goes on until a wrong word ends it (1 Nov 2026, teacher; see playSnake). On the English topic menus in the Games row since 31 Oct (teacher), after General knowledge and Save the mouse.
const ARCADE = [
  {key:'snake', name:'Word Snake', zh:'单词贪吃蛇', blurb:'Eat the word that matches the meaning. One wrong bite ends it.', items:()=>pick(S.words), min:6, run:()=>playSnake()},
  {key:'whack', name:'Whack-a-word', zh:'单词打地鼠', blurb:'Words pop up from holes. Tap the one that matches the meaning.', items:()=>pick(S.words), min:6, run:()=>playWhack()},
  {key:'invaders', name:'Word Invaders', zh:'单词入侵者', blurb:'Words march down the screen. Shoot the one that fits the meaning.', items:()=>pick(S.words), min:6, run:()=>playInvaders()}
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
// o (optional): {title, unit(score), note}: Word Snake's game over (1 Nov) says what ended it and counts points
function arcadeEnd(game, score, missed, again, o){
  o=o||{};
  clearTimers(); keyHandler=null; document.querySelector('.timer')?.remove();
  const prev=store.get('best:'+game.key,0), isBest=score>prev; if(isBest) store.set('best:'+game.key,score);
  const list=[...new Map(missed.map(w=>[w.id,w])).values()];
  const zh=SIDE==='zh';
  const card=showCard(`<div class="end"><p class="instr">${zh ? gameNameT(game) : esc(game.name)} · ${o.title||T("time's up",'时间到')}</p>
    <div class="big">${score}</div><p class="end-sub">${o.unit ? o.unit(score) : T((score===1?'word':'words')+' found', '个单词')}</p>${o.note||''}
    <h2>${isBest ? T('New best score!','新纪录！') : T('Best score: ','最高分：')+Math.max(prev,score)}</h2>
    ${list.length?`<p class="instr" style="margin-top:22px">${T('Words to practise','要练习的单词')}</p><ul class="review">${list.map(w=>`<li><b>${esc(w.w)}</b>${zh && ZH[w.id] ? ` <span lang="zh-CN">${esc(ZH[w.id])}</span>` : ''} – ${esc(w.def)}</li>`).join('')}</ul>`:''}
    <div class="end-actions"><button class="btn" id="again">${T('Play again','再玩一次')}</button><a class="btn alt" href="#">${T('All games','所有游戏')}</a></div></div>`);
  card.querySelector('#again').onclick=again;
  keyHandler=e=>{ if(e.key==='Enter'){ e.preventDefault(); again(); } };
}

// ----- Word Snake -----
// The board is a grid (24 x 14 on computers, 14 x 14 on phones). The words sit on it as labels; steer the snake's head
// into the one that matches the meaning. Right: the snake grows and speeds up a little, and a new meaning appears.
// The walls let the snake through.
// From the Games row (1 Nov 2026, teacher): no clock; it goes on for as long as you survive. Each right word scores 3
// points; a wrong word ends the game (its meaning and the word you needed are shown); biting your own tail cuts it off
// and costs a point for each piece lost.
// In the Daily Circuit and class games: one minute; a wrong word costs two pieces, and biting your tail just cuts it off.
// Controls: arrow keys or WASD, or tap (or click) the screen on the side you want to go: above or below the head when
// the snake is going sideways, left or right of it when it is going up or down. Never diagonal, never straight back.
function playSnake(){
  const game=ARCADE.find(g=>g.key==='snake'), SECS=60;
  const touch=PHONE || !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
  const COLS=PHONE?14:24, ROWS=14, N=PHONE?3:4;
  const ENDLESS=!inCircuit && !classRun, timed=!inCircuit && !ENDLESS;   // ENDLESS: played from the Games row
  const nextQ=arcadeQuestions(N), best=store.get('best:snake',0);
  let score=0; const missed=[];
  const snHint=T(`${touch?'Tap the screen on the side you want the snake to turn.':'Use the arrow keys or WASD (or click on the side you want to turn).'} ${ENDLESS?'Each right word scores 3 points. Eat a wrong word and the game is over. Biting your tail costs points. You can go through the walls.':'A wrong word makes the snake shorter. You can go through the walls.'}`,
    `${touch?'点击屏幕上你想让蛇转向的那一边。':'用方向键或 WASD 转向（也可以点击想转向的那一边）。'}${ENDLESS?'每吃对一个单词得 3 分。吃错一个，游戏就结束。咬到尾巴会扣分。蛇可以穿过墙。':'吃错单词，蛇会变短。蛇可以穿过墙。'}`);
  if(NEW_UI) gameLayout(game, snHint, {top:timed?timerBar():''});
  else frame({href:'#', label:CFG.name||'Back'}, `<div class="bar"><span class="title">${game.name}</span><span class="spacer"></span><div class="stats" id="stats"></div></div>
    <p class="hint">${snHint}</p>
    ${timed?timerBar():''}<div class="feed" id="feed"></div>`);
  const stats=()=>{ const el=document.getElementById('stats'); if(!el) return;
    el.innerHTML=NEW_UI ? gStats([[ENDLESS?T('Score','得分'):T('Found','找到'), score], ...(timed?[[T('Time','时间'), SECS, T('s','秒'), 'snSecs']]:[]), [T('Best','最佳'), Math.max(best,score)]])
      : `<span>${ENDLESS?'Score':'Found'} <b>${score}</b></span>${timed?`<span><b id="snSecs">${SECS}</b>s</span>`:''}<span>Best <b>${Math.max(best,score)}</b></span>`; };
  const card=showCard(`<p class="instr">${T('Find the word that means','找出这个意思的单词')}</p><p class="arcade-def" id="snDef"></p>
    <div class="snake-board" id="snBoard"><canvas id="snCanvas" role="img" aria-label="${TX('Word Snake board','单词贪吃蛇的游戏区')}"></canvas><p class="snake-msg" id="snMsg">${touch?T('Tap to start','点击开始'):T('Press an arrow key to start','按方向键开始')}</p></div>
    <p class="toast arcade-toast" id="toast" aria-live="polite"></p>`);
  card.classList.add('arcade-card'); card.style.touchAction='manipulation';   // quick taps never zoom the page
  const box=card.querySelector('#snBoard'), cv=card.querySelector('#snCanvas'), cx=cv.getContext('2d'), msg=card.querySelector('#snMsg');
  const alive=()=>document.body.contains(cv);   // false once the student has moved on to another page or game

  // Colours come from the page's own palette, so the board follows light and dark mode
  let col={}, cell=20, fontPx=14;
  const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const colours=()=>{ col={paper:css('--paper'), sheet:css('--sheet'), ink:css('--ink'), rule:css('--rule'), mark:css('--mark'), good:css('--good'), goodSoft:css('--good-soft'), bad:css('--bad'), badSoft:css('--bad-soft'), font:css('--f-body')||'sans-serif'}; };
  const font=px=>`700 ${px}px ${col.font}`;
  // The board fills the card's width, but stays short enough for the meaning, the board (and the arrows) to fit on the screen together
  const size=()=>{ const dpr=window.devicePixelRatio||1, fitH=Math.floor((window.innerHeight-(touch?280:240))/ROWS);
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
    score+=ENDLESS?3:1; stats(); if(firstTry) P.record('snake', q.w, true);
    grow+=2; step=Math.max(115, step-4);
    say('✓ '+q.w.w);
    flash=Object.assign({}, p, {until:performance.now()+500});
    newQuestion();
  }
  function wrong(p){
    p.state='bad'; p.until=performance.now()+700;   // shown in red for a moment, then gone
    if(firstTry){ firstTry=false; P.record('snake', q.w, false); missed.push(q.w); q.retry(); }
    if(ENDLESS){   // the wrong word ends the game: a moment to see it, then the score
      over=true; p.until=performance.now()+1400; say(`✗ ${p.w.w}: ${p.w.def}`, true);
      const want=q.w, ate=p.w;
      later(()=>{ if(alive()) arcadeEnd(game, score, missed, playSnake, {title:T('game over','游戏结束'), unit:n=>T(n===1?'point':'points','分'),
        note:`<p class="end-sub" style="margin:14px 0 20px">${T(`You ate <b>${esc(ate.w)}</b>: ${esc(ate.def)}<br>The word you needed was <b>${esc(want.w)}</b>.`, `你吃了 <b>${esc(ate.w)}</b>：${esc(ate.def)}<br>你要找的单词是 <b>${esc(want.w)}</b>。`)}</p>`}); }, 1400);
      return; }
    const cut=Math.min(2, snake.length-3); if(cut>0){ snake.splice(snake.length-cut, cut); prevTail=null; }
    say(`✗ ${p.w.w}: ${p.w.def}`, true);
  }
  function advance(){
    if(queue.length) dir=queue.shift();
    const h=snake[0], nh={x:wx(h.x+dir.x), y:wy(h.y+dir.y)};
    const bite=snake.findIndex((p,i)=>i>0 && i<snake.length-(grow?0:1) && p.x===nh.x && p.y===nh.y);
    prevHead=h; snake.unshift(nh);
    if(grow>0){ grow--; prevTail=null; } else prevTail=snake.pop();
    if(bite>0){ const lost=snake.length-(bite+1); snake=snake.slice(0, bite+1); prevTail=null;
      if(ENDLESS){ const was=score; score=Math.max(0, score-lost); stats(); say(TX(`Ouch! You bit your tail: −${was-score} point${was-score===1?'':'s'}.`, `哎哟！咬到尾巴了：−${was-score} 分。`), true); }
      else say(TX('Ouch! You bit your tail.', '哎哟！咬到尾巴了。'), true); }
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
  function start(){ if(started) return; started=true; msg.hidden=true; if(timed) end=Date.now()+SECS*1000; run(); clock();
    // if the game does not fit on the screen, scroll so the timer and the whole card are in view
    if(card.getBoundingClientRect().bottom>window.innerHeight){ const top=document.querySelector('#app .timer') || card; window.scrollTo({top:top.getBoundingClientRect().top+window.scrollY-8-stickyTop(), behavior:'smooth'}); } }
  function pause(){ if(!started || paused || over) return; paused=true; if(timed) left=Math.max(0, end-Date.now());
    msg.textContent=touch?TX('Paused. Tap to carry on','已暂停。点击继续'):TX('Paused. Press an arrow key to carry on','已暂停。按方向键继续'); msg.hidden=false; }
  function resume(){ if(!paused || over) return; paused=false; if(timed) end=Date.now()+left; msg.hidden=true; run(); }
  // The game's own minute (in the Daily Circuit, the circuit's clock ends the station instead)
  function clock(){ if(over || !timed || !alive()) return;
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

  // Controls: keys, and taps (or clicks) anywhere on the game card: the snake turns towards the side tapped
  const KEYS={ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right', w:'up', s:'down', a:'left', d:'right', W:'up', S:'down', A:'left', D:'right'};
  keyHandler=e=>{ const n=KEYS[e.key]; if(n){ e.preventDefault(); turn(n); }
    else if((e.key===' ' || e.key==='Enter') && (!started || paused)){ e.preventDefault(); started ? resume() : start(); } };
  // Going sideways: a tap above the head turns up, below turns down. Going up or down: left or right of the head.
  // Taps are judged against the direction the snake will be going after any turns already waiting, so quick taps chain.
  card.addEventListener('pointerdown', e=>{
    if(over || (e.target.closest && e.target.closest('button, a, input'))) return;
    if(e.pointerType!=='mouse') e.preventDefault();
    const r=cv.getBoundingClientRect(), h=snake[0], hx=r.left+(h.x+.5)*cell, hy=r.top+(h.y+.5)*cell;
    const dx=e.clientX-hx, dy=e.clientY-hy, last=queue.length ? queue[queue.length-1] : dir;
    const name = last.x ? (Math.abs(dy)<cell*.5 ? null : dy<0 ? 'up' : 'down') : (Math.abs(dx)<cell*.5 ? null : dx<0 ? 'left' : 'right');
    if(name) turn(name); else if(!started) start(); else if(paused) resume(); });
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
  const wkHint=T(`${touch?'Tap':'Click (or press its number on)'} the word that matches the meaning while it is up. A wrong word stops your hammer for a second.`, '单词冒出来时，点击意思对的那个。点错了，锤子会停一秒。');
  if(NEW_UI) gameLayout(game, wkHint, {top:inCircuit?'':timerBar()});
  else frame({href:'#', label:CFG.name||'Back'}, `<div class="bar"><span class="title">${arcadeName(game)}</span><span class="spacer"></span><div class="stats" id="stats"></div></div>
    <p class="hint">${wkHint}</p>
    ${inCircuit?'':timerBar()}<div class="feed" id="feed"></div>`);
  const stats=()=>{ const el=document.getElementById('stats'); if(!el) return;
    el.innerHTML=NEW_UI ? gStats([[T('Found','找到'), score], ...(inCircuit?[]:[[T('Time','时间'), SECS, T('s','秒'), 'wkSecs']]), [T('Best','最佳'), Math.max(best,score)]])
      : `<span>${T('Found','找到')} <b>${score}</b></span>${inCircuit?'':`<span><b id="wkSecs">${SECS}</b>s</span>`}<span>${T('Best','最佳')} <b>${Math.max(best,score)}</b></span>`; };
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
  const ivHint=T(`${touch?'Tap':'Click (or press its number on)'} the word that matches the meaning before the words reach the line at the bottom. After a wrong word, the highlighter needs a second to cool down.`, '在单词落到底线之前，点击意思对的那个。点错了，荧光笔要等一秒才能再用。');
  if(NEW_UI) gameLayout(game, ivHint, {top:inCircuit?'':timerBar()});
  else frame({href:'#', label:CFG.name||'Back'}, `<div class="bar"><span class="title">${arcadeName(game)}</span><span class="spacer"></span><div class="stats" id="stats"></div></div>
    <p class="hint">${ivHint}</p>
    ${inCircuit?'':timerBar()}<div class="feed" id="feed"></div>`);
  const stats=()=>{ const el=document.getElementById('stats'); if(!el) return;
    el.innerHTML=NEW_UI ? gStats([[T('Found','找到'), score], ...(inCircuit?[]:[[T('Time','时间'), SECS, T('s','秒'), 'ivSecs']]), [T('Best','最佳'), Math.max(best,score)]])
      : `<span>${T('Found','找到')} <b>${score}</b></span>${inCircuit?'':`<span><b id="ivSecs">${SECS}</b>s</span>`}<span>${T('Best','最佳')} <b>${Math.max(best,score)}</b></span>`; };
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
    if(card.getBoundingClientRect().bottom>window.innerHeight){ const top=document.querySelector('#app .timer') || card; window.scrollTo({top:top.getBoundingClientRect().top+window.scrollY-8-stickyTop(), behavior:'smooth'}); } }
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
const ZH = Object.fromEntries((SYL ? SYL_FULL.words : S.words).filter(w=>w.zh).map(w=>[w.id,w.zh]));   // the zh column of words.csv
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
  // All-in English (3 Nov 2026, teacher): a statement in English, then choose the English details that match it (evidence.csv)
  {key:'zhevidence', type:'practice', name:'All-in English',   zh:'全英文练习',     blurb:'Read a sentence in English, then choose the English details that match it.', zhBlurb:'读一句英文，选出和它相符的英文细节。', run:()=>playEvidence(), ready:()=>zhEvidence().length>0, lock:'Nothing at this level yet 本级别还没有题目'},
  // Translation (8 Nov 2026, teacher): a sentence in Chinese, then choose the English sentence that has the whole meaning (translation.csv)
  {key:'zhtranslate', type:'practice', name:'Translation',     zh:'翻译',           blurb:'Read a sentence in Chinese, then choose the English sentence that means exactly the same.', zhBlurb:'读一句中文，选出意思完全相同的英文句子。', run:()=>playTranslate(), ready:()=>zhTranslations().length>0, lock:'Nothing at this level yet 本级别还没有题目'},
  // Odd one out was taken off the Chinese side on 26 Oct (teacher: replace it with Build the sentence). playOdd() is still
  // below; to bring it back, remove the // from the next line.
  // {key:'zhodd',    type:'practice',  name:'Odd one out',        zh:'找出不同类',     blurb:'Four words: three belong together. Find the one that doesn’t.', zhBlurb:'四个词里有三个是一类的，找出不同的那个。', run:()=>playOdd(), needs:()=>oddReady()},
  {key:'zhmouse',  type:'practice',  name:'Save the mouse',     zh:'拯救小老鼠',     blurb:'See the Chinese and the meaning, then guess the English word one letter at a time. Every wrong letter and the mouse loses a piece.', zhBlurb:'看中文和释义，一个字母一个字母地猜出英文单词。每猜错一次，小老鼠就少一块！', run:()=>playMouse(true)},
  // Word search (7 Nov 2026): in the Games column, where "Wordsearch: coming soon" was
  {key:'zhwordsearch', type:'practice', time:true, name:'Word search', zh:'单词搜索', blurb:'Find your English words hidden in a square of letters. The clues are the words or their Chinese.', zhBlurb:'在字母方阵里找出隐藏的英文单词，提示是单词本身或它的中文。', min:6, run:()=>playWordSearch(true)},
  // Crossword (9 Nov 2026): in the Games column, under Word search
  {key:'zhcrossword', type:'practice', time:true, name:'Crossword', zh:'填字游戏', blurb:'Fill in the grid with your English words. The clues are their Chinese or their meanings.', zhBlurb:'用你的英文单词填满方格，提示是它们的中文或英文释义。', min:6, run:()=>playCrossword(true), needs:()=>xwFit(zhWords(), true, 13).length>=6},
  {key:'zhspeed',  type:'challenge', name:'Speed round',        zh:'限时挑战',       blurb:'60 seconds. See the Chinese, choose the English word. How many can you get?', zhBlurb:'60 秒内看中文选英文，看你能答对多少个！', min:8, run:()=>playSpeed()},
  {key:'zhsurvive',type:'challenge', name:'Survival',           zh:'生存挑战',       blurb:'Three lives. See the word and its Chinese, then choose the English meaning before time runs out. It gets faster.', zhBlurb:'三条命。看单词和中文，在时间用完前选出英文释义，会越来越快。', min:8, run:()=>playSurvival()}
];
// Science pages (3 Nov 2026): the generated games, in their own section on the Chinese menu (zhMenu)
const GEN_ZH = SIDE==='zh' ? GEN_GAMES.map(g=>({key:g.key, type:'chem', gen:true, name:g.name, zh:g.zh, blurb:g.blurb, zhBlurb:g.zhBlurb, run:g.run, ready:()=>g.items().length>=g.min})) : [];
ZH_GAMES.push(...GEN_ZH);
// Each game says it is the one on screen when it starts (the new layout's heading and side panel: zhShell, stage 4)
ZH_GAMES.forEach(g=>{ const run=g.run; g.run=()=>{ ZH_NOW=g; return run(); }; });
// The Chinese topic page (3 Nov 2026, teacher): three columns of three games, Vocab, Sentences and Games, "a 3x3 grid so
// it should be neat and tidy". Choose the meaning and True or false left the page ("too similar to the other stuff and there's
// too much stuff on the page") but stay in the Daily Circuit; Speed round and Survival are not on the grid either (their
// code is still here). Word Snake (an arcade game) is on the grid, and All-in English (evidence.csv, 3 Nov 2026).
// soon: = a card that says "Coming soon".
const ZH_COLS = [
  {key:'vocab',     name:'Vocab',     zh:'词汇', games:['zh', 'zhmatch', 'zhtype']},
  {key:'sentences', name:'Sentences', zh:'句子', games:['zhbuild', 'zhtranslate', 'zhevidence']},
  {key:'games',     name:'Games',     zh:'游戏', games:['zhmouse', 'snake', 'zhwordsearch', 'zhcrossword']}
];
const ZH_SOON = {translate:['Translation','翻译'], wordsearch:['Wordsearch','单词搜索']};
const ZH_SNAKE = {key:'snake', type:'arcade', name:'Word Snake', zh:'单词贪吃蛇', blurb:'Eat the word that matches the meaning. One wrong bite ends it.',
  zhBlurb:'吃掉和释义相符的单词，咬错一口就结束。', min:6, run:()=>playSnake()};
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
  const lockText=g=> sylNone() ? T('Choose your topics first','先选择主题') : n<4 ? T('Not enough words at this level yet','本级别单词不够')
    : need(g)>0 ? T(`${need(g)} more word${need(g)===1?'':'s'}`, `再学 ${need(g)} 个单词`)
    : T('Words from more groups','学习更多类别的单词');
  const shown=ZH_GAMES.filter(g=>!g.gen && (!g.ready || g.ready())), open=shown.filter(zhReady), locked=shown.filter(g=>!zhReady(g));
  // What the next words unlock: "Learn 4 words to unlock 4 games"
  const needs=n>=4 ? locked.filter(g=>need(g)>0).map(need) : [], next=needs.length ? Math.min(...needs) : 0, opens=locked.filter(g=>need(g)===next && !g.needs).length;
  const teaser=next ? T(`Learn ${next}${have?' more':''} word${next===1?'':'s'} to unlock ${opens} game${opens===1?'':'s'}.`, `再学 ${next} 个单词，解锁 ${opens} 个游戏。`) : '';
  const card=g=>{ const sc=g.type==='challenge' || g.type==='arcade' || g.time, best=store.get((sc?'best:':'streak:')+g.key,0);
    return `<a class="game" href="#play-${g.key}">${g.type==='challenge'?`<span class="game-tag">${T('Challenge','挑战')}</span>`:''}<h3>${T(g.name, g.zh)}</h3><p>${T(g.blurb, g.zhBlurb)}</p>
      <span class="best">${best?(g.time?T('Best time','最快')+': '+mmss(best):(sc?T('Best score','最高分'):T('Best streak','最佳连对'))+': '+best):T('Not played yet','还没玩过')}</span></a>`; };
  // The grid: a game that isn't open yet keeps its place, greyed, saying what opens it
  const offCard=(name, zh, why)=>`<div class="game off" aria-disabled="true"><h3>${T(name, zh)}</h3><span class="best">${why}</span></div>`;
  const cell=k=>{
    if(k.startsWith('soon:')){ const s=ZH_SOON[k.slice(5)]||[k.slice(5), k.slice(5)]; return offCard(esc(s[0]), esc(s[1]), T('Coming soon','即将推出')); }
    const g=k==='snake' ? ZH_SNAKE : ZH_GAMES.find(x=>x.key===k); if(!g) return '';
    if(zhReady(g)) return card(g);
    return offCard(g.name, g.zh, g.lock && n>=4 && !sylNone() ? T(...g.lock.split(/ (?=[\u3400-\u9fff])/)) : lockText(g));
  };
  const grid=`<div class="zh-grid">${ZH_COLS.map(c=>`<h2 class="zh-col-h zh-col-${c.key}">${T(c.name, c.zh)}</h2>${c.games.map(cell).join('')}`).join('')}</div>`;
  const tile=g=>`<div class="game-lock" aria-disabled="true">${LOCK_SVG}<span class="gl-name">${T(g.name, g.zh)}</span><span class="gl-need">${lockText(g)}</span></div>`;
  if(NEW_UI) return zhTopicPage(cell, card);
  frame({href:CFG.back||'../index.html', label:CFG.backLabel||'中文版 Chinese version', html:T('Chinese version','中文版')}, `
  <section class="hero hero-compact hero-zhc">
    <p class="eyebrow">${T('Chinese version','中文版')}</p>
    <h1>${nameT(CFG.name)}</h1>${sylPicker()}
    ${zhLevelLine()}
  </section>${GEN_ZH.length ? (()=>{ const on=GEN_ZH.filter(g=>g.ready()), off=GEN_ZH.filter(g=>!g.ready());
    return `<h2 class="zh-games-h">${T(esc(GEN.title||'Practice'), esc(GEN.titleZh||'练习'))}</h2>${on.length ? `<div class="games">${on.map(card).join('')}</div>` : ''}
      ${off.length ? `<div class="locks">${off.map(g=>`<div class="game-lock" aria-disabled="true">${LOCK_SVG}<span class="gl-name">${T(g.name, g.zh)}</span><span class="gl-need">${sylNone() ? T('Choose your topics first','先选择主题') : T('None in your topics yet','你选的主题里还没有')}</span></div>`).join('')}</div>` : ''}\n`; })() : ''}
  ${grid}
  <div class="wl-link"><p>${T('See every word with its Chinese meaning.','查看所有单词和中文释义。')}</p><a class="btn alt" href="#words">${T('Word list','词汇表')}</a></div>`);
  wireLevels(zhMenu); wireSyl(zhMenu);
}
// THE NEW CHINESE SUBJECT PAGE (redesign stage 4, 8 Nov 2026; only when NEW_UI): the English subject page (topicPage) in
// Chinese. The subject's area and name, its 我在学 switch, the topics (science pages) and the student's level (no level
// buttons: on the Chinese side the level moves by itself as the student's words grow, see zhPoolWords); the word cards (the English word on the front; its Chinese, the meaning and an example on the back) and Your words;
// then the games: the science page's own games (练习) and the three columns of three (词汇, 句子, 游戏: ZH_COLS), a game that
// is not open yet keeping its place, greyed, with what opens it. cell and card: zhMenu's.
function zhTopicPage(cell, card){
  const sub=SUBJECT, area=sub && window.AEA_SUBJECTS ? AEA_SUBJECTS.areaOf(sub.area) : null, n=splitName(CFG.name||'');
  const eyebrow=area ? T(esc(area.name), esc(area.zh||area.name)) : T('Chinese version','中文版');
  const gen=(()=>{ if(!GEN_ZH.length) return ''; const on=GEN_ZH.filter(g=>g.ready()), off=GEN_ZH.filter(g=>!g.ready());
    const why=sylNone() ? T('Choose your topics first','先选择主题') : T('None in your topics at this level yet','你的主题在本级别还没有题目');
    return `<section class="col col-gen games-row" aria-labelledby="col-gen"><h2 id="col-gen">${T(esc(GEN.title||'Practice'), esc(GEN.titleZh||'练习'))}</h2>
      <div class="games-grid">${on.map(card).join('')}${off.map(g=>`<div class="game off" aria-disabled="true"><h3>${T(g.name, g.zh)}</h3><span class="best">${why}</span></div>`).join('')}</div></section>`; })();
  frame({href:CFG.back||'../index.html', label:CFG.backLabel||'中文版 Chinese version'}, `
  <section class="t-head" aria-labelledby="tH">
    <div class="t-top"><div class="t-title"><p class="t-eyebrow"${area?` style="color:${area.color}"`:''}>${eyebrow}</p><h1 id="tH">${nameT(CFG.name)}</h1></div>${studyHtml()}</div>
    ${sylPicker()}
    <div class="t-lv">${zhLevelLine()}</div>
  </section>
  ${wordCardsHtml()}
  ${gen}
  <div class="cols zh-cols">${ZH_COLS.map(c=>`<section class="col col-${c.key}" aria-labelledby="col-${c.key}"><h2 id="col-${c.key}">${T(c.name, c.zh)}</h2>${c.games.map(cell).join('')}</section>`).join('')}</div>`,
    {label:n.en, zh:n.zh}, 'topic');
  wireSyl(zhMenu); wireStudy(); wireCards();
}
function zhShell(title, note){
  if(NEW_UI) return gameLayout(ZH_NOW || {key:'', name:String(title).replace(/<[^>]*>/g,'')}, note, {titleHtml:title});
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
  ZH_NOW={key:'learn', name:'Learn the words', zh:'学习单词'}; P.refresh();
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

// ----- Chinese side: Translation (8 Nov 2026, teacher) -----
// "Students see a Chinese statement and choose the English sentence that expresses the whole meaning." Four sentences: the
// right one and three wrong ones from translation.csv (the same words with the meaning changed, broken word order, or only
// part of the meaning). Rows at the student's level; a student past the highest level written gets the highest one below
// (the Chinese side's sentences are A1–B1), a student below every level the lowest. One answer per sentence.
const zhTranslations = () => { const all=S.translations||[]; if(!all.length) return [];
  const b=chosenBand() ?? 1, at=l=>all.filter(x=>bandOf(x)===l);
  for(let l=b; l>=1; l--){ const r=at(l); if(r.length) return r; }
  for(let l=b+1; l<=5; l++){ const r=at(l); if(r.length) return r; }
  return all; };
function playTranslate(){
  const st=Stats('zhtranslate'), deck=Deck(()=>zhTranslations());
  zhShell(T('Translation','翻译'), T('Read the Chinese, then choose the English sentence that means exactly the same.','读中文，选出意思完全相同的英文句子。')); st.draw();
  const step=()=>{
    const t=deck.next(), w=t.wid ? byId[t.wid] : null;
    mcCard({instr:T('Choose the English sentence with the whole meaning','选出完整表达这句话意思的英文句子'), promptHtml:`<p class="zh-sentence" lang="zh-CN">${esc(t.zh)}</p>`,
      options:[t.en, ...t.wrong], answer:t.en, optClass:'long',
      onResult:(ok,card,fb)=>{ const why=t.why ? `<span>${rich(t.why)}</span>` : '';
        ok ? fbOk(fb, why) : fbNo(fb, '', why + (w ? wordNote(w) : '')); settle(ok,card,st,deck,t,step); }});
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
// The topic choice on a science page: a closed bar says what is chosen; open, it has a tick box per syllabus topic (the
// ones with nothing yet say "Coming soon"), Core / Extended, Select all, Clear and Done. Every change is saved at once and
// the page is drawn again with the list still open.
let sylOpen = null;   // null: open on a first visit or while nothing is ticked; then as the student left it
function sylPicker(){
  if(!SYL) return '';
  const c=sylChoice(), open=sylOpen==null ? !c.set || !c.topics.length : sylOpen, live=t=>SYL_LIVE.has(String(t.n));
  const on=SYL.filter(t=>c.topics.includes(String(t.n))), nLive=SYL.filter(live).length, sep=SIDE==='zh' ? T(', ','、') : ', ';
  const sum = !on.length ? T('None chosen yet','还没有选择') : on.length===nLive && nLive>1 ? T(`All ${nLive} topics`, `全部 ${nLive} 个主题`) : on.map(t=>T(esc(t.name), esc(t.zh||t.name))).join(sep);
  return `<details class="syl"${open?' open':''}>
    <summary class="syl-sum"><span class="syl-k">${T('Your topics','你的主题')}</span><span class="syl-v">${sum}</span><span class="syl-c">${c.course==='core' ? T('Core','核心') : T('Extended','扩展')}</span></summary>
    <div class="syl-panel">
      <p class="syl-help">${T('Tick the topics you have studied or want to practise. The games use only these.','勾选你学过或想练习的主题，游戏只会用这些主题的内容。')}</p>
      <div class="syl-course" role="group" aria-label="${esc(TX('Your course','你的课程'))}"><span class="syl-lab">${T('Your course','你的课程')}</span>
        <button type="button" class="chip" data-course="core" aria-pressed="${c.course==='core'}">${T('Core','核心')}</button>
        <button type="button" class="chip" data-course="extended" aria-pressed="${c.course!=='core'}">${T('Extended','扩展')}</button></div>
      <ul class="syl-list${SYL_GROUPS?' grouped':''}">${SYL.map((t,i)=>{ const ok=live(t), id='syl-'+String(t.n).replace(/\./g,'-').replace(/[^\w-]/g,''), gk=sylGroupOf(t), g=SYL_GROUPS && SYL_GROUPS[gk];
        let head='';
        if(g && (i===0 || sylGroupOf(SYL[i-1])!==gk)){ const kids=SYL.filter(x=>sylGroupOf(x)===gk && live(x)).map(x=>String(x.n)), n=kids.filter(k=>c.topics.includes(k)).length;
          head=`<li class="syl-head${kids.length?'':' off'}"><input type="checkbox" id="sylg-${esc(gk)}" data-group="${esc(gk)}"${kids.length && n===kids.length?' checked':''}${n && n<kids.length?' data-some="1"':''}${kids.length?'':' disabled'}><label for="sylg-${esc(gk)}"><span class="syl-n">${esc(gk)}</span><span class="syl-name">${T(esc(g.name), esc(g.zh||g.name))}</span>${kids.length?'':`<span class="syl-soon">${T('Coming soon','即将推出')}</span>`}</label></li>`; }
        return head+`<li class="${ok?'':'off'}"><input type="checkbox" id="${id}" value="${esc(t.n)}"${c.topics.includes(String(t.n))?' checked':''}${ok?'':' disabled'}><label for="${id}"><span class="syl-n">${esc(t.n)}</span><span class="syl-name">${T(esc(t.name), esc(t.zh||t.name))}</span>${ok?'':`<span class="syl-soon">${T('Coming soon','即将推出')}</span>`}</label></li>`; }).join('')}</ul>
      <div class="syl-tools"><button type="button" class="btn alt small" data-syl="all">${T('Select all','全选')}</button><button type="button" class="btn alt small" data-syl="none">${T('Clear','清除')}</button><button type="button" class="btn small" data-syl="done">${T('Done','完成')}</button></div>
    </div></details>
    ${!c.topics.length ? `<p class="syl-start">${T('Tick at least one topic to start.','至少勾选一个主题就可以开始了。')}</p>` : ''}`;
}
function wireSyl(again){
  if(!SYL) return; const d=$app.querySelector('details.syl'); if(!d) return;
  d.addEventListener('toggle', ()=>{ sylOpen=d.open; });
  const redo=sel=>{ const y=window.scrollY; sylApply(); if(SIDE==='zh') store.set('zhband', null); again(); window.scrollTo(0, y);
    const f=sel && $app.querySelector(sel); if(f) f.focus({preventScroll:true}); };   // a new set of words: no "Level up" for it
  const set=(topics, course, sel)=>{ const c=sylChoice(); sylSave({topics:topics||c.topics, course:course||c.course}); sylOpen=true; redo(sel); };
  const ticked=()=>[...d.querySelectorAll('.syl-list input:not([data-group]):checked')].map(x=>x.value);
  d.querySelectorAll('.syl-list input:not([data-group])').forEach(i=>i.onchange=()=>set(ticked(), null, '#'+i.id));
  d.querySelectorAll('.syl-list input[data-group]').forEach(i=>{ if(i.dataset.some) i.indeterminate=true;   // some of its topics ticked
    i.onchange=()=>{ const kids=SYL.filter(t=>sylGroupOf(t)===i.dataset.group && SYL_LIVE.has(String(t.n))).map(t=>String(t.n)), now=ticked();
      set(i.checked ? [...new Set([...now, ...kids])] : now.filter(k=>!kids.includes(k)), null, '#'+i.id); }; });
  d.querySelectorAll('[data-course]').forEach(b=>b.onclick=()=>set(null, b.dataset.course, `[data-course="${b.dataset.course}"]`));
  d.querySelector('[data-syl="all"]').onclick=()=>set(SYL.filter(t=>SYL_LIVE.has(String(t.n))).map(t=>String(t.n)), null, '[data-syl="all"]');
  d.querySelector('[data-syl="none"]').onclick=()=>set([], null, '[data-syl="none"]');
  d.querySelector('[data-syl="done"]').onclick=()=>{ const c=sylChoice(); if(!c.set) sylSave(c); sylOpen=false; again(); };
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
  const stats=`<div class="stat-tiles"><div class="stat"><b>${answers}</b><span>answers</span></div><div class="stat"><b>${answers?Math.round(100*right/answers):0}%</b><span>right</span></div>
    <div class="stat"><b>${streak}</b><span>day${streak===1?'':'s'} in a row</span></div><div class="stat"><b>${known}</b><span>words known · ${learning} learning</span></div></div>`;
  const note=loggedIn()?'Your progress is saved to your account, so it is the same on every device you log in on.':'Progress is saved in this browser on this device. Clearing browsing data, or using another computer, starts again. Log in to keep it in your account.';
  // New look (stage 3, 8 Nov 2026): the same figures, as boxes across the width; the account panel (account.js) goes under the heading.
  // Opened from the Chinese side (stage 4): the same page, every label in both languages (T: ZH_UI)
  if(NEW_UI && ZH_UI) return progressZh({list, answers, right, known, learning, streak, L, PT, fmt, row});
  if(NEW_UI) return frame(null, `
  <section class="hero p-head"><p class="g-eyebrow">My progress</p>
    <h1>${L ? nameHtml(L.name) : 'Let’s find your level'}</h1>
    <p>${L ? `Your overall level, from everything you have played.${L.next?` You are ${L.pct}% of the way to ${esc(L.next)}.`:''}` : `Play any game. After ${P.CAL} answers in a topic, your level appears here.`}</p>
    ${L?`<span class="g-bar p-bar" aria-hidden="true"><i style="width:${L.pct}%"></i></span>`:''}
  </section>
  ${stats}
  <div class="p-grid">
    <section class="p-box" aria-labelledby="pPtsH"><h2 id="pPtsH">Points</h2><div class="pts-cards">${ptsCard('en','English')}${ptsCard('zh','Chinese version 中文版')}</div></section>
    <section class="p-box" aria-labelledby="pDaysH"><h2 id="pDaysH">Points, last 14 days</h2>${chart}</section>
  </div>
  <section class="p-topics" aria-labelledby="pTopH"><h2 id="pTopH" class="p-h">Your subjects</h2>
    <div class="prog-list">${list.length?list.map(row).join(''):'<p class="notice">No games played yet on this device.</p>'}</div></section>
  ${how}
  <p class="p-note">${note}</p>`, 'My progress', 'progress');
  frame(NEW_UI ? null : back, `
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
  <p class="hint" style="margin-top:22px">${loggedIn()?'Your progress is saved to your account, so it is the same on every device you log in on.':'Progress is saved in this browser on this device. Clearing browsing data, or using another computer, starts again. Log in to keep it in your account.'}</p>`, 'My progress');
}

// My progress opened from the Chinese side (stage 4, 8 Nov 2026): the new-look page, in both languages (the English / 中文
// switch shows one). The figures are the same as on the English page (progressPage works them out).
function progressZh({list, answers, right, known, learning, streak, L, PT, fmt}){
  const lvT=x=>T(nameHtml(x.name), x.zh||nameHtml(x.name));
  const ptsCard=(side,label)=>{ const t=PT?PT.totals(side):{};
    return `<div class="pts-card"><p class="pts-card-k">${label}</p><div class="pts-nums">${[['s','this session','本次'],['d','today','今天'],['w','this week','本周'],['m','this month','本月'],['t','total','总计']]
      .map(([k,l,z])=>`<div${k==='t'?' class="pts-total"':''}><b>${fmt(t[k])}</b><span>${T(l, z)}</span></div>`).join('')}</div>
      ${PT?(()=>{ const goal=PT.WEEKLY_TARGET, w=t.w||0; return `<p class="pts-goal">${w>=goal?T(`<b>Weekly target reached!</b> ${fmt(w)} of ${goal} points`, `<b>本周目标达成！</b>${fmt(w)} / ${goal} 积分`):T(`This week: ${fmt(w)} of ${goal} points · ${fmt(goal-w)} to go`, `本周：${fmt(w)} / ${goal} 积分 · 还差 ${fmt(goal-w)}`)}</p><span class="lvl-bar"><i style="width:${Math.min(100,100*w/goal)}%"></i></span>`; })():''}</div>`; };
  const days=PT?PT.lastDays(14):[], pmax=Math.max(1,...days.map(x=>x.en+x.zh));
  const chart=`<div class="days pts-days" role="img" aria-label="${TX('Points per day over the last 14 days','最近 14 天每天的积分')}">${days.map(x=>{ const tot=x.en+x.zh;
      return `<span class="pcol${tot?'':' zero'}" title="${x.date.toDateString()}: ${x.en} English, ${x.zh} 中文版"><i class="zh" style="height:${100*x.zh/pmax}%"></i><i class="en" style="height:${100*x.en/pmax}%"></i></span>`; }).join('')}</div>
    <p class="legend"><span class="sw en"></span>${T('English','英文版')} <span class="sw zh"></span>${T('Chinese version','中文版')}</p>`;
  const how=`<details class="pts-how"><summary>${T('How to earn points','如何获得积分')}</summary>
    <ul><li>${T('Only right answers earn points. Harder levels and longer tasks earn more.','只有答对才得分。级别越高、任务越长，得分越多。')}</li>
      <li>${T(`Every ${PT?PT.DOCK_EVERY:5} wrong answers take 1 point off (never below 0 for the day).`, `每答错 ${PT?PT.DOCK_EVERY:5} 题扣 1 分（每天最低为 0）。`)}</li>
      <li>${T('A reading passage’s points are shared between its questions.','一篇阅读文章的积分分摊到它的每道题。')}</li>
      <li>${T('English and Chinese version points are counted separately. The week starts on Monday.','英文版和中文版的积分分开计算。每周从星期一开始。')}</li>
      <li>${T(`Weekly target: ${PT?PT.WEEKLY_TARGET:200} points.`, `每周目标：${PT?PT.WEEKLY_TARGET:200} 积分。`)}</li></ul>
    <div class="pts-table-wrap"><table class="pts-table"><thead><tr><th>${T('Task','任务')}</th>${Object.keys(LEVEL_NAMES).map(c=>`<th>${T(esc(LEVEL_NAMES[c]), LEVEL_ZH[c])}</th>`).join('')}</tr></thead>
      <tbody>${POINT_KINDS.map(([k,label])=>`<tr><td>${T(esc(label), esc(POINT_KINDS_ZH[k]||label))}</td>${POINTS[k].map(n=>`<td>${n}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
  const row=t=>{ const found=t.n>=P.CAL, l=found?P.label(t.r):null, w=t.words, pct=t.n?Math.round(100*t.right/t.n):0;
    return `<a class="prog-row" href="${esc(t.href||'#')}"><span class="prog-name">${t.side==='zh' ? nameT(t.name) : esc(t.name)}<small>${t.side==='zh'?'中文版':'English'}</small></span>
      <span class="prog-lvl">${found?`<b>${lvT(l)}</b>`:T(`Finding level · ${t.n} of ${P.CAL}`, `正在评估 · ${t.n} / ${P.CAL}`)}</span>
      <span class="lvl-bar"><i style="width:${found?l.pct:t.n*100/P.CAL}%"></i></span>
      <span class="prog-meta">${T(`${w&&w.total?`${w.known} of ${w.total} words known · `:''}${t.n} answer${t.n===1?'':'s'} · ${pct}% right${t.pts?` · ${fmt(t.pts)} points`:''}`,
        `${w&&w.total?`已掌握 ${w.known} / ${w.total} 个单词 · `:''}作答 ${t.n} 次 · 答对 ${pct}%${t.pts?` · ${fmt(t.pts)} 积分`:''}`)}</span></a>`; };
  const stats=`<div class="stat-tiles"><div class="stat"><b>${answers}</b><span>${T('answers','次作答')}</span></div><div class="stat"><b>${answers?Math.round(100*right/answers):0}%</b><span>${T('right','答对率')}</span></div>
    <div class="stat"><b>${streak}</b><span>${T(`day${streak===1?'':'s'} in a row`, '天连续')}</span></div><div class="stat"><b>${known}</b><span>${T(`words known · ${learning} learning`, `个单词已掌握 · ${learning} 个学习中`)}</span></div></div>`;
  const note=loggedIn()?T('Your progress is saved to your account, so it is the same on every device you log in on.','你的进步保存在你的账号里，在任何设备上登录都一样。')
    :T('Progress is saved in this browser on this device. Clearing browsing data, or using another computer, starts again. Log in to keep it in your account.','进步保存在这台设备的浏览器里。清除浏览数据或换一台电脑，就会从头开始。登录后可以保存在你的账号里。');
  frame(null, `
  <section class="hero p-head"><p class="g-eyebrow">${T('My progress','我的进步')}</p>
    <h1>${L ? lvT(L) : T('Let’s find your level','来看看你的水平')}</h1>
    <p>${L ? T(`Your overall level, from everything you have played.${L.next?` You are ${L.pct}% of the way to ${esc(L.next)}.`:''}`, `你的总体水平，来自你玩过的所有游戏。${L.next?`距离${L.nextZh}还有 ${100-L.pct}%。`:''}`)
      : T(`Play any game. After ${P.CAL} answers in a topic, your level appears here.`, `玩任何一个游戏。在一个主题里答 ${P.CAL} 题后，你的水平就会显示在这里。`)}</p>
    ${L?`<span class="g-bar p-bar" aria-hidden="true"><i style="width:${L.pct}%"></i></span>`:''}
  </section>
  ${stats}
  <div class="p-grid">
    <section class="p-box" aria-labelledby="pPtsH"><h2 id="pPtsH">${T('Points','积分')}</h2><div class="pts-cards">${ptsCard('zh',T('Chinese version','中文版'))}${ptsCard('en',T('English','英文版'))}</div></section>
    <section class="p-box" aria-labelledby="pDaysH"><h2 id="pDaysH">${T('Points, last 14 days','最近 14 天的积分')}</h2>${chart}</section>
  </div>
  <section class="p-topics" aria-labelledby="pTopH"><h2 id="pTopH" class="p-h">${T('Your subjects','你的科目')}</h2>
    <div class="prog-list">${list.length?list.map(row).join(''):`<p class="notice">${T('No games played yet on this device.','这台设备上还没有游戏记录。')}</p>`}</div></section>
  ${how}
  <p class="p-note">${note}</p>`, {label:'My progress', zh:'我的进步'}, 'progress');
}
const loggedIn = () => { try{ const a=window.AEA_ACCOUNT && AEA_ACCOUNT.account(); return !!(a && a.token); }catch(e){ return false; } };

// ---------- WORD LIST ----------
function wordList(){
  const zh=SIDE==='zh';
  const head=NEW_UI && zh ? `<div class="g-head"><div class="g-title"><p class="g-eyebrow">${nameT(CFG.name||'')}</p><h1>${T('Word list','词汇表')}</h1><p class="g-hint">${T('Every word in this subject, with its Chinese, its meaning and an example. Your level comes first.','这个科目的所有单词，附中文、英文释义和例句。你的级别排在最前面。')}</p></div></div>`
    : NEW_UI ? `<div class="g-head"><div class="g-title"><p class="g-eyebrow">${esc(CFG.name||'')}</p><h1>Word list</h1><p class="g-hint">Every word in this subject, with its meaning and an example. Your level comes first.</p></div></div>`
    : `<div class="bar"><span class="title">${T('Word list','词汇表')}</span></div>`;
  frame({href:'#', label:CFG.name||'Back', html:SIDE==='zh'&&CFG.name?nameT(CFG.name):''}, `${head}
    <input class="search" id="q" type="search" placeholder="${TX('Search words or meanings','搜索单词或释义')}" aria-label="${TX('Search the word list','搜索词汇表')}"><div id="list"></div>`, zh ? {label:'Word list', zh:'词汇表'} : 'Word list', NEW_UI ? 'list' : undefined);
  let q='';
  const draw=()=>{ const t=q.trim().toLowerCase(); let html='';
    // One heading per level, the chosen level first
    const order=[chosenBand(), ...LEVELS.filter(b=>b!==chosenBand()), null].filter((b,i,a)=>a.indexOf(b)===i);
    for(const lb of order){ const ws=S.words.filter(w=>(playBand(w)??null)===lb && (!t||w.w.toLowerCase().includes(t)||w.def.toLowerCase().includes(t)||(w.syn||[]).some(x=>x.includes(t))||(ZH[w.id]||'').includes(t)));
      if(!ws.length) continue;
      const chosen=lb===chosenBand()&&LEVELS.length>1;
      const head=lb==null ? (LEVELS.length?T('Other words','其他单词'):'') : T(esc(bandName(lb))+(chosen?' · chosen level':''), LEVEL_ZH[LEVEL_CODES[lb]]+(chosen?' · 当前级别':''));
      html+=`${head?`<p class="instr" style="margin:22px 0 8px">${head}</p>`:''}<div class="wl">${ws.map(w=>`<div class="wl-row">
        <div class="w">${esc(w.w)}${w.pos?`<small>${esc(w.pos)}</small>`:''}${ZH[w.id]&&CFG.only==='zh'?`<span class="zh" lang="zh-CN">${esc(ZH[w.id])}</span>`:''}${NEW_UI?(()=>{ const st=stageOf(w), x=STAGES.find(x=>x[0]===st)||[]; return `<span class="fc-stage st-${st}">${T(x[1], x[2])}</span>`; })():''}</div>
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
// Since 1 Nov 2026 the Daily Circuit is quick-fire (kind 'short': QF_GAMES, a new game every three answers, see QF_…) and
// arcade (DC_ARCADE: Word Snake, Whack-a-word, Word Invaders, Save the mouse; two different ones per circuit). The rules
// above for short/long stations are still how class games choose their games.
// 8 Nov 2026 (teacher: "Match the Meaning… can get a full round… it needs longer to be really enjoyed"): the middle
// station is a whole minute of Match the meaning (kind 'match'). No subject has it ready: the station is quick-fire.
// Leaving the page or the game pauses the station; coming back with #circuit carries on with the time that was left.
const CIRCUIT_ARCADE = ['invaders', 'whack'];   // class games' arcade stations (Word Snake left out, teacher, 25 Oct)
// Daily Circuit arcade stations (1 Nov 2026, teacher): two different ones per circuit, taking turns from circuit to circuit
const DC_ARCADE = {en:['snake','whack','invaders','mouse'], zh:['snake','whack','invaders','zhmouse']};
const ZH_CIRCUIT = {short:['zhtf'], long:['zhtype','zhbuild','zhmatch','zhmean','zhevidence']};
let ccTick = null;
function circuitGames(kind){
  if(kind==='quick'){   // Daily Circuit quick-fire: the games that are ready here, in QF_GAMES
    const keys=QF_GAMES[SIDE==='zh'?'zh':'en'];
    if(SIDE==='zh') return ZH_GAMES.filter(g=>keys.includes(g.key) && zhReady(g)).map(g=>({key:g.key, name:g.name, zh:g.zh, run:g.run}));
    return GAMES.filter(g=>keys.includes(g.key) && !HIDE.has(g.key) && !phoneOff(g) && g.items().length>=g.min).map(g=>({key:g.key, name:g.name, run:g.run})); }
  if(kind==='match'){   // Daily Circuit Match round: Match the meaning (zhmatch on the Chinese side), when it is ready here
    if(SIDE==='zh') return ZH_GAMES.filter(g=>g.key==='zhmatch' && zhReady(g)).map(g=>({key:g.key, name:g.name, zh:g.zh, run:g.run}));
    return GAMES.filter(g=>g.key==='match' && !HIDE.has(g.key) && !phoneOff(g) && g.items().length>=g.min).map(g=>({key:g.key, name:g.name, run:g.run})); }
  if(kind==='dcarcade'){   // Daily Circuit arcade: the four arcade games (Save the mouse among them) that are ready here
    const keys=DC_ARCADE[SIDE==='zh'?'zh':'en'];
    if(SIDE==='zh') return zhWords().length>=4 ? [...ARCADE, ...ZH_GAMES].filter(g=>keys.includes(g.key) && (ARCADE.includes(g) || zhReady(g))).map(g=>({key:g.key, name:g.name, zh:g.zh, run:g.run})) : [];
    return [...ARCADE, ...GAMES].filter(g=>keys.includes(g.key) && !HIDE.has(g.key) && g.items().length>=g.min).map(g=>({key:g.key, name:g.name, run:g.run})); }
  if(SIDE==='zh'){
    if(kind==='arcade') return zhWords().length>=4 ? ARCADE.filter(g=>CIRCUIT_ARCADE.includes(g.key)).map(g=>({key:g.key, name:g.name, zh:g.zh, run:g.run})) : [];
    // short is only asked for by class games (the Daily Circuit uses quick); on a science page it includes the rule-made
    // games, as on the English version (7 Nov 2026)
    const keys=kind==='short' ? [...ZH_CIRCUIT.short, ...GEN_ZH.map(g=>g.key)] : ZH_CIRCUIT[kind]||ZH_CIRCUIT.short;
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
  const st=(C.station && C.station()) || {}, kind=st.kind||null, quick=kind==='short';
  const games=circuitGames(quick ? 'quick' : kind==='arcade' ? 'dcarcade' : kind);
  let cur=run.cur; qf=null;
  if(cur && C.norm(cur.path)===C.norm(PAGE) && (quick ? cur.game==='quick' && games.length : games.some(g=>g.key===cur.game))) cur=C.resume();
  else {
    if(!games.length){ inCircuit=false;
      if(kind==='long' || kind==='arcade' || kind==='match' || SIDE==='zh' && kind==='short'){   // try another of their subjects for this station, or make it a short game
        const next=C.retryStation(PAGE);
        if(next===null && kind==='short') return C.skipTopic(PAGE);   // Chinese side: no True or false in any subject
        if(!next) return;
        if(C.norm(next)===C.norm(PAGE)) return circuitStation();
        location.href=ROOT+next+'#circuit'; return; }
      return C.skipTopic(PAGE); }   // nothing ready here: another of their subjects instead
    let g;
    if(quick) g={key:'quick', name:'Quick-fire', zh:'快速答题'};
    else if(kind==='arcade'){   // this circuit's turn in the list; never the arcade game already played in this circuit
      const list=DC_ARCADE[SIDE==='zh'?'zh':'en'], at=((st.arcade||0)*2+(st.slot||0))%list.length, played=run.results.map(r=>r.game);
      const order=[...list.slice(at), ...list.slice(0, at)].map(k=>games.find(x=>x.key===k)).filter(Boolean);
      g=order.find(x=>!played.includes(x.key)) || order[0]; }
    else { const played=run.results.map(r=>r.game), fresh=games.filter(x=>!played.includes(x.key)), from=fresh.length ? fresh : games;
      g=from[Math.floor(Math.random()*from.length)]; }
    cur=C.begin({path:PAGE, topic:CFG.name||'', game:g.key, name:g.name, zh:g.zh||''});
  }
  circuitBar(cur);
  if(quick){ qf={pool:games, game:null, n:0, recent:[], round:0, mustAt:S.must.length ? Math.floor(Math.random()*3) : -1}; return qfSwitch(); }
  games.find(g=>g.key===cur.game).run();
}
function stopCircuitBar(){
  if(ccTick){ clearInterval(ccTick); ccTick=null; }
  ['ccBar','ccOver'].forEach(id=>{ const el=document.getElementById(id); if(el) el.remove(); });
  document.body.classList.remove('in-circuit');
}
function leaveCircuit(){ qf=null; if(inCircuit){ inCircuit=false; if(window.AEA_CIRCUIT) AEA_CIRCUIT.pause(PAGE); } stopCircuitBar(); }
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
  qf=null;
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
  let n=3, gone=false, cd=null;
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
  frame({href:'../index.html', label:'', html:T('All topics','所有主题')}, `<section class="cg-panel">${html}</section>`, 'Class game');
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
  if(g.status==='playing' && !sylNone()) return classBegin(id);
  classIntro(g, id);
}
// The start panel. Science pages (7 Nov 2026): the games use only the topics the student has ticked, so "Your topics" sits
// above Start (open while nothing is ticked) and Start waits until at least one topic is ticked. Without this a student
// who had never opened the page would get "No game at your level here".
function classIntro(g, id){
  const name=T(esc(g.name), esc(g.zh||g.name)), noTopics=sylNone(), playing=g.status==='playing';
  const per=Math.round(g.minutes*60/CLASS_PLAN.length), perTxt=per%60 ? `${per} seconds` : `${per/60} minute${per===60?'':'s'}`, perZh=per%60 ? `${per} 秒` : `${per/60} 分钟`;
  classPanel(`<p class="cg-k">${T('Class game','课堂游戏')}${g.status==='below'?' · '+T('Play again','再玩一次'):''}</p><h1>${name}</h1>
    <ul class="cg-facts"><li><b>${T(`${g.minutes} minute${g.minutes===1?'':'s'}`, `${g.minutes} 分钟`)}</b>: ${T(`five games of ${perTxt} each, at your level.`, `五个游戏，每个 ${perZh}，难度适合你。`)}</li>
      <li><b>+1</b> ${T('for each right answer,','答对一题加 1 分，')} <b>−1</b> ${T('for each wrong one.','答错一题减 1 分。')}</li>
      ${g.minScore?`<li>${T(`Score needed: <b>${g.minScore}</b>.`, `目标分数：<b>${g.minScore}</b>。`)}</li>`:''}
      ${g.status==='below'?`<li>${T(`Last time: <b>${g.score}</b>.`, `上一次：<b>${g.score}</b> 分。`)}</li>`:''}
      <li>${T('The clock starts when you press Start and doesn’t stop, even if you leave the page.','按“开始”后计时开始，离开页面也不会停。')}</li></ul>
    ${SYL ? `<div class="cg-syl">${sylPicker()}</div>` : ''}
    <p class="cg-actions"><button class="btn big" type="button" id="cgGo"${noTopics?' disabled':''}>${playing ? T('Carry on','继续') : T('Start','开始')} →</button></p><p class="cg-err" id="cgErr" hidden></p>`);
  wireSyl(()=>classIntro(g, id));
  const go=document.getElementById('cgGo'); if(!noTopics) go.focus({preventScroll:true});
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
// The last game opened on this topic page, for the home page's "Continue: …" button (redesign stage 1, 8 Nov 2026).
// Topic pages only (English, and the Chinese version's since stage 4: with the game's Chinese name, zh), not in the Daily
// Circuit or a class game. Saved in aea:lastgame:v1 = {"en/web-design/index.html": {key, name, t}, "zh/…": {key, name, zh, t}}.
function lastGame(key, name, zh){
  if((SIDE==='en' ? CFG.only : CFG.only!=='zh') || inCircuit || classRun) return;
  const pg=/\/$/.test(PAGE) ? PAGE+'index.html' : PAGE;   // (the address without index.html: saved under the subject list's path)
  try{ const k='aea:lastgame:v1', m=JSON.parse(localStorage.getItem(k))||{}; m[pg]=zh ? {key, name, zh, t:Date.now()} : {key, name, t:Date.now()}; localStorage.setItem(k, JSON.stringify(m)); }catch(e){}
}
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
    const msg = readingState==='loading' ? `Loading ${what}…`
      : readingState==='failed' ? `The ${what} could not be loaded. They load when the site is online.`
      : !(S.passages||[]).length ? `No ${what} yet. Check back soon.` : '';
    if(msg) return frame(back, `<section class="hero"><p class="eyebrow">${esc(CFG.eyebrow||'Reading')}</p><h1>${esc(CFG.name||'')}</h1>${CFG.blurb?`<p>${esc(CFG.blurb)}</p>`:''}<p class="notice">${msg}</p></section>`, CFG.name);
    if(CFG.format==='notes') return playNotes();
    if(CFG.format==='recall') return playRecall();
    if(CFG.format==='totalrecall') return playTotalRecall();
    if(listen) return playListening();
    GAMES.find(g=>g.key==='passage').name = CFG.name || 'Read and answer';
    return playPassage();
  }
  // #play-must: the must-know questions on their own (not on any menu; a link to try them, 1 Nov 2026)
  if(h==='play-must' && S.must.length) return MUST_GAME.run();
  if(CFG.only==='zh'){
    if(h==='words') return wordList();
    if(h==='learn') return zhLevelWords().length>=4 ? playLearn() : zhMenu();
    const g=h==='play-snake' ? ZH_SNAKE : ZH_GAMES.find(x=>'play-'+x.key===h);
    if(g && zhReady(g)){ lastGame(g.key, g.name, g.zh); return g.run(); }
    return zhMenu();
  }
  if(!h) return menu();
  if(h==='words') return wordList();
  if(CATS[h]) return category(h);
  if(h.startsWith('play-')){
    const a=ARCADE.find(x=>x.key===h.slice(5));   // arcade games (not on the menu yet)
    if(a){ if(a.items().length<a.min) return menu(); lastGame(a.key, a.name); return a.run(); }
    const g=GAMES.find(x=>x.key===(h==='play-syn'?'match':h.slice(5)));   // Synonym groups is now part of Match the meaning
    if(g && !HIDE.has(g.key) && !phoneOff(g) && g.items().length>=g.min){ lastGame(g.key, g.name); return g.run(); }
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
