<!--
	AlignmentControl: the "Alignment" row of the Layout section. Muted label on the left and the
	left / center / right buttons with the textalign icons, in the inverted segmented style.

	Usage:
		<AlignmentControl value={p.align} onchange={(v) => setProp('align', v)} />
-->
<script lang="ts">
	import SegmentedControl from './SegmentedControl.svelte';
	import { ALIGNS, type Align } from '$lib/panel/constants';
	import type { IconName } from '$lib/icons';

	interface Props {
		value: Align | string | null | undefined;
		onchange: (value: Align) => void;
		label?: string;
	}
	let { value, onchange, label = 'Alignment' }: Props = $props();

	const ICON: Record<Align, IconName> = { left: 'textalign-left', center: 'textalign-center', right: 'textalign-right' };
	const options = ALIGNS.map((a) => ({ value: a.value, label: a.label, icon: ICON[a.value] }));
</script>

<SegmentedControl {label} ariaLabel="Alignment" variant="invert" {options} value={value as Align} {onchange} />
