// Läuft in der Vorschau (konfigurator-vorschau.html). Der Konfigurator ruft window.cfgApply({ css, flags, fokus }) auf.
(() => {
	'use strict';
	const root = document.documentElement;
	const main = document.querySelector('main');
	const galleries = [...document.querySelectorAll('[data-gallery]')];
	const rightCells = [...document.querySelectorAll('.bar--top .right')];
	const origDate = rightCells[0] ? rightCells[0].textContent : '';
	const quote = document.querySelector('.bar--bottom .span-2')?.textContent || '';
	let flags = {};

	// main.js lays out galleries with a fixed gap; the configurator takes over so gap and row height can change.
	galleries.forEach((g) => (g.dataset.layout = 'none'));

	/* ---------- elements the options switch on ---------- */

	const bar = document.querySelector('.bar--top');
	const progress = document.createElement('div');
	progress.className = 'cfg-progress';
	bar.appendChild(progress);
	const pct = rightCells.map((cell) => {
		const s = document.createElement('span');
		s.className = 'cfg-pct';
		cell.prepend(s);
		return s;
	});
	const dateSpans = rightCells.map((cell) => {
		const s = document.createElement('span');
		s.textContent = origDate;
		cell.lastChild.remove();
		cell.appendChild(s);
		return s;
	});
	const cursor = document.createElement('div');
	cursor.className = 'cfg-cursor';
	document.body.appendChild(cursor);
	addEventListener('pointermove', (e) => (cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`), { passive: true });

	const hero = document.createElement('div');
	hero.className = 'cfg-hero';
	main.prepend(hero);

	/* ---------- gallery layout ---------- */

	function layoutGallery(gallery) {
		const figures = [...gallery.children];
		if (flags.galerie && flags.galerie !== 'reihen') return;
		const width = gallery.getBoundingClientRect().width - 1;
		const gap = parseFloat(getComputedStyle(gallery).columnGap) || 0;
		const mobile = innerWidth <= 768;
		const target = width * (mobile ? 0.6 : flags.reihe || 0.3);
		let row = [];
		let sum = 0;
		const h = (s, n) => (width - gap * (n - 1)) / s;
		const flush = (height) => {
			row.forEach(({ fig, r }) => (fig.style.width = `${Math.floor(r * height * 100) / 100}px`));
			row = [];
			sum = 0;
		};
		figures.forEach((fig) => {
			const img = fig.querySelector('img');
			const r = img.getAttribute('width') / img.getAttribute('height') || 1;
			if (row.length && h(sum + r, row.length + 1) < target) flush(h(sum, row.length));
			row.push({ fig, r });
			sum += r;
		});
		if (row.length) flush(Math.min(target, h(sum, row.length)));
	}
	const layout = () => galleries.forEach(layoutGallery);
	let raf;
	const schedule = () => {
		cancelAnimationFrame(raf);
		raf = requestAnimationFrame(layout);
	};
	// only width changes matter; reacting to height would loop (layout changes height)
	let lastW = 0;
	new ResizeObserver(() => {
		const w = galleries[0].getBoundingClientRect().width;
		if (w !== lastW) (lastW = w), schedule();
	}).observe(main);

	/* ---------- reveal on scroll ---------- */

	const io = new IntersectionObserver(
		(entries) =>
			entries.forEach((e) => {
				if (!e.isIntersecting) return;
				const fig = e.target;
				setTimeout(() => fig.classList.add('cfg-in'), (+fig.dataset.cfgI % 4) * 110);
				io.unobserve(fig);
			}),
		{ rootMargin: '0px 0px -8% 0px' }
	);
	function replayReveal() {
		galleries.forEach((g) =>
			[...g.children].forEach((f, i) => {
				f.dataset.cfgI = i;
				f.classList.remove('cfg-in');
				io.observe(f);
			})
		);
	}
	replayReveal();
	root.classList.add('cfg-ready');

	/* ---------- scroll: progress, active section, hide-on-scroll ---------- */

	const navLinks = [...document.querySelectorAll('.bar--top nav a')];
	const targets = navLinks.map((a) => document.getElementById(a.hash.slice(1)));
	let lastY = scrollY;
	function onScroll() {
		const max = root.scrollHeight - innerHeight;
		const p = max > 0 ? scrollY / max : 0;
		progress.style.width = `${p * 100}%`;
		pct.forEach((s) => (s.textContent = `${String(Math.round(p * 100)).padStart(2, '0')} % · `));
		let cur = null;
		targets.forEach((t, i) => {
			if (t && t.getBoundingClientRect().top < innerHeight * 0.45) cur = i;
		});
		navLinks.forEach((a, i) => a.classList.toggle('is-active', i === cur));
		root.classList.toggle('cfg-down', scrollY > lastY && scrollY > 80);
		lastY = scrollY;
	}
	addEventListener('scroll', onScroll, { passive: true });

	/* ---------- date slot ---------- */

	let clock;
	function setDate(mode) {
		clearInterval(clock);
		const put = (t) => dateSpans.forEach((s) => (s.textContent = t));
		if (mode === 'aktuell') put('Aktuell: Sound Biesenthal 2026');
		else if (mode === 'uhr') {
			const tick = () =>
				put('München ' + new Date().toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin' }));
			tick();
			clock = setInterval(tick, 1000);
		} else if (mode === 'nichts') put('');
		else put(origDate);
	}

	/* ---------- hero ---------- */

	function setStart(mode) {
		hero.className = 'cfg-hero cfg-hero--' + (mode || 'none');
		if (!mode || mode === 'none') return (hero.innerHTML = '');
		if (mode === 'wortmarke') hero.innerHTML = '<p>studioniemeyer</p>';
		if (mode === 'satz') hero.innerHTML = `<p>${quote}</p>`;
		if (mode === 'bild') {
			const img = document.querySelector('.gallery img');
			hero.innerHTML = `<img src="${img.dataset.full}" alt="">`;
		}
	}

	/* ---------- lightbox ---------- */

	function lightbox(open) {
		const lb = document.querySelector('.lightbox');
		const isOpen = lb.classList.contains('open');
		if (open && !isOpen) document.querySelectorAll('.gallery figure')[1].click();
		if (!open && isOpen) lb.querySelector('.lb-close').click();
	}

	/* ---------- apply ---------- */

	const style = document.getElementById('cfg');
	let lastReveal;
	window.cfgApply = ({ css, flags: f, fokus }) => {
		const prev = flags;
		flags = f || {};
		style.textContent = css || '';
		if (prev.datum !== flags.datum) setDate(flags.datum);
		if (prev.start !== flags.start) setStart(flags.start);
		if (lastReveal !== undefined && lastReveal !== flags.einblenden) replayReveal();
		lastReveal = flags.einblenden;
		galleries.forEach((g) => [...g.children].forEach((fig) => flags.galerie !== 'reihen' && fig.style.removeProperty('width')));
		schedule();
		onScroll();
		if (fokus === 'lightbox') lightbox(true);
		else {
			lightbox(false);
			if (fokus === 'top') scrollTo({ top: 0, behavior: 'smooth' });
			else if (fokus) {
				const el = document.querySelector(fokus);
				if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		}
	};
	window.cfgReady = true;
	parent.postMessage('cfg-ready', '*');
})();
