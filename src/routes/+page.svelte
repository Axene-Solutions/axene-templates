<script lang="ts">
</script>

<svelte:head>
	<title>Axene Templates - Visual Email Builder</title>
</svelte:head>

<div class="landing">
	<!-- Hero -->
	<section class="hero">
		<span class="eyebrow">
			<span class="dot"></span>
			Visual Email Builder
		</span>
		<h1>Design emails that<br /><span class="muted">land in inboxes.</span></h1>
		<p class="hero-sub">
			Build responsive email templates with a drag-and-drop editor.
			Powered by MJML for pixel-perfect rendering across every email client.
		</p>
		<div class="hero-actions">
			<a href="/editor" class="btn-primary">Start building</a>
			<a href="/templates" class="btn-ghost">Browse templates</a>
		</div>
	</section>

	<!-- Features -->
	<section class="section">
		<span class="eyebrow">Features</span>
		<h2>Everything you need<span class="accent">.</span></h2>
		<p class="section-sub">A complete toolkit for designing production-ready email templates, from first draft to final send.</p>

		<div class="features-grid">
			<div class="feature-card">
				<div class="feature-icon">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
					</svg>
				</div>
				<h3>MJML Rendering</h3>
				<p>Production-ready HTML compiled from MJML. Works in Gmail, Outlook, Apple Mail, and every other client.</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
					</svg>
				</div>
				<h3>Drag and Drop</h3>
				<p>Add headings, buttons, images, tables, and more. Reorder blocks with simple move controls.</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
					</svg>
				</div>
				<h3>Theme System</h3>
				<p>Set a brand color once in the header. It cascades to buttons, links, and accents across the entire template.</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
					</svg>
				</div>
				<h3>Responsive Preview</h3>
				<p>Switch between desktop and mobile views instantly. Your emails look great on every screen size.</p>
			</div>
		</div>
	</section>

	<!-- How it works -->
	<section class="section section-alt">
		<span class="eyebrow">How it works</span>
		<h2>Three steps to a perfect email<span class="accent">.</span></h2>
		<div class="steps-grid">
			<div class="step">
				<span class="step-num">01</span>
				<h4>Pick a template</h4>
				<p>Start from a pre-built starter template or create a blank canvas. Welcome emails, newsletters, invoices, and more.</p>
			</div>
			<div class="step">
				<span class="step-num">02</span>
				<h4>Customize everything</h4>
				<p>Add blocks, change colors, edit text, set your brand logo. The right panel gives you full control over every detail.</p>
			</div>
			<div class="step">
				<span class="step-num">03</span>
				<h4>Export and send</h4>
				<p>Copy the compiled HTML or download it. Use it in Axene Mailer, your ESP, or any email-sending platform.</p>
			</div>
		</div>
	</section>

	<!-- CTA -->
	<section class="section cta-section">
		<h2>Start designing today<span class="accent">.</span></h2>
		<p class="cta-sub">Free to use. No account needed. Build your first email in minutes.</p>
		<a href="/editor" class="btn-primary btn-lg">Open the editor</a>
	</section>

	<!-- Footer -->
	<footer class="landing-footer">
		<span>Built by <a href="https://axene.io" target="_blank" rel="noopener">Axene Solutions</a></span>
	</footer>
</div>

<style>
	.landing {
		overflow-y: auto;
		flex: 1;
		background: #fff;
		font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif;
	}

	/* ---- Eyebrow ---- */
	.eyebrow {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: #999;
		margin-bottom: 14px;
	}
	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #1daa82;
	}
	.accent { color: #1daa82; }

	/* ---- Hero ---- */
	.hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 80px 32px 60px;
	}
	.hero h1 {
		font-size: clamp(28px, 4vw, 44px);
		font-weight: 800;
		letter-spacing: -2px;
		line-height: 1.08;
		color: #111;
		margin: 0 0 18px;
	}
	.hero h1 .muted { color: #999; }
	.hero-sub {
		font-size: 15px;
		color: #888;
		line-height: 1.7;
		max-width: 440px;
		margin: 0 0 30px;
	}
	.hero-actions {
		display: flex;
		gap: 12px;
		align-items: center;
	}

	/* ---- Buttons ---- */
	.btn-primary {
		display: inline-block;
		background: #1daa82;
		color: #fff;
		font-weight: 700;
		font-size: 13px;
		padding: 12px 28px;
		border-radius: 100px;
		text-decoration: none;
		transition: all 0.2s;
	}
	.btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }
	.btn-primary.btn-lg { font-size: 15px; padding: 14px 36px; }
	.btn-ghost {
		display: inline-block;
		font-weight: 600;
		font-size: 13px;
		padding: 12px 20px;
		color: #888;
		text-decoration: none;
		transition: color 0.2s;
	}
	.btn-ghost:hover { color: #1daa82; }

	/* ---- Sections ---- */
	.section {
		padding: 80px 32px;
		max-width: 900px;
		margin: 0 auto;
	}
	.section-alt {
		background: #fafaf8;
		max-width: none;
		border-top: 1px solid rgba(0,0,0,0.04);
		border-bottom: 1px solid rgba(0,0,0,0.04);
	}
	.section-alt .eyebrow,
	.section-alt h2,
	.section-alt .steps-grid {
		max-width: 900px;
		margin-left: auto;
		margin-right: auto;
	}
	.section h2 {
		font-size: clamp(22px, 3vw, 34px);
		font-weight: 800;
		letter-spacing: -1.5px;
		line-height: 1.1;
		color: #111;
		margin: 0 0 12px;
	}
	.section-sub {
		font-size: 14px;
		color: #888;
		line-height: 1.7;
		max-width: 440px;
		margin: 0 0 40px;
	}

	/* ---- Features grid ---- */
	.features-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1px;
		background: rgba(0,0,0,0.05);
		border: 1px solid rgba(0,0,0,0.05);
		border-radius: 14px;
		overflow: hidden;
	}
	.feature-card {
		padding: 28px 22px;
		background: #fff;
	}
	.feature-icon {
		width: 36px;
		height: 36px;
		border-radius: 10px;
		background: #edf8f4;
		color: #1daa82;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 14px;
	}
	.feature-card h3 {
		font-size: 14px;
		font-weight: 700;
		color: #111;
		margin: 0 0 8px;
	}
	.feature-card p {
		font-size: 12.5px;
		color: #888;
		line-height: 1.6;
		margin: 0;
	}

	/* ---- Steps ---- */
	.steps-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1px;
		background: rgba(0,0,0,0.05);
		border: 1px solid rgba(0,0,0,0.05);
		border-radius: 14px;
		overflow: hidden;
		margin-top: 40px;
	}
	.step {
		padding: 28px 22px;
		background: #fff;
	}
	.step-num {
		font-size: 28px;
		font-weight: 800;
		color: #1daa82;
		opacity: 0.3;
		letter-spacing: -1px;
		display: block;
		margin-bottom: 12px;
	}
	.step h4 {
		font-size: 14px;
		font-weight: 700;
		color: #111;
		margin: 0 0 8px;
	}
	.step p {
		font-size: 12.5px;
		color: #888;
		line-height: 1.6;
		margin: 0;
	}

	/* ---- CTA ---- */
	.cta-section {
		text-align: center;
		max-width: none;
	}
	.cta-section h2 {
		font-size: clamp(24px, 3.5vw, 38px);
	}
	.cta-sub {
		font-size: 15px;
		color: #888;
		line-height: 1.7;
		margin: 0 auto 24px;
		max-width: 380px;
	}

	/* ---- Footer ---- */
	.landing-footer {
		text-align: center;
		padding: 32px;
		font-size: 12px;
		color: #ccc;
	}
	.landing-footer a { color: #ccc; text-decoration: underline; }
	.landing-footer a:hover { color: #999; }

	/* ---- Responsive ---- */
	@media (max-width: 700px) {
		.features-grid { grid-template-columns: 1fr; }
		.steps-grid { grid-template-columns: 1fr; }
	}
</style>
