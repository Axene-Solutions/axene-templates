/**
 * Block data model for the email builder.
 * Each block represents a section of the email and maps to MJML output.
 */

export type BlockType = 'heading' | 'subheading' | 'content' | 'image' | 'button' | 'list' | 'section' | 'footer';

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
		type: 'heading',
		label: 'Heading',
		icon: 'heading',
		defaultProps: {
			text: 'Your Heading Here',
			fontSize: 26,
			fontWeight: 'bold',
			color: '#111827',
			align: 'center',
			paddingTop: 24,
			paddingBottom: 8,
			paddingLeft: 24,
			paddingRight: 24,
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
			paddingTop: 0,
			paddingBottom: 16,
			paddingLeft: 32,
			paddingRight: 32,
		},
	},
	{
		type: 'content',
		label: 'Content',
		icon: 'content',
		defaultProps: {
			text: 'Write your email content here. You can use <strong>bold</strong>, <em>italic</em>, and <a href="#">links</a>.',
			fontSize: 14,
			color: '#374151',
			align: 'left',
			lineHeight: '1.65',
			paddingTop: 8,
			paddingBottom: 8,
			paddingLeft: 24,
			paddingRight: 24,
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
			backgroundColor: '#1daa82',
			color: '#ffffff',
			fontSize: 14,
			fontWeight: '600',
			borderRadius: 6,
			align: 'center',
			innerPadding: '12px 32px',
			paddingTop: 16,
			paddingBottom: 16,
			paddingLeft: 24,
			paddingRight: 24,
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
			bulletColor: '#1daa82',
			paddingTop: 8,
			paddingBottom: 8,
			paddingLeft: 24,
			paddingRight: 24,
		},
	},
	{
		type: 'section',
		label: 'Section',
		icon: 'section',
		defaultProps: {
			backgroundColor: '#f5f5f5',
			paddingTop: 24,
			paddingBottom: 24,
			paddingLeft: 0,
			paddingRight: 0,
		},
	},
	{
		type: 'footer',
		label: 'Footer',
		icon: 'footer',
		defaultProps: {
			text: 'You received this email because you have an account with us. If you are not sure why, please contact us.',
			fontSize: 12,
			color: '#9ca3af',
			align: 'center',
			paddingTop: 16,
			paddingBottom: 16,
			paddingLeft: 24,
			paddingRight: 24,
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
		createBlock('section'),
		createBlock('heading'),
		createBlock('subheading'),
		createBlock('button'),
		createBlock('footer'),
	];
}
