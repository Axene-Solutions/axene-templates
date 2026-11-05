<script lang="ts">
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
		<div class="cm-card" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title} tabindex="-1">
			<div class="cm-title">{title}</div>
			<div class="cm-message">{message}</div>
			<div class="cm-actions">
				<button class="cm-btn cm-btn-cancel" onclick={oncancel}>{cancelText}</button>
				<button
					class="cm-btn {variant === 'danger' ? 'cm-btn-danger' : 'cm-btn-confirm'}"
					onclick={onconfirm}
				>{confirmText}</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.cm-overlay {
		position: fixed;
		inset: 0;
		z-index: 1000;
		background: color-mix(in srgb, var(--color-bg) 70%, transparent);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.cm-card {
		background: var(--color-surface-2);
		border-radius: 12px;
		box-shadow: 0 4px 24px color-mix(in srgb, var(--color-text) 12%, transparent), 0 0 0 1px color-mix(in srgb, var(--color-text) 4%, transparent);
		max-width: 400px;
		width: 90%;
		padding: 24px;
		font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif;
	}
	.cm-title {
		font-size: 16px;
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: 8px;
	}
	.cm-message {
		font-size: 14px;
		color: var(--color-muted);
		line-height: 1.5;
		margin-bottom: 20px;
	}
	.cm-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
	}
	.cm-btn {
		padding: 7px 16px;
		border-radius: 7px;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		border: none;
		font-family: inherit;
		transition: background 0.15s, opacity 0.15s;
	}
	.cm-btn-cancel {
		background: var(--color-surface-2);
		color: var(--color-muted);
		border: 1px solid var(--color-border-1);
	}
	.cm-btn-cancel:hover { background: var(--color-surface-2); }
	.cm-btn-confirm {
		background: var(--color-accent);
		color: #101010;
	}
	.cm-btn-confirm:hover { background: color-mix(in srgb, var(--color-accent) 85%, var(--color-text)); }
	.cm-btn-danger {
		background: var(--color-danger);
		color: var(--color-bg);
	}
	.cm-btn-danger:hover { background: color-mix(in srgb, var(--color-danger) 85%, var(--color-text)); }
</style>
