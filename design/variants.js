// Design prototypes — NOT part of the live site. Run after `npm run build`:
//   node design/variants.js   → _site/varianten.html, _site/variante-a|b|c.html
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { marked } = require('marked');

const OUT = '_site';
const read = (f) => JSON.parse(fs.readFileSync(path.join('content', f), 'utf8'));
const md = (s = '') => marked.parse(s, { breaks: true }).trim();
const mdInline = (s = '') => marked.parseInline(s);
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');

const site = read('site.json');
const statement = read('statement.json');
const cv = read('cv.json');
const CATS = [
	{ key: 'installation', anchor: 'installation-text-1' },
	{ key: 'flat-works', anchor: 'flat-works-text' },
	{ key: 'other', anchor: 'other-text' },
].map((c) => ({ ...c, ...read(`works/${c.key}.json`) }));
const [mailUser, mailDomain] = site.email.split('@');
const emailLink = (label) => `<a href="#" data-u="${esc(mailUser)}" data-d="${esc(mailDomain)}">${label}</a>`;

/* ---------- caption → project ---------- */

function parseCaption(caption) {
	const lines = caption.split('\n');
	const first = lines[0].trim();
	const parent = caption.match(/from\s*\n*\s*“([^”“]+)[“”]/);
	const m = first.match(/“([^”]+)”(?:\s*(?:and|,)\s*“[^”]+”)*\s*(?:\((\d{4})\))?/);
	if (!m) return null;
	const title = parent ? parent[1].trim() : m[1].trim();
	const year = m[2] || (caption.match(/\((\d{4})\)/) || [])[1] || '';
	const meta = first
		.slice(m.index + m[0].length)
		.replace(/^\s*[-–\/@]\s*/, '')
		.replace(/\s*\/?\s*Foto:.*$/, '')
		.replace(/^from\s*$/, '')
		.trim();
	const text = lines.slice(1).join('\n').replace(/^from[\s\S]*$/, '').trim();
	return { title, year, meta, text };
}

async function loadImages() {
	const map = new Map();
	for (const c of CATS) {
		for (const it of c.images) {
			const base = path.parse(it.image).name;
			const big = path.join(OUT, 'images', `${base}-2400.webp`);
			if (!fs.existsSync(big)) throw new Error(`run "npm run build" first (${big} missing)`);
			const { width, height } = await sharp(big).metadata();
			map.set(it.image, { big: `images/${base}-2400.webp`, small: `images/${base}-1200.webp`, width, height });
		}
	}
	return map;
}

function projectsOf(cat, img) {
	const list = [];
	const byKey = new Map();
	let last = null;
	cat.images.forEach((it) => {
		const p = parseCaption(it.caption || '');
		let proj = p ? byKey.get(slug(p.title)) : last; // caption-less image belongs to the previous project
		if (!proj && p) {
			proj = { id: `${cat.key}-${slug(p.title)}`, title: p.title, year: p.year, metas: [], texts: [], images: [], cat };
			byKey.set(slug(p.title), proj);
			list.push(proj);
		}
		if (!proj) return;
		if (p?.meta && !proj.metas.includes(p.meta)) proj.metas.push(p.meta);
		if (p?.text && !proj.texts.includes(p.text)) proj.texts.push(p.text);
		proj.images.push({ ...img.get(it.image), caption: it.caption || '' });
		last = proj;
	});
	return list;
}

/* ---------- shared markup ---------- */

const head = (title, css = '') => `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="robots" content="noindex">
	<title>${esc(title)}</title>
	<link rel="icon" href="favicon.ico" sizes="any">
	<link rel="stylesheet" href="assets/style.css">
	<style>${css}</style>
</head>
<body>
`;

const nav = (prefix = '') =>
	`Works: ${CATS.map((c) => `<a href="${prefix}#${c.anchor}" data-nav="${c.anchor}">${esc(c.title)},</a>`).join(' ')} <a href="${prefix}#cv" data-nav="cv">CV</a>`;

const header = (right = esc(site.date)) => `<header class="bar bar--top">
	<div class="cols bar-cols desktop-only">
		<div class="span-8"><a href="#top" class="home">studioniemeyer</a></div>
		<nav class="span-2" aria-label="Works">${nav()}</nav>
		<div class="span-2 right">${right}</div>
	</div>
	<div class="cols bar-cols mobile-only">
		<div><a href="#top" class="home">studioniemeyer</a></div>
		<div class="right">${right}</div>
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
		<nav class="right" aria-label="Works">${nav()}</nav>
	</div>
</footer>
`;

const lightbox = `<div class="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer" hidden>
	<img alt="">
	<div class="lb-meta"><div class="lb-caption"></div><div class="lb-count"></div></div>
	<button class="lb-btn lb-close" type="button" aria-label="Close"><svg viewBox="0 0 14 14"><path d="M2 2l10 10M12 2L2 12"/></svg></button>
	<button class="lb-btn lb-prev" type="button" aria-label="Previous image"><svg viewBox="0 0 14 14"><path d="M9 2L4 7l5 5"/></svg></button>
	<button class="lb-btn lb-next" type="button" aria-label="Next image"><svg viewBox="0 0 14 14"><path d="M5 2l5 5-5 5"/></svg></button>
</div>
`;

const statementAndCv = `	<section id="artist-statement" class="statement">
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
`;

const intro = (c) => `	<section id="${c.anchor}" class="intro cols">
		<h1 class="span-8">${esc(c.title)}</h1>
		<div class="span-4">${md(c.intro)}</div>
	</section>
`;

const figure = (im, { id = '', caption = im.caption, lazy = true, extra = '' } = {}) => `		<figure${id ? ` id="${id}"` : ''}${extra}>
			<img src="${im.small}" data-full="${im.big}" width="${im.width}" height="${im.height}" alt="" loading="${lazy ? 'lazy' : 'eager'}" decoding="async">
			${caption ? `<figcaption>${md(caption)}</figcaption>` : ''}
		</figure>`;

const tail = (js = '') => `${footer}
${lightbox}
<script src="assets/main.js" defer></script>
${js ? `<script>${js}</script>` : ''}
</body>
</html>
`;

const lightboxCss = `
	.lb-meta { position: absolute; left: 20px; right: 20px; bottom: 16px; display: flex; gap: 2rem; justify-content: space-between; align-items: end;
		font-family: var(--mono); font-size: 0.75rem; line-height: 1.35; color: var(--text-dim); pointer-events: none; }
	.lb-caption { max-width: 44rem; }
	.lb-caption p { margin: 0; }
	.lb-caption p + p { margin-top: 0.6em; }
	.lb-count { white-space: nowrap; }
	.lightbox { padding: 4rem 4rem 7rem; }
	@media (max-width: 768px) { .lightbox { padding: 10px 10px 8rem; } }
`;

/* ---------- variant A: Werkindex ---------- */

function variantA(projects) {
	const all = projects.flat();
	const rows = [...all]
		.sort((a, b) => (b.year || 0) - (a.year || 0))
		.map(
			(p) => `<tr data-peek="${p.images[0].small}"><td>${esc(p.year || '—')}</td><td><a href="#${p.id}">${esc(p.title)}</a></td><td>${esc(p.metas[0] || '')}</td><td>${esc(p.cat.title)}</td><td class="right">${p.images.length}</td></tr>`
		)
		.join('\n\t\t\t');
	const years = all.map((p) => +p.year).filter(Boolean);

	const sections = CATS.map((c, ci) => {
		const figs = projects[ci]
			.flatMap((p) => p.images.map((im, i) => figure(im, { id: i === 0 ? p.id : '', lazy: true })))
			.join('\n');
		return `${intro(c)}\n\t<div class="gallery${c.key === 'other' ? ' gallery--other' : ''}" data-gallery>\n${figs}\n\t</div>\n`;
	}).join('\n');

	const css = `
	:root { --link: #5c6bff; }
	a:hover { text-decoration: underline; text-underline-offset: 0.15em; }
	.index-head { padding: 0.8rem 0 0.6rem; }
	.work-index { width: 100%; border-collapse: collapse; font-family: var(--mono); font-size: 0.8rem; line-height: 1.35; margin: 0 0 4rem; }
	.work-index th, .work-index td { text-align: left; font-weight: 400; padding: 0.4rem 1rem 0.4rem 0; border-bottom: 1px solid rgba(255,255,255,0.14); vertical-align: top; }
	.work-index th { color: var(--text-dim); border-bottom-color: var(--line); }
	.work-index td:first-child, .work-index th:first-child { width: 5rem; }
	.work-index td:nth-child(4) { width: 9rem; color: var(--text-dim); }
	.work-index td:last-child { width: 3rem; padding-right: 0; color: var(--text-dim); }
	.work-index tbody tr { cursor: pointer; }
	.work-index tbody tr:hover td { color: #fff; background: rgba(255,255,255,0.04); }
	.work-index a { color: inherit; }
	.peek { position: fixed; z-index: 20; width: 18vw; max-height: 55vh; object-fit: contain; pointer-events: none; opacity: 0; transition: opacity 0.15s; }
	.peek.on { opacity: 1; }
	.gallery figure { scroll-margin-top: calc(var(--bar-h) + 1rem); }
	@media (max-width: 768px) { .work-index td:nth-child(3), .work-index th:nth-child(3), .work-index td:nth-child(4), .work-index th:nth-child(4) { display: none; } .peek { display: none; } }
	${lightboxCss}`;

	const js = `
	const peek = document.querySelector('.peek');
	document.querySelectorAll('.work-index tbody tr').forEach((tr) => {
		tr.addEventListener('mouseenter', () => { peek.src = tr.dataset.peek; peek.classList.add('on'); });
		tr.addEventListener('mouseleave', () => peek.classList.remove('on'));
		tr.addEventListener('click', (e) => { if (e.target.tagName !== 'A') tr.querySelector('a').click(); });
	});
	addEventListener('mousemove', (e) => {
		const w = peek.offsetWidth, h = peek.offsetHeight;
		peek.style.left = Math.min(e.clientX + 24, innerWidth - w - 12) + 'px';
		peek.style.top = Math.min(Math.max(e.clientY - h / 2, 40), innerHeight - h - 40) + 'px';
	});`;

	return `${head('Variante A – Werkindex', css)}${header()}
<main id="top">
	<section class="index-head intro cols">
		<h1 class="span-8">Index</h1>
		<div class="span-4"><p>${all.length} works, ${Math.min(...years)}–${Math.max(...years)}. Hover a title for a preview, click to jump to the images.</p></div>
	</section>
	<table class="work-index">
		<thead><tr><th>Year</th><th>Work</th><th>Medium / Context</th><th>Section</th><th class="right">Img.</th></tr></thead>
		<tbody>
			${rows}
		</tbody>
	</table>

${sections}
${statementAndCv}
	<p class="wordmark" aria-hidden="true">studioniemeyer</p>
</main>
<img class="peek" alt="" aria-hidden="true">
${tail(js)}`;
}

/* ---------- variant B: Projekte ---------- */

function variantB(projects) {
	const hero = projects[0][0].images[0];
	const sections = CATS.map((c, ci) => {
		const arts = projects[ci]
			.map(
				(p) => `	<article class="project cols" id="${p.id}">
		<div class="span-4 project-info">
			<h2>${esc(p.title)}</h2>
			<p class="project-meta">${esc(p.year)}${p.metas.length ? ` · ${esc(p.metas[0])}` : ''}</p>
			${p.texts.map((t) => md(t)).join('\n')}
			<p class="project-count">${p.images.length} ${p.images.length === 1 ? 'image' : 'images'}</p>
		</div>
		<div class="span-8 gallery" data-gallery data-row="0.42" data-row-mobile="0.9">
${p.images.map((im) => figure(im)).join('\n')}
		</div>
	</article>`
			)
			.join('\n');
		return `${intro(c)}\n${arts}\n`;
	}).join('\n');

	const css = `
	:root { --link: #5c6bff; }
	.hero { position: relative; height: calc(100svh - 2 * var(--bar-h)); margin: 0 calc(-1 * var(--side)) 0; overflow: hidden; }
	.hero img { width: 100%; height: 100%; object-fit: cover; display: block; filter: brightness(0.82); }
	.hero-text { position: absolute; left: var(--side); right: var(--side); bottom: 1rem; display: grid; grid-template-columns: repeat(12, 1fr); gap: var(--gutter); }
	.hero-text h1 { grid-column: span 8; margin: 0; font-size: clamp(2.2rem, 6vw, 6rem); font-weight: 600; letter-spacing: -0.03em; line-height: 0.9; color: #fff; }
	.hero-text p { grid-column: span 4; margin: 0; align-self: end; color: #fff; }
	.intro { margin-top: 3rem; }
	.project { padding: 1.4rem 0 3rem; border-top: 1px solid rgba(255,255,255,0.14); }
	.project-info { position: sticky; top: calc(var(--bar-h) + 0.8rem); }
	.project-info h2 { font: inherit; font-size: 1.6rem; font-weight: 600; letter-spacing: -0.02em; line-height: 1; margin: 0 0 0.6rem; }
	.project-info p { margin: 0 0 1em; max-width: 32rem; }
	.project-meta, .project-count { font-family: var(--mono); font-size: 0.8rem; color: var(--text-dim); }
	.project .gallery { padding: 0; }
	.project figcaption { display: none; }
	nav a.is-active { color: #fff; }
	@media (max-width: 768px) { .project-info { position: static; } .hero-text { display: block; } .hero-text p { margin-top: 1rem; } }
	${lightboxCss}`;

	const js = `
	const links = document.querySelectorAll('[data-nav]');
	const io = new IntersectionObserver((entries) => entries.forEach((e) => {
		if (!e.isIntersecting) return;
		links.forEach((a) => a.classList.toggle('is-active', a.dataset.nav === e.target.id));
	}), { rootMargin: '-30% 0px -60% 0px' });
	document.querySelectorAll('.intro[id], #cv').forEach((s) => io.observe(s));`;

	return `${head('Variante B – Projekte', css)}${header()}
<main id="top">
	<section class="hero">
		<img src="${hero.big}" alt="">
		<div class="hero-text"><h1>Systems, Networks,<br>and Processes.</h1><p>Julius Niemeyer — installations and flat works. Munich.</p></div>
	</section>
${sections}
${statementAndCv}
	<p class="wordmark" aria-hidden="true">studioniemeyer</p>
</main>
${tail(js)}`;
}

/* ---------- variant C: Archiv hell ---------- */

function variantC(projects) {
	let n = 0;
	const figs = projects
		.flatMap((list, ci) =>
			list.flatMap((p) =>
				p.images.map((im) => {
					n++;
					const no = String(n).padStart(2, '0');
					return figure(im, {
						caption: `fig. ${no} — ${p.title}${p.year ? `, ${p.year}` : ''}\n\n${im.caption}`,
						extra: ` data-cat="${CATS[ci].key}"`,
					});
				})
			)
		)
		.join('\n');

	const css = `
	:root { --bg: #efeee9; --text: #111; --text-dim: rgba(17,17,17,0.6); --line: rgba(17,17,17,0.35); --link: #0000ff; color-scheme: light; }
	.wordmark { color: rgba(0,0,0,0.07); }
	.field { position: relative; height: calc(72svh - var(--bar-h)); margin: 0 calc(-1 * var(--side)); border-bottom: 0.1rem solid var(--line); }
	.field canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
	.field-text { position: absolute; left: var(--side); right: var(--side); bottom: 0.8rem; display: grid; grid-template-columns: repeat(12, 1fr); gap: var(--gutter); }
	.field-text p { grid-column: span 4; margin: 0; background: var(--bg); justify-self: start; padding: 0.2rem 0.3rem 0.2rem 0; }
	.field-text p:first-child { grid-column: span 8; }
	.filters { display: flex; flex-wrap: wrap; gap: 0.4rem; padding: 0.8rem 0; position: sticky; top: var(--bar-h); background: var(--bg); z-index: 5; border-bottom: 1px solid rgba(0,0,0,0.12); }
	.filters button { font: inherit; font-family: var(--mono); font-size: 0.8rem; background: none; color: var(--text); border: 1px solid var(--line); border-radius: 10em; padding: 0.25rem 0.8rem; cursor: pointer; }
	.filters button[aria-pressed="true"] { background: var(--text); color: var(--bg); border-color: var(--text); }
	.archive { columns: 4; column-gap: 0.8rem; padding: 1rem 0 8rem; }
	.archive figure { break-inside: avoid; margin: 0 0 1.2rem; cursor: zoom-in; }
	.archive img { width: 100%; height: auto; display: block; background: rgba(0,0,0,0.05); }
	.archive figcaption { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; border: 0; padding: 0; margin: 0.4rem 0 0; }
	.archive figcaption p { margin: 0; }
	.archive figcaption p + p { display: none; }
	.lb-btn { background: rgba(0,0,0,0.12); }
	@media (max-width: 1100px) { .archive { columns: 3; } }
	@media (max-width: 768px) { .archive { columns: 2; } .field-text { display: block; } .field-text p { margin-top: 0.4rem; } }
	${lightboxCss}`;

	const counts = Object.fromEntries(CATS.map((c, i) => [c.key, projects[i].reduce((s, p) => s + p.images.length, 0)]));
	const js = `
	// filter
	const figs = [...document.querySelectorAll('.archive figure')];
	document.querySelectorAll('.filters button').forEach((b) => b.addEventListener('click', () => {
		document.querySelectorAll('.filters button').forEach((x) => x.setAttribute('aria-pressed', x === b));
		figs.forEach((f) => (f.hidden = b.dataset.f !== 'all' && f.dataset.cat !== b.dataset.f));
	}));

	// entropy field: a grid of vectors drifting from order into disorder
	const cv = document.querySelector('.field canvas');
	const ctx = cv.getContext('2d');
	const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
	let W, H, cells = [], t0 = performance.now(), mouse = { x: -1e4, y: -1e4 }, visible = true;
	const S = 18;
	function setup() {
		const dpr = devicePixelRatio || 1;
		W = cv.clientWidth; H = cv.clientHeight;
		cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		cells = [];
		for (let y = S / 2; y < H; y += S) for (let x = S / 2; x < W; x += S) cells.push({ x, y, r: Math.random() * 2 - 1, s: 0.3 + Math.random() });
	}
	function draw(now) {
		const d = still ? 0.35 : 0.18 + 0.82 * Math.min(1, (now - t0) / 25000); // disorder grows over 25 s
		ctx.clearRect(0, 0, W, H);
		ctx.strokeStyle = 'rgba(17,17,17,0.75)'; ctx.lineWidth = 1;
		ctx.beginPath();
		for (const c of cells) {
			const dx = c.x - mouse.x, dy = c.y - mouse.y;
			const near = Math.max(0, 1 - Math.hypot(dx, dy) / 160);
			const a = c.r * Math.PI * Math.min(1, d * d * c.s + near * 0.9) + (still ? 0 : Math.sin(now / 1800 + c.r * 6) * 0.08 * d);
			const l = 6;
			ctx.moveTo(c.x - Math.cos(a) * l, c.y - Math.sin(a) * l);
			ctx.lineTo(c.x + Math.cos(a) * l, c.y + Math.sin(a) * l);
		}
		ctx.stroke();
		if (!still && visible) requestAnimationFrame(draw);
	}
	setup(); requestAnimationFrame(draw);
	addEventListener('resize', setup);
	cv.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; });
	cv.addEventListener('pointerleave', () => (mouse = { x: -1e4, y: -1e4 }));
	cv.addEventListener('click', () => (t0 = performance.now())); // click restores order
	new IntersectionObserver(([e]) => { const was = visible; visible = e.isIntersecting; if (visible && !was) requestAnimationFrame(draw); }).observe(cv);`;

	return `${head('Variante C – Archiv hell', css)}${header()}
<main id="top">
	<section class="field" aria-label="all ordered systems tend toward disorder">
		<canvas></canvas>
		<div class="field-text"><p>${esc(site.footer_quote)} — click to restore order</p><p>Julius Niemeyer · Installations, Flat Works, Art in Architecture</p></div>
	</section>
	<div class="filters" role="toolbar" aria-label="Filter">
		<button type="button" data-f="all" aria-pressed="true">All ${n}</button>
		${CATS.map((c) => `<button type="button" data-f="${c.key}" aria-pressed="false">${esc(c.title)} ${counts[c.key]}</button>`).join('\n\t\t')}
	</div>
	<div class="archive" data-gallery data-layout="none">
${figs}
	</div>
${statementAndCv}
	<p class="wordmark" aria-hidden="true">studioniemeyer</p>
</main>
${tail(js)}`;
}

/* ---------- overview ---------- */

function overview(projects) {
	const total = projects.flat().length;
	const card = (href, name, text) => `<a class="card" href="${href}"><span class="card-name">${name}</span><span class="card-text">${text}</span></a>`;
	const css = `
	main { padding-top: calc(var(--bar-h) + 1rem); }
	.cards { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--gutter); margin-top: 1.6rem; }
	.card { display: block; color: var(--text); border-top: 0.1rem solid var(--line); padding: 0.8rem 0 2rem; }
	.card:hover .card-name { color: #fff; text-decoration: underline; }
	.card-name { display: block; font-size: 1.6rem; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 0.6rem; }
	.card-text { display: block; color: var(--text-dim); }
	@media (max-width: 768px) { .cards { grid-template-columns: 1fr; } }`;
	return `${head('Varianten', css)}${header('Entwürfe')}
<main>
	<section class="intro cols">
		<h1 class="span-8">Varianten</h1>
		<div class="span-4"><p>Entwürfe mit den echten Inhalten (${total} Werke erkannt). Nichts davon ist live.</p></div>
	</section>
	<div class="cards">
		${card('index.html', 'Aktuell', 'Die Seite, wie sie jetzt ist – 1:1 wie bei Cargo.')}
		${card('variante-a.html', 'A · Werkindex', 'Wie jetzt, plus ein Werkverzeichnis als Tabelle (Jahr, Titel, Medium). Vorschau beim Überfahren, Klick springt zu den Bildern. Bildunterschriften und Zähler im Zoom, hellere Links.')}
		${card('variante-b.html', 'B · Projekte', 'Großes Startbild. Bilder nach Werken gruppiert: links Titel, Jahr und Text (bleibt beim Scrollen stehen), rechts die Bilder. Aktiver Bereich im Menü markiert.')}
		${card('variante-c.html', 'C · Archiv hell', 'Helle, archivische Gegenversion. Oben ein Vektorfeld, das langsam von Ordnung in Unordnung kippt (Klick ordnet es neu). Filter, nummerierte Abbildungen (fig. 01 …).')}
	</div>
</main>
${tail()}`;
}

(async () => {
	const img = await loadImages();
	const projects = CATS.map((c) => projectsOf(c, img));
	const write = (f, html) => fs.writeFileSync(path.join(OUT, f), html);
	write('variante-a.html', variantA(projects));
	write('variante-b.html', variantB(projects));
	write('variante-c.html', variantC(projects));
	write('varianten.html', overview(projects));
	projects.forEach((list, i) => console.log(CATS[i].title + ':', list.map((p) => `${p.title} (${p.images.length})`).join(', ')));
})();
