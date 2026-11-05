import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { templates } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/templates/:id - load a template
export const GET: RequestHandler = async ({ params, locals }) => {
	try {
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
			// The Mailer link is only meaningful to (and only shown to) the owner.
			const mailerTemplateId = locals.user && t.userId === locals.user.id ? t.mailerTemplateId : null;
			return json({ id: t.id, name: t.name, category: t.category, version: t.version, blocks: t.blocks, isStarter: t.isStarter, isPublic: t.isPublic, mailerTemplateId });
		}

		if (locals.user && t.userId === locals.user.id) {
			return json({ id: t.id, name: t.name, category: t.category, version: t.version, blocks: t.blocks, isStarter: t.isStarter, isPublic: t.isPublic, mailerTemplateId: t.mailerTemplateId });
		}

		return json({ error: 'Forbidden' }, { status: 403 });
	} catch (e) {
		console.error('Load template failed:', e);
		return json({ error: 'Could not load template' }, { status: 500 });
	}
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

const MAX_NAME_LENGTH = 120;

// PATCH /api/templates/:id - rename and/or toggle is_public (owner only)
// Body: { name?: string, isPublic?: boolean }. Only the fields present are
// updated (plus updated_at), so a rename never touches is_public.
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

	let body: { name?: unknown; isPublic?: unknown };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}
	if (body === null || typeof body !== 'object') {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const changes: { name?: string; isPublic?: boolean } = {};

	if (body.name !== undefined) {
		if (typeof body.name !== 'string' || body.name.trim() === '') {
			return json({ error: 'Name must not be empty' }, { status: 400 });
		}
		const name = body.name.trim();
		if (name.length > MAX_NAME_LENGTH) {
			return json({ error: `Name must be at most ${MAX_NAME_LENGTH} characters` }, { status: 400 });
		}
		changes.name = name;
	}

	if (body.isPublic !== undefined) {
		changes.isPublic = Boolean(body.isPublic);
	}

	if (changes.name === undefined && changes.isPublic === undefined) {
		return json({ error: 'Nothing to update' }, { status: 400 });
	}

	await db
		.update(templates)
		.set({ ...changes, updatedAt: new Date() })
		.where(eq(templates.id, params.id));

	return json({
		id: params.id,
		name: changes.name ?? t.name,
		isPublic: changes.isPublic ?? t.isPublic,
	});
};
