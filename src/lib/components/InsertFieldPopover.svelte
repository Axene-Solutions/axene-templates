<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { mailer } from '$lib/mailer.svelte';
	import { mailerData, settingsHref } from '$lib/mailer-data.svelte';
	import { floating } from '$lib/floating';
	import { BUILTIN_KEYS, fallbackError, formatField } from '$lib/placeholders';
	import Icon from './Icon.svelte';

	let { anchor, onpick, onclose }: { anchor: HTMLElement; onpick: (token: string) => void; onclose: () => void } = $props();

	interface Item {
		key: string;
		label: string;
		group: 'builtin' | 'contact' | 'custom';
		count?: number;
	}

	let query = $state('');
	let fallback = $state('');
	let active = $state(0);
	let checking = $state(false);
	let checkNote = $state('');
	let searchEl: HTMLInputElement | undefined = $state();

	onMount(() => {
		mailerData.loadFields();
		searchEl?.focus();
	});

	const q = $derived(query.trim().toLowerCase());
	const builtins = $derived(mailerData.builtins.filter((f) => !q || f.key.includes(q) || f.label.toLowerCase().includes(q)));
	const contacts = $derived(mailerData.contactFields.filter((f) => !BUILTIN_KEYS.has(f.key) && (!q || f.key.toLowerCase().includes(q))));
	const customKey = $derived(
		query.trim() && /^[A-Za-z_][A-Za-z0-9_]*$/.test(query.trim()) &&
			![...mailerData.builtins, ...mailerData.contactFields].some((f) => f.key.toLowerCase() === q)
			? query.trim()
			: ''
	);
	const items = $derived<Item[]>([
		...builtins.map((f) => ({ key: f.key, label: f.label, group: 'builtin' as const })),
		...contacts.map((f) => ({ key: f.key, label: f.key, group: 'contact' as const, count: f.count })),
		...(customKey ? [{ key: customKey, label: `Use "${customKey}" as a field`, group: 'custom' as const }] : []),
	]);
	$effect(() => {
		if (active >= items.length) active = Math.max(0, items.length - 1);
	});

	const fbError = $derived(fallback.trim() ? fallbackError(fallback) : null);
	const current = $derived(items[active]);
	const token = $derived(current ? formatField(current.key, fallback.trim() && !fbError ? fallback.trim() : null) : '');
	const previewText = $derived(
		current
			? fallback.trim() && !fbError
				? `If there is no ${current.key} for a recipient, they see "${fallback.trim()}".`
				: `A recipient without ${current.key} sees nothing here. Add a fallback to show text instead.`
			: ''
	);

	function pick(i = active) {
		const it = items[i];
		if (!it || fbError) return;
		onpick(formatField(it.key, fallback.trim() || null));
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			active = items.length ? (active + 1) % items.length : 0;
			scrollActive();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			active = items.length ? (active - 1 + items.length) % items.length : 0;
			scrollActive();
		} else if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
			e.preventDefault();
			pick();
		}
	}
	async function scrollActive() {
		await tick();
		document.getElementById(`if-opt-${active}`)?.scrollIntoView({ block: 'nearest' });
	}

	async function checkConnection() {
		checking = true;
		checkNote = '';
		await mailer.recheck();
		await mailerData.loadFields(true);
		const c = mailer.check;
		if (c?.kind === 'ok') {
			const sc = c.scopes.find((s) => s.scope === 'contacts:read');
			checkNote = sc?.state === 'ok' ? 'Read contacts works now.' : 'Still missing: create a key with the "Read contacts" scope and reconnect it in Settings.';
		} else if (c) checkNote = c.message;
		checking = false;
	}

	const fs = $derived(mailerData.fieldsState);
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="pop" role="dialog" aria-label="Insert field" tabindex="-1" use:floating={{ anchor, onclose }} {onkeydown}>
	<div class="pop-search">
		<Icon name="search" width={14} height={14} />
		<input
			bind:this={searchEl}
			bind:value={query}
			type="text"
			role="combobox"
			aria-expanded="true"
			aria-controls="if-list"
			aria-activedescendant={items.length ? `if-opt-${active}` : undefined}
			aria-label="Search fields"
			placeholder="Search or type a field name"
			autocomplete="off"
			spellcheck="false"
			oninput={() => (active = 0)}
		/>
	</div>

	<div class="pop-body" id="if-list" role="listbox" aria-label="Fields">
		{#if builtins.length}<div class="pop-group" role="presentation">Built-in</div>{/if}
		{#each items as it, i (it.group + it.key)}
			{#if it.group === 'contact' && (i === 0 || items[i - 1].group !== 'contact')}
				<div class="pop-group" role="presentation">Your contact fields</div>
			{/if}
			<button
				type="button"
				id="if-opt-{i}"
				role="option"
				aria-selected={i === active}
				class="pop-item"
				class:active={i === active}
				tabindex="-1"
				onmousemove={() => (active = i)}
				onclick={() => pick(i)}
			>
				<span class="pop-item-main">
					<span class="pop-mono">{it.group === 'custom' ? it.key : it.key}</span>
					<span class="pop-muted">{it.group === 'custom' ? 'custom field' : it.group === 'builtin' ? it.label : `${it.count} contact${it.count === 1 ? '' : 's'}`}</span>
				</span>
			</button>
		{/each}
		{#if !items.length}<div class="pop-empty">Nothing matches "{query}".</div>{/if}

		{#if fs === 'loading'}
			<div class="pop-state" role="status">Loading your contact fields...</div>
		{:else if fs === 'not_linked'}
			<div class="pop-state pop-info" role="status">
				<span>The built-in fields work without Mailer. <strong>Link Mailer to use your real fields.</strong></span>
				<a class="pop-btn" href={settingsHref()}>Link Mailer</a>
			</div>
		{:else if fs === 'no_scope'}
			<div class="pop-state pop-warn" role="status">
				<span><strong>Your key needs the Read contacts scope</strong> to list your contact fields (contacts:read).</span>
				<button type="button" class="pop-btn" onclick={checkConnection} disabled={checking}>{checking ? 'Checking...' : 'Check connection'}</button>
				{#if checkNote}<span class="pop-muted">{checkNote}</span>{/if}
			</div>
		{:else if fs === 'key_broken'}
			<div class="pop-state pop-warn" role="status">
				<span>{mailerData.fieldsMessage}</span>
				<a class="pop-btn" href={settingsHref()}>Fix connection</a>
			</div>
		{:else if fs === 'error'}
			<div class="pop-state pop-warn" role="status">
				<span>{mailerData.fieldsMessage}</span>
				<button type="button" class="pop-btn" onclick={() => mailerData.loadFields(true)}>Try again</button>
			</div>
		{:else if fs === 'ready' && !mailerData.contactFields.length && !q}
			<div class="pop-state" role="status">No custom contact fields yet. They appear here once your contacts have extra data.</div>
		{/if}
	</div>

	<div class="pop-foot">
		<label class="pop-label" for="if-fallback">Fallback (optional)</label>
		<input
			id="if-fallback"
			class="pop-fb"
			type="text"
			maxlength="100"
			placeholder="e.g. friend"
			bind:value={fallback}
			aria-invalid={!!fbError}
			aria-describedby="if-preview"
			autocomplete="off"
		/>
		<div id="if-preview" class="pop-preview" aria-live="polite">
			{#if fbError}
				<span class="pop-err">{fbError}</span>
			{:else if current}
				<span class="pop-mono pop-token">{token}</span>
				<span class="pop-muted">{previewText}</span>
			{:else}
				<span class="pop-muted">Pick a field to see how it is inserted.</span>
			{/if}
		</div>
		<div class="pop-actions">
			<button type="button" class="pop-btn" onclick={onclose}>Cancel</button>
			<button type="button" class="pop-btn pop-primary" disabled={!current || !!fbError} onclick={() => pick()}>Insert</button>
		</div>
	</div>
</div>

<style>
	.pop {
		z-index: 1100;
		display: flex; flex-direction: column;
		background: var(--color-surface-2); color: var(--color-text);
		border: 1px solid var(--color-border-1); border-radius: 10px;
		box-shadow: 0 10px 30px color-mix(in srgb, var(--color-text) 18%, transparent);
		font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12px;
		overflow: hidden;
	}
	.pop-search { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-bottom: 1px solid var(--color-border-1); color: var(--color-muted); }
	.pop-search input { flex: 1; min-width: 0; background: transparent; border: none; outline: none; color: var(--color-text); font: inherit; font-size: 12.5px; }
	.pop-search:focus-within { box-shadow: inset 0 0 0 2px var(--color-accent); }
	.pop-body { overflow-y: auto; padding: 4px; min-height: 60px; flex: 1; }
	.pop-group { padding: 6px 8px 3px; font-size: 10px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--color-muted); }
	.pop-item { display: flex; width: 100%; padding: 6px 8px; border: none; border-radius: 6px; background: transparent; color: inherit; font: inherit; cursor: pointer; text-align: left; }
	.pop-item.active { background: var(--color-accent-soft); box-shadow: 0 0 0 1px var(--color-accent); }
	.pop-item-main { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; min-width: 0; }
	.pop-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 11.5px; word-break: break-all; }
	.pop-muted { color: var(--color-muted); font-size: 11px; }
	.pop-empty { padding: 8px; color: var(--color-muted); }
	.pop-state { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; margin: 6px 4px 2px; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--color-border-1); color: var(--color-muted); line-height: 1.45; }
	.pop-state strong { color: var(--color-text); }
	.pop-info { background: var(--color-info-soft); border-color: var(--color-info); }
	.pop-warn { background: var(--color-accent-soft); border-color: var(--color-accent); color: var(--color-accent-ink); }
	.pop-foot { border-top: 1px solid var(--color-border-1); padding: 8px 10px 10px; display: flex; flex-direction: column; gap: 5px; }
	.pop-label { font-size: 10px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--color-muted); }
	.pop-fb { width: 100%; background: var(--color-bg); color: var(--color-text); border: 1px solid var(--color-border-1); border-radius: 6px; padding: 5px 8px; font: inherit; font-size: 12px; outline: none; }
	.pop-fb:focus { border-color: var(--color-accent); box-shadow: 0 0 0 2px var(--color-accent-soft); }
	.pop-fb[aria-invalid='true'] { border-color: var(--color-danger); }
	.pop-preview { display: flex; flex-direction: column; gap: 2px; min-height: 30px; line-height: 1.4; }
	.pop-token { color: var(--color-accent-ink); background: var(--color-accent-soft); border-radius: 4px; padding: 1px 5px; align-self: flex-start; }
	.pop-err { color: var(--color-danger); }
	.pop-actions { display: flex; justify-content: flex-end; gap: 6px; margin-top: 2px; }
	.pop-btn { display: inline-flex; align-items: center; gap: 5px; background: transparent; color: var(--color-text); border: 1px solid var(--color-border-1); border-radius: 6px; padding: 4px 10px; font: inherit; font-weight: 600; font-size: 11.5px; cursor: pointer; text-decoration: none; }
	.pop-btn:hover:not(:disabled) { background: var(--color-surface); }
	.pop-btn:disabled { opacity: 0.45; cursor: not-allowed; }
	.pop-primary { background: var(--color-accent); border-color: var(--color-accent); color: #101010; }
	.pop-primary:hover:not(:disabled) { background: color-mix(in srgb, var(--color-accent) 85%, var(--color-text)); }
</style>
