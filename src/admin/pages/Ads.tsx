import { PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase, SUPABASE_URL } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { attempt, Confirm, Empty, friendlyError, Loading, PageHeader, Panel, Pill, Spinner } from '../shared';

// Home screen ads for free users. Tables ad_settings, ad_slots, ads and the
// storage bucket "ads" (backend migration 20261120120000_home_ads). The app
// reads them through home_ads(), which returns nothing for paid, company and
// admin accounts.
//
// The ad area is the space left under the Home tiles, so its height changes
// from phone to phone. It is a grid of cols x rows cells stretched over that
// space; a slot covers a block of cells and holds one or more ads.

type AdType = 'direct' | 'sponsor' | 'google';
type MediaType = 'image' | 'gif' | 'video';
type ActionKind = 'none' | 'website' | 'whatsapp' | 'call';

type Settings = {
  direct_enabled: boolean; sponsor_enabled: boolean; google_enabled: boolean;
  cols: number; rows: number; min_height: number;
};
type Rect = { x: number; y: number; w: number; h: number };
type Slot = Rect & { id: string; scrollable: boolean; active: boolean };
type Ad = {
  id: string; slot_id: string; type: AdType; title: string;
  media_url: string | null; media_type: MediaType; fit: 'cover' | 'contain'; background: string;
  sponsor_name: string | null; action_kind: ActionKind; action_value: string | null; cta_label: string | null;
  duration_seconds: number; sort: number; active: boolean;
  starts_at: string | null; ends_at: string | null; impressions: number; clicks: number;
};

const BUCKET = 'ads';
const PUBLIC_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;
const MAX_MB = 50; // bucket limit

const TYPE_LABEL: Record<AdType, string> = { direct: 'Our ad', sponsor: 'Sponsor', google: 'Google' };
const TYPE_TONE: Record<AdType, 'blue' | 'amber' | 'slate'> = { direct: 'blue', sponsor: 'amber', google: 'slate' };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const fits = (r: Rect, s: Settings) => r.x >= 0 && r.y >= 0 && r.w >= 1 && r.h >= 1 && r.x + r.w <= s.cols && r.y + r.h <= s.rows;
const sameRect = (a: Rect, b: Rect) => a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
const spanRect = (a: { x: number; y: number }, b: { x: number; y: number }): Rect => ({
  x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x) + 1, h: Math.abs(a.y - b.y) + 1,
});

function shapeName(r: Rect, s: Settings) {
  if (r.w === s.cols && r.h === s.rows) return 'full box';
  if (r.w === s.cols && r.h === 1) return r.y === s.rows - 1 ? 'bottom bar' : 'bar';
  return `${r.w} × ${r.h} cells`;
}

function adStatus(ad: Ad): { label: string; tone: 'green' | 'amber' | 'slate' | 'red' } {
  const now = Date.now();
  if (!ad.active) return { label: 'off', tone: 'slate' };
  if (ad.starts_at && new Date(ad.starts_at).getTime() > now) return { label: 'scheduled', tone: 'amber' };
  if (ad.ends_at && new Date(ad.ends_at).getTime() <= now) return { label: 'ended', tone: 'red' };
  return { label: 'live', tone: 'green' };
}

async function removeStored(url?: string | null) {
  if (url && url.startsWith(PUBLIC_PREFIX)) {
    await supabase.storage.from(BUCKET).remove([url.slice(PUBLIC_PREFIX.length)]);
  }
}

export default function Ads() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [s, sl, a] = await Promise.all([
      supabase.from('ad_settings').select('direct_enabled, sponsor_enabled, google_enabled, cols, rows, min_height').maybeSingle(),
      supabase.from('ad_slots').select('id, x, y, w, h, scrollable, active').order('y').order('x'),
      supabase.from('ads').select('*').order('sort').order('created_at'),
    ]);
    const err = s.error ?? sl.error ?? a.error;
    if (err) {
      setError(/does not exist|schema cache/i.test(err.message)
        ? 'The ads tables are not on the server yet. Run backend migration 20261120120000_home_ads.sql in the Supabase SQL editor.'
        : friendlyError(err.message));
      return;
    }
    if (!s.data) {
      setError('The ad_settings row is missing. Run backend migration 20261120120000_home_ads.sql again.');
      return;
    }
    setError(null);
    setSettings(s.data as Settings);
    setSlots((sl.data ?? []) as Slot[]);
    setAds((a.data ?? []) as Ad[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  const selectedSlot = slots.find((s) => s.id === selected) ?? null;

  return (
    <>
      <PageHeader
        title="Ads"
        description="Shown only to free users, in the empty space under the Home tiles. That space is a different height on every phone, so you lay ads out on a grid that stretches to fit it exactly: Home never scrolls and the bottom bar and tiles always stay in view. Changes reach the app the next time Home loads; no app update needed."
      />
      {error ? <Panel><Empty>{error}</Empty></Panel> : !settings ? <Panel><Loading /></Panel> : (
        <div className="space-y-4">
          <TypesPanel settings={settings} onSaved={load} />
          <div className="grid gap-4 xl:grid-cols-[auto_1fr]">
            <Panel title="Layout" description="Drag across empty cells to add a slot. Drag a slot to move it, or its corner to resize it.">
              <LayoutEditor settings={settings} slots={slots} ads={ads} selected={selected} onSelect={setSelected} onChanged={load} />
              <GridSettings settings={settings} slots={slots} onSaved={load} />
            </Panel>
            {selectedSlot ? (
              <SlotPanel
                key={selectedSlot.id}
                slot={selectedSlot}
                settings={settings}
                slots={slots}
                ads={ads.filter((a) => a.slot_id === selectedSlot.id)}
                onChanged={load}
                onDeleted={() => { setSelected(null); load(); }}
              />
            ) : (
              <Panel title="Slot">
                <Empty>{slots.length ? 'Click a slot on the left to set its ads.' : 'No slots yet. Drag across the grid, or use Bottom bar / Full box.'}</Empty>
              </Panel>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ------------------------------------------------------------------ types

function TypesPanel({ settings, onSaved }: { settings: Settings; onSaved: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  async function toggle(key: 'direct_enabled' | 'sponsor_enabled' | 'google_enabled', on: boolean) {
    setBusy(key);
    const ok = await attempt(() => supabase.from('ad_settings').update({ [key]: on }).eq('id', true), on ? 'Turned on' : 'Turned off');
    setBusy(null);
    if (ok) onSaved();
  }
  const rows: { key: 'direct_enabled' | 'sponsor_enabled' | 'google_enabled'; title: string; text: string }[] = [
    { key: 'direct_enabled', title: 'Our ads', text: 'Ads we post ourselves: image, GIF or video. Tapping opens a link.' },
    { key: 'sponsor_enabled', title: 'Sponsor ads', text: 'Paid partner ads, marked "Sponsored · name", with a contact button (website, WhatsApp or call).' },
    { key: 'google_enabled', title: 'Google ads (AdMob)', text: 'Not in the app yet: needs an app update with your AdMob account. Turning this on does nothing until then.' },
  ];
  return (
    <Panel title="Ad types" description="Switch a whole type off to hide all of its ads at once.">
      <div className="grid gap-3 md:grid-cols-3">
        {rows.map((r) => (
          <label key={r.key} htmlFor={r.key} className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-slate-200 p-4">
            <div>
              <div className="text-sm font-medium text-slate-900">{r.title}</div>
              <div className="mt-0.5 text-xs text-slate-500">{r.text}</div>
            </div>
            <div className="flex items-center gap-2">
              {busy === r.key && <Spinner />}
              <Switch id={r.key} checked={settings[r.key]} disabled={busy !== null} onCheckedChange={(v) => toggle(r.key, v)} />
            </div>
          </label>
        ))}
      </div>
    </Panel>
  );
}

// ----------------------------------------------------------------- editor

type Drag = { mode: 'draw' | 'move' | 'resize'; id?: string; start: { x: number; y: number }; orig: Rect; rect: Rect };

const PREVIEWS = [
  { key: 'min', label: 'Little space' },
  { key: 'typical', label: 'Typical phone', height: 250 },
  { key: 'tall', label: 'Tall phone', height: 390 },
] as const;
const PHONE_BODY = 560; // preview px under the app header

function LayoutEditor({ settings, slots, ads, selected, onSelect, onChanged }: {
  settings: Settings; slots: Slot[]; ads: Ad[]; selected: string | null;
  onSelect: (id: string | null) => void; onChanged: () => void;
}) {
  const { cols, rows } = settings;
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [preview, setPreview] = useState<(typeof PREVIEWS)[number]['key']>('typical');
  const [busy, setBusy] = useState(false);

  const p = PREVIEWS.find((x) => x.key === preview)!;
  const areaHeight = Math.min(PHONE_BODY - 60, Math.max(settings.min_height + 16, 'height' in p ? p.height : 0));

  function cellAt(e: ReactPointerEvent) {
    const r = ref.current!.getBoundingClientRect();
    return {
      x: clamp(Math.floor(((e.clientX - r.left) / r.width) * cols), 0, cols - 1),
      y: clamp(Math.floor(((e.clientY - r.top) / r.height) * rows), 0, rows - 1),
    };
  }

  function begin(e: ReactPointerEvent, mode: Drag['mode'], slot?: Slot) {
    if (busy || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    ref.current?.setPointerCapture(e.pointerId);
    const c = cellAt(e);
    const orig: Rect = slot ? { x: slot.x, y: slot.y, w: slot.w, h: slot.h } : { ...c, w: 1, h: 1 };
    onSelect(slot ? slot.id : null);
    setDrag({ mode, id: slot?.id, start: c, orig, rect: orig });
  }

  function move(e: ReactPointerEvent) {
    if (!drag) return;
    const c = cellAt(e);
    const o = drag.orig;
    let rect: Rect;
    if (drag.mode === 'draw') rect = spanRect(drag.start, c);
    else if (drag.mode === 'move') {
      rect = { ...o, x: clamp(o.x + c.x - drag.start.x, 0, cols - o.w), y: clamp(o.y + c.y - drag.start.y, 0, rows - o.h) };
    } else rect = { ...o, w: Math.max(1, c.x - o.x + 1), h: Math.max(1, c.y - o.y + 1) };
    if (!sameRect(rect, drag.rect)) setDrag({ ...drag, rect });
  }

  async function end() {
    const d = drag;
    setDrag(null);
    if (!d) return;
    if (d.mode === 'draw' && d.rect.w * d.rect.h < 2) return; // a click: just deselect
    if (d.mode !== 'draw' && sameRect(d.rect, d.orig)) return;
    if (slots.some((s) => s.id !== d.id && overlaps(s, d.rect))) {
      toast.error('Slots can’t overlap.');
      return;
    }
    await save(d.mode === 'draw' ? null : d.id!, d.rect);
  }

  async function save(id: string | null, rect: Rect) {
    setBusy(true);
    if (id) {
      await attempt(() => supabase.from('ad_slots').update(rect).eq('id', id));
    } else {
      const { data, error } = await supabase.from('ad_slots').insert(rect).select('id').single();
      if (error) toast.error(friendlyError(error.message));
      else onSelect((data as { id: string }).id);
    }
    setBusy(false);
    onChanged();
  }

  function addPreset(rect: Rect, name: string) {
    if (slots.some((s) => overlaps(s, rect))) {
      toast.error(`No room for a ${name}: move or delete the slots in the way.`);
      return;
    }
    save(null, rect);
  }

  const dragBad = drag && drag.mode !== 'draw'
    ? slots.some((s) => s.id !== drag.id && overlaps(s, drag.rect))
    : drag ? slots.some((s) => overlaps(s, drag.rect)) : false;

  const pct = (r: Rect) => ({
    left: `${(r.x / cols) * 100}%`, top: `${(r.y / rows) * 100}%`,
    width: `${(r.w / cols) * 100}%`, height: `${(r.h / rows) * 100}%`,
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex gap-1 rounded-lg border border-slate-200 bg-white p-1" role="radiogroup" aria-label="Preview phone">
          {PREVIEWS.map((x) => (
            <button key={x.key} type="button" role="radio" aria-checked={preview === x.key} onClick={() => setPreview(x.key)}
              className={cn('rounded-md px-3 py-1 text-xs font-medium', preview === x.key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100')}>
              {x.label}
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => addPreset({ x: 0, y: rows - 1, w: cols, h: 1 }, 'bottom bar')}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Bottom bar
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => addPreset({ x: 0, y: 0, w: cols, h: rows }, 'full box')}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Full box
        </Button>
        {busy && <Spinner />}
      </div>

      {/* Phone preview */}
      <div className="mx-auto w-[300px] rounded-[2rem] border-[6px] border-slate-800 bg-white shadow-lg">
        <div className="overflow-hidden rounded-[1.5rem]">
          <div className="flex h-10 items-center gap-2 border-b border-slate-100 px-4">
            <img src="/icopedia-mark.svg" alt="" className="h-5 w-5" />
            <span className="text-xs font-semibold text-slate-700">Home</span>
          </div>
          <div className="flex flex-col bg-white" style={{ height: PHONE_BODY }}>
            {/* Home tiles stand-in: whatever the ad area doesn't use */}
            <div className="grid flex-1 grid-cols-2 content-start gap-2 overflow-hidden p-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={cn('rounded-lg bg-slate-100', i < 2 ? 'col-span-2 h-14' : 'h-16')} />
              ))}
            </div>
            <div className="px-3 pb-3 pt-1" style={{ height: areaHeight }}>
              <div
                ref={ref}
                className="relative h-full w-full touch-none select-none rounded-lg"
                style={{
                  backgroundImage: 'linear-gradient(to right, rgb(226 232 240) 1px, transparent 1px), linear-gradient(to bottom, rgb(226 232 240) 1px, transparent 1px)',
                  backgroundSize: `${100 / cols}% ${100 / rows}%`,
                  outline: '1px dashed rgb(203 213 225)',
                  cursor: drag?.mode === 'move' ? 'grabbing' : 'crosshair',
                }}
                onPointerDown={(e) => begin(e, 'draw')}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={() => setDrag(null)}
              >
                {slots.map((s) => {
                  const live = drag && drag.id === s.id ? drag.rect : s;
                  const first = ads.find((a) => a.slot_id === s.id && a.active) ?? ads.find((a) => a.slot_id === s.id);
                  const count = ads.filter((a) => a.slot_id === s.id).length;
                  const isSel = s.id === selected;
                  return (
                    <div key={s.id} className="absolute p-[2px]" style={pct(live)}>
                      <div
                        className={cn(
                          'group relative h-full w-full cursor-grab overflow-hidden rounded-md border bg-slate-50',
                          isSel ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-300',
                          !s.active && 'opacity-40',
                          drag?.id === s.id && dragBad && 'border-red-500 ring-red-200',
                        )}
                        onPointerDown={(e) => begin(e, 'move', s)}
                      >
                        {first ? <AdThumb ad={first} /> : (
                          <div className="flex h-full items-center justify-center text-[10px] text-slate-400">Empty</div>
                        )}
                        {count > 1 && (
                          <span className="absolute right-1 top-1 rounded bg-black/60 px-1 text-[9px] font-medium text-white">
                            {s.scrollable ? `${count} rotating` : `1 of ${count}`}
                          </span>
                        )}
                        <span
                          className="absolute bottom-0 right-0 h-3 w-3 cursor-nwse-resize rounded-tl bg-blue-500 opacity-0 group-hover:opacity-100"
                          style={isSel ? { opacity: 1 } : undefined}
                          onPointerDown={(e) => begin(e, 'resize', s)}
                        />
                      </div>
                    </div>
                  );
                })}
                {drag?.mode === 'draw' && drag.rect.w * drag.rect.h > 1 && (
                  <div className="pointer-events-none absolute p-[2px]" style={pct(drag.rect)}>
                    <div className={cn('h-full w-full rounded-md border-2 border-dashed', dragBad ? 'border-red-500 bg-red-50/60' : 'border-blue-500 bg-blue-50/60')} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-slate-500">
        Ad area here: {areaHeight - 16} px tall. It only uses the space left above the bottom bar, so Home never scrolls; on a phone with less than {settings.min_height} px left, the ads are hidden.
      </p>
    </div>
  );
}

function AdThumb({ ad }: { ad: Ad }) {
  if (ad.type === 'google' || !ad.media_url) {
    return <div className="flex h-full items-center justify-center text-[10px] font-medium text-slate-500">{ad.type === 'google' ? 'Google ad' : 'No media'}</div>;
  }
  const fit = ad.fit === 'contain' ? 'object-contain' : 'object-cover';
  return (
    <div className="pointer-events-none h-full w-full" style={{ background: ad.background }}>
      {ad.media_type === 'video'
        ? <video src={ad.media_url} className={cn('h-full w-full', fit)} muted autoPlay loop playsInline />
        : <img src={ad.media_url} alt="" className={cn('h-full w-full', fit)} draggable={false} />}
    </div>
  );
}

function GridSettings({ settings, slots, onSaved }: { settings: Settings; slots: Slot[]; onSaved: () => void }) {
  const [cols, setCols] = useState(String(settings.cols));
  const [rows, setRows] = useState(String(settings.rows));
  const [minH, setMinH] = useState(String(settings.min_height));
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setCols(String(settings.cols)); setRows(String(settings.rows)); setMinH(String(settings.min_height));
  }, [settings]);

  const c = Number(cols), r = Number(rows), m = Number(minH);
  const valid = Number.isInteger(c) && c >= 1 && c <= 12 && Number.isInteger(r) && r >= 1 && r <= 24
    && Number.isInteger(m) && m >= 40 && m <= 600;
  const dirty = c !== settings.cols || r !== settings.rows || m !== settings.min_height;
  const outside = valid ? slots.filter((s) => !fits(s, { ...settings, cols: c, rows: r })).length : 0;

  async function save() {
    setSaving(true);
    const ok = await attempt(() => supabase.from('ad_settings').update({ cols: c, rows: r, min_height: m }).eq('id', true), 'Grid saved');
    setSaving(false);
    if (ok) onSaved();
  }

  return (
    <div className="mt-5 border-t border-slate-100 pt-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="ad-cols">Columns</Label>
          <Input id="ad-cols" type="number" min={1} max={12} value={cols} onChange={(e) => setCols(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="ad-rows">Rows</Label>
          <Input id="ad-rows" type="number" min={1} max={24} value={rows} onChange={(e) => setRows(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="ad-min">Hide if less than (px)</Label>
          <Input id="ad-min" type="number" min={40} max={600} value={minH} onChange={(e) => setMinH(e.target.value)} className="mt-1" />
        </div>
      </div>
      {!valid && <p className="mt-2 text-xs text-red-600">Columns 1–12, rows 1–24, hide-below 40–600 px.</p>}
      {outside > 0 && <p className="mt-2 text-xs text-amber-700">{outside} slot{outside === 1 ? '' : 's'} won’t fit the smaller grid and will be hidden until moved.</p>}
      <div className="mt-3 flex gap-2">
        <Button size="sm" disabled={!dirty || !valid || saving} onClick={save} className="bg-slate-900 text-white hover:bg-slate-800">
          {saving && <Spinner className="mr-2" />} Save grid
        </Button>
        {dirty && <Button size="sm" variant="ghost" onClick={() => { setCols(String(settings.cols)); setRows(String(settings.rows)); setMinH(String(settings.min_height)); }}>Undo</Button>}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------- slot

function SlotPanel({ slot, settings, slots, ads, onChanged, onDeleted }: {
  slot: Slot; settings: Settings; slots: Slot[]; ads: Ad[]; onChanged: () => void; onDeleted: () => void;
}) {
  const [pos, setPos] = useState({ x: String(slot.x + 1), y: String(slot.y + 1), w: String(slot.w), h: String(slot.h) });
  const [editing, setEditing] = useState<Ad | 'new' | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => setPos({ x: String(slot.x + 1), y: String(slot.y + 1), w: String(slot.w), h: String(slot.h) }), [slot]);

  const rect: Rect = { x: Number(pos.x) - 1, y: Number(pos.y) - 1, w: Number(pos.w), h: Number(pos.h) };
  const intOk = [rect.x, rect.y, rect.w, rect.h].every(Number.isInteger);
  const posProblem = !intOk || !fits(rect, settings) ? `Must fit a ${settings.cols} × ${settings.rows} grid.`
    : slots.some((s) => s.id !== slot.id && overlaps(s, rect)) ? 'Overlaps another slot.' : null;
  const posDirty = !sameRect(rect, slot);

  async function update(patch: Partial<Slot>, msg?: string) {
    setBusy(true);
    const ok = await attempt(() => supabase.from('ad_slots').update(patch).eq('id', slot.id), msg);
    setBusy(false);
    if (ok) onChanged();
  }

  async function reorder(index: number, dir: -1 | 1) {
    const list = [...ads];
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    [list[index], list[j]] = [list[j], list[index]];
    setBusy(true);
    const results = await Promise.all(list.map((a, i) => supabase.from('ads').update({ sort: i }).eq('id', a.id)));
    setBusy(false);
    const failed = results.find((r) => r.error);
    if (failed?.error) toast.error(friendlyError(failed.error.message));
    onChanged();
  }

  async function deleteAd(ad: Ad) {
    const ok = await attempt(() => supabase.from('ads').delete().eq('id', ad.id), 'Ad deleted');
    if (ok) { await removeStored(ad.media_url); onChanged(); }
  }

  async function deleteSlot() {
    const ok = await attempt(() => supabase.from('ad_slots').delete().eq('id', slot.id), 'Slot deleted');
    if (ok) {
      await Promise.all(ads.map((a) => removeStored(a.media_url)));
      onDeleted();
    }
  }

  return (
    <Panel
      title={`Slot · ${shapeName(slot, settings)}`}
      description={slot.scrollable && ads.length > 1 ? 'Rotates through its ads; each shows for its own duration and can be swiped.' : 'Shows its first live ad.'}
      actions={
        <Confirm
          trigger={<Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700"><Trash2 className="mr-1 h-4 w-4" /> Delete slot</Button>}
          title="Delete this slot?"
          description={ads.length ? `Its ${ads.length} ad${ads.length === 1 ? '' : 's'} and their files are deleted too.` : undefined}
          confirmLabel="Delete"
          destructive
          onConfirm={deleteSlot}
        />
      }
    >
      <div className="space-y-5">
        <div>
          <div className="grid grid-cols-4 gap-2">
            {([['x', 'Column'], ['y', 'Row'], ['w', 'Width'], ['h', 'Height']] as const).map(([k, label]) => (
              <div key={k}>
                <Label htmlFor={`slot-${k}`} className="text-xs">{label}</Label>
                <Input id={`slot-${k}`} type="number" min={1} value={pos[k]} onChange={(e) => setPos({ ...pos, [k]: e.target.value })} className="mt-1 h-8" />
              </div>
            ))}
          </div>
          {posDirty && posProblem && <p className="mt-1 text-xs text-red-600">{posProblem}</p>}
          {posDirty && (
            <div className="mt-2 flex gap-2">
              <Button size="sm" disabled={!!posProblem || busy} onClick={() => update(rect, 'Slot moved')} className="bg-slate-900 text-white hover:bg-slate-800">Save position</Button>
              <Button size="sm" variant="ghost" onClick={() => setPos({ x: String(slot.x + 1), y: String(slot.y + 1), w: String(slot.w), h: String(slot.h) })}>Undo</Button>
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label htmlFor="slot-scroll" className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border border-slate-200 p-3">
            <div>
              <div className="text-sm font-medium text-slate-900">Scrollable</div>
              <div className="text-xs text-slate-500">Rotate through all ads and let people swipe. Off shows only the first.</div>
            </div>
            <Switch id="slot-scroll" checked={slot.scrollable} disabled={busy} onCheckedChange={(v) => update({ scrollable: v })} />
          </label>
          <label htmlFor="slot-active" className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border border-slate-200 p-3">
            <div>
              <div className="text-sm font-medium text-slate-900">Show slot</div>
              <div className="text-xs text-slate-500">Off hides the slot without deleting its ads.</div>
            </div>
            <Switch id="slot-active" checked={slot.active} disabled={busy} onCheckedChange={(v) => update({ active: v })} />
          </label>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium text-slate-900">Ads in this slot</div>
            <Button size="sm" onClick={() => setEditing('new')} className="bg-slate-900 text-white hover:bg-slate-800"><Plus className="mr-1 h-4 w-4" /> Add ad</Button>
          </div>
          {ads.length === 0 ? <Empty>No ads yet.</Empty> : (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {ads.map((ad, i) => {
                const st = adStatus(ad);
                return (
                  <li key={ad.id} className="flex items-center gap-3 p-3">
                    <div className="h-12 w-16 shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-50"><AdThumb ad={ad} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-slate-900">{ad.title || ad.sponsor_name || '(untitled)'}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Pill tone={TYPE_TONE[ad.type]}>{TYPE_LABEL[ad.type]}</Pill>
                        <Pill tone={st.tone}>{st.label}</Pill>
                        <span className="text-xs text-slate-500">{ad.media_type} · {ad.duration_seconds} s · {ad.impressions.toLocaleString('en-IN')} views · {ad.clicks.toLocaleString('en-IN')} taps</span>
                      </div>
                    </div>
                    <Switch checked={ad.active} aria-label="Show this ad" disabled={busy}
                      onCheckedChange={async (v) => { if (await attempt(() => supabase.from('ads').update({ active: v }).eq('id', ad.id))) onChanged(); }} />
                    <div className="flex">
                      <Button size="icon" variant="ghost" className="h-8 w-8" disabled={busy || i === 0} aria-label="Move up" onClick={() => reorder(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" disabled={busy || i === ads.length - 1} aria-label="Move down" onClick={() => reorder(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Edit" onClick={() => setEditing(ad)}><Pencil className="h-4 w-4" /></Button>
                      <Confirm
                        trigger={<Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50" aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>}
                        title="Delete this ad?" confirmLabel="Delete" destructive onConfirm={() => deleteAd(ad)}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {editing && (
        <AdDialog
          slotId={slot.id}
          ad={editing === 'new' ? null : editing}
          nextSort={ads.length}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); onChanged(); }}
        />
      )}
    </Panel>
  );
}

// --------------------------------------------------------------------- ad

const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

function mediaTypeOf(file: File): MediaType {
  if (file.type === 'image/gif') return 'gif';
  if (file.type.startsWith('video/')) return 'video';
  return 'image';
}

function AdDialog({ slotId, ad, nextSort, onClose, onSaved }: {
  slotId: string; ad: Ad | null; nextSort: number; onClose: () => void; onSaved: () => void;
}) {
  const [type, setType] = useState<AdType>(ad?.type ?? 'direct');
  const [title, setTitle] = useState(ad?.title ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fit, setFit] = useState<'cover' | 'contain'>(ad?.fit ?? 'cover');
  const [background, setBackground] = useState(ad?.background ?? '#ffffff');
  const [sponsor, setSponsor] = useState(ad?.sponsor_name ?? '');
  const [actionKind, setActionKind] = useState<ActionKind>(ad?.action_kind ?? 'none');
  const [actionValue, setActionValue] = useState(ad?.action_value ?? '');
  const [cta, setCta] = useState(ad?.cta_label ?? '');
  const [duration, setDuration] = useState(String(ad?.duration_seconds ?? 6));
  const [startsAt, setStartsAt] = useState(toLocalInput(ad?.starts_at ?? null));
  const [endsAt, setEndsAt] = useState(toLocalInput(ad?.ends_at ?? null));
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (fileUrl) URL.revokeObjectURL(fileUrl); }, [fileUrl]);

  const mediaType: MediaType = file ? mediaTypeOf(file) : ad?.media_type ?? 'image';
  const mediaSrc = fileUrl ?? ad?.media_url ?? null;
  const d = Number(duration);
  const problems = [
    type !== 'google' && !mediaSrc && 'Add an image, GIF or video.',
    type === 'sponsor' && !sponsor.trim() && 'Enter the sponsor’s name.',
    actionKind !== 'none' && !actionValue.trim() && (actionKind === 'website' ? 'Enter the link.' : 'Enter the phone number.'),
    !(Number.isInteger(d) && d >= 2 && d <= 120) && 'Duration must be 2 to 120 seconds.',
    startsAt && endsAt && new Date(endsAt) <= new Date(startsAt) && 'End must be after start.',
  ].filter(Boolean) as string[];

  function pick(f: File | undefined) {
    if (!f) return;
    if (!/^(image\/(jpeg|png|webp|gif)|video\/(mp4|webm|quicktime))$/.test(f.type)) {
      toast.error('Use a JPG, PNG, WebP, GIF, MP4, WebM or MOV file.');
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      toast.error(`That file is over ${MAX_MB} MB.`);
      return;
    }
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFile(f);
    setFileUrl(URL.createObjectURL(f));
  }

  async function save() {
    setSaving(true);
    try {
      let media_url = ad?.media_url ?? null;
      if (file) {
        const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
        if (error) { toast.error(friendlyError(error.message)); return; }
        media_url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      }
      const row = {
        slot_id: slotId, type, title: title.trim(),
        media_url: type === 'google' ? null : media_url, media_type: mediaType, fit, background,
        sponsor_name: type === 'sponsor' ? sponsor.trim() : null,
        action_kind: type === 'google' ? 'none' : actionKind,
        action_value: type === 'google' || actionKind === 'none' ? null : actionValue.trim(),
        cta_label: type === 'google' || actionKind === 'none' ? null : cta.trim() || null,
        duration_seconds: d,
        starts_at: fromLocalInput(startsAt), ends_at: fromLocalInput(endsAt),
      };
      const ok = ad
        ? await attempt(() => supabase.from('ads').update(row).eq('id', ad.id), 'Ad saved')
        : await attempt(() => supabase.from('ads').insert({ ...row, sort: nextSort }), 'Ad added');
      if (!ok) {
        if (file && media_url) await removeStored(media_url);
        return;
      }
      // Replaced or no longer used: drop the old file.
      if (ad?.media_url && ad.media_url !== row.media_url) await removeStored(ad.media_url);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const select = 'mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm';

  return (
    <Dialog open onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{ad ? 'Edit ad' : 'Add ad'}</DialogTitle></DialogHeader>

        <div className="grid gap-5 sm:grid-cols-[1fr_200px]">
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <div className="mt-1 inline-flex gap-1 rounded-lg border border-slate-200 bg-white p-1" role="radiogroup" aria-label="Type">
                {(['direct', 'sponsor', 'google'] as const).map((t) => (
                  <button key={t} type="button" role="radio" aria-checked={type === t} onClick={() => setType(t)}
                    className={cn('rounded-md px-3 py-1.5 text-sm font-medium', type === t ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100')}>
                    {TYPE_LABEL[t]}
                  </button>
                ))}
              </div>
              {type === 'google' && (
                <p className="mt-2 text-xs text-amber-700">Holds this slot’s place for Google AdMob. The app doesn’t show Google ads yet; that needs an app update with your AdMob IDs.</p>
              )}
            </div>

            <div>
              <Label htmlFor="ad-title">Name</Label>
              <Input id="ad-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Diwali offer" className="mt-1" />
              <p className="mt-1 text-xs text-slate-500">For this list and screen readers. Not shown on the ad.</p>
            </div>

            {type !== 'google' && (
              <>
                {type === 'sponsor' && (
                  <div>
                    <Label htmlFor="ad-sponsor">Sponsor name</Label>
                    <Input id="ad-sponsor" value={sponsor} onChange={(e) => setSponsor(e.target.value)} placeholder="Shown as “Sponsored · name”" className="mt-1" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="ad-action">When tapped</Label>
                    <select id="ad-action" className={select} value={actionKind} onChange={(e) => setActionKind(e.target.value as ActionKind)}>
                      <option value="none">Nothing</option>
                      <option value="website">Open a website</option>
                      <option value="whatsapp">Open WhatsApp chat</option>
                      <option value="call">Call a number</option>
                    </select>
                  </div>
                  {actionKind !== 'none' && (
                    <div>
                      <Label htmlFor="ad-action-value">{actionKind === 'website' ? 'Link' : 'Phone (with country code)'}</Label>
                      <Input id="ad-action-value" value={actionValue} onChange={(e) => setActionValue(e.target.value)}
                        placeholder={actionKind === 'website' ? 'https://…' : '+91 98765 43210'} className="mt-1" />
                    </div>
                  )}
                </div>
                {actionKind !== 'none' && (
                  <div>
                    <Label htmlFor="ad-cta">Button text (optional)</Label>
                    <Input id="ad-cta" value={cta} onChange={(e) => setCta(e.target.value)} placeholder={type === 'sponsor' ? 'Contact' : 'Learn more'} maxLength={20} className="mt-1" />
                    <p className="mt-1 text-xs text-slate-500">Leave empty for no button; the whole ad is still tappable.</p>
                  </div>
                )}
              </>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="ad-duration">Duration (s)</Label>
                <Input id="ad-duration" type="number" min={2} max={120} value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="ad-start">Starts</Label>
                <Input id="ad-start" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="mt-1 px-2 text-xs" />
              </div>
              <div>
                <Label htmlFor="ad-end">Ends</Label>
                <Input id="ad-end" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="mt-1 px-2 text-xs" />
              </div>
            </div>
            <p className="-mt-2 text-xs text-slate-500">Duration is how long it shows before a scrollable slot moves on. Leave the dates empty to run it until you switch it off.</p>
          </div>

          {/* Media */}
          {type !== 'google' && (
            <div className="space-y-3">
              <Label>Image, GIF or video</Label>
              <button type="button" onClick={() => fileInput.current?.click()}
                className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 hover:border-slate-400"
                style={{ background }}>
                {mediaSrc ? (
                  mediaType === 'video'
                    ? <video src={mediaSrc} className={cn('h-full w-full', fit === 'contain' ? 'object-contain' : 'object-cover')} muted autoPlay loop playsInline />
                    : <img src={mediaSrc} alt="" className={cn('h-full w-full', fit === 'contain' ? 'object-contain' : 'object-cover')} />
                ) : (
                  <span className="flex flex-col items-center gap-1 text-xs text-slate-500"><ImagePlus className="h-6 w-6" /> Choose file</span>
                )}
              </button>
              <input ref={fileInput} type="file" className="hidden"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
              <p className="text-xs text-slate-500">Up to {MAX_MB} MB. Videos play muted and loop.</p>
              <div>
                <Label htmlFor="ad-fit" className="text-xs">Fit</Label>
                <select id="ad-fit" className={select} value={fit} onChange={(e) => setFit(e.target.value as 'cover' | 'contain')}>
                  <option value="cover">Fill the slot (crops edges)</option>
                  <option value="contain">Show all of it</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input id="ad-bg" type="color" value={background} onChange={(e) => setBackground(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-slate-200" />
                <Label htmlFor="ad-bg" className="text-xs">Background (shows around “Show all of it”)</Label>
              </div>
            </div>
          )}
        </div>

        {problems.length > 0 && <p className="text-xs text-red-600">{problems[0]}</p>}
        <DialogFooter>
          <Button variant="ghost" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button disabled={saving || problems.length > 0} onClick={save} className="bg-slate-900 text-white hover:bg-slate-800">
            {saving && <Spinner className="mr-2" />} {ad ? 'Save' : 'Add ad'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
