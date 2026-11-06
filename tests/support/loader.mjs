import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const stub = (name) => ({ url: pathToFileURL(path.join(here, name)).href, shortCircuit: true });

function withExt(file) {
	for (const c of [file, file + '.ts', file + '.svelte.ts', path.join(file, 'index.ts')]) {
		if (fs.existsSync(c) && fs.statSync(c).isFile()) return pathToFileURL(c).href;
	}
	return null;
}

export async function resolve(specifier, context, next) {
	if (specifier === '$env/dynamic/private') return stub('env-stub.mjs');
	if (specifier === '$app/navigation') return stub('navigation-stub.mjs');
	if (specifier === '$app/state') return stub('state-stub.mjs');
	if (specifier === '$lib/server/db') return stub('db-stub.mjs');
	if (specifier.startsWith('$lib/')) {
		const url = withExt(path.join(root, 'src', 'lib', specifier.slice(5)));
		if (url) return { url, shortCircuit: true };
	}
	if (specifier.startsWith('.') && context.parentURL?.startsWith(pathToFileURL(path.join(root, 'src')).href)) {
		const url = withExt(path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier));
		if (url) return { url, shortCircuit: true };
	}
	return next(specifier, context);
}

// Rune modules (*.svelte.ts, such as the editor store) are compiled the way Vite does it: strip
// the types, then let the Svelte compiler turn $state and $derived into runtime calls.
export async function load(url, context, next) {
	if (!url.endsWith('.svelte.ts')) return next(url, context);
	const { stripTypeScriptTypes } = await import('node:module');
	const { compileModule } = await import('svelte/compiler');
	const ts = fs.readFileSync(fileURLToPath(url), 'utf8');
	const js = compileModule(stripTypeScriptTypes(ts), { filename: fileURLToPath(url), generate: 'client', dev: false }).js.code;
	return { format: 'module', source: js, shortCircuit: true };
}
