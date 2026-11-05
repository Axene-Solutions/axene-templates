// Review 2, finding 10 (observations): error excerpts carried markup, and there was no documented
// way to write literal braces. Typing &#123;&#123; is that way.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { firstUnsupported, collectUsage } from '../src/lib/placeholders.ts';
import { sanitizeBlocks, sanitizeRichText } from '../src/lib/server/sanitize-blocks.ts';
import { renderTemplateForMailer, renderTemplateForSend } from '../src/lib/server/render.ts';
import { POST as send } from '../src/routes/api/templates/[id]/send/+server.ts';
import { content, ev, queue, sendBody, setup } from './support/endpoint.ts';

beforeEach(() => {
	(globalThis as any).__dbQueue = [];
});

// ---- Finding 10 ----

test('F10: the unsupported-syntax excerpt has no markup and is at most 40 characters', () => {
	const r = firstUnsupported('<p>Use {{ to open</p><p>and more text that keeps going on and on</p>')!;
	assert.ok(r);
	assert.ok(!/[<>]/.test(r.text), r.text);
	assert.ok(r.text.length <= 40, r.text);
	const t = firstUnsupported('<p>{{#if very_long_condition_name_that_goes_on_and_on_forever}}x{{/if}}</p>')!;
	assert.ok(t.text.length <= 40, t.text);
	try {
		sanitizeBlocks([content('<p>Use {{ to open</p>')], { strict: true });
		assert.fail('should refuse');
	} catch (e: any) {
		assert.ok(!e.message.includes('</p>'), e.message);
		assert.ok(e.message.includes('&#123;&#123;'), 'the message says how to write literal braces');
	}
});

test('F10: &#123;&#123; is accepted by strict save and shows braces, in plain and in rich text', () => {
	for (const text of ['Use &#123;&#123;name&#125;&#125; to greet', '<p>Use &#123;&#123;name&#125;&#125; to greet</p>']) {
		const blocks = [content(text)];
		assert.doesNotThrow(() => sanitizeBlocks(blocks, { strict: true }));
		const clean = sanitizeBlocks(blocks, { strict: true });
		assert.equal(collectUsage(clean).fields.size, 0, 'it never becomes a live placeholder');
		const r = renderTemplateForSend(clean, { name: 'Ann' }, new Map()) as any;
		assert.equal(r.ok, true);
		assert.ok(r.html.includes('Use &#123;&#123;name&#125;&#125; to greet'), 'the reader sees {{name}}, not Ann');
		const m = renderTemplateForMailer(clean).html;
		assert.ok(!m.includes('{{name}}'), 'Mailer never sees a live tag');
	}
});

test('F10: the sentinel characters cannot be smuggled in', () => {
	assert.equal(sanitizeRichText('<p>ab</p>'), '<p>ab</p>');
});
