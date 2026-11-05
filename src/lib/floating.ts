// Svelte action for small popovers: fixed position next to an anchor, kept inside the viewport,
// closed by Escape, an outside press, a resize or a scroll of anything behind it.

export interface FloatingOptions {
	anchor: HTMLElement;
	onclose: () => void;
	width?: number;
}

export function floating(node: HTMLElement, opts: FloatingOptions) {
	let o = opts;

	function place() {
		const a = o.anchor.getBoundingClientRect();
		const w = Math.min(o.width ?? 288, window.innerWidth - 16);
		node.style.position = 'fixed';
		node.style.width = `${w}px`;
		// Right edge on the anchor's right edge (the panel sits at the right of the screen), clamped.
		const left = Math.max(8, Math.min(a.right - w, window.innerWidth - w - 8));
		node.style.left = `${left}px`;
		const h = node.offsetHeight;
		const below = window.innerHeight - a.bottom - 8;
		const above = a.top - 8;
		if (h > below && above > below) {
			node.style.top = `${Math.max(8, a.top - h - 4)}px`;
			node.style.maxHeight = `${Math.min(above, 560)}px`;
		} else {
			node.style.top = `${a.bottom + 4}px`;
			node.style.maxHeight = `${Math.min(below, 560)}px`;
		}
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.stopPropagation();
			e.preventDefault();
			o.onclose();
		}
	}
	function onpointerdown(e: PointerEvent) {
		const t = e.target as Node;
		if (!node.contains(t) && !o.anchor.contains(t)) o.onclose();
	}
	function onscroll(e: Event) {
		if (!node.contains(e.target as Node)) o.onclose();
	}

	place();
	// Content (messages, lists) changes the height after mount.
	const ro = new ResizeObserver(place);
	ro.observe(node);
	node.addEventListener('keydown', onkeydown);
	document.addEventListener('pointerdown', onpointerdown, true);
	window.addEventListener('resize', place);
	window.addEventListener('scroll', onscroll, true);
	return {
		update(next: FloatingOptions) {
			o = next;
			place();
		},
		destroy() {
			ro.disconnect();
			node.removeEventListener('keydown', onkeydown);
			document.removeEventListener('pointerdown', onpointerdown, true);
			window.removeEventListener('resize', place);
			window.removeEventListener('scroll', onscroll, true);
		},
	};
}
