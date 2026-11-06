import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../src/hooks.server.ts';

// The editor must never be reachable without signing in. Every editor path, with or without
// an id or query string, redirects to /login and keeps the target so sign in returns there.
function signedOutEvent(pathAndQuery: string) {
	const url = new URL('https://templates.example.test' + pathAndQuery);
	return {
		url,
		cookies: { get: () => undefined, set: () => {}, delete: () => {} },
		locals: {} as Record<string, unknown>,
		request: new Request(url),
		params: {},
	};
}

const PATHS = [
	'/editor',
	'/editor/',
	'/editor/starter-newsletter-abc',
	'/editor/00000000-0000-4000-8000-000000000000',
	'/editor?mailer=new',
	'/editor?import=ai',
	'/editor/some-id/anything',
	'/settings',
];

for (const p of PATHS) {
	test(`signed out ${p} redirects to login`, async () => {
		let reached = false;
		const resolve = async () => {
			reached = true;
			return new Response('page');
		};
		await assert.rejects(
			async () => {
				await handle({ event: signedOutEvent(p) as never, resolve: resolve as never });
			},
			(e: unknown) => {
				const r = e as { status?: number; location?: string };
				assert.equal(r.status, 302);
				assert.ok(r.location?.startsWith('/login'), `location ${r.location}`);
				return true;
			},
		);
		assert.equal(reached, false, 'the page must not render for a signed out request');
	});
}

test('the redirect keeps a safe next target and drops an unsafe one', async () => {
	await assert.rejects(
		async () => {
			await handle({ event: signedOutEvent('/editor/abc?mailer=1') as never, resolve: (async () => new Response('x')) as never });
		},
		(e: unknown) => {
			assert.equal((e as { location?: string }).location, '/login?next=' + encodeURIComponent('/editor/abc?mailer=1'));
			return true;
		},
	);
});
