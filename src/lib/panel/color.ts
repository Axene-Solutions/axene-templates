/**
 * Swatch palette and hex input rules for ColorGrid.svelte, from the editor design (PAL,
 * PAL_NAMES, hexOk, colorRow.onHex). Tested in tests/panel-color.test.ts.
 *
 * Usage:
 *   const r = readHexDraft(input.value)   // { draft: 'ff0', hex: '#ff0' } or hex null while incomplete
 */

export interface Swatch {
	name: string;
	hex: string;
}

export const PALETTE: readonly Swatch[] = [
	{ name: 'Green', hex: '#1daa82' },
	{ name: 'Violet', hex: '#8b5cf6' },
	{ name: 'Pink', hex: '#ec4899' },
	{ name: 'Red', hex: '#ef4444' },
	{ name: 'Orange', hex: '#f97316' },
	{ name: 'Yellow', hex: '#eab308' },
	{ name: 'Lime', hex: '#22c55e' },
	{ name: 'Teal', hex: '#14b8a6' },
	{ name: 'Navy', hex: '#1e293b' },
	{ name: 'Slate', hex: '#374151' },
	{ name: 'Grey', hex: '#6b7280' },
	{ name: 'Silver', hex: '#9ca3af' },
	{ name: 'Mist', hex: '#d1d5db' },
	{ name: 'White', hex: '#ffffff' },
];

/** A full CSS hex color with the hash: #abc or #aabbcc. */
export function hexOk(v: unknown): v is string {
	return typeof v === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v);
}

/** The current color as the grid compares it: lowercase hex, or '' for anything else (transparent, theme). */
export function currentHex(v: unknown): string {
	return hexOk(v) ? v.toLowerCase() : '';
}

/**
 * What the hex input holds after typing: the draft text (hash removed, at most 6 characters)
 * and the color to apply, which is set only for a complete 3 or 6 digit hex.
 */
export function readHexDraft(raw: string): { draft: string; hex: string | null } {
	const draft = raw.replace('#', '').slice(0, 6);
	return { draft, hex: /^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(draft) ? '#' + draft.toLowerCase() : null };
}
