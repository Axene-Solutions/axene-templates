// Per-session cache of what Mailer knows about the user: contact fields, named links and the plan.
// Everything reloads when the connection changes (see mailer.epoch), and nothing here is ever
// persisted: names and URLs only live in memory.

import { mailer } from './mailer.svelte';
import { BUILTIN_FIELDS } from './placeholders';
import type { PlanSummary } from './mailer-plan';

export type LoadState = 'idle' | 'loading' | 'ready' | 'not_linked' | 'no_scope' | 'key_broken' | 'error';
export interface NamedLink {
	id: string;
	key: string;
	label: string;
	url: string;
	token: string;
}

interface Failure {
	state: LoadState;
	message: string;
}

function failure(status: number, data: any): Failure {
	if (status === 409) return { state: 'not_linked', message: data?.error ?? 'Mailer is not connected.' };
	if (status === 401) return { state: 'key_broken', message: data?.error ?? 'Your Mailer key is invalid or has been revoked.' };
	if (status === 403 && data?.code === 'mailer_missing_scope') return { state: 'no_scope', message: data?.error ?? 'The key is missing a scope.' };
	return { state: 'error', message: data?.error ?? `Request failed (error ${status})` };
}

async function get(url: string): Promise<{ ok: true; data: any } | ({ ok: false } & Failure)> {
	try {
		const res = await fetch(url);
		const data = await res.json().catch(() => ({}));
		if (res.ok) return { ok: true, data };
		return { ok: false, ...failure(res.status, data) };
	} catch {
		return { ok: false, state: 'error', message: 'Could not reach the server, check your connection' };
	}
}

// ---- contact fields ----
let fieldsState = $state<LoadState>('idle');
let fieldsMessage = $state('');
let contactFields = $state<{ key: string; count: number }[]>([]);
let fieldsBuiltins = $state<{ key: string; label: string }[]>([...BUILTIN_FIELDS]);
let fieldsEpoch = -1;
let fieldsInFlight: Promise<void> | null = null;

async function loadFields(force = false) {
	if (fieldsInFlight) return fieldsInFlight;
	if (!force && fieldsEpoch === mailer.epoch && (fieldsState === 'ready' || fieldsState === 'no_scope' || fieldsState === 'not_linked')) return;
	fieldsInFlight = (async () => {
		await mailer.ensureLoaded();
		fieldsEpoch = mailer.epoch;
		if (mailer.status !== 'connected') {
			fieldsState = 'not_linked';
			contactFields = [];
			return;
		}
		fieldsState = 'loading';
		const r = await get('/api/mailer/fields');
		if (r.ok) {
			contactFields = Array.isArray(r.data.fields) ? r.data.fields : [];
			if (Array.isArray(r.data.builtins) && r.data.builtins.length) fieldsBuiltins = r.data.builtins;
			fieldsState = 'ready';
			fieldsMessage = '';
		} else {
			contactFields = [];
			fieldsState = r.state;
			fieldsMessage = r.message;
		}
	})().finally(() => (fieldsInFlight = null));
	return fieldsInFlight;
}

// ---- named links ----
let linksState = $state<LoadState>('idle');
let linksMessage = $state('');
let links = $state<NamedLink[]>([]);
let linksEpoch = -1;
let linksInFlight: Promise<void> | null = null;

async function loadLinks(force = false) {
	if (linksInFlight) return linksInFlight;
	if (!force && linksEpoch === mailer.epoch && (linksState === 'ready' || linksState === 'no_scope' || linksState === 'not_linked')) return;
	linksInFlight = (async () => {
		await mailer.ensureLoaded();
		linksEpoch = mailer.epoch;
		if (mailer.status !== 'connected') {
			linksState = 'not_linked';
			links = [];
			return;
		}
		linksState = 'loading';
		const r = await get('/api/mailer/links');
		if (r.ok) {
			links = Array.isArray(r.data.links) ? r.data.links : [];
			linksState = 'ready';
			linksMessage = '';
		} else {
			links = [];
			linksState = r.state;
			linksMessage = r.message;
		}
	})().finally(() => (linksInFlight = null));
	return linksInFlight;
}

export type LinkResult = { ok: true; link?: NamedLink } | { ok: false; error: string; status: number };

async function send(method: string, url: string, body?: unknown): Promise<{ status: number; data: any }> {
	try {
		const res = await fetch(url, {
			method,
			headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
			body: body === undefined ? undefined : JSON.stringify(body),
		});
		return { status: res.status, data: await res.json().catch(() => ({})) };
	} catch {
		return { status: 0, data: { error: 'Could not reach the server, check your connection' } };
	}
}

async function saveLink(input: { label: string; url: string; key?: string }, id?: string): Promise<LinkResult> {
	const r = id ? await send('PATCH', `/api/mailer/links/${encodeURIComponent(id)}`, input) : await send('POST', '/api/mailer/links', input);
	if (r.status >= 200 && r.status < 300 && r.data?.link) {
		const link = r.data.link as NamedLink;
		links = id ? links.map((l) => (l.id === id ? link : l)) : [...links, link];
		return { ok: true, link };
	}
	return { ok: false, status: r.status, error: r.data?.error ?? `Could not save the link (error ${r.status})` };
}

async function removeLink(id: string): Promise<LinkResult> {
	const r = await send('DELETE', `/api/mailer/links/${encodeURIComponent(id)}`);
	if (r.status >= 200 && r.status < 300) {
		links = links.filter((l) => l.id !== id);
		return { ok: true };
	}
	return { ok: false, status: r.status, error: r.data?.error ?? `Could not delete the link (error ${r.status})` };
}

// ---- plan ----
let planState = $state<LoadState>('idle');
let planMessage = $state('');
let plan = $state<PlanSummary | null>(null);
let planEpoch = -1;
let planInFlight: Promise<void> | null = null;

async function loadPlan(force = false) {
	if (planInFlight) return planInFlight;
	if (!force && planEpoch === mailer.epoch && planState === 'ready') return;
	planInFlight = (async () => {
		await mailer.ensureLoaded();
		planEpoch = mailer.epoch;
		if (mailer.status !== 'connected') {
			planState = 'not_linked';
			plan = null;
			return;
		}
		planState = 'loading';
		const r = await get('/api/mailer/plan');
		if (r.ok) {
			plan = r.data.plan ?? null;
			planState = plan ? 'ready' : 'error';
			planMessage = plan ? '' : 'Mailer returned no plan.';
		} else {
			plan = null;
			planState = r.state;
			planMessage = r.message;
		}
	})().finally(() => (planInFlight = null));
	return planInFlight;
}

let manageOpen = $state(false);

/** Where Settings sends the user back to after linking (a relative path), for the current page. */
export function settingsHref(): string {
	if (typeof location === 'undefined') return '/settings';
	return `/settings?next=${encodeURIComponent(location.pathname + location.search)}`;
}

export const mailerData = {
	get manageLinksOpen() { return manageOpen; },
	set manageLinksOpen(v: boolean) { manageOpen = v; },
	get fieldsState() { return fieldsState; },
	get fieldsMessage() { return fieldsMessage; },
	get contactFields() { return contactFields; },
	get builtins() { return fieldsBuiltins; },
	/** Field keys that are known to exist, or null when they could not be loaded. */
	get knownFields(): ReadonlySet<string> | null {
		return fieldsState === 'ready' ? new Set([...fieldsBuiltins.map((f) => f.key), ...contactFields.map((f) => f.key)]) : null;
	},
	get linksState() { return linksState; },
	get linksMessage() { return linksMessage; },
	get links() { return links; },
	get knownLinks(): ReadonlySet<string> | null {
		return linksState === 'ready' ? new Set(links.map((l) => l.key)) : null;
	},
	get planState() { return planState; },
	get planMessage() { return planMessage; },
	get plan() { return plan; },
	loadFields,
	loadLinks,
	loadPlan,
	saveLink,
	removeLink,
	/** After a template was saved to Mailer the plan numbers are stale. */
	refreshPlan: () => loadPlan(true),
};
