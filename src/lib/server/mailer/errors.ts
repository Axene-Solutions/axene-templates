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

/** Mailer error text that is safe to show: one short plain line, no markup, no key-like strings. */
export function safeDetail(detail: unknown, max = 240): string | null {
	let t: unknown = detail;
	if (Array.isArray(t)) t = (t[0] as any)?.msg;
	if (typeof t !== 'string') return null;
	const line = t.replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim();
	if (!line || /axm_k_/i.test(line)) return null;
	return line.slice(0, max);
}

/** A send Mailer accepted with 202 but stored as rejected. Its reason is Mailer's own sentence, cleaned. */
export function mapRejection(reason: unknown): MappedError {
	const d = safeDetail(reason);
	return {
		code: 'mailer_rejected',
		message: d ? `Mailer rejected the message: ${d}` : 'Mailer rejected the message. Check that the sender address is on a verified domain.',
		http: 422,
	};
}

const CAP_RE =/\b(maximum|limit|reached|cap|upgrade)\b/i;
const SCOPE_RE = /\bscope|permission\b/i;

/** Errors for GET /v1/contacts/fields (scope contacts:read). */
export function mapContactsStatus(status: number): MappedError {
	if (status === 403) {
		return {
			code: 'mailer_missing_scope',
			message: 'Mailer refused this. The key needs the scope "Read contacts (contacts:read)". Create a key with that scope in Mailer and reconnect it in Settings.',
			http: 403,
		};
	}
	return mapMailerStatus(status);
}

/**
 * Errors for /v1/template-links. A 403 is either a missing scope or the cap of 100 links:
 * the cap sentence is Mailer's own and is passed through, a scope problem gets our wording.
 */
export function mapLinkStatus(status: number, detail: unknown, op: 'read' | 'write'): MappedError {
	if (status === 403) {
		const d = safeDetail(detail);
		if (d && CAP_RE.test(d) && !SCOPE_RE.test(d)) return { code: 'mailer_plan_limit', message: d, http: 403 };
		const scope = op === 'write' ? 'Write templates (templates:write)' : 'Read templates (templates:read)';
		return {
			code: 'mailer_missing_scope',
			message: `Mailer refused this. The key needs the scope "${scope}" and your Mailer plan must include templates. Create a new key with that scope in Mailer and reconnect it in Settings.`,
			http: 403,
		};
	}
	if (status === 404) return { code: 'mailer_link_not_found', message: 'That link no longer exists in Mailer.', http: 404 };
	if (status === 409) return { code: 'mailer_link_exists', message: safeDetail(detail) ?? 'A link with this key already exists.', http: 409 };
	if (status === 422) return { code: 'mailer_link_rejected', message: safeDetail(detail) ?? 'Mailer rejected the link. Check the name, key and URL.', http: 422 };
	return mapMailerStatus(status);
}
