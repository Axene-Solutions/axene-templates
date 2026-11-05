// Post-login redirect target. Only same-origin relative paths are accepted.

const MAX_LEN = 512;

/** Returns the path+query if it is a safe same-origin relative path, else null. */
export function safeNext(raw: unknown): string | null {
	if (typeof raw !== 'string') return null;
	if (raw.length === 0 || raw.length > MAX_LEN) return null;
	if (!raw.startsWith('/') || raw.startsWith('//')) return null;
	if (/[\\\u0000-\u001f\u007f]/.test(raw)) return null;
	try {
		const u = new URL(raw, 'http://safe.invalid');
		if (u.origin !== 'http://safe.invalid') return null;
		// Never bounce back into the auth flow.
		if (u.pathname === '/login' || u.pathname.startsWith('/auth/')) return null;
		const out = u.pathname + u.search;
		// Normalization can turn "/.//x" into "//x", which a browser reads as another host.
		return out.startsWith('//') ? null : out;
	} catch {
		return null;
	}
}
