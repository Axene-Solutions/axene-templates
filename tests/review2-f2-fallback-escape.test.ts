// Review 2, finding 2: a fallback written in rich text reached Mailer HTML-escaped, and Mailer
// escaped it again (Tom &amp;amp; Jerry&amp;#39;s). Save to Mailer now writes the fallback back as
// raw text, and fallbacks may not hold " < > or a backtick (as they may not hold { } |).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderTemplateForMailer, renderTemplateForSend } from '../src/lib/server/render.ts';
import { sanitizeBlocks } from '../src/lib/server/sanitize-blocks.ts';
import { fallbackError, parseTag, prepareGrammar } from '../src/lib/placeholders.ts';
import { content } from './support/endpoint.ts';

const keep = (blocks: unknown[]) => renderTemplateForMailer(blocks).html;

test("F2: {{x|Tom & Jerry's}} in rich text reaches Mailer as raw text", () => {
	const html = keep([content("<p>Hi {{x|Tom & Jerry's}}</p>")]);
	assert.ok(html.includes("{{x|Tom & Jerry's}}"), html.slice(html.indexOf('Hi'), html.indexOf('Hi') + 60));
	assert.ok(!html.includes('Tom &amp; Jerry'));
	assert.ok(!html.includes('Jerry&#39;s'));
});

test('F2: a rich link fallback with & keeps every query parameter for Mailer', () => {
	const html = keep([content('<p><a href="{{promo|https://shop.test/?a=1&b=2}}">rich</a></p>')]);
	assert.ok(html.includes('href="{{promo|https://shop.test/?a=1&b=2}}"'), (html.match(/href="[^"]*shop[^"]*"/) ?? ['none'])[0]);
});

test('F2: the same fallback in a plain text prop and in rich text produce the same Mailer tag', () => {
	const a = keep([{ id: 'a', type: 'image', props: { src: 'https://a.test/i.png', alt: "{{x|Tom & Jerry's}}" } }]);
	assert.ok(a.includes(`alt="{{x|Tom & Jerry's}}"`), (a.match(/alt="[^"]*"/) ?? ['none'])[0]);
});

test('F2: fallbacks with " < > or a backtick are refused, raw or written as character references', () => {
	for (const fb of ['"pal"', 'a<b', 'a>b', 'a`b', '&quot;pal&quot;', 'a &lt; b', '&#96;x', '&#123;x', 'a&#124;b']) {
		assert.ok(fallbackError(fb) !== null || parseTag(`{{x|${fb}}}`).kind === 'unsupported', `fallback ${fb} must be refused`);
		assert.equal(parseTag(`{{x|${fb}}}`).kind, 'unsupported', fb);
	}
	assert.equal(fallbackError("Tom & Jerry's"), null);
	assert.equal(parseTag('{{x|Tom &amp; Jerry&#39;s}}').kind, 'field');
});

test('F2: strict save refuses <p>Hi {{x|"pal"}}</p>', () => {
	assert.throws(() => sanitizeBlocks([content('<p>Hi {{x|"pal"}}</p>')], { strict: true }), /fallback/i);
});

test('F2: a stored row with a quoted fallback renders as literal text, never as a Mailer tag', () => {
	const html = keep([content('<p>Hi {{x|"pal"}}</p>')]);
	assert.ok(!html.includes('{{x|'), 'no live tag reaches Mailer');
});

test("F2: Templates' own Send still shows the fallback correctly", () => {
	const r = renderTemplateForSend([content("<p>Hi {{x|Tom & Jerry's}}</p>")], {}, new Map()) as any;
	assert.equal(r.ok, true);
	assert.ok(r.html.includes('Hi Tom &amp; Jerry&#39;s'));
});

test('F2: keep mode writes fallbacks with character references decoded', () => {
	const p = prepareGrammar('<p>{{x|Tom &amp; Jerry&#39;s}} {{ y }}</p>', {}, new Map(), '', 'keep');
	assert.equal(p.template, "<p>{{x|Tom & Jerry's}} {{ y }}</p>");
});
