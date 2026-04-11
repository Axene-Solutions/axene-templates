import type { Cookies } from '@sveltejs/kit';

const IS_PROD = process.env.NODE_ENV === 'production';

export function setAuthCookies(cookies: Cookies, accessToken: string, refreshToken: string) {
  cookies.set('access_token', accessToken, {
    path: '/',
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    maxAge: 60 * 60,
  });
  cookies.set('refresh_token', refreshToken, {
    path: '/',
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
  });
}

export function clearAuthCookies(cookies: Cookies) {
  cookies.delete('access_token', { path: '/' });
  cookies.delete('refresh_token', { path: '/' });
}
