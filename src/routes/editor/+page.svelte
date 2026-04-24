<script lang="ts">
	import { onMount } from 'svelte'
	import { editor } from '$lib/store.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import Sidebar from '$lib/components/Sidebar.svelte'
	import Canvas from '$lib/components/Canvas.svelte'
	import RightPanel from '$lib/components/RightPanel.svelte'

	onMount(() => {
		editor.newTemplate()
		editor.compile()
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
<div class="editor-wrap">
	<Sidebar />
	<Canvas />
	<RightPanel />
</div>

<style>
	.editor-wrap {
		display: contents;
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
			background: #101010;
			padding: 32px;
		}
		.mg-card {
			text-align: center;
			max-width: 340px;
		}
		.mg-icon {
			margin: 0 auto 20px;
			opacity: 0.8;
			color: #ffd100;
			display: flex;
			justify-content: center;
		}
		.mg-card h2 {
			font-size: 20px;
			font-weight: 700;
			color: #fff;
			margin: 0 0 10px;
			letter-spacing: -0.5px;
		}
		.mg-card p {
			font-size: 14px;
			color: #666;
			line-height: 1.6;
			margin: 0 0 24px;
		}
		.mg-btn {
			display: inline-flex;
			padding: 10px 24px;
			background: #ffd100;
			color: #000;
			font-size: 14px;
			font-weight: 600;
			border-radius: 100px;
			text-decoration: none;
			transition: background 0.15s;
		}
		.mg-btn:hover {
			background: #e6bc00;
		}
	}
</style>
