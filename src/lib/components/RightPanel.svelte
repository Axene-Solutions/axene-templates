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

	const inputClass = 'rp-input';
	const labelClass = 'rp-label';

	let props = $derived(editor.selected?.props ?? {});
	let blockType = $derived(editor.selected?.type ?? null);

	let buttonWidthMode = $derived<'auto' | 'custom' | 'full'>(
		props.width === -1 ? 'full' : props.width > 0 ? 'custom' : 'auto'
	);

	const layouts = [
		{
			value: 'logo-left',
			title: 'Logo Left',
			svg: `<svg width="32" height="22" viewBox="0 0 32 22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="11" r="4" fill="currentColor" stroke="none" opacity="0.4"/><line x1="15" y1="9" x2="28" y2="9"/><line x1="15" y1="13" x2="24" y2="13"/></svg>`,
		},
		{
			value: 'logo-center',
			title: 'Logo Center',
			svg: `<svg width="32" height="22" viewBox="0 0 32 22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="16" cy="7" r="3.5" fill="currentColor" stroke="none" opacity="0.4"/><line x1="9" y1="14" x2="23" y2="14"/><line x1="11" y1="18" x2="21" y2="18"/></svg>`,
		},
		{
			value: 'logo-right',
			title: 'Logo Right',
			svg: `<svg width="32" height="22" viewBox="0 0 32 22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="24" cy="11" r="4" fill="currentColor" stroke="none" opacity="0.4"/><line x1="4" y1="9" x2="17" y2="9"/><line x1="8" y1="13" x2="17" y2="13"/></svg>`,
		},
		{
			value: 'logo-only',
			title: 'Logo Only',
			svg: `<svg width="32" height="22" viewBox="0 0 32 22"><circle cx="16" cy="11" r="6" fill="currentColor" stroke="none" opacity="0.4"/></svg>`,
		},
		{
			value: 'text-only',
			title: 'Text Only',
			svg: `<svg width="32" height="22" viewBox="0 0 32 22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="8" y1="8" x2="24" y2="8"/><line x1="6" y1="12" x2="26" y2="12"/><line x1="10" y1="16" x2="22" y2="16"/></svg>`,
		},
	];
</script>

<div class="right-panel">
	<!-- Top bar -->
	<div class="rp-topbar">
		<button class="rp-icon-btn" title="Settings">
			<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2"/><path d="M6.5 1v2M6.5 10v2M1 6.5h2M10 6.5h2M2.8 2.8l1.4 1.4M8.8 8.8l1.4 1.4M2.8 10.2l1.4-1.4M8.8 4.2l1.4-1.4"/></svg>
		</button>
		<button class="rp-icon-btn" title="Download">
			<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.3"><line x1="6.5" y1="2" x2="6.5" y2="11"/><polyline points="3,7 6.5,11 10,7"/><line x1="2.5" y1="2" x2="10.5" y2="2"/></svg>
		</button>
		<button class="rp-icon-btn" title="More">
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

		<!-- ======================== HEADER ======================== -->
		{#if blockType === 'header'}

			<PropSection title="Layout">
				<div class="rp-layout-picker">
					{#each layouts as opt}
						<button
							type="button"
							class="rp-layout-btn"
							class:active={(props.layout ?? 'logo-left') === opt.value}
							title={opt.title}
							onclick={() => setProp('layout', opt.value)}
						>
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html opt.svg}
						</button>
					{/each}
				</div>
			</PropSection>

			<PropSection title="Content">
				<div class="rp-flex-col">
					{#if (props.layout ?? 'logo-left') !== 'text-only'}
						<div>
							<label class={labelClass}>Logo URL</label>
							<input type="text" class={inputClass} value={props.logoUrl ?? ''} oninput={(e) => setProp('logoUrl', (e.target as HTMLInputElement).value)} />
						</div>
						<NumberInput label="Logo Size" value={props.logoWidth ?? 40} unit="px" onchange={(v) => setProp('logoWidth', v)} />
					{/if}
					{#if (props.layout ?? 'logo-left') !== 'logo-only'}
						<div>
							<label class={labelClass}>Company Name</label>
							<input type="text" class={inputClass} value={props.companyName ?? ''} oninput={(e) => setProp('companyName', (e.target as HTMLInputElement).value)} />
						</div>
						<div>
							<label class={labelClass}>Tagline</label>
							<input type="text" class={inputClass} value={props.tagline ?? ''} oninput={(e) => setProp('tagline', (e.target as HTMLInputElement).value)} />
						</div>
						<NumberInput label="Font Size" value={props.fontSize ?? 20} unit="px" onchange={(v) => setProp('fontSize', v)} />
					{/if}
				</div>
			</PropSection>

			<PropSection title="Colors">
				<div class="rp-flex-col">
					<div>
						<label class={labelClass}>Accent Color <span class="rp-label-hint">(buttons & theme)</span></label>
						<ColorPicker value={props.accentColor ?? '#1daa82'} onchange={(hex) => setProp('accentColor', hex)} />
					</div>
					<div>
						<label class={labelClass}>Background</label>
						<ColorPicker value={props.backgroundColor ?? '#1daa82'} onchange={(hex) => setProp('backgroundColor', hex)} />
					</div>
					{#if (props.layout ?? 'logo-left') !== 'logo-only'}
						<div>
							<label class={labelClass}>Text Color</label>
							<ColorPicker value={props.color ?? '#ffffff'} onchange={(hex) => setProp('color', hex)} />
						</div>
					{/if}
				</div>
			</PropSection>

		<!-- ======================== TEXT BLOCKS ======================== -->
		{:else if blockType === 'heading' || blockType === 'subheading' || blockType === 'content'}

			<PropSection title="Content">
				<div class="rp-flex-col">
					<div>
						<label class={labelClass}>Text</label>
						<textarea
							class={inputClass}
							rows="3"
							value={props.text ?? ''}
							oninput={(e) => setProp('text', (e.target as HTMLTextAreaElement).value)}
						></textarea>
					</div>
				</div>
			</PropSection>

			<PropSection title="Typography">
				<div class="rp-flex-col">
					<NumberInput label="Font Size" value={props.fontSize ?? 14} unit="px" onchange={(v) => setProp('fontSize', v)} />
					<div>
						<label class={labelClass}>Weight</label>
						<div class="rp-flex-row">
							<button type="button" class="rp-width-pill" class:active={(props.fontWeight ?? 'normal') === 'normal'} onclick={() => setProp('fontWeight', 'normal')}>Normal</button>
							<button type="button" class="rp-width-pill" class:active={(props.fontWeight ?? 'normal') === 'bold'} onclick={() => setProp('fontWeight', 'bold')}>Bold</button>
						</div>
					</div>
					<div>
						<label class={labelClass}>Color</label>
						<ColorPicker value={props.color ?? '#374151'} onchange={(hex) => setProp('color', hex)} />
					</div>
					<div>
						<label class={labelClass}>Alignment</label>
						<AlignmentPills value={props.align ?? 'left'} onchange={(a) => setProp('align', a)} />
					</div>
				</div>
			</PropSection>

		<!-- ======================== BUTTON ======================== -->
		{:else if blockType === 'button'}

			<PropSection title="Button">
				<div class="rp-flex-col">
					<div>
						<label class={labelClass}>Label</label>
						<input type="text" class={inputClass} value={props.text ?? ''} oninput={(e) => setProp('text', (e.target as HTMLInputElement).value)} />
					</div>
					<div>
						<label class={labelClass}>Link URL</label>
						<div class="rp-link-row">
							<svg width="14" height="14" style="color:#1daa82;flex-shrink:0;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
							</svg>
							<input type="text" value={props.href ?? ''} oninput={(e) => setProp('href', (e.target as HTMLInputElement).value)} />
						</div>
					</div>
					<div>
						<label class={labelClass}>Width</label>
						<div class="rp-flex-row">
							<button type="button" class="rp-width-pill" class:active={buttonWidthMode === 'auto'} onclick={() => setProp('width', 0)}>Auto</button>
							<button type="button" class="rp-width-pill" class:active={buttonWidthMode === 'custom'} onclick={() => setProp('width', 200)}>Custom</button>
							<button type="button" class="rp-width-pill" class:active={buttonWidthMode === 'full'} onclick={() => setProp('width', -1)}>Full</button>
						</div>
						{#if buttonWidthMode === 'custom'}
							<div style="margin-top:8px;">
								<NumberInput label="Width" value={props.width} unit="px" min={40} max={600} onchange={(v) => setProp('width', v)} />
							</div>
						{/if}
					</div>
					<NumberInput label="Radius" value={props.borderRadius ?? 6} unit="px" max={50} onchange={(v) => setProp('borderRadius', v)} />
				</div>
			</PropSection>

			<PropSection title="Colors">
				<div class="rp-flex-col">
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

		<!-- ======================== IMAGE ======================== -->
		{:else if blockType === 'image'}

			<PropSection title="Image">
				<div class="rp-flex-col">
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
						<div class="rp-link-row">
							<svg width="14" height="14" style="color:#1daa82;flex-shrink:0;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
							</svg>
							<input type="text" value={props.href ?? ''} oninput={(e) => setProp('href', (e.target as HTMLInputElement).value)} />
						</div>
					</div>
				</div>
			</PropSection>

		<!-- ======================== LIST ======================== -->
		{:else if blockType === 'list'}

			<PropSection title="Items">
				<div class="rp-flex-col">
					{#each (props.items ?? []) as item, i}
						<div class="rp-item-row">
							<input
								type="text"
								class={inputClass}
								value={item}
								oninput={(e) => {
									const updated = [...(props.items ?? [])];
									updated[i] = (e.target as HTMLInputElement).value;
									setProp('items', updated);
								}}
							/>
							<button
								type="button"
								class="rp-del-btn"
								onclick={() => {
									const updated = (props.items ?? []).filter((_: string, idx: number) => idx !== i);
									setProp('items', updated);
								}}
							>
								<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8">
									<line x1="3" y1="3" x2="9" y2="9"/><line x1="9" y1="3" x2="3" y2="9"/>
								</svg>
							</button>
						</div>
					{/each}
					<button
						type="button"
						class="rp-add-btn"
						onclick={() => setProp('items', [...(props.items ?? []), 'New item'])}
					>+ Add item</button>
				</div>
			</PropSection>

			<PropSection title="Style">
				<div class="rp-flex-col">
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

		<!-- ======================== TABLE ======================== -->
		{:else if blockType === 'table'}

			<PropSection title="Table">
				<div class="rp-flex-col">
					<label class="rp-checkbox-row">
						<input type="checkbox" checked={props.headerRow ?? true} onchange={(e) => setProp('headerRow', (e.target as HTMLInputElement).checked)} />
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
				<div class="rp-flex-col">
					{#each props.rows ?? [] as row, i}
						<div class="rp-item-row">
							<div class="rp-flex-col" style="flex:1;">
								<input class={inputClass} style="font-size:10.5px;" value={row.col1} oninput={(e) => {
									const rows = [...(props.rows ?? [])];
									rows[i] = { ...rows[i], col1: (e.target as HTMLInputElement).value };
									setProp('rows', rows);
								}} placeholder="Col 1" />
								<input class={inputClass} style="font-size:10.5px;" value={row.col2} oninput={(e) => {
									const rows = [...(props.rows ?? [])];
									rows[i] = { ...rows[i], col2: (e.target as HTMLInputElement).value };
									setProp('rows', rows);
								}} placeholder="Col 2" />
							</div>
							<button class="rp-del-btn" onclick={() => {
								const rows = (props.rows ?? []).filter((_: any, j: number) => j !== i);
								setProp('rows', rows);
							}}>
								<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8">
									<line x1="3" y1="3" x2="9" y2="9"/><line x1="9" y1="3" x2="3" y2="9"/>
								</svg>
							</button>
						</div>
					{/each}
					<button class="rp-add-btn" onclick={() => {
						setProp('rows', [...(props.rows ?? []), { col1: 'Item', col2: 'Description' }]);
					}}>+ Add row</button>
				</div>
			</PropSection>

			<PropSection title="Colors">
				<div class="rp-flex-col">
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

		<!-- ======================== FOOTER ======================== -->
		{:else if blockType === 'footer'}

			<PropSection title="Content">
				<div class="rp-flex-col">
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
						<textarea class={inputClass} rows="2" value={props.text ?? ''} oninput={(e) => setProp('text', (e.target as HTMLTextAreaElement).value)}></textarea>
					</div>
					<label class="rp-checkbox-row">
						<input type="checkbox" checked={props.showDivider ?? true} onchange={(e) => setProp('showDivider', (e.target as HTMLInputElement).checked)} />
						Show divider line
					</label>
				</div>
			</PropSection>

			<PropSection title="Links">
				<div class="rp-flex-col">
					{#each props.links ?? [] as link, i}
						<div class="rp-item-row">
							<div class="rp-flex-col" style="flex:1;">
								<input class={inputClass} style="font-size:10.5px;" value={link.label} placeholder="Label" oninput={(e) => {
									const links = [...(props.links ?? [])];
									links[i] = { ...links[i], label: (e.target as HTMLInputElement).value };
									setProp('links', links);
								}} />
								<input class={inputClass} style="font-size:10.5px;" value={link.url} placeholder="URL" oninput={(e) => {
									const links = [...(props.links ?? [])];
									links[i] = { ...links[i], url: (e.target as HTMLInputElement).value };
									setProp('links', links);
								}} />
							</div>
							<button class="rp-del-btn" onclick={() => {
								const links = (props.links ?? []).filter((_: any, j: number) => j !== i);
								setProp('links', links);
							}}>
								<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8">
									<line x1="3" y1="3" x2="9" y2="9"/><line x1="9" y1="3" x2="3" y2="9"/>
								</svg>
							</button>
						</div>
					{/each}
					<button class="rp-add-btn" onclick={() => {
						setProp('links', [...(props.links ?? []), { label: 'Link', url: 'https://' }]);
					}}>+ Add link</button>
				</div>
			</PropSection>

			<PropSection title="Unsubscribe">
				<div class="rp-flex-col">
					<div>
						<label class={labelClass}>Link Text</label>
						<input class={inputClass} value={props.unsubText ?? 'Unsubscribe'} oninput={(e) => setProp('unsubText', (e.target as HTMLInputElement).value)} />
					</div>
					<div>
						<label class={labelClass}>Link URL</label>
						<input class={inputClass} value={props.unsubUrl ?? ''} oninput={(e) => setProp('unsubUrl', (e.target as HTMLInputElement).value)} />
					</div>
				</div>
			</PropSection>

			<PropSection title="Typography">
				<div class="rp-flex-col">
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

		<!-- ======================== SECTION ======================== -->
		{:else if blockType === 'section'}

			<PropSection title="Section">
				<div class="rp-flex-col">
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
				<div class="rp-flex-col">
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

	/* Inputs & labels */
	.right-panel :global(.rp-input) {
		width: 100%;
		background: #fafafa;
		border: 1px solid #e8e8e8;
		border-radius: 5px;
		padding: 5px 8px;
		font-size: 11.5px;
		color: #333;
		outline: none;
		font-family: inherit;
		transition: border-color 0.15s;
		box-sizing: border-box;
	}
	.right-panel :global(.rp-input:focus) { border-color: #1daa82; }
	.right-panel :global(textarea.rp-input) { resize: none; line-height: 1.5; }
	.right-panel :global(.rp-label) {
		display: block;
		font-size: 10px;
		color: #aaa;
		margin-bottom: 4px;
		font-weight: 400;
	}
	.right-panel :global(.rp-label-hint) {
		font-size: 9px;
		color: #ccc;
	}
	.right-panel :global(.rp-add-btn) {
		font-size: 11px;
		color: #1daa82;
		font-weight: 500;
		cursor: pointer;
		background: none;
		border: none;
		padding: 0;
		text-align: left;
		font-family: inherit;
	}
	.right-panel :global(.rp-add-btn:hover) { text-decoration: underline; }
	.right-panel :global(.rp-del-btn) {
		color: #ccc;
		cursor: pointer;
		background: none;
		border: none;
		padding: 2px;
		display: flex;
		align-items: center;
		flex-shrink: 0;
		transition: color 0.1s;
	}
	.right-panel :global(.rp-del-btn:hover) { color: #e55; }
	.right-panel :global(.rp-width-pill) {
		flex: 1;
		padding: 5px 0;
		border: 1px solid #e0e0e0;
		border-radius: 5px;
		font-size: 10.5px;
		text-align: center;
		cursor: pointer;
		color: #666;
		background: #fff;
		font-family: inherit;
		transition: all 0.15s;
	}
	.right-panel :global(.rp-width-pill:hover) { border-color: #ccc; }
	.right-panel :global(.rp-width-pill.active) {
		border-color: #1daa82;
		background: #edf8f4;
		color: #1daa82;
	}
	.right-panel :global(.rp-checkbox-row) {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
		color: #666;
		cursor: pointer;
	}
	.right-panel :global(.rp-checkbox-row input) { accent-color: #1daa82; }
	.right-panel :global(.rp-link-row) {
		display: flex;
		align-items: center;
		gap: 6px;
		border: 1px solid #e8e8e8;
		border-radius: 5px;
		padding: 5px 8px;
		background: #fafafa;
	}
	.right-panel :global(.rp-link-row input) {
		border: none;
		background: transparent;
		font-size: 11px;
		color: #333;
		outline: none;
		flex: 1;
		min-width: 0;
		font-family: inherit;
	}
	.right-panel :global(.rp-item-row) { display: flex; gap: 5px; align-items: center; }
	.right-panel :global(.rp-item-row .rp-input) { flex: 1; }
	.right-panel :global(.rp-flex-col) { display: flex; flex-direction: column; gap: 8px; }
	.right-panel :global(.rp-flex-row) { display: flex; gap: 4px; }

	/* Header layout picker */
	.right-panel :global(.rp-layout-picker) {
		display: flex;
		gap: 4px;
	}
	.right-panel :global(.rp-layout-btn) {
		flex: 1;
		height: 32px;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		background: #fff;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 4px;
		transition: all 0.15s;
		color: #bbb;
	}
	.right-panel :global(.rp-layout-btn:hover) {
		border-color: #ccc;
		color: #666;
	}
	.right-panel :global(.rp-layout-btn.active) {
		border-color: #1daa82;
		background: #edf8f4;
		color: #1daa82;
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
	.rp-empty span { font-size: 12px; color: #bbb; }
</style>
