# Vision QA — Ember UI-upgrade screenshots

Reviewer: independent visual QA lane (not the lane that produced the screenshots).
Scope: phone-setup.png, phone-splash.png, phone-card1.png, tv-card1.png (C:/Users/HP/repos/ember/tmp/ui-upgrade/) + s23-live.png (NOT FOUND — see gap below).
Rule: for every image either name one concrete defect (clipping / overlap / unreadable contrast / misalignment / emoji) or explicitly state "no clipping/overlap/contrast defects found in this frame". No vibe approvals.

## Gap: s23-live.png does not exist

`find /c/Users/HP/repos/ember -iname "*s23*"` returned nothing. The live S23 screenshot referenced in the assignment was never captured to disk, so I cannot confirm whether the installed app on Samsung S23 (RFCW6046DDY) renders its UI or a blank/white screen. This is a verification gap, not a UI defect — flagged so the delivery lane can capture it before ship.

---

## 1. phone-setup.png (390×844 setup screen)

**What I see:** Dark glass gradient background (deep slate → warm amber at bottom). Top: small amber heart icon + "EMBER" wordmark, headline "Played best tangled up together." (display serif, "tangled up" in italic/red tint), subhead "Cuddle in, get comfortable — the phone is the only thing allowed between you tonight." Two name inputs "First name & First name" with blue/red presence dots. Mode pill grid: Chill / Mixup / Heat / Inferno (Mixup carries the ember on-state glow/border). Deck chip row: Spark 100 / Closer 100 / Slow Burn 100 / After Dark 130 / Curious 150 / Inferno 150. Bottom CTA "Start the night" (warm gradient pill). No emoji anywhere.

**Defects:** The deck chip row's rightmost chip ("Inferno 150") is clipped at the right screen edge — text overflows the viewport, the final digits are cut off. Layout: the pill/chip grid needs right-side padding or wrapping so no chip is cut off.

**Verdict (setup legible at phone size?):** Partially. Headline and subhead are highly legible; inputs and pills read well; but the clipped "Inferno 150" chip is a real defect at phone size. Fix: add right padding/flex-wrap to the chip row.

---

## 2. phone-splash.png (390×844 splash)

**What I see:** Dark glass panel centered. Amber heart icon above "Get close." headline (display serif). Body copy: "This game is played in close contact — ideally cuddled or spooned. The phone is the deck; the TV is the stage; the two of you are the whole point. Every card is an invitation. Skipping is always free. Ending warm is the only rule." ("cuddled or spooned" highlighted in amber). Bottom: "We're ready" CTA in orange→red gradient with soft outer glow. Clean generous whitespace; high contrast (white ink on dark panel). No emoji.

**Defects:** no clipping/overlap/contrast defects found in this frame.

**Verdict:** Splash reads as premium-dark-glass; type hierarchy (icon → headline → body → CTA) is clear. Breathing wordmark claim can't be confirmed from a static frame but the static layout is clean.

---

## 3. phone-card1.png (390×844 in-game card, MIXUP / SPICE BOMB / DARE)

**What I see:** Top bar "MIXUP" + 5 amber dots; top-right fullscreen icon. A red "SPICE BOMB" banner sits at the very top edge of the card, partially cut off by the screen top. "DARE" label + 5 dots. Card body (display serif): "Sensory overload: blindfold, headphones (erotic audio), restraints, vibrator. All at once." Speak block styled as "whisper": small tracked label "SAY THIS WHILE IT HAPPENS", then larger italic display type "'Too much? Good. Take it.'" with an ember left-edge glow. Timer ring: solid amber ring with "20:00" centered. Bottom hint "swipe for next · swipe back to skip". Bottom nav bar: "Soften" / "Skip" / "Never again" / "Next →" (orange→red gradient) / power icon.

**Defects:** (1) "SPICE BOMB" banner is clipped at the top edge — the banner text touches/is cut by the screen's top boundary. (2) Bottom-left pill "Soften" is left-clipped, rendering as "offen" — the "S" is cut off by the screen's left edge. Both are real text-clipping bugs on the phone viewport. No emoji.

**Verdict (premium-dark-glass + clear hierarchy?):** The card itself reads well — ember tint on the spice-bomb card, whisper speak block, conic timer ring all present and legible. But the two clipping bugs (top banner, left nav pill) undermine the premium claim. FIX-FIRST on these two clips.

---

## 4. tv-card1.png (1280×720 TV viewport, MIXUP / ICE)

**What I see:** Top bar "MIXUP" + 5 amber dots; top-right fullscreen icon. "ICE" label + dots. Card body (display serif, generous): "What is a simple way they could surprise you this week that would feel thoughtful rather than big?" Bottom hint "swipe for next · swipe back to skip". Bottom nav bar spanning width: "Soften" / "Skip" / "Never again" / "Next →" (orange→red gradient) / power icon. Clean dark-glass card centered with ample margins. No emoji.

**Defects:** no clipping/overlap/contrast defects found in this frame. The TV layout is the cleanest of the four — generous margins, nothing touches screen edges.

**Verdict:** TV card reads as premium dark glass with excellent type hierarchy and contrast. No defects.

---

## Design-goal verdicts

| Goal | Assessment |
|---|---|
| Premium dark-glass card screen with clear type hierarchy | YES on phone-card1 and tv-card1 (glass panel, display serif, timer ring, whisper speak block all visible). Marred on phone by the two clipping bugs. |
| Heat styling (ember tint / borders) comes through | YES — spice-bomb banner red, ember left-edge on speak block, amber timer ring, gradient "Next" button all visible. |
| Setup screen legible at phone size | MOSTLY — headline/inputs/pills legible, but "Inferno 150" chip clipped at right edge. |

---

## Overall verdict: FIX-FIRST

**One sentence:** FIX-FIRST — the UI delivers on the dark-glass/ember aesthetic and type hierarchy, but shippable requires fixing three concrete text-clipping bugs first: "Inferno 150" chip cut off on phone-setup, "SPICE BOMB" banner clipped at top on phone-card1, and "Soften" rendering as "offen" (left-clipped) on phone-card1's nav bar.

**Evidence:** phone-setup.png (right-edge chip clip), phone-card1.png (top banner clip + left nav pill clip), phone-splash.png (clean), tv-card1.png (clean), s23-live.png (MISSING — cannot verify S23 render; capture before ship).

GOAL: MET (report written)
