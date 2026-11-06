import type { PageServerLoad } from './$types';
import { mailerConnectionSeed } from '$lib/server/mailer/seed';

// Client-side navigation to /settings asks the server too, so the sign-in redirect in
// hooks.server.ts applies to it as it does to a direct visit (without this file, a signed-out
// visitor following a link here got a Settings page whose every call failed with 401). The
// connection state is sent along so the Mailer card renders in its real state at once.
export const load: PageServerLoad = async ({ fetch, locals }) => ({
	mailerConnection: await mailerConnectionSeed(fetch, !!locals.user),
});
