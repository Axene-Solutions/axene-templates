<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { mailer } from '$lib/mailer.svelte';
	import Icon from './Icon.svelte';
	import Logo from './Logo.svelte';
	import MailerConnectCard from './MailerConnectCard.svelte';
	import { hash } from './gallery/helpers';

	// The "From Mailer" tab of the gallery: the user's Mailer templates, openable when made in this editor.
	// Markup and states follow the Main board. `count` is what the page header shows.
	let { query = '', count = $bindable(0) }: { query?: string; count?: number } = $props();

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

	$effect(() => {
		count = mailer.status === 'connected' && loaded && !loadError ? shown.length : 0;
	});

	onMount(() => mailer.load());

	// Load the list whenever the shared connection state becomes connected (here or after connecting in the card).
	$effect(() => {
		if (mailer.status === 'connected' && !loaded && !loading && !loadError) loadList();
		if (mailer.status === 'disconnected') {
			rows = [];
			loaded = false;
			loadError = '';
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

	const HUES = ['#d49b00', '#1f8a5b', '#3d6ee0', '#c5503a', '#0ea5e9', '#6366f1', '#f59e0b', '#8e8b7e'];
	const hueOf = (id: string) => HUES[hash(id) % HUES.length];
</script>

{#if mailer.status === 'loading' || (mailer.status === 'connected' && loading && !loaded)}
	<p style="margin:0;font-size:13px;color:var(--color-muted)">Loading...</p>
{:else if mailer.status === 'unavailable'}
	<div role="alert" class="dz-panel state">
		<span style="color:var(--color-danger);display:flex"><Icon name="danger" width={28} height={28} /></span>
		<h2 class="state-title">Mailer is not available right now</h2>
		<p class="state-text">The Mailer connection is not configured or could not be reached. Try again later.</p>
	</div>
{:else if mailer.status === 'disconnected' || mailer.status === 'unreadable'}
	<div class="dz-panel" style="max-width:600px;width:100%;box-sizing:border-box;align-self:center;display:flex;flex-direction:column;gap:16px">
		<div style="display:flex;align-items:center;gap:14px">
			<span style="width:42px;height:42px;border-radius:12px;background:var(--color-bg);display:grid;place-items:center"><Icon name="email" width={21} height={21} /></span>
			<div><h2 style="margin:0;font-size:17px;font-weight:700">Connect Axene Mailer</h2><div style="font-size:13px;color:var(--color-muted);margin-top:2px">See your Mailer templates here and edit them in this editor.</div></div>
		</div>
		<MailerConnectCard compact />
	</div>
{:else if loadError}
	<div role="alert" class="dz-panel state">
		<span style="color:var(--color-danger);display:flex"><Icon name="danger" width={28} height={28} /></span>
		<h2 class="state-title">Could not load your Mailer templates</h2>
		<p class="state-text">Mailer did not answer. Check your connection and try again.</p>
		<div style="display:flex;gap:8px;margin-top:6px;align-items:center">
			<button class="dz-btn" type="button" disabled={loading} onclick={loadList}>{#if loading}<span class="dz-spinner"></span>{:else}<Icon name="refresh-arrow" width={15} height={15} />{/if}Try again</button>
			<a class="dz-btn" href="/settings">Check connection in Settings</a>
		</div>
	</div>
{:else if loaded && rows.length === 0}
	<div class="dz-panel state">
		<span style="color:var(--color-muted);display:flex"><Icon name="email" width={28} height={28} /></span>
		<h2 class="state-title">No templates in Mailer yet</h2>
		<p class="state-text">Open any template in the editor and choose Save to Mailer. It will show up here.</p>
	</div>
{:else if loaded && shown.length === 0}
	<div class="dz-panel" style="text-align:center;padding:36px 24px"><h2 style="margin:0;font-size:17px;font-weight:700">No Mailer templates match your search</h2></div>
{:else}
	<section aria-label="Mailer templates" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px">
		{#each shown as row (row.id)}
			{@const hue = hueOf(row.id)}
			<div class="card">
				<div class="thumbwrap"><div class="thumb"><div class="mock">
					<div style="height:24px;background:{hue}"></div>
					<div style="padding:11px 11px 13px;display:flex;flex-direction:column;gap:6px">
						<div style="height:7px;width:72%;background:#cfcdc1;border-radius:4px"></div>
						<div style="height:5px;width:94%;background:#e4e2d7;border-radius:4px"></div>
						<div style="height:13px;width:42%;background:{hue};border-radius:4px;margin-top:5px"></div>
					</div>
				</div></div></div>
				<div style="padding:12px 6px 6px;display:flex;flex-direction:column;gap:12px">
					<div style="min-width:0">
						<div style="font-size:14.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title={row.name}>{row.name}</div>
						<div style="font-size:12.5px;color:var(--color-muted);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{row.subject || 'No subject'}{row.updated_at && formatDate(row.updated_at) ? ', ' + formatDate(row.updated_at) : ''}</div>
						<div style="margin-top:6px">
							{#if row.isAxeneBlocks}<span class="dz-badge" style="background:var(--color-success-soft);color:var(--color-success)"><Logo size={12} class="card-logo" />Axene Templates</span>{:else}<span class="dz-badge" style="background:var(--color-surface-3);color:var(--color-muted)">Classic editor</span>{/if}
						</div>
					</div>
					<div style="display:flex;flex-direction:column;gap:6px;align-items:flex-start">
						{#if row.isAxeneBlocks}
							<button class="dz-btn dz-btn-sm" type="button" disabled={!!openingId} onclick={() => open(row)}>{openingId === row.id ? 'Opening...' : 'Open in Editor'}</button>
						{:else}
							<button class="dz-btn dz-btn-sm" type="button" disabled aria-describedby="why-{row.id}">Open in Editor</button>
							<span id="why-{row.id}" style="font-size:12px;color:var(--color-muted);line-height:1.45">Made in the classic Mailer editor, so it can only be edited there.</span>
						{/if}
						{#if openError?.id === row.id}
							<div class="dz-note dz-note-bad" role="alert" style="padding:8px 10px;font-size:12px"><Icon name="danger" width={14} height={14} /><span>{openError.message}</span></div>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</section>
{/if}

<style>
	.state { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 44px 24px; }
	.state-title { margin: 0; font-size: 17px; font-weight: 700; }
	.state-text { margin: 0; font-size: 13.5px; color: var(--color-muted); max-width: 420px; line-height: 1.5; }
	.card { display: block; border-radius: 16px; padding: 8px; transition: background 0.12s; }
	.card:hover { background: var(--color-surface-2); }
	.thumbwrap { display: block; }
	.thumb { background: var(--color-surface-2); border-radius: 12px; height: 172px; display: flex; align-items: center; justify-content: center; overflow: hidden; transition: background 0.12s; }
	.card:hover .thumb { background: var(--color-surface-3); }
	.mock { width: 58%; background: #ffffff; border-radius: 8px; box-shadow: 0 8px 22px rgba(20, 20, 10, 0.1); overflow: hidden; }
	.card :global(.card-logo) { border-radius: 4px; width: 12px; height: 12px; object-fit: fill; }
</style>
