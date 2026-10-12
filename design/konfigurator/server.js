// Local-only server for the configurator: serves _site and saves the final choice.
//   node design/konfigurator/server.js   → http://127.0.0.1:4174/konfigurator.html
// POST /entscheidung writes design/konfigurator/entscheidung.json (+ .md summary).
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve('_site');
const OUT = path.join(__dirname, 'entscheidung');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.json': 'application/json' };

http
	.createServer((req, res) => {
		if (req.method === 'POST' && req.url === '/entscheidung') {
			let body = '';
			req.on('data', (c) => (body += c));
			req.on('end', () => {
				try {
					const data = JSON.parse(body);
					fs.writeFileSync(`${OUT}.json`, JSON.stringify(data, null, '\t') + '\n');
					const lines = data.entscheidungen.map((e) => `- **${e.titel}:** ${e.wahl}${e.orig ? '' : '  ← neu'}`);
					fs.writeFileSync(`${OUT}.md`, `# Feinschliff – Entscheidung vom ${data.datum}\n\n${lines.join('\n')}\n`);
					res.writeHead(200, { 'content-type': 'application/json' }).end('{"ok":true}');
					console.log(`Entscheidung gespeichert (${data.entscheidungen.filter((e) => !e.orig).length} Änderungen)`);
				} catch (err) {
					res.writeHead(400).end(String(err));
				}
			});
			return;
		}
		const url = decodeURIComponent(req.url.split('?')[0]);
		const file = path.join(ROOT, url.endsWith('/') ? url + 'index.html' : url);
		if (!file.startsWith(ROOT)) return res.writeHead(403).end();
		fs.readFile(file, (err, buf) => {
			if (err) return res.writeHead(404).end('not found');
			res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' }).end(buf);
		});
	})
	.listen(4174, '127.0.0.1', () => console.log('Konfigurator: http://127.0.0.1:4174/konfigurator.html'));
