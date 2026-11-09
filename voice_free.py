"""Kostenlose Erzählerstimme mit Kokoro (Open Source, läuft lokal, unbegrenzt).

Jeder Beat wird einzeln vertont und mit kurzen Pausen aneinandergehängt. Dadurch sind die
Satzgrenzen exakt bekannt; innerhalb eines Satzes werden die Wörter nach Länge verteilt.

Modelldateien (einmalig, ~350 MB) werden bei Bedarf von GitHub geladen nach models/.
"""
import os
import re
import subprocess
import urllib.request

import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.abspath(__file__))
MODELS = os.path.join(ROOT, "models")
BASE = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"
DEFAULT_VOICE = os.environ.get("FREE_VOICE", "bm_lewis")
GAP = 0.12          # Pause zwischen Sätzen (Sekunden)
_k = None


def _model():
    global _k
    if _k is None:
        os.makedirs(MODELS, exist_ok=True)
        for f in ("kokoro-v1.0.onnx", "voices-v1.0.bin"):
            p = os.path.join(MODELS, f)
            if not os.path.exists(p):
                urllib.request.urlretrieve(BASE + f, p)
        from kokoro_onnx import Kokoro
        _k = Kokoro(os.path.join(MODELS, "kokoro-v1.0.onnx"), os.path.join(MODELS, "voices-v1.0.bin"))
    return _k


def _trim(x, sr, thr=0.01):
    idx = np.where(np.abs(x) > thr)[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(0.02 * sr))
    b = min(len(x), idx[-1] + int(0.05 * sr))
    return x[a:b]


def synthesize(story, out_wav, voice=None, speed=1.0):
    """Erzeugt die Erzählung als WAV und gibt [(wort, start, ende), ...] zurück."""
    k = _model()
    voice = voice or story.get("free_voice") or DEFAULT_VOICE
    lang = "en-gb" if voice.startswith("b") else "en-us"
    sr = 24000
    parts, words, t = [], [], 0.0
    for b in story["beats"]:
        text = b["text"]
        s, sr = k.create(text, voice=voice, speed=speed * (0.92 if b.get("delivery") == "whispering" else 1.0), lang=lang)
        s = _trim(np.asarray(s, dtype=np.float32), sr)
        if b.get("delivery") == "whispering":
            s = s * 0.75
        dur = len(s) / sr
        ws = text.split()
        weights = [len(re.sub(r"\W", "", w)) + 1.5 + (1.2 if re.search(r"[.,!?]$", w) else 0) for w in ws]
        tot, acc = sum(weights), 0.0
        for w, wt in zip(ws, weights):
            a = t + acc / tot * dur
            acc += wt
            words.append((w, round(a, 3), round(t + acc / tot * dur - 0.01, 3)))
        parts.append(s)
        parts.append(np.zeros(int(GAP * sr), dtype=np.float32))
        t += dur + GAP
    raw = os.path.splitext(out_wav)[0] + "_raw.wav"
    sf.write(raw, np.concatenate(parts), sr)
    # Horror-Klang: etwas tiefer (Dauer bleibt gleich), leichter Raumhall, Lautheit angleichen
    af = ("asetrate=24000*0.92,aresample=24000,atempo=1.087,"
          "aecho=0.8:0.5:60|120:0.25|0.15,highpass=f=70,loudnorm=I=-16")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af", af, "-ar", "44100", out_wav], check=True)
    return words
