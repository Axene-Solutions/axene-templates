/**
 * Static option lists of the redesigned right panel, exactly as the editor design defines them.
 *
 * Usage:
 *   import { HEADER_LAYOUTS, SHADOWS, BORDER_STYLES } from '$lib/panel/constants'
 */

export type HeaderLayout = 'logo-left' | 'logo-center' | 'logo-right' | 'logo-only' | 'text-only';
export const HEADER_LAYOUTS: readonly { value: HeaderLayout; title: string }[] = [
	{ value: 'logo-left', title: 'Logo left' },
	{ value: 'logo-center', title: 'Logo center' },
	{ value: 'logo-right', title: 'Logo right' },
	{ value: 'logo-only', title: 'Logo only' },
	{ value: 'text-only', title: 'Text only' },
];

export type Align = 'left' | 'center' | 'right';
export const ALIGNS: readonly { value: Align; label: string }[] = [
	{ value: 'left', label: 'Align left' },
	{ value: 'center', label: 'Align center' },
	{ value: 'right', label: 'Align right' },
];

export type BorderStyle = 'none' | 'solid' | 'dashed' | 'dotted';
export const BORDER_STYLES: readonly { value: BorderStyle; label: string }[] = [
	{ value: 'none', label: 'None' },
	{ value: 'solid', label: 'Solid' },
	{ value: 'dashed', label: 'Dashed' },
	{ value: 'dotted', label: 'Dotted' },
];

export type ShadowLevel = 'none' | 'soft' | 'medium' | 'strong';
export const SHADOW_OPTIONS: readonly { value: ShadowLevel; label: string }[] = [
	{ value: 'none', label: 'None' },
	{ value: 'soft', label: 'Soft' },
	{ value: 'medium', label: 'Medium' },
	{ value: 'strong', label: 'Strong' },
];
/** box-shadow of the email container per level. */
export const SHADOWS: Readonly<Record<ShadowLevel, string>> = {
	none: 'none',
	soft: '0 10px 36px rgba(20,20,10,.12)',
	medium: '0 18px 50px rgba(20,20,10,.2)',
	strong: '0 28px 80px rgba(20,20,10,.32)',
};

export const WEIGHTS: readonly { value: number; label: string }[] = [
	{ value: 400, label: 'Regular' },
	{ value: 600, label: 'Semibold' },
	{ value: 700, label: 'Bold' },
];

export type CornerStyle = 'square' | 'soft' | 'round';
export const CORNERS: readonly { value: CornerStyle; label: string; px: number }[] = [
	{ value: 'square', label: 'Square', px: 0 },
	{ value: 'soft', label: 'Soft', px: 8 },
	{ value: 'round', label: 'Round', px: 16 },
];

/** Button width modes: 0 is Auto, a positive number is Custom (200 when switched on), -1 is Full. */
export const BUTTON_WIDTHS: readonly { value: 'auto' | 'custom' | 'full'; label: string; width: number }[] = [
	{ value: 'auto', label: 'Auto', width: 0 },
	{ value: 'custom', label: 'Custom', width: 200 },
	{ value: 'full', label: 'Full', width: -1 },
];

export function buttonWidthMode(width: number): 'auto' | 'custom' | 'full' {
	const w = Number(width) || 0;
	return w === -1 ? 'full' : w > 0 ? 'custom' : 'auto';
}

/** Padding of a block, one value per side, in px. */
export interface Sides {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

export const WIDTH_PRESETS: readonly number[] = [480, 600, 720];
export const PAD_PRESETS: readonly number[] = [0, 8, 16, 24, 32];

/** Editor block type names as the panel header shows them. */
export const TYPE_NAME: Readonly<Record<string, string>> = {
	header: 'Header',
	heading: 'Heading',
	subheading: 'Subheading',
	content: 'Content',
	image: 'Image',
	button: 'Button',
	list: 'List',
	table: 'Table',
	section: 'Section',
	footer: 'Footer',
};
