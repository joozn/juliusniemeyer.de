# Shop – Entscheidungen und Plan

Mit Julius entschieden am 12.10.2026. Gilt für juliusniemeyer.de und nach demselben Prinzip für OSCAR.
Architektur-Grundlage: Abschnitte „Architektur“ in `C:\dev\mainframe\CLAUDE.md`, `C:\dev\02_apps\konto\CLAUDE.md`,
`C:\dev\02_apps\crm\CLAUDE.md`. Stripe läuft im Testmodus (`sk_test_…`), bis Julius live schaltet.
**Stripe Connect** (entschieden 12.10.2026): Kunstverkauf als verbundenes Konto unter der Konto-Plattform.

Schnittstellen zwischen den Apps (wer speichert was, wer schickt wem was): **`C:\dev\mainframe\docserkauf.md`**.
Nachtrag 2026-10-12 (Julius): Ein Unikat kann pro Werk trotzdem **direkt kaufbar** sein (`modus: kauf`, z. B. die Voids bei OSCAR).

**Schnittstellen-Vertrag** (wer speichert was, Endpunkte, Ereignisse, Reihenfolge): `C:\dev\mainframe\docserkauf.md`.
Dort zuerst ändern, dann in den Apps.

## Grundsatz

Kein eigenes Shopsystem. Die vorhandenen Apps werden verbunden, jede behält ihre Aufgabe:

| Baustein | Aufgabe |
|---|---|
| **SPINE** (`C:\dev\02_apps\spine`) | einzige Quelle für Werke, Editionen, Preise, Status, Verkäufe, Anfragen, PDF-Dossiers |
| **Website** (dieses Repo) | Bereich „Available“: zeigt, was SPINE freigibt; Kaufen / Anfragen |
| **Konto** (`C:\dev\02_apps\konto`) | einziger Dienst, der mit Stripe spricht; braucht dafür Einmalzahlungen (bisher nur Abos) |
| **Zentrale** (`C:\dev\02_apps\crm`) | Käufer und Anfragende als Kontakte; verschickt alle Mails (Bestätigung, Dossiers) |
| **Kontor** (`C:\dev\02_apps\kontor`) | Rechnung zu jedem Verkauf; später automatische USt-Abführung |
| **Mainframe** (`C:\dev\mainframe`) | Handlungsnachricht bei jedem Verkauf und jeder Anfrage |

## Entscheidungen

- **Zuordnung:** In SPINE wird pro Werk gewählt, wo es erscheint: juliusniemeyer.de oder OSCAR.
- **Unikate: nur auf Anfrage.** Ablauf: Anfrage starten → E-Mail angeben → Frage „weitere Arbeiten anfragen?“
  (mehrere wählbar) → SPINE erstellt im Hintergrund je Werk ein PDF-Dossier → Versand an die Person (über die Zentrale)
  → Anfrage ist im System hinterlegt (SPINE + Kontakt in der Zentrale) → Handlungsnachricht im Mainframe.
- **Editionen: direkt kaufbar** über Stripe Checkout (Lieferadresse dort).
  - Die gewünschte **Editionsnummer** kann man sich aussuchen (aus den noch freien Nummern); sie wird bis zum
    Verkauf korrekt übergeben (Reservierung → Zahlung → Verkauf in SPINE).
  - **„Capitalistic selling“**, pro Edition zuschaltbar: Mit jedem Verkauf verdoppelt sich der Preis
    (aktueller Preis = Startpreis × 2^verkaufte Exemplare). Preis wird immer serverseitig berechnet und auf der Seite
    live angezeigt, nie aus dem Browser übernommen.
  - **Artist Proofs:** Jede Edition zeigt „edition of N + 1 AP“; die Zahl der APs ist in SPINE pro Edition
    einstellbar (z. B. + 2 AP). APs werden nicht über den Shop verkauft.
  - **Capitalistic selling: keine Nummernwahl** – man bekommt automatisch die nächste freie Nummer (aufsteigend).
  - **Capitalistic selling ausverkauft:** kein „next copy“ mehr, stattdessen nur „last copy was sold for: <Preis>“.
- **Rahmen:**
  - Unikate sind fertig gerahmt, der Rahmen ist im Preis enthalten („framed · frame included“).
  - Editionen (v. a. Poster/Drucke) normalerweise ungerahmt; pro Edition wählbare Rahmenoptionen mit Aufpreis
    (z. B. Eiche mit Museumsglas). Rahmenpreis kommt oben drauf und verdoppelt sich nicht mit; gerahmt gilt ein eigenes
    Versand-Schema (Kiste). Rahmen-Optionen zentral in SPINE pflegen und je Edition zuordnen.
  - Rahmen für Editionen: zugekauft oder selbst gebaut (kein Rahmenbauer).
- **Lieferung München** als Alternative zum Versand: 15 € kleinere Arbeiten (bis ca. 60 cm), 30 € bis 1 m Kantenlänge,
  50 € darüber (Sprinter muss geliehen werden). **Abholung** in München nach Voranmeldung, kostenlos; Termin per Mail.
  Preis je Versand-Schema hinterlegt (Feld `muenchen`).
- **Versand:** EU-weit direkt kaufbar, weltweit nur auf Anfrage. Versandkosten pro Werk; dazu wiederverwendbare
  Versand-Schemata (z. B. eins für alle Exemplare einer Edition).
- **Umsatzsteuer – Stand der Überlegung (vor Livegang mit Steuerberatung klären):**
  - 7 % gilt nur für Kunstgegenstände im Sinne der Anlage 2 Nr. 53 UStG (Zolltarif Kap. 97): vom Künstler mit der Hand
    geschaffene Gemälde/Zeichnungen, Original-Druckgrafik (vom Künstler selbst abgezogen, limitiert, z. B. Siebdruck),
    Originalskulpturen. Offset-Poster und Digitaldrucke sind in der Regel keine Originale → 19 %.
  - Rahmen: Nach den Anmerkungen zu Kap. 97 werden Rahmen wie das Bild behandelt, wenn sie nach Art und Wert zum Werk
    passen. Zusammen mit einem 7-%-Werk verkauft, kann der Rahmen also mit 7 % laufen. Ihn „als Teil des Kunstwerks“ zu
    deklarieren hilft nur, wenn das Werk selbst ein Kunstgegenstand ist – beim Offset-Poster bleibt es bei 19 %.
  - Folge für SPINE: Steuersatz pro Werk/Edition speichern; Rahmen übernimmt den Satz des Werks (Prototyp zeigt noch 19 %).
- **Umsatzsteuer:** Julius ist kein Kleinunternehmer. Kunst mit 7 %; Steuersatz trotzdem pro Werk speichern
  (Drucke/Poster ohne Originaleigenschaft können 19 % haben – mit Steuerberatung klären). Später: automatische Abführung.
- **Nach dem Verkauf:** Handlungsnachricht im Mainframe – klares Signal „hier ist etwas zu tun“, Klick öffnet den
  Auftrag: bezahlt ja/nein, Werk und Editionsnummer, Preis, Lieferadresse, Versand, Kontakt.

## Ablauf Kauf (Edition)

1. Website zeigt Edition mit freien Nummern und aktuellem Preis (Liste beim Build aus SPINE, Status live nachgeladen).
2. „Kaufen“ (mit gewählter Nummer) → Konto → SPINE reserviert die Nummer kurz → Stripe Checkout.
3. Stripe-Webhook → Konto → signiert weiter an SPINE (Verkauf bezahlt, Nummer vergeben, Preis ggf. verdoppelt),
   Zentrale (Kontakt + Bestellbestätigung), Kontor (Rechnung), Mainframe (Handlungsnachricht).
4. Abbruch oder Zeitablauf → Reservierung verfällt.

## Reihenfolge

1. **Website:** Bereich „Available“ als Prototyp mit Beispieldaten (Unikate mit Anfrage-Ablauf, Editionen mit
   Nummernwahl und Capitalistic selling). ← **steht**, als Seite `available.html` im normalen Build
   (`build.js` → `availablePage`, `assets/available.js|css`), Link „Available“ in eigener Spalte der oberen Leiste.
   Daten noch Beispiel: `content/available.json` (Struktur wie später aus SPINE), Kauf/Anfrage nur simuliert.
   Live steht „Coming soon“; Shop-Vorschau lokal mit `SHOP_PREVIEW=1 npm run build`.
   **Website an SPINE angebunden (12.10.2026):** Mit `SPINE_URL` liest der Build die Liste
   (`GET <SPINE_URL>/api/public/shop/juliusniemeyer`), die Seite lädt `…/status` live nach und schickt Kauf
   (`POST …/checkout {work, number?, frame, delivery}`, nie einen Preis) und Anfrage
   (`POST …/inquiry {email, works, subject, website, t}`; `website` = Honigtopf, muss leer sein; `t` = Ladezeitpunkt in ms)
   an SPINE. Ohne `SPINE_URL` oder wenn SPINE nicht antwortet: Beispieldaten, Kauf/Anfrage simuliert.
   - SPINE-Werke brauchen eine `fig`-Nummer für das Bild: entweder von SPINE oder per `id` aus `content/available.json`.
   - SPINE schickt den **aktuellen** Preis; die Seite rechnet für die Anzeige auf den Startpreis zurück.
   - Danke-Seite `danke.html?o=<orderId>` (= `successUrl`), `cancelUrl` = `https://juliusniemeyer.de/available.html`.
   - Was SPINE dafür zusätzlich braucht: **CORS** für `https://juliusniemeyer.de` auf `…/status`, `…/checkout`,
     `…/inquiry` (Browser ruft SPINE direkt auf); `…/status` als Liste `[{id, status, verkauft, reserviert, preis}]`.
   - **Unikat mit `modus: kauf`** (13.10.2026): Preis inkl. Rahmen, Lieferart wählbar, „Buy“ → `POST …/checkout {work, delivery}`,
     daneben „or ask first“. Live-Status für Unikate (SPINE: `verkauft`/`reserviert` als boolean) zeigt „sold“/„reserved“.
   - **Deep-Link je Werk** (13.10.2026, Vorschlag statt eigener Werkseiten): `available.html#<fig>`, z. B. `#TOK-23.01`.
   - **Abbruchseite** `abbruch.html` (immer gebaut, noindex). In SPINE den `cancelPath` des Kanals auf `/abbruch.html` stellen.
     `danke.html` erwähnt SEPA (Zahlung dauert Tage, Werk bleibt reserviert).
   - Test lokal: `SHOP_PREVIEW=1 SPINE_URL=http://127.0.0.1:3000 npm start`.
   - `fig` darf SPINE je Werk mitschicken (Julius, 12.10.2026; zuerst im Vertrag ergänzen).
   - **Rechtstexte als Entwurf** (12.10.2026): `content/legal/agb.json`, `widerruf.json`, `versand.json` (`entwurf: true`,
     nur mit `SHOP_PREVIEW` gebaut, verlinkt auf available.html). Stellen mit [OFFEN: …] klärt Julius; vor Livegang
     anwaltlich prüfen, `entwurf` entfernen, Datenschutz um Shop (Stripe, SPINE, Zentrale) ergänzen und die seit
     19.06.2026 vorgeschriebene elektronische Widerrufsfunktion bauen.
2. **SPINE + Konto:** öffentliche Liste und Reservierung in SPINE, Einmalzahlung in Konto, Testmodus auf dem Server
   (Server-Änderungen nur mit Julius' OK).
3. **Zentrale, Kontor, Mainframe** anbinden; Rechtstexte (AGB, Widerruf, Versand, Datenschutz); Mail-Anbieter wählen; dann live.

## Offen

- Gibt es im Mainframe schon Benachrichtigungen/Aufgaben, an die die Handlungsnachricht andocken kann? Prüfen.
- Reservierungsdauer (Vorschlag 30 min), Versandschemata im Detail, Texte der Mails.
