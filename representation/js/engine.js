/* Engine: saved progress, the memory model, the word bank and session building.
   Ported from the Mandarin app (store.js, memory.js, banks.js, session.js). */
(function () {
  const KEY = "mediaVocabY9V1";
  const MIN = 60 * 1000, DAY = 24 * 60 * MIN;
  const GAP = [0, 10 * MIN, 1 * DAY, 3 * DAY, 7 * DAY, 21 * DAY];
  const MAX_BOX = GAP.length - 1;
  const BATCH = 4;
  const E = window.WORDBANK, P = window.PRACTICE;
  const LEVELS = E.SETS.map(s => s.id);
  const LIVE_LEVELS = LEVELS.filter(id => E.WORDS.some(w => w.lv === id));

  // ---------------------------------------------------------------- store
  const fresh = () => ({
    words: {}, items: {}, days: {}, best: {},
    settings: { zh: true, typed: false, levels: LIVE_LEVELS.slice() }
  });
  let state = fresh();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw && typeof raw === "object") {
      state = Object.assign(fresh(), raw);
      state.settings = Object.assign(fresh().settings, raw.settings || {});
    }
  } catch (e) { /* storage unavailable: practice still works this session */ }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function reset() { state = fresh(); Store.state = state; save(); }

  const Store = { state, save, reset };

  // ---------------------------------------------------------------- utilities
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const today = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const levelOn = lv => Store.state.settings.levels.includes(lv);

  // ---------------------------------------------------------------- word bank
  const BY_ID = Object.fromEntries(E.WORDS.map(w => [w.id, w]));
  const GROUP = Object.fromEntries(E.GROUPS.map(g => [g.id, g]));

  // Teaching order: by level, then taking turns across groups.
  const ORDER = [];
  LEVELS.forEach(lv => {
    const byGroup = E.GROUPS.map(g => E.WORDS.filter(w => w.lv === lv && w.g === g.id));
    let i = 0, added = true;
    while (added) {
      added = false;
      byGroup.forEach(list => { if (list[i]) { ORDER.push(list[i]); added = true; } });
      i++;
    }
  });
  const ALIKE = {};
  E.ALIKE.forEach(set => set.forEach(a => set.forEach(b => { if (a !== b) (ALIKE[a] = ALIKE[a] || new Set()).add(b); })));
  const plainW = w => w.w.replace(/\s*\(.*\)$/, "").toLowerCase();
  function clash(a, b) {
    return a.id === b.id || plainW(a) === plainW(b) || a.def === b.def || !!(ALIKE[a.id] && ALIKE[a.id].has(b.id));
  }

  const inGroup = (w, gid) => w.g === gid || (w.also || []).includes(gid);
  const inFocus = w => { const f = Store.state.settings.focus || []; return !f.length || f.some(g => inGroup(w, g)); };
  // Where the word sits in its own model sentence (for Fill the gap).
  function findGap(w) {
    const base = w.w.replace(/\s*\(.*\)$/, "");
    const re = new RegExp("(^|[^A-Za-z-])(" + base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")(?=[^A-Za-z-]|$)", "i");
    const m = w.ex.match(re);
    if (!m) return null;
    const at = m.index + m[1].length;
    return { before: w.ex.slice(0, at), word: m[2], after: w.ex.slice(at + m[2].length) };
  }
  const SETS = Object.fromEntries(E.SETS.map(s => [s.id, s]));
  const Bank = {
    all: E.WORDS, BY_ID, GROUP, GROUPS: E.GROUPS, SETS, inGroup, findGap,
    words: () => ORDER.filter(w => levelOn(w.lv)),
    // The words in the student's current focus (My words). Empty focus = every word.
    pool: () => ORDER.filter(w => levelOn(w.lv) && inFocus(w)),
    // Practice items can use different sets from the words (e.g. the English version uses Set 1 sentences with Set 2 words).
    items: (list) => list.filter(it => (Store.state.settings.itemLevels || Store.state.settings.levels).includes(it.lv)),
    clash
  };

  // ---------------------------------------------------------------- memory (Leitner boxes)
  // Each word has two skills: m = meaning (word → meaning), c = recall (meaning → word).
  function rec(id) { return Store.state.words[id] || null; }
  function ensure(id) {
    const s = Store.state.words;
    if (!s[id]) s[id] = { intro: 0, seen: 0, m: { b: 0, due: 0, r: 0, w: 0 }, c: { b: 0, due: 0, r: 0, w: 0 } };
    return s[id];
  }
  const isIntro = id => { const r = rec(id); return !!(r && r.intro); };
  function introduce(id) { const r = ensure(id); if (!r.intro) r.intro = Date.now(); r.seen++; save(); }
  function stage(id) {
    const r = rec(id);
    if (!r || !r.intro) return "new";
    const low = Math.min(r.m.b, r.c.b);
    if (low >= 4) return "known";
    if (low >= 2) return "familiar";
    return "learning";
  }
  function bump(s, correct) {
    const now = Date.now();
    if (correct) {
      s.r++;
      if (s.due <= now || s.b < 2) s.b = Math.min(MAX_BOX, s.b + 1);
      s.due = now + GAP[s.b];
    } else { s.w++; s.b = 1; s.due = now + GAP[1]; }
  }
  function countToday() { const t = today(); Store.state.days[t] = (Store.state.days[t] || 0) + 1; }
  function answer(id, skill, correct) {
    const r = ensure(id);
    if (!r.intro) r.intro = Date.now();
    r.seen++;
    bump(r[skill], correct);
    countToday(); save();
  }
  // Meeting a word inside another activity (grammar, sentences, errors): counts as exposure.
  function meet(ids) {
    (ids || []).forEach(id => { if (BY_ID[id]) { const r = ensure(id); r.seen++; if (!r.intro) r.intro = Date.now(); } });
  }
  function item(id, correct) {
    const it = Store.state.items[id] || (Store.state.items[id] = { r: 0, w: 0, last: 0 });
    it[correct ? "r" : "w"]++; it.last = Date.now();
    countToday(); save();
  }
  function dueSkill(id, now) {
    const r = rec(id); if (!r || !r.intro) return null;
    now = now || Date.now();
    const m = r.m.due <= now, c = r.c.due <= now;
    if (m && c) return r.m.b <= r.c.b ? "m" : "c";
    return m ? "m" : (c ? "c" : null);
  }
  function strength(id) { const r = rec(id); if (!r || !r.intro) return -1; return r.m.b + r.c.b - (r.m.w + r.c.w) * 0.1; }
  const dueWords = () => Bank.pool().filter(w => dueSkill(w.id)).sort((a, b) => strength(a.id) - strength(b.id));
  const newWords = () => Bank.pool().filter(w => !isIntro(w.id));
  function counts(words) {
    const out = { new: 0, learning: 0, familiar: 0, known: 0 };
    (words || Bank.words()).forEach(w => out[stage(w.id)]++);
    return out;
  }
  function streak() {
    const days = Store.state.days, d = new Date();
    const k = x => x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
    let n = 0;
    if (!days[k(d)]) d.setDate(d.getDate() - 1);
    while (days[k(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  const Memory = { rec, isIntro, introduce, stage, answer, meet, item, dueSkill, dueWords, newWords, counts, streak, strength, today, countToday };

  // ---------------------------------------------------------------- sessions
  // Step types: intro, meaning, recall, grammar, build, question, error.
  function practiceStep(w, skill) {
    skill = skill || (() => { const r = rec(w.id); return !r || r.m.b <= r.c.b ? "m" : "c"; })();
    const r = rec(w.id);
    // Once a word is settling in, sometimes test it inside its sentence instead.
    if (skill === "c" && r && r.c.b >= 2 && findGap(w) && Math.random() < .4) return { type: "usage", id: w.id };
    return { type: skill === "c" ? "recall" : "meaning", id: w.id };
  }
  function newBatch() {
    const batch = newWords().slice(0, BATCH);
    if (!batch.length) return [];
    const steps = [];
    batch.forEach(w => steps.push({ type: "intro", id: w.id }));
    shuffle(batch).forEach(w => steps.push({ type: "meaning", id: w.id }));
    shuffle(batch).forEach(w => steps.push({ type: "recall", id: w.id }));
    const ids = new Set(batch.map(w => w.id));
    const older = Bank.words().filter(w => isIntro(w.id) && !ids.has(w.id)).sort((a, b) => strength(a.id) - strength(b.id)).slice(0, 3);
    shuffle(older).forEach(w => steps.push(practiceStep(w)));
    return steps;
  }
  // Items you've never tried, or got wrong, come first. `avoid` skips recently seen items when it can.
  function pickItems(list, n, avoid) {
    const score = it => { const r = Store.state.items[it.id]; if (!r) return 0; return r.r - r.w * 2; };
    let pool = Bank.items(list);
    if (avoid && avoid.size) { const fresh = pool.filter(it => !avoid.has(it.id)); if (fresh.length >= Math.min(n, pool.length)) pool = fresh; }
    return shuffle(pool).sort((a, b) => score(a) - score(b)).slice(0, n);
  }
  const itemSteps = (list, type, n, avoid) => pickItems(list, n, avoid).map(it => ({ type, id: it.id }));
  // Something useful when a vocab session runs out: practise words already met, or learn new ones.
  function fallback() {
    const met = Bank.pool().filter(w => isIntro(w.id));
    if (met.length) return shuffle(met).slice(0, 8).map(w => practiceStep(w));
    return newBatch();
  }
  // Fill the gap options: the right word plus three that cannot fit.
  function gapOptions(w) {
    const gap = findGap(w);
    const cap = t => /^[A-Z]/.test(gap.word) ? t.charAt(0).toUpperCase() + t.slice(1) : t;
    let wrong = w.wrong && w.wrong.length >= 3 ? w.wrong.slice(0, 3) : null;
    if (!wrong) {
      // No hand-picked options: use words of a different part of speech, so only one answer fits.
      const pos = x => x.pos.split(/[ \/]/)[0];
      wrong = shuffle(Bank.all.filter(o => pos(o) !== pos(w) && !clash(o, w))).slice(0, 3).map(o => cap(o.w.replace(/\s*\(.*\)$/, "")));
    }
    return shuffle([{ t: gap.word, ok: true }].concat(wrong.map(t => ({ t, ok: false }))));
  }


  // ---------------------------------------------------------------- Keep going: one endless mixed feed
  // Weaker words more often: mostly from the weakest half of the words met so far.
  function weakWord(avoid, filter) {
    let pool = Bank.pool().filter(w => isIntro(w.id) && (!filter || filter(w)));
    if (pool.length < 4) pool = Bank.pool().filter(w => !filter || filter(w));
    if (!pool.length) return null;
    const fresh = pool.filter(w => !avoid || !avoid.has(w.id));
    if (fresh.length >= 3) pool = fresh;
    const sorted = pool.slice().sort((a, b) => strength(a.id) - strength(b.id));
    const weak = sorted.slice(0, Math.max(4, Math.ceil(sorted.length / 2)));
    const list = Math.random() < .7 ? weak : sorted;
    return list[Math.floor(Math.random() * list.length)];
  }
  // Up to n words that can share a Quick Match board (no look-alikes together).
  function matchSet(ordered, n) {
    const out = [];
    for (const w of ordered) { if (out.length >= n) break; if (!out.some(o => clash(o, w) || (o.zh && o.zh === w.zh))) out.push(w); }
    return out;
  }
  function qmatchStep(n, mode, firstIds, avoid) {
    const first = (firstIds || []).map(id => BY_ID[id]);
    let met = shuffle(Bank.pool().filter(w => isIntro(w.id) && !(firstIds || []).includes(w.id)));
    if (avoid) met = met.filter(w => !avoid.has(w.id)).concat(met.filter(w => avoid.has(w.id)));
    const rest = shuffle(Bank.pool().filter(w => !isIntro(w.id)));
    // Only words already met (plus the new ones being learned), so no word skips its introduction.
    let words = matchSet(first.concat(met), n);
    if (words.length < 3) words = matchSet(first.concat(met, rest), n);
    return words.length >= 3 ? { type: "qmatch", id: "qm:" + words.map(w => w.id).join(","), ids: words.map(w => w.id), mode } : null;
  }
  // Odd one out: three words of one kind and one of another. Only groups that are a single word class
  // (creative choices = nouns, describing people = adjectives, analytical verbs = verbs), so there's one fair answer.
  const ODD_GROUPS = ["creative", "describe", "verbs"];
  function oddStep() {
    const clean = g => Bank.words().filter(w => w.g === g && !(w.also || []).length && !/\//.test(w.pos));
    const metFirst = list => { const m = list.filter(w => isIntro(w.id)); return shuffle(m.length >= 3 ? m : list); };
    const focusG = ODD_GROUPS.filter(g => Bank.pool().some(w => w.g === g));
    const main = (focusG.length ? focusG : ODD_GROUPS)[Math.floor(Math.random() * (focusG.length || ODD_GROUPS.length))];
    const three = matchSet(metFirst(clean(main)), 3);
    const others = ODD_GROUPS.filter(g => g !== main);
    const from = others[Math.floor(Math.random() * others.length)];
    const odd = metFirst(clean(from))[0];
    if (three.length < 3 || !odd) return null;
    return { type: "odd", id: "odd:" + odd.id, words: shuffle(three.concat(odd)).map(w => w.id), odd: odd.id, main, from };
  }
  function tfStep(avoid) {
    const statements = Bank.items(P.BLITZ || []);
    if (statements.length && Math.random() < .4) {
      const s = pickItems(P.BLITZ, 1, avoid)[0];
      if (s) return { type: "tfs", id: s.id };
    }
    const w = weakWord(avoid);
    if (!w) return null;
    const truth = Math.random() < .5;
    const other = truth ? null : Session.choices(w, Bank.words()).find(o => o.id !== w.id);
    return { type: "tf", id: w.id, truth: truth || !other, shown: (truth || !other) ? w.id : other.id };
  }
  const ROTATION = ["usage", "recall", "tf", "odd", "qmatch", "grammar", "usage", "read", "meaning", "tf",
                    "build", "recall", "odd", "grammar", "qmatch", "usage", "read", "error"];
  let feedPtr = 0;
  function feedCard(type, avoid) {
    if (type === "usage" || type === "recall" || type === "meaning") {
      const w = weakWord(avoid, type === "usage" ? findGap : null);
      return w ? { type, id: w.id } : null;
    }
    if (type === "tf") return tfStep(avoid);
    if (type === "odd") return oddStep();
    if (type === "qmatch") return qmatchStep(5, "def", null, avoid);
    const list = { grammar: P.GRAMMAR, build: P.BUILD, read: P.READS, error: P.ERRORS }[type];
    const it = list && pickItems(list, 1, avoid)[0];
    return it ? { type, id: it.id } : null;
  }
  function feed(arg, avoid) {
    const steps = [];
    const due = dueWords().slice(0, 3);
    due.forEach(w => steps.push(practiceStep(w, dueSkill(w.id))));
    const fresh = newWords().slice(0, BATCH);
    if (due.length < 3 && fresh.length) {
      // New words: meet each one, match them up (with Chinese, if it's on), then check the meaning in English.
      fresh.forEach(w => steps.push({ type: "intro", id: w.id }));
      const qm = qmatchStep(Math.min(6, fresh.length + 2), "new", fresh.map(w => w.id), avoid);
      if (qm) steps.push(qm);
      shuffle(fresh).forEach(w => steps.push({ type: "meaning", id: w.id }));
    }
    for (let k = 0, tries = 0; k < 6 && tries < 20; tries++) {
      const card = feedCard(ROTATION[feedPtr++ % ROTATION.length], avoid);
      if (card) { steps.push(card); k++; }
    }
    return { title: "Keep going", steps };
  }

  const Session = {
    feed,
    // Mini-List: study a few words from the focus, then match them to their definitions.
    mini(n, avoid) {
      n = +n || 6;
      const pool = Bank.pool();
      let order = shuffle(pool.filter(w => !isIntro(w.id))).slice(0, Math.ceil(n / 2)).concat(shuffle(pool.filter(w => isIntro(w.id))));
      if (avoid) order = order.filter(w => !avoid.has(w.id)).concat(order.filter(w => avoid.has(w.id)));
      order = order.concat(shuffle(pool));
      const words = matchSet(order, n);
      if (words.length < 3) return { title: "Mini-List", steps: [] };
      const ids = words.map(w => w.id);
      return { title: "Mini-List", steps: [{ type: "study", id: "study:" + ids.join(","), ids }, { type: "qmatch", id: "qm:" + ids.join(","), ids, mode: "def" }] };
    },
    // Practise a given list of words again (from the results screen).
    again(ids) {
      const words = (ids || []).map(id => BY_ID[id]).filter(Boolean);
      const steps = [];
      if (words.length >= 3) steps.push({ type: "qmatch", id: "qm:" + ids.join(","), ids: matchSet(words, 6).map(w => w.id), mode: "def" });
      shuffle(words).forEach(w => steps.push({ type: findGap(w) ? "usage" : "meaning", id: w.id }));
      return { title: "Practise these again", steps };
    },
    smart() {
      const due = dueWords().slice(0, 8);
      const steps = shuffle(due).map(w => practiceStep(w, dueSkill(w.id)));
      if (due.length < 6) steps.push(...newBatch());
      if (!steps.length) steps.push(...fallback());
      return { title: "Today's words", steps };
    },
    newWords() { const s = newBatch(); return { title: "New words", steps: s.length ? s : fallback() }; },
    review() {
      const due = dueWords().slice(0, 12);
      return { title: "Review", steps: due.length ? shuffle(due).map(w => practiceStep(w, dueSkill(w.id))) : fallback() };
    },
    group(gid) {
      const pool = Bank.words().filter(w => inGroup(w, gid));
      const met = shuffle(pool.filter(w => isIntro(w.id))).slice(0, 8);
      const unmet = pool.filter(w => !isIntro(w.id)).slice(0, BATCH);
      const steps = [];
      unmet.forEach(w => steps.push({ type: "intro", id: w.id }, { type: "meaning", id: w.id }));
      met.forEach(w => steps.push(practiceStep(w)));
      return { title: GROUP[gid].name, steps };
    },
    grammar(arg, avoid) { return { title: "Grammar gaps", steps: itemSteps(P.GRAMMAR, "grammar", 10, avoid) }; },
    build(arg, avoid) { return { title: "Build the sentence", steps: itemSteps(P.BUILD, "build", 6, avoid) }; },
    questions(arg, avoid) { return { title: "Answer the question", steps: itemSteps(P.QUESTIONS || [], "question", 6, avoid) }; },
    errors(arg, avoid) { return { title: "Spot the error", steps: itemSteps(P.ERRORS, "error", 3, avoid) }; },
    usage(arg, avoid) {
      let pool = Bank.words().filter(w => findGap(w));
      if (avoid && avoid.size) { const fresh = pool.filter(w => !avoid.has(w.id)); if (fresh.length >= 5) pool = fresh; }
      const met = shuffle(pool.filter(w => isIntro(w.id))).sort((a, b) => strength(a.id) - strength(b.id));
      const unmet = shuffle(pool.filter(w => !isIntro(w.id)));
      const picked = shuffle(met.slice(0, 7).concat(unmet).slice(0, 10));
      return { title: "Fill the gap", steps: picked.map(w => ({ type: "usage", id: w.id })) };
    },
    daily(arg, avoid) {
      const steps = [];
      const due = dueWords().slice(0, 4);
      if (due.length) due.forEach(w => steps.push(practiceStep(w, dueSkill(w.id))));
      else newWords().slice(0, 2).forEach(w => steps.push({ type: "intro", id: w.id }, { type: "meaning", id: w.id }));
      steps.push(...itemSteps(P.GRAMMAR, "grammar", 3, avoid));
      steps.push(...itemSteps(P.BUILD, "build", 2, avoid));
      steps.push(...itemSteps(P.QUESTIONS || [], "question", 1, avoid));
      shuffle(Bank.words().filter(w => isIntro(w.id) && findGap(w))).slice(0, 2).forEach(w => steps.push({ type: "usage", id: w.id }));
      steps.push(...itemSteps(P.ERRORS, "error", 1, avoid));
      return { title: "Daily mix", steps };
    },
    // The next batch for an endless session of the same kind.
    more(kind, arg, avoid) {
      if (kind === "again") kind = "feed";      // after the missed words, carry on with the normal mix
      const def = Session[kind] && Session[kind](arg, avoid);
      return def && def.steps.length ? def.steps : fallback();
    },
    // Four meaning or word choices that can't be confused with each other.
    choices(word, pool) {
      pool = pool || Bank.all;
      const others = pool.filter(w => !clash(w, word));
      const same = others.filter(w => w.g === word.g);
      const picks = [];
      const add = w => { if (picks.length < 3 && !picks.some(p => clash(p, w))) picks.push(w); };
      shuffle(same).forEach(add); shuffle(others).forEach(add);
      return shuffle([word, ...picks]);
    },
    gapOptions, weakWord, matchSet,
    BATCH
  };

  // Item lookups
  const ITEMS = {};
  ["GRAMMAR", "BUILD", "QUESTIONS", "ERRORS", "BLITZ", "READS"].forEach(k => (P[k] || []).forEach(it => { ITEMS[it.id] = it; }));

  window.AE = { Store, Memory, Bank, Session, ITEMS, shuffle, LEVELS, LIVE_LEVELS, levelOn, P };
}());
