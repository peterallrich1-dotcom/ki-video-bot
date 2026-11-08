"""Erstellt aus einer Story-JSON ein fertiges Video.

Aufruf: python make_video.py stories/last-signal-part1.json
"""
import json
import os
import sys

import align
import music
import render
import voice

LEAD_IN = 0.4


def main(path):
    story = json.load(open(path, encoding="utf-8"))
    name = os.path.splitext(os.path.basename(path))[0]
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output", name)
    os.makedirs(out, exist_ok=True)

    narration = " ".join(b["text"] for b in story["beats"])
    mp3 = os.path.join(out, "voice.mp3")
    if os.path.exists(mp3):
        # Stimme wurde schon erzeugt (z. B. über den ElevenLabs-Connector)
        words = align.align(mp3, narration)
    else:
        words = voice.synthesize(narration, mp3, story.get("voice_id"))

    # Piepser bei Funkmeldungen, Alarm bei Alarm-Beats
    beeps, alarms, i = [], [], 0
    for b in story["beats"]:
        n = len(b["text"].split())
        start = words[i][1] + LEAD_IN
        i += n
        for m in b.get("chat", []):
            if m.get("at", 0) > 0:
                beeps.append(start + m["at"])
        if b.get("alarm"):
            alarms.append(start)
    wav = os.path.join(out, "sound.wav")
    music.make(wav, words[-1][2] + LEAD_IN + 2, beeps, alarms[:1])

    mp4 = os.path.join(out, f"{name}.mp4")
    render.render(story, words, mp3, wav, mp4, LEAD_IN)
    meta = {"video": mp4, "title": story["title"], "caption": story["caption"],
            "hashtags": story["hashtags"]}
    json.dump(meta, open(os.path.join(out, "meta.json"), "w"), ensure_ascii=False, indent=2)
    print(mp4)


if __name__ == "__main__":
    main(sys.argv[1])
