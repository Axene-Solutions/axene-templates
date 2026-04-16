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
		<div class="rp-icon-group">
			<button class="rp-icon-btn" title="Settings">
				<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"/>
					<path d="M19.6224 10.3954L18.5247 7.7448L20 6L18 4L16.2647 5.48295L13.5578 4.36974L12.9353 2H10.981L10.3491 4.40113L7.70441 5.51596L6 4L4 6L5.45337 7.78885L4.3725 10.4463L2 11V13L4.40111 13.6555L5.51575 16.2997L4 18L6 20L7.79116 18.5403L10.397 19.6123L11 22H13L13.6045 19.6132L16.2551 18.5155C16.6969 18.8313 18 20 18 20L20 18L18.5159 16.2494L19.6139 13.598L21.9999 12.9772L22 11L19.6224 10.3954Z"/>
				</svg>
			</button>
			<button class="rp-icon-btn" title="Download HTML">
				<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
					<path d="M6 20L18 20"/>
					<path d="M12 4V16M12 16L15.5 12.5M12 16L8.5 12.5"/>
				</svg>
			</button>
			<button class="rp-icon-btn" title="More options">
				<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
				</svg>
			</button>
		</div>

		<button class="rp-use-mail">
			<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
				<path d="M22 12L3 20L6.5625 12L3 4L22 12Z"/>
				<path d="M6.5 12L22 12"/>
			</svg>
			Use Mail
		</button>
	</div>

	<!-- Tab switcher -->
	<div class="rp-tab-wrap">
		<button
			class="rp-tab"
			class:active={activeTab === 'customize'}
			onclick={() => activeTab = 'customize'}
		>Customize</button>
		<button
			class="rp-tab"
			class:active={activeTab === 'styles'}
			onclick={() => activeTab = 'styles'}
		>Styles</button>
		<div class="rp-tab-indicator" style="transform: translateX({activeTab === 'customize' ? '0%' : '100%'})"></div>
	</div>

	<!-- Panel content -->
	{#if !editor.selected}
		<div class="rp-empty">
			<div class="rp-empty-icon">
				<svg width="20" height="20" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.3">
					<path d="M17 24l-1.5-5.5m0 0l-2.5 2.2.6-9.5 5.2 7.9-3.3-.6ZM14 3v2.5m5.8.2-1.6 1.6M22.5 11H20M8.8 16.7l-1.6 1.6M7 11H4.5m4-4.2L6.9 5.2"/>
				</svg>
			</div>
			<span class="rp-empty-title">Nothing selected</span>
			<span class="rp-empty-sub">Click a block on the canvas to edit its properties</span>
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
						<ColorPicker value={props.accentColor ?? '#FFD100'} onchange={(hex) => setProp('accentColor', hex)} />
					</div>
					<div>
						<label class={labelClass}>Background</label>
						<ColorPicker value={props.backgroundColor ?? '#FFD100'} onchange={(hex) => setProp('backgroundColor', hex)} />
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
							<svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
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
						<ColorPicker value={props.backgroundColor ?? '#FFD100'} onchange={(hex) => setProp('backgroundColor', hex)} />
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
							<svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
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
								<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8">
									<line x1="3" y1="3" x2="9" y2="9"/><line x1="9" y1="3" x2="3" y2="9"/>
								</svg>
							</button>
						</div>
					{/each}
					<button
						type="button"
						class="rp-add-btn"
						onclick={() => setProp('items', [...(props.items ?? []), 'New item'])}
					>
						<svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="6" y1="2" x2="6" y2="10"/><line x1="2" y1="6" x2="10" y2="6"/>
						</svg>
						Add item
					</button>
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
						<ColorPicker value={props.bulletColor ?? '#FFD100'} onchange={(hex) => setProp('bulletColor', hex)} />
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
								<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8">
									<line x1="3" y1="3" x2="9" y2="9"/><line x1="9" y1="3" x2="3" y2="9"/>
								</svg>
							</button>
						</div>
					{/each}
					<button class="rp-add-btn" onclick={() => {
						setProp('rows', [...(props.rows ?? []), { col1: 'Item', col2: 'Description' }]);
					}}>
						<svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="6" y1="2" x2="6" y2="10"/><line x1="2" y1="6" x2="10" y2="6"/>
						</svg>
						Add row
					</button>
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
								<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8">
									<line x1="3" y1="3" x2="9" y2="9"/><line x1="9" y1="3" x2="3" y2="9"/>
								</svg>
							</button>
						</div>
					{/each}
					<button class="rp-add-btn" onclick={() => {
						setProp('links', [...(props.links ?? []), { label: 'Link', url: 'https://' }]);
					}}>
						<svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="6" y1="2" x2="6" y2="10"/><line x1="2" y1="6" x2="10" y2="6"/>
						</svg>
						Add link
					</button>
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

	<!-- ======================== TEMPLATE METADATA ======================== -->
	<div class="rp-meta-section">
		<div class="rp-meta-header">
			<svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
				<rect x="2" y="2" width="12" height="12" rx="2"/>
				<line x1="5" y1="6" x2="11" y2="6"/>
				<line x1="5" y1="9" x2="8" y2="9"/>
			</svg>
			Template
		</div>

		<div class="rp-meta-body">
			<div>
				<label class={labelClass}>Name</label>
				<input type="text" class={inputClass} bind:value={editor.templateName} placeholder="My Email Template" />
			</div>

			<div>
				<label class={labelClass}>Category</label>
				<select class={inputClass} bind:value={editor.templateCategory}>
					<optgroup label="Authentication">
						<option value="otp">OTP / Passcodes</option>
						<option value="password-reset">Password Reset</option>
						<option value="email-verify">Email Verification</option>
						<option value="magic-link">Magic Login Links</option>
					</optgroup>

					<optgroup label="Transactional">
						<option value="receipt">Receipts</option>
						<option value="invoice">Invoices</option>
						<option value="order-confirm">Order Confirmations</option>
						<option value="payment-status">Payment Success/Failure</option>
					</optgroup>

					<optgroup label="Notifications">
						<option value="alert">Alerts</option>
						<option value="reminder">Reminders</option>
						<option value="activity">Activity Updates</option>
					</optgroup>

					<optgroup label="Marketing">
						<option value="marketing">General Marketing</option>
						<option value="newsletter">Newsletters</option>
						<option value="product-announcement">Product Announcements</option>
						<option value="promo">Promotions</option>
					</optgroup>

					<optgroup label="User Lifecycle">
						<option value="welcome">Welcome Emails</option>
						<option value="onboarding">Onboarding Sequences</option>
						<option value="re-engage">Re-engagement Emails</option>
					</optgroup>
				</select>
			</div>

			<label class="rp-checkbox-row">
				<input type="checkbox" bind:checked={editor.templateIsPublic} />
				Make template public
			</label>
		</div>
	</div>

</div>

<style>
	/* ─── Design tokens ─────────────────────────────────────────── */
	.right-panel {
		--accent:       #FFD100;
		--accent-dim:   rgba(255, 209, 0, 0.08);
		--accent-glow:  rgba(255, 209, 0, 0.18);
		--bg:           #111111;
		--bg-surface:   #181818;
		--bg-raised:    #1f1f1f;
		--bg-hover:     rgba(255,255,255,0.035);
		--border:       rgba(255,255,255,0.07);
		--border-focus: rgba(255, 209, 0, 0.5);
		--text-hi:      #f0f0f0;
		--text-mid:     #888;
		--text-lo:      #444;
		--radius-sm:    4px;
		--radius-md:    6px;
		--radius-lg:    8px;

	width: 224px;
	min-width: 224px;
	max-width: 224px;
	height: 100%;
	background: var(--bg);
	border-left: 1px solid var(--border);
	display: flex;
	flex-direction: column;
	flex-shrink: 0;
	overflow-y: auto;
	overflow-x: hidden;
	font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif;
	font-size: 12px;
	box-sizing: border-box;
	}
	.right-panel::-webkit-scrollbar { width: 3px; }
	.right-panel::-webkit-scrollbar-track { background: transparent; }
	.right-panel::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 99px; }
	.right-panel::-webkit-scrollbar-thumb:hover { background: #383838; }

	/* ─── Top bar ────────────────────────────────────────────────── */
	.rp-topbar {
		padding: 9px 10px;
		border-bottom: 1px solid var(--border);
		display: flex;
		align-items: center;
		gap: 4px;
		background: var(--bg);
	}
	.rp-icon-group {
		display: flex;
		align-items: center;
		gap: 3px;
	}
	.rp-icon-btn {
		width: 26px;
		height: 26px;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: var(--text-lo);
		background: transparent;
		transition: background 0.12s, color 0.12s, border-color 0.12s;
	}
	.rp-icon-btn:hover {
		background: var(--bg-hover);
		color: var(--text-mid);
		border-color: rgba(255,255,255,0.12);
	}
	.rp-use-mail {
		margin-left: auto;
		background: var(--accent);
		color: #000;
		border: none;
		border-radius: var(--radius-md);
		padding: 0 11px;
		height: 26px;
		font-size: 11.5px;
		font-weight: 600;
		cursor: pointer;
		letter-spacing: 0.01em;
		transition: background 0.12s, box-shadow 0.12s;
		display: flex;
		align-items: center;
		gap: 5px;
		white-space: nowrap;
		font-family: inherit;
	}
	.rp-use-mail:hover {
		background: #ffe033;
		box-shadow: 0 0 14px var(--accent-glow);
	}

	/* ─── Tabs ────────────────────────────────────────────────────── */
	.rp-tab-wrap {
		display: flex;
		position: relative;
		border-bottom: 1px solid var(--border);
		background: var(--bg);
	}
	.rp-tab {
		flex: 1;
		text-align: center;
		padding: 9px 0 8px;
		font-size: 11.5px;
		font-weight: 500;
		color: var(--text-lo);
		cursor: pointer;
		border: none;
		background: none;
		transition: color 0.15s;
		position: relative;
		z-index: 1;
		font-family: inherit;
		letter-spacing: 0.01em;
	}
	.rp-tab.active { color: var(--text-hi); }
	.rp-tab-indicator {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 50%;
		height: 2px;
		background: var(--accent);
		border-radius: 99px 99px 0 0;
		transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 0 8px var(--accent-glow);
	}

	/* ─── Inputs & labels (global so child components inherit) ──── */
	.right-panel :global(.rp-input) {
		width: 100%;
		background: var(--bg-raised);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 5px 8px;
		font-size: 11.5px;
		color: var(--text-hi);
		outline: none;
		font-family: inherit;
		transition: border-color 0.15s, box-shadow 0.15s;
		box-sizing: border-box;
		line-height: 1.4;
	}
	.right-panel :global(.rp-input::placeholder) { color: var(--text-lo); }
	.right-panel :global(.rp-input:focus) {
		border-color: var(--border-focus);
		box-shadow: 0 0 0 2px var(--accent-dim);
	}
	.right-panel :global(textarea.rp-input) { resize: none; line-height: 1.55; }
	.right-panel :global(select.rp-input) { color: var(--text-mid); cursor: pointer; }
	.right-panel :global(select.rp-input option) { background: #1c1c1c; color: var(--text-hi); }

	.right-panel :global(.rp-label) {
		display: block;
		font-size: 10px;
		color: var(--text-lo);
		margin-bottom: 5px;
		font-weight: 500;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	.right-panel :global(.rp-label-hint) {
		font-size: 9px;
		color: #3a3a3a;
		text-transform: none;
		letter-spacing: 0;
	}

	/* ─── Add / Delete buttons ────────────────────────────────────── */
	.right-panel :global(.rp-add-btn) {
		font-size: 11px;
		color: var(--accent);
		font-weight: 500;
		cursor: pointer;
		background: none;
		border: none;
		padding: 0;
		text-align: left;
		font-family: inherit;
		display: flex;
		align-items: center;
		gap: 5px;
		opacity: 0.8;
		transition: opacity 0.12s;
	}
	.right-panel :global(.rp-add-btn:hover) { opacity: 1; }

	.right-panel :global(.rp-del-btn) {
		color: var(--text-lo);
		cursor: pointer;
		background: none;
		border: none;
		padding: 3px;
		border-radius: var(--radius-sm);
		display: flex;
		align-items: center;
		flex-shrink: 0;
		transition: color 0.1s, background 0.1s;
	}
	.right-panel :global(.rp-del-btn:hover) {
		color: #e55;
		background: rgba(220, 50, 50, 0.08);
	}

	/* ─── Pill buttons ────────────────────────────────────────────── */
	.right-panel :global(.rp-width-pill) {
		flex: 1;
		padding: 5px 0;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: 10.5px;
		text-align: center;
		cursor: pointer;
		color: var(--text-mid);
		background: transparent;
		font-family: inherit;
		font-weight: 500;
		transition: all 0.12s;
	}
	.right-panel :global(.rp-width-pill:hover) {
		border-color: rgba(255,255,255,0.14);
		color: #bbb;
		background: var(--bg-hover);
	}
	.right-panel :global(.rp-width-pill.active) {
		border-color: rgba(255, 209, 0, 0.45);
		background: var(--accent-dim);
		color: var(--accent);
	}

	/* ─── Checkbox row ────────────────────────────────────────────── */
	.right-panel :global(.rp-checkbox-row) {
		display: flex;
		align-items: center;
		gap: 7px;
		font-size: 11px;
		color: var(--text-mid);
		cursor: pointer;
		user-select: none;
	}
	.right-panel :global(.rp-checkbox-row input[type="checkbox"]) {
		accent-color: var(--accent);
		width: 12px;
		height: 12px;
		cursor: pointer;
	}

	/* ─── Link row ────────────────────────────────────────────────── */
	.right-panel :global(.rp-link-row) {
		display: flex;
		align-items: center;
		gap: 6px;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 5px 8px;
		background: var(--bg-raised);
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	.right-panel :global(.rp-link-row:focus-within) {
		border-color: var(--border-focus);
		box-shadow: 0 0 0 2px var(--accent-dim);
	}
	.right-panel :global(.rp-link-row svg) { color: var(--accent); flex-shrink: 0; opacity: 0.7; }
	.right-panel :global(.rp-link-row input) {
		border: none;
		background: transparent;
		font-size: 11px;
		color: var(--text-hi);
		outline: none;
		flex: 1;
		min-width: 0;
		font-family: inherit;
	}
	.right-panel :global(.rp-link-row input::placeholder) { color: var(--text-lo); }

	/* ─── Item / flex helpers ─────────────────────────────────────── */
	.right-panel :global(.rp-item-row) {
		display: flex;
		gap: 5px;
		align-items: center;
	}
	.right-panel :global(.rp-item-row .rp-input) { flex: 1; }
	.right-panel :global(.rp-flex-col) { display: flex; flex-direction: column; gap: 9px; }
	.right-panel :global(.rp-flex-row) { display: flex; gap: 4px; }

	/* ─── Layout picker ───────────────────────────────────────────── */
	.right-panel :global(.rp-layout-picker) {
		display: flex;
		gap: 3px;
	}
	.right-panel :global(.rp-layout-btn) {
		flex: 1;
		height: 34px;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 4px;
		transition: all 0.12s;
		color: var(--text-lo);
	}
	.right-panel :global(.rp-layout-btn:hover) {
		border-color: rgba(255,255,255,0.14);
		color: var(--text-mid);
		background: var(--bg-hover);
	}
	.right-panel :global(.rp-layout-btn.active) {
		border-color: rgba(255, 209, 0, 0.45);
		background: var(--accent-dim);
		color: var(--accent);
	}

	/* ─── Empty state ─────────────────────────────────────────────── */
	.rp-empty {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 32px 20px;
	}
	.rp-empty-icon {
		width: 40px;
		height: 40px;
		border-radius: 10px;
		background: var(--bg-raised);
		border: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-lo);
		margin-bottom: 2px;
	}
	.rp-empty-title {
		font-size: 12px;
		font-weight: 600;
		color: var(--text-mid);
		letter-spacing: 0.01em;
	}
	.rp-empty-sub {
		font-size: 10.5px;
		color: var(--text-lo);
		text-align: center;
		line-height: 1.55;
		max-width: 160px;
	}

	/* ─── Template metadata section ───────────────────────────────── */
	.rp-meta-section {
		margin-top: auto;
		border-top: 1px solid var(--border);
		background: var(--bg-surface);
	}
	.rp-meta-header {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 12px 7px;
		font-size: 9.5px;
		font-weight: 600;
		letter-spacing: 0.07em;
		text-transform: uppercase;
		color: var(--text-lo);
		border-bottom: 1px solid var(--border);
	}
	.rp-meta-header svg { opacity: 0.6; }
	.rp-meta-body {
		padding: 11px 12px 14px;
		display: flex;
		flex-direction: column;
		gap: 9px;
	}
</style>