# Website Words (Year 8 Web Design)

A vocabulary and grammar game for the Year 8 website design unit. Open `index.html`.
It uses the site's shared fonts (`../css/fonts.css`), so keep this folder inside the repository.

## How it works

- **Home:** choose the Chinese version or the English version.
- **Chinese version:** tick the word chunks to learn, then pick a round:
  - **Timed round:** see the Chinese, choose the English word. 5 seconds per word.
  - **Type it:** read the English meaning, type the word. Hints give the Chinese, then the first letter.
  - **Choose:** see a word (with its Chinese) and choose the meaning, or see a meaning and choose the word.
- **English version** (no Chinese anywhere), filtered by level (Foundation, Core, Stretch or All):
  - **Build the sentence:** colour-coded tiles, with trap tiles that contain grammar mistakes.
  - **Missing words:** choose the word for the gap; most wrong answers are grammar mistakes.
  - **Spot the error:** 36 paragraphs (12 per level), 4 mistakes each, every one explained.
  - **Quick fire vocab:** tick word chunks, then word → meaning (9 s) or meaning → word (6 s).

Progress (the coloured dots on each chunk and the scores on Spot the error) is saved in each
student's browser.

## Content

| File | What it holds |
|---|---|
| `data/words.js` | 173 words in 31 chunks (Level 1 Foundation, Level 2 Core, Level 3 Stretch), each with a meaning and Chinese |
| `data/sentences.js` | 34 Build the sentence items, 50 Missing words items, 36 Spot the error paragraphs |

Spot the error mistakes are written `[wrong|right|why]` inside the paragraph text.

Changes from the original vocabulary bank: opposite pairs are split into two words
(top / bottom → top, bottom), and a few meanings are reworded so they don't contain the answer
(colour, about, visual identity, sans-serif, whitespace, homepage hero, user experience,
responsive design). The Chinese was drafted by Claude: please have it checked.

Never change an `id` once students have played: progress is saved against it.
