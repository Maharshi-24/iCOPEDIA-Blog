import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Paperclip, Save, Send, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '../shared';
import { AttachmentMeta, ComposePayload, fmtSize, mail, readAsBase64, Upload } from './api';

/** What the compose window opens with: blank, a reply, a forward or a saved draft. */
export type ComposeSeed = {
  title: string;
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  text?: string;
  attachments?: Upload[];
  inReplyTo?: string;
  references?: string;
  replyRef?: { folder: string; uid: number };
  forward?: { folder: string; uid: number; attachments: AttachmentMeta[] };
  draftUid?: number;
};

// Keep in sync with MAX_UPLOAD_BYTES in api/admin-mail.ts (Vercel's 4.5 MB body cap).
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const EMAIL_RE = /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]+$/;
const FROM_NAME_KEY = 'icopedia-admin-mail-from-name';

const splitAddresses = (value: string) =>
  value.split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);

function storedFromName() {
  try {
    return localStorage.getItem(FROM_NAME_KEY) ?? 'iCOPEDIA';
  } catch {
    return 'iCOPEDIA';
  }
}

export default function Compose({ seed, mailbox, mailboxes, onClose }: {
  seed: ComposeSeed;
  mailbox: string;
  mailboxes: string[];
  /** `changed` = something was sent or saved, so lists should refresh. */
  onClose: (changed: boolean) => void;
}) {
  // Replies, forwards and drafts belong to the mailbox they came from.
  const fromLocked = !!(seed.replyRef || seed.forward || seed.draftUid);
  const [from, setFrom] = useState(mailbox);
  const [fromName, setFromName] = useState(storedFromName);
  const [to, setTo] = useState(seed.to ?? '');
  const [cc, setCc] = useState(seed.cc ?? '');
  const [bcc, setBcc] = useState(seed.bcc ?? '');
  const [showCc, setShowCc] = useState(!!(seed.cc || seed.bcc));
  const [subject, setSubject] = useState(seed.subject ?? '');
  const [text, setText] = useState(seed.text ?? '');
  const [files, setFiles] = useState<Upload[]>(seed.attachments ?? []);
  const [forwarded, setForwarded] = useState<AttachmentMeta[]>(
    (seed.forward?.attachments ?? []).filter((a) => !a.inline),
  );
  const [draftUid, setDraftUid] = useState(seed.draftUid);
  const [busy, setBusy] = useState<'send' | 'draft' | 'discard' | null>(null);
  const [savedOnce, setSavedOnce] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const initial = useRef(JSON.stringify([seed.to, seed.cc, seed.bcc, seed.subject, seed.text, seed.attachments?.length ?? 0]));

  const toList = splitAddresses(to);
  const ccList = splitAddresses(cc);
  const bccList = splitAddresses(bcc);
  const invalid = [...toList, ...ccList, ...bccList].filter((a) => !EMAIL_RE.test(a));
  const uploadBytes = files.reduce((n, f) => n + f.size, 0);
  const tooBig = uploadBytes > MAX_UPLOAD_BYTES;
  const canSend = toList.length > 0 && invalid.length === 0 && !!subject.trim() && !!text.trim() && !tooBig;
  const dirty = useMemo(
    () => JSON.stringify([to, cc, bcc, subject, text, files.length]) !== initial.current,
    [to, cc, bcc, subject, text, files.length],
  );

  function payload(): ComposePayload {
    return {
      fromName: fromName.trim(),
      to: toList,
      cc: ccList,
      bcc: bccList,
      subject: subject.trim(),
      text,
      attachments: files.map(({ filename, contentType, content }) => ({ filename, contentType, content })),
      inReplyTo: seed.inReplyTo,
      references: seed.references,
      replyRef: seed.replyRef,
      forwardRef: seed.forward
        ? { folder: seed.forward.folder, uid: seed.forward.uid, attachments: forwarded.map((a) => a.index) }
        : undefined,
      draftUid,
    };
  }

  function rememberFromName() {
    try {
      localStorage.setItem(FROM_NAME_KEY, fromName.trim());
    } catch {
      /* per-browser convenience only */
    }
  }

  async function addFiles(list: FileList | null) {
    if (!list?.length) return;
    const picked = await Promise.all(Array.from(list).map(async (f) => ({
      filename: f.name, contentType: f.type || undefined, size: f.size, content: await readAsBase64(f),
    })));
    setFiles((prev) => [...prev, ...picked]);
    if (fileInput.current) fileInput.current.value = '';
  }

  async function send() {
    setBusy('send');
    try {
      const result = await mail.send(from, payload());
      rememberFromName();
      if (result.warning) toast.warning(result.warning);
      else toast.success(`Sent from ${from}`);
      onClose(true);
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(null);
    }
  }

  async function saveDraft(closeAfter: boolean) {
    setBusy('draft');
    try {
      const saved = await mail.saveDraft(from, payload());
      setDraftUid(saved.uid ?? undefined);
      initial.current = JSON.stringify([to, cc, bcc, subject, text, files.length]);
      setSavedOnce(true);
      toast.success('Saved to Drafts');
      if (closeAfter) onClose(true);
    } catch (e) {
      toast.error(`Draft not saved: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  }

  async function discard() {
    if (draftUid) {
      setBusy('discard');
      try {
        const { folders } = await mail.folders(from);
        const drafts = folders.find((f) => f.role === 'drafts');
        if (drafts) await mail.remove(from, drafts.path, [draftUid]);
      } catch (e) {
        toast.error((e as Error).message);
      }
    }
    onClose(!!draftUid || savedOnce);
  }

  // Closing with unsaved edits keeps them as a draft instead of losing them.
  function requestClose() {
    if (busy) return;
    const hasContent = toList.length || subject.trim() || text.trim() || files.length;
    if (dirty && hasContent) saveDraft(true);
    else onClose(savedOnce);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && requestClose()}>
      <DialogContent className="flex h-[100dvh] max-w-3xl flex-col gap-0 p-0 sm:h-[85vh] sm:rounded-xl [&>button]:hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <DialogTitle className="text-base font-semibold">{seed.title}</DialogTitle>
          <DialogDescription className="sr-only">Write and send an email</DialogDescription>
          <button type="button" aria-label="Close" onClick={requestClose}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 border-b border-slate-200 text-sm">
          <Row label="From">
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <Select value={from} onValueChange={setFrom} disabled={fromLocked}>
                <SelectTrigger className="h-8 border-0 bg-transparent px-0 shadow-none focus:ring-0 sm:w-64"><SelectValue /></SelectTrigger>
                <SelectContent>{mailboxes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
              <Input value={fromName} maxLength={100} placeholder="Sender name" aria-label="Sender name"
                className="h-8 sm:ml-auto sm:w-48" onChange={(e) => setFromName(e.target.value)} />
            </div>
          </Row>
          <Row label="To" extra={!showCc && (
            <button type="button" className="shrink-0 text-xs font-medium text-slate-500 hover:text-slate-900" onClick={() => setShowCc(true)}>
              Cc / Bcc
            </button>
          )}>
            <BareInput value={to} onChange={setTo} placeholder="name@company.com, another@company.com" autoFocus={!seed.to} />
          </Row>
          {showCc && <Row label="Cc"><BareInput value={cc} onChange={setCc} /></Row>}
          {showCc && <Row label="Bcc"><BareInput value={bcc} onChange={setBcc} /></Row>}
          <Row label="Subject"><BareInput value={subject} onChange={setSubject} maxLength={300} /></Row>
        </div>
        {invalid.length > 0 && (
          <p className="border-b border-red-100 bg-red-50 px-5 py-1.5 text-xs text-red-700">Not a valid address: {invalid.join(', ')}</p>
        )}

        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Write your email…"
          autoFocus={!!seed.to}
          className="min-h-0 flex-1 resize-none rounded-none border-0 px-5 py-4 text-sm leading-relaxed shadow-none focus-visible:ring-0" />

        {(files.length > 0 || forwarded.length > 0) && (
          <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-3">
            {forwarded.map((a) => (
              <Chip key={`fwd-${a.index}`} name={a.filename} size={a.size} tag="from original"
                onRemove={() => setForwarded((prev) => prev.filter((x) => x.index !== a.index))} />
            ))}
            {files.map((f, i) => (
              <Chip key={`${f.filename}-${i}`} name={f.filename} size={f.size}
                onRemove={() => setFiles((prev) => prev.filter((_, j) => j !== i))} />
            ))}
          </div>
        )}
        {tooBig && <p className="px-5 pb-2 text-xs text-red-600">New attachments add up to {fmtSize(uploadBytes)}. The limit is 3 MB.</p>}

        <div className="flex items-center gap-2 border-t border-slate-200 px-5 py-3">
          <Button onClick={send} disabled={!canSend || !!busy} className="bg-slate-900 text-white hover:bg-slate-800">
            {busy === 'send' ? <Spinner className="mr-2" /> : <Send className="mr-2 h-4 w-4" />} Send
          </Button>
          <input ref={fileInput} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
          <Button variant="ghost" size="icon" aria-label="Attach files" title="Attach files" disabled={!!busy}
            onClick={() => fileInput.current?.click()}>
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Save draft" title="Save draft" disabled={!!busy || !dirty}
            onClick={() => saveDraft(false)}>
            {busy === 'draft' ? <Spinner /> : <Save className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" className="ml-auto text-slate-500" disabled={!!busy} onClick={discard}>
            {busy === 'discard' ? <Spinner className="mr-2" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Discard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, extra, children }: { label: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[44px] items-center gap-3 px-5 py-1.5">
      <span className="w-14 shrink-0 text-slate-500">{label}</span>
      {children}
      {extra}
    </div>
  );
}

function BareInput({ value, onChange, placeholder, maxLength, autoFocus }: {
  value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number; autoFocus?: boolean;
}) {
  return (
    <input value={value} placeholder={placeholder} maxLength={maxLength} autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 min-w-0 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400" />
  );
}

function Chip({ name, size, tag, onRemove }: { name: string; size: number; tag?: string; onRemove: () => void }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 py-1 pl-2 pr-1 text-xs text-slate-700">
      <Paperclip className="h-3 w-3 shrink-0 text-slate-400" />
      <span className="truncate">{name}</span>
      <span className="shrink-0 text-slate-400">{fmtSize(size)}{tag ? ` · ${tag}` : ''}</span>
      <button type="button" aria-label={`Remove ${name}`} className="rounded p-0.5 hover:bg-slate-200" onClick={onRemove}>
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
