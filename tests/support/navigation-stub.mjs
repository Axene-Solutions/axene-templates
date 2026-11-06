// $app/navigation for node --test: records calls instead of touching a router.
export const calls = [];
export function replaceState(url, state) {
	calls.push(['replaceState', url, state]);
}
export async function goto(url, opts) {
	calls.push(['goto', url, opts]);
}
export async function invalidate(dep) {
	calls.push(['invalidate', dep]);
}
