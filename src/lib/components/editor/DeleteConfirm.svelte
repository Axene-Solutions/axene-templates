<script lang="ts">
	import { view } from '$lib/store.svelte';
	import { TYPE_NAME } from '$lib/blocks';
	import Icon from '../Icon.svelte';
	import ModalFrame from './ModalFrame.svelte';

	const b = $derived(view.deleteBlock);
	const text = $derived(b ? 'Delete this ' + TYPE_NAME[b.type].toLowerCase() + ' block?' : '');

	function focusEl(el: HTMLElement) {
		setTimeout(() => el.focus(), 0);
	}
	// Focus starts on Delete, so Enter confirms; Escape (in ModalFrame) cancels.
</script>

<ModalFrame label="Delete block" role="alertdialog" onclose={() => view.closeModal()} style="width:100%;max-width:400px;background:var(--bg);border-radius:16px;padding:24px;box-shadow:0 30px 80px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:14px;margin-top:80px">
	<h2 style="margin:0;font-size:18px;font-weight:700">Delete block</h2>
	<p style="margin:0;font-size:13.5px;line-height:1.5;color:var(--muted)">{text} You can undo this with ⌘Z.</p>
	<div style="display:flex;justify-content:flex-end;gap:8px">
		<button class="btn" type="button" onclick={() => view.closeModal()}>Cancel<span class="kbd">Esc</span></button>
		<button class="btn" type="button" use:focusEl onclick={() => view.confirmDelete()} style="background:var(--bad);color:#ffffff"><Icon name="trash" width={15} height={15} />Delete<span class="kbd" style="background:rgba(255,255,255,.22);color:#ffffff">Enter</span></button>
	</div>
</ModalFrame>
