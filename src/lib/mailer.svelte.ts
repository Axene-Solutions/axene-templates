import { page } from '$app/state';

// Shared client state for the Mailer connection. The Settings page and the
// Send modal both read and write this, so they can never disagree.

// unreadable: a key is stored but the server cannot decrypt it (its encryption key changed or is missing).
type Status = 'loading' | 'unavailable' | 'disconnected' | 'connected' | 'unreadable';
export type ScopeCheck = { scope: string; label: string; state: 'ok' | 'missing' | 'unknown' | 'unverified'; note?: string };
export type CheckResult =
	| { kind: 'ok'; scopes: ScopeCheck[]; senders: number | null; templates: number | null; contactFields: number | null }
	| { kind: 'revoked' | 'error'; message: string }
	| null;

let status = $state<Status>('loading');
let keyHint = $state('');
let connectedAt = $state<string | null>(null);
let configured = $state(true);
let busy = $state(false);
let error = $state('');
let checking = $state(false);
let check = $state<CheckResult>(null);
// Bumps whenever the stored key may have changed, so data cached per session reloads.
let epoch = $state(0);
let loadedOnce = false;

// Until the first client load finishes, a page that sent the connection state from its server
// load (data.mailerConnection) is shown from that, so the server render and the first paint
// already show the right state rather than "Loading...".
let settled = false;
type Seed = { status: Status; keyHint: string; connectedAt: string | null; configured: boolean };
function statusOf(data: { connected?: boolean; configured?: boolean; unreadable?: boolean }): Status {
	const conf = data.configured !== false;
	if (data.connected && data.unreadable) return 'unreadable';
	if (!data.connected && !conf) return 'unavailable';
	return data.connected ? 'connected' : 'disconnected';
}
function seed(): Seed | null {
	if (settled || status !== 'loading') return null;
	let d: any;
	try {
		d = (page.data as Record<string, unknown> | undefined)?.mailerConnection;
	} catch {
		return null;
	}
	if (!d || typeof d !== 'object') return null;
	return { status: statusOf(d), keyHint: d.keyHint ?? '', connectedAt: d.connectedAt ?? null, configured: d.configured !== false };
}

let signature = '';
function apply(data: { connected?: boolean; keyHint?: string | null; connectedAt?: string | null; configured?: boolean; unreadable?: boolean }) {
	settled = true;
	configured = data.configured !== false;
	status = statusOf(data);
	keyHint = data.keyHint ?? '';
	connectedAt = data.connectedAt ?? null;
	const sig = `${status}:${keyHint}`;
	if (sig !== signature) {
		signature = sig;
		epoch++;
	}
}

let loading: Promise<void> | null = null;
function load(): Promise<void> {
	loadedOnce = true;
	loading = doLoad().finally(() => (loading = null));
	return loading;
}

async function doLoad() {
	status = 'loading';
	check = null;
	try {
		const res = await fetch('/api/mailer/connection');
		if (res.status === 503) {
			status = 'unavailable';
			settled = true;
			return;
		}
		if (!res.ok) throw new Error();
		apply(await res.json());
	} catch {
		status = 'unavailable';
		settled = true;
	}
}

async function connect(apiKey: string): Promise<boolean> {
	busy = true;
	error = '';
	try {
		const res = await fetch('/api/mailer/connection', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ apiKey }),
		});
		const data = await res.json().catch(() => ({}));
		if (!res.ok) {
			error = data.error ?? `Could not connect (error ${res.status})`;
			return false;
		}
		check = null;
		apply(data);
		return true;
	} catch {
		error = 'Could not connect, check your connection';
		return false;
	} finally {
		busy = false;
	}
}

async function disconnect(): Promise<boolean> {
	busy = true;
	error = '';
	try {
		const res = await fetch('/api/mailer/connection', { method: 'DELETE' });
		if (!res.ok) {
			error = `Could not disconnect (error ${res.status})`;
			return false;
		}
		check = null;
		apply({ connected: false });
		return true;
	} catch {
		error = 'Could not disconnect, check your connection';
		return false;
	} finally {
		busy = false;
	}
}

/** Re-validates the stored key against Mailer and reports which scopes are known to work. */
async function recheck() {
	checking = true;
	check = null;
	try {
		const res = await fetch('/api/mailer/check');
		const data = await res.json().catch(() => ({}));
		if (res.ok) check = { kind: 'ok', scopes: data.scopes ?? [], senders: data.senders ?? null, templates: data.templates ?? null, contactFields: data.contactFields ?? null };
		if (res.ok) epoch++;
		else if (res.status === 401) check = { kind: 'revoked', message: 'Mailer rejected this key. It was revoked or deleted. Disconnect and connect a new key.' };
		else if (res.status === 409) {
			// The row is gone (disconnected elsewhere) or unreadable: reflect the server, and always say something.
			await load();
			if (status === 'connected') check = { kind: 'error', message: data.error ?? 'The stored key could not be used. Disconnect and connect it again.' };
		} else check = { kind: 'error', message: data.error ?? `Check failed (error ${res.status})` };
	} catch {
		check = { kind: 'error', message: 'Check failed, check your connection' };
	} finally {
		checking = false;
	}
}

/** Loads the connection once per page session; later callers reuse it. */
async function ensureLoaded() {
	if (loading) return loading;
	if (!loadedOnce) await load();
}

export const mailer = {
	get epoch() { return epoch; },
	get status() { return seed()?.status ?? status; },
	get keyHint() { return seed()?.keyHint ?? keyHint; },
	get connectedAt() { return seed()?.connectedAt ?? connectedAt; },
	get configured() { return seed()?.configured ?? configured; },
	get busy() { return busy; },
	get error() { return error; },
	get checking() { return checking; },
	get check() { return check; },
	clearError() { error = ''; },
	/** The server said the stored key cannot be decrypted: show that state without another round trip. */
	markUnreadable() { status = 'unreadable'; },
	load,
	ensureLoaded,
	connect,
	disconnect,
	recheck,
};
