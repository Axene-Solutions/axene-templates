<script lang="ts">
	import { page } from '$app/state';
	import { editor, view } from '$lib/store.svelte';
	import { nudge } from '$lib/nudge.svelte';
	import Icon from '../Icon.svelte';
		import { CATEGORY_GROUPS, categoryLabel } from './categories';

	let catOpen = $state(false);
	let copied = $state(false);
	let copyTimer: ReturnType<typeof setTimeout> | undefined;

	const saving = $derived(editor.saveState === 'saving');
	const failed = $derived(editor.saveState === 'error' && editor.dirty);
	const saveLabel = $derived(saving ? 'Saving' : failed ? 'Retry save' : editor.dirty ? 'Save' : 'Saved');
	const saveMailerLabel = $derived(editor.mailerTemplateId ? 'Update in Mailer' : 'Save to Mailer');
	const isDesk = $derived(view.device === 'desktop');

	/** The Save button and the shortcut: after it works, the post-save bar may offer a next step. */
	export async function explicitSave() {
		catOpen = false;
		if (saving) return;
		if (await editor.saveTemplate()) nudge.offer((page.data.user as { id?: string } | null)?.id);
		else if (editor.saveError) view.say(editor.saveError);
	}

	async function copyHtml() {
		if (await editor.copyHtml()) {
			copied = true;
			view.say('HTML copied to the clipboard');
			clearTimeout(copyTimer);
			copyTimer = setTimeout(() => (copied = false), 1800);
		} else view.say(editor.compileError || 'Could not copy the HTML');
	}

	async function download() {
		if (await editor.downloadHtml()) view.say('Downloaded ' + editor.fileName());
		else view.say(editor.compileError || 'Could not build the HTML');
	}

	function openSave() {
		catOpen = false;
		nudge.hide();
		view.openModal('save');
	}
	function openSend() {
		catOpen = false;
		nudge.hide();
		view.openModal('send');
	}
	function togglePreview() {
		catOpen = false;
		view.setPreview(!view.preview);
	}
	function pickCat(v: string) {
		editor.templateCategory = v;
		catOpen = false;
	}
	function catKey(e: KeyboardEvent) {
		if (e.key === 'Escape' && catOpen) {
			e.preventDefault();
			e.stopPropagation();
			catOpen = false;
		}
	}
</script>

<header style="height:60px;display:flex;align-items:center;gap:8px;padding:0 16px;box-sizing:border-box;flex-shrink:0">
	<a class="icon-btn" href="/templates" aria-label="Back to templates"><Icon name="arrow-left42" width={18} height={18} /></a>
	<!-- The board's <img width="26" height="26">: the yellow mark is not square and is drawn
	     stretched to the box, without object-fit (the shared Logo component contains it). -->
	<img class="tb-logo tb-logo-light" src="/logos/axene_logo_black_square.webp" width="26" height="26" alt="Axene" />
	<img class="tb-logo tb-logo-dark" src="/logos/axene_logo_corrected.webp" width="26" height="26" alt="Axene" />
	<input class="field" type="text" aria-label="Template name" value={editor.templateName} oninput={(e) => { editor.templateName = e.currentTarget.value; nudge.hide(); }} maxlength="200" style="width:176px;background:transparent;font-size:15px;font-weight:700;padding:7px 9px" />
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div style="position:relative" onkeydown={catKey}>
		<button class="btn btn-ghost" type="button" onclick={() => (catOpen = !catOpen)} aria-haspopup="listbox" aria-expanded={catOpen} style="padding:6px 9px;font-size:12.5px">{categoryLabel(editor.templateCategory)} <Icon name="arrow-down4" width={12} height={12} /></button>
		{#if catOpen}
			<div role="listbox" aria-label="Category" style="position:absolute;left:0;top:40px;width:250px;max-height:420px;overflow:auto;background:var(--bg);border-radius:12px;padding:8px;box-shadow:0 18px 50px rgba(0,0,0,.28);z-index:40;display:flex;flex-direction:column;gap:1px">
				{#each CATEGORY_GROUPS as [group, opts] (group)}
					{#if group}<div class="cap" style="padding:8px 9px 4px">{group}</div>{/if}
					{#each opts as [v, label] (v)}
						{@const on = editor.templateCategory === v}
						<button class="opt" type="button" role="option" aria-selected={on} style={on ? 'background:var(--s2)' : ''} onclick={() => pickCat(v)}><span style="flex-grow:1">{label}</span>{#if on}<span style="display:flex;color:var(--text)"><Icon name="done" width={14} height={14} /></span>{/if}</button>
					{/each}
				{/each}
			</div>
		{/if}
	</div>
	<div style="flex-grow:1"></div>
	<button class="btn btn-ghost" type="button" onclick={() => editor.undo()} aria-label="Undo" style={editor.canUndo ? '' : 'opacity:.35;pointer-events:none'}><Icon name="undo-arrow" width={16} height={16} /><span class="kbd">⌘Z</span></button>
	<button class="btn btn-ghost" type="button" onclick={() => editor.redo()} aria-label="Redo" style={editor.canRedo ? '' : 'opacity:.35;pointer-events:none'}><Icon name="redo-arrow" width={16} height={16} /><span class="kbd" style="display:inline-flex;align-items:center;gap:1px" aria-label="Shift Command Z"><Icon name="arrow-up4" width={10} height={10} />⌘Z</span></button>
	<div class="segs" role="group" aria-label="Preview width" style="margin-left:6px; border-radius: 12px">
		<button class="seg" type="button" aria-label="Desktop" aria-pressed={isDesk} style="border-radius: 8px" onclick={() => (view.device = 'desktop')}><Icon name="monitor" width={16} height={16} /></button>
		<button class="seg" type="button" aria-label="Mobile" aria-pressed={!isDesk} style="border-radius: 8px" onclick={() => (view.device = 'mobile')}><Icon name="mobile" width={16} height={16} /></button>
	</div>
	<button class="btn" type="button" onclick={togglePreview} style={view.preview ? 'background:var(--text);color:var(--bg)' : ''}>
		{#if view.preview}<Icon name="pencil" width={15} height={15} />Edit{:else}<Icon name="eye" width={15} height={15} />Preview{/if}
	</button>
	<div style="flex-grow:1"></div>
	<button class="btn btn-ghost" type="button" onclick={explicitSave} aria-label={editor.dirty ? 'Save now' : 'All changes saved'} title={failed ? editor.saveError : undefined} style={editor.dirty ? 'background:var(--s2);color:var(--text)' : ''}>
		{#if saving}<span style="width:12px;height:12px;border-radius:50%;border:2px solid var(--s3);border-top-color:var(--text);animation:ed-spin .8s linear infinite"></span>{/if}
		{#if !editor.dirty && !saving}<span style="display:flex;color:var(--ok)"><Icon name="tick-circle" width={15} height={15} /></span>{/if}
		{saveLabel}<span class="kbd">⌘S</span>
	</button>
	<button class="btn btn-ghost" type="button" onclick={copyHtml}><Icon name="copy" width={15} height={15} />{copied ? 'Copied' : 'Copy HTML'}</button>
	<button class="icon-btn" type="button" onclick={download} aria-label="Download HTML"><Icon name="arrow-down4" width={17} height={17} /></button>
	<button class="btn" type="button" onclick={openSave}><Icon name="email" width={15} height={15} />{saveMailerLabel}</button>
	<button class="btn btn-primary" type="button" onclick={openSend}><Icon name="send" width={15} height={15} />Send</button>
</header>

<style>
	.tb-logo { display: block; width: 26px; height: 26px; max-width: none; }
	.tb-logo-dark { display: none; }
	:global([data-theme='dark']) .tb-logo-light { display: none; }
	:global([data-theme='dark']) .tb-logo-dark { display: block; }
</style>
