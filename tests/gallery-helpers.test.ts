import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blocksLabel, categoryLabel, hueFor, sortTemplates, whenLabel } from '../src/lib/components/gallery/helpers.ts';

const NOW = Date.parse('2026-11-06T12:00:00');

test('whenLabel: the relative wording of the board', () => {
	assert.equal(whenLabel('2026-11-06T11:59:00', NOW), 'just now');
	assert.equal(whenLabel('2026-11-06T03:00:00', NOW), 'today');
	assert.equal(whenLabel('2026-11-05T23:00:00', NOW), 'yesterday');
	assert.equal(whenLabel('2026-11-04T10:00:00', NOW), '2 days ago');
	assert.equal(whenLabel('2026-10-30T10:00:00', NOW), 'last week');
	assert.equal(whenLabel('2026-10-16T10:00:00', NOW), '3 weeks ago');
	assert.equal(whenLabel('2026-09-20T10:00:00', NOW), 'last month');
	assert.equal(whenLabel('2026-04-21T10:00:00', NOW), '21 Apr 2026');
	assert.equal(whenLabel(null, NOW), '');
	assert.equal(whenLabel('nope', NOW), '');
});

test('blocksLabel pluralises', () => {
	assert.equal(blocksLabel(1), '1 block');
	assert.equal(blocksLabel(5), '5 blocks');
	assert.equal(blocksLabel(undefined), '0 blocks');
});

test('categoryLabel maps known ids and capitalises unknown ones', () => {
	assert.equal(categoryLabel('password-reset'), 'Password Reset');
	assert.equal(categoryLabel('custom'), 'Custom');
});

test('hueFor is stable per template and keyed by category when known', () => {
	assert.equal(hueFor({ id: 'a', category: 'invoice' }), '#3d6ee0');
	assert.equal(hueFor({ id: 'zzz', category: 'odd' }), hueFor({ id: 'zzz', category: 'odd' }));
	assert.match(hueFor({ id: 'q', category: null }), /^#[0-9a-f]{6}$/);
});

test('sortTemplates: newest, name and blocks', () => {
	const a = { name: 'Beta', blockCount: 3, updatedAt: '2026-11-01T00:00:00Z' };
	const b = { name: 'Alpha', blockCount: 9, updatedAt: '2026-11-03T00:00:00Z' };
	const c = { name: 'Gamma', blockCount: 5, updatedAt: null };
	assert.deepEqual(sortTemplates([a, b, c], 'recent').map((x) => x.name), ['Alpha', 'Beta', 'Gamma']);
	assert.deepEqual(sortTemplates([a, b, c], 'name').map((x) => x.name), ['Alpha', 'Beta', 'Gamma']);
	assert.deepEqual(sortTemplates([a, b, c], 'blocks').map((x) => x.name), ['Alpha', 'Gamma', 'Beta']);
});

import { parseAiTemplate } from '../src/lib/server/ai-import.ts';
import { sampleReply } from '../src/lib/components/gallery/helpers.ts';

test('the sample reply of the Generate with AI dialog passes the real validator', () => {
	const r = parseAiTemplate(sampleReply());
	assert.equal(r.ok, true);
	if (r.ok) {
		assert.equal(r.name, 'Coffee welcome');
		assert.equal(r.blocks.length, 5);
		assert.match(r.subject, /Karibu/);
	}
});
