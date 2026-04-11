<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { editor } from '$lib/store.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Canvas from '$lib/components/Canvas.svelte';
	import RightPanel from '$lib/components/RightPanel.svelte';

	let { data } = $props();

	onMount(() => {
		if (!data.template) {
			goto('/templates');
			return;
		}
		editor.setTemplate(data.template.id, data.template.name, data.template.blocks);
		editor.compile();
	});
</script>

<svelte:head>
	<title>{editor.templateName} - Editor - Axene Templates</title>
</svelte:head>

<div class="mobile-gate">
	<div class="mg-card">
		<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFD100" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
			<rect x="2" y="3" width="20" height="14" rx="2"/>
			<line x1="8" y1="21" x2="16" y2="21"/>
			<line x1="12" y1="17" x2="12" y2="21"/>
		</svg>
		<h2>Larger screen needed</h2>
		<p>The email editor requires a desktop or tablet display to work properly. Please switch to a device with a wider screen.</p>
		<a href="/" class="mg-btn">Back to home</a>
	</div>
</div>

<div class="editor-wrap">
	<Sidebar />
	<Canvas />
	<RightPanel />
</div>

<style>
	.editor-wrap { display: contents; }
	.mobile-gate { display: none; }

	@media (max-width: 860px) {
		.editor-wrap { display: none !important; }
		.mobile-gate {
			display: flex; flex: 1; align-items: center; justify-content: center;
			background: #101010; padding: 32px;
		}
		.mg-card { text-align: center; max-width: 340px; }
		.mg-card svg { margin: 0 auto 20px; opacity: 0.8; }
		.mg-card h2 { font-size: 20px; font-weight: 700; color: #fff; margin: 0 0 10px; letter-spacing: -0.5px; }
		.mg-card p { font-size: 14px; color: #666; line-height: 1.6; margin: 0 0 24px; }
		.mg-btn {
			display: inline-flex; padding: 10px 24px; background: #FFD100; color: #000;
			font-size: 14px; font-weight: 600; border-radius: 100px; text-decoration: none;
		}
		.mg-btn:hover { background: #e6bc00; }
	}
</style>
