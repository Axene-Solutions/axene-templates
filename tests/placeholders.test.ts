import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	parseTag, scanTags, analyzePlaceholders, expandLink, prepareGrammar, fillSlots, linkUrlError,
	fallbackError, suggestLinkKey, formatField, formatLink, splitForChips, linkFieldNeeds,
} from '../src/lib/placeholders.ts';
import { detectUnsupportedSyntax, classifyTag } from '../src/lib/mailer-templates.ts';

test('the new grammar is valid, Handlebars logic is not', () => {
	for (const ok of ['{{name}}', '{{ name }}', '{{name|there}}', '{{ name|a friend }}', '{{link:pay_now}}', '{{ link:pay_now }}']) {
		assert.equal(classifyTag(ok), null, ok);
	}
	for (const bad of ['{{#if a}}', '{{/if}}', '{{a.b}}', '{{{x}}}', '{{upper name}}', '{{name|}}', '{{name|a|b}}', '{{link:bad key}}', '{{> p}}']) {
		assert.notEqual(classifyTag(bad), null, bad);
	}
	assert.equal(classifyTag('{{name|' + 'x'.repeat(101) + '}}') !== null, true);
	assert.equal(classifyTag('{{name|' + 'x'.repeat(100) + '}}'), null);
	const blocks = [{ id: 'a', type: 'content', props: { text: '{{name|friend}} {{link:pay_now}} {{#if x}}' } }];
	assert.deepEqual(detectUnsupportedSyntax(blocks).map((u) => u.text), ['{{#if x}}']);
});

test('parseTag returns key and fallback', () => {
	assert.deepEqual(parseTag('{{ first_name | there }}'), { kind: 'field', raw: '{{ first_name | there }}', key: 'first_name', fallback: 'there' });
	assert.equal((parseTag('{{link:pay_now}}') as any).key, 'pay_now');
	assert.equal(formatField('name', 'friend'), '{{name|friend}}');
	assert.equal(formatField('name'), '{{name}}');
	assert.equal(formatLink('pay_now'), '{{link:pay_now}}');
});

test('fallback rules', () => {
	assert.equal(fallbackError('there'), null);
	assert.ok(fallbackError(''));
	assert.ok(fallbackError('a|b'));
	assert.ok(fallbackError('a{b'));
	assert.ok(fallbackError('a}b'));
	assert.ok(fallbackError('x'.repeat(101)));
	assert.ok(fallbackError('a\nb'));
});

test('analyzePlaceholders flags unknown fields and links only when they are known to be unknown', () => {
	const blocks = [{ id: 'a', type: 'content', props: { text: '{{name}} {{order_id}} {{plan|free}} {{ghost}} {{link:pay_now}} {{link:nope}} {{#if x}}' } }];
	const ctx = { fields: new Set(['order_id']), links: new Set(['pay_now']) };
	const got = analyzePlaceholders(blocks, ctx).map((i) => `${i.kind}:${i.text}`);
	assert.deepEqual(got, ['unknown_field:{{ghost}}', 'unknown_link:{{link:nope}}', 'unsupported:{{#if x}}']);
	// Not loaded: only the syntax problem is reported.
	const offline = analyzePlaceholders(blocks, { fields: null, links: null }).map((i) => i.kind);
	assert.deepEqual(offline, ['unsupported']);
});

test('expandLink percent-encodes values, uses fallbacks, refuses unsafe schemes and nested links', () => {
	const r = expandLink('https://pay.example.com/{{order_id}}?e={{email}}&n={{name|friend & co}}', { order_id: 'a/b c', email: 'x+y@z.test' });
	assert.deepEqual(r, { ok: true, url: 'https://pay.example.com/a%2Fb%20c?e=x%2By%40z.test&n=friend%20%26%20co' });
	assert.equal(expandLink('https://x.test/{{id}}', {}).ok, false);
	assert.equal(expandLink('javascript:alert(1)', {}).ok, false);
	assert.equal(expandLink('data:text/html,hi', {}).ok, false);
	assert.equal(expandLink('  JAVASCRIPT:alert(1)', {}).ok, false);
	assert.equal(expandLink('{{u}}', { u: 'javascript:alert(1)' }).ok, false);
	assert.equal(expandLink('https://x.test/{{link:other}}', {}).ok, false);
	assert.equal(expandLink('mailto:a@b.test', {}).ok, true);
	// A value that looks like a tag is encoded, not rendered.
	const v = expandLink('https://x.test/{{q}}', { q: '{{secret}}' });
	assert.deepEqual(v, { ok: true, url: 'https://x.test/%7B%7Bsecret%7D%7D' });
});

test('prepareGrammar: fallbacks, links, one level only, values are not rendered again', () => {
	const links = new Map([
		['pay_now', 'https://pay.example.com/{{order_id}}'],
		['outer', 'https://x.test/{{link:pay_now}}'],
		['evil', 'javascript:alert(1)'],
	]);
	const src = '<a href="{{link:pay_now}}">Hi {{name|friend}} {{plain}} {{ghost|x<b>}}</a>';
	const p = prepareGrammar(src, { order_id: '{{name}}', name: '{{order_id}}' }, links, 'n0nce');
	assert.deepEqual(p.unknownLinks, []);
	// {{plain}} is left for Handlebars, the rest became slots.
	assert.ok(p.template.includes('{{plain}}'));
	assert.ok(!p.template.includes('{{name|friend}}'));
	const out = fillSlots(p.template, p.slots, 'n0nce');
	assert.ok(out.includes('href="https://pay.example.com/%7B%7Bname%7D%7D"'), out);
	// The value of name contains a tag and is output as literal text.
	assert.ok(out.includes('Hi {{order_id}}'), out);
	assert.ok(out.includes('x&lt;b&gt;'), out);

	const q = prepareGrammar('{{link:outer}} {{link:evil}} {{link:missing}} {{link:missing}}', {}, links, 'n');
	assert.deepEqual(q.unknownLinks, ['missing']);
	assert.deepEqual(q.badLinks.map((b) => b.key).sort(), ['evil', 'outer']);
	assert.deepEqual(fillSlots(q.template, q.slots, 'n').trim(), '');
});

test('prepareGrammar escapes markup in values and in link urls', () => {
	const p = prepareGrammar('{{name|x}} {{link:l}}', { name: '<script>"&' }, new Map([['l', 'https://x.test/?a=1&b="2"']]), 'z');
	const out = fillSlots(p.template, p.slots, 'z');
	assert.ok(!out.includes('<script>'));
	assert.ok(out.includes('&lt;script&gt;&quot;&amp;'));
	assert.ok(out.includes('&amp;b='));
});

test('linkFieldNeeds lists bare fields of used links only', () => {
	const links = new Map([['a', 'https://x.test/{{id}}/{{t|z}}'], ['b', 'https://y.test/{{other}}']]);
	assert.deepEqual([...linkFieldNeeds(['a'], links)], ['id']);
});

test('linkUrlError mirrors the server rules', () => {
	assert.equal(linkUrlError('https://pay.example.com/{{order_id}}'), null);
	assert.equal(linkUrlError('https://x.test/{{id|none}}'), null);
	assert.equal(linkUrlError('mailto:a@b.test'), null);
	for (const bad of ['', 'ftp://x.test', 'javascript:alert(1)', 'https://x.test/{{link:a}}', 'https://x.test/{{#if a}}', 'https://x.test/a b', 'https://x.test/{oops}', 'https://x.test/' + 'a'.repeat(2000)]) {
		assert.notEqual(linkUrlError(bad), null, bad);
	}
});

test('suggestLinkKey', () => {
	assert.equal(suggestLinkKey('Pay now'), 'pay_now');
	assert.equal(suggestLinkKey('  !! '), '');
	assert.equal(suggestLinkKey('2024 sale'), 'l_2024_sale');
});

test('splitForChips keeps the text and marks tags', () => {
	const parts = splitForChips('Hi {{name|you}}, {{#if x}} bye');
	assert.equal(parts.map((p) => p.text).join(''), 'Hi {{name|you}}, {{#if x}} bye');
	assert.deepEqual(parts.filter((p) => p.tag).map((p) => p.tag!.kind), ['field', 'unsupported']);
});

test('pathological input stays fast', () => {
	const inputs = [
		'{{'.repeat(200_000),
		'{{{'.repeat(100_000),
		'{{a|' + 'x'.repeat(500_000),
		'{{' + ' '.repeat(500_000) + '}}',
		'{{x}}'.repeat(100_000),
		'}}{{'.repeat(150_000),
		'{{link:' + 'a'.repeat(300_000),
	];
	for (const s of inputs) {
		const t = performance.now();
		scanTags(s);
		prepareGrammar(s, {}, new Map(), 'n');
		const ms = performance.now() - t;
		assert.ok(ms < 1500, `${s.slice(0, 12)} took ${ms}ms`);
	}
});

test('prepareGrammar: a fallback or value that would set the scheme of an href or src is refused', () => {
	const none = new Map<string, string>();
	const cases: [string, Record<string, string>][] = [
		['<a href="{{site|javascript:alert(1)}}">x</a>', {}],
		['<a href="{{site|https://ok.test}}">x</a>', { site: 'javascript:alert(1)' }],
		['<img src="{{img|vbscript:x}}">', {}],
		['<a href="java{{x|script:alert(1)}}">x</a>', {}],
		['<a href=\'{{site|data:text/html,x}}\'>x</a>', {}],
		['<mj-button href="{{site|JavaScript:alert(1)}}">Go</mj-button>', {}],
	];
	for (const [src, values] of cases) {
		const p = prepareGrammar(src, values, none, 'n');
		assert.equal(p.badUrls.length, 1, src);
		assert.doesNotMatch(fillSlots(p.template, p.slots, 'n'), /script:|data:/i, src);
	}
	// Safe forms are untouched, and text outside attributes is never judged as a URL.
	const ok = prepareGrammar('<a href="{{site|https://ok.test}}">{{label|Read: more}}</a> <a href="https://x.test/?q={{q|a:b}}">y</a> <a href="mailto:{{email|a@b.test}}">m</a>', {}, none, 'n');
	assert.deepEqual(ok.badUrls, []);
	assert.equal(fillSlots(ok.template, ok.slots, 'n'), '<a href="https://ok.test">Read: more</a> <a href="https://x.test/?q=a:b">y</a> <a href="mailto:a@b.test">m</a>');
});
