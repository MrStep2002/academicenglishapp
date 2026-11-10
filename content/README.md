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
| `media-descriptors/` | English → Media Descriptors, and Chinese version → Media Descriptors (pages `en/describing-people/`, `zh/describing-people/`). Its own folder since 3 Nov 2026: the 32 describing words and their 81 Fill the gap rows moved here from `representation/` (same ids). All the descriptors are in `words.csv` (239 words since 7 Nov 2026; `new-words.csv` and `words-2.csv` are gone) |
| `advertising/` | English → Advertising, and Chinese version → Advertising (pages `en/advertising/`, `zh/advertising/`, since 5 Nov 2026). Words written level by level: `words.csv` has the written ones, `new-words.csv` the rest (the games don't read it). Ids `adv:<word>`. Words also in Representation (advert, slogan, target audience, direct address, emotive language…) are separate entries here with advertising meanings and examples, on purpose |
| `chemistry/` | Science → Chemistry (Cambridge IGCSE 0620), English and Chinese versions (`en/chemistry/`, `zh/chemistry/`). See "content/chemistry/" below |
| `physics/` | Science → Physics (Cambridge IGCSE 0625), English and Chinese versions (`en/physics/`, `zh/physics/`). See "content/physics/" below |
| `mockingbird/` | English → To Kill a Mockingbird (`en/mockingbird/`, English version only, since 8 Nov 2026). Ids `tkam:<word>` for words, `tkam-tf-…`, `tkam-gk-…`, `tkam-char-…`. tf.csv has a `focus` column (see True or false). Also `characters.csv` (below). The teacher's original word bank, `Mockingbird_empathic_word_bank_100.csv`, is not read by the games |
| `keywords/` | Not used any more: its words were merged into `essentials/` on 24 Oct 2026 |
| `reading-comprehension/` | English → Reading Comprehension: `close-reading.csv`, `big-idea.csv`, `notes.csv`, `recall.csv`, `total-recall.csv` |
| `listening/` | English → Listening: `listening.csv` (the scripts are read aloud by the browser) |
| `templates/` | The headings and one example row for every kind of file |

Every topic folder has the same files (the table below). A file with only its heading row is simply empty for now.
The Chinese version uses only `words.csv` (and its `zh` column), `builds.csv` (sentences with their Chinese), `evidence.csv` and `translation.csv`.

| File | Games |
|---|---|
| `words.csv` | Match the meaning (meanings and synonym groups), Word or meaning, and every Chinese-version game |
| `gaps.csv` | Fill the gap |
| `builds.csv` | Build the sentence (both versions; the Chinese version shows the sentence in Chinese) |
| `evidence.csv` | Find the evidence (English version) and All-in English (Chinese version): a statement, then choose the details that show it |
| `translation.csv` | Translation (Chinese version only): a sentence in Chinese, then choose the English sentence with the whole meaning |
| `errors.csv` | Spot the error |
| `tf.csv` | True or false |
| `right-wrong.csv` | Grammar Check (is the grammar good or bad? Was SPAG: Right or Wrong) |
| `reads.csv` | Complete the text (a short text whose key words are gaps, with a word bank) |
| `questions.csv` | Answer the question (exam command words) |
| `knowledge.csv` | General knowledge (Games row; no levels needed) |
| `taboo.csv` | Don't Say It! and Hints (board games on the teacher page: a word, four words the team can't say, four hints) |
| `wall.csv` | Connecting Wall (Starters on the teacher page: a group's name and four or more words that belong to it) |
| `extracts.csv` | In your own words |

Longer reading passages are not in the topic folders: they are in `reading-comprehension/` (Close reading, Big idea, Note taking). The topic folders' empty `reading.csv` files (Read and answer, replaced by Close reading) were removed on 25 Oct.

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

## content/general/ (everyone)

Things every student should know, whatever they study (1 Nov 2026). Every topic page loads them; they are not a topic of
their own.

- **knowledge.csv**: must-know general knowledge, the same columns as a topic's knowledge.csv (below). Every Daily Circuit
  quick-fire station plays one round of three of these questions, on the English and the Chinese side. Levels (since
  8 Nov 2026): each student has a Must-know level of its own, which starts from their level in their topics and moves with
  every Must-know answer; they get the questions at that level (a level with fewer than 6 questions is played with the
  nearest level). A row with no level plays at every level. Must-know answers don't change a topic's level.

## content/chemistry/ (Science, 3 Nov 2026)

The first science page. It has the usual files (words, gaps, builds, tf, right-wrong…) plus three **data tables**. The games
in its Chemistry column (Inside the atom, Ion charge, Name it, Formula it, What's made?) are not written row by row: the
page's module `en/engine/chem.js` makes every question from the tables, with wrong answers built from real mistakes, each
with its reason in English and Chinese. Change a table and the questions change; check a table and you have checked
every question made from it.

| Table | What it holds |
|---|---|
| `ions.csv` | `id,level,kind,symbol,charge,name,zh,ion_zh,element,mixups,not_with,only_with,note`: each ion; `zh` is the part used in Chinese compound names (氯化 + 钠 = 氯化钠); `mixups` the names students confuse it with (sulfide; sulfite); `not_with` / `only_with` the cations (by id) it makes no compound with here, because the compound doesn't exist or isn't met at IGCSE. `level` = how hard the ion is: a compound's level is worked out from its two ions. |
| `elements.csv` | `z,symbol,name,zh,mass,ar,group,period,kind,ion,level,note`: elements 1–20 and a few more; `mass` = the mass number(s) used in Inside the atom; `ion` = the usual ion's charge (blank = not used in Ion charge). |
| `reactions.csv` | `id,level,reactant,zh,type,ion,acids,note`: what reacts with which acid in What's made? (`type` metal, oxide, hydroxide or carbonate; `ion` = the cation in the salt; `acids` = hcl; h2so4; hno3). |

To check the questions after changing a table, open the page: a row the module can't use is skipped with a note in the
browser console.

### Syllabus topics: two optional columns in any file (science pages)

- **syllabus**: the syllabus code(s) the row practises, e.g. `2.4` or `2.4; 3.1`. On a science page each student ticks
  the syllabus topics they have studied or want to practise (the "Your topics" list); a row is used only when one of its
  topics is ticked. A row with no code is always used.
- **extended**: `yes` for Extended-only (Supplement) content. Students who choose Core never get these rows.

The topic list itself (the 12 topics of 0620 and their Chinese) is in `en/engine/chem.js`. A topic with no rows yet shows
"Coming soon". The choice is saved per student as `aea:science:chemistry`, shared by the English and Chinese pages.
Physics ticks subtopics instead (1.2 Motion, 1.4 Density…, in six groups; a group's own tick box ticks all of it): a row
coded `1.2` or `1.2.3` plays when 1.2 is ticked, and a row coded just `1` plays when any of 1.1–1.8 is ticked.

## content/physics/ (Science, 4 Nov 2026)

Built the same way as Chemistry: the usual files (words 134, gaps 62, tf 48, right-wrong 28, builds 21 with Chinese,
evidence 6; the others heading only) with `syllabus` / `extended` columns, plus four **data tables** read by the page's
module `en/engine/phys.js`. Its Physics column (Units, Equations, Calculate it, EM spectrum, Inside the nucleus) is made
by rules: about 500 questions, every wrong answer a real mistake with its reason and the working, in English and Chinese.

| Table | What it holds |
|---|---|
| `quantities.csv` | `id,level,name,zh,symbol,unit,unit_name,unit_zh,same_as,mixups,syllabus,extended`: each quantity and its unit (Units game; the units in Calculate it). `mixups`: the quantities (by id) students confuse it with, whose units are the first wrong answers; `same_as`: another way of writing the unit that is also right (pascal = N/m²), never offered as a wrong answer. A unit shared by two quantities (N, J, m, m/s, V) is never asked the other way round. |
| `waves.csv` | `order,id,level,name,zh,syllabus`: the electromagnetic spectrum, longest wavelength first. |
| `em-uses.csv` | `id,level,kind,text,zh,wave,not,syllabus,extended`: the uses (`kind` use) and harmful effects (`kind` harm) in 0625 3.3. `not`: waves never offered as a wrong answer for that row because a student could argue for them (mobile phones: not radio waves). |
| `nuclides.csv` | `id,level,name,zh,symbol,z,a,decay,syllabus,extended`: nuclei for counting protons, neutrons and nucleons, and (decay `alpha` or `beta`) for "which nucleus is left?". |

The **equations and the calculations** are in `en/engine/phys.js` (`EQS`): each equation in words in English and Chinese,
its syllabus code, and for each calculation the sentence in English and Chinese with the values to use. The numbers are
chosen so every answer is exact; a question can give a value in km, cm, g, min or mA to test converting. Special shapes
(E = IVt, the transformer, kelvin, and the Supplement ones: Ek, ΔEp, efficiency, pressure in a liquid, pV, ΔE = mcΔθ,
P = I²R, VpIp = VsIs, acceleration from two speeds, half-life) are written out under `specials()` and `nucleus()`.
`tools/check_physics.js` (Node) works every answer out again independently and checks the wrong answers and reasons:
`node tools/check_physics.js` from the repository folder (`--sample` prints some questions, `--dump file.md` lists them all).

## Rules for every file

- The first row is the headings, spelt exactly as below. The order of the columns doesn't matter.
- Save as **CSV UTF-8**. Wrap any cell that has a comma, a quote mark or a line break in double quotes,
  and double any quote mark inside it: `"She said ""no"", then left."`
- **id**: unique in its file. Never change or reuse a **word's** id: students' progress is saved against it.
  Word ids must also be unique across the whole site. A short readable code is best, e.g. `web-171`, `desc-gap-241`.
- **Explanations are optional, and usually best left blank** (1 Nov 2026, teacher: "just the correct answer is normally
  better"). After a wrong answer every game already shows the right answer, and the word and its meaning when the row
  has a `word`. Write one short sentence only when the right answer alone won't make the mistake clear. The exception is
  **knowledge.csv** (General knowledge): there the explanation is the interesting fact, so always write one.
- Explanations may use `<b>bold</b>` and `<i>italic</i>`. Nothing else is turned into formatting.
- Where a column refers to a word (`word`, `similar`, `accept`, `[[…]]` in reads), write the word as it appears in
  `words.csv` (or its id). It must be in the same folder's `words.csv`.
- Any row the games cannot use is skipped, and the browser's console says why. Run the checker to see them all at once.

## The columns

Required columns are in **bold**.

### words.csv

`id,level,word,pos,meaning,example,synonyms,zh,group,similar,accept,note,list`

| Column | |
|---|---|
| **id**, **level** | As above. |
| **word** | The word or phrase. `/` gives alternatives Type it accepts: `colour / color`. |
| pos | Part of speech: noun, verb, adjective… (Word or meaning prefers wrong answers with the same pos). |
| **meaning** | A short, clear meaning in English. Don't use the word itself (or a form of it) in its meaning: "a person who advertises" for advertiser gives the answer away, and the crossword leaves such words out (`tools/check_content.py` lists them). |
| example | An example sentence. |
| synonyms | Words with a similar meaning, separated by `;`. In Match the meaning, a word with synonyms sometimes shows its synonym group instead of its meaning. |
| zh | The Chinese meaning. Needed for the Chinese version (words without it are left out there). Keep the English word out of it ("标志", not "标志（logo）"): the crossword's Chinese clues would give it away. |
| group | A word group, e.g. `Command words 指令词`. Odd one out uses it (three from one group, one from another). |
| similar | Words in this file so close in meaning that they must never be wrong answers for this word, separated by `;`. |
| accept | Words Type it also accepts for this meaning, separated by `;`. |
| note | For teachers. Not shown. |
| list | Optional. Which word list(s) the word is on, separated by `;`, e.g. `key` or `key; describing`. A page with `data-list` deals only its list's words in the word games (see "Word lists" below). A word with no list is dealt on every page. |

#### Word lists (31 Oct 2026)

One folder can hold more than one word list, so two pages can share the same content. Representation has two:
`key` (media key terms: the Representation page) and `academic` (general academic words that students practise in
Essentials; they stay in the file only so the gaps and texts written around them keep their meanings). Its third list,
`describing`, became its own folder on 3 Nov 2026 (`media-descriptors/`), because a page that borrows a list only gets the
word games and the Fill the gap rows linked to its words, while a page with its own folder gets every game.

- `data-list="key"` on a topic page: Match the meaning, Word or meaning, the True or false cards made from words, Save the mouse,
  the arcade games, and every Chinese word game (including the words that flow in) use only words on that list.
- Every word in the file, on any list, still links content: the meaning after Check in Fill the gap and Complete the text,
  and the word's progress. Word progress is saved by id, so a word moves on wherever it is answered.
- `data-linked="yes"` as well: the page's other games use only content linked to its own words (Fill the gap rows whose
  `word` is on the list). Everything else (true/false rows, texts, Spot the error…) stays on the main page.

### knowledge.csv (General knowledge)

`id,level,question,correct,wrong1,wrong2,wrong3,explanation`

The General knowledge game sits in the **Games** row across the bottom of each English topic page (31 Oct 2026).
Questions about the wider world of the topic: people, places, history, ideas ("cultural capital").

- **question**, **correct** and **wrong1** are needed; wrong2 and wrong3 are optional (aim for three).
- **level** is optional: leave it empty and the question plays at every level. A level, if given, works as in the other files.
- **explanation** is optional: shown after any answer (right or wrong). `<b>` and `<i>` allowed.
- The answers are shuffled on screen, so the correct answer can always go in the `correct` column.
- Keep the right answer from standing out by length.
- Example rows: `templates/knowledge.csv`. English pages only for now; a Chinese column can be added later.

### taboo.csv (Don't Say It! and Hints, 6 Nov 2026)

`id,level,word,taboo1,taboo2,taboo3,taboo4,hint1,hint2,hint3,hint4`

A board game for the whole class on the teacher page (Board games): one player guesses, with their back to the board, while
their team describes the word without saying it or any of its four forbidden words. Every topic folder has the file, with
every word of its `words.csv` already in it (the same id, level and word): fill in the other columns. A word plays once it
has at least one forbidden word; the rest wait.

The same file feeds **Hints**, another board game: the team sees one hint at a time and guesses the word, for 4 points on the
first hint, 3 on the second, then 2 and 1. A word plays in Hints once it has at least two hints.

- **id**, **level**, **word**: as in words.csv. Representation's page plays only its `key` words, so this game does too.
- **taboo1** (to taboo4): the words a describer would most want to say, usually the words of its meaning. Not part of the word
  itself: that is never allowed anyway ("close-up" already rules out close and up).
- **hint1** to **hint4**: the clues for Hints, shown in this order, so put the hardest (the vaguest) first and the giveaway last:
  a team that gets the word on hint 1 scores 4 points. In Don't Say It! they help the describers, shown when the teacher presses
  Hint. A hint must not use the word itself, or any of its forbidden words (it couldn't be read out). Keep them short and at the
  word's level.
- Filled in so far: every topic folder, hints hardest first. `representation/` (148 words, 6–7 Nov); on 8 Nov Claude wrote
  advertising (161), chemistry (69), descriptive (500), essentials (95), media-descriptors (239: the file was rebuilt from the
  new 239-word words.csv), physics (223) and web-design (100). Check and change them as you like. The checker lists any hint
  that uses the word or a forbidden word, and counts the words ready for each game.

### characters.csv (To Kill a Mockingbird, 8 Nov 2026)

`id,level,name,description,group,version,taboo1,taboo2,taboo3,taboo4,hint1,hint2,hint3,hint4`

The cast of Christopher Sergel's stage version (the teacher's list: the 20 characters in the play the class reads), in their
own file so they can be used in different ways. For now they play in **Don't Say It!** and **Hints** on the teacher page,
alongside the topic's words: a character plays under its `name`.

- Every character has **two rows** (`version` 1 and 2, ids `tkam-char-<name>-1` and `-2`) with different forbidden words
  and different hints, so the same character can come up twice in a game and be guessed in different ways.
- **name**: what the class says, e.g. `Boo Radley`. description: the teacher's one-line description. group: Finch household,
  Neighbours, The courtroom, The Ewells, Tom's family and church, Townspeople.
- **taboo1–4** and **hint1–4**: as in taboo.csv (hints hardest first; a hint never uses the name or a forbidden word).
  Hints only use what happens in the play, not scenes that are only in the novel.
- level: main characters at Foundation, minor ones higher; both rows of a character have the same level.

### wall.csv (Connecting Wall, 7 Nov 2026)

`id,level,group,word1,word2,word3,word4,word5,word6`

A starter on the teacher page (Starters): sixteen words on the board, and the class sorts them into four groups of four.
The teacher clicks four tiles; if they are a group, they turn its colour and the group's name shows.

- **group**: the group's name, shown once the group is found: `Camera shots`.
- **word1** to **word4**: four words that belong to the group. **word5**, **word6** (optional, and `word7`… if you add the
  columns): more words for the group. A wall uses four of them, chosen at random, so a group with six words looks different
  from one starter to the next.
- **level**: groups at the levels chosen for the starter come first; if there aren't four, groups from the nearest levels fill the wall.
- A word can be in two groups (a red herring is part of the fun), but those two groups are never on the same wall, so every
  wall has only one answer. The checker lists those words.
- A wall needs four groups in the topics chosen. Every topic folder has some groups to start with (written by Claude on
  7 Nov 2026: check and change them as you like).

### gaps.csv (Fill the gap)

`id,level,sentence,answer,wrong1,wrong2,wrong3,explanation,focus,word`

- **sentence** has `___` (three underscores) where the gap is.
- **answer** fits the gap; **wrong1** plus up to two more wrong answers (`wrong2`, `wrong3`) don't.
- explanation (optional, usually blank): one short sentence, only if it helps. focus: a short label shown with the question, e.g. `Articles`, `Word forms`.
- word: the word this sentence practises, if any (it then counts towards that word's progress).

### builds.csv (Build the sentence)

`id,level,goal,zh,pieces,decoys,also_right,explanation`

Both versions (English since 31 Oct 2026, in the Reading column). The Chinese version shows the Chinese sentence; the
English version shows the goal. Students build the sentence in English from the coloured pieces.

- **zh**: the whole sentence in natural Chinese, e.g. `特写镜头清楚地展示了她的面部表情。` A sentence with no Chinese is not played.
  If there is an also_right order, the Chinese must fit it too.
- goal: a short English note of what the sentence does, e.g. `Describe a creative choice` (the English version shows it as the task).
- **pieces**: the pieces in the right order, separated by `|`. Each starts with its colour:
  `topic:` (who or what), `verb:`, `detail:`, `link:` (linking word), `judge:` (judgement), `hedge:`.
  Example: `topic: The close-up | verb: shows | detail: her facial expression | detail: clearly.`
- decoys: trap pieces, in the same form: `verb: show`
- also_right: another correct order, the piece texts separated by `|` (more than one: separate them with `||`).
- explanation: **not shown at the moment** (3 Nov 2026, teacher: writing them made the sentences long-winded, and content
  comes first). Leave it blank. Explanations already in the files stay there; `BUILD_WHY` in en/engine/app.js turns them back on.

### translation.csv (Translation, Chinese version, 8 Nov 2026)

`id,level,zh,english,wrong1,wrong2,wrong3,word,source,explanation`

- **zh**: the sentence in natural Chinese. **english**: the English sentence with the whole meaning (the right answer).
- **wrong1–wrong3**: three English sentences that do *not* say the same thing (a fourth, `wrong4`, may be added; at least two are needed). They should use many of the same words, so students have to read for meaning. Three kinds work well, one of each:
  1. the same words with the meaning changed (who does what, the opposite, a different time or place): *The powerful man looks down at the camera.*
  2. broken word order or grammar: *The low camera angle make powerful the man look.* (at B1, a second changed meaning instead)
  3. only part of the meaning: *The camera is low and the man is powerful.*
- **word** (optional): the word from words.csv the sentence practises (its id or the word). A wrong answer shows its meaning, and the student's progress with the word moves on.
- **source** (optional): where the English sentence came from, for the writers. Not shown.
- **explanation** (optional, shown after the answer; usually blank).
- **level**: the Chinese version uses A1–B1 (about 40% A1, 40% A2, 20% B1). A student whose level is above the highest level written gets the highest one below.
- Example (Advertising): `adv-tr-001,A1,这则广告以一个明亮的厨房开场。,The advert opens with a bright kitchen.,The advert ends with a bright kitchen.,The advert open with a kitchen bright.,The kitchen in the advert is bright.,adv:advert,,`

### evidence.csv (Find the evidence / All-in English, 3 Nov 2026)

`id,level,statement,right1,right2,right3,wrong1,wrong2,wrong3,word,side,explanation`

One game, two purposes. On the Chinese version it is **All-in English** (Sentences column): word association at
Foundation to Intermediate, everything in English. On the English version it is **Find the evidence** (Reading column,
phones too): a step towards language analysis. The student reads the statement, chooses as many details as there are
right ones, then presses Check. Like Note taking: chosen and right green, chosen and wrong red, missed ones with a dashed
green border. All right = a right answer; anything else and the statement comes back later. Daily Circuit: a long station
on both versions.

Example (the teacher's, from Representation): `Explain how the advert presents the woman as wealthy.` Right: `She wears
expensive jewellery.` / `She is drinking champagne.` / `She is eating caviar.` Wrong: `She stands beside another person.` /
`She is old.` / `She is looking directly at the camera.`

- **statement** can also be a whole paragraph (more than 25 words), e.g. Advertising (7 Nov 2026): a description of an advert,
  then three points of analysis that fit it (right) and three that can't apply to it (wrong). The game then shows it like a
  reading passage and says "Choose the 3 points of analysis that fit this text". Rows without their right and wrong columns
  filled in are skipped until they are.
- **statement**: what the details must show. At Foundation, a plain sentence (`The man in the advert is rich.`); from
  Intermediate, the exam frame (`Explain how the advert presents…`). The game adds "Choose the 3 details that show this".
- **right1** (to right3): the details that show it. The number filled in is the number to choose. A right4 column may be added.
- **wrong1, wrong2** (to wrong3): details that don't. Neutral (could be in the same text but show nothing: `Her dress is
  blue.`) or evidence of something else (`She hides behind the other dancers.` shows shy, not confident). **Never arguable**:
  if a student could make a case for it, change it. wrong4 and wrong5 may be added.
- word: the word the statement is about, from `words.csv` (e.g. `wealthy`). Optional: after Check its meaning is shown and the
  student's progress with the word moves on.
- side: `zh` = Chinese version only, `en` = English version only, blank = both.
- explanation: optional, shown after Check. Usually best left blank.
- Keep the detail words at or below the row's level (caviar is hard at Foundation). The details are shuffled on screen.
- First rows: `media-descriptors/evidence.csv` (9: three each at Foundation, Foundation+ and Intermediate; each statement
  hangs on one of its adjectives). des-ev-007 is the teacher's example; the others are Claude's drafts to check. Every other
  topic folder has the file with its heading row only. Example rows: `templates/evidence.csv`.

### errors.csv (Spot the error)

`id,level,title,text`

- **text**: a paragraph. Each mistake is written `[wrong|right|why]`:
  `The magazine cover [show|shows|'The cover' is singular, so add -s.] a young woman.`
- Everything inside the brackets is one tap for the student. So when the mistake is a **missing word**, put the words on
  both sides of the gap inside the brackets: `encourages [visitors stay|visitors to stay|encourage + person + to + verb.] longer.`
  (Bracketing only `stay` means a student who taps `visitors` is marked wrong.) The same goes for an extra word:
  `[beside of|beside|…]`, and for any mistake that is more than one word: `[more big|bigger|…]`.

### tf.csv (True or false)

`id,level,statement,answer,explanation`

- **answer**: `TRUE` or `FALSE`.
- focus (optional, To Kill a Mockingbird): `Context`, `Characters` or `Craft`, for sorting the statements. The games ignore it.
  Mockingbird's statements are about the times, the people and how writers build characters, not plot recall, because
  the class writes empathic responses (as a character) to Sergel's play. Every row has an explanation, true ones too.

### right-wrong.csv (Grammar Check)

`id,level,statement,answer,explanation` and, if you like, `correction`

- **statement**: one sentence. Some are right; some have one mistake (grammar, spelling, word choice).
- **answer**: `RIGHT` or `WRONG`.
- explanation: shown after the answer, e.g. what the mistake is. `<b>` and `<i>` work.
- correction (optional): the corrected sentence, shown after a WRONG one.
- Aim for about half RIGHT and half WRONG at each level, so guessing doesn't pay.

### reads.csv (Complete the text)

`id,level,title,text,extra1,extra2,extra3`

- **text**: a short text. Every `[[word]]` becomes a gap, and the word goes into the word bank under the text, exactly as written.
  A gap can be any word or form: `[[drifts]]`, `[[suggests]]`, `[[board]]`. When it is a word from the same folder's `words.csv`,
  or a simple form of one (drifts → drift, carried → carry, grabbed → grab, making → make), the game links it to that word:
  its meaning is shown after checking and the student's progress with the word is kept. Other words play as gaps without a meaning.
  `[[shown text|word]]` links a form to its word when the game cannot work it out (`[[took|take]]`).
  At least 2 gaps per text; 3–6 works best.
- **extra1**, **extra2**, **extra3** (optional): extra words for the word bank that do not fit any gap, so the last gap is never a giveaway.
  They can be any words, not only words from `words.csv`; write them as they should appear (lower case unless they are names).
  Use as many as suit the level: none, one, two or three. The game never adds extra words of its own, so a text with
  none shows only its own key words (the last gap then fills itself).
  An extra word must not also be one of the text's `[[key words]]`.
- **title**: shown above the text, e.g. `A perfume advert`.

### questions.csv (Answer the question)

`id,level,command,question,correct,wrong1,wrong2,wrong3,explanation`

- command: the command word, highlighted in the question: `Evaluate`. It starts the question, or a sentence in it after a short situation ("Club attendance fell after its meeting moved to 7 a.m. Suggest one possible reason.").
- **question**, **correct**, **wrong1** (up to `wrong3`). The answers should differ in whether they do what the command word asks.

### extracts.csv (In your own words)

`id,level,extract,word,correct,wrong1,wrong2,wrong3,word2,correct2,wrong1_2,wrong2_2,wrong3_2,word3,correct3,wrong1_3,wrong2_3,wrong3_3`

- **extract**: a sentence or two with each word to explain in square brackets: `Mara [glanced] at the letter.`
- For the first bracketed word: word (its entry in `words.csv`, e.g. `glance`), **correct** (what it means here),
  **wrong1**–**wrong3**. For the second: `word2`, `correct2`, `wrong1_2`… and so on. Up to three words per extract.

### close-reading.csv, big-idea.csv (reading passages; template: `templates/reading.csv`)

`id,level,title,passage,question,correct,wrong1,wrong2,wrong3,explanation,source`
and, for a second question on the same passage, `question2,correct2,wrong1_2,wrong2_2,wrong3_2,explanation2`
(a third: `question3,correct3,wrong1_3…`).

- **passage**: paragraphs separated by a blank line inside the cell, or by ` || `.
- source: never shown.

### listening.csv (Listening; template: `templates/listening.csv`)

The same columns as the reading passages, plus an optional `quote` for each question:
`id,level,title,passage,question,correct,wrong1,wrong2,wrong3,explanation,source,quote`
and for more questions `question2,correct2,wrong1_2,wrong2_2,wrong3_2,explanation2,quote2` (then `…3`, `…4`, as many as you like).

- **passage**: the script. Students never see it while they answer: the browser reads it aloud when they press Play
  (they can listen as often as they like, slow it down and choose the voice). After Check the script is shown.
- **Speakers**: start a line with the speaker's name and a colon: `Anna: Have you seen the timetable?`. Each speaker
  gets a different voice when the device has more than one English voice: the first a woman's voice, the next a man's,
  and so on, unless the name starts with Mr / Ms / Mrs / Miss. Put each speaker's turn on its own line. A talk or
  announcement with one speaker needs no names. Blank line = new paragraph (a longer pause).
- **quote** (optional): the exact words in the script that give the answer. They are highlighted in the script after
  Check, numbered by question. The checker makes sure every quote really is in the script.
- Write for the ear: short sentences, numbers and times written in words ("half past nine"), no headings or bullet
  points, no abbreviations the voice might misread. About 150–250 words is two minutes or less.
- Original scripts only, never copied from real exam papers: the site is public.

### notes.csv (Note taking)

`id,level,title,passage,topic,select_count,option1,option2,option3,option4,option5,option6,correct_options,explanation,source`

- **topic**: the heading the notes go under. **select_count**: how many to choose (3).
- **correct_options**: their numbers, e.g. `[1,3,5]`. The six options are shuffled on screen.

### recall.csv (Recall, 10 Nov 2026; template: `templates/recall.csv`)

`id,level,title,passage,question,select_count,option1,…,option8,correct_options,explanation,source`

- The student reads the passage for as long as they like, then presses **I'm ready**: the passage is hidden and the
  statements appear. They choose the ones that are true of the passage, from memory, then Check; the passage comes back.
- **question** (optional): what to ask; empty = "Which N statements are true of the passage?". **select_count**: how many
  are true. **option1–option8**: the statements (at least 4; leave the last ones empty if fewer). **correct_options**: the
  true ones' numbers, e.g. `[1,2,3]`. They are shuffled on screen, so the true ones can come first in the file.
- Good passages for memory: itineraries, rules, timetables, programmes, lost-property reports, agreements, short reports
  full of figures. Wrong statements change one detail (a number, a name, a day, which thing went where).
- Speed bonus: it starts at the passage's own points and runs down while the passage is open (to nothing after
  0.6 seconds a word, between 30 and 150 seconds). What is left at I'm ready is added if every statement chosen is right.

### total-recall.csv (Total Recall, 10 Nov 2026; template: `templates/total-recall.csv`)

`id,level,title,passage,question,answer,question2,answer2,…,question15,answer15,explanation,source`

- A list to remember (shopping, codes, timetables, ingredients, actions from a meeting). I'm ready hides it, then every
  question has a box to type in. Check marks them all; the list comes back.
- **answer**: what counts as right; more than one separated by `;` (the first is the one shown). Capitals, punctuation,
  a/an/the, 7:45 or 7.45, 08.51 or 8.51, 8th or 8, 750ml or 750 ml and numbers as words or digits don't matter. A small
  spelling slip in a word of 5 or more letters is accepted (shown with the spelling); a number must be exact.
- Each question is one answer (points shared between them, like Close reading); the speed bonus is shared the same way.
- `tools/check_reading.py` warns when no accepted answer is in the list word for word.

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
3. English: add one line for it to `en/engine/subjects.js` (its address, name and area: copy a line there). The sidebar,
   the Subjects menu, the home page and the landing page then all show it. Chinese: add a link to `zh/index.html`.

The files load when the site is online (GitHub Pages), not from a page opened straight from your computer.
