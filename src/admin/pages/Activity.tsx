import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Empty, fmtDate, Loading, PageHeader, Panel, Pill } from '../shared';

type Entry = {
  id: number; table_name: string; row_id: string | null; action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: Record<string, unknown> | null; new_data: Record<string, unknown> | null; actor_id: string | null; created_at: string;
};

const TABLES: Record<string, string> = {
  test_phone_numbers: 'Login access', app_versions: 'App versions', notifications: 'Notifications',
  user_profiles: 'User roles', companies: 'Companies', company_admins: 'Company admins',
  organizations: 'Domains', tutorial_videos: 'Tutorial videos', news_articles: 'News',
};
const NOISE = new Set(['updated_at', 'created_at']);
const PAGE = 50;

/** One-line label for the affected row, whatever table it came from. */
function label(e: Entry) {
  const d = e.new_data ?? e.old_data ?? {};
  return String(d.phone ?? d.title ?? d.name ?? d.domain ?? d.platform ?? d.full_name ?? e.row_id ?? '');
}

function changes(e: Entry) {
  if (e.action !== 'UPDATE' || !e.old_data || !e.new_data) return [];
  return Object.keys(e.new_data).filter((k) => !NOISE.has(k) && JSON.stringify(e.old_data![k]) !== JSON.stringify(e.new_data![k]));
}

const show = (v: unknown) => (v === null || v === undefined || v === '' ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v));

export default function ActivityLog() {
  const [rows, setRows] = useState<Entry[] | null>(null);
  const [table, setTable] = useState('all');
  const [names, setNames] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<number | null>(null);
  const [more, setMore] = useState(false);

  const load = useCallback(async (append = false, before?: number) => {
    let q = supabase.from('admin_audit_log').select('*').order('id', { ascending: false }).limit(PAGE);
    if (table !== 'all') q = q.eq('table_name', table);
    if (before) q = q.lt('id', before);
    const { data } = await q;
    const list = (data as Entry[]) ?? [];
    setRows((prev) => (append && prev ? [...prev, ...list] : list));
    setMore(list.length === PAGE);
  }, [table]);

  useEffect(() => { setRows(null); load(); }, [load]);
  useEffect(() => {
    supabase.from('user_profiles').select('id, full_name, phone_no').in('app_role', ['admin', 'company_admin'])
      .then(({ data }) => setNames(Object.fromEntries((data ?? []).map((p) => [p.id, p.full_name || p.phone_no || 'Admin']))));
  }, []);

  return (
    <>
      <PageHeader
        title="Change history"
        description="Every change to login access, app versions, notifications, roles, companies, domains, videos and news, with the full before and after."
        actions={
          <Select value={table} onValueChange={setTable}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Everything</SelectItem>
              {Object.entries(TABLES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />
      <Panel>
        {!rows ? <Loading /> : rows.length === 0 ? <Empty>No changes recorded yet.</Empty> : (
          <div className="divide-y divide-slate-100">
            {rows.map((e) => {
              const diff = changes(e);
              const expanded = open === e.id;
              return (
                <div key={e.id} className="py-2.5 text-sm">
                  <button className="flex w-full items-start gap-2 text-left" onClick={() => setOpen(expanded ? null : e.id)}>
                    {expanded ? <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> : <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Pill tone={e.action === 'INSERT' ? 'green' : e.action === 'DELETE' ? 'red' : 'blue'}>
                          {{ INSERT: 'added', UPDATE: 'changed', DELETE: 'deleted' }[e.action]}
                        </Pill>
                        <span className="text-slate-500">{TABLES[e.table_name] ?? e.table_name}</span>
                        <span className="truncate font-medium text-slate-900">{label(e)}</span>
                      </div>
                      {diff.length > 0 && !expanded && (
                        <div className="mt-0.5 truncate text-xs text-slate-500">
                          {diff.slice(0, 3).map((k) => `${k.replace(/_/g, ' ')}: ${show(e.old_data![k])} → ${show(e.new_data![k])}`).join(' · ')}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right text-xs text-slate-500">
                      <div>{fmtDate(e.created_at)}</div>
                      <div>{e.actor_id ? names[e.actor_id] ?? 'user' : 'system'}</div>
                    </div>
                  </button>
                  {expanded && (
                    <div className="ml-6 mt-2 overflow-x-auto rounded-md bg-slate-50 p-3 text-xs">
                      {e.action === 'UPDATE' ? (
                        <table className="w-full">
                          <tbody>
                            {diff.map((k) => (
                              <tr key={k} className="align-top">
                                <td className="py-0.5 pr-3 font-medium text-slate-600">{k}</td>
                                <td className="py-0.5 pr-3 text-red-700 line-through">{show(e.old_data![k])}</td>
                                <td className="py-0.5 text-emerald-700">{show(e.new_data![k])}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <pre className="whitespace-pre-wrap break-all text-slate-700">{JSON.stringify(e.new_data ?? e.old_data, null, 2)}</pre>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {more && rows && (
          <div className="mt-3 text-center">
            <Button variant="outline" size="sm" onClick={() => load(true, rows[rows.length - 1].id)}>Load older</Button>
          </div>
        )}
      </Panel>
    </>
  );
}
