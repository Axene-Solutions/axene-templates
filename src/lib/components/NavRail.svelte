<script lang="ts">
	import Icon from './Icon.svelte'
	import Logo from './Logo.svelte'
	import { theme } from '$lib/stores/theme.svelte'
	import { page } from '$app/state'
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
	const path = $derived(page.url.pathname)

	function isActive(href: string): boolean {
		return path === href || path.startsWith(href + '/')
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

<nav class="rail" aria-label="Main">
	<a href="/" class="rail-logo" title="Home" aria-label="Axene Templates home">
		<Logo size={34} />
	</a>

	<a class="rail-btn" class:rail-on={isActive('/templates')} href="/templates" aria-label="Templates" aria-current={isActive('/templates') ? 'page' : undefined}>
		<Icon name="grid" width={19} height={19} />
	</a>
	<a class="rail-btn" class:rail-on={isActive('/settings')} href="/settings" aria-label="Settings and Mailer" aria-current={isActive('/settings') ? 'page' : undefined}>
		<Icon name="email" width={19} height={19} />
	</a>

	<div class="rail-spacer"></div>

	<button class="rail-btn" type="button" onclick={() => theme.toggle()} aria-label="Switch light or dark">
		<Icon name="moon" width={18} height={18} />
	</button>

	{#if user}
		<div class="rail-avatar" title={user.name ?? user.email}>
			{#if user.avatarUrl}
				<img src={user.avatarUrl} alt={user.name ?? user.email} class="rail-avatar-img" referrerpolicy="no-referrer" />
			{:else}
				<span class="rail-avatar-initials">{getInitials(user.name, user.email)}</span>
			{/if}
		</div>
		<button class="rail-btn" type="button" title="Sign out" aria-label="Sign out" onclick={logout}>
			<Icon name="logout" width={18} height={18} />
		</button>
	{:else}
		<a href="/login" class="rail-btn" title="Sign in" aria-label="Sign in">
			<Icon name="user" width={18} height={18} />
		</a>
	{/if}
</nav>

<style>
	.rail {
		position: sticky;
		top: 0;
		align-self: flex-start;
		height: 100vh;
		width: 72px;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 22px 0;
		gap: 6px;
		background: var(--color-bg);
	}
	.rail-logo {
		display: block;
		margin-bottom: 18px;
		border-radius: 8px;
		overflow: hidden;
		line-height: 0;
	}
	.rail-logo :global(.logo) {
		border-radius: 8px;
	}
	.rail-btn {
		width: 40px;
		height: 40px;
		border-radius: 12px;
		border: 0;
		background: transparent;
		color: var(--color-muted);
		display: grid;
		place-items: center;
		cursor: pointer;
		text-decoration: none;
	}
	.rail-btn:hover {
		background: var(--color-surface-2);
		color: var(--color-text);
	}
	.rail-btn:focus-visible {
		outline: 2px solid var(--color-accent);
	}
	.rail-on {
		background: var(--color-surface-2);
		color: var(--color-text);
	}
	.rail-spacer {
		flex-grow: 1;
	}
	.rail-avatar {
		width: 28px;
		height: 28px;
		border-radius: 8px;
		background: var(--color-surface-2);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		margin: 4px 0;
	}
	.rail-avatar-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.rail-avatar-initials {
		font-size: 12px;
		color: var(--color-text);
		font-weight: 600;
	}
</style>
