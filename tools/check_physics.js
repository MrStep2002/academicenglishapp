// Physics (4 Nov 2026): checks every question en/engine/phys.js makes from content/physics/. Run from the repository folder:
//   node tools/check_physics.js              (problems, and how many questions each game has at each level)
//   node tools/check_physics.js . --sample   (a few questions from each game)
//   node tools/check_physics.js . --dump questions.md   (every question, for checking)
// Every calculation's answer is worked out again here from the values in the question, with its own equations and unit
// conversions, and compared with the answer the game gives; it also checks there are three different wrong answers, each
// with a reason in English and Chinese, a syllabus code that is one of the topics, and the decay products.
const fs=require('fs'), path=require('path'), vm=require('vm');
const ROOT=process.argv[2]||'.';
function parseCSV(text){ const rows=[]; let row=[], cell='', q=false; text=text.replace(/^﻿/,'');
  for(let i=0;i<text.length;i++){ const c=text[i];
    if(q){ if(c==='"'){ if(text[i+1]==='"'){ cell+='"'; i++; } else q=false; } else cell+=c; }
    else if(c==='"') q=true; else if(c===','){ row.push(cell); cell=''; }
    else if(c==='\n'||c==='\r'){ if(c==='\r'&&text[i+1]==='\n') i++; row.push(cell); rows.push(row); row=[]; cell=''; } else cell+=c; }
  if(cell!==''||row.length){ row.push(cell); rows.push(row); }
  const head=rows.shift().map(h=>h.trim().toLowerCase());
  return rows.filter(r=>r.some(x=>x.trim())).map(r=>Object.fromEntries(head.map((h,i)=>[h,(r[i]||'').trim()]))); }
const T={}; ['quantities','waves','em-uses','nuclides'].forEach(f=>{ T[f]=parseCSV(fs.readFileSync(path.join(ROOT,'content/physics',f+'.csv'),'utf8')); });
const ctx={window:{}, document:{getElementById:()=>({dataset:{}})}, console};
vm.runInNewContext(fs.readFileSync(path.join(ROOT,'en/engine/phys.js'),'utf8'), ctx);
const G=ctx.window.AEA_GEN, games=G.build(T);
const problems=[], say=(q,m)=>problems.push(`${q.id}: ${m}`);
const topics=new Set(G.topics.map(t=>t.n));
const strip=h=>String(h).replace(/<[^>]+>/g,'');
const numOf=s=>{ const m=strip(s).replace(/ /g,'').replace(/−/g,'-').match(/^-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : NaN; };
const unitOf=s=>strip(s).replace(/ /g,'').replace(/^−?-?\d+(\.\d+)?\s*/,'').replace(/ /g,'').trim();
const F={m:1,km:1000,cm:0.01,s:1,min:60,kg:1,g:0.001,'g/cm³':1000,'cm³':1e-6,mA:0.001};
const si=([v,u])=>v*(F[u]??1);
// The equations, written again here: A = f(B, C) and how to get B and C back
const DIV=(A,B,C)=>({A:B/C, B:A*C, C:B/A}), MUL=(A,B,C)=>({A:B*C, B:A/C, C:A/B});
const KIND={speed:DIV, weight:MUL, density:DIV, moment:MUL, work:MUL, power:DIV, pressure:DIV, wave:MUL, resistance:DIV, epower:MUL, accel:DIV, force:MUL, spring:DIV, momentum:MUL, current:DIV, pdq:DIV};
const SPECIAL={
  eivt:g=>si(g.current)*si(g.pd)*si(g.time), transformer:g=>g.Vp[0]*g.Ns[0]/g.Np[0], kelvin:g=>g.temperature[0]+273, celsius:g=>g.thermo[0]-273,
  ke:g=>0.5*g.mass[0]*g.speed[0]**2, gpe:g=>g.mass[0]*g.gfs[0]*si(g.distance), eff:g=>g.out[0]/g.in[0]*100, liquid:g=>g.density[0]*g.gfs[0]*g.distance[0],
  pv:g=>g.p1[0]*g.V1[0]/g.V2[0], shc:g=>g.mass[0]*g.shc[0]*(g.t2[0]-g.t1[0]), i2r:g=>g.current[0]**2*g.resistance[0], vi:g=>g.Vp[0]*g.Ip[0]/g.Vs[0],
  accel2:g=>(g.v[0]-g.u[0])/g.time[0], halflife:g=>g.c0[0]/2**(g.t[0]/g.half[0]), halflife2:g=>g.t[0]/Math.log2(g.c0[0]/g.c[0])};
const counts={};
games.forEach(g=>{ counts[g.key]={n:g.items.length, lv:{}, ext:0};
  g.items.forEach(q=>{ counts[g.key].lv[q.level]=(counts[g.key].lv[q.level]||0)+1; if(q.ext) counts[g.key].ext++;
    if(q.wrong.length<3) say(q,'fewer than 3 wrong answers');
    const hs=q.wrong.map(w=>w.h); if(new Set(hs).size!==hs.length) say(q,'repeated wrong answer'); if(hs.includes(q.answer)) say(q,'answer among the wrong ones');
    const all=[q.html,q.zh,q.answer,q.instr,q.instrZh,...q.wrong.flatMap(w=>[w.h,w.why,w.whyZh])].join(' ');
    if(/\bNaN\b|undefined|Infinity|\?\s*(m|s|kg|N|J|W)\b|\{[ABC]\}|null/.test(all)) say(q,'bad text: '+all.match(/\bNaN\b|undefined|Infinity|\{[ABC]\}|null/));
    q.wrong.forEach(w=>{ if(!w.why || !w.whyZh) say(q,'a wrong answer has no reason: '+w.h); });
    (q.syl||[]).forEach(c=>{ if(![...topics].some(t=>c===t || c.startsWith(t+'.'))) say(q,'syllabus code not a topic: '+c); });
    if(!(q.syl||[]).length) say(q,'no syllabus code');
    if(q.meta){ const m=q.meta; let want;
      if(KIND[m.eq]){ const v={}; Object.entries(m.given).forEach(([k,x])=>{ v[k]=si(x); }); const r=KIND[m.eq](v.A,v.B,v.C)[m.find]; want=r/(F[m.answer[1]]??1); }
      else if(SPECIAL[m.eq]) want=SPECIAL[m.eq](m.given);
      else say(q,'no check for '+m.eq);
      const got=numOf(q.answer), u=unitOf(q.answer);
      if(want!=null && !(Math.abs(got-want)<=Math.abs(want)*0.006+1e-9)) say(q,`answer ${q.answer} but the check gives ${want}`);
      if(u!==String(m.answer[1]).replace(/ /g,'') && !(m.answer[1]==='%' && u==='%') && !['h','days','min','s','years'].includes(m.answer[1])) say(q,`unit ${u} vs ${m.answer[1]}`);
      // every given number in the question is clean (no more than 3 decimals)
      Object.values(m.given).forEach(([x])=>{ if(Math.abs(x*1000-Math.round(x*1000))>1e-6) say(q,'untidy given value '+x); });
      q.wrong.forEach(w=>{ const n=numOf(w.h); if(!isFinite(n)) say(q,'wrong answer not a number: '+w.h); });
    }
  }); });
// Decay: check the daughters independently
const SYM={6:'C',7:'N',19:'K',20:'Ca',27:'Co',28:'Ni',38:'Sr',39:'Y',53:'I',54:'Xe',55:'Cs',56:'Ba',82:'Pb',84:'Po',86:'Rn',88:'Ra',90:'Th',91:'Pa',92:'U',93:'Np',94:'Pu',95:'Am'};
const DAUGHTER={c14:[14,7,'N'],k40:[40,20,'Ca'],co60:[60,28,'Ni'],sr90:[90,39,'Y'],i131:[131,54,'Xe'],cs137:[137,56,'Ba'],po210:[206,82,'Pb'],rn222:[218,84,'Po'],ra226:[222,86,'Rn'],th234:[234,91,'Pa'],u235:[231,90,'Th'],u238:[234,90,'Th'],pu239:[235,92,'U'],am241:[237,93,'Np']};
games.find(g=>g.key==='phnuc').items.filter(q=>q.id.startsWith('phys:nuc:decay:')).forEach(q=>{ const id=q.id.split(':').pop(), d=DAUGHTER[id];
  const t=strip(q.answer); if(!d || t!==`${d[0]}${d[1]}${d[2]}`) say(q,`daughter ${t} expected ${d}`); });
console.log('Games:'); Object.entries(counts).forEach(([k,c])=>console.log(`  ${k}: ${c.n} (${c.ext} Extended) levels ${JSON.stringify(c.lv)}`));
console.log(problems.length ? problems.length+' problem(s):\n'+problems.slice(0,60).join('\n') : 'No problems.');
if(process.argv[3]==='--sample'){ games.forEach(g=>{ console.log('\n=== '+g.name); const step=Math.max(1,Math.floor(g.items.length/6)); g.items.filter((_,i)=>i%step===0).slice(0,7).forEach(q=>{
  console.log(`- [${q.level}${q.ext?' ext':''} ${q.syl.join(',')}] ${q.instr} | ${strip(q.html)} | ${strip(q.zh)}\n    ✓ ${strip(q.answer)}\n    ✗ ${q.wrong.slice(0,4).map(w=>strip(w.h)+' ('+w.p+') — '+strip(w.why)).join('\n    ✗ ')}`); }); }); }
if(process.argv[3]==='--dump'){ const out=games.map(g=>`## ${g.name} (${g.items.length})\n\n`+g.items.map(q=>`- [${q.level}${q.ext?', Extended':''}; ${q.syl.join(', ')}] **${strip(q.instr)}** ${strip(q.html).replace(/\s+/g,' ')} → **${strip(q.answer)}**. Wrong (likeliest first): ${[...q.wrong].sort((a,b)=>a.p-b.p).slice(0,4).map(w=>strip(w.h)).join(' · ')}${q.wrong.length>4 ? ` (+${q.wrong.length-4} more)` : ''}`).join('\n')).join('\n\n');
  fs.writeFileSync(process.argv[4], out); console.log('written', process.argv[4]); }
