import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { templates } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/templates/:id - load a template
export const GET: RequestHandler = async ({ params, locals }) => {
	const rows = await db
		.select()
		.from(templates)
		.where(eq(templates.id, params.id))
		.limit(1);

	if (rows.length === 0) {
		return json({ error: 'Template not found' }, { status: 404 });
	}

	const t = rows[0];

	if (t.isStarter || t.isPublic) {
		return json({ id: t.id, name: t.name, blocks: t.blocks, isStarter: t.isStarter, isPublic: t.isPublic });
	}

	if (locals.user && t.userId === locals.user.id) {
		return json({ id: t.id, name: t.name, blocks: t.blocks, isStarter: t.isStarter, isPublic: t.isPublic });
	}

	return json({ error: 'Forbidden' }, { status: 403 });
};

// DELETE /api/templates/:id - delete a template (protected)
export const DELETE: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	const rows = await db
		.select()
		.from(templates)
		.where(eq(templates.id, params.id))
		.limit(1);

	if (rows.length === 0) {
		return json({ error: 'Template not found' }, { status: 404 });
	}

	const t = rows[0];

	if (t.isStarter) {
		return json({ error: 'Cannot delete starter templates' }, { status: 403 });
	}

	if (t.userId !== user.id) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	await db.delete(templates).where(eq(templates.id, params.id));
	return json({ deleted: true });
};

// PATCH /api/templates/:id - toggle is_public (protected)
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	const rows = await db
		.select()
		.from(templates)
		.where(eq(templates.id, params.id))
		.limit(1);

	if (rows.length === 0) {
		return json({ error: 'Template not found' }, { status: 404 });
	}

	const t = rows[0];

	if (t.userId !== user.id) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const body = await request.json();
	const isPublic = Boolean(body.isPublic);

	await db
		.update(templates)
		.set({ isPublic, updatedAt: new Date() })
		.where(eq(templates.id, params.id));

	return json({ id: params.id, isPublic });
};
