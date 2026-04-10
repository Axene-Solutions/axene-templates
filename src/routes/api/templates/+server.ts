import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.resolve('data');

async function ensureDir() {
	try { await fs.mkdir(DATA_DIR, { recursive: true }); } catch {}
}

// GET /api/templates - list all saved templates
export const GET: RequestHandler = async () => {
	await ensureDir();
	const files = await fs.readdir(DATA_DIR).catch(() => []);
	const templates = [];

	for (const file of files) {
		if (!file.endsWith('.json')) continue;
		try {
			const raw = await fs.readFile(path.join(DATA_DIR, file), 'utf-8');
			const data = JSON.parse(raw);
			templates.push({
				id: file.replace('.json', ''),
				name: data.name || file.replace('.json', ''),
				updatedAt: data.updatedAt || null,
				blockCount: data.blocks?.length || 0,
			});
		} catch {}
	}

	return json(templates);
};

// POST /api/templates - save a template
export const POST: RequestHandler = async ({ request }) => {
	await ensureDir();
	const body = await request.json();
	const { id, name, blocks } = body;

	if (!id || !name || !blocks) {
		return json({ error: 'id, name, and blocks are required' }, { status: 400 });
	}

	const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '');
	const data = {
		name,
		blocks,
		updatedAt: new Date().toISOString(),
	};

	await fs.writeFile(path.join(DATA_DIR, `${safeId}.json`), JSON.stringify(data, null, 2));
	return json({ id: safeId, saved: true });
};
