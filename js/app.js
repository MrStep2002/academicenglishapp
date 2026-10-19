/* Screens: home, sessions (all step types), Blitz, word bank, settings, results. */
(function () {
  const { Store, Memory, Bank, Session, ITEMS, shuffle, LEVELS, LIVE_LEVELS, P } = window.AE;
  const app = document.getElementById("app");
  const S = () => Store.state.settings;
  // Typing answers is switched off for now: multiple choice only.
  Store.state.settings.typed = false;

  // ---------------------------------------------------------------- helpers
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const plural = (n, w) => n + " " + w + (n === 1 ? "" : "s");
  const norm = s => String(s).toLowerCase().replace(/[’']/g, "'").replace(/[.!?,]+$/, "").replace(/\s+/g, " ").trim();
  function speak(text) {
    try { const u = new SpeechSynthesisUtterance(text); u.lang = "en-GB"; u.rate = .9; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {}
  }
  const ROLE_NAMES = { topic: "Topic", verb: "Verb", link: "Linker", detail: "Detail", hedge: "Hedge", judge: "Judgement" };
  const STAGE_NAMES = { new: "New", learning: "Learning", familiar: "Familiar", known: "Known" };
  const ICON = {
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    gear: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 010 7M18 6a8.5 8.5 0 010 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  const zhOn = () => S().zh;
  const lvTag = lv => `<span class="lv lv-${lv}">Set ${lv}</span>`;
  const setChip = (lv, levels) => { const live = LIVE_LEVELS.includes(lv), s = Bank.SETS[lv]; return `<button class="lvchip ${levels.includes(lv) ? "on" : ""}" data-act="level" data-lv="${lv}" ${live ? "" : "disabled"} aria-pressed="${levels.includes(lv)}"><span class="lvnum">${lv}</span>${esc(s.name)}${live ? "" : "<small>soon</small>"}</button>`; };

  function stageBar(c) {
    const total = c.new + c.learning + c.familiar + c.known || 1;
    return `<div class="stagebar" role="img" aria-label="${c.known} known, ${c.familiar} familiar, ${c.learning} learning, ${c.new} new">
      ${["known", "familiar", "learning"].map(k => `<i class="s-${k}" style="width:${c[k] / total * 100}%"></i>`).join("")}</div>
      <div class="legend">${["known", "familiar", "learning", "new"].map(k => `<span><i class="dot s-${k}"></i>${c[k]} ${STAGE_NAMES[k].toLowerCase()}</span>`).join("")}</div>`;
  }

  // ---------------------------------------------------------------- navigation
  let screen = { name: "home" };
  const history = [];
  function go(next) { history.push(screen); screen = next; render(); window.scrollTo(0, 0); }
  function back() { stopBlitz(); screen = history.pop() || { name: "home" }; if (screen.name === "play" || screen.name === "results") screen = { name: "home" }; render(); window.scrollTo(0, 0); }
  function home() { stopBlitz(); history.length = 0; screen = { name: "home" }; render(); window.scrollTo(0, 0); }

  function bar(title, opts) {
    opts = opts || {};
    return `<header class="bar">
      ${opts.home ? `<div class="brand"><span class="brand-mark">Ms</span><span>Media Studies</span></div>`
                  : `<button class="iconbtn" data-act="back" aria-label="Back">${ICON.back}</button><h1 class="bar-title">${esc(title)}</h1>`}
      ${opts.right || (opts.home ? `<button class="zhchip ${zhOn() ? "on" : ""}" data-act="zh" aria-pressed="${zhOn()}" title="Show or hide Chinese"><span lang="zh">中文</span> ${zhOn() ? "on" : "off"}</button><button class="iconbtn" data-act="settings" aria-label="Settings">${ICON.gear}</button>` : "")}
    </header>`;
  }

  function render() {
    const r = { home: renderHome, words: renderWords, settings: renderSettings, play: renderPlay, results: renderResults, blitz: renderBlitz }[screen.name];
    app.innerHTML = r();
    if (screen.name === "blitz") bindBlitz();
    const f = app.querySelector("[data-autofocus]");
    if (f) f.focus();
  }

  // ---------------------------------------------------------------- home
  function renderHome() {
    const c = Memory.counts();
    const due = Memory.dueWords().length;
    const fresh = Memory.newWords().length;
    const streak = Memory.streak();
    const todayN = Store.state.days[Memory.today()] || 0;
    const next = due ? plural(due, "word") + " to review" : (fresh ? "Next: " + Session.BATCH + " new words" : "All words met. Keep reviewing.");
    const met = Bank.words().length - c.new;
    const levels = S().levels;
    const tile = (act, name, sub, meta) => `<button class="tile" data-act="${act}">
        <span class="tile-text"><span class="tile-name">${name}</span><span class="tile-sub">${sub}</span></span>
        ${meta ? `<span class="tile-meta">${meta}</span>` : ""}${ICON.chev}</button>`;
    const best = Store.state.best.blitzStreak;
    return bar("", { home: true }) + `
    <main class="page">
      <section class="hero">
        <p class="eyebrow">${streak ? plural(streak, "day") + " in a row" : "Start a streak today"}${todayN ? " · " + plural(todayN, "answer") + " today" : ""}</p>
        <h2 class="hero-title">Representation</h2>
        <p class="hero-sub">Year 9 vocabulary for analysing adverts, posters and magazine covers, and the grammar to use it in your writing.</p>
        <div class="levels" role="group" aria-label="Word sets">${LEVELS.map(lv => setChip(lv, levels)).join("")}</div>
      </section>

      <section class="card main-card">
        <div class="mc-head">
          <div><h3>${c.known} of ${Bank.words().length} words known</h3><p class="muted">${met} met so far · ${levels.map(l => Bank.SETS[l].name).join(", ")}</p></div>
        </div>
        ${stageBar(c)}
        <div class="row2">
          <button class="btn primary" data-act="smart">Continue<small>${next}</small></button>
          <button class="btn accent" data-act="daily">Daily mix<small>Words, grammar, sentences, errors</small></button>
        </div>
        ${met === 0 ? `<p class="hint">New here? Tap Continue to learn your first ${Session.BATCH} words.</p>` : ""}
      </section>

      <h3 class="section-label">Words</h3>
      <nav class="tiles">
        ${tile("new", "New words", "Learn 4 at a time, then test them", fresh ? fresh + " to learn" : "")}
        ${tile("review", "Review", "Words that are due again", due ? due + " due" : "")}
        ${tile("words", "Word bank", "Every word, grouped, with how well you know it", Bank.words().length + " words")}
      </nav>

      <h3 class="section-label">Using the words</h3>
      <nav class="tiles">
        ${tile("usage", "Fill the gap", "Choose the word that fits the sentence", "")}
        ${Bank.items(P.GRAMMAR).length ? tile("grammar", "Grammar gaps", S().typed ? "Type the missing word" : "Choose the right form", Bank.items(P.GRAMMAR).length + " questions") : ""}
        ${Bank.items(P.BUILD).length ? tile("build", "Build the sentence", "Put the colour-coded parts of an analysis sentence in order", Bank.items(P.BUILD).length + " sentences") : ""}
        ${Bank.items(P.ERRORS).length ? tile("errors", "Spot the error", "Find the mistakes in a student's analysis", Bank.items(P.ERRORS).length + " texts") : ""}
      </nav>

      <h3 class="section-label">Games</h3>
      <nav class="tiles">
        ${tile("blitz", "Blitz", "True or false, fast. Swipe right or left", best ? "Best run " + best : "")}
      </nav>

      ${LEVELS.some(l => !LIVE_LEVELS.includes(l)) ? `<h3 class="section-label">Coming next</h3>
      <div class="soon-grid">${LEVELS.filter(l => !LIVE_LEVELS.includes(l)).map(l => `<div class="soon"><b>Set ${l}: ${esc(Bank.SETS[l].name)}</b><span>${esc(Bank.SETS[l].sub)}</span></div>`).join("")}</div>` : ""}
      <p class="foot">Progress is saved on this device only.</p>
    </main>`;
  }

  // ---------------------------------------------------------------- word bank
  function renderWords() {
    return bar("Word bank") + `<main class="page">
      <p class="muted intro-line">Tap a word to see its meaning. “Met” counts every time you see it in any activity.</p>
      ${Bank.GROUPS.map(g => {
        const list = Bank.words().filter(w => w.g === g.id);
        if (!list.length) return "";
        return `<section class="wgroup">
          <div class="wgroup-head"><div><h3>${esc(g.name)}</h3><p class="muted">${esc(g.sub)}</p></div>
            <button class="btn small" data-act="group" data-g="${g.id}">Practise</button></div>
          ${stageBar(Memory.counts(list))}
          <ul class="wlist">${list.map(w => {
            const st = Memory.stage(w.id), r = Memory.rec(w.id);
            const open = screen.open === w.id;
            return `<li class="${open ? "open" : ""}">
              <button class="wrow" data-act="toggle" data-id="${w.id}" aria-expanded="${open}">
                <span class="wname">${esc(w.w)}</span>${lvTag(w.lv)}
                ${zhOn() && w.zh ? `<span class="wzh">${esc(w.zh)}</span>` : ""}
                <span class="pill s-${st}">${STAGE_NAMES[st]}</span>
              </button>
              ${open ? `<div class="wdetail">${wordCard(w)}<p class="muted small">Met ${r ? plural(r.seen, "time") : "0 times"}</p></div>` : ""}
            </li>`;
          }).join("")}</ul>
        </section>`;
      }).join("")}
    </main>`;
  }

  function wordCard(w) {
    return `<div class="wc">
      <div class="wc-top"><span class="wc-word">${esc(w.w)}</span><span class="wc-pos">${esc(w.pos)}</span>${lvTag(w.lv)}
        <button class="iconbtn sm" data-act="say" data-say="${esc(w.w.replace(/\s*\(.*\)$/, "") + ". " + w.ex)}" aria-label="Listen">${ICON.sound}</button></div>
      <p class="wc-def">${esc(w.def)}</p>
      ${zhOn() && w.zh ? `<p class="wc-zh" lang="zh">${esc(w.zh)}</p>` : ""}
      <p class="wc-ex">${highlight(w.ex, w.w)}</p>
      ${w.fam ? `<p class="wc-fam"><span>Word family</span>${esc(w.fam)}</p>` : ""}
      ${w.note ? `<p class="wc-note">${esc(w.note)}</p>` : ""}
    </div>`;
  }
  function highlight(sentence, word) {
    const base = word.replace(/\s*\(.*\)$/, "");
    const safe = esc(sentence);
    const stem = base.length > 4 ? base.replace(/e$|y$/, "") : base;
    const re = new RegExp("\\b(" + stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[a-z]*)", "i");
    return safe.replace(re, "<mark>$1</mark>");
  }

  // ---------------------------------------------------------------- settings
  function renderSettings() {
    const s = S();
    const sw = (key, name, sub) => `<label class="switch"><span><b>${name}</b><span class="muted">${sub}</span></span>
      <input type="checkbox" id="set-${key}" data-act="setting" data-key="${key}" ${s[key] ? "checked" : ""}><i aria-hidden="true"></i></label>`;
    return bar("Settings") + `<main class="page">
      <section class="card">
        ${sw("zh", "Chinese support", "Show Chinese meanings. Switch off to hide Chinese everywhere in the app.")}
      </section>
      <section class="card">
        <h3>Word sets</h3>
        <p class="muted">Choose which sets appear in practice. Every set stays available.</p>
        <div class="levels">${LEVELS.map(lv => setChip(lv, s.levels)).join("")}</div>
      </section>
      <section class="card">
        <h3>Progress</h3>
        <p class="muted">Saved in this browser only, like the Mandarin app.</p>
        ${screen.confirm
          ? `<p class="warn">This deletes all progress on this device. It can't be undone.</p>
             <div class="row2"><button class="btn danger" data-act="reset-yes">Delete progress</button><button class="btn" data-act="reset-no">Keep it</button></div>`
          : `<button class="btn" data-act="reset">Reset progress</button>`}
      </section>
    </main>`;
  }

  // ---------------------------------------------------------------- sessions
  let run = null;
  // Every session is endless: it keeps adding more until you tap Finish.
  function startKind(kind, arg) {
    const def = Session[kind](arg);
    if (!def || !def.steps.length) { toast("Nothing to practise here yet. Try New words first."); return; }
    run = { kind, arg, title: def.title, steps: def.steps, i: 0, right: 0, total: 0, missed: [], recent: new Set(), st: {} };
    go({ name: "play" });
  }
  function scoreLine(right, total, extra) {
    const pct = total ? Math.round(right / total * 100) : null;
    return `<div class="scoreline" aria-live="polite"><span class="score-pct">${pct == null ? "–" : pct + "%"}</span><span class="muted">correct</span><span class="score-n">${right} of ${total}</span>${extra || ""}</div>`;
  }
  const finishBtn = act => `<button class="btn small finish" data-act="${act}">Finish</button>`;

  function renderPlay() {
    const step = run.steps[run.i];
    return bar(run.title, { right: finishBtn("finish") }) + scoreLine(run.right, run.total) + `
      <main class="page play">${stepHtml(step)}<div id="fb" aria-live="polite">${run.st.fb || ""}</div></main>`;
  }

  function stepHtml(step) {
    const st = run.st;
    if (step.type === "intro") {
      const w = Bank.BY_ID[step.id];
      return `<p class="kicker">New word · ${esc(Bank.GROUP[w.g].name)}</p>${wordCard(w)}
        <button class="btn primary wide" data-act="intro-ok" data-autofocus>Got it</button>`;
    }
    if (step.type === "meaning" || step.type === "recall") {
      const w = Bank.BY_ID[step.id];
      if (!st.opts) st.opts = Session.choices(w, Bank.words().length >= 8 ? Bank.words() : Bank.all);
      const isM = step.type === "meaning";
      const prompt = isM
        ? `<p class="kicker">What does it mean?</p><div class="prompt-word">${esc(w.w)} <button class="iconbtn sm" data-act="say" data-say="${esc(w.w.replace(/\s*\(.*\)$/, ""))}" aria-label="Listen">${ICON.sound}</button></div>`
        : `<p class="kicker">Which word is it?</p><p class="prompt-def">${esc(w.def)}</p>${zhOn() && w.zh ? `<p class="prompt-zh" lang="zh">${esc(w.zh)}</p>` : ""}`;
      return prompt + `<div class="opts">${st.opts.map((o, k) => `<button class="opt ${optCls(k, st.opts.indexOf(w))}" data-act="pick" data-k="${k}" ${st.picked != null ? "disabled" : ""}>
        ${isM ? `${esc(o.def)}${zhOn() && o.zh ? `<span class="opt-zh" lang="zh">${esc(o.zh)}</span>` : ""}` : `<span class="opt-word">${esc(o.w)}</span>`}</button>`).join("")}</div>`;
    }
    if (step.type === "usage") {
      const w = Bank.BY_ID[step.id], gap = Bank.findGap(w);
      if (!st.opts) st.opts = Session.gapOptions(w);
      const filled = st.picked != null ? esc(gap.word) : "&nbsp;";
      return `<p class="kicker">Which word fits? ${lvTag(w.lv)}</p>
        <p class="prompt-sent">${esc(gap.before)}<span class="gap">${filled}</span>${esc(gap.after)}</p>
        <div class="opts">${st.opts.map((o, k) => `<button class="opt ${optCls(k, st.opts.findIndex(x => x.ok))}" data-act="pick" data-k="${k}" ${st.picked != null ? "disabled" : ""}><span class="opt-word">${esc(o.t)}</span></button>`).join("")}</div>`;
    }
    if (step.type === "grammar") {
      const it = ITEMS[step.id];
      const sentence = esc(it.s).replace("___", `<span class="gap">${st.picked != null ? esc(st.typedVal != null ? st.typedVal : it.opts[st.picked]) : "&nbsp;"}</span>`);
      const head = `<p class="kicker">${esc(it.point)} ${lvTag(it.lv)}</p><p class="prompt-sent">${sentence}</p>`;
      if (S().typed) {
        return head + `<form class="typeform" data-act="type-submit"><label class="sr" for="type-in">Missing word</label>
          <input id="type-in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type the missing word(s)" ${st.picked != null ? "disabled" : "data-autofocus"} value="${esc(st.typedVal || "")}">
          <button class="btn primary" ${st.picked != null ? "disabled" : ""}>Check</button></form>`;
      }
      if (!st.order) st.order = shuffle(it.opts.map((o, k) => k));
      return head + `<div class="opts">${st.order.map(k => `<button class="opt ${optCls(k, it.a)}" data-act="pick" data-k="${k}" ${st.picked != null ? "disabled" : ""}>${esc(it.opts[k])}</button>`).join("")}</div>`;
    }
    if (step.type === "build") {
      const it = ITEMS[step.id];
      if (!st.pool) { st.pool = shuffle(it.tiles.concat(it.decoys || []).map((t, k) => ({ t: t[0], role: t[1], k }))); st.ans = []; }
      const roles = [...new Set(it.tiles.map(t => t[1]))];
      return `<p class="kicker">Build the sentence ${lvTag(it.lv)}</p>
        <p class="prompt-goal">${esc(it.goal)}</p>
        ${zhOn() ? `<p class="prompt-zh" lang="zh">${esc(it.zh)}</p>` : ""}
        <div class="answer ${st.result || ""}" id="answer">${st.ans.length ? st.ans.map((p, i) => `<button class="tilechip r-${p.role}" data-act="unpick" data-i="${i}" ${st.result ? "disabled" : ""}>${esc(p.t)}</button>`).join("") : `<span class="muted">Tap the parts below in order</span>`}</div>
        <div class="pool">${st.pool.map((p, i) => st.ans.includes(p) ? `<span class="tilechip ghost">${esc(p.t)}</span>` : `<button class="tilechip r-${p.role}" data-act="tile" data-i="${i}" ${st.result ? "disabled" : ""}>${esc(p.t)}</button>`).join("")}</div>
        <div class="rolekey">${roles.map(r => `<span class="r-${r}">${ROLE_NAMES[r]}</span>`).join("")}</div>
        ${st.result ? "" : `<div class="row2"><button class="btn primary" data-act="build-check" ${st.ans.length ? "" : "disabled"}>Check</button><button class="btn" data-act="build-clear">Clear</button></div>`}`;
    }
    if (step.type === "question") {
      const it = ITEMS[step.id];
      const q = esc(it.q).replace(esc(it.cmd), `<mark class="cmd">${esc(it.cmd)}</mark>`);
      return `<p class="kicker">Which answer does what the question asks? ${lvTag(it.lv)}</p>
        <div class="exam-q"><span class="exam-label">Question</span>${q}</div>
        <div class="opts">${(st.order || (st.order = shuffle(it.opts.map((o, k) => k)))).map(k => `<button class="opt ${optCls(k, it.a)}" data-act="pick" data-k="${k}" ${st.picked != null ? "disabled" : ""}>${esc(it.opts[k])}</button>`).join("")}</div>`;
    }
    if (step.type === "error") {
      const it = ITEMS[step.id];
      if (!st.tokens) { st.tokens = parseErrors(it.text); st.marked = new Set(); }
      const nErr = st.tokens.filter(t => t.err).length;
      return `<p class="kicker">Spot the error ${lvTag(it.lv)}</p>
        <h2 class="err-title">${esc(it.title)}</h2>
        <p class="muted">${S().typed ? "Tap every word that is wrong." : `There ${nErr === 1 ? "is 1 error" : "are " + nErr + " errors"}. Tap each one.`}</p>
        <div class="errtext">${st.tokens.map((t, i) => {
          if (t.punct) return `<span class="punct">${esc(t.text)}</span>`;
          let cls = st.marked.has(i) ? "t-marked" : "";
          if (st.result) {
            if (t.err && st.marked.has(i)) cls = "t-found";
            else if (t.err) cls = "t-missed";
            else if (st.marked.has(i)) cls = "t-false";
          }
          const label = st.result && t.err ? `<s>${esc(t.text)}</s> <ins>${esc(t.err.right)}</ins>` : esc(t.text);
          const sp = i && !t.punct ? " " : "";
          return sp + (st.result ? `<span class="tok ${cls}">${label}</span>` : `<button class="tok ${cls}" data-act="tok" data-i="${i}">${label}</button>`);
        }).join("")}</div>
        ${st.result ? "" : `<button class="btn primary wide" data-act="err-check">Check (${st.marked.size} marked)</button>`}`;
    }
    return "";
  }
  function optCls(k, a) {
    const st = run.st;
    if (st.picked == null) return "";
    if (k === a) return "right";
    if (k === st.picked) return "wrong";
    return "dim";
  }

  function parseErrors(text) {
    const out = [];
    const re = /\[([^\]|]+)\|([^\]|]+)\|([^\]]+)\]|([^\s\[]+)/g;
    let m;
    while ((m = re.exec(text))) {
      if (m[1]) out.push({ text: m[1], err: { right: m[2], why: m[3] } });
      else {
        const w = m[4];
        const lead = w.match(/^[^\w'’]+/), trail = w.match(/[^\w'’%°]+$/);
        const core = w.replace(/^[^\w'’]+/, "").replace(/[^\w'’%°]+$/, "");
        if (!core) { out.push({ text: w, punct: true }); continue; }
        if (lead) out.push({ text: lead[0], punct: true });
        out.push({ text: core });
        if (trail) out.push({ text: trail[0], punct: true });
      }
    }
    return out;
  }

  // Feedback panel
  function feedback(ok, body, label) {
    run.st.fb = `<div class="fb ${ok ? "ok" : "no"}"><b>${label || (ok ? pick(["Right.", "Correct.", "Yes, that's it."]) : "Not quite.")}</b>${body}</div>
      <button class="btn primary wide" data-act="next" id="next-btn">Next</button>`;
  }
  const pick = a => a[Math.floor(Math.random() * a.length)];
  function score(ok, missedLine) {
    run.total++;
    if (ok) run.right++; else if (missedLine) run.missed.push(missedLine);
  }
  function after() { render(); const n = document.getElementById("next-btn"); if (n) n.focus(); }

  function onPick(k) {
    const step = run.steps[run.i], st = run.st;
    if (st.picked != null) return;
    st.picked = k;
    if (step.type === "usage") {
      const w = Bank.BY_ID[step.id], ok = st.opts[k].ok, gap = Bank.findGap(w);
      Memory.answer(w.id, "c", ok);
      const full = `${esc(gap.before)}<mark>${esc(gap.word)}</mark>${esc(gap.after)}`;
      score(ok, full);
      feedback(ok, `<p>${full}</p><p><b>${esc(w.w)}</b> ${zhOn() && w.zh ? `<span lang="zh">${esc(w.zh)}</span> ` : ""}· ${esc(w.def)}</p>${!ok ? `<p class="tip">“${esc(st.opts[k].t)}” doesn't fit here.${w.note ? " " + esc(w.note) : ""}</p>` : ""}`);
    } else if (step.type === "meaning" || step.type === "recall") {
      const w = Bank.BY_ID[step.id], ok = st.opts[k].id === w.id;
      Memory.answer(w.id, step.type === "meaning" ? "m" : "c", ok);
      score(ok, `<b>${esc(w.w)}</b>: ${esc(w.def)}`);
      feedback(ok, `<p><b>${esc(w.w)}</b> ${zhOn() && w.zh ? `<span lang="zh">${esc(w.zh)}</span> ` : ""}· ${esc(w.def)}</p><p class="ex">${highlight(w.ex, w.w)}</p>${!ok && w.note ? `<p class="tip">${esc(w.note)}</p>` : ""}`);
    } else if (step.type === "grammar") {
      const it = ITEMS[step.id], ok = k === it.a;
      gramDone(it, ok);
    } else if (step.type === "question") {
      const it = ITEMS[step.id], ok = k === it.a;
      Memory.item(it.id, ok); Memory.meet(it.words);
      score(ok, `<b>${esc(it.cmd)}</b>: ${esc(it.why)}`);
      feedback(ok, `<p class="tip">${esc(it.why)}</p>`);
    }
    after();
  }
  function gramDone(it, ok) {
    Memory.item(it.id, ok); Memory.meet(it.words);
    const full = esc(it.s).replace("___", `<mark>${esc(it.opts[it.a])}</mark>`);
    score(ok, full);
    feedback(ok, `<p>${full}</p><p class="tip">${esc(it.why)}</p>`);
  }

  function buildCheck() {
    const it = ITEMS[run.steps[run.i].id], st = run.st;
    const ok = st.ans.length === it.tiles.length && st.ans.every((p, i) => p.t === it.tiles[i][0]);
    st.result = ok ? "ok" : "no";
    Memory.item(it.id, ok); Memory.meet(it.words);
    const correct = it.tiles.map(t => `<span class="r-${t[1]} inline">${esc(t[0])}</span>`).join(" ");
    score(ok, it.tiles.map(t => esc(t[0])).join(" "));
    feedback(ok, `${ok ? "" : `<p>${correct}</p>`}<p class="tip">${esc(it.why)}</p>`);
    after();
  }

  function errCheck() {
    const it = ITEMS[run.steps[run.i].id], st = run.st;
    const errs = st.tokens.map((t, i) => t.err ? i : -1).filter(i => i >= 0);
    const found = errs.filter(i => st.marked.has(i)).length;
    const falseMarks = [...st.marked].filter(i => !st.tokens[i].err).length;
    const ok = found === errs.length && falseMarks === 0;
    st.result = true;
    Memory.item(it.id, ok); Memory.meet(it.words);
    score(ok, `${esc(it.title)}: ${found} of ${errs.length} errors found`);
    const list = errs.map(i => { const t = st.tokens[i]; return `<li class="${st.marked.has(i) ? "got" : "miss"}"><s>${esc(t.text)}</s> → <b>${esc(t.err.right)}</b><span>${esc(t.err.why)}</span></li>`; }).join("");
    feedback(ok, `<p>You found ${found} of ${errs.length}${falseMarks ? ` and marked ${plural(falseMarks, "correct word")} as wrong` : ""}.</p><ul class="errlist">${list}</ul>`,
      ok ? "All found." : (found ? "Some found." : "Not quite."));
    after();
  }

  function nextStep() {
    const done = run.steps[run.i];
    if (done) run.recent.add(done.id);
    run.i++; run.st = {};
    if (run.i >= run.steps.length) {
      const more = Session.more(run.kind, run.arg, run.recent);
      if (!more.length) return finish();
      run.steps.push(...more);
      // Keep "recent" to roughly the last half of what's available so items rotate.
      if (run.recent.size > 40) run.recent = new Set([...run.recent].slice(-40));
    }
    render(); window.scrollTo(0, 0);
  }
  function finish() { screen = { name: "results" }; render(); window.scrollTo(0, 0); }

  // ---------------------------------------------------------------- results
  function renderResults() {
    const pct = run.total ? Math.round(run.right / run.total * 100) : 100;
    return bar(run.title) + `<main class="page">
      <section class="card result">
        <p class="kicker">Finished</p>
        <div class="big">${run.total ? pct + "%" : "Done"}</div>
        ${run.total ? `<p class="muted">${run.right} of ${run.total} correct</p>` : `<p class="muted">New words learned. They'll come back for review soon.</p>`}
        <div class="row2"><button class="btn primary" data-act="home">Home</button><button class="btn" data-act="again">Another round</button></div>
      </section>
      ${run.missed.length ? `<h3 class="section-label">To look at again</h3><ul class="missed">${run.missed.map(m => `<li>${m}</li>`).join("")}</ul>` : ""}
    </main>`;
  }

  // ---------------------------------------------------------------- Blitz
  let bz = null, raf = 0, bzTimeout = 0;
  function stopBlitz() { cancelAnimationFrame(raf); clearTimeout(bzTimeout); if (bz) bz.over = bz.over || false; }
  function blitzCard() {
    const statements = Bank.items(P.BLITZ);
    const words = Bank.words();
    const useStatement = statements.length && Math.random() < .45;
    if (useStatement) {
      let s; do { s = pick(statements); } while (bz.last === s.id && statements.length > 1);
      bz.last = s.id;
      return { kind: "s", text: s.s, truth: s.t, why: s.why, id: s.id, limit: 7000 };
    }
    let w; do { w = pick(words); } while (bz.last === w.id && words.length > 1);
    bz.last = w.id;
    const truth = Math.random() < .5;
    const other = Session.choices(w, words).find(o => o.id !== w.id);
    const shown = truth || !other ? w : other;
    const useZh = zhOn() && w.zh && Math.random() < .4;
    return { kind: "w", word: w.w, mean: useZh ? shown.zh : shown.def, zh: useZh, truth: truth || !other, why: `${w.w}: ${w.def}`, id: w.id, limit: useZh ? 4500 : 6500 };
  }
  function finishBlitz() {
    stopBlitz();
    bz.over = true; bz.locked = false;
    const best = Store.state.best.blitzStreak || 0;
    if (bz.bestStreak > best) { Store.state.best.blitzStreak = bz.bestStreak; bz.newBest = true; Store.save(); }
    render(); window.scrollTo(0, 0);
  }
  function startBlitz() {
    bz = { right: 0, total: 0, streak: 0, bestStreak: 0, misses: [], over: false, last: null };
    bz.card = blitzCard();
    go({ name: "blitz" });
  }
  function renderBlitz() {
    if (!bz) return "";
    if (bz.over) {
      const best = Store.state.best.blitzStreak || 0;
      const pct = bz.total ? Math.round(bz.right / bz.total * 100) : 0;
      return bar("Blitz") + `<main class="page">
        <section class="card result"><p class="kicker">Finished</p><div class="big">${bz.total ? pct + "%" : "–"}</div>
          <p class="muted">${bz.right} of ${bz.total} correct · longest run ${bz.bestStreak}${bz.newBest ? " (new best!)" : " · best ever " + best}</p>
          <div class="row2"><button class="btn primary" data-act="blitz" data-autofocus>Play again</button><button class="btn" data-act="home">Home</button></div></section>
        ${bz.misses.length ? `<h3 class="section-label">Missed</h3><ul class="missed">${bz.misses.map(m => `<li>${m}</li>`).join("")}</ul>` : ""}
      </main>`;
    }
    const c = bz.card;
    return bar("Blitz", { right: finishBtn("bz-finish") }) + scoreLine(bz.right, bz.total, `<span class="score-run">Run ${bz.streak}</span>`) + `
      <div class="progress timer"><i id="bz-timer" style="width:100%"></i></div>
      <main class="page blitz">
        <div class="bz-stage">
          <div class="bz-card ${bz.flash || ""}" id="bz-card" tabindex="0" aria-label="Swipe right if true, left if false">
            ${c.kind === "w"
              ? `<p class="bz-kicker">Does it mean this?</p><p class="bz-word">${esc(c.word)}</p><p class="bz-mean ${c.zh ? "zh" : ""}" ${c.zh ? 'lang="zh"' : ""}>${esc(c.mean)}</p>`
              : `<p class="bz-kicker">True or false?</p><p class="bz-statement">${esc(c.text)}</p>`}
            ${bz.reveal ? `<p class="bz-why">${esc(bz.reveal)}</p>` : ""}
          </div>
        </div>
        <div class="bz-btns">
          <button class="bzbtn no" data-act="bz" data-v="0" aria-label="False">✕<small>False</small></button>
          <button class="bzbtn yes" data-act="bz" data-v="1" aria-label="True">✓<small>True</small></button>
        </div>
        <p class="muted center small">Swipe the card, tap a button, or use the ← → keys.</p>
      </main>`;
  }
  function bindBlitz() {
    if (!bz || bz.over || bz.locked) return;
    bz.qStart = performance.now();
    bz.limit = Math.max(2600, bz.card.limit - bz.streak * 120);
    const timer = document.getElementById("bz-timer");
    const tick = () => {
      const left = 1 - (performance.now() - bz.qStart) / bz.limit;
      if (timer) timer.style.width = Math.max(0, left * 100) + "%";
      if (left <= 0) { blitzAnswer(null); return; }
      raf = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
    const card = document.getElementById("bz-card");
    let x0 = null;
    card.addEventListener("pointerdown", e => { x0 = e.clientX; card.setPointerCapture(e.pointerId); card.style.transition = "none"; });
    card.addEventListener("pointermove", e => { if (x0 == null) return; const dx = e.clientX - x0; card.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`; card.classList.toggle("lean-yes", dx > 40); card.classList.toggle("lean-no", dx < -40); });
    const end = e => {
      if (x0 == null) return;
      const dx = e.clientX - x0; x0 = null; card.style.transition = "";
      if (Math.abs(dx) > 80) blitzAnswer(dx > 0);
      else { card.style.transform = ""; card.classList.remove("lean-yes", "lean-no"); }
    };
    card.addEventListener("pointerup", end);
    card.addEventListener("pointercancel", end);
  }
  function blitzAnswer(v) {
    if (!bz || bz.over || bz.locked) return;
    cancelAnimationFrame(raf);
    const c = bz.card;
    const ok = v !== null && v === c.truth;
    Memory.countToday();
    if (c.kind === "w") Memory.meet([c.id]);
    Store.save();
    bz.total++;
    if (ok) {
      bz.right++; bz.streak++; bz.bestStreak = Math.max(bz.bestStreak, bz.streak);
      bz.flash = "fly-" + (v ? "yes" : "no");
      bz.locked = true;
      render();
      bzTimeout = setTimeout(() => { bz.locked = false; bz.flash = ""; bz.card = blitzCard(); render(); }, 260);
    } else {
      bz.streak = 0;
      const answerTxt = c.truth ? "True" : "False";
      bz.misses.push(`${c.kind === "w" ? `<b>${esc(c.word)}</b> = ${esc(c.mean)}` : esc(c.text)} <span class="muted">→ ${answerTxt}</span><br><span class="small">${esc(c.why)}</span>`);
      bz.flash = "shake";
      bz.reveal = (v === null ? "Too slow. " : "") + answerTxt + ". " + c.why;
      bz.locked = true;
      render();
      bzTimeout = setTimeout(() => {
        bz.locked = false; bz.flash = ""; bz.reveal = "";
        bz.card = blitzCard();
        render();
      }, 2200);
    }
  }

  // ---------------------------------------------------------------- toast
  let toastT = 0;
  function toast(msg) {
    let t = document.getElementById("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600);
  }

  // ---------------------------------------------------------------- events
  app.addEventListener("click", e => {
    const b = e.target.closest("[data-act]");
    if (!b || b.tagName === "FORM" || b.tagName === "INPUT") return;
    const act = b.dataset.act, st = run && run.st;
    switch (act) {
      case "back": return back();
      case "home": return home();
      case "settings": return go({ name: "settings" });
      case "words": return go({ name: "words" });
      case "level": {
        const lv = b.dataset.lv, lvls = S().levels;
        if (lvls.includes(lv)) { if (lvls.length > 1) lvls.splice(lvls.indexOf(lv), 1); else return toast("Keep at least one set switched on."); }
        else lvls.push(lv);
        lvls.sort((a, c) => LEVELS.indexOf(a) - LEVELS.indexOf(c));
        Store.save(); return render();
      }
      case "smart": return startKind("smart");
      case "daily": return startKind("daily");
      case "new": return startKind("newWords");
      case "review": return startKind("review");
      case "group": return startKind("group", b.dataset.g);
      case "grammar": return startKind("grammar");
      case "build": return startKind("build");
      case "questions": return startKind("questions");
      case "errors": return startKind("errors");
      case "usage": return startKind("usage");
      case "finish": return finish();
      case "bz-finish": return finishBlitz();
      case "zh": S().zh = !S().zh; Store.save(); return render();
      case "blitz": return startBlitz();
      case "again": { const k = run.kind, a = run.arg; history.length = 0; screen = { name: "home" }; return startKind(k, a); }
      case "toggle": screen.open = screen.open === b.dataset.id ? null : b.dataset.id; return render();
      case "say": return speak(b.dataset.say);
      case "reset": screen.confirm = true; return render();
      case "reset-no": screen.confirm = false; return render();
      case "reset-yes": Store.reset(); screen.confirm = false; render(); return toast("Progress deleted.");
      case "intro-ok": Memory.introduce(run.steps[run.i].id); return nextStep();
      case "pick": return onPick(+b.dataset.k);
      case "next": return nextStep();
      case "tile": { const p = st.pool[+b.dataset.i]; if (!st.ans.includes(p)) st.ans.push(p); return render(); }
      case "unpick": st.ans.splice(+b.dataset.i, 1); return render();
      case "build-clear": st.ans = []; return render();
      case "build-check": return buildCheck();
      case "tok": { const i = +b.dataset.i; st.marked.has(i) ? st.marked.delete(i) : st.marked.add(i); return render(); }
      case "err-check": return errCheck();
      case "bz": return blitzAnswer(b.dataset.v === "1");
    }
  });
  app.addEventListener("change", e => {
    const t = e.target;
    if (t.dataset.act === "setting") { S()[t.dataset.key] = t.checked; Store.save(); }
  });
  app.addEventListener("submit", e => {
    e.preventDefault();
    const it = ITEMS[run.steps[run.i].id], st = run.st;
    const val = document.getElementById("type-in").value;
    if (!val.trim()) return;
    const ok = it.acc.some(a => norm(a) === norm(val));
    st.typedVal = val; st.picked = ok ? it.a : -1;
    gramDone(it, ok);
    after();
  });
  document.addEventListener("keydown", e => {
    if (screen.name === "blitz" && bz && !bz.over) {
      if (e.key === "ArrowRight") { e.preventDefault(); blitzAnswer(true); }
      if (e.key === "ArrowLeft") { e.preventDefault(); blitzAnswer(false); }
    }
  });

  render();
}());
