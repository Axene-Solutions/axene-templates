<script lang="ts">
	let {
		label,
		value,
		unit = 'px',
		min,
		max,
		onchange,
	}: {
		label: string;
		value: number;
		unit?: string;
		min?: number;
		max?: number;
		onchange: (v: number) => void;
	} = $props();

	function handleInput(e: Event) {
		const num = Number((e.target as HTMLInputElement).value);
		if (!isNaN(num)) onchange(num);
	}
</script>

<div class="ni">
	<span class="ni-label">{label}</span>
	<input class="ni-input" type="number" {value} {min} {max} oninput={handleInput} />
	<span class="ni-unit">{unit}</span>
</div>

<style>
	.ni { display: flex; align-items: center; gap: 5px; }
	.ni-label { font-size: 10.5px; color: var(--color-muted); width: 38px; flex-shrink: 0; }
	.ni-input {
		width: 44px;
		border: 1px solid var(--color-border-1);
		border-radius: 4px;
		padding: 3px 5px;
		font-size: 11px;
		color: var(--color-text);
		background: var(--color-surface-2);
		text-align: right;
		outline: none;
		font-family: inherit;
		-moz-appearance: textfield;
	}
	.ni-input::-webkit-inner-spin-button,
	.ni-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
	.ni-input:focus { border-color: var(--color-accent); }
	.ni-unit { font-size: 10px; color: var(--color-muted-soft); }
</style>
