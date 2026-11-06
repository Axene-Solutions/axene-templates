<script lang="ts">
	import { editor, view, dnd } from '$lib/store.svelte';
	import { TYPE_NAME, type Block } from '$lib/blocks';
	import { fontCss, SHADOWS } from '$lib/template-settings';
	import CanvasBlock from './CanvasBlock.svelte';
	import Icon from './Icon.svelte';

	// The email canvas (Editor.dc.html, <main aria-label="Email canvas">).

	type Side = 'top' | 'bottom' | 'left' | 'right';
	let hdrag = $state<{ id: string; side: Side; val: number } | null>(null);
	let hd: { id: string; side: Side; x0: number; y0: number; v0: number; last: number | null } | null = null;
	let tagTimer: ReturnType<typeof setTimeout> | undefined;

	const S = $derived(editor.settings);
	const cpx = $derived(editor.cornerPx);
	const W = $derived(view.device === 'mobile' ? 375 : S.width);
	const emailSel = $derived(editor.selectedKind === 'container');
	const emailRing = $derived(emailSel && !view.preview && !dnd.dragging);
	const emailWrap = $derived(
		'position:relative;z-index:1;box-sizing:border-box;margin:0 auto;background:' + S.bg + ';width:' + W + 'px;max-width:100%;border-radius:' + cpx + 'px;box-shadow:' + SHADOWS[S.shadow] + ';' +
			(S.bStyle !== 'none' ? 'border:' + S.bWidth + 'px ' + S.bStyle + ' ' + S.bColor + ';' : '') +
			'padding:' + S.pad + 'px;color:' + S.textColor + ';font-family:' + fontCss(S.font) + ';transition:width .2s' +
			(emailRing ? ';outline:2px solid #ffd100;outline-offset:0' : dnd.draggingNew ? ';outline:2px dashed var(--bar);outline-offset:6px' : '')
	);
	const mainStyle = $derived('flex-grow:1;min-width:0;background:' + (S.pageBg || 'var(--s2)') + ';border-radius:16px;margin:0 0 16px;overflow:auto;padding:0;position:relative');

	function selectEmail() {
		if (!view.preview) {
			editor.selectContainer();
			view.rightTab = 'customize';
		}
	}
	function pick(e: MouseEvent, id: string) {
		(e.currentTarget as HTMLElement).focus();
		if (!view.preview) {
			editor.selectBlock(id);
			view.rightTab = 'customize';
		}
	}
	function blockKey(e: KeyboardEvent, id: string) {
		if (view.modal || view.preview) return;
		if (e.key === 'Backspace' || e.key === 'Delete') {
			e.preventDefault();
			view.requestDelete(id);
		}
	}
	function gripKey(e: KeyboardEvent, id: string) {
		if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
			e.preventDefault();
			editor.moveBlock(id, e.key === 'ArrowUp' ? 'up' : 'down');
		}
	}

	// ---- padding and width handles ----
	function lim(b: Block, side: Side): [number, number] {
		const isW = side === 'left' || side === 'right';
		return isW ? (b.type === 'image' ? [80, 600] : [40, 600]) : [0, 80];
	}
	const propOf = (side: Side) => (side === 'top' ? 'paddingTop' : side === 'bottom' ? 'paddingBottom' : 'width');
	function fit(b: Block, side: Side, v: number) {
		const [lo, hi] = lim(b, side);
		return Math.max(lo, Math.min(hi, Math.round(v / 4) * 4));
	}
	function cur(b: Block, side: Side, el: HTMLElement | null): number {
		if (side === 'top' || side === 'bottom') return Number(b.props[propOf(side)]) || 0;
		const w = Number(b.props.width) || 0;
		if (w > 0) return w;
		const t = el?.parentElement?.querySelector('[data-w]');
		return t ? Math.round(t.getBoundingClientRect().width) : 200;
	}
	function apply(b: Block, side: Side, v: number) {
		editor.setProp(b.id, propOf(side), v, 'hd' + side);
		hdrag = { id: b.id, side, val: v };
	}
	function hDown(e: PointerEvent, b: Block, side: Side) {
		e.preventDefault();
		e.stopPropagation();
		try {
			(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		} catch {
			/* ignore */
		}
		hd = { id: b.id, side, x0: e.clientX, y0: e.clientY, v0: cur(b, side, e.currentTarget as HTMLElement), last: null };
		hdrag = { id: b.id, side, val: hd.v0 };
	}
	function hMove(e: PointerEvent, b: Block, side: Side) {
		const h = hd;
		if (!h || h.id !== b.id || h.side !== side) return;
		const isW = side === 'left' || side === 'right';
		const k = isW && b.props.align === 'center' ? 2 : 1;
		const sign = side === 'top' || side === 'left' ? -1 : 1;
		const d = isW ? (e.clientX - h.x0) * k : e.clientY - h.y0;
		const v = fit(b, side, h.v0 + sign * d);
		if (v !== h.last) {
			h.last = v;
			apply(b, side, v);
		}
	}
	function hUp(e: PointerEvent) {
		if (!hd) return;
		try {
			(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
		} catch {
			/* ignore */
		}
		hd = null;
		hdrag = null;
	}
	function hKey(e: KeyboardEvent, b: Block, side: Side) {
		const isW = side === 'left' || side === 'right';
		const sign = side === 'top' || side === 'left' ? -1 : 1;
		const map: Record<string, number> = isW ? { ArrowRight: sign, ArrowLeft: -sign } : { ArrowUp: -sign, ArrowDown: sign };
		const d = map[e.key];
		if (!d) return;
		e.preventDefault();
		e.stopPropagation();
		apply(b, side, fit(b, side, cur(b, side, e.currentTarget as HTMLElement) + d * 4));
		clearTimeout(tagTimer);
		tagTimer = setTimeout(() => (hdrag = null), 900);
	}
	const aria = (b: Block, side: Side) => 'Drag to change ' + (side === 'left' || side === 'right' ? b.type + ' width' : side + ' padding');
	const tagPos = (side: Side) =>
		side === 'top' ? 'left:calc(50% + 24px);top:6px' : side === 'bottom' ? 'left:calc(50% + 24px);bottom:6px' : side === 'left' ? 'left:14px;top:calc(50% + 18px)' : 'right:14px;top:calc(50% + 18px)';
	const corner = 'position:absolute;width:10px;height:10px;border-radius:4px;background:#ffd100;box-shadow:0 0 0 2px var(--bg),0 1px 3px rgba(0,0,0,.25);pointer-events:none;z-index:6;';
	const line = 'height:3px;background:#ffd100;margin:-1.5px 0;position:relative;z-index:4';
</script>

<main aria-label="Email canvas" style={mainStyle}>
	<div style="position:relative;min-height:100%;box-sizing:border-box;padding:56px 24px 40px">
		<button type="button" aria-label="Select the email container" title="Select the email container" onclick={selectEmail} style="position:absolute;inset:0;width:100%;height:100%;border:0;padding:0;margin:0;background:transparent;cursor:default;z-index:0;border-radius:inherit"></button>
		{#if view.preview}
			<div style="display:flex;align-items:center;gap:10px;max-width:640px;margin:-36px auto 16px;font-size:12.5px;color:var(--muted);position:relative;z-index:1">
				<span style="flex-grow:1;line-height:1.5">Preview shows placeholders as written. Fallbacks and named links are filled in when you send.</span>
				<button class="btn" type="button" style="background:var(--bg)" onclick={() => view.setPreview(false)}><Icon name="close" width={13} height={13} />Exit preview</button>
			</div>
			{#if editor.compileError && !editor.previewHtml}
				<div role="alert" style="position:relative;z-index:1;max-width:640px;margin:0 auto;padding:14px;border-radius:12px;background:var(--bg);font-size:13px;display:flex;align-items:center;gap:10px">
					<span style="flex-grow:1">{editor.compileError}</span>
					<button class="btn" type="button" onclick={() => editor.compile()}>Retry</button>
				</div>
			{:else}
				<!-- The compiled email, exactly as recipients get it. Template HTML is untrusted:
				     sandbox="" gives it an opaque origin with no scripts, forms, popups or top
				     navigation. Do not add allow-scripts or allow-same-origin. -->
				<iframe
					sandbox=""
					srcdoc={editor.previewHtml}
					title="Email preview"
					style="position:relative;z-index:1;display:block;margin:0 auto;width:{W + 64}px;max-width:100%;height:calc(100vh - 220px);min-height:520px;border:0;border-radius:12px;background:{S.pageBg || '#f5f5f5'}"
				></iframe>
			{/if}
		{:else}
			<div style={emailWrap}>
				<button type="button" aria-label="Select the email container" title="Select the email container" onclick={selectEmail} style="position:absolute;inset:0;width:100%;height:100%;border:0;padding:0;margin:0;background:transparent;cursor:pointer;z-index:0;border-radius:inherit"></button>
				{#each editor.blocks as b, i (b.id)}
					{@const on = editor.selectedId === b.id}
					{@const pinned = b.type === 'header' || b.type === 'footer'}
					{#if dnd.dropIdx === i}<div style={line}></div>{/if}
					<div style={'position:relative;z-index:1;' + (on ? 'outline:2px solid #ffd100;outline-offset:0;border-radius:4px;z-index:5;' : '') + (dnd.dragging === b.id ? 'opacity:.4;' : '')}>
						<button class="blk" type="button" draggable={pinned ? 'false' : 'true'} ondragstart={(e) => dnd.start(e, { id: b.id })} ondragover={(e) => dnd.over(e, i)} ondrop={(e) => dnd.drop(e)} ondragend={() => dnd.end()} aria-label={'Edit ' + TYPE_NAME[b.type] + ' block'} aria-pressed={on} onclick={(e) => pick(e, b.id)} onkeydown={(e) => blockKey(e, b.id)}>
							<CanvasBlock block={b} ctx={{ theme: editor.themeColor, cpx, first: i === 0, last: i === editor.blocks.length - 1 }} />
						</button>
						{#if on}
							<span aria-hidden="true" style="position:absolute;inset:0;border-radius:4px;background:rgba(255,209,0,.07);pointer-events:none;z-index:4"></span>
							{#if !dnd.dragging}
								<span aria-hidden="true" style="{corner}left:-6px;top:-6px"></span>
								<span aria-hidden="true" style="{corner}right:-6px;top:-6px"></span>
								<span aria-hidden="true" style="{corner}left:-6px;bottom:-6px"></span>
								<span aria-hidden="true" style="{corner}right:-6px;bottom:-6px"></span>
								{#each ['top', 'bottom'] as const as side (side)}
									<button class="hdl" type="button" aria-label={aria(b, side)} title={aria(b, side)} onpointerdown={(e) => hDown(e, b, side)} onpointermove={(e) => hMove(e, b, side)} onpointerup={hUp} onpointercancel={hUp} onkeydown={(e) => hKey(e, b, side)} style="left:50%;top:{side === 'top' ? '0' : '100%'};width:28px;height:8px;transform:translate(-50%, -50%)"></button>
								{/each}
								{#if b.type === 'button' || b.type === 'image'}
									{#each ['left', 'right'] as const as side (side)}
										<button class="hdl" type="button" aria-label={aria(b, side)} title={aria(b, side)} onpointerdown={(e) => hDown(e, b, side)} onpointermove={(e) => hMove(e, b, side)} onpointerup={hUp} onpointercancel={hUp} onkeydown={(e) => hKey(e, b, side)} style="left:{side === 'left' ? '0' : '100%'};top:50%;width:8px;height:28px;transform:translate(-50%, -50%);cursor:ew-resize"></button>
									{/each}
								{/if}
							{/if}
							{#if !pinned}
								<button class="grip" type="button" draggable="true" aria-label="Drag to move block, or use the up and down keys" title="Drag to move" ondragstart={(e) => dnd.start(e, { id: b.id })} ondragend={() => dnd.end()} onkeydown={(e) => gripKey(e, b.id)} style={dnd.dragging === b.id ? 'opacity:.5;cursor:grabbing' : ''}>{#each [0, 1, 2, 3, 4, 5] as k (k)}<span style="width:3px;height:3px;background:var(--muted)"></span>{/each}</button>
							{/if}
							{#if hdrag && hdrag.id === b.id}
								<span role="status" style="position:absolute;z-index:8;pointer-events:none;padding:2px 7px;border-radius:4px;background:#1a1a17;color:#f2f1ec;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:500;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,.2);{tagPos(hdrag.side)}">{hdrag.val} px</span>
							{/if}
							<div role="toolbar" aria-label="Block actions" style="position:absolute;left:50%;top:-54px;transform:translateX(-50%);display:flex;align-items:center;gap:2px;padding:5px;border-radius:12px;background:#1a1a17;color:#f2f1ec;box-shadow:0 12px 32px rgba(0,0,0,.30);z-index:6;white-space:nowrap">
								<span style="font-size:12px;font-weight:700;letter-spacing:.01em;padding:0 10px;height:32px;display:inline-flex;align-items:center;border-radius:8px;background:rgba(255,255,255,.10);margin-right:6px;color:#f2f1ec">{TYPE_NAME[b.type]}</span>
								<button class="tbb" type="button" title="Move up" aria-label="Move up" onclick={() => editor.moveBlock(b.id, 'up')} style={editor.canMove(b.id, 'up') ? 'color:#f2f1ec' : 'color:#f2f1ec;opacity:.3;pointer-events:none'}><Icon name="arrow-up4" width={18} height={18} /></button>
								<button class="tbb" type="button" title="Move down" aria-label="Move down" onclick={() => editor.moveBlock(b.id, 'down')} style={editor.canMove(b.id, 'down') ? 'color:#f2f1ec' : 'color:#f2f1ec;opacity:.3;pointer-events:none'}><Icon name="arrow-down4" width={18} height={18} /></button>
								{#if !pinned}<span aria-hidden="true" style="width:8px;flex-shrink:0"></span><button class="tbb" type="button" title="Duplicate" aria-label="Duplicate" onclick={() => editor.duplicateBlock(b.id)}><Icon name="copy" width={18} height={18} /></button>{/if}
								<button class="tbb tbb-del" type="button" title="Delete block (Backspace)" aria-label="Delete block" onclick={() => view.requestDelete(b.id)}><Icon name="trash" width={18} height={18} /></button>
							</div>
						{/if}
					</div>
				{/each}
				{#if dnd.dropIdx !== null && dnd.dropIdx === editor.blocks.length}<div style={line}></div>{/if}
				{#if editor.blocks.length === 0}<div style="padding:60px 24px;text-align:center;color:#6b7280;font-size:14px">Empty email. Add a block from the left panel.</div>{/if}
				{#if emailRing}
					<span aria-hidden="true" style="{corner}left:-6px;top:-6px"></span><span aria-hidden="true" style="{corner}right:-6px;top:-6px"></span><span aria-hidden="true" style="{corner}left:-6px;bottom:-6px"></span><span aria-hidden="true" style="{corner}right:-6px;bottom:-6px"></span><span aria-hidden="true" style="position:absolute;left:0;top:-32px;z-index:6;font-size:12px;font-weight:700;padding:4px 9px;border-radius:4px;background:#1a1a17;color:#f2f1ec;pointer-events:none;font-family:'Figtree',system-ui,sans-serif">Email</span>
				{/if}
			</div>
		{/if}
	</div>
</main>
