import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const stub = (name) => ({ url: pathToFileURL(path.join(here, name)).href, shortCircuit: true });

function withExt(file) {
	for (const c of [file, file + '.ts', path.join(file, 'index.ts')]) {
		if (fs.existsSync(c) && fs.statSync(c).isFile()) return pathToFileURL(c).href;
	}
	return null;
}

export async function resolve(specifier, context, next) {
	if (specifier === '$env/dynamic/private') return stub('env-stub.mjs');
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
