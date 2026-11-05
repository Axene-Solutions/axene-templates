// Placeholder grammar shared by the browser and the server. Pure: no SvelteKit or Node imports.
//
//   {{name}}  {{ name }}  {{name|fallback text}}  {{link:key}}
//
// Mailer fills these in per recipient. Handlebars logic ({{#if}}, {{a.b}}, {{{x}}}) is not part of
// the grammar and is reported as unsupported. All scanning is linear: a tag is looked for in a
// bounded window, so hostile input cannot cause quadratic work.

export const MAX_FALLBACK = 100;
export const MAX_TAG_LENGTH = 300;
export const MAX_LINK_URL = 2000;
export const MAX_LINK_LABEL = 100;
export const MAX_LINKS = 100;

export const BUILTIN_FIELDS: readonly { key: string; label: string }[] = [
	{ key: 'email', label: 'Email address' },
	{ key: 'name', label: 'Name' },
	{ key: 'unsubscribe_url', label: 'Unsubscribe link' },
];
export const BUILTIN_KEYS: ReadonlySet<string> = new Set(BUILTIN_FIELDS.map((f) => f.key));

const FIELD_KEY = /^[A-Za-z_][A-Za-z0-9_]*$/;
const LINK_KEY_LOOSE = /^[A-Za-z0-9_-]{1,64}$/;
/** Keys for new named links: lowercase, starts with a letter. */
export const LINK_KEY_RE = /^[a-z][a-z0-9_]{0,63}$/;

export type Tag =
	| { kind: 'field'; raw: string; key: string; fallback: string | null }
	| { kind: 'link'; raw: string; key: string }
	| { kind: 'unsupported'; raw: string; reason: string };

export interface Located {
	tag: Tag;
	start: number;
	end: number;
}

export function formatField(key: string, fallback?: string | null): string {
	return fallback ? `{{${key}|${fallback}}}` : `{{${key}}}`;
}

export function formatLink(key: string): string {
	return `{{link:${key}}}`;
}

/** Why a fallback text is not allowed, or null. */
export function fallbackError(fb: string): string | null {
	const t = fb.trim();
	if (!t) return 'The fallback is empty';
	if (t.length > MAX_FALLBACK) return `The fallback is longer than ${MAX_FALLBACK} characters`;
	if (/[{}|]/.test(t)) return 'The fallback cannot contain { } or |';
	if (/[\u0000-\u001f\u007f]/.test(t)) return 'The fallback must be on one line';
	return null;
}

function parseInner(raw: string, inner: string, triple: boolean): Tag {
	const bad = (reason: string): Tag => ({ kind: 'unsupported', raw, reason });
	if (triple) return bad('triple braces (unescaped output) are not supported');
	const s = inner.trim();
	if (!s) return bad('empty tag');
	const c = s[0];
	if (c === '#' || c === '/' || c === '^') return bad('blocks such as each, if and unless are not supported');
	if (c === '>') return bad('partials are not supported');
	if (c === '!') return bad('comments are not supported');
	if (c === '&' || c === '@') return bad('this syntax is not supported');
	if (s === 'else' || s.startsWith('else ')) return bad('else is not supported');

	if (/^link\s*:/i.test(s)) {
		const key = s.slice(s.indexOf(':') + 1).trim();
		if (!LINK_KEY_LOOSE.test(key)) return bad('link keys use letters, digits, underscores and hyphens');
		return { kind: 'link', raw, key };
	}

	const bar = s.indexOf('|');
	if (bar !== -1) {
		const key = s.slice(0, bar).trim();
		const fb = s.slice(bar + 1).trim();
		if (!FIELD_KEY.test(key)) return bad('only plain names such as {{first_name}} are supported');
		if (fb.includes('|')) return bad('the fallback cannot contain |');
		const err = fallbackError(fb);
		if (err) return bad(err.charAt(0).toLowerCase() + err.slice(1));
		return { kind: 'field', raw, key, fallback: fb };
	}

	if (/\s/.test(s)) return bad('helpers with arguments are not supported');
	if (s.includes('.') || s.includes('/')) return bad('dotted or nested names are not supported, use a plain name');
	if (!FIELD_KEY.test(s)) return bad('only plain names such as {{first_name}} are supported');
	return { kind: 'field', raw, key: s, fallback: null };
}

/** Parse one complete `{{...}}` or `{{{...}}}` string. */
export function parseTag(raw: string): Tag {
	const triple = raw.startsWith('{{{');
	const open = triple ? 3 : 2;
	return parseInner(raw, raw.slice(open, Math.max(open, raw.length - open)), triple);
}

/** Every tag in `text`, in order, with positions. Linear: each candidate looks at a bounded window. */
export function scanTags(text: string, max = 5000): Located[] {
	const out: Located[] = [];
	let i = 0;
	while (out.length < max) {
		i = text.indexOf('{{', i);
		if (i === -1) break;
		const triple = text.startsWith('{{{', i);
		const open = triple ? 3 : 2;
		const closer = triple ? '}}}' : '}}';
		const window = text.slice(i + open, i + open + MAX_TAG_LENGTH + 3);
		const j = window.indexOf(closer);
		if (j === -1 || j > MAX_TAG_LENGTH) {
			i += 1;
			continue;
		}
		const end = i + open + j + open;
		const raw = text.slice(i, end);
		out.push({ tag: parseInner(raw, window.slice(0, j), triple), start: i, end });
		i = end;
	}
	return out;
}

function collectStrings(v: unknown, out: string[], depth = 0): void {
	if (depth > 12 || out.length > 20_000) return;
	if (typeof v === 'string') out.push(v);
	else if (Array.isArray(v)) for (const x of v) collectStrings(x, out, depth + 1);
	else if (v && typeof v === 'object') for (const x of Object.values(v)) collectStrings(x, out, depth + 1);
}

export interface Usage {
	fields: Map<string, { hasFallback: boolean }>;
	links: Set<string>;
	unsupported: { text: string; reason: string }[];
}

/** What the blocks (or any JSON value) use. */
export function collectUsage(blocks: unknown, limit = 20): Usage {
	const strings: string[] = [];
	collectStrings(blocks, strings);
	const usage: Usage = { fields: new Map(), links: new Set(), unsupported: [] };
	const seenBad = new Set<string>();
	for (const s of strings) {
		if (!s.includes('{{')) continue;
		for (const { tag } of scanTags(s)) {
			if (tag.kind === 'field') {
				const prev = usage.fields.get(tag.key);
				usage.fields.set(tag.key, { hasFallback: (prev?.hasFallback ?? true) && tag.fallback !== null });
			} else if (tag.kind === 'link') usage.links.add(tag.key);
			else {
				const text = tag.raw.replace(/\s+/g, ' ').slice(0, 60);
				if (!seenBad.has(text) && usage.unsupported.length < limit) {
					seenBad.add(text);
					usage.unsupported.push({ text, reason: tag.reason });
				}
			}
		}
	}
	return usage;
}

export type IssueKind = 'unsupported' | 'unknown_field' | 'unknown_link';
export interface PlaceholderIssue {
	kind: IssueKind;
	text: string;
	reason: string;
}

export interface KnownContext {
	/** Contact field keys from Mailer, or null when they could not be loaded (then fields are not judged). */
	fields: ReadonlySet<string> | null;
	/** Named link keys, or null when unknown (then links are not judged). */
	links: ReadonlySet<string> | null;
}

/**
 * Problems a sender should fix: Handlebars logic, merge fields that are neither built in nor known
 * nor given a fallback, and links that do not exist.
 */
export function analyzePlaceholders(blocks: unknown, ctx: KnownContext, limit = 30): PlaceholderIssue[] {
	const strings: string[] = [];
	collectStrings(blocks, strings);
	const out: PlaceholderIssue[] = [];
	const seen = new Set<string>();
	const push = (i: PlaceholderIssue) => {
		const k = i.kind + i.text;
		if (seen.has(k) || out.length >= limit) return;
		seen.add(k);
		out.push(i);
	};
	for (const s of strings) {
		if (!s.includes('{{')) continue;
		for (const { tag } of scanTags(s)) {
			const text = tag.raw.replace(/\s+/g, ' ').slice(0, 60);
			if (tag.kind === 'unsupported') push({ kind: 'unsupported', text, reason: tag.reason });
			else if (tag.kind === 'field') {
				if (ctx.fields && tag.fallback === null && !BUILTIN_KEYS.has(tag.key) && !ctx.fields.has(tag.key)) {
					push({ kind: 'unknown_field', text, reason: 'not a built-in or contact field, and it has no fallback. Mailer rejects a send that uses it' });
				}
			} else if (ctx.links && !ctx.links.has(tag.key)) {
				push({ kind: 'unknown_link', text, reason: 'there is no named link with this key. Mailer rejects a send that uses it' });
			}
		}
	}
	return out;
}

// ---- Named link validation (mirrors the Mailer server) ----

export const LINK_SCHEME = /^(https?:\/\/|mailto:)/i;

/** Why a named link URL is not allowed, or null. */
export function linkUrlError(url: string): string | null {
	const u = url.trim();
	if (!u) return 'Enter a URL';
	if (u.length > MAX_LINK_URL) return `The URL is longer than ${MAX_LINK_URL} characters`;
	if (/[\u0000-\u001f\u007f\s]/.test(u)) return 'The URL cannot contain spaces or line breaks';
	if (!LINK_SCHEME.test(u)) return 'The URL must start with http://, https:// or mailto:';
	for (const { tag } of scanTags(u)) {
		if (tag.kind === 'link') return 'A link cannot contain another link';
		if (tag.kind === 'unsupported') return `${tag.raw.slice(0, 40)} is not allowed in a link: ${tag.reason}`;
	}
	// A stray brace outside a valid tag is almost certainly a typo.
	let rest = u;
	for (const { tag } of scanTags(u)) rest = rest.replace(tag.raw, '');
	if (/[{}]/.test(rest)) return 'Use {{field}} or {{field|fallback}} for merge values, and no other braces';
	return null;
}

export function linkLabelError(label: string): string | null {
	const l = label.trim();
	if (!l) return 'Enter a name';
	if (l.length > MAX_LINK_LABEL) return `The name is longer than ${MAX_LINK_LABEL} characters`;
	return null;
}

/** Slug the server would derive from a label when no key is given. */
export function suggestLinkKey(label: string): string {
	const k = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 64);
	return /^[a-z]/.test(k) ? k : k ? 'l_' + k.slice(0, 62) : '';
}

// ---- Local rendering (Templates' own Send flow) ----

export type Values = Record<string, string | number | boolean | undefined>;

function blank(v: unknown): boolean {
	return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
}

function escText(s: string, alreadyMarkup: boolean): string {
	const amp = alreadyMarkup ? s.replace(/&(?!(?:amp|lt|gt|quot|#\d{1,6}|#x[0-9a-fA-F]{1,6});)/g, '&amp;') : s.replace(/&/g, '&amp;');
	return amp.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export type Expansion = { ok: true; url: string } | { ok: false; error: string };

/**
 * Expands one named link URL, once: {{field}} and {{field|fallback}} inside it become percent-encoded
 * values. Nested links and logic are refused, and only http, https and mailto URLs come out.
 * The values are never scanned again, so a value that contains "{{" stays text.
 */
export function expandLink(urlTemplate: string, values: Values): Expansion {
	let out = '';
	let last = 0;
	for (const { tag, start, end } of scanTags(urlTemplate)) {
		out += urlTemplate.slice(last, start);
		last = end;
		if (tag.kind === 'link') return { ok: false, error: 'a link cannot contain another link' };
		if (tag.kind === 'unsupported') return { ok: false, error: `${tag.raw.slice(0, 40)}: ${tag.reason}` };
		const v = values[tag.key];
		if (!blank(v)) out += encodeURIComponent(String(v));
		else if (tag.fallback !== null) out += encodeURIComponent(tag.fallback);
		else return { ok: false, error: `it needs a value for ${tag.key}` };
	}
	out += urlTemplate.slice(last);
	const url = out.trim();
	if (!LINK_SCHEME.test(url)) return { ok: false, error: 'its URL must start with http://, https:// or mailto:' };
	if (url.length > MAX_LINK_URL * 2) return { ok: false, error: 'the expanded URL is too long' };
	return { ok: true, url };
}

export interface Prepared {
	/** The source with every fallback and link tag swapped for an inert slot marker. Plain {{name}} is left for Handlebars. */
	template: string;
	/** Final, markup-safe text for each slot. */
	slots: string[];
	unknownLinks: string[];
	/** Links that exist but cannot be used (bad scheme, nested link, missing value), with the reason. */
	badLinks: { key: string; error: string }[];
}

/**
 * Pass one of the local render: resolve {{name|fallback}} and {{link:key}} into slot markers.
 * Plain {{name}} (no fallback) is left alone for the existing Handlebars pass, which keeps its
 * behavior. Resolved text is never fed to Handlebars, so values are not re-rendered.
 */
export function prepareGrammar(source: string, values: Values, links: ReadonlyMap<string, string>, nonce: string): Prepared {
	const slots: string[] = [];
	const unknown = new Set<string>();
	const bad = new Map<string, string>();
	let template = '';
	let last = 0;
	const slot = (text: string) => {
		slots.push(text);
		return `__AXS${nonce}_${slots.length - 1}__`;
	};
	for (const { tag, start, end } of scanTags(source)) {
		if (tag.kind === 'field' && tag.fallback === null) continue;
		if (tag.kind === 'unsupported') continue;
		template += source.slice(last, start);
		last = end;
		if (tag.kind === 'field') {
			const v = values[tag.key];
			template += slot(!blank(v) ? escText(String(v), false) : escText(tag.fallback as string, true));
			continue;
		}
		const def = links.get(tag.key);
		if (def === undefined) {
			unknown.add(tag.key);
			template += slot('');
			continue;
		}
		const ex = expandLink(def, values);
		if (!ex.ok) {
			if (!bad.has(tag.key)) bad.set(tag.key, ex.error);
			template += slot('');
			continue;
		}
		template += slot(escText(ex.url, true));
	}
	template += source.slice(last);
	return { template, slots, unknownLinks: [...unknown], badLinks: [...bad].map(([key, error]) => ({ key, error })) };
}

/** Pass two: put the slot text back after Handlebars has run. Single pass over the output. */
export function fillSlots(rendered: string, slots: string[], nonce: string): string {
	const re = new RegExp(`__AXS${nonce}_(\\d{1,6})__`, 'g');
	return rendered.replace(re, (_m, n: string) => slots[Number(n)] ?? '');
}

/** Field keys that MUST have a value because they appear bare in a link the template uses. */
export function linkFieldNeeds(linkKeys: Iterable<string>, links: ReadonlyMap<string, string>): Set<string> {
	const need = new Set<string>();
	for (const k of linkKeys) {
		const def = links.get(k);
		if (!def) continue;
		for (const { tag } of scanTags(def)) if (tag.kind === 'field' && tag.fallback === null) need.add(tag.key);
	}
	return need;
}

/** Plain-text preview of a field tag for the Insert field popover. */
export function previewField(key: string, fallback: string, sample?: string): string {
	if (sample) return sample;
	return fallback.trim() ? fallback.trim() : `[${key}]`;
}

/** Splits text into plain and placeholder pieces, for chip rendering. */
export function splitForChips(text: string): { text: string; tag?: Tag }[] {
	if (!text.includes('{{')) return [{ text }];
	const parts: { text: string; tag?: Tag }[] = [];
	let last = 0;
	for (const { tag, start, end } of scanTags(text, 200)) {
		if (start > last) parts.push({ text: text.slice(last, start) });
		parts.push({ text: text.slice(start, end), tag });
		last = end;
	}
	if (last < text.length) parts.push({ text: text.slice(last) });
	return parts;
}
