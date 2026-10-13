// Build switches for the shop (deploy/RUNBOOK-SHOP-LIVE.md): node --test test/
// Every case builds in its own copy of the site (temp dir, node_modules linked), against a fake SPINE.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { execFile } = require('child_process');

const ROOT = path.join(__dirname, '..');
const example = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/available.json'), 'utf8'));

// remove the copies afterwards: unlink node_modules first, so rm never walks into the real one
const dirs = [];
test.after(() => {
	for (const dir of dirs) {
		fs.unlinkSync(path.join(dir, 'node_modules'));
		fs.rmSync(dir, { recursive: true, force: true });
	}
});

// copy of the site; checked = legal texts without draft flag and without [OFFEN …]
function site({ checked = false } = {}) {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jn-build-'));
	for (const f of ['build.js', 'content', 'images', 'assets', 'favicon.svg']) fs.cpSync(path.join(ROOT, f), path.join(dir, f), { recursive: true });
	fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(dir, 'node_modules'), 'junction');
	dirs.push(dir);
	if (checked) {
		const legalDir = path.join(dir, 'content/legal');
		for (const f of fs.readdirSync(legalDir)) {
			const p = JSON.parse(fs.readFileSync(path.join(legalDir, f), 'utf8'));
			delete p.entwurf;
			p.body = p.body.replace(/\[OFFEN[^\]]*\]/g, '');
			fs.writeFileSync(path.join(legalDir, f), JSON.stringify(p));
		}
	}
	return dir;
}

function build(dir, env) {
	const clean = { ...process.env };
	delete clean.SHOP_LIVE, delete clean.SHOP_PREVIEW, delete clean.SPINE_URL;
	return new Promise((resolve) => {
		execFile(process.execPath, ['build.js'], { cwd: dir, env: { ...clean, ...env } }, (err, stdout, stderr) =>
			resolve({ code: err ? err.code : 0, out: stdout + stderr }),
		);
	});
}

const page = (dir, name) => fs.readFileSync(path.join(dir, '_site', name), 'utf8');
const exists = (dir, name) => fs.existsSync(path.join(dir, '_site', name));

// fake SPINE: works with random ids (as on the server), fig per work, one work without fig
function fakeSpine(werke) {
	return new Promise((resolve) => {
		const server = http.createServer((req, res) => {
			res.setHeader('content-type', 'application/json');
			if (req.url === '/api/public/shop/juliusniemeyer') return res.end(JSON.stringify({ versand: example.versand, rahmen: example.rahmen, werke }));
			res.statusCode = 404;
			res.end('{}');
		});
		server.listen(0, '127.0.0.1', () => resolve({ server, url: `http://127.0.0.1:${server.address().port}` }));
	});
}
const spineWerke = [
	{ ...example.werke[0], id: 'k3j9x2' },
	{ ...example.werke[3], id: 'p8q1z7' },
	{ ...example.werke[1], id: 'nofig1', fig: null },
];

test('without switches: coming soon, no drafts, no withdrawal page', async () => {
	const dir = site();
	const r = await build(dir, {});
	assert.strictEqual(r.code, 0, r.out);
	assert.match(page(dir, 'available.html'), /Coming soon/);
	assert.ok(!exists(dir, 'agb.html') && !exists(dir, 'widerrufen.html'));
	assert.ok(exists(dir, 'danke.html') && exists(dir, 'abbruch.html'));
	assert.doesNotMatch(page(dir, 'index.html'), /widerrufen\.html/);
});

test('SHOP_PREVIEW without SPINE: example data, drafts, withdrawal by email', async () => {
	const dir = site();
	const r = await build(dir, { SHOP_PREVIEW: '1' });
	assert.strictEqual(r.code, 0, r.out);
	assert.match(page(dir, 'available.html'), /id="CGD-25\.01"/);
	assert.ok(exists(dir, 'agb.html'));
	assert.match(page(dir, 'widerrufen.html'), /"endpoint":""/);
	assert.match(page(dir, 'index.html'), /widerrufen\.html/);
});

test('SHOP_LIVE stops on legal drafts', async () => {
	const dir = site();
	const r = await build(dir, { SHOP_LIVE: '1', SPINE_URL: 'http://127.0.0.1:9' });
	assert.notStrictEqual(r.code, 0);
	assert.match(r.out, /legal texts are still drafts: agb, widerruf, versand/);
	assert.ok(!fs.existsSync(path.join(dir, '_site')));
});

test('SHOP_LIVE stops without SPINE_URL', async () => {
	const dir = site({ checked: true });
	const r = await build(dir, { SHOP_LIVE: '1' });
	assert.notStrictEqual(r.code, 0);
	assert.match(r.out, /needs SPINE_URL/);
});

test('SHOP_LIVE stops when SPINE is unreachable (no example data live)', async () => {
	const dir = site({ checked: true });
	const r = await build(dir, { SHOP_LIVE: '1', SPINE_URL: 'http://127.0.0.1:9' });
	assert.notStrictEqual(r.code, 0);
	assert.match(r.out, /SPINE not reachable/);
	assert.ok(!fs.existsSync(path.join(dir, '_site')));
});

test('SHOP_LIVE stops when SPINE sends no work with fig', async () => {
	const { server, url } = await fakeSpine([spineWerke[2]]);
	try {
		const dir = site({ checked: true });
		const r = await build(dir, { SHOP_LIVE: '1', SPINE_URL: url });
		assert.notStrictEqual(r.code, 0);
		assert.match(r.out, /no works with a fig/);
	} finally {
		server.close();
	}
});

test('SHOP_LIVE with SPINE: works by fig, legal texts, withdrawal to SPINE', async () => {
	const { server, url } = await fakeSpine(spineWerke);
	try {
		const dir = site({ checked: true });
		const r = await build(dir, { SHOP_LIVE: '1', SPINE_URL: `${url}/` });
		assert.strictEqual(r.code, 0, r.out);
		assert.match(r.out, /shop: 2 works from SPINE/);
		assert.match(r.out, /nofig1 has no fig/);
		const av = page(dir, 'available.html');
		assert.match(av, /id="CGD-25\.01"/);
		assert.match(av, /data-id="k3j9x2"/);
		assert.match(av, /data-id="p8q1z7"/);
		assert.doesNotMatch(av, /CGD-25\.16/); // example work not sent by SPINE
		assert.ok(['agb.html', 'widerruf.html', 'versand.html'].every((f) => exists(dir, f)));
		assert.ok(page(dir, 'widerrufen.html').includes(`"endpoint":"${url}/api/public/shop/juliusniemeyer/withdrawal"`));
		assert.match(page(dir, 'index.html'), /href="widerrufen\.html">Vertrag widerrufen/);
	} finally {
		server.close();
	}
});
