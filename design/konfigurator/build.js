// Feinschliff-Konfigurator — NOT part of the live site. Run after `npm run build`:
//   node design/konfigurator/build.js   → _site/konfigurator.html + _site/konfigurator-vorschau.html
// Then `node design/konfigurator/server.js` (port 4174) so "So wird's gemacht" can save the choice.
const fs = require('fs');
const path = require('path');

const OUT = '_site';
const HERE = __dirname;
const index = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');

// Variables the options build on (--ink = text colour as r,g,b so light backgrounds can flip it)
const base = `
:root{--ink:255,255,255;--bg-rgb:17,17,17;--g:.5rem;--line:rgba(var(--ink),.4);--text:rgba(var(--ink),.85);--text-dim:rgba(var(--ink),.75)}
.gallery{column-gap:var(--g)}
.gallery img{background:rgba(var(--ink),.04)}
.wordmark{color:rgba(var(--ink),.06)}
.cfg-progress{display:none;position:absolute;left:0;bottom:-.1rem;height:.15rem;width:0;background:var(--link)}
.cfg-pct{display:none;font-family:var(--mono);font-size:.85em}
.cfg-cursor{display:none;position:fixed;left:0;top:0;z-index:300;pointer-events:none}
.lb-meta{display:none;position:absolute;left:20px;right:90px;bottom:18px;gap:1.6rem;align-items:baseline;font:400 .8rem/1.35 var(--mono);color:var(--text-dim);z-index:2}
.lb-count{color:var(--text);white-space:nowrap}
.lb-caption p{margin:0;display:inline}
.lb-caption p+p{display:none}
.lb-btn{z-index:2}
.cfg-hero--none{display:none}
.cfg-hero--wortmarke p{margin:0;padding:2.5rem 0 1.5rem;font-size:16.2vw;font-weight:650;line-height:.8;letter-spacing:-.055em;color:var(--text);white-space:nowrap}
.cfg-hero--satz p{margin:0;padding:24vh 0 22vh;font-size:6.4vw;font-weight:520;line-height:.95;letter-spacing:-.045em;color:var(--text);max-width:14ch}
.cfg-hero--bild{margin:0 calc(-1 * var(--side)) .8rem;height:calc(100vh - 2 * var(--bar-h));}
.cfg-hero--bild img{display:block;width:100%;height:100%;object-fit:cover}
`;

let html = index
	.replace('<img alt="">', '<img alt="">\n\t<div class="lb-meta"><span class="lb-count"></span><span class="lb-caption"></span></div>')
	.replace('</head>', `<style id="cfg-base">${base}</style>\n<style id="cfg"></style>\n<meta name="robots" content="noindex">\n</head>`)
	.replace('<script src="assets/main.js" defer></script>', '<script src="assets/main.js" defer></script>\n<script src="konfigurator/runtime.js" defer></script>');
if (!html.includes('konfigurator/runtime.js')) throw new Error('main.js script tag not found in index.html');

fs.writeFileSync(path.join(OUT, 'konfigurator-vorschau.html'), html);
fs.mkdirSync(path.join(OUT, 'konfigurator'), { recursive: true });
for (const f of ['runtime.js', 'optionen.js']) fs.copyFileSync(path.join(HERE, f), path.join(OUT, 'konfigurator', f));
fs.copyFileSync(path.join(HERE, 'ui.html'), path.join(OUT, 'konfigurator.html'));
console.log('konfigurator → _site/konfigurator.html');
