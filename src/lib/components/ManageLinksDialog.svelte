<script lang="ts">
	import { mailerData } from '$lib/mailer-data.svelte';
	import { trapFocus } from '$lib/focus';
	import Icon from './Icon.svelte';
	import ManageLinks from './ManageLinks.svelte';

	function close() {
		mailerData.manageLinksOpen = false;
	}
	function onkeydown(e: KeyboardEvent) {
		if (mailerData.manageLinksOpen && e.key === 'Escape') close();
	}
</script>

<svelte:window {onkeydown} />

{#if mailerData.manageLinksOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="mld-overlay" onclick={close}>
		<div class="mld-card" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Manage named links" tabindex="-1" use:trapFocus>
			<div class="mld-head">
				<div class="mld-title">Named links</div>
				<button type="button" class="dz-x" onclick={close} aria-label="Close"><Icon name="close" width={16} height={16} /></button>
			</div>
			<ManageLinks heading={false} />
		</div>
	</div>
{/if}

<style>
	.mld-overlay {
		position: fixed; inset: 0; z-index: 1000; background: var(--color-scrim);
		display: flex; align-items: flex-start; justify-content: center; padding: 40px 16px; box-sizing: border-box;
	}
	.mld-card {
		background: var(--color-bg); border-radius: 16px; width: 100%; max-width: 580px; max-height: calc(100vh - 80px); overflow-y: auto;
		padding: 24px; box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35); color: var(--color-text); font-family: var(--font-sans);
	}
	.mld-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
	.mld-title { font-size: 18px; font-weight: 700; }
</style>
