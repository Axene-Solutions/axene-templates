import { getMailerBaseUrl } from './config';
import { mapContactsStatus, mapLinkStatus, mapMailerStatus, mapTemplateStatus, type MappedError } from './errors';

export interface MailerSender {
	email: string;
	name: string | null;
}

export type MailerCall<T> = { ok: true; data: T } | { ok: false; status: number; error: MappedError };

async function call(apiKey: string | null, method: string, path: string, body?: unknown, timeoutMs = 15_000): Promise<{ status: number; json: unknown }> {
	try {
		const res = await fetch(`${getMailerBaseUrl()}/v1${path}`, {
			method,
			headers: {
				...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
				Accept: 'application/json',
				...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
			},
			body: body === undefined ? undefined : JSON.stringify(body),
			signal: AbortSignal.timeout(timeoutMs),
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
export async function sendEmail(apiKey: string, m: OutgoingEmail, timeoutMs?: number): Promise<MailerCall<null>> {
	const { status } = await call(apiKey, 'POST', '/emails/', {
		from_: m.from,
		to: [{ email: m.to }],
		subject: m.subject,
		html: m.html,
		text: m.text,
		...(m.replyTo ? { reply_to: { email: m.replyTo } } : {}),
		tags: ['axene-templates'],
	}, timeoutMs);
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

// ---- Contact fields (scope contacts:read) ----

export interface ContactFields {
	builtins: { key: string; label: string }[];
	fields: { key: string; count: number }[];
}

const KEY_RE = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/;

/** Field names and how many contacts use them. Mailer never sends values; neither does this. */
export async function listContactFields(apiKey: string): Promise<MailerCall<ContactFields>> {
	const { status, json } = await call(apiKey, 'GET', '/contacts/fields');
	if (status < 200 || status >= 300) return { ok: false, status, error: mapContactsStatus(status) };
	const o = (json && typeof json === 'object' ? json : {}) as Record<string, unknown>;
	const builtins: ContactFields['builtins'] = [];
	for (const b of Array.isArray(o.builtins) ? o.builtins.slice(0, 50) : []) {
		const k = str((b as any)?.key, 64);
		if (k && KEY_RE.test(k)) builtins.push({ key: k, label: str((b as any)?.label, 80) ?? k });
	}
	const fields: ContactFields['fields'] = [];
	for (const f of Array.isArray(o.fields) ? o.fields.slice(0, 500) : []) {
		const k = str((f as any)?.key, 64);
		const n = Number((f as any)?.count);
		if (k && KEY_RE.test(k)) fields.push({ key: k, count: Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0 });
	}
	return { ok: true, data: { builtins, fields } };
}

// ---- Named links (scopes templates:read and templates:write) ----

export interface TemplateLink {
	id: string;
	key: string;
	label: string;
	url: string;
	token: string;
	createdAt: string | null;
	updatedAt: string | null;
}

export interface TemplateLinkInput {
	label?: string;
	url?: string;
	key?: string;
}

function toLink(raw: unknown): TemplateLink | null {
	if (!raw || typeof raw !== 'object') return null;
	const t = raw as Record<string, unknown>;
	const id = str(t.id, 64);
	const key = str(t.key, 64);
	const url = str(t.url, 2100);
	if (!id || !key || url === null) return null;
	return {
		id,
		key,
		label: str(t.label, 200) ?? key,
		url,
		token: str(t.token, 80) ?? `{{link:${key}}}`,
		createdAt: str(t.created_at, 64),
		updatedAt: str(t.updated_at, 64),
	};
}

function failLink(status: number, json: unknown, op: 'read' | 'write'): { ok: false; status: number; error: MappedError } {
	const detail = json && typeof json === 'object' ? (json as any).detail : undefined;
	return { ok: false, status, error: mapLinkStatus(status, detail, op) };
}

export async function listTemplateLinks(apiKey: string): Promise<MailerCall<TemplateLink[]>> {
	const { status, json } = await call(apiKey, 'GET', '/template-links/');
	if (status < 200 || status >= 300) return failLink(status, json, 'read');
	const arr: unknown[] = Array.isArray(json) ? json : Array.isArray((json as any)?.items) ? (json as any).items : [];
	const out: TemplateLink[] = [];
	for (const raw of arr.slice(0, 300)) {
		const l = toLink(raw);
		if (l) out.push(l);
	}
	return { ok: true, data: out };
}

export async function createTemplateLink(apiKey: string, input: TemplateLinkInput): Promise<MailerCall<TemplateLink>> {
	const { status, json } = await call(apiKey, 'POST', '/template-links/', input);
	if (status < 200 || status >= 300) return failLink(status, json, 'write');
	const l = toLink(json);
	return l ? { ok: true, data: l } : { ok: false, status: 502, error: mapMailerStatus(502) };
}

export async function updateTemplateLink(apiKey: string, id: string, input: TemplateLinkInput): Promise<MailerCall<TemplateLink>> {
	const { status, json } = await call(apiKey, 'PATCH', `/template-links/${encodeURIComponent(id)}`, input);
	if (status < 200 || status >= 300) return failLink(status, json, 'write');
	const l = toLink(json);
	return l ? { ok: true, data: l } : { ok: false, status: 502, error: mapMailerStatus(502) };
}

export async function deleteTemplateLink(apiKey: string, id: string): Promise<MailerCall<null>> {
	const { status, json } = await call(apiKey, 'DELETE', `/template-links/${encodeURIComponent(id)}`);
	if (status < 200 || status >= 300) return failLink(status, json, 'write');
	return { ok: true, data: null };
}

// ---- Plan (GET /v1/billing/usage works with any valid key; /v1/billing/plans is public) ----

export async function getBillingUsage(apiKey: string): Promise<MailerCall<unknown>> {
	const { status, json } = await call(apiKey, 'GET', '/billing/usage');
	if (status < 200 || status >= 300) return { ok: false, status, error: mapMailerStatus(status) };
	return { ok: true, data: json };
}

/** The plan catalogue. Public in Mailer, so the key is not sent. */
export async function getBillingPlans(): Promise<MailerCall<unknown>> {
	const { status, json } = await call(null, 'GET', '/billing/plans');
	if (status < 200 || status >= 300) return { ok: false, status, error: mapMailerStatus(status) };
	return { ok: true, data: json };
}
