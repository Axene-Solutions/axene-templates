<script lang="ts">
	import { view } from '$lib/store.svelte';
	import { mailerData } from '$lib/mailer-data.svelte';
	import { formatLink } from '$lib/placeholders';
	import Icon from '../Icon.svelte';
	import ModalFrame from './ModalFrame.svelte';
	import LinksManager from './LinksManager.svelte';

	// Manage named links (Editor.dc.html MANAGE LINKS) as its own dialog in the one modal slot.
	// From the Insert field modal the same body is a step inside that modal (LinksManager).
	function done() {
		if (view.linksBack) view.linksToInsert();
		else view.closeModal();
	}
</script>

<ModalFrame label="Named links" onclose={done} style="width:100%;max-width:500px;background:var(--bg);border-radius:16px;padding:26px;box-shadow:0 30px 80px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:14px">
	<div style="display:flex;gap:8px;align-items:flex-start">
		{#if view.linksBack}<button class="icon-btn" type="button" onclick={() => view.linksToInsert()} aria-label="Back to the picker" style="margin-left:-8px"><Icon name="arrow-left42" width={18} height={18} /></button>{/if}
		<div style="flex-grow:1"><h2 style="margin:0;font-size:20px;font-weight:700">Named links</h2><p style="margin:5px 0 0;font-size:13.5px;line-height:1.5;color:var(--muted)">Keep one URL in one place. Use it anywhere as <span class="mono" style="font-size:12px">{formatLink(mailerData.links[0]?.key ?? 'order_online')}</span>.</p></div>
		<button class="icon-btn" type="button" onclick={done} aria-label="Close"><Icon name="close" width={16} height={16} /></button>
	</div>
	<LinksManager ondone={done} />
</ModalFrame>
