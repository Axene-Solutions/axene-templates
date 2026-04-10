/**
 * Block data model for the email builder.
 * Each block represents a section of the email and maps to MJML output.
 */

export type BlockType = 'header' | 'heading' | 'subheading' | 'content' | 'image' | 'button' | 'list' | 'table' | 'section' | 'footer';

export interface Block {
	id: string;
	type: BlockType;
	props: Record<string, any>;
}

export interface BlockDefinition {
	type: BlockType;
	label: string;
	icon: string;
	defaultProps: Record<string, any>;
}

let _counter = 0;
export function uid(): string {
	return `blk_${Date.now().toString(36)}_${(++_counter).toString(36)}`;
}

export const blockDefs: BlockDefinition[] = [
	{
		type: 'header',
		label: 'Header',
		icon: 'header',
		defaultProps: {
			logoUrl: 'https://mail.axene.io/email-assets/logo.png',
			companyName: 'Your Company',
			tagline: '',
			layout: 'logo-left',
			accentColor: '#1daa82',
			backgroundColor: '#1daa82',
			logoWidth: 40,
			fontSize: 20,
			color: '#ffffff',
			align: 'left',
			paddingTop: 14,
			paddingBottom: 14,
			paddingLeft: 20,
			paddingRight: 20,
		},
	},
	{
		type: 'heading',
		label: 'Heading',
		icon: 'heading',
		defaultProps: {
			text: 'Your Heading Here',
			fontSize: 26,
			fontWeight: 'bold',
			color: '#111827',
			align: 'center',
			paddingTop: 14,
			paddingBottom: 14,
			paddingLeft: 20,
			paddingRight: 20,
		},
	},
	{
		type: 'subheading',
		label: 'Subheading',
		icon: 'subheading',
		defaultProps: {
			text: 'A short description or subtitle goes here.',
			fontSize: 14,
			fontWeight: 'normal',
			color: '#6b7280',
			align: 'center',
			lineHeight: '1.6',
			paddingTop: 14,
			paddingBottom: 14,
			paddingLeft: 20,
			paddingRight: 20,
		},
	},
	{
		type: 'content',
		label: 'Content',
		icon: 'content',
		defaultProps: {
			text: 'Write your email content here. You can use <strong>bold</strong>, <em>italic</em>, and <a href="#">links</a>.',
			fontSize: 14,
			fontWeight: 'normal',
			color: '#374151',
			align: 'left',
			lineHeight: '1.65',
			paddingTop: 14,
			paddingBottom: 14,
			paddingLeft: 20,
			paddingRight: 20,
		},
	},
	{
		type: 'image',
		label: 'Image',
		icon: 'image',
		defaultProps: {
			src: 'https://placehold.co/600x240/f3f4f6/9ca3af?text=Your+Image',
			alt: 'Image',
			width: 600,
			href: '',
			paddingTop: 0,
			paddingBottom: 0,
			paddingLeft: 0,
			paddingRight: 0,
		},
	},
	{
		type: 'button',
		label: 'Button',
		icon: 'button',
		defaultProps: {
			text: 'Click Here',
			href: 'https://example.com',
			backgroundColor: 'theme',
			color: '#ffffff',
			fontSize: 14,
			fontWeight: '600',
			borderRadius: 6,
			width: 0, // 0 = auto (content width), >0 = fixed px, -1 = full width
			align: 'center',
			innerPadding: '12px 32px',
			paddingTop: 14,
			paddingBottom: 14,
			paddingLeft: 20,
			paddingRight: 20,
		},
	},
	{
		type: 'list',
		label: 'List',
		icon: 'list',
		defaultProps: {
			items: ['First item in the list', 'Second item in the list', 'Third item in the list'],
			fontSize: 14,
			color: '#374151',
			bulletColor: 'theme',
			paddingTop: 14,
			paddingBottom: 14,
			paddingLeft: 20,
			paddingRight: 20,
		},
	},
	{
		type: 'table',
		label: 'Table',
		icon: 'table',
		defaultProps: {
			headerRow: true,
			col1Header: 'Feature',
			col2Header: 'Details',
			rows: [
				{ col1: 'First item', col2: 'Description of the first item' },
				{ col1: 'Second item', col2: 'Description of the second item' },
				{ col1: 'Third item', col2: 'Description of the third item' },
			],
			headerBg: '#f3f4f6',
			headerColor: '#111827',
			cellColor: '#374151',
			borderColor: '#e5e7eb',
			fontSize: 13,
			paddingTop: 14,
			paddingBottom: 14,
			paddingLeft: 20,
			paddingRight: 20,
		},
	},
	{
		type: 'section',
		label: 'Section',
		icon: 'section',
		defaultProps: {
			backgroundColor: '#f5f5f5',
			paddingTop: 14,
			paddingBottom: 14,
			paddingLeft: 20,
			paddingRight: 20,
		},
	},
	{
		type: 'footer',
		label: 'Footer',
		icon: 'footer',
		defaultProps: {
			text: 'You received this email because you have an account with us.',
			companyName: 'Your Company',
			companyAddress: '123 Street, City, Country',
			links: [
				{ label: 'Website', url: 'https://example.com' },
				{ label: 'Privacy Policy', url: 'https://example.com/privacy' },
			],
			unsubText: 'Unsubscribe',
			unsubUrl: '{{unsubscribe_url}}',
			fontSize: 12,
			color: '#9ca3af',
			linkColor: 'theme-dark',
			align: 'center',
			showDivider: true,
			paddingTop: 14,
			paddingBottom: 14,
			paddingLeft: 20,
			paddingRight: 20,
		},
	},
];

export function createBlock(type: BlockType): Block {
	const def = blockDefs.find(d => d.type === type);
	if (!def) throw new Error(`Unknown block type: ${type}`);
	return {
		id: uid(),
		type,
		props: { ...def.defaultProps },
	};
}

export function getBlockDef(type: BlockType): BlockDefinition | undefined {
	return blockDefs.find(d => d.type === type);
}

/**
 * Default template blocks for a new email.
 */
export function defaultBlocks(): Block[] {
	return [
		createBlock('header'),
		createBlock('heading'),
		createBlock('subheading'),
		createBlock('button'),
		createBlock('footer'),
	];
}

/** Color palette for the custom color picker. */
export const colorPalette = [
	'#1daa82', '#8b5cf6', '#ec4899', '#ef4444',
	'#f97316', '#eab308', '#22c55e', '#14b8a6', '#1e293b', '#374151',
	'#6b7280', '#9ca3af', '#d1d5db', '#ffffff',
	'transparent',
];
