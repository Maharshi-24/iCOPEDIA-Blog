import { supabase } from '@/lib/supabase';

// Client for api/admin-mail.ts. Every call carries the signed-in admin's
// Supabase session; the function checks is_admin() before touching IMAP.

export type Role = 'inbox' | 'sent' | 'drafts' | 'archive' | 'junk' | 'trash';
export type Address = { name: string; address: string };
export type Folder = { path: string; name: string; role: Role | null; total: number; unread: number };

export type ListItem = {
  uid: number;
  subject: string;
  from: Address | null;
  to: Address[];
  date: string | null;
  seen: boolean;
  flagged: boolean;
  answered: boolean;
  draft: boolean;
  hasAttachments: boolean;
  size: number;
};

export type AttachmentMeta = { index: number; filename: string; contentType: string; size: number; inline: boolean };

export type FullMessage = {
  uid: number;
  folder: string;
  subject: string;
  from: Address | null;
  replyTo: Address[];
  to: Address[];
  cc: Address[];
  bcc: Address[];
  date: string | null;
  messageId: string;
  inReplyTo: string;
  references: string;
  flagged: boolean;
  draft: boolean;
  html: string | null;
  text: string | null;
  attachments: AttachmentMeta[];
};

export type Upload = { filename: string; contentType?: string; content: string; size: number };

export type ComposePayload = {
  fromName?: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  text: string;
  attachments: Omit<Upload, 'size'>[];
  inReplyTo?: string;
  references?: string;
  replyRef?: { folder: string; uid: number };
  forwardRef?: { folder: string; uid: number; attachments: number[] };
  draftUid?: number;
};

async function call<T>(init: { query?: Record<string, string | number>; body?: unknown }): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const qs = init.query
    ? `?${new URLSearchParams(Object.entries(init.query).map(([k, v]) => [k, String(v)]))}`
    : '';
  const res = await fetch(`/api/admin-mail${qs}`, {
    method: init.body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${data.session?.access_token ?? ''}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `Request failed (${res.status})`);
  return json as T;
}

export const mail = {
  mailboxes: () => call<{ mailboxes: string[] }>({}),
  folders: (mailbox: string) => call<{ folders: Folder[] }>({ query: { view: 'folders', mailbox } }),
  list: (mailbox: string, folder: string, offset: number, q: string, limit = 50) =>
    call<{ total: number; offset: number; messages: ListItem[] }>({
      query: { view: 'list', mailbox, folder, offset, limit, ...(q ? { q } : {}) },
    }),
  message: (mailbox: string, folder: string, uid: number) =>
    call<FullMessage>({ query: { view: 'message', mailbox, folder, uid } }),
  attachment: (mailbox: string, folder: string, uid: number, index: number) =>
    call<{ filename: string; contentType: string; content: string }>({
      query: { view: 'attachment', mailbox, folder, uid, index },
    }),
  send: (mailbox: string, payload: ComposePayload) =>
    call<{ message: string; warning?: string }>({ body: { action: 'send', mailbox, ...payload } }),
  saveDraft: (mailbox: string, payload: ComposePayload) =>
    call<{ uid: number | null; folder: string }>({ body: { action: 'draft', mailbox, ...payload } }),
  flag: (mailbox: string, folder: string, uids: number[], flag: 'seen' | 'flagged', value: boolean) =>
    call({ body: { action: 'flag', mailbox, folder, uids, flag, value } }),
  move: (mailbox: string, folder: string, uids: number[], to: Role | string) =>
    call({ body: { action: 'move', mailbox, folder, uids, to } }),
  remove: (mailbox: string, folder: string, uids: number[]) =>
    call({ body: { action: 'delete', mailbox, folder, uids } }),
};

// ---------------------------------------------------------------- formatting

export const fmtSize = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export const displayName = (a?: Address | null) => (a ? a.name || a.address : '');
export const fullAddress = (a: Address) => (a.name ? `${a.name} <${a.address}>` : a.address);

/** "10:42 am" today, "21 Oct" this year, "21/10/25" before that. */
export function listDate(value: string | null) {
  if (!value) return '';
  const d = new Date(value);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  }
  if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export const longDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
      })
    : '';

const AVATAR_TONES = [
  'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-700', 'bg-violet-100 text-violet-700', 'bg-cyan-100 text-cyan-800',
];

export function avatarFor(a?: Address | null) {
  const key = a?.address ?? '?';
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  const label = (a?.name || a?.address || '?').replace(/[^\p{L}\p{N}]/gu, '').slice(0, 1).toUpperCase() || '?';
  return { label, tone: AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length] };
}

export function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function downloadBase64(filename: string, contentType: string, base64: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: contentType || 'application/octet-stream' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
