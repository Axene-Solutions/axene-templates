// Small focus helpers for dialogs (Svelte actions).

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Focus the element as soon as it is mounted. */
export function autofocus(node: HTMLElement) {
	node.focus();
}

/**
 * Move focus into the dialog (to the element marked data-autofocus, else the first control),
 * keep Tab inside it, and give focus back to the opener on close.
 */
export function trapFocus(node: HTMLElement) {
	const previous = document.activeElement as HTMLElement | null;
	const items = () => [...node.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
	(node.querySelector<HTMLElement>('[data-autofocus]') ?? items()[0] ?? node).focus();

	function onkeydown(e: KeyboardEvent) {
		if (e.key !== 'Tab') return;
		const list = items();
		if (!list.length) {
			e.preventDefault();
			node.focus();
			return;
		}
		const first = list[0];
		const last = list[list.length - 1];
		const active = document.activeElement;
		if (e.shiftKey && (active === first || active === node)) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && active === last) {
			e.preventDefault();
			first.focus();
		}
	}
	node.addEventListener('keydown', onkeydown);

	// A busy state disables the focused button (Send, Save, Connect) or swaps it for another, and
	// the browser then drops focus to <body>: Escape and the Tab trap stop working. Remember the
	// last control that had focus and give focus back once it is usable again.
	let last: HTMLElement | null = node.contains(document.activeElement) ? (document.activeElement as HTMLElement) : null;
	const onfocusin = (e: FocusEvent) => {
		if (e.target instanceof HTMLElement && e.target !== node) last = e.target;
	};
	node.addEventListener('focusin', onfocusin);
	const lost = () => !document.activeElement || document.activeElement === document.body;
	const usable = (el: HTMLElement | null): el is HTMLElement => !!el && el.isConnected && node.contains(el) && !el.matches(':disabled') && el.offsetParent !== null;
	const observer = new MutationObserver(() => {
		if (!lost()) return;
		if (usable(last)) last.focus({ preventScroll: true });
		else if (!last || !last.isConnected) {
			const next = node.querySelector<HTMLElement>('[data-autofocus]') ?? items()[0];
			if (next) next.focus({ preventScroll: true });
		}
	});
	observer.observe(node, { subtree: true, childList: true, attributes: true, attributeFilter: ['disabled'] });

	return {
		destroy() {
			observer.disconnect();
			node.removeEventListener('keydown', onkeydown);
			node.removeEventListener('focusin', onfocusin);
			previous?.focus?.();
		},
	};
}
