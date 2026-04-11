import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { refreshTokens } from '$lib/server/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { hashToken, createAccessToken, generateRefreshToken } from '$lib/server/auth/jwt';
import { setAuthCookies, clearAuthCookies } from '$lib/server/auth/cookies';

export const POST: RequestHandler = async ({ cookies }) => {
	const token = cookies.get('refresh_token');
	if (!token) {
		clearAuthCookies(cookies);
		return json({ error: 'No refresh token' }, { status: 401 });
	}

	const hash = hashToken(token);
	const [stored] = await db
		.select()
		.from(refreshTokens)
		.where(
			and(
				eq(refreshTokens.tokenHash, hash),
				eq(refreshTokens.revoked, false),
				gt(refreshTokens.expiresAt, new Date())
			)
		)
		.limit(1);

	if (!stored) {
		clearAuthCookies(cookies);
		return json({ error: 'Invalid refresh token' }, { status: 401 });
	}

	await db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.id, stored.id));

	const accessToken = createAccessToken(stored.userId);
	const newRefresh = generateRefreshToken();

	await db.insert(refreshTokens).values({
		userId: stored.userId,
		tokenHash: newRefresh.hash,
		expiresAt: newRefresh.expiresAt
	});

	setAuthCookies(cookies, accessToken, newRefresh.raw);
	return json({ ok: true });
};
