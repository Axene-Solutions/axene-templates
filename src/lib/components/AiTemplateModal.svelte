<script lang="ts">
	import { goto } from '$app/navigation';
	import { trapFocus } from '$lib/focus';
	import { AI_TARGETS, aiUrl, buildAiPrompt, buildFixPrompt, type AiTarget } from '$lib/ai-prompt';
	import Icon from './Icon.svelte';
	import BrandMark from './BrandMark.svelte';
	import { sampleReply } from './gallery/helpers';

	// Generate with AI: ONE dialog, two steps (Step 2 has a Back chevron). Markup and copy follow the Main board.
	let { open = false, onclose }: { open: boolean; onclose: () => void } = $props();

	type Ok = { name: string; subject: string; blocks: unknown[]; warnings: string[]; fields: string[]; links: string[] };

	const EXAMPLES = ['Welcome email for new customers', 'Order receipt with a table of items', 'Black Friday sale, one big button', 'Monthly newsletter, three highlights'];
	// A chosen file is read in the browser, nothing is uploaded. The server accepts at most 200 000 characters.
	const MAX_FILE_BYTES = 400_000;

	let step = $state<1 | 2>(1);
	let brief = $state('');
	let pasted = $state('');
	let fileName = $state('');
	let fileError = $state('');
	let dragging = $state(false);
	let checking = $state(false);
	let error = $state('');
	let result = $state<Ok | null>(null);
	let note = $state('');
	let wasOpen = false;
	let fileInput: HTMLInputElement | undefined = $state();

	$effect(() => {
		if (open && !wasOpen) {
			step = 1;
			brief = '';
			pasted = '';
			fileName = '';
			fileError = '';
			dragging = false;
			checking = false;
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
			note = `Opened ${AI_TARGETS[t].label} with your prompt. Bring its reply back in the next step.`;
		} else {
			const ok = await copy(prompt);
			window.open(AI_TARGETS[t].url, '_blank', 'noopener,noreferrer');
			note = ok ? `Your prompt is long, so it is copied. Paste it into ${AI_TARGETS[t].label}, then bring its reply back in the next step.` : `Your prompt is long. Use Copy prompt, then paste it into ${AI_TARGETS[t].label}.`;
		}
	}
	async function copyPrompt() {
		note = (await copy(prompt)) ? 'Prompt copied. Paste it into any AI chat.' : 'Could not copy, select the text and copy it yourself.';
	}
	async function copyFix() {
		note = (await copy(buildFixPrompt(error))) ? 'Copied. Paste it back to the AI so it can fix the template.' : 'Could not copy.';
	}

	function resetCheck() {
		error = '';
		result = null;
	}

	function readFile(file: File | null | undefined) {
		if (!file) return;
		fileError = '';
		if (!/\.(json|txt)$/i.test(file.name)) {
			fileError = 'Only a .json or .txt file can be read.';
			return;
		}
		if (file.size > MAX_FILE_BYTES) {
			fileError = 'That file is too large to be a template reply.';
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			pasted = typeof reader.result === 'string' ? reader.result : '';
			fileName = file.name;
			resetCheck();
		};
		reader.onerror = () => {
			fileError = 'The file could not be read.';
		};
		reader.readAsText(file);
	}
	function onFileChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		readFile(input.files?.[0]);
		input.value = '';
	}
	function onDrop(e: DragEvent) {
		e.preventDefault();
		dragging = false;
		readFile(e.dataTransfer?.files?.[0]);
	}
	function clearFile() {
		fileName = '';
		fileError = '';
		pasted = '';
		resetCheck();
	}

	async function validate() {
		checking = true;
		resetCheck();
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
		if (e.key === 'Escape') {
			e.stopPropagation();
			onclose();
		}
	}
	const counts = $derived.by(() => {
		const m = new Map<string, number>();
		for (const b of (result?.blocks ?? []) as { type: string }[]) m.set(b.type, (m.get(b.type) ?? 0) + 1);
		return [...m].map(([t, n]) => (n > 1 ? `${n} ${t}` : t));
	});
	const ph = (x: string) => '{' + '{' + x + '}' + '}';
	const used = $derived([...(result?.fields ?? []).map((f) => ph(f)), ...(result?.links ?? []).map((l) => ph('link:' + l))]);
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="ai-overlay" onclick={onclose}>
		<div class="ai-card" onclick={(e) => e.stopPropagation()} {onkeydown} role="dialog" aria-modal="true" aria-label="Generate with AI" tabindex="-1" use:trapFocus>
			<div style="display:flex;align-items:flex-start;gap:8px">
				{#if step === 2}<button class="dz-x" type="button" onclick={() => (step = 1)} aria-label="Back to step 1"><Icon name="arrow-left42" width={16} height={16} /></button>{/if}
				<div style="flex-grow:1">
					{#if step === 1}
						<h2 class="ai-h">Generate with AI</h2>
						<p class="ai-p">Describe the email, let ChatGPT or Claude draft it, then bring the reply back. We check it before it reaches the editor.</p>
					{:else}
						<h2 class="ai-h">Import the reply</h2>
						<p class="ai-p">Upload the file or paste the text. We check it before it reaches the editor.</p>
					{/if}
				</div>
				<button class="dz-x" type="button" onclick={onclose} aria-label="Close"><Icon name="close" width={16} height={16} /></button>
			</div>
			<div style="display:flex;align-items:center;gap:12px">
				<span class="dz-lbl">Step {step} of 2</span>
				<span style="display:flex;gap:4px;flex-grow:1;max-width:120px"><span class="ai-bar ai-bar-on"></span><span class="ai-bar" class:ai-bar-on={step === 2}></span></span>
			</div>

			{#if step === 1}
				<div style="display:flex;flex-direction:column;gap:10px">
					<label class="dz-lbl" for="ai-brief">Describe it</label>
					<textarea id="ai-brief" class="dz-field" rows="3" maxlength="1500" style="resize:none;line-height:1.5" placeholder="A welcome email for my coffee shop, warm tone, one button to order online" bind:value={brief}></textarea>
					<div style="display:flex;flex-wrap:wrap;gap:8px">
						{#each EXAMPLES as ex (ex)}
							<button type="button" class="ai-ex" onclick={() => (brief = ex)}>{ex}</button>
						{/each}
					</div>
					<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:2px">
						<button class="dz-btn" type="button" onclick={() => openIn('claude')}><BrandMark name="claude" size={17} />Open in Claude<Icon name="arrow-right4" width={14} height={14} /></button>
						<button class="dz-btn" type="button" onclick={() => openIn('chatgpt')}><BrandMark name="chatgpt" size={17} />Open in ChatGPT<Icon name="arrow-right4" width={14} height={14} /></button>
						<button class="dz-btn" type="button" onclick={copyPrompt}><Icon name="copy" width={15} height={15} />Copy prompt</button>
					</div>
					<details style="font-size:13px;color:var(--color-muted)">
						<summary style="cursor:pointer;font-weight:600">See the full instructions we send</summary>
						<pre class="dz-mono ai-pre">{prompt}</pre>
					</details>
					{#if note}<p role="status" style="margin:0;font-size:12.5px;color:var(--color-muted)">{note}</p>{/if}
				</div>
				<div style="display:flex;justify-content:flex-end"><button class="dz-btn dz-btn-primary" type="button" onclick={() => (step = 2)}>Next: bring the reply back<Icon name="arrow-right4" width={14} height={14} /></button></div>
			{:else}
				<input bind:this={fileInput} type="file" accept=".json,.txt,application/json,text/plain" class="ai-file" tabindex="-1" aria-hidden="true" onchange={onFileChange} />
				{#if !fileName}
					<button
						type="button"
						class="ai-drop"
						class:ai-drop-on={dragging}
						onclick={() => fileInput?.click()}
						ondragover={(e) => { e.preventDefault(); dragging = true; }}
						ondragleave={() => (dragging = false)}
						ondrop={onDrop}
					>
						<span style="display:flex;color:var(--color-muted)"><Icon name="document-upload" width={24} height={24} /></span>
						<span style="font-size:14px;font-weight:600">Upload a .json or .txt file</span>
						<span style="font-size:12.5px;color:var(--color-muted)">Or drop it here</span>
					</button>
				{:else}
					<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:12px;background:var(--color-surface-2)"><span class="dz-mono" style="flex-grow:1;font-size:13px;overflow-wrap:anywhere">{fileName}</span><span style="font-size:12.5px;color:var(--color-muted)">Uploaded</span><button class="dz-x" type="button" onclick={clearFile} aria-label="Remove file"><Icon name="close" width={15} height={15} /></button></div>
				{/if}
				{#if fileError}<div role="alert" class="dz-note dz-note-bad"><Icon name="danger" width={16} height={16} /><span>{fileError}</span></div>{/if}
				<div style="display:flex;flex-direction:column;gap:10px">
					<div style="display:flex;align-items:center;gap:10px">
						<label class="dz-lbl" for="ai-paste" style="flex-grow:1">Or paste it here</label>
						<button class="dz-chip" type="button" style="background:var(--color-surface-2)" onclick={() => { pasted = sampleReply(); fileName = ''; resetCheck(); }}>Paste a sample reply</button>
					</div>
					<textarea id="ai-paste" class="dz-field dz-mono" rows="4" style="resize:none;font-size:12px;line-height:1.55" placeholder="Paste the JSON the AI gave you, code block or the whole reply" aria-label="Pasted reply" bind:value={pasted} oninput={resetCheck}></textarea>
					<div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px">
						<button class="dz-btn dz-btn-primary" type="button" disabled={checking || !pasted.trim()} onclick={validate}>{#if checking}<span class="dz-spinner"></span>{/if}{checking ? 'Checking' : 'Check template'}</button>
					</div>
					{#if error}
						<div role="alert" class="dz-note dz-note-bad">
							<Icon name="danger" width={16} height={16} />
							<div><div>{error}</div><button class="dz-btn dz-btn-sm" type="button" onclick={copyFix} style="margin-top:8px"><Icon name="copy" width={14} height={14} />Copy a fix request for the AI</button></div>
						</div>
					{/if}
					{#if note}<p role="status" style="margin:0;font-size:12.5px;color:var(--color-muted)">{note}</p>{/if}
					{#if result}
						<div role="status" style="display:flex;gap:12px;padding:14px 16px;border-radius:12px;background:var(--color-success-soft)">
							<span style="color:var(--color-success);display:flex;margin-top:1px"><Icon name="done" width={18} height={18} /></span>
							<div style="flex-grow:1;min-width:0;font-size:13px;line-height:1.55">
								<div style="font-weight:700;font-size:14px;overflow-wrap:anywhere">{result.name}</div>
								<div style="color:var(--color-muted)">{result.blocks.length} blocks: {counts.join(', ')}</div>
								{#if result.subject}<div style="color:var(--color-muted)">Subject: <span class="dz-mono" style="font-size:12px;overflow-wrap:anywhere">{result.subject}</span></div>{/if}
								{#if result.fields.length || result.links.length}
									<div style="color:var(--color-muted)">Uses {#each used as u, i (u)}{#if i > 0}{i === used.length - 1 ? ' and ' : ', '}{/if}<span class="dz-mono" style="font-size:12px">{u}</span>{/each}</div>
								{/if}
								{#each result.warnings as w (w)}<div style="color:var(--color-warn);margin-top:4px">{w}</div>{/each}
							</div>
							<button class="dz-btn dz-btn-primary" type="button" onclick={openEditor} style="align-self:center">Open in editor<Icon name="arrow-right4" width={14} height={14} /></button>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.ai-overlay { position: fixed; inset: 0; z-index: 1000; background: var(--color-scrim); display: flex; align-items: flex-start; justify-content: center; padding: 40px 16px; box-sizing: border-box; overflow-y: auto; }
	.ai-card { box-sizing: content-box; width: 100%; max-width: 580px; background: var(--color-bg); color: var(--color-text); border-radius: 16px; padding: 26px; box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35); display: flex; flex-direction: column; gap: 18px; font-family: var(--font-sans); outline: none; line-height: normal; }
	.ai-h { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.01em; }
	.ai-p { margin: 5px 0 0; font-size: 13.5px; line-height: 1.5; color: var(--color-muted); }
	.ai-bar { height: 4px; border-radius: 4px; flex: 1; background: var(--color-surface-3); }
	.ai-bar-on { background: var(--color-text); }
	.ai-ex { background: var(--color-surface-2); padding: 8px 14px; border-radius: 4px; font: inherit; font-size: 13px; font-weight: 500; line-height: 1.3; text-align: left; border: 1px solid var(--color-surface-3); color: var(--color-text); cursor: pointer; }
	.ai-ex:hover { background: var(--color-surface-3); }
	.ai-ex:focus-visible { outline: 2px solid #ffd100; outline-offset: 1px; }
	.ai-pre { box-sizing: content-box; margin: 8px 0 0; padding: 12px 14px; border-radius: 12px; background: var(--color-surface-2); color: var(--color-text); font-size: 11.5px; line-height: 1.55; white-space: pre-wrap; max-height: 180px; overflow: auto; }
	.ai-file { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
	.ai-drop { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 22px 16px; border: 0; border-radius: 12px; background: var(--color-surface-2); cursor: pointer; color: var(--color-text); font: inherit; }
	.ai-drop:hover, .ai-drop-on { background: var(--color-surface-3); }
	.ai-drop-on { box-shadow: 0 0 0 2px #ffd100; }
	.ai-drop:focus-visible { outline: 2px solid #ffd100; outline-offset: 1px; }
</style>
