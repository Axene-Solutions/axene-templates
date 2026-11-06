<script lang="ts">
	let { message }: { message: string } = $props();
</script>

{#if message}
	<div class="toast" role="status">{message}</div>
{/if}

<style>
	.toast {
		line-height: normal; position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%); z-index: 1100;
		background: var(--color-text); color: var(--color-bg); padding: 11px 18px; border-radius: 12px;
		font-size: 13px; font-weight: 500; box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25); font-family: var(--font-sans);
		max-width: calc(100vw - 32px);
	}
</style>
