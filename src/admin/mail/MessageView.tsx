import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Archive, ArrowLeft, Download, Forward, ImageOff, Inbox, MailOpen, Paperclip, Pencil, Reply, ReplyAll,
  ShieldAlert, ShieldCheck, Star, Trash2, Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Confirm, Spinner } from '../shared';
import {
  Address, avatarFor, displayName, downloadBase64, fmtSize, Folder, FullMessage, fullAddress, longDate, mail,
} from './api';
import type { ComposeSeed } from './Compose';

export type MessageChange =
  | { kind: 'removed' }
  | { kind: 'flag'; flag: 'seen' | 'flagged'; value: boolean };

export default function MessageView({ mailbox, folder, uid, onBack, onChange, onCompose }: {
  mailbox: string;
  folder: Folder;
  uid: number;
  onBack: () => void;
  onChange: (change: MessageChange) => void;
  onCompose: (seed: ComposeSeed) => void;
}) {
  const [msg, setMsg] = useState<FullMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showImages, setShowImages] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setMsg(null);
    setError(null);
    setShowImages(false);
    mail.message(mailbox, folder.path, uid)
      .then((m) => live && setMsg(m))
      .catch((e: Error) => live && setError(e.message));
    return () => { live = false; };
  }, [mailbox, folder.path, uid]);

  async function act(label: string, fn: () => Promise<unknown>, change: MessageChange, done?: string) {
    setBusy(label);
    try {
      await fn();
      onChange(change);
      if (done) toast.success(done);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const move = (to: string, done: string) =>
    act(to, () => mail.move(mailbox, folder.path, [uid], to), { kind: 'removed' }, done);

  async function editDraft(m: FullMessage) {
    setBusy('edit');
    try {
      const files = await Promise.all(m.attachments.filter((a) => !a.inline).map(async (a) => {
        const file = await mail.attachment(mailbox, folder.path, uid, a.index);
        return { filename: file.filename, contentType: file.contentType, content: file.content, size: a.size };
      }));
      onCompose({
        title: 'Draft',
        to: m.to.map((a) => a.address).join(', '),
        cc: m.cc.map((a) => a.address).join(', '),
        bcc: m.bcc.map((a) => a.address).join(', '),
        subject: m.subject,
        text: m.text ?? '',
        attachments: files,
        inReplyTo: m.inReplyTo || undefined,
        references: m.references || undefined,
        draftUid: uid,
      });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const role = folder.role;
  const icon = 'h-4 w-4';

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-0.5 border-b border-slate-200 px-2 py-1.5">
        <ToolButton label="Back" onClick={onBack} className="lg:hidden"><ArrowLeft className={icon} /></ToolButton>
        {msg && role !== 'drafts' && (
          <>
            <ToolButton label="Reply" onClick={() => onCompose(replySeed(msg, mailbox, 'reply'))}><Reply className={icon} /></ToolButton>
            <ToolButton label="Reply all" onClick={() => onCompose(replySeed(msg, mailbox, 'all'))}><ReplyAll className={icon} /></ToolButton>
            <ToolButton label="Forward" onClick={() => onCompose(forwardSeed(msg))}><Forward className={icon} /></ToolButton>
            <span className="mx-1 h-5 w-px bg-slate-200" />
          </>
        )}
        {role !== 'archive' && role !== 'drafts' && (
          <ToolButton label="Archive" busy={busy === 'archive'} onClick={() => move('archive', 'Archived')}><Archive className={icon} /></ToolButton>
        )}
        {role === 'junk' ? (
          <ToolButton label="Not spam" busy={busy === 'inbox'} onClick={() => move('inbox', 'Moved to Inbox')}><ShieldCheck className={icon} /></ToolButton>
        ) : role !== 'sent' && role !== 'drafts' && (
          <ToolButton label="Report spam" busy={busy === 'junk'} onClick={() => move('junk', 'Moved to Spam')}><ShieldAlert className={icon} /></ToolButton>
        )}
        {(role === 'trash' || role === 'archive') && (
          <ToolButton label="Move to Inbox" busy={busy === 'inbox'} onClick={() => move('inbox', 'Moved to Inbox')}>
            {role === 'trash' ? <Undo2 className={icon} /> : <Inbox className={icon} />}
          </ToolButton>
        )}
        {role === 'trash' || role === 'junk' || role === 'drafts' ? (
          <Confirm
            trigger={<span><ToolButton label="Delete forever" busy={busy === 'delete'}><Trash2 className={cn(icon, 'text-red-600')} /></ToolButton></span>}
            title="Delete this email forever?"
            description="It is removed from the server and can't be recovered."
            confirmLabel="Delete forever" destructive
            onConfirm={() => act('delete', () => mail.remove(mailbox, folder.path, [uid]), { kind: 'removed' }, 'Deleted')}
          />
        ) : (
          <ToolButton label="Move to Trash" busy={busy === 'trash'} onClick={() => move('trash', 'Moved to Trash')}><Trash2 className={icon} /></ToolButton>
        )}
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <ToolButton label="Mark as unread" busy={busy === 'unread'}
          onClick={() => act('unread', () => mail.flag(mailbox, folder.path, [uid], 'seen', false), { kind: 'flag', flag: 'seen', value: false })
            .then(onBack)}>
          <MailOpen className={icon} />
        </ToolButton>
        {msg && (
          <ToolButton label={msg.flagged ? 'Unstar' : 'Star'} busy={busy === 'star'}
            onClick={() => {
              const value = !msg.flagged;
              act('star', () => mail.flag(mailbox, folder.path, [uid], 'flagged', value), { kind: 'flag', flag: 'flagged', value })
                .then(() => setMsg((m) => (m ? { ...m, flagged: value } : m)));
            }}>
            <Star className={cn(icon, msg.flagged && 'fill-amber-400 text-amber-500')} />
          </ToolButton>
        )}
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : !msg ? (
          <div className="flex items-center gap-2 p-6 text-sm text-slate-500"><Spinner /> Opening…</div>
        ) : (
          <article className="px-4 py-5 sm:px-6">
            <h2 className="break-words text-xl font-semibold leading-snug text-slate-900">{msg.subject || '(no subject)'}</h2>

            <div className="mt-4 flex items-start gap-3">
              <Avatar address={msg.from} />
              <div className="min-w-0 flex-1 text-sm">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold text-slate-900">{displayName(msg.from) || 'Unknown sender'}</span>
                  {msg.from?.name && <span className="truncate text-slate-500">&lt;{msg.from.address}&gt;</span>}
                  <span className="ml-auto shrink-0 text-xs text-slate-500">{longDate(msg.date)}</span>
                </div>
                <Recipients label="to" list={msg.to} />
                <Recipients label="cc" list={msg.cc} />
                <Recipients label="bcc" list={msg.bcc} />
              </div>
            </div>

            {role === 'drafts' && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                This is a saved draft.
                <Button size="sm" onClick={() => editDraft(msg)} disabled={busy === 'edit'} className="bg-slate-900 text-white hover:bg-slate-800">
                  {busy === 'edit' ? <Spinner className="mr-2" /> : <Pencil className="mr-2 h-3.5 w-3.5" />} Edit &amp; send
                </Button>
              </div>
            )}

            <Attachments msg={msg} mailbox={mailbox} folder={folder.path} />

            <Body msg={msg} showImages={showImages} onShowImages={() => setShowImages(true)} />

            {role !== 'drafts' && (
              <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
                <Button variant="outline" onClick={() => onCompose(replySeed(msg, mailbox, 'reply'))}><Reply className="mr-2 h-4 w-4" /> Reply</Button>
                <Button variant="outline" onClick={() => onCompose(replySeed(msg, mailbox, 'all'))}><ReplyAll className="mr-2 h-4 w-4" /> Reply all</Button>
                <Button variant="outline" onClick={() => onCompose(forwardSeed(msg))}><Forward className="mr-2 h-4 w-4" /> Forward</Button>
              </div>
            )}
          </article>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- pieces

function ToolButton({ label, onClick, busy, className, children }: {
  label: string; onClick?: () => void; busy?: boolean; className?: string; children: React.ReactNode;
}) {
  return (
    <Button variant="ghost" size="icon" aria-label={label} title={label} onClick={onClick} disabled={busy}
      className={cn('h-8 w-8 text-slate-600', className)}>
      {busy ? <Spinner /> : children}
    </Button>
  );
}

export function Avatar({ address, className }: { address?: Address | null; className?: string }) {
  const { label, tone } = avatarFor(address);
  return (
    <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold', tone, className)}>
      {label}
    </span>
  );
}

function Recipients({ label, list }: { label: string; list: Address[] }) {
  if (list.length === 0) return null;
  return (
    <div className="mt-0.5 break-words text-xs text-slate-500">
      {label} {list.map(fullAddress).join(', ')}
    </div>
  );
}

function Attachments({ msg, mailbox, folder }: { msg: FullMessage; mailbox: string; folder: string }) {
  const [loading, setLoading] = useState<number | null>(null);
  const files = msg.attachments.filter((a) => !a.inline);
  if (files.length === 0) return null;

  async function download(index: number) {
    setLoading(index);
    try {
      const file = await mail.attachment(mailbox, folder, msg.uid, index);
      downloadBase64(file.filename, file.contentType, file.content);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <Paperclip className="h-3.5 w-3.5" /> {files.length} attachment{files.length === 1 ? '' : 's'}
      </div>
      <div className="flex flex-wrap gap-2">
        {files.map((a) => (
          <button key={a.index} type="button" onClick={() => download(a.index)} disabled={loading === a.index}
            className="group flex max-w-full items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left hover:border-slate-300 hover:bg-slate-50">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-semibold uppercase text-slate-500">
              {(a.filename.split('.').pop() ?? '').slice(0, 4) || 'file'}
            </span>
            <span className="min-w-0">
              <span className="block max-w-[220px] truncate text-sm text-slate-800">{a.filename}</span>
              <span className="block text-xs text-slate-500">{fmtSize(a.size)}</span>
            </span>
            {loading === a.index ? <Spinner className="text-slate-400" /> : <Download className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-slate-700" />}
          </button>
        ))}
      </div>
    </div>
  );
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const textToHtml = (text: string) =>
  `<div style="white-space:pre-wrap">${escapeHtml(text).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>')}</div>`;

/**
 * Renders the email in a sandboxed iframe: no scripts, no forms, links open in
 * a new tab. Remote images (tracking pixels) stay blocked by CSP until the
 * admin clicks "Show images". Same-origin is allowed only so the frame can be
 * sized to its content; with scripts disabled the email can't use it.
 */
function Body({ msg, showImages, onShowImages }: { msg: FullMessage; showImages: boolean; onShowImages: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(200);
  const content = msg.html ?? textToHtml(msg.text ?? '');
  const hasRemote = !!msg.html && /(src|background)\s*=\s*["']?https?:|url\(\s*["']?https?:/i.test(msg.html);

  const doc = useMemo(() => {
    const img = showImages ? 'img-src * data: blob:; style-src * \'unsafe-inline\'; font-src * data:' : 'img-src data:; style-src \'unsafe-inline\'; font-src data:';
    return `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; ${img}">
<base target="_blank">
<style>html,body{margin:0;padding:0}body{font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#1e293b;overflow-wrap:anywhere}
img{max-width:100%;height:auto}table{max-width:100%}pre{white-space:pre-wrap}a{color:#2563eb}
blockquote{margin:0 0 0 4px;padding-left:10px;border-left:2px solid #cbd5e1;color:#475569}</style>
</head><body>${content}</body></html>`;
  }, [content, showImages]);

  const observer = useRef<ResizeObserver | null>(null);

  const fit = useCallback(() => {
    const d = frame.current?.contentDocument;
    if (d?.documentElement) setHeight(Math.max(60, d.documentElement.scrollHeight + 4));
  }, []);

  // Images load after the frame does, so keep re-fitting as the body grows.
  const onLoad = useCallback(() => {
    fit();
    observer.current?.disconnect();
    const body = frame.current?.contentDocument?.body;
    if (body) {
      observer.current = new ResizeObserver(fit);
      observer.current.observe(body);
    }
  }, [fit]);

  useEffect(() => () => observer.current?.disconnect(), []);

  return (
    <div className="mt-5">
      {hasRemote && !showImages && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
          <span className="flex items-center gap-1.5"><ImageOff className="h-3.5 w-3.5" /> Remote images are hidden to protect your privacy.</span>
          <button type="button" onClick={onShowImages} className="font-medium text-slate-900 hover:underline">Show images</button>
        </div>
      )}
      <iframe ref={frame} title="Email content" srcDoc={doc} style={{ height }} onLoad={onLoad}
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        className="w-full border-0 bg-white" />
    </div>
  );
}

// ---------------------------------------------------------------- reply / forward

const quote = (text: string) => text.split(/\r?\n/).map((l) => `> ${l}`).join('\n');
const withPrefix = (prefix: string, re: RegExp, subject: string) => (re.test(subject) ? subject : `${prefix} ${subject}`);

function replySeed(msg: FullMessage, mailbox: string, mode: 'reply' | 'all'): ComposeSeed {
  const me = mailbox.toLowerCase();
  const fromMe = msg.from?.address === me;
  // Replying to something we sent goes back to its recipients, not to ourselves.
  const primary = fromMe ? msg.to : msg.replyTo.length ? msg.replyTo : msg.from ? [msg.from] : [];
  const to = [...new Set(primary.map((a) => a.address))].filter((a) => a !== me);
  const cc = mode === 'all'
    ? [...new Set([...msg.to, ...msg.cc].map((a) => a.address))].filter((a) => a !== me && !to.includes(a))
    : [];
  const original = msg.text ?? '';
  return {
    title: mode === 'all' ? 'Reply all' : 'Reply',
    to: to.join(', '),
    cc: cc.join(', '),
    subject: withPrefix('Re:', /^re:/i, msg.subject),
    text: `\n\n\nOn ${longDate(msg.date)}, ${msg.from ? fullAddress(msg.from) : 'someone'} wrote:\n${quote(original)}`,
    inReplyTo: msg.messageId || undefined,
    references: [msg.references, msg.messageId].filter(Boolean).join(' ') || undefined,
    replyRef: { folder: msg.folder, uid: msg.uid },
  };
}

function forwardSeed(msg: FullMessage): ComposeSeed {
  const header = [
    '---------- Forwarded message ---------',
    `From: ${msg.from ? fullAddress(msg.from) : ''}`,
    `Date: ${longDate(msg.date)}`,
    `Subject: ${msg.subject}`,
    `To: ${msg.to.map(fullAddress).join(', ')}`,
    ...(msg.cc.length ? [`Cc: ${msg.cc.map(fullAddress).join(', ')}`] : []),
  ].join('\n');
  return {
    title: 'Forward',
    subject: withPrefix('Fwd:', /^(fwd?|fw):/i, msg.subject),
    text: `\n\n\n${header}\n\n${msg.text ?? ''}`,
    forward: { folder: msg.folder, uid: msg.uid, attachments: msg.attachments },
  };
}
