// Fake db: every awaited query resolves to the next array pushed on globalThis.__dbQueue (empty array if none).
function chain() {
	const c = {
		from: () => c, where: () => c, limit: () => c, orderBy: () => c, values: () => c, set: () => c, onConflictDoUpdate: () => c, returning: () => c,
		then: (res, rej) => Promise.resolve((globalThis.__dbQueue ?? []).shift() ?? []).then(res, rej),
	};
	return c;
}
export const db = { select: chain, insert: chain, update: chain, delete: chain };
