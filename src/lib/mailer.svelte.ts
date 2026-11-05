// Shared client state for the Mailer connection. The Settings page and the
// Send modal both read and write this, so they can never disagree.

type Status = 'loading' | 'unavailable' | 'disconnected' | 'connected';
export type CheckResult =
	| { kind: 'ok'; senders: number }
	| { kind: 'revoked' | 'missing_scope' | 'error'; message: string }
	| null;

let status = $state<Status>('loading');
let keyHint = $state('');
let connectedAt = $state<string | null>(null);
let busy = $state(false);
let error = $state('');
let checking = $state(false);
let check = $state<CheckResult>(null);

function apply(data: { connected?: boolean; keyHint?: string | null; connectedAt?: string | null }) {
	status = data.connected ? 'connected' : 'disconnected';
	keyHint = data.keyHint ?? '';
	connectedAt = data.connectedAt ?? null;
}

async function load() {
	status = 'loading';
	check = null;
	try {
		const res = await fetch('/api/mailer/connection');
		if (res.status === 503) {
			status = 'unavailable';
			return;
		}
		if (!res.ok) throw new Error();
		apply(await res.json());
	} catch {
		status = 'unavailable';
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

/** Re-validates the stored key against Mailer through our senders endpoint. */
async function recheck() {
	checking = true;
	check = null;
	try {
		const res = await fetch('/api/mailer/senders');
		const data = await res.json().catch(() => ({}));
		if (res.ok) check = { kind: 'ok', senders: (data.senders ?? []).length };
		else if (res.status === 401) check = { kind: 'revoked', message: 'Mailer rejected this key. It was revoked or deleted. Disconnect and connect a new key.' };
		else if (res.status === 403) check = { kind: 'missing_scope', message: 'This key is missing a scope. It needs "Send emails" and "Read sender addresses".' };
		else if (res.status === 409) {
			// The row is gone (disconnected elsewhere) or unreadable: reflect the server.
			await load();
		} else check = { kind: 'error', message: data.error ?? `Check failed (error ${res.status})` };
	} catch {
		check = { kind: 'error', message: 'Check failed, check your connection' };
	} finally {
		checking = false;
	}
}

export const mailer = {
	get status() { return status; },
	get keyHint() { return keyHint; },
	get connectedAt() { return connectedAt; },
	get busy() { return busy; },
	get error() { return error; },
	get checking() { return checking; },
	get check() { return check; },
	clearError() { error = ''; },
	load,
	connect,
	disconnect,
	recheck,
};
