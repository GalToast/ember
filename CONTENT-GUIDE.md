# Ember Content Craft Guide

The house style for every card, deck, and future expansion. One sentence rules all:

> **The app does real relationship work while feeling like a party game. The work is smuggled inside joy — never labeled, never explained.**

## The six disguise patterns (how therapy hides inside a game)

1. **Prop framing** — put the emotional load on an object, not the person. Magic wands, wish grants, menus, trading cards, heist roles. "Make one wish about us out loud" is easier to say than "state your unmet need" — and it's the same sentence.
2. **Rule framing** — therapeutic mechanics become GAME RULES. "The listener's only job is to listen — no fixing, no comebacks" is not counseling, it's a rule, like "no looking away." Rules apply to everyone, so nobody feels like the patient.
3. **Distance framing** — movie-trailer voice, "if our relationship were a song right now, what's playing?", "describe us as a weather system." Projection lets true things get said at a safe distance — and then they're out in the room.
4. **Currency framing** — vulnerability pays. Deep answers earn wildcard tokens, immunities, granted wishes. "I want/need" becomes the winning move, not the scary one.
5. **Physical anchor** — hard truths are delivered during hand-holding, gaze, back-to-back sitting. The body soothes while the words work. Never ask for a hard truth from across the room.
6. **Peak-end enforcement** — the night ALWAYS ends on a warm card, by design. The memory of the night is engineered to be a good one (peak-end rule).

## The "I want / need" family (use across decks)

Need-expression is a core mechanic, dressed as fun:

- **Wish cards** — "Make one wish about us out loud. Grantor answers either 'wish granted' (this week) or 'wish deferred' (name a date). No negotiating, no explaining." Trade roles.
- **Menu cards** — "Build each other a three-item menu: one thing you want more of, one you want less of, one you're curious to try. Trade menus. Each picks one item off the other's menu to 'order' this week."
- **Trade cards** — "Finish this: 'I want more of ___ from you, and in exchange I'll give you ___.'" Trades feel like fair deals, not complaints.
- **Wildcard economy** — answering a deep card earns a wildcard token: swap any future dare, no cost. Deep = rich.
- **Open slot cards** — "Finish this out loud: 'I've been wanting to tell you…'" / "'What I actually need when I'm quiet is…'" Fill-in-the-blank beats open essay questions — the blank does the work.

## Difficult-issue cards (the healing spine — disguised)

Real therapy moves, invisible labels:

| Real move (never named) | Card form |
|---|---|
| Soft startup ("I feel X about Y, I need Z") | Prop: magic wand — "Each wave the wand and say one thing you'd change about us. Wand-holder's only job: say 'ok' and log the wish. No defending. Wishes get re-read next month." |
| Listener mirroring | Rule: "One true thing each, 60 seconds. Listener repeats it back in their own words before responding. Then swap." |
| Turning toward bids | "Tell them about something this week you almost didn't mention that you actually wanted them to ask about. They now get to ask." |
| Fondness & admiration | "Say the specific thing they did this week that you keep replaying in your head. Specific or it doesn't count." |
| Acknowledgment / repair attempt | "Hold their hands and say the thing you'd take back if you could — not to win anything, just so they hear it." |
| Dreams within conflict | "What's something you want for US that we've never said out loud because it felt too big? Say it small first." |
| Missed bids / distance | "What's something you miss that we used to do — not from lack of trying, just life? Name it. It goes back on the calendar this week." |

**Hard rules for this family:** never assign blame; never ask "why did you stop caring" style traps; listener roles are always game rules; every hard card has a soften variant ("skip straight to the wish" etc.); max ~1 hard card per 10 draws (the draw engine doesn't need to enforce this — curation keeps the density right).

## Spice bombs

A `bomb: true` card is hotter than its deck's baseline — the "OH!" moment. Rules:
- ~1 in 5 cards in Spark/Closer may be bombs (levels above baseline).
- Draw engine occasionally (1-in-5) favors bombs when available — keeps decks unpredictable.
- Bombs follow the same consent rails as everything: soften variant present, no body-commanding, invitation not order.
- Inferno is ALL bombs, all extreme, warning screen before entry, its own mode — never sprinkled into general draws.

## Never (hard bans)

- Clinical words: reconnect, repair, heal, therapy, communication exercise, emotional intimacy, boundaries-talk.
- Scorekeeping, "who's right", comparisons to exes or other people.
- Gender-role scripts, porn-cliché phrasing, body-part commanding.
- Anything that reads like a greeting card. Concrete beats abstract, always.
- Any card that can become a weapon in a tense moment.

## The v2.4 voice escalation (Inferno + 18+ decks)

The 18+ register is now **filthy but anatomy-neutral, and always direct**:

- **Direct command voice.** No "Invite them to…" / "Offer a…" stilted prefixes anywhere (lint warns on them). A card is the dare: "Edge them, hold them right there, count down slowly from twenty."
- **Raunch vocabulary**: beg, ache, wreck, ruined (the orgasm sense), soaked, desperate, trembling, own/owned, use, greedy, fuck (as a verb: "fuck them slow", "fuck your mouth", "ride them until they're shaking"). Words do the work the old euphemisms did.
- **Anatomy stays neutral.** No gendered anatomy (no cock/pussy), no gender-role scripts, {a}/{b} or "they/them" only. "On your knees", "your mouth", "inside you", "between your legs" are the register — filthy is achieved through verbs and heat, not body-part naming.
- **"slut" sparingly** and ONLY inside a loving consensual dirty-talk frame (e.g. "Use your words like a good little slut"). Never "whore", never body-shaming, never as an insult.
- **speak: lines are the filth carrier** — first person, imperative-adjacent, short ("Not yet. You come when I decide you've earned it.").
- **Hard-excluded territory** (house rule, matches consent rails): breath play/choking, blades, required intoxication, third parties physically present, anything involving strangers or the public, anything illegal.
- **Encoding**: decks are UTF-8 with literal em-dashes (—). Never let a CP1252 mojibake (â€") into a card — the 2026-11-08 merge corrupted 40 strings that way before it was caught. If a rewrite tool escapes or mangles punctuation, fix the encoding before committing.
- Extreme territories now covered: command-token economies, orgasm-on-command practice, edging ladders with counted edges, ruined-and-owed rounds, wax (low-temp), rope/scarf restraint, tease torture (one-finger/no-hands/freeze rounds), praise under stimulation, filming-then-deleting together, car/window semi-private frames, position gauntlets, worship circuits, aftercare-in-the-filthiest-voice.

## The v2.5 hardcore pass (register rules, learned from the owner's taste verdict)

The owner's verdict on v2.4: some cards don't make sense, and the language should be rougher with much more explicit cards — "hard core". Rules this locks in:

- **Sense-audit gates every deck** (part of lint now): no card may force an impossible choice ("them inside you / to be inside them"), flip narrator mid-card, or address an undefined "me". Scan: `\bmy\b`, `^I `, ` / ` constructions outside quoted speech = flag.
- **Quoted speech is the only first-person zone.** "Kiss my neck" inside a command example is correct; a narrator saying "Give me..." is not.
- **The 18+ decks do not do polite.** A card in After Dark/Inferno/Curious that could appear in a PG-13 game un-escalated is a bug. Escalate the act in the card, not around it: massage → "push them onto their back and take them slowly with your mouth"; "describe how it feels when they say your name" → "mid-fuck, they say your name — describe exactly what that does to your body".
- **Filth = verbs + specificity, still anatomy-neutral.** "fuck" (verb) required, "come" freely used, spit/ruin/use/wreck/beg/own encouraged; gendered anatomy and gender roles stay banned.
- **Hardcore territories unlocked by owner taste-pass (v2.5):** deepthroat/throat rounds with tap-rule consent, spit-as-lube, overstimulation + the again-round, hair-grip rhythm setting, strap-on giving and taking, owned-hour scenarios, window fucks, cruel silence rules, taste-yourself kisses, ruined-on-purpose, whole-night stakes, mutual simultaneous ruin. Still excluded forever: breath play, blades, required intoxication, third parties physically present, public strangers, body-shaming, scorekeeping.
- **Escalate with consent rails intact**: every hardcore card keeps soften (still sexual, genuinely gentler), safeword culture assumed, invitations not commands at unwilling bodies.
