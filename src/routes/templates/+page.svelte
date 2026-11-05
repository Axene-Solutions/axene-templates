<script lang="ts">
    import { goto, invalidate } from '$app/navigation';
    import { page } from '$app/state';
    import ConfirmModal from '$lib/components/ConfirmModal.svelte';
    import SiteNav from '$lib/components/SiteNav.svelte';
    import SiteFooter from '$lib/components/SiteFooter.svelte';
    import Icon from '$lib/components/Icon.svelte';

    let { data } = $props();

    // Templates fetched from the server; kept in local state so deletes update the list
    let templates = $state<any[]>([]);
    $effect.pre(() => {
        templates = data.templates;
    });
    const loadError = $derived<string | null>(data.loadError);
    let retrying = $state(false);
    let notice = $state<string | null>(null);
    let noticeTimer: ReturnType<typeof setTimeout> | undefined;
    let busyStarterId = $state<string | null>(null);
    let renamingId = $state<string | null>(null);
    let renameValue = $state('');
    let renameBusy = false;

    function showNotice(message: string) {
        notice = message;
        clearTimeout(noticeTimer);
        noticeTimer = setTimeout(() => (notice = null), 4000);
    }

    async function retryLoad() {
        retrying = true;
        try {
            await invalidate('app:templates');
        } finally {
            retrying = false;
        }
    }
    const user = $derived(page.data.user);

    // Dynamically extract unique categories from templates using a Set
    let categories = $derived(() => {
        const uniqueIds: string[] = Array.from(new Set(templates.map((t: any) => String(t.category || 'general'))));
        
        // Optional mapping for pretty labels. 
        // If a category is saved as "invoice", UI outputs "Invoice", etc.
        const idToLabel = (id: string) => {
            const labels: Record<string, string> = {
                // Phase 1
                'general': 'General',
                'otp': 'OTP / Passcodes',
                'invoice': 'Invoices & Receipts',
                'marketing': 'Marketing',
                'welcome': 'Welcome Email',
                // Phase 2 - Authentication
                'password-reset': 'Password Reset',
                'email-verify': 'Email Verification',
                'magic-link': 'Magic Login Links',
                // Phase 2 - Transactional
                'receipt': 'Receipts',
                'order-confirm': 'Order Confirmations',
                'payment-status': 'Payment Success/Failure',
                // Phase 2 - Notifications
                'alert': 'Alerts',
                'reminder': 'Reminders',
                'activity': 'Activity Updates',
                // Phase 2 - Marketing
                'newsletter': 'Newsletters',
                'product-announcement': 'Product Announcements',
                'promo': 'Promotions',
                // Phase 2 - Lifecycle
                'onboarding': 'Onboarding Sequences',
                're-engage': 'Re-engagement Emails'
            };
            
            return labels[id] || (id.charAt(0).toUpperCase() + id.slice(1));
        };

        const mapped = uniqueIds.map(id => ({
            id,
            label: idToLabel(id as string)
        }));
        
        // Always keep 'all' at the beginning
        return [{ id: 'all', label: 'All Templates' }, ...mapped];
    });

    let activeCategoryFilter = $state('all');
    let searchQuery = $state('');
    
    let deleteTarget = $state<{ id: string; name: string } | null>(null);

    function formatDate(iso: string) {
        const d = new Date(iso);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    // 🏆 Combined Filter Logic
    const filteredTemplates = $derived(
        templates.filter((t: any) => {
            const activeCat = t.category || 'general';
            const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategoryFilter === 'all' || activeCat === activeCategoryFilter;
            return matchesSearch && matchesCategory;
        })
    );

    // Categories inherit derived filtering
    const ownTemplates = $derived(filteredTemplates.filter((t: any) => t.isOwn));
    const communityTemplates = $derived(filteredTemplates.filter((t: any) => t.isPublic && !t.isOwn && !t.isStarter));
    const starterTemplates = $derived(filteredTemplates.filter((t: any) => t.isStarter));

    const totalCount = $derived(filteredTemplates.length);

    async function handleDelete() {
        if (!deleteTarget) return;
        const { id, name } = deleteTarget;
        try {
            const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
            if (res.ok) {
                templates = templates.filter((t: any) => t.id !== id);
            } else {
                showNotice(`Could not delete "${name}" (error ${res.status}).`);
            }
        } catch {
            showNotice(`Could not delete "${name}". Check your connection.`);
        } finally {
            deleteTarget = null;
        }
    }

    function startRename(tpl: { id: string; name: string }) {
        renamingId = tpl.id;
        renameValue = tpl.name;
    }

    function cancelRename() {
        renamingId = null;
    }

    function focusSelect(node: HTMLInputElement) {
        node.focus();
        node.select();
    }

    async function commitRename(tpl: { id: string; name: string }) {
        if (renamingId !== tpl.id || renameBusy) return;
        const name = renameValue.trim();
        if (name === tpl.name) {
            renamingId = null;
            return;
        }
        if (name === '') {
            showNotice('A template name cannot be empty.');
            renamingId = null;
            return;
        }
        renameBusy = true;
        try {
            const res = await fetch(`/api/templates/${tpl.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            if (res.ok) {
                const saved = await res.json();
                templates = templates.map((x: any) => (x.id === tpl.id ? { ...x, name: saved.name } : x));
            } else {
                let reason = `error ${res.status}`;
                try {
                    const err = await res.json();
                    if (err?.error) reason = err.error;
                } catch {
                    /* keep the status based reason */
                }
                showNotice(`Could not rename "${tpl.name}" (${reason}).`);
            }
        } catch {
            showNotice(`Could not rename "${tpl.name}". Check your connection.`);
        } finally {
            renameBusy = false;
            renamingId = null;
        }
    }

    async function useStarter(starter: any) {
        if (busyStarterId) return;
        busyStarterId = starter.id;
        try {
            const fullRes = await fetch(`/api/templates/${starter.id}`);
            if (!fullRes.ok) throw new Error(String(fullRes.status));
            const full = await fullRes.json();

            const newId = starter.id + '-' + Date.now().toString(36);
            const res = await fetch('/api/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: newId,
                    name: starter.name,
                    category: full.category || starter.category,
                    blocks: full.blocks,
                }),
            });
            if (!res.ok) throw new Error(String(res.status));
            const saved = await res.json();
            await goto(`/editor/${saved.id}`);
        } catch {
            showNotice(`Could not create a template from "${starter.name}". Please try again.`);
        } finally {
            busyStarterId = null;
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
            {#if !loadError}<span class="count-badge">{totalCount}</span>{/if}
        </div>
        {#if user}
            <button class="btn-new" onclick={() => goto('/editor')}>
                <Icon name="plus" width={16} height={16} />
                New Template
            </button>
        {:else}
            <a href="/auth/google" class="btn-signin-banner">
                <Icon name="user" width={16} height={16} />
                Sign in to create templates
            </a>
        {/if}
    </div>

    <div class="search-wrap">
        <span class="search-icon"><Icon name="search" width={16} height={16} /></span>
        <input
            type="text"
            class="search-input"
            placeholder="Search templates..."
            bind:value={searchQuery}
        />
    </div>

    {#if loadError}
        <div class="state-card" role="alert">
            <span class="state-icon"><Icon name="warning" width={28} height={28} /></span>
            <h2 class="state-title">Could not load templates</h2>
            <p class="state-text">{loadError}</p>
            <button class="btn-retry" onclick={retryLoad} disabled={retrying}>
                <Icon name="refresh" width={16} height={16} class={retrying ? 'spin' : ''} />
                {retrying ? 'Retrying...' : 'Try again'}
            </button>
        </div>
    {:else}
    <!-- Beautiful Filter UI -->
    <div class="filter-tabs">
        {#each categories() as cat}
            <button
                class="filter-tab"
                class:active={activeCategoryFilter === cat.id}
                onclick={() => activeCategoryFilter = cat.id}
            >
                {cat.label}
            </button>
        {/each}
    </div>

    {#if user && ownTemplates.length > 0}
        <section class="section">
            <h2 class="section-header">Your Templates</h2>
            <div class="grid">
                {#each ownTemplates as tpl (tpl.id)}
                    <div class="card">
                        <a class="card-thumb" href="/editor/{tpl.id}" aria-label="Open {tpl.name} in the editor" tabindex="-1">
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
                        </a>
                        <div class="card-info">
                            {#if renamingId === tpl.id}
                                <input
                                    class="card-name-input"
                                    aria-label="Template name"
                                    maxlength="120"
                                    bind:value={renameValue}
                                    use:focusSelect
                                    onblur={() => commitRename(tpl)}
                                    onkeydown={(e) => {
                                        if (e.key === 'Enter') commitRename(tpl);
                                        if (e.key === 'Escape') cancelRename();
                                    }}
                                />
                            {:else}
                                <div class="card-name static">{tpl.name}</div>
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
                                <a class="action-open" href="/editor/{tpl.id}">Open in Editor</a>
                                <button class="action-rename" onclick={() => startRename(tpl)} aria-label="Rename template" title="Rename">
                                    <Icon name="pencil" width={16} height={16} />
                                </button>
                                <button class="action-delete" onclick={() => { deleteTarget = { id: tpl.id, name: tpl.name }; }} aria-label="Delete template">
                                    <Icon name="trash" width={16} height={16} />
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
                        <a class="card-thumb" href="/editor/{tpl.id}" aria-label="Open {tpl.name} in the editor" tabindex="-1">
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
                            <span class="card-hover-pill">Open</span>
                        </a>
                        <div class="card-info">
                            <div class="card-name static">{tpl.name}</div>
                            <div class="card-meta">
                                {tpl.blockCount ?? 0} blocks
                                {#if tpl.updatedAt}
                                    <span class="dot">&#183;</span>
                                    {formatDate(tpl.updatedAt)}
                                {/if}
                            </div>
                            <div class="card-actions"><a class="action-open" href="/editor/{tpl.id}">Open in Editor</a></div>
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
                            <div class="card-meta">{starter.blockCount ?? 0} blocks</div>
                            <div class="card-actions">
                                {#if user}
                                    <button class="btn-use" onclick={() => useStarter(starter)} disabled={busyStarterId !== null}>
                                        {busyStarterId === starter.id ? 'Creating...' : 'Use Template'}
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
            <div class="no-results">
                {templates.length === 0 ? 'No starter templates are available yet.' : 'No starter templates match your filters.'}
            </div>
        {/if}
    </section>

    {#if totalCount === 0 && templates.length > 0}
        <div class="state-card">
            <p class="state-text">Nothing matches your search or filter.</p>
            <button class="btn-retry" onclick={() => { searchQuery = ''; activeCategoryFilter = 'all'; }}>Clear filters</button>
        </div>
    {/if}
    {/if}
    </div>

    <SiteFooter />
</div>

{#if notice}
    <div class="toast" role="status">{notice}</div>
{/if}

<ConfirmModal open={!!deleteTarget} title="Delete Template" message="Are you sure you want to delete '{deleteTarget?.name}'? This cannot be undone." variant="danger" confirmText="Delete" onconfirm={handleDelete} oncancel={() => (deleteTarget = null)} />

<style>
    .page {
        overflow-y: auto; flex: 1; background: var(--color-surface); font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif;
        min-height: 100vh; display: flex; flex-direction: column;
    }
    .tpl-container { max-width: 1100px; margin: 0 auto; padding: 88px 24px 48px; width: 100%; flex: 1; }
    .topbar { display: flex; align-items: center; justify-content: space-between; }
    .topbar-left { display: flex; align-items: center; gap: 10px; }
    .title { font-size: 24px; font-weight: 700; color: var(--color-text); margin: 0; line-height: 1; }
    .count-badge { font-size: 11px; font-weight: 600; color: var(--color-muted); background: var(--color-surface-2); border-radius: 999px; padding: 2px 9px; line-height: 1.5; }
    .btn-new { display: flex; align-items: center; gap: 6px; background: var(--color-accent); color: #101010; border: none; border-radius: 8px; padding: 9px 18px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
    .btn-new:hover { background: color-mix(in srgb, var(--color-accent) 85%, var(--color-text)); }
    .btn-signin-banner { display: flex; align-items: center; gap: 6px; background: var(--color-accent-soft); color: var(--color-accent-ink); border: 1px solid var(--color-accent); border-radius: 8px; padding: 9px 18px; font-size: 13px; font-weight: 600; text-decoration: none; transition: background 0.15s; }
    .btn-signin-banner:hover { background: var(--color-accent-soft); }
    
    .search-wrap { position: relative; margin-top: 20px; max-width: 400px; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--color-muted); display: flex; }
    .search-input { width: 100%; box-sizing: border-box; background: var(--color-surface-2); border: 1px solid var(--color-border-1); border-radius: 8px; padding: 8px 12px 8px 34px; font-size: 13px; font-family: inherit; color: var(--color-text); outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
    .search-input:focus { border-color: var(--color-accent); box-shadow: 0 0 0 3px var(--color-accent-soft); }
    .search-input::placeholder { color: var(--color-muted); }

    /* ---------- Filters ---------- */
    .filter-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin: 24px 0 16px;
    }
    .filter-tab {
        background: var(--color-surface-2);
        border: 1px solid var(--color-border-1);
        border-radius: 20px;
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 500;
        color: var(--color-muted);
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;
        letter-spacing: 0.01em;
    }
    .filter-tab:hover {
        background: var(--color-surface-2);
        color: var(--color-text);
        border-color: var(--color-border-1);
    }
    .filter-tab.active {
        background: var(--color-accent);
        color: #101010;
        border-color: var(--color-accent);
        font-weight: 600;
        box-shadow: 0 0 12px var(--color-accent-soft);
    }

    .section { margin-top: 32px; }
    .section-header { font-size: 13px; font-weight: 600; color: var(--color-muted); text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 14px; }
    
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .card { border: 1px solid var(--color-border-1); border-radius: 14px; overflow: hidden; background: var(--color-surface); transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1); box-shadow: 0 1px 3px color-mix(in srgb, var(--color-text) 4%, transparent); }
    .card:hover { border-color: var(--color-accent); transform: translateY(-3px); }
    .card-thumb { text-decoration: none; height: 150px; display: flex; align-items: center; justify-content: center; padding: 16px; overflow: hidden; position: relative; }
    
    .wire { width: 100px; background: var(--color-surface-2); backdrop-filter: blur(6px); border-radius: 6px; border: 1px solid var(--color-border-1); overflow: hidden; display: flex; flex-direction: column; opacity: 0.7; box-shadow: 0 4px 16px color-mix(in srgb, var(--color-text) 10%, transparent); transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1); }
    .card:hover .wire { transform: scale(1.06) translateY(-2px); }
    .wire-hdr { height: 9px; background: var(--color-accent); }
    .wire-bd { padding: 7px 9px 9px; display: flex; flex-direction: column; gap: 3px; }
    .wire-ln { height: 4px; background: var(--color-muted-soft); border-radius: 2px; width: 100%; }
    .wire-ln.w60 { width: 60%; } .wire-ln.w50 { width: 50%; } .wire-ln.w40 { width: 40%; }
    .wire-ls { height: 2.5px; background: var(--color-muted-soft); border-radius: 1px; width: 100%; }
    .wire-ls.w80 { width: 80%; } .wire-ls.w70 { width: 70%; }
    .wire-sp { height: 3px; }
    .wire-bt { height: 7px; background: var(--color-accent); border-radius: 4px; width: 50%; margin: 0 auto; }
    
    .card-hover-pill { position: absolute; bottom: 10px; right: 10px; padding: 4px 12px; border-radius: 100px; background: var(--color-surface-2); backdrop-filter: blur(4px); font-size: 11px; font-weight: 600; color: var(--color-text); opacity: 0; transform: translateY(6px); transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1); box-shadow: 0 2px 8px color-mix(in srgb, var(--color-text) 10%, transparent); }
    .card:hover .card-hover-pill { opacity: 1; transform: translateY(0); }
    .card-info { padding: 16px; }
    .card-name { font-size: 14px; font-weight: 600; color: var(--color-text); }
    .card-name.static { cursor: default; }
    .card-meta { font-size: 12px; color: var(--color-muted); margin-top: 4px; display: flex; align-items: center; gap: 0; }
    .dot { margin: 0 5px; color: var(--color-muted-soft); }
    .public-badge { font-size: 10px; font-weight: 600; color: var(--color-accent-ink); background: var(--color-accent-soft); padding: 1px 6px; border-radius: 4px; }
    
    .card-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
    .action-open { font-size: 12px; font-weight: 500; color: var(--color-accent-ink); text-decoration: none; cursor: pointer; font-family: inherit; transition: color 0.15s; }
    .action-open:hover { color: var(--color-accent-ink); text-decoration: underline; }
    .action-rename { margin-left: auto; background: none; border: none; color: var(--color-muted-soft); cursor: pointer; padding: 4px; display: flex; align-items: center; border-radius: 6px; transition: color 0.15s, background 0.15s; }
    .action-rename:hover { color: var(--color-text); background: var(--color-surface-2); }
    .card-name-input { width: 100%; font-size: 14px; font-weight: 600; font-family: inherit; color: var(--color-text); background: var(--color-surface-2); border: 1px solid var(--color-accent); border-radius: 6px; padding: 2px 6px; outline: none; }
    .action-delete { background: none; border: none; color: var(--color-muted-soft); cursor: pointer; padding: 4px; display: flex; align-items: center; border-radius: 6px; transition: color 0.15s, background 0.15s; }
    .action-delete:hover { color: var(--color-danger); background: var(--color-danger-soft); }
    .btn-use { background: none; border: 1px solid var(--color-accent); color: var(--color-accent-ink); border-radius: 10px; padding: 8px 20px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; text-decoration: none; transition: background 0.15s, color 0.15s; }
    .btn-use:hover:not(:disabled) { background: var(--color-accent); color: #101010; }
    .btn-use:disabled { opacity: 0.6; cursor: progress; }

    .state-card { margin-top: 32px; padding: 40px 24px; border: 1px solid var(--color-border-1); border-radius: 14px; background: var(--color-surface-2); text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .state-icon { color: var(--color-accent-ink); display: flex; }
    .state-title { font-size: 16px; font-weight: 600; color: var(--color-text); margin: 0; }
    .state-text { font-size: 13px; color: var(--color-muted); margin: 0; max-width: 420px; line-height: 1.5; }
    .btn-retry { display: inline-flex; align-items: center; gap: 6px; margin-top: 8px; background: var(--color-accent); color: #101010; border: none; border-radius: 8px; padding: 9px 18px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
    .btn-retry:hover:not(:disabled) { background: color-mix(in srgb, var(--color-accent) 85%, var(--color-text)); }
    .btn-retry:disabled { opacity: 0.7; cursor: progress; }
    :global(.spin) { animation: tpl-spin 0.8s linear infinite; }
    @keyframes tpl-spin { to { transform: rotate(360deg); } }
    .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: var(--color-surface-2); color: var(--color-text); border: 1px solid var(--color-danger); border-radius: 10px; padding: 10px 16px; font-size: 13px; z-index: 50; box-shadow: 0 8px 24px color-mix(in srgb, var(--color-text) 12%, transparent); }
    
    .no-results { font-size: 13px; color: var(--color-muted); padding: 24px 0; }

    @media (max-width: 768px) {
        .topbar { flex-direction: column; align-items: flex-start; gap: 12px; }
        .grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 480px) {
        .grid { grid-template-columns: 1fr; }
        .tpl-container { padding: 88px 16px 36px; }
        .title { font-size: 20px; }
    }
</style>
