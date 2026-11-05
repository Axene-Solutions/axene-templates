// Pure logic shared by the browser and the server for Save to Mailer / From Mailer.
// No SvelteKit or Node imports, so it can be unit tested directly.

import type { BlockType } from './blocks';
import { collectUsage, parseTag } from './placeholders';

export const ENVELOPE_FORMAT = 'axene-blocks';
export const ENVELOPE_VERSION = 1;
export const DEFAULT_THEME_COLOR = '#1daa82';

export const MAX_BLOCKS = 200;
export const MAX_BLOCKS_BYTES = 1_000_000;
export const MAX_STRING = 20_000;
export const MAX_DEPTH = 8;
export const MAX_SUBJECT_MAILER = 998;
export const MAX_TEMPLATE_NAME = 120;

export const KNOWN_BLOCK_TYPES: readonly BlockType[] = [
	'header', 'heading', 'subheading', 'content', 'image', 'button', 'list', 'table', 'section', 'footer',
];

export interface BlocksEnvelope {
	format: typeof ENVELOPE_FORMAT;
	version: typeof ENVELOPE_VERSION;
	blocks: unknown[];
	themeColor: string;
}

/** Same rule as the editor store: the header block's accent color drives the theme. */
export function themeColorOf(blocks: unknown[]): string {
	const header = blocks.find((b) => b && typeof b === 'object' && (b as any).type === 'header') as any;
	const c = header?.props?.accentColor;
	return typeof c === 'string' && c ? c : DEFAULT_THEME_COLOR;
}

/** The blocks_json object Mailer stores for a template made in this editor. */
export function buildEnvelope(blocks: unknown[], themeColor?: string): BlocksEnvelope {
	return {
		format: ENVELOPE_FORMAT,
		version: ENVELOPE_VERSION,
		blocks,
		themeColor: themeColor || themeColorOf(blocks),
	};
}

export interface UnsupportedSyntax {
	/** The offending text as written, shortened. */
	text: string;
	/** Plain-language reason. */
	reason: string;
}

/** Why a `{{ ... }}` tag is Handlebars logic or otherwise outside the placeholder grammar, or null if it is valid. */
export function classifyTag(tag: string): string | null {
	const t = parseTag(tag);
	return t.kind === 'unsupported' ? t.reason : null;
}

/**
 * Syntax Mailer cannot fill in. {{name}}, {{name|fallback}} and {{link:key}} are valid;
 * only Handlebars logic such as {{#if}}, {{a.b}} and {{{x}}} is reported.
 */
export function detectUnsupportedSyntax(blocks: unknown, limit = 20): UnsupportedSyntax[] {
	return collectUsage(blocks, limit).unsupported;
}

/** Merge field keys the blocks use (with or without a fallback). */
export function detectPlaceholders(blocks: unknown): string[] {
	return [...collectUsage(blocks).fields.keys()];
}

export type Checked<T> = { ok: true; value: T } | { ok: false; error: string };

const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const URL_KEY = /(url|src|href)$/i;
const BAD_URL = /^\s*(javascript|vbscript):/i;

function checkValue(v: unknown, key: string, depth: number): string | null {
	if (depth > MAX_DEPTH) return 'nested too deeply';
	if (v === null || typeof v === 'boolean') return null;
	if (typeof v === 'number') return Number.isFinite(v) ? null : 'a number is not finite';
	if (typeof v === 'string') {
		if (v.length > MAX_STRING) return 'a text value is too long';
		if (URL_KEY.test(key) && (/["<>\u0000-\u001f]/.test(v) || BAD_URL.test(v))) return `an unsafe value in "${key}"`;
		return null;
	}
	if (Array.isArray(v)) {
		if (v.length > 500) return 'a list is too long';
		for (const x of v) {
			const e = checkValue(x, key, depth + 1);
			if (e) return e;
		}
		return null;
	}
	if (typeof v === 'object') {
		const keys = Object.keys(v as object);
		if (keys.length > 200) return 'an object has too many fields';
		for (const k of keys) {
			if (BAD_KEYS.has(k)) return `a forbidden field name "${k}"`;
			const e = checkValue((v as Record<string, unknown>)[k], k, depth + 1);
			if (e) return e;
		}
		return null;
	}
	return 'an unsupported value type';
}

/**
 * Defensive check for blocks that arrive from another system. Returns the same
 * array if it is an array of { id, type, props } objects with a known type,
 * unique ids, bounded size and no prototype-pollution keys or script URLs.
 */
export function validateBlocks(input: unknown): Checked<unknown[]> {
	if (!Array.isArray(input)) return { ok: false, error: 'blocks must be an array' };
	if (input.length === 0) return { ok: false, error: 'blocks is empty' };
	if (input.length > MAX_BLOCKS) return { ok: false, error: `at most ${MAX_BLOCKS} blocks are allowed` };
	const ids = new Set<string>();
	for (const b of input) {
		if (!b || typeof b !== 'object' || Array.isArray(b)) return { ok: false, error: 'every block must be an object' };
		const { id, type, props } = b as Record<string, unknown>;
		if (typeof id !== 'string' || id.length === 0 || id.length > 100) return { ok: false, error: 'every block needs a string id' };
		if (ids.has(id)) return { ok: false, error: 'block ids must be unique' };
		ids.add(id);
		if (typeof type !== 'string' || !(KNOWN_BLOCK_TYPES as readonly string[]).includes(type)) return { ok: false, error: 'a block has an unknown type' };
		if (!props || typeof props !== 'object' || Array.isArray(props)) return { ok: false, error: 'every block needs a props object' };
		const e = checkValue(props, '', 0);
		if (e) return { ok: false, error: e };
	}
	let size: number;
	try {
		size = JSON.stringify(input).length;
	} catch {
		return { ok: false, error: 'blocks cannot be serialized' };
	}
	if (size > MAX_BLOCKS_BYTES) return { ok: false, error: 'blocks are too large' };
	return { ok: true, value: input };
}

export type EnvelopeCheck =
	| { ok: true; blocks: unknown[]; themeColor: string }
	| { ok: false; reason: 'classic' | 'unsupported_version' | 'invalid'; error?: string };

/** Reads a Mailer blocks_json value: only the axene-blocks envelope is editable here. */
export function readEnvelope(blocksJson: unknown): EnvelopeCheck {
	if (!blocksJson || typeof blocksJson !== 'object' || Array.isArray(blocksJson)) return { ok: false, reason: 'classic' };
	const o = blocksJson as Record<string, unknown>;
	if (o.format !== ENVELOPE_FORMAT) return { ok: false, reason: 'classic' };
	if (o.version !== undefined && o.version !== ENVELOPE_VERSION) return { ok: false, reason: 'unsupported_version' };
	const blocks = validateBlocks(o.blocks);
	if (!blocks.ok) return { ok: false, reason: 'invalid', error: blocks.error };
	return { ok: true, blocks: blocks.value, themeColor: typeof o.themeColor === 'string' ? o.themeColor : themeColorOf(blocks.value) };
}

/** Mailer template ids are UUIDs; accept only a conservative id shape before putting one in a URL. */
export function isValidMailerId(id: unknown): id is string {
	return typeof id === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(id);
}

/** Collapse control characters and whitespace, then trim. */
export function cleanLine(s: string): string {
	return s.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
}
