/* Screens: home, sessions (all step types), Blitz, word bank, settings, results. */
(function () {
  const { Store, Memory, Bank, Session, ITEMS, shuffle, LEVELS, LIVE_LEVELS, P } = window.AE;
  const app = document.getElementById("app");
  const S = () => Store.state.settings;
  // Typing answers is switched off for now: multiple choice only.
  Store.state.settings.typed = false;

  // ---------------------------------------------------------------- versions (tracks)
  // The site has two versions. Each one decides Chinese support, which word sets it uses,
  // and which activities appear on its home page. Change the workflow here.
  const TRACKS = {
    zh: {
      id: "zh", name: "Chinese version", nameZh: "中文版", topics: "../zh/index.html",
      zh: true, levels: ["1"], itemLevels: ["1"],
      blurb: "Learn the key words with Chinese support, then practise using them in English. The goal: be ready for the English version.",
      // Readiness for the English version
      ready: { words: 0.8, grammar: 0.75, grammarMin: 30 }
    },
    en: {
      id: "en", name: "English version", nameZh: "英文版", topics: "../en/index.html",
      zh: false, levels: ["2", "3"], itemLevels: ["1", "2", "3"],
      blurb: "Academic English for Media Studies: precise vocabulary, analytical sentences and accurate writing."
    }
  };
  let TRACK = TRACKS.en;
  function applyTrack() {
    const h = (location.hash || "").replace("#", "");
    TRACK = TRACKS[h] || TRACKS[window.PREVIEW_TRACK] || TRACKS[S().track] || TRACKS.en;
    const s = S();
    if (s.zhPref === undefined) s.zhPref = true;
    s.track = TRACK.id;
    s.levels = TRACK.levels.slice();
    s.itemLevels = TRACK.itemLevels.slice();
    // Chinese: always off in the English version; on by default in the Chinese version, but students can try without it.
    s.zh = TRACK.zh ? s.zhPref !== false : false;
    Store.save();
    document.documentElement.lang = "en";
  }
  applyTrack();
  window.addEventListener("hashchange", () => { applyTrack(); home(); });

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
  // Chinese explanations live in data/zh.js. They only appear after an answer, under the English.
  const ZH = Object.assign({ why: {}, err: {}, note: {} }, window.ZH || {});
  const zhLine = zh => zhOn() && zh ? `<span class="tip-zh" lang="zh">${esc(zh)}</span>` : "";
  const tip = (en, zh) => `<p class="tip">${esc(en)}${zhLine(zh)}</p>`;
  const bare = w => String(w).replace(/\s*\(.*\)$/, "");
  // Chinese next to the key word: only in the Chinese version, only when 中文 is on, never on answer options.
  const keyZh = w => TRACK.zh && zhOn() && w && w.zh ? ` <span class="kz" lang="zh">${esc(w.zh)}</span>` : "";
  const vibrate = () => { try { if (navigator.vibrate) navigator.vibrate(60); } catch (e) {} };
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
      ${opts.home ? `<a class="brand" href="${TRACK.topics}" aria-label="All units"><span class="brand-mark">Ms</span><span>Media Studies</span></a>`
                  : `<button class="iconbtn" data-act="back" aria-label="Back">${ICON.back}</button><h1 class="bar-title">${esc(title)}</h1>`}
      ${opts.right || (opts.home ? `${TRACK.zh ? `<button class="zhchip ${zhOn() ? "on" : ""}" data-act="zh" aria-pressed="${zhOn()}" title="Show or hide Chinese"><span lang="zh">中文</span> ${zhOn() ? "on" : "off"}</button>` : ""}<button class="iconbtn" data-act="settings" aria-label="Settings">${ICON.gear}</button>` : "")}
    </header>`;
  }

  function render() {
    const r = { home: renderHome, words: renderWords, settings: renderSettings, play: renderPlay, results: renderResults, blitz: renderBlitz, match: renderMatch,
                challenge: renderChallenge, chal: renderChal, mywords: renderMyWords }[screen.name];
    app.innerHTML = r();
    if (screen.name === "blitz") bindBlitz();
    if (screen.name === "chal") bindChal();
    const f = app.querySelector("[data-autofocus]");
    if (f) f.focus();
  }

  // ---------------------------------------------------------------- home
  // Bilingual label for the Chinese version: English first, Chinese underneath.
  const L = (en, zh) => TRACK.zh && zhOn() && zh ? `${en}<span class="lz" lang="zh">${zh}</span>` : en;
  const tile = (act, name, sub, meta, zhName) => `<button class="tile" data-act="${act}">
      <span class="tile-text"><span class="tile-name">${L(name, zhName)}</span><span class="tile-sub">${sub}</span></span>
      ${meta ? `<span class="tile-meta">${meta}</span>` : ""}${ICON.chev}</button>`;
  const soon = (name, sub) => `<div class="soon"><b>${name}</b><span>${sub}</span></div>`;
  // One step of the path: a number, a heading, a line of purpose and its activities.
  const stage = (n, title, zhTitle, sub, body) => `<section class="stage">
      <div class="stage-head"><span class="stage-num">${n}</span><div><h3>${L(title, zhTitle)}</h3><p class="muted">${sub}</p></div></div>
      ${body}</section>`;

  // How close a Chinese-version student is to the English version.
  function readiness() {
    const r = TRACK.ready, words = Bank.words(), c = Memory.counts(words);
    const wordPct = words.length ? (c.familiar + c.known) / words.length : 0;
    let right = 0, wrong = 0;
    P.GRAMMAR.forEach(it => { const x = Store.state.items[it.id]; if (x) { right += x.r; wrong += x.w; } });
    const gTotal = right + wrong, gPct = gTotal ? right / gTotal : 0;
    const wordsOk = wordPct >= r.words, grammarOk = gTotal >= r.grammarMin && gPct >= r.grammar;
    return { wordPct, gPct, gTotal, wordsOk, grammarOk, ready: wordsOk && grammarOk };
  }
  const meter = (label, pct, target, note) => `<div class="meter"><div class="meter-top"><span>${label}</span><b>${Math.round(pct * 100)}%</b></div>
      <div class="meter-bar"><i style="width:${Math.min(100, pct * 100)}%"></i><span class="meter-target" style="left:${target * 100}%" title="Target ${Math.round(target * 100)}%"></span></div>
      <p class="muted small">${note}</p></div>`;

  function renderHome() {
    return TRACK.id === "zh" ? homeZh() : homeEn();
  }

  function heroHtml(sub) {
    const streak = Memory.streak(), todayN = Store.state.days[Memory.today()] || 0;
    return `<section class="hero">
        <p class="eyebrow"><span class="track-pill track-${TRACK.id}">${TRACK.id === "zh" ? `<span lang="zh">${TRACK.nameZh}</span> ${TRACK.name}` : TRACK.name}</span>${streak ? plural(streak, "day") + " in a row" : ""}${todayN ? " · " + plural(todayN, "answer") + " today" : ""}</p>
        <h2 class="hero-title">Representation</h2>
        <p class="hero-sub">${sub}</p>
      </section>`;
  }

  // ---- Chinese version: three doors. Keep going (endless mix), Challenge (timed / lives), My words (choose words).
  const GROUP_ZH = { academic: "学术词汇", rep: "再现", verbs: "分析动词", creative: "创作手法", describe: "描述人物" };
  const focusName = () => {
    const f = S().focus || [];
    if (!f.length) return L("All words", "全部单词");
    return f.map(g => esc(Bank.GROUP[g] ? Bank.GROUP[g].name : g)).join(" + ");
  };
  const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>';
  function homeZh() {
    const words = Bank.words(), c = Memory.counts(words);
    const due = Memory.dueWords().length, fresh = Memory.newWords().length;
    const met = words.length - c.new;
    const b = Store.state.best || {};
    const bestTxt = [b.speed ? "Speed " + b.speed : "", b.survival ? "Survival " + b.survival : "", b.blitz ? "T/F " + b.blitz : ""].filter(Boolean).join(" · ");
    const meta = [due ? plural(due, "word") + " to review" : "", fresh ? fresh + " new to learn" : ""].filter(Boolean).join(" · ") || "All words met: keep them strong";
    const rd = readiness(), r = TRACK.ready;
    return bar("", { home: true }) + `<main class="page">
      ${heroHtml(TRACK.blurb)}

      <button class="focusbar" data-act="mywords"><span class="muted">Words:</span> <b>${focusName()}</b><span class="focus-change">Change</span></button>

      <button class="door door-main" data-act="feed">
        <span class="door-text">
          <span class="door-name">${L("Keep going", "继续练习")}</span>
          <span class="door-sub">Endless practice that mixes everything. Stop whenever you like.</span>
          <span class="door-meta">${meta}</span>
        </span>
        <span class="door-go">${ICON_PLAY}</span>
      </button>
      ${met === 0 ? `<p class="hint">${L("New here? Tap Keep going. You'll meet your first words, then practise them.", "第一次使用？点击“继续练习”，先认识几个新单词，然后练习。")}</p>` : ""}

      <div class="doors2">
        <button class="door" data-act="challenge">
          <span class="door-name">${L("Challenge", "挑战")}</span>
          <span class="door-sub">Beat the clock. Don't lose your lives.</span>
          ${bestTxt ? `<span class="door-meta">Best: ${bestTxt}</span>` : ""}
        </button>
        <button class="door" data-act="mywords">
          <span class="door-name">${L("My words", "我的单词")}</span>
          <span class="door-sub">Choose your words. Study them in small lists.</span>
          <span class="door-meta">${words.length} words</span>
        </button>
      </div>

      <section class="card main-card">
        <h3>${L(`${c.known} of ${words.length} words known`, `已掌握 ${c.known} / ${words.length} 个单词`)}</h3>
        ${stageBar(c)}
      </section>

      <section class="card ready-card ${rd.ready ? "is-ready" : ""}">
        <h3>${L("Road to the English version", "迈向英文版")}</h3>
        ${rd.ready
          ? `<p>${L("You're ready. Your words and grammar are strong enough for the English version.", "你已经准备好了！你的词汇和语法已经达到英文版的水平。")}</p>
             <a class="btn primary wide" href="#en">${L("Go to the English version", "进入英文版")}</a>`
          : `<p class="muted">${L("Reach both targets to unlock the English version.", "达到两个目标，就可以进入英文版。")}</p>`}
        ${meter("Words familiar or known", rd.wordPct, r.words, `Target ${Math.round(r.words * 100)}% of Set 1`)}
        ${meter("Grammar correct", rd.gPct, r.grammar, rd.gTotal < r.grammarMin ? `Answer at least ${r.grammarMin} grammar questions in Keep going (${rd.gTotal} so far)` : `Target ${Math.round(r.grammar * 100)}%, from ${rd.gTotal} answers`)}
        ${zhOn() ? `<p class="hint">${L("Tip: switch 中文 off at the top to practise in English only.", "提示：点击顶部的“中文”关闭中文，试试只用英文练习。")}</p>` : ""}
      </section>
      <p class="foot">Progress is saved on this device only.</p>
    </main>`;
  }

  // ---- Challenge: three short games with a rush (a clock or lives) and a best score.
  function renderChallenge() {
    const b = Store.state.best || {};
    return bar("Challenge") + `<main class="page">
      <p class="muted intro-line">Short, fast games. Every right answer helps you learn the word. Words: <b>${focusName()}</b></p>
      <nav class="tiles card">
        ${tile("ch-speed", "Speed round", "60 seconds. Read the meaning and choose the word.", b.speed ? "Best " + b.speed : "", "限时挑战")}
        ${tile("ch-survival", "Survival", "3 lives. Choose the meaning. The clock gets faster.", b.survival ? "Best " + b.survival : "", "生存挑战")}
        ${tile("ch-blitz", "True or false", "3 lives. Swipe or tap, fast.", b.blitz ? "Best " + b.blitz : "", "判断对错")}
      </nav>
    </main>`;
  }

  let ch = null, chRaf = 0, chT = 0;
  function stopChal() { cancelAnimationFrame(chRaf); clearTimeout(chT); }
  function startChal(mode) {
    stopChal();
    ch = { mode, right: 0, total: 0, lives: 3, missed: [], recent: [], over: false, locked: false };
    if (mode === "speed") ch.end = performance.now() + 60000;
    chQuestion();
    if (screen.name === "chal") { screen = { name: "chal" }; render(); window.scrollTo(0, 0); }
    else go({ name: "chal" });
  }
  function chQuestion() {
    const c = ch;
    let pool = Bank.pool();
    const met = pool.filter(w => Memory.isIntro(w.id));
    if (met.length >= 6) pool = met;
    let w, tries = 0;
    do { w = pick(pool); } while (c.recent.includes(w.id) && ++tries < 25);
    c.recent.push(w.id);
    if (c.recent.length > Math.min(6, pool.length - 1)) c.recent.shift();
    c.q = { w, opts: Session.choices(w, Bank.words().length >= 8 ? Bank.words() : Bank.all) };
    c.picked = null;
    c.qStart = performance.now();
    c.limit = c.mode === "survival" ? Math.max(5000, 12000 - c.right * 400) : 0;
  }
  const livesHtml = n => `<span class="lives" aria-label="${n} lives left">${[0, 1, 2].map(k => `<i class="${k < n ? "on" : ""}">♥</i>`).join("")}</span>`;
  function renderChal() {
    const c = ch;
    if (!c) return "";
    const title = c.mode === "speed" ? "Speed round" : "Survival";
    if (c.over) {
      const b = Store.state.best || {};
      return bar(title) + `<main class="page">
        <section class="card result"><p class="kicker">${c.mode === "speed" ? "Time's up" : "Game over"}</p><div class="big">${c.right}</div>
          <p class="muted">${c.right} right of ${c.total}${c.newBest ? " · new best!" : " · best " + (b[c.mode] || 0)}</p>
          <div class="row2"><button class="btn primary" data-act="ch-${c.mode}" data-autofocus>Play again</button><button class="btn" data-act="challenge-menu">Challenge</button></div></section>
        ${c.missed.length ? `<h3 class="section-label">To look at again</h3><ul class="missed">${c.missed.map(m => `<li>${m}</li>`).join("")}</ul>` : ""}
      </main>`;
    }
    const q = c.q, w = q.w, a = q.opts.indexOf(w);
    const cls = k => c.picked == null ? "" : k === a ? "right" : k === c.picked ? "wrong" : "dim";
    const right = c.mode === "survival" ? livesHtml(c.lives) : `<span class="ch-clock" id="ch-clock">${Math.max(0, Math.ceil((c.end - performance.now()) / 1000))}</span>`;
    return bar(title, { right }) + `<div class="scoreline"><span class="score-pct">${c.right}</span><span class="muted">right</span></div>
      <div class="progress timer"><i id="ch-timer" style="width:100%"></i></div>
      <main class="page play">
        ${c.mode === "speed"
          ? `<p class="kicker">Which word is it?</p><p class="prompt-def">${esc(w.def)}</p>`
          : `<p class="kicker">What does it mean?</p><div class="prompt-word">${esc(bare(w.w))}${keyZh(w)}</div>`}
        <div class="opts">${q.opts.map((o, k) => `<button class="opt ${cls(k)}" data-act="chpick" data-k="${k}" ${c.picked != null ? "disabled" : ""}>${c.mode === "speed" ? `<span class="opt-word">${esc(bare(o.w))}</span>` : esc(o.def)}</button>`).join("")}</div>
      </main>`;
  }
  function bindChal() {
    const c = ch;
    if (!c || c.over) return;
    cancelAnimationFrame(chRaf);
    const timer = document.getElementById("ch-timer"), clock = document.getElementById("ch-clock");
    const tick = () => {
      if (ch !== c || c.over || screen.name !== "chal") return;
      const now = performance.now();
      if (c.mode === "speed") {
        const left = (c.end - now) / 60000;
        if (timer) timer.style.width = Math.max(0, left * 100) + "%";
        if (clock) clock.textContent = Math.max(0, Math.ceil((c.end - now) / 1000));
        if (left <= 0) return endChal();
      } else if (!c.locked) {
        const left = 1 - (now - c.qStart) / c.limit;
        if (timer) timer.style.width = Math.max(0, left * 100) + "%";
        if (left <= 0) return chPick(null);
      }
      chRaf = requestAnimationFrame(tick);
    };
    chRaf = requestAnimationFrame(tick);
  }
  // Timed games: a right answer counts towards "known"; a rushed mistake doesn't knock the word back.
  function chPick(k) {
    const c = ch;
    if (!c || c.over || c.locked) return;
    const q = c.q, ok = k !== null && q.opts[k].id === q.w.id;
    c.picked = k === null ? -1 : k;
    c.total++;
    if (ok) { c.right++; Memory.answer(q.w.id, c.mode === "speed" ? "c" : "m", true); }
    else {
      Memory.meet([q.w.id]); Memory.countToday(); Store.save(); vibrate();
      if (c.mode === "survival") c.lives--;
      if (!c.missed.some(m => m.indexOf(">" + esc(q.w.w) + "<") >= 0)) c.missed.push(`<b>${esc(q.w.w)}</b>${keyZh(q.w)}: ${esc(q.w.def)}${k === null ? ' <span class="muted">(too slow)</span>' : ""}`);
    }
    c.locked = true;
    render();
    clearTimeout(chT);
    chT = setTimeout(() => {
      if (ch !== c || c.over) return;
      c.locked = false;
      if (c.mode === "survival" && c.lives <= 0) return endChal();
      chQuestion(); render();
    }, ok ? 320 : 1500);
  }
  function endChal() {
    const c = ch;
    stopChal();
    c.over = true; c.locked = false;
    const best = Store.state.best || (Store.state.best = {});
    if (c.right > (best[c.mode] || 0)) { best[c.mode] = c.right; c.newBest = true; }
    Store.save();
    if (screen.name === "chal") { render(); window.scrollTo(0, 0); }
  }

  // ---- My words: choose the focus (it applies to Keep going and Challenge) and study Mini-Lists.
  function renderMyWords() {
    const f = S().focus || [], size = S().miniSize || 6, all = Bank.words();
    const chip = (g, name, zh, n) => {
      const on = g ? f.includes(g) : !f.length;
      return `<button class="fchip ${on ? "on" : ""}" data-act="focus" data-g="${g}" aria-pressed="${on}"><span>${name}${TRACK.zh && zhOn() && zh ? `<span class="lz" lang="zh">${zh}</span>` : ""}</span><small>${n}</small></button>`;
    };
    return bar("My words") + `<main class="page">
      <section class="card">
        <h3>${L("Focus", "重点单词")}</h3>
        <p class="muted">Choose the words for Keep going and Challenge. Choose one group or more.</p>
        <div class="fchips">
          ${chip("", "All words", "全部单词", all.length)}
          ${Bank.GROUPS.map(g => { const n = all.filter(w => Bank.inGroup(w, g.id)).length; return n ? chip(g.id, esc(g.name), GROUP_ZH[g.id], n) : ""; }).join("")}
        </div>
      </section>

      <section class="card">
        <h3>${L("Mini-List", "小词表")}</h3>
        <p class="muted">Study a few words from your focus, then match them to their meanings. Then the next list, and the next.</p>
        <div class="sizechips" role="group" aria-label="Words in each list">${[4, 6, 8].map(n => `<button class="fchip small ${size === n ? "on" : ""}" data-act="msize" data-n="${n}" aria-pressed="${size === n}">${n} words</button>`).join("")}</div>
        <button class="btn primary wide" data-act="mini">${L("Start a Mini-List", "开始小词表")}</button>
      </section>

      <nav class="tiles card">
        ${tile("words", "Word bank", "Every word, with how well you know it", all.length + " words", "词库")}
        ${zhOn() ? tile("match", "Word match", "Connect each word to its Chinese meaning", "", "单词配对") : ""}
      </nav>
    </main>`;
  }

  // ---- English version: academic vocabulary → analytical sentences → accuracy → paragraphs
  function homeEn() {
    const words = Bank.words(), c = Memory.counts(words);
    const hasWords = words.length > 0;
    const due = Memory.dueWords().length, fresh = Memory.newWords().length;
    const next = due ? plural(due, "word") + " to review" : (fresh ? "Next: " + Session.BATCH + " new words" : "All words met. Keep reviewing.");
    return bar("", { home: true }) + `<main class="page">
      ${heroHtml(TRACK.blurb)}

      ${stage(1, "Academic vocabulary", "", "The precise words for analysing representation.", hasWords ? `
        <div class="card main-card"><h3>${c.known} of ${words.length} words known</h3>${stageBar(c)}
          <button class="btn primary wide" data-act="smart">Continue<small>${next}</small></button></div>
        <nav class="tiles">
          ${tile("new", "New words", "4 at a time, then test them", fresh ? fresh + " to learn" : "")}
          ${tile("review", "Review", "Words that are due again", due ? due + " due" : "")}
          ${tile("usage", "Fill the gap", "Choose the word that fits the sentence", "")}
          ${tile("words", "Word bank", "Every word, with how well you know it", words.length + " words")}
        </nav>` : `<div class="soon-grid">
          ${soon("Set 2: Developing", "construct, convey, connotation, perspective, target, appeal…")}
          ${soon("Set 3: Stretch", "ideology, preferred reading, subverts convention…")}
        </div>`)}

      ${stage(2, "Analytical sentences", "", "Build the sentences examiners want to read.", `<nav class="tiles">
        ${tile("build", "Build the sentence", "Technique → effect → meaning", Bank.items(P.BUILD).length + " sentences")}
      </nav>`)}

      ${stage(3, "Accuracy", "", "Find and fix the mistakes in real student writing.", `<nav class="tiles">
        ${tile("errors", "Spot the error", "Find the mistakes in a student's analysis", Bank.items(P.ERRORS).length + " texts")}
      </nav>`)}

      ${stage(4, "Paragraphs", "", "From sentences to a full analytical paragraph.", `<div class="soon-grid">
        ${soon("Upgrade it", "Replace vague words with precise ones")}
        ${soon("Answer the question", "Match your answer to the command word")}
        ${soon("Model paragraphs", "See it, take it apart, rebuild it")}
      </div>`)}
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
      ${w.note ? `<p class="wc-note">${esc(w.note)}${zhLine(ZH.note[w.id])}</p>` : ""}
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
        <h3>Version</h3>
        <p class="muted">You're using the <b>${TRACK.name}</b>${TRACK.zh ? ` (<span lang="zh">${TRACK.nameZh}</span>)` : ""}. ${TRACK.zh ? "It has Chinese support and builds up to the English version." : "It is English only and starts at B1/B2."}</p>
        <a class="btn" href="#${TRACK.id === "zh" ? "en" : "zh"}">Switch to the ${TRACK.id === "zh" ? "English version" : "Chinese version (中文版)"}</a>
      </section>
      ${TRACK.zh ? `<section class="card">${sw("zhPref", "Chinese support", "Show Chinese meanings and explanations. Switch off to practise in English only.")}</section>` : ""}
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
    run = { kind, arg, title: def.title, steps: def.steps, i: 0, right: 0, total: 0, missed: [], missedIds: new Set(), recent: new Set(), startStage: {}, st: {} };
    go({ name: "play" });
  }
  // Remember each word's stage when the session first meets it, for the before → after results.
  const touch = id => { if (run && run.startStage && Bank.BY_ID[id] && !(id in run.startStage)) run.startStage[id] = Memory.stage(id); };
  const ans = (id, skill, ok) => { touch(id); Memory.answer(id, skill, ok); };
  const meet = ids => { (ids || []).forEach(touch); Memory.meet(ids); };
  // Steps that come back 4 cards later when missed (the second go doesn't count).
  const RETRY = ["meaning", "recall", "usage", "grammar", "tf", "tfs", "odd", "build"];
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
        ? `<p class="kicker">What does it mean?</p><div class="prompt-word">${esc(w.w)}${keyZh(w)} <button class="iconbtn sm" data-act="say" data-say="${esc(w.w.replace(/\s*\(.*\)$/, ""))}" aria-label="Listen">${ICON.sound}</button></div>`
        : `<p class="kicker">Which word is it?</p><p class="prompt-def">${esc(w.def)}</p>`;
      return prompt + `<div class="opts">${st.opts.map((o, k) => `<button class="opt ${optCls(k, st.opts.indexOf(w))}" data-act="pick" data-k="${k}" ${st.picked != null ? "disabled" : ""}>
        ${isM ? esc(o.def) : `<span class="opt-word">${esc(o.w)}</span>`}</button>`).join("")}</div>`;
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
    if (step.type === "study") {
      return `<p class="kicker">Mini-List · study these ${step.ids.length} words</p>
        <ul class="studylist rich">${step.ids.map(id => { const w = Bank.BY_ID[id]; return `<li><span class="sl-word">${esc(bare(w.w))}${keyZh(w)}</span><span class="sl-def">${esc(w.def)}</span><span class="sl-ex">${highlight(w.ex, w.w)}</span></li>`; }).join("")}</ul>
        <button class="btn primary wide" data-act="next" data-autofocus>I'm ready: match them</button>`;
    }
    if (step.type === "qmatch") {
      if (!st.L) {
        st.L = shuffle(step.ids); st.R = shuffle(step.ids); st.done = new Set(); st.missed = new Set(); st.sel = null;
        // Brand-new words can be matched to their Chinese; everything else is matched to the English definition.
        st.zhMode = step.mode === "new" && TRACK.zh && zhOn();
      }
      const cell = (id, side) => {
        const w = Bank.BY_ID[id], done = st.done.has(id);
        const sel = st.sel && st.sel.side === side && st.sel.id === id, bad = st.bad && st.bad[side] === id;
        const inner = side === "L"
          ? `<span class="mw">${esc(bare(w.w))}</span>${st.zhMode ? "" : keyZh(w)}`
          : (st.zhMode ? `<span lang="zh">${esc(w.zh)}</span>` : `<span class="md">${esc(w.def)}</span>`);
        return `<button class="mcell ${side === "R" ? (st.zhMode ? "zhcell" : "defcell") : ""} ${done ? "done" : ""} ${sel ? "sel" : ""} ${bad ? "bad" : ""}" data-act="qtap" data-side="${side}" data-id="${id}" ${done || st.finished ? "disabled" : ""}>${inner}</button>`;
      };
      return `<p class="kicker">Quick Match · ${st.zhMode ? "tap a word, then its Chinese" : "tap a word, then its meaning"}</p>
        <div class="mgrid ${st.zhMode ? "" : "defs"}"><div class="mcol">${st.L.map(id => cell(id, "L")).join("")}</div><div class="mcol">${st.R.map(id => cell(id, "R")).join("")}</div></div>`;
    }
    if (step.type === "odd") {
      return `<p class="kicker">Odd one out</p><p class="prompt-def">Three are the same kind of word. Which one is different?</p>
        <div class="opts two">${step.words.map(id => { const w = Bank.BY_ID[id]; return `<button class="opt ${optCls(id, step.odd)}" data-act="opick" data-id="${id}" ${st.picked != null ? "disabled" : ""}><span class="opt-word">${esc(bare(w.w))}</span>${st.picked != null && keyZh(w) ? `<span class="opt-zh">${keyZh(w)}</span>` : ""}</button>`; }).join("")}</div>`;
    }
    if (step.type === "tf" || step.type === "tfs") {
      const tfc = v => st.picked == null ? "" : v === truthOf(step) ? "right" : v === st.picked ? "wrong" : "dim";
      const btns = `<div class="bz-btns"><button class="bzbtn no ${tfc(false)}" data-act="tfpick" data-v="0" ${st.picked != null ? "disabled" : ""}>✕<small>False</small></button><button class="bzbtn yes ${tfc(true)}" data-act="tfpick" data-v="1" ${st.picked != null ? "disabled" : ""}>✓<small>True</small></button></div>`;
      if (step.type === "tfs") return `<p class="kicker">True or false?</p><div class="tf-card"><p class="bz-statement">${esc(ITEMS[step.id].s)}</p></div>${btns}`;
      const w = Bank.BY_ID[step.id], shown = Bank.BY_ID[step.shown];
      return `<p class="kicker">True or false?</p>
        <div class="tf-card"><p class="prompt-word">${esc(bare(w.w))}${keyZh(w)}</p><p class="tf-means">means</p><p class="prompt-def">${esc(shown.def)}</p></div>${btns}`;
    }
    if (step.type === "read") {
      const it = ITEMS[step.id];
      if (!st.order) st.order = shuffle(it.opts.map((o, k) => k));
      const text = esc(it.text).replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, (m, shown, id) => `<button class="rw ${st.peek === id ? "on" : ""}" data-act="peek" data-id="${id}">${shown}</button>`);
      const pw = st.peek && Bank.BY_ID[st.peek];
      return `<p class="kicker">Read it</p><h2 class="err-title">${esc(it.title)}</h2>
        <div class="readtext">${text}</div>
        ${pw ? `<div class="peek"><b>${esc(bare(pw.w))}</b>${keyZh(pw)}<span>${esc(pw.def)}</span></div>` : `<p class="muted small">Tap a highlighted word to see what it means.</p>`}
        <p class="prompt-def">${esc(it.q)}</p>
        <div class="opts">${st.order.map(k => `<button class="opt ${optCls(k, it.a)}" data-act="pick" data-k="${k}" ${st.picked != null ? "disabled" : ""}>${esc(it.opts[k])}</button>`).join("")}</div>`;
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
    run.st.auto = ok;
    if (!ok) vibrate();
    run.st.fb = `<div class="fb ${ok ? "ok" : "no"}"><b>${label || (ok ? pick(["Right.", "Correct.", "Yes, that's it."]) : "Not quite.")}</b>${body}</div>
      <button class="btn primary wide" data-act="next" id="next-btn">Next</button>`;
  }
  const pick = a => a[Math.floor(Math.random() * a.length)];
  function score(ok, missedLine) {
    const step = run.steps[run.i];
    if (step && step.retry) return;           // a second go at a missed card doesn't count
    run.total++;
    if (ok) { run.right++; return; }
    if (missedLine) run.missed.push(missedLine);
    if (step && Bank.BY_ID[step.id]) run.missedIds.add(step.id);
    // A missed card comes back 4 cards later.
    if (step && RETRY.includes(step.type)) run.steps.splice(Math.min(run.i + 4, run.steps.length), 0, Object.assign({}, step, { retry: true }));
  }
  function scoreRaw(ok, line, wid) {
    run.total++;
    if (ok) run.right++; else { if (line) run.missed.push(line); if (wid) run.missedIds.add(wid); }
  }
  // Right answers move on by themselves, after enough time to read the feedback. Only mistakes stop play.
  let autoT = 0;
  function after() {
    render();
    const n = document.getElementById("next-btn");
    if (n) n.focus();
    clearTimeout(autoT);
    if (run.st.auto && n) {
      const fb = document.querySelector("#fb .fb");
      const ms = Math.min(5000, Math.max(1400, 800 + (fb ? fb.textContent.length : 40) * 28));
      n.style.setProperty("--auto", ms + "ms");
      n.classList.add("autonext");
      const st = run.st;
      autoT = setTimeout(() => { if (run && run.st === st && screen.name === "play") nextStep(); }, ms);
    }
  }
  const truthOf = step => step.type === "tfs" ? ITEMS[step.id].t : step.truth;

  function onPick(k) {
    const step = run.steps[run.i], st = run.st;
    if (st.picked != null) return;
    st.picked = k;
    if (step.type === "usage") {
      const w = Bank.BY_ID[step.id], ok = st.opts[k].ok, gap = Bank.findGap(w);
      ans(w.id, "c", ok);
      const full = `${esc(gap.before)}<mark>${esc(gap.word)}</mark>${esc(gap.after)}`;
      score(ok, full);
      feedback(ok, `<p>${full}</p><p><b>${esc(w.w)}</b> ${zhOn() && w.zh ? `<span lang="zh">${esc(w.zh)}</span> ` : ""}· ${esc(w.def)}</p>${!ok ? `<p class="tip">“${esc(st.opts[k].t)}” doesn't fit here.${w.note ? " " + esc(w.note) : ""}${zhLine(ZH.note[w.id])}</p>` : ""}`);
    } else if (step.type === "meaning" || step.type === "recall") {
      const w = Bank.BY_ID[step.id], ok = st.opts[k].id === w.id;
      ans(w.id, step.type === "meaning" ? "m" : "c", ok);
      score(ok, `<b>${esc(w.w)}</b>: ${esc(w.def)}`);
      feedback(ok, `<p><b>${esc(w.w)}</b> ${zhOn() && w.zh ? `<span lang="zh">${esc(w.zh)}</span> ` : ""}· ${esc(w.def)}</p><p class="ex">${highlight(w.ex, w.w)}</p>${!ok && w.note ? tip(w.note, ZH.note[w.id]) : ""}`);
    } else if (step.type === "grammar") {
      const it = ITEMS[step.id], ok = k === it.a;
      gramDone(it, ok);
    } else if (step.type === "read") {
      const it = ITEMS[step.id], ok = k === it.a;
      Memory.item(it.id, ok);
      meet([...it.text.matchAll(/\|([^\]]+)\]\]/g)].map(m => m[1]));
      score(ok, `<b>${esc(it.title)}</b>: ${esc(it.q)} ${esc(it.opts[it.a])}`);
      feedback(ok, `<p>${esc(it.q)} <b>${esc(it.opts[it.a])}</b></p>`);
    } else if (step.type === "question") {
      const it = ITEMS[step.id], ok = k === it.a;
      Memory.item(it.id, ok); meet(it.words);
      score(ok, `<b>${esc(it.cmd)}</b>: ${esc(it.why)}`);
      feedback(ok, `<p class="tip">${esc(it.why)}</p>`);
    }
    after();
  }

  function oddPick(id) {
    const step = run.steps[run.i], st = run.st;
    if (st.picked != null) return;
    st.picked = id;
    const ok = id === step.odd, odd = Bank.BY_ID[step.odd], G = Bank.GROUP;
    meet(step.words);
    const three = step.words.filter(x => x !== step.odd).map(x => `<b>${esc(bare(Bank.BY_ID[x].w))}</b>`).join(", ");
    score(ok, `Odd one out: <b>${esc(bare(odd.w))}</b> is from ${esc(G[step.from].name.toLowerCase())}`);
    feedback(ok, `<p>${three} are ${esc(G[step.main].name.toLowerCase())}. <b>${esc(bare(odd.w))}</b>${keyZh(odd)} is from ${esc(G[step.from].name.toLowerCase())}.</p><p class="ex">${highlight(odd.ex, odd.w)}</p>`);
    after();
  }
  function tfPick(v) {
    const step = run.steps[run.i], st = run.st;
    if (st.picked != null) return;
    st.picked = v;
    if (step.type === "tf") {
      const w = Bank.BY_ID[step.id], ok = v === step.truth;
      ans(w.id, "m", ok);
      score(ok, `<b>${esc(w.w)}</b>: ${esc(w.def)}`);
      feedback(ok, `${step.truth ? "" : `<p>No: that's the meaning of <b>${esc(bare(Bank.BY_ID[step.shown].w))}</b>.</p>`}<p><b>${esc(bare(w.w))}</b>${keyZh(w)} · ${esc(w.def)}</p><p class="ex">${highlight(w.ex, w.w)}</p>`);
    } else {
      const it = ITEMS[step.id], ok = v === it.t;
      Memory.item(it.id, ok);
      score(ok, `${esc(it.s)} <b>${it.t ? "True" : "False"}</b>`);
      feedback(ok, `<p><b>${it.t ? "True." : "False."}</b> ${esc(it.why)}${zhLine(ZH.why[it.id])}</p>`);
    }
    after();
  }
  // Quick Match: tap a word, then its partner. A pair counts as right only if it was matched first time.
  function qTap(side, id) {
    const st = run.st, step = run.steps[run.i];
    if (!st.L || st.done.has(id) || st.finished) return;
    if (!st.sel || st.sel.side === side) {
      st.sel = (st.sel && st.sel.id === id && st.sel.side === side) ? null : { side, id };
      st.bad = null;
      return render();
    }
    const other = st.sel; st.sel = null;
    const L = side === "L" ? id : other.id, Rr = side === "R" ? id : other.id;
    if (L === Rr) {
      st.done.add(L);
      const first = !st.missed.has(L), w = Bank.BY_ID[L];
      ans(L, "m", first);
      scoreRaw(first, `<b>${esc(w.w)}</b>${keyZh(w)}: ${esc(w.def)}`, L);
      if (st.done.size === st.L.length) {
        st.finished = true;
        // Words missed on the board come back as single questions a few cards later.
        if (!step.retry) [...st.missed].forEach((mid, n) => run.steps.splice(Math.min(run.i + 3 + n, run.steps.length), 0, { type: "meaning", id: mid, retry: true }));
        const firstN = st.L.length - st.missed.size;
        feedback(true, `<p>${firstN} of ${st.L.length} right first time.${st.missed.size ? " The ones you missed come back soon." : ""}</p>`, st.missed.size ? "Board done." : "Perfect board.");
        run.st.auto = st.missed.size === 0;
        return after();
      }
    } else {
      st.missed.add(L);
      st.bad = { L, R: Rr };
      vibrate();
      setTimeout(() => { if (run && run.st === st) { st.bad = null; render(); } }, 650);
    }
    render();
  }

  function gramDone(it, ok) {
    Memory.item(it.id, ok); meet(it.words);
    const full = esc(it.s).replace("___", `<mark>${esc(it.opts[it.a])}</mark>`);
    score(ok, full);
    feedback(ok, `<p>${full}</p>${tip(it.why, ZH.why[it.id])}`);
  }

  function buildCheck() {
    const it = ITEMS[run.steps[run.i].id], st = run.st;
    const ok = st.ans.length === it.tiles.length && st.ans.every((p, i) => p.t === it.tiles[i][0]);
    st.result = ok ? "ok" : "no";
    Memory.item(it.id, ok); meet(it.words);
    const correct = it.tiles.map(t => `<span class="r-${t[1]} inline">${esc(t[0])}</span>`).join(" ");
    score(ok, it.tiles.map(t => esc(t[0])).join(" "));
    feedback(ok, `${ok ? "" : `<p>${correct}</p>`}${tip(it.why, ZH.why[it.id])}`);
    after();
  }

  function errCheck() {
    const it = ITEMS[run.steps[run.i].id], st = run.st;
    const errs = st.tokens.map((t, i) => t.err ? i : -1).filter(i => i >= 0);
    const found = errs.filter(i => st.marked.has(i)).length;
    const falseMarks = [...st.marked].filter(i => !st.tokens[i].err).length;
    const ok = found === errs.length && falseMarks === 0;
    st.result = true;
    Memory.item(it.id, ok); meet(it.words);
    score(ok, `${esc(it.title)}: ${found} of ${errs.length} errors found`);
    const zhErr = ZH.err[it.id] || [];
    const list = errs.map((i, n) => { const t = st.tokens[i]; return `<li class="${st.marked.has(i) ? "got" : "miss"}"><s>${esc(t.text)}</s> → <b>${esc(t.err.right)}</b><span>${esc(t.err.why)}${zhLine(zhErr[n])}</span></li>`; }).join("");
    feedback(ok, `<p>You found ${found} of ${errs.length}${falseMarks ? ` and marked ${plural(falseMarks, "correct word")} as wrong` : ""}.</p><ul class="errlist">${list}</ul>`,
      ok ? "All found." : (found ? "Some found." : "Not quite."));
    after();
  }

  function nextStep() {
    clearTimeout(autoT);
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
      ${run.missedIds && run.missedIds.size >= 1 ? `<button class="btn accent wide" data-act="again-missed">Practise the ${plural(run.missedIds.size, "missed word")} again</button>` : ""}
      ${changesHtml()}
      ${run.missed.length ? `<h3 class="section-label">To look at again</h3><ul class="missed">${[...new Set(run.missed)].slice(-12).reverse().map(m => `<li>${m}</li>`).join("")}</ul>` : ""}
    </main>`;
  }
  // Each word met in the session, with its stage before and after. Words that moved up come first.
  function changesHtml() {
    const order = ["new", "learning", "familiar", "known"];
    const all = Object.keys(run.startStage || {}).map(id => ({ w: Bank.BY_ID[id], from: run.startStage[id], to: Memory.stage(id) }));
    if (!all.length) return "";
    const up = all.filter(r => order.indexOf(r.to) > order.indexOf(r.from));
    // Show the words that moved up a stage (or, if none did, a few of the words met).
    const rows = (up.length ? up : all).sort((a, b) => order.indexOf(b.to) - order.indexOf(a.to)).slice(0, 12);
    const more = (up.length ? up.length : all.length) - rows.length;
    const pill = st => `<span class="pill s-${st}">${STAGE_NAMES[st]}</span>`;
    return `<h3 class="section-label">${up.length ? `${plural(up.length, "word")} moved up` : `${plural(all.length, "word")} practised`}</h3><ul class="changes">${rows.map(r => `<li><span class="ch-word">${esc(bare(r.w.w))}${keyZh(r.w)}</span><span class="ch-stage">${r.from !== r.to ? pill(r.from) + "<span class=\"ch-arrow\">→</span>" : ""}${pill(r.to)}</span></li>`).join("")}${more > 0 ? `<li class="muted small">and ${more} more</li>` : ""}</ul>`;
  }

  // ---------------------------------------------------------------- Blitz
  let bz = null, raf = 0, bzTimeout = 0;
  function stopBlitz() { cancelAnimationFrame(raf); clearTimeout(bzTimeout); stopChal(); clearTimeout(autoT); if (bz) bz.over = bz.over || false; }
  function blitzCard() {
    const statements = Bank.items(P.BLITZ);
    const words = Bank.pool().length >= 4 ? Bank.pool() : Bank.words();
    const useStatement = statements.length && Math.random() < .4;
    if (useStatement) {
      let s; do { s = pick(statements); } while (bz.last === s.id && statements.length > 1);
      bz.last = s.id;
      return { kind: "s", text: s.s, truth: s.t, why: s.why, whyZh: ZH.why[s.id], id: s.id, limit: 7000 };
    }
    let w; do { w = pick(words); } while (bz.last === w.id && words.length > 1);
    bz.last = w.id;
    const truth = Math.random() < .5;
    const other = Session.choices(w, words).find(o => o.id !== w.id);
    const shown = truth || !other ? w : other;
    const useZh = false; // Blitz is English only
    return { kind: "w", word: w.w, mean: useZh ? shown.zh : shown.def, zh: useZh, truth: truth || !other, why: `${w.w}: ${w.def}`, id: w.id, limit: useZh ? 4500 : 6500 };
  }
  function finishBlitz() {
    stopBlitz();
    bz.over = true; bz.locked = false;
    const best = Store.state.best.blitz || 0;
    if (bz.right > best) { Store.state.best.blitz = bz.right; bz.newBest = true; }
    if (bz.bestStreak > (Store.state.best.blitzStreak || 0)) Store.state.best.blitzStreak = bz.bestStreak;
    Store.save();
    render(); window.scrollTo(0, 0);
  }
  function startBlitz() {
    stopBlitz();
    bz = { right: 0, total: 0, streak: 0, bestStreak: 0, lives: 3, misses: [], over: false, last: null };
    bz.card = blitzCard();
    if (screen.name === "blitz") { render(); window.scrollTo(0, 0); } else go({ name: "blitz" });
  }
  function renderBlitz() {
    if (!bz) return "";
    if (bz.over) {
      const best = Store.state.best.blitz || 0;
      return bar("True or false") + `<main class="page">
        <section class="card result"><p class="kicker">${bz.lives <= 0 ? "Game over" : "Finished"}</p><div class="big">${bz.right}</div>
          <p class="muted">${bz.right} right of ${bz.total} · longest run ${bz.bestStreak}${bz.newBest ? " · new best!" : " · best " + best}</p>
          <div class="row2"><button class="btn primary" data-act="blitz" data-autofocus>Play again</button><button class="btn" data-act="${TRACK.zh ? "challenge-menu" : "home"}">${TRACK.zh ? "Challenge" : "Home"}</button></div></section>
        ${bz.misses.length ? `<h3 class="section-label">Missed</h3><ul class="missed">${bz.misses.map(m => `<li>${m}</li>`).join("")}</ul>` : ""}
      </main>`;
    }
    const c = bz.card;
    return bar("True or false", { right: livesHtml(bz.lives) }) + `<div class="scoreline"><span class="score-pct">${bz.right}</span><span class="muted">right</span><span class="score-run">Run ${bz.streak}</span></div>` + `
      <div class="progress timer"><i id="bz-timer" style="width:100%"></i></div>
      <main class="page blitz">
        <div class="bz-stage">
          <div class="bz-card ${bz.flash || ""}" id="bz-card" tabindex="0" aria-label="Swipe right if true, left if false">
            ${c.kind === "w"
              ? `<p class="bz-kicker">Does it mean this?</p><p class="bz-word">${esc(c.word)}</p><p class="bz-mean ${c.zh ? "zh" : ""}" ${c.zh ? 'lang="zh"' : ""}>${esc(c.mean)}</p>`
              : `<p class="bz-kicker">True or false?</p><p class="bz-statement">${esc(c.text)}</p>`}
            ${bz.reveal ? `<p class="bz-why">${esc(bz.reveal)}${zhLine(bz.card.whyZh)}</p>` : ""}
          </div>
        </div>
        <div class="bz-btns">
          <button class="bzbtn no" data-act="bz" data-v="0" aria-label="False">✕<small>False</small></button>
          <button class="bzbtn yes" data-act="bz" data-v="1" aria-label="True">✓<small>True</small></button>
        </div>
        <p class="muted center small">Swipe the card, tap a button, or use the ← → keys. Three mistakes and it's over.</p>
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
    // A right answer about a word counts towards "known"; a rushed mistake doesn't knock it back.
    if (c.kind === "w" && ok) Memory.answer(c.id, "m", true);
    else { Memory.countToday(); if (c.kind === "w") Memory.meet([c.id]); Store.save(); }
    bz.total++;
    if (ok) {
      bz.right++; bz.streak++; bz.bestStreak = Math.max(bz.bestStreak, bz.streak);
      bz.flash = "fly-" + (v ? "yes" : "no");
      bz.locked = true;
      render();
      bzTimeout = setTimeout(() => { bz.locked = false; bz.flash = ""; bz.card = blitzCard(); render(); }, 260);
    } else {
      bz.streak = 0; bz.lives--; vibrate();
      const answerTxt = c.truth ? "True" : "False";
      bz.misses.push(`${c.kind === "w" ? `<b>${esc(c.word)}</b> = ${esc(c.mean)}` : esc(c.text)} <span class="muted">→ ${answerTxt}</span><br><span class="small">${esc(c.why)}${zhLine(c.whyZh)}</span>`);
      bz.flash = "shake";
      bz.reveal = (v === null ? "Too slow. " : "") + answerTxt + ". " + c.why;
      bz.locked = true;
      render();
      bzTimeout = setTimeout(() => {
        bz.locked = false; bz.flash = ""; bz.reveal = "";
        if (bz.lives <= 0) return finishBlitz();
        bz.card = blitzCard();
        render();
      }, 2200);
    }
  }


  // ---------------------------------------------------------------- Word match (English ↔ Chinese)
  let mt = null;
  const BOARD = 6;
  function matchBoard() {
    const pool = shuffle(Bank.words().filter(w => w.zh));
    const fresh = pool.filter(w => !mt.recent.has(w.id));
    const order = (fresh.length >= BOARD ? fresh : pool);
    const picked = [];
    for (const w of order) {
      if (picked.length >= BOARD) break;
      if (!picked.some(o => Bank.clash(o, w) || o.zh === w.zh)) picked.push(w);
    }
    picked.forEach(w => mt.recent.add(w.id));
    if (mt.recent.size > pool.length - BOARD) mt.recent = new Set(picked.map(w => w.id));
    mt.words = picked; mt.colL = shuffle(picked); mt.colR = shuffle(picked);
    mt.matched = new Set(); mt.sel = null; mt.bad = null; mt.phase = "study"; mt.boardMiss = 0;
  }
  function startMatch() {
    if (!zhOn()) return toast("Switch on 中文 to play Word match.");
    mt = { right: 0, total: 0, missed: [], recent: new Set() };
    matchBoard();
    go({ name: "match" });
  }
  function renderMatch() {
    const top = bar("Word match", { right: finishBtn("match-finish") }) + scoreLine(mt.right, mt.total);
    if (mt.phase === "study") {
      return top + `<main class="page play">
        <p class="kicker">Study these ${mt.words.length} words</p>
        <ul class="studylist">${mt.words.map(w => `<li><span class="opt-word">${esc(w.w.replace(/\s*\(.*\)$/, ""))}</span><span lang="zh">${esc(w.zh)}</span></li>`).join("")}</ul>
        <button class="btn primary wide" data-act="match-go" data-autofocus>Start matching</button></main>`;
    }
    const done = mt.matched.size === mt.words.length;
    const cell = (w, side) => {
      const id = w.id, m = mt.matched.has(id);
      const sel = mt.sel && mt.sel.side === side && mt.sel.id === id;
      const bad = mt.bad && mt.bad[side] === id;
      return `<button class="mcell ${side === "zh" ? "zhcell" : ""} ${m ? "done" : ""} ${sel ? "sel" : ""} ${bad ? "bad" : ""}" data-act="mtap" data-side="${side}" data-id="${id}" ${m ? "disabled" : ""} ${side === "zh" ? 'lang="zh"' : ""}>${esc(side === "zh" ? w.zh : w.w.replace(/\s*\(.*\)$/, ""))}</button>`;
    };
    return top + `<main class="page play">
      <p class="kicker">Tap a word, then its Chinese meaning</p>
      <div class="mgrid"><div class="mcol">${mt.colL.map(w => cell(w, "en")).join("")}</div><div class="mcol">${mt.colR.map(w => cell(w, "zh")).join("")}</div></div>
      ${done ? `<div class="fb ok"><b>${mt.boardMiss ? "Set complete." : "Perfect set."}</b><p>${mt.boardMiss ? plural(mt.boardMiss, "wrong match") + " on this set." : "No mistakes."}</p></div>
        <button class="btn primary wide" data-act="match-next" id="next-btn">Next set</button>` : ""}</main>`;
  }
  function matchTap(side, id) {
    if (mt.matched.has(id)) return;
    if (!mt.sel || mt.sel.side === side) { mt.sel = { side, id }; mt.bad = null; return render(); }
    const other = mt.sel; mt.sel = null;
    mt.total++;
    Memory.countToday();
    if (other.id === id) {
      mt.right++; mt.matched.add(id); mt.bad = null;
      Memory.meet([id]); Store.save();
    } else {
      mt.boardMiss++;
      const en = side === "en" ? id : other.id, zh = side === "zh" ? id : other.id;
      const w = Bank.BY_ID[en];
      if (!mt.missed.some(x => x.id === en)) mt.missed.push({ id: en, html: `<b>${esc(w.w)}</b> <span lang="zh">${esc(w.zh)}</span>` });
      mt.bad = { en, zh };
      Store.save();
      setTimeout(() => { if (mt && mt.bad && mt.bad.en === en) { mt.bad = null; render(); } }, 700);
    }
    render();
    if (mt.matched.size === mt.words.length) { const n = document.getElementById("next-btn"); if (n) n.focus(); }
  }
  function finishMatch() {
    run = { kind: "match", title: "Word match", right: mt.right, total: mt.total, missed: mt.missed.map(m => m.html), steps: [], i: 0, st: {}, recent: new Set() };
    screen = { name: "results" }; render(); window.scrollTo(0, 0);
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
      case "match": return startMatch();
      case "match-go": mt.phase = "board"; return render();
      case "match-next": matchBoard(); render(); return window.scrollTo(0, 0);
      case "mtap": return matchTap(b.dataset.side, b.dataset.id);
      case "match-finish": return finishMatch();
      case "zh": S().zhPref = !zhOn(); applyTrack(); return render();
      case "blitz": return startBlitz();
      case "again": { const k = run.kind, a = run.arg; history.length = 0; screen = { name: "home" }; return k === "match" ? startMatch() : startKind(k, a); }
      case "toggle": screen.open = screen.open === b.dataset.id ? null : b.dataset.id; return render();
      case "say": return speak(b.dataset.say);
      case "reset": screen.confirm = true; return render();
      case "reset-no": screen.confirm = false; return render();
      case "reset-yes": Store.reset(); applyTrack(); screen.confirm = false; render(); return toast("Progress deleted.");
      case "intro-ok": touch(run.steps[run.i].id); Memory.introduce(run.steps[run.i].id); return nextStep();
      case "feed": return startKind("feed");
      case "challenge": return go({ name: "challenge" });
      case "challenge-menu": stopBlitz(); history.length = 0; history.push({ name: "home" }); screen = { name: "challenge" }; render(); return window.scrollTo(0, 0);
      case "ch-speed": return startChal("speed");
      case "ch-survival": return startChal("survival");
      case "ch-blitz": return startBlitz();
      case "chpick": return chPick(+b.dataset.k);
      case "mywords": return go({ name: "mywords" });
      case "focus": {
        const g = b.dataset.g, f = (S().focus || []).slice();
        if (!g) S().focus = [];
        else { const i = f.indexOf(g); if (i >= 0) f.splice(i, 1); else f.push(g); S().focus = f; }
        Store.save(); return render();
      }
      case "msize": S().miniSize = +b.dataset.n; Store.save(); return render();
      case "mini": return startKind("mini", S().miniSize || 6);
      case "opick": return oddPick(b.dataset.id);
      case "tfpick": return tfPick(b.dataset.v === "1");
      case "qtap": return qTap(b.dataset.side, b.dataset.id);
      case "peek": st.peek = st.peek === b.dataset.id ? null : b.dataset.id; return render();
      case "again-missed": { const ids = [...run.missedIds]; history.length = 0; screen = { name: "home" }; return startKind("again", ids); }
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
    if (t.dataset.act === "setting") { S()[t.dataset.key] = t.checked; applyTrack(); }
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
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if ((screen.name === "play" || screen.name === "chal") && /^[1-4]$/.test(e.key)) {
      const o = app.querySelectorAll(".opts .opt:not([disabled])")[+e.key - 1];
      if (o) { e.preventDefault(); o.click(); }
      return;
    }
    if (screen.name === "play" && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      const t = app.querySelector(`.bzbtn.${e.key === "ArrowRight" ? "yes" : "no"}[data-act="tfpick"]:not([disabled])`);
      if (t) { e.preventDefault(); t.click(); }
      return;
    }
    if (screen.name === "blitz" && bz && !bz.over) {
      if (e.key === "ArrowRight") { e.preventDefault(); blitzAnswer(true); }
      if (e.key === "ArrowLeft") { e.preventDefault(); blitzAnswer(false); }
    }
  });

  render();
}());
