import { FormEvent, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { isE164, normalizePhone, Spinner } from './shared';

export default function Login({ notAdmin }: { notAdmin?: boolean }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const normalized = normalizePhone(phone);

  async function requestCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isE164(normalized)) {
      setError('Enter a valid mobile number, e.g. 98765 43210.');
      return;
    }
    setBusy(true);
    try {
      // Same gate the app uses: allowlisted numbers only, 5 requests / 15 min.
      const { data: gate, error: gateError } = await supabase.rpc('check_otp_request_allowed', { phone_input: normalized });
      if (gateError) throw gateError;
      if (gate && gate.allowed !== true) {
        setError(
          gate.reason === 'rate_limited'
            ? `Too many codes requested. Try again in ${Math.ceil((gate.retry_after_seconds ?? 60) / 60)} min.`
            : 'This number is not allowed to sign in.',
        );
        return;
      }
      // shouldCreateUser: false so the admin page can never mint new accounts.
      const { error: otpError } = await supabase.auth.signInWithOtp({ phone: normalized, options: { shouldCreateUser: false } });
      if (otpError) throw otpError;
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({ phone: normalized, token: code.trim(), type: 'sms' });
    setBusy(false);
    if (verifyError) setError(verifyError.message);
    // On success AdminAuthProvider picks up the session and swaps this screen out.
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <img src="/icopedia-logo.png" alt="" className="h-10 w-10 rounded-lg object-contain" />
          <div>
            <div className="text-lg font-semibold text-slate-900">iCOPEDIA Admin</div>
            <div className="text-xs text-slate-500">Sign in with your admin mobile number</div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {notAdmin && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              You're signed in, but this account isn't an admin. Sign in with an admin number.
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={requestCode} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Mobile number</Label>
                <Input id="phone" inputMode="tel" autoComplete="tel" placeholder="98765 43210" value={phone}
                  onChange={(e) => setPhone(e.target.value)} autoFocus />
                {phone && <p className="text-xs text-slate-500">We'll text a code to {normalized}</p>}
              </div>
              <Button type="submit" className="w-full bg-slate-900 text-white hover:bg-slate-800" disabled={busy}>
                {busy && <Spinner className="mr-2" />} Send code
              </Button>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="code">6-digit code sent to {normalized}</Label>
                <Input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456"
                  className="font-mono text-lg tracking-[0.4em]" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} autoFocus />
              </div>
              <Button type="submit" className="w-full bg-slate-900 text-white hover:bg-slate-800" disabled={busy || code.length < 6}>
                {busy && <Spinner className="mr-2" />} Verify & sign in
              </Button>
              <button type="button" className="w-full text-center text-xs text-slate-500 hover:text-slate-900"
                onClick={() => { setStep('phone'); setCode(''); setError(null); }}>
                Use a different number
              </button>
            </form>
          )}

          {error && <p className="mt-4 rounded-md bg-red-50 p-2.5 text-sm text-red-700">{error}</p>}
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5" /> Access is checked on the server for every action.
        </p>
      </div>
    </div>
  );
}
