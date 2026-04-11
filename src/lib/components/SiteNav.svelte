<script lang="ts">
	import { page } from '$app/state';
	const path = $derived(page.url.pathname);

	interface Props {
		user?: { id: string; email: string; name: string | null; avatarUrl: string | null } | null;
	}
	let { user = null }: Props = $props();

	let showDropdown = $state(false);

	function getInitials(name: string | null, email: string): string {
		if (name) {
			return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
		}
		return email[0].toUpperCase();
	}

	async function logout() {
		await fetch('/auth/logout', { method: 'POST' });
		window.location.href = '/';
	}
</script>

<nav class="site-nav">
	<div class="sn-inner">
		<a href="/" class="sn-brand">
			<img src="https://mail.axene.io/email-assets/logo.png" width="22" height="22" alt="Axene" class="sn-logo" />
			Axene Templates
		</a>
		<div class="sn-links">
			<a href="/" class:active={path === '/'}>Home</a>
			<a href="/templates" class:active={path === '/templates'}>Templates</a>
			<a href="#features">Features</a>
		</div>
		<div class="sn-right">
			{#if user}
				<div class="sn-user-wrap">
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="sn-avatar" onclick={() => (showDropdown = !showDropdown)}>
						{#if user.avatarUrl}
							<img src={user.avatarUrl} alt={user.name ?? user.email} class="sn-avatar-img" />
						{:else}
							<span class="sn-avatar-initials">{getInitials(user.name, user.email)}</span>
						{/if}
					</div>
					{#if showDropdown}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div class="sn-dropdown" onclick={(e) => e.stopPropagation()}>
							<div class="sn-dropdown-info">
								{#if user.name}<div class="sn-dropdown-name">{user.name}</div>{/if}
								<div class="sn-dropdown-email">{user.email}</div>
							</div>
							<button class="sn-dropdown-btn" onclick={logout}>Sign out</button>
						</div>
					{/if}
				</div>
			{:else}
				<a href="/auth/google" class="hidden! md:block! sn-cta">Sign in</a>
			{/if}
		</div>
	</div>
</nav>

{#if showDropdown}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="sn-backdrop" onclick={() => (showDropdown = false)}></div>
{/if}

<style>
	.site-nav {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 50;
		background: rgba(16,16,16,0.75);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid rgba(255,255,255,0.06);
	}
	.sn-inner {
		max-width: 1100px;
		margin: 0 auto;
		padding: 0 24px;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.sn-brand {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 700;
		font-size: 15px;
		color: #fff;
		text-decoration: none;
		letter-spacing: -0.3px;
	}
	.sn-logo { border-radius: 4px; }
	.sn-links {
		display: flex;
		gap: 28px;
		font-size: 13px;
		font-weight: 500;
	}
	.sn-links a {
		text-decoration: none;
		color: #666;
		transition: color 0.15s;
	}
	.sn-links a:hover, .sn-links a.active { color: #fff; }
	.sn-right {
		display: flex;
		align-items: center;
	}
	.sn-cta {
		display: inline-flex;
		align-items: center;
		padding: 7px 18px;
		font-size: 13px;
		font-weight: 600;
		color: #000;
		background: #FFD100;
		border-radius: 100px;
		text-decoration: none;
		transition: all 0.2s;
	}
	.sn-cta:hover { background: #e6bc00; transform: scale(1.03); }

	/* Avatar */
	.sn-user-wrap {
		position: relative;
	}
	.sn-avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		overflow: hidden;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #333;
		border: 2px solid rgba(255,209,0,0.4);
		transition: border-color 0.15s;
	}
	.sn-avatar:hover {
		border-color: #FFD100;
	}
	.sn-avatar-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.sn-avatar-initials {
		font-size: 11px;
		font-weight: 700;
		color: #FFD100;
		line-height: 1;
	}

	/* Dropdown */
	.sn-dropdown {
		position: absolute;
		top: 38px;
		right: 0;
		min-width: 200px;
		background: #1a1a1a;
		border: 1px solid rgba(255,255,255,0.08);
		border-radius: 10px;
		padding: 8px 0;
		z-index: 60;
		box-shadow: 0 8px 24px rgba(0,0,0,0.4);
	}
	.sn-dropdown-info {
		padding: 8px 14px 10px;
		border-bottom: 1px solid rgba(255,255,255,0.06);
	}
	.sn-dropdown-name {
		font-size: 13px;
		font-weight: 600;
		color: #fff;
	}
	.sn-dropdown-email {
		font-size: 12px;
		color: #888;
		margin-top: 1px;
	}
	.sn-dropdown-btn {
		display: block;
		width: 100%;
		text-align: left;
		padding: 8px 14px;
		font-size: 13px;
		font-family: inherit;
		color: #ccc;
		background: none;
		border: none;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}
	.sn-dropdown-btn:hover {
		background: rgba(255,255,255,0.05);
		color: #fff;
	}

	/* Backdrop to close dropdown */
	.sn-backdrop {
		position: fixed;
		inset: 0;
		z-index: 49;
	}

	@media (max-width: 640px) {
		.sn-links { display: none; }
	}
</style>
