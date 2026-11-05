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
		border: 1px solid rgba(255,255,255,0.08);
		border-radius: 5px;
		font-size: 10.5px;
		text-align: center;
		cursor: pointer;
		color: #888;
		background: transparent;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		transition: all 0.15s;
		font-family: inherit;
	}
	.ap-pill:hover { border-color: rgba(255,255,255,0.15); color: #ccc; }
	.ap-pill.active {
		border-color: #FFD100;
		background: rgba(255,209,0,0.08);
		color: #FFD100;
	}
</style>
