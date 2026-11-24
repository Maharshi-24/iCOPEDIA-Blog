import { Pill } from '../shared';

// Table contact_submissions (backend migrations 20261124180000_contact_submissions.sql
// and 20261124190000_contact_submissions_followup.sql), filled by the
// "Contact us" form on icopedia.co through /api/contact.
export type Submission = {
  id: number;
  name: string;
  email: string;
  role: string | null;
  company: string | null;
  message: string;
  status: Status;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const STATUSES = [
  { key: 'new', label: 'New', tone: 'amber' },
  { key: 'contacted', label: 'Contacted', tone: 'blue' },
  { key: 'converted', label: 'Converted', tone: 'green' },
  { key: 'closed', label: 'Closed', tone: 'slate' },
] as const;
export type Status = (typeof STATUSES)[number]['key'];

export const SUBMISSION_COLUMNS = 'id, name, email, role, company, message, status, notes, created_at, updated_at';

export const statusLabel = (s: Status) => STATUSES.find((x) => x.key === s)?.label ?? s;

export function StatusPill({ status }: { status: Status }) {
  const s = STATUSES.find((x) => x.key === status);
  return <Pill tone={s?.tone ?? 'slate'}>{s?.label ?? status}</Pill>;
}

/** Tells the sidebar to refresh its "new messages" badge. */
export const CONTACT_CHANGED = 'icopedia:contact-changed';
export const contactChanged = () => window.dispatchEvent(new Event(CONTACT_CHANGED));
