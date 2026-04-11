<script lang="ts">
	let {
		top, right, bottom, left, onchange,
	}: {
		top: number; right: number; bottom: number; left: number;
		onchange: (key: string, value: number) => void;
	} = $props();

	const sides = [
		{ key: 'paddingTop', label: 'T', get val() { return top; } },
		{ key: 'paddingRight', label: 'R', get val() { return right; } },
		{ key: 'paddingBottom', label: 'B', get val() { return bottom; } },
		{ key: 'paddingLeft', label: 'L', get val() { return left; } },
	];

	function handleInput(key: string, e: Event) {
		const num = Number((e.target as HTMLInputElement).value);
		if (!isNaN(num)) onchange(key, num);
	}
</script>

<div class="sp-grid">
	{#each sides as side}
		<div class="sp-cell">
			<svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="#ccc" stroke-width="1"><rect x="1" y="1" width="7" height="7" rx="0.5"/></svg>
			<span class="sp-label">{side.label}</span>
			<input class="sp-input" type="number" value={side.val} oninput={(e) => handleInput(side.key, e)} />
		</div>
	{/each}
</div>

<style>
	.sp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
	.sp-cell {
		border: 1px solid rgba(255,255,255,0.08);
		border-radius: 4px;
		padding: 4px 6px;
		background: rgba(255,255,255,0.04);
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.sp-label { font-size: 9px; color: #555; }
	.sp-input {
		border: none;
		background: transparent;
		font-size: 11px;
		color: #ddd;
		width: 100%;
		text-align: right;
		outline: none;
		font-family: inherit;
		-moz-appearance: textfield;
	}
	.sp-input::-webkit-inner-spin-button,
	.sp-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
</style>
