// Pure helpers behind the right panel widgets: fonts, colors, number fields, insert picker.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FONTS, FONT_GROUPS, fontByName, fontTag, googleFontsUrl, isWebFont } from '../src/lib/fonts.ts';
import { PALETTE, hexOk, currentHex, readHexDraft } from '../src/lib/panel/color.ts';
import { fit, stepValue, parseTyped, scrubValue, stepDecimals } from '../src/lib/panel/number.ts';
import { buildInsertView } from '../src/lib/panel/insert.ts';
import { buttonWidthMode } from '../src/lib/panel/constants.ts';

test('font list matches the design: 22 fonts in three groups, email-safe fallbacks', () => {
	assert.equal(FONTS.length, 22);
	assert.deepEqual([...new Set(FONTS.map((f) => f.group))], [...FONT_GROUPS]);
	assert.equal(FONTS.filter((f) => f.group === 'Sans serif web fonts').length, 13);
	assert.equal(FONTS.filter((f) => f.group === 'Serif web fonts').length, 3);
	assert.equal(FONTS.filter((f) => f.group === 'Email-safe system fonts').length, 6);
	for (const f of FONTS) {
		if (f.group === 'Sans serif web fonts') assert.match(f.css, /, Arial, sans-serif$/, f.name);
		if (f.group === 'Serif web fonts') assert.match(f.css, /, Georgia, serif$/, f.name);
	}
	assert.equal(fontByName('Lora').css, "'Lora', Georgia, serif");
	assert.equal(fontByName('Nope').name, 'Figtree');
	assert.equal(fontTag(fontByName('Arial')), 'Email-safe');
	assert.equal(fontTag(fontByName('Inter')), 'Web font');
	assert.equal(isWebFont(fontByName('Tahoma')), false);
});

test('googleFontsUrl builds the css2 URL the design loads, skipping email-safe fonts', () => {
	const url = googleFontsUrl();
	assert.equal(
		url,
		'https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&family=Lato:wght@400;700&family=Open+Sans:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Nunito+Sans:wght@400;500;600;700&family=Work+Sans:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&family=Lora:wght@400;600;700&family=Merriweather:wght@400;700&display=swap',
	);
	assert.equal(googleFontsUrl([fontByName('Arial')]), '');
	assert.equal(googleFontsUrl([fontByName('Playfair Display')]), 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap');
});

test('palette and hex drafts', () => {
	assert.equal(PALETTE.length, 14);
	assert.equal(PALETTE[0].hex, '#1daa82');
	assert.equal(PALETTE[13].name, 'White');
	assert.equal(hexOk('#abc'), true);
	assert.equal(hexOk('#AABBCC'), true);
	assert.equal(hexOk('abc'), false);
	assert.equal(hexOk('#abcd'), false);
	assert.equal(currentHex('#AABBCC'), '#aabbcc');
	assert.equal(currentHex('transparent'), '');
	assert.deepEqual(readHexDraft('ff'), { draft: 'ff', hex: null });
	assert.deepEqual(readHexDraft('FF0'), { draft: 'FF0', hex: '#ff0' });
	assert.deepEqual(readHexDraft('#1DAA82'), { draft: '1DAA82', hex: '#1daa82' });
	assert.deepEqual(readHexDraft('1daa82ff'), { draft: '1daa82', hex: '#1daa82' });
	assert.deepEqual(readHexDraft('zzz'), { draft: 'zzz', hex: null });
	assert.deepEqual(readHexDraft('abcd'), { draft: 'abcd', hex: null });
});

test('number field steps, clamps and scrubs', () => {
	const px = { min: 0, max: 80, step: 1 };
	assert.equal(stepValue(10, 'up', px), 11);
	assert.equal(stepValue(10, 'up', { ...px, shift: true }), 20);
	assert.equal(stepValue(5, 'down', { ...px, shift: true }), 0);
	assert.equal(stepValue(79, 'up', { ...px, shift: true }), 80);
	const lh = { min: 1, max: 2.6, step: 0.05 };
	assert.equal(stepDecimals(0.05), 2);
	assert.equal(stepValue(1.65, 'up', lh), 1.7);
	assert.equal(stepValue(1.65, 'up', { ...lh, shift: true }), 2.15);
	assert.equal(fit(1.234, lh), 1.25);
	assert.equal(parseTyped('', px), null);
	assert.equal(parseTyped('abc', px), null);
	assert.equal(parseTyped('900', px), 80);
	assert.equal(parseTyped('-3', px), 0);
	assert.equal(parseTyped('12.5', px), 12.5);
	assert.equal(scrubValue(10, 30, px), 20);
	assert.equal(scrubValue(10, 30, { ...px, shift: true }), 80);
	assert.equal(scrubValue(10, -2, px), 9);
	assert.equal(scrubValue(600, 9, { min: 320, max: 800, step: 10 }), 630);
	assert.equal(buttonWidthMode(0), 'auto');
	assert.equal(buttonWidthMode(240), 'custom');
	assert.equal(buttonWidthMode(-1), 'full');
});

const BUILTINS = [
	{ key: 'name', label: 'Full name' },
	{ key: 'email', label: 'Email address' },
	{ key: 'unsubscribe_url', label: 'Unsubscribe link' },
];
const CONTACT = [{ key: 'county', label: '412 contacts' }, { key: 'plan', label: '380 contacts' }];
const LINKS = [{ key: 'order_online', label: 'Order online', url: 'https://kahawa.test/order' }, { key: 'menu', label: 'Menu', url: 'https://kahawa.test/menu' }];

test('insert picker: field mode rows, hints and tokens', () => {
	const v = buildInsertView({ mode: 'field', query: '', fallback: '', builtins: BUILTINS, contactFields: CONTACT, links: LINKS });
	assert.equal(v.title, 'Insert field');
	assert.equal(v.actionLabel, 'Insert');
	assert.deepEqual(v.items.filter((i) => i.kind === 'head').map((i) => i.kind === 'head' && i.label), ['Built in', 'Your contact fields', 'Named links']);
	assert.deepEqual(v.options.map((o) => o.key), ['name', 'email', 'unsubscribe_url', 'county', 'plan', 'link:order_online', 'link:menu']);
	assert.deepEqual(v.options.map((o) => o.index), [0, 1, 2, 3, 4, 5, 6]);
	assert.deepEqual(v.options.map((o) => o.hint), ['needs a fallback', '', '', 'needs a fallback', 'needs a fallback', '', '']);
	assert.equal(v.options[0].token, '{{name}}');
	assert.equal(v.preview, 'A recipient without a value sees nothing here. Add a fallback to show text instead.');

	const f = buildInsertView({ mode: 'field', query: 'name', fallback: ' friend ', builtins: BUILTINS, contactFields: CONTACT, links: LINKS });
	assert.equal(f.options[0].token, '{{name|friend}}');
	assert.equal(f.preview, 'A recipient without a value sees "friend".');

	const bad = buildInsertView({ mode: 'field', query: '', fallback: 'a|b', builtins: BUILTINS, contactFields: CONTACT, links: LINKS });
	assert.equal(bad.fallbackBad, true);
	assert.equal(bad.preview, 'A fallback cannot contain braces or a pipe.');

	const custom = buildInsertView({ mode: 'field', query: 'order_id', fallback: '', builtins: BUILTINS, contactFields: CONTACT, links: LINKS });
	assert.deepEqual(custom.options.map((o) => [o.key, o.sub, o.hint]), [['order_id', 'Use as a custom field', 'custom']]);

	const none = buildInsertView({ mode: 'field', query: 'zz zz', fallback: '', builtins: BUILTINS, contactFields: CONTACT, links: LINKS });
	assert.deepEqual(none.items, [{ kind: 'note', label: 'Nothing matches that search.' }]);
	assert.equal(none.options.length, 0);

	const strict = buildInsertView({
		mode: 'field', query: '', fallback: 'x', builtins: BUILTINS, contactFields: CONTACT, links: LINKS,
		fallbackError: () => 'Too short',
	});
	assert.equal(strict.preview, 'Too short');
	assert.equal(strict.fallbackBad, true);
});

test('insert picker: link mode', () => {
	const v = buildInsertView({ mode: 'link', query: 'kahawa.test/menu', fallback: '', builtins: BUILTINS, contactFields: CONTACT, links: LINKS });
	assert.equal(v.title, 'Choose a link');
	assert.equal(v.actionLabel, 'Use link');
	assert.equal(v.fallbackBad, false);
	assert.deepEqual(v.options.map((o) => [o.key, o.sub, o.token]), [['{{link:menu}}', 'Menu | https://kahawa.test/menu', '{{link:menu}}']]);
	const empty = buildInsertView({ mode: 'link', query: '', fallback: '', builtins: BUILTINS, contactFields: CONTACT, links: [] });
	assert.deepEqual(empty.items.map((i) => i.kind), ['head', 'note']);
	assert.equal(empty.items[1].kind === 'note' && empty.items[1].label, 'No named links yet. Add one with Manage links.');
});
