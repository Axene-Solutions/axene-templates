<!--
	SpacingFields: the block Spacing section body. A 2 by 2 grid of NumberFields (Top, Right,
	Bottom, Left, 0 to 80 px), the link-all-sides toggle and the All sides presets 0/8/16/24/32.
	While linked, editing any side sets all four (onchange receives every side).

	Usage:
		<SpacingFields value={{ top: p.padT, right: p.padR, bottom: p.padB, left: p.padL }}
			linked={padLinked} onlink={(on) => (padLinked = on)}
			onchange={(next, key) => setPads(next, key)} />

	onchange(next, mergeKey) gets the full four-side object; mergeKey is the side key
	(padT/padR/padB/padL, with :scrub while dragging) or undefined for a preset click.
-->
<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import NumberField from './NumberField.svelte';
	import PresetChips from './PresetChips.svelte';
	import { PAD_PRESETS, type Sides } from '$lib/panel/constants';

	interface Props {
		value: Sides;
		linked: boolean;
		onlink: (linked: boolean) => void;
		onchange: (next: Sides, mergeKey?: string) => void;
		oncommit?: (next: Sides) => void;
		min?: number;
		max?: number;
		presets?: readonly number[];
	}
	let { value, linked, onlink, onchange, oncommit, min = 0, max = 80, presets = PAD_PRESETS }: Props = $props();

	const SIDES: { side: keyof Sides; label: string; key: string }[] = [
		{ side: 'top', label: 'Top', key: 'padT' },
		{ side: 'right', label: 'Right', key: 'padR' },
		{ side: 'bottom', label: 'Bottom', key: 'padB' },
		{ side: 'left', label: 'Left', key: 'padL' },
	];

	const all = (v: number): Sides => ({ top: v, right: v, bottom: v, left: v });
	const set = (side: keyof Sides, v: number): Sides => (linked ? all(v) : { ...value, [side]: v });
	const allPad = $derived(
		value.top === value.right && value.top === value.bottom && value.top === value.left ? value.top : null,
	);
	const chipOptions = $derived(presets.map((v) => ({ value: v, label: String(v), aria: 'Set all sides to ' + v + ' pixels' })));
</script>

<div style="display:flex;align-items:center;gap:6px">
	<div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:6px;flex:1;min-width:0">
		{#each SIDES as s (s.side)}
			<NumberField
				label={s.label}
				value={value[s.side]}
				{min}
				{max}
				step={1}
				unit="px"
				ariaLabel={s.label + ' padding'}
				mergeKey={s.key}
				onchange={(v, key) => onchange(set(s.side, v), key)}
				oncommit={oncommit ? (v) => oncommit(set(s.side, v)) : undefined}
			/>
		{/each}
	</div>
	<button
		class="mini"
		type="button"
		aria-label="Link all four sides"
		title="Link all four sides"
		aria-pressed={linked}
		onclick={() => onlink(!linked)}
		style={'width:36px;height:36px;' +
			(linked ? 'background:var(--color-surface-3);color:var(--color-text);box-shadow:0 0 0 2px #ffd100' : 'background:var(--color-surface-2)')}
		><Icon name="link-a6e9" width={16} height={16} /></button
	>
</div>
<PresetChips lead="All sides" options={chipOptions} value={allPad} onpick={(v) => onchange(all(v))} />

<style>
	.mini {
		width: 26px;
		height: 26px;
		border-radius: 8px;
		border: 0;
		background: transparent;
		color: var(--color-muted);
		display: grid;
		place-items: center;
		cursor: pointer;
		padding: 0;
		flex-shrink: 0;
	}
	.mini:hover {
		background: var(--color-surface-3);
		color: var(--color-text);
	}
	.mini:focus-visible {
		outline: 2px solid #ffd100;
		outline-offset: 1px;
	}
</style>
