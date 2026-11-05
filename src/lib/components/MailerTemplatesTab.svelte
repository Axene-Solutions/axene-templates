<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { mailer } from '$lib/mailer.svelte';
	import Icon from './Icon.svelte';
	import MailerConnectCard from './MailerConnectCard.svelte';

	// The "From Mailer" section of the gallery: the user's Mailer templates, openable when made in this editor.
	let { query = '' }: { query?: string } = $props();

	type Row = { id: string; name: string; subject: string | null; updated_at: string | null; isAxeneBlocks: boolean };

	let rows = $state<Row[]>([]);
	let loading = $state(false);
	let loadError = $state('');
	let loaded = $state(false);
	let openingId = $state<string | null>(null);
	let openError = $state<{ id: string; message: string } | null>(null);

	const shown = $derived(
		rows.filter((r) => {
			const q = query.trim().toLowerCase();
			return !q || r.name.toLowerCase().includes(q) || (r.subject ?? '').toLowerCase().includes(q);
		})
	);

	onMount(() => mailer.load());

	// Load the list whenever the shared connection state becomes connected (here or after connecting in the card).
	$effect(() => {
		if (mailer.status === 'connected' && !loaded && !loading) loadList();
		if (mailer.status === 'disconnected') {
			rows = [];
			loaded = false;
		}
	});

	async function loadList() {
		loading = true;
		loadError = '';
		try {
			const res = await fetch('/api/mailer/templates');
			const data = await res.json().catch(() => ({}));
			if (res.ok) {
				rows = data.templates ?? [];
				loaded = true;
			} else if (res.status === 409) {
				await mailer.load();
			} else {
				loadError = data.error ?? `Could not load your Mailer templates (error ${res.status}).`;
			}
		} catch {
			loadError = 'Could not load your Mailer templates. Check your connection.';
		} finally {
			loading = false;
		}
	}

	async function open(row: Row) {
		if (openingId) return;
		openingId = row.id;
		openError = null;
		try {
			const res = await fetch(`/api/mailer/templates/${encodeURIComponent(row.id)}/open`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: '{}',
			});
			const data = await res.json().catch(() => ({}));
			if (res.ok && data.id) {
				await goto(`/editor/${data.id}`);
				return;
			}
			if (res.status === 409) await mailer.load();
			else openError = { id: row.id, message: data.error ?? `Could not open this template (error ${res.status}).` };
		} catch {
			openError = { id: row.id, message: 'Could not open this template. Check your connection.' };
		} finally {
			openingId = null;
		}
	}

	function formatDate(iso: string | null) {
		if (!iso) return '';
		const d = new Date(iso);
		return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	}
</script>

<div class="mtl">
	{#if mailer.status === 'loading' || (mailer.status === 'connected' && loading && !loaded)}
		<p class="mtl-muted mtl-pad">Loading...</p>
	{:else if mailer.status === 'unavailable'}
		<div class="mtl-state" role="alert">
			<span class="mtl-state-icon"><Icon name="warning" width={28} height={28} /></span>
			<h2 class="mtl-title">Mailer is not available right now</h2>
			<p class="mtl-text">The Mailer connection is not configured or could not be reached. Try again later.</p>
		</div>
	{:else if mailer.status === 'disconnected' || mailer.status === 'unreadable'}
		<div class="mtl-state">
			<span class="mtl-state-icon"><Icon name="mail" width={28} height={28} /></span>
			<h2 class="mtl-title">Connect Axene Mailer</h2>
			<p class="mtl-text">Connect your Mailer account to see the templates you have there and edit them in this editor.</p>
			<div class="mtl-connect"><MailerConnectCard compact /></div>
		</div>
	{:else if loadError}
		<div class="mtl-state" role="alert">
			<span class="mtl-state-icon"><Icon name="warning" width={28} height={28} /></span>
			<h2 class="mtl-title">Could not load your Mailer templates</h2>
			<p class="mtl-text">{loadError}</p>
			<div class="mtl-row">
				<button class="mtl-btn mtl-btn-primary" onclick={loadList} disabled={loading}>
					<Icon name="refresh" width={14} height={14} />
					{loading ? 'Retrying...' : 'Try again'}
				</button>
				<a class="mtl-link" href="/settings">Check connection in Settings</a>
			</div>
		</div>
	{:else if loaded && rows.length === 0}
		<div class="mtl-state">
			<span class="mtl-state-icon"><Icon name="mail" width={28} height={28} /></span>
			<h2 class="mtl-title">No templates in Mailer yet</h2>
			<p class="mtl-text">Open any template in the editor and choose Save to Mailer. It will show up here.</p>
		</div>
	{:else if loaded && shown.length === 0}
		<div class="mtl-state">
			<h2 class="mtl-title">No Mailer templates match your search</h2>
		</div>
	{:else}
		<div class="mtl-grid">
			{#each shown as row (row.id)}
				<div class="mtl-card">
					<div class="mtl-name">{row.name}</div>
					<div class="mtl-meta">
						{row.subject ? row.subject : 'No subject'}
						{#if row.updated_at}<span class="mtl-dot">&#183;</span>{formatDate(row.updated_at)}{/if}
					</div>
					<div class="mtl-actions">
						{#if row.isAxeneBlocks}
							<button class="mtl-btn mtl-btn-primary" onclick={() => open(row)} disabled={!!openingId}>
								{openingId === row.id ? 'Opening...' : 'Open in Editor'}
							</button>
						{:else}
							<button class="mtl-btn" disabled aria-describedby="mtl-why-{row.id}">Open in Editor</button>
							<span class="mtl-why" id="mtl-why-{row.id}">Made in the classic Mailer editor, so it can only be edited there.</span>
						{/if}
					</div>
					{#if openError?.id === row.id}
						<div class="mtl-err" role="alert"><Icon name="warning" width={14} height={14} /><span>{openError.message}</span></div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.mtl { margin-top: 24px; color: var(--color-text); }
	.mtl-pad { padding: 24px 0; }
	.mtl-muted { color: var(--color-muted); font-size: 13px; }
	.mtl-state {
		padding: 40px 24px; border: 1px solid var(--color-border-1); border-radius: 14px; background: var(--color-surface-2);
		text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px;
	}
	.mtl-state-icon { color: var(--color-accent-ink); display: flex; }
	.mtl-title { font-size: 16px; font-weight: 600; margin: 0; }
	.mtl-text { font-size: 13px; color: var(--color-muted); margin: 0; max-width: 420px; line-height: 1.5; }
	.mtl-connect { width: 100%; max-width: 440px; text-align: left; margin-top: 8px; }
	.mtl-row { display: flex; align-items: center; gap: 14px; margin-top: 6px; }
	.mtl-link { color: var(--color-accent-ink); font-size: 13px; }
	.mtl-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
	.mtl-card {
		border: 1px solid var(--color-border-1); border-radius: 14px; background: var(--color-surface);
		padding: 16px; display: flex; flex-direction: column; gap: 6px;
	}
	.mtl-name { font-size: 14px; font-weight: 600; overflow-wrap: anywhere; }
	.mtl-meta { font-size: 12px; color: var(--color-muted); overflow-wrap: anywhere; }
	.mtl-dot { margin: 0 5px; color: var(--color-muted-soft); }
	.mtl-actions { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; margin-top: 8px; }
	.mtl-why { font-size: 11.5px; color: var(--color-muted); line-height: 1.4; }
	.mtl-btn {
		display: inline-flex; align-items: center; gap: 6px; background: transparent; color: var(--color-text);
		border: 1px solid var(--color-border-1); border-radius: 8px; padding: 7px 14px; font: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer;
	}
	.mtl-btn-primary { background: var(--color-accent); color: #101010; border-color: var(--color-accent); }
	.mtl-btn-primary:hover:not(:disabled) { background: color-mix(in srgb, var(--color-accent) 85%, var(--color-text)); }
	.mtl-btn:disabled { opacity: 0.5; cursor: not-allowed; }
	.mtl-err {
		display: flex; gap: 6px; align-items: flex-start; margin-top: 6px; padding: 8px 10px; border-radius: 7px; font-size: 12px; line-height: 1.4;
		border: 1px solid var(--color-danger); background: var(--color-danger-soft); color: var(--color-danger);
	}
	@media (max-width: 1000px) { .mtl-grid { grid-template-columns: 1fr 1fr; } }
	@media (max-width: 640px) { .mtl-grid { grid-template-columns: 1fr; } }
</style>
