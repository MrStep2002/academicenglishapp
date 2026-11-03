# The login server

Students log in with a fun name and a password from their teacher. Their progress (everything the games save in the
browser) is then also saved on this server, so it follows them to any device. Teachers make classes and logins, print
login cards and see each student's points, level and last activity on the teacher page (`teacher/`).

The website itself stays on GitHub Pages. Only `api.academicenglishapp.com` points to the server:
Tencent Cloud Lighthouse, Hong Kong, Ubuntu (instance `aea-server`).

## Files

| File | What it does |
|---|---|
| `server.js` | The login program (no packages to install: plain Node.js 22.13+ with its built-in SQLite) |
| `db.js` | The database: one file, `/var/lib/aea/aea.db`; passwords stored only as scrypt hashes |
| `merge.js` | How the server's copy and a browser's copy of a student's progress are combined (the bigger record wins) |
| `names.js` | Fun names ("Brave Panda") and easy passwords ("river472") for new accounts |
| `admin.js` | Teacher logins, from the server terminal (`aea-admin`, below) |
| `install.sh`, `update.sh` | Set up / update everything on the server |
| `aea-api.service`, `Caddyfile` | The program as a service, and Caddy (HTTPS) in front of it |

On the website: `en/engine/account.js` (the Log in button and saving to the account, loaded on every page),
`login/index.html` (students log in and out), `teacher/index.html` (the teacher page).

## First setup (once)

In the server terminal (Lighthouse console → **Log in**):

```
sudo git clone https://github.com/MrStep2002/academicenglishapp.git /opt/aea
sudo bash /opt/aea/server/install.sh
sudo aea-admin add-teacher yourusername "Your Name"
```

The last line asks for your teacher password twice (nothing shows while you type).
Then open **academicenglishapp.com/teacher** and log in.

## After pushing changes to GitHub

Changes to the website pages go live through GitHub Pages as usual. If anything in `server/` changed, also run:

```
sudo bash /opt/aea/server/update.sh
```

## Jobs in the server terminal

| Command | What it does |
|---|---|
| `sudo aea-admin add-teacher <username> "<Name>"` | Another teacher login |
| `sudo aea-admin teacher-password <username>` | A forgotten teacher password |
| `sudo aea-admin list` | Teachers, classes and how many students |
| `sudo systemctl status aea-api` | Is the program running? |
| `sudo journalctl -u aea-api -n 50 --no-pager` | Its latest messages (errors show here) |

## How saving works

- Without a login nothing changes: progress stays in that browser, exactly as before.
- Logged in, the page saves to the account when it opens, every 15 seconds if something changed, and when it is left.
  The server combines its copy with the browser's (`merge.js`): topics keep the record with more answers, words their
  higher stage, points and the Daily Circuit the busier day; settings such as a chosen level take the browser's copy.
- Logging in on a device with progress saved without a login asks whether to add it to the account. "No" puts it aside;
  it comes back when the student logs out.
- Logging out removes the student's progress from that device (it is safe on the server). On shared computers students
  should always log out.
- A new password from the teacher logs the student out everywhere ("Log in again" button); their progress is kept.

## Class games (29 Oct 2026)

- On the teacher page, a class has two tabs. **Students**: each student's **Version** (English or 中文版) and **Lowest level**
  (or "No minimum"), saved straight away, or for everyone at once. **Class games**: set a game (subject, minutes,
  score needed, optional due time), then open it to watch the class play (the page updates every 5 seconds), change
  the score needed or the due time, close it (students stop seeing it; scores kept) or delete it.
- Students see the game as a card at the top of the topic lists (`en/engine/classgame.js`) and play it on the subject's
  page for their version (`#class-<id>`, run by `en/engine/app.js`): the Daily Circuit's five stations, each a fifth of
  the time, at their own level but never below their lowest level. Score: +1 right, -1 wrong, never below 0.
- The clock is the server's: it starts at Start and runs until the time is up, even if the student leaves. Coming back
  carries on with the time left. Scores are sent every few seconds and at the end (20 seconds' grace after the time).
- Below the score needed, a student can play again (a new go); the go that passes is their score. Passed or started
  after the due time: marked late.
- Tables: `games` and `attempts` (one row per go); `students` gained `side` and `min_level`. Added automatically when the
  updated server starts, so `update.sh` is all that's needed.
- Subjects are listed in `SUBJECTS` in `server.js` (those with an English and a Chinese page).

## Students in more than one class (30 Oct 2026)

- One account can be in several classes (e.g. a student taught for English and for Media): the same fun name, password,
  login card, points, words, **Version** and **Lowest level** in every class. Each class table lists them ("also in …"),
  and they see the class games of every class they are in (each card names the class when they are in more than one).
- Teacher page, on a class: **+ From your other classes** (tick students, or everyone in a class; a name search). A new
  class can also start with **No new logins** and be filled this way. **Remove from class** shows only for a student who
  is in another class too: the account and progress stay, and their scores in that class's games are kept.
  Setting Version or Lowest level for everyone in a class changes it for those students in their other classes too.
- Table: `class_members` (class, student). Filled from `students.class_id` automatically when the updated server
  starts, so `update.sh` is all that's needed. `students.class_id` stays as the class the account was made in (moved to
  another of their classes if they are removed from it).

## Reports (31 Oct 2026)

- After a wrong answer, the games show a small **Report** button next to Next. The student chooses **My answer should be
  right**, **The question doesn't make sense** or **Something else**, and can add a comment. No login needed. Not in Match
  the meaning, Speed round, Survival or the arcade games (no wrong-answer card there).
- Limits: 5 reports a day for each device and for each logged-in student, 300 a day from one network address (a whole
  school shares one). One report per question per device or student until the teacher decides. No limit for a teacher:
  a report sent from a browser that is logged in on the teacher page is marked "You".
- Teacher page → **Reports** (`#/reports`): questions grouped, most-reported first, with what the student saw, what they
  chose, the reasons, comments and who sent them. **Keep**: it stays in the games (a new report brings it back to the
  list, marked "kept before"). **Remove**: every game stops showing it straight away (`GET /api/hidden`, read by
  `en/engine/app.js` when a page opens; a page that can't reach the server uses the last list it saw). **Put back**
  undoes a removal. **Download as spreadsheet**: everything as a CSV file that opens in Excel.
- The content files are not changed: the Removed list is the list of rows to fix or delete in `content/`. A removed
  question that is part of a passage or text (ids like `rep-read-004#2`) hides the whole passage.
- Tables: `reports` (one row per report; `ip` is a hash, only used for the limit) and `report_items` (the teacher's
  decision on each question). Added automatically when the updated server starts, so `update.sh` is all that's needed.

## Suggestions box (3 Nov 2026)

- A student asked for one. At the bottom of both topic lists (`en/index.html`, `zh/index.html`; the box is filled in by
  `en/engine/suggest.js`) a logged-in student chooses what the idea is about (**A new game**, **A new topic or words**,
  **Something isn't working**, **Something else**) and writes it (up to 500 characters). Not logged in: the button goes
  to the login page. The box tells the student their teacher will see their fun name.
- Limit: 3 a day for each student. A browser logged in on the teacher page can send one too, to try it out (shown as
  "You", no limit).
- Teacher page → **Suggestions** (`#/suggestions`), next to Reports, with the number of new ones: **New** (oldest first)
  and **Done** (the last 300). Each shows the student's fun name and classes, when, and whether it came from the
  Chinese version. **Done** / **Move back to New**, **Delete**, **Download as spreadsheet**.
- Routes: `POST /api/suggest {kind, text, side, page}` (student or teacher login), `GET /api/teacher/suggestions`,
  `POST /api/teacher/suggestions/:id/status {status: new|done}`, `POST /api/teacher/suggestions/:id/delete`.
- Table: `suggestions`. Added automatically when the updated server starts, so `update.sh` is all that's needed.

## Data and backups

- Database: `/var/lib/aea/aea.db`. A copy is made every day in `/var/lib/aea/backups/` (the last 14 are kept).
- Stored per student: the fun name, the class, a password hash, and the progress the games save. No real names, no emails.
- Logins last 180 days on a device for students, 30 days for teachers.
- Wrong passwords: 10 tries per name (and 100 per network address) in 15 minutes, then a 15-minute wait.

## Testing on your own computer

```
DB_PATH=./test.db PORT=3000 node server/server.js
python3 -m http.server 8000        # in the site's folder, in a second terminal
```

Make a teacher with `DB_PATH=./test.db node server/admin.js add-teacher test "Test"`, open
`http://localhost:8000/teacher/`, and in the browser console run `localStorage.setItem('aea:api', 'http://localhost:3000')`
(remove it afterwards with `localStorage.removeItem('aea:api')`). Don't commit `test.db`.
