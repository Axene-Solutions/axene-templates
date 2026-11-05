import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import mjml2html from 'mjml';

// Largest MJML document the editor preview can plausibly send. Compiling is CPU bound, so
// anything bigger is refused before it is parsed.
const MAX_MJML_CHARS = 600_000;

export const POST: RequestHandler = async ({ request, locals }) => {
	// Only the signed-in editor uses this. Compiling arbitrary MJML for anonymous callers is
	// free CPU for anyone on the internet.
	if (!locals.user) return json({ error: 'Not authenticated' }, { status: 401 });

	const raw = await request.text();
	if (raw.length > MAX_MJML_CHARS + 1_000) return json({ error: 'Request too large' }, { status: 413 });

	let body: any;
	try {
		body = JSON.parse(raw);
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}
	const mjml = body?.mjml;

	if (!mjml || typeof mjml !== 'string') {
		return json({ error: 'mjml string is required' }, { status: 400 });
	}
	if (mjml.length > MAX_MJML_CHARS) return json({ error: 'Request too large' }, { status: 413 });

	try {
		const result = mjml2html(mjml, {
			keepComments: false,
			minify: false,
			validationLevel: 'soft',
		});

		return json({
			html: result.html,
			errors: result.errors,
		});
	} catch (err: any) {
		return json({ error: err.message || 'MJML compilation failed' }, { status: 500 });
	}
};
