// "Vertrag widerrufen" (§ 356a BGB): sends the withdrawal to SPINE (contract: mainframe/docs/verkauf.md, withdrawal.received).
// Without an endpoint (local build without SPINE) the email program opens with the prepared declaration.
(() => {
	const form = document.querySelector('[data-wd]');
	if (!form) return;
	const cfg = JSON.parse(document.getElementById('wd-data').textContent);
	const email = `${cfg.u}@${cfg.d}`;
	const msg = form.querySelector('.wd-msg');
	const t = Date.now();
	const fallback = `Bitte schreiben Sie an ${email} – auch so ist Ihr Widerruf wirksam.`;

	form.addEventListener('submit', async (e) => {
		e.preventDefault();
		const f = Object.fromEntries(new FormData(form));
		if (!cfg.endpoint) {
			const text = `Hiermit widerrufe ich den Vertrag über: ${f.order}\nName: ${f.name}\nE-Mail: ${f.email}\n${f.note ? `\n${f.note}\n` : ''}`;
			location.href = `mailto:${email}?subject=${encodeURIComponent('Widerruf')}&body=${encodeURIComponent(text)}`;
			msg.textContent = 'Ihr E-Mail-Programm öffnet sich mit der vorbereiteten Widerrufserklärung. Bitte senden Sie sie ab.';
			return;
		}
		const button = form.querySelector('button');
		button.disabled = true;
		msg.textContent = 'Wird gesendet …';
		const res = await fetch(cfg.endpoint, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ name: f.name, email: f.email, order: f.order, note: f.note || undefined, website: f.website, t }),
		}).catch(() => undefined);
		if (res && res.ok) {
			form.querySelectorAll('input, textarea, button').forEach((el) => (el.disabled = true));
			msg.textContent = `Ihr Widerruf ist eingegangen (${new Date().toLocaleString('de-DE')}). Die Bestätigung geht an ${f.email}.`;
			return;
		}
		button.disabled = false;
		const body = res ? await res.json().catch(() => ({})) : {};
		if (res && res.status === 400 && body.fields) msg.textContent = 'Bitte prüfen Sie Ihre Angaben (Name, E-Mail-Adresse, Bestellnummer).';
		else if (res && res.status === 429) msg.textContent = `Zu viele Versuche. ${fallback}`;
		else msg.textContent = `Das hat nicht geklappt. ${fallback}`;
	});
})();
