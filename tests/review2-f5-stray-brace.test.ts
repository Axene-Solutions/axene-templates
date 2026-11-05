// Review 2, finding 5: '{{{x}}' (a stray brace right before a tag) passed strict save but is
// unsupported in Mailer.
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

// ---- Finding 5 ----

test('F5: {{{x}} (a stray brace right before a tag) is refused by strict save', () => {
	assert.ok(firstUnsupported('<p>{{{x}}</p>'));
	assert.throws(() => sanitizeBlocks([content('<p>{{{x}}</p>')], { strict: true }), /not supported/);
	assert.throws(() => sanitizeBlocks([content('a {{{x|y}} b')], { strict: true }), /not supported/);
});

test('F5: a stored {{{x}} reaches Mailer as text, not as {{x}} after a brace', () => {
	const html = renderTemplateForMailer([content('<p>{{{x}}</p>')]).html;
	assert.ok(!/\{\{x\}\}/.test(html), 'no live {{x}}');
	const usage = collectUsage([content('<p>{{{x}}</p>')]);
	assert.equal(usage.fields.size, 0);
});

test('F5: a brace separated from the tag is still fine', () => {
	assert.equal(firstUnsupported('<p>{ {{x}}</p>'), null);
	assert.equal(firstUnsupported('<p>{a} {{x}}</p>'), null);
});

