<!--
	CollapsibleSection: a right panel section (design .sec header). Bold title, a chevron up
	when open and down when closed, and the body below in a 12px gap column.

	Usage:
		<CollapsibleSection title="Typography" bind:open={typoOpen}>
			...fields...
		</CollapsibleSection>
		<CollapsibleSection title="Spacing" dense open={!closed.spacing} ontoggle={() => toggle('spacing')}>

	`open` is bindable; ontoggle(nextOpen) also fires so a parent can keep the open state per
	section. `dense` uses the Spacing section's tighter body (gap 8px, padding-bottom 4px).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';

	interface Props {
		title: string;
		open?: boolean;
		ontoggle?: (open: boolean) => void;
		dense?: boolean;
		children: Snippet;
	}
	let { title, open = $bindable(true), ontoggle, dense = false, children }: Props = $props();

	function toggle() {
		open = !open;
		ontoggle?.(open);
	}
</script>

<div style="display:flex;flex-direction:column;gap:12px">
	<button class="sec" type="button" onclick={toggle} aria-expanded={open}
		><span style="flex-grow:1">{title}</span><span style="display:flex;color:var(--color-muted)"
			>{#if open}<Icon name="arrow-up4" width={14} height={14} />{:else}<Icon name="arrow-down4" width={14} height={14} />{/if}</span
		></button
	>
	{#if open}
		<div
			style={dense
				? 'display:flex; flex-direction:column; gap: 8px; padding-bottom: 4px'
				: 'display:flex;flex-direction:column;gap:12px;padding-bottom:6px'}
		>
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.sec {
		display: flex;
		align-items: center;
		width: 100%;
		border: 0;
		background: transparent;
		cursor: pointer;
		padding: 6px 2px;
		font-size: 13px;
		font-weight: 700;
		color: var(--color-text);
		text-align: left;
		user-select: none;
		-webkit-user-select: none;
	}
	.sec:focus-visible {
		outline: 2px solid #ffd100;
		outline-offset: 1px;
	}
</style>
