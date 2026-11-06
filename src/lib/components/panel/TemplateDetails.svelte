<!--
	TemplateDetails: the Styles tab's "Template details" body. Name input, Category select
	(options labelled "Group: Label" as the design builds them) and the Make template public
	checkbox.

	Usage:
		<TemplateDetails name={tplName} onname={(v) => (tplName = v)}
			category={cat} categories={CATEGORY_OPTIONS} oncategory={(v) => (cat = v)}
			isPublic={pub} onpublic={(on) => (pub = on)} />
-->
<script lang="ts">
	import CheckboxRow from './CheckboxRow.svelte';

	interface Props {
		name: string;
		onname: (value: string) => void;
		category: string;
		categories: readonly { value: string; label: string }[];
		oncategory: (value: string) => void;
		isPublic: boolean;
		onpublic: (on: boolean) => void;
		/** Hide the public checkbox (for example when the account cannot publish). */
		showPublic?: boolean;
	}
	let { name, onname, category, categories, oncategory, isPublic, onpublic, showPublic = true }: Props = $props();
</script>

<div style="display:flex;flex-direction:column;gap:6px">
	<span class="lbl">Name</span><input
		class="field"
		type="text"
		aria-label="Template name"
		value={name}
		oninput={(e) => onname(e.currentTarget.value)}
	/>
</div>
<div style="display:flex;flex-direction:column;gap:6px">
	<span class="lbl">Category</span><select
		class="field"
		aria-label="Category"
		value={category}
		onchange={(e) => oncategory(e.currentTarget.value)}
		style="cursor:pointer"
	>
		{#each categories as o (o.value)}<option value={o.value}>{o.label}</option>{/each}
	</select>
</div>
{#if showPublic}
	<CheckboxRow label="Make template public" checked={isPublic} onchange={onpublic} />
{/if}

<style>
	.lbl {
		font-size: 12px;
		font-weight: 600;
		color: var(--color-muted);
		user-select: none;
		-webkit-user-select: none;
	}
	.field {
		width: 100%;
		box-sizing: border-box;
		border: 0;
		border-radius: 8px;
		background: var(--color-surface-2);
		color: var(--color-text);
		font: inherit;
		font-size: 13px;
		padding: 9px 11px;
		outline: none;
	}
	.field:focus {
		box-shadow: 0 0 0 2px #ffd100;
	}
</style>
