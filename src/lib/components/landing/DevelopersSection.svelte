<script lang="ts">
	import { onDestroy } from 'svelte'
	import Icon from '$lib/components/Icon.svelte'

	const CURL = `curl -X POST \\
  "https://templates.axene.io/api/templates/compile?category=otp&version=v1" \\
  -H "Content-Type: application/json" \\
  -d '{"data":{"verify_url":"https://example.com/verify?token=abc123"}}'`

	let curl = $state(false)
	let html = $state(false)
	let dl = $state(false)
	const timers: Partial<Record<'curl' | 'html' | 'dl', ReturnType<typeof setTimeout>>> = {}

	function flash(key: 'curl' | 'html' | 'dl') {
		if (key === 'curl') curl = true
		else if (key === 'html') html = true
		else dl = true
		clearTimeout(timers[key])
		timers[key] = setTimeout(() => {
			if (key === 'curl') curl = false
			else if (key === 'html') html = false
			else dl = false
		}, 1800)
	}

	async function copyCurl() {
		try {
			await navigator.clipboard.writeText(CURL)
		} catch {
			// Clipboard can be blocked; the confirmation still shows as in the design.
		}
		flash('curl')
	}

	onDestroy(() => {
		for (const t of Object.values(timers)) clearTimeout(t)
	})
</script>

<section id="developers" class="section-darker">
	<div class="container">
		<div class="split">
			<div class="split-copy sr-bottom">
				<span class="eyebrow">Developers</span>
				<h2>For developers<span class="accent">.</span></h2>
				<p class="section-sub" style="margin-bottom:24px;">
					Render the starter templates, like password reset, OTP and receipt, from your own backend. Post your values to the compile endpoint and get back the finished HTML and a subject.
				</p>
				<ul class="tick-list">
					<li><Icon name="done" width={16} height={16} /><span>Pick a starter with the category and version query parameters.</span></li>
					<li><Icon name="done" width={16} height={16} /><span>Values you send are HTML-escaped for you.</span></li>
					<li><Icon name="done" width={16} height={16} /><span>Links must be http, https, mailto or tel.</span></li>
				</ul>
			</div>

			<div class="code-card sr-card">
				<div class="code-bar">
					<span class="code-name mono">curl</span>
					<button type="button" class="nbtn nbtn-sm" onclick={copyCurl}>
						<Icon name={curl ? 'done' : 'copy'} width={15} height={15} />
						{curl ? 'Copied' : 'Copy'}
					</button>
				</div>
				<pre class="code mono"><span class="c-k">curl</span> -X POST \
  "https://templates.axene.io/api/templates/compile?category=otp&amp;version=v1" \
  -H "Content-Type: application/json" \
  -d '{'{'}"data":{'{'}"verify_url":"https://example.com/verify?token=abc123"{'}'}{'}'}'</pre>
				<div class="code-bar code-bar-2"><span class="code-name mono">response</span></div>
				<pre class="code mono"><span class="c-s">{'{'}
  "html": "&lt;!doctype html&gt;...",
  "errors": [],
  "subject": "Notification"
{'}'}</span></pre>
			</div>
		</div>

		<div class="export-strip sr-card">
			<div class="export-copy">
				<h3>Export anywhere</h3>
				<p>Copy the compiled HTML or download it. Use it in Axene Mailer, your ESP, or any email platform.</p>
			</div>
			<div class="export-btns">
				<button type="button" class="nbtn" onclick={() => flash('html')}>
					<Icon name={html ? 'done' : 'copy'} width={15} height={15} />
					{html ? 'Copied' : 'Copy HTML'}
				</button>
				<button type="button" class="nbtn nbtn-primary" onclick={() => flash('dl')}>
					{#if dl}<Icon name="done" width={15} height={15} />{/if}
					{dl ? 'Downloaded' : 'Download'}
				</button>
			</div>
		</div>
	</div>
</section>
