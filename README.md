# juliusniemeyer.de

Website von Julius Niemeyer. Statische Seite, Inhalte über Sveltia CMS bearbeitbar, gehostet auf dem eigenen
Hetzner-Server (Auslieferung per GitHub Actions). Hinweise für die Arbeit am Projekt: `CLAUDE.md`.

## Inhalte bearbeiten (ohne Code)

**https://juliusniemeyer.de/admin** öffnen → mit GitHub anmelden → bearbeiten → **Save**.
GitHub baut und veröffentlicht die Seite automatisch; Änderungen sind nach ~1–2 Minuten live
(Fortschritt: Reiter *Actions* im GitHub-Repo). Hinweis: Der CMS-Login ist noch nicht eingerichtet.

- **Werke** — Installation / Flat Works / Other: Einleitung, Bilder, Bildunterschriften, Reihenfolge (Ziehen)
- **Texte** — Artist Statement, CV
- **Einstellungen** — „Aktuell“-Zeile (optional, mit Enddatum), Fußtexte, E-Mail, Google-Beschreibung, Impressum, Datenschutz

Hochgeladene Fotos werden automatisch in WebP (max. 2400 px) umgewandelt.

## Projektstruktur

```
content/            alle Texte und Bildlisten (JSON, vom CMS bearbeitet)
images/             Quellbilder (über das CMS hochgeladen)
assets/             style.css, main.js, labor.js, Shop-Skripte, Schriften (Geist, SIL Open Font License)
admin/              Sveltia CMS (index.html + config.yml)
build.js            erzeugt _site/ (HTML-Seiten + Bildgrößen 1200/2400 px)
test/               Build-Tests (npm test)
deploy/             Docker/Caddy für den Server, Runbook Shop-Livegang
.github/workflows/  baut bei jedem Push auf main und lädt per rsync auf den Server
```

## Lokale Vorschau

```
npm install
npm start          # baut und startet http://127.0.0.1:4173
```

## Server (Hetzner, `root@46.224.113.239`)

- `/opt/website/` — `docker-compose.yml` + `Caddyfile` aus `deploy/`; Container `website` (caddy:2,
  read-only, 64 MB) liefert `/opt/website/site` im gemeinsamen Docker-Netz `web` aus.
- `/opt/website/site` wird von GitHub Actions per rsync als Nutzer `website-deploy` befüllt
  (Schlüssel auf `rrsync /opt/website/site` beschränkt, keine Shell). GitHub-Einstellungen: Variable `DEPLOY_HOST`,
  Secrets `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`.
- Gemeinsamer Caddy (`/opt/caddy/Caddyfile`): nur anhängen, dann `caddy validate` + `caddy reload`.
  Live-Block aus `deploy/Caddyfile.live.snippet` (juliusniemeyer.de + www-Weiterleitung), seit 12.10.2026.
  Der frühere Testbetrieb (`deploy/Caddyfile.snippet`, website.studioniemeyer.de) ist seit 15.10.2026 entfernt.
- Überwacht im Mainframe (studio.studioniemeyer.de), Kachel „Website“. Keine Sicherung nötig — der
  Inhalt liegt in diesem GitHub-Repo.
