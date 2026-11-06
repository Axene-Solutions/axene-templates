/**
 * Template font families, exactly as the editor design lists them (Editor board, Styles tab,
 * Font family). Each entry has a CSS stack that ends in an email-safe fallback (Arial or
 * Georgia), so a mail app that cannot load the web font still shows something close.
 *
 * Usage:
 *   import { FONTS, fontByName, fontTag, googleFontsUrl } from '$lib/fonts'
 *   const f = fontByName(template.font)          // falls back to the first font
 *   <link rel="stylesheet" href={googleFontsUrl()} />
 */

export type FontGroup = 'Sans serif web fonts' | 'Serif web fonts' | 'Email-safe system fonts';

export interface FontDef {
	/** Display name, also the value stored on the template. */
	name: string;
	/** CSS font-family stack with an email-safe fallback. */
	css: string;
	group: FontGroup;
	/** Google Fonts weights to load. Empty for email-safe system fonts. */
	weights: readonly number[];
}

export const FONT_GROUPS: readonly FontGroup[] = ['Sans serif web fonts', 'Serif web fonts', 'Email-safe system fonts'];

const W4 = [400, 500, 600, 700] as const;

export const FONTS: readonly FontDef[] = [
	{ name: 'Figtree', css: "'Figtree', Arial, sans-serif", group: 'Sans serif web fonts', weights: W4 },
	{ name: 'Manrope', css: "'Manrope', Arial, sans-serif", group: 'Sans serif web fonts', weights: W4 },
	{ name: 'Inter', css: "'Inter', Arial, sans-serif", group: 'Sans serif web fonts', weights: W4 },
	{ name: 'DM Sans', css: "'DM Sans', Arial, sans-serif", group: 'Sans serif web fonts', weights: W4 },
	{ name: 'Plus Jakarta Sans', css: "'Plus Jakarta Sans', Arial, sans-serif", group: 'Sans serif web fonts', weights: W4 },
	{ name: 'Poppins', css: "'Poppins', Arial, sans-serif", group: 'Sans serif web fonts', weights: W4 },
	{ name: 'Montserrat', css: "'Montserrat', Arial, sans-serif", group: 'Sans serif web fonts', weights: W4 },
	{ name: 'Lato', css: "'Lato', Arial, sans-serif", group: 'Sans serif web fonts', weights: [400, 700] },
	{ name: 'Open Sans', css: "'Open Sans', Arial, sans-serif", group: 'Sans serif web fonts', weights: W4 },
	{ name: 'Roboto', css: "'Roboto', Arial, sans-serif", group: 'Sans serif web fonts', weights: [400, 500, 700] },
	{ name: 'Nunito Sans', css: "'Nunito Sans', Arial, sans-serif", group: 'Sans serif web fonts', weights: W4 },
	{ name: 'Work Sans', css: "'Work Sans', Arial, sans-serif", group: 'Sans serif web fonts', weights: W4 },
	{ name: 'Outfit', css: "'Outfit', Arial, sans-serif", group: 'Sans serif web fonts', weights: W4 },
	{ name: 'Playfair Display', css: "'Playfair Display', Georgia, serif", group: 'Serif web fonts', weights: [400, 600, 700] },
	{ name: 'Lora', css: "'Lora', Georgia, serif", group: 'Serif web fonts', weights: [400, 600, 700] },
	{ name: 'Merriweather', css: "'Merriweather', Georgia, serif", group: 'Serif web fonts', weights: [400, 700] },
	{ name: 'Arial', css: 'Arial, Helvetica, sans-serif', group: 'Email-safe system fonts', weights: [] },
	{ name: 'Helvetica', css: 'Helvetica, Arial, sans-serif', group: 'Email-safe system fonts', weights: [] },
	{ name: 'Georgia', css: 'Georgia, serif', group: 'Email-safe system fonts', weights: [] },
	{ name: 'Verdana', css: 'Verdana, sans-serif', group: 'Email-safe system fonts', weights: [] },
	{ name: 'Trebuchet MS', css: "'Trebuchet MS', sans-serif", group: 'Email-safe system fonts', weights: [] },
	{ name: 'Tahoma', css: 'Tahoma, Verdana, sans-serif', group: 'Email-safe system fonts', weights: [] },
];

/** The font with this name, or the first font (Figtree) when the name is unknown, like the design. */
export function fontByName(name: string | null | undefined, fonts: readonly FontDef[] = FONTS): FontDef {
	return fonts.find((f) => f.name === name) ?? fonts[0];
}

/** True for fonts loaded from Google Fonts, false for email-safe system fonts. */
export function isWebFont(f: FontDef): boolean {
	return f.group !== 'Email-safe system fonts';
}

/** The tag chip text shown next to a font: "Web font" or "Email-safe". */
export function fontTag(f: FontDef): 'Web font' | 'Email-safe' {
	return isWebFont(f) ? 'Web font' : 'Email-safe';
}

/** CSS stack for a font name (unknown names use the first font). */
export function fontCss(name: string | null | undefined): string {
	return fontByName(name).css;
}

/**
 * Google Fonts CSS2 URL that loads the given web fonts (all web fonts by default) with the
 * weights the design loads, for example
 * https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap
 * Email-safe fonts are skipped. Returns '' when no web font is in the list.
 */
export function googleFontsUrl(fonts: readonly FontDef[] = FONTS): string {
	const fams = fonts
		.filter((f) => isWebFont(f) && f.weights.length > 0)
		.map((f) => 'family=' + f.name.trim().replace(/\s+/g, '+') + ':wght@' + [...f.weights].sort((a, b) => a - b).join(';'));
	if (!fams.length) return '';
	return 'https://fonts.googleapis.com/css2?' + fams.join('&') + '&display=swap';
}
