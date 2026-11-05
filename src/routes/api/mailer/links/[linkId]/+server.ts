import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { gate, loadApiKey, mailerFailure, readJson } from '$lib/server/mailer/http';
import { deleteTemplateLink, updateTemplateLink } from '$lib/server/mailer/client';
import { createRateLimiter } from '$lib/server/mailer/guard';
import { validateLinkInput } from '$lib/server/mailer/links';
import { isValidMailerId } from '$lib/mailer-templates';

const writeLimiter = createRateLimiter(60, 60 * 60 * 1000);

// PATCH /api/mailer/links/:linkId { label?, url?, key? } -> { link }
export const PATCH: RequestHandler = async (event) => {
	const auth = gate(event, true);
	if (auth instanceof Response) return auth;
	if (!isValidMailerId(event.params.linkId)) return json({ error: 'Invalid link id' }, { status: 400 });
	const body = await readJson(event);
	if (!body) return json({ error: 'Invalid JSON body' }, { status: 400 });
	const input = validateLinkInput(body, false);
	if (!input.ok) return json({ error: input.error, code: 'invalid_link' }, { status: 400 });
	const apiKey = await loadApiKey(auth);
	if (apiKey instanceof Response) return apiKey;

	const wait = writeLimiter.hit(auth.user.id);
	if (wait > 0) {
		return json({ error: 'Too many changes. Try again later.', code: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(wait) } });
	}
	const res = await updateTemplateLink(apiKey, event.params.linkId, input.value);
	if (!res.ok) return mailerFailure(res.status, res.error);
	return json({ link: res.data });
};

// DELETE /api/mailer/links/:linkId -> { deleted: true }
export const DELETE: RequestHandler = async (event) => {
	const auth = gate(event, true, { needKey: true });
	if (auth instanceof Response) return auth;
	if (!isValidMailerId(event.params.linkId)) return json({ error: 'Invalid link id' }, { status: 400 });
	const apiKey = await loadApiKey(auth);
	if (apiKey instanceof Response) return apiKey;

	const wait = writeLimiter.hit(auth.user.id);
	if (wait > 0) {
		return json({ error: 'Too many changes. Try again later.', code: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(wait) } });
	}
	const res = await deleteTemplateLink(apiKey, event.params.linkId);
	if (!res.ok) return mailerFailure(res.status, res.error);
	return json({ deleted: true });
};
