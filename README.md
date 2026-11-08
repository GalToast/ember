# Ember

A couples party game for one phone and a TV. Truth, dare, challenges, ice breakers, and conversation cards that escalate from laughs to heat — built to get two people sitting down, wrapped around each other, actually talking.

**Live: https://galtoast.github.io/ember/** — installable PWA, plays offline, zero backend, nothing leaves the device. Android APK via Capacitor (sideloaded).

## The decks

800 cards across six decks (+ your own):

| Deck | Heat | Cards | What it is |
|---|---|---|---|
| Spark | warm | 100 | easy laughs, light touches, a few surprises |
| Closer | connect | 100 | real conversation that feels like winning |
| Slow Burn | flirty | 100 | sensual truths, kissing games, tension |
| After Dark | 18+ | 150 | explicit — sex exploration, all invitation |
| Curious | 18+ | 150 | kink exploration for two curious people |
| Inferno | 18+ | 200 | all spice bombs, hardcore — you were warned (literally) |
| **Our Deck** | yours | ∞ | cards you write in-app, dealt into every mode |

Modes: **Chill** (spark+closer) · **Mixup** (everything shuffled) · **Heat** (the hot decks) · **Inferno** (all bombs, warning screen before entry) · **Pass-the-Phone** (private cards each player reads alone).

## Mechanics

- **Five card types:** TRUTH · DARE · CHALLENGE (both play) · ICE BREAKER · TOPIC
- **`speak:` dares** — a second line delivered *while* the dare happens: physical act + meaningful words at the same time
- **Soften** — every dare and challenge ships with a lower-heat variant, one tap away
- **Skip economy** — 6 skips a night, shown as dots, always shameless
- **Command tokens** — 3 each per night; spend one and the next card is *yours to command* (no skip, no soften). Unspent tokens compound: the celebration names the debt, paid before the week ends
- **Pass-the-Phone** — sealed private cards (press-and-hold to read, 3 presses to latch); handoff screen between players; resume never leaks a private card
- **Spice bombs** — cards hotter than their deck's baseline, occasionally favored by the draw
- **Love languages** — every card is tagged; draw-time balancing keeps all five flowing
- **Browse mode** — flip through any deck without starting a night; retire cards on sight
- **Our Deck** — write your own cards in-app (live house-rule validation, author attribution, export/import as JSON)
- **Sound** — Web Audio synthesis: deal whoosh, bomb sting, timer ticks, celebration swell; mute toggle persisted
- **Celebration ending** — every night ends warm, by design (peak-end rule, enforced by the engine)

## Content-as-code

Decks are JSON in `content/decks/`. House style lives in [CONTENT-GUIDE.md](./CONTENT-GUIDE.md). The gate battery:

```bash
npm test               # engine + persistence invariants (1061 assertions, no extra deps)
npm run lint           # deck lint + fit envelope (see below)
npm run lint:decks     # schema, levels, banned/clinical words, sense gates (my/I, slash),
                       # anatomy-neutral, soften coverage, love coverage, dupes
node scripts/near-dupe-audit.mjs   # trigram near-duplicate scan (exit 1 on a pair > 0.85)
```

Every gate that exists caught a real defect at least once. `npm run lint` also enforces
the fit envelope: the card is `overflow:hidden`, so text that doesn't fit is silently cut —
`scripts/lint-fit.mjs` caps effective length (text + 1.6 × speak + timer) at 260.

## Journey tests (real browser, Playwright)

```bash
npm run preview -- --port 4173     # then:
node tests/resume.journey.mjs      # mid-night resume
node tests/browse.journey.mjs      # deck browser + retirement persistence
node tests/tokens.journey.mjs      # command tokens + finale
node tests/passthephone.journey.mjs# private cards + handoff + resume privacy
node tests/sound.journey.mjs       # audio wiring + mute persistence
node tests/custom.journey.mjs      # write/validate/persist/draw custom cards
```

## Android packaging

Order matters — `npx cap sync` copies the current `dist/`, so running it before a
rebuild packages the *previous* bundle (blank screen, no error anywhere). Then verify:

```bash
npm run build
npx cap sync android
npm run verify:apk     # APK vs dist/index.html; exit 1 = stale bundle
npm run verify:staging # same, against android/app/src/main/assets/public
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## Stack

Vite + Svelte 5 + TypeScript, static build. State is one module + a handful of
localStorage keys (names/nights/retired, live night, custom deck, mute). Deploy
`dist/` anywhere static; GitHub Pages deploy runs the gates on every push to master
(.github/workflows/deploy.yml).
