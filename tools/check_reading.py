#!/usr/bin/env python3
"""Check the reading CSV files before pushing.

Run from the repository folder:
    python3 tools/check_reading.py                  # every reading file in content/ (not the templates)
    python3 tools/check_reading.py path/to/file.csv # one file
tools/check_content.py checks every content file, these included.
Reports: wrong headings, empty cells, unknown levels, repeated ids, passage lengths, and how often the
right answer is the longest of the four (a giveaway if it happens much more than 1 in 4).

Note taking files (notes.csv) have their own columns: id, level, title, passage, topic, select_count,
option1…option6, correct_options (e.g. [1,3,5]), explanation, source.
Recall (recall.csv, 10 Nov 2026) has the same columns with question (optional) in place of topic, and up to 8 options.
Total Recall (total-recall.csv, 10 Nov 2026): id, level, title, passage, question, answer, question2, answer2… (up to 15),
explanation, source. answer: what counts as right, more than one separated by ; (the first is the one shown).

A passage can have more than one question. Question 1 uses the plain columns; question 2 adds
question2,correct2,wrong1_2,wrong2_2,wrong3_2,explanation2 after `source`; question 3 adds
question3,correct3,wrong1_3,wrong2_3,wrong3_3,explanation3; and so on.

Listening tests (content/english/listening/listening.csv, 26 Oct) use the same columns: `passage` is the script that is read
aloud. They may also have quote, quote2, quote3…: the words in the script that give each answer (marked when the
script is shown after Check). The checker makes sure each quote really is in the script.
"""
import csv, sys, os, glob, re

HEAD = ['id', 'level', 'title', 'passage', 'question', 'correct', 'wrong1', 'wrong2', 'wrong3', 'explanation', 'source']
NEED = ['id', 'title', 'passage', 'question', 'correct', 'wrong1', 'wrong2', 'wrong3']
LEVEL = re.compile(r'^((A1|A2|B1|B2|C1)\+?|FOUNDATION\+?|INTERMEDIATE\+?|ADVANCED)$')
EXTRA = re.compile(r'^(?:question|correct|explanation)([2-9])$|^wrong[123]_([2-9])$')
QUOTE = re.compile(r'^quote([2-9]?)$')   # listening: the words in the script that give the answer (optional)
norm = lambda t: re.sub(r'\s+', ' ', re.sub(r"[^a-z0-9' ]+", ' ', (t or '').lower().replace('’', "'").replace('‘', "'"))).strip()

def columns(n):
    """The question and the four answer columns of question n (1 = the plain names)."""
    a, b = ('', '') if n == 1 else (str(n), '_' + str(n))
    return 'question' + a, ['correct' + a, 'wrong1' + b, 'wrong2' + b, 'wrong3' + b]

NOTES_HEAD = ['id', 'level', 'title', 'passage', 'topic', 'select_count', 'option1', 'option2', 'option3',
              'option4', 'option5', 'option6', 'correct_options', 'explanation', 'source']
RECALL_HEAD = ['id', 'level', 'title', 'passage', 'question', 'select_count'] + [f'option{n}' for n in range(1, 9)] + ['correct_options', 'explanation', 'source']

def check_notes(path, head, rows):
    """Note taking and Recall: the right options must be checkable, and must not stand out by length."""
    problems, seen, lengths, right_len, wrong_len = [], set(), [], [], []
    recall = 'topic' not in head and 'question' in head
    want = RECALL_HEAD if recall else NOTES_HEAD
    nopt = max([int(h[6:]) for h in head if re.fullmatch(r'option\d', h)] or [6])
    if recall:
        if [h for h in head if not h.startswith('option')] != [h for h in want if not h.startswith('option')] or nopt < 4:
            problems.append('Headings should be: ' + ','.join(want) + ' (option1 to option4 at least)')
    elif head != NOTES_HEAD and head != NOTES_HEAD[:-1]:
        problems.append('Headings should be: ' + ','.join(NOTES_HEAD))
    for rownum, r in enumerate(rows, start=2):
        rid = (r.get('id') or '').strip() or f'(row {rownum})'
        gaps = [c for c in ['id', 'title', 'passage', 'select_count', 'correct_options'] + ([] if recall else ['topic']) if not (r.get(c) or '').strip()]
        if gaps: problems.append(f'{rid}: empty {", ".join(gaps)}')
        lv = (r.get('level') or '').strip().upper()
        if lv and not LEVEL.match(lv): problems.append(f'{rid}: level "{lv}" should be A1, A2, B1, B2 or C1 (or Foundation, Foundation+, Intermediate, Intermediate+, Advanced)')
        if rid in seen: problems.append(f'{rid}: id used more than once')
        seen.add(rid)
        if (r.get('passage') or '').strip(): lengths.append(words(r['passage']))
        opts = [(r.get(f'option{n}') or '').strip() for n in range(1, (nopt if recall else 6) + 1)]
        if recall:   # Recall: options 1 to n, then any empty ones at the end
            while opts and not opts[-1]: opts.pop()
            if len(opts) < 4 or not all(opts): problems.append(f'{rid}: needs at least 4 options, with none empty before the last one')
        elif not all(opts): problems.append(f'{rid}: an option is empty')
        if len(set(o.lower() for o in opts if o)) < len([o for o in opts if o]): problems.append(f'{rid}: two options are the same')
        nums = [int(x) for x in re.findall(r'\d+', r.get('correct_options') or '')]
        if any(n < 1 or n > len(opts) for n in nums) or len(set(nums)) != len(nums): problems.append(f'{rid}: correct_options should list different numbers from 1 to {len(opts)}')
        if recall and nums and len(nums) >= len(opts): problems.append(f'{rid}: every option is right: add some that are not')
        try: count = int(r.get('select_count') or 0)
        except ValueError: count = -1
        if count != len(nums): problems.append(f'{rid}: select_count is {r.get("select_count")} but correct_options lists {len(nums)}')
        for n, o in enumerate(opts, start=1):
            (right_len if n in nums else wrong_len).append(len(o))
    plural = lambda n, word: f'{n} {word}' + ('' if n == 1 else 's')
    span = '' if not lengths else f', {min(lengths)}–{max(lengths)} words'
    what = ('recall', 'statements') if recall else ('note taking', 'notes')
    print(f'{path}: {what[0]}, {plural(len(rows), "passage")}{span}')
    if right_len and wrong_len:
        print(f'  Average length: right {what[1]} {round(sum(right_len)/len(right_len))} characters, '
              f'wrong {what[1]} {round(sum(wrong_len)/len(wrong_len))}. Keep these close.')
    for p in problems: print('  - ' + p)
    return len(problems)

def check_total(path, head, rows):
    """Total Recall: every question has an answer; an answer should be in the passage (or it can't be remembered)."""
    problems, seen, lengths, asked = [], set(), [], 0
    base = ['id', 'level', 'title', 'passage', 'question', 'answer']
    if head[:6] != base: problems.append('Headings should start: ' + ','.join(base) + ', then question2,answer2…')
    nums = sorted({int(m.group(1) or 1) for m in (re.fullmatch(r'question(\d*)', h) for h in head) if m})
    for n in nums:
        if f'answer{n if n > 1 else ""}' not in head: problems.append(f'Question {n} needs the column answer{n if n > 1 else ""}')
    for rownum, r in enumerate(rows, start=2):
        rid = (r.get('id') or '').strip() or f'(row {rownum})'
        gaps = [c for c in ['id', 'title', 'passage', 'question', 'answer'] if not (r.get(c) or '').strip()]
        if gaps: problems.append(f'{rid}: empty {", ".join(gaps)}')
        lv = (r.get('level') or '').strip().upper()
        if lv and not LEVEL.match(lv): problems.append(f'{rid}: level "{lv}" should be A1, A2, B1, B2 or C1 (or Foundation, Foundation+, Intermediate, Intermediate+, Advanced)')
        if rid in seen: problems.append(f'{rid}: id used more than once')
        seen.add(rid)
        passage = norm(r.get('passage'))
        if passage: lengths.append(words(r['passage']))
        k = 0
        for n in nums:
            a = '' if n == 1 else str(n)
            q, ans = (r.get('question' + a) or '').strip(), [x.strip() for x in (r.get('answer' + a) or '').split(';') if x.strip()]
            if not q and not ans: continue
            if not q or not ans: problems.append(f'{rid}: question {n} has {"no answer" if q else "an answer but no question"}'); continue
            k += 1
            if not any(norm(x) and norm(x) in passage for x in ans): problems.append(f'{rid}: no answer to question {n} ("{ans[0]}") is in the passage word for word: check it')
        if k < 3: problems.append(f'{rid}: only {k} question{"" if k == 1 else "s"} (3 or more works best)')
        asked += k
    plural = lambda n, word: f'{n} {word}' + ('' if n == 1 else 's')
    span = '' if not lengths else f', {min(lengths)}–{max(lengths)} words'
    print(f'{path}: total recall, {plural(len(rows), "list")}, {plural(asked, "question")}{span}')
    for p in problems: print('  - ' + p)
    return len(problems)

def words(text):
    return len(re.findall(r"[A-Za-z0-9'’-]+", text))

def check_file(path):
    """Check one reading file; print what it finds; return the number of problems."""
    with open(path, encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        head = [h.strip() for h in (reader.fieldnames or [])]
        rows = list(reader)
    if 'option1' in head:
        return check_notes(path, head, rows)
    if 'answer' in head:
        return check_total(path, head, rows)
    problems, seen, longest, shortest, asked, lengths = [], set(), 0, 0, 0, []
    base = [h for h in head if not EXTRA.match(h) and not QUOTE.match(h)]
    extra = sorted({int(m.group(1) or m.group(2)) for m in map(EXTRA.match, head) if m})
    if base != HEAD and base != HEAD[:-1]:
        problems.append('Headings should start: ' + ','.join(HEAD))
    for n in extra:
        q, answers = columns(n)
        missing = [c for c in [q] + answers if c not in head]
        if missing: problems.append(f'Question {n} needs the columns: {", ".join(missing)}')
    for rownum, r in enumerate(rows, start=2):
        rid = (r.get('id') or '').strip() or f'(row {rownum})'
        gaps = [c for c in NEED if not (r.get(c) or '').strip()]
        if gaps: problems.append(f'{rid}: empty {", ".join(gaps)}')
        lv = (r.get('level') or '').strip().upper()
        if lv and not LEVEL.match(lv): problems.append(f'{rid}: level "{lv}" should be A1, A2, B1, B2 or C1 (or Foundation, Foundation+, Intermediate, Intermediate+, Advanced)')
        if rid in seen: problems.append(f'{rid}: id used more than once')
        seen.add(rid)
        if (r.get('passage') or '').strip(): lengths.append(words(r['passage']))
        for n in [1] + extra:
            q, cols = columns(n)
            question = (r.get(q) or '').strip()
            answers = [(r.get(c) or '').strip() for c in cols]
            if n > 1 and not question:
                if any(answers): problems.append(f'{rid}: answers for question {n}, but no question')
                continue
            if not all(answers):
                if n > 1: problems.append(f'{rid}: question {n} has an empty answer')
                continue
            asked += 1
            if len(set(a.lower() for a in answers)) < 4: problems.append(f'{rid}: two answers are the same (question {n})')
            quote = (r.get('quote' + ('' if n == 1 else str(n))) or '').strip()
            if quote and norm(quote) not in norm(r.get('passage')): problems.append(f'{rid}: the quote for question {n} is not in the passage/script word for word')
            right, wrong = len(answers[0]), [len(a) for a in answers[1:]]
            if right > max(wrong): longest += 1
            if right < min(wrong): shortest += 1
    plural = lambda n, word: f'{n} {word}' + ('' if n == 1 else 's')
    span = '' if not lengths else ', ' + plural(min(lengths), 'word') if min(lengths) == max(lengths) else f', {min(lengths)}–{max(lengths)} words'
    print(f'{path}: {plural(len(rows), "passage")}, {plural(asked, "question")}{span}')
    if asked:
        print(f'  Right answer is the longest in {longest} ({round(100*longest/asked)}%), '
              f'shortest in {shortest} ({round(100*shortest/asked)}%). Aim for about 25% each.')
    for p in problems: print('  - ' + p)
    return len(problems)

def reading_files(root='content'):
    """Every CSV in content/ that holds reading passages (it has a passage column), not the templates."""
    out = []
    for f in sorted(glob.glob(os.path.join(root, '**', '*.csv'), recursive=True)):
        if os.sep + 'templates' + os.sep in f: continue
        with open(f, encoding='utf-8-sig', newline='') as fh:
            head = [h.strip().lower() for h in (next(csv.reader(fh), None) or [])]
        if 'passage' in head: out.append(f)
    return out

if __name__ == '__main__':
    total_problems = sum(check_file(path) for path in (sys.argv[1:] or reading_files()))
    print('No problems found.' if not total_problems else f'{total_problems} problem(s) found.')
    sys.exit(1 if total_problems else 0)
