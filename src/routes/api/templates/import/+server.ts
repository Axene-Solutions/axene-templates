import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { gate, readJson } from '$lib/server/mailer/http';
import { createRateLimiter } from '$lib/server/mailer/guard';
import { parseAiTemplate } from '$lib/server/ai-import';

// 60 validations per user per hour. In memory: per process, reset on restart.
const limiter = createRateLimiter(60, 60 * 60 * 1000);

// POST /api/templates/import { text }: checks a reply pasted from an AI and returns clean blocks.
// Nothing is stored here, the editor saves the template as usual.
export const POST: RequestHandler = async (event) => {
	const auth = gate(event, true, { requireKey: false });
	if (auth instanceof Response) return auth;
	const body = await readJson(event);
	if (!body) return json({ error: 'Invalid JSON body' }, { status: 400 });
	const wait = limiter.hit(auth.user.id);
	if (wait) return json({ error: 'Too many tries, wait a few minutes.' }, { status: 429, headers: { 'Retry-After': String(wait) } });
	const result = parseAiTemplate(body.text);
	if (!result.ok) return json({ error: result.error }, { status: 422 });
	return json(result);
};
