import type { PageServerLoad } from './$types';
import { mailerConnectionSeed } from '$lib/server/mailer/seed';

export const load: PageServerLoad = async ({ fetch, depends, locals }) => {
	depends('app:templates');
	// The Mailer state decides whether the Link Mailer bar shows: render it on the server.
	const mailerConnection = await mailerConnectionSeed(fetch, !!locals.user);

	try {
		const res = await fetch('/api/templates');
		if (!res.ok) {
			return {
				templates: [],
				loadError: `The template list could not be loaded (error ${res.status}).`,
				mailerConnection,
			};
		}
		return { templates: await res.json(), loadError: null, mailerConnection };
	} catch {
		return {
			templates: [],
			loadError: 'The template list could not be loaded. Check your connection.',
			mailerConnection,
		};
	}
};
