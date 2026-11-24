import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useAdminAuth } from '../auth';
import { attempt, Empty, fmtDate, Loading, PageHeader, Panel, phoneKey, Pill, Spinner, timeAgo } from '../shared';

const NEW_USER_DAYS = 7;

type Profile = {
  id: string; full_name: string | null; phone_no: string | null; email: string | null; app_role: string;
  company_id: string | null; company_name: string | null; is_premium: boolean; user_type: string | null;
  city: string | null; created_at: string;
};
type Company = { id: string; name: string };
type Role = 'user' | 'admin' | 'company_admin';

const ROLE_LABEL: Record<string, string> = { user: 'User', admin: 'Admin', company_admin: 'Company admin', company: 'Company' };
const ROLE_TONE: Record<string, 'slate' | 'blue' | 'green'> = { admin: 'blue', company_admin: 'green' };

export default function UsersPage() {
  const { session } = useAdminAuth();
  const [users, setUsers] = useState<Profile[] | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  // Last OTP request per number (last 30 days), keyed by phoneKey.
  const [lastOtp, setLastOtp] = useState<Map<string, string>>(new Map());
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editing, setEditing] = useState<Profile | null>(null);

  const load = useCallback(async () => {
    const since = new Date(Date.now() - 30 * 86400_000).toISOString();
    const [u, c, a] = await Promise.all([
      supabase.from('user_profiles').select('id, full_name, phone_no, email, app_role, company_id, company_name, is_premium, user_type, city, created_at')
        .order('created_at', { ascending: false }).limit(2000),
      supabase.from('companies').select('id, name').order('name'),
      supabase.from('otp_send_attempts').select('phone, requested_at').gte('requested_at', since)
        .order('requested_at', { ascending: false }).limit(2000),
    ]);
    setUsers((u.data as Profile[]) ?? []);
    setCompanies((c.data as Company[]) ?? []);
    const last = new Map<string, string>();
    for (const r of a.data ?? []) if (!last.has(phoneKey(r.phone))) last.set(phoneKey(r.phone), r.requested_at);
    setLastOtp(last);
  }, []);

  useEffect(() => { load(); }, [load]);

  const companyName = useMemo(() => new Map(companies.map((c) => [c.id, c.name])), [companies]);
  const filtered = (users ?? []).filter((u) => {
    if (roleFilter !== 'all' && u.app_role !== roleFilter) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return [u.full_name, u.email, u.phone_no, u.company_name, u.city].some((v) => (v ?? '').toLowerCase().includes(q));
  });

  const newSince = Date.now() - NEW_USER_DAYS * 86400_000;
  const newCount = (users ?? []).filter((u) => new Date(u.created_at).getTime() >= newSince).length;

  return (
    <>
      <PageHeader title="Users & roles" description="Everyone with an app account. Change a role here to make someone an admin or a company admin." />
      <Panel
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="relative sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input className="h-9 pl-8" placeholder="Name, phone, email, company" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-9 sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {Object.entries(ROLE_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
        title={users ? `${filtered.length} of ${users.length} users · ${newCount} new in ${NEW_USER_DAYS} days` : 'Users'}
      >
        {!users ? <Loading /> : filtered.length === 0 ? <Empty>No users match.</Empty> : (
          <div className="-mx-5 overflow-x-auto">
            <table className="stack-table w-full text-sm sm:min-w-[760px]">
              <thead className="border-y border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Phone</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Company</th>
                  <th className="px-3 py-2 font-medium">Joined</th>
                  <th className="px-5 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => {
                  const otpAt = u.phone_no ? lastOtp.get(phoneKey(u.phone_no)) : undefined;
                  const isNew = new Date(u.created_at).getTime() >= newSince;
                  return (
                    <tr key={u.id}>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-1.5 font-medium text-slate-900">
                          {u.full_name || 'Unnamed'}
                          {isNew && <Pill tone="green">new</Pill>}
                          {u.is_premium && <Pill tone="amber">premium</Pill>}
                          {u.id === session?.user.id && <Pill>you</Pill>}
                        </div>
                        <div className="text-xs text-slate-500">{[u.user_type, u.email, u.city].filter(Boolean).join(' · ')}</div>
                      </td>
                      <td data-label="Phone" className="whitespace-nowrap px-3 py-2.5">
                        <div>
                          <div className="font-mono text-xs">{u.phone_no || '—'}</div>
                          {otpAt && <span className="text-xs text-slate-500">last OTP {timeAgo(otpAt)}</span>}
                        </div>
                      </td>
                      <td data-label="Role" className="px-3 py-2.5"><Pill tone={ROLE_TONE[u.app_role] ?? 'slate'}>{ROLE_LABEL[u.app_role] ?? u.app_role}</Pill></td>
                      <td data-label="Company" className="px-3 py-2.5 text-slate-600">{(u.company_id && companyName.get(u.company_id)) || u.company_name || '—'}</td>
                      <td data-label="Joined" className="whitespace-nowrap px-3 py-2.5 text-slate-500">{fmtDate(u.created_at, false)}</td>
                      <td className="px-5 py-2.5 text-right max-sm:!pt-2.5">
                        <Button variant="outline" size="sm" className="max-sm:w-full" onClick={() => setEditing(u)}>Change role</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <RoleDialog user={editing} companies={companies} isSelf={editing?.id === session?.user.id}
        onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
    </>
  );
}

function RoleDialog({ user, companies, isSelf, onClose, onSaved }: {
  user: Profile | null; companies: Company[]; isSelf: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [role, setRole] = useState<Role>('user');
  const [companyId, setCompanyId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setRole((['user', 'admin', 'company_admin'].includes(user.app_role) ? user.app_role : 'user') as Role);
    setCompanyId(user.company_id ?? '');
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const ok = await attempt(
      () => supabase.rpc('admin_set_user_role', { p_user_id: user.id, p_role: role, p_company_id: role === 'company_admin' ? companyId : null }),
      'Role updated. The user sees it next time the app refreshes their profile.',
    );
    setSaving(false);
    if (ok) onSaved();
  }

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change role: {user?.full_name || user?.phone_no}</DialogTitle>
          <DialogDescription>Admins get this panel and the in-app admin tools. Company admins manage one company's products.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="company_admin">Company admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {role === 'company_admin' && (
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger><SelectValue placeholder="Pick a company" /></SelectTrigger>
                <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
              {companies.length === 0 && <p className="text-xs text-slate-500">Add a company first under Companies.</p>}
            </div>
          )}
          {isSelf && role !== 'admin' && <p className="rounded-md bg-red-50 p-2.5 text-sm text-red-700">You can't remove your own admin role.</p>}
          {role === 'admin' && user?.app_role !== 'admin' && (
            <p className="rounded-md bg-amber-50 p-2.5 text-sm text-amber-900">
              <UserCheck className="mr-1 inline h-4 w-4" /> This gives full control of the app's content and users.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} className="bg-slate-900 text-white hover:bg-slate-800"
            disabled={saving || (isSelf && role !== 'admin') || (role === 'company_admin' && !companyId)}>
            {saving && <Spinner className="mr-2" />} Save role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
