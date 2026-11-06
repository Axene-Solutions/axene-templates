<script lang="ts">
	import type { Snippet } from 'svelte';
	import { trapFocus } from '$lib/focus';

	// The one modal slot (Editor.dc.html "one modal slot: never two at once"): the scrim and a
	// top aligned dialog. Escape on the dialog calls onclose unless it is busy. Every editor
	// modal renders inside this, and only while view.modal names it.
	interface Props {
		label: string;
		role?: 'dialog' | 'alertdialog';
		/** Dialog card style (width, padding, gap) from the design. */
		style: string;
		/** Clicking the scrim closes too (the Insert modal does this in the design). */
		scrimCloses?: boolean;
		busy?: boolean;
		onclose: () => void;
		onkeydown?: (e: KeyboardEvent) => void;
		children: Snippet;
	}
	let { label, role = 'dialog', style, scrimCloses = false, busy = false, onclose, onkeydown, children }: Props = $props();

	function key(e: KeyboardEvent) {
		onkeydown?.(e);
		if (e.defaultPrevented) return;
		if (e.key === 'Escape' && !busy) {
			e.preventDefault();
			e.stopPropagation();
			onclose();
		}
	}
</script>

<div style="position:fixed;inset:0;background:var(--scrim);display:flex;align-items:flex-start;justify-content:center;padding:56px 16px;box-sizing:border-box;z-index:50;overflow:auto">
	{#if scrimCloses}
		<button type="button" tabindex="-1" aria-label="Close" onclick={() => !busy && onclose()} style="position:absolute;inset:0;width:100%;height:100%;border:0;padding:0;margin:0;background:transparent;cursor:default"></button>
	{/if}
	<div {role} aria-modal="true" aria-label={label} tabindex="-1" onkeydown={key} use:trapFocus style="position:relative;z-index:1;box-sizing:border-box;{style}">
		{@render children()}
	</div>
</div>
