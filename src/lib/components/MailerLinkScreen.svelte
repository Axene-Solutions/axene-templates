<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { mailer } from '$lib/mailer.svelte';
	import { isValidMailerId } from '$lib/mailer-templates';
	import Icon from './Icon.svelte';
	import MailerConnectCard from './MailerConnectCard.svelte';

	// Handles /editor?mailer=new and /editor?mailer=<mailerId>: makes sure Mailer is connected, then
	// either hands over to a fresh editor ("new") or opens the Templates copy of a Mailer template.
	let { target, oncontinue }: { target: string; oncontinue: () => void } = $props();

	type Phase = 'checking' | 'connect' | 'opening' | 'error';
	let phase = $state<Phase>('checking');
	let message = $state('');
	let backUrl = $state('');
	let showCard = $state(false);
	let started = false;

	const isNew = $derived(target === 'new');

	onMount(async () => {
		await mailer.load();
		run();
	});

	// After connecting in the card, carry on automatically.
	$effect(() => {
		if (mailer.status === 'connected' && phase === 'connect') run();
	});

	function run() {
		if (mailer.status === 'unavailable') {
			phase = 'error';
			message = 'Mailer is not available right now. Try again later.';
			return;
		}
		if (mailer.status !== 'connected') {
			phase = 'connect';
			return;
		}
		if (isNew) {
			oncontinue();
			return;
		}
		if (!isValidMailerId(target)) {
			phase = 'error';
			message = 'This link does not point to a valid Mailer template.';
			return;
		}
		openTemplate();
	}

	async function openTemplate() {
		if (started && phase === 'opening') return;
		started = true;
		phase = 'opening';
		message = '';
		backUrl = '';
		showCard = false;
		try {
			const res = await fetch(`/api/mailer/templates/${encodeURIComponent(target)}/open`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: '{}',
			});
			const data = await res.json().catch(() => ({}));
			if (res.ok && data.id) {
				await goto(`/editor/${data.id}`, { replaceState: true });
				return;
			}
			if (res.status === 409) {
				await mailer.load();
				phase = 'connect';
				return;
			}
			phase = 'error';
			message = data.error ?? `The template could not be opened (error ${res.status}).`;
			backUrl = typeof data.openUrl === 'string' ? data.openUrl : '';
			showCard = res.status === 401 || res.status === 403;
		} catch {
			phase = 'error';
			message = 'The template could not be opened. Check your connection.';
		}
	}
</script>

<div class="ml">
	<div class="ml-card">
		{#if phase === 'checking' || phase === 'opening'}
			<h2 class="ml-title">{phase === 'opening' ? 'Opening your Mailer template' : 'Checking your Mailer connection'}</h2>
			<p class="ml-text" role="status">Loading...</p>
		{:else if phase === 'connect'}
			<span class="ml-icon"><Icon name="mail" width={32} height={32} /></span>
			<h2 class="ml-title">Connect Axene Mailer to continue</h2>
			<p class="ml-text">
				{isNew
					? 'Connect your Mailer account so you can save what you design straight into Mailer.'
					: 'Connect your Mailer account so this template can be opened for editing here.'}
			</p>
			<div class="ml-connect"><MailerConnectCard /></div>
			{#if isNew}
				<button class="ml-link" onclick={oncontinue}>Skip and start editing without Mailer</button>
			{/if}
		{:else}
			<span class="ml-icon"><Icon name="warning" width={32} height={32} /></span>
			<h2 class="ml-title">Could not open this template</h2>
			<p class="ml-text" role="alert">{message}</p>
			{#if showCard}<div class="ml-connect"><MailerConnectCard /></div>{/if}
			<div class="ml-actions">
				{#if backUrl}
					<a class="ml-btn" href={backUrl}>Back to Mailer</a>
				{/if}
				<a class="ml-link" href="/templates">Back to templates</a>
			</div>
		{/if}
	</div>
</div>

<style>
	.ml { flex: 1; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 32px; background: var(--color-surface); }
	.ml-card { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; max-width: 480px; width: 100%; }
	.ml-icon { color: var(--color-accent-ink); display: flex; }
	.ml-title { font-size: 20px; font-weight: 700; color: var(--color-text); margin: 0; }
	.ml-text { font-size: 14px; color: var(--color-muted); margin: 0; line-height: 1.6; }
	.ml-connect {
		width: 100%; text-align: left; margin-top: 8px; padding: 20px;
		background: var(--color-surface-2); border: 1px solid var(--color-border-1); border-radius: 12px;
	}
	.ml-actions { display: flex; align-items: center; gap: 14px; margin-top: 14px; }
	.ml-btn {
		display: inline-flex; padding: 10px 22px; background: var(--color-accent); color: #101010;
		font-size: 14px; font-weight: 600; border-radius: 100px; text-decoration: none;
	}
	.ml-btn:hover { background: color-mix(in srgb, var(--color-accent) 85%, var(--color-text)); }
	.ml-link { background: none; border: none; font: inherit; font-size: 14px; color: var(--color-muted); text-decoration: none; cursor: pointer; margin-top: 8px; }
	.ml-link:hover { color: var(--color-accent-ink); }
</style>
