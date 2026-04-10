<script lang="ts">
	import type { Block } from '$lib/blocks';
	import { resolveColor } from '$lib/colors';

	interface Props {
		block: Block;
		selected: boolean;
		themeColor: string;
		onselect: () => void;
	}

	let { block, selected, themeColor, onselect }: Props = $props();

	/** Resolve any color prop through the theme system. */
	function rc(value: string): string {
		return resolveColor(value, themeColor);
	}

	function buttonWidth(props: Record<string, any>): string {
		if (props.width === -1) return '100%';
		if (props.width > 0) return `${props.width}px`;
		return 'auto';
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="relative cursor-pointer"
	class:selected
	onclick={(e) => { e.stopPropagation(); onselect(); }}
>
	{#if block.type === 'header'}
		{@const layout = block.props.layout ?? 'logo-left'}
		{@const bg = block.props.backgroundColor}
		<div style="background-color:{bg}; padding:{block.props.paddingTop}px {block.props.paddingRight}px {block.props.paddingBottom}px {block.props.paddingLeft}px;">

			{#if layout === 'logo-only'}
				<div style="display:flex; justify-content:center;">
					{#if block.props.logoUrl}
						<img src={block.props.logoUrl} alt="Logo" style="width:{block.props.logoWidth}px; height:auto;" />
					{/if}
				</div>

			{:else if layout === 'text-only'}
				<div style="text-align:{block.props.align};">
					<span style="font-size:{block.props.fontSize}px; color:{block.props.color}; font-weight:bold; display:block;">
						{block.props.companyName}
					</span>
					{#if block.props.tagline}
						<div style="color:{block.props.color}; opacity:0.75; font-size:12px; margin-top:4px;">
							{block.props.tagline}
						</div>
					{/if}
				</div>

			{:else if layout === 'logo-center'}
				<div style="display:flex; flex-direction:column; align-items:center; gap:6px; text-align:center;">
					{#if block.props.logoUrl}
						<img src={block.props.logoUrl} alt="Logo" style="width:{block.props.logoWidth}px; height:auto;" />
					{/if}
					<span style="font-size:{block.props.fontSize}px; color:{block.props.color}; font-weight:bold;">
						{block.props.companyName}
					</span>
					{#if block.props.tagline}
						<div style="color:{block.props.color}; opacity:0.75; font-size:12px;">
							{block.props.tagline}
						</div>
					{/if}
				</div>

			{:else}
				<!-- logo-left (default) and logo-right -->
				<div style="display:flex; align-items:center; gap:12px; flex-direction:{layout === 'logo-right' ? 'row-reverse' : 'row'}; justify-content:{block.props.align === 'right' ? 'flex-end' : block.props.align === 'center' ? 'center' : 'flex-start'};">
					{#if block.props.logoUrl}
						<img src={block.props.logoUrl} alt="Logo" style="width:{block.props.logoWidth}px; height:auto; flex-shrink:0;" />
					{/if}
					<div>
						<div style="font-size:{block.props.fontSize}px; color:{block.props.color}; font-weight:bold;">
							{block.props.companyName}
						</div>
						{#if block.props.tagline}
							<div style="color:{block.props.color}; opacity:0.75; font-size:12px; margin-top:2px;">
								{block.props.tagline}
							</div>
						{/if}
					</div>
				</div>
			{/if}

		</div>

	{:else if block.type === 'heading'}
		<div style="padding:{block.props.paddingTop}px {block.props.paddingRight}px {block.props.paddingBottom}px {block.props.paddingLeft}px; text-align:{block.props.align};">
			<h2 style="font-size:{block.props.fontSize}px; font-weight:{block.props.fontWeight}; color:{block.props.color}; margin:0;">
				{block.props.text}
			</h2>
		</div>

	{:else if block.type === 'subheading'}
		<div style="padding:{block.props.paddingTop}px {block.props.paddingRight}px {block.props.paddingBottom}px {block.props.paddingLeft}px; text-align:{block.props.align};">
			<p style="font-size:{block.props.fontSize}px; font-weight:{block.props.fontWeight}; color:{block.props.color}; line-height:{block.props.lineHeight}; margin:0;">
				{block.props.text}
			</p>
		</div>

	{:else if block.type === 'content'}
		<div style="padding:{block.props.paddingTop}px {block.props.paddingRight}px {block.props.paddingBottom}px {block.props.paddingLeft}px; text-align:{block.props.align};">
			<!-- eslint-disable svelte/no-at-html-tags -->
			<div style="font-size:{block.props.fontSize}px; font-weight:{block.props.fontWeight ?? 'normal'}; color:{block.props.color}; line-height:{block.props.lineHeight};">
				{@html block.props.text}
			</div>
		</div>

	{:else if block.type === 'image'}
		<div style="padding:{block.props.paddingTop}px {block.props.paddingRight}px {block.props.paddingBottom}px {block.props.paddingLeft}px;">
			<img
				src={block.props.src}
				alt={block.props.alt}
				style="width:100%; max-width:{block.props.width}px; height:auto; display:block;"
			/>
		</div>

	{:else if block.type === 'button'}
		<div style="padding:{block.props.paddingTop}px {block.props.paddingRight}px {block.props.paddingBottom}px {block.props.paddingLeft}px; text-align:{block.props.align};">
			<div
				style="
					display:inline-block;
					background-color:{rc(block.props.backgroundColor)};
					color:{block.props.color};
					font-size:{block.props.fontSize}px;
					font-weight:{block.props.fontWeight};
					border-radius:{block.props.borderRadius}px;
					padding:{block.props.innerPadding};
					width:{buttonWidth(block.props)};
					text-align:center;
					cursor:pointer;
					box-sizing:border-box;
				"
			>
				{block.props.text}
			</div>
		</div>

	{:else if block.type === 'list'}
		<div style="padding:{block.props.paddingTop}px {block.props.paddingRight}px {block.props.paddingBottom}px {block.props.paddingLeft}px;">
			<ul style="list-style:none; padding:0; margin:0;">
				{#each block.props.items as item}
					<li style="display:flex; align-items:flex-start; gap:8px; margin-bottom:6px; font-size:{block.props.fontSize}px; color:{block.props.color};">
						<span style="margin-top:5px; flex-shrink:0; width:6px; height:6px; border-radius:50%; background-color:{rc(block.props.bulletColor)}; display:inline-block;"></span>
						<span>{item}</span>
					</li>
				{/each}
			</ul>
		</div>

	{:else if block.type === 'table'}
		<div style="padding:{block.props.paddingTop}px {block.props.paddingRight}px {block.props.paddingBottom}px {block.props.paddingLeft}px;">
			<table style="width:100%;border-collapse:collapse;font-size:{block.props.fontSize}px;">
				{#if block.props.headerRow}
					<thead>
						<tr>
							<th style="background:{block.props.headerBg};color:{block.props.headerColor};padding:10px 14px;text-align:left;border:1px solid {block.props.borderColor};font-weight:600;">{block.props.col1Header}</th>
							<th style="background:{block.props.headerBg};color:{block.props.headerColor};padding:10px 14px;text-align:left;border:1px solid {block.props.borderColor};font-weight:600;">{block.props.col2Header}</th>
						</tr>
					</thead>
				{/if}
				<tbody>
					{#each block.props.rows as row}
						<tr>
							<td style="padding:10px 14px;color:{block.props.cellColor};border:1px solid {block.props.borderColor};">{row.col1}</td>
							<td style="padding:10px 14px;color:{block.props.cellColor};border:1px solid {block.props.borderColor};">{row.col2}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

	{:else if block.type === 'section'}
		<div style="background-color:{block.props.backgroundColor}; padding:{block.props.paddingTop}px {block.props.paddingRight}px {block.props.paddingBottom}px {block.props.paddingLeft}px;">
		</div>

	{:else if block.type === 'footer'}
		<div style="padding:{block.props.paddingTop}px {block.props.paddingRight}px {block.props.paddingBottom}px {block.props.paddingLeft}px; text-align:{block.props.align};">
			{#if block.props.showDivider}
				<div style="border-top:1px solid #e5e7eb; margin-bottom:16px;"></div>
			{/if}
			{#if block.props.companyName}
				<p style="font-size:{block.props.fontSize + 1}px; color:{block.props.color}; margin:0 0 4px; font-weight:600;">
					{block.props.companyName}
				</p>
			{/if}
			{#if block.props.companyAddress}
				<p style="font-size:{block.props.fontSize}px; color:{block.props.color}; margin:0 0 10px;">
					{block.props.companyAddress}
				</p>
			{/if}
			<p style="font-size:{block.props.fontSize}px; color:{block.props.color}; margin:0 0 12px; line-height:1.6;">
				{block.props.text}
			</p>
			{#if block.props.links?.length || block.props.unsubUrl}
				<div style="font-size:{block.props.fontSize}px; margin-top:8px;">
					{#each block.props.links ?? [] as link, i}
						{#if i > 0}<span style="color:#d1d5db; margin:0 6px;">|</span>{/if}
						<a href={link.url} style="color:{rc(block.props.linkColor)}; text-decoration:underline;">{link.label}</a>
					{/each}
					{#if block.props.unsubUrl}
						{#if block.props.links?.length}<span style="color:#d1d5db; margin:0 6px;">|</span>{/if}
						<a href={block.props.unsubUrl} style="color:{rc(block.props.linkColor)}; text-decoration:underline;">{block.props.unsubText || 'Unsubscribe'}</a>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Selection UI -->
	{#if selected}
		<div class="handle" style="top:-3px; left:-3px;"></div>
		<div class="handle" style="top:-3px; right:-3px;"></div>
		<div class="handle" style="bottom:-3px; left:-3px;"></div>
		<div class="handle" style="bottom:-3px; right:-3px;"></div>
		<div class="handle" style="top:-3px; left:50%; transform:translateX(-50%);"></div>
		<div class="handle" style="bottom:-3px; left:50%; transform:translateX(-50%);"></div>
	{/if}
</div>

<style>
	.selected {
		outline: 2px dashed #9aabee;
		outline-offset: 4px;
	}

	.handle {
		position: absolute;
		width: 7px;
		height: 7px;
		background: white;
		border: 1.5px solid #7c6af5;
		box-sizing: border-box;
		z-index: 10;
	}
</style>
