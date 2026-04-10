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

<Sidebar />
<Canvas />
<RightPanel />
