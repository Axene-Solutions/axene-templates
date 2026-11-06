<!--
	InsertFieldModal: the one modal behind the Insert field button and the named link picker
	(design "INSERT FIELD / CHOOSE A LINK"), with the Manage links step inside the same dialog
	(Back chevron returns to the picker), so it never stacks on another modal.

	mode "field": search, grouped list (Built in, Your contact fields, Named links with a
	Manage links chip, a "Use as a custom field" row for a new key), Fallback field with its
	preview line, primary Insert. mode "link": the named links with their URLs, primary Use link.
	The search input is focused on open. ArrowUp / ArrowDown move (wrapping), Enter in an input
	inserts, a click selects a row and a double click inserts it, Esc or a click outside closes.

	Usage:
		{#if insert}
			<InsertFieldModal mode={insert.mode} builtins={BUILTINS} contactFields={contactFields} links={links}
				onpick={(token) => { applyToken(insert, token); closeInsert(); }}
				onclose={closeInsert}>
				{#snippet manageLinks({ back })}
					<ManageLinksList onDone={back} />
				{/snippet}
			</InsertFieldModal>
		{/if}

	onpick(token) gets the finished token ({{name|friend}}, {{link:menu}}). In field mode the
	caller inserts it at the remembered caret; in link mode it replaces the field value. The
	caller unmounts the modal in onclose and returns focus to the field (ContentField.focusAt).
	Only render it when no other modal is open.
-->
<script lang="ts">
	import { onMount, tick, untrack, type Snippet } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { trapFocus } from '$lib/focus';
	import { buildInsertView, type InsertMode } from '$lib/panel/insert';
	import { wrapIndex, type SuggestFieldDef, type SuggestLinkDef } from '$lib/panel/suggest';

	interface Props {
		mode: InsertMode;
		builtins: readonly SuggestFieldDef[];
		contactFields: readonly SuggestFieldDef[];
		links: readonly SuggestLinkDef[];
		onpick: (token: string) => void;
		onclose: () => void;
		/** Body of the Manage links step (list rows, add form, Done). `back` returns to the picker. */
		manageLinks?: Snippet<[{ back: () => void }]>;
		/** Example token in the Named links description. Defaults to the first link or order_online. */
		linkExample?: string;
		/** Fallback validator; defaults to the design rule (no braces or pipe). */
		fallbackError?: (fallback: string) => string | null;
		/** Start on the Manage links step (no Back button then). */
		startOnLinks?: boolean;
	}
	let {
		mode,
		builtins,
		contactFields,
		links,
		onpick,
		onclose,
		manageLinks,
		linkExample,
		fallbackError,
		startOnLinks = false,
	}: Props = $props();

	const uid = $props.id();
	const listId = `ins-list-${uid}`;
	const optId = (i: number) => `ins-opt-${uid}-${i}`;

	// The starting step is read once; later prop changes do not move the user between steps.
	let step = $state<'pick' | 'links'>(untrack(() => startOnLinks) ? 'links' : 'pick');
	let cameFromPicker = $state(false);
	let q = $state('');
	let fallback = $state('');
	let idx = $state(0);
	let search: HTMLInputElement | undefined = $state();
	let listEl: HTMLDivElement | undefined = $state();
	let dialog: HTMLDivElement | undefined = $state();

	const view = $derived(buildInsertView({ mode, query: q, fallback, builtins, contactFields, links, fallbackError }));
	const n = $derived(view.options.length);
	const cur = $derived(Math.max(0, Math.min(idx, n - 1)));
	const canInsert = $derived(n > 0 && !view.fallbackBad);
	const example = $derived(linkExample ?? '{' + '{link:' + (links[0]?.key ?? 'order_online') + '}' + '}');

	onMount(() => {
		focusSearch();
	});

	async function focusSearch() {
		await tick();
		if (search) search.focus();
		else dialog?.focus();
	}

	function insertSel() {
		const o = view.options[cur];
		if (o && canInsert) onpick(o.token);
	}

	async function scrollTo(i: number) {
		await tick();
		listEl?.querySelector<HTMLElement>('#' + CSS.escape(optId(i)))?.scrollIntoView?.({ block: 'nearest' });
	}

	function openLinks() {
		cameFromPicker = true;
		step = 'links';
		tick().then(() => dialog?.focus());
	}

	function back() {
		if (!cameFromPicker) {
			onclose();
			return;
		}
		step = 'pick';
		cameFromPicker = false;
		focusSearch();
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			if (step === 'links' && cameFromPicker) back();
			else onclose();
			return;
		}
		if (step !== 'pick') return;
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault();
			if (!n) return;
			idx = wrapIndex(cur, e.key === 'ArrowDown' ? 1 : -1, n);
			scrollTo(idx);
			return;
		}
		if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
			e.preventDefault();
			insertSel();
		}
	}

	const rowStyle = (on: boolean) =>
		'display:flex;align-items:center;gap:10px;width:100%;min-height:38px;box-sizing:border-box;padding:0 10px;border:0;border-radius:8px;cursor:pointer;text-align:left;font:inherit;color:var(--color-text);background:' +
		(on ? 'var(--color-surface-2)' : 'transparent');
</script>

<div
	use:trapFocus
	style="position:fixed;inset:0;background:var(--color-scrim);display:flex;align-items:flex-start;justify-content:center;padding:56px 16px;box-sizing:border-box;z-index:50"
>
	<button
		type="button"
		tabindex="-1"
		aria-label="Close"
		onclick={onclose}
		style="position:absolute;inset:0;width:100%;height:100%;border:0;padding:0;margin:0;background:transparent;cursor:default"
	></button>
	{#if step === 'pick'}
		<div
			bind:this={dialog}
			role="dialog"
			aria-modal="true"
			aria-label={view.title}
			tabindex="-1"
			onkeydown={onKey}
			style="position:relative;z-index:1;width:100%;max-width:480px;background:var(--color-bg);border-radius:16px;padding:22px;box-shadow:0 30px 80px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:14px;margin-top:24px;outline:none"
		>
			<div style="display:flex;gap:12px;align-items:flex-start">
				<span
					style="width:36px;height:36px;border-radius:8px;background:var(--color-surface-2);display:grid;place-items:center;color:var(--color-muted);flex-shrink:0"
					><Icon name="code-brackets" width={18} height={18} /></span
				>
				<div style="flex-grow:1;min-width:0">
					<h2 style="margin:0;font-size:18px;font-weight:700">{view.title}</h2>
					<p style="margin:4px 0 0;font-size:13px;line-height:1.5;color:var(--color-muted)">{view.foot}</p>
				</div>
				<button class="icon-btn" type="button" onclick={onclose} aria-label="Close"><Icon name="close" width={16} height={16} /></button>
			</div>
			<label style="position:relative;display:block"
				><span style="position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--color-muted);display:flex"
					><Icon name="search" width={15} height={15} /></span
				><input
					bind:this={search}
					class="field"
					type="text"
					role="combobox"
					aria-expanded="true"
					aria-controls={listId}
					aria-activedescendant={n ? optId(cur) : undefined}
					aria-autocomplete="list"
					aria-label={view.placeholder}
					placeholder={view.placeholder}
					autocomplete="off"
					spellcheck="false"
					bind:value={q}
					oninput={() => (idx = 0)}
					style="padding-left:34px"
				/></label
			>
			<div bind:this={listEl} role="listbox" id={listId} aria-label={view.title} style="max-height:300px;overflow:auto;display:flex;flex-direction:column;gap:1px;margin:0 -6px">
				{#each view.items as o, k (k)}
					{#if o.kind === 'head'}
						<div style="display:flex;align-items:center;padding:8px 10px 4px">
							<span class="cap" style="flex-grow:1">{o.label}</span>
							{#if o.manage && manageLinks}
								<button class="chip" type="button" onclick={openLinks} style="font-family:inherit">Manage links</button>
							{/if}
						</div>
					{:else if o.kind === 'opt'}
						{@const on = o.index === cur}
						<button
							type="button"
							role="option"
							id={optId(o.index)}
							aria-selected={on}
							tabindex="-1"
							onclick={() => (idx = o.index)}
							ondblclick={() => {
								idx = o.index;
								insertSel();
							}}
							onmouseenter={() => {
								if (idx !== o.index) idx = o.index;
							}}
							style={rowStyle(on)}
							><span class="mono" style="font-size:12.5px;font-weight:500;white-space:nowrap">{o.key}</span><span
								style="font-size:12px;color:var(--color-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-grow:1;min-width:0"
								>{o.sub}</span
							>{#if o.hint}<span class="hint">{o.hint}</span>{/if}</button
						>
					{:else}
						<div style="padding:10px;font-size:12.5px;line-height:1.45;color:var(--color-muted)">{o.label}</div>
					{/if}
				{/each}
			</div>
			{#if mode === 'field'}
				<div style="display:flex;flex-direction:column;gap:6px;padding:12px;border-radius:12px;background:var(--color-surface-2)">
					<span class="lbl">Fallback (optional)</span>
					<input
						class="field"
						type="text"
						maxlength="100"
						placeholder="e.g. friend"
						aria-label="Fallback"
						bind:value={fallback}
						style="background:var(--color-bg)"
					/>
					<span style="font-size:12px;line-height:1.45;color:var(--color-muted)">{view.preview}</span>
				</div>
			{/if}
			<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
				<div style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--color-muted);flex-grow:1">
					<span class="kbd" style="display:inline-flex;align-items:center;gap:1px;padding:2px 4px" aria-label="Up and down"
						><Icon name="arrow-up4" width={10} height={10} /><Icon name="arrow-down4" width={10} height={10} /></span
					>to move<span class="kbd" style="margin-left:6px">Enter</span>to insert<span class="kbd" style="margin-left:6px">Esc</span>to close
				</div>
				<button class="btn" type="button" onclick={onclose}>Cancel</button>
				<button
					class="btn btn-primary"
					type="button"
					onclick={insertSel}
					aria-disabled={!canInsert}
					style={canInsert ? '' : 'opacity:.45;pointer-events:none'}>{view.actionLabel}</button
				>
			</div>
		</div>
	{:else}
		<div
			bind:this={dialog}
			role="dialog"
			aria-modal="true"
			aria-label="Named links"
			tabindex="-1"
			onkeydown={onKey}
			style="position:relative;z-index:1;width:100%;max-width:500px;background:var(--color-bg);border-radius:16px;padding:26px;box-shadow:0 30px 80px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:14px;outline:none"
		>
			<div style="display:flex;gap:8px;align-items:flex-start">
				{#if cameFromPicker}
					<button class="icon-btn" type="button" onclick={back} aria-label="Back to the picker" style="margin-left:-8px"
						><Icon name="arrow-left42" width={18} height={18} /></button
					>
				{/if}
				<div style="flex-grow:1">
					<h2 style="margin:0;font-size:20px;font-weight:700">Named links</h2>
					<p style="margin:5px 0 0;font-size:13.5px;line-height:1.5;color:var(--color-muted)">
						Keep one URL in one place. Use it anywhere as <span class="mono" style="font-size:12px">{example}</span>.
					</p>
				</div>
				<button class="icon-btn" type="button" onclick={onclose} aria-label="Close"><Icon name="close" width={16} height={16} /></button>
			</div>
			{#if manageLinks}{@render manageLinks({ back })}{/if}
		</div>
	{/if}
</div>

<style>
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
	.lbl {
		font-size: 12px;
		font-weight: 600;
		color: var(--color-muted);
	}
	.cap {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--color-muted);
	}
	.mono {
		font-family: var(--font-mono);
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
	.btn {
		border: 0;
		cursor: pointer;
		font-weight: 600;
		font-size: 13px;
		border-radius: 8px;
		padding: 8px 13px;
		display: inline-flex;
		align-items: center;
		gap: 7px;
		text-decoration: none;
		background: var(--color-surface-2);
		color: var(--color-text);
		white-space: nowrap;
		transition: background 0.12s;
	}
	.btn:hover {
		background: var(--color-surface-3);
	}
	.btn-primary {
		background: #ffd100;
		color: #101010;
	}
	.btn-primary:hover {
		background: #f0c400;
	}
	.icon-btn {
		width: 34px;
		height: 34px;
		flex-shrink: 0;
		border-radius: 8px;
		border: 0;
		background: transparent;
		color: var(--color-muted);
		display: grid;
		place-items: center;
		cursor: pointer;
		padding: 0;
	}
	.icon-btn:hover {
		background: var(--color-surface-2);
		color: var(--color-text);
	}
	.btn:focus-visible,
	.icon-btn:focus-visible,
	.chip:focus-visible {
		outline: 2px solid #ffd100;
		outline-offset: 1px;
	}
</style>
