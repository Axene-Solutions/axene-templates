import type { RequestHandler } from '@sveltejs/kit';

export const prerender = true;

// llms.txt for Axene Templates. Spec: https://llmstxt.org/
const BODY = `# Axene Templates

> Axene Templates is a visual email template builder and template gallery by Axene Solutions. Design responsive email templates with a drag-and-drop editor, or start from a ready-made template. Pairs with Axene Mailer.

Browse the public gallery, open the editor, and export clean HTML for use in Axene Mailer or any email platform. Part of the Axene product suite.

## Product

- [Axene Templates](https://templates.axene.io): Product home.
- [Template gallery](https://templates.axene.io/templates): Browse ready-made email templates.

## About Axene

- [Axene Solutions](https://axene.io): African developer infrastructure, KES pricing, M-Pesa billing.
- [Axene Mailer](https://mail.axene.io): Send the emails you design here.
- [Documentation](https://axene.io/docs): Developer documentation for all Axene products.
`;

export const GET: RequestHandler = async () => {
	return new Response(BODY, {
		headers: {
			'content-type': 'text/plain; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
};
