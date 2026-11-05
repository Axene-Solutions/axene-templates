<script lang="ts">
	import { onMount } from 'svelte';
	import { editor } from '$lib/store.svelte';
	import { mailerData } from '$lib/mailer-data.svelte';
	import { analyzePlaceholders } from '$lib/placeholders';
	import Icon from './Icon.svelte';

	// Lists placeholders that Mailer would not fill in. Fields and links are only judged once they
	// have been loaded from Mailer; Handlebars logic is always reported.
	let { variant = 'panel' }: { variant?: 'panel' | 'dialog' } = $props();

	onMount(() => {
		mailerData.loadFields();
		mailerData.loadLinks();
	});

	const issues = $derived(analyzePlaceholders(editor.blocks, { fields: mailerData.knownFields, links: mailerData.knownLinks }));
</script>

{#if issues.length}
	<div class="pw pw-{variant}" role="status">
		<div class="pw-head">
			<Icon name="warning" width={14} height={14} />
			<span>{issues.length} placeholder{issues.length === 1 ? '' : 's'} to check</span>
		</div>
		<ul class="pw-list">
			{#each issues as i (i.kind + i.text)}
				<li><span class="pw-mono">{i.text}</span> <span class="pw-reason">{i.reason}</span></li>
			{/each}
		</ul>
		{#if variant === 'dialog'}
			<p class="pw-foot">You can still save or send. Placeholders that Mailer cannot fill in make it reject a send.</p>
		{/if}
	</div>
{/if}

<style>
	.pw {
		margin: 10px; padding: 8px 10px; border-radius: 8px; line-height: 1.45;
		border: 1px solid var(--color-accent); background: var(--color-accent-soft); color: var(--color-accent-ink);
		font-size: 11px;
	}
	.pw-dialog { margin: 12px 0 0; font-size: 12.5px; }
	.pw-head { display: flex; align-items: center; gap: 6px; font-weight: 600; }
	.pw-list { margin: 6px 0 0 16px; padding: 0; list-style: disc; display: flex; flex-direction: column; gap: 3px; }
	.pw-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 0.95em; word-break: break-all; }
	.pw-reason { opacity: 0.9; }
	.pw-foot { margin: 6px 0 0; opacity: 0.9; }
</style>
