<script lang="ts">
	import { onMount } from 'svelte';
	import { mailer } from '$lib/mailer.svelte';
	import { mailerData } from '$lib/mailer-data.svelte';
	import { PRICING_URL, daysLeft, type Meter, type PlanSummary } from '$lib/mailer-plan';
	import Icon from './Icon.svelte';

	// The Mailer plan and the numbers that matter. `compact` is the Save dialog version.
	// The full version follows the Settings board and renders its own heading row.
	let { compact = false, showUpgrade = true }: { compact?: boolean; showUpgrade?: boolean } = $props();

	onMount(() => {
		if (mailer.status === 'connected') mailerData.loadPlan();
	});
	$effect(() => {
		if (mailer.status === 'connected') mailerData.loadPlan();
	});

	const plan = $derived(mailerData.plan);
	const st = $derived(mailerData.planState);

	function pct(used: number, limit: number | null): number {
		return limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
	}
	function tone(used: number, limit: number | null): 'ok' | 'near' | 'full' {
		if (!limit) return 'ok';
		return used >= limit ? 'full' : used / limit >= 0.8 ? 'near' : 'ok';
	}
	const toneColor = { ok: 'var(--color-success)', near: 'var(--color-warn)', full: 'var(--color-danger)' } as const;
	function expiry(p: PlanSummary): { text: string; warn: boolean } | null {
		const d = daysLeft(p.expiresAt);
		if (d === null) return null;
		const date = new Date(p.expiresAt as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
		if (d < 0) return { text: `Expired on ${date}`, warn: true };
		if (d <= 7) return { text: `Expires ${date} (${d} day${d === 1 ? '' : 's'} left)`, warn: true };
		return { text: `Expires ${date}`, warn: false };
	}
	const name = (p: PlanSummary) => p.name.charAt(0).toUpperCase() + p.name.slice(1);

	function templatesValue(p: PlanSummary): string {
		const t = p.templates;
		if (t.used === null) return t.unlimited ? 'Unlimited' : 'Unknown';
		if (t.unlimited) return `${t.used} used, unlimited`;
		if (t.limit === null) return `${t.used} saved`;
		return `${t.used} of ${t.limit}`;
	}
	const meterValue = (m: Meter) => (m.limit === null ? `${m.used.toLocaleString('en')} sent, no limit` : `${m.used.toLocaleString('en')} of ${m.limit.toLocaleString('en')}`);
</script>

{#snippet tile(label: string, value: string, bar: { used: number; limit: number } | null, hint: string)}
	<div style="padding:14px 16px;border-radius:12px;background:var(--color-bg);display:flex;flex-direction:column;gap:8px">
		<div style="font-size:12.5px;color:var(--color-muted);font-weight:500">{label}</div>
		<div style="font-size:19px;font-weight:700;letter-spacing:-.01em">{value}</div>
		{#if bar}
			<div role="progressbar" aria-label={label} aria-valuemin="0" aria-valuemax="100" aria-valuenow={pct(bar.used, bar.limit)} style="height:6px;border-radius:4px;background:var(--color-surface-3);overflow:hidden">
				<div style="height:100%;border-radius:4px;width:{pct(bar.used, bar.limit)}%;background:{toneColor[tone(bar.used, bar.limit)]}"></div>
			</div>
		{/if}
		{#if hint}<div style="font-size:12px;line-height:1.45;color:var(--color-muted)">{hint}</div>{/if}
	</div>
{/snippet}

{#if compact}
	<div class="pc-compact">
		{#if st === 'loading' || st === 'idle'}
			<p class="pc-muted" role="status">Loading your Mailer plan...</p>
		{:else if st === 'ready' && plan}
			{@const ex = expiry(plan)}
			<div class="pc-head">
				<span class="pc-name">{name(plan)} plan</span>
				{#if ex}<span class="pc-expiry" class:pc-warn-text={ex.warn}>{ex.text}</span>{/if}
			</div>
			<div>
				<div class="pc-line">Templates: {templatesValue(plan)}</div>
				{#if plan.templates.used !== null && plan.templates.limit !== null && !plan.templates.unlimited}
					<div class="pc-track" role="progressbar" aria-label="Templates used" aria-valuemin="0" aria-valuemax={plan.templates.limit} aria-valuenow={Math.min(plan.templates.used, plan.templates.limit)}>
						<div class="pc-fill" style="width:{pct(plan.templates.used, plan.templates.limit)}%;background:{toneColor[tone(plan.templates.used, plan.templates.limit)]}"></div>
					</div>
				{/if}
				{#if plan.templates.used === null}<div class="pc-muted">Counting templates needs the Read templates scope on your key.</div>{/if}
			</div>
			{#if plan.upgradeReason && showUpgrade}
				<div class="pc-upgrade" role="status">
					<span>{plan.upgradeReason}</span>
					<a class="dz-btn dz-btn-sm" href={PRICING_URL} target="_blank" rel="noopener noreferrer">Upgrade in Mailer</a>
				</div>
			{/if}
		{:else if st === 'not_linked'}
			<p class="pc-muted">Link Mailer to see your plan.</p>
		{:else}
			<div class="dz-note dz-note-bad" role="alert">
				<Icon name="danger" width={14} height={14} />
				<span>{mailerData.planMessage || 'Could not load your Mailer plan.'}</span>
				<button type="button" class="dz-btn dz-btn-sm" onclick={() => mailerData.loadPlan(true)}>Try again</button>
			</div>
		{/if}
	</div>
{:else}
	<div class="pc">
		<div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px">
			<div style="flex-grow:1">
				<div style="font-size:16px;font-weight:700">Mailer plan</div>
				<div style="font-size:13px;color:var(--color-muted);margin-top:2px">What your Mailer account allows, live from Mailer.</div>
			</div>
			{#if st === 'ready' && plan}
				{@const ex = expiry(plan)}
				<span style="font-size:13px;font-weight:600">{name(plan)} plan</span>
				{#if ex}<span style="font-size:12.5px;font-weight:600;color:{ex.warn ? 'var(--color-warn)' : 'var(--color-muted)'}">{ex.text}</span>{/if}
			{/if}
		</div>

		{#if st === 'loading' || st === 'idle'}
			<p class="pc-muted" role="status">Loading your Mailer plan...</p>
		{:else if st === 'ready' && plan}
			<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px">
				{@render tile(
					'Templates',
					templatesValue(plan),
					plan.templates.used !== null && plan.templates.limit !== null && !plan.templates.unlimited ? { used: plan.templates.used, limit: plan.templates.limit } : null,
					plan.templates.used === null ? 'Counting templates needs the Read templates scope on your key.' : ''
				)}
				{#if plan.daily}{@render tile('Sent today', meterValue(plan.daily), plan.daily.limit !== null ? { used: plan.daily.used, limit: plan.daily.limit } : null, '')}{/if}
				{#if plan.monthly}{@render tile('Sent this month', meterValue(plan.monthly), plan.monthly.limit !== null ? { used: plan.monthly.used, limit: plan.monthly.limit } : null, '')}{/if}
			</div>
			{#if plan.featuresOff.length}
				<div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px">
					<span style="font-size:12.5px;color:var(--color-muted);margin-right:4px">Not on your plan:</span>
					{#each plan.featuresOff as f (f.key)}<span class="dz-badge" style="background:var(--color-bg);color:var(--color-muted);font-size:12px;padding:4px 10px">{f.label}</span>{/each}
				</div>
			{/if}
			{#if plan.upgradeReason && showUpgrade}
				<div role="status" style="display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;padding:12px 14px;border-radius:12px;background:var(--color-bg);font-size:13px">
					<span style="flex-grow:1">{plan.upgradeReason}</span>
					<a class="dz-btn dz-btn-sm" href={PRICING_URL} target="_blank" rel="noopener noreferrer">Upgrade in Mailer</a>
				</div>
			{/if}
		{:else if st === 'not_linked'}
			<p class="pc-muted">Link Mailer to see your plan.</p>
		{:else}
			<div class="dz-note dz-note-bad" role="alert">
				<Icon name="danger" width={16} height={16} />
				<span style="flex-grow:1">{mailerData.planMessage || 'Could not load your Mailer plan.'}</span>
				<button type="button" class="dz-btn dz-btn-sm" onclick={() => mailerData.loadPlan(true)}>Try again</button>
			</div>
		{/if}
	</div>
{/if}

<style>
	.pc { display: flex; flex-direction: column; gap: 16px; color: var(--color-text); font-family: var(--font-sans); }
	.pc-compact { display: flex; flex-direction: column; gap: 8px; padding: 10px 12px; border-radius: 8px; background: var(--color-bg); margin-bottom: 4px; font-size: 13px; color: var(--color-text); }
	.pc-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 12px; }
	.pc-name { font-weight: 600; }
	.pc-expiry { font-size: 12px; color: var(--color-muted); }
	.pc-warn-text { color: var(--color-warn); font-weight: 600; }
	.pc-muted { color: var(--color-muted); font-size: 12px; margin: 0; }
	.pc-line { font-size: 12.5px; margin-bottom: 4px; }
	.pc-track { height: 6px; border-radius: 4px; background: var(--color-surface-3); overflow: hidden; }
	.pc-fill { height: 100%; border-radius: 4px; }
	.pc-upgrade { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 12px; padding: 8px 10px; border-radius: 8px; background: var(--color-accent-soft); color: var(--color-accent-ink); line-height: 1.4; }
</style>
