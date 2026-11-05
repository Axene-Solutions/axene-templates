import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { encryptSecret } from '../src/lib/server/mailer/crypto.ts';

import { POST as send } from '../src/routes/api/templates/[id]/send/+server.ts';
import { POST as mailerSave } from '../src/routes/api/templates/[id]/mailer-save/+server.ts';
import { GET as getConnection, DELETE as deleteConnection } from '../src/routes/api/mailer/connection/+server.ts';
import { GET as listTemplates } from '../src/routes/api/mailer/templates/+server.ts';

const KEY = randomBytes(32).toString('base64');
const ME = { id: 'u-me', email: 'me@test.local', name: 'Me', avatarUrl: null };
const HOST = 'app.test';

function ev(opts: { user?: any; method?: string; origin?: string | null; body?: unknown; params?: Record<string, string> }) {
	const method = opts.method ?? 'POST';
	const headers = new Headers({ 'content-type': 'application/json' });
	if (opts.origin !== null) headers.set('origin', opts.origin ?? `https://${HOST}`);
	const init: RequestInit = { method, headers };
	if (method !== 'GET' && method !== 'DELETE') init.body = JSON.stringify(opts.body ?? {});
	return {
		locals: { user: opts.user === undefined ? ME : opts.user },
		request: new Request(`https://${HOST}/api/x`, init),
		url: new URL(`https://${HOST}/api/x`),
		params: opts.params ?? { id: 't1' },
	} as any;
}

const goodBody = { from: { email: 'a@b.test' }, to: ['c@d.test'], subject: 'Hi' };
const row = (over: Record<string, unknown>) => ({ id: 't1', userId: 'u-other', name: 'T', blocks: [], isStarter: false, isPublic: false, mailerTemplateId: null, ...over });

beforeEach(() => {
	process.env.MAILER_KEY_ENCRYPTION_KEY = KEY;
	(globalThis as any).__dbQueue = [];
	(globalThis as any).fetch = async () => { throw new Error('no network in tests'); };
});

test('send: 401 when not signed in', async () => {
	const res = await send(ev({ user: null, body: goodBody }));
	assert.equal(res.status, 401);
});

test('send: 403 for a cross-origin request, and when Origin is missing', async () => {
	assert.equal((await send(ev({ origin: 'https://evil.test', body: goodBody }))).status, 403);
	assert.equal((await send(ev({ origin: null, body: goodBody }))).status, 403);
});

test('send: 503 when the encryption key is not configured', async () => {
	delete process.env.MAILER_KEY_ENCRYPTION_KEY;
	const res = await send(ev({ body: goodBody }));
	assert.equal(res.status, 503);
	assert.equal((await res.json()).code, 'not_configured');
});

test("send: 403 for another user's private template", async () => {
	(globalThis as any).__dbQueue = [[row({})]];
	const res = await send(ev({ body: goodBody }));
	assert.equal(res.status, 403);
	assert.equal((await res.json()).error, 'Forbidden');
});

test("send: 403 asking for a copy for another user's public template", async () => {
	(globalThis as any).__dbQueue = [[row({ isPublic: true })]];
	const res = await send(ev({ body: goodBody }));
	assert.equal(res.status, 403);
	const body = await res.json();
	assert.equal(body.error, 'Copy this template to your account before sending');
	assert.equal(body.code, 'copy_required');
});

test('send: 400 listing variables that are missing or empty', async () => {
	(globalThis as any).__dbQueue = [[row({ userId: 'u-me', blocks: [{ id: 'a', type: 'content', props: { text: 'Hi {{first_name}} {{ code }}' } }] })]];
	const res = await send(ev({ body: { ...goodBody, variables: { first_name: '  ' } } }));
	assert.equal(res.status, 400);
	const body = await res.json();
	assert.equal(body.code, 'missing_variables');
	assert.deepEqual(body.missing, ['first_name', 'code']);
});

test("mailer-save: 403 for another user's private template, 401 and 503 gates", async () => {
	(globalThis as any).__dbQueue = [[row({})]];
	assert.equal((await mailerSave(ev({ body: { subject: 'S' } }))).status, 403);
	assert.equal((await mailerSave(ev({ user: null, body: { subject: 'S' } }))).status, 401);
	assert.equal((await mailerSave(ev({ origin: 'https://evil.test', body: { subject: 'S' } }))).status, 403);
	delete process.env.MAILER_KEY_ENCRYPTION_KEY;
	assert.equal((await mailerSave(ev({ body: { subject: 'S' } }))).status, 503);
});

test('list templates: 401, 409 when not connected, 503 with no key', async () => {
	assert.equal((await listTemplates(ev({ user: null, method: 'GET' }))).status, 401);
	assert.equal((await listTemplates(ev({ method: 'GET' }))).status, 409);
	delete process.env.MAILER_KEY_ENCRYPTION_KEY;
	assert.equal((await listTemplates(ev({ method: 'GET' }))).status, 503);
});

test('connection GET reports a stored key that cannot be decrypted, without leaking it', async () => {
	const blob = encryptSecret('axm_k_supersecretkey0001', randomBytes(32));
	(globalThis as any).__dbQueue = [[{ keyHint: '0001', connectedAt: new Date(), blob }]];
	const res = await getConnection(ev({ method: 'GET' }));
	assert.equal(res.status, 200);
	const text = await res.text();
	assert.deepEqual({ ...JSON.parse(text), connectedAt: null }, { connected: true, keyHint: '0001', connectedAt: null, configured: true, unreadable: true });
	assert.ok(!text.includes('axm_k_') && !text.includes(blob));
});

test('connection GET with no env key still answers, and DELETE works without it', async () => {
	delete process.env.MAILER_KEY_ENCRYPTION_KEY;
	(globalThis as any).__dbQueue = [[{ keyHint: '0001', connectedAt: new Date(), blob: 'x.y.z' }]];
	const got = await (await getConnection(ev({ method: 'GET' }))).json();
	assert.equal(got.configured, false);
	assert.equal(got.unreadable, true);
	const del = await deleteConnection(ev({ method: 'DELETE' }));
	assert.equal(del.status, 200);
	assert.equal((await del.json()).connected, false);
});
