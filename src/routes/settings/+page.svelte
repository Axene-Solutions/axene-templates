<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { mailer } from '$lib/mailer.svelte';
	import { safeNext } from '$lib/safe-next';
	import MailerConnectCard from '$lib/components/MailerConnectCard.svelte';
	import MailerPlanCard from '$lib/components/MailerPlanCard.svelte';
	import ManageLinks from '$lib/components/ManageLinks.svelte';
	import Icon from '$lib/components/Icon.svelte';

	onMount(() => mailer.load());

	// ?next=/editor/<id> sends the user back where they came from once Mailer is linked.
	const next = $derived(safeNext(page.url.searchParams.get('next')));
	const backLabel = $derived(next?.startsWith('/editor') ? 'Back to your template' : 'Go back');
</script>

<svelte:head>
	<title>Settings - Axene Templates</title>
</svelte:head>

<div class="st">
	<header class="st-top">
		<h1 class="st-h1">Settings</h1>
		<p class="st-sub">Connect your Axene Mailer account to send, save and reuse templates.</p>
	</header>

	{#if next}
		<div class="st-back" class:st-back-ok={mailer.status === 'connected'} role="status">
			<span>{mailer.status === 'connected' ? 'Mailer is linked.' : 'Link Mailer below, then come back to where you were.'}</span>
			<a class="st-back-btn" href={next} data-sveltekit-reload>
				<Icon name="chevron-left" width={14} height={14} />
				{backLabel}
			</a>
		</div>
	{/if}

	<section class="st-card">
		<div class="st-card-head">
			<span class="st-tile"><Icon name="mail" width={20} height={20} /></span>
			<div class="st-card-meta">
				<div class="st-card-title">Axene Mailer</div>
				<div class="st-card-desc">Send from your verified domains, save templates into Mailer, use your contact fields.</div>
			</div>
			{#if mailer.status === 'connected'}
				<span class="st-pill st-pill-ok"><Icon name="check" width={12} height={12} />Connected</span>
			{:else if mailer.status === 'loading'}
				<span class="st-pill">Checking</span>
			{:else}
				<span class="st-pill st-pill-off">Not connected</span>
			{/if}
		</div>
		<div class="st-card-body"><MailerConnectCard /></div>
	</section>

	{#if mailer.status === 'connected'}
		<section class="st-card">
			<div class="st-card-head">
				<div class="st-card-meta">
					<div class="st-card-title">Mailer plan</div>
					<div class="st-card-desc">What your Mailer account allows, live from Mailer.</div>
				</div>
			</div>
			<div class="st-card-body"><MailerPlanCard /></div>
		</section>

		<section class="st-card">
			<div class="st-card-head">
				<div class="st-card-meta">
					<div class="st-card-title">Named links</div>
					<div class="st-card-desc">One URL in one place, reused in any link field.</div>
				</div>
			</div>
			<div class="st-card-body"><ManageLinks /></div>
		</section>
	{/if}
</div>

<style>
	.st { max-width: 760px; margin: 0 auto; padding: 40px 24px 64px; color: var(--color-text); font-family: var(--font-sans); overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
	.st-top { margin-bottom: 8px; }
	.st-h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.01em; }
	.st-sub { margin-top: 4px; font-size: 13.5px; color: var(--color-muted); }
	.st-card { background: var(--color-surface-2); border-radius: 14px; overflow: hidden; }
	.st-card-head { display: flex; align-items: center; gap: 12px; padding: 18px 20px 4px; }
	.st-card-meta { flex: 1; min-width: 0; }
	.st-card-title { font-size: 15px; font-weight: 600; }
	.st-card-desc { font-size: 12.5px; color: var(--color-muted); margin-top: 2px; line-height: 1.4; }
	.st-card-body { padding: 14px 20px 20px; }
	.st-tile { display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 10px; background: var(--color-accent-soft); color: var(--color-accent-ink); flex-shrink: 0; }
	.st-pill { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 99px; background: var(--color-bg); color: var(--color-muted); white-space: nowrap; }
	.st-pill-ok { color: var(--color-success); background: var(--color-success-soft); }
	.st-pill-off { color: var(--color-muted); }
	.st-back { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 12px; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--color-info); background: var(--color-info-soft); font-size: 13px; }
	.st-back-ok { border-color: var(--color-success); background: var(--color-success-soft); }
	.st-back-btn { display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 7px; background: var(--color-accent); color: var(--color-on-accent); font-weight: 600; text-decoration: none; }
	.st-back-btn:hover { background: color-mix(in srgb, var(--color-accent) 85%, var(--color-text)); }
	@media (max-width: 520px) { .st-card-head { flex-wrap: wrap; } }
</style>
