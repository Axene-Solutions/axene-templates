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
/** Keys Mailer accepts in {{link:key}} (template_render.py _LINK_KEY), exactly. */
const LINK_KEY_MAILER = /^[a-z0-9][a-z0-9_]{0,39}$/;
/** Keys for new named links: lowercase, starts with a letter, at most 40 characters like Mailer. */
export const LINK_KEY_RE = /^[a-z][a-z0-9_]{0,39}$/;

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

/**
 * Why a fallback text is not allowed, or null. A fallback is plain text that Mailer escapes once
 * where it lands, so it may not hold placeholder syntax ({ } |), characters that are markup or
 * can end an attribute (" < > and backtick), or control characters. The same holds for what its
 * character references decode to, since a fallback written in rich text arrives encoded and is
 * handed to Mailer decoded.
 */
export function fallbackError(fb: string): string | null {
	const t = fb.trim();
	if (!t) return 'The fallback is empty';
	if (t.length > MAX_FALLBACK) return `The fallback is longer than ${MAX_FALLBACK} characters`;
	for (const v of t.includes('&') ? [t, decodeCharRefs(t)] : [t]) {
		if (!v.trim()) return 'The fallback is empty';
		if (/[{}|]/.test(v)) return 'The fallback cannot contain { } or |';
		if (/["<>`]/.test(v)) return 'The fallback cannot contain " < > or `';
		if (/[\u0000-\u001f\u007f]/.test(v)) return 'The fallback must be on one line';
	}
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

	// Mailer's rule: lowercase "link:" with nothing between "link" and the colon, then a key of
	// lowercase letters, digits and underscores (at most 40, not starting with _).
	if (/^link\s*:/i.test(s)) {
		const key = s.slice(s.indexOf(':') + 1).trim();
		if (!s.startsWith('link:') || !LINK_KEY_MAILER.test(key)) {
			return bad('named links are written {{link:key}}, with a lowercase key of letters, digits and underscores (at most 40 characters)');
		}
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

/** Most tags one string may hold. A render or a strict save that finds more is refused. */
export const MAX_SCAN_TAGS = 5000;

/**
 * Every tag in `text`, in order, with positions, and whether there were more than `max`
 * (`capped`: the tags past the cap were not looked at, so a caller must refuse, never guess).
 * Linear: each candidate looks at a bounded window.
 */
export function scanTagsLimited(text: string, max = MAX_SCAN_TAGS): { tags: Located[]; capped: boolean } {
	const out: Located[] = [];
	let i = 0;
	for (;;) {
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
		if (out.length >= max) return { tags: out, capped: true };
		const end = i + open + j + open;
		const raw = text.slice(i, end);
		// "{{{x}}" (a stray brace right before a tag): Mailer pairs the first "{{" with "{x}}", so it is
		// not a placeholder there either.
		const tag: Tag = !triple && i > 0 && text[i - 1] === '{' ? { kind: 'unsupported', raw, reason: 'a { right before a placeholder is not supported' } : parseInner(raw, window.slice(0, j), triple);
		out.push({ tag, start: i, end });
		i = end;
	}
	return { tags: out, capped: false };
}

/** Every tag in `text`, in order, with positions (at most `max`). */
export function scanTags(text: string, max = MAX_SCAN_TAGS): Located[] {
	return scanTagsLimited(text, max).tags;
}

/**
 * A short excerpt of source text for messages: markup stripped, whitespace collapsed, at most
 * `max` characters. Bounded work whatever the input length.
 */
export function excerpt(s: string, max = 40): string {
	return s
		.slice(0, 400)
		.replace(/<[^<>]*>?/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, max);
}

/** How to show literal braces, for messages about stray "{{". */
export const LITERAL_BRACES_HINT = 'to show literal braces, type &#123;&#123; instead of {{';

/**
 * The first `{{` in `text` that is not part of a supported tag, as a short excerpt with the
 * reason, or null when every `{{` is a valid {{field}}, {{field|fallback}} or {{link:key}}.
 * Used by strict saves, so a construct that would never render as typed is refused up front.
 */
export function firstUnsupported(text: string): { text: string; reason: string } | null {
	if (!text.includes('{{')) return null;
	const { tags, capped } = scanTagsLimited(text);
	if (capped) return { text: '{{', reason: `more than ${MAX_SCAN_TAGS} placeholders in one value` };
	let last = 0;
	for (const { tag, start, end } of tags) {
		const gap = text.slice(last, start);
		const k = gap.indexOf('{{');
		if (k !== -1) return { text: excerpt(gap.slice(k)), reason: `braces that do not form a placeholder (${LITERAL_BRACES_HINT})` };
		if (tag.kind === 'unsupported') return { text: excerpt(tag.raw), reason: tag.reason };
		last = end;
	}
	const k = text.indexOf('{{', last);
	if (k !== -1) return { text: excerpt(text.slice(k, k + 400)), reason: `braces that do not form a placeholder (${LITERAL_BRACES_HINT})` };
	return null;
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
				const text = excerpt(tag.raw);
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
			const text = excerpt(tag.raw);
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
		if (tag.kind === 'unsupported') return `${excerpt(tag.raw)} is not allowed in a link: ${tag.reason}`;
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
	const k = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40).replace(/_+$/, '');
	return /^[a-z]/.test(k) ? k : k ? 'l_' + k.slice(0, 38).replace(/_+$/, '') : '';
}

// ---- Local rendering (Templates' own Send flow) ----

export type Values = Record<string, string | number | boolean | undefined>;

function blank(v: unknown): boolean {
	return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
}

function escText(s: string, alreadyMarkup: boolean): string {
	const amp = alreadyMarkup ? s.replace(/&(?!(?:amp|lt|gt|quot|#\d{1,6}|#x[0-9a-fA-F]{1,6});)/g, '&amp;') : s.replace(/&/g, '&amp;');
	return amp.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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
		if (tag.kind === 'unsupported') return { ok: false, error: `${excerpt(tag.raw)}: ${tag.reason}` };
		const v = Object.hasOwn(values, tag.key) ? values[tag.key] : undefined;
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

const SAFE_URL_SCHEMES = new Set(['http', 'https', 'mailto', 'tel']);

/**
 * True when a URL with no placeholders is safe in an href or src: http, https, mailto, tel or
 * relative. Quotes, angle brackets, backslashes, whitespace and control characters are refused, and
 * so is "&" before the first / ? or #, so a character reference can never spell a scheme.
 */
export function isSafeLiteralUrl(u: string): boolean {
	if (/[\u0000-\u0020\u007f"<>`\\]/.test(u)) return false;
	const cut = u.search(/[/?#]/);
	const head = cut === -1 ? u : u.slice(0, cut);
	if (head.includes('&')) return false;
	if (head.indexOf(':') === -1) return true; // relative
	const m = /^([a-z][a-z0-9+.-]*):/i.exec(head);
	return !!m && SAFE_URL_SCHEMES.has(m[1].toLowerCase());
}

// ---- URL policy (mirrors Mailer's renderer, backend/app/services/template_render.py) ----

/** Attributes whose value is a link a reader can follow, and attributes that load a resource. */
const LINK_ATTRS = new Set(['href', 'xlink:href', 'action', 'formaction', 'cite']);
const SRC_ATTRS = new Set(['src', 'background', 'poster', 'srcset']);
const BLOCKED_SCHEMES = new Set(['javascript', 'data', 'vbscript', 'file', 'about', 'blob', 'livescript', 'mocha', 'view-source']);
const SRC_SCHEMES = new Set(['http', 'https']);
// Ignored before the colon, the way browsers drop them: "java\tscript:" is "javascript:".
const IGNORED_IN_SCHEME = /[\s\u0000-\u001f\u007f\u0085\u00a0\u200b-\u200f\u2028\u2029\u2060\ufeff]/;
// Percent-encoded when a value lands later in a URL: illegal in a URL, or able to end the attribute.
const URL_ILLEGAL = /[\u0000-\u0020\u007f"'<>`\\{}|^\u2028\u2029]/g;
const NAMED_REFS: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", colon: ':', tab: '\t', newline: '\n' };

/** Decodes numeric and the few named character references a browser would turn into URL syntax. */
export function decodeCharRefs(s: string): string {
	if (!s.includes('&')) return s;
	return s.replace(/&(#[xX][0-9a-fA-F]{1,8}|#\d{1,8}|[a-zA-Z]{2,8});?/g, (m, ref: string) => {
		if (ref[0] === '#') {
			const code = ref[1] === 'x' || ref[1] === 'X' ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10);
			return Number.isFinite(code) && code < 0x110000 ? String.fromCodePoint(code) : '';
		}
		return NAMED_REFS[ref.toLowerCase()] ?? m;
	});
}

/** The scheme a browser would read from `value`, lowercased, or null for a relative URL. */
export function urlScheme(value: string): string | null {
	let scheme = '';
	const v = decodeCharRefs(value.slice(0, 600));
	for (let i = 0; i < v.length && i < 300; i++) {
		const c = v[i];
		if (IGNORED_IN_SCHEME.test(c)) continue;
		if (c === ':') return scheme ? scheme.toLowerCase() : null;
		if (/[A-Za-z0-9+.-]/.test(c)) {
			scheme += c;
			continue;
		}
		return null;
	}
	return null;
}

/**
 * Whether a value that starts a URL attribute is refused. Link attributes (href and friends)
 * allow relative URLs, http, https, mailto, tel, sms and app schemes, never javascript, data,
 * vbscript, file, about or blob. Source attributes (src and friends) allow only relative, http
 * and https.
 */
export function urlValueBlocked(value: string, attr = 'href'): boolean {
	const scheme = urlScheme(value);
	if (scheme === null || !/^[a-z]/.test(scheme)) return false;
	return SRC_ATTRS.has(attr) ? !SRC_SCHEMES.has(scheme) : BLOCKED_SCHEMES.has(scheme);
}

function encodeIllegal(s: string): string {
	return s.replace(URL_ILLEGAL, (c) => (c === "'" ? '%27' : encodeURIComponent(c)));
}

// ---- Where a placeholder sits in the source ----

type Ctx =
	| { kind: 'text' }
	| { kind: 'tag' }
	| { kind: 'attr'; attr: string; quoted: boolean; started: boolean; settled: boolean; head: string; cssUrl: boolean };

const TEXT: Ctx = { kind: 'text' };
const TAG: Ctx = { kind: 'tag' };

/**
 * Tiny resumable tokenizer: enough to know whether the next placeholder is in text, inside a tag,
 * or in an attribute value, and what that value already holds. Fed the literal pieces between
 * placeholders and told what each placeholder produced. One forward pass, linear time.
 */
class HtmlCtx {
	state: 'text' | 'lt' | 'comment' | 'tagname' | 'tag' | 'aname' | 'aafter' | 'abefore' | 'vq' | 'vu' = 'text';
	attr = '';
	quote = '';
	started = false;
	settled = false;
	/** The value text written before its scheme is settled (by the first : / ? or #), capped. */
	head = '';
	css = '';

	context(): Ctx {
		const s = this.state;
		if (s === 'text' || s === 'comment') return TEXT;
		if (s === 'abefore') return { kind: 'attr', attr: this.attr, quoted: false, started: false, settled: false, head: '', cssUrl: false };
		if (s === 'vq' || s === 'vu') {
			let cssUrl = false;
			if (this.attr === 'style') {
				const low = this.css.toLowerCase();
				cssUrl = low.lastIndexOf('url(') > low.lastIndexOf(')');
			}
			return { kind: 'attr', attr: this.attr, quoted: s === 'vq', started: this.started, settled: this.settled, head: this.head, cssUrl };
		}
		return TAG;
	}

	private valueText(piece: string): void {
		if (!piece) return;
		this.started = true;
		if (!this.settled && this.head.length < 300) {
			const k = piece.search(/[:/?#]/);
			this.head += k === -1 ? piece.slice(0, 300) : piece.slice(0, k + 1);
		}
		if (/[:/?#]/.test(piece)) this.settled = true;
		if (this.attr === 'style' && this.css.length < 4096) this.css += piece.slice(0, 4096);
	}

	/** A placeholder produced `text` (its raw value) at the current position. */
	emitted(text: string): void {
		const s = this.state;
		if (s === 'abefore') {
			this.state = 'vu';
			this.started = false;
			this.settled = false;
			this.head = '';
			this.css = '';
		} else if (s === 'lt') {
			this.state = 'text';
			return;
		}
		if (this.state === 'vq' || this.state === 'vu') this.valueText(text);
	}

	feed(seg: string): void {
		let i = 0;
		const n = seg.length;
		while (i < n) {
			const s = this.state;
			if (s === 'text') {
				const j = seg.indexOf('<', i);
				if (j === -1) return;
				this.state = 'lt';
				i = j + 1;
			} else if (s === 'lt') {
				const c = seg[i];
				if (c === '!' || c === '?') {
					this.state = 'comment';
					i++;
				} else if (c === '/' || /[A-Za-z]/.test(c)) this.state = 'tagname';
				else this.state = 'text';
			} else if (s === 'comment') {
				const j = seg.indexOf('>', i);
				if (j === -1) return;
				this.state = 'text';
				i = j + 1;
			} else if (s === 'tagname') {
				while (i < n && !/[\s/>]/.test(seg[i])) i++;
				if (i < n) this.state = 'tag';
			} else if (s === 'tag') {
				const c = seg[i];
				if (c === '>') this.state = 'text';
				else if (!/[\s/]/.test(c)) {
					this.state = 'aname';
					this.attr = '';
					continue;
				}
				i++;
			} else if (s === 'aname') {
				const c = seg[i];
				if (c === '=') this.state = 'abefore';
				else if (c === '>') this.state = 'text';
				else if (/\s/.test(c)) this.state = 'aafter';
				else if (c === '/') this.state = 'tag';
				else if (this.attr.length < 32) this.attr += c.toLowerCase();
				i++;
			} else if (s === 'aafter') {
				const c = seg[i];
				if (/\s/.test(c)) i++;
				else if (c === '=') {
					this.state = 'abefore';
					i++;
				} else if (c === '>') {
					this.state = 'text';
					i++;
				} else this.state = 'tag';
			} else if (s === 'abefore') {
				const c = seg[i];
				if (/\s/.test(c)) i++;
				else if (c === '"' || c === "'") {
					this.state = 'vq';
					this.quote = c;
					this.started = false;
					this.settled = false;
					this.head = '';
					this.css = '';
					i++;
				} else if (c === '>') {
					this.state = 'text';
					i++;
				} else {
					this.state = 'vu';
					this.started = false;
					this.settled = false;
					this.head = '';
					this.css = '';
				}
			} else if (s === 'vq') {
				const j = seg.indexOf(this.quote, i);
				if (j === -1) {
					this.valueText(seg.slice(i));
					return;
				}
				this.valueText(seg.slice(i, j));
				this.state = 'tag';
				i = j + 1;
			} else {
				const c = seg[i];
				if (/\s/.test(c)) this.state = 'tag';
				else if (c === '>') this.state = 'text';
				else this.valueText(c);
				i++;
			}
		}
	}
}

const UNQUOTED_UNSAFE = /[\s"'<>`=]/g;

/**
 * The markup for `raw` at `ctx`, or null when it is refused (it would set or change the scheme
 * of a URL). `tail` is the literal source text that follows the placeholder. `markup` says `raw` is already markup (a fallback written in rich text), so its
 * character references are kept and, for the scheme check, decoded.
 */
function place(ctx: Ctx, raw: string, markup: boolean, tail: string): string | null {
	if (ctx.kind === 'text') return escText(raw, markup);
	if (ctx.kind === 'tag') return ''; // a value must never create or change an attribute
	let out: string;
	if (LINK_ATTRS.has(ctx.attr) || SRC_ATTRS.has(ctx.attr)) {
		const seen = markup ? decodeCharRefs(raw) : raw;
		if (!ctx.started) {
			if (urlValueBlocked(seen, ctx.attr)) return null;
		} else if (!ctx.settled && seen.includes(':')) return null;
		// Before the scheme is settled, judge what the browser will read: the text already in the
		// value, this value and the literal text right after it ({{x}}:alert(1) with x=javascript).
		if (!ctx.settled && urlValueBlocked(ctx.head + seen + tail, ctx.attr)) return null;
		out = ctx.attr === 'srcset' ? escText(raw, markup) : escText(encodeIllegal(raw), markup);
	} else if (ctx.attr === 'style' && ctx.cssUrl) return '';
	else out = escText(raw, markup);
	if (!ctx.quoted) out = out.replace(UNQUOTED_UNSAFE, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'));
	return out;
}

/** `{{` written as text: braces become character references, so nothing can ever evaluate it. */
function inertBraces(s: string): string {
	return s.replace(/[{}]/g, (c) => (c === '{' ? '&#123;' : '&#125;'));
}

/** Most characters a render may produce (twice Mailer's largest request body, as Mailer caps it). */
export const MAX_RENDERED_HTML = 2_000_000;

export interface Prepared {
	/**
	 * The source with every supported tag swapped for an inert slot marker (mode 'fill') or kept as
	 * written (mode 'keep'), and every other `{{` made inert text.
	 */
	template: string;
	/** Final, markup-safe text for each slot. */
	slots: string[];
	unknownLinks: string[];
	/** Links that exist but cannot be used (bad scheme, nested link, missing value), with the reason. */
	badLinks: { key: string; error: string }[];
	/** Fields whose value or fallback would put an unsafe scheme into an href or src. */
	badUrls: string[];
	/** Why the render is refused outright (too many placeholders, output too large), or null. */
	refused: string | null;
}

/**
 * The local render's only substitution pass, grammar only: no template engine ever sees the
 * source or a value.
 *
 * mode 'fill' (Send): {{field}}, {{ field }}, {{field|fallback}} and {{link:key}} become slot
 * markers whose final text is computed here: HTML-escaped in text, and in URL attributes checked
 * against the scheme policy (a value that starts a URL must not be javascript:, data: and so on,
 * a later one is percent-encoded and may not add a scheme). Named links expand one level.
 *
 * mode 'keep' (Save to Mailer): supported tags stay as written for Mailer to fill.
 *
 * In both modes every other `{{ ... }}` (blocks, partials, comments, triple braces, helpers,
 * dotted paths) and every stray `{{` is emitted as literal, visible text with its braces escaped.
 * More than MAX_SCAN_TAGS tags, or output past MAX_RENDERED_HTML, refuses the render.
 */
export function prepareGrammar(
	source: string,
	values: Values,
	links: ReadonlyMap<string, string>,
	nonce: string,
	mode: 'fill' | 'keep' = 'fill',
): Prepared {
	const slots: string[] = [];
	const unknown = new Set<string>();
	const bad = new Map<string, string>();
	const badUrls = new Set<string>();
	const result = (template: string, refused: string | null = null): Prepared => ({
		template,
		slots,
		unknownLinks: [...unknown],
		badLinks: [...bad].map(([key, error]) => ({ key, error })),
		badUrls: [...badUrls],
		refused,
	});
	const { tags, capped } = scanTagsLimited(source);
	if (capped) return result('', `the template has more than ${MAX_SCAN_TAGS} placeholders`);
	const html = new HtmlCtx();
	// The literal text right after a tag, up to the next tag or the end of the attribute value.
	const tailOf = (end: number) => {
		const t = source.slice(end, end + 300);
		const k = t.search(/["'<>]|\{\{/);
		return k === -1 ? t : t.slice(0, k);
	};
	let template = '';
	let size = 0;
	let last = 0;
	const literal = (seg: string) => {
		if (mode === 'fill') html.feed(seg);
		template += seg.includes('{{') ? seg.replace(/\{\{/g, '&#123;&#123;') : seg;
	};
	const slot = (text: string) => {
		slots.push(text);
		size += text.length;
		return `__AXS${nonce}_${slots.length - 1}__`;
	};
	for (const { tag, start, end } of tags) {
		literal(source.slice(last, start));
		last = end;
		if (tag.kind === 'unsupported') {
			if (mode === 'fill') html.feed(tag.raw);
			template += inertBraces(tag.raw);
			continue;
		}
		if (mode === 'keep') {
			// Mailer reads a fallback as raw text and escapes it once, so a fallback written in rich text
			// (character references encoded) goes back decoded. fallbackError has already refused anything
			// whose decoded form is not plain text.
			template += tag.kind === 'field' && tag.fallback !== null ? formatField(tag.key, decodeCharRefs(tag.fallback)) : tag.raw;
			continue;
		}
		const ctx = html.context();
		if (tag.kind === 'field') {
			const v = Object.hasOwn(values, tag.key) ? values[tag.key] : undefined;
			const useFallback = tag.fallback !== null && blank(v);
			const raw = useFallback ? (tag.fallback as string) : v === undefined || v === null ? '' : String(v);
			const out = place(ctx, raw, useFallback, tailOf(end));
			if (out === null) {
				badUrls.add(tag.key);
				template += slot('');
			} else template += slot(out);
			html.emitted(useFallback ? decodeCharRefs(raw) : raw);
		} else {
			const def = links.get(tag.key);
			let out: string | null = '';
			if (def === undefined) unknown.add(tag.key);
			else {
				const ex = expandLink(def, values);
				if (!ex.ok) {
					if (!bad.has(tag.key)) bad.set(tag.key, ex.error);
				} else {
					out = place(ctx, ex.url, true, tailOf(end));
					if (out === null) {
						if (!bad.has(tag.key)) bad.set(tag.key, 'it cannot follow other text at the start of a URL');
						out = '';
					}
					html.emitted(ex.url);
				}
			}
			template += slot(out);
		}
		if (size + template.length > MAX_RENDERED_HTML) return result('', `the email would be larger than ${MAX_RENDERED_HTML} characters`);
	}
	literal(source.slice(last));
	if (size + template.length > MAX_RENDERED_HTML) return result('', `the email would be larger than ${MAX_RENDERED_HTML} characters`);
	return result(template);
}

/** Pass two: put the slot text back after MJML has run. Single pass over the output. */
export function fillSlots(rendered: string, slots: string[], nonce: string): string {
	const re = new RegExp(`__AXS${nonce}_(\\d{1,6})__`, 'g');
	return rendered.replace(re, (_m, n: string) => slots[Number(n)] ?? '');
}

export type SubjectRender =
	| { ok: true; subject: string }
	| { ok: false; missing: string[]; unknownLinks: string[]; badLinks: { key: string; error: string }[]; unsupported: string[] };

/**
 * Merges a subject line the way Mailer merges a template subject: values and fallbacks go in as
 * plain text (a subject is a header, not HTML) with control characters turned into a space, and
 * {{link:key}} becomes the expanded URL. A plain {{name}} with no value, an unknown or unusable
 * link and unsupported syntax are reported instead, so a literal "{{" never reaches an inbox.
 */
export function renderSubject(subject: string, values: Values, links: ReadonlyMap<string, string>): SubjectRender {
	const missing = new Set<string>();
	const unknown = new Set<string>();
	const bad = new Map<string, string>();
	const unsupported: string[] = [];
	let out = '';
	let last = 0;
	for (const { tag, start, end } of scanTags(subject)) {
		out += subject.slice(last, start);
		last = end;
		if (tag.kind === 'unsupported') {
			unsupported.push(excerpt(tag.raw));
			continue;
		}
		if (tag.kind === 'field') {
			const v = Object.hasOwn(values, tag.key) ? values[tag.key] : undefined;
			if (!blank(v)) out += String(v);
			else if (tag.fallback !== null) out += tag.fallback;
			else missing.add(tag.key);
			continue;
		}
		const def = links.get(tag.key);
		if (def === undefined) {
			unknown.add(tag.key);
			continue;
		}
		const ex = expandLink(def, values);
		if (ex.ok) out += ex.url;
		else if (!bad.has(tag.key)) bad.set(tag.key, ex.error);
	}
	out += subject.slice(last);
	if (missing.size || unknown.size || bad.size || unsupported.length) {
		return { ok: false, missing: [...missing], unknownLinks: [...unknown], badLinks: [...bad].map(([key, error]) => ({ key, error })), unsupported };
	}
	return { ok: true, subject: out.replace(/[\u0000-\u001f\u007f\u0085\u2028\u2029]/g, ' ') };
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

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Wraps placeholders in the text parts of an HTML string in <span class="ph ph-..."> for the canvas.
 * Tags (and so attribute values such as href="{{link:x}}") are left exactly as they are, and the
 * placeholder text itself stays literal. Cost is linear in the input.
 */
export function chipifyHtml(html: string, kindOf: (tag: Tag) => string = (t) => t.kind): string {
	if (!html.includes('{{')) return html;
	let out = '';
	let i = 0;
	while (i < html.length) {
		const lt = html.indexOf('<', i);
		const textEnd = lt === -1 ? html.length : lt;
		const text = html.slice(i, textEnd);
		let last = 0;
		for (const { tag, start, end } of scanTags(text, 200)) {
			out += text.slice(last, start) + `<span class="ph ph-${kindOf(tag)}">${esc(tag.raw).replace(/&amp;(amp|lt|gt|quot|#\d+);/g, '&$1;')}</span>`;
			last = end;
		}
		out += text.slice(last);
		if (lt === -1) break;
		const gt = html.indexOf('>', lt);
		if (gt === -1) {
			out += html.slice(lt);
			break;
		}
		out += html.slice(lt, gt + 1);
		i = gt + 1;
	}
	return out;
}
