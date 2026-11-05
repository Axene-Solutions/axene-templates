// Review 2, finding 6: the plain-text alternative showed raw character references (&#8203;,
// &#123;&#123;) and dropped link URLs ('Pay now' with no address).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { htmlToText } from '../src/lib/server/mailer/validate.ts';
import { renderTemplateForSend } from '../src/lib/server/render.ts';
import { createBlock } from '../src/lib/blocks.ts';

test('F6: numeric and common named character references are decoded, U+200B is dropped', () => {
	assert.equal(htmlToText('<p>a&#8203;b &#123;&#123;x&#125;&#125; &#x41; caf&eacute; &copy; &hellip; &mdash; &rsquo;</p>'), 'ab {{x}} A café © … — ’');
	assert.equal(htmlToText('<p>Tom &amp; Jerry&#39;s &quot;q&quot; &lt;b&gt;</p>'), 'Tom & Jerry\'s "q" <b>');
	assert.equal(htmlToText('<p>&amp;lt; stays text</p>'), '&lt; stays text');
	assert.equal(htmlToText('<p>a​b</p>'), 'ab');
});

test('F6: a section block and braces made inert show no raw references in the text part', () => {
	const blocks = [createBlock('section'), { id: 'x', type: 'content', props: { text: '<p>legacy {{#if vip}}VIP{{/if}} row</p>' } }];
	const r = renderTemplateForSend(blocks, {}, new Map()) as any;
	assert.equal(r.ok, true);
	const text = htmlToText(r.html);
	assert.ok(!/&#?[a-z0-9]+;/i.test(text), JSON.stringify(text));
	assert.ok(!text.includes('​'));
	assert.ok(text.includes('legacy {{#if vip}}VIP{{/if}} row'), JSON.stringify(text));
});

test('F6: links carry their URL as "label (url)" when the label differs from the URL', () => {
	assert.equal(htmlToText('<p><a href="https://pay.test/x?a=1&amp;b=2">Pay now</a></p>'), 'Pay now (https://pay.test/x?a=1&b=2)');
	assert.equal(htmlToText('<p><a href="https://pay.test/">https://pay.test/</a></p>'), 'https://pay.test/');
	assert.equal(htmlToText("<p><a href='mailto:a@b.test'>Write</a> to us</p>"), 'Write (mailto:a@b.test) to us');
	assert.equal(htmlToText('<p><a href="#top">Top</a></p>'), 'Top');
	assert.equal(htmlToText('<p><a>Bare</a></p>'), 'Bare');
});

test('F6: the button in a rendered email carries its URL in the text part', () => {
	const r = renderTemplateForSend([{ id: 'b', type: 'button', props: { text: 'Pay now', href: 'https://pay.test/now' } }], {}, new Map()) as any;
	assert.ok(htmlToText(r.html).includes('Pay now (https://pay.test/now)'), htmlToText(r.html));
});

test('F6: source whitespace collapses like a browser shows it', () => {
	assert.equal(htmlToText('<div>\n    <p>\n      Hello\n      world\n    </p>\n  </div>'), 'Hello world');
});

test('F6: htmlToText stays linear on hostile input', () => {
	const inputs = ['&#'.repeat(100_000), '<a href="'.repeat(20_000), '&'.repeat(200_000), ('<a href="x">' + 'y'.repeat(10)).repeat(10_000)];
	for (const s of inputs) {
		const t0 = performance.now();
		htmlToText(s);
		const ms = performance.now() - t0;
		assert.ok(ms < 300, `${s.slice(0, 12)} took ${ms.toFixed(0)} ms`);
	}
});
