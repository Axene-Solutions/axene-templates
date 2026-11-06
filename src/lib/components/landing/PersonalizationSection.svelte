<script lang="ts">
	// Starter strings that contain braces are built in script, never in the markup.
	const open = '{' + '{'
	const close = '}' + '}'
	const chipName = open + 'name|friend' + close
	const chipLink = open + 'link:pay_now' + close
	const chipTypo = open + 'nmae' + close
</script>

<section id="personalization" class="section-darker" style="padding: 120px 0px; background: #121211">
	<div class="container" style="max-width: 1100px; margin: 0 auto; padding: 0px 40px; box-sizing: border-box; display: flex; flex-direction: column; gap: 72px">
		<div class="sr-bottom" style="display: flex; flex-direction: column; gap: 20px; max-width: 720px">
			<span class="eyebrow" style="font-size: 12px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #ffd100">Personalization</span>
			<h2 style="margin: 0px; font-size: 60px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.04; color: #f2f1ec; text-wrap: balance">Write once, personalize every send<span class="accent" style="color: #ffd100">.</span></h2>
			<p class="section-sub" style="margin: 0; font-size: 18px; line-height: 1.6; color: #a9a79c; max-width: 560px">
				Drop fields and named links into your text. They are filled in for each recipient.
			</p>
		</div>

		<div class="trio" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr)); gap: 16px">
			<div class="mini-card sr-card" style="display: flex; flex-direction: column; gap: 12px; padding: 28px; border-radius: 20px; background: #1b1b19; border: none; box-shadow: none">
				<h3 style="margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.01em; color: #f2f1ec">Fields with fallbacks</h3>
				<p style="margin: 0; font-size: 15px; line-height: 1.55; color: #a9a79c; flex-grow: 1">Add a field and a fallback for when it is empty.</p>
				<span class="chip-ph" style="align-self: flex-start; font-family: 'JetBrains Mono', monospace; font-size: 13px; padding: 6px 12px; border-radius: 8px; background: #2a2a26; color: #ffd100; border: none">{chipName}</span>
			</div>
			<div class="mini-card sr-card" style="display: flex; flex-direction: column; gap: 12px; padding: 28px; border-radius: 20px; background: #1b1b19; border: none; box-shadow: none">
				<h3 style="margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.01em; color: #f2f1ec">Links you change once</h3>
				<p style="margin: 0; font-size: 15px; line-height: 1.55; color: #a9a79c; flex-grow: 1">Name a link, set its address in one place, and every use follows.</p>
				<span class="chip-ph" style="align-self: flex-start; font-family: 'JetBrains Mono', monospace; font-size: 13px; padding: 6px 12px; border-radius: 8px; background: #2a2a26; color: #ffd100; border: none">{chipLink}</span>
			</div>
			<div class="mini-card sr-card" style="display: flex; flex-direction: column; gap: 12px; padding: 28px; border-radius: 20px; background: #1b1b19; border: none; box-shadow: none">
				<h3 style="margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.01em; color: #f2f1ec">Typos caught before sending</h3>
				<p style="margin: 0; font-size: 15px; line-height: 1.55; color: #a9a79c; flex-grow: 1">A field that does not exist is flagged so you can fix it first.</p>
				<span class="chip-ph chip-bad" style="align-self: flex-start; font-family: 'JetBrains Mono', monospace; font-size: 13px; padding: 6px 12px; border-radius: 8px; background: #3a2420; color: #ff8a75; border: none; text-decoration: line-through">{chipTypo}</span>
			</div>
		</div>

		<div class="ba" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(320px, 100%), 1fr)); gap: 16px; align-items: stretch">
			<div class="panel ba-src sr-card" style="display: flex; flex-direction: column; gap: 16px; padding: 28px; border-radius: 20px; background: #242420; border: none; box-shadow: none">
				<span class="tag" style="font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: #8e8b7e">In your template</span>
				<div class="mock ba-text" style="display: flex; flex-direction: column; gap: 6px; font-size: 17px; line-height: 1.6; color: #f2f1ec; background: transparent; border: none; padding: 0px">
					<span class="ba-line" style="display: block">Hi <span class="chip-ph" style="align-self: flex-start; font-family: 'JetBrains Mono', monospace; font-size: 13px; padding: 6px 12px; border-radius: 8px; background: #2a2a26; color: #ffd100; border: none">{chipName}</span>,</span>
					<span class="ba-line" style="display: block">Your receipt is ready.</span>
					<span class="ba-line" style="display: block">Pay here: <span class="chip-ph" style="align-self: flex-start; font-family: 'JetBrains Mono', monospace; font-size: 13px; padding: 6px 12px; border-radius: 8px; background: #2a2a26; color: #ffd100; border: none">{chipLink}</span></span>
				</div>
			</div>
			<div class="ba-out" style="display: flex; flex-direction: column; gap: 16px">
				<div class="panel sr-card" style="display: flex; flex-direction: column; gap: 16px; padding: 28px; border-radius: 20px; background: #1b1b19; border: none; box-shadow: none">
					<span class="tag" style="font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: #8e8b7e">Recipient: Wanjiru</span>
					<div class="mock ba-text" style="display: flex; flex-direction: column; gap: 6px; font-size: 17px; line-height: 1.6; color: #f2f1ec; background: transparent; border: none; padding: 0px">
						<span class="ba-line" style="display: block">Hi Wanjiru,</span>
						<span class="ba-line" style="display: block">Your receipt is ready.</span>
						<span class="ba-line" style="display: block">Pay here: <span class="ba-link" style="color: #ffd100; text-decoration: underline; text-underline-offset: 4px">Pay now</span></span>
					</div>
				</div>
				<div class="panel sr-card" style="display: flex; flex-direction: column; gap: 16px; padding: 28px; border-radius: 20px; background: #1b1b19; border: none; box-shadow: none">
					<span class="tag" style="font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: #8e8b7e">Recipient: no name</span>
					<div class="mock ba-text" style="display: flex; flex-direction: column; gap: 6px; font-size: 17px; line-height: 1.6; color: #f2f1ec; background: transparent; border: none; padding: 0px">
						<span class="ba-line" style="display: block">Hi friend,</span>
						<span class="ba-line" style="display: block">Your receipt is ready.</span>
						<span class="ba-line" style="display: block">Pay here: <span class="ba-link" style="color: #ffd100; text-decoration: underline; text-underline-offset: 4px">Pay now</span></span>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
