<!--
	SegmentedControl: the design's .segs / .seg control. Text (or icon) options on a tinted
	track; the selected one is a raised light tile (variant "soft", the design's segOn) or an
	inverted dark tile (variant "invert", used by Alignment and Weight, which the design styles
	with a .segs .seg[aria-pressed=true] rule: text-colored fill, background-colored ink). That rule
	lives in editor.css and, as on the board, only applies while the Alignment control is shown.

	Usage:
		<SegmentedControl ariaLabel="Border style" options={BORDER_STYLES} value={p.borderStyle}
			onchange={(v) => setProp('borderStyle', v)} />
		<SegmentedControl label="Weight" variant="invert" options={WEIGHTS} value={p.fontWeight} onchange={...} />
		<SegmentedControl role="tablist" stretch options={[{ value: 'customize', label: 'Customize' }, ...]} ... />

	role "group" (default) marks the selection with aria-pressed, role "tablist" uses role=tab
	and aria-selected. `label` wraps the control in the design's row with a muted label on the
	left. `stretch` makes the track fill the width with equal segments (the Customize / Styles tabs).
-->
<script lang="ts" generics="T extends string | number">
	import Icon from '$lib/components/Icon.svelte';
	import type { IconName } from '$lib/icons';

	interface Option {
		value: T;
		label: string;
		/** Show only this icon (15px) and use label as aria-label. */
		icon?: IconName;
	}
	interface Props {
		options: readonly Option[];
		value: T | null | undefined;
		onchange: (value: T) => void;
		ariaLabel?: string;
		/** Visible label on the left of the control (design row with .lbl flex-grow). */
		label?: string;
		variant?: 'soft' | 'invert';
		role?: 'group' | 'tablist';
		stretch?: boolean;
		/** Extra style for the track, for example align-self:flex-start. Defaults to the design's value for the layout. */
		style?: string;
	}
	let { options, value, onchange, ariaLabel, label, variant = 'soft', role = 'group', stretch = false, style }: Props = $props();

	const SEG_ON = 'background:var(--color-bg);color:var(--color-text);box-shadow:0 1px 3px rgba(0,0,0,.12)';
	const trackStyle = $derived(
		style ??
			(stretch ? 'align-self:stretch' : label ? '' : 'align-self:flex-start') + (variant === 'invert' ? ';border-radius: 12px' : ''),
	);
	const segStyle = (on: boolean) =>
		variant === 'invert' ? 'border-radius: 8px' : (on ? SEG_ON : '') + (stretch ? ';flex:1' : '');
</script>

{#snippet track()}
	<div class="segs" class:seg-invert={variant === 'invert'} {role} aria-label={ariaLabel ?? label} style={trackStyle}>
		{#each options as o (o.value)}
			{@const on = value === o.value}
			<button
				class="seg"
				type="button"
				role={role === 'tablist' ? 'tab' : undefined}
				aria-selected={role === 'tablist' ? on : undefined}
				aria-pressed={role === 'tablist' ? undefined : on}
				aria-label={o.icon ? o.label : undefined}
				style={segStyle(on)}
				onclick={() => onchange(o.value)}
			>
				{#if o.icon}<Icon name={o.icon} width={15} height={15} />{:else}{o.label}{/if}
			</button>
		{/each}
	</div>
{/snippet}

{#if label}
	<div style="display:flex;align-items:center;gap:8px">
		<span class="lbl" style="flex-grow:1">{label}</span>
		{@render track()}
	</div>
{:else}
	{@render track()}
{/if}

<style>
	.segs {
		display: inline-flex;
		padding: 3px;
		border-radius: 8px;
		background: var(--color-surface-2);
		gap: 2px;
	}
	.seg {
		border: 0;
		cursor: pointer;
		font-weight: 600;
		font-size: 12.5px;
		padding: 6px 11px;
		border-radius: 8px;
		background: transparent;
		color: var(--color-muted);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
	}
	.seg:hover {
		color: var(--color-text);
	}
	.seg:focus-visible {
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
