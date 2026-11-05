import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, depends }) => {
	depends('app:templates');

	try {
		const res = await fetch('/api/templates');
		if (!res.ok) {
			return {
				templates: [],
				loadError: `The template list could not be loaded (error ${res.status}).`,
			};
		}
		return { templates: await res.json(), loadError: null };
	} catch {
		return {
			templates: [],
			loadError: 'The template list could not be loaded. Check your connection.',
		};
	}
};
