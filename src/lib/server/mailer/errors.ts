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
