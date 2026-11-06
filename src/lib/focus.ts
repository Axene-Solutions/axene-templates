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
	return {
		destroy() {
			node.removeEventListener('keydown', onkeydown);
			previous?.focus?.();
		},
	};
}
