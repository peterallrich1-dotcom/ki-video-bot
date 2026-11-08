"""Schnelle Bildvorschau einer Story OHNE Stimme (geschätztes Timing, kostet keine Credits).

Aufruf: python preview_story.py stories/<name>.json  → output/<name>/preview/*.png
"""
import json
import os
import subprocess
import sys

import timeline

ROOT = os.path.dirname(os.path.abspath(__file__))


def main(path):
    story = json.load(open(path, encoding="utf-8"))
    name = os.path.splitext(os.path.basename(path))[0]
    out = os.path.join(ROOT, "output", name)
    os.makedirs(out, exist_ok=True)
    words, t = [], 0.0
    for b in story["beats"]:
        for w in b["text"].split():
            d = 0.12 + 0.045 * len(w)
            words.append((w, t, t + d))
            t += d + 0.04
        t += 0.12
    tl = timeline.build(story, words)
    tl_path = os.path.join(out, "timeline_preview.json")
    json.dump(tl, open(tl_path, "w"), indent=1)
    frames = [int((b["start"] + min(1.0, (b["end"] - b["start"]) * 0.6)) * 30) for b in tl["beats"]]
    subprocess.run(["node", os.path.join(ROOT, "web", "render3d.mjs"), tl_path, "-", "-", "-",
                    "--frames", ",".join(map(str, frames)), "--png", os.path.join(out, "preview")], check=True)
    print(f"geschätzte Dauer: {tl['duration']:.1f}s, Wörter: {len(words)}")


if __name__ == "__main__":
    main(sys.argv[1])
