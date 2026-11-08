# Jarvis – Sprach-App

Eigene kleine Web-App für Peters Sprachassistentin Jarvis. Läuft im Browser und lässt
sich als App auf iPhone/Android (Home-Bildschirm) und Mac (Dock) ablegen.

- **Stimme & Gespräch:** ElevenLabs-Agent `agent_5501m6xpk9tye3x92gap4myzfqgy`
  (weibliche Stimme, Deutsch, denkt mit Claude). Einstellungen im ElevenLabs-Dashboard.
- **Starten:** Auf die Kugel tippen. Auflegen mit „Tschüss“ oder dem Button.
- **„Jarvis“-Modus:** Die App hört auf das Wort „Jarvis“ und startet dann das Gespräch
  (nur solange die App offen und im Vordergrund ist).
- `vendor/` enthält das ElevenLabs-Client-SDK 1.29.0 (MIT), damit kein CDN nötig ist.

Veröffentlichung über GitHub Pages: Repository-Einstellungen → Pages → „Deploy from a
branch“ → Branch wählen, Ordner `/ (root)`. Adresse danach:
`https://peterallrich1-dotcom.github.io/ki-video-bot/jarvis/`
