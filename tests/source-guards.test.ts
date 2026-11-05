// Source scans that keep the XSS fixes from quietly regressing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');

function svelteFiles(dir: string, out: string[] = []): string[] {
	for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) svelteFiles(p, out);
		else if (e.name.endsWith('.svelte')) out.push(p);
	}
	return out;
}

test('the preview iframe in Canvas.svelte is sandboxed with no script or same-origin rights', () => {
	const src = read('src/lib/components/Canvas.svelte');
	const iframe = src.match(/<iframe[\s\S]*?>/)?.[0] ?? '';
	assert.match(iframe, /\ssandbox=""/);
	assert.match(iframe, /srcdoc=/);
});

test('every iframe in the app is sandboxed, and none grants allow-scripts or allow-same-origin', () => {
	for (const f of svelteFiles('src')) {
		for (const m of read(f).matchAll(/<iframe[\s\S]*?>/g)) {
			assert.match(m[0], /\ssandbox="[^"]*"/, `${f}: iframe without sandbox`);
			assert.doesNotMatch(m[0], /allow-scripts|allow-same-origin/, `${f}: sandbox too wide`);
		}
	}
});

// Each {@html} sink and why it is safe. A new one must be added here on purpose.
const ALLOWED_HTML = new Map<string, string[]>([
	['src/lib/components/Icon.svelte', ['{@html svg}']], // vendored Iconsax SVG files
	['src/lib/components/RightPanel.svelte', ['{@html opt.svg}']], // static layout pictograms in the file
	['src/lib/components/CanvasBlock.svelte', ["{@html chipifyHtml(block.props.text ?? '', phKind)}"]], // server-sanitised blocks, chipified
]);

test('{@html} appears only at the allowed call sites', () => {
	const seen = new Map<string, string[]>();
	for (const f of svelteFiles('src')) {
		const hits = [...read(f).matchAll(/\{@html[^}]*\}(?:[^{}]*\})?/g)].map((m) => m[0].trim());
		if (hits.length) seen.set(f.split(path.sep).join('/'), hits);
	}
	assert.deepEqual(Object.fromEntries(seen), Object.fromEntries(ALLOWED_HTML));
});

test('blocks served to the editor and every render path go through the sanitiser', () => {
	assert.match(read('src/routes/api/templates/[id]/+server.ts'), /blocks: sanitizeBlocksForRead\(t\.blocks\)/);
	const render = read('src/lib/server/render.ts');
	assert.equal((render.match(/blocksToMjml\(sanitizeBlocksForRead\(blocks\)\)/g) ?? []).length, 3);
	assert.doesNotMatch(render, /blocksToMjml\(blocks/);
	assert.match(read('src/routes/api/templates/+server.ts'), /sanitizeBlocks\(rawBlocks, \{ strict: true \}\)/);
	assert.match(read('src/routes/api/mailer/templates/[mailerId]/open/+server.ts'), /readEnvelope\(res\.data\.blocksJson, sanitizeForOpen\)/);
	for (const f of ['src/routes/api/templates/[id]/send/+server.ts', 'src/routes/api/templates/[id]/mailer-save/+server.ts']) {
		assert.match(read(f), /compiledHtmlProblem\(html\)/, `${f}: no tripwire`);
	}
});

test('CSP is configured and the theme bootstrap script carries the nonce', () => {
	const cfg = read('svelte.config.js');
	assert.match(cfg, /csp:\s*\{\s*mode: 'auto'/);
	for (const d of ["'object-src': \\['none'\\]", "'frame-ancestors': \\['none'\\]", "'base-uri': \\['self'\\]", "'default-src': \\['self'\\]"]) assert.match(cfg, new RegExp(d));
	const html = read('src/app.html');
	for (const m of html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>/g)) assert.match(m[0], /nonce="%sveltekit\.nonce%"/);
});

test('/api/templates/compile renders starter templates only, never user-published ones', () => {
	const src = read('src/routes/api/templates/compile/+server.ts');
	assert.match(src, /eq\(templates\.isStarter, true\)/);
	assert.doesNotMatch(src, /templates\.isPublic/);
});
