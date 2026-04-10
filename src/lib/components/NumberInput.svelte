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
		const raw = (e.target as HTMLInputElement).value;
		const num = Number(raw);
		if (!isNaN(num)) {
			onchange(num);
		}
	}
</script>

<div class="flex items-center gap-1.5">
	<span class="text-[10px] text-gray-400 w-10 shrink-0">{label}</span>
	<input
		type="number"
		class="w-12 text-right bg-gray-50 border border-gray-200 rounded text-xs px-1.5 py-1 outline-none focus:border-gray-300"
		{value}
		{min}
		{max}
		oninput={handleInput}
	/>
	<span class="text-[10px] text-gray-400">{unit}</span>
</div>
