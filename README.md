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
  All subjects → Academic English Keywords; Media → Web design, Representation; English Language → Descriptive language.
  Every topic has 8 games: 中文 → English, Match the meaning, Choose the meaning, Type it, True or false, Odd one out, Speed round (60 s), Survival (3 lives).
- **My progress** (`progress/`): linked at the top of both topic lists. Shows the student's level, their topics and the words they have learned (see *Levels and progress* below).

## Layout

| Path | What it is |
|---|---|
| `index.html`, `css/home.css` | Homepage: choose English or Chinese |
| `en/index.html` | English: topics as a list, grouped by subject |
| `progress/index.html` | My progress: overall level, answers, days in a row, a 14-day chart and every topic played. Uses the engine with `data-only="progress"` |
| `en/essentials/`, `en/web-design/`, `en/representation/`, `en/descriptive/` | The English topics (each page loads its data and the engine; `data-sets` picks which sets of a data file it uses) |
| `en/language/`, `en/media/` | Old addresses: forward to Descriptive language and the topic list |
| `en/reading-comprehension/` | English Language → Reading Comprehension: Close reading (`close-reading/`), Big idea (`big-idea/`) and Note taking (`note-taking/`, `data-format="notes"`), with passages from `close-reading.csv`, `big-idea.csv` and `notes.csv` in `en/reading/english-language/`. Computers only |
| `en/reading/` | Reading passages: one CSV per subject and topic (e.g. `english-language/close-reading.csv`, `media/web-design.csv`). A passage can have several questions (`question2`, `correct2` … columns); see `en/reading/README.md`. `tools/check_reading.py` checks them |
| `en/engine/` | The shared English games: `app.js`, `styles.css`, `fonts.css` |
| `en/data/` | One content file per subject, all in the same format (see the comment at the top of each file) |
| `zh/index.html` | Chinese version: topics as a list, grouped by subject |
| `zh/keywords/`, `zh/data/keywords.js` | Academic English Keywords: 95 general academic words (Essentials, Golden 100 academic set, Year 9 academic words and verbs, Year 8 explaining/analysing words), with Chinese |
| `zh/web-design/`, `zh/representation/`, `zh/data/web-design.js`, `zh/data/representation.js` | Web design and Representation in the same design, built from the y8media and representation word banks (word groups as buttons) |
| `zh/descriptive/` | Descriptive language: the Golden 100 Describing sets (uses `en/data/language.js` and `language-zh.js`) |
| `representation/` | Old Year 9 Representation app. Nothing links to it now: its words are in `en/data/media.js` and `zh/data/representation.js` |
| `y8media/` | Old Year 8 Website Words app. Nothing links to it now: its words are in `en/data/media.js` and `zh/data/web-design.js` |
| `english-games/` | Old address: now forwards to `en/descriptive/` |
| `website-portfolio/` | Placeholder |

## English games by category

| Category | Games (shown only when the subject has content for them) |
|---|---|
| Vocabulary | Match the meaning, Synonym groups, Word or meaning |
| Grammar | Fill the gap, Build the sentence, Spot the error, True or false |
| Reading (desktop only) | Read and answer (from the topic's CSV in `en/reading/`), In your own words, Read it, Answer the question |

Chinese-side topic pages use the same engine with `data-only="zh"`: eight games (see above); `data-odd="pos"` makes Odd one out use parts of speech instead of word groups. To add one, copy `zh/keywords/index.html` and add a bar to `zh/index.html`.

To add a subject: copy `en/media/index.html` into a new folder, point it at a new `en/data/<subject>.js` in the same format, and add a button to `en/index.html`.

After changing `en/engine/app.js` or `styles.css`, change the `?v=` number after them in every topic page (one search-and-replace), so students' browsers fetch the new version instead of an old saved copy.

Never change a word `id` once students have played: streaks and progress are stored against it.

## Levels and progress

Every answer in every game is saved in the student's own browser (`localStorage`, key `aea:progress:v1`). Nothing is sent anywhere and there are no accounts yet, so progress stays on one browser on one device.

- **Level codes.** Content is tagged `A1`, `A2`, `B1`, `B2` or `C1`; add `+` for the upper half (`B1+`). Students see names, not codes: Foundation (A1), Foundation+ (A2), Intermediate (B1), Intermediate+ (B2), Advanced (C1); B1+ shows as Intermediate. The names are `LEVEL_NAMES` near the top of `en/engine/app.js` (Chinese beside them on the Chinese side: `LEVEL_ZH`). On English topic pages each set's button also shows its level name, worked out from its `level`, so set names shouldn't use level words (the Chinese Web design groups are Step 1–6 for the same reason).
- **Where levels are set.** Each set in a data file has a `level` (`{id:"s3", name:"…", level:"B2"}`). Any word, gap, sentence or question can have its own `level`, which wins over its set's. Gaps linked to a word (`wid`) use the word's level. Reading passages use the `level` column of their CSV. Anything with no level still plays, but it does not change the student's level.
- **How a student's level is found.** Each topic keeps its own level, starting from the student's level in their other topics (or B1 on the English side and A2 on the Chinese side). It is shown after 10 answers (`CAL`). After that, each answer moves it a little: a right answer to a hard item moves it up more than a right answer to an easy one, and lucky guesses are allowed for: in True or false half of all guesses are right, so a right answer there counts for less (`GUESS`).
- **How work is chosen.** On a topic page, the sets that suit the student's level have a green dot, are chosen for them on their first visit, and "Choose these for me" picks them again. In every game, items near the student's level come first, then words due for review; words they already know come last.
- **Words.** Each word goes new → learning → familiar → known. A right answer only moves a word up after a gap (10 minutes, then 1 day, then 3 days: `WAIT`), so *known* means remembered on different days. A wrong answer moves it back a step.
- **When you add content:** give every new set a `level`, and a `level` to any item that is harder or easier than its set. New reading rows need the `level` column filled in.
