import { test } from 'node:test';
import assert from 'node:assert/strict';
import mjml2html from 'mjml';
import {
	sanitizeBlocks, sanitizeBlocksForRead, sanitizeRichText, safeUrl, isColor, compiledHtmlProblem,
	BlocksValidationError, MAX_BLOCKS, BLOCK_SCHEMA,
} from '../src/lib/server/sanitize-blocks.ts';
import { blocksToMjml } from '../src/lib/mjml.ts';
import { starterTemplates } from '../src/lib/defaults.ts';
import { blockDefs } from '../src/lib/blocks.ts';

const compile = (blocks: unknown[]) => mjml2html(blocksToMjml(blocks as any), { keepComments: false, minify: true, validationLevel: 'soft' }).html;

/** Executable markup in rendered HTML: what a browser would run. */
function executable(html: string): string[] {
	const found: string[] = [];
	if (/<\s*script/i.test(html)) found.push('script tag');
	if (/<\s*\/?\s*mj-raw/i.test(html)) found.push('mj-raw');
	if (/<\s*(svg|iframe|object|embed|math|base|form)\b/i.test(html)) found.push('embed');
	// Attribute by attribute, the way a browser tokenises a start tag.
	const startTag = /<[a-z][a-z0-9-]*((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*\/?>/gi;
	const attr = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
	for (const m of html.matchAll(startTag)) {
		for (const a of m[1].matchAll(attr)) {
			if (/^on/i.test(a[1])) found.push('handler: ' + m[0].slice(0, 80));
			const raw = a[2] ?? a[3] ?? a[4] ?? '';
			const v = raw.replace(/&#x?[0-9a-f]+;?|&[a-z]+;/gi, (e) => {
				const n = e.startsWith('&#x') || e.startsWith('&#X') ? parseInt(e.slice(3), 16) : e.startsWith('&#') ? parseInt(e.slice(2), 10) : NaN;
				return Number.isFinite(n) ? String.fromCodePoint(n) : ({ '&colon;': ':', '&tab;': '\t', '&newline;': '\n' } as Record<string, string>)[e.toLowerCase()] ?? e;
			}).replace(/[\u0000- ]/g, '').toLowerCase();
			if (/^(javascript|vbscript):|^data:text\/html/.test(v)) found.push('script url: ' + raw.slice(0, 60));
			if (/url\(\s*['"]?\s*javascript|expression\(/.test(v)) found.push('css script');
		}
	}
	return found;
}

const HTML_PAYLOADS = [
	'<script>window.__pwned=1</script>',
	'<SCRIPT SRC=//evil.test/x.js></SCRIPT>',
	'<img src=x onerror="window.__pwned=1">',
	'<IMG SRC=x OnErRoR=window.__pwned=1>',
	'<svg onload=window.__pwned=1><circle/></svg>',
	'<a href="javascript:window.__pwned=1">x</a>',
	'<a href="JaVaScRiPt:window.__pwned=1">x</a>',
	'<a href="javascript&#58;window.__pwned=1">x</a>',
	'<a href="javascript&#x3A;window.__pwned=1">x</a>',
	'<a href="java&#x09;script:window.__pwned=1">x</a>',
	'<a href="&Tab;javascript&colon;window.__pwned=1">x</a>',
	'<a href=" \u0001javascript:window.__pwned=1">x</a>',
	'<a href="jav\u0000ascript:window.__pwned=1">x</a>',
	'<a href="vbscript:msgbox(1)">x</a>',
	'<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">x</a>',
	'<a href="{{x|javascript:window.__pwned=1}}">x</a>',
	'<mj-raw><script>window.__pwned=1</script></mj-raw>',
	'</mj-text></mj-column></mj-section><mj-raw><img src=x onerror=window.__pwned=1></mj-raw><mj-section><mj-column><mj-text>',
	'<span style="background:url(javascript:alert(1))">x</span>',
	'<p style="width:expression(alert(1))">x</p>',
	'<scr<script>ipt>window.__pwned=1</scr</script>ipt>',
	'<<img src=x onerror=window.__pwned=1>>',
	'<a href="https://ok.test" onclick="window.__pwned=1">x</a>',
	'<iframe srcdoc="<script>parent.__pwned=1</script>"></iframe>',
	'<form action="https://evil.test"><input name=x></form>',
	'<math><mtext><table><mglyph><style><img src=x onerror=window.__pwned=1>',
	'<noscript><p title="</noscript><img src=x onerror=window.__pwned=1>">',
	'<!--<img src=x onerror=window.__pwned=1>-->',
	'<style>@import "javascript:alert(1)"</style>',
	'<base href="javascript:alert(1)//">',
	'<details open ontoggle=window.__pwned=1>',
];

const ATTR_BREAKOUTS = ['"><mj-raw><script>window.__pwned=1</script></mj-raw>', '#fff" onmouseover="window.__pwned=1', 'red;background:url(javascript:alert(1))', 'expression(alert(1))', '12px" onload="x', '1"><svg onload=1>'];

const BLOCK = (type: string, props: Record<string, unknown>, id = 'b1') => [{ id, type, props }];

test('rich text: every payload is neutralised in the sanitiser output and in compiled HTML', () => {
	for (const p of HTML_PAYLOADS) {
		const out = sanitizeRichText(p);
		assert.doesNotMatch(out, /<script|onerror|onload|onclick|ontoggle|javascript:|vbscript:|data:text|mj-raw|<svg|<iframe|<form|<style|<base|expression\(/i, `sanitiser kept: ${p} -> ${out}`);
		for (const type of ['content', 'heading', 'subheading', 'button', 'footer']) {
			const blocks = sanitizeBlocks(BLOCK(type, { text: p }), { strict: true });
			const html = compile(blocks);
			assert.deepEqual(executable(html), [], `${type}: ${p}`);
			assert.equal(compiledHtmlProblem(html), null, `${type}: tripwire on ${p}`);
		}
		const list = sanitizeBlocks(BLOCK('list', { items: [p, 'ok'] }));
		assert.deepEqual(executable(compile(list)), [], `list: ${p}`);
		const table = sanitizeBlocks(BLOCK('table', { rows: [{ col1: p, col2: p }] }));
		assert.deepEqual(executable(compile(table)), [], `table: ${p}`);
	}
});

test('the unsanitised payloads really are executable (the corpus is meaningful)', () => {
	let hits = 0;
	for (const p of HTML_PAYLOADS) {
		try {
			if (executable(compile(BLOCK('content', { text: p }))).length) hits++;
		} catch {
			// minify refuses some malformed markup; those were never served
		}
	}
	assert.ok(hits >= 20, `only ${hits} payloads were executable before sanitising`);
	assert.ok(compiledHtmlProblem(compile(BLOCK('content', { text: '<img src=x onerror=alert(1)>' }))));
	assert.ok(compiledHtmlProblem(compile(BLOCK('heading', { text: 'x', color: ATTR_BREAKOUTS[0] }))));
});

test('attribute breakouts in non-HTML props are rejected when strict and defaulted on read', () => {
	const cases: [string, string][] = [
		['heading', 'color'], ['content', 'fontWeight'], ['content', 'lineHeight'], ['button', 'innerPadding'],
		['button', 'backgroundColor'], ['header', 'accentColor'], ['header', 'layout'], ['table', 'borderColor'],
		['footer', 'linkColor'], ['section', 'borderStyle'], ['content', 'align'], ['content', 'paddingTop'],
		['image', 'width'], ['button', 'fontSize'],
	];
	for (const [type, prop] of cases) {
		const def = blockDefs.find((d) => d.type === type)!.defaultProps;
		for (const bad of ATTR_BREAKOUTS) {
			assert.throws(() => sanitizeBlocks(BLOCK(type, { ...def, [prop]: bad }), { strict: true }), BlocksValidationError, `${type}.${prop}=${bad}`);
			const [b] = sanitizeBlocks(BLOCK(type, { ...def, [prop]: bad }));
			assert.deepEqual(b.props[prop], def[prop], `${type}.${prop} not reset`);
			assert.deepEqual(executable(compile([b])), []);
		}
	}
});

test('fontFamily and other unknown props are dropped', () => {
	const [b] = sanitizeBlocks(BLOCK('content', { text: 'x', fontFamily: '"><mj-raw><script>1</script>', __proto__x: 1, onclick: 'x' }), { strict: true });
	// Only schema props remain (missing ones filled with the content defaults).
	assert.deepEqual(Object.keys(b.props).sort(), Object.keys(BLOCK_SCHEMA.content).sort());
	assert.equal(b.props.text, 'x');
});

test('URL props: unsafe schemes and obfuscations are refused, safe forms survive', () => {
	const bad = [
		'javascript:alert(1)', 'JAVASCRIPT:alert(1)', ' javascript:alert(1)', 'java\tscript:alert(1)', 'java\u0000script:alert(1)',
		'javascript&#58;alert(1)', 'javascript&#x3a;alert(1)', 'javascript&colon;alert(1)', '&Tab;javascript:alert(1)', 'jav&#x09;ascript:alert(1)',
		'vbscript:x', 'data:text/html,<script>alert(1)</script>', 'data:image/svg+xml;base64,PHN2Zz4=', 'file:///etc/passwd',
		'https://ok.test/"onmouseover="alert(1)', 'https://ok.test/<script>', '{{x|javascript:alert(1)}}', '{{#if a}}x{{/if}}',
		'x'.repeat(2001), 'https://ok.test/\\x', 'https://a b.test',
	];
	for (const u of bad) assert.equal(safeUrl(u), null, u);
	const good = [
		'https://example.com', 'http://example.com/a?b=1&c=2#x', 'mailto:a@b.test?subject=Hi&body=x', 'tel:+254700000000',
		'/relative/path', 'page.html', '#', '?q=1', '', '{{unsubscribe_url}}', '{{link:shop}}', '{{verify_url}}',
		'https://example.com/?e={{email}}', '{{site|https://example.com}}', 'https://x.test/{{ code }}',
	];
	for (const u of good) assert.equal(safeUrl(u), u.trim(), u);
	for (const prop of ['logoUrl']) assert.throws(() => sanitizeBlocks(BLOCK('header', { [prop]: 'javascript:alert(1)' }), { strict: true }), /header.logoUrl/);
	assert.throws(() => sanitizeBlocks(BLOCK('footer', { links: [{ label: 'x', url: 'javascript:alert(1)' }] }), { strict: true }));
	const [f] = sanitizeBlocks(BLOCK('footer', { links: [{ label: 'bad', url: 'javascript:alert(1)' }, { label: 'ok', url: 'https://ok.test' }], unsubUrl: 'javascript:x' }));
	assert.deepEqual(f.props.links, [{ label: 'ok', url: 'https://ok.test' }]);
	assert.equal(f.props.unsubUrl, '{{unsubscribe_url}}');
});

test('colours: allowed shapes only', () => {
	for (const c of ['#fff', '#ffff', '#1daa82', '#1daa82ff', 'theme', 'theme-light', 'theme-dark', 'transparent', 'rgb(1,2,3)', 'rgba(1, 2, 3, 0.5)']) assert.ok(isColor(c), c);
	for (const c of ['red', '#ggg', 'rgb(1,2,3);x', 'url(x)', '#fff"', 'rgba(1,2,3,calc(1))', 'var(--x)', '']) assert.ok(!isColor(c), c);
	assert.throws(() => sanitizeBlocks(BLOCK('header', { accentColor: 'rgb(1,2,3)' }), { strict: true }), /hex colour/);
});

test('legitimate content survives sanitising unchanged in meaning', () => {
	const text = 'Hi {{first_name|there}}, <strong>bold</strong> <b>b</b> <em>em</em> <i>i</i> <u>u</u><br>'
		+ '<a href="https://example.com/x?a=1&amp;b=2">link</a> <a href="{{link:shop}}">shop</a> <a href="mailto:a@b.test">mail</a>'
		+ '<ul><li>one</li><li>two {{code}}</li></ul><ol><li>x</li></ol><p>para <span>span</span></p> Tom &amp; Jerry';
	const out = sanitizeRichText(text);
	for (const keep of ['{{first_name|there}}', '<strong>bold</strong>', '<b>b</b>', '<em>em</em>', '<i>i</i>', '<u>u</u>', '<br />', '<ul><li>one</li><li>two {{code}}</li></ul>', '<ol><li>x</li></ol>', '<p>para <span>span</span></p>', 'Tom &amp; Jerry']) {
		assert.ok(out.includes(keep), `lost ${keep} in ${out}`);
	}
	assert.match(out, /<a href="https:\/\/example.com\/x\?a=1&amp;b=2" rel="noopener noreferrer" target="_blank">link<\/a>/);
	assert.match(out, /<a href="\{\{link:shop\}\}" rel="noopener noreferrer" target="_blank">shop<\/a>/);
	assert.equal(sanitizeRichText(out), out, 'sanitising is idempotent');
	// Plain text without markup is kept byte for byte, including a bare ampersand.
	assert.equal(sanitizeRichText('Tom & Jerry {{name|Friend}}'), 'Tom & Jerry {{name|Friend}}');
	// span keeps no attributes, links keep only href.
	assert.equal(sanitizeRichText('<span style="color:red" class="x">s</span>'), '<span>s</span>');
	assert.equal(sanitizeRichText('<a href="#" title="t" style="x">a</a>'), '<a href="#" rel="noopener noreferrer" target="_blank">a</a>');
});

test('every starter template passes strict sanitising unchanged and the tripwire', () => {
	for (const s of starterTemplates) {
		const clean = sanitizeBlocks(s.blocks, { strict: true });
		// Unchanged apart from props the starter leaves out, which take the block defaults (a
		// header's missing accent colour is its background, so the theme stays the same).
		const expected = JSON.parse(JSON.stringify(s.blocks)).map((b: any) => {
			const props = { ...blockDefs.find((d) => d.type === b.type)!.defaultProps, ...b.props };
			if (b.type === 'header' && !b.props.accentColor) props.accentColor = b.props.backgroundColor;
			return { ...b, props };
		});
		assert.deepEqual(clean, expected, s.id);
		assert.equal(compiledHtmlProblem(compile(clean)), null, s.id);
	}
	for (const d of blockDefs) {
		const blocks = [{ id: 'x', type: d.type, props: d.defaultProps }];
		assert.equal(compiledHtmlProblem(compile(sanitizeBlocks(blocks, { strict: true }))), null, d.type);
	}
});

test('structure: types, ids, sizes and nulls', () => {
	assert.throws(() => sanitizeBlocks('x', { strict: true }), /array/);
	assert.throws(() => sanitizeBlocks([], { allowEmpty: false }), /empty/);
	assert.deepEqual(sanitizeBlocks([]), []);
	assert.throws(() => sanitizeBlocks(Array.from({ length: MAX_BLOCKS + 1 }, (_, i) => ({ id: 'b' + i, type: 'section', props: {} }))), /at most/);
	assert.throws(() => sanitizeBlocks(BLOCK('content', { text: 'x'.repeat(1_000_001) })), /too large/);
	assert.throws(() => sanitizeBlocks(BLOCK('content', { text: 'x'.repeat(20_001) }), { strict: true }), /content.text/);
	assert.throws(() => sanitizeBlocks(BLOCK('mj-raw', {}), { strict: true }), /unknown type/);
	assert.deepEqual(sanitizeBlocks(BLOCK('mj-raw', {})), []);
	assert.throws(() => sanitizeBlocks([{ id: 'a"><x', type: 'section', props: {} }], { strict: true }), /id/);
	assert.throws(() => sanitizeBlocks([...BLOCK('section', {}, 'a'), ...BLOCK('section', {}, 'a')], { strict: true }), /unique/);
	const dup = sanitizeBlocks([...BLOCK('section', {}, 'a'), ...BLOCK('section', {}, 'a')]);
	assert.notEqual(dup[0].id, dup[1].id);
	assert.throws(() => sanitizeBlocks([null], { strict: true }), /object/);
	assert.throws(() => sanitizeBlocks(BLOCK('list', { items: Array(101).fill('x') }), { strict: true }));
	assert.deepEqual(sanitizeBlocksForRead('garbage'), []);
	// Null bytes in text are removed.
	assert.equal(sanitizeBlocks(BLOCK('content', { text: 'a\u0000b' }))[0].props.text, 'ab');
	// The result has a plain prototype, never the input objects.
	const input = BLOCK('content', { text: 'x' });
	const out = sanitizeBlocks(input);
	assert.notEqual(out[0], input[0]);
	assert.notEqual(out[0].props, input[0].props);
});

test('the tripwire flags executable compiled HTML and passes normal output', () => {
	assert.equal(compiledHtmlProblem('<p><a href="https://x.test">x</a> learn javascript: today</p>'), null);
	assert.ok(compiledHtmlProblem('<p><script>1</script></p>'));
	assert.ok(compiledHtmlProblem('<img src=x onerror=1>'));
	assert.ok(compiledHtmlProblem('<a href="javascript&#58;1">x</a>'));
	assert.ok(compiledHtmlProblem('<a href="java&#x09;script:1">x</a>'));
	assert.ok(compiledHtmlProblem("<a href='vbscript:1'>x</a>"));
	assert.ok(compiledHtmlProblem('<iframe src="data:text/html,x"></iframe>'));
	assert.ok(compiledHtmlProblem('<mj-raw>x</mj-raw>'));
	assert.ok(compiledHtmlProblem('<div style="background:url(javascript:1)">'));
});

test('plain text props cannot break out of the attributes they are rendered into', () => {
	const props = { ...blockDefs.find((d) => d.type === 'image')!.defaultProps, alt: 'x" onerror="window.__pwned=1' };
	const html = compile(sanitizeBlocks(BLOCK('image', props), { strict: true }));
	assert.deepEqual(executable(html), []);
	assert.equal(compiledHtmlProblem(html), null);
	const footer = { ...blockDefs.find((d) => d.type === 'footer')!.defaultProps, companyName: '<img src=x onerror=1>', links: [{ label: '"><svg onload=1>', url: 'https://x.test' }] };
	assert.deepEqual(executable(compile(sanitizeBlocks(BLOCK('footer', footer), { strict: true }))), []);
});
