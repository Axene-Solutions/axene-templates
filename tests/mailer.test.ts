import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { encryptSecret, decryptSecret, parseEncryptionKey } from '../src/lib/server/mailer/crypto.ts';
import {
	validateRecipients, validateVariables, validateSubject, validateApiKey, validateFrom,
	escapeVariables, htmlToText, detectVariables, MAX_RECIPIENTS,
} from '../src/lib/server/mailer/validate.ts';
import { mapMailerStatus } from '../src/lib/server/mailer/errors.ts';
import { isSameOrigin, createRateLimiter } from '../src/lib/server/mailer/guard.ts';

const key = randomBytes(32);

test('encrypt/decrypt round trip, random IV, format iv.tag.ct', () => {
	const a = encryptSecret('axm_k_secret1234', key);
	const b = encryptSecret('axm_k_secret1234', key);
	assert.notEqual(a, b);
	assert.equal(a.split('.').length, 3);
	assert.ok(!a.includes('axm_k_'));
	assert.equal(decryptSecret(a, key), 'axm_k_secret1234');
});

test('tampering and wrong key are detected', () => {
	const blob = encryptSecret('axm_k_secret1234', key);
	const [iv, tag, ct] = blob.split('.');
	const flipped = Buffer.from(ct, 'base64');
	flipped[0] ^= 1;
	assert.throws(() => decryptSecret([iv, tag, flipped.toString('base64')].join('.'), key));
	const badTag = Buffer.from(tag, 'base64');
	badTag[0] ^= 1;
	assert.throws(() => decryptSecret([iv, badTag.toString('base64'), ct].join('.'), key));
	assert.throws(() => decryptSecret(blob, randomBytes(32)));
	assert.throws(() => decryptSecret('nope', key));
});

test('parseEncryptionKey fails closed', () => {
	assert.ok(parseEncryptionKey(key.toString('base64')));
	for (const bad of [undefined, null, '', 'short', randomBytes(16).toString('base64'), randomBytes(33).toString('base64'), '!!!']) {
		assert.equal(parseEncryptionKey(bad as any), null);
	}
});

test('recipients: dedupe, validate, cap', () => {
	assert.deepEqual(validateRecipients(['A@x.com', 'a@x.com', ' b@x.co.ke ']), { ok: true, value: ['A@x.com', 'b@x.co.ke'] });
	for (const bad of [[], 'a@x.com', ['bad'], ['a@x.com,b@x.com'], ['a b@x.com'], ['<a@x.com>'], [1], ['a@x']]) {
		assert.equal(validateRecipients(bad).ok, false, JSON.stringify(bad));
	}
	const many = Array.from({ length: MAX_RECIPIENTS + 1 }, (_, i) => `u${i}@x.com`);
	assert.equal(validateRecipients(many).ok, false);
	assert.equal(validateRecipients(many.slice(0, MAX_RECIPIENTS)).ok, true);
});

test('subject, from, api key', () => {
	assert.equal(validateSubject('').ok, false);
	assert.equal(validateSubject('   ').ok, false);
	assert.equal(validateSubject('x'.repeat(201)).ok, false);
	assert.deepEqual(validateSubject('Hi\r\nBcc: evil@x.com'), { ok: true, value: 'Hi Bcc: evil@x.com' });
	assert.equal(validateFrom({ email: 'bad' }).ok, false);
	assert.deepEqual(validateFrom({ email: 'a@x.com', name: 'Ann\nB' }), { ok: true, value: { email: 'a@x.com', name: 'Ann B' } });
	assert.equal(validateApiKey('sk_live_123456789012345').ok, false);
	assert.equal(validateApiKey('axm_k_short').ok, false);
	assert.equal(validateApiKey('axm_k_' + 'a'.repeat(30)).ok, true);
	assert.equal(validateApiKey('axm_k_' + 'a'.repeat(300)).ok, false);
});

test('variables: plain object, scalars only, max 50', () => {
	assert.deepEqual(validateVariables(undefined), { ok: true, value: {} });
	assert.deepEqual(validateVariables({ a: 'x', b: 1, c: true }), { ok: true, value: { a: 'x', b: 1, c: true } });
	for (const bad of [[], 'x', 5, { a: {} }, { a: [1] }, { a: null }, { 'a b': 1 }, { a: NaN }]) {
		assert.equal(validateVariables(bad as any).ok, false, JSON.stringify(bad));
	}
	assert.equal(validateVariables(JSON.parse('{"__proto__": 1}')).ok, false);
	const fifty = Object.fromEntries(Array.from({ length: 50 }, (_, i) => [`k${i}`, i]));
	assert.equal(validateVariables(fifty).ok, true);
	assert.equal(validateVariables({ ...fifty, extra: 1 }).ok, false);
});

test('escape variables, html to text, variable detection', () => {
	assert.deepEqual(escapeVariables({ a: '<b>"&', n: 3 }), { a: '&lt;b&gt;&quot;&amp;', n: 3 });
	assert.equal(htmlToText('<style>p{}</style><p>Hello&nbsp;<b>you</b></p><p>Bye</p>'), 'Hello you\nBye');
	assert.deepEqual(detectVariables('{{name}} and {{ otp }} {{{raw}}} {{#each items}}'), ['name', 'otp', 'raw']);
});

test('mailer status mapping, no raw bodies', () => {
	assert.equal(mapMailerStatus(401).code, 'mailer_key_invalid');
	assert.equal(mapMailerStatus(403).code, 'mailer_forbidden');
	assert.equal(mapMailerStatus(422).code, 'mailer_sender_not_registered');
	assert.equal(mapMailerStatus(429).code, 'mailer_rate_limited');
	assert.equal(mapMailerStatus(500).code, 'mailer_unavailable');
	assert.equal(mapMailerStatus(503).http, 502);
	assert.equal(mapMailerStatus(0).code, 'mailer_unreachable');
	assert.equal(mapMailerStatus(0).http, 502);
});

test('origin check compares host, rejects missing/foreign', () => {
	assert.equal(isSameOrigin('https://templates.axene.io', 'templates.axene.io'), true);
	assert.equal(isSameOrigin('http://localhost:5173', 'localhost:5173'), true);
	assert.equal(isSameOrigin(null, 'a.io'), false);
	assert.equal(isSameOrigin('https://evil.io', 'templates.axene.io'), false);
	assert.equal(isSameOrigin('https://templates.axene.io.evil.io', 'templates.axene.io'), false);
	assert.equal(isSameOrigin('null', 'a.io'), false);
});

test('rate limiter: 20 per hour then Retry-After, window slides', () => {
	const rl = createRateLimiter(20, 3600_000);
	for (let i = 0; i < 20; i++) assert.equal(rl.hit('u', 1000 + i), 0);
	assert.ok(rl.hit('u', 2000) > 0);
	assert.equal(rl.hit('other', 2000), 0);
	assert.equal(rl.hit('u', 1000 + 3600_000 + 1), 0);
});
