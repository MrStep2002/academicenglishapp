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

A passage can have more than one question. Question 1 uses the plain columns; question 2 adds
question2,correct2,wrong1_2,wrong2_2,wrong3_2,explanation2 after `source`; question 3 adds
question3,correct3,wrong1_3,wrong2_3,wrong3_3,explanation3; and so on.
"""
import csv, sys, os, glob, re

HEAD = ['id', 'level', 'title', 'passage', 'question', 'correct', 'wrong1', 'wrong2', 'wrong3', 'explanation', 'source']
NEED = ['id', 'title', 'passage', 'question', 'correct', 'wrong1', 'wrong2', 'wrong3']
LEVEL = re.compile(r'^((A1|A2|B1|B2|C1)\+?|FOUNDATION\+?|INTERMEDIATE\+?|ADVANCED)$')
EXTRA = re.compile(r'^(?:question|correct|explanation)([2-9])$|^wrong[123]_([2-9])$')

def columns(n):
    """The question and the four answer columns of question n (1 = the plain names)."""
    a, b = ('', '') if n == 1 else (str(n), '_' + str(n))
    return 'question' + a, ['correct' + a, 'wrong1' + b, 'wrong2' + b, 'wrong3' + b]

NOTES_HEAD = ['id', 'level', 'title', 'passage', 'topic', 'select_count', 'option1', 'option2', 'option3',
              'option4', 'option5', 'option6', 'correct_options', 'explanation', 'source']

def check_notes(path, head, rows):
    """Note taking: the right notes must be checkable, and must not stand out by length."""
    problems, seen, lengths, right_len, wrong_len = [], set(), [], [], []
    if head != NOTES_HEAD and head != NOTES_HEAD[:-1]:
        problems.append('Headings should be: ' + ','.join(NOTES_HEAD))
    for rownum, r in enumerate(rows, start=2):
        rid = (r.get('id') or '').strip() or f'(row {rownum})'
        gaps = [c for c in ['id', 'title', 'passage', 'topic', 'select_count', 'correct_options'] if not (r.get(c) or '').strip()]
        if gaps: problems.append(f'{rid}: empty {", ".join(gaps)}')
        lv = (r.get('level') or '').strip().upper()
        if lv and not LEVEL.match(lv): problems.append(f'{rid}: level "{lv}" should be A1, A2, B1, B2 or C1 (or Foundation, Foundation+, Intermediate, Intermediate+, Advanced)')
        if rid in seen: problems.append(f'{rid}: id used more than once')
        seen.add(rid)
        if (r.get('passage') or '').strip(): lengths.append(words(r['passage']))
        opts = [(r.get(f'option{n}') or '').strip() for n in range(1, 7)]
        if not all(opts): problems.append(f'{rid}: an option is empty')
        if len(set(o.lower() for o in opts if o)) < len([o for o in opts if o]): problems.append(f'{rid}: two options are the same')
        nums = [int(x) for x in re.findall(r'\d+', r.get('correct_options') or '')]
        if any(n < 1 or n > 6 for n in nums) or len(set(nums)) != len(nums): problems.append(f'{rid}: correct_options should list different numbers from 1 to 6')
        try: count = int(r.get('select_count') or 0)
        except ValueError: count = -1
        if count != len(nums): problems.append(f'{rid}: select_count is {r.get("select_count")} but correct_options lists {len(nums)}')
        for n, o in enumerate(opts, start=1):
            (right_len if n in nums else wrong_len).append(len(o))
    plural = lambda n, word: f'{n} {word}' + ('' if n == 1 else 's')
    span = '' if not lengths else f', {min(lengths)}–{max(lengths)} words'
    print(f'{path}: note taking, {plural(len(rows), "passage")}{span}')
    if right_len and wrong_len:
        print(f'  Average length: right notes {round(sum(right_len)/len(right_len))} characters, '
              f'wrong notes {round(sum(wrong_len)/len(wrong_len))}. Keep these close.')
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
