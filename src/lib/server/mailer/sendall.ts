// Sends one message per recipient with limited concurrency under an overall deadline.
// Pure: the sender and the clock are injected, so it can be unit tested.

export interface SendResult {
	to: string;
	ok: boolean;
	status?: number;
	error?: string;
}

export type SendOne = (to: string, timeoutMs: number) => Promise<{ ok: true } | { ok: false; status: number; message: string }>;

export const TIME_LIMIT_MESSAGE = 'Not sent (time limit), you can send again';

export async function sendAll(
	recipients: string[],
	sendOne: SendOne,
	opts: { concurrency?: number; deadlineMs?: number; callTimeoutMs?: number; now?: () => number } = {},
): Promise<SendResult[]> {
	const { concurrency = 5, deadlineMs = 45_000, callTimeoutMs = 15_000, now = Date.now } = opts;
	const deadline = now() + deadlineMs;
	const results: SendResult[] = new Array(recipients.length);
	let next = 0;
	let stopped: string | null = null;

	async function worker() {
		for (;;) {
			const i = next++;
			if (i >= recipients.length) return;
			const to = recipients[i];
			if (stopped) {
				results[i] = { to, ok: false, error: stopped };
				continue;
			}
			const left = deadline - now();
			if (left <= 0) {
				results[i] = { to, ok: false, error: TIME_LIMIT_MESSAGE };
				continue;
			}
			const res = await sendOne(to, Math.min(callTimeoutMs, left));
			if (res.ok) {
				results[i] = { to, ok: true, status: 202 };
				continue;
			}
			results[i] = { to, ok: false, status: res.status || undefined, error: res.message };
			// A dead key or a rate limit will fail every remaining message: stop hammering Mailer.
			if (res.status === 401 || res.status === 429) stopped = 'Not sent: ' + res.message;
		}
	}

	await Promise.all(Array.from({ length: Math.max(1, Math.min(concurrency, recipients.length)) }, worker));
	return results;
}
