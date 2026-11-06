<script lang="ts">
	import { page } from '$app/state';
	import { editor } from '$lib/store.svelte';
	import { mailer } from '$lib/mailer.svelte';
	import { mailerData } from '$lib/mailer-data.svelte';
	import { collectUsage, linkFieldNeeds } from '$lib/placeholders';
	import { autofocus, trapFocus } from '$lib/focus';
	import Icon from './Icon.svelte';
	import MailerConnectCard from './MailerConnectCard.svelte';
	import SelectMenu from './SelectMenu.svelte';
	import PlaceholderWarnings from './PlaceholderWarnings.svelte';

	let { open = false, onclose }: { open: boolean; onclose: () => void } = $props();

	type Sender = { email: string; name: string | null };
	type Result = { to: string; ok: boolean; status?: number; error?: string };

	const MAX = 25;

	let senders = $state<Sender[]>([]);
	let sendersError = $state('');
	let fromEmail = $state('');
	let recipientsText = $state('');
	let subject = $state('');
	let varValues = $state<Record<string, string>>({});
	let sending = $state(false);
	let formError = $state('');
	let results = $state<Result[]>([]);
	let confirming = $state(false);

	const userEmail = $derived((page.data.user as { email?: string } | null)?.email ?? '');

	const recipients = $derived(
		[...new Set(recipientsText.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean).map((s) => s.toLowerCase()))]
	);
	const tooMany = $derived(recipients.length > MAX);

	// What the template uses: plain {{names}} need a value, {{name|fallback}} may have one, and a
	// named link brings the fields inside its URL along.
	// The subject is merged with the same values, so its placeholders count too.
	const usage = $derived(collectUsage([editor.blocks, subject]));
	const usedLinks = $derived(new Map(mailerData.links.filter((l) => usage.links.has(l.key)).map((l) => [l.key, l.url])));
	const variableNames = $derived.by(() => {
		const names = new Set<string>();
		for (const [k, f] of usage.fields) if (!f.hasFallback) names.add(k);
		for (const n of linkFieldNeeds(usage.links, usedLinks)) names.add(n);
		// These three have built-in defaults on the server.
		for (const d of ['theme_color', 'logo', 'company_name']) names.delete(d);
		return [...names];
	});
	const optionalNames = $derived([...usage.fields].filter(([k, v]) => v.hasFallback && !variableNames.includes(k)).map(([k]) => k));
	const usesGrammar = $derived(usage.links.size > 0 || optionalNames.length > 0);

	let wasOpen = false;
	$effect(() => {
		if (open && !wasOpen) init();
		wasOpen = open;
	});

	// Load senders whenever the shared state becomes connected (here or on the Settings page).
	$effect(() => {
		if (open && mailer.status === 'connected') loadSenders();
		else senders = [];
	});

	async function init() {
		formError = '';
		results = [];
		confirming = false;
		subject = editor.templateName;
		varValues = Object.fromEntries([...variableNames, ...optionalNames].map((n) => [n, '']));
		await mailer.load();
		if (mailer.status === 'connected' && usage.links.size) mailerData.loadLinks();
	}

	async function loadSenders() {
		sendersError = '';
		try {
			const res = await fetch('/api/mailer/senders');
			const data = await res.json().catch(() => ({}));
			if (res.ok) {
				senders = data.senders ?? [];
				if (!senders.some((s) => s.email === fromEmail)) fromEmail = senders[0]?.email ?? '';
				if (!senders.length) sendersError = 'No sender addresses found in your Mailer account. Register one in Mailer first.';
			} else if (res.status === 409) {
				// Unreadable key: show it once and stop, do not reload (that would re-trigger this load).
				if (data.code === 'mailer_key_unreadable') mailer.markUnreadable();
				else await mailer.load();
			} else {
				sendersError = data.error ?? 'Could not load your sender addresses.';
			}
		} catch {
			sendersError = 'Could not load your sender addresses.';
		}
	}

	async function disconnect() {
		if (await mailer.disconnect()) {
			results = [];
			confirming = false;
		}
	}

	async function send() {
		formError = '';
		results = [];
		const variables = variableNames.length || optionalNames.length ? Object.fromEntries(Object.entries(varValues).filter(([k, v]) => variableNames.includes(k) || v.trim() !== '')) : undefined;
		sending = true;
		try {
			// Pending edits and brand new templates are saved first (the server sends the saved copy).
			if ((editor.dirty || editor.templateId.startsWith('untitled-')) && !(await editor.saveTemplate())) {
				formError = 'Save the template before sending (it could not be saved).';
				return;
			}
			const from = senders.find((s) => s.email === fromEmail);
			const res = await fetch(`/api/templates/${encodeURIComponent(editor.templateId)}/send`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					from: from ? { email: from.email, ...(from.name ? { name: from.name } : {}) } : undefined,
					to: recipients,
					subject,
					variables,
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (res.ok) {
				results = data.results ?? [];
				if (data.keyInvalid) formError = 'Your Mailer key is invalid or has been revoked. Open Settings to reconnect.';
			} else if (res.status === 409) {
				if (data.code === 'mailer_key_unreadable') mailer.markUnreadable();
				else await mailer.load();
			} else {
				formError =
					res.status === 429
						? `${data.error} Retry in about ${Math.ceil(Number(res.headers.get('Retry-After') ?? 60) / 60)} min.`
						: data.error ?? `Send failed (error ${res.status})`;
			}
		} catch {
			formError = 'Send failed, check your connection';
		} finally {
			sending = false;
		}
	}

	const varsFilled = $derived(variableNames.every((n) => (varValues[n] ?? '').trim() !== ''));
	const canSend = $derived(
		!sending && varsFilled && !!fromEmail && recipients.length > 0 && !tooMany && subject.trim().length > 0 && subject.length <= 200
	);
	const sentCount = $derived(results.filter((r) => r.ok).length);

	const failed = $derived(results.filter((r) => !r.ok));
	function retryFailed() {
		recipientsText = failed.map((r) => r.to).join(', ');
		results = [];
		formError = '';
	}

	// While a send is running, Escape and backdrop clicks do nothing, so results are never discarded.
	function close() {
		if (!sending) onclose();
	}
	function onkeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') close();
	}
</script>

<svelte:window {onkeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="sm sm-overlay" onclick={close}>
		<div class="sm-card" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Send email" tabindex="-1" use:trapFocus>
			<div class="sm-head">
				<div class="sm-title">Send email</div>
				<button class="sm-x" onclick={close} aria-label="Close" disabled={sending}><Icon name="close" width={16} height={16} /></button>
			</div>

			{#if mailer.status !== 'connected'}
				<MailerConnectCard />
			{:else}
				<label class="sm-label" for="sm-from">From</label>
				<SelectMenu
					id="sm-from"
					bind:value={fromEmail}
					disabled={!senders.length}
					options={senders.map((s) => ({ value: s.email, label: s.name ?? s.email, hint: s.name ? s.email : undefined }))}
					placeholder={senders.length ? 'Choose a sender' : 'No senders'}
					searchPlaceholder="Search senders"
				/>
				{#if sendersError}
					<div class="sm-note sm-note-err" role="alert"><Icon name="warning" width={16} height={16} /><span>{sendersError}</span></div>
				{/if}

				<div class="sm-row">
					<label class="sm-label" for="sm-to">Recipients</label>
					<span class="sm-count" class:sm-over={tooMany}>{recipients.length} / {MAX}</span>
					<button class="sm-link" type="button" disabled={!userEmail} onclick={() => (recipientsText = userEmail)}>Send to me</button>
				</div>
				<textarea id="sm-to" class="sm-input sm-mono" rows="3" placeholder="one@example.com, two@example.com" bind:value={recipientsText}></textarea>

				<label class="sm-label" for="sm-subj">Subject</label>
				<input id="sm-subj" class="sm-input" type="text" maxlength="200" bind:value={subject} />

				{#if variableNames.length}
					<div class="sm-label">Variables (all required)</div>
					<div class="sm-vars">
						{#each variableNames as n (n)}
							<label class="sm-var" for="sm-var-{n}">
								<span class="sm-mono sm-var-name">{n}</span>
								<input id="sm-var-{n}" class="sm-input" type="text" required aria-required="true" aria-invalid={(varValues[n] ?? '').trim() === ''} bind:value={varValues[n]} />
							</label>
						{/each}
					</div>
				{/if}

				{#if optionalNames.length}
					<div class="sm-label">Optional values (leave empty to use the fallback)</div>
					<div class="sm-vars">
						{#each optionalNames as n (n)}
							<label class="sm-var" for="sm-opt-{n}">
								<span class="sm-mono sm-var-name">{n}</span>
								<input id="sm-opt-{n}" class="sm-input" type="text" bind:value={varValues[n]} />
							</label>
						{/each}
					</div>
				{/if}

				{#if usesGrammar}
					<p class="sm-note sm-note-info" role="note">
						<Icon name="link" width={16} height={16} />
						<span>This send fills {'{{name|fallback}}'} and {'{{link:key}}'} here: named links come from your Mailer account and values are URL-encoded inside links. In a Mailer broadcast, Mailer fills them in per contact.</span>
					</p>
				{/if}

				<PlaceholderWarnings variant="dialog" />

				{#if formError}
					<div class="sm-note sm-note-err" role="alert"><Icon name="warning" width={16} height={16} /><span>{formError}</span></div>
				{/if}

				{#if results.length}
					<div class="sm-results" aria-live="polite">
						<div class="sm-muted">{sentCount} of {results.length} queued</div>
						{#each results as r}
							<div class="sm-res" class:sm-res-ok={r.ok} class:sm-res-err={!r.ok}>
								<Icon name={r.ok ? 'check' : 'warning'} width={14} height={14} />
								<span class="sm-mono sm-res-to">{r.to}</span>
								<span class="sm-res-msg">{r.ok ? 'Queued' : (r.error ?? 'Failed')}</span>
							</div>
						{/each}
					</div>
					{#if failed.length}
						<div class="sm-retry">
							<span class="sm-muted">Send again to only the {failed.length} that did not go out, so nobody gets it twice.</span>
							<button class="sm-link" type="button" onclick={retryFailed}>Retry failed</button>
						</div>
					{/if}
				{/if}

				<p class="sm-disclosure">Mail is sent from your Mailer account and counts toward its plan and limits.</p>

				<div class="sm-foot sm-foot-split">
					{#if !confirming}
						<button class="sm-link sm-link-quiet" type="button" onclick={() => (confirming = true)}>Disconnect Mailer{mailer.keyHint ? ` (key ending ${mailer.keyHint})` : ''}</button>
					{:else}
						<span class="sm-confirm">
							<span class="sm-muted">Delete the stored key?</span>
							<button class="sm-link sm-link-danger" type="button" disabled={mailer.busy} onclick={disconnect} use:autofocus>Yes, disconnect</button>
							<button class="sm-link sm-link-quiet" type="button" onclick={() => (confirming = false)}>Cancel</button>
						</span>
					{/if}
					<button class="sm-btn sm-btn-primary" disabled={!canSend} onclick={send}>
						<Icon name="send" width={14} height={14} />
						{sending ? 'Sending...' : 'Send'}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* All colors for this component live in this block. */
	.sm {
		--sm-accent: var(--color-accent);
		--sm-card: var(--color-surface-2);
		--sm-field: var(--color-bg);
		--sm-border: var(--color-border-1);
		--sm-text: var(--color-text);
		--sm-muted: var(--color-muted);
		--sm-ok: var(--color-success);
		--sm-err: var(--color-danger);
		--sm-warn: var(--color-danger);
	}
	.sm-overlay {
		position: fixed;
		inset: 0;
		z-index: 1000;
		background: color-mix(in srgb, var(--color-bg) 70%, transparent);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.sm-card {
		background: var(--sm-card);
		border: 1px solid var(--sm-border);
		border-radius: 12px;
		width: min(520px, 92vw);
		max-height: 90vh;
		overflow-y: auto;
		padding: 22px;
		color: var(--sm-text);
		font-size: 13px;
		font-family: var(--font-sans);
	}
	.sm-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
	.sm-title { font-size: 16px; font-weight: 600; }
	.sm-x { background: none; border: none; color: var(--sm-muted); cursor: pointer; display: flex; padding: 4px; border-radius: 6px; }
	.sm-x:hover { color: var(--sm-text); }
	.sm-muted { color: var(--sm-muted); font-size: 12px; }
	.sm-label { display: block; font-size: 11.5px; font-weight: 600; color: var(--sm-muted); margin: 12px 0 5px; }
	.sm-row { display: flex; align-items: baseline; gap: 10px; }
	.sm-row .sm-label { margin-right: auto; }
	.sm-count { font-size: 11.5px; color: var(--sm-muted); }
	.sm-over { color: var(--sm-err); }
	.sm-link { background: none; border: none; cursor: pointer; font: inherit; font-size: 11.5px; padding: 0; }
	.sm-link { color: var(--color-accent-ink); }
	.sm-link:disabled { opacity: 0.4; cursor: not-allowed; }
	.sm-link-quiet { color: var(--sm-muted); text-decoration: underline; }
	.sm-link-danger { color: var(--sm-err); }
	.sm-confirm { display: inline-flex; gap: 10px; align-items: center; }
	.sm-input {
		width: 100%;
		background: var(--sm-field);
		color: var(--sm-text);
		border: 1px solid var(--sm-border);
		border-radius: 7px;
		padding: 8px 10px;
		font: inherit;
		resize: vertical;
	}
	.sm-input:focus { outline: 2px solid var(--sm-accent); outline-offset: 0; }
	.sm-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 12px; }
	.sm-note {
		display: flex; gap: 8px; align-items: flex-start;
		margin-top: 12px; padding: 9px 10px; border-radius: 7px; line-height: 1.45;
		border: 1px solid transparent;
	}
	.sm-note-info { border-color: var(--color-info); background: var(--color-info-soft); color: var(--color-text); }
	.sm-note-err { border-color: var(--sm-err); background: color-mix(in srgb, var(--sm-err) 12%, transparent); color: var(--sm-err); }
	.sm-results { margin-top: 14px; display: flex; flex-direction: column; gap: 6px; }
	.sm-res {
		display: flex; align-items: center; gap: 8px;
		padding: 7px 10px; border-radius: 7px; border: 1px solid transparent;
	}
	.sm-res-ok { border-color: var(--sm-ok); background: color-mix(in srgb, var(--sm-ok) 10%, transparent); color: var(--sm-ok); }
	.sm-res-err { border-color: var(--sm-err); background: color-mix(in srgb, var(--sm-err) 10%, transparent); color: var(--sm-err); }
	.sm-vars { display: flex; flex-direction: column; gap: 8px; }
	.sm-var { display: grid; grid-template-columns: 9rem 1fr; align-items: center; gap: 10px; }
	.sm-var-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--sm-muted); }
	.sm-var .sm-input[aria-invalid='true'] { border-color: var(--sm-err); }
	.sm-retry { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 10px; }
	.sm-res-to { color: var(--sm-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.sm-res-msg { margin-left: auto; font-size: 12px; text-align: right; }
	.sm-disclosure { margin: 14px 0 0; font-size: 11.5px; color: var(--sm-muted); }
	.sm-foot { display: flex; justify-content: flex-end; margin-top: 16px; gap: 10px; align-items: center; }
	.sm-foot-split { justify-content: space-between; }
	.sm-btn {
		display: inline-flex; align-items: center; gap: 6px;
		border: none; border-radius: 7px; padding: 8px 16px; font: inherit; font-weight: 600; cursor: pointer;
	}
	.sm-btn-primary { background: var(--sm-accent); color: var(--color-on-accent); }
	.sm-btn-primary:hover:not(:disabled) { background: color-mix(in srgb, var(--color-accent) 85%, var(--color-text)); }
	.sm-btn:disabled { opacity: 0.45; cursor: not-allowed; }
</style>
