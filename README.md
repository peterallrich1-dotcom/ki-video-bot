# KI-Video-Bot – „The Last Signal“

Erstellt automatisch Folgen einer Strichmännchen-Sci-Fi-Horror-Serie im Hochformat (9:16)
für YouTube Shorts, TikTok und Instagram Reels.

## Ablauf
1. Story als JSON in `stories/` (Beats mit Szene, Pose, Text, Funkmeldungen, Protokoll-Schild).
2. Stimme: ElevenLabs („Jack – Deep Dark Horror Narrator“) → `output/<name>/voice.mp3`.
3. `python make_video.py stories/<name>.json` → Untertitel-Timing, Sound, Video.
4. Upload auf die Plattformen (folgt).

## Dateien
- `render.py` – Bild: Strichmännchen, Szenen, HUD, Funk-Chat, Untertitel
- `music.py` – synthetischer, lizenzfreier Sound
- `align.py` – Wort-Zeitstempel aus Sprechpausen
- `voice.py` – direkte ElevenLabs-API (optional, mit API-Key)
- `make_video.py` – alles zusammen
