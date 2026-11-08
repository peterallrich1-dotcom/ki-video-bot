# Autopilot – neue Folge erstellen und veröffentlichen

Diese Anleitung führt eine geplante Session Schritt für Schritt aus. Der Besitzer
(peterallrich1-dotcom) hat am 2026-11-08 ausdrücklich freigegeben:
**"Der Bot darf jede neue Folge ohne Rückfrage auf Instagram und YouTube veröffentlichen."**
Diese Freigabe gilt nur für neue Folgen von "The Last Signal" auf dem Upload-Post-Profil
`Young_richg` (Instagram + YouTube) und nur für Inhalte nach den Regeln in `SERIES.md`.

## 0. Vorbereitung
- Repository `peterallrich1-dotcom/ki-video-bot` liegt unter `/home/user/ki-video-bot`
  (falls nicht: per add_repo anhängen und klonen).
- Lies `SERIES.md`, `episodes/log.json` und die letzten 2 Stories in `stories/`.

## 1. Nächste Folge schreiben
- Teilnummer N = letzte Teilnummer in `episodes/log.json` + 1.
- Schreibe `stories/last-signal-partN.json` im Format von Teil 1, passend zum
  Handlungsbogen, mit Cliffhanger. `day` und `oxygen` gegenüber der letzten Folge
  fortschreiben, `start_time` variieren. `part` = N.
- Caption: 1 Satz Hook + "Part N+1 soon." + 5 Hashtags (#stickman #horrorstory #scifi
  #space #storytime oder passende). `title`: "The Last Signal – Part N: <kurzer Hook>".

## 2. Stimme (ElevenLabs-Connector)
- `python narration.py stories/last-signal-partN.json` → Sprechtext.
- `creative_generate_speech` mit model_id `eleven_v4`, voice_id `BVPhWQykET1TSvfGzrUr`
  ("Jack – Deep Dark Horror Narrator"), prompt = Sprechtext.
- Mit `creative_get_flow_run_status` pollen bis fertig. Die erste erfolgreiche Generation
  nehmen. Nie erneut generieren, um es "nochmal zu versuchen" (kostet doppelt).
- MP3 herunterladen nach `output/last-signal-partN/voice.mp3`
  (Host elevenlabsusercontent.com ist freigegeben).

## 3. Video rendern
- `python make_video.py stories/last-signal-partN.json`
  → `output/last-signal-partN/last-signal-partN.mp4` und `meta.json`.
- Stichprobe: 3–4 Standbilder mit ffmpeg ziehen und prüfen (Untertitel im Bild,
  nichts abgeschnitten). Bei Fehlern korrigieren und neu rendern.

## 4. Veröffentlichen (Upload-Post-Connector)
- `create_media_upload` (video/mp4, exakte Bytegröße) → mit curl PUT auf `upload_url`
  → `complete_media_upload` → `media_url`.
- `upload_video` mit user `Young_richg`, platforms ["instagram","youtube"],
  title = Caption + Hashtags, description = Caption + Hashtags + " #shorts",
  platformOptions: instagramMediaType REELS, instagramShareToFeed true,
  youtubePrivacyStatus public, youtubeContainsSyntheticMedia true,
  youtubeSelfDeclaredMadeForKids false, youtubeTitle "The Last Signal – Part N #shorts",
  youtubeTags [stickman, horror story, scifi, space horror, the last signal].
- Durch die Dauerfreigabe oben: Vorschau aufrufen und direkt danach mit
  `confirmed: true` veröffentlichen.
- `get_status` pollen bis `completed`. Wenn Upload-Post mit `upgrade_url` ablehnt
  (Monatskontingent aufgebraucht): NICHT wiederholen, Folge trotzdem committen und im
  Log als `"pending_upload": true` markieren.

## 5. Abschluss
- Eintrag in `episodes/log.json` (part, story, posted_at, youtube, instagram,
  upload_post_request_id).
- Commit + push auf `main` (Nachricht: "Folge N veröffentlicht").
- Kurze Zusammenfassung mit beiden Links als Ergebnis der Session.

## Wenn etwas schiefgeht
- Connector fehlt / nicht angemeldet: abbrechen, nichts veröffentlichen, Grund melden.
- Keine Inhalte posten, die gegen `SERIES.md` verstoßen.
