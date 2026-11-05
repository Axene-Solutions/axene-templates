import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { mailerConnections } from '$lib/server/db/schema';
import { gate, readJson } from '$lib/server/mailer/http';
import { encryptSecret } from '$lib/server/mailer/crypto';
import { validateApiKey } from '$lib/server/mailer/validate';
import { listSenders } from '$lib/server/mailer/client';

// GET /api/mailer/connection -> { connected, keyHint }. Never returns the key.
export const GET: RequestHandler = async (event) => {
	const auth = gate(event, false);
	if (auth instanceof Response) return auth;
	const [row] = await db
		.select({ keyHint: mailerConnections.keyHint, connectedAt: mailerConnections.updatedAt })
		.from(mailerConnections)
		.where(eq(mailerConnections.userId, auth.user.id))
		.limit(1);
	return json({ connected: !!row, keyHint: row?.keyHint ?? null, connectedAt: row?.connectedAt ?? null });
};

// PUT /api/mailer/connection { apiKey } -> validates against Mailer, then stores encrypted.
export const PUT: RequestHandler = async (event) => {
	const auth = gate(event, true);
	if (auth instanceof Response) return auth;

	const body = await readJson(event);
	const checked = validateApiKey(body?.apiKey);
	if (!checked.ok) return json({ error: checked.error }, { status: 400 });
	const apiKey = checked.value;

	const probe = await listSenders(apiKey);
	if (!probe.ok) {
		if (probe.status === 401) return json({ error: 'That key was rejected by Mailer', code: 'mailer_key_invalid' }, { status: 401 });
		if (probe.status === 403) {
			return json(
				{ error: 'That key is missing permissions. Create a key with the scopes "Send emails", "Read sender addresses", "Read templates" and "Write templates".', code: 'mailer_forbidden' },
				{ status: 403 },
			);
		}
		return json({ error: probe.error.message, code: probe.error.code }, { status: probe.error.http });
	}

	const keyHint = apiKey.slice(-4);
	const apiKeyEncrypted = encryptSecret(apiKey, auth.key);
	await db
		.insert(mailerConnections)
		.values({ userId: auth.user.id, apiKeyEncrypted, keyHint })
		.onConflictDoUpdate({
			target: mailerConnections.userId,
			set: { apiKeyEncrypted, keyHint, updatedAt: new Date() },
		});
	return json({ connected: true, keyHint, connectedAt: new Date().toISOString() });
};

// DELETE /api/mailer/connection
export const DELETE: RequestHandler = async (event) => {
	const auth = gate(event, true);
	if (auth instanceof Response) return auth;
	await db.delete(mailerConnections).where(eq(mailerConnections.userId, auth.user.id));
	return json({ connected: false, keyHint: null, connectedAt: null });
};
