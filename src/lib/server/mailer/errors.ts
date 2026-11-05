// Maps a Mailer HTTP status to a short, safe message. Raw Mailer bodies are never forwarded.

export interface MappedError {
	code: string;
	message: string;
	/** HTTP status this app should answer with when the failure is the whole request. */
	http: number;
}

export function mapMailerStatus(status: number): MappedError {
	if (status === 0) return { code: 'mailer_unreachable', message: 'Could not reach Mailer. Try again shortly.', http: 502 };
	if (status === 401) return { code: 'mailer_key_invalid', message: 'Your Mailer API key is invalid or has been revoked.', http: 401 };
	if (status === 403) {
		return {
			code: 'mailer_forbidden',
			message: 'Mailer refused this. The key needs the scopes "Send emails" and "Read sender addresses", your plan must allow sending, and the sender domain must be verified.',
			http: 403,
		};
	}
	if (status === 422) return { code: 'mailer_sender_not_registered', message: 'Mailer rejected the message. Check that the sender address is registered on a verified domain.', http: 422 };
	if (status === 429) return { code: 'mailer_rate_limited', message: 'Mailer is rate limiting this account. Wait a moment and try again.', http: 429 };
	if (status >= 500) return { code: 'mailer_unavailable', message: 'Mailer is unavailable right now. Try again shortly.', http: 502 };
	return { code: 'mailer_error', message: 'Mailer could not process the request.', http: 502 };
}

// Matches Mailer's own plan-limit sentence exactly, so only that known text is ever forwarded.
const PLAN_LIMIT_RE = /^You've reached the maximum of \d{1,6} templates on the [A-Za-z0-9 _-]{1,40} plan\.$/;

/** Mailer's 403 detail if (and only if) it is the plan-limit sentence. */
export function planLimitMessage(detail: unknown): string | null {
	return typeof detail === 'string' && PLAN_LIMIT_RE.test(detail) ? detail : null;
}

/**
 * Errors for the template endpoints. `detail` is Mailer's error text, used only
 * to recognise the plan limit; no other Mailer text is forwarded.
 */
export function mapTemplateStatus(status: number, detail: unknown, op: 'read' | 'write'): MappedError {
	if (status === 403) {
		const limit = planLimitMessage(detail);
		if (limit) return { code: 'mailer_plan_limit', message: `${limit} Delete a template in Mailer or upgrade the plan, then save again.`, http: 403 };
		const scope = op === 'write' ? 'Write templates (templates:write)' : 'Read templates (templates:read)';
		return {
			code: 'mailer_missing_scope',
			message: `Mailer refused this. The key needs the scope "${scope}" and your Mailer plan must include templates. Create a new key with that scope in Mailer and reconnect it in Settings.`,
			http: 403,
		};
	}
	if (status === 404) return { code: 'mailer_template_not_found', message: 'That template no longer exists in Mailer.', http: 404 };
	if (status === 422) return { code: 'mailer_template_rejected', message: 'Mailer rejected the template. Check the name and subject and try again.', http: 422 };
	return mapMailerStatus(status);
}
