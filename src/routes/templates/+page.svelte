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
                            <div class="card-name static">{tpl.name}</div>
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
        overflow-y: auto; flex: 1; background: #101010; font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif;
        min-height: 100vh; display: flex; flex-direction: column;
    }
    .tpl-container { max-width: 1100px; margin: 0 auto; padding: 88px 24px 48px; width: 100%; flex: 1; }
    .topbar { display: flex; align-items: center; justify-content: space-between; }
    .topbar-left { display: flex; align-items: center; gap: 10px; }
    .title { font-size: 24px; font-weight: 700; color: #fff; margin: 0; line-height: 1; }
    .count-badge { font-size: 11px; font-weight: 600; color: #888; background: rgba(255,255,255,0.08); border-radius: 999px; padding: 2px 9px; line-height: 1.5; }
    .btn-new { display: flex; align-items: center; gap: 6px; background: #FFD100; color: #101010; border: none; border-radius: 8px; padding: 9px 18px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
    .btn-new:hover { background: #e6bc00; }
    .btn-signin-banner { display: flex; align-items: center; gap: 6px; background: rgba(255,209,0,0.1); color: #FFD100; border: 1px solid rgba(255,209,0,0.25); border-radius: 8px; padding: 9px 18px; font-size: 13px; font-weight: 600; text-decoration: none; transition: background 0.15s; }
    .btn-signin-banner:hover { background: rgba(255,209,0,0.18); }
    
    .search-wrap { position: relative; margin-top: 20px; max-width: 400px; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; color: #888; display: flex; }
    .search-input { width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 8px 12px 8px 34px; font-size: 13px; font-family: inherit; color: #fff; outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
    .search-input:focus { border-color: #FFD100; box-shadow: 0 0 0 3px rgba(255, 209, 0, 0.12); }
    .search-input::placeholder { color: #777; }

    /* ---------- Filters ---------- */
    .filter-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin: 24px 0 16px;
    }
    .filter-tab {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 20px;
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 500;
        color: #aaa;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;
        letter-spacing: 0.01em;
    }
    .filter-tab:hover {
        background: rgba(255,255,255,0.08);
        color: #ddd;
        border-color: rgba(255,255,255,0.15);
    }
    .filter-tab.active {
        background: #FFD100;
        color: #101010;
        border-color: #FFD100;
        font-weight: 600;
        box-shadow: 0 0 12px rgba(255, 209, 0, 0.2);
    }

    .section { margin-top: 32px; }
    .section-header { font-size: 13px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 14px; }
    
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .card { border: 1px solid rgba(0,0,0,0.06); border-radius: 14px; overflow: hidden; background: #101010; transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1); box-shadow: 0 1px 3px rgba(0,0,0,0.04); border: 1px solid #bbbab70d; }
    .card:hover { border-color: #ffd00037; transform: translateY(-3px); }
    .card-thumb { text-decoration: none; height: 150px; display: flex; align-items: center; justify-content: center; padding: 16px; overflow: hidden; position: relative; }
    
    .wire { width: 100px; background: rgba(255,255,255,0.15); backdrop-filter: blur(6px); border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); overflow: hidden; display: flex; flex-direction: column; opacity: 0.3; box-shadow: 0 4px 16px rgba(0,0,0,0.1); transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1); }
    .card:hover .wire { transform: scale(1.06) translateY(-2px); }
    .wire-hdr { height: 9px; background: rgba(255,255,255,0.25); }
    .wire-bd { padding: 7px 9px 9px; display: flex; flex-direction: column; gap: 3px; }
    .wire-ln { height: 4px; background: rgba(255,255,255,0.55); border-radius: 2px; width: 100%; }
    .wire-ln.w60 { width: 60%; } .wire-ln.w50 { width: 50%; } .wire-ln.w40 { width: 40%; }
    .wire-ls { height: 2.5px; background: rgba(255,255,255,0.3); border-radius: 1px; width: 100%; }
    .wire-ls.w80 { width: 80%; } .wire-ls.w70 { width: 70%; }
    .wire-sp { height: 3px; }
    .wire-bt { height: 7px; background: rgba(255,255,255,0.5); border-radius: 4px; width: 50%; margin: 0 auto; }
    
    .card-hover-pill { position: absolute; bottom: 10px; right: 10px; padding: 4px 12px; border-radius: 100px; background: rgba(255,255,255,0.9); backdrop-filter: blur(4px); font-size: 11px; font-weight: 600; color: #0f172a; opacity: 0; transform: translateY(6px); transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .card:hover .card-hover-pill { opacity: 1; transform: translateY(0); }
    .card-info { padding: 16px; }
    .card-name { font-size: 14px; font-weight: 600; color: #fff; }
    .card-name.static { cursor: default; }
    .card-meta { font-size: 12px; color: #666; margin-top: 4px; display: flex; align-items: center; gap: 0; }
    .dot { margin: 0 5px; color: #555; }
    .public-badge { font-size: 10px; font-weight: 600; color: #FFD100; background: rgba(255,209,0,0.1); padding: 1px 6px; border-radius: 4px; }
    
    .card-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
    .action-open { font-size: 12px; font-weight: 500; color: #FFD100; text-decoration: none; cursor: pointer; font-family: inherit; transition: color 0.15s; }
    .action-open:hover { color: #ffe033; text-decoration: underline; }
    .action-delete { background: none; border: none; color: #555; cursor: pointer; padding: 4px; display: flex; align-items: center; border-radius: 6px; transition: color 0.15s, background 0.15s; }
    .action-delete:hover { color: #dc2626; background: rgba(220,38,38,0.1); }
    .btn-use { background: none; border: 1px solid #ffd00037; color: #FFD100; border-radius: 10px; padding: 8px 20px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; text-decoration: none; transition: background 0.15s, color 0.15s; }
    .btn-use:hover:not(:disabled) { background: #FFD100; color: #101010; }
    .btn-use:disabled { opacity: 0.6; cursor: progress; }

    .state-card { margin-top: 32px; padding: 40px 24px; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; background: rgba(255,255,255,0.02); text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .state-icon { color: #FFD100; display: flex; }
    .state-title { font-size: 16px; font-weight: 600; color: #fff; margin: 0; }
    .state-text { font-size: 13px; color: #888; margin: 0; max-width: 420px; line-height: 1.5; }
    .btn-retry { display: inline-flex; align-items: center; gap: 6px; margin-top: 8px; background: #FFD100; color: #101010; border: none; border-radius: 8px; padding: 9px 18px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
    .btn-retry:hover:not(:disabled) { background: #e6bc00; }
    .btn-retry:disabled { opacity: 0.7; cursor: progress; }
    :global(.spin) { animation: tpl-spin 0.8s linear infinite; }
    @keyframes tpl-spin { to { transform: rotate(360deg); } }
    .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #1c1c1c; color: #fff; border: 1px solid rgba(239,68,68,0.5); border-radius: 10px; padding: 10px 16px; font-size: 13px; z-index: 50; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
    
    .no-results { font-size: 13px; color: #666; padding: 24px 0; }

    @media (max-width: 768px) {
        .topbar { flex-direction: column; align-items: flex-start; gap: 12px; }
        .grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 480px) {
        .grid { grid-template-columns: 1fr; }
        .tpl-container { padding: 20px 16px 36px; }
        .title { font-size: 20px; }
    }
</style>
