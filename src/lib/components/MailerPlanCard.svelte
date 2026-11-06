<script lang="ts">
	import { onMount } from 'svelte';
	import { mailer } from '$lib/mailer.svelte';
	import { mailerData } from '$lib/mailer-data.svelte';
	import { PRICING_URL, daysLeft, meterLine, templatesLine, type Meter, type PlanSummary } from '$lib/mailer-plan';
	import Icon from './Icon.svelte';

	// The Mailer plan and the numbers that matter. `compact` is the Save dialog version.
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
	function expiry(p: PlanSummary): { text: string; warn: boolean } | null {
		const d = daysLeft(p.expiresAt);
		if (d === null) return null;
		const date = new Date(p.expiresAt as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
		if (d < 0) return { text: `Expired on ${date}`, warn: true };
		if (d <= 7) return { text: `Expires ${date} (${d} day${d === 1 ? '' : 's'} left)`, warn: true };
		return { text: `Expires ${date}`, warn: false };
	}
	const name = (p: PlanSummary) => p.name.charAt(0).toUpperCase() + p.name.slice(1);
</script>

{#snippet bar(label: string, m: Meter)}
	<div class="pc-meter">
		<div class="pc-line">{meterLine(label, m)}</div>
		{#if m.limit !== null}
			<div class="pc-track" role="progressbar" aria-label={label} aria-valuemin="0" aria-valuemax={m.limit} aria-valuenow={Math.min(m.used, m.limit)}>
				<div class="pc-fill pc-{tone(m.used, m.limit)}" style="width: {pct(m.used, m.limit)}%"></div>
			</div>
		{/if}
	</div>
{/snippet}

<div class="pc" class:pc-compact={compact}>
	{#if st === 'loading' || st === 'idle'}
		<p class="pc-muted" role="status">Loading your Mailer plan...</p>
	{:else if st === 'ready' && plan}
		{@const ex = expiry(plan)}
		<div class="pc-head">
			<span class="pc-name">{name(plan)} plan</span>
			{#if ex}<span class="pc-expiry" class:pc-warn-text={ex.warn}>{ex.text}</span>{/if}
		</div>

		<div class:pc-tiles={!compact}>
		<div class="pc-meter">
			<div class="pc-line">{templatesLine(plan)}</div>
			{#if plan.templates.used !== null && plan.templates.limit !== null && !plan.templates.unlimited}
				<div class="pc-track" role="progressbar" aria-label="Templates used" aria-valuemin="0" aria-valuemax={plan.templates.limit} aria-valuenow={Math.min(plan.templates.used, plan.templates.limit)}>
					<div class="pc-fill pc-{tone(plan.templates.used, plan.templates.limit)}" style="width: {pct(plan.templates.used, plan.templates.limit)}%"></div>
				</div>
			{/if}
			{#if plan.templates.used === null}<div class="pc-muted">Counting templates needs the Read templates scope on your key.</div>{/if}
		</div>

		{#if !compact}
			{#if plan.daily}{@render bar('Sent today', plan.daily)}{/if}
			{#if plan.monthly}{@render bar('Sent this month', plan.monthly)}{/if}
		{/if}
		</div>
		{#if !compact}
			{#if plan.featuresOff.length}
				<div class="pc-off">
					<span class="pc-muted">Not on your plan:</span>
					{#each plan.featuresOff as f (f.key)}<span class="pc-chip">{f.label}</span>{/each}
				</div>
			{/if}
		{/if}

		{#if plan.upgradeReason && showUpgrade}
			<div class="pc-upgrade" role="status">
				<span>{plan.upgradeReason}</span>
				<a class="pc-link" href={PRICING_URL} target="_blank" rel="noopener noreferrer">Upgrade in Mailer</a>
			</div>
		{/if}
	{:else if st === 'not_linked'}
		<p class="pc-muted">Link Mailer to see your plan.</p>
	{:else}
		<div class="pc-err" role="alert">
			<Icon name="warning" width={14} height={14} />
			<span>{mailerData.planMessage || 'Could not load your Mailer plan.'}</span>
			<button type="button" class="pc-retry" onclick={() => mailerData.loadPlan(true)}>Try again</button>
		</div>
	{/if}
</div>

<style>
	.pc { display: flex; flex-direction: column; gap: 10px; font-size: 13px; color: var(--color-text); }
	.pc-compact { gap: 8px; padding: 10px 12px; border: 1px solid var(--color-border-1); border-radius: 8px; background: var(--color-bg); margin-bottom: 4px; }
	.pc-tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; }
	.pc:not(.pc-compact) .pc-meter { padding: 12px 14px; border-radius: 10px; background: var(--color-bg); }
	.pc-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 12px; }
	.pc-name { font-weight: 600; }
	.pc-expiry { font-size: 12px; color: var(--color-muted); }
	.pc-warn-text { color: var(--color-danger); font-weight: 600; }
	.pc-muted { color: var(--color-muted); font-size: 12px; margin: 0; }
	.pc-line { font-size: 12.5px; margin-bottom: 4px; }
	.pc-track { height: 6px; border-radius: 99px; background: var(--color-border-1); overflow: hidden; }
	.pc-fill { height: 100%; border-radius: 99px; background: var(--color-success); }
	.pc-near { background: var(--color-accent); }
	.pc-full { background: var(--color-danger); }
	.pc-off { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; }
	.pc-chip { font-size: 11px; padding: 1px 8px; border-radius: 99px; background: var(--color-surface-2); border: 1px solid var(--color-border-1); color: var(--color-muted); }
	.pc-upgrade { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 12px; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--color-accent); background: var(--color-accent-soft); color: var(--color-accent-ink); line-height: 1.4; }
	.pc-link { font-weight: 600; text-decoration: underline; color: inherit; white-space: nowrap; }
	.pc-err { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--color-danger); background: var(--color-danger-soft); color: var(--color-danger); }
	.pc-retry { margin-left: auto; background: none; border: 1px solid currentColor; color: inherit; border-radius: 6px; padding: 2px 8px; font: inherit; font-weight: 600; cursor: pointer; }
</style>
