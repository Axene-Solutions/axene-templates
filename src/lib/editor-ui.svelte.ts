// Compatibility shim for the old dialog flags. The editor now has one modal slot (view.modal in
// store.svelte.ts) so dialogs never stack. Setting a flag opens that step in the slot; reading
// one is always false, so a component that still renders its own copy of a dialog from these
// flags never shows a second one.
import { view } from './store.svelte';

export const editorUi = {
	get sendOpen() { return false; },
	set sendOpen(v: boolean) { if (v) view.openModal('send'); else if (view.modal === 'send') view.closeModal(); },
	get saveMailerOpen() { return false; },
	set saveMailerOpen(v: boolean) { if (v) view.openModal('save'); else if (view.modal === 'save') view.closeModal(); },
};
