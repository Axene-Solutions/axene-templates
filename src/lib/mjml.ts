/**
 * Serialize blocks to MJML markup.
 * This runs on the client to produce the MJML string,
 * which is then sent to the server for compilation to HTML.
 */

import type { Block } from './blocks';

function esc(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function pad(b: Block): string {
	const t = b.props.paddingTop ?? 0;
	const r = b.props.paddingRight ?? 0;
	const bo = b.props.paddingBottom ?? 0;
	const l = b.props.paddingLeft ?? 0;
	return `${t}px ${r}px ${bo}px ${l}px`;
}

function blockToMjml(block: Block): string {
	const p = block.props;

	switch (block.type) {
		case 'header': {
			const logoHtml = p.logoUrl ? `<img src="${p.logoUrl}" width="${p.logoWidth || 40}" style="display:inline-block;vertical-align:middle;margin-right:12px" />` : '';
			const taglineHtml = p.tagline ? `<br/><span style="font-size:12px;color:rgba(255,255,255,0.7)">${esc(p.tagline)}</span>` : '';
			return `<mj-section padding="${pad(block)}" background-color="${p.backgroundColor}"><mj-column><mj-text padding="0" align="${p.align}" font-family="Inter, Arial, sans-serif">${logoHtml}<span style="font-size:${p.fontSize}px;font-weight:700;color:${p.color}">${esc(p.companyName)}</span>${taglineHtml}</mj-text></mj-column></mj-section>`;
		}

		case 'heading':
			return `<mj-section padding="0"><mj-column><mj-text padding="${pad(block)}" font-size="${p.fontSize}px" font-weight="${p.fontWeight}" color="${p.color}" align="${p.align}" font-family="Inter, Arial, sans-serif">${p.text}</mj-text></mj-column></mj-section>`;

		case 'subheading':
			return `<mj-section padding="0"><mj-column><mj-text padding="${pad(block)}" font-size="${p.fontSize}px" font-weight="${p.fontWeight}" color="${p.color}" align="${p.align}" line-height="${p.lineHeight}" font-family="Inter, Arial, sans-serif">${p.text}</mj-text></mj-column></mj-section>`;

		case 'content':
			return `<mj-section padding="0"><mj-column><mj-text padding="${pad(block)}" font-size="${p.fontSize}px" color="${p.color}" align="${p.align}" line-height="${p.lineHeight}" font-family="Inter, Arial, sans-serif">${p.text}</mj-text></mj-column></mj-section>`;

		case 'image':
			return `<mj-section padding="0"><mj-column><mj-image padding="${pad(block)}" src="${p.src}" alt="${esc(p.alt)}" width="${p.width}px"${p.href ? ` href="${p.href}"` : ''} /></mj-column></mj-section>`;

		case 'button': {
			const widthAttr = p.width === -1 ? ' width="100%"' : p.width > 0 ? ` width="${p.width}px"` : '';
			return `<mj-section padding="0"><mj-column><mj-button padding="${pad(block)}" inner-padding="${p.innerPadding}" background-color="${p.backgroundColor}" color="${p.color}" font-size="${p.fontSize}px" font-weight="${p.fontWeight}" border-radius="${p.borderRadius}px" align="${p.align}" href="${p.href}"${widthAttr} font-family="Inter, Arial, sans-serif">${p.text}</mj-button></mj-column></mj-section>`;
		}

		case 'list': {
			const items = (p.items as string[])
				.map(item => `<li style="margin-bottom:6px;color:${p.color}">${item}</li>`)
				.join('');
			return `<mj-section padding="0"><mj-column><mj-text padding="${pad(block)}" font-size="${p.fontSize}px" color="${p.color}" font-family="Inter, Arial, sans-serif"><ul style="padding-left:20px;margin:0">${items}</ul></mj-text></mj-column></mj-section>`;
		}

		case 'table': {
			let tableHtml = '<table style="width:100%;border-collapse:collapse;" cellpadding="0" cellspacing="0">';
			if (p.headerRow) {
				tableHtml += `<tr><td style="background:${p.headerBg};color:${p.headerColor};padding:10px 14px;border:1px solid ${p.borderColor};font-weight:600;font-size:${p.fontSize}px;">${esc(p.col1Header)}</td><td style="background:${p.headerBg};color:${p.headerColor};padding:10px 14px;border:1px solid ${p.borderColor};font-weight:600;font-size:${p.fontSize}px;">${esc(p.col2Header)}</td></tr>`;
			}
			for (const row of p.rows ?? []) {
				tableHtml += `<tr><td style="padding:10px 14px;color:${p.cellColor};border:1px solid ${p.borderColor};font-size:${p.fontSize}px;">${row.col1}</td><td style="padding:10px 14px;color:${p.cellColor};border:1px solid ${p.borderColor};font-size:${p.fontSize}px;">${row.col2}</td></tr>`;
			}
			tableHtml += '</table>';
			return `<mj-section padding="0"><mj-column><mj-table padding="${pad(block)}">${tableHtml}</mj-table></mj-column></mj-section>`;
		}

		case 'section':
			return `<mj-section padding="${pad(block)}" background-color="${p.backgroundColor}"><mj-column><mj-text font-size="1px" padding="0" color="transparent">&#8203;</mj-text></mj-column></mj-section>`;

		case 'footer': {
			let footerContent = '';
			if (p.companyName) footerContent += `<p style="font-weight:600;margin:0 0 4px">${esc(p.companyName)}</p>`;
			if (p.companyAddress) footerContent += `<p style="margin:0 0 10px">${esc(p.companyAddress)}</p>`;
			footerContent += `<p style="margin:0 0 12px;line-height:1.6">${p.text}</p>`;
			const linkParts: string[] = [];
			for (const link of p.links ?? []) {
				linkParts.push(`<a href="${link.url}" style="color:${p.linkColor || '#6b7280'};text-decoration:underline">${esc(link.label)}</a>`);
			}
			if (p.unsubUrl) {
				linkParts.push(`<a href="${p.unsubUrl}" style="color:${p.linkColor || '#6b7280'};text-decoration:underline">${esc(p.unsubText || 'Unsubscribe')}</a>`);
			}
			if (linkParts.length) footerContent += `<p style="margin:8px 0 0">${linkParts.join(' &nbsp;|&nbsp; ')}</p>`;
			const divider = p.showDivider ? '<p style="border-top:1px solid #e5e7eb;margin:0 0 16px;font-size:1px;line-height:1px">&nbsp;</p>' : '';
			return `<mj-section padding="0"><mj-column><mj-text padding="${pad(block)}" font-size="${p.fontSize}px" color="${p.color}" align="${p.align}" font-family="Inter, Arial, sans-serif">${divider}${footerContent}</mj-text></mj-column></mj-section>`;
		}

		default:
			return '';
	}
}

export function blocksToMjml(blocks: Block[], bodyBg = '#f5f5f5'): string {
	const inner = blocks.map(blockToMjml).join('\n');
	return `<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="Inter, Arial, Helvetica, sans-serif" />
      <mj-text font-size="14px" color="#374151" line-height="1.6" />
    </mj-attributes>
    <mj-style>
      a { color: #0fa974; text-decoration: underline; }
    </mj-style>
  </mj-head>
  <mj-body background-color="${bodyBg}" width="600px">
${inner}
  </mj-body>
</mjml>`;
}
