import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const res = await fetch(`/api/templates/${params.id}`);
	if (!res.ok) return { template: null };
	return { template: await res.json() };
};
