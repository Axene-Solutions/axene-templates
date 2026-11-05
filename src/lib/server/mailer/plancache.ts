import { createHash } from 'node:crypto';
import type { PlanSummary } from '$lib/mailer-plan';

// Short server-side cache of the plan summary, so the Settings page and the Save dialog do not
// hammer Mailer. In memory, per process. The key is hashed into the cache id and never stored.

export const PLAN_TTL_MS = 60_000;
const cache = new Map<string, { at: number; value: PlanSummary }>();

export function planCacheId(userId: string, apiKey: string): string {
	return `${userId}:${createHash('sha256').update(apiKey).digest('hex').slice(0, 16)}`;
}

export function getCachedPlan(id: string, now = Date.now()): PlanSummary | null {
	const hit = cache.get(id);
	if (!hit) return null;
	if (now - hit.at >= PLAN_TTL_MS) {
		cache.delete(id);
		return null;
	}
	return hit.value;
}

export function setCachedPlan(id: string, value: PlanSummary, now = Date.now()): void {
	if (cache.size > 2000) {
		for (const [k, v] of cache) if (now - v.at >= PLAN_TTL_MS) cache.delete(k);
		if (cache.size > 2000) cache.clear();
	}
	cache.set(id, { at: now, value });
}

/** Drop every cached plan of a user (a template was saved, a key changed). */
export function forgetPlans(userId: string): void {
	for (const k of cache.keys()) if (k.startsWith(userId + ':')) cache.delete(k);
}
