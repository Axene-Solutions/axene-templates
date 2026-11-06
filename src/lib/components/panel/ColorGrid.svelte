<!--
	ColorGrid: one color row of the right panel (design colorRow). Label with a quiet hint,
	the 14 swatch grid (7 per row, selected swatch gets the yellow ring) and the hex input with
	a color dot. The hex input keeps a draft while it is not a valid 3 or 6 digit hex, and
	applies the color as soon as it is. Used for Accent, Background, Text, Bullet, Link and
	border colors.

	Usage:
		<ColorGrid label="Accent color" hint="(buttons and theme)" value={theme}
			onchange={(hex, mergeKey) => setTheme(hex, mergeKey)} />

	onchange(hex, mergeKey): mergeKey is undefined for a swatch click and 'hex' while typing, so
	keystrokes can merge into one undo step. Pass onclear to show a Clear chip (for example to go
	back to a transparent background).
-->
<script lang="ts">
	import { PALETTE, currentHex, readHexDraft, type Swatch } from '$lib/panel/color';

	interface Props {
		label: string;
		hint?: string;
		/** Current color. Anything that is not a hex (transparent, theme) shows no selection. */
		value: string | null | undefined;
		onchange: (hex: string, mergeKey?: string) => void;
		onclear?: () => void;
		clearLabel?: string;
		swatches?: readonly Swatch[];
	}
	let { label, hint = '', value, onchange, onclear, clearLabel = 'Clear', swatches = PALETTE }: Props = $props();

	const cur = $derived(currentHex(value));
	let draft = $state<string | undefined>(undefined);
	let emitted: string | null = null;

	// A change that did not come from this input (undo, swatch, another control) drops the draft.
	$effect(() => {
		const v = cur;
		if (v !== emitted) draft = undefined;
	});

	function pick(hex: string) {
		draft = undefined;
		emitted = hex;
		onchange(hex);
	}

	function onHex(e: Event & { currentTarget: HTMLInputElement }) {
		const r = readHexDraft(e.currentTarget.value);
		draft = r.draft;
		if (r.hex) {
			emitted = r.hex;
			onchange(r.hex, 'hex');
		}
	}
</script>

<div style="display:flex;flex-direction:column;gap:8px">
	{#if onclear}
		<div style="display:flex;align-items:center;gap:8px">
			<div class="lbl" style="flex-grow:1">{label} <span style="font-weight:500">{hint}</span></div>
			<button class="chip" type="button" onclick={() => { draft = undefined; onclear?.(); }}>{clearLabel}</button>
		</div>
	{:else}
		<div class="lbl">{label} <span style="font-weight:500">{hint}</span></div>
	{/if}
	<div style="display:grid;grid-template-columns:repeat(7, minmax(0, 1fr));gap:7px;padding:2px">
		{#each swatches as w (w.hex)}
			<button
				class="sw"
				type="button"
				aria-label={w.name}
				aria-pressed={cur === w.hex}
				title={w.name}
				onclick={() => pick(w.hex)}
				style={'background:' +
					w.hex +
					';' +
					(w.hex === '#ffffff' ? 'box-shadow:inset 0 0 0 1px var(--color-surface-3);' : '') +
					(cur === w.hex ? 'outline:2px solid #ffd100;outline-offset:2px;' : '')}
			></button>
		{/each}
	</div>
	<div style="display:flex;align-items:center;gap:8px;padding:3px 10px;border-radius:8px;background:var(--color-surface-2)">
		<span
			style={'width:16px;height:16px;border-radius:4px;flex-shrink:0;background:' +
				(cur || 'transparent') +
				';box-shadow:inset 0 0 0 1px rgba(0,0,0,.18)'}
		></span>
		<span class="mono" style="font-size:12.5px;color:var(--color-muted)">#</span>
		<input
			class="mono hex"
			type="text"
			maxlength="6"
			spellcheck="false"
			autocomplete="off"
			aria-label={label + ' hex value'}
			value={draft !== undefined ? draft : cur.replace('#', '')}
			oninput={onHex}
		/>
	</div>
</div>

<style>
	.lbl {
		font-size: 12px;
		font-weight: 600;
		color: var(--color-muted);
		user-select: none;
		-webkit-user-select: none;
	}
	.mono {
		font-family: var(--font-mono);
		user-select: none;
		-webkit-user-select: none;
	}
	.hex {
		flex-grow: 1;
		min-width: 0;
		border: 0;
		background: transparent;
		color: var(--color-text);
		font-size: 12.5px;
		outline: none;
		padding: 6px 0;
		user-select: text;
		-webkit-user-select: text;
	}
	.sw {
		border: 0;
		cursor: pointer;
		padding: 0;
		aspect-ratio: 1;
		border-radius: 8px;
		width: 100%;
	}
	.sw:focus-visible {
		outline: 2px solid #ffd100;
		outline-offset: 2px;
	}
	.chip {
		border: 0;
		cursor: pointer;
		font: inherit;
		font-size: 11.5px;
		font-weight: 500;
		padding: 4px 9px;
		border-radius: 4px;
		background: var(--color-surface-2);
		color: var(--color-muted);
	}
	.chip:hover {
		color: var(--color-text);
	}
	.chip:focus-visible {
		outline: 2px solid #ffd100;
		outline-offset: 1px;
	}
</style>
