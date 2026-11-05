// sanitize-html ships no type declarations, and @types/sanitize-html would be a second new
// dependency. This ambient file declares only the part the server sanitiser uses. Keep it free
// of top-level import/export, like src/mjml.d.ts.
declare module 'sanitize-html' {
	export interface SanitizeHtmlOptions {
		allowedTags?: string[];
		allowedAttributes?: Record<string, string[]>;
		allowedSchemes?: string[];
		allowedSchemesAppliedToAttributes?: string[];
		allowProtocolRelative?: boolean;
		disallowedTagsMode?: 'discard' | 'escape' | 'recursiveEscape';
		parser?: { decodeEntities?: boolean; lowerCaseTags?: boolean; lowerCaseAttributeNames?: boolean };
		transformTags?: Record<string, (tagName: string, attribs: Record<string, string>) => { tagName: string; attribs: Record<string, string> }>;
	}
	function sanitizeHtml(dirty: string, options?: SanitizeHtmlOptions): string;
	export default sanitizeHtml;
}
