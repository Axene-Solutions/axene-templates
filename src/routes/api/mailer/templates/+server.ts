import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { gate, loadApiKey, mailerFailure } from '$lib/server/mailer/http';
import { listTemplates } from '$lib/server/mailer/client';
import { createRateLimiter } from '$lib/server/mailer/guard';
import { readEnvelope } from '$lib/mailer-templates';
import { sanitizeForOpen } from '$lib/server/sanitize-blocks';

// 120 list requests per user per hour. In memory: per process, reset on restart.
const limiter = createRateLimiter(120, 60 * 60 * 1000);

// GET /api/mailer/templates -> the user's Mailer templates (no bodies).
export const GET: RequestHandler = async (event) => {
	const auth = gate(event, false);
	if (auth instanceof Response) return auth;
	const apiKey = await loadApiKey(auth);
	if (apiKey instanceof Response) return apiKey;

	const wait = limiter.hit(auth.user.id);
	if (wait > 0) {
		return json({ error: 'Too many requests. Try again later.', code: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(wait) } });
	}

	const res = await listTemplates(apiKey);
	if (!res.ok) return mailerFailure(res.status, res.error);
	return json({
		templates: res.data.map((t) => ({
			id: t.id,
			name: t.name,
			subject: t.subject,
			updated_at: t.updatedAt,
			// Only the envelope's format matters here; the full blocks are validated when opened.
			isAxeneBlocks: !!t.blocksJson && typeof t.blocksJson === 'object' && (t.blocksJson as any).format === 'axene-blocks' && readEnvelope(t.blocksJson, sanitizeForOpen).ok,
		})),
	});
};
