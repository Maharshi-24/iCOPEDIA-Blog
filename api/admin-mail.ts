import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';

// Sends mail as one of the real @icopedia.co cPanel mailboxes, for the /admin
// "Email" page. Each mailbox is enabled by giving it a password env var:
//   MAIL_PASS_HELLO     -> hello@icopedia.co
//   MAIL_PASS_SUPPORT   -> support@icopedia.co
// so adding a mailbox later needs no code change. Passwords never leave this
// function; the browser only ever sees the list of addresses.

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
// Vercel caps request bodies at 4.5 MB and base64 adds a third on top.
const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;
const EMAIL_RE = /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]+$/;

type Attachment = { filename: string; contentType?: string; content: string };
type SendBody = {
  from: string;
  fromName?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text: string;
  attachments?: Attachment[];
};

function mailboxes(): string[] {
  return Object.keys(process.env)
    .filter((k) => k.startsWith(PASS_PREFIX) && process.env[k])
    .map((k) => `${k.slice(PASS_PREFIX.length).toLowerCase().replace(/_/g, '.')}@${MAIL_DOMAIN}`)
    .sort();
}

function passwordFor(address: string): string | undefined {
  const [local, domain] = address.toLowerCase().split('@');
  if (domain !== MAIL_DOMAIN || !local) return undefined;
  return process.env[`${PASS_PREFIX}${local.replace(/\./g, '_').toUpperCase()}`];
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

function imapFor(address: string, pass: string) {
  return new ImapFlow({
    host: MAIL_HOST,
    port: 993,
    secure: true,
    auth: { user: address, pass },
    logger: false,
  });
}

/** The mailbox's Sent folder: the \Sent special-use flag, else a folder named Sent. */
async function sentPath(client: ImapFlow): Promise<string> {
  const list = await client.list();
  return (
    list.find((m) => m.specialUse === '\\Sent')?.path ??
    list.find((m) => /(^|[./])sent$/i.test(m.path))?.path ??
    'INBOX.Sent'
  );
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function cleanList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((v) => String(v).trim().toLowerCase()).filter(Boolean))];
}

async function listSent(res: VercelResponse, address: string, pass: string, limit: number) {
  const client = imapFor(address, pass);
  await client.connect();
  try {
    const path = await sentPath(client);
    const lock = await client.getMailboxLock(path);
    try {
      const total = client.mailbox ? client.mailbox.exists : 0;
      const messages: Array<Record<string, unknown>> = [];
      if (total > 0) {
        const range = `${Math.max(1, total - limit + 1)}:*`;
        for await (const msg of client.fetch(range, { envelope: true, internalDate: true, size: true })) {
          const env = msg.envelope;
          const when = env?.date ?? msg.internalDate;
          messages.push({
            uid: msg.uid,
            subject: env?.subject ?? '',
            to: (env?.to ?? []).map((a) => a.address).filter(Boolean),
            cc: (env?.cc ?? []).map((a) => a.address).filter(Boolean),
            date: when ? new Date(when).toISOString() : null,
            size: msg.size,
          });
        }
      }
      messages.reverse();
      return res.status(200).json({ mailbox: address, folder: path, total, messages });
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => undefined);
  }
}

async function send(res: VercelResponse, body: SendBody) {
  const from = String(body.from ?? '').trim().toLowerCase();
  const pass = passwordFor(from);
  if (!pass) return res.status(400).json({ message: `${from || 'That address'} is not set up for sending` });

  const to = cleanList(body.to);
  const cc = cleanList(body.cc);
  const bcc = cleanList(body.bcc);
  const all = [...to, ...cc, ...bcc];
  if (to.length === 0) return res.status(400).json({ message: 'Add at least one recipient in To' });
  if (all.length > MAX_RECIPIENTS) return res.status(400).json({ message: `At most ${MAX_RECIPIENTS} recipients per email` });
  const bad = all.find((a) => !EMAIL_RE.test(a));
  if (bad) return res.status(400).json({ message: `Not a valid email address: ${bad}` });

  const subject = String(body.subject ?? '').trim();
  const text = String(body.text ?? '');
  if (!subject) return res.status(400).json({ message: 'Subject is required' });
  if (subject.length > MAX_SUBJECT) return res.status(400).json({ message: 'Subject is too long' });
  if (!text.trim()) return res.status(400).json({ message: 'Message is empty' });
  if (text.length > MAX_BODY) return res.status(400).json({ message: 'Message is too long' });

  const attachments = (Array.isArray(body.attachments) ? body.attachments : []).map((a) => ({
    filename: String(a.filename || 'attachment').slice(0, 200),
    contentType: a.contentType || undefined,
    content: Buffer.from(String(a.content ?? ''), 'base64'),
  }));
  const attachmentBytes = attachments.reduce((n, a) => n + a.content.length, 0);
  if (attachmentBytes > MAX_ATTACHMENT_BYTES) return res.status(400).json({ message: 'Attachments are larger than 3 MB in total' });

  const fromName = String(body.fromName ?? '').trim().slice(0, 100);
  const mail = {
    from: fromName ? { name: fromName, address: from } : from,
    to,
    cc: cc.length ? cc : undefined,
    bcc: bcc.length ? bcc : undefined,
    subject,
    text,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#1e293b">${escapeHtml(text).replace(/\r?\n/g, '<br>')}</div>`,
    attachments,
    // Fixed up front so the delivered mail and the Sent-folder copy match.
    messageId: `<${randomUUID()}@${MAIL_DOMAIN}>`,
    date: new Date(),
  };

  const transporter = nodemailer.createTransport({
    host: MAIL_HOST,
    port: 465,
    secure: true,
    auth: { user: from, pass },
  });
  try {
    await transporter.sendMail(mail);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('admin-mail send failed', from, msg);
    if (/auth|535|credentials/i.test(msg)) {
      return res.status(502).json({ message: `The mail server rejected the login for ${from}. Check its password in Vercel.` });
    }
    return res.status(502).json({ message: `The mail server refused the email: ${msg}` });
  }

  // File a copy (Bcc kept) in the mailbox's Sent folder so it shows in webmail
  // and phone mail apps like any other sent mail. The email is already out,
  // so a failure here is only a warning.
  let warning: string | undefined;
  try {
    // The stream transport only renders the message (and keeps Bcc), it doesn't send.
    const { message } = await nodemailer
      .createTransport({ streamTransport: true, buffer: true })
      .sendMail(mail);
    const raw = message as Buffer; // buffer: true, so never a stream
    const client = imapFor(from, pass);
    await client.connect();
    try {
      await client.append(await sentPath(client), raw, ['\\Seen'], mail.date);
    } finally {
      await client.logout().catch(() => undefined);
    }
  } catch (error) {
    console.error('admin-mail sent-copy failed', from, error);
    warning = 'Sent, but a copy could not be saved to the Sent folder.';
  }

  return res.status(200).json({ message: 'Email sent', messageId: mail.messageId, warning });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    if (!(await isAdmin(req))) return res.status(403).json({ message: 'Admins only' });

    if (req.method === 'POST') return await send(res, (req.body ?? {}) as SendBody);

    if (req.query.view === 'sent') {
      const address = String(req.query.mailbox ?? '').toLowerCase();
      const pass = passwordFor(address);
      if (!pass) return res.status(400).json({ message: `${address || 'That address'} is not set up` });
      const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
      return await listSent(res, address, pass, limit);
    }

    return res.status(200).json({ mailboxes: mailboxes(), domain: MAIL_DOMAIN });
  } catch (error) {
    console.error('admin-mail error', error);
    const msg = error instanceof Error ? error.message : 'Unexpected error';
    return res.status(500).json({ message: msg });
  }
}
