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
