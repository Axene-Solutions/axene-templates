<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<svelte:head>
	<title>Axene Templates</title>
</svelte:head>

{@render children()}
