export async function load({ fetch }) {
	const res = await fetch('/api/templates');
	if (!res.ok) return { templates: [] };
	return { templates: await res.json() };
}
