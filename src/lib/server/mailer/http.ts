import { json, type RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { mailerConnections } from '$lib/server/db/schema';
import { getEncryptionKey } from './config';
import { decryptSecret } from './crypto.ts';
import { isSameOrigin } from './guard.ts';
import type { MappedError } from './errors.ts';

export type Authed = { user: NonNullable<App.Locals['user']>; key: Buffer };

/**
 * Common gate for every Mailer endpoint, in this order:
 * 401 not signed in, 403 cross-origin state change, 503 encryption not configured.
 */
export function gate(event: RequestEvent, stateChanging: boolean): Authed | Response {
	const user = event.locals.user;
	if (!user) return json({ error: 'Authentication required' }, { status: 401 });
	if (stateChanging) {
		if (!isSameOrigin(event.request.headers.get('origin'), event.url.host)) {
			return json({ error: 'Cross-origin request refused' }, { status: 403 });
		}
		const ct = event.request.headers.get('content-type') ?? '';
		if (!ct.toLowerCase().startsWith('application/json') && event.request.method !== 'DELETE') {
			return json({ error: 'JSON body required' }, { status: 415 });
		}
	}
	const key = getEncryptionKey();
	if (!key) return json({ error: 'Sending is not configured', code: 'not_configured' }, { status: 503 });
	return { user, key };
}

export async function readJson(event: RequestEvent): Promise<Record<string, unknown> | null> {
	try {
		const body = await event.request.json();
		return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
	} catch {
		return null;
	}
}

/** The user's decrypted Mailer key, or a ready-made error response. */
export async function loadApiKey(auth: Authed): Promise<string | Response> {
	const [row] = await db.select().from(mailerConnections).where(eq(mailerConnections.userId, auth.user.id)).limit(1);
	if (!row) return json({ error: 'Mailer is not connected', code: 'not_connected' }, { status: 409 });
	try {
		return decryptSecret(row.apiKeyEncrypted, auth.key);
	} catch {
		return json({ error: 'The stored Mailer key could not be read. Disconnect and connect Mailer again.', code: 'mailer_key_unreadable' }, { status: 409 });
	}
}

/** Response for a failed Mailer call. A 401 also tells the client the stored key is dead. */
export function mailerFailure(status: number, error: MappedError): Response {
	return json({ error: error.message, code: error.code, ...(status === 401 ? { connected: false } : {}) }, { status: error.http });
}
