import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Building2, ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { attempt, Confirm, Empty, friendlyError, Loading, PageHeader, Panel, Pill, Spinner } from '../shared';

type Company = {
  id: string; name: string; domain: string | null; logo_url: string | null; max_members: number | null;
  is_active: boolean; is_deactivated: boolean; created_at: string;
};
type Admin = { company_id: string; user_id: string; user_profiles: { full_name: string | null; phone_no: string | null } | null };

const MAX_LOGO_MB = 5;
const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

async function uploadLogo(file: File) {
  if (file.size > MAX_LOGO_MB * 1024 * 1024) throw new Error(`Logo must be under ${MAX_LOGO_MB} MB`);
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const path = `${Date.now()}_${slug(file.name.replace(/\.[^.]+$/, '')) || 'logo'}.${ext}`;
  const { error } = await supabase.storage.from('company-logos').upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return supabase.storage.from('company-logos').getPublicUrl(path).data.publicUrl;
}

export default function Companies() {
  const [rows, setRows] = useState<Company[] | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [name, setName] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [visible, setVisible] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);

  const load = useCallback(async () => {
    const [c, a] = await Promise.all([
      supabase.from('companies').select('*').order('name'),
      supabase.from('company_admins').select('company_id, user_id, user_profiles(full_name, phone_no)'),
    ]);
    setRows((c.data as Company[]) ?? []);
    setAdmins((a.data as unknown as Admin[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const logo_url = logo ? await uploadLogo(logo) : null;
      const { error } = await supabase.from('companies').insert({
        name: name.trim(), domain: slug(name), logo_url, is_active: visible, is_deactivated: false,
      });
      if (error) throw error;
      toast.success('Company added');
      setName(''); setLogo(null); setVisible(true);
      load();
    } catch (err) {
      toast.error(friendlyError(err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  }

  async function patch(c: Company, values: Partial<Company>) {
    setRows((rs) => rs?.map((r) => (r.id === c.id ? { ...r, ...values } : r)) ?? null);
    if (!(await attempt(() => supabase.from('companies').update(values).eq('id', c.id)))) load();
  }

  return (
    <>
      <PageHeader title="Companies" description="Manufacturers shown in the app's product directory. Hidden companies stay visible to admins only. Deactivated ones are hidden from everyone in the app." />

      <Panel title="Add a company" className="mb-6">
        <form onSubmit={add} className="grid items-center gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <Input placeholder="Company name" value={name} onChange={(e) => setName(e.target.value)} />
          <LogoPicker file={logo} onChange={setLogo} />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <Switch checked={visible} onCheckedChange={setVisible} /> Visible in app
          </label>
          <Button type="submit" disabled={saving || !name.trim()} className="bg-slate-900 text-white hover:bg-slate-800">
            {saving ? <Spinner className="mr-2" /> : <Plus className="mr-2 h-4 w-4" />} Add
          </Button>
        </form>
      </Panel>

      <Panel title={rows ? `${rows.length} companies` : 'Companies'}>
        {!rows ? <Loading /> : rows.length === 0 ? <Empty>No companies yet.</Empty> : (
          <div className="grid gap-3 md:grid-cols-2">
            {rows.map((c) => {
              const cAdmins = admins.filter((a) => a.company_id === c.id);
              return (
                <div key={c.id} className={`rounded-lg border border-slate-200 p-4 ${c.is_deactivated ? 'bg-slate-50' : ''}`}>
                  <div className="flex items-start gap-3">
                    {c.logo_url
                      ? <img src={c.logo_url} alt="" className="h-11 w-11 shrink-0 rounded-md border border-slate-100 object-contain" />
                      : <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-100"><Building2 className="h-5 w-5 text-slate-400" /></div>}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium text-slate-900">{c.name}</span>
                        {c.is_deactivated ? <Pill tone="red">deactivated</Pill> : c.is_active ? <Pill tone="green">visible</Pill> : <Pill tone="amber">hidden</Pill>}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {cAdmins.length
                          ? `Admin: ${cAdmins.map((a) => a.user_profiles?.full_name || a.user_profiles?.phone_no || 'user').join(', ')}`
                          : 'No company admin. Assign one under Users & roles.'}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => setEditing(c)}><Pencil className="h-4 w-4 text-slate-400" /></Button>
                    <Confirm
                      trigger={<Button variant="ghost" size="icon" aria-label="Delete"><Trash2 className="h-4 w-4 text-slate-400" /></Button>}
                      title={`Delete ${c.name}?`}
                      description="Removes its company admins, invitations and member history. Its products, BOQs, reports and members stay but lose the company link. This can't be undone. To take it out of the app but keep everything, use Deactivate instead."
                      confirmLabel="Delete company" destructive
                      onConfirm={async () => { if (await attempt(() => supabase.from('companies').delete().eq('id', c.id), 'Company deleted')) load(); }}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-100 pt-3 text-sm">
                    <label className="flex items-center gap-2 text-slate-600">
                      <Switch checked={c.is_active} disabled={c.is_deactivated} onCheckedChange={(v) => patch(c, { is_active: v })} /> Visible to app users
                    </label>
                    <label className="flex items-center gap-2 text-slate-600">
                      <Switch checked={c.is_deactivated}
                        onCheckedChange={(v) => patch(c, { is_deactivated: v, is_active: v ? false : c.is_active })} /> Deactivated
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <EditDialog company={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
    </>
  );
}

function LogoPicker({ file, onChange }: { file: File | null; onChange: (f: File | null) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
      <ImagePlus className="h-4 w-4" />
      <span className="max-w-[160px] truncate">{file ? file.name : 'Logo (optional)'}</span>
      <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
    </label>
  );
}

function EditDialog({ company, onClose, onSaved }: { company: Company | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [maxMembers, setMaxMembers] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (company) { setName(company.name); setMaxMembers(String(company.max_members ?? 30)); setLogo(null); }
  }, [company]);

  async function save() {
    if (!company) return;
    setSaving(true);
    try {
      const values: Partial<Company> = { name: name.trim(), max_members: Math.max(1, parseInt(maxMembers, 10) || 30) };
      if (logo) values.logo_url = await uploadLogo(logo);
      const { error } = await supabase.from('companies').update(values).eq('id', company.id);
      if (error) throw error;
      toast.success('Saved');
      onSaved();
    } catch (err) {
      toast.error(friendlyError(err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!company} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit {company?.name}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Max team members</Label><Input type="number" min={1} value={maxMembers} onChange={(e) => setMaxMembers(e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label>Logo</Label>
            <div className="flex items-center gap-3">
              {company?.logo_url && !logo && <img src={company.logo_url} alt="" className="h-10 w-10 rounded border object-contain" />}
              <LogoPicker file={logo} onChange={setLogo} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving || !name.trim()} className="bg-slate-900 text-white hover:bg-slate-800">
            {saving && <Spinner className="mr-2" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
