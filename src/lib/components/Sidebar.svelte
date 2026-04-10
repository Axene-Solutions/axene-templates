<script lang="ts">
	import { editor } from '$lib/store.svelte';
	import { blockDefs, type BlockType } from '$lib/blocks';

	let activeTab = $state<'layers' | 'blocks'>('blocks');
	let searchQuery = $state('');
	let selectedBlockType = $state<BlockType>('button');

	function handleBlockClick(type: BlockType) {
		selectedBlockType = type;
		editor.addBlock(type);
	}

	function handleDragStart(e: DragEvent, type: BlockType) {
		e.dataTransfer?.setData('text/plain', type);
	}

	const filteredDefs = $derived(
		searchQuery
			? blockDefs.filter(d => d.label.toLowerCase().includes(searchQuery.toLowerCase()))
			: blockDefs
	);
</script>

<aside class="w-[178px] bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-hidden">
	<!-- Header -->
	<div class="flex items-center gap-1.5 px-3 py-[11px] border-b border-gray-100">
		<button class="text-gray-400 hover:text-gray-600 shrink-0">
			<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="9,2 4,7 9,12" />
			</svg>
		</button>
		<span class="text-xs font-medium text-gray-800 truncate flex-1">{editor.templateName}</span>
		<button class="text-gray-400 hover:text-gray-600 shrink-0">
			<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="3,4 5,6 7,4" />
			</svg>
		</button>
		<button class="text-gray-400 hover:text-gray-600 shrink-0">
			<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
				<rect x="1" y="1" width="5" height="5" rx="0.5" />
				<rect x="8" y="1" width="5" height="5" rx="0.5" />
				<rect x="1" y="8" width="5" height="5" rx="0.5" />
				<rect x="8" y="8" width="5" height="5" rx="0.5" />
			</svg>
		</button>
	</div>

	<!-- Tabs -->
	<div class="flex border-b border-gray-100">
		<button
			class="flex-1 text-xs py-2 text-center transition-colors {activeTab === 'layers' ? 'text-gray-900 font-medium border-b-2 border-gray-900' : 'text-gray-400'}"
			onclick={() => activeTab = 'layers'}
		>
			Layers
		</button>
		<button
			class="flex-1 text-xs py-2 text-center transition-colors {activeTab === 'blocks' ? 'text-gray-900 font-medium border-b-2 border-gray-900' : 'text-gray-400'}"
			onclick={() => activeTab = 'blocks'}
		>
			Blocks
		</button>
	</div>

	{#if activeTab === 'blocks'}
		<!-- Pills row -->
		<div class="flex items-center gap-1.5 px-3 py-2.5">
			<span class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-900 text-white">Block</span>
			<span class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Recipients</span>
			<span class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Tags</span>
		</div>

		<!-- Search bar -->
		<div class="px-3 pb-2.5">
			<div class="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5">
				<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#9ca3af" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="5.5" cy="5.5" r="3.5" />
					<line x1="8" y1="8" x2="11" y2="11" />
				</svg>
				<input
					type="text"
					placeholder="Search blocks..."
					class="flex-1 bg-transparent text-[11px] text-gray-700 placeholder:text-gray-400 outline-none min-w-0"
					bind:value={searchQuery}
				/>
				<span class="text-[9px] text-gray-400 bg-gray-100 px-1 py-0.5 rounded shrink-0">&#8984;K</span>
			</div>
		</div>

		<!-- Blocks content -->
		<div class="flex-1 overflow-y-auto px-3 pb-3">
			<!-- Section header -->
			<div class="flex items-center justify-between mb-2">
				<span class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Block</span>
				<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#9ca3af" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="3,4 5,6 7,4" />
				</svg>
			</div>

			<!-- Block cards grid -->
			<div class="grid grid-cols-2 gap-1.5">
				{#each filteredDefs as def}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="border rounded-lg p-2.5 cursor-pointer transition-all {selectedBlockType === def.type ? 'border-[#1daa82] bg-[#f0fbf7]' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}"
						onclick={() => handleBlockClick(def.type)}
						ondragstart={(e) => handleDragStart(e, def.type)}
						draggable="true"
						role="button"
						tabindex="0"
					>
						<!-- Visual preview -->
						<div class="h-10 mb-1.5 flex flex-col justify-center items-center">
							{#if def.type === 'header'}
								<div class="w-full h-7 bg-[#1daa82] rounded-sm flex items-center justify-center">
									<div class="w-8 h-1 bg-white/80 rounded-full"></div>
								</div>
							{:else if def.type === 'heading'}
								<div class="w-10 h-1.5 bg-gray-400 rounded-full mb-1"></div>
								<div class="w-6 h-1 bg-gray-300 rounded-full"></div>
							{:else if def.type === 'subheading'}
								<div class="w-9 h-1 bg-gray-400 rounded-full mb-1"></div>
								<div class="w-12 h-0.5 bg-gray-200 rounded-full mb-0.5"></div>
								<div class="w-10 h-0.5 bg-gray-200 rounded-full"></div>
							{:else if def.type === 'content'}
								<div class="w-full space-y-1 px-1">
									<div class="w-full h-0.5 bg-gray-300 rounded-full"></div>
									<div class="w-full h-0.5 bg-gray-300 rounded-full"></div>
									<div class="w-full h-0.5 bg-gray-300 rounded-full"></div>
									<div class="w-8 h-0.5 bg-gray-300 rounded-full"></div>
								</div>
							{:else if def.type === 'image'}
								<div class="w-full h-8 bg-gray-100 rounded-sm flex items-center justify-center overflow-hidden">
									<svg width="20" height="16" viewBox="0 0 20 16" fill="none">
										<rect width="20" height="16" rx="1" fill="#e5e7eb" />
										<circle cx="6" cy="5" r="2" fill="#d1d5db" />
										<polygon points="2,14 8,8 12,12 14,10 18,14" fill="#d1d5db" />
									</svg>
								</div>
							{:else if def.type === 'list'}
								<div class="w-full space-y-1 px-1">
									<div class="flex items-center gap-1">
										<div class="w-1 h-1 rounded-full bg-gray-400 shrink-0"></div>
										<div class="w-10 h-0.5 bg-gray-300 rounded-full"></div>
									</div>
									<div class="flex items-center gap-1">
										<div class="w-1 h-1 rounded-full bg-gray-400 shrink-0"></div>
										<div class="w-8 h-0.5 bg-gray-300 rounded-full"></div>
									</div>
									<div class="flex items-center gap-1">
										<div class="w-1 h-1 rounded-full bg-gray-400 shrink-0"></div>
										<div class="w-9 h-0.5 bg-gray-300 rounded-full"></div>
									</div>
								</div>
							{:else if def.type === 'button'}
								<div class="space-y-1.5 flex flex-col items-center">
									<div class="w-8 h-0.5 bg-gray-300 rounded-full"></div>
									<div class="w-10 h-3.5 bg-[#1daa82] rounded-sm"></div>
								</div>
							{:else if def.type === 'section'}
								<div class="w-full h-7 border border-gray-300 rounded-sm flex items-center justify-center">
									<div class="w-8 h-4 bg-gray-100 rounded-sm"></div>
								</div>
							{:else if def.type === 'footer'}
								<div class="w-full flex flex-col items-center justify-end h-full">
									<div class="w-10 h-0.5 bg-gray-300 rounded-full mb-0.5"></div>
									<div class="w-7 h-0.5 bg-gray-300 rounded-full"></div>
								</div>
							{/if}
						</div>
						<div class="text-[10px] text-gray-600 text-center font-medium">{def.label}</div>
					</div>
				{/each}
			</div>

			<!-- Template section -->
			<div class="mt-4">
				<div class="flex items-center justify-between mb-2">
					<span class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Template</span>
				</div>
				<div class="grid grid-cols-2 gap-1.5">
					<div class="border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all">
						<div class="h-16 bg-gradient-to-br from-emerald-100 to-teal-200"></div>
						<div class="px-1.5 py-1">
							<div class="text-[9px] text-gray-500 truncate">Welcome</div>
						</div>
					</div>
					<div class="border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all">
						<div class="h-16 bg-gradient-to-br from-blue-100 to-indigo-200"></div>
						<div class="px-1.5 py-1">
							<div class="text-[9px] text-gray-500 truncate">Newsletter</div>
						</div>
					</div>
				</div>
			</div>
		</div>

	{:else}
		<!-- Layers tab content -->
		<div class="flex-1 overflow-y-auto">
			{#each editor.blocks as block, i (block.id)}
				<button
					class="w-full text-left px-3 py-2 text-[11px] flex items-center gap-2 transition-colors {editor.selectedId === block.id ? 'bg-[#edf8f4] text-[#1daa82]' : 'text-gray-600 hover:bg-gray-50'}"
					onclick={() => editor.selectBlock(block.id)}
				>
					<span class="text-[9px] text-gray-400 w-3 text-right shrink-0">{i + 1}</span>
					<span class="capitalize truncate">{block.type}</span>
				</button>
			{/each}
		</div>
	{/if}
</aside>
