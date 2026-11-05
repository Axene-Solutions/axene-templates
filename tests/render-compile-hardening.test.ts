import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { escapeDeep } from '../src/lib/server/mailer/validate.ts';
import { POST as render } from '../src/routes/api/render/+server.ts';

const ME = { id: 'u-me', email: 'me@test.local', name: 'Me', avatarUrl: null };

function ev(opts: { user?: any; raw?: string }) {
	return {
		locals: { user: opts.user === undefined ? ME : opts.user },
		request: new Request('https://app.test/api/render', { method: 'POST', headers: { 'content-type': 'application/json' }, body: opts.raw ?? '{}' }),
	} as any;
}

beforeEach(() => {
	(globalThis as any).__dbQueue = [];
});

test('render: 401 when not signed in', async () => {
	const res = await render(ev({ user: null, raw: JSON.stringify({ mjml: '<mjml></mjml>' }) }));
	assert.equal(res.status, 401);
});

test('render: 400 for invalid JSON and for a missing mjml string', async () => {
	assert.equal((await render(ev({ raw: '{nope' }))).status, 400);
	assert.equal((await render(ev({ raw: JSON.stringify({ mjml: 5 }) }))).status, 400);
	assert.equal((await render(ev({ raw: JSON.stringify({}) }))).status, 400);
});

test('render: 413 for an oversized body, refused before it is compiled', async () => {
	const big = JSON.stringify({ mjml: '<mjml>' + 'a'.repeat(700_000) + '</mjml>' });
	const t0 = Date.now();
	const res = await render(ev({ raw: big }));
	assert.equal(res.status, 413);
	assert.ok(Date.now() - t0 < 1000, 'must not spend time compiling');
});

test('render: a small valid MJML document still compiles for a signed-in user', async () => {
	const mjml = '<mjml><mj-body><mj-section><mj-column><mj-text>Hello</mj-text></mj-column></mj-section></mj-body></mjml>';
	const res = await render(ev({ raw: JSON.stringify({ mjml }) }));
	assert.equal(res.status, 200);
	assert.match((await res.json()).html, /Hello/);
});

test('escapeDeep: escapes strings at every depth, including arrays used by each-loops', () => {
	const out: any = escapeDeep({ name: '<img src=x onerror=1>', items: [{ label: '"><script>1</script>' }, 'a&b'], n: 3, ok: true, none: null });
	assert.equal(out.name, '&lt;img src=x onerror=1&gt;');
	assert.equal(out.items[0].label, '&quot;&gt;&lt;script&gt;1&lt;/script&gt;');
	assert.equal(out.items[1], 'a&amp;b');
	assert.equal(out.n, 3);
	assert.equal(out.ok, true);
	assert.equal(out.none, null);
});

test('escapeDeep: drops prototype keys and cuts very deep structures', () => {
	const hostile = JSON.parse('{"__proto__":{"polluted":"<b>"},"constructor":{"x":1},"a":{"b":{"c":{"d":{"e":{"f":{"g":"deep"}}}}}}}');
	const out: any = escapeDeep(hostile);
	assert.equal(Object.prototype.hasOwnProperty.call(out, '__proto__'), false);
	assert.equal(out.constructor, Object); // not an own key: the dropped value never got copied
	assert.equal(({} as any).polluted, undefined);
	assert.equal(out.a.b.c.d.e.f, null, 'deeper than the cap is cut');
});
