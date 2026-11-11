// Physics: questions made by rules, not written one by one (Science, 4 Nov 2026; built the same way as chem.js).
// Loaded before app.js on the physics pages only (en/physics/, zh/physics/). It sets window.AEA_GEN, which app.js reads
// ("GENERATED GAMES" there). Other pages don't load this file, so nothing changes for them.
//
// Tables in content/science/physics/ that a science teacher can check in a spreadsheet:
//   quantities.csv  each quantity: English and Chinese names, symbol, unit, the quantities students mix it up with
//   waves.csv       the electromagnetic spectrum, in order (longest wavelength first)
//   em-uses.csv     uses and harmful effects of each part of the spectrum (0625 3.3), and the parts never offered as a
//                   wrong answer for a use because they could be argued for (not)
//   nuclides.csv    nuclides for counting protons and neutrons, and for decay (alpha / beta)
// The equations and the calculation questions are below (EQS): each sentence in English and Chinese, with the values to
// use. The wrong answers are real mistakes (upside down, multiplied instead of divided, unit not converted, wrong unit,
// a square or ½ forgotten…), each with its reason and the working, in English and Chinese.
// Item ids (phys:calc:speed:a:4-30) are fixed by the tables and the values, so progress and reports stay with a question.
(function(){
'use strict';
const ZH_SIDE = ((document.getElementById('app')||{}).dataset||{}).only==='zh';
const esc = s => String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const MINUS = '−', NB = ' ', THIN = ' ';
const listOf = v => String(v||'').split(';').map(s=>s.trim()).filter(Boolean);
const cap = s => String(s).charAt(0).toUpperCase()+String(s).slice(1);
const LV = {A1:1, A2:2, B1:3, B2:4, C1:5};
const lvNum = c => { const m=String(c||'').trim().toUpperCase().match(/^([ABC][12])(\+)?$/); return m ? LV[m[1]]+(m[2]?.5:0) : 3; };
const lvCode = n => { n=Math.max(1, Math.min(5.5, n)); const b=Math.floor(n); return ['','A1','A2','B1','B2','C1'][b]+(n-b>=.5?'+':''); };
const yes = v => /^(y|yes|e|ext|extended|s|supplement|true|1)$/i.test(String(v||'').trim());

// One question (as in chem.js), plus ext: Extended (Supplement) only. meta: what the answer was worked out from (for checking).
const Q = (id, level, syl, ext, instr, instrZh, html, zh, answer, wrong, long, meta) => {
  const seen=new Set([answer]), w=wrong.filter(x=>x && x.h && !seen.has(x.h) && seen.add(x.h));
  return {id, level:lvCode(level), syl:[].concat(syl), ext:!!ext, instr, instrZh, html, zh, answer, wrong:w, long:!!long, meta};
};
const W = (h, p, why, whyZh) => ({h, p, why, whyZh});

// ---------- numbers ----------
// Up to 3 significant figures (whole numbers as they are), no floating-point noise; thousands spaced from 10 000.
function num(x){
  if(!isFinite(x)) return '?';
  const neg=x<0; let a=Math.abs(x), s;
  const r=Math.round(a*1e6)/1e6;
  if(Number.isInteger(r)) s=String(r);
  else if(a>=1000) s=String(Math.round(a));
  else s=String(parseFloat(a.toPrecision(3)));
  if(/e/.test(s)) s=a.toFixed(6).replace(/0+$/,'').replace(/\.$/,'');
  const [i, d]=s.split('.'), ii=i.length>4 ? i.replace(/\B(?=(\d{3})+(?!\d))/g, THIN) : i;
  return (neg?MINUS:'')+ii+(d?'.'+d:'');
}
const same = (a, b) => num(a)===num(b);
const val = (x, u) => num(x)+(u ? (u==='%' ? '%' : NB+u) : '');   // 20 m/s, 80%

// ---------- the tables ----------
function readTables(T){
  const Qs=(T.quantities||[]).map(r=>({id:r.id, lv:lvNum(r.level), name:r.name, zh:r.zh, sym:r.symbol, unit:r.unit, unitName:r.unit_name, unitZh:r.unit_zh,
      same:listOf(r.same_as), mixups:listOf(r.mixups), syl:listOf(r.syllabus), ext:yes(r.extended)}))
    .filter(q=>{ const ok=q.id && q.name && q.unit && q.unitName; if(!ok) console.warn('quantities.csv: row skipped', q); return ok; });
  const waves=(T.waves||[]).map(r=>({order:+r.order, id:r.id, lv:lvNum(r.level), name:r.name, zh:r.zh, syl:listOf(r.syllabus)}))
    .filter(w=>w.id && w.name && w.order>0).sort((a,b)=>a.order-b.order);
  const uses=(T['em-uses']||[]).map(r=>({id:r.id, lv:lvNum(r.level), kind:r.kind==='harm' ? 'harm' : 'use', text:r.text, zh:r.zh, wave:r.wave, not:listOf(r.not),
      syl:listOf(r.syllabus), ext:yes(r.extended)})).filter(u=>u.id && u.text && u.wave);
  const nucs=(T.nuclides||[]).map(r=>({id:r.id, lv:lvNum(r.level), name:r.name, zh:r.zh, sym:r.symbol, z:+r.z, a:+r.a, decay:String(r.decay||'').trim().toLowerCase(),
      syl:listOf(r.syllabus), ext:yes(r.extended)})).filter(n=>{ const ok=n.id && n.sym && n.z>0 && n.a>=n.z; if(!ok) console.warn('nuclides.csv: row skipped', n); return ok; });
  return {Qs, byId:Object.fromEntries(Qs.map(q=>[q.id, q])), waves, uses, nucs};
}

// ---------- Units: a quantity and its unit ----------
function units(D){
  const out=[], Qs=D.Qs;
  const alike=(a, b)=>a.unit===b.unit || a.same.includes(b.unit) || b.same.includes(a.unit);
  const uname=q=>`${esc(q.unitName)} (${esc(q.unit)})`;
  const sameTopic=(a, b)=>a.syl.some(x=>b.syl.some(y=>x.split('.')[0]===y.split('.')[0]));
  // A unit shared by several quantities is named after the main one: N force (not weight), J energy, m/s speed, m distance, V p.d.
  const MAIN=['force','energy','speed','distance','pd'], owner=u=>Qs.find(x=>x.unit===u && MAIN.includes(x.id)) || Qs.find(x=>x.unit===u);
  Qs.forEach(q=>{ const w=[], seen=new Set([q.unit]);
    const add=(o, p)=>{ if(!o || alike(o, q) || seen.has(o.unit)) return; seen.add(o.unit); o=owner(o.unit);
      w.push(W(uname(o), p, `The ${esc(o.unitName)} (${esc(o.unit)}) is the unit of ${esc(o.name)}. The unit of ${esc(q.name)} is the ${esc(q.unitName)} (${esc(q.unit)}).`,
        `${esc(o.unitName)}（${esc(o.unit)}）是${esc(o.zh)}的单位。${esc(q.zh)}的单位是 ${esc(q.unitName)}（${esc(q.unit)}）。`)); };
    q.mixups.forEach(id=>add(D.byId[id], 1));
    Qs.filter(o=>sameTopic(o, q)).forEach(o=>add(o, 2));
    Qs.forEach(o=>add(o, 3));
    out.push(Q(`phys:unit:of:${q.id}`, q.lv, q.syl, q.ext, 'What is its unit?', '它的单位是什么？', `<p class="gen-big gen-name">${esc(q.name)}</p>`, esc(q.zh), uname(q), w));
  });
  // The other way round, for units that belong to one quantity only (not m, s, N, J, V, m/s: each is the unit of more than one)
  Qs.filter(q=>!Qs.some(o=>o!==q && alike(o, q))).forEach(q=>{ const w=[], seen=new Set([q.id]);
    const add=(o, p)=>{ if(!o || seen.has(o.id) || alike(o, q)) return; seen.add(o.id);
      w.push(W(esc(o.name), p, `The unit of ${esc(o.name)} is the ${esc(o.unitName)} (${esc(o.unit)}). The ${esc(q.unitName)} (${esc(q.unit)}) is the unit of ${esc(q.name)}.`,
        `${esc(o.zh)}的单位是 ${esc(o.unitName)}（${esc(o.unit)}）。${esc(q.unitName)}（${esc(q.unit)}）是${esc(q.zh)}的单位。`)); };
    q.mixups.forEach(id=>add(D.byId[id], 1));
    Qs.filter(o=>sameTopic(o, q)).forEach(o=>add(o, 2));
    Qs.forEach(o=>add(o, 3));
    out.push(Q(`phys:unit:which:${q.id}`, q.lv+.5, q.syl, q.ext, 'Which quantity is measured in this unit?', '哪个物理量用这个单位？',
      `<p class="gen-big">${esc(q.unit)}</p><p class="gen-sub">${esc(q.unitName)}</p>`, `${esc(q.unitName)}（${esc(q.unitZh)}）`, esc(q.name), w));
  });
  return out;
}

// ---------- The equations ----------
// op '/': A = B ÷ C, op '*': A = B × C. Each letter: the quantity (quantities.csv id) and the words used in the equation.
// extra: more wrong equations for "Which equation gives…?" (a real mix-up, with its reason). why: a better reason for one
// of the usual mistakes (times: multiplied instead of divided; div: divided instead of multiplied).
// calc: the calculations. find: the letter asked for; pairs: the values of the two letters in free (in the units shown),
// the third is worked out from them; units: the units shown (when not the quantity's own: g, cm³, km, min…);
// conv: what a shown unit is multiplied by to fit the others (km → m: 1000), which gives the mistake of not converting.
const EQS = [
  {id:'speed', syl:'1.2', lv:2, op:'/', A:['speed','speed','速率'], B:['distance','distance','路程'], C:['time','time','时间'],
    extra:[['energy transferred ÷ time', 'Energy transferred ÷ time gives the power.', '转移的能量 ÷ 时间得到的是功率。']],
    calc:[
      {k:'a', find:'A', free:'AC', pairs:[[4,30],[5,60],[6,40],[8,25],[10,45],[12,50]], en:'A cyclist travels {B} in {C}. Calculate her average speed.', zh:'一名骑车人在 {C} 内行驶了 {B}。计算她的平均速率。'},
      {k:'b', find:'B', free:'AC', pairs:[[20,30],[25,40],[30,60],[15,80],[40,25]], en:'A train moves at a steady speed of {A} for {C}. How far does it travel?', zh:'一列火车以 {A} 的速率匀速行驶了 {C}。它行驶了多远？'},
      {k:'c', find:'C', free:'AC', pairs:[[4,25],[5,40],[8,50],[6,100],[10,12]], en:'A runner runs {B} at an average speed of {A}. How long does it take?', zh:'一名跑步者以 {A} 的平均速率跑了 {B}。需要多长时间？'},
      {k:'km', find:'A', free:'AC', pairs:[[20,150],[25,200],[30,100],[15,400],[10,300]], units:{B:'km'}, conv:{B:1000}, lv:.5,
        en:'A car travels {B} in {C}. Calculate its average speed in m/s.', zh:'一辆汽车在 {C} 内行驶了 {B}。计算它的平均速率（单位 m/s）。'},
      {k:'min', find:'A', free:'AC', pairs:[[5,2],[4,5],[3,10],[6,4]], units:{C:'min'}, conv:{C:60}, lv:.5,
        en:'A boat travels {B} in {C}. Calculate its average speed in m/s.', zh:'一艘船在 {C} 内行驶了 {B}。计算它的平均速率（单位 m/s）。'}]},
  {id:'weight', syl:'1.3', lv:2, op:'*', A:['weight','weight','重力'], B:['mass','mass','质量'], C:['gfs','gravitational field strength','重力场强度'],
    extra:[['mass', 'Mass (in kg) and weight (in N) are different quantities: weight = mass × gravitational field strength.', '质量（kg）和重力（N）是不同的物理量：重力 = 质量 × 重力场强度。']],
    calc:[
      {k:'a', find:'A', free:'BC', pairs:[[2,9.8],[5,9.8],[10,9.8],[20,9.8],[0.5,9.8]], en:'A bag of rice has a mass of {B}. The gravitational field strength is {C}. Calculate its weight.', zh:'一袋米的质量是 {B}，重力场强度是 {C}。计算它的重力。'},
      {k:'moon', find:'A', free:'BC', pairs:[[60,1.6],[75,1.6],[80,1.6],[90,1.6]], lv:.5, earth:9.8,
        en:'An astronaut has a mass of {B}. On the Moon, the gravitational field strength is {C}. Calculate the astronaut’s weight on the Moon.', zh:'一名宇航员的质量是 {B}。月球上的重力场强度是 {C}。计算宇航员在月球上的重力。'},
      {k:'b', find:'B', free:'BC', pairs:[[3,9.8],[5,9.8],[10,9.8],[25,9.8]], en:'A box has a weight of {A}. The gravitational field strength is {C}. Calculate its mass.', zh:'一个箱子的重力是 {A}，重力场强度是 {C}。计算它的质量。'},
      {k:'g', find:'A', free:'BC', pairs:[[200,9.8],[150,9.8],[500,9.8]], units:{B:'g'}, conv:{B:0.001}, lv:.5,
        en:'An apple has a mass of {B}. The gravitational field strength is {C}. Calculate its weight.', zh:'一个苹果的质量是 {B}，重力场强度是 {C}。计算它的重力。'}]},
  {id:'density', syl:'1.4', lv:2, op:'/', A:['density','density','密度'], B:['mass','mass','质量'], C:['volume','volume','体积'],
    extra:[['force ÷ area', 'Force ÷ area gives the pressure.', '力 ÷ 面积得到的是压强。']],
    calc:[
      {k:'a', find:'A', free:'AC', pairs:[[2.7,20],[8,15],[11,5],[7.9,10],[19,4]], units:{A:'g/cm³', B:'g', C:'cm³'}, en:'A metal block has a mass of {B} and a volume of {C}. Calculate its density.', zh:'一块金属的质量是 {B}，体积是 {C}。计算它的密度。'},
      {k:'oil', find:'A', free:'AC', pairs:[[800,2],[900,0.5],[920,3]], en:'A tank holds {C} of oil. The oil has a mass of {B}. Calculate the density of the oil.', zh:'一个油箱装有 {C} 的油，油的质量是 {B}。计算油的密度。'},
      {k:'b', find:'B', free:'AC', pairs:[[19,50],[11,40],[8,25],[2.7,100]], units:{A:'g/cm³', B:'g', C:'cm³'}, en:'A metal bar has a volume of {C}. The density of the metal is {A}. Calculate the mass of the bar.', zh:'一根金属棒的体积是 {C}，这种金属的密度是 {A}。计算金属棒的质量。'},
      {k:'c', find:'C', free:'AC', pairs:[[2.5,40],[3,20],[2,75]], units:{A:'g/cm³', B:'g', C:'cm³'}, en:'A stone has a mass of {B}. Its density is {A}. Calculate its volume.', zh:'一块石头的质量是 {B}，密度是 {A}。计算它的体积。'}]},
  {id:'moment', syl:'1.5.2', lv:3, op:'*', A:['moment','moment','力矩'], B:['force','force','力'], C:['distance','perpendicular distance from the pivot','到支点的垂直距离'],
    extra:[['force × distance moved', 'Force × distance moved is the work done. A moment uses the perpendicular distance from the pivot.', '力 × 移动的距离是功。力矩用的是到支点的垂直距离。']],
    calc:[
      {k:'a', find:'A', free:'BC', pairs:[[20,0.5],[40,0.25],[12,1.5],[300,0.4],[50,2]], en:'A force of {B} acts at a perpendicular distance of {C} from a pivot. Calculate the moment of the force.', zh:'一个 {B} 的力作用在离支点垂直距离 {C} 的地方。计算这个力的力矩。'},
      {k:'cm', find:'A', free:'BC', pairs:[[20,80],[30,50],[15,60]], units:{C:'cm'}, conv:{C:0.01}, lv:.5, en:'A child pushes a door at right angles with a force of {B}, {C} from the hinge. Calculate the moment of the force in N m.', zh:'一个孩子在离门轴 {C} 的地方垂直推门，推力是 {B}。计算这个力的力矩（单位 N m）。'},
      {k:'b', find:'B', free:'BC', pairs:[[60,0.25],[80,0.2],[40,0.3],[100,0.15]], en:'A moment of {A} is needed to turn a nut. A spanner applies the force at right angles, {C} from the nut. What force is needed?', zh:'拧动一个螺母需要 {A} 的力矩。扳手在离螺母 {C} 的地方垂直用力。需要多大的力？'}]},
  {id:'work', syl:'1.7.2', lv:2, op:'*', A:['work','work done','功'], B:['force','force','力'], C:['distance','distance moved','移动的距离'],
    extra:[['force × perpendicular distance from the pivot', 'That is the moment of a force. Work done uses the distance moved in the direction of the force.', '这是力矩。功用的是沿力的方向移动的距离。']],
    calc:[
      {k:'a', find:'A', free:'BC', pairs:[[50,4],[120,3],[25,6],[80,2.5],[200,6]], en:'A student pushes a box with a force of {B}. The box moves {C} in the direction of the force. Calculate the work done.', zh:'一名学生用 {B} 的力推箱子，箱子沿力的方向移动了 {C}。计算所做的功。'},
      {k:'c', find:'C', free:'BC', pairs:[[2000,5],[1500,8],[4000,3]], en:'A crane does {A} of work lifting a load with a force of {B}. How far does it lift the load?', zh:'起重机用 {B} 的力提升货物，做了 {A} 的功。它把货物提升了多高？'},
      {k:'km', find:'A', free:'BC', pairs:[[300,2],[250,4]], units:{C:'km'}, conv:{C:1000}, lv:.5, en:'A horse pulls a cart with a steady force of {B} for {C}. Calculate the work done in joules.', zh:'一匹马用 {B} 的恒定拉力拉车走了 {C}。计算所做的功（单位 J）。'}]},
  {id:'power', syl:'1.7.4', lv:2, op:'/', A:['power','power','功率'], B:['energy','energy transferred','转移的能量'], C:['time','time taken','所用时间'],
    extra:[['distance ÷ time taken', 'Distance ÷ time gives the speed.', '路程 ÷ 时间得到的是速率。']],
    calc:[
      {k:'a', find:'A', free:'AC', pairs:[[50,20],[200,15],[1500,4],[60,30],[2000,12]], en:'A motor transfers {B} of energy in {C}. Calculate its power.', zh:'一台电动机在 {C} 内转移了 {B} 的能量。计算它的功率。'},
      {k:'b', find:'B', free:'AC', pairs:[[2000,90],[1500,100],[2400,50]], en:'A {A} kettle is switched on for {C}. How much energy does it transfer?', zh:'一个 {A} 的电水壶工作了 {C}。它转移了多少能量？'},
      {k:'c', find:'C', free:'AC', pairs:[[60,300],[40,500],[100,120]], en:'A {A} lamp transfers {B} of energy. For how long was it switched on?', zh:'一盏 {A} 的灯转移了 {B} 的能量。它亮了多长时间？'},
      {k:'min', find:'A', free:'AC', pairs:[[500,2],[800,1],[1200,5]], units:{C:'min'}, conv:{C:60}, lv:.5, en:'A lift motor transfers {B} of energy in {C}. Calculate its power in watts.', zh:'一台电梯电动机在 {C} 内转移了 {B} 的能量。计算它的功率（单位 W）。'}]},
  {id:'pressure', syl:'1.8', lv:2, op:'/', A:['pressure','pressure','压强'], B:['force','force','力'], C:['area','area','面积'],
    extra:[['mass ÷ volume', 'Mass ÷ volume gives the density.', '质量 ÷ 体积得到的是密度。']],
    calc:[
      {k:'a', find:'A', free:'AC', pairs:[[400,0.5],[2000,0.25],[1500,0.8],[5000,0.2],[250,2]], en:'A box with a weight of {B} rests on an area of {C}. Calculate the pressure on the floor.', zh:'一个重 {B} 的箱子放在地上，接触面积是 {C}。计算它对地面的压强。'},
      {k:'b', find:'B', free:'AC', pairs:[[50000,0.1],[20000,0.04],[800,3]], en:'A pressure of {A} acts on an area of {C}. Calculate the force.', zh:'{A} 的压强作用在 {C} 的面积上。计算压力的大小。'},
      {k:'c', find:'C', free:'AC', pairs:[[2000,0.5],[4000,0.3],[500,6]], en:'A force of {B} produces a pressure of {A}. Calculate the area it acts on.', zh:'{B} 的力产生了 {A} 的压强。计算受力面积。'}]},
  {id:'wave', syl:'3.1', lv:3, op:'*', A:['speed','wave speed','波速'], B:['frequency','frequency','频率'], C:['wavelength','wavelength','波长'],
    extra:[['amplitude × frequency', 'The amplitude is the height of a wave, not its length: wave speed = frequency × wavelength.', '振幅是波的高度，不是长度：波速 = 频率 × 波长。']],
    calc:[
      {k:'a', find:'A', free:'BC', pairs:[[2,1.5],[4,0.5],[0.5,6],[5,0.4],[3,2]], en:'A water wave has a frequency of {B} and a wavelength of {C}. Calculate its speed.', zh:'一列水波的频率是 {B}，波长是 {C}。计算它的波速。'},
      {k:'c', find:'C', free:'BC', pairs:[[170,2],[340,1],[680,0.5],[850,0.4]], en:'Sound travels at {A} in air. A sound has a frequency of {B}. Calculate its wavelength.', zh:'声音在空气中的传播速度是 {A}。某个声音的频率是 {B}。计算它的波长。'},
      {k:'b', find:'B', free:'BC', pairs:[[2,1.5],[5,0.8],[4,2.5]], en:'A wave on a rope travels at {A}. Its wavelength is {C}. Calculate its frequency.', zh:'绳子上的一列波以 {A} 的速度传播，波长是 {C}。计算它的频率。'}]},
  {id:'resistance', syl:'4.2.4', lv:3, op:'/', A:['resistance','resistance','电阻'], B:['pd','potential difference','电势差'], C:['current','current','电流'],
    why:{times:['Current × potential difference gives the power, not the resistance.', '电流 × 电势差得到的是功率，不是电阻。']},
    extra:[['charge ÷ time', 'Charge ÷ time gives the current.', '电荷量 ÷ 时间得到的是电流。']],
    calc:[
      {k:'a', find:'A', free:'AC', pairs:[[6,2],[12,0.5],[4,3],[20,0.6],[50,0.2]], en:'The current in a resistor is {C} when the potential difference across it is {B}. Calculate its resistance.', zh:'电阻两端的电势差是 {B} 时，通过它的电流是 {C}。计算它的电阻。'},
      {k:'b', find:'B', free:'AC', pairs:[[10,0.3],[15,0.4],[8,1.5],[100,0.05]], en:'A current of {C} flows through a {A} resistor. Calculate the potential difference across it.', zh:'{C} 的电流通过一个 {A} 的电阻。计算电阻两端的电势差。'},
      {k:'c', find:'C', free:'AC', pairs:[[6,1.5],[4,3],[24,0.5],[30,0.2]], en:'A {A} resistor is connected to a {B} supply. Calculate the current in it.', zh:'一个 {A} 的电阻接在 {B} 的电源上。计算通过它的电流。'},
      {k:'ma', find:'A', free:'AC', pairs:[[20,300],[50,240],[100,90]], units:{C:'mA'}, conv:{C:0.001}, lv:.5, en:'The current in a lamp is {C} when the potential difference across it is {B}. Calculate its resistance in ohms.', zh:'灯两端的电势差是 {B} 时，通过它的电流是 {C}。计算它的电阻（单位 Ω）。'}]},
  {id:'epower', syl:'4.2.5', lv:3, op:'*', A:['power','power','功率'], B:['current','current','电流'], C:['pd','potential difference','电势差'],
    why:{div:['Potential difference ÷ current gives the resistance, not the power.', '电势差 ÷ 电流得到的是电阻，不是功率。']},
    extra:[['current × resistance', 'Current × resistance gives the potential difference.', '电流 × 电阻得到的是电势差。']],
    calc:[
      {k:'a', find:'A', free:'BC', pairs:[[0.5,12],[2,230],[3,12],[0.25,240],[10,230]], en:'A lamp is connected to a {C} supply. The current in it is {B}. Calculate its power.', zh:'一盏灯接在 {C} 的电源上，电流是 {B}。计算它的功率。'},
      {k:'b', find:'B', free:'BC', pairs:[[4,230],[8,230],[2,240],[5,240]], en:'A {A} heater works on a {C} mains supply. Calculate the current in it.', zh:'一台 {A} 的电暖器接在 {C} 的市电上。计算通过它的电流。'}]},
  // Supplement
  {id:'accel', syl:'1.2', lv:4, ext:true, op:'/', A:['acceleration','acceleration','加速度'], B:['velocity','change in velocity','速度的变化量'], C:['time','time taken','所用时间'],
    extra:[['distance ÷ time taken', 'Distance ÷ time gives the speed.', '路程 ÷ 时间得到的是速率。']],
    calc:[
      {k:'a', find:'A', free:'AC', pairs:[[2,5],[3,4],[0.5,20],[4,6]], en:'The velocity of a trolley increases by {B} in {C}. Calculate its acceleration.', zh:'小车的速度在 {C} 内增加了 {B}。计算它的加速度。'},
      {k:'c', find:'C', free:'AC', pairs:[[2,6],[5,4],[1.5,10]], en:'A car accelerates at {A}. How long does it take for its velocity to increase by {B}?', zh:'一辆汽车的加速度是 {A}。它的速度增加 {B} 需要多长时间？'}]},
  {id:'force', syl:'1.5.1', lv:4, ext:true, op:'*', A:['force','resultant force','合力'], B:['mass','mass','质量'], C:['acceleration','acceleration','加速度'],
    extra:[['mass × velocity', 'Mass × velocity gives the momentum.', '质量 × 速度得到的是动量。']],
    calc:[
      {k:'a', find:'A', free:'BC', pairs:[[1200,2],[800,3],[1500,0.5],[60,4]], en:'A car of mass {B} accelerates at {C}. Calculate the resultant force on it.', zh:'一辆质量为 {B} 的汽车以 {C} 的加速度加速。计算它受到的合力。'},
      {k:'c', find:'C', free:'BC', pairs:[[2,3],[0.5,4],[5,1.5]], en:'A resultant force of {A} acts on a trolley of mass {B}. Calculate its acceleration.', zh:'{A} 的合力作用在质量为 {B} 的小车上。计算它的加速度。'},
      {k:'g', find:'A', free:'BC', pairs:[[400,5],[250,8],[50,20]], units:{B:'g'}, conv:{B:0.001}, lv:.5, en:'A ball of mass {B} accelerates at {C}. Calculate the resultant force on it in newtons.', zh:'一个质量为 {B} 的球以 {C} 的加速度加速。计算它受到的合力（单位 N）。'}]},
  {id:'spring', syl:'1.5.1', lv:4, ext:true, op:'/', A:['spring','spring constant','劲度系数'], B:['force','force','力'], C:['distance','extension','伸长量'],
    extra:[['force ÷ length of the spring', 'Use the extension (how much longer the spring gets), not its whole length.', '要用伸长量（弹簧伸长了多少），不是弹簧的总长度。']],
    calc:[
      {k:'a', find:'A', free:'AC', pairs:[[40,0.05],[25,0.2],[200,0.03],[50,0.1]], en:'A force of {B} stretches a spring by {C}. Calculate the spring constant.', zh:'{B} 的力把弹簧拉长了 {C}。计算弹簧的劲度系数。'},
      {k:'cm', find:'A', free:'AC', pairs:[[40,5],[20,15],[60,4]], units:{C:'cm'}, conv:{C:0.01}, lv:.5, en:'A force of {B} stretches a spring by {C}. Calculate the spring constant in N/m.', zh:'{B} 的力把弹簧拉长了 {C}。计算弹簧的劲度系数（单位 N/m）。'},
      {k:'b', find:'B', free:'AC', pairs:[[50,0.2],[80,0.25],[120,0.05]], en:'A spring has a spring constant of {A}. What force stretches it by {C}?', zh:'一根弹簧的劲度系数是 {A}。多大的力能把它拉长 {C}？'}]},
  {id:'momentum', syl:'1.6', lv:4, ext:true, op:'*', A:['momentum','momentum','动量'], B:['mass','mass','质量'], C:['velocity','velocity','速度'],
    extra:[['mass × acceleration', 'Mass × acceleration gives the resultant force.', '质量 × 加速度得到的是合力。']],
    calc:[
      {k:'a', find:'A', free:'BC', pairs:[[0.5,12],[2,3],[1200,15],[0.16,25]], en:'A ball of mass {B} moves at a velocity of {C}. Calculate its momentum.', zh:'一个质量为 {B} 的球以 {C} 的速度运动。计算它的动量。'},
      {k:'g', find:'A', free:'BC', pairs:[[60,40],[150,20]], units:{B:'g'}, conv:{B:0.001}, lv:.5, en:'A tennis ball of mass {B} travels at {C}. Calculate its momentum in kg m/s.', zh:'一个质量为 {B} 的网球以 {C} 的速度飞行。计算它的动量（单位 kg m/s）。'},
      {k:'c', find:'C', free:'BC', pairs:[[2,1.5],[4,0.5],[0.5,8]], en:'A trolley of mass {B} has a momentum of {A}. Calculate its velocity.', zh:'一辆质量为 {B} 的小车动量是 {A}。计算它的速度。'}]},
  {id:'current', syl:'4.2.2', lv:4, ext:true, op:'/', A:['current','current','电流'], B:['charge','charge','电荷量'], C:['time','time','时间'],
    extra:[['energy transferred ÷ charge', 'Energy transferred ÷ charge gives the potential difference.', '转移的能量 ÷ 电荷量得到的是电势差。']],
    calc:[
      {k:'a', find:'A', free:'AC', pairs:[[0.4,50],[2,15],[5,4]], en:'A charge of {B} passes a point in a circuit in {C}. Calculate the current.', zh:'{C} 内有 {B} 的电荷通过电路中的某一点。计算电流。'},
      {k:'b', find:'B', free:'AC', pairs:[[2,30],[0.5,60],[3,20]], en:'A current of {A} flows for {C}. Calculate the charge that flows.', zh:'{A} 的电流流过了 {C}。计算流过的电荷量。'},
      {k:'min', find:'B', free:'AC', pairs:[[2,5],[0.2,10]], units:{C:'min'}, conv:{C:60}, lv:.5, en:'A current of {A} flows for {C}. Calculate the charge that flows, in coulombs.', zh:'{A} 的电流流过了 {C}。计算流过的电荷量（单位 C）。'}]},
  {id:'pdq', syl:'4.2.3', lv:4, ext:true, op:'/', A:['pd','potential difference','电势差'], B:['energy','energy transferred','转移的能量'], C:['charge','charge','电荷量'],
    extra:[['energy transferred ÷ time', 'Energy transferred ÷ time gives the power.', '转移的能量 ÷ 时间得到的是功率。']],
    calc:[
      {k:'a', find:'A', free:'AC', pairs:[[12,5],[6,20],[230,2]], en:'{B} of energy is transferred when {C} of charge passes through a lamp. Calculate the potential difference across the lamp.', zh:'{C} 的电荷通过一盏灯时转移了 {B} 的能量。计算灯两端的电势差。'},
      {k:'b', find:'B', free:'AC', pairs:[[9,4],[12,10],[1.5,30]], en:'A charge of {C} moves through a potential difference of {A}. Calculate the energy transferred.', zh:'{C} 的电荷通过 {A} 的电势差。计算转移的能量。'}]}
];
const SAY = {'/':'÷', '*':'×'};
const L = (e, k) => e[k][1], LZ = (e, k) => e[k][2];            // the words for a letter (English, Chinese)
const rhs = (e, k1, op, k2, zh) => `${zh ? LZ(e,k1) : L(e,k1)} ${SAY[op]} ${zh ? LZ(e,k2) : L(e,k2)}`;
const eqn = (e, k, r, zh) => `${zh ? LZ(e,k) : L(e,k)} = ${r}`;
// The right way round for each letter: A = B op C; for '/': B = A × C, C = B ÷ A; for '*': B = A ÷ C, C = A ÷ B
const FORM = {'/':{A:['B','/','C'], B:['A','*','C'], C:['B','/','A']}, '*':{A:['B','*','C'], B:['A','/','C'], C:['A','/','B']}};
const calcOf = (e, k, v) => { const [x, op, y]=FORM[e.op][k]; return op==='*' ? v[x]*v[y] : v[x]/v[y]; };

// "Which equation gives the density?" and "Rearrange it to give the volume"
function equations(D){
  const out=[];
  EQS.forEach(e=>{
    const right=eqn(e, 'A', rhs(e, 'B', e.op, 'C')), rightZh=eqn(e, 'A', rhs(e, 'B', e.op, 'C', true), true);
    const why=[`${cap(right)}.`, `${rightZh}。`];
    const w=[];
    if(e.op==='/'){
      w.push(W(esc(eqn(e, 'A', rhs(e, 'C', '/', 'B'))), 1, `That is upside down. ${why[0]}`, `上下颠倒了。${why[1]}`));
      const t=(e.why||{}).times;
      w.push(W(esc(eqn(e, 'A', rhs(e, 'B', '*', 'C'))), 1, t ? `${t[0]} ${why[0]}` : `Divide, don't multiply. ${why[0]}`, t ? `${t[1]}${why[1]}` : `要除，不是乘。${why[1]}`));
    } else {
      const d=(e.why||{}).div;
      w.push(W(esc(eqn(e, 'A', rhs(e, 'B', '/', 'C'))), 1, d ? `${d[0]} ${why[0]}` : `Multiply, don't divide. ${why[0]}`, d ? `${d[1]}${why[1]}` : `要乘，不是除。${why[1]}`));
      w.push(W(esc(eqn(e, 'A', rhs(e, 'C', '/', 'B'))), 2, `Multiply, don't divide. ${why[0]}`, `要乘，不是除。${why[1]}`));
    }
    (e.extra||[]).forEach(([r, en, zh])=>w.push(W(esc(eqn(e, 'A', r)), 1, `${en} ${why[0]}`, `${zh}${why[1]}`)));
    out.push(Q(`phys:eq:which:${e.id}`, e.lv, e.syl, e.ext, 'Which equation is right?', '哪个公式是对的？',
      `<p class="gen-big gen-name">${esc(L(e,'A'))}</p>`, esc(LZ(e,'A')), esc(right), w, true));
    // Rearranging: B and C
    ['B','C'].forEach(k=>{ const [x, op, y]=FORM[e.op][k], good=eqn(e, k, rhs(e, x, op, y)), goodZh=eqn(e, k, rhs(e, x, op, y, true), true);
      const r=[`${cap(good)}.`, `${goodZh}。`], others=['A','B','C'].filter(j=>j!==k), w2=[];
      const forms=[[others[0],'*',others[1]], [others[0],'/',others[1]], [others[1],'/',others[0]]];
      forms.forEach(([a, o, b])=>{ const h=eqn(e, k, rhs(e, a, o, b)); if(h===good) return;
        const lead = o==='*' ? ['Divide, don\'t multiply.', '要除，不是乘。'] : op==='*' ? ['Multiply, don\'t divide.', '要乘，不是除。'] : ['That is upside down.', '上下颠倒了。'];
        w2.push(W(esc(h), 1, `${lead[0]} ${r[0]}`, `${lead[1]}${r[1]}`)); });
      w2.push(W(esc(right), 2, `That is the equation you started with: it gives the ${esc(L(e,'A'))}. ${r[0]}`, `这是原来的公式，求的是${esc(LZ(e,'A'))}。${r[1]}`));
      out.push(Q(`phys:eq:re:${e.id}:${k.toLowerCase()}`, e.lv+1, e.syl, e.ext, `Rearrange it to give the ${L(e,k)}`, `变形公式，求${LZ(e,k)}`,
        `<p class="gen-eq">${esc(right)}</p>`, esc(rightZh), esc(good), w2, true));
    });
  });
  return out;
}

// ---------- Calculate it ----------
const CONV_WORDS = {km:['metres','m','米'], cm:['metres','m','米'], g:['kilograms','kg','千克'], min:['seconds','s','秒'], mA:['amperes','A','安'], kJ:['joules','J','焦']};
function calcs(D){
  const out=[];
  EQS.forEach(e=>(e.calc||[]).forEach(c=>c.pairs.forEach(pair=>{
    const U={}, conv=c.conv||{}; ['A','B','C'].forEach(k=>{ const q=D.byId[e[k][0]]; U[k]=(c.units||{})[k] || (q ? q.unit : ''); });
    // The values: the two free letters as shown; everything worked out in consistent units (shown × conv)
    const shown={}, v={}; c.free.split('').forEach((k, i)=>{ shown[k]=pair[i]; v[k]=pair[i]*(conv[k]||1); });
    const third=['A','B','C'].find(k=>!c.free.includes(k)); v[third]=calcOf(e, third, v); shown[third]=v[third]/(conv[third]||1);
    const find=c.find, given=['A','B','C'].filter(k=>k!==find), ans=v[find]/(conv[find]||1), qa=D.byId[e[find][0]];
    const put=(t)=>t.replace(/\{([ABC])\}/g, (m, k)=>val(shown[k], U[k]));
    const [x, op, y]=FORM[e.op][find], work=`${num(v[x])} ${SAY[op]} ${num(v[y])} = ${val(ans, U[find])}`;
    const r=[`${cap(L(e,find))} = ${rhs(e, x, op, y)} = ${work}.`, `${LZ(e,find)} = ${rhs(e, x, op, y, true)} = ${work}。`];
    const w=[], add=(n, u, p, en, zh)=>{ if(!isFinite(n) || n<=0 || (same(n, ans) && u===U[find])) return; w.push(W(esc(val(n, u)), p, en, zh)); };
    // Upside down, or multiplied / divided the wrong way
    const a=v[given[0]], b=v[given[1]], cands=[[a*b,'*'], [a/b,'/1'], [b/a,'/2']];
    cands.forEach(([n, how])=>{ const lead = how==='*' ? ['Divide, don\'t multiply.', '要除，不是乘。'] : op==='*' ? ['Multiply, don\'t divide.', '要乘，不是除。'] : ['That is upside down.', '上下颠倒了。'];
      add(n/(conv[find]||1), U[find], 1, `${lead[0]} ${r[0]}`, `${lead[1]}${r[1]}`); });
    // Not converting a unit (km, cm, g, min, mA)
    given.filter(k=>conv[k]).forEach(k=>{ const raw={...v, [k]:shown[k]}, n=calcOf(e, find, raw)/(conv[find]||1), cw=CONV_WORDS[U[k]]||['', '', ''];
      add(n, U[find], 1, `Change ${esc(val(shown[k], U[k]))} into ${cw[0]} first: ${esc(val(v[k], cw[1]))}. ${r[0]}`, `先把 ${esc(val(shown[k], U[k]))} 换算成${cw[2]}：${esc(val(v[k], cw[1]))}。${r[1]}`); });
    // The Moon: using the Earth's g
    if(c.earth){ const n=calcOf(e, find, {...v, C:c.earth}); add(n, U[find], 1, `On the Moon, use the Moon's gravitational field strength (${esc(val(v.C, U.C))}), not the Earth's. ${r[0]}`, `在月球上要用月球的重力场强度（${esc(val(v.C, U.C))}），不是地球的。${r[1]}`); }
    // The right number with the wrong unit: the unit of a given quantity, or of a quantity it is often mixed up with
    const gu=given.map(k=>[U[k], D.byId[e[k][0]]]), mu=qa ? qa.mixups.map(id=>D.byId[id]).filter(Boolean).map(q=>[q.unit, q]) : [];
    const units=c.units ? [...gu, ...mu] : [...mu, ...gu];
    const seenU=new Set([U[find]]); let nu=0;
    units.forEach(([u, q])=>{ if(!u || !q || seenU.has(u) || nu>=2) return; seenU.add(u); nu++;
      add(ans, u, nu===1 ? 2 : 3, `The number is right, but ${esc(u)} is a unit of ${esc(q.name)}. The ${esc(L(e,find))} is in ${esc(U[find])}.`, `数字对了，但 ${esc(u)} 是${esc(q.zh)}的单位。${esc(LZ(e,find))}的单位是 ${esc(U[find])}。`); });
    const id=`phys:calc:${e.id}:${c.k}:${pair.join('-')}`;
    out.push(Q(id, e.lv+(find==='A' ? 0 : .5)+(c.lv||0), e.syl, e.ext, 'Calculate', '计算', `<p class="gen-text">${esc(put(c.en))}</p>`, esc(put(c.zh)),
      esc(val(ans, U[find])), w, false, {eq:e.id, find, given:Object.fromEntries(given.map(k=>[k, [shown[k], U[k]]])), answer:[ans, U[find]]}));
  })));
  return out.concat(specials());
}

// Calculations with their own shape: energy = I × V × t, the transformer, kelvin, and (Supplement) Ek, ΔEp, efficiency,
// pressure in a liquid, pV, ΔE = mcΔθ, P = I²R, VpIp = VsIs and acceleration from two speeds
function specials(){
  const out=[], P=(id, lv, syl, ext, en, zh, ans, u, wrong, meta, neg)=>{
    const w=wrong.filter(([n, uu])=>isFinite(n) && (neg || n>0) && !(same(n, ans) && uu===u)).map(([n, uu, p, a, b])=>W(esc(val(n, uu)), p, a, b));
    out.push(Q(id, lv, syl, ext, 'Calculate', '计算', `<p class="gen-text">${esc(en)}</p>`, esc(zh), esc(val(ans, u)), w, false, meta)); };
  // E = I × V × t (Core 4.2.5)
  [[2,230,60],[5,12,30],[0.5,240,600],[3,6,20]].forEach(([I,V,t])=>{ const E=I*V*t, r=[`Energy = current × potential difference × time = ${num(I)} × ${num(V)} × ${num(t)} = ${val(E,'J')}.`, `能量 = 电流 × 电势差 × 时间 = ${num(I)} × ${num(V)} × ${num(t)} = ${val(E,'J')}。`];
    P(`phys:calc:eivt:a:${I}-${V}-${t}`, 3, '4.2.5', false, `A heater takes a current of ${val(I,'A')} from a ${val(V,'V')} supply for ${val(t,'s')}. Calculate the energy transferred.`,
      `一台电暖器接在 ${val(V,'V')} 的电源上，电流是 ${val(I,'A')}，工作了 ${val(t,'s')}。计算转移的能量。`, E, 'J', [
      [I*V, 'J', 1, `Current × potential difference is the power. Multiply by the time to get the energy. ${r[0]}`, `电流 × 电势差是功率，再乘以时间才是能量。${r[1]}`],
      [I*V/t, 'J', 1, `Multiply by the time, don't divide. ${r[0]}`, `要乘以时间，不是除以时间。${r[1]}`],
      [E, 'W', 2, `The number is right, but W is the unit of power. Energy is in J.`, `数字对了，但 W 是功率的单位。能量的单位是 J。`]], {eq:'eivt', find:'energy', given:{current:[I,'A'], pd:[V,'V'], time:[t,'s']}, answer:[E,'J']}); });
  [[2,230,5],[4,12,10]].forEach(([I,V,m])=>{ const t=m*60, E=I*V*t, r=[`Change ${val(m,'min')} into seconds first: ${val(t,'s')}. Energy = current × potential difference × time = ${num(I)} × ${num(V)} × ${num(t)} = ${val(E,'J')}.`, `先把 ${val(m,'min')} 换算成秒：${val(t,'s')}。能量 = 电流 × 电势差 × 时间 = ${num(I)} × ${num(V)} × ${num(t)} = ${val(E,'J')}。`];
    P(`phys:calc:eivt:min:${I}-${V}-${m}`, 3.5, '4.2.5', false, `A ${val(V,'V')} motor takes a current of ${val(I,'A')} for ${val(m,'min')}. Calculate the energy transferred in joules.`,
      `一台 ${val(V,'V')} 的电动机工作了 ${val(m,'min')}，电流是 ${val(I,'A')}。计算转移的能量（单位 J）。`, E, 'J', [
      [I*V*m, 'J', 1, ...r], [I*V, 'J', 1, `Current × potential difference is the power: multiply by the time too. ${r[0]}`, `电流 × 电势差是功率，还要乘以时间。${r[1]}`], [E, 'W', 2, 'The number is right, but W is the unit of power. Energy is in J.', '数字对了，但 W 是功率的单位。能量的单位是 J。']],
      {eq:'eivt', find:'energy', given:{current:[I,'A'], pd:[V,'V'], time:[m,'min']}, answer:[E,'J']}); });
  // Transformer: Vp / Vs = Np / Ns (Core 4.5.6)
  [[200,4000,12],[1000,50,240],[500,100,230],[100,1200,20]].forEach(([Np,Ns,Vp])=>{ const Vs=Vp*Ns/Np, r=[`Vs = Vp × Ns ÷ Np = ${num(Vp)} × ${num(Ns)} ÷ ${num(Np)} = ${val(Vs,'V')}.`, `Vs = Vp × Ns ÷ Np = ${num(Vp)} × ${num(Ns)} ÷ ${num(Np)} = ${val(Vs,'V')}。`];
    P(`phys:calc:transformer:${Np}-${Ns}-${Vp}`, 4, '4.5.6', false, `A transformer has ${Np} turns on its primary coil and ${Ns} turns on its secondary coil. The primary voltage is ${val(Vp,'V')}. Calculate the secondary voltage.`,
      `一个变压器的原线圈有 ${Np} 匝，副线圈有 ${Ns} 匝，原线圈电压是 ${val(Vp,'V')}。计算副线圈电压。`, Vs, 'V', [
      [Vp*Np/Ns, 'V', 1, `That is upside down: each voltage goes with the turns on its own coil. ${r[0]}`, `上下颠倒了：每个线圈的电压对应它自己的匝数。${r[1]}`],
      [Vp, 'V', 2, `The voltage changes: ${Ns>Np ? 'more' : 'fewer'} turns on the secondary coil means ${Ns>Np ? 'a higher' : 'a lower'} voltage. ${r[0]}`, `电压会改变：副线圈匝数${Ns>Np ? '多' : '少'}，电压就${Ns>Np ? '高' : '低'}。${r[1]}`],
      [Vp*Ns, 'V', 2, `Divide by the primary turns too. ${r[0]}`, `还要除以原线圈的匝数。${r[1]}`],
      [Vp*Np, 'V', 3, ...r]], {eq:'transformer', find:'Vs', given:{Np:[Np,''], Ns:[Ns,''], Vp:[Vp,'V']}, answer:[Vs,'V']}); });
  // Kelvin and degrees Celsius (Core 2.1.3)
  [27,100,0,-73,20,37].forEach(c=>{ const T=c+273, r=[`T (in K) = θ (in °C) + 273 = ${num(c)} + 273 = ${val(T,'K')}.`, `T（K）= θ（°C）+ 273 = ${num(c)} + 273 = ${val(T,'K')}。`];
    P(`phys:calc:kelvin:${c}`, 2, '2.1.3', false, `Convert ${val(c,'°C')} into kelvin.`, `把 ${val(c,'°C')} 换算成开尔文。`, T, 'K', [
      [c-273, 'K', 1, `Add 273, don't take it away. ${r[0]}`, `要加 273，不是减。${r[1]}`], [c, 'K', 2, `The number changes too. ${r[0]}`, `数字也要变。${r[1]}`],
      [T, '°C', 2, `The answer is in kelvin (K), not °C. ${r[0]}`, `答案的单位是开尔文（K），不是 °C。${r[1]}`]], {eq:'kelvin', find:'thermo', given:{temperature:[c,'°C']}, answer:[T,'K']}, true); });
  [300,373,250,310,400].forEach(T=>{ const c=T-273, r=[`θ (in °C) = T (in K) − 273 = ${num(T)} − 273 = ${val(c,'°C')}.`, `θ（°C）= T（K）− 273 = ${num(T)} − 273 = ${val(c,'°C')}。`];
    // A negative wrong answer is allowed here (a temperature): P drops answers ≤ 0, so list them through W directly
    P(`phys:calc:celsius:${T}`, 2.5, '2.1.3', false, `Convert ${val(T,'K')} into degrees Celsius.`, `把 ${val(T,'K')} 换算成摄氏度。`, c, '°C', [
      [T+273, '°C', 1, `Take 273 away, don't add it. ${r[0]}`, `要减 273，不是加。${r[1]}`], [T, '°C', 2, `The number changes too. ${r[0]}`, `数字也要变。${r[1]}`],
      [c, 'K', 2, `The answer is in degrees Celsius (°C), not kelvin. ${r[0]}`, `答案的单位是摄氏度（°C），不是 K。${r[1]}`]], {eq:'celsius', find:'temperature', given:{thermo:[T,'K']}, answer:[c,'°C']}, true); });
  // Kinetic energy (S 1.7.1)
  [[2,3],[4,5],[0.5,8],[1000,20],[60,4]].forEach(([m,v])=>{ const E=0.5*m*v*v, r=[`Kinetic energy = ½ × mass × speed² = 0.5 × ${num(m)} × ${num(v)}² = ${val(E,'J')}.`, `动能 = ½ × 质量 × 速度² = 0.5 × ${num(m)} × ${num(v)}² = ${val(E,'J')}。`];
    P(`phys:calc:ke:${m}-${v}`, 4.5, '1.7.1', true, `A trolley of mass ${val(m,'kg')} moves at ${val(v,'m/s')}. Calculate its kinetic energy.`, `一辆质量为 ${val(m,'kg')} 的小车以 ${val(v,'m/s')} 的速度运动。计算它的动能。`, E, 'J', [
      [m*v*v, 'J', 1, `Don't forget the ½. ${r[0]}`, `别忘了 ½。${r[1]}`], [0.5*m*v, 'J', 1, `Square the speed. ${r[0]}`, `速度要平方。${r[1]}`],
      [0.5*m*m*v*v, 'J', 2, `Only the speed is squared, not the mass. ${r[0]}`, `只有速度要平方，质量不平方。${r[1]}`], [E, 'W', 3, 'The number is right, but W is the unit of power. Energy is in J.', '数字对了，但 W 是功率的单位。能量的单位是 J。']],
      {eq:'ke', find:'energy', given:{mass:[m,'kg'], speed:[v,'m/s']}, answer:[E,'J']}); });
  // Gravitational potential energy (S 1.7.1)
  [[2,1.5],[5,2],[0.5,10],[60,3]].forEach(([m,h])=>{ const g=9.8, E=m*g*h, r=[`ΔEp = mass × g × height = ${num(m)} × ${num(g)} × ${num(h)} = ${val(E,'J')}.`, `ΔEp = 质量 × g × 高度 = ${num(m)} × ${num(g)} × ${num(h)} = ${val(E,'J')}。`];
    P(`phys:calc:gpe:${m}-${h}`, 4, '1.7.1', true, `A box of mass ${val(m,'kg')} is lifted ${val(h,'m')}. The gravitational field strength is ${val(g,'N/kg')}. Calculate the gain in gravitational potential energy.`,
      `把质量为 ${val(m,'kg')} 的箱子提升 ${val(h,'m')}，重力场强度是 ${val(g,'N/kg')}。计算增加的重力势能。`, E, 'J', [
      [m*h, 'J', 1, `Multiply by g as well. ${r[0]}`, `还要乘以 g。${r[1]}`], [m*g/h, 'J', 2, `Multiply by the height, don't divide. ${r[0]}`, `要乘以高度，不是除以。${r[1]}`],
      [m*g, 'J', 2, `That is the weight: multiply by the height too. ${r[0]}`, `那是重力，还要乘以高度。${r[1]}`], [E, 'N', 3, 'The number is right, but N is the unit of force. Energy is in J.', '数字对了，但 N 是力的单位。能量的单位是 J。']],
      {eq:'gpe', find:'energy', given:{mass:[m,'kg'], distance:[h,'m'], gfs:[g,'N/kg']}, answer:[E,'J']}); });
  [[2,50],[5,40]].forEach(([m,cm])=>{ const g=9.8, h=cm/100, E=m*g*h, r=[`Change ${val(cm,'cm')} into metres first: ${val(h,'m')}. ΔEp = ${num(m)} × ${num(g)} × ${num(h)} = ${val(E,'J')}.`, `先把 ${val(cm,'cm')} 换算成米：${val(h,'m')}。ΔEp = ${num(m)} × ${num(g)} × ${num(h)} = ${val(E,'J')}。`];
    P(`phys:calc:gpe:cm:${m}-${cm}`, 4.5, '1.7.1', true, `A book of mass ${val(m,'kg')} is lifted ${val(cm,'cm')} onto a shelf. The gravitational field strength is ${val(g,'N/kg')}. Calculate the gain in gravitational potential energy in joules.`,
      `把质量为 ${val(m,'kg')} 的书举高 ${val(cm,'cm')} 放到书架上，重力场强度是 ${val(g,'N/kg')}。计算增加的重力势能（单位 J）。`, E, 'J', [
      [m*g*cm, 'J', 1, ...r], [m*h, 'J', 1, `Multiply by g as well. ${r[0]}`, `还要乘以 g。${r[1]}`], [E, 'N', 3, 'The number is right, but N is the unit of force. Energy is in J.', '数字对了，但 N 是力的单位。能量的单位是 J。']],
      {eq:'gpe', find:'energy', given:{mass:[m,'kg'], distance:[cm,'cm'], gfs:[g,'N/kg']}, answer:[E,'J']}); });
  // Efficiency (S 1.7.3)
  [[500,400],[200,50],[1200,300],[800,600],[2000,700]].forEach(([In,Out])=>{ const e=Out/In*100, r=[`Efficiency = useful energy output ÷ total energy input × 100% = ${num(Out)} ÷ ${num(In)} × 100% = ${num(e)}%.`, `效率 = 有用的输出能量 ÷ 总输入能量 × 100% = ${num(Out)} ÷ ${num(In)} × 100% = ${num(e)}%。`];
    P(`phys:calc:eff:${In}-${Out}`, 4, '1.7.3', true, `A motor is supplied with ${val(In,'J')} of energy. It transfers ${val(Out,'J')} of useful energy. Calculate its efficiency.`,
      `给一台电动机输入 ${val(In,'J')} 的能量，它转移出 ${val(Out,'J')} 的有用能量。计算它的效率。`, e, '%', [
      [In/Out*100, '%', 1, `That is upside down: an efficiency can't be more than 100%. ${r[0]}`, `上下颠倒了：效率不可能超过 100%。${r[1]}`],
      [(In-Out)/In*100, '%', 1, `That is the wasted energy as a percentage. ${r[0]}`, `那是浪费的能量所占的百分比。${r[1]}`],
      [Out/In, '%', 2, `Multiply by 100 to give a percentage. ${r[0]}`, `要乘以 100 才是百分比。${r[1]}`]], {eq:'eff', find:'efficiency', given:{in:[In,'J'], out:[Out,'J']}, answer:[e,'%']}); });
  // Pressure in a liquid (S 1.8)
  [[2,1000],[5,1000],[10,1000],[0.5,1000]].forEach(([h,rho])=>{ const g=9.8, p=rho*g*h, r=[`Δp = density × g × depth = ${num(rho)} × ${num(g)} × ${num(h)} = ${val(p,'Pa')}.`, `Δp = 密度 × g × 深度 = ${num(rho)} × ${num(g)} × ${num(h)} = ${val(p,'Pa')}。`];
    P(`phys:calc:liquid:${h}`, 5, '1.8', true, `Calculate the pressure due to the water ${val(h,'m')} below the surface of a pool. The density of water is ${val(rho,'kg/m³')} and the gravitational field strength is ${val(g,'N/kg')}.`,
      `计算泳池水面以下 ${val(h,'m')} 深处由水产生的压强。水的密度是 ${val(rho,'kg/m³')}，重力场强度是 ${val(g,'N/kg')}。`, p, 'Pa', [
      [rho*h, 'Pa', 1, `Multiply by g as well. ${r[0]}`, `还要乘以 g。${r[1]}`], [rho*g/h, 'Pa', 2, `Multiply by the depth, don't divide. ${r[0]}`, `要乘以深度，不是除以。${r[1]}`],
      [p, 'N', 3, 'The number is right, but N is the unit of force. Pressure is in Pa.', '数字对了，但 N 是力的单位。压强的单位是 Pa。']], {eq:'liquid', find:'pressure', given:{distance:[h,'m'], density:[rho,'kg/m³'], gfs:[g,'N/kg']}, answer:[p,'Pa']}); });
  // pV = constant (S 2.1.3)
  [[100,60,20],[100,50,25],[120,40,30],[200,30,60]].forEach(([p1,V1,V2])=>{ const p2=p1*V1/V2, r=[`p₁V₁ = p₂V₂, so p₂ = p₁ × V₁ ÷ V₂ = ${num(p1)} × ${num(V1)} ÷ ${num(V2)} = ${val(p2,'kPa')}.`, `p₁V₁ = p₂V₂，所以 p₂ = p₁ × V₁ ÷ V₂ = ${num(p1)} × ${num(V1)} ÷ ${num(V2)} = ${val(p2,'kPa')}。`];
    P(`phys:calc:pv:${p1}-${V1}-${V2}`, 5, '2.1.3', true, `A gas has a volume of ${val(V1,'cm³')} at a pressure of ${val(p1,'kPa')}. Its volume changes to ${val(V2,'cm³')} at constant temperature. Calculate its new pressure.`,
      `一定质量的气体在 ${val(p1,'kPa')} 的压强下体积是 ${val(V1,'cm³')}。温度不变，体积变为 ${val(V2,'cm³')}。计算它新的压强。`, p2, 'kPa', [
      [p1*V2/V1, 'kPa', 1, `That is upside down: ${V2<V1 ? 'a smaller volume means a higher pressure' : 'a bigger volume means a lower pressure'}. ${r[0]}`, `上下颠倒了：${V2<V1 ? '体积变小，压强变大' : '体积变大，压强变小'}。${r[1]}`],
      [p1, 'kPa', 2, `The pressure changes when the volume changes. ${r[0]}`, `体积改变时，压强也会改变。${r[1]}`], [p1*V1, 'kPa', 2, `Divide by the new volume. ${r[0]}`, `还要除以新的体积。${r[1]}`]],
      {eq:'pv', find:'pressure', given:{p1:[p1,'kPa'], V1:[V1,'cm³'], V2:[V2,'cm³']}, answer:[p2,'kPa']}); });
  // ΔE = mcΔθ (S 2.2.2)
  [[2,20,70],[0.5,20,100],[1.5,15,35],[3,25,45]].forEach(([m,t1,t2])=>{ const c=4200, dt=t2-t1, E=m*c*dt, r=[`ΔE = mass × specific heat capacity × temperature rise = ${num(m)} × ${num(c)} × ${num(dt)} = ${val(E,'J')}.`, `ΔE = 质量 × 比热容 × 升高的温度 = ${num(m)} × ${num(c)} × ${num(dt)} = ${val(E,'J')}。`];
    P(`phys:calc:shc:${m}-${t1}-${t2}`, 5, '2.2.2', true, `How much energy is needed to heat ${val(m,'kg')} of water from ${val(t1,'°C')} to ${val(t2,'°C')}? The specific heat capacity of water is ${val(c,'J/(kg °C)')}.`,
      `把 ${val(m,'kg')} 的水从 ${val(t1,'°C')} 加热到 ${val(t2,'°C')} 需要多少能量？水的比热容是 ${val(c,'J/(kg °C)')}。`, E, 'J', [
      [m*c*t2, 'J', 1, `Use the temperature rise (${num(t2)} − ${num(t1)} = ${num(dt)} °C), not the final temperature. ${r[0]}`, `要用升高的温度（${num(t2)} − ${num(t1)} = ${num(dt)} °C），不是最后的温度。${r[1]}`],
      [c*dt, 'J', 1, `Multiply by the mass as well. ${r[0]}`, `还要乘以质量。${r[1]}`], [m*c*(t1+t2), 'J', 2, `Take the temperatures away from each other, don't add them. ${r[0]}`, `两个温度要相减，不是相加。${r[1]}`]],
      {eq:'shc', find:'energy', given:{mass:[m,'kg'], t1:[t1,'°C'], t2:[t2,'°C'], shc:[c,'J/(kg °C)']}, answer:[E,'J']}); });
  // P = I²R (S 4.5.6)
  [[2,5],[3,4],[10,0.5],[0.5,20]].forEach(([I,R])=>{ const Pw=I*I*R, r=[`Power = current² × resistance = ${num(I)}² × ${num(R)} = ${val(Pw,'W')}.`, `功率 = 电流² × 电阻 = ${num(I)}² × ${num(R)} = ${val(Pw,'W')}。`];
    P(`phys:calc:i2r:${I}-${R}`, 5, '4.5.6', true, `A current of ${val(I,'A')} flows in a cable with a resistance of ${val(R,'Ω')}. Calculate the power lost as heat in the cable.`,
      `${val(I,'A')} 的电流通过电阻为 ${val(R,'Ω')} 的电缆。计算电缆发热损失的功率。`, Pw, 'W', [
      [I*R, 'W', 1, `Square the current. ${r[0]}`, `电流要平方。${r[1]}`], [I*R*R, 'W', 1, `Square the current, not the resistance. ${r[0]}`, `要平方的是电流，不是电阻。${r[1]}`],
      [I*I*R*R, 'W', 2, `Only the current is squared. ${r[0]}`, `只有电流要平方。${r[1]}`], [Pw, 'V', 3, 'The number is right, but V is the unit of potential difference. Power is in W.', '数字对了，但 V 是电势差的单位。功率的单位是 W。']],
      {eq:'i2r', find:'power', given:{current:[I,'A'], resistance:[R,'Ω']}, answer:[Pw,'W']}); });
  // VpIp = VsIs (S 4.5.6)
  [[230,0.5,23],[240,0.2,12],[12,4,48]].forEach(([Vp,Ip,Vs])=>{ const Is=Vp*Ip/Vs, r=[`VpIp = VsIs, so Is = Vp × Ip ÷ Vs = ${num(Vp)} × ${num(Ip)} ÷ ${num(Vs)} = ${val(Is,'A')}.`, `VpIp = VsIs，所以 Is = Vp × Ip ÷ Vs = ${num(Vp)} × ${num(Ip)} ÷ ${num(Vs)} = ${val(Is,'A')}。`];
    P(`phys:calc:vi:${Vp}-${Ip}-${Vs}`, 5, '4.5.6', true, `A 100% efficient transformer has a primary voltage of ${val(Vp,'V')} and a primary current of ${val(Ip,'A')}. Its secondary voltage is ${val(Vs,'V')}. Calculate the secondary current.`,
      `一个效率为 100% 的变压器，原线圈电压是 ${val(Vp,'V')}，电流是 ${val(Ip,'A')}，副线圈电压是 ${val(Vs,'V')}。计算副线圈电流。`, Is, 'A', [
      [Vs*Ip/Vp, 'A', 1, `That is upside down: ${Vs<Vp ? 'a lower voltage means a bigger current' : 'a higher voltage means a smaller current'}. ${r[0]}`, `上下颠倒了：${Vs<Vp ? '电压降低，电流增大' : '电压升高，电流减小'}。${r[1]}`],
      [Ip, 'A', 2, `The current changes when the voltage changes. ${r[0]}`, `电压改变时，电流也会改变。${r[1]}`], [Is, 'V', 3, 'The number is right, but V is the unit of potential difference. Current is in A.', '数字对了，但 V 是电势差的单位。电流的单位是 A。']],
      {eq:'vi', find:'current', given:{Vp:[Vp,'V'], Ip:[Ip,'A'], Vs:[Vs,'V']}, answer:[Is,'A']}); });
  // Acceleration from two speeds (S 1.2)
  [[5,25,4],[8,20,3],[10,22,3],[12,20,2]].forEach(([u,v,t])=>{ const a=(v-u)/t, r=[`Acceleration = change in velocity ÷ time = (${num(v)} − ${num(u)}) ÷ ${num(t)} = ${val(a,'m/s²')}.`, `加速度 = 速度的变化量 ÷ 时间 = (${num(v)} − ${num(u)}) ÷ ${num(t)} = ${val(a,'m/s²')}。`];
    P(`phys:calc:accel:uv:${u}-${v}-${t}`, 4.5, '1.2', true, `A car speeds up from ${val(u,'m/s')} to ${val(v,'m/s')} in ${val(t,'s')}. Calculate its acceleration.`, `一辆汽车在 ${val(t,'s')} 内从 ${val(u,'m/s')} 加速到 ${val(v,'m/s')}。计算它的加速度。`, a, 'm/s²', [
      [v/t, 'm/s²', u ? 1 : 3, `Use the change in velocity (${num(v)} − ${num(u)} = ${num(v-u)} m/s), not the final velocity. ${r[0]}`, `要用速度的变化量（${num(v)} − ${num(u)} = ${num(v-u)} m/s），不是最后的速度。${r[1]}`],
      [(v-u)*t, 'm/s²', 1, `Divide by the time, don't multiply. ${r[0]}`, `要除以时间，不是乘以。${r[1]}`], [(v+u)/t, 'm/s²', 2, `Take the speeds away from each other, don't add them. ${r[0]}`, `两个速度要相减，不是相加。${r[1]}`],
      [a, 'm/s', 2, 'The number is right, but m/s is the unit of speed. Acceleration is in m/s².', '数字对了，但 m/s 是速度的单位。加速度的单位是 m/s²。']],
      {eq:'accel2', find:'acceleration', given:{u:[u,'m/s'], v:[v,'m/s'], time:[t,'s']}, answer:[a,'m/s²']}); });
  return out;
}

// ---------- The electromagnetic spectrum ----------
const COLOURS = [['red','红'], ['orange','橙'], ['yellow','黄'], ['green','绿'], ['blue','蓝'], ['indigo','靛'], ['violet','紫']];   // longest wavelength first
function spectrum(D){
  const out=[], WV=D.waves, byId=Object.fromEntries(WV.map(w=>[w.id, w]));
  const order=[`From the longest wavelength to the shortest: ${WV.map(w=>w.name).join(', ')}.`, `波长从长到短：${WV.map(w=>w.zh).join('、')}。`];
  const forward=[`From the lowest frequency to the highest: ${WV.map(w=>w.name).join(', ')}.`, `频率从低到高：${WV.map(w=>w.zh).join('、')}。`];
  // Uses and harmful effects
  D.uses.forEach(u=>{ const right=byId[u.wave]; if(!right){ console.warn('em-uses.csv ('+u.id+'): no wave "'+u.wave+'" in waves.csv'); return; }
    const firstUse=w=>D.uses.find(x=>x.wave===w.id && x.kind===u.kind && x!==u);
    const w=WV.filter(x=>x!==right && !u.not.includes(x.id)).map(x=>{ const near=Math.abs(x.order-right.order)===1, f=firstUse(x);
      const r=u.kind==='use' ? [`${cap(right.name)}: ${u.text}.${f ? ` ${cap(x.name)} ${x.id==='micro'||x.id==='xray'||x.id==='gamma'||x.id==='radio' ? 'are' : 'is'} used for ${f.text}.` : ''}`, `${right.zh}：${u.zh}。${f ? `${x.zh}用于${f.zh}。` : ''}`]
        : [`${cap(right.name)}: ${u.text}.${f ? ` Too much ${x.name} causes ${f.text}.` : ''}`, `${right.zh}：${u.zh}。${f ? `过量的${x.zh}会导致${f.zh}。` : ''}`];
      return W(esc(x.name), near ? 1 : 2, ...r); });
    out.push(u.kind==='use'
      ? Q(`phys:em:use:${u.id}`, u.lv, u.syl.length ? u.syl : ['3.3'], u.ext, 'Which part of the electromagnetic spectrum is used for this?', '这是电磁波谱的哪一部分的用途？', `<p class="gen-big gen-name">${esc(cap(u.text))}</p>`, esc(u.zh), esc(right.name), w)
      : Q(`phys:em:harm:${u.id}`, u.lv+.5, u.syl.length ? u.syl : ['3.3'], u.ext, 'Too much of which radiation can cause this?', '过量的哪种辐射会导致这种伤害？', `<p class="gen-big gen-name">${esc(cap(u.text))}</p>`, esc(u.zh), esc(right.name), w)); });
  // The order: every set of four, asked one of four ways
  const ASK=[['Which has the longest wavelength?', '哪个波长最长？', l=>l[0], order], ['Which has the highest frequency?', '哪个频率最高？', l=>l[l.length-1], forward],
             ['Which has the shortest wavelength?', '哪个波长最短？', l=>l[l.length-1], order], ['Which has the lowest frequency?', '哪个频率最低？', l=>l[0], forward]];
  let n=0;
  for(let a=0;a<WV.length;a++) for(let b=a+1;b<WV.length;b++) for(let c=b+1;c<WV.length;c++) for(let d=c+1;d<WV.length;d++){
    const set=[WV[a],WV[b],WV[c],WV[d]], [en, zh, pick, why]=ASK[n++%4], right=pick(set), abc=[...set].sort((x,y)=>x.name.localeCompare(y.name));
    const w=set.filter(x=>x!==right).map(x=>W(esc(x.name), 1, ...why));
    out.push(Q(`phys:em:order:${set.map(x=>x.id).join('-')}`, 3, '3.3', false, en, zh, `<p class="gen-sub">${esc(abc.map(x=>x.name).join(' · '))}</p>`, esc(abc.map(x=>x.zh).join('、')), esc(right.name), w));
  }
  // The colours of the visible spectrum (3.2.4)
  const cWhy=[`From the longest wavelength to the shortest: ${COLOURS.map(c=>c[0]).join(', ')}.`, `波长从长到短：${COLOURS.map(c=>c[1]).join('、')}。`];
  const cWhyF=[`From the lowest frequency to the highest: ${COLOURS.map(c=>c[0]).join(', ')}.`, `频率从低到高：${COLOURS.map(c=>c[1]).join('、')}。`];
  let k=0;
  for(let a=0;a<7;a++) for(let b=a+1;b<7;b++) for(let c=b+1;c<7;c++) for(let d=c+1;d<7;d++){ if((a+b+c+d)%3) continue;   // a third of the sets is plenty
    const set=[COLOURS[a],COLOURS[b],COLOURS[c],COLOURS[d]], long=k++%2===0, right=long ? set[0] : set[3], why=long ? cWhy : cWhyF, abc=[...set].sort((x,y)=>x[0].localeCompare(y[0]));
    out.push(Q(`phys:colour:${set.map(x=>x[0]).join('-')}`, 2.5, '3.2.4', false, long ? 'Which colour of light has the longest wavelength?' : 'Which colour of light has the highest frequency?',
      long ? '哪种颜色的光波长最长？' : '哪种颜色的光频率最高？', `<p class="gen-sub">${esc(abc.map(x=>x[0]).join(' · '))}</p>`, esc(abc.map(x=>x[1]).join('、')),
      esc(right[0]), set.filter(x=>x!==right).map(x=>W(esc(x[0]), 1, ...why))));
  }
  return out;
}

// ---------- Inside the nucleus: counting, decay and half-life ----------
const SYM = ['','H','He','Li','Be','B','C','N','O','F','Ne','Na','Mg','Al','Si','P','S','Cl','Ar','K','Ca','Sc','Ti','V','Cr','Mn','Fe','Co','Ni','Cu','Zn',
  'Ga','Ge','As','Se','Br','Kr','Rb','Sr','Y','Zr','Nb','Mo','Tc','Ru','Rh','Pd','Ag','Cd','In','Sn','Sb','Te','I','Xe','Cs','Ba','La','Ce','Pr','Nd','Pm',
  'Sm','Eu','Gd','Tb','Dy','Ho','Er','Tm','Yb','Lu','Hf','Ta','W','Re','Os','Ir','Pt','Au','Hg','Tl','Pb','Bi','Po','At','Rn','Fr','Ra','Ac','Th','Pa','U',
  'Np','Pu','Am','Cm','Bk','Cf'];
const nuc = (A, Z, sym) => `<span class="nuc"><span class="nuc-n"><span>${A}</span><span>${Z}</span></span><span class="nuc-s">${esc(sym)}</span></span>`;
const nucZ = (A, Z) => nuc(A, Z, SYM[Z]||'?');
function nucleus(D){
  const out=[];
  D.nucs.forEach(x=>{ const {a:A, z:Z}=x, N=A-Z, show=`<p class="gen-big">${nuc(A, Z, x.sym)}</p><p class="gen-sub">${esc(x.name)}</p>`, zh=esc(x.zh), lv=x.lv;
    const nWhy=[`Neutrons = nucleon number − proton number = ${A} − ${Z} = ${N}.`, `中子数 = 核子数 − 质子数 = ${A} − ${Z} = ${N}。`];
    out.push(Q(`phys:nuc:n:${x.id}`, lv, '5.1.2', false, 'How many neutrons are in this nucleus?', '这个原子核里有多少个中子？', show, zh, String(N), [
      W(String(Z), 1, `${Z} is the proton number. ${nWhy[0]}`, `${Z} 是质子数。${nWhy[1]}`),
      W(String(A), 1, `${A} is the nucleon number: protons and neutrons together. ${nWhy[0]}`, `${A} 是核子数（质子 + 中子）。${nWhy[1]}`),
      W(String(A+Z), 1, `Take the protons away, don't add them. ${nWhy[0]}`, `要减去质子数，不是加上。${nWhy[1]}`), W(String(N+1), 3, ...nWhy), W(String(N+2), 3, ...nWhy)]));
    const aWhy=[`The nucleon number is the top number: the protons and neutrons together, ${A}.`, `核子数是上面的数字，即质子和中子的总数：${A}。`];
    out.push(Q(`phys:nuc:a:${x.id}`, lv-.5, '5.1.2', false, 'What is the nucleon number?', '核子数是多少？', show, zh, String(A), [
      W(String(Z), 1, `${Z} is the proton number. ${aWhy[0]}`, `${Z} 是质子数。${aWhy[1]}`), N!==Z ? W(String(N), 1, `${N} is the number of neutrons. ${aWhy[0]}`, `${N} 是中子数。${aWhy[1]}`) : null,
      W(String(A+Z), 2, ...aWhy), W(String(A+1), 3, ...aWhy)]));
    const zWhy=[`The proton number is the bottom number: ${Z}.`, `质子数是下面的数字：${Z}。`];
    out.push(Q(`phys:nuc:z:${x.id}`, lv-.5, '5.1.2', false, 'What is the proton number?', '质子数是多少？', show, zh, String(Z), [
      W(String(A), 1, `${A} is the nucleon number. ${zWhy[0]}`, `${A} 是核子数。${zWhy[1]}`), N!==Z ? W(String(N), 1, `${N} is the number of neutrons. ${zWhy[0]}`, `${N} 是中子数。${zWhy[1]}`) : null,
      W(String(Z+1), 3, ...zWhy), W(String(Z+2), 3, ...zWhy)]));
    // Decay (Supplement 5.2.3: decay equations in nuclide notation)
    if(x.decay==='alpha' || x.decay==='beta'){
      const al=x.decay==='alpha', A2=al ? A-4 : A, Z2=al ? Z-2 : Z+1, right=nucZ(A2, Z2);
      const why=al ? [`An alpha particle is 2 protons and 2 neutrons (⁴₂He): the nucleon number goes down by 4 and the proton number by 2, so it becomes ${SYM[Z2]}.`, `α 粒子由 2 个质子和 2 个中子组成（⁴₂He）：核子数减少 4，质子数减少 2，所以变成 ${SYM[Z2]}。`]
        : [`In beta decay a neutron changes into a proton and an electron, and the electron leaves: the proton number goes up by 1 and the nucleon number stays the same, so it becomes ${SYM[Z2]}.`, `β 衰变时一个中子变成一个质子和一个电子，电子被放出：质子数增加 1，核子数不变，所以变成 ${SYM[Z2]}。`];
      const w=al ? [W(nucZ(A-4, Z+2), 1, ...why), W(nuc(A-4, Z, x.sym), 1, `The proton number changes too, so it is a new element. ${why[0]}`, `质子数也会改变，所以变成了新元素。${why[1]}`),
          W(nucZ(A, Z-2), 1, ...why), W(nucZ(A-2, Z-2), 2, ...why), W(nucZ(A, Z+1), 2, `That is beta decay. ${why[0]}`, `那是 β 衰变。${why[1]}`)]
        : [W(nucZ(A, Z-1), 1, `The proton number goes up, not down. ${why[0]}`, `质子数增加，不是减少。${why[1]}`), W(nucZ(A-1, Z+1), 1, `The nucleon number stays the same: an electron has almost no mass. ${why[0]}`, `核子数不变：电子的质量几乎可以忽略。${why[1]}`),
          W(nuc(A, Z, x.sym), 2, `The proton number changes, so it is a new element. ${why[0]}`, `质子数改变了，所以变成了新元素。${why[1]}`), W(nucZ(A-4, Z-2), 2, `That is alpha decay. ${why[0]}`, `那是 α 衰变。${why[1]}`)];
      out.push(Q(`phys:nuc:decay:${x.id}`, lv+1, '5.2.3', true, al ? 'It emits an alpha particle. Which nucleus is left?' : 'It emits a beta particle. Which nucleus is left?',
        al ? '它放出一个 α 粒子。剩下的是哪个原子核？' : '它放出一个 β 粒子。剩下的是哪个原子核？', show, zh, right, w));
    }
  });
  // Half-life (Core 5.2.4): what is left after a number of half-lives
  [[800,2,'h',6],[1200,3,'days',9],[640,5,'min',20],[960,4,'years',12],[500,10,'s',30],[1600,8,'h',32]].forEach(([C0,h,u,t])=>{ const n=t/h, C=C0/Math.pow(2,n), U={h:['hours','小时'], days:['days','天'], min:['minutes','分钟'], years:['years','年'], s:['seconds','秒']}[u];
    const r=[`${num(t)} ${U[0]} is ${n} half-li${n===1?'fe':'ves'} of ${num(h)} ${U[0]}: ${[...Array(n)].reduce((s,_,i)=>s+' → '+num(C0/Math.pow(2,i+1)), num(C0))}.`, `${num(t)} ${U[1]}是 ${n} 个半衰期（每个 ${num(h)} ${U[1]}）：${[...Array(n)].reduce((s,_,i)=>s+' → '+num(C0/Math.pow(2,i+1)), num(C0))}。`];
    const w=[[C0/n, 1, `Halve it once for each half-life; don't divide by the number of half-lives. ${r[0]}`, `每过一个半衰期减半一次，不是除以半衰期的个数。${r[1]}`],
      [C0/(2*n), 1, `Halve it once for each half-life: ${n} halvings is ÷ ${Math.pow(2,n)}, not ÷ ${2*n}. ${r[0]}`, `每过一个半衰期减半一次：减半 ${n} 次是 ÷ ${Math.pow(2,n)}，不是 ÷ ${2*n}。${r[1]}`],
      [C0/Math.pow(2,n-1), 2, ...r], [C0/Math.pow(2,n+1), 2, ...r], [C0/2, 3, `Halve it once for each half-life, not just once. ${r[0]}`, `每过一个半衰期减半一次，不是只减半一次。${r[1]}`]].filter(([v])=>v>0 && !same(v, C)).map(([v,p,a,b])=>W(esc(val(v,'counts/min')), p, a, b));
    out.push(Q(`phys:hl:${C0}-${h}${u}-${t}`, n>2 ? 3.5 : 3, '5.2.4', false, 'Calculate', '计算',
      `<p class="gen-text">${esc(`A radioactive source has a half-life of ${num(h)} ${U[0]}. Its count rate is ${val(C0,'counts/min')}. What is its count rate after ${num(t)} ${U[0]}? (Ignore background radiation.)`)}</p>`,
      esc(`某放射源的半衰期是 ${num(h)} ${U[1]}，计数率是 ${val(C0,'counts/min')}。${num(t)} ${U[1]}后它的计数率是多少？（不考虑本底辐射。）`), esc(val(C,'counts/min')), w, false,
      {eq:'halflife', find:'count', given:{c0:[C0,''], half:[h,u], t:[t,u]}, answer:[C,'counts/min']}));
  });
  // Half-life from two count rates
  [[800,100,6,'h'],[1000,250,10,'days'],[1200,150,24,'min'],[640,40,20,'s']].forEach(([C0,C,t,u])=>{ const n=Math.log2(C0/C), h=t/n, U={h:['hours','小时'], days:['days','天'], min:['minutes','分钟'], s:['seconds','秒']}[u];
    const steps=[...Array(n)].reduce((s,_,i)=>s+' → '+num(C0/Math.pow(2,i+1)), num(C0)), r=[`${steps}: that is ${n} half-lives in ${num(t)} ${U[0]}, so the half-life is ${num(t)} ÷ ${n} = ${num(h)} ${U[0]}.`, `${steps}：${num(t)} ${U[1]}内经过了 ${n} 个半衰期，所以半衰期是 ${num(t)} ÷ ${n} = ${num(h)} ${U[1]}。`];
    const w=[[t/2, 1, `It halved ${n} times, not once. ${r[0]}`, `减半了 ${n} 次，不是一次。${r[1]}`], [t/(C0/C), 1, `Count the halvings: ${C0/C} times smaller is ${n} half-lives. ${r[0]}`, `数一数减半的次数：变为原来的 1/${C0/C} 是 ${n} 个半衰期。${r[1]}`],
      [t*n, 2, `Divide the time by the number of half-lives. ${r[0]}`, `要用时间除以半衰期的个数。${r[1]}`], [t, 3, ...r]].filter(([v])=>v>0 && !same(v, h)).map(([v,p,a,b])=>W(esc(`${num(v)} ${U[0]}`), p, a, b));
    out.push(Q(`phys:hl:find:${C0}-${C}-${t}${u}`, 4, '5.2.4', false, 'Calculate', '计算',
      `<p class="gen-text">${esc(`The count rate of a radioactive source falls from ${val(C0,'counts/min')} to ${val(C,'counts/min')} in ${num(t)} ${U[0]}. What is its half-life? (Ignore background radiation.)`)}</p>`,
      esc(`某放射源的计数率在 ${num(t)} ${U[1]}内从 ${val(C0,'counts/min')} 降到 ${val(C,'counts/min')}。它的半衰期是多少？（不考虑本底辐射。）`), esc(`${num(h)} ${U[0]}`), w, false,
      {eq:'halflife2', find:'half', given:{c0:[C0,''], c:[C,''], t:[t,u]}, answer:[h,u]}));
  });
  return out;
}

window.AEA_GEN = {
  subject: 'physics',              // the topic choice is saved as aea:science:physics (both sides)
  title: 'Physics practice', titleZh: '物理练习',
  files: ['quantities', 'waves', 'em-uses', 'nuclides'],   // extra tables app.js loads from the page's content folder (both sides)
  // Cambridge IGCSE Physics (0625): the six topics, and their subtopics as the tick boxes (Physics topics are big, so a
  // student ticks e.g. 1.2 Motion and 1.4 Density, not the whole of 1 Motion, forces and energy; a group's own box ticks all of it)
  groups: [
    {n:'1', name:'Motion, forces and energy', zh:'运动、力和能量'},
    {n:'2', name:'Thermal physics', zh:'热学'},
    {n:'3', name:'Waves', zh:'波'},
    {n:'4', name:'Electricity and magnetism', zh:'电和磁'},
    {n:'5', name:'Nuclear physics', zh:'核物理'},
    {n:'6', name:'Space physics', zh:'空间物理'}
  ],
  topics: [
    {n:'1.1', name:'Physical quantities and measurement', zh:'物理量和测量'},
    {n:'1.2', name:'Motion', zh:'运动'},
    {n:'1.3', name:'Mass and weight', zh:'质量和重力'},
    {n:'1.4', name:'Density', zh:'密度'},
    {n:'1.5', name:'Forces', zh:'力'},
    {n:'1.6', name:'Momentum', zh:'动量'},
    {n:'1.7', name:'Energy, work and power', zh:'能量、功和功率'},
    {n:'1.8', name:'Pressure', zh:'压强'},
    {n:'2.1', name:'Kinetic particle model of matter', zh:'物质的分子动理论模型'},
    {n:'2.2', name:'Thermal properties and temperature', zh:'热学性质和温度'},
    {n:'2.3', name:'Transfer of thermal energy', zh:'热能的传递'},
    {n:'3.1', name:'General properties of waves', zh:'波的一般性质'},
    {n:'3.2', name:'Light', zh:'光'},
    {n:'3.3', name:'Electromagnetic spectrum', zh:'电磁波谱'},
    {n:'3.4', name:'Sound', zh:'声音'},
    {n:'4.1', name:'Simple phenomena of magnetism', zh:'简单的磁现象'},
    {n:'4.2', name:'Electrical quantities', zh:'电学量'},
    {n:'4.3', name:'Electric circuits', zh:'电路'},
    {n:'4.4', name:'Electrical safety', zh:'用电安全'},
    {n:'4.5', name:'Electromagnetic effects', zh:'电磁效应'},
    {n:'5.1', name:'The nuclear model of the atom', zh:'原子的核式模型'},
    {n:'5.2', name:'Radioactivity', zh:'放射性'},
    {n:'6.1', name:'Earth and the Solar System', zh:'地球和太阳系'},
    {n:'6.2', name:'Stars and the Universe', zh:'恒星和宇宙'}
  ],
  // The English topic page's three columns (the games by key, in order)
  columns: [
    {key:'phys',    name:'Physics',    games:['phunit', 'pheq', 'phcalc', 'phem', 'phnuc']},
    {key:'vocab',   name:'Vocabulary', games:['match', 'meaning', 'tf']},
    {key:'explain', name:'Explaining', games:['gap', 'rw', 'build', 'evidence', 'error']}
  ],
  build(T){
    const D=readTables(T);
    return [
      {key:'phunit', name:'Units', zh:'单位', blurb:'Which unit goes with which quantity? Newtons, joules, watts and more.', zhBlurb:'物理量和单位配对：牛、焦、瓦等等。', items:units(D)},
      {key:'pheq', name:'Equations', zh:'公式', blurb:'Choose the right equation in words, and rearrange it.', zhBlurb:'选出正确的文字公式，并学会变形。', items:equations(D)},
      {key:'phcalc', name:'Calculate it', zh:'计算', blurb:'Read the question, use the equation, and watch the units.', zhBlurb:'读懂英文题目，用对公式，注意单位。', items:calcs(D)},
      {key:'phem', name:'EM spectrum', zh:'电磁波谱', blurb:'The order of the waves, their uses and their dangers.', zhBlurb:'电磁波的顺序、用途和危害。', items:spectrum(D)},
      {key:'phnuc', name:'Inside the nucleus', zh:'原子核', blurb:'Protons, neutrons, alpha and beta decay, and half-life.', zhBlurb:'质子、中子、α 和 β 衰变，以及半衰期。', items:nucleus(D)}
    ].map(g=>Object.assign({min:4}, g, {items:g.items.filter(q=>{ const ok=q.wrong.length>=3; if(!ok) console.warn(g.key+': '+q.id+' has fewer than 3 wrong answers'); return ok; })}));
  }
};
})();
