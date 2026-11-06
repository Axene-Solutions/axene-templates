<script lang="ts">
	import Icon from './Icon.svelte';

	export type SelectOption = { value: string; label: string; hint?: string };

	let {
		id,
		options,
		value = $bindable(''),
		placeholder = 'Select',
		searchPlaceholder = 'Search',
		disabled = false,
		searchFrom = 8
	}: {
		id: string;
		options: SelectOption[];
		value?: string;
		placeholder?: string;
		searchPlaceholder?: string;
		disabled?: boolean;
		/** The search box only appears from this many options up. */
		searchFrom?: number;
	} = $props();

	let open = $state(false);
	let query = $state('');
	let active = $state(0);
	let root: HTMLDivElement | undefined = $state();
	let trigger: HTMLButtonElement | undefined = $state();
	let searchEl: HTMLInputElement | undefined = $state();

	const selected = $derived(options.find((o) => o.value === value));
	const showSearch = $derived(options.length >= searchFrom);
	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return options;
		return options.filter((o) => o.label.toLowerCase().includes(q) || (o.hint ?? '').toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
	});

	function show() {
		if (disabled) return;
		query = '';
		active = Math.max(0, options.findIndex((o) => o.value === value));
		open = true;
		queueMicrotask(() => (showSearch ? searchEl?.focus() : root?.querySelector<HTMLElement>('[role=listbox]')?.focus()));
	}
	function hide(refocus = true) {
		open = false;
		if (refocus) trigger?.focus();
	}
	function choose(o: SelectOption) {
		value = o.value;
		hide();
	}
	function scrollActive() {
		queueMicrotask(() => root?.querySelector('[data-active=true]')?.scrollIntoView({ block: 'nearest' }));
	}
	function onkeydown(e: KeyboardEvent) {
		if (!open) {
			if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
				e.preventDefault();
				show();
			}
			return;
		}
		if (e.key === 'Escape') {
			// Close the menu only, not the dialog around it.
			e.preventDefault();
			e.stopPropagation();
			hide();
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			active = Math.min(filtered.length - 1, active + 1);
			scrollActive();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			active = Math.max(0, active - 1);
			scrollActive();
		} else if (e.key === 'Home') {
			e.preventDefault();
			active = 0;
			scrollActive();
		} else if (e.key === 'End') {
			e.preventDefault();
			active = Math.max(0, filtered.length - 1);
			scrollActive();
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (filtered[active]) choose(filtered[active]);
		} else if (e.key === 'Tab') {
			hide(false);
		}
	}
	function onfocusout(e: FocusEvent) {
		if (open && root && !root.contains(e.relatedTarget as Node | null)) open = false;
	}
</script>

<div class="sel" bind:this={root} {onkeydown} onfocusout={onfocusout} role="presentation">
	<button
		{id}
		bind:this={trigger}
		type="button"
		class="sel-trigger"
		class:sel-open={open}
		{disabled}
		role="combobox"
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-controls="{id}-list"
		onclick={() => (open ? hide() : show())}
	>
		<span class="sel-value">
			{#if selected}
				<span class="sel-label">{selected.label}</span>
				{#if selected.hint}<span class="sel-hint">{selected.hint}</span>{/if}
			{:else}
				<span class="sel-placeholder">{placeholder}</span>
			{/if}
		</span>
		<Icon name="chevron-down" width={14} height={14} class="sel-chev" />
	</button>

	{#if open}
		<div class="sel-pop">
			{#if showSearch}
				<div class="sel-search">
					<Icon name="search" width={14} height={14} />
					<input
						bind:this={searchEl}
						type="text"
						class="sel-search-input"
						placeholder={searchPlaceholder}
						aria-label={searchPlaceholder}
						autocomplete="off"
						spellcheck="false"
						bind:value={query}
						oninput={() => (active = 0)}
					/>
				</div>
			{/if}
			<ul id="{id}-list" class="sel-list" role="listbox" tabindex="-1" aria-label={placeholder}>
				{#each filtered as o, i (o.value)}
					<li
						role="option"
						aria-selected={o.value === value}
						data-active={i === active}
						class="sel-opt"
						class:sel-opt-active={i === active}
						class:sel-opt-picked={o.value === value}
						onmousemove={() => (active = i)}
						onmousedown={(e) => e.preventDefault()}
						onclick={() => choose(o)}
					>
						<span class="sel-opt-text">
							<span class="sel-label">{o.label}</span>
							{#if o.hint}<span class="sel-hint">{o.hint}</span>{/if}
						</span>
						{#if o.value === value}<Icon name="check" width={14} height={14} />{/if}
					</li>
				{:else}
					<li class="sel-empty" role="presentation">No match for "{query}"</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<style>
	.sel { position: relative; }
	.sel-trigger {
		width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px; text-align: left;
		background: var(--color-bg); color: var(--color-text); border: 1px solid var(--color-border-1);
		border-radius: 7px; padding: 8px 10px; font: inherit; font-size: 13px; cursor: pointer;
	}
	.sel-trigger:hover:not(:disabled) { border-color: var(--color-muted); }
	.sel-trigger:focus-visible, .sel-open { outline: 2px solid var(--color-accent); outline-offset: 0; }
	.sel-trigger:disabled { opacity: 0.5; cursor: not-allowed; }
	.sel-value { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
	.sel-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.sel-hint { color: var(--color-muted); font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 11.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.sel-placeholder { color: var(--color-muted); }
	.sel-trigger :global(.sel-chev) { color: var(--color-muted); transition: transform 0.12s; }
	.sel-open :global(.sel-chev) { transform: rotate(180deg); }
	.sel-pop {
		position: absolute; z-index: 30; left: 0; right: 0; top: calc(100% + 4px);
		background: var(--color-surface-2); border: 1px solid var(--color-border-1); border-radius: 9px;
		box-shadow: 0 10px 30px color-mix(in srgb, var(--color-bg) 70%, transparent); overflow: hidden;
	}
	.sel-search { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-bottom: 1px solid var(--color-border-1); color: var(--color-muted); }
	.sel-search-input { flex: 1; min-width: 0; background: transparent; border: 0; outline: 0; color: var(--color-text); font: inherit; font-size: 13px; }
	.sel-list { list-style: none; margin: 0; padding: 4px; max-height: 232px; overflow-y: auto; outline: 0; }
	.sel-opt { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 8px; border-radius: 6px; cursor: pointer; font-size: 13px; }
	.sel-opt-text { display: flex; flex-direction: column; min-width: 0; gap: 1px; }
	.sel-opt-active { background: var(--color-accent-soft); }
	.sel-opt-picked { color: var(--color-accent-ink); font-weight: 600; }
	.sel-empty { padding: 12px 10px; color: var(--color-muted); font-size: 12.5px; }
</style>
