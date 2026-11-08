"""Schätzt Wort-Zeitstempel aus einer Sprachdatei ohne externe Dienste.

Findet die Sprechabschnitte (Pausen per ffmpeg silencedetect) und verteilt die
Wörter nach Zeichenlänge über die reine Sprechzeit.
"""
import re
import subprocess


def _segments(audio, noise="-35dB", min_sil=0.18):
    out = subprocess.run(
        ["ffmpeg", "-i", audio, "-af", f"silencedetect=noise={noise}:d={min_sil}", "-f", "null", "-"],
        capture_output=True, text=True).stderr
    h, m, sec = re.search(r"Duration: (\d+):(\d+):([\d.]+)", out).groups()
    dur = int(h) * 3600 + int(m) * 60 + float(sec)
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    sil = list(zip(starts, ends + [dur] * (len(starts) - len(ends))))
    segs, cur = [], 0.0
    for s, e in sil:
        if s - cur > 0.05:
            segs.append((cur, s))
        cur = e
    if dur - cur > 0.05:
        segs.append((cur, dur))
    return segs


def align(audio, text):
    words = text.split()
    segs = _segments(audio)
    voiced = sum(e - s for s, e in segs)
    weights = [len(re.sub(r"\W", "", w)) + 1.5 for w in words]
    total = sum(weights)

    def to_real(v, start=False):
        # Wortanfänge an einer Pausengrenze springen an den nächsten Sprechabschnitt
        for s, e in segs:
            if v < e - s or (not start and v <= e - s):
                return s + v
            v -= e - s
        return segs[-1][1]

    res, acc = [], 0.0
    for w, wt in zip(words, weights):
        a = acc / total * voiced
        acc += wt
        b = acc / total * voiced
        res.append((w, round(to_real(a + 1e-6, True), 3), round(to_real(b - 0.01), 3)))
    return res
