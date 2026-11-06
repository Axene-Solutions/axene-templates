// Turns the text a user pastes back from ChatGPT or Claude into editor blocks, or a plain
// reason it cannot. Everything goes through the same strict sanitizer as every other source.

import type { Block } from '$lib/blocks';
import { collectUsage } from '$lib/placeholders';
import { cleanLine, MAX_TEMPLATE_NAME } from '$lib/mailer-templates';
import { BlocksValidationError, sanitizeBlocks } from './sanitize-blocks';

export const MAX_PASTE = 200_000;
const ID = /^[A-Za-z0-9_.:-]{1,100}$/;

export type AiImport =
	| { ok: true; name: string; subject: string; blocks: Block[]; warnings: string[]; fields: string[]; links: string[] }
	| { ok: false; error: string };

/** The JSON text inside a reply: a fenced block when there is one, else the outermost braces. */
export function extractJson(text: string): string | null {
	const fence = /```(?:json|JSON)?\s*\n?([\s\S]*?)```/.exec(text);
	const body = (fence ? fence[1] : text).trim();
	const start = body.search(/[{[]/);
	if (start < 0) return null;
	const close = body[start] === '{' ? '}' : ']';
	const end = body.lastIndexOf(close);
	return end > start ? body.slice(start, end + 1) : null;
}

export function parseAiTemplate(text: unknown): AiImport {
	if (typeof text !== 'string' || !text.trim()) return { ok: false, error: 'Paste the reply from the AI first.' };
	if (text.length > MAX_PASTE) return { ok: false, error: 'That is too long to be a template. Paste only the JSON reply.' };
	const raw = extractJson(text);
	if (!raw) return { ok: false, error: 'No JSON found. Ask the AI to reply with only the JSON in a code block.' };
	let data: unknown;
	try {
		data = JSON.parse(raw);
	} catch (e) {
		return { ok: false, error: `That is not valid JSON (${(e as Error).message}). Ask the AI to reply with only valid JSON.` };
	}

	const obj = Array.isArray(data) ? { blocks: data } : data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
	if (!obj || !Array.isArray(obj.blocks)) return { ok: false, error: 'The JSON needs a "blocks" array.' };

	const warnings: string[] = [];
	// Forgive the things models get wrong and the editor can fix: missing or repeated ids, and block order.
	const seen = new Set<string>();
	let blocks = obj.blocks.map((b: unknown, i: number) => {
		if (!b || typeof b !== 'object' || Array.isArray(b)) return b;
		const src = b as Record<string, unknown>;
		let id = src.id;
		if (typeof id !== 'string' || !ID.test(id) || seen.has(id)) id = `blk_ai_${i}`;
		seen.add(id as string);
		return { ...src, id };
	});
	const type = (b: unknown) => (b && typeof b === 'object' ? (b as Record<string, unknown>).type : undefined);
	const headers = blocks.filter((b) => type(b) === 'header');
	const footers = blocks.filter((b) => type(b) === 'footer');
	if (headers.length > 1) warnings.push(`Only one header is allowed, kept the first of ${headers.length}.`);
	if (footers.length > 1) warnings.push(`Only one footer is allowed, kept the first of ${footers.length}.`);
	const middle = blocks.filter((b) => type(b) !== 'header' && type(b) !== 'footer');
	const ordered = [...headers.slice(0, 1), ...middle, ...footers.slice(0, 1)];
	if (headers.length && type(blocks[0]) !== 'header') warnings.push('Moved the header to the top.');
	if (footers.length && type(blocks[blocks.length - 1]) !== 'footer') warnings.push('Moved the footer to the bottom.');
	blocks = ordered;

	let clean: Block[];
	try {
		clean = sanitizeBlocks(blocks, { strict: true, allowEmpty: false });
	} catch (e) {
		if (e instanceof BlocksValidationError) return { ok: false, error: e.message };
		throw e;
	}

	const name = typeof obj.name === 'string' ? cleanLine(obj.name).slice(0, MAX_TEMPLATE_NAME) : '';
	const subject = typeof obj.subject === 'string' ? cleanLine(obj.subject).slice(0, 200) : '';
	const usage = collectUsage(clean);
	const fields = [...usage.fields.keys()];
	const missingFallback = [...usage.fields].filter(([k, v]) => !v.hasFallback && k !== 'unsubscribe_url' && k !== 'email').map(([k]) => k);
	if (missingFallback.length) warnings.push(`No fallback for ${missingFallback.map((k) => `{{${k}}}`).join(', ')}: a recipient without a value gets an empty space.`);
	if (!clean.some((b) => b.type === 'footer')) warnings.push('There is no footer, so no unsubscribe link.');
	return { ok: true, name: name || 'AI template', subject, blocks: clean, warnings, fields, links: [...usage.links] };
}
