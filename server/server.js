// Academic English App: the login server (api.academicenglishapp.com).
// Students log in with the fun name and password their teacher gave them; their saved progress (the same data the
// games keep in the browser) is copied to the server, so it follows them to any device. Teachers make classes and
// accounts and see each student's points, level and last activity. Reports (31 Oct 2026): anyone can report a question
// after a wrong answer; the teacher keeps it or removes it from the games (see "reports" below). Suggestions box (3 Nov 2026):
// logged-in students send ideas from the topic lists; the teacher reads them on the teacher page (see "suggestions box").
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
// Reports and Suggestions are for the admin only (9 Nov 2026, teacher). The admin is a teacher marked admin
// (server/admin.js make-admin <username>), or, while no teacher is marked, the first teacher login made.
function isAdmin(id) {
  if (db.prepare('SELECT 1 FROM teachers WHERE admin = 1').get()) return !!db.prepare('SELECT 1 FROM teachers WHERE id = ? AND admin = 1').get(id);
  const first = db.prepare('SELECT id FROM teachers ORDER BY id LIMIT 1').get();
  return !!first && first.id === id;
}
function admin(req) { const u = who(req, 'teacher'); if (!isAdmin(u.id)) throw new Oops(403, 'Only the admin can see this.'); return u; }

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
  const join = db.prepare('INSERT OR IGNORE INTO class_members (class_id, student_id, added) VALUES (?,?,?)');
  db.exec('BEGIN');
  try {
    for (const m of made) { m.id = Number(ins.run(classId, m.name, loginKey(m.name), m.hash, now()).lastInsertRowid); join.run(classId, m.id, now()); }
    db.exec('COMMIT');
  }
  catch (e) { db.exec('ROLLBACK'); throw e; }
  return made.map(({id, name, password}) => ({id, name, password}));
}
// Shared classes (9 Nov 2026): a class belongs to the teacher who made it (classes.teacher_id) and to any teacher they
// shared it with (class_teachers). Both can do everything with it (students, passwords, class games, renaming) except
// share it: only the teacher who made it shares it or stops sharing it.
const TAUGHT = 'SELECT id FROM classes WHERE teacher_id = ? UNION SELECT class_id FROM class_teachers WHERE teacher_id = ?';
const teaches = (teacherId, c) => !!c && (c.teacher_id === teacherId || !!db.prepare('SELECT 1 FROM class_teachers WHERE class_id = ? AND teacher_id = ?').get(c.id, teacherId));
const teacherName = id => (db.prepare('SELECT name FROM teachers WHERE id = ?').get(id) || {}).name || '?';
const sharedWith = classId => db.prepare('SELECT teachers.id, teachers.name FROM class_teachers JOIN teachers ON teachers.id = class_teachers.teacher_id WHERE class_id = ? ORDER BY teachers.name COLLATE NOCASE').all(classId);
function ownClass(teacherId, classId) {
  const c = db.prepare('SELECT * FROM classes WHERE id = ?').get(+classId);
  if (!teaches(teacherId, c)) throw new Oops(404, 'Class not found.');
  return c;
}

// ---------- students in more than one class (30 Oct 2026) ----------
// One account can be in several classes (e.g. English and Media): the same name, password, progress, version and lowest
// level everywhere. The class table and the class games of each class include them.
const MEMBERS = 'SELECT student_id FROM class_members WHERE class_id = ?';
const classesOf = studentId => db.prepare('SELECT classes.id, classes.name, classes.teacher_id FROM class_members JOIN classes ON classes.id = class_members.class_id WHERE student_id = ? ORDER BY classes.name COLLATE NOCASE').all(studentId);
const classNames = studentId => classesOf(studentId).map(c => c.name).join(', ');
// A student in one of this teacher's classes
function ownStudent(teacherId, studentId) {
  const s = db.prepare('SELECT * FROM students WHERE id = ?').get(+studentId);
  if (!s || !classesOf(s.id).some(c => teaches(teacherId, c))) throw new Oops(404, 'Student not found.');
  return s;
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
  const s = db.prepare('SELECT * FROM students WHERE login = ?').get(key);
  if (!s || !(await checkPassword(body.password, s.pass))) {
    failed('s:' + key); failed('ip:' + ip);
    throw new Oops(401, 'That name and password don\'t match. Check them, or ask your teacher. 名字或密码不对。');
  }
  const hasData = !!db.prepare("SELECT 1 FROM saved WHERE student_id = ? AND key IN ('aea:progress:v1','aea:points:v1')").get(s.id);
  return {token: startSession('student', s.id), role: 'student', name: s.name, className: classNames(s.id), hasData};
});

route('POST', '/api/logout', req => { const u = who(req); db.prepare('DELETE FROM sessions WHERE token = ?').run(u.token); return {ok: true}; });

route('GET', '/api/me', req => {
  const u = who(req);
  if (u.role === 'teacher') { const t = db.prepare('SELECT name, login FROM teachers WHERE id = ?').get(u.id); return {role: 'teacher', name: t.name, username: t.login}; }
  const s = db.prepare('SELECT id, name FROM students WHERE id = ?').get(u.id);
  if (!s) throw new Oops(401, 'Please log in again.');
  return {role: 'student', name: s.name, className: classNames(s.id)};
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
  return {token: startSession('teacher', t.id), role: 'teacher', name: t.name, admin: isAdmin(t.id)};
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
  // Their own classes and the ones shared with them. mine: they made it; sharedWith: who they shared it with; from: who shared it
  const classes = db.prepare(`SELECT classes.id, classes.name, classes.created, classes.teacher_id, COUNT(class_members.student_id) AS students FROM classes LEFT JOIN class_members ON class_members.class_id = classes.id WHERE classes.id IN (${TAUGHT}) GROUP BY classes.id ORDER BY classes.name COLLATE NOCASE`).all(u.id, u.id)
    .map(c => c.teacher_id === u.id ? {id: c.id, name: c.name, created: c.created, students: c.students, mine: true, sharedWith: sharedWith(c.id).map(t => t.name)}
      : {id: c.id, name: c.name, created: c.created, students: c.students, mine: false, from: teacherName(c.teacher_id)});
  return {classes, admin: isAdmin(u.id)};   // admin: the Staff Room shows Reports and Suggestions
});

route('POST', '/api/teacher/classes', async (req, body) => {
  const u = who(req, 'teacher'), name = String(body.name || '').trim().slice(0, 60);
  if (!name) throw new Oops(400, 'Give the class a name.');
  const id = Number(db.prepare('INSERT INTO classes (teacher_id, name, created) VALUES (?,?,?)').run(u.id, name, now()).lastInsertRowid);
  let students = [];
  try { if (!body.none) students = await makeStudents(id, body.names, body.count); }   // none: students come from other classes
  catch (e) { db.prepare('DELETE FROM classes WHERE id = ?').run(id); throw e; }
  return {class: {id, name}, students};
});

route('GET', '/api/teacher/classes/:id', (req, body, p) => {
  const u = who(req, 'teacher'), c = ownClass(u.id, p.id);
  const students = db.prepare(`SELECT id, name, created, last_seen, side, min_level FROM students WHERE id IN (${MEMBERS}) ORDER BY name COLLATE NOCASE`).all(c.id)
    .map(s => Object.assign({id: s.id, name: s.name, created: s.created, side: s.side, minLevel: s.min_level,
      alsoIn: classesOf(s.id).filter(o => o.id !== c.id).map(o => ({id: o.id, name: o.name, mine: teaches(u.id, o)}))}, summary(s.id, s.last_seen)));
  // teachers: who the class belongs to (mine: this teacher made it, so can share it; owner: who made it; shared: the others)
  return {class: {id: c.id, name: c.name}, students, weekStart: weekStart(now()),
    teachers: {mine: c.teacher_id === u.id, owner: teacherName(c.teacher_id), shared: sharedWith(c.id)}};
});

// Share a class with another teacher (their username), or stop sharing it. Only the teacher who made the class.
function madeClass(u, classId) {
  const c = ownClass(u.id, classId);
  if (c.teacher_id !== u.id) throw new Oops(403, `Only ${teacherName(c.teacher_id)}, who made this class, can share it.`);
  return c;
}
route('POST', '/api/teacher/classes/:id/share', (req, body, p) => {
  const u = who(req, 'teacher'), c = madeClass(u, p.id), key = loginKey(body.username);
  if (!key) throw new Oops(400, 'Type the other teacher\'s username.');
  const t = db.prepare('SELECT id, name FROM teachers WHERE login = ?').get(key);
  if (!t) throw new Oops(404, 'There is no teacher with that username. Check it, or ask the admin.');
  if (t.id === u.id) throw new Oops(400, 'That is your own username.');
  db.prepare('INSERT OR IGNORE INTO class_teachers (class_id, teacher_id, added) VALUES (?,?,?)').run(c.id, t.id, now());
  return {ok: true, teacher: {id: t.id, name: t.name}};
});
route('POST', '/api/teacher/classes/:id/unshare', (req, body, p) => {
  const u = who(req, 'teacher'), c = madeClass(u, p.id);
  db.prepare('DELETE FROM class_teachers WHERE class_id = ? AND teacher_id = ?').run(c.id, +body.id);
  return {ok: true};
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
  const u = who(req, 'teacher'), s = ownStudent(u.id, p.id);
  return {class: {name: classNames(s.id)}, students: await resetStudents([s])};
});
route('POST', '/api/teacher/classes/:id/reset-all', async (req, body, p) => {
  const u = who(req, 'teacher'), c = ownClass(u.id, p.id);
  return {class: {id: c.id, name: c.name}, students: await resetStudents(db.prepare(`SELECT id, name FROM students WHERE id IN (${MEMBERS}) ORDER BY name COLLATE NOCASE`).all(c.id))};
});

// All this teacher's students, with their classes: to choose some to add to another class
route('GET', '/api/teacher/students', req => {
  const u = who(req, 'teacher');
  const students = db.prepare(`SELECT DISTINCT students.id, students.name FROM students JOIN class_members ON class_members.student_id = students.id WHERE class_members.class_id IN (${TAUGHT}) ORDER BY students.name COLLATE NOCASE`).all(u.id, u.id)
    .map(s => ({id: s.id, name: s.name, classes: classesOf(s.id).filter(c => teaches(u.id, c)).map(c => ({id: c.id, name: c.name}))}));
  return {students};
});
// Put students who are already in another of this teacher's classes into this class too (same account)
route('POST', '/api/teacher/classes/:id/members', (req, body, p) => {
  const u = who(req, 'teacher'), c = ownClass(u.id, p.id);
  const ids = Array.isArray(body.ids) ? [...new Set(body.ids.map(Number).filter(Number.isInteger))] : [];
  if (!ids.length) throw new Oops(400, 'Choose at least one student.');
  if (ids.length > 200) throw new Oops(400, 'At most 200 students at a time.');
  const list = ids.map(id => ownStudent(u.id, id));
  const join = db.prepare('INSERT OR IGNORE INTO class_members (class_id, student_id, added) VALUES (?,?,?)');
  let added = 0;
  db.exec('BEGIN');
  try { for (const s of list) added += Number(join.run(c.id, s.id, now()).changes); db.exec('COMMIT'); }
  catch (e) { db.exec('ROLLBACK'); throw e; }
  return {added};
});
// Take a student out of this class. Only if they are in another class too: the account, its password and progress stay.
route('POST', '/api/teacher/classes/:id/members/remove', (req, body, p) => {
  const u = who(req, 'teacher'), c = ownClass(u.id, p.id);
  const s = db.prepare('SELECT * FROM students WHERE id = ?').get(+body.id);
  if (!s || !db.prepare('SELECT 1 FROM class_members WHERE class_id = ? AND student_id = ?').get(c.id, s.id)) throw new Oops(404, 'That student is not in this class.');
  const others = classesOf(s.id).filter(o => o.id !== c.id);
  if (!others.length) throw new Oops(400, `${s.name} is only in this class, so they can't be taken out of it.`);
  db.exec('BEGIN');
  try {
    db.prepare('DELETE FROM class_members WHERE class_id = ? AND student_id = ?').run(c.id, s.id);
    if (s.class_id === c.id) db.prepare('UPDATE students SET class_id = ? WHERE id = ?').run(others[0].id, s.id);
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
  return {ok: true};
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
// The subjects a class game can be set on. key = the page's folder (en/<key>/, zh/<key>/), so Media Descriptors is
// describing-people. Added 7 Nov 2026: Media Descriptors, Advertising, Chemistry, Physics. A game already set keeps its key.
const SUBJECTS = [
  {key: 'essentials', name: 'Academic English Essentials', zh: '学术英语基础'},
  {key: 'web-design', name: 'Web design', zh: '网页设计'},
  {key: 'representation', name: 'Representation', zh: '再现'},
  {key: 'describing-people', name: 'Media Descriptors', zh: '媒体描述词'},
  {key: 'advertising', name: 'Advertising', zh: '广告'},
  {key: 'descriptive', name: 'Descriptive language', zh: '描写性语言'},
  {key: 'chemistry', name: 'Chemistry', zh: '化学'},
  {key: 'physics', name: 'Physics', zh: '物理'}
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
const studentRow = id => db.prepare('SELECT * FROM students WHERE id = ?').get(id);
const MY_CLASSES = 'SELECT class_id FROM class_members WHERE student_id = ?';
function ownGame(teacherId, gameId) {
  const g = db.prepare(`SELECT * FROM games WHERE id = ? AND class_id IN (${TAUGHT})`).get(+gameId, teacherId, teacherId);
  if (!g) throw new Oops(404, 'Game not found.');
  return g;
}

// ----- the student's side -----
route('GET', '/api/student/games', req => {
  const u = who(req, 'student'), s = studentRow(u.id), t = now();
  if (!s) throw new Oops(401, 'Please log in again.');
  const classes = classesOf(s.id), cname = id => (classes.find(c => c.id === id) || {}).name || '';
  const games = db.prepare(`SELECT * FROM games WHERE class_id IN (${MY_CLASSES}) AND closed IS NULL ORDER BY created DESC`).all(s.id)
    .map(g => Object.assign(gameInfo(g), {path: pathFor(g.subject, s.side), className: cname(g.class_id)}, standing(g, attemptsOf(g.id, s.id), t)));
  return {side: s.side, minLevel: s.min_level, classes: classes.length, games, now: t};
});

// Start a game, or carry on with a go that still has time left
route('POST', '/api/student/games/:id/start', (req, body, p) => {
  const u = who(req, 'student'), s = studentRow(u.id), t = now();
  if (!s) throw new Oops(401, 'Please log in again.');
  const g = db.prepare(`SELECT * FROM games WHERE id = ? AND class_id IN (${MY_CLASSES})`).get(+p.id, s.id);
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
  const u = who(req, 'teacher'), s = ownStudent(u.id, p.id);
  return settings('id = ?', [s.id], body);
});
route('POST', '/api/teacher/classes/:id/settings', (req, body, p) => {
  const u = who(req, 'teacher'), c = ownClass(u.id, p.id);
  return settings(`id IN (${MEMBERS})`, [c.id], body);
});

route('GET', '/api/teacher/subjects', req => { who(req, 'teacher'); return {subjects: SUBJECTS}; });

route('GET', '/api/teacher/classes/:id/games', (req, body, p) => {
  const u = who(req, 'teacher'), c = ownClass(u.id, p.id), t = now();
  const students = db.prepare(MEMBERS).all(c.id).map(r => ({id: r.student_id}));
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
  const students = db.prepare(`SELECT id, name, side, min_level FROM students WHERE id IN (${MEMBERS}) ORDER BY name COLLATE NOCASE`).all(g.class_id)
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

// ---------- reports (31 Oct 2026) ----------
// After a wrong answer, a student (or the teacher, playing the games) can press Report: "My answer should be right",
// "The question doesn't make sense" or "Something else", with an optional comment. The teacher page (#/reports) shows
// them grouped by question. Keep: the question stays in the games (a later report brings it back to the list).
// Remove: every game stops showing that question straight away (GET /api/hidden, read by en/engine/app.js), until the
// teacher presses Put back. The CSV row itself is not changed: the removed list is the list of rows to fix or delete.
// Limits: 5 reports a day for each device and each logged-in student, 300 a day from one network address (a whole
// school shares one); none for teachers. One report per question per device or student until the teacher decides.
const REASONS = ['answer', 'unclear', 'other'];
const REPORTS_A_DAY = 5, REPORTS_A_DAY_IP = 300;
const TOPIC_RE = /^[a-z0-9][a-z0-9\-\/]{0,59}$/, GAME_RE = /^[a-z0-9]{1,20}$/, ITEM_RE = /^[\w:.#\-]{1,100}$/, DEVICE_RE = /^[A-Za-z0-9_-]{8,40}$/;
const clip = (v, n) => String(v == null ? '' : v).replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, n);
// The login on the request, if there is one (reporting works without one)
function reporter(req) {
  const m = /^Bearer\s+(\S+)$/.exec(req.headers.authorization || '');
  if (!m) return null;
  const s = db.prepare('SELECT * FROM sessions WHERE token = ?').get(tokenHash(m[1]));
  return s && s.expires >= now() ? {role: s.role, id: s.user_id} : null;
}
const decisionOf = (topic, game, item) => db.prepare('SELECT * FROM report_items WHERE topic = ? AND game = ? AND item = ?').get(topic, game, item);

route('POST', '/api/report', (req, body) => {
  const topic = String(body.topic || ''), game = String(body.game || ''), item = String(body.item || ''), reason = String(body.reason || '');
  if (!TOPIC_RE.test(topic) || !GAME_RE.test(game) || !ITEM_RE.test(item)) throw new Oops(400, "This question can't be reported. 这道题无法报告。");
  if (!REASONS.includes(reason)) throw new Oops(400, 'Choose what is wrong. 请选择问题。');
  const u = reporter(req), t = now(), day = dayKey(t), ipKey = tokenHash('ip:' + ipOf(req));
  const device = DEVICE_RE.test(String(body.device || '')) ? String(body.device) : '';
  const student = u && u.role === 'student' ? u.id : null, teacher = u && u.role === 'teacher' ? u.id : null;
  if (!teacher) {
    const d = decisionOf(topic, game, item);
    const since = d ? d.decided : 0;
    const same = db.prepare('SELECT 1 FROM reports WHERE topic = ? AND game = ? AND item = ? AND created > ? AND ((user_id = ? AND role = ?) OR (device != \'\' AND device = ?))')
      .get(topic, game, item, since, student || -1, 'student', device || '-');
    if (same) return {ok: true, already: true};
    const count = (where, ...args) => db.prepare(`SELECT COUNT(*) AS n FROM reports WHERE day = ? AND ${where}`).get(day, ...args).n;
    const full = 'You can send 5 reports a day. Thank you for checking! 每天最多可以报告5次，谢谢你的检查！';
    if (student && count("role = 'student' AND user_id = ?", student) >= REPORTS_A_DAY) throw new Oops(429, full);
    if (device && count('device = ?', device) >= REPORTS_A_DAY) throw new Oops(429, full);
    if (count('ip = ?', ipKey) >= REPORTS_A_DAY_IP) throw new Oops(429, 'Too many reports from this school today. Please try again tomorrow. 今天报告太多了，请明天再试。');
  }
  db.prepare(`INSERT INTO reports (topic, game, item, reason, comment, shown, chosen, feedback, side, page, page_name, game_name, level,
      role, user_id, device, ip, day, created) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(topic, game, item, reason, clip(body.comment, 300), clip(body.shown, 2000), clip(body.chosen, 300), clip(body.feedback, 1500),
      body.side === 'zh' ? 'zh' : 'en', clip(body.page, 120), clip(body.pageName, 80), clip(body.gameName, 60), clip(body.level, 20),
      u ? u.role : '', u ? u.id : null, device, ipKey, day, t);
  return {ok: true};
});

// The questions the teacher has removed: every game page reads this when it opens (no login needed)
route('GET', '/api/hidden', () => ({hidden: db.prepare("SELECT topic, game, item FROM report_items WHERE status = 'removed' ORDER BY topic, game, item").all()}));

// The teacher's list: open (reported, not decided since), removed, and kept (the last 200)
route('GET', '/api/teacher/reports', req => {
  const u = admin(req);
  const names = {student: {}, teacher: {}};
  const nameOf = r => {
    if (!r.role) return 'Guest';
    if (r.role === 'teacher' && r.user_id === u.id) return 'You';
    const box = names[r.role] || {};
    if (!(r.user_id in box)) { const row = db.prepare(`SELECT name FROM ${r.role === 'teacher' ? 'teachers' : 'students'} WHERE id = ?`).get(r.user_id); box[r.user_id] = row ? row.name : '?'; }
    return box[r.user_id];
  };
  const groups = new Map();
  for (const r of db.prepare('SELECT * FROM reports ORDER BY created').all()) {
    const k = r.topic + '|' + r.game + '|' + r.item;
    let g = groups.get(k);
    if (!g) groups.set(k, g = {topic: r.topic, game: r.game, item: r.item, all: []});
    g.all.push(r);
  }
  const open = [], kept = [], removed = [];
  for (const g of groups.values()) {
    const d = decisionOf(g.topic, g.game, g.item), since = d ? d.decided : 0;
    const fresh = g.all.filter(r => r.created > since), list = d && d.status === 'removed' ? g.all : (fresh.length ? fresh : g.all), last = list[list.length - 1];
    const reasons = {answer: 0, unclear: 0, other: 0};
    list.forEach(r => { reasons[r.reason] = (reasons[r.reason] || 0) + 1; });
    const out = {topic: g.topic, game: g.game, item: g.item, pageName: last.page_name, gameName: last.game_name, page: last.page, side: last.side,
      level: last.level, shown: last.shown, feedback: last.feedback, chosen: [...new Set(list.map(r => r.chosen).filter(Boolean))],
      reasons, count: list.length, total: g.all.length, first: list[0].created, last: last.created,
      reports: list.map(r => ({reason: r.reason, comment: r.comment, who: nameOf(r), side: r.side, chosen: r.chosen, created: r.created})),
      status: d ? d.status : null, decided: d ? d.decided : null, keptBefore: !!(d && d.status === 'kept' && fresh.length)};
    if (d && d.status === 'removed') removed.push(out);
    else if (!d || fresh.length) open.push(out);
    else kept.push(out);
  }
  open.sort((a, b) => b.count - a.count || b.last - a.last);
  removed.sort((a, b) => b.decided - a.decided);
  kept.sort((a, b) => b.decided - a.decided);
  return {open, removed, kept: kept.slice(0, 200)};
});

// Keep, Remove, or Put back (= keep) one question
route('POST', '/api/teacher/reports/decide', (req, body) => {
  const u = admin(req), topic = String(body.topic || ''), game = String(body.game || ''), item = String(body.item || '');
  if (!TOPIC_RE.test(topic) || !GAME_RE.test(game) || !ITEM_RE.test(item)) throw new Oops(400, 'Bad question.');
  if (!['kept', 'removed'].includes(body.status)) throw new Oops(400, 'Choose Keep or Remove.');
  if (!db.prepare('SELECT 1 FROM reports WHERE topic = ? AND game = ? AND item = ?').get(topic, game, item)) throw new Oops(404, 'That question has no reports.');
  db.prepare(`INSERT INTO report_items (topic, game, item, status, decided, teacher_id) VALUES (?,?,?,?,?,?)
    ON CONFLICT(topic, game, item) DO UPDATE SET status = excluded.status, decided = excluded.decided, teacher_id = excluded.teacher_id`)
    .run(topic, game, item, body.status, now(), u.id);
  return {ok: true};
});

// ---------- suggestions box (3 Nov 2026) ----------
// A student asked for a suggestions box. At the bottom of both topic lists (en/engine/suggest.js), a logged-in student
// chooses what kind of idea it is and writes it (up to 500 characters); the teacher sees their fun name and class.
// Logged-in students only (teacher's choice), 3 a day each. A browser logged in on the teacher page can send one too
// (to try it out): it shows as "You", with no limit. Teacher page (#/suggestions): New and Done, Delete, spreadsheet.
const KINDS = ['game', 'topic', 'problem', 'other'];
const SUGGESTIONS_A_DAY = 3, SUGGESTION_MAX = 500;

route('POST', '/api/suggest', (req, body) => {
  const u = reporter(req);
  if (!u) throw new Oops(401, 'Please log in to send a suggestion. 请先登录再提建议。');
  const kind = String(body.kind || ''), text = clip(body.text, SUGGESTION_MAX);
  if (!KINDS.includes(kind)) throw new Oops(400, 'Choose what your idea is about. 请选择建议类型。');
  if (text.length < 3) throw new Oops(400, 'Please write your idea. 请写下你的建议。');
  const t = now(), day = dayKey(t);
  if (u.role === 'student') {
    const n = db.prepare("SELECT COUNT(*) AS n FROM suggestions WHERE role = 'student' AND user_id = ? AND day = ?").get(u.id, day).n;
    if (n >= SUGGESTIONS_A_DAY) throw new Oops(429, `You can send ${SUGGESTIONS_A_DAY} suggestions a day. Thank you for your ideas! 每天最多可以提${SUGGESTIONS_A_DAY}条建议，谢谢你的想法！`);
    db.prepare('UPDATE students SET last_seen = ? WHERE id = ?').run(t, u.id);
  }
  db.prepare('INSERT INTO suggestions (kind, text, side, page, role, user_id, day, created) VALUES (?,?,?,?,?,?,?,?)')
    .run(kind, text, body.side === 'zh' ? 'zh' : 'en', clip(body.page, 120), u.role, u.id, day, t);
  const left = u.role === 'student' ? SUGGESTIONS_A_DAY - db.prepare("SELECT COUNT(*) AS n FROM suggestions WHERE role = 'student' AND user_id = ? AND day = ?").get(u.id, day).n : null;
  return {ok: true, left};
});

// The teacher's list: new (oldest first, so nothing waits too long) and done (the last 300)
route('GET', '/api/teacher/suggestions', req => {
  const u = admin(req);
  const seen = {};
  const from = r => {
    const k = r.role + r.user_id;
    if (seen[k]) return seen[k];
    if (r.role === 'teacher') return (seen[k] = r.user_id === u.id ? {name: 'You', classes: ''} : {name: (db.prepare('SELECT name FROM teachers WHERE id = ?').get(r.user_id) || {}).name || '?', classes: ''});
    const s = db.prepare('SELECT name FROM students WHERE id = ?').get(r.user_id);
    const cls = db.prepare('SELECT c.name FROM class_members m JOIN classes c ON c.id = m.class_id WHERE m.student_id = ? ORDER BY c.name').all(r.user_id).map(c => c.name);
    return (seen[k] = s ? {name: s.name, classes: cls.join(', ')} : {name: '(account deleted)', classes: ''});
  };
  const out = r => Object.assign({id: r.id, kind: r.kind, text: r.text, side: r.side, page: r.page, created: r.created, status: r.status, done: r.done}, from(r));
  return {
    new: db.prepare("SELECT * FROM suggestions WHERE status = 'new' ORDER BY created").all().map(out),
    done: db.prepare("SELECT * FROM suggestions WHERE status = 'done' ORDER BY done DESC LIMIT 300").all().map(out),
  };
});
// Done, or back to New
route('POST', '/api/teacher/suggestions/:id/status', (req, body, p) => {
  admin(req);
  if (!['new', 'done'].includes(body.status)) throw new Oops(400, 'Choose Done or New.');
  const r = db.prepare('UPDATE suggestions SET status = ?, done = ? WHERE id = ?').run(body.status, body.status === 'done' ? now() : null, +p.id);
  if (!r.changes) throw new Oops(404, 'That suggestion is not there any more.');
  return {ok: true};
});
// Delete (a silly one, or one you've copied somewhere else)
route('POST', '/api/teacher/suggestions/:id/delete', (req, body, p) => {
  admin(req);
  db.prepare('DELETE FROM suggestions WHERE id = ?').run(+p.id);
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
