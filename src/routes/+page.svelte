<script lang="ts">
	import { onMount } from 'svelte';
	import { editor } from '$lib/store.svelte';
	import NavRail from '$lib/components/NavRail.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Canvas from '$lib/components/Canvas.svelte';
	import RightPanel from '$lib/components/RightPanel.svelte';

	onMount(() => editor.compile());
</script>

<svelte:head>
	<title>{editor.templateName} - Axene Templates</title>
</svelte:head>

<div class="h-screen w-screen bg-[#c8dfc8] flex items-center justify-center p-4 overflow-hidden">
	<div class="bg-[#f2f2f2] w-full max-w-[1220px] h-[calc(100vh-32px)] max-h-[820px] rounded-2xl shadow-2xl flex overflow-hidden ring-1 ring-black/5">
		<Sidebar />
		<Canvas />
		<RightPanel />
	</div>
</div>
