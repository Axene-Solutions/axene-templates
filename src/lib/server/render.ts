import mjml2html from 'mjml';
import { blocksToMjml } from '$lib/mjml';
import { injectVariables } from '$lib/server/injector';

/**
 * Blocks -> MJML -> Handlebars variable injection -> HTML.
 * Shared by the public compile endpoint and the Mailer send endpoint.
 */
export function renderTemplateHtml(blocks: unknown, variables: Record<string, any> = {}) {
	const rawMjml = blocksToMjml(blocks as any);
	const injectedMjml = injectVariables(rawMjml, variables);
	return mjml2html(injectedMjml, {
		keepComments: false,
		minify: true,
		validationLevel: 'soft',
	});
}
