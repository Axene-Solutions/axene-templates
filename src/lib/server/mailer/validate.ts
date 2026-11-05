// Pure input validation for the Mailer send flow. No SvelteKit imports.

import { decodeCharRefs } from '$lib/placeholders';

export const MAX_RECIPIENTS = 25;
export const MAX_SUBJECT = 200;
export const MAX_VARIABLES = 50;
export const MAX_VARIABLE_VALUE = 2000;

// Strict and simple on purpose: one @, no spaces, no quotes or angle brackets,
// a dotted domain. Rejects anything that could smuggle a second address.
const EMAIL_RE = /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export function isValidEmail(s: unknown): boolean {
	return typeof s === 'string' && s.length <= 254 && EMAIL_RE.test(s);
}

export type Checked<T> = { ok: true; value: T } | { ok: false; error: string };

export function validateApiKey(key: unknown): Checked<string> {
	if (typeof key !== 'string') return { ok: false, error: 'API key is required' };
	const k = key.trim();
	if (!k.startsWith('axm_k_')) return { ok: false, error: 'That does not look like a Mailer API key (it should start with axm_k_)' };
	if (k.length < 16 || k.length > 200 || !/^[A-Za-z0-9_-]+$/.test(k)) {
		return { ok: false, error: 'That API key has an unexpected length or characters' };
	}
	return { ok: true, value: k };
}

/** Dedupe (case-insensitive), validate, and cap the recipient list. */
export function validateRecipients(input: unknown): Checked<string[]> {
	if (!Array.isArray(input) || input.length === 0) return { ok: false, error: 'Add at least one recipient' };
	const seen = new Set<string>();
	const out: string[] = [];
	for (const raw of input) {
		if (typeof raw !== 'string') return { ok: false, error: 'Recipients must be email addresses' };
		const addr = raw.trim();
		if (!isValidEmail(addr)) return { ok: false, error: `Invalid email address: ${addr.slice(0, 80)}` };
		const key = addr.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(addr);
	}
	if (out.length > MAX_RECIPIENTS) return { ok: false, error: `At most ${MAX_RECIPIENTS} recipients per send` };
	return { ok: true, value: out };
}

// Strip CR, LF and other control characters (header injection).
function clean(s: string): string {
	return s.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function validateSubject(input: unknown, max: number = MAX_SUBJECT): Checked<string> {
	if (typeof input !== 'string') return { ok: false, error: 'Subject is required' };
	const s = clean(input);
	if (!s) return { ok: false, error: 'Subject is required' };
	if (s.length > max) return { ok: false, error: `Subject must be at most ${max} characters` };
	return { ok: true, value: s };
}

export function validateFrom(input: unknown): Checked<{ email: string; name?: string }> {
	if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, error: 'Choose a sender address' };
	const { email, name } = input as Record<string, unknown>;
	if (typeof email !== 'string' || !isValidEmail(email)) return { ok: false, error: 'Sender address is invalid' };
	if (name === undefined || name === null || name === '') return { ok: true, value: { email } };
	if (typeof name !== 'string') return { ok: false, error: 'Sender name is invalid' };
	const n = clean(name);
	if (n.length > 100) return { ok: false, error: 'Sender name is too long' };
	return { ok: true, value: n ? { email, name: n } : { email } };
}

/**
 * The variables as an object with no prototype, so a template name such as {{constructor}} or
 * {{toString}} never finds an inherited member. Look values up with Object.hasOwn.
 */
export function validateVariables(input: unknown): Checked<Record<string, string | number | boolean>> {
	if (input === undefined || input === null) return { ok: true, value: Object.create(null) };
	if (typeof input !== 'object' || Array.isArray(input)) return { ok: false, error: 'Variables must be an object' };
	const entries = Object.entries(input as Record<string, unknown>);
	if (entries.length > MAX_VARIABLES) return { ok: false, error: `At most ${MAX_VARIABLES} variables` };
	const out: Record<string, string | number | boolean> = Object.create(null);
	for (const [k, v] of entries) {
		if (!/^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(k)) return { ok: false, error: `Invalid variable name: ${k.slice(0, 40)}` };
		if (k === '__proto__' || k === 'constructor' || k === 'prototype') return { ok: false, error: `Invalid variable name: ${k}` };
		const t = typeof v;
		if (t === 'number' && !Number.isFinite(v as number)) return { ok: false, error: `Variable ${k} must be a finite number` };
		if (t !== 'string' && t !== 'number' && t !== 'boolean') {
			return { ok: false, error: `Variable ${k} must be a string, number or boolean` };
		}
		if (t === 'string' && (v as string).length > MAX_VARIABLE_VALUE) {
			return { ok: false, error: `Variable ${k} is too long` };
		}
		out[k] = v as string | number | boolean;
	}
	return { ok: true, value: out };
}

export function escapeHtml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** HTML-escape string values so a variable can never inject markup into the email. */
export function escapeVariables(vars: Record<string, string | number | boolean>): Record<string, string | number | boolean> {
	const out: Record<string, string | number | boolean> = {};
	for (const [k, v] of Object.entries(vars)) out[k] = typeof v === 'string' ? escapeHtml(v) : v;
	return out;
}

const ESCAPE_MAX_DEPTH = 6;

/**
 * HTML-escape every string inside a JSON-like value (arrays and objects included), for data
 * that is handed to the Handlebars injector, which runs with noEscape. Numbers, booleans and
 * null pass through, prototype keys are dropped, and anything deeper than a few levels is
 * cut to null so a hostile payload cannot make this walk forever.
 */
export function escapeDeep(value: unknown, depth = 0): unknown {
	if (typeof value === 'string') return escapeHtml(value);
	if (value === null || typeof value !== 'object') return value;
	if (depth >= ESCAPE_MAX_DEPTH) return null;
	if (Array.isArray(value)) return value.map((v) => escapeDeep(v, depth + 1));
	const out: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(value)) {
		if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
		out[k] = escapeDeep(v, depth + 1);
	}
	return out;
}

export const MAX_TEXT_INPUT = 200_000;

const DROP_TAGS = ['head', 'style', 'script'];
const BLOCK_CLOSE = new Set(['p', 'div', 'tr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'table']);
const HREF = /\shref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i;

/** Text between tags as a reader sees it: references decoded, U+200B dropped, whitespace runs one space. */
function textOf(seg: string): string {
	return decodeCharRefs(seg).replace(/\u200b/g, '').replace(/\s+/g, ' ');
}

/**
 * Plain-text alternative: drop head/style/script and comments, turn breaks and block ends
 * into newlines, strip tags, decode character references, and follow a link's text with its
 * URL in brackets when the two differ. One forward pass (no regex backtracking over the
 * document), input capped at MAX_TEXT_INPUT characters, so cost is linear in the input.
 */
export function htmlToText(html: string): string {
	const src = html.length > MAX_TEXT_INPUT ? html.slice(0, MAX_TEXT_INPUT) : html;
	const lower = src.toLowerCase();
	let out = '';
	let link: { href: string; start: number } | null = null;
	let i = 0;
	while (i < src.length) {
		const lt = src.indexOf('<', i);
		if (lt === -1) {
			out += textOf(src.slice(i));
			break;
		}
		out += textOf(src.slice(i, lt));
		if (lower.startsWith('<!--', lt)) {
			const end = src.indexOf('-->', lt + 4);
			i = end === -1 ? src.length : end + 3;
			continue;
		}
		const gt = src.indexOf('>', lt + 1);
		if (gt === -1) {
			out += textOf(src.slice(lt));
			break;
		}
		// Tag name, e.g. "/p", "br", "style".
		let j = lt + 1;
		const closing = src[j] === '/';
		if (closing) j++;
		let k = j;
		while (k < gt && /[a-z0-9]/.test(lower[k])) k++;
		const name = lower.slice(j, k);
		if (!closing && DROP_TAGS.includes(name) && (k === gt || /[\s/]/.test(lower[k]))) {
			const end = lower.indexOf('</' + name, gt + 1);
			if (end === -1) {
				i = src.length;
			} else {
				const endGt = src.indexOf('>', end);
				i = endGt === -1 ? src.length : endGt + 1;
			}
			continue;
		}
		if (name === 'br' && !closing) out += '\n';
		else if (closing && BLOCK_CLOSE.has(name)) out += '\n';
		else if (closing && (name === 'td' || name === 'th')) out += ' ';
		else if (name === 'a' && !closing) {
			const m = HREF.exec(src.slice(k, gt));
			const href = m ? decodeCharRefs(m[1] ?? m[2] ?? m[3] ?? '').trim() : '';
			link = href && !href.startsWith('#') ? { href, start: out.length } : null;
		} else if (name === 'a' && closing && link) {
			const label = out.slice(link.start).replace(/\s+/g, ' ').trim();
			const same = label === link.href || 'mailto:' + label.toLowerCase() === link.href.toLowerCase();
			if (!label) out += link.href;
			else if (!same) out += ` (${link.href})`;
			link = null;
		}
		i = gt + 1;
	}
	// Trim lines, collapse spaces, and keep at most one blank line, without backtracking regexes.
	const lines: string[] = [];
	let blank = 0;
	for (const raw of out.split('\n')) {
		const line = raw.replace(/ {2,}/g, ' ').trim();
		if (line === '') {
			blank++;
			if (blank <= 1) lines.push(line);
		} else {
			blank = 0;
			lines.push(line);
		}
	}
	return lines.join('\n').trim();
}

/** Names of {{variables}} a template references (simple identifiers only). */
export function detectVariables(source: string): string[] {
	const names = new Set<string>();
	for (const m of source.matchAll(/\{\{\{?\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}?\}\}/g)) names.add(m[1]);
	return [...names];
}
