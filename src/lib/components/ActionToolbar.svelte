<script lang="ts">
	import { editor } from '$lib/store.svelte';
	import ConfirmModal from './ConfirmModal.svelte';
	import Icon from './Icon.svelte';

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
		<Icon name="chevron-up" width={14} height={14} />
	</button>

	<!-- Move down -->
	<button class="at-btn" class:disabled={!canMoveDown} onclick={moveDown} title="Move down">
		<Icon name="chevron-down" width={14} height={14} />
	</button>

	<span class="at-sep"></span>

	<!-- Duplicate -->
	{#if !isHeaderOrFooter}
		<button class="at-btn" onclick={duplicate} title="Duplicate">
			<Icon name="copy" width={14} height={14} />
		</button>
	{/if}

	<span class="at-sep"></span>

	<!-- Delete -->
	<button class="at-btn at-btn-danger" onclick={askDelete} title="Delete block">
		<Icon name="trash" width={14} height={14} />
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
		background: rgba(255,255,255,0.12);
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
		color: #aaa;
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
