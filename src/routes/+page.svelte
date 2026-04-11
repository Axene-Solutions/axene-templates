<script lang="ts">
	import { onMount } from 'svelte';

	onMount(async () => {
		const ScrollReveal = (await import('scrollreveal')).default;
		const sr = ScrollReveal({
			distance: '40px',
			duration: 1000,
			easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
			opacity: 0,
			reset: false,
		});
		sr.reveal('.sr-hero', { origin: 'bottom', interval: 150, delay: 100 });
		sr.reveal('.sr-mockup', { origin: 'bottom', distance: '80px', delay: 500, duration: 1200 });
		sr.reveal('.sr-bottom', { origin: 'bottom', distance: '50px', viewFactor: 0.2 });
		sr.reveal('.sr-card', { origin: 'bottom', interval: 150, viewFactor: 0.2, distance: '30px' });
		sr.reveal('.sr-step', { origin: 'bottom', interval: 200, viewFactor: 0.2, distance: '40px', scale: 0.95 });
	});
</script>

<svelte:head>
	<title>Axene Templates - Visual Email Builder</title>
</svelte:head>

<div class="landing">
	<!-- Nav -->
	<nav class="nav">
		<div class="nav-inner">
			<a href="/" class="nav-brand">
				<div class="nav-logo">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
				</div>
				Axene
			</a>
			<div class="nav-links">
				<a href="#features">Features</a>
				<a href="#how-it-works">How it Works</a>
				<a href="#templates">Templates</a>
			</div>
			<a href="/editor" class="nav-cta">Open Editor</a>
		</div>
	</nav>

	<!-- Hero -->
	<section class="hero">
		<div class="hero-grid"></div>
		<div class="hero-glow"></div>
		<div class="hero-content">
			<div class="hero-badge sr-hero">
				<span class="badge-dot"></span>
				Visual Email Builder
			</div>
			<h1 class="sr-hero">Design emails that <br/><span class="muted">land in inboxes.</span></h1>
			<p class="hero-sub sr-hero">Build responsive email templates with a drag-and-drop editor. Powered by MJML for pixel-perfect rendering across every email client.</p>
			<div class="hero-actions sr-hero">
				<a href="/editor" class="btn-primary">Start building for free</a>
				<a href="/templates" class="btn-secondary">Browse templates</a>
			</div>

			<!-- App mockup -->
			<div class="mockup sr-mockup">
				<div class="mockup-header">
					<div class="mockup-dot"></div>
					<div class="mockup-dot"></div>
					<div class="mockup-dot"></div>
					<span class="mockup-url">axene-templates.app</span>
				</div>
				<div class="mockup-body">
					<!-- Sidebar -->
					<div class="mockup-sidebar">
						<div class="mockup-label">Content Blocks</div>
						<div class="mockup-blocks">
							<div class="mockup-block">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
								<span>Heading</span>
							</div>
							<div class="mockup-block">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
								<span>Image</span>
							</div>
							<div class="mockup-block active">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="8" width="18" height="8" rx="2"/></svg>
								<span>Button</span>
							</div>
							<div class="mockup-block">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
								<span>Text</span>
							</div>
						</div>
					</div>
					<!-- Canvas -->
					<div class="mockup-canvas">
						<div class="mockup-email">
							<div class="me-logo-bar"><div class="me-logo-circle"></div></div>
							<div class="me-lines"><div class="me-line w75"></div><div class="me-line w50"></div></div>
							<div class="me-lines-sm"><div class="me-line-sm"></div><div class="me-line-sm"></div><div class="me-line-sm w80"></div></div>
							<div class="me-img-placeholder">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
							</div>
							<div class="me-btn-bar"><div class="me-btn"></div></div>
						</div>
					</div>
					<!-- Right panel -->
					<div class="mockup-right">
						<div class="mockup-label">Settings</div>
						<div class="mr-field">
							<span class="mr-label">Background</span>
							<div class="mr-color-row"><div class="mr-swatch"></div><span class="mr-hex">#FFFFFF</span></div>
						</div>
						<div class="mr-field">
							<span class="mr-label">Padding</span>
							<div class="mr-slider"><div class="mr-track"><div class="mr-fill"></div></div></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Features -->
	<section id="features" class="section-white">
		<div class="container">
			<div class="sr-bottom">
				<h2>Everything you need<span class="accent">.</span></h2>
				<p class="section-sub">A complete toolkit for designing production-ready email templates, from first draft to final send.</p>
			</div>
			<div class="bento-grid">
				<!-- Large card -->
				<div class="bento-card bento-large dark sr-card">
					<div class="bento-glow"></div>
					<div class="bento-icon glass"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></div>
					<h3>MJML Rendering</h3>
					<p>Production-ready HTML compiled from MJML. Works perfectly in Gmail, Outlook, Apple Mail, and every other client on the market.</p>
				</div>
				<div class="bento-card green sr-card">
					<div class="bento-icon white-shadow"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg></div>
					<h3>Drag and Drop</h3>
					<p>Add headings, buttons, images, tables, and more. Reorder blocks with simple, intuitive move controls.</p>
				</div>
				<div class="bento-card bordered sr-card">
					<div class="bento-icon bordered-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
					<h3>Theme System</h3>
					<p>Set your brand color once. It cascades to buttons, links, and accents across the entire template instantly.</p>
				</div>
				<div class="bento-card bento-wide bordered sr-card">
					<div class="bento-icon bordered-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div>
					<h3>Responsive Preview</h3>
					<p>Switch between desktop and mobile views instantly. Rest assured your emails look perfectly proportional on every screen size.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- How it works -->
	<section id="how-it-works" class="section-alt">
		<div class="container">
			<div class="text-center sr-bottom">
				<span class="eyebrow-green">Process</span>
				<h2>Three steps to a perfect email.</h2>
			</div>
			<div class="steps-row">
				<div class="steps-line"></div>
				<div class="step-card sr-step">
					<div class="step-num">1</div>
					<h4>Pick a template</h4>
					<p>Start from a pre-built starter template or create a blank canvas. Welcome emails, newsletters, invoices, and more.</p>
				</div>
				<div class="step-card sr-step">
					<div class="step-num">2</div>
					<h4>Customize everything</h4>
					<p>Add blocks, change colors, edit text, set your brand logo. The right panel gives you full control over every detail.</p>
				</div>
				<div class="step-card sr-step">
					<div class="step-num">3</div>
					<h4>Export and send</h4>
					<p>Copy the compiled HTML or download it. Use it in Axene Mailer, your ESP, or any email-sending platform instantly.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Templates preview -->
	<section id="templates" class="section-white">
		<div class="container">
			<div class="text-center sr-bottom">
				<span class="eyebrow-green">Templates</span>
				<h2>Start with a starter template<span class="accent">.</span></h2>
				<p class="section-sub" style="margin-left:auto;margin-right:auto;">Pre-built layouts for common email types. Customize the colors, content, and branding to match your business.</p>
			</div>
			<div class="tpl-grid">
				<div class="tpl-card sr-card"><div class="tpl-thumb" style="background:linear-gradient(135deg,#1daa82,#0d8f62)"></div><div class="tpl-info"><span class="tpl-name">Welcome Email</span><span class="tpl-desc">Greet new users and get them started</span></div></div>
				<div class="tpl-card sr-card"><div class="tpl-thumb" style="background:linear-gradient(135deg,#6366f1,#4f46e5)"></div><div class="tpl-info"><span class="tpl-name">Email Verification</span><span class="tpl-desc">Confirm addresses with one-click</span></div></div>
				<div class="tpl-card sr-card"><div class="tpl-thumb" style="background:linear-gradient(135deg,#0ea5e9,#0284c7)"></div><div class="tpl-info"><span class="tpl-name">Newsletter</span><span class="tpl-desc">Clean layout with image and CTA</span></div></div>
				<div class="tpl-card sr-card"><div class="tpl-thumb" style="background:linear-gradient(135deg,#f59e0b,#d97706)"></div><div class="tpl-info"><span class="tpl-name">Invoice / Receipt</span><span class="tpl-desc">Payment confirmation with table</span></div></div>
				<div class="tpl-card sr-card"><div class="tpl-thumb" style="background:linear-gradient(135deg,#ef4444,#dc2626)"></div><div class="tpl-info"><span class="tpl-name">Password Reset</span><span class="tpl-desc">Secure link with expiry notice</span></div></div>
				<div class="tpl-card sr-card"><div class="tpl-thumb" style="background:linear-gradient(135deg,#6b7280,#4b5563)"></div><div class="tpl-info"><span class="tpl-name">Blank Template</span><span class="tpl-desc">Start from scratch</span></div></div>
			</div>
			<div class="text-center" style="margin-top:32px;">
				<a href="/templates" class="btn-secondary">Browse all templates</a>
			</div>
		</div>
	</section>

	<!-- CTA -->
	<section class="section-cta">
		<div class="cta-glow-l"></div>
		<div class="cta-glow-r"></div>
		<div class="container text-center sr-bottom" style="position:relative;z-index:1;">
			<h2 class="cta-h2">Start designing today<span class="accent">.</span></h2>
			<p class="cta-sub">Free to use. No account needed. Build your first responsive email in minutes and see the difference.</p>
			<a href="/editor" class="btn-dark">Open the editor now</a>
		</div>
	</section>

	<!-- Footer -->
	<footer class="page-footer">
		<p>Built by <a href="https://axene.io" target="_blank" rel="noopener">Axene Solutions</a></p>
	</footer>
</div>

<style>
	.landing { overflow-y: auto; background: #fafaf9; font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif; color: #1e293b; }
	.text-center { text-align: center; }
	.container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
	.accent { color: #1daa82; }
	.muted { color: #94a3b8; }

	/* ---- Nav ---- */
	.nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; background: rgba(255,255,255,0.8); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(226,232,240,0.5); }
	.nav-inner { max-width: 1100px; margin: 0 auto; padding: 0 24px; height: 56px; display: flex; align-items: center; justify-content: space-between; }
	.nav-brand { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 16px; color: #0f172a; text-decoration: none; letter-spacing: -0.3px; }
	.nav-logo { width: 24px; height: 24px; border-radius: 5px; background: #1daa82; display: flex; align-items: center; justify-content: center; }
	.nav-links { display: flex; gap: 28px; font-size: 14px; font-weight: 500; color: #64748b; }
	.nav-links a { text-decoration: none; color: inherit; transition: color 0.15s; }
	.nav-links a:hover { color: #0f172a; }
	.nav-cta { display: inline-flex; align-items: center; padding: 8px 18px; font-size: 13px; font-weight: 600; color: #fff; background: #0f172a; border-radius: 100px; text-decoration: none; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
	.nav-cta:hover { background: #1e293b; transform: scale(1.03); }

	/* ---- Hero ---- */
	.hero { position: relative; padding: 120px 24px 80px; overflow: hidden; text-align: center; }
	.hero-grid { position: absolute; inset: 0; background-size: 40px 40px; background-image: linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px); mask-image: linear-gradient(to bottom, black 20%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 20%, transparent 100%); }
	.hero-glow { position: absolute; top: -100px; left: 50%; transform: translateX(-50%); width: 800px; height: 400px; background: rgba(29,170,130,0.1); border-radius: 50%; filter: blur(100px); }
	.hero-content { position: relative; z-index: 1; max-width: 1100px; margin: 0 auto; }
	.hero-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 100px; background: #fff; border: 1px solid #e2e8f0; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #475569; margin-bottom: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
	.badge-dot { width: 8px; height: 8px; border-radius: 50%; background: #1daa82; animation: pulse 2s ease infinite; }
	@keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }
	.hero h1 { font-size: clamp(36px, 5.5vw, 64px); font-weight: 800; letter-spacing: -2.5px; line-height: 1.08; color: #0f172a; margin: 0 0 20px; }
	.hero-sub { font-size: 18px; color: #64748b; line-height: 1.7; max-width: 520px; margin: 0 auto 32px; }
	.hero-actions { display: flex; flex-wrap: wrap; gap: 14px; justify-content: center; }

	/* ---- Buttons ---- */
	.btn-primary { display: inline-flex; align-items: center; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #fff; background: #1daa82; border-radius: 100px; text-decoration: none; transition: all 0.2s; box-shadow: 0 8px 24px rgba(29,170,130,0.25); }
	.btn-primary:hover { background: #168a69; transform: translateY(-2px); }
	.btn-secondary { display: inline-flex; align-items: center; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #475569; background: #fff; border: 1px solid #e2e8f0; border-radius: 100px; text-decoration: none; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
	.btn-secondary:hover { background: #f8fafc; transform: translateY(-2px); }
	.btn-dark { display: inline-flex; align-items: center; padding: 16px 40px; font-size: 17px; font-weight: 700; color: #fff; background: #0f172a; border-radius: 100px; text-decoration: none; transition: all 0.2s; box-shadow: 0 12px 32px rgba(15,23,42,0.2); }
	.btn-dark:hover { background: #1daa82; transform: scale(1.03); }

	/* ---- Mockup ---- */
	.mockup { margin-top: 60px; max-width: 960px; margin-left: auto; margin-right: auto; border-radius: 16px; border: 1px solid rgba(226,232,240,0.6); background: #fff; box-shadow: 0 25px 60px rgba(148,163,184,0.2); overflow: hidden; }
	.mockup-header { height: 44px; border-bottom: 1px solid #f1f5f9; background: #f8fafc; display: flex; align-items: center; padding: 0 16px; gap: 8px; }
	.mockup-dot { width: 10px; height: 10px; border-radius: 50%; background: #e2e8f0; }
	.mockup-url { flex: 1; text-align: center; font-size: 12px; color: #94a3b8; margin-right: 40px; }
	.mockup-body { display: flex; height: 400px; }
	.mockup-sidebar { width: 200px; border-right: 1px solid #f1f5f9; padding: 16px; overflow: hidden; }
	.mockup-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 12px; }
	.mockup-blocks { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
	.mockup-block { aspect-ratio: 1; border-radius: 10px; border: 1px solid #e2e8f0; background: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; color: #64748b; font-size: 10px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
	.mockup-block:hover, .mockup-block.active { border-color: #1daa82; color: #1daa82; }
	.mockup-canvas { flex: 1; background: rgba(241,245,249,0.5); padding: 28px; display: flex; justify-content: center; overflow: hidden; }
	.mockup-email { width: 100%; max-width: 300px; background: #fff; border-radius: 12px; border: 1px solid rgba(226,232,240,0.6); padding: 28px; display: flex; flex-direction: column; gap: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
	.me-logo-bar { display: flex; justify-content: center; padding-bottom: 8px; }
	.me-logo-circle { width: 36px; height: 36px; border-radius: 50%; background: #1daa82; }
	.me-lines { display: flex; flex-direction: column; gap: 8px; }
	.me-line { height: 8px; background: #0f172a; border-radius: 4px; }
	.me-line.w75 { width: 75%; }
	.me-line.w50 { width: 50%; }
	.me-lines-sm { display: flex; flex-direction: column; gap: 6px; }
	.me-line-sm { height: 3px; background: #e2e8f0; border-radius: 2px; width: 100%; }
	.me-line-sm.w80 { width: 80%; }
	.me-img-placeholder { aspect-ratio: 16/9; background: #edf8f4; border: 2px dashed #a7e4d0; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #86cfb1; }
	.me-btn-bar { display: flex; justify-content: center; padding-top: 4px; }
	.me-btn { width: 110px; height: 36px; border-radius: 100px; background: #1daa82; }
	.mockup-right { width: 200px; border-left: 1px solid #f1f5f9; padding: 20px; }
	.mr-field { margin-bottom: 20px; }
	.mr-label { font-size: 11px; font-weight: 600; color: #475569; display: block; margin-bottom: 8px; }
	.mr-color-row { display: flex; align-items: center; gap: 8px; }
	.mr-swatch { width: 28px; height: 28px; border-radius: 50%; background: #fff; border: 2px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
	.mr-hex { font-size: 12px; font-family: monospace; color: #64748b; }
	.mr-slider { margin-top: 4px; }
	.mr-track { height: 6px; background: #e2e8f0; border-radius: 3px; position: relative; }
	.mr-fill { position: absolute; left: 0; top: 0; height: 100%; width: 60%; background: #1daa82; border-radius: 3px; }

	/* ---- Sections ---- */
	.section-white { padding: 96px 0; background: #fff; }
	.section-alt { padding: 96px 0; background: #f8fafc; border-top: 1px solid rgba(226,232,240,0.6); border-bottom: 1px solid rgba(226,232,240,0.6); }
	.section-sub { font-size: 17px; color: #64748b; max-width: 540px; margin: 0 0 48px; line-height: 1.6; }
	h2 { font-size: clamp(26px, 3.5vw, 38px); font-weight: 800; letter-spacing: -1.5px; line-height: 1.1; color: #0f172a; margin: 0 0 14px; }
	.eyebrow-green { display: block; font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #1daa82; margin-bottom: 10px; }

	/* ---- Bento grid ---- */
	.bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
	.bento-card { border-radius: 24px; padding: 32px; }
	.bento-card h3 { font-size: 20px; font-weight: 700; margin: 0 0 10px; }
	.bento-card p { font-size: 15px; line-height: 1.6; margin: 0; }
	.bento-large { grid-column: span 2; }
	.bento-wide { grid-column: span 2; }
	.dark { background: #0f172a; color: #fff; position: relative; overflow: hidden; }
	.dark p { color: #94a3b8; }
	.dark h3 { color: #fff; }
	.bento-glow { position: absolute; top: -40px; right: -40px; width: 250px; height: 250px; background: #1daa82; border-radius: 50%; filter: blur(80px); opacity: 0.35; }
	.green { background: #edf8f4; border: 1px solid #d1efe6; }
	.green h3 { color: #0f172a; }
	.green p { color: #475569; }
	.bordered { background: #fff; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
	.bordered h3 { color: #0f172a; }
	.bordered p { color: #475569; }
	.bento-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
	.glass { background: rgba(255,255,255,0.1); backdrop-filter: blur(8px); color: #fff; }
	.white-shadow { background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.06); color: #1daa82; }
	.bordered-icon { background: #f8fafc; border: 1px solid #f1f5f9; color: #475569; }

	/* ---- Steps ---- */
	.steps-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; position: relative; margin-top: 48px; }
	.steps-line { display: none; position: absolute; top: 48px; left: 15%; right: 15%; height: 2px; background: #e2e8f0; z-index: 0; }
	.step-card { position: relative; z-index: 1; text-align: center; }
	.step-num { width: 80px; height: 80px; margin: 0 auto 20px; background: #fff; border-radius: 50%; border: 4px solid #f8fafc; box-shadow: 0 8px 24px rgba(0,0,0,0.08); display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; color: #1daa82; }
	.step-card h4 { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 10px; }
	.step-card p { font-size: 14px; color: #64748b; line-height: 1.6; }

	/* ---- Template grid ---- */
	.tpl-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
	.tpl-card { border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; background: #fff; transition: all 0.2s; cursor: pointer; }
	.tpl-card:hover { border-color: #1daa82; box-shadow: 0 8px 24px rgba(29,170,130,0.1); transform: translateY(-3px); }
	.tpl-thumb { height: 100px; }
	.tpl-info { padding: 14px 16px; }
	.tpl-name { display: block; font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 4px; }
	.tpl-desc { font-size: 12px; color: #94a3b8; }

	/* ---- CTA ---- */
	.section-cta { padding: 120px 24px; background: #fff; position: relative; overflow: hidden; }
	.cta-glow-l { position: absolute; left: -80px; bottom: -80px; width: 280px; height: 280px; background: #edf8f4; border-radius: 50%; filter: blur(60px); opacity: 0.6; }
	.cta-glow-r { position: absolute; right: -80px; top: -80px; width: 360px; height: 360px; background: #edf8f4; border-radius: 50%; filter: blur(60px); opacity: 0.5; }
	.cta-h2 { font-size: clamp(30px, 4vw, 46px); }
	.cta-sub { font-size: 18px; color: #64748b; max-width: 500px; margin: 0 auto 32px; line-height: 1.6; }

	/* ---- Footer ---- */
	.page-footer { padding: 32px 24px; border-top: 1px solid #e2e8f0; background: #fff; text-align: center; font-size: 13px; color: #64748b; }
	.page-footer a { color: #1daa82; text-decoration: none; }
	.page-footer a:hover { color: #168a69; }

	/* ---- Responsive ---- */
	@media (max-width: 768px) {
		.bento-grid { grid-template-columns: 1fr; }
		.bento-large, .bento-wide { grid-column: span 1; }
		.steps-row { grid-template-columns: 1fr; }
		.tpl-grid { grid-template-columns: 1fr 1fr; }
		.mockup-sidebar, .mockup-right { display: none; }
		.nav-links { display: none; }
	}
</style>
