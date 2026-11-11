# Night Shift – Serienbibel

## Prämisse
Ein Strichmännchen (Ich-Erzähler, rotes Tankstellen-Shirt) arbeitet allein die Nachtschicht in der
Tankstelle "NIGHT STOP" irgendwo im Nirgendwo. An der Kasse klebt eine Liste mit Regeln. Zwischen
3 und 4 Uhr nachts kommen Kunden, die keine Menschen sind. Der Manager schreibt nur per SMS – und
wurde seit drei Jahren nicht mehr gesehen.

## Ton und Regeln
- Englisch, Ich-Erzähler, kurze Sätze, ruhig und unheimlich. Kein Gore, keine Flüche.
- 35–60 Sekunden, 10–16 Beats. Jede Folge: Hook, neue Regel ("RULE #N"), Cliffhanger.
- Story-Felder siehe `example.json`: `hud_style: "gas"`, `ambience: "rain"`, `night`, `customers`,
  `outfit`, `chat_title: "MANAGER"`, `twin_style: "customer"`.
- Szenen: `gas_exterior` (Zapfsäulen im Regen), `gas_counter` (Kasse), `gas_aisle` (Gang mit
  Kühlschränken), `gas_window` (Blick durch die Glasfront; `headlights: true` = Auto fährt vor).
- Effekte: `chime: true` (Türglocke), `flicker: true` (Neonröhren flackern), `twin: true` (der
  unheimliche Kunde: grau, schwarze Augen, Grinsen), `customers` im HUD hochzählen.

## Regeln an der Kasse (nach und nach enthüllt)
1. No customers between 3 and 4 AM.
2. If someone asks for pump number 7, tell them it is out of order. There is no pump 7.
3. Never look at a customer's face for longer than three seconds.
4. If the manager calls, do not answer. The manager does not call.
5. If the lights go out, stay behind the counter until they come back on.
6. (Finale) If you find your own name on this list, your shift is over.

## Handlungsbogen (5 Teile, Finale in Teil 5)
- Teil 1: Erste Nacht, die Regeln, der erste Kunde um 3:02 (siehe example.json).
- Teil 2: Ein Kunde will an "Zapfsäule 7". Draußen steht plötzlich eine siebte Säule.
- Teil 3: Der Manager ruft an. Auf dem Telefon: die eigene Nummer.
- Teil 4: Licht aus. Hinter dem Tresen: Kratzen. Die Kühlschranktüren gehen von allein auf.
- Teil 5 (Finale): Auf der Regelliste steht sein Name. Er ist der neue Manager – und schreibt dem
  nächsten Nachtschichtler: "Don't look at its face." Kreis schließt sich.
