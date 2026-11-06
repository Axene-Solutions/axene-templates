// Editor store saving: one save at a time, edits made while a save is in flight stay unsaved
// (and are saved next), a half typed placeholder (422) does not retry in a loop, and the
// address bar follows a new or forked template without a navigation.
import { test, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { editor } from '../src/lib/store.svelte.ts';
import { calls } from './support/navigation-stub.mjs';
import { createBlock } from '../src/lib/blocks.ts';

type Pending = { body: any; resolve: (r: { status: number; json?: unknown }) => void };
let pending: Pending[] = [];
let saves = 0;

globalThis.fetch = (async (url: string, init?: RequestInit) => {
	if (url === '/api/render') return new Response(JSON.stringify({ html: '<html></html>' }), { status: 200 });
	if (url === '/api/templates') {
		saves++;
		const body = JSON.parse(String(init?.body));
		return new Promise<Response>((res) => {
			pending.push({ body, resolve: (r) => res(new Response(JSON.stringify(r.json ?? { id: body.id }), { status: r.status })) });
		});
	}
	throw new Error('unexpected fetch ' + url);
}) as typeof fetch;

const flush = async () => {
	for (let i = 0; i < 5; i++) await new Promise((r) => setImmediate(r));
};
let heading = '';

beforeEach(() => {
	pending = [];
	saves = 0;
	calls.length = 0;
	const h = createBlock('heading', { text: 'Hello' });
	heading = h.id;
	editor.setTemplate('t1', 'One', [h]);
});

test('an edit made while a save is in flight stays dirty and is saved next', async () => {
	mock.timers.enable({ apis: ['setTimeout'] });
	try {
		editor.setProp(heading, 'text', 'Hello A', 'text');
		const first = editor.saveTemplate();
		await flush();
		assert.equal(saves, 1);
		editor.setProp(heading, 'text', 'Hello AB', 'text');
		pending[0].resolve({ status: 200 });
		assert.equal(await first, true);
		assert.equal(editor.dirty, true, 'the reply to the older save must not mark the newer edit saved');
		mock.timers.tick(2100);
		await flush();
		assert.equal(saves, 2);
		assert.equal(pending[1].body.blocks[0].props.text, 'Hello AB');
		pending[1].resolve({ status: 200 });
		await flush();
		assert.equal(editor.dirty, false);
	} finally {
		mock.timers.reset();
	}
});

test('a save asked for while one is in flight runs right after it', async () => {
	editor.setProp(heading, 'text', 'X', 'text');
	const first = editor.saveTemplate();
	await flush();
	editor.setProp(heading, 'text', 'XY', 'text');
	assert.equal(await editor.saveTemplate(), false, 'never two saves at once');
	assert.equal(saves, 1);
	pending[0].resolve({ status: 200 });
	await first;
	await flush();
	assert.equal(saves, 2);
	assert.equal(pending[1].body.blocks[0].props.text, 'XY');
	pending[1].resolve({ status: 200 });
	await flush();
	assert.equal(editor.dirty, false);
});

test('a quiet 422 with no newer edit does not retry on its own', async () => {
	mock.timers.enable({ apis: ['setTimeout'] });
	try {
		editor.setProp(heading, 'text', 'Hi {{na', 'text');
		mock.timers.tick(2100); // the autosave
		await flush();
		assert.equal(saves, 1);
		pending[0].resolve({ status: 422, json: { error: 'bad placeholder' } });
		await flush();
		assert.equal(editor.saveState, 'idle');
		assert.equal(editor.dirty, true);
		mock.timers.tick(10_000);
		await flush();
		assert.equal(saves, 1);
	} finally {
		mock.timers.reset();
	}
});

test('saving a new template points the address bar at it without navigating', async () => {
	(globalThis as any).location = { pathname: '/editor' };
	try {
		editor.newTemplate();
		const id = editor.templateId;
		editor.addBlock('content');
		const r = editor.saveTemplate();
		await flush();
		pending[0].resolve({ status: 200, json: { id } });
		assert.equal(await r, true);
		assert.deepEqual(
			calls.map((c) => c.slice(0, 2)),
			[['replaceState', '/editor/' + id]],
		);
		assert.equal(editor.canUndo, true, 'undo history survives the save');
	} finally {
		delete (globalThis as any).location;
	}
});

test('a fork continues on the new copy and keeps undo history', async () => {
	(globalThis as any).location = { pathname: '/editor/starter-1' };
	try {
		const h = createBlock('heading', { text: 'Starter' });
		editor.setTemplate('starter-1', 'Starter', [h]);
		editor.setProp(h.id, 'text', 'Mine', 'text');
		const r = editor.saveTemplate();
		await flush();
		pending[0].resolve({ status: 200, json: { id: 'fork-9', forked: true } });
		await r;
		assert.equal(editor.templateId, 'fork-9');
		assert.deepEqual(
			calls.map((c) => c.slice(0, 2)),
			[['replaceState', '/editor/fork-9']],
		);
		assert.equal(editor.canUndo, true);
	} finally {
		delete (globalThis as any).location;
	}
});
