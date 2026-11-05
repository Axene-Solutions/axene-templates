<script lang="ts">
	import { onMount } from 'svelte'
	import { page } from '$app/state'
	import { editor } from '$lib/store.svelte'
	import MailerLinkScreen from '$lib/components/MailerLinkScreen.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import Sidebar from '$lib/components/Sidebar.svelte'
	import Canvas from '$lib/components/Canvas.svelte'
	import RightPanel from '$lib/components/RightPanel.svelte'

	// Deep link from Mailer: ?mailer=new starts a fresh template that Save to Mailer will create,
	// ?mailer=<id> opens the Templates copy of that Mailer template (see MailerLinkScreen).
	const mailerTarget = $derived(page.url.searchParams.get('mailer'))
	let started = $state(false)

	function start() {
		if (started) return
		started = true
		editor.newTemplate()
		editor.compile()
	}

	onMount(() => {
		if (!mailerTarget) start()
	})
</script>

<svelte:head>
	<title>{editor.templateName} - Editor - Axene Templates</title>
</svelte:head>

<!-- Mobile overlay -->
<div class="mobile-gate">
	<div class="mg-card">
		<div class="mg-icon">
			<Icon name="monitor" width={40} height={40} />
		</div>
		<h2>Larger screen needed</h2>
		<p>
			The email editor requires a desktop or tablet display to work properly. Please switch to a
			device with a wider screen.
		</p>
		<a href="/" class="mg-btn">Back to home</a>
	</div>
</div>

<!-- Editor (hidden on mobile via CSS) -->
{#if mailerTarget && !started}
	<MailerLinkScreen target={mailerTarget} oncontinue={start} />
{:else}
	<div class="editor-wrap">
		<Sidebar />
		<Canvas />
		<RightPanel />
	</div>
{/if}

<style>
	/* Own flex row, same as /editor/[id]. `display: contents` made the three
	   columns depend on the parent being a flex row, which the root layout does
	   not provide when the editor renders outside the app shell (no signed-in
	   user): they stacked vertically and the right panel fell off-screen. */
	.editor-wrap {
		display: flex;
		flex: 1;
		min-width: 0;
		min-height: 0;
		overflow: hidden;
		height: 100vh;
	}

	.mobile-gate {
		display: none;
	}

	@media (max-width: 860px) {
		.editor-wrap {
			display: none !important;
		}
		.mobile-gate {
			display: flex;
			flex: 1;
			align-items: center;
			justify-content: center;
			background: var(--color-surface);
			padding: 32px;
		}
		.mg-card {
			text-align: center;
			max-width: 340px;
		}
		.mg-icon {
			margin: 0 auto 20px;
			opacity: 0.8;
			color: var(--color-accent-ink);
			display: flex;
			justify-content: center;
		}
		.mg-card h2 {
			font-size: 20px;
			font-weight: 700;
			color: var(--color-text);
			margin: 0 0 10px;
			letter-spacing: -0.5px;
		}
		.mg-card p {
			font-size: 14px;
			color: var(--color-muted);
			line-height: 1.6;
			margin: 0 0 24px;
		}
		.mg-btn {
			display: inline-flex;
			padding: 10px 24px;
			background: var(--color-accent);
			color: #101010;
			font-size: 14px;
			font-weight: 600;
			border-radius: 100px;
			text-decoration: none;
			transition: background 0.15s;
		}
		.mg-btn:hover {
			background: color-mix(in srgb, var(--color-accent) 85%, var(--color-text));
		}
	}
</style>
