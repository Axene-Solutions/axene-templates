import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { templates } from '$lib/server/db/schema';
import { gate } from '$lib/server/mailer/http';
import { createRateLimiter } from '$lib/server/mailer/guard';
import { sanitizeBlocksForRead } from '$lib/server/sanitize-blocks';

const MAX_NAME_LENGTH = 120;
const COPY_PREFIX = 'Copy of ';

// 60 copies per user per hour. In memory: per process, reset on restart.
const limiter = createRateLimiter(60, 60 * 60 * 1000);

// POST /api/templates/:id/duplicate: makes a private copy of a template you own, or of a starter or
// public template, owned by you. The source row is never touched. Responds with the list item.
export const POST: RequestHandler = async (event) => {
	// Same checks as the Mailer endpoints: signed in, same origin, JSON. No Mailer key is involved.
	const auth = gate(event, true, { requireKey: false });
	if (auth instanceof Response) return auth;

	const wait = limiter.hit(auth.user.id);
	if (wait > 0) {
		return json({ error: 'Too many copies. Try again later.' }, { status: 429, headers: { 'Retry-After': String(wait) } });
	}

	const [t] = await db.select().from(templates).where(eq(templates.id, event.params.id)).limit(1);
	if (!t) return json({ error: 'Template not found' }, { status: 404 });
	if (!(t.userId === auth.user.id || t.isStarter || t.isPublic)) return json({ error: 'Forbidden' }, { status: 403 });

	// Stored in its sanitised form, like every other copy that leaves the original row.
	const blocks = sanitizeBlocksForRead(t.blocks);
	const name = (COPY_PREFIX + t.name).slice(0, MAX_NAME_LENGTH);
	const id = `tpl-${randomBytes(8).toString('hex')}`;
	const now = new Date();

	await db.insert(templates).values({
		id,
		userId: auth.user.id,
		name,
		category: t.category,
		blocks,
		isStarter: false,
		isPublic: false,
		updatedAt: now,
	});

	return json(
		{
			id,
			name,
			category: t.category,
			blockCount: blocks.length,
			isStarter: false,
			isPublic: false,
			updatedAt: now.toISOString(),
			isOwn: true,
		},
		{ status: 201 }
	);
};
