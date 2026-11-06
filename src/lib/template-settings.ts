// Template level settings (the Email container in the editor) and the colour helpers the
// canvas and the MJML output share. Pure, no SvelteKit or Node imports: used by the browser,
// the server sanitiser and the renderer, and unit tested directly.
//
// Key names follow the design's `tpl` object so the right panel ports one to one.

export type Corners = 'square' | 'soft' | 'round' | 'custom';
export type BorderStyle = 'none' | 'solid' | 'dashed' | 'dotted';
export type Shadow = 'none' | 'soft' | 'medium' | 'strong';

export interface TemplateSettings {
	/** Theme colour: buttons, header fill, bullets. Kept equal to the header's accentColor. */
	color: string;
	/** A label from FONTS. */
	font: string;
	/** Email width in px, 320 to 800. */
	width: number;
	corners: Corners;
	/** Container corner radius in px, 0 to 32. */
	radius: number;
	/** Container background. */
	bg: string;
	/** Page background around the email. Empty means the default (#f5f5f5 in the email). */
	pageBg: string;
	bStyle: BorderStyle;
	/** Container border width in px, 1 to 8. */
	bWidth: number;
	bColor: string;
	shadow: Shadow;
	/** Inner padding of the container in px, 0 to 48. */
	pad: number;
	/** Base text colour. */
	textColor: string;
}

export const DEFAULT_THEME = '#1daa82';

/** Fonts the editor offers: [label, CSS stack, group]. */
export const FONTS: readonly (readonly [string, string, string])[] = [
	['Figtree', "'Figtree', Arial, sans-serif", 'Sans serif web fonts'],
	['Manrope', "'Manrope', Arial, sans-serif", 'Sans serif web fonts'],
	['Inter', "'Inter', Arial, sans-serif", 'Sans serif web fonts'],
	['DM Sans', "'DM Sans', Arial, sans-serif", 'Sans serif web fonts'],
	['Plus Jakarta Sans', "'Plus Jakarta Sans', Arial, sans-serif", 'Sans serif web fonts'],
	['Poppins', "'Poppins', Arial, sans-serif", 'Sans serif web fonts'],
	['Montserrat', "'Montserrat', Arial, sans-serif", 'Sans serif web fonts'],
	['Lato', "'Lato', Arial, sans-serif", 'Sans serif web fonts'],
	['Open Sans', "'Open Sans', Arial, sans-serif", 'Sans serif web fonts'],
	['Roboto', "'Roboto', Arial, sans-serif", 'Sans serif web fonts'],
	['Nunito Sans', "'Nunito Sans', Arial, sans-serif", 'Sans serif web fonts'],
	['Work Sans', "'Work Sans', Arial, sans-serif", 'Sans serif web fonts'],
	['Outfit', "'Outfit', Arial, sans-serif", 'Sans serif web fonts'],
	['Playfair Display', "'Playfair Display', Georgia, serif", 'Serif web fonts'],
	['Lora', "'Lora', Georgia, serif", 'Serif web fonts'],
	['Merriweather', "'Merriweather', Georgia, serif", 'Serif web fonts'],
	['Arial', 'Arial, Helvetica, sans-serif', 'Email-safe system fonts'],
	['Helvetica', 'Helvetica, Arial, sans-serif', 'Email-safe system fonts'],
	['Georgia', 'Georgia, serif', 'Email-safe system fonts'],
	['Verdana', 'Verdana, sans-serif', 'Email-safe system fonts'],
	['Trebuchet MS', "'Trebuchet MS', sans-serif", 'Email-safe system fonts'],
	['Tahoma', 'Tahoma, Verdana, sans-serif', 'Email-safe system fonts'],
];

/** Google Fonts weights loaded for each web font, by label. System fonts have none. */
export const WEB_FONT_WEIGHTS: Record<string, string> = {
	Figtree: '400;500;600;700',
	Manrope: '400;500;600;700',
	Inter: '400;500;600;700',
	'DM Sans': '400;500;600;700',
	'Plus Jakarta Sans': '400;500;600;700',
	Poppins: '400;500;600;700',
	Montserrat: '400;500;600;700',
	Lato: '400;700',
	'Open Sans': '400;500;600;700',
	Roboto: '400;500;700',
	'Nunito Sans': '400;500;600;700',
	'Work Sans': '400;500;600;700',
	Outfit: '400;500;600;700',
	'Playfair Display': '400;600;700',
	Lora: '400;600;700',
	Merriweather: '400;700',
};

/** The Google Fonts stylesheet for one web font, or null for a system font. */
export function webFontHref(label: string): string | null {
	const w = WEB_FONT_WEIGHTS[label];
	return w ? `https://fonts.googleapis.com/css2?family=${label.replace(/ /g, '+')}:wght@${w}&display=swap` : null;
}

/** One stylesheet for every web font the editor offers (the editor route loads it). */
export function allWebFontsHref(): string {
	const fam = Object.entries(WEB_FONT_WEIGHTS)
		.map(([label, w]) => `family=${label.replace(/ /g, '+')}:wght@${w}`)
		.join('&');
	return `https://fonts.googleapis.com/css2?${fam}&family=JetBrains+Mono:wght@400;500&display=swap`;
}

export function fontCss(label: string): string {
	return (FONTS.find((f) => f[0] === label) ?? FONTS[0])[1];
}

export const SHADOWS: Record<Shadow, string> = {
	none: 'none',
	soft: '0 10px 36px rgba(20,20,10,.12)',
	medium: '0 18px 50px rgba(20,20,10,.2)',
	strong: '0 28px 80px rgba(20,20,10,.32)',
};

export const CORNER_PX: Record<Exclude<Corners, 'custom'>, number> = { square: 0, soft: 8, round: 16 };

/** The container radius in px. */
export function cornerPx(s: Pick<TemplateSettings, 'radius' | 'corners'>): number {
	if (typeof s.radius === 'number') return s.radius;
	return s.corners === 'custom' ? 0 : CORNER_PX[s.corners] ?? 0;
}

/**
 * What a template without stored settings looks like: exactly the output from before settings
 * existed (Inter, 600 px, square corners, no border or shadow, #f5f5f5 page).
 */
export function legacySettings(themeColor = DEFAULT_THEME): TemplateSettings {
	return {
		color: themeColor,
		font: 'Inter',
		width: 600,
		corners: 'square',
		radius: 0,
		bg: '#ffffff',
		pageBg: '',
		bStyle: 'none',
		bWidth: 1,
		bColor: '#e5e7eb',
		shadow: 'none',
		pad: 0,
		textColor: '#374151',
	};
}

/** Settings for a brand new template (the design's starting point). */
export function newTemplateSettings(): TemplateSettings {
	return { ...legacySettings(DEFAULT_THEME), font: 'Arial', corners: 'soft', radius: 8, shadow: 'soft' };
}

const HEX6 = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const COLOR_RE = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$|^transparent$/i;

function pickNum(v: unknown, min: number, max: number, fallback: number): number {
	const n = typeof v === 'number' ? v : typeof v === 'string' && /^-?\d{1,4}(?:\.\d{1,2})?$/.test(v.trim()) ? Number(v) : NaN;
	if (!Number.isFinite(n)) return fallback;
	return Math.min(max, Math.max(min, Math.round(n)));
}
function pickColor(v: unknown, fallback: string, allowEmpty = false): string {
	if (allowEmpty && v === '') return '';
	return typeof v === 'string' && v.length <= 9 && COLOR_RE.test(v) ? v.toLowerCase() : fallback;
}
function pickEnum<T extends string>(v: unknown, values: readonly T[], fallback: T): T {
	return typeof v === 'string' && (values as readonly string[]).includes(v) ? (v as T) : fallback;
}

/**
 * The stored or received settings as a complete, safe object. Never throws: unknown keys are
 * dropped, bad values take the fallback's value. `fallback` is what an absent template has
 * (legacySettings with the header's theme colour).
 */
export function cleanSettings(input: unknown, fallback: TemplateSettings = legacySettings()): TemplateSettings {
	const o = input && typeof input === 'object' && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
	const color = typeof o.color === 'string' && HEX6.test(o.color) ? o.color.toLowerCase() : fallback.color;
	const corners = pickEnum<Corners>(o.corners, ['square', 'soft', 'round', 'custom'], fallback.corners);
	const radius = pickNum(o.radius, 0, 32, Object.hasOwn(o, 'corners') && corners !== 'custom' ? CORNER_PX[corners] : fallback.radius);
	return {
		color,
		font: typeof o.font === 'string' && FONTS.some((f) => f[0] === o.font) ? o.font : fallback.font,
		width: pickNum(o.width, 320, 800, fallback.width),
		corners,
		radius,
		bg: pickColor(o.bg, fallback.bg),
		pageBg: pickColor(o.pageBg, fallback.pageBg, true),
		bStyle: pickEnum<BorderStyle>(o.bStyle, ['none', 'solid', 'dashed', 'dotted'], fallback.bStyle),
		bWidth: pickNum(o.bWidth, 1, 8, fallback.bWidth),
		bColor: pickColor(o.bColor, fallback.bColor),
		shadow: pickEnum<Shadow>(o.shadow, ['none', 'soft', 'medium', 'strong'], fallback.shadow),
		pad: pickNum(o.pad, 0, 48, fallback.pad),
		textColor: pickColor(o.textColor, fallback.textColor),
	};
}

// ---- Ink: readable text on a fill ----

export const hexOk = (v: unknown): v is string => typeof v === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v);

function rgb(hex: string): [number, number, number] {
	let h = hex.replace('#', '');
	if (h.length === 3) h = h.split('').map((c) => c + c).join('');
	return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function lum(hex: string): number {
	if (!hexOk(hex)) return 1;
	const c = rgb(hex).map((v) => {
		v /= 255;
		return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
	});
	return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function isYellowish(hex: string): boolean {
	if (!hexOk(hex)) return false;
	const [r, g, b] = rgb(hex).map((v) => v / 255);
	const mx = Math.max(r, g, b);
	const mn = Math.min(r, g, b);
	const l = (mx + mn) / 2;
	const d = mx - mn;
	if (d < 0.0001) return false;
	const s = d / (1 - Math.abs(2 * l - 1));
	let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
	h = (h * 60 + 360) % 360;
	return h >= 35 && h <= 65 && s > 0.45 && l > 0.25;
}

/** Dark ink on light or yellow fills, white on everything else. */
export function inkFor(hex: string): string {
	return !hexOk(hex) || lum(hex) > 0.45 || isYellowish(hex) ? '#101010' : '#ffffff';
}

/** Label colour on a chosen fill: never light text on a light or yellow fill. */
export function textOn(bg: string, chosen: string | undefined): string {
	const ink = inkFor(bg);
	if (!chosen || chosen === 'auto') return ink;
	if (ink === '#101010' && hexOk(chosen) && lum(chosen) > 0.45) return '#101010';
	return chosen;
}
