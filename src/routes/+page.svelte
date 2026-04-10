<script lang="ts">
	import { onMount } from 'svelte';
	import { editor } from '$lib/store.svelte';
	import { blockDefs, type BlockType } from '$lib/blocks';

	let viewMode = $state<'desktop' | 'mobile'>('desktop');
	let sidebarTab = $state<'blocks' | 'layers'>('blocks');
	let rightTab = $state<'customize' | 'styles'>('customize');
	let saving = $state(false);
	let showCode = $state(false);

	onMount(() => {
		editor.compile();
	});

	async function handleSave() {
		saving = true;
		await editor.saveTemplate();
		saving = false;
	}

	function handleDragStart(e: DragEvent, type: BlockType) {
		e.dataTransfer?.setData('block-type', type);
	}

	function handleCanvasDrop(e: DragEvent) {
		e.preventDefault();
		const type = e.dataTransfer?.getData('block-type') as BlockType;
		if (type) editor.addBlock(type);
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
	}

	async function copyHtml() {
		await navigator.clipboard.writeText(editor.previewHtml);
	}

	// Property editor helpers
	function propInput(key: string, value: any) {
		if (!editor.selectedId) return;
		editor.updateProp(editor.selectedId, key, value);
	}

	// Block icon SVGs (inline, no library dependency)
	const blockIcons: Record<string, string> = {
		heading: '<svg width="22" height="14" fill="none"><rect y="0" width="22" height="5" rx="1.5" fill="#d1d5db"/><rect y="8" width="16" height="3" rx="1" fill="#e5e7eb"/></svg>',
		subheading: '<svg width="22" height="14" fill="none"><rect y="0" width="22" height="3.5" rx="1" fill="#d1d5db"/><rect y="5.5" width="22" height="2.5" rx="1" fill="#e5e7eb"/><rect y="10" width="16" height="2.5" rx="1" fill="#e5e7eb"/></svg>',
		content: '<svg width="22" height="14" fill="none"><rect y="0" width="22" height="2.5" rx="1" fill="#e5e7eb"/><rect y="4" width="22" height="2.5" rx="1" fill="#e5e7eb"/><rect y="8" width="22" height="2.5" rx="1" fill="#e5e7eb"/><rect y="12" width="14" height="2.5" rx="1" fill="#e5e7eb"/></svg>',
		image: '<svg width="22" height="14" viewBox="0 0 22 14" fill="none"><rect x="0.5" y="0.5" width="21" height="13" rx="1.5" stroke="#d1d5db"/><circle cx="6" cy="5" r="2" fill="#d1d5db"/><path d="M0 12l6-5 4 3 3-2 9 6H0z" fill="#e5e7eb"/></svg>',
		button: '<svg width="22" height="14" fill="none"><rect y="0" width="22" height="3" rx="1" fill="#d1d5db"/><rect y="5" width="22" height="9" rx="2" fill="#0fa974"/></svg>',
		list: '<svg width="22" height="14" fill="none"><circle cx="2" cy="2.5" r="2" fill="#d1d5db"/><rect x="6" y="1" width="16" height="2.5" rx="1" fill="#e5e7eb"/><circle cx="2" cy="7.5" r="2" fill="#d1d5db"/><rect x="6" y="6" width="16" height="2.5" rx="1" fill="#e5e7eb"/><circle cx="2" cy="12.5" r="2" fill="#d1d5db"/><rect x="6" y="11" width="12" height="2.5" rx="1" fill="#e5e7eb"/></svg>',
		section: '<svg width="22" height="14" viewBox="0 0 22 14" fill="none"><rect x="0.5" y="0.5" width="21" height="13" rx="1.5" stroke="#d1d5db"/><rect x="3" y="8" width="16" height="4" rx="1" fill="#f3f4f6"/></svg>',
		footer: '<svg width="22" height="14" fill="none"><rect y="8" width="22" height="3" rx="1" fill="#e5e7eb"/><rect x="5" y="12" width="12" height="2.5" rx="1" fill="#e5e7eb"/></svg>',
	};
</script>

<svelte:head>
	<title>{editor.templateName} - Axene Templates</title>
</svelte:head>

<div class="h-screen flex flex-col bg-gradient-to-br from-[#b8e8c8] via-[#a8dfb8] to-[#78c890 overflow-hidden">
<div class="bg-white w-full h-full flex overflow-hidden ring-1 ring-black/5">

<!-- NAV RAIL -->
<div class="w-[46px] border-r border-gray-100 flex flex-col items-center py-3 gap-1 shrink-0 bg-white z-20">
	<div class="w-[30px] h-[30px] bg-[var(--color-brand)] rounded-lg flex items-center justify-center mb-3 shadow-sm shrink-0">
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
			<rect x="1" y="1" width="5" height="5" rx="1.2" fill="white"/>
			<rect x="8" y="1" width="5" height="5" rx="1.2" fill="white"/>
			<rect x="1" y="8" width="5" height="5" rx="1.2" fill="white"/>
			<rect x="8" y="8" width="5" height="5" rx="1.2" fill="white"/>
		</svg>
	</div>
	<!-- Nav icons -->
	<button class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
		<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="5.5" height="5.5" rx="1"/><rect x="8.5" y="1" width="5.5" height="5.5" rx="1"/><rect x="1" y="8.5" width="5.5" height="5.5" rx="1"/><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1"/></svg>
	</button>
	<button class="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--color-brand-light)] text-[var(--color-brand)] transition-colors">
		<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="3.5" width="13" height="9" rx="1.5"/><polyline points="1,6.5 7.5,10 14,6.5"/></svg>
	</button>
	<button class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
		<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="1,12 5,7 8,9 11,4 14,12"/></svg>
	</button>
	<div class="flex-1"></div>
	<button class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
		<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7.5" cy="7.5" r="2.5"/><path d="M7.5 1v2M7.5 12v2M1 7.5h2M12 7.5h2M2.9 2.9l1.4 1.4M10.7 10.7l1.4 1.4M2.9 12.1l1.4-1.4M10.7 4.3l1.4-1.4"/></svg>
	</button>
	<div class="w-7 h-7 rounded-full bg-gray-200 overflow-hidden shrink-0 mt-1">
		<svg viewBox="0 0 28 28" fill="none" class="w-full h-full"><circle cx="14" cy="10" r="5" fill="#aaa"/><path d="M3 26c0-6.1 4.9-11 11-11s11 4.9 11 11" fill="#aaa"/></svg>
	</div>
</div>

<!-- SIDEBAR -->
<div class="w-[195px] border-r border-gray-100 flex flex-col bg-white z-10 shrink-0">
	<!-- Header -->
	<div class="px-3 py-[10px] flex items-center gap-2 border-b border-gray-100">
		<span class="text-[13px] font-semibold text-gray-800 flex-1 truncate">{editor.templateName}</span>
		{#if editor.dirty}
			<span class="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
		{/if}
	</div>

	<!-- Tabs -->
	<div class="flex gap-5 px-4 pt-2 border-b border-gray-100">
		<button onclick={() => sidebarTab = 'layers'}
			class="text-[12.5px] pb-2 transition-colors {sidebarTab === 'layers' ? 'text-gray-900 border-b-2 border-gray-900 font-semibold' : 'text-gray-400 border-b-2 border-transparent'}">Layers</button>
		<button onclick={() => sidebarTab = 'blocks'}
			class="text-[12.5px] pb-2 transition-colors {sidebarTab === 'blocks' ? 'text-gray-900 border-b-2 border-gray-900 font-semibold' : 'text-gray-400 border-b-2 border-transparent'}">Blocks</button>
	</div>

	<!-- Content -->
	<div class="flex-1 overflow-y-auto">
		{#if sidebarTab === 'blocks'}
			<!-- Block palette -->
			<div class="flex items-center justify-between px-3 py-[5px] mt-2">
				<span class="text-[11.5px] font-semibold text-gray-800">Block</span>
			</div>
			<div class="grid grid-cols-2 gap-2 px-3 pb-3">
				{#each blockDefs as def}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="border border-gray-200 rounded-[10px] bg-white p-3 flex flex-col items-center gap-2 cursor-grab hover:border-gray-300 hover:shadow-sm transition-all active:cursor-grabbing"
						draggable="true"
						ondragstart={(e) => handleDragStart(e, def.type)}
						onclick={() => editor.addBlock(def.type)}
						onkeydown={() => {}}
					>
						<div class="w-11 h-7 flex items-center justify-center">
							{@html blockIcons[def.type] || ''}
						</div>
						<span class="text-[10px] font-medium text-gray-500">{def.label}</span>
					</div>
				{/each}
			</div>
		{:else}
			<!-- Layers list -->
			<div class="px-3 py-2">
				{#each editor.blocks as block, i (block.id)}
					<button
						onclick={() => editor.selectBlock(block.id)}
						class="w-full flex items-center gap-2 px-2 py-[6px] rounded-lg text-left transition-colors mb-0.5
							{editor.selectedId === block.id ? 'bg-[var(--color-brand-light)] text-[var(--color-brand)]' : 'text-gray-600 hover:bg-gray-50'}"
					>
						<span class="text-[10px] text-gray-400 w-4 text-right">{i + 1}</span>
						<span class="text-[12px] font-medium truncate">{block.type}</span>
					</button>
				{/each}
				{#if !editor.blocks.length}
					<p class="text-[11px] text-gray-400 text-center py-6">No blocks yet. Drag from the Blocks tab.</p>
				{/if}
			</div>
		{/if}
	</div>
</div>

<!-- CENTER CANVAS -->
<div class="flex-1 flex flex-col min-w-0">
	<!-- Toolbar -->
	<div class="h-[44px] bg-white border-b border-gray-100 flex items-center justify-center gap-2 shrink-0 px-4 relative">
		<!-- View toggle -->
		<div class="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-[3px]">
			<button onclick={() => viewMode = 'desktop'}
				class="w-[26px] h-[26px] flex items-center justify-center rounded-md transition-all
					{viewMode === 'desktop' ? 'bg-white shadow-sm border border-gray-100 text-gray-700' : 'text-gray-400 hover:bg-gray-200'}">
				<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1" y="2" width="11" height="8" rx="1.2"/><line x1="4" y1="11" x2="9" y2="11"/><line x1="6.5" y1="10" x2="6.5" y2="11"/></svg>
			</button>
			<button onclick={() => viewMode = 'mobile'}
				class="w-[26px] h-[26px] flex items-center justify-center rounded-md transition-all
					{viewMode === 'mobile' ? 'bg-white shadow-sm border border-gray-100 text-gray-700' : 'text-gray-400 hover:bg-gray-200'}">
				<svg width="9" height="14" viewBox="0 0 9 14" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="0.5" y="0.5" width="8" height="13" rx="1.5"/><line x1="3" y1="11.5" x2="6" y2="11.5"/></svg>
			</button>
		</div>

		<!-- Code toggle -->
		<button onclick={() => showCode = !showCode}
			class="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-[5px] bg-gray-50 hover:bg-gray-100 transition-colors text-[11.5px] text-gray-600 font-medium {showCode ? 'border-[var(--color-brand)] bg-[var(--color-brand-light)] text-[var(--color-brand)]' : ''}">
			<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.4"><polyline points="4,3 1,6.5 4,10"/><polyline points="9,3 12,6.5 9,10"/><line x1="8" y1="1" x2="5" y2="12"/></svg>
			{showCode ? 'Preview' : 'Code'}
		</button>

		<!-- Actions -->
		<div class="absolute right-4 flex items-center gap-2">
			<button onclick={copyHtml}
				class="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-[5px] bg-white hover:bg-gray-50 transition-colors text-[11.5px] text-gray-600 font-medium">
				<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="3" width="7" height="7" rx="1"/><path d="M3 9H2a1 1 0 01-1-1V2a1 1 0 011-1h6a1 1 0 011 1v1"/></svg>
				Copy HTML
			</button>
			<button onclick={handleSave}
				class="bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white text-[11.5px] font-semibold px-3 py-[5px] rounded-lg transition-colors whitespace-nowrap">
				{saving ? 'Saving...' : 'Save'}
			</button>
		</div>
	</div>

	<!-- Canvas area -->
	<div class="flex-1 overflow-y-auto flex justify-center items-start bg-[#d8ead8] p-6 pt-8"
		ondrop={handleCanvasDrop}
		ondragover={handleDragOver}
		role="application"
	>
		<div class="w-full {viewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-[600px]'} transition-all duration-300">
			{#if showCode}
				<!-- MJML source view -->
				<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
					<div class="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
						<span class="text-[11px] font-semibold text-gray-500">MJML Source</span>
					</div>
					<pre class="p-4 text-[11px] leading-relaxed text-gray-700 overflow-x-auto font-mono whitespace-pre-wrap">{editor.mjmlSource}</pre>
				</div>
			{:else}
				<!-- Email preview -->
				<div class="rounded-sm bg-white overflow-hidden shadow-sm" style="background-image:repeating-linear-gradient(90deg,#8b9cf4 0,#8b9cf4 8px,transparent 8px,transparent 16px),repeating-linear-gradient(90deg,#8b9cf4 0,#8b9cf4 8px,transparent 8px,transparent 16px),repeating-linear-gradient(0deg,#8b9cf4 0,#8b9cf4 8px,transparent 8px,transparent 16px),repeating-linear-gradient(0deg,#8b9cf4 0,#8b9cf4 8px,transparent 8px,transparent 16px);background-size:16px 1.5px,16px 1.5px,1.5px 16px,1.5px 16px;background-position:0 0,0 100%,0 0,100% 0;background-repeat:repeat-x,repeat-x,repeat-y,repeat-y">
					{#if editor.previewHtml}
						<iframe
							srcdoc={editor.previewHtml}
							title="Email preview"
							class="w-full border-0 bg-white"
							style="height: 700px; min-height: 400px;"
							sandbox="allow-same-origin"
						></iframe>
					{:else}
						<div class="flex flex-col items-center justify-center py-24 text-gray-400">
							{#if editor.compiling}
								<div class="w-5 h-5 border-2 border-[var(--color-brand)]/30 border-t-[var(--color-brand)] rounded-full animate-spin mb-3"></div>
								<p class="text-[12px]">Compiling...</p>
							{:else}
								<p class="text-[13px]">Drag blocks from the sidebar to start building</p>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- RIGHT PANEL -->
<div class="w-[196px] border-l border-gray-100 flex flex-col bg-white shrink-0 overflow-y-auto">
	<!-- Tabs -->
	<div class="px-2 py-2 border-b border-gray-100 shrink-0">
		<div class="flex items-center bg-gray-100 rounded-lg p-[3px] gap-[3px]">
			<button onclick={() => rightTab = 'customize'}
				class="flex-1 text-[11px] py-[5px] transition-all rounded-md {rightTab === 'customize' ? 'bg-white text-gray-900 font-semibold shadow-sm' : 'text-gray-400'}">Customize</button>
			<button onclick={() => rightTab = 'styles'}
				class="flex-1 text-[11px] py-[5px] transition-all rounded-md {rightTab === 'styles' ? 'bg-white text-gray-900 font-semibold shadow-sm' : 'text-gray-400'}">Edit Styles</button>
		</div>
	</div>

	{#if editor.selected}
		<div class="flex-1 overflow-y-auto">
			<!-- Block type label -->
			<div class="px-3.5 py-3 border-b border-gray-100 flex items-center justify-between">
				<span class="text-[12px] font-semibold text-gray-800 capitalize">{editor.selected.type}</span>
				<div class="flex gap-1">
					<button onclick={() => editor.moveBlock(editor.selectedId!, 'up')} class="w-[22px] h-[22px] flex items-center justify-center border border-gray-200 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-50 bg-white text-[10px]">
						<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="2,6.5 5,3.5 8,6.5"/></svg>
					</button>
					<button onclick={() => editor.moveBlock(editor.selectedId!, 'down')} class="w-[22px] h-[22px] flex items-center justify-center border border-gray-200 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-50 bg-white text-[10px]">
						<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="2,3.5 5,6.5 8,3.5"/></svg>
					</button>
					<button onclick={() => editor.duplicateBlock(editor.selectedId!)} class="w-[22px] h-[22px] flex items-center justify-center border border-gray-200 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-50 bg-white text-[10px]">
						<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="3" width="5.5" height="5.5" rx="0.8"/><path d="M3 7H2.2a.7.7 0 01-.7-.7V2.2a.7.7 0 01.7-.7h4.1a.7.7 0 01.7.7V3"/></svg>
					</button>
					<button onclick={() => editor.removeBlock(editor.selectedId!)} class="w-[22px] h-[22px] flex items-center justify-center border border-red-200 rounded text-red-400 hover:text-red-600 hover:bg-red-50 bg-white text-[10px]">
						<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.3"><line x1="2" y1="3" x2="8" y2="3"/><path d="M3.5 3V2.2a.5.5 0 01.5-.5h2a.5.5 0 01.5.5V3"/><path d="M2.8 3l.4 5a.5.5 0 00.5.5h2.6a.5.5 0 00.5-.5l.4-5"/></svg>
					</button>
				</div>
			</div>

			<!-- Property editors based on block type -->
			{#if editor.selected.type === 'heading' || editor.selected.type === 'subheading' || editor.selected.type === 'content' || editor.selected.type === 'footer'}
				{@const p = editor.selected.props}
				<!-- Text props -->
				<div class="px-3.5 py-3 border-b border-gray-100">
					<div class="text-[11px] font-semibold text-gray-800 mb-2">Content</div>
					<textarea
						class="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-[11px] text-gray-700 resize-none focus:outline-none focus:border-[var(--color-brand)] transition-colors"
						rows="3"
						value={p.text}
						oninput={(e) => propInput('text', e.currentTarget.value)}
					></textarea>
				</div>
				<div class="px-3.5 py-3 border-b border-gray-100">
					<div class="text-[11px] font-semibold text-gray-800 mb-2">Typography</div>
					<div class="flex items-center gap-2 mb-2">
						<span class="text-[10px] text-gray-400 w-[35px]">Size</span>
						<input type="number" class="bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-[11px] text-gray-700 w-[50px] focus:outline-none focus:border-[var(--color-brand)]" value={p.fontSize} oninput={(e) => propInput('fontSize', parseInt(e.currentTarget.value) || 14)} />
						<span class="text-[10px] text-gray-400">px</span>
					</div>
					<div class="flex items-center gap-2 mb-2">
						<span class="text-[10px] text-gray-400 w-[35px]">Color</span>
						<input type="color" class="w-6 h-6 rounded border border-gray-200 cursor-pointer" value={p.color} oninput={(e) => propInput('color', e.currentTarget.value)} />
						<span class="text-[10px] text-gray-500">{p.color}</span>
					</div>
					<div class="flex items-center gap-2">
						<span class="text-[10px] text-gray-400 w-[35px]">Align</span>
						<div class="flex gap-[3px] flex-1">
							{#each ['left', 'center', 'right'] as align}
								<button onclick={() => propInput('align', align)}
									class="flex-1 py-1 border rounded-md text-[10px] text-center transition-all
										{p.align === align ? 'border-[var(--color-brand)] bg-[var(--color-brand-light)] text-[var(--color-brand)]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}">
									{align}
								</button>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			{#if editor.selected.type === 'button'}
				{@const p = editor.selected.props}
				<!-- Button props -->
				<div class="px-3.5 py-3 border-b border-gray-100">
					<div class="text-[11px] font-semibold text-gray-800 mb-2">Button</div>
					<div class="mb-2">
						<div class="text-[10px] text-gray-400 mb-1">Label</div>
						<input type="text" class="w-full bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 text-[11px] text-gray-700 focus:outline-none focus:border-[var(--color-brand)]" value={p.text} oninput={(e) => propInput('text', e.currentTarget.value)} />
					</div>
					<div class="mb-2">
						<div class="text-[10px] text-gray-400 mb-1">Link URL</div>
						<input type="text" class="w-full bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 text-[11px] text-gray-700 focus:outline-none focus:border-[var(--color-brand)]" value={p.href} oninput={(e) => propInput('href', e.currentTarget.value)} />
					</div>
					<div class="flex items-center gap-2 mb-2">
						<span class="text-[10px] text-gray-400 w-[35px]">BG</span>
						<input type="color" class="w-6 h-6 rounded border border-gray-200 cursor-pointer" value={p.backgroundColor} oninput={(e) => propInput('backgroundColor', e.currentTarget.value)} />
						<span class="text-[10px] text-gray-500">{p.backgroundColor}</span>
					</div>
					<div class="flex items-center gap-2 mb-2">
						<span class="text-[10px] text-gray-400 w-[35px]">Text</span>
						<input type="color" class="w-6 h-6 rounded border border-gray-200 cursor-pointer" value={p.color} oninput={(e) => propInput('color', e.currentTarget.value)} />
						<span class="text-[10px] text-gray-500">{p.color}</span>
					</div>
					<div class="flex items-center gap-2">
						<span class="text-[10px] text-gray-400 w-[35px]">Round</span>
						<input type="number" class="bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-[11px] text-gray-700 w-[50px] focus:outline-none focus:border-[var(--color-brand)]" value={p.borderRadius} oninput={(e) => propInput('borderRadius', parseInt(e.currentTarget.value) || 0)} />
						<span class="text-[10px] text-gray-400">px</span>
					</div>
				</div>
			{/if}

			{#if editor.selected.type === 'image'}
				{@const p = editor.selected.props}
				<!-- Image props -->
				<div class="px-3.5 py-3 border-b border-gray-100">
					<div class="text-[11px] font-semibold text-gray-800 mb-2">Image</div>
					<div class="mb-2">
						<div class="text-[10px] text-gray-400 mb-1">Source URL</div>
						<input type="text" class="w-full bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 text-[11px] text-gray-700 focus:outline-none focus:border-[var(--color-brand)]" value={p.src} oninput={(e) => propInput('src', e.currentTarget.value)} />
					</div>
					<div class="mb-2">
						<div class="text-[10px] text-gray-400 mb-1">Alt text</div>
						<input type="text" class="w-full bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 text-[11px] text-gray-700 focus:outline-none focus:border-[var(--color-brand)]" value={p.alt} oninput={(e) => propInput('alt', e.currentTarget.value)} />
					</div>
					<div class="flex items-center gap-2">
						<span class="text-[10px] text-gray-400 w-[35px]">Width</span>
						<input type="number" class="bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-[11px] text-gray-700 w-[50px] focus:outline-none focus:border-[var(--color-brand)]" value={p.width} oninput={(e) => propInput('width', parseInt(e.currentTarget.value) || 600)} />
						<span class="text-[10px] text-gray-400">px</span>
					</div>
				</div>
			{/if}

			{#if editor.selected.type === 'list'}
				{@const p = editor.selected.props}
				<!-- List props -->
				<div class="px-3.5 py-3 border-b border-gray-100">
					<div class="text-[11px] font-semibold text-gray-800 mb-2">List Items</div>
					{#each p.items as item, i}
						<div class="flex items-center gap-1 mb-1.5">
							<span class="text-[10px] text-gray-400 w-4">{i + 1}</span>
							<input type="text" class="flex-1 bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-[11px] text-gray-700 focus:outline-none focus:border-[var(--color-brand)]" value={item} oninput={(e) => {
								const items = [...p.items];
								items[i] = e.currentTarget.value;
								propInput('items', items);
							}} />
							<button onclick={() => {
								const items = p.items.filter((_: any, j: number) => j !== i);
								propInput('items', items);
							}} class="text-red-300 hover:text-red-500 text-[10px]">x</button>
						</div>
					{/each}
					<button onclick={() => propInput('items', [...p.items, 'New item'])}
						class="text-[10px] text-[var(--color-brand)] font-medium hover:underline mt-1">+ Add item</button>
				</div>
			{/if}

			{#if editor.selected.type === 'section'}
				{@const p = editor.selected.props}
				<!-- Section props -->
				<div class="px-3.5 py-3 border-b border-gray-100">
					<div class="text-[11px] font-semibold text-gray-800 mb-2">Background</div>
					<div class="flex items-center gap-2">
						<input type="color" class="w-6 h-6 rounded border border-gray-200 cursor-pointer" value={p.backgroundColor} oninput={(e) => propInput('backgroundColor', e.currentTarget.value)} />
						<span class="text-[10px] text-gray-500">{p.backgroundColor}</span>
					</div>
				</div>
			{/if}

			<!-- Spacing (shared by all blocks) -->
			<div class="px-3.5 py-3 border-b border-gray-100">
				<div class="text-[11px] font-semibold text-gray-800 mb-2">Spacing</div>
				<div class="grid grid-cols-2 gap-2">
					{#each [['Top', 'paddingTop'], ['Right', 'paddingRight'], ['Bottom', 'paddingBottom'], ['Left', 'paddingLeft']] as [label, key]}
						<div class="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md px-2 py-1">
							<span class="text-[9px] text-gray-400 w-4">{label.charAt(0)}</span>
							<input type="number" class="bg-transparent text-[11px] text-gray-700 w-full focus:outline-none" value={editor.selected?.props[key] ?? 0} oninput={(e) => propInput(key, parseInt(e.currentTarget.value) || 0)} />
						</div>
					{/each}
				</div>
			</div>
		</div>
	{:else}
		<!-- No selection -->
		<div class="flex-1 flex items-center justify-center">
			<p class="text-[12px] text-gray-400 text-center px-6">Select a block in the canvas or layers panel to edit its properties.</p>
		</div>
	{/if}
</div>

</div>
</div>
