// Feinschliff-Prototypen — NOT part of the live site. Run after `npm run build`:
//   node design/feinschliff.js   → _site/feinschliff.html (Umschalter) + _site/feinschliff-*.html
// Each variant is the real index.html plus a few subtle CSS/JS additions.
const fs = require('fs');
const path = require('path');

const OUT = '_site';
const base = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');

/* ---------- building blocks ---------- */

const licht = {
	css: `
::selection { background: #0000ff; color: #fff; }
a:not(.home) { transition: color 0.15s, text-decoration-color 0.15s; text-decoration: underline 1px transparent; text-underline-offset: 0.18em; }
a:not(.home):hover { color: #5a5aff; text-decoration-color: currentColor; }
.bar--top nav a.is-active { color: var(--text); }
.bar--top::after {
	content: ""; position: absolute; left: 0; bottom: -0.1rem; height: 0.1rem;
	width: calc(var(--progress, 0) * 100%); background: #0000ff;
}
.wordmark {
	color: rgba(255, 255, 255, 0.07);
	background: radial-gradient(ellipse 60% 70% at 50% 60%, rgba(70, 50, 255, 0.13), transparent 70%);
}`,
	js: `
document.addEventListener('DOMContentLoaded', () => {
	const bar = document.querySelector('.bar--top');
	const onScroll = () => {
		const max = document.documentElement.scrollHeight - innerHeight;
		bar.style.setProperty('--progress', max > 0 ? scrollY / max : 0);
	};
	addEventListener('scroll', onScroll, { passive: true });
	onScroll();
	const links = [...document.querySelectorAll('.bar--top nav a')];
	const targets = links.map((a) => document.getElementById(a.hash.slice(1))).filter(Boolean);
	const mark = () => {
		let cur = targets[0];
		for (const t of targets) if (t.getBoundingClientRect().top < innerHeight * 0.4) cur = t;
		links.forEach((a) => a.classList.toggle('is-active', a.hash === '#' + cur.id));
	};
	addEventListener('scroll', mark, { passive: true });
	mark();
});`,
};

const typo = {
	css: `
body { font-variant-numeric: tabular-nums; }
main { counter-reset: werk fig; }
.intro h1 {
	counter-increment: werk;
	font-family: var(--mono); font-size: 0.8rem; font-weight: 400;
	text-transform: uppercase; letter-spacing: 0.09em; color: var(--text-dim);
}
.intro h1::before { content: counter(werk, decimal-leading-zero) " / "; color: #0000ff; }
.intro .span-4, .statement p { line-height: 1.25; hyphens: auto; }
.statement-title { font-weight: 650 !important; }
.gallery figcaption { counter-increment: fig; }
.gallery figcaption::before {
	content: "fig. " counter(fig, decimal-leading-zero); display: block;
	margin-bottom: 0.35em; color: var(--text); letter-spacing: 0.04em;
}
.gallery figure:not(:has(figcaption))::after {
	counter-increment: fig; content: "fig. " counter(fig, decimal-leading-zero);
	display: block; margin: 0.5em 0 2em; font: 400 0.8rem/1.35 var(--mono); color: var(--text-dim);
}`,
	js: '',
};

const bewegung = {
	css: `
.gallery img { opacity: 0; transition: opacity 0.6s ease; }
.gallery img.is-in { opacity: 1; }
.gallery figure { transition: opacity 0.25s ease; }
@media (hover: hover) {
	.gallery:hover figure { opacity: 0.45; }
	.gallery:hover figure:hover { opacity: 1; }
}
.lightbox img { transition: opacity 0.25s ease; }
.lightbox img.is-loading { opacity: 0; }
.lightbox.open { animation: lb-in 0.25s ease; }
@keyframes lb-in { from { opacity: 0; } }
.lb-meta {
	position: absolute; left: 20px; right: 70px; bottom: 18px;
	display: flex; gap: 1.5rem; align-items: baseline;
	font: 400 0.8rem/1.35 var(--mono); color: var(--text-dim);
}
.lb-count { color: var(--text); white-space: nowrap; }
.lb-caption p { margin: 0; display: inline; }
.lb-caption p + p { display: none; }
@media (prefers-reduced-motion: reduce) {
	.gallery img, .gallery figure, .lightbox img { transition: none; }
	.lightbox.open { animation: none; }
}`,
	html: (s) =>
		s.replace(
			'<img alt="">',
			'<img alt="">\n\t<div class="lb-meta"><span class="lb-count"></span><span class="lb-caption"></span></div>'
		),
	js: `
document.addEventListener('DOMContentLoaded', () => {
	const io = new IntersectionObserver((es) => es.forEach((e) => {
		if (!e.isIntersecting) return;
		const img = e.target;
		const show = () => setTimeout(() => img.classList.add('is-in'), (img.closest('figure').dataset.i % 4) * 90);
		img.complete ? show() : img.addEventListener('load', show, { once: true });
		io.unobserve(img);
	}), { rootMargin: '0px 0px -5% 0px' });
	document.querySelectorAll('.gallery').forEach((g) =>
		[...g.children].forEach((f, i) => { f.dataset.i = i; io.observe(f.querySelector('img')); }));
	const lbImg = document.querySelector('.lightbox img');
	new MutationObserver(() => {
		if (!lbImg.getAttribute('src')) return;
		lbImg.classList.add('is-loading');
		lbImg.complete ? lbImg.classList.remove('is-loading') : lbImg.addEventListener('load', () => lbImg.classList.remove('is-loading'), { once: true });
	}).observe(lbImg, { attributes: true, attributeFilter: ['src'] });
});`,
};

const variants = [
	{ id: 'original', label: 'Original', note: 'So wie die Seite heute ist (mit neuer Scrollbar).', parts: [] },
	{ id: 'licht', label: '1 · Licht', note: 'Blaue Textauswahl, helleres Blau + Unterstrich beim Überfahren, aktiver Abschnitt weiß in der Leiste, blaue Fortschrittslinie unter der oberen Leiste, violettes Glimmen hinter der Wortmarke.', parts: [licht] },
	{ id: 'typo', label: '2 · Typografie', note: 'Werktitel in Mono-Versalien mit Nummer („01 / INSTALLATION“), fig.-Nummern an jedem Bild, Tabellenziffern, mehr Zeilenabstand in Intro und Statement.', parts: [typo] },
	{ id: 'bewegung', label: '3 · Bewegung', note: 'Bilder glimmen beim Scrollen nacheinander auf, Überfahren dunkelt die anderen Bilder der Reihe ab, Lightbox blendet weich und zeigt Zähler + Bildunterschrift.', parts: [bewegung] },
	{ id: 'alles', label: '4 · Alles', note: 'Alle drei zusammen.', parts: [licht, typo, bewegung] },
];

/* ---------- write variant pages ---------- */

for (const v of variants) {
	let html = base;
	for (const p of v.parts) if (p.html) html = p.html(html);
	const css = v.parts.map((p) => p.css).join('\n');
	const js = v.parts.map((p) => p.js).join('\n');
	html = html.replace('</head>', `<style>${css}</style>\n<script>${js}</script>\n<meta name="robots" content="noindex">\n</head>`);
	fs.writeFileSync(path.join(OUT, `feinschliff-${v.id}.html`), html);
}

/* ---------- switcher page ---------- */

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const switcher = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Feinschliff – Varianten</title>
<link rel="stylesheet" href="assets/style.css">
<style>
	html, body { height: 100%; overflow: hidden; }
	body { display: flex; flex-direction: column; font-size: 0.95rem; }
	.switch { display: flex; flex-wrap: wrap; gap: 0.4rem 1.6rem; align-items: baseline; padding: 0.7rem var(--side); border-bottom: 0.1rem solid #0000ff; }
	.switch b { font-weight: 650; }
	.switch button { font: inherit; background: none; border: 0; padding: 0; color: var(--link); cursor: pointer; }
	.switch button[aria-pressed="true"] { color: var(--text); text-decoration: underline 1px; text-underline-offset: 0.2em; }
	.note { flex-basis: 100%; font: 400 0.8rem/1.35 var(--mono); color: var(--text-dim); }
	iframe { flex: 1; width: 100%; border: 0; }
</style>
</head>
<body>
<div class="switch">
	<b>Feinschliff</b>
	${variants.map((v) => `<button data-id="${v.id}" data-note="${esc(v.note)}">${esc(v.label)}</button>`).join('\n\t')}
	<span class="note"></span>
</div>
<iframe title="Variante"></iframe>
<script>
	const frame = document.querySelector('iframe');
	const note = document.querySelector('.note');
	const btns = [...document.querySelectorAll('.switch button')];
	function pick(id) {
		const b = btns.find((x) => x.dataset.id === id) || btns[0];
		let y = 0;
		try { y = frame.contentWindow.scrollY || 0; } catch {}
		btns.forEach((x) => x.setAttribute('aria-pressed', x === b));
		note.textContent = b.dataset.note;
		frame.onload = () => frame.contentWindow.scrollTo(0, y);
		frame.src = 'feinschliff-' + b.dataset.id + '.html';
		history.replaceState(null, '', '#' + b.dataset.id);
	}
	btns.forEach((b) => b.addEventListener('click', () => pick(b.dataset.id)));
	addEventListener('keydown', (e) => {
		const n = +e.key;
		if (n >= 0 && n < btns.length) pick(btns[n].dataset.id);
	});
	pick(location.hash.slice(1) || 'original');
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(OUT, 'feinschliff.html'), switcher);
console.log('feinschliff: ' + variants.map((v) => v.id).join(', ') + ' → _site/feinschliff.html');
