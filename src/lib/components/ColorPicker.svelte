<script lang="ts">
	import { colorPalette } from '$lib/blocks'

	let { value, onchange }: { value: string; onchange: (hex: string) => void } = $props()

	// A white swatch needs a visible outline on a themed surface.
	const isWhite = (c: string) => c.toLowerCase() === '#ffffff'
	const isTransparent = $derived(value === 'transparent')
	let hexInput = $state('')

	$effect(() => {
		hexInput = value === 'transparent' ? '' : value.replace('#', '')
	})

	function handleHexInput(e: Event) {
		const raw = (e.target as HTMLInputElement).value.replace('#', '')
		hexInput = raw
		if (/^[0-9a-fA-F]{3}$/.test(raw) || /^[0-9a-fA-F]{6}$/.test(raw)) {
			onchange(`#${raw}`)
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
				{@const ringColor = isWhite(color) ? 'var(--color-muted)' : color}
				<button
					class="cp-swatch"
					style="background-color:{color};{isWhite(color)
						? 'border:1.5px solid var(--color-border-1);'
						: ''}{active ? `box-shadow:0 0 0 2px var(--color-surface),0 0 0 3.5px ${ringColor};` : ''}"
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
				style="background-color:{value};{isWhite(value)
					? 'border:1px solid var(--color-border-1);'
					: ''}"
			></div>
			<div class="cp-hex-input">
				<span class="cp-hash">#</span>
				<input type="text" maxlength="6" value={hexInput} oninput={handleHexInput} />
			</div>
		{/if}
	</div>
</div>

<style>
	.cp {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

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
	.cp-swatch:hover {
		transform: scale(1.2);
	}

	/* Transparent / None swatch - checkerboard pattern */
	.cp-none {
		background-image: linear-gradient(45deg, var(--color-muted-soft) 25%, transparent 25%),
			linear-gradient(-45deg, var(--color-muted-soft) 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, var(--color-muted-soft) 75%),
			linear-gradient(-45deg, transparent 75%, var(--color-muted-soft) 75%);
		background-size: 6px 6px;
		background-position:
			0 0,
			0 3px,
			3px -3px,
			-3px 0;
		background-color: var(--color-surface);
		border: 1.5px solid var(--color-border-1) !important;
	}
	.cp-none.cp-active {
		box-shadow:
			0 0 0 2px var(--color-surface),
			0 0 0 3.5px var(--color-muted);
	}

	/* Hex input row */
	.cp-hex-row {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.cp-preview {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		flex-shrink: 0;
	}
	.cp-preview-none {
		background-image: linear-gradient(45deg, var(--color-muted-soft) 25%, transparent 25%),
			linear-gradient(-45deg, var(--color-muted-soft) 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, var(--color-muted-soft) 75%),
			linear-gradient(-45deg, transparent 75%, var(--color-muted-soft) 75%);
		background-size: 6px 6px;
		background-position:
			0 0,
			0 3px,
			3px -3px,
			-3px 0;
		background-color: var(--color-surface);
		border: 1px solid var(--color-border-1);
	}

	.cp-none-label {
		font-size: 11px;
		color: var(--color-muted);
	}

	.cp-hex-input {
		display: flex;
		align-items: center;
		background: var(--color-surface-2);
		border: 1px solid var(--color-border-1);
		border-radius: 5px;
		padding: 3px 7px;
		flex: 1;
	}
	.cp-hash {
		font-size: 11px;
		color: var(--color-muted-soft);
	}
	.cp-hex-input input {
		border: none;
		background: transparent;
		font-size: 11px;
		color: var(--color-text);
		outline: none;
		width: 100%;
		margin-left: 2px;
		font-family: inherit;
	}
</style>
