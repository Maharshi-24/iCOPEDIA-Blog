import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { attempt, Confirm, Empty, fmtDate, Loading, PageHeader, Panel, Spinner } from '../shared';

type Org = { id: string; domain: string; created_at: string };

const DOMAIN_RE = /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/;
const clean = (v: string) => v.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/^.*@/, '').replace(/\/.*$/, '');

export default function Organizations() {
  const [rows, setRows] = useState<Org[] | null>(null);
  const [domain, setDomain] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('organizations').select('*').order('domain');
    setRows((data as Org[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const value = clean(domain);
  const valid = DOMAIN_RE.test(value);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    const ok = await attempt(() => supabase.from('organizations').insert({ domain: value }), `${value} allowed`);
    setSaving(false);
    if (ok) { setDomain(''); load(); }
  }

  return (
    <>
      <PageHeader title="Allowed organization domains" description="Email domains of organizations allowed to register as a company (the in-app “Domain Management” tab)." />
      <Panel className="mb-6" title="Allow a domain">
        <form onSubmit={add} className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Input placeholder="e.g. hempel.com or name@hempel.com" value={domain} onChange={(e) => setDomain(e.target.value)} />
            {domain && !valid && <p className="mt-1 text-xs text-red-600">Not a valid domain</p>}
            {domain && valid && value !== domain.trim() && <p className="mt-1 text-xs text-slate-500">Will be saved as {value}</p>}
          </div>
          <Button type="submit" disabled={!valid || saving} className="bg-slate-900 text-white hover:bg-slate-800">
            {saving ? <Spinner className="mr-2" /> : <Plus className="mr-2 h-4 w-4" />} Allow
          </Button>
        </form>
      </Panel>
      <Panel title="Allowed">
        {!rows ? <Loading /> : rows.length === 0 ? <Empty>No domains allowed yet.</Empty> : (
          <div className="divide-y divide-slate-100">
            {rows.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2.5 text-sm">
                <div><span className="font-mono">{o.domain}</span><span className="ml-3 text-xs text-slate-400">added {fmtDate(o.created_at, false)}</span></div>
                <Confirm
                  trigger={<Button variant="ghost" size="icon" aria-label="Remove"><Trash2 className="h-4 w-4 text-slate-400" /></Button>}
                  title={`Remove ${o.domain}?`} confirmLabel="Remove" destructive
                  onConfirm={async () => { if (await attempt(() => supabase.from('organizations').delete().eq('id', o.id), 'Removed')) load(); }}
                />
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
