<script lang="ts">
	import { goto } from '$app/navigation';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';

	let { data } = $props();

	let templates = $state(data.templates);
	let searchQuery = $state('');
	let deleteTarget = $state<{ id: string; name: string } | null>(null);

	const filtered = $derived(
		templates.filter((t: any) =>
			t.name.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	const gradients = [
		'linear-gradient(135deg, #1daa82, #15c296)',
		'linear-gradient(135deg, #059669, #34d399)',
		'linear-gradient(135deg, #2563eb, #60a5fa)',
		'linear-gradient(135deg, #7c3aed, #a78bfa)',
	];

	function gradientFor(index: number) {
		return gradients[index % gradients.length];
	}

	function formatDate(iso: string) {
		const d = new Date(iso);
		return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	async function handleDelete() {
		if (!deleteTarget) return;
		const id = deleteTarget.id;
		try {
			await fetch(`/api/templates/${id}`, { method: 'DELETE' });
			templates = templates.filter((t: any) => t.id !== id);
		} finally {
			deleteTarget = null;
		}
	}
</script>

<svelte:head>
	<title>Templates - Axene Templates</title>
</svelte:head>

<div class="page">
	<div class="topbar">
		<div class="topbar-left">
			<h1 class="title">Templates</h1>
			<span class="count">{filtered.length}</span>
		</div>
		<button class="btn-new" onclick={() => goto('/editor')}>New Template</button>
	</div>

	<div class="search-wrap">
		<svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="11" cy="11" r="8" />
			<line x1="21" y1="21" x2="16.65" y2="16.65" />
		</svg>
		<input
			type="text"
			class="search-input"
			placeholder="Search templates..."
			bind:value={searchQuery}
		/>
	</div>

	{#if filtered.length > 0}
		<div class="grid">
			{#each filtered as tpl, i (tpl.id)}
				<div class="card" onclick={() => goto(`/editor/${tpl.id}`)} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && goto(`/editor/${tpl.id}`)}>
					<div class="card-thumb" style:background={gradientFor(i)}>
						<span class="card-thumb-name">{tpl.name}</span>
					</div>
					<div class="card-info">
						<div class="card-name">{tpl.name}</div>
						<div class="card-meta">
							{tpl.blockCount ?? 0} blocks
							{#if tpl.updatedAt}
								<span class="meta-sep">&middot;</span> {formatDate(tpl.updatedAt)}
							{/if}
						</div>
						<div class="card-actions">
							<button class="action-edit" onclick={(e) => { e.stopPropagation(); goto(`/editor/${tpl.id}`); }}>Edit</button>
							<button class="action-delete" onclick={(e) => { e.stopPropagation(); deleteTarget = { id: tpl.id, name: tpl.name }; }} aria-label="Delete template">
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<polyline points="3 6 5 6 21 6" />
									<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
								</svg>
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="empty">
			<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
				<polyline points="14 2 14 8 20 8" />
			</svg>
			<div class="empty-title">No templates yet</div>
			<div class="empty-desc">Create your first template</div>
			<button class="btn-new" onclick={() => goto('/editor')}>New Template</button>
		</div>
	{/if}
</div>

<ConfirmModal
	open={!!deleteTarget}
	title="Delete Template"
	message="Are you sure you want to delete '{deleteTarget?.name}'? This cannot be undone."
	variant="danger"
	confirmText="Delete"
	onconfirm={handleDelete}
	oncancel={() => (deleteTarget = null)}
/>

<style>
	.page {
		overflow-y: auto;
		flex: 1;
		background: #fff;
		padding: 32px;
		font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif;
	}
	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.topbar-left {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.title {
		font-size: 22px;
		font-weight: 700;
		color: #111;
		margin: 0;
	}
	.count {
		font-size: 12px;
		color: #999;
		background: #f0f0f0;
		border-radius: 999px;
		padding: 2px 8px;
	}
	.btn-new {
		background: #1daa82;
		color: #fff;
		border: none;
		border-radius: 8px;
		padding: 8px 16px;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
		transition: background 0.15s;
	}
	.btn-new:hover {
		background: #189e78;
	}
	.search-wrap {
		position: relative;
		margin-top: 16px;
		max-width: 360px;
	}
	.search-icon {
		position: absolute;
		left: 10px;
		top: 50%;
		transform: translateY(-50%);
		pointer-events: none;
	}
	.search-input {
		width: 100%;
		background: #fafafa;
		border: 1px solid #e8e8e8;
		border-radius: 8px;
		padding: 8px 12px 8px 32px;
		font-size: 13px;
		font-family: inherit;
		color: #333;
		outline: none;
		transition: border-color 0.15s;
	}
	.search-input:focus {
		border-color: #1daa82;
	}
	.search-input::placeholder {
		color: #bbb;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
		margin-top: 24px;
	}
	.card {
		border: 1px solid #ebebeb;
		border-radius: 12px;
		overflow: hidden;
		cursor: pointer;
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	.card:hover {
		border-color: #ccc;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	}
	.card-thumb {
		height: 120px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
	}
	.card-thumb-name {
		color: #fff;
		font-size: 15px;
		font-weight: 600;
		text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
		text-align: center;
	}
	.card-info {
		padding: 14px;
	}
	.card-name {
		font-size: 14px;
		font-weight: 600;
		color: #111;
	}
	.card-meta {
		font-size: 12px;
		color: #999;
		margin-top: 4px;
	}
	.meta-sep {
		margin: 0 2px;
	}
	.card-actions {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 10px;
	}
	.action-edit {
		background: none;
		border: none;
		color: #1daa82;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		padding: 0;
		font-family: inherit;
	}
	.action-edit:hover {
		text-decoration: underline;
	}
	.action-delete {
		background: none;
		border: none;
		color: #ccc;
		cursor: pointer;
		padding: 2px;
		display: flex;
		align-items: center;
		transition: color 0.15s;
	}
	.action-delete:hover {
		color: #dc2626;
	}
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 80px 24px;
		gap: 8px;
	}
	.empty-title {
		font-size: 16px;
		font-weight: 600;
		color: #666;
		margin-top: 8px;
	}
	.empty-desc {
		font-size: 13px;
		color: #999;
		margin-bottom: 16px;
	}
</style>
