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
