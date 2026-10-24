# Academic English App

Word games for English and Media. A static site for GitHub Pages: no build step, progress saved in each student's browser.
Fonts are stored in the repo (`fonts/`, `css/fonts.css`), so nothing loads from Google and the site works in mainland China.

## How students move through it

Homepage → **English** or **Chinese version 中文版**

- **English** (`en/`): all in English, starting at Intermediate (B1). Topics listed by subject, like the Chinese page:
  All subjects → Academic English Essentials; Media → Web design, Representation; English Language → Reading Comprehension, Descriptive language.
  Each topic → Vocabulary, Grammar or Reading → a game.
  Reading is greyed out on phones ("Only available on desktop devices"); the split is automatic.
- **Chinese version** (`zh/`): vocabulary games with Chinese support. Topics are listed by subject:
  All subjects → Academic English Essentials; Media → Web design, Representation; English Language → Descriptive language.
  Every topic has 8 games: 中文 → English, Match the meaning, Choose the meaning, Type it, True or false, Odd one out, Speed round (60 s), Survival (3 lives).
- **My progress** (`progress/`): linked at the top of both topic lists. Shows the student's level, their topics and the words they have learned (see *Levels and progress* below).

## Layout

| Path | What it is |
|---|---|
| `index.html`, `css/home.css` | Homepage: choose English or Chinese |
| `en/index.html` | English: topics as a list, grouped by subject |
| `progress/index.html` | My progress: overall level, answers, days in a row, a 14-day chart and every topic played. Uses the engine with `data-only="progress"` |
| `content/` | **All the content**: one folder per topic, one CSV file per kind of task, a level on every row. See `content/README.md` |
| `en/essentials/`, `en/web-design/`, `en/representation/`, `en/descriptive/` | The English topics (each page loads the engine; `data-content` says which folder in `content/` it uses) |
| `en/language/`, `en/media/` | Old addresses: forward to Descriptive language and the topic list |
| `en/reading-comprehension/` | English Language → Reading Comprehension: Close reading (`close-reading/`), Big idea (`big-idea/`) and Note taking (`note-taking/`, `data-format="notes"`), with passages from `close-reading.csv`, `big-idea.csv` and `notes.csv` in `content/reading-comprehension/`. Computers only |
| `tools/check_content.py` | Checks every content file before you push (`tools/check_reading.py` does the reading passages on their own) |
| `en/engine/` | The shared English games: `app.js`, `styles.css`, `fonts.css` |
| `en/data/`, `zh/data/`, `en/reading/` | The old content files. Nothing uses them now: everything is in `content/` |
| `zh/index.html` | Chinese version: topics as a list, grouped by subject |
| `zh/essentials/` | Academic English Essentials on the Chinese side. It shares `content/essentials/` with the English page, like every other topic (95 words, all with Chinese). `zh/keywords/` is its old address and forwards here |
| `zh/web-design/`, `zh/representation/`, `zh/descriptive/` | The Chinese version of these topics. They share their folder in `content/` with the English pages and use the `zh` column of `words.csv` |
| `representation/` | Old Year 9 Representation app. Nothing links to it now: its words are in `content/representation/` |
| `y8media/` | Old Year 8 Website Words app. Nothing links to it now: its words are in `content/web-design/` |
| `english-games/` | Old address: now forwards to `en/descriptive/` |
| `website-portfolio/` | Placeholder |

## English games by category

| Category | Games (shown only when the subject has content for them) |
|---|---|
| Vocabulary | Match the meaning, Synonym groups, Word or meaning |
| Grammar | Fill the gap, Build the sentence, Spot the error, True or false |
| Reading (desktop only) | Read and answer (`reading.csv`), In your own words (`extracts.csv`), Read it (`reads.csv`), Answer the question (`questions.csv`) |

Chinese-side topic pages use the same engine with `data-only="zh"`: eight games (see above); `data-odd="pos"` makes Odd one out use parts of speech instead of word groups. To add one, copy `zh/essentials/index.html` and add a bar to `zh/index.html`.

To add a topic: make a folder in `content/` from `content/templates/`, copy a topic page (e.g. `en/web-design/`) and change its `data-name`, `data-blurb`, `data-store` and `data-content`, then add a link to `en/index.html`. Details in `content/README.md`.

After changing `en/engine/app.js` or `styles.css`, change the `?v=` number after them in every topic page (one search-and-replace), so students' browsers fetch the new version instead of an old saved copy.

Never change a word `id` once students have played: streaks and progress are stored against it.

## Points

Every right answer earns points; English and Chinese version points are kept apart. The bar at the top of each page shows
**S** (this session), **D** (today), **W** (this week, from Monday) and **T** (total); My progress also shows this month,
a 14-day chart and a "How to earn points" table.

- Points depend on the task and the level of the item (`POINTS` near the top of `en/engine/app.js`):

  | Task | Foundation | Foundation+ | Intermediate | Intermediate+ | Advanced |
  |---|---|---|---|---|---|
  | Word games (match, meaning, Speed round, Survival, Odd one out…) | 1 | 1 | 2 | 2 | 3 |
  | Type it | 2 | 2 | 3 | 3 | 4 |
  | Fill the gap, True or false | 1 | 2 | 2 | 3 | 4 |
  | Build the sentence, Spot the error, In your own words | 2 | 3 | 4 | 5 | 6 |
  | Read it, Answer the question | 3 | 4 | 5 | 6 | 8 |
  | A reading passage (Close reading, Big idea, Note taking, Read and answer) | 8 | 10 | 15 | 18 | 22 |

  A passage's points are shared between its questions; Note taking scores only when all the notes are right.
- Only right answers earn points. Every 5 wrong answers take 1 point off (never below 0 for the day or session).
- Saved in the browser: `localStorage` `aea:points:v1` (points, right and wrong answers per day for each side); the session total is in
  `sessionStorage`. `en/engine/points.js` keeps them and draws the bar; pages without the games load it with `data-side="en"` or `"zh"`.

## Levels and progress

Every answer in every game is saved in the student's own browser (`localStorage`, key `aea:progress:v1`). Without a login, progress stays on that browser. Logged in, it is also saved to the student's account (see *Logins* below).

- **Level codes.** Every row in `content/` has a `level`: a code (`A1`, `A2`, `B1`, `B2`, `C1`; add `+` for the upper half, `B1+`) or a name. Students see names, not codes: Foundation (A1), Foundation+ (A2), Intermediate (B1), Intermediate+ (B2), Advanced (C1); B1+ shows as Intermediate. The names are `LEVEL_NAMES` near the top of `en/engine/app.js` (Chinese beside them on the Chinese side: `LEVEL_ZH`).
- **Level buttons.** Each topic page has one row of level buttons, one for each level with at least 6 items on that page (`MIN_LEVEL`; a smaller level is played with the nearest one). The games use the student's own level; a student can press another level to push themselves, and that choice is kept for the topic until they press "Use my level" or their level reaches it. A green dot marks their level once it is known. Reading Comprehension's level is chosen on its menu page instead. A row with no level plays at every level, but it does not change the student's level.
- **How a student's level is found.** Each topic keeps its own level, starting from the student's level in their other topics (or B1 on the English side and A2 on the Chinese side). It is shown after 10 answers (`CAL`). After that, each answer moves it a little: a right answer to a hard item moves it up more than a right answer to an easy one, and lucky guesses are allowed for: in True or false half of all guesses are right, so a right answer there counts for less (`GUESS`).
- **How work is chosen.** Every game uses only the items at the chosen level. Within it, items nearest the student's level come first (so B1+ before B1 for a strong Intermediate student), then words due for review; words they already know come last.
- **Words.** Each word goes new → learning → familiar → known. A right answer only moves a word up after a gap (10 minutes, then 1 day, then 3 days: `WAIT`), so *known* means remembered on different days. A wrong answer moves it back a step.
- **When you add content:** fill in the `level` of every row, and run `python3 tools/check_content.py` to see how much each level has.

## Logins

Students can log in with a fun name and password from their teacher (**Log in** button next to the points bar, or `login/`).
Their progress then follows them to any device. Teachers make classes and logins, print login cards and see each student's
points, level and last activity at `teacher/`. Without a login everything works as before.

| Path | What it is |
|---|---|
| `en/engine/account.js` | The Log in button and saving to the account. Loaded on every page after `points.js` |
| `login/index.html` | Students log in and out |
| `teacher/index.html` | The teacher page |
| `server/` | The login server at `api.academicenglishapp.com` (Tencent Cloud, Hong Kong). Setup, updates and teacher logins: `server/README.md` |

Never rename the `aea:…` keys the games save in the browser: accounts store progress under the same names.

