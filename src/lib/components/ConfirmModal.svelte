<script lang="ts">
	import { trapFocus } from '$lib/focus';

	// The confirm dialog of the boards (Delete template and friends). One at a time: callers never open
	// another dialog while this one is up.
	let {
		open = false,
		title = 'Confirm',
		message = 'Are you sure?',
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		variant = 'default',
		onconfirm,
		oncancel,
	}: {
		open: boolean;
		title?: string;
		message?: string;
		confirmText?: string;
		cancelText?: string;
		variant?: 'default' | 'danger';
		onconfirm: () => void;
		oncancel: () => void;
	} = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') oncancel();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="cm-overlay" onclick={oncancel}>
		<div class="cm-card" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title} tabindex="-1" use:trapFocus>
			<h2 class="cm-title">{title}</h2>
			<p class="cm-message">{message}</p>
			<div class="cm-actions">
				<button class="dz-btn" type="button" onclick={oncancel}>{cancelText}</button>
				<button class="dz-btn {variant === 'danger' ? 'dz-btn-solid-bad' : 'dz-btn-primary'}" type="button" onclick={onconfirm}>{confirmText}</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.cm-overlay {
		position: fixed; inset: 0; z-index: 1000; background: var(--color-scrim);
		display: flex; align-items: flex-start; justify-content: center; padding: 120px 16px; box-sizing: border-box;
	}
	.cm-card {
		width: 100%; max-width: 420px; background: var(--color-bg); border-radius: 16px; padding: 24px;
		box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35); display: flex; flex-direction: column; gap: 12px;
		font-family: var(--font-sans); color: var(--color-text); line-height: normal;
	}
	.cm-title { margin: 0; font-size: 18px; font-weight: 700; }
	.cm-message { margin: 0; font-size: 13.5px; line-height: 1.55; color: var(--color-muted); }
	.cm-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
</style>
