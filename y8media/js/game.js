/* Website Words: Year 8 Web Design vocabulary game.

   Home (#)  →  Chinese version (#zh): tick word chunks, then Timed round / Type it / Choose
             →  English version (#en): Build the sentence, Missing words, Spot the error,
                plus Timed vocab on ticked chunks (10 s per word, 7 s after 10 right, 5 s after 20).
   Every game is endless: it deals every item once in a random order, then reshuffles and goes
   round again. A missed item gets a second go a few cards later. The × button shows a summary.
   Content: data/words.js and data/sentences.js. Progress is saved in this browser only. */
(function () {
  "use strict";

  const { LEVELS, GROUPS, WORDS, ALIKE } = window.WD;
  const { BUILD, GAPS, ERRORS } = window.WD_SENTENCES;
  const app = document.getElementById("app");
  const KEY = "y8WebDesignV1";
  const LV_KEYS = ["1", "2", "3", "all"];

  /* ================================================================ data */
  const byId = {};
  const groupOf = {};
  WORDS.forEach(w => { byId[w.id] = w; });
  GROUPS.forEach(g => { groupOf[g.id] = g; g.words = WORDS.filter(w => w.g === g.id); });
  WORDS.forEach(w => { w.lv = groupOf[w.g].lv; });
  const alike = {};
  ALIKE.forEach(set => set.forEach(a => {
    alike[a] = alike[a] || new Set();
    set.forEach(b => { if (a !== b) alike[a].add(b); });
  }));
  const gname = g => g.name + (g.part ? " " + g.part : "");

  // Typed answers: ignore case, spaces, hyphens and British/American spelling.
  const norm = s => String(s || "").toLowerCase()
    .replace(/colou?r/g, "colour").replace(/center/g, "centre")
    .replace(/yz(e|ed|es|ing)\b/g, "ys$1").replace(/iz(e|ed|es|ing|ation)\b/g, "is$1")
    .replace(/[^a-z]/g, "");
  const forms = w => w.w.split("/").map(s => s.trim()).concat(w.alt || []);
  const accepts = w => new Set(forms(w).map(norm));
  const formIndex = {};
  WORDS.forEach(w => forms(w).forEach(f => { const n = norm(f); if (!formIndex[n]) formIndex[n] = w; }));
  function lev(a, b) {
    const m = a.length, n = b.length;
    if (Math.abs(m - n) > 2) return 9;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }

  /* ================================================================ storage */
  let S = {};
  try { S = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { S = {}; }
  S.sel = S.sel || {};
  ["zh", "en"].forEach(v => { S.sel[v] = (Array.isArray(S.sel[v]) ? S.sel[v] : [GROUPS[0].id]).filter(id => groupOf[id]); });
  S.words = S.words || {};
  S.err = S.err || {};
  S.lvl = LV_KEYS.includes(S.lvl) ? S.lvl : "1";
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private mode: play on without saving */ } }
  function rec(id, ok) {
    const r = S.words[id] || (S.words[id] = { r: 0, w: 0 });
    if (ok) r.r++; else r.w++;
    r.last = ok ? 1 : 0;
    save();
  }

  /* ================================================================ helpers */
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const zhs = s => `<span lang="zh">${s}</span>`;
  const byLevel = (arr, lv) => lv === "all" ? arr.slice() : arr.filter(x => x.lv === lv);
  const selWords = v => GROUPS.filter(g => S.sel[v].includes(g.id)).flatMap(g => g.words.map(w => w.id));

  const svg = p => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const I = {
    chev: svg('<path d="M9 5l7 7-7 7"/>'),
    x: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    clock: svg('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2.5h5"/>'),
    keys: svg('<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6.5 10h.01M10.5 10h.01M14.5 10h.01M17.5 10h.01M7.5 14h9"/>'),
    choose: svg('<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor"/>'),
    tiles: svg('<rect x="2" y="5" width="8" height="6" rx="2"/><rect x="12" y="5" width="10" height="6" rx="2"/><rect x="2" y="14" width="12" height="6" rx="2"/>'),
    gap: svg('<path d="M2 12h4M18 12h4"/><rect x="8.5" y="7" width="7" height="10" rx="1.5" stroke-dasharray="2.2 2.2"/>'),
    spot: svg('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21M8 10.5h5"/>'),
    bolt: svg('<path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12z"/>'),
    check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>')
  };

  // Timers belong to the current screen; leaving a screen cancels them all.
  let game = null;
  let timers = [];
  function later(fn, ms) { const t = setTimeout(fn, ms); timers.push(t); return t; }
  function stop() { timers.forEach(clearTimeout); timers = []; game = null; }
  function setTheme(v) { document.body.className = v ? "v-" + v : ""; }

  /* ================================================================ events */
  const PAGE = {}; // actions on the version pages
  app.addEventListener("click", e => {
    const t = e.target.closest("[data-act]");
    if (!t || t.disabled || !app.contains(t)) return;
    const a = t.dataset.act;
    if (a === "quit") { e.preventDefault(); return quit(); }
    const fn = (game && game.act && game.act[a]) || PAGE[a];
    if (fn) { e.preventDefault(); fn(t, e); }
  });
  app.addEventListener("change", e => {
    const cb = e.target.closest("input[data-chunk]");
    if (!cb) return;
    const v = cb.dataset.v, id = cb.dataset.chunk;
    const set = new Set(S.sel[v]);
    cb.checked ? set.add(id) : set.delete(id);
    S.sel[v] = GROUPS.map(g => g.id).filter(x => set.has(x));
    save();
    cb.closest(".chunk").classList.toggle("on", cb.checked);
    refreshSel(v);
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && game && game.inPlay) return quit();
    // Enter on a focused button or field does that control's own job.
    if (e.key === "Enter" && e.target.closest && e.target.closest("button, a, input, textarea, select")) return;
    if (game && game.key && !e.metaKey && !e.ctrlKey && !e.altKey) game.key(e);
  });

  // Leaving a game: show its summary if anything was answered, otherwise go straight back.
  function quit() {
    const g = game;
    stop();
    if (g && g.summary && g.right + g.wrong > 0) return summary(g);
    return g && g.onQuit ? g.onQuit() : route();
  }

  /* ================================================================ router */
  function route() {
    stop();
    const h = location.hash.replace(/^#\/?/, "");
    if (h === "zh" || h === "en") pageVersion(h); else pageHome();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);

  /* ================================================================ home */
  function pageHome() {
    setTheme("");
    document.title = "Website Words · Year 8 Web Design";
    app.innerHTML = `
    <main class="page home">
      ${mockup()}
      <header class="intro">
        <p class="eyebrow">Year 8 · Web Design</p>
        <h1>Website Words<span class="h1-zh" lang="zh">网站设计词汇</span></h1>
        <p class="sub">Choose your version. ${zhs("请选择版本。")}</p>
      </header>
      <nav class="versions" aria-label="Versions">
        <a class="ver ver-zh" href="#zh">
          <span class="ver-badge" lang="zh">中</span>
          <span class="ver-text">
            <span class="ver-name">Chinese version ${zhs("中文版")}</span>
            <span class="ver-sub">Learn the key words in small chunks, with Chinese to help. ${zhs("借助中文，分组学习关键词。")}</span>
          </span>${I.chev}
        </a>
        <a class="ver ver-en" href="#en">
          <span class="ver-badge">En</span>
          <span class="ver-text">
            <span class="ver-name">English version</span>
            <span class="ver-sub">Build sentences, fix grammar and spot errors, plus a timed vocab round.</span>
          </span>${I.chev}
        </a>
      </nav>
    </main>`;
  }

  // A little webpage, labelled with words from the bank.
  function mockup() {
    return `<figure class="mock" aria-hidden="true">
      <div class="mock-bar"><i></i><i></i><i></i><span>maya-portfolio.com</span></div>
      <div class="mock-page">
        <div class="mock-nav">
          <span class="m-logo" data-tag="logo">M</span>
          <span class="m-menu" data-tag="menu"><b>About</b><b>Work</b><b>Contact</b></span>
        </div>
        <div class="mock-hero">
          <div class="m-copy">
            <span class="m-heading" data-tag="heading">Hi, I'm Maya.</span>
            <span class="m-line"></span><span class="m-line short"></span>
            <span class="m-btn" data-tag="button">See my work</span>
          </div>
          <div class="m-img" data-tag="image"><span class="m-sun"></span><span class="m-hill"></span><span class="m-hill two"></span></div>
        </div>
      </div>
    </figure>`;
  }

  /* ================================================================ version pages */
  function pageVersion(v) {
    setTheme(v);
    const isZh = v === "zh";
    document.title = (isZh ? "Chinese version" : "English version") + " · Website Words";
    if (isZh) {
      app.innerHTML = `
      <main class="page vpage">
        <a class="backlink" href="#">← Change version ${zhs("更换版本")}</a>
        <header class="intro">
          <p class="eyebrow">Chinese version ${zhs("中文版")} · Year 8 Web Design</p>
          <h1>Learn the words<span class="h1-zh" lang="zh">学习单词</span></h1>
          <p class="sub">Tick the chunks you want to learn, then choose a round. ${zhs("勾选要学习的词组，然后选择一个练习。")}</p>
        </header>
        <div class="split">
          ${chunkSection(v)}
          <aside class="rounds" aria-label="Rounds">
            <p class="selcount" id="selcount-zh"></p>
            <div class="round-grid">
              ${roundBtn("timed", I.clock, "Timed round", "限时挑战", "5 seconds per word", "每个单词5秒")}
              ${roundBtn("type", I.keys, "Type it", "拼写", "Read the meaning, type the word", "看释义，拼写单词")}
              ${roundBtn("choose", I.choose, "Choose", "选择", "Word or meaning: pick the answer", "看单词或释义，选出答案")}
            </div>
          </aside>
        </div>
      </main>`;
    } else {
      app.innerHTML = `
      <main class="page vpage">
        <a class="backlink" href="#">← Change version</a>
        <header class="intro">
          <p class="eyebrow">English version · Year 8 Web Design</p>
          <h1>Build better sentences</h1>
          <p class="sub">Practise the grammar you need to explain design choices, then test your vocabulary.</p>
        </header>
        <section class="block" aria-labelledby="sent-h">
          <div class="block-head">
            <h2 id="sent-h">Sentences and grammar</h2>
            ${levelSeg(S.lvl, "setlvl")}
          </div>
          <div class="games" id="games">${gameCards()}</div>
        </section>
        <section class="block" aria-labelledby="timed-h">
          <div class="block-head">
            <h2 id="timed-h">Timed vocab</h2>
            <p class="sub">Tick the word chunks, then race the clock: 10 seconds per word, 7 seconds after 10 right answers, and 5 seconds after 20.</p>
          </div>
          <div class="quickwrap">
            ${chunkSection(v)}
            <div class="quickbar">
              <button class="btn primary big" data-act="speed" id="quickbtn">${I.bolt}<span>Start Timed vocab</span></button>
            </div>
          </div>
        </section>
      </main>`;
    }
    refreshSel(v);
  }

  function roundBtn(id, ico, en, zh, subEn, subZh) {
    return `<button class="round" data-act="round" data-round="${id}" data-needsel>
      <span class="round-ico">${ico}</span>
      <span class="round-text"><b>${en}</b> ${zhs(zh)}<small>${subEn} · ${zhs(subZh)}</small></span>
    </button>`;
  }

  function levelSeg(cur, act) {
    const opts = [["1", "Foundation"], ["2", "Core"], ["3", "Stretch"], ["all", "All"]];
    return `<div class="seg" role="radiogroup" aria-label="Level">${opts.map(([k, n]) =>
      `<button role="radio" aria-checked="${cur === k}" class="${cur === k ? "on" : ""}" data-act="${act}" data-lv="${k}">${n}</button>`).join("")}</div>`;
  }

  function gameCards() {
    const lv = S.lvl;
    const b = byLevel(BUILD, lv).length, g = byLevel(GAPS, lv).length;
    const errs = byLevel(ERRORS, lv), done = errs.filter(x => S.err[x.id]).length;
    const card = (id, ico, name, sub, meta) => `<button class="game game-${id}" data-act="game" data-game="${id}">
      <span class="game-ico">${ico}</span>
      <span class="game-text"><b>${name}</b><span>${sub}</span><small${id === "speed" ? ' id="speedmeta"' : ""}>${meta}</small></span>${I.chev}</button>`;
    return card("build", I.tiles, "Build the sentence", "Put the colour-coded tiles in order. Some tiles are traps with grammar mistakes.", `${b} sentences`)
      + card("gap", I.gap, "Missing words", "Choose the word that fits. Watch out for answers with grammar mistakes.", `${g} sentences`)
      + card("errors", I.spot, "Spot the error", "Find the grammar mistakes hidden in a paragraph.", `${errs.length} paragraphs · ${done} done`)
      + card("speed", I.bolt, "Timed vocab", "Words and meanings against the clock. It speeds up as you get answers right.", `${selWords("en").length} words ticked below`);
  }

  function chunkSection(v) {
    const isZh = v === "zh";
    const legend = `<p class="legend" aria-hidden="true"><i class="d-ok"></i> right last time <i class="d-no"></i> wrong last time${isZh ? zhs("绿色＝上次答对，黄色＝上次答错") : ""}</p>`;
    return `<section class="chunks" aria-label="Word chunks">${legend}${["1", "2", "3"].map(lv => `
      <div class="lvl">
        <div class="lvl-head">
          <h3>Level ${lv} <span class="lvl-name">${LEVELS[lv].name}</span>${isZh ? " " + zhs(LEVELS[lv].zh) : ""}</h3>
          <button class="linkbtn" data-act="all" data-v="${v}" data-lv="${lv}"></button>
        </div>
        <ul class="chunk-list">${GROUPS.filter(g => g.lv === lv).map(g => chunkRow(g, v)).join("")}</ul>
      </div>`).join("")}</section>`;
  }

  function chunkRow(g, v) {
    const on = S.sel[v].includes(g.id), isZh = v === "zh";
    const dots = g.words.map(w => { const r = S.words[w.id]; return `<i class="${!r ? "" : r.last ? "d-ok" : "d-no"}"></i>`; }).join("");
    return `<li class="chunk${on ? " on" : ""}">
      <div class="chunk-row">
        <label class="chunk-main">
          <input type="checkbox" data-chunk="${g.id}" data-v="${v}"${on ? " checked" : ""}>
          <span class="tick" aria-hidden="true">${I.check}</span>
          <span class="chunk-name">${esc(gname(g))}${isZh ? zhs(esc(g.zh)) : ""}</span>
        </label>
        <button class="peek" data-act="peek" aria-expanded="false" aria-controls="pk-${v}-${g.id}" title="${isZh ? "See the words 查看单词" : "See the words"}">
          <span class="dots" aria-hidden="true">${dots}</span><span class="peek-n">${g.words.length}</span>${I.chev}
        </button>
      </div>
      <div class="peek-list" id="pk-${v}-${g.id}" hidden>${g.words.map(w => `
        <div class="pw"><b>${esc(w.w)}</b>${isZh ? zhs(esc(w.zh)) : ""}<span>${esc(w.d)}</span></div>`).join("")}</div>
    </li>`;
  }

  function refreshSel(v) {
    const n = selWords(v).length, isZh = v === "zh";
    const sc = document.getElementById("selcount-zh");
    if (sc) sc.innerHTML = n ? `<b>${n}</b> words selected · ${zhs(`已选 ${n} 个单词`)}` : `Tick at least one chunk · ${zhs("请至少勾选一个词组")}`;
    app.querySelectorAll("[data-needsel]").forEach(b => { b.disabled = !n; });
    const q = document.getElementById("quickbtn");
    if (q) { q.disabled = !n; q.querySelector("span").textContent = n ? `Start Timed vocab · ${n} words` : "Tick at least one chunk"; }
    const sm = document.getElementById("speedmeta");
    if (sm) sm.textContent = n ? `${n} words ticked below` : "Tick word chunks below first";
    app.querySelectorAll('[data-act="all"]').forEach(b => {
      const ids = GROUPS.filter(g => g.lv === b.dataset.lv).map(g => g.id);
      const all = ids.every(id => S.sel[v].includes(id));
      b.dataset.mode = all ? "clear" : "all";
      b.innerHTML = all ? (isZh ? `Clear ${zhs("取消全选")}` : "Clear") : (isZh ? `Select all ${zhs("全选")}` : "Select all");
    });
  }

  PAGE.all = t => {
    const v = t.dataset.v, ids = GROUPS.filter(g => g.lv === t.dataset.lv).map(g => g.id);
    const set = new Set(S.sel[v]);
    ids.forEach(id => (t.dataset.mode === "clear" ? set.delete(id) : set.add(id)));
    S.sel[v] = GROUPS.map(g => g.id).filter(x => set.has(x));
    save();
    app.querySelectorAll(`input[data-v="${v}"]`).forEach(cb => {
      cb.checked = set.has(cb.dataset.chunk);
      cb.closest(".chunk").classList.toggle("on", cb.checked);
    });
    refreshSel(v);
  };
  PAGE.peek = t => {
    const list = document.getElementById(t.getAttribute("aria-controls"));
    const open = list.hidden;
    list.hidden = !open;
    t.setAttribute("aria-expanded", String(open));
  };
  PAGE.round = t => {
    const ids = selWords("zh");
    if (!ids.length) return;
    const r = t.dataset.round;
    if (r === "type") startType(ids); else startMCQ("zh", r, ids);
  };
  PAGE.speed = () => {
    const ids = selWords("en");
    if (ids.length) startMCQ("en", "speed", ids);
    else document.getElementById("timed-h").scrollIntoView({ behavior: "smooth" });
  };
  PAGE.setlvl = t => {
    S.lvl = t.dataset.lv; save();
    const seg = t.closest(".seg");
    seg.outerHTML = levelSeg(S.lvl, "setlvl");
    document.getElementById("games").innerHTML = gameCards();
  };
  PAGE.game = t => {
    const g = t.dataset.game;
    if (g === "build") startBuild(S.lvl);
    else if (g === "gap") startGap(S.lvl);
    else if (g === "speed") PAGE.speed();
    else errorsList();
  };

  /* ================================================================ endless decks
     Deals every item once in a random order, then reshuffles and goes round again, so nothing
     comes back until everything has had a turn. A missed item also gets one second go
     a few cards later (when there are enough items for that to make sense). */
  function makeDeck(items, first) {
    const d = { size: items.length, cycle: 0, pos: 0, order: [], last: null, again: [], dealt: 0 };
    function refill() {
      d.order = shuffle(items);
      if (d.order.length > 1 && d.order[0] === d.last) d.order.push(d.order.shift()); // no repeat across the join
      d.pos = 0;
      d.cycle++;
    }
    d.next = () => {
      d.dealt++;
      const k = d.again.findIndex(a => a.due <= d.dealt && a.item !== d.last);
      if (k >= 0) { d.last = d.again.splice(k, 1)[0].item; return { item: d.last, retry: true }; }
      if (d.pos >= d.order.length) refill();
      d.last = d.order[d.pos++];
      return { item: d.last, retry: false };
    };
    d.miss = item => { if (d.size >= 5 && !d.again.some(a => a.item === item)) d.again.push({ item, due: d.dealt + 4 }); };
    if (first !== undefined) {
      refill();
      const i = d.order.indexOf(first);
      if (i > 0) { d.order.splice(i, 1); d.order.unshift(first); }
    }
    return d;
  }

  // Shared set-up for every game. Each game adds deal() (take the next card) and render().
  function newGame(v, title, opts) {
    stop(); setTheme(v);
    const g = game = Object.assign({ inPlay: true, summary: true, v, title, act: {}, right: 0, wrong: 0, missed: [], cur: null }, opts);
    g.show = () => { if (!g.cur || g.cur.done) g.deal(); g.render(); };
    g.next = () => { if (!g.cur || g.cur.moved) return; g.cur.moved = true; g.deal(); g.render(); window.scrollTo(0, 0); };
    g.hit = () => { g.right++; updTally(g); };
    g.miss = item => { g.wrong++; if (!g.missed.includes(item)) g.missed.push(item); g.deck.miss(item); updTally(g); };
    return g;
  }

  /* ================================================================ play frame */
  function tallyHtml(g) {
    return `<span class="t-ok" title="Right">${I.check}${g.right}</span><span class="t-no" title="Wrong">${I.x}${g.wrong}</span>`;
  }
  function updTally(g) { const t = document.getElementById("tally"); if (t) t.innerHTML = tallyHtml(g); }

  function frame(g, inner, title) {
    const d = g.deck, isZh = g.v === "zh";
    const pct = d.size ? Math.round(100 * d.pos / d.size) : 0;
    const round = d.cycle > 1 ? `<span class="pround">Round ${d.cycle}${isZh ? " " + zhs(`第${d.cycle}轮`) : ""}</span>` : "";
    return `<div class="play">
      <header class="pbar">
        <button class="xbtn" data-act="quit" aria-label="Finish">${I.x}</button>
        <div class="prog" role="progressbar" aria-label="Progress through this round" aria-valuemin="0" aria-valuemax="${d.size}" aria-valuenow="${d.pos}"><span style="width:${pct}%"></span></div>
        <span class="pcount">${round}${d.pos} / ${d.size}</span>
      </header>
      <main class="pmain">
        <div class="ptop"><p class="round-title">${title || g.title}</p><p class="tally" id="tally" aria-live="polite">${tallyHtml(g)}</p></div>
        ${g.cur && g.cur.retry ? `<p class="again">Second go${isZh ? " " + zhs("再试一次") : ""}</p>` : ""}
        ${inner}
      </main>
    </div>`;
  }
  const kbd = s => `<kbd>${s}</kbd>`;
  function focusIn(id) { const b = document.querySelector(`#${id} .btn.primary, #${id} .btn`); if (b) b.focus({ preventScroll: true }); }

  function wordCard(w, isZh) {
    return `<div class="wc"><b>${esc(w.w)}</b>${isZh ? zhs(esc(w.zh)) : ""}<span>${esc(w.d)}</span></div>`;
  }

  function distractors(target, pool, n) {
    const bad = alike[target.id] || new Set();
    const tw = norm(target.w);
    const ok = w => w.id !== target.id && !bad.has(w.id) && norm(w.w) !== tw && w.d !== target.d && w.zh !== target.zh;
    const out = [], seen = new Set();
    const add = list => { for (const w of shuffle(list)) { if (out.length >= n) return; if (!seen.has(w.id) && ok(w) && !out.some(o => (alike[o.id] || new Set()).has(w.id))) { out.push(w); seen.add(w.id); } } };
    add(pool);
    add(WORDS.filter(w => w.lv === target.lv));
    add(WORDS);
    return out;
  }

  function praise(isZh) {
    const en = ["Correct!", "Yes!", "Nice!", "Great!", "Spot on!"];
    const zh = ["对了！", "正确！", "很好！", "太棒了！", "答对了！"];
    const k = Math.floor(Math.random() * en.length);
    return isZh ? `${en[k]} ${zhs(zh[k])}` : en[k];
  }

  /* ================================================================ summary (after ×) */
  function summary(g) {
    setTheme(g.v);
    const isZh = g.v === "zh";
    const L = (en, zh) => isZh ? `${en} ${zhs(zh)}` : en;
    const total = g.right + g.wrong;
    const pct = total ? Math.round(100 * g.right / total) : 0;
    const msg = pct >= 90 ? ["Excellent!", "太棒了！"] : pct >= 70 ? ["Good work!", "做得好！"] : pct >= 50 ? ["Getting there. Keep going!", "有进步，继续加油！"] : ["Keep practising: try the missed ones again.", "继续练习：再练一遍错的。"];
    app.innerHTML = `<div class="play">
      <header class="pbar"><button class="xbtn" data-act="quit" aria-label="Finish">${I.x}</button><div class="prog"><span style="width:100%"></span></div><span class="pcount"></span></header>
      <main class="pmain results">
        <p class="round-title">${g.title}</p>
        <div class="score"><span class="big">${pct}<small>%</small></span><span class="score-sub">${g.right} of ${total} ${g.unit || "right"}${isZh ? " · " + zhs(`答对 ${g.right} / ${total}`) : ""}</span></div>
        <p class="msg">${L(msg[0], msg[1])}</p>
        <div class="res-actions">
          <button class="btn primary" data-act="resume">${L("Keep playing", "继续练习")}</button>
          ${g.practise && g.missed.length ? `<button class="btn" data-act="practise">${L("Practise the missed ones", "再练错的")}</button>` : ""}
          <button class="btn ghost" data-act="quit">${L("Finish", "结束")}</button>
        </div>
        ${g.missed.length ? `<h3 class="missed-h">${g.missedTitle}</h3><div class="missed">${g.missed.map(g.card).join("")}</div>` : ""}
      </main></div>`;
    game = {
      inPlay: true, onQuit: g.onQuit,
      act: {
        resume: () => { setTheme(g.v); game = g; g.show(); window.scrollTo(0, 0); },
        practise: () => g.practise(g.missed.slice())
      }
    };
    window.scrollTo(0, 0);
    const pb = app.querySelector(".res-actions .btn.primary"); if (pb) pb.focus({ preventScroll: true });
  }

  /* ================================================================ multiple-choice rounds
     timed  (Chinese): see the Chinese, choose the English word. 5 seconds.
     choose (Chinese): word → meaning (Chinese next to the word) or meaning → word. No clock.
     speed  (English): word → meaning or meaning → word. 10 s, then 7 s after 10 right, 5 s after 20. */
  const speedMs = right => right < 10 ? 10000 : right < 20 ? 7000 : 5000;

  function startMCQ(v, kind, ids) {
    const isZh = v === "zh";
    const titles = { timed: isZh ? `Timed round ${zhs("限时挑战")}` : "Timed round", choose: `Choose ${zhs("选择")}`, speed: "Timed vocab" };
    const g = newGame(v, titles[kind], {
      missedTitle: isZh ? `Words to practise ${zhs("需要再练的单词")}` : "Words to practise",
      card: id => wordCard(byId[id], isZh),
      practise: m => startMCQ(v, kind, m)
    });
    g.deck = makeDeck(ids);
    const pool = ids.map(id => byId[id]);

    g.deal = () => {
      const { item, retry } = g.deck.next();
      const w = byId[item];
      const type = kind === "timed" ? "zh2w" : (Math.random() < 0.5 ? "w2d" : "d2w");
      g.cur = { item, retry, w, type, done: false, moved: false };
    };
    g.render = () => {
      const c = g.cur, w = c.w;
      c.opts = shuffle([w].concat(distractors(w, pool, 3)));  // answers in a new random order every time
      c.done = false;
      const ms = kind === "timed" ? 5000 : kind === "speed" ? speedMs(g.right) : 0;
      let ask, prompt;
      if (c.type === "zh2w") {
        ask = `Which English word? ${zhs("是哪个英文单词？")}`;
        prompt = `<p class="q-zh" lang="zh">${esc(w.zh)}</p>`;
      } else if (c.type === "w2d") {
        ask = isZh ? `What does it mean? ${zhs("这个单词是什么意思？")}` : "What does it mean?";
        prompt = `<p class="q-word">${esc(w.w)}</p>${isZh ? `<p class="q-wzh" lang="zh">${esc(w.zh)}</p>` : ""}`;
      } else {
        ask = isZh ? `Which word matches? ${zhs("哪个单词符合这个释义？")}` : "Which word matches this meaning?";
        prompt = `<p class="q-def">${esc(w.d)}</p>`;
      }
      const title = kind === "speed" ? `${g.title}<span class="speed" title="Seconds per word">${ms / 1000} s</span>` : g.title;
      app.innerHTML = frame(g, `
        ${ms ? `<div class="timer" aria-hidden="true"><span id="tbar"></span></div>` : ""}
        <p class="ask">${ask}</p>
        <div class="qcard">${prompt}</div>
        <div class="opts${c.type === "w2d" ? " long" : ""}">${c.opts.map((o, k) => `
          <button class="opt" data-act="pick" data-k="${k}"><span class="key">${k + 1}</span><span class="opt-t">${esc(c.type === "w2d" ? o.d : o.w)}</span></button>`).join("")}
        </div>
        <div class="fb" id="fb" aria-live="polite"></div>`, title);
      if (ms) startTimer(ms);
    };

    function startTimer(ms) {
      const bar = document.getElementById("tbar");
      bar.style.width = "100%";
      requestAnimationFrame(() => requestAnimationFrame(() => {
        bar.style.transition = `width ${ms}ms linear`;
        bar.style.width = "0%";
      }));
      g.lowT = later(() => bar.classList.add("low"), ms - Math.min(1500, ms / 3));
      g.endT = later(() => answer(-1), ms);
    }
    function freezeTimer() {
      clearTimeout(g.lowT); clearTimeout(g.endT);
      const bar = document.getElementById("tbar");
      if (bar) { const wpx = getComputedStyle(bar).width; bar.style.transition = "none"; bar.style.width = wpx; }
    }

    function answer(k) {
      const c = g.cur;
      if (!c || c.done) return;
      c.done = true;
      freezeTimer();
      const ok = k >= 0 && c.opts[k] === c.w;
      rec(c.w.id, ok);
      app.querySelectorAll(".opt").forEach((b, i) => {
        b.disabled = true;
        if (c.opts[i] === c.w) b.classList.add("right");
        else if (i === k) b.classList.add("wrong");
      });
      const fb = document.getElementById("fb");
      if (ok) {
        const before = speedMs(g.right);
        g.hit();
        const faster = kind === "speed" && speedMs(g.right) < before;
        fb.innerHTML = `<p class="fb-line ok">${I.check}<span>${praise(isZh)}</span></p>`
          + (faster ? `<p class="fb-line fast">${I.bolt}<span>Faster! Now ${speedMs(g.right) / 1000} seconds per word.</span></p>` : "");
        later(g.next, faster ? 1800 : kind === "choose" ? 1000 : 650);
      } else {
        g.miss(c.item);
        const head = k < 0 ? (isZh ? `Time's up! ${zhs("时间到！")}` : "Time's up!") : (isZh ? `Not quite ${zhs("不对")}` : "Not quite");
        fb.innerHTML = `<div class="fb-card no"><b class="fb-head">${head}</b>${wordCard(c.w, isZh)}
          <button class="btn primary" data-act="next">Next${isZh ? " " + zhs("下一个") : ""} ${kbd("Enter")}</button></div>`;
        focusIn("fb");
      }
    }
    g.act.pick = t => answer(+t.dataset.k);
    g.act.next = () => g.next();
    g.key = e => {
      if (/^[1-4]$/.test(e.key) && g.cur && !g.cur.done) { e.preventDefault(); answer(+e.key - 1); }
      else if (e.key === "Enter" && g.cur && g.cur.done) { e.preventDefault(); g.next(); }
    };
    g.show();
  }

  /* ================================================================ Type it (Chinese version) */
  function startType(ids) {
    const g = newGame("zh", `Type it ${zhs("拼写")}`, {
      missedTitle: `Words to practise ${zhs("需要再练的单词")}`,
      card: id => wordCard(byId[id], true),
      practise: m => startType(m)
    });
    g.deck = makeDeck(ids);

    g.deal = () => {
      const { item, retry } = g.deck.next();
      g.cur = { item, retry, w: byId[item], done: false, moved: false };
    };
    g.render = () => {
      const c = g.cur, w = c.w;
      Object.assign(c, { tries: 0, hints: 0, done: false });
      app.innerHTML = frame(g, `
        <p class="ask">Type the word for this meaning. ${zhs("根据英文释义拼写单词。")}</p>
        <div class="qcard"><p class="q-def">${esc(w.d)}</p><div class="hints" id="hints"></div></div>
        <form class="typeform" id="tf" autocomplete="off">
          <input id="ti" class="typein" type="text" autocapitalize="none" autocorrect="off" spellcheck="false" autocomplete="off" enterkeyhint="go"
            aria-label="Type the word" placeholder="Type here · 在这里输入">
          <button class="btn primary" type="submit" id="tsub">Check ${zhs("检查")}</button>
        </form>
        <div class="type-tools">
          <button class="btn small" data-act="hint" id="hintbtn">Hint ${zhs("提示")}</button>
          <button class="btn small ghost" data-act="reveal" id="revbtn">Show answer ${zhs("看答案")}</button>
        </div>
        <div class="fb" id="fb" aria-live="polite"></div>`);
      document.getElementById("tf").addEventListener("submit", e => { e.preventDefault(); check(); });
      const inp = document.getElementById("ti");
      inp.addEventListener("input", () => inp.classList.remove("no"));
      inp.focus({ preventScroll: true });
    };

    function pattern(w) {
      const f = forms(w)[0];
      return f.split("").map((ch, i) => i === 0 ? ch : /[a-z]/i.test(ch) ? "_" : ch === " " ? " " : ch).join(" ");
    }
    function check() {
      const c = g.cur;
      if (c.done) return g.next();
      const inp = document.getElementById("ti");
      const n = norm(inp.value);
      if (!n) return;
      const w = c.w;
      if (accepts(w).has(n)) return correct();
      c.tries++;
      const other = formIndex[n];
      const near = [...accepts(w)].some(a => lev(n, a) <= (a.length >= 8 ? 2 : 1));
      let msg;
      if (other && other.id !== w.id) msg = `<b>${esc(other.w)}</b> is a different word: ${esc(other.d)} ${zhs("这是另一个单词。")}`;
      else if (near) msg = `Nearly! Check your spelling. ${zhs("差一点！检查一下拼写。")}`;
      else msg = `Not quite. Try again or use a hint. ${zhs("不对，再试一次或看提示。")}`;
      if (c.tries >= 3) return reveal();
      inp.classList.add("no");
      document.getElementById("fb").innerHTML = `<p class="fb-line no">${msg}</p>`;
      inp.select();
    }
    function correct() {
      const c = g.cur; c.done = true;
      g.hit();
      rec(c.w.id, true);
      const inp = document.getElementById("ti");
      inp.readOnly = true; inp.classList.add("ok");
      lockTools();
      document.getElementById("fb").innerHTML = `<div class="fb-card ok"><b class="fb-head">${I.check} ${praise(true)}</b>${wordCard(c.w, true)}</div>`;
      later(g.next, 1300);
    }
    function reveal() {
      const c = g.cur; if (c.done) return;
      c.done = true;
      rec(c.w.id, false);
      g.miss(c.item);
      const inp = document.getElementById("ti");
      inp.readOnly = true;
      lockTools();
      document.getElementById("fb").innerHTML = `<div class="fb-card no"><b class="fb-head">The answer is ${zhs("答案是")}</b>${wordCard(c.w, true)}
        <button class="btn primary" data-act="next">Next ${zhs("下一个")} ${kbd("Enter")}</button></div>`;
      inp.focus({ preventScroll: true });
    }
    function lockTools() {
      // The submit button stays on (Enter in the box needs it) and becomes Next.
      ["hintbtn", "revbtn"].forEach(id => { const b = document.getElementById(id); if (b) b.disabled = true; });
      const sub = document.getElementById("tsub");
      if (sub) sub.innerHTML = `Next ${zhs("下一个")}`;
    }
    g.act.hint = () => {
      const c = g.cur; if (c.done || c.hints >= 2) return;
      c.hints++;
      const h = document.getElementById("hints");
      if (c.hints === 1) h.innerHTML = `<p class="hint">${zhs("中文")}: <span lang="zh">${esc(c.w.zh)}</span></p>`;
      else {
        h.innerHTML += `<p class="hint pattern">${esc(pattern(c.w))}</p>`;
        document.getElementById("hintbtn").disabled = true;
      }
      document.getElementById("ti").focus({ preventScroll: true });
    };
    g.act.reveal = reveal;
    g.act.next = () => g.next();
    g.key = e => { if (e.key === "Enter" && g.cur && g.cur.done) { e.preventDefault(); g.next(); } };
    g.show();
  }

  /* ================================================================ Build the sentence */
  const ROLES = [["topic", "Topic"], ["verb", "Verb"], ["link", "Link"], ["detail", "Detail"], ["hedge", "Careful word"], ["judge", "Effect / judgement"]];
  const CX = { 1: "Simple sentence", 2: "Two ideas joined", 3: "Complex sentence" };
  const tileHtml = (t, r, attrs) => `<button class="tile r-${r}" ${attrs || ""}>${esc(t)}</button>`;
  const builtHtml = it => it.tiles.map(t => `<span class="inline r-${t[1]}">${esc(t[0])}</span>`).join(" ");

  function startBuild(lv, only) {
    const items = only || byLevel(BUILD, lv);
    const g = newGame("en", "Build the sentence", {
      missedTitle: "Sentences to look at again",
      card: it => `<div class="wc"><span class="built">${builtHtml(it)}</span><span>${esc(it.why)}</span></div>`,
      practise: m => startBuild(lv, m)
    });
    g.deck = makeDeck(items);

    g.deal = () => {
      const { item, retry } = g.deck.next();
      g.cur = { it: item, retry, done: false, moved: false };
    };
    g.render = () => {
      const c = g.cur, it = c.it;
      c.pool = shuffle(it.tiles.map(t => ({ t: t[0], r: t[1] })).concat((it.decoys || []).map(t => ({ t: t[0], r: t[1], decoy: true }))));
      Object.assign(c, { ans: [], tries: 0, done: false });
      const usedRoles = new Set(c.pool.map(p => p.r));
      app.innerHTML = frame(g, `
        <p class="goal"><span>Goal</span>${esc(it.goal)}</p>
        <div class="build-meta"><span class="cx cx${it.cx}">${CX[it.cx]}</span>
          <span class="rolekey" aria-label="Colour key">${ROLES.filter(r => usedRoles.has(r[0])).map(r => `<span class="r-${r[0]}">${r[1]}</span>`).join("")}</span></div>
        <div class="answer" id="ans" aria-label="Your sentence"></div>
        <div class="pool" id="pool" aria-label="Tiles"></div>
        <p class="small muted">Tap tiles to build the sentence. Tap a tile in your sentence to remove it. Not every tile belongs.</p>
        <div class="actions">
          <button class="btn ghost" data-act="clear" id="clearbtn">Clear</button>
          <button class="btn" data-act="show" id="showbtn">Show answer</button>
          <button class="btn primary" data-act="check" id="checkbtn">Check ${kbd("Enter")}</button>
        </div>
        <div class="fb" id="fb" aria-live="polite"></div>`);
      draw();
    };
    function draw() {
      const c = g.cur;
      const ans = document.getElementById("ans");
      ans.innerHTML = c.ans.length ? c.ans.map((k, i) => tileHtml(c.pool[k].t, c.pool[k].r, `data-act="untile" data-i="${i}"${c.done ? " disabled" : ""}`)).join("")
        : `<span class="ans-ph">Your sentence goes here</span>`;
      document.getElementById("pool").innerHTML = c.pool.map((p, k) => c.ans.includes(k)
        ? `<span class="tile ghost r-${p.r}" aria-hidden="true">${esc(p.t)}</span>`
        : tileHtml(p.t, p.r, `data-act="tile" data-k="${k}"${c.done ? " disabled" : ""}`)).join("");
      const cb = document.getElementById("checkbtn");
      if (cb) cb.disabled = c.done || !c.ans.length;
      ans.classList.remove("no");
    }
    function check() {
      const c = g.cur;
      if (c.done) return g.next();
      if (!c.ans.length) return;
      const txt = c.ans.map(k => c.pool[k].t).join(" ");
      const want = [c.it.tiles.map(t => t[0]).join(" ")].concat((c.it.alt || []).map(a => a.join(" ")));
      const fb = document.getElementById("fb");
      if (want.includes(txt)) {
        c.done = true;
        g.hit();
        draw();
        document.getElementById("ans").classList.add("ok");
        fb.innerHTML = `<div class="fb-card ok"><b class="fb-head">${I.check} ${c.tries ? "Got it!" : praise(false)}</b><p class="tip">${esc(c.it.why)}</p>
          <button class="btn primary" data-act="next">Next ${kbd("Enter")}</button></div>`;
        lock(); focusIn("fb");
        return;
      }
      c.tries++;
      const usedDecoy = c.ans.some(k => c.pool[k].decoy);
      const need = c.it.tiles.length;
      let hint;
      if (usedDecoy) hint = "One of your tiles is a trap: it has a grammar mistake. Swap it for the right one.";
      else if (c.ans.length < need) hint = `You haven't used all the tiles you need yet (${need} tiles).`;
      else hint = "You have the right tiles, but the order isn't right yet.";
      const ans = document.getElementById("ans");
      ans.classList.remove("no"); void ans.offsetWidth; ans.classList.add("no");
      fb.innerHTML = `<p class="fb-line no">Not quite. ${hint}</p>`;
    }
    function reveal() {
      const c = g.cur; if (c.done) return;
      c.done = true;
      g.miss(c.it);
      draw();
      document.getElementById("fb").innerHTML = `<div class="fb-card no"><b class="fb-head">The sentence is:</b>
        <p class="built">${builtHtml(c.it)}</p>
        <p class="tip">${esc(c.it.why)}</p>
        <button class="btn primary" data-act="next">Next ${kbd("Enter")}</button></div>`;
      lock(); focusIn("fb");
    }
    function lock() { ["clearbtn", "showbtn", "checkbtn"].forEach(id => { const b = document.getElementById(id); if (b) b.disabled = true; }); }
    g.act.tile = t => { const c = g.cur; if (c.done) return; c.ans.push(+t.dataset.k); draw(); document.getElementById("fb").innerHTML = ""; };
    g.act.untile = t => { const c = g.cur; if (c.done) return; c.ans.splice(+t.dataset.i, 1); draw(); document.getElementById("fb").innerHTML = ""; };
    g.act.clear = () => { g.cur.ans = []; draw(); document.getElementById("fb").innerHTML = ""; };
    g.act.check = check;
    g.act.show = reveal;
    g.act.next = () => g.next();
    g.key = e => {
      if (e.key === "Enter") { e.preventDefault(); g.cur.done ? g.next() : check(); }
      else if (e.key === "Backspace" && !g.cur.done && g.cur.ans.length) { e.preventDefault(); g.cur.ans.pop(); draw(); }
    };
    g.show();
  }

  /* ================================================================ Missing words */
  function startGap(lv, only) {
    const items = only || byLevel(GAPS, lv);
    const label = s => s === "" ? "(no word)" : s;
    const g = newGame("en", "Missing words", {
      missedTitle: "Sentences to look at again",
      card: it => `<div class="wc"><span>${esc(it.s).replace("___", `<mark>${esc(it.ans)}</mark>`)}</span><span>${esc(it.pt)}: ${esc(it.why)}</span></div>`,
      practise: m => startGap(lv, m)
    });
    g.deck = makeDeck(items);

    g.deal = () => {
      const { item, retry } = g.deck.next();
      g.cur = { it: item, retry, done: false, moved: false };
    };
    g.render = () => {
      const c = g.cur, it = c.it;
      c.opts = shuffle([it.ans].concat(it.wrong));
      c.done = false;
      const [a, b] = it.s.split("___");
      app.innerHTML = frame(g, `
        <p class="ask">Choose the word that fits. Watch the grammar!</p>
        <div class="qcard"><p class="gap-s">${esc(a)}<span class="blank" id="blank">&nbsp;</span>${esc(b)}</p></div>
        <div class="opts">${c.opts.map((o, k) => `
          <button class="opt" data-act="pick" data-k="${k}"><span class="key">${k + 1}</span><span class="opt-t${o === "" ? " muted" : ""}">${esc(label(o))}</span></button>`).join("")}
        </div>
        <div class="fb" id="fb" aria-live="polite"></div>`);
    };
    function answer(k) {
      const c = g.cur; if (c.done) return;
      c.done = true;
      const pick = c.opts[k], ok = pick === c.it.ans;
      if (ok) g.hit(); else g.miss(c.it);
      app.querySelectorAll(".opt").forEach((btn, i) => {
        btn.disabled = true;
        if (c.opts[i] === c.it.ans) btn.classList.add("right"); else if (i === k) btn.classList.add("wrong");
      });
      const blank = document.getElementById("blank");
      blank.className = "blank filled " + (ok ? "ok" : "no");
      blank.innerHTML = ok ? esc(label(c.it.ans)) : `<s>${esc(label(pick))}</s> ${esc(c.it.ans)}`;
      document.getElementById("fb").innerHTML = `<div class="fb-card ${ok ? "ok" : "no"}"><b class="fb-head">${ok ? I.check + " " + praise(false) : `The answer is “${esc(c.it.ans)}”`}</b>
        <p class="pt">Grammar point: <b>${esc(c.it.pt)}</b></p>
        <p class="tip">${esc(c.it.why)}</p><button class="btn primary" data-act="next">Next ${kbd("Enter")}</button></div>`;
      focusIn("fb");
    }
    g.act.pick = t => answer(+t.dataset.k);
    g.act.next = () => g.next();
    g.key = e => {
      if (/^[1-4]$/.test(e.key) && !g.cur.done && +e.key <= g.cur.opts.length) { e.preventDefault(); answer(+e.key - 1); }
      else if (e.key === "Enter" && g.cur.done) { e.preventDefault(); g.next(); }
    };
    g.show();
  }

  /* ================================================================ Spot the error */
  function parseErr(text) {
    const segs = [];
    const re = /\[([^\]|]+)\|([^\]|]+)\|([^\]]+)\]/g;
    let last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) segs.push({ s: text.slice(last, m.index) });
      segs.push({ wrong: m[1], right: m[2], why: m[3] });
      last = re.lastIndex;
    }
    if (last < text.length) segs.push({ s: text.slice(last) });
    return segs;
  }

  // The list of paragraphs. "Start" plays them all in a random cycle; tapping one starts the cycle there.
  function errorsList() {
    stop(); setTheme("en");
    const lv = S.lvl;
    const items = byLevel(ERRORS, lv);
    const done = items.filter(x => S.err[x.id]).length;
    app.innerHTML = `
    <main class="page vpage">
      <button class="backlink" data-act="quit">← English version</button>
      <header class="intro">
        <p class="eyebrow">Spot the error</p>
        <h1>Find the mistakes</h1>
        <p class="sub">Each paragraph has grammar mistakes. Tap the wrong words, then check your answers. The paragraphs keep coming in a random order until you stop.</p>
      </header>
      <div class="block-head">${levelSeg(lv, "errlvl")}<p class="small muted">${done} of ${items.length} done</p></div>
      <button class="btn primary big wide" data-act="errstart">${I.spot}<span>Start</span></button>
      <ol class="err-list">${items.map(x => {
        const r = S.err[x.id];
        const st = r ? `<span class="st ${r.f === r.n && !r.x ? "full" : ""}">${r.f}/${r.n}</span>` : `<span class="st new">New</span>`;
        return `<li><button class="err-item" data-act="erropen" data-id="${x.id}"><span class="err-lv lv${x.lv}">${LEVELS[x.lv].name}</span><span class="err-t">${esc(x.title)}</span>${st}</button></li>`;
      }).join("")}</ol>
    </main>`;
    game = {
      act: {
        errlvl: t => { S.lvl = t.dataset.lv; save(); errorsList(); },
        erropen: t => startErrors(items, ERRORS.find(x => x.id === t.dataset.id)),
        errstart: () => {
          // Start with a paragraph the student hasn't done yet, if there is one.
          const fresh = shuffle(items.filter(x => !S.err[x.id]));
          startErrors(items, fresh[0]);
        }
      }
    };
    window.scrollTo(0, 0);
  }

  function startErrors(items, first) {
    const g = newGame("en", "Spot the error", {
      unit: "mistakes found",
      onQuit: errorsList,
      missedTitle: "Paragraphs to try again",
      card: it => `<div class="wc"><b>${esc(it.title)}</b><span>${LEVELS[it.lv].name}</span></div>`,
      practise: m => startErrors(m)
    });
    g.deck = makeDeck(items, first);
    g.deck.miss = () => {}; // a paragraph doesn't come straight back; it returns next time round

    g.deal = () => {
      const { item, retry } = g.deck.next();
      g.cur = { item, retry, done: false, moved: false };
    };
    g.render = () => {
      const c = g.cur, item = c.item;
      const segs = parseErr(item.text);
      const errs = segs.filter(x => x.wrong);
      const toks = [];
      let html = "";
      segs.forEach(seg => {
        if (seg.wrong) {
          html += `<button class="tok" data-act="tok" data-k="${toks.length}">${esc(seg.wrong)}</button>`;
          toks.push({ err: errs.indexOf(seg) });
          return;
        }
        seg.s.split(/(\s+)/).forEach(p => {
          if (!p) return;
          if (/^\s+$/.test(p)) { html += " "; return; }
          const m = p.match(/^([^A-Za-z0-9]*)(.*?)([^A-Za-z0-9]*)$/);
          if (!m[2]) { html += esc(p); return; }
          html += esc(m[1]) + `<button class="tok" data-act="tok" data-k="${toks.length}">${esc(m[2])}</button>` + esc(m[3]);
          toks.push({});
        });
      });
      // keep a word and the punctuation touching it on one line
      html = html.replace(/([^\s<>]*)(<button class="tok"[^>]*>[^<]*<\/button>)([^\s<>]*)/g,
        (all, a, btn, z) => (a || z) ? `<span class="nw">${a}${btn}${z}</span>` : btn);
      Object.assign(c, { errs, toks, marked: new Set(), done: false });
      app.innerHTML = frame(g, `
        <h2 class="err-title">${esc(item.title)} <span class="err-lv lv${item.lv}">${LEVELS[item.lv].name}</span></h2>
        <p class="ask">Find <b>${errs.length} mistakes</b>. Tap a wrong word to mark it; tap again to unmark it.</p>
        <div class="errtext" id="errtext">${html}</div>
        <div class="actions">
          <span class="marked" id="marked">0 marked</span>
          <button class="btn primary" data-act="errcheck" id="errcheck" disabled>Check ${kbd("Enter")}</button>
        </div>
        <div class="fb" id="fb" aria-live="polite"></div>`);
    };

    g.act.tok = t => {
      const c = g.cur; if (c.done) return;
      const k = +t.dataset.k;
      c.marked.has(k) ? c.marked.delete(k) : c.marked.add(k);
      t.classList.toggle("t-marked", c.marked.has(k));
      document.getElementById("marked").textContent = `${c.marked.size} marked`;
      document.getElementById("errcheck").disabled = !c.marked.size;
    };
    g.act.errcheck = () => {
      const c = g.cur;
      if (c.done || !c.marked.size) return;
      c.done = true;
      app.querySelectorAll(".nw").forEach(n => n.classList.remove("nw"));
      let found = 0, falseMarks = 0;
      const foundSet = new Set();
      app.querySelectorAll(".tok").forEach(b => {
        const k = +b.dataset.k, tk = c.toks[k], m = c.marked.has(k);
        b.disabled = true;
        b.classList.remove("t-marked");
        if (tk.err !== undefined) {
          const e = c.errs[tk.err];
          if (m) { found++; foundSet.add(tk.err); }
          b.classList.add(m ? "t-found" : "t-missed");
          b.innerHTML = `<s>${esc(e.wrong)}</s> <ins>${esc(e.right)}</ins>`;
        } else if (m) { falseMarks++; b.classList.add("t-false"); }
      });
      const n = c.errs.length;
      g.right += found; g.wrong += n - found;
      if (found < n && !g.missed.includes(c.item)) g.missed.push(c.item);
      updTally(g);
      const prev = S.err[c.item.id];
      S.err[c.item.id] = { f: found, n, x: falseMarks, best: Math.max(found - falseMarks, prev ? prev.best || 0 : 0) };
      save();
      document.getElementById("errcheck").disabled = true;
      document.getElementById("fb").innerHTML = `
        <div class="fb-card ${found === n && !falseMarks ? "ok" : "no"}">
          <b class="fb-head">You found ${found} of ${n} mistakes.</b>
          ${falseMarks ? `<p class="small">You also marked ${falseMarks} word${falseMarks > 1 ? "s" : ""} that ${falseMarks > 1 ? "were" : "was"} already correct (shown in red).</p>` : ""}
          <ol class="err-why">${c.errs.map((e, i) => `<li class="${foundSet.has(i) ? "f" : "m"}"><span class="ew"><s>${esc(e.wrong)}</s> → <ins>${esc(e.right)}</ins></span><span>${esc(e.why)}</span></li>`).join("")}</ol>
          <div class="res-actions">
            <button class="btn primary" data-act="next">Next paragraph ${kbd("Enter")}</button>
          </div>
        </div>`;
      focusIn("fb");
    };
    g.act.next = () => g.next();
    g.key = e => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      if (!g.cur.done) g.act.errcheck(); else g.next();
    };
    g.show();
  }

  /* ================================================================ go */
  route();
})();
