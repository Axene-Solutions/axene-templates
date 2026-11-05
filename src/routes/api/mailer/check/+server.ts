import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { gate, loadApiKey, mailerFailure } from '$lib/server/mailer/http';
import { listSenders, listTemplates, type MailerCall } from '$lib/server/mailer/client';
import { mapMailerStatus } from '$lib/server/mailer/errors';
import { createRateLimiter } from '$lib/server/mailer/guard';

// 30 checks per user per hour. In memory: per process, reset on restart.
const limiter = createRateLimiter(30, 60 * 60 * 1000);

type State = 'ok' | 'missing' | 'unknown' | 'unverified';
interface ScopeResult {
	scope: string;
	label: string;
	state: State;
	note?: string;
}

function stateOf(res: MailerCall<unknown>): State {
	if (res.ok) return 'ok';
	return res.status === 403 ? 'missing' : 'unknown';
}

// GET /api/mailer/check -> which scopes of the stored key are known to work.
// Read scopes are probed with read calls. Send and write scopes are never probed
// (that would send mail or write data), so they are reported as unverified.
export const GET: RequestHandler = async (event) => {
	const auth = gate(event, false);
	if (auth instanceof Response) return auth;
	const apiKey = await loadApiKey(auth);
	if (apiKey instanceof Response) return apiKey;

	const wait = limiter.hit(auth.user.id);
	if (wait > 0) {
		return json({ error: 'Too many checks. Try again later.', code: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(wait) } });
	}

	const [senders, tpls] = await Promise.all([listSenders(apiKey), listTemplates(apiKey)]);
	if ((!senders.ok && senders.status === 401) || (!tpls.ok && tpls.status === 401)) {
		return mailerFailure(401, mapMailerStatus(401));
	}
	if (!senders.ok && !tpls.ok && senders.status !== 403 && tpls.status !== 403) {
		return mailerFailure(senders.status, senders.error);
	}

	const scopes: ScopeResult[] = [
		{ scope: 'senders:read', label: 'Read sender addresses', state: stateOf(senders) },
		{
			scope: 'templates:read',
			label: 'Read templates',
			state: stateOf(tpls),
			...(!tpls.ok && tpls.status === 403 ? { note: 'Missing, or your Mailer plan does not include templates.' } : {}),
		},
		{ scope: 'emails:send', label: 'Send emails', state: 'unverified', note: 'Not tested, a test would send mail. Verified on first send.' },
		{ scope: 'templates:write', label: 'Write templates', state: 'unverified', note: 'Not tested, a test would write data. Verified on first save.' },
	];
	return json({
		scopes,
		senders: senders.ok ? senders.data.length : null,
		templates: tpls.ok ? tpls.data.length : null,
	});
};
