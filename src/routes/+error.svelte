<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="error-page">
	<div class="error-card">
		<div class="error-code">{$page.status}</div>
		<h1>
			{#if $page.status === 404}
				Page not found
			{:else}
				Something went wrong
			{/if}
		</h1>
		<p>
			{#if $page.status === 404}
				The page you are looking for does not exist or has been moved.
			{:else}
				{$page.error?.message || 'An unexpected error occurred.'}
			{/if}
		</p>
		<div class="error-actions">
			<a href="/" class="err-btn-primary">Back to home</a>
			<a href="/templates" class="err-btn-ghost">Browse templates</a>
		</div>
	</div>
</div>

<style>
	.error-page {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-surface);
		padding: 32px;
		min-height: 100vh;
	}
	.error-card { text-align: center; max-width: 400px; }
	.error-code {
		font-size: 80px;
		font-weight: 800;
		color: var(--color-accent-ink);
		opacity: 0.15;
		line-height: 1;
		letter-spacing: -4px;
		margin-bottom: 8px;
	}
	.error-card h1 {
		font-size: 22px;
		font-weight: 700;
		color: var(--color-text);
		margin: 0 0 10px;
		letter-spacing: -0.5px;
	}
	.error-card p {
		font-size: 14px;
		color: var(--color-muted);
		line-height: 1.6;
		margin: 0 0 28px;
	}
	.error-actions { display: flex; gap: 10px; justify-content: center; }
	.err-btn-primary {
		padding: 10px 24px;
		background: var(--color-accent);
		color: #101010;
		font-size: 14px;
		font-weight: 600;
		border-radius: 100px;
		text-decoration: none;
		transition: background 0.15s;
	}
	.err-btn-primary:hover { background: color-mix(in srgb, var(--color-accent) 85%, var(--color-text)); }
	.err-btn-ghost {
		padding: 10px 24px;
		border: 1px solid var(--color-border-1);
		color: var(--color-muted);
		font-size: 14px;
		font-weight: 600;
		border-radius: 100px;
		text-decoration: none;
		transition: all 0.15s;
	}
	.err-btn-ghost:hover { color: var(--color-text); border-color: var(--color-border-1); }
</style>
