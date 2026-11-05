import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { gate, loadApiKey, mailerFailure } from '$lib/server/mailer/http';
import { listContactFields } from '$lib/server/mailer/client';
import { createRateLimiter } from '$lib/server/mailer/guard';

// 120 requests per user per hour. In memory: per process, reset on restart.
const limiter = createRateLimiter(120, 60 * 60 * 1000);

// GET /api/mailer/fields -> { builtins, fields } from Mailer (names and counts only, never values).
export const GET: RequestHandler = async (event) => {
	const auth = gate(event, false);
	if (auth instanceof Response) return auth;
	const apiKey = await loadApiKey(auth);
	if (apiKey instanceof Response) return apiKey;

	const wait = limiter.hit(auth.user.id);
	if (wait > 0) {
		return json({ error: 'Too many requests. Try again later.', code: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(wait) } });
	}

	const res = await listContactFields(apiKey);
	if (!res.ok) return mailerFailure(res.status, res.error);
	return json(res.data);
};
