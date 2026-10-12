// "Available" prototype: edition numbers, capitalistic selling, simulated checkout, request flow for unique works.
// Later: list from SPINE (build) + live status from SPINE, checkout via Konto → Stripe, requests → SPINE/Zentrale.
(() => {
	'use strict';
	const $ = (s, el = document) => el.querySelector(s);
	const $$ = (s, el = document) => [...el.querySelectorAll(s)];
	const data = JSON.parse($('#av-data').textContent);
	const works = Object.fromEntries(data.werke.map((w) => [w.id, w]));
	const euro = (n) => n.toLocaleString('en-GB', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €';
	const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

	// price is always computed from the sales so far (live: on the server, never taken from the browser)
	const price = (w) => (w.capitalistic ? w.preis * 2 ** w.verkauft.length : w.preis);
	const vatOf = (gross, rate) => gross - gross / (1 + rate / 100);

	/* ---------- editions ---------- */

	const selected = {};
	function renderEdition(el) {
		const w = works[el.dataset.id];
		const sold = new Set(w.verkauft);
		const reserved = new Set(w.reserviert);
		const free = w.auflage - sold.size - reserved.size;
		const p = price(w);
		$('.av-price', el).innerHTML =
			`edition of ${w.auflage} · <b>${free}</b> available · <b>${euro(p)}</b>` + (w.capitalistic && free > 1 ? ` <span class="av-next">(next copy ${euro(p * 2)})</span>` : '');
		const ship = data.versand[w.versand];
		$('.av-ship', el).innerHTML = `shipping EU ${euro(ship.eu)} · outside the EU <button type="button" class="av-link av-world">on request</button>`;
		const box = $('.av-numbers', el);
		box.innerHTML = '';
		for (let n = 1; n <= w.auflage; n++) {
			const b = document.createElement('button');
			b.type = 'button';
			b.textContent = n;
			b.dataset.n = n;
			if (sold.has(n)) (b.disabled = true), (b.className = 'sold'), (b.title = `no. ${n} sold`);
			else if (reserved.has(n)) (b.disabled = true), (b.className = 'reserved'), (b.title = `no. ${n} reserved`);
			else b.title = `no. ${n}/${w.auflage}`;
			if (selected[w.id] === n) b.classList.add('is-selected'), b.setAttribute('aria-pressed', 'true');
			box.appendChild(b);
		}
		const buy = $('.av-buy', el);
		const n = selected[w.id];
		buy.disabled = !n || free < 1;
		buy.textContent = free < 1 ? 'Sold out' : n ? `Buy no. ${n}/${w.auflage} — ${euro(p)}` : 'Choose a number';
	}
	$$('.av-edition').forEach((el) => {
		el.addEventListener('click', (e) => {
			const w = works[el.dataset.id];
			const nb = e.target.closest('.av-numbers button');
			if (nb && !nb.disabled) {
				selected[w.id] = selected[w.id] === +nb.dataset.n ? undefined : +nb.dataset.n;
				renderEdition(el);
			}
			if (e.target.closest('.av-buy')) checkout(w, el);
			if (e.target.closest('.av-world')) request([w.id], 'Shipping outside the EU');
		});
		renderEdition(el);
	});

	/* ---------- dialog ---------- */

	const dlg = $('.av-dialog');
	const box = $('.av-box', dlg);
	let lastFocus = null;
	function open(html) {
		lastFocus = document.activeElement;
		box.innerHTML = html;
		dlg.hidden = false;
		document.body.classList.add('lb-open');
		($('input, button.av-primary', box) || $('button', box)).focus();
	}
	function close() {
		dlg.hidden = true;
		document.body.classList.remove('lb-open');
		if (lastFocus) lastFocus.focus({ preventScroll: true });
	}
	dlg.addEventListener('click', (e) => {
		if (e.target === dlg || e.target.closest('.av-close')) close();
	});
	document.addEventListener('keydown', (e) => !dlg.hidden && e.key === 'Escape' && close());

	/* ---------- checkout (simulated; live: Konto → Stripe Checkout) ---------- */

	function checkout(w, el) {
		const n = selected[w.id];
		if (!n) return;
		const p = price(w);
		const ship = data.versand[w.versand].eu;
		w.reserviert.push(n); // live: SPINE reserves the number for 30 min
		renderEdition(el);
		open(`
			<p class="av-step">Checkout · prototype</p>
			<p class="av-title">${esc(w.titel)}, no. ${n}/${w.auflage}</p>
			<table class="av-sum">
				<tr><td>price</td><td>${euro(p)}</td></tr>
				<tr class="dim"><td>incl. ${w.ust} % VAT</td><td>${euro(Math.round(vatOf(p, w.ust) * 100) / 100)}</td></tr>
				<tr><td>shipping EU (${esc(data.versand[w.versand].label)})</td><td>${euro(ship)}</td></tr>
				<tr class="total"><td>total</td><td>${euro(p + ship)}</td></tr>
			</table>
			<p>No. ${n} is reserved for you for 30 minutes. Next you would enter your address and pay on Stripe's checkout page (EU addresses).</p>
			<p class="av-actions"><button type="button" class="av-primary av-pay">Simulate payment</button> <button type="button" class="av-link av-cancel">Cancel</button></p>`);
		const release = () => {
			w.reserviert = w.reserviert.filter((x) => x !== n);
			renderEdition(el);
		};
		$('.av-cancel', box).addEventListener('click', () => (release(), close()));
		dlg.addEventListener('click', function once(e) {
			if (e.target === dlg) release();
			dlg.removeEventListener('click', once);
		});
		$('.av-pay', box).addEventListener('click', () => {
			w.reserviert = w.reserviert.filter((x) => x !== n);
			w.verkauft.push(n);
			selected[w.id] = undefined;
			renderEdition(el);
			open(`
				<p class="av-step">Paid · prototype</p>
				<p class="av-title">Thank you — ${esc(w.titel)}, no. ${n}/${w.auflage}</p>
				<p>You receive an order confirmation by email. Julius receives an action message with the order, the payment and your address, and ships the work.</p>
				${w.capitalistic ? `<p class="av-cap">capitalistic selling: the next copy now costs ${euro(price(w))}.</p>` : ''}
				<p class="av-actions"><button type="button" class="av-primary av-close">Close</button></p>`);
		});
	}

	/* ---------- request flow for unique works (live: SPINE prepares PDF dossiers, Zentrale sends them) ---------- */

	const unique = data.werke.filter((w) => w.art === 'unikat');
	function request(ids, subject = 'Request') {
		const first = works[ids[0]];
		open(`
			<p class="av-step">${esc(subject)} · 1 / 2</p>
			<p class="av-title">${esc(first.titel)} (${first.jahr})</p>
			<form class="av-form">
				<label for="av-mail">Your email</label>
				<input id="av-mail" type="email" required autocomplete="email" placeholder="name@example.com">
				<p class="av-actions"><button type="submit" class="av-primary">Continue</button> <button type="button" class="av-link av-close">Cancel</button></p>
			</form>`);
		$('.av-form', box).addEventListener('submit', (e) => {
			e.preventDefault();
			const mail = $('#av-mail', box).value.trim();
			const others = unique.filter((w) => !ids.includes(w.id));
			open(`
				<p class="av-step">${esc(subject)} · 2 / 2</p>
				<p>Would you like to request further works?</p>
				<form class="av-form av-more">
					${ids.map((id) => `<label class="av-check"><input type="checkbox" checked disabled> ${esc(works[id].titel)} (${works[id].jahr})</label>`).join('')}
					${others.map((w) => `<label class="av-check"><input type="checkbox" value="${w.id}"> ${esc(w.titel)} (${w.jahr})</label>`).join('')}
					<p class="av-actions"><button type="submit" class="av-primary">Send request</button> <button type="button" class="av-link av-close">Cancel</button></p>
				</form>`);
			$('.av-more', box).addEventListener('submit', (e2) => {
				e2.preventDefault();
				const all = [...ids, ...$$('input[value]:checked', box).map((c) => c.value)];
				open(`
					<p class="av-step">Request sent · prototype</p>
					<p>Thank you. Dossiers for ${all.length} work${all.length > 1 ? 's' : ''} are being prepared and sent to <b>${esc(mail)}</b>:</p>
					<ul>${all.map((id) => `<li>fig. ${works[id].fig} — ${esc(works[id].titel)}</li>`).join('')}</ul>
					<p class="dim">Live: SPINE creates one PDF per work, the Zentrale sends them, the request is stored and Julius gets a message in the Mainframe.</p>
					<p class="av-actions"><button type="button" class="av-primary av-close">Close</button></p>`);
			});
		});
	}
	$$('.av-unikat').forEach((el) => $('.av-ask', el).addEventListener('click', () => request([el.dataset.id])));
})();
