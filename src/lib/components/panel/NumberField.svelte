<!--
	NumberField: the 36px tinted number field of the redesigned right panel (design class .nf).
	Left label (drag it sideways to scrub), right mono value, quiet unit. ArrowUp and ArrowDown
	step once, with Shift ten times. Values are clamped to min and max.

	Usage:
		<NumberField label="Size" value={p.fontSize} min={8} max={72} unit="px"
			mergeKey="fontSize" onchange={(v, key) => setProp('fontSize', v, key)} />

	onchange(value, mergeKey) fires live (typing, keys, every scrub step). During a scrub the
	key is `${mergeKey}:scrub` so the store can merge the whole drag into one undo step, and
	oncommit(value) fires once when the drag ends (also after a key step and on change/blur).
-->
<script lang="ts">
	import { fit, parseTyped, scrubValue, stepDecimals, stepValue } from '$lib/panel/number';

	interface Props {
		label: string;
		value: number;
		min: number;
		max: number;
		step?: number;
		unit?: string;
		/** aria-label of the input; defaults to the label. */
		ariaLabel?: string;
		/** Undo merge key passed back with onchange. Defaults to the label. */
		mergeKey?: string;
		onchange: (value: number, mergeKey: string) => void;
		oncommit?: (value: number) => void;
		disabled?: boolean;
	}

	let {
		label,
		value,
		min,
		max,
		step = 1,
		unit = '',
		ariaLabel,
		mergeKey,
		onchange,
		oncommit,
		disabled = false,
	}: Props = $props();

	const key = $derived(mergeKey ?? label);
	const mode = $derived(stepDecimals(step) ? 'decimal' : 'numeric');
	const range = $derived({ min, max, step });

	let input: HTMLInputElement | undefined = $state();
	let scrub: { id: number; x0: number; v0: number; last: number } | null = null;

	function onInput(e: Event & { currentTarget: HTMLInputElement }) {
		const v = parseTyped(e.currentTarget.value, range);
		if (v !== null) onchange(v, key);
	}

	function onChange(e: Event & { currentTarget: HTMLInputElement }) {
		// Empty or out of range text snaps back to the real value when the field settles.
		const v = parseTyped(e.currentTarget.value, range);
		if (v === null || String(v) !== e.currentTarget.value) e.currentTarget.value = String(value ?? '');
		if (v !== null) oncommit?.(v);
	}

	function onKey(e: KeyboardEvent) {
		if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
		e.preventDefault();
		const v = stepValue(Number(value) || 0, e.key === 'ArrowUp' ? 'up' : 'down', { ...range, shift: e.shiftKey });
		if (input) input.value = String(v);
		if (v !== value) onchange(v, key);
		oncommit?.(v);
	}

	function sDown(e: PointerEvent & { currentTarget: HTMLButtonElement }) {
		if (disabled) return;
		e.preventDefault();
		try {
			e.currentTarget.setPointerCapture(e.pointerId);
		} catch {
			/* ignore */
		}
		const v0 = Number(value) || 0;
		scrub = { id: e.pointerId, x0: e.clientX, v0, last: v0 };
	}

	function sMove(e: PointerEvent) {
		const h = scrub;
		if (!h || h.id !== e.pointerId) return;
		const v = scrubValue(h.v0, e.clientX - h.x0, { ...range, shift: e.shiftKey });
		if (v !== h.last) {
			h.last = v;
			onchange(v, key + ':scrub');
		}
	}

	function sUp(e: PointerEvent & { currentTarget: HTMLButtonElement }) {
		const h = scrub;
		if (!h) return;
		try {
			e.currentTarget.releasePointerCapture(e.pointerId);
		} catch {
			/* ignore */
		}
		scrub = null;
		if (h.last !== h.v0) oncommit?.(fit(h.last, range));
	}
</script>

<div class="nf">
	<button
		class="nf-l"
		type="button"
		tabindex="-1"
		aria-hidden="true"
		title="Drag to adjust"
		onpointerdown={sDown}
		onpointermove={sMove}
		onpointerup={sUp}
		onpointercancel={sUp}>{label}</button
	><input
		bind:this={input}
		class="nf-i"
		type="number"
		inputmode={mode}
		{min}
		{max}
		{step}
		{disabled}
		aria-label={ariaLabel ?? label}
		{value}
		oninput={onInput}
		onchange={onChange}
		onkeydown={onKey}
	/><span class="nf-u">{unit}</span>
</div>

<style>
	.nf {
		display: flex;
		align-items: center;
		gap: 6px;
		height: 36px;
		box-sizing: border-box;
		padding: 0 10px;
		border-radius: 8px;
		background: var(--color-surface-2);
		min-width: 0;
		user-select: none;
		-webkit-user-select: none;
	}
	.nf:focus-within {
		box-shadow: 0 0 0 2px #ffd100;
	}
	.nf-l {
		border: 0;
		background: transparent;
		padding: 0;
		margin: 0;
		font: inherit;
		font-size: 12px;
		font-weight: 500;
		color: var(--color-muted);
		cursor: ew-resize;
		white-space: nowrap;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
	}
	.nf-i {
		flex: 1;
		min-width: 0;
		width: 100%;
		border: 0;
		background: transparent;
		color: var(--color-text);
		font-family: var(--font-mono);
		font-size: 12.5px;
		text-align: right;
		outline: none;
		padding: 0;
		margin: 0;
		-moz-appearance: textfield;
		appearance: textfield;
	}
	.nf-i::-webkit-outer-spin-button,
	.nf-i::-webkit-inner-spin-button {
		-webkit-appearance: none;
		appearance: none;
		margin: 0;
	}
	.nf-u {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--color-muted);
		user-select: none;
		-webkit-user-select: none;
	}
</style>
