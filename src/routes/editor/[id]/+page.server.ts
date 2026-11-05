import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch, depends }) => {
	depends('app:template');

	try {
		const res = await fetch(`/api/templates/${params.id}`);
		if (!res.ok) {
			const message =
				res.status === 404
					? 'This template does not exist or was deleted.'
					: res.status === 403
						? 'You do not have access to this template.'
						: `The template could not be loaded (error ${res.status}).`;
			return { template: null, loadError: { status: res.status, message } };
		}
		return { template: await res.json(), loadError: null };
	} catch {
		return {
			template: null,
			loadError: { status: 0, message: 'The template could not be loaded. Check your connection.' },
		};
	}
};
