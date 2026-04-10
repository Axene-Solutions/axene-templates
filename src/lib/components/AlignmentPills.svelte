<script lang="ts">
	let { value, onchange }: { value: string; onchange: (align: string) => void } = $props();

	const options = [
		{ key: 'left', label: 'Left' },
		{ key: 'center', label: 'Center' },
		{ key: 'right', label: 'Right' },
	] as const;
</script>

<div class="flex gap-1">
	{#each options as opt}
		<button
			type="button"
			class="flex-1 flex items-center justify-center gap-1 py-1.5 border rounded-md text-[10px] cursor-pointer transition-colors
				{value === opt.key
				? 'border-[#1daa82] bg-[#edf8f4] text-[#1daa82]'
				: 'border-gray-200 text-gray-500 hover:border-gray-300'}"
			onclick={() => onchange(opt.key)}
		>
			{#if opt.key === 'left'}
				<svg class="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
					<line x1="2" y1="3" x2="14" y2="3" />
					<line x1="2" y1="7" x2="10" y2="7" />
					<line x1="2" y1="11" x2="12" y2="11" />
					<line x1="2" y1="15" x2="8" y2="15" />
				</svg>
			{:else if opt.key === 'center'}
				<svg class="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
					<line x1="1" y1="3" x2="15" y2="3" />
					<line x1="3" y1="7" x2="13" y2="7" />
					<line x1="2" y1="11" x2="14" y2="11" />
					<line x1="4" y1="15" x2="12" y2="15" />
				</svg>
			{:else}
				<svg class="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
					<line x1="2" y1="3" x2="14" y2="3" />
					<line x1="6" y1="7" x2="14" y2="7" />
					<line x1="4" y1="11" x2="14" y2="11" />
					<line x1="8" y1="15" x2="14" y2="15" />
				</svg>
			{/if}
			{opt.label}
		</button>
	{/each}
</div>
