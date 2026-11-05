import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { gate, loadApiKey, mailerFailure, readJson } from '$lib/server/mailer/http';
import { createTemplateLink, listTemplateLinks } from '$lib/server/mailer/client';
import { createRateLimiter } from '$lib/server/mailer/guard';
import { validateLinkInput } from '$lib/server/mailer/links';

const readLimiter = createRateLimiter(120, 60 * 60 * 1000);
const writeLimiter = createRateLimiter(60, 60 * 60 * 1000);

// GET /api/mailer/links -> { links } (proxy of GET /v1/template-links).
export const GET: RequestHandler = async (event) => {
	const auth = gate(event, false);
	if (auth instanceof Response) return auth;
	const apiKey = await loadApiKey(auth);
	if (apiKey instanceof Response) return apiKey;

	const wait = readLimiter.hit(auth.user.id);
	if (wait > 0) {
		return json({ error: 'Too many requests. Try again later.', code: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(wait) } });
	}
	const res = await listTemplateLinks(apiKey);
	if (!res.ok) return mailerFailure(res.status, res.error);
	return json({ links: res.data });
};

// POST /api/mailer/links { label, url, key? } -> { link }
export const POST: RequestHandler = async (event) => {
	const auth = gate(event, true);
	if (auth instanceof Response) return auth;
	const body = await readJson(event);
	if (!body) return json({ error: 'Invalid JSON body' }, { status: 400 });
	const input = validateLinkInput(body, true);
	if (!input.ok) return json({ error: input.error, code: 'invalid_link' }, { status: 400 });
	const apiKey = await loadApiKey(auth);
	if (apiKey instanceof Response) return apiKey;

	const wait = writeLimiter.hit(auth.user.id);
	if (wait > 0) {
		return json({ error: 'Too many changes. Try again later.', code: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(wait) } });
	}
	const res = await createTemplateLink(apiKey, input.value);
	if (!res.ok) return mailerFailure(res.status, res.error);
	return json({ link: res.data }, { status: 201 });
};
