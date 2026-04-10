<script lang="ts">
	import { page } from '$app/state';

	const path = $derived(page.url.pathname);

	function isActive(href: string): boolean {
		if (href === '/') return path === '/';
		return path.startsWith(href);
	}
</script>

<nav class="rail">

	<a href="/" class="logo" title="Home">
		<img src="https://mail.axene.io/email-assets/logo.png" width="24" height="24" alt="Axene" />
	</a>

	<a href="/" class="nav-btn" class:active={isActive('/')} title="Home">
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
			<path d="M2 8L11.7317 3.13416C11.9006 3.04971 12.0994 3.0497 12.2683 3.13416L22 8" />
			<path d="M20 11V19.1905C20 19.6377 19.6377 20 19.1905 20H4.80953C4.36229 20 4 19.6377 4 19.1905V11" />
		</svg>
	</a>
	<a href="/templates" class="nav-btn" class:active={isActive('/templates')} title="Templates">
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
			<path d="M14 20.4V14.6C14 14.2686 14.2686 14 14.6 14H20.4C20.7314 14 21 14.2686 21 14.6V20.4C21 20.7314 20.7314 21 20.4 21H14.6C14.2686 21 14 20.7314 14 20.4Z" />
			<path d="M3 20.4V14.6C3 14.2686 3.26863 14 3.6 14H9.4C9.73137 14 10 14.2686 10 14.6V20.4C10 20.7314 9.73137 21 9.4 21H3.6C3.26863 21 3 20.7314 3 20.4Z" />
			<path d="M14 9.4V3.6C14 3.26863 14.2686 3 14.6 3H20.4C20.7314 3 21 3.26863 21 3.6V9.4C21 9.73137 20.7314 10 20.4 10H14.6C14.2686 10 14 9.73137 14 9.4Z" />
			<path d="M3 9.4V3.6C3 3.26863 3.26863 3 3.6 3H9.4C9.73137 3 10 3.26863 10 3.6V9.4C10 9.73137 9.73137 10 9.4 10H3.6C3.26863 10 3 9.73137 3 9.4Z" />
		</svg>
	</a>
	<a href="/editor" class="nav-btn" class:active={isActive('/editor')} title="Editor">
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
			<path d="M7 9L12 12.5L17 9" />
			<path d="M2 17.4V6.6C2 6.26863 2.26863 6 2.6 6H21.4C21.7314 6 22 6.26863 22 6.6V17.4C22 17.7314 21.7314 18 21.4 18H2.6C2.26863 18 2 17.7314 2 17.4Z" />
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
		background: #fff;
		border-right: 1px solid #ebebeb;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 12px 0;
		gap: 2px;
		flex-shrink: 0;
	}
	.dots { display: flex; gap: 6px; margin-bottom: 14px; }
	.dot { width: 12px; height: 12px; border-radius: 50%; }
	.dot-r { background: #ff5f57; }
	.dot-y { background: #febc2e; }
	.dot-g { background: #28c840; }
	.logo {
		width: 30px; height: 30px; border-radius: 8px;
		display: flex; align-items: center; justify-content: center;
		margin-bottom: 10px; overflow: hidden;
	}
	.logo img { display: block; }
	.nav-btn {
		width: 30px; height: 30px; border-radius: 7px;
		display: flex; align-items: center; justify-content: center;
		cursor: pointer; color: #aaa; border: none; background: transparent;
		text-decoration: none; transition: background 0.12s, color 0.12s;
	}
	.nav-btn:hover { background: #f5f5f5; color: #555; }
	.nav-btn.active { background: #edf8f4; color: #1daa82; }
	.spacer { flex: 1; }
	.avatar {
		width: 26px; height: 26px; border-radius: 50%; background: #eee;
		display: flex; align-items: center; justify-content: center;
		overflow: hidden; margin-top: 4px;
	}
</style>
