import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { templates } from '$lib/server/db/schema';
import { gate, loadApiKey, mailerFailure, readJson } from '$lib/server/mailer/http';
import { listTemplateLinks, sendEmail } from '$lib/server/mailer/client';
import { createRateLimiter } from '$lib/server/mailer/guard';
import {
	detectVariables,
	escapeVariables,
	htmlToText,
	isValidEmail,
	validateFrom,
	validateRecipients,
	validateSubject,
	validateVariables,
} from '$lib/server/mailer/validate';
import { sendAll } from '$lib/server/mailer/sendall';
import { renderTemplateForSend } from '$lib/server/render';
import { collectUsage, linkFieldNeeds } from '$lib/placeholders';
import { compiledHtmlProblem, sanitizeBlocksForRead } from '$lib/server/sanitize-blocks';

const INJECTOR_DEFAULTS = new Set(['theme_color', 'logo', 'company_name']);

// 20 send requests per user per hour. In memory: per process, reset on restart.
const limiter = createRateLimiter(20, 60 * 60 * 1000);

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

	const blocks = sanitizeBlocksForRead(t.blocks);

	// Every {{variable}} the template uses needs a value, otherwise it would go out blank ("Hi ,").
	// theme_color, logo and company_name have built-in defaults in the injector.
	const missing = detectVariables(JSON.stringify(blocks)).filter((n) => {
		if (INJECTOR_DEFAULTS.has(n)) return false;
		const v = vars.value[n];
		return v === undefined || (typeof v === 'string' && v.trim() === '');
	});
	if (missing.length) {
		return json({ error: `These variables need a value: ${missing.join(', ')}`, code: 'missing_variables', missing }, { status: 400 });
	}

	const apiKey = await loadApiKey(auth);
	if (apiKey instanceof Response) return apiKey;

	// Named links the template uses: loaded once per request with the user's key.
	const usage = collectUsage(blocks);
	const links = new Map<string, string>();
	if (usage.links.size) {
		const res = await listTemplateLinks(apiKey);
		if (!res.ok) return mailerFailure(res.status, res.error);
		for (const l of res.data) links.set(l.key, l.url);
		const unknown = [...usage.links].filter((k) => !links.has(k));
		if (unknown.length) {
			return json({ error: `These links do not exist in your Mailer account: ${unknown.map((k) => `{{link:${k}}}`).join(', ')}`, code: 'unknown_links', unknown }, { status: 400 });
		}
		// A link can need a field the template itself never mentions.
		const need = [...linkFieldNeeds(usage.links, links)].filter((n) => {
			if (INJECTOR_DEFAULTS.has(n) && !(n in vars.value)) return false;
			const v = vars.value[n];
			return v === undefined || (typeof v === 'string' && v.trim() === '');
		});
		if (need.length) {
			return json({ error: `These variables need a value: ${need.join(', ')}`, code: 'missing_variables', missing: need }, { status: 400 });
		}
	}

	// Count only requests that would actually reach Mailer.
	const wait = limiter.hit(auth.user.id);
	if (wait > 0) {
		return json({ error: 'Too many send requests. Try again later.', code: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(wait) } });
	}

	let html: string;
	try {
		const out = renderTemplateForSend(blocks, vars.value, links);
		if (!out.ok) {
			const keys = out.badLinks.map((b) => `{{link:${b.key}}} (${b.error})`).join(', ');
			return json({ error: `These links cannot be used: ${keys}`, code: 'invalid_links', links: out.badLinks }, { status: 400 });
		}
		html = out.html;
	} catch (e) {
		console.error('Template render failed for send:', e instanceof Error ? e.message : 'unknown');
		return json({ error: 'The template could not be rendered' }, { status: 422 });
	}
	const problem = compiledHtmlProblem(html);
	if (problem) {
		console.error('send refused compiled HTML:', problem);
		return json({ error: `This email was not sent because the compiled email failed a safety check (${problem}).`, code: 'unsafe_html' }, { status: 422 });
	}
	const text = htmlToText(html);

	// One Mailer request per recipient (so recipients never see each other), 5 at a time, within a
	// 45 s budget that stays under the proxy timeout. Recipients not reached are reported as not sent.
	const results = await sendAll(to.value, async (addr, timeoutMs) => {
		const res = await sendEmail(apiKey, { from: from.value, to: addr, subject: subject.value, html, text, replyTo }, timeoutMs);
		return res.ok ? { ok: true } : { ok: false, status: res.status, message: res.error.message };
	});

	return json({ results, keyInvalid: results.some((r) => r.status === 401) });
};
