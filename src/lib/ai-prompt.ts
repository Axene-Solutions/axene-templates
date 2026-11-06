// The instructions handed to ChatGPT or Claude when a user asks AI to draft a template.
// Keep this in step with BLOCK_SCHEMA in server/sanitize-blocks.ts: whatever it describes
// here is what the paste validator accepts.

export const AI_SPEC = `You are designing an HTML email for the Axene Templates editor. Reply with ONE JSON object inside a single \`\`\`json code block and nothing else (no commentary before or after).

JSON shape:
{
  "name": "short template name",
  "subject": "email subject line (placeholders allowed)",
  "blocks": [ { "id": "b1", "type": "<block type>", "props": { ... } }, ... ]
}

Rules:
- ids are unique, letters, digits, _ or -.
- At most one "header" (must be first) and one "footer" (must be last). Use 5 to 12 blocks in total.
- Every prop is optional, a missing one takes a sensible default. Only set what you need.
- Colors are hex like "#1a1a1a". Numbers are plain numbers (px). align is "left", "center" or "right".
- URLs must be https, mailto or tel. Never invent image URLs: leave "image" blocks out unless the user gave an image URL. No scripts, no forms, no iframes, no CSS or style tags.
- Rich text props (marked HTML) may only use: b, strong, i, em, u, br, p, span, a (href), ul, ol, li.
- Dynamic values use placeholders: {{name}}, {{name|fallback}} (fallback is plain text, max 100 chars, no { } | " < > or backticks) and {{link:key}} for a named link. Use {{name|there}} style fallbacks for personal fields. Only use {{ }} for placeholders, never for anything else.
- Keep to one clear call to action. Write real copy, not lorem ipsum.

Block types and props:
- header: companyName, tagline, logoUrl (https), layout ("logo-left"|"logo-center"|"logo-right"|"logo-only"|"text-only"), accentColor, backgroundColor, color, align, fontSize
- heading: text (HTML), fontSize, fontWeight ("normal"|"bold"), color, align
- subheading: text (HTML), fontSize, fontWeight, color, align, lineHeight
- content: text (HTML, use <p> for paragraphs), fontSize, color, align, lineHeight
- image: src (https), alt, width, href
- button: text (HTML), href, backgroundColor, color, fontSize, fontWeight, borderRadius, align, width, innerPadding like "12px 32px"
- list: items (array of HTML strings), fontSize, color, bulletColor
- table: headerRow (true|false), col1Header, col2Header, rows (array of { "col1": "...", "col2": "..." }), headerBg, headerColor, cellColor, borderColor
- section: backgroundColor, borderRadius, borderStyle ("none"|"solid"|"dashed"|"dotted"), borderColor
- footer: text (HTML), companyName, companyAddress, links (array of { "label": "...", "url": "https://..." }), unsubText, unsubUrl, align, color, linkColor
All blocks also accept paddingTop, paddingBottom, paddingLeft, paddingRight (0 to 300).

Always end with a footer that has an unsubscribe link, with unsubUrl set to "{{unsubscribe_url}}".`;

export type AiBrief = { brief: string };

/** The full prompt: the spec plus the user's own request. */
export function buildAiPrompt(brief: string): string {
	const ask = brief.trim() || 'A clean welcome email for new customers with one button.';
	return `${AI_SPEC}\n\nWhat to create:\n${ask}`;
}

/** A follow-up the user can paste back to the AI when validation fails. */
export function buildFixPrompt(error: string): string {
	return `That JSON was refused by the template validator with this error:\n\n${error}\n\nFix it and reply again with the complete corrected JSON in a single \`\`\`json code block, following the same rules.`;
}

export const AI_TARGETS = {
	claude: { label: 'Claude', url: 'https://claude.ai/new', param: 'q' },
	chatgpt: { label: 'ChatGPT', url: 'https://chatgpt.com/', param: 'q' },
} as const;
export type AiTarget = keyof typeof AI_TARGETS;

// Browsers and these sites accept long query strings, but not unlimited ones.
export const MAX_PREFILL_URL = 7000;

/** The URL to open for a target, or null when the prompt is too long to prefill (copy it instead). */
export function aiUrl(target: AiTarget, prompt: string): string | null {
	const t = AI_TARGETS[target];
	const url = `${t.url}?${t.param}=${encodeURIComponent(prompt)}`;
	return url.length <= MAX_PREFILL_URL ? url : null;
}
