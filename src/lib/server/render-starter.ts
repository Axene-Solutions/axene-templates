import mjml2html from 'mjml';
import { blocksToMjml } from '$lib/mjml';
import { injectVariables } from '$lib/server/injector';
import { sanitizeBlocksForRead } from '$lib/server/sanitize-blocks';

// The ONLY render that runs Handlebars. It serves /api/templates/compile, which loads seeded
// starter templates only (never user-authored blocks) and HTML-escapes the caller's data with
// escapeDeep. The Send and Save to Mailer paths use src/lib/server/render.ts, which never
// imports this module or Handlebars.

/** Starter blocks -> MJML -> Handlebars variable injection -> HTML. */
export function renderTemplateHtml(blocks: unknown, variables: Record<string, any> = {}) {
	const rawMjml = blocksToMjml(sanitizeBlocksForRead(blocks));
	const injectedMjml = injectVariables(rawMjml, variables);
	return mjml2html(injectedMjml, {
		keepComments: false,
		minify: true,
		validationLevel: 'soft',
	});
}
