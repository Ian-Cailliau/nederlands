"""Check content/*.json before building: python3 src/check_content.py
Exits 1 and lists every problem (missing fields, duplicate or badly formed ids, wrong article, bad dates).
It does not judge the Dutch; the tests do that (src/tests/checker.js and items.js)."""
import json, glob, os, re, sys
ROOT = os.path.abspath(os.path.dirname(os.path.abspath(__file__)) + '/..') + '/'
P = []
def bad(where, msg): P.append(f'{where}: {msg}')
def load(f):
    try:
        return json.load(open(f, encoding='utf-8'))
    except Exception as e:
        bad(os.path.basename(f), f'not valid JSON ({e})'); return None
POS = {'noun', 'verb', 'adj', 'adv', 'prep', 'other'}
DATE = re.compile(r'^\d{4}-\d{2}-\d{2}$')
ids = {}
def take(i, where):
    if i in ids: bad(where, f'id {i} is used twice (also in {ids[i]})')
    ids[i] = where
for f in sorted(glob.glob(ROOT + 'content/ch*.json')):
    name = os.path.basename(f); c = load(f)
    if c is None: continue
    n = c.get('ch')
    if not isinstance(n, int): bad(name, '"ch" must be the chapter number'); continue
    if name != f'ch{n}.json': bad(name, f'file name should be ch{n}.json')
    for k in ('title', 'en', 'words'):
        if k not in c: bad(name, f'missing "{k}"')
    for w in c.get('words', []):
        where = f"{name} {w.get('id', w.get('nl'))}"
        for k in ('id', 'ch', 'nl', 'en', 'pos'):
            if not w.get(k): bad(where, f'missing "{k}"')
        if w.get('ch') != n: bad(where, f'"ch" is {w.get("ch")}, the file is chapter {n}')
        if w.get('pos') not in POS: bad(where, f'pos must be one of {sorted(POS)}')
        if not str(w.get('id', '')).startswith(f'h{n}-'): bad(where, f'ids in this chapter start with h{n}-')
        if w.get('pos') == 'noun':
            if w.get('art') in ('de', 'het'):
                if w.get('nl') != f"{w['art']} {w.get('word')}": bad(where, f'"nl" must be "{w["art"]} {w.get("word")}" (article + word)')
                if w.get('id') and not w['id'].startswith(f'h{n}-{w["art"]}-'): bad(where, f'noun ids look like h{n}-{w["art"]}-<word>')
            elif 'art' in w: bad(where, 'art must be de or het')
        if w.get('pos') == 'verb' and w.get('sep') and '…' not in w['sep']: bad(where, 'sep looks like "steek … over" (with …)')
        if w.get('irr') and (not isinstance(w['irr'], list) or len(w['irr']) < 5): bad(where, 'irr is [ik, jij, hij, wij, jij after the verb] e.g. ["ga","gaat","gaat","gaan","ga"]')
        if w.get('new') and not DATE.match(str(w['new'])): bad(where, '"new" must be a date like 2026-10-25')
        if w.get('id'): take(w['id'], where)
    for s in c.get('sentences', []):
        where = f"{name} {s.get('id')}"
        for k in ('id', 'nl', 'en'):
            if not s.get(k): bad(where, f'sentence is missing "{k}"')
        if s.get('id') and not s['id'].startswith(f'h{n}-s-'): bad(where, f'sentence ids look like h{n}-s-<short-slug>')
        if s.get('nl') and not re.search(r'[.?!]$', s['nl']): bad(where, 'a sentence ends with . ? or !')
        if s.get('new') and not DATE.match(str(s['new'])): bad(where, '"new" must be a date like 2026-10-25')
        if s.get('id'): take(s['id'], where)
    for r in c.get('reading', []):
        where = f"{name} {r.get('id')}"
        for k in ('id', 'nl', 'text'):
            if not r.get(k): bad(where, f'reading text is missing "{k}"')
        for q in r.get('questions', []):
            if not q.get('q') or not q.get('a'): bad(where, 'every question has "q" and "a"')
R = load(ROOT + 'content/rules.json')
if R:
    for r in R.get('rules', []):
        for k in ('id', 't', 'en', 'x', 'ex'):
            if k not in r: bad(f"rules.json {r.get('id')}", f'missing "{k}"')
        take('rule:' + str(r.get('id')), 'rules.json')
    words = {w.get('nl', '').lower() for f in glob.glob(ROOT + 'content/ch*.json') for w in (json.load(open(f, encoding='utf-8')).get('words') or [])}
    lex = R.get('lexicon', {})
    for k, key in (('nouns', 'nl'), ('adjectives', 'nl'), ('verbs', 'inf')):
        for x in lex.get(k, []):
            if str(x.get(key, '')).lower() in words: bad('rules.json lexicon', f'"{x.get(key)}" is now a word in a chapter: remove it from the lexicon')
E = load(ROOT + 'content/exam.json')
if E:
    if not DATE.match(str(E.get('date', ''))): bad('exam.json', '"date" must be like 2026-10-29')
    if not isinstance(E.get('scope'), list): bad('exam.json', '"scope" is the list of chapters, e.g. [1, 3, 4, 5]')
    for d in E.get('drills', []):
        for k in ('id', 'code', 'nl', 'en', 'task'):
            if k not in d: bad(f"exam.json drill {d.get('id')}", f'missing "{k}"')
    for p in E.get('places', []):
        for r in p.get('rules', []):
            if r.get('kind') not in ('moet', 'mag', 'geen', 'niet'): bad(f"exam.json {r.get('id')}", 'kind must be moet, mag, geen or niet')
            take(str(r.get('id')), 'exam.json places')
if P:
    print(f'✗ {len(P)} problems in content/:'); [print('  ' + p) for p in P]; sys.exit(1)
print(f'✓ content/ looks right: {len([i for i in ids if not i.startswith("rule:")])} ids, no duplicates')
