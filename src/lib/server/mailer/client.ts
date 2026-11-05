import { getMailerBaseUrl } from './config';
import { mapMailerStatus, mapTemplateStatus, type MappedError } from './errors';

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

// ---- Templates (scopes templates:read and templates:write) ----

/** A Mailer template as returned by its API, read defensively: nothing here is trusted. */
export interface MailerTemplate {
	id: string;
	name: string;
	subject: string | null;
	blocksJson: unknown;
	updatedAt: string | null;
}

export interface MailerTemplateInput {
	name?: string;
	subject?: string;
	html_body?: string;
	text_body?: string;
	blocks_json?: unknown;
}

function str(v: unknown, max: number): string | null {
	return typeof v === 'string' ? v.slice(0, max) : null;
}

function toTemplate(raw: unknown): MailerTemplate | null {
	if (!raw || typeof raw !== 'object') return null;
	const t = raw as Record<string, unknown>;
	const id = str(t.id, 64);
	if (!id) return null;
	return {
		id,
		name: str(t.name, 300) ?? 'Untitled',
		subject: str(t.subject, 1000),
		blocksJson: t.blocks_json ?? null,
		updatedAt: str(t.updated_at, 64),
	};
}

function failTemplate(status: number, json: unknown, op: 'read' | 'write'): { ok: false; status: number; error: MappedError } {
	const detail = json && typeof json === 'object' ? (json as any).detail : undefined;
	return { ok: false, status, error: mapTemplateStatus(status, detail, op) };
}

export async function listTemplates(apiKey: string): Promise<MailerCall<MailerTemplate[]>> {
	const { status, json } = await call(apiKey, 'GET', '/templates/');
	if (status < 200 || status >= 300) return failTemplate(status, json, 'read');
	const arr: unknown[] = Array.isArray(json) ? json : Array.isArray((json as any)?.items) ? (json as any).items : [];
	const out: MailerTemplate[] = [];
	for (const raw of arr.slice(0, 500)) {
		const t = toTemplate(raw);
		if (t) out.push(t);
	}
	return { ok: true, data: out };
}

export async function getTemplate(apiKey: string, id: string): Promise<MailerCall<MailerTemplate>> {
	const { status, json } = await call(apiKey, 'GET', `/templates/${encodeURIComponent(id)}`);
	if (status < 200 || status >= 300) return failTemplate(status, json, 'read');
	const t = toTemplate(json);
	if (!t) return { ok: false, status: 502, error: mapMailerStatus(502) };
	return { ok: true, data: t };
}

export async function createTemplate(apiKey: string, input: MailerTemplateInput): Promise<MailerCall<MailerTemplate>> {
	const { status, json } = await call(apiKey, 'POST', '/templates/', input);
	if (status < 200 || status >= 300) return failTemplate(status, json, 'write');
	const t = toTemplate(json);
	if (!t) return { ok: false, status: 502, error: mapMailerStatus(502) };
	return { ok: true, data: t };
}

export async function updateTemplate(apiKey: string, id: string, input: MailerTemplateInput): Promise<MailerCall<MailerTemplate>> {
	const { status, json } = await call(apiKey, 'PATCH', `/templates/${encodeURIComponent(id)}`, input);
	if (status < 200 || status >= 300) return failTemplate(status, json, 'write');
	const t = toTemplate(json);
	if (!t) return { ok: false, status: 502, error: mapMailerStatus(502) };
	return { ok: true, data: t };
}
