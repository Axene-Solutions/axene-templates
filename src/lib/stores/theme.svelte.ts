// AXENE CANONICAL THEME STORE
// -----------------------------------------------------------------
// Place at: frontend/src/lib/stores/theme.svelte.ts
// Mechanism: light / dark / system. The preference is stored in a COOKIE on
// Domain=.axene.io (not localStorage) so it is SHARED across every *.axene.io
// product: set dark on mailer.axene.io and auth.axene.io / workspace.axene.io
// pick it up automatically. localStorage is per-origin and would NOT sync, which
// is why a cookie is used. The inline bootstrap in app.html mirrors readStored()
// so the correct theme is applied before paint (no light flash).
//
// This file is now BYTE-IDENTICAL across every product (no per-product key).
// The cookie name `axn_theme` is shared fleet-wide on purpose.

type Mode = 'light' | 'dark' | 'system';
type Resolved = 'light' | 'dark';

const COOKIE = 'axn_theme';

// Scope the cookie to the registrable domain so every subdomain sees it. On
// localhost / preview hosts (no axene.io), fall back to a host-only cookie.
function cookieDomain(): string {
	if (typeof location === 'undefined') return '';
	return location.hostname.endsWith('axene.io') ? '; Domain=.axene.io' : '';
}

function readStored(): Mode {
	if (typeof document === 'undefined') return 'system';
	const m = document.cookie.match('(?:^|; )' + COOKIE + '=([^;]*)');
	const v = m ? decodeURIComponent(m[1]) : null;
	return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

function persist(mode: Mode) {
	if (typeof document === 'undefined') return;
	// 1 year; Lax so it rides cross-subdomain top-level navigations.
	document.cookie =
		COOKIE + '=' + mode + '; Path=/; Max-Age=31536000; SameSite=Lax' + cookieDomain();
}

function systemPrefersDark(): boolean {
	if (typeof window === 'undefined') return false;
	return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolve(mode: Mode): Resolved {
	if (mode === 'system') return systemPrefersDark() ? 'dark' : 'light';
	return mode;
}

function apply(resolved: Resolved) {
	if (typeof document === 'undefined') return;
	document.documentElement.setAttribute('data-theme', resolved);
}

class ThemeStore {
	mode = $state<Mode>(readStored());
	resolved = $state<Resolved>(resolve(readStored()));

	init() {
		this.mode = readStored();
		this.resolved = resolve(this.mode);
		apply(this.resolved);

		if (typeof window !== 'undefined') {
			window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
				if (this.mode === 'system') {
					this.resolved = systemPrefersDark() ? 'dark' : 'light';
					apply(this.resolved);
				}
			});
		}
	}

	set(mode: Mode) {
		this.mode = mode;
		this.resolved = resolve(mode);
		apply(this.resolved);
		persist(mode);
	}

	toggle() {
		this.set(this.resolved === 'dark' ? 'light' : 'dark');
	}
}

export const theme = new ThemeStore();
