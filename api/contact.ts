import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

type ContactFormData = {
  name: string;
  email: string;
  message: string;
  /** Honeypot: hidden on the form, so only bots fill it in. */
  website?: string;
};

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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
    const { name: rawName, email, message, website } = (req.body ?? {}) as Partial<ContactFormData>;

    // A filled honeypot means a bot: answer as if it worked, send nothing.
    if (website) {
      return res.status(200).json({ message: 'Message sent successfully!' });
    }

    if (typeof rawName !== 'string' || typeof email !== 'string' || typeof message !== 'string' || !rawName || !email || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    // The name goes into the subject line: no line breaks or control characters.
    const name = rawName.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim();
    if (!name) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    if (name.length > 100 || email.length > 200 || message.length > 5000) {
      return res.status(400).json({ message: 'One or more fields are too long' });
    }

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const contactTo = process.env.CONTACT_TO_EMAIL || 'info@iCOPEDIA.com';

    if (!emailUser || !emailPass) {
      console.error('Email service is not configured: missing EMAIL_USER or EMAIL_PASS');
      return res.status(500).json({ message: 'Email service is not configured' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    await transporter.sendMail({
      from: emailUser,
      to: contactTo,
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
      `,
    });

    return res.status(200).json({ message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ message: 'Error sending email' });
  }
}
