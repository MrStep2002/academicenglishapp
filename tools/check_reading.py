#!/usr/bin/env python3
"""Check the reading CSV files before pushing.

Run from the repository folder:
    python3 tools/check_reading.py                  # every CSV in en/reading (except the template)
    python3 tools/check_reading.py path/to/file.csv # one file
Reports: wrong headings, empty cells, unknown levels, repeated ids, passage lengths, and how often the
right answer is the longest of the four (a giveaway if it happens much more than 1 in 4).

A passage can have more than one question. Question 1 uses the plain columns; question 2 adds
question2,correct2,wrong1_2,wrong2_2,wrong3_2,explanation2 after `source`; question 3 adds
question3,correct3,wrong1_3,wrong2_3,wrong3_3,explanation3; and so on.
"""
import csv, sys, os, glob, re

HEAD = ['id', 'level', 'title', 'passage', 'question', 'correct', 'wrong1', 'wrong2', 'wrong3', 'explanation', 'source']
NEED = ['id', 'title', 'passage', 'question', 'correct', 'wrong1', 'wrong2', 'wrong3']
LEVEL = re.compile(r'^(A1|A2|B1|B2|C1)\+?$')
EXTRA = re.compile(r'^(?:question|correct|explanation)([2-9])$|^wrong[123]_([2-9])$')

def columns(n):
    """The question and the four answer columns of question n (1 = the plain names)."""
    a, b = ('', '') if n == 1 else (str(n), '_' + str(n))
    return 'question' + a, ['correct' + a, 'wrong1' + b, 'wrong2' + b, 'wrong3' + b]

def words(text):
    return len(re.findall(r"[A-Za-z0-9'’-]+", text))

files = sys.argv[1:] or sorted(f for f in glob.glob(os.path.join('en', 'reading', '**', '*.csv'), recursive=True)
                               if not f.endswith('reading-template.csv'))
total_problems = 0
for path in files:
    with open(path, encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        head = [h.strip() for h in (reader.fieldnames or [])]
        rows = list(reader)
    problems, seen, longest, shortest, asked, lengths = [], set(), 0, 0, 0, []
    base = [h for h in head if not EXTRA.match(h)]
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
        if lv and not LEVEL.match(lv): problems.append(f'{rid}: level "{lv}" should be A1, A2, B1, B2 or C1')
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
    total_problems += len(problems)
print('No problems found.' if not total_problems else f'{total_problems} problem(s) found.')
sys.exit(1 if total_problems else 0)
