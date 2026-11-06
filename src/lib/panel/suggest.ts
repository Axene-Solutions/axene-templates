/**
 * Pure logic behind the `{{` autocomplete in SuggestField.svelte, ported from the editor design
 * (sugDetect, sugOptions, sugAccept). No DOM, no store, so it is unit tested in
 * tests/panel-suggest.test.ts.
 *
 * Usage:
 *   const trig = detectTrigger(el.value, el.selectionStart, el.selectionEnd)
 *   if (trig) {
 *     const opts = suggestOptions(trig.partial, fields, links)
 *     const { value, caret } = applySuggestion(el.value, trig, opts[0])
 *   }
 */

export interface SuggestFieldDef {
	/** Placeholder key, for example first_name. */
	key: string;
	/** Text shown next to the key, for example "First name" or "Custom field, 412 contacts". */
	label: string;
}

export interface SuggestLinkDef {
	/** Named link key, used as {{link:key}}. */
	key: string;
	label: string;
	url?: string;
}

export type SuggestGroup = 'Contact fields' | 'Named links';

export interface SuggestOption {
	group: SuggestGroup;
	/** Shown in mono: the field key or link:key. */
	key: string;
	label: string;
	/** "needs a fallback" for fields that can be empty, otherwise ''. */
	hint: string;
	/** Text that replaces `{{partial`. */
	token: string;
	/** How many characters the caret sits before the end of the token (2 puts it before the closing braces). */
	back: number;
}

export interface Trigger {
	/** Index of the opening `{{`. */
	start: number;
	/** Caret index (end of the partial). */
	end: number;
	/** What was typed after `{{`. */
	partial: string;
}

const OB = '{' + '{';
const CB = '}' + '}';
export const tok = (inner: string): string => OB + inner + CB;

/** Fields that always have a value, so they never get a fallback: they insert the complete token. */
export const NO_FALLBACK_KEYS: ReadonlySet<string> = new Set(['email', 'unsubscribe_url']);

export function needsFallback(key: string): boolean {
	return !NO_FALLBACK_KEYS.has(key) && !key.startsWith('link:');
}

const BEFORE = /\{\{([A-Za-z0-9_:]*)$/;
const INSIDE_TOKEN = /^[A-Za-z0-9_:]*(\|[^{}]*)?\}\}/;
const WORD_TAIL = /^[A-Za-z0-9_:]*/;

/**
 * The open `{{partial` right before the caret, or null. Null when text is selected, when the
 * caret is not right after `{{` plus a partial word (so a `|` or a space closes it), and when the
 * caret is inside a complete token (`{{na|me}}` style text follows it).
 */
export function detectTrigger(value: string, selStart: number | null | undefined, selEnd?: number | null): Trigger | null {
	if (typeof selStart !== 'number') return null;
	const end = typeof selEnd === 'number' ? selEnd : selStart;
	if (selStart !== end) return null;
	const c = Math.max(0, Math.min(selStart, value.length));
	const m = BEFORE.exec(value.slice(0, c));
	if (!m) return null;
	if (INSIDE_TOKEN.test(value.slice(c))) return null;
	return { start: c - m[0].length, end: c, partial: m[1] };
}

/**
 * Grouped suggestions for a partial, in the design order: contact fields (keys containing the
 * partial, prefix matches first) then named links (link:key containing the partial, or a label
 * containing the text after link:). A partial starting with link: lists links only.
 */
export function suggestOptions(
	partial: string,
	fields: readonly SuggestFieldDef[],
	links: readonly SuggestLinkDef[],
): SuggestOption[] {
	const p = partial.toLowerCase();
	const out: SuggestOption[] = [];
	if (p.indexOf('link:') !== 0) {
		fields
			.map((f, i) => ({ f, i, k: f.key.toLowerCase() }))
			.filter((x) => !p || x.k.indexOf(p) >= 0)
			.sort((a, b) => (a.k.indexOf(p) === 0 ? 0 : 1) - (b.k.indexOf(p) === 0 ? 0 : 1) || a.i - b.i)
			.forEach(({ f }) => {
				const fb = needsFallback(f.key);
				out.push({
					group: 'Contact fields',
					key: f.key,
					label: f.label,
					hint: fb ? 'needs a fallback' : '',
					token: tok(f.key + (fb ? '|' : '')),
					back: fb ? 2 : 0,
				});
			});
	}
	const lp = p.indexOf('link:') === 0 ? p.slice(5) : p;
	links
		.filter((l) => ('link:' + l.key.toLowerCase()).indexOf(p) >= 0 || (lp && l.label.toLowerCase().indexOf(lp) >= 0))
		.forEach((l) =>
			out.push({ group: 'Named links', key: 'link:' + l.key, label: l.label, hint: '', token: tok('link:' + l.key), back: 0 }),
		);
	return out;
}

/**
 * Replace `{{partial` (plus any word characters right after the caret) with the option's token.
 * Returns the new value and where the caret goes: before the closing braces for a field that
 * needs a fallback, after the token otherwise.
 */
export function applySuggestion(value: string, trig: Trigger, opt: Pick<SuggestOption, 'token' | 'back'>): { value: string; caret: number } {
	const tail = (WORD_TAIL.exec(value.slice(trig.end)) ?? [''])[0];
	const next = value.slice(0, trig.start) + opt.token + value.slice(trig.end + tail.length);
	return { value: next, caret: trig.start + opt.token.length - opt.back };
}

/** True while the value still holds an empty fallback like {{name|}}: the helper line shows. */
export function hasEmptyFallback(value: string): boolean {
	return /\{\{[A-Za-z0-9_]+\|\}\}/.test(value);
}

/** Insert a token at a caret (end of the value when the caret is unknown or past the end). */
export function insertAt(value: string, caret: number | null | undefined, token: string): { value: string; caret: number } {
	const at = typeof caret === 'number' && caret >= 0 && caret <= value.length ? caret : value.length;
	return { value: value.slice(0, at) + token + value.slice(at), caret: at + token.length };
}

/** Move a highlight by delta through n rows, wrapping at both ends. */
export function wrapIndex(i: number, delta: number, n: number): number {
	if (n <= 0) return 0;
	const cur = Math.max(0, Math.min(i, n - 1));
	return (((cur + delta) % n) + n) % n;
}

export type SuggestRow =
	| { kind: 'head'; label: SuggestGroup }
	| { kind: 'opt'; index: number; opt: SuggestOption };

/** Options with a group heading before each group, as the dropdown lists them. */
export function groupRows(opts: readonly SuggestOption[]): SuggestRow[] {
	const rows: SuggestRow[] = [];
	let last = '';
	opts.forEach((opt, index) => {
		if (opt.group !== last) {
			rows.push({ kind: 'head', label: opt.group });
			last = opt.group;
		}
		rows.push({ kind: 'opt', index, opt });
	});
	return rows;
}
