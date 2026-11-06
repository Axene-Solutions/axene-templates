<script lang="ts">
	import { mailerData } from '$lib/mailer-data.svelte';
	import { BUILTIN_KEYS, splitForChips, type Tag } from '$lib/placeholders';

	// Shows text with its {{placeholders}} as quiet chips. The text stays literal, so what is
	// shown is exactly what is saved. A chip turns to a warning tint when Mailer would reject it.
	let { text }: { text: string } = $props();

	const parts = $derived(splitForChips(text ?? ''));

	function cls(tag: Tag): string {
		if (tag.kind === 'unsupported') return 'ph-bad';
		const fields = mailerData.knownFields;
		const links = mailerData.knownLinks;
		if (tag.kind === 'field' && fields && tag.fallback === null && !BUILTIN_KEYS.has(tag.key) && !fields.has(tag.key)) return 'ph-bad';
		if (tag.kind === 'link' && links && !links.has(tag.key)) return 'ph-bad';
		return tag.kind === 'link' ? 'ph-link' : 'ph-field';
	}
</script>

{#each parts as p, i (i)}{#if p.tag}<span class="ph {cls(p.tag)}">{p.text}</span>{:else}{p.text}{/if}{/each}

<style>
	/* Design chip (Editor.dc.html segs): scaled to the surrounding text. */
	.ph {
		font-family: 'JetBrains Mono', monospace; font-size: .7em; font-weight: 500; letter-spacing: 0;
		padding: 1px 6px; border-radius: 4px; line-height: 1.3; vertical-align: middle; white-space: nowrap;
		background: #ecf2fe; color: #1e40af;
	}
	.ph-link { background: #f4effe; color: #5b21b6; }
	.ph-bad { background: #fdeeec; color: #a8231a; }
</style>
