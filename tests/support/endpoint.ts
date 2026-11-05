// Shared harness for endpoint tests: a fake signed-in request event, a stored row, an encrypted
// test key and a fetch stub that records what would have been sent to Mailer. No network.
import { randomBytes } from 'node:crypto';
import { encryptSecret } from '../../src/lib/server/mailer/crypto.ts';

export const ME = { id: 'u-me', email: 'me@test.local', name: 'Me', avatarUrl: null };
const ENC = randomBytes(32);

export type Call = { path: string; body: any };

/** Installs the key and a fetch stub. `links` is what GET /template-links/ returns. */
export function setup(links: { id: string; key: string; url: string; label: string }[] = []): Call[] {
	process.env.MAILER_KEY_ENCRYPTION_KEY = ENC.toString('base64');
	const calls: Call[] = [];
	(globalThis as any).fetch = async (url: string, init: any) => {
		const u = new URL(url);
		calls.push({ path: u.pathname, body: init?.body ? JSON.parse(init.body) : undefined });
		if (u.pathname.endsWith('/template-links/')) return new Response(JSON.stringify(links), { status: 200 });
		if (u.pathname.endsWith('/emails/')) return new Response(JSON.stringify({ status: 'queued' }), { status: 202 });
		return new Response(JSON.stringify({ id: 'm1', name: 'T', subject: 'S', updated_at: '2026-11-01T00:00:00Z' }), { status: 201 });
	};
	return calls;
}

export function ev(body: unknown, raw?: string) {
	return {
		locals: { user: ME },
		request: new Request('https://app.test/x', {
			method: 'POST',
			headers: { 'content-type': 'application/json', origin: 'https://app.test' },
			body: raw ?? JSON.stringify(body),
		}),
		url: new URL('https://app.test/x'),
		params: { id: 't1' },
	} as any;
}

export const row = (blocks: unknown) => ({ id: 't1', userId: 'u-me', name: 'T', category: 'general', version: 'v1', blocks, isStarter: false, isPublic: false, mailerTemplateId: null });

/** Queues the template row and the Mailer connection for one endpoint call. */
export function queue(blocks: unknown): void {
	(globalThis as any).__dbQueue = [[row(blocks)], [{ apiKeyEncrypted: encryptSecret('axm_k_testonlykey00000001', ENC) }]];
}

export const sendBody = { from: { email: 'a@b.test' }, to: ['c@d.test'], subject: 'Hi' };
export const content = (text: string, id = 'a') => ({ id, type: 'content', props: { text } });
