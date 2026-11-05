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
	.ph {
		font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 0.88em;
		border-radius: 4px; padding: 0 4px; background: var(--color-accent-soft); color: var(--color-accent-ink);
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-accent) 55%, transparent);
	}
	.ph-link { background: var(--color-info-soft); color: var(--color-info); box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-info) 55%, transparent); }
	.ph-bad { background: var(--color-danger-soft); color: var(--color-danger); box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-danger) 55%, transparent); }
</style>
