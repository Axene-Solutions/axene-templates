import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const res = await fetch('/api/templates');
	if (!res.ok) return { templates: [] };
	return { templates: await res.json() };
};
