<script lang="ts">
	import { tick } from 'svelte';
	import Icon from './Icon.svelte';
	import InsertFieldPopover from './InsertFieldPopover.svelte';
	import LinkPickerPopover from './LinkPickerPopover.svelte';

	// A text input or textarea with an "Insert field" button, and for URL inputs a named-link picker.
	// Inserts at the caret (or replaces the selection) and puts the caret after the inserted text.
	let {
		value,
		oninput,
		multiline = false,
		url = false,
		rows = 3,
		class: cls = 'rp-input',
		style = '',
		placeholder = '',
		label = '',
	}: {
		value: string;
		oninput: (v: string) => void;
		multiline?: boolean;
		url?: boolean;
		rows?: number;
		class?: string;
		style?: string;
		placeholder?: string;
		label?: string;
	} = $props();

	let el: HTMLInputElement | HTMLTextAreaElement | undefined = $state();
	let fieldBtn: HTMLButtonElement | undefined = $state();
	let linkBtn: HTMLButtonElement | undefined = $state();
	let fieldOpen = $state(false);
	let linkOpen = $state(false);
	let sel = { start: -1, end: -1 };

	function remember() {
		if (!el) return;
		sel = { start: el.selectionStart ?? el.value.length, end: el.selectionEnd ?? el.value.length };
	}

	async function finish(next: string, caret: number) {
		oninput(next);
		fieldOpen = false;
		linkOpen = false;
		await tick();
		// The caller's re-render may not have reached this element yet: set the DOM value so the caret is valid.
		if (el && el.value !== next) el.value = next;
		el?.focus();
		el?.setSelectionRange(caret, caret);
		sel = { start: caret, end: caret };
	}

	function insertField(token: string) {
		const v = value ?? '';
		const s = sel.start < 0 ? v.length : Math.min(sel.start, v.length);
		const e = sel.end < 0 ? v.length : Math.min(Math.max(sel.end, s), v.length);
		finish(v.slice(0, s) + token + v.slice(e), s + token.length);
	}

	function pickLink(token: string) {
		// A URL input holds one URL: the named link replaces it.
		finish(token, token.length);
	}

	function closeField() {
		fieldOpen = false;
		(el ?? fieldBtn)?.focus();
	}
	function closeLink() {
		linkOpen = false;
		(el ?? linkBtn)?.focus();
	}
	function toggleField() {
		remember();
		linkOpen = false;
		fieldOpen = !fieldOpen;
	}
	function toggleLink() {
		remember();
		fieldOpen = false;
		linkOpen = !linkOpen;
	}
</script>

<div class="pi" class:pi-multi={multiline}>
	{#if multiline}
		<textarea
			bind:this={el}
			class={cls}
			{rows}
			{style}
			{placeholder}
			aria-label={label || undefined}
			{value}
			oninput={(e) => oninput((e.target as HTMLTextAreaElement).value)}
			onselect={remember}
			onkeyup={remember}
			onmouseup={remember}
			onblur={remember}
		></textarea>
	{:else}
		<input
			bind:this={el}
			type="text"
			class={cls}
			{style}
			{placeholder}
			aria-label={label || undefined}
			{value}
			oninput={(e) => oninput((e.target as HTMLInputElement).value)}
			onselect={remember}
			onkeyup={remember}
			onmouseup={remember}
			onblur={remember}
		/>
	{/if}
	<div class="pi-actions">
		<button
			bind:this={fieldBtn}
			type="button"
			class="pi-btn"
			class:on={fieldOpen}
			aria-label="Insert field"
			title="Insert field"
			aria-haspopup="dialog"
			aria-expanded={fieldOpen}
			onclick={toggleField}
		>
			<Icon name="code" width={14} height={14} />
		</button>
		{#if url}
			<button
				bind:this={linkBtn}
				type="button"
				class="pi-btn"
				class:on={linkOpen}
				aria-label="Choose a named link"
				title="Named links"
				aria-haspopup="dialog"
				aria-expanded={linkOpen}
				onclick={toggleLink}
			>
				<Icon name="link" width={14} height={14} />
			</button>
		{/if}
	</div>
</div>
	{#if fieldOpen && fieldBtn}
		<InsertFieldPopover anchor={fieldBtn} onpick={insertField} onclose={closeField} />
	{/if}
	{#if linkOpen && linkBtn}
		<LinkPickerPopover anchor={linkBtn} onpick={pickLink} onclose={closeLink} />
	{/if}

<style>
	.pi { display: flex; gap: 4px; align-items: center; min-width: 0; }
	.pi-multi { align-items: flex-start; }
	.pi :global(.rp-input), .pi :global(input), .pi :global(textarea) { flex: 1; min-width: 0; }
	.pi-actions { display: flex; gap: 2px; flex-shrink: 0; }
	.pi-multi .pi-actions { flex-direction: column; }
	.pi-btn {
		width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
		background: transparent; border: 1px solid var(--color-border-1); border-radius: 5px;
		color: var(--color-muted); cursor: pointer; padding: 0;
	}
	.pi-btn:hover, .pi-btn.on { background: var(--color-accent-soft); color: var(--color-accent-ink); border-color: var(--color-accent); }
	.pi-btn:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 1px; }
</style>
