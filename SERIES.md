# The Last Signal – Serienbibel

## Prämisse
Ein namenloser Astronaut (Strichmännchen, erzählt in der Ich-Form) ist allein auf der
Raumstation **Halcyon**. Vor 412 Tagen ist die Erde verstummt. Dann meldet sich nachts
"Earth Control" über Funk – mit Warnungen, die keinen Sinn ergeben. Etwas ist draußen.

## Ton und Regeln
- Englisch, kurze Sätze, Ich-Erzähler, ruhig und unheimlich. Kein Gore, keine Flüche.
- 20–30 Sekunden pro Folge, 6–9 Beats, ~45–70 gesprochene Wörter.
- Jede Folge: starker Hook im ersten Satz, ein neues Rätsel oder eine neue Regel,
  Cliffhanger am Ende.
- Wiederkehrende Elemente: HUD (Tag, UTC-Zeit, Sauerstoff, Crew), Funkmeldungen von
  "EARTH CONTROL", rote Schilder "PROTOCOL #N", Klopfen in Dreiergruppen.
- Sauerstoff sinkt langsam über die Folgen (98 → …). Crew bleibt 1 – bis zur großen Wendung.
- Keine echten Personen, Marken, Songs oder bekannte Franchises.

## Protokolle (Regeln der Station, nach und nach enthüllt)
1. Never answer an unknown signal. (Folge 1 – gebrochen)
2. Keep the lights off after the knocking.
3. Never open the airlock from the inside at night.
4. If Earth Control asks for your name, do not give it.
5. Count the crew every hour. The number should always be one.
6. (später) The protocols were written by you.

## Handlungsbogen (grob, darf frei ausgestaltet werden)
- Teil 1–3: Das Signal, das Klopfen, die Lichter. Wer ist "Earth Control"?
- Teil 4–6: Die Station reagiert seltsam. Logbücher, die er nicht geschrieben hat.
  Auf dem Funk antwortet eine Stimme, die wie seine eigene klingt.
- Teil 7–9: Die CREW-Anzeige springt nachts auf 2. Etwas ist an Bord.
- Teil 10–12: Wahrheit über die Erde: Die Erde hat nie aufgehört zu senden –
  die Station hat die Nachrichten blockiert. Warum?
- Teil 13+: Finale-Bogen, danach Staffel 2 oder neue Serie.

## Story-JSON (Format)
Siehe `stories/last-signal-part1.json`. Felder pro Beat:
- `scene`: window | console | corridor | bunk | airlock | protocol
- `pose`: stand | sit | crouch | float | reach | lookback | fear
- `text`: gesprochener Satz (genau so wird er vertont)
- `highlight`: 1–2 Wörter für Cyan-Untertitel
- optional: `chat` (Funkmeldungen, `from` them/me, `at` Sekunden), `tag` ("PROTOCOL #N"),
  `alarm` (true), `minute_offset` (Minuten seit Folgenbeginn), `oxygen`, `crew`, `day`,
  `delivery` (ElevenLabs-Regieanweisung wie "whispering")

## Serienende und nächste Serie
- "The Last Signal" endet mit einem Finale in **Teil 12 oder 13** (Auflösung: Wer ist der Doppelgänger,
  was ist mit der Erde, wer schreibt die Protokolle). Ab Teil 10 auf das Finale hinarbeiten.
- Danach folgt die neue Serie **"Night Shift"**: Ein Strichmännchen arbeitet allein nachts an einer
  Tankstelle, die Kunden werden immer seltsamer. Dafür braucht es eine neue 3D-Kulisse
  (Tankstelle, Neonschild, Kasse, Kühlregale, Zapfsäulen im Regen), die noch NICHT gebaut ist.
- Der Autopilot startet "Night Shift" nicht selbst. Nach dem Finale: keine neue Folge erzeugen,
  sondern melden, dass die Kulisse für "Night Shift" vorbereitet werden muss.

## Veröffentlichungsrhythmus
- Aktuell: eine Folge alle 3 Tage (kostenlose Pläne: Upload-Post 10 Uploads/Monat).
- Nach einem Upgrade von Upload-Post und ElevenLabs gewünscht: 3 Folgen pro Tag um 12, 17 und 21 Uhr
  (Europe/Berlin), dann auch TikTok.
