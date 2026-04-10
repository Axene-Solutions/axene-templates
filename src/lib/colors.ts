/**
 * Theme color resolution.
 *
 * Block props can store:
 *   - A hex like "#1daa82"       -> used as-is
 *   - "theme"                    -> resolves to the current themeColor
 *   - "theme-light"              -> resolves to a lighter tint of themeColor
 *   - "theme-dark"               -> resolves to a darker shade of themeColor
 *   - "transparent"              -> transparent
 */

export function resolveColor(value: string, themeColor: string): string {
	if (!value) return themeColor;
	if (value === 'theme') return themeColor;
	if (value === 'theme-light') return lighten(themeColor, 0.85);
	if (value === 'theme-dark') return darken(themeColor, 0.3);
	return value;
}

/** Mix a hex color toward white by `amount` (0 = original, 1 = white). */
export function lighten(hex: string, amount: number): string {
	const [r, g, b] = hexToRgb(hex);
	return rgbToHex(
		Math.round(r + (255 - r) * amount),
		Math.round(g + (255 - g) * amount),
		Math.round(b + (255 - b) * amount),
	);
}

/** Mix a hex color toward black by `amount` (0 = original, 1 = black). */
export function darken(hex: string, amount: number): string {
	const [r, g, b] = hexToRgb(hex);
	return rgbToHex(
		Math.round(r * (1 - amount)),
		Math.round(g * (1 - amount)),
		Math.round(b * (1 - amount)),
	);
}

function hexToRgb(hex: string): [number, number, number] {
	const h = hex.replace('#', '');
	const full = h.length === 3
		? h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
		: h;
	return [
		parseInt(full.slice(0, 2), 16),
		parseInt(full.slice(2, 4), 16),
		parseInt(full.slice(4, 6), 16),
	];
}

function rgbToHex(r: number, g: number, b: number): string {
	return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

/** Check if a value is a theme-relative token. */
export function isThemeToken(value: string): boolean {
	return value === 'theme' || value === 'theme-light' || value === 'theme-dark';
}
