// Review 2, finding 3: field names that match Object prototype members counted as having a value
// ('Hi {{constructor}}' went out as 'Hi function Object() { [native code] }').
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { POST as send } from '../src/routes/api/templates/[id]/send/+server.ts';
import { validateVariables } from '../src/lib/server/mailer/validate.ts';
import { renderSubject, prepareGrammar, fillSlots } from '../src/lib/placeholders.ts';
import { content, ev, queue, sendBody, setup } from './support/endpoint.ts';

const PROTO = ['constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf', 'prototype', 'isPrototypeOf', 'toLocaleString'];

beforeEach(() => {
	(globalThis as any).__dbQueue = [];
});

test('F3: validateVariables returns an object with no prototype, also when no variables are given', () => {
	assert.equal(Object.getPrototypeOf((validateVariables({ a: '1' }) as any).value), null);
	assert.equal(Object.getPrototypeOf((validateVariables(undefined) as any).value), null);
});

test('F3: renderSubject treats prototype names as missing', () => {
	for (const k of PROTO) {
		const r = renderSubject(`Hi {{${k}}}`, {}, new Map());
		assert.equal(r.ok, false, k);
		assert.deepEqual((r as any).missing, [k]);
		const fb = renderSubject(`Hi {{${k}|pal}}`, {}, new Map());
		assert.deepEqual(fb, { ok: true, subject: 'Hi pal' }, k);
	}
});

test('F3: the body render never reads a prototype member as a value', () => {
	for (const k of PROTO) {
		const p = prepareGrammar(`<p>[{{${k}}}]</p>`, {}, new Map(), 'N');
		assert.equal(fillSlots(p.template, p.slots, 'N'), '<p>[]</p>', k);
	}
});

for (const subject of ['Hi {{constructor}}', 'Hi {{toString}} {{__proto__}}', 'Hi {{valueOf}}', 'Hi {{prototype}}']) {
	test(`F3: send with subject '${subject}' and no variables is a 400 missing_variables, nothing sent`, async () => {
		const calls = setup();
		queue([content('<p>x</p>')]);
		const res = await send(ev({ ...sendBody, subject }));
		assert.equal(res.status, 400);
		assert.equal((await res.json()).code, 'missing_variables');
		assert.equal(calls.filter((c) => c.path.endsWith('/emails/')).length, 0);
	});
}

for (const k of PROTO) {
	test(`F3: send with body {{${k}}} and no variables is a 400 missing_variables`, async () => {
		const calls = setup();
		queue([content(`<p>Hi {{${k}}},</p>`)]);
		const res = await send(ev(sendBody));
		assert.equal(res.status, 400, k);
		const j = await res.json();
		assert.equal(j.code, 'missing_variables');
		assert.ok(j.missing.includes(k));
		assert.equal(calls.filter((c) => c.path.endsWith('/emails/')).length, 0);
	});
}

test('F3: a named link whose URL uses {{constructor}} needs a value for it', async () => {
	const calls = setup([{ id: 'l1', key: 'k', url: 'https://a.test/{{constructor}}', label: 'K' }]);
	queue([{ id: 'a', type: 'button', props: { text: 'Go', href: '{{link:k}}' } }]);
	const res = await send(ev(sendBody));
	assert.equal(res.status, 400);
	const j = await res.json();
	assert.equal(j.code, 'missing_variables');
	assert.deepEqual(j.missing, ['constructor']);
	assert.equal(calls.filter((c) => c.path.endsWith('/emails/')).length, 0);
});

test('F3: link keys named like prototype members are unknown links, not crashes', async () => {
	setup([]);
	queue([{ id: 'a', type: 'button', props: { text: 'Go', href: '{{link:constructor}}' } }]);
	const res = await send(ev(sendBody));
	assert.equal(res.status, 400);
	assert.equal((await res.json()).code, 'unknown_links');
});

test('F3: variables named toString, valueOf and hasOwnProperty are real values when given', async () => {
	const calls = setup();
	queue([content('<p>{{toString}} {{valueOf}} {{hasOwnProperty}}</p>')]);
	const res = await send(ev({ ...sendBody, subject: 'S {{toString}}', variables: { toString: 'A', valueOf: 'B', hasOwnProperty: 'C' } }));
	assert.equal(res.status, 200);
	const sent = calls.find((c) => c.path.endsWith('/emails/'))!;
	assert.equal(sent.body.subject, 'S A');
	assert.ok(sent.body.html.includes('A B C'));
});

test('F3: __proto__, constructor and prototype as variable names are a 400', async () => {
	setup();
	for (const raw of ['{"__proto__":"x"}', '{"constructor":"x"}', '{"prototype":"x"}']) {
		queue([content('<p>x</p>')]);
		const res = await send(ev(null, JSON.stringify({ ...sendBody, variables: JSON.parse(raw) })));
		assert.equal(res.status, 400, raw);
	}
});
