<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import NavRail from '$lib/components/NavRail.svelte';
	let { children } = $props();

	const isLanding = $derived(page.url.pathname === '/');
</script>

<svelte:head>
	<title>Axene Templates</title>
</svelte:head>

{#if isLanding}
	<div class="app-landing">
		{@render children()}
	</div>
{:else}
	<div class="app-shell">
		<div class="app-window">
			<NavRail />
			<div class="app-content">
				{@render children()}
			</div>
		</div>
	</div>
{/if}

<style>
	.app-shell {
		width: 100vw;
		min-height: 100vh;
		background: #c8dfc8;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.app-window {
		background: #f2f2f2;
		width: 100%;
		box-shadow: 0 30px 80px rgba(0,0,0,0.25);
		display: flex;
	}
	.app-content {
		flex: 1;
		display: flex;
		min-width: 0;
		overflow: hidden;
	}
	.app-landing {
		width: 100%;
		min-height: 100vh;
	}
</style>
