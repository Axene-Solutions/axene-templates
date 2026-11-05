<script lang="ts">
	import { onMount } from 'svelte'
	import Icon from './Icon.svelte'
	import { theme } from '$lib/stores/theme.svelte'

	interface Props {
		/** "cycle" is a single icon button (light, dark, system). "segmented" shows all three. */
		variant?: 'cycle' | 'segmented'
	}
	let { variant = 'cycle' }: Props = $props()

	const modes = [
		{ value: 'light', label: 'Light', icon: 'sun' },
		{ value: 'dark', label: 'Dark', icon: 'moon' },
		{ value: 'system', label: 'System', icon: 'monitor' },
	] as const

	// The server cannot read the theme cookie, so it renders "system". Show the
	// stored mode only after mount so hydration does not keep a stale state.
	let mounted = $state(false)
	onMount(() => (mounted = true))
	const mode = $derived(mounted ? theme.mode : 'system')

	const current = $derived(modes.find((m) => m.value === mode) ?? modes[2])
	const next = $derived(modes[(modes.indexOf(current) + 1) % modes.length])
</script>

{#if variant === 'segmented'}
	<div class="tt-seg" role="group" aria-label="Theme">
		{#each modes as m (m.value)}
			<button
				type="button"
				class="tt-seg-btn"
				class:active={mode === m.value}
				title={`${m.label} theme`}
				aria-label={`${m.label} theme`}
				aria-pressed={mode === m.value}
				onclick={() => theme.set(m.value)}
			>
				<Icon name={m.icon} width={14} height={14} />
			</button>
		{/each}
	</div>
{:else}
	<button
		type="button"
		class="tt-cycle"
		title={`Theme: ${current.label}. Click for ${next.label}`}
		aria-label={`Theme: ${current.label}. Switch to ${next.label}`}
		onclick={() => theme.set(next.value)}
	>
		<Icon name={current.icon} width={16} height={16} />
	</button>
{/if}

<style>
	.tt-cycle {
		width: 30px;
		height: 30px;
		border-radius: 7px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: var(--color-muted);
		border: none;
		background: transparent;
		transition:
			background 0.12s,
			color 0.12s;
	}
	.tt-cycle:hover {
		background: var(--color-surface-2);
		color: var(--color-text);
	}
	.tt-seg {
		display: inline-flex;
		gap: 2px;
		padding: 2px;
		border: 1px solid var(--color-border-1);
		border-radius: 999px;
	}
	.tt-seg-btn {
		width: 26px;
		height: 26px;
		border-radius: 999px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		border: none;
		background: transparent;
		color: var(--color-muted);
		transition:
			background 0.12s,
			color 0.12s;
	}
	.tt-seg-btn:hover {
		color: var(--color-text);
	}
	.tt-seg-btn.active {
		background: var(--color-surface-2);
		color: var(--color-text);
	}
</style>
