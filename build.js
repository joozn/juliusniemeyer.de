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
const plain = (s = '') => s.replace(/[*_`#>[\]]/g, '').replace(/\(([^)]*)\)$/, '').trim();

const site = read('site.json');
const works = [
	{ file: 'works/installation.json', anchor: 'installation-text-1' },
	{ file: 'works/flat-works.json', anchor: 'flat-works-text' },
	{ file: 'works/other.json', anchor: 'other-text', extraClass: ' gallery--other' },
].map((w) => ({ ...w, ...read(w.file) }));
const statement = read('statement.json');
const cv = read('cv.json');
// works on offer (shop). Comes from SPINE when SPINE_URL is set (contract: C:\dev_apps\mainframe\docserkauf.md),
// otherwise example data. content/available.json also maps SPINE work ids to fig. numbers (images stay on the website).
const KANAL = 'juliusniemeyer';
const SPINE_URL = (process.env.SPINE_URL || '').replace(/\/$/, '');
let available = read('available.json');
const legal = ['impressum', 'datenschutz'].map((n) => ({ name: n, ...read(`legal/${n}.json`) }));

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

const head = ({ title, description, lang = 'en', robots = 'index, follow', extra = '' }) => `<!DOCTYPE html>
<html lang="${lang}">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>${esc(title)}</title>
	<meta name="description" content="${esc(description)}">
	<meta name="robots" content="${robots}">
	<meta name="theme-color" content="#0a0b1d">
	<link rel="icon" href="favicon.ico" sizes="any">
	<link rel="icon" href="favicon.svg" type="image/svg+xml">
	<link rel="preload" href="assets/fonts/Geist.woff2" as="font" type="font/woff2" crossorigin>
	<link rel="stylesheet" href="assets/style.css">
${extra}</head>
<body>
`;

const worksNav = `Works: ${works.map((w) => `<a href="./#${w.anchor}">${esc(w.title)},</a>`).join(' ')} <a href="./#cv">CV</a>`;

// "Available" sits apart from the works, in its own column
const header = (page) => {
	const av = `<a href="available.html" class="nav-available${page === 'available' ? ' is-here' : ''}">Available</a>`;
	return `<header class="bar bar--top">
	<div class="cols bar-cols desktop-only">
		<div class="span-4"><a href="./#top" class="home">juliusniemeyer</a>${aktuell}</div>
		<div class="span-2">${av}</div>
		<nav class="span-4" aria-label="Works">${worksNav}</nav>
		<div class="span-2 right">${stand}</div>
	</div>
	<div class="cols bar-cols mobile-only">
		<div><a href="./#top" class="home">juliusniemeyer</a> ${av}${aktuell}</div>
		<div class="right">${stand}</div>
	</div>
	<div class="progress" aria-hidden="true"></div>
</header>
`;
};

const footer = `<footer class="bar bar--bottom">
	<div class="cols bar-cols desktop-only">
		<div class="span-6">${emailLink('Email,')} <a href="https://studioniemeyer.de/labor/">Labor: studioniemeyer.de,</a> <a href="impressum.html">Impressum,</a> <a href="datenschutz.html">Datenschutz</a></div>
		<div class="span-4">${esc(site.footer_quote)}</div>
		<div class="span-2 right">${esc(site.footer_credit)}</div>
	</div>
	<div class="cols bar-cols mobile-only">
		<div>${emailLink('Email')}</div>
		<nav class="right" aria-label="Works">${worksNav}</nav>
	</div>
</footer>
`;

const lightbox = `<div class="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer" hidden>
	<img alt="">
	<div class="lb-meta"><span class="lb-count"></span><span class="lb-caption"></span></div>
	<button class="lb-btn lb-close" type="button" aria-label="Close"><svg viewBox="0 0 14 14"><path d="M2 2l10 10M12 2L2 12"/></svg></button>
	<button class="lb-btn lb-prev" type="button" aria-label="Previous image"><svg viewBox="0 0 14 14"><path d="M9 2L4 7l5 5"/></svg></button>
	<button class="lb-btn lb-next" type="button" aria-label="Next image"><svg viewBox="0 0 14 14"><path d="M5 2l5 5-5 5"/></svg></button>
</div>
`;

/* ---------- pages ---------- */

function indexPage(img) {
	const gallery = (w) => {
		const figs = (w.images || [])
			.filter((it) => img.has(it.image))
			.map((it, i) => {
				const im = img.get(it.image);
				const caption = (it.caption || '').trim();
				const alt = plain(caption.split('\n')[0]);
				return `		<figure data-fig="${esc(it.fig)}"${im.light ? ' class="on-light"' : ''}>
			<img src="${im.small}" data-full="${im.big}" width="${im.width}" height="${im.height}" alt="${esc(alt)}" loading="${i < 4 ? 'eager' : 'lazy'}" decoding="async">
${caption ? `			<figcaption>${md(caption).trim()}</figcaption>\n` : ''}		</figure>`;
			})
			.join('\n');
		return `\t<div class="gallery${w.extraClass || ''}" data-gallery>\n${figs}\n\t</div>`;
	};

	const sections = works
		.map(
			(w) => `	<section id="${w.anchor}" class="intro cols">
		<h1 class="span-8">${esc(w.title)}</h1>
		<div class="span-4">
			${md(w.intro).trim()}
		</div>
	</section>

${gallery(w)}
`
		)
		.join('\n');

	const ldjson = `	<link rel="canonical" href="https://juliusniemeyer.de/">
	<meta name="author" content="Julius Niemeyer">
	<meta property="og:type" content="website">
	<meta property="og:url" content="https://juliusniemeyer.de/">
	<meta property="og:title" content="Julius Niemeyer — Artist | Systems, Networks, Processes">
	<meta property="og:description" content="${esc(site.description)}">
	<meta property="og:image" content="https://juliusniemeyer.de/og-image.jpg">
	<meta name="twitter:card" content="summary_large_image">
	<meta name="twitter:image" content="https://juliusniemeyer.de/og-image.jpg">
	<script type="application/ld+json">{"@context":"https://schema.org","@type":"Person","name":"Julius Niemeyer","url":"https://juliusniemeyer.de/","jobTitle":"Artist","homeLocation":{"@type":"Place","name":"Munich"},"alumniOf":{"@type":"CollegeOrUniversity","name":"Academy of Fine Arts Munich"}}</script>
`;

	return `${head({ title: 'Julius Niemeyer', description: site.description, extra: ldjson })}
${header('index')}
<main id="top">

	<p class="hero">${esc(site.footer_quote)}</p>

${sections}
	<section id="artist-statement" class="statement">
		<hr>
		<div class="cols thirds">
			<h2 class="statement-title">${mdInline(statement.title)}</h2>
			<div>${md(statement.column_1)}</div>
			<div>${md(statement.column_2)}</div>
		</div>
	</section>

	<section id="cv" class="cv">
		<div class="cols thirds wide-gap">
			<div>${md(cv.column_1)}</div>
			<div>${md(cv.column_2)}</div>
			<div>${md(cv.column_3)}</div>
		</div>
	</section>

	<section class="feld" hidden><canvas aria-hidden="true"></canvas><p></p></section>
	<p class="wordmark" aria-hidden="true">studioniemeyer</p>
	<p class="legal mobile-legal"><a href="https://studioniemeyer.de/labor/">Labor: studioniemeyer.de</a>, <a href="impressum.html">Impressum</a>, <a href="datenschutz.html">Datenschutz</a></p>

</main>

${footer}
${lightbox}
<script src="assets/main.js" defer></script>
<script src="assets/labor.js" defer></script>
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

// Until the shop runs with real data from SPINE the page says "coming soon".
// Work on the shop locally: SHOP_PREVIEW=1 npm run build (never set in GitHub Actions);
// with SPINE_URL=http://127.0.0.1:3000 as well, the page talks to a local SPINE (Durchstich-Test).
const SHOP_PREVIEW = process.env.SHOP_PREVIEW === '1';

// SPINE sends the current price; the page works with the start price (current = start × 2^sold for capitalistic selling).
const fromSpine = (w) => (w.capitalistic && w.preis != null ? { ...w, preis: w.preis / 2 ** (w.verkauft || []).length } : w);

async function loadAvailable() {
	if (!SPINE_URL) return;
	const api = `${SPINE_URL}/api/public/shop/${KANAL}`;
	try {
		const res = await fetch(api, { signal: AbortSignal.timeout(15000) });
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const data = await res.json();
		const local = Object.fromEntries(available.werke.map((w) => [w.id, w]));
		const werke = data.werke
			.map((w) => fromSpine({ verkauft: [], reserviert: [], ...w, fig: w.fig || local[w.id]?.fig }))
			.filter((w) => {
				if (!w.fig) console.warn(`  SPINE work ${w.id} has no fig. number in content/available.json – skipped`);
				return w.fig;
			});
		available = { versand: data.versand, rahmen: data.rahmen, werke, api };
		console.log(`  shop: ${werke.length} works from SPINE`);
	} catch (err) {
		console.warn(`  shop: SPINE not reachable (${err.message}) – example data`);
	}
}

function comingSoonPage() {
	return `${head({ title: 'Available - Julius Niemeyer', description: 'Works and editions by Julius Niemeyer — coming soon.' })}
${header('available')}
<main id="top">
	<section class="intro cols legal-page">
		<h1 class="span-8">Available</h1>
		<div class="span-4">
			<p>Coming soon.</p>
			<p>Editions and works that are currently available will be listed here. Until then: ${emailLink('write an email')}.</p>
		</div>
	</section>
</main>

${footer}
<script src="assets/main.js" defer></script>
<script src="assets/labor.js" defer></script>
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

	const item = (w) => {
		const im = byFig[w.fig];
		if (!im) throw new Error(`available.json: no image for fig. ${w.fig}`);
		const fig = `<figure data-fig="${esc(w.fig)}"${im.light ? ' class="on-light"' : ''}><img src="${im.small}" data-full="${im.big}" width="${im.width}" height="${im.height}" alt="${esc(w.titel)}" loading="lazy" decoding="async"></figure>`;
		const meta = `<p class="av-title">${esc(w.titel)} (${w.jahr})</p><p>${esc(w.technik)}<br>${esc(w.masse)}</p>`;
		if (w.art === 'unikat') {
			if (w.modus === 'kauf') console.warn(`  ${w.id}: unique work with modus "kauf" is shown as "on request" (not built yet)`);
			return `		<article class="av-item av-unikat" data-id="${esc(w.id)}">${fig}<div class="av-info">${meta}
			<p class="av-price">unique work · price on request</p>
			${w.gerahmt ? '<p class="av-frame-incl">framed · frame included</p>' : ''}
			<noscript><p>Requests need JavaScript — or write an email.</p></noscript>
			<p><button type="button" class="av-ask">Request</button></p></div></article>`;
		}
		// static price line for visitors without JavaScript; available.js renders the live version
		const soldOut = w.verkauft.length >= w.auflage;
		const free = w.auflage - w.verkauft.length - w.reserviert.length;
		const line = `edition of ${w.auflage} + ${w.ap ?? 1} AP · ${soldOut ? 'sold out' : `${free} available · ${euro(price(w))}`}`;
		return `		<article class="av-item av-edition" data-id="${esc(w.id)}">${fig}<div class="av-info">${meta}
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

	return `${head({ title: 'Available - Julius Niemeyer', description: 'Works and editions by Julius Niemeyer currently available.', robots: 'noindex, follow', extra: '	<link rel="stylesheet" href="assets/available.css">\n' })}
${header('available')}
<main id="top" class="available">

	<section class="intro cols">
		<h1 class="span-8">Available</h1>
		<div class="span-4">
			<p>Works currently available. <em>Editions</em> can be bought directly within the EU — choose the number you want.
			<em>Unique works</em> on request: you receive a PDF dossier for each work by email. Shipping outside the EU on request.</p>
			<p class="av-note">Prices incl. VAT, plus shipping. In Munich: delivery or pickup by appointment.${available.api ? '' : ' Prototype with example data — nothing is sold here.'}</p>
		</div>
	</section>

	<div class="av-list">
${editions.map(item).join('\n')}
	</div>

	<section class="intro cols">
		<h1 class="span-8">Unique works</h1>
		<div class="span-4"><p>Request one or several works. You get a dossier per work by email; Julius gets in touch personally.</p></div>
	</section>

	<div class="av-list">
${unikate.map(item).join('\n')}
	</div>

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
			<p>Your payment went through. You will receive an order confirmation by email.</p>
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

/* ---------- build ---------- */

(async () => {
	const t = Date.now();
	fs.mkdirSync(OUT, { recursive: true });
	for (const f of ['assets', 'admin', 'favicon.ico', 'favicon.svg', 'og-image.jpg', 'CNAME']) {
		if (fs.existsSync(f)) fs.cpSync(f, path.join(OUT, f), { recursive: true });
	}
	const img = await processImages();
	await loadAvailable();
	assignFigs();
	fs.writeFileSync(path.join(OUT, 'index.html'), indexPage(img));
	fs.writeFileSync(path.join(OUT, 'available.html'), SHOP_PREVIEW ? availablePage(img) : comingSoonPage());
	if (SHOP_PREVIEW) {
		fs.writeFileSync(path.join(OUT, 'danke.html'), thanksPage());
		console.log(`  shop preview: available.html with ${available.api ? 'SPINE data' : 'example data'}`);
	}
	legal.forEach((p) => fs.writeFileSync(path.join(OUT, `${p.name}.html`), legalPage(p)));
	fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
	console.log(`built ${img.size} images, ${2 + legal.length} pages in ${((Date.now() - t) / 1000).toFixed(1)}s`);
})();
