# Academic English App

Word games for English and Media. A static site for GitHub Pages: no build step, progress saved in each student's browser.
Fonts are stored in the repo (`fonts/`, `css/fonts.css`), so nothing loads from Google and the site works in mainland China.

## How students move through it

Homepage (`index.html`, the landing page since 8 Nov 2026) → **Log in** or **Play without logging in** → the English home (`en/index.html`).
Students who already play there (logged in, chose to play without logging in, or have played before) skip the landing page and go
straight to their home: the side chosen in the language menu, or else the side they played last. The **language menu** (top of the
sidebar: English / 中文版) switches side. The landing page still shows when a student comes from another page of the site (the
"← 选择语言" link on the Chinese pages) or with `?stay` in the address.

- **English** (`en/`): all in English, starting at Intermediate (B1). Topics listed by subject, like the Chinese page:
  All subjects → Academic English Essentials; Media → Web design, Representation; English Language → Reading Comprehension, Descriptive language.
  Each topic → Vocabulary, Grammar or Reading → a game.
  Reading is greyed out on phones ("Only available on desktop devices"); the split is automatic.
- **Chinese version** (`zh/`): vocabulary games with Chinese support. Topics are listed by subject:
  All subjects → Academic English Essentials; Media → Web design, Representation; English Language → Descriptive language.
  Every topic has 8 word games: 中文 → English, Match the meaning, Choose the meaning, Type it, True or false, Odd one out, Speed round (60 s), Survival (3 lives),
  plus Build the sentence 连词成句 (see the sentence in Chinese, build it in English: `builds.csv`, its `zh` column) where a topic has sentences with Chinese.
- **My progress** (`progress/`): linked at the top of both topic lists. Shows the student's level, their topics and the words they have learned (see *Levels and progress* below).

## Layout

| Path | What it is |
|---|---|
| `index.html` | Landing page (logged out): what the site is, Log in, Play without logging in, the Daily Circuit, every subject. A few lines in its `<head>` send students who already play straight to their home |
| `en/index.html` | English home: greeting and level, class games, the Daily Circuit (this week's circuits), this week's points, Your subjects (switched on), More subjects (with the "I study this" switches), Got an idea? |
| `css/site.css` | The new look (8 Nov 2026): the sidebar and top bar, the landing page and the English home. Colours as `--sh-…` at the top (light and dark) |
| `en/engine/subjects.js` | **The English subject list**: the sidebar, the Subjects menu, the home page, the landing page and the Site content pages all read it |
| `en/engine/shell.js` | The sidebar and the top bar round every English page (see *The site shell* below) |
| `en/engine/home.js` | Draws the landing page and the English home from the subject list and the student's progress |
| `css/home.css` | The older look: the Chinese pages, the Reading Comprehension and Daily Circuit pages, Maths |
| `progress/index.html` | My progress: overall level, answers, days in a row, a 14-day chart and every topic played. Uses the engine with `data-only="progress"` |
| `content/` | **All the content**: one folder per topic, one CSV file per kind of task, a level on every row. See `content/README.md` |
| `en/essentials/`, `en/web-design/`, `en/representation/`, `en/descriptive/` | The English topics (each page loads the engine; `data-content` says which folder in `content/` it uses) |
| `en/language/`, `en/media/` | Old addresses: forward to Descriptive language and the topic list |
| `en/reading-comprehension/` | English Language → Reading Comprehension: Close reading (`close-reading/`), Big idea (`big-idea/`) and Note taking (`note-taking/`, `data-format="notes"`), with passages from `close-reading.csv`, `big-idea.csv` and `notes.csv` in `content/reading-comprehension/`. Computers only |
| `tools/check_content.py` | Checks every content file before you push (`tools/check_reading.py` does the reading passages on their own) |
| `en/engine/` | The shared English games: `app.js`, `styles.css`, `fonts.css` |
| `en/data/`, `zh/data/`, `en/reading/` | The old content files. Nothing uses them now: everything is in `content/` |
| `zh/index.html` | Chinese version home (8 Nov 2026): the English home in Chinese (greeting and level, class games, the Daily Circuit, this week's points, Your subjects, More subjects, Got an idea?), drawn by `en/engine/home.js` from the Chinese subject list (`ZH_SUBJECTS` in `en/engine/subjects.js`) |
| `zh/essentials/` | Academic English Essentials on the Chinese side. It shares `content/essentials/` with the English page, like every other topic (95 words, all with Chinese). `zh/keywords/` is its old address and forwards here |
| `zh/web-design/`, `zh/representation/`, `zh/descriptive/` | The Chinese version of these topics. They share their folder in `content/` with the English pages and use the `zh` column of `words.csv` |
| `representation/` | Old Year 9 Representation app. Nothing links to it now: its words are in `content/representation/` |
| `y8media/` | Old Year 8 Website Words app. Nothing links to it now: its words are in `content/web-design/` |
| `english-games/` | Old address: now forwards to `en/descriptive/` |
| `website-portfolio/` | Placeholder |

## The site shell (8 Nov 2026)

Every English student page has the same sidebar and top bar, added by `en/engine/shell.js` (styles in `css/site.css`). It wraps
what the page already has, so the games and pages underneath are unchanged.

- **Sidebar**: the logo, the language menu (English / 中文版), Home, Daily Circuit, My progress; YOUR CLASSES; MY SUBJECTS (Essentials
  and the subjects switched on, with the current one highlighted); EXPLORE (Big Ideas, The Future); ABOUT (Who are we?, For teachers,
  Got an idea?). Your classes, Big Ideas, The Future and Who are we? are greyed ("coming soon") until they exist: they are the
  `soon(…)` lines in `sideHtml()` in shell.js.
- **Top bar**: Subjects ▾ (areas on the left, their subjects on the right, with the student's level where it has been found), then the
  days in a row, the points (Day · Week · Total) and Log in or the student's name.
- **Phones** (under 860px wide): the sidebar becomes a menu behind the ☰ button; the points and name move into it.
- The page's own points bar, Log in button and mouse logo are hidden. Pages drawn by the game engine (the topic pages,
  their games, Reading Comprehension, Listening, My progress) show the path in the top bar instead of a back link
  (Home / Descriptive language / Fill the gap): app.js passes it to `AEA_SHELL.crumbs()`. Other pages keep their back link.
- Each English page loads, after `account.js`: `<script src="…/en/engine/subjects.js?v=…"></script>` and
  `<script src="…/en/engine/shell.js?v=…"></script>`, with `<link rel="stylesheet" href="…/css/site.css?v=…">` in the `<head>`.
  On My progress, Maths and Log in the shell has `data-auto-side`: opened from the Chinese side (`?from=zh`, a link from a
  `zh/` page, or Maths opened from the Chinese side in this tab), they get the Chinese shell. Maths uses `data-side="maths"` for its points.
- "Continue: …" on the home page: the topic pages remember the last game opened on each topic (`aea:lastgame:v1`, `lastGame()` in app.js).
- **Game pages** (stage 2, 8 Nov 2026; `NEW_UI` in app.js, section 4 of `css/site.css`): the game's column, its name and
  how to play, then the game on the left and a side panel on the right: This round (or This game), any settings (Listen,
  Tell me how many), Playing at (the level, with Change), the keys (`KEY_HELP` in app.js: keep it in step with a game's keys)
  and More in this subject (not in the Daily Circuit or a class game). Close reading and Big idea: the passage on the left,
  every question on the right; choose the answers, then Confirm, then Next passage (`passageBoth()`); Note taking the same
  way. On phones the score is one line under the name and the keys and More are left out.
- **Subject pages** (stage 3, 8 Nov 2026; `topicPage()` in app.js, section 5 of `css/site.css`): the area and name, the
  "I study this" switch (the same `aea:studying:v1` as the home page and the Daily Circuit; Essentials says "Always in the
  Daily Circuit"), the topics on science pages, the level buttons and the student's level; then **Words at this level**:
  word cards to turn over (the word and part of speech on the front, the meaning, an example and similar words on the back,
  buttons to hear the word and the example in the browser's voice, Previous / Next / Shuffle, ← → keys), with **Your
  words** beside them (known, familiar, learning and new at this level); then the game columns and the Games row. The word
  list (#words), My progress, Reading Comprehension, the Daily Circuit page and the login page have the new look too.
  Login has the shell with `data-auto-side` (a student coming from the Chinese version gets the Chinese shell, and the page in both languages as before).
- **The Chinese version** (stage 4, 8 Nov 2026; section 6 of `css/site.css`): the same shell and pages, in Chinese, with fewer
  subjects. The `zh/` pages load the shell with `data-side="zh"`: the sidebar, top bar and Subjects menu are in Chinese and
  list the Chinese version's subjects (`ZH_SUBJECTS` in `subjects.js`: add a Chinese topic there), Home is `zh/index.html`, the
  Daily Circuit is `zh/circuit/`, My progress opens with `?from=zh`. Every label is written in both languages, each in its own
  span (`t-en` / `t-zh`; `T(en, zh)` in app.js, `L(en, zh)` in shell.js and home.js), and the EN / 中文 switch beside the points
  (account.js) shows one: Chinese until the student picks EN. The words being learned always show.
  The Chinese subject page (`zhTopicPage()` in app.js) is the English one in Chinese: area and name, 我在学 switch, the topics on
  science pages and the student's level (no level buttons: on the Chinese side the level moves by itself, `zhPoolWords()`), word
  cards with the Chinese on the back, Your words, the science page's own games (练习), then the three columns of three
  (词汇, 句子, 游戏: `ZH_COLS`). The games use the same layout and side panel as the English ones (`zhShell()` → `gameLayout()`;
  the keys in `ZH_KEYS`, More from `zhMoreBox()`). The language menu in the sidebar moves between the two versions (`aea:lang`).
- The teacher page does not have the shell.
- After changing `shell.js`, `subjects.js`, `home.js`, `account.js`, `app.js` or `site.css`, change the `?v=` number after them on the pages that load them (both versions).

## English games by category

| Category | Games (shown only when the subject has content for them) |
|---|---|
| Vocabulary | Match the meaning (meanings and synonym groups mixed, 31 Oct), Word or meaning, True or false |
| Grammar | Fill the gap, Grammar Check (`right-wrong.csv`; called SPAG: Right or Wrong until 8 Nov), Spot the error (back in Grammar 31 Oct). Build the sentence moved to the Chinese version (25 Oct), and is back in Reading on the English side too (31 Oct) |
| Reading (desktop only; Build the sentence also on phones) | Build the sentence (`builds.csv`, back on the English side 31 Oct), In your own words (`extracts.csv`), Complete the text (`reads.csv`), Answer the question (`questions.csv`). Longer passages are on the Reading Comprehension pages (Close reading replaced Read and answer, 25 Oct) |
| Games (the row across the bottom of a topic page) | General knowledge (`knowledge.csv`), Save the mouse, Word search (7 Nov 2026: the topic's words hidden in a square of letters; the list shows the words, or their meanings / their Chinese; size and directions follow the level; `playWordSearch` in app.js), Whack-a-word, Word Invaders, Word Snake. Word search is also on the Chinese topic pages (Games column, where "Wordsearch: coming soon" was) |
| Arcade (not on the menus yet) | Word Snake (`#play-snake`): steer into the word that matches the meaning. Whack-a-word (`#play-whack`): tap the word that matches the meaning as words pop up. Word Invaders (`#play-invaders`): fire at the right word before the formation lands. One minute each, using `words.csv`. Open one by adding its `#play-…` to an English topic page's address. Word Invaders and Whack-a-word take turns as the middle station of the Daily Circuit (`CIRCUIT_ARCADE` in app.js); Word Snake is left out for now |

Chinese-side topic pages use the same engine with `data-only="zh"`: eight games (see above); `data-odd="pos"` makes Odd one out use parts of speech instead of word groups. To add one, copy `zh/essentials/index.html` (change its `data-name`, `data-store` and `data-content`) and add one line for it to `ZH_SUBJECTS` in `en/engine/subjects.js` (since 8 Nov 2026 the Chinese home is drawn from that list).

To add a topic: make a folder in `content/` from `content/templates/`, copy a topic page (e.g. `en/web-design/`) and change its `data-name`, `data-blurb`, `data-store` and `data-content`, then add one line for it to `en/engine/subjects.js` (its address, name and area). Nothing else needs changing: the sidebar, the Subjects menu, the home page, the landing page and the Site content pages all read that list. New topic pages need the shell too (copy the `site.css`, `subjects.js` and `shell.js` lines from another topic page). Details in `content/README.md`.

Topic page layout: `data-layout="compact"` on a topic page (all four English topics since 24 Oct) gives the newer menu: the title, the
level buttons, "Your level: …" with the level bar as the divider, then every game listed in three columns (Vocabulary, Grammar,
Reading), with no category page in between. Pages without it keep the older layout. To switch a page over, add the attribute.

Site content page: `status/index.html` (academicenglishapp.com/status/, not linked from anywhere, not indexed by search engines). Each time it loads it finds the English subjects from `en/engine/subjects.js` (the Chinese ones from `zh/index.html`), reads their CSV files and the Reading Comprehension files, and shows every game each subject could have with its number of items at each level and a status (All levels / Some levels / None yet / Switched off / Needs Chinese). It counts; it does not check: use `tools/check_content.py` for mistakes. If a game is added to the engine, add it to `SECTIONS` in that page too.

Daily Circuit (English side, 25 Oct): five stations, 4 minutes: a short game (45 s), a long game (45 s), an arcade game (60 s), a long game (45 s), a short game (45 s). Each game in `GAMES` has `form: 'short'` or `'long'` (change it there to move a game); a station picks a game of its kind from any of the student's subjects at their level, never the same game twice when there is a choice. No long game at their level in any subject (e.g. on a phone, where reading games are off): a short game instead. Time up in the middle of a long game: what the student has done is marked (Spot the error: each mistake found counts at the station, without counting against their level; Complete the text: the filled gaps are marked). The Chinese side keeps five one-minute stations. Plan in `en/engine/circuit.js` (`EN_PLAN`).

Switching a game off for one topic: add e.g. `data-hide="tf"` to the topic page's `<div id="app">` (the game's key; several keys with spaces between them). The game disappears from that page's menu and its Daily Circuit, and its content stays in the CSV files. `data-hide="syn"` keeps Match the meaning to meanings only (no synonym groups); Essentials uses it. Keys: match, syn, meaning, gap, error, tf, rw, passage, own, read, question. Academic English Essentials hides Synonym groups (`data-hide="syn"`, 25 Oct).

After changing `en/engine/app.js` or `styles.css`, change the `?v=` number after them in every topic page (one search-and-replace), so students' browsers fetch the new version instead of an old saved copy.

Never change a word `id` once students have played: streaks and progress are stored against it.

## Points

Every right answer earns points; English and Chinese version points are kept apart. The bar at the top of each page shows
**Day**, **Week** (from Monday, with the weekly target) and **Total**, then the Log in button or the student's name (which opens My progress,
where they can also log out). My progress also shows this session, this month,
a 14-day chart and a "How to earn points" table.

- Points depend on the task and the level of the item (`POINTS` near the top of `en/engine/app.js`):

  | Task | Foundation | Foundation+ | Intermediate | Intermediate+ | Advanced |
  |---|---|---|---|---|---|
  | Word games (match, meaning, Speed round, Survival, Odd one out…) | 1 | 1 | 2 | 2 | 3 |
  | Type it | 2 | 2 | 3 | 3 | 4 |
  | Fill the gap, True or false | 1 | 2 | 2 | 3 | 4 |
  | Build the sentence, Spot the error, In your own words | 2 | 3 | 4 | 5 | 6 |
  | Read it, Answer the question | 3 | 4 | 5 | 6 | 8 |
  | A reading passage (Close reading, Big idea, Note taking) | 8 | 10 | 15 | 18 | 22 |

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

