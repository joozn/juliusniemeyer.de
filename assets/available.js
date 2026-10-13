// "Available" page (see SHOP.md): edition numbers, capitalistic selling, checkout, request flow for unique works.
// With data.api (list came from SPINE): live status, checkout and requests go to SPINE (contract: mainframe/docs/verkauf.md).
// Without: example data, checkout and requests are only simulated.
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
	const api = data.api;
	const loadedAt = Date.now();
	const mailHint = 'Please try again in a moment — or write an email.';
	async function post(path, body) {
		const res = await fetch(`${api}/${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
		let json = {};
		try {
			json = await res.json();
		} catch {}
		return { status: res.status, ok: res.ok, json };
	}

	/* ---------- editions ---------- */

	const selected = {};
	const frameOf = {}; // chosen frame option per edition
	const frame = (w) => data.rahmen[frameOf[w.id] || (w.rahmen || ['ohne'])[0]] || { label: 'unframed', preis: 0 };
	const shipping = (w) => data.versand[frame(w).versand || w.versand] || {};
	// delivery: shipping within the EU, delivery in Munich (price per shipping scheme), or pickup by appointment
	const deliveryOf = {};
	const DELIVERY = {
		eu: { label: 'shipping EU', cost: (s) => s.eu },
		muenchen: { label: 'delivery in Munich', cost: (s) => s.muenchen },
		abholung: { label: 'pickup in Munich, by appointment', cost: () => 0 },
	};
	const delivery = (w) => {
		// the chosen option if this work offers it, otherwise the first one it offers (e.g. no EU shipping for large works)
		const offered = Object.keys(DELIVERY).filter((k) => DELIVERY[k].cost(shipping(w)) != null);
		const id = offered.includes(deliveryOf[w.id]) ? deliveryOf[w.id] : offered[0];
		return { id, ...DELIVERY[id], price: DELIVERY[id].cost(shipping(w)) };
	};
	const deliveryChoice = (w) =>
		'<span class="av-label">delivery</span>' +
		Object.entries(DELIVERY)
			.map(([id, d]) => {
				const c = d.cost(shipping(w));
				if (c == null) return '';
				return `<label class="av-check"><input type="radio" name="delivery-${w.id}" value="${id}"${id === delivery(w).id ? ' checked' : ''}> ${d.label}${id === 'abholung' ? ' — free' : ` ${euro(c)}`}</label>`;
			})
			.join('') +
		`<span class="av-world-line">outside the EU <button type="button" class="av-link av-world">on request</button></span>`;
	// capitalistic selling: no choice, the next free number in order
	const nextFree = (w) => {
		for (let n = 1; n <= w.auflage; n++) if (!w.verkauft.includes(n) && !w.reserviert.includes(n)) return n;
		return undefined;
	};
	function renderEdition(el) {
		const w = works[el.dataset.id];
		const sold = new Set(w.verkauft);
		const reserved = new Set(w.reserviert);
		const free = w.auflage - sold.size - reserved.size;
		const soldOut = sold.size >= w.auflage;
		const p = price(w);
		const ap = `edition of ${w.auflage} + ${w.ap ?? 1} AP`;
		$('.av-price', el).innerHTML = soldOut
			? `${ap} · sold out` + (w.capitalistic ? ` · last copy was sold for: <b>${euro(w.preis * 2 ** (sold.size - 1))}</b>` : '')
			: `${ap} · <b>${free}</b> available · <b>${euro(p)}</b>` + (w.capitalistic && free > 1 ? ` <span class="av-next">(next copy ${euro(p * 2)})</span>` : '');
		if (w.capitalistic) selected[w.id] = nextFree(w);
		$('.av-label', el).textContent = w.capitalistic ? 'your number' : 'choose your number';
		$('.av-label', el).hidden = soldOut;
		$('.av-numbers', el).hidden = soldOut;
		$('.av-frames', el).hidden = soldOut || (w.rahmen || []).length < 2;
		$('.av-ship', el).hidden = soldOut;
		$('.av-buy', el).hidden = soldOut;

		// frame options (price on top of the edition price; not part of the doubling)
		const frames = $('.av-frames', el);
		const current = frameOf[w.id] || (w.rahmen || ['ohne'])[0];
		frames.innerHTML =
			'<p class="av-label">frame</p>' +
			(w.rahmen || [])
				.map((id) => {
					const r = data.rahmen[id];
					return `<label class="av-check"><input type="radio" name="frame-${w.id}" value="${id}"${id === current ? ' checked' : ''}> ${esc(r.label)}${r.preis ? ` + ${euro(r.preis)}` : ''}</label>`;
				})
				.join('');

		$('.av-ship', el).innerHTML = deliveryChoice(w);
		const box = $('.av-numbers', el);
		box.innerHTML = '';
		if (w.capitalistic) {
			const n = selected[w.id];
			box.innerHTML = n ? `<p class="av-auto">no. ${n}/${w.auflage} — assigned automatically, always the next number in order</p>` : '';
		}
		for (let n = 1; n <= w.auflage && !w.capitalistic; n++) {
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
		buy.textContent = free < 1 ? 'Currently reserved' : n ? `Buy no. ${n}/${w.auflage} — ${euro(p + frame(w).preis)}` : 'Choose a number';
	}
	$$('.av-edition').forEach((el) => {
		el.addEventListener('change', (e) => {
			if (e.target.matches('.av-frames input')) frameOf[el.dataset.id] = e.target.value;
			else if (e.target.matches('.av-ship input')) deliveryOf[el.dataset.id] = e.target.value;
			else return;
			renderEdition(el);
		});
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

	/* ---------- unique works: status, and direct purchase (modus "kauf", frame included) ---------- */

	function renderUnique(el) {
		const w = works[el.dataset.id];
		const st = w.status === 'sold' || w.status === 'reserved' ? w.status : '';
		const direct = el.classList.contains('av-direct');
		if (!direct) {
			$('.av-price', el).textContent = `unique work · ${st || 'price on request'}`;
			$('.av-ask', el).hidden = st === 'sold';
			return;
		}
		$('.av-price', el).innerHTML = `unique work · ${st || `<b>${euro(w.preis)}</b>`}`;
		$('.av-ship', el).hidden = !!st;
		$('.av-ship', el).innerHTML = st ? '' : deliveryChoice(w);
		$('.av-buy', el).hidden = !!st;
		$('.av-buy', el).disabled = false;
		$('.av-buy', el).textContent = `Buy — ${euro(w.preis)}`;
		$('.av-ask-first', el).hidden = st === 'sold';
	}
	$$('.av-unikat').forEach((el) => {
		const w = works[el.dataset.id];
		el.addEventListener('change', (e) => {
			if (!e.target.matches('.av-ship input')) return;
			deliveryOf[w.id] = e.target.value;
			renderUnique(el);
		});
		el.addEventListener('click', (e) => {
			if (e.target.closest('.av-ask, .av-ask-link')) request([w.id]);
			if (e.target.closest('.av-world')) request([w.id], 'Shipping outside the EU');
			if (e.target.closest('.av-buy')) checkoutUnique(w, el);
		});
		renderUnique(el);
	});

	/* ---------- live status from SPINE (sold, reserved, current price) ---------- */

	async function refresh() {
		if (!api) return;
		try {
			const res = await fetch(`${api}/status`, { cache: 'no-store' });
			if (!res.ok) return;
			const list = await res.json();
			(Array.isArray(list) ? list : list.werke || []).forEach((st) => {
				const w = works[st.id];
				if (!w) return;
				w.status = st.status;
				if (w.art === 'unikat') {
					if (st.preis != null) w.preis = st.preis;
					return;
				}
				w.verkauft = st.verkauft || [];
				w.reserviert = st.reserviert || [];
				if (st.preis != null) w.preis = w.capitalistic ? st.preis / 2 ** w.verkauft.length : st.preis;
				if (selected[w.id] && (w.verkauft.includes(selected[w.id]) || w.reserviert.includes(selected[w.id]))) selected[w.id] = undefined;
			});
			$$('.av-edition').forEach(renderEdition);
			$$('.av-unikat').forEach(renderUnique);
		} catch {}
	}
	refresh();
	document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && refresh());

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

	/* ---------- checkout: SPINE reserves the number, Konto opens Stripe Checkout (without api: simulated) ---------- */

	async function checkout(w, el) {
		const n = selected[w.id];
		if (!n) return;
		if (api) {
			const buy = $('.av-buy', el);
			buy.disabled = true;
			buy.textContent = 'Reserving …';
			try {
				// never send a price: SPINE computes it
				const r = await post('checkout', { work: w.id, number: w.capitalistic ? undefined : n, frame: frameOf[w.id] || (w.rahmen || ['ohne'])[0], delivery: delivery(w).id });
				if (r.ok && r.json.url) return void (location.href = r.json.url);
				await refresh();
				open(`
					<p class="av-step">Checkout</p>
					<p class="av-title">${r.status === 409 ? `No. ${n} was just reserved by someone else` : 'That did not work'}</p>
					<p>${r.status === 409 ? 'Please choose another number. Reservations that are not paid become free again after 30 minutes.' : mailHint}</p>
					<p class="av-actions"><button type="button" class="av-primary av-close">Close</button></p>`);
			} catch {
				open(`<p class="av-title">No connection</p><p>${mailHint}</p><p class="av-actions"><button type="button" class="av-primary av-close">Close</button></p>`);
			}
			renderEdition(el);
			return;
		}
		const p = price(w);
		const f = frame(w);
		const ship = shipping(w);
		const dv = delivery(w);
		const cents = (x) => Math.round(x * 100) / 100;
		w.reserviert.push(n); // live: SPINE reserves the number for 30 min
		renderEdition(el);
		open(`
			<p class="av-step">Checkout · prototype</p>
			<p class="av-title">${esc(w.titel)}, no. ${n}/${w.auflage}</p>
			<table class="av-sum">
				<tr><td>edition</td><td>${euro(p)}</td></tr>
				<tr class="dim"><td>incl. ${w.ust} % VAT</td><td>${euro(cents(vatOf(p, w.ust)))}</td></tr>
				${
					f.preis
						? `<tr><td>${esc(f.label)}</td><td>${euro(f.preis)}</td></tr>
				<tr class="dim"><td>incl. ${f.ust} % VAT</td><td>${euro(cents(vatOf(f.preis, f.ust)))}</td></tr>`
						: `<tr><td>unframed</td><td>—</td></tr>`
				}
				<tr><td>${esc(dv.label)}${dv.id === 'abholung' ? '' : ` (${esc(ship.label)})`}</td><td>${dv.price ? euro(dv.price) : 'free'}</td></tr>
				<tr class="total"><td>total</td><td>${euro(p + f.preis + dv.price)}</td></tr>
			</table>
			<p>No. ${n} is reserved for you for 30 minutes. Next you would ${
				dv.id === 'abholung' ? 'pay' : dv.id === 'muenchen' ? 'enter your Munich address and pay' : 'enter your address and pay'
			} on Stripe's checkout page${dv.id === 'eu' ? ' (EU addresses)' : ''}.${dv.id === 'abholung' ? ' Julius then arranges a pickup date with you by email.' : ''}</p>
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
				${
					!w.capitalistic
						? ''
						: w.verkauft.length >= w.auflage
							? `<p class="av-cap">capitalistic selling: this was the last copy — sold for ${euro(p)}.</p>`
							: `<p class="av-cap">capitalistic selling: the next copy now costs ${euro(price(w))}.</p>`
				}
				<p class="av-actions"><button type="button" class="av-primary av-close">Close</button></p>`);
		});
	}

	/* ---------- checkout of a unique work: SPINE reserves the work, Konto opens Stripe Checkout (without api: simulated) ---------- */

	async function checkoutUnique(w, el) {
		const dv = delivery(w);
		const buy = $('.av-buy', el);
		if (api) {
			buy.disabled = true;
			buy.textContent = 'Reserving …';
			try {
				// never send a price: SPINE computes it (frame is included in the price of a unique work)
				const r = await post('checkout', { work: w.id, delivery: dv.id });
				if (r.ok && r.json.url) return void (location.href = r.json.url);
				const taken = r.status === 409;
				await refresh();
				open(`
					<p class="av-step">Checkout</p>
					<p class="av-title">${taken ? (r.json.error === 'sold' ? 'This work has just been sold' : 'Someone is buying this work right now') : 'That did not work'}</p>
					<p>${taken ? (r.json.error === 'sold' ? 'Sorry. Write an email if you would like to hear about similar works.' : 'If the payment is not completed, the work becomes available again after 30 minutes.') : mailHint}</p>
					<p class="av-actions"><button type="button" class="av-primary av-close">Close</button></p>`);
			} catch {
				open(`<p class="av-title">No connection</p><p>${mailHint}</p><p class="av-actions"><button type="button" class="av-primary av-close">Close</button></p>`);
			}
			renderUnique(el);
			return;
		}
		const cents = (x) => Math.round(x * 100) / 100;
		w.status = 'reserved'; // live: SPINE reserves the work for 30 min
		renderUnique(el);
		open(`
			<p class="av-step">Checkout · prototype</p>
			<p class="av-title">${esc(w.titel)} (${w.jahr}), unique work</p>
			<table class="av-sum">
				<tr><td>work${w.gerahmt ? ', frame included' : ''}</td><td>${euro(w.preis)}</td></tr>
				<tr class="dim"><td>incl. ${w.ust} % VAT</td><td>${euro(cents(vatOf(w.preis, w.ust)))}</td></tr>
				<tr><td>${esc(dv.label)}${dv.id === 'abholung' || !shipping(w).label ? '' : ` (${esc(shipping(w).label)})`}</td><td>${dv.price ? euro(dv.price) : 'free'}</td></tr>
				<tr class="total"><td>total</td><td>${euro(w.preis + dv.price)}</td></tr>
			</table>
			<p>The work is reserved for you for 30 minutes. Next you would pay on Stripe's checkout page.${dv.id === 'abholung' ? ' Julius then arranges a pickup date with you by email.' : ''}</p>
			<p class="av-actions"><button type="button" class="av-primary av-pay">Simulate payment</button> <button type="button" class="av-link av-cancel">Cancel</button></p>`);
		const release = () => {
			w.status = 'available';
			renderUnique(el);
		};
		$('.av-cancel', box).addEventListener('click', () => (release(), close()));
		dlg.addEventListener('click', function once(e) {
			if (e.target === dlg) release();
			dlg.removeEventListener('click', once);
		});
		$('.av-pay', box).addEventListener('click', () => {
			w.status = 'sold';
			renderUnique(el);
			open(`
				<p class="av-step">Paid · prototype</p>
				<p class="av-title">Thank you — ${esc(w.titel)}</p>
				<p>You receive an order confirmation by email. Julius receives an action message with the order, the payment and your address, and ships the work.</p>
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
				<input class="av-hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
				<p class="av-actions"><button type="submit" class="av-primary">Continue</button> <button type="button" class="av-link av-close">Cancel</button></p>
			</form>`);
		$('.av-form', box).addEventListener('submit', (e) => {
			e.preventDefault();
			const mail = $('#av-mail', box).value.trim();
			const hp = $('.av-hp', box).value;
			const others = unique.filter((w) => !ids.includes(w.id) && w.status !== 'sold');
			open(`
				<p class="av-step">${esc(subject)} · 2 / 2</p>
				<p>Would you like to request further works?</p>
				<form class="av-form av-more">
					${ids.map((id) => `<label class="av-check"><input type="checkbox" checked disabled> ${esc(works[id].titel)} (${works[id].jahr})</label>`).join('')}
					${others.map((w) => `<label class="av-check"><input type="checkbox" value="${w.id}"> ${esc(w.titel)} (${w.jahr})</label>`).join('')}
					<p class="av-actions"><button type="submit" class="av-primary">Send request</button> <button type="button" class="av-link av-close">Cancel</button></p>
				</form>`);
			$('.av-more', box).addEventListener('submit', async (e2) => {
				e2.preventDefault();
				const all = [...ids, ...$$('input[value]:checked', box).map((c) => c.value)];
				if (api) {
					const send = $('.av-primary', box);
					send.disabled = true;
					send.textContent = 'Sending …';
					let r = null;
					try {
						r = await post('inquiry', { email: mail, works: all, subject, website: hp, t: loadedAt });
					} catch {}
					if (!r || !r.ok) {
						send.disabled = false;
						send.textContent = 'Send request';
						return void $('.av-actions', box).insertAdjacentHTML('beforebegin', `<p class="av-error">${r && r.status === 429 ? 'Too many requests — please try again later.' : mailHint}</p>`);
					}
					return open(`
					<p class="av-step">Request sent</p>
					<p>Thank you. Dossiers for ${all.length} work${all.length > 1 ? 's' : ''} are being prepared and sent to <b>${esc(mail)}</b>:</p>
					<ul>${all.map((id) => `<li>fig. ${works[id].fig} — ${esc(works[id].titel)}</li>`).join('')}</ul>
					<p>Julius gets in touch personally.</p>
					<p class="av-actions"><button type="button" class="av-primary av-close">Close</button></p>`);
				}
				open(`
					<p class="av-step">Request sent · prototype</p>
					<p>Thank you. Dossiers for ${all.length} work${all.length > 1 ? 's' : ''} are being prepared and sent to <b>${esc(mail)}</b>:</p>
					<ul>${all.map((id) => `<li>fig. ${works[id].fig} — ${esc(works[id].titel)}</li>`).join('')}</ul>
					<p class="dim">Live: SPINE creates one PDF per work, the Zentrale sends them, the request is stored and Julius gets a message in the Mainframe.</p>
					<p class="av-actions"><button type="button" class="av-primary av-close">Close</button></p>`);
			});
		});
	}
})();
