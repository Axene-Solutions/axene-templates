// Template categories offered in the editor's name menu (Editor.dc.html CATS).

export const CATEGORY_GROUPS: readonly (readonly [string, readonly (readonly [string, string])[]])[] = [
	['', [['general', 'General']]],
	['Authentication', [['otp', 'OTP and passcodes'], ['password-reset', 'Password reset'], ['email-verify', 'Email verification'], ['magic-link', 'Magic login links']]],
	['Transactional', [['receipt', 'Receipts'], ['invoice', 'Invoices'], ['order-confirm', 'Order confirmations'], ['payment-status', 'Payment success or failure']]],
	['Notifications', [['alert', 'Alerts'], ['reminder', 'Reminders'], ['activity', 'Activity updates']]],
	['Marketing', [['marketing', 'General marketing'], ['newsletter', 'Newsletters'], ['product-announcement', 'Product announcements'], ['promo', 'Promotions']]],
	['User lifecycle', [['welcome', 'Welcome emails'], ['onboarding', 'Onboarding sequences'], ['re-engage', 'Re-engagement emails']]],
];

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(CATEGORY_GROUPS.flatMap(([, opts]) => opts.map(([v, l]) => [v, l])));

export function categoryLabel(value: string): string {
	return CATEGORY_LABEL[value] ?? 'General';
}
