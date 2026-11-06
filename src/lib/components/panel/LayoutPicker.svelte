<!--
	LayoutPicker: the header block's five layouts (Logo left, Logo center, Logo right, Logo only,
	Text only) as small illustrated buttons in a 5 column grid, drawn with the design's bars
	(no SVG), with the selected layout's name under the grid.

	Usage:
		<LayoutPicker value={p.layout} onchange={(v) => setProp('layout', v)} />
-->
<script lang="ts">
	import { HEADER_LAYOUTS, type HeaderLayout } from '$lib/panel/constants';

	interface Props {
		value: HeaderLayout | string | null | undefined;
		onchange: (value: HeaderLayout) => void;
	}
	let { value, onchange }: Props = $props();

	const name = $derived(HEADER_LAYOUTS.find((x) => x.value === value)?.title ?? '');
	const inner = (v: HeaderLayout) =>
		'display:flex;align-items:center;gap:4px;' +
		(v === 'logo-center' ? 'flex-direction:column;gap:3px' : v === 'logo-right' ? 'flex-direction:row-reverse' : '');
	const logo = (v: HeaderLayout) =>
		'display:block;width:' +
		(v === 'logo-only' ? 12 : 8) +
		'px;height:' +
		(v === 'logo-only' ? 12 : 8) +
		'px;border-radius:2px;background:var(--color-bar-2)';
	const textCol = (v: HeaderLayout) =>
		'display:flex;flex-direction:column;gap:2px;align-items:' +
		(v === 'logo-left' ? 'flex-start' : v === 'logo-right' ? 'flex-end' : 'center');
</script>

<div style="display:grid;grid-template-columns:repeat(5, minmax(0, 1fr));gap:6px">
	{#each HEADER_LAYOUTS as y (y.value)}
		{@const on = value === y.value}
		<button
			class="lay"
			type="button"
			aria-label={y.title}
			title={y.title}
			aria-pressed={on}
			onclick={() => onchange(y.value)}
			style={on ? 'box-shadow:0 0 0 2px #ffd100;background:var(--color-bg)' : ''}
			><span style={inner(y.value)}
				>{#if y.value !== 'text-only'}<span style={logo(y.value)}></span>{/if}{#if y.value !== 'logo-only'}<span
						style={textCol(y.value)}
						><span class="bar" style="width:14px;height:3px"></span><span class="bar" style="width:10px;height:2px"></span></span
					>{/if}</span
			></button
		>
	{/each}
</div>
<div class="lbl">{name}</div>

<style>
	.lay {
		border: 0;
		cursor: pointer;
		border-radius: 8px;
		background: var(--color-surface-2);
		height: 44px;
		display: grid;
		place-items: center;
		padding: 0;
	}
	.lay:hover {
		background: var(--color-surface-3);
	}
	.lay:focus-visible {
		outline: 2px solid #ffd100;
		outline-offset: 1px;
	}
	.bar {
		display: block;
		background: var(--color-bar);
		border-radius: 1px;
	}
	.lbl {
		font-size: 12px;
		font-weight: 600;
		color: var(--color-muted);
		user-select: none;
		-webkit-user-select: none;
	}
</style>
