<script lang="ts">
	import { editor, view, dnd } from '$lib/store.svelte';
	import { BLOCK_ORDER, TYPE_NAME, type BlockType } from '$lib/blocks';
	import Icon from './Icon.svelte';

	let blockQuery = $state('');
	let blockSecOpen = $state(true);
	let tplSecOpen = $state(true);

	const OB = '{' + '{';
	const CB = '}' + '}';
	const tok = (inner: string) => OB + inner + CB;

	const tiles = $derived.by(() => {
		const q = blockQuery.trim().toLowerCase();
		return BLOCK_ORDER.filter((ty) => !q || TYPE_NAME[ty].toLowerCase().includes(q)).map((ty) => {
			const disabled = (ty === 'header' || ty === 'footer') && editor.has(ty);
			return {
				ty,
				label: TYPE_NAME[ty],
				disabled,
				title: disabled ? 'Only one ' + TYPE_NAME[ty].toLowerCase() + ' per email' : 'Add ' + TYPE_NAME[ty].toLowerCase(),
				style: disabled ? 'opacity:.4;cursor:not-allowed' : editor.lastTile === ty ? 'box-shadow:0 0 0 2px #ffd100;color:var(--text)' : '',
			};
		});
	});
	const listRows = ['flex:1;height:3px', 'flex:1;height:3px', 'width:28px;height:3px'];

	const sh = (w: string, h: number, c?: string) => 'display:block;width:' + w + ';height:' + h + 'px;border-radius:1px;background:' + (c || 'var(--bar)');
	type Preset = { label: string; sub: string; shape: string[]; list: [BlockType, Record<string, any>?][] };
	const presets: Preset[] = [
		{
			label: 'Promo', sub: 'Image, heading, text, button', shape: [sh('100%', 16), sh('70%', 4), sh('100%', 2), sh('45%', 6, 'var(--bar2)')],
			list: [['image', { alt: 'Weekend offer' }], ['heading', { text: 'This weekend only' }], ['content', { text: 'Take 20% off everything until Sunday night.' }], ['button', { text: 'Shop the offer' }]],
		},
		{
			label: 'Receipt', sub: 'Heading, table, button', shape: [sh('60%', 4), sh('100%', 4), sh('100%', 4), sh('45%', 6, 'var(--bar2)')],
			list: [['heading', { text: 'Thanks for your order, ' + tok('first_name|friend') }], ['table', { col1Header: 'Item', col2Header: 'Amount', rows: [{ col1: 'Your item', col2: 'KES 1,200' }, { col1: 'Delivery', col2: 'KES 200' }] }], ['button', { text: 'Track order' }]],
		},
		{
			label: 'Newsletter', sub: 'Heading, image, list', shape: [sh('70%', 4), sh('100%', 14), sh('90%', 2), sh('80%', 2)],
			list: [['heading', { text: 'This month at Your Company' }], ['subheading', { text: 'What is new, what is next and one useful tip.' }], ['image', { alt: 'Featured image' }], ['list', { items: ['A new feature is live', 'Our next event is on the 12th', 'Tip: reply to this email with questions'] }]],
		},
		{
			label: 'Note', sub: 'Section with a callout', shape: [sh('100%', 12, 'var(--bar2)'), sh('80%', 2), sh('60%', 2)],
			list: [['section', { text: 'Heads up: deliveries pause on public holidays.' }]],
		},
	];
	function addPreset(p: Preset) {
		const n = editor.addGroup(p.list);
		if (n) {
			view.rightTab = 'customize';
			view.say(n + ' blocks added');
		}
	}
	function addTile(ty: BlockType, disabled: boolean) {
		if (disabled) return;
		editor.addBlock(ty);
		view.rightTab = 'customize';
	}

	function pick(e: MouseEvent, id: string) {
		(e.currentTarget as HTMLElement).focus();
		editor.selectBlock(id);
		view.rightTab = 'customize';
	}
	function rowKey(e: KeyboardEvent, id: string) {
		if (view.modal || view.preview) return;
		if (e.key === 'Backspace' || e.key === 'Delete') {
			e.preventDefault();
			view.requestDelete(id);
		}
	}
	const segOn = (on: boolean) => (on ? 'background:var(--bg);color:var(--text);box-shadow:0 1px 3px rgba(0,0,0,.12)' : '');
	const inLayers = $derived(view.leftTab === 'layers');
	const emailSel = $derived(editor.selectedKind === 'container');
</script>

<aside aria-label="Blocks and layers" style="width:256px;flex-shrink:0;padding:4px 12px 16px 16px;box-sizing:border-box;display:flex;flex-direction:column;gap:12px;overflow:auto">
	<div class="segs" role="tablist" style="align-self:stretch">
		<button class="seg" role="tab" type="button" aria-selected={inLayers} style={segOn(inLayers) + ';flex:1'} onclick={() => (view.leftTab = 'layers')}>Layers</button>
		<button class="seg" role="tab" type="button" aria-selected={!inLayers} style={segOn(!inLayers) + ';flex:1'} onclick={() => (view.leftTab = 'blocks')}>Blocks</button>
	</div>

	{#if !inLayers}
		<label style="position:relative;display:block"><span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--muted);display:flex"><Icon name="search" width={14} height={14} /></span><input class="field" style="padding-left:31px" type="text" placeholder="Search blocks" aria-label="Search blocks" bind:value={blockQuery} /></label>

		<button class="sec" type="button" onclick={() => (blockSecOpen = !blockSecOpen)} aria-expanded={blockSecOpen}><span style="flex-grow:1">Block</span><span style="display:flex;color:var(--muted)"><Icon name={blockSecOpen ? 'arrow-up4' : 'arrow-down4'} width={14} height={14} /></span></button>
		{#if blockSecOpen}
			<div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:8px">
				{#each tiles as t (t.ty)}
					<button class="tile" type="button" draggable={t.disabled ? 'false' : 'true'} ondragstart={(e) => { if (!t.disabled) dnd.start(e, { type: t.ty }); }} ondragend={() => dnd.end()} onclick={() => addTile(t.ty, t.disabled)} aria-disabled={t.disabled} title={t.title} style={t.style}>
						<span class="ill">
							{#if t.ty === 'header'}<span style="width:56px;height:26px;border-radius:2px;background:var(--bar);display:flex;align-items:center;justify-content:center;gap:5px"><span style="width:8px;height:8px;border-radius:2px;background:var(--bg)"></span><span style="width:26px;height:3px;border-radius:1px;background:var(--bg)"></span></span>{/if}
							{#if t.ty === 'heading'}<span class="bar" style="width:50px;height:6px"></span><span class="bar" style="width:32px;height:3px"></span>{/if}
							{#if t.ty === 'subheading'}<span class="bar" style="width:44px;height:4px"></span><span class="bar" style="width:54px;height:3px"></span><span class="bar" style="width:36px;height:3px"></span>{/if}
							{#if t.ty === 'content'}<span class="bar" style="width:56px;height:3px"></span><span class="bar" style="width:56px;height:3px"></span><span class="bar" style="width:56px;height:3px"></span><span class="bar" style="width:34px;height:3px;align-self:flex-start;margin-left:1px"></span>{/if}
							{#if t.ty === 'image'}<span style="width:54px;height:32px;box-sizing:border-box;border-radius:2px;box-shadow:inset 0 0 0 2px var(--bar);position:relative;overflow:hidden;display:block"><span style="position:absolute;left:7px;top:6px;width:7px;height:7px;border-radius:1px;box-shadow:inset 0 0 0 2px var(--bar)"></span><span style="position:absolute;left:0;right:0;bottom:0;height:16px;background:var(--bar);clip-path:polygon(0 100%, 30% 25%, 58% 65%, 80% 35%, 100% 60%, 100% 100%)"></span></span>{/if}
							{#if t.ty === 'button'}<span class="bar" style="width:44px;height:3px"></span><span style="width:56px;height:11px;border-radius:2px;background:var(--bar2)"></span>{/if}
							{#if t.ty === 'list'}{#each listRows as w, i (i)}<span style="display:flex;align-items:center;gap:6px;width:56px"><span style="width:5px;height:5px;border-radius:1px;background:var(--bar);flex-shrink:0"></span><span class="bar" style={w}></span></span>{/each}{/if}
							{#if t.ty === 'table'}<span style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:2px;width:56px"><span class="bar" style="height:6px"></span><span class="bar" style="height:6px"></span><span class="bar" style="height:5px;opacity:.6"></span><span class="bar" style="height:5px;opacity:.6"></span><span class="bar" style="height:5px;opacity:.6"></span><span class="bar" style="height:5px;opacity:.6"></span></span>{/if}
							{#if t.ty === 'section'}<span style="width:28px;height:32px;box-sizing:border-box;border-radius:2px;box-shadow:inset 0 0 0 2px var(--bar);display:flex;flex-direction:column;justify-content:flex-end;padding:3px"><span style="height:10px;border-radius:1px;background:var(--bar)"></span></span>{/if}
							{#if t.ty === 'footer'}<span style="width:38px;height:1px;background:var(--bar);margin-top:10px"></span><span class="bar" style="width:48px;height:3px"></span><span class="bar" style="width:30px;height:3px"></span>{/if}
						</span>
						{t.label}
					</button>
				{/each}
			</div>
			{#if tiles.length === 0}<div style="padding:14px;border-radius:12px;background:var(--s2);font-size:12.5px;color:var(--muted)">No block matches that search.</div>{/if}
		{/if}

		<button class="sec" type="button" onclick={() => (tplSecOpen = !tplSecOpen)} aria-expanded={tplSecOpen}><span style="flex-grow:1">Template</span><span style="display:flex;color:var(--muted)"><Icon name={tplSecOpen ? 'arrow-up4' : 'arrow-down4'} width={14} height={14} /></span></button>
		{#if tplSecOpen}
			<div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:8px">
				{#each presets as p (p.label)}
					<button class="tile" type="button" onclick={() => addPreset(p)} title={'Insert the ' + p.label + ' blocks'} style="padding:8px;gap:6px;align-items:stretch">
						<span style="display:flex;flex-direction:column;gap:3px;padding:7px;border-radius:8px;background:var(--bg)">
							{#each p.shape as r, i (i)}<span style={r}></span>{/each}
						</span>
						<span style="text-align:left;padding:0 2px;color:var(--text)">{p.label}</span>
						<span style="text-align:left;padding:0 2px;font-weight:500;font-size:11.5px">{p.sub}</span>
					</button>
				{/each}
			</div>
		{/if}
		<p style="margin:0;font-size:12px;line-height:1.5;color:var(--muted)">Click to add, or drag a block onto the email.</p>
	{:else}
		<div style="display:flex;flex-direction:column;gap:2px">
			<button class="row" type="button" onclick={() => { editor.selectContainer(); view.rightTab = 'customize'; }} aria-current={emailSel} style={emailSel ? 'background:var(--s2);box-shadow:inset 0 0 0 1.5px #ffd100' : ''}><span style="display:flex;color:var(--muted)"><Icon name="email" width={14} height={14} /></span><span style="flex-grow:1">Email</span><span style="font-size:10.5px;font-weight:700;padding:1px 6px;border-radius:4px;background:var(--s3);color:var(--muted)">Container</span></button>
			{#each editor.blocks as b, i (b.id)}
				{@const pinned = b.type === 'header' || b.type === 'footer'}
				{@const on = editor.selectedId === b.id}
				{#if dnd.dropIdx === i}<div style="height:2px;background:#ffd100;margin:0 4px"></div>{/if}
				<div style="display:flex;align-items:center;gap:2px;border-radius:8px">
					<button class="row" type="button" data-layer={b.id} draggable={pinned ? 'false' : 'true'} ondragstart={(e) => dnd.start(e, { id: b.id })} ondragover={(e) => dnd.over(e, i)} ondrop={(e) => dnd.drop(e)} ondragend={() => dnd.end()} onclick={(e) => pick(e, b.id)} onkeydown={(e) => rowKey(e, b.id)} aria-current={on} style={(on ? 'background:var(--s2);box-shadow:inset 0 0 0 1.5px #ffd100;' : '') + (pinned ? 'cursor:pointer;' : 'cursor:grab;') + (dnd.dragging === b.id ? 'opacity:.4;' : '')}>
						<span style="display:flex;color:var(--muted);{pinned ? 'opacity:.25' : ''}"><Icon name="menu" width={14} height={14} /></span>
						<span class="mono" style="font-size:11px;color:var(--muted);width:14px;text-align:right">{i + 1}</span>
						<span style="flex-grow:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{TYPE_NAME[b.type]}</span>
						{#if pinned}<span style="font-size:10.5px;font-weight:700;padding:1px 6px;border-radius:4px;background:var(--s3);color:var(--muted)">{b.type === 'header' ? 'First' : 'Last'}</span>{/if}
					</button>
					{#if !pinned}
						<button class="mini" type="button" aria-label="Move up" onclick={() => editor.moveBlock(b.id, 'up')} style={editor.canMove(b.id, 'up') ? '' : 'opacity:.3;pointer-events:none'}><Icon name="arrow-up4" width={13} height={13} /></button>
						<button class="mini" type="button" aria-label="Move down" onclick={() => editor.moveBlock(b.id, 'down')} style={editor.canMove(b.id, 'down') ? '' : 'opacity:.3;pointer-events:none'}><Icon name="arrow-down4" width={13} height={13} /></button>
					{/if}
				</div>
			{/each}
			{#if dnd.dropIdx !== null && dnd.dropIdx === editor.blocks.length}<div style="height:2px;background:#ffd100;margin:0 4px"></div>{/if}
			{#if editor.blocks.length === 0}<div style="padding:14px;border-radius:12px;background:var(--s2);font-size:12.5px;color:var(--muted)">The email is empty. Add blocks from the Blocks tab.</div>{/if}
		</div>
		<p style="margin:0;font-size:12px;line-height:1.5;color:var(--muted)">Drag rows to reorder. The header stays first and the footer stays last.</p>
	{/if}
</aside>
