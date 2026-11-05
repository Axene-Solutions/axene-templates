import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	chooseNudge, keyProblem, parseDismissal, isSuppressed, snooze, neverAgain, createSessionLedger, SNOOZE_MS, NO_DISMISSAL, storageKey,
} from '../src/lib/nudge.ts';
import { buildPlanSummary, saveBlockedReason, templatesLine, daysLeft } from '../src/lib/mailer-plan.ts';
import { getCachedPlan, setCachedPlan, forgetPlans, PLAN_TTL_MS } from '../src/lib/server/mailer/plancache.ts';

const plans = [{ name: 'free', max_templates: 2 }, { name: 'business', max_templates: -1 }];
const usage = (name: string, features: any = {}) => ({
	plan: { name, daily_limit: name === 'business' ? 0 : 100, monthly_limit: 3000 },
	usage: { emails_today: 5, emails_this_month: 100 },
	features: { templates: true, ...features },
	subscription: { expires_at: null },
});
const plan = (n: number | null, name = 'free', features: any = {}) => buildPlanSummary(usage(name, features), plans, n);

const base = { signedIn: true, status: 'connected' as const, keyRevoked: false, plan: plan(0), mailerTemplateId: '', inSync: false };

test('nudge state selection', () => {
	assert.equal(chooseNudge({ ...base, signedIn: false }), null);
	assert.equal(chooseNudge({ ...base, status: 'loading' }), null);
	assert.equal(chooseNudge({ ...base, status: 'unavailable' }), null);
	assert.equal(chooseNudge({ ...base, status: 'disconnected', plan: null }), 'not_linked');
	assert.equal(chooseNudge(base), 'not_saved');
	assert.equal(chooseNudge({ ...base, mailerTemplateId: 'm1', inSync: true }), 'saved');
	assert.equal(chooseNudge({ ...base, mailerTemplateId: 'm1', inSync: false }), 'stale');
	// At the template limit: new templates cannot be saved, but a linked one can be updated.
	assert.equal(chooseNudge({ ...base, plan: plan(2) }), 'limit');
	assert.equal(chooseNudge({ ...base, plan: plan(2), mailerTemplateId: 'm1', inSync: true }), 'saved');
	// Key problems win over everything else.
	assert.equal(chooseNudge({ ...base, keyRevoked: true, plan: null }), 'broken');
	assert.equal(chooseNudge({ ...base, status: 'unreadable', plan: null }), 'broken');
	assert.equal(chooseNudge({ ...base, plan: plan(null) }), 'broken');
	assert.equal(chooseNudge({ ...base, plan: plan(null), mailerTemplateId: 'm1', inSync: true }), 'broken');
	// Unlimited plans never hit the limit.
	assert.equal(chooseNudge({ ...base, plan: plan(500, 'business') }), 'not_saved');
});

test('keyProblem tells revoked, unreadable and missing scope apart', () => {
	assert.equal(keyProblem({ status: 'unreadable', keyRevoked: true, plan: null }), 'unreadable');
	assert.equal(keyProblem({ status: 'connected', keyRevoked: true, plan: null }), 'revoked');
	assert.equal(keyProblem({ status: 'connected', keyRevoked: false, plan: plan(null) }), 'scope');
	assert.equal(keyProblem({ status: 'connected', keyRevoked: false, plan: plan(1) }), null);
	// No plan loaded yet: nothing is known to be wrong.
	assert.equal(keyProblem({ status: 'connected', keyRevoked: false, plan: null }), null);
});

test('dismissals: Not now lasts 14 days, Dont show again is permanent', () => {
	const t0 = 1_800_000_000_000;
	assert.equal(isSuppressed(NO_DISMISSAL, t0), false);
	const s = snooze(NO_DISMISSAL, t0);
	assert.equal(s.until, t0 + SNOOZE_MS);
	assert.equal(SNOOZE_MS, 14 * 86_400_000);
	assert.equal(isSuppressed(s, t0 + SNOOZE_MS - 1), true);
	assert.equal(isSuppressed(s, t0 + SNOOZE_MS), false);
	const n = neverAgain(s);
	assert.equal(isSuppressed(n, t0 + 10 * SNOOZE_MS), true);
	// It round trips through storage text.
	assert.deepEqual(parseDismissal(JSON.stringify(n)), n);
	assert.equal(storageKey('u1'), 'axene.nudge.v1.u1');
});

test('stored dismissals are read defensively', () => {
	for (const bad of [null, undefined, '', 'nope', '[]', '5', '{"never":"yes","until":"x"}', '{"until":-5}', '{"until":1e999}']) {
		assert.deepEqual(parseDismissal(bad as any), NO_DISMISSAL, String(bad));
	}
	assert.deepEqual(parseDismissal('{"never":true,"until":0,"extra":1}'), { never: true, until: 0 });
});

test('shown at most once per template per session', () => {
	const l = createSessionLedger();
	assert.equal(l.claim('t1'), true);
	assert.equal(l.claim('t1'), false);
	assert.equal(l.claim('t2'), true);
	assert.equal(l.claim(''), false);
});

test('plan summary: limits, unlimited, features, upgrade only when relevant', () => {
	const p = plan(1, 'free', { scheduled_send: false })!;
	assert.equal(templatesLine(p), 'Templates: used 1 of 2');
	assert.equal(p.upgradeReason, null);
	assert.deepEqual(p.featuresOff.map((f) => f.key), ['scheduled_send']);
	assert.equal(plan(2)!.atTemplateLimit, true);
	assert.ok(plan(2)!.upgradeReason);
	assert.equal(plan(2)!.nearTemplateLimit, false);
	assert.equal(buildPlanSummary(usage('free'), [{ name: 'free', max_templates: 10 }], 8)!.nearTemplateLimit, true);
	assert.ok(buildPlanSummary(usage('free'), [{ name: 'free', max_templates: 10 }], 8)!.upgradeReason);
	const biz = plan(40, 'business')!;
	assert.equal(templatesLine(biz), 'Templates: 40 used, unlimited');
	assert.equal(biz.daily!.limit, null);
	assert.equal(biz.upgradeReason, null);
	assert.ok(plan(0, 'free', { templates: false })!.upgradeReason);
	// Unknown catalogue: the limit is not guessed.
	const unknown = buildPlanSummary(usage('free'), null, 3)!;
	assert.equal(unknown.templates.limitKnown, false);
	assert.equal(unknown.atTemplateLimit, false);
	assert.equal(buildPlanSummary({ nonsense: 1 }, plans, 1), null);
});

test('save is blocked at the limit but updating a saved template is not', () => {
	assert.match(saveBlockedReason(plan(2), false)!, /all 2 templates on the free plan/);
	assert.equal(saveBlockedReason(plan(2), true), null);
	assert.equal(saveBlockedReason(plan(1), false), null);
	assert.equal(saveBlockedReason(null, false), null);
	assert.match(saveBlockedReason(plan(0, 'free', { templates: false }), false)!, /does not include templates/);
});

test('daysLeft', () => {
	const now = Date.parse('2026-11-05T12:00:00Z');
	assert.equal(daysLeft(null, now), null);
	assert.equal(daysLeft('2026-11-08T12:00:00Z', now), 3);
	assert.ok(daysLeft('2026-11-01T00:00:00Z', now)! < 0);
	assert.equal(daysLeft('garbage', now), null);
});

test('plan cache lasts 60 seconds and can be forgotten', () => {
	const p = plan(1)!;
	const id = 'u9:abc';
	setCachedPlan(id, p, 1000);
	assert.equal(getCachedPlan(id, 1000 + PLAN_TTL_MS - 1), p);
	assert.equal(getCachedPlan(id, 1000 + PLAN_TTL_MS), null);
	setCachedPlan(id, p, 5000);
	forgetPlans('u9');
	assert.equal(getCachedPlan(id, 5001), null);
});
