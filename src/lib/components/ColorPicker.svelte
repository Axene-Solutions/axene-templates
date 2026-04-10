<script lang="ts">
	import { colorPalette } from '$lib/blocks';

	let { value, onchange }: { value: string; onchange: (hex: string) => void } = $props();

	let hexInput = $state(value.replace('#', ''));

	$effect(() => {
		hexInput = value.replace('#', '');
	});

	function handleHexInput(e: Event) {
		const raw = (e.target as HTMLInputElement).value.replace('#', '');
		hexInput = raw;
		if (/^[0-9a-fA-F]{3}$/.test(raw) || /^[0-9a-fA-F]{6}$/.test(raw)) {
			onchange(`#${raw}`);
		}
	}

	function selectSwatch(hex: string) {
		onchange(hex);
	}
</script>

<div class="flex flex-col gap-2">
	<div class="grid grid-cols-4 gap-1.5">
		{#each colorPalette as color}
			<button
				type="button"
				class="h-6 w-6 rounded-md cursor-pointer"
				style="background-color: {color};{color.toLowerCase() === '#ffffff' ? ' border: 1px solid #e5e7eb;' : ''}{value.toLowerCase() === color.toLowerCase() ? ` box-shadow: 0 0 0 2px white, 0 0 0 4px ${color === '#ffffff' ? '#9ca3af' : color};` : ''}"
				onclick={() => selectSwatch(color)}
			></button>
		{/each}
	</div>

	<div class="flex items-center gap-1.5">
		<div
			class="h-6 w-6 rounded-md shrink-0 border border-gray-200"
			style="background-color: {value};"
		></div>
		<div class="flex items-center bg-gray-50 border border-gray-200 rounded px-1.5 h-7 flex-1">
			<span class="text-xs text-gray-400">#</span>
			<input
				type="text"
				class="bg-transparent text-xs text-gray-700 w-full outline-none ml-0.5"
				maxlength="6"
				value={hexInput}
				oninput={handleHexInput}
			/>
		</div>
	</div>
</div>
