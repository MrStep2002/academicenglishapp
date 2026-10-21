/* Points. English and Chinese points are kept apart ("en" and "zh").
   Saved in this browser only: localStorage "aea:points:v1" = {en:{days:{"2026-10-21":{p,r,w}}, wrong}, zh:{…}}
     p = points that day, r = right answers, w = wrong answers; wrong = wrong answers since the last point was taken off.
   The session total (S) is in sessionStorage, so it starts again in a new tab or browser window.
   Rules: only right answers earn points; every 5 wrong answers take 1 point off (never below 0 for the day or session).
   How many points each game and level earns is set in en/engine/app.js (POINTS).
   The game engine calls AEA_POINTS.record(side, points, ok). Other pages just show the bar:
     <script src="…/en/engine/points.js" data-side="en"></script>  (it goes next to the page's back link) */
(function(){
  'use strict';
  var KEY = 'aea:points:v1', SKEY = 'aea:points:session', DOCK_EVERY = 5;
  var pad = function(n){ return (n < 10 ? '0' : '') + n; };
  var dayKey = function(d){ return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  function load(){
    var d; try { d = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { d = {}; }
    ['en', 'zh'].forEach(function(s){ d[s] = d[s] || {}; d[s].days = d[s].days || {}; d[s].wrong = d[s].wrong || 0; });
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
    var t = totals(side);
    var v = function(letter, n, title){ return '<span class="pts-v" title="' + title + '"><i>' + letter + '</i><b>' + fmt(n) + '</b></span>'; };
    return '<span class="pts-k">' + (side === 'zh' ? 'Points 积分' : 'Points') + '</span>' +
      v('S', t.s, 'This session') + v('D', t.d, 'Today') + v('W', t.w, 'This week') + v('T', t.t, 'Total');
  }
  // Fill every points bar on the page; show +n or -1 for a moment
  function render(side, change){
    var bars = document.querySelectorAll('[data-points-bar]');
    Array.prototype.forEach.call(bars, function(el){
      var s = el.getAttribute('data-points-bar') || side; if (s !== side && change) return;
      el.innerHTML = barHtml(s);
      el.setAttribute('aria-label', (s === 'zh' ? 'Chinese version points' : 'English points') + ': ' + el.textContent.replace(/\s+/g, ' '));
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
      '.pts-pop{position:absolute;right:0;top:-12px;font-weight:700;font-size:14px;pointer-events:none;animation:ptsPop 1.3s ease-out forwards}' +
      '.pts-pop.up{color:#23a05c}.pts-pop.down{color:#e0533f}' +
      '@keyframes ptsPop{0%{opacity:0;transform:translateY(8px)}20%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-12px)}}' +
      '@media (prefers-reduced-motion:reduce){.pts-pop{animation:none}}' +
      '@media (max-width:420px){.pts{gap:9px}.pts-k{display:none}}' +
      '.pts-line{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:4px 16px}';
    document.head.appendChild(st);
  }
  style();
  window.AEA_POINTS = {record: record, totals: totals, lastDays: lastDays, render: render, barHtml: barHtml, DOCK_EVERY: DOCK_EVERY};

  // Pages without the game engine: <script … data-side="en|zh"> puts the bar next to the back link
  var me = document.currentScript, side = me && me.getAttribute('data-side');
  if (side) {
    var mount = function(){
      var back = document.querySelector('.backlink'), bar = document.createElement('div');
      bar.className = 'pts'; bar.setAttribute('data-points-bar', side);
      if (back) { var line = document.createElement('div'); line.className = 'pts-line'; back.parentNode.insertBefore(line, back); line.appendChild(back); line.appendChild(bar); }
      else { var main = document.querySelector('main') || document.body; main.insertBefore(bar, main.firstChild); }
      render(side, 0);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  }
})();
