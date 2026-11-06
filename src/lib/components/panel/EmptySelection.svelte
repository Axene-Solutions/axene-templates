<!--
	EmptySelection: the Customize tab when nothing is selected. Mouse icon, "Nothing selected"
	and the hint to click a block on the canvas or in Layers.

	Usage:
		{#if !selected}<EmptySelection />{/if}
-->
<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';

	interface Props {
		title?: string;
		text?: string;
	}
	let { title = 'Nothing selected', text = 'Click a block on the canvas or in Layers to edit it.' }: Props = $props();
</script>

<div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;padding:40px 16px;border-radius:12px;background:var(--color-surface-2)">
	<span style="display:flex;color:var(--color-muted)"><Icon name="mouse" width={24} height={24} /></span>
	<span style="font-size:14px;font-weight:700">{title}</span>
	<span style="font-size:12.5px;line-height:1.5;color:var(--color-muted)">{text}</span>
</div>
