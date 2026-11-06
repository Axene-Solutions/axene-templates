<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { mailer } from '$lib/mailer.svelte';
	import { mailerData, settingsHref, type NamedLink } from '$lib/mailer-data.svelte';
	import { LINK_KEY_RE, MAX_LINKS, MAX_LINK_URL, formatLink, linkLabelError, linkUrlError, suggestLinkKey } from '$lib/placeholders';
	import Icon from './Icon.svelte';

	// List, create, edit and delete named links. Used on Settings (with its heading row) and in a dialog
	// opened from the link picker (heading false: the dialog has its own title). Follows the Settings board.
	let { heading = true }: { heading?: boolean } = $props();

	let editing = $state<NamedLink | 'new' | null>(null);
	let label = $state('');
	let url = $state('');
	let key = $state('');
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
	const effectiveKey = $derived(key || suggestLinkKey(label));
	const keyErr = $derived.by(() => {
		if (key && !LINK_KEY_RE.test(key)) return 'Start with a lowercase letter, then lowercase letters, digits or underscores';
		const editingId = editing && editing !== 'new' ? editing.id : '';
		if (effectiveKey && links.some((l) => l.key === effectiveKey && l.id !== editingId)) return 'That key is already used by another link';
		return null;
	});
	const canSave = $derived(!saving && !!label.trim() && !!url.trim() && !labelErr && !urlErr && !keyErr && !!effectiveKey);

	async function startEdit(l: NamedLink | 'new') {
		editing = l;
		formError = '';
		if (l === 'new') {
			label = '';
			url = '';
			key = '';
		} else {
			label = l.label;
			url = l.url;
			key = l.key;
		}
		await tick();
		nameEl?.focus();
	}

	async function save() {
		if (!canSave || !editing) return;
		saving = true;
		formError = '';
		const input: { label: string; url: string; key?: string } = { label: label.trim(), url: url.trim() };
		if (editing === 'new' || effectiveKey !== editing.key) input.key = effectiveKey;
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

	const ready = $derived(state_ === 'ready');
	const blockedText = $derived(
		state_ === 'key_broken'
			? 'Mailer rejected your key, so named links cannot load. Disconnect it and connect a new key.'
			: state_ === 'no_scope'
				? 'Named links are stored in your Mailer account. Your key needs the Read templates and Write templates scopes.'
				: mailerData.linksMessage
	);
</script>

<div class="ml">
	<div class="ml-top">
		{#if heading}
			<div style="flex-grow:1"><div style="font-size:16px;font-weight:700">Named links</div><div style="font-size:13px;color:var(--color-muted);margin-top:2px">One URL in one place, reused in any link field.</div></div>
		{:else}
			<div style="flex-grow:1"></div>
		{/if}
		{#if ready}
			<span style="font-size:12.5px;color:var(--color-muted)">{links.length} of {MAX_LINKS} named links</span>
			<button class="dz-btn dz-btn-primary" type="button" disabled={atCap || editing !== null} title={atCap ? `You can have at most ${MAX_LINKS} links` : ''} onclick={() => startEdit('new')}><Icon name="add" width={15} height={15} />New link</button>
		{/if}
	</div>

	{#if state_ === 'loading' || state_ === 'idle'}
		<p style="margin:0;font-size:13px;color:var(--color-muted)" role="status">Loading your links...</p>
	{:else if state_ === 'not_linked'}
		<div class="dz-note" role="status" style="background:var(--color-bg)">
			<Icon name="danger" width={16} height={16} />
			<span>Named links are stored in your Mailer account. <a class="ml-a" href={settingsHref()}>Link Mailer</a> to create them.</span>
		</div>
	{:else if !ready}
		<div role="alert" class="dz-note" style="background:var(--color-bg)">
			<Icon name="danger" width={16} height={16} />
			<div>
				<div>{blockedText}</div>
				{#if state_ === 'error'}
					<button class="dz-btn dz-btn-sm" type="button" style="margin-top:8px" onclick={() => mailerData.loadLinks(true)}>Try again</button>
				{:else}
					<button class="dz-btn dz-btn-sm" type="button" style="margin-top:8px" disabled={checking} onclick={checkConnection}>Check connection</button>
				{/if}
			</div>
		</div>
	{:else}
		{#if listError}<div class="dz-note dz-note-bad" role="alert"><Icon name="danger" width={16} height={16} /><span>{listError}</span></div>{/if}

		{#if editing}
			<form class="ml-form" onsubmit={(e) => { e.preventDefault(); save(); }}>
				<label class="dz-lbl" for="ml-name">Name</label>
				<input id="ml-name" class="dz-field" style="background:var(--color-surface-2)" type="text" maxlength="100" bind:this={nameEl} bind:value={label} placeholder="Pay now" aria-invalid={!!labelErr} />
				<div style="font-size:12px;color:var(--color-danger)">{labelErr ?? ''}</div>
				<label class="dz-lbl" for="ml-url">URL</label>
				<input id="ml-url" class="dz-field dz-mono" style="background:var(--color-surface-2);font-size:13px" type="text" maxlength={MAX_LINK_URL + 50} bind:value={url} placeholder={'https://pay.example.com/{{order_id}}'} spellcheck="false" aria-invalid={!!urlErr} aria-describedby="ml-url-hint" />
				<div style="font-size:12px;color:var(--color-danger)" role={urlErr ? 'alert' : undefined}>{urlErr ?? ''}</div>
				<div id="ml-url-hint" style="font-size:12px;color:var(--color-muted);line-height:1.5">http, https or mailto. Use {'{{field}}'} or {'{{field|fallback}}'} for values. Values are URL-encoded when sent.</div>
				<label class="dz-lbl" for="ml-key" style="margin-top:6px">Key</label>
				<input id="ml-key" class="dz-field dz-mono" style="background:var(--color-surface-2);font-size:13px" type="text" maxlength="40" bind:value={key} placeholder={suggestLinkKey(label) || 'pay_now'} spellcheck="false" aria-invalid={!!keyErr} />
				<div style="font-size:12px;color:var(--color-danger)">{keyErr ?? ''}</div>
				<div style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--color-muted)" aria-live="polite">Use it as <span class="dz-mono" style="font-size:12px;padding:3px 8px;border-radius:4px;background:var(--color-surface-2);color:var(--color-text)">{effectiveKey ? formatLink(effectiveKey) : '{{link:key}}'}</span></div>
				{#if formError}<div role="alert" class="dz-note dz-note-bad"><Icon name="danger" width={16} height={16} /><span>{formError}</span></div>{/if}
				<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:6px">
					<button class="dz-btn" type="button" disabled={saving} onclick={() => (editing = null)}>Cancel</button>
					<button class="dz-btn dz-btn-primary" type="submit" disabled={!canSave}>{saving ? 'Saving...' : editing === 'new' ? 'Create link' : 'Save changes'}</button>
				</div>
			</form>
		{/if}

		<div style="display:flex;flex-direction:column;gap:8px">
			{#each links as l, i (l.id + '/' + i)}
				<div class="dz-row">
					<span style="display:flex;flex-direction:column;gap:2px;flex-grow:1;min-width:0">
						<span style="display:flex;align-items:center;gap:10px"><span style="font-size:13.5px;font-weight:600">{l.label}</span><span class="dz-mono" style="font-size:12px;padding:2px 8px;border-radius:4px;background:var(--color-surface-3)">{l.token}</span></span>
						<span class="dz-mono" style="font-size:12.5px;color:var(--color-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{l.url}</span>
					</span>
					{#if confirmId !== l.id}
						<button class="dz-mini" type="button" aria-label="Edit {l.label}" title="Edit" disabled={editing !== null} style={editing !== null ? 'opacity:.4;pointer-events:none' : ''} onclick={() => startEdit(l)}><Icon name="edit" width={16} height={16} /></button>
						<button class="dz-mini dz-mini-bad" type="button" aria-label="Delete {l.label}" title="Delete" onclick={() => (confirmId = l.id)}><Icon name="trash" width={16} height={16} /></button>
					{:else}
						<span style="font-size:13px;color:var(--color-muted)">Delete?</span>
						<button class="dz-btn dz-btn-sm dz-btn-solid-bad" type="button" disabled={deleting} onclick={() => remove(l.id)}>{deleting ? 'Deleting...' : 'Yes, delete'}</button>
						<button class="dz-btn dz-btn-sm" type="button" style="background:var(--color-bg)" onclick={() => (confirmId = '')}>No</button>
					{/if}
				</div>
			{/each}
			{#if !links.length && !editing}
				<div style="padding:18px 0;text-align:center;font-size:13.5px;color:var(--color-muted);line-height:1.6"><b style="color:var(--color-text)">No named links yet.</b><br />A named link keeps one URL in one place. Pick it in any link field and change the URL here once, for every template.<br /><span class="dz-mono" style="font-size:12.5px">{'{{link:pay_now}}'}</span></div>
			{/if}
		</div>
		{#if links.length}<p style="margin:0;font-size:12.5px;line-height:1.5;color:var(--color-muted)">Deleting a link that a template still uses makes Mailer reject sends of that template until you pick another.</p>{/if}
	{/if}
</div>

<style>
	.ml { display: flex; flex-direction: column; gap: 14px; color: var(--color-text); font-family: var(--font-sans); }
	.ml-top { display: flex; align-items: center; gap: 12px; }
	.ml-form { display: flex; flex-direction: column; gap: 6px; padding: 16px; border-radius: 12px; background: var(--color-bg); }
	.ml-a { color: inherit; font-weight: 600; text-decoration: underline; }
</style>
