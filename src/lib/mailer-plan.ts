// Pure helpers for the Mailer plan card, the Save dialog and the post-save nudge.
// Shared by the server (which builds the summary) and the browser (which reads it).

export const MAILER_URL = 'https://mail.axene.io';
export const PRICING_URL = `${MAILER_URL}/pricing`;

export interface Meter {
	used: number;
	/** null means unlimited. */
	limit: number | null;
}

export interface PlanSummary {
	name: string;
	/** ISO date, or null when the plan does not expire. */
	expiresAt: string | null;
	/** Templates used, or null when the key cannot read templates. */
	templates: { used: number | null; limit: number | null; limitKnown: boolean; unlimited: boolean };
	templatesEnabled: boolean;
	daily: Meter | null;
	monthly: Meter | null;
	featuresOff: { key: string; label: string }[];
	atTemplateLimit: boolean;
	nearTemplateLimit: boolean;
	/** Why an Upgrade link is relevant, or null (then no link is shown). */
	upgradeReason: string | null;
}

const FEATURE_LABELS: Record<string, string> = {
	click_tracking: 'Click tracking',
	templates: 'Templates',
	scheduled_send: 'Scheduled send',
	batch_send: 'Batch send',
	analytics_charts: 'Analytics charts',
	export: 'Export',
	branding_removal: 'Branding removal',
	dedicated_ip: 'Dedicated IP',
	team_members: 'Team members',
};

function num(v: unknown): number | null {
	return typeof v === 'number' && Number.isFinite(v) ? v : null;
}
function obj(v: unknown): Record<string, unknown> {
	return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function meter(used: unknown, limit: unknown): Meter | null {
	const u = num(used);
	const l = num(limit);
	if (u === null || l === null) return null;
	return { used: Math.max(0, Math.floor(u)), limit: l > 0 ? Math.floor(l) : null };
}

/**
 * Builds the summary from Mailer's /billing/usage JSON, its public /billing/plans list (the only
 * place max_templates is published) and the number of templates the account has.
 */
export function buildPlanSummary(usageJson: unknown, plansJson: unknown, templatesCount: number | null): PlanSummary | null {
	const u = obj(usageJson);
	const plan = obj(u.plan);
	const name = typeof plan.name === 'string' ? plan.name.slice(0, 40) : '';
	if (!name) return null;
	const usage = obj(u.usage);
	const features = obj(u.features);
	const sub = obj(u.subscription);

	const catalogue = (Array.isArray(plansJson) ? plansJson : []).map(obj).find((p) => p.name === name);
	const maxT = catalogue ? num(catalogue.max_templates) : null;
	const unlimited = maxT !== null && maxT < 0;
	const limitKnown = maxT !== null;
	const limit = maxT !== null && maxT >= 0 ? maxT : null;

	const templatesEnabled = features.templates !== false;
	const usedT = templatesCount;
	const atLimit = !unlimited && limit !== null && usedT !== null && usedT >= limit;
	const nearLimit = !atLimit && !unlimited && limit !== null && limit > 0 && usedT !== null && usedT / limit >= 0.8;

	const daily = meter(usage.emails_today, plan.daily_limit);
	const monthly = meter(usage.emails_this_month, plan.monthly_limit);

	const featuresOff: PlanSummary['featuresOff'] = [];
	for (const [key, label] of Object.entries(FEATURE_LABELS)) if (features[key] === false) featuresOff.push({ key, label });

	const sendNear = (m: Meter | null) => !!m && m.limit !== null && m.used / m.limit >= 0.9;
	let upgradeReason: string | null = null;
	if (!templatesEnabled) upgradeReason = 'Your plan does not include templates.';
	else if (atLimit) upgradeReason = 'You have reached the template limit of your plan.';
	else if (nearLimit) upgradeReason = 'You are close to the template limit of your plan.';
	else if (sendNear(daily)) upgradeReason = 'You are close to your daily sending limit.';
	else if (sendNear(monthly)) upgradeReason = 'You are close to your monthly sending limit.';

	return {
		name,
		expiresAt: typeof sub.expires_at === 'string' ? sub.expires_at.slice(0, 40) : null,
		templates: { used: usedT, limit, limitKnown, unlimited },
		templatesEnabled,
		daily,
		monthly,
		featuresOff,
		atTemplateLimit: atLimit,
		nearTemplateLimit: nearLimit,
		upgradeReason,
	};
}

/**
 * Why Save to Mailer must be disabled, or null. Updating a template that already lives in Mailer
 * is always allowed, since it does not add one.
 */
export function saveBlockedReason(p: PlanSummary | null, alreadySaved: boolean): string | null {
	if (!p || alreadySaved) return null;
	if (!p.templatesEnabled) return `The ${p.name} plan does not include templates.`;
	if (p.atTemplateLimit) {
		return `You have used all ${p.templates.limit} templates on the ${p.name} plan. Delete one in Mailer or upgrade to save another.`;
	}
	return null;
}

/** "Templates: used 3 of 10", "used 3 (unlimited)", or "3 saved" when the limit is unknown. */
export function templatesLine(p: PlanSummary): string {
	const t = p.templates;
	if (t.used === null) return t.unlimited ? 'Templates: unlimited' : 'Templates: usage unavailable';
	if (t.unlimited) return `Templates: ${t.used} used, unlimited`;
	if (t.limit === null) return `Templates: ${t.used} saved`;
	return `Templates: used ${t.used} of ${t.limit}`;
}

export function meterLine(label: string, m: Meter): string {
	return m.limit === null ? `${label}: ${m.used.toLocaleString('en')} sent, no limit` : `${label}: ${m.used.toLocaleString('en')} of ${m.limit.toLocaleString('en')}`;
}

/** Days until the plan expires: negative when it already has, null when it does not. */
export function daysLeft(expiresAt: string | null, now = Date.now()): number | null {
	if (!expiresAt) return null;
	const t = Date.parse(expiresAt);
	if (!Number.isFinite(t)) return null;
	return Math.ceil((t - now) / 86_400_000);
}
