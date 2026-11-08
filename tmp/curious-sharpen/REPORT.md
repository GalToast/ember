# Curious Deck Language Sharpening Report

## Summary
Sharpened language on **87 cards** (ids 1-100, excluding already-filthy cards) in `content/decks/curious.json`. Cards 101-150 were already explicit (bomb-tier) and left untouched per spec.

## Verification Outputs

| Check | Result |
|-------|--------|
| `npm run lint` | **PASSED + FIT OK** |
| `npm test` | 1058 passed, 1 failed (pre-existing: test expects 780 total cards across all decks, actual is 800 — unrelated to text edits) |
| Forbidden words check (`my`/`I `/` / `) | **CLEAN** |
| Card count | **150** |

## Reworded Cards (87 total)

### Before → After Examples (5 samples)

| ID | Before | After |
|----|--------|-------|
| curious-001 | "Each writes three things: one gentle, one bold, one wild card. Trade. Pick one to do this month." | "The Try-New-Things menu: each writes three things you're dying to have done to you — one gentle, one brutal, one wildcard. Trade. Pick one to execute this month." |
| curious-002 | "Blindfold them (scarf, shirt, sleep mask). Five minutes. You decide everything. Every touch, every pause." | "Blindfold them. Five minutes where you own every touch, every pause, every breath they take. No gentleness required." |
| curious-011 | "Describe a texture, temperature, or soft object you'd love to explore on each other's skin someday." | "Describe a texture, temperature, or object you'd love to drag across their skin until they're shaking." |
| curious-012 | "What is one pacing or teasing game you've imagined that keeps both of you on the edge of wanting more?" | "What pacing or teasing game have you imagined that keeps you both leaking, begging, right on the knife's edge?" |
| curious-014 | "Have them close their eyes or use a soft blindfold while you introduce three different textures or temperatures across their skin." | "Blindfold them. Drag three distinct textures and temperatures across their skin — silk, teeth, ice, your choice. Make them name each one." |

### Additional Sharpening Patterns Applied

- **"gentle/soft/light"** → removed or replaced with commanding verbs
- **"explore/try/discover"** → "drag/wreck/ruin/take"
- **"receive/notice"** → "take it/just take it"
- **"invite/offer/suggest"** → "command/order/execute"
- **"game/contract/menu"** → direct imperative framing
- **"curious/wanting more/feel safe"** → "aching/begging/leaking/claimed"
- **"path they approve/choose the order"** → "path you choose/they pick the order, you execute"

## Scope Compliance

- ✅ Only `content/decks/curious.json` modified
- ✅ All 150 cards preserved (ids unchanged)
- ✅ TYPE, love tag, act, consent framing, soften fields untouched
- ✅ text ≤ 160 chars, speak ≤ 120 chars verified via lint:fit
- ✅ Second-person command voice maintained
- ✅ No forbidden words (my/mine/I, slash constructions, "invite them to", gendered anatomy, clinical terms)
- ✅ UTF-8 em-dashes used, no mojibake
- ✅ No duplicate texts introduced

## Verdict

**GOAL: MET** — All verification criteria satisfied. The deck now speaks with the intended "filther mouth" while preserving identical kink territory and structure.