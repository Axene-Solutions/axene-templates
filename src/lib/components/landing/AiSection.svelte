<script lang="ts">
	import Icon from '$lib/components/Icon.svelte'
	import BrandMark from '$lib/components/BrandMark.svelte'
</script>

<section id="ai" class="section-dark">
	<div class="container">
		<div class="split rev">
			<div class="split-copy sr-bottom">
				<span class="eyebrow">AI</span>
				<h2>Generate with AI<span class="accent">.</span></h2>
				<p class="section-sub" style="margin-bottom:28px;">
					Let Claude or ChatGPT draft the email, then bring the reply back. Nothing reaches the editor unchecked.
				</p>
				<ol class="steps-list">
					<li class="sl-item"><span class="sl-num">1</span><div><b>Describe the email</b><span class="sl-d">A sentence or two is enough, like a welcome email for your coffee shop.</span></div></li>
					<li class="sl-item"><span class="sl-num">2</span><div><b>Open it in Claude or ChatGPT</b><span class="sl-d">The instructions are already filled in, so you do not write a prompt.</span></div></li>
					<li class="sl-item"><span class="sl-num">3</span><div><b>Paste the reply</b><span class="sl-d">Paste what the AI wrote, or upload it as a file.</span></div></li>
					<li class="sl-item"><span class="sl-num">4</span><div><b>We check it</b><span class="sl-d">The template is validated before it is accepted.</span></div></li>
					<li class="sl-item"><span class="sl-num">5</span><div><b>It opens in the editor</b><span class="sl-d">Adjust anything, then export or send.</span></div></li>
				</ol>
				<a href="/templates" class="nbtn nbtn-primary"><Icon name="magicpen" width={16} height={16} />Generate with AI</a>
			</div>

			<div class="panel sr-card">
				<div class="bento-glow"></div>
				<span class="tag">Example</span>
				<div class="mock" style="border: none; box-shadow: none">
					<div class="mk-label"><span>1 / Describe it</span></div>
					<div class="mk-field mk-area" style="border: none; box-shadow: none"><span>A welcome email for my coffee shop, warm tone, one button to order online</span></div>
					<div class="mk-btns">
						<span class="nbtn" style="border: none; box-shadow: none"><BrandMark name="claude" size={17} />Open in Claude</span>
						<span class="nbtn" style="border: none; box-shadow: none"><BrandMark name="chatgpt" size={17} />Open in ChatGPT</span>
					</div>
				</div>
				<div class="mock">
					<div class="mk-label"><span>2 / Bring the reply back</span></div>
					<div class="mk-field mk-area mono mk-code"><span>{'{"name": "Coffee welcome", "blocks": [ ... ]}'}</span></div>
					<div class="mk-btns"><span class="nbtn nbtn-primary">Check template</span></div>
					<div class="ok-banner ok-col">
						<div class="ok-row"><Icon name="done" width={18} height={18} /><span class="ok-title">Coffee welcome</span></div>
						<span class="ok-sub">5 blocks: header, heading, content, button, footer</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
