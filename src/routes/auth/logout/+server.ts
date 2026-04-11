import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { refreshTokens } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hashToken } from '$lib/server/auth/jwt';
import { clearAuthCookies } from '$lib/server/auth/cookies';

export const POST: RequestHandler = async ({ cookies }) => {
	const token = cookies.get('refresh_token');

	if (token) {
		const hash = hashToken(token);
		await db
			.update(refreshTokens)
			.set({ revoked: true })
			.where(eq(refreshTokens.tokenHash, hash));
	}

	clearAuthCookies(cookies);
	return json({ ok: true });
};
