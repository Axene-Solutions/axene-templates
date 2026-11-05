// Review 2, finding 8: /api/templates/compile answered 500 on bad bodies and put caller URLs into
// links unchecked (verify_url = 'javascript:alert(document.domain)' came back as the href).
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { POST as compileTpl } from '../src/routes/api/templates/compile/+server.ts';
import { starterTemplates } from '../src/lib/defaults.ts';

const st = starterTemplates.find((t) => t.id === 'starter-verify')!;
const call = (body: string, category = st.category) =>
	compileTpl({
		request: new Request('https://app.test/x', { method: 'POST', headers: { 'content-type': 'application/json' }, body }),
		url: new URL('https://app.test/api/templates/compile?category=' + category),
		locals: { user: { id: 'u-me' } },
	} as any);

beforeEach(() => {
	(globalThis as any).__dbQueue = [[{ ...st, isStarter: true, version: 'v1' }]];
});

for (const body of ['not json', 'null', '[]', '"str"', '{"data":"str"}', '{"data":[1]}', '{"data":5}']) {
	test(`F8: body ${body} is a 400, never a 500 or a throw`, async () => {
		const res = await call(body);
		assert.equal(res.status, 400);
	});
}

for (const url of ['javascript:alert(document.domain)', ' JavaScript:alert(1)', 'java\tscript:alert(1)', 'data:text/html,<b>x</b>', 'vbscript:x']) {
	test(`F8: verify_url ${JSON.stringify(url)} is refused with 422`, async () => {
		const res = await call(JSON.stringify({ data: { verify_url: url } }));
		assert.equal(res.status, 422);
		const j = await res.json();
		assert.equal(j.html, undefined);
	});
}

test('F8: a normal verify_url still compiles', async () => {
	const res = await call(JSON.stringify({ data: { verify_url: 'https://app.test/verify?t=1&u=2', name: 'Ann' } }));
	assert.equal(res.status, 200);
	const j = await res.json();
	assert.ok(j.html.includes('https://app.test/verify?t=1&amp;u=2'));
});

test('F8: no data at all still compiles', async () => {
	const res = await call('{}');
	assert.equal(res.status, 200);
});
