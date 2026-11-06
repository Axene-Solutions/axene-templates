<!--
	WarningsCard: the placeholder warnings card at the bottom of the right panel. Warning icon
	and "N placeholders to check", then each problem token in mono with its reason.
	Uses the Editor board's own warn colors (scoped here, light and dark).

	Usage:
		{#if issues.length}<WarningsCard warnings={issues.map((i) => ({ text: i.text, reason: i.reason }))} />{/if}
-->
<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';

	interface Props {
		warnings: readonly { text: string; reason: string }[];
		/** Defaults to "N placeholder(s) to check". */
		title?: string;
	}
	let { warnings, title }: Props = $props();

	const heading = $derived(title ?? warnings.length + ' placeholder' + (warnings.length === 1 ? '' : 's') + ' to check');
</script>

{#if warnings.length}
	<div class="warn-card" role="status" style="padding:12px;border-radius:12px;background:var(--p-warn-soft);display:flex;flex-direction:column;gap:6px">
		<div style="display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:700;color:var(--p-warn)">
			<Icon name="warning" width={15} height={15} />{heading}
		</div>
		{#each warnings as w, i (i)}
			<div style="font-size:12px;line-height:1.45">
				<span class="mono" style="font-size:11.5px">{w.text}</span> <span style="color:var(--color-muted)">{w.reason}</span>
			</div>
		{/each}
	</div>
{/if}

<style>
	.warn-card {
		--p-warn: #9a4a12;
		--p-warn-soft: #f8ece4;
	}
	:global([data-theme='dark']) .warn-card {
		--p-warn: #f0a36b;
		--p-warn-soft: rgba(240, 163, 107, 0.12);
	}
	.mono {
		font-family: var(--font-mono);
		user-select: none;
		-webkit-user-select: none;
	}
</style>
