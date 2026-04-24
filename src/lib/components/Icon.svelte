<script lang="ts">
	import { icons } from '$lib/icons/icons.ts'

	interface Props {
		name: keyof typeof icons
		width?: string | number
		height?: string | number
		class?: string
	}

	let { name, width = 24, height = 24, class: className = '' }: Props = $props()

	const svgString = icons[name]
	const computedWidth = typeof width === 'number' ? `${width}px` : width
	const computedHeight = typeof height === 'number' ? `${height}px` : height
</script>

<div
	class={`icon-wrapper ${className}`}
	style="--icon-width: {computedWidth}; --icon-height: {computedHeight};"
>
	{@html svgString}
</div>

<style>
	.icon-wrapper {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--icon-width, 24px);
		height: var(--icon-height, 24px);
		flex-shrink: 0;
	}

	:global(.icon-wrapper svg) {
		width: 100%;
		height: 100%;
	}
</style>
