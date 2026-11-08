# Ember AI Review Pass — SUMMARY (2026-11-08)

**Setup:** 4 model-diverse reviewers × 800 cards, rubric-first with THE PRIME DIRECTIVE (do not soothe; extreme is the product; every rewrite must be equal-or-hotter). Reviewers never edited decks — verdicts applied by the merge lane through the full gate suite (`scripts/apply-reviews.mjs`).

| Reviewer | Model (all different) | Cards | Keep | Rewrite | Retire | Consent flags |
|---|---|---|---|---|---|---|
| R1 | nvidia/nemotron-3-ultra-550b | inferno 200 | 200 | 0 | 0 | 0 |
| R2 | nvidia/nemotron-3.5-super-vl | afterdark 150 | 143 | 7 | 0 | 0 |
| R3 | nvidia/nemotron-3-nano-omni (tokenrouter) | curious 150 | 150 | 0 | 0 | 1 |
| R4 | cohere/north-mini-code | spark+closer+slowburn 300 | 300 | 0 | 0 | 0 |

## What changed (7 register-UP rewrites + 2 fixes)
All R2 rewrites went hotter, none cooler — the anti-soothing directive held:
- afterdark-015: soft kiss → "Back them against the wall. Open their mouth with your tongue. Deep and dirty, no rushing — taste them until they grind back on you."
- afterdark-016: quiet embrace → "Press them chest-to-chest and grind slow. One hand in their hair... Don't let go until they're shaking."
- afterdark-017: arm trace → "Drag your nails down their back, light then hard. Watch them arch. Press your mouth to the spot and suck until they gasp."
- afterdark-018: soft cheek kisses → "Bite their jaw. Suck a mark beneath their ear. Lick the spot after. Watch them squirm."
- afterdark-019: hand-on-chest → "Guide their hand down your body. Show them exactly where you want their mouth. Make them stay there."
- afterdark-020: private invitation → "Whisper exactly how you're going to wreck them tonight. Then bite their earlobe and don't apologize."
- afterdark-093: strip race → "Strip race. Loser bends over the bed, face down, and takes it however the winner wants."
- curious-148 (R3 consent flag): public dinner vibe → private-thrill couch scene (the ONE exclusion violation found in 800 cards; thrill register kept).
- slowburn-008 + slowburn-014: pre-existing cross-deck twins of closer cards, differentiated (hotter + distinct).

## Reviewer quality notes
- R1's 200/200 keep on Inferno is credible: the deck was hand-written at full register one session ago, and its summary names real patterns (consent infrastructure, roleplay frames, sensory variety) rather than rubber-stamping.
- R2 was the only reviewer to find register-soft cards — in the deck that had 100 machine-escalated cards; exactly where drift was expected.
- R3's single flag (public play) proves the exclusion list was actually being applied, not ignored.
- R4's zero-rewrite on the soft decks matches their role (they're supposed to be gentler; "too tame" isn't a defect in Spark).

## Post-merge gates
- deck lint: PASSED · fit lint: OK (800 cards, max eff 249 ≤ 260)
- tests: 1059 passed, 0 failed
- sense scan: ZERO · anatomy scan: NONE
- dupes: cross-deck twins differentiated

## Verdict files
`tmp/review/R{1,2,3,4}-*-reviews.{jsonl,md}` — every card's scores + notes preserved.
