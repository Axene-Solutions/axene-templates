<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		open = true,
		children,
	}: { title: string; open?: boolean; children: Snippet } = $props();

	let isOpen = $state(open);
</script>

<div class="prop-section">
	<button class="prop-header" onclick={() => isOpen = !isOpen}>
		<span class="prop-title">{title}</span>
		<svg class="prop-chevron" class:closed={!isOpen} width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5">
			<polyline points="2,3.5 5,6.5 8,3.5"/>
		</svg>
	</button>
	{#if isOpen}
		<div class="prop-body">
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.prop-section { border-bottom: 1px solid #f0f0f0; }
	.prop-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 9px 12px;
		border: none;
		background: none;
		cursor: pointer;
		font-family: inherit;
	}
	.prop-header:hover { background: #fafafa; }
	.prop-title { font-size: 11.5px; font-weight: 600; color: #1a1a1a; }
	.prop-chevron { color: #bbb; transition: transform 0.2s; }
	.prop-chevron.closed { transform: rotate(-90deg); }
	.prop-body { padding: 0 12px 10px; }
</style>
