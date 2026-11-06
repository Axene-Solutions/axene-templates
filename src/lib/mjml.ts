/**
 * Serialize blocks to MJML markup.
 * This runs on the client to produce the MJML string,
 * which is then sent to the server for compilation to HTML.
 * The server renders Send and Save to Mailer through the same function.
 */

import type { Block } from './blocks';
import { resolveColor } from './colors';
import {
	cleanSettings,
	cornerPx,
	fontCss,
	hexOk,
	inkFor,
	legacySettings,
	SHADOWS,
	textOn,
	webFontHref,
	type TemplateSettings,
} from './template-settings';

// Theme color extracted from blocks at serialization time
let _theme = '#1daa82';
let _font = "'Inter', Arial, sans-serif";

/** Every colour sink goes through this, so theme tokens never reach the output as words. */
function rc(val: string): string {
	return resolveColor(val, _theme);
}

/** A text colour on a fill: 'auto' and too light colours become readable ink. */
function ink(fill: string, chosen: string): string {
	if (fill) return textOn(fill, chosen === 'auto' ? 'auto' : rc(chosen));
	return chosen === 'auto' ? '#101010' : rc(chosen);
}

const HEX_THEME = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

function esc(s: string): string {
	// Also used inside attribute values (alt), so quotes are escaped too.
	return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function pad(b: Block): string {
	const t = b.props.paddingTop ?? 0;
	const r = b.props.paddingRight ?? 0;
	const bo = b.props.paddingBottom ?? 0;
	const l = b.props.paddingLeft ?? 0;
	return `${t}px ${r}px ${bo}px ${l}px`;
}

/** The block's box fill as a colour, or '' when it has none. */
function fillOf(b: Block): string {
	const v = b.props.backgroundColor;
	return v && v !== 'transparent' ? rc(v) : '';
}

interface Pos {
	first: boolean;
	last: boolean;
	cpx: number;
}

/**
 * Extra mj-section attributes for the block box: fill, border and corner radius. The first and
 * last block round at least as much as the container, so a fill never pokes out of its corners.
 * Empty for a block that has none of them (the output is then exactly as before).
 */
function boxAttrs(b: Block, pos: Pos, fill = fillOf(b)): string {
	const p = b.props;
	let out = '';
	if (fill) out += ` background-color="${fill}"`;
	if (p.borderStyle && p.borderStyle !== 'none') out += ` border="1px ${p.borderStyle} ${rc(p.borderColor || '#d1d5db')}"`;
	const rad = Number(p.blockRadius) || 0;
	const top = pos.first ? Math.max(rad, pos.cpx) : rad;
	const bottom = pos.last ? Math.max(rad, pos.cpx) : rad;
	if ((fill || out) && (top || bottom)) out += ` border-radius="${top}px ${top}px ${bottom}px ${bottom}px"`;
	return out;
}

function lh(v: unknown, fallback = '1.6'): string {
	return v === undefined || v === null || v === '' ? fallback : String(v);
}

function blockToMjml(block: Block, pos: Pos): string {
	const p = block.props;

	switch (block.type) {
		case 'header': {
			const layout = p.layout ?? 'logo-left';
			const fill = p.backgroundColor === 'transparent' ? '' : rc(p.backgroundColor);
			const sec = boxAttrs(block, pos, fill);
			const color = ink(fill || '#ffffff', p.color ?? 'auto');
			const weight = p.fontWeight ?? '700';
			const tagline = p.tagline
				? `<div style="font-size:12px;color:${color};opacity:0.75;margin-top:3px">${esc(p.tagline)}</div>`
				: '';
			const nameBlock = `<div style="font-size:${p.fontSize}px;font-weight:${weight === 'bold' ? 700 : weight};color:${color};font-family:${_font.replace(/"/g, "'")}">${esc(p.companyName)}</div>${tagline}`;
			const logoWidth = p.logoWidth || 40;
			// An empty logo URL means the Axene logo, as the editor shows it.
			const logoUrl = String(p.logoUrl ?? '').trim() || 'https://mail.axene.io/email-assets/logo.png';

			if (layout === 'logo-only') {
				return `<mj-section padding="${pad(block)}"${sec}><mj-column><mj-image padding="0" src="${logoUrl}" width="${logoWidth}px" align="center" /></mj-column></mj-section>`;
			}

			if (layout === 'text-only') {
				return `<mj-section padding="${pad(block)}"${sec}><mj-column><mj-text padding="0" align="${p.align}">${nameBlock}</mj-text></mj-column></mj-section>`;
			}

			if (layout === 'logo-center') {
				const logoTag = `<img src="${logoUrl}" width="${logoWidth}" style="display:inline-block;margin-bottom:8px;" /><br/>`;
				return `<mj-section padding="${pad(block)}"${sec}><mj-column><mj-text padding="0" align="center">${logoTag}${nameBlock}</mj-text></mj-column></mj-section>`;
			}

			const logoCol = `<mj-column width="${logoWidth + 20}px" vertical-align="middle"><mj-image padding="0" src="${logoUrl}" width="${logoWidth}px" align="center" /></mj-column>`;
			if (layout === 'logo-left') {
				return `<mj-section padding="${pad(block)}"${sec}>${logoCol}<mj-column vertical-align="middle"><mj-text padding="0" align="${p.align === 'right' ? 'right' : 'left'}">${nameBlock}</mj-text></mj-column></mj-section>`;
			}

			// logo-right
			return `<mj-section padding="${pad(block)}"${sec}><mj-column vertical-align="middle"><mj-text padding="0" align="right">${nameBlock}</mj-text></mj-column>${logoCol}</mj-section>`;
		}

		case 'heading':
		case 'subheading':
		case 'content': {
			const fill = fillOf(block);
			const spacing = block.type === 'heading' ? ' letter-spacing="-0.015em"' : '';
			const line = block.type === 'heading' && (p.lineHeight === undefined || p.lineHeight === null) ? '' : ` line-height="${lh(p.lineHeight)}"`;
			return `<mj-section padding="0"${boxAttrs(block, pos)}><mj-column><mj-text padding="${pad(block)}" font-size="${p.fontSize}px" font-weight="${p.fontWeight || 'normal'}" color="${ink(fill, p.color)}" align="${p.align}"${line}${spacing}>${p.text}</mj-text></mj-column></mj-section>`;
		}

		case 'image': {
			const h = Number(p.imageHeight) || 0;
			const r = Number(p.borderRadius) || 0;
			return `<mj-section padding="0"${boxAttrs(block, pos)}><mj-column><mj-image padding="${pad(block)}" src="${p.src}" alt="${esc(p.alt)}" width="${p.width}px"${h > 0 ? ` height="${h}px"` : ''}${r > 0 ? ` border-radius="${r}px"` : ''} align="${p.align || 'center'}"${p.href ? ` href="${p.href}"` : ''} /></mj-column></mj-section>`;
		}

		case 'button': {
			const widthAttr = p.width === -1 ? ' width="100%"' : p.width > 0 ? ` width="${p.width}px"` : '';
			const bf = rc(p.backgroundColor);
			const color = hexOk(bf) ? textOn(bf, p.color === 'auto' ? 'auto' : rc(p.color)) : ink('', p.color);
			return `<mj-section padding="0"${boxAttrs(block, pos, '')}><mj-column><mj-button padding="${pad(block)}" inner-padding="${p.innerPadding}" background-color="${bf}" color="${color}" font-size="${p.fontSize}px" font-weight="${p.fontWeight}" border-radius="${p.borderRadius}px" align="${p.align}" href="${p.href}"${widthAttr}>${p.text}</mj-button></mj-column></mj-section>`;
		}

		case 'list': {
			const fill = fillOf(block);
			const color = ink(fill, p.color);
			const size = Number(p.fontSize) || 14;
			const line = Number(p.lineHeight) || 1.6;
			const dotTop = Math.max(0, Math.round((size * line) / 2 - 3));
			const rows = (Array.isArray(p.items) ? (p.items as string[]) : [])
				.map(
					(item) =>
						`<tr><td valign="top" style="width:16px;padding:${dotTop}px 0 6px 0"><div style="width:6px;height:6px;border-radius:1px;background:${rc(p.bulletColor)};font-size:1px;line-height:1px">&nbsp;</div></td><td valign="top" style="padding:0 0 6px 0;color:${color};font-size:${size}px;line-height:${line};text-align:${p.align || 'left'}">${item}</td></tr>`,
				)
				.join('');
			return `<mj-section padding="0"${boxAttrs(block, pos)}><mj-column><mj-text padding="${pad(block)}" font-size="${size}px" color="${color}"><table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">${rows}</table></mj-text></mj-column></mj-section>`;
		}

		case 'table': {
			const fill = fillOf(block);
			const headColor = p.headerColor === 'auto' || !p.headerColor ? textOn(rc(p.headerBg), 'auto') : rc(p.headerColor);
			const cellColor = ink(fill, p.cellColor);
			const align = p.align || 'left';
			let tableHtml = '<table style="width:100%;border-collapse:collapse;" cellpadding="0" cellspacing="0">';
			if (p.headerRow) {
				tableHtml += `<tr><td style="background:${rc(p.headerBg)};color:${headColor};padding:10px 14px;border:1px solid ${rc(p.borderColor)};font-weight:600;font-size:${p.fontSize}px;text-align:${align};">${esc(p.col1Header)}</td><td style="background:${rc(p.headerBg)};color:${headColor};padding:10px 14px;border:1px solid ${rc(p.borderColor)};font-weight:600;font-size:${p.fontSize}px;text-align:${align};">${esc(p.col2Header)}</td></tr>`;
			}
			for (const row of Array.isArray(p.rows) ? p.rows : []) {
				tableHtml += `<tr><td style="padding:10px 14px;color:${cellColor};border:1px solid ${rc(p.borderColor)};font-size:${p.fontSize}px;text-align:${align};">${row.col1}</td><td style="padding:10px 14px;color:${cellColor};border:1px solid ${rc(p.borderColor)};font-size:${p.fontSize}px;text-align:${align};">${row.col2}</td></tr>`;
			}
			tableHtml += '</table>';
			const box = (fill ? ` background-color="${fill}"` : '') + (Number(p.blockRadius) && fill ? ` border-radius="${p.blockRadius}px"` : '');
			return `<mj-section padding="0"${box}><mj-column><mj-table padding="${pad(block)}">${tableHtml}</mj-table></mj-column></mj-section>`;
		}

		case 'section': {
			const fill = p.backgroundColor === 'transparent' ? '' : rc(p.backgroundColor);
			if (!String(p.text ?? '').trim()) {
				// No text: the spacer section from before sections had content.
				const bg = fill ? ` background-color="${fill}"` : '';
				return `<mj-section padding="${pad(block)}"${bg}><mj-column><mj-text font-size="1px" padding="0" color="transparent">&#8203;</mj-text></mj-column></mj-section>`;
			}
			const border = p.borderStyle && p.borderStyle !== 'none' ? ` border="1px ${p.borderStyle} ${rc(p.borderColor || '#d1d5db')}"` : '';
			const r = Number(p.borderRadius) || 0;
			return `<mj-section padding="8px 24px"><mj-column padding="${pad(block)}"${fill ? ` background-color="${fill}"` : ''}${border}${r ? ` border-radius="${r}px"` : ''}><mj-text padding="0" font-size="${p.fontSize}px" color="${ink(fill, p.color)}" align="${p.align || 'left'}" line-height="${lh(p.lineHeight)}">${p.text}</mj-text></mj-column></mj-section>`;
		}

		case 'footer': {
			const fill = fillOf(block);
			const color = ink(fill, p.color);
			const linkColor = ink(fill, p.linkColor || 'theme-dark');
			let footerContent = '';
			if (p.companyName) footerContent += `<p style="font-weight:600;margin:0 0 4px;font-size:${Number(p.fontSize) + 1}px">${esc(p.companyName)}</p>`;
			if (p.companyAddress) footerContent += `<p style="margin:0 0 10px">${esc(p.companyAddress)}</p>`;
			footerContent += `<p style="margin:0 0 12px;line-height:1.6">${p.text}</p>`;
			const linkParts: string[] = [];
			for (const link of Array.isArray(p.links) ? p.links : []) {
				linkParts.push(`<a href="${link.url}" style="color:${linkColor};text-decoration:underline">${esc(link.label)}</a>`);
			}
			if (p.unsubUrl) {
				linkParts.push(`<a href="${p.unsubUrl}" style="color:${linkColor};text-decoration:underline">${esc(p.unsubText || 'Unsubscribe')}</a>`);
			}
			if (linkParts.length) footerContent += `<p style="margin:8px 0 0">${linkParts.join(' <span style="color:#d1d5db">&nbsp;|&nbsp;</span> ')}</p>`;
			const divider = p.showDivider ? '<p style="border-top:1px solid #e5e7eb;margin:0 0 16px;font-size:1px;line-height:1px">&nbsp;</p>' : '';
			return `<mj-section padding="0"${boxAttrs(block, pos)}><mj-column><mj-text padding="${pad(block)}" font-size="${p.fontSize}px" color="${color}" align="${p.align}">${divider}${footerContent}</mj-text></mj-column></mj-section>`;
		}

		default:
			return '';
	}
}

/** The theme colour the blocks imply (the header's accent, else its fill), for templates without settings. */
export function themeFromBlocks(blocks: Block[]): string {
	const headerBlock = blocks.find(b => b.type === 'header');
	const accent = headerBlock?.props.accentColor;
	const headerBg = headerBlock?.props.backgroundColor;
	return HEX_THEME.test(accent ?? '') ? accent : HEX_THEME.test(headerBg ?? '') ? headerBg : '#1daa82';
}

/**
 * Blocks plus the template settings to MJML. Without settings the output looks exactly like it
 * did before settings existed. `bodyBg` is kept for callers that pass a page colour directly.
 */
export function blocksToMjml(blocks: Block[], settingsOrBg?: Partial<TemplateSettings> | string | null): string {
	const derived = themeFromBlocks(blocks);
	const raw = typeof settingsOrBg === 'object' && settingsOrBg ? settingsOrBg : null;
	const s = cleanSettings(raw, legacySettings(derived));
	if (!raw) s.color = derived;
	if (typeof settingsOrBg === 'string') s.pageBg = settingsOrBg;
	_theme = s.color;
	_font = fontCss(s.font);
	const cpx = cornerPx(s);
	const inner = blocks.map((b, i) => blockToMjml(b, { first: i === 0, last: i === blocks.length - 1, cpx })).join('\n');
	const href = webFontHref(s.font);
	const font = href ? `\n    <mj-font name="${s.font}" href="${href}" />` : '';
	const pageBg = s.pageBg || '#f5f5f5';
	const border = s.bStyle !== 'none' ? ` border="${s.bWidth}px ${s.bStyle} ${s.bColor}"` : '';
	const styled = cpx > 0 || s.shadow !== 'none' || border || s.pad > 0 || s.bg !== '#ffffff';
	const shadowCss = s.shadow !== 'none' ? `box-shadow:${SHADOWS[s.shadow]};` : '';
	const style = styled ? `\n    <mj-style>.axn-email{${shadowCss}${cpx ? `border-radius:${cpx}px;overflow:hidden;` : ''}}</mj-style>` : '';
	const body = styled
		? `  <mj-wrapper css-class="axn-email" padding="${s.pad}px" background-color="${s.bg}"${border}${cpx ? ` border-radius="${cpx}px"` : ''}>\n${inner}\n  </mj-wrapper>`
		: inner;
	const linkInk = inkFor(s.bg) === '#101010' ? '#0fa974' : '#7ce0bd';
	return `<mjml>
  <mj-head>${font}
    <mj-attributes>
      <mj-all font-family="${_font.replace(/"/g, "'")}" />
      <mj-text font-size="14px" color="${s.textColor}" line-height="1.6" />
    </mj-attributes>
    <mj-style>
      a { color: ${linkInk}; text-decoration: underline; }
    </mj-style>${style}
  </mj-head>
  <mj-body background-color="${pageBg}" width="${s.width}px">
${body}
  </mj-body>
</mjml>`;
}
