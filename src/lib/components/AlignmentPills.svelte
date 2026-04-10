<script lang="ts">
	let { value, onchange }: { value: string; onchange: (align: string) => void } = $props();
</script>

<div class="ap">
	<button class="ap-pill" class:active={value === 'left'} onclick={() => onchange('left')}>
		<svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" stroke-width="1.2">
			<line x1="1" y1="2.5" x2="8" y2="2.5"/><line x1="1" y1="4.5" x2="6" y2="4.5"/><line x1="1" y1="6.5" x2="7" y2="6.5"/>
		</svg>
		Left
	</button>
	<button class="ap-pill" class:active={value === 'center'} onclick={() => onchange('center')}>
		<svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" stroke-width="1.2">
			<line x1="1" y1="2.5" x2="8" y2="2.5"/><line x1="2" y1="4.5" x2="7" y2="4.5"/><line x1="1.5" y1="6.5" x2="7.5" y2="6.5"/>
		</svg>
		Center
	</button>
	<button class="ap-pill" class:active={value === 'right'} onclick={() => onchange('right')}>
		<svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" stroke-width="1.2">
			<line x1="1" y1="2.5" x2="8" y2="2.5"/><line x1="3" y1="4.5" x2="8" y2="4.5"/><line x1="2" y1="6.5" x2="8" y2="6.5"/>
		</svg>
		Right
	</button>
</div>

<style>
	.ap { display: flex; gap: 4px; }
	.ap-pill {
		flex: 1;
		padding: 5px 0;
		border: 1px solid #e0e0e0;
		border-radius: 5px;
		font-size: 10.5px;
		text-align: center;
		cursor: pointer;
		color: #666;
		background: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		transition: all 0.15s;
		font-family: inherit;
	}
	.ap-pill:hover { border-color: #ccc; color: #333; }
	.ap-pill.active {
		border-color: #1daa82;
		background: #edf8f4;
		color: #1daa82;
	}
</style>
