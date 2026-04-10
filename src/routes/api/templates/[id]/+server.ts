import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.resolve('data');

// GET /api/templates/:id - load a template
export const GET: RequestHandler = async ({ params }) => {
	const safeId = params.id.replace(/[^a-zA-Z0-9_-]/g, '');
	const filePath = path.join(DATA_DIR, `${safeId}.json`);

	try {
		const raw = await fs.readFile(filePath, 'utf-8');
		const data = JSON.parse(raw);
		return json({ id: safeId, ...data });
	} catch {
		return json({ error: 'Template not found' }, { status: 404 });
	}
};

// DELETE /api/templates/:id - delete a template
export const DELETE: RequestHandler = async ({ params }) => {
	const safeId = params.id.replace(/[^a-zA-Z0-9_-]/g, '');
	const filePath = path.join(DATA_DIR, `${safeId}.json`);

	try {
		await fs.unlink(filePath);
		return json({ deleted: true });
	} catch {
		return json({ error: 'Template not found' }, { status: 404 });
	}
};
