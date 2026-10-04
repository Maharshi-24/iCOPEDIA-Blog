import { useCallback, useEffect, useState } from 'react';
import { EyeOff, ExternalLink, Eye, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { attempt, Empty, fmtDate, Loading, PageHeader, Panel, Pill } from '../shared';

type Article = {
  id: string; title: string; summary: string | null; source_name: string | null; source_url: string | null;
  image_url: string | null; tags: string[] | null; status: string; reject_reason: string | null;
  is_featured: boolean; published_at: string | null; created_at: string; body: string | null;
};

const TABS = [
  { key: 'published', label: 'Live in app' },
  { key: 'hidden', label: 'Hidden' },
  { key: 'rejected', label: 'Rejected by AI' },
] as const;

export default function News() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('published');
  const [rows, setRows] = useState<Article[] | null>(null);

  const load = useCallback(async () => {
    setRows(null);
    const { data } = await supabase.from('news_articles')
      .select('id, title, summary, source_name, source_url, image_url, tags, status, reject_reason, is_featured, published_at, created_at, body')
      .eq('status', tab).order('created_at', { ascending: false }).limit(200);
    setRows((data as Article[]) ?? []);
  }, [tab]);
  useEffect(() => { load(); }, [load]);

  async function patch(a: Article, values: Partial<Article>, msg: string) {
    if (await attempt(() => supabase.from('news_articles').update(values).eq('id', a.id), msg)) load();
  }

  return (
    <>
      <PageHeader
        title="News"
        description="Articles written by the fetch-news job (runs at 09:00, 14:00 and 19:00 IST). Hide anything that shouldn't be in the app."
      />
      <div className="mb-4 flex gap-1 rounded-lg border border-slate-200 bg-white p-1 sm:w-fit">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium sm:flex-none ${tab === t.key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <Panel>
        {!rows ? <Loading /> : rows.length === 0 ? <Empty>Nothing here.</Empty> : (
          <div className="divide-y divide-slate-100">
            {rows.map((a) => (
              <div key={a.id} className="flex gap-4 py-3">
                {a.image_url
                  ? <img src={a.image_url} alt="" className="hidden h-16 w-24 shrink-0 rounded-md object-cover sm:block" loading="lazy" />
                  : <div className="hidden h-16 w-24 shrink-0 rounded-md bg-slate-100 sm:block" />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium text-slate-900">{a.title}</span>
                    {a.is_featured && <Pill tone="amber">featured</Pill>}
                    {a.tags?.slice(0, 2).map((t) => <Pill key={t}>{t}</Pill>)}
                  </div>
                  {a.status === 'rejected'
                    ? <p className="mt-0.5 text-sm text-slate-500">Rejected: {a.reject_reason || 'no reason recorded'}</p>
                    : a.summary && <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">{a.summary}</p>}
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-400">
                    {fmtDate(a.published_at ?? a.created_at)}
                    {a.source_url && (
                      <a href={a.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 hover:text-slate-700">
                        · {a.source_name || 'source'} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-start">
                  {a.status === 'published' && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => patch(a, { is_featured: !a.is_featured }, a.is_featured ? 'Unfeatured' : 'Featured')}>
                        <Star className={`mr-1 h-4 w-4 ${a.is_featured ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} /> Feature
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => patch(a, { status: 'hidden', is_featured: false }, 'Hidden from the app')}>
                        <EyeOff className="mr-1 h-4 w-4 text-slate-400" /> Hide
                      </Button>
                    </>
                  )}
                  {a.status !== 'published' && a.body && (
                    <Button variant="ghost" size="sm" onClick={() => patch(a, { status: 'published', published_at: a.published_at ?? new Date().toISOString() }, 'Now live in the app')}>
                      <Eye className="mr-1 h-4 w-4 text-slate-400" /> Publish
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
