(() => {
	'use strict';

	// E-Mail is assembled at runtime so simple spam bots can't scrape it from the HTML.
	document.querySelectorAll('[data-u][data-d]').forEach((a) => {
		a.href = `mailto:${a.dataset.u}@${a.dataset.d}`;
	});

	const mobile = window.matchMedia('(max-width: 768px)');
	const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize);

	/* ---------- justified galleries ----------
	   Same behaviour as Cargo's "gallery-justify": target row height is a share
	   of the gallery width (30% desktop, 60% mobile). Images are added to a row
	   as long as the row stays at least that tall, then the row is scaled to
	   fill the full width exactly. */

	const galleries = [...document.querySelectorAll('[data-gallery]')];

	function layoutGallery(gallery) {
		const figures = [...gallery.children];
		// a hair less than the real width, so sub-pixel rounding never wraps a row
		const width = gallery.getBoundingClientRect().width - 1;
		const gap = 0.5 * rem();
		const target = width * (mobile.matches ? 0.6 : 0.3);

		let row = [];
		let ratioSum = 0;
		const rowHeight = (sum, n) => (width - gap * (n - 1)) / sum;
		const flush = (height) => {
			row.forEach(({ fig, ratio }) => {
				fig.style.width = `${Math.floor(ratio * height * 100) / 100}px`;
			});
			row = [];
			ratioSum = 0;
		};

		figures.forEach((fig) => {
			const img = fig.querySelector('img');
			const ratio = img.getAttribute('width') / img.getAttribute('height') || 1;
			if (row.length && rowHeight(ratioSum + ratio, row.length + 1) < target) {
				flush(rowHeight(ratioSum, row.length));
			}
			row.push({ fig, ratio });
			ratioSum += ratio;
		});
		// last row keeps the target height instead of being blown up
		if (row.length) flush(Math.min(target, rowHeight(ratioSum, row.length)));
	}

	/* ---------- wordmark: fit text to the page width ---------- */

	const wordmark = document.querySelector('.wordmark');
	function fitWordmark() {
		if (!wordmark) return;
		wordmark.style.fontSize = '100px';
		const span = document.createElement('span');
		span.textContent = wordmark.textContent;
		span.style.display = 'inline-block';
		wordmark.textContent = '';
		wordmark.appendChild(span);
		const ratio = wordmark.clientWidth / span.getBoundingClientRect().width;
		wordmark.textContent = span.textContent;
		wordmark.style.fontSize = `${Math.floor(100 * ratio * 0.995)}px`;
	}

	function layout() {
		galleries.forEach(layoutGallery);
		fitWordmark();
	}

	let raf;
	const schedule = () => {
		cancelAnimationFrame(raf);
		raf = requestAnimationFrame(layout);
	};
	new ResizeObserver(schedule).observe(document.querySelector('main'));
	mobile.addEventListener('change', schedule);
	document.fonts && document.fonts.ready.then(schedule);
	layout();

	/* ---------- lightbox ---------- */

	const lb = document.querySelector('.lightbox');
	if (!lb) return;
	const lbImg = lb.querySelector('img');
	let current = [];
	let index = 0;
	let lastFocus = null;

	function show(i) {
		index = (i + current.length) % current.length;
		const img = current[index].querySelector('img');
		lbImg.src = img.dataset.full || img.currentSrc || img.src;
		lbImg.alt = img.alt;
		// warm up the neighbours
		[index + 1, index - 1].forEach((n) => {
			const next = current[(n + current.length) % current.length].querySelector('img');
			new Image().src = next.dataset.full;
		});
	}

	function open(fig) {
		current = [...fig.parentElement.children];
		lastFocus = document.activeElement;
		show(current.indexOf(fig));
		lb.hidden = false;
		lb.classList.add('open');
		document.body.classList.add('lb-open');
		lb.querySelector('.lb-close').focus({ preventScroll: true });
	}

	function close() {
		lb.classList.remove('open');
		lb.hidden = true;
		document.body.classList.remove('lb-open');
		lbImg.removeAttribute('src');
		if (lastFocus) lastFocus.focus({ preventScroll: true });
	}

	galleries.forEach((gallery) => {
		[...gallery.children].forEach((fig) => {
			fig.tabIndex = 0;
			fig.setAttribute('role', 'button');
			fig.addEventListener('click', () => open(fig));
			fig.addEventListener('keydown', (e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					open(fig);
				}
			});
		});
	});

	lb.querySelector('.lb-close').addEventListener('click', close);
	lb.querySelector('.lb-prev').addEventListener('click', () => show(index - 1));
	lb.querySelector('.lb-next').addEventListener('click', () => show(index + 1));
	lb.addEventListener('click', (e) => {
		if (e.target === lb) close();
	});
	document.addEventListener('keydown', (e) => {
		if (lb.hidden) return;
		if (e.key === 'Escape') close();
		if (e.key === 'ArrowLeft') show(index - 1);
		if (e.key === 'ArrowRight') show(index + 1);
	});

	let touchX = null;
	lb.addEventListener('touchstart', (e) => (touchX = e.touches[0].clientX), { passive: true });
	lb.addEventListener('touchend', (e) => {
		if (touchX === null) return;
		const dx = e.changedTouches[0].clientX - touchX;
		if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
		touchX = null;
	});
})();
