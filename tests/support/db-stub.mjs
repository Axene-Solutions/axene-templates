// Fake db: every awaited query resolves to the next array pushed on globalThis.__dbQueue (empty array if none).
// Values passed to insert().values() and update().set() are recorded on globalThis.__dbWrites, so a
// test can assert what would have been stored.
function chain(op) {
	const c = {
		from: () => c, where: () => c, limit: () => c, orderBy: () => c, returning: () => c,
		onConflictDoUpdate: () => c, onConflictDoNothing: () => c,
		values: (v) => { (globalThis.__dbWrites ??= []).push({ op, data: v }); return c; },
		set: (v) => { (globalThis.__dbWrites ??= []).push({ op, data: v }); return c; },
		then: (res, rej) => Promise.resolve((globalThis.__dbQueue ?? []).shift() ?? []).then(res, rej),
	};
	return c;
}
export const db = { select: () => chain('select'), insert: () => chain('insert'), update: () => chain('update'), delete: () => chain('delete') };
