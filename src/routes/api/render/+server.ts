import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import mjml2html from 'mjml';

export const POST: RequestHandler = async ({ request }) => {
	const { mjml } = await request.json();

	if (!mjml || typeof mjml !== 'string') {
		return json({ error: 'mjml string is required' }, { status: 400 });
	}

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
