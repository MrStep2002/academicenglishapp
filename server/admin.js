// Jobs for the server terminal (run them in the server's folder, as the aea user so the database stays theirs):
//   sudo -u aea node server/admin.js add-teacher <username> "<Display name>"   make a teacher login (asks for a password)
//   sudo -u aea node server/admin.js teacher-password <username>             set a new password for a teacher
//   sudo -u aea node server/admin.js list                                    teachers, classes and how many students
'use strict';
const readline = require('node:readline');
const {open, loginKey, hashPassword} = require('./db');

function ask(question, hidden) {
  return new Promise(resolve => {
    const rl = readline.createInterface({input: process.stdin, output: process.stdout, terminal: true});
    if (hidden) rl._writeToOutput = s => { if (/\n|\r/.test(s) || s === question) process.stdout.write(s); };
    rl.question(question, a => { rl.close(); if (hidden) process.stdout.write('\n'); resolve(a); });
  });
}
async function newPassword() {
  for (;;) {
    const a = await ask('New password (at least 8 characters, nothing shows as you type): ', true);
    if (a.length < 8) { console.log('Too short. Try again.'); continue; }
    const b = await ask('Type it again: ', true);
    if (a !== b) { console.log('They don\'t match. Try again.'); continue; }
    return a;
  }
}

(async () => {
  const [cmd, user, display] = process.argv.slice(2), db = open();
  if (cmd === 'add-teacher' && user) {
    const key = loginKey(user);
    if (!key) return console.log('The username needs letters or numbers.');
    if (db.prepare('SELECT 1 FROM teachers WHERE login = ?').get(key)) return console.log(`There is already a teacher called ${user}. To change the password: teacher-password ${user}`);
    const pw = await newPassword();
    db.prepare('INSERT INTO teachers (login, name, pass, created) VALUES (?,?,?,?)').run(key, display || user, await hashPassword(pw), Date.now());
    console.log(`Done. Log in on the teacher page with the username "${key}".`);
  } else if (cmd === 'teacher-password' && user) {
    const t = db.prepare('SELECT * FROM teachers WHERE login = ?').get(loginKey(user));
    if (!t) return console.log(`No teacher called ${user}.`);
    db.prepare('UPDATE teachers SET pass = ? WHERE id = ?').run(await hashPassword(await newPassword()), t.id);
    db.prepare("DELETE FROM sessions WHERE role = 'teacher' AND user_id = ?").run(t.id);
    console.log('Done. The teacher is logged out everywhere and can log in with the new password.');
  } else if (cmd === 'list') {
    for (const t of db.prepare('SELECT * FROM teachers ORDER BY login').all()) {
      console.log(`Teacher ${t.login} (${t.name})`);
      for (const c of db.prepare('SELECT classes.name, COUNT(students.id) AS n FROM classes LEFT JOIN students ON students.class_id = classes.id WHERE teacher_id = ? GROUP BY classes.id ORDER BY classes.name').all(t.id))
        console.log(`  ${c.name}: ${c.n} students`);
    }
  } else {
    console.log('Use one of:\n  add-teacher <username> "<Display name>"\n  teacher-password <username>\n  list');
  }
  db.close();
})();
