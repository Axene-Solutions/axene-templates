// Style strings for one block on the canvas, ported from Editor.dc.html renderVals (canvas part).
// Prop names are the stored ones: paddingTop/Right/Bottom/Left (design padT...), borderRadius
// (design radius), imageHeight (design imgH).

import type { Block } from '$lib/blocks';
import { resolveColor } from '$lib/colors';
import { inkFor, textOn } from '$lib/template-settings';

export interface BlockCtx {
	theme: string;
	/** Container radius in px. */
	cpx: number;
	first: boolean;
	last: boolean;
}

export interface BlockView {
	box: string;
	/** Text style (heading, subheading, content, section). */
	txt: string;
	/** Readable colour for the block's text. */
	col: (chosen: string) => string;
	fill: string;
}

export function blockView(b: Block, c: BlockCtx): BlockView {
	const p = b.props;
	const rc = (v: string) => resolveColor(v, c.theme);
	const fill = p.backgroundColor && p.backgroundColor !== 'transparent' && b.type !== 'button' ? rc(p.backgroundColor) : '';
	const rad = Number(p.blockRadius) || 0;
	const top = c.first ? Math.max(rad, c.cpx) : rad;
	const bottom = c.last ? Math.max(rad, c.cpx) : rad;
	let corner = 'border-radius:' + top + 'px ' + top + 'px ' + bottom + 'px ' + bottom + 'px;';
	const border = p.borderStyle && p.borderStyle !== 'none' && b.type !== 'table' ? 'border:1px ' + p.borderStyle + ' ' + rc(p.borderColor || '#d1d5db') + ';' : '';
	if (b.type === 'section') corner = 'border-radius:' + (Number(p.borderRadius) || 0) + 'px;';
	let box =
		'display:block;box-sizing:border-box;padding:' + (p.paddingTop ?? 0) + 'px ' + (p.paddingRight ?? 0) + 'px ' + (p.paddingBottom ?? 0) + 'px ' + (p.paddingLeft ?? 0) + 'px;text-align:' + (p.align || 'left') + ';' + corner + border + (fill ? 'background:' + fill + ';' : '');
	if (b.type === 'section') box += 'margin:8px 24px;';
	const col = (chosen: string) => (fill ? textOn(fill, chosen === 'auto' ? 'auto' : rc(chosen)) : chosen === 'auto' ? '#101010' : rc(chosen));
	const txt =
		'display:block;white-space:pre-line;font-size:' + p.fontSize + 'px;font-weight:' + p.fontWeight + ';line-height:' + (p.lineHeight ?? 1.6) + ';color:' + col(p.color ?? '#374151') + ';' + (b.type === 'heading' ? 'letter-spacing:-.015em;' : '');
	return { box, txt, col, fill };
}

export const AX_DARK = '/logos/axene_logo_black_square.webp';
export const AX_YELLOW = '/logos/axene_logo_corrected.webp';

/** The Axene mark that reads on a fill: the dark one on light fills, the yellow one otherwise. */
export function axMarkFor(fill: string): string {
	return inkFor(fill || '#ffffff') === '#101010' ? AX_DARK : AX_YELLOW;
}
