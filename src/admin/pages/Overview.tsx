import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Loading, PageHeader, Panel, timeAgo } from '../shared';

type Stats = Record<string, number> & {
  users_by_role: Record<string, number>;
  devices_by_platform: Record<string, number>;
};

type VersionRow = { platform: string; latest_version: string; min_required_version: string; update_type: string; is_active: boolean };
type AuditRow = { id: number; table_name: string; action: string; created_at: string };

export default function Overview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [recent, setRecent] = useState<AuditRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.rpc('admin_dashboard_stats').then(({ data, error }) => {
      if (error) setError(error.message);
      else setStats(data as Stats);
    });
    supabase.from('app_versions').select('platform, latest_version, min_required_version, update_type, is_active')
      .order('platform').then(({ data }) => setVersions((data as VersionRow[]) ?? []));
    supabase.from('admin_audit_log').select('id, table_name, action, created_at')
      .order('created_at', { ascending: false }).limit(6).then(({ data }) => setRecent((data as AuditRow[]) ?? []));
  }, []);

  const devices = stats ? Object.values(stats.devices_by_platform).reduce((a, b) => a + b, 0) : 0;

  return (
    <>
      <PageHeader title="Overview" description="Live numbers from the production database." />
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Couldn't load stats: {error}</p>}
      {!stats && !error && <Loading />}
      {stats && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Users" value={stats.users_total} sub={`+${stats.users_new_7d} this week`} />
          <Stat label="Seen in 24 h" value={stats.seen_24h} sub={`${stats.active_sessions} active sessions`} />
          <Stat label="Push devices" value={devices}
            sub={Object.entries(stats.devices_by_platform).map(([k, v]) => `${v} ${k}`).join(' · ') || 'none yet'} />
          <Stat label="Login codes (24 h)" value={stats.otp_requests_24h} sub="anyone can sign up" to="login-access" />
          <Stat label="Admins" value={stats.users_by_role.admin ?? 0} sub={`${stats.users_by_role.company_admin ?? 0} company admins`} to="users" />
          <Stat label="Premium users" value={stats.premium_users} />
          <Stat label="News live" value={stats.news_published} sub={`${stats.notifications_total} notifications sent`} to="news" />
          <Stat label="Tutorial videos" value={stats.tutorial_videos} sub={`${stats.companies} companies`} to="videos" />
          <Stat label="BOQs" value={stats.boqs} />
          <Stat label="Daily reports" value={stats.daily_visits} />
          <Stat label="Calibrations" value={stats.calibrations} />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="App versions" actions={<MoreLink to="versions" />}>
          <div className="divide-y divide-slate-100">
            {versions.map((v) => (
              <div key={v.platform} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-medium capitalize">{v.platform}</span>
                <span className="text-slate-500">
                  latest <b className="text-slate-900">{v.latest_version}</b> · min <b className="text-slate-900">{v.min_required_version}</b>
                  {!v.is_active && ' · off'}
                </span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Recent changes" actions={<MoreLink to="activity" />}>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing yet. Changes made here will be listed with full history.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recent.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span><span className="font-medium">{r.action.toLowerCase()}</span> · {r.table_name.replace(/_/g, ' ')}</span>
                  <span className="text-slate-500">{timeAgo(r.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

function Stat({ label, value, sub, to }: { label: string; value: number; sub?: string; to?: string }) {
  const body = (
    <>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value.toLocaleString('en-IN')}</div>
      {sub && <div className="mt-0.5 truncate text-xs text-slate-500">{sub}</div>}
    </>
  );
  const cls = 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm';
  return to ? <Link to={`/admin/${to}`} className={`${cls} transition-colors hover:border-slate-300`}>{body}</Link> : <div className={cls}>{body}</div>;
}

function MoreLink({ to }: { to: string }) {
  return (
    <Link to={`/admin/${to}`} className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900">
      Open <ArrowRight className="h-3 w-3" />
    </Link>
  );
}
