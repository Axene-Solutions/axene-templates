<script lang="ts">
	import { goto } from '$app/navigation';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import { starterTemplates } from '$lib/defaults';

	let { data } = $props();

	let templates = $state(data.templates);
	let searchQuery = $state('');
	let deleteTarget = $state<{ id: string; name: string } | null>(null);
	let editingId = $state<string | null>(null);
	let editingName = $state('');

	const gradients = [
		'linear-gradient(135deg, #FFD100, #0d8f62)',
		'linear-gradient(135deg, #6366f1, #4f46e5)',
		'linear-gradient(135deg, #0ea5e9, #0284c7)',
		'linear-gradient(135deg, #f59e0b, #d97706)',
		'linear-gradient(135deg, #ef4444, #dc2626)',
		'linear-gradient(135deg, #8b5cf6, #7c3aed)',
	];

	function hashName(name: string): number {
		let hash = 0;
		for (let i = 0; i < name.length; i++) {
			hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
		}
		return Math.abs(hash);
	}

	function gradientFor(name: string) {
		return gradients[hashName(name) % gradients.length];
	}

	function formatDate(iso: string) {
		const d = new Date(iso);
		return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	const filteredTemplates = $derived(
		templates.filter((t: any) =>
			t.name.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	const filteredStarters = $derived(
		starterTemplates.filter((t) =>
			t.name.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	const totalCount = $derived(filteredTemplates.length + filteredStarters.length);

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

	async function useStarter(starter: typeof starterTemplates[0]) {
		const newId = starter.id + '-' + Date.now().toString(36);
		const res = await fetch('/api/templates', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				id: newId,
				name: starter.name,
				blocks: starter.blocks,
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
	<!-- Nav -->
	<nav class="tpl-nav">
		<a href="/" class="tpl-nav-brand">
			<img src="https://mail.axene.io/email-assets/logo.png" width="22" height="22" alt="Axene" style="border-radius:4px;" />
			<span>Axene Templates</span>
		</a>
		<div class="tpl-nav-links">
			<a href="/">Home</a>
			<a href="/templates" class="active">Templates</a>
			<a href="/editor">Editor</a>
		</div>
		<a href="/editor" class="tpl-nav-cta">Open Editor</a>
	</nav>

	<div class="tpl-container">
	<div class="topbar">
		<div class="topbar-left">
			<h1 class="title">Templates</h1>
			<span class="count-badge">{totalCount}</span>
		</div>
		<button class="btn-new" onclick={() => goto('/editor')}>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<line x1="12" y1="5" x2="12" y2="19" />
				<line x1="5" y1="12" x2="19" y2="12" />
			</svg>
			New Template
		</button>
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

	{#if filteredTemplates.length > 0}
		<section class="section">
			<h2 class="section-header">Your Templates</h2>
			<div class="grid">
				{#each filteredTemplates as tpl (tpl.id)}
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

	<section class="section">
		<h2 class="section-header">Starter Templates</h2>
		{#if filteredStarters.length > 0}
			<div class="grid">
				{#each filteredStarters as starter (starter.id)}
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
							<div class="card-desc">{starter.description}</div>
							<div class="card-actions">
								<button class="btn-use" onclick={() => useStarter(starter)}>
									Use Template
								</button>
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

	<!-- Footer (matching axene.io) -->
	<footer class="tpl-footer">
		<div class="ft-inner">
			<div class="ft-brand-col">
				<a href="https://axene.io" class="ft-logo-link" target="_blank" rel="noopener">
					<img src="https://mail.axene.io/email-assets/logo.png" width="24" height="24" alt="Axene" style="border-radius:4px;" />
					<span class="ft-wm">axene<span class="ft-accent">.io</span></span>
				</a>
				<p class="ft-tagline">Developer infrastructure for Africa. Build smarter, scale faster.</p>
				<div class="ft-social">
					<a href="https://github.com/Axene-Solutions" class="ft-soc" target="_blank" rel="noopener"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.17c-3.34.73-4.03-1.42-4.03-1.42-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.31-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23A11.5 11.5 0 0112 5.8c1.02.01 2.05.14 3.01.4 2.29-1.55 3.3-1.23 3.3-1.23.65 1.65.24 2.87.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.19.69.8.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg></a>
					<a href="https://www.linkedin.com/company/axeneio" class="ft-soc" target="_blank" rel="noopener"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.29zM5.34 7.43a2.06 2.06 0 11-.01-4.13 2.06 2.06 0 01.01 4.13zm1.78 13.02H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg></a>
					<a href="https://www.instagram.com/axeneio" class="ft-soc" target="_blank" rel="noopener"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85 0 3.2-.01 3.58-.07 4.85-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07-3.2 0-3.58-.01-4.85-.07-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.64-.07-4.85 0-3.2.01-3.58.07-4.85.15-3.23 1.66-4.77 4.92-4.92C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zM12 16a4 4 0 110-8 4 4 0 010 8zm6.41-11.85a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z"/></svg></a>
				</div>
			</div>
			<div class="ft-col"><h4>Get in touch</h4><ul><li><a href="mailto:support@axene.io">support@axene.io</a></li><li><a href="https://meet.axene.io" target="_blank" rel="noopener">Book a meeting</a></li><li><a href="https://github.com/Axene-Solutions" target="_blank" rel="noopener">GitHub</a></li></ul></div>
			<div class="ft-col"><h4>Product</h4><ul><li><a href="https://axene.io/docs" target="_blank" rel="noopener">Documentation</a></li><li><a href="https://axene.io/pricing" target="_blank" rel="noopener">Pricing</a></li><li><a href="https://axene.io/about" target="_blank" rel="noopener">About</a></li><li><a href="https://axene.io/contact" target="_blank" rel="noopener">Contact</a></li></ul></div>
			<div class="ft-col"><h4>Legal</h4><ul><li><a href="https://axene.io/privacy" target="_blank" rel="noopener">Privacy Policy</a></li><li><a href="https://axene.io/terms" target="_blank" rel="noopener">Terms of Service</a></li></ul></div>
		</div>
		<div class="ft-bottom">
			<p>(c) 2026 Axene Solutions. All rights reserved.</p>
			<p>Built with care in <span class="ft-accent">Nairobi, Kenya</span></p>
		</div>
	</footer>
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

	/* Nav */
	.tpl-nav {
		position: sticky;
		top: 0;
		z-index: 50;
		background: rgba(16,16,16,0.8);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid rgba(255,255,255,0.06);
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 24px;
	}
	.tpl-nav-brand {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 700;
		font-size: 15px;
		color: #fff;
		text-decoration: none;
		letter-spacing: -0.3px;
	}
	.tpl-nav-links {
		display: flex;
		gap: 28px;
		font-size: 13px;
		font-weight: 500;
	}
	.tpl-nav-links a {
		text-decoration: none;
		color: #666;
		transition: color 0.15s;
	}
	.tpl-nav-links a:hover, .tpl-nav-links a.active { color: #fff; }
	.tpl-nav-cta {
		display: inline-flex;
		align-items: center;
		padding: 7px 18px;
		font-size: 13px;
		font-weight: 600;
		color: #000;
		background: #FFD100;
		border-radius: 100px;
		text-decoration: none;
		transition: all 0.2s;
	}
	.tpl-nav-cta:hover { background: #e6bc00; }

	/* Container */
	.tpl-container {
		max-width: 1100px;
		margin: 0 auto;
		padding: 32px 24px 48px;
		width: 100%;
		flex: 1;
	}

	/* Footer */
	.tpl-footer {
		border-top: 1px solid rgba(255,255,255,0.05);
		background: #0a0a0a;
		padding: 64px 24px 40px;
	}
	.ft-inner {
		max-width: 1100px;
		margin: 0 auto;
		display: flex;
		flex-wrap: wrap;
		gap: 48px;
		justify-content: space-between;
		align-items: flex-start;
	}
	.ft-brand-col { max-width: 260px; }
	.ft-logo-link { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; text-decoration: none; }
	.ft-wm { font-size: 16px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
	.ft-accent { color: #FFD100; }
	.ft-tagline { font-size: 13px; color: #555; line-height: 1.65; margin-bottom: 18px; }
	.ft-social { display: flex; gap: 8px; }
	.ft-soc { width: 32px; height: 32px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; text-decoration: none; color: #555; transition: border-color 0.2s, color 0.2s; }
	.ft-soc:hover { border-color: #FFD100; color: #FFD100; }
	.ft-col h4 { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #555; margin-bottom: 14px; }
	.ft-col ul { list-style: none; display: flex; flex-direction: column; gap: 9px; padding: 0; margin: 0; }
	.ft-col a { font-size: 13px; color: #777; text-decoration: none; transition: color 0.2s; }
	.ft-col a:hover { color: #FFD100; }
	.ft-bottom { max-width: 1100px; margin: 40px auto 0; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; font-size: 12px; color: #444; }

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
		cursor: pointer;
		font-family: inherit;
	}

	.btn-new:hover {
		background: #e6bc00;
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
		cursor: pointer;
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
		.tpl-nav-links { display: none; }
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
