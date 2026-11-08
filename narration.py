"""Gibt den Sprechtext einer Story für ElevenLabs aus (inkl. Regieanweisungen).

Aufruf: python narration.py stories/<name>.json
"""
import json
import sys


def narration(story, with_tags=True):
    parts = []
    for b in story["beats"]:
        t = b["text"]
        if with_tags and b.get("delivery"):
            t = f"[{b['delivery']}] {t}"
        parts.append(t)
    return " ".join(parts)


if __name__ == "__main__":
    print(narration(json.load(open(sys.argv[1], encoding="utf-8"))))
