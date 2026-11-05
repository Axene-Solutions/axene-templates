<script lang="ts">
	import { editor } from '$lib/store.svelte';
	import { blockDefs, type BlockType } from '$lib/blocks';
	import Icon from './Icon.svelte';

	let activeTab = $state<'layers' | 'blocks'>('blocks');
	let searchQuery = $state('');
	let selectedBlockType = $state<BlockType>('button');
	let editingName = $state(false);
	let nameInput = $state<HTMLInputElement | null>(null);

	function startNameEdit() {
		editingName = true;
		// Focus the input after Svelte renders it
		setTimeout(() => nameInput?.select(), 0);
	}

	function finishNameEdit() {
		editingName = false;
	}

	function handleNameKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') { finishNameEdit(); }
		if (e.key === 'Escape') { editor.templateName = editor.templateName; finishNameEdit(); }
	}

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

	// Check if header/footer already exist (to disable those cards)
	const hasHeader = $derived(editor.blocks.some(b => b.type === 'header'));
	const hasFooter = $derived(editor.blocks.some(b => b.type === 'footer'));
</script>

<div class="sidebar">
	<!-- Header -->
	<div class="sb-header">
		<a class="sb-back" href="/templates" title="Back to templates" aria-label="Back to templates">
			<Icon name="chevron-left" width={14} height={14} />
		</a>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="sb-title" ondblclick={startNameEdit}>
			{#if editingName}
				<input
					class="sb-name-input"
					bind:this={nameInput}
					bind:value={editor.templateName}
					onblur={finishNameEdit}
					onkeydown={handleNameKeydown}
				/>
			{:else}
				<span class="sb-name-text" title="Double-click to rename">{editor.templateName}</span>
				<div style="color: var(--color-muted);"><Icon name="chevron-down" width={10} height={10} /></div>
			{/if}
		</div>
	</div>

	<!-- Tabs -->
	<div class="sb-tabs">
		<button class="sb-tab" class:active={activeTab === 'layers'} onclick={() => activeTab = 'layers'}>Layers</button>
		<button class="sb-tab" class:active={activeTab === 'blocks'} onclick={() => activeTab = 'blocks'}>Blocks</button>
	</div>

	<!-- Pills -->
	<div class="sb-pills hidden!">
		<span class="sb-pill active">Block</span>
		<span class="sb-pill">Recipients</span>
		<span class="sb-pill">Tags</span>
	</div>

	<!-- Search -->
	<div class="sb-search mt-4!">
		<input type="text" placeholder="Search..." bind:value={searchQuery} />
			<div style="color: var(--color-muted);"><Icon name="search" width={13} height={13} /></div>
	</div>
	<div class="sb-scroll overflow-y-scroll! max-h-[90vh]! overflow-x-clip!">
		{#if activeTab === 'blocks'}
			<!-- Block section -->
			<div class="sb-section-hdr">
				<span>Block</span>
				<div style="color: var(--color-muted);"><Icon name="chevron-down" width={10} height={10} /></div>
			</div>

			<div class="blocks-grid">
				{#each filteredDefs as def}
					{@const disabled = (def.type === 'header' && hasHeader) || (def.type === 'footer' && hasFooter)}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="block-card"
						class:selected={selectedBlockType === def.type}
						class:disabled
						onclick={() => !disabled && handleBlockClick(def.type)}
						ondragstart={(e) => handleDragStart(e, def.type)}
						draggable={!disabled ? "true" : "false"}
						role="button"
						tabindex="0"
						onkeydown={() => {}}
					>
						<div class="block-preview opacity-50">
							{#if def.type === 'header'}
								<div style="width:100%;height:28px;background:var(--color-accent);border-radius:2px;display:flex;align-items:center;justify-content:center;gap:4px;">
									<div style="width:8px;height:8px;border-radius:2px;background:var(--color-bg);"></div>
									<div style="width:24px;height:3px;background:var(--color-bg);border-radius:1px;"></div>
								</div>
							{:else if def.type === 'heading'}
								<div style="width:100%;display:flex;flex-direction:column;gap:3px;align-items:center;">
									<div style="width:85%;height:5px;background:var(--color-muted-soft);border-radius:1px;"></div>
									<div style="width:55%;height:3px;background:var(--color-muted-soft);border-radius:1px;"></div>
								</div>
							{:else if def.type === 'subheading'}
								<div style="width:100%;display:flex;flex-direction:column;gap:2.5px;align-items:center;">
									<div style="width:75%;height:3.5px;background:var(--color-muted-soft);border-radius:1px;"></div>
									<div style="width:90%;height:2.5px;background:var(--color-muted-soft);border-radius:1px;"></div>
									<div style="width:60%;height:2.5px;background:var(--color-muted-soft);border-radius:1px;"></div>
								</div>
							{:else if def.type === 'content'}
								<div style="width:100%;display:flex;flex-direction:column;gap:2.5px;">
									<div style="width:95%;height:2.5px;background:var(--color-muted-soft);border-radius:1px;"></div>
									<div style="width:95%;height:2.5px;background:var(--color-muted-soft);border-radius:1px;"></div>
									<div style="width:95%;height:2.5px;background:var(--color-muted-soft);border-radius:1px;"></div>
									<div style="width:60%;height:2.5px;background:var(--color-muted-soft);border-radius:1px;"></div>
								</div>
							{:else if def.type === 'image'}
								<div class="img-preview">
									<div class="img-sun"></div>
									<div class="img-mtn"></div>
								</div>
							{:else if def.type === 'list'}
								<div style="width:100%;display:flex;flex-direction:column;gap:5px;">
									<div style="display:flex;align-items:center;gap:4px;"><div class="list-dot"></div><div style="flex:1;height:2.5px;background:var(--color-muted-soft);border-radius:1px;"></div></div>
									<div style="display:flex;align-items:center;gap:4px;"><div class="list-dot"></div><div style="flex:1;height:2.5px;background:var(--color-muted-soft);border-radius:1px;"></div></div>
									<div style="display:flex;align-items:center;gap:4px;"><div class="list-dot"></div><div style="width:70%;height:2.5px;background:var(--color-muted-soft);border-radius:1px;"></div></div>
								</div>
							{:else if def.type === 'button'}
								<div style="width:100%;display:flex;flex-direction:column;gap:5px;align-items:center;">
									<div style="width:80%;height:3px;background:var(--color-muted-soft);border-radius:1px;"></div>
									<div style="width:100%;height:10px;background:var(--color-accent);border-radius:3px;"></div>
								</div>
							{:else if def.type === 'table'}
								<div style="width:100%;display:flex;flex-direction:column;gap:0;">
									<div style="display:flex;gap:1px;">
										<div style="flex:1;height:5px;background:var(--color-muted-soft);border-radius:1px 0 0 0;"></div>
										<div style="flex:1;height:5px;background:var(--color-muted-soft);border-radius:0 1px 0 0;"></div>
									</div>
									<div style="display:flex;gap:1px;margin-top:1px;">
										<div style="flex:1;height:4px;background:var(--color-muted-soft);"></div>
										<div style="flex:1;height:4px;background:var(--color-muted-soft);"></div>
									</div>
									<div style="display:flex;gap:1px;margin-top:1px;">
										<div style="flex:1;height:4px;background:var(--color-muted-soft);border-radius:0 0 0 1px;"></div>
										<div style="flex:1;height:4px;background:var(--color-muted-soft);border-radius:0 0 1px 0;"></div>
									</div>
								</div>
							{:else if def.type === 'section'}
								<div class="section-preview"><div class="section-inner"></div></div>
							{:else if def.type === 'footer'}
								<div style="width:100%;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;">
									<div style="width:60%;height:1px;background:var(--color-muted-soft);margin-bottom:4px;"></div>
									<div style="width:80%;height:2.5px;background:var(--color-muted-soft);border-radius:1px;margin-bottom:2px;"></div>
									<div style="width:50%;height:2.5px;background:var(--color-muted-soft);border-radius:1px;"></div>
								</div>
							{/if}
						</div>
						<span class="block-name">{def.label}</span>
					</div>
				{/each}
			</div>

			<!-- Template section -->
			<div class="sb-section-hdr" style="margin-top:8px;">
				<span>Template</span>
				<div style="color: var(--color-muted);"><Icon name="chevron-down" width={10} height={10} /></div>
			</div>
			<div class="template-grid">
				<div class="tpl-card">
					<div class="tpl-img v1"><div class="tpl-streets"></div></div>
					<div class="tpl-body">
						<div class="tpl-heading">Heading</div>
						<div class="tpl-text-line"></div>
						<div class="tpl-text-line short"></div>
					</div>
					<div class="tpl-footer"><span class="tpl-btn">Button</span></div>
				</div>
				<div class="tpl-card">
					<div class="tpl-img v2"><div class="tpl-streets"></div></div>
					<div class="tpl-body">
						<div class="tpl-heading">Heading</div>
						<div class="tpl-text-line"></div>
						<div class="tpl-text-line short"></div>
					</div>
					<div class="tpl-footer"><span class="tpl-btn">Button</span></div>
				</div>
			</div>

		{:else}
			<!-- Layers tab -->
			<div style="padding:4px 0;">
				{#each editor.blocks as block, i (block.id)}
					<button
						class="layer-item"
						class:active={editor.selectedId === block.id}
						onclick={() => editor.selectBlock(block.id)}
					>
						<span class="layer-idx">{i + 1}</span>
						<span class="layer-name">{block.type}</span>
						{#if block.type === 'header'}<span class="layer-badge">H</span>{/if}
						{#if block.type === 'footer'}<span class="layer-badge">F</span>{/if}
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.sidebar {
		width: 178px;
		background: var(--color-surface);
		border-right: 1px solid var(--color-border-1);
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
		overflow: hidden;
		font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif;
	}

	/* Header */
	.sb-header {
		padding: 11px 12px 9px;
		border-bottom: 1px solid var(--color-border-1);
		display: flex;
		align-items: center;
		gap: 5px;
	}
	.sb-back { color: var(--color-muted); background: none; border: none; cursor: pointer; display: flex; align-items: center; padding: 0; text-decoration: none; transition: color 0.15s; }
	.sb-back:hover { color: var(--color-accent-ink); }
	.sb-title { font-size: 13px; font-weight: 500; color: var(--color-text); display: flex; align-items: center; gap: 3px; flex: 1; overflow: hidden; white-space: nowrap; cursor: default; }
	.sb-name-text { overflow: hidden; text-overflow: ellipsis; }
	.sb-name-input {
		border: 1px solid var(--color-accent);
		border-radius: 4px;
		padding: 1px 5px;
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text);
		outline: none;
		width: 100%;
		background: var(--color-surface);
		font-family: inherit;
	}

	/* Tabs */
	.sb-tabs { display: flex; gap: 18px; padding: 9px 13px 0; border-bottom: 1px solid var(--color-border-1); }
	.sb-tab { font-size: 12.5px; color: var(--color-muted-soft); padding-bottom: 7px; cursor: pointer; border: none; background: none; border-bottom: 2px solid transparent; line-height: 1; }
	.sb-tab.active { color: var(--color-text); font-weight: 500; border-bottom-color: var(--color-text); }

	/* Pills */
	.sb-pills { display: flex; gap: 5px; padding: 8px 10px; }
	.sb-pill { font-size: 11px; padding: 3px 11px; border-radius: 20px; border: 1px solid var(--color-border-1); background: var(--color-surface); color: var(--color-muted); cursor: pointer; line-height: 1.4; }
	.sb-pill.active { background: var(--color-text); color: var(--color-bg); border-color: var(--color-text); }

	/* Search */
	.sb-search { margin: 0 10px 8px; border: 1px solid var(--color-border-1); border-radius: 7px; padding: 5px 9px; display: flex; align-items: center; gap: 6px; background: var(--color-surface-2); }
	.sb-search input { border: none; background: transparent; font-size: 11.5px; color: var(--color-muted-soft); outline: none; flex: 1; width: 0; font-family: inherit; }
	.sb-search input::placeholder { color: var(--color-muted-soft); }
	.kbd { font-size: 9px; color: var(--color-text); border: 1px solid var(--color-border-1); border-radius: 3px; padding: 1px 4px; line-height: 1.4; }

	/* Section header */
	.sb-section-hdr { padding: 4px 12px 6px; display: flex; align-items: center; justify-content: space-between; }
	.sb-section-hdr span { font-size: 12px; font-weight: 500; color: var(--color-text); }

	/* Scroll area */
	.sb-scroll { flex: 1; overflow-y: auto; padding-bottom: 8px; max-height: 90vh !important; }
	.sb-scroll::-webkit-scrollbar { width: 0; }

	/* Block grid */
	.blocks-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; padding: 0 9px; }
	.block-card {
		border: 1px solid var(--color-border-1);
		border-radius: 8px;
		padding: 9px 7px 6px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 5px;
		cursor: pointer;
		background: var(--color-surface);
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	.block-card:hover { border-color: var(--color-border-1); box-shadow: 0 1px 4px color-mix(in srgb, var(--color-text) 6%, transparent); }
	.block-card.selected { border: 1.5px solid var(--color-accent); background: var(--color-accent-soft); box-shadow: 0 0 0 3px var(--color-accent-soft); }
	.block-card.disabled { opacity: 0.4; cursor: not-allowed; }
	.block-card.disabled:hover { border-color: var(--color-border-1); box-shadow: none; }
	.block-preview { width: 50px; height: 30px; display: flex; flex-direction: column; justify-content: center; align-items: center; }
	.block-name { font-size: 10.5px; color: var(--color-muted); }
	.block-card.selected .block-name { color: var(--color-accent-ink); font-weight: 500; }

	/* Block preview shapes */
	.img-preview { width: 50px; height: 30px; border: 1.5px solid var(--color-muted-soft); border-radius: 3px; position: relative; overflow: hidden; }
	.img-mtn { position: absolute; bottom: 0; left: 0; right: 0; height: 16px; background: var(--color-border-1); clip-path: polygon(0 100%, 30% 20%, 60% 60%, 80% 30%, 100% 60%, 100% 100%); }
	.img-sun { position: absolute; top: 4px; left: 6px; width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid var(--color-muted-soft); }
	.list-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--color-muted-soft); flex-shrink: 0; }
	.section-preview { width: 26px; height: 30px; border: 1.5px solid var(--color-muted-soft); border-radius: 3px; display: flex; flex-direction: column; justify-content: flex-end; padding: 2px; }
	.section-inner { height: 10px; background: var(--color-muted-soft); border-radius: 2px; }

	/* Template cards */
	.template-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; padding: 4px 9px 10px; }
	.tpl-card { border: 1px solid var(--color-border-1); border-radius: 8px; overflow: hidden; cursor: pointer; transition: transform 0.15s; }
	.tpl-card:hover { transform: translateY(-1px); border-color: var(--color-accent); }
	.tpl-img { height: 48px; overflow: hidden; }
	.tpl-img.v1 { background: linear-gradient(135deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 60%, var(--color-text))); }
	.tpl-img.v2 { background: linear-gradient(135deg, var(--color-info), color-mix(in srgb, var(--color-info) 60%, var(--color-text))); }
	.tpl-streets { width: 100%; height: 100%; background: repeating-linear-gradient(0deg, color-mix(in srgb, var(--color-text) 6%, transparent) 0px, color-mix(in srgb, var(--color-text) 6%, transparent) 1px, transparent 1px, transparent 8px), repeating-linear-gradient(90deg, color-mix(in srgb, var(--color-text) 4%, transparent) 0px, color-mix(in srgb, var(--color-text) 4%, transparent) 1px, transparent 1px, transparent 12px); }
	.tpl-body { padding: 5px 6px 3px; }
	.tpl-heading { font-size: 9px; font-weight: 600; color: var(--color-text); margin-bottom: 3px; }
	.tpl-text-line { height: 2px; background: var(--color-muted-soft); border-radius: 1px; margin-bottom: 2px; }
	.tpl-text-line.short { width: 66%; }
	.tpl-footer { padding: 3px 6px 6px; }
	.tpl-btn { display: inline-block; font-size: 8px; padding: 2px 10px; background: var(--color-accent); color: #101010; border-radius: 3px; font-weight: 500; }

	/* Layers */
	.layer-item {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border: none;
		background: none;
		cursor: pointer;
		font-size: 11.5px;
		color: var(--color-muted);
		text-transform: capitalize;
		font-family: inherit;
		text-align: left;
		transition: background 0.1s;
	}
	.layer-item:hover { background: var(--color-surface-2); }
	.layer-item.active { background: var(--color-accent-soft); color: var(--color-accent-ink); }
	.layer-idx { font-size: 9px; color: var(--color-muted-soft); width: 14px; text-align: right; flex-shrink: 0; }
	.layer-name { flex: 1; }
	.layer-badge { font-size: 8px; color: var(--color-muted-soft); background: var(--color-border-1); border-radius: 3px; padding: 1px 4px; font-weight: 600; }
</style>
