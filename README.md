# Academic English App

Word games for English and Media. A static site for GitHub Pages: no build step, progress saved in each student's browser.
Fonts are stored in the repo (`fonts/`, `css/fonts.css`), so nothing loads from Google and the site works in mainland China.

## How students move through it

Homepage → **English** or **Chinese version 中文版**

- **English** (`en/`): all in English, starting at B1/B2. Choose a subject → Vocabulary, Grammar or Reading → a game.
  Reading is greyed out on phones ("Only available on desktop devices"); the split is automatic.
- **Chinese version** (`zh/`): vocabulary games with Chinese support. Topics are listed by subject:
  All subjects → Academic English Keywords; Media → Web design, Representation; English Language → Descriptive language.
  Every topic has 8 games: 中文 → English, Match the meaning, Choose the meaning, Type it, True or false, Odd one out, Speed round (60 s), Survival (3 lives).

## Layout

| Path | What it is |
|---|---|
| `index.html`, `css/home.css` | Homepage: choose English or Chinese |
| `en/index.html` | English: choose a subject |
| `en/essentials/`, `en/language/`, `en/media/` | The three English subjects (each page just loads its data and the engine) |
| `en/engine/` | The shared English games: `app.js`, `styles.css`, `fonts.css` |
| `en/data/` | One content file per subject, all in the same format (see the comment at the top of each file) |
| `zh/index.html` | Chinese version: topics as a list, grouped by subject |
| `zh/keywords/`, `zh/data/keywords.js` | Academic English Keywords: 95 general academic words (Essentials, Golden 100 academic set, Year 9 academic words and verbs, Year 8 explaining/analysing words), with Chinese |
| `zh/web-design/`, `zh/representation/`, `zh/data/web-design.js`, `zh/data/representation.js` | Web design and Representation in the same design, built from the y8media and representation word banks (word groups as buttons) |
| `zh/descriptive/` | Descriptive language: the Golden 100 Describing sets (uses `en/data/language.js` and `language-zh.js`) |
| `representation/` | Year 9 Representation app (used by the Chinese version) |
| `y8media/` | Year 8 Website Words app (used by the Chinese version) |
| `english-games/` | Old address: now forwards to `en/language/` |
| `website-portfolio/` | Placeholder |

## English games by category

| Category | Games (shown only when the subject has content for them) |
|---|---|
| Vocabulary | Match the meaning, Synonym groups, Word or meaning |
| Grammar | Fill the gap, Build the sentence, Spot the error, True or false |
| Reading (desktop only) | In your own words, Read it, Answer the question |

Chinese-side topic pages use the same engine with `data-only="zh"`: eight games (see above); `data-odd="pos"` makes Odd one out use parts of speech instead of word groups. To add one, copy `zh/keywords/index.html` and add a bar to `zh/index.html`.

To add a subject: copy `en/media/index.html` into a new folder, point it at a new `en/data/<subject>.js` in the same format, and add a button to `en/index.html`.

Never change a word `id` once students have played: streaks and progress are stored against it.
