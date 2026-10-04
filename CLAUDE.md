# juliusniemeyer.de – Hinweise für Claude

Website von Julius (Künstler). Kommunikation auf Deutsch. Technik und Betrieb stehen in `README.md`.

- Statische Seite: `content/*.json` + `images/` → `node build.js` → `_site/`. Bearbeitung über Sveltia CMS (`/admin`).
- Push auf `main` = GitHub Actions baut und lädt per rsync auf den Hetzner-Server (`/opt/website/site`).
- Server-Regeln wie in `C:\dev\backend\CLAUDE.md`: andere Apps nie anfassen, Caddy nur anhängen + validate + reload.
- Keine externen CDNs oder Schriften auf der Seite (DSGVO). Schrift: Geist (selbst gehostet).
- Nach jeder Änderung das Ergebnis in Chrome zeigen (lokal: `npm start` → http://127.0.0.1:4173;
  Port 8080 gehört einer anderen App).

## Stand (05.10.2026)

- Testbetrieb auf https://website.studioniemeyer.de (nur mit Mainframe-Login), Kachel „Website“ im Mainframe.
- juliusniemeyer.de zeigt noch auf Cargo (Nameserver ns1/ns2.cargo.site). Umstellung erst nach ein paar Tagen
  Testbetrieb und Julius' OK: Nameserver bei IONOS zurücksetzen, A-Records `@` und `www` → 46.224.113.239,
  Caddy-Block durch `deploy/Caddyfile.live.snippet` ersetzen, Kachel-URL in `backend/server/apps.json` anpassen.
  Danach kann Julius Cargo kündigen.
- CMS-Login (GitHub-Zugangsschlüssel) ist noch nicht eingerichtet.

## Offen: Design-Überarbeitung

Prototypen in `design/variants.js` (nicht live): `npm run build && node design/variants.js`, dann
http://127.0.0.1:4173/varianten.html.

- A · Werkindex, B · Projekte, C · Archiv hell (Vektorfeld „Ordnung → Unordnung“, Filter, fig.-Nummern).
- **Julius findet C am interessantesten – nächster Schritt: C in Schwarz (dunkle Version) ausprobieren,
  evtl. weitere Varianten.** Entscheidung steht noch aus.
- Ideen zur Auswahl: eigene Seite pro Werk, DE/EN, Portfolio-PDF, „Aktuell“-Zeile statt Datum oben rechts,
  Bildunterschriften vereinheitlichen („ - “ vs. „ / “, „2. Price“ → „2nd Prize“), Social-Links.
