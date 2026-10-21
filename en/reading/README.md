# Reading passages

The reading games load their passages from CSV files in this folder: **one file per subject and topic**.
Fill them in with any spreadsheet program (save as CSV, UTF-8) or have them written to the brief
"Reading Passages: Brief for the Writing AI". Add rows, save, commit and push: no code changes needed.

| File | Game |
|---|---|
| `english-language/close-reading.csv` | English Language → Reading Comprehension → Close reading |
| `english-language/descriptive.csv` | Descriptive language → Reading → Read and answer |
| `media/web-design.csv` | Web design → Reading → Read and answer |
| `media/representation.csv` | Representation → Reading → Read and answer |
| `essentials/essentials.csv` | Academic English Essentials → Reading → Read and answer |

A new subject gets its own folder (e.g. `history/`). Its page points at its file with `data-reading` (see any topic page).

## Columns

`id,level,title,passage,question,correct,wrong1,wrong2,wrong3,explanation,source`

A passage can have more questions. A second question uses six more columns after `source`:

`question2,correct2,wrong1_2,wrong2_2,wrong3_2,explanation2`

A third would add `question3,correct3,wrong1_3,wrong2_3,wrong3_3,explanation3`, and so on. The questions are asked
in order, with the passage still on screen. Leave the extra columns empty for a passage with one question.
Every file here already has the columns for a second question.

- `id`: unique, never reused (e.g. `close-001`).
- `level`: `A1`, `A2`, `B1`, `B2` or `C1`. Shown to students as Foundation, Foundation+, Intermediate,
  Intermediate+ and Advanced (the names are in `LEVEL_NAMES` in `en/engine/app.js`). The site gives students the
  passages nearest their level first, and their answers update their level.
- `passage`: paragraphs separated by a blank line inside the cell, or by ` || `.
- `correct` + `wrong1`–`wrong3`: shuffled on screen. Keep all four about the same length.
- `explanation` (optional) is shown after answering; `source` (optional) is never shown.

`reading-template.csv` has the headings and one complete example with two questions.

## Checking before you push (optional)

```
python3 tools/check_reading.py            # checks every CSV in en/reading
python3 tools/check_reading.py en/reading/media/web-design.csv
```

It lists empty cells, unknown levels, repeated ids and passage lengths, and how often the right answer is the longest.

Passages load when the site is online (GitHub Pages), not from an HTML file opened directly on your computer.
