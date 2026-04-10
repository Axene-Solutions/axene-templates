<script lang="ts">
	import { editor } from '$lib/store.svelte';
	import CanvasBlock from './CanvasBlock.svelte';
	import ActionToolbar from './ActionToolbar.svelte';

	let viewMode = $state<'desktop' | 'mobile'>('desktop');
	let showPreview = $state(false);

	function handleCanvasClick() {
		editor.selectBlock(null);
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

<div class="flex-1 flex flex-col min-w-0 bg-white">
	<!-- Toolbar -->
	<div class="h-11 flex items-center gap-2 px-3 border-b border-gray-200 shrink-0">
		<!-- View mode toggle -->
		<div class="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-0.5">
			<button
				class="w-7 h-7 flex items-center justify-center rounded-md transition-all {viewMode === 'desktop' ? 'bg-white shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-500'}"
				onclick={() => viewMode = 'desktop'}
				title="Desktop"
			>
				<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
					<rect x="1" y="1.5" width="12" height="8.5" rx="1.5" />
					<line x1="5" y1="12.5" x2="9" y2="12.5" />
					<line x1="7" y1="10" x2="7" y2="12.5" />
				</svg>
			</button>
			<button
				class="w-7 h-7 flex items-center justify-center rounded-md transition-all {viewMode === 'mobile' ? 'bg-white shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-500'}"
				onclick={() => viewMode = 'mobile'}
				title="Mobile"
			>
				<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
					<rect x="3" y="1" width="8" height="12" rx="1.5" />
					<line x1="6" y1="11" x2="8" y2="11" />
				</svg>
			</button>
		</div>

		<!-- Preview toggle -->
		<button
			class="text-xs px-2.5 py-1.5 rounded-lg border transition-all {showPreview ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}"
			onclick={() => {
				if (!showPreview) editor.compile();
				showPreview = !showPreview;
			}}
		>
			Preview
		</button>

		<div class="flex-1"></div>

		<!-- Copy HTML -->
		<button
			class="text-xs text-gray-500 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:text-gray-700"
			onclick={handleCopyHtml}
		>
			Copy HTML
		</button>

		<!-- Save -->
		<button
			class="bg-[#1daa82] text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#18946f] transition-colors"
			onclick={() => editor.saveTemplate()}
		>
			Save
		</button>
	</div>

	<!-- Canvas area -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="bg-[#ddeadd] flex-1 overflow-y-auto flex justify-center items-start p-7"
		onclick={handleCanvasClick}
		ondragover={handleDragover}
		ondrop={handleDrop}
	>
		<div
			class="border-2 border-dashed border-[#9aabee] rounded-sm bg-transparent transition-all duration-200"
			style="max-width:{viewMode === 'desktop' ? 465 : 375}px; width:100%;"
		>
			{#if showPreview}
				<iframe
					srcdoc={editor.previewHtml}
					title="Email preview"
					class="w-full border-0 bg-white"
					style="min-height:600px;"
				></iframe>
			{:else}
				<div class="bg-white">
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
