# Runbook: Shop auf juliusniemeyer.de live schalten

Stand 13.10.2026, Sitzung „website“. Nur ein Dokument: Nichts davon ist ausgeführt.
Läuft im gemeinsamen Deploy-Termin **nach SPINE**. Jeder Schritt mit Julius' OK.

Ein Push auf `main` baut die Seite in GitHub Actions und lädt sie per rsync nach `/opt/website/site`.
Am Server (Caddy, Container) ändert sich für den Shop nichts.

## 0. Vorbedingungen

| # | Was | Wer | Prüfen |
|---|---|---|---|
| a | SPINE läuft unter `https://oeuvre.studioniemeyer.de` mit Shop-API | spine | `curl -s https://oeuvre.studioniemeyer.de/api/public/shop/juliusniemeyer \| head -c 300` gibt JSON mit `werke` |
| b | Kanal `juliusniemeyer` in SPINE: domain `https://juliusniemeyer.de` (CORS und Danke-/Abbruch-URL), cancelPath `/abbruch.html` | spine | `curl -sI -H "Origin: https://juliusniemeyer.de" …/api/public/shop/juliusniemeyer/status` → `access-control-allow-origin: https://juliusniemeyer.de` |
| c | Werke im Server-SPINE für den Kanal freigegeben. Die **SPINE-Werk-IDs auf dem Server** passen zu `content/available.json` (`id` → `fig`). Sonst lässt der Build das Werk weg („has no fig. number“). | Julius + website | Build-Log: `shop: N works from SPINE`, keine Warnung |
| d | Konto live im **Stripe-Testmodus**, PayPal im Checkout aktiv (Plattform-Konto, Kanal juliusniemeyer) | konto | Testkauf zeigt PayPal |
| e | Zentrale und Mainframe nehmen `order.paid`, `inquiry.created` und `withdrawal.received` an | crm, mainframe | Nach dem Testkauf Push im Mainframe und Mail |
| f | Vorarbeiten im Code (Abschnitt 1) sind committet | website | `git log` |

## 1. Vorarbeiten im Code (lokal, vor dem Termin; noch nicht gebaut)

1. **Live-Schalter statt SHOP_PREVIEW.** Heute steuert `SHOP_PREVIEW=1` drei Dinge: die Shop-Seite,
   die Entwürfe der Rechtstexte und den Rückfall auf Beispieldaten, wenn SPINE nicht erreichbar ist. Das darf live nicht sein.
   Vorschlag: neue Variable `SHOP_LIVE=1`.
   - `available.html` kommt aus SPINE. Ist SPINE nicht erreichbar oder liefert 0 Werke, **bricht der Build ab**.
     Dann bleibt die alte Seite auf dem Server stehen (rsync läuft nicht). Keine Beispieldaten live.
   - `SHOP_PREVIEW` bleibt nur für die lokale Arbeit.
2. **Workflow** `.github/workflows/*.yml`, Schritt `npm run build`:
   ```yaml
   env:
     SHOP_LIVE: ${{ vars.SHOP_LIVE }}
     SPINE_URL: ${{ vars.SPINE_URL }}
   ```
   Damit lässt sich der Shop ohne Code-Commit über Repository-Variablen ein- und ausschalten (siehe Rückweg).
3. **Rechtstexte:** AGB, Widerruf und Versand haben `entwurf: true` und werden ohne Vorschau nicht gebaut.
   Für den Livegang muss das Flag weg, und zwar erst nach der Prüfung über eRecht24 (offener Punkt 1).
   Ohne Widerrufsbelehrung und AGB darf der Shop nicht live gehen. Der Build soll mit `SHOP_LIVE=1` abbrechen,
   solange einer dieser Texte noch Entwurf ist.
4. **Widerrufsbutton (§ 356a BGB)** wie bei oscar: Seite `widerrufen.html` mit Formular
   (Name, E-Mail, Bestellnummer, Notiz, Honigtopf `website`, Zeitfalle `t`) → `POST <api>/withdrawal`.
   Ohne SPINE wird eine vorbereitete Mail angeboten. Link im Footer und in der Widerrufsbelehrung. Der SPINE-Endpunkt ist da
   (f6c1c00, Ereignis `withdrawal.received`).
5. **Neue Werke in SPINE** erscheinen erst nach einem neuen Build (die Liste ist statisch, nur der Status ist live).
   Vorerst: in GitHub unter Actions → „Build & deploy website“ → *Run workflow*. Später ein `repository_dispatch` aus SPINE.

## 2. Ablauf im Termin

1. Vorbedingungen a–e abhaken.
2. Lokal mit den echten Daten bauen, aber nicht hochladen:
   ```bash
   SHOP_LIVE=1 SPINE_URL=https://oeuvre.studioniemeyer.de npm run build
   ```
   Erwartet: `shop: N works from SPINE`, keine Warnungen. In `_site/` gibt es `available.html`, `agb.html`,
   `widerruf.html`, `versand.html`, `widerrufen.html`, `danke.html` und `abbruch.html`.
3. In GitHub → Settings → Secrets and variables → Actions → **Variables**:
   `SPINE_URL = https://oeuvre.studioniemeyer.de` (den Wert nennt spine), `SHOP_LIVE = 1`.
4. Push der lokalen Commits auf `main` (bis `c9fdd94` plus Vorarbeiten). **Nur gezielt committen:** `favicon.ico`
   und `og-image.jpg` fehlen im Arbeitsverzeichnis (ungeklärt), ihre Löschung darf nicht mit hinein.
   Vorher `git status` prüfen.
5. GitHub Actions beobachten: Build grün, Log `shop: N works from SPINE`, Upload grün.

## 3. Prüfungen nach dem Deploy (Stripe-Testmodus)

- [ ] https://juliusniemeyer.de/available.html zeigt die Werke aus SPINE mit fig.-Nummern und Bildern, keine Beispieldaten.
- [ ] Browser-Konsole: keine CORS-Fehler, `…/status` lädt (verkaufte und reservierte Nummern grau).
- [ ] Deep-Link `available.html#<fig>` springt zum Werk.
- [ ] **Kauf Edition** mit Lieferart → Stripe Checkout (Test) → **PayPal** (Sandbox) → `danke.html`.
      Danach ist die Nummer im Status verkauft, Push im Mainframe, Bestätigungsmail über die Zentrale.
- [ ] **Kauf Unikat** (Lieferart eu, muenchen, abholung) mit Testkarte 4242 → Danke-Seite. Telefon ist Pflicht (entschieden).
- [ ] **Abbruch** im Checkout → `abbruch.html`, die Nummer ist nach Ablauf der Reservierung wieder frei.
- [ ] **Anfrage** zu einem Unikat → `inquiry.created` → Mail und Push.
- [ ] **Widerruf** über `widerrufen.html` mit der Bestellnummer des Testkaufs → `withdrawal.received`, Eingangsbestätigung per Mail.
- [ ] AGB, Widerruf und Versand sind erreichbar, verlinkt und ohne „Entwurf“-Hinweis. Impressum und Datenschutz (Stripe, PayPal) sind aktuell.
- [ ] Testkäufe danach in SPINE stornieren bzw. als Test markieren, damit die Nummern wieder frei sind.

## 4. Rückweg

- **Schnell, ohne Code:** Repository-Variable `SHOP_LIVE` löschen oder auf leer setzen → Actions → *Run workflow*.
  Die Seite zeigt wieder „Coming soon“, und die Rechtstexte, die noch Entwurf sind, entfallen. Dauer etwa 2 Minuten.
- **Code:** `git revert <commit>` und Push. Der Workflow baut den alten Stand und rsync `--delete` entfernt die neuen Seiten.
- Am Server ist nichts zu tun. Die Daten liegen in SPINE und Konto und bleiben erhalten.

## 5. Offene Punkte für Julius

1. **Rechtstexte** AGB, Widerruf und Versand sind Entwürfe. Sie werden über eRecht24 geprüft, und erst danach entfällt `entwurf`.
   Die Datenschutzerklärung braucht Stripe und PayPal.
2. **Widerrufsbutton (§ 356a)** ist noch nicht eingebaut (Vorarbeit 4). Er ist Pflicht für den Livegang.
3. **Deep-Link** `available.html#<fig>` statt eigener Werkseiten. Reicht das?
4. **Testmodus öffentlich?** Steht der Shop live mit Stripe-Testmodus, sehen echte Besucher:innen ihn. Ein echter Kauf
   scheitert dann, oder es entstehen Scheinbestellungen mit Testkarten. Vorschlag: Den Test im Termin mit
   `SHOP_LIVE=1` machen und danach sofort wieder auf „Coming soon“ (Rückweg, schnell), bis Stripe live ist.
   Alternative: Shop bleibt sichtbar mit einem Hinweis „Testbetrieb“.
