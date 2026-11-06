<script lang="ts">
	import Icon from '$lib/components/Icon.svelte'

	type Key = 'heading' | 'text' | 'button'
	type Align = 'left' | 'center' | 'right'
	interface Block {
		text: string
		color: string
		align: Align
	}

	function defaultBlocks(): Record<Key, Block> {
		return {
			heading: { text: 'Welcome to Coffee House', color: '#1a1a17', align: 'center' },
			text: {
				text: 'Thanks for joining us. Your first cup is on the house when you visit this week.',
				color: '#7a786f',
				align: 'center',
			},
			button: { text: 'Order online', color: '#FFD100', align: 'center' },
		}
	}

	let sel = $state<Key>('heading')
	let device = $state<'desktop' | 'mobile'>('desktop')
	let blocks = $state<Record<Key, Block>>(defaultBlocks())

	const mobile = $derived(device === 'mobile')
	const cur = $derived(blocks[sel])

	function setBlock<K extends keyof Block>(key: K, val: Block[K]) {
		blocks[sel][key] = val
	}

	function reset() {
		blocks = defaultBlocks()
		sel = 'heading'
		device = 'desktop'
	}

	const ring = (name: Key) => (sel === name ? 'box-shadow:inset 0 0 0 2px #e6bc00;' : '')

	// Dark ink on light button colors, white on dark ones.
	function btnInk(c: string): string {
		const h = c.replace('#', '')
		const ch = [0, 2, 4].map((i) => {
			const v = parseInt(h.substring(i, i + 2), 16) / 255
			return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
		})
		const lum = 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]
		return lum > 0.4 ? '#101010' : '#ffffff'
	}

	const names: Record<Key, string> = { heading: 'Heading', text: 'Text', button: 'Button' }
	const txtPal: [string, string][] = [
		['#1a1a17', 'Ink'],
		['#3d6ee0', 'Blue'],
		['#1f8a5b', 'Green'],
		['#c5503a', 'Red'],
		['#7a786f', 'Grey'],
	]
	const btnPal: [string, string][] = [
		['#FFD100', 'Yellow'],
		['#1a1a17', 'Ink'],
		['#3d6ee0', 'Blue'],
		['#1f8a5b', 'Green'],
		['#c5503a', 'Red'],
	]
	const pal = $derived(sel === 'button' ? btnPal : txtPal)
	const aligns: [Align, string][] = [
		['left', 'Left'],
		['center', 'Center'],
		['right', 'Right'],
	]

	const emStyle = $derived('max-width:' + (mobile ? '320px' : '560px') + ';')
	const hTxt = $derived(
		'display:block;font-size:' + (mobile ? '22px' : '28px') + ';line-height:1.2;font-weight:700;letter-spacing:-0.5px;color:' + blocks.heading.color + ';',
	)
	const tTxt = $derived(
		'display:block;font-size:' + (mobile ? '14px' : '15px') + ';line-height:1.6;color:' + blocks.text.color + ';',
	)
	const bTxt = $derived(
		'display:inline-block;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;background:' +
			blocks.button.color +
			';color:' +
			btnInk(blocks.button.color) +
			';',
	)
</script>

<section id="demo" class="section-dark">
	<div class="container">
		<div class="sr-bottom">
			<span class="eyebrow">Live demo</span>
			<h2>Try the editor right here<span class="accent">.</span></h2>
			<p class="section-sub">
				Click the heading, the text or the button in the email, then change it on the right.
			</p>
		</div>

		<div class="demo sr-card">
			<div class="demo-stage">
				<div class="demo-bar">
					<div class="seg2" role="group" aria-label="Preview size">
						<button type="button" class="seg2-btn" class:active={!mobile} aria-pressed={!mobile} onclick={() => (device = 'desktop')}>Desktop</button>
						<button type="button" class="seg2-btn" class:active={mobile} aria-pressed={mobile} onclick={() => (device = 'mobile')}>Mobile</button>
					</div>
					<button type="button" class="nbtn" onclick={reset}><Icon name="undo-arrow" width={15} height={15} />Reset</button>
				</div>
				<div class="demo-canvas">
					<div class="em" style={emStyle}>
						<div class="em-hdr"><span class="em-mark"></span><span class="em-brand">Coffee House</span></div>
						<button type="button" class="em-blk" style={'text-align:' + blocks.heading.align + ';' + ring('heading')} aria-label="Select the heading" onclick={() => (sel = 'heading')}><span style={hTxt}>{blocks.heading.text}</span></button>
						<button type="button" class="em-blk" style={'text-align:' + blocks.text.align + ';' + ring('text')} aria-label="Select the text" onclick={() => (sel = 'text')}><span style={tTxt}>{blocks.text.text}</span></button>
						<button type="button" class="em-blk" style={'text-align:' + blocks.button.align + ';' + ring('button')} aria-label="Select the button" onclick={() => (sel = 'button')}><span style={bTxt}>{blocks.button.text}</span></button>
						<div class="em-ftr">Coffee House, Nairobi<br />Unsubscribe</div>
					</div>
				</div>
			</div>

			<div class="demo-props">
				<div>
					<div class="dp-kicker">Selected block</div>
					<div class="dp-name">{names[sel]}</div>
				</div>
				<div>
					<label class="mk-label" for="demo-text"><span>Text</span></label>
					<input id="demo-text" class="nin" type="text" value={cur.text} oninput={(e) => setBlock('text', e.currentTarget.value)} />
				</div>
				<div>
					<div class="mk-label"><span>{sel === 'button' ? 'Button color' : 'Text color'}</span></div>
					<div class="swatches">
						{#each pal as [c, name] (c)}
							<button
								type="button"
								class="swatch"
								style={'background:' + c + ';' + (cur.color === c ? 'box-shadow:0 0 0 2px var(--color-surface),0 0 0 4px var(--color-text);' : '')}
								aria-label={name + ' ' + c}
								aria-pressed={cur.color === c}
								onclick={() => setBlock('color', c)}
							></button>
						{/each}
					</div>
				</div>
				<div>
					<div class="mk-label"><span>Alignment</span></div>
					<div class="seg2 seg2-full" role="group" aria-label="Alignment">
						{#each aligns as [v, label] (v)}
							<button type="button" class="seg2-btn" class:active={cur.align === v} aria-pressed={cur.align === v} onclick={() => setBlock('align', v)}>{label}</button>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
