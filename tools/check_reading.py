#!/usr/bin/env python3
"""Check en/reading/reading.csv before pushing.

Run from the repository folder:  python3 tools/check_reading.py  [path/to/file.csv]
Reports: missing columns or cells, unknown topics, repeated ids, and how often the
right answer is the longest of the four (a giveaway if it happens much more than 1 in 4).
"""
import csv, sys, os

PATH = sys.argv[1] if len(sys.argv) > 1 else os.path.join('en', 'reading', 'reading.csv')
COLS = ['id', 'topic', 'level', 'title', 'passage', 'question', 'correct', 'wrong1', 'wrong2', 'wrong3', 'explanation', 'source']
NEED = ['id', 'topic', 'title', 'passage', 'question', 'correct', 'wrong1', 'wrong2', 'wrong3']
TOPICS = {'close-reading', 'essentials', 'web-design', 'representation', 'descriptive'}

with open(PATH, encoding='utf-8-sig', newline='') as f:
    rows = list(csv.DictReader(f))
    head = rows[0].keys() if rows else []

problems, seen, longest, shortest, counts = [], set(), 0, 0, {}
missing_cols = [c for c in NEED if rows and c not in head]
if missing_cols:
    problems.append('Missing column headings: ' + ', '.join(missing_cols))
for n, r in enumerate(rows, start=2):
    rid = (r.get('id') or '').strip() or f'(row {n})'
    gaps = [c for c in NEED if not (r.get(c) or '').strip()]
    if gaps: problems.append(f'{rid}: empty {", ".join(gaps)}')
    t = (r.get('topic') or '').strip()
    if t and t not in TOPICS: problems.append(f'{rid}: unknown topic "{t}" (use {", ".join(sorted(TOPICS))})')
    if rid in seen: problems.append(f'{rid}: id used more than once')
    seen.add(rid)
    counts[t] = counts.get(t, 0) + 1
    answers = [(r.get(c) or '').strip() for c in ['correct', 'wrong1', 'wrong2', 'wrong3']]
    if all(answers):
        if len(set(a.lower() for a in answers)) < 4: problems.append(f'{rid}: two answers are the same')
        right, wrong = len(answers[0]), [len(a) for a in answers[1:]]
        if right > max(wrong): longest += 1
        if right < min(wrong): shortest += 1

print(f'{len(rows)} rows in {PATH}: ' + ', '.join(f'{k} {v}' for k, v in sorted(counts.items())))
if rows:
    print(f'Right answer is the longest in {longest} of {len(rows)} ({round(100*longest/len(rows))}%), '
          f'shortest in {shortest} ({round(100*shortest/len(rows))}%). Aim for about 25% each.')
print('No problems found.' if not problems else f'{len(problems)} problem(s):')
for p in problems: print('  - ' + p)
sys.exit(1 if problems else 0)
