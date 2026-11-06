<!--
	ContentField: one text field of the Content section (design fields[].isInput). The label
	row has the Insert field button (code brackets), the Choose a named link button for URL
	fields, an optional "Use Axene logo" reset chip and an optional remove button; below it a
	SuggestField with the `{{` autocomplete and the fallback helper line.

	Usage:
		<ContentField bind:this={fieldRefs.text} label="Text" multiline rows={5} value={p.text}
			fields={FIELDS} links={links} onchange={(v) => setProp('text', v, 'text')}
			oncaret={(c) => (carets.text = c)}
			insertOpen={modal?.path === 'text' && modal.mode === 'field'}
			oninsert={() => openInsert('text', 'field')} />

	The buttons only report intent (oninsert, onlink, onreset, onremove); the editor opens the
	single InsertFieldModal and, when it closes, calls focusAt(caret) on this component.
-->
<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import SuggestField from './SuggestField.svelte';
	import type { SuggestFieldDef, SuggestLinkDef } from '$lib/panel/suggest';

	interface Props {
		label: string;
		value: string;
		onchange: (value: string) => void;
		fields: readonly SuggestFieldDef[];
		links: readonly SuggestLinkDef[];
		multiline?: boolean;
		rows?: number;
		placeholder?: string;
		/** URL field: mono input and the named link button. */
		url?: boolean;
		oncaret?: (caret: number) => void;
		oninsert: () => void;
		insertOpen?: boolean;
		onlink?: () => void;
		linkOpen?: boolean;
		/** Show the "Use Axene logo" chip (header logo URL with a custom value). */
		onreset?: () => void;
		resetLabel?: string;
		onremove?: () => void;
		removeLabel?: string;
	}
	let {
		label,
		value,
		onchange,
		fields,
		links,
		multiline = false,
		rows = 2,
		placeholder = '',
		url = false,
		oncaret,
		oninsert,
		insertOpen = false,
		onlink,
		linkOpen = false,
		onreset,
		resetLabel = 'Use Axene logo',
		onremove,
		removeLabel = 'Remove',
	}: Props = $props();

	let field: SuggestField | undefined = $state();

	/** Focus the input and put the caret at pos. */
	export function focusAt(pos?: number) {
		return field?.focusAt(pos);
	}

	const OPEN = 'background:var(--color-surface-3);color:var(--color-text)';
</script>

<div style="display:flex;flex-direction:column;gap:6px">
	<div style="display:flex;align-items:center;gap:2px">
		<span class="lbl" style="flex-grow:1">{label}</span>
		<button class="mini" type="button" aria-label="Insert field" title="Insert field" aria-expanded={insertOpen} style={insertOpen ? OPEN : ''} onclick={oninsert}
			><Icon name="code-brackets" width={15} height={15} /></button
		>
		{#if url && onlink}
			<button
				class="mini"
				type="button"
				aria-label="Choose a named link"
				title="Named links"
				aria-expanded={linkOpen}
				style={linkOpen ? OPEN : ''}
				onclick={onlink}><Icon name="link" width={15} height={15} /></button
			>
		{/if}
		{#if onreset}
			<button class="chip" type="button" onclick={onreset} title={resetLabel} style="display:inline-flex;align-items:center;gap:5px;font-family:inherit;margin-right:2px"
				><Icon name="magicpen" width={12} height={12} />{resetLabel}</button
			>
		{/if}
		{#if onremove}
			<button class="mini" type="button" aria-label={removeLabel} title={removeLabel} onclick={onremove}><Icon name="close" width={12} height={12} /></button>
		{/if}
	</div>
	<SuggestField bind:this={field} {label} {value} {onchange} {fields} {links} {multiline} {rows} {placeholder} mono={url} {oncaret} />
</div>

<style>
	.lbl {
		font-size: 12px;
		font-weight: 600;
		color: var(--color-muted);
		user-select: none;
		-webkit-user-select: none;
	}
	.mini {
		width: 26px;
		height: 26px;
		border-radius: 8px;
		border: 0;
		background: transparent;
		color: var(--color-muted);
		display: grid;
		place-items: center;
		cursor: pointer;
		padding: 0;
		flex-shrink: 0;
	}
	.mini:hover {
		background: var(--color-surface-3);
		color: var(--color-text);
	}
	.mini:focus-visible {
		outline: 2px solid #ffd100;
		outline-offset: 1px;
	}
	.chip {
		border: 0;
		cursor: pointer;
		font: inherit;
		font-size: 11.5px;
		font-weight: 500;
		padding: 4px 9px;
		border-radius: 4px;
		background: var(--color-surface-2);
		color: var(--color-muted);
	}
	.chip:hover {
		color: var(--color-text);
	}
	.chip:focus-visible {
		outline: 2px solid #ffd100;
		outline-offset: 1px;
	}
</style>
