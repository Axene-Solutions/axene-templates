<script lang="ts">
	import Icon from './Icon.svelte'
	import Logo from './Logo.svelte'
	import ThemeToggle from './ThemeToggle.svelte'
	let {
		user = null,
	}: {
		user: {
			id: string
			email: string
			name: string | null
			avatarUrl: string | null
		} | null
	} = $props()
	import { page } from '$app/state'
	const path = $derived(page.url.pathname)

	function isActive(href: string): boolean {
		if (href === '/') return path === '/'
		return path.startsWith(href)
	}

	function getInitials(name: string | null, email: string): string {
		if (name) {
			return name
				.split(' ')
				.map((w) => w[0])
				.join('')
				.toUpperCase()
				.slice(0, 2)
		}
		return email[0].toUpperCase()
	}

	async function logout() {
		await fetch('/auth/logout', { method: 'POST' })
		window.location.href = '/'
	}
</script>

<nav class="rail max-h-[100vh] sticky top-0">
	<a href="/" class="logo" title="Home">
		<Logo size={26} />
	</a>

	<a href="/" class="nav-btn" class:active={isActive('/')} title="Home">
		<Icon name="home" width={16} height={16} />
	</a>
	<a href="/templates" class="nav-btn" class:active={isActive('/templates')} title="Templates">
		<Icon name="grid" width={16} height={16} />
	</a>
	<a href="/editor" class="nav-btn" class:active={isActive('/editor')} title="Editor">
		<Icon name="pencil" width={16} height={16} />
	</a>

	<div class="spacer"></div>

	<ThemeToggle />

	{#if user}
		<div class="avatar" title={user.name ?? user.email}>
			{#if user.avatarUrl}
				<img src={user.avatarUrl} alt={user.name ?? user.email} class="nav-avatar-img" referrerpolicy="no-referrer" />
			{:else}
				<span class="nav-avatar-initials">{getInitials(user.name, user.email)}</span>
			{/if}
		</div>
		<button class="nav-btn" title="Sign out" aria-label="Sign out" onclick={logout}>
			<Icon name="logout" width={16} height={16} />
		</button>
	{:else}
		<a href="/login" class="nav-btn" title="Sign in" aria-label="Sign in">
			<Icon name="user" width={16} height={16} />
		</a>
	{/if}
</nav>

<style>
	.rail {
		width: 46px;
		background: var(--color-surface);
		border-right: 1px solid var(--color-border-1);
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 12px 0;
		gap: 2px;
		flex-shrink: 0;
	}
	.logo {
		width: 30px;
		height: 30px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 10px;
		overflow: hidden;
	}
	.nav-btn {
		width: 30px;
		height: 30px;
		border-radius: 7px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: var(--color-muted);
		border: none;
		background: transparent;
		text-decoration: none;
		transition:
			background 0.12s,
			color 0.12s;
	}
	.nav-btn:hover {
		background: var(--color-surface-2);
		color: var(--color-text);
	}
	.nav-btn.active {
		background: var(--color-accent-soft);
		color: var(--color-accent-ink);
	}
	.spacer {
		flex: 1;
	}
	.avatar {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: var(--color-surface-2);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		margin-top: 4px;
		margin-bottom: 2px;
	}
	.nav-avatar-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 50%;
	}
	.nav-avatar-initials {
		font-size: 13px;
		color: var(--color-text);
		font-weight: 600;
	}
</style>
