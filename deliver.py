"""Legt ein fertiges Video zum manuellen Hochladen im Repository-Ordner abholen/ ab.

Wird genutzt, wenn das Upload-Post-Kontingent aufgebraucht ist. Neben der MP4 liegt eine
Textdatei mit Caption, Hashtags und YouTube-Titel zum Kopieren. Danach committen und pushen.

Aufruf: python deliver.py output/<name>/meta.json
"""
import json
import os
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))


def main(meta_path):
    meta = json.load(open(meta_path, encoding="utf-8"))
    name = os.path.splitext(os.path.basename(meta["video"]))[0]
    dest = os.path.join(ROOT, "abholen")
    os.makedirs(dest, exist_ok=True)
    mp4 = os.path.join(dest, f"{name}.mp4")
    # Kleinere Kopie (< 25 MB), damit der Download am Handy schnell geht
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", meta["video"], "-c:v", "libx264", "-preset", "slow",
                    "-crf", "23", "-maxrate", "4M", "-bufsize", "8M", "-c:a", "copy", "-movflags", "+faststart", mp4],
                   check=True)
    caption = meta["caption"] + "\n\n" + " ".join(meta["hashtags"])
    yt = meta["title"].split(":")[0].strip() + " #shorts"
    with open(os.path.join(dest, f"{name}.txt"), "w", encoding="utf-8") as f:
        f.write("CAPTION (Instagram + YouTube-Beschreibung):\n\n" + caption + "\n\n"
                "YOUTUBE-TITEL:\n\n" + yt + "\n\n"
                "Hinweis: Auf beiden Plattformen als KI-Inhalt kennzeichnen.\n")
    print(mp4)


if __name__ == "__main__":
    main(sys.argv[1])
