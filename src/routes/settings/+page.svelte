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
	<h1 class="st-h1">Settings</h1>

	{#if next}
		<div class="st-back" class:st-back-ok={mailer.status === 'connected'} role="status">
			<span>{mailer.status === 'connected' ? 'Mailer is linked.' : 'Link Mailer below, then come back to where you were.'}</span>
			<a class="st-back-btn" href={next} data-sveltekit-reload>
				<Icon name="chevron-left" width={14} height={14} />
				{backLabel}
			</a>
		</div>
	{/if}

	<section>
		<h2 class="st-h2">Integrations</h2>
		<div class="st-card">
			<div class="st-card-title">Axene Mailer</div>
			<MailerConnectCard />
		</div>
	</section>

	{#if mailer.status === 'connected'}
		<section>
			<h2 class="st-h2">Mailer plan</h2>
			<div class="st-card">
				<MailerPlanCard />
			</div>
		</section>

		<section>
			<h2 class="st-h2">Named links</h2>
			<div class="st-card">
				<ManageLinks />
			</div>
		</section>
	{/if}
</div>

<style>
	.st { max-width: 640px; margin: 0 auto; padding: 32px 24px; color: var(--color-text); font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif; overflow-y: auto; }
	.st-h1 { font-size: 22px; font-weight: 700; margin-bottom: 24px; }
	.st-h2 { font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--color-muted); margin: 24px 0 10px; }
	.st-card { background: var(--color-surface-2); border: 1px solid var(--color-border-1); border-radius: 12px; padding: 20px; }
	.st-card-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
	.st-back { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 12px; padding: 10px 12px; margin-bottom: 8px; border-radius: 10px; border: 1px solid var(--color-info); background: var(--color-info-soft); font-size: 13px; }
	.st-back-ok { border-color: var(--color-success); background: var(--color-success-soft); }
	.st-back-btn { display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 7px; background: var(--color-accent); color: #101010; font-weight: 600; text-decoration: none; }
	.st-back-btn:hover { background: color-mix(in srgb, var(--color-accent) 85%, var(--color-text)); }
</style>
