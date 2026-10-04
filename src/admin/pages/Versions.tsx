import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, History, RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { attempt, Confirm, fmtDate, Loading, PageHeader, Panel, Pill, Spinner } from '../shared';

type Version = {
  id: string; platform: 'android' | 'ios' | 'web';
  min_required_version: string; latest_version: string; update_type: 'flexible' | 'immediate';
  is_active: boolean; store_url: string | null; message_title: string | null; message_body: string | null; updated_at: string;
};
type Audit = { id: number; action: string; old_data: Version | null; new_data: Version | null; created_at: string; actor_id: string | null };

const EDITABLE = ['min_required_version', 'latest_version', 'update_type', 'is_active', 'store_url', 'message_title', 'message_body'] as const;
const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.icopedia.app';
const VERSION_RE = /^\d+(\.\d+){0,3}$/;

/** Same rules as VersionCheckService._compareVersions in the app. */
function cmp(a: string, b: string) {
  const pa = a.split(/[-+]/)[0].split('.').map((s) => parseInt(s, 10) || 0);
  const pb = b.split(/[-+]/)[0].split('.').map((s) => parseInt(s, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return Math.sign(d);
  }
  return 0;
}

export default function Versions() {
  const [rows, setRows] = useState<Version[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const { data } = await supabase.from('app_versions').select('*').order('platform');
    setRows((data as Version[]) ?? []);
  }, []);

  useEffect(() => {
    load();
    supabase.from('user_profiles').select('id, full_name').eq('app_role', 'admin')
      .then(({ data }) => setNames(Object.fromEntries((data ?? []).map((p) => [p.id, p.full_name || 'Admin']))));
  }, [load]);

  return (
    <>
      <PageHeader
        title="App versions"
        description={
          <>
            Controls the update prompt in the app. Users below <b>Minimum version</b> must update before they can continue.
            Users below <b>Latest version</b> see an optional "Update available" prompt when the update type is Flexible.
            Every save is kept in history and can be restored.
          </>
        }
      />
      {!rows ? <Loading /> : (
        <div className="space-y-6">
          {rows.map((r) => <PlatformCard key={r.id} row={r} names={names} onSaved={load} />)}
        </div>
      )}
    </>
  );
}

function PlatformCard({ row, names, onSaved }: { row: Version; names: Record<string, string>; onSaved: () => void }) {
  const [draft, setDraft] = useState(row);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<Audit[] | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  useEffect(() => setDraft(row), [row]);

  const loadHistory = useCallback(async () => {
    const { data } = await supabase.from('admin_audit_log').select('id, action, old_data, new_data, created_at, actor_id')
      .eq('table_name', 'app_versions').eq('row_id', row.id).order('created_at', { ascending: false }).limit(50);
    setHistory((data as Audit[]) ?? []);
  }, [row.id]);

  useEffect(() => { if (showHistory) loadHistory(); }, [showHistory, loadHistory, row.updated_at]);

  const set = <K extends keyof Version>(k: K, v: Version[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const dirty = EDITABLE.some((k) => (draft[k] ?? '') !== (row[k] ?? ''));
  const errors: string[] = [];
  if (!VERSION_RE.test(draft.latest_version)) errors.push('Latest version must look like 1.2.3');
  if (!VERSION_RE.test(draft.min_required_version)) errors.push('Minimum version must look like 1.2.3');
  if (!errors.length && cmp(draft.min_required_version, draft.latest_version) > 0) errors.push('Minimum version can’t be higher than latest');
  const wrongPackage = row.platform === 'android' && !!draft.store_url && !draft.store_url.includes('id=com.icopedia.app');
  const forcing = cmp(draft.min_required_version, row.min_required_version) > 0;

  async function save(values: Partial<Version>, message = 'Saved. Apps pick this up on next launch.') {
    setSaving(true);
    const patch = Object.fromEntries(EDITABLE.map((k) => [k, values[k] ?? null]).filter(([, v]) => v !== undefined));
    const ok = await attempt(() => supabase.from('app_versions').update(patch).eq('id', row.id), message);
    setSaving(false);
    if (ok) onSaved();
  }

  const saveButton = (onClick?: () => void) => (
    <Button disabled={!dirty || saving || errors.length > 0} onClick={onClick} className="bg-slate-900 text-white hover:bg-slate-800">
      {saving ? <Spinner className="mr-2" /> : <Save className="mr-2 h-4 w-4" />} Save
    </Button>
  );

  return (
    <Panel
      title={{ android: 'Android', ios: 'iOS', web: 'Web' }[row.platform]}
      description={`Last changed ${fmtDate(row.updated_at)}`}
      actions={
        <div className="flex items-center gap-2">
          {!row.is_active && <Pill tone="amber">checks off</Pill>}
          <Button variant="outline" size="sm" onClick={() => setShowHistory((s) => !s)}>
            <History className="mr-1.5 h-4 w-4" /> History
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <F label="Latest version"><Input value={draft.latest_version} onChange={(e) => set('latest_version', e.target.value.trim())} /></F>
        <F label="Minimum version (forced)"><Input value={draft.min_required_version} onChange={(e) => set('min_required_version', e.target.value.trim())} /></F>
        <F label="Update type">
          <div className="flex h-10 items-center gap-1 rounded-md border border-slate-200 p-1">
            {(['flexible', 'immediate'] as const).map((t) => (
              <button key={t} type="button" onClick={() => set('update_type', t)}
                className={`flex-1 rounded px-2 py-1 text-sm capitalize ${draft.update_type === t ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                {t}
              </button>
            ))}
          </div>
        </F>
        <F label="Version check on">
          <div className="flex h-10 items-center"><Switch checked={draft.is_active} onCheckedChange={(v) => set('is_active', v)} /></div>
        </F>
        <div className="sm:col-span-2 lg:col-span-4">
          <F label="Store link">
            <Input value={draft.store_url ?? ''} onChange={(e) => set('store_url', e.target.value)} />
          </F>
          {wrongPackage && (
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-red-700">
              <AlertTriangle className="h-3.5 w-3.5" /> The app's package is com.icopedia.app, so this link opens a missing Play Store page.
              <button className="font-medium underline" onClick={() => set('store_url', PLAY_URL)}>Use the correct link</button>
            </p>
          )}
        </div>
        <div className="sm:col-span-2"><F label="Prompt title"><Input value={draft.message_title ?? ''} onChange={(e) => set('message_title', e.target.value)} /></F></div>
        <div className="sm:col-span-2"><F label="Prompt message"><Textarea rows={2} value={draft.message_body ?? ''} onChange={(e) => set('message_body', e.target.value)} /></F></div>
      </div>

      <div className="mt-4 flex flex-col-reverse items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="text-xs">
          {errors.map((e) => <p key={e} className="text-red-600">{e}</p>)}
          {!errors.length && forcing && <p className="text-amber-700">Raising the minimum version blocks everyone on an older build until they update.</p>}
        </div>
        <div className="flex gap-2">
          {dirty && <Button variant="ghost" onClick={() => setDraft(row)}>Discard</Button>}
          {forcing && !errors.length ? (
            <Confirm trigger={saveButton()} title={`Force update to ${draft.min_required_version}?`}
              description={`Anyone on ${row.platform} below ${draft.min_required_version} will be blocked until they update. Make sure that build is live in the store first.`}
              confirmLabel="Force update" destructive onConfirm={() => save(draft)} />
          ) : (
            saveButton(() => save(draft))
          )}
        </div>
      </div>

      {showHistory && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">History</h3>
          {!history ? <Loading /> : history.length === 0 ? (
            <p className="text-sm text-slate-500">No changes recorded yet. History starts with the first save from this panel.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {history.map((h) => {
                const before = h.old_data;
                const after = h.new_data;
                const changed = EDITABLE.filter((k) => before && after && (before[k] ?? '') !== (after[k] ?? ''));
                return (
                  <div key={h.id} className="flex flex-col gap-2 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-slate-500">{fmtDate(h.created_at)} · {h.actor_id ? names[h.actor_id] ?? 'Admin' : 'system'}</div>
                      <div className="mt-0.5 space-y-0.5">
                        {changed.length === 0 && <span className="text-slate-500">{h.action.toLowerCase()}</span>}
                        {changed.map((k) => (
                          <div key={k}>
                            <span className="text-slate-500">{k.replace(/_/g, ' ')}: </span>
                            <s className="text-slate-400">{String(before?.[k] ?? '—')}</s> → <b>{String(after?.[k] ?? '—')}</b>
                          </div>
                        ))}
                      </div>
                    </div>
                    {before && (
                      <Confirm
                        trigger={<Button variant="outline" size="sm"><RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restore before</Button>}
                        title="Restore the values from before this change?"
                        description={`Sets latest ${before.latest_version}, minimum ${before.min_required_version}, ${before.update_type}.`}
                        confirmLabel="Restore"
                        onConfirm={() => save(before, 'Restored')}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
