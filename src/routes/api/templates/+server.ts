import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { templates } from '$lib/server/db/schema';
import { eq, or, and, desc } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { sanitizeBlocks, BlocksValidationError } from '$lib/server/sanitize-blocks';
import type { Block } from '$lib/blocks';

// GET /api/templates - list templates visible to the user
export const GET: RequestHandler = async ({ locals }) => {
	try {
		const user = locals.user;

		let rows;
		if (user) {
			rows = await db
				.select()
				.from(templates)
				.where(
					or(
						eq(templates.userId, user.id),
						eq(templates.isPublic, true),
						eq(templates.isStarter, true)
					)
				)
				.orderBy(desc(templates.updatedAt));
		} else {
			rows = await db
				.select()
				.from(templates)
				.where(or(eq(templates.isPublic, true), eq(templates.isStarter, true)))
				.orderBy(desc(templates.updatedAt));
		}

		const result = rows.map((t) => ({
			id: t.id,
			name: t.name,
			category: t.category,
			blockCount: Array.isArray(t.blocks) ? t.blocks.length : 0,
			isStarter: t.isStarter,
			isPublic: t.isPublic,
			updatedAt: t.updatedAt?.toISOString() ?? null,
			isOwn: user ? t.userId === user.id : false,
		}));

		return json(result);
	} catch (e) {
		console.error('List templates failed:', e);
		return json({ error: 'Could not load templates' }, { status: 500 });
	}
};

// POST /api/templates - save a template (protected)
export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}
	if (!body || typeof body !== 'object') return json({ error: 'Invalid JSON body' }, { status: 400 });
	const { id, name, category, isPublic: rawPublic, blocks: rawBlocks } = body as Record<string, any>;
	if (!id || !name || !rawBlocks) {
		return json({ error: 'id, name, and blocks are required' }, { status: 400 });
	}
	if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(id)) return json({ error: 'id is invalid' }, { status: 400 });
	if (typeof name !== 'string' || name.length > 200) return json({ error: 'name is invalid' }, { status: 400 });
	if (category !== undefined && category !== null && (typeof category !== 'string' || !/^[a-z0-9_-]{0,40}$/i.test(category))) {
		return json({ error: 'category is invalid' }, { status: 400 });
	}
	const isPublic = rawPublic === true;
	// Every stored block goes through the allowlist: wrong shapes are refused, rich text is cleaned.
	let blocks: Block[];
	try {
		blocks = sanitizeBlocks(rawBlocks, { strict: true });
	} catch (e) {
		if (e instanceof BlocksValidationError) return json({ error: `The template content is not valid: ${e.message}`, code: e.code }, { status: 422 });
		throw e;
	}

	const existing = await db
		.select()
		.from(templates)
		.where(eq(templates.id, id))
		.limit(1);

	if (existing.length > 0 && existing[0].userId === user.id) {
		await db
			.update(templates)
			.set({ name, category: category || existing[0].category, blocks, isPublic: rawPublic === undefined ? existing[0].isPublic : isPublic, updatedAt: new Date() })
			.where(and(eq(templates.id, id), eq(templates.userId, user.id)));
	} else if (existing.length > 0) {
		// Not yours. A starter or another user's public template is forked into a new private copy
		// owned by you (the shared row is never touched); anything else is off limits.
		if (!(existing[0].isStarter || existing[0].isPublic)) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}
		const forkId = `${String(id).slice(0, 60)}-${randomBytes(4).toString('hex')}`;
		await db.insert(templates).values({
			id: forkId,
			userId: user.id,
			name,
			category: category || existing[0].category,
			blocks,
			isStarter: false,
			isPublic: false,
			updatedAt: new Date(),
		});
		return json({ id: forkId, saved: true, forked: true });
	} else {
		await db.insert(templates).values({
			id,
			userId: user.id,
			name,
			category: category || 'general',
			blocks,
			isStarter: false,
			isPublic,
			updatedAt: new Date(),
		});
	}

	return json({ id, saved: true });
};
