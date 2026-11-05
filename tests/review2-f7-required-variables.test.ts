// Review 2, finding 7: a legacy row with '{{{x}}}' demanded a value for x although it renders as
// inert text. Required variables now come from collectUsage.
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

// ---- Finding 7 ----

test('F7: a legacy row with {{{x}}} sends without a value for x (it renders as inert text)', async () => {
	const calls = setup();
	queue([content('<p>{{{x}}}</p>')]);
	const res = await send(ev(sendBody));
	assert.equal(res.status, 200, JSON.stringify(await res.clone().json()));
	assert.equal(calls.filter((c) => c.path.endsWith('/emails/')).length, 1);
});

test('F7: plain {{x}} still needs a value, {{x|fb}} does not, and x used both ways needs one', async () => {
	setup();
	queue([content('<p>{{x}}</p>')]);
	let res = await send(ev(sendBody));
	assert.equal(res.status, 400);
	assert.deepEqual((await res.json()).missing, ['x']);
	queue([content('<p>{{x|fb}}</p>')]);
	res = await send(ev(sendBody));
	assert.equal(res.status, 200);
	queue([content('<p>{{x|fb}} {{ x }}</p>')]);
	res = await send(ev(sendBody));
	assert.equal(res.status, 400);
});

