// Pure input validation for the Mailer send flow. No SvelteKit imports.

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

export function validateSubject(input: unknown): Checked<string> {
	if (typeof input !== 'string') return { ok: false, error: 'Subject is required' };
	const s = clean(input);
	if (!s) return { ok: false, error: 'Subject is required' };
	if (s.length > MAX_SUBJECT) return { ok: false, error: `Subject must be at most ${MAX_SUBJECT} characters` };
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

export function validateVariables(input: unknown): Checked<Record<string, string | number | boolean>> {
	if (input === undefined || input === null) return { ok: true, value: {} };
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
	return { ok: true, value: { ...out } };
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

/** Plain-text alternative: drop head/style/script, turn breaks and blocks into newlines, strip tags. */
export function htmlToText(html: string): string {
	return html
		.replace(/<(head|style|script)[\s\S]*?<\/\1>/gi, '')
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/(p|div|tr|h[1-6]|li|table)>/gi, '\n')
		.replace(/<[^>]*>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&amp;/g, '&')
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

/** Names of {{variables}} a template references (simple identifiers only). */
export function detectVariables(source: string): string[] {
	const names = new Set<string>();
	for (const m of source.matchAll(/\{\{\{?\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}?\}\}/g)) names.add(m[1]);
	return [...names];
}
