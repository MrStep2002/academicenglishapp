# Media Studies Vocab: Year 9 Representation (test version)

A standalone vocabulary and grammar practice app for the Representation unit. It works like the Mandarin app: a static site for GitHub Pages, no build step, progress saved in each student's browser.

## Files

| File | What it does |
|---|---|
| `index.html` | Loads everything |
| **Content** | |
| `data/words.js` | **The word bank.** Set 1 (Essential) is filled in: 75 words |
| `data/practice.js` | **119 grammar gaps, 14 sentence builds, 8 Spot the error texts, 22 Blitz statements** |
| **Engine** | |
| `js/engine.js` | Saved progress, spaced review, sessions |
| `js/app.js` | All screens and games |
| `css/app.css` | Styling (light and dark) |
| `css/fonts.css`, `fonts/` | The two fonts, stored in the app so nothing loads from Google (works in mainland China) |
| `tools/bundle.py` | Makes a single-file version in `dist/` |

## Adding Set 2 and Set 3

Open `data/words.js`, copy any word line, give it a new `id`, and set `lv: "2"` (Developing) or `lv: "3"` (Stretch). Put the word exactly as written into the model sentence (`ex`) so Fill the gap can use it. The set switches on automatically as soon as it has words. New categories go in `GROUPS`.

A word that belongs to two categories is stored once, with `also: ["other-category"]`.

- **Never change an `id`** once students have used the app: progress is stored against it.
- Practice items list the words they use (`words: [...]`), so doing them counts as meeting those words.
- Chinese meanings were drafted by Claude and need checking.

## Publishing on GitHub Pages

Put this folder in a repository and turn on Pages under Settings → Pages.
