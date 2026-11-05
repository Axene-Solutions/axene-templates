// Server-side allowlist for editor blocks. Every block that is stored, served to the editor,
// compiled or sent goes through sanitizeBlocks first, whatever its source (the editor, the
// public gallery, a Mailer template). Pure apart from sanitize-html, so it is unit tested
// directly.
//
// Per block type, per prop:
//   html   rich text, run through sanitize-html with a small tag set (only when it contains "<")
//   text   plain text, escaped at every sink; length capped, control characters removed
//   url    http, https, mailto, tel, relative or {{placeholder}} forms only, entities refused
//   color  #rgb, #rgba, #rrggbb, #rrggbbaa, theme tokens, transparent, rgb()/rgba() numbers
//   number finite, clamped to the prop's bounds
//   enum   exactly one of the values the editor offers
// Unknown props are dropped. Unknown block types and malformed structure are an error.

import sanitizeHtml, { type SanitizeHtmlOptions } from 'sanitize-html';
import { blockDefs, type Block, type BlockType } from '$lib/blocks';
import { firstUnsupported, isSafeLiteralUrl, MAX_SCAN_TAGS, scanTagsLimited } from '$lib/placeholders';

export const MAX_BLOCKS = 200;
export const MAX_BLOCKS_BYTES = 1_000_000;
/** Most the cleaned blocks may weigh: escaping can grow text, and the result is stored and rendered. */
export const MAX_CLEAN_BYTES = 1_500_000;
export const MAX_HTML = 20_000;
export const MAX_TEXT = 2_000;
export const MAX_URL = 2_000;
export const MAX_ITEMS = 100;
export const MAX_ROWS = 200;
export const MAX_LINKS = 20;

export class BlocksValidationError extends Error {
	readonly code = 'invalid_blocks';
	constructor(message: string) {
		super(message);
		this.name = 'BlocksValidationError';
	}
}

export interface SanitizeOptions {
	/**
	 * true (ingestion): a prop with the wrong shape is an error.
	 * false (read, render): it is replaced with the block type's default, or dropped.
	 * Rich text is always cleaned, never rejected, in both modes.
	 */
	strict?: boolean;
	/** Allow an empty block list (the editor can save one). Default true. */
	allowEmpty?: boolean;
	/**
	 * With strict: refuse rich text from which the allowlist had to remove a tag, attribute
	 * or link, instead of cleaning it. For content from another system (Mailer open).
	 */
	rejectUnsafeHtml?: boolean;
}

// ---- Value checks ----

const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
const ALL_CONTROL = /[\u0000-\u001f\u007f]/g;

/**
 * Returns the URL (trimmed) when it is safe to put in an href or src, otherwise null.
 * Placeholders are judged by what they can produce: a fallback must itself be safe in that
 * position, a bare {{field}} or {{link:key}} counts as an absolute http(s) value (Mailer and
 * the local send path check those at fill time). A placeholder that starts the URL must be the
 * whole URL or be followed at once by / ? or #, so the text after it can never finish a scheme
 * ({{x}}:alert(1) or {{x|/ok}}script:alert(1)). Any {{ that is not a supported placeholder is
 * refused. Character references are refused in the scheme part, so "javascript&#58;" and
 * "java&#x09;script:" never decode into a scheme.
 */
export function safeUrl(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const t = value.trim();
	if (t === '') return '';
	if (t.length > MAX_URL) return null;
	const { tags, capped } = scanTagsLimited(t, 50);
	if (capped) return null;
	let effective = '';
	let last = 0;
	for (const { tag, start, end } of tags) {
		const gap = t.slice(last, start);
		if (gap.includes('{{')) return null;
		effective += gap;
		last = end;
		if (tag.kind === 'unsupported') return null;
		if (start === 0 && end < t.length && !'/?#'.includes(t[end])) return null;
		if (tag.kind === 'field' && tag.fallback !== null) effective += tag.fallback.trim();
		else effective += effective === '' ? 'https://placeholder.invalid' : 'p';
	}
	const tail = t.slice(last);
	if (tail.includes('{{')) return null;
	effective += tail;
	return isSafeLiteralUrl(effective) ? t : null;
}

/** The scheme check on a URL with no placeholders (shared with the local send path). */
export { isSafeLiteralUrl };

const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB = /^rgba?\(\s*\d{1,3}(?:\.\d+)?%?\s*,\s*\d{1,3}(?:\.\d+)?%?\s*,\s*\d{1,3}(?:\.\d+)?%?\s*(?:,\s*(?:0|1|0?\.\d{1,4}|1\.0{1,4})\s*)?\)$/i;
const COLOR_TOKENS = new Set(['theme', 'theme-light', 'theme-dark', 'transparent']);

export function isColor(v: unknown): v is string {
	return typeof v === 'string' && v.length <= 40 && (HEX.test(v) || RGB.test(v) || COLOR_TOKENS.has(v));
}

export function isHexColor(v: unknown): v is string {
	return typeof v === 'string' && HEX.test(v);
}

// ---- Rich text ----

const RICH_TAGS = new Set(['b', 'strong', 'i', 'em', 'u', 'br', 'p', 'span', 'a', 'ul', 'ol', 'li']);
// Set by the transform below when sanitising removes something, so strict callers can refuse.
let removed = false;

// textFilter is part of sanitize-html at runtime but missing from its bundled types.
const RICH: SanitizeHtmlOptions & { textFilter: (text: string, tagName: string) => string } = {
	allowedTags: [...RICH_TAGS],
	allowedAttributes: { a: ['href', 'rel', 'target'] },
	allowedSchemes: ['http', 'https', 'mailto', 'tel'],
	allowedSchemesAppliedToAttributes: ['href'],
	allowProtocolRelative: false,
	disallowedTagsMode: 'discard',
	parser: { decodeEntities: true, lowerCaseTags: true, lowerCaseAttributeNames: true },
	// Text arrives with & < > escaped; quotes are escaped too, so text can never end an attribute.
	textFilter: (text: string) => escapeQuotes(text),
	transformTags: {
		'*': (tagName: string, attribs: Record<string, string>) => {
			if (!RICH_TAGS.has(tagName)) {
				removed = true;
				return { tagName, attribs };
			}
			if (tagName !== 'a') {
				if (Object.keys(attribs).length) removed = true;
				return { tagName, attribs: {} };
			}
			// attribs arrive entity-decoded, so the scheme check sees what a browser would.
			const href = safeUrl(attribs.href ?? '');
			if (href === null || Object.keys(attribs).some((k) => k !== 'href' && k !== 'rel' && k !== 'target')) removed = true;
			return { tagName, attribs: href ? { href, rel: 'noopener noreferrer', target: '_blank' } : {} };
		},
	},
};

function escapeQuotes(s: string): string {
	return s.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Allowlist-sanitises one rich text value. Text without "<" cannot hold markup; its quotes and
 * ">" are escaped so it cannot end an attribute either, whatever stage puts it next to one.
 */
export function sanitizeRichText(v: string): string {
	return cleanRichText(v).html;
}

/**
 * Deepest element nesting rich text may have. MJML's HTML handling is superlinear in nesting
 * depth, and no real email needs more than a handful of levels.
 */
export const MAX_RICH_DEPTH = 32;

/**
 * Keeps at most MAX_RICH_DEPTH levels of elements in allowlisted, well-formed HTML (the output of
 * sanitize-html): a tag past the limit is dropped with its closing tag, its text is kept. One
 * forward pass. `tooDeep` says something was dropped.
 */
function limitDepth(html: string): { html: string; tooDeep: boolean } {
	let depth = 0;
	let max = 0;
	for (let i = html.indexOf('<'); i !== -1; i = html.indexOf('<', i + 1)) {
		if (html[i + 1] === '/') depth--;
		else if (!html.startsWith('<br', i)) max = Math.max(max, ++depth);
	}
	if (max <= MAX_RICH_DEPTH) return { html, tooDeep: false };
	const kept: boolean[] = [];
	depth = 0;
	let out = '';
	let last = 0;
	for (let i = html.indexOf('<'); i !== -1; i = html.indexOf('<', last)) {
		const gt = html.indexOf('>', i);
		if (gt === -1) break;
		out += html.slice(last, i);
		last = gt + 1;
		const tag = html.slice(i, last);
		if (tag[1] === '/') {
			const k = kept.pop();
			if (k) {
				depth--;
				out += tag;
			}
		} else if (tag.startsWith('<br')) out += tag;
		else if (depth < MAX_RICH_DEPTH) {
			kept.push(true);
			depth++;
			out += tag;
		} else kept.push(false);
	}
	return { html: out + html.slice(last), tooDeep: true };
}

/** As sanitizeRichText, and says whether a tag, attribute or link was removed, or nesting cut. */
export function cleanRichText(v: string): { html: string; removed: boolean; tooDeep: boolean } {
	const s = v.replace(CONTROL, '');
	if (!s.includes('<')) return { html: escapeQuotes(s).replace(/>/g, '&gt;'), removed: false, tooDeep: false };
	removed = false;
	const limited = limitDepth(sanitizeHtml(s, RICH));
	return { html: limited.html, removed, tooDeep: limited.tooDeep };
}

// ---- Schema ----

type Rule =
	| { kind: 'html' }
	| { kind: 'text'; max?: number }
	| { kind: 'url' }
	| { kind: 'color'; hexOnly?: boolean }
	| { kind: 'number'; min: number; max: number; int?: boolean }
	| { kind: 'enum'; values: readonly string[] }
	| { kind: 'bool' }
	| { kind: 'lineHeight' }
	| { kind: 'boxPadding' }
	| { kind: 'htmlList'; max: number }
	| { kind: 'rows' }
	| { kind: 'links' };

const PAD: Record<string, Rule> = {
	paddingTop: { kind: 'number', min: 0, max: 300 },
	paddingBottom: { kind: 'number', min: 0, max: 300 },
	paddingLeft: { kind: 'number', min: 0, max: 300 },
	paddingRight: { kind: 'number', min: 0, max: 300 },
};
const ALIGN: Rule = { kind: 'enum', values: ['left', 'center', 'right'] };
const WEIGHT: Rule = { kind: 'enum', values: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'] };
const FONT_SIZE: Rule = { kind: 'number', min: 1, max: 120 };
const COLOR: Rule = { kind: 'color' };

export const BLOCK_SCHEMA: Record<BlockType, Record<string, Rule>> = {
	header: {
		logoUrl: { kind: 'url' },
		companyName: { kind: 'text', max: 200 },
		tagline: { kind: 'text', max: 300 },
		layout: { kind: 'enum', values: ['logo-left', 'logo-center', 'logo-right', 'logo-only', 'text-only'] },
		accentColor: { kind: 'color', hexOnly: true },
		backgroundColor: COLOR,
		logoWidth: { kind: 'number', min: 0, max: 600 },
		fontSize: FONT_SIZE,
		color: COLOR,
		align: ALIGN,
		...PAD,
	},
	heading: { text: { kind: 'html' }, fontSize: FONT_SIZE, fontWeight: WEIGHT, color: COLOR, align: ALIGN, ...PAD },
	subheading: { text: { kind: 'html' }, fontSize: FONT_SIZE, fontWeight: WEIGHT, color: COLOR, align: ALIGN, lineHeight: { kind: 'lineHeight' }, ...PAD },
	content: { text: { kind: 'html' }, fontSize: FONT_SIZE, fontWeight: WEIGHT, color: COLOR, align: ALIGN, lineHeight: { kind: 'lineHeight' }, ...PAD },
	image: {
		src: { kind: 'url' },
		alt: { kind: 'text', max: 300 },
		width: { kind: 'number', min: 0, max: 1200 },
		href: { kind: 'url' },
		...PAD,
	},
	button: {
		text: { kind: 'html' },
		href: { kind: 'url' },
		backgroundColor: COLOR,
		color: COLOR,
		fontSize: FONT_SIZE,
		fontWeight: WEIGHT,
		borderRadius: { kind: 'number', min: 0, max: 100 },
		width: { kind: 'number', min: -1, max: 1200, int: true },
		align: ALIGN,
		innerPadding: { kind: 'boxPadding' },
		...PAD,
	},
	list: { items: { kind: 'htmlList', max: MAX_ITEMS }, fontSize: FONT_SIZE, color: COLOR, bulletColor: COLOR, ...PAD },
	table: {
		headerRow: { kind: 'bool' },
		col1Header: { kind: 'text', max: 300 },
		col2Header: { kind: 'text', max: 300 },
		rows: { kind: 'rows' },
		headerBg: COLOR,
		headerColor: COLOR,
		cellColor: COLOR,
		borderColor: COLOR,
		fontSize: FONT_SIZE,
		...PAD,
	},
	section: {
		backgroundColor: COLOR,
		borderRadius: { kind: 'number', min: 0, max: 100 },
		borderStyle: { kind: 'enum', values: ['none', 'solid', 'dashed', 'dotted'] },
		borderColor: COLOR,
		...PAD,
	},
	footer: {
		text: { kind: 'html' },
		companyName: { kind: 'text', max: 200 },
		companyAddress: { kind: 'text', max: 500 },
		links: { kind: 'links' },
		unsubText: { kind: 'text', max: 100 },
		unsubUrl: { kind: 'url' },
		fontSize: FONT_SIZE,
		color: COLOR,
		linkColor: COLOR,
		align: ALIGN,
		showDivider: { kind: 'bool' },
		...PAD,
	},
};

const DEFAULTS = new Map(blockDefs.map((d) => [d.type, d.defaultProps]));
const INVALID = Symbol('invalid');
type Out = unknown | typeof INVALID;

function plainText(v: unknown, max: number): Out {
	if (typeof v === 'number') v = String(v);
	if (typeof v !== 'string' || v.length > max) return INVALID;
	return v.replace(ALL_CONTROL, ' ');
}

let refuseRemoved = false;
// Strict mode refuses rich text nested deeper than MAX_RICH_DEPTH; normal mode flattens it.
let refuseDeep = false;
let deepHit = false;

function richText(v: unknown, max = MAX_HTML): Out {
	if (typeof v === 'number') v = String(v);
	if (typeof v !== 'string' || v.length > max) return INVALID;
	const r = cleanRichText(v);
	if (refuseDeep && r.tooDeep) {
		deepHit = true;
		return INVALID;
	}
	return refuseRemoved && r.removed ? INVALID : r.html;
}

function num(v: unknown, r: { min: number; max: number; int?: boolean }, strict: boolean): Out {
	const n = typeof v === 'number' ? v : typeof v === 'string' && /^-?\d{1,6}(?:\.\d{1,4})?$/.test(v.trim()) ? Number(v) : NaN;
	if (!Number.isFinite(n)) return INVALID;
	if (r.int && !Number.isInteger(n)) return INVALID;
	if (n < r.min || n > r.max) return strict ? INVALID : Math.min(r.max, Math.max(r.min, n));
	return n;
}

function check(rule: Rule, v: unknown, strict: boolean): Out {
	switch (rule.kind) {
		case 'html':
			return richText(v);
		case 'text':
			return plainText(v, rule.max ?? MAX_TEXT);
		case 'url': {
			const u = safeUrl(v);
			return u === null ? INVALID : u;
		}
		case 'color':
			return (rule.hexOnly ? isHexColor(v) : isColor(v)) ? v : INVALID;
		case 'number':
			return num(v, rule, strict);
		case 'enum':
			return typeof v === 'string' && rule.values.includes(v) ? v : INVALID;
		case 'bool':
			return typeof v === 'boolean' ? v : INVALID;
		case 'lineHeight': {
			if (typeof v === 'number') return Number.isFinite(v) && v > 0 && v <= 5 ? v : INVALID;
			return typeof v === 'string' && /^(?:[0-4](?:\.\d{1,3})?|5)$|^\d{1,3}px$/.test(v) ? v : INVALID;
		}
		case 'boxPadding':
			return typeof v === 'string' && /^\d{1,3}px(?: \d{1,3}px){0,3}$/.test(v) ? v : INVALID;
		case 'htmlList': {
			if (!Array.isArray(v) || v.length > rule.max) return INVALID;
			const out: string[] = [];
			for (const item of v) {
				const s = richText(item, MAX_TEXT);
				if (s === INVALID) {
					if (strict) return INVALID;
					continue;
				}
				out.push(s as string);
			}
			return out;
		}
		case 'rows': {
			if (!Array.isArray(v) || v.length > MAX_ROWS) return INVALID;
			const out: { col1: string; col2: string }[] = [];
			for (const row of v) {
				if (!row || typeof row !== 'object' || Array.isArray(row)) {
					if (strict) return INVALID;
					continue;
				}
				const c1 = richText((row as any).col1 ?? '', MAX_TEXT);
				const c2 = richText((row as any).col2 ?? '', MAX_TEXT);
				if (c1 === INVALID || c2 === INVALID) {
					if (strict) return INVALID;
					continue;
				}
				out.push({ col1: c1 as string, col2: c2 as string });
			}
			return out;
		}
		case 'links': {
			if (!Array.isArray(v) || v.length > MAX_LINKS) return INVALID;
			const out: { label: string; url: string }[] = [];
			for (const link of v) {
				if (!link || typeof link !== 'object' || Array.isArray(link)) {
					if (strict) return INVALID;
					continue;
				}
				const label = plainText((link as any).label ?? '', 200);
				const url = safeUrl((link as any).url ?? '');
				if (label === INVALID || url === null) {
					if (strict) return INVALID;
					continue;
				}
				out.push({ label: label as string, url });
			}
			return out;
		}
	}
}

const ID = /^[A-Za-z0-9_.:-]{1,100}$/;

function describe(rule: Rule): string {
	switch (rule.kind) {
		case 'url':
			return 'a safe URL (http, https, mailto, tel or relative)';
		case 'color':
			return rule.hexOnly ? 'a hex colour' : 'a colour';
		case 'number':
			return `a number from ${rule.min} to ${rule.max}`;
		case 'enum':
			return `one of ${rule.values.join(', ')}`;
		case 'bool':
			return 'true or false';
		case 'html':
		case 'htmlList':
		case 'rows':
			return refuseRemoved ? 'rich text with only b, strong, i, em, u, br, p, span, a, ul, ol and li, and safe links' : 'valid';
		default:
			return 'valid';
	}
}

/**
 * Returns a sanitised copy of the blocks, or throws BlocksValidationError with a short message.
 * The result holds only known block types and known props, as fresh plain objects.
 */
export function sanitizeBlocks(input: unknown, opts: SanitizeOptions = {}): Block[] {
	const strict = opts.strict ?? false;
	const allowEmpty = opts.allowEmpty ?? true;
	refuseRemoved = strict && (opts.rejectUnsafeHtml ?? false);
	refuseDeep = strict;
	if (!Array.isArray(input)) throw new BlocksValidationError('blocks must be an array');
	if (input.length === 0 && !allowEmpty) throw new BlocksValidationError('blocks is empty');
	if (input.length > MAX_BLOCKS) throw new BlocksValidationError(`at most ${MAX_BLOCKS} blocks are allowed`);
	let size: number;
	try {
		size = JSON.stringify(input).length;
	} catch {
		throw new BlocksValidationError('blocks cannot be serialized');
	}
	if (size > MAX_BLOCKS_BYTES) throw new BlocksValidationError('blocks are too large');

	const ids = new Set<string>();
	const out: Block[] = [];
	let cleanSize = 0;
	let tagCount = 0;
	input.forEach((b, i) => {
		if (!b || typeof b !== 'object' || Array.isArray(b)) throw new BlocksValidationError('every block must be an object');
		const { type, props } = b as Record<string, unknown>;
		let id = (b as Record<string, unknown>).id;
		if (typeof type !== 'string' || !Object.hasOwn(BLOCK_SCHEMA, type)) {
			if (strict) throw new BlocksValidationError('a block has an unknown type');
			return;
		}
		if (typeof id !== 'string' || !ID.test(id)) {
			if (strict) throw new BlocksValidationError('every block needs an id of letters, digits, _ . : or -');
			id = `blk_fixed_${i}`;
		}
		if (ids.has(id as string)) {
			if (strict) throw new BlocksValidationError('block ids must be unique');
			id = `${String(id).slice(0, 80)}_${i}`;
		}
		ids.add(id as string);
		if (!props || typeof props !== 'object' || Array.isArray(props)) {
			if (strict) throw new BlocksValidationError('every block needs a props object');
		}
		const src = (props && typeof props === 'object' && !Array.isArray(props) ? props : {}) as Record<string, unknown>;
		const schema = BLOCK_SCHEMA[type as BlockType];
		const defaults = DEFAULTS.get(type as BlockType) ?? {};
		// Every prop the renderer reads is present: missing ones take the block type's default.
		const clean: Record<string, unknown> = {};
		for (const key of Object.keys(schema)) {
			if (Object.hasOwn(defaults, key)) clean[key] = structuredClone(defaults[key]);
			else if (ARRAY_RULES.has(schema[key].kind)) clean[key] = [];
		}
		for (const [key, rule] of Object.entries(schema)) {
			if (!Object.hasOwn(src, key) || src[key] === undefined || src[key] === null) continue;
			if (strict) {
				const bad = unsupportedIn(src[key]);
				if (bad) throw new BlocksValidationError(`${type}.${key} uses syntax that is not supported: ${bad.text} (${bad.reason}). Only {{field}}, {{field|fallback}} and {{link:key}} can be used`);
				tagCount += countTags(src[key]);
				if (tagCount > MAX_SCAN_TAGS) throw new BlocksValidationError(`the template has more than ${MAX_SCAN_TAGS} placeholders`);
			}
			deepHit = false;
			const v = check(rule, src[key], strict);
			if (v !== INVALID) {
				clean[key] = v;
				continue;
			}
			if (strict && deepHit) throw new BlocksValidationError(`${type}.${key} nests formatting more than ${MAX_RICH_DEPTH} levels deep, the limit is ${MAX_RICH_DEPTH}`);
			if (strict) throw new BlocksValidationError(`${type}.${key} must be ${describe(rule)}`);
		}
		// A header without an accent colour keeps taking the theme from its background, as before.
		if (type === 'header' && !(Object.hasOwn(src, 'accentColor') && src.accentColor) && isHexColor(clean.backgroundColor)) {
			clean.accentColor = clean.backgroundColor;
		}
		cleanSize += JSON.stringify(clean).length;
		if (cleanSize > MAX_CLEAN_BYTES) throw new BlocksValidationError('blocks are too large once cleaned');
		out.push({ id: id as string, type: type as BlockType, props: clean });
	});
	return out;
}

const ARRAY_RULES = new Set<Rule['kind']>(['htmlList', 'rows', 'links']);

function countTags(v: unknown, depth = 0): number {
	if (typeof v === 'string') return v.includes('{{') ? scanTagsLimited(v).tags.length : 0;
	if (depth > 3 || !v || typeof v !== 'object') return 0;
	let n = 0;
	for (const x of Array.isArray(v) ? v : Object.values(v)) n += countTags(x, depth + 1);
	return n;
}

/** The first `{{` in any string of `v` that is not a supported placeholder, or null. */
function unsupportedIn(v: unknown, depth = 0): { text: string; reason: string } | null {
	if (typeof v === 'string') return firstUnsupported(v);
	if (depth > 3 || !v || typeof v !== 'object') return null;
	for (const x of Array.isArray(v) ? v : Object.values(v)) {
		const r = unsupportedIn(x, depth + 1);
		if (r) return r;
	}
	return null;
}

/** Blocks that arrive from Mailer: strict shapes, and markup the allowlist would remove is refused. */
export function sanitizeForOpen(input: unknown): Block[] {
	return sanitizeBlocks(input, { strict: true, allowEmpty: false, rejectUnsafeHtml: true });
}

/** sanitizeBlocks for reads: never throws, a hopeless value becomes an empty list. */
export function sanitizeBlocksForRead(input: unknown): Block[] {
	try {
		return sanitizeBlocks(input, { strict: false });
	} catch {
		return [];
	}
}

// ---- Compiled HTML tripwire ----

const NAMED: Record<string, string> = { colon: ':', tab: '\t', newline: '\n', lpar: '(', rpar: ')', sol: '/', amp: '&', quot: '"', apos: "'" };

function decodeRefs(s: string): string {
	return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);?/gi, (m, ref: string) => {
		if (ref[0] === '#') {
			const code = ref[1] === 'x' || ref[1] === 'X' ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10);
			return Number.isFinite(code) && code < 0x110000 ? String.fromCodePoint(code) : '';
		}
		return NAMED[ref.toLowerCase()] ?? m;
	});
}

/** Decodes CSS escapes (\XX to \XXXXXX hex with one optional space, or \ before any other character). */
function decodeCssEscapes(s: string): string {
	if (!s.includes('\\')) return s;
	return s.replace(/\\(?:([0-9a-f]{1,6})[ \t\n\r\f]?|([\s\S]))/gi, (_m, hex: string | undefined, ch: string | undefined) => {
		if (hex) {
			const code = parseInt(hex, 16);
			return code > 0 && code < 0x110000 ? String.fromCodePoint(code) : '';
		}
		return ch === '\n' ? '' : (ch ?? '');
	});
}

/** One attribute value as a browser or a CSS parser would read it, for the checks below. */
function normalizeValue(v: string): string {
	return decodeCssEscapes(decodeRefs(v))
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/[\u0000- \u007f]/g, '')
		.toLowerCase();
}

const FULL_OVERLAY = /(?:^|;)(?:top|left|right|bottom|inset):0|(?:^|;)(?:width|height):100(?:%|vw|vh)/;

/** Why one attribute is refused, or null. */
function attrProblem(name: string, rawValue: string): string | null {
	if (/^on/i.test(name)) return 'it contains an event handler attribute';
	if (!rawValue) return null;
	const val = normalizeValue(rawValue);
	if (/^(?:javascript|vbscript|livescript):|^data:text\/html/.test(val)) return 'it contains a script URL';
	if (/url\((?:'|")?(?:javascript|vbscript):|expression\(/.test(val)) return 'it contains script in a style';
	if (/position:(?:fixed|absolute)/.test(val) && FULL_OVERLAY.test(val)) return 'it contains a full screen overlay style';
	return null;
}

const WS = new Set([' ', '\t', '\n', '\r', '\f']);

/**
 * Final check on compiled email HTML before it leaves for Mailer or a recipient. Returns the
 * reason it is refused, or null. This never strips anything: if it fires, a sanitiser rule is
 * missing and the request must fail loudly.
 *
 * Start tags are read attribute by attribute, the way a browser tokenises them, with a hand
 * written scanner: one forward pass, no regex over the tag, so cost is linear in the input. A
 * "<" followed by a letter that does not form a complete start tag is itself a problem.
 */
export function compiledHtmlProblem(html: string): string | null {
	if (/<\s*script\b/i.test(html)) return 'it contains a script tag';
	if (/<\s*\/?\s*mj-[a-z]/i.test(html)) return 'it contains raw MJML';
	if (/<\s*(?:iframe|object|embed|base|form|svg|math)\b/i.test(html)) return 'it contains an embedded document or form';
	const n = html.length;
	let i = 0;
	for (;;) {
		i = html.indexOf('<', i);
		if (i === -1) return null;
		const c = html.charCodeAt(i + 1);
		const letter = (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
		if (!letter) {
			i++;
			continue;
		}
		// Tag name.
		let p = i + 1;
		while (p < n && !WS.has(html[p]) && html[p] !== '/' && html[p] !== '>') p++;
		// Attributes.
		for (;;) {
			while (p < n && (WS.has(html[p]) || html[p] === '/')) p++;
			if (p >= n) return 'it contains a tag that is not closed';
			if (html[p] === '>') break;
			const ch = html[p];
			if (ch === '"' || ch === "'" || ch === '<' || ch === '=') return 'it contains a tag that cannot be read safely';
			const ns = p;
			while (p < n && !WS.has(html[p]) && html[p] !== '/' && html[p] !== '>' && html[p] !== '=') {
				const q = html[p];
				if (q === '"' || q === "'" || q === '<') return 'it contains a tag that cannot be read safely';
				p++;
			}
			const name = html.slice(ns, p);
			let q = p;
			while (q < n && WS.has(html[q])) q++;
			let value = '';
			if (html[q] === '=') {
				q++;
				while (q < n && WS.has(html[q])) q++;
				if (q >= n) return 'it contains a tag that is not closed';
				const quote = html[q];
				if (quote === '"' || quote === "'") {
					const close = html.indexOf(quote, q + 1);
					if (close === -1) return 'it contains a tag that is not closed';
					value = html.slice(q + 1, close);
					p = close + 1;
				} else {
					const vs = q;
					while (q < n && !WS.has(html[q]) && html[q] !== '>') q++;
					value = html.slice(vs, q);
					p = q;
				}
			}
			const problem = attrProblem(name, value);
			if (problem) return problem;
		}
		i = p + 1;
	}
}
