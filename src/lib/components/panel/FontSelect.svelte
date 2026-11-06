<!--
	FontSelect: the searchable font family select of the design (Styles > Font family and the
	email container's Typography). A combobox button showing the current font in its own face
	with a Web font / Email-safe tag; it opens a popup with a search box and a grouped listbox
	(Sans serif web fonts, Serif web fonts, Email-safe system fonts), each row in its own
	typeface with its tag and a check on the selected one. The help text follows the select.

	Keyboard: on the button ArrowDown / ArrowUp open. In the search box ArrowUp / ArrowDown move
	(wrapping), Home / End jump to the first / last font, Enter picks, Esc closes and returns
	focus to the button, Tab closes. Clicking outside closes.

	Usage:
		<FontSelect value={tpl.font} onchange={(name) => setTpl({ font: name })} />

	The component loads the Google Fonts CSS for the web fonts (loadFonts, default true) so each
	row previews in its face.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { FONTS, fontByName, fontTag, googleFontsUrl, type FontDef } from '$lib/fonts';
	import { wrapIndex } from '$lib/panel/suggest';

	interface Props {
		value: string;
		onchange: (name: string) => void;
		fonts?: readonly FontDef[];
		/** Show the "Web fonts show here in the editor..." help line under the select. */
		help?: boolean;
		loadFonts?: boolean;
		ariaLabel?: string;
		/** Called when the list is about to be needed (pointer over, focus, open), to load its fonts. */
		onwarm?: () => void;
	}
	let { value, onchange, fonts = FONTS, help = true, loadFonts = true, ariaLabel = 'Font family', onwarm }: Props = $props();

	const uid = $props.id();
	const listId = `font-list-${uid}`;
	const optId = (i: number) => `font-opt-${uid}-${i}`;

	let open = $state(false);
	let q = $state('');
	let idx = $state(0);
	let btn: HTMLButtonElement | undefined = $state();
	let search: HTMLInputElement | undefined = $state();
	let listEl: HTMLDivElement | undefined = $state();

	const cur = $derived(fontByName(value, fonts));
	const fontsUrl = $derived(loadFonts ? googleFontsUrl(fonts) : '');
	const needle = $derived(q.trim().toLowerCase());
	const shown = $derived(fonts.filter((f) => !needle || f.name.toLowerCase().includes(needle)));
	const rows = $derived.by(() => {
		const out: ({ kind: 'group'; label: string } | { kind: 'font'; f: FontDef; i: number })[] = [];
		let last = '';
		shown.forEach((f, i) => {
			if (f.group !== last) {
				out.push({ kind: 'group', label: f.group });
				last = f.group;
			}
			out.push({ kind: 'font', f, i });
		});
		return out;
	});
	const hl = $derived(Math.max(0, Math.min(idx, shown.length - 1)));

	async function openList() {
		onwarm?.();
		q = '';
		idx = Math.max(0, fonts.findIndex((f) => f.name === cur.name));
		open = true;
		await tick();
		// The board does not scroll the list to the current font on open, only on arrow keys.
		search?.focus();
	}

	async function close(refocus: boolean) {
		open = false;
		q = '';
		if (refocus) {
			await tick();
			btn?.focus();
		}
	}

	function pick(f: FontDef) {
		onchange(f.name);
		close(true);
	}

	async function scrollTo(i: number) {
		await tick();
		const el = listEl?.querySelector<HTMLElement>('#' + CSS.escape(optId(i)));
		el?.scrollIntoView?.({ block: 'nearest' });
	}

	function move(i: number) {
		idx = i;
		scrollTo(i);
	}

	function btnKey(e: KeyboardEvent) {
		if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !open) {
			e.preventDefault();
			openList();
		} else if (e.key === 'Escape' && open) {
			e.preventDefault();
			close(true);
		}
	}

	function searchKey(e: KeyboardEvent) {
		const n = shown.length;
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault();
			if (n) move(wrapIndex(hl, e.key === 'ArrowDown' ? 1 : -1, n));
			return;
		}
		if (e.key === 'Home' || e.key === 'End') {
			e.preventDefault();
			if (n) move(e.key === 'Home' ? 0 : n - 1);
			return;
		}
		if (e.key === 'Enter') {
			e.preventDefault();
			const f = shown[hl];
			if (f) pick(f);
			return;
		}
		if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			close(true);
			return;
		}
		if (e.key === 'Tab') close(false);
	}

	const rowStyle = (on: boolean, h: boolean) =>
		'display:flex;align-items:center;gap:10px;width:100%;min-height:36px;box-sizing:border-box;padding:0 10px;border:0;border-radius:8px;cursor:pointer;text-align:left;font:inherit;background:' +
		(h ? 'var(--color-surface-2)' : on ? 'var(--color-surface-2)' : 'transparent') +
		(h ? ';box-shadow:inset 0 0 0 1.5px var(--color-surface-3)' : '');
	const sample = (f: FontDef) =>
		'font-family:' + f.css + ';font-size:15px;color:var(--color-text);flex-grow:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
</script>

<svelte:head>
	{#if fontsUrl}<link rel="stylesheet" href={fontsUrl} />{/if}
</svelte:head>

<div style="position:relative">
	<button
		bind:this={btn}
		type="button"
		class="field"
		role="combobox"
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-controls={listId}
		aria-label={ariaLabel}
		onclick={() => (open ? close(false) : openList())}
		onkeydown={btnKey}
		onpointerenter={() => onwarm?.()}
		onfocus={() => onwarm?.()}
		style="display:flex;align-items:center;gap:8px;height:36px;padding:0 11px;text-align:left;cursor:pointer"
		><span
			style={'font-family:' +
				cur.css +
				';font-size:14px;font-weight:600;flex-grow:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--color-text)'}
			>{cur.name}</span
		><span class="tag">{fontTag(cur)}</span><span style="display:flex;color:var(--color-muted)"
			><Icon name="arrow-down4" width={14} height={14} /></span
		></button
	>
	{#if open}
		<button
			type="button"
			tabindex="-1"
			aria-label="Close font list"
			onclick={() => close(false)}
			style="position:fixed;inset:0;width:100%;height:100%;border:0;padding:0;margin:0;background:transparent;cursor:default;z-index:39"
		></button>
		<div
			style="position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:40;background:var(--color-bg);border-radius:12px;box-shadow:0 16px 40px rgba(0,0,0,.22),0 2px 6px rgba(0,0,0,.08);padding:6px;display:flex;flex-direction:column;gap:4px"
		>
			<label style="position:relative;display:block"
				><span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--color-muted);display:flex"
					><Icon name="search" width={14} height={14} /></span
				><input
					bind:this={search}
					class="field"
					type="text"
					role="combobox"
					aria-expanded="true"
					aria-controls={listId}
					aria-activedescendant={shown.length ? optId(hl) : undefined}
					aria-autocomplete="list"
					aria-label="Search fonts"
					placeholder="Search fonts"
					autocomplete="off"
					spellcheck="false"
					bind:value={q}
					oninput={() => (idx = 0)}
					onkeydown={searchKey}
					style="padding-left:31px;background:var(--color-surface-2)"
				/></label
			>
			<div bind:this={listEl} role="listbox" id={listId} aria-label="Fonts" style="max-height:320px;overflow:auto;display:flex;flex-direction:column;gap:1px">
				{#each rows as r (r.kind === 'group' ? 'g:' + r.label : r.f.name)}
					{#if r.kind === 'group'}
						<div class="cap" style="padding:9px 10px 4px">{r.label}</div>
					{:else}
						{@const on = r.f.name === cur.name}
						<button
							type="button"
							role="option"
							id={optId(r.i)}
							aria-selected={on}
							tabindex="-1"
							onmousedown={(e) => e.preventDefault()}
							onmouseenter={() => {
								if (idx !== r.i) idx = r.i;
							}}
							onclick={() => pick(r.f)}
							style={rowStyle(on, r.i === hl)}
							><span style={sample(r.f)}>{r.f.name}</span><span style="font-size:11px;color:var(--color-muted);white-space:nowrap"
								>{fontTag(r.f)}</span
							><span style="display:flex;width:16px;color:var(--color-text)"
								>{#if on}<Icon name="done" width={16} height={16} />{/if}</span
							></button
						>
					{/if}
				{/each}
			</div>
			{#if !shown.length}<div style="padding:12px 10px;font-size:12.5px;color:var(--color-muted)">No font matches that search.</div>{/if}
			<div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;padding:6px 8px 4px;font-size:11px;color:var(--color-muted)">
				<span class="kbd" style="display:inline-flex;align-items:center;gap:1px;padding:2px 4px" aria-label="Up and down"
					><Icon name="arrow-up4" width={10} height={10} /><Icon name="arrow-down4" width={10} height={10} /></span
				>to move<span class="kbd" style="margin-left:6px">Enter</span>to select<span class="kbd" style="margin-left:6px">Esc</span>to close
			</div>
		</div>
	{/if}
</div>
{#if help}
	<div style="font-size:12px;line-height:1.5;color:var(--color-muted)">
		Web fonts show here in the editor. Some mail apps cannot load web fonts and use the fallback that follows the name (Arial or
		Georgia), so Email-safe fonts look the same everywhere.
	</div>
{/if}

<style>
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
	.field::placeholder {
		color: var(--color-muted);
	}
	.tag {
		font-size: 10.5px;
		font-weight: 600;
		padding: 2px 6px;
		border-radius: 4px;
		background: var(--color-surface-3);
		color: var(--color-muted);
		white-space: nowrap;
	}
	.cap {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--color-muted);
		user-select: none;
		-webkit-user-select: none;
	}
	.kbd {
		font-family: var(--font-mono);
		font-size: 10.5px;
		font-weight: 500;
		color: var(--color-muted);
		padding: 1px 5px;
		border-radius: 4px;
		background: var(--color-surface-3);
	}
</style>
