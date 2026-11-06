import type { PageServerLoad } from './$types';

// Nothing to load: this file only makes client-side navigation to /editor ask the server, so the
// sign-in redirect in hooks.server.ts applies to it as it does to a direct visit. Without it, a
// signed-out visitor following "Start building for free" got an editor that could not render,
// save or send.
export const load: PageServerLoad = () => ({});
