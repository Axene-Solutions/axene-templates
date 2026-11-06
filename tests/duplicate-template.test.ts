import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';

import { POST as duplicate } from '../src/routes/api/templates/[id]/duplicate/+server.ts';

const ME = { id: 'u-me', email: 'me@test.local', name: 'Me', avatarUrl: null };
const HOST = 'app.test';

function ev(opts: { user?: any; origin?: string | null; contentType?: string | null; id?: string } = {}) {
	const headers = new Headers();
	if (opts.contentType !== null) headers.set('content-type', opts.contentType ?? 'application/json');
	if (opts.origin !== null) headers.set('origin', opts.origin ?? `https://${HOST}`);
	return {
		locals: { user: opts.user === undefined ? ME : opts.user },
		request: new Request(`https://${HOST}/api/templates/t1/duplicate`, { method: 'POST', headers, body: '{}' }),
		url: new URL(`https://${HOST}/api/templates/t1/duplicate`),
		params: { id: opts.id ?? 't1' },
	} as any;
}

const q = (...rows: unknown[][]) => ((globalThis as any).__dbQueue = rows);
const writes = () => (globalThis as any).__dbWrites as { op: string; data: any }[];
const row = (over: Record<string, unknown>) => ({
	id: 't1',
	userId: 'u-other',
	name: 'Welcome email',
	category: 'welcome',
	version: 'v1',
	blocks: [{ id: 'a', type: 'content', props: { text: 'Hi <img src=x onerror="window.__pwned=1">' } }],
	isStarter: false,
	isPublic: false,
	mailerTemplateId: 'mailer-1',
	...over,
});

beforeEach(() => {
	process.env.MAILER_KEY_ENCRYPTION_KEY = randomBytes(32).toString('base64');
	(globalThis as any).__dbQueue = [];
	(globalThis as any).__dbWrites = [];
});

test('duplicate: copies your own template into a new private row owned by you', async () => {
	q([row({ userId: 'u-me', isPublic: true })]);
	const res = await duplicate(ev());
	assert.equal(res.status, 201);
	const body = await res.json();
	assert.match(body.id, /^tpl-[0-9a-f]{16}$/);
	assert.equal(body.name, 'Copy of Welcome email');
	assert.equal(body.isOwn, true);
	assert.equal(body.isPublic, false);
	assert.equal(body.isStarter, false);
	assert.equal(body.blockCount, 1);
	const ins = writes().find((w) => w.op === 'insert')!;
	assert.equal(ins.data.id, body.id);
	assert.equal(ins.data.userId, 'u-me');
	assert.equal(ins.data.isPublic, false);
	assert.equal(ins.data.isStarter, false);
	assert.equal(ins.data.category, 'welcome');
	// The Mailer link is not carried over, and the copy is stored sanitised.
	assert.equal('mailerTemplateId' in ins.data, false);
	assert.doesNotMatch(JSON.stringify(ins.data.blocks), /onerror|<img/i);
	assert.equal(writes().some((w) => w.op === 'update' || w.op === 'delete'), false);
});

test('duplicate: a starter and another user\'s public template can be copied', async () => {
	q([row({ userId: null, isStarter: true, isPublic: true })]);
	assert.equal((await duplicate(ev())).status, 201);
	q([row({ isPublic: true })]);
	const res = await duplicate(ev());
	assert.equal(res.status, 201);
	assert.equal(writes().filter((w) => w.op === 'insert').every((w) => w.data.userId === 'u-me'), true);
});

test('duplicate: another user\'s private template is forbidden and nothing is written', async () => {
	q([row({})]);
	const res = await duplicate(ev());
	assert.equal(res.status, 403);
	assert.equal(writes().length, 0);
});

test('duplicate: unknown template is 404, signed out is 401', async () => {
	q([]);
	assert.equal((await duplicate(ev())).status, 404);
	assert.equal((await duplicate(ev({ user: null }))).status, 401);
	assert.equal(writes().length, 0);
});

test('duplicate: cross-origin and non-JSON requests are refused before any query', async () => {
	q([row({ userId: 'u-me' })]);
	assert.equal((await duplicate(ev({ origin: 'https://evil.test' }))).status, 403);
	assert.equal((await duplicate(ev({ origin: null }))).status, 403);
	assert.equal((await duplicate(ev({ contentType: 'text/plain' }))).status, 415);
	assert.equal(writes().length, 0);
});

test('duplicate: the copy name is capped at 120 characters', async () => {
	q([row({ userId: 'u-me', name: 'x'.repeat(120) })]);
	const body = await (await duplicate(ev())).json();
	assert.equal(body.name.length, 120);
});

test('duplicate: a user is rate limited after 60 copies in an hour', async () => {
	const user = { ...ME, id: 'u-rate' };
	let last = 0;
	for (let i = 0; i < 61; i++) {
		q([row({ userId: 'u-rate' })]);
		last = (await duplicate(ev({ user }))).status;
	}
	assert.equal(last, 429);
});
