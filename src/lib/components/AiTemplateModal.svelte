<script lang="ts">
	import { goto } from '$app/navigation';
	import { trapFocus } from '$lib/focus';
	import { AI_TARGETS, aiUrl, buildAiPrompt, buildFixPrompt, type AiTarget } from '$lib/ai-prompt';
	import Icon from './Icon.svelte';
	import BrandMark from './BrandMark.svelte';

	let { open = false, onclose }: { open: boolean; onclose: () => void } = $props();

	type Ok = { name: string; subject: string; blocks: unknown[]; warnings: string[]; fields: string[]; links: string[] };

	const EXAMPLES = ['Welcome email for new customers', 'Order receipt with a table of items', 'Black Friday sale with one big button', 'Monthly newsletter with three highlights'];

	let brief = $state('');
	let pasted = $state('');
	let checking = $state(false);
	let error = $state('');
	let result = $state<Ok | null>(null);
	let note = $state('');
	let wasOpen = false;

	$effect(() => {
		if (open && !wasOpen) {
			brief = '';
			pasted = '';
			error = '';
			result = null;
			note = '';
		}
		wasOpen = open;
	});

	const prompt = $derived(buildAiPrompt(brief));

	async function copy(text: string): Promise<boolean> {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {
			return false;
		}
	}
	async function openIn(t: AiTarget) {
		const url = aiUrl(t, prompt);
		if (url) {
			window.open(url, '_blank', 'noopener,noreferrer');
			note = `Opened ${AI_TARGETS[t].label} with your prompt. Paste its reply below.`;
		} else {
			const ok = await copy(prompt);
			window.open(AI_TARGETS[t].url, '_blank', 'noopener,noreferrer');
			note = ok ? `Your prompt is long, so it is copied. Paste it into ${AI_TARGETS[t].label}, then paste the reply below.` : `Your prompt is long. Use Copy prompt, then paste it into ${AI_TARGETS[t].label}.`;
		}
	}
	async function copyPrompt() {
		note = (await copy(prompt)) ? 'Prompt copied. Paste it into any AI chat.' : 'Could not copy, select the text and copy it yourself.';
	}
	async function copyFix() {
		note = (await copy(buildFixPrompt(error))) ? 'Copied. Paste it back to the AI so it can fix the template.' : 'Could not copy.';
	}

	async function validate() {
		checking = true;
		error = '';
		result = null;
		try {
			const res = await fetch('/api/templates/import', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text: pasted }),
			});
			const data = await res.json().catch(() => ({}));
			if (res.ok) result = data as Ok;
			else error = data.error ?? `Could not check the reply (error ${res.status}).`;
		} catch {
			error = 'Could not check the reply, check your connection.';
		} finally {
			checking = false;
		}
	}

	function openEditor() {
		if (!result) return;
		try {
			sessionStorage.setItem('axene.aiImport', JSON.stringify({ name: result.name, blocks: result.blocks }));
		} catch {
			error = 'Your browser blocked storage, so the template could not be handed to the editor.';
			return;
		}
		onclose();
		goto('/editor?import=ai');
	}

	function onkeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') onclose();
	}
	const counts = $derived.by(() => {
		const m = new Map<string, number>();
		for (const b of (result?.blocks ?? []) as { type: string }[]) m.set(b.type, (m.get(b.type) ?? 0) + 1);
		return [...m].map(([t, n]) => (n > 1 ? `${n} ${t}` : t));
	});
</script>

<svelte:window {onkeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="ai-overlay" onclick={onclose}>
		<div class="ai-card" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Generate a template with AI" tabindex="-1" use:trapFocus>
			<div class="ai-head">
				<div>
					<h2 class="ai-title">Generate with AI</h2>
					<p class="ai-sub">Describe the email, let ChatGPT or Claude draft it, then paste the reply here. We check it and open it in the editor.</p>
				</div>
				<button class="ai-x" onclick={onclose} aria-label="Close"><Icon name="close" width={16} height={16} /></button>
			</div>

			<div class="ai-step">
				<div class="ai-step-head"><span class="ai-num">1</span>Describe your email</div>
				<textarea class="ai-input" rows="3" maxlength="1500" placeholder="For example: a welcome email for my coffee shop, warm tone, one button to order online" bind:value={brief}></textarea>
				<div class="ai-chips">
					{#each EXAMPLES as ex}
						<button type="button" class="ai-chip" onclick={() => (brief = ex)}>{ex}</button>
					{/each}
				</div>
				<div class="ai-actions">
					<button class="ai-btn ai-btn-brand" type="button" onclick={() => openIn('claude')}><BrandMark name="claude" size={18} />Open in Claude<Icon name="chevron-right" width={14} height={14} /></button>
					<button class="ai-btn ai-btn-brand" type="button" onclick={() => openIn('chatgpt')}><BrandMark name="chatgpt" size={18} />Open in ChatGPT<Icon name="chevron-right" width={14} height={14} /></button>
					<button class="ai-btn" type="button" onclick={copyPrompt}><Icon name="copy" width={14} height={14} />Copy prompt</button>
				</div>
				<details class="ai-details">
					<summary>See the full instructions we send</summary>
					<pre class="ai-pre">{prompt}</pre>
				</details>
				{#if note}<p class="ai-note" role="status">{note}</p>{/if}
			</div>

			<div class="ai-step">
				<div class="ai-step-head"><span class="ai-num">2</span>Paste the reply</div>
				<textarea class="ai-input ai-mono" rows="6" placeholder="Paste the JSON the AI gave you (the code block, or the whole reply)" bind:value={pasted} oninput={() => { error = ''; result = null; }}></textarea>
				<div class="ai-actions">
					<button class="ai-btn ai-btn-primary" type="button" disabled={checking || !pasted.trim()} onclick={validate}>
						{#if checking}<span class="ai-spin" aria-hidden="true"></span>Checking...{:else}<Icon name="check" width={14} height={14} />Check template{/if}
					</button>
				</div>

				{#if error}
					<div class="ai-msg ai-msg-err" role="alert">
						<Icon name="warning" width={16} height={16} />
						<div>
							<div>{error}</div>
							<button class="ai-link" type="button" onclick={copyFix}>Copy a fix request for the AI</button>
						</div>
					</div>
				{/if}

				{#if result}
					<div class="ai-msg ai-msg-ok" role="status">
						<Icon name="check" width={16} height={16} />
						<div>
							<div class="ai-ok-title">{result.name}</div>
							<div class="ai-ok-sub">{result.blocks.length} blocks: {counts.join(', ')}</div>
							{#if result.subject}<div class="ai-ok-sub">Subject: {result.subject}</div>{/if}
							{#if result.fields.length || result.links.length}
								<div class="ai-ok-sub">Uses {[...result.fields.map((f) => `{{${f}}}`), ...result.links.map((l) => `{{link:${l}}}`)].join(', ')}</div>
							{/if}
							{#each result.warnings as w}<div class="ai-warn">{w}</div>{/each}
						</div>
					</div>
					<div class="ai-actions">
						<button class="ai-btn ai-btn-primary" type="button" onclick={openEditor}>Open in editor<Icon name="chevron-right" width={14} height={14} /></button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.ai-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px; background: color-mix(in srgb, var(--color-bg) 70%, transparent); backdrop-filter: blur(3px); }
	.ai-card { width: 100%; max-width: 640px; max-height: calc(100vh - 32px); overflow-y: auto; background: var(--color-surface-2); color: var(--color-text); border-radius: 16px; padding: 22px; box-shadow: 0 24px 60px color-mix(in srgb, var(--color-bg) 80%, transparent); font-family: var(--font-sans); font-size: 13px; display: flex; flex-direction: column; gap: 18px; }
	.ai-head { display: flex; justify-content: space-between; gap: 12px; }
	.ai-title { font-size: 18px; font-weight: 700; }
	.ai-sub { margin-top: 4px; color: var(--color-muted); line-height: 1.45; }
	.ai-x { background: none; border: 0; color: var(--color-muted); cursor: pointer; align-self: flex-start; padding: 4px; border-radius: 6px; }
	.ai-x:hover { color: var(--color-text); background: var(--color-bg); }
	.ai-step { display: flex; flex-direction: column; gap: 10px; padding: 16px; border-radius: 12px; background: var(--color-bg); }
	.ai-step-head { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; }
	.ai-num { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: var(--color-accent); color: var(--color-on-accent); font-size: 12px; font-weight: 700; }
	.ai-input { width: 100%; resize: vertical; background: var(--color-surface-2); color: var(--color-text); border: 0; border-radius: 8px; padding: 10px 12px; font: inherit; line-height: 1.45; }
	.ai-input:focus { outline: 2px solid var(--color-accent); }
	.ai-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 12px; }
	.ai-chips { display: flex; flex-wrap: wrap; gap: 6px; }
	.ai-chip { font: inherit; font-size: 12px; padding: 3px 10px; border-radius: 99px; border: 0; background: var(--color-surface-2); color: var(--color-muted); cursor: pointer; }
	.ai-chip:hover { color: var(--color-text); }
	.ai-actions { display: flex; flex-wrap: wrap; gap: 8px; }
	.ai-btn { display: inline-flex; align-items: center; gap: 6px; font: inherit; font-weight: 600; padding: 8px 14px; border-radius: 8px; border: 0; background: var(--color-surface-2); color: var(--color-text); cursor: pointer; }
	.ai-btn:hover:not(:disabled) { background: color-mix(in srgb, var(--color-surface-2) 80%, var(--color-text)); }
	.ai-btn:disabled { opacity: 0.45; cursor: not-allowed; }
	.ai-btn-brand { padding: 9px 14px; background: var(--color-surface-2); }
	.ai-btn-primary { background: var(--color-accent); color: var(--color-on-accent); }
	.ai-btn-primary:hover:not(:disabled) { background: color-mix(in srgb, var(--color-accent) 85%, var(--color-text)); }
	.ai-details summary { cursor: pointer; color: var(--color-muted); font-size: 12px; }
	.ai-pre { margin-top: 8px; max-height: 220px; overflow: auto; white-space: pre-wrap; word-break: break-word; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 11px; line-height: 1.5; color: var(--color-muted); padding: 10px; border-radius: 8px; background: var(--color-surface-2); }
	.ai-note { color: var(--color-muted); font-size: 12px; }
	.ai-msg { display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px; border-radius: 9px; line-height: 1.45; }
	.ai-msg-err { color: var(--color-danger); background: var(--color-danger-soft); }
	.ai-msg-ok { color: var(--color-success); background: var(--color-success-soft); }
	.ai-ok-title { font-weight: 600; color: var(--color-text); }
	.ai-ok-sub { color: var(--color-muted); font-size: 12px; word-break: break-word; }
	.ai-warn { margin-top: 4px; font-size: 12px; color: var(--color-text); }
	.ai-link { margin-top: 4px; background: none; border: 0; padding: 0; font: inherit; font-weight: 600; text-decoration: underline; color: inherit; cursor: pointer; }
	.ai-spin { width: 12px; height: 12px; border-radius: 50%; border: 2px solid currentColor; border-top-color: transparent; animation: ai-rot 0.8s linear infinite; }
	@keyframes ai-rot { to { transform: rotate(360deg); } }
	@media (prefers-reduced-motion: reduce) { .ai-spin { animation: none; } }
</style>
