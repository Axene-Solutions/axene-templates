<script lang="ts">
	import { mailer } from '$lib/mailer.svelte';
	import { autofocus } from '$lib/focus';
	import Icon from './Icon.svelte';

	// Shared by the Settings page and the Send modal. All state lives in $lib/mailer.svelte.
	let { compact = false }: { compact?: boolean } = $props();

	let apiKey = $state('');
	let confirming = $state(false);

	async function connect() {
		if (await mailer.connect(apiKey)) apiKey = '';
	}
	async function disconnect() {
		if (await mailer.disconnect()) confirming = false;
	}
	const when = $derived(mailer.connectedAt ? new Date(mailer.connectedAt).toLocaleString() : '');
</script>

<div class="mc" class:mc-compact={compact}>
	{#if mailer.status === 'loading'}
		<p class="mc-muted">Loading...</p>
	{:else if mailer.status === 'unavailable'}
		<div class="mc-note mc-note-warn" role="alert">
			<Icon name="warning" width={16} height={16} />
			<span>Sending is not available right now. Try again later.</span>
		</div>
	{:else if mailer.status === 'disconnected' || mailer.status === 'unreadable'}
		{#if mailer.status === 'unreadable'}
			<div class="mc-note mc-note-err" role="alert">
				<Icon name="warning" width={16} height={16} />
				<span>
					The stored Mailer key (ending <span class="mc-mono">{mailer.keyHint}</span>) cannot be read{mailer.configured ? ', most likely because the server key changed' : ' because sending is not configured on the server'}.
					{mailer.configured ? 'Disconnect it and connect your key again.' : 'You can disconnect it now and connect again once sending is configured.'}
				</span>
			</div>
			<div class="mc-actions">
				{#if !confirming}
					<button class="mc-btn mc-btn-danger" onclick={() => (confirming = true)}>Disconnect</button>
				{:else}
					<span class="mc-muted">Delete the stored key?</span>
					<button class="mc-btn mc-btn-danger-solid" disabled={mailer.busy} onclick={disconnect} use:autofocus>
						{mailer.busy ? 'Removing...' : 'Yes, disconnect'}
					</button>
					<button class="mc-btn" onclick={() => (confirming = false)}>Cancel</button>
				{/if}
			</div>
		{/if}
		{#if mailer.status === 'disconnected' || mailer.configured}
		<p class="mc-text">
			Connect your Axene Mailer account to send templates from your own verified domain, save templates into Mailer, and open Mailer templates here to edit them. Your key is stored encrypted and is never shown again.
		</p>
		<ol class="mc-steps">
			<li>Open <a href="https://mail.axene.io/api-keys" target="_blank" rel="noopener noreferrer">mail.axene.io/api-keys</a> and create a key.</li>
			<li>
				Tick these scopes:
				<ul>
					<li><strong>Send emails</strong></li>
					<li><strong>Read sender addresses</strong></li>
					<li><strong>Read templates</strong> (required for From Mailer)</li>
					<li><strong>Write templates</strong> (required for Save to Mailer and named links)</li>
					<li><strong>Read contacts</strong> (recommended, needed for your contact fields in Insert field)</li>
				</ul>
			</li>
			<li>Paste the key below.</li>
		</ol>
		<label class="mc-label" for="mc-key">Mailer API key</label>
		<input id="mc-key" class="mc-input" type="password" autocomplete="off" spellcheck="false" placeholder="axm_k_..." bind:value={apiKey} />
		{#if mailer.error}
			<div class="mc-note mc-note-err" role="alert"><Icon name="warning" width={16} height={16} /><span>{mailer.error}</span></div>
		{/if}
		<div class="mc-actions">
			<button class="mc-btn mc-btn-primary" disabled={mailer.busy || !apiKey.trim()} onclick={connect}>
				{mailer.busy ? 'Checking key...' : mailer.status === 'unreadable' ? 'Reconnect' : 'Connect'}
			</button>
		</div>
		{/if}
	{:else}
		<div class="mc-status">
			<Icon name="check" width={16} height={16} />
			<span>Connected, key ending <span class="mc-mono">{mailer.keyHint}</span>{when ? `, since ${when}` : ''}</span>
		</div>

		{#if mailer.check}
			{#if mailer.check.kind === 'ok'}
				<ul class="mc-scopes" role="status">
					{#each mailer.check.scopes as sc}
						<li class="mc-scope mc-scope-{sc.state}">
							<Icon name={sc.state === 'ok' ? 'check' : 'warning'} width={14} height={14} />
							<span class="mc-scope-main">
								<span>{sc.label}</span>
								<span class="mc-mono mc-scope-id">{sc.scope}</span>
								{#if sc.scope === 'contacts:read'}<span class="mc-rec">Recommended</span>{/if}
							</span>
							<span class="mc-scope-state">
								{#if sc.state === 'ok'}Works{:else if sc.state === 'missing'}Missing{:else if sc.state === 'unverified'}Not tested{:else}Could not check{/if}
							</span>
							{#if sc.note}<span class="mc-scope-note">{sc.note}</span>{/if}
						</li>
					{/each}
				</ul>
				<p class="mc-muted mc-scope-foot">
					{mailer.check.senders ?? 0} sender address{mailer.check.senders === 1 ? '' : 'es'}{mailer.check.templates !== null ? `, ${mailer.check.templates} template${mailer.check.templates === 1 ? '' : 's'} in Mailer` : ''}{mailer.check.contactFields !== null ? `, ${mailer.check.contactFields} contact field${mailer.check.contactFields === 1 ? '' : 's'}` : ''}.
					Send and write access cannot be tested without sending mail or writing data, so they are verified on first use.
				</p>
			{:else}
				<div class="mc-note mc-note-err" role="status">
					<Icon name="warning" width={16} height={16} />
					<span>{mailer.check.message}</span>
				</div>
			{/if}
		{/if}
		{#if mailer.error}
			<div class="mc-note mc-note-err" role="alert"><Icon name="warning" width={16} height={16} /><span>{mailer.error}</span></div>
		{/if}

		<div class="mc-actions">
			<button class="mc-btn" disabled={mailer.checking} onclick={() => mailer.recheck()}>
				<Icon name="refresh" width={14} height={14} />
				{mailer.checking ? 'Checking...' : 'Check connection'}
			</button>
			{#if !confirming}
				<button class="mc-btn mc-btn-danger" onclick={() => (confirming = true)}>Disconnect</button>
			{:else}
				<span class="mc-muted">Delete the stored key?</span>
				<button class="mc-btn mc-btn-danger-solid" disabled={mailer.busy} onclick={disconnect} use:autofocus>
					{mailer.busy ? 'Removing...' : 'Yes, disconnect'}
				</button>
				<button class="mc-btn" onclick={() => (confirming = false)}>Cancel</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	/* All colors for this component live in this block. */
	.mc {
		--mc-accent: var(--color-accent);
		--mc-field: var(--color-bg);
		--mc-border: var(--color-border-1);
		--mc-text: var(--color-text);
		--mc-muted: var(--color-muted);
		--mc-ok: var(--color-success);
		--mc-err: var(--color-danger);
		--mc-warn: var(--color-danger);
		color: var(--mc-text);
		font-size: 13px;
	}
	.mc-text { line-height: 1.5; color: var(--mc-muted); margin-bottom: 10px; }
	.mc-muted { color: var(--mc-muted); font-size: 12px; }
	.mc-steps { color: var(--mc-muted); line-height: 1.6; margin: 0 0 14px 18px; }
	.mc-steps ul { list-style: disc; margin-left: 18px; }
	.mc-steps a { color: var(--color-accent-ink); }
	.mc-label { display: block; font-size: 11.5px; font-weight: 600; color: var(--mc-muted); margin: 12px 0 5px; }
	.mc-input {
		width: 100%; background: var(--mc-field); color: var(--mc-text);
		border: 1px solid var(--mc-border); border-radius: 7px; padding: 8px 10px;
		font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 12px;
	}
	.mc-input:focus { outline: 2px solid var(--mc-accent); }
	.mc-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
	.mc-status { display: flex; align-items: center; gap: 8px; color: var(--mc-ok); }
	.mc-status span { color: var(--mc-text); }
	.mc-note {
		display: flex; gap: 8px; align-items: flex-start; margin-top: 12px;
		padding: 9px 10px; border-radius: 7px; line-height: 1.45; border: 1px solid transparent;
	}
	.mc-note-err { border-color: var(--mc-err); background: color-mix(in srgb, var(--mc-err) 12%, transparent); color: var(--mc-err); }
	.mc-note-warn { border-color: var(--mc-warn); background: color-mix(in srgb, var(--mc-warn) 12%, transparent); color: var(--mc-warn); }
	.mc-note-ok { border-color: var(--mc-ok); background: color-mix(in srgb, var(--mc-ok) 10%, transparent); color: var(--mc-ok); }
	.mc-scopes { list-style: none; margin: 12px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
	.mc-scope {
		display: grid; grid-template-columns: auto 1fr auto; align-items: center; column-gap: 8px; row-gap: 2px;
		padding: 8px 10px; border-radius: 7px; border: 1px solid var(--mc-border);
	}
	.mc-scope-main { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px; }
	.mc-scope-id { color: var(--mc-muted); font-size: 11px; }
	.mc-rec { font-size: 10.5px; font-weight: 600; padding: 0 7px; border-radius: 99px; background: var(--color-accent-soft); color: var(--color-accent-ink); box-shadow: 0 0 0 1px var(--color-accent); }
	.mc-scope-state { font-size: 12px; font-weight: 600; }
	.mc-scope-note { grid-column: 2 / 4; font-size: 11.5px; color: var(--mc-muted); }
	.mc-scope-ok { border-color: var(--mc-ok); background: color-mix(in srgb, var(--mc-ok) 10%, transparent); }
	.mc-scope-ok :global(.icon-wrapper), .mc-scope-ok .mc-scope-state { color: var(--mc-ok); }
	.mc-scope-missing { border-color: var(--mc-err); background: color-mix(in srgb, var(--mc-err) 12%, transparent); }
	.mc-scope-missing :global(.icon-wrapper), .mc-scope-missing .mc-scope-state { color: var(--mc-err); }
	.mc-scope-unverified :global(.icon-wrapper), .mc-scope-unverified .mc-scope-state, .mc-scope-unknown :global(.icon-wrapper), .mc-scope-unknown .mc-scope-state { color: var(--mc-muted); }
	.mc-scope-foot { margin-top: 8px; line-height: 1.45; }
	.mc-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 16px; }
	.mc-btn {
		display: inline-flex; align-items: center; gap: 6px; background: transparent; color: var(--mc-text);
		border: 1px solid var(--mc-border); border-radius: 7px; padding: 7px 14px; font: inherit; font-weight: 600; cursor: pointer;
	}
	.mc-btn:hover:not(:disabled) { background: var(--color-surface-2); }
	.mc-btn:disabled { opacity: 0.45; cursor: not-allowed; }
	.mc-btn-primary { background: var(--mc-accent); color: #101010; border-color: var(--mc-accent); }
	.mc-btn-primary:hover:not(:disabled) { background: color-mix(in srgb, var(--color-accent) 85%, var(--color-text)); }
	.mc-btn-danger { color: var(--mc-err); border-color: var(--mc-err); }
	.mc-btn-danger-solid { background: var(--color-danger); color: var(--color-bg); border-color: var(--color-danger); }
	.mc-btn-danger-solid:hover:not(:disabled) { opacity: 0.9; }
</style>
