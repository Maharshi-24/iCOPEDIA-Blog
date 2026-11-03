import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Paperclip, RefreshCw, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Confirm, Empty, fmtDate, Loading, PageHeader, Panel, Spinner } from '../shared';

type SentMessage = { uid: number; subject: string; to: string[]; cc: string[]; date: string | null; size: number };
type Picked = { name: string; type: string; size: number; content: string };

// Keep in sync with MAX_ATTACHMENT_BYTES in api/admin-mail.ts (Vercel's 4.5 MB body cap).
const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;
const EMAIL_RE = /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]+$/;

/** Calls api/admin-mail.ts with the signed-in admin's Supabase session. */
async function mailApi<T>(init?: { query?: Record<string, string>; body?: unknown }): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const qs = init?.query ? `?${new URLSearchParams(init.query)}` : '';
  const res = await fetch(`/api/admin-mail${qs}`, {
    method: init?.body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${data.session?.access_token ?? ''}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `Request failed (${res.status})`);
  return json as T;
}

const splitAddresses = (value: string) =>
  value.split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);

const fmtSize = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function Email() {
  const [mailboxes, setMailboxes] = useState<string[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [from, setFrom] = useState('');
  const [fromName, setFromName] = useState('iCOPEDIA');
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [files, setFiles] = useState<Picked[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const [sent, setSent] = useState<SentMessage[] | null>(null);
  const [sentError, setSentError] = useState<string | null>(null);

  useEffect(() => {
    mailApi<{ mailboxes: string[] }>()
      .then(({ mailboxes }) => {
        setMailboxes(mailboxes);
        setFrom((current) => current || mailboxes.find((m) => m.startsWith('hello@')) || mailboxes[0] || '');
      })
      .catch((e: Error) => setLoadError(e.message));
  }, []);

  const loadSent = useCallback(async (mailbox: string) => {
    setSent(null);
    setSentError(null);
    try {
      const { messages } = await mailApi<{ messages: SentMessage[] }>({ query: { view: 'sent', mailbox, limit: '25' } });
      setSent(messages);
    } catch (e) {
      setSentError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    if (from) loadSent(from);
  }, [from, loadSent]);

  const toList = splitAddresses(to);
  const ccList = splitAddresses(cc);
  const bccList = splitAddresses(bcc);
  const invalid = [...toList, ...ccList, ...bccList].filter((a) => !EMAIL_RE.test(a));
  const attachmentBytes = files.reduce((n, f) => n + f.size, 0);
  const tooBig = attachmentBytes > MAX_ATTACHMENT_BYTES;
  const canSend = !!from && toList.length > 0 && invalid.length === 0 && subject.trim() && text.trim() && !tooBig;

  async function addFiles(list: FileList | null) {
    if (!list?.length) return;
    const picked = await Promise.all(
      Array.from(list).map(async (f) => ({ name: f.name, type: f.type, size: f.size, content: await readAsBase64(f) })),
    );
    setFiles((prev) => [...prev, ...picked]);
    if (fileInput.current) fileInput.current.value = '';
  }

  async function send() {
    try {
      const result = await mailApi<{ message: string; warning?: string }>({
        body: {
          from,
          fromName: fromName.trim(),
          to: toList,
          cc: ccList,
          bcc: bccList,
          subject: subject.trim(),
          text,
          attachments: files.map((f) => ({ filename: f.name, contentType: f.type || undefined, content: f.content })),
        },
      });
      if (result.warning) toast.warning(result.warning);
      else toast.success(`Sent from ${from}`);
      setTo(''); setCc(''); setBcc(''); setSubject(''); setText(''); setFiles([]); setShowCc(false);
      loadSent(from);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (loadError) {
    return (
      <>
        <PageHeader title="Email" />
        <Panel><p className="text-sm text-red-600">{loadError}</p></Panel>
      </>
    );
  }
  if (!mailboxes) return <><PageHeader title="Email" /><Loading /></>;

  if (mailboxes.length === 0) {
    return (
      <>
        <PageHeader title="Email" description="Send email from the @icopedia.co mailboxes." />
        <Panel title="No mailboxes set up yet">
          <p className="text-sm text-slate-600">
            Add each mailbox's password as an environment variable on the Vercel project, then redeploy.
            For example <code className="rounded bg-slate-100 px-1">MAIL_PASS_HELLO</code> enables hello@icopedia.co.
          </p>
        </Panel>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Email"
        description="Sends from a real @icopedia.co mailbox. A copy is saved in that mailbox's Sent folder, so it also shows in webmail and phone mail apps."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Panel title="New email">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="From">
                <Select value={from} onValueChange={setFrom}>
                  <SelectTrigger><SelectValue placeholder="Choose a mailbox" /></SelectTrigger>
                  <SelectContent>{mailboxes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Sender name" hint="Shown to the recipient">
                <Input value={fromName} maxLength={100} placeholder="iCOPEDIA" onChange={(e) => setFromName(e.target.value)} />
              </Field>
            </div>

            <Field
              label="To"
              hint={!showCc ? <button type="button" className="text-xs font-medium text-slate-600 hover:text-slate-900" onClick={() => setShowCc(true)}>Add Cc / Bcc</button> : undefined}
            >
              <Input value={to} placeholder="name@company.com, another@company.com" onChange={(e) => setTo(e.target.value)} />
            </Field>
            {showCc && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Cc"><Input value={cc} onChange={(e) => setCc(e.target.value)} /></Field>
                <Field label="Bcc"><Input value={bcc} onChange={(e) => setBcc(e.target.value)} /></Field>
              </div>
            )}
            {invalid.length > 0 && <p className="text-xs text-red-600">Not a valid address: {invalid.join(', ')}</p>}

            <Field label="Subject">
              <Input value={subject} maxLength={300} onChange={(e) => setSubject(e.target.value)} />
            </Field>
            <Field label="Message">
              <Textarea rows={12} value={text} placeholder="Write your email…" onChange={(e) => setText(e.target.value)} />
            </Field>

            <div className="space-y-2">
              <input ref={fileInput} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {files.map((f, i) => (
                    <span key={`${f.name}-${i}`} className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-slate-100 py-1 pl-2 pr-1 text-xs text-slate-700">
                      <Paperclip className="h-3 w-3 shrink-0" />
                      <span className="truncate">{f.name}</span>
                      <span className="shrink-0 text-slate-400">{fmtSize(f.size)}</span>
                      <button type="button" aria-label={`Remove ${f.name}`} className="rounded p-0.5 hover:bg-slate-200"
                        onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {tooBig && <p className="text-xs text-red-600">Attachments add up to {fmtSize(attachmentBytes)}. The limit is 3 MB.</p>}
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="outline" onClick={() => fileInput.current?.click()}>
                <Paperclip className="mr-2 h-4 w-4" /> Attach files
              </Button>
              <Confirm
                trigger={
                  <Button disabled={!canSend} className="bg-slate-900 text-white hover:bg-slate-800">
                    <Send className="mr-2 h-4 w-4" /> Send
                  </Button>
                }
                title="Send this email now?"
                description={
                  <div className="space-y-1 text-sm">
                    <p><b>From:</b> {fromName.trim() ? `${fromName.trim()} <${from}>` : from}</p>
                    <p className="break-words"><b>To:</b> {toList.join(', ')}</p>
                    {ccList.length > 0 && <p className="break-words"><b>Cc:</b> {ccList.join(', ')}</p>}
                    {bccList.length > 0 && <p className="break-words"><b>Bcc:</b> {bccList.join(', ')}</p>}
                    <p><b>Subject:</b> {subject}</p>
                    {files.length > 0 && <p><b>Attachments:</b> {files.length} ({fmtSize(attachmentBytes)})</p>}
                    <p className="pt-1 text-slate-500">Email can't be recalled once sent.</p>
                  </div>
                }
                confirmLabel="Send now"
                onConfirm={send}
              />
            </div>
          </div>
        </Panel>

        <Panel
          title="Sent"
          description={from ? `Latest from ${from}` : undefined}
          actions={
            <Button variant="ghost" size="icon" aria-label="Refresh" disabled={!from || (!sent && !sentError)} onClick={() => loadSent(from)}>
              {!sent && !sentError ? <Spinner /> : <RefreshCw className="h-4 w-4 text-slate-500" />}
            </Button>
          }
        >
          {sentError ? <p className="text-sm text-red-600">{sentError}</p>
            : !sent ? <Loading />
            : sent.length === 0 ? <Empty>Nothing in Sent yet.</Empty>
            : (
              <div className="-my-2 divide-y divide-slate-100">
                {sent.map((m) => (
                  <div key={m.uid} className="py-2.5">
                    <div className="truncate text-sm font-medium text-slate-900">{m.subject || '(no subject)'}</div>
                    <div className="truncate text-xs text-slate-500">To {[...m.to, ...m.cc].join(', ') || '—'}</div>
                    <div className="text-xs text-slate-400">{fmtDate(m.date)}</div>
                  </div>
                ))}
              </div>
            )}
        </Panel>
      </div>
    </>
  );
}

function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
