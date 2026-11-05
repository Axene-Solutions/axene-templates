<script lang="ts">
	import { mailer } from '$lib/mailer.svelte';
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
	{:else if mailer.status === 'disconnected'}
		<p class="mc-text">
			Send your templates from your own Axene Mailer account. Connect a Mailer API key and emails go out from your verified domain. Your key is stored encrypted and is never shown again.
		</p>
		<ol class="mc-steps">
			<li>Open <a href="https://mail.axene.io/api-keys" target="_blank" rel="noopener noreferrer">mail.axene.io/api-keys</a> and create a key.</li>
			<li>
				Tick these scopes:
				<ul>
					<li><strong>Send emails</strong></li>
					<li><strong>Read sender addresses</strong></li>
					<li>Read templates (optional for now)</li>
					<li>Write templates (optional for now)</li>
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
				{mailer.busy ? 'Checking key...' : 'Connect'}
			</button>
		</div>
	{:else}
		<div class="mc-status">
			<Icon name="check" width={16} height={16} />
			<span>Connected, key ending <span class="mc-mono">{mailer.keyHint}</span>{when ? `, since ${when}` : ''}</span>
		</div>

		{#if mailer.check}
			<div class="mc-note" class:mc-note-ok={mailer.check.kind === 'ok'} class:mc-note-err={mailer.check.kind !== 'ok'} role="status">
				<Icon name={mailer.check.kind === 'ok' ? 'check' : 'warning'} width={16} height={16} />
				<span>
					{#if mailer.check.kind === 'ok'}
						Key works. {mailer.check.senders} sender address{mailer.check.senders === 1 ? '' : 'es'} available.
					{:else}
						{mailer.check.message}
					{/if}
				</span>
			</div>
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
				<button class="mc-btn mc-btn-danger-solid" disabled={mailer.busy} onclick={disconnect}>
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
		--mc-accent: #ffd100;
		--mc-field: #141414;
		--mc-border: rgba(255, 255, 255, 0.12);
		--mc-text: #e0e0e0;
		--mc-muted: #888;
		--mc-ok: #34d399;
		--mc-err: #f87171;
		--mc-warn: #fbbf24;
		color: var(--mc-text);
		font-size: 13px;
	}
	.mc-text { line-height: 1.5; color: var(--mc-muted); margin-bottom: 10px; }
	.mc-muted { color: var(--mc-muted); font-size: 12px; }
	.mc-steps { color: var(--mc-muted); line-height: 1.6; margin: 0 0 14px 18px; }
	.mc-steps ul { list-style: disc; margin-left: 18px; }
	.mc-steps a { color: var(--mc-accent); }
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
	.mc-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 16px; }
	.mc-btn {
		display: inline-flex; align-items: center; gap: 6px; background: transparent; color: var(--mc-text);
		border: 1px solid var(--mc-border); border-radius: 7px; padding: 7px 14px; font: inherit; font-weight: 600; cursor: pointer;
	}
	.mc-btn:hover:not(:disabled) { background: rgba(255, 255, 255, 0.06); }
	.mc-btn:disabled { opacity: 0.45; cursor: not-allowed; }
	.mc-btn-primary { background: var(--mc-accent); color: #000; border-color: var(--mc-accent); }
	.mc-btn-primary:hover:not(:disabled) { background: #ffe033; }
	.mc-btn-danger { color: var(--mc-err); border-color: var(--mc-err); }
	.mc-btn-danger-solid { background: #dc2626; color: #fff; border-color: #dc2626; }
	.mc-btn-danger-solid:hover:not(:disabled) { background: #b91c1c; }
</style>
