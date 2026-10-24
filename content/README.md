# Content

Every game on the site takes its content from the CSV files in this folder: **one folder per topic, one file
per kind of task**. Add rows, save, commit and push. No code changes are needed.

Every row has an **id** and a **level**. The games use the level to give each student work at their level.

## Folders

| Folder | Used by |
|---|---|
| `descriptive/` | English → Descriptive language, and Chinese version → Descriptive language |
| `essentials/` | English → Academic English Essentials, and Chinese version → Academic English Essentials |
| `representation/` | English → Representation, and Chinese version → Representation |
| `web-design/` | English → Web design, and Chinese version → Web design |
| `keywords/` | Not used any more: its words were merged into `essentials/` on 24 Oct 2026 |
| `reading-comprehension/` | English → Reading Comprehension: `close-reading.csv`, `big-idea.csv`, `notes.csv` |
| `templates/` | The headings and one example row for every kind of file |

Every topic folder has the same ten files. A file with only its heading row is simply empty for now.
The Chinese version uses only `words.csv` (and its `zh` column).

| File | Games |
|---|---|
| `words.csv` | Match the meaning, Synonym groups, Word or meaning, and every Chinese-version game |
| `gaps.csv` | Fill the gap |
| `builds.csv` | Build the sentence |
| `errors.csv` | Spot the error |
| `tf.csv` | True or false |
| `right-wrong.csv` | Right or wrong (is the sentence right, or does it have a mistake?) |
| `reads.csv` | Complete the text (a short text whose key words are gaps, with a word bank) |
| `questions.csv` | Answer the question (exam command words) |
| `extracts.csv` | In your own words |
| `reading.csv` | Read and answer (a longer passage with one or more questions) |

## Levels

The `level` column takes a name or a code:

| Name (what students see) | Code |
|---|---|
| Foundation | `A1` |
| Foundation+ | `A2` |
| Intermediate | `B1` |
| Intermediate+ | `B2` |
| Advanced | `C1` |

A `+` on a code (`A2+`, `B1+`) means the harder half of that level. Students still see the level's name
(B1+ is Intermediate), but the games use the difference when they work out a student's level.

On each topic page there is one row of level buttons. The games start at the student's own level; a student can
choose another level to push themselves.

- A level gets its own button once it has **at least 6 items** on that page (words, sentences, passages…).
  With fewer, its items are played with the nearest level, so nothing is left out.
- A game with nothing at the chosen level says "None at this level yet".
- A row with no level, or a level the site doesn't recognise, is used at every level. The checker (below) lists these.

## Rules for every file

- The first row is the headings, spelt exactly as below. The order of the columns doesn't matter.
- Save as **CSV UTF-8**. Wrap any cell that has a comma, a quote mark or a line break in double quotes,
  and double any quote mark inside it: `"She said ""no"", then left."`
- **id**: unique in its file. Never change or reuse a **word's** id: students' progress is saved against it.
  Word ids must also be unique across the whole site. A short readable code is best, e.g. `web-171`, `desc-gap-241`.
- Explanations may use `<b>bold</b>` and `<i>italic</i>`. Nothing else is turned into formatting.
- Where a column refers to a word (`word`, `similar`, `accept`, `[[…]]` in reads), write the word as it appears in
  `words.csv` (or its id). It must be in the same folder's `words.csv`.
- Any row the games cannot use is skipped, and the browser's console says why. Run the checker to see them all at once.

## The columns

Required columns are in **bold**.

### words.csv

`id,level,word,pos,meaning,example,synonyms,zh,group,similar,accept,note`

| Column | |
|---|---|
| **id**, **level** | As above. |
| **word** | The word or phrase. `/` gives alternatives Type it accepts: `colour / color`. |
| pos | Part of speech: noun, verb, adjective… (Word or meaning prefers wrong answers with the same pos). |
| **meaning** | A short, clear meaning in English. |
| example | An example sentence. |
| synonyms | Words with a similar meaning, separated by `;`. Words with synonyms appear in Synonym groups. |
| zh | The Chinese meaning. Needed for the Chinese version (words without it are left out there). |
| group | A word group, e.g. `Command words 指令词`. Odd one out uses it (three from one group, one from another). |
| similar | Words in this file so close in meaning that they must never be wrong answers for this word, separated by `;`. |
| accept | Words Type it also accepts for this meaning, separated by `;`. |
| note | For teachers. Not shown. |

### gaps.csv (Fill the gap)

`id,level,sentence,answer,wrong1,wrong2,wrong3,explanation,focus,word`

- **sentence** has `___` (three underscores) where the gap is.
- **answer** fits the gap; **wrong1** plus up to two more wrong answers (`wrong2`, `wrong3`) don't.
- explanation: why the answer is right. focus: a short label shown with the question, e.g. `Articles`, `Word forms`.
- word: the word this sentence practises, if any (it then counts towards that word's progress).

### builds.csv (Build the sentence)

`id,level,goal,pieces,decoys,also_right,explanation`

- **goal**: the instruction, e.g. `Describe a creative choice`.
- **pieces**: the pieces in the right order, separated by `|`. Each starts with its colour:
  `topic:` (who or what), `verb:`, `detail:`, `link:` (linking word), `judge:` (judgement), `hedge:`.
  Example: `topic: The close-up | verb: shows | detail: her facial expression | detail: clearly.`
- decoys: trap pieces, in the same form: `verb: show`
- also_right: another correct order, the piece texts separated by `|` (more than one: separate them with `||`).

### errors.csv (Spot the error)

`id,level,title,text`

- **text**: a paragraph. Each mistake is written `[wrong|right|why]`:
  `The magazine cover [show|shows|'The cover' is singular, so add -s.] a young woman.`

### tf.csv (True or false)

`id,level,statement,answer,explanation`

- **answer**: `TRUE` or `FALSE`.

### right-wrong.csv (Right or wrong)

`id,level,statement,answer,explanation` and, if you like, `correction`

- **statement**: one sentence. Some are right; some have one mistake (grammar, spelling, word choice).
- **answer**: `RIGHT` or `WRONG`.
- explanation: shown after the answer, e.g. what the mistake is. `<b>` and `<i>` work.
- correction (optional): the corrected sentence, shown after a WRONG one.
- Aim for about half RIGHT and half WRONG at each level, so guessing doesn't pay.

### reads.csv (Complete the text)

`id,level,title,text` (the old `question,correct,wrong1,wrong2,wrong3,explanation` columns can stay but are no longer used)

- **text**: a short text. Every `[[word]]` becomes a gap, and the word goes into the word bank under the text;
  `[[shown text|word]]` when the text uses another form of the word: `[[suggests|suggest]]` (the gap needs "suggests").
  At least 2 key words per text; 3–6 works best. The word must be in the same folder's `words.csv` (its meaning is shown after checking).
- The bank also gets 1 extra key word from the same level (2 when the text has 3 or more gaps), so the last gap is never a giveaway.
- **title**: shown above the text, e.g. `A perfume advert`.

### questions.csv (Answer the question)

`id,level,command,question,correct,wrong1,wrong2,wrong3,explanation`

- command: the command word at the start of the question (it is highlighted): `Evaluate`.
- **question**, **correct**, **wrong1** (up to `wrong3`). The answers should differ in whether they do what the command word asks.

### extracts.csv (In your own words)

`id,level,extract,word,correct,wrong1,wrong2,wrong3,word2,correct2,wrong1_2,wrong2_2,wrong3_2,word3,correct3,wrong1_3,wrong2_3,wrong3_3`

- **extract**: a sentence or two with each word to explain in square brackets: `Mara [glanced] at the letter.`
- For the first bracketed word: word (its entry in `words.csv`, e.g. `glance`), **correct** (what it means here),
  **wrong1**–**wrong3**. For the second: `word2`, `correct2`, `wrong1_2`… and so on. Up to three words per extract.

### reading.csv, close-reading.csv, big-idea.csv (reading passages)

`id,level,title,passage,question,correct,wrong1,wrong2,wrong3,explanation,source`
and, for a second question on the same passage, `question2,correct2,wrong1_2,wrong2_2,wrong3_2,explanation2`
(a third: `question3,correct3,wrong1_3…`).

- **passage**: paragraphs separated by a blank line inside the cell, or by ` || `.
- source: never shown.

### notes.csv (Note taking)

`id,level,title,passage,topic,select_count,option1,option2,option3,option4,option5,option6,correct_options,explanation,source`

- **topic**: the heading the notes go under. **select_count**: how many to choose (3).
- **correct_options**: their numbers, e.g. `[1,3,5]`. The six options are shuffled on screen.

## Checking before you push

From the repository folder:

```
python3 tools/check_content.py                      # every file in content/
python3 tools/check_content.py content/web-design   # one folder
```

It lists rows the games would skip, unknown levels, repeated ids, words that aren't in `words.csv`, and a table
of how much each level has, so you can see where a level is thin.

## Adding a topic

1. Make a folder here (e.g. `content/history/`) and copy the files from `templates/` into it.
2. Copy a topic page, e.g. `en/web-design/index.html` to `en/history/index.html`, and change `data-name`,
   `data-blurb`, `data-store` (a new name, e.g. `en-history`) and `data-content="../../content/history/"`.
3. Add a link to it on `en/index.html` (or `zh/index.html`).

The files load when the site is online (GitHub Pages), not from a page opened straight from your computer.
