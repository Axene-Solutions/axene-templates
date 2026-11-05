<script lang="ts">
	import Icon from './Icon.svelte';
	let { value, onchange }: { value: string; onchange: (align: string) => void } = $props();
</script>

<div class="ap">
	<button class="ap-pill" class:active={value === 'left'} onclick={() => onchange('left')}>
		<Icon name="align-left" width={12} height={12} />
		Left
	</button>
	<button class="ap-pill" class:active={value === 'center'} onclick={() => onchange('center')}>
		<Icon name="align-center" width={12} height={12} />
		Center
	</button>
	<button class="ap-pill" class:active={value === 'right'} onclick={() => onchange('right')}>
		<Icon name="align-right" width={12} height={12} />
		Right
	</button>
</div>

<style>
	.ap { display: flex; gap: 4px; }
	.ap-pill {
		flex: 1;
		padding: 5px 0;
		border: 1px solid var(--color-border-1);
		border-radius: 5px;
		font-size: 10.5px;
		text-align: center;
		cursor: pointer;
		color: var(--color-muted);
		background: transparent;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		transition: all 0.15s;
		font-family: inherit;
	}
	.ap-pill:hover { border-color: var(--color-border-1); color: var(--color-text); }
	.ap-pill.active {
		border-color: var(--color-accent);
		background: var(--color-accent-soft);
		color: var(--color-accent-ink);
	}
</style>
