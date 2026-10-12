// Laborelemente — Prototypen, NOT part of the live site. Run after `npm run build`:
//   node design/elemente/build.js   → _site/elemente.html (real index.html + switch panel bottom right)
// Select ideas via the panel or the URL: elemente.html?an=1,3 (none given = all on).
const fs = require('fs');
const path = require('path');

const OUT = '_site';
const index = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');

const html = index
	.replace('</head>', '<link rel="stylesheet" href="elemente/style.css">\n<meta name="robots" content="noindex">\n</head>')
	.replace('<script src="assets/main.js" defer></script>', '<script src="assets/main.js" defer></script>\n<script src="elemente/runtime.js" defer></script>');
if (!html.includes('elemente/runtime.js')) throw new Error('main.js script tag not found in index.html');

fs.writeFileSync(path.join(OUT, 'elemente.html'), html);
fs.mkdirSync(path.join(OUT, 'elemente'), { recursive: true });
for (const f of ['runtime.js', 'style.css']) fs.copyFileSync(path.join(__dirname, f), path.join(OUT, 'elemente', f));
console.log('elemente → _site/elemente.html');
