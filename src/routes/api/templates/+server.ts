import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { templates } from '$lib/server/db/schema';
import { eq, or, and, desc } from 'drizzle-orm';

// GET /api/templates - list templates visible to the user
export const GET: RequestHandler = async ({ locals }) => {
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
};

// POST /api/templates - save a template (protected)
export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	const body = await request.json();
const { id, name, category, isPublic, blocks } = body;
	if (!id || !name || !blocks) {
		return json({ error: 'id, name, and blocks are required' }, { status: 400 });
	}

	const existing = await db
		.select()
		.from(templates)
		.where(eq(templates.id, id))
		.limit(1);

	if (existing.length > 0 && existing[0].userId === user.id) {
		await db
			.update(templates)
			.set({ name, category: category || 'otp', blocks, isPublic, updatedAt: new Date() })
			.where(and(eq(templates.id, id), eq(templates.userId, user.id)));
	} else {
		await db.insert(templates).values({
			id,
			userId: user.id,
			name,
			category: category || 'otp',
			blocks,
			isStarter: false,
			isPublic: isPublic || false,
			updatedAt: new Date(),
		});
	}

	return json({ id, saved: true });
};
