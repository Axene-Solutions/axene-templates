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
	// Send and Save to Mailer share one path that sanitises (throwing, so a hopeless row is refused).
	assert.equal((render.match(/blocksToMjml\(sanitizeBlocks\(blocks, \{ strict: false \}\)\)/g) ?? []).length, 1);
	assert.equal((render.match(/mjmlOf\(blocks\)/g) ?? []).length, 2);
	assert.doesNotMatch(render, /blocksToMjml\(blocks/);
	assert.match(read('src/lib/server/render-starter.ts'), /blocksToMjml\(sanitizeBlocksForRead\(blocks\)\)/);
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

// Every module reachable from `file` through relative and $lib imports (static and dynamic).
function reachable(file: string, seen = new Set<string>()): Set<string> {
	if (seen.has(file)) return seen;
	seen.add(file);
	const src = read(file);
	for (const m of src.matchAll(/(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|^\s*import\s*['"]([^'"]+)['"]/gm)) {
		const spec = m[1] ?? m[2] ?? m[3];
		let base: string | null = null;
		if (spec.startsWith('$lib/')) base = path.join('src/lib', spec.slice(5));
		else if (spec.startsWith('.')) base = path.join(path.dirname(file), spec);
		else {
			seen.add('pkg:' + spec);
			continue;
		}
		const hit = [base, base + '.ts', path.join(base, 'index.ts')].find((c) => fs.existsSync(path.join(root, c)) && fs.statSync(path.join(root, c)).isFile());
		if (hit) reachable(hit, seen);
	}
	return seen;
}

test('the Send and Save to Mailer render path can never reach Handlebars', () => {
	const graph = reachable('src/lib/server/render.ts');
	for (const f of graph) {
		assert.doesNotMatch(f, /^pkg:handlebars/, 'render.ts reaches the handlebars package');
		assert.doesNotMatch(f, /injector|render-starter/, `render.ts reaches ${f}`);
	}
	for (const f of ['src/routes/api/templates/[id]/send/+server.ts', 'src/routes/api/templates/[id]/mailer-save/+server.ts']) {
		for (const g of reachable(f)) assert.ok(g !== 'pkg:handlebars' && !/injector|render-starter/.test(g), `${f} reaches ${g}`);
	}
	// Handlebars stays only behind the starter compile endpoint.
	assert.ok(reachable('src/routes/api/templates/compile/+server.ts').has('pkg:handlebars'));
	assert.doesNotMatch(read('src/lib/server/render.ts'), /from ['"](?:handlebars|\$lib\/server\/injector|\$lib\/server\/render-starter)['"]/);
});
