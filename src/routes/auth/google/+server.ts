import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { randomBytes } from 'crypto';
import { safeNext } from '$lib/safe-next';

export const GET: RequestHandler = async ({ cookies, url }) => {
	const state = randomBytes(16).toString('hex');

	cookies.set('oauth_state', state, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 600
	});

	// Where to land after sign in. Validated here and again in the callback.
	const next = safeNext(url.searchParams.get('next'));
	if (next) {
		cookies.set('oauth_next', next, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 600
		});
	} else {
		cookies.delete('oauth_next', { path: '/' });
	}

	const params = new URLSearchParams({
		client_id: env.GOOGLE_CLIENT_ID!,
		redirect_uri: env.OAUTH_REDIRECT_URL!,
		response_type: 'code',
		scope: 'openid email profile',
		access_type: 'offline',
		prompt: 'consent',
		state
	});

	throw redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};
