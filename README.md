# juliusniemeyer.de

Website of Julius Niemeyer. Static site, content editable via Sveltia CMS, hosted for free on GitHub Pages.

## Editing content (no code)

Open **https://juliusniemeyer.de/admin** → sign in with GitHub → edit → **Save**.
GitHub rebuilds and publishes the site automatically; changes are live after ~1–2 minutes
(progress: the *Actions* tab of the GitHub repository).

- **Werke** — Installation / Flat Works / Other: intro text, images, captions, order (drag & drop)
- **Texte** — Artist Statement, CV
- **Einstellungen** — header date, footer texts, email, Google description, Impressum, Datenschutz

Uploaded photos are converted to WebP (max. 2400 px) automatically.

## Project structure

```
content/            all texts and image lists (JSON, edited by the CMS)
images/             source images (uploaded via the CMS)
assets/             style.css, main.js, fonts (Geist, SIL Open Font License)
admin/              Sveltia CMS (index.html + config.yml)
build.js            generates _site/ (HTML pages + 1200/2400 px image versions)
.github/workflows/  build & deploy to GitHub Pages on every push
```

## Local preview

```
npm install
npm start          # builds and serves on http://127.0.0.1:4173
```
