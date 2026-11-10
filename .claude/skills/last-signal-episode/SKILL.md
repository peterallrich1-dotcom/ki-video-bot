---
name: last-signal-episode
description: Erstellt und veröffentlicht eine neue Folge der 3D-Strichmännchen-Horrorserie "The Last Signal" (Hochformat 9:16, englisch) – Story schreiben, kostenlose lokale Erzählerstimme (Kokoro), 3D-Video mit three.js rendern (Repo peterallrich1-dotcom/ki-video-bot) und über den Upload-Post-Connector auf Instagram Reels und YouTube Shorts posten. Immer verwenden, wenn der Nutzer eine neue Folge, den nächsten Part, ein neues Video für "The Last Signal", den Video-Bot, den Autopiloten oder seine Stickman-/Raumstations-Serie erwähnt – auch bei kurzen Bitten wie "mach Part 3", "nächstes Video", "poste die nächste Folge" oder wenn eine geplante Aufgabe den Bot startet.
---

# The Last Signal – neue Folge

Eine Folge entsteht in fünf Schritten: Story → Stimme → 3D-Video → Upload → Log.
Alles Wichtige liegt im Repository `peterallrich1-dotcom/ki-video-bot`.

## Was die Zuschauer wollen (Feedback des Besitzers)

Der Besitzer hat Folge 1 gesehen und klar gesagt, was ein Video "catchy" macht. Das ist
der Maßstab für jede Folge:
- **Alles in 3D und farbenfroh**: Raumschiff, Figur, Licht. Der Renderer `web/scene.js`
  liefert das bereits (Neonfarben, Glow, Kamerafahrten). Nicht auf den alten 2D-Renderer
  `render.py` zurückfallen.
- **Länger, aber durchgehend spannend**: Ziel 35–45 Sekunden, 11–14 Beats, ~95–120 Wörter.
  Jeder Beat bringt eine neue Information, ein Bild oder einen Schock – kein Füllsatz.
- **Kein Leerlauf**: keine langen Sprechpausen. `make_video.py` kürzt Pausen automatisch
  und beschleunigt leicht; schreib außerdem kurze Sätze ohne langes Ausholen.
- Häufige Szenen- und Kamerawechsel (Szene alle 1–2 Beats wechseln), Cliffhanger am Ende.

## 0. Umgebung vorbereiten

```bash
cd /home/user/ki-video-bot || true   # sonst: Repo per add_repo anhängen und dorthin klonen
git pull origin main
(cd web && npm install --no-audit --no-fund)   # three.js + Fonts; node_modules ist nicht im Repo
```
Chromium + Playwright sind in der Cloud-Umgebung vorinstalliert; nichts weiter installieren.
```bash
pip install -q kokoro-onnx soundfile   # kostenlose Stimme; Modell (~350 MB) lädt beim ersten Lauf von GitHub
```
Prüfe, ob die Connector-Tools `mcp__Upload-Post__*` verfügbar sind (ggf. per ToolSearch
laden). Fehlen sie, die Folge trotzdem erstellen und über `deliver.py` zum Abholen ablegen.

## 1. Story schreiben

1. Lies `references/series.md` (Serienbibel: Prämisse, Protokolle, Handlungsbogen, Regeln),
   `episodes/log.json` und die letzten zwei Dateien in `stories/`.
2. N = höchste Teilnummer im Log + 1 (oder höchste Story-Datei + 1, falls noch nicht gepostet).
   Hat ein Log-Eintrag `"finale": true` (Teil 5 ist das Finale), keine neue Folge erzeugen – siehe
   "Serienende und nächste Serie" in `references/series.md`.
3. Schreib `stories/last-signal-partN.json` im Format von `stories/last-signal-part2.json`:
   - Erster Satz = Hook, der direkt an den Cliffhanger der letzten Folge anschließt.
   - `day`, `oxygen` (sinkt langsam), `start_time`, `minute_offset` fortschreiben.
   - Mindestens ein Funk-Chat (`chat`) oder ein neues `tag: "PROTOCOL #N"` pro Folge.
   - `knock: true` lässt die Schleusentür beben und erzeugt Klopfgeräusche; `alarm: true`
     gibt rotes Blinken; `crew` kann für Schockmomente springen.
   - `delivery: "whispering"` für geflüsterte Funkzeilen.
   - Erlaubte Szenen: `window`, `console`, `corridor`, `airlock`, `bunk`, `protocol`.
     Posen: `stand`, `sit`, `crouch`, `float`, `reach`, `lookback`, `fear`, `walk`,
     `knock`, `listen`.
   - Caption: ein Hook-Satz + "Part N+1 soon." – nie "tomorrow", der Rhythmus variiert.
4. `python narration.py stories/last-signal-partN.json` gibt den Sprechtext aus; zähl die
   Wörter (`| wc -w`) und kürze/ergänze, bis 95–120 Wörter erreicht sind.

## 2. Stimme (kostenlos, lokal)

Nichts zu tun: `make_video.py` erzeugt die Stimme automatisch mit Kokoro (Stimme `af_heart`,
weich und natürlich, ohne Pitch-/Hall-Effekte – die tiefe Lewis-Stimme mit Hall gefiel dem Besitzer nicht), wenn **keine** `output/last-signal-partN/voice.mp3`
existiert. Jeder Satz wird einzeln vertont, dadurch sitzen die Untertitel genau.
ElevenLabs wird nicht mehr genutzt (Kosten/Limit). Nur falls der Besitzer das ausdrücklich
wünscht: ElevenLabs-MP3 als `voice.mp3` ablegen, dann nimmt `make_video.py` diese.

## 3. 3D-Video rendern

```bash
python make_video.py stories/last-signal-partN.json --preview   # ein Standbild pro Beat
```
Schau dir die Vorschaubilder in `output/last-signal-partN/preview/` an (z. B. als
Kontaktbogen mit `ffmpeg -pattern_type glob -i 'f*.png' -vf "scale=270:-1,tile=4x3"`).
Achte auf: Figur gut im Bild und nicht angeschnitten, Untertitel lesbar, Chat/Schild
überdecken nicht das Wichtigste, nichts überbelichtet. Bei Problemen die Story
(Szene/Pose/`cam` 0–2 pro Beat) oder `web/scene.js` anpassen und erneut prüfen.

Dann das ganze Video (dauert einige Minuten, im Hintergrund starten):
```bash
python make_video.py stories/last-signal-partN.json
```
Ergebnis: `output/last-signal-partN/last-signal-partN.mp4` + `meta.json`. Prüfe Dauer
(35–45 s) und Ton (`ffmpeg -i ... -af volumedetect -f null -`).

## 4. Veröffentlichen (Upload-Post-Connector)

1. `list_users` → Profil `Young_richg` muss Instagram und YouTube verbunden haben.
2. `create_media_upload` (video/mp4, exakte Bytegröße via `stat -c %s`) → mit
   `curl -X PUT -H "Content-Type: video/mp4" --data-binary @datei "<upload_url>"` hochladen
   → `complete_media_upload` → `media_url`.
3. `upload_video` mit:
   - user `Young_richg`, platforms `["instagram","youtube"]`, videoPathOrUrl = media_url
   - title = Caption + Hashtags; description = Caption + Leerzeile + Hashtags + " #shorts"
   - platformOptions: `instagramMediaType: "REELS"`, `instagramShareToFeed: true`,
     `youtubePrivacyStatus: "public"`, `youtubeContainsSyntheticMedia: true`,
     `youtubeSelfDeclaredMadeForKids: false`, `youtubeTitle: "The Last Signal – Part N #shorts"`,
     `youtubeTags: ["stickman","horror story","scifi","space horror","the last signal"]`
4. Freigabe: Der Besitzer hat am 2026-11-08 ausdrücklich erlaubt: *"Der Bot darf jede neue
   Folge ohne Rückfrage auf Instagram und YouTube veröffentlichen."* Das gilt nur für neue
   Folgen dieser Serie auf diesem Profil. Deshalb: Vorschau-Aufruf, dann sofort derselbe
   Aufruf mit `confirmed: true`. Alles andere (andere Plattformen, Profile, Inhalte,
   TikTok) braucht eine neue Zustimmung.
5. `get_status` pollen bis `completed`. Lehnt Upload-Post mit `upgrade_url` ab
   (Free-Plan: 10 Uploads/Monat, kein TikTok) oder fehlt der Connector: nicht wiederholen,
   sondern `python deliver.py output/last-signal-partN/meta.json` ausführen. Das legt MP4 +
   Caption-Textdatei in `abholen/` ab; mitcommitten. Im Log `"status": "abholen"` setzen.
   Der Besitzer lädt diese Folgen selbst vom Handy hoch.

## 5. Abschließen

- Eintrag an `episodes/log.json` anhängen: part, story, posted_at (UTC), youtube,
  instagram, upload_post_request_id.
- Commit + `git push origin main`, Nachricht "Folge N veröffentlicht".
- Antwort an den Nutzer auf Deutsch, kurz: Teil, Titel, Dauer, beide Links – oder bei
  `abholen`: den Link
  https://github.com/peterallrich1-dotcom/ki-video-bot/tree/main/abholen und dass er die
  Folge selbst hochladen soll. Falls etwas nicht geklappt hat: was und warum.
