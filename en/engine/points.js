/* Points. English, Chinese and maths points are kept apart ("en", "zh" and, since the maths tester of 27 Oct, "maths").
   Saved in this browser only: localStorage "aea:points:v1" = {en:{days:{"2026-10-21":{p,r,w}}, wrong}, zh:{…}}
     p = points that day, r = right answers, w = wrong answers; wrong = wrong answers since the last point was taken off.
   The session total is in sessionStorage, so it starts again in a new tab or browser window (shown on My progress only).
   The bar at the top of the pages shows Day, Week (with the weekly target) and Total.
   Rules: only right answers earn points; every 5 wrong answers take 1 point off (never below 0 for the day or session).
   How many points each game and level earns is set in en/engine/app.js (POINTS).
   The game engine calls AEA_POINTS.record(side, points, ok). Other pages just show the bar:
     <script src="…/en/engine/points.js" data-side="en"></script>  (it goes next to the page's back link, or top right)
   data-side="auto" (the homepage): the side the student played most recently, English if none. */
(function(){
  'use strict';
  var KEY = 'aea:points:v1', SKEY = 'aea:points:session', DOCK_EVERY = 5;
  var WEEKLY_TARGET = 200;   // points to aim for each week (Monday to Sunday), for each side. Change it here.
  var pad = function(n){ return (n < 10 ? '0' : '') + n; };
  var dayKey = function(d){ return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  function load(){
    var d; try { d = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { d = {}; }
    ['en', 'zh', 'maths'].forEach(function(s){ d[s] = d[s] || {}; d[s].days = d[s].days || {}; d[s].wrong = d[s].wrong || 0; });
    return d;
  }
  function save(d){ try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  function session(){ try { return JSON.parse(sessionStorage.getItem(SKEY)) || {}; } catch (e) { return {}; } }
  function saveSession(s){ try { sessionStorage.setItem(SKEY, JSON.stringify(s)); } catch (e) {} }

  // One answer. Returns the change in points: +n for a right answer, -1 when a fifth wrong answer takes a point off, otherwise 0.
  function record(side, pts, ok){
    var d = load(), S = d[side], k = dayKey(new Date()), day = S.days[k] || (S.days[k] = {p: 0, r: 0, w: 0}), ses = session(), change = 0;
    ses[side] = ses[side] || 0;
    if (ok) { day.r++; pts = Math.max(0, Math.round(pts || 0)); day.p += pts; ses[side] += pts; change = pts; }
    else {
      day.w++; S.wrong++;
      if (S.wrong >= DOCK_EVERY) { S.wrong = 0; if (day.p > 0) { day.p--; change = -1; } if (ses[side] > 0) ses[side]--; }
    }
    save(d); saveSession(ses); render(side, change);
    return change;
  }
  // Session, today, this week (from Monday), this month, total
  function totals(side){
    var d = load()[side], now = new Date(), today = dayKey(now), mon = new Date(now);
    mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    var wk = dayKey(mon), month = today.slice(0, 7), out = {s: session()[side] || 0, d: 0, w: 0, m: 0, t: 0, wrong: d.wrong};
    Object.keys(d.days).forEach(function(k){ var p = d.days[k].p || 0; out.t += p;
      if (k === today) out.d += p; if (k >= wk && k <= today) out.w += p; if (k.slice(0, 7) === month) out.m += p; });
    return out;
  }
  // Points per day for the last n days, oldest first: [{date, en, zh}]
  function lastDays(n){
    var d = load(), out = [];
    for (var i = n - 1; i >= 0; i--) { var x = new Date(); x.setDate(x.getDate() - i); var k = dayKey(x);
      out.push({date: x, en: (d.en.days[k] || {}).p || 0, zh: (d.zh.days[k] || {}).p || 0}); }
    return out;
  }
  var fmt = function(n){ return Number(n).toLocaleString('en-GB'); };
  function barHtml(side){
    var t = totals(side), zh = side === 'zh' || side === 'maths';
    // Chinese side (and maths): each label in both languages, one shown (the English / 中文 switch, 26 Oct)
    var L = function(en, z){ return zh ? '<span class="t-en">' + en + '</span><span class="t-zh" lang="zh">' + z + '</span>' : en; };
    var v = function(label, n, title){ return '<span class="pts-v" title="' + title + '"><i>' + label + '</i><b>' + fmt(n) + '</b></span>'; };
    return v(L('Day', '今天'), t.d, zh ? 'Points today 今天的积分' : 'Points today') +
      '<span class="pts-v' + (t.w >= WEEKLY_TARGET ? ' pts-hit' : '') + '" title="' + (zh ? 'Points this week 本周积分' : 'Points this week') + ' (target ' + WEEKLY_TARGET + ')"><i>' + L('Week', '本周') + '</i><b>' + fmt(t.w) + '</b><small>/' + WEEKLY_TARGET + '</small></span>' +
      v(L('Total', '总计'), t.t, zh ? 'All points 总积分' : 'All points');
  }
  // Fill every points bar on the page; show +n or -1 for a moment
  function render(side, change){
    var bars = document.querySelectorAll('[data-points-bar]');
    Array.prototype.forEach.call(bars, function(el){
      var s = el.getAttribute('data-points-bar') || side; if (s !== side && change) return;
      el.innerHTML = barHtml(s);
      el.setAttribute('aria-label', (s === 'zh' ? 'Chinese version points' : s === 'maths' ? 'Maths points' : 'English points') + ': ' + el.textContent.replace(/\s+/g, ' '));
      if (change && s === side) { var pop = document.createElement('span'); pop.className = 'pts-pop ' + (change > 0 ? 'up' : 'down');
        pop.textContent = (change > 0 ? '+' : '−') + Math.abs(change); el.appendChild(pop); setTimeout(function(){ pop.remove(); }, 1300); }
    });
  }
  function style(){
    if (document.getElementById('pts-style')) return;
    var st = document.createElement('style'); st.id = 'pts-style';
    st.textContent =
      '.pts{display:inline-flex;align-items:center;gap:12px;font-size:13px;line-height:1;position:relative;white-space:nowrap;padding:6px 0}' +
      '.pts-k{font-weight:700;opacity:.7}' +
      '.pts-v{display:inline-flex;align-items:baseline;gap:4px}' +
      '.pts-v i{font-style:normal;font-size:11px;font-weight:700;opacity:.55;letter-spacing:.04em}' +
      '.pts-v b{font-size:16px;font-variant-numeric:tabular-nums}' +
      '.pts-v small{font-size:11px;opacity:.6;margin-left:-2px}.pts-hit b{color:#23a05c}' +
      '.pts-pop{position:absolute;right:0;top:-12px;font-weight:700;font-size:14px;pointer-events:none;animation:ptsPop 1.3s ease-out forwards}' +
      '.pts-pop.up{color:#23a05c}.pts-pop.down{color:#e0533f}' +
      '@keyframes ptsPop{0%{opacity:0;transform:translateY(8px)}20%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-12px)}}' +
      '@media (prefers-reduced-motion:reduce){.pts-pop{animation:none}}' +
      '@media (max-width:420px){.pts{gap:9px}.pts-k{display:none}}' +
      '.pts-line{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:4px 16px}.pts-line-end{justify-content:flex-end}' +
      '.navline{display:inline-flex;align-items:center;gap:12px;min-width:0}.home-mark{display:inline-flex;width:30px;flex:none;color:var(--ink);border-radius:6px}.home-mark svg{width:100%;height:auto;display:block}.home-mark:hover{opacity:.75}';
    document.head.appendChild(st);
  }
  style();
  window.AEA_POINTS = {record: record, totals: totals, lastDays: lastDays, render: render, barHtml: barHtml, DOCK_EVERY: DOCK_EVERY, WEEKLY_TARGET: WEEKLY_TARGET};

  // The side the student played most recently (from the topics in their saved progress), English if none
  function lastSide(){
    var t = {}, best = 0, side = 'en';
    try { t = (JSON.parse(localStorage.getItem('aea:progress:v1')) || {}).topics || {}; } catch (e) {}
    Object.keys(t).forEach(function(k){ var x = t[k] || {}; if ((x.last || 0) > best && (x.side === 'en' || x.side === 'zh')) { best = x.last; side = x.side; } });
    return side;
  }
  // Pages without the game engine: <script … data-side="en|zh|auto"> puts the bar next to the back link (top right if there is none)
  var me = document.currentScript, side = me && me.getAttribute('data-side');
  if (side) {
    var mount = function(){
      if (side === 'auto') side = lastSide();
      var back = document.querySelector('.backlink'), bar = document.createElement('div');
      bar.className = 'pts'; bar.setAttribute('data-points-bar', side);
      var left = back && (back.closest('.navline') || back);   // the back link, with the home mouse if there is one
      var line = document.createElement('div'); line.className = 'pts-line';
      if (left) { left.parentNode.insertBefore(line, left); line.appendChild(left); }
      else { var main = document.querySelector('main') || document.body; line.className += ' pts-line-end'; main.insertBefore(line, main.firstChild); }
      line.appendChild(bar);
      render(side, 0);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  }
})();
