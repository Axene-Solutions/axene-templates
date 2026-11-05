<script lang="ts">
	import { editor } from '$lib/store.svelte';
	import PropSection from './PropSection.svelte';
	import ColorPicker from './ColorPicker.svelte';
	import AlignmentPills from './AlignmentPills.svelte';
	import SpacingEditor from './SpacingEditor.svelte';
	import NumberInput from './NumberInput.svelte';
	import Icon from './Icon.svelte';
	import SendModal from './SendModal.svelte';
	import SaveToMailerModal from './SaveToMailerModal.svelte';

	let activeTab = $state<'customize' | 'styles'>('customize');
	let sendOpen = $state(false);
	let saveMailerOpen = $state(false);

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
			<button
				class="rp-icon-btn"
				title="Download HTML"
				aria-label="Download HTML"
				onclick={() => editor.downloadHtml()}
				disabled={!editor.previewHtml}
			>
				<Icon name="download" width={14} height={14} />
			</button>
		</div>

		<button
			class="rp-save-mail"
			title={editor.mailerTemplateId ? 'Update the linked template in your Axene Mailer account' : 'Save this template into your Axene Mailer account'}
			onclick={() => (saveMailerOpen = true)}
		>
			<Icon name="save" width={14} height={14} />
			{editor.mailerTemplateId ? 'Update in Mailer' : 'Save to Mailer'}
		</button>

		<button class="rp-use-mail" title="Send this template with your Axene Mailer account" onclick={() => (sendOpen = true)}>
			<Icon name="send" width={14} height={14} />
			Send
		</button>
	</div>

	<SendModal open={sendOpen} onclose={() => (sendOpen = false)} />
	<SaveToMailerModal open={saveMailerOpen} onclose={() => (saveMailerOpen = false)} />

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
				<Icon name="pointer" width={22} height={22} />
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
							<Icon name="link" width={14} height={14} />
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
							<Icon name="link" width={14} height={14} />
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
								<Icon name="close" width={12} height={12} />
							</button>
						</div>
					{/each}
					<button
						type="button"
						class="rp-add-btn"
						onclick={() => setProp('items', [...(props.items ?? []), 'New item'])}
					>
						<Icon name="plus" width={12} height={12} />
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
								<Icon name="close" width={12} height={12} />
							</button>
						</div>
					{/each}
					<button class="rp-add-btn" onclick={() => {
						setProp('rows', [...(props.rows ?? []), { col1: 'Item', col2: 'Description' }]);
					}}>
						<Icon name="plus" width={12} height={12} />
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
								<Icon name="close" width={12} height={12} />
							</button>
						</div>
					{/each}
					<button class="rp-add-btn" onclick={() => {
						setProp('links', [...(props.links ?? []), { label: 'Link', url: 'https://' }]);
					}}>
						<Icon name="plus" width={12} height={12} />
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
			<Icon name="edit" width={12} height={12} />
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
					<option value="general">General</option>
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
		--accent:       var(--color-accent);
		--accent-dim:   var(--color-accent-soft);
		--accent-glow:  var(--color-accent-soft);
		--bg:           var(--color-surface);
		--bg-surface:   var(--color-surface);
		--bg-raised:    var(--color-surface-2);
		--bg-hover:     var(--color-surface-2);
		--border:       var(--color-border-1);
		--border-focus: var(--color-accent);
		--text-hi:      var(--color-text);
		--text-mid:     var(--color-muted);
		--text-lo:      var(--color-muted-soft);
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
	.right-panel::-webkit-scrollbar-thumb { background: var(--color-surface-2); border-radius: 99px; }
	.right-panel::-webkit-scrollbar-thumb:hover { background: var(--color-surface-2); }

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
		color: var(--text-mid);
		background: transparent;
		transition: background 0.12s, color 0.12s, border-color 0.12s;
	}
	.rp-icon-btn:hover:not(:disabled) {
		background: var(--bg-hover);
		color: var(--color-text);
		border-color: var(--color-border-1);
	}
	.rp-use-mail {
		margin-left: auto;
		background: var(--accent);
		color: #101010;
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
	.rp-use-mail:hover:not(:disabled) {
		background: color-mix(in srgb, var(--color-accent) 85%, var(--color-text));
		box-shadow: 0 0 14px var(--accent-glow);
	}
	/* Secondary action: outlined, so Send stays the primary button. */
	.rp-save-mail {
		margin-left: auto;
		background: transparent;
		color: var(--color-text);
		border: 1px solid var(--color-border-1);
		border-radius: var(--radius-md);
		padding: 0 10px;
		height: 26px;
		font-size: 11.5px;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 5px;
		white-space: nowrap;
		font-family: inherit;
		transition: background 0.12s, border-color 0.12s;
	}
	.rp-save-mail:hover {
		background: var(--bg-hover);
	}
	.rp-save-mail + .rp-use-mail {
		margin-left: 0;
	}
	.rp-use-mail:disabled,
	.rp-icon-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
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
	.right-panel :global(select.rp-input option) { background: var(--color-surface-2); color: var(--text-hi); }

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
		color: var(--color-muted-soft);
		text-transform: none;
		letter-spacing: 0;
	}

	/* ─── Add / Delete buttons ────────────────────────────────────── */
	.right-panel :global(.rp-add-btn) {
		font-size: 11px;
		color: var(--color-accent-ink);
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
		color: var(--color-danger);
		background: var(--color-danger-soft);
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
		border-color: var(--color-border-1);
		color: var(--color-muted);
		background: var(--bg-hover);
	}
	.right-panel :global(.rp-width-pill.active) {
		border-color: var(--color-accent);
		background: var(--accent-dim);
		color: var(--color-accent-ink);
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
		accent-color: var(--color-accent-ink);
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
	.right-panel :global(.rp-link-row svg) { color: var(--color-accent-ink); flex-shrink: 0; opacity: 0.7; }
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
		border-color: var(--color-border-1);
		color: var(--text-mid);
		background: var(--bg-hover);
	}
	.right-panel :global(.rp-layout-btn.active) {
		border-color: var(--color-accent);
		background: var(--accent-dim);
		color: var(--color-accent-ink);
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
	.rp-meta-header :global(.icon-wrapper) { opacity: 0.6; }
	.rp-meta-body {
		padding: 11px 12px 14px;
		display: flex;
		flex-direction: column;
		gap: 9px;
	}
</style>