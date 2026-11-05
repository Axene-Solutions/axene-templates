// Request guards and the send rate limiter. Pure, no SvelteKit imports.

/**
 * Same-origin check for state-changing requests. Compares the host of the Origin
 * header with the request host and ignores the scheme: the app runs behind a
 * TLS-terminating proxy and ORIGIN is not configured, so the scheme the server
 * sees ("http") would not match the browser's ("https").
 * A missing Origin header is rejected.
 */
export function isSameOrigin(originHeader: string | null, host: string): boolean {
	if (!originHeader) return false;
	try {
		return new URL(originHeader).host === host;
	} catch {
		return false;
	}
}

export interface RateLimiter {
	/** Returns 0 if allowed (and records the hit), otherwise seconds until a slot frees. */
	hit(key: string, now?: number): number;
}

/** Sliding window, in memory: state is per process and is lost on restart. */
export function createRateLimiter(max: number, windowMs: number): RateLimiter {
	const hits = new Map<string, number[]>();
	return {
		hit(key, now = Date.now()) {
			const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
			if (recent.length >= max) {
				hits.set(key, recent);
				return Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000));
			}
			recent.push(now);
			hits.set(key, recent);
			if (hits.size > 5000) {
				for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
			}
			return 0;
		},
	};
}
