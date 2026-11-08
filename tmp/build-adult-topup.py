#!/usr/bin/env python3
"""Top-up wave: close the love-language gap their report flagged (service/gifts thin
in afterdark/curious) and add consensual edge to the adult decks. Appends only;
never rewrites existing cards. Verifies every constraint after."""
import json

ADD = {
"afterdark": [
 {"type":"dare","text":"Service round: kneel, dress them, and choose every piece they wear tonight. They stand still while you decide.",
  "speak":"Arms through... good. Now the next one.","soften":"Offer to help them dress, choosing one piece for them, slowly.","timebox":300,"love":"service","together":True},
 {"type":"dare","text":"Gift giving, dirty version: unwrap one item for them while narrating what you want to do with it on them.",
  "speak":"I want to see you in this. Then out of it.","soften":"Wrap a small gift and tell them one thing you like about them.","love":"gifts"},
 {"type":"dare","text":"Wash them in the shower, slow on purpose, hands only, soap permitted. Then kiss the water off.",
  "speak":"Turn around. I want to do that again.","soften":"Wash their hair and shoulders, slowly, no rushing.","timebox":240,"love":"service"},
 {"type":"challenge","text":"Two-part gift: one is practical, one is a piece of lingerie. Open them in front of each other and put them on it.",
  "speak":"Turn around and let me see.","soften":"Give them one wrapped gift and ask them to open it slowly.","timebox":180,"love":"gifts","together":True},
 {"type":"dare","text":"Foot massage that ends elsewhere: kneel, work their feet, then kiss up their ankle and wait for permission.",
  "speak":"Tell me where to stop.","soften":"Massage their shoulders while they lie back and enjoy it.","love":"service"},
 {"type":"truth","text":"What service would you love from me that you'd never request because it feels too vulnerable to ask for?",
  "love":"service"},
 {"type":"dare","text":"Scent marking: wear their cologne or perfume on your skin tonight and tell them where you put it.",
  "speak":"Smell me. It's yours.","soften":"Let them pick one scent from your shelf and wear it for the evening.","love":"gifts"},
 {"type":"dare","text":"They choose an item from your drawers and dress you in it. You may not remove it until they say.",
  "speak":"I'll look good for you. Tell me what you want.","soften":"Let them choose one piece of your clothing and help you into it.","timebox":120,"love":"service"},
 {"type":"challenge","text":"Serve-and-worship relay: both on knees, six minutes each, mouth and voice only, no hands on each other.",
  "speak":"I want to taste you. Not yet.","soften":"Two minutes each of slow kissing while kneeling.","timebox":360,"love":"service","together":True},
 {"type":"topic","text":"What does being served feel like to you, and what would you need to hear to let someone do it?",
  "love":"service","together":True},
 {"type":"dare","text":"Undress them with your teeth, one fastening at a time, and say a dirty wish at each one.",
  "speak":"The next one. Faster.","soften":"Unbutton one piece at a time and tell them what you like about each.","love":"touch"},
 {"type":"dare","text":"Bind their wrists with a soft scarf and take your time. They keep the key to get out, and you both know it.",
  "speak":"Test it. You can leave whenever you want.","soften":"Hold their wrists with one hand while you kiss them slowly.","timebox":300,"love":"service"},
],
"curious": [
 {"type":"dare","text":"Service with a tease: wash their back, then stop and ask for permission before going lower.",
  "speak":"Ask me. I want to hear you ask.","soften":"Wash their shoulders and hair, no teasing.","love":"service"},
 {"type":"dare","text":"Pick an outfit for them, lay it out, and watch them put it on for you. Say nothing about what you want yet.",
  "speak":"Arms through. Turn. Let me look.","soften":"Offer two pieces and let them choose.","unlikely":True,"timebox":180,"love":"gifts"},
 {"type":"dare","text":"Give me a slow, thorough full-body kiss ending at the most sensitive spot and holding there until I moan.",
  "speak":"I want to be inside you.","soften":"Give me a long kiss on my shoulder and throat.","timebox":120,"love":"touch"},
 {"type":"challenge","text":"Teach with words only: I describe in detail exactly how to pleasure me, they repeat it back and do it.",
  "speak":"Slower. There. Don't stop.","soften":"Describe one thing you like, then let them try it gently.","timebox":180,"love":"words","together":True},
 {"type":"dare","text":"Edge them twice with your mouth. Then take them in your mouth until they come, watching them the whole time.",
  "speak":"Hold it. Hold it for me.","soften":"Give one slow minute of mouth work, then stop and ask how they liked it.","timebox":240,"love":"service"},
 {"type":"truth","text":"What's the filthiest instruction you'd love to give me, word for word? And are you brave enough?",
  "love":"words"},
 {"type":"dare","text":"Put your fingers inside me while you whisper every dirty thing you want to do next. Don't stop until I say hold.",
  "speak":"Tell me. I want to hear all of it.","soften":"Put your hand on my chest and tell me one thing you'd like to do.","love":"touch"},
 {"type":"dare","text":"Lead with a towel: wrap it around me and push me against the bathroom door, and show me how you want it.",
  "speak":"You're mine in this towel. Don't move.","soften":"Wrap a towel around them and kiss them slowly.","timebox":150,"love":"service"},
 {"type":"dare","text":"Sit behind me and work your hands over my body until I tell you the word. Then stop exactly there.",
  "speak":"Don't stop. I need it.","soften":"Hold them from behind while you kiss their neck.","timebox":120,"love":"touch"},
 {"type":"dare","text":"Ask me three times to do something dirty to you, and make me say the exact word I'll use for yes.",
  "speak":"Say yes. Say it like you mean it.","soften":"Ask twice to do something kind, and make me say yes out loud.","love":"words"},
 {"type":"challenge","text":"Yes/no/maybe candlelight: each names one thing they'd try, one they'd refuse, one they're unsure about. Answers must be honest.",
  "speak":"I'm listening. Answer me the same.","soften":"Ask one yes/no/maybe question each and honor the first no.","timebox":180,"love":"words","together":True},
 {"type":"topic","text":"What's the one scene you'd design in full detail for us, and what part are you most nervous about?",
  "love":"words","together":True},
 {"type":"dare","text":"Take me to the nearest flat surface, lift me, and hold me there while you kiss me. Ask before anything else.",
  "speak":"I can take it. Give it to me.","soften":"Lift me off the floor gently and hold me close.","timebox":120,"love":"touch"},
 {"type":"dare","text":"I ride you until I decide you can finish, then stop and make you wait. Repeat until you beg in my ear.",
  "speak":"Please. Please, I need you.","soften":"I ride you slowly and ask if you want me to keep going.","timebox":300,"love":"touch"},
 {"type":"dare","text":"Let me use your own toys on you and watch. They get to decide when they finish, except tonight I set the timer.",
  "speak":"I'll be good. I promise. Just let me.","soften":"Use a toy together, taking turns setting the pace.","timebox":180,"love":"gifts"},
 {"type":"dare","text":"Make me come with only my mouth and your legs apart, then describe the taste out loud.",
  "speak":"Keep going. Don't stop until you're sure.","soften":"Kiss me soft and describe one thing I do that makes me happy.","timebox":180,"love":"service"},
 {"type":"dare","text":"Promise to let me feel you come while you whisper exactly what I did wrong and right.",
  "speak":"I want to see it on you.","soften":"Hold me while you finish and tell me one thing that felt good.","love":"touch"},
 {"type":"topic","text":"Rate our last time starting from one and explain exactly what would make it a ten.",
  "love":"words","together":True},
],
}

seq = ["words", "touch", "time", "service", "gifts"]
report = []
for deck, items in ADD.items():
    p = f"content/decks/{deck}.json"
    doc = json.load(open(p, encoding="utf-8"))
    start = max(int(c["id"].split("-")[1]) for c in doc["cards"])
    added = []
    for i, item in enumerate(items, 1):
        n = start + i
        c = {"id": f"{deck}-{n:03d}", "deck": deck, "type": item["type"], "level": 4,
             "love": item["love"]}
        for k in ("text", "speak", "soften", "timebox", "together", "bomb"):
            if k in item and item[k] is not None:
                c[k] = item[k]
        assert 10 <= c.get("timebox", 120) <= 1500, (c["id"], c["timebox"])
        assert len(c["text"]) <= 160, (c["id"], len(c["text"]))
        assert len(c.get("speak", "")) <= 120, (c["id"], "speak")
        if c["type"] in ("dare", "challenge"):
            assert "soften" in c, c["id"]
        added.append(c)
    doc["cards"].extend(added)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)
        f.write("\n")
    report.append((deck, start, len(added)))

for deck, start, n in report:
    doc = json.load(open(f"content/decks/{deck}.json", encoding="utf-8"))
    print(f"{deck}: added {n} ({start+1}..{start+n}), now {len(doc['cards'])} cards")
    print("  love:", end=" ")
    from collections import Counter
    print(dict(Counter(c["love"] for c in doc["cards"])))