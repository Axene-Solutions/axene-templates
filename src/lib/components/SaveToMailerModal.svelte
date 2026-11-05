<script lang="ts">
	import { editor } from '$lib/store.svelte';
	import { mailer } from '$lib/mailer.svelte';
	import { MAX_SUBJECT_MAILER, MAX_TEMPLATE_NAME } from '$lib/mailer-templates';
	import { mailerData } from '$lib/mailer-data.svelte';
	import { saveBlockedReason, PRICING_URL } from '$lib/mailer-plan';
	import { trapFocus } from '$lib/focus';
	import { invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import Icon from './Icon.svelte';
	import ConfirmModal from './ConfirmModal.svelte';
	import MailerConnectCard from './MailerConnectCard.svelte';
	import MailerPlanCard from './MailerPlanCard.svelte';
	import PlaceholderWarnings from './PlaceholderWarnings.svelte';

	let { open = false, onclose }: { open: boolean; onclose: () => void } = $props();

	type Result = { mailerTemplateId: string; created: boolean; linked?: boolean; name?: string; openUrl: string };

	let subject = $state('');
	let name = $state('');
	let saving = $state(false);
	let error = $state('');
	let result = $state<Result | null>(null);
	// Mailer's copy changed since this template was opened or last saved (409 mailer_template_changed).
	let conflict = $state(false);
	let confirmReload = $state(false);
	let reloading = $state(false);

	const linked = $derived(!!editor.mailerTemplateId);
	const verb = $derived(linked ? 'Update in Mailer' : 'Save to Mailer');
	// Saving a new template can exceed the plan; updating one that already lives in Mailer never adds one.
	const blocked = $derived(saveBlockedReason(mailerData.plan, linked));
	const canSave = $derived(!saving && !blocked && subject.trim().length > 0 && subject.length <= MAX_SUBJECT_MAILER && name.trim().length > 0);

	// Per user and template, so a shared browser never offers one user's subject to another.
	const subjectKey = () => {
		const uid = (page.data as { user?: { id?: string } | null }).user?.id;
		return uid ? `axene.mailerSubject.${uid}.${editor.templateId}` : null;
	};
	function rememberedSubject(): string {
		const key = subjectKey();
		if (!key) return '';
		try {
			return localStorage.getItem(key) ?? '';
		} catch {
			return '';
		}
	}
	function remember(value: string) {
		const key = subjectKey();
		if (!key) return;
		try {
			localStorage.setItem(key, value);
			// The old key was shared by everyone using this browser.
			localStorage.removeItem(`axene.mailerSubject.${editor.templateId}`);
		} catch {
			/* storage can be unavailable: the dialog works without it */
		}
	}

	let wasOpen = false;
	$effect(() => {
		if (open && !wasOpen) init();
		wasOpen = open;
	});

	async function init() {
		error = '';
		result = null;
		conflict = false;
		confirmReload = false;
		subject = rememberedSubject() || editor.templateName;
		name = editor.templateName;
		await mailer.load();
		if (mailer.status === 'connected') mailerData.loadPlan(true);
	}

	async function save(overwrite = false) {
		error = '';
		result = null;
		conflict = false;
		saving = true;
		try {
			// The server compiles the saved copy, so persist pending edits (and brand new templates) first.
			if ((editor.dirty || editor.templateId.startsWith('untitled-')) && !(await editor.saveTemplate())) {
				error = 'Save the template before sending it to Mailer (it could not be saved).';
				return;
			}
			const res = await fetch(`/api/templates/${encodeURIComponent(editor.templateId)}/mailer-save`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(overwrite ? { subject, name, overwrite: true } : { subject, name }),
			});
			const data = await res.json().catch(() => ({}));
			if (res.ok) {
				result = data as Result;
				if (data.linked) editor.setMailerLink(data.mailerTemplateId, data.name ?? name);
				remember(subject);
				mailerData.refreshPlan();
			} else if (res.status === 409 && data.code === 'mailer_template_changed') {
				conflict = true;
			} else if (res.status === 409 && (data.code === 'not_connected' || data.code === 'mailer_key_unreadable')) {
				await mailer.load();
			} else if (res.status === 429) {
				error = `${data.error} Retry in about ${Math.ceil(Number(res.headers.get('Retry-After') ?? 60) / 60)} min.`;
			} else {
				error = data.error ?? `Save failed (error ${res.status})`;
			}
		} catch {
			error = 'Save failed, check your connection';
		} finally {
			saving = false;
		}
	}

	/** Discards local edits: the Templates copy is replaced with Mailer's current version. */
	async function reloadFromMailer() {
		confirmReload = false;
		error = '';
		reloading = true;
		try {
			const res = await fetch(`/api/mailer/templates/${encodeURIComponent(editor.mailerTemplateId)}/open`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reload: true }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				error = data.error ?? `Could not reload from Mailer (error ${res.status})`;
				return;
			}
			conflict = false;
			await invalidate('app:template');
			onclose();
		} catch {
			error = 'Could not reload from Mailer, check your connection';
		} finally {
			reloading = false;
		}
	}

	// While saving, Escape and backdrop clicks do nothing, so the result is not lost.
	function close() {
		if (!saving && !reloading && !confirmReload) onclose();
	}
	function onkeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') close();
	}
</script>

<svelte:window {onkeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="mt mt-overlay" onclick={close}>
		<div class="mt-card" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Save to Mailer" tabindex="-1" use:trapFocus>
			<div class="mt-head">
				<div class="mt-title">{verb}</div>
				<button class="mt-x" onclick={close} aria-label="Close" disabled={saving}><Icon name="close" width={16} height={16} /></button>
			</div>

			{#if mailer.status !== 'connected'}
				<MailerConnectCard />
			{:else}
				{#if linked}
					<div class="mt-linked">
						<Icon name="check" width={16} height={16} />
						<span>Saved to Mailer{editor.mailerTemplateName ? `: ${editor.mailerTemplateName}` : ''}. Saving again replaces its content.</span>
					</div>
				{:else}
					<p class="mt-text">Creates this template in your Mailer account so you can use it in campaigns. Placeholders such as {'{{name}}'} are kept for Mailer to fill in.</p>
				{/if}

				<div class="mt-plan"><MailerPlanCard compact showUpgrade={!blocked} /></div>
				{#if blocked}
					<div class="mt-note mt-note-err" role="alert">
						<Icon name="warning" width={16} height={16} />
						<span>{blocked} <a class="mt-open" href={PRICING_URL} target="_blank" rel="noopener noreferrer">Compare plans</a></span>
					</div>
				{/if}

				<label class="mt-label" for="mt-name">Template name in Mailer</label>
				<input id="mt-name" class="mt-input" type="text" maxlength={MAX_TEMPLATE_NAME} bind:value={name} />

				<label class="mt-label" for="mt-subj">Subject</label>
				<input id="mt-subj" class="mt-input" type="text" maxlength={MAX_SUBJECT_MAILER} bind:value={subject} />

				<PlaceholderWarnings variant="dialog" />

				{#if error}
					<div class="mt-note mt-note-err" role="alert"><Icon name="warning" width={16} height={16} /><span>{error}</span></div>
				{/if}

				{#if conflict}
					<div class="mt-note mt-note-warn" role="alert">
						<Icon name="warning" width={16} height={16} />
						<div>
							<div class="mt-strong">This template changed in Mailer since you opened it</div>
							<div>Saving now would replace the changes made in Mailer.</div>
							<div class="mt-actions">
								<button class="mt-btn mt-btn-secondary" disabled={saving || reloading} onclick={() => (confirmReload = true)}>
									<Icon name="refresh" width={14} height={14} />
									{reloading ? 'Reloading...' : 'Reload from Mailer'}
								</button>
								<button class="mt-btn mt-btn-danger" disabled={saving || reloading} onclick={() => save(true)}>
									<Icon name="save" width={14} height={14} />
									Overwrite Mailer's copy
								</button>
							</div>
						</div>
					</div>
				{/if}

				{#if result}
					<div class="mt-note mt-note-ok" role="status">
						<Icon name="check" width={16} height={16} />
						<span>
							{result.created ? 'Saved to Mailer' : 'Updated in Mailer'}{result.name ? `: ${result.name}` : ''}.
							<a class="mt-open" href={result.openUrl} target="_blank" rel="noopener noreferrer">Open in Mailer</a>
						</span>
					</div>
				{/if}

				<div class="mt-foot">
					<span class="mt-muted">Write access to templates is checked on the first save.</span>
					<button class="mt-btn mt-btn-primary" disabled={!canSave || conflict || reloading} onclick={() => save()}>
						<Icon name="save" width={14} height={14} />
						{saving ? 'Saving...' : result ? 'Save again' : verb}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<ConfirmModal
	open={confirmReload}
	title="Reload from Mailer"
	message="This replaces the template here with the version in Mailer. Edits made here since it was opened are discarded."
	confirmText="Discard edits and reload"
	variant="danger"
	onconfirm={reloadFromMailer}
	oncancel={() => (confirmReload = false)}
/>

<style>
	/* All colors for this component live in this block. */
	.mt {
		--mt-accent: var(--color-accent);
		--mt-card: var(--color-surface-2);
		--mt-field: var(--color-bg);
		--mt-border: var(--color-border-1);
		--mt-text: var(--color-text);
		--mt-muted: var(--color-muted);
		--mt-ok: var(--color-success);
		--mt-err: var(--color-danger);
		--mt-warn-ink: var(--color-accent-ink);
		--mt-warn-bg: var(--color-accent-soft);
	}
	.mt-overlay {
		position: fixed; inset: 0; z-index: 1000;
		background: color-mix(in srgb, var(--color-bg) 70%, transparent);
		backdrop-filter: blur(4px);
		display: flex; align-items: center; justify-content: center;
	}
	.mt-card {
		background: var(--mt-card); border: 1px solid var(--mt-border); border-radius: 12px;
		width: min(520px, 92vw); max-height: 90vh; overflow-y: auto; padding: 22px;
		color: var(--mt-text); font-size: 13px;
		font-family: var(--font-sans);
	}
	.mt-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
	.mt-title { font-size: 16px; font-weight: 600; }
	.mt-x { background: none; border: none; color: var(--mt-muted); cursor: pointer; display: flex; padding: 4px; border-radius: 6px; }
	.mt-x:hover { color: var(--mt-text); }
	.mt-plan { margin-top: 12px; }
	.mt-text { line-height: 1.5; color: var(--mt-muted); margin: 0; }
	.mt-muted { color: var(--mt-muted); font-size: 12px; }
	.mt-linked { display: flex; gap: 8px; align-items: flex-start; color: var(--mt-ok); line-height: 1.45; }
	.mt-linked span { color: var(--mt-text); }
	.mt-label { display: block; font-size: 11.5px; font-weight: 600; color: var(--mt-muted); margin: 12px 0 5px; }
	.mt-input {
		width: 100%; background: var(--mt-field); color: var(--mt-text);
		border: 1px solid var(--mt-border); border-radius: 7px; padding: 8px 10px; font: inherit;
	}
	.mt-input:focus { outline: 2px solid var(--mt-accent); outline-offset: 0; }
	.mt-note {
		display: flex; gap: 8px; align-items: flex-start; margin-top: 12px; padding: 9px 10px;
		border-radius: 7px; line-height: 1.45; border: 1px solid transparent;
	}
	.mt-note-err { border-color: var(--mt-err); background: color-mix(in srgb, var(--mt-err) 12%, transparent); color: var(--mt-err); }
	.mt-note-ok { border-color: var(--mt-ok); background: color-mix(in srgb, var(--mt-ok) 10%, transparent); color: var(--mt-ok); }
	.mt-note-ok span { color: var(--mt-text); }
	.mt-open { color: var(--color-accent-ink); font-weight: 600; text-decoration: underline; margin-left: 4px; }
	.mt-foot { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 16px; }
	.mt-btn {
		display: inline-flex; align-items: center; gap: 6px; border: none; border-radius: 7px;
		padding: 8px 16px; font: inherit; font-weight: 600; cursor: pointer; white-space: nowrap;
	}
	.mt-btn-primary { background: var(--mt-accent); color: var(--color-on-accent); }
	.mt-btn-primary:hover:not(:disabled) { background: color-mix(in srgb, var(--color-accent) 85%, var(--color-text)); }
	.mt-btn:disabled { opacity: 0.45; cursor: not-allowed; }
	.mt-note-warn { border-color: var(--mt-warn-ink); background: var(--mt-warn-bg); color: var(--mt-text); }
	.mt-strong { font-weight: 600; margin-bottom: 2px; }
	.mt-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
	.mt-btn-secondary { background: var(--mt-field); color: var(--mt-text); border: 1px solid var(--mt-border); }
	.mt-btn-secondary:hover:not(:disabled) { border-color: var(--mt-muted); }
	.mt-btn-danger { background: var(--mt-err); color: var(--color-bg); }
	.mt-btn-danger:hover:not(:disabled) { background: color-mix(in srgb, var(--mt-err) 85%, var(--color-text)); }
</style>
