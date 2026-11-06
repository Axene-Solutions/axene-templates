import type { RequestEvent } from '@sveltejs/kit';

/**
 * The Mailer connection as GET /api/mailer/connection reports it, for a page load, so the page
 * renders the right Mailer state on the server instead of a "Loading..." line that the client
 * then replaces (a layout shift on Settings, and the gallery's Mailer bar popping in).
 * Null when signed out or when it cannot be read: the client then loads it as before.
 */
export async function mailerConnectionSeed(fetch: RequestEvent['fetch'], signedIn: boolean): Promise<Record<string, unknown> | null> {
	if (!signedIn) return null;
	try {
		const res = await fetch('/api/mailer/connection');
		if (res.status === 503) return { connected: false, configured: false };
		if (!res.ok) return null;
		const data = await res.json();
		return data && typeof data === 'object' ? data : null;
	} catch {
		return null;
	}
}
