// The Mailer state sent by a page's server load is shown until the first client load settles,
// so the page renders in its real state (no "Loading..." line that then shifts the layout).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page } from './support/state-stub.mjs';
import { mailer } from '../src/lib/mailer.svelte.ts';

test('seeded state shows before the first load, the server answer wins after it', async () => {
	(page as any).data = { mailerConnection: { connected: true, keyHint: 'abcd', connectedAt: '2026-11-01T10:00:00Z', configured: true, unreadable: false } };
	assert.equal(mailer.status, 'connected');
	assert.equal(mailer.keyHint, 'abcd');

	let release!: () => void;
	globalThis.fetch = (async () => {
		await new Promise<void>((r) => (release = r));
		return new Response(JSON.stringify({ connected: false, keyHint: null, connectedAt: null, configured: true, unreadable: false }), { status: 200 });
	}) as typeof fetch;
	const loading = mailer.load();
	assert.equal(mailer.status, 'connected', 'still the seed while the request is in flight');
	release();
	await loading;
	assert.equal(mailer.status, 'disconnected');

	// A later reload shows its own loading state: the old seed is never used again.
	globalThis.fetch = (() => new Promise(() => {})) as typeof fetch;
	void mailer.load();
	assert.equal(mailer.status, 'loading');
	(page as any).data = {};
});

test('a page without a seed shows loading as before', async () => {
	assert.equal(mailer.status, 'loading');
});
