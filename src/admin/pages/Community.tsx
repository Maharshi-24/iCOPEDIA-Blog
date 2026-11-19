import { useCallback, useEffect, useState } from 'react';
import { Ban, Check, EyeOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { attempt, Confirm, Empty, Loading, PageHeader, Panel, Pill, timeAgo } from '../shared';

// Shapes returned by the community_* RPCs
// (backend migration 20261114180000_community_threads.sql).
type Report = {
  kind: 'thread' | 'reply';
  id: string;
  thread_id: string;
  report_count: number;
  reasons: string[];
  notes: string[] | null;
  last_reported_at: string;
  title: string | null;
  body: string | null;
  hidden: boolean;
  author_id: string;
  author_name: string | null;
};

type Thread = {
  id: string;
  topic: string;
  title: string;
  body: string;
  media: string[];
  reply_count: number;
  created_at: string;
  author: { id: string; name: string; headline: string | null };
};

const REASONS: Record<string, string> = {
  spam: 'Spam',
  abuse: 'Abusive',
  off_topic: 'Off-topic',
  misleading: 'Wrong / unsafe advice',
  other: 'Other',
};

const TABS = [
  { key: 'reports', label: 'Open reports' },
  { key: 'threads', label: 'Latest threads' },
] as const;

export default function Community() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('reports');
  return (
    <>
      <PageHeader
        title="Community"
        description="Act on reports within 24 hours (App Store and Play rules). Anything reported by 3 people is hidden automatically until you decide."
      />
      <div className="mb-4 flex gap-1 rounded-lg border border-slate-200 bg-white p-1 sm:w-fit">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium sm:flex-none ${tab === t.key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'reports' ? <Reports /> : <Threads />}
    </>
  );
}

function moderate(kind: string, id: string, action: 'hide' | 'unhide' | 'delete', msg: string) {
  return attempt(() => supabase.rpc('community_moderate', { p_kind: kind, p_id: id, p_action: action }), msg);
}

function ban(userId: string, name: string | null) {
  return attempt(
    () => supabase.rpc('community_set_ban', { p_user: userId, p_banned: true, p_reason: 'Community guidelines' }),
    `${name || 'User'} can no longer post`,
  );
}

function Reports() {
  const [rows, setRows] = useState<Report[] | null>(null);

  const load = useCallback(async () => {
    setRows(null);
    const { data } = await supabase.rpc('community_open_reports', { p_limit: 200 });
    setRows((data as Report[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <Panel>
      {!rows ? <Loading /> : rows.length === 0 ? <Empty>No open reports.</Empty> : (
        <div className="divide-y divide-slate-100">
          {rows.map((r) => (
            <div key={`${r.kind}-${r.id}`} className="flex flex-col gap-3 py-4 sm:flex-row">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Pill tone={r.kind === 'thread' ? 'blue' : 'slate'}>{r.kind === 'thread' ? 'Thread' : 'Reply'}</Pill>
                  <Pill tone="red">{r.report_count} report{r.report_count === 1 ? '' : 's'}</Pill>
                  {r.hidden && <Pill tone="amber">hidden</Pill>}
                  {r.reasons.map((x) => <Pill key={x}>{REASONS[x] ?? x}</Pill>)}
                </div>
                {r.title && <div className="mt-2 font-medium text-slate-900">{r.title}</div>}
                {r.body && <p className="mt-1 line-clamp-4 whitespace-pre-line text-sm text-slate-600">{r.body}</p>}
                {r.notes && r.notes.length > 0 && (
                  <ul className="mt-2 space-y-0.5 text-xs text-slate-500">
                    {r.notes.map((n, i) => <li key={i}>“{n}”</li>)}
                  </ul>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  by {r.author_name || 'unknown'} · last reported {timeAgo(r.last_reported_at)}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-start gap-1">
                <Button variant="ghost" size="sm"
                  onClick={async () => { if (await moderate(r.kind, r.id, 'unhide', 'Reports dismissed')) load(); }}>
                  <Check className="mr-1 h-4 w-4 text-slate-400" /> Keep
                </Button>
                {!r.hidden && (
                  <Button variant="ghost" size="sm"
                    onClick={async () => { if (await moderate(r.kind, r.id, 'hide', 'Hidden from the app')) load(); }}>
                    <EyeOff className="mr-1 h-4 w-4 text-slate-400" /> Hide
                  </Button>
                )}
                <Confirm
                  trigger={<Button variant="ghost" size="sm"><Trash2 className="mr-1 h-4 w-4 text-red-500" /> Delete</Button>}
                  title={r.kind === 'thread' ? 'Delete this thread?' : 'Delete this reply?'}
                  description={r.kind === 'thread' ? 'The thread and its whole discussion are deleted for everyone.' : 'The reply is deleted for everyone.'}
                  confirmLabel="Delete" destructive
                  onConfirm={async () => { if (await moderate(r.kind, r.id, 'delete', 'Deleted')) load(); }}
                />
                <Confirm
                  trigger={<Button variant="ghost" size="sm"><Ban className="mr-1 h-4 w-4 text-red-500" /> Ban author</Button>}
                  title={`Stop ${r.author_name || 'this user'} posting?`}
                  description="They can still read the Community, but can't start threads, reply or react. Their existing posts stay unless you delete them."
                  confirmLabel="Ban" destructive
                  onConfirm={async () => { await ban(r.author_id, r.author_name); }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function Threads() {
  const [rows, setRows] = useState<Thread[] | null>(null);

  const load = useCallback(async () => {
    setRows(null);
    const { data } = await supabase.rpc('community_feed', { p_sort: 'latest', p_limit: 50 });
    setRows((data as Thread[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <Panel description="The 50 newest visible threads.">
      {!rows ? <Loading /> : rows.length === 0 ? <Empty>No threads yet.</Empty> : (
        <div className="divide-y divide-slate-100">
          {rows.map((t) => (
            <div key={t.id} className="flex flex-col gap-3 py-3 sm:flex-row">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium text-slate-900">{t.title}</span>
                  <Pill>{t.topic.replace('_', ' ')}</Pill>
                  {t.media.length > 0 && <Pill tone="blue">{t.media.length} photo{t.media.length === 1 ? '' : 's'}</Pill>}
                </div>
                {t.body && <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">{t.body}</p>}
                <p className="mt-1 text-xs text-slate-400">
                  {t.author.name}{t.author.headline ? ` · ${t.author.headline}` : ''} · {timeAgo(t.created_at)} · {t.reply_count} repl{t.reply_count === 1 ? 'y' : 'ies'}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-start gap-1">
                <Button variant="ghost" size="sm"
                  onClick={async () => { if (await moderate('thread', t.id, 'hide', 'Hidden from the app')) load(); }}>
                  <EyeOff className="mr-1 h-4 w-4 text-slate-400" /> Hide
                </Button>
                <Confirm
                  trigger={<Button variant="ghost" size="sm"><Trash2 className="mr-1 h-4 w-4 text-red-500" /> Delete</Button>}
                  title="Delete this thread?"
                  description="The thread and its whole discussion are deleted for everyone."
                  confirmLabel="Delete" destructive
                  onConfirm={async () => { if (await moderate('thread', t.id, 'delete', 'Deleted')) load(); }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
