// Validation of named link input, mirroring the Mailer server. Pure.
import { LINK_KEY_RE, linkLabelError, linkUrlError } from '$lib/placeholders';
import type { TemplateLinkInput } from './client.ts';

export type Checked<T> = { ok: true; value: T } | { ok: false; error: string };

export function validateLinkInput(body: Record<string, unknown>, requireAll: boolean): Checked<TemplateLinkInput> {
	const out: TemplateLinkInput = {};
	if (body.label !== undefined || requireAll) {
		if (typeof body.label !== 'string') return { ok: false, error: 'Enter a name' };
		const e = linkLabelError(body.label);
		if (e) return { ok: false, error: e };
		out.label = body.label.trim();
	}
	if (body.url !== undefined || requireAll) {
		if (typeof body.url !== 'string') return { ok: false, error: 'Enter a URL' };
		const e = linkUrlError(body.url);
		if (e) return { ok: false, error: e };
		out.url = body.url.trim();
	}
	if (body.key !== undefined && body.key !== null && body.key !== '') {
		if (typeof body.key !== 'string' || !LINK_KEY_RE.test(body.key)) {
			return { ok: false, error: 'The key must start with a lowercase letter and use only lowercase letters, digits and underscores (64 characters at most)' };
		}
		out.key = body.key;
	}
	if (!requireAll && Object.keys(out).length === 0) return { ok: false, error: 'Nothing to change' };
	return { ok: true, value: out };
}
