<script lang="ts">
	import { tick } from 'svelte';
	import Icon from '../Icon.svelte';
	import Logo from '../Logo.svelte';
	import { blocksLabel, hueFor, whenLabel, type GalleryTemplate } from './helpers';

	// One card of the gallery grid (Yours, Community and Starters). Markup and styles follow the Main board.
	type Kind = 'own' | 'community' | 'starter';
	let {
		tpl,
		kind,
		signedIn,
		busyStarterId = null,
		onrename,
		onduplicate,
		ontogglepublic,
		ondelete,
		onuse,
	}: {
		tpl: GalleryTemplate;
		kind: Kind;
		signedIn: boolean;
		busyStarterId?: string | null;
		onrename: (tpl: GalleryTemplate, name: string) => void;
		onduplicate: (tpl: GalleryTemplate) => void;
		ontogglepublic: (tpl: GalleryTemplate) => void;
		ondelete: (tpl: GalleryTemplate) => void;
		onuse: (tpl: GalleryTemplate) => void;
	} = $props();

	const hue = $derived(hueFor(tpl));
	const own = $derived(kind === 'own');
	const meta = $derived(blocksLabel(tpl.blockCount) + (own && tpl.updatedAt ? ', ' + whenLabel(tpl.updatedAt) : ''));
	const publicLabel = $derived(tpl.isPublic ? 'Make private' : 'Make public');
	const creating = $derived(busyStarterId === tpl.id);

	let renaming = $state(false);
	let renameValue = $state('');
	let renameEl: HTMLInputElement | undefined = $state();

	async function startRename() {
		renameValue = tpl.name;
		renaming = true;
		await tick();
		renameEl?.focus();
		renameEl?.select();
	}
	function commit() {
		if (!renaming) return;
		renaming = false;
		onrename(tpl, renameValue);
	}
	function onRenameKey(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			commit();
		}
		if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			renaming = false;
		}
	}
</script>

{#snippet mock()}
	<div class="thumb">
		<div class="mock">
			<div style="height:24px;background:{hue}"></div>
			<div style="padding:11px 11px 13px;display:flex;flex-direction:column;gap:6px">
				<div style="height:7px;width:72%;background:#cfcdc1;border-radius:4px"></div>
				<div style="height:5px;width:94%;background:#e4e2d7;border-radius:4px"></div>
				<div style="height:5px;width:82%;background:#e4e2d7;border-radius:4px"></div>
				<div style="height:13px;width:42%;background:{hue};border-radius:4px;margin-top:5px"></div>
			</div>
		</div>
	</div>
{/snippet}

<div class="card">
	{#if kind === 'starter'}
		{#if signedIn}
			<button class="thumbwrap" type="button" aria-label="Use {tpl.name} as a starting point" disabled={busyStarterId !== null} onclick={() => onuse(tpl)}>{@render mock()}</button>
		{:else}
			<a class="thumbwrap" href="/auth/google" aria-label="Sign in to use {tpl.name}">{@render mock()}</a>
		{/if}
	{:else}
		<a class="thumbwrap" href="/editor/{tpl.id}" aria-label="Open {tpl.name} in the editor">{@render mock()}</a>
	{/if}
	<div style="padding:12px 6px 6px;display:flex;flex-direction:column;gap:12px">
		<div style="min-width:0">
			{#if !(own && renaming)}
				<div style="font-size:14.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title={tpl.name}>{tpl.name}</div>
			{:else}
				<div style="display:flex;align-items:center;gap:4px">
					<input class="dz-field" style="padding:6px 10px;font-weight:600" type="text" maxlength="120" aria-label="Template name" bind:value={renameValue} bind:this={renameEl} onkeydown={onRenameKey} />
					<button class="dz-mini" type="button" onclick={commit} aria-label="Save name"><Icon name="done" width={16} height={16} /></button>
					<button class="dz-mini" type="button" onclick={() => (renaming = false)} aria-label="Cancel rename"><Icon name="close" width={15} height={15} /></button>
				</div>
			{/if}
			<div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:4px;font-size:12.5px;color:var(--color-muted)">
				<span>{meta}</span>
				{#if own && tpl.isPublic}<span class="dz-badge" style="background:var(--color-surface-3);color:var(--color-text)"><Icon name="global" width={12} height={12} />Public</span>{/if}
				{#if own && tpl.inMailer}<span class="dz-badge" style="background:var(--color-success-soft);color:var(--color-success)"><Logo size={12} class="card-logo" />In Mailer</span>{/if}
			</div>
		</div>
		<div style="display:flex;align-items:center;gap:2px">
			{#if kind === 'own'}
				<a class="dz-btn dz-btn-sm" href="/editor/{tpl.id}" style="margin-right:auto">Open</a>
				<button class="dz-mini" type="button" onclick={startRename} aria-label="Rename template" title="Rename"><Icon name="edit" width={16} height={16} /></button>
				<button class="dz-mini" type="button" onclick={() => onduplicate(tpl)} aria-label="Duplicate template" title="Duplicate"><Icon name="document-copy" width={16} height={16} /></button>
				<button class="dz-mini" type="button" onclick={() => ontogglepublic(tpl)} aria-pressed={tpl.isPublic} aria-label={publicLabel} title={publicLabel} style={tpl.isPublic ? 'color:var(--color-success);background:var(--color-success-soft)' : ''}><Icon name="global" width={16} height={16} /></button>
				<button class="dz-mini dz-mini-bad" type="button" onclick={() => ondelete(tpl)} aria-label="Delete template" title="Delete"><Icon name="trash" width={16} height={16} /></button>
			{:else if kind === 'community'}
				<a class="dz-btn dz-btn-sm" href="/editor/{tpl.id}">Open in Editor</a>
			{:else if signedIn}
				<button class="dz-btn dz-btn-sm" type="button" disabled={busyStarterId !== null} onclick={() => onuse(tpl)}>{creating ? 'Creating...' : 'Use template'}</button>
			{:else}
				<a class="dz-btn dz-btn-sm" href="/auth/google">Sign in to use</a>
			{/if}
		</div>
	</div>
</div>

<style>
	.card { display: block; border-radius: 16px; padding: 8px; transition: background 0.12s; }
	.card:hover { background: var(--color-surface-2); }
	.thumbwrap { display: block; width: 100%; padding: 0; border: 0; background: transparent; text-decoration: none; color: inherit; cursor: pointer; font: inherit; border-radius: 12px; }
	.thumbwrap:focus-visible { outline: 2px solid #ffd100; outline-offset: 2px; }
	.thumbwrap:disabled { cursor: progress; }
	.thumb { background: var(--color-surface-2); border-radius: 12px; height: 172px; display: flex; align-items: center; justify-content: center; overflow: hidden; transition: transform 0.15s, background 0.12s; }
	.card:hover .thumb { background: var(--color-surface-3); }
	.mock { width: 58%; background: #ffffff; border-radius: 8px; box-shadow: 0 8px 22px rgba(20, 20, 10, 0.1); overflow: hidden; }
	.card :global(.card-logo) { border-radius: 4px; }
</style>
