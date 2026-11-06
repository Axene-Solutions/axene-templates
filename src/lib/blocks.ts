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
	/**
	 * What a stored block that lacks a prop gets (the sanitiser fills missing props from here).
	 * New props default to the value that renders exactly as before they existed.
	 */
	defaultProps: Record<string, any>;
	/** Design defaults for a block created now, applied over defaultProps by createBlock. */
	newProps?: Record<string, any>;
}

/** Props every block type has: the block box (fill, border, corner radius). */
const COMMON_DEFAULTS = { backgroundColor: 'transparent', borderStyle: 'none', borderColor: '#d1d5db', blockRadius: 0 };
/** Design padding for a new block (14 top and bottom, 24 at the sides). */
const NEW_PAD = { paddingTop: 14, paddingBottom: 14, paddingLeft: 24, paddingRight: 24 };

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
			fontWeight: 'bold',
			color: '#ffffff',
			align: 'left',
			paddingTop: 14,
			paddingBottom: 14,
			paddingLeft: 20,
			paddingRight: 20,
			borderStyle: 'none',
			borderColor: '#d1d5db',
			blockRadius: 0,
		},
		newProps: { ...NEW_PAD, logoUrl: '', fontWeight: '700', backgroundColor: 'theme', color: 'auto', paddingTop: 16, paddingBottom: 16 },
	},
	{
		type: 'heading',
		label: 'Heading',
		icon: 'heading',
		defaultProps: {
			text: 'Your Heading Here',
			fontSize: 26,
			fontWeight: 'bold',
			lineHeight: 1.6,
			color: '#111827',
			align: 'center',
			paddingTop: 14,
			paddingBottom: 14,
			paddingLeft: 20,
			paddingRight: 20,
			...COMMON_DEFAULTS,
		},
		newProps: { ...NEW_PAD, text: 'Your heading here', fontWeight: '700', lineHeight: 1.25 },
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
			...COMMON_DEFAULTS,
		},
		newProps: { ...NEW_PAD, fontSize: 15, fontWeight: '400', lineHeight: 1.6 },
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
			...COMMON_DEFAULTS,
		},
		newProps: { ...NEW_PAD, text: 'Write your email content here. Keep it short, clear and kind.', fontWeight: '400', lineHeight: 1.65 },
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
			imageHeight: 0, // 0 = natural height
			borderRadius: 0,
			align: 'center',
			paddingTop: 0,
			paddingBottom: 0,
			paddingLeft: 0,
			paddingRight: 0,
			...COMMON_DEFAULTS,
		},
		newProps: { ...NEW_PAD, src: 'https://placehold.co/600x240', imageHeight: 200, borderRadius: 8, paddingTop: 8, paddingBottom: 8 },
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
			borderStyle: 'none',
			borderColor: '#d1d5db',
			blockRadius: 0,
		},
		newProps: { ...NEW_PAD, text: 'Click here', color: 'auto', borderRadius: 8, innerPadding: '12px 30px' },
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
			lineHeight: 1.6,
			align: 'left',
			paddingTop: 14,
			paddingBottom: 14,
			paddingLeft: 20,
			paddingRight: 20,
			...COMMON_DEFAULTS,
		},
		newProps: { ...NEW_PAD },
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
			borderColor: '#e5e7eb', // the cell lines
			fontSize: 13,
			align: 'left',
			paddingTop: 14,
			paddingBottom: 14,
			paddingLeft: 20,
			paddingRight: 20,
			backgroundColor: 'transparent',
			borderStyle: 'none',
			blockRadius: 0,
		},
		newProps: {
			...NEW_PAD,
			col1Header: 'Item',
			headerColor: 'auto',
			rows: [
				{ col1: 'First item', col2: 'Description of the first item' },
				{ col1: 'Second item', col2: 'Description of the second item' },
			],
		},
	},
	{
		type: 'section',
		label: 'Section',
		icon: 'section',
		defaultProps: {
			backgroundColor: '#f5f5f5',
			// An empty text keeps the old spacer section.
			text: '',
			color: '#374151',
			fontSize: 14,
			lineHeight: 1.6,
			borderRadius: 0,
			align: 'left',
			paddingTop: 14,
			paddingBottom: 14,
			paddingLeft: 20,
			paddingRight: 20,
			borderStyle: 'none',
			borderColor: '#d1d5db',
			blockRadius: 0,
		},
		newProps: { ...NEW_PAD, text: 'A highlighted note for your readers.', borderRadius: 8, paddingTop: 18, paddingBottom: 18 },
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
			...COMMON_DEFAULTS,
		},
		newProps: { ...NEW_PAD, linkColor: '#6b7280' },
	},
];

export function createBlock(type: BlockType, over?: Record<string, any>): Block {
	const def = blockDefs.find(d => d.type === type);
	if (!def) throw new Error(`Unknown block type: ${type}`);
	return {
		id: uid(),
		type,
		props: structuredClone({ ...def.defaultProps, ...(def.newProps ?? {}), ...(over ?? {}) }),
	};
}

/** Display name of a block type (the toolbar chip and the layers list). */
export const TYPE_NAME: Record<BlockType, string> = {
	header: 'Header', heading: 'Heading', subheading: 'Subheading', content: 'Content', image: 'Image',
	button: 'Button', list: 'List', table: 'Table', section: 'Section', footer: 'Footer',
};

/** Tile order in the Blocks tab. */
export const BLOCK_ORDER: BlockType[] = ['header', 'heading', 'subheading', 'content', 'image', 'button', 'list', 'table', 'section', 'footer'];

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
