// Builds the static site into _site/ from content/*.json and images/.
// Run: npm run build   (GitHub Actions runs the same on every push)
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sharp = require('sharp');
const { marked } = require('marked');

const OUT = '_site';
const read = (f) => JSON.parse(fs.readFileSync(path.join('content', f), 'utf8'));
const md = (s = '') => marked.parse(s, { breaks: true });
const mdInline = (s = '') => marked.parseInline(s);
const esc = (s = '') => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
// German variant of a content field: <key>_de, falls back to the English text while it is empty
const tr = (o, k, lang) => (lang === 'de' && o[k + '_de']) || o[k];
const ORIGIN = 'https://juliusniemeyer.de';
const plain = (s = '') => s.replace(/[*_`#>[\]]/g, '').replace(/\(([^)]*)\)$/, '').trim();

const site = read('site.json');
const works = [
	{ file: 'works/installation.json', anchor: 'installation-text-1' },
	{ file: 'works/flat-works.json', anchor: 'flat-works-text' },
	{ file: 'works/other.json', anchor: 'other-text', extraClass: ' gallery--other' },
].map((w) => ({ ...w, ...read(w.file) }));
const statement = read('statement.json');
const cv = read('cv.json');
// works on offer (shop). Comes from SPINE when SPINE_URL is set (contract: C:\dev\02_apps\mainframe\docs\verkauf.md),
// otherwise example data. SPINE sends the fig. number per work; content/available.json maps local example ids to fig. numbers
// (images stay on the website).
const KANAL = 'juliusniemeyer';
const SPINE_URL = (process.env.SPINE_URL || '').replace(/\/$/, '');
let available = read('available.json');
// agb, widerruf, versand are drafts (entwurf: true) and only built with SHOP_PREVIEW until they are checked.
const legal = ['impressum', 'datenschutz', 'agb', 'widerruf', 'versand'].map((n) => ({ name: n, ...read(`legal/${n}.json`) }));

// Shop switches (see deploy/RUNBOOK-SHOP-LIVE.md):
// - SHOP_PREVIEW=1 (local only): shop with SPINE data or example data, legal drafts included.
// - SHOP_LIVE=1 (GitHub variable): shop only with data from SPINE and only with checked legal texts – otherwise the build
//   fails and the page on the server stays as it is (rsync does not run).
// - neither: "Available" says "coming soon".
const SHOP_PREVIEW = process.env.SHOP_PREVIEW === '1';
const SHOP_LIVE = process.env.SHOP_LIVE === '1';
const SHOP = SHOP_PREVIEW || SHOP_LIVE;
const fail = (msg) => {
	console.error(`build stopped: ${msg}`);
	process.exit(1);
};

// Date top right = state of the document: day of the last commit (falls back to today).
const stand = (() => {
	let d;
	try {
		d = new Date(execSync('git log -1 --format=%cI', { encoding: 'utf8' }).trim());
	} catch {}
	if (!d || isNaN(d)) d = new Date();
	return d.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', year: '2-digit' });
})();

// Optional announcement next to the name; hidden by main.js after "aktuell_bis".
const aktuell = (site.aktuell || '').trim()
	? `<span class="aktuell"${site.aktuell_bis ? ` data-bis="${esc(site.aktuell_bis)}"` : ''}>Aktuell: ${mdInline(site.aktuell.trim())}</span>`
	: '';

/* ---------- figure numbers ----------
   Each image has a fixed "fig" code: PROJECT-YY.NN, e.g. SKI-26.03 = skia, 2026, image 3 of that project.
   Stored in content/works/*.json so it never changes when works are added or reordered. Images without one
   (new uploads) get the next free number of their project, or a new code from the title's initials. */

const workTitle = (caption = '') => (caption.match(/[“"]([^”"]+)[”"]/) || [])[1]?.toLowerCase().trim();
function assignFigs() {
	const all = works.flatMap((w) => w.images || []);
	const prefixOf = {}; // title -> PROJECT-YY
	const max = {}; // PROJECT-YY -> highest number
	all.forEach((it) => {
		const m = (it.fig || '').match(/^(.+)\.(\d+)$/);
		if (!m) return;
		const t = workTitle(it.caption);
		if (t && !prefixOf[t]) prefixOf[t] = m[1];
		max[m[1]] = Math.max(max[m[1]] || 0, +m[2]);
	});
	let prev = 'X-00';
	all.forEach((it) => {
		const t = workTitle(it.caption);
		if (!it.fig) {
			let prefix = t ? prefixOf[t] : prev;
			if (!prefix) {
				const letters = t.normalize('NFD').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
				const code = (letters.length >= 3 ? letters.map((l) => l[0]).join('') : letters.join('')).slice(0, 3).toUpperCase();
				const year = ((it.caption || '').match(/\((\d{4})\)/) || [, String(new Date().getFullYear())])[1].slice(2);
				prefix = prefixOf[t] = `${code}-${year}`;
			}
			max[prefix] = (max[prefix] || 0) + 1;
			it.fig = `${prefix}.${String(max[prefix]).padStart(2, '0')}`;
			console.log(`  fig ${it.fig} (neu, noch nicht gespeichert): ${it.image}`);
		}
		prev = it.fig.replace(/\.\d+$/, '');
	});
}

const [mailUser, mailDomain] = site.email.split('@');
const emailLink = (label) =>
	`<a href="#" data-u="${esc(mailUser)}" data-d="${esc(mailDomain)}">${label}</a><noscript>${esc(mailUser)} (at) ${esc(mailDomain)}${label.endsWith(',') ? ',' : ''}</noscript>`;

/* ---------- images ---------- */

async function processImages() {
	const outDir = path.join(OUT, 'images');
	fs.mkdirSync(outDir, { recursive: true });
	const used = works.flatMap((w) => w.images || []);
	const done = new Map();
	const queue = [...new Set(used.map((i) => i.image))];

	const worker = async () => {
		while (queue.length) {
			const src = queue.shift();
			const file = path.join('.', src); // "/images/x.webp" -> "images/x.webp"
			if (!fs.existsSync(file)) {
				console.warn('  ! missing image', src);
				continue;
			}
			const base = path.parse(file).name;
			const big = path.join(outDir, `${base}-2400.webp`);
			const small = path.join(outDir, `${base}-1200.webp`);
			const fresh = (f) => fs.existsSync(f) && fs.statSync(f).mtimeMs >= fs.statSync(file).mtimeMs;
			if (!fresh(big) || !fresh(small)) {
				const img = sharp(file).rotate();
				await img.clone().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(big);
				await img.clone().resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toFile(small);
			}
			const { width, height } = await sharp(big).metadata();
			done.set(src, { big: `images/${base}-2400.webp`, small: `images/${base}-1200.webp`, width, height, light: await cornerIsLight(small) });
		}
	};
	await Promise.all(Array.from({ length: 6 }, worker));
	return done;
}

// Is the area under the fig. number (top-left, about 0.3 × 0.08 of the row height) bright?
// Then the number is set in black instead of white – whichever has more contrast.
async function cornerIsLight(file) {
	const { width, height } = await sharp(file).metadata();
	const { channels } = await sharp(file)
		.extract({ left: 0, top: 0, width: Math.min(width, Math.round(height * 0.3)), height: Math.max(1, Math.round(height * 0.08)) })
		.stats();
	const lin = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
	const [r, g, b] = channels.map((c) => lin(c.mean));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179;
}

/* ---------- shared page parts ---------- */

const head = ({ title, description, lang = 'en', robots = 'index, follow', extra = '', root = '' }) => `<!DOCTYPE html>
<html lang="${lang}">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>${esc(title)}</title>
	<meta name="description" content="${esc(description)}">
	<meta name="robots" content="${robots}">
	<meta name="theme-color" content="#0a0b1d">
	<link rel="icon" href="${root}favicon.ico" sizes="any">
	<link rel="icon" href="${root}favicon.svg" type="image/svg+xml">
	<link rel="preload" href="${root}assets/fonts/Geist.woff2" as="font" type="font/woff2" crossorigin>
	<link rel="stylesheet" href="${root}assets/style.css">
${extra}</head>
<body>
`;

const worksNav = (lang) =>
	`${lang === 'de' ? 'Werke' : 'Works'}: ${works.map((w) => `<a href="./#${w.anchor}">${esc(tr(w, 'title', lang))},</a>`).join(' ')} <a href="./#cv">${lang === 'de' ? 'Lebenslauf' : 'CV'}</a>`;

// "Available" sits apart from the works, in its own column
// lang: 'en' (root) or 'de' (/de/, one level down). switchTo: URL of the other language version, if the page has one.
const header = (page, lang = 'en', switchTo = '') => {
	const de = lang === 'de';
	const root = de ? '../' : '';
	// the shop pages exist in English only: while the shop is live, German visitors go to the English page
	const avHref = de && SHOP ? '../available.html' : 'available.html';
	const av = `<a href="${avHref}" class="nav-available${page === 'available' ? ' is-here' : ''}">${de ? 'Verfügbar' : 'Available'}</a>`;
	const sw = switchTo
		? `<span class="lang"><a href="${de ? switchTo : './'}" hreflang="en" lang="en"${de ? '' : ' aria-current="true"'}>EN</a> <a href="${de ? './' : switchTo}" hreflang="de" lang="de"${de ? ' aria-current="true"' : ''}>DE</a></span> `
		: '';
	return `<header class="bar bar--top">
	<div class="cols bar-cols desktop-only">
		<div class="span-4"><a href="./#top" class="home">juliusniemeyer</a>${aktuell}</div>
		<div class="span-2">${av}</div>
		<nav class="span-4" aria-label="${de ? 'Werke' : 'Works'}">${worksNav(lang)}</nav>
		<div class="span-2 right">${sw}${stand}</div>
	</div>
	<div class="cols bar-cols mobile-only">
		<div><a href="./#top" class="home">juliusniemeyer</a> ${av}${aktuell}</div>
		<div class="right">${sw}${stand}</div>
	</div>
	<div class="progress" aria-hidden="true"></div>
</header>
`;
};

// electronic withdrawal function (§ 356a BGB) must be easy to find on every page while the shop is on
const withdrawLink = (sep, root = '') => (SHOP ? `${sep} <a href="${root}widerrufen.html">Vertrag widerrufen</a>` : '');

const footerFor = (lang = 'en') => {
	const de = lang === 'de';
	const root = de ? '../' : '';
	return `<footer class="bar bar--bottom">
	<div class="cols bar-cols desktop-only">
		<div class="span-6">${emailLink(de ? 'E-Mail,' : 'Email,')} <a href="https://studioniemeyer.de/labor/">Labor: studioniemeyer.de,</a> <a href="${root}impressum.html">Impressum,</a> <a href="${root}datenschutz.html">Datenschutz</a>${withdrawLink(',', root)}</div>
		<div class="span-4">${esc(tr(site, 'footer_quote', lang))}</div>
		<div class="span-2 right">${esc(site.footer_credit)}</div>
	</div>
	<div class="cols bar-cols mobile-only">
		<div>${emailLink(de ? 'E-Mail' : 'Email')}${withdrawLink('', root)}</div>
		<nav class="right" aria-label="${de ? 'Werke' : 'Works'}">${worksNav(lang)}</nav>
	</div>
</footer>
`;
};
const footer = footerFor('en');

const lightboxFor = (lang = 'en') => {
	const L = lang === 'de' ? ['Bildbetrachter', 'Schließen', 'Vorheriges Bild', 'Nächstes Bild'] : ['Image viewer', 'Close', 'Previous image', 'Next image'];
	return `<div class="lightbox" role="dialog" aria-modal="true" aria-label="${L[0]}" hidden>
	<img alt="">
	<div class="lb-meta"><span class="lb-count"></span><span class="lb-caption"></span></div>
	<button class="lb-btn lb-close" type="button" aria-label="${L[1]}"><svg viewBox="0 0 14 14"><path d="M2 2l10 10M12 2L2 12"/></svg></button>
	<button class="lb-btn lb-prev" type="button" aria-label="${L[2]}"><svg viewBox="0 0 14 14"><path d="M9 2L4 7l5 5"/></svg></button>
	<button class="lb-btn lb-next" type="button" aria-label="${L[3]}"><svg viewBox="0 0 14 14"><path d="M5 2l5 5-5 5"/></svg></button>
</div>
`;
};
const lightbox = lightboxFor('en');

/* ---------- pages ---------- */

function indexPage(img, lang = 'en') {
	const de = lang === 'de';
	const root = de ? '../' : '';
	const gallery = (w) => {
		const figs = (w.images || [])
			.filter((it) => img.has(it.image))
			.map((it, i) => {
				const im = img.get(it.image);
				const caption = (tr(it, 'caption', lang) || '').trim();
				const alt = plain(caption.split('\n')[0]) || `${tr(w, 'title', lang)}, fig. ${it.fig}`;
				return `		<figure data-fig="${esc(it.fig)}"${im.light ? ' class="on-light"' : ''}>
			<img src="${root}${im.small}" data-full="${root}${im.big}" width="${im.width}" height="${im.height}" alt="${esc(alt)}" loading="${i < 4 ? 'eager' : 'lazy'}" decoding="async">
${caption ? `			<figcaption>${md(caption).trim()}</figcaption>\n` : ''}		</figure>`;
			})
			.join('\n');
		return `\t<div class="gallery${w.extraClass || ''}" data-gallery>\n${figs}\n\t</div>`;
	};

	const sections = works
		.map(
			(w) => `	<section id="${w.anchor}" class="intro cols">
		<h1 class="span-8">${esc(tr(w, 'title', lang))}</h1>
		<div class="span-4">
			${md(tr(w, 'intro', lang)).trim()}
		</div>
	</section>

${gallery(w)}
`
		)
		.join('\n');

	const url = ORIGIN + (de ? '/de/' : '/');
	const desc = tr(site, 'description', lang);
	const ldjson = `	<link rel="canonical" href="${url}">
	<link rel="alternate" hreflang="en" href="${ORIGIN}/">
	<link rel="alternate" hreflang="de" href="${ORIGIN}/de/">
	<link rel="alternate" hreflang="x-default" href="${ORIGIN}/">
	<meta name="author" content="Julius Niemeyer">
	<meta property="og:type" content="website">
	<meta property="og:url" content="${url}">
	<meta property="og:locale" content="${de ? 'de_DE' : 'en_GB'}">
	<meta property="og:locale:alternate" content="${de ? 'en_GB' : 'de_DE'}">
	<meta property="og:title" content="${de ? 'Julius Niemeyer — Künstler | Systeme, Netzwerke, Prozesse' : 'Julius Niemeyer — Artist | Systems, Networks, Processes'}">
	<meta property="og:description" content="${esc(desc)}">
	<meta property="og:image" content="${ORIGIN}/og-image.jpg">
	<meta name="twitter:card" content="summary_large_image">
	<meta name="twitter:image" content="${ORIGIN}/og-image.jpg">
	<script type="application/ld+json">{"@context":"https://schema.org","@type":"Person","name":"Julius Niemeyer","url":"${url}","jobTitle":"${de ? 'Künstler' : 'Artist'}","homeLocation":{"@type":"Place","name":"${de ? 'München' : 'Munich'}"},"alumniOf":{"@type":"CollegeOrUniversity","name":"${de ? 'Akademie der Bildenden Künste München' : 'Academy of Fine Arts Munich'}"}}</script>
`;

	return `${head({ title: de ? 'Julius Niemeyer – Künstler, München' : 'Julius Niemeyer – Artist, Munich', description: desc, lang, extra: ldjson, root })}
${header('index', lang, de ? '../' : 'de/')}
<main id="top">

	<p class="hero">${esc(tr(site, 'footer_quote', lang))}</p>

${sections}
	<section id="artist-statement" class="statement">
		<hr>
		<div class="cols thirds">
			<h2 class="statement-title">${mdInline(tr(statement, 'title', lang))}</h2>
			<div>${md(tr(statement, 'column_1', lang))}</div>
			<div>${md(tr(statement, 'column_2', lang))}</div>
		</div>
	</section>

	<section id="cv" class="cv">
		<div class="cols thirds wide-gap">
			<div>${md(tr(cv, 'column_1', lang))}</div>
			<div>${md(tr(cv, 'column_2', lang))}</div>
			<div>${md(tr(cv, 'column_3', lang))}</div>
		</div>
	</section>

	<section class="feld" hidden><canvas aria-hidden="true"></canvas><p></p></section>
	<p class="wordmark" aria-hidden="true">studioniemeyer</p>
	<p class="legal mobile-legal"><a href="https://studioniemeyer.de/labor/">Labor: studioniemeyer.de</a>, <a href="${root}impressum.html">Impressum</a>, <a href="${root}datenschutz.html">Datenschutz</a></p>

</main>

${footerFor(lang)}
${lightboxFor(lang)}
<script src="${root}assets/main.js" defer></script>
<script src="${root}assets/labor.js" defer></script>
</body>
</html>
`;
}

function legalPage(p) {
	return `${head({ title: `${p.title} - Julius Niemeyer`, description: p.title, lang: 'de', robots: 'noindex, follow' })}
${header('legal')}
<main>
	<section class="intro cols legal-page">
		<h1 class="span-8">${esc(p.title)}</h1>
		<div class="span-4">
			${md(p.body).trim()}
		</div>
	</section>
</main>

${footer}
<script src="assets/main.js" defer></script>
</body>
</html>
`;
}

// Until the shop runs with real data from SPINE the page says "coming soon" (switches: see SHOP_LIVE above).
// Work on the shop locally: SHOP_PREVIEW=1 npm run build (never set in GitHub Actions);
// with SPINE_URL=http://127.0.0.1:3001 as well, the page talks to a local SPINE (Durchstich-Test).
// The list is fixed at build time (only the status is live): new works in SPINE need a new build (GitHub: Run workflow).

// Live only with checked legal texts: no draft flag, no "[OFFEN" left in the text.
function checkLiveLegal() {
	const open = legal.filter((p) => p.entwurf || /\[OFFEN/.test(p.body || '')).map((p) => p.name);
	if (open.length) fail(`SHOP_LIVE=1, but legal texts are still drafts: ${open.join(', ')} (remove "entwurf" after the check)`);
}

// SPINE sends the current price; the page works with the start price (current = start × 2^sold for capitalistic selling).
const fromSpine = (w) => (w.capitalistic && w.preis != null ? { ...w, preis: w.preis / 2 ** (w.verkauft || []).length } : w);

async function loadAvailable() {
	if (!SPINE_URL) {
		if (SHOP_LIVE) fail('SHOP_LIVE=1 needs SPINE_URL');
		return;
	}
	const api = `${SPINE_URL}/api/public/shop/${KANAL}`;
	try {
		const res = await fetch(api, { signal: AbortSignal.timeout(15000) });
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const data = await res.json();
		// SPINE sends fig (entered when the work is released for the shop); the local ids only fit the example data
		const local = SHOP_LIVE ? {} : Object.fromEntries(available.werke.map((w) => [w.id, w]));
		const werke = data.werke
			.map((w) => fromSpine({ verkauft: [], reserviert: [], ...w, fig: w.fig || local[w.id]?.fig }))
			.filter((w) => {
				if (!w.fig) console.warn(`  SPINE work ${w.id} has no fig. number (enter it in SPINE under /shop) – skipped`);
				return w.fig;
			});
		available = { versand: data.versand, rahmen: data.rahmen, werke, api };
		console.log(`  shop: ${werke.length} works from SPINE`);
	} catch (err) {
		if (SHOP_LIVE) fail(`SPINE not reachable (${err.message}) – no example data on the live site`);
		console.warn(`  shop: SPINE not reachable (${err.message}) – example data`);
	}
	if (SHOP_LIVE && !available.werke.length) fail('SPINE sent no works with a fig. number');
}

function comingSoonPage(lang = 'en') {
	const de = lang === 'de';
	const root = de ? '../' : '';
	const page = de
		? { title: 'Verfügbar', text: ['Bald verfügbar.', `Hier erscheinen Editionen und Arbeiten, die aktuell erhältlich sind. Bis dahin: ${emailLink('schreib eine E-Mail')}.`] }
		: { title: 'Available', text: ['Coming soon.', `Editions and works that are currently available will be listed here. Until then: ${emailLink('write an email')}.`] };
	return `${head(de ? { title: 'Verfügbar - Julius Niemeyer', description: 'Werke und Editionen von Julius Niemeyer — bald verfügbar.', lang, robots: 'noindex, follow', root } : { title: 'Available - Julius Niemeyer', description: 'Works and editions by Julius Niemeyer — coming soon.' })}
${header('available', lang, de ? '../available.html' : 'de/available.html')}
<main id="top">
	<section class="intro cols legal-page">
		<h1 class="span-8">${page.title}</h1>
		<div class="span-4">
			<p>${page.text[0]}</p>
			<p>${page.text[1]}</p>
		</div>
	</section>
</main>

${footerFor(lang)}
<script src="${root}assets/main.js" defer></script>
<script src="${root}assets/labor.js" defer></script>
</body>
</html>
`;
}

function availablePage(img) {
	// images by fig. number from the work galleries
	const byFig = {};
	works.flatMap((w) => w.images || []).forEach((it) => img.has(it.image) && (byFig[it.fig] = img.get(it.image)));
	const euro = (n) => `${n.toLocaleString('en-GB')} €`;
	const price = (w) => (w.capitalistic ? w.preis * 2 ** w.verkauft.length : w.preis);

	// deep link available.html#<fig>; variants sharing a fig (e.g. A2 and A3 of one poster) get #<fig>-2, -3 …
	const ids = new Set();
	const anchor = (fig) => {
		let id = fig;
		for (let n = 2; ids.has(id); n++) id = `${fig}-${n}`;
		ids.add(id);
		return id;
	};
	const item = (w) => {
		const im = byFig[w.fig];
		if (!im) throw new Error(`available.json: no image for fig. ${w.fig}`);
		const fig = `<figure data-fig="${esc(w.fig)}"${im.light ? ' class="on-light"' : ''}><img src="${im.small}" data-full="${im.big}" width="${im.width}" height="${im.height}" alt="${esc(w.titel)}" loading="lazy" decoding="async"></figure>`;
		const meta = `<p class="av-title">${esc(w.titel)} (${w.jahr})</p><p>${esc(w.technik)}<br>${esc(w.masse)}</p>`;
		const status = w.status === 'sold' ? 'sold' : w.status === 'reserved' ? 'reserved' : '';
		if (w.art === 'unikat' && w.modus === 'kauf' && w.preis != null) {
			// unique work that can be bought directly (SHOP.md, e.g. the Voids); available.js renders delivery and live status
			return `		<article class="av-item av-unikat av-direct" id="${esc(anchor(w.fig))}" data-id="${esc(w.id)}">${fig}<div class="av-info">${meta}
			<p class="av-price">unique work · ${status || `<b>${euro(w.preis)}</b>`}</p>
			${w.gerahmt ? '<p class="av-frame-incl">framed · frame included</p>' : ''}
			<p class="av-ship"></p>
			<noscript><p>Buying needs JavaScript — or write an email.</p></noscript>
			<p><button type="button" class="av-buy"${status ? ' hidden' : ''}>Buy — ${euro(w.preis)}</button></p>
			<p class="av-ask-first"${status === 'sold' ? ' hidden' : ''}><button type="button" class="av-link av-ask-link">or ask first</button></p></div></article>`;
		}
		if (w.art === 'unikat') {
			return `		<article class="av-item av-unikat" id="${esc(anchor(w.fig))}" data-id="${esc(w.id)}">${fig}<div class="av-info">${meta}
			<p class="av-price">unique work · ${status || 'price on request'}</p>
			${w.gerahmt ? '<p class="av-frame-incl">framed · frame included</p>' : ''}
			<noscript><p>Requests need JavaScript — or write an email.</p></noscript>
			<p><button type="button" class="av-ask"${status === 'sold' ? ' hidden' : ''}>Request</button></p></div></article>`;
		}
		// static price line for visitors without JavaScript; available.js renders the live version
		const soldOut = w.verkauft.length >= w.auflage;
		const free = w.auflage - w.verkauft.length - w.reserviert.length;
		const line = `edition of ${w.auflage} + ${w.ap ?? 1} AP · ${soldOut ? 'sold out' : `${free} available · ${euro(price(w))}`}`;
		return `		<article class="av-item av-edition" id="${esc(anchor(w.fig))}" data-id="${esc(w.id)}">${fig}<div class="av-info">${meta}
			<p class="av-price">${line}</p>
			<p class="av-cap"${w.capitalistic ? '' : ' hidden'}>capitalistic selling — the price doubles with every copy sold</p>
			<p class="av-label">choose your number</p>
			<div class="av-numbers" role="group" aria-label="edition numbers"></div>
			<div class="av-frames" role="radiogroup" aria-label="frame"></div>
			<p class="av-ship"></p>
			<noscript><p>Buying needs JavaScript — or write an email.</p></noscript>
			<p><button type="button" class="av-buy" disabled>Choose a number</button></p></div></article>`;
	};
	const editions = available.werke.filter((w) => w.art === 'edition');
	const unikate = available.werke.filter((w) => w.art === 'unikat');
	const uniqueSection = `	<section class="intro cols">
		<h1 class="span-8">Unique works</h1>
		<div class="span-4"><p>Request one or several works. You get a dossier per work by email; Julius gets in touch personally. Works with a price can also be bought directly, frame included.</p></div>
	</section>

	<div class="av-list">
${unikate.map(item).join('\n')}
	</div>
`;

	return `${head({ title: 'Available - Julius Niemeyer', description: 'Works and editions by Julius Niemeyer currently available.', robots: 'noindex, follow', extra: '	<link rel="stylesheet" href="assets/available.css">\n' })}
${header('available')}
<main id="top" class="available">

	<section class="intro cols">
		<h1 class="span-8">Available</h1>
		<div class="span-4">
			<p>Works currently available. <em>Editions</em> can be bought directly within the EU — choose the number you want.
			<em>Unique works</em> mostly on request — you receive a PDF dossier for each work by email; some can be bought directly. Shipping outside the EU on request.</p>
			<p class="av-note">Prices incl. VAT, plus shipping. In Munich: delivery or pickup by appointment.
			<a href="agb.html">Terms (AGB)</a>, <a href="widerruf.html">right of withdrawal</a>, <a href="versand.html">shipping</a>.${available.api ? '' : ' Prototype with example data — nothing is sold here.'}</p>
		</div>
	</section>

	<div class="av-list">
${editions.map(item).join('\n')}
	</div>

${unikate.length ? uniqueSection : ''}
</main>

${footer}
<div class="av-dialog" hidden role="dialog" aria-modal="true" aria-label="Request"><div class="av-box"></div></div>
<script type="application/json" id="av-data">${JSON.stringify(available).replace(/</g, '\\u003c')}</script>
<script src="assets/main.js" defer></script>
<script src="assets/labor.js" defer></script>
<script src="assets/available.js" defer></script>
</body>
</html>
`;
}

// Stripe sends buyers back here after paying (successUrl = https://juliusniemeyer.de/danke.html?o=<orderId>)
function thanksPage() {
	return `${head({ title: 'Thank you - Julius Niemeyer', description: 'Thank you for your order.', robots: 'noindex, nofollow' })}
${header('available')}
<main id="top">
	<section class="intro cols legal-page">
		<h1 class="span-8">Thank you</h1>
		<div class="span-4">
			<p>Your order has been received. You will receive an order confirmation by email.</p>
			<p>Paid by SEPA direct debit? The bank transfer takes a few days; the work stays reserved for you until then and is shipped once the payment has arrived.</p>
			<p class="av-order" hidden>Order number: <span></span></p>
			<p>Julius gets in touch about delivery or pickup. Questions: ${emailLink('write an email')}.</p>
			<p><a href="available.html">Back to Available</a></p>
		</div>
	</section>
</main>

${footer}
<script>(() => { const o = new URLSearchParams(location.search).get('o'); const p = document.querySelector('.av-order'); if (o && /^[A-Za-z0-9_-]{1,64}$/.test(o)) { p.querySelector('span').textContent = o; p.hidden = false; } })();</script>
<script src="assets/main.js" defer></script>
</body>
</html>
`;
}

// Stripe sends buyers back here when they leave the checkout without paying (cancelUrl of the SPINE channel: /abbruch.html)
function cancelPage() {
	return `${head({ title: 'Payment cancelled - Julius Niemeyer', description: 'The payment was cancelled.', robots: 'noindex, nofollow' })}
${header('available')}
<main id="top">
	<section class="intro cols legal-page">
		<h1 class="span-8">Payment cancelled</h1>
		<div class="span-4">
			<p>Nothing has been charged. The work or edition number you chose becomes available again after 30 minutes at the latest.</p>
			<p>Changed your mind, or something did not work? <a href="available.html">Back to Available</a> — or ${emailLink('write an email')}.</p>
		</div>
	</section>
</main>

${footer}
<script src="assets/main.js" defer></script>
</body>
</html>
`;
}

// Electronic withdrawal function (§ 356a BGB): POST <api>/withdrawal → 202, SPINE sends withdrawal.received and the
// Zentrale confirms receipt by email. Without SPINE (local) a prepared email opens instead.
function withdrawPage() {
	const cfg = { endpoint: available.api ? `${available.api}/withdrawal` : '', u: mailUser, d: mailDomain };
	return `${head({ title: 'Vertrag widerrufen - Julius Niemeyer', description: 'Vertrag widerrufen', lang: 'de', robots: 'noindex, follow', extra: '	<link rel="stylesheet" href="assets/available.css">\n' })}
${header('legal')}
<main id="top">
	<section class="intro cols legal-page">
		<h1 class="span-8">Vertrag widerrufen</h1>
		<div class="span-4">
			<p>Hier können Sie einen Kauf innerhalb der Widerrufsfrist widerrufen. Einzelheiten stehen in der <a href="widerruf.html">Widerrufsbelehrung</a>. Den Eingang bestätigen wir Ihnen unverzüglich per E-Mail.</p>
			<form class="av-form wd-form" data-wd>
				<label for="wd-name">Name</label>
				<input id="wd-name" name="name" type="text" required maxlength="200" autocomplete="name">
				<label for="wd-mail">E-Mail-Adresse</label>
				<input id="wd-mail" name="email" type="email" required maxlength="200" autocomplete="email">
				<label for="wd-order">Bestellnummer oder Arbeit</label>
				<input id="wd-order" name="order" type="text" required maxlength="200" placeholder="z. B. ord_… oder Titel der Arbeit">
				<label for="wd-note">Nachricht (optional)</label>
				<textarea id="wd-note" name="note" rows="3" maxlength="2000"></textarea>
				<input class="av-hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
				<p class="av-actions"><button type="submit" class="av-primary">Widerruf bestätigen</button></p>
				<p class="wd-msg" role="status"></p>
			</form>
		</div>
	</section>
</main>

${footer}
<script type="application/json" id="wd-data">${JSON.stringify(cfg).replace(/</g, '\\u003c')}</script>
<script src="assets/main.js" defer></script>
<script src="assets/widerrufen.js" defer></script>
</body>
</html>
`;
}

/* ---------- build ---------- */

(async () => {
	const t = Date.now();
	// checks first, so a stopped live build fails fast and writes nothing
	if (SHOP_LIVE) checkLiveLegal();
	await loadAvailable();
	fs.mkdirSync(OUT, { recursive: true });
	for (const f of ['assets', 'admin', 'favicon.ico', 'favicon.svg', 'og-image.jpg', 'google3a07b8437e504407.html', 'CNAME']) {
		if (fs.existsSync(f)) fs.cpSync(f, path.join(OUT, f), { recursive: true });
	}
	const img = await processImages();
	assignFigs();
	fs.writeFileSync(path.join(OUT, 'index.html'), indexPage(img));
	fs.writeFileSync(path.join(OUT, 'available.html'), SHOP ? availablePage(img) : comingSoonPage());
	// German version under /de/ (the shop pages stay English only)
	fs.mkdirSync(path.join(OUT, 'de'), { recursive: true });
	fs.writeFileSync(path.join(OUT, 'de', 'index.html'), indexPage(img, 'de'));
	if (!SHOP) fs.writeFileSync(path.join(OUT, 'de', 'available.html'), comingSoonPage('de'));
	// Always built (noindex): Stripe test payments redirect here even while Available shows "Coming soon".
	fs.writeFileSync(path.join(OUT, 'danke.html'), thanksPage());
	fs.writeFileSync(path.join(OUT, 'abbruch.html'), cancelPage());
	if (SHOP) {
		fs.writeFileSync(path.join(OUT, 'widerrufen.html'), withdrawPage());
		console.log(`  shop ${SHOP_LIVE ? 'live' : 'preview'}: available.html with ${available.api ? 'SPINE data' : 'example data'}`);
	}
	const pages = legal.filter((p) => SHOP || !p.entwurf);
	pages.forEach((p) => fs.writeFileSync(path.join(OUT, `${p.name}.html`), legalPage(p)));
	fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
	// Only the home pages (EN and DE) are indexable; every other page is noindex.
	const alt = (l, h) => `<xhtml:link rel="alternate" hreflang="${l}" href="${h}"/>`;
	const links = [alt('en', `${ORIGIN}/`), alt('de', `${ORIGIN}/de/`), alt('x-default', `${ORIGIN}/`)].join('');
	const sitemapUrls = [`${ORIGIN}/`, `${ORIGIN}/de/`].map((u) => `\n\t<url><loc>${u}</loc>${links}</url>`).join('');
	fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${sitemapUrls}\n</urlset>\n`);
	fs.writeFileSync(path.join(OUT, 'robots.txt'), 'User-agent: *\nAllow: /\n\nSitemap: https://juliusniemeyer.de/sitemap.xml\n');
	console.log(`built ${img.size} images, ${6 + pages.length} pages in ${((Date.now() - t) / 1000).toFixed(1)}s`);
})();
