import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Mail, Phone, ShieldOff, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { attempt, Confirm, Empty, fmtDate, Loading, PageHeader, Panel, Pill, Spinner, timeAgo } from '../shared';

// Shapes returned by community_verification_list()
// (backend migration 20261119120000_community_verification.sql).
type Profile = {
  full_name: string | null; phone_no: string | null; email: string | null;
  company_name: string | null; department: string | null; designation: string | null;
  user_type: string | null; address_line: string | null; city: string | null;
  state: string | null; pincode: string | null; country: string | null;
  profile_pic_url?: string | null; member_since: string | null;
};

type Ticket = {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_at: string | null;
  admin_note: string | null;
  reviewer: string | null;
  user_id: string;
  verified_at: string | null;
  snapshot: Profile;
  profile: Profile;
};

const TABS = [
  { key: 'pending', label: 'Waiting' },
  { key: 'approved', label: 'Verified' },
  { key: 'rejected', label: 'Rejected' },
] as const;

/** The app's verified mark: a rounded hexagon in the brand blue with a check. */
export function VerifiedMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Verified" role="img">
      <defs>
        <linearGradient id="vm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6A7DB3" />
          <stop offset="1" stopColor="#2E3D5C" />
        </linearGradient>
      </defs>
      <polygon points="22.4,6 22.4,18 12,24 1.6,18 1.6,6 12,0" transform="translate(12 12) scale(0.92) translate(-12 -12)"
        fill="url(#vm)" stroke="url(#vm)" strokeWidth="2.4" strokeLinejoin="round" />
      <polygon points="19.7,7.6 19.7,16.4 12,20.9 4.3,16.4 4.3,7.6 12,3.1"
        fill="none" stroke="white" strokeOpacity="0.32" strokeWidth="0.9" strokeLinejoin="round" />
      <path d="M8.4 12.2 L11.2 15 L16 9.4" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Verification() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('pending');
  const [rows, setRows] = useState<Ticket[] | null>(null);
  const [reviewing, setReviewing] = useState<{ ticket: Ticket; approve: boolean } | null>(null);

  const load = useCallback(async () => {
    setRows(null);
    const { data, error } = await supabase.rpc('community_verification_list', { p_status: tab, p_limit: 200 });
    if (error) toast.error(error.message);
    setRows((data as Ticket[]) ?? []);
  }, [tab]);
  useEffect(() => { load(); }, [load]);

  return (
    <>
      <PageHeader
        title="Verification"
        description="Members ask to be verified before they can start Community threads. Call them on the number below, confirm the details, then verify or reject. Verified members get the badge next to their name."
      />
      <div className="mb-4 flex gap-1 rounded-lg border border-slate-200 bg-white p-1 sm:w-fit">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium sm:flex-none ${tab === t.key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {!rows ? <Panel><Loading /></Panel> : rows.length === 0 ? (
        <Panel><Empty>{tab === 'pending' ? 'No one is waiting for verification.' : 'Nothing here.'}</Empty></Panel>
      ) : (
        <div className="space-y-4">
          {rows.map((t) => (
            <TicketCard key={t.id} t={t} onReview={(approve) => setReviewing({ ticket: t, approve })} onChanged={load} />
          ))}
        </div>
      )}

      <ReviewDialog
        state={reviewing}
        onClose={() => setReviewing(null)}
        onDone={() => { setReviewing(null); load(); }}
      />
    </>
  );
}

function TicketCard({ t, onReview, onChanged }: {
  t: Ticket; onReview: (approve: boolean) => void; onChanged: () => void;
}) {
  const p = t.profile;
  const phone = p.phone_no?.trim();
  const address = [p.address_line, p.city, p.state, p.pincode, p.country].filter((x) => x && x.trim()).join(', ');
  const changed = t.status === 'pending' && JSON.stringify(stripVolatile(t.snapshot)) !== JSON.stringify(stripVolatile(p));

  return (
    <Panel>
      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {p.profile_pic_url
              ? <img src={p.profile_pic_url} alt="" className="h-10 w-10 rounded-full object-cover" />
              : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                  {(p.full_name || '?').trim().charAt(0).toUpperCase()}
                </div>}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                {p.full_name || 'No name'}
                {t.verified_at && <VerifiedMark size={16} />}
              </div>
              <div className="text-sm text-slate-500">
                {[p.designation, p.company_name].filter(Boolean).join(' · ') || 'No role or company'}
              </div>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <Field label="Phone">
              {phone ? (
                <span className="flex items-center gap-2">
                  <a href={`tel:${phone}`} className="font-medium text-slate-900 underline-offset-2 hover:underline">{phone}</a>
                  <button aria-label="Copy phone number" className="text-slate-400 hover:text-slate-700"
                    onClick={() => { navigator.clipboard.writeText(phone); toast.success('Phone number copied'); }}>
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </span>
              ) : '—'}
            </Field>
            <Field label="Email">
              {p.email ? <a href={`mailto:${p.email}`} className="text-slate-900 hover:underline">{p.email}</a> : '—'}
            </Field>
            <Field label="Company">{p.company_name || '—'}</Field>
            <Field label="Department">{p.department || '—'}</Field>
            <Field label="Designation">{p.designation || '—'}</Field>
            <Field label="Account type">{p.user_type || '—'}</Field>
            <Field label="Address" wide>{address || '—'}</Field>
            <Field label="Member since">{fmtDate(p.member_since, false)}</Field>
            <Field label="Requested">{fmtDate(t.requested_at)} <span className="text-slate-400">({timeAgo(t.requested_at)})</span></Field>
          </dl>

          {changed && (
            <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
              The profile changed after the request. Shown above is the current profile.
            </p>
          )}
          {t.status !== 'pending' && (
            <p className="mt-3 text-xs text-slate-500">
              {t.status === 'approved' ? 'Verified' : 'Rejected'} {fmtDate(t.reviewed_at)}{t.reviewer ? ` by ${t.reviewer}` : ''}
              {t.admin_note ? ` · “${t.admin_note}”` : ''}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-row flex-wrap gap-2 lg:w-44 lg:flex-col">
          {t.status === 'pending' && (
            <>
              {phone && (
                <Button asChild variant="outline">
                  <a href={`tel:${phone}`}><Phone className="mr-2 h-4 w-4" /> Call</a>
                </Button>
              )}
              <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => onReview(true)}>
                <Check className="mr-2 h-4 w-4" /> Verify
              </Button>
              <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={() => onReview(false)}>
                <X className="mr-2 h-4 w-4" /> Reject
              </Button>
            </>
          )}
          {t.status === 'approved' && t.verified_at && (
            <Confirm
              trigger={<Button variant="outline" className="text-red-600 hover:text-red-700"><ShieldOff className="mr-2 h-4 w-4" /> Remove badge</Button>}
              title={`Remove ${p.full_name || 'this member'}'s verification?`}
              description="The badge disappears and they can no longer start threads. They can still reply, and can ask to be verified again."
              confirmLabel="Remove" destructive
              onConfirm={async () => {
                if (await attempt(() => supabase.rpc('community_revoke_verification', { p_user: t.user_id }), 'Verification removed')) onChanged();
              }}
            />
          )}
          {t.status === 'approved' && !t.verified_at && <Pill tone="amber">badge removed</Pill>}
          {p.email && t.status !== 'pending' && (
            <Button asChild variant="ghost" size="sm"><a href={`mailto:${p.email}`}><Mail className="mr-2 h-4 w-4" /> Email</a></Button>
          )}
        </div>
      </div>
    </Panel>
  );
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-slate-800">{children}</dd>
    </div>
  );
}

function stripVolatile(p: Profile) {
  const { profile_pic_url: _pic, member_since: _since, ...rest } = p;
  return rest;
}

function ReviewDialog({ state, onClose, onDone }: {
  state: { ticket: Ticket; approve: boolean } | null; onClose: () => void; onDone: () => void;
}) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { setNote(''); }, [state]);
  if (!state) return null;
  const { ticket, approve } = state;
  const name = ticket.profile.full_name || 'this member';

  async function submit() {
    if (!approve && !note.trim()) {
      toast.error('Write the reason: the member sees it in the app.');
      return;
    }
    setBusy(true);
    const ok = await attempt(
      () => supabase.rpc('community_review_verification', { p_id: ticket.id, p_approve: approve, p_note: note.trim() || null }),
      approve ? `${name} is verified` : 'Request rejected',
    );
    setBusy(false);
    if (ok) onDone();
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o && !busy) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {approve && <VerifiedMark size={20} />}
            {approve ? `Verify ${name}?` : `Reject ${name}'s request?`}
          </DialogTitle>
          <DialogDescription>
            {approve
              ? 'They get the verified badge next to their name and can start Community threads.'
              : 'They stay unverified and see your reason in the app. They can update their profile and ask again.'}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder={approve ? 'Note for the team (optional), e.g. "Called 19 Nov, confirmed with HR"' : 'Reason shown to the member, e.g. "Could not reach you on this number"'}
        />
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button disabled={busy} onClick={submit}
            className={approve ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-red-600 text-white hover:bg-red-700'}>
            {busy && <Spinner className="mr-2" />}
            {approve ? 'Verify' : 'Reject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
