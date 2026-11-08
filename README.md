# Ember

A couples party game for one phone and a TV. Truth, dare, challenges, ice breakers, and conversation cards that escalate from laughs to heat — built to get two people sitting down, wrapped around each other, actually talking.

## Play it

```bash
npm install
npm run dev        # http://127.0.0.1:5173
```

or build + preview:

```bash
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

Open the URL on a phone, cast or mirror the screen to a TV, and pass the phone. Installable as a PWA; plays offline after first load; zero network calls in play; zero backend; nothing leaves the device.

## The decks

| Deck | Heat | What it is |
|---|---|---|
| Spark | warm | easy laughs, light touches, a few surprises |
| Closer | connect | real conversation that feels like winning |
| Slow Burn | flirty | sensual truths, kissing games, tension |
| After Dark | 18+ | intense, all invitation |
| Curious | 18+ | kink exploration for two curious people |
| Inferno | 18+ | all spice bombs — you were warned (literally) |

Modes: **Chill** (spark+closer) · **Mixup** (everything shuffled) · **Heat** (the hot decks) · **Inferno** (all bombs, warning screen before entry).

## Mechanics

- **Five card types:** TRUTH · DARE · CHALLENGE (both play) · ICE BREAKER · TOPIC
- **`speak:` dares** — a second line delivered *while* the dare happens: physical act + meaningful words at the same time
- **Soften** — every dare and challenge ships with a lower-heat variant, one tap away
- **Skip economy** — 6 skips a night, shown as dots, always shameless
- **Spice bombs** — cards hotter than their deck's baseline, occasionally favored by the draw
- **Love languages** — every card is tagged; decks must cover all five
- **Celebration ending** — every night ends warm, by design

## Content-as-code

Decks are JSON in `content/decks/`, linted by `scripts/lint-decks.mjs` (schema, dupes, length caps, banned words, soften coverage, love-language coverage). 730 cards across six decks: Spark 100 · Closer 100 · Slow Burn 100 · After Dark 130 · Curious 150 · Inferno 150. House style lives in [CONTENT-GUIDE.md](./CONTENT-GUIDE.md).

```bash
npm run lint:decks
```

## Stack

Vite + Svelte 5 + TypeScript, static build, no framework overhead beyond that. State is one module and one localStorage key. Deploy the `dist/` folder anywhere static.

## Verify

```bash
npm test           # engine + persistence invariants (989 assertions, no extra deps)
npm run build      # real Svelte compile
npm run lint          # deck structure/voice + the card text-fit envelope
npm run lint:decks    # all six decks: counts, levels, banned/clinical language
```

`tests/resume.journey.mjs` is a real-browser check of the mid-night resume path
(needs `npm run preview` on :4173):

```bash
node tests/resume.journey.mjs
```

Android packaging order matters — `npx cap sync` copies the current `dist/`, so
running it before a rebuild packages the *previous* bundle (blank screen, no
error anywhere). Then verify before installing:

```bash
npm run build
npx cap sync android
npm run verify:apk     # APK vs dist/index.html; exit 1 = stale bundle
npm run verify:staging # same, against android/app/src/main/assets/public
```

`npm run lint` also enforces the fit envelope: the card is `overflow:hidden` with no
scrollback, so text that does not fit is silently cut. `scripts/lint-fit.mjs` caps
effective length (text + 1.6 × speak + timer) at the 260-char `xs` boundary, which is
the point where a card stops fitting the smallest phone. Currently the widest card is
249 (slowburn-056), so every deck is inside the envelope.

Images, audio, and the Android package are not covered by these.
