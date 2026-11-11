// Chemistry: questions made by rules, not written one by one (Science, 3 Nov 2026).
// Loaded before app.js on the chemistry pages only (en/chemistry/, zh/chemistry/). It sets window.AEA_GEN, which app.js
// reads ("GENERATED GAMES" there). Other pages don't load this file, so nothing changes for them.
//
// Every question comes from three tables in content/science/chemistry/ that a science teacher can check in a spreadsheet:
//   ions.csv       the ions: charge, English and Chinese names, the names students mix them up with, and the
//                  compounds that don't exist (not_with / only_with)
//   elements.csv   elements 1-20 and a few more: symbol, names, mass numbers, group, usual ion
//   reactions.csv  what reacts with which acid in What's made?
// The wrong answers are real mistakes, each with its reason in English and Chinese (shown after a wrong answer).
// Item ids (chem:name:na-so4) are fixed by the tables, so progress and reports stay with the same question.
(function(){
'use strict';
const ZH_SIDE = ((document.getElementById('app')||{}).dataset||{}).only==='zh';
const esc = s => String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const MINUS = '−';
const listOf = v => String(v||'').split(';').map(s=>s.trim()).filter(Boolean);
const sub = s => esc(s).replace(/(\d+)/g,'<sub>$1</sub>');                     // SO4 → SO<sub>4</sub>
const chg = n => (Math.abs(n)>1 ? Math.abs(n) : '')+(n>0 ? '+' : MINUS);        // 2 → 2+, -1 → −
const ionH = (sym, n) => `${sub(sym)}<sup>${chg(n)}</sup>`;                        // SO4, -2 → SO₄²⁻
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
const cap = s => String(s).charAt(0).toUpperCase()+String(s).slice(1);
const s_ = n => n===1 ? '' : 's';
// Levels: the codes the rest of the site uses (A1 Foundation … C1 Advanced; + is the harder half). Here they are how hard
// the chemistry is: a compound's level comes from its ions, one step more for brackets, half a step for a 2:1 ratio…
const LV = {A1:1, A2:2, B1:3, B2:4, C1:5};
const lvNum = c => { const m=String(c||'').trim().toUpperCase().match(/^([ABC][12])(\+)?$/); return m ? LV[m[1]]+(m[2]?.5:0) : 3; };
const lvCode = n => { n=Math.max(1, Math.min(5.5, n)); const b=Math.floor(n); return ['','A1','A2','B1','B2','C1'][b]+(n-b>=.5?'+':''); };
const gcd = (a,b) => b ? gcd(b, a%b) : a;
const poly = sym => (String(sym).match(/[A-Z]/g)||[]).length>1;   // an ion of more than one element: NH4, OH, SO4 …

// One question: id, level, syllabus codes, the instruction (English, Chinese), the prompt (HTML), the Chinese shown under it
// on the Chinese side, the answer (HTML) and the wrong answers, each {h: HTML, p: 1 = the likeliest mistake … 3 = filler,
// why / whyZh: the reason, shown after it is picked}. app.js deals three wrong answers, likeliest first.
const Q = (id, level, syl, instr, instrZh, html, zh, answer, wrong, long) => {
  const seen=new Set([answer]), w=wrong.filter(x=>x && x.h && !seen.has(x.h) && seen.add(x.h));
  return {id, level:lvCode(level), syl, instr, instrZh, html, zh, answer, wrong:w, long:!!long};
};
const W = (h, p, why, whyZh) => ({h, p, why, whyZh});

// ---------- the tables ----------
function readTables(T){
  const E=(T.elements||[]).map(r=>({z:+r.z, symbol:r.symbol, name:r.name, zh:r.zh, masses:listOf(r.mass).map(Number).filter(n=>n>0),
    group:r.group==='' ? null : +r.group, period:+r.period, kind:r.kind, ion:r.ion==='' ? null : +r.ion, level:lvNum(r.level)}))
    .filter(e=>{ const ok=e.z>0 && e.symbol && e.name && e.masses.length; if(!ok) console.warn('elements.csv: row skipped', e); return ok; });
  const elByName=Object.fromEntries(E.map(e=>[e.name, e]));
  const I=(T.ions||[]).map(r=>{ const charge=parseInt(r.charge,10), metal=r.kind==='cation' && !!elByName[r.element];
    return {id:r.id, lv:lvNum(r.level), kind:r.kind, symbol:r.symbol, charge, p:Math.abs(charge), q:Math.abs(charge), name:r.name, zh:r.zh, ionZh:r.ion_zh,
      element:r.element, elZh:(elByName[r.element]||{}).zh||'', mixups:listOf(r.mixups), not:listOf(r.not_with), only:listOf(r.only_with),
      ionH:ionH(r.symbol, charge), metal, variable:/\(/.test(r.name), base:String(r.name).replace(/\(.*\)$/,'')}; })
    .filter(x=>{ const ok=x.id && x.symbol && x.charge && x.name && (x.kind==='cation' ? x.charge>0 : x.kind==='anion' && x.charge<0); if(!ok) console.warn('ions.csv: row skipped', x); return ok; });
  const R=(T.reactions||[]).map(r=>({id:r.id, lv:lvNum(r.level), reactant:r.reactant, zh:r.zh, type:r.type, ion:r.ion, acids:listOf(r.acids)}))
    .filter(r=>{ const ok=r.id && r.reactant && ['metal','oxide','hydroxide','carbonate'].includes(r.type); if(!ok) console.warn('reactions.csv: row skipped', r); return ok; });
  return {E, I, R, ionById:Object.fromEntries(I.map(x=>[x.id, x])), anionByName:Object.fromEntries(I.filter(x=>x.kind==='anion').map(x=>[x.name, x]))};
}

// ---------- formulae ----------
const counts = (c, a) => { const l=c.p*a.q/gcd(c.p, a.q); return [l/c.p, l/a.q]; };   // Al³⁺ and O²⁻ → 2 and 3
// One ion in a formula: Na, Na2, (OH)2. br = brackets round a group of atoms when there is more than one of it
// (false: the mistake of leaving them out; true on a single atom: the mistake of adding them).
const part = (sym, n, br) => n===1 ? {t:sym, h:sub(sym)} : br ? {t:`(${sym})${n}`, h:`(${sub(sym)})<sub>${n}</sub>`} : {t:sym+n, h:`${sub(sym)}<sub>${n}</sub>`};
const fml = (cs, n1, as, n2, o) => { o=o||{}; const x=part(cs, n1, o.bc ?? poly(cs)), y=part(as, n2, o.ba ?? poly(as)); return {t:x.t+y.t, h:x.h+y.h}; };
const pairs = (c, a) => a.only.length ? a.only.includes(c.id) : !a.not.includes(c.id);
function compounds(D){
  const out=[], C=D.I.filter(x=>x.kind==='cation'), A=D.I.filter(x=>x.kind==='anion');
  C.forEach(c=>A.forEach(a=>{ if(!pairs(c, a)) return;
    const [n1, n2]=counts(c, a), br=(n1>1 && poly(c.symbol)) || (n2>1 && poly(a.symbol));
    out.push({c, a, n1, n2, F:fml(c.symbol, n1, a.symbol, n2), br, name:c.name+' '+a.name, zh:a.zh+c.zh,
      lv:Math.max(c.lv, a.lv)+(n1>1 || n2>1 ? .5 : 0)+(br ? 1 : 0)}); }));
  return out;
}
// The charges add up to zero: the reason under most formula mistakes
const balance = k => [
  `The charges must add up to zero: ${NUM[k.n1]} ${k.c.ionH} (+${k.n1*k.c.p}) and ${NUM[k.n2]} ${k.a.ionH} (${MINUS}${k.n2*k.a.q}) make ${k.F.h}.`,
  `电荷总和必须为零：${k.n1} 个 ${k.c.ionH}（+${k.n1*k.c.p}）和 ${k.n2} 个 ${k.a.ionH}（${MINUS}${k.n2*k.a.q}）组成 ${k.F.h}。`];
// -ide, -ate and -ite (and oxide / hydroxide / hydride) mixed up
function endingWhy(a, m, D){
  const sib=D.anionByName[m], also=sib ? [` ${cap(esc(m))} is ${sib.ionH}.`, `${esc(m)} 是 ${sib.ionH}。`] : ['', ''];
  if(a.name==='hydroxide' && m==='oxide') return [`${a.ionH} is hydroxide: oxygen and hydrogen together. Oxide is O<sup>2${MINUS}</sup> on its own.`, `${a.ionH} 是 hydroxide：氧和氢在一起。oxide 是单独的 O<sup>2${MINUS}</sup>。`];
  if(a.name==='hydroxide' && m==='hydride') return [`${a.ionH} is hydroxide: oxygen and hydrogen together. Hydride is H<sup>${MINUS}</sup> on its own.`, `${a.ionH} 是 hydroxide：氧和氢在一起。hydride 是单独的 H<sup>${MINUS}</sup>。`];
  if(a.name==='oxide' && m==='hydroxide') return [`${a.ionH} is oxide: oxygen on its own. Hydroxide is OH<sup>${MINUS}</sup>.`, `${a.ionH} 是 oxide：单独的氧。hydroxide 是 OH<sup>${MINUS}</sup>。`];
  const end=s=>(String(s).match(/(ide|ate|ite)$/)||[''])[0], e1=end(a.name), e2=end(m);
  const rule = e2==='ide' ? ['-ide means the element on its own, with no oxygen.', '-ide 表示单独的元素，不含氧。']
    : e1==='ide' ? ['It has no oxygen: -ate means the element is joined with oxygen.', '它不含氧：-ate 表示该元素和氧结合在一起。']
    : e2==='ite' ? ['-ite means one oxygen fewer than -ate.', '-ite 比 -ate 少一个氧。']
    : ['-ate means one oxygen more than -ite.', '-ate 比 -ite 多一个氧。'];
  return [`${a.ionH} is ${esc(a.name)}.${also[0]} ${rule[0]}`, `${a.ionH} 是 ${esc(a.name)}。${also[1]}${rule[1]}`];
}
// A metal that forms more than one ion: the wrong Roman numeral offered (iron: the other common ion)
const otherNumeral = c => ({Fe: c.p===2 ? 3 : 2, Cu: 1, Pb: 4, Cr: 2})[c.symbol] || (c.p===2 ? 3 : 2);

// ---------- Name it: see the formula, choose the name ----------
function nameIt(D, K){
  return K.map(k=>{ const {c, a, n1, n2, name}=k, w=[], add=(t, p, r)=>w.push(W(esc(t), p, r[0], r[1]));
    a.mixups.forEach(m=>add(c.name+' '+m, 1, endingWhy(a, m, D)));
    if(a.element) add(c.name+' '+a.element, 1, poly(a.symbol)
      ? [`${a.ionH} is the ${esc(a.name)} ion: the name says ${esc(a.name)}, not just ${esc(a.element)}.`, `${a.ionH} 是 ${esc(a.name)}（${esc(a.ionZh)}），名称要写 ${esc(a.name)}，不是 ${esc(a.element)}。`]
      : [`In a compound, ${esc(a.element)} becomes ${esc(a.name)}.`, `在化合物里，${esc(a.element)}（${esc(a.elZh)}）要变成 ${esc(a.name)}。`]);
    add(a.name+' '+c.name, ZH_SIDE ? 1 : 2, [`In English the ${c.metal ? 'metal' : 'positive ion'} comes first: ${esc(name)}.`,
      `英文名称${c.metal ? '金属' : '阳离子'}在前：${esc(name)}（中文正好相反：${esc(k.zh)}）。`]);
    if(c.variable){
      add(`${c.base}(${ROMAN[otherNumeral(c)]}) ${a.name}`, 1, [
        `${cap(NUM[n2])} ${a.ionH} (${MINUS}${n2*a.q}) balance${n2===1?'s':''} ${NUM[n1]} ${esc(c.base)} ion${s_(n1)}, so ${n1>1 ? 'each one' : 'it'} is ${c.ionH}: ${esc(c.name)}.`,
        `${n2} 个 ${a.ionH}（${MINUS}${n2*a.q}）抵消 ${n1} 个${esc(c.elZh)}离子，所以是 ${c.ionH}：${esc(c.name)}。`]);
      if(c.symbol==='Fe') add(`iron ${a.name}`, 1, ['Iron forms Fe<sup>2+</sup> and Fe<sup>3+</sup>, so its name needs a Roman numeral: iron(II) or iron(III).',
        '铁可以形成 Fe<sup>2+</sup> 和 Fe<sup>3+</sup>，所以英文名称要用罗马数字注明：iron(II) 或 iron(III)。']);
    }
    if(c.mixups.includes('ammonia')) add('ammonia '+a.name, 1, [`NH<sub>4</sub><sup>+</sup> is the ammonium ion. Ammonia is the gas NH<sub>3</sub>.`, `NH<sub>4</sub><sup>+</sup> 是 ammonium（铵根离子）；ammonia（氨）是气体 NH<sub>3</sub>。`]);
    return Q(`chem:name:${c.id}-${a.id}`, k.lv, ['2.4','3.1'], 'Name this compound', '选出这个化合物的英文名称',
      `<p class="gen-big">${k.F.h}</p>`, esc(k.zh), esc(name), w); });
}

// ---------- Formula it: see the name, choose the formula ----------
function formulaIt(D, K){
  const byPair=Object.fromEntries(K.map(k=>[k.c.id+'-'+k.a.id, k]));
  return K.map(k=>{ const {c, a, n1, n2, F}=k, w=[], add=(f, p, r)=>w.push(W(f.h, p, r[0], r[1]));
    if(n1>1 || n2>1) add(fml(c.symbol, 1, a.symbol, 1), 1, balance(k));                                   // NaSO4
    if(k.br) add(fml(c.symbol, n1, a.symbol, n2, {bc:false, ba:false}), 1, n2>1 && poly(a.symbol)
      ? [`${a.ionH} has more than one atom, so it goes in brackets before its number: ${F.h} has ${NUM[n2]} ${esc(a.name)} ions.`, `${a.ionH} 含多个原子，写个数前要加括号：${F.h} 里有 ${n2} 个${esc(a.ionZh)}。`]
      : [`${c.ionH} has more than one atom, so it goes in brackets before its number: ${F.h} has ${NUM[n1]} ${esc(c.name)} ions.`, `${c.ionH} 含多个原子，写个数前要加括号：${F.h} 里有 ${n1} 个${esc(c.ionZh)}。`]);   // CaOH2
    if(n1!==n2) add(fml(c.symbol, n2, a.symbol, n1), 1, balance(k));                                      // Al3O2
    if(!poly(a.symbol) && n2===1 && ['chlorine','bromine','iodine','fluorine','oxygen'].includes(a.element))    // NaCl2
      add(fml(c.symbol, n1, a.symbol, 2), 1, [`${cap(esc(a.element))} gas is ${sub(a.symbol)}<sub>2</sub>, but in a compound each ${esc(a.name)} ion is a single ${a.ionH}: ${F.h}.`,
        `${esc(a.elZh)}气是 ${sub(a.symbol)}<sub>2</sub>，但在化合物里每个${esc(a.ionZh)}只是一个 ${a.ionH}：${F.h}。`]);
    a.mixups.forEach(m=>{ const s=D.anionByName[m], k2=s && byPair[c.id+'-'+s.id]; if(k2) add(k2.F, 1,           // Na2SO3 for sodium sulfate
      [`${esc(a.name)} is ${a.ionH}; ${k2.F.h} is ${esc(k2.name)}.`, `${esc(a.name)} 是 ${a.ionH}；${k2.F.h} 是 ${esc(k2.name)}。`]); });
    if(c.variable){ const v=otherNumeral(c), [m1, m2]=counts({p:v}, a);                                    // FeCl3 for iron(II) chloride
      add(fml(c.symbol, m1, a.symbol, m2), 1, [`(${ROMAN[c.p]}) means ${c.ionH}, so you need ${NUM[n2]} ${a.ionH}: ${F.h}.`, `(${ROMAN[c.p]}) 表示 ${c.ionH}，所以需要 ${n2} 个 ${a.ionH}：${F.h}。`]); }
    if(!poly(a.symbol) && n2>1) add(fml(c.symbol, n1, a.symbol, n2, {ba:true}), 3,                        // Mg(Cl)2
      [`Brackets are only for ions with more than one atom. ${a.ionH} is a single atom: ${F.h}.`, `只有含多个原子的离子才加括号。${a.ionH} 只有一个原子：${F.h}。`]);
    [[2,1],[1,2],[2,3],[3,2],[1,3],[3,1]].forEach(([x,y])=>{ if(x!==n1 || y!==n2) add(fml(c.symbol, x, a.symbol, y), 3, balance(k)); });
    return Q(`chem:formula:${c.id}-${a.id}`, k.lv+.5, ['3.1'], 'Choose the formula', '选出化学式',
      `<p class="gen-big gen-name">${esc(k.name)}</p>`, esc(k.zh), F.h, w); });
}

// ---------- Ion charge: which ion does the element form? ----------
function ionCharge(D){
  const out=[];
  D.E.filter(e=>e.ion && e.group).forEach(e=>{ const q=e.ion, k=Math.abs(q), g=e.group, R=ROMAN[g], metal=q>0, right=ionH(e.symbol, q);
    const show=`<p class="gen-big gen-name">${esc(e.name)}</p><p class="gen-sub">Group ${R}</p>`, zh=`${esc(e.zh)} · 第 ${R} 族`;
    const why = metal ? [`Group ${R} atoms have ${NUM[g]} outer electron${s_(g)} to lose, so the ion is ${right}.`, `第 ${R} 族原子有 ${g} 个最外层电子可以失去，所以离子是 ${right}。`]
      : [`Group ${R} atoms gain ${NUM[8-g]} electron${s_(8-g)} for a full outer shell, so the ion is ${right}.`, `第 ${R} 族原子得到 ${8-g} 个电子使最外层排满，所以离子是 ${right}。`];
    const sign = metal ? [`Metal atoms lose electrons, so they form positive ions: ${right}.`, `金属原子失去电子，形成阳离子：${right}。`]
      : [`Non-metal atoms gain electrons, so they form negative ions: ${right}.`, `非金属原子得到电子，形成阴离子：${right}。`];
    const w=[W(ionH(e.symbol, -q), 1, ...sign)];
    if(!metal) w.push(W(ionH(e.symbol, -g), 1, `Group ${R} atoms have ${NUM[g]} outer electrons and gain ${NUM[8-g]} more, not ${g}: ${right}.`, `第 ${R} 族原子有 ${g} 个最外层电子，再得到 ${8-g} 个就排满了，不是 ${g} 个：${right}。`));
    [q+(metal?1:-1), q-(metal?1:-1), metal ? 8-g : -(8-g)-1].forEach(v=>{ if(v && Math.abs(v)<=7) w.push(W(ionH(e.symbol, v), 2, ...why)); });
    out.push(Q(`chem:ion:${e.symbol.toLowerCase()}`, e.level, ['2.4','8.1'], 'Which ion does it form?', '它形成什么离子？', show, zh, right, w));
    // The same idea in words: "loses two electrons"
    const verb=metal ? 'loses' : 'gains', other=metal ? 'gains' : 'loses', ans=`${verb} ${NUM[k]} electron${s_(k)}`;
    const w2=[W(`${other} ${NUM[k]} electron${s_(k)}`, 1, ...sign),
      W(`${other} ${NUM[8-k]} electron${s_(8-k)}`, 1, metal ? `It is easier to lose ${NUM[k]} than to gain ${NUM[8-k]}: ${esc(e.name)} ${ans}.` : `It is easier to gain ${NUM[k]} than to lose ${NUM[8-k]}: ${esc(e.name)} ${ans}.`,
        metal ? `失去 ${k} 个比得到 ${8-k} 个容易：${esc(e.zh)}失去 ${k} 个电子。` : `得到 ${k} 个比失去 ${8-k} 个容易：${esc(e.zh)}得到 ${k} 个电子。`),
      W(`shares ${NUM[k]} electron${s_(k)}`, 1, 'Sharing electrons makes a covalent bond, not an ion.', '共用电子形成的是共价键，不是离子。'),
      W(`${verb} ${NUM[k+1]} electrons`, 3, ...why)];
    if(k>1) w2.push(W(`${verb} one electron`, 3, ...why));
    out.push(Q(`chem:ionwords:${e.symbol.toLowerCase()}`, e.level+1.5, ['2.4','8.1'], 'When an atom of it forms an ion, it…', '它的原子形成离子时会……', show, zh, ans, w2));
  });
  return out;
}

// ---------- Inside the atom: protons, neutrons, electrons, shells ----------
const shells = z => { const s=[]; let left=z; [2,8,8,99].forEach(m=>{ if(left>0){ const k=Math.min(m, left); s.push(k); left-=k; } }); return s; };   // elements 1-20
const cfg = a => a.join(',');
const nuc = (A, Z, sym) => `<span class="nuc"><span class="nuc-n"><span>${A}</span><span>${Z}</span></span><span class="nuc-s">${esc(sym)}</span></span>`;
function inside(D){
  const out=[];
  D.E.filter(e=>e.z<=20).forEach(e=>{ const Z=e.z;
    e.masses.forEach((A, i)=>{ const N=A-Z, tag=e.symbol.toLowerCase()+A, show=`<p class="gen-big">${nuc(A, Z, e.symbol)}</p><p class="gen-sub">${esc(e.name)}-${A}</p>`, zh=esc(e.zh);
      if(i===0){
        const pWhy=[`The proton number is the bottom number: ${Z}.`, `质子数是下面的数字：${Z}。`];
        out.push(Q(`chem:atom:p:${tag}`, Z>10 ? 1.5 : 1, ['2.2'], 'How many protons?', '有多少个质子？', show, zh, String(Z), [
          W(String(A), 1, `${A} is the mass number: protons and neutrons together. ${pWhy[0]}`, `${A} 是质量数（质子 + 中子）。${pWhy[1]}`),
          W(String(N), 1, `${N} is the number of neutrons. ${pWhy[0]}`, `${N} 是中子数。${pWhy[1]}`),
          W(String(Z+1), 3, ...pWhy), W(String(Z+2), 3, ...pWhy), Z>1 ? W(String(Z-1), 3, ...pWhy) : null]));
        const eWhy=[`An atom has as many electrons as protons: ${Z}.`, `原子的电子数等于质子数：${Z}。`];
        out.push(Q(`chem:atom:e:${tag}`, Z>10 ? 2.5 : 2, ['2.2'], 'How many electrons in the atom?', '这个原子有多少个电子？', show, zh, String(Z), [
          W(String(N), 1, `${N} is the number of neutrons. ${eWhy[0]}`, `${N} 是中子数。${eWhy[1]}`),
          W(String(A), 1, `${A} is the mass number. ${eWhy[0]}`, `${A} 是质量数。${eWhy[1]}`),
          W(String(Z+1), 3, ...eWhy), Z>1 ? W(String(Z-1), 3, ...eWhy) : null, W(String(Z+2), 3, ...eWhy)]));
      }
      const nWhy=[`Neutrons = mass number − proton number: ${A} − ${Z} = ${N}.`, `中子数 = 质量数 − 质子数：${A} − ${Z} = ${N}。`];
      out.push(Q(`chem:atom:n:${tag}`, i ? 3.5 : 3, ['2.2','2.3'], 'How many neutrons?', '有多少个中子？', show, zh, String(N), [
        W(String(Z), 1, `${Z} is the proton number. ${nWhy[0]}`, `${Z} 是质子数。${nWhy[1]}`),
        W(String(A), 1, `${A} is the mass number: protons and neutrons together. ${nWhy[0]}`, `${A} 是质量数（质子 + 中子）。${nWhy[1]}`),
        W(String(A+Z), 1, `Take the protons away, don't add them: ${A} − ${Z} = ${N}.`, `要减去质子数，不是加上：${A} − ${Z} = ${N}。`),
        W(String(N+1), 3, ...nWhy), N>0 ? W(String(N-1), 3, ...nWhy) : null, W(String(N+2), 3, ...nWhy), W(String(N+3), 3, ...nWhy)]));
    });
    if(Z<3) return;   // hydrogen and helium have one shell: nothing to arrange
    const right=shells(Z), count=[`Count again: ${esc(e.name)} has ${Z} electrons.`, `再数一遍：${esc(e.zh)}有 ${Z} 个电子。`], w=[];
    w.push(W(cfg(shells(Z+1)), 1, ...count), W(cfg(shells(Z-1)), 1, ...count));
    if(Z===11 || Z===12) w.push(W(cfg([2, Z-2]), 2, 'The second shell holds at most 8 electrons.', '第二层最多容纳 8 个电子。'));
    if(Z>18) w.push(W(cfg([2, 8, Z-10]), 1, 'For elements 1 to 20, the third shell holds 8 electrons; then the fourth shell starts.', '前 20 号元素的第三层排 8 个电子，然后开始排第四层。'));
    if(Z<=10) w.push(W(cfg(Z>3 ? [3, Z-3] : [3]), 2, 'The first shell holds only 2 electrons.', '第一层只能容纳 2 个电子。'));
    if(right.length>1){ const rev=[...right].reverse(); if(cfg(rev)!==cfg(right)) w.push(W(cfg(rev), 2, 'Fill the shells from the nucleus outwards: 2 in the first shell, then 8.', '电子从里往外排：第一层 2 个，然后 8 个。')); }
    out.push(Q(`chem:atom:c:${e.symbol.toLowerCase()}`, Z>18 ? 4 : Z>10 ? 3.5 : 3, ['2.2'], 'Choose the electronic configuration', '选出电子排布',
      `<p class="gen-big gen-name">${esc(e.name)}</p><p class="gen-sub">proton number ${Z}</p>`, `${esc(e.zh)} · 质子数 ${Z}`, cfg(right), w));
  });
  // Ions: their electrons, and (elements 1-20) their electronic configuration
  D.E.filter(e=>e.ion).forEach(e=>{ const Z=e.z, q=e.ion, k=Math.abs(q), ne=Z-q, lost=q>0, I=ionH(e.symbol, q);
    const show=`<p class="gen-big">${I}</p><p class="gen-sub">${esc(e.name)} · proton number ${Z}</p>`, zh=`${esc(e.zh)} · 质子数 ${Z}`;
    const how=lost ? [`${I} has lost ${NUM[k]} electron${s_(k)}: ${Z} − ${k} = ${ne}.`, `${I} 失去了 ${k} 个电子：${Z} − ${k} = ${ne}。`]
      : [`${I} has gained ${NUM[k]} electron${s_(k)}: ${Z} + ${k} = ${ne}.`, `${I} 得到了 ${k} 个电子：${Z} + ${k} = ${ne}。`];
    const flip=lost ? [`A positive ion has lost electrons, so it has fewer than ${Z}: ${ne}.`, `阳离子失去了电子，所以电子少于 ${Z} 个：${ne}。`]
      : [`A negative ion has gained electrons, so it has more than ${Z}: ${ne}.`, `阴离子得到了电子，所以电子多于 ${Z} 个：${ne}。`];
    out.push(Q(`chem:atom:ie:${e.symbol.toLowerCase()}`, 4, ['2.2','2.4'], 'How many electrons in the ion?', '这个离子有多少个电子？', show, zh, String(ne), [
      W(String(Z), 1, `${Z} is the number of electrons in the atom. ${how[0]}`, `${Z} 是原子的电子数。${how[1]}`),
      W(String(Z+q), 1, ...flip), W(String(ne+1), 3, ...how), W(String(ne-1), 3, ...how)]));
    if(Z>20) return;
    const right=cfg(shells(ne)), w=[W(cfg(shells(Z)), 1, `That is the atom. ${how[0]}`, `这是原子的电子排布。${how[1]}`)];
    if(Z+q<=20) w.push(W(cfg(shells(Z+q)), 1, ...flip));
    w.push(W(cfg(shells(ne+1)), 3, ...how), W(cfg(shells(ne-1)), 3, ...how));
    out.push(Q(`chem:atom:ic:${e.symbol.toLowerCase()}`, 4.5, ['2.2','2.4'], 'Choose the electronic configuration of the ion', '选出这个离子的电子排布', show, zh, right, w));
  });
  return out;
}

// ---------- What's made? An acid and a metal, base or carbonate ----------
const ACIDS = {
  hcl:   {name:'hydrochloric acid', zh:'盐酸', an:'cl',  swap:'ate', ox:['Hydrochloric acid (HCl) has no oxygen, so it makes chlorides, not chlorates.', '盐酸（HCl）不含氧，所以生成 chloride，不是 chlorate。']},
  h2so4: {name:'sulfuric acid',     zh:'硫酸', an:'so4', swap:'ide', ox:['Sulfuric acid (H<sub>2</sub>SO<sub>4</sub>) contains oxygen, so it makes sulfates, not sulfides.', '硫酸（H<sub>2</sub>SO<sub>4</sub>）含氧，所以生成 sulfate，不是 sulfide。']},
  hno3:  {name:'nitric acid',       zh:'硝酸', an:'no3', swap:'ide', ox:['Nitric acid (HNO<sub>3</sub>) contains oxygen, so it makes nitrates, not nitrides.', '硝酸（HNO<sub>3</sub>）含氧，所以生成 nitrate，不是 nitride。']}
};
const SALTS = ['Hydrochloric acid makes chlorides, sulfuric acid makes sulfates and nitric acid makes nitrates.', '盐酸生成 chloride，硫酸生成 sulfate，硝酸生成 nitrate。'];
function made(D){
  const out=[], ion=D.ionById;
  D.R.forEach(r=>{ const c=ion[r.ion]; if(!c){ console.warn('reactions.csv ('+r.id+'): no ion "'+r.ion+'" in ions.csv'); return; }
    r.acids.forEach(id=>{ const acid=ACIDS[id], an=acid && ion[acid.an]; if(!an) return;
      const extra=r.type==='metal' ? ['hydrogen'] : r.type==='carbonate' ? ['water', 'carbon dioxide'] : ['water'];
      const say=(salt, ex)=>esc([salt, ...ex].join(' + ')), salt=c.name+' '+an.name, w=[];
      const others=Object.values(ACIDS).filter(x=>x!==acid).map(x=>ion[x.an]).filter(Boolean);
      const swap=an.mixups.find(m=>m.endsWith(acid.swap)), swapped=swap ? c.name+' '+swap : '';   // chlorate, sulfide, nitride
      if(r.type==='metal'){
        w.push(W(say(salt, ['water']), 1, 'A metal and an acid give hydrogen. Water comes from a base (an oxide or a hydroxide).', '金属和酸反应生成氢气；生成水的是碱（氧化物或氢氧化物）。'));
        w.push(W(say(salt, ['water', 'carbon dioxide']), 2, 'Carbon dioxide only comes from a carbonate.', '只有碳酸盐才会生成二氧化碳。'));
        if(c.symbol==='Fe') w.push(W(say('iron(III) '+an.name, extra), 1, 'Iron and a dilute acid give an iron(II) salt (Fe<sup>2+</sup>).', '铁和稀酸反应生成亚铁盐（Fe<sup>2+</sup>）：iron(II)。'));
      } else if(r.type==='carbonate'){
        w.push(W(say(salt, ['carbon dioxide']), 1, 'There are three products: a salt, water and carbon dioxide.', '一共有三种生成物：盐、水和二氧化碳。'));
        w.push(W(say(salt, ['water']), 1, 'There are three products: a salt, water and carbon dioxide (the fizzing).', '一共有三种生成物：盐、水和二氧化碳（冒出的气泡）。'));
        w.push(W(say(salt, ['hydrogen']), 1, 'A carbonate gives carbon dioxide, not hydrogen. Hydrogen comes from a metal.', '碳酸盐生成二氧化碳，不是氢气；生成氢气的是金属。'));
      } else {
        w.push(W(say(salt, ['hydrogen']), 1, 'A base gives water, not hydrogen. Hydrogen comes from a metal.', '碱和酸反应生成水，不是氢气；生成氢气的是金属。'));
        w.push(W(say(salt, ['water', 'carbon dioxide']), 1, 'Carbon dioxide only comes from a carbonate.', '只有碳酸盐才会生成二氧化碳。'));
        if(r.type==='oxide') w.push(W(say(salt, ['oxygen']), 2, 'The oxygen in the oxide ends up in the water: acid + base → salt + water.', '氧化物里的氧进入了水：酸 + 碱 → 盐 + 水。'));
      }
      others.forEach(o=>w.push(W(say(c.name+' '+o.name, extra), 1, ...SALTS)));
      if(swapped) w.push(W(say(swapped, extra), 2, ...acid.ox));
      const html=`<p class="gen-eq">${esc(r.reactant)} + ${esc(acid.name)} → <b>?</b></p>`;
      out.push(Q(`chem:made:${r.id}-${id}`, r.lv+(id==='hcl' ? 0 : .5), ['7.1'], 'What is made?', '生成什么？', html, `${esc(r.zh)} + ${esc(acid.zh)} → ？`,
        say(salt, extra), w, true));
    });
  });
  return out;
}

window.AEA_GEN = {
  subject: 'chemistry',            // the topic choice is saved as aea:science:chemistry (both sides)
  title: 'Chemistry practice', titleZh: '化学练习',
  files: ['ions', 'elements', 'reactions'],   // extra tables app.js loads from the page's content folder (both sides)
  // Cambridge IGCSE Chemistry (0620), syllabus for 2026-2028: the 12 topics, in syllabus order
  topics: [
    {n:'1', name:'States of matter', zh:'物质的状态'},
    {n:'2', name:'Atoms, elements and compounds', zh:'原子、元素和化合物'},
    {n:'3', name:'Stoichiometry', zh:'化学计量'},
    {n:'4', name:'Electrochemistry', zh:'电化学'},
    {n:'5', name:'Chemical energetics', zh:'化学反应中的能量'},
    {n:'6', name:'Chemical reactions', zh:'化学反应'},
    {n:'7', name:'Acids, bases and salts', zh:'酸、碱和盐'},
    {n:'8', name:'The Periodic Table', zh:'元素周期表'},
    {n:'9', name:'Metals', zh:'金属'},
    {n:'10', name:'Chemistry of the environment', zh:'环境化学'},
    {n:'11', name:'Organic chemistry', zh:'有机化学'},
    {n:'12', name:'Experimental techniques and chemical analysis', zh:'实验技术与化学分析'}
  ],
  // The English topic page's three columns (the games by key, in order)
  columns: [
    {key:'chem',    name:'Chemistry',  games:['chatom', 'chion', 'chname', 'chformula', 'chmade']},
    {key:'vocab',   name:'Vocabulary', games:['match', 'meaning', 'tf']},
    {key:'explain', name:'Explaining', games:['gap', 'rw', 'build', 'evidence', 'error']}
  ],
  build(T){
    const D=readTables(T), K=compounds(D);
    return [
      {key:'chatom', name:'Inside the atom', zh:'原子里面', blurb:'Count the protons, neutrons and electrons, and fill the shells.', zhBlurb:'数一数质子、中子和电子，再排出电子层。', items:inside(D)},
      {key:'chion', name:'Ion charge', zh:'离子电荷', blurb:'Which ion does each element form? Work it out from its group.', zhBlurb:'根据元素所在的族，判断它形成什么离子。', items:ionCharge(D)},
      {key:'chname', name:'Name it', zh:'说出名称', blurb:'See a formula and choose the right name for the compound.', zhBlurb:'看化学式和中文名称，选出正确的英文名称。', items:nameIt(D, K)},
      {key:'chformula', name:'Formula it', zh:'写出化学式', blurb:'See the name of a compound and choose its correct formula.', zhBlurb:'看英文名称和中文，选出正确的化学式。', items:formulaIt(D, K)},
      {key:'chmade', name:'What’s made?', zh:'生成什么？', blurb:'An acid reacts with a metal, base or carbonate. What is made?', zhBlurb:'酸和金属、碱或碳酸盐反应，选出生成物。', items:made(D)}
    ].map(g=>Object.assign({min:4}, g, {items:g.items.filter(q=>{ const ok=q.wrong.length>=3; if(!ok) console.warn(g.key+': '+q.id+' has fewer than 3 wrong answers'); return ok; })}));
  }
};
})();
