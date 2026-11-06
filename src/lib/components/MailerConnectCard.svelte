<script lang="ts">
	import { mailer } from '$lib/mailer.svelte';
	import { autofocus } from '$lib/focus';
	import Icon from './Icon.svelte';

	// Shared by the Settings page, the From Mailer tab (compact), the Send modal and the Save dialog.
	// All state lives in $lib/mailer.svelte. Markup and styles follow the Settings and Main boards.
	// autoCheck: after a successful connect, run the scope check so the scope list shows right away.
	let { compact = false, autoCheck = false }: { compact?: boolean; autoCheck?: boolean } = $props();

	let apiKey = $state('');
	let confirming = $state(false);

	async function connect() {
		if (await mailer.connect(apiKey)) {
			apiKey = '';
			if (autoCheck) mailer.recheck();
		}
	}
	async function disconnect() {
		if (await mailer.disconnect()) confirming = false;
	}
	const when = $derived(
		mailer.connectedAt
			? new Date(mailer.connectedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
			: ''
	);
	const revoked = $derived(mailer.check?.kind === 'revoked');

	// Scope chips shown in step 2 (the wording differs a little between the two boards).
	const chips = $derived(
		compact
			? [['Send emails', ''], ['Read sender addresses', ''], ['Read templates', ' required'], ['Write templates', ' for Save'], ['Read contacts', ' recommended']]
			: [['Send emails', ''], ['Read sender addresses', ''], ['Read templates', ' required'], ['Write templates', ' for Save and named links'], ['Read contacts', ' recommended']]
	);
	const stateLabel = { ok: 'Works', missing: 'Missing', unverified: 'Not tested', unknown: 'Could not check' } as const;
</script>

{#snippet keyForm()}
	{#if mailer.status === 'disconnected' || mailer.configured}
		{#if compact}
			<p style="margin:0;font-size:13.5px;line-height:1.55;color:var(--color-muted)">Your key is stored encrypted and is never shown again.</p>
		{:else}
			<p style="margin:0;font-size:13.5px;line-height:1.55;color:var(--color-muted)">Connect your Axene Mailer account to send templates from your own verified domain, save templates into Mailer, and open Mailer templates here to edit them. Your key is stored encrypted and is never shown again.</p>
		{/if}
		<ol style="margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:{compact ? 10 : 12}px;font-size:13.5px;line-height:1.55">
			<li style="display:flex;gap:{compact ? 10 : 12}px;align-items:flex-start"><span class="dz-num">1</span><span>Open {#if compact}<b>mail.axene.io/api-keys</b>{:else}<a class="mc-keylink" href="https://mail.axene.io/api-keys" target="_blank" rel="noopener noreferrer">mail.axene.io/api-keys</a>{/if} and create a key.</span></li>
			<li style="display:flex;gap:{compact ? 10 : 12}px;align-items:flex-start"><span class="dz-num">2</span><span style="display:flex;flex-direction:column;gap:8px">Tick these scopes.<span style="display:flex;flex-wrap:wrap;gap:6px">{#each chips as c (c[0])}<span class="dz-badge" style="background:var(--color-bg);font-size:12px;padding:4px 10px">{c[0]}<span style="color:var(--color-muted);font-weight:500">{c[1]}</span></span>{/each}</span></span></li>
			<li style="display:flex;gap:{compact ? 10 : 12}px;align-items:flex-start"><span class="dz-num">3</span><span>Paste the key below.</span></li>
		</ol>
		<div style="display:flex;flex-direction:column;gap:6px">
			<label class="dz-lbl" for="mc-key">Mailer API key</label>
			<div style="display:flex;gap:{compact ? 8 : 10}px;align-items:center">
				<span style="position:relative;flex-grow:1;display:block">
					<span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--color-muted);display:flex"><Icon name="padlock" width={15} height={15} /></span>
					<input id="mc-key" class="dz-field dz-mono" style="padding-left:36px;background:var(--color-bg);font-size:{compact ? 13.5 : 13}px" type="password" autocomplete="off" spellcheck="false" placeholder="axm_k_..." aria-label="Mailer API key" bind:value={apiKey} />
				</span>
				<button class="dz-btn dz-btn-primary" type="button" disabled={mailer.busy || !apiKey.trim()} onclick={connect}>
					{#if mailer.busy}<span class="dz-spinner"></span>{/if}{mailer.busy ? 'Checking key' : mailer.status === 'unreadable' ? 'Reconnect' : 'Connect'}
				</button>
			</div>
		</div>
		{#if mailer.error}
			<div role="alert" class="dz-note dz-note-bad"><Icon name="danger" width={16} height={16} /><span>{mailer.error}</span></div>
		{/if}
	{/if}
{/snippet}

<div class="mc" class:mc-compact={compact}>
	{#if mailer.status === 'loading'}
		<p style="margin:0;font-size:13px;color:var(--color-muted)">Loading...</p>
	{:else if mailer.status === 'unavailable'}
		<div role="alert" class="dz-note dz-note-bad"><Icon name="danger" width={16} height={16} /><span>Sending is not available right now. Try again later.</span></div>
	{:else if mailer.status === 'disconnected' || mailer.status === 'unreadable'}
		{#if mailer.status === 'unreadable'}
			<div role="alert" class="dz-note dz-note-bad">
				<Icon name="danger" width={16} height={16} />
				<span>
					The stored Mailer key (ending <span class="dz-mono">{mailer.keyHint}</span>) cannot be read{mailer.configured ? ', most likely because the server key changed' : ' because sending is not configured on the server'}.
					{mailer.configured ? 'Disconnect it and connect your key again.' : 'You can disconnect it now and connect again once sending is configured.'}
				</span>
			</div>
			<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
				{#if !confirming}
					<button class="dz-btn dz-btn-bad" type="button" style={compact ? '' : 'background:var(--color-bg)'} onclick={() => (confirming = true)}>Disconnect</button>
				{:else}
					<span style="font-size:13px;color:var(--color-muted)">Delete the stored key?</span>
					<button class="dz-btn dz-btn-solid-bad" type="button" disabled={mailer.busy} onclick={disconnect} use:autofocus>{mailer.busy ? 'Removing...' : 'Yes, disconnect'}</button>
					<button class="dz-btn" type="button" style={compact ? '' : 'background:var(--color-bg)'} onclick={() => (confirming = false)}>Cancel</button>
				{/if}
			</div>
		{/if}
		{@render keyForm()}
	{:else}
		<div style="display:flex;flex-wrap:wrap;align-items:flex-end;gap:14px 40px">
			<div style="display:flex;flex-direction:column;gap:4px"><div class="dz-lbl">API key</div><div class="dz-mono" style="font-size:13.5px">axm_k_••••{mailer.keyHint}</div></div>
			{#if when}<div style="display:flex;flex-direction:column;gap:4px"><div class="dz-lbl">Connected</div><div style="font-size:13.5px">{when}</div></div>{/if}
			<div style="flex-grow:1"></div>
			<button class="dz-btn" type="button" style="background:var(--color-bg)" disabled={mailer.checking} onclick={() => mailer.recheck()}>
				{#if mailer.checking}<span class="dz-spinner"></span>{:else}<Icon name="refresh-arrow" width={15} height={15} />{/if}{mailer.checking ? 'Checking' : 'Check connection'}
			</button>
			{#if !confirming}
				<button class="dz-btn dz-btn-bad" type="button" style="background:var(--color-bg)" onclick={() => (confirming = true)}>Disconnect</button>
			{:else}
				<span style="display:inline-flex;align-items:center;gap:8px;font-size:13px;color:var(--color-muted)">
					Delete the stored key?
					<button class="dz-btn dz-btn-solid-bad" type="button" disabled={mailer.busy} onclick={disconnect} use:autofocus>{mailer.busy ? 'Removing...' : 'Yes, disconnect'}</button>
					<button class="dz-btn" type="button" style="background:var(--color-bg)" onclick={() => (confirming = false)}>Cancel</button>
				</span>
			{/if}
		</div>

		{#if revoked}
			<div role="alert" class="dz-note dz-note-bad"><Icon name="danger" width={16} height={16} /><span>Mailer rejected your key. It may have been revoked. Disconnect it and connect a new key.</span></div>
		{:else if mailer.check?.kind === 'error'}
			<div role="status" class="dz-note dz-note-bad"><Icon name="danger" width={16} height={16} /><span>{mailer.check.message}</span></div>
		{:else if mailer.check?.kind === 'ok'}
			{@const ck = mailer.check}
			<div role="status" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px">
				{#each ck.scopes as sc (sc.scope)}
					<div style="display:flex;flex-direction:column;gap:6px;padding:10px 12px;border-radius:12px;background:var(--color-bg)">
						<div style="display:flex;align-items:center;gap:10px">
							<span style="width:9px;height:9px;border-radius:4px;flex-shrink:0;background:{sc.state === 'ok' ? 'var(--color-success)' : sc.state === 'missing' ? 'var(--color-danger)' : 'var(--color-muted)'}"></span>
							<span style="flex-grow:1;font-size:13px;font-weight:600">{sc.label}</span>
							<span style="font-size:12px;font-weight:600;color:{sc.state === 'ok' ? 'var(--color-success)' : sc.state === 'missing' ? 'var(--color-danger)' : 'var(--color-muted)'}">{stateLabel[sc.state]}</span>
						</div>
						<div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding-left:19px">
							<span class="dz-mono" style="font-size:11.5px;color:var(--color-muted)">{sc.scope}</span>
							{#if sc.scope === 'contacts:read'}<span class="dz-badge" style="background:var(--color-surface-3);color:var(--color-muted);font-size:11px">Recommended</span>{/if}
						</div>
						{#if sc.note}<div style="font-size:12px;line-height:1.45;color:var(--color-danger);padding-left:19px">{sc.note}</div>{/if}
					</div>
				{/each}
			</div>
			<p style="margin:0;font-size:12.5px;line-height:1.5;color:var(--color-muted)">
				{ck.senders ?? 0} sender address{ck.senders === 1 ? '' : 'es'}{ck.templates !== null ? `, ${ck.templates} template${ck.templates === 1 ? '' : 's'} in Mailer` : ''}{ck.contactFields !== null ? `, ${ck.contactFields} contact field${ck.contactFields === 1 ? '' : 's'}` : ''}.
				Send and write access cannot be tested without sending mail or writing data, so they are verified on first use.
			</p>
		{/if}
		{#if mailer.error}
			<div class="dz-note dz-note-bad" role="alert"><Icon name="danger" width={16} height={16} /><span>{mailer.error}</span></div>
		{/if}
	{/if}
</div>

<style>
	.mc { display: flex; flex-direction: column; gap: 18px; color: var(--color-text); font-family: var(--font-sans); }
	.mc-compact { gap: 16px; }
	.mc :global(.dz-note-bad) { margin: 0; }
	.mc-keylink { color: var(--color-text); font-weight: 600; text-decoration: underline; }
</style>
