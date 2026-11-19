import { useCallback, useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { attempt, Empty, Loading, PageHeader, Panel, Pill, timeAgo } from '../shared';

// Table home_tiles (backend migration 20261119140000_home_tiles.sql).
type Tile = {
  key: string;
  label: string;
  sort: number;
  visible_for_free: boolean;
  updated_at: string;
};

export default function HomeTiles() {
  const [rows, setRows] = useState<Tile[] | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('home_tiles')
      .select('key, label, sort, visible_for_free, updated_at')
      .order('sort');
    setRows((data as Tile[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function toggle(t: Tile, on: boolean) {
    setSaving(t.key);
    // Show the change at once; reload puts it back if the save fails.
    setRows((r) => r?.map((x) => (x.key === t.key ? { ...x, visible_for_free: on } : x)) ?? r);
    await attempt(
      () => supabase.from('home_tiles').update({ visible_for_free: on }).eq('key', t.key),
      `${t.label} ${on ? 'shown to' : 'hidden from'} free users`,
    );
    setSaving(null);
    load();
  }

  const hiddenCount = rows?.filter((t) => !t.visible_for_free).length ?? 0;

  return (
    <>
      <PageHeader
        title="Home tiles"
        description="Choose which Home screen tiles free users see. Paid, company and admin accounts always see every tile. Changes reach the app the next time Home opens or the app comes back to the foreground; no app update needed."
      />
      <Panel
        title="Free users"
        description={rows ? `${rows.length - hiddenCount} shown · ${hiddenCount} hidden` : undefined}
      >
        {!rows ? <Loading /> : rows.length === 0 ? <Empty>No tiles found.</Empty> : (
          <div className="divide-y divide-slate-100">
            {rows.map((t) => (
              <label key={t.key} htmlFor={`tile-${t.key}`}
                className="flex cursor-pointer items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-medium text-slate-900">
                    {t.label}
                    {t.visible_for_free ? <Pill tone="green">shown</Pill> : <Pill>hidden</Pill>}
                  </div>
                  <div className="text-xs text-slate-400">changed {timeAgo(t.updated_at)}</div>
                </div>
                <Switch
                  id={`tile-${t.key}`}
                  checked={t.visible_for_free}
                  disabled={saving === t.key}
                  onCheckedChange={(on) => toggle(t, on)}
                  aria-label={`Show ${t.label} to free users`}
                />
              </label>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
