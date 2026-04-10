<script lang="ts">
	let {
		top,
		right,
		bottom,
		left,
		onchange,
	}: {
		top: number;
		right: number;
		bottom: number;
		left: number;
		onchange: (key: string, value: number) => void;
	} = $props();

	const sides = [
		{ key: 'paddingTop', label: 'T' },
		{ key: 'paddingRight', label: 'R' },
		{ key: 'paddingBottom', label: 'B' },
		{ key: 'paddingLeft', label: 'L' },
	] as const;

	let values = $derived({ paddingTop: top, paddingRight: right, paddingBottom: bottom, paddingLeft: left });

	function handleInput(key: string, e: Event) {
		const raw = (e.target as HTMLInputElement).value;
		const num = Number(raw);
		if (!isNaN(num)) {
			onchange(key, num);
		}
	}
</script>

<div class="grid grid-cols-2 gap-1.5">
	{#each sides as side}
		<div class="bg-gray-50 border border-gray-200 rounded px-2 py-1 flex items-center gap-1">
			<span class="text-[9px] text-gray-400 shrink-0">{side.label}</span>
			<input
				type="number"
				class="bg-transparent text-xs text-gray-700 w-full text-right outline-none"
				value={values[side.key]}
				oninput={(e) => handleInput(side.key, e)}
			/>
		</div>
	{/each}
</div>
