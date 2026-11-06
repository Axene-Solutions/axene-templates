/**
 * Pure logic for InsertFieldModal.svelte (the design's panItems / pan / insOpts): which rows the
 * Insert field and Choose a link picker shows for a search, the token each row inserts, the
 * hint chips and the fallback preview line. Tested in tests/panel-insert.test.ts.
 *
 * Usage:
 *   const view = buildInsertView({ mode: 'field', query, fallback, builtins, contactFields, links })
 *   view.items   // rows to render; view.options are the selectable ones, in order
 */

import { NO_FALLBACK_KEYS, tok, type SuggestFieldDef, type SuggestLinkDef } from './suggest';

export type InsertMode = 'field' | 'link';

export type InsertItem =
	| { kind: 'head'; label: string; manage: boolean }
	| { kind: 'opt'; index: number; key: string; sub: string; hint: string; token: string }
	| { kind: 'note'; label: string };

export interface InsertInput {
	mode: InsertMode;
	query: string;
	fallback: string;
	/** Built in fields (key and label), for example name / Full name. */
	builtins: readonly SuggestFieldDef[];
	/** The account's contact fields; label is the sub text, for example "412 contacts". */
	contactFields: readonly SuggestFieldDef[];
	links: readonly SuggestLinkDef[];
	/** Why a fallback is not allowed, or null. Defaults to the design rule (no braces or pipe). */
	fallbackError?: (fallback: string) => string | null;
}

export interface InsertView {
	title: string;
	placeholder: string;
	foot: string;
	/** Line under the Fallback input (field mode only). */
	preview: string;
	items: InsertItem[];
	options: Extract<InsertItem, { kind: 'opt' }>[];
	/** True when the fallback is invalid: Insert is disabled. */
	fallbackBad: boolean;
	actionLabel: 'Insert' | 'Use link';
}

export function designFallbackError(fb: string): string | null {
	return /[{}|]/.test(fb) ? 'A fallback cannot contain braces or a pipe.' : null;
}

const CUSTOM_KEY = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function buildInsertView(input: InsertInput): InsertView {
	const iq = input.query.trim().toLowerCase();
	const raw = input.query.trim();
	const fb = input.fallback.trim();
	const fbErr = fb ? (input.fallbackError ?? designFallbackError)(fb) : null;
	const items: InsertItem[] = [];
	const opt = (key: string, sub: string, hint: string, token: string) =>
		items.push({ kind: 'opt', index: 0, key, sub, hint, token });
	const fieldToken = (k: string) => tok(k + (fb ? '|' + fb : ''));
	const fieldHint = (k: string) => (NO_FALLBACK_KEYS.has(k) ? '' : 'needs a fallback');

	if (input.mode === 'field') {
		const bi = input.builtins.filter((x) => !iq || x.key.toLowerCase().indexOf(iq) >= 0 || x.label.toLowerCase().indexOf(iq) >= 0);
		const cf = input.contactFields.filter((x) => !iq || x.key.toLowerCase().indexOf(iq) >= 0);
		if (bi.length) {
			items.push({ kind: 'head', label: 'Built in', manage: false });
			bi.forEach((x) => opt(x.key, x.label, fieldHint(x.key), fieldToken(x.key)));
		}
		if (cf.length) {
			items.push({ kind: 'head', label: 'Your contact fields', manage: false });
			cf.forEach((x) => opt(x.key, x.label, fieldHint(x.key), fieldToken(x.key)));
		}
		const known = input.builtins.concat(input.contactFields).some((x) => x.key.toLowerCase() === raw.toLowerCase());
		if (raw && CUSTOM_KEY.test(raw) && !known) opt(raw, 'Use as a custom field', 'custom', fieldToken(raw));
		const lk = input.links.filter((l) => !iq || l.key.indexOf(iq) >= 0 || l.label.toLowerCase().indexOf(iq) >= 0);
		if (lk.length) {
			items.push({ kind: 'head', label: 'Named links', manage: true });
			lk.forEach((l) => opt('link:' + l.key, l.label, '', tok('link:' + l.key)));
		}
		if (!items.length) items.push({ kind: 'note', label: 'Nothing matches that search.' });
	} else {
		const lk = input.links.filter(
			(l) => !iq || l.key.indexOf(iq) >= 0 || l.label.toLowerCase().indexOf(iq) >= 0 || (l.url ?? '').toLowerCase().indexOf(iq) >= 0,
		);
		items.push({ kind: 'head', label: 'Named links', manage: true });
		lk.forEach((l) => opt(tok('link:' + l.key), l.label + ' | ' + (l.url ?? ''), '', tok('link:' + l.key)));
		if (!lk.length) items.push({ kind: 'note', label: input.links.length ? 'Nothing matches that search.' : 'No named links yet. Add one with Manage links.' });
	}

	const options: Extract<InsertItem, { kind: 'opt' }>[] = [];
	for (const it of items) if (it.kind === 'opt') { it.index = options.length; options.push(it); }

	const isField = input.mode === 'field';
	return {
		title: isField ? 'Insert field' : 'Choose a link',
		placeholder: isField ? 'Search or type a field name' : 'Search your named links',
		foot: isField
			? 'Pick a contact field or a named link. It goes in at the cursor.'
			: 'A named link replaces the URL. You can also type a URL in the field.',
		preview: !isField
			? ''
			: fbErr
				? fbErr
				: fb
					? 'A recipient without a value sees "' + fb + '".'
					: 'A recipient without a value sees nothing here. Add a fallback to show text instead.',
		items,
		options,
		fallbackBad: isField && !!fbErr,
		actionLabel: isField ? 'Insert' : 'Use link',
	};
}
