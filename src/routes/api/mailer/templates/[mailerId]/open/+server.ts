import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { randomBytes } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { templates } from '$lib/server/db/schema';
import { gate, loadApiKey, mailerFailure } from '$lib/server/mailer/http';
import { getTemplate } from '$lib/server/mailer/client';
import { getMailerPublicUrl } from '$lib/server/mailer/config';
import { createRateLimiter } from '$lib/server/mailer/guard';
import { cleanLine, isValidMailerId, MAX_TEMPLATE_NAME, readEnvelope } from '$lib/mailer-templates';

// 60 opens per user per hour. In memory: per process, reset on restart.
const limiter = createRateLimiter(60, 60 * 60 * 1000);
const inFlight = new Set<string>();

// POST /api/mailer/templates/:mailerId/open -> { id } of the Templates copy, created on first open.
export const POST: RequestHandler = async (event) => {
	const auth = gate(event, true);
	if (auth instanceof Response) return auth;

	const mailerId = event.params.mailerId;
	if (!isValidMailerId(mailerId)) return json({ error: 'Invalid Mailer template id' }, { status: 400 });

	const apiKey = await loadApiKey(auth);
	if (apiKey instanceof Response) return apiKey;

	const lock = `${auth.user.id}:${mailerId}`;
	if (inFlight.has(lock)) return json({ error: 'This template is already being opened.', code: 'open_in_progress' }, { status: 409 });

	const wait = limiter.hit(auth.user.id);
	if (wait > 0) {
		return json({ error: 'Too many requests. Try again later.', code: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(wait) } });
	}

	inFlight.add(lock);
	try {
		const res = await getTemplate(apiKey, mailerId);
		if (!res.ok) return mailerFailure(res.status, res.error);

		const env = readEnvelope(res.data.blocksJson);
		if (!env.ok) {
			const openUrl = `${getMailerPublicUrl()}/templates`;
			if (env.reason === 'classic') {
				return json({ error: 'This template was made in the classic Mailer editor and can only be edited there', code: 'classic_template', openUrl }, { status: 422 });
			}
			if (env.reason === 'unsupported_version') {
				return json({ error: 'This template was made with a newer version of the editor than this app supports', code: 'unsupported_version', openUrl }, { status: 422 });
			}
			return json({ error: 'The template content in Mailer is not valid, so it cannot be opened here', code: 'invalid_blocks', openUrl }, { status: 422 });
		}

		const [existing] = await db
			.select({ id: templates.id })
			.from(templates)
			.where(and(eq(templates.userId, auth.user.id), eq(templates.mailerTemplateId, mailerId)))
			.limit(1);
		if (existing) return json({ id: existing.id, created: false });

		const id = `mailer-${randomBytes(8).toString('hex')}`;
		const name = (cleanLine(res.data.name) || 'Mailer template').slice(0, MAX_TEMPLATE_NAME);
		await db.insert(templates).values({
			id,
			userId: auth.user.id,
			name,
			category: 'general',
			blocks: env.blocks,
			isStarter: false,
			isPublic: false,
			mailerTemplateId: mailerId,
		});
		return json({ id, created: true });
	} finally {
		inFlight.delete(lock);
	}
};
