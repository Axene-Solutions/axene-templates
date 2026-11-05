import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { gate, loadApiKey, mailerFailure } from '$lib/server/mailer/http';
import { getBillingPlans, getBillingUsage, listTemplates } from '$lib/server/mailer/client';
import { createRateLimiter } from '$lib/server/mailer/guard';
import { getCachedPlan, planCacheId, setCachedPlan } from '$lib/server/mailer/plancache';
import { buildPlanSummary } from '$lib/mailer-plan';
import { mapMailerStatus } from '$lib/server/mailer/errors';

// Limits only requests that reach Mailer (cache hits are free). 30 per user per hour.
const limiter = createRateLimiter(30, 60 * 60 * 1000);

// GET /api/mailer/plan -> { plan: PlanSummary }, cached 60 s per user and key.
export const GET: RequestHandler = async (event) => {
	const auth = gate(event, false);
	if (auth instanceof Response) return auth;
	const apiKey = await loadApiKey(auth);
	if (apiKey instanceof Response) return apiKey;

	const id = planCacheId(auth.user.id, apiKey);
	const cached = getCachedPlan(id);
	if (cached) return json({ plan: cached, cached: true });

	const wait = limiter.hit(auth.user.id);
	if (wait > 0) {
		return json({ error: 'Too many requests. Try again later.', code: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(wait) } });
	}

	const [usage, plans, tpls] = await Promise.all([getBillingUsage(apiKey), getBillingPlans(), listTemplates(apiKey)]);
	if (!usage.ok) return mailerFailure(usage.status, usage.error);
	if (!tpls.ok && tpls.status === 401) return mailerFailure(401, mapMailerStatus(401));

	const summary = buildPlanSummary(usage.data, plans.ok ? plans.data : null, tpls.ok ? tpls.data.length : null);
	if (!summary) return mailerFailure(502, mapMailerStatus(502));
	setCachedPlan(id, summary);
	return json({ plan: summary, cached: false });
};
