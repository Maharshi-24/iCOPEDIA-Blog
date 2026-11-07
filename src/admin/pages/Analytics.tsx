import { useEffect, useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Empty, Loading, PageHeader, Panel } from '../shared';

// Totals only: admin_usage_analytics() never returns a single person's rows.

type Segment = 'free' | 'paid' | 'company' | 'admin';
type SegmentRow = { segment: Segment; users: number; new_users: number; active_users: number };
type DayRow = { day: string; segment: Segment; users: number };
type EventRow = { event: string; detail: string; segment: Segment; count: number; users: number };
type ContentRow = { item: string; segment: Segment; total: number; in_window: number; users_in_window: number };
type CoatRow = { segment: Segment; catalogue: number; typed: number };
type SavedTypeRow = { calc_type: string; live: number; starred: number; created_in_window: number; reused_in_window: number };
type PlatformRow = { platform: string; app_version: string; users: number };
type UserTypeRow = { segment: Segment; user_type: string; users: number };

type Data = {
  days: number;
  segments: SegmentRow[];
  daily_active: DayRow[];
  events: EventRow[];
  content: ContentRow[];
  boq_coats: CoatRow[];
  saved_calcs: { by_type: SavedTypeRow[]; users_with_saves: number };
  platforms: PlatformRow[];
  user_types: UserTypeRow[];
};

// Fixed order and colour per segment (reference categorical slots 1–4), so a
// segment looks the same in every chart and table.
const SEGMENTS: { key: Segment; label: string; color: string }[] = [
  { key: 'free', label: 'Free', color: '#2a78d6' },
  { key: 'paid', label: 'Paid', color: '#eb6834' },
  { key: 'company', label: 'Company', color: '#1baf7a' },
  { key: 'admin', label: 'Admin', color: '#eda100' },
];

const RANGES = [7, 30, 90, 365];

const FEATURE_LABELS: Record<string, string> = {
  calculators: 'Calculators',
  boq: 'BOQ',
  daily_report: 'Project Report',
  instruments: 'Instruments',
  product_details: 'Product Details',
  tutorials: 'Tutorials',
  news: 'News',
  notes: 'Notes',
  directory: 'Directory (coming soon)',
  alerts: 'Alerts',
  ustad: 'Ustad',
};

const CALC_LABELS: Record<string, string> = {
  coverage: 'Coverage',
  quantity: 'Quantity',
  dft_wft: 'DFT → WFT',
  mixing: 'Mixing',
  dew_point: 'Dew Point',
  unit: 'Unit Converter',
};

const CONTENT_LABELS: Record<string, string> = {
  boq: 'BOQs',
  daily_project: 'Report projects',
  daily_visit: 'Site visits',
  instrument: 'Instruments',
  note: 'Notes',
  ustad_message: 'Ustad questions',
};

const PDF_LABELS: Record<string, string> = {
  boq: 'BOQ',
  calculator: 'Calculator result',
  daily_visit: 'Site visit report',
  daily_progress: 'Progress report',
  daily_spec: 'System specification',
};

const label = (map: Record<string, string>, key: string) => map[key] ?? key.replace(/_/g, ' ');
const n = (v: number) => v.toLocaleString('en-IN');

export default function Analytics() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    supabase.rpc('admin_usage_analytics', { p_days: days }).then(({ data, error }) => {
      if (error) setError(error.message);
      else setData(data as Data);
    });
  }, [days]);

  return (
    <>
      <PageHeader
        title="Usage analytics"
        description="Who uses what, by user type. Only totals are shown. The app never sends content, names, numbers or location."
        actions={
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
            {RANGES.map((d) => (
              <button key={d} onClick={() => setDays(d)}
                className={cn('rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  d === days ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100')}>
                {d === 365 ? '1 year' : `${d} days`}
              </button>
            ))}
          </div>
        }
      />
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Couldn't load analytics: {error}</p>}
      {!data && !error && <Loading />}
      {data && <Body data={data} />}
    </>
  );
}

function Body({ data }: { data: Data }) {
  const seg = (s: Segment) => data.segments.find((r) => r.segment === s);
  const freeUsers = seg('free')?.users ?? 0;
  const events = (event: string) => data.events.filter((e) => e.event === event);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {SEGMENTS.map((s) => {
          const r = seg(s.key);
          return (
            <Tile key={s.key} swatch={s.color} label={`${s.label} users`} value={r?.users ?? 0}
              sub={`${n(r?.active_users ?? 0)} active · +${n(r?.new_users ?? 0)} new`} />
          );
        })}
      </div>

      <Panel title="Daily active users" description="People who opened the app each day (IST), by user type.">
        <DailyActive rows={data.daily_active} days={data.days} />
      </Panel>

      <Panel title="Features opened" description="Distinct people who opened each feature in this period.">
        <SegmentBars rows={events('feature_open')} labels={FEATURE_LABELS} metric="users" />
        <SegmentTable rows={events('feature_open')} labels={FEATURE_LABELS} first="Feature" />
      </Panel>

      <Panel title="Calculators" description="Opened vs finished (a complete result). Finish rate shows where people give up.">
        <CalculatorTable events={data.events} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Created in this period" description="Counted from the saved records themselves.">
          <ContentTable rows={data.content} />
        </Panel>
        <Panel title="BOQ coats" description="Picked from the company catalogue, or typed / filled from a saved calculation.">
          <CoatTable rows={data.boq_coats} />
        </Panel>
      </div>

      <Panel title="Saved calculations (free users)"
        description={`${n(data.saved_calcs.users_with_saves)} of ${n(freeUsers)} free users have at least one saved calculation.`}>
        <SavedCalcs rows={data.saved_calcs.by_type} picks={events('saved_calc_picked')} />
      </Panel>

      <Panel title="PDFs exported" description="Each time a PDF was generated.">
        <SegmentTable rows={events('pdf_export')} labels={PDF_LABELS} first="PDF" metric="count" />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="App versions" description="Distinct people per build in this period.">
          <PlatformTable rows={data.platforms} />
        </Panel>
        <Panel title="Who the users are" description="The Type picked at profile setup.">
          <UserTypeTable rows={data.user_types} />
        </Panel>
      </div>
    </div>
  );
}

function Tile({ label, value, sub, swatch }: { label: string; value: number; sub?: string; swatch: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
        <span className="h-2 w-2 rounded-full" style={{ background: swatch }} /> {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{n(value)}</div>
      {sub && <div className="mt-0.5 truncate text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

const axisProps = { tick: { fontSize: 12, fill: '#64748b' }, stroke: '#e2e8f0', tickLine: false } as const;

function DailyActive({ rows, days }: { rows: DayRow[]; days: number }) {
  const chart = useMemo(() => {
    // Every day in range, zero-filled, so gaps read as "nobody" not "missing".
    const out: Record<string, number | string>[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const row: Record<string, number | string> = { day: key };
      for (const s of SEGMENTS) row[s.key] = 0;
      out.push(row);
    }
    const byDay = new Map(out.map((r) => [r.day as string, r]));
    for (const r of rows) {
      const target = byDay.get(r.day);
      if (target) target[r.segment] = r.users;
    }
    return out;
  }, [rows, days]);

  if (rows.length === 0) return <Empty>No app opens recorded in this period yet.</Empty>;

  const short = (day: string) => new Date(day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  // Text summary under the chart, so the lighter colours never carry the
  // numbers alone.
  const avg = (s: Segment) => chart.reduce((a, r) => a + (r[s] as number), 0) / chart.length;
  const peak = (s: Segment) => Math.max(...chart.map((r) => r[s] as number));
  return (
    <>
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chart} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="day" tickFormatter={short} {...axisProps} minTickGap={24} />
          <YAxis allowDecimals={false} {...axisProps} axisLine={false} />
          <Tooltip labelFormatter={(d) => short(String(d))} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          {SEGMENTS.map((s) => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color}
              strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
      {SEGMENTS.map((s) => (
        <span key={s.key} className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
          <span className="font-medium text-slate-700">{s.label}</span>
          avg {avg(s.key).toFixed(1)}/day · peak {peak(s.key)}
        </span>
      ))}
    </div>
    </>
  );
}

/** Pivot event rows to one row per detail with a column per segment. */
function pivot(rows: EventRow[], metric: 'users' | 'count') {
  const map = new Map<string, Record<string, number | string>>();
  for (const r of rows) {
    const row = map.get(r.detail) ?? { detail: r.detail, free: 0, paid: 0, company: 0, admin: 0, total: 0 };
    row[r.segment] = (row[r.segment] as number) + r[metric];
    row.total = (row.total as number) + r[metric];
    map.set(r.detail, row);
  }
  return [...map.values()].sort((a, b) => (b.total as number) - (a.total as number));
}

function SegmentBars({ rows, labels, metric }: { rows: EventRow[]; labels: Record<string, string>; metric: 'users' | 'count' }) {
  const chart = pivot(rows, metric).map((r) => ({ ...r, name: label(labels, r.detail as string) }));
  if (chart.length === 0) return <Empty>Nothing recorded in this period yet.</Empty>;
  return (
    <div style={{ height: Math.max(160, chart.length * 34 + 40) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chart} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }} barCategoryGap={6}>
          <CartesianGrid stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" allowDecimals={false} {...axisProps} />
          <YAxis type="category" dataKey="name" width={150} {...axisProps} axisLine={false} />
          <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          {SEGMENTS.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} stackId="a" fill={s.color}
              stroke="#fff" strokeWidth={2} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={cn('px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-500', right && 'text-right')}>{children}</th>;
}
function Td({ children, right, strong }: { children: React.ReactNode; right?: boolean; strong?: boolean }) {
  return <td className={cn('px-3 py-2', right && 'text-right tabular-nums', strong && 'font-medium text-slate-900')}>{children}</td>;
}
function SegHead() {
  return (
    <>
      {SEGMENTS.map((s) => (
        <Th key={s.key} right>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.label}
          </span>
        </Th>
      ))}
    </>
  );
}
function Table({ children }: { children: React.ReactNode }) {
  return <div className="-mx-2 mt-4 overflow-x-auto"><table className="w-full min-w-[480px] text-left text-sm text-slate-600">{children}</table></div>;
}

function SegmentTable({ rows, labels, first, metric = 'users' }: {
  rows: EventRow[]; labels: Record<string, string>; first: string; metric?: 'users' | 'count';
}) {
  const table = pivot(rows, metric);
  if (table.length === 0) return metric === 'count' ? <Empty>Nothing recorded in this period yet.</Empty> : null;
  return (
    <Table>
      <thead className="border-b border-slate-200"><tr><Th>{first}</Th><SegHead /><Th right>Total</Th></tr></thead>
      <tbody className="divide-y divide-slate-100">
        {table.map((r) => (
          <tr key={r.detail as string}>
            <Td strong>{label(labels, r.detail as string)}</Td>
            {SEGMENTS.map((s) => <Td key={s.key} right>{n(r[s.key] as number)}</Td>)}
            <Td right strong>{n(r.total as number)}</Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function CalculatorTable({ events }: { events: EventRow[] }) {
  const rows = Object.keys(CALC_LABELS).map((calc) => {
    const pick = (event: string, free: boolean) => events
      .filter((e) => e.event === event && e.detail === calc && (e.segment === 'free') === free)
      .reduce((a, e) => a + e.count, 0);
    const opens = { free: pick('calc_open', true), other: pick('calc_open', false) };
    const done = { free: pick('calc_done', true), other: pick('calc_done', false) };
    return { calc, opens, done };
  });
  const rate = (d: number, o: number) => (o === 0 ? '—' : `${Math.min(100, Math.round((d / o) * 100))}%`);
  if (rows.every((r) => r.opens.free + r.opens.other + r.done.free + r.done.other === 0)) {
    return <Empty>No calculator use recorded in this period yet.</Empty>;
  }
  return (
    <Table>
      <thead className="border-b border-slate-200">
        <tr>
          <Th>Calculator</Th>
          <Th right>Free · opened</Th><Th right>Free · finished</Th><Th right>Free · rate</Th>
          <Th right>Others · opened</Th><Th right>Others · finished</Th><Th right>Others · rate</Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((r) => (
          <tr key={r.calc}>
            <Td strong>{CALC_LABELS[r.calc]}</Td>
            <Td right>{n(r.opens.free)}</Td><Td right>{n(r.done.free)}</Td><Td right>{rate(r.done.free, r.opens.free)}</Td>
            <Td right>{n(r.opens.other)}</Td><Td right>{n(r.done.other)}</Td><Td right>{rate(r.done.other, r.opens.other)}</Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function ContentTable({ rows }: { rows: ContentRow[] }) {
  const items = Object.keys(CONTENT_LABELS);
  const cell = (item: string, s: Segment) => rows.find((r) => r.item === item && r.segment === s);
  return (
    <Table>
      <thead className="border-b border-slate-200"><tr><Th>Item</Th><SegHead /><Th right>All time</Th></tr></thead>
      <tbody className="divide-y divide-slate-100">
        {items.map((item) => (
          <tr key={item}>
            <Td strong>{CONTENT_LABELS[item]}</Td>
            {SEGMENTS.map((s) => {
              const c = cell(item, s.key);
              return <Td key={s.key} right>{n(c?.in_window ?? 0)}{c && c.users_in_window > 0 && <span className="text-xs text-slate-400"> · {c.users_in_window}p</span>}</Td>;
            })}
            <Td right strong>{n(rows.filter((r) => r.item === item).reduce((a, r) => a + r.total, 0))}</Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function CoatTable({ rows }: { rows: CoatRow[] }) {
  if (rows.length === 0) return <Empty>No BOQ coats saved in this period yet.</Empty>;
  return (
    <Table>
      <thead className="border-b border-slate-200"><tr><Th>User type</Th><Th right>From catalogue</Th><Th right>Typed / saved calc</Th></tr></thead>
      <tbody className="divide-y divide-slate-100">
        {SEGMENTS.map((s) => {
          const r = rows.find((x) => x.segment === s.key);
          if (!r) return null;
          return (
            <tr key={s.key}>
              <Td strong><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.label}</span></Td>
              <Td right>{n(r.catalogue)}</Td><Td right>{n(r.typed)}</Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

function SavedCalcs({ rows, picks }: { rows: SavedTypeRow[]; picks: EventRow[] }) {
  const pickRows = pivot(picks, 'count');
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {rows.length === 0 ? <Empty>No saved calculations yet.</Empty> : (
        <Table>
          <thead className="border-b border-slate-200">
            <tr><Th>Type</Th><Th right>Live</Th><Th right>Starred</Th><Th right>New</Th><Th right>Reused</Th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.calc_type}>
                <Td strong>{label(CALC_LABELS, r.calc_type)}</Td>
                <Td right>{n(r.live)}</Td><Td right>{n(r.starred)}</Td>
                <Td right>{n(r.created_in_window)}</Td><Td right>{n(r.reused_in_window)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {pickRows.length === 0 ? <Empty>No saved calculation picked in this period yet.</Empty> : (
        <Table>
          <thead className="border-b border-slate-200"><tr><Th>Picked in</Th><Th right>Times</Th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {pickRows.map((r) => (
              <tr key={r.detail as string}>
                <Td strong>{r.detail === 'boq' ? 'BOQ coat' : label(CALC_LABELS, r.detail as string)}</Td>
                <Td right>{n(r.total as number)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

function PlatformTable({ rows }: { rows: PlatformRow[] }) {
  if (rows.length === 0) return <Empty>No app opens recorded in this period yet.</Empty>;
  return (
    <Table>
      <thead className="border-b border-slate-200"><tr><Th>Platform</Th><Th>Version</Th><Th right>People</Th></tr></thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((r) => (
          <tr key={`${r.platform}-${r.app_version}`}>
            <Td strong>{r.platform === 'ios' ? 'iOS' : r.platform === 'android' ? 'Android' : r.platform}</Td>
            <Td>{r.app_version}</Td><Td right>{n(r.users)}</Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function UserTypeTable({ rows }: { rows: UserTypeRow[] }) {
  const types = [...new Set(rows.map((r) => r.user_type))].sort();
  if (types.length === 0) return <Empty>No users yet.</Empty>;
  const cell = (t: string, s: Segment) => rows.find((r) => r.user_type === t && r.segment === s)?.users ?? 0;
  return (
    <Table>
      <thead className="border-b border-slate-200"><tr><Th>Type</Th><SegHead /></tr></thead>
      <tbody className="divide-y divide-slate-100">
        {types.map((t) => (
          <tr key={t}>
            <Td strong>{t}</Td>
            {SEGMENTS.map((s) => <Td key={s.key} right>{n(cell(t, s.key))}</Td>)}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
