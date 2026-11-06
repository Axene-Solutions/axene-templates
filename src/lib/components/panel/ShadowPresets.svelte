<!--
	ShadowPresets: the email container's Shadow choice, None / Soft / Medium / Strong, as a
	segmented control. The matching box-shadow values are SHADOWS in $lib/panel/constants.

	Usage:
		<ShadowPresets value={tpl.shadow} onchange={(v) => setTpl({ shadow: v })} />
-->
<script lang="ts">
	import SegmentedControl from './SegmentedControl.svelte';
	import { SHADOW_OPTIONS, type ShadowLevel } from '$lib/panel/constants';

	interface Props {
		value: ShadowLevel | string | null | undefined;
		onchange: (value: ShadowLevel) => void;
	}
	let { value, onchange }: Props = $props();
</script>

<SegmentedControl ariaLabel="Shadow" options={SHADOW_OPTIONS} value={value as ShadowLevel} {onchange} />
