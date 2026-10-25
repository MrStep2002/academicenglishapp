#!/usr/bin/env python3
"""Check the content files before pushing (the formats are in content/README.md).

Run from the repository folder:
    python3 tools/check_content.py                      # every topic folder in content/
    python3 tools/check_content.py content/web-design   # one folder

For each folder it lists the rows the games would skip (and why), unknown levels, repeated ids, words that are not
in words.csv, and a table of how many items each level has (a level needs 6 items for its own button).
Reading passages are checked by tools/check_reading.py, which this runs too.
"""
import csv, glob, os, re, sys
sys.dont_write_bytecode = True   # no __pycache__ folder in the repository
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import check_reading

CODES = re.compile(r'^([ABC])([12])(\+)?$')
NAMES = {'foundation': 1, 'foundation+': 2, 'intermediate': 3, 'intermediate+': 4, 'advanced': 5}
LEVEL_NAMES = ['', 'Foundation', 'Foundation+', 'Intermediate', 'Intermediate+', 'Advanced']
MIN_LEVEL = 6   # the same number as MIN_LEVEL in en/engine/app.js
OPTIONAL = {'correction'}   # columns a file may leave out

HEADS = {
    'words': ['id', 'level', 'word', 'pos', 'meaning', 'example', 'synonyms', 'zh', 'group', 'similar', 'accept', 'note'],
    'gaps': ['id', 'level', 'sentence', 'answer', 'wrong1', 'wrong2', 'wrong3', 'explanation', 'focus', 'word'],
    'builds': ['id', 'level', 'goal', 'zh', 'pieces', 'decoys', 'also_right', 'explanation'],   # Build the sentence: Chinese version only
    'errors': ['id', 'level', 'title', 'text'],
    'tf': ['id', 'level', 'statement', 'answer', 'explanation'],
    'right-wrong': ['id', 'level', 'statement', 'answer', 'explanation', 'correction'],
    'reads': ['id', 'level', 'title', 'text'],   # Complete the text
    'questions': ['id', 'level', 'command', 'question', 'correct', 'wrong1', 'wrong2', 'wrong3', 'explanation'],
    'extracts': ['id', 'level', 'extract', 'word', 'correct', 'wrong1', 'wrong2', 'wrong3', 'word2', 'correct2', 'wrong1_2',
                 'wrong2_2', 'wrong3_2', 'word3', 'correct3', 'wrong1_3', 'wrong2_3', 'wrong3_3'],
}
ROLE = re.compile(r'^(topic|verb|detail|link|judge|hedge)\s*:\s*(.+)$', re.I)
ERR = re.compile(r'\[([^\]|]+)\|([^\]|]+)\|([^\]]+)\]')


def band(level):
    """1-5 for a level code or name, None if empty or unknown."""
    v = (level or '').strip()
    if v.lower().replace(' ', '') in NAMES: return NAMES[v.lower().replace(' ', '')]
    m = CODES.match(v.upper())
    if not m: return None
    return min(5, {'A': 0, 'B': 2, 'C': 4}[m.group(1)] + int(m.group(2)))


def read(path):
    with open(path, encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        head = [h.strip().lower() for h in (reader.fieldnames or [])]
        rows = [{(k or '').strip().lower(): (v or '').strip() for k, v in r.items() if k} for r in reader]
    return head, [r for r in rows if any(r.values())]


def check_folder(folder, all_word_ids):
    problems, counts = [], {}   # counts[kind][band] = n
    name = os.path.basename(os.path.normpath(folder))
    say = lambda f, r, msg: problems.append(f'{f}.csv {r.get("id") or "(no id)"}: {msg}')
    data = {}
    for kind, head in HEADS.items():
        path = os.path.join(folder, kind + '.csv')
        if not os.path.exists(path): continue
        h, rows = read(path)
        missing = [c for c in head if c not in h and c not in OPTIONAL and not re.match(r'(word|correct|wrong\d)(_?\d)?$', c)]
        unknown = [c for c in h if c not in head and not re.match(r'(word|correct)\d$|wrong\d_\d$', c)]
        if missing: problems.append(f'{kind}.csv: missing column(s) {", ".join(missing)}')
        if unknown: problems.append(f'{kind}.csv: column(s) not used by the games: {", ".join(unknown)}')
        data[kind] = rows

    words = data.get('words', [])
    by_text = {}
    for w in words: by_text.setdefault(w.get('word', '').lower(), []).append(w.get('id'))
    ids = {w.get('id') for w in words}
    known = lambda v: v in ids or v.lower() in by_text

    for kind, rows in data.items():
        seen = set()
        for r in rows:
            rid = r.get('id', '')
            ok = True
            if not rid: say(kind, r, 'no id')
            elif rid in seen: say(kind, r, 'id used more than once')
            seen.add(rid)
            b = band(r.get('level'))
            if not r.get('level'): say(kind, r, 'no level (it would be used at every level)')
            elif b is None: say(kind, r, f'level "{r["level"]}" not recognised')
            wrongs = lambda suf='': [r.get(f'wrong{k}{suf}', '') for k in (1, 2, 3) if r.get(f'wrong{k}{suf}', '')]
            if kind == 'words':
                if not r.get('word') or not r.get('meaning'): say(kind, r, 'needs a word and a meaning (skipped)'); ok = False
                if rid in all_word_ids and all_word_ids[rid] != name: say(kind, r, f'this word id is also used in {all_word_ids[rid]}/words.csv (they would share progress)')
                for col in ('similar', 'accept'):
                    for v in [x.strip() for x in r.get(col, '').split(';') if x.strip()]:
                        if not known(v): say(kind, r, f'{col}: "{v}" is not in words.csv')
            elif kind == 'gaps':
                s = r.get('sentence', '')
                if s.count('___') != 1 or not r.get('answer') or not wrongs(): say(kind, r, 'needs a sentence with one ___, an answer and a wrong answer (skipped)'); ok = False
                if r.get('answer') and r.get('answer') in wrongs(): say(kind, r, 'the answer is also a wrong answer')
            elif kind == 'builds':
                pieces = [p.strip() for p in r.get('pieces', '').split('|') if p.strip()]
                if len(pieces) < 2: say(kind, r, 'needs at least two pieces (skipped)'); ok = False
                texts = []
                for p in pieces + [p.strip() for p in r.get('decoys', '').split('|') if p.strip()]:
                    m = ROLE.match(p)
                    if not m: say(kind, r, f'"{p}" needs a colour first (topic:, verb:, detail:, link:, judge: or hedge:)')
                for p in pieces:
                    m = ROLE.match(p); texts.append(m.group(2).strip() if m else p)
                for alt in [a for a in r.get('also_right', '').split('||') if a.strip()]:
                    a = [x.strip() for x in alt.split('|') if x.strip()]
                    if sorted(a) != sorted(texts): say(kind, r, 'also_right should use exactly the same pieces as pieces')
            elif kind == 'errors':
                t = r.get('text', '')
                if not ERR.search(t): say(kind, r, 'the text needs at least one [wrong|right|why] (skipped)'); ok = False
                if t.count('[') != t.count(']'): say(kind, r, 'a [ or ] is missing')
                for wrong, right, _ in ERR.findall(t):   # a missing word: both words around the gap belong inside the brackets
                    w, rt = wrong.strip().lower(), right.strip().lower()
                    if rt.endswith(' ' + w) or rt.startswith(w + ' '):
                        say(kind, r, f'[{wrong}|{right}|…] adds a missing word: put the word on the other side of the gap inside the brackets too, e.g. [visitors stay|visitors to stay|…]')
            elif kind == 'tf':
                if not r.get('statement') or r.get('answer', '').strip().upper() not in ('TRUE', 'FALSE', 'T', 'F', 'YES', 'NO', 'Y', 'N'):
                    say(kind, r, 'needs a statement and an answer of TRUE or FALSE (skipped)'); ok = False
            elif kind == 'right-wrong':
                if not r.get('statement') or r.get('answer', '').strip().upper() not in ('RIGHT', 'WRONG', 'R', 'W', 'CORRECT', 'INCORRECT', 'TRUE', 'FALSE', 'YES', 'NO'):
                    say(kind, r, 'needs a statement and an answer of RIGHT or WRONG (skipped)'); ok = False
                elif r.get('correction') and r.get('answer', '').strip().upper() in ('RIGHT', 'R', 'CORRECT', 'TRUE', 'YES'):
                    say(kind, r, 'has a correction but the answer is RIGHT')
            elif kind == 'reads':   # Complete the text: the [[key words]] become the gaps; question columns are not used
                found = 0
                for shown, w in re.findall(r'\[\[([^|\]]+)(?:\|([^\]]+))?\]\]', r.get('text', '')):
                    if known((w or shown).strip()): found += 1
                    else: say(kind, r, f'[[{shown}{"|" + w if w else ""}]]: "{(w or shown).strip()}" is not in words.csv')
                if not r.get('text') or found < 2:
                    say(kind, r, 'needs a text with at least 2 [[key words]] from words.csv (skipped)'); ok = False
            elif kind == 'questions':
                if not r.get('question') or not r.get('correct') or not wrongs():
                    say(kind, r, 'needs a question, a correct answer and a wrong answer (skipped)'); ok = False
                if r.get('correct') and r.get('correct') in wrongs(): say(kind, r, 'the correct answer is also a wrong answer')
                if kind == 'questions' and r.get('command') and not r.get('question', '').lower().startswith(r['command'].lower()):
                    say(kind, r, 'the question should start with the command word')
            elif kind == 'extracts':
                n = len(re.findall(r'\[[^\]]+\]', r.get('extract', '')))
                sets = 0
                for k in range(1, 10):
                    a, s = ('', '') if k == 1 else (str(k), f'_{k}')
                    if not r.get('correct' + a): break
                    sets += 1
                    if not wrongs(s): say(kind, r, f'word {k} has no wrong answers')
                    if r.get('word' + a) and not known(r['word' + a]): say(kind, r, f'word{a}: "{r["word" + a]}" is not in words.csv')
                if not n or n != sets: say(kind, r, f'{n} word(s) in [brackets] but {sets} set(s) of answers (skipped)'); ok = False
            if kind == 'gaps' and r.get('word') and not known(r['word']): say(kind, r, f'word: "{r["word"]}" is not in words.csv')
            if ok and b is not None: counts.setdefault(kind, {})[b] = counts.setdefault(kind, {}).get(b, 0) + 1

    # How much each level has
    print(f'\n{folder}')
    kinds = [k for k in HEADS if counts.get(k)]
    reading = [f for f in check_reading.reading_files(folder)]
    rcount = {}
    for f in reading:
        _, rows = read(f)
        for r in rows:
            b = band(r.get('level'))
            if b: rcount[b] = rcount.get(b, 0) + 1
    if rcount: kinds.append('reading')
    topic_page = 'words' in data   # a topic folder (a reading-only folder's levels are chosen on its menu page instead)
    any_zh = any(w.get('zh') for w in words)
    if kinds:
        print('  ' + 'Level'.ljust(15) + ''.join(k.rjust(12) for k in kinds) + ('   own button?' if topic_page else ''))
        for b in range(1, 6):
            row = [(counts.get(k, {}) if k != 'reading' else rcount).get(b, 0) for k in kinds]
            if not any(row): continue
            zh = sum(1 for w in words if band(w.get('level')) == b and w.get('zh'))
            flag = ('yes' if sum(row) >= MIN_LEVEL else f'no: fewer than {MIN_LEVEL}, so played with the nearest level') if topic_page else ''
            print('  ' + LEVEL_NAMES[b].ljust(15) + ''.join(str(n).rjust(12) for n in row) + ('   ' + flag if flag else '') + (f'   ({zh} with Chinese)' if any_zh else ''))
    else:
        print('  (no content yet)')
    if words:
        no_zh = sum(1 for w in words if not w.get('zh'))
        if no_zh and no_zh < len(words): print(f'  {no_zh} word(s) have no Chinese (zh): the Chinese version leaves them out.')
    builds = data.get('builds', [])
    if builds:   # Build the sentence is on the Chinese version only: a sentence without its Chinese is not played anywhere
        with_zh = sum(1 for r in builds if r.get('zh'))
        print(f'  builds.csv: {with_zh} of {len(builds)} sentences have Chinese (zh). Build the sentence (Chinese version) uses only those.')
    for p in problems: print('  - ' + p)
    n = len(problems)
    for f in reading:
        print('  ', end=''); n += check_reading.check_file(f)
    return n


def main():
    folders = sys.argv[1:] or sorted(d for d in glob.glob(os.path.join('content', '*')) if os.path.isdir(d) and os.path.basename(d) != 'templates')
    # word ids across the whole site (they must be unique: progress is saved against them)
    all_ids = {}
    for d in sorted(glob.glob(os.path.join('content', '*'))):
        p = os.path.join(d, 'words.csv')
        if os.path.basename(d) == 'templates' or not os.path.exists(p): continue
        for r in read(p)[1]:
            if r.get('id'): all_ids.setdefault(r['id'], os.path.basename(d))
    total = sum(check_folder(f, all_ids) for f in folders)
    print('\nNo problems found.' if not total else f'\n{total} problem(s) found.')
    sys.exit(1 if total else 0)


if __name__ == '__main__':
    main()
