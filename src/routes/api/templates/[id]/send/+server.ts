import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { templates } from '$lib/server/db/schema';
import { gate, loadApiKey, readJson } from '$lib/server/mailer/http';
import { sendEmail } from '$lib/server/mailer/client';
import { createRateLimiter } from '$lib/server/mailer/guard';
import {
	escapeVariables,
	htmlToText,
	isValidEmail,
	validateFrom,
	validateRecipients,
	validateSubject,
	validateVariables,
} from '$lib/server/mailer/validate';
import { renderTemplateHtml } from '$lib/server/render';

// 20 send requests per user per hour. In memory: per process, reset on restart.
const limiter = createRateLimiter(20, 60 * 60 * 1000);

interface Result {
	to: string;
	ok: boolean;
	status?: number;
	error?: string;
}

// POST /api/templates/:id/send
export const POST: RequestHandler = async (event) => {
	const auth = gate(event, true);
	if (auth instanceof Response) return auth;

	const body = await readJson(event);
	if (!body) return json({ error: 'Invalid JSON body' }, { status: 400 });

	const from = validateFrom(body.from);
	if (!from.ok) return json({ error: from.error }, { status: 400 });
	const to = validateRecipients(body.to);
	if (!to.ok) return json({ error: to.error }, { status: 400 });
	const subject = validateSubject(body.subject);
	if (!subject.ok) return json({ error: subject.error }, { status: 400 });
	const vars = validateVariables(body.variables);
	if (!vars.ok) return json({ error: vars.error }, { status: 400 });
	let replyTo: string | undefined;
	if (body.replyTo !== undefined && body.replyTo !== null && body.replyTo !== '') {
		if (typeof body.replyTo !== 'string' || !isValidEmail(body.replyTo)) return json({ error: 'Reply-to address is invalid' }, { status: 400 });
		replyTo = body.replyTo;
	}

	const [t] = await db.select().from(templates).where(eq(templates.id, event.params.id)).limit(1);
	if (!t) return json({ error: 'Template not found' }, { status: 404 });
	// Only your own templates and starters can be sent. Another user's public template can change
	// after you previewed it, so it must be copied to your account first.
	if (!(t.isStarter || t.userId === auth.user.id)) {
		if (t.isPublic) return json({ error: 'Copy this template to your account before sending', code: 'copy_required' }, { status: 403 });
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const apiKey = await loadApiKey(auth);
	if (apiKey instanceof Response) return apiKey;

	// Count only requests that would actually reach Mailer.
	const wait = limiter.hit(auth.user.id);
	if (wait > 0) {
		return json({ error: 'Too many send requests. Try again later.', code: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(wait) } });
	}

	let html: string;
	try {
		html = renderTemplateHtml(t.blocks, escapeVariables(vars.value)).html;
	} catch (e) {
		console.error('Template render failed for send:', e instanceof Error ? e.message : 'unknown');
		return json({ error: 'The template could not be rendered' }, { status: 422 });
	}
	const text = htmlToText(html);

	// One Mailer request per recipient, sequentially, so recipients never see each other.
	const results: Result[] = [];
	let stopped: string | null = null;
	for (const addr of to.value) {
		if (stopped) {
			results.push({ to: addr, ok: false, error: stopped });
			continue;
		}
		const res = await sendEmail(apiKey, { from: from.value, to: addr, subject: subject.value, html, text, replyTo });
		if (res.ok) {
			results.push({ to: addr, ok: true, status: 202 });
			continue;
		}
		results.push({ to: addr, ok: false, status: res.status || undefined, error: res.error.message });
		// A dead key or a rate limit will fail every remaining message: stop hammering Mailer.
		if (res.status === 401 || res.status === 429) stopped = 'Not sent: ' + res.error.message;
	}

	return json({ results, keyInvalid: results.some((r) => r.status === 401) });
};
