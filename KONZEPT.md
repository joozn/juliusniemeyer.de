# Konzept juliusniemeyer.de

Stand 12.10.2026. Shop: siehe `SHOP.md`. Grundlage für alle weiteren Änderungen: Was hier steht, gilt, bis Julius es ändert.

## Idee

Die Seite ist keine Mappe, sondern eine kleine Versuchsanordnung. Sie arbeitet nach denselben Prinzipien
wie die Arbeiten: Systeme, Entropie, Zerfall, Messung, Beobachtung. Leitsatz:
**„all ordered systems tend toward disorder“** – auf der Seite nicht als Zitat, sondern als echter Vorgang.

Die Arbeiten stehen im Vordergrund; die Laborelemente sind leise und laufen am Rand mit.

## Erscheinung

- **Grund:** Nachtblau `#0a0b1d` (UV-Licht der Installationen). Text und Linien voll Weiß.
- **Akzent:** Reinblau `#0000ff` – Links, Kapitellinie, Textauswahl, Hover als Farbblock.
- **Schrift:** Geist (selbst gehostet). Fließtext leicht (340), Leisten und Titel normal (480).
  Bildunterschriften, Nummern, Messwerte in Geist Mono.
- **Aufbau:** Satz am Anfang (Bilder schon angeschnitten sichtbar), je Werkgruppe dicke blaue Kapitellinie,
  Titel links, Text in breiter Spalte rechts, Galerie in Blocksatz-Reihen, breiter Seitenrand (6 %).
- **Bilder:** leicht mehr Kontrast, leicht gerundet, Rahmen in Akzentfarbe beim Überfahren, weiches Einblenden.
- **Großansicht:** durchscheinend, Bedienung in Mono-Wörtern, unten fig.-Nummer, Zähler, Bildunterschrift.
- Mauszeiger Fadenkreuz, Scrollbar als Haarlinie (beim Überfahren breit und blau), Favicon blauer Punkt.

## Ordnung und Messung

- **Bildnummern `fig. PROJEKT-JJ.NN`** – z. B. `SKI-26.03` = skia, 2026, Bild 3 dieses Projekts.
  Ein Projekt behält sein Kürzel über alle Werkgruppen hinweg. Nummern sind fest gespeichert und ändern sich nie,
  auch nicht beim Umsortieren oder wenn neue Projekte dazukommen. Schwarz oder Weiß je nach Helligkeit der Bildecke.
- **Datum oben rechts** = Stand des Dokuments (Tag der letzten Änderung, automatisch).
  Daneben optional „Aktuell“ für Ausstellungen, verschwindet nach dem Enddatum von selbst.

## Laborelemente (`assets/labor.js`)

1. **Zerfall seit dem letzten Eingriff.** S = 1 − e^(−Δt/30 Tage). Haarlinien driften und reißen,
   die blaue Kapitellinie zerbricht in Scherben, die sich verschieben und drehen, fig.-Nummern verrutschen und
   verlieren Zeichen, die Wortmarke zerbröselt von links (Ordnung) nach rechts (Unordnung).
   Unten rechts: `Δt … d · S = …`. Jede Arbeit an der Seite setzt die Ordnung wieder her.
2. **Beobachtereffekt** (wie *skia*): Bilder weichen der bewegten Maus aus und kommen näher, wenn sie ruht.
3. **Messinstrument:** Fadenkreuzlinien und Anzeige unten links – Position, fig. unter dem Zeiger,
   Scrollgeschwindigkeit, Zeit auf der Seite.
4. **Geiger:** Funken irgendwo auf dem Bildschirm wie Strahlungstreffer auf Film (Bikini-Atoll),
   Poisson-verteilt, ca. 1 pro Sekunde, manchmal kurze Schauer. Mit Knacken eines Zählrohrs.
   Ton wird beim ersten Besuch erfragt, Schalter „Sound“ in der Fußzeile.
5. **Feld am Seitenende:** bei jedem Laden zufällig eines von drei Experimenten –
   Strömung (laminar → turbulent), Diffusion (Gas verlässt die Kammer, Entropie S live),
   Halbwertszeit (Punktraster zerfällt, N(t)). Klick setzt das Experiment zurück.

2 und 3 nur mit Maus. Bei „Bewegung reduzieren“ im System laufen keine Animationen.

## Regeln

- Keine externen Dienste, CDNs oder Schriften (DSGVO). Ton wird im Browser erzeugt, keine Audiodateien.
- Alles Neue zuerst als Prototyp unter `design/` (nicht live), Julius entscheidet, dann einbauen.
- Elemente 1–5 sind entschieden; nur auf Wunsch von Julius ändern.
