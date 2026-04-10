<script lang="ts">
	import { editor } from '$lib/store.svelte';
	import CanvasBlock from './CanvasBlock.svelte';
	import ActionToolbar from './ActionToolbar.svelte';

	let viewMode = $state<'desktop' | 'mobile'>('desktop');
	let showPreview = $state(false);

	function handleCanvasClick() {
		editor.selectBlock(null);
	}

	function handleKeydown(e: KeyboardEvent) {
		const mod = e.metaKey || e.ctrlKey;
		if (mod && e.key === 'z' && !e.shiftKey) {
			e.preventDefault();
			editor.undo();
		} else if (mod && e.key === 'z' && e.shiftKey) {
			e.preventDefault();
			editor.redo();
		} else if (mod && e.key === 'y') {
			e.preventDefault();
			editor.redo();
		}
	}

	function handleCopyHtml() {
		if (editor.previewHtml) {
			navigator.clipboard.writeText(editor.previewHtml);
		}
	}

	function handleDragover(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		const type = e.dataTransfer?.getData('text/plain');
		if (type) {
			editor.addBlock(type as any);
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="center">
	<!-- Toolbar -->
	<div class="toolbar">
		<!-- Undo -->
		<button class="tb-icon" class:disabled={!editor.canUndo} onclick={() => editor.undo()} title="Undo (Cmd+Z)">
			<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<path d="M3 6h6a3.5 3.5 0 110 3.5H10"/>
				<polyline points="5.5,3.5 3,6 5.5,8.5"/>
			</svg>
		</button>

		<!-- Redo -->
		<button class="tb-icon" class:disabled={!editor.canRedo} onclick={() => editor.redo()} title="Redo (Cmd+Shift+Z)">
			<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<path d="M11 6H5a3.5 3.5 0 100 3.5H4"/>
				<polyline points="8.5,3.5 11,6 8.5,8.5"/>
			</svg>
		</button>

		<span class="tb-sep"></span>

		<!-- View mode buttons -->
		<div class="tb-group">
			<button class="tb-btn" class:active={viewMode === 'desktop'} onclick={() => viewMode = 'desktop'} title="Desktop">
				<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1" y="2" width="12" height="8" rx="1.2"/><line x1="4.5" y1="12" x2="9.5" y2="12"/><line x1="7" y1="10" x2="7" y2="12"/></svg>
			</button>
			<button class="tb-btn" class:active={viewMode === 'mobile'} onclick={() => viewMode = 'mobile'} title="Mobile">
				<svg width="10" height="14" viewBox="0 0 10 14" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1" y="1" width="8" height="12" rx="1.5"/><line x1="3.5" y1="11" x2="6.5" y2="11"/></svg>
			</button>
		</div>

		<!-- Language / locale -->
		<button class="tb-lang">
			<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="6" cy="6" r="5"/><path d="M6 1c-2 2-2 8 0 10M6 1c2 2 2 8 0 10M1 6h10"/></svg>
			<span>En</span>
			<svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="#aaa" stroke-width="1.2"><polyline points="1.5,3 4,5.5 6.5,3"/></svg>
		</button>

		<!-- Preview toggle -->
		<button class="tb-preview" class:active={showPreview} onclick={() => { if (!showPreview) editor.compile(); showPreview = !showPreview; }}>
			<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M1 7c1.5-3 3.5-4 6-4s4.5 1 6 4c-1.5 3-3.5 4-6 4s-4.5-1-6-4z"/><circle cx="7" cy="7" r="2"/></svg>
			{showPreview ? 'Edit' : 'Preview'}
		</button>

		<div style="flex:1"></div>

		<!-- Copy HTML -->
		<button class="tb-action" onclick={handleCopyHtml}>
			<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="3" width="7" height="7" rx="1"/><path d="M3 9H2a1 1 0 01-1-1V2a1 1 0 011-1h6a1 1 0 011 1v1"/></svg>
			Copy HTML
		</button>

		<!-- Save -->
		<button class="tb-save" onclick={() => editor.saveTemplate()}>Save</button>
	</div>

	<!-- Canvas area -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="canvas"
		onclick={handleCanvasClick}
		ondragover={handleDragover}
		ondrop={handleDrop}
	>
		<div class="email-wrap" style="max-width:{viewMode === 'desktop' ? 465 : 375}px;">
			{#if showPreview}
				<iframe
					srcdoc={editor.previewHtml}
					title="Email preview"
					style="width:100%;border:0;background:#fff;min-height:600px;"
				></iframe>
			{:else}
				<div style="background:#fff;">
					{#each editor.blocks as block (block.id)}
						<div class="relative">
							{#if editor.selectedId === block.id}
								<div class="absolute -top-10 left-1/2 -translate-x-1/2 z-20">
									<ActionToolbar blockId={block.id} />
								</div>
							{/if}
							<CanvasBlock
								{block}
								selected={editor.selectedId === block.id}
								themeColor={editor.themeColor}
								onselect={() => editor.selectBlock(block.id)}
							/>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.center {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
		overflow: hidden;
	}

	.toolbar {
		height: 44px;
		background: #fff;
		border-bottom: 1px solid #ebebeb;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		flex-shrink: 0;
		padding: 0 12px;
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
	}

	.tb-group {
		display: flex;
		align-items: center;
		gap: 1px;
		background: #f5f5f5;
		border: 1px solid #e8e8e8;
		border-radius: 8px;
		padding: 3px;
	}

	.tb-btn {
		width: 28px;
		height: 28px;
		border-radius: 6px;
		border: 1px solid transparent;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: #999;
		background: transparent;
		transition: all 0.15s;
	}
	.tb-btn:hover { color: #555; }
	.tb-btn.active {
		background: #fff;
		border-color: #e0e0e0;
		color: #333;
		box-shadow: 0 1px 3px rgba(0,0,0,0.08);
	}

	.tb-lang {
		display: flex;
		align-items: center;
		gap: 4px;
		border: 1px solid #e8e8e8;
		border-radius: 6px;
		padding: 4px 9px;
		font-size: 11.5px;
		color: #555;
		cursor: pointer;
		background: #fff;
		height: 28px;
	}
	.tb-lang:hover { background: #f9f9f9; }

	.tb-preview {
		display: flex;
		align-items: center;
		gap: 5px;
		border: 1px solid #e8e8e8;
		border-radius: 6px;
		padding: 4px 10px;
		font-size: 11.5px;
		color: #555;
		cursor: pointer;
		background: #fff;
		height: 28px;
		transition: all 0.15s;
	}
	.tb-preview:hover { background: #f9f9f9; }
	.tb-preview.active { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }

	.tb-action {
		display: flex;
		align-items: center;
		gap: 5px;
		border: 1px solid #e8e8e8;
		border-radius: 6px;
		padding: 4px 10px;
		font-size: 11.5px;
		color: #666;
		cursor: pointer;
		background: #fff;
		height: 28px;
	}
	.tb-action:hover { background: #f5f5f5; color: #333; }

	.tb-save {
		background: #1daa82;
		color: #fff;
		border: none;
		border-radius: 7px;
		padding: 6px 14px;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		height: 28px;
		display: flex;
		align-items: center;
		transition: background 0.15s;
	}
	.tb-save:hover { background: #189e78; }

	.tb-icon {
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		color: #888;
		transition: background 0.12s, color 0.12s;
	}
	.tb-icon:hover { background: #f0f0f0; color: #333; }
	.tb-icon.disabled { opacity: 0.25; cursor: not-allowed; pointer-events: none; }

	.tb-sep {
		width: 1px;
		height: 18px;
		background: #e8e8e8;
		margin: 0 4px;
	}

	.canvas {
		flex: 1;
		background: #ddeadd;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding: 50px;
		overflow-y: auto;
	}
	.canvas::-webkit-scrollbar { width: 6px; }
	.canvas::-webkit-scrollbar-thumb { background: #bbb; border-radius: 3px; }

	.email-wrap {
		border: 2px dashed #9aabee;
		border-radius: 3px;
		width: 100%;
		background: transparent;
		transition: max-width 0.2s ease;
	}
</style>
