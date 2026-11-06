<!--
	PresetChips: a row of small mono chips (design class .chip) for quick values: email width
	presets 480 / 600 / 720, padding presets 0 to 32, corner presets. The chip equal to `value`
	is pressed (tinted, yellow ring).

	Usage:
		<PresetChips ariaLabel="Width presets" options={[480, 600, 720].map((v) => ({ value: v, label: String(v) }))}
			value={width} onpick={(v) => setWidth(v)} />
		<PresetChips lead="All sides" ... />   (adds the muted label in front, as Spacing does)
-->
<script lang="ts" generics="T extends string | number">
	interface Option {
		value: T;
		label: string;
		/** aria-label, for example "Set all sides to 8 pixels". */
		aria?: string;
	}
	interface Props {
		options: readonly Option[];
		value: T | null | undefined;
		onpick: (value: T) => void;
		/** Group label for screen readers (role=group). */
		ariaLabel?: string;
		/** Visible muted label before the chips. */
		lead?: string;
		/** Chips in the design's mono face (true) or the UI face (false, used by Use Axene logo style chips). */
		mono?: boolean;
	}
	let { options, value, onpick, ariaLabel, lead, mono = true }: Props = $props();
</script>

<div
	role={ariaLabel ? 'group' : undefined}
	aria-label={ariaLabel}
	style={lead ? 'display:flex;align-items:center;gap:6px;flex-wrap:wrap' : 'display:flex;gap:6px;flex-wrap:wrap'}
>
	{#if lead}<span class="lbl" style="margin-right:2px">{lead}</span>{/if}
	{#each options as o (o.value)}
		<button
			class="chip"
			class:ui={!mono}
			type="button"
			aria-pressed={value === o.value}
			aria-label={o.aria}
			style={value === o.value ? 'background:var(--color-surface-3);color:var(--color-text);box-shadow:0 0 0 2px #ffd100' : ''}
			onclick={() => onpick(o.value)}>{o.label}</button
		>
	{/each}
</div>

<style>
	.chip {
		border: 0;
		cursor: pointer;
		font: inherit;
		font-family: var(--font-mono);
		font-size: 11.5px;
		font-weight: 500;
		padding: 4px 9px;
		border-radius: 4px;
		background: var(--color-surface-2);
		color: var(--color-muted);
	}
	.chip.ui {
		font-family: inherit;
	}
	.chip:hover {
		color: var(--color-text);
	}
	.chip:focus-visible {
		outline: 2px solid #ffd100;
		outline-offset: 1px;
	}
	.lbl {
		font-size: 12px;
		font-weight: 600;
		color: var(--color-muted);
		user-select: none;
		-webkit-user-select: none;
	}
</style>
