// Fake db: every awaited query resolves to the next array pushed on globalThis.__dbQueue (empty array if none),
// or to the result of calling it when the queued item is a function.
// Values passed to insert().values() and update().set() are recorded on globalThis.__dbWrites, so a
// test can assert what would have been stored.
function chain(op) {
	const c = {
		from: () => c, where: () => c, limit: () => c, orderBy: () => c, returning: () => c,
		onConflictDoUpdate: () => c, onConflictDoNothing: () => c,
		values: (v) => { (globalThis.__dbWrites ??= []).push({ op, data: v }); return c; },
		set: (v) => { (globalThis.__dbWrites ??= []).push({ op, data: v }); return c; },
		// A queued function is called when the query runs, so a result can depend on earlier writes.
		then: (res, rej) => {
			const next = (globalThis.__dbQueue ?? []).shift();
			return Promise.resolve(typeof next === 'function' ? next() : next ?? []).then(res, rej);
		},
	};
	return c;
}
export const db = { select: () => chain('select'), insert: () => chain('insert'), update: () => chain('update'), delete: () => chain('delete') };
