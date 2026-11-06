<script lang="ts">
	import Icon from '$lib/components/Icon.svelte'

	const faqRows: [string, string][] = [
		['Is it free?', 'Free to build and export. Sending goes through your Mailer plan.'],
		['Do I need Mailer?', 'No. Copy the compiled HTML or download it and use it with any email platform. Mailer is only needed if you want to save templates into it or send from the app.'],
		['How does linking Mailer work?', 'Paste an Axene Mailer API key in Settings and tick the scopes listed there. We check the key, and once it is linked you can save templates into Mailer, open Mailer templates here to edit them, and send from your verified domain.'],
		['Is my Mailer key safe?', 'The key is stored encrypted and is never shown again. You can disconnect it at any time from Settings.'],
		['Whose limits apply when I send?', 'Mail is sent from your Mailer account and counts toward its plan and limits.'],
		['Can AI build my template?', 'Yes. Describe the email, open Claude or ChatGPT with the instructions already filled in, and paste the reply back. We check it before it reaches the editor.'],
	]

	let faqOpen = $state(0)
</script>

<section id="faq" class="section-dark">
	<div class="container">
		<div class="text-center sr-bottom">
			<span class="eyebrow">FAQ</span>
			<h2>Questions, answered<span class="accent">.</span></h2>
		</div>
		<div class="faq">
			{#each faqRows as [q, a], i (q)}
				<div class="faq-item sr-card">
					<button type="button" class="faq-q" aria-expanded={faqOpen === i} onclick={() => (faqOpen = faqOpen === i ? -1 : i)}>
						<span>{q}</span>
						<span class="faq-chev" style={faqOpen === i ? 'transform:rotate(180deg);' : ''}><Icon name="arrow-down4" width={18} height={18} /></span>
					</button>
					{#if faqOpen === i}
						<div class="faq-a">{a}</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</section>
