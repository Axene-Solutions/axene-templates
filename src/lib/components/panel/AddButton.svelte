<!--
	AddButton: the small "Add item / Add row / Add link" button under repeated content fields.

	Usage:
		<AddButton label="Add item" onclick={() => setProp('items', [...items, 'New item'])} />
-->
<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';

	interface Props {
		label: string;
		onclick: () => void;
	}
	let { label, onclick }: Props = $props();
</script>

<button class="btn" type="button" style="align-self:flex-start;padding:6px 11px;font-size:12.5px" {onclick}
	><Icon name="add" width={14} height={14} />{label}</button
>

<style>
	.btn {
		border: 0;
		cursor: pointer;
		font-weight: 600;
		font-size: 13px;
		border-radius: 8px;
		padding: 8px 13px;
		display: inline-flex;
		align-items: center;
		gap: 7px;
		text-decoration: none;
		background: var(--color-surface-2);
		color: var(--color-text);
		white-space: nowrap;
		transition: background 0.12s;
	}
	.btn:hover {
		background: var(--color-surface-3);
	}
	.btn:focus-visible {
		outline: 2px solid #ffd100;
		outline-offset: 1px;
	}
</style>
