/**
 * Global editor state using Svelte 5 runes.
 */

import { type Block, type BlockType, createBlock, defaultBlocks } from './blocks';
import { blocksToMjml } from './mjml';

// State
let blocks = $state<Block[]>(defaultBlocks());
let selectedId = $state<string | null>(null);
let previewHtml = $state('');
let compiling = $state(false);
let templateName = $state('Untitled');
let templateId = $state('untitled');
let dirty = $state(false);

// Derived
const selected = $derived(blocks.find(b => b.id === selectedId) ?? null);
const mjmlSource = $derived(blocksToMjml(blocks));
// Theme color cascades from the header block's backgroundColor
const themeColor = $derived(blocks.find(b => b.type === 'header')?.props.backgroundColor ?? '#1daa82');

// Actions
function selectBlock(id: string | null) {
	selectedId = id;
}

function addBlock(type: BlockType, index?: number) {
	// Enforce max 1 header and 1 footer
	if (type === 'header' && blocks.some(b => b.type === 'header')) return;
	if (type === 'footer' && blocks.some(b => b.type === 'footer')) return;

	const block = createBlock(type);

	if (type === 'header') {
		// Header always goes first
		blocks = [block, ...blocks];
	} else if (type === 'footer') {
		// Footer always goes last
		blocks = [...blocks, block];
	} else if (index !== undefined) {
		// Insert at specific position but never before header or after footer
		const headerEnd = blocks[0]?.type === 'header' ? 1 : 0;
		const footerStart = blocks[blocks.length - 1]?.type === 'footer' ? blocks.length - 1 : blocks.length;
		const clampedIndex = Math.max(headerEnd, Math.min(index, footerStart));
		blocks.splice(clampedIndex, 0, block);
		blocks = [...blocks];
	} else {
		// Add before footer if one exists, else at end
		const footerIdx = blocks.findIndex(b => b.type === 'footer');
		if (footerIdx !== -1) {
			blocks.splice(footerIdx, 0, block);
			blocks = [...blocks];
		} else {
			blocks = [...blocks, block];
		}
	}
	selectedId = block.id;
	dirty = true;
	scheduleCompile();
}

function removeBlock(id: string) {
	blocks = blocks.filter(b => b.id !== id);
	if (selectedId === id) selectedId = null;
	dirty = true;
	scheduleCompile();
}

function canMove(id: string, direction: 'up' | 'down'): boolean {
	const idx = blocks.findIndex(b => b.id === id);
	if (idx === -1) return false;
	const block = blocks[idx];
	// Header and footer can never move
	if (block.type === 'header' || block.type === 'footer') return false;
	const target = direction === 'up' ? idx - 1 : idx + 1;
	if (target < 0 || target >= blocks.length) return false;
	// Can't swap with header or footer
	if (blocks[target].type === 'header' || blocks[target].type === 'footer') return false;
	return true;
}

function canDelete(id: string): boolean {
	// Header and footer can be deleted (user might want to remove them)
	return true;
}

function canDuplicate(id: string): boolean {
	const block = blocks.find(b => b.id === id);
	if (!block) return false;
	// Can't duplicate header or footer (max 1 each)
	if (block.type === 'header' || block.type === 'footer') return false;
	return true;
}

function moveBlock(id: string, direction: 'up' | 'down') {
	if (!canMove(id, direction)) return;
	const idx = blocks.findIndex(b => b.id === id);
	if (idx === -1) return;
	const target = direction === 'up' ? idx - 1 : idx + 1;
	if (target < 0 || target >= blocks.length) return;
	const temp = blocks[idx];
	blocks[idx] = blocks[target];
	blocks[target] = temp;
	blocks = [...blocks];
	dirty = true;
	scheduleCompile();
}

function duplicateBlock(id: string) {
	const idx = blocks.findIndex(b => b.id === id);
	if (idx === -1) return;
	const original = blocks[idx];
	const copy = createBlock(original.type);
	copy.props = { ...original.props };
	blocks.splice(idx + 1, 0, copy);
	blocks = [...blocks];
	selectedId = copy.id;
	dirty = true;
	scheduleCompile();
}

function updateProp(id: string, key: string, value: any) {
	const block = blocks.find(b => b.id === id);
	if (!block) return;
	block.props[key] = value;
	blocks = [...blocks]; // trigger reactivity
	dirty = true;
	scheduleCompile();
}

function setBlocks(newBlocks: Block[]) {
	blocks = newBlocks;
	selectedId = null;
	dirty = false;
	scheduleCompile();
}

function setTemplate(id: string, name: string, newBlocks: Block[]) {
	templateId = id;
	templateName = name;
	setBlocks(newBlocks);
}

function newTemplate() {
	templateId = 'untitled-' + Date.now().toString(36);
	templateName = 'Untitled';
	setBlocks(defaultBlocks());
}

// Compile MJML to HTML via server
let compileTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleCompile() {
	if (compileTimer) clearTimeout(compileTimer);
	compileTimer = setTimeout(compile, 300);
}

async function compile() {
	compiling = true;
	try {
		const res = await fetch('/api/render', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ mjml: mjmlSource }),
		});
		const data = await res.json();
		if (data.html) previewHtml = data.html;
	} catch {}
	finally { compiling = false; }
}

// Save template
async function saveTemplate() {
	const res = await fetch('/api/templates', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ id: templateId, name: templateName, blocks }),
	});
	if (res.ok) dirty = false;
	return res.ok;
}

export const editor = {
	get blocks() { return blocks; },
	get selected() { return selected; },
	get selectedId() { return selectedId; },
	get previewHtml() { return previewHtml; },
	get compiling() { return compiling; },
	get templateName() { return templateName; },
	set templateName(v: string) { templateName = v; dirty = true; },
	get templateId() { return templateId; },
	get dirty() { return dirty; },
	get mjmlSource() { return mjmlSource; },
	get themeColor() { return themeColor; },
	selectBlock,
	addBlock,
	removeBlock,
	moveBlock,
	duplicateBlock,
	updateProp,
	canMove,
	canDelete,
	canDuplicate,
	setBlocks,
	setTemplate,
	newTemplate,
	compile,
	saveTemplate,
};
