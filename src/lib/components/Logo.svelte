<script lang="ts">
	interface Props {
		size?: number
		alt?: string
		class?: string
	}

	let { size = 24, alt = 'Axene', class: className = '' }: Props = $props()
</script>

<!-- Dark mark on light themes, yellow mark on dark themes. Both are rendered and
     swapped with CSS so the correct one shows before hydration (no flash). -->
<img
	class={`logo logo-light ${className}`}
	src="/logos/axene_logo_black_square.webp"
	width={size}
	height={size}
	{alt}
/>
<img
	class={`logo logo-dark ${className}`}
	src="/logos/axene_logo_corrected.webp"
	width={size}
	height={size}
	alt=""
	aria-hidden="true"
/>

<style>
	.logo {
		display: block;
		object-fit: contain;
	}
	.logo-dark {
		display: none;
	}
	:global([data-theme='dark']) .logo-light {
		display: none;
	}
	:global([data-theme='dark']) .logo-dark {
		display: block;
	}
</style>
