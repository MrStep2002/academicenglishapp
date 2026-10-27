/* MATHS · NUMBER (tester, 27 Oct 2026). Every question is made here, fresh each time: nothing is written in a CSV.
   A skill: {key, name, zh, from, to, gen(level)}. Levels: 1 Foundation, 2 Foundation+, 3 Intermediate, 4 Intermediate+, 5 Advanced.
   gen(level) returns a question (or null: the engine just asks again):
     prompt   what the student sees (HTML)
     ans      the answer (a number)
     wrongs   [{v, why, txt}]: wrong answers that come from real mistakes, each saying what went wrong; it is shown when a
              student chooses or types that answer. txt: how to show it when that differs from the number (e.g. "3.400").
     work     the working, shown after the answer (HTML)
     stmt(v)  the question as a statement with the value v, for True or false (default: "prompt = v")
     choice   true: a "Which of these…" question (left out of Type the answer)
     long     true: the prompt is a sentence (shown smaller)
     zh       the question in Chinese (HTML), when it has words; shown when a student hovers over it or holds it
     zstmt(v) stmt in Chinese
     pre/suf  around the answer when it is shown (¥, %)
     step     (rounding) the gap between neighbouring answers, for extra wrong answers when there are too few
   Below the skills: WHICH (Which calculation? word problems) and SPOT (Spot the mistake workings), by level. */
(function(){
'use strict';
const R = (a,b) => a + Math.floor(Math.random()*(b-a+1));
const pick = a => a[Math.floor(Math.random()*a.length)];
const chance = p => Math.random() < p;
const fix = x => Math.round(x*1e9)/1e9;   // 0.1 + 0.2 = 0.3, not 0.30000000000000004
const nz = n => n%10===0 ? n+R(1,9) : n;  // never a multiple of 10
const isInt = x => Math.abs(x-Math.round(x)) < 1e-9;
const gcd = (a,b) => b ? gcd(b, a%b) : Math.abs(a);
// Numbers as students see them: a real minus sign, commas from 10,000
function fmt(x){
  x = fix(+x); if(Object.is(x,-0)) x = 0;
  const neg = x<0; let s = String(Math.abs(x));
  if(/e/i.test(s)) s = Math.abs(x).toFixed(12).replace(/\.?0+$/,'');
  let [i,d] = s.split('.'); if(i.length>=5) i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (neg?'−':'') + i + (d ? '.'+d : '');
}
const par = x => fix(x)<0 ? `(${fmt(x)})` : fmt(x);    // a negative number inside a calculation: in brackets
const W = (v, why, txt) => ({v:fix(v), why:why||'', txt:txt||null});
const sup = n => `<sup>${n}</sup>`;
const fr = (t,b) => `<span class="fr"><span>${t}</span><span>${b}</span></span>`;
const roundTo = (x,step) => fix(Math.round(fix(x/step))*step);
const truncTo = (x,step) => fix(Math.floor(fix(x/step))*step);
const sfStep = (x,s) => Math.pow(10, Math.floor(Math.log10(Math.abs(x)))-s+1);
const roundSF = (x,s) => roundTo(x, sfStep(x,s));
const truncSF = (x,s) => truncTo(x, sfStep(x,s));
const places = m => { const k=Math.round(Math.log10(m)); return (['no places','one place','two places','three places','four places','five places','six places'][k]) || k+' places'; };
// Column methods done wrong (for the wrong answers): forgetting to carry, swapping the digits round, not taking the 1 away
const digs = (n,L) => String(n).padStart(L,'0').split('').map(Number);
function noCarry(A,B){ const L=Math.max(String(A).length,String(B).length), a=digs(A,L), b=digs(B,L); return +a.map((x,i)=>i===0?String(x+b[i]):String((x+b[i])%10)).join(''); }
function swapSub(A,B){ const L=String(A).length, a=digs(A,L), b=digs(B,L); return +a.map((x,i)=>Math.abs(x-b[i])).join(''); }
function noDec(A,B){ const L=String(A).length, a=digs(A,L), b=digs(B,L); return +a.map((x,i)=>x<b[i]?x+10-b[i]:x-b[i]).join(''); }
const hasCarry = (A,B) => noCarry(A,B)!==A+B;
const hasBorrow = (A,B) => swapSub(A,B)!==A-B;
const smallestFactor = n => { for(let d=2; d*d<=n; d++) if(n%d===0) return d; return n; };
const NAMES = ['Mia','Leo','Wei','Ana','Ben','Mei','Sam','Lin','Zoe','Hao','Lily','Tom','Jun','Ella','Kai','Yan'];
const two = () => { const a=pick(NAMES); let b=pick(NAMES); while(b===a) b=pick(NAMES); return [a,b]; };

// ================================ SKILLS ================================
const SKILLS = [

{key:'times', name:'Times tables and division', zh:'乘法与除法', from:1, to:5, gen(L){
  if(L<=2){
    const a=pick(L===1?[2,3,4,5,10]:[3,4,6,7,8,9,11,12]), b=R(L===1?2:3, L===1?10:12), n=a*b;
    if(L===2 && chance(.4)) return {prompt:`${n} ÷ ${a}`, ans:b, work:`${a} × ${b} = ${n}, so ${n} ÷ ${a} = ${b}.`,
      wrongs:[W(b+1,`${a} × ${b+1} = ${a*(b+1)}, not ${n}.`), W(b-1,`${a} × ${b-1} = ${a*(b-1)}, not ${n}.`), W(n-a,`That is ${n} − ${a}. ÷ asks how many ${a}s make ${n}.`)]};
    const [x,y]=chance(.5)?[a,b]:[b,a];
    return {prompt:`${x} × ${y}`, ans:n, work:`${x} × ${y} = ${n}.`,
      wrongs:[W(a*(b-1),`That is ${a} × ${b-1}: one ${a} too few.`), W(a*(b+1),`That is ${a} × ${b+1}: one ${a} too many.`),
        W(a+b,`That is ${a} + ${b}. ${x} × ${y} means ${x} lots of ${y}.`), W((a+1)*b,`That is ${a+1} × ${b}.`)]};
  }
  if(L===3){
    if(chance(.6)){ const a=nz(R(12,48)), b=R(3,9), n=a*b, t=Math.floor(a/10), u=a%10, c=Math.floor(u*b/10);
      const ws=[W(t*10*b+u,`You multiplied the tens but not the units: ${u} × ${b} = ${u*b} is missing.`), W(n+b,`That is ${a+1} × ${b}.`)];
      if(c) ws.unshift(W(n-c*10,`You forgot to carry the ${c} into the tens: ${u} × ${b} = ${u*b}.`), W(+(`${t*b}${u*b}`),`${t*10} × ${b} = ${t*10*b} and ${u} × ${b} = ${u*b}. Add them: don't write them side by side.`));
      return {prompt:`${a} × ${b}`, ans:n, work:`${t*10} × ${b} = ${t*10*b} and ${u} × ${b} = ${u*b}, so ${a} × ${b} = ${t*10*b} + ${u*b} = ${n}.`, wrongs:ws}; }
    const b=R(3,9), q=R(11, Math.max(11, Math.floor(99/b))), n=b*q;
    return {prompt:`${n} ÷ ${b}`, ans:q, work:`${b} × ${q} = ${n}, so ${n} ÷ ${b} = ${q}.`,
      wrongs:[W(q+1,`${b} × ${q+1} = ${b*(q+1)}, not ${n}.`), W(q-1,`${b} × ${q-1} = ${b*(q-1)}, not ${n}.`), W(q+10,`${b} × ${q+10} = ${b*(q+10)}: check the tens.`)]};
  }
  if(L===4){
    if(chance(.6)){ const a=nz(R(12,39)), b=nz(R(11,29)), at=Math.floor(a/10), au=a%10, bt=Math.floor(b/10), bu=b%10, n=a*b;
      return {prompt:`${a} × ${b}`, ans:n, work:`${a} × ${bt*10} = ${a*bt*10} and ${a} × ${bu} = ${a*bu}, so ${a} × ${b} = ${a*bt*10} + ${a*bu} = ${n}.`,
        wrongs:[W(at*bt*100+au*bu,`You only did tens × tens and units × units. ${at*10} × ${bu} and ${au} × ${bt*10} are missing.`),
          W(a*bu+a*bt,`The ${bt} in ${b} is ${bt} ten${bt>1?'s':''}: ${a} × ${bt*10} = ${a*bt*10}, not ${a*bt}.`),
          W(a*bt*10,`That is only ${a} × ${bt*10}. Add ${a} × ${bu} = ${a*bu}.`)]}; }
    const b=R(3,9), q=R(Math.max(12,Math.ceil(120/b)), Math.floor(999/b)), n=b*q;
    return {prompt:`${n} ÷ ${b}`, ans:q, work:`${b} × ${q} = ${n}, so ${n} ÷ ${b} = ${q}.`,
      wrongs:[W(q+1,`${b} × ${q+1} = ${b*(q+1)}, not ${n}.`), W(q-1,`${b} × ${q-1} = ${b*(q-1)}, not ${n}.`), W(q*10,`${b} × ${q*10} = ${fmt(b*q*10)}: check the place value.`)]};
  }
  const k=R(1,4);
  if(k===1){ const a=R(2,9), b=R(2,9), n=a*b;
    return {prompt:`0.${a} × 0.${b}`, ans:n/100, work:`${a} × ${b} = ${n}. There are two decimal places in the question, so there are two in the answer: ${fmt(n/100)}.`,
      wrongs:[W(n/10,`Count the decimal places: 0.${a} and 0.${b} have two between them, so the answer needs two: ${fmt(n/100)}.`),
        W(n/1000,`Too many decimal places: there are only two in the question.`), W(n,`${a} × ${b} = ${n}, but 0.${a} × 0.${b} is less than 1.`)]}; }
  if(k===2){ const a=R(3,9), b=R(2,9), n=a*b;
    return {prompt:`${a} × 0.${b}`, ans:n/10, work:`${a} × ${b} = ${n}, and there is one decimal place in the question: ${fmt(n/10)}.`,
      wrongs:[W(n,`Multiplying by 0.${b} makes a number smaller: ${fmt(n/10)}.`), W(n/100,`Only one decimal place: ${fmt(n/10)}.`), W(a+b/10,`That is ${a} + 0.${b}.`)]}; }
  if(k===3){ const q=R(2,9), b=R(2,9), n=q*b;
    return {prompt:`${fmt(n/10)} ÷ 0.${b}`, ans:q, work:`Multiply both numbers by 10: ${n} ÷ ${b} = ${q}.`,
      wrongs:[W(q/10,`Dividing by a number less than 1 makes it bigger. Multiply both by 10: ${n} ÷ ${b} = ${q}.`),
        W(q*10,`Multiply both numbers by 10, not just one: ${n} ÷ ${b} = ${q}.`), W(n*b/100,`That is ${fmt(n/10)} × 0.${b}. ÷ asks how many 0.${b}s make ${fmt(n/10)}.`)]}; }
  const b=R(2,9), t=R(2,9);
  return {prompt:`0.${b} × ${t*10}`, ans:b*t, work:`0.${b} × ${t*10} = ${b} × ${t} = ${b*t}.`,
    wrongs:[W(b*t*10,`0.${b} is less than 1, so 0.${b} × ${t*10} is less than ${t*10}.`), W(b*t/10,`The decimal place in 0.${b} and the zero in ${t*10} cancel out: ${b} × ${t} = ${b*t}.`), W(t*10+b/10,`That is ${t*10} + 0.${b}.`)]};
}},

{key:'addsub', name:'Adding and subtracting', zh:'加法与减法', from:1, to:5, gen(L){
  const add=chance(.5);
  if(L<=2){
    const big=L===2; let a,b;
    if(add){ for(let i=0;i<30;i++){ a=big?R(234,789):R(15,69); b=big?R(118,399):R(13,29); if(hasCarry(a,b)||chance(.15)) break; }
      const n=a+b, ws=[];
      if(hasCarry(a,b)) ws.push(W(noCarry(a,b),`You forgot to carry: when a column makes 10 or more, carry the 1 into the next column.`));
      ws.push(W(n+10,`Check the tens column: that's ten too many.`), W(n-10,`Check the tens column: that's ten too few.`), W(Math.abs(a-b),`That is ${a} − ${b}. + means add.`));
      return {prompt:`${a} + ${b}`, ans:n, work:`${a} + ${b} = ${n}.`, wrongs:ws}; }
    for(let i=0;i<30;i++){ a=big?R(412,985):R(41,95); b=big?R(128,a-60):R(13,a-11); if(hasBorrow(a,b)||chance(.15)) break; }
    const n=a-b, ws=[];
    if(hasBorrow(a,b)){ ws.push(W(swapSub(a,b),`When the top digit is smaller, exchange from the next column. Don't swap the digits round.`)); ws.push(W(noDec(a,b),`You exchanged, but didn't take the 1 away from the next column.`)); }
    ws.push(W(a+b,`That is ${a} + ${b}. − means take away.`), W(n+10,`Check the tens column.`));
    return {prompt:`${a} − ${b}`, ans:n, work:`${a} − ${b} = ${n}.`, wrongs:ws};
  }
  if(L===3){
    if(add){ const a=nz(R(12,95))/10, b=R(105,895)/100, n=fix(a+b), aw=Math.floor(a), ad=Math.round((a-aw)*10), bw=Math.floor(b), bd=Math.round((b-bw)*100), ws=[];
      if(ad+bd<100) ws.push(W(aw+bw+(ad+bd)/100,`Line up the decimal points: ${fmt(a)} is ${a.toFixed(2)}, so ${a.toFixed(2)} + ${fmt(b)} = ${fmt(n)}.`));
      ws.push(W(n+1,`Check the whole numbers: ${aw} + ${bw}, plus anything carried.`), W(n-0.1,`Check the tenths column.`), W(n+0.1,`Check the tenths column.`));
      return {prompt:`${fmt(a)} + ${fmt(b)}`, ans:n, work:`Line up the decimal points: ${a.toFixed(2)} + ${fmt(b)} = ${fmt(n)}.`, wrongs:ws}; }
    const a=nz(R(41,95))/10, b=R(105, Math.round(a*100)-55)/100, n=fix(a-b), A=Math.round(a*100), B=Math.round(b*100), ws=[];
    if(hasBorrow(A,B)){ ws.push(W(swapSub(A,B)/100,`Write ${fmt(a)} as ${a.toFixed(2)} and exchange when the top digit is smaller. Don't swap the digits round.`)); ws.push(W(noDec(A,B)/100,`You exchanged, but didn't take the 1 away from the next column.`)); }
    ws.push(W(n+1,`Check the whole numbers.`), W(fix(a+b),`That is ${fmt(a)} + ${fmt(b)}.`));
    return {prompt:`${fmt(a)} − ${fmt(b)}`, ans:n, work:`${a.toFixed(2)} − ${fmt(b)} = ${fmt(n)}.`, wrongs:ws};
  }
  if(L===4){
    if(!add){ const a=R(5,20), b=(R(1,a-2)*100+R(5,95))/100, n=fix(a-b), bw=Math.floor(b);
      return {prompt:`${a} − ${fmt(b)}`, ans:n, work:`Write ${a} as ${a}.00: ${a}.00 − ${fmt(b)} = ${fmt(n)}.`,
        wrongs:[W(a-bw+fix(b-bw),`Write ${a} as ${a}.00 and take away all of ${fmt(b)}: ${fmt(n)}.`), W(n+1,`You exchanged, but didn't take the 1 away from the ${a}.`), W(fix(a+b),`That is ${a} + ${fmt(b)}.`)]}; }
    const x=R(105,995)/100, y=nz(R(12,95))/10, z=R(5,95)/100, n=fix(x+y+z);
    return {prompt:`${fmt(x)} + ${fmt(y)} + ${fmt(z)}`, ans:n, work:`Line up the decimal points: ${x.toFixed(2)} + ${y.toFixed(2)} + ${z.toFixed(2)} = ${fmt(n)}.`,
      wrongs:[W(x+y/10+z,`Line up the decimal points: ${fmt(y)} is ${y.toFixed(2)}.`), W(n+1,`Check the whole numbers.`), W(n-0.1,`Check the tenths column.`)]};
  }
  if(!add){ const a=R(1005,2995)/100, b=nz(R(31,95))/10, n=fix(a-b), A=Math.round(a*100), B=Math.round(b*100), ws=[W(a-b/10,`Line up the decimal points: ${fmt(b)} is ${b.toFixed(2)}, so ${fmt(a)} − ${b.toFixed(2)} = ${fmt(n)}.`)];
    if(hasBorrow(A,B)) ws.push(W(swapSub(A,B)/100,`When the top digit is smaller, exchange from the next column. Don't swap the digits round.`));
    ws.push(W(n+1,`Check the whole numbers: you may have forgotten an exchange.`));
    return {prompt:`${fmt(a)} − ${fmt(b)}`, ans:n, work:`${fmt(a)} − ${b.toFixed(2)} = ${fmt(n)}.`, wrongs:ws}; }
  const a=nz(R(101,299))/10, b=R(305,995)/100, n=fix(a+b), aw=Math.floor(a), ad=Math.round((a-aw)*10), bw=Math.floor(b), bd=Math.round((b-bw)*100), ws=[W(a+b/10,`Line up the decimal points: ${fmt(b)} has ${bw} units, so it goes under the units of ${fmt(a)}.`)];
  if(ad+bd<100) ws.push(W(aw+bw+(ad+bd)/100,`Line up the decimal points: ${fmt(a)} is ${a.toFixed(2)}.`));
  ws.push(W(n+1,`Check the whole numbers: ${aw} + ${bw}, plus anything carried.`), W(n-0.1,`Check the tenths column.`));
  return {prompt:`${fmt(a)} + ${fmt(b)}`, ans:n, work:`${a.toFixed(2)} + ${fmt(b)} = ${fmt(n)}.`, wrongs:ws};
}},

{key:'neg', name:'Negative numbers', zh:'负数', from:2, to:5, gen(L){
  if(L===2){ const f=R(1,3);
    if(f===1){ const a=R(2,12), b=R(2,15); if(a===b) return null; const n=b-a;
      return {prompt:`−${a} + ${b}`, ans:n, work:`Start at −${a} and count up ${b}: ${fmt(n)}.`,
        wrongs:[W(-n,`Start at −${a} and count up ${b}: ${fmt(n)}.`), W(a+b,`Start at −${a}, not at ${a}.`), W(-(a+b),`Adding ${b} moves up, not down.`)]}; }
    if(f===2){ const a=R(2,12), b=a+R(2,12), n=a-b;
      return {prompt:`${a} − ${b}`, ans:n, work:`Start at ${a} and count down ${b}. You go past 0: ${fmt(n)}.`,
        wrongs:[W(b-a,`You go past 0, so the answer is negative: ${fmt(n)}.`), W(-(a+b),`Count down ${b} from ${a}, not from 0.`), W(a+b,`− means count down.`)]}; }
    const a=R(2,12), b=R(2,12), n=-(a+b);
    return {prompt:`−${a} − ${b}`, ans:n, work:`Start at −${a} and count down ${b} more: ${fmt(n)}.`,
      wrongs:[W(a+b,`You are going further below 0, so the answer is negative.`), W(b-a,`Count down from −${a}, not up.`), W(a-b,`Both parts take you below 0: −${a} − ${b} = ${fmt(n)}.`)]};
  }
  if(L===3){ const f=R(1,3), a=R(2,12), b=R(2,12);
    if(f===1){ const n=a+b;
      return {prompt:`${a} − (−${b})`, ans:n, work:`Subtracting a negative is the same as adding: ${a} + ${b} = ${n}.`,
        wrongs:[W(a-b,`Two minus signs together make a plus: ${a} − (−${b}) = ${a} + ${b}.`), W(-n,`Subtracting a negative is the same as adding: ${n}.`), W(b-a,`Subtracting a negative is the same as adding: ${a} + ${b}.`)]}; }
    if(f===2){ const n=-(a+b);
      return {prompt:`−${a} + (−${b})`, ans:n, work:`Adding a negative is the same as subtracting: −${a} − ${b} = ${fmt(n)}.`,
        wrongs:[W(a+b,`Both numbers are negative, so the answer is negative.`), W(b-a,`Adding a negative is the same as subtracting: −${a} − ${b}.`), W(a-b,`Adding a negative is the same as subtracting: −${a} − ${b}.`)]}; }
    if(a===b) return null; const n=b-a;
    return {prompt:`−${a} − (−${b})`, ans:n, work:`− (−${b}) is the same as + ${b}: −${a} + ${b} = ${fmt(n)}.`,
      wrongs:[W(-(a+b),`Two minus signs together make a plus: −${a} + ${b}.`), W(a-b,`−${a} + ${b} = ${fmt(n)}.`), W(a+b,`Start at −${a}: −${a} + ${b} = ${fmt(n)}.`)]};
  }
  if(L===4){ const f=R(1,3), a=R(2,9), b=R(2,9), n=a*b;
    if(f===1){ const left=chance(.5);
      return {prompt:left?`−${a} × ${b}`:`${a} × (−${b})`, ans:-n, work:`${a} × ${b} = ${n}. A negative times a positive is negative: ${fmt(-n)}.`,
        wrongs:[W(n,`A negative times a positive is negative.`), W(-(a+b),`That is −${a} − ${b}. × means multiply.`), W(-(n+a),`Check the times table: ${a} × ${b} = ${n}.`)]}; }
    if(f===2) return {prompt:`−${a} × (−${b})`, ans:n, work:`${a} × ${b} = ${n}. A negative times a negative is positive.`,
      wrongs:[W(-n,`A negative times a negative is positive: ${n}.`), W(-(a+b),`That is −${a} − ${b}. × means multiply.`), W(a+b,`× means multiply: ${a} × ${b} = ${n}.`)]};
    const s=R(1,3);
    if(s===1) return {prompt:`−${n} ÷ ${b}`, ans:-a, work:`${n} ÷ ${b} = ${a}. A negative divided by a positive is negative: ${fmt(-a)}.`,
      wrongs:[W(a,`A negative divided by a positive is negative: ${fmt(-a)}.`), W(b-n,`That is −${n} + ${b}. ÷ asks how many ${b}s make ${n}.`), W(-n*b,`That is × not ÷.`)]};
    if(s===2) return {prompt:`${n} ÷ (−${b})`, ans:-a, work:`${n} ÷ ${b} = ${a}. A positive divided by a negative is negative: ${fmt(-a)}.`,
      wrongs:[W(a,`A positive divided by a negative is negative: ${fmt(-a)}.`), W(n+b,`That is ${n} − (−${b}). ÷ asks how many ${b}s make ${n}.`), W(-n*b,`That is × not ÷.`)]};
    return {prompt:`−${n} ÷ (−${b})`, ans:a, work:`${n} ÷ ${b} = ${a}. A negative divided by a negative is positive.`,
      wrongs:[W(-a,`A negative divided by a negative is positive: ${a}.`), W(b-n,`That is −${n} − (−${b}). ÷ asks how many −${b}s make −${n}.`), W(n*b,`That is × not ÷.`)]};
  }
  const f=R(1,3);
  if(f===1){ const a=R(2,6), b=R(2,6), c=R(2,20), n=a*b-c;
    return {prompt:`−${a} × (−${b}) − ${c}`, ans:n, work:`Multiply first: −${a} × (−${b}) = ${a*b}. Then ${a*b} − ${c} = ${fmt(n)}.`,
      wrongs:[W(-a*b-c,`−${a} × (−${b}) is positive: ${a*b}.`), W(-n,`${a*b} − ${c} = ${fmt(n)}.`), W(a*b+c,`− ${c} means take away ${c}.`)]}; }
  if(f===2){ const a=R(2,12), b=R(2,6), c=R(2,6), n=a+b*c;
    return {prompt:`${a} − ${b} × (−${c})`, ans:n, work:`Multiply first: ${b} × (−${c}) = −${b*c}. Then ${a} − (−${b*c}) = ${a} + ${b*c} = ${n}.`,
      wrongs:[W((a-b)*(-c),`Multiply before you subtract: ${b} × (−${c}) first.`), W(a-b*c,`Subtracting a negative is adding: ${a} + ${b*c}.`), W(-(a+b*c),`${a} − (−${b*c}) = ${a} + ${b*c} = ${n}.`)]}; }
  const a=R(2,9), b=R(1,30), n=a*a-b;
  return {prompt:`(−${a})${sup(2)} − ${b}`, ans:n, work:`(−${a})${sup(2)} = (−${a}) × (−${a}) = ${a*a}. Then ${a*a} − ${b} = ${fmt(n)}.`,
    wrongs:[W(-a*a-b,`(−${a})${sup(2)} = (−${a}) × (−${a}), which is positive: ${a*a}.`), W(-2*a-b,`${sup(2)} means × itself, not × 2: (−${a}) × (−${a}) = ${a*a}.`), W(a*a+b,`− ${b} means take away ${b}.`)]};
}},

{key:'order', name:'Order of operations', zh:'运算顺序', from:3, to:5, gen(L){
  if(L===3){ const f=R(1,4);
    if(f===1){ const a=R(2,20), b=R(2,9), c=R(2,9);
      return {prompt:`${a} + ${b} × ${c}`, ans:a+b*c, work:`Multiply first: ${b} × ${c} = ${b*c}. Then ${a} + ${b*c} = ${a+b*c}.`,
        wrongs:[W((a+b)*c,`Multiply before you add: ${b} × ${c} first.`), W(a+b+c,`× means multiply: ${b} × ${c} = ${b*c}.`), W(a*b+c,`It's ${b} × ${c}, not ${a} × ${b}.`)]}; }
    if(f===2){ const b=R(2,9), c=R(2,9), a=b*c+R(1,30);
      return {prompt:`${a} − ${b} × ${c}`, ans:a-b*c, work:`Multiply first: ${b} × ${c} = ${b*c}. Then ${a} − ${b*c} = ${a-b*c}.`,
        wrongs:[W((a-b)*c,`Multiply before you subtract: ${b} × ${c} first.`), W(a-b-c,`× means multiply: ${b} × ${c} = ${b*c}.`), W(a+b*c,`It's ${a} take away ${b*c}.`)]}; }
    if(f===3){ const c=R(2,9), b=c*R(2,9), a=R(2,30), ws=[];
      if(isInt((a+b)/c)) ws.push(W((a+b)/c,`Divide before you add: ${b} ÷ ${c} first.`));
      ws.push(W(a+b-c,`÷ means divide: ${b} ÷ ${c} = ${b/c}.`), W(b/c,`Don't forget the ${a}: ${a} + ${b/c}.`), W(a+b*c,`÷ means divide, not multiply.`));
      return {prompt:`${a} + ${b} ÷ ${c}`, ans:a+b/c, work:`Divide first: ${b} ÷ ${c} = ${b/c}. Then ${a} + ${b/c} = ${a+b/c}.`, wrongs:ws}; }
    const a=R(2,9), b=R(2,9), c=R(2,9), d=R(2,9), n=a*b-c*d; if(n<1) return null;
    return {prompt:`${a} × ${b} − ${c} × ${d}`, ans:n, work:`Do both multiplications first: ${a*b} − ${c*d} = ${n}.`,
      wrongs:[W((a*b-c)*d,`Do both multiplications before you subtract: ${c} × ${d} = ${c*d}.`), W(a*b-c-d,`${c} × ${d} = ${c*d}.`), W(a*b+c*d,`It's ${a*b} take away ${c*d}.`)]};
  }
  if(L===4){ const f=R(1,4);
    if(f===1){ const a=R(2,12), b=R(2,12), c=R(2,9);
      return {prompt:`(${a} + ${b}) × ${c}`, ans:(a+b)*c, work:`Brackets first: ${a} + ${b} = ${a+b}. Then ${a+b} × ${c} = ${(a+b)*c}.`,
        wrongs:[W(a+b*c,`Brackets first: ${a} + ${b} = ${a+b}, then × ${c}.`), W(a+b+c,`× means multiply: ${a+b} × ${c}.`), W(a*c+b,`Multiply the whole bracket by ${c}: ${a+b} × ${c}.`)]}; }
    if(f===2){ const a=R(2,20), b=R(2,9);
      return {prompt:`${a} + ${b}${sup(2)}`, ans:a+b*b, work:`Powers first: ${b}${sup(2)} = ${b*b}. Then ${a} + ${b*b} = ${a+b*b}.`,
        wrongs:[W((a+b)*(a+b),`Only the ${b} is squared: ${a} + ${b*b}.`), W(a+2*b,`${b}${sup(2)} means ${b} × ${b} = ${b*b}, not ${b} × 2.`), W(2*(a+b),`Only the ${b} is squared, and squared means × itself.`)]}; }
    if(f===3){ const a=R(2,9), c=R(2,9), b=c+R(1,9);
      return {prompt:`${a} × (${b} − ${c})`, ans:a*(b-c), work:`Brackets first: ${b} − ${c} = ${b-c}. Then ${a} × ${b-c} = ${a*(b-c)}.`,
        wrongs:[W(a*b-c,`Brackets first: ${b} − ${c} = ${b-c}, then × ${a}.`), W(a*(b+c),`It's ${b} take away ${c} inside the bracket.`), W(a+b-c,`× means multiply: ${a} × ${b-c}.`)]}; }
    const a=R(3,9), b=R(2,9), c=R(2,9), n=a*a-b*c; if(n<1) return null;
    return {prompt:`${a}${sup(2)} − ${b} × ${c}`, ans:n, work:`Powers first, then ×, then −: ${a*a} − ${b*c} = ${n}.`,
      wrongs:[W((a*a-b)*c,`Multiply before you subtract: ${b} × ${c} = ${b*c}.`), W(2*a-b*c,`${a}${sup(2)} means ${a} × ${a} = ${a*a}.`), W(a*a-b-c,`${b} × ${c} = ${b*c}.`)]};
  }
  const f=R(1,3);
  if(f===1){ const b=R(2,6), d=R(1,5), c=d+R(1,5), a=b*(c-d)+R(1,30), n=a-b*(c-d);
    return {prompt:`${a} − ${b} × (${c} − ${d})`, ans:n, work:`Brackets: ${c} − ${d} = ${c-d}. Then ${b} × ${c-d} = ${b*(c-d)}. Then ${a} − ${b*(c-d)} = ${n}.`,
      wrongs:[W((a-b)*(c-d),`Multiply before you subtract: ${b} × ${c-d} = ${b*(c-d)}.`), W(a-b*c-d,`Brackets first: ${c} − ${d} = ${c-d}, then × ${b}.`), W(a-b*c+d,`Brackets first: it's ${b} × ${c-d}.`)]}; }
  if(f===2){ const c=R(2,6), d=R(2,6), q=R(2,8), b=c*q, a=q*d+R(1,30), n=a-q*d, ws=[];
    if(isInt(b/(c*d))) ws.push(W(a-b/(c*d),`÷ and × come in order from left to right: ${b} ÷ ${c} first, then × ${d}.`));
    ws.push(W(a-q,`Don't forget the × ${d}: ${q} × ${d} = ${q*d}.`));
    if(isInt((a-b)/c)) ws.push(W((a-b)/c*d,`Divide and multiply before you subtract.`));
    ws.push(W(a+q*d,`It's ${a} take away ${q*d}.`));
    return {prompt:`${a} − ${b} ÷ ${c} × ${d}`, ans:n, work:`÷ and × from left to right: ${b} ÷ ${c} = ${q}, then ${q} × ${d} = ${q*d}. Then ${a} − ${q*d} = ${n}.`, wrongs:ws}; }
  const a=R(1,6), b=R(1,6), s=a+b, sq=s*s, cs=[2,3,4,5,6,8,9,10,12].filter(x=>sq%x===0 && x!==sq); if(!cs.length) return null;
  const c=pick(cs), ws=[];
  if(isInt((a*a+b*b)/c)) ws.push(W((a*a+b*b)/c,`Brackets first: ${a} + ${b} = ${s}, then square it: ${sq}.`));
  if(isInt(2*s/c)) ws.push(W(2*s/c,`${sup(2)} means × itself: ${s} × ${s} = ${sq}.`));
  ws.push(W(sq,`Don't forget ÷ ${c}.`)); if(isInt((a+b*b)/c)) ws.push(W((a+b*b)/c,`The whole bracket is squared: (${a} + ${b})${sup(2)} = ${sq}.`));
  return {prompt:`(${a} + ${b})${sup(2)} ÷ ${c}`, ans:sq/c, work:`Brackets: ${a} + ${b} = ${s}. Powers: ${s}${sup(2)} = ${sq}. Then ${sq} ÷ ${c} = ${sq/c}.`, wrongs:ws};
}},

{key:'place', name:'× and ÷ by 10, 100 and 1000', zh:'乘除以10、100、1000', from:1, to:5, gen(L){
  if(L===1){
    if(chance(.65)){ const m=pick([10,100]), n=R(3,999);
      return {prompt:`${n} × ${m}`, ans:n*m, work:`× ${m} moves the digits ${places(m)} to the left: ${fmt(n*m)}.`,
        wrongs:[W(n*m*10,`× ${m} moves the digits ${places(m)}, not ${places(m*10)}.`), m===100 ? W(n*10,`× 100 moves the digits two places, not one.`) : W(n/10,`× makes the number bigger: the digits move to the left.`), W(n+m,`× ${m} is not + ${m}.`)]}; }
    const n=R(2,99)*10;
    return {prompt:`${n} ÷ 10`, ans:n/10, work:`÷ 10 moves the digits one place to the right: ${n/10}.`,
      wrongs:[W(n*10,`÷ makes the number smaller: the digits move to the right.`), W(n/100,`÷ 10 moves the digits one place, not two.`), W(n-10,`÷ 10 is not − 10.`)]};
  }
  if(L===2){ const m=pick([10,100]), n=nz(R(11,999));
    return {prompt:`${n} ÷ ${m}`, ans:n/m, work:`÷ ${m} moves the digits ${places(m)} to the right: ${fmt(n/m)}.`,
      wrongs:[W(n/(m*10),`÷ ${m} moves the digits ${places(m)}, not ${places(m*10)}.`), m===100 ? W(n/10,`÷ 100 moves the digits two places, not one.`) : W(n-10,`÷ 10 is not − 10.`), W(n*m,`÷ makes the number smaller.`)]};
  }
  if(L===3){ const m=pick([10,100,1000]), x=pick([nz(R(11,99))/10, nz(R(101,999))/100, nz(R(11,99))/100]);
    if(chance(.5)) return {prompt:`${fmt(x)} × ${m}`, ans:fix(x*m), work:`× ${m} moves the digits ${places(m)} to the left: ${fmt(x*m)}.`,
      wrongs:[W(x*m*10,`× ${m} moves the digits ${places(m)}, not ${places(m*10)}.`), m===10 ? W(x+10,`× 10 is not + 10.`) : W(x*m/10,`× ${m} moves the digits ${places(m)}, not ${places(m/10)}.`),
        W(x,`× ${m} doesn't just add zeros on the end: the digits move ${places(m)} to the left.`, fmt(x)+'0'.repeat(Math.round(Math.log10(m))))]};
    return {prompt:`${fmt(x)} ÷ ${m}`, ans:fix(x/m), work:`÷ ${m} moves the digits ${places(m)} to the right: ${fmt(x/m)}.`,
      wrongs:[W(x/m/10,`÷ ${m} moves the digits ${places(m)}, not ${places(m*10)}.`), W(x/m*10,`÷ ${m} moves the digits ${places(m)}.`), W(x*m,`÷ makes the number smaller.`)]};
  }
  if(L===4){ const x=pick([R(2,99), nz(R(11,99))/10, nz(R(101,999))/10]), f=R(1,4);
    if(f===1) return {prompt:`${fmt(x)} × 0.1`, ans:fix(x/10), work:`× 0.1 is the same as ÷ 10: ${fmt(x/10)}.`,
      wrongs:[W(x*10,`× 0.1 is the same as ÷ 10, so the number gets smaller.`), W(x/100,`× 0.1 is ÷ 10, not ÷ 100.`), W(x-0.1,`× 0.1 is not − 0.1.`)]};
    if(f===2) return {prompt:`${fmt(x)} × 0.01`, ans:fix(x/100), work:`× 0.01 is the same as ÷ 100: ${fmt(x/100)}.`,
      wrongs:[W(x*100,`× 0.01 is the same as ÷ 100, so the number gets smaller.`), W(x/10,`× 0.01 is ÷ 100, not ÷ 10.`), W(x/1000,`× 0.01 is ÷ 100, not ÷ 1000.`)]};
    if(f===3) return {prompt:`${fmt(x)} ÷ 0.1`, ans:fix(x*10), work:`÷ 0.1 is the same as × 10: ${fmt(x*10)}.`,
      wrongs:[W(x/10,`÷ 0.1 is the same as × 10, so the number gets bigger.`), W(x*100,`÷ 0.1 is × 10, not × 100.`), W(x-0.1,`÷ 0.1 is not − 0.1.`)]};
    return {prompt:`${fmt(x)} ÷ 0.01`, ans:fix(x*100), work:`÷ 0.01 is the same as × 100: ${fmt(x*100)}.`,
      wrongs:[W(x/100,`÷ 0.01 is the same as × 100, so the number gets bigger.`), W(x*10,`÷ 0.01 is × 100, not × 10.`), W(x*1000,`÷ 0.01 is × 100, not × 1000.`)]};
  }
  const f=R(1,3);
  if(f===1){ const x=pick([nz(R(11,99))/10, nz(R(101,999))/100]), k=R(2,4), p=Math.pow(10,k);
    return {prompt:`${fmt(x)} × 10${sup(k)}`, ans:fix(x*p), work:`10${sup(k)} = ${fmt(p)}, so the digits move ${places(p)} to the left: ${fmt(x*p)}.`,
      wrongs:[W(x*p/10,`10${sup(k)} means ${k} places, not ${k-1}.`), W(x*p*10,`10${sup(k)} means ${k} places, not ${k+1}.`), W(x*10*k,`10${sup(k)} is ${fmt(p)}, not 10 × ${k}.`)]}; }
  if(f===2){ const k=R(3,5), x=nz(R(11,99)), n=x*Math.pow(10,R(k-1,k+1)), p=Math.pow(10,k);
    return {prompt:`${fmt(n)} ÷ 10${sup(k)}`, ans:fix(n/p), work:`10${sup(k)} = ${fmt(p)}, so the digits move ${places(p)} to the right: ${fmt(n/p)}.`,
      wrongs:[W(n/p*10,`10${sup(k)} means ${k} places, not ${k-1}.`), W(n/p/10,`10${sup(k)} means ${k} places, not ${k+1}.`), W(n/(10*k),`10${sup(k)} is ${fmt(p)}, not 10 × ${k}.`)]}; }
  const x=pick([nz(R(11,99))/10, R(2,9), nz(R(11,99))]), k=R(1,3), p=Math.pow(10,k);
  return {prompt:`${fmt(x)} × 10${sup('−'+k)}`, ans:fix(x/p), work:`10${sup('−'+k)} = ${fmt(1/p)}, so × 10${sup('−'+k)} is ÷ ${fmt(p)}: ${fmt(x/p)}.`,
    wrongs:[W(x*p,`A negative power means divide: 10${sup('−'+k)} = 1 ÷ ${fmt(p)}.`), W(-x*p,`A negative power doesn't make the answer negative: it means ÷ ${fmt(p)}.`), W(x/p/10,`÷ ${fmt(p)} moves the digits ${places(p)}, not ${places(p*10)}.`)]};
}},

{key:'round', name:'Rounding and estimating', zh:'取近似值与估算', from:1, to:5, gen(L){
  // Rounding x to step: the wrong answers are rounding the other way, the wrong place, and losing the place value
  const ZHL = {'the nearest 10':'精确到十位', 'the nearest 100':'精确到百位', 'the nearest 1000':'精确到千位', 'the nearest whole number':'精确到个位', '1 decimal place':'保留一位小数', '2 decimal places':'保留两位小数'};
  const nearest = (x, step, label) => {
    const ans=roundTo(x,step), down=truncTo(x,step), up=fix(down+step), half=fix(x-down)===fix(step/2), ws=[];
    if(ans===up) ws.push(W(down, half ? `${fmt(x)} is exactly halfway, and halfway rounds up: ${fmt(up)}.` : `${fmt(x)} is nearer to ${fmt(up)} than to ${fmt(down)}.`));
    else ws.push(W(up, `${fmt(x)} is nearer to ${fmt(down)} than to ${fmt(up)}.`));
    return {prompt:`Round ${fmt(x)} to ${label}`, long:true, ans, ws, step, stmt:v=>`${fmt(x)} rounded to ${label} is ${fmt(v)}`,
      zh:`将 ${fmt(x)} 四舍五入，${ZHL[label]}`, zstmt:v=>`${fmt(x)} ${ZHL[label]}是 ${fmt(v)}`,
      work:`${fmt(x)} is between ${fmt(down)} and ${fmt(up)}${half?', exactly halfway, so it rounds up':''}. To ${label}: ${fmt(ans)}.`};
  };
  const done = q => ({prompt:q.prompt, long:true, ans:q.ans, wrongs:q.ws, stmt:q.stmt, work:q.work, step:q.step, zh:q.zh, zstmt:q.zstmt});
  if(L===1){
    if(chance(.5)){ const n=nz(R(11,999)), q=nearest(n,10,'the nearest 10'); q.ws.push(W(roundTo(n,100),`That is to the nearest 100.`), W(q.ans/10,`Keep the place value: ${fmt(q.ans)}, not ${fmt(q.ans/10)}.`)); return done(q); }
    let n=R(101,9999); if(n%100===0) n+=R(1,99); const q=nearest(n,100,'the nearest 100');
    q.ws.push(W(roundTo(n,10),`That is to the nearest 10.`), W(q.ans/100,`Keep the place value: ${fmt(q.ans)}, not ${fmt(q.ans/100)}.`)); return done(q);
  }
  if(L===2){
    if(chance(.5)){ let n=R(1001,99999); if(n%1000===0) n+=R(1,999); const q=nearest(n,1000,'the nearest 1000'); q.ws.push(W(roundTo(n,100),`That is to the nearest 100.`), W(q.ans/1000,`Keep the place value: ${fmt(q.ans)}, not ${fmt(q.ans/1000)}.`)); return done(q); }
    const x=nz(R(11,999))/10, q=nearest(x,1,'the nearest whole number'); q.ws.push(W(x,`A whole number has no decimal places.`, x.toFixed(1)), W(roundTo(x,10),`That is to the nearest 10.`)); return done(q);
  }
  if(L===3){
    for(let t=0;t<30;t++){ const x=fix(R(1,99)+R(1001,9999)/10000), d=pick([1,2]), step=d===1?0.1:0.01, ans=roundTo(x,step);
      if(Math.round(fix(ans/step))%10===0) continue;   // no answers like 2.40 (would need the 0 written)
      const q=nearest(x, step, d===1?'1 decimal place':'2 decimal places');
      q.ws.push(W(roundTo(x, d===1?0.01:0.1), d===1?`That is 2 decimal places.`:`That is 1 decimal place.`), W(roundTo(x,1),`That is to the nearest whole number.`)); return done(q); }
    return null;
  }
  if(L===4){
    for(let t=0;t<30;t++){
      if(chance(.5)){ const n=R(1001,99999), s=pick([1,2]), ans=roundSF(n,s), step=sfStep(n,s); if(ans===n) continue;
        const tr=truncSF(n,s), ws=[];
        ws.push(W(tr===ans ? fix(ans+step) : tr, tr===ans ? `Look at the next digit: it's less than 5, so the ${s===1?'first':'second'} figure stays the same.` : `Look at the next digit: it's 5 or more, so round up.`));
        ws.push(W(roundSF(n, s===1?2:1), `That is ${s===1?2:1} significant figure${s===1?'s':''}.`), W(Math.round(n/step), `Keep the place value: ${fmt(ans)}, not ${fmt(Math.round(n/step))}.`));
        return {prompt:`Round ${fmt(n)} to ${s} significant figure${s>1?'s':''}`, long:true, ans, step, wrongs:ws, stmt:v=>`${fmt(n)} to ${s} significant figure${s>1?'s':''} is ${fmt(v)}`,
          zh:`将 ${fmt(n)} 四舍五入，保留 ${s} 位有效数字`, zstmt:v=>`${fmt(n)} 保留 ${s} 位有效数字是 ${fmt(v)}`,
          work:`The first significant figure is the first digit: ${String(n)[0]}. To ${s} significant figure${s>1?'s':''}: ${fmt(ans)}.`}; }
      const x=fix(R(1001,9999)/Math.pow(10,R(5,6))), s=pick([1,2]), ans=roundSF(x,s), step=sfStep(x,s);
      if(Math.round(fix(ans/step))%10===0) continue;
      const tr=truncSF(x,s), ws=[W(tr===ans ? fix(ans+step) : tr, tr===ans ? `Look at the next digit: it's less than 5, so round down.` : `Look at the next digit: it's 5 or more, so round up.`)];
      const zeroDp=roundTo(x, Math.pow(10,-s)); if(zeroDp!==ans && zeroDp>0) ws.push(W(zeroDp, `Start counting significant figures at the first digit that isn't 0.`));
      ws.push(W(roundSF(x, s===1?2:1), `That is ${s===1?2:1} significant figure${s===1?'s':''}.`));
      return {prompt:`Round ${fmt(x)} to ${s} significant figure${s>1?'s':''}`, long:true, ans, step, wrongs:ws, stmt:v=>`${fmt(x)} to ${s} significant figure${s>1?'s':''} is ${fmt(v)}`,
        zh:`将 ${fmt(x)} 四舍五入，保留 ${s} 位有效数字`, zstmt:v=>`${fmt(x)} 保留 ${s} 位有效数字是 ${fmt(v)}`,
        work:`Zeros at the start don't count: the first significant figure is the first digit that isn't 0. To ${s} significant figure${s>1?'s':''}: ${fmt(ans)}.`}; }
    return null;
  }
  // Advanced: estimating (round each number to 1 significant figure, then work it out)
  if(chance(.5)){ const place=pick([10,100]), a1=R(2,9)*place, b1=R(2,9);
    const a=fix(a1+R(-30,30)/100*place + (place===10?R(1,9)/10:0)), b=fix(b1+R(-30,30)/100); if(roundSF(a,1)!==a1 || roundSF(b,1)!==b1 || a===a1 || b===b1) return null;
    const ans=a1*b1, ws=[], ex=Math.round(a*b); if(ex!==ans) ws.push(W(ex,`That is the exact answer, rounded. To estimate, round each number first: ${fmt(a1)} × ${b1}.`));
    ws.push(W(ans*10,`${fmt(a1)} × ${b1} = ${fmt(ans)}: check the place value.`), W((a1-place)*b1,`${fmt(a)} rounds to ${fmt(a1)}.`));
    return {prompt:`Estimate ${fmt(a)} × ${fmt(b)} by rounding each number to 1 significant figure.`, long:true, ans, wrongs:ws, stmt:v=>`${fmt(a)} × ${fmt(b)} ≈ ${fmt(v)}`,
      zh:`把每个数四舍五入到 1 位有效数字，估算 ${fmt(a)} × ${fmt(b)}。`,
      work:`${fmt(a)} ≈ ${fmt(a1)} and ${fmt(b)} ≈ ${b1}, so ${fmt(a)} × ${fmt(b)} ≈ ${fmt(a1)} × ${b1} = ${fmt(ans)}.`}; }
  const [a1,b1]=pick([[600,20],[800,40],[900,30],[400,20],[600,30],[800,20],[90,3],[80,4],[60,2],[400,5],[300,5],[700,20]]);
  const a=fix(a1+R(-30,30)/100*Math.pow(10,String(a1).length-1)), b=fix(b1+R(-25,25)/100*(b1>=20?10:1)); if(roundSF(a,1)!==a1 || roundSF(b,1)!==b1 || a===a1 || b===b1) return null;
  const ans=a1/b1, ws=[], ex=Math.round(a/b); if(ex!==ans) ws.push(W(ex,`That is close to the exact answer. To estimate, round each number first: ${fmt(a1)} ÷ ${b1}.`));
  ws.push(W(ans*10,`${fmt(a1)} ÷ ${b1} = ${fmt(ans)}: check the place value.`)); if(isInt(ans/10)) ws.push(W(ans/10,`${fmt(a1)} ÷ ${b1} = ${fmt(ans)}: check the place value.`)); else ws.push(W(a1*b1,`That is × not ÷.`));
  return {prompt:`Estimate ${fmt(a)} ÷ ${fmt(b)} by rounding each number to 1 significant figure.`, long:true, ans, wrongs:ws, stmt:v=>`${fmt(a)} ÷ ${fmt(b)} ≈ ${fmt(v)}`,
    zh:`把每个数四舍五入到 1 位有效数字，估算 ${fmt(a)} ÷ ${fmt(b)}。`,
    work:`${fmt(a)} ≈ ${fmt(a1)} and ${fmt(b)} ≈ ${b1}, so ${fmt(a)} ÷ ${fmt(b)} ≈ ${fmt(a1)} ÷ ${b1} = ${fmt(ans)}.`};
}},

{key:'fdp', name:'Fractions and percentages of amounts', zh:'分数与百分数的计算', from:1, to:5, gen(L){
  if(L===1){ const f=R(1,3);
    if(f===1){ const n=R(6,49)*2; return {prompt:`${fr(1,2)} of ${n}`, zh:`${n} 的 ${fr(1,2)}`, ans:n/2, work:`Half of ${n} is ${n} ÷ 2 = ${n/2}.`,
      wrongs:[W(n*2,`Half means ÷ 2, not × 2.`), W(n-2,`Half of ${n} is ${n} ÷ 2, not ${n} − 2.`), ...(n%4===0?[W(n/4,`That is a quarter. A half is ÷ 2.`)]:[W(n/2+1,`Check: ${n/2+1} + ${n/2+1} = ${n+2}.`)])]}; }
    if(f===2){ const n=R(3,25)*4; return {prompt:`${fr(1,4)} of ${n}`, zh:`${n} 的 ${fr(1,4)}`, ans:n/4, work:`A quarter of ${n} is ${n} ÷ 4 = ${n/4}.`,
      wrongs:[W(n/2,`That is a half. A quarter is ÷ 4.`), W(n-4,`A quarter of ${n} is ${n} ÷ 4, not ${n} − 4.`), W(n*4,`A quarter means ÷ 4, not × 4.`)]}; }
    const n=R(2,90)*10; return {prompt:`10% of ${n}`, zh:`${n} 的 10%`, ans:n/10, work:`10% is one tenth: ${n} ÷ 10 = ${n/10}.`,
      wrongs:[W(n-10,`10% of ${n} is ${n} ÷ 10, not ${n} − 10.`), W(n/100,`10% means ÷ 10, not ÷ 100.`), W(n*10,`10% means ÷ 10, not × 10.`)]};
  }
  if(L===2){
    if(chance(.5)){ const d=R(3,10), n=d*R(2,12), ws=[W(n-d,`${fr(1,d)} of ${n} is ${n} ÷ ${d}, not ${n} − ${d}.`), W(n*d,`${fr(1,d)} means ÷ ${d}, not × ${d}.`)];
      if(d!==2 && n%2===0) ws.push(W(n/2,`That is a half. ${fr(1,d)} is ÷ ${d}.`));
      return {prompt:`${fr(1,d)} of ${n}`, zh:`${n} 的 ${fr(1,d)}`, ans:n/d, work:`${fr(1,d)} of ${n} = ${n} ÷ ${d} = ${n/d}.`, wrongs:ws}; }
    const p=pick([50,25,20]), n=R(1,15)*20, o=p===50?25:50;
    return {prompt:`${p}% of ${n}`, zh:`${n} 的 ${p}%`, ans:n*p/100, work:`${p}% = ${fr(1,100/p)}, so ${p}% of ${n} = ${n} ÷ ${100/p} = ${fmt(n*p/100)}.`,
      wrongs:[W(n/p,`${p}% of ${n} is not ${n} ÷ ${p}: ${p}% is ${fr(1,100/p)}, so divide by ${100/p}.`), W(n-p,`${p}% of ${n} is not ${n} − ${p}.`), W(n*o/100,`That is ${o}%.`)]};
  }
  if(L===3){
    if(chance(.5)){ let d=R(3,10), m=R(2,d-1); while(gcd(m,d)>1){ d=R(3,10); m=R(2,d-1); } const n=d*R(2,12), ws=[W(n/d,`That is ${fr(1,d)}. Now × ${m}: ${n/d} × ${m} = ${n/d*m}.`), W(n*m,`You multiplied by ${m} but didn't divide by ${d}.`)];
      if(isInt(n/m*d)) ws.push(W(n/m*d,`Divide by the bottom number (${d}), then multiply by the top (${m}).`)); else ws.push(W(n-m,`${fr(m,d)} of ${n} means ${n} ÷ ${d} × ${m}.`));
      return {prompt:`${fr(m,d)} of ${n}`, zh:`${n} 的 ${fr(m,d)}`, ans:n/d*m, work:`${n} ÷ ${d} = ${n/d}, then ${n/d} × ${m} = ${n/d*m}.`, wrongs:ws}; }
    const p=pick([5,15,30,40,60,75]), n=R(1,20)*20;
    return {prompt:`${p}% of ${n}`, zh:`${n} 的 ${p}%`, ans:fix(n*p/100), work:`10% of ${n} = ${fmt(n/10)}${p===5?`, so 5% = half of that = ${fmt(n/20)}`:p===75?`; 75% = 50% + 25% = ${fmt(n/2)} + ${fmt(n/4)} = ${fmt(n*0.75)}`:p===15?`, 5% = ${fmt(n/20)}, so 15% = ${fmt(n/10)} + ${fmt(n/20)} = ${fmt(n*0.15)}`:`, so ${p}% = ${p/10} × ${fmt(n/10)} = ${fmt(n*p/100)}`}.`,
      wrongs:[W(n/10,`That is 10%.`), W(n-p,`${p}% of ${n} is not ${n} − ${p}.`), W(n*p/10,`Percent means out of 100: divide by 100, not 10.`)]};
  }
  if(L===4){
    const n=pick([40,60,80,120,160,200,240,300,400]);
    if(chance(.45)){ const p=pick([12,35,45,65,85,15,55]); if(!isInt(n*p/10)) return null;
      return {prompt:`${p}% of ${n}`, zh:`${n} 的 ${p}%`, ans:fix(n*p/100), work:`1% of ${n} = ${fmt(n/100)}, so ${p}% = ${p} × ${fmt(n/100)} = ${fmt(n*p/100)}.`,
        wrongs:[W(n-p,`${p}% of ${n} is not ${n} − ${p}.`), W(n*p/10,`Percent means out of 100: divide by 100, not 10.`), W(n*(100-p)/100,`That is what is left after taking ${p}% away.`)]}; }
    const p=pick([10,15,20,25,30,40]), inc=chance(.5), part=n*p/100;
    if(inc) return {prompt:`Increase ¥${n} by ${p}%`, long:true, pre:'¥', ans:fix(n+part), stmt:v=>`¥${n} increased by ${p}% is ¥${fmt(v)}`, zh:`把 ¥${n} 增加 ${p}%`, zstmt:v=>`¥${n} 增加 ${p}% 后是 ¥${fmt(v)}`, work:`${p}% of ${n} = ${fmt(part)}, so ¥${n} + ¥${fmt(part)} = ¥${fmt(n+part)}.`,
      wrongs:[W(part,`That is ${p}% of ${n}. Now add it on: ${n} + ${fmt(part)}.`), W(n+p,`Add ${p}% of ${n} (${fmt(part)}), not ${p}.`), W(n-part,`That is a decrease. An increase makes it bigger.`)]};
    return {prompt:`Decrease ¥${n} by ${p}%`, long:true, pre:'¥', ans:fix(n-part), stmt:v=>`¥${n} decreased by ${p}% is ¥${fmt(v)}`, zh:`把 ¥${n} 减少 ${p}%`, zstmt:v=>`¥${n} 减少 ${p}% 后是 ¥${fmt(v)}`, work:`${p}% of ${n} = ${fmt(part)}, so ¥${n} − ¥${fmt(part)} = ¥${fmt(n-part)}.`,
      wrongs:[W(part,`That is the ${p}% taken off. Now subtract it: ${n} − ${fmt(part)}.`), W(n-p,`Take off ${p}% of ${n} (${fmt(part)}), not ${p}.`), W(n+part,`That is an increase. A decrease makes it smaller.`)]};
  }
  const f=R(1,3);
  if(f===1){ const p=pick([10,20,25,50]), old=R(2,20)*20, nw=old*(100+p)/100; if(!isInt(nw)) return null;
    return {prompt:`After a ${p}% increase, a price is ¥${nw}. What was the price before?`, long:true, pre:'¥', ans:old, stmt:v=>`After a ${p}% increase a price is ¥${nw}, so before it was ¥${fmt(v)}`,
      zh:`价格上涨 ${p}% 后是 ¥${nw}。原价是多少？`, zstmt:v=>`价格上涨 ${p}% 后是 ¥${nw}，所以原价是 ¥${fmt(v)}`,
      work:`¥${nw} is ${100+p}% of the old price, so the old price is ${nw} ÷ ${fmt(1+p/100)} = ¥${old}.`,
      wrongs:[W(nw*(100-p)/100,`Taking ${p}% off ¥${nw} doesn't undo it: the ${p}% was of the old price. ¥${nw} is ${100+p}%, so ÷ ${fmt(1+p/100)}.`), W(nw-p,`The price went up by ${p}%, not ¥${p}.`), W(nw*(100+p)/100,`That increases it again.`)]}; }
  if(f===2){ const p=pick([10,20,25,50]), old=R(2,20)*20, nw=old*(100-p)/100; if(!isInt(nw)) return null;
    return {prompt:`After a ${p}% decrease, a price is ¥${nw}. What was the price before?`, long:true, pre:'¥', ans:old, stmt:v=>`After a ${p}% decrease a price is ¥${nw}, so before it was ¥${fmt(v)}`,
      zh:`价格下降 ${p}% 后是 ¥${nw}。原价是多少？`, zstmt:v=>`价格下降 ${p}% 后是 ¥${nw}，所以原价是 ¥${fmt(v)}`,
      work:`¥${nw} is ${100-p}% of the old price, so the old price is ${nw} ÷ ${fmt(1-p/100)} = ¥${old}.`,
      wrongs:[W(nw*(100+p)/100,`Adding ${p}% back on doesn't undo it: the ${p}% was of the old price. ¥${nw} is ${100-p}%, so ÷ ${fmt(1-p/100)}.`), W(nw+p,`The price went down by ${p}%, not ¥${p}.`), W(nw*(100-p)/100,`That decreases it again.`)]}; }
  const p=pick([10,20,25,40,50]), a=R(2,20)*10, b=a*(100+p)/100; if(!isInt(b)) return null;
  const ws=[W(b-a,`That is the increase in yuan. As a percentage of ¥${a}: ${fmt(b-a)} ÷ ${a} × 100.`, `${fmt(b-a)}%`), W(b/a*100,`That is the new price as a percentage of the old one. Take away 100%.`)];
  const wb=fix((b-a)/b*100); if(isInt(wb*100)) ws.unshift(W(wb,`Divide by the old price (¥${a}), not the new one.`));
  return {prompt:`A price goes up from ¥${a} to ¥${b}. What is the percentage increase?`, long:true, suf:'%', ans:p, stmt:v=>`From ¥${a} to ¥${b} is an increase of ${fmt(v)}%`,
    zh:`价格从 ¥${a} 涨到 ¥${b}。增长的百分比是多少？`, zstmt:v=>`从 ¥${a} 涨到 ¥${b}，增长了 ${fmt(v)}%`,
    work:`The increase is ¥${b-a}. ${b-a} ÷ ${a} × 100 = ${p}%.`, wrongs:ws};
}},

{key:'powers', name:'Powers and roots', zh:'乘方与开方', from:1, to:5, gen(L){
  if(L===1){ const a=R(2,10); return {prompt:`${a}${sup(2)}`, ans:a*a, work:`${a}${sup(2)} = ${a} × ${a} = ${a*a}.`,
    wrongs:[W(2*a,`${a}${sup(2)} means ${a} × ${a}, not ${a} × 2.`), W(a*(a+1),`That is ${a} × ${a+1}.`), W(a*(a-1),`That is ${a} × ${a-1}.`)]}; }
  if(L===2){ const f=R(1,3);
    if(f===1){ const a=R(11,15); return {prompt:`${a}${sup(2)}`, ans:a*a, work:`${a}${sup(2)} = ${a} × ${a} = ${a*a}.`,
      wrongs:[W(2*a,`${a}${sup(2)} means ${a} × ${a}, not ${a} × 2.`), W(a*(a+1),`That is ${a} × ${a+1}.`), W(a*a-10,`Check: ${a} × ${a} = ${a*a}.`)]}; }
    if(f===2){ const r=R(2,12), n=r*r; return {prompt:`√${n}`, ans:r, work:`${r} × ${r} = ${n}, so √${n} = ${r}.`,
      wrongs:[W(n/2,`The square root isn't half: which number × itself makes ${n}?`), W(r+1,`${r+1} × ${r+1} = ${(r+1)*(r+1)}, not ${n}.`), W(r-1,`${r-1} × ${r-1} = ${(r-1)*(r-1)}, not ${n}.`)]}; }
    const a=R(2,5); return {prompt:`${a}${sup(3)}`, ans:a*a*a, work:`${a}${sup(3)} = ${a} × ${a} × ${a} = ${a*a*a}.`,
      wrongs:[W(3*a,`${a}${sup(3)} means ${a} × ${a} × ${a}, not ${a} × 3.`), W(a*a,`That is ${a}${sup(2)}. ${a}${sup(3)} is ${a} × ${a} × ${a}.`), W(a*a*3,`${a}${sup(3)} means ${a} × ${a} × ${a}.`)]};
  }
  if(L===3){ const f=R(1,4);
    if(f===1){ const a=R(6,10); return {prompt:`${a}${sup(3)}`, ans:a*a*a, work:`${a}${sup(3)} = ${a} × ${a} × ${a} = ${a*a*a}.`,
      wrongs:[W(3*a,`${a}${sup(3)} means ${a} × ${a} × ${a}, not ${a} × 3.`), W(a*a,`That is ${a}${sup(2)}.`), W(a*a*3,`${a}${sup(3)} means ${a} × ${a} × ${a}.`)]}; }
    if(f===2){ const a=R(2,10), n=a*a*a, ws=[W(a+1,`${a+1}${sup(3)} = ${(a+1)**3}, not ${n}.`), W(a-1,`${a-1}${sup(3)} = ${(a-1)**3}, not ${n}.`)]; if(isInt(n/3)) ws.push(W(n/3,`The cube root isn't ÷ 3: which number × itself × itself makes ${n}?`));
      return {prompt:`∛${n}`, ans:a, work:`${a} × ${a} × ${a} = ${n}, so ∛${n} = ${a}.`, wrongs:ws}; }
    if(f===3){ const k=R(4,10); return {prompt:`2${sup(k)}`, ans:2**k, work:`2${sup(k)} means ${k} 2s multiplied together: ${2**k}.`,
      wrongs:[W(2*k,`2${sup(k)} means ${k} 2s multiplied together, not 2 × ${k}.`), W(2**(k-1),`That is 2${sup(k-1)}.`), W(k*k,`That is ${k}${sup(2)}.`)]}; }
    const k=R(3,6); return {prompt:`10${sup(k)}`, ans:10**k, work:`10${sup(k)} is 1 followed by ${k} zeros: ${fmt(10**k)}.`,
      wrongs:[W(10*k,`10${sup(k)} means ${k} 10s multiplied together, not 10 × ${k}.`), W(10**(k-1),`That is 10${sup(k-1)}: count the zeros.`), W(10**(k+1),`That is 10${sup(k+1)}: count the zeros.`)]};
  }
  if(L===4){ const f=R(1,3), b=pick([2,3,10]);
    if(f===1){ const m=R(2,4), n=R(2,4); if(b**(m+n)>1e6) return null; const ws=[W(b**m+b**n,`× not +: ${b}${sup(m)} × ${b}${sup(n)} = ${b}${sup(m+n)}.`), W(b**(m+n-1),`Add the powers: ${m} + ${n} = ${m+n}.`)]; if(b**(m*n)<=1e8 && m*n!==m+n) ws.unshift(W(b**(m*n),`When you multiply, add the powers (don't multiply them): ${b}${sup(m+n)}.`));
      return {prompt:`${b}${sup(m)} × ${b}${sup(n)}`, ans:b**(m+n), work:`Add the powers: ${b}${sup(m)} × ${b}${sup(n)} = ${b}${sup(m+n)} = ${fmt(b**(m+n))}.`, wrongs:ws}; }
    if(f===2){ const n=R(2,4), m=n+R(1,3); const ws=[W(b**(m+n)<=1e8?b**(m+n):b**m*10,`When you divide, subtract the powers: ${m} − ${n} = ${m-n}.`), W(b**m-b**n,`÷ not −: subtract the powers, not the numbers.`)]; if(isInt(m/n) && m/n!==m-n) ws.push(W(b**(m/n),`Subtract the powers (don't divide them): ${b}${sup(m-n)}.`));
      return {prompt:`${b}${sup(m)} ÷ ${b}${sup(n)}`, ans:b**(m-n), work:`Subtract the powers: ${b}${sup(m)} ÷ ${b}${sup(n)} = ${b}${sup(m-n)} = ${fmt(b**(m-n))}.`, wrongs:ws}; }
    const m=R(2,3), n=R(2,3); if(b**(m*n)>1e7) return null;
    return {prompt:`(${b}${sup(m)})${sup(n)}`, ans:b**(m*n), work:`Multiply the powers: (${b}${sup(m)})${sup(n)} = ${b}${sup(m*n)} = ${fmt(b**(m*n))}.`,
      wrongs:[...(m*n!==m+n?[W(b**(m+n),`A power of a power: multiply the powers, ${m} × ${n} = ${m*n}.`)]:[]), W(b**m*n,`(${b}${sup(m)})${sup(n)} means ${b}${sup(m)} multiplied by itself ${n} times.`), W(b*m*n,`That is ${b} × ${m} × ${n}. Multiply the powers: ${b}${sup(m*n)}.`)]};
  }
  const f=R(1,3);
  if(f===1){ const a=R(2,12); return {prompt:`${a}${sup(0)}`, ans:1, work:`Any number (except 0) to the power 0 is 1.`,
    wrongs:[W(0,`Any number (except 0) to the power 0 is 1, not 0.`), W(a,`${a}${sup(1)} = ${a}, but ${a}${sup(0)} = 1.`), W(-a,`A power of 0 gives 1.`)]}; }
  const b=pick([2,4,5,10]), k=b===10?R(1,3):b===2?R(1,3):R(1,2), v=fix(1/b**k);
  return {prompt:`${b}${sup('−'+k)}`, ans:v, work:`A negative power means 1 divided by: ${b}${sup('−'+k)} = 1 ÷ ${b}${sup(k)} = 1 ÷ ${b**k} = ${fmt(v)}.`,
    wrongs:[W(-(b**k),`A negative power doesn't make it negative: it means 1 ÷ ${b}${sup(k)}.`), k>1 ? W(-b*k,`A negative power means 1 ÷ ${b}${sup(k)}, not −${b} × ${k}.`) : W(-v,`A negative power doesn't make it negative: 1 ÷ ${b} = ${fmt(v)}.`), W(b**k,`${b}${sup('−'+k)} is 1 ÷ ${b}${sup(k)}, which is less than 1.`)]};
}},

{key:'factors', name:'Factors, multiples and primes', zh:'因数、倍数和质数', from:2, to:4, gen(L){
  if(L===2){ const f=R(1,3);
    if(f===1){ const n=pick([12,18,20,24,30,36,40,42,48,56,60,72]), fs=[]; for(let d=2;d<n;d++) if(n%d===0) fs.push(d);
      const ans=pick(fs), non=[]; for(let d=3;d<Math.min(n,20);d++) if(n%d && d!==ans) non.push(d);
      const a=pick(non); let b=pick(non); let g=0; while(b===a && g++<20) b=pick(non);
      return {prompt:`Which of these is a factor of ${n}?`, long:true, choice:true, ans, stmt:v=>`${fmt(v)} is a factor of ${n}`, zh:`下面哪个数是 ${n} 的因数？`, zstmt:v=>`${fmt(v)} 是 ${n} 的因数`, work:`${n} ÷ ${ans} = ${n/ans}, a whole number, so ${ans} is a factor of ${n}.`,
        wrongs:[W(a,`${n} ÷ ${a} = ${fmt(n/a)}, not a whole number.`), W(b,`${n} ÷ ${b} = ${fmt(n/b)}, not a whole number.`), W(n*2,`${n*2} is a multiple of ${n}, not a factor. A factor goes into ${n}.`)]}; }
    if(f===2){ const k=R(3,9), ans=k*R(3,9), offs=[1,2,-1,-2,3,-3].filter(o=>(ans+o)%k!==0 && ans+o>0), ws=offs.slice(0,2).map(o=>W(ans+o,`${ans+o} ÷ ${k} = ${fmt((ans+o)/k)}, not a whole number.`));
      const fk=[2,3,4].find(d=>k%d===0 && d!==k); ws.push(fk ? W(fk,`${fk} is a factor of ${k}, not a multiple. Multiples are in the ${k} times table.`) : W(k+10,`${k+10} is not in the ${k} times table.`));
      return {prompt:`Which of these is a multiple of ${k}?`, long:true, choice:true, ans, stmt:v=>`${fmt(v)} is a multiple of ${k}`, zh:`下面哪个数是 ${k} 的倍数？`, zstmt:v=>`${fmt(v)} 是 ${k} 的倍数`, work:`${k} × ${ans/k} = ${ans}, so ${ans} is a multiple of ${k}.`, wrongs:ws}; }
    const ans=pick([11,13,17,19,23,29,31,37,41,43,47]), traps=[21,27,33,39,49,51,57,1,9,15,25,35].sort(()=>Math.random()-.5).slice(0,3);
    return {prompt:`Which of these is a prime number?`, long:true, choice:true, ans, stmt:v=>`${fmt(v)} is a prime number`, zh:`下面哪个数是质数？`, zstmt:v=>`${fmt(v)} 是质数`, work:`${ans} has exactly two factors: 1 and ${ans}.`,
      wrongs:traps.map(c=>c===1?W(1,`1 is not a prime number: a prime has exactly two factors, and 1 has only one.`):W(c,`${c} = ${smallestFactor(c)} × ${c/smallestFactor(c)}, so it is not prime.`))};
  }
  const big=L===4, h=R(big?4:2, big?15:8); let x=R(2,big?9:7), y=R(2,big?9:7), g=0; while((x===y || gcd(x,y)>1) && g++<40){ x=R(2,big?9:7); y=R(2,big?9:7); }
  if(x===y || gcd(x,y)>1) return null;
  const a=h*x, b=h*y, lcm=h*x*y;
  if(big && chance(.3)){ const ans=pick([53,59,61,67,71,73,79,83,89,97]), traps=[51,57,87,91,69,77,81,93,63,99].sort(()=>Math.random()-.5).slice(0,3);
    return {prompt:`Which of these is a prime number?`, long:true, choice:true, ans, stmt:v=>`${fmt(v)} is a prime number`, zh:`下面哪个数是质数？`, zstmt:v=>`${fmt(v)} 是质数`, work:`${ans} has exactly two factors: 1 and ${ans}.`,
      wrongs:traps.map(c=>W(c,`${c} = ${smallestFactor(c)} × ${c/smallestFactor(c)}, so it is not prime.`))}; }
  if(chance(.5)){ const ws=[]; const small=[...Array(h).keys()].map(i=>i+1).filter(d=>d>1 && d<h && h%d===0); if(small.length) ws.push(W(pick(small),`That is a common factor, but not the highest.`));
    ws.push(W(lcm,`That is the lowest common multiple. The highest common factor goes into both numbers.`), W(a*b,`That is ${a} × ${b}. The highest common factor goes into both numbers.`), W(Math.min(a,b),`${Math.min(a,b)} doesn't go into ${Math.max(a,b)}.`));
    return {prompt:`The highest common factor (HCF) of ${a} and ${b}`, long:true, ans:h, stmt:v=>`The HCF of ${a} and ${b} is ${fmt(v)}`, zh:`${a} 和 ${b} 的最大公因数（HCF）`, zstmt:v=>`${a} 和 ${b} 的最大公因数是 ${fmt(v)}`, work:`${a} = ${h} × ${x} and ${b} = ${h} × ${y}. The biggest number that goes into both is ${h}.`, wrongs:ws}; }
  const ws=[]; if(a*b!==lcm) ws.push(W(a*b,`That is a common multiple, but not the lowest.`)); ws.push(W(h,`That is the highest common factor. The lowest common multiple is in both times tables.`), W(a+b,`That is ${a} + ${b}.`), W(lcm*2,`That is a common multiple, but not the lowest.`));
  return {prompt:`The lowest common multiple (LCM) of ${a} and ${b}`, long:true, ans:lcm, stmt:v=>`The LCM of ${a} and ${b} is ${fmt(v)}`, zh:`${a} 和 ${b} 的最小公倍数（LCM）`, zstmt:v=>`${a} 和 ${b} 的最小公倍数是 ${fmt(v)}`, work:`${lcm} = ${a} × ${lcm/a} = ${b} × ${lcm/b}. It is the smallest number in both times tables.`, wrongs:ws};
}}
];

// ================================ WHICH CALCULATION? ================================
// A short problem in words. Students don't work it out: they choose the calculation that answers it. Each returns
// {text, right, wrongs:[{e, why}]}. Money is in yuan (¥).
const E = (e, why) => ({e, why});
const WHICH = {
  1: [
    ()=>{ const N=pick(NAMES), a=R(25,90), b=R(11,a-5); return {text:`${N} has ${a} stickers and gives ${b} of them to a friend. How many stickers does ${N} have now?`, zh:`${N} 有 ${a} 张贴纸，送给朋友 ${b} 张。${N} 现在有多少张贴纸？`, right:`${a} − ${b}`,
      wrongs:[E(`${a} + ${b}`,`Giving some away makes the number smaller, so take away.`), E(`${b} − ${a}`,`Start with what ${N} has: ${a} − ${b}.`), E(`${a} × ${b}`,`Nothing is multiplied: ${b} stickers are given away.`)]}; },
    ()=>{ const a=R(12,40), b=R(5,25); if(a===b) return null; return {text:`There are ${a} people on a bus. At the next stop, ${b} more people get on. How many people are on the bus now?`, zh:`公交车上有 ${a} 个人。到下一站时，又上来 ${b} 个人。现在车上有多少人？`, right:`${a} + ${b}`,
      wrongs:[E(`${a} − ${b}`,`More people get on, so add.`), E(`${b} − ${a}`,`More people get on, so the number goes up: add.`), E(`${a} × ${b}`,`${b} more people get on: that's adding ${b}.`)]}; },
    ()=>{ const [N,M]=two(), a=R(140,175), b=R(120,a-5); return {text:`${N} is ${a} cm tall and ${M} is ${b} cm tall. How much taller is ${N}?`, zh:`${N} 身高 ${a} 厘米，${M} 身高 ${b} 厘米。${N} 比 ${M} 高多少？`, right:`${a} − ${b}`,
      wrongs:[E(`${a} + ${b}`,`"How much taller" asks for the difference: take away.`), E(`${b} − ${a}`,`Take the smaller height from the bigger one.`), E(`${a} ÷ ${b}`,`The difference between two heights is found by taking away.`)]}; },
    ()=>{ const a=R(3,15), b=R(2,12); return {text:`A pen costs ¥${a} and a ruler costs ¥${b}. How much do they cost together?`, zh:`一支笔 ¥${a}，一把尺子 ¥${b}。两样一共多少钱？`, right:`${a} + ${b}`,
      wrongs:[E(`${a} − ${b}`,`"Together" means add the prices.`), E(`${a} × ${b}`,`You buy one of each, so add the two prices.`), E(`2 × ${a}`,`You buy one pen and one ruler, not two pens: add the two prices.`)]}; }
  ],
  2: [
    ()=>{ const a=R(2,9), b=R(3,9); return {text:`Pencils cost ¥${a} each. How much do ${b} pencils cost?`, zh:`铅笔每支 ¥${a}。${b} 支铅笔多少钱？`, right:`${a} × ${b}`,
      wrongs:[E(`${a} + ${b}`,`${b} pencils at ¥${a} each is ${b} lots of ${a}: multiply.`), E(`${a} ÷ ${b}`,`Dividing would share the ¥${a} out. Each pencil costs ¥${a}, so multiply.`), E(`${b} − ${a}`,`${b} lots of ¥${a}: multiply.`)]}; },
    ()=>{ const k=R(3,9), n=k*R(4,12); return {text:`${n} sweets are shared equally between ${k} children. How many sweets does each child get?`, zh:`把 ${n} 颗糖平均分给 ${k} 个孩子。每个孩子分到几颗？`, right:`${n} ÷ ${k}`,
      wrongs:[E(`${n} × ${k}`,`Sharing makes each amount smaller: divide.`), E(`${k} ÷ ${n}`,`Start with the sweets: ${n} ÷ ${k}.`), E(`${n} − ${k}`,`Taking ${k} away doesn't share them out.`)]}; },
    ()=>{ const k=R(3,8), n=k*R(4,9); return {text:`${n} students get into teams of ${k}. How many teams are there?`, zh:`${n} 个学生每 ${k} 人一组。一共有几组？`, right:`${n} ÷ ${k}`,
      wrongs:[E(`${n} × ${k}`,`How many ${k}s are in ${n}? Divide.`), E(`${n} − ${k}`,`That takes away one team. How many ${k}s are in ${n}?`), E(`${k} ÷ ${n}`,`Start with the students: ${n} ÷ ${k}.`)]}; },
    ()=>{ const [N,M]=two(), a=R(6,25), k=R(2,5); return {text:`${N} has ${a} books. ${M} has ${k} times as many books as ${N}. How many books does ${M} have?`, zh:`${N} 有 ${a} 本书，${M} 的书是 ${N} 的 ${k} 倍。${M} 有多少本书？`, right:`${a} × ${k}`,
      wrongs:[E(`${a} + ${k}`,`"${k} times as many" means multiply by ${k}.`), E(`${a} ÷ ${k}`,`"Times as many" makes it bigger: multiply.`), E(`${a} × ${k} + ${a}`,`${M} has ${k} times as many: just ${a} × ${k}.`)]}; }
  ],
  3: [
    ()=>{ const N=pick(NAMES), k=R(2,5), p=R(3,9), m=pick([20,50,100].filter(x=>x>k*p)); return {text:`${N} buys ${k} notebooks at ¥${p} each and pays with a ¥${m} note. How much change does ${N} get?`, zh:`${N} 买了 ${k} 本笔记本，每本 ¥${p}，付了一张 ¥${m} 的纸币。应该找回多少钱？`, right:`${m} − ${k} × ${p}`,
      wrongs:[E(`(${m} − ${k}) × ${p}`,`Find the cost first (${k} × ${p}), then take it away from ${m}. These brackets do it the other way round.`), E(`${k} × ${p} − ${m}`,`Take the cost away from the money paid, not the other way round.`), E(`${m} − ${k} − ${p}`,`${k} notebooks at ¥${p} each cost ${k} × ${p}.`)]}; },
    ()=>{ const c=R(3,8), s=R(24,32), a=R(5,20); return {text:`A school has ${c} classes of ${s} students. ${a} students are absent today. How many students are in school today?`, zh:`一所学校有 ${c} 个班，每班 ${s} 名学生。今天有 ${a} 名学生缺席。今天在校的学生有多少人？`, right:`${c} × ${s} − ${a}`,
      wrongs:[E(`${c} × (${s} − ${a})`,`The ${a} absent students are from the whole school, not from every class.`), E(`${c} + ${s} − ${a}`,`${c} classes of ${s} students is ${c} × ${s}.`), E(`${a} − ${c} × ${s}`,`Start with all the students, then take away the ${a} who are absent.`)]}; },
    ()=>{ const x=R(8,20), y=R(3,x-2), p=R(2,4), q=R(2,5); return {text:`Adult tickets cost ¥${x} and child tickets cost ¥${y}. How much do ${p} adults and ${q} children pay altogether?`, zh:`成人票 ¥${x}，儿童票 ¥${y}。${p} 个成人和 ${q} 个儿童一共要付多少钱？`, right:`${p} × ${x} + ${q} × ${y}`,
      wrongs:[E(`(${p} + ${q}) × (${x} + ${y})`,`That charges everyone for an adult ticket and a child ticket.`), E(`${p} × ${q} + ${x} × ${y}`,`Multiply each number of tickets by its own price.`), E(`(${p} + ${q}) × ${x}`,`Children pay a different price: ¥${y}.`)]}; },
    ()=>{ const N=pick(NAMES), k=R(3,6), a=R(20,60), b=k*R(8,20)-a; if(b<5) return null; return {text:`${N} has ¥${a} and earns ¥${b} more. Then ${N} shares all the money equally between ${k} people. How much does each person get?`, zh:`${N} 有 ¥${a}，又挣了 ¥${b}。然后把所有的钱平均分给 ${k} 个人。每人分到多少钱？`, right:`(${a} + ${b}) ÷ ${k}`,
      wrongs:[E(`${a} + ${b} ÷ ${k}`,`Add first, then share: you need the brackets, or only the ¥${b} is shared.`), E(`${a} ÷ ${k} + ${b}`,`All the money is shared, not just the ¥${a}.`), E(`${k} ÷ (${a} + ${b})`,`Start with the money: (${a} + ${b}) ÷ ${k}.`)]}; }
  ],
  4: [
    ()=>{ const p=pick([40,60,80,120,150,200]), r=pick([10,15,20,25,30]); return {text:`A jacket costs ¥${p}. In a sale it is ${r}% off. What is the sale price?`, zh:`一件夹克 ¥${p}。打折时减价 ${r}%。打折后的价格是多少？`, right:`${p} × ${fmt(1-r/100)}`,
      wrongs:[E(`${p} × ${fmt(r/100)}`,`That is the discount (${r}%), not the sale price.`), E(`${p} − ${r}`,`${r}% off is not ¥${r} off.`), E(`${p} ÷ ${fmt(1-r/100)}`,`The sale price is ${100-r}% of ¥${p}: multiply by ${fmt(1-r/100)}.`)]}; },
    ()=>{ const d=pick([3,4,5,8]), m=R(2,d-1), n=d*R(20,60); return {text:`There are ${n} students in a year group. ${m} out of every ${d} of them walk to school. How many students walk to school?`, zh:`一个年级有 ${n} 名学生，其中每 ${d} 人中有 ${m} 人步行上学。有多少学生步行上学？`, right:`${n} ÷ ${d} × ${m}`,
      wrongs:[E(`${n} ÷ ${m} × ${d}`,`Divide by the bottom number (${d}), then multiply by the top (${m}).`), E(`${n} ÷ ${d}`,`That is 1 out of every ${d}. You need ${m} of those parts.`), E(`${n} − ${m}`,`${m} out of every ${d} is a fraction of ${n}: ${n} ÷ ${d} × ${m}.`)]}; },
    ()=>{ const t=pick([2,3,4,2.5,1.5]), s=R(4,12)*10, d=fix(s*t); return {text:`A train travels ${fmt(d)} km in ${fmt(t)} hours. What is its average speed in km per hour?`, zh:`一列火车 ${fmt(t)} 小时行驶了 ${fmt(d)} 千米。它的平均速度是每小时多少千米？`, right:`${fmt(d)} ÷ ${fmt(t)}`,
      wrongs:[E(`${fmt(d)} × ${fmt(t)}`,`Speed = distance ÷ time.`), E(`${fmt(t)} ÷ ${fmt(d)}`,`Speed = distance ÷ time: ${fmt(d)} ÷ ${fmt(t)}.`), E(`${fmt(d)} − ${fmt(t)}`,`Speed = distance ÷ time.`)]}; },
    ()=>{ const s=pick([4,6,8]), g=s*R(30,60), t=pick([2,3,5,10,12].filter(x=>x!==s)); return {text:`A recipe for ${s} people uses ${g} g of flour. How much flour is needed for ${t} people?`, zh:`一份 ${s} 人份的食谱要用 ${g} 克面粉。${t} 人份需要多少面粉？`, right:`${g} ÷ ${s} × ${t}`,
      wrongs:[E(`${g} × ${t}`,`First find the flour for 1 person: ${g} ÷ ${s}.`), E(`${g} ÷ ${t} × ${s}`,`Divide by the ${s} people the recipe is for, then multiply by ${t}.`), E(`${g} + ${t} − ${s}`,`Each person needs the same amount of flour: scale it, don't add.`)]}; }
  ],
  5: [
    ()=>{ const r=pick([10,20,25,50]), old=R(4,30)*20, n=old*(100+r)/100; if(!isInt(n)) return null; return {text:`After a ${r}% increase, a bike costs ¥${n}. How much did it cost before the increase?`, zh:`涨价 ${r}% 后，一辆自行车卖 ¥${n}。涨价前是多少钱？`, right:`${n} ÷ ${fmt(1+r/100)}`,
      wrongs:[E(`${n} × ${fmt(1-r/100)}`,`Taking ${r}% off the new price doesn't undo it: the ${r}% was of the old price.`), E(`${n} − ${r}`,`The price went up by ${r}%, not ¥${r}.`), E(`${n} × ${fmt(1+r/100)}`,`That increases it again.`)]}; },
    ()=>{ const [N,M]=two(), a=R(1,4), b=R(a+1,7), t=(a+b)*R(5,30); return {text:`${N} and ${M} share ¥${t} in the ratio ${a} : ${b}. How much does ${M} get?`, zh:`${N} 和 ${M} 按 ${a} : ${b} 的比例分 ¥${t}。${M} 分到多少钱？`, right:`${t} ÷ ${a+b} × ${b}`,
      wrongs:[E(`${t} ÷ ${b}`,`Add the parts first: ${a} + ${b} = ${a+b} parts.`), E(`${t} ÷ ${a} × ${b}`,`Divide by the total number of parts: ${a+b}.`), E(`${t} ÷ ${a+b} × ${a}`,`That is ${N}'s share. ${M} has ${b} parts.`)]}; },
    ()=>{ const w=R(3,9), l=R(w+2,15), A=w*l; return {text:`A rectangle has an area of ${A} cm² and a width of ${w} cm. What is its perimeter?`, zh:`一个长方形的面积是 ${A} 平方厘米，宽是 ${w} 厘米。它的周长是多少？`, right:`2 × (${A} ÷ ${w} + ${w})`,
      wrongs:[E(`${A} ÷ ${w}`,`That is the length. The perimeter goes all the way round.`), E(`2 × ${A} ÷ ${w} + ${w}`,`Find the length, add the width, then double it all: that needs brackets.`), E(`${A} ÷ ${w} + ${w}`,`That only goes halfway round: double it.`)]}; },
    ()=>{ const p=pick([10,20,25,40,50]), a=R(2,20)*10, b=a*(100+p)/100; if(!isInt(b)) return null; return {text:`A price goes up from ¥${a} to ¥${b}. What is the percentage increase?`, zh:`价格从 ¥${a} 涨到 ¥${b}。增长的百分比是多少？`, right:`(${b} − ${a}) ÷ ${a} × 100`,
      wrongs:[E(`(${b} − ${a}) ÷ ${b} × 100`,`Divide by the original price, ¥${a}.`), E(`${b} − ${a}`,`That is the increase in yuan, not a percentage.`), E(`${b} ÷ ${a} × 100`,`That is the new price as a percentage of the old one. Take away 100.`)]}; }
  ]
};

// ================================ SPOT THE MISTAKE ================================
// A worked answer with one wrong line. Later lines carry the mistake on, so the student finds where it FIRST goes wrong.
// Each returns {task, lines:[html], errAt, why, fix} (fix: the line as it should be).
const SPOT = {
  1: [
    ()=>{ const a=nz(R(23,68)), b=nz(R(14,29)), at=a-a%10, bt=b-b%10, au=a%10, bu=b%10, T=at+bt, U=au+bu;
      const build=(t,u)=>[`${at} + ${bt} = ${t}`, `${au} + ${bu} = ${u}`, `${t} + ${u} = ${t+u}`];
      const e=R(0,2), good=build(T,U); let lines, why;
      if(e===0){ lines=build(T-10,U); why=`${at} + ${bt} = ${T}.`; }
      else if(e===1){ const u=U+(chance(.5)?1:-1); lines=build(T,u); why=`${au} + ${bu} = ${U}.`; }
      else { lines=good.slice(); lines[2]=`${T} + ${U} = ${U>=10?T+U-10:T+U+10}`; why=`${T} + ${U} = ${T+U}.`; }
      return {task:`Work out ${a} + ${b}`, zh:`计算 ${a} + ${b}`, lines, errAt:e, why, fix:good[e]}; },
    ()=>{ const a=R(52,98), b=nz(R(13,39)), bt=b-b%10, bu=b%10, m=a-bt;
      const good=[`${b} = ${bt} + ${bu}`, `${a} − ${bt} = ${m}`, `${m} − ${bu} = ${m-bu}`], e=R(1,2); let lines, why;
      if(e===1){ lines=[good[0], `${a} − ${bt} = ${m+10}`, `${m+10} − ${bu} = ${m+10-bu}`]; why=`${a} − ${bt} = ${m}.`; }
      else { lines=[good[0], good[1], `${m} + ${bu} = ${m+bu}`]; why=`You need to take away the ${bu}, not add it.`; }
      return {task:`Work out ${a} − ${b}`, zh:`计算 ${a} − ${b}`, lines, errAt:e, why, fix:good[e]}; }
  ],
  2: [
    ()=>{ const a=nz(R(23,89)), b=R(3,9), at=a-a%10, au=a%10, P=at*b, Q=au*b;
      const build=(p,q)=>[`${at} × ${b} = ${p}`, `${au} × ${b} = ${q}`, `${p} + ${q} = ${p+q}`], good=build(P,Q), e=R(0,2); let lines, why;
      if(e===0){ lines=build(P/10,Q); why=`${at} × ${b} = ${P}: ${at/10} tens × ${b} = ${at/10*b} tens.`; }
      else if(e===1){ lines=build(P,Q+b); why=`${au} × ${b} = ${Q}.`; }
      else { lines=good.slice(); lines[2]=`${P} + ${Q} = ${P+Q-10}`; why=`${P} + ${Q} = ${P+Q}.`; }
      return {task:`Work out ${a} × ${b}`, zh:`计算 ${a} × ${b}`, lines, errAt:e, why, fix:good[e]}; },
    ()=>{ let d=R(3,9), m=R(2,d-1); while(gcd(m,d)>1){ d=R(3,9); m=R(2,d-1); } const n=d*m*R(2,6), u=n/d, A=u*m;
      const good=[`${n} ÷ ${d} = ${u}`, `${u} × ${m} = ${A}`, `So ${fr(m,d)} of ${n} = ${A}`], e=R(0,1); let lines, why;
      if(e===0){ const w=n/m; lines=[`${n} ÷ ${m} = ${w}`, `${w} × ${d} = ${w*d}`, `So ${fr(m,d)} of ${n} = ${w*d}`]; why=`Divide by the bottom number (${d}) first, then multiply by the top (${m}).`; }
      else { lines=[good[0], `${u} × ${m} = ${A+u}`, `So ${fr(m,d)} of ${n} = ${A+u}`]; why=`${u} × ${m} = ${A}.`; }
      return {task:`Work out ${fr(m,d)} of ${n}`, zh:`计算 ${n} 的 ${fr(m,d)}`, lines, errAt:e, why, fix:good[e]}; }
  ],
  3: [
    ()=>{ const b=R(2,6), c=R(2,6), bc=b*c, a=bc+R(3,20), d=R(2,9);
      const good=[`= ${a} − ${bc} + ${d}`, `= ${a-bc} + ${d}`, `= ${a-bc+d}`], e=R(0,1); let lines, why;
      if(e===0){ const s=a-b; lines=[`= ${s} × ${c} + ${d}`, `= ${s*c} + ${d}`, `= ${s*c+d}`]; why=`Multiply before you subtract: ${b} × ${c} = ${bc} first.`; }
      else { lines=[good[0], `= ${a} − ${bc+d}`, `= ${a-bc-d}`]; why=`Add and subtract from left to right: ${a} − ${bc} first, then + ${d}.`; }
      return {task:`Work out ${a} − ${b} × ${c} + ${d}`, zh:`计算 ${a} − ${b} × ${c} + ${d}`, lines, errAt:e, why, fix:good[e]}; },
    ()=>{ const a=R(2,6), b=R(2,6), c=R(2,5), d=R(2,5), ab=a*b, cd=c*d; if(ab===cd) return null;
      const good=[`= ${ab} + ${c} × (−${d})`, `= ${ab} + (−${cd})`, `= ${fmt(ab-cd)}`], e=R(0,2); let lines, why;
      if(e===0){ lines=[`= −${ab} + ${c} × (−${d})`, `= −${ab} + (−${cd})`, `= ${fmt(-ab-cd)}`]; why=`A negative × a negative is positive: −${a} × (−${b}) = ${ab}.`; }
      else if(e===1){ lines=[good[0], `= ${ab} + ${cd}`, `= ${ab+cd}`]; why=`A positive × a negative is negative: ${c} × (−${d}) = −${cd}.`; }
      else { lines=[good[0], good[1], `= ${fmt(cd-ab)}`]; why=`${ab} + (−${cd}) = ${ab} − ${cd} = ${fmt(ab-cd)}.`; }
      return {task:`Work out −${a} × (−${b}) + ${c} × (−${d})`, zh:`计算 −${a} × (−${b}) + ${c} × (−${d})`, lines, errAt:e, why, fix:good[e]}; }
  ],
  4: [
    ()=>{ const a=nz(R(13,39)), b=nz(R(12,29)), at=a-a%10, au=a%10, bt=b-b%10, bu=b%10, p=[at*bt, at*bu, au*bt, au*bu];
      const build=q=>[`${at} × ${bt} = ${q[0]}`, `${at} × ${bu} = ${q[1]}`, `${au} × ${bt} = ${q[2]}`, `${au} × ${bu} = ${q[3]}`, `${q[0]} + ${q[1]} + ${q[2]} + ${q[3]} = ${q[0]+q[1]+q[2]+q[3]}`];
      const good=build(p), e=pick([0,1,3,4]); let lines, why;
      if(e===4){ lines=good.slice(); lines[4]=`${p[0]} + ${p[1]} + ${p[2]} + ${p[3]} = ${p[0]+p[1]+p[2]+p[3]+10}`; why=`Add again: ${p[0]} + ${p[1]} + ${p[2]} + ${p[3]} = ${p[0]+p[1]+p[2]+p[3]}.`; }
      else { const q=p.slice(); q[e]= e===0 ? p[0]/10 : e===1 ? p[1]/10 : p[3]+au; lines=build(q);
        why = e===0 ? `${at} × ${bt} = ${p[0]}: tens × tens gives hundreds.` : e===1 ? `${at} × ${bu} = ${p[1]}: ${at/10} tens × ${bu} = ${at/10*bu} tens.` : `${au} × ${bu} = ${p[3]}.`; }
      return {task:`Work out ${a} × ${b}`, zh:`计算 ${a} × ${b}`, lines, errAt:e, why, fix:good[e]}; },
    ()=>{ const t=R(1,6), p=10*t+5, n=R(2,12)*20, ten=n/10, five=n/20;
      const build=(tn,fv)=>{ const L=[`10% of ${n} = ${fmt(tn)}`]; if(t>1) L.push(`${t*10}% of ${n} = ${fmt(tn*t)}`); L.push(`5% of ${n} = ${fmt(fv)}`); L.push(`${p}% of ${n} = ${fmt(tn*t)} + ${fmt(fv)} = ${fmt(tn*t+fv)}`); return L; };
      const good=build(ten,five), five_at=t>1?2:1, e=pick([0,five_at]); let lines, why;
      if(e===0){ lines=build(n/100, n/200); why=`10% means ÷ 10: ${n} ÷ 10 = ${ten}.`; }
      else { lines=build(ten, ten*2); why=`5% is half of 10%: half of ${ten} is ${fmt(five)}.`; }
      return {task:`Work out ${p}% of ${n}`, zh:`计算 ${n} 的 ${p}%`, lines, errAt:e, why, fix:good[e]}; },
    ()=>{ const place=pick([10,100]), a1=R(2,9)*place, b1=R(2,9), a=fix(a1+R(5,30)/100*place*(chance(.5)?1:-1)+(place===10?R(1,9)/10:0)), b=fix(b1+R(5,30)/100*(chance(.5)?1:-1));
      if(roundSF(a,1)!==a1 || roundSF(b,1)!==b1) return null;
      const good=[`${fmt(a)} ≈ ${fmt(a1)}`, `${fmt(b)} ≈ ${b1}`, `${fmt(a1)} × ${b1} = ${fmt(a1*b1)}`], e=R(0,2); let lines, why;
      if(e===0){ const w=a>a1?a1+place:a1-place; lines=[`${fmt(a)} ≈ ${fmt(w)}`, good[1], `${fmt(w)} × ${b1} = ${fmt(w*b1)}`]; why=`${fmt(a)} is nearer to ${fmt(a1)} than to ${fmt(w)}.`; }
      else if(e===1){ const w=b>b1?b1+1:b1-1; lines=[good[0], `${fmt(b)} ≈ ${w}`, `${fmt(a1)} × ${w} = ${fmt(a1*w)}`]; why=`${fmt(b)} is nearer to ${b1} than to ${w}.`; }
      else { lines=good.slice(); lines[2]=`${fmt(a1)} × ${b1} = ${fmt(a1*b1*10)}`; why=`${fmt(a1)} × ${b1} = ${fmt(a1*b1)}: check the place value.`; }
      return {task:`Estimate ${fmt(a)} × ${fmt(b)} (round each number to 1 significant figure)`, zh:`估算 ${fmt(a)} × ${fmt(b)}（每个数四舍五入到 1 位有效数字）`, lines, errAt:e, why, fix:good[e]}; }
  ],
  5: [
    ()=>{ const t=R(1,3), p=10*t+5, n=R(2,10)*20, ten=n/10, five=n/20, inc=ten*t+five; if(n===100) return null;
      const build=(tn,fv,last)=>{ const L=[`10% of ${n} = ${fmt(tn)}`, `5% of ${n} = ${fmt(fv)}`, `${p}% of ${n} = ${t>1?`${t} × ${fmt(tn)}`:fmt(tn)} + ${fmt(fv)} = ${fmt(tn*t+fv)}`]; L.push(last||`${n} + ${fmt(tn*t+fv)} = ${fmt(n+tn*t+fv)}`); return L; };
      const good=build(ten,five), e=pick([1,3]); let lines, why;
      if(e===1){ lines=build(ten, ten*2); why=`5% is half of 10%: half of ${fmt(ten)} is ${fmt(five)}.`; }
      else { lines=build(ten, five, `${n} + ${p} = ${n+p}`); why=`Add ${p}% of ${n} (${fmt(inc)}), not ${p}.`; }
      return {task:`Increase ¥${n} by ${p}%`, zh:`把 ¥${n} 增加 ${p}%`, lines, errAt:e, why, fix:good[e]}; },
    ()=>{ const p=pick([20,25,50]), old=R(3,20)*20, nw=old*(100+p)/100, one=fix(nw/(100+p)); if(!isInt(nw)) return null;
      const good=[`¥${nw} is ${100+p}% of the original price`, `1% = ${nw} ÷ ${100+p} = ${fmt(one)}`, `100% = ${fmt(one)} × 100 = ${old}`];
      const w1=fix(nw/(100-p)); const e=Math.abs(w1*1e4-Math.round(w1*1e4))<1e-6 ? R(0,2) : pick([1,2]); let lines, why;
      if(e===0){ lines=[`¥${nw} is ${100-p}% of the original price`, `1% = ${nw} ÷ ${100-p} = ${fmt(w1)}`, `100% = ${fmt(w1)} × 100 = ${fmt(w1*100)}`]; why=`After a ${p}% increase, the new price is 100% + ${p}% = ${100+p}% of the original.`; }
      else if(e===1){ lines=[good[0], `1% = ${nw} ÷ ${100+p} = ${fmt(one*10)}`, `100% = ${fmt(one*10)} × 100 = ${fmt(one*1000)}`]; why=`${nw} ÷ ${100+p} = ${fmt(one)}.`; }
      else { lines=good.slice(); lines[2]=`100% = ${fmt(one)} × 100 = ${fmt(one*10)}`; why=`${fmt(one)} × 100 = ${old}: the digits move two places.`; }
      return {task:`After a ${p}% increase a price is ¥${nw}. Find the original price.`, zh:`价格上涨 ${p}% 后是 ¥${nw}。求原价。`, lines, errAt:e, why, fix:good[e]}; },
    ()=>{ const a=R(2,5), b=R(2,5), d=R(2,5), c=d*R(2,6), m=a*b*b, n=m-c/d; if(n<1) return null;
      const good=[`= ${a} × ${b*b} − ${c} ÷ ${d}`, `= ${m} − ${c/d}`, `= ${n}`], e=isInt((m-c)/d) && m>c ? R(0,1) : 0; let lines, why;
      if(e===0){ const s=(a*b)**2; lines=[`= ${s} − ${c} ÷ ${d}`, `= ${s} − ${c/d}`, `= ${s-c/d}`]; why=`Powers before multiplying: ${b}${sup(2)} = ${b*b} first, then × ${a}.`; }
      else { lines=[good[0], `= ${m-c} ÷ ${d}`, `= ${(m-c)/d}`]; why=`Divide before you subtract: ${c} ÷ ${d} = ${c/d} first.`; }
      return {task:`Work out ${a} × ${b}${sup(2)} − ${c} ÷ ${d}`, zh:`计算 ${a} × ${b}${sup(2)} − ${c} ÷ ${d}`, lines, errAt:e, why, fix:good[e]}; }
  ]
};

// Powers and roots (levels 1–3) and Indices (levels 4–5: the laws of indices, zero and negative powers) are separate
// skills, as Cambridge 0580 has them apart (1.3 and 1.7); the recipe is the same.
{ const pw=SKILLS.find(x=>x.key==='powers'); pw.to=3; SKILLS.push({key:'indices', name:'Indices', zh:'指数', from:4, to:5, gen:L=>pw.gen(L)}); }

const TOPIC = {key:'number', name:'Number', zh:'数与计算', skills:SKILLS, which:WHICH, spot:SPOT, fmt, fix};
const G = typeof window!=='undefined' ? window : globalThis;
(G.AEA_MATHS_TOPICS = G.AEA_MATHS_TOPICS || {}).number = TOPIC;
if(typeof module!=='undefined' && module.exports) module.exports = TOPIC;
})();
