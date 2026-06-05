// mjml ships no type declarations. This standalone (non-module) ambient file
// declares it so tsc / svelte-check stop erroring on the import. Keep it free of
// top-level import/export, otherwise the declaration becomes an augmentation.
declare module 'mjml' {
	const mjml2html: (mjml: string, options?: Record<string, unknown>) => { html: string; errors: unknown[] };
	export default mjml2html;
}
