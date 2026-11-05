import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { encryptSecret } from '../src/lib/server/mailer/crypto.ts';
import { forgetPlans } from '../src/lib/server/mailer/plancache.ts';

import { POST as saveTemplate } from '../src/routes/api/templates/+server.ts';
import { GET as getTemplate, PATCH as patchTemplate } from '../src/routes/api/templates/[id]/+server.ts';
import { POST as open } from '../src/routes/api/mailer/templates/[mailerId]/open/+server.ts';
import { POST as mailerSave } from '../src/routes/api/templates/[id]/mailer-save/+server.ts';
import { POST as send } from '../src/routes/api/templates/[id]/send/+server.ts';
import { POST as compileTpl } from '../src/routes/api/templates/compile/+server.ts';

const ENC = randomBytes(32);
const SECRET = 'axm_k_testonlykey00000001';
const ME = { id: 'u-me', email: 'me@test.local', name: 'Me', avatarUrl: null };
const OTHER = { id: 'u-other', email: 'o@test.local', name: 'O', avatarUrl: null };
const HOST = 'app.test';

function ev(opts: { user?: any; method?: string; origin?: string | null; body?: unknown; params?: Record<string, string> } = {}) {
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

type Call = { method: string; path: string; body: any };
let calls: Call[] = [];
let upstream: (c: Call) => { status: number; json?: unknown } = () => ({ status: 200, json: {} });
const q = (...rows: (unknown[] | (() => unknown[]))[]) => ((globalThis as any).__dbQueue = rows);
const writes = () => (globalThis as any).__dbWrites as { op: string; data: any }[];
const connected = () => [{ apiKeyEncrypted: encryptSecret(SECRET, ENC) }];

beforeEach(() => {
	process.env.MAILER_KEY_ENCRYPTION_KEY = ENC.toString('base64');
	(globalThis as any).__dbQueue = [];
	(globalThis as any).__dbWrites = [];
	calls = [];
	forgetPlans(ME.id);
	upstream = () => ({ status: 200, json: {} });
	(globalThis as any).fetch = async (url: string, init: RequestInit) => {
		const u = new URL(url);
		const call: Call = { method: init.method ?? 'GET', path: u.pathname, body: init.body ? JSON.parse(init.body as string) : undefined };
		calls.push(call);
		const r = upstream(call);
		return new Response(JSON.stringify(r.json ?? null), { status: r.status, headers: { 'content-type': 'application/json' } });
	};
});

// The audit's payloads.
const IMG = '<img src=x onerror="window.__pwned=1">';
const ENTITY_HREF = '<a href="javascript&#58;window.__pwned=1">click</a>';
const COLOR_BREAKOUT = '"><mj-raw><script>window.__pwned=1</script></mj-raw>';
const evil = [
	{ id: 'a', type: 'content', props: { text: `Hello ${IMG} ${ENTITY_HREF}` } },
	{ id: 'b', type: 'footer', props: { text: '<svg onload="window.__pwned=1"></svg>f<a href="https://ok.test">ok</a>' } },
];
const noScript = (v: unknown) => assert.doesNotMatch(JSON.stringify(v), /onerror|javascript|mj-raw|<script|<img/i);

const row = (over: Record<string, unknown>) => ({ id: 't1', userId: 'u-other', name: 'T', category: 'general', version: 'v1', blocks: [], isStarter: false, isPublic: false, mailerTemplateId: null, ...over });

// ---- POST /api/templates ----

test('POST /api/templates: a public template with HTML payloads is stored sanitised', async () => {
	q([]); // no existing row
	const res = await saveTemplate(ev({ body: { id: 'evil-1', name: 'Evil', isPublic: true, blocks: evil } }));
	assert.equal(res.status, 200);
	const ins = writes().find((w) => w.op === 'insert')!;
	assert.equal(ins.data.isPublic, true);
	noScript(ins.data.blocks);
	assert.match(ins.data.blocks[0].props.text, /^Hello\s+<a>click<\/a>$/);
	assert.equal(ins.data.blocks[1].props.text, 'f<a href="https://ok.test" rel="noopener noreferrer" target="_blank">ok</a>');
});

test('POST /api/templates: an attribute breakout in a colour is refused with 422 and nothing is stored', async () => {
	q([]);
	const res = await saveTemplate(ev({ body: { id: 'evil-2', name: 'Evil', isPublic: true, blocks: [{ id: 'a', type: 'heading', props: { text: 'x', color: COLOR_BREAKOUT } }] } }));
	assert.equal(res.status, 422);
	const body = await res.json();
	assert.equal(body.code, 'invalid_blocks');
	assert.match(body.error, /heading\.color/);
	assert.equal(writes().length, 0);
});

test('POST /api/templates: a javascript: link in footer links is refused', async () => {
	q([]);
	const res = await saveTemplate(ev({ body: { id: 'evil-3', name: 'E', isPublic: true, blocks: [{ id: 'b', type: 'footer', props: { links: [{ label: 'x', url: 'javascript:alert(1)' }] } }] } }));
	assert.equal(res.status, 422);
	assert.equal(writes().length, 0);
});

test('POST /api/templates: bad id, bad blocks and unauthenticated are refused', async () => {
	assert.equal((await saveTemplate(ev({ user: null, body: {} }))).status, 401);
	assert.equal((await saveTemplate(ev({ body: { id: '../x', name: 'n', blocks: [] } }))).status, 400);
	assert.equal((await saveTemplate(ev({ body: { id: 'x', name: 'n', blocks: 'nope' } }))).status, 422);
	assert.equal((await saveTemplate(ev({ body: { id: 'x', name: 'n', blocks: [{ id: 'a', type: 'mj-raw', props: {} }] } }))).status, 422);
});

test('POST /api/templates: updating your own row also stores the sanitised blocks and keeps isPublic when omitted', async () => {
	q([row({ id: 'mine', userId: 'u-me', isPublic: true })]);
	const res = await saveTemplate(ev({ body: { id: 'mine', name: 'Mine', blocks: evil } }));
	assert.equal(res.status, 200);
	const upd = writes().find((w) => w.op === 'update')!;
	noScript(upd.data.blocks);
	assert.equal(upd.data.isPublic, true);
});

// ---- GET and PATCH /api/templates/[id] ----

test('GET /api/templates/[id]: a malicious public row stored before the fix is served sanitised', async () => {
	const stored = [
		{ id: 'a', type: 'content', props: { text: IMG + ENTITY_HREF } },
		{ id: 'b', type: 'heading', props: { text: 'x', color: COLOR_BREAKOUT } },
		{ id: 'c', type: 'footer', props: { links: [{ label: 'x', url: 'javascript:alert(1)' }] } },
		{ id: 'd', type: 'mj-raw', props: { html: '<script>1</script>' } },
	];
	q([row({ isPublic: true, blocks: stored })]);
	const res = await getTemplate(ev({ method: 'GET', user: ME }));
	assert.equal(res.status, 200);
	const body = await res.json();
	noScript(body.blocks);
	assert.equal(body.blocks.length, 3);
	assert.equal(body.blocks[1].props.color, '#111827');
	assert.deepEqual(body.blocks[2].props.links, []);
});

test('GET /api/templates/[id]: the owner gets their own private row sanitised too', async () => {
	q([row({ userId: 'u-me', blocks: [{ id: 'a', type: 'content', props: { text: '<svg onload=alert(1)>' } }] })]);
	const body = await (await getTemplate(ev({ method: 'GET' }))).json();
	assert.equal(body.blocks[0].props.text, '');
});

test('PATCH making a template public rewrites its stored blocks in sanitised form', async () => {
	q([row({ userId: 'u-me', blocks: evil })]);
	const res = await patchTemplate(ev({ method: 'PATCH', body: { isPublic: true } }));
	assert.equal(res.status, 200);
	const upd = writes().find((w) => w.op === 'update')!;
	assert.equal(upd.data.isPublic, true);
	noScript(upd.data.blocks);
});

// ---- Mailer open ----

const openEv = (mailerId: string, over: Record<string, unknown> = {}) => ev({ params: { mailerId }, ...over });
const mailerTpl = (blocks: unknown, over: Record<string, unknown> = {}) => ({ id: 'm1', name: 'From Mailer', subject: 'S', blocks_json: { format: 'axene-blocks', version: 1, blocks }, updated_at: '2026-11-01T10:00:00Z', ...over });

test('open: a Mailer envelope with the audit payloads is refused with 422 and nothing is stored', async () => {
	const payloads = [
		[{ id: 'a', type: 'content', props: { text: IMG } }],
		[{ id: 'a', type: 'content', props: { text: ENTITY_HREF } }],
		[{ id: 'a', type: 'button', props: { href: 'javascript&#58;alert(1)' } }],
		[{ id: 'a', type: 'heading', props: { text: 'x', color: COLOR_BREAKOUT } }],
		[{ id: 'a', type: 'evil', props: {} }],
		'not an array',
	];
	for (const p of payloads) {
		q(connected());
		upstream = () => ({ status: 200, json: mailerTpl(p) });
		const res = await open(openEv('m1'));
		assert.equal(res.status, 422, JSON.stringify(p));
		assert.equal((await res.json()).code, 'invalid_blocks');
	}
	assert.equal(writes().length, 0);
});

test('open: cross-origin, signed out and not connected are refused before Mailer is called', async () => {
	assert.equal((await open(openEv('m1', { origin: 'https://evil.test' }))).status, 403);
	assert.equal((await open(openEv('m1', { origin: null }))).status, 403);
	assert.equal((await open(openEv('m1', { user: null }))).status, 401);
	q([]); // no connection row
	const res = await open(openEv('m1'));
	assert.equal(res.status, 409);
	assert.equal((await res.json()).code, 'not_connected');
	assert.equal(calls.length, 0);
});

// ---- Tripwire ----

test('send: the compiled HTML tripwire refuses a script URL that came in through a variable', async () => {
	q([row({ userId: 'u-me', blocks: [{ id: 'a', type: 'button', props: { text: 'Go', href: '{{site}}' } }] })], connected());
	const res = await send(ev({ body: { from: { email: 'a@b.test' }, to: ['c@d.test'], subject: 'Hi', variables: { site: 'javascript:alert(1)' } } }));
	assert.equal(res.status, 422);
	const body = await res.json();
	assert.equal(body.code, 'unsafe_html');
	assert.match(body.error, /safety check/);
	assert.equal(calls.length, 0, 'nothing reached Mailer');
});

test('mailer-save: an old malicious row is compiled from sanitised blocks, and the envelope is clean', async () => {
	q([row({ userId: 'u-me', blocks: evil })], connected());
	upstream = (c) => ({ status: 201, json: { id: 'm-new', name: 'T', subject: 'S', updated_at: '2026-11-01T10:00:00Z' } });
	const res = await mailerSave(ev({ body: { subject: 'S' } }));
	assert.equal(res.status, 200);
	const post = calls.find((c) => c.method === 'POST')!;
	noScript(post.body.html_body);
	noScript(post.body.blocks_json);
});


// ---- Save to Mailer: copy rule and sync precondition ----

test("mailer-save: another user's public template needs a copy, like send, and Mailer is never called", async () => {
	q([row({ isPublic: true, blocks: evil })], connected());
	const res = await mailerSave(ev({ body: { subject: 'S' } }));
	assert.equal(res.status, 403);
	const body = await res.json();
	assert.equal(body.code, 'copy_required');
	assert.equal(calls.length, 0);
});

test('mailer-save: a starter can still be saved to Mailer as a new template', async () => {
	q([row({ userId: null, isStarter: true, isPublic: true, blocks: [{ id: 'a', type: 'heading', props: { text: 'Hi' } }] })], connected());
	upstream = () => ({ status: 201, json: { id: 'm-new', name: 'T', subject: 'S', updated_at: 'v1' } });
	const res = await mailerSave(ev({ body: { subject: 'S' } }));
	assert.equal(res.status, 200);
	assert.deepEqual(calls.map((c) => c.method), ['POST']);
	assert.equal(writes().length, 0, 'a starter row is never linked');
});

const linkedRow = (over: Record<string, unknown> = {}) =>
	row({ userId: 'u-me', mailerTemplateId: 'm1', mailerSyncedAt: '2026-11-01T10:00:00Z', updatedAt: new Date('2026-11-02T00:00:00Z'), blocks: [{ id: 'a', type: 'heading', props: { text: 'Hi' } }], ...over });

test('mailer-save: 409 mailer_template_changed when Mailer changed since it was opened, and nothing is written', async () => {
	q([linkedRow()], connected());
	upstream = (c) => (c.method === 'GET' ? { status: 200, json: mailerTpl([], { updated_at: '2026-11-03T09:00:00Z' }) } : { status: 500 });
	const res = await mailerSave(ev({ body: { subject: 'S' } }));
	assert.equal(res.status, 409);
	const body = await res.json();
	assert.equal(body.code, 'mailer_template_changed');
	assert.match(body.error, /changed in Mailer since you opened it/);
	assert.deepEqual(calls.map((c) => c.method), ['GET']);
	assert.equal(writes().length, 0);
});

test('mailer-save: a row linked before sync tracking also asks first instead of overwriting', async () => {
	q([linkedRow({ mailerSyncedAt: null })], connected());
	upstream = () => ({ status: 200, json: mailerTpl([]) });
	assert.equal((await mailerSave(ev({ body: { subject: 'S' } }))).status, 409);
});

test('mailer-save: overwrite: true replaces the changed Mailer copy and records the new version', async () => {
	q([linkedRow()], connected());
	upstream = (c) => (c.method === 'GET' ? { status: 200, json: mailerTpl([], { updated_at: '2026-11-03T09:00:00Z' }) } : { status: 200, json: { id: 'm1', name: 'T', subject: 'S', updated_at: '2026-11-04T00:00:00Z' } });
	const res = await mailerSave(ev({ body: { subject: 'S', overwrite: true } }));
	assert.equal(res.status, 200);
	assert.deepEqual(calls.map((c) => c.method), ['GET', 'PATCH']);
	const upd = writes().find((w) => w.op === 'update')!;
	assert.equal(upd.data.mailerSyncedAt, '2026-11-04T00:00:00Z');
	assert.deepEqual(upd.data.mailerSyncedLocalAt, new Date('2026-11-02T00:00:00Z'));
});

test('mailer-save: an unchanged Mailer copy is updated without asking', async () => {
	q([linkedRow()], connected());
	upstream = (c) => (c.method === 'GET' ? { status: 200, json: mailerTpl([]) } : { status: 200, json: { id: 'm1', name: 'T', subject: 'S', updated_at: '2026-11-05T00:00:00Z' } });
	const res = await mailerSave(ev({ body: { subject: 'S' } }));
	assert.equal(res.status, 200);
	assert.equal((await res.json()).created, false);
	assert.deepEqual(calls.map((c) => c.method), ['GET', 'PATCH']);
});

test('mailer-save: a template deleted in Mailer is created again and relinked', async () => {
	q([linkedRow()], connected());
	upstream = (c) => (c.method === 'GET' ? { status: 404, json: { detail: 'not found' } } : { status: 201, json: { id: 'm2', name: 'T', subject: 'S', updated_at: 'v9' } });
	const res = await mailerSave(ev({ body: { subject: 'S' } }));
	assert.equal(res.status, 200);
	assert.equal((await res.json()).created, true);
	assert.deepEqual(calls.map((c) => c.method), ['GET', 'POST']);
	assert.equal(writes().find((w) => w.op === 'update')!.data.mailerTemplateId, 'm2');
});

// ---- Mailer open: create, reuse, refresh, conflict ----

const goodBlocks = [{ id: 'a', type: 'heading', props: { text: 'From <b>Mailer</b>' } }];
const insertedId = () => writes().find((w) => w.op === 'insert')!.data.id;

test('open: first open creates a row for the caller with the sanitised blocks and Mailer version', async () => {
	q(connected(), [], [], () => [{ id: insertedId() }]);
	upstream = () => ({ status: 200, json: mailerTpl(goodBlocks) });
	const res = await open(openEv('m1'));
	assert.equal(res.status, 200);
	const body = await res.json();
	assert.equal(body.created, true);
	assert.equal(body.state, 'in_sync');
	const ins = writes().find((w) => w.op === 'insert')!.data;
	assert.equal(body.id, ins.id);
	assert.equal(ins.userId, 'u-me');
	assert.equal(ins.mailerTemplateId, 'm1');
	assert.equal(ins.mailerSyncedAt, '2026-11-01T10:00:00Z');
	assert.deepEqual(ins.blocks, goodBlocks);
});

test("open: user B opening user A's Mailer id gets B's own new row, never A's", async () => {
	// The lookup is scoped to the caller, so A's row is not found for B.
	q(connected(), [], [], () => [{ id: insertedId() }]);
	upstream = () => ({ status: 200, json: mailerTpl(goodBlocks) });
	const res = await open(openEv('m1', { user: OTHER }));
	const body = await res.json();
	assert.equal(body.created, true);
	assert.equal(writes().find((w) => w.op === 'insert')!.data.userId, 'u-other');
});

test('open: a concurrent second open loses the insert race and reuses the winning row', async () => {
	q(connected(), [], [], [{ id: 'mailer-winner' }]);
	upstream = () => ({ status: 200, json: mailerTpl(goodBlocks) });
	const body = await (await open(openEv('m1'))).json();
	assert.deepEqual([body.id, body.created], ['mailer-winner', false]);
});

const existing = (over: Record<string, unknown> = {}) => [{ id: 'mailer-mine', updatedAt: new Date('2026-11-01T10:00:00Z'), mailerSyncedAt: '2026-11-01T10:00:00Z', mailerSyncedLocalAt: new Date('2026-11-01T10:00:00Z'), ...over }];

test('open: reuse returns the existing row untouched when Mailer has not changed', async () => {
	q(connected(), existing());
	upstream = () => ({ status: 200, json: mailerTpl(goodBlocks) });
	const body = await (await open(openEv('m1'))).json();
	assert.deepEqual(body, { id: 'mailer-mine', created: false, state: 'in_sync' });
	assert.equal(writes().length, 0);
});

test('open: Mailer newer and no local edits refreshes the local copy', async () => {
	q(connected(), existing());
	upstream = () => ({ status: 200, json: mailerTpl(goodBlocks, { updated_at: '2026-11-03T00:00:00Z' }) });
	const body = await (await open(openEv('m1'))).json();
	assert.equal(body.state, 'refreshed');
	const upd = writes().find((w) => w.op === 'update')!.data;
	assert.deepEqual(upd.blocks, goodBlocks);
	assert.equal(upd.mailerSyncedAt, '2026-11-03T00:00:00Z');
});

test('open: Mailer newer and local edits keeps the local copy and reports a conflict', async () => {
	q(connected(), existing({ updatedAt: new Date('2026-11-02T00:00:00Z') }));
	upstream = () => ({ status: 200, json: mailerTpl(goodBlocks, { updated_at: '2026-11-03T00:00:00Z' }) });
	const body = await (await open(openEv('m1'))).json();
	assert.deepEqual(body, { id: 'mailer-mine', created: false, state: 'conflict' });
	assert.equal(writes().length, 0);
});

test('open: reload: true replaces local edits with the Mailer copy', async () => {
	q(connected(), existing({ updatedAt: new Date('2026-11-02T00:00:00Z') }));
	upstream = () => ({ status: 200, json: mailerTpl(goodBlocks, { updated_at: '2026-11-03T00:00:00Z' }) });
	const body = await (await open(openEv('m1', { body: { reload: true } }))).json();
	assert.equal(body.state, 'refreshed');
	assert.equal(writes().filter((w) => w.op === 'update').length, 1);
});

// ---- /api/templates/compile ----

test('compile: renders the starter row it finds, sanitised, with variables', async () => {
	q([row({ userId: null, isStarter: true, isPublic: true, category: 'otp', blocks: [{ id: 'a', type: 'heading', props: { text: 'Code {{code}} <img src=x onerror=1>' } }] })]);
	const res = await compileTpl({ request: new Request('https://app.test/api/templates/compile?category=otp', { method: 'POST', body: JSON.stringify({ data: { code: '123456' } }) }), url: new URL('https://app.test/api/templates/compile?category=otp') } as any);
	assert.equal(res.status, 200);
	const body = await res.json();
	assert.match(body.html, /Code 123456/);
	assert.doesNotMatch(body.html, /onerror|<img src="x"/);
});
