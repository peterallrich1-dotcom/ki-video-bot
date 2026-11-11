---
name: video-bot
description: Vollautomatischer KI-Video-Bot von ScaryStory – erstellt alle 3 Tage eine neue Folge einer 3D-Strichmännchen-Horrorserie (9:16, englisch), wertet vorher aus, welche Videos am besten laufen, wählt oder wechselt die Serie, erzeugt Story, kostenlose Stimme und 3D-Video (Repo peterallrich1-dotcom/ki-video-bot) und plant den Post über Upload-Post für 12:00 Uhr auf Instagram Reels und YouTube Shorts ein. Immer verwenden, wenn eine geplante Aufgabe den Bot startet oder der Nutzer eine neue Folge, das nächste Video, eine neue Serie, Night Shift, The Last Signal, den Autopiloten oder seine Stickman-Videos erwähnt.
---

# ScaryStory Video-Bot

Der Besitzer will **nichts mehr selbst tun**. Jeder Lauf entscheidet selbst und endet mit einem
eingeplanten (oder zum Abholen abgelegten) Video. Ablauf: Auswerten → Serie wählen → Story →
Video → Einplanen → Log.

## Was gute Videos ausmacht (Feedback des Besitzers)
- Alles in 3D und farbenfroh, sehr anschaulich, "das Gehirn will die ganze Zeit gucken".
- Wenig Lücken: kurze Sätze, keine Füllsätze, Szene/Kamera alle 1–2 Beats wechseln.
- 35–60 Sekunden, Finale gern länger. Starker Hook im ersten Satz, Cliffhanger am Ende.
- Wenig Fehler: Vorschau prüfen (Figur im Bild, nichts angeschnitten/überbelichtet).
- Stimme: kostenlos lokal, `af_heart` (weich). Keine Pitch-/Hall-Effekte – die tiefe Stimme mit
  Hall gefiel nicht.

## 0. Vorbereitung
```bash
cd /home/user/ki-video-bot && git pull origin main
(cd web && npm install --no-audit --no-fund)
pip install -q kokoro-onnx soundfile        # Stimmmodell lädt beim ersten Lauf (~350 MB) von GitHub
```
Upload-Post-Tools per ToolSearch laden (`+Upload-Post`). Fehlen sie: trotzdem weitermachen und
am Ende `deliver.py` nutzen.

## 1. Auswerten, was gut läuft
- Für jeden Eintrag in `episodes/log.json` mit `upload_post_request_id`, der älter als 24 h ist:
  `get_post_analytics(requestId)` und Aufrufe/Likes/Kommentare je Plattform als `"stats"` mit
  Datum in den Eintrag schreiben.
- Optional `get_analytics(profileUsername="Young_richg", platforms=["instagram","youtube"])`.
- Kurz in `episodes/insights.md` anhängen (Datum, 3–5 Stichpunkte): Welche Serie/Folge lief am
  besten? Zusammenhang mit Länge, Hook, Thema? Was nehme ich für die nächste Folge mit?
  Diese Erkenntnisse beim Schreiben wirklich anwenden.

## 2. Serie wählen
Lies `series/README.md` (Rotation + Ideen) und die `bible.md` der Kandidaten.
- Läuft eine Serie und ihr Finale ist noch nicht erschienen → nächste Folge dieser Serie.
- Laufen die letzten 2 Teile klar schlecht (< 50 % Median) → nächste Folge wird das Finale.
- Nach einem Finale → nächste vorbereitete Serie, sonst neue Serie aus dem Ideen-Speicher anlegen
  (nur mit vorhandenen Kulissen; `bible.md` + `example.json` schreiben, in README eintragen).
Teilnummer N = höchster Teil dieser Serie im Log + 1.

## 3. Story schreiben
`stories/<serien-ordner>-partN.json` im Format der `example.json` der Serie (bei The Last Signal:
`stories/last-signal-part*.json`). Felder pro Beat: `scene`, `pose` (stand, sit, crouch, float,
reach, lookback, fear, walk, knock, listen), `text`, `highlight`, optional `cam` (0–2), `chat`,
`tag`, `alarm`, `flicker`, `dark`, `run`, `twin`/`twin_pose`, `chime`, `headlights`, `knock`,
`door_open`, `delivery: "whispering"`. Caption: ein Hook-Satz + "Part N+1 soon." bzw. beim Finale
ein Finale-Hinweis; 5 Hashtags. Beim Finale `"finale": true`.
`python narration.py <story>` → Wörter zählen (Ziel 100–160, Finale bis 210).

## 4. Video erzeugen
```bash
python preview_story.py <story>          # schnelle Bildvorschau ohne Stimme
python make_video.py <story> --preview   # mit Stimme und echtem Timing
```
Kontaktbogen der Vorschau ansehen und Fehler beheben (Szene/`cam`/Pose ändern). Dann:
```bash
python make_video.py <story>             # ~25 s Rechenzeit pro Videosekunde, im Hintergrund
```
Ergebnis: `output/<name>/<name>.mp4` + `meta.json`. 3 Standbilder + Lautstärke prüfen.

## 5. Einplanen (Upload-Post)
Freigabe des Besitzers (8.–11.11.2026): *"Der Bot darf jede neue Folge ohne Rückfrage auf
Instagram und YouTube veröffentlichen"* und *"ab jetzt voll automatisch … auch mal das Thema
wechseln"*. Gilt für neue Folgen der Bot-Serien auf dem Profil `Young_richg` (Instagram +
YouTube) – nicht für TikTok, andere Profile oder andere Inhalte.
1. `create_media_upload` → `curl -X PUT -H "Content-Type: video/mp4" --data-binary @<mp4> "<upload_url>"`
   → `complete_media_upload` → `media_url`.
2. `upload_video`: user `Young_richg`, platforms `["instagram","youtube"]`,
   `scheduledDate` = heute `T12:00:00`, `timezone` `Europe/Berlin` (ist 12 Uhr schon vorbei:
   sofort posten, ohne scheduledDate). title = Caption + Hashtags; description = Caption +
   Leerzeile + Hashtags + " #shorts"; platformOptions: `instagramMediaType: "REELS"`,
   `instagramShareToFeed: true`, `youtubePrivacyStatus: "public"`,
   `youtubeContainsSyntheticMedia: true`, `youtubeSelfDeclaredMadeForKids: false`,
   `youtubeTitle: "<Serie> – Part N #shorts"` (Finale: "– FINALE #shorts"), passende `youtubeTags`.
   Erst ohne `confirmed` (Vorschau), dann gleich mit `confirmed: true`.
3. Lehnt Upload-Post ab (z. B. `upgrade_url`, Free-Plan 10 Uploads/Monat) oder fehlt der
   Connector: nicht wiederholen → `python deliver.py output/<name>/meta.json` (legt MP4 + Caption
   in `abholen/` ab), Log-Status `"abholen"`.

## 6. Abschließen
- Log-Eintrag: series, part, story, status (`scheduled`/`posted`/`abholen`), scheduled_for,
  upload_post_job_id, upload_post_request_id, finale (falls ja). Links trägt der nächste Lauf nach
  (`get_status`).
- Commit + `git push origin main`.
- Kurze deutsche Zusammenfassung: Serie, Teil, Titel, Termin – oder Abhol-Link
  https://github.com/peterallrich1-dotcom/ki-video-bot/tree/main/abholen
