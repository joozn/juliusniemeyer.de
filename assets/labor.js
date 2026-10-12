// Laborelemente: the page as a small experimental setup (index page only).
//   1 · Zerfall – disorder grows with the days since the last change (S = 1 − e^(−Δt/τ), τ = 30 d)
//   2 · Beobachtereffekt – images draw back from a moving cursor, lean in when it rests (like skia)
//   3 · Messinstrument – crosshair lines and a readout: position, fig., scroll speed, time
//   4 · Geiger – sparks on the screen with counter clicks (sound asked on the first visit, switch in the footer)
//   5 · Feld – one of three experiments at the end of the page, chosen at random on every load
(() => {
	'use strict';
	const root = document.documentElement;
	const $ = (s, el = document) => el.querySelector(s);
	const $$ = (s, el = document) => [...el.querySelectorAll(s)];
	const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
	const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
	const figures = $$('.gallery figure');
	const imgs = figures.map((f) => $('img', f));

	// seeded random, so a given day always looks the same
	const rng = (seed) => () => {
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};

	/* ---------- 1 · Zerfall ---------- */

	const [sd, sm, sy] = ($('.bar--top .right')?.textContent.match(/\d+/g) || []).map(Number);
	const stand = new Date(2000 + sy, sm - 1, sd);
	let days = isNaN(stand) ? 0 : Math.max(0, Math.floor((Date.now() - stand) / 864e5));
	const credit = $('.bar--bottom .desktop-only .right');
	const wm = $('.wordmark');
	let wmCanvas;

	// a line as SVG: damped random walk (wanders like a signal), with gaps that open as e grows
	function line(len, e, seed, vertical, { T = 6, mid = vertical ? 1 : 4.5, width = 1.4, color = 'white' } = {}) {
		const r = rng(seed);
		let d = '';
		let pen = false;
		let gap = 0;
		let drift = 0;
		for (let p = 0; p <= len; p += 3) {
			drift = drift * 0.82 + (r() - 0.5) * e * 1.4;
			if (gap > 0 || r() < e * e * 0.025) {
				if (gap <= 0) gap = 3 + r() * e * 36;
				gap -= 3;
				pen = false;
				continue;
			}
			const spike = r() < e * 0.01 ? (r() - 0.5) * 5 : 0;
			const j = Math.max(0.6, Math.min(T - 0.6, mid + drift + spike));
			d += `${pen ? 'L' : 'M'}${vertical ? `${j.toFixed(1)} ${p}` : `${p} ${j.toFixed(1)}`}`;
			pen = true;
		}
		const [w, h] = vertical ? [T, len] : [len, T];
		const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><path d='${d}' fill='none' stroke='${color}' stroke-width='${width}' stroke-linejoin='round'/></svg>`;
		return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
	}

	// the thick accent line breaks into shards that shift and turn; short shards move more
	function shards(len, e, seed, thick, color) {
		const r = rng(seed);
		const M = Math.round(6 + e * 36); // room above and below for the shards
		let rects = '';
		let x = 0;
		while (x < len) {
			const piece = e < 0.02 ? len : Math.max(6, Math.min(len - x, (40 + r() * 260) * (1.15 - e)));
			const k = e * Math.min(1, 60 / piece + 0.3);
			const maxRot = (Math.atan((M * 0.8) / (piece / 2)) * 180) / Math.PI;
			const rot = (r() - 0.5) * 2 * Math.min(k * 14, maxRot);
			const cx = x + piece / 2 + (r() - 0.5) * k * 16;
			const cy = M + thick / 2 + (r() - 0.5) * k * M * 1.6;
			rects += `<rect x='${(-piece / 2).toFixed(1)}' y='${-thick / 2}' width='${piece.toFixed(1)}' height='${thick}' transform='translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot.toFixed(2)})'/>`;
			x += piece + (e < 0.02 ? 0 : r() * e * 14);
		}
		const H = thick + 2 * M;
		const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${len}' height='${H}'><g fill='${color}'>${rects}</g></svg>`;
		return { img: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`, top: thick + M, H };
	}

	function lines(e) {
		const set = (el, img, pos, size) =>
			Object.assign(el.style, { backgroundImage: img, backgroundPosition: pos, backgroundSize: size, backgroundRepeat: 'no-repeat', backgroundOrigin: 'border-box' });
		$$('.bar--top').forEach((el, i) => set(el, line(el.offsetWidth, e, 11 + i + days, false), 'left bottom', `${el.offsetWidth}px 6px`));
		$$('.bar--bottom').forEach((el, i) => set(el, line(el.offsetWidth, e, 21 + i + days, false), 'left -3px', `${el.offsetWidth}px 6px`));
		// intro: thick accent line on top, hairline at the bottom
		const thick = parseFloat(getComputedStyle($('.intro') || document.body).borderTopWidth) || 6;
		const accent = getComputedStyle(root).getPropertyValue('--link').trim() || '#0000ff';
		$$('.intro').forEach((el, i) => {
			const w = el.offsetWidth;
			const sh = shards(w, e, 61 + i * 7 + days, thick, accent);
			el.style.setProperty('--shard', sh.img);
			el.style.setProperty('--shard-top', `${sh.top}px`);
			el.style.setProperty('--shard-h', `${sh.H}px`);
			set(el, line(w, e, 31 + i * 7 + days, false), 'left calc(100% + 3px)', `${w}px 6px`);
		});
		$$('.gallery figcaption').forEach((el, i) => {
			const w = el.offsetWidth;
			const h = el.offsetHeight;
			set(el, `${line(w, e, 100 + i * 13 + days, false)}, ${line(h, e, 5000 + i * 17 + days, true)}`, 'left calc(100% + 3px), left top', `${w}px 6px, 6px ${h}px`);
		});
	}

	const GLYPHS = '0123456789ABCDEFX#/';
	function figs(e) {
		figures.forEach((f, i) => {
			if (!f.dataset.fig) return;
			const r = rng(i * 7919 + days);
			f.dataset.figZ = f.dataset.fig.replace(/[A-Z0-9]/g, (c) => (r() < e * 0.16 ? GLYPHS[Math.floor(r() * GLYPHS.length)] : c));
			f.style.setProperty('--fx', `${((r() - 0.5) * e * 14).toFixed(1)}px`);
			f.style.setProperty('--fy', `${((r() - 0.5) * e * 8).toFixed(1)}px`);
		});
	}

	// wordmark: drawn into an offscreen canvas, then copied block by block; decayed blocks fall and fade
	function wordmark(e) {
		if (!wm) return;
		if (!wmCanvas) {
			wmCanvas = document.createElement('canvas');
			wmCanvas.className = 'wm-canvas';
			wmCanvas.setAttribute('aria-hidden', 'true');
			document.body.appendChild(wmCanvas);
		}
		const cs = getComputedStyle(wm);
		const fs = parseFloat(cs.fontSize);
		const rect = wm.getBoundingClientRect();
		const W = Math.round(rect.width);
		const H = Math.round(rect.height) + 140;
		const dpr = devicePixelRatio || 1;
		Object.assign(wmCanvas.style, { left: `${rect.left + scrollX}px`, top: `${rect.top + scrollY}px`, width: `${W}px`, height: `${H}px` });

		const off = document.createElement('canvas');
		off.width = W * dpr;
		off.height = H * dpr;
		const o = off.getContext('2d');
		o.scale(dpr, dpr);
		o.font = `650 ${fs}px Geist`;
		o.letterSpacing = `${-0.022 * fs}px`;
		const m = o.measureText(wm.textContent);
		const base = parseFloat(cs.paddingTop) + (0.75 * fs - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
		o.fillStyle = '#fff';
		o.fillText(wm.textContent, parseFloat(cs.paddingLeft), base);

		wmCanvas.width = off.width;
		wmCanvas.height = off.height;
		const c = wmCanvas.getContext('2d');
		const data = o.getImageData(0, 0, off.width, off.height).data;
		const B = Math.round(4 * dpr);
		c.drawImage(off, 0, 0);
		const r = rng(days + 999);
		for (let y = 0; y < off.height; y += B) {
			for (let x = 0; x < off.width; x += B) {
				const cx = Math.min(off.width - 1, x + (B >> 1));
				const cy = Math.min(off.height - 1, y + (B >> 1));
				if (data[(cy * off.width + cx) * 4 + 3] < 20) continue;
				const p = e * (0.15 + 0.85 * (x / off.width)); // order on the left, disorder to the right
				if (r() >= p) continue;
				c.clearRect(x, y, B, B);
				if (r() < 0.25 * e) continue; // gone
				c.globalAlpha = 1 - r() * e * 0.7;
				c.drawImage(off, x, y, B, B, x + (r() - 0.5) * e * 18 * dpr, y + r() ** 2 * e * 110 * dpr, B, B);
				c.globalAlpha = 1;
			}
		}
		root.classList.add('wm-drawn');
	}

	function zerfall() {
		const e = 1 - Math.exp(-days / 30);
		lines(e);
		figs(e);
		document.fonts.ready.then(() => wordmark(e));
		if (credit) credit.textContent = `Δt ${days} d · S = ${e.toFixed(2).replace('.', ',')}`;
	}
	root.classList.add('zerfall');
	zerfall();
	// re-render when the page reflows (resize, gallery layout)
	let reflow;
	new ResizeObserver(() => {
		clearTimeout(reflow);
		reflow = setTimeout(zerfall, 250);
	}).observe($('main'));

	// for design/elemente: simulate other days
	window.labor = {
		days: () => days,
		setDays(n) {
			days = n;
			zerfall();
		},
	};

	/* ---------- 5 · Feld am Seitenende: on every load one of three experiments ---------- */

	const sec = $('.feld');
	const BG = getComputedStyle(root).getPropertyValue('--bg').trim() || '#0a0b1d';
	let W = 0;
	let H = 0;
	let ctx;
	let mouse = { x: -1e4, y: -1e4 };

	const FELDER = {
		// flow: laminar on the left, turbulent on the right
		stroemung: (() => {
			let ps;
			let t0;
			const spawn = (p, anywhere) => {
				p.x = anywhere ? Math.random() * W : -Math.random() * 40;
				p.y = Math.random() * H;
				p.px = p.x;
				p.py = p.y;
			};
			return {
				setup(now) {
					t0 = now;
					ps = Array.from({ length: Math.min(1400, Math.round((W * H) / 300)) }, () => {
						const p = {};
						spawn(p, true);
						return p;
					});
					ctx.fillStyle = BG;
					ctx.fillRect(0, 0, W, H);
				},
				step(now, dt) {
					const t = now - t0;
					ctx.fillStyle = BG;
					ctx.globalAlpha = 0.07;
					ctx.fillRect(0, 0, W, H);
					ctx.globalAlpha = 1;
					ctx.strokeStyle = 'rgba(255,255,255,0.55)';
					ctx.lineWidth = 1;
					ctx.beginPath();
					const k = Math.min(dt, 50) / 16;
					for (const p of ps) {
						const turb = Math.max(0, (p.x / W - 0.25) / 0.75) ** 1.6; // 0 left … 1 right
						const n = Math.sin(p.x * 0.011 + t * 0.0005) + Math.sin(p.y * 0.017 - t * 0.0004) + Math.sin((p.x + p.y) * 0.007 + t * 0.0003) * 1.5;
						const a = n * turb * 1.6;
						let vx = Math.cos(a) * 1.6 + 0.5;
						let vy = Math.sin(a) * 1.6;
						const dx = p.x - mouse.x;
						const dy = p.y - mouse.y;
						const d = Math.hypot(dx, dy);
						if (d < 90) {
							vx += (dx / d) * (90 - d) * 0.06;
							vy += (dy / d) * (90 - d) * 0.06;
						}
						p.px = p.x;
						p.py = p.y;
						p.x += vx * k;
						p.y += vy * k;
						if (p.x > W || p.y < 0 || p.y > H) spawn(p, false);
						else {
							ctx.moveTo(p.px, p.py);
							ctx.lineTo(p.x, p.y);
						}
					}
					ctx.stroke();
					return 'laminar → turbulent — the cursor is an obstacle';
				},
			};
		})(),

		// gas expanding from a compartment: the textbook picture of the second law
		diffusion: (() => {
			let ps;
			let t0;
			const BINS = 12;
			return {
				setup(now) {
					t0 = now;
					ps = [];
					const w = W * 0.18;
					const step = Math.sqrt((w * H) / Math.min(1100, (W * H) / 400));
					for (let y = step / 2; y < H; y += step) for (let x = step / 2; x < w; x += step) ps.push({ x, y, vx: 0, vy: 0 });
				},
				step(now, dt) {
					const open = now - t0 > 1500;
					const wall = W * 0.18;
					const k = Math.min(dt, 50) / 16;
					ctx.clearRect(0, 0, W, H);
					const hist = new Array(BINS).fill(0);
					ctx.fillStyle = 'rgba(255,255,255,0.8)';
					for (const p of ps) {
						if (now - t0 > 600) {
							p.vx = p.vx * 0.96 + (Math.random() - 0.5) * 0.5;
							p.vy = p.vy * 0.96 + (Math.random() - 0.5) * 0.5;
						}
						const dx = p.x - mouse.x;
						const dy = p.y - mouse.y;
						const d = Math.hypot(dx, dy);
						if (d < 70) {
							p.vx += (dx / d) * 0.4;
							p.vy += (dy / d) * 0.4;
						}
						p.x += p.vx * k;
						p.y += p.vy * k;
						const right = open ? W : wall;
						if (p.x < 1) (p.x = 1), (p.vx = Math.abs(p.vx));
						if (p.x > right - 1) (p.x = right - 1), (p.vx = -Math.abs(p.vx));
						if (p.y < 1) (p.y = 1), (p.vy = Math.abs(p.vy));
						if (p.y > H - 1) (p.y = H - 1), (p.vy = -Math.abs(p.vy));
						hist[Math.min(BINS - 1, Math.floor((p.x / W) * BINS))]++;
						ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
					}
					if (!open) {
						ctx.fillStyle = '#fff';
						ctx.fillRect(wall, 0, 1, H);
					}
					const S = -hist.reduce((s, n) => (n ? s + (n / ps.length) * Math.log(n / ps.length) : s), 0) / Math.log(BINS);
					return `S = ${S.toFixed(2)} — ${open ? 'the wall is open' : 'wall closed'} · click to restore order`;
				},
			};
		})(),

		// half-life: every point decays at random, half of them every 8 s
		halbwertszeit: (() => {
			const STEP = 14;
			const HALF = 8000;
			let cells;
			let flashes;
			return {
				setup() {
					cells = [];
					flashes = [];
					for (let y = STEP / 2; y < H; y += STEP) for (let x = STEP / 2; x < W; x += STEP) cells.push({ x, y, alive: true });
				},
				step(now, dt) {
					const p = 1 - 2 ** (-Math.min(dt, 100) / HALF);
					ctx.clearRect(0, 0, W, H);
					let n = 0;
					ctx.fillStyle = 'rgba(255,255,255,0.12)';
					for (const c of cells) {
						if (c.alive && Math.random() < p) {
							c.alive = false;
							flashes.push({ x: c.x, y: c.y, t: now });
						}
						if (!c.alive) ctx.fillRect(c.x - 0.5, c.y - 0.5, 1, 1);
					}
					ctx.fillStyle = 'rgba(255,255,255,0.85)';
					for (const c of cells) if (c.alive) n++, ctx.fillRect(c.x - 1, c.y - 1, 2, 2);
					flashes = flashes.filter((f) => now - f.t < 300);
					for (const f of flashes) {
						ctx.fillStyle = `rgba(255,255,255,${1 - (now - f.t) / 300})`;
						ctx.fillRect(f.x - 2.5, f.y - 2.5, 5, 5);
					}
					if (n < cells.length * 0.01) this.setup(now);
					return `N = ${n} / ${cells.length} · T½ = 8 s — click to start again`;
				},
			};
		})(),
	};

	if (sec) {
		sec.hidden = false;
		const cv = $('canvas', sec);
		const label = $('p', sec);
		ctx = cv.getContext('2d');
		let feld;
		let visible = false;
		let raf = 0;
		let last = 0;
		let lastW = 0;
		const size = () => {
			const dpr = devicePixelRatio || 1;
			W = cv.clientWidth;
			H = cv.clientHeight;
			lastW = W;
			cv.width = W * dpr;
			cv.height = H * dpr;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		};
		const loop = (now) => {
			label.textContent = feld.step(now, last ? now - last : 16);
			last = now;
			raf = visible ? requestAnimationFrame(loop) : 0;
		};
		const kick = () => {
			if (!raf && !still) (last = 0), (raf = requestAnimationFrame(loop));
		};
		const use = (id) => {
			feld = FELDER[id];
			sec.dataset.feld = id;
			size();
			feld.setup(performance.now());
			label.textContent = feld.step(performance.now(), 16);
			kick();
		};
		new IntersectionObserver(([e]) => {
			visible = e.isIntersecting;
			if (visible) kick();
		}).observe(sec);
		cv.addEventListener('pointermove', (e) => {
			const r = cv.getBoundingClientRect();
			mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
		});
		cv.addEventListener('pointerleave', () => (mouse = { x: -1e4, y: -1e4 }));
		cv.addEventListener('click', () => feld.setup(performance.now()));
		addEventListener('resize', () => {
			if (cv.clientWidth === lastW) return; // mobile URL bar changes the height only
			size();
			feld.setup(performance.now());
		});
		const ids = Object.keys(FELDER);
		use(ids[Math.floor(Math.random() * ids.length)]);
		window.labor.feld = use; // for design/elemente
	}

	/* ---------- 4 · Geiger: sparks anywhere on the screen like radiation hitting film (Bikini Atoll footage),
	   each with a Geiger counter click. Poisson-distributed, about one per second. ---------- */

	const RATE = 1; // pulses per second

	// sound: asked once on entering (the answer is the click browsers need before playing audio), switch in the footer
	const TON_KEY = 'ton';
	const stored = (() => {
		try {
			return localStorage.getItem(TON_KEY);
		} catch {
			return null;
		}
	})();
	let soundOn = stored === 'an';
	let audio = null;
	let clicks = [];
	function unlock() {
		if (!audio) {
			const AC = window.AudioContext || window.webkitAudioContext;
			if (!AC) return;
			audio = new AC();
			// a few slightly different clicks: noise impulse with a very short decay plus a faint metallic ring
			const sr = audio.sampleRate;
			clicks = Array.from({ length: 6 }, () => {
				const buf = audio.createBuffer(1, Math.ceil(sr * 0.025), sr);
				const d = buf.getChannelData(0);
				const decay = sr * (0.0008 + Math.random() * 0.0012);
				const ring = 2800 + Math.random() * 1800;
				for (let i = 0; i < d.length; i++) {
					d[i] = ((Math.random() * 2 - 1) * 0.9 + Math.sin((2 * Math.PI * ring * i) / sr) * 0.35 * Math.exp(-i / (sr * 0.004))) * Math.exp(-i / decay);
				}
				return buf;
			});
		}
		if (audio.state === 'suspended') audio.resume();
	}
	function knack() {
		if (!soundOn || !audio || audio.state !== 'running') return;
		const src = audio.createBufferSource();
		src.buffer = clicks[Math.floor(Math.random() * clicks.length)];
		const hp = audio.createBiquadFilter();
		hp.type = 'highpass';
		hp.frequency.value = 900;
		const gain = audio.createGain();
		gain.gain.value = 0.18 + Math.random() * 0.17;
		src.connect(hp).connect(gain).connect(audio.destination);
		src.start();
	}

	const tonButtons = [];
	function setSound(on) {
		soundOn = on;
		try {
			localStorage.setItem(TON_KEY, on ? 'an' : 'aus');
		} catch {}
		if (on) unlock();
		tonButtons.forEach((b) => {
			b.textContent = `Sound: ${on ? 'on' : 'off'}`;
			b.setAttribute('aria-pressed', String(on));
		});
	}
	// switch in the footer (desktop and mobile)
	[$('.bar--bottom .desktop-only .span-8'), $('.bar--bottom .mobile-only > div')].forEach((cell) => {
		if (!cell) return;
		const b = document.createElement('button');
		b.type = 'button';
		b.className = 'ton';
		b.addEventListener('click', () => setSound(!soundOn));
		const prev = cell.querySelector('a:last-of-type');
		if (cell.classList.contains('span-8') && prev) prev.textContent += ','; // commas sit inside the links
		cell.append(' ', b);
		tonButtons.push(b);
	});
	setSound(soundOn);
	if (stored === 'an') ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => addEventListener(ev, unlock, { once: true, passive: true }));

	// question on the first visit
	if (stored === null) {
		const ask = document.createElement('div');
		ask.className = 'ton-frage';
		ask.setAttribute('role', 'dialog');
		ask.setAttribute('aria-label', 'Sound');
		ask.innerHTML =
			'<div class="ton-box"><p>This page measures decay.<br>Geiger counter clicks — with sound?</p>' +
			'<p><button type="button" data-on="1">Sound on</button> <button type="button" data-on="0">Sound off</button></p></div>';
		ask.addEventListener('click', (e) => {
			const b = e.target.closest('button');
			if (!b) return;
			setSound(b.dataset.on === '1');
			ask.remove();
		});
		document.body.appendChild(ask);
		$('button', ask).focus({ preventScroll: true });
	}

	// sparks
	const sparks = document.createElement('canvas');
	sparks.className = 'funken';
	sparks.setAttribute('aria-hidden', 'true');
	document.body.appendChild(sparks);
	const sc = sparks.getContext('2d');
	let hits = [];
	let sparkRaf = 0;
	let flash = 0;
	const sizeSparks = () => {
		const dpr = devicePixelRatio || 1;
		sparks.width = innerWidth * dpr;
		sparks.height = innerHeight * dpr;
		sc.setTransform(dpr, 0, 0, dpr, 0, 0);
	};
	sizeSparks();
	addEventListener('resize', sizeSparks);

	function hit(born = performance.now()) {
		const x = Math.random() * innerWidth;
		const y = Math.random() * innerHeight;
		const kind = Math.random();
		if (kind < 0.55) hits.push({ born, x, y, type: 'speck', r: 0.7 + Math.random() * 1.6 });
		else if (kind < 0.75) {
			const n = 2 + Math.floor(Math.random() * 4);
			for (let i = 0; i < n; i++) hits.push({ born: born + i * 16, x: x + (Math.random() - 0.5) * 16, y: y + (Math.random() - 0.5) * 16, type: 'speck', r: 0.5 + Math.random() * 1.1 });
		} else if (kind < 0.95) {
			hits.push({ born, x, y, type: 'track', a: Math.random() * Math.PI * 2, l: 8 + Math.random() ** 2 * 70, bend: (Math.random() - 0.5) * 0.6, w: 0.8 + Math.random() });
		} else hits.push({ born, x, y, type: 'bloom', r: 5 + Math.random() * 9 });
		if (Math.random() < 0.04) flash = 1; // rarely the whole frame flickers
		if (!sparkRaf) sparkRaf = requestAnimationFrame(drawSparks);
	}
	function drawSparks(now) {
		sc.clearRect(0, 0, innerWidth, innerHeight);
		if (flash > 0.01) {
			sc.fillStyle = `rgba(255,255,255,${0.035 * flash})`;
			sc.fillRect(0, 0, innerWidth, innerHeight);
			flash *= 0.5;
		}
		hits = hits.filter((h) => now - h.born < 260);
		for (const h of hits) {
			const t = now - h.born;
			if (t < 0) continue;
			sc.globalAlpha = t < 50 ? 1 : Math.exp(-(t - 50) / 55); // one bright frame, then afterglow
			sc.shadowColor = '#fff';
			sc.fillStyle = sc.strokeStyle = '#fff';
			if (h.type === 'speck') {
				sc.shadowBlur = 6;
				sc.beginPath();
				sc.arc(h.x, h.y, h.r, 0, Math.PI * 2);
				sc.fill();
			} else if (h.type === 'track') {
				sc.shadowBlur = 4;
				sc.lineWidth = h.w;
				sc.lineCap = 'round';
				sc.beginPath();
				sc.moveTo(h.x, h.y);
				sc.quadraticCurveTo(h.x + Math.cos(h.a + h.bend) * h.l * 0.5, h.y + Math.sin(h.a + h.bend) * h.l * 0.5, h.x + Math.cos(h.a) * h.l, h.y + Math.sin(h.a) * h.l);
				sc.stroke();
			} else {
				const g = sc.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.r);
				g.addColorStop(0, 'rgba(255,255,255,1)');
				g.addColorStop(0.25, 'rgba(255,255,255,0.7)');
				g.addColorStop(1, 'rgba(255,255,255,0)');
				sc.shadowBlur = 0;
				sc.fillStyle = g;
				sc.fillRect(h.x - h.r, h.y - h.r, h.r * 2, h.r * 2);
			}
		}
		sc.globalAlpha = 1;
		sparkRaf = hits.length || flash > 0.01 ? requestAnimationFrame(drawSparks) : 0;
	}

	function pulse() {
		if (!still) hit();
		knack();
	}
	(function schedule() {
		setTimeout(() => {
			if (!document.hidden) {
				pulse();
				// sometimes a shower: one to three more within a moment
				if (Math.random() < 0.15) for (let i = 1 + Math.floor(Math.random() * 3); i > 0; i--) setTimeout(pulse, 30 + Math.random() * 180);
			}
			schedule();
		}, (-Math.log(1 - Math.random()) / RATE) * 1000);
	})();
	window.labor.pulse = pulse; // for design/elemente

	if (!finePointer) return;

	/* ---------- 2 · Beobachtereffekt ---------- */

	if (!still) {
		let rest;
		let mx = -1e4;
		let my = -1e4;
		const apply = (towards) =>
			imgs.forEach((img) => {
				const r = img.getBoundingClientRect();
				if (r.bottom < 0 || r.top > innerHeight) return;
				const dx = r.left + r.width / 2 - mx;
				const dy = r.top + r.height / 2 - my;
				const d = Math.hypot(dx, dy) || 1;
				const k = Math.max(0, 1 - d / (Math.max(r.width, r.height) * 0.8 + 140));
				if (!k) return (img.style.transform = '');
				img.style.transform = towards
					? `translate(${((-dx / d) * k * 9).toFixed(1)}px, ${((-dy / d) * k * 9).toFixed(1)}px) scale(${1 + k * 0.015})`
					: `translate(${((dx / d) * k * 22).toFixed(1)}px, ${((dy / d) * k * 22).toFixed(1)}px) scale(${1 - k * 0.035})`;
			});
		addEventListener(
			'pointermove',
			(e) => {
				mx = e.clientX;
				my = e.clientY;
				apply(false);
				clearTimeout(rest);
				rest = setTimeout(() => apply(true), 1100);
			},
			{ passive: true }
		);
	}

	/* ---------- 3 · Messinstrument ---------- */

	const box = document.createElement('div');
	box.className = 'mess';
	box.setAttribute('aria-hidden', 'true');
	box.innerHTML = '<div class="h"></div><div class="v"></div><div class="out"></div>';
	document.body.appendChild(box);
	const [h, v, out] = box.children;
	let mx = -100;
	let my = -100;
	let speed = 0;
	let lastY = scrollY;
	let lastT = performance.now();
	const t0 = lastT;
	const pad = (n, l) => String(Math.max(0, Math.round(n))).padStart(l, '0');
	addEventListener('pointermove', (e) => ((mx = e.clientX), (my = e.clientY)), { passive: true });
	(function frame(now) {
		const dt = Math.max(1, now - lastT);
		speed = speed * 0.9 + (0.1 * Math.abs(scrollY - lastY) * 1000) / dt;
		lastY = scrollY;
		lastT = now;
		h.style.transform = `translateY(${my}px)`;
		v.style.transform = `translateX(${mx}px)`;
		const under = document.elementFromPoint(mx, my)?.closest('figure[data-fig]');
		const s = (now - t0) / 1000;
		out.textContent =
			`x ${pad(mx, 4)}   y ${pad(my + scrollY, 5)}\n` +
			`${under ? `fig. ${under.dataset.fig}` : 'fig. ———'}\n` +
			`v ${pad(speed, 4)} px/s\n` +
			`t ${pad(Math.floor(s / 60), 2)}:${(s % 60).toFixed(2).padStart(5, '0')}`;
		requestAnimationFrame(frame);
	})(lastT);
})();
