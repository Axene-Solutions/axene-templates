<script lang="ts">
	import { editor } from '$lib/store.svelte';

	interface Props {
		blockId: string;
	}

	let { blockId }: Props = $props();

	function stop(e: MouseEvent) {
		e.stopPropagation();
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="flex items-center gap-1 py-1.5 px-1 bg-gray-100/80 rounded-lg backdrop-blur-sm border border-gray-200"
	onclick={stop}
>
	<!-- Edit (pencil) -->
	<button
		class="w-6 h-6 flex items-center justify-center bg-gray-200/60 rounded text-gray-500 hover:text-gray-700"
		onclick={stop}
		title="Edit"
	>
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
			<path d="M9.5 2.5l2 2L4.5 11.5H2.5v-2l7-7z" />
		</svg>
	</button>

	<!-- Undo (curved arrow left) -->
	<button
		class="w-6 h-6 flex items-center justify-center bg-gray-200/60 rounded text-gray-500 hover:text-gray-700"
		onclick={stop}
		title="Undo"
	>
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
			<path d="M3 5h5a4 4 0 110 4H9" />
			<polyline points="5,3 3,5 5,7" />
		</svg>
	</button>

	<!-- Duplicate (stacked rectangles) -->
	<button
		class="w-6 h-6 flex items-center justify-center bg-gray-200/60 rounded text-gray-500 hover:text-gray-700"
		onclick={(e) => { stop(e); editor.duplicateBlock(blockId); }}
		title="Duplicate"
	>
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
			<rect x="4" y="4" width="8" height="8" rx="1.5" />
			<path d="M10 4V3a1.5 1.5 0 00-1.5-1.5H3A1.5 1.5 0 001.5 3v5.5A1.5 1.5 0 003 10h1" />
		</svg>
	</button>

	<!-- Copy (overlapping rectangles) -->
	<button
		class="w-6 h-6 flex items-center justify-center bg-gray-200/60 rounded text-gray-500 hover:text-gray-700"
		onclick={stop}
		title="Copy"
	>
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
			<rect x="4.5" y="4.5" width="8" height="8" rx="1.5" />
			<path d="M9.5 4.5V2.5a1 1 0 00-1-1h-6a1 1 0 00-1 1v6a1 1 0 001 1h2" />
		</svg>
	</button>

	<!-- Delete (trash) -->
	<button
		class="w-6 h-6 flex items-center justify-center bg-gray-200/60 rounded text-gray-500 hover:text-gray-700"
		onclick={(e) => { stop(e); editor.removeBlock(blockId); }}
		title="Delete"
	>
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
			<path d="M2.5 4h9" />
			<path d="M4 4v7.5a1 1 0 001 1h4a1 1 0 001-1V4" />
			<path d="M5.5 2h3" />
			<line x1="6" y1="6.5" x2="6" y2="10" />
			<line x1="8" y1="6.5" x2="8" y2="10" />
		</svg>
	</button>

	<!-- Move up (arrow up) -->
	<button
		class="w-6 h-6 flex items-center justify-center bg-gray-200/60 rounded text-gray-500 hover:text-gray-700"
		onclick={(e) => { stop(e); editor.moveBlock(blockId, 'up'); }}
		title="Move up"
	>
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
			<line x1="7" y1="12" x2="7" y2="2" />
			<polyline points="3,6 7,2 11,6" />
		</svg>
	</button>

	<!-- Link (chain links) -->
	<button
		class="w-6 h-6 flex items-center justify-center bg-gray-200/60 rounded text-gray-500 hover:text-gray-700"
		onclick={stop}
		title="Link"
	>
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
			<path d="M6 8.5a3 3 0 004.24 0l1.5-1.5a3 3 0 00-4.24-4.24l-.75.75" />
			<path d="M8 5.5a3 3 0 00-4.24 0l-1.5 1.5a3 3 0 004.24 4.24l.75-.75" />
		</svg>
	</button>
</div>
