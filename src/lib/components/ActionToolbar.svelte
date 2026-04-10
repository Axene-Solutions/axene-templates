<script lang="ts">
	import { editor } from '$lib/store.svelte';

	let { blockId }: { blockId: string } = $props();

	let block = $derived(editor.blocks.find(b => b.id === blockId));
	let blockType = $derived(block?.type ?? '');
	let blockIdx = $derived(editor.blocks.findIndex(b => b.id === blockId));

	let canMoveUp = $derived(editor.canMove(blockId, 'up'));
	let canMoveDown = $derived(editor.canMove(blockId, 'down'));
	let canDup = $derived(editor.canDuplicate(blockId));
	let isHeaderOrFooter = $derived(blockType === 'header' || blockType === 'footer');

	function stop(e: MouseEvent) { e.stopPropagation(); }

	function moveUp(e: MouseEvent) { stop(e); if (canMoveUp) editor.moveBlock(blockId, 'up'); }
	function moveDown(e: MouseEvent) { stop(e); if (canMoveDown) editor.moveBlock(blockId, 'down'); }
	function duplicate(e: MouseEvent) { stop(e); if (canDup) editor.duplicateBlock(blockId); }
	function remove(e: MouseEvent) { stop(e); editor.removeBlock(blockId); }

</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="at" onclick={stop}>
	<!-- Block type badge -->
	<span class="at-badge">{blockType}</span>

	<!-- Undo -->
	<button class="at-btn" class:disabled={!editor.canUndo} onclick={(e) => { stop(e); editor.undo(); }} title="Undo">
		<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
			<path d="M2.5 4.5h5a3 3 0 110 3H8.5"/>
			<polyline points="4.5,2.5 2.5,4.5 4.5,6.5"/>
		</svg>
	</button>

	<!-- Redo -->
	<button class="at-btn" class:disabled={!editor.canRedo} onclick={(e) => { stop(e); editor.redo(); }} title="Redo">
		<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
			<path d="M9.5 4.5h-5a3 3 0 100 3H3.5"/>
			<polyline points="7.5,2.5 9.5,4.5 7.5,6.5"/>
		</svg>
	</button>

	<span class="at-sep"></span>

	<!-- Move up -->
	<button class="at-btn" class:disabled={!canMoveUp} onclick={moveUp} title="Move up">
		<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
			<line x1="6" y1="10" x2="6" y2="2.5"/>
			<polyline points="3,5 6,2 9,5"/>
		</svg>
	</button>

	<!-- Move down -->
	<button class="at-btn" class:disabled={!canMoveDown} onclick={moveDown} title="Move down">
		<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
			<line x1="6" y1="2" x2="6" y2="9.5"/>
			<polyline points="3,7 6,10 9,7"/>
		</svg>
	</button>

	<span class="at-sep"></span>

	<!-- Duplicate -->
	{#if !isHeaderOrFooter}
		<button class="at-btn" onclick={duplicate} title="Duplicate">
			<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
				<rect x="3.5" y="3.5" width="7" height="7" rx="1.2"/>
				<path d="M8.5 3.5V2.3a.8.8 0 00-.8-.8H2.3a.8.8 0 00-.8.8v5.4a.8.8 0 00.8.8h1.2"/>
			</svg>
		</button>
	{/if}

	<span class="at-sep"></span>

	<!-- Delete -->
	<button class="at-btn at-btn-danger" onclick={remove} title="Delete block">
		<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
			<polyline points="2,3.5 10,3.5"/>
			<path d="M4.5 3.5V2.5a.8.8 0 01.8-.8h1.4a.8.8 0 01.8.8v1"/>
			<path d="M2.8 3.5l.5 6a1 1 0 001 .9h3.4a1 1 0 001-.9l.5-6"/>
			<line x1="5" y1="5.5" x2="5" y2="8.5"/>
			<line x1="7" y1="5.5" x2="7" y2="8.5"/>
		</svg>
	</button>
</div>

<style>
	.at {
		display: flex;
		align-items: center;
		gap: 2px;
		padding: 3px 4px;
		background: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04);
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
	}

	.at-badge {
		font-size: 10px;
		font-weight: 600;
		color: #1daa82;
		background: #edf8f4;
		padding: 2px 7px;
		border-radius: 4px;
		text-transform: capitalize;
		letter-spacing: 0.2px;
	}

	.at-sep {
		width: 1px;
		height: 14px;
		background: #e8e8e8;
		margin: 0 2px;
	}

	.at-btn {
		width: 26px;
		height: 26px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		border-radius: 5px;
		cursor: pointer;
		color: #777;
		transition: background 0.12s, color 0.12s;
	}
	.at-btn:hover { background: #f0f0f0; color: #333; }
	.at-btn.disabled {
		opacity: 0.25;
		cursor: not-allowed;
		pointer-events: none;
	}

	.at-btn-danger:hover { background: #fef2f2; color: #dc2626; }
</style>
