<script lang="ts">
	import claude from '$lib/brand/claude.svg?raw';
	import openai from '$lib/brand/openai.svg?raw';

	// Third party service marks for the AI buttons. They take the surrounding text colour, except
	// Claude, which keeps its own orange.
	let { name, size = 16 }: { name: 'claude' | 'chatgpt'; size?: number } = $props();
	const svg = $derived((name === 'claude' ? claude : openai).replace(/<title>.*?<\/title>/, ''));
</script>

<span class="bm" class:bm-claude={name === 'claude'} style="width:{size}px;height:{size}px" aria-hidden="true">{@html svg}</span>

<style>
	.bm { display: inline-flex; flex-shrink: 0; line-height: 0; }
	.bm :global(svg) { width: 100%; height: 100%; fill: currentColor; }
	.bm-claude { color: #d97757; }
</style>
