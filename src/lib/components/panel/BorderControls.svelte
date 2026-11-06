<!--
	BorderControls: border style (None / Solid / Dashed / Dotted segmented), then, when the
	style is not None, an optional Width field and the Border color grid. The email container
	passes `width` (1 to 8 px); a block border leaves it out, as in the design.

	Usage (block):
		<BorderControls borderStyle={p.borderStyle} onstyle={(v) => setProp('borderStyle', v)}
			color={p.borderColor} oncolor={(hex, key) => setProp('borderColor', hex, key)} />
	Usage (email container):
		<BorderControls borderStyle={tpl.bStyle} onstyle={...} width={tpl.bWidth} onwidth={(v, key) => setTpl({ bWidth: v }, key)}
			color={tpl.bColor} oncolor={...} />
-->
<script lang="ts">
	import ColorGrid from './ColorGrid.svelte';
	import NumberField from './NumberField.svelte';
	import SegmentedControl from './SegmentedControl.svelte';
	import { BORDER_STYLES, type BorderStyle } from '$lib/panel/constants';

	interface Props {
		borderStyle: BorderStyle | string | null | undefined;
		onstyle: (value: BorderStyle) => void;
		color: string | null | undefined;
		oncolor: (hex: string, mergeKey?: string) => void;
		/** Border width in px. Omit to hide the Width field. */
		width?: number;
		onwidth?: (value: number, mergeKey: string) => void;
		widthMin?: number;
		widthMax?: number;
		widthAria?: string;
	}
	let { borderStyle, onstyle, color, oncolor, width, onwidth, widthMin = 1, widthMax = 8, widthAria = 'Email border width' }: Props = $props();

	const hasBorder = $derived(!!borderStyle && borderStyle !== 'none');
</script>

<SegmentedControl ariaLabel="Border style" options={BORDER_STYLES} value={borderStyle as BorderStyle} onchange={onstyle} />
{#if hasBorder}
	{#if width !== undefined && onwidth}
		<NumberField label="Width" value={width} min={widthMin} max={widthMax} unit="px" ariaLabel={widthAria} mergeKey="ebw" onchange={onwidth} />
	{/if}
	<ColorGrid label="Border color" value={color} onchange={oncolor} />
{/if}
