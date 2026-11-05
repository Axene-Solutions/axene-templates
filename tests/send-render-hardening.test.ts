// Regression tests for the local Send render path review (findings 1 to 11). Each test uses only
// exports that also exist on the code before the fix, so the same file fails there and passes here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sanitizeBlocks, sanitizeRichText, safeUrl, compiledHtmlProblem } from '../src/lib/server/sanitize-blocks.ts';
import { renderTemplateForSend, renderTemplateForMailer } from '../src/lib/server/render.ts';
import { prepareGrammar } from '../src/lib/placeholders.ts';
import { blocksToMjml } from '../src/lib/mjml.ts';
import { blockDefs, createBlock, type BlockType } from '../src/lib/blocks.ts';
import { starterTemplates } from '../src/lib/defaults.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const big = (s: string, n: number) => s.repeat(Math.ceil(n / s.length)).slice(0, n);
const content = (text: string, id = 'a') => ({ id, type: 'content', props: { text } });
const MB = 1024 * 1024;

/** Runs `fn` and reports wall time and the RSS growth it caused. */
function measure<T>(fn: () => T): { value: T; ms: number; rssMB: number } {
	const r0 = process.memoryUsage().rss;
	const t0 = performance.now();
	const value = fn();
	return { value, ms: performance.now() - t0, rssMB: (process.memoryUsage().rss - r0) / MB };
}

/** Renders for Send; throws if the render threw, returns the result otherwise. */
function send(blocks: unknown[], vars: Record<string, string> = {}, links = new Map<string, string>()) {
	return renderTemplateForSend(sanitizeBlocks(blocks, {}), vars, links) as any;
}

// ---- Finding 1: Handlebars must never run on block text ----

test('F1: a block of {{a}} x 3998 renders in a child process capped at a 64 MB heap, fast and small', () => {
	const reg = pathToFileURL(path.join(root, 'tests/support/register.mjs')).href;
	const src = (p: string) => JSON.stringify(pathToFileURL(path.join(root, p)).href);
	const code = `
		const { sanitizeBlocks } = await import(${src('src/lib/server/sanitize-blocks.ts')});
		const { renderTemplateForSend } = await import(${src('src/lib/server/render.ts')});
		const text = '{{a}}'.repeat(3998);
		const blocks = sanitizeBlocks([{ id: 'b0', type: 'content', props: { text } }], { strict: true });
		const r0 = process.memoryUsage().rss;
		const t0 = performance.now();
		const r = renderTemplateForSend(blocks, { a: 'v' }, new Map());
		console.log(JSON.stringify({ ok: r.ok, ms: performance.now() - t0, rssMB: (process.memoryUsage().rss - r0) / 1048576 }));
	`;
	const child = spawnSync(process.execPath, ['--max-old-space-size=64', '--import', reg, '--input-type=module', '-e', code], { encoding: 'utf8', timeout: 60_000 });
	assert.equal(child.status, 0, `child died (old code: heap out of memory): ${child.stderr.slice(-300)}`);
	const out = JSON.parse(child.stdout.trim().split('\n').pop()!);
	assert.equal(out.ok, true);
	// Before the fix: 281 ms and +95 MB RSS uncapped (peak 238 MB), and a fatal heap OOM at 64 MB.
	assert.ok(out.ms < 150, `took ${out.ms} ms`);
	assert.ok(out.rssMB < 30, `RSS grew ${out.rssMB} MB`);
});

test('F1: {{#each @root}} nested 10 deep is literal text, not a 10 MB expansion', () => {
	const text = '{{#each @root}}'.repeat(10) + 'x' + '{{/each}}'.repeat(10);
	const m = measure(() => send([content(text)], { a: '1', b: '2' }));
	assert.equal(m.value.ok, true);
	assert.ok(m.ms < 500, `took ${m.ms} ms`);
	assert.ok(m.rssMB < 60, `RSS grew ${m.rssMB} MB`);
	assert.ok(m.value.html.length < 50_000, `html is ${m.value.html.length} chars`);
	assert.ok(m.value.html.includes('&#123;&#123;#each @root&#125;&#125;'), 'shown as visible text');
	assert.ok(!m.value.html.includes('{{#each'), 'never left as live syntax');
});

test('F1/F9: {{log}} writes nothing to the server log and is shown literally', () => {
	const seen: unknown[] = [];
	const saved = { error: console.error, log: console.log, warn: console.warn, info: console.info, debug: console.debug };
	for (const k of Object.keys(saved) as (keyof typeof saved)[]) console[k] = (...a: unknown[]) => void seen.push(a);
	let r: any;
	try {
		r = send([content('{{log "hello from template" level="error"}}')]);
	} finally {
		Object.assign(console, saved);
	}
	assert.deepEqual(seen.filter((a) => JSON.stringify(a).includes('hello from template')), []);
	assert.equal(r.ok, true);
	assert.ok(r.html.includes('&#123;&#123;log &quot;hello from template&quot; level=&quot;error&quot;&#125;&#125;') || r.html.includes('&#123;&#123;log'), r.html.slice(0, 200));
});

test('F1: a recursive inline partial is literal text, never executed', () => {
	const m = measure(() => send([content('{{#*inline "a"}}{{> a}}{{/inline}}{{> a}}')]));
	assert.equal(m.value.ok, true);
	assert.ok(m.ms < 500);
	assert.ok(m.value.html.includes('&#123;&#123;&gt; a&#125;&#125;') || m.value.html.includes('&#123;&#123;> a&#125;&#125;'));
});

test('F1: comments, triple braces, helpers and dotted paths are shown, not evaluated', () => {
	const r = send([content('A{{! hidden }}B{{!-- also --}}C {{{raw}}} {{upper name}} {{user.name}} {{name}}')], { name: 'N', raw: '<b>x</b>' });
	assert.equal(r.ok, true);
	for (const t of ['! hidden ', '!-- also --', '&#123;raw&#125;', 'upper name', 'user.name']) assert.ok(r.html.includes(`&#123;&#123;${t}`), t);
	assert.ok(!r.html.includes('<b>x</b>'));
	assert.ok(r.html.includes(' N<') || r.html.includes(' N\n') || r.html.includes(' N'), 'the plain field still fills');
});

test('F1: a strict save refuses unsupported constructs with a clear message', () => {
	for (const [text, part] of [
		['{{#each items}}x{{/each}}', '{{#each items}}'],
		['{{> part}}', '{{> part}}'],
		['{{{raw}}}', '{{{raw}}}'],
		['{{! c }}', '{{! c }}'],
		['{{!-- c --}}', '{{!-- c --}}'],
		['{{upper name}}', '{{upper name}}'],
		['{{a.b}}', '{{a.b}}'],
		['{{log "x" level="error"}}', '{{log'],
		['{{{{raw}}}}x{{{{/raw}}}}', '{{'],
	]) {
		assert.throws(() => sanitizeBlocks([content(text)], { strict: true }), (e: any) => e.code === 'invalid_blocks' && /not supported/.test(e.message) && e.message.includes(part), text);
	}
	// The supported grammar still saves.
	assert.equal(sanitizeBlocks([content('Hi {{name}}, {{ name }}, {{first|friend}} <a href="{{link:pay}}">pay</a>')], { strict: true }).length, 1);
});

test('F1: total rendered size above 2,000,000 characters is refused, never sent', () => {
	const text = '{{v}}'.repeat(3998);
	const m = measure(() => send([content(text)], { v: 'x'.repeat(600) }));
	assert.equal(m.value.ok, false, 'must refuse');
	assert.ok(m.rssMB < 200, `RSS grew ${m.rssMB} MB`);
});

// ---- Finding 2: comment spanning blocks, raw quotes, CSS escapes ----

const overlay = '--}}https://ok" style="position:fixed;top:0;left:0;width:100%;height:100%">Click';
const spanning = [
	{ id: 'f', type: 'footer', props: { text: 'hi', links: [{ label: 'x', url: '{{!--' }], unsubUrl: '', companyName: '', companyAddress: '' } },
	{ id: 'b', type: 'content', props: { text: overlay } },
];

test('F2: the comment-spanning payload is refused on strict save', () => {
	assert.throws(() => sanitizeBlocks(spanning, { strict: true }), /not supported|safe URL/);
});

test('F2: a stored row with the payload renders with no attacker attribute', () => {
	const r = send(spanning);
	assert.equal(r.ok, true);
	assert.doesNotMatch(r.html, /style="position:fixed/);
	for (const a of r.html.match(/<a [^>]*>/g) ?? []) assert.doesNotMatch(a, /position|style="width/, a);
	assert.equal(compiledHtmlProblem(r.html), null);
});

test('F2: safeUrl refuses any {{ that is not a supported placeholder', () => {
	for (const u of ['{{!--', '#{{!--', 'https://x.test/{{!--', 'https://x.test/{{', '{{{x}}}', 'https://x.test/{{a}}{{#if}}']) assert.equal(safeUrl(u), null, u);
	assert.equal(safeUrl('https://x.test/{{id}}?e={{email|none}}'), 'https://x.test/{{id}}?e={{email|none}}');
});

test('F2: rich text never carries a raw quote or > that could end an attribute', () => {
	for (const t of ['x" onmouseover="a(1)', "x' onmouseover='a(1)", 'a > b', '<b>x</b>" y=\'z\' >', overlay]) {
		const out = sanitizeRichText(t).replace(/<\/?(?:b|strong|i|em|u|br|p|span|ul|ol|li)>|<a href="[^"]*" rel="noopener noreferrer" target="_blank">|<\/a>/g, '');
		assert.doesNotMatch(out, /["'<>]/, `${t} -> ${out}`);
	}
});

test('F2: the tripwire decodes CSS escapes and catches full screen overlays', () => {
	for (const h of [
		'<a href="https://ok" style="width:expr\\65ssion(alert(1))">x</a>',
		'<a href="https://ok" style="width:expr\\000065 ssion(alert(1))">x</a>',
		'<a style="background:u\\72l(javascript:alert(1))">x</a>',
		'<a href="https://ok" style="position:fixed;top:0;left:0;width:100%;height:100%">Click</a>',
	]) assert.notEqual(compiledHtmlProblem(h), null, h);
	assert.equal(compiledHtmlProblem('<p style="position:relative;top:0">ok</p><td style="width:100%">x</td>'), null);
});

// ---- Finding 3: placeholder values in URL attributes ----

test('F3: a leading placeholder must be the whole URL or be followed by / ? #', () => {
	for (const u of ['{{name}}:alert(1)', '{{x|/ok}}script:alert(1)', '{{name}}x', '{{link:k}}script:1']) assert.equal(safeUrl(u), null, u);
	for (const u of ['{{name}}', '{{site}}/path', '{{site|https://a.test}}?q=1', '{{site}}#top', '{{link:k}}']) assert.equal(safeUrl(u), u, u);
});

test('F3: the verified bypasses never produce a script or data URL', () => {
	const btn = (href: string) => [{ id: 'a', type: 'button', props: { text: 'Go', href } }];
	for (const [href, vars] of [
		['{{name}}:alert(1)', { name: 'javascript' }],
		['{{x|/ok}}script:alert(1)', { x: 'java' }],
		['{{name}}', { name: 'data:image/svg+xml,abc' }],
		['{{name}}', { name: 'javascript:alert(1)' }],
		['{{name}}', { name: ' JaVa\tScRiPt:alert(1)' }],
		['{{name}}', { name: 'vbscript:x' }],
	] as [string, Record<string, string>][]) {
		const r = send(btn(href), vars);
		if (r.ok) assert.doesNotMatch(r.html, /href="\s*(?:javascript|data|vbscript):/i, `${href} ${JSON.stringify(vars)}`);
		else assert.ok(r.badUrls.length > 0, JSON.stringify(r));
	}
	const d = send(btn('{{name}}'), { name: 'data:image/svg+xml,abc' });
	assert.equal(d.ok, false);
	assert.deepEqual(d.badUrls, ['name']);
	// An image source only takes http, https or relative.
	const img = send([{ id: 'i', type: 'image', props: { src: '{{img}}', alt: 'x', width: 100 } }], { img: 'mailto:a@b.test' });
	assert.equal(img.ok, false);
	// Safe values still work, and a later value is percent-encoded.
	const ok = send(btn('https://shop.test/{{id}}'), { id: 'a b"c' });
	assert.equal(ok.ok, true);
	assert.match(ok.html, /href="https:\/\/shop\.test\/a%20b%22c"/);
	const tel = send(btn('{{phone}}'), { phone: 'tel:+254700000000' });
	assert.equal(tel.ok, true);
});

// ---- Finding 4: missing props ----

const TYPES = blockDefs.map((d) => d.type) as BlockType[];

test('F4: every block type with empty props passes strict save and renders with no undefined', () => {
	for (const type of TYPES) {
		const blocks = sanitizeBlocks([{ id: 'a', type, props: {} }], { strict: true });
		const mjml = blocksToMjml(blocks);
		assert.doesNotMatch(mjml, /undefined|NaN/, type);
		assert.doesNotThrow(() => renderTemplateForMailer(blocks), type);
		const r = renderTemplateForSend(blocks, {}, new Map()) as any;
		assert.equal(r.ok, true, type);
	}
});

test('F4: blocksToMjml tolerates missing arrays', () => {
	for (const type of ['list', 'table', 'footer'] as BlockType[]) {
		const b = createBlock(type);
		delete b.props.items;
		delete b.props.rows;
		delete b.props.links;
		assert.doesNotThrow(() => blocksToMjml([b]), type);
	}
});

// ---- Finding 5: the tripwire is linear and refuses what it cannot read ----

test('F5: tags the tripwire cannot tokenise are refused quickly', () => {
	for (const h of [big('<a ', 20_000), '<a' + ' x="1"'.repeat(22) + ' "', '<a' + ' x="1"'.repeat(200) + ' "', '<a b'.repeat(8000)]) {
		const m = measure(() => compiledHtmlProblem(h));
		assert.notEqual(m.value, null, h.slice(0, 30));
		assert.ok(m.ms < 50, `${h.slice(0, 20)} took ${m.ms} ms`);
		assert.ok(m.rssMB < 30);
	}
	const fine = measure(() => compiledHtmlProblem('<p x="1">t</p>'.repeat(70_000)));
	assert.equal(fine.value, null);
	assert.ok(fine.ms < 500, `1 MB of good tags took ${fine.ms} ms`);
});

// ---- Finding 6: the tag cap refuses instead of ignoring ----

const capped = [content('{{a}}'.repeat(3990), 'a'), content('{{a}}'.repeat(1100) + '{{link:k}}', 'c')];

test('F6: more than 5000 placeholders refuses the render, for Send and for Mailer', () => {
	const r = renderTemplateForSend(sanitizeBlocks(capped, {}), { a: 'v' }, new Map()) as any;
	assert.equal(r.ok, false);
	assert.throws(() => renderTemplateForMailer(sanitizeBlocks(capped, {})));
});

test('F6: more than 5000 placeholders refuses the strict save', () => {
	assert.throws(() => sanitizeBlocks(capped, { strict: true }), /5000/);
});

// ---- Finding 7: no look-back per tag ----

test('F7: URL attribute detection is linear in the input', () => {
	const src = '<' + (' href="{{a|b}}' + 'x'.repeat(190)).repeat(4900);
	const m = measure(() => prepareGrammar(src, {}, new Map(), 'n'));
	assert.ok(m.ms < 400, `took ${m.ms} ms`);
	assert.ok(m.rssMB < 100, `RSS grew ${m.rssMB} MB`);
});

// ---- Finding 8: size after cleaning ----

test('F8: sanitised output above 1.5 MB is refused in strict and normal mode', () => {
	const blocks = Array.from({ length: 49 }, (_, i) => content(big('<', 19_990), 'b' + i));
	for (const strict of [true, false]) {
		const m = measure(() => {
			try {
				return JSON.stringify(sanitizeBlocks(blocks, { strict })).length;
			} catch (e) {
				return e as Error;
			}
		});
		assert.ok(m.value instanceof Error && /too large/.test(m.value.message), `strict=${strict}: ${typeof m.value === 'number' ? m.value + ' chars stored' : m.value}`);
		assert.ok(m.ms < 2000);
	}
});

// ---- Finding 10: colour tokens are resolved at every sink ----

const COLOR_PROPS = ['backgroundColor', 'color', 'bulletColor', 'headerBg', 'headerColor', 'cellColor', 'borderColor', 'linkColor'];

test('F10: no emitted attribute holds theme, undefined or null, for every block type, in both themes', () => {
	for (const accent of ['#ffd100', '#333533']) {
		for (const token of [null, 'theme', 'theme-light', 'theme-dark']) {
			for (const type of TYPES) {
				const header = createBlock('header');
				header.props.accentColor = accent;
				const b = createBlock(type);
				if (token) for (const k of COLOR_PROPS) if (k in b.props) b.props[k] = token;
				const mjml = blocksToMjml(type === 'header' ? [Object.assign(b, { props: { ...b.props, accentColor: accent } })] : [header, b]);
				for (const attr of mjml.match(/[a-z-]+="[^"]*"/g) ?? []) {
					assert.doesNotMatch(attr, /\b(?:theme|undefined|null|NaN)\b/, `${type} ${token} ${accent}: ${attr}`);
				}
			}
		}
	}
});

// ---- Finding 11: memory cap for the app container ----

// ---- Starters and defaults still render ----

test('every starter and default block renders for Send with no inert braces and a clean tripwire', () => {
	const vars = { reset_url: 'https://app.test/reset?t=1', verify_url: 'https://app.test/v?t=2', unsubscribe_url: 'https://app.test/u?t=3' };
	for (const t of starterTemplates) {
		const r = renderTemplateForSend(sanitizeBlocks(t.blocks, { strict: true }), vars, new Map()) as any;
		assert.equal(r.ok, true, t.id);
		assert.doesNotMatch(r.html, /&#123;|\{\{/, t.id);
		assert.equal(compiledHtmlProblem(r.html), null, t.id);
	}
	for (const type of TYPES) {
		const r = renderTemplateForSend(sanitizeBlocks([createBlock(type)], { strict: true }), vars, new Map()) as any;
		assert.equal(r.ok, true, type);
		assert.equal(compiledHtmlProblem(r.html), null, type);
	}
});
