import { useCallback, useEffect, useState } from 'react';
import { Bell, Megaphone, Repeat, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { attempt, Confirm, Empty, fmtDate, Loading, PageHeader, Panel, Pill } from '../shared';

type Notification = {
  id: string; title: string; message: string; icon: string; type: string;
  link_url: string | null; is_active: boolean; created_at: string;
};

// Must match NotificationIcons.resolve in the app (lib/Frontend/components/notification.dart).
const ICONS = [
  ['notifications', 'Bell'], ['campaign', 'Megaphone'], ['update', 'Update'], ['article', 'Article'],
  ['star', 'Star'], ['info', 'Info'], ['notification_important', 'Important'],
] as const;
const TYPES = ['general', 'update', 'news', 'promo', 'blog_post'];
const NEWS_LINK = 'icopedia://news';
const TITLE_MAX = 65;
const BODY_MAX = 240;

type Tap = 'none' | 'news' | 'url';

export default function Notifications() {
  const [list, setList] = useState<Notification[] | null>(null);
  const [devices, setDevices] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [icon, setIcon] = useState('notifications');
  const [type, setType] = useState('general');
  const [tap, setTap] = useState<Tap>('none');
  const [url, setUrl] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(200);
    setList((data as Notification[]) ?? []);
  }, []);

  useEffect(() => {
    load();
    supabase.rpc('admin_dashboard_stats').then(({ data }) => {
      if (data) setDevices(Object.values((data.devices_by_platform ?? {}) as Record<string, number>).reduce((a, b) => a + b, 0));
    });
  }, [load]);

  const link = tap === 'news' ? NEWS_LINK : tap === 'url' ? url.trim() : null;
  const urlValid = tap !== 'url' || /^https?:\/\/\S+\.\S+/.test(url.trim());
  const canSend = title.trim() && message.trim() && urlValid;

  async function send(payload: Omit<Notification, 'id' | 'created_at' | 'is_active'>) {
    // The insert itself is the send: notifications_push_trigger forwards new
    // active rows to the send-push Edge Function (FCM topic "all").
    const ok = await attempt(() => supabase.from('notifications').insert({ ...payload, is_active: true }), 'Sent to all devices');
    if (ok) load();
    return ok;
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Sends a push notification to every phone with the app installed, and adds it to the in-app Notifications list."
      />

      <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <Panel title="New notification">
          <div className="space-y-4">
            <Field label="Title" count={`${title.length}/${TITLE_MAX}`}>
              <Input value={title} maxLength={TITLE_MAX} placeholder="e.g. New: Daily Reports are here" onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Message" count={`${message.length}/${BODY_MAX}`}>
              <Textarea rows={3} value={message} maxLength={BODY_MAX} placeholder="One or two short sentences." onChange={(e) => setMessage(e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Icon in app">
                <Select value={icon} onValueChange={setIcon}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ICONS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Category">
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="When tapped">
                <Select value={tap} onValueChange={(v) => setTap(v as Tap)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Just open the app</SelectItem>
                    <SelectItem value="news">Open News screen</SelectItem>
                    <SelectItem value="url">Open a web link</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            {tap === 'url' && (
              <Field label="Web link">
                <Input value={url} placeholder="https://…" onChange={(e) => setUrl(e.target.value)} />
                {!urlValid && url && <p className="mt-1 text-xs text-red-600">Must start with https://</p>}
              </Field>
            )}
            <div className="flex justify-end">
              <Confirm
                trigger={
                  <Button disabled={!canSend} className="bg-slate-900 text-white hover:bg-slate-800">
                    <Send className="mr-2 h-4 w-4" /> Send to everyone
                  </Button>
                }
                title="Send this push now?"
                description={
                  <div className="space-y-2">
                    <p>It goes out immediately to {devices === null ? 'all' : <b>{devices}</b>} registered device{devices === 1 ? '' : 's'} and can't be recalled.
                      You can hide it from the in-app list afterwards.</p>
                    <p className="rounded-md bg-slate-50 p-2 text-slate-900"><b>{title}</b><br />{message}</p>
                  </div>
                }
                confirmLabel="Send now"
                onConfirm={async () => {
                  const ok = await send({ title: title.trim(), message: message.trim(), icon, type, link_url: link });
                  if (ok) { setTitle(''); setMessage(''); setUrl(''); setTap('none'); }
                }}
              />
            </div>
          </div>
        </Panel>

        <Panel title="Preview">
          <div className="rounded-2xl bg-slate-800 p-3">
            <div className="rounded-xl bg-white/95 p-3 shadow">
              <div className="mb-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                <img src="/icopedia-logo.png" alt="" className="h-3.5 w-3.5 rounded-sm" /> iCOPEDIA · now
              </div>
              <div className="text-sm font-semibold text-slate-900">{title || 'Notification title'}</div>
              <div className="line-clamp-3 text-sm text-slate-600">{message || 'Your message shows here.'}</div>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Android cuts long text in the collapsed view. Put the important part first.
          </p>
        </Panel>
      </div>

      <Panel title="Sent" description="Turning a notification off hides it from the in-app list. The push itself was already delivered.">
        {!list ? <Loading /> : list.length === 0 ? <Empty>Nothing sent yet.</Empty> : (
          <div className="divide-y divide-slate-100">
            {list.map((n) => (
              <div key={n.id} className={`flex flex-col gap-3 py-3 sm:flex-row sm:items-start ${n.is_active ? '' : 'opacity-60'}`}>
                <div className="mt-0.5 hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 sm:flex">
                  {n.icon === 'campaign' ? <Megaphone className="h-4 w-4 text-slate-500" /> : <Bell className="h-4 w-4 text-slate-500" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-900">{n.title}</span>
                    <Pill>{n.type.replace('_', ' ')}</Pill>
                    {!n.is_active && <Pill tone="amber">hidden in app</Pill>}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600">{n.message}</p>
                  <p className="mt-1 truncate text-xs text-slate-400">
                    {fmtDate(n.created_at)}{n.link_url && <> · opens {n.link_url === NEWS_LINK ? 'News screen' : n.link_url}</>}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Switch checked={n.is_active} aria-label="Show in app"
                    onCheckedChange={async (v) => {
                      if (await attempt(() => supabase.from('notifications').update({ is_active: v }).eq('id', n.id))) load();
                    }} />
                  <Confirm
                    trigger={<Button variant="ghost" size="icon" aria-label="Send again"><Repeat className="h-4 w-4 text-slate-400" /></Button>}
                    title="Send this again?"
                    description="A new push goes out to every device, and a new copy is added to the in-app list."
                    confirmLabel="Send again"
                    onConfirm={() => send({ title: n.title, message: n.message, icon: n.icon, type: n.type, link_url: n.link_url })}
                  />
                  <Confirm
                    trigger={<Button variant="ghost" size="icon" aria-label="Delete"><Trash2 className="h-4 w-4 text-slate-400" /></Button>}
                    title="Delete this notification?"
                    description="Removes it from the in-app list for everyone. A copy stays in Change history."
                    confirmLabel="Delete" destructive
                    onConfirm={async () => {
                      if (await attempt(() => supabase.from('notifications').delete().eq('id', n.id), 'Deleted')) load();
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}

function Field({ label, count, children }: { label: string; count?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {count && <span className="text-xs tabular-nums text-slate-400">{count}</span>}
      </div>
      {children}
    </div>
  );
}
