import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	buildEnvelope, themeColorOf, detectUnsupportedSyntax, detectPlaceholders, classifyTag,
	validateBlocks, readEnvelope, isValidMailerId, MAX_BLOCKS,
} from '../src/lib/mailer-templates.ts';
import { safeNext } from '../src/lib/safe-next.ts';

const header = { id: 'b1', type: 'header', props: { companyName: 'Acme', accentColor: '#ff0000', logoUrl: 'https://x.test/l.png' } };
const heading = { id: 'b2', type: 'heading', props: { text: 'Hello {{name}} and {{ company }}' } };

test('themeColorOf uses the header accent, falls back to the default', () => {
	assert.equal(themeColorOf([header, heading]), '#ff0000');
	assert.equal(themeColorOf([heading]), '#1daa82');
	assert.equal(themeColorOf([{ id: 'h', type: 'header', props: {} }]), '#1daa82');
});

test('buildEnvelope has the exact Mailer shape', () => {
	const blocks = [header, heading];
	assert.deepEqual(buildEnvelope(blocks), { format: 'axene-blocks', version: 1, blocks, themeColor: '#ff0000' });
	assert.equal(buildEnvelope(blocks, '#000000').themeColor, '#000000');
	assert.deepEqual(Object.keys(buildEnvelope(blocks)), ['format', 'version', 'blocks', 'themeColor']);
});

test('plain placeholders are supported, in any spacing', () => {
	assert.equal(classifyTag('{{name}}'), null);
	assert.equal(classifyTag('{{ name }}'), null);
	assert.equal(classifyTag('{{first_name2}}'), null);
	assert.deepEqual(detectUnsupportedSyntax([heading]), []);
	assert.deepEqual(detectPlaceholders([heading]).sort(), ['company', 'name']);
});

test('unsupported Handlebars syntax is detected and listed', () => {
	const blocks = [{ id: 'a', type: 'content', props: {
		text: '{{#each items}}{{name}}{{/each}} {{#if paid}}x{{else}}y{{/if}} {{user.name}} {{{raw}}} {{upper name}} {{> part}} {{! c }}',
	} }];
	const found = detectUnsupportedSyntax(blocks).map((f) => f.text);
	for (const t of ['{{#each items}}', '{{/each}}', '{{#if paid}}', '{{else}}', '{{/if}}', '{{user.name}}', '{{{raw}}}', '{{upper name}}', '{{> part}}', '{{! c }}']) {
		assert.ok(found.includes(t), `missing ${t}: ${JSON.stringify(found)}`);
	}
	assert.ok(!found.includes('{{name}}'));
});

test('unsupported syntax is found in nested props and deduplicated', () => {
	const blocks = [{ id: 'a', type: 'list', props: { items: [{ t: '{{a.b}}' }, { t: '{{a.b}}' }] } }];
	assert.equal(detectUnsupportedSyntax(blocks).length, 1);
});

test('validateBlocks accepts good blocks', () => {
	assert.equal(validateBlocks([header, heading]).ok, true);
});

test('validateBlocks rejects malicious or malformed payloads', () => {
	const bad: [string, unknown][] = [
		['not array', { id: 'a' }],
		['null', null],
		['empty', []],
		['string block', ['x']],
		['no id', [{ type: 'heading', props: {} }]],
		['numeric id', [{ id: 1, type: 'heading', props: {} }]],
		['unknown type', [{ id: 'a', type: 'script', props: {} }]],
		['no type', [{ id: 'a', props: {} }]],
		['no props', [{ id: 'a', type: 'heading' }]],
		['array props', [{ id: 'a', type: 'heading', props: [] }]],
		['dup ids', [{ id: 'a', type: 'heading', props: {} }, { id: 'a', type: 'heading', props: {} }]],
		['too many', Array.from({ length: MAX_BLOCKS + 1 }, (_, i) => ({ id: 'i' + i, type: 'heading', props: {} }))],
		['huge string', [{ id: 'a', type: 'heading', props: { text: 'x'.repeat(20_001) } }]],
		['proto key', [{ id: 'a', type: 'heading', props: JSON.parse('{"__proto__":{"x":1}}') }]],
		['constructor key', [{ id: 'a', type: 'heading', props: { n: { constructor: 1 } } }]],
		['js url', [{ id: 'a', type: 'image', props: { src: 'javascript:alert(1)' } }]],
		['attr breakout', [{ id: 'a', type: 'header', props: { logoUrl: 'x" onerror="alert(1)' } }]],
		['too deep', [{ id: 'a', type: 'heading', props: { a: { b: { c: { d: { e: { f: { g: { h: { i: 1 } } } } } } } } } }]],
		['infinite number', [{ id: 'a', type: 'heading', props: { n: Infinity } }]],
	];
	for (const [name, input] of bad) assert.equal(validateBlocks(input).ok, false, name);
});

test('validateBlocks caps total size', () => {
	const big = Array.from({ length: 100 }, (_, i) => ({ id: 'i' + i, type: 'content', props: { a: 'x'.repeat(15_000), b: 'y'.repeat(15_000), c: 'z'.repeat(15_000) } }));
	assert.equal(validateBlocks(big).ok, false);
});

test('readEnvelope: axene-blocks ok, classic and others refused', () => {
	const ok = readEnvelope(buildEnvelope([header, heading]));
	assert.equal(ok.ok, true);
	assert.deepEqual(readEnvelope(null), { ok: false, reason: 'classic' });
	assert.deepEqual(readEnvelope({ blocks: [{ type: 'text' }] }), { ok: false, reason: 'classic' });
	assert.deepEqual(readEnvelope({ format: 'grapes', blocks: [] }), { ok: false, reason: 'classic' });
	assert.deepEqual(readEnvelope([]), { ok: false, reason: 'classic' });
	assert.equal((readEnvelope({ format: 'axene-blocks', version: 2, blocks: [header] }) as any).reason, 'unsupported_version');
	assert.equal((readEnvelope({ format: 'axene-blocks', version: 1, blocks: 'nope' }) as any).reason, 'invalid');
	assert.equal((readEnvelope({ format: 'axene-blocks', version: 1, blocks: [{ id: 'a', type: 'evil', props: {} }] }) as any).reason, 'invalid');
});

test('isValidMailerId', () => {
	assert.equal(isValidMailerId('3f2b8a1e-0c4d-4b6e-9a77-1c2d3e4f5a6b'), true);
	for (const bad of ['', '../x', 'a/b', 'a b', 'a?b', '%2e', 'x'.repeat(65), null, 5]) assert.equal(isValidMailerId(bad), false, String(bad));
});

test('safeNext accepts only same-origin relative paths', () => {
	assert.equal(safeNext('/editor?mailer=new'), '/editor?mailer=new');
	assert.equal(safeNext('/editor?mailer=3f2b8a1e-0c4d'), '/editor?mailer=3f2b8a1e-0c4d');
	for (const bad of [
		'//evil.test', '/\\evil.test', 'https://evil.test', 'http://evil.test/x', 'javascript:alert(1)', 'editor', '', '/.//evil.test',
		'/a\nb', '/a\tb', '/login', '/auth/google', '/x'.repeat(300), null, undefined, 5, '\\\\evil', '/%0d%0aLocation:x',
	]) {
		const r = safeNext(bad as any);
		assert.ok(r === null || (r.startsWith('/') && !r.startsWith('//')), String(bad));
		if (bad !== '/%0d%0aLocation:x') assert.equal(r, null, String(bad));
	}
});
