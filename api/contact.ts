import type { VercelRequest, VercelResponse } from '@vercel/node';

type ContactFormData = {
  name: string;
  email: string;
  message: string;
  role?: string;
  company?: string;
  /** Honeypot: hidden on the form, so only bots fill it in. */
  website?: string;
};

// Submissions are saved to Supabase (table contact_submissions, backend
// migration 20261124180000_contact_submissions.sql) and shown on /admin/contact.
// They are not emailed. The anon key is public; the RPC is the only way
// in and it validates and rate limits on its own.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bdsaakhxumazaxigqchm.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkc2Fha2h4dW1hemF4aWdxY2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NzYxMjYsImV4cCI6MjA4MzI1MjEyNn0.zlidJunY3hQDQrj2hJfvwM3GSh6wTCUwRxIh_DjhXV4';

type Saved = 'saved' | 'rate_limited' | 'failed';

async function save(fields: { name: string; email: string; message: string; role?: string; company?: string }): Promise<Saved> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/submit_contact_message`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        p_name: fields.name,
        p_email: fields.email,
        p_message: fields.message,
        p_role: fields.role ?? null,
        p_company: fields.company ?? null,
      }),
    });
    if (res.ok) return 'saved';
    const body = await res.text();
    if (body.includes('54000')) return 'rate_limited';
    console.error('Saving contact submission failed', res.status, body);
  } catch (error) {
    console.error('Saving contact submission failed', error);
  }
  return 'failed';
}

/**
 * Only accept posts made by a page on the same site. Browsers always send
 * Origin on a POST from fetch(); scripts hitting the endpoint directly usually
 * don't, or send another site.
 */
function sameSite(req: VercelRequest): boolean {
  const origin = req.headers.origin;
  if (!origin) return false;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!sameSite(req)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    const { name: rawName, email, message, role, company, website } = (req.body ?? {}) as Partial<ContactFormData>;

    // A filled honeypot means a bot: answer as if it worked, send nothing.
    if (website) {
      return res.status(200).json({ message: 'Message sent successfully!' });
    }

    if (typeof rawName !== 'string' || typeof email !== 'string' || typeof message !== 'string' || !rawName || !email || !message.trim()) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    // No line breaks or control characters in the name.
    const name = rawName.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim();
    if (!name) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const cleanRole = typeof role === 'string' ? role.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim() : '';
    const cleanCompany = typeof company === 'string' ? company.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim() : '';

    if (name.length > 100 || email.length > 200 || message.length > 5000 || cleanRole.length > 60 || cleanCompany.length > 150) {
      return res.status(400).json({ message: 'One or more fields are too long' });
    }

    const saved = await save({ name, email, message: message.trim(), role: cleanRole || undefined, company: cleanCompany || undefined });
    if (saved === 'rate_limited') {
      return res.status(429).json({ message: 'Too many messages. Please try again later.' });
    }

    if (saved === 'saved') {
      return res.status(200).json({ message: 'Message sent successfully!' });
    }
    return res.status(500).json({ message: 'Error sending message' });
  } catch (error) {
    console.error('Error handling contact form:', error);
    return res.status(500).json({ message: 'Error sending message' });
  }
}
