<script lang="ts">
	import { editor } from '$lib/store.svelte';
	import { mailer } from '$lib/mailer.svelte';
	import { MAX_SUBJECT_MAILER, MAX_TEMPLATE_NAME } from '$lib/mailer-templates';
	import { mailerData } from '$lib/mailer-data.svelte';
	import { saveBlockedReason, templatesLine, MAILER_URL, PRICING_URL } from '$lib/mailer-plan';
	import { invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import Icon from './Icon.svelte';
	import MailerConnectCard from './MailerConnectCard.svelte';
	import PlaceholderWarnings from './PlaceholderWarnings.svelte';
	import ModalFrame from './editor/ModalFrame.svelte';

	// Save to Mailer (Editor.dc.html SAVE TO MAILER): form, saving, saved with Keep going options.
	// "Send a test email" moves into the Send step of the same modal (onsend); its Back returns
	// here with `resume`, so the saved state is kept.
	interface Props {
		open: boolean;
		onclose: () => void;
		onsend?: () => void;
		resume?: boolean;
	}
	let { open = false, onclose, onsend, resume = false }: Props = $props();

	type Result = { mailerTemplateId: string; created: boolean; linked?: boolean; name?: string; openUrl: string };

	let subject = $state('');
	let name = $state('');
	let phase = $state<'form' | 'saving' | 'done' | 'reload'>('form');
	let error = $state('');
	let result = $state<Result | null>(null);
	// Mailer's copy changed since this template was opened or last saved (409 mailer_template_changed).
	let conflict = $state(false);
	let reloading = $state(false);

	const linked = $derived(!!editor.mailerTemplateId);
	const verb = $derived(linked ? 'Update in Mailer' : 'Save to Mailer');
	// Saving a new template can exceed the plan; updating one that already lives in Mailer never adds one.
	const blocked = $derived(saveBlockedReason(mailerData.plan, linked));
	const canSave = $derived(phase === 'form' && !blocked && !conflict && subject.trim().length > 0 && subject.length <= MAX_SUBJECT_MAILER && name.trim().length > 0);
	const plan = $derived(mailerData.plan);
	const badge = $derived(
		blocked ? ['No room', 'var(--color-danger-soft)', 'var(--bad)'] : plan?.nearTemplateLimit ? ['Nearly full', 'var(--warn-soft)', 'var(--warn)'] : ['Room to save', 'var(--ok-soft)', 'var(--ok)']
	);
	const OB = '{' + '{';
	const CB = '}' + '}';

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
		if (open && !wasOpen && !(resume && result)) init();
		wasOpen = open;
	});

	async function init() {
		error = '';
		result = null;
		conflict = false;
		phase = 'form';
		subject = rememberedSubject() || editor.templateName;
		name = editor.templateName;
		await mailer.load();
		if (mailer.status === 'connected') mailerData.loadPlan(true);
	}

	async function save(overwrite = false) {
		error = '';
		result = null;
		conflict = false;
		phase = 'saving';
		try {
			// The server compiles the saved copy, so persist pending edits (and brand new templates) first.
			if ((editor.dirty || editor.templateId.startsWith('untitled-')) && !(await editor.saveTemplate())) {
				error = 'Save the template before sending it to Mailer (it could not be saved).';
				phase = 'form';
				return;
			}
			const res = await fetch(`/api/templates/${encodeURIComponent(editor.templateId)}/mailer-save`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(overwrite ? { subject, name, overwrite: true } : { subject, name }),
			});
			const data = await res.json().catch(() => ({}));
			phase = 'form';
			if (res.ok) {
				result = data as Result;
				if (data.linked) editor.setMailerLink(data.mailerTemplateId, data.name ?? name);
				remember(subject);
				mailerData.refreshPlan();
				phase = 'done';
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
			phase = 'form';
			error = 'Save failed, check your connection';
		}
	}

	/** Discards local edits: the Templates copy is replaced with Mailer's current version. */
	async function reloadFromMailer() {
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
				phase = 'form';
				return;
			}
			conflict = false;
			await invalidate('app:template');
			onclose();
		} catch {
			error = 'Could not reload from Mailer, check your connection';
			phase = 'form';
		} finally {
			reloading = false;
		}
	}

	const card = 'width:100%;max-width:480px;background:var(--bg);border-radius:16px;padding:26px;box-shadow:0 30px 80px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:18px';
	const note = 'font-size:12.5px;line-height:1.5;padding:10px 12px;border-radius:12px';
</script>

{#if open}
	<ModalFrame label="Save to Mailer" busy={phase === 'saving' || reloading} {onclose} style={card}>
		{#if phase === 'form'}
			<div style="display:flex;gap:12px"><div style="flex-grow:1"><h2 style="margin:0;font-size:20px;font-weight:700;letter-spacing:-.01em">{verb}</h2><p style="margin:5px 0 0;font-size:13.5px;line-height:1.5;color:var(--muted)">{#if linked}Saving again replaces the content of {editor.mailerTemplateName || 'the linked template'} in Mailer.{:else}Creates this template in your Mailer account. Fields like <span class="mono" style="font-size:12px">{OB}name{CB}</span> are filled per recipient.{/if}</p></div>
			<button class="icon-btn" type="button" onclick={onclose} aria-label="Close"><Icon name="close" width={16} height={16} /></button></div>

			{#if mailer.status !== 'connected'}
				<MailerConnectCard />
			{:else}
				{#if plan}
					<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;background:var(--s2)">
						<div style="flex-grow:1"><div style="font-size:13.5px;font-weight:700">{plan.name ? plan.name + ' plan' : 'Your plan'}</div><div style="font-size:12.5px;color:var(--muted);margin-top:2px">{templatesLine(plan)}</div></div>
						<span style="font-size:11.5px;font-weight:600;padding:3px 9px;border-radius:4px;background:{badge[1]};color:{badge[2]}">{badge[0]}</span>
					</div>
				{/if}
				{#if blocked}
					<div role="alert" style="{note};background:var(--color-danger-soft)"><span style="font-weight:700;color:var(--bad)">{blocked}</span> <a href={PRICING_URL} target="_blank" rel="noopener noreferrer" style="color:var(--text);font-weight:600">Compare plans</a></div>
				{/if}
				<div style="display:flex;flex-direction:column;gap:7px"><span class="lbl">Name in Mailer</span><input class="field" type="text" aria-label="Name in Mailer" maxlength={MAX_TEMPLATE_NAME} bind:value={name} /></div>
				<div style="display:flex;flex-direction:column;gap:7px"><span class="lbl">Subject</span><input class="field" type="text" aria-label="Subject" maxlength={MAX_SUBJECT_MAILER} bind:value={subject} /></div>
				<PlaceholderWarnings variant="dialog" />
				{#if error}<div role="alert" style="{note};background:var(--color-danger-soft);color:var(--bad)">{error}</div>{/if}
				{#if conflict}
					<div role="alert" style="{note};background:var(--warn-soft)">
						<span style="font-weight:700;color:var(--warn)">This template changed in Mailer since you opened it.</span> Saving now would replace the changes made in Mailer.
						<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
							<button class="btn" type="button" style="background:var(--bg)" onclick={() => (phase = 'reload')}>Reload from Mailer</button>
							<button class="btn" type="button" style="background:var(--bg)" onclick={() => save(true)}>Overwrite Mailer's copy</button>
						</div>
					</div>
				{/if}
				<div style="display:flex;justify-content:flex-end;gap:8px"><button class="btn" type="button" onclick={onclose}>Cancel</button><button class="btn btn-primary" type="button" onclick={() => save()} aria-disabled={!canSave} style={canSave ? '' : 'opacity:.45;pointer-events:none'}>{verb}</button></div>
			{/if}
		{:else if phase === 'reload'}
			<div style="display:flex;gap:8px;align-items:flex-start">
				<button class="icon-btn" type="button" onclick={() => (phase = 'form')} aria-label="Back" style="margin-left:-8px" disabled={reloading}><Icon name="arrow-left42" width={18} height={18} /></button>
				<div style="flex-grow:1"><h2 style="margin:0;font-size:20px;font-weight:700;letter-spacing:-.01em">Reload from Mailer</h2><p style="margin:5px 0 0;font-size:13.5px;line-height:1.5;color:var(--muted)">This replaces the template here with the version in Mailer. Edits made here since it was opened are discarded.</p></div>
			</div>
			<div style="display:flex;justify-content:flex-end;gap:8px"><button class="btn" type="button" onclick={() => (phase = 'form')} disabled={reloading}>Cancel</button><button class="btn" type="button" onclick={reloadFromMailer} disabled={reloading} style="background:var(--bad);color:#ffffff">{reloading ? 'Reloading' : 'Discard edits and reload'}</button></div>
		{:else if phase === 'saving'}
			<div role="status" style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:34px 0 26px"><span style="width:34px;height:34px;border-radius:50%;border:3px solid var(--s3);border-top-color:#ffd100;animation:ed-spin .8s linear infinite"></span><div style="font-size:17px;font-weight:700">Saving to Mailer</div><div style="font-size:13px;color:var(--muted)">Just a moment.</div></div>
		{:else}
			<div role="status" style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding-top:10px"><span style="width:56px;height:56px;border-radius:16px;display:grid;place-items:center;color:var(--ok);background:var(--ok-soft);animation:ed-pop .28s ease-out"><Icon name="tick-circle" width={26} height={26} /></span><div style="font-size:18px;font-weight:700;margin-top:8px">{result?.created === false ? 'Updated in Mailer' : 'Saved to Mailer'}</div><div style="font-size:13px;color:var(--muted)">{result?.name ?? name} is in your Mailer templates.</div></div>
			<div style="display:flex;flex-direction:column;gap:6px">
				<div class="cap" style="padding:0 2px 2px">Keep going</div>
				{#if onsend}<button class="opt" type="button" style="background:var(--s2);padding:12px 14px;font-size:13px" onclick={onsend}><span style="font-weight:600;flex-grow:1">Send a test email</span><span style="color:var(--muted);display:flex"><Icon name="arrow-right4" width={15} height={15} /></span></button>{/if}
				<a class="opt" style="background:var(--s2);padding:12px 14px;font-size:13px;text-decoration:none;color:var(--text)" href="{MAILER_URL}/broadcasts/new?template={encodeURIComponent(result?.mailerTemplateId ?? editor.mailerTemplateId)}" target="_blank" rel="noopener noreferrer"><span style="font-weight:600;flex-grow:1">Use it in a broadcast</span><span style="color:var(--muted);display:flex"><Icon name="arrow-right4" width={15} height={15} /></span></a>
				<a class="opt" style="background:var(--s2);padding:12px 14px;font-size:13px;text-decoration:none;color:var(--text)" href={result?.openUrl ?? `${MAILER_URL}/templates`} target="_blank" rel="noopener noreferrer"><span style="font-weight:600;flex-grow:1">Open in Mailer</span><span style="color:var(--muted);display:flex"><Icon name="arrow-right4" width={15} height={15} /></span></a>
			</div>
			<div style="display:flex;justify-content:flex-end"><button class="btn" type="button" onclick={onclose}>Done</button></div>
		{/if}
	</ModalFrame>
{/if}
