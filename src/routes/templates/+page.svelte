<script lang="ts">
    import { goto, invalidate } from '$app/navigation';
    import { page } from '$app/state';
    import { onMount, tick } from 'svelte';
    import { mailer } from '$lib/mailer.svelte';
    import ConfirmModal from '$lib/components/ConfirmModal.svelte';
    import Icon from '$lib/components/Icon.svelte';
    import AiTemplateModal from '$lib/components/AiTemplateModal.svelte';
    import MailerTemplatesTab from '$lib/components/MailerTemplatesTab.svelte';
    import TemplateCard from '$lib/components/gallery/TemplateCard.svelte';
    import Toast from '$lib/components/gallery/Toast.svelte';
    import { categoryId, categoryLabel, sortTemplates, type GalleryTemplate, type SortKey } from '$lib/components/gallery/helpers';

    let { data } = $props();

    // Templates fetched from the server; kept in local state so rename, copy, share and delete update the list
    let templates = $state<GalleryTemplate[]>([]);
    $effect.pre(() => {
        templates = data.templates;
    });
    const loadFailed = $derived<boolean>(!!data.loadError);
    const user = $derived(page.data.user);

    type Tab = 'yours' | 'community' | 'starters' | 'mailer';
    let tab = $state<Tab>(page.data.user ? 'yours' : 'starters');
    let cat = $state('all');
    let sort = $state<SortKey>('recent');
    let query = $state('');
    let retrying = $state(false);
    let toast = $state('');
    let toastTimer: ReturnType<typeof setTimeout> | undefined;
    let busyStarterId = $state<string | null>(null);
    let duplicatingId: string | null = null;
    let deleteTarget = $state<{ id: string; name: string } | null>(null);
    let aiOpen = $state(false);
    let mailerCount = $state(0);

    // The Link Mailer nudge: dismissible, remembered in this browser only.
    const NUDGE_KEY = 'axene.gallery.linkNudgeDismissed';
    let nudgeDismissed = $state(false);
    onMount(() => {
        try {
            nudgeDismissed = localStorage.getItem(NUDGE_KEY) === '1';
        } catch {
            /* storage can be unavailable: the nudge just shows again */
        }
        if (page.data.user) mailer.ensureLoaded();
    });
    function dismissNudge() {
        nudgeDismissed = true;
        try {
            localStorage.setItem(NUDGE_KEY, '1');
        } catch {
            /* ignore */
        }
    }
    const showNudge = $derived(!!user && !nudgeDismissed && (mailer.status === 'disconnected' || mailer.status === 'unreadable' || mailer.status === 'unavailable'));

    function say(message: string, ms = 2400) {
        toast = message;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => (toast = ''), ms);
    }

    async function retryLoad() {
        retrying = true;
        try {
            await invalidate('app:templates');
        } finally {
            retrying = false;
        }
    }

    const isMailer = $derived(tab === 'mailer');
    const tabDefs = $derived<[Tab, string][]>(
        user
            ? [['yours', 'Yours'], ['community', 'Community'], ['starters', 'Starters'], ['mailer', 'From Mailer']]
            : [['community', 'Community'], ['starters', 'Starters']]
    );
    // A signed out visitor cannot sit on a signed in tab.
    $effect(() => {
        if (!user && (tab === 'yours' || tab === 'mailer')) tab = 'starters';
    });

    const base = $derived(
        tab === 'yours'
            ? templates.filter((t) => t.isOwn)
            : tab === 'community'
              ? templates.filter((t) => t.isPublic && !t.isOwn && !t.isStarter)
              : tab === 'starters'
                ? templates.filter((t) => t.isStarter)
                : []
    );
    const catList = $derived([...new Set(base.map(categoryId))]);
    const activeCat = $derived(cat === 'all' || catList.includes(cat) ? cat : 'all');
    const items = $derived(
        sortTemplates(
            base.filter((t) => (activeCat === 'all' || categoryId(t) === activeCat) && (!query.trim() || t.name.toLowerCase().includes(query.trim().toLowerCase()))),
            sort
        )
    );
    const count = $derived(isMailer ? mailerCount : items.length);

    const emptyBlank = $derived(!loadFailed && !isMailer && base.length === 0);
    const emptyFilter = $derived(!loadFailed && !isMailer && base.length > 0 && items.length === 0);
    const blankText: Record<string, [string, string]> = {
        yours: ['No templates yet', 'Start from a starter, generate one with AI or begin with a blank template.'],
        community: ['No community templates yet', 'Templates other people make public will show up here.'],
        starters: ['No starter templates are available yet', 'Check back soon.'],
    };
    const emptyTitle = $derived(emptyFilter ? 'Nothing matches' : (blankText[tab] ?? ['', ''])[0]);
    const emptyBody = $derived(emptyFilter ? 'Nothing matches your search or filter.' : (blankText[tab] ?? ['', ''])[1]);

    function pickTab(t: Tab) {
        tab = t;
        cat = 'all';
    }

    async function errorReason(res: Response): Promise<string> {
        try {
            const err = await res.json();
            if (err?.error) return err.error;
        } catch {
            /* keep the status based reason */
        }
        return `error ${res.status}`;
    }

    async function rename(tpl: GalleryTemplate, raw: string) {
        const name = raw.trim();
        if (name === tpl.name) return;
        if (name === '') {
            say('A template name cannot be empty.');
            return;
        }
        try {
            const res = await fetch(`/api/templates/${tpl.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            if (res.ok) {
                const saved = await res.json();
                templates = templates.map((x) => (x.id === tpl.id ? { ...x, name: saved.name } : x));
            } else {
                say(`Could not rename "${tpl.name}" (${await errorReason(res)}).`, 4000);
            }
        } catch {
            say(`Could not rename "${tpl.name}". Check your connection.`, 4000);
        }
    }

    async function duplicate(tpl: GalleryTemplate) {
        if (duplicatingId) return;
        duplicatingId = tpl.id;
        try {
            const res = await fetch(`/api/templates/${tpl.id}/duplicate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '{}',
            });
            if (res.ok) {
                const copy: GalleryTemplate = await res.json();
                templates = [copy, ...templates];
                sort = 'recent';
                say(`Duplicated as ${copy.name}`);
            } else {
                say(`Could not duplicate "${tpl.name}" (${await errorReason(res)}).`, 4000);
            }
        } catch {
            say(`Could not duplicate "${tpl.name}". Check your connection.`, 4000);
        } finally {
            duplicatingId = null;
        }
    }

    async function togglePublic(tpl: GalleryTemplate) {
        const next = !tpl.isPublic;
        try {
            const res = await fetch(`/api/templates/${tpl.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPublic: next }),
            });
            if (res.ok) {
                templates = templates.map((x) => (x.id === tpl.id ? { ...x, isPublic: next } : x));
                say(next ? 'Now public, visible in Community' : 'Now private');
            } else {
                say(`Could not change "${tpl.name}" (${await errorReason(res)}).`, 4000);
            }
        } catch {
            say(`Could not change "${tpl.name}". Check your connection.`, 4000);
        }
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        const { id, name } = deleteTarget;
        deleteTarget = null;
        try {
            const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
            if (res.ok) {
                const at = items.findIndex((t) => t.id === id);
                templates = templates.filter((t) => t.id !== id);
                say(`Deleted ${name}`);
                // The focused Delete button went with its card: move focus to the card now in its
                // place (or the one before), so keyboard users keep their spot in the grid.
                await tick();
                if (document.activeElement === document.body || !document.activeElement) {
                    const links = document.querySelectorAll<HTMLElement>('section[aria-label="Templates"] a[aria-label$=" in the editor"]');
                    (links[Math.min(at, links.length - 1)] ?? document.querySelector<HTMLElement>('main a[href="/editor"]'))?.focus();
                }
            } else {
                say(`Could not delete "${name}" (error ${res.status}).`, 4000);
            }
        } catch {
            say(`Could not delete "${name}". Check your connection.`, 4000);
        }
    }

    async function useStarter(starter: GalleryTemplate) {
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
            say(`Could not create a template from "${starter.name}". Please try again.`, 4000);
        } finally {
            busyStarterId = null;
        }
    }
</script>

<svelte:head>
    <title>Templates - Axene Templates</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" />
</svelte:head>

<div class="gl">
    <main class="gl-main">
        <header style="display:flex;flex-wrap:wrap;align-items:center;gap:14px 16px">
            <h1 style="margin:0;font-size:28px;font-weight:700;letter-spacing:-.02em;flex-grow:1">Templates <span style="font-size:15px;font-weight:500;color:var(--color-muted);margin-left:6px">{count}</span></h1>
            <label style="position:relative;display:block;width:240px">
                <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--color-muted);display:flex"><Icon name="search" width={16} height={16} /></span>
                <input class="dz-field" style="padding-left:36px" type="text" placeholder="Search templates" aria-label="Search templates" bind:value={query} />
            </label>
            {#if user}
                <button class="dz-btn" type="button" onclick={() => (aiOpen = true)}><Icon name="magicpen" width={16} height={16} />Generate with AI</button>
                <a class="dz-btn dz-btn-primary" href="/editor"><Icon name="add" width={16} height={16} />New template</a>
            {:else}
                <a class="dz-btn dz-btn-primary" href="/auth/google"><Icon name="user" width={16} height={16} />Sign in to create templates</a>
            {/if}
        </header>

        {#if showNudge}
            <div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;padding:14px 16px;border-radius:12px;background:var(--color-accent-soft)">
                <span style="color:var(--color-accent-ink);display:flex"><Icon name="email" width={18} height={18} /></span>
                <span style="flex-grow:1;font-size:13.5px;color:var(--color-text)"><b>Link Mailer</b> to send from your own domain, save templates to Mailer and use your contact fields.</span>
                <a class="dz-btn dz-btn-primary" href="/settings" style="padding:8px 14px">Connect<Icon name="arrow-right4" width={14} height={14} /></a>
                <button class="dz-x" type="button" onclick={dismissNudge} aria-label="Dismiss"><Icon name="close" width={15} height={15} /></button>
            </div>
        {/if}

        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px">
            <div role="tablist" aria-label="Source" style="display:inline-flex;gap:2px;padding:4px;border-radius:12px;background:var(--color-surface-2)">
                {#each tabDefs as [id, label] (id)}
                    <button class="dz-seg" role="tab" type="button" aria-selected={tab === id} style={tab === id ? 'background:var(--color-bg);color:var(--color-text);box-shadow:0 1px 3px rgba(0,0,0,.12)' : ''} onclick={() => pickTab(id)}>{label}</button>
                {/each}
            </div>
            {#if !isMailer && !loadFailed}
                <div style="display:flex;flex-wrap:wrap;gap:2px">
                    {#each ['all', ...catList] as c (c)}
                        <button class="dz-chip" type="button" style={activeCat === c ? 'background:#ffd100;color:#101010;font-weight:600' : ''} onclick={() => (cat = c)}>{c === 'all' ? 'All' : categoryLabel(c)}</button>
                    {/each}
                </div>
                <div style="display:flex;align-items:center;gap:4px;margin-left:auto">
                    <span class="dz-lbl" style="margin-right:6px; display: flex; align-items: center" aria-label="Sort" title="Sort" role="img"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="flex-shrink:0"><rect x="3" y="5" width="18" height="2" rx="1"></rect><rect x="3" y="11" width="13" height="2" rx="1"></rect><rect x="3" y="17" width="8" height="2" rx="1"></rect></svg></span>
                    {#each [['recent', 'Newest'], ['name', 'Name'], ['blocks', 'Blocks']] as [id, label] (id)}
                        <button class="dz-chip" type="button" aria-pressed={sort === id} style={sort === id ? 'background:var(--color-surface-3);color:var(--color-text);font-weight:600' : ''} onclick={() => (sort = id as SortKey)}>{label}</button>
                    {/each}
                </div>
            {/if}
        </div>

        {#if isMailer}
            <MailerTemplatesTab {query} bind:count={mailerCount} />
        {:else if loadFailed}
            <div role="alert" class="dz-panel state">
                <span style="color:var(--color-danger);display:flex"><Icon name="danger" width={28} height={28} /></span>
                <h2 class="state-title">Could not load templates</h2>
                <p class="state-text">The server did not answer. Check your connection and try again.</p>
                <button class="dz-btn" type="button" onclick={retryLoad} disabled={retrying} style="margin-top:6px">{#if retrying}<span class="dz-spinner"></span>{:else}<Icon name="refresh-arrow" width={15} height={15} />{/if}{retrying ? 'Retrying' : 'Try again'}</button>
            </div>
        {:else if items.length > 0}
            <section aria-label="Templates" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px">
                {#each items as tpl (tpl.id)}
                    <TemplateCard
                        {tpl}
                        kind={tab === 'yours' ? 'own' : tab === 'community' ? 'community' : 'starter'}
                        signedIn={!!user}
                        {busyStarterId}
                        onrename={rename}
                        onduplicate={duplicate}
                        ontogglepublic={togglePublic}
                        ondelete={(t) => (deleteTarget = { id: t.id, name: t.name })}
                        onuse={useStarter}
                    />
                {/each}
            </section>
        {:else if emptyBlank || emptyFilter}
            <div class="dz-panel state">
                <h2 class="state-title">{emptyTitle}</h2>
                <p class="state-text">{emptyBody}</p>
                {#if emptyFilter}<button class="dz-btn" type="button" onclick={() => { query = ''; cat = 'all'; }} style="margin-top:6px">Clear filters</button>{/if}
                {#if emptyBlank && user}<div style="display:flex;gap:8px;margin-top:6px"><button class="dz-btn" type="button" onclick={() => (aiOpen = true)}>Generate with AI</button><a class="dz-btn" href="/editor">New template</a></div>{/if}
            </div>
        {/if}
    </main>
</div>

<Toast message={toast} />

<!-- The delete confirm and the AI dialog are never open together: each one covers the page. -->
<ConfirmModal
    open={!!deleteTarget && !aiOpen}
    title="Delete template"
    message="Are you sure you want to delete '{deleteTarget?.name}'? This cannot be undone."
    variant="danger"
    confirmText="Delete"
    onconfirm={handleDelete}
    oncancel={() => (deleteTarget = null)}
/>
<AiTemplateModal open={aiOpen} onclose={() => (aiOpen = false)} />

<style>
    .gl { line-height: normal; flex: 1; min-width: 0; background: var(--color-bg); color: var(--color-text); font-family: var(--font-sans); }
    .gl-main { padding: 36px 56px 64px; display: flex; flex-direction: column; gap: 22px; min-height: 860px; box-sizing: border-box; }
    .state { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 44px 24px; }
    .state-title { margin: 0; font-size: 17px; font-weight: 700; }
    .state-text { margin: 0; font-size: 13.5px; color: var(--color-muted); max-width: 420px; line-height: 1.5; }
    @media (max-width: 640px) { .gl-main { padding: 24px 16px 48px; } }
</style>
