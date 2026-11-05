import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { gate, loadApiKey } from '$lib/server/mailer/http';
import { listSenders } from '$lib/server/mailer/client';

// GET /api/mailer/senders -> the user's Mailer sender addresses (email and display name only).
export const GET: RequestHandler = async (event) => {
	const auth = gate(event, false);
	if (auth instanceof Response) return auth;
	const apiKey = await loadApiKey(auth);
	if (apiKey instanceof Response) return apiKey;

	const res = await listSenders(apiKey);
	if (!res.ok) {
		// 401 here means the stored key was revoked in Mailer: the client should treat Mailer as disconnected.
		return json({ error: res.error.message, code: res.error.code, connected: res.status === 401 ? false : undefined }, { status: res.error.http });
	}
	return json({ senders: res.data });
};
