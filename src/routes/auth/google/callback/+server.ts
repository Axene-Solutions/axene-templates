import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { users, oauthAccounts, refreshTokens } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { createAccessToken, generateRefreshToken } from '$lib/server/auth/jwt';
import { setAuthCookies } from '$lib/server/auth/cookies';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const savedState = cookies.get('oauth_state');

	cookies.delete('oauth_state', { path: '/' });

	if (!code || !state || state !== savedState) {
		throw redirect(302, '/login?error=invalid_state');
	}

	const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			code,
			client_id: env.GOOGLE_CLIENT_ID!,
			client_secret: env.GOOGLE_CLIENT_SECRET!,
			redirect_uri: env.OAUTH_REDIRECT_URL!,
			grant_type: 'authorization_code'
		})
	});

	if (!tokenRes.ok) {
		throw redirect(302, '/login?error=token_exchange_failed');
	}

	const tokenData = await tokenRes.json();

	const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
		headers: { Authorization: `Bearer ${tokenData.access_token}` }
	});

	if (!profileRes.ok) {
		throw redirect(302, '/login?error=profile_fetch_failed');
	}

	const profile = await profileRes.json();
	const { id: googleId, email, name, picture } = profile;

	if (!email) {
		throw redirect(302, '/login?error=no_email');
	}

	let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

	if (!user) {
		[user] = await db
			.insert(users)
			.values({
				email,
				name: name || null,
				avatarUrl: picture || null
			})
			.returning();
	} else {
		await db
			.update(users)
			.set({
				name: name || user.name,
				avatarUrl: picture || user.avatarUrl
			})
			.where(eq(users.id, user.id));
	}

	const [existing] = await db
		.select()
		.from(oauthAccounts)
		.where(and(eq(oauthAccounts.provider, 'google'), eq(oauthAccounts.providerId, googleId)))
		.limit(1);

	if (!existing) {
		await db.insert(oauthAccounts).values({
			userId: user.id,
			provider: 'google',
			providerId: googleId
		});
	}

	const accessToken = createAccessToken(user.id);
	const refresh = generateRefreshToken();

	await db.insert(refreshTokens).values({
		userId: user.id,
		tokenHash: refresh.hash,
		expiresAt: refresh.expiresAt
	});

	setAuthCookies(cookies, accessToken, refresh.raw);

	throw redirect(302, '/templates');
};
