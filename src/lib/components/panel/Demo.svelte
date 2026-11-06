<!--
	Demo: every right panel piece together with fake data, laid out like the design's
	Properties aside (300px wide). Not routed; it exists as a wiring reference and so
	svelte-check type checks every component with real props.

	Usage (anywhere, for a quick look): <Demo />
-->
<script lang="ts">
	import AddButton from './AddButton.svelte';
	import AlignmentControl from './AlignmentControl.svelte';
	import BorderControls from './BorderControls.svelte';
	import CheckboxRow from './CheckboxRow.svelte';
	import CollapsibleSection from './CollapsibleSection.svelte';
	import ColorGrid from './ColorGrid.svelte';
	import ContentField from './ContentField.svelte';
	import EmptySelection from './EmptySelection.svelte';
	import FontSelect from './FontSelect.svelte';
	import InsertFieldModal from './InsertFieldModal.svelte';
	import LayoutPicker from './LayoutPicker.svelte';
	import NumberField from './NumberField.svelte';
	import PanelHeader from './PanelHeader.svelte';
	import PresetChips from './PresetChips.svelte';
	import SegmentedControl from './SegmentedControl.svelte';
	import ShadowPresets from './ShadowPresets.svelte';
	import SpacingFields from './SpacingFields.svelte';
	import TemplateDetails from './TemplateDetails.svelte';
	import WarningsCard from './WarningsCard.svelte';
	import WidthControl from './WidthControl.svelte';
	import { BUTTON_WIDTHS, CORNERS, WEIGHTS, buttonWidthMode, type Align, type BorderStyle, type HeaderLayout, type ShadowLevel, type Sides } from '$lib/panel/constants';
	import { insertAt, type SuggestFieldDef, type SuggestLinkDef } from '$lib/panel/suggest';
	import type { InsertMode } from '$lib/panel/insert';

	// Fake data, the design's sample values.
	const BUILTINS: SuggestFieldDef[] = [
		{ key: 'name', label: 'Full name' },
		{ key: 'company', label: 'Company' },
		{ key: 'first_name', label: 'First name' },
		{ key: 'last_name', label: 'Last name' },
		{ key: 'email', label: 'Email address' },
		{ key: 'unsubscribe_url', label: 'Unsubscribe link' },
	];
	const CONTACT: SuggestFieldDef[] = [
		{ key: 'county', label: '412 contacts' },
		{ key: 'plan', label: '380 contacts' },
		{ key: 'last_order', label: '96 contacts' },
	];
	const SUGGEST_FIELDS: SuggestFieldDef[] = [...BUILTINS, ...CONTACT.map((c) => ({ key: c.key, label: 'Custom field, ' + c.label }))];
	let links = $state<SuggestLinkDef[]>([
		{ key: 'order_online', label: 'Order online', url: 'https://kahawa.test/order' },
		{ key: 'menu', label: 'Menu', url: 'https://kahawa.test/menu' },
	]);

	let tab = $state<'customize' | 'styles'>('customize');
	let layout = $state<HeaderLayout>('logo-left');
	let align = $state<Align>('left');
	let text = $state('Karibu, {' + '{name|friend}' + '}!');
	let href = $state('{' + '{link:order_online}' + '}');
	let caret = $state<Record<string, number>>({});
	let fontSize = $state(26);
	let lineHeight = $state(1.25);
	let weight = $state(700);
	let accent = $state('#1daa82');
	let bg = $state('transparent');
	let pads = $state<Sides>({ top: 14, right: 24, bottom: 14, left: 24 });
	let padLinked = $state(false);
	let radius = $state(8);
	let btnWidth = $state(0);
	let borderStyle = $state<BorderStyle>('solid');
	let borderColor = $state('#d1d5db');
	let borderWidth = $state(1);
	let shadow = $state<ShadowLevel>('soft');
	let width = $state(600);
	let device = $state<'desktop' | 'mobile'>('desktop');
	let font = $state('Arial');
	let corners = $state<'square' | 'soft' | 'round'>('soft');
	let showDivider = $state(true);
	let name = $state('Coffee welcome');
	let category = $state('welcome');
	let isPublic = $state(false);
	let selected = $state(true);
	let modal = $state<{ mode: InsertMode; path: 'text' | 'href' } | null>(null);
	let fieldRefs: Record<string, ContentField | undefined> = $state({});

	function closeModal() {
		const m = modal;
		modal = null;
		if (m) fieldRefs[m.path]?.focusAt(caret[m.path]);
	}
	function pickToken(token: string) {
		const m = modal;
		if (!m) return;
		if (m.mode === 'link') {
			href = token;
			caret.href = token.length;
		} else if (m.path === 'text') {
			const r = insertAt(text, caret.text, token);
			text = r.value;
			caret.text = r.caret;
		} else {
			const r = insertAt(href, caret.href, token);
			href = r.value;
			caret.href = r.caret;
		}
		closeModal();
	}
</script>

<aside
	aria-label="Properties"
	style="width:300px;flex-shrink:0;padding:4px 16px 20px 12px;box-sizing:border-box;display:flex;flex-direction:column;gap:14px;overflow:auto"
>
	<SegmentedControl
		role="tablist"
		stretch
		options={[
			{ value: 'customize', label: 'Customize' },
			{ value: 'styles', label: 'Styles' },
		]}
		value={tab}
		onchange={(v) => (tab = v as 'customize' | 'styles')}
	/>

	{#if tab === 'customize'}
		{#if !selected}
			<EmptySelection />
		{:else}
			<PanelHeader title="Heading" ondelete={() => (selected = false)} ondeselect={() => (selected = false)} />
			<CollapsibleSection title="Layout">
				<LayoutPicker value={layout} onchange={(v) => (layout = v)} />
				<AlignmentControl value={align} onchange={(v) => (align = v)} />
			</CollapsibleSection>
			<CollapsibleSection title="Content">
				<ContentField
					bind:this={fieldRefs.text}
					label="Text"
					multiline
					rows={2}
					value={text}
					onchange={(v) => (text = v)}
					fields={SUGGEST_FIELDS}
					{links}
					oncaret={(c) => (caret.text = c)}
					insertOpen={modal?.path === 'text'}
					oninsert={() => (modal = modal ? modal : { mode: 'field', path: 'text' })}
				/>
				<ContentField
					bind:this={fieldRefs.href}
					label="Link"
					url
					placeholder="https://"
					value={href}
					onchange={(v) => (href = v)}
					fields={SUGGEST_FIELDS}
					{links}
					oncaret={(c) => (caret.href = c)}
					insertOpen={modal?.path === 'href' && modal.mode === 'field'}
					oninsert={() => (modal = modal ? modal : { mode: 'field', path: 'href' })}
					linkOpen={modal?.path === 'href' && modal.mode === 'link'}
					onlink={() => (modal = modal ? modal : { mode: 'link', path: 'href' })}
				/>
				<CheckboxRow label="Show divider line" checked={showDivider} onchange={(on) => (showDivider = on)} />
				<AddButton label="Add item" onclick={() => (text += ' more')} />
			</CollapsibleSection>
			<CollapsibleSection title="Typography">
				<div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:6px">
					<NumberField label="Size" value={fontSize} min={8} max={72} unit="px" mergeKey="fontSize" onchange={(v) => (fontSize = v)} />
					<NumberField label="Line" value={lineHeight} min={1} max={2.6} step={0.05} unit="x" mergeKey="lineHeight" onchange={(v) => (lineHeight = v)} />
				</div>
				<SegmentedControl label="Weight" variant="invert" options={WEIGHTS} value={weight} onchange={(v) => (weight = v)} />
			</CollapsibleSection>
			<CollapsibleSection title="Colors">
				<ColorGrid label="Accent color" hint="(buttons and theme)" value={accent} onchange={(v) => (accent = v)} />
				<ColorGrid label="Background" value={bg === 'transparent' ? '#ffffff' : bg} onchange={(v) => (bg = v)} onclear={() => (bg = 'transparent')} />
			</CollapsibleSection>
			<CollapsibleSection title="Spacing" dense>
				<SpacingFields value={pads} linked={padLinked} onlink={(on) => (padLinked = on)} onchange={(next) => (pads = next)} />
			</CollapsibleSection>
			<CollapsibleSection title="Shape">
				<div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:6px">
					<NumberField label="Radius" value={radius} min={0} max={40} unit="px" ariaLabel="Corner radius" mergeKey="radius" onchange={(v) => (radius = v)} />
				</div>
				<SegmentedControl
					label="Button width"
					ariaLabel="Button width"
					options={BUTTON_WIDTHS.map((w) => ({ value: w.value, label: w.label }))}
					value={buttonWidthMode(btnWidth)}
					onchange={(v) => (btnWidth = BUTTON_WIDTHS.find((w) => w.value === v)?.width ?? 0)}
				/>
				{#if btnWidth > 0}
					<NumberField label="Width" value={btnWidth} min={40} max={600} unit="px" ariaLabel="Button width" mergeKey="width" onchange={(v) => (btnWidth = v)} />
				{/if}
			</CollapsibleSection>
			<PanelHeader title="Email" chip="Container" ondeselect={() => {}} />
			<CollapsibleSection title="Layout">
				<WidthControl value={width} onchange={(v) => (width = v)} {device} ondevice={(d) => (device = d)} />
			</CollapsibleSection>
			<CollapsibleSection title="Border">
				<BorderControls
					borderStyle={borderStyle}
					onstyle={(v) => (borderStyle = v)}
					width={borderWidth}
					onwidth={(v) => (borderWidth = v)}
					color={borderColor}
					oncolor={(v) => (borderColor = v)}
				/>
			</CollapsibleSection>
			<CollapsibleSection title="Shadow">
				<ShadowPresets value={shadow} onchange={(v) => (shadow = v)} />
			</CollapsibleSection>
			<CollapsibleSection title="Shape">
				<NumberField label="Radius" value={radius} min={0} max={32} unit="px" ariaLabel="Email corner radius" mergeKey="eradius" onchange={(v) => (radius = v)} />
				<PresetChips ariaLabel="Corner presets" options={CORNERS.map((c) => ({ value: c.px, label: c.label }))} value={radius} onpick={(v) => (radius = v)} />
			</CollapsibleSection>
		{/if}
	{:else}
		<CollapsibleSection title="Theme color">
			<ColorGrid label="Theme color" hint="(buttons, header, bullets)" value={accent} onchange={(v) => (accent = v)} />
		</CollapsibleSection>
		<CollapsibleSection title="Font family">
			<FontSelect value={font} onchange={(v) => (font = v)} />
		</CollapsibleSection>
		<CollapsibleSection title="Email width">
			<WidthControl value={width} onchange={(v) => (width = v)} />
		</CollapsibleSection>
		<CollapsibleSection title="Corner style">
			<SegmentedControl ariaLabel="Corner style" options={CORNERS} value={corners} onchange={(v) => (corners = v)} />
			<span style="font-size:12px;line-height:1.45;color:var(--color-muted)">Rounds the email, buttons and images together.</span>
		</CollapsibleSection>
		<CollapsibleSection title="Template details">
			<TemplateDetails
				{name}
				onname={(v) => (name = v)}
				{category}
				categories={[
					{ value: 'general', label: 'General' },
					{ value: 'welcome', label: 'User lifecycle: Welcome emails' },
				]}
				oncategory={(v) => (category = v)}
				{isPublic}
				onpublic={(on) => (isPublic = on)}
			/>
		</CollapsibleSection>
	{/if}

	<WarningsCard warnings={[{ text: '{' + '{plan_name}' + '}', reason: 'Not a contact field, and it has no fallback.' }]} />
</aside>

{#if modal}
	<InsertFieldModal mode={modal.mode} builtins={BUILTINS} contactFields={CONTACT} {links} onpick={pickToken} onclose={closeModal}>
		{#snippet manageLinks({ back })}
			<div style="display:flex;flex-direction:column;gap:4px">
				{#each links as l (l.key)}
					<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:var(--color-surface-2)">
						<div style="flex-grow:1;min-width:0">
							<div style="font-size:13px;font-weight:600">{l.label}</div>
							<div style="font-family:var(--font-mono);font-size:11.5px;color:var(--color-muted)">{l.url}</div>
						</div>
						<button type="button" aria-label={'Remove ' + l.label} onclick={() => (links = links.filter((x) => x.key !== l.key))}>Remove</button>
					</div>
				{/each}
			</div>
			<div style="display:flex;justify-content:flex-end;gap:8px"><button type="button" onclick={back}>Done</button></div>
		{/snippet}
	</InsertFieldModal>
{/if}
