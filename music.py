"""Synthetischer, lizenzfreier Sound: Raumstations-Brummen, tiefe Drones, Piepser."""
import wave

import numpy as np

SR = 44100


def make(out_wav, seconds, beeps=(), alarms=()):
    n = int(SR * seconds)
    t = np.arange(n) / SR
    rng = np.random.default_rng(1)
    # Lüftungsrauschen (tiefpassgefiltert)
    noise = rng.standard_normal(n)
    k = np.ones(200) / 200
    hum = np.convolve(noise, k, mode="same") * 0.6
    # tiefer Drone mit langsamer Schwebung
    drone = (np.sin(2 * np.pi * 55 * t) * 0.10 + np.sin(2 * np.pi * 55.4 * t) * 0.08
             + np.sin(2 * np.pi * 82.4 * t) * 0.04 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.07 * t)))
    out = hum + drone
    # Spannungs-Ton, der zum Ende ansteigt
    rise = np.clip(t / seconds, 0, 1) ** 2
    out += np.sin(2 * np.pi * (220 + 40 * rise) * t) * 0.025 * rise
    for bt in beeps:
        s = int(bt * SR)
        L = int(0.12 * SR)
        if s + L < n:
            tt = np.arange(L) / SR
            out[s:s + L] += np.sin(2 * np.pi * 1320 * tt) * np.exp(-tt * 30) * 0.35
    for at in alarms:
        for r in range(3):
            s = int((at + r * 0.5) * SR)
            L = int(0.3 * SR)
            if s + L < n:
                tt = np.arange(L) / SR
                out[s:s + L] += np.sign(np.sin(2 * np.pi * 660 * tt)) * 0.06 * np.exp(-tt * 4)
    fade = np.minimum(1, np.minimum(t / 1.0, (seconds - t) / 1.0))
    out *= fade
    out = out / max(1e-9, np.abs(out).max()) * 0.7
    with wave.open(out_wav, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((out * 32767).astype(np.int16).tobytes())
