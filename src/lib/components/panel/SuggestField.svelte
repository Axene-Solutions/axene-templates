<!--
	SuggestField: a right panel text input (or textarea with `multiline`) with the design's
	`{{` autocomplete. Typing `{{` plus a partial word opens "Fields and links": Contact fields
	and Named links (link: prefix), filtered as you type, first row highlighted. Click, Enter
	or Tab replaces the partial with the full token. Fields that can be empty insert
	`{{key|}}` with the caret before the closing braces and the helper line "Add a fallback so
	nobody sees a gap" shows until a fallback is typed; email, unsubscribe_url and links insert
	the complete token. ArrowUp / ArrowDown wrap, Esc dismisses (it stays dismissed for that
	`{{` until the caret leaves it). It stays closed after a `|` and inside a complete token.
	An unknown partial shows "No field called xyz" in the danger color.

	Usage:
		<SuggestField label="Text" multiline rows={2} value={p.text} fields={FIELDS} links={links}
			onchange={(v) => setProp('text', v, 'text')} oncaret={(c) => (caret.text = c)} />

	Props driven: the field never writes to a store. onchange(value) fires for every edit and
	accepted suggestion; oncaret(pos) reports the caret so an Insert field modal can insert there.
	bind:this and call focusAt(pos) to put focus and the caret back (after the modal closes).
-->
<script lang="ts">
	import { tick } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import {
		applySuggestion,
		detectTrigger,
		groupRows,
		hasEmptyFallback,
		suggestOptions,
		wrapIndex,
		type SuggestFieldDef,
		type SuggestLinkDef,
		type SuggestOption,
		type Trigger,
	} from '$lib/panel/suggest';

	interface Props {
		value: string;
		onchange: (value: string) => void;
		/** aria-label of the input (the visible label lives in the row above). */
		label: string;
		fields: readonly SuggestFieldDef[];
		links: readonly SuggestLinkDef[];
		multiline?: boolean;
		rows?: number;
		placeholder?: string;
		/** URL style: mono 12px. */
		mono?: boolean;
		oncaret?: (caret: number) => void;
		/** Turn the autocomplete off (the field still edits). */
		suggest?: boolean;
	}
	let {
		value,
		onchange,
		label,
		fields,
		links,
		multiline = false,
		rows = 2,
		placeholder = '',
		mono = false,
		oncaret,
		suggest = true,
	}: Props = $props();

	const uid = $props.id();
	const listId = `sug-list-${uid}`;
	const optId = (i: number) => `sug-opt-${uid}-${i}`;

	let el: HTMLInputElement | HTMLTextAreaElement | undefined = $state();
	let listEl: HTMLDivElement | undefined = $state();
	let trig = $state<Trigger | null>(null);
	let sugIdx = $state(0);
	let fbHint = $state(false);
	let skip: number | null = null;

	const opts = $derived<SuggestOption[]>(trig ? suggestOptions(trig.partial, fields, links) : []);
	const sIdx = $derived(Math.max(0, Math.min(sugIdx, opts.length - 1)));
	const rowsView = $derived(groupRows(opts));
	const fbHelp = $derived(fbHint && hasEmptyFallback(value ?? ''));

	const rowStyle = (on: boolean) =>
		'display:flex;align-items:center;gap:10px;width:100%;min-height:36px;box-sizing:border-box;padding:0 10px;border:0;border-radius:8px;cursor:pointer;text-align:left;font:inherit;color:var(--color-text);background:' +
		(on ? 'var(--color-surface-2)' : 'transparent');

	function detect(t: HTMLInputElement | HTMLTextAreaElement) {
		if (!suggest) return;
		const next = detectTrigger(t.value, t.selectionStart, t.selectionEnd);
		if (!next) {
			// Leaving the `{{` entirely forgets an Esc dismissal; a selection or a complete token does not.
			const c = t.selectionStart ?? 0;
			if (c === t.selectionEnd && !/\{\{[A-Za-z0-9_:]*$/.test(t.value.slice(0, c))) skip = null;
			trig = null;
			return;
		}
		if (skip !== null && skip === next.start) {
			trig = null;
			return;
		}
		skip = null;
		const prev = trig;
		if (prev && prev.start === next.start && prev.end === next.end && prev.partial === next.partial) return;
		if (!(prev && prev.partial === next.partial)) sugIdx = 0;
		trig = next;
	}

	function onInput(e: Event & { currentTarget: HTMLInputElement | HTMLTextAreaElement }) {
		const t = e.currentTarget;
		oncaret?.(t.selectionStart ?? t.value.length);
		onchange(t.value);
		detect(t);
	}

	function remember(e: KeyboardEvent | MouseEvent) {
		const t = e.currentTarget as HTMLInputElement | HTMLTextAreaElement;
		if ('key' in e && ['ArrowUp', 'ArrowDown', 'Enter', 'Tab', 'Escape'].includes(e.key) && trig) return;
		oncaret?.(t.selectionStart ?? t.value.length);
		detect(t);
	}

	async function accept(opt: SuggestOption) {
		if (!trig || !el) return;
		const r = applySuggestion(el.value, trig, opt);
		trig = null;
		sugIdx = 0;
		skip = null;
		if (opt.back) fbHint = true;
		onchange(r.value);
		oncaret?.(r.caret);
		await tick();
		if (!el) return;
		if (el.value !== r.value) el.value = r.value;
		el.focus();
		try {
			el.setSelectionRange(r.caret, r.caret);
		} catch {
			/* ignore */
		}
	}

	function dismiss() {
		if (!trig) return;
		skip = trig.start;
		trig = null;
	}

	async function scrollTo(i: number) {
		await tick();
		listEl?.querySelector<HTMLElement>('#' + CSS.escape(optId(i)))?.scrollIntoView?.({ block: 'nearest' });
	}

	function onKeyDown(e: KeyboardEvent) {
		if (!trig) return;
		const n = opts.length;
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault();
			if (!n) return;
			sugIdx = wrapIndex(sIdx, e.key === 'ArrowDown' ? 1 : -1, n);
			scrollTo(sugIdx);
			return;
		}
		if (e.key === 'Enter' || e.key === 'Tab') {
			e.preventDefault();
			if (n) accept(opts[sIdx]);
			else dismiss();
			return;
		}
		if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			dismiss();
		}
	}

	function onBlur() {
		trig = null;
	}

	/** Focus the field and put the caret at pos (end of the value when pos is undefined). */
	export async function focusAt(pos?: number) {
		await tick();
		if (!el) return;
		el.focus();
		const c = typeof pos === 'number' ? Math.min(pos, el.value.length) : el.value.length;
		try {
			el.setSelectionRange(c, c);
		} catch {
			/* ignore */
		}
	}

	const open = $derived(!!trig);
	const active = $derived(trig ? optId(sIdx) : undefined);
</script>

<div class="sf" style="position:relative">
	{#if multiline}
		<textarea
			bind:this={el}
			class="field"
			role="combobox"
			aria-autocomplete="list"
			aria-haspopup="listbox"
			aria-expanded={open}
			aria-controls={listId}
			aria-activedescendant={active}
			onkeydown={onKeyDown}
			onblur={onBlur}
			{rows}
			aria-label={label}
			{placeholder}
			{value}
			oninput={onInput}
			onkeyup={remember}
			onclick={remember}
			style={'resize:none;line-height:1.5' + (mono ? ";font-family:var(--font-mono);font-size:12px" : '')}
		></textarea>
	{:else}
		<input
			bind:this={el}
			class="field"
			type="text"
			role="combobox"
			aria-autocomplete="list"
			aria-haspopup="listbox"
			aria-expanded={open}
			aria-controls={listId}
			aria-activedescendant={active}
			onkeydown={onKeyDown}
			onblur={onBlur}
			aria-label={label}
			{placeholder}
			{value}
			oninput={onInput}
			onkeyup={remember}
			onclick={remember}
			style={mono ? 'font-family:var(--font-mono);font-size:12px' : ''}
		/>
	{/if}
	{#if open && trig}
		<div
			style="position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:30;background:var(--color-bg);border-radius:12px;box-shadow:0 16px 40px rgba(0,0,0,.22),0 2px 6px rgba(0,0,0,.08);padding:6px;display:flex;flex-direction:column;gap:2px"
		>
			<div style="display:flex;align-items:center;gap:6px;padding:4px 8px 2px;color:var(--color-muted)">
				<Icon name="code-brackets" width={14} height={14} /><span class="cap">Fields and links</span>
			</div>
			<div bind:this={listEl} role="listbox" id={listId} aria-label="Field suggestions" style="max-height:260px;overflow:auto;display:flex;flex-direction:column;gap:1px">
				{#each rowsView as r (r.kind === 'head' ? 'h:' + r.label : 'o:' + r.index)}
					{#if r.kind === 'head'}
						<div class="cap" style="padding:8px 10px 4px">{r.label}</div>
					{:else}
						{@const on = r.index === sIdx}
						<button
							type="button"
							role="option"
							id={optId(r.index)}
							aria-selected={on}
							tabindex="-1"
							onmousedown={(e) => e.preventDefault()}
							onmouseenter={() => {
								if (sugIdx !== r.index) sugIdx = r.index;
							}}
							onclick={() => accept(r.opt)}
							style={rowStyle(on)}
							><span class="mono" style="font-size:12.5px;font-weight:500;white-space:nowrap">{r.opt.key}</span><span
								style="font-size:12px;color:var(--color-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-grow:1;min-width:0"
								>{r.opt.label}</span
							>{#if r.opt.hint}<span class="hint">{r.opt.hint}</span>{/if}</button
						>
					{/if}
				{/each}
				{#if !opts.length}
					<button
						type="button"
						role="option"
						id={optId(0)}
						aria-selected="true"
						tabindex="-1"
						onmousedown={(e) => e.preventDefault()}
						onclick={dismiss}
						style={rowStyle(true) + ';align-items:flex-start;padding:9px 10px'}
						><span style="display:flex;color:var(--p-bad);margin-top:1px"><Icon name="warning" width={15} height={15} /></span><span
							style="display:flex;flex-direction:column;gap:2px;text-align:left;min-width:0"
							><span style="font-size:12.5px;font-weight:600;color:var(--p-bad)">No field called {trig.partial}</span><span
								style="font-size:11.5px;line-height:1.4;color:var(--color-muted)"
								>Sending refuses unknown fields. Enter keeps the text as typed.</span
							></span
						></button
					>
				{/if}
			</div>
			<div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;padding:6px 8px 4px;font-size:11px;color:var(--color-muted)">
				<span class="kbd" style="display:inline-flex;align-items:center;gap:1px;padding:2px 4px" aria-label="Up and down"
					><Icon name="arrow-up4" width={10} height={10} /><Icon name="arrow-down4" width={10} height={10} /></span
				>to move<span class="kbd" style="margin-left:6px">Enter</span>to insert<span class="kbd" style="margin-left:6px">Esc</span>to close
			</div>
		</div>
	{/if}
</div>
{#if fbHelp}
	<div role="status" style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--color-muted)">
		<Icon name="code-brackets" width={13} height={13} />Add a fallback so nobody sees a gap
	</div>
{/if}

<style>
	.sf {
		/* Editor board danger color, light and dark. */
		--p-bad: #b3402c;
	}
	:global([data-theme='dark']) .sf {
		--p-bad: #c7452f;
	}
	.field {
		width: 100%;
		box-sizing: border-box;
		border: 0;
		border-radius: 8px;
		background: var(--color-surface-2);
		color: var(--color-text);
		font: inherit;
		font-size: 13px;
		padding: 9px 11px;
		outline: none;
	}
	.field:focus {
		box-shadow: 0 0 0 2px #ffd100;
	}
	.field::placeholder {
		color: var(--color-muted);
	}
	.cap {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--color-muted);
		user-select: none;
		-webkit-user-select: none;
	}
	.mono {
		font-family: var(--font-mono);
		user-select: none;
		-webkit-user-select: none;
	}
	.hint {
		font-size: 10.5px;
		font-weight: 600;
		padding: 2px 6px;
		border-radius: 4px;
		background: var(--color-surface-3);
		color: var(--color-muted);
		white-space: nowrap;
	}
	.kbd {
		font-family: var(--font-mono);
		font-size: 10.5px;
		font-weight: 500;
		color: var(--color-muted);
		padding: 1px 5px;
		border-radius: 4px;
		background: var(--color-surface-3);
	}
</style>
