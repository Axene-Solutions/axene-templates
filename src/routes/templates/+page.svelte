<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import SiteNav from '$lib/components/SiteNav.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';

	let { data } = $props();

	const user = $derived(page.data.user);

	let templates = $state(data.templates);
	let searchQuery = $state('');
	let deleteTarget = $state<{ id: string; name: string } | null>(null);
	let editingId = $state<string | null>(null);
	let editingName = $state('');

	function formatDate(iso: string) {
		const d = new Date(iso);
		return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	const filteredTemplates = $derived(
		templates.filter((t: any) =>
			t.name.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	const ownTemplates = $derived(filteredTemplates.filter((t: any) => t.isOwn));
	const communityTemplates = $derived(filteredTemplates.filter((t: any) => t.isPublic && !t.isOwn && !t.isStarter));
	const starterTemplates = $derived(filteredTemplates.filter((t: any) => t.isStarter));

	const totalCount = $derived(filteredTemplates.length);

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

	async function useStarter(starter: any) {
		const newId = starter.id + '-' + Date.now().toString(36);
		const res = await fetch('/api/templates', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				id: newId,
				name: starter.name,
				blocks: [], // blocks will be loaded from the starter in the editor
			}),
		});
		if (res.ok) {
			const saved = await res.json();
			goto(`/editor/${saved.id}`);
		}
	}

	function startEditing(id: string, name: string) {
		editingId = id;
		editingName = name;
	}

	async function finishEditing(id: string) {
		const trimmed = editingName.trim();
		if (!trimmed) {
			editingId = null;
			return;
		}
		const tpl = templates.find((t: any) => t.id === id);
		if (tpl && tpl.name !== trimmed) {
			tpl.name = trimmed;
			templates = [...templates];
			await fetch(`/api/templates/${id}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: trimmed }),
			});
		}
		editingId = null;
	}

	function handleEditKeydown(e: KeyboardEvent, id: string) {
		if (e.key === 'Enter') {
			(e.target as HTMLInputElement).blur();
		} else if (e.key === 'Escape') {
			editingId = null;
		}
	}
</script>

<svelte:head>
	<title>Templates - Axene Templates</title>
</svelte:head>

<div class="page">
	<SiteNav {user} />

	<div class="tpl-container">
	<div class="topbar">
		<div class="topbar-left">
			<h1 class="title">Templates</h1>
			<span class="count-badge">{totalCount}</span>
		</div>
		{#if user}
			<button class="btn-new" onclick={() => goto('/editor')}>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<line x1="12" y1="5" x2="12" y2="19" />
					<line x1="5" y1="12" x2="19" y2="12" />
				</svg>
				New Template
			</button>
		{:else}
			<a href="/auth/google" class="btn-signin-banner">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
					<polyline points="10 17 15 12 10 7" />
					<line x1="15" y1="12" x2="3" y2="12" />
				</svg>
				Sign in to create templates
			</a>
		{/if}
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

	{#if user && ownTemplates.length > 0}
		<section class="section">
			<h2 class="section-header">Your Templates</h2>
			<div class="grid">
				{#each ownTemplates as tpl (tpl.id)}
					<div class="card">
						<div class="card-thumb">
							<div class="wire">
								<div class="wire-hdr"></div>
								<div class="wire-bd">
									<div class="wire-ln w60"></div>
									<div class="wire-ln w40" style="opacity:0.5"></div>
									<div class="wire-sp"></div>
									<div class="wire-ls"></div>
									<div class="wire-ls"></div>
									<div class="wire-ls w70"></div>
									<div class="wire-sp"></div>
									<div class="wire-bt"></div>
								</div>
							</div>
							<span class="card-hover-pill">Open</span>
						</div>
						<div class="card-info">
							{#if editingId === tpl.id}
								<input
									class="name-input"
									type="text"
									bind:value={editingName}
									onblur={() => finishEditing(tpl.id)}
									onkeydown={(e) => handleEditKeydown(e, tpl.id)}
									autofocus
								/>
							{:else}
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									class="card-name"
									onclick={(e) => { e.stopPropagation(); startEditing(tpl.id, tpl.name); }}
									title="Click to rename"
								>{tpl.name}</div>
							{/if}
							<div class="card-meta">
								{tpl.blockCount ?? 0} blocks
								{#if tpl.updatedAt}
									<span class="dot">&#183;</span>
									{formatDate(tpl.updatedAt)}
								{/if}
								{#if tpl.isPublic}
									<span class="dot">&#183;</span>
									<span class="public-badge">Public</span>
								{/if}
							</div>
							<div class="card-actions">
								<a
									class="action-open"
									href="/editor/{tpl.id}"
									onclick={(e) => { e.preventDefault(); goto(`/editor/${tpl.id}`); }}
								>Open in Editor</a>
								<button
									class="action-delete"
									onclick={() => { deleteTarget = { id: tpl.id, name: tpl.name }; }}
									aria-label="Delete template"
								>
									<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<polyline points="3 6 5 6 21 6" />
										<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
									</svg>
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	{#if communityTemplates.length > 0}
		<section class="section">
			<h2 class="section-header">Community Templates</h2>
			<div class="grid">
				{#each communityTemplates as tpl (tpl.id)}
					<div class="card">
						<div class="card-thumb">
							<div class="wire">
								<div class="wire-hdr"></div>
								<div class="wire-bd">
									<div class="wire-ln w50"></div>
									<div class="wire-sp"></div>
									<div class="wire-ls"></div>
									<div class="wire-ls w80"></div>
									<div class="wire-sp"></div>
									<div class="wire-bt"></div>
								</div>
							</div>
							<span class="card-hover-pill">Use</span>
						</div>
						<div class="card-info">
							<div class="card-name static">{tpl.name}</div>
							<div class="card-meta">
								{tpl.blockCount ?? 0} blocks
								{#if tpl.updatedAt}
									<span class="dot">&#183;</span>
									{formatDate(tpl.updatedAt)}
								{/if}
							</div>
							<div class="card-actions">
								<a class="action-open" href="/editor/{tpl.id}">Open in Editor</a>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<section class="section">
		<h2 class="section-header">Starter Templates</h2>
		{#if starterTemplates.length > 0}
			<div class="grid">
				{#each starterTemplates as starter (starter.id)}
					<div class="card">
						<div class="card-thumb">
							<div class="wire">
								<div class="wire-hdr"></div>
								<div class="wire-bd">
									<div class="wire-ln w50"></div>
									<div class="wire-sp"></div>
									<div class="wire-ls"></div>
									<div class="wire-ls w80"></div>
									<div class="wire-sp"></div>
									<div class="wire-bt"></div>
								</div>
							</div>
							<span class="card-hover-pill">Use</span>
						</div>
						<div class="card-info">
							<div class="card-name static">{starter.name}</div>
							<div class="card-meta">
								{starter.blockCount ?? 0} blocks
							</div>
							<div class="card-actions">
								{#if user}
									<button class="btn-use" onclick={() => useStarter(starter)}>
										Use Template
									</button>
								{:else}
									<a href="/auth/google" class="btn-use">Sign in to use</a>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="no-results">No starter templates match your search.</div>
		{/if}
	</section>
	</div>

	<SiteFooter />
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
		background: #101010;
		font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	/* Container */
	.tpl-container {
		max-width: 1100px;
		margin: 0 auto;
		padding: 88px 24px 48px;
		width: 100%;
		flex: 1;
	}

	/* ---------- Top bar ---------- */

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
		font-size: 24px;
		font-weight: 700;
		color: #fff;
		margin: 0;
		line-height: 1;
	}

	.count-badge {
		font-size: 11px;
		font-weight: 600;
		color: #888;
		background: rgba(255,255,255,0.08);
		border-radius: 999px;
		padding: 2px 9px;
		line-height: 1.5;
	}

	.btn-new {
		display: flex;
		align-items: center;
		gap: 6px;
		background: #FFD100;
		color: #101010;
		border: none;
		border-radius: 8px;
		padding: 9px 18px;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
	}

	.btn-new:hover {
		background: #e6bc00;
	}

	.btn-signin-banner {
		display: flex;
		align-items: center;
		gap: 6px;
		background: rgba(255,209,0,0.1);
		color: #FFD100;
		border: 1px solid rgba(255,209,0,0.25);
		border-radius: 8px;
		padding: 9px 18px;
		font-size: 13px;
		font-weight: 600;
		text-decoration: none;
		transition: background 0.15s;
	}

	.btn-signin-banner:hover {
		background: rgba(255,209,0,0.18);
	}

	/* ---------- Search ---------- */

	.search-wrap {
		position: relative;
		margin-top: 20px;
		max-width: 400px;
	}

	.search-icon {
		position: absolute;
		left: 12px;
		top: 50%;
		transform: translateY(-50%);
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		box-sizing: border-box;
		background: rgba(255,255,255,0.05);
		border: 1px solid rgba(255,255,255,0.08);
		border-radius: 8px;
		padding: 8px 12px 8px 34px;
		font-size: 13px;
		font-family: inherit;
		color: #333;
		outline: none;
		transition: border-color 0.15s, box-shadow 0.15s;
	}

	.search-input:focus {
		border-color: #FFD100;
		box-shadow: 0 0 0 3px rgba(29, 170, 130, 0.1);
	}

	.search-input::placeholder {
		color: #bbb;
	}

	/* ---------- Sections ---------- */

	.section {
		margin-top: 32px;
	}

	.section-header {
		font-size: 13px;
		font-weight: 600;
		color: #888;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin: 0 0 14px;
	}

	/* ---------- Grid ---------- */

	.grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
	}

	/* ---------- Card ---------- */

	.card {
		border: 1px solid rgba(0,0,0,0.06);
		border-radius: 14px;
		overflow: hidden;
		background: #101010;
		transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
		box-shadow: 0 1px 3px rgba(0,0,0,0.04);
		border: 1px solid #bbbab70d;
	}

	.card:hover {
		border-color: #ffd00037;
		transform: translateY(-3px);
	}

	.card-thumb {
		height: 150px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
		overflow: hidden;
		position: relative;
	}

	/* Wireframe inside thumbnail */
	.wire {
		width: 100px;
		background: rgba(255,255,255,0.15);
		backdrop-filter: blur(6px);
		border-radius: 6px;
		border: 1px solid rgba(255,255,255,0.2);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		opacity: 0.3;
		box-shadow: 0 4px 16px rgba(0,0,0,0.1);
		transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
	}
	.card:hover .wire { transform: scale(1.06) translateY(-2px); }
	.wire-hdr { height: 9px; background: rgba(255,255,255,0.25); }
	.wire-bd { padding: 7px 9px 9px; display: flex; flex-direction: column; gap: 3px; }
	.wire-ln { height: 4px; background: rgba(255,255,255,0.55); border-radius: 2px; width: 100%; }
	.wire-ln.w60 { width: 60%; }
	.wire-ln.w50 { width: 50%; }
	.wire-ln.w40 { width: 40%; }
	.wire-ls { height: 2.5px; background: rgba(255,255,255,0.3); border-radius: 1px; width: 100%; }
	.wire-ls.w80 { width: 80%; }
	.wire-ls.w70 { width: 70%; }
	.wire-sp { height: 3px; }
	.wire-bt { height: 7px; background: rgba(255,255,255,0.5); border-radius: 4px; width: 50%; margin: 0 auto; }

	/* Hover pill badge */
	.card-hover-pill {
		position: absolute;
		bottom: 10px;
		right: 10px;
		padding: 4px 12px;
		border-radius: 100px;
		background: rgba(255,255,255,0.9);
		backdrop-filter: blur(4px);
		font-size: 11px;
		font-weight: 600;
		color: #0f172a;
		opacity: 0;
		transform: translateY(6px);
		transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
		box-shadow: 0 2px 8px rgba(0,0,0,0.1);
	}
	.card:hover .card-hover-pill { opacity: 1; transform: translateY(0); }

	.card-info {
		padding: 16px;
	}

	.card-name {
		font-size: 14px;
		font-weight: 600;
		color: #fff;
		cursor: text;
		border-radius: 4px;
		padding: 1px 2px;
		margin: -1px -2px;
		transition: background 0.15s;
	}

	.card-name:hover {
		background: rgba(255,255,255,0.03);
	}

	.card-name.static {
		cursor: default;
	}

	.card-name.static:hover {
		background: transparent;
	}

	.name-input {
		font-size: 14px;
		font-weight: 600;
		color: #fff;
		font-family: inherit;
		border: 1px solid #FFD100;
		border-radius: 4px;
		padding: 1px 4px;
		margin: -2px -5px;
		outline: none;
		width: calc(100% + 10px);
		background: #101010;
		box-shadow: 0 0 0 3px rgba(29, 170, 130, 0.1);
	}

	.card-meta {
		font-size: 12px;
		color: #666;
		margin-top: 4px;
		display: flex;
		align-items: center;
		gap: 0;
	}

	.dot {
		margin: 0 5px;
		color: #555;
	}

	.public-badge {
		font-size: 10px;
		font-weight: 600;
		color: #FFD100;
		background: rgba(255,209,0,0.1);
		padding: 1px 6px;
		border-radius: 4px;
	}

	.card-desc {
		font-size: 12px;
		color: #888;
		line-height: 1.45;
		margin-top: 4px;
	}

	.card-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 12px;
	}

	.action-open {
		font-size: 12px;
		font-weight: 500;
		color: #FFD100;
		text-decoration: none;
		cursor: pointer;
		font-family: inherit;
		transition: color 0.15s;
	}

	.action-open:hover {
		color: #158d6a;
		text-decoration: underline;
	}

	.action-delete {
		background: none;
		border: none;
		color: #555;
		cursor: pointer;
		padding: 4px;
		display: flex;
		align-items: center;
		border-radius: 6px;
		transition: color 0.15s, background 0.15s;
	}

	.action-delete:hover {
		color: #dc2626;
		background: rgba(220,38,38,0.1);
	}

	.btn-use {
		background: none;
		border: 1px solid #ffd00037;
		color: #FFD100;
		border-radius: 10px;
		padding: 8px 20px;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
		text-decoration: none;
		transition: background 0.15s, color 0.15s;
	}

	.btn-use:hover {
		background: #FFD100;
		color: #101010;
	}

	/* ---------- No results ---------- */

	.no-results {
		font-size: 13px;
		color: #666;
		padding: 24px 0;
	}

	/* ---------- Responsive ---------- */

	@media (max-width: 768px) {
		.topbar { flex-direction: column; align-items: flex-start; gap: 12px; }
		.grid { grid-template-columns: 1fr 1fr; }
		.ft-row { flex-direction: column; align-items: flex-start; }
		.ft-links { flex-wrap: wrap; gap: 12px; }
	}

	@media (max-width: 480px) {
		.grid { grid-template-columns: 1fr; }
		.tpl-container { padding: 20px 16px 36px; }
		.title { font-size: 20px; }
	}
</style>
