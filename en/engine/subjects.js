/* THE ENGLISH SUBJECT LIST (stage 1 of the redesign, 8 Nov 2026). One list for the whole English side:
   the sidebar's "My subjects", the Subjects panel at the top of the sidebar (tick boxes: the Daily Circuit's subjects),
   the home page (Your subjects), the landing page and the Site content pages (status/) all read it. To add a topic: copy a topic page (see README),
   then add one line below in its area. Nothing else needs changing.
   - path: the page, from the site's top folder (the same address the Daily Circuit switches use)
   - area: one of AREAS (the order of AREAS is the order on the pages)
   - always: everyone has it, always ticked (Academic Essentials; since 11 Nov 2026 also Reading, teacher: "everyone has to do
     that", Quick Fire Maths and General knowledge). The first one (Academic Essentials) is the landing page's Every subject card.
   - circuit: false = not in the Daily Circuit: Reading Comprehension, Maths (they can be ticked in Subjects, so they are on
     the student's home page, but circuit.js leaves them out of the circuit)
   - soon: shown greyed as "Coming soon", no page yet
   Load it before shell.js:  <script src="…/en/engine/subjects.js?v=…"></script>
   THE CHINESE VERSION'S LIST (stage 4, 8 Nov 2026): ZH_SUBJECTS below, the same areas and conventions with fewer subjects;
   zh: the Chinese name, shown on the Chinese side (the English name shows when the student picks EN). forSide('zh') gives
   the list for that side. */
(function(){
'use strict';
// Every subject: what everyone does, always ticked; at the bottom of the lists since 11 Nov 2026 (teacher: "drop that whole
// group to the bottom of the list"): Academic Essentials, Reading, Quick Fire Maths, General knowledge
const AREAS = [
  {key: 'eng',   name: 'English', zh: '英语', color: '#b4286a'},   // "English Language" until 11 Nov 2026 (teacher: English, with all the reading in it)
  {key: 'media', name: 'Media', zh: '媒体', color: '#1a5cb0'},
  {key: 'maths', name: 'Maths', zh: '数学', color: '#9a4a00'},
  {key: 'sci',   name: 'Science', zh: '科学', color: '#11694a'},
  {key: 'every', name: 'Every subject', zh: '所有学科', color: 'var(--sh-ink, #151935)'}   // navy (white in dark mode)
];
const SUBJECTS = [
  // Names (11 Nov 2026, teacher): "Academic Essentials" (was Academic English Essentials), "Reading" (was Reading Comprehension)
  {path: 'en/essentials/index.html',            name: 'Academic Essentials', area: 'every', always: true},
  {path: 'en/reading-comprehension/index.html', name: 'Reading',               area: 'every', always: true, circuit: false},
  // Quick Fire Maths and General knowledge (11 Nov 2026, teacher): KS3 mental maths (maths/engine/mental.js) and the
  // must-know quiz (content/general/). Not Daily Circuit stations yet (general knowledge already has a round in each one).
  // progress: where a subject's level is kept when it isn't the English progress (Quick Fire Maths: the maths progress)
  {path: 'maths/quick-fire/index.html?from=en', name: 'Quick Fire Maths',    area: 'every', always: true, circuit: false, progress: 'maths:mental'},
  {path: 'en/general/index.html',               name: 'General knowledge',   area: 'every', always: true, circuit: false},
  {path: 'en/descriptive/index.html',           name: 'Descriptive language',  area: 'eng'},
  {path: 'en/mockingbird/index.html',           name: 'To Kill a Mockingbird', area: 'eng'},   // English version only (8 Nov 2026)
  // Listening: hidden until it is ready (26 Oct 2026). The page still works at en/listening/. To show it, remove the // below.
  // {path: 'en/listening/index.html',          name: 'Listening',             area: 'eng', circuit: false},
  {path: 'en/web-design/index.html',            name: 'Web design',            area: 'media'},
  {path: 'en/representation/index.html',        name: 'Representation',        area: 'media'},
  {path: 'en/describing-people/index.html',     name: 'Media Descriptors',     area: 'media'},
  {path: 'en/advertising/index.html',           name: 'Advertising',           area: 'media'},
  {path: 'maths/index.html?from=en',            name: 'Maths',                 area: 'maths', circuit: false},
  {path: 'en/chemistry/index.html',             name: 'Chemistry',             area: 'sci'},
  {path: 'en/physics/index.html',               name: 'Physics',               area: 'sci'},
  {path: '',                                    name: 'Biology',               area: 'sci', soon: true}
];
// The Chinese version (zh/): Essentials, the topics that have their Chinese, and Maths (its pages are in both languages).
// Mockingbird and Reading are English only.
const ZH_SUBJECTS = [
  {path: 'zh/essentials/index.html',        name: 'Academic Essentials', zh: '学术基础', area: 'every', always: true},
  {path: 'maths/quick-fire/index.html?from=zh', name: 'Quick Fire Maths', zh: '快速心算', area: 'every', always: true, circuit: false, progress: 'maths:mental'},
  {path: 'zh/descriptive/index.html',       name: 'Descriptive language', zh: '描写性语言', area: 'eng'},
  {path: 'zh/web-design/index.html',        name: 'Web design',           zh: '网页设计',   area: 'media'},
  {path: 'zh/representation/index.html',    name: 'Representation',       zh: '再现',       area: 'media'},
  {path: 'zh/describing-people/index.html', name: 'Media Descriptors',    zh: '媒体描述词', area: 'media'},
  {path: 'zh/advertising/index.html',       name: 'Advertising',          zh: '广告',       area: 'media'},
  {path: 'maths/index.html?from=zh',        name: 'Maths',                zh: '数学',       area: 'maths', circuit: false},
  {path: 'zh/chemistry/index.html',         name: 'Chemistry',            zh: '化学',       area: 'sci'},
  {path: 'zh/physics/index.html',           name: 'Physics',              zh: '物理',       area: 'sci'},
  {path: '',                                name: 'Biology',              zh: '生物',       area: 'sci', soon: true}
];

const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const areaOf = key => AREAS.find(a=>a.key===key) || AREAS[0];
// In area order (as the pages show them)
const ordered = () => AREAS.flatMap(a=>SUBJECTS.filter(s=>s.area===a.key));
const switchable = s => !s.soon && !s.always && s.circuit !== false;

// The old topic-list markup (the Site content pages in status/ used to read en/index.html for this; they now ask here):
// Essentials as .ess-card, one section.topic-group per area with an h2, a.topic-link for topics with a switch, a.topic
// for the others. Links are written as they were on en/index.html (from the en/ folder).
function legacyHtml(){
  const rel = p => p.indexOf('en/') === 0 ? p.slice(3) : '../' + p;
  let html = '';
  const ess = SUBJECTS.find(s=>s.always);
  if(ess) html += `<div class="ess-card"><a class="cc-btn" href="${esc(rel(ess.path))}">Essentials</a></div>`;
  AREAS.forEach(a=>{
    const list = SUBJECTS.filter(s=>s.area===a.key && s !== ess && !s.soon);
    if(!list.length) return;
    html += `<section class="topic-group"><h2>${esc(a.name)}</h2>` + list.map(s=> switchable(s)
      ? `<div class="topic topic-sw"><a class="topic-link" href="${esc(rel(s.path))}"><span class="topic-name">${esc(s.name)}</span></a></div>`
      : `<a class="topic" href="${esc(rel(s.path))}"><span class="topic-name">${esc(s.name)}</span></a>`).join('') + `</section>`;
  });
  return html;
}

// One side's list: {SUBJECTS, ordered()} for 'en' (also maths) or 'zh'
const forSide = side => { const list = side === 'zh' ? ZH_SUBJECTS : SUBJECTS; return {SUBJECTS: list, ordered: () => AREAS.flatMap(a=>list.filter(s=>s.area===a.key))}; };

window.AEA_SUBJECTS = {AREAS, SUBJECTS, ZH_SUBJECTS, areaOf, ordered, switchable, legacyHtml, forSide};
})();
