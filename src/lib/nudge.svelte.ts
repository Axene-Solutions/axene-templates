// State of the post-save bar. The decision logic is in nudge.ts; this file wires it to the
// editor, the Mailer connection and localStorage.

import { editor } from './store.svelte';
import { mailer } from './mailer.svelte';
import { mailerData } from './mailer-data.svelte';
import {
	chooseNudge,
	createSessionLedger,
	isSuppressed,
	neverAgain,
	parseDismissal,
	snooze,
	storageKey,
	NO_DISMISSAL,
	type Dismissal,
	type NudgeKind,
} from './nudge';

const ledger = createSessionLedger();
let visibleFor = $state('');
let shownUserId = '';

function readDismissal(userId: string): Dismissal {
	try {
		return parseDismissal(localStorage.getItem(storageKey(userId)));
	} catch {
		return NO_DISMISSAL;
	}
}
function writeDismissal(userId: string, d: Dismissal) {
	try {
		localStorage.setItem(storageKey(userId), JSON.stringify(d));
	} catch {
		/* storage can be unavailable: the bar is simply hidden for this session */
	}
}

/** The message for the current state, or null. Reads reactive state, so it can sit inside $derived. */
function kind(signedIn: boolean): NudgeKind | null {
	return chooseNudge({
		signedIn,
		status: mailer.status,
		keyRevoked: mailerData.planState === 'key_broken',
		plan: mailerData.plan,
		mailerTemplateId: editor.mailerTemplateId,
		inSync: editor.mailerInSync(),
	});
}

/** Call after an explicit save succeeded (Save button or shortcut), never after an autosave. */
async function offer(userId: string | undefined) {
	if (!userId) return;
	const tid = editor.templateId;
	if (!tid || ledger.has(tid)) return;
	if (isSuppressed(readDismissal(userId))) return;
	await mailer.ensureLoaded();
	if (mailer.status === 'connected') await mailerData.loadPlan();
	// The user started typing again while we were checking: stay out of the way.
	if (editor.dirty || editor.templateId !== tid) return;
	if (!kind(true)) return;
	ledger.claim(tid);
	shownUserId = userId;
	visibleFor = tid;
}

function hide() {
	visibleFor = '';
}
function notNow() {
	if (shownUserId) writeDismissal(shownUserId, snooze(readDismissal(shownUserId)));
	hide();
}
function dontShowAgain() {
	if (shownUserId) writeDismissal(shownUserId, neverAgain(readDismissal(shownUserId)));
	hide();
}

export const nudge = {
	get visibleFor() { return visibleFor; },
	kind,
	offer,
	hide,
	notNow,
	dontShowAgain,
};
