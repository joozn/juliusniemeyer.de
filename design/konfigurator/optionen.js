// Entscheidungen für den Feinschliff-Konfigurator. Je Entscheidung ist die erste Option mit `orig` der heutige Stand.
// css: wird zusammen mit allen anderen gewählten Optionen in die Vorschau gesetzt (Reihenfolge = Reihenfolge hier).
// flags: Schalter für das Laufzeit-Skript (runtime.js), z. B. Galerie-Layout, Startbild, Uhr.
// fokus: wohin die Vorschau springt ('top', ein Selektor, oder 'lightbox').
window.KONFIG = [
	/* ================= Grundstimmung ================= */
	{
		id: 'grund', gruppe: 'Grundstimmung', titel: 'Hintergrund', fokus: 'top',
		frage: 'Welcher Grundton trägt die Seite?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Fast schwarz', desc: '#111 – wie heute', css: '' },
			{ id: 'schwarz', label: 'Tiefschwarz', desc: '#000 – härter, die Bilder leuchten stärker', css: ':root{--bg:#000;--bg-rgb:0,0,0}' },
			{ id: 'graphit', label: 'Graphit', desc: '#1d1d1c – weicher, etwas wärmer', css: ':root{--bg:#1d1d1c;--bg-rgb:29,29,28}' },
			{ id: 'nacht', label: 'Nachtblau', desc: '#0a0b1d – greift das UV-Licht der Installationen auf', css: ':root{--bg:#0a0b1d;--bg-rgb:10,11,29}' },
			{ id: 'papier', label: 'Papier hell', desc: '#f1efe9 – wie ein gedruckter Katalog', css: ':root{--bg:#f1efe9;--bg-rgb:241,239,233;--ink:20,20,20;color-scheme:light}' },
			{ id: 'weiss', label: 'Weiß', desc: '#fff – Galerie-Wand, sehr klar', css: ':root{--bg:#fff;--bg-rgb:255,255,255;--ink:0,0,0;color-scheme:light}' },
		],
	},
	{
		id: 'text', gruppe: 'Grundstimmung', titel: 'Textkontrast', fokus: 'top',
		frage: 'Wie kräftig steht der Text auf dem Grund?',
		optionen: [
			{ id: 'gedaempft', label: 'Gedämpft', desc: '65 % – leise, die Bilder führen', css: ':root{--text:rgba(var(--ink),.65);--text-dim:rgba(var(--ink),.5)}' },
			{ id: 'orig', orig: true, label: 'Mittel', desc: '85 % – wie heute', css: '' },
			{ id: 'voll', label: 'Voll', desc: '100 % – klar und direkt', css: ':root{--text:rgb(var(--ink));--text-dim:rgba(var(--ink),.8)}' },
		],
	},
	{
		id: 'akzent', gruppe: 'Grundstimmung', titel: 'Akzentfarbe', fokus: 'top',
		frage: 'Welche Farbe haben Links und Hervorhebungen?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Reinblau', desc: '#0000ff – wie heute, roh und digital', css: '' },
			{ id: 'leuchtblau', label: 'Leuchtblau', desc: '#4150ff – besser lesbar auf Dunkel', css: ':root{--link:#4150ff}' },
			{ id: 'uv', label: 'UV-Violett', desc: '#7b2dff – aus dem Licht der Installationen', css: ':root{--link:#7b2dff}' },
			{ id: 'orange', label: 'Signalorange', desc: '#ff4f00 – warmer Gegenpol zu den blauen Bildern', css: ':root{--link:#ff4f00}' },
			{ id: 'gruen', label: 'Säuregrün', desc: '#b4ff00 – laut, technisch', css: ':root{--link:#b4ff00}' },
			{ id: 'ohne', label: 'Keine Farbe', desc: 'Links in Textfarbe – ganz monochrom', css: ':root{--link:rgb(var(--ink))}' },
		],
	},
	{
		id: 'links', gruppe: 'Grundstimmung', titel: 'Linkstil', fokus: 'top',
		frage: 'Woran erkennt man einen Link?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Nur Farbe', desc: 'wie heute', css: '' },
			{ id: 'unterstrich', label: 'Unterstrichen', desc: 'feine Linie unter jedem Link', css: 'a:not(.home){text-decoration:underline 1px;text-underline-offset:.2em}' },
			{ id: 'hover', label: 'Linie beim Überfahren', desc: 'ruhig, zeigt sich erst bei der Maus', css: 'a:not(.home){text-decoration:underline 1px transparent;text-underline-offset:.2em;transition:text-decoration-color .15s}a:not(.home):hover{text-decoration-color:currentColor}' },
			{ id: 'block', label: 'Hinterlegt beim Überfahren', desc: 'Link wird zum Farbblock', css: 'a:not(.home):hover{background:var(--link);color:var(--bg)}' },
		],
	},
	{
		id: 'linien', gruppe: 'Grundstimmung', titel: 'Haarlinien', fokus: 'top',
		frage: 'Wie stark sind die Trennlinien?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Deutlich', desc: '40 % – wie heute', css: '' },
			{ id: 'fein', label: 'Fein', desc: '15 % – kaum sichtbar, eleganter', css: ':root{--line:rgba(var(--ink),.15)}' },
			{ id: 'akzent', label: 'In Akzentfarbe', desc: 'alle Linien farbig', css: ':root{--line:var(--link)}' },
			{ id: 'keine', label: 'Keine', desc: 'nur Abstände gliedern', css: ':root{--line:transparent}' },
		],
	},
	{
		id: 'textur', gruppe: 'Grundstimmung', titel: 'Oberfläche', fokus: '.gallery',
		frage: 'Liegt eine Textur über der Seite?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Glatt', desc: 'wie heute', css: '' },
			{ id: 'korn', label: 'Feines Korn', desc: 'analoges Filmkorn, kaum merklich', css: `body::after{content:"";position:fixed;inset:0;pointer-events:none;z-index:50;opacity:.09;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}` },
			{ id: 'scan', label: 'Scanlines', desc: 'feine Zeilen wie ein Röhrenmonitor', css: 'body::after{content:"";position:fixed;inset:0;pointer-events:none;z-index:50;background:repeating-linear-gradient(to bottom,rgba(0,0,0,.18) 0 1px,transparent 1px 3px)}' },
			{ id: 'vignette', label: 'Vignette', desc: 'Ränder dunkeln weich ab', css: 'body::after{content:"";position:fixed;inset:0;pointer-events:none;z-index:50;background:radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,.45))}' },
		],
	},
	{
		id: 'auswahl', gruppe: 'Grundstimmung', titel: 'Textauswahl', fokus: '.intro',
		frage: 'Wie sieht markierter Text aus? (Probier es in der Vorschau aus.)',
		optionen: [
			{ id: 'orig', orig: true, label: 'Standard', desc: 'Farbe des Browsers', css: '' },
			{ id: 'akzent', label: 'Akzentfarbe', desc: 'Markierung in der Hausfarbe', css: '::selection{background:var(--link);color:#fff}' },
			{ id: 'invert', label: 'Invertiert', desc: 'Text- und Grundfarbe tauschen', css: '::selection{background:rgb(var(--ink));color:var(--bg)}' },
		],
	},

	/* ================= Schrift ================= */
	{
		id: 'schrift', gruppe: 'Schrift', titel: 'Schriftfamilie', fokus: 'top',
		frage: 'Welche Schrift trägt die Seite?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Geist', desc: 'Grotesk für alles, Mono für Bildunterschriften – wie heute', css: '' },
			{ id: 'mono', label: 'Geist Mono überall', desc: 'technisch, wie ein Laborprotokoll', css: 'body{font-family:var(--mono);letter-spacing:-.02em}' },
			{ id: 'mix', label: 'Mono für Leisten und Titel', desc: 'Struktur in Mono, Lesetext in Grotesk', css: '.bar,.intro h1,.statement-title,.cv h1,.cv h2{font-family:var(--mono);letter-spacing:-.01em}' },
		],
	},
	{
		id: 'groesse', gruppe: 'Schrift', titel: 'Textgröße', fokus: '.intro',
		frage: 'Wie groß ist der Fließtext?',
		optionen: [
			{ id: 'klein', label: 'Klein', desc: 'zurückhaltend, mehr Raum für Bilder', css: 'body{font-size:.92rem}' },
			{ id: 'orig', orig: true, label: 'Mittel', desc: 'wie heute', css: '' },
			{ id: 'gross', label: 'Groß', desc: 'selbstbewusst, Text als Bild', css: 'body{font-size:1.35rem}.bar{font-size:1.1rem}' },
		],
	},
	{
		id: 'gewicht', gruppe: 'Schrift', titel: 'Schriftstärke', fokus: '.intro',
		frage: 'Wie kräftig ist die Schrift?',
		optionen: [
			{ id: 'leicht', label: 'Leicht', desc: 'Strichstärke 340 – fein, luftig', css: 'body{font-weight:340}' },
			{ id: 'orig', orig: true, label: 'Normal', desc: '480 – wie heute', css: '' },
			{ id: 'kraeftig', label: 'Kräftig', desc: '620 – plakativ', css: 'body{font-weight:620}' },
		],
	},
	{
		id: 'zeilen', gruppe: 'Schrift', titel: 'Zeilenabstand', fokus: '.intro',
		frage: 'Wie dicht stehen die Zeilen?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Eng', desc: '1,1 – kompakter Block, wie heute', css: '' },
			{ id: 'mittel', label: 'Mittel', desc: '1,3 – ruhiger zu lesen', css: 'body{line-height:1.3}.bar{line-height:1.1}' },
			{ id: 'weit', label: 'Weit', desc: '1,5 – luftig, buchartig', css: 'body{line-height:1.5}.bar{line-height:1.1}' },
		],
	},
	{
		id: 'laufweite', gruppe: 'Schrift', titel: 'Laufweite', fokus: '.intro',
		frage: 'Wie eng stehen die Buchstaben?',
		optionen: [
			{ id: 'eng', label: 'Eng', desc: 'dicht, grafisch', css: 'body{letter-spacing:-.035em}' },
			{ id: 'orig', orig: true, label: 'Leicht eng', desc: 'wie heute', css: '' },
			{ id: 'offen', label: 'Offen', desc: 'mehr Luft zwischen den Buchstaben', css: 'body{letter-spacing:.015em}' },
		],
	},
	{
		id: 'titel', gruppe: 'Schrift', titel: 'Werktitel', fokus: '.intro',
		frage: 'Wie stehen „Installation“, „Flat Works“, „Other“ da?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Wie Fließtext', desc: 'gleich groß, wie heute', css: '' },
			{ id: 'gross', label: 'Groß und fett', desc: 'klare Kapitel', css: '.intro h1{font-size:2.6rem;font-weight:650;line-height:1;letter-spacing:-.035em}' },
			{ id: 'riesig', label: 'Riesig über volle Breite', desc: 'Titel als Bild, Text darunter', css: '.intro{display:block}.intro h1{font-size:12vw;font-weight:620;line-height:.82;letter-spacing:-.055em;margin:0 0 1.2rem -.05em}.intro .span-4{max-width:44rem;margin-left:auto}' },
			{ id: 'nummer', label: 'Mono-Versalien mit Nummer', desc: '„01 / INSTALLATION“ – wie im Archiv', css: 'main{counter-reset:werk}.intro h1{counter-increment:werk;font-family:var(--mono);font-size:.8rem;font-weight:400;text-transform:uppercase;letter-spacing:.1em;color:var(--text-dim)}.intro h1::before{content:counter(werk,decimal-leading-zero) " / ";color:var(--link)}' },
		],
	},
	{
		id: 'intro', gruppe: 'Schrift', titel: 'Werktext', fokus: '.intro',
		frage: 'Wo und wie steht der Text zu jeder Werkgruppe?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Schmale Spalte rechts', desc: 'wie heute', css: '' },
			{ id: 'breit', label: 'Breite Spalte rechts', desc: 'halbe Seite, weniger Zeilen', css: '.intro h1{grid-column:span 6}.intro .span-4{grid-column:7/span 6}' },
			{ id: 'gross', label: 'Groß über die Breite', desc: 'Text wird zum Statement', css: '.intro .span-4{grid-column:1/-1;font-size:1.9rem;line-height:1.15;letter-spacing:-.025em;margin-top:1rem;max-width:none!important}' },
			{ id: 'blocksatz', label: 'Blocksatz mit Trennung', desc: 'rechte Spalte als gesetzter Block', css: '.intro .span-4{text-align:justify;hyphens:auto}' },
		],
	},
	{
		id: 'bu', gruppe: 'Schrift', titel: 'Bildunterschriften', fokus: 'figcaption',
		frage: 'Wie sehen die Texte unter den Bildern aus?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Mono mit Winkellinie', desc: 'wie heute', css: '' },
			{ id: 'frei', label: 'Mono ohne Linie', desc: 'ruhiger, nur Text', css: '.gallery figcaption{border:0;padding-left:0}' },
			{ id: 'sans', label: 'Klein in Grotesk', desc: 'wie Museumsschilder', css: '.gallery figcaption{font-family:var(--sans);font-size:.78rem;border:0;padding-left:0;letter-spacing:0}' },
			{ id: 'aus', label: 'Nur in der Großansicht', desc: 'Galerie nur aus Bildern', css: '.gallery figcaption{display:none}.gallery figure{margin-bottom:var(--g)}' },
		],
	},
	{
		id: 'fig', gruppe: 'Schrift', titel: 'Bildnummern', fokus: 'figcaption',
		frage: 'Bekommen die Bilder eine Nummer?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Keine', desc: 'wie heute', css: '' },
			{ id: 'fig', label: '„fig. 01“', desc: 'als erste Zeile jeder Bildunterschrift', css: 'main{counter-reset:fig}.gallery figure{counter-increment:fig}.gallery figcaption::before{content:"fig. " counter(fig,decimal-leading-zero);display:block;margin-bottom:.35em;color:var(--text);letter-spacing:.04em}' },
			{ id: 'aufbild', label: 'Nummer auf dem Bild', desc: 'klein in der Ecke, wie ein Kontaktabzug', css: 'main{counter-reset:fig}.gallery figure{counter-increment:fig;position:relative}.gallery figure::before{content:counter(fig,decimal-leading-zero);position:absolute;top:.4rem;left:.5rem;z-index:1;font:400 .75rem var(--mono);color:#fff;mix-blend-mode:difference}' },
		],
	},

	/* ================= Aufbau ================= */
	{
		id: 'kopf', gruppe: 'Aufbau', titel: 'Obere Leiste', fokus: '.gallery',
		frage: 'Wie verhält sich die Leiste oben beim Scrollen?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Fest, deckend', desc: 'wie heute', css: '' },
			{ id: 'glas', label: 'Fest, durchscheinend', desc: 'Bilder schimmern unscharf durch', css: '.bar{background:rgba(var(--bg-rgb),.55);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)}' },
			{ id: 'weg', label: 'Verschwindet beim Runterscrollen', desc: 'kommt zurück, sobald man hochscrollt', css: '.bar--top{transition:transform .3s ease}html.cfg-down .bar--top{transform:translateY(-100%)}' },
			{ id: 'mit', label: 'Scrollt mit', desc: 'nur ganz oben sichtbar', css: '.bar--top{position:absolute}' },
		],
	},
	{
		id: 'fuss', gruppe: 'Aufbau', titel: 'Untere Leiste', fokus: '.gallery',
		frage: 'Bleibt die Leiste unten immer stehen?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Immer sichtbar', desc: 'wie heute', css: '' },
			{ id: 'ende', label: 'Nur am Seitenende', desc: 'mehr Platz für Bilder', css: '.bar--bottom{position:static}main{padding-bottom:1rem}' },
			{ id: 'glas', label: 'Durchscheinend', desc: 'wie Glas über den Bildern', css: '.bar--bottom{background:rgba(var(--bg-rgb),.55);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)}' },
		],
	},
	{
		id: 'datum', gruppe: 'Aufbau', titel: 'Oben rechts', fokus: 'top',
		frage: 'Was steht rechts oben in der Leiste?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Datum', desc: '„24.08.26“ – wie heute', flags: { datum: 'datum' } },
			{ id: 'aktuell', label: '„Aktuell“-Zeile', desc: 'nächste Ausstellung (Beispieltext)', flags: { datum: 'aktuell' } },
			{ id: 'uhr', label: 'Uhrzeit München', desc: 'live, Sekunden laufen', flags: { datum: 'uhr' } },
			{ id: 'nichts', label: 'Nichts', desc: 'Leiste wird ruhiger', flags: { datum: 'nichts' } },
		],
	},
	{
		id: 'nav', gruppe: 'Aufbau', titel: 'Navigation', fokus: '.gallery',
		frage: 'Wie zeigt die Leiste, wo man gerade ist?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Gar nicht', desc: 'alle Links gleich, wie heute', css: '' },
			{ id: 'aktiv', label: 'Aktiver Abschnitt hell', desc: 'der sichtbare Teil wird zur Textfarbe', css: '.bar--top nav a.is-active{color:var(--text)}' },
			{ id: 'nummern', label: 'Nummeriert + aktiv', desc: '„01 Installation, 02 Flat Works …“', css: '.bar--top nav{counter-reset:n}.bar--top nav a{counter-increment:n}.bar--top nav a::before{content:counter(n,decimal-leading-zero) " ";font-family:var(--mono);font-size:.8em}.bar--top nav a.is-active{color:var(--text)}' },
		],
	},
	{
		id: 'fortschritt', gruppe: 'Aufbau', titel: 'Fortschritt', fokus: '.gallery',
		frage: 'Sieht man, wie weit man gescrollt hat?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Nein', desc: 'wie heute', css: '' },
			{ id: 'linie', label: 'Linie unter der Leiste', desc: 'wächst in Akzentfarbe mit', css: '.cfg-progress{display:block}' },
			{ id: 'prozent', label: 'Prozentzahl', desc: 'klein in Mono neben dem Datum', css: '.cfg-pct{display:inline}' },
		],
	},
	{
		id: 'start', gruppe: 'Aufbau', titel: 'Seitenanfang', fokus: 'top',
		frage: 'Womit beginnt die Seite?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Direkt mit dem ersten Werk', desc: 'wie heute', flags: { start: 'none' } },
			{ id: 'wortmarke', label: 'Riesige Wortmarke', desc: '„studioniemeyer“ über die volle Breite', flags: { start: 'wortmarke' } },
			{ id: 'bild', label: 'Bild bildschirmfüllend', desc: 'erstes Installationsfoto als Auftakt', flags: { start: 'bild' } },
			{ id: 'satz', label: 'Ein Satz', desc: '„all ordered systems tend toward disorder“ groß', flags: { start: 'satz' } },
		],
	},
	{
		id: 'rand', gruppe: 'Aufbau', titel: 'Seitenrand', fokus: '.gallery',
		frage: 'Wie viel Rand hat die Seite links und rechts?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Schmal', desc: 'wie heute', css: '' },
			{ id: 'randlos', label: 'Bilder randlos', desc: 'Bilder gehen bis an die Kante, Text behält Rand', css: 'main{padding-left:0;padding-right:0}main>*:not(.gallery):not(.cfg-hero){margin-left:var(--side);margin-right:var(--side)}' },
			{ id: 'breit', label: 'Breit', desc: '6 % Rand – wie ein Passepartout', css: ':root{--side:6vw}' },
		],
	},
	{
		id: 'trenner', gruppe: 'Aufbau', titel: 'Zwischen den Werkgruppen', fokus: '#flat-works-text',
		frage: 'Wie deutlich sind die Werkgruppen voneinander getrennt?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Großer Abstand', desc: 'wie heute', css: '' },
			{ id: 'kompakt', label: 'Kompakt', desc: 'Werke folgen dicht aufeinander', css: '.gallery{padding-bottom:3rem!important}' },
			{ id: 'weit', label: 'Sehr weit', desc: 'jede Gruppe wie ein eigener Raum', css: '.gallery{padding-bottom:22rem!important}' },
			{ id: 'balken', label: 'Dicke Akzentlinie', desc: 'Kapitelanfang deutlich markiert', css: '.intro{border-top:.4rem solid var(--link);padding-top:1rem}' },
		],
	},
	{
		id: 'statement', gruppe: 'Aufbau', titel: 'Artist Statement', fokus: '.statement',
		frage: 'Wie steht das Statement da?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Drei Spalten', desc: 'wie heute', css: '' },
			{ id: 'gross', label: 'Titel groß, Text zweispaltig', desc: 'das Statement als Kapitel', css: '.statement .cols.thirds{grid-template-columns:1fr 1fr;column-gap:2rem}.statement-title{grid-column:1/-1;font-size:3.2rem!important;font-weight:620!important;line-height:1!important;letter-spacing:-.04em;margin-bottom:2rem!important}' },
			{ id: 'schmal', label: 'Eine Spalte, zentriert', desc: 'wie eine Buchseite', css: '.statement .cols.thirds{display:block;max-width:36rem;margin:2rem auto}.statement-title{margin-bottom:1.5rem!important;font-weight:650!important}.statement p{line-height:1.4}' },
		],
	},
	{
		id: 'cv', gruppe: 'Aufbau', titel: 'Lebenslauf', fokus: '.cv',
		frage: 'Wie ist der Lebenslauf gesetzt?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Drei Spalten Grotesk', desc: 'wie heute', css: '' },
			{ id: 'mono', label: 'Archiv in Mono', desc: 'klein, dicht, wie eine Werkliste', css: '.cv{font-family:var(--mono);font-size:.8rem;line-height:1.45;letter-spacing:0}.cv h1{font-family:var(--sans);font-size:1.1rem;font-weight:650}' },
			{ id: 'zwei', label: 'Zwei breite Spalten', desc: 'mehr Platz pro Zeile', css: '.cv .cols.thirds{grid-template-columns:1fr 1fr;row-gap:3rem}' },
		],
	},
	{
		id: 'wortmarke', gruppe: 'Aufbau', titel: 'Wortmarke unten', fokus: '.wordmark',
		frage: 'Wie stark ist das große „studioniemeyer“ am Seitenende?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Kaum sichtbar', desc: '6 % – wie heute', css: '' },
			{ id: 'deutlich', label: 'Deutlich', desc: 'als Abschluss lesbar', css: '.wordmark{color:rgba(var(--ink),.85)}' },
			{ id: 'kontur', label: 'Nur Kontur', desc: 'Umriss, innen leer', css: '.wordmark{color:transparent;-webkit-text-stroke:1px rgba(var(--ink),.45)}' },
			{ id: 'akzent', label: 'In Akzentfarbe', desc: 'farbiger Schlusspunkt', css: '.wordmark{color:var(--link)}' },
			{ id: 'weg', label: 'Weglassen', desc: 'Seite endet mit dem CV', css: '.wordmark{display:none}' },
		],
	},

	/* ================= Bilder ================= */
	{
		id: 'galerie', gruppe: 'Bilder', titel: 'Galerie-Anordnung', fokus: '.gallery',
		frage: 'Wie sind die Bilder angeordnet?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Blocksatz-Reihen', desc: 'Originalformate, Reihen gleich hoch – wie heute', flags: { galerie: 'reihen' } },
			{ id: 'raster3', label: 'Raster, 3 quadratisch', desc: 'ruhig, alles gleich groß', css: '.gallery{display:grid!important;grid-template-columns:repeat(3,1fr);row-gap:var(--g)}.gallery figure{width:auto!important}.gallery img{aspect-ratio:1;object-fit:cover}', flags: { galerie: 'raster' } },
			{ id: 'raster4', label: 'Raster, 4 im Hochformat', desc: 'wie Kontaktbögen', css: '.gallery{display:grid!important;grid-template-columns:repeat(4,1fr);row-gap:var(--g)}.gallery figure{width:auto!important}.gallery img{aspect-ratio:4/5;object-fit:cover}', flags: { galerie: 'raster' } },
			{ id: 'zwei', label: 'Zwei große Spalten', desc: 'Originalformate, versetzt', css: '.gallery{display:block!important;columns:2;column-gap:var(--g)}.gallery figure{width:auto!important;break-inside:avoid;margin-bottom:var(--g)}', flags: { galerie: 'raster' } },
			{ id: 'einzeln', label: 'Ein Bild pro Zeile', desc: 'langsam, jedes Bild für sich', css: '.gallery{display:block!important}.gallery figure{width:min(100%,62rem)!important;margin:0 auto 2rem}', flags: { galerie: 'raster' } },
		],
	},
	{
		id: 'reihe', gruppe: 'Bilder', titel: 'Reihenhöhe', fokus: '.gallery',
		frage: 'Wie hoch sind die Bildreihen? (wirkt bei Blocksatz-Reihen)',
		optionen: [
			{ id: 'niedrig', label: 'Niedrig', desc: 'mehr Bilder pro Reihe, Übersicht', flags: { reihe: 0.2 } },
			{ id: 'orig', orig: true, label: 'Mittel', desc: 'wie heute', flags: { reihe: 0.3 } },
			{ id: 'hoch', label: 'Hoch', desc: 'große Bilder, oft nur zwei pro Reihe', flags: { reihe: 0.48 } },
		],
	},
	{
		id: 'abstand', gruppe: 'Bilder', titel: 'Bildabstand', fokus: '.gallery',
		frage: 'Wie viel Luft ist zwischen den Bildern?',
		optionen: [
			{ id: 'null', label: 'Nahtlos', desc: 'Bilder stoßen aneinander, wie ein Mosaik', css: ':root{--g:0px}' },
			{ id: 'orig', orig: true, label: 'Schmal', desc: 'wie heute', css: '' },
			{ id: 'luftig', label: 'Luftig', desc: 'jedes Bild steht für sich', css: ':root{--g:1.6rem}' },
			{ id: 'weit', label: 'Weit', desc: 'wie Hängung in der Galerie', css: ':root{--g:3.5rem}' },
		],
	},
	{
		id: 'bildfarbe', gruppe: 'Bilder', titel: 'Bildbehandlung', fokus: '.gallery',
		frage: 'Werden die Bilder in der Übersicht verändert?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Originalfarben', desc: 'wie heute', css: '' },
			{ id: 'sw', label: 'Schwarzweiß, Farbe beim Überfahren', desc: 'ruhige Übersicht, Farbe als Belohnung', css: '.gallery img{filter:grayscale(1);transition:filter .4s}.gallery figure:hover img{filter:none}' },
			{ id: 'matt', label: 'Leicht entsättigt', desc: 'einheitlicher, gedämpfter Look', css: '.gallery img{filter:saturate(.6) brightness(.95)}' },
			{ id: 'kontrast', label: 'Mehr Kontrast', desc: 'satter, tiefere Schwärzen', css: '.gallery img{filter:contrast(1.15) saturate(1.15)}' },
		],
	},
	{
		id: 'kante', gruppe: 'Bilder', titel: 'Bildkante', fokus: '.gallery',
		frage: 'Wie sind die Bilder gefasst?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Kantig, ohne Rahmen', desc: 'wie heute', css: '' },
			{ id: 'linie', label: 'Haarlinienrahmen', desc: 'feine Kontur um jedes Bild', css: '.gallery img{outline:1px solid rgba(var(--ink),.35);outline-offset:-1px}' },
			{ id: 'rund', label: 'Leicht gerundet', desc: 'weicher, freundlicher', css: '.gallery img{border-radius:.45rem}' },
			{ id: 'passepartout', label: 'Passepartout', desc: 'heller Rand wie gerahmte Prints', css: '.gallery img{padding:.6rem;background:rgba(var(--ink),.07)!important}' },
		],
	},
	{
		id: 'hover', gruppe: 'Bilder', titel: 'Überfahren mit der Maus', fokus: '.gallery',
		frage: 'Was passiert, wenn die Maus über ein Bild fährt?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Nichts', desc: 'wie heute', css: '' },
			{ id: 'dimmen', label: 'Andere dunkeln ab', desc: 'das berührte Bild bleibt hell', css: '.gallery figure{transition:opacity .25s}.gallery:hover figure{opacity:.4}.gallery:hover figure:hover{opacity:1}' },
			{ id: 'zurueck', label: 'Bild weicht leicht zurück', desc: 'kleine, ruhige Bewegung', css: '.gallery img{transition:transform .35s ease}.gallery figure:hover img{transform:scale(.97)}' },
			{ id: 'rahmen', label: 'Rahmen in Akzentfarbe', desc: 'klares Signal: anklickbar', css: '.gallery figure:hover img{outline:2px solid var(--link);outline-offset:-2px}' },
		],
	},
	{
		id: 'einblenden', gruppe: 'Bilder', titel: 'Erscheinen beim Scrollen', fokus: '.gallery',
		frage: 'Wie erscheinen die Bilder beim Scrollen? (Vorschau spielt es neu ab)',
		optionen: [
			{ id: 'orig', orig: true, label: 'Sofort da', desc: 'wie heute', css: '' },
			{ id: 'blende', label: 'Weich einblenden', desc: 'nacheinander, ohne Bewegung', css: '.gallery figure{transition:opacity .8s ease}html.cfg-ready .gallery figure:not(.cfg-in){opacity:0}' },
			{ id: 'gleiten', label: 'Hochgleiten', desc: 'kommen von unten herein', css: '.gallery figure{transition:opacity .8s ease,transform .8s cubic-bezier(.2,.7,.2,1)}html.cfg-ready .gallery figure:not(.cfg-in){opacity:0;transform:translateY(3rem)}' },
			{ id: 'schaerfe', label: 'Aus der Unschärfe', desc: 'werden scharf, wie beim Fokussieren', css: '.gallery figure{transition:opacity .9s ease,filter .9s ease}html.cfg-ready .gallery figure:not(.cfg-in){opacity:.2;filter:blur(14px)}' },
		],
	},

	/* ================= Großansicht ================= */
	{
		id: 'lbgrund', gruppe: 'Großansicht', titel: 'Hintergrund der Großansicht', fokus: 'lightbox',
		frage: 'Worauf steht ein Bild, wenn man es anklickt?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Seitenfarbe', desc: 'wie heute', css: '' },
			{ id: 'schwarz', label: 'Schwarz', desc: 'Kino', css: '.lightbox{background:#000}' },
			{ id: 'weiss', label: 'Weiß', desc: 'Galeriewand', css: '.lightbox{background:#fff;color:#111}.lightbox .lb-meta{color:#555}.lightbox .lb-count{color:#111}' },
			{ id: 'glas', label: 'Durchscheinend', desc: 'Seite verschwimmt dahinter', css: '.lightbox{background:rgba(var(--bg-rgb),.7);-webkit-backdrop-filter:blur(22px);backdrop-filter:blur(22px)}' },
		],
	},
	{
		id: 'lbgroesse', gruppe: 'Großansicht', titel: 'Bildgröße in der Großansicht', fokus: 'lightbox',
		frage: 'Wie viel Raum bekommt das Bild?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Mit viel Rand', desc: 'wie heute', css: '' },
			{ id: 'gross', label: 'Groß', desc: 'nur schmaler Rand', css: '.lightbox{padding:3rem 5rem}' },
			{ id: 'voll', label: 'Bildschirmfüllend', desc: 'Bedienung liegt über dem Bild', css: '.lightbox{padding:0}' },
		],
	},
	{
		id: 'lbsteuer', gruppe: 'Großansicht', titel: 'Bedienung der Großansicht', fokus: 'lightbox',
		frage: 'Wie sehen Schließen, Zurück und Weiter aus?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Graue Kreise', desc: 'wie heute', css: '' },
			{ id: 'linien', label: 'Nur Linien', desc: 'Pfeile ohne Kreis, feiner', css: '.lb-btn{background:none;color:var(--text);width:44px;height:44px}.lb-btn svg{width:24px;height:24px;stroke-width:1}' },
			{ id: 'text', label: 'Wörter in Mono', desc: '„← zurück   weiter →   schließen“', css: '.lb-btn{background:none;width:auto;height:auto;border-radius:0;color:inherit;font:400 .85rem var(--mono);opacity:.85}.lb-btn svg{display:none}.lb-close::after{content:"schließen ×"}.lb-prev::after{content:"← zurück"}.lb-next::after{content:"weiter →"}' },
		],
	},
	{
		id: 'lbinfo', gruppe: 'Großansicht', titel: 'Info in der Großansicht', fokus: 'lightbox',
		frage: 'Steht in der Großansicht etwas zum Bild?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Nichts', desc: 'nur das Bild, wie heute', css: '' },
			{ id: 'zaehler', label: 'Zähler', desc: '„3 / 12“ unten links', css: '.lb-meta{display:flex}.lb-caption{display:none}' },
			{ id: 'voll', label: 'Zähler und Bildunterschrift', desc: 'Titel, Jahr, Ort unten', css: '.lb-meta{display:flex}' },
		],
	},

	/* ================= Details ================= */
	{
		id: 'cursor', gruppe: 'Details', titel: 'Mauszeiger', fokus: '.gallery',
		frage: 'Wie sieht der Mauszeiger aus? (in der Vorschau bewegen)',
		optionen: [
			{ id: 'orig', orig: true, label: 'Standard', desc: 'wie heute', css: '' },
			{ id: 'kreuz', label: 'Fadenkreuz', desc: 'präzise, wie ein Messinstrument', css: 'body,body *{cursor:crosshair!important}' },
			{ id: 'punkt', label: 'Punkt in Akzentfarbe', desc: 'kleiner farbiger Punkt', css: 'body,body *{cursor:none!important}.cfg-cursor{display:block;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:var(--link)}' },
			{ id: 'kreis', label: 'Kreis, invertierend', desc: 'kehrt die Farben darunter um', css: 'body,body *{cursor:none!important}.cfg-cursor{display:block;width:38px;height:38px;margin:-19px 0 0 -19px;border-radius:50%;background:#fff;mix-blend-mode:difference}' },
		],
	},
	{
		id: 'scrollbar', gruppe: 'Details', titel: 'Scrollbar', fokus: '.gallery',
		frage: 'Wie sieht der Scrollbalken rechts aus?',
		optionen: [
			{ id: 'orig', orig: true, label: 'Haarlinie', desc: 'schmal, blau beim Anfassen – seit gestern', css: '' },
			{ id: 'weg', label: 'Unsichtbar', desc: 'Seite ohne Balken', css: 'html{scrollbar-width:none}::-webkit-scrollbar{width:0;height:0}' },
			{ id: 'akzent', label: 'Breit in Akzentfarbe', desc: 'als bewusstes Gestaltungselement', css: '::-webkit-scrollbar{width:12px}::-webkit-scrollbar-thumb{background:var(--link);border:0}' },
		],
	},
	{
		id: 'favicon', gruppe: 'Details', titel: 'Zeichen im Browser-Tab', fokus: 'top',
		frage: 'Welches Zeichen steht im Tab neben dem Seitentitel? (siehe den Tab dieses Fensters)',
		optionen: [
			{ id: 'orig', orig: true, label: 'Wie heute', desc: 'bisheriges favicon.ico', flags: { favicon: 'orig' } },
			{ id: 'punkt', label: 'Punkt in Akzentfarbe', desc: 'ein Kreis, sonst nichts', flags: { favicon: 'punkt' } },
			{ id: 'sn', label: '„sn“ in Mono', desc: 'Kürzel von studioniemeyer', flags: { favicon: 'sn' } },
		],
	},
];
