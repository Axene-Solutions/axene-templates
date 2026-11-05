// Lets node --test import SvelteKit server modules without a build: resolves $lib, stubs
// $env/dynamic/private and the database. No dependencies.
import { register } from 'node:module';
register('./loader.mjs', import.meta.url);
