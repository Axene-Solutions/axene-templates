<script lang="ts">
	import claude from '$lib/brand/claude.svg?raw';
	import openai from '$lib/brand/openai.svg?raw';

	// Third party service marks for the AI buttons. The path comes from the vendored file, so no
	// raw HTML is rendered. They take the text colour, except Claude, which keeps its own orange.
	let { name, size = 16 }: { name: 'claude' | 'chatgpt'; size?: number } = $props();
	const d = $derived(/<path d="([^"]+)"/.exec(name === 'claude' ? claude : openai)?.[1] ?? '');
</script>

<svg class="bm" class:bm-claude={name === 'claude'} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path {d} /></svg>

<style>
	.bm { flex-shrink: 0; }
	.bm-claude { color: #d97757; }
</style>
