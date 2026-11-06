import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	detectTrigger, suggestOptions, applySuggestion, hasEmptyFallback, insertAt, wrapIndex, groupRows, needsFallback,
} from '../src/lib/panel/suggest.ts';

const FIELDS = [
	{ key: 'name', label: 'Full name' },
	{ key: 'company', label: 'Company' },
	{ key: 'first_name', label: 'First name' },
	{ key: 'last_name', label: 'Last name' },
	{ key: 'email', label: 'Email address' },
	{ key: 'unsubscribe_url', label: 'Unsubscribe link' },
	{ key: 'county', label: 'Custom field, 412 contacts' },
];
const LINKS = [
	{ key: 'order_online', label: 'Order online', url: 'https://kahawa.test/order' },
	{ key: 'menu', label: 'Menu' },
];

// Caret marked with | in the fixture text.
const at = (s: string) => {
	const c = s.indexOf('|');
	return { value: s.slice(0, c) + s.slice(c + 1), caret: c };
};

test('detectTrigger opens right after {{ with or without a partial', () => {
	let x = at('Hi {{|');
	assert.deepEqual(detectTrigger(x.value, x.caret), { start: 3, end: 5, partial: '' });
	x = at('Hi {{fir|');
	assert.deepEqual(detectTrigger(x.value, x.caret), { start: 3, end: 8, partial: 'fir' });
	x = at('{{link:or|');
	assert.deepEqual(detectTrigger(x.value, x.caret), { start: 0, end: 9, partial: 'link:or' });
	x = at('{{na|');
	assert.equal(detectTrigger(x.value, x.caret)?.start, 0);
});

test('detectTrigger stays closed without an open {{ or after a pipe or space', () => {
	// The last | is the caret, so a pipe earlier in the text stays text.
	for (const s of ['Hello|', '{|', '{ {na|', '{{name|fr|', '{{name |', 'x}} y|', '{{na-me|']) {
		const c = s.lastIndexOf('|');
		const value = s.slice(0, c) + s.slice(c + 1);
		assert.equal(detectTrigger(value, c), null, s);
	}
});

test('detectTrigger stays closed inside a complete token', () => {
	const v = 'Hi {{name|friend}}!';
	assert.equal(detectTrigger(v, 6), null); // {{na|me|friend}}
	assert.equal(detectTrigger(v, 9), null); // {{name|...}}
	assert.equal(detectTrigger('{{name}}', 4), null);
	assert.equal(detectTrigger('{{}}', 2), null);
	// After the closing braces it is just text.
	assert.equal(detectTrigger(v, v.length), null);
});

test('detectTrigger with text after the caret that is not a token keeps it open', () => {
	assert.deepEqual(detectTrigger('Hi {{na there', 7), { start: 3, end: 7, partial: 'na' });
	assert.deepEqual(detectTrigger('{{na}', 4), { start: 0, end: 4, partial: 'na' });
});

test('detectTrigger uses the innermost {{ for nested or repeated braces', () => {
	assert.deepEqual(detectTrigger('{{{na', 5), { start: 1, end: 5, partial: 'na' });
	assert.deepEqual(detectTrigger('{{name}} and {{co', 17), { start: 13, end: 17, partial: 'co' });
	assert.deepEqual(detectTrigger('{{ {{em', 7), { start: 3, end: 7, partial: 'em' });
});

test('detectTrigger ignores selections and odd carets', () => {
	assert.equal(detectTrigger('{{na', 2, 4), null);
	assert.equal(detectTrigger('{{na', null), null);
	assert.deepEqual(detectTrigger('{{na', 99), { start: 0, end: 4, partial: 'na' });
	assert.equal(detectTrigger('', 0), null);
});

test('suggestOptions lists contact fields then named links, prefix matches first', () => {
	const all = suggestOptions('', FIELDS, LINKS);
	assert.deepEqual(all.map((o) => o.key), [...FIELDS.map((f) => f.key), 'link:order_online', 'link:menu']);
	assert.deepEqual(suggestOptions('na', FIELDS, LINKS).map((o) => o.key), ['name', 'first_name', 'last_name']);
	assert.deepEqual(suggestOptions('co', FIELDS, LINKS).map((o) => o.key), ['company', 'county']);
	assert.deepEqual(suggestOptions('NA', FIELDS, LINKS).map((o) => o.key), ['name', 'first_name', 'last_name']);
});

test('suggestOptions filters links by link:key and by label', () => {
	assert.deepEqual(suggestOptions('link:', FIELDS, LINKS).map((o) => o.key), ['link:order_online', 'link:menu']);
	assert.deepEqual(suggestOptions('link:me', FIELDS, LINKS).map((o) => o.key), ['link:menu']);
	assert.deepEqual(suggestOptions('online', FIELDS, LINKS).map((o) => o.key), ['link:order_online']);
	assert.deepEqual(suggestOptions('xyz', FIELDS, LINKS), []);
});

test('fields that can be empty insert {{key|}} with the caret before the braces', () => {
	const [name] = suggestOptions('nam', FIELDS, LINKS);
	assert.equal(name.token, '{{name|}}');
	assert.equal(name.back, 2);
	assert.equal(name.hint, 'needs a fallback');
	const email = suggestOptions('email', FIELDS, LINKS)[0];
	assert.deepEqual([email.token, email.back, email.hint], ['{{email}}', 0, '']);
	const un = suggestOptions('unsub', FIELDS, LINKS)[0];
	assert.equal(un.token, '{{unsubscribe_url}}');
	const link = suggestOptions('link:menu', FIELDS, LINKS)[0];
	assert.deepEqual([link.token, link.back, link.group], ['{{link:menu}}', 0, 'Named links']);
	assert.equal(needsFallback('county'), true);
	assert.equal(needsFallback('email'), false);
});

test('applySuggestion replaces the partial and keeps text before and after', () => {
	let x = at('Hi {{na|, welcome');
	let trig = detectTrigger(x.value, x.caret)!;
	let r = applySuggestion(x.value, trig, { token: '{{name|}}', back: 2 });
	assert.equal(r.value, 'Hi {{name|}}, welcome');
	assert.equal(r.value.slice(0, r.caret), 'Hi {{name|');

	// Word characters right after the caret are part of the partial and get replaced.
	x = at('Hi {{fi|rst there');
	trig = detectTrigger(x.value, x.caret)!;
	r = applySuggestion(x.value, trig, { token: '{{email}}', back: 0 });
	assert.equal(r.value, 'Hi {{email}} there');
	assert.equal(r.caret, 'Hi {{email}}'.length);

	x = at('{{|');
	trig = detectTrigger(x.value, x.caret)!;
	r = applySuggestion(x.value, trig, { token: '{{link:menu}}', back: 0 });
	assert.deepEqual(r, { value: '{{link:menu}}', caret: 13 });

	x = at('{{name}} and {{co|');
	trig = detectTrigger(x.value, x.caret)!;
	r = applySuggestion(x.value, trig, { token: '{{company|}}', back: 2 });
	assert.equal(r.value, '{{name}} and {{company|}}');
});

test('hasEmptyFallback drives the fallback helper line', () => {
	assert.equal(hasEmptyFallback('Hi {{name|}}'), true);
	assert.equal(hasEmptyFallback('Hi {{name|friend}}'), false);
	assert.equal(hasEmptyFallback('Hi {{email}}'), false);
});

test('insertAt puts a token at the caret or at the end', () => {
	assert.deepEqual(insertAt('Hello !', 6, '{{name}}'), { value: 'Hello {{name}}!', caret: 14 });
	assert.deepEqual(insertAt('Hello', undefined, '{{name}}'), { value: 'Hello{{name}}', caret: 13 });
	assert.deepEqual(insertAt('Hi', 50, 'x'), { value: 'Hix', caret: 3 });
});

test('wrapIndex wraps both ways', () => {
	assert.equal(wrapIndex(0, -1, 3), 2);
	assert.equal(wrapIndex(2, 1, 3), 0);
	assert.equal(wrapIndex(1, 1, 3), 2);
	assert.equal(wrapIndex(5, 1, 3), 0);
	assert.equal(wrapIndex(0, 1, 0), 0);
});

test('groupRows adds one heading per group', () => {
	const rows = groupRows(suggestOptions('', FIELDS.slice(0, 2), LINKS.slice(0, 1)));
	assert.deepEqual(rows.map((r) => (r.kind === 'head' ? '#' + r.label : r.opt.key)), [
		'#Contact fields', 'name', 'company', '#Named links', 'link:order_online',
	]);
	assert.deepEqual(rows.filter((r) => r.kind === 'opt').map((r) => (r.kind === 'opt' ? r.index : -1)), [0, 1, 2]);
});
