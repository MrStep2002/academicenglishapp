/* MATHS · EXAM BOARDS (27 Oct 2026). The questions are made by the skills in each topic file (number.js …), which every
   board shares: percentage increase is the same maths everywhere. A board is its own list of topics and syllabus points,
   in its own order and words, each point listing the skills (by key) that practise it. A point with no skills yet is
   shown as still to come. ext: Extended only (hidden for Core). calc: needs a calculator (this site's questions don't).
   core: the Core name, where Core calls it something else. A topic with live:true has a page (maths/<key>/) and a
   topic file (maths/engine/<key>.js); the others are listed as coming soon. maths/status/ reads this file too.
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
      {key:'algebra', n:'2', name:'Algebra and graphs', zh:'代数与图像', subs:[
        S('2.1', 'Introduction to algebra', '代数入门'),
        S('2.2', 'Algebraic manipulation', '代数式的运算'),
        S('2.3', 'Algebraic fractions', '代数分式', [], {ext:true}),
        S('2.4', 'Indices II', '指数（二）'),
        S('2.5', 'Equations', '方程'),
        S('2.6', 'Inequalities', '不等式'),
        S('2.7', 'Sequences', '数列'),
        S('2.8', 'Proportion', '正比例与反比例', [], {ext:true}),
        S('2.9', 'Graphs in practical situations', '实际情境中的图像'),
        S('2.10', 'Graphs of functions', '函数图像'),
        S('2.11', 'Sketching curves', '画曲线草图'),
        S('2.12', 'Differentiation', '微分', [], {ext:true}),
        S('2.13', 'Functions', '函数', [], {ext:true})]},
      {key:'coordinate', n:'3', name:'Coordinate geometry', zh:'坐标几何', subs:[
        S('3.1', 'Coordinates', '坐标'),
        S('3.2', 'Drawing linear graphs', '画直线图像'),
        S('3.3', 'Gradient of linear graphs', '直线的斜率'),
        S('3.4', 'Length and midpoint', '线段的长度与中点', [], {ext:true}),
        S('3.5', 'Equations of linear graphs', '直线方程'),
        S('3.6', 'Parallel lines', '平行线'),
        S('3.7', 'Perpendicular lines', '垂直线', [], {ext:true})]},
      {key:'geometry', n:'4', name:'Geometry', zh:'几何', subs:[
        S('4.1', 'Geometrical terms', '几何术语'),
        S('4.2', 'Geometrical constructions', '几何作图'),
        S('4.3', 'Scale drawings', '比例图'),
        S('4.4', 'Similarity', '相似'),
        S('4.5', 'Symmetry', '对称'),
        S('4.6', 'Angles', '角'),
        S('4.7', 'Circle theorems I', '圆的定理（一）', [], {core:'Circle theorems', corezh:'圆的定理'}),
        S('4.8', 'Circle theorems II', '圆的定理（二）', [], {ext:true})]},
      {key:'mensuration', n:'5', name:'Mensuration', zh:'测量', subs:[
        S('5.1', 'Units of measure', '计量单位'),
        S('5.2', 'Area and perimeter', '面积与周长'),
        S('5.3', 'Circles, arcs and sectors', '圆、弧与扇形'),
        S('5.4', 'Surface area and volume', '表面积与体积'),
        S('5.5', 'Compound shapes and parts of shapes', '组合图形与部分图形')]},
      {key:'trigonometry', n:'6', name:'Trigonometry', zh:'三角学', subs:[
        S('6.1', "Pythagoras' theorem", '勾股定理'),
        S('6.2', 'Right-angled triangles', '直角三角形'),
        S('6.3', 'Exact trigonometric values', '特殊角的三角函数值', [], {ext:true}),
        S('6.4', 'Trigonometric functions', '三角函数', [], {ext:true}),
        S('6.5', 'Non-right-angled triangles', '非直角三角形', [], {ext:true}),
        S('6.6', "Pythagoras' theorem and trigonometry in 3D", '三维中的勾股定理与三角学', [], {ext:true})]},
      {key:'vectors', n:'7', name:'Transformations and vectors', zh:'变换与向量', subs:[
        S('7.1', 'Transformations', '变换'),
        S('7.2', 'Vectors in two dimensions', '二维向量', [], {ext:true}),
        S('7.3', 'Magnitude of a vector', '向量的模', [], {ext:true}),
        S('7.4', 'Vector geometry', '向量几何', [], {ext:true})]},
      {key:'probability', n:'8', name:'Probability', zh:'概率', subs:[
        S('8.1', 'Introduction to probability', '概率入门'),
        S('8.2', 'Relative and expected frequencies', '相对频率与期望频数'),
        S('8.3', 'Probability of combined events', '组合事件的概率'),
        S('8.4', 'Conditional probability', '条件概率', [], {ext:true})]},
      {key:'statistics', n:'9', name:'Statistics', zh:'统计', subs:[
        S('9.1', 'Classifying statistical data', '统计数据的分类'),
        S('9.2', 'Interpreting statistical data', '解读统计数据'),
        S('9.3', 'Averages and measures of spread', '平均数与离散程度', [], {core:'Averages and range', corezh:'平均数与极差'}),
        S('9.4', 'Statistical charts and diagrams', '统计图表'),
        S('9.5', 'Scatter diagrams', '散点图'),
        S('9.6', 'Cumulative frequency diagrams', '累积频数图', [], {ext:true}),
        S('9.7', 'Histograms', '直方图', [], {ext:true})]}
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
