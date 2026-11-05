<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { mailer } from '$lib/mailer.svelte';
	import { mailerData, settingsHref, type NamedLink } from '$lib/mailer-data.svelte';
	import { LINK_KEY_RE, MAX_LINKS, MAX_LINK_URL, formatLink, linkLabelError, linkUrlError, suggestLinkKey } from '$lib/placeholders';
	import Icon from './Icon.svelte';

	// List, create, edit and delete named links. Used in a dialog (from the link picker) and on Settings.
	let editing = $state<NamedLink | 'new' | null>(null);
	let label = $state('');
	let url = $state('');
	let key = $state('');
	let keyTouched = $state(false);
	let saving = $state(false);
	let formError = $state('');
	let confirmId = $state('');
	let deleting = $state(false);
	let listError = $state('');
	let checking = $state(false);
	let nameEl: HTMLInputElement | undefined = $state();

	onMount(() => {
		mailerData.loadLinks();
	});

	const links = $derived(mailerData.links);
	const atCap = $derived(links.length >= MAX_LINKS);
	const state_ = $derived(mailerData.linksState);

	const labelErr = $derived(label ? linkLabelError(label) : null);
	const urlErr = $derived(url ? linkUrlError(url) : null);
	const keyErr = $derived(key && !LINK_KEY_RE.test(key) ? 'Start with a lowercase letter, then lowercase letters, digits or underscores' : null);
	const effectiveKey = $derived(key || suggestLinkKey(label));
	const canSave = $derived(!saving && !!label.trim() && !!url.trim() && !labelErr && !urlErr && !keyErr && !!effectiveKey);

	async function startEdit(l: NamedLink | 'new') {
		editing = l;
		formError = '';
		keyTouched = false;
		if (l === 'new') {
			label = '';
			url = '';
			key = '';
		} else {
			label = l.label;
			url = l.url;
			key = l.key;
			keyTouched = true;
		}
		await tick();
		nameEl?.focus();
	}
	function onLabel() {
		if (editing === 'new' && !keyTouched) key = suggestLinkKey(label);
	}

	async function save() {
		if (!canSave || !editing) return;
		saving = true;
		formError = '';
		const input: { label: string; url: string; key?: string } = { label: label.trim(), url: url.trim() };
		if (editing === 'new') input.key = effectiveKey;
		else if (key !== editing.key) input.key = key;
		const r = await mailerData.saveLink(input, editing === 'new' ? undefined : editing.id);
		saving = false;
		if (r.ok) editing = null;
		else formError = r.error;
	}

	async function remove(id: string) {
		deleting = true;
		listError = '';
		const r = await mailerData.removeLink(id);
		deleting = false;
		confirmId = '';
		if (!r.ok) listError = r.error;
	}

	async function checkConnection() {
		checking = true;
		await mailer.recheck();
		await mailerData.loadLinks(true);
		checking = false;
	}
</script>

<div class="ml">
	{#if state_ === 'loading' || state_ === 'idle'}
		<p class="ml-muted" role="status">Loading your links...</p>
	{:else if state_ === 'not_linked'}
		<div class="ml-note ml-info" role="status">
			<Icon name="link" width={16} height={16} />
			<span>Named links are stored in your Mailer account. <a href={settingsHref()}>Link Mailer</a> to create them.</span>
		</div>
	{:else if state_ === 'no_scope'}
		<div class="ml-note ml-warn" role="status">
			<Icon name="warning" width={16} height={16} />
			<div>
				<p>{mailerData.linksMessage}</p>
				<button type="button" class="ml-btn" onclick={checkConnection} disabled={checking}>{checking ? 'Checking...' : 'Check connection'}</button>
			</div>
		</div>
	{:else if state_ === 'key_broken' || state_ === 'error'}
		<div class="ml-note ml-warn" role="alert">
			<Icon name="warning" width={16} height={16} />
			<div>
				<p>{mailerData.linksMessage}</p>
				{#if state_ === 'key_broken'}<a class="ml-btn" href="/settings">Fix connection</a>{:else}<button type="button" class="ml-btn" onclick={() => mailerData.loadLinks(true)}>Try again</button>{/if}
			</div>
		</div>
	{:else}
		<div class="ml-top">
			<span class="ml-muted">{links.length} of {MAX_LINKS} named links</span>
			<button type="button" class="ml-btn ml-primary" disabled={atCap || editing !== null} title={atCap ? `You can have at most ${MAX_LINKS} links` : ''} onclick={() => startEdit('new')}>
				<Icon name="plus" width={14} height={14} />
				New link
			</button>
		</div>

		{#if listError}<div class="ml-note ml-err" role="alert"><Icon name="warning" width={16} height={16} /><span>{listError}</span></div>{/if}

		{#if editing}
			<form class="ml-form" onsubmit={(e) => { e.preventDefault(); save(); }}>
				<label class="ml-label" for="ml-name">Name</label>
				<input id="ml-name" class="ml-input" type="text" maxlength="100" bind:this={nameEl} bind:value={label} oninput={onLabel} placeholder="Pay now" aria-invalid={!!labelErr} />
				{#if labelErr}<div class="ml-err-text">{labelErr}</div>{/if}

				<label class="ml-label" for="ml-url">URL</label>
				<input id="ml-url" class="ml-input ml-mono" type="text" maxlength={MAX_LINK_URL + 50} bind:value={url} placeholder={'https://pay.example.com/{{order_id}}'} spellcheck="false" aria-invalid={!!urlErr} aria-describedby="ml-url-hint" />
				{#if urlErr}<div class="ml-err-text" role="alert">{urlErr}</div>{/if}
				<div id="ml-url-hint" class="ml-hint">http, https or mailto. Use {'{{field}}'} or {'{{field|fallback}}'} for values. Values are URL-encoded when sent.</div>

				<label class="ml-label" for="ml-key">Key</label>
				<input id="ml-key" class="ml-input ml-mono" type="text" maxlength="64" bind:value={key} oninput={() => (keyTouched = true)} placeholder={suggestLinkKey(label) || 'pay_now'} spellcheck="false" aria-invalid={!!keyErr} />
				{#if keyErr}<div class="ml-err-text">{keyErr}</div>{/if}
				<div class="ml-preview" aria-live="polite">
					<span class="ml-muted">Use it as</span>
					<span class="ml-token">{effectiveKey ? formatLink(effectiveKey) : '{{link:key}}'}</span>
				</div>

				{#if formError}<div class="ml-note ml-err" role="alert"><Icon name="warning" width={16} height={16} /><span>{formError}</span></div>{/if}
				<div class="ml-actions">
					<button type="button" class="ml-btn" onclick={() => (editing = null)} disabled={saving}>Cancel</button>
					<button type="submit" class="ml-btn ml-primary" disabled={!canSave}>{saving ? 'Saving...' : editing === 'new' ? 'Create link' : 'Save changes'}</button>
				</div>
			</form>
		{/if}

		{#if !links.length && !editing}
			<div class="ml-empty">
				<p><strong>No named links yet.</strong></p>
				<p class="ml-muted">A named link keeps one URL in one place. Pick it in any link field and change the URL here once, for every template.</p>
				<p class="ml-example"><span class="ml-mono">Pay now = https://pay.example.com/{'{{order_id}}'}</span></p>
			</div>
		{:else}
			<ul class="ml-list">
				{#each links as l, i (l.id + '/' + i)}
					<li class="ml-row">
						<div class="ml-row-main">
							<span class="ml-row-label">{l.label}</span>
							<span class="ml-token">{l.token}</span>
							<span class="ml-muted ml-url">{l.url}</span>
						</div>
						<div class="ml-row-actions">
							{#if confirmId === l.id}
								<span class="ml-muted">Delete?</span>
								<button type="button" class="ml-btn ml-danger-solid" disabled={deleting} onclick={() => remove(l.id)}>{deleting ? 'Deleting...' : 'Yes, delete'}</button>
								<button type="button" class="ml-btn" onclick={() => (confirmId = '')}>No</button>
							{:else}
								<button type="button" class="ml-icon" aria-label="Edit {l.label}" title="Edit" disabled={editing !== null} onclick={() => startEdit(l)}><Icon name="edit" width={14} height={14} /></button>
								<button type="button" class="ml-icon ml-icon-danger" aria-label="Delete {l.label}" title="Delete" onclick={() => (confirmId = l.id)}><Icon name="trash" width={14} height={14} /></button>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
			{#if links.length}<p class="ml-muted ml-foot">Deleting a link that a template still uses makes Mailer reject sends of that template until you pick another.</p>{/if}
		{/if}
	{/if}
</div>

<style>
	.ml { color: var(--color-text); font-size: 13px; }
	.ml-muted { color: var(--color-muted); font-size: 12px; }
	.ml-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 12px; }
	.ml-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
	.ml-note { display: flex; gap: 8px; align-items: flex-start; margin: 10px 0; padding: 9px 10px; border-radius: 7px; line-height: 1.45; border: 1px solid transparent; }
	.ml-note p { margin: 0 0 6px; }
	.ml-note a { color: inherit; font-weight: 600; text-decoration: underline; }
	.ml-info { border-color: var(--color-info); background: var(--color-info-soft); }
	.ml-warn { border-color: var(--color-accent); background: var(--color-accent-soft); color: var(--color-accent-ink); }
	.ml-err { border-color: var(--color-danger); background: var(--color-danger-soft); color: var(--color-danger); }
	.ml-form { border: 1px solid var(--color-border-1); border-radius: 10px; padding: 12px; margin-bottom: 12px; background: var(--color-bg); }
	.ml-label { display: block; font-size: 11.5px; font-weight: 600; color: var(--color-muted); margin: 10px 0 4px; }
	.ml-label:first-child { margin-top: 0; }
	.ml-input { width: 100%; background: var(--color-surface-2); color: var(--color-text); border: 1px solid var(--color-border-1); border-radius: 7px; padding: 7px 10px; font: inherit; }
	.ml-input:focus { outline: 2px solid var(--color-accent); outline-offset: 0; }
	.ml-input[aria-invalid='true'] { border-color: var(--color-danger); }
	.ml-err-text { color: var(--color-danger); font-size: 12px; margin-top: 4px; }
	.ml-hint { color: var(--color-muted); font-size: 11.5px; margin-top: 4px; line-height: 1.4; }
	.ml-preview { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
	.ml-token { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 11.5px; color: var(--color-accent-ink); background: var(--color-accent-soft); border-radius: 4px; padding: 1px 6px; align-self: flex-start; }
	.ml-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
	.ml-btn { display: inline-flex; align-items: center; gap: 6px; background: transparent; color: var(--color-text); border: 1px solid var(--color-border-1); border-radius: 7px; padding: 6px 12px; font: inherit; font-weight: 600; font-size: 12.5px; cursor: pointer; text-decoration: none; }
	.ml-btn:hover:not(:disabled) { background: var(--color-surface-2); }
	.ml-btn:disabled { opacity: 0.45; cursor: not-allowed; }
	.ml-primary { background: var(--color-accent); border-color: var(--color-accent); color: #101010; }
	.ml-primary:hover:not(:disabled) { background: color-mix(in srgb, var(--color-accent) 85%, var(--color-text)); }
	.ml-danger-solid { background: var(--color-danger); border-color: var(--color-danger); color: var(--color-bg); }
	.ml-danger-solid:hover:not(:disabled) { background: var(--color-danger); opacity: 0.9; }
	.ml-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
	.ml-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 10px; border: 1px solid var(--color-border-1); border-radius: 8px; }
	.ml-row-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
	.ml-row-label { font-weight: 600; }
	.ml-url { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 340px; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 11px; }
	.ml-row-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
	.ml-icon { display: flex; padding: 5px; border: none; background: transparent; color: var(--color-muted); border-radius: 6px; cursor: pointer; }
	.ml-icon:hover:not(:disabled) { background: var(--color-surface-2); color: var(--color-text); }
	.ml-icon:disabled { opacity: 0.4; cursor: not-allowed; }
	.ml-icon-danger:hover:not(:disabled) { background: var(--color-danger-soft); color: var(--color-danger); }
	.ml-icon:focus-visible { outline: 2px solid var(--color-accent); }
	.ml-empty { border: 1px dashed var(--color-border-1); border-radius: 10px; padding: 16px; text-align: center; line-height: 1.5; }
	.ml-empty p { margin: 0 0 6px; }
	.ml-example { background: var(--color-surface-2); border-radius: 6px; padding: 6px 8px; display: inline-block; }
	.ml-foot { margin-top: 10px; line-height: 1.45; }
</style>
