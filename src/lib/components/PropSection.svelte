<script lang="ts">
	import type { Snippet } from 'svelte'
	import Icon from './Icon.svelte'

	let {
		title,
		open = true,
		children,
	}: { title: string; open?: boolean; children: Snippet } = $props()

	let isOpen = $state(open)
</script>

<div class="prop-section">
	<button class="prop-header" onclick={() => (isOpen = !isOpen)}>
		<span class="prop-title">{title}</span>
		<div class="prop-chevron" class:closed={!isOpen}>
			<Icon name="chevronDown" width={10} height={10} />
		</div>
	</button>
	{#if isOpen}
		<div class="prop-body">
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.prop-section {
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}
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
	.prop-header:hover {
		background: rgba(255, 255, 255, 0.03);
	}
	.prop-title {
		font-size: 11.5px;
		font-weight: 600;
		color: #e0e0e0;
	}
	.prop-chevron {
		color: #555;
		transition: transform 0.2s;
	}
	.prop-chevron.closed {
		transform: rotate(-90deg);
	}
	.prop-body {
		padding: 0 12px 10px;
	}
</style>
