// Academic English App: the login server (api.academicenglishapp.com).
// Students log in with the fun name and password their teacher gave them; their saved progress (the same data the
// games keep in the browser) is copied to the server, so it follows them to any device. Teachers make classes and
// accounts and see each student's points, level and last activity.
// No packages to install: plain Node.js 22.13+ (http, crypto and the built-in SQLite). Caddy sits in front and adds HTTPS.
// Run: node server/server.js   (settings come from the environment: PORT, DB_PATH, ALLOWED_ORIGINS, SCHOOL_TZ, BACKUP_DIR)
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {open, loginKey, hashPassword, checkPassword, tokenHash, newToken, DB_PATH} = require('./db');
const {mergeKey} = require('./merge');
const {funName, password} = require('./names');

const PORT = +process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';          // only Caddy (on the same server) talks to this program
const SCHOOL_TZ = process.env.SCHOOL_TZ || 'Asia/Shanghai';
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(path.dirname(DB_PATH), 'backups');
const ALLOWED = (process.env.ALLOWED_ORIGINS ||
  'https://academicenglishapp.com,https://www.academicenglishapp.com,https://mrstep2002.github.io').split(',').map(s => s.trim()).filter(Boolean);
const DEV_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;   // a copy of the site running on your own computer

const DAY = 864e5;
const STUDENT_DAYS = 180, TEACHER_DAYS = 30;            // how long a login lasts on a device
const MAX_BODY = 4 * 1024 * 1024, MAX_VALUE = 1024 * 1024, MAX_KEYS = 400;
const MAX_NEW = 60;                                      // most accounts made in one go

const db = open();
const now = () => Date.now();

// ---------- small helpers ----------
const LEVEL_NAMES = ['', 'Foundation', 'Foundation+', 'Intermediate', 'Intermediate+', 'Advanced'];
const parse = s => { try { return JSON.parse(s); } catch (e) { return null; } };
const dayFmt = new Intl.DateTimeFormat('en-CA', {timeZone: SCHOOL_TZ, year: 'numeric', month: '2-digit', day: '2-digit'});
const dayKey = t => dayFmt.format(new Date(t));          // "2026-10-24", in the school's time zone (as the games count days)
function weekStart(t) {                                  // the Monday of this week, as a day key
  const [y, m, d] = dayKey(t).split('-').map(Number), u = new Date(Date.UTC(y, m - 1, d));
  u.setUTCDate(u.getUTCDate() - ((u.getUTCDay() + 6) % 7));
  return u.toISOString().slice(0, 10);
}
const ipOf = req => String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

// Too many wrong passwords: 10 per name and 100 per network address in 15 minutes (a whole class shares one school address)
const tries = new Map();
function tooMany(key, limit) { const t = tries.get(key); return !!t && t.until > now() && t.n >= limit; }
function failed(key) {
  const t = tries.get(key);
  if (!t || t.until <= now()) tries.set(key, {n: 1, until: now() + 15 * 60e3}); else t.n++;
}
setInterval(() => { const n = now(); for (const [k, t] of tries) if (t.until <= n) tries.delete(k); }, 10 * 60e3).unref();

class Oops extends Error { constructor(status, msg) { super(msg); this.status = status; } }

// ---------- sessions ----------
function startSession(role, userId) {
  const token = newToken(), days = role === 'teacher' ? TEACHER_DAYS : STUDENT_DAYS;
  db.prepare('INSERT INTO sessions (token, role, user_id, created, expires) VALUES (?,?,?,?,?)')
    .run(tokenHash(token), role, userId, now(), now() + days * DAY);
  return token;
}
function who(req, role) {
  const m = /^Bearer\s+(\S+)$/.exec(req.headers.authorization || '');
  if (!m) throw new Oops(401, 'Please log in.');
  const s = db.prepare('SELECT * FROM sessions WHERE token = ?').get(tokenHash(m[1]));
  if (!s || s.expires < now()) { if (s) db.prepare('DELETE FROM sessions WHERE token = ?').run(s.token); throw new Oops(401, 'Please log in again.'); }
  if (role && s.role !== role) throw new Oops(403, 'This is not allowed with this login.');
  return {role: s.role, id: s.user_id, token: s.token};
}
setInterval(() => db.prepare('DELETE FROM sessions WHERE expires < ?').run(now()), 6 * 3600e3).unref();

// ---------- what the teacher sees about a student, worked out from their saved progress ----------
function summary(studentId, lastSeen) {
  const rows = {};
  for (const r of db.prepare("SELECT key, value FROM saved WHERE student_id = ? AND key IN ('aea:points:v1','aea:progress:v1')").all(studentId)) rows[r.key] = parse(r.value);
  const pts = rows['aea:points:v1'] || {}, pr = rows['aea:progress:v1'] || {};
  const today = dayKey(now()), monday = weekStart(now());
  const out = {lastSeen: lastSeen || null};
  for (const side of ['en', 'zh']) {
    const days = (pts[side] && pts[side].days) || {};
    let total = 0, week = 0, right = 0;
    for (const [k, d] of Object.entries(days)) { const p = +(d && d.p) || 0; total += p; right += +(d && d.r) || 0; if (k >= monday && k <= today) week += p; }
    let sum = 0, n = 0, answers = 0;
    for (const t of Object.values(pr.topics || {})) {
      if (!t || t.side !== side) continue;
      answers += t.n || 0;
      if ((t.n || 0) >= 10) { sum += (t.r || 0) * t.n; n += t.n; }
    }
    const r = n ? sum / n : null;
    out[side] = {total, week, right, answers, level: r == null ? null : LEVEL_NAMES[Math.max(1, Math.min(5, Math.floor(r)))]};
  }
  let known = 0, learning = 0, last = 0;
  for (const w of Object.values(pr.words || {})) { const s = (w && w.s) || 0; if (s >= 4) known++; else if (s >= 1) learning++; }
  for (const t of Object.values(pr.topics || {})) if (t && t.last > last) last = t.last;
  out.words = {known, learning};
  out.lastPlayed = last || null;
  return out;
}

// ---------- making accounts ----------
// names: the teacher's list of fun names, or none and count: make that many fun names. Returns [{id, name, password}]
async function makeStudents(classId, names, count) {
  let list = Array.isArray(names) ? names.map(s => String(s || '').replace(/\s+/g, ' ').trim()).filter(Boolean) : [];
  if (!list.length) { count = Math.max(0, Math.min(MAX_NEW, Math.floor(+count || 0))); list = null; }
  else if (list.length > MAX_NEW) throw new Oops(400, `At most ${MAX_NEW} students at a time.`);
  if (list && list.some(n => n.length > 40)) throw new Oops(400, 'Names can be at most 40 characters.');
  if (!list && !count) throw new Oops(400, 'Type some names, or choose how many fun names to make.');
  const taken = k => !!db.prepare('SELECT 1 FROM students WHERE login = ?').get(k);
  const made = [], used = new Set();
  const free = base => {                                   // the name itself, or "Name 2", "Name 3"… if it is taken
    for (let i = 1; i < 1000; i++) { const n = i === 1 ? base : base + ' ' + i, k = loginKey(n);
      if (k && !taken(k) && !used.has(k)) return n; }
    throw new Oops(400, 'Could not find a free name for ' + base);
  };
  const wanted = list || Array.from({length: count}, () => null);
  for (const w of wanted) {
    let name;
    if (w) { if (!loginKey(w)) throw new Oops(400, `"${w}" needs at least one letter or number.`); name = free(w); }
    else { for (let i = 0; i < 40 && !name; i++) { const n = funName(), k = loginKey(n); if (!taken(k) && !used.has(k)) name = n; } if (!name) name = free(funName()); }
    used.add(loginKey(name));
    const pw = password();
    made.push({name, password: pw, hash: await hashPassword(pw)});
  }
  const ins = db.prepare('INSERT INTO students (class_id, name, login, pass, created) VALUES (?,?,?,?,?)');
  db.exec('BEGIN');
  try { for (const m of made) m.id = Number(ins.run(classId, m.name, loginKey(m.name), m.hash, now()).lastInsertRowid); db.exec('COMMIT'); }
  catch (e) { db.exec('ROLLBACK'); throw e; }
  return made.map(({id, name, password}) => ({id, name, password}));
}
function ownClass(teacherId, classId) {
  const c = db.prepare('SELECT * FROM classes WHERE id = ? AND teacher_id = ?').get(+classId, teacherId);
  if (!c) throw new Oops(404, 'Class not found.');
  return c;
}

// ---------- saved progress ----------
const SYNC_KEY = /^aea:[A-Za-z0-9_.:\-]{1,150}$/;
const NOT_SYNCED = /^aea:(account|guest:|api|sync)/;      // kept in the browser only
function sync(studentId, data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Oops(400, 'Nothing to save.');
  const stored = {};
  for (const r of db.prepare('SELECT key, value FROM saved WHERE student_id = ?').all(studentId)) stored[r.key] = r.value;
  const up = db.prepare('INSERT INTO saved (student_id, key, value, updated) VALUES (?,?,?,?) ON CONFLICT(student_id, key) DO UPDATE SET value = excluded.value, updated = excluded.updated');
  let count = Object.keys(stored).length;
  db.exec('BEGIN');
  try {
    for (const [k, v] of Object.entries(data)) {
      if (!SYNC_KEY.test(k) || NOT_SYNCED.test(k) || typeof v !== 'string' || v.length > MAX_VALUE) continue;
      if (!(k in stored) && ++count > MAX_KEYS) continue;
      const merged = mergeKey(k, stored[k], v);
      if (merged !== stored[k]) { up.run(studentId, k, merged, now()); stored[k] = merged; }
    }
    db.prepare('UPDATE students SET last_seen = ? WHERE id = ?').run(now(), studentId);
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
  return stored;
}

// ---------- the routes ----------
const routes = [];
const route = (method, pattern, fn) => routes.push({method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>\\d+)') + '$'), fn});

route('GET', '/api/health', () => ({ok: true}));

route('POST', '/api/login', async (req, body) => {
  const name = String(body.name || '').trim(), key = loginKey(name), ip = ipOf(req);
  if (!key || !body.password) throw new Oops(400, 'Type your name and password. 请输入名字和密码。');
  if (tooMany('s:' + key, 10) || tooMany('ip:' + ip, 100)) throw new Oops(429, 'Too many tries. Wait 15 minutes, or ask your teacher. 尝试次数太多，请15分钟后再试，或问老师。');
  const s = db.prepare('SELECT students.*, classes.name AS class_name FROM students JOIN classes ON classes.id = students.class_id WHERE login = ?').get(key);
  if (!s || !(await checkPassword(body.password, s.pass))) {
    failed('s:' + key); failed('ip:' + ip);
    throw new Oops(401, 'That name and password don\'t match. Check them, or ask your teacher. 名字或密码不对。');
  }
  const hasData = !!db.prepare("SELECT 1 FROM saved WHERE student_id = ? AND key IN ('aea:progress:v1','aea:points:v1')").get(s.id);
  return {token: startSession('student', s.id), role: 'student', name: s.name, className: s.class_name, hasData};
});

route('POST', '/api/logout', req => { const u = who(req); db.prepare('DELETE FROM sessions WHERE token = ?').run(u.token); return {ok: true}; });

route('GET', '/api/me', req => {
  const u = who(req);
  if (u.role === 'teacher') { const t = db.prepare('SELECT name, login FROM teachers WHERE id = ?').get(u.id); return {role: 'teacher', name: t.name, username: t.login}; }
  const s = db.prepare('SELECT students.name, classes.name AS class_name FROM students JOIN classes ON classes.id = students.class_id WHERE students.id = ?').get(u.id);
  if (!s) throw new Oops(401, 'Please log in again.');
  return {role: 'student', name: s.name, className: s.class_name};
});

route('POST', '/api/sync', (req, body) => {
  const u = who(req, 'student');
  if (!db.prepare('SELECT 1 FROM students WHERE id = ?').get(u.id)) throw new Oops(401, 'Please log in again.');
  return {data: sync(u.id, body.data)};
});

// ----- teachers -----
route('POST', '/api/teacher/login', async (req, body) => {
  const key = loginKey(body.username), ip = ipOf(req);
  if (!key || !body.password) throw new Oops(400, 'Type your username and password.');
  if (tooMany('t:' + key, 10) || tooMany('ip:' + ip, 100)) throw new Oops(429, 'Too many tries. Wait 15 minutes and try again.');
  const t = db.prepare('SELECT * FROM teachers WHERE login = ?').get(key);
  if (!t || !(await checkPassword(body.password, t.pass))) { failed('t:' + key); failed('ip:' + ip); throw new Oops(401, 'That username and password don\'t match.'); }
  return {token: startSession('teacher', t.id), role: 'teacher', name: t.name};
});

route('POST', '/api/teacher/password', async (req, body) => {
  const u = who(req, 'teacher'), t = db.prepare('SELECT * FROM teachers WHERE id = ?').get(u.id);
  if (!(await checkPassword(body.old, t.pass))) throw new Oops(400, 'Your current password is not right.');
  if (String(body.new || '').length < 8) throw new Oops(400, 'The new password needs at least 8 characters.');
  db.prepare('UPDATE teachers SET pass = ? WHERE id = ?').run(await hashPassword(body.new), u.id);
  db.prepare("DELETE FROM sessions WHERE role = 'teacher' AND user_id = ? AND token != ?").run(u.id, u.token);
  return {ok: true};
});

route('GET', '/api/teacher/classes', req => {
  const u = who(req, 'teacher');
  return {classes: db.prepare('SELECT classes.id, classes.name, classes.created, COUNT(students.id) AS students FROM classes LEFT JOIN students ON students.class_id = classes.id WHERE teacher_id = ? GROUP BY classes.id ORDER BY classes.name COLLATE NOCASE').all(u.id)};
});

route('POST', '/api/teacher/classes', async (req, body) => {
  const u = who(req, 'teacher'), name = String(body.name || '').trim().slice(0, 60);
  if (!name) throw new Oops(400, 'Give the class a name.');
  const id = Number(db.prepare('INSERT INTO classes (teacher_id, name, created) VALUES (?,?,?)').run(u.id, name, now()).lastInsertRowid);
  let students = [];
  try { students = await makeStudents(id, body.names, body.count); }
  catch (e) { db.prepare('DELETE FROM classes WHERE id = ?').run(id); throw e; }
  return {class: {id, name}, students};
});

route('GET', '/api/teacher/classes/:id', (req, body, p) => {
  const u = who(req, 'teacher'), c = ownClass(u.id, p.id);
  const students = db.prepare('SELECT id, name, created, last_seen, side, min_level FROM students WHERE class_id = ? ORDER BY name COLLATE NOCASE').all(c.id)
    .map(s => Object.assign({id: s.id, name: s.name, created: s.created, side: s.side, minLevel: s.min_level}, summary(s.id, s.last_seen)));
  return {class: {id: c.id, name: c.name}, students, weekStart: weekStart(now())};
});

route('POST', '/api/teacher/classes/:id/rename', (req, body, p) => {
  const u = who(req, 'teacher'), c = ownClass(u.id, p.id), name = String(body.name || '').trim().slice(0, 60);
  if (!name) throw new Oops(400, 'Give the class a name.');
  db.prepare('UPDATE classes SET name = ? WHERE id = ?').run(name, c.id);
  return {ok: true};
});

route('POST', '/api/teacher/classes/:id/students', async (req, body, p) => {
  const u = who(req, 'teacher'), c = ownClass(u.id, p.id);
  return {class: {id: c.id, name: c.name}, students: await makeStudents(c.id, body.names, body.count)};
});

// A new password for one student, or for the whole class (e.g. lost cards). Logs them out everywhere.
async function resetStudents(list) {
  const out = [], upd = db.prepare('UPDATE students SET pass = ? WHERE id = ?'), del = db.prepare("DELETE FROM sessions WHERE role = 'student' AND user_id = ?");
  for (const s of list) { const pw = password(); upd.run(await hashPassword(pw), s.id); del.run(s.id); out.push({id: s.id, name: s.name, password: pw}); }
  return out;
}
route('POST', '/api/teacher/students/:id/reset', async (req, body, p) => {
  const u = who(req, 'teacher');
  const s = db.prepare('SELECT students.id, students.name, classes.name AS class_name FROM students JOIN classes ON classes.id = students.class_id WHERE students.id = ? AND classes.teacher_id = ?').get(+p.id, u.id);
  if (!s) throw new Oops(404, 'Student not found.');
  return {class: {name: s.class_name}, students: await resetStudents([s])};
});
route('POST', '/api/teacher/classes/:id/reset-all', async (req, body, p) => {
  const u = who(req, 'teacher'), c = ownClass(u.id, p.id);
  return {class: {id: c.id, name: c.name}, students: await resetStudents(db.prepare('SELECT id, name FROM students WHERE class_id = ? ORDER BY name COLLATE NOCASE').all(c.id))};
});

// ---------- class games (29 Oct 2026) ----------
// The teacher sets a game for a class: a subject, how long (10 minutes unless they change it), the score needed to pass
// and, if they like, a due time. Each student plays it once, at their own level for that subject but never below the
// lowest level the teacher set for them, in English or in the Chinese version (also set by the teacher). Score: +1 for
// each right answer, -1 for each wrong one, never below 0, the same at every level. The clock starts when the student
// presses Start and keeps running until the time is up, even if they leave the page; after a crash they carry on with
// the time that is left. Below the score needed: they can play again. After the due time: still allowed, marked late.
// The games themselves run on the topic pages (en/engine/app.js, address ending #class-<game id>); this part keeps
// the games and each student's goes ("attempts"), and works out what the teacher and the student see.
// Subjects: those with an English and a Chinese version. More (arithmetic, general knowledge…) can be added here.
const SUBJECTS = [
  {key: 'representation', name: 'Representation', zh: '再现'},
  {key: 'web-design', name: 'Web design', zh: '网页设计'},
  {key: 'descriptive', name: 'Descriptive language', zh: '描写性语言'},
  {key: 'essentials', name: 'Academic English Essentials', zh: '学术英语基础'}
];
const subjectOf = key => SUBJECTS.find(s => s.key === key) || {key, name: key, zh: ''};
const pathFor = (key, side) => (side === 'zh' ? 'zh/' : 'en/') + key + '/index.html';
const GRACE = 20e3;               // a score sent up to 20 seconds after the time is up still counts (slow connections)
const MAX_MINUTES = 60;
const SIDES = ['en', 'zh'];
const levelIn = v => { const n = Math.floor(+v); return n >= 1 && n <= 5 ? n : null; };

// One student's goes at one game → what to show
function standing(game, list, t) {
  const done = list.filter(a => a.finished || t >= a.ends).sort((a, b) => a.started - b.started);
  const live = list.find(a => !a.finished && t < a.ends) || null;
  const pass = done.find(a => a.score >= game.min_score) || null;
  const best = done.reduce((b, a) => (!b || a.score > b.score ? a : b), null);
  const shown = pass || (live && !done.length ? live : best);
  const status = pass ? 'passed' : live ? 'playing' : done.length ? 'below' : 'new';
  const late = pass ? !!(game.due && pass.started > game.due) : !!(game.due && t > game.due);
  return {status, late, attempts: list.length, score: shown ? shown.score : null, right: shown ? shown.right_n : null, wrong: shown ? shown.wrong_n : null,
    level: shown ? shown.level : null, side: shown ? shown.side : null, finished: pass ? (pass.finished || pass.ends) : null,
    live: live ? {id: live.id, msLeft: Math.max(0, live.ends - t), score: live.score, right: live.right_n, wrong: live.wrong_n} : null};
}
const gameInfo = g => Object.assign({id: g.id, subject: g.subject, minutes: g.minutes, minScore: g.min_score, due: g.due, created: g.created, closed: g.closed},
  {name: subjectOf(g.subject).name, zh: subjectOf(g.subject).zh});
const attemptsOf = (gameId, studentId) => db.prepare('SELECT * FROM attempts WHERE game_id = ? AND student_id = ? ORDER BY started').all(gameId, studentId);
const studentRow = id => db.prepare('SELECT students.*, classes.teacher_id FROM students JOIN classes ON classes.id = students.class_id WHERE students.id = ?').get(id);
function ownGame(teacherId, gameId) {
  const g = db.prepare('SELECT games.* FROM games JOIN classes ON classes.id = games.class_id WHERE games.id = ? AND classes.teacher_id = ?').get(+gameId, teacherId);
  if (!g) throw new Oops(404, 'Game not found.');
  return g;
}

// ----- the student's side -----
route('GET', '/api/student/games', req => {
  const u = who(req, 'student'), s = studentRow(u.id), t = now();
  if (!s) throw new Oops(401, 'Please log in again.');
  const games = db.prepare('SELECT * FROM games WHERE class_id = ? AND closed IS NULL ORDER BY created DESC').all(s.class_id)
    .map(g => Object.assign(gameInfo(g), {path: pathFor(g.subject, s.side)}, standing(g, attemptsOf(g.id, s.id), t)));
  return {side: s.side, minLevel: s.min_level, games, now: t};
});

// Start a game, or carry on with a go that still has time left
route('POST', '/api/student/games/:id/start', (req, body, p) => {
  const u = who(req, 'student'), s = studentRow(u.id), t = now();
  if (!s) throw new Oops(401, 'Please log in again.');
  const g = db.prepare('SELECT * FROM games WHERE id = ? AND class_id = ?').get(+p.id, s.class_id);
  if (!g || g.closed) throw new Oops(404, 'This class game has finished. 这个课堂游戏已经结束了。');
  const list = attemptsOf(g.id, s.id), st = standing(g, list, t);
  let a = list.find(x => !x.finished && t < x.ends);
  if (!a) {
    if (st.status === 'passed') throw new Oops(409, 'You have already done this one. 你已经完成了。');
    const id = Number(db.prepare('INSERT INTO attempts (game_id, student_id, side, started, ends, updated, level) VALUES (?,?,?,?,?,?,?)')
      .run(g.id, s.id, s.side, t, t + g.minutes * 60e3, t, s.min_level).lastInsertRowid);
    a = db.prepare('SELECT * FROM attempts WHERE id = ?').get(id);
  }
  return {game: Object.assign(gameInfo(g), {path: pathFor(g.subject, a.side)}), side: a.side, minLevel: s.min_level,
    attempt: {id: a.id, n: list.filter(x => x.id < a.id).length + 1, started: a.started, msLeft: Math.max(0, a.ends - t), msTotal: a.ends - a.started,
      score: a.score, right: a.right_n, wrong: a.wrong_n, games: parse(a.games) || []}};
});

// The score so far (sent every few seconds while playing, and at the end)
route('POST', '/api/student/attempts/:id', (req, body, p) => {
  const u = who(req, 'student'), t = now();
  const a = db.prepare('SELECT * FROM attempts WHERE id = ? AND student_id = ?').get(+p.id, u.id);
  if (!a) throw new Oops(404, 'Not found.');
  const g = db.prepare('SELECT * FROM games WHERE id = ?').get(a.game_id);
  const open = !a.finished && t <= a.ends + GRACE;
  if (open) {
    const n = (v, d) => Math.max(0, Math.min(100000, Math.floor(+v || 0))) || d;
    const games = Array.isArray(body.games) ? JSON.stringify(body.games.slice(0, 20).map(x => String(x).slice(0, 40))) : a.games;
    const fin = body.finished || t >= a.ends ? Math.min(t, a.ends) : null;
    db.prepare('UPDATE attempts SET score = ?, right_n = ?, wrong_n = ?, level = ?, games = ?, updated = ?, finished = ? WHERE id = ?')
      .run(n(body.score, 0), n(body.right, 0), n(body.wrong, 0), levelIn(body.level) || a.level, games, t, fin, a.id);
  }
  const b = db.prepare('SELECT * FROM attempts WHERE id = ?').get(a.id), st = standing(g, attemptsOf(g.id, u.id), t);
  return {saved: open, score: b.score, msLeft: Math.max(0, b.ends - t), done: !!b.finished || t >= b.ends, passed: b.score >= g.min_score,
    minScore: g.min_score, status: st.status, late: st.late};
});

// ----- the teacher's side -----
// Each student's side and lowest level: one student, or the whole class at once
function settings(where, args, body) {
  const sets = [], vals = [];
  if (body.side !== undefined) { if (!SIDES.includes(body.side)) throw new Oops(400, 'Side must be en or zh.'); sets.push('side = ?'); vals.push(body.side); }
  if (body.minLevel !== undefined) { sets.push('min_level = ?'); vals.push(levelIn(body.minLevel)); }
  if (!sets.length) throw new Oops(400, 'Nothing to change.');
  db.prepare(`UPDATE students SET ${sets.join(', ')} WHERE ${where}`).run(...vals, ...args);
  return {ok: true};
}
route('POST', '/api/teacher/students/:id/settings', (req, body, p) => {
  const u = who(req, 'teacher'), s = studentRow(+p.id);
  if (!s || s.teacher_id !== u.id) throw new Oops(404, 'Student not found.');
  return settings('id = ?', [s.id], body);
});
route('POST', '/api/teacher/classes/:id/settings', (req, body, p) => {
  const u = who(req, 'teacher'), c = ownClass(u.id, p.id);
  return settings('class_id = ?', [c.id], body);
});

route('GET', '/api/teacher/subjects', req => { who(req, 'teacher'); return {subjects: SUBJECTS}; });

route('GET', '/api/teacher/classes/:id/games', (req, body, p) => {
  const u = who(req, 'teacher'), c = ownClass(u.id, p.id), t = now();
  const students = db.prepare('SELECT id FROM students WHERE class_id = ?').all(c.id);
  const games = db.prepare('SELECT * FROM games WHERE class_id = ? ORDER BY created DESC').all(c.id).map(g => {
    const n = {new: 0, playing: 0, passed: 0, below: 0, late: 0};
    for (const s of students) { const st = standing(g, attemptsOf(g.id, s.id), t); n[st.status]++; if (st.late && st.status === 'passed') n.late++; }
    return Object.assign(gameInfo(g), {counts: n, students: students.length});
  });
  return {class: {id: c.id, name: c.name}, games, subjects: SUBJECTS};
});

route('POST', '/api/teacher/classes/:id/games', (req, body, p) => {
  const u = who(req, 'teacher'), c = ownClass(u.id, p.id);
  if (!SUBJECTS.some(s => s.key === body.subject)) throw new Oops(400, 'Choose a subject.');
  const minutes = Math.floor(+body.minutes || 10);
  if (minutes < 1 || minutes > MAX_MINUTES) throw new Oops(400, `The game can be 1 to ${MAX_MINUTES} minutes long.`);
  const minScore = Math.max(0, Math.min(10000, Math.floor(+body.minScore || 0)));
  const due = body.due ? Math.floor(+body.due) || null : null;
  const id = Number(db.prepare('INSERT INTO games (class_id, subject, minutes, min_score, due, created) VALUES (?,?,?,?,?,?)')
    .run(c.id, body.subject, minutes, minScore, due, now()).lastInsertRowid);
  return {game: gameInfo(db.prepare('SELECT * FROM games WHERE id = ?').get(id))};
});

route('GET', '/api/teacher/games/:id', (req, body, p) => {
  const u = who(req, 'teacher'), g = ownGame(u.id, p.id), t = now();
  const c = db.prepare('SELECT id, name FROM classes WHERE id = ?').get(g.class_id);
  const students = db.prepare('SELECT id, name, side, min_level FROM students WHERE class_id = ? ORDER BY name COLLATE NOCASE').all(g.class_id)
    .map(s => Object.assign({id: s.id, name: s.name, setSide: s.side, minLevel: s.min_level}, standing(g, attemptsOf(g.id, s.id), t)));
  return {class: c, game: gameInfo(g), students, now: t};
});

// Change a game: the score needed, the due time, or close it (students stop seeing it) / open it again
route('POST', '/api/teacher/games/:id', (req, body, p) => {
  const u = who(req, 'teacher'), g = ownGame(u.id, p.id);
  if (body.minScore !== undefined) db.prepare('UPDATE games SET min_score = ? WHERE id = ?').run(Math.max(0, Math.min(10000, Math.floor(+body.minScore || 0))), g.id);
  if (body.due !== undefined) db.prepare('UPDATE games SET due = ? WHERE id = ?').run(body.due ? Math.floor(+body.due) || null : null, g.id);
  if (body.closed !== undefined) db.prepare('UPDATE games SET closed = ? WHERE id = ?').run(body.closed ? now() : null, g.id);
  return {game: gameInfo(db.prepare('SELECT * FROM games WHERE id = ?').get(g.id))};
});
route('POST', '/api/teacher/games/:id/delete', (req, body, p) => {
  const u = who(req, 'teacher'), g = ownGame(u.id, p.id);
  db.exec('BEGIN');
  try { db.prepare('DELETE FROM attempts WHERE game_id = ?').run(g.id); db.prepare('DELETE FROM games WHERE id = ?').run(g.id); db.exec('COMMIT'); }
  catch (e) { db.exec('ROLLBACK'); throw e; }
  return {ok: true};
});

// ---------- the web server ----------
function cors(req, res) {
  const o = req.headers.origin;
  if (o && (ALLOWED.includes(o) || DEV_ORIGIN.test(o))) {
    res.setHeader('Access-Control-Allow-Origin', o);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
}
function send(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'});
  res.end(body);
}
function readBody(req) {
  return new Promise((ok, no) => {
    let size = 0; const parts = [];
    req.on('data', c => { size += c.length; if (size > MAX_BODY) { no(new Oops(413, 'Too much data.')); req.destroy(); } else parts.push(c); });
    req.on('end', () => { if (!size) return ok({}); try { ok(JSON.parse(Buffer.concat(parts).toString('utf8'))); } catch (e) { no(new Oops(400, 'Bad request.')); } });
    req.on('error', no);
  });
}

const server = http.createServer(async (req, res) => {
  cors(req, res);
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const url = new URL(req.url, 'http://x');
  for (const r of routes) {
    const m = r.re.exec(url.pathname);
    if (!m || r.method !== req.method) continue;
    try {
      const body = req.method === 'POST' ? await readBody(req) : {};
      return send(res, 200, await r.fn(req, body || {}, m.groups || {}));
    } catch (e) {
      if (e instanceof Oops) return send(res, e.status, {error: e.message});
      console.error(new Date().toISOString(), req.method, url.pathname, e);
      return send(res, 500, {error: 'Something went wrong on the server. Please try again.'});
    }
  }
  if (url.pathname === '/' ) return send(res, 200, {ok: true, name: 'Academic English App server'});
  send(res, 404, {error: 'Not found.'});
});

// ---------- a copy of the database every day, the last 14 kept ----------
function backup() {
  if (DB_PATH === ':memory:') return;
  try {
    fs.mkdirSync(BACKUP_DIR, {recursive: true});
    const file = path.join(BACKUP_DIR, 'aea-' + dayKey(now()) + '.db');
    if (!fs.existsSync(file)) db.exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
    const old = fs.readdirSync(BACKUP_DIR).filter(f => /^aea-\d{4}-\d\d-\d\d\.db$/.test(f)).sort().slice(0, -14);
    for (const f of old) fs.unlinkSync(path.join(BACKUP_DIR, f));
  } catch (e) { console.error('Backup failed:', e.message); }
}
setTimeout(backup, 60e3).unref();
setInterval(backup, 6 * 3600e3).unref();

server.listen(PORT, HOST, () => console.log(`Academic English App server on http://${HOST}:${PORT} (database ${DB_PATH})`));
const stop = () => { server.close(() => { try { db.close(); } catch (e) {} process.exit(0); }); setTimeout(() => process.exit(0), 3000).unref(); };
process.on('SIGTERM', stop); process.on('SIGINT', stop);

module.exports = {server, summary};
