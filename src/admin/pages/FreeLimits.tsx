import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { attempt, Empty, Loading, PageHeader, Panel, Pill, Spinner, timeAgo } from '../shared';

// Table usage_limits (backend migrations 20261119160000_boq_limit_settings,
// 20261119170000_boq_limits_into_usage_limits and
// 20261121140000_free_user_products). Only the features listed in ENFORCED
// are checked by the server today; the table's other rows belong to the
// retired trial system.
//   boq_create    - per day or per week; default_limit is the per-day number.
//   user_products - a total, not per period: how many products a free user
//                   may keep. default_limit is that number.
const ENFORCED: Record<string, string> = {
  boq_create: 'Bill of Quantities',
  user_products: 'Products',
};

type Limit = {
  feature: string;
  label: string;
  enabled: boolean;
  period: 'daily' | 'weekly';
  daily_limit: number;
  weekly_limit: number;
  updated_at: string;
};

type Row = {
  feature_key: string; enabled: boolean; period: 'daily' | 'weekly';
  default_limit: number; weekly_limit: number; updated_at: string;
};

export default function FreeLimits() {
  const [rows, setRows] = useState<Limit[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('usage_limits')
      .select('feature_key, enabled, period, default_limit, weekly_limit, updated_at')
      .in('feature_key', Object.keys(ENFORCED))
      .order('feature_key');
    // Say why instead of looking like nothing is set up.
    setError(error ? error.message : null);
    setRows(((data as Row[]) ?? []).map((r) => ({
      feature: r.feature_key,
      label: ENFORCED[r.feature_key] ?? r.feature_key,
      enabled: r.enabled,
      period: r.period,
      daily_limit: r.default_limit,
      weekly_limit: r.weekly_limit,
      updated_at: r.updated_at,
    })));
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <>
      <PageHeader
        title="Free user limits"
        description="How much free users can create. Paid, company and admin accounts have no limit. Changes apply on the server straight away; no app update needed."
      />
      {error ? (
        <Panel><Empty>Could not load the limits: {error}</Empty></Panel>
      ) : !rows ? <Panel><Loading /></Panel> : rows.length === 0 ? (
        <Panel><Empty>The limit rows (usage_limits: boq_create, user_products) are missing on the server.</Empty></Panel>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => r.feature === 'user_products'
            ? <ProductLimitCard key={r.feature} row={r} onSaved={load} />
            : <LimitCard key={r.feature} row={r} onSaved={load} />)}
        </div>
      )}
    </>
  );
}

function LimitCard({ row, onSaved }: { row: Limit; onSaved: () => void }) {
  const [enabled, setEnabled] = useState(row.enabled);
  const [period, setPeriod] = useState(row.period);
  const [daily, setDaily] = useState(String(row.daily_limit));
  const [weekly, setWeekly] = useState(String(row.weekly_limit));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEnabled(row.enabled); setPeriod(row.period);
    setDaily(String(row.daily_limit)); setWeekly(String(row.weekly_limit));
  }, [row]);

  const d = Number(daily);
  const w = Number(weekly);
  const dailyOk = Number.isInteger(d) && d >= 1 && d <= 1000;
  const weeklyOk = Number.isInteger(w) && w >= 1 && w <= 5000;
  const dirty = enabled !== row.enabled || period !== row.period
    || d !== row.daily_limit || w !== row.weekly_limit;
  const valid = dailyOk && weeklyOk;

  const summary = !enabled
    ? `Free users can create as many ${row.label} as they like.`
    : period === 'daily'
      ? `Free users can create ${dailyOk ? d : '…'} new ${row.label} per day. Resets every midnight (India time).`
      : `Free users can create ${weeklyOk ? w : '…'} new ${row.label} per week. Resets every Monday at midnight (India time).`;

  async function save() {
    setSaving(true);
    const ok = await attempt(
      () => supabase.from('usage_limits')
        .update({ enabled, period, default_limit: d, weekly_limit: w })
        .eq('feature_key', row.feature),
      `${row.label} limit saved`,
    );
    setSaving(false);
    if (ok) onSaved();
  }

  return (
    <Panel
      title={row.label}
      description={`Changed ${timeAgo(row.updated_at)}`}
      actions={enabled ? <Pill tone="amber">limited</Pill> : <Pill tone="green">unlimited</Pill>}
    >
      <div className="space-y-5">
        <label htmlFor={`${row.feature}-on`} className="flex cursor-pointer items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-slate-900">Limit free users</div>
            <div className="text-xs text-slate-500">Off means no limit at all.</div>
          </div>
          <Switch id={`${row.feature}-on`} checked={enabled} onCheckedChange={setEnabled} />
        </label>

        <div className={enabled ? '' : 'pointer-events-none opacity-50'}>
          <div className="text-sm font-medium text-slate-900">Count per</div>
          <div className="mt-2 inline-flex gap-1 rounded-lg border border-slate-200 bg-white p-1" role="radiogroup" aria-label="Count per">
            {(['daily', 'weekly'] as const).map((p) => (
              <button key={p} type="button" role="radio" aria-checked={period === p} onClick={() => setPeriod(p)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium ${period === p ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                {p === 'daily' ? 'Day' : 'Week'}
              </button>
            ))}
          </div>

          <div className="mt-4 grid max-w-md grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`${row.feature}-daily`} className={period === 'daily' ? '' : 'text-slate-400'}>Per day</Label>
              <Input id={`${row.feature}-daily`} type="number" min={1} max={1000} inputMode="numeric"
                value={daily} onChange={(e) => setDaily(e.target.value)} className="mt-1" aria-invalid={!dailyOk} />
              {!dailyOk && <p className="mt-1 text-xs text-red-600">1 to 1000</p>}
            </div>
            <div>
              <Label htmlFor={`${row.feature}-weekly`} className={period === 'weekly' ? '' : 'text-slate-400'}>Per week</Label>
              <Input id={`${row.feature}-weekly`} type="number" min={1} max={5000} inputMode="numeric"
                value={weekly} onChange={(e) => setWeekly(e.target.value)} className="mt-1" aria-invalid={!weeklyOk} />
              {!weeklyOk && <p className="mt-1 text-xs text-red-600">1 to 5000</p>}
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">Only the number for the chosen period is used; the other is kept for when you switch.</p>
        </div>

        <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">{summary}</div>

        <div className="flex gap-2">
          <Button disabled={!dirty || !valid || saving} onClick={save} className="bg-slate-900 text-white hover:bg-slate-800">
            {saving && <Spinner className="mr-2" />} Save
          </Button>
          {dirty && (
            <Button variant="ghost" disabled={saving} onClick={() => {
              setEnabled(row.enabled); setPeriod(row.period);
              setDaily(String(row.daily_limit)); setWeekly(String(row.weekly_limit));
            }}>Undo</Button>
          )}
        </div>
        <p className="text-xs text-slate-400">
          Switching between day and week keeps counting: BOQs already made today count toward the week, and the other way round.
        </p>
      </div>
    </Panel>
  );
}

/**
 * How many products a free user may keep in the app. Calculator saves
 * (Coverage, Quantity, DFT to WFT) and products typed in Product Details
 * count together. A total, not per day or week.
 */
function ProductLimitCard({ row, onSaved }: { row: Limit; onSaved: () => void }) {
  const [enabled, setEnabled] = useState(row.enabled);
  const [limit, setLimit] = useState(String(row.daily_limit));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEnabled(row.enabled); setLimit(String(row.daily_limit));
  }, [row]);

  const n = Number(limit);
  const valid = Number.isInteger(n) && n >= 1 && n <= 1000;
  const dirty = enabled !== row.enabled || n !== row.daily_limit;
  const lowered = enabled && valid && (n < row.daily_limit || !row.enabled);

  const summary = !enabled
    ? 'Free users can keep as many products as they like.'
    : `Free users can keep up to ${valid ? n : '…'} products. Once they reach it, new calculations aren't saved and they can't add products until they delete one.`;

  async function save() {
    setSaving(true);
    const ok = await attempt(
      () => supabase.from('usage_limits')
        .update({ enabled, default_limit: n })
        .eq('feature_key', row.feature),
      'Product limit saved',
    );
    setSaving(false);
    if (ok) onSaved();
  }

  return (
    <Panel
      title={row.label}
      description={`Changed ${timeAgo(row.updated_at)}`}
      actions={enabled ? <Pill tone="amber">limited</Pill> : <Pill tone="green">unlimited</Pill>}
    >
      <div className="space-y-5">
        <p className="text-sm text-slate-600">
          Free users' own products in the app's Product Details. Calculations saved from
          Coverage, Quantity and DFT to WFT and products they type in count together.
        </p>

        <label htmlFor={`${row.feature}-on`} className="flex cursor-pointer items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-slate-900">Limit free users</div>
            <div className="text-xs text-slate-500">Off means no limit at all.</div>
          </div>
          <Switch id={`${row.feature}-on`} checked={enabled} onCheckedChange={setEnabled} />
        </label>

        <div className={`max-w-[12rem] ${enabled ? '' : 'pointer-events-none opacity-50'}`}>
          <Label htmlFor={`${row.feature}-limit`}>Products per user</Label>
          <Input id={`${row.feature}-limit`} type="number" min={1} max={1000} inputMode="numeric"
            value={limit} onChange={(e) => setLimit(e.target.value)} className="mt-1" aria-invalid={!valid} />
          {!valid && <p className="mt-1 text-xs text-red-600">1 to 1000</p>}
        </div>

        <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">{summary}</div>

        {lowered && dirty && (
          <p className="text-xs text-amber-700">
            Lowering the limit deletes nothing. Users already over it keep their products but can't add more until they're under it.
          </p>
        )}

        <div className="flex gap-2">
          <Button disabled={!dirty || !valid || saving} onClick={save} className="bg-slate-900 text-white hover:bg-slate-800">
            {saving && <Spinner className="mr-2" />} Save
          </Button>
          {dirty && (
            <Button variant="ghost" disabled={saving} onClick={() => {
              setEnabled(row.enabled); setLimit(String(row.daily_limit));
            }}>Undo</Button>
          )}
        </div>
        <p className="text-xs text-slate-400">Applies straight away; the app picks it up the next time it syncs.</p>
      </div>
    </Panel>
  );
}
