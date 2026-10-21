# Website Words (Year 8 Web Design)

A vocabulary and grammar game for the Year 8 website design unit. Open `index.html`.
It uses the site's shared fonts (`../css/fonts.css`), so keep this folder inside the repository.

## How it works

Every game is endless. It deals every item once in a random order (with the answers in a new
random order each time), then reshuffles and goes round again, so nothing repeats until
everything has had a turn. A missed item gets one second go four cards later. The × button
shows a summary with "Keep playing", "Practise the missed ones" and "Finish".

- **Home:** choose the Chinese version or the English version.
- **Chinese version:** tick the word chunks to learn, then pick a round:
  - **Timed round:** see the Chinese, choose the English word. 5 seconds per word.
  - **Type it:** read the English meaning, type the word. Hints give the Chinese, then the first letter.
  - **Choose:** see a word (with its Chinese) and choose the meaning, or see a meaning and choose the word.
- **English version** (no Chinese anywhere). Sentence games are filtered by level (Foundation, Core, Stretch or All):
  - **Build the sentence:** colour-coded tiles, with trap tiles that contain grammar mistakes.
    Each sentence is labelled Simple sentence, Two ideas joined or Complex sentence.
  - **Missing words:** choose the word for the gap; most wrong answers are grammar mistakes.
    The feedback names the grammar point.
  - **Spot the error:** paragraphs with 4 mistakes each, every one explained.
  - **Timed vocab:** tick word chunks, then word → meaning or meaning → word.
    10 seconds per word, 7 seconds after 10 right answers, 5 seconds after 20.

Progress (the coloured dots on each chunk and the scores on Spot the error) is saved in each
student's browser.

## Content

| File | What it holds |
|---|---|
| `data/words.js` | 173 words in 31 chunks (Level 1 Foundation, Level 2 Core, Level 3 Stretch), each with a meaning and Chinese |
| `data/sentences.js` | 120 Build the sentence items, 152 Missing words items, 48 Spot the error paragraphs (about 40, 50 and 16 per level) |

- Build the sentence: `cx` is the sentence type (1 simple, 2 two ideas joined, 3 complex). `alt` lists other accepted word orders.
- Missing words: `pt` is the grammar point shown after answering.
- Spot the error: mistakes are written `[wrong|right|why]` inside the paragraph text.

Changes from the original vocabulary bank: opposite pairs are split into two words
(top / bottom → top, bottom), and a few meanings are reworded so they don't contain the answer
(colour, about, visual identity, sans-serif, whitespace, homepage hero, user experience,
responsive design). The Chinese was drafted by Claude: please have it checked.

Never change an `id` once students have played: progress is saved against it.
