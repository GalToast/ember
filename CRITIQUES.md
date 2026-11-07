# Ember — 10 Critiques (2026-11-07, self-audit pre-fix)

Honest self-critique from code + product inspection. Each gets addressed in the same session.

1. **Mid-game state dies on interruption.** A call, app switch, or Android killing the process 15 minutes into a night loses the card, skip count, and seen-deck — only completed nights persist. A couples app that punishes interruption is backwards.
2. **Love languages are tagged but never used at draw time.** The lint checks per-deck coverage, but a single night can serve five touch cards in a row and starve words/service. The tag is decoration, not mechanics.
3. **The "our nights" log is collected but invisible.** Celebration shows tonight's count, but the history (the proof-that-it's-working fuel from the plan) is stored and never shown. No nights-view, no streak, no accumulation moment.
4. **The warm ending is a design promise, not an engine feature.** Peak-end rule is in CONTENT-GUIDE.md but `end()` jumps straight to celebration — the last card of the night is whatever you happened to be on.
5. **Spice bombs are randomly paced.** 1-in-5 weighting per draw means three bombs in a row or fifteen draws with none. Escalation needs rhythm, not dice.
6. **The consent gate from the plan never shipped.** v2.2 promised "we're both in?" + optional safe word on Inferno. Shipped: a warning panel only. The safe-word concept exists in card copy but the app never asks for one.
7. **No "never again."** A card that lands badly comes back later (the seen-set resets when the deck exhausts). For two people with real sensitivities, permanent retirement of specific cards is a trust feature, not a nicety.
8. **Modes are fixed bundles.** You cannot play "just Slow Burn" or "only Curious tonight" — Chill/Mixup/Heat/Inferno are hard-coded deck sets. Couples develop favorites; the app can't follow.
9. **The chime may be silent on first fire.** `new AudioContext()` is created at timer-end — mobile WebViews require the context to be created/resumed after a user gesture, so the first chime of a night may be blocked by autoplay policy.
10. **Names are collected and never used.** Setup asks for Fred and Christen; no card, no screen, no dare ever says their names. The plan promised personalization; the app stores two strings and ignores them.

Known and parked by owner decision (not counted): two-phone mode (plan §14), sound design, hosting.
