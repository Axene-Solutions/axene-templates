<script lang="ts">
	import { editor } from '$lib/store.svelte';
	import ConfirmModal from './ConfirmModal.svelte';

	let { blockId }: { blockId: string } = $props();

	let block = $derived(editor.blocks.find(b => b.id === blockId));
	let blockType = $derived(block?.type ?? '');
	let blockIdx = $derived(editor.blocks.findIndex(b => b.id === blockId));

	let canMoveUp = $derived(editor.canMove(blockId, 'up'));
	let canMoveDown = $derived(editor.canMove(blockId, 'down'));
	let canDup = $derived(editor.canDuplicate(blockId));
	let isHeaderOrFooter = $derived(blockType === 'header' || blockType === 'footer');

	let showDeleteConfirm = $state(false);

	function stop(e: MouseEvent) { e.stopPropagation(); }

	function moveUp(e: MouseEvent) { stop(e); if (canMoveUp) editor.moveBlock(blockId, 'up'); }
	function moveDown(e: MouseEvent) { stop(e); if (canMoveDown) editor.moveBlock(blockId, 'down'); }
	function duplicate(e: MouseEvent) { stop(e); if (canDup) editor.duplicateBlock(blockId); }
	function askDelete(e: MouseEvent) { stop(e); showDeleteConfirm = true; }
	function confirmDelete() { editor.removeBlock(blockId); showDeleteConfirm = false; }

</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="at pl-1.5!" onclick={stop}>
	<!-- Block type badge -->
	<span class="at-badge">{blockType}</span>

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
	<button class="at-btn at-btn-danger" onclick={askDelete} title="Delete block">
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
			<path d="M20 9L18.005 20.3463C17.8369 21.3026 17.0062 22 16.0353 22H7.96474C6.99379 22 6.1631 21.3026 5.99496 20.3463L4 9"/>
			<path d="M21 6L15.375 6M3 6L8.625 6M8.625 6V4C8.625 2.89543 9.52043 2 10.625 2H13.375C14.4796 2 15.375 2.89543 15.375 4V6M8.625 6L15.375 6"/>
		</svg>
	</button>
</div>

<ConfirmModal
	open={showDeleteConfirm}
	title="Delete Block"
	message="Are you sure you want to delete this {blockType} block?"
	confirmText="Delete"
	variant="danger"
	onconfirm={confirmDelete}
	oncancel={() => showDeleteConfirm = false}
/>

<style>
	.at {
		display: flex;
		align-items: center;
		gap: 2px;
		padding: 3px 4px;
		background: #1e1e1e;
		border: 1px solid rgba(255,255,255,0.1);
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04);
		font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif;
	}

	.at-badge {
		font-size: 10px;
		font-weight: 600;
		color: #FFD100;
		background: rgba(255,209,0,0.1);
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
		color: #666;
		transition: background 0.12s, color 0.12s;
	}
	.at-btn:hover { background: rgba(255,255,255,0.06); color: #ccc; }
	.at-btn.disabled {
		opacity: 0.25;
		cursor: not-allowed;
		pointer-events: none;
	}

	.at-btn-danger:hover { background: rgba(220,38,38,0.1); color: #dc2626; }
</style>
