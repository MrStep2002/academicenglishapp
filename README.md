# Media Studies Vocab

Vocabulary and grammar practice for Year 9 Media Studies. A static site for GitHub Pages: no build step, progress saved in each student's browser.

## Layout

| Path | What it is |
|---|---|
| `index.html`, `css/home.css` | The homepage with the two unit buttons |
| `images/header.jpg` | The header image (about 1600 × 600) |
| `css/fonts.css`, `fonts/` | Fonts shared by every page, stored here so nothing loads from Google |
| `representation/` | Unit 1: the Representation vocab game |
| `website-portfolio/` | Unit 2: placeholder until its game is built |
| `tools/bundle.py` | Makes a single-file preview of the Representation game |

## Representation content

| File | What it holds |
|---|---|
| `representation/data/words.js` | The word bank (Set 1: 75 words). Add Set 2 and 3 words here with `lv: "2"` or `lv: "3"` |
| `representation/data/practice.js` | Grammar gaps, Build the sentence, Spot the error, Blitz statements |
| `representation/data/zh.js` | Chinese versions of every explanation (drafted; please have them checked) |

Never change an `id` once students have used the app: progress is stored against it.
