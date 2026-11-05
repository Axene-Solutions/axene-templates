<script lang="ts">
	import { icons, type IconName } from '$lib/icons'

	interface Props {
		name: IconName
		width?: string | number
		height?: string | number
		class?: string
		label?: string
	}

	let { name, width = 24, height = 24, class: className = '', label }: Props = $props()

	const px = (v: string | number) => (typeof v === 'number' ? `${v}px` : v)
	const svg = $derived(icons[name])
</script>

<span
	class={`icon-wrapper ${className}`}
	style="--icon-width: {px(width)}; --icon-height: {px(height)};"
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : 'true'}
>
	{@html svg}
</span>

<style>
	.icon-wrapper {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--icon-width, 24px);
		height: var(--icon-height, 24px);
		flex-shrink: 0;
		line-height: 0;
	}

	.icon-wrapper :global(svg) {
		width: 100%;
		height: 100%;
		display: block;
	}
</style>
