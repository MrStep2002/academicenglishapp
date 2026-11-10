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
OPTIONAL = {'correction', 'extra1', 'extra2', 'extra3', 'list'}   # columns a file may leave out
TABOO_PARTS = {'of', 'the', 'a', 'an', 'with', 'to', 'and', 'in', 'on', 'for', 'up', 'out', 'down', 'en'}   # never forbidden on their own
# Science pages (3 Nov 2026): any file may also have "syllabus" (codes such as 2.4, separated by ;) and "extended"
# (yes = Extended only), used by the topic choice. A science folder's data tables (ions.csv, elements.csv, reactions.csv in
# content/chemistry/; quantities.csv, waves.csv, em-uses.csv, nuclides.csv in content/physics/) are read by its module
# (en/engine/chem.js, en/engine/phys.js), not by this checker. Physics has its own: node tools/check_physics.js
SCIENCE = {'syllabus', 'extended'}
# chapter: the latest chapter of a set text a row depends on (content/mockingbird/, 8 Nov 2026). The games ignore it for
# now; it is there so a "read up to chapter X" setting can hide spoilers later.
# focus: Context / Characters / Craft on content/mockingbird/tf.csv (9 Nov 2026), for the teacher's use; the games ignore it.
NOTES = {'chapter', 'focus'}

HEADS = {
    'words': ['id', 'level', 'word', 'pos', 'meaning', 'example', 'synonyms', 'zh', 'group', 'similar', 'accept', 'note', 'list'],   # list: optional, see content/README.md
    'gaps': ['id', 'level', 'sentence', 'answer', 'wrong1', 'wrong2', 'wrong3', 'explanation', 'focus', 'word'],
    'builds': ['id', 'level', 'goal', 'zh', 'pieces', 'decoys', 'also_right', 'explanation'],   # Build the sentence: Chinese version only
    'errors': ['id', 'level', 'title', 'text'],
    'tf': ['id', 'level', 'statement', 'answer', 'explanation'],
    'right-wrong': ['id', 'level', 'statement', 'answer', 'explanation', 'correction'],
    'reads': ['id', 'level', 'title', 'text', 'extra1', 'extra2', 'extra3'],   # Complete the text (extra1-3: the text's own extra words, optional)
    'questions': ['id', 'level', 'command', 'question', 'correct', 'wrong1', 'wrong2', 'wrong3', 'explanation'],
    'extracts': ['id', 'level', 'extract', 'word', 'correct', 'wrong1', 'wrong2', 'wrong3', 'word2', 'correct2', 'wrong1_2',
                 'wrong2_2', 'wrong3_2', 'word3', 'correct3', 'wrong1_3', 'wrong2_3', 'wrong3_3'],
    'knowledge': ['id', 'level', 'question', 'correct', 'wrong1', 'wrong2', 'wrong3', 'explanation'],   # General knowledge (31 Oct): level optional
    # Find the evidence (English version) / All-in English (Chinese version), 3 Nov 2026: right4, wrong4 and wrong5 may be added
    'evidence': ['id', 'level', 'statement', 'right1', 'right2', 'right3', 'wrong1', 'wrong2', 'wrong3', 'word', 'side', 'explanation'],
    # Don't Say It! (teacher page board game, 6 Nov 2026): the word, four words that can't be said, four hints for the describers
    'taboo': ['id', 'level', 'word', 'taboo1', 'taboo2', 'taboo3', 'taboo4', 'hint1', 'hint2', 'hint3', 'hint4'],
    # Connecting Wall (Starters on the teacher page, 7 Nov 2026): a group's name and four or more words (word5, word6… optional)
    'wall': ['id', 'level', 'group', 'word1', 'word2', 'word3', 'word4', 'word5', 'word6'],
    # Use of English (10 Nov 2026): Word choice, Open cloze and Word formation (C1 Advanced Reading and Use of English
    # Parts 1-3). The gaps are in the text: [[right|wrong|wrong|wrong]], [[answer]] or [[answer/other]], [[answer|STEM]].
    # explanation (shown after Check) and source (where the text came from; not shown) may be left out.
    'word-choice': ['id', 'level', 'title', 'text', 'explanation', 'source'],
    'open-cloze': ['id', 'level', 'title', 'text', 'explanation', 'source'],
    'word-formation': ['id', 'level', 'title', 'text', 'explanation', 'source'],
}
CLOZE = ('word-choice', 'open-cloze', 'word-formation')


# Crossword (9 Nov 2026): a meaning that contains its word ("advertiser: a person who advertises") gives the answer away, so
# the crossword leaves that word out when its clues are meanings. The same rule as gives() in en/engine/crossword.js: each
# part of the word with 3+ letters (not "the", "and"…) is looked for at the start of a word in the clue, the whole part when
# it has up to 5 letters, else its first letters (advertiser -> "advertis", so "advertises" counts).
XW_SMALL = {'the', 'and', 'for', 'with', 'from', 'into', 'onto', 'that', 'this', 'its', 'not', 'but', 'off', 'out'}
def xw_plain(s):
    import unicodedata
    return ''.join(c for c in unicodedata.normalize('NFD', str(s or '')) if not unicodedata.combining(c))
def xw_gives(word, clue):
    w = re.sub(r'\s*\([^)]*\)\s*', ' ', re.split(r'\s*/\s*', str(word or ''))[0]).strip()
    stems = [p if len(p) <= 5 else p[:max(5, len(p) - 3)] for p in re.split(r'[^a-z]+', xw_plain(w).lower()) if len(p) >= 3 and p not in XW_SMALL]
    c = ' ' + re.sub(r'[^a-z]+', ' ', xw_plain(clue).lower()) + ' '
    return any(' ' + s in c for s in stems)


def taboo_problems(word, taboo, hints):
    """Don't Say It!: a hint that uses the word, or one of its forbidden words, can't be read out."""
    def forms(w):
        s = {w, w + 's', w + 'es', w + 'ed', w + 'd', w + 'n', w + 'ing', w + 'er', w + 'ers', w + 'ly'}
        if w.endswith('e'): s |= {w[:-1] + 'ing', w[:-1] + 'ed'}
        if w.endswith('y'): s |= {w[:-1] + 'ies', w[:-1] + 'ied'}
        if w.endswith('s'): s.add(w[:-1])
        return s
    out = []
    parts = [p for p in re.split(r'[\s\-]+', word.lower()) if p and p not in TABOO_PARTS]
    for h in hints:
        toks = re.findall(r'[a-zà-ÿ]+', h.lower())
        if any(t in forms(p) or (len(p) >= 5 and len(t) >= 5 and (p in t or p.startswith(t))) for p in parts for t in toks):
            out.append(f'a hint uses the word itself: "{h}"')
        for b in [x.lower() for x in taboo]:
            if ' ' in b: hit = b in h.lower()
            else: hit = any(t in forms(b) or (len(t) >= 5 and len(b) >= 5 and (b.startswith(t) or t.startswith(b))) for t in toks)
            if hit: out.append(f'a hint uses the forbidden word "{b}": "{h}"')
    if len({x.lower() for x in taboo}) < len(taboo): out.append('the same forbidden word is there twice')
    return out
KNOWLEDGE_OPTIONAL = {'level', 'wrong2', 'wrong3', 'explanation'}
EVIDENCE_OPTIONAL = {'right2', 'right3', 'side', 'explanation'}
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
        missing = [c for c in head if c not in h and c not in OPTIONAL and not re.match(r'(word|correct|wrong\d)(_?\d)?$', c)
                   and not (kind == 'knowledge' and c in KNOWLEDGE_OPTIONAL) and not (kind == 'evidence' and c in EVIDENCE_OPTIONAL)
                   and not (kind in CLOZE and c in ('explanation', 'source'))]
        unknown = [c for c in h if c not in head and c not in SCIENCE and c not in NOTES and not re.match(r'(word|correct)\d$|wrong\d_\d$', c)
                   and not (kind == 'evidence' and re.match(r'(right|wrong)\d$', c))]
        if missing: problems.append(f'{kind}.csv: missing column(s) {", ".join(missing)}')
        if unknown: problems.append(f'{kind}.csv: column(s) not used by the games: {", ".join(unknown)}')
        data[kind] = rows

    words = data.get('words', [])
    by_text = {}
    for w in words: by_text.setdefault(w.get('word', '').lower(), []).append(w.get('id'))
    ids = {w.get('id') for w in words}
    known = lambda v: v in ids or v.lower() in by_text
    pos_of = {w.get('word', '').lower(): (w.get('pos') or '').lower() for w in words}

    def form_of(v):
        """Complete the text: the words.csv word a gap stands for (the word itself, or a simple form of it: drifts -> drift,
        carried -> carry, grabbed -> grab, making -> make), as in en/engine/app.js. None: the gap plays without a meaning."""
        t = v.strip().lower()
        if t in by_text: return t
        tries = []
        add = lambda b, k: tries.append((b, k)) if len(b) >= 2 else None
        if t.endswith('ies'): add(t[:-3] + 'y', 's')
        if t.endswith('es'): add(t[:-2], 's')
        if re.search(r'[^s]s$', t): add(t[:-1], 's')
        if t.endswith('ied'): add(t[:-3] + 'y', 'ed')
        if t.endswith('ed'):
            add(t[:-2], 'ed'); add(t[:-1], 'ed')
            if re.search(r'(.)\1ed$', t): add(t[:-3], 'ed')
        if t.endswith('ing'):
            add(t[:-3], 'ing'); add(t[:-3] + 'e', 'ing')
            if re.search(r'(.)\1ing$', t): add(t[:-4], 'ing')
        need = {'s': ('noun', 'verb'), 'ed': ('verb',), 'ing': ('verb',)}
        for b, k in tries:
            if b in by_text and (not pos_of.get(b) or any(x in pos_of[b] for x in need[k])): return b
        return None
    gap_links = [0, 0]   # Complete the text: [gaps linked to a word in words.csv, all gaps]

    for kind, rows in data.items():
        seen = set()
        for r in rows:
            rid = r.get('id', '')
            ok = True
            if not rid: say(kind, r, 'no id')
            elif rid in seen: say(kind, r, 'id used more than once')
            seen.add(rid)
            b = band(r.get('level'))
            if not r.get('level'):
                if kind != 'knowledge': say(kind, r, 'no level (it would be used at every level)')   # General knowledge: no level = every level
            elif b is None: say(kind, r, f'level "{r["level"]}" not recognised')
            wrongs = lambda suf='': [r.get(f'wrong{k}{suf}', '') for k in (1, 2, 3) if r.get(f'wrong{k}{suf}', '')]
            if kind == 'words':
                if not r.get('word') or not r.get('meaning'): say(kind, r, 'needs a word and a meaning (skipped)'); ok = False
                if rid in all_word_ids and all_word_ids[rid] != name: say(kind, r, f'this word id is also used in {all_word_ids[rid]}/words.csv (they would share progress)')
                for col in ('similar', 'accept'):
                    for v in [x.strip() for x in r.get(col, '').split(';') if x.strip()]:
                        if not known(v): say(kind, r, f'{col}: "{v}" is not in words.csv')
            elif kind == 'knowledge':
                if not r.get('question') or not r.get('correct') or not wrongs(): say(kind, r, 'needs a question, a correct answer and at least one wrong answer (skipped)'); ok = False
                elif r.get('correct') in wrongs(): say(kind, r, 'the correct answer is also a wrong answer')
            elif kind == 'gaps':
                s = r.get('sentence', '')
                if s.count('___') != 1 or not r.get('answer') or not wrongs(): say(kind, r, 'needs a sentence with one ___, an answer and a wrong answer (skipped)'); ok = False
                if r.get('answer') and r.get('answer') in wrongs(): say(kind, r, 'the answer is also a wrong answer')
                if re.search(r'_{4,}', s): say(kind, r, 'the gap has more than three underscores: the games show the extra ones (use exactly ___)')
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
            elif kind == 'reads':   # Complete the text: every [[word]] is a gap; any word or form may be a gap (25 Oct)
                gaps = re.findall(r'\[\[([^|\]]+)(?:\|([^\]]+))?\]\]', r.get('text', ''))
                for shown, w in gaps:
                    gap_links[1] += 1
                    if w:   # [[shown|word]] names its word: it should be in words.csv
                        if known(w.strip()): gap_links[0] += 1
                        else: say(kind, r, f'[[{shown}|{w}]]: "{w.strip()}" is not in words.csv (the gap still plays, without a meaning)')
                    elif form_of(shown): gap_links[0] += 1
                if not r.get('text') or len(gaps) < 2:
                    say(kind, r, 'needs a text with at least 2 [[gaps]] (skipped)'); ok = False
                keys = {x.strip().lower() for pair in re.findall(r'\[\[([^|\]]+)(?:\|([^\]]+))?\]\]', r.get('text', '')) for x in pair if x}
                for k in ('extra1', 'extra2', 'extra3'):   # the text's own extra words must not also be gaps
                    if r.get(k) and r[k].strip().lower() in keys: say(kind, r, f'{k} "{r[k]}" is also a [[key word]] in the text, so it would be in the word bank twice')
            elif kind == 'questions':
                if not r.get('question') or not r.get('correct') or not wrongs():
                    say(kind, r, 'needs a question, a correct answer and a wrong answer (skipped)'); ok = False
                if r.get('correct') and r.get('correct') in wrongs(): say(kind, r, 'the correct answer is also a wrong answer')
                # the command word starts the question, or a sentence in it after a short situation (7 Nov 2026)
                if kind == 'questions' and r.get('command') and not re.search(r'(^|[.?!:;”’"]\s+)' + re.escape(r['command'].strip().lower()) + r'(?![a-z])', r.get('question', '').lower()):
                    say(kind, r, 'the command word should start the question, or a sentence in it')
            elif kind == 'evidence':   # Find the evidence / All-in English (3 Nov 2026)
                right = [r.get(f'right{k}', '') for k in range(1, 5) if r.get(f'right{k}', '')]
                wrong = [r.get(f'wrong{k}', '') for k in range(1, 6) if r.get(f'wrong{k}', '')]
                if not r.get('statement') or not right or len(set(wrong) - set(right)) < 2:
                    say(kind, r, 'needs a statement, at least one right detail and two wrong ones (skipped)'); ok = False
                both = set(right) & set(wrong)
                if both: say(kind, r, f'the same detail is right and wrong: {"; ".join(sorted(both))}')
                if len(set(right)) < len(right) or len(set(wrong)) < len(wrong): say(kind, r, 'the same detail is there twice')
                side = r.get('side', '').strip().lower()
                if side and not re.match(r'(zh|cn|chinese|en|english|both)$', side): say(kind, r, f'side "{r["side"]}": use zh (Chinese version only), en (English version only) or leave it blank (both)')
                if r.get('word') and not known(r['word']): say(kind, r, f'word: "{r["word"]}" is not in words.csv')
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
            elif kind == 'taboo':   # Don't Say It! (a word waits for a forbidden word) and Hints (two hints); not on the topic pages' level buttons
                tb = [r.get(f'taboo{k}', '') for k in range(1, 5) if r.get(f'taboo{k}', '')]
                if not r.get('word'): say(kind, r, 'needs a word (skipped)')
                for m in taboo_problems(r.get('word', ''), tb, [r.get(f'hint{k}', '') for k in range(1, 5) if r.get(f'hint{k}', '')]): say(kind, r, m)
                nh = sum(1 for k in range(1, 5) if r.get(f'hint{k}', ''))
                if (tb or nh >= 2) and r.get('id') and r['id'] not in ids: say(kind, r, f'id "{r["id"]}" is not in words.csv (it still plays)')
                ok = False
            elif kind == 'wall':   # Connecting Wall (Starters): not on the topic pages' level buttons
                ws = [r[k] for k in sorted((k for k in r if re.match(r'word\d+$', k)), key=lambda k: int(k[4:])) if r.get(k)]
                if not r.get('group') or len({w.lower() for w in ws}) < 4: say(kind, r, 'needs a group name and at least four different words (skipped)')
                elif len({w.lower() for w in ws}) < len(ws): say(kind, r, 'the same word is there twice')
                ok = False
            elif kind in CLOZE:   # Use of English (10 Nov 2026)
                t = r.get('text', '')
                gaps = re.findall(r'\[\[([^\]]+)\]\]', t)
                if t.count('[[') != t.count(']]') or t.count('[[') != len(gaps): say(kind, r, 'a [[ or ]] is missing')
                if len(gaps) < 2: say(kind, r, 'needs a text with at least 2 [[gaps]] (skipped)'); ok = False
                rest = re.sub(r'\[\[[^\]]+\]\]', ' ', t).lower()
                for g in gaps:
                    bits = [x.strip() for x in g.split('|')]
                    if kind == 'word-choice':
                        opts = [x for x in bits if x]
                        if len(set(x.lower() for x in opts)) < 3: say(kind, r, f'[[{g}]] needs the right word and at least two different wrong ones, separated by | (skipped)'); ok = False
                        elif len(opts) > 4: say(kind, r, f'[[{g}]] has more than three wrong words (the game shows four at most)')
                        continue
                    answers = [x.strip() for x in bits[0].split('/') if x.strip()]
                    if not answers: say(kind, r, f'[[{g}]] has no answer (skipped)'); ok = False; continue
                    if kind == 'open-cloze':
                        if len(bits) > 1: say(kind, r, f'[[{g}]]: open cloze gaps have no |; separate answers that are also right with /')
                        if any(' ' in a for a in answers): say(kind, r, f'[[{g}]]: an open cloze answer is one word')
                    else:   # word formation
                        stem = bits[1] if len(bits) > 1 else ''
                        if not stem: say(kind, r, f'[[{g}]] needs the word in capitals after a |, e.g. [[unusual|USUAL]] (skipped)'); ok = False; continue
                        if any(a.lower() == stem.lower() for a in answers): say(kind, r, f'[[{g}]]: the answer is the same as the word in capitals')
                        if re.search(r'\b' + re.escape(stem.lower()) + r'\b', rest): say(kind, r, f'[[{g}]]: "{stem.lower()}" is also in the text, which may help too much')
                        if re.search(r'\b' + re.escape(answers[0].lower()) + r'\b', rest): say(kind, r, f'[[{g}]]: "{answers[0]}" is also in the text, which gives the answer away')
                        if re.search(r'\b' + re.escape(answers[0].lower()) + r'\b', r.get('title', '').lower()): say(kind, r, f'[[{g}]]: "{answers[0]}" is in the title, which gives the answer away')
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
        print('  ' + 'Level'.ljust(15) + ''.join(k.rjust(max(12, len(k) + 2)) for k in kinds) + ('   own button?' if topic_page else ''))
        for b in range(1, 6):
            row = [(counts.get(k, {}) if k != 'reading' else rcount).get(b, 0) for k in kinds]
            if not any(row): continue
            zh = sum(1 for w in words if band(w.get('level')) == b and w.get('zh'))
            flag = ('yes' if sum(row) >= MIN_LEVEL else f'no: fewer than {MIN_LEVEL}, so played with the nearest level') if topic_page else ''
            print('  ' + LEVEL_NAMES[b].ljust(15) + ''.join(str(n).rjust(max(12, len(k) + 2)) for n, k in zip(row, kinds)) + ('   ' + flag if flag else '') + (f'   ({zh} with Chinese)' if any_zh else ''))
    else:
        print('  (no content yet)')
    if words and any(w.get('list') for w in words):   # word lists (data-list on a page decides which list its word games deal)
        lists = {}
        for w in words:
            for l in [x.strip().lower() for x in w.get('list', '').split(';') if x.strip()] or ['(no list: dealt on every page)']:
                lists[l] = lists.get(l, 0) + 1
        print('  words.csv lists: ' + ', '.join(f'{k} {v}' for k, v in sorted(lists.items())))
    if words:
        no_zh = sum(1 for w in words if not w.get('zh'))
        if no_zh and no_zh < len(words): print(f'  {no_zh} word(s) have no Chinese (zh): the Chinese version leaves them out.')
        give = [w for w in words if w.get('word') and xw_gives(w['word'], w.get('meaning', ''))]
        if give: print(f'  Crossword: {len(give)} meaning(s) contain their word, so the crossword leaves those words out when the clues are meanings: '
                       + '; '.join(w.get('word', '') for w in give) + '.')
        givez = [w for w in words if w.get('word') and w.get('zh') and xw_gives(w['word'], w['zh'])]
        if givez: print(f'  Crossword: {len(givez)} Chinese meaning(s) contain the English word, so the crossword leaves them out when the clues are Chinese: '
                        + '; '.join(w.get('word', '') for w in givez) + '.')
    builds = data.get('builds', [])
    if builds:   # Build the sentence is on the Chinese version only: a sentence without its Chinese is not played anywhere
        with_zh = sum(1 for r in builds if r.get('zh'))
        print(f'  builds.csv: {with_zh} of {len(builds)} sentences have Chinese (zh). Build the sentence (Chinese version) uses only those.')
    gk = data.get('knowledge', [])
    if gk:   # General knowledge: no levels needed
        nolevel = sum(1 for r in gk if not r.get('level'))
        print(f'  knowledge.csv: {len(gk)} General knowledge questions ({nolevel} with no level, so played at every level).')
    tf = data.get('tf', [])
    if tf:   # True or false giveaways (31 Oct): absolute words and hedges should not tell students the answer
        ABS = re.compile(r"\b(always|never|must|only|every|all|automatically|cannot|can't|impossible|completely|nothing|everyone|no one|none)\b", re.I)
        HED = re.compile(r"\b(can|may|might|often|usually|sometimes|probably|could|tends?)\b", re.I)
        pct = lambda rs, rx: round(100 * sum(bool(rx.search(r.get('statement', ''))) for r in rs) / len(rs)) if rs else 0
        t = [r for r in tf if r.get('answer', '').strip().upper() in ('TRUE', 'T')]; f = [r for r in tf if r.get('answer', '').strip().upper() in ('FALSE', 'F')]
        a, h = (pct(t, ABS), pct(f, ABS)), (pct(t, HED), pct(f, HED))
        print(f'  tf.csv: {len(t)} TRUE, {len(f)} FALSE. Absolute words (only, every, never…) in {a[0]}% of TRUE and {a[1]}% of FALSE; hedges (may, can, probably…) in {h[0]}% and {h[1]}%.'
              + ('  Aim: within 10 points of each other.' if max(abs(a[0] - a[1]), abs(h[0] - h[1])) > 10 else ''))
    taboo = data.get('taboo', [])
    if taboo:   # Don't Say It! plays only the words with forbidden words
        ready = [r for r in taboo if any(r.get(f'taboo{k}') for k in range(1, 5))]
        by = {}
        for r in ready: by[band(r.get('level')) or 0] = by.get(band(r.get('level')) or 0, 0) + 1
        print(f'  taboo.csv: {len(ready)} of {len(taboo)} words ready for Don\'t Say It! (they have forbidden words)'
              + (': ' + ', '.join(f'{LEVEL_NAMES[b] if b else "no level"} {n}' for b, n in sorted(by.items())) if ready else '') + '.')
        hn = [r for r in taboo if sum(1 for k in range(1, 5) if r.get(f'hint{k}')) >= 2]
        print(f'  taboo.csv: {len(hn)} of {len(taboo)} words ready for Hints (they have two hints or more; the hardest goes first).')
    wall = data.get('wall', [])
    if wall:   # Connecting Wall: four groups on a wall; a word in two groups keeps those groups off the same wall
        good = [r for r in wall if r.get('group') and len({r[k].lower() for k in r if re.match(r'word\d+$', k) and r.get(k)}) >= 4]
        where = {}
        for r in good:
            for k in r:
                if re.match(r'word\d+$', k) and r.get(k): where.setdefault(r[k].lower(), []).append(r.get('group'))
        twice = sorted(w for w, g in where.items() if len(set(g)) > 1)
        print(f'  wall.csv: {len(good)} groups for Connecting Wall (a wall needs 4).' + (f' In more than one group (those groups are never on the same wall): {", ".join(twice)}.' if twice else ''))
    reads = data.get('reads', [])
    if reads:   # Complete the text: the word bank has only the key words and the text's own extra words
        with_extra = sum(1 for r in reads if any(r.get(k) for k in ('extra1', 'extra2', 'extra3')))
        print(f'  reads.csv: {with_extra} of {len(reads)} texts have extra words (extra1-3). The others show only their own key words in the word bank.')
        print(f'  reads.csv: {gap_links[0]} of {gap_links[1]} gaps are words from words.csv (their meaning is shown after Check); the others play without a meaning.')
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
