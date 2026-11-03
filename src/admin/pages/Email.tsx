import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Archive, File, Folder as FolderIcon, Inbox, Mail, MailOpen, Paperclip, PenSquare, RefreshCw, Reply, Search, Send,
  ShieldAlert, ShieldCheck, Star, Trash2, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Confirm, Spinner } from '../shared';
import { avatarFor, displayName, Folder, ListItem, listDate, mail, Role } from '../mail/api';
import Compose, { ComposeSeed } from '../mail/Compose';
import MessageView, { MessageChange } from '../mail/MessageView';

const PAGE = 50;
const MAILBOX_KEY = 'icopedia-admin-mailbox';
const REFRESH_MS = 60_000;

const FOLDER_ICONS: Record<Role, typeof Inbox> = {
  inbox: Inbox, drafts: File, sent: Send, archive: Archive, junk: ShieldAlert, trash: Trash2,
};

function readStored(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* per-browser convenience only */
  }
}

export default function Email() {
  const [mailboxes, setMailboxes] = useState<string[] | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [mailbox, setMailbox] = useState('');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderPath, setFolderPath] = useState('INBOX');
  const [items, setItems] = useState<ListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [listState, setListState] = useState<'loading' | 'ready' | 'more' | 'error'>('loading');
  const [listError, setListError] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [openUid, setOpenUid] = useState<number | null>(null);
  const [compose, setCompose] = useState<ComposeSeed | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const listRequest = useRef(0);

  const folder = folders.find((f) => f.path === folderPath) ?? null;
  const role = folder?.role ?? null;

  // ---- loading

  useEffect(() => {
    mail.mailboxes()
      .then(({ mailboxes }) => {
        setMailboxes(mailboxes);
        const stored = readStored(MAILBOX_KEY);
        setMailbox(mailboxes.includes(stored ?? '') ? stored! : mailboxes.find((m) => m.startsWith('hello@')) ?? mailboxes[0] ?? '');
      })
      .catch((e: Error) => setSetupError(e.message));
  }, []);

  const loadFolders = useCallback(async (box: string) => {
    try {
      const { folders } = await mail.folders(box);
      setFolders(folders);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, []);

  /** Loads the first page, or (append) the next one. `quiet` skips the spinner for background refreshes. */
  const loadList = useCallback(async (opts: { append?: boolean; quiet?: boolean; keep?: number } = {}) => {
    if (!mailbox) return;
    const request = ++listRequest.current;
    const offset = opts.append ? items.length : 0;
    if (opts.append) setListState('more');
    else if (!opts.quiet) setListState('loading');
    try {
      const limit = opts.keep ? Math.min(Math.max(opts.keep, PAGE), 100) : PAGE;
      const res = await mail.list(mailbox, folderPath, offset, query, limit);
      if (request !== listRequest.current) return;
      setItems((prev) => (opts.append ? [...prev, ...res.messages] : res.messages));
      setTotal(res.total);
      setListState('ready');
    } catch (e) {
      if (request !== listRequest.current) return;
      setListError((e as Error).message);
      setListState('error');
    }
  }, [mailbox, folderPath, query, items.length]);

  useEffect(() => {
    if (!mailbox) return;
    writeStored(MAILBOX_KEY, mailbox);
    setFolders([]);
    loadFolders(mailbox);
  }, [mailbox, loadFolders]);

  // New mailbox / folder / search: fresh first page, nothing selected or open.
  useEffect(() => {
    setItems([]);
    setSelected(new Set());
    setOpenUid(null);
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mailbox, folderPath, query]);

  const refresh = useCallback((quiet = false) => {
    if (!mailbox) return;
    loadFolders(mailbox);
    loadList({ quiet, keep: items.length });
  }, [mailbox, loadFolders, loadList, items.length]);

  // Background refresh while the tab is visible and nothing is being written.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible' && !compose && selected.size === 0) refresh(true);
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh, compose, selected.size]);

  // ---- local bookkeeping after actions

  function adjustUnread(delta: number) {
    setFolders((prev) => prev.map((f) => (f.path === folderPath ? { ...f, unread: Math.max(0, f.unread + delta) } : f)));
  }

  function open(item: ListItem) {
    setOpenUid(item.uid);
    if (!item.seen) {
      setItems((prev) => prev.map((m) => (m.uid === item.uid ? { ...m, seen: true } : m)));
      adjustUnread(-1);
    }
  }

  function removeLocal(uids: number[]) {
    const gone = new Set(uids);
    const unreadGone = items.filter((m) => gone.has(m.uid) && !m.seen).length;
    setItems((prev) => prev.filter((m) => !gone.has(m.uid)));
    setTotal((t) => Math.max(0, t - uids.length));
    setSelected(new Set());
    if (openUid && gone.has(openUid)) setOpenUid(null);
    if (unreadGone) adjustUnread(-unreadGone);
    loadFolders(mailbox);
  }

  function onMessageChange(change: MessageChange) {
    if (!openUid) return;
    if (change.kind === 'removed') return removeLocal([openUid]);
    setItems((prev) => prev.map((m) => (m.uid === openUid
      ? { ...m, ...(change.flag === 'seen' ? { seen: change.value } : { flagged: change.value }) }
      : m)));
    if (change.flag === 'seen' && !change.value) adjustUnread(1);
  }

  async function bulk(label: string, fn: (uids: number[]) => Promise<unknown>, after: (uids: number[]) => void) {
    const uids = [...selected];
    setBulkBusy(true);
    try {
      await fn(uids);
      after(uids);
      toast.success(`${label} ${uids.length} email${uids.length === 1 ? '' : 's'}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBulkBusy(false);
    }
  }

  const bulkMove = (to: Role, label: string) =>
    bulk(label, (uids) => mail.move(mailbox, folderPath, uids, to), removeLocal);

  const bulkSeen = (value: boolean) =>
    bulk(value ? 'Marked read' : 'Marked unread', (uids) => mail.flag(mailbox, folderPath, uids, 'seen', value), (uids) => {
      const set = new Set(uids);
      const changed = items.filter((m) => set.has(m.uid) && m.seen !== value).length;
      setItems((prev) => prev.map((m) => (set.has(m.uid) ? { ...m, seen: value } : m)));
      adjustUnread(value ? -changed : changed);
      setSelected(new Set());
    });

  async function toggleStar(item: ListItem) {
    const value = !item.flagged;
    setItems((prev) => prev.map((m) => (m.uid === item.uid ? { ...m, flagged: value } : m)));
    try {
      await mail.flag(mailbox, folderPath, [item.uid], 'flagged', value);
    } catch (e) {
      setItems((prev) => prev.map((m) => (m.uid === item.uid ? { ...m, flagged: !value } : m)));
      toast.error((e as Error).message);
    }
  }

  function closeCompose(changed: boolean) {
    setCompose(null);
    if (changed) refresh(true);
  }

  // ---- render

  if (setupError) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{setupError}</div>;
  }
  if (!mailboxes) {
    return <div className="flex items-center gap-2 py-10 text-sm text-slate-500"><Spinner /> Loading mailboxes…</div>;
  }
  if (mailboxes.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
        <h1 className="mb-2 text-lg font-semibold text-slate-900">No mailboxes set up yet</h1>
        Add each mailbox's password as an environment variable on the Vercel project, then redeploy.
        For example <code className="rounded bg-slate-100 px-1">MAIL_PASS_HELLO</code> enables hello@icopedia.co.
      </div>
    );
  }

  const allChecked = items.length > 0 && selected.size === items.length;
  const showRecipient = role === 'sent' || role === 'drafts';
  const permanent = role === 'trash' || role === 'junk' || role === 'drafts';

  return (
    <div className="flex h-[calc(100dvh-7rem)] min-h-[560px] flex-col lg:h-[calc(100dvh-4rem)]">
      {/* Top bar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h1 className="mr-2 text-2xl font-semibold tracking-tight text-slate-900">Email</h1>
        <Select value={mailbox} onValueChange={(v) => { setMailbox(v); setFolderPath('INBOX'); setSearch(''); setQuery(''); }}>
          <SelectTrigger className="h-9 w-auto min-w-[220px] bg-white" aria-label="Mailbox">
            <Mail className="mr-2 h-4 w-4 text-slate-500" /><SelectValue />
          </SelectTrigger>
          <SelectContent>{mailboxes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
        </Select>
        <Button onClick={() => setCompose({ title: 'New email' })} className="ml-auto bg-slate-900 text-white hover:bg-slate-800">
          <PenSquare className="mr-2 h-4 w-4" /> Compose
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Folders (desktop) */}
        <nav className="hidden w-52 shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-slate-200 p-2 lg:flex">
          {folders.length === 0 && <div className="flex items-center gap-2 p-2 text-xs text-slate-400"><Spinner /> Folders…</div>}
          {folders.map((f) => {
            const Icon = f.role ? FOLDER_ICONS[f.role] : FolderIcon;
            const active = f.path === folderPath;
            const count = f.role === 'drafts' ? f.total : f.unread;
            return (
              <button key={f.path} type="button" onClick={() => { setFolderPath(f.path); setSearch(''); setQuery(''); }}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  active ? 'bg-slate-900 font-medium text-white' : 'text-slate-700 hover:bg-slate-100',
                )}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{f.name}</span>
                {count > 0 && (
                  <span className={cn('text-xs tabular-nums', active ? 'text-white/80' : f.role === 'drafts' ? 'text-slate-400' : 'font-semibold text-slate-900')}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Message list */}
        <section className={cn(
          'min-w-0 flex-col border-slate-200 lg:flex lg:w-[380px] lg:shrink-0 lg:border-r xl:w-[420px]',
          openUid ? 'hidden' : 'flex flex-1 lg:flex-none',
        )}>
          <div className="space-y-2 border-b border-slate-200 p-2">
            {/* Folder picker (mobile) */}
            <Select value={folderPath} onValueChange={(v) => { setFolderPath(v); setSearch(''); setQuery(''); }}>
              <SelectTrigger className="h-9 lg:hidden" aria-label="Folder"><SelectValue placeholder="Folder" /></SelectTrigger>
              <SelectContent>
                {folders.map((f) => (
                  <SelectItem key={f.path} value={f.path}>{f.name}{f.unread > 0 && f.role !== 'drafts' ? ` (${f.unread})` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <form className="relative" onSubmit={(e) => { e.preventDefault(); setQuery(search.trim()); }}>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${folder?.name ?? 'folder'}…`}
                className="h-9 w-full rounded-lg bg-slate-100 pl-9 pr-9 text-sm outline-none placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-300" />
              {(search || query) && (
                <button type="button" aria-label="Clear search" onClick={() => { setSearch(''); setQuery(''); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </form>
          </div>

          {/* List toolbar */}
          <div className="flex h-11 shrink-0 items-center gap-1 border-b border-slate-100 px-3">
            <Checkbox aria-label="Select all" checked={allChecked} disabled={items.length === 0}
              onCheckedChange={(v) => setSelected(v ? new Set(items.map((m) => m.uid)) : new Set())} />
            {selected.size > 0 ? (
              <div className="ml-2 flex items-center gap-0.5">
                <span className="mr-1 text-xs font-medium text-slate-600">{selected.size} selected</span>
                {bulkBusy ? <Spinner className="ml-2 text-slate-400" /> : (
                  <>
                    <IconAction label="Mark read" onClick={() => bulkSeen(true)}><MailOpen className="h-4 w-4" /></IconAction>
                    <IconAction label="Mark unread" onClick={() => bulkSeen(false)}><Mail className="h-4 w-4" /></IconAction>
                    {role !== 'archive' && role !== 'drafts' && (
                      <IconAction label="Archive" onClick={() => bulkMove('archive', 'Archived')}><Archive className="h-4 w-4" /></IconAction>
                    )}
                    {role === 'junk' ? (
                      <IconAction label="Not spam" onClick={() => bulkMove('inbox', 'Moved to Inbox')}><ShieldCheck className="h-4 w-4" /></IconAction>
                    ) : role !== 'sent' && role !== 'drafts' && (
                      <IconAction label="Report spam" onClick={() => bulkMove('junk', 'Moved to Spam')}><ShieldAlert className="h-4 w-4" /></IconAction>
                    )}
                    {permanent ? (
                      <Confirm
                        trigger={<span><IconAction label="Delete forever"><Trash2 className="h-4 w-4 text-red-600" /></IconAction></span>}
                        title={`Delete ${selected.size} email${selected.size === 1 ? '' : 's'} forever?`}
                        description="They are removed from the server and can't be recovered."
                        confirmLabel="Delete forever" destructive
                        onConfirm={() => bulk('Deleted', (uids) => mail.remove(mailbox, folderPath, uids), removeLocal)}
                      />
                    ) : (
                      <IconAction label="Move to Trash" onClick={() => bulkMove('trash', 'Moved to Trash')}><Trash2 className="h-4 w-4" /></IconAction>
                    )}
                  </>
                )}
              </div>
            ) : (
              <>
                <IconAction label="Refresh" onClick={() => refresh()} className="ml-1">
                  <RefreshCw className={cn('h-4 w-4', listState === 'loading' && 'animate-spin')} />
                </IconAction>
                <span className="ml-auto text-xs tabular-nums text-slate-500">
                  {query ? `${total} result${total === 1 ? '' : 's'}` : total > 0 ? `${Math.min(items.length, total)} of ${total}` : ''}
                </span>
              </>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {listState === 'loading' && items.length === 0 ? (
              <ListSkeleton />
            ) : listState === 'error' ? (
              <div className="p-6 text-sm text-red-600">
                {listError} <button type="button" className="ml-1 font-medium underline" onClick={() => loadList()}>Try again</button>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-16 text-center text-sm text-slate-500">
                {query ? <Search className="h-8 w-8 text-slate-300" /> : <Inbox className="h-8 w-8 text-slate-300" />}
                {query ? `Nothing in ${folder?.name ?? 'this folder'} matches "${query}".` : `${folder?.name ?? 'This folder'} is empty.`}
              </div>
            ) : (
              <>
                {items.map((m) => {
                  const who = showRecipient
                    ? `To: ${m.to.map((a) => a.name || a.address).join(', ') || '(no recipient)'}`
                    : displayName(m.from) || '(unknown sender)';
                  const isSelected = selected.has(m.uid);
                  const avatar = avatarFor(showRecipient ? m.to[0] : m.from);
                  return (
                    <div key={m.uid} role="button" tabIndex={0}
                      onClick={() => open(m)}
                      onKeyDown={(e) => { if (e.key === 'Enter') open(m); }}
                      className={cn(
                        'group relative flex cursor-pointer items-start gap-3 border-b border-slate-100 px-3 py-2.5 outline-none focus-visible:bg-slate-50',
                        openUid === m.uid ? 'bg-blue-50/70' : isSelected ? 'bg-slate-50' : 'hover:bg-slate-50',
                      )}>
                      {!m.seen && <span className="absolute left-0 top-0 h-full w-0.5 bg-blue-600" />}
                      {/* Avatar turns into a checkbox on hover or while selecting */}
                      <span className="relative mt-0.5 h-8 w-8 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <span className={cn(
                          'absolute inset-0 flex items-center justify-center rounded-full text-xs font-semibold',
                          avatar.tone, (selected.size > 0) ? 'opacity-0' : 'group-hover:opacity-0',
                        )}>{avatar.label}</span>
                        <span className={cn(
                          'absolute inset-0 flex items-center justify-center',
                          selected.size > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                        )}>
                          <Checkbox aria-label="Select" checked={isSelected}
                            onCheckedChange={(v) => setSelected((prev) => {
                              const next = new Set(prev);
                              if (v) next.add(m.uid); else next.delete(m.uid);
                              return next;
                            })} />
                        </span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className={cn('truncate text-sm', m.seen ? 'text-slate-700' : 'font-semibold text-slate-900')}>{who}</span>
                          {m.draft && role !== 'drafts' && <span className="shrink-0 text-xs font-medium text-red-600">Draft</span>}
                          <span className={cn('ml-auto shrink-0 text-xs tabular-nums', m.seen ? 'text-slate-500' : 'font-semibold text-slate-900')}>
                            {listDate(m.date)}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className={cn('min-w-0 flex-1 truncate text-sm', m.seen ? 'text-slate-500' : 'font-medium text-slate-800')}>
                            {m.subject || '(no subject)'}
                          </span>
                          {m.answered && <Reply className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-label="Replied" />}
                          {m.hasAttachments && <Paperclip className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-label="Has attachments" />}
                          <button type="button" aria-label={m.flagged ? 'Unstar' : 'Star'}
                            onClick={(e) => { e.stopPropagation(); toggleStar(m); }}
                            className={cn('shrink-0 rounded p-0.5 hover:bg-slate-200', !m.flagged && 'opacity-0 group-hover:opacity-100')}>
                            <Star className={cn('h-3.5 w-3.5', m.flagged ? 'fill-amber-400 text-amber-500' : 'text-slate-400')} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {items.length < total && (
                  <div className="p-3">
                    <Button variant="outline" className="w-full" disabled={listState === 'more'} onClick={() => loadList({ append: true })}>
                      {listState === 'more' && <Spinner className="mr-2" />} Load more
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Reading pane */}
        <section className={cn('min-w-0 flex-1', openUid ? 'block' : 'hidden lg:block')}>
          {openUid && folder ? (
            <MessageView key={`${mailbox}:${folderPath}:${openUid}`} mailbox={mailbox} folder={folder} uid={openUid}
              onBack={() => setOpenUid(null)} onChange={onMessageChange} onCompose={setCompose} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-slate-400">
              <Mail className="h-10 w-10 text-slate-200" />
              Select an email to read it
            </div>
          )}
        </section>
      </div>

      {compose && <Compose seed={compose} mailbox={mailbox} mailboxes={mailboxes} onClose={closeCompose} />}
    </div>
  );
}

function IconAction({ label, onClick, className, children }: {
  label: string; onClick?: () => void; className?: string; children: React.ReactNode;
}) {
  return (
    <Button variant="ghost" size="icon" aria-label={label} title={label} onClick={onClick} className={cn('h-8 w-8 text-slate-600', className)}>
      {children}
    </Button>
  );
}

function ListSkeleton() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="flex gap-3 border-b border-slate-100 px-3 py-3">
          <div className="h-8 w-8 rounded-full bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-slate-100" />
            <div className="h-3 w-3/4 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
