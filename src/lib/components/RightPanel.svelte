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

<div class="w-[220px] bg-white border-l border-gray-200 flex flex-col shrink-0 overflow-y-auto">
	<!-- Top bar -->
	<div class="border-b border-gray-100 px-3 py-2 flex items-center gap-1.5">
		<!-- Settings icon -->
		<button type="button" class="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
			</svg>
		</button>
		<!-- Download icon -->
		<button type="button" class="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
			</svg>
		</button>
		<!-- Ellipsis icon -->
		<button type="button" class="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
			</svg>
		</button>
		<div class="flex-1"></div>
		<button type="button" class="bg-[#1daa82] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#189e78] transition-colors cursor-pointer">
			Use Mail
		</button>
	</div>

	<!-- Tab switcher -->
	<div class="bg-gray-100 rounded-lg p-0.5 mx-3 my-2 flex">
		<button
			type="button"
			class="flex-1 text-xs py-1.5 rounded-md text-center cursor-pointer transition-all
				{activeTab === 'customize' ? 'bg-white text-gray-900 font-semibold shadow-sm' : 'text-gray-400'}"
			onclick={() => activeTab = 'customize'}
		>
			Customize
		</button>
		<button
			type="button"
			class="flex-1 text-xs py-1.5 rounded-md text-center cursor-pointer transition-all
				{activeTab === 'styles' ? 'bg-white text-gray-900 font-semibold shadow-sm' : 'text-gray-400'}"
			onclick={() => activeTab = 'styles'}
		>
			Styles
		</button>
	</div>

	<!-- Panel content -->
	{#if !editor.selected}
		<!-- No block selected -->
		<div class="flex-1 flex flex-col items-center justify-center px-6 text-center gap-3">
			<svg class="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
			</svg>
			<span class="text-xs text-gray-400">Select a block to edit its properties</span>
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
