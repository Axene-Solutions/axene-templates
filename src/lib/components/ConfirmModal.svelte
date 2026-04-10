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
		if (e.key === 'Escape') oncancel();
	}
</script>

{#if open}
	<svelte:window onkeydown={handleKeydown} />
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="cm-overlay" onclick={oncancel}>
		<div class="cm-card" onclick={(e) => e.stopPropagation()} role="dialog">
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
		background: rgba(0, 0, 0, 0.25);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.cm-card {
		background: #fff;
		border-radius: 12px;
		box-shadow: 0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04);
		max-width: 400px;
		width: 90%;
		padding: 24px;
		font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif;
	}
	.cm-title {
		font-size: 16px;
		font-weight: 600;
		color: #111827;
		margin-bottom: 8px;
	}
	.cm-message {
		font-size: 14px;
		color: #6b7280;
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
		background: #fff;
		color: #555;
		border: 1px solid #e0e0e0;
	}
	.cm-btn-cancel:hover { background: #f5f5f5; }
	.cm-btn-confirm {
		background: #1daa82;
		color: #fff;
	}
	.cm-btn-confirm:hover { background: #189e78; }
	.cm-btn-danger {
		background: #dc2626;
		color: #fff;
	}
	.cm-btn-danger:hover { background: #b91c1c; }
</style>
