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
				<button type="button" class="mld-x" onclick={close} aria-label="Close"><Icon name="close" width={16} height={16} /></button>
			</div>
			<ManageLinks />
		</div>
	</div>
{/if}

<style>
	.mld-overlay {
		position: fixed; inset: 0; z-index: 1000;
		background: color-mix(in srgb, var(--color-bg) 70%, transparent); backdrop-filter: blur(4px);
		display: flex; align-items: center; justify-content: center;
	}
	.mld-card {
		background: var(--color-surface-2); border: 1px solid var(--color-border-1); border-radius: 12px;
		width: min(560px, 92vw); max-height: 90vh; overflow-y: auto; padding: 22px;
		color: var(--color-text); font-family: var(--font-sans);
	}
	.mld-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
	.mld-title { font-size: 16px; font-weight: 600; }
	.mld-x { background: none; border: none; color: var(--color-muted); cursor: pointer; display: flex; padding: 4px; border-radius: 6px; }
	.mld-x:hover { color: var(--color-text); }
</style>
