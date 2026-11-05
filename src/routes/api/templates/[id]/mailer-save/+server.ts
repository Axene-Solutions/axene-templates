import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { templates } from '$lib/server/db/schema';
import { gate, loadApiKey, readJson, mailerFailure } from '$lib/server/mailer/http';
import { createTemplate, getTemplate, updateTemplate, type MailerTemplateInput } from '$lib/server/mailer/client';
import { getMailerPublicUrl } from '$lib/server/mailer/config';
import { createRateLimiter } from '$lib/server/mailer/guard';
import { forgetPlans } from '$lib/server/mailer/plancache';
import { htmlToText, validateSubject } from '$lib/server/mailer/validate';
import { RenderRefused, renderTemplateForMailer } from '$lib/server/render';
import { BlocksValidationError, compiledHtmlProblem, sanitizeBlocks } from '$lib/server/sanitize-blocks';
import { buildEnvelope, cleanLine, MAX_SUBJECT_MAILER, MAX_TEMPLATE_NAME } from '$lib/mailer-templates';

// 60 saves per user per hour. In memory: per process, reset on restart.
const limiter = createRateLimiter(60, 60 * 60 * 1000);
// One save at a time per user and template, so a double click cannot create two Mailer templates.
const inFlight = new Set<string>();

// POST /api/templates/:id/mailer-save { subject, name?, overwrite? }
// A linked template is only updated while Mailer still reports the updated_at recorded at the last
// open or save; otherwise 409 mailer_template_changed, unless overwrite is true.
export const POST: RequestHandler = async (event) => {
	const auth = gate(event, true);
	if (auth instanceof Response) return auth;

	const body = await readJson(event);
	if (!body) return json({ error: 'Invalid JSON body' }, { status: 400 });
	const subject = validateSubject(body.subject, MAX_SUBJECT_MAILER);
	if (!subject.ok) return json({ error: subject.error }, { status: 400 });
	let nameOverride: string | null = null;
	if (body.name !== undefined && body.name !== null && body.name !== '') {
		if (typeof body.name !== 'string') return json({ error: 'Name is invalid' }, { status: 400 });
		nameOverride = cleanLine(body.name);
		if (!nameOverride) return json({ error: 'Name must not be empty' }, { status: 400 });
		if (nameOverride.length > MAX_TEMPLATE_NAME) return json({ error: `Name must be at most ${MAX_TEMPLATE_NAME} characters` }, { status: 400 });
	}

	const [t] = await db.select().from(templates).where(eq(templates.id, event.params.id)).limit(1);
	if (!t) return json({ error: 'Template not found' }, { status: 404 });
	const owner = t.userId === auth.user.id;
	// Like Send: your own templates and starters only. Another user's public template can change between
	// preview and save, and its markup would reach your subscribers, so it must be copied first.
	if (!(owner || t.isStarter)) {
		if (t.isPublic) return json({ error: 'Copy this template to your account before saving it to Mailer', code: 'copy_required' }, { status: 403 });
		return json({ error: 'Forbidden' }, { status: 403 });
	}
	const overwrite = body.overwrite === true;

	const apiKey = await loadApiKey(auth);
	if (apiKey instanceof Response) return apiKey;

	const lock = `${auth.user.id}:${t.id}`;
	if (inFlight.has(lock)) return json({ error: 'A save is already in progress for this template.', code: 'save_in_progress' }, { status: 409 });

	const wait = limiter.hit(auth.user.id);
	if (wait > 0) {
		return json({ error: 'Too many saves. Try again later.', code: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(wait) } });
	}

	// The allowlist runs on read as well, so a row stored before it existed is cleaned here too.
	// A stored value that cannot be cleaned within the limits is refused, never saved as empty.
	let blocks: ReturnType<typeof sanitizeBlocks>;
	try {
		blocks = sanitizeBlocks(t.blocks, { strict: false });
	} catch (e) {
		if (e instanceof BlocksValidationError) return json({ error: `This template cannot be saved to Mailer: ${e.message}. Nothing was saved.`, code: 'render_refused' }, { status: 422 });
		throw e;
	}
	let html: string;
	try {
		// Placeholders must survive: compile without variable injection.
		html = renderTemplateForMailer(blocks).html;
	} catch (e) {
		if (e instanceof RenderRefused) return json({ error: `This template cannot be saved to Mailer because ${e.message}. Nothing was saved.`, code: e.code }, { status: 422 });
		console.error('Template render failed for mailer-save:', e instanceof Error ? e.message : 'unknown');
		return json({ error: 'The template could not be rendered' }, { status: 422 });
	}
	const problem = compiledHtmlProblem(html);
	if (problem) {
		console.error('mailer-save refused compiled HTML:', problem);
		return json({ error: `This template cannot be saved to Mailer because the compiled email failed a safety check (${problem}). Nothing was saved.`, code: 'unsafe_html' }, { status: 422 });
	}
	const name = nameOverride ?? (cleanLine(t.name) || 'Untitled').slice(0, MAX_TEMPLATE_NAME);
	const payload: MailerTemplateInput = {
		name,
		subject: subject.value,
		html_body: html,
		text_body: htmlToText(html),
		blocks_json: buildEnvelope(blocks),
	};

	inFlight.add(lock);
	try {
		// Only the owner's row is linked to a Mailer template; a copy of a shared template never touches the shared row.
		const linkedId = owner ? t.mailerTemplateId : null;
		let created = true;
		let res;
		if (linkedId) {
			created = false;
			// Precondition: Mailer's copy must be the one this row was last synced with. Mailer has no
			// conditional PATCH, so this is a read just before the write (a narrow race remains).
			const current = await getTemplate(apiKey, linkedId);
			if (current.ok) {
				if (!overwrite && (!t.mailerSyncedAt || current.data.updatedAt !== t.mailerSyncedAt)) {
					return json(
						{
							error: 'This template changed in Mailer since you opened it. Overwrite Mailer\'s copy, or reload it from Mailer.',
							code: 'mailer_template_changed',
							mailerUpdatedAt: current.data.updatedAt,
						},
						{ status: 409 },
					);
				}
				res = await updateTemplate(apiKey, linkedId, payload);
			} else if (current.status === 404) {
				res = current;
			} else {
				return mailerFailure(current.status, current.error);
			}
			if (!res.ok && res.status === 404) {
				// Deleted in Mailer: make a new one and repoint the row.
				created = true;
				res = await createTemplate(apiKey, payload);
			}
		} else {
			res = await createTemplate(apiKey, payload);
		}
		if (!res.ok) return mailerFailure(res.status, res.error);
		// The template count changed: the cached plan numbers are stale.
		forgetPlans(auth.user.id);

		if (owner) {
			// The row now equals Mailer's copy: record Mailer's version and when that was true here.
			await db
				.update(templates)
				.set({ mailerTemplateId: res.data.id, mailerSyncedAt: res.data.updatedAt, mailerSyncedLocalAt: t.updatedAt ?? new Date() })
				.where(eq(templates.id, t.id));
		}
		return json({
			mailerTemplateId: res.data.id,
			created,
			// True when the row now points at this Mailer template. A copy of a shared template is not linked.
			linked: owner,
			name: res.data.name,
			subject: res.data.subject,
			openUrl: `${getMailerPublicUrl()}/templates`,
		});
	} finally {
		inFlight.delete(lock);
	}
};
