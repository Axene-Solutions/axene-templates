// A 401 from the app's own API renews the session once (shared by parallel callers) and retries.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withSessionRefresh } from '../src/lib/session-refresh.ts';

const ORIGIN = 'https://templates.axene.io';

function fake(opts: { refreshOk: boolean; refreshDelay?: number }) {
	let signedIn = false;
	const log: string[] = [];
	const base = (async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = String(input);
		log.push((init?.method ?? 'GET') + ' ' + url);
		if (url === '/auth/refresh') {
			await new Promise((r) => setTimeout(r, opts.refreshDelay ?? 5));
			if (opts.refreshOk) signedIn = true;
			return new Response('{}', { status: opts.refreshOk ? 200 : 401 });
		}
		if (url.startsWith('/api/') || url.startsWith(ORIGIN + '/api/')) return new Response('{}', { status: signedIn ? 200 : 401 });
		return new Response('{}', { status: 401 });
	}) as typeof fetch;
	return { base, log };
}

test('a 401 from /api renews the session and retries the same request', async () => {
	const { base, log } = fake({ refreshOk: true });
	const f = withSessionRefresh(base, ORIGIN);
	const res = await f('/api/templates', { method: 'POST', body: '{"a":1}' });
	assert.equal(res.status, 200);
	assert.deepEqual(log, ['POST /api/templates', 'POST /auth/refresh', 'POST /api/templates']);
});

test('parallel 401s share one refresh request', async () => {
	const { base, log } = fake({ refreshOk: true, refreshDelay: 20 });
	const f = withSessionRefresh(base, ORIGIN);
	const all = await Promise.all([f('/api/render', { method: 'POST' }), f('/api/templates', { method: 'POST' }), f('/api/mailer/plan')]);
	assert.deepEqual(all.map((r) => r.status), [200, 200, 200]);
	assert.equal(log.filter((l) => l === 'POST /auth/refresh').length, 1);
});

test('a failed refresh returns the original 401 and is not retried in a storm', async () => {
	const { base, log } = fake({ refreshOk: false });
	const f = withSessionRefresh(base, ORIGIN);
	assert.equal((await f('/api/templates', { method: 'POST' })).status, 401);
	assert.equal((await f('/api/templates', { method: 'POST' })).status, 401);
	assert.equal(log.filter((l) => l === 'POST /auth/refresh').length, 1);
});

test('other origins and non-API paths are never retried', async () => {
	const { base, log } = fake({ refreshOk: true });
	const f = withSessionRefresh(base, ORIGIN);
	assert.equal((await f('https://mail.axene.io/api/x')).status, 401);
	assert.equal((await f('/login')).status, 401);
	assert.equal(log.includes('POST /auth/refresh'), false);
});
