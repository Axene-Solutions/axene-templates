import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { encryptSecret } from '../src/lib/server/mailer/crypto.ts';
import { forgetPlans } from '../src/lib/server/mailer/plancache.ts';

import { GET as getFields } from '../src/routes/api/mailer/fields/+server.ts';
import { GET as listLinks, POST as createLink } from '../src/routes/api/mailer/links/+server.ts';
import { PATCH as patchLink, DELETE as deleteLink } from '../src/routes/api/mailer/links/[linkId]/+server.ts';
import { GET as getPlan } from '../src/routes/api/mailer/plan/+server.ts';
import { GET as getCheck } from '../src/routes/api/mailer/check/+server.ts';
import { POST as send } from '../src/routes/api/templates/[id]/send/+server.ts';

const ENC = randomBytes(32);
const SECRET = 'axm_k_supersecretkey0001';
const ME = { id: 'u-me', email: 'me@test.local', name: 'Me', avatarUrl: null };
const HOST = 'app.test';

function ev(opts: { user?: any; method?: string; origin?: string | null; body?: unknown; params?: Record<string, string> } = {}) {
	const method = opts.method ?? 'GET';
	const headers = new Headers({ 'content-type': 'application/json' });
	if (opts.origin !== null) headers.set('origin', opts.origin ?? `https://${HOST}`);
	const init: RequestInit = { method, headers };
	if (method !== 'GET' && method !== 'DELETE') init.body = JSON.stringify(opts.body ?? {});
	return {
		locals: { user: opts.user === undefined ? ME : opts.user },
		request: new Request(`https://${HOST}/api/x`, init),
		url: new URL(`https://${HOST}/api/x`),
		params: opts.params ?? {},
	} as any;
}

type Call = { method: string; path: string; auth: string | null; body: any };
let calls: Call[] = [];
let upstream: (c: Call) => { status: number; json?: unknown } = () => ({ status: 200, json: {} });

const connected = () => [[{ apiKeyEncrypted: encryptSecret(SECRET, ENC) }]];

beforeEach(() => {
	process.env.MAILER_KEY_ENCRYPTION_KEY = ENC.toString('base64');
	(globalThis as any).__dbQueue = [];
	calls = [];
	forgetPlans(ME.id);
	upstream = () => ({ status: 200, json: {} });
	(globalThis as any).fetch = async (url: string, init: RequestInit) => {
		const u = new URL(url);
		const call: Call = {
			method: init.method ?? 'GET',
			path: u.pathname,
			auth: (init.headers as Record<string, string>)?.Authorization ?? null,
			body: init.body ? JSON.parse(init.body as string) : undefined,
		};
		calls.push(call);
		const r = upstream(call);
		if (r.status === 204) return new Response(null, { status: 204 });
		return new Response(JSON.stringify(r.json ?? null), { status: r.status, headers: { 'content-type': 'application/json' } });
	};
});

const fieldsBody = { builtins: [{ key: 'email', label: 'Email address' }], fields: [{ key: 'order_id', count: 3 }, { key: 'bad key', count: 1 }] };
const linkRow = { id: 'l1', key: 'pay_now', label: 'Pay now', url: 'https://pay.example.com/{{order_id}}', token: '{{link:pay_now}}', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' };

// ---- gates, shared by every new endpoint ----
const gated: [string, (e: any) => Response | Promise<Response>, string, any][] = [
	['fields GET', getFields, 'GET', undefined],
	['links GET', listLinks, 'GET', undefined],
	['links POST', createLink, 'POST', { label: 'Pay', url: 'https://x.test' }],
	['links PATCH', patchLink, 'PATCH', { label: 'Pay' }],
	['links DELETE', deleteLink, 'DELETE', undefined],
	['plan GET', getPlan, 'GET', undefined],
];

for (const [name, handler, method, body] of gated) {
	test(`${name}: 401 signed out, 409 not connected, 503 without the server key`, async () => {
		const p = { linkId: 'l1' };
		assert.equal((await handler(ev({ user: null, method, body, params: p }))).status, 401);
		assert.equal((await handler(ev({ method, body, params: p }))).status, 409);
		delete process.env.MAILER_KEY_ENCRYPTION_KEY;
		assert.equal((await handler(ev({ method, body, params: p }))).status, 503);
		assert.equal(calls.length, 0);
	});
	if (method !== 'GET') {
		test(`${name}: 403 for a cross-origin request or a missing Origin`, async () => {
			const p = { linkId: 'l1' };
			assert.equal((await handler(ev({ method, body, params: p, origin: 'https://evil.test' }))).status, 403);
			assert.equal((await handler(ev({ method, body, params: p, origin: null }))).status, 403);
			assert.equal(calls.length, 0);
		});
	}
}

// ---- fields ----
test('fields: proxies names and counts with the stored key, drops malformed entries, never returns the key', async () => {
	(globalThis as any).__dbQueue = connected();
	upstream = () => ({ status: 200, json: fieldsBody });
	const res = await getFields(ev());
	assert.equal(res.status, 200);
	const text = await res.text();
	assert.deepEqual(JSON.parse(text), { builtins: [{ key: 'email', label: 'Email address' }], fields: [{ key: 'order_id', count: 3 }] });
	assert.ok(!text.includes(SECRET));
	assert.equal(calls[0].path, '/v1/contacts/fields');
	assert.equal(calls[0].auth, `Bearer ${SECRET}`);
});

test('fields: a key without contacts:read is a clear scope error; a dead key says so', async () => {
	(globalThis as any).__dbQueue = connected();
	upstream = () => ({ status: 403, json: { detail: 'Insufficient scope axm_k_leak' } });
	let res = await getFields(ev());
	assert.equal(res.status, 403);
	let body = await res.json();
	assert.equal(body.code, 'mailer_missing_scope');
	assert.ok(body.error.includes('contacts:read'));
	assert.ok(!JSON.stringify(body).includes('axm_k_leak'));

	(globalThis as any).__dbQueue = connected();
	upstream = () => ({ status: 401 });
	res = await getFields(ev());
	assert.equal(res.status, 401);
	assert.equal((await res.json()).connected, false);

	(globalThis as any).__dbQueue = connected();
	upstream = () => ({ status: 500, json: { detail: 'boom axm_k_x' } });
	res = await getFields(ev());
	assert.equal(res.status, 502);
	assert.ok(!(await res.text()).includes('boom'));
});

// ---- links ----
test('links GET: lists links in camelCase', async () => {
	(globalThis as any).__dbQueue = connected();
	upstream = () => ({ status: 200, json: [linkRow, { nonsense: true }] });
	const res = await listLinks(ev());
	assert.equal(res.status, 200);
	const body = await res.json();
	assert.equal(body.links.length, 1);
	assert.equal(body.links[0].token, '{{link:pay_now}}');
	assert.equal(calls[0].path, '/v1/template-links/');
});

test('links POST: validates like the server, then proxies; the key is optional', async () => {
	const bads = [
		{ label: '', url: 'https://x.test' },
		{ label: 'a', url: 'javascript:alert(1)' },
		{ label: 'a', url: 'ftp://x.test' },
		{ label: 'a', url: 'https://x.test/' + 'a'.repeat(2000) },
		{ label: 'a', url: 'https://x.test/{{link:other}}' },
		{ label: 'a', url: 'https://x.test/{{#if a}}' },
		{ label: 'a', url: 'https://x.test', key: 'Bad Key' },
		{ label: 'x'.repeat(101), url: 'https://x.test' },
	];
	for (const body of bads) {
		(globalThis as any).__dbQueue = connected();
		const res = await createLink(ev({ method: 'POST', body }));
		assert.equal(res.status, 400, JSON.stringify(body).slice(0, 80));
	}
	assert.equal(calls.length, 0);

	(globalThis as any).__dbQueue = connected();
	upstream = () => ({ status: 201, json: linkRow });
	const res = await createLink(ev({ method: 'POST', body: { label: ' Pay now ', url: 'https://pay.example.com/{{order_id}}' } }));
	assert.equal(res.status, 201);
	assert.deepEqual(calls[0].body, { label: 'Pay now', url: 'https://pay.example.com/{{order_id}}' });
	assert.equal(calls[0].method, 'POST');
	assert.equal((await res.json()).link.key, 'pay_now');
});

test('links: the cap error is passed through verbatim, a scope error is explained, 409 and 422 are mapped', async () => {
	const cap = 'You have reached the maximum of 100 named links.';
	(globalThis as any).__dbQueue = connected();
	upstream = () => ({ status: 403, json: { detail: cap } });
	let res = await createLink(ev({ method: 'POST', body: { label: 'a', url: 'https://x.test' } }));
	assert.equal(res.status, 403);
	let body = await res.json();
	assert.equal(body.error, cap);
	assert.equal(body.code, 'mailer_plan_limit');

	(globalThis as any).__dbQueue = connected();
	upstream = () => ({ status: 403, json: { detail: 'Missing scope templates:write axm_k_leak' } });
	res = await createLink(ev({ method: 'POST', body: { label: 'a', url: 'https://x.test' } }));
	body = await res.json();
	assert.equal(body.code, 'mailer_missing_scope');
	assert.ok(body.error.includes('templates:write'));
	assert.ok(!JSON.stringify(body).includes('axm_k_leak'));

	(globalThis as any).__dbQueue = connected();
	upstream = () => ({ status: 409, json: { detail: 'A link with the key pay_now already exists.' } });
	res = await createLink(ev({ method: 'POST', body: { label: 'a', url: 'https://x.test', key: 'pay_now' } }));
	assert.equal(res.status, 409);
	assert.equal((await res.json()).error, 'A link with the key pay_now already exists.');

	(globalThis as any).__dbQueue = connected();
	upstream = () => ({ status: 422, json: { detail: [{ msg: 'URL scheme not allowed' }] } });
	res = await createLink(ev({ method: 'POST', body: { label: 'a', url: 'https://x.test' } }));
	assert.equal(res.status, 422);
	assert.equal((await res.json()).error, 'URL scheme not allowed');
});

test('links PATCH and DELETE: id and body are checked, calls reach the right path', async () => {
	assert.equal((await patchLink(ev({ method: 'PATCH', params: { linkId: '../x' }, body: { label: 'a' } }))).status, 400);
	(globalThis as any).__dbQueue = connected();
	assert.equal((await patchLink(ev({ method: 'PATCH', params: { linkId: 'l1' }, body: {} }))).status, 400);

	(globalThis as any).__dbQueue = connected();
	upstream = () => ({ status: 200, json: { ...linkRow, label: 'Pay' } });
	const res = await patchLink(ev({ method: 'PATCH', params: { linkId: 'l1' }, body: { label: 'Pay' } }));
	assert.equal(res.status, 200);
	assert.equal(calls.at(-1)!.path, '/v1/template-links/l1');
	assert.equal(calls.at(-1)!.method, 'PATCH');

	(globalThis as any).__dbQueue = connected();
	upstream = () => ({ status: 204 });
	const del = await deleteLink(ev({ method: 'DELETE', params: { linkId: 'l1' } }));
	assert.equal(del.status, 200);
	assert.deepEqual(await del.json(), { deleted: true });
	assert.equal(calls.at(-1)!.method, 'DELETE');

	(globalThis as any).__dbQueue = connected();
	upstream = () => ({ status: 404 });
	assert.equal((await deleteLink(ev({ method: 'DELETE', params: { linkId: 'l1' } }))).status, 404);
});

// ---- plan ----
const usageBody = (name: string, over: any = {}) => ({
	plan: { name, daily_limit: 100, monthly_limit: 3000 },
	usage: { emails_today: 10, emails_this_month: 200 },
	features: { templates: true, scheduled_send: false, batch_send: false },
	subscription: { expires_at: '2027-01-01T00:00:00+00:00' },
	...over,
});
const plansBody = [
	{ name: 'free', max_templates: 2 },
	{ name: 'pro', max_templates: 30 },
	{ name: 'business', max_templates: -1 },
];
const tplRows = (n: number) => Array.from({ length: n }, (_, i) => ({ id: 't' + i, name: 'T' + i, subject: 's' }));

function planUpstream(name: string, templates: number, over: any = {}) {
	upstream = (c) => {
		if (c.path === '/v1/billing/usage') return { status: 200, json: usageBody(name, over) };
		if (c.path === '/v1/billing/plans') return { status: 200, json: plansBody };
		if (c.path === '/v1/templates/') return { status: 200, json: tplRows(templates) };
		return { status: 404 };
	};
}

test('plan: below the limit, at the limit, unlimited, with no key in the response', async () => {
	(globalThis as any).__dbQueue = connected();
	planUpstream('free', 1);
	let res = await getPlan(ev());
	let text = await res.text();
	assert.ok(!text.includes(SECRET));
	let plan = JSON.parse(text).plan;
	assert.equal(plan.name, 'free');
	assert.deepEqual(plan.templates, { used: 1, limit: 2, limitKnown: true, unlimited: false });
	assert.equal(plan.atTemplateLimit, false);
	assert.equal(plan.nearTemplateLimit, false);
	assert.equal(plan.upgradeReason, null);
	assert.deepEqual(plan.featuresOff.map((f: any) => f.key), ['scheduled_send', 'batch_send']);
	assert.deepEqual(plan.daily, { used: 10, limit: 100 });
	// The plans list is public: no key is sent for it.
	assert.equal(calls.find((c) => c.path === '/v1/billing/plans')!.auth, null);

	forgetPlans(ME.id);
	(globalThis as any).__dbQueue = connected();
	planUpstream('free', 2);
	plan = (await (await getPlan(ev())).json()).plan;
	assert.equal(plan.atTemplateLimit, true);
	assert.ok(plan.upgradeReason);

	forgetPlans(ME.id);
	(globalThis as any).__dbQueue = connected();
	planUpstream('business', 7, { plan: { name: 'business', daily_limit: 0, monthly_limit: 500000 } });
	plan = (await (await getPlan(ev())).json()).plan;
	assert.equal(plan.templates.unlimited, true);
	assert.equal(plan.atTemplateLimit, false);
	assert.equal(plan.daily.limit, null);
});

test('plan: cached for 60 s per user, so Mailer is not asked twice', async () => {
	(globalThis as any).__dbQueue = connected();
	planUpstream('pro', 3);
	await getPlan(ev());
	const first = calls.length;
	assert.equal(first, 3);
	(globalThis as any).__dbQueue = connected();
	const again = await getPlan(ev());
	assert.equal((await again.json()).cached, true);
	assert.equal(calls.length, first);
});

test('plan: key without templates:read still answers, with the template count unknown', async () => {
	(globalThis as any).__dbQueue = connected();
	upstream = (c) => (c.path === '/v1/templates/' ? { status: 403 } : c.path === '/v1/billing/usage' ? { status: 200, json: usageBody('pro') } : { status: 200, json: plansBody });
	const plan = (await (await getPlan(ev())).json()).plan;
	assert.equal(plan.templates.used, null);
	assert.equal(plan.templates.limit, 30);
});

test('plan: a dead key is reported as such', async () => {
	(globalThis as any).__dbQueue = connected();
	upstream = () => ({ status: 401 });
	const res = await getPlan(ev());
	assert.equal(res.status, 401);
	assert.equal((await res.json()).connected, false);
});

// ---- check ----
test('check: probes contacts:read as a fifth scope', async () => {
	(globalThis as any).__dbQueue = connected();
	upstream = (c) => (c.path === '/v1/contacts/fields' ? { status: 403 } : { status: 200, json: [] });
	const body = await (await getCheck(ev())).json();
	const sc = body.scopes.find((s: any) => s.scope === 'contacts:read');
	assert.equal(body.scopes.length, 5);
	assert.equal(sc.state, 'missing');
	assert.ok(calls.some((c) => c.path === '/v1/contacts/fields'));
});

// ---- send: the new grammar ----
const row = (blocks: unknown[]) => ({ id: 't1', userId: ME.id, name: 'T', blocks, isStarter: false, isPublic: false, mailerTemplateId: null });
const sendBody = { from: { email: 'a@b.test' }, to: ['c@d.test'], subject: 'Hi' };
const blocksWith = (text: string, href = '') => [
	{ id: 'a', type: 'content', props: { text, fontSize: 14, color: '#000', align: 'left', lineHeight: '1.5', paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 } },
	...(href ? [{ id: 'b', type: 'button', props: { text: 'Go', href, backgroundColor: '#000', color: '#fff', fontSize: 14, fontWeight: '600', borderRadius: 4, width: 0, align: 'center', innerPadding: '10px', paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 } }] : []),
];

function sendUpstream(links: any[], sentHtml: { v: string }) {
	upstream = (c) => {
		if (c.path === '/v1/template-links/') return { status: 200, json: links };
		if (c.path === '/v1/emails/') {
			sentHtml.v = c.body.html;
			return { status: 202, json: {} };
		}
		return { status: 404 };
	};
}

test('send: fallbacks and named links render, values are percent-encoded and not rendered again', async () => {
	(globalThis as any).__dbQueue = [[row(blocksWith('Hi {{name|friend}} {{plain}}', '{{link:pay_now}}'))], ...connected()];
	const sent = { v: '' };
	sendUpstream([linkRow], sent);
	const res = await send(ev({ method: 'POST', params: { id: 't1' }, body: { ...sendBody, variables: { plain: 'P', order_id: 'a b/{{plain}}' } } }));
	assert.equal(res.status, 200, JSON.stringify(await res.clone().json()));
	assert.ok(sent.v.includes('Hi friend P'), sent.v);
	assert.ok(sent.v.includes('https://pay.example.com/a%20b%2F%7B%7Bplain%7D%7D'), sent.v);
	assert.ok(!sent.v.includes('__AXS'));
	assert.equal(calls.filter((c) => c.path === '/v1/template-links/').length, 1);
});

test('send: an unknown link is a 400 that lists it, and nothing is sent', async () => {
	(globalThis as any).__dbQueue = [[row(blocksWith('x', '{{link:nope}}'))], ...connected()];
	sendUpstream([linkRow], { v: '' });
	const res = await send(ev({ method: 'POST', params: { id: 't1' }, body: sendBody }));
	assert.equal(res.status, 400);
	const body = await res.json();
	assert.equal(body.code, 'unknown_links');
	assert.deepEqual(body.unknown, ['nope']);
	assert.ok(body.error.includes('{{link:nope}}'));
	assert.ok(!calls.some((c) => c.path === '/v1/emails/'));
});

test('send: a link with a javascript URL or a nested link is refused, never inserted', async () => {
	for (const url of ['javascript:alert(1)', 'https://x.test/{{link:pay_now}}']) {
		(globalThis as any).__dbQueue = [[row(blocksWith('x', '{{link:evil}}'))], ...connected()];
		calls = [];
		sendUpstream([{ ...linkRow, key: 'evil', url }, linkRow], { v: '' });
		const res = await send(ev({ method: 'POST', params: { id: 't1' }, body: sendBody }));
		assert.equal(res.status, 400, url);
		assert.equal((await res.json()).code, 'invalid_links');
		assert.ok(!calls.some((c) => c.path === '/v1/emails/'));
	}
});

test('send: a field a used link needs must have a value', async () => {
	(globalThis as any).__dbQueue = [[row(blocksWith('x', '{{link:pay_now}}'))], ...connected()];
	sendUpstream([linkRow], { v: '' });
	const res = await send(ev({ method: 'POST', params: { id: 't1' }, body: sendBody }));
	assert.equal(res.status, 400);
	assert.deepEqual((await res.json()).missing, ['order_id']);
});

test('send: link lookup without templates:read is a clear scope error', async () => {
	(globalThis as any).__dbQueue = [[row(blocksWith('x', '{{link:pay_now}}'))], ...connected()];
	upstream = () => ({ status: 403, json: { detail: 'no' } });
	const res = await send(ev({ method: 'POST', params: { id: 't1' }, body: { ...sendBody, variables: { order_id: '1' } } }));
	assert.equal(res.status, 403);
	assert.equal((await res.json()).code, 'mailer_missing_scope');
});

test('send: templates without links never call the links endpoint', async () => {
	(globalThis as any).__dbQueue = [[row(blocksWith('Hi {{name|friend}}'))], ...connected()];
	const sent = { v: '' };
	sendUpstream([], sent);
	const res = await send(ev({ method: 'POST', params: { id: 't1' }, body: sendBody }));
	assert.equal(res.status, 200);
	assert.ok(!calls.some((c) => c.path === '/v1/template-links/'));
	assert.ok(sent.v.includes('Hi friend'));
});
