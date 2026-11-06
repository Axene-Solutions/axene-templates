<!--
	CheckboxRow: a labelled checkbox as the right panel uses it (Show header row, Show divider
	line, Make template public). Yellow accent, 16px box.

	Usage:
		<CheckboxRow label="Show divider line" checked={p.showDivider} onchange={(on) => setProp('showDivider', on)} />
-->
<script lang="ts">
	interface Props {
		label: string;
		checked: boolean;
		onchange: (checked: boolean) => void;
	}
	let { label, checked, onchange }: Props = $props();
</script>

<label style="display:flex;align-items:center;gap:9px;font-size:13px;cursor:pointer"
	><input
		type="checkbox"
		{checked}
		onchange={(e) => onchange(e.currentTarget.checked)}
		style="accent-color:#ffd100;width:16px;height:16px;margin:0"
	/>{label}</label
>
