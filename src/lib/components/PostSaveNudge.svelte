<script lang="ts">
	import { page } from '$app/state';
	import { editor } from '$lib/store.svelte';
	import { mailer } from '$lib/mailer.svelte';
	import { mailerData, settingsHref } from '$lib/mailer-data.svelte';
	import { editorUi } from '$lib/editor-ui.svelte';
	import { nudge } from '$lib/nudge.svelte';
	import { keyProblem } from '$lib/nudge';
	import { PRICING_URL, MAILER_URL, saveBlockedReason } from '$lib/mailer-plan';
	import Icon from './Icon.svelte';

	// A quiet bar under the toolbar after an explicit save. Never a modal, never takes focus,
	// and it steps aside as soon as the user types again.
	const signedIn = $derived(!!page.data.user);
	const visible = $derived(nudge.visibleFor !== '' && nudge.visibleFor === editor.templateId);
	const kind = $derived(visible ? nudge.kind(signedIn) : null);

	const problem = $derived(
		keyProblem({ status: mailer.status, keyRevoked: mailerData.planState === 'key_broken', plan: mailerData.plan })
	);
	const limitText = $derived(saveBlockedReason(mailerData.plan, false) ?? 'Your Mailer plan has no room for another template.');

	// Mid-edit: hide on the next input (inside a dialog does not count) or any change to the template.
	$effect(() => {
		if (!visible) return;
		const onInput = (e: Event) => {
			if ((e.target as HTMLElement | null)?.closest?.('[role="dialog"]')) return;
			nudge.hide();
		};
		window.addEventListener('input', onInput, true);
		return () => window.removeEventListener('input', onInput, true);
	});
	$effect(() => {
		if (visible && editor.dirty) nudge.hide();
	});
	// Leaving the editor must not leave the bar waiting for the next template.
	$effect(() => () => nudge.hide());
</script>

{#if visible && kind}
	<div class="ns ns-{kind === 'limit' ? 'warn' : kind === 'broken' ? 'bad' : 'info'}" role="status" aria-live="polite">
		<Icon name={kind === 'broken' || kind === 'limit' ? 'warning' : kind === 'saved' ? 'check' : 'mail'} width={16} height={16} />
		<span class="ns-text">
			{#if kind === 'not_linked'}
				Saved. Link your Mailer account to send this or reuse it in broadcasts.
			{:else if kind === 'not_saved'}
				Saved here. Save it to Mailer to use it in broadcasts.
			{:else if kind === 'stale'}
				Saved here. The copy in Mailer is older than this one.
			{:else if kind === 'saved'}
				Updated in Mailer. Ready to send?
			{:else if kind === 'limit'}
				Saved here. {limitText}
			{:else if problem === 'revoked'}
				Mailer rejected your key. It may have been revoked.
			{:else if problem === 'unreadable'}
				The stored Mailer key cannot be read.
			{:else}
				Your Mailer key is missing the Read templates scope.
			{/if}
		</span>

		<span class="ns-actions">
			{#if kind === 'not_linked'}
				<a class="ns-btn ns-primary" href={settingsHref()}>Link Mailer</a>
			{:else if kind === 'not_saved'}
				<button type="button" class="ns-btn ns-primary" onclick={() => (editorUi.saveMailerOpen = true)}>Save to Mailer</button>
				<button type="button" class="ns-btn" onclick={() => (editorUi.sendOpen = true)}>Send a test</button>
			{:else if kind === 'stale'}
				<button type="button" class="ns-btn ns-primary" onclick={() => (editorUi.saveMailerOpen = true)}>Update in Mailer</button>
				<button type="button" class="ns-btn" onclick={() => (editorUi.sendOpen = true)}>Send a test</button>
			{:else if kind === 'saved'}
				<button type="button" class="ns-btn" onclick={() => (editorUi.sendOpen = true)}>Send test</button>
				<a class="ns-btn ns-primary" href="{MAILER_URL}/broadcasts/new?template={encodeURIComponent(editor.mailerTemplateId)}" target="_blank" rel="noopener noreferrer">New broadcast</a>
				<a class="ns-btn" href="{MAILER_URL}/templates" target="_blank" rel="noopener noreferrer">Open in Mailer</a>
			{:else if kind === 'limit'}
				<a class="ns-btn ns-primary" href={PRICING_URL} target="_blank" rel="noopener noreferrer">Compare plans</a>
				<button type="button" class="ns-btn" onclick={() => (editorUi.sendOpen = true)}>Send a test</button>
			{:else}
				<a class="ns-btn ns-primary" href={settingsHref()}>Fix connection</a>
			{/if}
		</span>

		<span class="ns-dismiss">
			<button type="button" class="ns-quiet" onclick={() => nudge.notNow()}>Not now</button>
			<button type="button" class="ns-quiet" onclick={() => nudge.dontShowAgain()}>Don't show again</button>
		</span>
	</div>
{/if}

<style>
	.ns {
		display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px;
		padding: 7px 14px; flex-shrink: 0;
		border-bottom: 1px solid var(--color-border-1);
		font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12.5px; color: var(--color-text);
	}
	.ns-info { background: var(--color-info-soft); }
	.ns-warn { background: var(--color-accent-soft); color: var(--color-accent-ink); }
	.ns-bad { background: var(--color-danger-soft); color: var(--color-danger); }
	.ns-text { flex: 1 1 260px; min-width: 0; line-height: 1.4; }
	.ns-actions { display: inline-flex; flex-wrap: wrap; gap: 6px; }
	.ns-btn {
		display: inline-flex; align-items: center; background: var(--color-surface); color: var(--color-text);
		border: 1px solid var(--color-border-1); border-radius: 6px; padding: 3px 10px;
		font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; text-decoration: none; white-space: nowrap;
	}
	.ns-btn:hover { background: var(--color-surface-2); }
	.ns-primary { background: var(--color-accent); border-color: var(--color-accent); color: #101010; }
	.ns-primary:hover { background: color-mix(in srgb, var(--color-accent) 85%, var(--color-text)); }
	.ns-btn:focus-visible, .ns-quiet:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 1px; }
	.ns-dismiss { display: inline-flex; gap: 10px; }
	.ns-quiet { background: none; border: none; padding: 2px 0; font: inherit; font-size: 11.5px; color: inherit; opacity: 0.75; text-decoration: underline; cursor: pointer; }
	.ns-quiet:hover { opacity: 1; }
</style>
