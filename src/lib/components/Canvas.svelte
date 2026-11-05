<script lang="ts">
	import { editor } from '$lib/store.svelte'
	import CanvasBlock from './CanvasBlock.svelte'
	import ActionToolbar from './ActionToolbar.svelte'
	import Icon from './Icon.svelte'

	let viewMode = $state<'desktop' | 'mobile'>('desktop')
	let showPreview = $state(false)

	function handleCanvasClick() {
		editor.selectBlock(null)
	}

	function handleKeydown(e: KeyboardEvent) {
		const mod = e.metaKey || e.ctrlKey
		if (mod && e.key === 'z' && !e.shiftKey) {
			e.preventDefault()
			editor.undo()
		} else if (mod && e.key === 'z' && e.shiftKey) {
			e.preventDefault()
			editor.redo()
		} else if (mod && e.key === 'y') {
			e.preventDefault()
			editor.redo()
		}
		// cmd + space key to toggle preview
		else if (mod && e.key === ' ' && !e.repeat) {
			e.preventDefault()
			if (!showPreview) editor.compile()
			showPreview = !showPreview
		}

		// Ctrl/Cmd + S to save
		else if (mod && e.key === 's') {
			e.preventDefault()
			editor.saveTemplate()
		}

		// Ctrl/Cmd + D to duplicate selected block
		else if (mod && e.key === 'd' && editor.selectedId) {
			e.preventDefault()
			editor.duplicateBlock(editor.selectedId)
		}

		// cmd + Delete or Backspace to remove selected block
		else if (mod && (e.key === 'Delete' || e.key === 'Backspace') && editor.selectedId) {
			e.preventDefault()
			editor.removeBlock(editor.selectedId)
		}
	}

	let copied = $state(false)
	let copyTimer: ReturnType<typeof setTimeout> | undefined

	async function handleCopyHtml() {
		if (!editor.previewHtml) return
		try {
			await navigator.clipboard.writeText(editor.previewHtml)
			copied = true
			clearTimeout(copyTimer)
			copyTimer = setTimeout(() => (copied = false), 1800)
		} catch {
			copied = false
		}
	}

	const saveLabel = $derived(
		editor.saveState === 'saving'
			? 'Saving...'
			: editor.saveState === 'saved' && !editor.dirty
				? 'Saved'
				: editor.saveState === 'error'
					? 'Retry save'
					: 'Save'
	)

	function handleDragover(e: DragEvent) {
		e.preventDefault()
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault()
		const type = e.dataTransfer?.getData('text/plain')
		if (type) {
			editor.addBlock(type as any)
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="center">
	<!-- Toolbar -->
	<div class="toolbar">
		<!-- Undo -->
		<button
			class="tb-undo-redo"
			class:disabled={!editor.canUndo}
			onclick={() => editor.undo()}
			title="Undo"
		>
			<Icon name="undo" width={16} height={16} />
			<span class="tb-shortcut">&#8984;Z</span>
		</button>

		<!-- Redo -->
		<button
			class="tb-undo-redo"
			class:disabled={!editor.canRedo}
			onclick={() => editor.redo()}
			title="Redo"
		>
			<Icon name="redo" width={16} height={16} />
			<span class="tb-shortcut">&#8984;&#8679;Z</span>
		</button>

		<span class="tb-sep"></span>

		<!-- View mode buttons -->
		<div class="tb-group">
			<button
				class="tb-btn"
				class:active={viewMode === 'desktop'}
				onclick={() => (viewMode = 'desktop')}
				title="Desktop"
			>
				<Icon name="monitor" width={14} height={14} />
			</button>
			<button
				class="tb-btn"
				class:active={viewMode === 'mobile'}
				onclick={() => (viewMode = 'mobile')}
				title="Mobile"
			>
				<Icon name="mobile" width={14} height={14} />
			</button>
		</div>

		<!-- Preview / Edit toggle -->
		<button
			class="tb-preview"
			class:active={showPreview}
			onclick={() => {
				if (!showPreview) editor.compile()
				showPreview = !showPreview
			}}
		>
			{#if showPreview}
				<Icon name="pencil" width={14} height={14} />
				Edit
			{:else}
				<Icon name="eye" width={14} height={14} />
				Preview
			{/if}
		</button>

		<div style="flex:1"></div>

		<!-- Copy HTML -->
		<button class="tb-action" onclick={handleCopyHtml} disabled={!editor.previewHtml}>
			<Icon name="copy" width={14} height={14} />
			{copied ? 'Copied' : 'Copy HTML'}
		</button>

		<!-- Download -->
		<button
			class="tb-action"
			onclick={() => editor.downloadHtml()}
			disabled={!editor.previewHtml}
			title="Download HTML"
			aria-label="Download HTML"
		>
			<Icon name="download" width={14} height={14} />
		</button>

		{#if editor.saveState === 'error'}
			<span class="tb-save-error" role="alert">{editor.saveError}</span>
		{/if}

		<!-- Save -->
		<button
			class="tb-save"
			class:error={editor.saveState === 'error'}
			onclick={() => editor.saveTemplate()}
			disabled={editor.saveState === 'saving'}
		>
			{saveLabel}
			<span class="tb-kbd">&#8984;S</span>
		</button>

	</div>

	<!-- Canvas area -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="canvas" onclick={handleCanvasClick} ondragover={handleDragover} ondrop={handleDrop}>
		<div class="email-wrap" style="max-width:{viewMode === 'desktop' ? 465 : 375}px;">
			{#if showPreview && editor.compileError && !editor.previewHtml}
				<div class="preview-error" role="alert">
					<p>{editor.compileError}</p>
					<button class="tb-action" onclick={() => editor.compile()}>
						<Icon name="refresh" width={14} height={14} />
						Retry
					</button>
				</div>
			{:else if showPreview}
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
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		flex-shrink: 0;
		padding: 0 12px;
		font-family:
			'Figtree',
			-apple-system,
			BlinkMacSystemFont,
			sans-serif;
	}

	.tb-group {
		display: flex;
		align-items: center;
		gap: 1px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
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
		color: #888;
		background: transparent;
		transition: all 0.15s;
	}
	.tb-btn:hover {
		color: #ccc;
	}
	.tb-btn.active {
		background: #141414;
		border-color: rgba(255, 255, 255, 0.12);
		color: #ccc;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}


	.tb-preview {
		display: flex;
		align-items: center;
		gap: 5px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 6px;
		padding: 4px 10px;
		font-size: 11.5px;
		color: #999;
		cursor: pointer;
		background: #141414;
		height: 28px;
		transition: all 0.15s;
	}
	.tb-preview:hover {
		background: rgba(255, 255, 255, 0.03);
	}
	.tb-preview.active {
		background: #222;
		color: #fff;
		border-color: #1a1a1a;
	}

	.preview-error {
		background: #141414;
		color: #aaa;
		padding: 32px 20px;
		text-align: center;
		font-size: 13px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}
	.preview-error p { margin: 0; color: #ef4444; }

	.tb-action {
		display: flex;
		align-items: center;
		gap: 5px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 6px;
		padding: 4px 10px;
		font-size: 11.5px;
		color: #999;
		cursor: pointer;
		background: #141414;
		height: 28px;
	}
	.tb-action:hover {
		background: rgba(255, 255, 255, 0.04);
		color: #ccc;
	}
	.tb-action:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.tb-save-error {
		font-size: 11.5px;
		color: #ef4444;
		white-space: nowrap;
	}
	.tb-kbd {
		margin-left: 8px;
		font-size: 10px;
		opacity: 0.55;
	}
	.tb-save.error {
		background: #ef4444;
		color: #fff;
	}
	.tb-save:disabled {
		opacity: 0.6;
		cursor: progress;
	}

	.tb-save {
		background: #ffd100;
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
	.tb-save:hover {
		background: #e6bc00;
	}

	.tb-undo-redo {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 8px;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 6px;
		cursor: pointer;
		color: #999;
		font-family: inherit;
		transition:
			background 0.12s,
			color 0.12s,
			border-color 0.12s;
	}
	.tb-undo-redo:hover {
		background: rgba(255, 255, 255, 0.04);
		color: #ccc;
		border-color: #e8e8e8;
	}
	.tb-undo-redo.disabled {
		opacity: 0.25;
		cursor: not-allowed;
		pointer-events: none;
	}
	.tb-shortcut {
		font-size: 10px;
		color: #bbb;
		font-weight: 500;
		letter-spacing: 0.3px;
	}
	.tb-undo-redo:hover .tb-shortcut {
		color: #666;
	}

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
	.canvas::-webkit-scrollbar {
		width: 6px;
	}
	.canvas::-webkit-scrollbar-thumb {
		background: #bbb;
		border-radius: 3px;
	}

	.email-wrap {
		border: 2px dashed rgba(255, 209, 0, 0.3);
		border-radius: 3px;
		width: 100%;
		background: transparent;
		transition: max-width 0.2s ease;
	}
</style>
