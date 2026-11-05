// Open state of the editor dialogs, shared so the post-save bar can open them too.
let sendOpen = $state(false);
let saveMailerOpen = $state(false);

export const editorUi = {
	get sendOpen() { return sendOpen; },
	set sendOpen(v: boolean) { sendOpen = v; },
	get saveMailerOpen() { return saveMailerOpen; },
	set saveMailerOpen(v: boolean) { saveMailerOpen = v; },
};
