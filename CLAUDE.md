# juliusniemeyer.de – Website von Julius als Künstler, mit vorbereitetem Werk-Shop
> Art: Website · Ordner `C:\dev\01_websites\juliusniemeyer-web` · Repo `github.com/joozn/juliusniemeyer.de` (Push auf main = Deploy) · App-ID `website` · https://juliusniemeyer.de · Stand: 2026-11-02

## Was ist das
Die persönliche Künstler-Website von Julius: Werkgruppen (Installation, Flat Works, Other), Artist Statement, CV.
Statische Seite aus `content/*.json` + `images/`, gebaut mit `node build.js`, Inhalte pflegbar über Sveltia CMS (`/admin`).
Die Seite ist als „kleine Versuchsanordnung“ gestaltet (Konzept in `KONZEPT.md`). Ein Shop für Werke/Editionen ist
fertig vorbereitet; Werke, Preise und Verkäufe führt SPINE, Zahlung läuft über Konto, Mails über die Zentrale –
die Website zeigt nur an.

## Stand
- **Live auf https://juliusniemeyer.de** seit 12.10.2026 (Hetzner). Deployt ist `0e1fbf7` (origin/main, 15.10.2026);
  die Shop-Vorarbeiten aus dem Zweig `shop-vorbereitung` sind damit auf main, der Shop selbst ist aber **aus**
  (GitHub-Variablen `SHOP_LIVE`/`SPINE_URL` nicht gesetzt, „Available“ zeigt „Coming soon“).
- Cargo ist gekündigt (12.10.). Testbetrieb-Block `website.studioniemeyer.de` am 15.10. aus Caddy entfernt.
  Mainframe-Kachel „Website“ zeigt auf juliusniemeyer.de.
- Design-Feinschliff und alle fünf Laborelemente sind live und entschieden (12.10.).
- Shop-Code fertig: Live-Schalter `SHOP_LIVE`, Widerrufsfunktion (§ 356a BGB), `npm test` 7 Fälle grün (a15a478).
  SPINE-Kanal `juliusniemeyer` ist auf dem Server veröffentlicht (14.10.).
- `favicon.ico` und `og-image.jpg` sind wieder da (15.10.).
- CMS-Login über den Mainframe (1.11.2026): Mainframe live (103ee9f, Route `/cms-auth/auth`, Knopf „Inhalte pflegen“ in der Kachel „Website“); Token (fine-grained, nur dieses Repo, läuft Okt. 2027 ab) liegt als `STUDIO_CMS_TOKEN_WEBSITE` auf dem Server und geht nur an juliusniemeyer.de. `admin/config.yml` hat `base_url: https://studio.studioniemeyer.de/cms-auth` – **noch nicht auf main**: liegt auf Zweig `claude/cms-login` (3bbc37f, gepusht, kein Deploy). /admin ist noch ungetestet.

## Wie es weitergeht
1. Shop live schalten im gemeinsamen Deploy-Termin nach SPINE, Ablauf in `deploy/RUNBOOK-SHOP-LIVE.md`
   (Variablen `SHOP_LIVE=1`, `SPINE_URL=https://oeuvre.studioniemeyer.de`). Der Build bricht ab, solange Rechtstexte Entwurf sind.
2. Testkauf (Karte 4242 + PayPal, danach erstatten), danach zurück auf „Coming soon“, bis Julius den echten Start freigibt.
3. Zweig `claude/cms-login` mit Julius' OK nach `main` (= Deploy der Seite), dann /admin im Browser testen (Mainframe-Login → „Inhalte pflegen“); danach Zweig löschen, im Mainframe `claude/cms-login` samt Worktree aufräumen, Mainframe-CLAUDE.md „Stand“ + Tag `live-2026-11-01c`; Token vor Ablauf (Okt. 2027) erneuern: `set-cms-token.sh` im Mainframe.

Wartet auf Julius:
- Rechtstexte AGB, Widerruf, Versand über eRecht24 prüfen, Datenschutz um Stripe und PayPal ergänzen (E12).
  Erst danach `entwurf` raus und „[OFFEN …]“ auflösen.
- Testkauf freigeben (E37, nach E12 und SPINE-Deploy E25).
- Reicht der Deep-Link `available.html#<fig>` statt eigener Werkseiten?
- Testmodus öffentlich: Vorschlag ist, im Termin zu testen und gleich danach zurück auf „Coming soon“.

## Befehle
```
npm install
npm start                 # baut und startet http://127.0.0.1:4173 (Port 8080 gehört einer anderen App)
npm run build             # nur bauen nach _site/
npm test                  # Build-Tests (Shop, Rechtstexte)
SHOP_PREVIEW=1 npm run build                                   # Shop mit Beispieldaten, nur lokal
SHOP_PREVIEW=1 SPINE_URL=http://localhost:3001 node build.js   # Shop gegen lokales SPINE, dann npm run serve
npm run build && node design/elemente/build.js && node design/konfigurator/server.js
                          # Testpult Laborelemente: http://127.0.0.1:4174/elemente.html
```
Deploy: Push auf `main` → GitHub Actions baut und lädt per rsync nach `/opt/website/site`. Nur mit Julius' OK.

## Regeln
- Nach jeder Änderung das Ergebnis in Chrome zeigen (lokal `npm start` → http://127.0.0.1:4173).
- Keine externen CDNs oder Schriften (DSGVO). Schrift: Geist, selbst gehostet.
- Vor Designänderungen `KONZEPT.md` lesen; was dort steht, gilt, bis Julius es ändert.
- Design (Feinschliff, 12.10.2026, Wahl im Konfigurator, `design/konfigurator/entscheidung.md`), umgesetzt in
  `assets/style.css`, `assets/main.js`, `build.js`: Fließtext leicht (340), Leisten und Titel normal (480);
  Bildkontrast 70 % der Option; Scrollbar wird beim Überfahren breit in Akzentfarbe; Satz am Anfang kleiner.
- **Bildnummern** `fig. PROJEKT-JJ.NN` (z. B. SKI-26.03) stehen fest im Feld `fig` in `content/works/*.json`.
  Nie neu durchnummerieren. Neue Bilder ohne `fig` bekommen beim Build die nächste freie Nummer ihres Projekts.
- **Datum oben rechts** = Tag des letzten Commits (automatisch). Optional „Aktuell“-Zeile (`aktuell`, `aktuell_bis` in `site.json`).
- Shop: nur Stripe-Testmodus, keine Preise im Code. Live-Zuordnung zu SPINE nur über `fig` (Server-IDs sind zufällig).
  Code von SPINE und Konto nie ändern.

## Aufbau
- `content/` Texte und Bildlisten (JSON, vom CMS bearbeitet) · `images/` Quellbilder · `admin/` Sveltia CMS
- `assets/` `style.css`, `main.js`, `labor.js` (Laborelemente), `available.js` (Shop), `widerrufen.js`, Schriften
- `build.js` erzeugt `_site/` (Seiten + Bildgrößen 1200/2400 px) · `test/build.test.js`
- `design/` abgeschlossene Prototypen: Varianten A/B/C (`variants.js`), `feinschliff.js`, `konfigurator/`, `elemente/` (Testpult)
- `deploy/` `docker-compose.yml`, `Caddyfile`, Caddy-Schnipsel, Runbook Shop
- Shop-Pfade: `/available.html`, `/danke.html?o={orderId}`, `/abbruch.html`, `/widerrufen.html`
  (POST an `<SPINE>/api/public/shop/juliusniemeyer/withdrawal`, Link „Vertrag widerrufen“ im Footer).

## Betrieb
- Server Hetzner `root@46.224.113.239`: `/opt/website/` (`docker-compose.yml` + `Caddyfile` aus `deploy/`), Container
  `website` (caddy:2, read-only, 64 MB) liefert `/opt/website/site` im Docker-Netz `web`.
- Upload als Nutzer `website-deploy` (Schlüssel auf `rrsync /opt/website/site` beschränkt). GitHub: Variable `DEPLOY_HOST`,
  Secrets `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`; für den Shop zusätzlich `SHOP_LIVE`, `SPINE_URL` (noch leer).
  Shop-Rückweg: Variable leeren, Workflow neu starten.
- DNS bei IONOS: A `@`/`www` → 46.224.113.239, kein AAAA. Mail bleibt bei IONOS (MX mx00/mx01.ionos.de, DKIM, SPF) – nicht anfassen.
- Gemeinsamer Caddy (`/opt/caddy/Caddyfile`): Block `juliusniemeyer.de` + `www`-Weiterleitung aus `deploy/Caddyfile.live.snippet`.
  Nur anhängen, dann `caddy validate` + `caddy reload`. Sicherungen `Caddyfile.bak-20261012-163953`, `Caddyfile.bak-20261015-084327`.
  Zertifikat Let's Encrypt, verlängert Caddy selbst.
- Server-Regeln wie in `C:\dev\02_apps\mainframe\CLAUDE.md`: andere Apps nie anfassen.
- Keine Sicherung nötig, der Inhalt liegt im GitHub-Repo. Überwacht im Mainframe, Kachel „Website“.

## Stolperfallen
- Jeder Push auf main (auch nur Doku, auch jedes „Save“ im CMS) löst einen Deploy aus.
- Mit `SHOP_LIVE=1` bricht der Build ab, wenn SPINE nicht erreichbar ist, kein Werk mit fig kommt oder ein Rechtstext noch
  `entwurf`/„[OFFEN“ enthält – dann bleibt die alte Seite stehen.
- Port 8080 gehört einer anderen App; SPINE lokal :3001, Konto :3002.

## Weitere Dateien
- `KONZEPT.md` – Konzept der Seite: Erscheinung, fig.-Nummern, Laborelemente 1–5, Regeln.
- `SHOP.md` – Shop-Entscheidungen und Plan (Website + SPINE + Konto + Zentrale + Kontor + Mainframe).
- `deploy/RUNBOOK-SHOP-LIVE.md` – Ablauf für den Shop-Livegang (noch nicht ausgeführt).
- `README.md` – Inhalte bearbeiten, Projektstruktur, Server.
- Schnittstellen-Vertrag Verkauf: `C:\dev\02_apps\mainframe\docs\verkauf.md`.
- Zusammenspiel der Apps: C:\dev\ARCHITEKTUR.md
