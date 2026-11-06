// The access token cookie lasts 60 minutes and the refresh token 30 days (auth standard). Nothing
// renewed the access token, so an editor left open for an hour failed every save with 401. This
// wraps fetch once in the browser: a 401 from this app's own /api renews the session with
// POST /auth/refresh (one request shared by every caller) and retries the request once.

type Fetch = typeof fetch;

const RETRY_COOLDOWN_MS = 30_000;

export function withSessionRefresh(base: Fetch, origin: string): Fetch {
	let inflight: Promise<boolean> | null = null;
	let failedAt = 0;

	function renew(): Promise<boolean> {
		if (Date.now() - failedAt < RETRY_COOLDOWN_MS) return Promise.resolve(false);
		inflight ??= base('/auth/refresh', { method: 'POST', credentials: 'same-origin' })
			.then((r) => r.ok)
			.catch(() => false)
			.then((ok) => {
				if (!ok) failedAt = Date.now();
				inflight = null;
				return ok;
			});
		return inflight;
	}

	function ownApi(input: RequestInfo | URL): boolean {
		if (input instanceof Request) return false; // its body may already be used: never replayed
		try {
			const u = new URL(String(input), origin);
			return u.origin === origin && u.pathname.startsWith('/api/');
		} catch {
			return false;
		}
	}

	return async function refreshingFetch(input: RequestInfo | URL, init?: RequestInit) {
		const res = await base(input, init);
		if (res.status !== 401 || !ownApi(input)) return res;
		if (!(await renew())) return res;
		return base(input, init);
	} as Fetch;
}

let installed = false;
/** Installs the wrapper on window.fetch (browser only, once). */
export function installSessionRefresh() {
	if (installed || typeof window === 'undefined') return;
	installed = true;
	window.fetch = withSessionRefresh(window.fetch.bind(window), window.location.origin);
}
