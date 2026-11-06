import mjml2html from 'mjml';
import { blocksToMjml } from '$lib/mjml';
import { randomBytes } from 'node:crypto';
import { fillSlots, MAX_RENDERED_HTML, prepareGrammar, type Values } from '$lib/placeholders';
import { BlocksValidationError, sanitizeBlocks } from '$lib/server/sanitize-blocks';
import type { TemplateSettings } from '$lib/template-settings';

// Grammar only: nothing here (or imported from here) runs a template engine over block text or
// any other user-controlled text. {{field}}, {{field|fallback}} and {{link:key}} are the whole
// language; every other {{ ... }} is emitted as visible, inert text. Handlebars is reachable
// only from render-starter.ts, for the trusted starter compile endpoint.
//
// Every render sanitises first, so rows stored before the allowlist existed are safe too.

/** A render that must not go out: too many placeholders, too large, blocks too large, or too slow. */
export class RenderRefused extends Error {
	readonly code: 'render_refused' | 'render_too_slow';
	constructor(message: string, code: 'render_refused' | 'render_too_slow' = 'render_refused') {
		super(message);
		this.name = 'RenderRefused';
		this.code = code;
	}
}

// No minifier: html-minifier was quadratic in element nesting depth (about 10 s of blocked event
// loop for one stored template). collapseIndentation below keeps the size close to minified.
const MJML_OPTIONS = { keepComments: false, minify: false, validationLevel: 'soft' } as const;

/**
 * Time guard. mjml2html is synchronous, so this cannot interrupt a slow compile: it refuses the
 * result afterwards, so a slow shape fails loudly instead of being sent. What keeps a compile
 * fast in the first place is the input caps (rich text nesting depth, block count and byte size
 * in sanitize-blocks.ts, placeholder count in placeholders.ts). Mutable for tests only.
 */
export const renderLimits = { maxCompileMs: 3000 };

/**
 * Drops the indentation MJML writes after every newline. Linear: the match can only start at a
 * newline and nothing follows the greedy run. A newline is kept, so text never runs together.
 */
function collapseIndentation(html: string): string {
	return html.replace(/\n\s+/g, '\n');
}

function compile(mjml: string): string {
	const t0 = performance.now();
	const out = mjml2html(mjml, MJML_OPTIONS);
	const ms = performance.now() - t0;
	if (ms > renderLimits.maxCompileMs) {
		console.error(`mjml compile refused after ${Math.round(ms)} ms (${mjml.length} chars)`);
		throw new RenderRefused(`the email took too long to build (${Math.round(ms)} ms, the limit is ${renderLimits.maxCompileMs} ms)`, 'render_too_slow');
	}
	return collapseIndentation(out.html);
}

// Values the old injector supplied when a template used them without the sender giving one.
const SEND_DEFAULTS: Record<string, string> = {
	theme_color: '#4F46E5',
	logo: 'https://mail.axene.io/email-assets/logo.png',
	company_name: 'Axene',
};

/** Stored template settings (any shape: blocksToMjml cleans them), or null for a template without. */
type SettingsIn = Partial<TemplateSettings> | null | undefined;

function mjmlOf(blocks: unknown, settings: SettingsIn): string {
	try {
		return blocksToMjml(sanitizeBlocks(blocks, { strict: false }), settings);
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
export function renderTemplateForMailer(blocks: unknown, settings?: SettingsIn) {
	const prepared = prepareGrammar(mjmlOf(blocks, settings), {}, new Map(), '', 'keep');
	if (prepared.refused) throw new RenderRefused(prepared.refused);
	const html = compile(prepared.template);
	checkSize(html);
	return { html };
}

export type SendRender =
	| { ok: true; html: string }
	| { ok: false; unknownLinks: string[]; badLinks: { key: string; error: string }[]; badUrls: string[]; refused: string | null; code?: 'render_refused' | 'render_too_slow' };

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
	settings?: SettingsIn,
): SendRender {
	const nonce = randomBytes(6).toString('hex');
	let mjml: string;
	try {
		mjml = mjmlOf(blocks, settings);
	} catch (e) {
		if (e instanceof RenderRefused) return { ok: false, unknownLinks: [], badLinks: [], badUrls: [], refused: e.message };
		throw e;
	}
	const values: Values = Object.assign(Object.create(null), SEND_DEFAULTS, variables);
	const prepared = prepareGrammar(mjml, values, links, nonce);
	if (prepared.refused || prepared.unknownLinks.length || prepared.badLinks.length || prepared.badUrls.length) {
		return { ok: false, unknownLinks: prepared.unknownLinks, badLinks: prepared.badLinks, badUrls: prepared.badUrls, refused: prepared.refused };
	}
	let html: string;
	try {
		html = compile(prepared.template);
	} catch (e) {
		if (e instanceof RenderRefused) return { ok: false, unknownLinks: [], badLinks: [], badUrls: [], refused: e.message, code: e.code };
		throw e;
	}
	const slotChars = prepared.slots.reduce((n, s) => n + s.length, 0);
	if (html.length + slotChars > MAX_RENDERED_HTML) {
		return { ok: false, unknownLinks: [], badLinks: [], badUrls: [], refused: `the email would be larger than ${MAX_RENDERED_HTML} characters` };
	}
	return { ok: true, html: fillSlots(html, prepared.slots, nonce) };
}
