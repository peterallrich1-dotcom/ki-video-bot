# Serien des Video-Bots

| Ordner | Serie | Status | Kulisse |
|---|---|---|---|
| `the-last-signal/` | The Last Signal (Raumstation) | **abgeschlossen** (5 Teile, Finale 10.11.2026) | window, console, corridor, airlock, bunk, protocol |
| `night-shift/` | Night Shift (Tankstelle) | **als Nächstes / laufend** | gas_exterior, gas_counter, gas_aisle, gas_window |

## Rotation
- Eine Serie läuft bis zu ihrem Finale (Standard: 5 Teile). Das Finale bekommt `"finale": true`.
- Läuft eine Serie klar schlecht (die letzten 2 Teile unter 50 % der Median-Aufrufe aller Videos),
  darf der Bot sie mit der nächsten Folge vorzeitig zum Finale bringen.
- Nach einem Finale startet der Bot die nächste Serie. Gibt es keine vorbereitete, erfindet er eine
  neue, die **mit den vorhandenen Kulissen** auskommt (z. B. Staffel 2 auf der Raumstation mit neuer
  Prämisse, oder eine andere Geschichte in der Tankstelle), legt dafür `series/<name>/bible.md` und
  `example.json` an und trägt sie hier ein.
- Neue Kulissen in `web/scene.js` darf der Bot nur bauen, wenn er sie mit `preview_story.py`
  sorgfältig prüft (Figur im Bild, nichts überbelichtet, keine Kamera in Objekten).

## Ideen-Speicher (passen zu vorhandenen Kulissen)
- "Signal 2: The Second Station" – Raumstation, eine Frau wacht auf, die Station ist voller Kopien.
- "Last Customer" – Tankstelle, aus Sicht des unheimlichen Kunden erzählt.
- "Graveyard Shift" – Tankstelle, ein Funkgerät empfängt Nachrichten aus der Zukunft.
