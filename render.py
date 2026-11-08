"""Rendert eine Folge von "The Last Signal" im Stickman-Story-Stil (1080x1920, 9:16).

Eine Folge besteht aus Beats. Jeder Beat hat eine Szene, eine Pose, gesprochenen
Text und optional Funkmeldungen (chat) oder ein Protokoll-Schild (tag).
"""
import math
import random
import subprocess

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1080, 1920, 30
F_BLACK = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
F_MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
F_SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

BG = (17, 19, 24)
LINE = (232, 236, 242)
DIM = (70, 76, 88)
ACCENT = (110, 235, 255)   # Cyan-Highlight in Untertiteln
RED = (232, 52, 60)

_fonts = {}


def font(path, size):
    key = (path, size)
    if key not in _fonts:
        _fonts[key] = ImageFont.truetype(path, size)
    return _fonts[key]


# ---------------------------------------------------------------- Strichmännchen
# Gelenke relativ zur Hüfte (x, y nach oben positiv), Einheit px.
POSES = {
    "stand":   dict(head=(0, 330), neck=(0, 270), hip=(0, 120), le=(-55, 200), lh=(-70, 120),
                    re=(55, 200), rh=(70, 120), lk=(-35, 60), lf=(-45, 0), rk=(35, 60), rf=(45, 0)),
    "sit":     dict(head=(0, 260), neck=(0, 200), hip=(0, 60), le=(-50, 130), lh=(10, 110),
                    re=(50, 130), rh=(70, 100), lk=(-90, 60), lf=(-100, 0), rk=(90, 60), rf=(100, 0)),
    "crouch":  dict(head=(-20, 200), neck=(-10, 150), hip=(10, 60), le=(-60, 110), lh=(-40, 190),
                    re=(40, 110), rh=(-10, 195), lk=(-60, 70), lf=(-50, 0), rk=(70, 40), rf=(60, 0)),
    "float":   dict(head=(10, 330), neck=(5, 270), hip=(0, 120), le=(-80, 260), lh=(-140, 300),
                    re=(80, 250), rh=(140, 290), lk=(-50, 50), lf=(-30, -20), rk=(45, 70), rf=(90, 20)),
    "reach":   dict(head=(20, 330), neck=(10, 270), hip=(0, 120), le=(70, 260), lh=(150, 280),
                    re=(-40, 200), rh=(-50, 120), lk=(-30, 60), lf=(-45, 0), rk=(40, 60), rf=(50, 0)),
    "lookback": dict(head=(-15, 330), neck=(-5, 270), hip=(0, 120), le=(-50, 190), lh=(-40, 110),
                     re=(55, 190), rh=(30, 110), lk=(-30, 60), lf=(-50, 0), rk=(30, 60), rf=(40, 0)),
    "fear":    dict(head=(0, 300), neck=(0, 245), hip=(0, 110), le=(-70, 260), lh=(-20, 300),
                    re=(70, 260), rh=(20, 300), lk=(-55, 55), lf=(-60, 0), rk=(55, 55), rf=(60, 0)),
}
BONES = [("neck", "hip"), ("neck", "le"), ("le", "lh"), ("neck", "re"), ("re", "rh"),
         ("hip", "lk"), ("lk", "lf"), ("hip", "rk"), ("rk", "rf")]


def draw_stickman(d, pose, x, y, scale, t, facing=1, floating=False):
    p = POSES.get(pose, POSES["stand"])
    bob = math.sin(t * 2.2) * 3
    if floating or pose == "float":
        bob = math.sin(t * 1.1) * 18
    pts = {}
    for k, (px, py) in p.items():
        wob = math.sin(t * 1.7 + px * 0.05) * 2 if k in ("lh", "rh", "le", "re") else 0
        pts[k] = (x + px * scale * facing, y - (py + (bob if k != "lf" and k != "rf" else 0) + wob) * scale)
    lw = max(6, int(11 * scale))
    for a, b in BONES:
        d.line([pts[a], pts[b]], fill=LINE, width=lw)
        for q in (pts[a], pts[b]):
            r = lw / 2
            d.ellipse([q[0] - r, q[1] - r, q[0] + r, q[1] + r], fill=LINE)
    hx, hy = pts["head"]
    hr = 52 * scale
    d.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], outline=LINE, width=lw, fill=BG)


# ---------------------------------------------------------------- Szenen
def _stars(seed, n, area):
    r = random.Random(seed)
    x0, y0, x1, y1 = area
    return [(r.uniform(x0, x1), r.uniform(y0, y1), r.uniform(1, 3), r.uniform(0, 6.3)) for _ in range(n)]


def scene_base(name):
    """Statischer Hintergrund je Szene (einmal gezeichnet, dann gecacht)."""
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    floor = int(H * 0.70)
    d.rectangle([0, floor, W, H], fill=(13, 14, 18))
    d.line([0, floor, W, floor], fill=(34, 37, 45), width=4)
    if name in ("window", "bunk"):
        # Großes rundes Fenster mit Erde
        cx, cy, r = (700, 760, 250) if name == "window" else (260, 620, 150)
        d.ellipse([cx - r - 30, cy - r - 30, cx + r + 30, cy + r + 30], fill=(30, 33, 40))
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(6, 8, 12))
        if name == "window":
            er = 130
            ex, ey = cx + 60, cy + 80
            d.ellipse([ex - er, ey - er, ex + er, ey + er], fill=(18, 40, 58))
            d.chord([ex - er, ey - er, ex + er, ey + er], 200, 340, fill=(28, 62, 86))
        for i in range(6):
            a = i * math.pi / 3
            bx, by = cx + math.cos(a) * (r + 15), cy + math.sin(a) * (r + 15)
            d.ellipse([bx - 6, by - 6, bx + 6, by + 6], fill=(50, 54, 64))
        if name == "bunk":
            d.rectangle([520, floor - 170, 1000, floor - 120], fill=(36, 39, 47))
            d.rectangle([520, floor - 120, 540, floor], fill=(36, 39, 47))
            d.rectangle([980, floor - 120, 1000, floor], fill=(36, 39, 47))
    elif name == "console":
        d.rectangle([90, 520, 990, 1130], fill=(28, 31, 38))
        d.rectangle([130, 560, 950, 1060], fill=(8, 11, 15))
        for i in range(9):
            x = 140 + i * 92
            d.rounded_rectangle([x, floor - 120, x + 70, floor - 80], 8, fill=(36, 40, 48))
        d.rectangle([60, floor - 70, 1020, floor], fill=(33, 36, 44))
    elif name == "corridor":
        vx, vy = W / 2, 820
        for k in range(6):
            s = 1 - k * 0.15
            w2, h2 = 520 * s, 820 * s
            d.rectangle([vx - w2, vy - h2 * 0.6, vx + w2, vy + h2 * 0.75], outline=(34 + k * 4,) * 3, width=6)
        d.line([0, 0, vx - 80, vy - 50], fill=(28, 30, 36), width=4)
        d.line([W, 0, vx + 80, vy - 50], fill=(28, 30, 36), width=4)
    elif name == "airlock":
        d.rounded_rectangle([290, 380, 790, 1340], 60, fill=(30, 33, 40))
        d.rounded_rectangle([340, 430, 740, 1290], 40, fill=(10, 12, 16))
        d.ellipse([440, 560, 640, 760], fill=(6, 8, 12), outline=(50, 54, 64), width=8)
        for i in range(8):
            y = 1300 - i * 0
        d.rectangle([800, 820, 860, 900], fill=(40, 44, 52))
    elif name == "protocol":
        pass
    return img


def draw_scene_anim(d, name, t, alarm):
    if name == "window":
        for sx, sy, sr, ph in _stars(3, 70, (470, 530, 930, 990)):
            if (sx - 700) ** 2 + (sy - 760) ** 2 < 245 ** 2:
                a = 0.4 + 0.6 * (0.5 + 0.5 * math.sin(t * 2 + ph))
                c = int(200 * a)
                d.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(c, c, c + 20 if c < 235 else 255))
    if name in ("protocol", "corridor"):
        for sx, sy, sr, ph in _stars(9, 60, (0, 0, W, H * 0.68)):
            a = 0.2 + 0.3 * (0.5 + 0.5 * math.sin(t + ph))
            c = int(120 * a)
            d.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(c, c, c))
    if name == "console":
        for i in range(9):
            x = 140 + i * 92
            on = (math.sin(t * 3 + i * 1.7) > 0.3)
            col = (RED if alarm and i % 3 == 0 else ACCENT) if on else (50, 56, 66)
            d.ellipse([x + 27, H * 0.70 - 108, x + 43, H * 0.70 - 92], fill=col)
    if alarm and int(t * 2) % 2 == 0:
        d.rectangle([0, 0, W, 14], fill=RED)


# ---------------------------------------------------------------- Overlays
def draw_hud(d, story, beat, t_total):
    day = beat.get("day", story.get("day", 1))
    h0, m0 = map(int, story.get("start_time", "03:12").split(":"))
    mins = h0 * 60 + m0 + beat.get("minute_offset", 0)
    time_s = f"{(mins // 60) % 24:02d}:{mins % 60:02d}"
    o2 = beat.get("oxygen", story.get("oxygen", 98))
    x, y = 56, 150
    d.ellipse([x, y + 8, x + 14, y + 22], fill=RED)
    d.text((x + 26, y), f"DAY {day}", font=font(F_MONO, 30), fill=RED)
    d.text((x, y + 44), time_s, font=font(F_BLACK, 96), fill=LINE)
    tw = d.textlength(time_s, font=font(F_BLACK, 96))
    d.text((x + tw + 10, y + 100), "UTC", font=font(F_BLACK, 34), fill=LINE)
    d.line([x, y + 160, x + 330, y + 160], fill=DIM, width=2)
    d.text((x, y + 175), f"OXYGEN  {o2}%", font=font(F_MONO, 26), fill=(170, 176, 188))
    crew = beat.get("crew", story.get("crew", 1))
    d.text((x, y + 210), "CREW    ", font=font(F_MONO, 26), fill=(170, 176, 188))
    d.text((x + d.textlength("CREW    ", font=font(F_MONO, 26)), y + 210), str(crew),
           font=font(F_MONO, 26), fill=RED)
    label = f"THE LAST SIGNAL · PART {story['part']}"
    lw = d.textlength(label, font=font(F_MONO, 24))
    d.text((W - lw - 56, y + 4), label, font=font(F_MONO, 24), fill=(120, 126, 140))


def draw_comms(d, msgs, t_in, typing=False):
    """Funkterminal mit eingehenden Nachrichten, die nacheinander erscheinen."""
    x0, y0, x1 = 170, 540, 910
    shown = [m for m in msgs if t_in >= m.get("at", 0)]
    h = 150 + max(1, len(shown)) * 110
    d.rounded_rectangle([x0, y0, x1, y0 + h], 46, fill=(24, 27, 34), outline=(56, 60, 72), width=4)
    d.text((x0 + 50, y0 + 40), "◉ EARTH CONTROL", font=font(F_MONO, 32), fill=LINE)
    d.text((x0 + 50, y0 + 84), "last contact: 412 days ago", font=font(F_MONO, 22), fill=RED)
    y = y0 + 140
    for m in shown:
        f = font(F_SANS, 36)
        tw = d.textlength(m["text"], font=f)
        age = t_in - m.get("at", 0)
        a = min(1.0, age / 0.25)
        if m.get("from", "them") == "me":
            bx1 = x1 - 40
            bx0 = bx1 - tw - 56
            col = tuple(int(c * a + 24 * (1 - a)) for c in (40, 110, 230))
        else:
            bx0 = x0 + 40
            bx1 = bx0 + tw + 56
            col = tuple(int(c * a + 24 * (1 - a)) for c in (52, 56, 68))
        d.rounded_rectangle([bx0, y, bx1, y + 80], 30, fill=col)
        d.text((bx0 + 28, y + 18), m["text"], font=f, fill=tuple(int(c * a) for c in LINE))
        y += 110


def draw_tag(d, text, t_in):
    s = min(1.0, t_in / 0.18)
    f = font(F_BLACK, int(84 * (1.6 - 0.6 * s)))
    tw = d.textlength(text, font=f)
    cx, cy = W / 2, 760
    pad = 40
    box = [cx - tw / 2 - pad, cy - 70, cx + tw / 2 + pad, cy + 70]
    img = Image.new("RGBA", (int(box[2] - box[0]) + 40, int(box[3] - box[1]) + 40), (0, 0, 0, 0))
    g = ImageDraw.Draw(img)
    g.rectangle([20, 20, img.width - 20, img.height - 20], fill=RED + (255,), outline=(255, 255, 255, 255),
                width=6)
    g.text((20 + pad, 20 + 70 - f.size * 0.62), text, font=f, fill=(255, 255, 255, 255))
    img = img.rotate(-4, resample=Image.BICUBIC, expand=True)
    return img, (int(cx - img.width / 2), int(cy - img.height / 2))


def draw_caption(d, words, highlight):
    """Großes Untertitel-Wort/-Gruppe in der Bildmitte unten."""
    f = font(F_BLACK, 104)
    text = " ".join(words).upper()
    size = 104
    while d.textlength(text, font=f) > W - 100 and size > 56:
        size -= 6
        f = font(F_BLACK, size)
    total = d.textlength(text, font=f)
    x = (W - total) / 2
    y = 1440
    for w in words:
        clean = w.strip(".,!?…:;\"'").lower()
        col = ACCENT if clean in highlight else (255, 255, 255)
        d.text((x, y), w.upper(), font=f, fill=col, stroke_width=8, stroke_fill=(0, 0, 0))
        x += d.textlength(w.upper() + " ", font=f)


def _caption_groups(words, maxlen=2):
    """Teilt die Wortliste in Gruppen von 1-2 Wörtern (kurz = mehr Spannung)."""
    groups, cur = [], []
    for w in words:
        cur.append(w)
        if len(cur) >= maxlen or w[0][-1] in ".!?…," or len(w[0]) > 8:
            groups.append(cur)
            cur = []
    if cur:
        groups.append(cur)
    return groups


# ---------------------------------------------------------------- Hauptfunktion
def render(story, words, voice_mp3, sound_wav, out_mp4, lead_in=0.4):
    beats = story["beats"]
    duration = (words[-1][2] if words else 20) + lead_in + 1.6

    # Zeitspannen der Beats aus den Wortzeitstempeln ableiten
    spans, i = [], 0
    for b in beats:
        n = len(b["text"].split())
        seg = words[i:i + n]
        i += n
        spans.append((seg[0][1] + lead_in, seg[-1][2] + lead_in, seg))
    spans = [(0.0 if k == 0 else spans[k][0], spans[k + 1][0] if k + 1 < len(spans) else duration, s[2])
             for k, s in enumerate(spans)]

    cap = []
    for g in _caption_groups(words):
        cap.append((g[0][1] + lead_in, g[-1][2] + lead_in + 0.12, [w[0] for w in g]))

    bases = {}
    ff = subprocess.Popen([
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-i", voice_mp3, "-i", sound_wav,
        "-filter_complex",
        f"[1:a]adelay={int(lead_in * 1000)}|{int(lead_in * 1000)},volume=1.0[v];"
        "[2:a]volume=0.5[m];[v][m]amix=inputs=2:duration=longest:normalize=0[a]",
        "-map", "0:v", "-map", "[a]", "-c:v", "libx264", "-preset", "medium", "-crf", "19",
        "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-t", f"{duration:.2f}",
        "-movflags", "+faststart", out_mp4,
    ], stdin=subprocess.PIPE)

    n = int(duration * FPS)
    for fi in range(n):
        t = fi / FPS
        k = next((j for j, (a, b, _) in enumerate(spans) if t < b), len(beats) - 1)
        beat = beats[k]
        a, b, _ = spans[k]
        t_in = t - a
        scene = beat.get("scene", "window")
        if scene not in bases:
            bases[scene] = scene_base(scene)
        img = bases[scene].copy()
        d = ImageDraw.Draw(img)
        draw_scene_anim(d, scene, t, beat.get("alarm", False))

        if scene not in ("protocol",) and not beat.get("chat"):
            pos = {"window": (380, 0.70), "console": (540, 0.70), "corridor": (540, 0.66),
                   "bunk": (760, 0.70), "airlock": (180, 0.70)}.get(scene, (540, 0.70))
            scale = 1.25 if scene != "corridor" else 0.95
            draw_stickman(d, beat.get("pose", "stand"), pos[0], H * pos[1], scale, t,
                          facing=beat.get("facing", 1))

        if beat.get("chat"):
            draw_comms(d, beat["chat"], t_in)
        if beat.get("tag"):
            tag, at = draw_tag(d, beat["tag"], t_in)
            img.paste(tag, at, tag)

        draw_hud(d, story, beat, t)

        cur = next((c for c in cap if c[0] <= t < c[1]), None)
        if cur:
            draw_caption(d, cur[2], set(w.lower() for w in beat.get("highlight", [])))

        # Ende: "PART X+1" Teaser
        if t > duration - 1.4:
            f = font(F_BLACK, 70)
            s = f"PART {story['part'] + 1} →"
            d.text(((W - d.textlength(s, font=f)) / 2, 1520), s, font=f, fill=RED,
                   stroke_width=6, stroke_fill=(0, 0, 0))

        d.text((56, H - 90), "AI-generated", font=font(F_MONO, 24), fill=(90, 96, 108))

        # Ein-/Ausblenden
        fade = min(1.0, t / 0.4, (duration - t) / 0.5)
        if fade < 1:
            img = Image.blend(Image.new("RGB", (W, H), (0, 0, 0)), img, max(0.0, fade))
        ff.stdin.write(img.tobytes())
    ff.stdin.close()
    ff.wait()
    if ff.returncode:
        raise RuntimeError("ffmpeg fehlgeschlagen")
    return duration
