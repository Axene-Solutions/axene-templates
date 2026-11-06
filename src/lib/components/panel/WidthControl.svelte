<!--
	WidthControl: the email width controls. A Width NumberField (320 to 800 px, step 10), the
	480 / 600 / 720 preset chips and, when `device` is given, the Desktop / Mobile preview
	switch that the email container's Layout section shows.

	Usage (Styles tab, Email width):
		<WidthControl value={tpl.width} onchange={(v, key) => setTpl({ width: v }, key)} />
	Usage (email container, Layout):
		<WidthControl value={tpl.width} onchange={...} device={device} ondevice={(d) => (device = d)} />
-->
<script lang="ts">
	import NumberField from './NumberField.svelte';
	import PresetChips from './PresetChips.svelte';
	import SegmentedControl from './SegmentedControl.svelte';
	import { WIDTH_PRESETS } from '$lib/panel/constants';

	interface Props {
		value: number;
		onchange: (value: number, mergeKey?: string) => void;
		oncommit?: (value: number) => void;
		min?: number;
		max?: number;
		step?: number;
		presets?: readonly number[];
		device?: 'desktop' | 'mobile';
		ondevice?: (device: 'desktop' | 'mobile') => void;
	}
	let { value, onchange, oncommit, min = 320, max = 800, step = 10, presets = WIDTH_PRESETS, device, ondevice }: Props = $props();

	const chips = $derived(presets.map((v) => ({ value: v, label: String(v) })));
	const DEVICES = [
		{ value: 'desktop' as const, label: 'Desktop' },
		{ value: 'mobile' as const, label: 'Mobile' },
	];
</script>

<NumberField label="Width" {value} {min} {max} {step} unit="px" ariaLabel="Email width" mergeKey="tplwidth" {onchange} {oncommit} />
<PresetChips ariaLabel="Width presets" options={chips} {value} onpick={(v) => onchange(v)} />
{#if device && ondevice}
	<SegmentedControl ariaLabel="Preview width" options={DEVICES} value={device} onchange={ondevice} />
{/if}
