<script lang="ts">
	import { onMount } from 'svelte';
	import { mailer } from '$lib/mailer.svelte';
	import MailerConnectCard from '$lib/components/MailerConnectCard.svelte';

	onMount(() => mailer.load());
</script>

<svelte:head>
	<title>Settings - Axene Templates</title>
</svelte:head>

<div class="st">
	<h1 class="st-h1">Settings</h1>
	<section>
		<h2 class="st-h2">Integrations</h2>
		<div class="st-card">
			<div class="st-card-title">Axene Mailer</div>
			<MailerConnectCard />
		</div>
	</section>
</div>

<style>
	.st { max-width: 640px; margin: 0 auto; padding: 32px 24px; color: var(--color-text); font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif; overflow-y: auto; }
	.st-h1 { font-size: 22px; font-weight: 700; margin-bottom: 24px; }
	.st-h2 { font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--color-muted); margin-bottom: 10px; }
	.st-card { background: var(--color-surface-2); border: 1px solid var(--color-border-1); border-radius: 12px; padding: 20px; }
	.st-card-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
</style>
