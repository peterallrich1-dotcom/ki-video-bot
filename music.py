"""Synthetischer, lizenzfreier Sound: Drone, Herzschlag-Puls, Whooshes, Hits, Piepser, Alarm, Klopfen."""
import wave

import numpy as np

SR = 44100


def _add(out, s, sig):
    s = int(s * SR)
    if s < 0 or s >= len(out):
        return
    e = min(len(out), s + len(sig))
    out[s:e] += sig[:e - s]


def make(out_wav, seconds, beeps=(), alarms=(), whooshes=(), hits=(), knocks=(), ambience="station", chimes=()):
    n = int(SR * seconds)
    t = np.arange(n) / SR
    rng = np.random.default_rng(1)
    noise = rng.standard_normal(n)
    hum = np.convolve(noise, np.ones(220) / 220, mode="same") * 0.5
    drone = (np.sin(2 * np.pi * 55 * t) * 0.10 + np.sin(2 * np.pi * 55.5 * t) * 0.08
             + np.sin(2 * np.pi * 82.4 * t) * 0.05 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.09 * t))
             + np.sin(2 * np.pi * 110 * t) * 0.03)
    out = hum + drone
    if ambience == "rain":
        # Regen draußen + Brummen der Neonröhren statt Raumschiff-Drone
        rn = rng.standard_normal(n)
        rainn = (rn - np.convolve(rn, np.ones(6) / 6, mode="same")) * 0.25
        out = hum * 0.6 + rainn + np.sin(2 * np.pi * 100 * t) * 0.025 + np.sin(2 * np.pi * 50 * t) * 0.05
    # Herzschlag-Puls, wird zum Ende schneller und lauter
    rise = np.clip(t / seconds, 0, 1)
    bt = 0.0
    while bt < seconds - 0.5:
        L = int(0.18 * SR)
        tt = np.arange(L) / SR
        thump = np.sin(2 * np.pi * 50 * tt) * np.exp(-tt * 22)
        amp = 0.25 + 0.35 * (bt / seconds)
        _add(out, bt, thump * amp)
        _add(out, bt + 0.22, thump * amp * 0.7)
        bt += 1.0 - 0.35 * (bt / seconds)
    # Spannungs-Riser
    out += np.sin(2 * np.pi * (180 + 120 * rise ** 2) * t) * 0.03 * rise ** 1.5
    for w in whooshes:
        L = int(0.5 * SR)
        tt = np.arange(L) / SR
        nz = rng.standard_normal(L)
        env = np.sin(np.pi * tt / 0.5) ** 2
        sweep = np.convolve(nz, np.ones(12) / 12, mode="same") * env * 0.35
        _add(out, w - 0.25, sweep)
    for h in hits:
        L = int(1.2 * SR)
        tt = np.arange(L) / SR
        boom = (np.sin(2 * np.pi * 45 * tt) * np.exp(-tt * 3.5) * 0.9
                + rng.standard_normal(L) * np.exp(-tt * 18) * 0.3)
        _add(out, h, boom)
    for b in beeps:
        L = int(0.12 * SR)
        tt = np.arange(L) / SR
        _add(out, b, np.sin(2 * np.pi * 1320 * tt) * np.exp(-tt * 30) * 0.35)
    for a in alarms:
        for r in range(4):
            L = int(0.3 * SR)
            tt = np.arange(L) / SR
            _add(out, a + r * 0.5, np.sign(np.sin(2 * np.pi * 660 * tt)) * 0.07 * np.exp(-tt * 4))
    for k in knocks:
        for r in range(3):
            L = int(0.25 * SR)
            tt = np.arange(L) / SR
            knock = (np.sin(2 * np.pi * 90 * tt) * np.exp(-tt * 28)
                     + rng.standard_normal(L) * np.exp(-tt * 60) * 0.4) * 0.9
            _add(out, k + 0.15 + r * 0.55, knock)
    for c in chimes:   # Türglocke der Tankstelle (ding-dong)
        for k, f in enumerate((1318.5, 1046.5)):
            L = int(1.0 * SR)
            tt = np.arange(L) / SR
            _add(out, c + k * 0.32, (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt)) * np.exp(-tt * 3.5) * 0.25)
    fade = np.minimum(1, np.minimum(t / 0.6, (seconds - t) / 1.0))
    out *= fade
    out = out / max(1e-9, np.abs(out).max()) * 0.8
    with wave.open(out_wav, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((out * 32767).astype(np.int16).tobytes())
