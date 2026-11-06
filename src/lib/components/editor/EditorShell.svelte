<script lang="ts">
	import './editor.css';
	import { editor, view } from '$lib/store.svelte';
	import { allWebFontsHref } from '$lib/template-settings';
	import TopBar from './TopBar.svelte';
	import EditorModals from './EditorModals.svelte';
	import PostSaveNudge from '../PostSaveNudge.svelte';
	import Sidebar from '../Sidebar.svelte';
	import Canvas from '../Canvas.svelte';
	import RightPanel from '../RightPanel.svelte';

	// The full screen editor (Editor.dc.html): top bar, post-save bar, left panel, canvas, right
	// panel, toast and the one modal slot. Shortcuts are handled on this root, so they only act
	// while focus is inside the editor.
	let topBar: TopBar | undefined = $state();

	function onkeydown(e: KeyboardEvent) {
		if (view.modal) return;
		const mod = e.metaKey || e.ctrlKey;
		if (!mod) return;
		const k = e.key.toLowerCase();
		if (k === 'z' && !e.shiftKey) {
			e.preventDefault();
			editor.undo();
		} else if ((k === 'z' && e.shiftKey) || k === 'y') {
			e.preventDefault();
			editor.redo();
		} else if (k === 's') {
			e.preventDefault();
			topBar?.explicitSave();
		} else if (k === 'd' && editor.selectedId) {
			e.preventDefault();
			editor.duplicateBlock(editor.selectedId);
		}
	}

	// Closing or reloading the tab inside the 2 second autosave delay would drop the last edits.
	function onbeforeunload(e: BeforeUnloadEvent) {
		if (!editor.flushOnExit()) e.preventDefault();
	}
</script>

<svelte:window {onbeforeunload} />

<svelte:head>
	<link rel="stylesheet" href={allWebFontsHref()} />
</svelte:head>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="ed-root" {onkeydown}>
	<TopBar bind:this={topBar} />
	<PostSaveNudge />
	<div style="display:flex;flex:1;min-height:0">
		{#if !view.preview}<Sidebar />{/if}
		<Canvas />
		{#if !view.preview}
			<RightPanel />
		{/if}
	</div>
	{#if view.toast}
		<div role="status" style="position:absolute;left:50%;bottom:26px;transform:translateX(-50%);background:var(--text);color:var(--bg);padding:11px 18px;border-radius:12px;font-size:13px;font-weight:500;box-shadow:0 12px 30px rgba(0,0,0,.25);z-index:60;white-space:nowrap">{view.toast}</div>
	{/if}
	<EditorModals />
</div>

