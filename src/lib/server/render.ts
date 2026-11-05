import mjml2html from 'mjml';
import { blocksToMjml } from '$lib/mjml';
import { randomBytes } from 'node:crypto';
import { fillSlots, MAX_RENDERED_HTML, prepareGrammar, type Values } from '$lib/placeholders';
import { BlocksValidationError, sanitizeBlocks } from '$lib/server/sanitize-blocks';

// Grammar only: nothing here (or imported from here) runs a template engine over block text or
// any other user-controlled text. {{field}}, {{field|fallback}} and {{link:key}} are the whole
// language; every other {{ ... }} is emitted as visible, inert text. Handlebars is reachable
// only from render-starter.ts, for the trusted starter compile endpoint.
//
// Every render sanitises first, so rows stored before the allowlist existed are safe too.

/** A render that must not go out: too many placeholders, too large, or blocks too large. */
export class RenderRefused extends Error {
	readonly code = 'render_refused';
	constructor(message: string) {
		super(message);
		this.name = 'RenderRefused';
	}
}

const MJML_OPTIONS = { keepComments: false, minify: true, validationLevel: 'soft' } as const;

// Values the old injector supplied when a template used them without the sender giving one.
const SEND_DEFAULTS: Record<string, string> = {
	theme_color: '#4F46E5',
	logo: 'https://mail.axene.io/email-assets/logo.png',
	company_name: 'Axene',
};

function mjmlOf(blocks: unknown): string {
	try {
		return blocksToMjml(sanitizeBlocks(blocks, { strict: false }));
	} catch (e) {
		if (e instanceof BlocksValidationError) throw new RenderRefused(`the template content is not valid: ${e.message}`);
		throw e;
	}
}

function checkSize(html: string): void {
	if (html.length > MAX_RENDERED_HTML) throw new RenderRefused(`the email would be larger than ${MAX_RENDERED_HTML} characters`);
}

/**
 * Blocks -> MJML -> HTML for Mailer: supported {{placeholders}} stay in the output because Mailer
 * fills them in later; any other {{ ... }} becomes inert text. Throws RenderRefused.
 */
export function renderTemplateForMailer(blocks: unknown) {
	const prepared = prepareGrammar(mjmlOf(blocks), {}, new Map(), '', 'keep');
	if (prepared.refused) throw new RenderRefused(prepared.refused);
	const out = mjml2html(prepared.template, MJML_OPTIONS);
	checkSize(out.html);
	return out;
}

export type SendRender =
	| { ok: true; html: string }
	| { ok: false; unknownLinks: string[]; badLinks: { key: string; error: string }[]; badUrls: string[]; refused: string | null };

/**
 * The Send flow's render. Every supported tag is resolved by prepareGrammar into a slot (named
 * links expand one level, values are HTML-escaped, URL values are checked against the scheme
 * policy and percent-encoded), MJML compiles the slotted template, and the slots are put back.
 * Values are never rendered a second time. The public compile endpoint does not use this.
 */
export function renderTemplateForSend(
	blocks: unknown,
	variables: Record<string, string | number | boolean>,
	links: ReadonlyMap<string, string>,
): SendRender {
	const nonce = randomBytes(6).toString('hex');
	let mjml: string;
	try {
		mjml = mjmlOf(blocks);
	} catch (e) {
		if (e instanceof RenderRefused) return { ok: false, unknownLinks: [], badLinks: [], badUrls: [], refused: e.message };
		throw e;
	}
	const values: Values = { ...SEND_DEFAULTS, ...variables };
	const prepared = prepareGrammar(mjml, values, links, nonce);
	if (prepared.refused || prepared.unknownLinks.length || prepared.badLinks.length || prepared.badUrls.length) {
		return { ok: false, unknownLinks: prepared.unknownLinks, badLinks: prepared.badLinks, badUrls: prepared.badUrls, refused: prepared.refused };
	}
	const out = mjml2html(prepared.template, MJML_OPTIONS);
	const slotChars = prepared.slots.reduce((n, s) => n + s.length, 0);
	if (out.html.length + slotChars > MAX_RENDERED_HTML) {
		return { ok: false, unknownLinks: [], badLinks: [], badUrls: [], refused: `the email would be larger than ${MAX_RENDERED_HTML} characters` };
	}
	return { ok: true, html: fillSlots(out.html, prepared.slots, nonce) };
}
