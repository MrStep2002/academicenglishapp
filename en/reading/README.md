# Reading passages: Read and answer

Two games take their passages and questions from **`reading.csv`** in this folder (both computers only):

- **Close reading** (English → English Language → Reading Comprehension): use `topic` = `close-reading`. Passages of about 250 words.
- **Read and answer** (Reading on each topic page): use the topic's name, e.g. `web-design`.
You can fill it in with any spreadsheet (Excel, Numbers, Google Sheets), then save or export it as **CSV (UTF-8)** with the same name.
Nobody needs to touch the code: add rows, save, commit and push, and the new passages appear in the game.

`reading-template.csv` has the column headings and three example rows to copy (one is a 250-word close reading passage).

## Columns (keep these headings, in this order)

| Column | What to put in it | Example |
|---|---|---|
| `id` | A unique code for the row. Never change it once students have played. | `web-001` |
| `topic` | Which game or page it appears in. One of: `close-reading`, `essentials`, `web-design`, `representation`, `descriptive` | `close-reading` |
| `level` | CEFR level, shown above the passage | `B1` |
| `title` | Short title for the passage | `A photographer's homepage` |
| `passage` | The reading text. Leave an empty line between paragraphs (in a spreadsheet: Alt+Enter twice in the cell), or type `||` between paragraphs. | |
| `question` | One question about the passage | `Why did Lena put very little text on her homepage?` |
| `correct` | The right answer | |
| `wrong1`, `wrong2`, `wrong3` | Three wrong answers | |
| `explanation` | Optional. Shown after answering: why the right answer is right, ideally pointing to the line in the passage. | |
| `source` | Optional. Where the passage came from (not shown to students). | |

The game shuffles the four answers, so it doesn't matter that the right one is always in the `correct` column.

## Writing good questions

- **Exactly one answer can be right.** A careful reader should be able to point to the words in the passage that prove it.
- **Keep all four answers about the same length and style.** If the right answer is always the longest or most detailed, students learn to pick the longest.
- **Make the wrong answers tempting.** Use words from the passage in the wrong way, the opposite idea, or something true in general but not stated in the passage.
- **Avoid** "all of the above", "none of the above", and answers that repeat each other.
- **Length:** Close reading passages should be about 250 words. For Read and answer, 80–200 words works well for B1/B2; up to 300 for C1.
- **Commas and quotation marks are fine.** Spreadsheet programs handle them when they save as CSV.

## Checking a file before you push (optional)

From the repository folder, run:

```
python3 tools/check_reading.py
```

It lists rows with missing columns, unknown topics, repeated ids, and answer sets where the right answer stands out by length.

## Viewing it

The passages load when the site is online (GitHub Pages). Opening the HTML file directly from your computer won't load them, because browsers block that.
