<script lang="ts">
	import { editor } from '$lib/store.svelte'
	import CanvasBlock from './CanvasBlock.svelte'
	import ActionToolbar from './ActionToolbar.svelte'
	import PostSaveNudge from './PostSaveNudge.svelte'
	import { page } from '$app/state'
	import { nudge } from '$lib/nudge.svelte'
	import Icon from './Icon.svelte'
	import { collectUsage } from '$lib/placeholders'

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
			explicitSave()
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

	// The Save button and the shortcut: after it works, the post-save bar may offer a next step.
	// Autosave and the save inside the dialogs go straight to the store and never show it.
	async function explicitSave() {
		if (await editor.saveTemplate()) nudge.offer((page.data.user as { id?: string } | null)?.id)
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

	const usesGrammar = $derived.by(() => {
		const u = collectUsage(editor.blocks)
		return u.links.size > 0 || [...u.fields.values()].some((f) => f.hasFallback)
	})

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
			onclick={explicitSave}
			disabled={editor.saveState === 'saving'}
		>
			{saveLabel}
			<span class="tb-kbd">&#8984;S</span>
		</button>

	</div>

	<PostSaveNudge />

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
				{#if usesGrammar}
					<p class="preview-note" role="note">
						Preview shows placeholders as written. Fallbacks and named links are filled in when you send: here with your Mailer links, in a broadcast by Mailer per contact.
					</p>
				{/if}
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
		background: var(--color-surface);
		border-bottom: 1px solid var(--color-border-1);
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
		background: var(--color-surface-2);
		border: 1px solid var(--color-border-1);
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
		color: var(--color-muted);
		background: transparent;
		transition: all 0.15s;
	}
	.tb-btn:hover {
		color: var(--color-text);
	}
	.tb-btn.active {
		background: var(--color-surface);
		border-color: var(--color-border-1);
		color: var(--color-text);
		box-shadow: 0 1px 3px color-mix(in srgb, var(--color-text) 20%, transparent);
	}


	.tb-preview {
		display: flex;
		align-items: center;
		gap: 5px;
		border: 1px solid var(--color-border-1);
		border-radius: 6px;
		padding: 4px 10px;
		font-size: 11.5px;
		color: var(--color-muted);
		cursor: pointer;
		background: var(--color-surface);
		height: 28px;
		transition: all 0.15s;
	}
	.tb-preview:hover {
		background: var(--color-surface-2);
	}
	.tb-preview.active {
		background: var(--color-surface-2);
		color: var(--color-text);
		border-color: var(--color-surface-2);
	}

	.preview-note { background: var(--color-info-soft); color: var(--color-text); border: 1px solid var(--color-info); border-radius: 6px; padding: 6px 10px; margin: 0 0 8px; font-size: 11.5px; line-height: 1.45; }
	.preview-error {
		background: var(--color-surface);
		color: var(--color-muted);
		padding: 32px 20px;
		text-align: center;
		font-size: 13px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}
	.preview-error p { margin: 0; color: var(--color-danger); }

	.tb-action {
		display: flex;
		align-items: center;
		gap: 5px;
		border: 1px solid var(--color-border-1);
		border-radius: 6px;
		padding: 4px 10px;
		font-size: 11.5px;
		color: var(--color-muted);
		cursor: pointer;
		background: var(--color-surface);
		height: 28px;
	}
	.tb-action:hover {
		background: var(--color-surface-2);
		color: var(--color-text);
	}
	.tb-action:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.tb-save-error {
		font-size: 11.5px;
		color: var(--color-danger);
		white-space: nowrap;
	}
	.tb-kbd {
		margin-left: 8px;
		font-size: 10px;
		opacity: 0.55;
	}
	.tb-save.error {
		background: var(--color-danger);
		color: var(--color-bg);
	}
	.tb-save:disabled {
		opacity: 0.6;
		cursor: progress;
	}

	.tb-save {
		background: var(--color-accent);
		color: #101010;
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
		background: color-mix(in srgb, var(--color-accent) 85%, var(--color-text));
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
		color: var(--color-muted);
		font-family: inherit;
		transition:
			background 0.12s,
			color 0.12s,
			border-color 0.12s;
	}
	.tb-undo-redo:hover {
		background: var(--color-surface-2);
		color: var(--color-text);
		border-color: var(--color-border-1);
	}
	.tb-undo-redo.disabled {
		opacity: 0.25;
		cursor: not-allowed;
		pointer-events: none;
	}
	.tb-shortcut {
		font-size: 10px;
		color: var(--color-muted);
		font-weight: 500;
		letter-spacing: 0.3px;
	}
	.tb-undo-redo:hover .tb-shortcut {
		color: var(--color-muted);
	}

	.tb-sep {
		width: 1px;
		height: 18px;
		background: var(--color-border-1);
		margin: 0 4px;
	}

	.canvas {
		flex: 1;
		background: var(--color-surface-2);
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
		background: var(--color-muted-soft);
		border-radius: 3px;
	}

	.email-wrap {
		border: 2px dashed var(--color-accent);
		border-radius: 3px;
		width: 100%;
		background: transparent;
		transition: max-width 0.2s ease;
	}
</style>
