#!/usr/bin/env python3
"""Full-vector audit of every deck: schema, ids, enums, banned copy, envelopes."""
import json, re, glob, collections, os

BANNED = [r"reconnect", r"\brepair\b", r"\bhealing\b", r"communication exercise",
          r"emotional intimacy", r"therapy", r"therapist"]
TYPES = ['truth', 'dare', 'challenge', 'ice', 'topic']
LEVELS = {'spark': [1, 2], 'closer': [2, 3], 'slowburn': [3, 4],
          'afterdark': [4], 'curious': [4], 'inferno': [4]}
LOVES = ['words', 'time', 'touch', 'service', 'gifts']
STILTED = re.compile(r'^Invite (them|a|an) ')

allids = set()
dup = []
tot = 0
errs = []
per = {}
for f in sorted(glob.glob('content/decks/*.json')):
    deck = os.path.basename(f)[:-5]
    j = json.load(open(f, encoding='utf-8'))
    if j['id'] != deck:
        errs.append(f'{f}: deck.id != filename')
    if not isinstance(j.get('adult'), bool):
        errs.append(f'{f}: missing adult boolean')
    if deck in ('afterdark', 'curious', 'inferno') and j['adult'] is not True:
        errs.append(f'{f}: extreme deck not adult')
    counts = collections.Counter()
    texts = collections.Counter()
    for c in j['cards']:
        tot += 1
        cid = c['id']
        counts[c['type']] += 1
        if cid in allids:
            errs.append(f'{cid}: duplicate id')
        allids.add(cid)
        if not cid.startswith(deck + '-'):
            errs.append(f'{cid}: bad id prefix')
        if c['type'] not in TYPES:
            errs.append(f'{cid}: bad type')
        if c['level'] not in LEVELS[deck]:
            errs.append(f'{cid}: level {c["level"]} not in {LEVELS[deck]}')
        if c['text'].strip() != c['text']:
            errs.append(f'{cid}: stray whitespace')
        if len(c['text']) > 160:
            errs.append(f'{cid}: text {len(c["text"])} chars')
        if any(re.search(b, c['text']) for b in BANNED):
            errs.append(f'{cid}: banned word')
        if STILTED.match(c['text']):
            errs.append(f'{cid}: stilted opener')
        if 'speak' in c and len(c['speak']) > 120:
            errs.append(f'{cid}: speak too long')
        if c['type'] in ('dare', 'challenge') and not c.get('soften'):
            errs.append(f'{cid}: missing soften')
        if c.get('soften') is not None and not isinstance(c['soften'], str):
            errs.append(f'{cid}: soften not string')
        if c.get('timebox') is not None and not (10 <= c['timebox'] <= 1500):
            errs.append(f'{cid}: timebox {c["timebox"]}')
        if c.get('bomb') is not None and not isinstance(c['bomb'], bool):
            errs.append(f'{cid}: bomb not bool')
        if c.get('love') not in LOVES:
            errs.append(f'{cid}: love invalid')
        texts[c['text'].lower().strip()] += 1
    dup += [k for k, v in texts.items() if v > 1]
    per[deck] = (len(j['cards']), j['adult'], dict(counts))

print(f"{'deck':12} {'cards':>5} {'adult':>6}  types")
for d, (n, adult, counts) in per.items():
    print(f"{d:12} {n:5} {str(adult):>6}  " + " ".join(f'{k}:{counts.get(k,0)}' for k in TYPES))
print()
print('TOTAL cards', tot, '| unique ids', len(allids), '| decks', len(per))
print('duplicate texts anywhere:', len(dup))
for t in dup[:5]:
    print('   ', t[:90])
print('ERRORS:', len(errs))
for e in errs[:30]:
    print('   ', e)