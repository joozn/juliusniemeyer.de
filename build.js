// Builds the static site into _site/ from content/*.json and images/.
// Run: npm run build   (GitHub Actions runs the same on every push)
const fs = require('fs');
const path = require('path');
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
const legal = ['impressum', 'datenschutz'].map((n) => ({ name: n, ...read(`legal/${n}.json`) }));

const [mailUser, mailDomain] = site.email.split('@');
const emailLink = (label) => `<a href="#" data-u="${esc(mailUser)}" data-d="${esc(mailDomain)}">${label}</a>`;

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
			done.set(src, { big: `images/${base}-2400.webp`, small: `images/${base}-1200.webp`, width, height });
		}
	};
	await Promise.all(Array.from({ length: 6 }, worker));
	return done;
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
	<meta name="theme-color" content="#111111">
	<link rel="icon" href="favicon.ico" sizes="any">
	<link rel="preload" href="assets/fonts/Geist.woff2" as="font" type="font/woff2" crossorigin>
	<link rel="stylesheet" href="assets/style.css">
${extra}</head>
<body>
`;

const worksNav = `Works: ${works.map((w) => `<a href="./#${w.anchor}">${esc(w.title)},</a>`).join(' ')} <a href="./#cv">CV</a>`;

const header = `<header class="bar bar--top">
	<div class="cols bar-cols desktop-only">
		<div class="span-8"><a href="./#top" class="home">studioniemeyer</a></div>
		<nav class="span-2" aria-label="Works">${worksNav}</nav>
		<div class="span-2 right">${esc(site.date)}</div>
	</div>
	<div class="cols bar-cols mobile-only">
		<div><a href="./#top" class="home">studioniemeyer</a></div>
		<div class="right">${esc(site.date)}</div>
	</div>
</header>
`;

const footer = `<footer class="bar bar--bottom">
	<div class="cols bar-cols desktop-only">
		<div class="span-8">${emailLink('Email,')} <a href="impressum.html">Impressum,</a> <a href="datenschutz.html">Datenschutz</a></div>
		<div class="span-2">${esc(site.footer_quote)}</div>
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
				return `		<figure>
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

	return `${head({ title: 'Studioniemeyer - Julius Niemeyer', description: site.description, extra: ldjson })}
${header}
<main id="top">

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

	<p class="wordmark" aria-hidden="true">studioniemeyer</p>
	<p class="legal mobile-legal"><a href="impressum.html">Impressum</a>, <a href="datenschutz.html">Datenschutz</a></p>

</main>

${footer}
${lightbox}
<script src="assets/main.js" defer></script>
</body>
</html>
`;
}

function legalPage(p) {
	return `${head({ title: `${p.title} - Julius Niemeyer`, description: p.title, lang: 'de', robots: 'noindex, follow' })}
${header}
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

/* ---------- build ---------- */

(async () => {
	const t = Date.now();
	fs.mkdirSync(OUT, { recursive: true });
	for (const f of ['assets', 'admin', 'favicon.ico', 'og-image.jpg', 'CNAME']) {
		if (fs.existsSync(f)) fs.cpSync(f, path.join(OUT, f), { recursive: true });
	}
	const img = await processImages();
	fs.writeFileSync(path.join(OUT, 'index.html'), indexPage(img));
	legal.forEach((p) => fs.writeFileSync(path.join(OUT, `${p.name}.html`), legalPage(p)));
	fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
	console.log(`built ${img.size} images, ${2 + legal.length - 1} pages in ${((Date.now() - t) / 1000).toFixed(1)}s`);
})();
