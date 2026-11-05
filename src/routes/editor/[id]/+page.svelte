<script lang="ts">
	import { untrack } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { editor } from '$lib/store.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Canvas from '$lib/components/Canvas.svelte';
	import RightPanel from '$lib/components/RightPanel.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let { data } = $props();

	let retrying = $state(false);
	let ready = $state(false);

	// Load the template into the editor whenever the loaded data changes
	$effect(() => {
		const tpl = data.template;
		if (!tpl) return;
		untrack(() => {
			editor.setTemplate(tpl.id, tpl.name, tpl.blocks, !!tpl.isPublic, tpl.category || 'general', tpl.mailerTemplateId ?? '');
			editor.compile();
		});
		ready = true;
	});

	async function retry() {
		retrying = true;
		try {
			await invalidate('app:template');
		} finally {
			retrying = false;
		}
	}
</script>

<svelte:head>
	<title>{editor.templateName} - Editor - Axene Templates</title>
</svelte:head>

<div class="mobile-gate">
	<div class="mg-card">
		<div class="mg-icon"><Icon name="monitor" width={40} height={40} /></div>
		<h2>Larger screen needed</h2>
		<p>The email editor requires a desktop or tablet display to work properly. Please switch to a device with a wider screen.</p>
		<a href="/" class="mg-btn">Back to home</a>
	</div>
</div>

{#if data.template && !ready}
	<div class="load-error" role="status">
		<p>Loading template...</p>
	</div>
{:else if data.template}
	<div class="editor-wrap">
		<Sidebar />
		<Canvas />
		<RightPanel />
	</div>
{:else}
	<div class="load-error" role="alert">
		<div class="le-icon"><Icon name="warning" width={32} height={32} /></div>
		<h2>Could not open this template</h2>
		<p>{data.loadError?.message ?? 'The template could not be loaded.'}</p>
		<div class="le-actions">
			{#if data.loadError?.status !== 404 && data.loadError?.status !== 403}
				<button class="le-btn" onclick={retry} disabled={retrying}>
					<Icon name="refresh" width={16} height={16} />
					{retrying ? 'Retrying...' : 'Try again'}
				</button>
			{/if}
			<a href="/templates" class="le-link">Back to templates</a>
		</div>
	</div>
{/if}

<style>
.editor-wrap {
		display: flex;
		flex: 1;
		min-width: 0;
		min-height: 0;
		overflow: hidden;
		height: 100vh;
	}
	.mobile-gate { display: none; }
	.load-error {
		flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
		gap: 10px; padding: 32px; text-align: center; min-height: 100vh; background: var(--color-surface);
	}
	.le-icon { color: var(--color-accent-ink); display: flex; }
	.load-error h2 { font-size: 20px; font-weight: 700; color: var(--color-text); margin: 0; }
	.load-error p { font-size: 14px; color: var(--color-muted); margin: 0; max-width: 380px; line-height: 1.6; }
	.le-actions { display: flex; gap: 12px; align-items: center; margin-top: 14px; }
	.le-btn {
		display: inline-flex; align-items: center; gap: 6px; padding: 10px 22px; background: var(--color-accent); color: #101010;
		font-size: 14px; font-weight: 600; border-radius: 100px; border: none; cursor: pointer; font-family: inherit;
	}
	.le-btn:disabled { opacity: 0.7; cursor: progress; }
	.le-link { color: var(--color-muted); font-size: 14px; text-decoration: none; }
	.le-link:hover { color: var(--color-accent-ink); }

	@media (max-width: 860px) {
		.editor-wrap { display: none !important; }
		.mobile-gate {
			display: flex; flex: 1; align-items: center; justify-content: center;
			background: var(--color-surface); padding: 32px;
		}
		.mg-card { text-align: center; max-width: 340px; }
		.mg-icon { margin: 0 auto 20px; opacity: 0.8; color: var(--color-accent-ink); display: flex; justify-content: center; }
		.mg-card h2 { font-size: 20px; font-weight: 700; color: var(--color-text); margin: 0 0 10px; letter-spacing: -0.5px; }
		.mg-card p { font-size: 14px; color: var(--color-muted); line-height: 1.6; margin: 0 0 24px; }
		.mg-btn {
			display: inline-flex; padding: 10px 24px; background: var(--color-accent); color: #101010;
			font-size: 14px; font-weight: 600; border-radius: 100px; text-decoration: none;
		}
		.mg-btn:hover { background: color-mix(in srgb, var(--color-accent) 85%, var(--color-text)); }
	}
</style>
