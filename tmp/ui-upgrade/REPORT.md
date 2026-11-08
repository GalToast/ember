# Ember UI upgrade pass — report

Scope: UI only. Edited files confined to the allowed list; `content/`, `src/App.svelte`, `src/lib/game.svelte.ts`, `src/lib/schema.ts`, `scripts/`, `tests/`, `android/`, `package.json`, `capacitor.config.ts` untouched. No new npm dependencies, no emoji, no external fonts/icons. All `data-testid` attributes preserved.

## Changes per file

**`src/lib/haptics.ts` (new)**
- `haptics.next()` → 12ms vibrate (card fly-out on "next"), `haptics.skip()` → 8ms (fly-out on "skip"), `haptics.bomb()` → double 10ms pulse 18ms apart when a spice bomb is dealt. Wraps `navigator.vibrate` with existence + try/catch guards so it's a silent no-op on desktop/restricted WebViews.

**`src/components/Card.svelte`**
- Deal-in: `.deal` keyframes retuned to 260ms `var(--spring)`, scale 0.92→1 + translateY 10px→0 (was 0.45s with rotate). Inner content staggers via `deal-reveal` (fade 0.9→1 + lift 8px→0, 260ms): meta 40ms → text 80ms → speak 120ms → timer/safeword 160ms, so badge/pop leads and content lands after the card settles.
- Heat styling: bomb cards get an ember-tinted glass gradient (`rgba(255,122,61,0.10)` → `rgba(255,82,115,0.06)` over `--glass-strong`), warm hairline at full opacity, a faint centered ember radial (`::before`) behind text, warmer border, and a soft outer shadow; level-4 non-bomb gets a subtler warm edge (`--l4` class). Text stays `--ink` on dark bg (WCAG-solid contrast preserved).
- Speak block as "whisper": smaller, wider-tracked, dimmer label; larger italic display type (`clamp(18px, 3.2vmin, 30px)`, `--font-display`, weight 450, `--ink`); soft ember left-edge glow via `border-left` + inset shadow.
- Haptics wired: bomb pulse on fresh deal (`$effect` over `shown.bomb`), `next()`/`skip()` in `flyCard()`. Bomb-guard state prevents re-pulse on soften toggle.
- Timer ring: urgent (≤10s) now shifts color ember-soft → p2 with brightness pulse (`pulse` keyframe, 1.2s); done state ("take your time anyway") is calmer — `--ink-dim`, inset shadow, no animation. Respects `prefers-reduced-motion` via the existing global rule in `app.css`.

**`src/app.css`**
- `.deal` animation: 0.26s `var(--spring)`, scale 0.92 → 1 (was 0.45s with rotation).

**`src/components/Setup.svelte`**
- Mode pills: `:active` scale-down, `:focus-visible` ember ring, stronger on-state glow, `--ink` name / `--ink-dim` blurb when on.
- Deck chips: tighter density (6px 12px padding, 36px min-height), new `.dchip.on` selected state with ember gradient + glow, adult on-state variant, `:active` + `:focus-visible`. Safeword input kept.
- Inferno warning panel: deeper gradient, stronger ember border, outer + inset glow. `data-testid="inferno-warning"` preserved.

**`src/components/Splash.svelte`**
- Slow breathing scale (`scale 1 → 1.05 → 1`, 7s ease-in-out) on the heart wordmark; `:hover` lift + stronger shadow on the primary button; `:active` scale.

**`src/components/Celebration.svelte`**
- Panel gets a warm ember outer glow (`--shadow-card` + 40px rgba(255,122,61,0.10)); `.stat` card count has a CSS count-up pop-in (`countup` keyframe); history chips (`h-chip`) get warm hover glow/scale.

**`src/components/Mesh.svelte`, `src/components/Icon.svelte`, `index.html`**: intentionally untouched — not in the ranked work and no change required.

## Screenshots (tmp/ui-upgrade/, Playwright Chromium against local preview on :4174)

- `phone-setup.png` / `tv-setup.png` — setup at 390×844 and 1280×720
- `phone-setup-names.png` — both names filled (Fred / Christen)
- `phone-splash.png` / `tv-splash.png` — splash after start
- `phone-card1.png` / `phone-card2.png` / `phone-card3.png` — three dealt cards; card1 carries a timeboxed timer (urgent ring reachable)
- `tv-card1.png` — tv-viewport card
- `console-errors.txt` — empty (no console/page errors during the journey)

## Verification outputs

- `npm run build` — exit 0, 132 modules transformed, dist/ emitted (2.09s). Pre-existing dynamic-import warning only (same pattern already in App.svelte).
- `npm test` — 988 passed, 1 failed (`600 cards — got 730, want 600`). This failure is PRE-EXISTING and NOT caused by this change: the content lane expanded afterdark/curious to 150 cards each (730 total; working-tree modifications to `content/decks/afterdark.json` and `curious.json` predate this session), so the hardcoded "600 cards" assertion in `tests/game.test.mjs` is stale. `tests/` and `content/` are off-limits per the hard bans, so I did not touch them. All other 988 assertions pass (well above the 859+ floor); deck lint (`lint:decks`) and fit lint (`lint:fit`) both pass.
- `npm run lint` — exit 0: "LINT PASSED: all decks clean" + "FIT OK — 730 cards across 6 decks, max effective length 249 <= 260".
- Visual smoke — no console/page errors on phone or tv viewports; all screenshots captured.

## Deliberately skipped

- Per-frame JS motion: none added — everything is CSS animation/transition (honors `prefers-reduced-motion`).
- Mesh.svelte / Icon.svelte changes: no ranked item required them; left as-is to keep the diff minimal.
- `index.html`: no change needed.
- APK/device work (`adb`, cap sync, gradle): explicitly out of scope for this lane (main lane owns packaging/delivery).

GOAL: MET — all eight ranked UI polish items implemented within the allowed files; build, lint, and 988/989 assertions pass (the single failure is a pre-existing, off-limits content-deck-count assertion); Playwright smoke screenshots captured cleanly on both viewports with no console errors.