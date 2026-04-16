/**
 * Default starter templates for the marketplace.
 * These are bundled with the app and always available.
 */

import { createBlock, uid, type Block } from './blocks';

export interface StarterTemplate {
	id: string;
	name: string;
	description: string;
	category: string; 
	gradient: string;
	blocks: Block[];
}

function makeBlocks(overrides: Partial<Block>[]): Block[] {
	return overrides.map(o => ({
		id: uid(),
		type: o.type!,
		props: { ...o.props },
	})) as Block[];
}

export const starterTemplates: StarterTemplate[] = [
	{
		id: 'starter-welcome',
		name: 'Welcome Email',
		description: 'Greet new users with a warm welcome and get them started.',
		category: 'Onboarding',
		gradient: 'linear-gradient(135deg, #1daa82 0%, #0d8f62 100%)',
		blocks: [
			{ id: uid(), type: 'header', props: { logoUrl: 'https://mail.axene.io/email-assets/logo.png', companyName: 'Your Company', tagline: '', backgroundColor: '#1daa82', logoWidth: 40, fontSize: 20, color: '#ffffff', align: 'center', paddingTop: 24, paddingBottom: 24, paddingLeft: 20, paddingRight: 20 } },
			{ id: uid(), type: 'heading', props: { text: 'Welcome aboard!', fontSize: 26, fontWeight: 'bold', color: '#111827', align: 'center', paddingTop: 28, paddingBottom: 8, paddingLeft: 20, paddingRight: 20 } },
			{ id: uid(), type: 'subheading', props: { text: 'We are thrilled to have you. Your account is all set up and ready to go.', fontSize: 14, fontWeight: 'normal', color: '#6b7280', align: 'center', lineHeight: '1.6', paddingTop: 0, paddingBottom: 20, paddingLeft: 20, paddingRight: 20 } },
			{ id: uid(), type: 'button', props: { text: 'Get Started', href: 'https://example.com', backgroundColor: 'theme', color: '#ffffff', fontSize: 14, fontWeight: '600', borderRadius: 6, width: 0, align: 'center', innerPadding: '12px 32px', paddingTop: 14, paddingBottom: 14, paddingLeft: 20, paddingRight: 20 } },
			{ id: uid(), type: 'content', props: { text: 'If you have any questions, just reply to this email. We are always happy to help.', fontSize: 14, fontWeight: 'normal', color: '#6b7280', align: 'center', lineHeight: '1.65', paddingTop: 20, paddingBottom: 14, paddingLeft: 20, paddingRight: 20 } },
			{ id: uid(), type: 'footer', props: { text: 'You received this email because you signed up for an account.', companyName: 'Your Company', companyAddress: '123 Main St, City, Country', links: [{ label: 'Website', url: 'https://example.com' }], unsubText: 'Unsubscribe', unsubUrl: '{{unsubscribe_url}}', fontSize: 12, color: '#9ca3af', linkColor: 'theme-dark', align: 'center', showDivider: true, paddingTop: 14, paddingBottom: 14, paddingLeft: 20, paddingRight: 20 } },
		],
	},
	{
		id: 'starter-verify',
		name: 'Email Verification',
		description: 'Ask users to verify their email address with a one-click button.',
		category: 'OTP/Passcodes',
		gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
		blocks: [
			{ id: uid(), type: 'header', props: { logoUrl: 'https://mail.axene.io/email-assets/logo.png', companyName: 'Your Company', tagline: '', backgroundColor: '#6366f1', logoWidth: 40, fontSize: 20, color: '#ffffff', align: 'center', paddingTop: 24, paddingBottom: 24, paddingLeft: 20, paddingRight: 20 } },
			{ id: uid(), type: 'heading', props: { text: 'Verify your email', fontSize: 24, fontWeight: 'bold', color: '#111827', align: 'center', paddingTop: 28, paddingBottom: 8, paddingLeft: 20, paddingRight: 20 } },
			{ id: uid(), type: 'content', props: { text: 'Click the button below to confirm your email address. This link expires in 24 hours.', fontSize: 14, fontWeight: 'normal', color: '#6b7280', align: 'center', lineHeight: '1.65', paddingTop: 0, paddingBottom: 20, paddingLeft: 20, paddingRight: 20 } },
			{ id: uid(), type: 'button', props: { text: 'Verify Email', href: '{{verify_url}}', backgroundColor: 'theme', color: '#ffffff', fontSize: 14, fontWeight: '600', borderRadius: 6, width: 0, align: 'center', innerPadding: '12px 40px', paddingTop: 14, paddingBottom: 14, paddingLeft: 20, paddingRight: 20 } },
			{ id: uid(), type: 'content', props: { text: 'If you did not create an account, you can safely ignore this email.', fontSize: 13, fontWeight: 'normal', color: '#9ca3af', align: 'center', lineHeight: '1.5', paddingTop: 14, paddingBottom: 14, paddingLeft: 20, paddingRight: 20 } },
			{ id: uid(), type: 'footer', props: { text: 'You received this email because an account was created with this address.', companyName: 'Your Company', companyAddress: '', links: [], unsubText: 'Unsubscribe', unsubUrl: '{{unsubscribe_url}}', fontSize: 12, color: '#9ca3af', linkColor: 'theme-dark', align: 'center', showDivider: true, paddingTop: 14, paddingBottom: 14, paddingLeft: 20, paddingRight: 20 } },
		],
	},
	{
		id: 'starter-newsletter',
		name: 'Newsletter',
		description: 'A clean newsletter layout with image, content, and call-to-action.',
		category: 'General Marketing',
		gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
		blocks: [
			{ id: uid(), type: 'header', props: { logoUrl: 'https://mail.axene.io/email-assets/logo.png', companyName: 'Your Company', tagline: 'Weekly Newsletter', backgroundColor: '#0ea5e9', logoWidth: 40, fontSize: 20, color: '#ffffff', align: 'center', paddingTop: 24, paddingBottom: 24, paddingLeft: 20, paddingRight: 20 } },
			{ id: uid(), type: 'image', props: { src: 'https://placehold.co/600x280/f0f9ff/0ea5e9?text=Featured+Image', alt: 'Newsletter hero', width: 600, href: '', paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 } },
			{ id: uid(), type: 'heading', props: { text: 'This week at Your Company', fontSize: 22, fontWeight: 'bold', color: '#111827', align: 'left', paddingTop: 24, paddingBottom: 8, paddingLeft: 20, paddingRight: 20 } },
			{ id: uid(), type: 'content', props: { text: 'Here is a roundup of what happened this week. We shipped some exciting updates and have more coming soon.', fontSize: 14, fontWeight: 'normal', color: '#374151', align: 'left', lineHeight: '1.65', paddingTop: 0, paddingBottom: 14, paddingLeft: 20, paddingRight: 20 } },
			{ id: uid(), type: 'button', props: { text: 'Read More', href: 'https://example.com/blog', backgroundColor: 'theme', color: '#ffffff', fontSize: 14, fontWeight: '600', borderRadius: 6, width: 0, align: 'left', innerPadding: '10px 28px', paddingTop: 8, paddingBottom: 14, paddingLeft: 20, paddingRight: 20 } },
			{ id: uid(), type: 'section', props: { backgroundColor: '#f8fafc', paddingTop: 14, paddingBottom: 14, paddingLeft: 20, paddingRight: 20 } },
			{ id: uid(), type: 'footer', props: { text: 'You are receiving this because you subscribed to our newsletter.', companyName: 'Your Company', companyAddress: '123 Main St, City', links: [{ label: 'Website', url: 'https://example.com' }, { label: 'Blog', url: 'https://example.com/blog' }], unsubText: 'Unsubscribe', unsubUrl: '{{unsubscribe_url}}', fontSize: 12, color: '#9ca3af', linkColor: 'theme-dark', align: 'center', showDivider: true, paddingTop: 14, paddingBottom: 14, paddingLeft: 20, paddingRight: 20 } },
		],
	},
	{
		id: 'starter-invoice',
		name: 'Invoice / Receipt',
		description: 'Payment confirmation with a summary table and transaction details.',
		category: 'Invoices',
		gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
		blocks: [
			{ id: uid(), type: 'header', props: { logoUrl: 'https://mail.axene.io/email-assets/logo.png', companyName: 'Your Company', tagline: '', backgroundColor: '#f59e0b', logoWidth: 40, fontSize: 20, color: '#ffffff', align: 'center', paddingTop: 24, paddingBottom: 24, paddingLeft: 20, paddingRight: 20 } },
			{ id: uid(), type: 'heading', props: { text: 'Payment Received', fontSize: 24, fontWeight: 'bold', color: '#111827', align: 'center', paddingTop: 24, paddingBottom: 8, paddingLeft: 20, paddingRight: 20 } },
			{ id: uid(), type: 'content', props: { text: 'Thank you for your payment. Here is a summary of your transaction.', fontSize: 14, fontWeight: 'normal', color: '#6b7280', align: 'center', lineHeight: '1.6', paddingTop: 0, paddingBottom: 14, paddingLeft: 20, paddingRight: 20 } },
			{ id: uid(), type: 'table', props: { headerRow: true, col1Header: 'Item', col2Header: 'Amount', rows: [{ col1: 'Pro Plan (Monthly)', col2: '$29.00' }, { col1: 'Tax', col2: '$2.90' }, { col1: 'Total', col2: '$31.90' }], headerBg: '#fef3c7', headerColor: '#92400e', cellColor: '#374151', borderColor: '#e5e7eb', fontSize: 13, paddingTop: 14, paddingBottom: 14, paddingLeft: 20, paddingRight: 20 } },
			{ id: uid(), type: 'button', props: { text: 'View Receipt', href: 'https://example.com/receipt', backgroundColor: 'theme', color: '#ffffff', fontSize: 14, fontWeight: '600', borderRadius: 6, width: 0, align: 'center', innerPadding: '10px 28px', paddingTop: 14, paddingBottom: 14, paddingLeft: 20, paddingRight: 20 } },
			{ id: uid(), type: 'footer', props: { text: 'You received this because a payment was processed on your account.', companyName: 'Your Company', companyAddress: '', links: [{ label: 'Support', url: 'https://example.com/support' }], unsubText: 'Unsubscribe', unsubUrl: '{{unsubscribe_url}}', fontSize: 12, color: '#9ca3af', linkColor: 'theme-dark', align: 'center', showDivider: true, paddingTop: 14, paddingBottom: 14, paddingLeft: 20, paddingRight: 20 } },
		],
	},
	{
		id: 'starter-reset',
		name: 'Password Reset',
		description: 'Let users reset their password with a secure one-time link.',
		category: 'Password Reset',
		gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
		blocks: [
			{ id: uid(), type: 'header', props: { logoUrl: 'https://mail.axene.io/email-assets/logo.png', companyName: 'Your Company', tagline: '', backgroundColor: '#ef4444', logoWidth: 40, fontSize: 20, color: '#ffffff', align: 'center', paddingTop: 24, paddingBottom: 24, paddingLeft: 20, paddingRight: 20 } },
			{ id: uid(), type: 'heading', props: { text: 'Reset your password', fontSize: 24, fontWeight: 'bold', color: '#111827', align: 'center', paddingTop: 28, paddingBottom: 8, paddingLeft: 20, paddingRight: 20 } },
			{ id: uid(), type: 'content', props: { text: 'We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.', fontSize: 14, fontWeight: 'normal', color: '#6b7280', align: 'center', lineHeight: '1.65', paddingTop: 0, paddingBottom: 20, paddingLeft: 20, paddingRight: 20 } },
			{ id: uid(), type: 'button', props: { text: 'Reset Password', href: '{{reset_url}}', backgroundColor: 'theme', color: '#ffffff', fontSize: 14, fontWeight: '600', borderRadius: 6, width: 0, align: 'center', innerPadding: '12px 40px', paddingTop: 14, paddingBottom: 14, paddingLeft: 20, paddingRight: 20 } },
			{ id: uid(), type: 'content', props: { text: 'If you did not request this, you can safely ignore this email. Your password will remain unchanged.', fontSize: 13, fontWeight: 'normal', color: '#9ca3af', align: 'center', lineHeight: '1.5', paddingTop: 14, paddingBottom: 14, paddingLeft: 20, paddingRight: 20 } },
			{ id: uid(), type: 'footer', props: { text: 'You received this email because a password reset was requested for your account.', companyName: 'Your Company', companyAddress: '', links: [], unsubText: '', unsubUrl: '', fontSize: 12, color: '#9ca3af', linkColor: 'theme-dark', align: 'center', showDivider: true, paddingTop: 14, paddingBottom: 14, paddingLeft: 20, paddingRight: 20 } },
		],
	},
	{
		id: 'starter-blank',
		name: 'Blank Template',
		description: 'Start from scratch with just a header and footer.',
		category: 'Blank',
		gradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
		blocks: [
			{ id: uid(), type: 'header', props: { logoUrl: 'https://mail.axene.io/email-assets/logo.png', companyName: 'Your Company', tagline: '', backgroundColor: '#1daa82', logoWidth: 40, fontSize: 20, color: '#ffffff', align: 'center', paddingTop: 24, paddingBottom: 24, paddingLeft: 20, paddingRight: 20 } },
			{ id: uid(), type: 'heading', props: { text: 'Your heading here', fontSize: 26, fontWeight: 'bold', color: '#111827', align: 'center', paddingTop: 28, paddingBottom: 14, paddingLeft: 20, paddingRight: 20 } },
			{ id: uid(), type: 'footer', props: { text: 'You received this email because you have an account with us.', companyName: 'Your Company', companyAddress: '123 Main St, City, Country', links: [{ label: 'Website', url: 'https://example.com' }], unsubText: 'Unsubscribe', unsubUrl: '{{unsubscribe_url}}', fontSize: 12, color: '#9ca3af', linkColor: 'theme-dark', align: 'center', showDivider: true, paddingTop: 14, paddingBottom: 14, paddingLeft: 20, paddingRight: 20 } },
		],
	},
];
