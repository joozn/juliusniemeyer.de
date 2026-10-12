# juliusniemeyer.de – Hinweise für Claude

Website von Julius (Künstler). Kommunikation auf Deutsch. Technik und Betrieb stehen in `README.md`.

- Statische Seite: `content/*.json` + `images/` → `node build.js` → `_site/`. Bearbeitung über Sveltia CMS (`/admin`).
- Push auf `main` = GitHub Actions baut und lädt per rsync auf den Hetzner-Server (`/opt/website/site`).
- Server-Regeln wie in `C:\dev\mainframe\CLAUDE.md`: andere Apps nie anfassen, Caddy nur anhängen + validate + reload.
- Keine externen CDNs oder Schriften auf der Seite (DSGVO). Schrift: Geist (selbst gehostet).
- Nach jeder Änderung das Ergebnis in Chrome zeigen (lokal: `npm start` → http://127.0.0.1:4173;
  Port 8080 gehört einer anderen App).

## Stand (12.10.2026)

- **Live auf https://juliusniemeyer.de** (seit 12.10.2026, Hetzner). DNS bei IONOS (Nameserver zurückgesetzt), A `@`/`www`
  → 46.224.113.239, kein AAAA. Mail bleibt bei IONOS (MX mx00/mx01.ionos.de, DKIM, SPF) – nicht anfassen.
- Caddy: Block `juliusniemeyer.de` + `www` (Weiterleitung) aus `deploy/Caddyfile.live.snippet` angehängt,
  Sicherung `/opt/caddy/Caddyfile.bak-20261012-163953`. Zertifikat Let's Encrypt, verlängert Caddy selbst.
- Noch offen: Testbetrieb-Block `website.studioniemeyer.de` entfernen, wenn Julius zufrieden ist; Kachel-URL in
  `C:\dev\mainframe\server\apps.json` auf juliusniemeyer.de; danach kann Julius Cargo kündigen.
- CMS-Login (GitHub-Zugangsschlüssel) ist noch nicht eingerichtet.

## Design: Feinschliff übernommen (12.10.2026)

Julius hat im Konfigurator (`design/konfigurator/`, Wahl in `entscheidung.md`) entschieden; umgesetzt in
`assets/style.css`, `assets/main.js`, `build.js`. Abweichungen dazu: Fließtext leicht (340), Leisten und Titel normal (480);
Bildkontrast 70 % der Option; Scrollbar wird beim Überfahren breit in Akzentfarbe; Satz am Anfang kleiner.
- **Bildnummern** `fig. PROJEKT-JJ.NN` (z. B. SKI-26.03) stehen fest im Feld `fig` in `content/works/*.json`.
  Nie neu durchnummerieren. Neue Bilder ohne `fig` bekommen beim Build die nächste freie Nummer ihres Projekts.
- **Datum oben rechts** = Tag des letzten Commits (automatisch). Optional „Aktuell“-Zeile (`aktuell`, `aktuell_bis` in site.json).

## Konzept und Laborelemente

Konzept der Seite (Erscheinung, fig.-Nummern, Laborelemente 1–5, Regeln): **`KONZEPT.md`** – vor Designänderungen lesen.
Alle fünf Laborelemente sind live in `assets/labor.js` und entschieden. Testpult (Tage simulieren, Feld umschalten):
`npm run build && node design/elemente/build.js`, dann `node design/konfigurator/server.js` → http://127.0.0.1:4174/elemente.html
Seite „Available“ zeigt live „Coming soon“; der Shop mit Beispieldaten nur lokal: `SHOP_PREVIEW=1 npm run build`.
Shop: entschieden und geplant in **`SHOP.md`** (Website + SPINE + Konto + Zentrale + Kontor + Mainframe).

## Design-Prototypen (erledigt)

Varianten A/B/C (`design/variants.js`), Feinschliff (`design/feinschliff.js`) und Konfigurator (`design/konfigurator/`)
sind abgeschlossen; Julius hat sich für den Feinschliff der bestehenden Seite entschieden (siehe oben, `KONZEPT.md`).

## Architektur

- Gesamtbild aller Apps (mit Julius entschieden 2026-10-09). `C:\dev\ARCHITEKTUR.md` gibt es nicht mehr; die Entscheidungen stehen in den
  Architektur-Abschnitten von `C:\dev\mainframe\CLAUDE.md` (Login, Apps), `C:\dev\02_apps\konto\CLAUDE.md` (Abo, Stripe)
  und `C:\dev\02_apps\crm\CLAUDE.md` (Zentrale: Kontakte, Projekte, Mailversand). Vor Arbeiten daran dort nachlesen; bei Widerspruch Julius fragen.
- juliusniemeyer.de zieht im Zielbild von Cargo auf Hetzner (DNS zurück zu IONOS).
