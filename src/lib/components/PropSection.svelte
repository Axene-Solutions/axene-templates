<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		open = true,
		children,
	}: { title: string; open?: boolean; children: Snippet } = $props();

	let isOpen = $state(open);

	function toggle() {
		isOpen = !isOpen;
	}
</script>

<div class="border-b border-gray-100">
	<button
		type="button"
		class="flex items-center justify-between w-full py-2 px-3 cursor-pointer"
		onclick={toggle}
	>
		<span class="text-xs font-semibold text-gray-700">{title}</span>
		<svg
			class="w-3.5 h-3.5 text-gray-400 transition-transform duration-200"
			style="transform: rotate({isOpen ? '0' : '-90'}deg);"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if isOpen}
		<div class="px-3 pb-3">
			{@render children()}
		</div>
	{/if}
</div>
