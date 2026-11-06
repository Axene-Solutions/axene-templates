<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { mailer } from '$lib/mailer.svelte';
	import { mailerData } from '$lib/mailer-data.svelte';
	import { safeNext } from '$lib/safe-next';
	import MailerConnectCard from '$lib/components/MailerConnectCard.svelte';
	import MailerPlanCard from '$lib/components/MailerPlanCard.svelte';
	import ManageLinks from '$lib/components/ManageLinks.svelte';
	import Icon from '$lib/components/Icon.svelte';

	onMount(() => mailer.load());

	// ?next=/editor/<id> sends the user back where they came from once Mailer is linked.
	const next = $derived(safeNext(page.url.searchParams.get('next')));
	const backLabel = $derived(next?.startsWith('/editor') ? 'Back to your template' : 'Go back');

	const connected = $derived(mailer.status === 'connected');
	// Mailer said the key is dead: from the connection check or from the plan or links requests.
	const revoked = $derived(connected && (mailer.check?.kind === 'revoked' || mailerData.planState === 'key_broken' || mailerData.linksState === 'key_broken'));
	const needsAttention = $derived(mailer.status === 'unreadable' || mailer.status === 'unavailable');
	const pillLabel = $derived(connected ? 'Connected' : mailer.status === 'loading' ? 'Checking' : needsAttention ? 'Needs attention' : 'Not connected');

	const perks = [
		{ title: 'Send from your domain', body: 'Test or send a template from any verified sender, to up to 25 people at once.' },
		{ title: 'Save to Mailer', body: 'One click puts the template in your Mailer account, ready for broadcasts.' },
		{ title: 'Your contact fields', body: 'Insert names, emails and custom fields with fallbacks, filled per recipient.' },
		{ title: 'Named links', body: 'Change a URL once and every template that uses it updates.' },
	];
</script>

<svelte:head>
	<title>Settings - Axene Templates</title>
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" />
</svelte:head>

<div class="st dz-set">
	<main class="st-main">
		<header>
			<h1 style="margin:0;font-size:28px;font-weight:700;letter-spacing:-.02em">Settings</h1>
			<p style="margin:6px 0 0;font-size:14px;color:var(--color-muted)">Connect your Axene Mailer account to send, save and reuse templates.</p>
		</header>

		{#if next}
			<div role="status" style="display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;padding:12px 16px;border-radius:12px;{connected ? 'background:var(--color-success-soft);color:var(--color-success)' : 'background:var(--color-surface-2)'}">
				<span style="flex-grow:1;font-size:13.5px">{connected ? 'Mailer is linked.' : 'Link Mailer below, then come back to where you were.'}</span>
				<a class="dz-btn dz-btn-sm" href={next} data-sveltekit-reload style="background:var(--color-bg)"><Icon name="arrow-left42" width={14} height={14} />{backLabel}</a>
			</div>
		{/if}

		<!-- Mailer -->
		<section class="st-card" style="gap:18px">
			<div style="display:flex;align-items:center;gap:14px">
				<span style="width:42px;height:42px;border-radius:12px;background:var(--color-bg);display:grid;place-items:center;color:var(--color-text)"><Icon name="email" width={21} height={21} /></span>
				<div style="flex-grow:1"><div style="font-size:16px;font-weight:700">Axene Mailer</div><div style="font-size:13px;color:var(--color-muted);margin-top:2px">Send from your verified domains, save templates into Mailer, use your contact fields.</div></div>
				<span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;padding:4px 10px;border-radius:4px;white-space:nowrap;flex-shrink:0;{connected ? 'background:var(--color-success-soft);color:var(--color-success)' : 'background:var(--color-bg);color:var(--color-muted)'}">{#if connected}<Icon name="done" width={12} height={12} />{/if}{pillLabel}</span>
			</div>
			<MailerConnectCard autoCheck />
		</section>

		<!-- Plan -->
		{#if connected && !revoked}
			<section class="st-card" style="gap:16px"><MailerPlanCard /></section>
		{/if}

		<!-- Named links -->
		{#if connected}
			<section class="st-card" style="gap:14px"><ManageLinks /></section>
		{/if}

		{#if !connected}
			<section class="st-card" style="gap:14px">
				<div style="font-size:16px;font-weight:700">What linking unlocks</div>
				<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">
					{#each perks as p (p.title)}
						<div style="padding:14px 16px;border-radius:12px;background:var(--color-bg);display:flex;flex-direction:column;gap:5px"><div style="font-size:14px;font-weight:700">{p.title}</div><div style="font-size:13px;line-height:1.5;color:var(--color-muted)">{p.body}</div></div>
					{/each}
				</div>
			</section>
		{/if}
	</main>
</div>

<style>
	.st { flex: 1; min-width: 0; color: var(--color-text); font-family: var(--font-sans); background: var(--color-bg); }
	.st-main { padding: 36px 56px 64px; display: flex; flex-direction: column; gap: 18px; max-width: 820px; min-height: 860px; box-sizing: border-box; }
	.st-card { background: var(--color-surface-2); border-radius: 16px; padding: 22px 24px; display: flex; flex-direction: column; }
	@media (max-width: 640px) { .st-main { padding: 24px 16px 48px; } }
</style>
