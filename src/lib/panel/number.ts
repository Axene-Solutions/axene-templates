/**
 * Number field math for NumberField.svelte, from the editor design (numField): clamping,
 * snapping to the step, keyboard steps and label scrubbing. Tested in tests/panel-number.test.ts.
 *
 * Usage:
 *   const v = stepValue(12, 'up', { min: 0, max: 80, step: 1, shift: true })   // 22
 */

export interface Range {
	min: number;
	max: number;
	step: number;
}

/** Decimal places of the step (0.05 gives 2). */
export function stepDecimals(step: number): number {
	const s = String(step);
	return s.indexOf('.') >= 0 ? s.split('.')[1].length : 0;
}

export function clamp(v: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, v));
}

/** Snap to the step grid and clamp, rounded to the step's decimals (the design's fit). */
export function fit(v: number, r: Range): number {
	const dec = stepDecimals(r.step);
	return Number(clamp(Math.round(v / r.step) * r.step, r.min, r.max).toFixed(dec));
}

/** ArrowUp or ArrowDown: one step, or ten with Shift. */
export function stepValue(cur: number, dir: 'up' | 'down', r: Range & { shift?: boolean }): number {
	return fit((Number(cur) || 0) + (dir === 'up' ? 1 : -1) * (r.shift ? 10 : 1) * r.step, r);
}

/** Typed text to a value: null for empty or not a number (ignored), otherwise clamped (not snapped). */
export function parseTyped(raw: string, r: Pick<Range, 'min' | 'max'>): number | null {
	if (raw.trim() === '') return null;
	const n = Number(raw);
	if (Number.isNaN(n)) return null;
	return clamp(n, r.min, r.max);
}

/** Value while scrubbing the label: one step per 3 px of horizontal drag, ten with Shift. */
export function scrubValue(v0: number, dx: number, r: Range & { shift?: boolean }): number {
	return fit(v0 + Math.round(dx / 3) * r.step * (r.shift ? 10 : 1), r);
}
