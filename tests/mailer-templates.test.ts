import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	buildEnvelope, themeColorOf, detectUnsupportedSyntax, detectPlaceholders, classifyTag,
	readEnvelope, isValidMailerId,
} from '../src/lib/mailer-templates.ts';
import { sanitizeForOpen, MAX_BLOCKS } from '../src/lib/server/sanitize-blocks.ts';

const validateBlocks = (input: unknown) => readEnvelope({ format: 'axene-blocks', version: 1, blocks: input }, sanitizeForOpen);
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
		['js url', [{ id: 'a', type: 'image', props: { src: 'javascript:alert(1)' } }]],
		['entity js url', [{ id: 'a', type: 'button', props: { href: 'javascript&#58;alert(1)' } }]],
		['attr breakout', [{ id: 'a', type: 'header', props: { logoUrl: 'x" onerror="alert(1)' } }]],
		['color breakout', [{ id: 'a', type: 'heading', props: { color: '"><mj-raw><script>alert(1)</script></mj-raw>' } }]],
		['html in text', [{ id: 'a', type: 'content', props: { text: '<img src=x onerror=alert(1)>' } }]],
		['js href in text', [{ id: 'a', type: 'content', props: { text: '<a href="javascript&#58;alert(1)">x</a>' } }]],
		['infinite number', [{ id: 'a', type: 'heading', props: { fontSize: Infinity } }]],
	];
	for (const [name, input] of bad) assert.equal(validateBlocks(input).ok, false, name);
});

test('validateBlocks caps total size', () => {
	const big = Array.from({ length: 100 }, (_, i) => ({ id: 'i' + i, type: 'content', props: { a: 'x'.repeat(15_000), b: 'y'.repeat(15_000), c: 'z'.repeat(15_000) } }));
	assert.equal(validateBlocks(big).ok, false);
});

test('unknown and prototype-polluting props are dropped, never copied', () => {
	const r = validateBlocks([{ id: 'a', type: 'heading', props: { ...JSON.parse('{"__proto__":{"x":1}}'), n: { constructor: 1 }, text: 'Hi' } }]) as any;
	assert.equal(r.ok, true);
	// Missing props take the heading defaults; the unknown and prototype keys are not copied.
	assert.equal(r.blocks[0].props.text, 'Hi');
	for (const k of ['n', 'x', '__proto__']) assert.equal(Object.hasOwn(r.blocks[0].props, k), false, k);
	assert.equal(({} as any).x, undefined);
});

test('readEnvelope: axene-blocks ok, classic and others refused', () => {
	const ok = readEnvelope(buildEnvelope([header, heading]), sanitizeForOpen);
	assert.equal(ok.ok, true);
	assert.deepEqual(readEnvelope(null, sanitizeForOpen), { ok: false, reason: 'classic' });
	assert.deepEqual(readEnvelope({ blocks: [{ type: 'text' }] }, sanitizeForOpen), { ok: false, reason: 'classic' });
	assert.deepEqual(readEnvelope({ format: 'grapes', blocks: [] }, sanitizeForOpen), { ok: false, reason: 'classic' });
	assert.deepEqual(readEnvelope([], sanitizeForOpen), { ok: false, reason: 'classic' });
	assert.equal((readEnvelope({ format: 'axene-blocks', version: 2, blocks: [header] }, sanitizeForOpen) as any).reason, 'unsupported_version');
	assert.equal((readEnvelope({ format: 'axene-blocks', version: 1, blocks: 'nope' }, sanitizeForOpen) as any).reason, 'invalid');
	assert.equal((readEnvelope({ format: 'axene-blocks', version: 1, blocks: [{ id: 'a', type: 'evil', props: {} }] }, sanitizeForOpen) as any).reason, 'invalid');
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

import { mapTemplateStatus, planLimitMessage } from '../src/lib/server/mailer/errors.ts';

test('template errors: plan limit message is surfaced, other Mailer text is not', () => {
	const limit = "You've reached the maximum of 5 templates on the starter plan.";
	const e = mapTemplateStatus(403, limit, 'write');
	assert.equal(e.code, 'mailer_plan_limit');
	assert.ok(e.message.includes(limit));
	assert.equal(e.http, 403);
	const other = mapTemplateStatus(403, 'secret internal detail axm_k_leak', 'write');
	assert.equal(other.code, 'mailer_missing_scope');
	assert.ok(!other.message.includes('axm_k_leak'));
	assert.ok(other.message.includes('templates:write'));
	assert.ok(mapTemplateStatus(403, undefined, 'read').message.includes('templates:read'));
	assert.equal(planLimitMessage("You've reached the maximum of 5 templates on the <b>x</b> plan."), null);
	assert.equal(mapTemplateStatus(404, null, 'read').http, 404);
	assert.equal(mapTemplateStatus(401, null, 'read').code, 'mailer_key_invalid');
	assert.equal(mapTemplateStatus(0, null, 'write').http, 502);
});
