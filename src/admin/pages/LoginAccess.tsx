import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { Empty, fmtDate, Loading, PageHeader, Panel, phoneKey, Pill, timeAgo } from '../shared';

type Profile = { id: string; full_name: string | null; phone_no: string | null; app_role: string; created_at: string };
type Attempt = { phone: string; requested_at: string };

const DAYS = 30;
// The four fake numbers send-sms-hook never texts; their codes show in the
// Test OTP viewer instead.
const TEST_PREFIX = '+9199999999';

// Anyone can sign up since migration 20261124160000_open_otp_to_all_numbers:
// check_otp_request_allowed only rate-limits (5 OTPs per number per 15 min).
// The old test_phone_numbers allowlist no longer gates anything, so this page
// shows who is requesting login codes instead of managing that list.
export default function LoginAccess() {
  const [attempts, setAttempts] = useState<Attempt[] | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    const since = new Date(Date.now() - DAYS * 86400_000).toISOString();
    const [a, p] = await Promise.all([
      supabase.from('otp_send_attempts').select('phone, requested_at').gte('requested_at', since)
        .order('requested_at', { ascending: false }).limit(5000),
      supabase.from('user_profiles').select('id, full_name, phone_no, app_role, created_at'),
    ]);
    setAttempts((a.data as Attempt[]) ?? []);
    setProfiles((p.data as Profile[]) ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const profileByPhone = useMemo(() => new Map(profiles.map((p) => [phoneKey(p.phone_no), p])), [profiles]);

  // One row per number, newest request first.
  const rows = useMemo(() => {
    if (!attempts) return null;
    const byPhone = new Map<string, { phone: string; last: string; count: number; last24h: number }>();
    const dayAgo = Date.now() - 86400_000;
    for (const a of attempts) {
      const r = byPhone.get(a.phone) ?? { phone: a.phone, last: a.requested_at, count: 0, last24h: 0 };
      r.count += 1;
      if (new Date(a.requested_at).getTime() >= dayAgo) r.last24h += 1;
      byPhone.set(a.phone, r);
    }
    return [...byPhone.values()];
  }, [attempts]);

  const filtered = (rows ?? []).filter((r) => {
    if (!query) return true;
    const q = query.toLowerCase();
    const p = profileByPhone.get(phoneKey(r.phone));
    return r.phone.includes(q.replace(/\s/g, '')) || (p?.full_name ?? '').toLowerCase().includes(q);
  });

  const signedUp = (rows ?? []).filter((r) => profileByPhone.has(phoneKey(r.phone))).length;

  return (
    <>
      <PageHeader
        title="Login activity"
        description={`Every number that asked for a login code in the last ${DAYS} days. Anyone can sign up. Each number is limited to 5 codes per 15 minutes.`}
        actions={
          <Button variant="outline" asChild>
            <a href="/admin/otp-viewer" target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Test OTP viewer</a>
          </Button>
        }
      />

      <Panel
        title={rows ? `${rows.length} numbers · ${signedUp} with an account` : 'Numbers'}
        actions={
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input className="h-9 pl-8" placeholder="Number or name" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        }
      >
        {!rows ? <Loading /> : filtered.length === 0 ? <Empty>{rows.length ? 'No numbers match.' : 'No login codes requested yet.'}</Empty> : (
          <div className="-mx-5 overflow-x-auto">
            <table className="stack-table w-full text-sm sm:min-w-[640px]">
              <thead className="border-y border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-2 font-medium">Number</th>
                  <th className="px-3 py-2 font-medium">App account</th>
                  <th className="px-3 py-2 font-medium">Codes ({DAYS} d)</th>
                  <th className="px-5 py-2 font-medium">Last code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => {
                  const p = profileByPhone.get(phoneKey(r.phone));
                  return (
                    <tr key={r.phone}>
                      <td className="whitespace-nowrap px-5 py-2.5 font-mono max-sm:font-semibold">
                        {r.phone}
                        {r.phone.startsWith(TEST_PREFIX) && <span className="ml-1.5 font-sans"><Pill>test</Pill></span>}
                      </td>
                      <td data-label="App account" className="px-3 py-2.5">
                        {p ? (
                          <span className="flex flex-wrap items-center gap-1.5">
                            {p.full_name || 'Unnamed'}
                            {p.app_role !== 'user' && <Pill tone="blue">{p.app_role.replace('_', ' ')}</Pill>}
                            <span className="text-xs text-slate-500">joined {fmtDate(p.created_at, false)}</span>
                          </span>
                        ) : <span className="text-slate-400">not signed up yet</span>}
                      </td>
                      <td data-label={`Codes (${DAYS} d)`} className="px-3 py-2.5 text-slate-600">
                        {r.count}
                        {r.last24h > 0 && <span className="text-xs text-slate-500"> · {r.last24h} today</span>}
                      </td>
                      <td data-label="Last code" className="whitespace-nowrap px-5 py-2.5 text-slate-500">{timeAgo(r.last)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
