<script lang="ts">
	import { onMount } from 'svelte';
	import { editor } from '$lib/store.svelte';
	import { blockDefs, type BlockType } from '$lib/blocks';

	let sidebarTab = $state<'layers' | 'blocks'>('blocks');
	let rightTab = $state<'customize' | 'styles'>('customize');
	let sidebarPill = $state<'block' | 'recipients' | 'tags'>('block');
	let selectedBlockCard = $state<BlockType | null>('button');
	let saving = $state(false);

	onMount(() => editor.compile());

	async function handleSave() {
		saving = true;
		await editor.saveTemplate();
		saving = false;
	}

	function propInput(key: string, value: any) {
		if (!editor.selectedId) return;
		editor.updateProp(editor.selectedId, key, value);
	}
</script>

<svelte:head>
	<title>{editor.templateName} - Axene Templates</title>
</svelte:head>

<div class="window">
<div class="app">

<!-- ==================== NAV RAIL ==================== -->
<div class="nav-rail">
	<div class="window-dots">
		<span class="dot dot-red"></span>
		<span class="dot dot-yellow"></span>
		<span class="dot dot-green"></span>
	</div>

	<!-- Logo -->
	<div class="logo">
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
			<rect x="1" y="1" width="5" height="5" rx="1" fill="white"/>
			<rect x="8" y="1" width="5" height="5" rx="1" fill="white"/>
			<rect x="1" y="8" width="5" height="5" rx="1" fill="white"/>
			<rect x="8" y="8" width="5" height="5" rx="1" fill="white"/>
		</svg>
	</div>

	<!-- Nav buttons -->
	<button class="nav-btn">
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1" y="1" width="5" height="5" rx="1"/><rect x="8" y="1" width="5" height="5" rx="1"/><rect x="1" y="8" width="5" height="5" rx="1"/><rect x="8" y="8" width="5" height="5" rx="1"/></svg>
	</button>
	<button class="nav-btn">
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><polyline points="1,11 4,6 7,8 10,3 13,11"/></svg>
	</button>
	<button class="nav-btn">
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1" y="3" width="3" height="8" rx="0.5"/><rect x="5.5" y="5" width="3" height="6" rx="0.5"/><rect x="10" y="1" width="3" height="10" rx="0.5"/></svg>
	</button>
	<button class="nav-btn active">
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1" y="3" width="12" height="8.5" rx="1.5"/><polyline points="1,5.5 7,9 13,5.5"/></svg>
	</button>
	<button class="nav-btn">
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="7" cy="4.5" r="3"/><path d="M1.5 13c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5"/></svg>
	</button>
	<button class="nav-btn">
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M7 1l2.5 2.5H12v2.5L14 7l-2 1v2.5H9.5L7 13l-2.5-2.5H2V8L0 7l2-1V3.5h2.5z"/><circle cx="7" cy="7" r="2"/></svg>
	</button>

	<div class="nav-spacer"></div>

	<button class="nav-btn">
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="7" cy="7" r="2.5"/><path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.8 2.8l1.4 1.4M9.8 9.8l1.4 1.4M2.8 11.2l1.4-1.4M9.8 4.2l1.4-1.4"/></svg>
	</button>
	<button class="nav-btn">
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="7" cy="7" r="5.5"/><polyline points="7,4 7,7 9.5,8.5"/></svg>
	</button>

	<!-- Avatar -->
	<div class="avatar">
		<svg viewBox="0 0 28 28" fill="none" width="28" height="28"><circle cx="14" cy="10" r="5" fill="#bbb"/><path d="M3 26c0-6.1 4.9-11 11-11s11 4.9 11 11" fill="#bbb"/></svg>
	</div>
</div>

<!-- ==================== SIDEBAR ==================== -->
<div class="sidebar">
	<!-- Header -->
	<div class="sidebar-header">
		<button class="sidebar-back">
			<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="7,2 3,6 7,10"/></svg>
		</button>
		<span class="sidebar-title">Verify Mail</span>
		<button class="sidebar-chevron">
			<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="2,3.5 5,6.5 8,3.5"/></svg>
		</button>
		<div style="flex:1"></div>
		<button class="sidebar-grid-toggle">
			<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="1" y="1" width="4.5" height="4.5" rx="1"/><rect x="7.5" y="1" width="4.5" height="4.5" rx="1"/><rect x="1" y="7.5" width="4.5" height="4.5" rx="1"/><rect x="7.5" y="7.5" width="4.5" height="4.5" rx="1"/></svg>
		</button>
	</div>

	<!-- Tabs -->
	<div class="sidebar-tabs">
		<button class="tab" class:active={sidebarTab === 'layers'} onclick={() => sidebarTab = 'layers'}>Layers</button>
		<button class="tab" class:active={sidebarTab === 'blocks'} onclick={() => sidebarTab = 'blocks'}>Blocks</button>
	</div>

	<!-- Pills -->
	<div class="sidebar-pills">
		<button class="pill" class:active={sidebarPill === 'block'} onclick={() => sidebarPill = 'block'}>Block</button>
		<button class="pill" class:active={sidebarPill === 'recipients'} onclick={() => sidebarPill = 'recipients'}>Recipients</button>
		<button class="pill" class:active={sidebarPill === 'tags'} onclick={() => sidebarPill = 'tags'}>Tags</button>
	</div>

	<!-- Search -->
	<div class="sidebar-search">
		<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#aaa" stroke-width="1.3"><circle cx="5" cy="5" r="3.5"/><line x1="7.5" y1="7.5" x2="10.5" y2="10.5"/></svg>
		<input type="text" class="search-input" placeholder="Search" />
		<span class="search-shortcut">
			<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#bbb" stroke-width="1.2"><path d="M1 7V3a2 2 0 012-2h1"/><polyline points="6,1 8,3 6,5"/></svg>
			K
		</span>
	</div>

	<!-- Sidebar content -->
	<div class="sidebar-content">
		{#if sidebarTab === 'blocks'}
			<!-- Block section -->
			<div class="section-header">
				<span>Block</span>
				<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="2,3.5 5,6.5 8,3.5"/></svg>
			</div>
			<div class="block-grid">
				{#each blockDefs as def}
					<button
						class="block-card"
						class:selected={selectedBlockCard === def.type}
						onclick={() => { selectedBlockCard = def.type; editor.addBlock(def.type); }}
					>
						<div class="block-preview">
							{#if def.type === 'heading'}
								<div style="width:100%;display:flex;flex-direction:column;gap:3px;align-items:flex-start;padding:4px 6px;">
									<div style="width:85%;height:5px;background:#d1d5db;border-radius:1px;"></div>
									<div style="width:55%;height:3px;background:#e5e7eb;border-radius:1px;"></div>
								</div>
							{:else if def.type === 'subheading'}
								<div style="width:100%;display:flex;flex-direction:column;gap:2.5px;align-items:flex-start;padding:4px 6px;">
									<div style="width:75%;height:4px;background:#d1d5db;border-radius:1px;"></div>
									<div style="width:90%;height:2.5px;background:#e5e7eb;border-radius:1px;"></div>
									<div style="width:60%;height:2.5px;background:#e5e7eb;border-radius:1px;"></div>
								</div>
							{:else if def.type === 'content'}
								<div style="width:100%;display:flex;flex-direction:column;gap:2.5px;align-items:flex-start;padding:4px 6px;">
									<div style="width:95%;height:2.5px;background:#e5e7eb;border-radius:1px;"></div>
									<div style="width:95%;height:2.5px;background:#e5e7eb;border-radius:1px;"></div>
									<div style="width:95%;height:2.5px;background:#e5e7eb;border-radius:1px;"></div>
									<div style="width:60%;height:2.5px;background:#e5e7eb;border-radius:1px;"></div>
								</div>
							{:else if def.type === 'image'}
								<div style="width:100%;padding:3px 6px;">
									<svg width="100%" height="28" viewBox="0 0 56 28" fill="none" preserveAspectRatio="xMidYMid meet">
										<rect x="0.5" y="0.5" width="55" height="27" rx="2" stroke="#d1d5db" fill="none"/>
										<circle cx="14" cy="10" r="4" fill="#d1d5db"/>
										<path d="M0 24l14-10 10 7 8-5 24 12H0z" fill="#e5e7eb"/>
									</svg>
								</div>
							{:else if def.type === 'list'}
								<div style="width:100%;display:flex;flex-direction:column;gap:3px;padding:4px 6px;">
									<div style="display:flex;align-items:center;gap:4px;">
										<div style="width:4px;height:4px;border-radius:50%;background:#d1d5db;flex-shrink:0;"></div>
										<div style="flex:1;height:2.5px;background:#e5e7eb;border-radius:1px;"></div>
									</div>
									<div style="display:flex;align-items:center;gap:4px;">
										<div style="width:4px;height:4px;border-radius:50%;background:#d1d5db;flex-shrink:0;"></div>
										<div style="flex:1;height:2.5px;background:#e5e7eb;border-radius:1px;"></div>
									</div>
									<div style="display:flex;align-items:center;gap:4px;">
										<div style="width:4px;height:4px;border-radius:50%;background:#d1d5db;flex-shrink:0;"></div>
										<div style="width:65%;height:2.5px;background:#e5e7eb;border-radius:1px;"></div>
									</div>
								</div>
							{:else if def.type === 'button'}
								<div style="width:100%;display:flex;flex-direction:column;gap:3px;align-items:center;padding:4px 6px;">
									<div style="width:60%;height:2.5px;background:#d1d5db;border-radius:1px;"></div>
									<div style="width:80%;height:10px;background:#1daa82;border-radius:3px;"></div>
								</div>
							{:else if def.type === 'section'}
								<div style="width:100%;padding:3px 6px;">
									<svg width="100%" height="28" viewBox="0 0 56 28" fill="none" preserveAspectRatio="xMidYMid meet">
										<rect x="0.5" y="0.5" width="55" height="27" rx="2" stroke="#d1d5db" fill="none"/>
										<rect x="6" y="14" width="44" height="10" rx="1.5" fill="#f3f4f6"/>
									</svg>
								</div>
							{:else if def.type === 'footer'}
								<div style="width:100%;display:flex;flex-direction:column;gap:2px;align-items:center;padding:8px 6px 4px;">
									<div style="width:90%;height:2.5px;background:#e5e7eb;border-radius:1px;"></div>
									<div style="width:55%;height:2.5px;background:#e5e7eb;border-radius:1px;"></div>
								</div>
							{/if}
						</div>
						<span class="block-label">{def.label}</span>
					</button>
				{/each}
			</div>

			<!-- Template section -->
			<div class="section-header" style="margin-top:4px;">
				<span>Template</span>
				<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="2,3.5 5,6.5 8,3.5"/></svg>
			</div>
			<div class="template-grid">
				<!-- Template card 1 -->
				<div class="template-card">
					<div class="template-preview" style="background:linear-gradient(135deg, #c4a265 0%, #8b6914 100%);">
						<div style="width:60%;height:4px;background:rgba(255,255,255,0.7);border-radius:1px;margin-bottom:3px;"></div>
						<div style="width:80%;height:2px;background:rgba(255,255,255,0.4);border-radius:1px;margin-bottom:2px;"></div>
						<div style="width:70%;height:2px;background:rgba(255,255,255,0.4);border-radius:1px;margin-bottom:4px;"></div>
						<div style="width:40%;height:8px;background:#1daa82;border-radius:3px;"></div>
					</div>
				</div>
				<!-- Template card 2 -->
				<div class="template-card">
					<div class="template-preview" style="background:linear-gradient(135deg, #d4a574 0%, #9c6b3a 100%);">
						<div style="width:55%;height:4px;background:rgba(255,255,255,0.7);border-radius:1px;margin-bottom:3px;"></div>
						<div style="width:75%;height:2px;background:rgba(255,255,255,0.4);border-radius:1px;margin-bottom:2px;"></div>
						<div style="width:65%;height:2px;background:rgba(255,255,255,0.4);border-radius:1px;margin-bottom:4px;"></div>
						<div style="width:40%;height:8px;background:#1daa82;border-radius:3px;"></div>
					</div>
				</div>
			</div>
		{:else}
			<!-- Layers list -->
			<div class="layers-list">
				{#each editor.blocks as block, i (block.id)}
					<button
						class="layer-item"
						class:layer-active={editor.selectedId === block.id}
						onclick={() => editor.selectBlock(block.id)}
					>
						<span class="layer-index">{i + 1}</span>
						<span class="layer-name">{block.type}</span>
					</button>
				{/each}
				{#if !editor.blocks.length}
					<p class="layers-empty">No blocks yet.</p>
				{/if}
			</div>
		{/if}
	</div>
</div>

<!-- ==================== CENTER ==================== -->
<div class="center">
	<!-- Toolbar -->
	<div class="toolbar">
		<div class="toolbar-left">
			<div class="view-group">
				<button class="view-btn active">
					<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="7" cy="5" r="3"/><path d="M2 12c0-2.8 2.2-5 5-5s5 2.2 5 5"/></svg>
				</button>
				<button class="view-btn">
					<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="1" y="2" width="12" height="9" rx="1.2"/><line x1="4.5" y1="12" x2="9.5" y2="12"/><line x1="7" y1="11" x2="7" y2="12"/></svg>
				</button>
				<button class="view-btn">
					<svg width="10" height="14" viewBox="0 0 10 14" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="0.5" y="0.5" width="9" height="13" rx="1.5"/><line x1="3.5" y1="11.5" x2="6.5" y2="11.5"/></svg>
				</button>
			</div>
		</div>
		<div class="toolbar-center">
			<button class="lang-btn">
				<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="6" cy="6" r="5"/><ellipse cx="6" cy="6" rx="2.2" ry="5"/><line x1="1" y1="6" x2="11" y2="6"/></svg>
				<span>En</span>
				<svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" stroke-width="1.3"><polyline points="1.5,3 4,5.5 6.5,3"/></svg>
			</button>
		</div>
		<div class="toolbar-right">
			<button class="toolbar-icon-btn">
				<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M7 1C3.7 1 1 3.7 1 7c0 1.4.5 2.7 1.3 3.7L1 13l2.3-1.3C4.3 12.5 5.6 13 7 13c3.3 0 6-2.7 6-6s-2.7-6-6-6z"/></svg>
			</button>
		</div>
	</div>

	<!-- Canvas -->
	<div class="canvas">
		<div class="email-wrap">
			{#if editor.blocks.length === 0}
				<div class="canvas-empty">
					<p>Drag blocks from the sidebar to start building</p>
				</div>
			{:else}
				{#each editor.blocks as block (block.id)}
					{@const isSelected = editor.selectedId === block.id}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="canvas-block"
						class:block-selected={isSelected}
						onclick={() => editor.selectBlock(block.id)}
					>
						{#if isSelected}
							<!-- Action toolbar -->
							<div class="action-toolbar">
								<button class="action-btn" onclick={(e) => e.stopPropagation()}>
									<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M2 7.5L1 11l3.5-1L10 4.5 7.5 2z"/></svg>
								</button>
								<button class="action-btn" onclick={(e) => e.stopPropagation()}>
									<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3"><polyline points="1,4 4,1 7,4"/><line x1="4" y1="1" x2="4" y2="8"/><path d="M8 4v5a2 2 0 01-2 2H3"/></svg>
								</button>
								<button class="action-btn" onclick={(e) => { e.stopPropagation(); editor.duplicateBlock(block.id); }}>
									<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1"/><path d="M3.5 8.5H2.5a1 1 0 01-1-1V2.5a1 1 0 011-1h5a1 1 0 011 1v1"/></svg>
								</button>
								<button class="action-btn" onclick={(e) => e.stopPropagation()}>
									<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="3" width="6.5" height="6.5" rx="1"/><path d="M3 8.5H2a1 1 0 01-1-1V2a1 1 0 011-1h5.5a1 1 0 011 1v1"/></svg>
								</button>
								<button class="action-btn" onclick={(e) => { e.stopPropagation(); editor.removeBlock(block.id); }}>
									<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3"><line x1="2.5" y1="3.5" x2="9.5" y2="3.5"/><path d="M4 3.5V2.5a1 1 0 011-1h2a1 1 0 011 1v1"/><path d="M3 3.5l.5 6a1 1 0 001 1h3a1 1 0 001-1l.5-6"/></svg>
								</button>
								<button class="action-btn" onclick={(e) => { e.stopPropagation(); editor.moveBlock(block.id, 'up'); }}>
									<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3"><polyline points="2,7 6,3 10,7"/></svg>
								</button>
								<button class="action-btn" onclick={(e) => e.stopPropagation()}>
									<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M4.5 1.5L7.5 4.5M7.5 4.5L4.5 7.5M7.5 4.5H1"/><rect x="6" y="1" width="5" height="9.5" rx="1"/></svg>
								</button>
							</div>
							<!-- Resize handles -->
							<span class="handle" style="top:-4px;left:-4px;"></span>
							<span class="handle" style="top:-4px;right:-4px;"></span>
							<span class="handle" style="bottom:-4px;left:-4px;"></span>
							<span class="handle" style="bottom:-4px;right:-4px;"></span>
							<span class="handle" style="top:50%;left:-4px;transform:translateY(-50%);"></span>
							<span class="handle" style="top:50%;right:-4px;transform:translateY(-50%);"></span>
						{/if}

						<!-- Block content rendering -->
						{#if block.type === 'heading'}
							<h1 style="
								font-size:{block.props.fontSize}px;
								font-weight:{block.props.fontWeight};
								color:{block.props.color};
								text-align:{block.props.align};
								padding:{block.props.paddingTop}px {block.props.paddingRight}px {block.props.paddingBottom}px {block.props.paddingLeft}px;
								margin:0;
							">{block.props.text}</h1>
						{:else if block.type === 'subheading'}
							<p style="
								font-size:{block.props.fontSize}px;
								font-weight:{block.props.fontWeight};
								color:{block.props.color};
								text-align:{block.props.align};
								line-height:{block.props.lineHeight};
								padding:{block.props.paddingTop}px {block.props.paddingRight}px {block.props.paddingBottom}px {block.props.paddingLeft}px;
								margin:0;
							">{block.props.text}</p>
						{:else if block.type === 'content'}
							<p style="
								font-size:{block.props.fontSize}px;
								color:{block.props.color};
								text-align:{block.props.align};
								line-height:{block.props.lineHeight};
								padding:{block.props.paddingTop}px {block.props.paddingRight}px {block.props.paddingBottom}px {block.props.paddingLeft}px;
								margin:0;
							">{@html block.props.text}</p>
						{:else if block.type === 'image'}
							<div style="padding:{block.props.paddingTop}px {block.props.paddingRight}px {block.props.paddingBottom}px {block.props.paddingLeft}px;">
								<img
									src={block.props.src}
									alt={block.props.alt}
									style="width:100%;max-width:{block.props.width}px;display:block;"
								/>
							</div>
						{:else if block.type === 'button'}
							<div style="
								text-align:{block.props.align};
								padding:{block.props.paddingTop}px {block.props.paddingRight}px {block.props.paddingBottom}px {block.props.paddingLeft}px;
							">
								<a
									href={block.props.href}
									style="
										display:inline-block;
										background:{block.props.backgroundColor};
										color:{block.props.color};
										font-size:{block.props.fontSize}px;
										font-weight:{block.props.fontWeight};
										border-radius:{block.props.borderRadius}px;
										padding:{block.props.innerPadding};
										text-decoration:none;
										cursor:pointer;
									"
								>{block.props.text}</a>
							</div>
						{:else if block.type === 'list'}
							<ul style="
								font-size:{block.props.fontSize}px;
								color:{block.props.color};
								padding:{block.props.paddingTop}px {block.props.paddingRight}px {block.props.paddingBottom}px {block.props.paddingLeft}px;
								margin:0;
								list-style:none;
							">
								{#each block.props.items as item}
									<li style="display:flex;align-items:baseline;gap:8px;margin-bottom:6px;">
										<span style="width:6px;height:6px;border-radius:50%;background:{block.props.bulletColor};flex-shrink:0;margin-top:5px;"></span>
										<span>{item}</span>
									</li>
								{/each}
							</ul>
						{:else if block.type === 'section'}
							<div style="
								background:{block.props.backgroundColor};
								padding:{block.props.paddingTop}px {block.props.paddingRight}px {block.props.paddingBottom}px {block.props.paddingLeft}px;
								min-height:40px;
							"></div>
						{:else if block.type === 'footer'}
							<p style="
								font-size:{block.props.fontSize}px;
								color:{block.props.color};
								text-align:{block.props.align};
								padding:{block.props.paddingTop}px {block.props.paddingRight}px {block.props.paddingBottom}px {block.props.paddingLeft}px;
								margin:0;
							">{block.props.text}</p>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>

<!-- ==================== RIGHT PANEL ==================== -->
<div class="right-panel">
	<!-- Top bar -->
	<div class="right-top">
		<div class="right-top-icons">
			<button class="right-icon-btn">
				<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2"/><path d="M6.5 1v1.5M6.5 10.5V12M1 6.5h1.5M10.5 6.5H12M2.6 2.6l1 1M9.4 9.4l1 1M2.6 10.4l1-1M9.4 3.6l1-1"/></svg>
			</button>
			<button class="right-icon-btn">
				<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M6.5 1v8M3.5 6l3 3 3-3"/><line x1="1" y1="11.5" x2="12" y2="11.5"/></svg>
			</button>
			<button class="right-icon-btn">
				<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="1" fill="currentColor"/><circle cx="6.5" cy="2" r="1" fill="currentColor"/><circle cx="6.5" cy="11" r="1" fill="currentColor"/></svg>
			</button>
		</div>
		<button class="use-mail-btn" onclick={handleSave}>
			{saving ? 'Saving...' : 'Use Mail'}
		</button>
	</div>

	<!-- Tabs -->
	<div class="right-tabs">
		<button class="right-tab" class:active={rightTab === 'customize'} onclick={() => rightTab = 'customize'}>Customize</button>
		<button class="right-tab" class:active={rightTab === 'styles'} onclick={() => rightTab = 'styles'}>Edit Styles</button>
	</div>

	{#if editor.selected}
		{@const p = editor.selected.props}
		<div class="right-content">
			<!-- Visibility -->
			<div class="prop">
				<div class="prop-title">
					<span>Visibility</span>
					<div class="prop-icons">
						<button class="prop-icon-btn active">
							<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M1 6.5s2.2-4 5.5-4 5.5 4 5.5 4-2.2 4-5.5 4S1 6.5 1 6.5z"/><circle cx="6.5" cy="6.5" r="1.8"/></svg>
						</button>
						<button class="prop-icon-btn">
							<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M1 6.5s2.2-4 5.5-4 5.5 4 5.5 4-2.2 4-5.5 4S1 6.5 1 6.5z"/><circle cx="6.5" cy="6.5" r="1.8"/><line x1="2" y1="11" x2="11" y2="2"/></svg>
						</button>
					</div>
				</div>
			</div>

			<!-- Layout -->
			<div class="prop">
				<div class="prop-title"><span>Layout</span></div>
				<div class="layout-row">
					<div class="layout-field">
						<input type="number" class="num-input" value={p.paddingLeft ?? 40} oninput={(e) => propInput('paddingLeft', parseInt(e.currentTarget.value) || 0)} />
						<span class="field-unit">px</span>
						<select class="field-select">
							<option>Fixed</option>
							<option>Auto</option>
						</select>
					</div>
					<div class="layout-field">
						<input type="number" class="num-input" value={p.paddingTop ?? 40} oninput={(e) => propInput('paddingTop', parseInt(e.currentTarget.value) || 0)} />
						<span class="field-unit">px</span>
						<select class="field-select">
							<option>Fixed</option>
							<option>Auto</option>
						</select>
					</div>
				</div>

				<!-- Alignment buttons -->
				<div class="align-row">
					<button class="al-btn" onclick={() => propInput('align', 'left')}>
						<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2"><line x1="1" y1="2" x2="1" y2="8"/><line x1="3" y1="5" x2="9" y2="5"/></svg>
					</button>
					<button class="al-btn" onclick={() => propInput('align', 'right')}>
						<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2"><line x1="9" y1="2" x2="9" y2="8"/><line x1="1" y1="5" x2="7" y2="5"/></svg>
					</button>
					<button class="al-btn" onclick={() => {}}>
						<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2"><line x1="5" y1="1" x2="5" y2="3"/><line x1="2" y1="5" x2="8" y2="5"/></svg>
					</button>
					<button class="al-btn active" onclick={() => propInput('align', 'center')}>
						<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2"><line x1="5" y1="1" x2="5" y2="9"/><line x1="2" y1="5" x2="8" y2="5"/></svg>
					</button>
					<button class="al-btn" onclick={() => {}}>
						<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="2" y="2" width="6" height="6" rx="0.5"/></svg>
					</button>
					<button class="al-btn" onclick={() => {}}>
						<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="1" y="3" width="8" height="4" rx="0.5"/></svg>
					</button>
					<button class="al-btn" onclick={() => {}}>
						<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="2" y="2" width="6" height="6" rx="0.5"/><line x1="0" y1="5" x2="2" y2="5"/><line x1="8" y1="5" x2="10" y2="5"/><line x1="5" y1="0" x2="5" y2="2"/><line x1="5" y1="8" x2="5" y2="10"/></svg>
					</button>
				</div>

				<!-- Spacing cells -->
				<div class="spacing-grid">
					<div class="spacing-cell">
						<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#bbb" stroke-width="1"><rect x="1" y="1" width="8" height="8" rx="1"/></svg>
						<input type="number" class="spacing-num" value={p.paddingTop ?? 0} oninput={(e) => propInput('paddingTop', parseInt(e.currentTarget.value) || 0)} />
					</div>
					<div class="spacing-cell">
						<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#bbb" stroke-width="1"><rect x="1" y="1" width="8" height="8" rx="1"/></svg>
						<input type="number" class="spacing-num" value={p.paddingRight ?? 0} oninput={(e) => propInput('paddingRight', parseInt(e.currentTarget.value) || 0)} />
					</div>
					<div class="spacing-cell">
						<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#bbb" stroke-width="1"><rect x="1" y="1" width="8" height="8" rx="1"/></svg>
						<input type="number" class="spacing-num" value={p.paddingBottom ?? 0} oninput={(e) => propInput('paddingBottom', parseInt(e.currentTarget.value) || 0)} />
					</div>
					<div class="spacing-cell">
						<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#bbb" stroke-width="1"><rect x="1" y="1" width="8" height="8" rx="1"/></svg>
						<input type="number" class="spacing-num" value={p.paddingLeft ?? 0} oninput={(e) => propInput('paddingLeft', parseInt(e.currentTarget.value) || 0)} />
					</div>
				</div>
			</div>

			<!-- Frame -->
			<div class="prop">
				<div class="prop-title"><span>Frame</span></div>
				<div class="frame-row">
					<button class="al-btn">
						<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2"><polyline points="2,7 2,2 7,2"/></svg>
					</button>
					<button class="al-btn">
						<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2"><polyline points="3,2 8,2 8,7"/></svg>
					</button>
					<button class="al-btn active">
						<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2"><polyline points="8,3 8,8 3,8"/></svg>
					</button>
					<button class="al-btn">
						<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2"><polyline points="7,8 2,8 2,3"/></svg>
					</button>
					<button class="al-btn">
						<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="2" y="2" width="6" height="6"/></svg>
					</button>
					<div style="flex:1"></div>
					<input type="number" class="num-input" value="0" />
				</div>
			</div>

			<!-- Border -->
			<div class="prop">
				<div class="prop-title"><span>Border</span></div>
				<div class="border-row">
					<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#888" stroke-width="1.2"><rect x="1" y="1" width="10" height="10" rx="3"/></svg>
					<input type="number" class="num-input" value={p.borderRadius ?? 0} oninput={(e) => propInput('borderRadius', parseInt(e.currentTarget.value) || 0)} />
					<select class="field-select">
						<option>Solid</option>
						<option>Dashed</option>
						<option>Dotted</option>
					</select>
					<div class="color-swatch-sm" style="background:#e8e8e8;"></div>
					<button class="prop-icon-btn-sm">
						<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M1 5s1.8-3.2 4-3.2S9 5 9 5s-1.8 3.2-4 3.2S1 5 1 5z"/><circle cx="5" cy="5" r="1.2"/></svg>
					</button>
					<button class="prop-icon-btn-sm">
						<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.3"><line x1="2" y1="5" x2="8" y2="5"/></svg>
					</button>
				</div>
			</div>

			<!-- Background -->
			<div class="prop">
				<div class="prop-title">
					<span>Background</span>
					<div class="prop-icons">
						<button class="prop-icon-btn-sm">
							<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2"><polygon points="5,1 6.2,3.8 9.2,3.8 6.8,5.6 7.6,8.5 5,6.6 2.4,8.5 3.2,5.6 0.8,3.8 3.8,3.8"/></svg>
						</button>
						<button class="prop-icon-btn-sm">
							<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="1" y="1" width="8" height="8" rx="1"/><circle cx="3.5" cy="3.5" r="1"/><path d="M1 8l2.5-3 2 1.5 1.5-1L10 8"/></svg>
						</button>
					</div>
				</div>
				<div class="bg-row">
					<input type="color" class="color-swatch-input" value={p.backgroundColor ?? '#ffffff'} oninput={(e) => propInput('backgroundColor', e.currentTarget.value)} />
					<input type="text" class="hex-input" value={p.backgroundColor ?? '#ffffff'} oninput={(e) => propInput('backgroundColor', e.currentTarget.value)} />
					<button class="prop-icon-btn-sm">
						<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M1 5s1.8-3.2 4-3.2S9 5 9 5s-1.8 3.2-4 3.2S1 5 1 5z"/><circle cx="5" cy="5" r="1.2"/></svg>
					</button>
					<button class="prop-icon-btn-sm">
						<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.3"><line x1="2" y1="5" x2="8" y2="5"/></svg>
					</button>
				</div>
			</div>

			<!-- Button-specific props -->
			{#if editor.selected.type === 'button'}
				<div class="prop">
					<div class="prop-title"><span>Button</span></div>
					<div class="button-link-row">
						<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#888" stroke-width="1.2"><path d="M5 7l2-2"/><path d="M4 8.5a2 2 0 01 0-2.8l1-1"/><path d="M8 3.5a2 2 0 010 2.8l-1 1"/></svg>
						<input type="text" class="link-input" value={p.href} placeholder="https://" oninput={(e) => propInput('href', e.currentTarget.value)} />
					</div>
					<div class="button-align-row">
						<button class="align-pill active" onclick={() => propInput('align', 'left')}>
							<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2"><line x1="1" y1="2" x2="9" y2="2"/><line x1="1" y1="5" x2="6" y2="5"/><line x1="1" y1="8" x2="8" y2="8"/></svg>
							Left
						</button>
						<button class="align-pill" onclick={() => propInput('align', 'center')}>
							<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2"><line x1="1" y1="2" x2="9" y2="2"/><line x1="2.5" y1="5" x2="7.5" y2="5"/><line x1="1.5" y1="8" x2="8.5" y2="8"/></svg>
							Center
						</button>
						<button class="align-pill" onclick={() => propInput('align', 'right')}>
							<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2"><line x1="1" y1="2" x2="9" y2="2"/><line x1="4" y1="5" x2="9" y2="5"/><line x1="2" y1="8" x2="9" y2="8"/></svg>
							Right
						</button>
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<div class="right-empty">
			<p>Select a block to edit properties</p>
		</div>
	{/if}
</div>

</div>
</div>

<style>
	/* ========== BASE ========== */
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
		-webkit-font-smoothing: antialiased;
	}

	* {
		box-sizing: border-box;
	}

	button {
		font-family: inherit;
		cursor: pointer;
	}

	input, select, textarea {
		font-family: inherit;
	}

	/* ========== WINDOW ========== */
	.window {
		width: 100%;
		height: 100vh;
		background: #f2f2f2;
		display: flex;
		flex-direction: column;
	}

	.app {
		display: flex;
		height: 100%;
	}

	/* ========== NAV RAIL ========== */
	.nav-rail {
		width: 46px;
		background: #fff;
		border-right: 1px solid #ebebeb;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 12px 0;
		gap: 2px;
		flex-shrink: 0;
	}

	.window-dots {
		display: flex;
		gap: 6px;
		margin-bottom: 14px;
	}

	.dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
	}

	.dot-red { background: #ff5f57; }
	.dot-yellow { background: #febc2e; }
	.dot-green { background: #28c840; }

	.logo {
		width: 30px;
		height: 30px;
		background: #1daa82;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 10px;
	}

	.nav-btn {
		width: 30px;
		height: 30px;
		border-radius: 7px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: #aaa;
		border: none;
		background: transparent;
	}

	.nav-btn:hover {
		background: #f5f5f5;
		color: #555;
	}

	.nav-btn.active {
		background: #edf8f4;
		color: #1daa82;
	}

	.nav-spacer {
		flex: 1;
	}

	.avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: #e8e8e8;
		overflow: hidden;
		margin-top: 4px;
	}

	/* ========== SIDEBAR ========== */
	.sidebar {
		width: 178px;
		background: #fff;
		border-right: 1px solid #ebebeb;
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
		overflow: hidden;
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 9px 10px;
		border-bottom: 1px solid #ebebeb;
	}

	.sidebar-back {
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		color: #888;
		padding: 0;
	}

	.sidebar-back:hover { color: #333; }

	.sidebar-title {
		font-size: 13px;
		font-weight: 600;
		color: #1a1a1a;
	}

	.sidebar-chevron {
		width: 16px;
		height: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		color: #aaa;
		padding: 0;
	}

	.sidebar-grid-toggle {
		width: 22px;
		height: 22px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		color: #aaa;
		padding: 0;
	}

	.sidebar-grid-toggle:hover { color: #555; }

	/* Tabs */
	.sidebar-tabs {
		display: flex;
		gap: 14px;
		padding: 0 12px;
		border-bottom: 1px solid #ebebeb;
		padding-top: 8px;
	}

	.tab {
		font-size: 12.5px;
		color: #aaa;
		padding-bottom: 7px;
		cursor: pointer;
		border: none;
		background: transparent;
		border-bottom: 2px solid transparent;
	}

	.tab.active {
		color: #1a1a1a;
		font-weight: 500;
		border-bottom-color: #1a1a1a;
	}

	/* Pills */
	.sidebar-pills {
		display: flex;
		gap: 5px;
		padding: 8px 10px;
	}

	.pill {
		font-size: 11px;
		padding: 3px 11px;
		border-radius: 20px;
		border: 1px solid #e0e0e0;
		background: #fff;
		color: #666;
		cursor: pointer;
	}

	.pill.active {
		background: #1a1a1a;
		color: #fff;
		border-color: #1a1a1a;
	}

	/* Search */
	.sidebar-search {
		display: flex;
		align-items: center;
		gap: 5px;
		margin: 0 10px 6px;
		padding: 5px 8px;
		border: 1px solid #e8e8e8;
		border-radius: 6px;
		background: #fafafa;
	}

	.search-input {
		flex: 1;
		border: none;
		background: transparent;
		font-size: 11px;
		color: #333;
		outline: none;
	}

	.search-input::placeholder { color: #bbb; }

	.search-shortcut {
		display: flex;
		align-items: center;
		gap: 2px;
		font-size: 10px;
		color: #bbb;
	}

	/* Sidebar content */
	.sidebar-content {
		flex: 1;
		overflow-y: auto;
		padding-bottom: 8px;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 6px 12px 4px;
		font-size: 11.5px;
		font-weight: 500;
		color: #1a1a1a;
	}

	.section-header svg { color: #aaa; }

	/* Block grid */
	.block-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
		padding: 2px 10px 8px;
	}

	.block-card {
		border: 1px solid #e8e8e8;
		border-radius: 8px;
		padding: 9px 7px 6px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 5px;
		cursor: pointer;
		background: #fff;
	}

	.block-card:hover {
		border-color: #ccc;
	}

	.block-card.selected {
		border: 1.5px solid #1daa82;
		background: #f0fbf7;
	}

	.block-preview {
		width: 100%;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.block-label {
		font-size: 10px;
		color: #888;
		font-weight: 500;
	}

	.block-card.selected .block-label {
		color: #1daa82;
	}

	/* Template grid */
	.template-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
		padding: 2px 10px 8px;
	}

	.template-card {
		border: 1px solid #e8e8e8;
		border-radius: 8px;
		overflow: hidden;
		cursor: pointer;
	}

	.template-card:hover {
		border-color: #ccc;
	}

	.template-preview {
		height: 70px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 8px;
	}

	/* Layers */
	.layers-list {
		padding: 6px 8px;
	}

	.layer-item {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 5px 6px;
		border-radius: 5px;
		border: none;
		background: transparent;
		text-align: left;
		font-size: 12px;
		color: #666;
		cursor: pointer;
	}

	.layer-item:hover { background: #f5f5f5; }

	.layer-item.layer-active {
		background: #edf8f4;
		color: #1daa82;
	}

	.layer-index {
		font-size: 10px;
		color: #aaa;
		width: 14px;
		text-align: right;
	}

	.layer-name {
		font-weight: 500;
		text-transform: capitalize;
	}

	.layers-empty {
		font-size: 11px;
		color: #aaa;
		text-align: center;
		padding: 24px 0;
	}

	/* ========== CENTER ========== */
	.center {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	/* Toolbar */
	.toolbar {
		height: 44px;
		background: #fff;
		border-bottom: 1px solid #ebebeb;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 12px;
		flex-shrink: 0;
	}

	.toolbar-left, .toolbar-center, .toolbar-right {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.toolbar-left { flex: 1; }
	.toolbar-right { flex: 1; justify-content: flex-end; }

	.view-group {
		display: flex;
		align-items: center;
		gap: 1px;
		background: #f5f5f5;
		border: 1px solid #e8e8e8;
		border-radius: 7px;
		padding: 2px;
	}

	.view-btn {
		width: 26px;
		height: 26px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 5px;
		border: none;
		background: transparent;
		color: #aaa;
		cursor: pointer;
	}

	.view-btn:hover { color: #666; }

	.view-btn.active {
		background: #fff;
		color: #333;
		box-shadow: 0 1px 2px rgba(0,0,0,0.06);
	}

	.lang-btn {
		display: flex;
		align-items: center;
		gap: 4px;
		border: 1px solid #e8e8e8;
		border-radius: 6px;
		padding: 4px 8px;
		background: #fff;
		color: #666;
		font-size: 11.5px;
		cursor: pointer;
	}

	.lang-btn:hover { background: #fafafa; }

	.toolbar-icon-btn {
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid #e8e8e8;
		border-radius: 6px;
		background: #fff;
		color: #888;
		cursor: pointer;
	}

	.toolbar-icon-btn:hover { background: #fafafa; color: #555; }

	/* ========== CANVAS ========== */
	.canvas {
		flex: 1;
		background: #ddeadd;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding: 28px 20px;
		overflow-y: auto;
	}

	.email-wrap {
		border: 2px dashed #9aabee;
		border-radius: 3px;
		width: 465px;
		background: transparent;
	}

	.canvas-empty {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 200px;
		color: #888;
		font-size: 13px;
	}

	/* Canvas blocks */
	.canvas-block {
		position: relative;
		cursor: pointer;
		background: #fff;
	}

	.canvas-block:hover {
		outline: 1px solid #c5d0f0;
		outline-offset: 0;
	}

	/* Selection */
	.block-selected {
		outline: 2px dashed #9aabee;
		outline-offset: 4px;
		position: relative;
	}

	.handle {
		position: absolute;
		width: 7px;
		height: 7px;
		background: #fff;
		border: 1.5px solid #7c6af5;
		border-radius: 1px;
		z-index: 20;
	}

	/* Action toolbar */
	.action-toolbar {
		position: absolute;
		top: -30px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 2px;
		background: #fff;
		border: 1px solid #e8e8e8;
		border-radius: 6px;
		padding: 3px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.08);
		z-index: 30;
	}

	.action-btn {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		border: none;
		background: #e8e8e8;
		color: #666;
		cursor: pointer;
	}

	.action-btn:hover {
		background: #ddd;
		color: #333;
	}

	/* Block content styles */
	.canvas-block h1 {
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
	}

	.canvas-block p {
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
	}

	.canvas-block img {
		display: block;
	}

	/* ========== RIGHT PANEL ========== */
	.right-panel {
		width: 200px;
		background: #fff;
		border-left: 1px solid #ebebeb;
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
		overflow-y: auto;
	}

	.right-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 10px;
		border-bottom: 1px solid #ebebeb;
	}

	.right-top-icons {
		display: flex;
		gap: 3px;
	}

	.right-icon-btn {
		width: 26px;
		height: 26px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid #e8e8e8;
		border-radius: 5px;
		background: #fff;
		color: #888;
		cursor: pointer;
	}

	.right-icon-btn:hover { background: #f5f5f5; color: #555; }

	.use-mail-btn {
		background: #1daa82;
		color: #fff;
		border: none;
		border-radius: 6px;
		padding: 5px 12px;
		font-size: 11.5px;
		font-weight: 600;
		cursor: pointer;
	}

	.use-mail-btn:hover { background: #189e77; }

	/* Right tabs */
	.right-tabs {
		display: flex;
		border-bottom: 1px solid #ebebeb;
	}

	.right-tab {
		flex: 1;
		padding: 8px 0;
		font-size: 11.5px;
		color: #aaa;
		border: none;
		background: transparent;
		cursor: pointer;
		border-bottom: 2px solid transparent;
	}

	.right-tab.active {
		color: #1a1a1a;
		font-weight: 500;
		border-bottom-color: #1a1a1a;
	}

	/* Properties */
	.right-content {
		flex: 1;
		overflow-y: auto;
	}

	.prop {
		padding: 9px 11px 7px;
		border-bottom: 1px solid #f5f5f5;
	}

	.prop-title {
		font-size: 11.5px;
		font-weight: 500;
		color: #1a1a1a;
		margin-bottom: 6px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.prop-icons {
		display: flex;
		gap: 3px;
	}

	.prop-icon-btn {
		width: 22px;
		height: 22px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid #e8e8e8;
		border-radius: 4px;
		background: transparent;
		color: #888;
		cursor: pointer;
	}

	.prop-icon-btn:hover { background: #f5f5f5; }

	.prop-icon-btn.active {
		background: #f0f0f0;
		border-color: #ccc;
		color: #555;
	}

	.prop-icon-btn-sm {
		width: 18px;
		height: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		color: #aaa;
		cursor: pointer;
		padding: 0;
	}

	.prop-icon-btn-sm:hover { color: #555; }

	/* Inputs */
	.num-input {
		width: 40px;
		border: 1px solid #e8e8e8;
		border-radius: 4px;
		padding: 3px 5px;
		font-size: 11px;
		color: #333;
		background: #fafafa;
		text-align: right;
		outline: none;
	}

	.num-input:focus {
		border-color: #1daa82;
	}

	.field-unit {
		font-size: 10px;
		color: #aaa;
	}

	.field-select {
		border: 1px solid #e8e8e8;
		border-radius: 4px;
		padding: 2px 4px;
		font-size: 10px;
		color: #666;
		background: #fafafa;
		outline: none;
	}

	.field-select:focus {
		border-color: #1daa82;
	}

	/* Layout */
	.layout-row {
		display: flex;
		gap: 6px;
		margin-bottom: 7px;
	}

	.layout-field {
		display: flex;
		align-items: center;
		gap: 3px;
		flex: 1;
	}

	/* Alignment buttons */
	.align-row {
		display: flex;
		gap: 3px;
		margin-bottom: 7px;
	}

	.al-btn {
		width: 20px;
		height: 20px;
		border: 1px solid #e8e8e8;
		border-radius: 3px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: #888;
		background: transparent;
	}

	.al-btn:hover {
		background: #f5f5f5;
		border-color: #ddd;
	}

	.al-btn.active {
		background: #f0f0f0;
		border-color: #ccc;
	}

	/* Spacing grid */
	.spacing-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4px;
	}

	.spacing-cell {
		display: flex;
		align-items: center;
		gap: 4px;
		border: 1px solid #f0f0f0;
		border-radius: 4px;
		padding: 3px 5px;
		background: #fafafa;
	}

	.spacing-num {
		width: 28px;
		border: none;
		background: transparent;
		font-size: 11px;
		color: #333;
		text-align: right;
		outline: none;
	}

	/* Frame */
	.frame-row {
		display: flex;
		align-items: center;
		gap: 3px;
	}

	/* Border */
	.border-row {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.color-swatch-sm {
		width: 16px;
		height: 16px;
		border-radius: 3px;
		border: 1px solid #ddd;
		cursor: pointer;
	}

	/* Background */
	.bg-row {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.color-swatch-input {
		width: 20px;
		height: 20px;
		border: 1px solid #ddd;
		border-radius: 3px;
		padding: 0;
		cursor: pointer;
		background: none;
	}

	.color-swatch-input::-webkit-color-swatch-wrapper { padding: 1px; }
	.color-swatch-input::-webkit-color-swatch { border: none; border-radius: 2px; }

	.hex-input {
		flex: 1;
		border: 1px solid #e8e8e8;
		border-radius: 4px;
		padding: 3px 5px;
		font-size: 10px;
		color: #555;
		background: #fafafa;
		outline: none;
		font-family: monospace;
	}

	.hex-input:focus { border-color: #1daa82; }

	/* Button props */
	.button-link-row {
		display: flex;
		align-items: center;
		gap: 5px;
		margin-bottom: 7px;
	}

	.link-input {
		flex: 1;
		border: 1px solid #e8e8e8;
		border-radius: 4px;
		padding: 4px 6px;
		font-size: 10.5px;
		color: #555;
		background: #fafafa;
		outline: none;
	}

	.link-input:focus { border-color: #1daa82; }

	.button-align-row {
		display: flex;
		gap: 3px;
	}

	.align-pill {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 3px;
		padding: 4px 0;
		border: 1px solid #e8e8e8;
		border-radius: 4px;
		background: #fff;
		color: #888;
		font-size: 10px;
		cursor: pointer;
	}

	.align-pill:hover { background: #fafafa; }

	.align-pill.active {
		background: #f0f0f0;
		border-color: #ccc;
		color: #333;
	}

	/* Empty state */
	.right-empty {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}

	.right-empty p {
		font-size: 12px;
		color: #aaa;
		text-align: center;
	}
</style>
