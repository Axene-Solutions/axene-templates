// Review 2, finding 1: an input strict save accepted cost about 10 s of synchronous CPU in
// mjml2html (minify: true) on every Send and Save to Mailer. Fixed by compiling without the
// minifier, capping rich text nesting at 32, and refusing a compile that took over 3 s.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../src/lib/server/render.ts';
import { sanitizeBlocks, sanitizeRichText } from '../src/lib/server/sanitize-blocks.ts';
import { POST as send } from '../src/routes/api/templates/[id]/send/+server.ts';
import { POST as mailerSave } from '../src/routes/api/templates/[id]/mailer-save/+server.ts';
import { content, ev, queue, sendBody, setup } from './support/endpoint.ts';

const nest = (depth: number, inner = 'x') => '<b><i>'.repeat(depth) + inner + '</i></b>'.repeat(depth);
/** The reviewer's input: 50 content blocks nested 2800 elements deep (982,541 bytes of JSON). */
const reproduction = () => Array.from({ length: 50 }, (_, i) => content(nest(1400), 'b' + i));

function time<T>(fn: () => T): { value: T; ms: number } {
	const t0 = performance.now();
	const value = fn();
	return { value, ms: performance.now() - t0 };
}

/** Deepest element nesting in an HTML fragment of well-formed allowlisted tags. */
function depthOf(html: string): number {
	let d = 0;
	let max = 0;
	for (const m of html.matchAll(/<(\/?)([a-z]+)[^>]*>/g)) {
		if (m[2] === 'br') continue;
		d += m[1] ? -1 : 1;
		max = Math.max(max, d);
	}
	return max;
}

beforeEach(() => {
	(globalThis as any).__dbQueue = [];
	const lim = (R as any).renderLimits;
	if (lim) lim.maxCompileMs = 3000;
});

test('F1: the reproduction input is refused by strict save, naming the nesting limit of 32', () => {
	assert.equal(JSON.stringify(reproduction()).length, 982_541);
	assert.throws(() => sanitizeBlocks(reproduction(), { strict: true }), (e: Error) => /32/.test(e.message) && /nest/i.test(e.message));
});

test('F1: nesting of exactly 32 elements is accepted by strict save, 33 is refused', () => {
	const at = (n: number) => [content('<p>' + '<b>'.repeat(n - 1) + 'x' + '</b>'.repeat(n - 1) + '</p>')];
	assert.doesNotThrow(() => sanitizeBlocks(at(32), { strict: true }));
	assert.throws(() => sanitizeBlocks(at(33), { strict: true }), /32/);
});

test('F1: normal mode flattens rich text past 32 levels and keeps the text', () => {
	const out = sanitizeRichText(nest(600, 'kept text'));
	assert.ok(depthOf(out) <= 32, `depth ${depthOf(out)}`);
	assert.ok(out.includes('kept text'));
	// Shallow formatting is untouched.
	assert.equal(sanitizeRichText('<p><b>a</b> <i>b</i></p>'), '<p><b>a</b> <i>b</i></p>');
});

test('F1: Send of the stored reproduction finishes well under 1 s (was 10,670 ms)', () => {
	const m = time(() => R.renderTemplateForSend(reproduction(), {}, new Map()));
	assert.equal((m.value as any).ok, true);
	assert.ok(m.ms < 1000, `send took ${m.ms.toFixed(0)} ms`);
});

test('F1: Save to Mailer of the stored reproduction finishes well under 1 s (was 10,822 ms)', () => {
	const m = time(() => R.renderTemplateForMailer(reproduction()));
	assert.ok(m.ms < 1000, `mailer-save render took ${m.ms.toFixed(0)} ms`);
});

test('F1: depth 600 on 100 blocks (was 4,644 ms) renders well under 1 s', () => {
	const blocks = Array.from({ length: 100 }, (_, i) => content(nest(300), 'b' + i));
	const m = time(() => R.renderTemplateForMailer(blocks));
	assert.ok(m.ms < 1000, `took ${m.ms.toFixed(0)} ms`);
});

test('F1: a compile slower than the time guard is refused with render_too_slow', () => {
	const lim = (R as any).renderLimits;
	assert.ok(lim, 'render.ts exports renderLimits');
	lim.maxCompileMs = -1;
	const s = R.renderTemplateForSend([content('<p>hi</p>')], {}, new Map()) as any;
	assert.equal(s.ok, false);
	assert.equal(s.code, 'render_too_slow');
	assert.throws(() => R.renderTemplateForMailer([content('<p>hi</p>')]), (e: any) => e.code === 'render_too_slow');
});

test('F1: send and mailer-save answer 422 render_too_slow (never 500) when the guard fires', async () => {
	const lim = (R as any).renderLimits;
	assert.ok(lim, 'render.ts exports renderLimits');
	lim.maxCompileMs = -1;
	setup();
	queue([content('<p>hi</p>')]);
	let res = await send(ev(sendBody));
	assert.equal(res.status, 422);
	assert.equal((await res.json()).code, 'render_too_slow');
	queue([content('<p>hi</p>')]);
	res = await mailerSave(ev({ subject: 'S' }));
	assert.equal(res.status, 422);
	assert.equal((await res.json()).code, 'render_too_slow');
});

test('F1: the Send and Mailer renders are not minified but carry no indentation runs', () => {
	const s = R.renderTemplateForSend([content('<p>hi</p>')], {}, new Map()) as any;
	const m = R.renderTemplateForMailer([content('<p>hi</p>')]).html;
	for (const html of [s.html, m]) assert.ok(!/\n[ \t]+/.test(html), 'indentation after a newline was collapsed');
});
