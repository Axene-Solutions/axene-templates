<script lang="ts">
	import '../app.css'
	import '$lib/styles/dz.css'
	import { page } from '$app/state'
	import NavRail from '$lib/components/NavRail.svelte'
	import { onMount } from 'svelte'
	import { theme } from '$lib/stores/theme.svelte'
	let { data, children } = $props()

	onMount(() => theme.init())

	const isLanding = $derived(page.url.pathname === '/')
	const isLogin = $derived(page.url.pathname === '/login')
	const isEditor = $derived(page.url.pathname.startsWith('/editor'))
	// The rail is only for the signed-in app screens (gallery, settings). The landing page keeps its own
	// nav, the editor keeps its own top bar, and sign in is bare.
	const isFullPage = $derived(isLanding || isLogin || isEditor)
</script>

<svelte:head>
	<title>Axene Templates</title>

	<link rel="icon" href="https://mail.axene.io/email-assets/logo.png" type="image/png" />
	<link rel="apple-touch-icon" href="https://mail.axene.io/email-assets/logo.png" />
</svelte:head>

{#if isFullPage}
	<div class="app-landing">
		{@render children()}
	</div>
{:else}
	<div class="app-shell">
		<div class="app-window relative">
			<NavRail user={data.user} />
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
		background: var(--color-surface);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.app-window {
		background: var(--color-surface);
		width: 100%;
		display: flex;
		align-items: flex-start;
		min-height: 100vh;
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
