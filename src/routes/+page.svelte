<script lang="ts">
</script>

<svelte:head>
	<title>Axene Templates</title>
</svelte:head>

<div class="landing">
	<div class="hero">
		<img src="https://mail.axene.io/email-assets/logo.png" width="48" height="48" alt="Axene" class="logo" />
		<h1 class="headline">Design emails that land in inboxes</h1>
		<p class="subtitle">
			Build responsive email templates with a visual editor. Powered by MJML for pixel-perfect rendering across every email client.
		</p>
		<div class="cta-row">
			<a href="/editor" class="btn-primary">Start Building</a>
			<a href="/templates" class="btn-secondary">Browse Templates</a>
		</div>
	</div>

	<div class="features">
		<div class="card">
			<svg class="card-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1daa82" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="16 18 22 12 16 6" />
				<polyline points="8 6 2 12 8 18" />
			</svg>
			<div class="card-title">MJML Rendering</div>
			<div class="card-desc">Production-ready HTML compiled from MJML. Works in Gmail, Outlook, Apple Mail, and every other client.</div>
		</div>
		<div class="card">
			<svg class="card-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1daa82" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<rect x="3" y="3" width="7" height="7" rx="1" />
				<rect x="14" y="3" width="7" height="7" rx="1" />
				<rect x="3" y="14" width="7" height="7" rx="1" />
				<rect x="14" y="14" width="7" height="7" rx="1" />
			</svg>
			<div class="card-title">Drag and Drop</div>
			<div class="card-desc">Add headings, buttons, images, tables, and more. Reorder blocks with move up/down controls.</div>
		</div>
		<div class="card">
			<svg class="card-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1daa82" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="13.5" cy="6.5" r="2.5" />
				<circle cx="17.5" cy="15.5" r="2.5" />
				<circle cx="8.5" cy="15.5" r="2.5" />
				<line x1="13.5" y1="9" x2="17.5" y2="13" />
				<line x1="13.5" y1="9" x2="8.5" y2="13" />
			</svg>
			<div class="card-title">Theme System</div>
			<div class="card-desc">Set a brand color once in the header. It cascades to buttons, links, and accents across the entire template.</div>
		</div>
		<div class="card">
			<svg class="card-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1daa82" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<rect x="2" y="3" width="20" height="14" rx="2" />
				<line x1="8" y1="21" x2="16" y2="21" />
				<line x1="12" y1="17" x2="12" y2="21" />
			</svg>
			<div class="card-title">Responsive Preview</div>
			<div class="card-desc">Switch between desktop and mobile views instantly. Your emails look great on every screen size.</div>
		</div>
	</div>

	<div class="footer">
		<span>Built by <a href="https://axene.io" target="_blank" rel="noopener">Axene Solutions</a></span>
	</div>
</div>

<style>
	.landing {
		overflow-y: auto;
		flex: 1;
		background: #fff;
	}
	.hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 80px 24px 0;
		text-align: center;
	}
	.logo {
		margin-bottom: 20px;
	}
	.headline {
		font-size: 32px;
		font-weight: 700;
		color: #111;
		margin: 0 0 12px;
		font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif;
	}
	.subtitle {
		font-size: 15px;
		color: #6b7280;
		max-width: 480px;
		margin: 0 auto 28px;
		line-height: 1.6;
		font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif;
	}
	.cta-row {
		display: flex;
		gap: 12px;
	}
	.btn-primary {
		background: #1daa82;
		color: #fff;
		border-radius: 8px;
		padding: 12px 24px;
		font-weight: 600;
		font-size: 14px;
		text-decoration: none;
		font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif;
		transition: background 0.15s;
	}
	.btn-primary:hover {
		background: #189e78;
	}
	.btn-secondary {
		border: 1px solid #e0e0e0;
		color: #555;
		border-radius: 8px;
		padding: 12px 24px;
		font-size: 14px;
		text-decoration: none;
		font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif;
		transition: border-color 0.15s, background 0.15s;
	}
	.btn-secondary:hover {
		background: #fafafa;
		border-color: #ccc;
	}
	.features {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 20px;
		max-width: 800px;
		margin: 60px auto 0;
		padding: 0 24px;
	}
	.card {
		background: #fff;
		border: 1px solid #ebebeb;
		border-radius: 12px;
		padding: 24px;
	}
	.card-icon {
		margin-bottom: 14px;
	}
	.card-title {
		font-size: 14px;
		font-weight: 600;
		color: #111;
		margin-bottom: 6px;
		font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif;
	}
	.card-desc {
		font-size: 13px;
		color: #888;
		line-height: 1.5;
		font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif;
	}
	.footer {
		text-align: center;
		padding: 40px 24px;
		border-top: 1px solid #f0f0f0;
		margin-top: 60px;
		font-size: 13px;
		color: #bbb;
		font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif;
	}
	.footer a {
		color: #bbb;
		text-decoration: underline;
	}
	.footer a:hover {
		color: #999;
	}
</style>
