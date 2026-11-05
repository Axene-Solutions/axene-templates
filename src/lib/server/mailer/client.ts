import { getMailerBaseUrl } from './config';
import { mapMailerStatus, type MappedError } from './errors';

export interface MailerSender {
	email: string;
	name: string | null;
}

export type MailerCall<T> = { ok: true; data: T } | { ok: false; status: number; error: MappedError };

async function call(apiKey: string, method: string, path: string, body?: unknown): Promise<{ status: number; json: unknown }> {
	try {
		const res = await fetch(`${getMailerBaseUrl()}/v1${path}`, {
			method,
			headers: {
				Authorization: `Bearer ${apiKey}`,
				Accept: 'application/json',
				...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
			},
			body: body === undefined ? undefined : JSON.stringify(body),
			signal: AbortSignal.timeout(15_000),
			redirect: 'error',
		});
		const json = await res.json().catch(() => null);
		return { status: res.status, json };
	} catch {
		// Network failure, timeout or redirect: never include the cause (it could echo the URL or key).
		return { status: 0, json: null };
	}
}

export async function listSenders(apiKey: string): Promise<MailerCall<MailerSender[]>> {
	const { status, json } = await call(apiKey, 'GET', '/sender-addresses/');
	if (status < 200 || status >= 300) return { ok: false, status, error: mapMailerStatus(status) };
	const arr: unknown[] = Array.isArray(json)
		? json
		: Array.isArray((json as any)?.items)
			? (json as any).items
			: Array.isArray((json as any)?.data)
				? (json as any).data
				: [];
	const senders: MailerSender[] = [];
	for (const s of arr as any[]) {
		if (!s || typeof s.email !== 'string' || s.is_active === false) continue;
		senders.push({ email: s.email, name: typeof s.display_name === 'string' && s.display_name ? s.display_name : null });
	}
	return { ok: true, data: senders };
}

export interface OutgoingEmail {
	from: { email: string; name?: string };
	to: string;
	subject: string;
	html: string;
	text: string;
	replyTo?: string;
}

/** Exactly one recipient per call, so recipients never see each other. */
export async function sendEmail(apiKey: string, m: OutgoingEmail): Promise<MailerCall<null>> {
	const { status } = await call(apiKey, 'POST', '/emails/', {
		from_: m.from,
		to: [{ email: m.to }],
		subject: m.subject,
		html: m.html,
		text: m.text,
		...(m.replyTo ? { reply_to: { email: m.replyTo } } : {}),
		tags: ['axene-templates'],
	});
	if (status >= 200 && status < 300) return { ok: true, data: null };
	return { ok: false, status, error: mapMailerStatus(status) };
}
