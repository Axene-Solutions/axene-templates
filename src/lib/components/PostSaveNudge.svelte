<script lang="ts">
	import { page } from '$app/state';
	import { editor, view } from '$lib/store.svelte';
	import { mailer } from '$lib/mailer.svelte';
	import { mailerData, settingsHref } from '$lib/mailer-data.svelte';
	import { nudge } from '$lib/nudge.svelte';
	import { keyProblem } from '$lib/nudge';
	import { PRICING_URL, saveBlockedReason } from '$lib/mailer-plan';
	import Icon from './Icon.svelte';

	// A quiet bar under the top bar after an explicit save. Never a modal, never takes focus,
	// and it steps aside as soon as the user types again.
	const signedIn = $derived(!!page.data.user);
	const visible = $derived(nudge.visibleFor !== '' && nudge.visibleFor === editor.templateId);
	const kind = $derived(visible ? nudge.kind(signedIn) : null);

	const problem = $derived(
		keyProblem({ status: mailer.status, keyRevoked: mailerData.planState === 'key_broken', plan: mailerData.plan })
	);
	const limitText = $derived(saveBlockedReason(mailerData.plan, false) ?? 'Your Mailer plan has no room for another template.');
	const saveMailerLabel = $derived(editor.mailerTemplateId ? 'Update in Mailer' : 'Save to Mailer');

	const text = $derived(
		kind === 'not_linked'
			? 'Saved. Link your Mailer account to send this or reuse it in broadcasts.'
			: kind === 'not_saved'
				? 'Saved here. Save it to Mailer to use it in broadcasts.'
				: kind === 'stale'
					? 'Saved here. The copy in Mailer is older than this one.'
					: kind === 'saved'
						? 'Saved. Mailer already has this version. Ready to send?'
						: kind === 'limit'
							? `Saved here. ${limitText}`
							: problem === 'revoked'
								? 'Mailer rejected your key. It may have been revoked.'
								: problem === 'unreadable'
									? 'The stored Mailer key cannot be read.'
									: 'Your Mailer key is missing the Read templates scope.'
	);
	const good = $derived(kind === 'not_saved' || kind === 'stale' || kind === 'saved' || kind === 'not_linked');

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

	function open(kind: 'save' | 'send') {
		nudge.hide();
		view.openModal(kind);
	}
</script>

{#if visible && kind}
	<div role="status" style="margin:0 16px 8px;padding:8px 8px 8px 14px;border-radius:12px;background:var(--s2);display:flex;align-items:center;gap:10px;font-size:13px;flex-shrink:0">
		<span style="display:flex;color:{good ? 'var(--ok)' : 'var(--warn)'}"><Icon name={good ? 'tick-circle' : 'warning'} width={16} height={16} /></span><span style="flex-grow:1">{text}</span>
		{#if kind === 'not_linked'}
			<a class="btn" style="background:var(--bg);padding:6px 11px" href={settingsHref()}>Link Mailer</a>
		{:else if kind === 'not_saved' || kind === 'stale'}
			<button class="btn" type="button" style="background:var(--bg);padding:6px 11px" onclick={() => open('save')}>{saveMailerLabel}</button>
			<button class="btn" type="button" style="background:var(--bg);padding:6px 11px" onclick={() => open('send')}>Send a test</button>
		{:else if kind === 'saved'}
			<button class="btn" type="button" style="background:var(--bg);padding:6px 11px" onclick={() => open('send')}>Send a test</button>
		{:else if kind === 'limit'}
			<a class="btn" style="background:var(--bg);padding:6px 11px" href={PRICING_URL} target="_blank" rel="noopener noreferrer">Compare plans</a>
			<button class="btn" type="button" style="background:var(--bg);padding:6px 11px" onclick={() => open('send')}>Send a test</button>
		{:else}
			<a class="btn" style="background:var(--bg);padding:6px 11px" href={settingsHref()}>Fix connection</a>
		{/if}
		<button class="mini" type="button" aria-label="Dismiss" onclick={() => nudge.notNow()}><Icon name="close" width={12} height={12} /></button>
	</div>
{/if}
