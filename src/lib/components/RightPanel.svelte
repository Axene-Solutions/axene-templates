<script lang="ts">
	// The editor's right column: the Properties aside of Editor.dc.html (renderVals, right:
	// customize, right: styles, email container), wired to the real editor store. Every edit goes
	// through the store setters with the design's merge keys, so typing, hex typing and number
	// scrubbing join one undo step. The Insert field modal renders here while view.modal is
	// 'insert'; its Manage links step is inside the same dialog.
	import { onMount } from 'svelte';
	import { editor, getPath, view } from '$lib/store.svelte';
	import { mailerData } from '$lib/mailer-data.svelte';
	import { theme as appTheme } from '$lib/stores/theme.svelte';
	import { analyzePlaceholders, fallbackError, formatLink } from '$lib/placeholders';
	import { resolveColor } from '$lib/colors';
	import { textOn } from '$lib/template-settings';
	import { BUTTON_WIDTHS, CORNERS, WEIGHTS, buttonWidthMode, type CornerStyle, type Sides } from '$lib/panel/constants';
	import type { SuggestFieldDef, SuggestLinkDef } from '$lib/panel/suggest';
	import { CATEGORY_GROUPS } from './editor/categories';
	import LinksManager from './editor/LinksManager.svelte';
	import AddButton from './panel/AddButton.svelte';
	import AlignmentControl from './panel/AlignmentControl.svelte';
	import BorderControls from './panel/BorderControls.svelte';
	import CheckboxRow from './panel/CheckboxRow.svelte';
	import CollapsibleSection from './panel/CollapsibleSection.svelte';
	import ColorGrid from './panel/ColorGrid.svelte';
	import ContentField from './panel/ContentField.svelte';
	import EmptySelection from './panel/EmptySelection.svelte';
	import FontSelect from './panel/FontSelect.svelte';
	import InsertFieldModal from './panel/InsertFieldModal.svelte';
	import LayoutPicker from './panel/LayoutPicker.svelte';
	import NumberField from './panel/NumberField.svelte';
	import PanelHeader from './panel/PanelHeader.svelte';
	import PresetChips from './panel/PresetChips.svelte';
	import SegmentedControl from './panel/SegmentedControl.svelte';
	import ShadowPresets from './panel/ShadowPresets.svelte';
	import SpacingFields from './panel/SpacingFields.svelte';
	import TemplateDetails from './panel/TemplateDetails.svelte';
	import WarningsCard from './panel/WarningsCard.svelte';
	import WidthControl from './panel/WidthControl.svelte';

	onMount(() => {
		mailerData.loadFields();
		mailerData.loadLinks();
	});

	// ---------- real fields and links ----------
	const contacts = (n: number) => n + (n === 1 ? ' contact' : ' contacts');
	const builtins = $derived<SuggestFieldDef[]>(mailerData.builtins.map((f) => ({ key: f.key, label: f.label })));
	const contactFields = $derived<SuggestFieldDef[]>(
		mailerData.contactFields.filter((f) => !builtins.some((b) => b.key === f.key)).map((f) => ({ key: f.key, label: contacts(f.count) })),
	);
	const suggestFields = $derived<SuggestFieldDef[]>([...builtins, ...contactFields.map((c) => ({ key: c.key, label: 'Custom field, ' + c.label }))]);
	const links = $derived<SuggestLinkDef[]>(mailerData.links.map((l) => ({ key: l.key, label: l.label, url: l.url })));

	// ---------- selection (design selB, P, t) ----------
	const selB = $derived(editor.selected);
	const P = $derived<Record<string, any>>(selB?.props ?? {});
	const t = $derived(selB?.type ?? '');
	const emailSel = $derived(editor.selectedKind === 'container');
	const S = $derived(editor.settings);
	const theme = $derived(editor.themeColor);
	const rc = (v: unknown) => (typeof v === 'string' ? resolveColor(v, theme) : '');
	const isTextual = $derived(t === 'heading' || t === 'subheading' || t === 'content' || t === 'section');

	function set(path: string, v: unknown, key?: string | null) {
		if (selB) editor.setProp(selB.id, path, v, key);
	}
	const num = (v: unknown, d = 0) => {
		const n = Number(v);
		return Number.isFinite(n) ? n : d;
	};
	// Stored weights are '400' / '600' / '700' (older templates have 'normal' and 'bold').
	const weightNum = (v: unknown) => (v === 'bold' ? 700 : v === 'normal' ? 400 : num(v));

	// ---------- content fields (design fields[]) ----------
	type Field =
		| { kind: 'sub'; label: string }
		| { kind: 'input'; label: string; path: string; rows?: number; url?: boolean; ph?: string; reset?: () => void; remove?: () => void; removeAria?: string }
		| { kind: 'num'; label: string; path: string; min: number; max: number; step: number; unit: string }
		| { kind: 'check'; label: string; path: string }
		| { kind: 'add'; label: string; add: () => void };

	const fields = $derived.by<Field[]>(() => {
		const out: Field[] = [];
		if (!selB) return out;
		const inp = (label: string, path: string, o: Partial<Extract<Field, { kind: 'input' }>> = {}) => out.push({ kind: 'input', label, path, ...o });
		const nf = (label: string, path: string, min: number, max: number, step: number, unit: string) => out.push({ kind: 'num', label, path, min, max, step, unit });
		const items = (P.items ?? []) as string[];
		const rows = (P.rows ?? []) as { col1: string; col2: string }[];
		const flinks = (P.links ?? []) as { label: string; url: string }[];
		if (t === 'header') {
			if (P.layout !== 'text-only') {
				inp('Logo URL', 'logoUrl', { url: true, ph: 'Axene logo (default)', reset: String(P.logoUrl || '').trim() ? () => set('logoUrl', '') : undefined });
				nf('Logo size', 'logoWidth', 16, 200, 1, 'px');
			}
			if (P.layout !== 'logo-only') {
				inp('Company name', 'companyName');
				inp('Tagline', 'tagline', { ph: 'Optional' });
			}
		}
		if (t === 'heading' || t === 'subheading') inp('Text', 'text', { rows: 2 });
		if (t === 'content') inp('Text', 'text', { rows: 5 });
		if (t === 'section') inp('Text', 'text', { rows: 3 });
		if (t === 'button') {
			inp('Label', 'text');
			inp('Link', 'href', { url: true, ph: 'https://' });
		}
		if (t === 'image') {
			inp('Image URL', 'src', { url: true, ph: 'https://' });
			inp('Alt text', 'alt', { ph: 'Describe the image' });
			inp('Link', 'href', { url: true, ph: 'Optional' });
			nf('Width', 'width', 80, 600, 1, 'px');
		}
		if (t === 'list') {
			items.forEach((_, i) =>
				inp('Item ' + (i + 1), 'items.' + i, { remove: () => set('items', items.filter((_x, j) => j !== i)), removeAria: 'Remove item ' + (i + 1) }),
			);
			out.push({ kind: 'add', label: 'Add item', add: () => set('items', [...items, 'New item']) });
		}
		if (t === 'table') {
			out.push({ kind: 'check', label: 'Show header row', path: 'headerRow' });
			if (P.headerRow) {
				inp('Column 1 header', 'col1Header');
				inp('Column 2 header', 'col2Header');
			}
			out.push({ kind: 'sub', label: 'Rows' });
			rows.forEach((_, i) => {
				inp('Row ' + (i + 1) + ', left', 'rows.' + i + '.col1');
				inp('Row ' + (i + 1) + ', right', 'rows.' + i + '.col2', { remove: () => set('rows', rows.filter((_x, j) => j !== i)), removeAria: 'Remove row ' + (i + 1) });
			});
			out.push({ kind: 'add', label: 'Add row', add: () => set('rows', [...rows, { col1: 'Item', col2: 'Description' }]) });
		}
		if (t === 'footer') {
			inp('Company name', 'companyName');
			inp('Company address', 'companyAddress');
			inp('Disclaimer', 'text', { rows: 2 });
			out.push({ kind: 'check', label: 'Show divider line', path: 'showDivider' });
			out.push({ kind: 'sub', label: 'Links' });
			flinks.forEach((_, i) => {
				inp('Link ' + (i + 1) + ' label', 'links.' + i + '.label');
				inp('Link ' + (i + 1) + ' URL', 'links.' + i + '.url', { url: true, remove: () => set('links', flinks.filter((_x, j) => j !== i)), removeAria: 'Remove link ' + (i + 1) });
			});
			out.push({ kind: 'add', label: 'Add link', add: () => set('links', [...flinks, { label: 'Link', url: 'https://' }]) });
			out.push({ kind: 'sub', label: 'Unsubscribe' });
			inp('Link text', 'unsubText');
			inp('Link URL', 'unsubUrl', { url: true });
		}
		return out;
	});

	const fieldValue = (path: string) => {
		const v = getPath(P, path);
		return v == null ? '' : String(v);
	};
	const insOpen = (path: string, mode: 'field' | 'link') => {
		const it = view.insertTarget;
		return view.modal === 'insert' && !!it && !!selB && it.id === selB.id && it.path === path && it.mode === mode;
	};

	/** Registers the SuggestField's input with the store so focus and the caret come back after an insert. */
	function register(node: HTMLElement, arg: { id: string; path: string }) {
		let un = () => {};
		const reg = (a: { id: string; path: string }) => {
			un();
			const el = node.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
			un = el ? editor.registerField(a.id, a.path, el) : () => {};
		};
		reg(arg);
		return { update: reg, destroy: () => un() };
	}

	// ---------- typography ----------
	const showSize = $derived(!!selB && t !== 'image');
	const showLine = $derived(isTextual || t === 'list');
	const showWeight = $derived(isTextual || t === 'header' || t === 'button');

	// ---------- colors (design colorRows) ----------
	type Row = { label: string; hint?: string; value: string; on: (hex: string, key?: string) => void };
	const fillOf = $derived(selB && P.backgroundColor && P.backgroundColor !== 'transparent' ? rc(P.backgroundColor) : '');
	const themeSet = (v: string, key?: string) => editor.setTemplateSettings({ color: v }, key ? 'tplhex' : null);
	const propSet = (path: string) => (v: string, key?: string) => set(path, v, key ? 'hex' + path : null);
	const colorRows = $derived.by<Row[]>(() => {
		if (!selB) return [];
		const out: Row[] = [{ label: 'Accent color', hint: '(buttons and theme)', value: theme, on: themeSet }];
		if (t === 'table') {
			out.push({ label: 'Header background', value: rc(P.headerBg), on: propSet('headerBg') });
			out.push({ label: 'Text color', value: rc(P.cellColor), on: propSet('cellColor') });
			out.push({ label: 'Lines', value: rc(P.borderColor), on: propSet('borderColor') });
		} else {
			out.push({ label: 'Background', hint: t === 'button' ? '(button fill)' : '', value: fillOf || '#ffffff', on: propSet('backgroundColor') });
			if (t !== 'image') {
				const c = t === 'header' || t === 'button' ? textOn(fillOf || '#ffffff', P.color) : fillOf ? textOn(fillOf, P.color) : rc(P.color);
				out.push({ label: 'Text color', value: c, on: propSet('color') });
			}
			if (t === 'list') out.push({ label: 'Bullet color', value: rc(P.bulletColor), on: propSet('bulletColor') });
			if (t === 'footer') out.push({ label: 'Link color', value: rc(P.linkColor), on: propSet('linkColor') });
		}
		return out;
	});

	// ---------- spacing ----------
	let padLinked = $state(false);
	const pads = $derived<Sides>({ top: num(P.paddingTop), right: num(P.paddingRight), bottom: num(P.paddingBottom), left: num(P.paddingLeft) });
	function setPads(next: Sides, key?: string) {
		if (!selB) return;
		editor.setProps(selB.id, { paddingTop: next.top, paddingRight: next.right, paddingBottom: next.bottom, paddingLeft: next.left }, key ?? null);
	}

	// ---------- shape ----------
	const hasRadius = $derived(t === 'button' || t === 'image' || t === 'section');
	const showShape = $derived(hasRadius || t === 'image' || t === 'button');
	const btnW = $derived(num(P.width));

	// ---------- email container ----------
	const dark = $derived(appTheme.resolved === 'dark');
	const cornerOptions = CORNERS.map((c) => ({ value: c.px, label: c.label }));
	const presetByPx = (px: number): CornerStyle => CORNERS.find((c) => c.px === px)?.value ?? 'square';

	// ---------- styles tab ----------
	const categories = CATEGORY_GROUPS.flatMap(([g, opts]) => opts.map(([value, label]) => ({ value, label: (g ? g + ': ' : '') + label })));

	// ---------- warnings (real placeholder analysis, the design's copy) ----------
	const warnings = $derived(
		analyzePlaceholders(editor.blocks, { fields: mailerData.knownFields, links: mailerData.knownLinks }).map((i) => {
			if (i.kind === 'unknown_field') return { text: i.text, reason: 'Not a contact field, and it has no fallback.' };
			if (i.kind === 'unknown_link') return { text: i.text, reason: 'No named link has this key.' };
			const inner = i.text.replace(/^\{+/, '').trim();
			if (/^[#/^]|^else\b/.test(inner)) return { text: i.text, reason: 'Logic blocks are not supported.' };
			return { text: i.text, reason: i.reason.charAt(0).toUpperCase() + i.reason.slice(1) + '.' };
		}),
	);

	// ---------- insert field modal ----------
	function pick(token: string) {
		const it = view.insertTarget;
		if (!it) return;
		if (it.mode === 'link') editor.replaceField(it.id, it.path, token);
		else editor.insertAt(it.id, it.path, token);
		view.closeModal();
	}

	const sec = (k: string) => ({ open: view.isOpen(k), ontoggle: () => view.toggleSection(k) });
	const TABS = [
		{ value: 'customize' as const, label: 'Customize' },
		{ value: 'styles' as const, label: 'Styles' },
	];
</script>

<aside aria-label="Properties" style="width:300px;flex-shrink:0;padding:4px 16px 20px 12px;box-sizing:border-box;display:flex;flex-direction:column;gap:14px;overflow:auto">
	<SegmentedControl role="tablist" stretch options={TABS} value={view.rightTab} onchange={(v) => (view.rightTab = v)} />

	{#if view.rightTab === 'customize'}
		{#if emailSel}
			<PanelHeader title="Email" chip="Container" ondeselect={() => editor.deselect()} />
			<CollapsibleSection title="Layout" {...sec('eLayout')}>
				<WidthControl value={S.width} onchange={(v, key) => editor.setTemplateSettings({ width: v }, key)} device={view.device} ondevice={(d) => (view.device = d)} />
			</CollapsibleSection>
			<CollapsibleSection title="Appearance" {...sec('eLook')}>
				<ColorGrid label="Background" value={S.bg} onchange={(v, key) => editor.setTemplateSettings({ bg: v }, key ? 'ebg' : null)} />
				<ColorGrid label="Page background" hint="(around the email)" value={S.pageBg || (dark ? '#1e1c1a' : '#efeee5')} onchange={(v, key) => editor.setTemplateSettings({ pageBg: v }, key ? 'epg' : null)} />
			</CollapsibleSection>
			<CollapsibleSection title="Shape" {...sec('eShape')}>
				<NumberField label="Radius" value={editor.cornerPx} min={0} max={32} unit="px" ariaLabel="Email corner radius" mergeKey="eradius" onchange={(v, key) => editor.setContainerRadius(v, key)} />
				<PresetChips ariaLabel="Corner presets" options={cornerOptions} value={editor.cornerPx} onpick={(px) => editor.setCorners(presetByPx(px))} />
			</CollapsibleSection>
			<CollapsibleSection title="Border" {...sec('eBorder')}>
				<BorderControls
					borderStyle={S.bStyle}
					onstyle={(v) => editor.setTemplateSettings({ bStyle: v })}
					width={S.bWidth}
					onwidth={(v, key) => editor.setTemplateSettings({ bWidth: v }, key)}
					color={S.bColor}
					oncolor={(v, key) => editor.setTemplateSettings({ bColor: v }, key ? 'ebc' : null)}
				/>
			</CollapsibleSection>
			<CollapsibleSection title="Shadow" {...sec('eShadow')}>
				<ShadowPresets value={S.shadow} onchange={(v) => editor.setTemplateSettings({ shadow: v })} />
			</CollapsibleSection>
			<CollapsibleSection title="Spacing" {...sec('eSpace')}>
				<NumberField label="Padding" value={S.pad} min={0} max={48} unit="px" ariaLabel="Email inner padding" mergeKey="epad" onchange={(v, key) => editor.setTemplateSettings({ pad: v }, key)} />
				<span style="font-size:12px;line-height:1.45;color:var(--muted)">Inner padding between the email edge and its blocks.</span>
			</CollapsibleSection>
			<CollapsibleSection title="Typography" {...sec('eType')}>
				<div class="lbl">Font family</div>
				<FontSelect value={S.font} onchange={(v) => editor.setTemplateSettings({ font: v })} loadFonts={false} onwarm={view.loadAllFonts} />
				<ColorGrid label="Text color" hint="(all text blocks)" value={S.textColor} onchange={(v, key) => editor.setBaseTextColor(v, key ? 'etext' : null)} />
			</CollapsibleSection>
		{:else if !selB}
			<EmptySelection />
		{:else}
			{@const id = selB.id}
			<PanelHeader title={editor.typeName(selB.type)} ondelete={() => view.requestDelete(id)} ondeselect={() => editor.deselect()} />

			<CollapsibleSection title="Layout" {...sec('layout')}>
				{#if t === 'header'}
					<LayoutPicker value={P.layout} onchange={(v) => set('layout', v)} />
				{/if}
				<AlignmentControl value={P.align} onchange={(v) => set('align', v)} />
			</CollapsibleSection>

			<CollapsibleSection title="Content" {...sec('content')}>
				{#key id}
					{#each fields as f, k (t + ':' + k + ':' + ('path' in f ? f.path : f.label))}
						{#if f.kind === 'sub'}
							<div class="cap" style="padding-top:4px">{f.label}</div>
						{:else if f.kind === 'input'}
							{@const path = f.path}
							<div style="display:contents" use:register={{ id, path }}>
								<ContentField
									label={f.label}
									value={fieldValue(path)}
									onchange={(v) => set(path, v, path)}
									fields={suggestFields}
									{links}
									multiline={!!f.rows}
									rows={f.rows ?? 1}
									placeholder={f.ph ?? ''}
									url={!!f.url}
									oncaret={(c) => editor.rememberCaret(id, path, c)}
									oninsert={() => view.openInsert(id, path, 'field')}
									insertOpen={insOpen(path, 'field')}
									onlink={f.url ? () => view.openInsert(id, path, 'link') : undefined}
									linkOpen={insOpen(path, 'link')}
									onreset={f.reset}
									onremove={f.remove}
									removeLabel={f.removeAria ?? 'Remove'}
								/>
							</div>
						{:else if f.kind === 'num'}
							{@const path = f.path}
							<NumberField label={f.label} value={num(P[path])} min={f.min} max={f.max} step={f.step} unit={f.unit} mergeKey={path} onchange={(v, key) => set(path, v, key)} />
						{:else if f.kind === 'check'}
							{@const path = f.path}
							<CheckboxRow label={f.label} checked={!!P[path]} onchange={(on) => set(path, on)} />
						{:else}
							<AddButton label={f.label} onclick={f.add} />
						{/if}
					{/each}
				{/key}
				{#if !fields.length}<div style="font-size:12.5px;line-height:1.5;color:var(--muted)">This block has no text.</div>{/if}
			</CollapsibleSection>

			{#if showSize || showLine}
				<CollapsibleSection title="Typography" {...sec('typo')}>
					<div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:6px">
						{#if showSize}<NumberField label="Size" value={num(P.fontSize, 14)} min={8} max={72} unit="px" mergeKey="fontSize" onchange={(v, key) => set('fontSize', v, key)} />{/if}
						{#if showLine}<NumberField label="Line" value={num(P.lineHeight, 1.5)} min={1} max={2.6} step={0.05} unit="x" mergeKey="lineHeight" onchange={(v, key) => set('lineHeight', v, key)} />{/if}
					</div>
					{#if showWeight}
						<SegmentedControl label="Weight" variant="invert" options={WEIGHTS} value={weightNum(P.fontWeight)} onchange={(w) => set('fontWeight', String(w))} />
					{/if}
				</CollapsibleSection>
			{/if}

			<CollapsibleSection title="Colors" {...sec('colors')}>
				{#each colorRows as c (c.label)}
					<ColorGrid label={c.label} hint={c.hint ?? ''} value={c.value} onchange={c.on} />
				{/each}
			</CollapsibleSection>

			<CollapsibleSection title="Spacing" dense {...sec('spacing')}>
				<SpacingFields value={pads} linked={padLinked} onlink={(on) => (padLinked = on)} onchange={setPads} />
			</CollapsibleSection>

			{#if showShape}
				<CollapsibleSection title="Shape" {...sec('shape')}>
					<div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:6px">
						{#if hasRadius}<NumberField label="Radius" value={num(P.borderRadius)} min={0} max={40} unit="px" ariaLabel="Corner radius" mergeKey="borderRadius" onchange={(v, key) => set('borderRadius', v, key)} />{/if}
						{#if t === 'image'}<NumberField label="Height" value={num(P.imageHeight)} min={80} max={400} step={5} unit="px" ariaLabel="Image height" mergeKey="imageHeight" onchange={(v, key) => set('imageHeight', v, key)} />{/if}
					</div>
					{#if t === 'button'}
						<SegmentedControl
							label="Button width"
							ariaLabel="Button width"
							options={BUTTON_WIDTHS.map((w) => ({ value: w.value, label: w.label }))}
							value={buttonWidthMode(btnW)}
							onchange={(v) => set('width', BUTTON_WIDTHS.find((w) => w.value === v)?.width ?? 0)}
						/>
						{#if btnW > 0}
							<NumberField label="Width" value={btnW} min={40} max={600} unit="px" ariaLabel="Button width" mergeKey="width" onchange={(v, key) => set('width', v, key)} />
						{/if}
					{/if}
				</CollapsibleSection>
			{/if}
		{/if}
	{:else}
		<CollapsibleSection title="Theme color" {...sec('theme')}>
			<ColorGrid label="Theme color" hint="(buttons, header, bullets)" value={theme} onchange={themeSet} />
		</CollapsibleSection>
		<CollapsibleSection title="Font family" {...sec('font')}>
			<FontSelect value={S.font} onchange={(v) => editor.setTemplateSettings({ font: v })} loadFonts={false} onwarm={view.loadAllFonts} />
		</CollapsibleSection>
		<CollapsibleSection title="Email width" {...sec('width')}>
			<WidthControl value={S.width} onchange={(v, key) => editor.setTemplateSettings({ width: v }, key)} />
		</CollapsibleSection>
		<CollapsibleSection title="Corner style" {...sec('corners')}>
			<SegmentedControl
				ariaLabel="Corner style"
				options={CORNERS}
				value={CORNERS.find((c) => c.px === editor.cornerPx)?.value ?? null}
				onchange={(v) => editor.setCorners(v)}
			/>
			<span style="font-size:12px;line-height:1.45;color:var(--muted)">Rounds the email, buttons and images together.</span>
		</CollapsibleSection>
		{#if selB}
			{@const id = selB.id}
			<CollapsibleSection title="Block border" {...sec('border')}>
				<div class="lbl">{editor.typeName(selB.type)} block</div>
				<BorderControls borderStyle={P.borderStyle} onstyle={(v) => editor.setProp(id, 'borderStyle', v)} color={rc(P.borderColor)} oncolor={(v, key) => editor.setProp(id, 'borderColor', v, key ? 'hexborderColor' : null)} />
				<div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:6px">
					<NumberField label="Radius" value={num(P.blockRadius)} min={0} max={32} unit="px" ariaLabel="Block radius" mergeKey="blockRadius" onchange={(v, key) => editor.setProp(id, 'blockRadius', v, key)} />
				</div>
			</CollapsibleSection>
		{/if}
		<CollapsibleSection title="Template details" {...sec('meta')}>
			<TemplateDetails
				name={editor.templateName}
				onname={(v) => (editor.templateName = v)}
				category={editor.templateCategory}
				{categories}
				oncategory={(v) => (editor.templateCategory = v)}
				isPublic={editor.templateIsPublic}
				onpublic={(on) => (editor.templateIsPublic = on)}
			/>
		</CollapsibleSection>
	{/if}

	<WarningsCard {warnings} />
</aside>

{#if view.modal === 'insert' && view.insertTarget}
	<InsertFieldModal
		mode={view.insertTarget.mode}
		{builtins}
		{contactFields}
		{links}
		onpick={pick}
		onclose={() => view.closeModal()}
		linkExample={formatLink(links[0]?.key ?? 'order_online')}
		{fallbackError}
	>
		{#snippet manageLinks({ back })}
			<LinksManager ondone={back} />
		{/snippet}
	</InsertFieldModal>
{/if}
