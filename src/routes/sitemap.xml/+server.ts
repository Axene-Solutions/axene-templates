import type { RequestHandler } from '@sveltejs/kit';

export const prerender = true;

const SITE = 'https://templates.axene.io';
const TODAY = new Date().toISOString().slice(0, 10);

type Url = { loc: string; changefreq?: string; priority?: number };

const URLS: Url[] = [
	{ loc: '/', changefreq: 'weekly', priority: 1.0 },
	{ loc: '/templates', changefreq: 'weekly', priority: 0.9 }
];

export const GET: RequestHandler = async () => {
	const body = URLS.map(
		(u) =>
			`  <url>\n    <loc>${SITE}${u.loc}</loc>\n    <lastmod>${TODAY}</lastmod>` +
			(u.changefreq ? `\n    <changefreq>${u.changefreq}</changefreq>` : '') +
			(u.priority != null ? `\n    <priority>${u.priority.toFixed(1)}</priority>` : '') +
			`\n  </url>`
	).join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;

	return new Response(xml, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
};
