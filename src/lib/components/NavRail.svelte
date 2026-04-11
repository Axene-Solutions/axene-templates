<script lang="ts">
	import { page } from '$app/state';

	const path = $derived(page.url.pathname);

	function isActive(href: string): boolean {
		if (href === '/') return path === '/';
		return path.startsWith(href);
	}
</script>

<nav class="rail max-h-[100vh] sticky top-0">

	<a href="/" class="logo" title="Home">
		<img src="https://mail.axene.io/email-assets/logo.png" width="24" height="24" alt="Axene" />
	</a>

	<a href="/" class="nav-btn" class:active={isActive('/')} title="Home">
		<svg width="16" height="16" viewBox="0 0 24 24" stroke-width="1.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
			<path d="M10 16H14"/>
			<path d="M2 8L11.7317 3.13416C11.9006 3.04971 12.0994 3.0497 12.2683 3.13416L22 8"/>
			<path d="M20 11V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V11"/>
		</svg>
	</a>
	<a href="/templates" class="nav-btn" class:active={isActive('/templates')} title="Templates">
		<svg width="16" height="16" viewBox="0 0 24 24" stroke-width="1.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
			<path d="M5.5 6C5.77614 6 6 5.77614 6 5.5C6 5.22386 5.77614 5 5.5 5C5.22386 5 5 5.22386 5 5.5C5 5.77614 5.22386 6 5.5 6Z" fill="currentColor"/>
			<path d="M5.5 12.5C5.77614 12.5 6 12.2761 6 12C6 11.7239 5.77614 11.5 5.5 11.5C5.22386 11.5 5 11.7239 5 12C5 12.2761 5.22386 12.5 5.5 12.5Z" fill="currentColor"/>
			<path d="M5.5 19C5.77614 19 6 18.7761 6 18.5C6 18.2239 5.77614 18 5.5 18C5.22386 18 5 18.2239 5 18.5C5 18.7761 5.22386 19 5.5 19Z" fill="currentColor"/>
			<path d="M12 6C12.2761 6 12.5 5.77614 12.5 5.5C12.5 5.22386 12.2761 5 12 5C11.7239 5 11.5 5.22386 11.5 5.5C11.5 5.77614 11.7239 6 12 6Z" fill="currentColor"/>
			<path d="M12 12.5C12.2761 12.5 12.5 12.2761 12.5 12C12.5 11.7239 12.2761 11.5 12 11.5C11.7239 11.5 11.5 11.7239 11.5 12C11.5 12.2761 11.7239 12.5 12 12.5Z" fill="currentColor"/>
			<path d="M12 19C12.2761 19 12.5 18.7761 12.5 18.5C12.5 18.2239 12.2761 18 12 18C11.7239 18 11.5 18.2239 11.5 18.5C11.5 18.7761 11.7239 19 12 19Z" fill="currentColor"/>
			<path d="M18.5 6C18.7761 6 19 5.77614 19 5.5C19 5.22386 18.7761 5 18.5 5C18.2239 5 18 5.22386 18 5.5C18 5.77614 18.2239 6 18.5 6Z" fill="currentColor"/>
			<path d="M18.5 12.5C18.7761 12.5 19 12.2761 19 12C19 11.7239 18.7761 11.5 18.5 11.5C18.2239 11.5 18 11.7239 18 12C18 12.2761 18.2239 12.5 18.5 12.5Z" fill="currentColor"/>
			<path d="M18.5 19C18.7761 19 19 18.7761 19 18.5C19 18.2239 18.7761 18 18.5 18C18.2239 18 18 18.2239 18 18.5C18 18.7761 18.2239 19 18.5 19Z" fill="currentColor"/>
		</svg>
	</a>
	<a href="/editor" class="nav-btn" class:active={isActive('/editor')} title="Editor">
		<svg width="16" height="16" viewBox="0 0 24 24" stroke-width="1.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
			<path d="M7 12L12 15.5L17 12"/>
			<path d="M2 20V9.13238C2 8.42985 2.3686 7.77884 2.97101 7.41739L10.971 2.61739C11.6044 2.23738 12.3956 2.23738 13.029 2.6174L21.029 7.4174C21.6314 7.77884 22 8.42985 22 9.13238V20C22 21.1046 21.1046 22 20 22H4C2.89543 22 2 21.1046 2 20Z"/>
		</svg>
	</a>

	<div class="spacer"></div>

	<button class="nav-btn" title="Settings">
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
			<path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" />
			<path d="M19.6224 10.3954L18.5247 7.7448L20 6L18 4L16.2647 5.48295L13.5578 4.36974L12.9353 2H10.981L10.3491 4.40113L7.70441 5.51596L6 4L4 6L5.45337 7.78885L4.3725 10.4463L2 11V13L4.40111 13.6555L5.51575 16.2997L4 18L6 20L7.79116 18.5403L10.397 19.6123L11 22H13L13.6045 19.6132L16.2551 18.5155C16.6969 18.8313 18 20 18 20L20 18L18.5159 16.2494L19.6139 13.598L22 13V11L19.6224 10.3954Z" />
		</svg>
	</button>

	<div class="avatar">
		<svg viewBox="0 0 28 28" fill="none" width="22" height="22"><circle cx="14" cy="10" r="5" fill="#bbb"/><path d="M3 26c0-6.1 4.9-11 11-11s11 4.9 11 11" fill="#bbb"/></svg>
	</div>
</nav>

<style>
	.rail {
		width: 46px;
		background: #141414;
		border-right: 1px solid rgba(255,255,255,0.06);
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 12px 0;
		gap: 2px;
		flex-shrink: 0;
	}
	.logo {
		width: 30px; height: 30px; border-radius: 8px;
		display: flex; align-items: center; justify-content: center;
		margin-bottom: 10px; overflow: hidden;
	}
	.logo img { display: block; }
	.nav-btn {
		width: 30px; height: 30px; border-radius: 7px;
		display: flex; align-items: center; justify-content: center;
		cursor: pointer; color: #888; border: none; background: transparent;
		text-decoration: none; transition: background 0.12s, color 0.12s;
	}
	.nav-btn:hover { background: rgba(255,255,255,0.05); color: #888; }
	.nav-btn.active { background: rgba(255,209,0,0.08); color: #FFD100; }
	.spacer { flex: 1; }
	.avatar {
		width: 26px; height: 26px; border-radius: 50%; background: #2a2a2a;
		display: flex; align-items: center; justify-content: center;
		overflow: hidden; margin-top: 4px;
	}
</style>
