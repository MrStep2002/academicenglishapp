/* THE ENGLISH SUBJECT LIST (stage 1 of the redesign, 8 Nov 2026). One list for the whole English side:
   the sidebar's "My subjects", the Subjects menu in the top bar, the home page (Your subjects / More subjects),
   the landing page and the Site content pages (status/) all read it. To add a topic: copy a topic page (see README),
   then add one line below in its area. Nothing else needs changing.
   - path: the page, from the site's top folder (the same address the Daily Circuit switches use)
   - area: one of AREAS (the order of AREAS is the order on the pages)
   - always: always in the Daily Circuit (Academic English Essentials); no switch
   - circuit: false = not in the Daily Circuit (no "I study this" switch): Reading Comprehension, Maths
   - soon: shown greyed as "Coming soon", no page yet
   Load it before shell.js:  <script src="…/en/engine/subjects.js?v=…"></script> */
(function(){
'use strict';
const AREAS = [
  {key: 'every', name: 'Every subject', color: 'var(--sh-ink, #151935)'},   // navy (white in dark mode)
  {key: 'eng',   name: 'English Language', color: '#b4286a'},
  {key: 'media', name: 'Media', color: '#1a5cb0'},
  {key: 'maths', name: 'Maths', color: '#9a4a00'},
  {key: 'sci',   name: 'Science', color: '#11694a'}
];
const SUBJECTS = [
  {path: 'en/essentials/index.html',            name: 'Academic English Essentials', area: 'every', always: true},
  {path: 'en/reading-comprehension/index.html', name: 'Reading Comprehension', area: 'eng', circuit: false},
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
    const list = SUBJECTS.filter(s=>s.area===a.key && !s.always && !s.soon);
    if(!list.length) return;
    html += `<section class="topic-group"><h2>${esc(a.name)}</h2>` + list.map(s=> switchable(s)
      ? `<div class="topic topic-sw"><a class="topic-link" href="${esc(rel(s.path))}"><span class="topic-name">${esc(s.name)}</span></a></div>`
      : `<a class="topic" href="${esc(rel(s.path))}"><span class="topic-name">${esc(s.name)}</span></a>`).join('') + `</section>`;
  });
  return html;
}

window.AEA_SUBJECTS = {AREAS, SUBJECTS, areaOf, ordered, switchable, legacyHtml};
})();
