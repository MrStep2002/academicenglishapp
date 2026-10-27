/* MATHS · EXAM BOARDS (27 Oct 2026). The questions are made by the skills in each topic file (number.js …), which every
   board shares: percentage increase is the same maths everywhere. A board is its own list of topics and syllabus points,
   in its own order and words, each point listing the skills (by key) that practise it. A point with no skills yet is
   shown as still to come. ext: Extended only (hidden for Core). calc: needs a calculator (this site's questions don't).
   Students choose their exam on the Maths page; it is saved as aea:maths:board = {board, tier}.
   To add a board: add it here with live:true and its topics. Cambridge IGCSE Mathematics 0580, syllabus 2025–2027. */
(function(){
'use strict';
const S = (n, name, zh, skills, o) => Object.assign({n, name, zh, skills:skills||[]}, o||{});
const BOARDS = {
  order: ['cie0580', 'edexcel-igcse', 'gcse'],
  cie0580: {
    name:'Cambridge IGCSE Mathematics (0580)', short:'Cambridge IGCSE 0580', zh:'剑桥 IGCSE 数学（0580）', live:true,
    tiers:[['core','Core','核心'], ['extended','Extended','扩展']], codes:{core:'C', extended:'E'},
    topics:[
      {key:'number', n:'1', name:'Number', zh:'数', live:true, subs:[
        S('1.1', 'Types of number', '数的类型', ['factors']),
        S('1.2', 'Sets', '集合'),
        S('1.3', 'Powers and roots', '乘方与开方', ['powers']),
        S('1.4', 'Fractions, decimals and percentages', '分数、小数与百分数'),
        S('1.5', 'Ordering', '排序'),
        S('1.6', 'The four operations', '四则运算', ['times','addsub','neg','order','place']),
        S('1.7', 'Indices I', '指数（一）', ['indices']),
        S('1.8', 'Standard form', '科学记数法'),
        S('1.9', 'Estimation', '估算', ['round']),
        S('1.10', 'Limits of accuracy', '精确度的上下限'),
        S('1.11', 'Ratio and proportion', '比与比例'),
        S('1.12', 'Rates', '速率'),
        S('1.13', 'Percentages', '百分数', ['fdp']),
        S('1.14', 'Using a calculator', '使用计算器', [], {calc:true}),
        S('1.15', 'Time', '时间'),
        S('1.16', 'Money', '货币'),
        S('1.17', 'Exponential growth and decay', '指数增长与衰减', [], {ext:true}),
        S('1.18', 'Surds', '根式', [], {ext:true})]},
      {key:'algebra', n:'2', name:'Algebra and graphs', zh:'代数与图像'},
      {key:'coordinate', n:'3', name:'Coordinate geometry', zh:'坐标几何'},
      {key:'geometry', n:'4', name:'Geometry', zh:'几何'},
      {key:'mensuration', n:'5', name:'Mensuration', zh:'测量'},
      {key:'trigonometry', n:'6', name:'Trigonometry', zh:'三角学'},
      {key:'vectors', n:'7', name:'Transformations and vectors', zh:'变换与向量'},
      {key:'probability', n:'8', name:'Probability', zh:'概率'},
      {key:'statistics', n:'9', name:'Statistics', zh:'统计'}
    ]
  },
  'edexcel-igcse': {name:'Pearson Edexcel International GCSE Mathematics A', short:'Edexcel International GCSE', zh:'爱德思国际 GCSE', live:false},
  gcse: {name:'GCSE Mathematics (AQA, Edexcel, OCR)', short:'GCSE (England)', zh:'英国 GCSE', live:false}
};
// The student's exam, or Cambridge 0580 Extended until they choose
BOARDS.choice = () => { let c={}; try{ c=JSON.parse(localStorage.getItem('aea:maths:board'))||{}; }catch(e){}
  const b=BOARDS[c.board] && BOARDS[c.board].live ? c.board : 'cie0580', tier=(BOARDS[b].tiers||[]).some(t=>t[0]===c.tier) ? c.tier : 'extended';
  return {board:b, tier}; };
BOARDS.choose = (board, tier) => { try{ localStorage.setItem('aea:maths:board', JSON.stringify({board, tier})); }catch(e){} };
const G = typeof window!=='undefined' ? window : globalThis;
G.AEA_MATHS_BOARDS = BOARDS;
if(typeof module!=='undefined' && module.exports) module.exports = BOARDS;
})();
