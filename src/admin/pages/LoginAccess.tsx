import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import {
  attempt, Confirm, Empty, isE164, Loading, normalizePhone, PageHeader, Panel, phoneKey, Pill, Spinner, timeAgo,
} from '../shared';

type Row = { id: string; phone: string; description: string | null; is_active: boolean; created_at: string };
type Profile = { id: string; full_name: string | null; phone_no: string | null; app_role: string };

// Fake numbers (no SIM) only work if Supabase Auth also maps them to a fixed
// code; real numbers get a real SMS via MSG91. See send-sms-hook.
const FAKE_PREFIX = '+9199999';

export default function LoginAccess() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [attempts, setAttempts] = useState<{ phone: string; requested_at: string }[]>([]);
  const [phone, setPhone] = useState('');
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    const since = new Date(Date.now() - 30 * 86400_000).toISOString();
    const [a, b, c] = await Promise.all([
      supabase.from('test_phone_numbers').select('*').order('created_at', { ascending: false }),
      supabase.from('user_profiles').select('id, full_name, phone_no, app_role'),
      supabase.from('otp_send_attempts').select('phone, requested_at').gte('requested_at', since)
        .order('requested_at', { ascending: false }).limit(1000),
    ]);
    setRows((a.data as Row[]) ?? []);
    setProfiles((b.data as Profile[]) ?? []);
    setAttempts(c.data ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const profileByPhone = useMemo(() => new Map(profiles.map((p) => [phoneKey(p.phone_no), p])), [profiles]);
  const lastAttempt = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of attempts) if (!m.has(a.phone)) m.set(a.phone, a.requested_at);
    return m;
  }, [attempts]);

  const normalized = normalizePhone(phone);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!isE164(normalized)) return;
    setSaving(true);
    const ok = await attempt(
      () => supabase.from('test_phone_numbers').insert({ phone: normalized, description: label.trim() || null, is_active: true }),
      `${normalized} can now log in`,
    );
    setSaving(false);
    if (ok) {
      setPhone('');
      setLabel('');
      load();
    }
  }

  async function update(row: Row, patch: Partial<Row>) {
    setRows((rs) => rs?.map((r) => (r.id === row.id ? { ...r, ...patch } : r)) ?? null);
    const ok = await attempt(() => supabase.from('test_phone_numbers').update(patch).eq('id', row.id));
    if (!ok) load();
  }

  const filtered = (rows ?? []).filter((r) => {
    if (!query) return true;
    const q = query.toLowerCase();
    const p = profileByPhone.get(phoneKey(r.phone));
    return r.phone.includes(q.replace(/\s/g, '')) || (r.description ?? '').toLowerCase().includes(q) || (p?.full_name ?? '').toLowerCase().includes(q);
  });

  return (
    <>
      <PageHeader
        title="Login access"
        description="The app only sends an OTP to numbers on this list. Add a number here and that person can sign in right away. No app update needed."
        actions={
          <Button variant="outline" asChild>
            <a href="/admin/otp-viewer" target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Test OTP viewer</a>
          </Button>
        }
      />

      <Panel title="Allow a new number" className="mb-6">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <Input placeholder="Mobile number, e.g. 98765 43210" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            {phone && (
              <p className={`mt-1 text-xs ${isE164(normalized) ? 'text-slate-500' : 'text-red-600'}`}>
                {isE164(normalized) ? `Will be saved as ${normalized}` : 'Not a valid number yet'}
              </p>
            )}
          </div>
          <Input placeholder="Name / note (e.g. Ravi – sales demo)" value={label} onChange={(e) => setLabel(e.target.value)} />
          <Button type="submit" disabled={saving || !isE164(normalized)} className="bg-slate-900 text-white hover:bg-slate-800">
            {saving ? <Spinner className="mr-2" /> : <Plus className="mr-2 h-4 w-4" />} Allow login
          </Button>
        </form>
        {normalized.startsWith(FAKE_PREFIX) && (
          <p className="mt-3 rounded-md bg-amber-50 p-2.5 text-xs text-amber-900">
            This looks like a fake test number. No SMS can reach it, so it also needs a fixed code under Supabase → Authentication →
            Phone → Test OTP. Otherwise it is locked out.
          </p>
        )}
      </Panel>

      <Panel
        title={`Allowed numbers${rows ? ` (${rows.filter((r) => r.is_active).length} active)` : ''}`}
        actions={
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input className="h-9 pl-8" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        }
      >
        {!rows ? <Loading /> : filtered.length === 0 ? <Empty>No numbers match.</Empty> : (
          <div className="-mx-5 overflow-x-auto">
            <table className="stack-table w-full text-sm sm:min-w-[640px]">
              <thead className="border-y border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-2 font-medium">Number</th>
                  <th className="px-3 py-2 font-medium">Note</th>
                  <th className="px-3 py-2 font-medium">App account</th>
                  <th className="px-3 py-2 font-medium">Last OTP</th>
                  <th className="px-3 py-2 font-medium">Can log in</th>
                  <th className="px-5 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => {
                  const p = profileByPhone.get(phoneKey(r.phone));
                  return (
                    <tr key={r.id} className={r.is_active ? '' : 'text-slate-400'}>
                      <td className="whitespace-nowrap px-5 py-2.5 font-mono max-sm:font-semibold">{r.phone}</td>
                      <td data-label="Note" className="px-3 py-2.5">
                        <NoteCell value={r.description ?? ''} onSave={(description) => update(r, { description: description || null })} />
                      </td>
                      <td data-label="App account" className="px-3 py-2.5">
                        {p ? (
                          <span className="flex items-center gap-1.5">
                            {p.full_name || 'Unnamed'}
                            {p.app_role !== 'user' && <Pill tone="blue">{p.app_role.replace('_', ' ')}</Pill>}
                          </span>
                        ) : <span className="text-slate-400">not signed up yet</span>}
                      </td>
                      <td data-label="Last OTP" className="whitespace-nowrap px-3 py-2.5 text-slate-500">{timeAgo(lastAttempt.get(r.phone))}</td>
                      <td data-label="Can log in" className="px-3 py-2.5">
                        <Switch checked={r.is_active} onCheckedChange={(v) => update(r, { is_active: v })} aria-label="Can log in" />
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <Confirm
                          trigger={<Button variant="ghost" size="icon" aria-label="Remove"><Trash2 className="h-4 w-4 text-slate-400" /></Button>}
                          title={`Remove ${r.phone}?`}
                          description="They won't be able to request a new login code. Anyone already signed in stays signed in. To pause access without losing the note, switch it off instead."
                          confirmLabel="Remove" destructive
                          onConfirm={async () => {
                            if (await attempt(() => supabase.from('test_phone_numbers').delete().eq('id', r.id), 'Removed')) load();
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}

function NoteCell({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <input
      className="w-full rounded border sm:min-w-[140px] max-sm:-ml-1.5 border-transparent bg-transparent px-1.5 py-1 hover:border-slate-200 focus:border-slate-300 focus:bg-white focus:outline-none"
      value={draft}
      placeholder="Add note"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => draft.trim() !== value && onSave(draft.trim())}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
    />
  );
}
