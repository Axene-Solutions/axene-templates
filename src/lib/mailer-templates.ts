// Pure logic shared by the browser and the server for Save to Mailer / From Mailer.
// No SvelteKit or Node imports, so it can be unit tested directly.

import { collectUsage, parseTag } from './placeholders';
import { cleanSettings, legacySettings, type TemplateSettings } from './template-settings';

export const ENVELOPE_FORMAT = 'axene-blocks';
export const ENVELOPE_VERSION = 1;
export const DEFAULT_THEME_COLOR = '#1daa82';

export const MAX_SUBJECT_MAILER = 998;
export const MAX_TEMPLATE_NAME = 120;

export interface BlocksEnvelope {
	format: typeof ENVELOPE_FORMAT;
	version: typeof ENVELOPE_VERSION;
	blocks: unknown[];
	themeColor: string;
	/**
	 * Template level settings (width, font, container look). Optional: Mailer stores blocks_json
	 * as an opaque JSON object, so the extra key round-trips; older envelopes have none.
	 */
	settings?: TemplateSettings;
}

/** Same rule as the editor store: the header block's accent color drives the theme. */
export function themeColorOf(blocks: unknown[]): string {
	const header = blocks.find((b) => b && typeof b === 'object' && (b as any).type === 'header') as any;
	const c = header?.props?.accentColor;
	return typeof c === 'string' && c ? c : DEFAULT_THEME_COLOR;
}

/** The blocks_json object Mailer stores for a template made in this editor. */
export function buildEnvelope(blocks: unknown[], themeColor?: string, settings?: TemplateSettings | null): BlocksEnvelope {
	const env: BlocksEnvelope = {
		format: ENVELOPE_FORMAT,
		version: ENVELOPE_VERSION,
		blocks,
		themeColor: settings?.color || themeColor || themeColorOf(blocks),
	};
	if (settings) env.settings = settings;
	return env;
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

export type EnvelopeCheck =
	| { ok: true; blocks: unknown[]; themeColor: string; settings: TemplateSettings | null }
	| { ok: false; reason: 'classic' | 'unsupported_version' | 'invalid'; error?: string };

/**
 * Reads a Mailer blocks_json value: only the axene-blocks envelope is editable here. The blocks
 * go through `sanitize` (the server allowlist, src/lib/server/sanitize-blocks.ts), which returns
 * clean blocks or throws with a short reason. This module stays free of server imports.
 */
export function readEnvelope(blocksJson: unknown, sanitize: (blocks: unknown) => unknown[]): EnvelopeCheck {
	if (!blocksJson || typeof blocksJson !== 'object' || Array.isArray(blocksJson)) return { ok: false, reason: 'classic' };
	const o = blocksJson as Record<string, unknown>;
	if (o.format !== ENVELOPE_FORMAT) return { ok: false, reason: 'classic' };
	if (o.version !== undefined && o.version !== ENVELOPE_VERSION) return { ok: false, reason: 'unsupported_version' };
	let blocks: unknown[];
	try {
		blocks = sanitize(o.blocks);
	} catch (e) {
		return { ok: false, reason: 'invalid', error: e instanceof Error ? e.message : 'invalid blocks' };
	}
	const theme = typeof o.themeColor === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(o.themeColor) ? o.themeColor : themeColorOf(blocks);
	const settings = o.settings && typeof o.settings === 'object' && !Array.isArray(o.settings) ? cleanSettings(o.settings, legacySettings(theme)) : null;
	return { ok: true, blocks, themeColor: theme, settings };
}

/** Mailer template ids are UUIDs; accept only a conservative id shape before putting one in a URL. */
export function isValidMailerId(id: unknown): id is string {
	return typeof id === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(id);
}

/** Collapse control characters and whitespace, then trim. */
export function cleanLine(s: string): string {
	return s.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
}
