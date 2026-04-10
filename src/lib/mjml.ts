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
		case 'heading':
			return `<mj-section padding="0"><mj-column><mj-text padding="${pad(block)}" font-size="${p.fontSize}px" font-weight="${p.fontWeight}" color="${p.color}" align="${p.align}" font-family="Inter, Arial, sans-serif">${p.text}</mj-text></mj-column></mj-section>`;

		case 'subheading':
			return `<mj-section padding="0"><mj-column><mj-text padding="${pad(block)}" font-size="${p.fontSize}px" font-weight="${p.fontWeight}" color="${p.color}" align="${p.align}" line-height="${p.lineHeight}" font-family="Inter, Arial, sans-serif">${p.text}</mj-text></mj-column></mj-section>`;

		case 'content':
			return `<mj-section padding="0"><mj-column><mj-text padding="${pad(block)}" font-size="${p.fontSize}px" color="${p.color}" align="${p.align}" line-height="${p.lineHeight}" font-family="Inter, Arial, sans-serif">${p.text}</mj-text></mj-column></mj-section>`;

		case 'image':
			return `<mj-section padding="0"><mj-column><mj-image padding="${pad(block)}" src="${p.src}" alt="${esc(p.alt)}" width="${p.width}px"${p.href ? ` href="${p.href}"` : ''} /></mj-column></mj-section>`;

		case 'button':
			return `<mj-section padding="0"><mj-column><mj-button padding="${pad(block)}" inner-padding="${p.innerPadding}" background-color="${p.backgroundColor}" color="${p.color}" font-size="${p.fontSize}px" font-weight="${p.fontWeight}" border-radius="${p.borderRadius}px" align="${p.align}" href="${p.href}" font-family="Inter, Arial, sans-serif">${p.text}</mj-button></mj-column></mj-section>`;

		case 'list': {
			const items = (p.items as string[])
				.map(item => `<li style="margin-bottom:6px;color:${p.color}">${item}</li>`)
				.join('');
			return `<mj-section padding="0"><mj-column><mj-text padding="${pad(block)}" font-size="${p.fontSize}px" color="${p.color}" font-family="Inter, Arial, sans-serif"><ul style="padding-left:20px;margin:0">${items}</ul></mj-text></mj-column></mj-section>`;
		}

		case 'section':
			return `<mj-section padding="${pad(block)}" background-color="${p.backgroundColor}"><mj-column><mj-text font-size="1px" padding="0" color="transparent">&#8203;</mj-text></mj-column></mj-section>`;

		case 'footer':
			return `<mj-section padding="0"><mj-column><mj-text padding="${pad(block)}" font-size="${p.fontSize}px" color="${p.color}" align="${p.align}" font-family="Inter, Arial, sans-serif">${p.text}</mj-text></mj-column></mj-section>`;

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
