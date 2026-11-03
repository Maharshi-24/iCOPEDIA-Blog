import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import nodemailer from 'nodemailer';
import { ImapFlow, type MessageStructureObject } from 'imapflow';
import { simpleParser, type AddressObject } from 'mailparser';

// Webmail backend for the /admin "Email" page, on top of the real @icopedia.co
// cPanel mailboxes (IMAP mail.icopedia.co:993, SMTP :465). Each mailbox is
// enabled by giving it a password env var:
//   MAIL_PASS_HELLO     -> hello@icopedia.co
//   MAIL_PASS_SUPPORT   -> support@icopedia.co
// so adding a mailbox later needs no code change. Passwords never leave this
// function; the browser only ever sees addresses and mail content.
//
// GET  ?view=                      -> configured mailboxes
// GET  ?view=folders&mailbox=      -> folders with total/unread counts
// GET  ?view=list&mailbox=&folder=&offset=&limit=&q=
// GET  ?view=message&mailbox=&folder=&uid=      (marks it read)
// GET  ?view=attachment&mailbox=&folder=&uid=&index=
// POST { action: 'send' | 'draft' | 'flag' | 'move' | 'delete', mailbox, ... }

const MAIL_DOMAIN = process.env.MAIL_DOMAIN || 'icopedia.co';
const MAIL_HOST = process.env.MAIL_HOST || 'mail.icopedia.co';
const PASS_PREFIX = 'MAIL_PASS_';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bdsaakhxumazaxigqchm.supabase.co';
// Public anon key (same one shipped in the site and the app). It only lets us
// ask Supabase "is this session an admin?" on behalf of the caller's own JWT.
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkc2Fha2h4dW1hemF4aWdxY2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NzYxMjYsImV4cCI6MjA4MzI1MjEyNn0.zlidJunY3hQDQrj2hJfvwM3GSh6wTCUwRxIh_DjhXV4';

const MAX_RECIPIENTS = 50;
const MAX_SUBJECT = 300;
const MAX_BODY = 100_000;
// Vercel caps request and response bodies at 4.5 MB and base64 adds a third.
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const MAX_DOWNLOAD_BYTES = 3 * 1024 * 1024;
// Forwarded attachments are read server side, so only the mail server's limit applies.
const MAX_FORWARD_BYTES = 20 * 1024 * 1024;
const MAX_HTML = 2_000_000;
const EMAIL_RE = /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]+$/;

type Role = 'inbox' | 'sent' | 'drafts' | 'archive' | 'junk' | 'trash';
const ROLE_BY_FLAG: Record<string, Role> = {
  '\\Inbox': 'inbox', '\\Sent': 'sent', '\\Drafts': 'drafts',
  '\\Archive': 'archive', '\\Junk': 'junk', '\\Trash': 'trash',
};
const ROLE_ORDER: Role[] = ['inbox', 'drafts', 'sent', 'archive', 'junk', 'trash'];
const ROLE_NAMES: Record<Role, string> = {
  inbox: 'Inbox', sent: 'Sent', drafts: 'Drafts', archive: 'Archive', junk: 'Spam', trash: 'Trash',
};

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type Address = { name: string; address: string };
type Upload = { filename: string; contentType?: string; content: string };
type ComposeBody = {
  mailbox: string;
  fromName?: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  text?: string;
  attachments?: Upload[];
  inReplyTo?: string;
  references?: string;
  /** The message being replied to; gets the \Answered flag after sending. */
  replyRef?: { folder: string; uid: number };
  /** The message being forwarded and which of its attachments to carry over. */
  forwardRef?: { folder: string; uid: number; attachments: number[] };
  /** Draft this compose came from; removed once sent or re-saved. */
  draftUid?: number;
};

// ---------------------------------------------------------------- helpers

function mailboxes(): string[] {
  return Object.keys(process.env)
    .filter((k) => k.startsWith(PASS_PREFIX) && process.env[k])
    .map((k) => `${k.slice(PASS_PREFIX.length).toLowerCase().replace(/_/g, '.')}@${MAIL_DOMAIN}`)
    .sort();
}

function account(value: unknown) {
  const address = String(value ?? '').trim().toLowerCase();
  const [local, domain] = address.split('@');
  const pass = domain === MAIL_DOMAIN && local
    ? process.env[`${PASS_PREFIX}${local.replace(/\./g, '_').toUpperCase()}`]
    : undefined;
  if (!pass) throw new HttpError(400, `${address || 'That address'} is not set up`);
  return { address, pass };
}

async function isAdmin(req: VercelRequest): Promise<boolean> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return false;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/is_admin`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: auth, 'Content-Type': 'application/json' },
    body: '{}',
  });
  return res.ok && (await res.json()) === true;
}

async function withImap<T>(acct: { address: string; pass: string }, fn: (c: ImapFlow) => Promise<T>): Promise<T> {
  const client = new ImapFlow({
    host: MAIL_HOST, port: 993, secure: true, auth: { user: acct.address, pass: acct.pass }, logger: false,
  });
  try {
    await client.connect();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (/auth/i.test(msg)) throw new HttpError(502, `The mail server rejected the login for ${acct.address}. Check its password in Vercel.`);
    throw error;
  }
  try {
    return await fn(client);
  } finally {
    await client.logout().catch(() => undefined);
  }
}

/** Runs fn with `path` selected, so uid-based commands apply to that folder. */
async function inFolder<T>(c: ImapFlow, path: string, fn: () => Promise<T>): Promise<T> {
  const lock = await c.getMailboxLock(path);
  try {
    return await fn();
  } finally {
    lock.release();
  }
}

async function rolePath(c: ImapFlow, role: Role): Promise<string> {
  const list = await c.list();
  const hit = list.find((m) => ROLE_BY_FLAG[m.specialUse ?? ''] === role);
  if (hit) return hit.path;
  if (role === 'inbox') return 'INBOX';
  throw new HttpError(400, `This mailbox has no ${ROLE_NAMES[role]} folder`);
}

const toAddresses = (value?: AddressObject | AddressObject[]): Address[] =>
  (Array.isArray(value) ? value : value ? [value] : [])
    .flatMap((v) => v.value)
    .filter((a) => a.address)
    .map((a) => ({ name: a.name || '', address: a.address!.toLowerCase() }));

const envelopeAddresses = (list?: Array<{ name?: string; address?: string }>): Address[] =>
  (list ?? []).filter((a) => a.address).map((a) => ({ name: a.name || '', address: a.address!.toLowerCase() }));

function hasAttachment(node?: MessageStructureObject): boolean {
  if (!node) return false;
  if (node.disposition === 'attachment') return true;
  return (node.childNodes ?? []).some(hasAttachment);
}

function cleanList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((v) => String(v).trim().toLowerCase()).filter(Boolean))];
}

function uidList(value: unknown): number[] {
  const uids = (Array.isArray(value) ? value : []).map(Number).filter((n) => Number.isInteger(n) && n > 0);
  if (uids.length === 0) throw new HttpError(400, 'No messages selected');
  return uids;
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function parseMessage(c: ImapFlow, uid: number) {
  const msg = await c.fetchOne(String(uid), { source: true, flags: true }, { uid: true });
  if (!msg || !msg.source) throw new HttpError(404, 'That email no longer exists (moved or deleted)');
  return { parsed: await simpleParser(msg.source), flags: msg.flags ?? new Set<string>() };
}

// ---------------------------------------------------------------- reads

async function listFolders(c: ImapFlow) {
  const list = await c.list({ statusQuery: { messages: true, unseen: true } });
  return list
    .filter((m) => !m.flags.has('\\Noselect'))
    .map((m) => {
      const role = ROLE_BY_FLAG[m.specialUse ?? ''] ?? (m.path === 'INBOX' ? 'inbox' : null);
      return {
        path: m.path,
        name: role ? ROLE_NAMES[role] : m.name,
        role,
        total: m.status?.messages ?? 0,
        unread: m.status?.unseen ?? 0,
      };
    })
    .sort((a, b) => {
      const ra = a.role ? ROLE_ORDER.indexOf(a.role) : 99;
      const rb = b.role ? ROLE_ORDER.indexOf(b.role) : 99;
      return ra - rb || a.name.localeCompare(b.name);
    });
}

async function listMessages(c: ImapFlow, folder: string, offset: number, limit: number, q: string) {
  return inFolder(c, folder, async () => {
    const exists = c.mailbox ? c.mailbox.exists : 0;
    let total = exists;
    let range: string | null = null;

    if (q) {
      const found = await c.search(
        { or: [{ subject: q }, { from: q }, { to: q }, { body: q }] },
        { uid: true },
      );
      const uids = (found || []).sort((a, b) => b - a);
      total = uids.length;
      const page = uids.slice(offset, offset + limit);
      range = page.length ? page.join(',') : null;
    } else if (exists > 0 && offset < exists) {
      const end = exists - offset;
      range = `${Math.max(1, end - limit + 1)}:${end}`;
    }

    const messages: Array<Record<string, unknown>> = [];
    if (range) {
      const query = { uid: true, envelope: true, flags: true, bodyStructure: true, internalDate: true, size: true };
      for await (const m of c.fetch(range, query, { uid: !!q })) {
        const env = m.envelope;
        const when = env?.date ?? m.internalDate;
        messages.push({
          uid: m.uid,
          subject: env?.subject ?? '',
          from: envelopeAddresses(env?.from)[0] ?? null,
          to: envelopeAddresses(env?.to),
          date: when ? new Date(when).toISOString() : null,
          seen: m.flags?.has('\\Seen') ?? false,
          flagged: m.flags?.has('\\Flagged') ?? false,
          answered: m.flags?.has('\\Answered') ?? false,
          draft: m.flags?.has('\\Draft') ?? false,
          hasAttachments: hasAttachment(m.bodyStructure),
          size: m.size ?? 0,
        });
      }
    }
    messages.sort((a, b) => (b.uid as number) - (a.uid as number));
    return { folder, total, offset, messages };
  });
}

async function readMessage(c: ImapFlow, folder: string, uid: number) {
  return inFolder(c, folder, async () => {
    const { parsed, flags } = await parseMessage(c, uid);
    if (!flags.has('\\Seen')) await c.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true });

    const html = typeof parsed.html === 'string' && parsed.html.length <= MAX_HTML ? parsed.html : null;
    const references = Array.isArray(parsed.references) ? parsed.references.join(' ') : parsed.references ?? '';
    return {
      uid,
      folder,
      subject: parsed.subject ?? '',
      from: toAddresses(parsed.from)[0] ?? null,
      replyTo: toAddresses(parsed.replyTo),
      to: toAddresses(parsed.to),
      cc: toAddresses(parsed.cc),
      bcc: toAddresses(parsed.bcc),
      date: parsed.date ? parsed.date.toISOString() : null,
      messageId: parsed.messageId ?? '',
      inReplyTo: parsed.inReplyTo ?? '',
      references,
      flagged: flags.has('\\Flagged'),
      draft: flags.has('\\Draft'),
      html,
      text: parsed.text ?? (html ? null : ''),
      attachments: parsed.attachments.map((a, index) => ({
        index,
        filename: a.filename || `attachment-${index + 1}`,
        contentType: a.contentType,
        size: a.size,
        // Inline images are already embedded in `html` as data: URIs.
        inline: a.related === true,
      })),
    };
  });
}

async function readAttachment(c: ImapFlow, folder: string, uid: number, index: number) {
  return inFolder(c, folder, async () => {
    const { parsed } = await parseMessage(c, uid);
    const a = parsed.attachments[index];
    if (!a) throw new HttpError(404, 'Attachment not found');
    if (a.size > MAX_DOWNLOAD_BYTES) {
      throw new HttpError(413, `${a.filename || 'This file'} is larger than 3 MB. Download it from webmail (mail.icopedia.co) instead.`);
    }
    return { filename: a.filename || `attachment-${index + 1}`, contentType: a.contentType, content: a.content.toString('base64') };
  });
}

// ---------------------------------------------------------------- writes

/** Validates a compose body and turns it into nodemailer options. */
async function buildMail(c: ImapFlow, from: string, body: ComposeBody, forSend: boolean) {
  const to = cleanList(body.to);
  const cc = cleanList(body.cc);
  const bcc = cleanList(body.bcc);
  const all = [...to, ...cc, ...bcc];
  const subject = String(body.subject ?? '').trim();
  const text = String(body.text ?? '');

  if (forSend) {
    if (to.length === 0) throw new HttpError(400, 'Add at least one recipient in To');
    if (!subject) throw new HttpError(400, 'Subject is required');
    if (!text.trim()) throw new HttpError(400, 'Message is empty');
  }
  if (all.length > MAX_RECIPIENTS) throw new HttpError(400, `At most ${MAX_RECIPIENTS} recipients per email`);
  const bad = all.find((a) => !EMAIL_RE.test(a));
  if (bad) throw new HttpError(400, `Not a valid email address: ${bad}`);
  if (subject.length > MAX_SUBJECT) throw new HttpError(400, 'Subject is too long');
  if (text.length > MAX_BODY) throw new HttpError(400, 'Message is too long');

  const attachments: Array<{ filename: string; contentType?: string; content: Buffer }> =
    (Array.isArray(body.attachments) ? body.attachments : []).map((a) => ({
      filename: String(a.filename || 'attachment').slice(0, 200),
      contentType: a.contentType || undefined,
      content: Buffer.from(String(a.content ?? ''), 'base64'),
    }));
  if (attachments.reduce((n, a) => n + a.content.length, 0) > MAX_UPLOAD_BYTES) {
    throw new HttpError(400, 'Attachments are larger than 3 MB in total');
  }

  if (body.forwardRef?.attachments?.length) {
    const { folder, uid } = body.forwardRef;
    const original = await inFolder(c, folder, async () => (await parseMessage(c, uid)).parsed);
    let bytes = 0;
    for (const i of body.forwardRef.attachments) {
      const a = original.attachments[i];
      if (!a) continue;
      bytes += a.size;
      if (bytes > MAX_FORWARD_BYTES) throw new HttpError(400, 'Forwarded attachments are larger than 20 MB');
      attachments.push({ filename: a.filename || `attachment-${i + 1}`, contentType: a.contentType, content: a.content });
    }
  }

  const fromName = String(body.fromName ?? '').trim().slice(0, 100);
  return {
    from: fromName ? { name: fromName, address: from } : from,
    to,
    cc: cc.length ? cc : undefined,
    bcc: bcc.length ? bcc : undefined,
    subject,
    text,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#1e293b">${escapeHtml(text).replace(/\r?\n/g, '<br>')}</div>`,
    attachments,
    inReplyTo: body.inReplyTo || undefined,
    references: body.references || undefined,
    // Fixed up front so the delivered mail and the stored copy match.
    messageId: `<${randomUUID()}@${MAIL_DOMAIN}>`,
    date: new Date(),
  };
}

/** Renders a message (Bcc kept) without sending it, for storing in a folder. */
async function render(mail: Awaited<ReturnType<typeof buildMail>>): Promise<Buffer> {
  const { message } = await nodemailer.createTransport({ streamTransport: true, buffer: true }).sendMail(mail);
  return message as Buffer; // buffer: true, so never a stream
}

async function send(c: ImapFlow, acct: { address: string; pass: string }, body: ComposeBody) {
  const mail = await buildMail(c, acct.address, body, true);

  const transporter = nodemailer.createTransport({
    host: MAIL_HOST, port: 465, secure: true, auth: { user: acct.address, pass: acct.pass },
  });
  try {
    await transporter.sendMail(mail);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('admin-mail send failed', acct.address, msg);
    if (/auth|535|credentials/i.test(msg)) {
      throw new HttpError(502, `The mail server rejected the login for ${acct.address}. Check its password in Vercel.`);
    }
    throw new HttpError(502, `The mail server refused the email: ${msg}`);
  }

  // The email is out; everything below is bookkeeping, so failures are warnings.
  const warnings: string[] = [];
  try {
    await c.append(await rolePath(c, 'sent'), await render(mail), ['\\Seen'], mail.date);
  } catch (error) {
    console.error('admin-mail sent-copy failed', error);
    warnings.push('a copy could not be saved to Sent');
  }
  if (body.replyRef) {
    const { folder, uid } = body.replyRef;
    await inFolder(c, folder, () => c.messageFlagsAdd(String(uid), ['\\Answered'], { uid: true })).catch(() => undefined);
  }
  if (body.draftUid) {
    const drafts = await rolePath(c, 'drafts').catch(() => null);
    if (drafts) await inFolder(c, drafts, () => c.messageDelete(String(body.draftUid), { uid: true })).catch(() => undefined);
  }
  return { message: 'Email sent', warning: warnings.length ? `Sent, but ${warnings.join(' and ')}.` : undefined };
}

async function saveDraft(c: ImapFlow, acct: { address: string }, body: ComposeBody) {
  const mail = await buildMail(c, acct.address, body, false);
  const drafts = await rolePath(c, 'drafts');
  const result = await c.append(drafts, await render(mail), ['\\Draft', '\\Seen'], mail.date);
  if (body.draftUid) {
    await inFolder(c, drafts, () => c.messageDelete(String(body.draftUid), { uid: true })).catch(() => undefined);
  }
  return { message: 'Saved to Drafts', uid: result && typeof result === 'object' ? result.uid ?? null : null, folder: drafts };
}

const FLAGS = { seen: '\\Seen', flagged: '\\Flagged' } as const;

async function post(body: Record<string, unknown>) {
  const acct = account(body.mailbox);
  const action = String(body.action ?? 'send');
  return withImap(acct, async (c) => {
    switch (action) {
      case 'send':
        return send(c, acct, body as unknown as ComposeBody);
      case 'draft':
        return saveDraft(c, acct, body as unknown as ComposeBody);
      case 'flag': {
        const flag = FLAGS[String(body.flag) as keyof typeof FLAGS];
        if (!flag) throw new HttpError(400, 'Unknown flag');
        const uids = uidList(body.uids).join(',');
        await inFolder(c, String(body.folder), () => body.value
          ? c.messageFlagsAdd(uids, [flag], { uid: true })
          : c.messageFlagsRemove(uids, [flag], { uid: true }));
        return { message: 'Updated' };
      }
      case 'move': {
        const target = String(body.to ?? '');
        const dest = (ROLE_ORDER as string[]).includes(target) ? await rolePath(c, target as Role) : target;
        if (!dest) throw new HttpError(400, 'No destination folder');
        if (dest === body.folder) return { message: 'Already there' };
        await inFolder(c, String(body.folder), () => c.messageMove(uidList(body.uids).join(','), dest, { uid: true }));
        return { message: 'Moved' };
      }
      case 'delete': {
        // Permanent; the UI only offers this inside Trash, Spam and Drafts.
        await inFolder(c, String(body.folder), () => c.messageDelete(uidList(body.uids).join(','), { uid: true }));
        return { message: 'Deleted' };
      }
      default:
        throw new HttpError(400, 'Unknown action');
    }
  });
}

async function get(query: VercelRequest['query']) {
  const view = String(query.view ?? '');
  if (!view) return { mailboxes: mailboxes(), domain: MAIL_DOMAIN };

  const acct = account(query.mailbox);
  const folder = String(query.folder ?? 'INBOX');
  const uid = Number(query.uid);
  return withImap(acct, async (c) => {
    switch (view) {
      case 'folders':
        return { folders: await listFolders(c) };
      case 'list': {
        const offset = Math.max(Number(query.offset) || 0, 0);
        const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 100);
        return listMessages(c, folder, offset, limit, String(query.q ?? '').trim().slice(0, 200));
      }
      case 'message':
        if (!uid) throw new HttpError(400, 'Missing uid');
        return readMessage(c, folder, uid);
      case 'attachment':
        if (!uid) throw new HttpError(400, 'Missing uid');
        return readAttachment(c, folder, uid, Number(query.index) || 0);
      default:
        throw new HttpError(400, 'Unknown view');
    }
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    if (!(await isAdmin(req))) return res.status(403).json({ message: 'Admins only' });
    const result = req.method === 'POST'
      ? await post((req.body ?? {}) as Record<string, unknown>)
      : await get(req.query);
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof HttpError) return res.status(error.status).json({ message: error.message });
    console.error('admin-mail error', error);
    const msg = error instanceof Error ? error.message : 'Unexpected error';
    return res.status(500).json({ message: msg });
  }
}
