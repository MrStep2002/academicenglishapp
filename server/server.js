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
  const students = db.prepare('SELECT id, name, created, last_seen FROM students WHERE class_id = ? ORDER BY name COLLATE NOCASE').all(c.id)
    .map(s => Object.assign({id: s.id, name: s.name, created: s.created}, summary(s.id, s.last_seen)));
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
