# Ember self-play QA — FINDINGS (2026-11-09, automated drives + screenshot review)

Played: first-run onboarding → Mixup night (12 cards over 2 drives) → Inferno night →
Pass-the-Phone (reveal + handoff) → Browse → Our Deck builder → release token popover →
landing/celebration → kill/resume → deck-exhaustion probes → back-swipe skip probe.

## Fixed this session (verified by build + all-green suites)
1. **Warm-landing repeat bug (real defect, found by screenshot comparison).** The landing's
   fallback pool ignored the seen-set, so a long night could end on a card played earlier
   that same night (drive1: card 1 repeated as the landing). Fixed: fallback now picks the
   OLDEST-seen gentle card — the landing can echo the night's beginning (poetic) but never
   the recent past.
2. **Same-type run cap (pacing defect).** drive2 drew 4 ICE cards in 5 (love-balancer
   concentrated on a starved love whose sub-pool is all-ICE). Fixed: `lastType`/`typeRun`
   tracking in NightState; draw() now forbids a 3rd consecutive same-type card.
   Post-fix drive2: DARE/BOMB/TOPIC/DARE/CHALLENGE/BOMB/ICE/TOPIC — varied.
3. **Release-popover grammar (b-branch).** "Christen hold the release" — suffix ternary
   keyed on holder=='a' instead of name presence. Fixed: 's' whenever a name renders.
4. **Skip vs Never-again icon collision (found on screenshot).** Both dock buttons used the
   X icon. Added `ban` (slashed circle) to Icon.svelte; Never-again now distinct.

## Verified good (no action)
- Onboarding flow: names → "Get close" cuddle modal → mode pick. Copy is warm, correct.
- Inferno gate: warning card + optional safe word + "Light it" — consent UX intact.
- PTP: 3-press reveal works; "yours until you pass"; handoff screen hides the read card.
- Kill/reload → resume offered, seen-set intact, no leaks.
- Deck exhaustion: graceful recycle by design (seen resets, pool refills) — night never dies.
- True-exhaustion (all retired): end() fires, celebration shows. No dead ends.
- Back-swipe = skip works via pointer events (6→5 verified); vertical intent handed back
  to native scroll correctly.
- Our Deck builder: validation live, Export/Import present, author attribution.
- Sound: mute persists; timer chime present on challenge cards.
- Zero console/page errors across every drive.

## Viewport matrix (drive6/6b + probes, 2026-11-09)
- Landscape phone (844x390): setup renders (earlier blank shot = headless capture timing
  during the 0.5s enter animation, NOT an app bug — re-verified at +1.5s twice), card + dock
  fit, celebration fine.
- Tablet (1280x800): full flow, zero errors.
- Desktop (1920x1080): full flow, zero errors — setup is genuinely handsome at this width.
- Overflow: 0px horizontal and vertical at every width; dock never clipped.

## Taste-gated (for Fred, not fixable by machine)
- ICE density in Chill feels high if both players are talkative — could cap ICE per-N-night.
  (left alone: Chill is *supposed* to be the talky mode)
- The landing card after Inferno comes from spark/closer — the tonal drop is intentional
  (peak-end rule) but some couples may want an After Dark landing variant.

## Not reproduced / not bugs
- drive4's "NO CARD" exhaustion shot was PTP handoff state, not a draw failure.
- drive1's Chill-click failure was my driver's selector, not the app.
