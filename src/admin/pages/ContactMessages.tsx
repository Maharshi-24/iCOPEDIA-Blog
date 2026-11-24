import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Empty, fmtDate, Loading, PageHeader, Panel, Spinner } from '../shared';
import { STATUSES, statusLabel, StatusPill, SUBMISSION_COLUMNS, type Submission } from './contactShared';

const FILTERS = [{ key: 'all', label: 'All' }, ...STATUSES] as const;
type Filter = (typeof FILTERS)[number]['key'];

export default function ContactMessages() {
  const [filter, setFilter] = useState<Filter>('all');
  const [rows, setRows] = useState<Submission[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [pdfBusy, setPdfBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('contact_submissions')
      .select(SUBMISSION_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(2000);
    setError(error ? error.message : null);
    setRows((data as Submission[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(
    () => (rows ?? []).filter((r) => filter === 'all' || r.status === filter),
    [rows, filter],
  );
  const count = (f: Filter) => (rows ?? []).filter((r) => f === 'all' || r.status === f).length;
  const filterLabel = FILTERS.find((f) => f.key === filter)!.label;

  return (
    <>
      <PageHeader
        title="Contact messages"
        description="Everything sent through the Contact us form on icopedia.co, newest first. Open one to set its status and add notes."
        actions={
          <>
            <Button variant="outline" disabled={!shown.length} onClick={() => downloadCsv(shown, filter)}>
              <Download className="mr-1.5 h-4 w-4" /> Download CSV
            </Button>
            <Button variant="outline" disabled={!shown.length || pdfBusy}
              onClick={async () => {
                setPdfBusy(true);
                try { await downloadPdf(shown, filter, filterLabel); } finally { setPdfBusy(false); }
              }}>
              {pdfBusy ? <Spinner className="mr-1.5" /> : <FileText className="mr-1.5 h-4 w-4" />} Download PDF
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              filter === f.key ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400',
            )}>
            {f.label}
            {rows && <span className={cn('ml-1.5 tabular-nums', filter === f.key ? 'text-white/70' : 'text-slate-400')}>{count(f.key)}</span>}
          </button>
        ))}
      </div>

      {error ? <Panel><Empty>Could not load the messages: {error}</Empty></Panel>
        : !rows ? <Panel><Loading /></Panel>
        : shown.length === 0 ? <Panel><Empty>{filter === 'all' ? 'No messages yet.' : `No ${statusLabel(filter).toLowerCase()} messages.`}</Empty></Panel> : (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Desktop: table */}
            <table className="hidden w-full table-fixed text-left text-sm md:table">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="w-[17%] px-5 py-3 font-medium">Received</th>
                  <th className="w-[20%] px-5 py-3 font-medium">Name</th>
                  <th className="w-[16%] px-5 py-3 font-medium">You are</th>
                  <th className="px-5 py-3 font-medium">Message</th>
                  <th className="w-[10%] px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shown.map((s) => (
                  <tr key={s.id} onClick={() => navigate(`/admin/contact/${s.id}`)}
                    className={cn('cursor-pointer align-top hover:bg-slate-50', s.status === 'new' && 'bg-amber-50/40')}>
                    <td className="px-5 py-4 text-slate-500">{fmtDate(s.created_at)}</td>
                    <td className="px-5 py-4">
                      <div className="truncate font-medium text-slate-900">{s.name}</div>
                      <div className="truncate text-slate-500">{s.company || s.email}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-700">{s.role || '—'}</td>
                    <td className="px-5 py-4 text-slate-700"><p className="line-clamp-2 break-words">{s.message}</p></td>
                    <td className="px-5 py-4"><StatusPill status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Phone: cards */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {shown.map((s) => (
                <li key={s.id}>
                  <button onClick={() => navigate(`/admin/contact/${s.id}`)} className="block w-full px-4 py-4 text-left hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-900">{s.name}</div>
                        <div className="truncate text-sm text-slate-500">{[s.role, s.company].filter(Boolean).join(' · ') || s.email}</div>
                      </div>
                      <StatusPill status={s.status} />
                    </div>
                    <p className="mt-2 line-clamp-2 break-words text-sm text-slate-700">{s.message}</p>
                    <p className="mt-1.5 text-xs text-slate-400">{fmtDate(s.created_at)}</p>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

    </>
  );
}

// ---------------------------------------------------------------- export

const COLUMNS = ['Received', 'Name', 'Email', 'You are', 'Company', 'Message', 'Status', 'Notes'];

function exportRows(rows: Submission[]) {
  return rows.map((r) => [
    fmtDate(r.created_at),
    r.name,
    r.email,
    r.role ?? '',
    r.company ?? '',
    r.message,
    statusLabel(r.status),
    r.notes ?? '',
  ]);
}

function fileName(filter: Filter, ext: string) {
  const day = new Date().toISOString().slice(0, 10);
  return `icopedia-contact-messages${filter === 'all' ? '' : `-${filter}`}-${day}.${ext}`;
}

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadCsv(rows: Submission[], filter: Filter) {
  const cell = (v: string) => {
    // Stop Excel from running cell text that starts like a formula.
    const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const csv = [COLUMNS, ...exportRows(rows)].map((r) => r.map(cell).join(',')).join('\r\n');
  // The BOM makes Excel read it as UTF-8.
  save(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }), fileName(filter, 'csv'));
}

async function downloadPdf(rows: Submission[], filter: Filter, filterLabel: string) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  doc.setFontSize(16);
  doc.text('iCOPEDIA contact messages', 40, 44);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`${filterLabel} · ${rows.length} message${rows.length === 1 ? '' : 's'} · exported ${fmtDate(new Date().toISOString())}`, 40, 60);
  autoTable(doc, {
    startY: 74,
    head: [COLUMNS],
    body: exportRows(rows),
    styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak', valign: 'top' },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 66 }, 1: { cellWidth: 70 }, 2: { cellWidth: 100 }, 3: { cellWidth: 66 },
      4: { cellWidth: 66 }, 5: { cellWidth: 'auto' }, 6: { cellWidth: 50 }, 7: { cellWidth: 120 },
    },
    margin: { left: 40, right: 40 },
  });
  save(doc.output('blob'), fileName(filter, 'pdf'));
}
