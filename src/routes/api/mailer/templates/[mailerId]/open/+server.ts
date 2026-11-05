import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { randomBytes } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { templates } from '$lib/server/db/schema';
import { gate, loadApiKey, mailerFailure, readJson } from '$lib/server/mailer/http';
import { getTemplate } from '$lib/server/mailer/client';
import { getMailerPublicUrl } from '$lib/server/mailer/config';
import { createRateLimiter } from '$lib/server/mailer/guard';
import { cleanLine, isValidMailerId, MAX_TEMPLATE_NAME, readEnvelope } from '$lib/mailer-templates';
import { sanitizeForOpen } from '$lib/server/sanitize-blocks';

// 60 opens per user per hour. In memory: per process, reset on restart.
const limiter = createRateLimiter(60, 60 * 60 * 1000);
const inFlight = new Set<string>();

// POST /api/mailer/templates/:mailerId/open { reload? } -> { id, created, state } for the Templates copy,
// created on first open. state: in_sync, refreshed (Mailer was newer and the copy had no local edits),
// or conflict (both changed: the local copy is kept). reload: true replaces local edits with Mailer's copy.
export const POST: RequestHandler = async (event) => {
	const auth = gate(event, true);
	if (auth instanceof Response) return auth;
	const body = (await readJson(event)) ?? {};
	const reload = body.reload === true;

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
		if (!res.ok) return mailerFailure(res.status, res.error, { openUrl: `${getMailerPublicUrl()}/templates` });

		const env = readEnvelope(res.data.blocksJson, sanitizeForOpen);
		if (!env.ok) {
			const openUrl = `${getMailerPublicUrl()}/templates`;
			if (env.reason === 'classic') {
				return json({ error: 'This template was made in the classic Mailer editor and can only be edited there', code: 'classic_template', openUrl }, { status: 422 });
			}
			if (env.reason === 'unsupported_version') {
				return json({ error: 'This template was made with a newer version of the editor than this app supports', code: 'unsupported_version', openUrl }, { status: 422 });
			}
			return json({ error: `The template content in Mailer is not valid, so it cannot be opened here (${env.error ?? 'invalid blocks'})`, code: 'invalid_blocks', openUrl }, { status: 422 });
		}

		const [existing] = await db
			.select({ id: templates.id, updatedAt: templates.updatedAt, mailerSyncedAt: templates.mailerSyncedAt, mailerSyncedLocalAt: templates.mailerSyncedLocalAt })
			.from(templates)
			.where(and(eq(templates.userId, auth.user.id), eq(templates.mailerTemplateId, mailerId)))
			.limit(1);
		const remoteAt = res.data.updatedAt;
		const now = new Date();

		if (existing) {
			if (remoteAt && existing.mailerSyncedAt === remoteAt && !reload) return json({ id: existing.id, created: false, state: 'in_sync' });
			// Mailer changed since the last open or save (or this row predates sync tracking).
			const localEdits = !existing.mailerSyncedLocalAt || existing.updatedAt.getTime() > existing.mailerSyncedLocalAt.getTime();
			if (localEdits && !reload) {
				// Never discard edits made here: the editor opens the local copy and Save reports the conflict.
				return json({ id: existing.id, created: false, state: 'conflict' });
			}
			await db
				.update(templates)
				.set({ blocks: env.blocks, mailerSyncedAt: remoteAt, mailerSyncedLocalAt: now, updatedAt: now })
				.where(and(eq(templates.id, existing.id), eq(templates.userId, auth.user.id)));
			return json({ id: existing.id, created: false, state: 'refreshed' });
		}

		const id = `mailer-${randomBytes(8).toString('hex')}`;
		const name = (cleanLine(res.data.name) || 'Mailer template').slice(0, MAX_TEMPLATE_NAME);
		// The partial unique index on (user_id, mailer_template_id) makes a concurrent second insert a no-op.
		await db
			.insert(templates)
			.values({
				id,
				userId: auth.user.id,
				name,
				category: 'general',
				blocks: env.blocks,
				isStarter: false,
				isPublic: false,
				mailerTemplateId: mailerId,
				mailerSyncedAt: remoteAt,
				mailerSyncedLocalAt: now,
				updatedAt: now,
			})
			.onConflictDoNothing();
		const [row] = await db
			.select({ id: templates.id })
			.from(templates)
			.where(and(eq(templates.userId, auth.user.id), eq(templates.mailerTemplateId, mailerId)))
			.limit(1);
		if (!row) return json({ error: 'The template could not be opened. Try again.' }, { status: 500 });
		return json({ id: row.id, created: row.id === id, state: 'in_sync' });
	} finally {
		inFlight.delete(lock);
	}
};
