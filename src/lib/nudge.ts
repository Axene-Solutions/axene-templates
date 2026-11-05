// Pure logic for the post-save nudge: which message to show, and how dismissals are remembered.
// No browser or SvelteKit imports, so it can be unit tested directly.

import { saveBlockedReason, type PlanSummary } from './mailer-plan';

export type NudgeKind = 'not_linked' | 'not_saved' | 'stale' | 'saved' | 'limit' | 'broken';

export type ConnectionStatus = 'loading' | 'unavailable' | 'disconnected' | 'connected' | 'unreadable';

export interface NudgeInput {
	signedIn: boolean;
	status: ConnectionStatus;
	/** Whether the plan request said the key is dead (401). */
	keyRevoked: boolean;
	plan: PlanSummary | null;
	/** Id of the linked Mailer template, or empty. */
	mailerTemplateId: string;
	/** True when the Mailer copy matches what is in the editor. */
	inSync: boolean;
}

export interface Broken {
	reason: 'revoked' | 'unreadable' | 'scope';
}

/** What is wrong with the key, if anything we can tell without writing data. */
export function keyProblem(i: Pick<NudgeInput, 'status' | 'keyRevoked' | 'plan'>): Broken['reason'] | null {
	if (i.status === 'unreadable') return 'unreadable';
	if (i.keyRevoked) return 'revoked';
	// Counting templates needs templates:read. A plan that has templates but cannot count them means the scope is missing.
	if (i.plan && i.plan.templatesEnabled && i.plan.templates.used === null) return 'scope';
	return null;
}

/** The message to show after an explicit save, or null for none. */
export function chooseNudge(i: NudgeInput): NudgeKind | null {
	if (!i.signedIn) return null;
	if (i.status === 'loading' || i.status === 'unavailable') return null;
	if (i.status === 'disconnected') return 'not_linked';
	if (keyProblem(i)) return 'broken';
	const linked = !!i.mailerTemplateId;
	if (!linked && saveBlockedReason(i.plan, false)) return 'limit';
	if (!linked) return 'not_saved';
	return i.inSync ? 'saved' : 'stale';
}

// ---- Dismissals ----

export const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;
export const STORAGE_PREFIX = 'axene.nudge.v1.';

export interface Dismissal {
	/** "Don't show again". */
	never: boolean;
	/** "Not now": epoch ms until which nothing is shown, or 0. */
	until: number;
}

export const NO_DISMISSAL: Dismissal = { never: false, until: 0 };

/** Reads a stored value defensively: anything unexpected means "not dismissed". */
export function parseDismissal(raw: string | null | undefined): Dismissal {
	if (!raw) return NO_DISMISSAL;
	try {
		const o = JSON.parse(raw);
		if (!o || typeof o !== 'object') return NO_DISMISSAL;
		return {
			never: o.never === true,
			until: typeof o.until === 'number' && Number.isFinite(o.until) && o.until > 0 ? o.until : 0,
		};
	} catch {
		return NO_DISMISSAL;
	}
}

export function isSuppressed(d: Dismissal, now = Date.now()): boolean {
	return d.never || d.until > now;
}

export function snooze(d: Dismissal, now = Date.now()): Dismissal {
	return { ...d, until: now + SNOOZE_MS };
}

export function neverAgain(d: Dismissal): Dismissal {
	return { ...d, never: true };
}

export function storageKey(userId: string): string {
	return STORAGE_PREFIX + userId;
}

// ---- Once per template per session ----

/** Remembers which templates already showed the bar in this page session. */
export function createSessionLedger() {
	const seen = new Set<string>();
	return {
		/** True the first time a template id is offered, false afterwards. */
		claim(templateId: string): boolean {
			if (!templateId || seen.has(templateId)) return false;
			seen.add(templateId);
			return true;
		},
		has: (templateId: string) => seen.has(templateId),
	};
}
