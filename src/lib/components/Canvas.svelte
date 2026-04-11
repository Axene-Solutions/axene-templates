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
		// cmd + space key to toggle preview
		else if (mod && e.key === ' ' && !e.repeat) {
			e.preventDefault();
			if (!showPreview) editor.compile();
			showPreview = !showPreview;
		}

		// Ctrl/Cmd + S to save
		else if (mod && e.key === 's') {
			e.preventDefault();
			editor.saveTemplate();
		}

		// Ctrl/Cmd + D to duplicate selected block
		else if (mod && e.key === 'd' && editor.selectedId) {
			e.preventDefault();
			editor.duplicateBlock(editor.selectedId);
		}

		// cmd + Delete or Backspace to remove selected block
		else if (mod && (e.key === 'Delete' || e.key === 'Backspace') && editor.selectedId) {
			e.preventDefault();
			editor.removeBlock(editor.selectedId);
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
		<button class="tb-undo-redo" class:disabled={!editor.canUndo} onclick={() => editor.undo()} title="Undo">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<path d="M5 5V8V11"/>
				<path d="M8.5 8C12.5 8 11 8 15 8C15 8 15 8 15 8C15 8 20 8 20 12.706C20 18 15 18 15 18C11.571 18 9.714 18 6.286 18"/>
				<path d="M11.5 11.5C10.133 10.133 9.367 9.367 8 8C9.367 6.633 10.133 5.867 11.5 4.5"/>
			</svg>
			<span class="tb-shortcut">&#8984;Z</span>
		</button>

		<!-- Redo -->
		<button class="tb-undo-redo" class:disabled={!editor.canRedo} onclick={() => editor.redo()} title="Redo">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<path d="M19 5V8V11"/>
				<path d="M15.5 8C11.5 8 13 8 9 8C9 8 9 8 9 8C9 8 4 8 4 12.706C4 18 9 18 9 18C12.429 18 14.286 18 17.714 18"/>
				<path d="M12.5 11.5C13.867 10.133 14.633 9.367 16 8C14.633 6.633 13.867 5.867 12.5 4.5"/>
			</svg>
			<span class="tb-shortcut">&#8984;&#8679;Z</span>
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

		<!-- Preview / Edit toggle -->
		<button class="tb-preview" class:active={showPreview} onclick={() => { if (!showPreview) editor.compile(); showPreview = !showPreview; }}>
			{#if showPreview}
				<!-- Edit icon (pencil) -->
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M14.3632 5.65156L15.8431 4.17157C16.6242 3.39052 17.8905 3.39052 18.6716 4.17157L20.0858 5.58579C20.8668 6.36683 20.8668 7.63316 20.0858 8.41421L18.6058 9.8942M14.3632 5.65156L4.74749 15.2672C4.41542 15.5993 4.21079 16.0376 4.16947 16.5054L3.92738 19.2459C3.87261 19.8659 4.39148 20.3848 5.0115 20.33L7.75191 20.0879C8.21972 20.0466 8.65806 19.8419 8.99013 19.5099L18.6058 9.8942M14.3632 5.65156L18.6058 9.8942"/>
				</svg>
				Edit
			{:else}
				<!-- Preview icon (eye) -->
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M3 13C6.6 5 17.4 5 21 13"/>
					<path d="M12 17C10.3431 17 9 15.6569 9 14C9 12.3431 10.3431 11 12 11C13.6569 11 15 12.3431 15 14C15 15.6569 13.6569 17 12 17Z"/>
				</svg>
				Preview
			{/if}
		</button>

		<div style="flex:1"></div>

		<!-- Copy HTML -->
		<button class="tb-action" onclick={handleCopyHtml}>
			<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="3" width="7" height="7" rx="1"/><path d="M3 9H2a1 1 0 01-1-1V2a1 1 0 011-1h6a1 1 0 011 1v1"/></svg>
			Copy HTML
		</button>

		<!-- Download -->
		<button class="tb-action" onclick={handleCopyHtml} title="Download HTML">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<path d="M6 20L18 20"/>
				<path d="M12 4V16M12 16L15.5 12.5M12 16L8.5 12.5"/>
			</svg>
		</button>

		<!-- Save -->
		<button class="tb-save" onclick={() => editor.saveTemplate()}>
			Save
			<!-- shortcut -->
			<span class="kbd ml-2!">&#8984;</span>
			<span class="kbd">S</span>
		</button>
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
		background: #141414;
		border-bottom: 1px solid rgba(255,255,255,0.06);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		flex-shrink: 0;
		padding: 0 12px;
		font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif;
	}

	.tb-group {
		display: flex;
		align-items: center;
		gap: 1px;
		background: rgba(255,255,255,0.04);
		border: 1px solid rgba(255,255,255,0.08);
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
		color: #666;
		background: transparent;
		transition: all 0.15s;
	}
	.tb-btn:hover { color: #666; }
	.tb-btn.active {
		background: #141414;
		border-color: rgba(255,255,255,0.12);
		color: #ccc;
		box-shadow: 0 1px 3px rgba(0,0,0,0.2);
	}

	.tb-lang {
		display: flex;
		align-items: center;
		gap: 4px;
		border: 1px solid rgba(255,255,255,0.08);
		border-radius: 6px;
		padding: 4px 9px;
		font-size: 11.5px;
		color: #666;
		cursor: pointer;
		background: #141414;
		height: 28px;
	}
	.tb-lang:hover { background: rgba(255,255,255,0.03); }

	.tb-preview {
		display: flex;
		align-items: center;
		gap: 5px;
		border: 1px solid rgba(255,255,255,0.08);
		border-radius: 6px;
		padding: 4px 10px;
		font-size: 11.5px;
		color: #666;
		cursor: pointer;
		background: #141414;
		height: 28px;
		transition: all 0.15s;
	}
	.tb-preview:hover { background: rgba(255,255,255,0.03); }
	.tb-preview.active { background: #222; color: #fff; border-color: #1a1a1a; }

	.tb-action {
		display: flex;
		align-items: center;
		gap: 5px;
		border: 1px solid rgba(255,255,255,0.08);
		border-radius: 6px;
		padding: 4px 10px;
		font-size: 11.5px;
		color: #666;
		cursor: pointer;
		background: #141414;
		height: 28px;
	}
	.tb-action:hover { background: rgba(255,255,255,0.04); color: #ccc; }

	.tb-save {
		background: #FFD100;
		color: #000;
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
	.tb-save:hover { background: #e6bc00; }

	.tb-undo-redo {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 8px;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 6px;
		cursor: pointer;
		color: #666;
		font-family: inherit;
		transition: background 0.12s, color 0.12s, border-color 0.12s;
	}
	.tb-undo-redo:hover { background: rgba(255,255,255,0.04); color: #ccc; border-color: #e8e8e8; }
	.tb-undo-redo.disabled { opacity: 0.25; cursor: not-allowed; pointer-events: none; }
	.tb-shortcut {
		font-size: 10px;
		color: #bbb;
		font-weight: 500;
		letter-spacing: 0.3px;
	}
	.tb-undo-redo:hover .tb-shortcut { color: #666; }

	.tb-sep {
		width: 1px;
		height: 18px;
		background: #e8e8e8;
		margin: 0 4px;
	}

	.canvas {
		flex: 1;
		background: #222;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding: 50px;
		overflow-y: auto;
	}
	.canvas::-webkit-scrollbar { width: 6px; }
	.canvas::-webkit-scrollbar-thumb { background: #bbb; border-radius: 3px; }

	.email-wrap {
		border: 2px dashed rgba(255,209,0,0.3);
		border-radius: 3px;
		width: 100%;
		background: transparent;
		transition: max-width 0.2s ease;
	}
</style>
