"""Sprachaufnahme mit ElevenLabs, inkl. Wort-Zeitstempeln für Untertitel."""
import base64
import json
import os
import urllib.request

API = "https://api.elevenlabs.io/v1"
# Standardstimme: ElevenLabs "Daniel" (ruhig, tief). Per Story oder Umgebungsvariable änderbar.
DEFAULT_VOICE = os.environ.get("ELEVENLABS_VOICE_ID", "onwK4e9ZLuTAKqWW03F9")
MODEL = os.environ.get("ELEVENLABS_MODEL", "eleven_multilingual_v2")


def _key():
    # In der Cloud setzt der Proxy den echten Key ein; lokal ELEVENLABS_API_KEY setzen.
    return os.environ.get("ELEVENLABS_API_KEY", "sk_proxy-injected")


def synthesize(text, out_mp3, voice_id=None):
    """Erzeugt MP3 und gibt Wortliste [(wort, start_s, ende_s), ...] zurück."""
    voice_id = voice_id or DEFAULT_VOICE
    body = json.dumps({
        "text": text,
        "model_id": MODEL,
        "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.35},
    }).encode()
    req = urllib.request.Request(
        f"{API}/text-to-speech/{voice_id}/with-timestamps?output_format=mp3_44100_128",
        data=body,
        headers={"xi-api-key": _key(), "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=180) as r:
        data = json.load(r)
    with open(out_mp3, "wb") as f:
        f.write(base64.b64decode(data["audio_base64"]))
    al = data["alignment"]
    return _words(al["characters"], al["character_start_times_seconds"],
                  al["character_end_times_seconds"])


def _words(chars, starts, ends):
    words, cur, s0, e0 = [], "", None, None
    for c, s, e in zip(chars, starts, ends):
        if c.isspace():
            if cur:
                words.append((cur, s0, e0))
            cur, s0 = "", None
            continue
        if s0 is None:
            s0 = s
        cur += c
        e0 = e
    if cur:
        words.append((cur, s0, e0))
    return words
