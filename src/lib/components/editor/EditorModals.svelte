<script lang="ts">
	import { view } from '$lib/store.svelte';
	import SaveToMailerModal from '../SaveToMailerModal.svelte';
	import SendModal from '../SendModal.svelte';
	import DeleteConfirm from './DeleteConfirm.svelte';
	import LinksModal from './LinksModal.svelte';

	// The one modal slot. view.modal names the single open modal; Save to Mailer's "Send a test
	// email" switches the slot to Send (with Back), it never opens a second dialog. The Insert
	// modal ('insert') is rendered by the right panel inside ModalFrame.
	let fromSave = $state(false);

	function close() {
		fromSave = false;
		view.closeModal();
	}
</script>

<SaveToMailerModal
	open={view.modal === 'save'}
	resume={fromSave}
	onclose={close}
	onsend={() => {
		fromSave = true;
		view.switchModal('send');
	}}
/>
<SendModal open={view.modal === 'send'} onclose={close} onback={fromSave ? () => view.switchModal('save') : undefined} />
{#if view.modal === 'delete'}<DeleteConfirm />{/if}
{#if view.modal === 'links'}<LinksModal />{/if}
