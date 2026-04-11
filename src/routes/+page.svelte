<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import SiteNav from '$lib/components/SiteNav.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';

	const user = $derived(page.data.user);
	let mounted = $state(false);
	const NUM_BARS = 18;

	function barHeight(i: number): number {
		const pos = i / (NUM_BARS - 1);
		const dist = Math.abs(pos - 0.5);
		return 30 + 70 * Math.pow(dist * 2, 1.2);
	}

	onMount(async () => {
		mounted = true;
		const ScrollReveal = (await import('scrollreveal')).default;
		const sr = ScrollReveal({ distance: '40px', duration: 1000, easing: 'cubic-bezier(0.25,0.1,0.25,1)', opacity: 0, reset: false });
		sr.reveal('.sr-hero', { origin: 'bottom', interval: 150, delay: 100 });
		sr.reveal('.sr-mockup', { origin: 'bottom', distance: '80px', delay: 500, duration: 1200 });
		sr.reveal('.sr-bottom', { origin: 'bottom', distance: '50px', viewFactor: 0.2 });
		sr.reveal('.sr-card', { origin: 'bottom', interval: 150, viewFactor: 0.2, distance: '30px' });
		sr.reveal('.sr-step', { origin: 'bottom', interval: 200, viewFactor: 0.2, distance: '40px', scale: 0.95 });
	});
</script>

<svelte:head>
	<title>Axene Templates - Visual Email Builder</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Playwrite+IE:wght@100..400&display=swap" rel="stylesheet">
</svelte:head>

<div class="landing">

	<SiteNav {user} />

	<!-- ══════ HERO ══════ -->
	<section class="hero">
		<div class="hero-bg">
			<!-- Gradient bars filling left-to-right -->
			{#each Array(NUM_BARS) as _, i}
				<div
					class="bar"
					style="flex:1;transform:scaleY({barHeight(i)/100});animation-delay:{i * 0.1}s"
				></div>
			{/each}
		</div>

		<div class="hero-content">
			<div class="hero-badge sr-hero">
				<span class="badge-dot"></span>
				Visual Email Builder
			</div>

			<h1 class="sr-hero">
				<span class="h1-line1">Design Emails That Convert,</span>
				<span class="h1-line2">One Template at a Time.</span>
			</h1>

			<p class="hero-sub sr-hero">Build responsive email templates with a drag-and-drop editor. Powered by MJML for pixel-perfect rendering across every client.</p>

			<div class="hero-actions sr-hero">
				<a href="/editor" class="btn-primary">Start building for free</a>
				<a href="/templates" class="btn-ghost">Browse templates</a>
			</div>
		</div>
	</section>

	<!-- ══════ FEATURES ══════ -->
	<section id="features" class="section-dark">
		<div class="container">
			<div class="sr-bottom">
				<span class="eyebrow">Features</span>
				<h2>Everything you need<span class="accent">.</span></h2>
				<p class="section-sub">A complete toolkit for designing production-ready email templates.</p>
			</div>

			<div class="bento">
				<div class="bento-card bento-large sr-card">
					<div class="bento-glow"></div>
					<div class="bc-icon glass">
						<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
					</div>
					<h3>MJML Rendering</h3>
					<p>Production-ready HTML compiled from MJML. Works in Gmail, Outlook, Apple Mail, and every other client.</p>
				</div>
				<div class="bento-card bento-green sr-card">
					<div class="bc-icon green-icon">
						<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
					</div>
					<h3>Drag and Drop</h3>
					<p>Add headings, buttons, images, tables, and more. Reorder blocks with simple move controls.</p>
				</div>
				<div class="bento-card sr-card">
					<div class="bc-icon">
						<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
					</div>
					<h3>Theme System</h3>
					<p>Set a brand color once. It cascades to buttons, links, and accents across the entire template.</p>
				</div>
				<div class="bento-card bento-wide sr-card">
					<div class="bc-icon">
						<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
					</div>
					<h3>Responsive Preview</h3>
					<p>Switch between desktop and mobile views instantly. Your emails look great on every screen size.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- ══════ MARQUEE ══════ -->
	<section class="marquee-section">
		<div class="container text-center sr-bottom">
			<h2>Solve every email challenge<span class="accent">.</span></h2>
			<p class="section-sub" style="margin-left:auto;margin-right:auto;">From transactional to marketing, our templates handle every use case your business needs.</p>
		</div>
		<div class="marquee-wrap">
			<div class="marquee-fade-l"></div>
			<div class="marquee-fade-r"></div>
			<div class="marquee-track row1">
				<span class="marquee-badge">How do I verify new user emails?</span>
				<span class="marquee-badge">What makes a good welcome email?</span>
				<span class="marquee-badge">How do I send password reset links?</span>
				<span class="marquee-badge">What layout works for newsletters?</span>
				<span class="marquee-badge">How do I verify new user emails?</span>
				<span class="marquee-badge">What makes a good welcome email?</span>
				<span class="marquee-badge">How do I send password reset links?</span>
				<span class="marquee-badge">What layout works for newsletters?</span>
			</div>
			<div class="marquee-track row2">
				<span class="marquee-badge">How do I format invoice receipts?</span>
				<span class="marquee-badge">Do my emails render in Outlook?</span>
				<span class="marquee-badge">How do I add an unsubscribe link?</span>
				<span class="marquee-badge">What's the best button color?</span>
				<span class="marquee-badge">How do I format invoice receipts?</span>
				<span class="marquee-badge">Do my emails render in Outlook?</span>
				<span class="marquee-badge">How do I add an unsubscribe link?</span>
				<span class="marquee-badge">What's the best button color?</span>
			</div>
			<div class="marquee-track row3">
				<span class="marquee-badge">How do I set up DKIM and SPF?</span>
				<span class="marquee-badge">Can I preview on mobile and desktop?</span>
				<span class="marquee-badge">How do I track open rates?</span>
				<span class="marquee-badge">What image sizes work best?</span>
				<span class="marquee-badge">How do I set up DKIM and SPF?</span>
				<span class="marquee-badge">Can I preview on mobile and desktop?</span>
				<span class="marquee-badge">How do I track open rates?</span>
				<span class="marquee-badge">What image sizes work best?</span>
			</div>
		</div>

		<!-- Feature strip (dashed border grid, 4 cols) -->
		<div class="feature-strip">
			<div class="fs-card sr-card">
				<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" class="fs-icon"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
				<h3>Clean HTML output</h3>
				<p>Every template compiles to production-ready, table-based HTML that passes validation in all major clients.</p>
			</div>
			<div class="fs-card sr-card">
				<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" class="fs-icon"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
				<h3>Image-first design</h3>
				<p>Drop in images, logos, and banners. They resize responsively and fall back gracefully when blocked.</p>
			</div>
			<div class="fs-card sr-card">
				<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" class="fs-icon"><path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"/><path d="M19.6 10.4L18.5 7.7L20 6L18 4L16.3 5.5L13.6 4.4L12.9 2H11L10.3 4.4L7.7 5.5L6 4L4 6L5.5 7.8L4.4 10.4L2 11V13L4.4 13.7L5.5 16.3L4 18L6 20L7.8 18.5L10.4 19.6L11 22H13L13.6 19.6L16.3 18.5C16.7 18.8 18 20 18 20L20 18L18.5 16.2L19.6 13.6L22 13V11L19.6 10.4Z"/></svg>
				<h3>Full customization</h3>
				<p>Every pixel is adjustable. Colors, padding, fonts, border radius, alignment - all editable in real time.</p>
			</div>
			<div class="fs-card sr-card">
				<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" class="fs-icon"><path d="M7 12L12 15.5L17 12"/><path d="M2 20V9.13C2 8.43 2.37 7.78 2.97 7.42L10.97 2.62C11.6 2.24 12.4 2.24 13.03 2.62L21.03 7.42C21.63 7.78 22 8.43 22 9.13V20C22 21.1 21.1 22 20 22H4C2.9 22 2 21.1 2 20Z"/></svg>
				<h3>Ready to send</h3>
				<p>Export compiled HTML and use it with Axene Mailer, SendGrid, Mailchimp, or any ESP. Copy, paste, done.</p>
			</div>
		</div>
	</section>

	<!-- ══════ HOW IT WORKS ══════ -->
	<section id="how-it-works" class="section-darker">
		<div class="container">
			<div class="text-center sr-bottom">
				<span class="eyebrow">Process</span>
				<h2>Three steps to a perfect email.</h2>
			</div>
			<div class="steps">
				<div class="step sr-step">
					<div class="step-num">01</div>
					<h4>Pick a template</h4>
					<p>Start from a pre-built starter or create a blank canvas. Welcome emails, newsletters, invoices, and more.</p>
				</div>
				<div class="step sr-step">
					<div class="step-num">02</div>
					<h4>Customize everything</h4>
					<p>Add blocks, change colors, edit text, set your brand logo. Full control over every detail in the right panel.</p>
				</div>
				<div class="step sr-step">
					<div class="step-num">03</div>
					<h4>Export and send</h4>
					<p>Copy the compiled HTML or download it. Use it in Axene Mailer, your ESP, or any email platform.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- ══════ TEMPLATES ══════ -->
	<section id="templates" class="section-dark">
		<div class="container">
			<div class="text-center sr-bottom">
				<span class="eyebrow">Templates</span>
				<h2>Start with a template<span class="accent">.</span></h2>
				<p class="section-sub" style="margin-left:auto;margin-right:auto;">Pre-built layouts for common email types. Customize colors, content, and branding.</p>
			</div>
			<div class="tpl-grid">
				<a href="/templates" class="tpl-card sr-card">
					<div class="tpl-thumb">
						<div class="tpl-wire"><div class="tw-hdr"></div><div class="tw-bd"><div class="tw-ln w60"></div><div class="tw-ln w40 dim"></div><div class="tw-sp"></div><div class="tw-ls"></div><div class="tw-ls"></div><div class="tw-ls w70"></div><div class="tw-sp"></div><div class="tw-bt"></div></div></div>
						<span class="tpl-pill">Use</span>
					</div>
					<div class="tpl-info"><span class="tpl-name">Welcome Email</span><span class="tpl-desc">Greet new users and get them started</span></div>
				</a>
				<a href="/templates" class="tpl-card sr-card">
					<div class="tpl-thumb" style="--tpl-hue:240">
						<div class="tpl-wire"><div class="tw-hdr"></div><div class="tw-bd"><div class="tw-ln w50"></div><div class="tw-sp"></div><div class="tw-ls w80"></div><div class="tw-ls"></div><div class="tw-sp"></div><div class="tw-bt"></div><div class="tw-sp"></div><div class="tw-ls w60 dim"></div></div></div>
						<span class="tpl-pill">Use</span>
					</div>
					<div class="tpl-info"><span class="tpl-name">Email Verification</span><span class="tpl-desc">Confirm addresses with one-click</span></div>
				</a>
				<a href="/templates" class="tpl-card sr-card">
					<div class="tpl-thumb" style="--tpl-hue:200">
						<div class="tpl-wire"><div class="tw-hdr"></div><div class="tw-bd"><div class="tw-img"></div><div class="tw-ln w70"></div><div class="tw-ls"></div><div class="tw-ls w80"></div><div class="tw-bt" style="width:40%;margin:0"></div></div></div>
						<span class="tpl-pill">Use</span>
					</div>
					<div class="tpl-info"><span class="tpl-name">Newsletter</span><span class="tpl-desc">Clean layout with image and CTA</span></div>
				</a>
				<a href="/templates" class="tpl-card sr-card">
					<div class="tpl-thumb" style="--tpl-hue:38">
						<div class="tpl-wire"><div class="tw-hdr"></div><div class="tw-bd"><div class="tw-ln w50"></div><div class="tw-sp"></div><div class="tw-tr"><div class="tw-tc"></div><div class="tw-tc short"></div></div><div class="tw-tr"><div class="tw-tc"></div><div class="tw-tc short"></div></div><div class="tw-tr"><div class="tw-tc"></div><div class="tw-tc short"></div></div><div class="tw-sp"></div><div class="tw-bt"></div></div></div>
						<span class="tpl-pill">Use</span>
					</div>
					<div class="tpl-info"><span class="tpl-name">Invoice / Receipt</span><span class="tpl-desc">Payment confirmation with table</span></div>
				</a>
				<a href="/templates" class="tpl-card sr-card">
					<div class="tpl-thumb" style="--tpl-hue:0">
						<div class="tpl-wire"><div class="tw-hdr"></div><div class="tw-bd"><div class="tw-ln w60"></div><div class="tw-sp"></div><div class="tw-ls"></div><div class="tw-ls w80"></div><div class="tw-sp"></div><div class="tw-bt"></div><div class="tw-sp"></div><div class="tw-ls w70 dim"></div></div></div>
						<span class="tpl-pill">Use</span>
					</div>
					<div class="tpl-info"><span class="tpl-name">Password Reset</span><span class="tpl-desc">Secure link with expiry notice</span></div>
				</a>
				<a href="/templates" class="tpl-card sr-card">
					<div class="tpl-thumb" style="--tpl-hue:0;--tpl-sat:0%">
						<div class="tpl-wire"><div class="tw-hdr"></div><div class="tw-bd" style="display:flex;align-items:center;justify-content:center;flex:1"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div></div>
						<span class="tpl-pill">Use</span>
					</div>
					<div class="tpl-info"><span class="tpl-name">Blank Template</span><span class="tpl-desc">Start from scratch</span></div>
				</a>
			</div>
			<div class="text-center" style="margin-top:36px;">
				<a href="/templates" class="btn-ghost">Browse all templates</a>
			</div>
		</div>
	</section>

	<!-- ══════ CTA ══════ -->
	<section class="section-cta">
		<div class="container text-center sr-bottom">
			<h2 class="cta-h2">Start designing today<span class="accent">.</span></h2>
			<p class="cta-sub">Free to use. No account needed. Build your first email in minutes.</p>
			<a href="/editor" class="btn-primary btn-lg">Open the editor now</a>
		</div>
	</section>

	<SiteFooter />
</div>

<style>
	/* ═══════════════════════════════════════
	   BASE
	   ═══════════════════════════════════════ */
	.landing {
		overflow-y: auto;
		overflow-x: hidden;
		flex: 1;
		background: #101010;
		color: #e2e8f0;
		font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif;
	}
	.text-center { text-align: center; }
	.container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
	.accent { color: #FFD100; }


	/* ═══════════════════════════════════════
	   HERO
	   ═══════════════════════════════════════ */
	.hero {
		position: relative;
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 120px 24px 80px;
		overflow: hidden;
	}
	.hero-bg {
		position: absolute;
		inset: 0;
		display: flex;
		overflow: hidden;
		z-index: 0;
	}
	.bar {
		flex: 1;
		height: 100%;
		background: linear-gradient(to top, #FFD100, transparent);
		transform-origin: bottom;
		animation: pulseBar 3s ease-in-out infinite alternate;
		opacity: 0.5;
	}
	@keyframes pulseBar {
		0% { opacity: 0.35; }
		100% { opacity: 0.6; }
	}
	.hero-content {
		position: relative;
		z-index: 1;
		text-align: center;
		max-width: 800px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.hero-badge {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 6px 16px;
		backdrop-filter: blur(8px);
		border-top: 1px solid rgba(255,255,255,0.1);
		border-bottom: 1px solid rgba(255,255,255,0.1);
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		color: rgba(255,255,255,0.6);
		margin-bottom: 32px;
	}
	.badge-dot { width: 7px; height: 7px; border-radius: 50%; background: #FFD100; animation: pulse 2s ease infinite; }
	@keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(1.3); } }
	.hero h1 {
		margin: 0 0 24px;
		line-height: 1.1;
	}
	.h1-line1 {
		display: block;
		font-size: clamp(32px, 5.5vw, 58px);
		font-weight: 600;
		color: #fff;
		letter-spacing: -2px;
	}
	.h1-line2 {
		display: block;
		font-family: "Playwrite IE", cursive;
		font-size: clamp(24px, 4.5vw, 38px);
		color: #fff;
		letter-spacing: -1px;
	}
	.hero-sub {
		font-size: 17px;
		color: #777;
		line-height: 1.7;
		max-width: 500px;
		margin: 0 auto 36px;
	}
	.hero-actions { display: flex; flex-wrap: wrap; gap: 14px; justify-content: center; }

	/* ═══════════════════════════════════════
	   BUTTONS
	   ═══════════════════════════════════════ */
	.btn-primary {
		display: inline-flex; align-items: center; padding: 14px 32px;
		font-size: 15px; font-weight: 600; color: #000; background: #FFD100;
		border-radius: 100px; text-decoration: none;
		transition: all 0.2s; box-shadow: 0 0 24px rgba(255,209,0,0.15);
	}
	.btn-primary:hover { background: #e6bc00; transform: translateY(-2px); }
	.btn-primary.btn-lg { font-size: 16px; padding: 16px 40px; }
	.btn-ghost {
		display: inline-flex; align-items: center; padding: 14px 32px;
		font-size: 15px; font-weight: 600; color: #999;
		border: 1px solid rgba(255,255,255,0.12);
		border-radius: 100px; text-decoration: none; transition: all 0.2s;
	}
	.btn-ghost:hover { color: #fff; border-color: rgba(255,255,255,0.25); transform: translateY(-2px); }

	/* ═══════════════════════════════════════
	   SECTIONS
	   ═══════════════════════════════════════ */
	.section-dark { padding: 96px 0; background: #101010; }
	.section-darker { padding: 96px 0; background: #0a0a0a; border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); }
	.section-sub { font-size: 16px; color: #666; max-width: 480px; margin: 0 0 48px; line-height: 1.6; }
	h2 { font-size: clamp(24px, 3.5vw, 36px); font-weight: 800; letter-spacing: -1.5px; line-height: 1.1; color: #fff; margin: 0 0 14px; }
	.eyebrow { display: block; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #FFD100; margin-bottom: 10px; }

	/* ═══════════════════════════════════════
	   BENTO
	   ═══════════════════════════════════════ */
	.bento { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; overflow: hidden; }
	.bento-card { padding: 32px; background: #141414; position: relative; overflow: hidden; }
	.bento-card h3 { font-size: 18px; font-weight: 700; color: #fff; margin: 0 0 8px; }
	.bento-card p { font-size: 14px; color: #666; line-height: 1.6; margin: 0; }
	.bento-large { grid-column: span 2; background: #0f0f0f; }
	.bento-wide { grid-column: span 2; }
	.bento-green { background: rgba(255,209,0,0.06); }
	.bento-green h3 { color: #FFD100; }
	.bento-glow { position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: #FFD100; border-radius: 50%; filter: blur(80px); opacity: 0.15; }
	.bc-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; background: rgba(255,255,255,0.05); color: #888; }
	.bc-icon.glass { background: rgba(255,255,255,0.08); backdrop-filter: blur(8px); color: #fff; }
	.bc-icon.green-icon { background: rgba(255,209,0,0.15); color: #FFD100; }

	/* ═══════════════════════════════════════
	   MARQUEE SECTION
	   ═══════════════════════════════════════ */
	.marquee-section { padding: 96px 0 0; background: #0a0a0a; border-top: 1px solid rgba(255,255,255,0.05); overflow: hidden; }
	.marquee-wrap { position: relative; margin-top: 40px; overflow: hidden; }
	.marquee-fade-l, .marquee-fade-r { position: absolute; top: 0; bottom: 0; width: 80px; z-index: 2; pointer-events: none; }
	.marquee-fade-l { left: 0; background: linear-gradient(to right, #0a0a0a, transparent); }
	.marquee-fade-r { right: 0; background: linear-gradient(to left, #0a0a0a, transparent); }
	.marquee-track {
		display: flex;
		gap: 10px;
		white-space: nowrap;
		animation: marqueeScroll 45s linear infinite;
		padding: 5px 0;
	}
	.marquee-track.row2 { animation-direction: reverse; animation-duration: 50s; }
	.marquee-track.row3 { animation-duration: 42s; }
	@keyframes marqueeScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
	.marquee-badge {
		display: inline-block;
		padding: 6px 14px;
		background: rgba(255,255,255,0.04);
		border: 1px solid rgba(255,255,255,0.07);
		color: #666;
		font-size: 12px;
		font-weight: 500;
		white-space: nowrap;
		flex-shrink: 0;
	}

	/* Feature strip (dashed grid at bottom) */
	.feature-strip {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		border-top: 1px dashed rgba(255,255,255,0.1);
		margin-top: 48px;
	}
	.fs-card {
		padding: 32px 24px;
		border-right: 1px dashed rgba(255,255,255,0.06);
	}
	.fs-card:last-child { border-right: none; }
	.fs-icon { color: #555; margin-bottom: 40px; }
	.fs-card h3 { font-size: 20px; font-weight: 600; color: #fff; margin: 0 0 8px; letter-spacing: -0.5px; }
	.fs-card p { font-size: 13px; color: #555; line-height: 1.6; margin: 0; }

	/* ═══════════════════════════════════════
	   STEPS
	   ═══════════════════════════════════════ */
	.steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; overflow: hidden; margin-top: 48px; }
	.step { padding: 32px; background: #0a0a0a; }
	.step-num { font-size: 32px; font-weight: 800; color: #FFD100; opacity: 0.3; letter-spacing: -1px; margin-bottom: 16px; }
	.step h4 { font-size: 16px; font-weight: 700; color: #fff; margin: 0 0 8px; }
	.step p { font-size: 13px; color: #666; line-height: 1.6; margin: 0; }

	/* ═══════════════════════════════════════
	   TEMPLATE CARDS - no bg, wireframe only
	   ═══════════════════════════════════════ */
	.tpl-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
	.tpl-card {
		border-radius: 14px;
		border: 1px solid rgba(255,255,255,0.06);
		overflow: hidden;
		background: transparent;
		transition: all 0.35s cubic-bezier(0.22,1,0.36,1);
		cursor: pointer;
		text-decoration: none;
		display: block;
	}
	.tpl-card:hover {
		border-color: #ffd00037;
		transform: translateY(-3px);
	}
	.tpl-thumb {
		--tpl-hue: 160;
		--tpl-sat: 70%;
		height: 150px;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		overflow: hidden;
	}
	.tpl-wire {
		width: 100px;
		background: rgba(255,255,255,0.04);
		border-radius: 6px;
		border: 1px solid rgba(255,255,255,0.08);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		transition: transform 0.35s cubic-bezier(0.22,1,0.36,1);
	}
	.tpl-card:hover .tpl-wire { transform: scale(1.06) translateY(-2px); }
	.tw-hdr { height: 8px; background: hsla(var(--tpl-hue), var(--tpl-sat), 50%, 0.3); }
	.tw-bd { padding: 6px 8px 8px; display: flex; flex-direction: column; gap: 3px; }
	.tw-ln { height: 4px; background: rgba(255,255,255,0.15); border-radius: 2px; width: 100%; }
	.tw-ln.w70 { width: 70%; } .tw-ln.w60 { width: 60%; } .tw-ln.w50 { width: 50%; } .tw-ln.w40 { width: 40%; }
	.tw-ln.dim, .tw-ls.dim { opacity: 0.4; }
	.tw-ls { height: 2.5px; background: rgba(255,255,255,0.08); border-radius: 1px; width: 100%; }
	.tw-ls.w80 { width: 80%; } .tw-ls.w70 { width: 70%; } .tw-ls.w60 { width: 60%; }
	.tw-sp { height: 3px; }
	.tw-bt { height: 6px; background: hsla(var(--tpl-hue), var(--tpl-sat), 50%, 0.25); border-radius: 3px; width: 50%; margin: 0 auto; }
	.tw-img { height: 18px; background: rgba(255,255,255,0.04); border: 1px dashed rgba(255,255,255,0.08); border-radius: 2px; margin-bottom: 3px; }
	.tw-tr { display: flex; gap: 2px; }
	.tw-tc { flex: 1; height: 3px; background: rgba(255,255,255,0.08); border-radius: 1px; }
	.tw-tc.short { flex: 0.5; }
	.tpl-pill {
		position: absolute; bottom: 10px; right: 10px;
		padding: 4px 12px; border-radius: 100px;
		background: rgba(255,209,0,0.9); color: #fff;
		font-size: 11px; font-weight: 600;
		opacity: 0; transform: translateY(6px);
		transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
	}
	.tpl-card:hover .tpl-pill { opacity: 1; transform: translateY(0); }
	.tpl-info { padding: 14px 16px; }
	.tpl-name { display: block; font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 4px; }
	.tpl-desc { font-size: 12px; color: #555; line-height: 1.4; }

	/* ═══════════════════════════════════════
	   CTA
	   ═══════════════════════════════════════ */
	.section-cta { padding: 120px 24px; background: #101010; position: relative; overflow: hidden; }
	.cta-h2 { font-size: clamp(28px, 4vw, 42px); }
	.cta-sub { font-size: 17px; color: #666; max-width: 460px; margin: 0 auto 32px; line-height: 1.6; }


	/* ═══════════════════════════════════════
	   RESPONSIVE
	   ═══════════════════════════════════════ */
	@media (max-width: 768px) {
		.bento { grid-template-columns: 1fr; }
		.bento-large, .bento-wide { grid-column: span 1; }
		.steps { grid-template-columns: 1fr; }
		.tpl-grid { grid-template-columns: 1fr 1fr; }
		.feature-strip { grid-template-columns: 1fr 1fr; }
		.fs-card { border-bottom: 1px dashed rgba(255,255,255,0.06); }
		.nav-links { display: none; }
	}
	@media (max-width: 480px) {
		.feature-strip { grid-template-columns: 1fr; }
		.tpl-grid { grid-template-columns: 1fr; }
	}
</style>
