#!/usr/bin/env python3
"""One-shot copy pass: kill the lint's banned 'Invite them to...' opener on adult cards.
Only touches text; never type/level/flag/love/timebox. Re-verifies every constraint after."""
import json, re

R = {
"afterdark-015": "Take them into a slow, lingering kiss and keep it soft, full of promise.",
"afterdark-024": "Have them close their eyes, then place three soft kisses anywhere you choose.",
"afterdark-040": "Press them gently against a wall or door and kiss them like the rest of the house disappeared.",
"afterdark-042": "One-item undressing trade: you remove one piece of their clothing, they remove one of yours, then pause and look.",
"afterdark-044": "Have them sit on your lap facing you and stay there for ninety seconds with eye contact and slow hands.",
"afterdark-046": "Mirror moment: move where you can both see yourselves and kiss or touch while watching the reflection for one minute.",
"afterdark-047": "Have them straddle your lap or hips and simply stare for thirty seconds before either of you moves.",
"afterdark-050": "Slow strip to music: choose a song and remove one item of clothing per thirty seconds, stopping whenever it feels right.",
"afterdark-053": "Press them against the nearest solid surface and keep them there with your body while kissing them slowly.",
"afterdark-055": "Full-minute collarbone-to-jaw exploration with lips only, hands wherever they want.",
"afterdark-074": "Bedroom dance with no music: move together for ninety seconds using only the rhythm you invent.",
"afterdark-079": "Have them lie down and rest their head on your chest while you both listen for heartbeats for a full minute.",
"afterdark-081": "Sensual twenty-questions: ask only body-and-desire questions and answer with full honesty for five minutes.",
"afterdark-084": "Have them point to any spot on their body; you kiss exactly that spot and nowhere else for thirty seconds.",
"afterdark-086": "Remote-tease fantasy: describe in detail how you would distract them while they tried to do ordinary chores.",
"afterdark-089": "Secret touch under a blanket while something plays on screen. Keep it hidden and deliberate for two minutes.",

"curious-014": "Have them close their eyes or use a soft blindfold while you introduce three different textures or temperatures across their skin.",
"curious-016": "No-touch tease: stay close enough to feel each other's breath and describe exactly what you'd do if touching were allowed.",
"curious-018": "Blindfold them gently, then narrate every soft thing you feel while they use only light texture or temperature play.",
"curious-020": "Hover their hands just above your skin and move them slowly so you feel the heat without contact for a full minute.",
"curious-022": "Take their hands and guide them wherever curiosity points for thirty seconds while you keep your eyes closed.",
"curious-024": "Have them describe out loud one new way they'd like to be touched while you listen without acting on it yet.",
"curious-038": "Temperature ladder: start with something cool on their skin, then warm it slowly with your hands or breath over ninety seconds.",
"curious-040": "Role-frame lite: for five minutes you are strangers who just met at a party and already feel the pull. Speak and touch only as new acquaintances.",
"curious-042": "Guide their hands with your voice alone for one minute. You touch only where and how they describe.",
"curious-044": "Kissing-only constraint: ten full minutes of only kissing and light hands. Nothing further, no matter how much you both want it.",
"curious-046": "Body-worship-with-words round: spend sixty seconds describing what you admire about their body while your hands stay still.",
"curious-048": "Edging-adjacent pause: get close with touch or friction, then freeze for twenty seconds when either of you says hold.",
"curious-050": "Have them mark three yes, three maybe, three no curiosities on an invisible list, then share only one yes out loud.",
"curious-052": "Temperature-play coda: end a close moment with something cool followed immediately by warm breath or lips.",
"curious-073": "Sensation scavenger hunt: find five different textures in the house and bring them back to try on each other's skin.",
"curious-075": "Obedient-breathing game: they set the pace, slow, deep, hold, and you follow exactly for ninety seconds.",
"curious-077": "Role-audition: try on a persona for three minutes, voice, posture, and one repeated phrase, while they simply receive.",
"curious-082": "Have them invent a secret touch language with you: three different taps or strokes that mean yes, slower, and more.",
"curious-086": "Short fantasy-storytelling trade: you start a scene in the dark, they add three sentences, you finish it.",
}

BANNED = [r"reconnect", r"\brepair\b", r"\bhealing\b", r"communication exercise",
          r"emotional intimacy", r"therapy", r"therapist"]
STILTED = re.compile(r"^Invite (them|a|an) ")

changed = 0
for deck in ("afterdark", "curious"):
    p = f"content/decks/{deck}.json"
    doc = json.load(open(p, encoding="utf-8"))
    for c in doc["cards"]:
        if c["id"] in R:
            old = c["text"]
            c["text"] = R[c["id"]]
            changed += 1
            assert len(old) != len(c["text"])
    with open(p, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)
        f.write("\n")

# verify
left = []
for deck in ("afterdark", "curious"):
    doc = json.load(open(f"content/decks/{deck}.json", encoding="utf-8"))
    for c in doc["cards"]:
        t = c["text"]
        if STILTED.match(t):
            left.append(c["id"])
        if any(re.search(b, t) for b in BANNED):
            print("BANNED", c["id"], t)
        if len(t) > 160:
            print("LONG text", c["id"], len(t))
print(f"rewrote {changed} cards; remaining stilted: {left}")