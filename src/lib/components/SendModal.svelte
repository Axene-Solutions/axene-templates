<script lang="ts">
	import { page } from '$app/state';
	import { editor } from '$lib/store.svelte';
	import { mailer } from '$lib/mailer.svelte';
	import { mailerData } from '$lib/mailer-data.svelte';
	import { collectUsage, linkFieldNeeds } from '$lib/placeholders';
	import Icon from './Icon.svelte';
	import MailerConnectCard from './MailerConnectCard.svelte';
	import PlaceholderWarnings from './PlaceholderWarnings.svelte';
	import ModalFrame from './editor/ModalFrame.svelte';

	// Send (Editor.dc.html SEND): From picker, recipients, subject, the template's variables,
	// sending spinner, sent check that closes by itself. `onback` shows a Back chevron when this
	// step was reached from Save to Mailer.
	interface Props {
		open: boolean;
		onclose: () => void;
		onback?: () => void;
	}
	let { open = false, onclose, onback }: Props = $props();

	type Sender = { email: string; name: string | null };
	type Result = { to: string; ok: boolean; status?: number; error?: string };

	const MAX = 25;

	let senders = $state<Sender[]>([]);
	let sendersError = $state('');
	let fromEmail = $state('');
	let fromOpen = $state(false);
	let fromQuery = $state('');
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

	// Same per user and template key the Save to Mailer dialog writes, so Send opens with the saved subject.
	function savedSubject(): string {
		const uid = (page.data as { user?: { id?: string } | null }).user?.id;
		if (!uid) return '';
		try {
			return localStorage.getItem(`axene.mailerSubject.${uid}.${editor.templateId}`) ?? '';
		} catch {
			return '';
		}
	}

	async function init() {
		formError = '';
		results = [];
		confirming = false;
		fromOpen = false;
		subject = savedSubject() || editor.templateName;
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
		if (!canSend) return;
		formError = '';
		results = [];
		fromOpen = false;
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
	const allSent = $derived(!sending && results.length > 0 && results.every((r) => r.ok) && !formError);

	// Everything went out: confirm it, then get out of the way.
	$effect(() => {
		if (!open || !allSent) return;
		const t = setTimeout(onclose, 2600);
		return () => clearTimeout(t);
	});

	const failed = $derived(results.filter((r) => !r.ok));
	function retryFailed() {
		recipientsText = failed.map((r) => r.to).join(', ');
		results = [];
		formError = '';
	}

	const from = $derived(senders.find((s) => s.email === fromEmail) ?? null);
	const shown = $derived.by(() => {
		const q = fromQuery.trim().toLowerCase();
		return senders.filter((s) => !q || (s.name ?? '').toLowerCase().includes(q) || s.email.includes(q));
	});
	function sendToMe() {
		if (!userEmail || recipients.includes(userEmail.toLowerCase())) return;
		recipientsText = [...recipients, userEmail].join(', ');
	}
	function fromKey(e: KeyboardEvent) {
		if (e.key === 'Escape' && fromOpen) {
			e.preventDefault();
			e.stopPropagation();
			fromOpen = false;
		}
	}
	const note = 'font-size:12.5px;line-height:1.5;padding:10px 12px;border-radius:12px';
	const card = 'width:100%;max-width:520px;background:var(--bg);border-radius:16px;padding:26px;box-shadow:0 30px 80px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:16px';
</script>

{#if open}
	<ModalFrame label="Send email" busy={sending} {onclose} style={card}>
		{#if sending}
			<div role="status" style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:44px 0 38px"><span style="width:36px;height:36px;border-radius:50%;border:3px solid var(--s3);border-top-color:#ffd100;animation:ed-spin .8s linear infinite"></span><div style="font-size:18px;font-weight:700;margin-top:6px">Sending to {recipients.length} recipient{recipients.length === 1 ? '' : 's'}</div><div style="font-size:13px;color:var(--muted)">This takes a few seconds.</div></div>
		{:else if allSent}
			<div role="status" style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:34px 0 22px"><span style="width:60px;height:60px;border-radius:16px;display:grid;place-items:center;color:var(--ok);background:var(--ok-soft);animation:ed-pop .28s ease-out"><Icon name="tick-circle" width={28} height={28} /></span><div style="font-size:19px;font-weight:700;margin-top:10px">{results.length === 1 ? 'Email sent' : `${results.length} emails sent`}</div><div style="font-size:13px;color:var(--muted)">Delivery status is in your Mailer email log. This closes by itself.</div><button class="btn btn-primary" type="button" style="margin-top:14px" onclick={onclose}>Done</button></div>
		{:else}
			<div style="display:flex;gap:8px;align-items:flex-start">
				{#if onback}<button class="icon-btn" type="button" onclick={onback} aria-label="Back to saved" style="margin-left:-8px"><Icon name="arrow-left42" width={18} height={18} /></button>{/if}
				<div style="flex-grow:1"><h2 style="margin:0;font-size:20px;font-weight:700;letter-spacing:-.01em">Send email</h2><p style="margin:5px 0 0;font-size:13.5px;line-height:1.5;color:var(--muted)">Sent from your Mailer account, from your own domain.</p></div>
				<button class="icon-btn" type="button" onclick={onclose} aria-label="Close"><Icon name="close" width={16} height={16} /></button>
			</div>

			{#if mailer.status !== 'connected'}
				<MailerConnectCard />
			{:else}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div style="display:flex;flex-direction:column;gap:7px;position:relative" onkeydown={fromKey}>
					<span class="lbl">From</span>
					<button type="button" class="field" onclick={() => { fromOpen = !fromOpen; fromQuery = ''; }} aria-haspopup="listbox" aria-expanded={fromOpen} disabled={!senders.length} style="display:flex;align-items:center;gap:8px;text-align:left;cursor:pointer"><span style="flex-grow:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{#if from}{from.name ?? from.email} <span class="mono" style="font-size:12px;color:var(--muted);margin-left:6px">{from.name ? from.email : ''}</span>{:else}<span style="color:var(--muted)">{senders.length ? 'Choose a sender' : 'No senders'}</span>{/if}</span><span style="color:var(--muted);display:flex"><Icon name="arrow-down4" width={14} height={14} /></span></button>
					{#if fromOpen}
						<div style="position:absolute;left:0;right:0;top:62px;background:var(--bg);border-radius:12px;padding:8px;box-shadow:0 18px 50px rgba(0,0,0,.28);z-index:6;display:flex;flex-direction:column;gap:4px">
							<label style="position:relative;display:block"><span style="position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--muted);display:flex"><Icon name="search" width={15} height={15} /></span><!-- svelte-ignore a11y_autofocus --><input class="field" style="padding-left:34px" type="text" placeholder="Search senders" aria-label="Search senders" bind:value={fromQuery} autofocus /></label>
							<div role="listbox" style="max-height:200px;overflow:auto;display:flex;flex-direction:column;gap:1px">
								{#each shown as s (s.email)}
									{@const on = s.email === fromEmail}
									<button class="opt" type="button" role="option" aria-selected={on} style={on ? 'background:var(--s2)' : ''} onclick={() => { fromEmail = s.email; fromOpen = false; fromQuery = ''; }}><span style="font-weight:600">{s.name ?? s.email}</span>{#if s.name}<span class="mono" style="font-size:12px;color:var(--muted)">{s.email}</span>{/if}{#if on}<span style="margin-left:auto;color:var(--ok);display:flex"><Icon name="tick-circle" width={15} height={15} /></span>{/if}</button>
								{/each}
								{#if shown.length === 0}<div style="padding:14px 10px;font-size:13px;color:var(--muted)">No sender matches.</div>{/if}
							</div>
						</div>
					{/if}
				</div>
				{#if sendersError}<div role="alert" style="{note};background:var(--color-danger-soft);color:var(--bad)">{sendersError}</div>{/if}

				<div style="display:flex;flex-direction:column;gap:7px">
					<div style="display:flex;align-items:center"><span class="lbl" style="flex-grow:1">Recipients</span><span class="mono" style="font-size:12px;color:{tooMany ? 'var(--bad)' : 'var(--muted)'};margin-right:10px">{recipients.length} / {MAX}</span><button type="button" style="border:0;cursor:pointer;font-size:12px;font-weight:600;padding:4px 10px;border-radius:4px;background:var(--s2)" disabled={!userEmail} onclick={sendToMe}>Send to me</button></div>
					<textarea class="field mono" rows="2" style="resize:none;font-size:12.5px;line-height:1.5" placeholder="one@example.com, two@example.com" aria-label="Recipients" bind:value={recipientsText}></textarea>
				</div>
				<div style="display:flex;flex-direction:column;gap:7px"><span class="lbl">Subject</span><input class="field" type="text" aria-label="Subject" maxlength="200" bind:value={subject} /></div>
				{#if variableNames.length || optionalNames.length}
					<div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:12px">
						{#each variableNames as n (n)}
							{@const empty = (varValues[n] ?? '').trim() === ''}
							<div style="display:flex;flex-direction:column;gap:7px"><span class="lbl"><span class="mono">{n}</span> (required)</span><input class="field" type="text" aria-label={n} aria-required="true" aria-invalid={empty} placeholder={n.endsWith('url') ? 'https://' : ''} bind:value={varValues[n]} style={empty ? 'box-shadow:0 0 0 2px var(--bad)' : ''} /></div>
						{/each}
						{#each optionalNames as n (n)}
							<div style="display:flex;flex-direction:column;gap:7px"><span class="lbl"><span class="mono">{n}</span> (optional)</span><input class="field" type="text" aria-label={n} placeholder="Uses the fallback" bind:value={varValues[n]} /></div>
						{/each}
					</div>
				{/if}
				<div style="font-size:12.5px;line-height:1.5;color:var(--muted);padding:12px 14px;border-radius:12px;background:var(--s2)">Fields fill per recipient. In a Mailer broadcast, Mailer fills them from each contact.</div>
				<PlaceholderWarnings variant="dialog" />
				{#if formError}<div role="alert" style="{note};background:var(--color-danger-soft);color:var(--bad)">{formError}</div>{/if}
				{#if results.length}
					<div aria-live="polite" style="display:flex;flex-direction:column;gap:4px;padding:10px 12px;border-radius:12px;background:var(--s2);font-size:12.5px">
						<div style="color:var(--muted)">{sentCount} of {results.length} sent</div>
						{#each results as r (r.to)}
							<div style="display:flex;align-items:center;gap:8px"><span style="display:flex;color:{r.ok ? 'var(--ok)' : 'var(--bad)'}"><Icon name={r.ok ? 'tick-circle' : 'warning'} width={14} height={14} /></span><span class="mono" style="font-size:12px">{r.to}</span><span style="color:var(--muted);margin-left:auto">{r.ok ? 'Sent' : (r.error ?? 'Failed')}</span></div>
						{/each}
						{#if failed.length}<button class="btn" type="button" style="align-self:flex-start;background:var(--bg);padding:6px 11px;margin-top:4px" onclick={retryFailed}>Retry the {failed.length} that failed</button>{/if}
					</div>
				{/if}
				<div style="display:flex;align-items:center;gap:10px">
					{#if !confirming}
						<button class="btn btn-ghost" type="button" onclick={() => (confirming = true)} style="padding-left:0">Disconnect Mailer</button>
					{:else}
						<span style="font-size:12.5px;color:var(--muted)">Delete the stored key?</span>
						<button class="btn btn-ghost" type="button" disabled={mailer.busy} onclick={disconnect} style="color:var(--bad);padding:8px 6px">Yes, disconnect</button>
						<button class="btn btn-ghost" type="button" onclick={() => (confirming = false)} style="padding:8px 6px">Cancel</button>
					{/if}
					<div style="flex-grow:1"></div>
					<button class="btn btn-primary" type="button" onclick={send} aria-disabled={!canSend} style={canSend ? '' : 'opacity:.45;pointer-events:none'}><Icon name="send" width={16} height={16} />Send</button>
				</div>
			{/if}
		{/if}
	</ModalFrame>
{/if}
