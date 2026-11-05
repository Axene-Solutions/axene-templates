import mjml2html from 'mjml';
import { blocksToMjml } from '$lib/mjml';
import { randomBytes } from 'node:crypto';
import { injectVariables } from '$lib/server/injector';
import { fillSlots, prepareGrammar, type Values } from '$lib/placeholders';
import { escapeVariables } from '$lib/server/mailer/validate';
import { sanitizeBlocksForRead } from '$lib/server/sanitize-blocks';

// Every render sanitises first, so rows stored before the allowlist existed are safe too.

/**
 * Blocks -> MJML -> Handlebars variable injection -> HTML.
 * Shared by the public compile endpoint and the Mailer send endpoint.
 */
export function renderTemplateHtml(blocks: unknown, variables: Record<string, any> = {}) {
	const rawMjml = blocksToMjml(sanitizeBlocksForRead(blocks));
	const injectedMjml = injectVariables(rawMjml, variables);
	return mjml2html(injectedMjml, {
		keepComments: false,
		minify: true,
		validationLevel: 'soft',
	});
}

/**
 * Blocks -> MJML -> HTML for Mailer, WITHOUT variable injection: {{placeholders}}
 * stay in the output because Mailer fills them in later.
 */
export function renderTemplateForMailer(blocks: unknown) {
	return mjml2html(blocksToMjml(sanitizeBlocksForRead(blocks)), {
		keepComments: false,
		minify: true,
		validationLevel: 'soft',
	});
}

export type SendRender =
	| { ok: true; html: string }
	| { ok: false; unknownLinks: string[]; badLinks: { key: string; error: string }[]; badUrls: string[] };

/**
 * The Send flow's render: {{name|fallback}} and {{link:key}} are resolved first (named links expand
 * one level, field values are percent-encoded inside URLs), then the remaining plain {{name}} go
 * through Handlebars as before. Resolved text is swapped back in afterwards, so it is never rendered
 * a second time. The public compile endpoint does not use this.
 */
export function renderTemplateForSend(
	blocks: unknown,
	variables: Record<string, string | number | boolean>,
	links: ReadonlyMap<string, string>,
): SendRender {
	const nonce = randomBytes(6).toString('hex');
	const prepared = prepareGrammar(blocksToMjml(sanitizeBlocksForRead(blocks)), variables as Values, links, nonce);
	if (prepared.unknownLinks.length || prepared.badLinks.length || prepared.badUrls.length) {
		return { ok: false, unknownLinks: prepared.unknownLinks, badLinks: prepared.badLinks, badUrls: prepared.badUrls };
	}
	const injected = injectVariables(prepared.template, escapeVariables(variables));
	const out = mjml2html(injected, { keepComments: false, minify: true, validationLevel: 'soft' });
	return { ok: true, html: fillSlots(out.html, prepared.slots, nonce) };
}
