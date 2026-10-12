// "Available" (shop) prototype — NOT part of the live site. Run after `npm run build`:
//   node design/available/build.js   → _site/available.html
// Uses the real header/footer/styles of index.html and example data (beispiel.json, later from SPINE).
const fs = require('fs');
const path = require('path');

const OUT = '_site';
const index = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'beispiel.json'), 'utf8'));
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// images by fig. number, taken from the real gallery
const images = {};
for (const m of index.matchAll(/<figure data-fig="([^"]+)"([^>]*)>\s*<img src="([^"]+)" data-full="([^"]+)" width="(\d+)" height="(\d+)"/g)) {
	images[m[1]] = { light: m[2].includes('on-light'), small: m[3], big: m[4], w: +m[5], h: +m[6] };
}

const euro = (n) => `${n.toLocaleString('de-DE')} €`;

function item(w) {
	const im = images[w.fig];
	if (!im) throw new Error(`no image for ${w.fig}`);
	const meta = `<p class="av-title">${esc(w.titel)} (${w.jahr})</p><p>${esc(w.technik)}<br>${esc(w.masse)}</p>`;
	const fig = `<figure data-fig="${w.fig}"${im.light ? ' class="on-light"' : ''}><img src="${im.small}" data-full="${im.big}" width="${im.w}" height="${im.h}" alt="${esc(w.titel)}" loading="lazy" decoding="async"></figure>`;
	if (w.art === 'unikat') {
		return `<article class="av-item av-unikat" data-id="${w.id}">${fig}<div class="av-info">${meta}
			<p class="av-price">unique work · price on request</p>
			${w.gerahmt ? '<p class="av-frame-incl">framed · frame included</p>' : ''}
			<p><button type="button" class="av-ask">Request</button></p></div></article>`;
	}
	return `<article class="av-item av-edition" data-id="${w.id}">${fig}<div class="av-info">${meta}
		<p class="av-price"></p>
		<p class="av-cap"${w.capitalistic ? '' : ' hidden'}>capitalistic selling — the price doubles with every copy sold</p>
		<p class="av-label">choose your number</p>
		<div class="av-numbers" role="group" aria-label="edition numbers"></div>
		<div class="av-frames" role="radiogroup" aria-label="frame"></div>
		<p class="av-ship"></p>
		<p><button type="button" class="av-buy" disabled>Choose a number</button></p></div></article>`;
}

const editions = data.werke.filter((w) => w.art === 'edition');
const unikate = data.werke.filter((w) => w.art === 'unikat');

const main = `<main id="top" class="available">

	<section class="intro cols">
		<h1 class="span-8">Available</h1>
		<div class="span-4">
			<p>Works currently available. <em>Editions</em> can be bought directly within the EU — choose the number you want.
			<em>Unique works</em> on request: you receive a PDF dossier for each work by email. Shipping outside the EU on request.</p>
			<p class="av-note">Prices incl. VAT, plus shipping. In Munich: delivery or pickup by appointment. Prototype with example data — nothing is sold here.</p>
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

<div class="av-dialog" hidden role="dialog" aria-modal="true" aria-label="Request"><div class="av-box"></div></div>
<script type="application/json" id="av-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

let html = index
	.replace(/<main id="top">[\s\S]*<\/main>/, main)
	.replace('<title>Studioniemeyer - Julius Niemeyer</title>', '<title>Available - Julius Niemeyer</title>')
	.replace('</head>', '<link rel="stylesheet" href="available/available.css">\n<meta name="robots" content="noindex">\n</head>')
	.replace('<script src="assets/labor.js" defer></script>', '<script src="assets/labor.js" defer></script>\n<script src="available/available.js" defer></script>')
	// "Available" set apart from the works: own column in the top bar
	.replace('<div class="span-8"><a href="./#top" class="home">juliusniemeyer</a>', `<div class="span-6"><a href="./#top" class="home">juliusniemeyer</a>`)
	.replace(/(<div class="span-6"><a href="\.\/#top" class="home">juliusniemeyer<\/a>.*?<\/div>)/, `$1
		<div class="span-2"><a href="available.html" class="nav-available is-here">Available</a></div>`)
	.replace('<div><a href="./#top" class="home">juliusniemeyer</a>', `<div><a href="./#top" class="home">juliusniemeyer</a> <a href="available.html" class="nav-available is-here">Available</a>`);
if (!html.includes('available/available.js')) throw new Error('labor.js script tag not found');

fs.writeFileSync(path.join(OUT, 'available.html'), html);
fs.mkdirSync(path.join(OUT, 'available'), { recursive: true });
for (const f of ['available.js', 'available.css']) fs.copyFileSync(path.join(__dirname, f), path.join(OUT, 'available', f));
console.log(`available → _site/available.html (${editions.length} editions, ${unikate.length} unique works)`);
