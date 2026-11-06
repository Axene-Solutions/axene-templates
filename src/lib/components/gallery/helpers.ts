// Pure helpers for the Templates gallery cards. No framework imports so tests can load this file.

export type GalleryTemplate = {
	id: string;
	name: string;
	category: string | null;
	blockCount?: number;
	isStarter: boolean;
	isPublic: boolean;
	isOwn: boolean;
	inMailer?: boolean;
	updatedAt: string | null;
};

const CATEGORY_LABELS: Record<string, string> = {
	general: 'General',
	otp: 'OTP',
	invoice: 'Invoice',
	marketing: 'Marketing',
	welcome: 'Welcome Email',
	'password-reset': 'Password reset',
	'email-verify': 'Email Verification',
	'magic-link': 'Magic Login Links',
	receipt: 'Receipts',
	'order-confirm': 'Order Confirmations',
	'payment-status': 'Payment Success/Failure',
	alert: 'Alerts',
	reminder: 'Reminders',
	activity: 'Activity Updates',
	newsletter: 'Newsletters',
	'product-announcement': 'Product Announcements',
	promo: 'Promotions',
	onboarding: 'Onboarding Sequences',
	're-engage': 'Re-engagement Emails',
};

export function categoryId(t: { category?: string | null }): string {
	return String(t.category || 'general');
}

export function categoryLabel(id: string): string {
	return CATEGORY_LABELS[id] || id.charAt(0).toUpperCase() + id.slice(1);
}

// The thumbnail accent colour of the board's cards. Known categories keep one colour, the rest hash.
const HUES = ['#d49b00', '#1f8a5b', '#3d6ee0', '#c5503a', '#0ea5e9', '#6366f1', '#f59e0b', '#8e8b7e'];
const CATEGORY_HUES: Record<string, string> = {
	general: '#8e8b7e',
	'password-reset': '#1f8a5b',
	invoice: '#3d6ee0',
	receipt: '#3d6ee0',
	marketing: '#c5503a',
	newsletter: '#0ea5e9',
	otp: '#6366f1',
	'email-verify': '#6366f1',
	welcome: '#f59e0b',
};

export function hash(s: string): number {
	let h = 0;
	for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
	return h;
}

export function hueFor(t: { id: string; category?: string | null }): string {
	return CATEGORY_HUES[categoryId(t)] ?? HUES[hash(t.id) % HUES.length];
}

/** "just now", "today", "yesterday", "2 days ago", "last week", "3 weeks ago", "last month", else a date. */
export function whenLabel(iso: string | null | undefined, now = Date.now()): string {
	if (!iso) return '';
	const t = Date.parse(iso);
	if (!Number.isFinite(t)) return '';
	const ms = now - t;
	if (ms < 2 * 60_000) return 'just now';
	const start = (x: number) => {
		const d = new Date(x);
		return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
	};
	const days = Math.round((start(now) - start(t)) / 86_400_000);
	if (days <= 0) return 'today';
	if (days === 1) return 'yesterday';
	if (days < 7) return `${days} days ago`;
	if (days < 14) return 'last week';
	if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
	if (days < 60) return 'last month';
	return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function blocksLabel(n: number | undefined): string {
	const c = n ?? 0;
	return `${c} block${c === 1 ? '' : 's'}`;
}

export type SortKey = 'recent' | 'name' | 'blocks';

export function sortTemplates<T extends { name: string; blockCount?: number; updatedAt: string | null }>(items: T[], key: SortKey): T[] {
	const time = (x: T) => (x.updatedAt ? Date.parse(x.updatedAt) || 0 : 0);
	return items.slice().sort((a, b) => (key === 'name' ? a.name.localeCompare(b.name) : key === 'blocks' ? (b.blockCount ?? 0) - (a.blockCount ?? 0) : time(b) - time(a)));
}

/** The "Paste a sample reply" text of the Generate with AI dialog: a fenced reply, as an AI would send it. */
export function sampleReply(): string {
	const ph = (x: string) => '{' + '{' + x + '}' + '}';
	const reply = {
		name: 'Coffee welcome',
		subject: 'Karibu, ' + ph('name|friend'),
		blocks: [
			{ id: 'b1', type: 'header', props: { companyName: 'Kahawa Coffee' } },
			{ id: 'b2', type: 'heading', props: { text: 'Karibu, ' + ph('name|friend') } },
			{ id: 'b3', type: 'content', props: { text: '<p>Thanks for joining us. Your first cup is on the house.</p>' } },
			{ id: 'b4', type: 'button', props: { text: 'Order online', href: 'https://kahawa.example/menu' } },
			{ id: 'b5', type: 'footer', props: { unsubUrl: ph('unsubscribe_url') } },
		],
	};
	return '```json\n' + JSON.stringify(reply, null, 2) + '\n```';
}
