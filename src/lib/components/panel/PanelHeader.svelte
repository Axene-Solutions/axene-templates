<!--
	PanelHeader: the top row of the Customize tab. The selection name in bold, an optional type
	chip (the email container shows "Container"), an optional Delete block button and the
	Deselect button.

	Usage (block):
		<PanelHeader title="Heading" ondelete={askDelete} ondeselect={deselect} />
	Usage (email container):
		<PanelHeader title="Email" chip="Container" ondeselect={deselect} />
-->
<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';

	interface Props {
		title: string;
		chip?: string;
		ondelete?: () => void;
		deleteLabel?: string;
		ondeselect: () => void;
	}
	let { title, chip, ondelete, deleteLabel = 'Delete block', ondeselect }: Props = $props();
</script>

<div style={chip ? 'display:flex;align-items:center;gap:8px' : 'display:flex;align-items:center;gap:4px'}>
	<div style="flex-grow:1;font-size:15px;font-weight:700">{title}</div>
	{#if chip}
		<span style="font-size:11px;font-weight:700;padding:3px 8px;border-radius:4px;background:var(--color-surface-2);color:var(--color-muted)"
			>{chip}</span
		>
	{/if}
	{#if ondelete}
		<button class="icon-btn" type="button" aria-label={deleteLabel} onclick={ondelete}><Icon name="trash" width={16} height={16} /></button>
	{/if}
	<button class="icon-btn" type="button" aria-label="Deselect" onclick={ondeselect}><Icon name="close" width={14} height={14} /></button>
</div>

<style>
	.icon-btn {
		width: 34px;
		height: 34px;
		flex-shrink: 0;
		border-radius: 8px;
		border: 0;
		background: transparent;
		color: var(--color-muted);
		display: grid;
		place-items: center;
		cursor: pointer;
		text-decoration: none;
		padding: 0;
	}
	.icon-btn:hover {
		background: var(--color-surface-2);
		color: var(--color-text);
	}
	.icon-btn:focus-visible {
		outline: 2px solid #ffd100;
		outline-offset: 1px;
	}
</style>
