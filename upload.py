"""Lädt ein fertiges Video über Upload-Post auf TikTok, Instagram Reels und YouTube Shorts hoch.

Aufruf: python upload.py output/<name>/meta.json [--platforms tiktok,instagram,youtube]

Der API-Key wird in der Cloud-Umgebung vom Netzwerk-Proxy eingesetzt; lokal kann
UPLOAD_POST_API_KEY gesetzt werden. UPLOAD_POST_USER ist der Profilname, unter dem
die Konten in Upload-Post verbunden sind.
"""
import argparse
import json
import os
import subprocess

API = "https://api.upload-post.com/api/upload"


def upload(meta_path, platforms):
    meta = json.load(open(meta_path, encoding="utf-8"))
    user = os.environ.get("UPLOAD_POST_USER", "stickman")
    key = os.environ.get("UPLOAD_POST_API_KEY", "proxy-injected")
    caption = meta["caption"] + "\n\n" + " ".join(meta["hashtags"])
    cmd = ["curl", "-sS", "-X", "POST", API,
           "-H", f"Authorization: Apikey {key}",
           "-F", f"user={user}",
           "-F", f"video=@{meta['video']}",
           "-F", f"title={caption}",
           "-F", f"youtube_title={meta['title'][:95]}",
           "-F", f"youtube_description={caption}",
           # Kennzeichnung als KI-Inhalt, wo die Plattform es unterstützt
           "-F", "is_aigc=true",
           "-F", "containsSyntheticMedia=true"]
    for p in platforms:
        cmd += ["-F", f"platform[]={p}"]
    out = subprocess.run(cmd, capture_output=True, text=True)
    print(out.stdout or out.stderr)
    return out.stdout


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("meta")
    ap.add_argument("--platforms", default="tiktok,instagram,youtube")
    a = ap.parse_args()
    upload(a.meta, a.platforms.split(","))
