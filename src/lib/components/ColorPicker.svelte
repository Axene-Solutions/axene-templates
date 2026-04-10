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
</script>

<div class="cp">
	<div class="cp-grid">
		{#each colorPalette as color}
			<button
				class="cp-swatch"
				style="background-color:{color};{color.toLowerCase() === '#ffffff' ? 'border:1px solid #e0e0e0;' : ''}{value.toLowerCase() === color.toLowerCase() ? `box-shadow:0 0 0 2px #fff,0 0 0 3.5px ${color === '#ffffff' ? '#aaa' : color};` : ''}"
				onclick={() => onchange(color)}
			></button>
		{/each}
	</div>
	<div class="cp-hex-row">
		<div class="cp-preview" style="background-color:{value};"></div>
		<div class="cp-hex-input">
			<span class="cp-hash">#</span>
			<input type="text" maxlength="6" value={hexInput} oninput={handleHexInput} />
		</div>
	</div>
</div>

<style>
	.cp { display: flex; flex-direction: column; gap: 8px; }
	.cp-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px; }
	.cp-swatch {
		width: 20px;
		height: 20px;
		border-radius: 4px;
		border: none;
		cursor: pointer;
		transition: transform 0.1s;
	}
	.cp-swatch:hover { transform: scale(1.15); }
	.cp-hex-row { display: flex; align-items: center; gap: 6px; }
	.cp-preview {
		width: 20px;
		height: 20px;
		border-radius: 4px;
		border: 1px solid #e0e0e0;
		flex-shrink: 0;
	}
	.cp-hex-input {
		display: flex;
		align-items: center;
		background: #fafafa;
		border: 1px solid #e8e8e8;
		border-radius: 5px;
		padding: 3px 7px;
		flex: 1;
	}
	.cp-hash { font-size: 11px; color: #bbb; }
	.cp-hex-input input {
		border: none;
		background: transparent;
		font-size: 11px;
		color: #333;
		outline: none;
		width: 100%;
		margin-left: 2px;
		font-family: inherit;
	}
</style>
