/* MATHS · QUICK FIRE MATHS (11 Nov 2026). Teacher: "simple numeracy stuff: 12 times table, addition, etc... and then grow as the
   topic grows… starting maths with KS3 maths… they're turning to calculators for even basic maths and that's what's got to stop.
   They need a mental workout - brain training."
   Mental maths, no calculator: the quick skills of Number (number.js, loaded first) at the same five levels, and only the quick
   games (no word problems or workings to check). Not tied to an exam board: KS3 numeracy. To grow it, add a skill to number.js
   (or write one here) and put its key in KEEP. Page: maths/quick-fire/ (data-topic="mental"). */
(function(){
'use strict';
const G = window, N = (G.AEA_MATHS_TOPICS || {}).number;
if(!N) return;
const KEEP = ['times', 'addsub', 'place', 'neg', 'fdp', 'powers', 'order'];   // the order they are listed on the page
G.AEA_MATHS_TOPICS.mental = {
  key: 'mental', name: 'Quick Fire Maths', zh: '快速心算', eyebrow: ['Every subject · mental maths, no calculator', '所有学科 · 心算，不用计算器'],
  skills: KEEP.map(k=>N.skills.find(s=>s.key===k)).filter(Boolean),
  which: {}, spot: {}, fmt: N.fmt, fix: N.fix,
  games: ['choose', 'tf', 'type', 'whack', 'speed']
};
})();
