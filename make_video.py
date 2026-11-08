"""Erstellt aus einer Story-JSON ein fertiges 3D-Video.

Aufruf: python make_video.py stories/last-signal-partN.json [--preview]
Erwartet die Sprachaufnahme unter output/<name>/voice.mp3 (z. B. vom ElevenLabs-Connector).
"""
import json
import os
import subprocess
import sys

import align
import music
import timeline

ROOT = os.path.dirname(os.path.abspath(__file__))
LEAD_IN = 0.3


def tighten(src, dst, tempo=1.07):
    """Kürzt Sprechpausen auf max. ~0.12 s und beschleunigt leicht – kein Leerlauf."""
    af = ("silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.02:"
          "stop_periods=-1:stop_duration=0.14:stop_threshold=-42dB:stop_silence=0.10,"
          f"atempo={tempo}")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-af", af, "-ar", "44100", dst], check=True)


def main(path, preview=False):
    story = json.load(open(path, encoding="utf-8"))
    name = os.path.splitext(os.path.basename(path))[0]
    out = os.path.join(ROOT, "output", name)
    raw = os.path.join(out, "voice.mp3")
    if not os.path.exists(raw):
        sys.exit(f"Sprachaufnahme fehlt: {raw}")
    voice = os.path.join(out, "voice_tight.wav")
    tighten(raw, voice, story.get("tempo", 1.07))

    narration = " ".join(b["text"] for b in story["beats"])
    words = align.align(voice, narration)
    tl = timeline.build(story, words, LEAD_IN)
    tl_path = os.path.join(out, "timeline.json")
    json.dump(tl, open(tl_path, "w"), indent=1)

    # Sounddesign: Whoosh bei Szenenwechsel, Hit bei Protokoll-Schildern, Piepser bei Funk, Alarm
    whooshes, hits, beeps, alarms, knocks = [], [], [], [], []
    for k, b in enumerate(tl["beats"]):
        if k and b.get("scene") != tl["beats"][k - 1].get("scene"):
            whooshes.append(b["start"])
        if b.get("tag"):
            hits.append(b["start"])
        for m in b.get("chat", []):
            beeps.append(b["start"] + m.get("at", 0))
        if b.get("alarm") and not (k and tl["beats"][k - 1].get("alarm")):
            alarms.append(b["start"])
        if b.get("knock"):
            knocks.append(b["start"])
    wav = os.path.join(out, "sound.wav")
    music.make(wav, tl["duration"] + 0.5, beeps, alarms, whooshes=whooshes, hits=hits, knocks=knocks)

    web = os.path.join(ROOT, "web")
    mp4 = os.path.join(out, f"{name}.mp4")
    cmd = ["node", os.path.join(web, "render3d.mjs"), tl_path, voice, wav, mp4]
    if preview:
        frames = [int((b["start"] + min(1.0, (b["end"] - b["start"]) / 2)) * 30) for b in tl["beats"]]
        cmd += ["--frames", ",".join(map(str, frames)), "--png", os.path.join(out, "preview")]
    subprocess.run(cmd, check=True)
    if preview:
        print(os.path.join(out, "preview"))
        return
    meta = {"video": mp4, "title": story["title"], "caption": story["caption"],
            "hashtags": story["hashtags"], "duration": tl["duration"]}
    json.dump(meta, open(os.path.join(out, "meta.json"), "w"), ensure_ascii=False, indent=2)
    print(mp4)


if __name__ == "__main__":
    main(sys.argv[1], "--preview" in sys.argv)
