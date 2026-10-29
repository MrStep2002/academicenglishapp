// The database: one SQLite file (default /var/lib/aea/aea.db). Uses the SQLite built into Node.js 22.13+, so nothing to install.
// Real names are never stored: students have the fun names their teacher gave them.
'use strict';
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');
const {DatabaseSync} = require('node:sqlite');

const DB_PATH = process.env.DB_PATH || '/var/lib/aea/aea.db';

function open(file = DB_PATH) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), {recursive: true});
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY, login TEXT UNIQUE NOT NULL, name TEXT NOT NULL, pass TEXT NOT NULL, created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY, teacher_id INTEGER NOT NULL REFERENCES teachers(id), name TEXT NOT NULL, created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY, class_id INTEGER NOT NULL REFERENCES classes(id), name TEXT NOT NULL, login TEXT UNIQUE NOT NULL,
      pass TEXT NOT NULL, created INTEGER NOT NULL, last_seen INTEGER);
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY, role TEXT NOT NULL, user_id INTEGER NOT NULL, created INTEGER NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS saved (
      student_id INTEGER NOT NULL REFERENCES students(id), key TEXT NOT NULL, value TEXT NOT NULL, updated INTEGER NOT NULL,
      PRIMARY KEY (student_id, key));
    CREATE INDEX IF NOT EXISTS students_class ON students(class_id);
    CREATE INDEX IF NOT EXISTS sessions_user ON sessions(role, user_id);
    -- Class games (29 Oct 2026): the teacher sets a game for a class (a subject, how many minutes, the score needed to
    -- pass, an optional due time); each student plays it at their own level, on their side. One row per go.
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY, class_id INTEGER NOT NULL REFERENCES classes(id), subject TEXT NOT NULL, minutes INTEGER NOT NULL,
      min_score INTEGER NOT NULL DEFAULT 0, due INTEGER, created INTEGER NOT NULL, closed INTEGER);
    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY, game_id INTEGER NOT NULL REFERENCES games(id), student_id INTEGER NOT NULL REFERENCES students(id),
      side TEXT NOT NULL, started INTEGER NOT NULL, ends INTEGER NOT NULL, updated INTEGER NOT NULL, finished INTEGER,
      score INTEGER NOT NULL DEFAULT 0, right_n INTEGER NOT NULL DEFAULT 0, wrong_n INTEGER NOT NULL DEFAULT 0, level INTEGER, games TEXT);
    CREATE INDEX IF NOT EXISTS games_class ON games(class_id);
    CREATE INDEX IF NOT EXISTS attempts_game ON attempts(game_id, student_id);
  `);
  // Columns added after the first version: each student's side (English, or the Chinese version) and the lowest level
  // their class games use (1 Foundation … 5 Advanced; empty = no minimum)
  const cols = db.prepare('PRAGMA table_info(students)').all().map(c => c.name);
  if (!cols.includes('side')) db.exec("ALTER TABLE students ADD COLUMN side TEXT NOT NULL DEFAULT 'en'");
  if (!cols.includes('min_level')) db.exec('ALTER TABLE students ADD COLUMN min_level INTEGER');
  // One student in several classes (30 Oct 2026), e.g. a student the teacher has for English and for Media: one account
  // (same name, password, progress, version and lowest level) listed in each class. students.class_id stays as the
  // class the account was made in (or another of their classes if they leave that one); class_members is the full list.
  db.exec(`
    CREATE TABLE IF NOT EXISTS class_members (
      class_id INTEGER NOT NULL REFERENCES classes(id), student_id INTEGER NOT NULL REFERENCES students(id), added INTEGER NOT NULL,
      PRIMARY KEY (class_id, student_id));
    CREATE INDEX IF NOT EXISTS class_members_student ON class_members(student_id);
    INSERT OR IGNORE INTO class_members (class_id, student_id, added) SELECT class_id, id, created FROM students;
  `);
  return db;
}

// What a name is matched on when logging in: lower case, no spaces or punctuation ("Brave Panda" = "bravepanda")
const loginKey = name => String(name || '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

// Passwords are stored only as scrypt hashes
const scrypt = (pw, salt) => new Promise((ok, no) => crypto.scrypt(String(pw), salt, 32, {N: 16384, r: 8, p: 1}, (e, k) => e ? no(e) : ok(k)));
async function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  return 'scrypt$' + salt.toString('base64') + '$' + (await scrypt(pw, salt)).toString('base64');
}
async function checkPassword(pw, stored) {
  const [kind, salt, hash] = String(stored || '').split('$');
  if (kind !== 'scrypt' || !salt || !hash) { await scrypt(pw, 'x'); return false; }
  const want = Buffer.from(hash, 'base64'), got = await scrypt(pw, Buffer.from(salt, 'base64'));
  return want.length === got.length && crypto.timingSafeEqual(want, got);
}

// Session tokens: the browser keeps the token; the database keeps only its SHA-256
const tokenHash = t => crypto.createHash('sha256').update(String(t)).digest('hex');
const newToken = () => crypto.randomBytes(32).toString('base64url');

module.exports = {open, loginKey, hashPassword, checkPassword, tokenHash, newToken, DB_PATH};
