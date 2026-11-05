// Review 2, finding 4: {{LINK:promo}}, {{link : promo}} and {{link:spring-sale}} saved in Templates
// and then failed in Mailer. The link grammar is now Mailer's: lowercase "link:" with nothing
// before the colon, and a key matching ^[a-z0-9][a-z0-9_]{0,39}$.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTag, LINK_KEY_RE, suggestLinkKey } from '../src/lib/placeholders.ts';
import { sanitizeBlocks } from '../src/lib/server/sanitize-blocks.ts';
import { renderTemplateForMailer } from '../src/lib/server/render.ts';

const button = (href: string) => [{ id: 'a', type: 'button', props: { text: 'Go', href } }];

test('F4: loose link forms are unsupported', () => {
	for (const raw of ['{{LINK:promo}}', '{{Link:promo}}', '{{link : promo}}', '{{link :promo}}', '{{link:spring-sale}}', '{{link:Promo}}', '{{link:' + 'a'.repeat(41) + '}}', '{{link:_a}}', '{{link:}}']) {
		assert.equal(parseTag(raw).kind, 'unsupported', raw);
	}
});

test("F4: Mailer's accepted forms are links", () => {
	for (const [raw, key] of [['{{link:promo}}', 'promo'], ['{{ link:promo }}', 'promo'], ['{{link: promo}}', 'promo'], ['{{link:9lives}}', '9lives'], ['{{link:' + 'a'.repeat(40) + '}}', 'a'.repeat(40)]] as const) {
		const t = parseTag(raw);
		assert.equal(t.kind, 'link', raw);
		assert.equal((t as any).key, key);
	}
});

test('F4: strict save refuses the loose forms with a message that shows the accepted form', () => {
	for (const href of ['{{LINK:promo}}', '{{link : promo}}', '{{link:spring-sale}}']) {
		assert.throws(
			() => sanitizeBlocks(button(href), { strict: true }),
			(e: Error) => e.message.includes('{{link:key}}') && /lowercase/.test(e.message),
			href,
		);
	}
});

test('F4: a stored row with a loose form renders as literal text for Mailer', () => {
	const html = renderTemplateForMailer([{ id: 'a', type: 'content', props: { text: '<p>{{LINK:promo}} {{link:spring-sale}}</p>' } }]).html;
	assert.ok(!html.includes('{{LINK') && !html.includes('{{link:spring'), 'no live tag');
	assert.ok(html.includes('&#123;&#123;LINK:promo&#125;&#125;'));
});

test('F4: new link keys are capped at 40 characters like Mailer', () => {
	assert.ok(LINK_KEY_RE.test('a'.repeat(40)));
	assert.ok(!LINK_KEY_RE.test('a'.repeat(41)));
	assert.ok(suggestLinkKey('x'.repeat(80)).length <= 40);
});
