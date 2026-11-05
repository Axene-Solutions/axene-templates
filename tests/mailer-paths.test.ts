import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Mailer (FastAPI) answers a collection route without its trailing slash with a
// 307 to an http:// URL, and our client refuses redirects (redirect: 'error'),
// so the call would fail. These collection routes MUST keep their trailing slash.
// Verified against the live Mailer: only the routes below behave this way.
const src = readFileSync(new URL('../src/lib/server/mailer/client.ts', import.meta.url), 'utf8');

test('collection routes keep their trailing slash', () => {
	for (const path of ['/template-links', '/templates', '/sender-addresses', '/emails']) {
		const bad = new RegExp(`call\\(apiKey, '(GET|POST)', '${path}'[,)]`);
		assert.ok(!bad.test(src), `client calls ${path} without a trailing slash`);
	}
});

test('every collection call that exists uses a trailing slash', () => {
	const calls = [...src.matchAll(/call\(apiKey, '(GET|POST)', '(\/[a-z-]+\/?)'/g)].map((m) => m[2]);
	assert.ok(calls.length >= 4, 'expected to find the collection calls');
	const allowedSlashless = new Set(['/contacts/fields', '/billing/usage', '/billing/plans']);
	for (const p of calls) {
		assert.ok(p.endsWith('/') || allowedSlashless.has(p), `${p} must end with a slash`);
	}
});
