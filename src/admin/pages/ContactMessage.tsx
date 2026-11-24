import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Copy, Mail, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { attempt, Confirm, Empty, fmtDate, Loading, Panel, Spinner } from '../shared';
import type { ComposeRequest } from './Email';
import { contactChanged, STATUSES, StatusPill, SUBMISSION_COLUMNS, type Status, type Submission } from './contactShared';

/** One contact message: what they sent, plus the team's status and notes. */
export default function ContactMessage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [row, setRow] = useState<Submission | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('new');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('contact_submissions')
      .select(SUBMISSION_COLUMNS).eq('id', Number(id)).maybeSingle();
    setError(error ? error.message : null);
    const r = (data as Submission | null) ?? null;
    setRow(r);
    if (r) { setStatus(r.status); setNotes(r.notes ?? ''); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const back = (
    <Link to="/admin/contact" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
      <ChevronLeft className="h-4 w-4" /> Contact messages
    </Link>
  );

  if (error) return <>{back}<Panel className="mt-4"><Empty>Could not load the message: {error}</Empty></Panel></>;
  if (row === undefined) return <>{back}<Panel className="mt-4"><Loading /></Panel></>;
  if (row === null) return <>{back}<Panel className="mt-4"><Empty>This message doesn't exist any more.</Empty></Panel></>;

  const dirty = status !== row.status || notes.trim() !== (row.notes ?? '');

  const save = async () => {
    setSaving(true);
    const ok = await attempt(
      () => supabase.from('contact_submissions')
        .update({ status, notes: notes.trim() || null })
        .eq('id', row.id),
      'Saved',
    );
    setSaving(false);
    if (ok) { await load(); contactChanged(); }
  };

  const remove = async () => {
    if (await attempt(() => supabase.from('contact_submissions').delete().eq('id', row.id), 'Deleted')) {
      contactChanged();
      navigate('/admin/contact');
    }
  };

  const field = (label: string, value: React.ReactNode) => (
    <div>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-0.5 break-words text-slate-900">{value || '—'}</dd>
    </div>
  );

  return (
    <>
      {back}
      <div className="mb-6 mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900">{row.name}</h1>
          <StatusPill status={row.status} />
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button onClick={() => navigate('/admin/email', { state: { compose: replyRequest(row) } })}>
            <Mail className="mr-1.5 h-4 w-4" /> Reply by email
          </Button>
          <Button variant="outline" onClick={async () => {
            try {
              await navigator.clipboard.writeText(row.email);
              toast.success('Email copied');
            } catch {
              toast.error(`Could not copy. The address is ${row.email}`);
            }
          }}>
            <Copy className="mr-1.5 h-4 w-4" /> Copy email
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <Panel title="Details">
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {field('You are', row.role)}
            {field('Company', row.company)}
            {field('Email', <a href={`mailto:${row.email}`} className="underline-offset-2 hover:underline">{row.email}</a>)}
            {field('Received', fmtDate(row.created_at))}
          </dl>
          <div className="mt-6 border-t border-slate-200 pt-5">
            <div className="text-sm font-medium text-slate-500">Message</div>
            <p className="mt-1.5 whitespace-pre-line break-words text-slate-900">{row.message}</p>
          </div>
        </Panel>

        <Panel title="Follow-up">
          <div className="space-y-4">
            <div>
              <Label htmlFor="cm-status">Status</Label>
              <select id="cm-status" value={status} onChange={(e) => setStatus(e.target.value as Status)}
                className="mt-1.5 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10">
                {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="cm-notes">Notes</Label>
              <Textarea id="cm-notes" rows={7} maxLength={5000} value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="What was said, next steps. Only admins see this."
                className="mt-1.5 resize-y" />
            </div>
            {row.updated_at !== row.created_at && (
              <p className="text-xs text-slate-400">Last updated {fmtDate(row.updated_at)}</p>
            )}
            <Button onClick={save} disabled={!dirty || saving}>
              {saving && <Spinner className="mr-1.5" />} Save
            </Button>
          </div>
          <div className="mt-5 border-t border-slate-200 pt-5">
            <Confirm
              trigger={<Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"><Trash2 className="mr-1.5 h-4 w-4" /> Delete message</Button>}
              title="Delete this message?"
              description="It is deleted for good, with its notes. There is no other copy."
              confirmLabel="Delete" destructive
              onConfirm={remove}
            />
          </div>
        </Panel>
      </div>
    </>
  );
}

/** Opens Compose on the admin Email page from hello@, to the sender, quoting their message. */
function replyRequest(row: Submission): ComposeRequest {
  const quoted = row.message.split('\n').map((l) => `> ${l}`).join('\n');
  return {
    mailbox: 'hello@icopedia.co',
    seed: {
      title: `Reply to ${row.name}`,
      to: row.email,
      subject: 'Re: your message to iCOPEDIA',
      text: `Hi ${row.name.split(' ')[0]},\n\n\n\nOn ${fmtDate(row.created_at)}, you wrote through the contact form on icopedia.co:\n${quoted}\n`,
    },
  };
}
