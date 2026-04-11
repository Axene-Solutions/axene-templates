<script lang="ts">
	import { colorPalette } from '$lib/blocks';

	let { value, onchange }: { value: string; onchange: (hex: string) => void } = $props();

	const isTransparent = $derived(value === 'transparent');
	let hexInput = $state('');

	$effect(() => {
		hexInput = value === 'transparent' ? '' : value.replace('#', '');
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
			{#if color === 'transparent'}
				<button
					class="cp-swatch cp-none"
					class:cp-active={isTransparent}
					title="None / Transparent"
					onclick={() => onchange('transparent')}
				></button>
			{:else}
				{@const active = !isTransparent && value.toLowerCase() === color.toLowerCase()}
				{@const ringColor = color.toLowerCase() === '#ffffff' ? '#999' : color}
				<button
					class="cp-swatch"
					style="background-color:{color};{color.toLowerCase() === '#ffffff' ? 'border:1.5px solid #ddd;' : ''}{active ? `box-shadow:0 0 0 2px #fff,0 0 0 3.5px ${ringColor};` : ''}"
					title={color}
					onclick={() => onchange(color)}
				></button>
			{/if}
		{/each}
	</div>
	<div class="cp-hex-row">
		{#if isTransparent}
			<div class="cp-preview cp-preview-none"></div>
			<span class="cp-none-label">None / Transparent</span>
		{:else}
			<div
				class="cp-preview"
				style="background-color:{value};{value.toLowerCase() === '#ffffff' ? 'border:1px solid #ddd;' : ''}"
			></div>
			<div class="cp-hex-input">
				<span class="cp-hash">#</span>
				<input type="text" maxlength="6" value={hexInput} oninput={handleHexInput} />
			</div>
		{/if}
	</div>
</div>

<style>
	.cp { display: flex; flex-direction: column; gap: 8px; }

	.cp-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 4px;
	}

	.cp-swatch {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		border: none;
		cursor: pointer;
		transition: transform 0.12s;
		box-sizing: border-box;
		flex-shrink: 0;
	}
	.cp-swatch:hover { transform: scale(1.2); }

	/* Transparent / None swatch — checkerboard pattern */
	.cp-none {
		background-image:
			linear-gradient(45deg, #d0d0d0 25%, transparent 25%),
			linear-gradient(-45deg, #d0d0d0 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, #d0d0d0 75%),
			linear-gradient(-45deg, transparent 75%, #d0d0d0 75%);
		background-size: 6px 6px;
		background-position: 0 0, 0 3px, 3px -3px, -3px 0;
		background-color: #fff;
		border: 1.5px solid #ddd !important;
	}
	.cp-none.cp-active {
		box-shadow: 0 0 0 2px #fff, 0 0 0 3.5px #999;
	}

	/* Hex input row */
	.cp-hex-row { display: flex; align-items: center; gap: 6px; }

	.cp-preview {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		flex-shrink: 0;
	}
	.cp-preview-none {
		background-image:
			linear-gradient(45deg, #d0d0d0 25%, transparent 25%),
			linear-gradient(-45deg, #d0d0d0 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, #d0d0d0 75%),
			linear-gradient(-45deg, transparent 75%, #d0d0d0 75%);
		background-size: 6px 6px;
		background-position: 0 0, 0 3px, 3px -3px, -3px 0;
		background-color: #fff;
		border: 1px solid rgba(255,255,255,0.1);
	}

	.cp-none-label {
		font-size: 11px;
		color: #666;
	}

	.cp-hex-input {
		display: flex;
		align-items: center;
		background: rgba(255,255,255,0.04);
		border: 1px solid rgba(255,255,255,0.08);
		border-radius: 5px;
		padding: 3px 7px;
		flex: 1;
	}
	.cp-hash { font-size: 11px; color: #555; }
	.cp-hex-input input {
		border: none;
		background: transparent;
		font-size: 11px;
		color: #ddd;
		outline: none;
		width: 100%;
		margin-left: 2px;
		font-family: inherit;
	}
</style>
