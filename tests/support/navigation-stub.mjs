// $app/navigation for node --test: records calls instead of touching a router.
/** @type {unknown[][]} */
export const calls = [];
/** @param {string} url @param {unknown} state */
export function replaceState(url, state) {
	calls.push(['replaceState', url, state]);
}
/** @param {string} url @param {unknown} [opts] */
export async function goto(url, opts) {
	calls.push(['goto', url, opts]);
}
/** @param {string} dep */
export async function invalidate(dep) {
	calls.push(['invalidate', dep]);
}
