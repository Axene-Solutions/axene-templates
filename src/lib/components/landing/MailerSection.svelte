<script lang="ts">
	import Icon from '$lib/components/Icon.svelte'
</script>

<section id="mailer" class="section-darker">
	<div class="container">
		<div class="split">
			<div class="split-copy sr-bottom">
				<span class="eyebrow">Mailer</span>
				<h2>Works with Axene Mailer<span class="accent">.</span></h2>
				<p class="section-sub" style="margin-bottom:28px;">
					Design here, send from your own account. Link Axene Mailer once and keep going in the same place.
				</p>
				<ol class="steps-list">
					<li class="sl-item"><span class="sl-num">1</span><div><b>Connect with an API key</b><span class="sl-d">Paste your Mailer key in Settings. It is stored encrypted and never shown again.</span></div></li>
					<li class="sl-item"><span class="sl-num">2</span><div><b>Save a template into Mailer</b><span class="sl-d">Push a design to your Mailer account, or open a Mailer template here to edit it.</span></div></li>
					<li class="sl-item"><span class="sl-num">3</span><div><b>Send from your own verified domain</b><span class="sl-d">Pick a sender, add recipients and a subject, and send. Mail goes out from your Mailer account.</span></div></li>
					<li class="sl-item"><span class="sl-num">4</span><div><b>See your plan and limits</b><span class="sl-d">Your Mailer plan, template usage and sends are shown in the app. Sending counts toward your Mailer limits.</span></div></li>
				</ol>
				<a href="/settings" class="nbtn nbtn-primary" style="background: #ffd100; color: #000000">Connect Mailer<Icon name="arrow-right4" width={14} height={14} /></a>
			</div>

			<div class="panel sr-card">
				<div class="bento-glow"></div>
				<span class="tag">Example</span>
				<div class="mock">
					<div class="mk-row"><span class="mk-title">Send email</span><span class="mk-badge"><Icon name="padlock" width={13} height={13} />Verified domain</span></div>
					<div class="mk-block">
						<div class="mk-label"><span>From</span></div>
						<div class="mk-field"><span class="mono">hello@yourdomain.com</span><Icon name="arrow-down4" width={16} height={16} /></div>
					</div>
					<div class="mk-block">
						<div class="mk-label"><span>Recipients</span><span class="mk-count">2 recipients</span></div>
						<div class="mk-field mk-chips"><span class="mk-chip mono">wanjiru@example.com</span><span class="mk-chip mono">brian@example.com</span></div>
					</div>
					<div class="mk-block">
						<div class="mk-label"><span>Subject</span></div>
						<div class="mk-field"><span>Karibu to Coffee House</span></div>
					</div>
					<div class="ok-banner"><Icon name="done" width={18} height={18} /><span>Email sent</span></div>
				</div>
				<div class="mock">
					<div class="mk-row"><span class="mk-title">Business plan</span><span class="mk-badge">Mailer</span></div>
					<div class="mk-line">Templates: 4 saved</div>
					<div class="mk-block">
						<div class="mk-label"><span>Sent this month</span><span class="mk-count">128</span></div>
						<div class="meter"><div class="meter-fill" style="width:24%"></div></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
