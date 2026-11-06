<script lang="ts">
	import { onMount } from 'svelte';
	import { view } from '$lib/store.svelte';
	import { mailerData, settingsHref } from '$lib/mailer-data.svelte';
	import { formatLink, linkLabelError, linkUrlError, suggestLinkKey } from '$lib/placeholders';
	import Icon from '../Icon.svelte';
	import ModalFrame from './ModalFrame.svelte';

	// Manage named links (Editor.dc.html MANAGE LINKS), on the real Mailer links. Reached from the
	// Insert modal as a step with a Back chevron, never on top of it.
	let label = $state('');
	let url = $state('');
	let busy = $state(false);
	let error = $state('');
	let removing = $state('');

	onMount(() => {
		mailerData.loadLinks();
	});

	const key = $derived(suggestLinkKey(label));
	const problem = $derived(label.trim() ? linkLabelError(label) : null);
	const urlProblem = $derived(url.trim() ? linkUrlError(url.trim()) : null);
	const canAdd = $derived(!busy && !!key && !!url.trim() && !problem && !urlProblem);

	function done() {
		if (view.linksBack) view.linksToInsert();
		else view.closeModal();
	}

	async function add() {
		if (!canAdd) {
			error = problem ?? urlProblem ?? '';
			return;
		}
		busy = true;
		error = '';
		const r = await mailerData.saveLink({ label: label.trim(), url: url.trim(), key });
		busy = false;
		if (r.ok) {
			label = '';
			url = '';
		} else error = r.error;
	}
	async function remove(id: string) {
		removing = id;
		error = '';
		const r = await mailerData.removeLink(id);
		removing = '';
		if (!r.ok) error = r.error;
	}
</script>

<ModalFrame label="Named links" {busy} onclose={done} style="width:100%;max-width:500px;background:var(--bg);border-radius:16px;padding:26px;box-shadow:0 30px 80px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:14px">
	<div style="display:flex;gap:8px;align-items:flex-start">
		{#if view.linksBack}<button class="icon-btn" type="button" onclick={() => view.linksToInsert()} aria-label="Back to the picker" style="margin-left:-8px"><Icon name="arrow-left42" width={18} height={18} /></button>{/if}
		<div style="flex-grow:1"><h2 style="margin:0;font-size:20px;font-weight:700">Named links</h2><p style="margin:5px 0 0;font-size:13.5px;line-height:1.5;color:var(--muted)">Keep one URL in one place. Use it anywhere as <span class="mono" style="font-size:12px">{formatLink(mailerData.links[0]?.key ?? 'order_online')}</span>.</p></div>
		<button class="icon-btn" type="button" onclick={done} aria-label="Close"><Icon name="close" width={16} height={16} /></button>
	</div>

	{#if mailerData.linksState === 'not_linked'}
		<div style="padding:12px 14px;border-radius:12px;background:var(--s2);font-size:13px;line-height:1.5">Link your Mailer account to keep named links. <a href={settingsHref()} style="color:var(--text);font-weight:600">Open Settings</a></div>
	{:else if mailerData.linksState === 'loading' || mailerData.linksState === 'idle'}
		<div style="padding:12px 14px;border-radius:12px;background:var(--s2);font-size:13px;color:var(--muted)">Loading your links.</div>
	{:else if mailerData.linksState !== 'ready'}
		<div role="alert" style="padding:12px 14px;border-radius:12px;background:var(--color-danger-soft);color:var(--bad);font-size:13px;line-height:1.5">{mailerData.linksMessage || 'Could not load your named links.'}</div>
	{:else}
		<div style="display:flex;flex-direction:column;gap:4px">
			{#each mailerData.links as k (k.id)}
				<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:var(--s2)"><div style="flex-grow:1;min-width:0"><div style="font-size:13px;font-weight:600">{k.label}</div><div class="mono" style="font-size:11.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{formatLink(k.key)} | {k.url}</div></div><button class="mini" type="button" aria-label={'Remove ' + k.label} disabled={removing === k.id} onclick={() => remove(k.id)}><Icon name="trash" width={14} height={14} /></button></div>
			{/each}
			{#if !mailerData.links.length}<div style="padding:12px 14px;border-radius:12px;background:var(--s2);font-size:13px;color:var(--muted)">No named links yet.</div>{/if}
		</div>
		<div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:8px">
			<input class="field" type="text" aria-label="Link label" placeholder="Label, e.g. Order online" bind:value={label} maxlength="80" />
			<input class="field mono" type="text" aria-label="Link URL" placeholder="https://" bind:value={url} style="font-size:12.5px" />
		</div>
		{#if error}<div role="alert" style="font-size:12.5px;line-height:1.5;color:var(--bad)">{error}</div>{/if}
	{/if}
	<div style="display:flex;justify-content:flex-end;gap:8px">
		{#if mailerData.linksState === 'ready'}<button class="btn" type="button" onclick={add} style={canAdd ? '' : 'opacity:.45;pointer-events:none'}><Icon name="add" width={15} height={15} />Add link</button>{/if}
		<button class="btn" type="button" onclick={done}>Done</button>
	</div>
</ModalFrame>
