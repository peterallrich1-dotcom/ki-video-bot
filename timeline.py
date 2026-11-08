"""Baut aus Story + Wort-Zeitstempeln die Zeitleiste für den 3D-Renderer."""


def _hud(story, b):
    h0, m0 = map(int, b.get("start_time", story.get("start_time", "03:12")).split(":"))
    mins = h0 * 60 + m0 + b.get("minute_offset", 0)
    return {
        "day": b.get("day", story.get("day", 1)),
        "time": f"{(mins // 60) % 24:02d}:{mins % 60:02d}",
        "oxygen": b.get("oxygen", story.get("oxygen", 98)),
        "crew": b.get("crew", story.get("crew", 1)),
    }


def _groups(words, maxlen=3):
    """1-3 Wörter pro Untertitel, Umbruch nach Satzzeichen oder langen Wörtern."""
    out, cur = [], []
    for w in words:
        cur.append(w)
        long_chars = sum(len(x[0]) for x in cur)
        if len(cur) >= maxlen or w[0][-1] in ".!?…,:" or long_chars > 13:
            out.append(cur)
            cur = []
    if cur:
        out.append(cur)
    return out


def build(story, words, lead_in=0.3, end_pad=1.8):
    beats = story["beats"]
    duration = words[-1][2] + lead_in + end_pad
    tl_beats, i = [], 0
    starts = []
    for b in beats:
        n = len(b["text"].split())
        seg = words[i:i + n]
        starts.append(seg[0][1] + lead_in)
        i += n
    for k, b in enumerate(beats):
        start = 0.0 if k == 0 else starts[k] - 0.08
        end = (starts[k + 1] - 0.08) if k + 1 < len(beats) else duration
        e = {key: b[key] for key in ("scene", "pose", "chat", "chat_sub", "tag", "alarm", "knock", "facing", "cam", "hand", "dark", "twin", "twin_pose", "door_open")
             if key in b}
        e.update(start=round(start, 3), end=round(end, 3), **_hud(story, b))
        tl_beats.append(e)

    caps, i = [], 0
    beat_of_word = []
    for k, b in enumerate(beats):
        beat_of_word += [k] * len(b["text"].split())
    for g in _groups(words):
        k = beat_of_word[min(i, len(beat_of_word) - 1)]
        i += len(g)
        caps.append({
            "start": round(g[0][1] + lead_in, 3),
            "end": round(g[-1][2] + lead_in + 0.06, 3),
            "words": [w[0] for w in g],
            "highlight": [h.lower() for h in beats[k].get("highlight", [])],
            "alt": bool(beats[k].get("tag")),
        })
    # Lücken zwischen Untertiteln schließen, damit nie ein leerer Moment entsteht
    for a, b in zip(caps, caps[1:]):
        if b["start"] - a["end"] < 0.5:
            a["end"] = b["start"]
    return {"part": story["part"], "duration": round(duration, 3), "lead_in": lead_in,
            "beats": tl_beats, "captions": caps}
