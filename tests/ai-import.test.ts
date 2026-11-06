import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAiTemplate, extractJson } from '../src/lib/server/ai-import.ts';
import { BLOCK_SCHEMA } from '../src/lib/server/sanitize-blocks.ts';
import { buildAiPrompt, aiUrl, AI_SPEC } from '../src/lib/ai-prompt.ts';

const good = {
	name: 'Welcome',
	subject: 'Welcome, {{name|friend}}',
	blocks: [
		{ id: 'b1', type: 'header', props: { companyName: 'Acme', backgroundColor: '#112233' } },
		{ id: 'b2', type: 'heading', props: { text: 'Hello {{name|there}}' } },
		{ id: 'b3', type: 'button', props: { text: 'Start', href: 'https://acme.test/start' } },
		{ id: 'b4', type: 'footer', props: { unsubUrl: '{{unsubscribe_url}}' } },
	],
};

test('accepts a fenced reply with chatter around it', () => {
	const r = parseAiTemplate('Sure! Here you go:\n```json\n' + JSON.stringify(good) + '\n```\nHope it helps.');
	assert.equal(r.ok, true);
	if (r.ok) {
		assert.equal(r.name, 'Welcome');
		assert.equal(r.blocks.length, 4);
		assert.deepEqual([...r.fields].sort(), ['name', 'unsubscribe_url']);
	}
});

test('accepts bare JSON and a bare block array', () => {
	assert.equal(parseAiTemplate(JSON.stringify(good)).ok, true);
	assert.equal(parseAiTemplate(JSON.stringify(good.blocks)).ok, true);
});

test('repairs ids and block order, and says so', () => {
	const messy = {
		blocks: [good.blocks[3], { type: 'heading', props: { text: 'Hi' } }, { id: 'x', type: 'heading', props: { text: 'Again' } }, { id: 'x', type: 'content', props: { text: '<p>t</p>' } }, good.blocks[0]],
	};
	const r = parseAiTemplate(JSON.stringify(messy));
	assert.equal(r.ok, true);
	if (r.ok) {
		assert.equal(r.blocks[0].type, 'header');
		assert.equal(r.blocks[r.blocks.length - 1].type, 'footer');
		assert.equal(new Set(r.blocks.map((b) => b.id)).size, r.blocks.length);
		assert.ok(r.warnings.some((w) => /header/.test(w)));
	}
});

test('refuses with a plain reason', () => {
	const cases: [string, RegExp][] = [
		['', /Paste/],
		['no json here', /No JSON/],
		['{"blocks": [', /No JSON|not valid/],
		['{"name":"x"}', /blocks/],
		[JSON.stringify({ blocks: [] }), /empty/],
		[JSON.stringify({ blocks: [{ id: 'a', type: 'video', props: {} }] }), /unknown type/],
		[JSON.stringify({ blocks: [{ id: 'a', type: 'button', props: { text: 'x', href: 'javascript:alert(1)' } }] }), /href/],
		[JSON.stringify({ blocks: [{ id: 'a', type: 'heading', props: { text: '{{#each x}}boom{{/each}}' } }] }), /not supported/],
	];
	for (const [input, re] of cases) {
		const r = parseAiTemplate(input);
		assert.equal(r.ok, false, input);
		if (!r.ok) assert.match(r.error, re, input);
	}
});

test('strips scripts and event handlers instead of passing them through', () => {
	const r = parseAiTemplate(JSON.stringify({ blocks: [{ id: 'a', type: 'content', props: { text: '<p onclick="x()">hi<script>alert(1)</script></p>' } }] }));
	assert.equal(r.ok, true);
	if (r.ok) assert.doesNotMatch(JSON.stringify(r.blocks), /script|onclick/i);
});

test('warns about a field without a fallback and a missing footer', () => {
	const r = parseAiTemplate(JSON.stringify({ blocks: [{ id: 'a', type: 'heading', props: { text: 'Hi {{first_name}}' } }] }));
	assert.equal(r.ok, true);
	if (r.ok) {
		assert.ok(r.warnings.some((w) => /first_name/.test(w)));
		assert.ok(r.warnings.some((w) => /footer/.test(w)));
	}
});

test('extractJson prefers the fenced block', () => {
	assert.equal(extractJson('a {"x":1} b ```json\n{"y":2}\n``` c'), '{"y":2}');
});

test('prompt carries the brief and stays under the URL limit for both targets', () => {
	const p = buildAiPrompt('A black friday sale email for Kenyan shoppers');
	assert.ok(p.includes('black friday'));
	assert.ok(aiUrl('claude', p)?.startsWith('https://claude.ai/new?q='));
	assert.ok(aiUrl('chatgpt', p)?.startsWith('https://chatgpt.com/?q='));
	assert.equal(aiUrl('claude', p + 'x'.repeat(8000)), null);
});

test('every block type and prop the prompt names exists in the schema', () => {
	const lines = AI_SPEC.split('\n').filter((l) => /^- [a-z]+: /.test(l) && !/^- (ids|At most|Every|Colors|URLs|Rich|Dynamic|Keep)/.test(l));
	assert.equal(lines.length, 10);
	for (const line of lines) {
		const m = /^- ([a-z]+): (.*)$/.exec(line)!;
		const type = m[1] as keyof typeof BLOCK_SCHEMA;
		assert.ok(type in BLOCK_SCHEMA, type);
		// Props are the comma separated items that start with an identifier (parentheses may hold commas-free hints).
		const items = m[2].replace(/\([^)]*\)/g, '').split(',').map((s) => s.trim().split(' ')[0]).filter(Boolean);
		for (const key of items) assert.ok(key in BLOCK_SCHEMA[type], `${type}.${key}`);
	}
});
