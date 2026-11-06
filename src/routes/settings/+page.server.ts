import type { PageServerLoad } from './$types';

// Nothing to load: this file only makes client-side navigation to /settings ask the server, so the
// sign-in redirect in hooks.server.ts applies to it as it does to a direct visit. Without it, a
// signed-out visitor following a link here got a Settings page whose every call failed with 401.
export const load: PageServerLoad = () => ({});
