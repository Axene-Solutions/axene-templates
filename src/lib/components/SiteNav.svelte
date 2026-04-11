<script lang="ts">
	import { page } from '$app/state';
	const path = $derived(page.url.pathname);
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
		<a href="/editor" class="sn-cta">Open Editor</a>
	</div>
</nav>

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

	@media (max-width: 640px) {
		.sn-links { display: none; }
	}
</style>
