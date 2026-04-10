<script lang="ts">
	import { editor } from '$lib/store.svelte';
	import PropSection from './PropSection.svelte';
	import ColorPicker from './ColorPicker.svelte';
	import AlignmentPills from './AlignmentPills.svelte';
	import SpacingEditor from './SpacingEditor.svelte';
	import NumberInput from './NumberInput.svelte';

	let activeTab = $state<'customize' | 'styles'>('customize');

	function setProp(key: string, value: any) {
		if (editor.selectedId) editor.updateProp(editor.selectedId, key, value);
	}

	const inputClass = 'w-full bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-[#1daa82] transition-colors';
	const labelClass = 'text-[10px] text-gray-400 mb-1 block';

	let props = $derived(editor.selected?.props ?? {});
	let blockType = $derived(editor.selected?.type ?? null);

	// Button width mode derived from width prop
	let buttonWidthMode = $derived<'auto' | 'custom' | 'full'>(
		props.width === -1 ? 'full' : props.width > 0 ? 'custom' : 'auto'
	);
</script>

<div class="right-panel">
	<!-- Top bar -->
	<div class="rp-topbar">
		<button class="rp-icon-btn">
			<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2"/><path d="M6.5 1v2M6.5 10v2M1 6.5h2M10 6.5h2M2.8 2.8l1.4 1.4M8.8 8.8l1.4 1.4M2.8 10.2l1.4-1.4M8.8 4.2l1.4-1.4"/></svg>
		</button>
		<button class="rp-icon-btn">
			<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.3"><line x1="6.5" y1="2" x2="6.5" y2="11"/><polyline points="3,7 6.5,11 10,7"/><line x1="2.5" y1="2" x2="10.5" y2="2"/></svg>
		</button>
		<button class="rp-icon-btn">
			<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="3" cy="6.5" r="1.5"/><circle cx="6.5" cy="6.5" r="1.5"/><circle cx="10" cy="6.5" r="1.5"/></svg>
		</button>
		<button class="rp-use-mail">Use Mail</button>
	</div>

	<!-- Tab switcher -->
	<div class="rp-tab-wrap">
		<button class="rp-tab" class:active={activeTab === 'customize'} onclick={() => activeTab = 'customize'}>Customize</button>
		<button class="rp-tab" class:active={activeTab === 'styles'} onclick={() => activeTab = 'styles'}>Styles</button>
	</div>

	<!-- Panel content -->
	{#if !editor.selected}
		<div class="rp-empty">
			<svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#ccc" stroke-width="1.2">
				<path d="M17 24l-1.5-5.5m0 0l-2.5 2.2.6-9.5 5.2 7.9-3.3-.6ZM14 3v2.5m5.8.2-1.6 1.6M22.5 11H20M8.8 16.7l-1.6 1.6M7 11H4.5m4-4.2L6.9 5.2"/>
			</svg>
			<span>Select a block to edit</span>
		</div>
	{:else if activeTab === 'customize'}
		<!-- ======================== CUSTOMIZE TAB ======================== -->

		{#if blockType === 'header'}
			<PropSection title="Header">
				<div class="flex flex-col gap-2.5">
					<div>
						<label class={labelClass}>Logo URL</label>
						<input type="text" class={inputClass} value={props.logoUrl ?? ''} oninput={(e) => setProp('logoUrl', (e.target as HTMLInputElement).value)} />
					</div>
					<div>
						<label class={labelClass}>Company Name</label>
						<input type="text" class={inputClass} value={props.companyName ?? ''} oninput={(e) => setProp('companyName', (e.target as HTMLInputElement).value)} />
					</div>
					<div>
						<label class={labelClass}>Tagline</label>
						<input type="text" class={inputClass} value={props.tagline ?? ''} oninput={(e) => setProp('tagline', (e.target as HTMLInputElement).value)} />
					</div>
					<NumberInput label="Width" value={props.logoWidth ?? 40} unit="px" onchange={(v) => setProp('logoWidth', v)} />
					<NumberInput label="Font Size" value={props.fontSize ?? 20} unit="px" onchange={(v) => setProp('fontSize', v)} />
					<div>
						<label class={labelClass}>Theme Color</label>
						<ColorPicker value={props.backgroundColor ?? '#1daa82'} onchange={(hex) => setProp('backgroundColor', hex)} />
					</div>
					<div>
						<label class={labelClass}>Text Color</label>
						<ColorPicker value={props.color ?? '#ffffff'} onchange={(hex) => setProp('color', hex)} />
					</div>
				</div>
			</PropSection>

		{:else if blockType === 'heading' || blockType === 'subheading' || blockType === 'content'}
			<PropSection title="Content">
				<div class="flex flex-col gap-2.5">
					<div>
						<label class={labelClass}>Text</label>
						<textarea
							class="{inputClass} resize-none"
							rows="3"
							value={props.text ?? ''}
							oninput={(e) => setProp('text', (e.target as HTMLTextAreaElement).value)}
						></textarea>
					</div>
				</div>
			</PropSection>

			<PropSection title="Typography">
				<div class="flex flex-col gap-2.5">
					<NumberInput label="Font Size" value={props.fontSize ?? 14} unit="px" onchange={(v) => setProp('fontSize', v)} />
					<div>
						<label class={labelClass}>Text Color</label>
						<ColorPicker value={props.color ?? '#374151'} onchange={(hex) => setProp('color', hex)} />
					</div>
					<div>
						<label class={labelClass}>Alignment</label>
						<AlignmentPills value={props.align ?? 'left'} onchange={(a) => setProp('align', a)} />
					</div>
				</div>
			</PropSection>

		{:else if blockType === 'button'}
			<PropSection title="Button">
				<div class="flex flex-col gap-2.5">
					<div>
						<label class={labelClass}>Label</label>
						<input type="text" class={inputClass} value={props.text ?? ''} oninput={(e) => setProp('text', (e.target as HTMLInputElement).value)} />
					</div>
					<div>
						<label class={labelClass}>Link URL</label>
						<div class="flex items-center gap-1.5">
							<svg class="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
							</svg>
							<input type="text" class="{inputClass} flex-1" value={props.href ?? ''} oninput={(e) => setProp('href', (e.target as HTMLInputElement).value)} />
						</div>
					</div>
					<div>
						<label class={labelClass}>Width</label>
						<div class="flex gap-1">
							<button
								type="button"
								class="flex-1 text-[10px] py-1.5 rounded-md text-center cursor-pointer border transition-colors
									{buttonWidthMode === 'auto' ? 'border-[#1daa82] bg-[#edf8f4] text-[#1daa82]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}"
								onclick={() => setProp('width', 0)}
							>Auto</button>
							<button
								type="button"
								class="flex-1 text-[10px] py-1.5 rounded-md text-center cursor-pointer border transition-colors
									{buttonWidthMode === 'custom' ? 'border-[#1daa82] bg-[#edf8f4] text-[#1daa82]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}"
								onclick={() => setProp('width', 200)}
							>Custom</button>
							<button
								type="button"
								class="flex-1 text-[10px] py-1.5 rounded-md text-center cursor-pointer border transition-colors
									{buttonWidthMode === 'full' ? 'border-[#1daa82] bg-[#edf8f4] text-[#1daa82]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}"
								onclick={() => setProp('width', -1)}
							>Full Width</button>
						</div>
						{#if buttonWidthMode === 'custom'}
							<div class="mt-2">
								<NumberInput label="Width" value={props.width} unit="px" min={40} max={600} onchange={(v) => setProp('width', v)} />
							</div>
						{/if}
					</div>
					<NumberInput label="Radius" value={props.borderRadius ?? 6} unit="px" max={50} onchange={(v) => setProp('borderRadius', v)} />
				</div>
			</PropSection>

			<PropSection title="Colors">
				<div class="flex flex-col gap-2.5">
					<div>
						<label class={labelClass}>Background</label>
						<ColorPicker value={props.backgroundColor ?? '#1daa82'} onchange={(hex) => setProp('backgroundColor', hex)} />
					</div>
					<div>
						<label class={labelClass}>Text</label>
						<ColorPicker value={props.color ?? '#ffffff'} onchange={(hex) => setProp('color', hex)} />
					</div>
				</div>
			</PropSection>

			<PropSection title="Alignment">
				<AlignmentPills value={props.align ?? 'center'} onchange={(a) => setProp('align', a)} />
			</PropSection>

		{:else if blockType === 'image'}
			<PropSection title="Image">
				<div class="flex flex-col gap-2.5">
					<div>
						<label class={labelClass}>Source URL</label>
						<input type="text" class={inputClass} value={props.src ?? ''} oninput={(e) => setProp('src', (e.target as HTMLInputElement).value)} />
					</div>
					<div>
						<label class={labelClass}>Alt Text</label>
						<input type="text" class={inputClass} value={props.alt ?? ''} oninput={(e) => setProp('alt', (e.target as HTMLInputElement).value)} />
					</div>
					<NumberInput label="Width" value={props.width ?? 600} unit="px" max={600} onchange={(v) => setProp('width', v)} />
					<div>
						<label class={labelClass}>Link URL</label>
						<input type="text" class={inputClass} value={props.href ?? ''} oninput={(e) => setProp('href', (e.target as HTMLInputElement).value)} />
					</div>
				</div>
			</PropSection>

		{:else if blockType === 'list'}
			<PropSection title="List Items">
				<div class="flex flex-col gap-1.5">
					{#each (props.items ?? []) as item, i}
						<div class="flex items-center gap-1">
							<input
								type="text"
								class="{inputClass} flex-1"
								value={item}
								oninput={(e) => {
									const updated = [...(props.items ?? [])];
									updated[i] = (e.target as HTMLInputElement).value;
									setProp('items', updated);
								}}
							/>
							<button
								type="button"
								class="p-1 text-gray-400 hover:text-red-500 cursor-pointer transition-colors shrink-0"
								onclick={() => {
									const updated = (props.items ?? []).filter((_: string, idx: number) => idx !== i);
									setProp('items', updated);
								}}
							>
								<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
					{/each}
					<button
						type="button"
						class="text-[#1daa82] text-xs font-medium cursor-pointer hover:underline text-left mt-1"
						onclick={() => {
							const updated = [...(props.items ?? []), 'New item'];
							setProp('items', updated);
						}}
					>
						+ Add item
					</button>
				</div>
			</PropSection>

			<PropSection title="Style">
				<div class="flex flex-col gap-2.5">
					<NumberInput label="Font Size" value={props.fontSize ?? 14} unit="px" onchange={(v) => setProp('fontSize', v)} />
					<div>
						<label class={labelClass}>Text Color</label>
						<ColorPicker value={props.color ?? '#374151'} onchange={(hex) => setProp('color', hex)} />
					</div>
					<div>
						<label class={labelClass}>Bullet Color</label>
						<ColorPicker value={props.bulletColor ?? '#1daa82'} onchange={(hex) => setProp('bulletColor', hex)} />
					</div>
				</div>
			</PropSection>

		{:else if blockType === 'table'}
			<PropSection title="Table">
				<div class="flex flex-col gap-2.5">
					<label class="flex items-center gap-2 text-[10px] text-gray-500 cursor-pointer">
						<input type="checkbox" checked={props.headerRow ?? true} onchange={(e) => setProp('headerRow', (e.target as HTMLInputElement).checked)} class="accent-[#1daa82]" />
						Show header row
					</label>
					{#if props.headerRow}
						<div>
							<label class={labelClass}>Column 1 Header</label>
							<input class={inputClass} value={props.col1Header ?? ''} oninput={(e) => setProp('col1Header', (e.target as HTMLInputElement).value)} />
						</div>
						<div>
							<label class={labelClass}>Column 2 Header</label>
							<input class={inputClass} value={props.col2Header ?? ''} oninput={(e) => setProp('col2Header', (e.target as HTMLInputElement).value)} />
						</div>
					{/if}
				</div>
			</PropSection>
			<PropSection title="Rows">
				<div class="flex flex-col gap-2">
					{#each props.rows ?? [] as row, i}
						<div class="flex gap-1.5 items-start">
							<div class="flex-1 flex flex-col gap-1">
								<input class="{inputClass} text-[10px]" value={row.col1} oninput={(e) => {
									const rows = [...(props.rows ?? [])];
									rows[i] = { ...rows[i], col1: (e.target as HTMLInputElement).value };
									setProp('rows', rows);
								}} placeholder="Col 1" />
								<input class="{inputClass} text-[10px]" value={row.col2} oninput={(e) => {
									const rows = [...(props.rows ?? [])];
									rows[i] = { ...rows[i], col2: (e.target as HTMLInputElement).value };
									setProp('rows', rows);
								}} placeholder="Col 2" />
							</div>
							<button class="text-red-300 hover:text-red-500 text-xs mt-1 shrink-0" onclick={() => {
								const rows = (props.rows ?? []).filter((_: any, j: number) => j !== i);
								setProp('rows', rows);
							}}>x</button>
						</div>
					{/each}
					<button class="text-[10px] text-[#1daa82] font-medium hover:underline" onclick={() => {
						setProp('rows', [...(props.rows ?? []), { col1: 'Item', col2: 'Description' }]);
					}}>+ Add row</button>
				</div>
			</PropSection>
			<PropSection title="Colors">
				<div class="flex flex-col gap-2.5">
					<div>
						<label class={labelClass}>Header Background</label>
						<ColorPicker value={props.headerBg ?? '#f3f4f6'} onchange={(hex) => setProp('headerBg', hex)} />
					</div>
					<div>
						<label class={labelClass}>Cell Text</label>
						<ColorPicker value={props.cellColor ?? '#374151'} onchange={(hex) => setProp('cellColor', hex)} />
					</div>
					<div>
						<label class={labelClass}>Border</label>
						<ColorPicker value={props.borderColor ?? '#e5e7eb'} onchange={(hex) => setProp('borderColor', hex)} />
					</div>
				</div>
			</PropSection>

		{:else if blockType === 'footer'}
			<PropSection title="Footer Content">
				<div class="flex flex-col gap-2.5">
					<div>
						<label class={labelClass}>Company Name</label>
						<input class={inputClass} value={props.companyName ?? ''} oninput={(e) => setProp('companyName', (e.target as HTMLInputElement).value)} />
					</div>
					<div>
						<label class={labelClass}>Company Address</label>
						<input class={inputClass} value={props.companyAddress ?? ''} oninput={(e) => setProp('companyAddress', (e.target as HTMLInputElement).value)} />
					</div>
					<div>
						<label class={labelClass}>Disclaimer Text</label>
						<textarea class="{inputClass} resize-none" rows="2" value={props.text ?? ''} oninput={(e) => setProp('text', (e.target as HTMLTextAreaElement).value)}></textarea>
					</div>
					<label class="flex items-center gap-2 text-[10px] text-gray-500 cursor-pointer">
						<input type="checkbox" checked={props.showDivider ?? true} onchange={(e) => setProp('showDivider', (e.target as HTMLInputElement).checked)} class="accent-[#1daa82]" />
						Show divider line
					</label>
				</div>
			</PropSection>
			<PropSection title="Links">
				<div class="flex flex-col gap-2">
					{#each props.links ?? [] as link, i}
						<div class="flex gap-1.5 items-start">
							<div class="flex-1 flex flex-col gap-1">
								<input class="{inputClass} text-[10px]" value={link.label} placeholder="Label" oninput={(e) => {
									const links = [...(props.links ?? [])];
									links[i] = { ...links[i], label: (e.target as HTMLInputElement).value };
									setProp('links', links);
								}} />
								<input class="{inputClass} text-[10px]" value={link.url} placeholder="URL" oninput={(e) => {
									const links = [...(props.links ?? [])];
									links[i] = { ...links[i], url: (e.target as HTMLInputElement).value };
									setProp('links', links);
								}} />
							</div>
							<button class="text-red-300 hover:text-red-500 text-xs mt-1 shrink-0" onclick={() => {
								const links = (props.links ?? []).filter((_: any, j: number) => j !== i);
								setProp('links', links);
							}}>x</button>
						</div>
					{/each}
					<button class="text-[10px] text-[#1daa82] font-medium hover:underline" onclick={() => {
						setProp('links', [...(props.links ?? []), { label: 'Link', url: 'https://' }]);
					}}>+ Add link</button>
				</div>
			</PropSection>
			<PropSection title="Unsubscribe">
				<div class="flex flex-col gap-2.5">
					<div>
						<label class={labelClass}>Unsubscribe Text</label>
						<input class={inputClass} value={props.unsubText ?? 'Unsubscribe'} oninput={(e) => setProp('unsubText', (e.target as HTMLInputElement).value)} />
					</div>
					<div>
						<label class={labelClass}>Unsubscribe URL</label>
						<input class={inputClass} value={props.unsubUrl ?? ''} oninput={(e) => setProp('unsubUrl', (e.target as HTMLInputElement).value)} />
					</div>
				</div>
			</PropSection>
			<PropSection title="Typography">
				<div class="flex flex-col gap-2.5">
					<NumberInput label="Size" value={props.fontSize ?? 12} unit="px" onchange={(v) => setProp('fontSize', v)} />
					<div>
						<label class={labelClass}>Text Color</label>
						<ColorPicker value={props.color ?? '#9ca3af'} onchange={(hex) => setProp('color', hex)} />
					</div>
					<div>
						<label class={labelClass}>Link Color</label>
						<ColorPicker value={props.linkColor ?? '#6b7280'} onchange={(hex) => setProp('linkColor', hex)} />
					</div>
					<AlignmentPills value={props.align ?? 'center'} onchange={(a) => setProp('align', a)} />
				</div>
			</PropSection>

		{:else if blockType === 'section'}
			<PropSection title="Section">
				<div class="flex flex-col gap-2.5">
					<div>
						<label class={labelClass}>Background</label>
						<ColorPicker value={props.backgroundColor ?? '#f5f5f5'} onchange={(hex) => setProp('backgroundColor', hex)} />
					</div>
				</div>
			</PropSection>
		{/if}

	{:else}
		<!-- ======================== STYLES TAB ======================== -->

		{#if editor.selected}
			<PropSection title="Spacing">
				<SpacingEditor
					top={props.paddingTop ?? 0}
					right={props.paddingRight ?? 0}
					bottom={props.paddingBottom ?? 0}
					left={props.paddingLeft ?? 0}
					onchange={(key, value) => setProp(key, value)}
				/>
			</PropSection>

			{#if blockType !== 'image'}
				<PropSection title="Background">
					<div>
						<label class={labelClass}>Color</label>
						<ColorPicker value={props.backgroundColor ?? '#ffffff'} onchange={(hex) => setProp('backgroundColor', hex)} />
					</div>
				</PropSection>
			{/if}

			<PropSection title="Border">
				<div class="flex flex-col gap-2.5">
					<NumberInput label="Radius" value={props.borderRadius ?? 0} unit="px" max={50} onchange={(v) => setProp('borderRadius', v)} />
					<div>
						<label class={labelClass}>Border Style</label>
						<select
							class={inputClass}
							value={props.borderStyle ?? 'none'}
							onchange={(e) => setProp('borderStyle', (e.target as HTMLSelectElement).value)}
						>
							<option value="none">None</option>
							<option value="solid">Solid</option>
							<option value="dashed">Dashed</option>
							<option value="dotted">Dotted</option>
						</select>
					</div>
					{#if props.borderStyle && props.borderStyle !== 'none'}
						<div>
							<label class={labelClass}>Border Color</label>
							<ColorPicker value={props.borderColor ?? '#d1d5db'} onchange={(hex) => setProp('borderColor', hex)} />
						</div>
					{/if}
				</div>
			</PropSection>
		{/if}
	{/if}
</div>

<style>
	.right-panel {
		width: 220px;
		background: #fff;
		border-left: 1px solid #ebebeb;
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
		overflow-y: auto;
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
	}
	.right-panel::-webkit-scrollbar { width: 4px; }
	.right-panel::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }

	/* Top bar */
	.rp-topbar {
		padding: 8px 10px;
		border-bottom: 1px solid #f0f0f0;
		display: flex;
		align-items: center;
		gap: 5px;
	}
	.rp-icon-btn {
		width: 24px;
		height: 24px;
		border: 1px solid #e8e8e8;
		border-radius: 5px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: #999;
		background: #fff;
		transition: background 0.1s, color 0.1s;
	}
	.rp-icon-btn:hover { background: #f5f5f5; color: #555; }
	.rp-use-mail {
		margin-left: auto;
		background: #1daa82;
		color: #fff;
		border: none;
		border-radius: 7px;
		padding: 6px 14px;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s;
	}
	.rp-use-mail:hover { background: #189e78; }

	/* Tabs */
	.rp-tab-wrap {
		display: flex;
		border-bottom: 1px solid #f0f0f0;
	}
	.rp-tab {
		flex: 1;
		text-align: center;
		padding: 8px 0;
		font-size: 12px;
		color: #bbb;
		cursor: pointer;
		border: none;
		background: none;
		transition: all 0.15s;
		font-family: inherit;
	}
	.rp-tab.active {
		color: #1a1a1a;
		font-weight: 500;
		background: #f9f9f9;
	}

	/* Empty state */
	.rp-empty {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 24px;
	}
	.rp-empty span {
		font-size: 12px;
		color: #bbb;
	}
</style>
