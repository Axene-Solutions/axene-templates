<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { mailer } from '$lib/mailer.svelte';
	import { mailerData, settingsHref } from '$lib/mailer-data.svelte';
	import { floating } from '$lib/floating';
	import { formatLink } from '$lib/placeholders';
	import Icon from './Icon.svelte';

	let { anchor, onpick, onclose }: { anchor: HTMLElement; onpick: (token: string) => void; onclose: () => void } = $props();

	let query = $state('');
	let active = $state(0);
	let checking = $state(false);
	let searchEl: HTMLInputElement | undefined = $state();

	onMount(() => {
		mailerData.loadLinks();
		searchEl?.focus();
	});

	const q = $derived(query.trim().toLowerCase());
	const shown = $derived(mailerData.links.filter((l) => !q || l.label.toLowerCase().includes(q) || l.key.includes(q) || l.url.toLowerCase().includes(q)));
	$effect(() => {
		if (active >= shown.length) active = Math.max(0, shown.length - 1);
	});

	function pick(i = active) {
		const l = shown[i];
		if (l) onpick(formatLink(l.key));
	}
	async function scrollActive() {
		await tick();
		document.getElementById(`lp-opt-${active}`)?.scrollIntoView({ block: 'nearest' });
	}
	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			active = shown.length ? (active + 1) % shown.length : 0;
			scrollActive();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			active = shown.length ? (active - 1 + shown.length) % shown.length : 0;
			scrollActive();
		} else if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
			e.preventDefault();
			pick();
		}
	}
	function manage() {
		onclose();
		mailerData.manageLinksOpen = true;
	}
	async function checkConnection() {
		checking = true;
		await mailer.recheck();
		await mailerData.loadLinks(true);
		checking = false;
	}

	const ls = $derived(mailerData.linksState);
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="pop" role="dialog" aria-label="Choose a named link" tabindex="-1" use:floating={{ anchor, onclose }} {onkeydown}>
	<div class="pop-search">
		<Icon name="search" width={14} height={14} />
		<input
			bind:this={searchEl}
			bind:value={query}
			type="text"
			role="combobox"
			aria-expanded="true"
			aria-controls="lp-list"
			aria-activedescendant={shown.length ? `lp-opt-${active}` : undefined}
			aria-label="Search links"
			placeholder="Search your named links"
			autocomplete="off"
			spellcheck="false"
			oninput={() => (active = 0)}
		/>
	</div>

	<div class="pop-body" id="lp-list" role="listbox" aria-label="Named links">
		{#each shown as l, i (l.id)}
			<button
				type="button"
				id="lp-opt-{i}"
				role="option"
				aria-selected={i === active}
				class="pop-item"
				class:active={i === active}
				tabindex="-1"
				onmousemove={() => (active = i)}
				onclick={() => pick(i)}
			>
				<span class="pop-item-col">
					<span class="pop-item-label">{l.label}</span>
					<span class="pop-mono pop-token">{l.token}</span>
					<span class="pop-muted pop-url">{l.url}</span>
				</span>
			</button>
		{/each}

		{#if ls === 'loading'}
			<div class="pop-state" role="status">Loading your links...</div>
		{:else if ls === 'not_linked'}
			<div class="pop-state pop-info" role="status">
				<span>Named links live in your Mailer account. <strong>Link Mailer to use them.</strong> You can always type a normal URL instead.</span>
				<a class="pop-btn" href={settingsHref()}>Link Mailer</a>
			</div>
		{:else if ls === 'no_scope'}
			<div class="pop-state pop-warn" role="status">
				<span><strong>Your key needs the Read templates scope</strong> to list named links (templates:read).</span>
				<button type="button" class="pop-btn" onclick={checkConnection} disabled={checking}>{checking ? 'Checking...' : 'Check connection'}</button>
			</div>
		{:else if ls === 'key_broken'}
			<div class="pop-state pop-warn" role="status">
				<span>{mailerData.linksMessage}</span>
				<a class="pop-btn" href={settingsHref()}>Fix connection</a>
			</div>
		{:else if ls === 'error'}
			<div class="pop-state pop-warn" role="status">
				<span>{mailerData.linksMessage}</span>
				<button type="button" class="pop-btn" onclick={() => mailerData.loadLinks(true)}>Try again</button>
			</div>
		{:else if ls === 'ready' && !mailerData.links.length}
			<div class="pop-state" role="status">
				<span>No named links yet. A named link keeps one URL in one place, for example <span class="pop-mono">Pay now = https://pay.example.com/{'{{order_id}}'}</span>.</span>
			</div>
		{:else if ls === 'ready' && !shown.length}
			<div class="pop-empty">Nothing matches "{query}".</div>
		{/if}
	</div>

	<div class="pop-foot pop-foot-row">
		<span class="pop-muted">Or type a URL in the field.</span>
		<button type="button" class="pop-btn" disabled={ls === 'not_linked'} onclick={manage}>Manage links</button>
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
	.pop-item { display: flex; width: 100%; padding: 6px 8px; border: none; border-radius: 6px; background: transparent; color: inherit; font: inherit; cursor: pointer; text-align: left; }
	.pop-item.active { background: var(--color-accent-soft); box-shadow: 0 0 0 1px var(--color-accent); }
	.pop-item-col { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
	.pop-item-label { font-weight: 600; }
	.pop-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 11px; }
	.pop-token { color: var(--color-accent-ink); }
	.pop-muted { color: var(--color-muted); font-size: 11px; }
	.pop-url { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 250px; }
	.pop-empty { padding: 8px; color: var(--color-muted); }
	.pop-state { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; margin: 6px 4px 2px; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--color-border-1); color: var(--color-muted); line-height: 1.45; }
	.pop-state strong { color: var(--color-text); }
	.pop-info { background: var(--color-info-soft); border-color: var(--color-info); }
	.pop-warn { background: var(--color-accent-soft); border-color: var(--color-accent); color: var(--color-accent-ink); }
	.pop-foot { border-top: 1px solid var(--color-border-1); padding: 8px 10px; }
	.pop-foot-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
	.pop-btn { display: inline-flex; align-items: center; gap: 5px; background: transparent; color: var(--color-text); border: 1px solid var(--color-border-1); border-radius: 6px; padding: 4px 10px; font: inherit; font-weight: 600; font-size: 11.5px; cursor: pointer; text-decoration: none; }
	.pop-btn:hover:not(:disabled) { background: var(--color-surface); }
	.pop-btn:disabled { opacity: 0.45; cursor: not-allowed; }
</style>
