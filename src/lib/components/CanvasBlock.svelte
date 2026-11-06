<script lang="ts">
	import type { Block } from '$lib/blocks';
	import { resolveColor } from '$lib/colors';
	import { mailerData } from '$lib/mailer-data.svelte';
	import { BUILTIN_KEYS, chipifyHtml, type Tag } from '$lib/placeholders';
	import { textOn } from '$lib/template-settings';
	import PlaceholderText from './PlaceholderText.svelte';
	import Icon from './Icon.svelte';
	import { axMarkFor, blockView, type BlockCtx } from './editor/canvas-style';

	// The inside of one block on the canvas (Editor.dc.html, the .blk button's content).

	function phKind(tag: Tag): string {
		if (tag.kind === 'unsupported') return 'bad';
		if (tag.kind === 'field') {
			const f = mailerData.knownFields;
			return f && tag.fallback === null && !BUILTIN_KEYS.has(tag.key) && !f.has(tag.key) ? 'bad' : 'field';
		}
		const l = mailerData.knownLinks;
		return l && !l.has(tag.key) ? 'bad' : 'link';
	}

	interface Props {
		block: Block;
		ctx: BlockCtx;
	}

	let { block, ctx }: Props = $props();

	const p = $derived(block.props);
	const v = $derived(blockView(block, ctx));
	const rc = (val: string) => resolveColor(val, ctx.theme);
	const isText = $derived(['heading', 'subheading', 'content', 'section'].includes(block.type));

	// Header
	const hdr = $derived.by(() => {
		if (block.type !== 'header') return null;
		const lay = p.layout ?? 'logo-left';
		const ink = textOn(v.fill || '#ffffff', p.color === 'auto' ? 'auto' : rc(p.color ?? 'auto'));
		const lw = Math.min(96, Math.max(16, Number(p.logoWidth) || 40));
		const custom = String(p.logoUrl || '').trim();
		const just = p.align === 'right' ? 'flex-end' : p.align === 'center' ? 'center' : 'flex-start';
		return {
			showLogo: lay !== 'text-only',
			showName: lay !== 'logo-only',
			mark: axMarkFor(v.fill),
			src: custom || axMarkFor(v.fill),
			alt: custom ? p.companyName || 'Logo' : 'Axene',
			logoStyle: 'display:block;flex-shrink:0;width:' + lw + 'px;height:' + lw + 'px;object-fit:contain;border-radius:8px',
			row:
				lay === 'logo-center'
					? 'display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center'
					: lay === 'logo-only'
						? 'display:flex;justify-content:center'
						: lay === 'text-only'
							? 'display:block;text-align:' + p.align
							: 'display:flex;align-items:center;gap:12px;flex-direction:' + (lay === 'logo-right' ? 'row-reverse' : 'row') + ';justify-content:' + just + ';text-align:left',
			nameStyle: 'display:block;font-size:' + p.fontSize + 'px;font-weight:' + (p.fontWeight ?? 700) + ';color:' + ink + ';line-height:1.25',
			tagStyle: 'display:block;font-size:12px;margin-top:3px;opacity:.8;color:' + ink,
		};
	});
	// Image failures are watched from an effect: an onerror handler or an action on an <img>
	// makes Svelte render an inline onerror attribute, which the CSP refuses.
	let logoEl: HTMLImageElement | undefined = $state();
	let imageEl: HTMLImageElement | undefined = $state();
	function watch(el: HTMLImageElement | undefined, fail: (img: HTMLImageElement) => void) {
		if (!el) return;
		const on = () => fail(el);
		el.addEventListener('error', on);
		if (el.complete && el.naturalWidth === 0 && el.getAttribute('src')) on();
		return () => el.removeEventListener('error', on);
	}
	$effect(() => watch(logoEl, logoErr));
	$effect(() => watch(imageEl, () => (imgFailed = true)));
	function logoErr(img: HTMLImageElement) {
		if (hdr && img.getAttribute('src') !== hdr.mark) {
			img.setAttribute('src', hdr.mark);
			img.setAttribute('alt', 'Axene');
		}
	}

	// Button
	const btnStyle = $derived.by(() => {
		if (block.type !== 'button') return '';
		const bf = rc(p.backgroundColor);
		const wv = Number(p.width) || 0;
		return 'display:' + (wv === -1 ? 'block' : 'inline-block') + ';' + (wv > 0 ? 'width:' + wv + 'px;max-width:100%;' : '') + 'box-sizing:border-box;padding:' + (p.innerPadding || '12px 30px') + ';border-radius:' + (p.borderRadius ?? 0) + 'px;background:' + bf + ';color:' + textOn(bf, p.color === 'auto' ? 'auto' : rc(p.color)) + ';font-size:' + p.fontSize + 'px;font-weight:' + p.fontWeight + ';text-align:center';
	});

	// Image
	let imgFailed = $state(false);
	$effect(() => {
		void p.src;
		imgFailed = false;
	});
	const imgBox = $derived.by(() => {
		if (block.type !== 'image') return '';
		const m = p.align === 'right' ? '0 0 0 auto' : p.align === 'left' ? '0' : '0 auto';
		const h = Number(p.imageHeight) || 0;
		return 'width:' + p.width + 'px;max-width:100%;' + (h > 0 ? 'height:' + h + 'px;' : '') + 'margin:' + m + ';border-radius:' + (p.borderRadius ?? 0) + 'px;';
	});

	// Table
	const cells = $derived.by(() => {
		if (block.type !== 'table') return [];
		const cell = 'display:block;padding:9px 12px;margin:0 -1px -1px 0;text-align:' + (p.align || 'left') + ';border:1px solid ' + rc(p.borderColor) + ';font-size:' + p.fontSize + 'px;';
		const head = p.headerColor && p.headerColor !== 'auto' ? textOn(rc(p.headerBg), rc(p.headerColor)) : textOn(rc(p.headerBg), 'auto');
		const out: { style: string; text: string }[] = [];
		if (p.headerRow) for (const h of [p.col1Header, p.col2Header]) out.push({ style: cell + 'font-weight:600;background:' + rc(p.headerBg) + ';color:' + head, text: h });
		for (const r of Array.isArray(p.rows) ? p.rows : []) for (const t of [r.col1, r.col2]) out.push({ style: cell + 'color:' + v.col(p.cellColor), text: t });
		return out;
	});
</script>

{#if block.type === 'header' && hdr}
	<span style={v.box}><span style={hdr.row}>
		{#if hdr.showLogo}<img src={hdr.src} alt={hdr.alt} style={hdr.logoStyle} bind:this={logoEl} />{/if}
		{#if hdr.showName}<span style="display:block"><span style={hdr.nameStyle}><PlaceholderText text={p.companyName} /></span>{#if (p.tagline || '').trim()}<span style={hdr.tagStyle}><PlaceholderText text={p.tagline} /></span>{/if}</span>{/if}
	</span></span>
{:else if isText}
	<!-- Rich text from the server-side allowlist, with its {{placeholders}} shown as chips. -->
	<span style={v.box}><span class="ed-rich" style={v.txt}>{@html chipifyHtml(block.props.text ?? '', phKind)}</span></span>
{:else if block.type === 'button'}
	<span style={v.box}><span data-w="1" style={btnStyle}><PlaceholderText text={p.text} /></span></span>
{:else if block.type === 'image'}
	<span style={v.box}>
		{#if p.src && !imgFailed}
			<img data-w="1" src={p.src} alt={p.alt} bind:this={imageEl} style="display:block;box-sizing:border-box;object-fit:cover;{imgBox}" />
		{:else}
			<span data-w="1" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;box-sizing:border-box;{imgBox}{Number(p.imageHeight) > 0 ? '' : 'height:200px;'}background:#eceef1;color:#5f6673"><span style="display:flex;opacity:.7"><Icon name="image" width={26} height={26} /></span><span style="font-size:12px;font-weight:500">{p.alt || 'Image'}</span></span>
		{/if}
	</span>
{:else if block.type === 'list'}
	<span style={v.box}>
		{#each Array.isArray(p.items) ? p.items : [] as it, i (i)}
			<span style="display:flex;align-items:flex-start;gap:10px;margin-bottom:6px;text-align:left;font-size:{p.fontSize}px;line-height:{p.lineHeight ?? 1.6};color:{v.col(p.color)};justify-content:{p.align === 'center' ? 'center' : p.align === 'right' ? 'flex-end' : 'flex-start'}"><span style="flex-shrink:0;width:6px;height:6px;border-radius:1px;margin-top:{Math.round((Number(p.fontSize) * Number(p.lineHeight ?? 1.6)) / 2 - 3)}px;background:{rc(p.bulletColor)}"></span><span style="display:block"><PlaceholderText text={it} /></span></span>
		{/each}
	</span>
{:else if block.type === 'table'}
	<span style={v.box}><span style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr))">{#each cells as c, i (i)}<span style={c.style}><PlaceholderText text={c.text} /></span>{/each}</span></span>
{:else if block.type === 'footer'}
	{@const fc = v.col(p.color)}
	{@const ls = 'font-size:' + p.fontSize + 'px;text-decoration:underline;color:' + v.col(p.linkColor || 'theme-dark')}
	{@const links = Array.isArray(p.links) ? p.links : []}
	<span style={v.box}>
		{#if p.showDivider}<span style="display:block;height:1px;background:#e5e7eb;margin-bottom:16px"></span>{/if}
		{#if p.companyName}<span style="display:block;font-size:{Number(p.fontSize) + 1}px;font-weight:600;margin-bottom:4px;color:{fc}">{p.companyName}</span>{/if}
		{#if p.companyAddress}<span style="display:block;font-size:{p.fontSize}px;margin-bottom:10px;color:{fc}">{p.companyAddress}</span>{/if}
		<span style="display:block;font-size:{p.fontSize}px;line-height:1.6;margin-bottom:12px;color:{fc}"><PlaceholderText text={p.text} /></span>
		<span style="display:block">{#each links as l, k (k)}{#if k > 0}<span style="color:#d1d5db;margin:0 6px">|</span>{/if}<span style={ls}>{l.label}</span>{/each}{#if p.unsubUrl}{#if links.length}<span style="color:#d1d5db;margin:0 6px">|</span>{/if}<span style={ls}>{p.unsubText || 'Unsubscribe'}</span>{/if}</span>
	</span>
{/if}
