import { ReactNode, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, children, className, actions }: {
  title?: string; description?: ReactNode; children: ReactNode; className?: string; actions?: ReactNode;
}) {
  return (
    <section className={cn('rounded-xl border border-slate-200 bg-white p-5 shadow-sm', className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">{children}</div>;
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin', className)} />;
}

export function Loading() {
  return (
    <div className="flex items-center gap-2 py-10 text-sm text-slate-500">
      <Spinner /> Loading…
    </div>
  );
}

export function Pill({ tone = 'slate', children }: { tone?: 'slate' | 'green' | 'amber' | 'red' | 'blue'; children: ReactNode }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-800 ring-amber-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-transparent', tones[tone])}>
      {children}
    </span>
  );
}

/** Wraps a destructive / outward-facing action in a confirm dialog. */
export function Confirm({ trigger, title, description, confirmLabel = 'Confirm', destructive, onConfirm }: {
  trigger: ReactNode; title: string; description?: ReactNode; confirmLabel?: string; destructive?: boolean;
  onConfirm: () => Promise<unknown> | void;
}) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription asChild><div>{description}</div></AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            className={destructive ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-slate-900 text-white hover:bg-slate-800'}
            onClick={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await onConfirm();
                setOpen(false);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy && <Spinner className="mr-2" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Run a Supabase call, toast the error, return whether it succeeded. */
export async function attempt(fn: () => PromiseLike<{ error: { message: string } | null }>, success?: string) {
  const { error } = await fn();
  if (error) {
    toast.error(friendlyError(error.message));
    return false;
  }
  if (success) toast.success(success);
  return true;
}

export function friendlyError(message: string) {
  if (/duplicate key/i.test(message)) return 'That already exists.';
  if (/Failed to fetch|NetworkError|Load failed/i.test(message)) return 'Could not reach the server. Check your connection; if you use an ad blocker (Brave Shields, uBlock), turn it off for icopedia.co and try again.';
  if (/row-level security|permission denied|admin only/i.test(message)) return 'Not allowed: your account is not an admin.';
  if (/test_phone_numbers_phone_e164/.test(message)) return 'Phone must look like +919876543210.';
  return message;
}

export function fmtDate(value?: string | null, withTime = true) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function timeAgo(value?: string | null) {
  if (!value) return 'never';
  const s = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} d ago`;
  return fmtDate(value, false);
}

/** "98765 43210" / "919876543210" / "+91 98765-43210" -> "+919876543210". */
export function normalizePhone(input: string, defaultCountry = '91') {
  const raw = input.trim();
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (raw.startsWith('+')) return `+${digits}`;
  if (digits.length === 10) return `+${defaultCountry}${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `+${defaultCountry}${digits.slice(1)}`;
  return `+${digits}`;
}

export const isE164 = (phone: string) => /^\+[1-9]\d{7,14}$/.test(phone);

/** Last 10 digits, for matching phone numbers stored in different formats. */
export const phoneKey = (phone?: string | null) => (phone ?? '').replace(/\D/g, '').slice(-10);
