// Laborelemente — test panel on top of the real page. All five elements are live in assets/labor.js;
// the panel simulates days for the decay (1), fires a Geiger pulse (4) and switches the field (5).
(() => {
	'use strict';
	const $ = (s, el = document) => el.querySelector(s);
	const $$ = (s, el = document) => [...el.querySelectorAll(s)];
	const labor = window.labor || {};
	const FELDER = { stroemung: 'Strömung', diffusion: 'Diffusion', halbwertszeit: 'Halbwertszeit' };
	const current = $('.feld')?.dataset.feld;

	const panel = document.createElement('aside');
	panel.className = 'el-panel';
	panel.innerHTML = `
		<div class="head"><span>Laborelemente · Testpult</span><button type="button">ausblenden</button></div>
		<div class="group">1 · Zerfall – Tage simulieren</div>
		<div class="days"><input type="range" name="days" min="0" max="120"><span></span></div>
		<div class="group">4 · Geiger</div>
		<div class="desc"><button type="button" class="test">Impuls jetzt auslösen</button></div>
		<div class="desc"><button type="button" class="reset">Ton-Frage wieder zeigen</button></div>
		<div class="group">5 · Feld (beim Laden zufällig)</div>
		${Object.entries(FELDER).map(([id, l]) => `<label><input type="radio" name="feld" value="${id}"${id === current ? ' checked' : ''}> ${l}</label>`).join('')}`;
	document.body.appendChild(panel);

	const toggle = $('.head button', panel);
	toggle.addEventListener('click', () => {
		panel.classList.toggle('min');
		toggle.textContent = panel.classList.contains('min') ? 'einblenden' : 'ausblenden';
	});

	const days = $('input[name=days]', panel);
	const daysOut = days.nextElementSibling;
	const real = labor.days ? labor.days() : 0;
	days.value = real;
	const showDays = () => (daysOut.textContent = `${days.value} Tage${+days.value === real ? ' (echt)' : ''}`);
	days.addEventListener('input', () => {
		showDays();
		labor.setDays && labor.setDays(+days.value);
	});
	showDays();

	$('.test', panel).addEventListener('click', () => labor.pulse && labor.pulse());
	$('.reset', panel).addEventListener('click', () => {
		try {
			localStorage.removeItem('ton');
		} catch {}
		location.reload();
	});
	$$('input[name=feld]', panel).forEach((r) => r.addEventListener('change', () => labor.feld && labor.feld(r.value)));
})();
