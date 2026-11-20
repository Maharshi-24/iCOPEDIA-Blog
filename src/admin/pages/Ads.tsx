import { PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Bell, Home, ImagePlus, Menu, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
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
/** Matches the switches at the top: "Our ads", "Sponsor ads", "Google ads". */
const TYPE_GROUP: Record<AdType, string> = { direct: 'Our ads', sponsor: 'Sponsor ads', google: 'Google ads' };
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
  const [tiles, setTiles] = useState<HomeTile[] | null>(null);

  const load = useCallback(async () => {
    const [s, sl, a, t] = await Promise.all([
      supabase.from('ad_settings').select('direct_enabled, sponsor_enabled, google_enabled, cols, rows, min_height').maybeSingle(),
      supabase.from('ad_slots').select('id, x, y, w, h, scrollable, active').order('y').order('x'),
      supabase.from('ads').select('*').order('sort').order('created_at'),
      // For the phone preview: which Home tiles free users see.
      supabase.from('home_tiles').select('key, label, visible_for_free'),
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
    setTiles(t.error ? null : ((t.data ?? []) as HomeTile[]));
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
          <div className="grid items-start gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
            <Panel title="Layout" description="Drag across empty cells to add a slot. Drag a slot to move it, or its blue corner to resize it.">
              <LayoutEditor settings={settings} slots={slots} ads={ads} tiles={tiles} selected={selected} onSelect={setSelected} onChanged={load} />
              <GridSettings settings={settings} slots={slots} onSaved={load} />
            </Panel>
            {selectedSlot ? (
              <SlotPanel
                key={selectedSlot.id}
                slot={selectedSlot}
                tiles={tiles}
                settings={settings}
                slots={slots}
                ads={ads.filter((a) => a.slot_id === selectedSlot.id)}
                onChanged={load}
                onDeleted={() => { setSelected(null); load(); }}
              />
            ) : (
              <Panel title="Slot">
                <Empty>{slots.length ? 'Click a slot in the phone to set its ads.' : 'No slots yet. Drag across the grid, or use Bottom bar / Full box.'}</Empty>
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
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-slate-900">{r.title}</div>
              <div className="mt-0.5 text-xs text-slate-500">{r.text}</div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
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

// Real phone screens in logical pixels (what the app lays out in). The
// preview draws the free-user Home at that size and scales it down, so the
// space left for ads is what that phone really has.
const PHONES = [
  { key: 'small', label: 'Small', note: 'Android 360 × 740', w: 360, h: 740, status: 24 },
  { key: 'standard', label: 'Standard', note: 'iPhone 15 · 393 × 852', w: 393, h: 852, status: 59 },
  { key: 'large', label: 'Large', note: 'iPhone 15 Pro Max · 430 × 932', w: 430, h: 932, status: 59 },
] as const;
type PhoneKey = (typeof PHONES)[number]['key'];

// Sizes from the app (home.dart, app_header.dart, navigation_controller.dart).
const APP = { header: 60, tile: 100, tileGap: 10, tilesPadX: 16, tilesPadY: 8, nav: 85, adPad: { top: 4, x: 16, bottom: 12 }, adGap: 8 };
const PREVIEW_W = 300; // px the phone screen is drawn at

/** Home's tile rows in app order; a row with no visible tiles is dropped. */
const TILE_ROWS: string[][] = [['calculators'], ['product_details', 'boq'], ['daily_report', 'instruments'], ['community', 'tutorials'], ['news', 'notes']];
const TILE_LABELS: Record<string, string> = {
  calculators: 'Calculators', product_details: 'Product Details', boq: 'Bill of Quantities', daily_report: 'Project Report',
  instruments: 'Instruments', community: 'Community', tutorials: 'Tutorials', news: 'News', notes: 'Notes',
};
/** Used when home_tiles can't be read: the app's own default for free users. */
const FREE_HIDDEN_DEFAULT = new Set(['product_details', 'daily_report', 'instruments']);

export type HomeTile = { key: string; label: string; visible_for_free: boolean };
type Phone = (typeof PHONES)[number];
type Size = { w: number; h: number };

/** Free users' tile rows, following the Home tiles page. */
function freeTileRows(tiles: HomeTile[] | null) {
  const visible = (key: string) => {
    const t = tiles?.find((x) => x.key === key);
    return t ? t.visible_for_free : !FREE_HIDDEN_DEFAULT.has(key);
  };
  return TILE_ROWS.map((r) => r.filter(visible)).filter((r) => r.length > 0);
}

/** The ad grid's size on [phone], in logical px; `left` is the gap between tiles and bottom bar. */
function adCanvas(phone: Phone, tiles: HomeTile[] | null) {
  const tilesH = APP.tilesPadY * 2 + freeTileRows(tiles).length * (APP.tile + APP.tileGap);
  const left = phone.h - phone.status - APP.header - tilesH - APP.nav;
  return { left, w: phone.w - APP.adPad.x * 2, h: left - APP.adPad.top - APP.adPad.bottom };
}

/** A slot's size on a canvas, the same maths as the app (8 px gaps). */
function slotSize(r: Rect, canvas: Size, s: Settings): Size {
  const cellW = (canvas.w - APP.adGap * (s.cols - 1)) / s.cols;
  const cellH = (canvas.h - APP.adGap * (s.rows - 1)) / s.rows;
  return { w: r.w * cellW + (r.w - 1) * APP.adGap, h: r.h * cellH + (r.h - 1) * APP.adGap };
}

const ratioText = (w: number, h: number) => (h <= 0 ? '—' : w >= h ? `${(w / h).toFixed(2).replace(/\.?0+$/, '')} : 1` : `1 : ${(h / w).toFixed(2).replace(/\.?0+$/, '')}`);
const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);

/** Image size to make for a slot: its size on the Standard phone at 3x, plus
 * the middle part that stays visible ("Fill") on every phone that shows ads. */
function creativeSpec(r: Rect, s: Settings, tiles: HomeTile[] | null) {
  const sizes = PHONES.map((p) => {
    const c = adCanvas(p, tiles);
    return { phone: p, size: slotSize(r, c, s), hidden: c.h < s.min_height };
  });
  const std = sizes.find((x) => x.phone.key === 'standard')!.size;
  const target = { w: even(std.w * 3), h: even(std.h * 3) };
  const a = target.w / target.h;
  let safeW = 1, safeH = 1;
  for (const x of sizes) {
    if (x.hidden || x.size.h <= 0) continue;
    const ap = x.size.w / x.size.h;
    if (ap > a) safeH = Math.min(safeH, a / ap); else safeW = Math.min(safeW, ap / a);
  }
  return { sizes, target, safe: { w: even(target.w * safeW), h: even(target.h * safeH) } };
}

function LayoutEditor({ settings, slots, ads, tiles, selected, onSelect, onChanged }: {
  settings: Settings; slots: Slot[]; ads: Ad[]; tiles: HomeTile[] | null; selected: string | null;
  onSelect: (id: string | null) => void; onChanged: () => void;
}) {
  const { cols, rows } = settings;
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [phoneKey, setPhoneKey] = useState<PhoneKey>('standard');
  const [busy, setBusy] = useState(false);

  const phone = PHONES.find((p) => p.key === phoneKey)!;
  const scale = PREVIEW_W / phone.w;

  const label = (key: string) => tiles?.find((x) => x.key === key)?.label ?? TILE_LABELS[key] ?? key;
  const tileRows = freeTileRows(tiles);
  const { left, w: canvasW, h: canvasH } = adCanvas(phone, tiles); // left: space between tiles and bottom bar
  const hidden = canvasH < settings.min_height;
  const cellW = (canvasW - APP.adGap * (cols - 1)) / cols;
  const cellH = (canvasH - APP.adGap * (rows - 1)) / rows;

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

  const dragBad = drag
    ? slots.some((s) => s.id !== drag.id && overlaps(s, drag.rect))
    : false;

  // Same maths as the app: cells with an 8 px gap between them.
  const place = (r: Rect) => ({
    left: r.x * (cellW + APP.adGap), top: r.y * (cellH + APP.adGap),
    width: r.w * cellW + (r.w - 1) * APP.adGap, height: r.h * cellH + (r.h - 1) * APP.adGap,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-1 rounded-lg border border-slate-200 bg-white p-1" role="radiogroup" aria-label="Preview phone">
        {PHONES.map((p) => (
          <button key={p.key} type="button" role="radio" aria-checked={phoneKey === p.key} onClick={() => setPhoneKey(p.key)}
            title={p.note}
            className={cn('rounded-md px-2 py-1.5 text-xs font-medium', phoneKey === p.key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100')}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Phone: the free-user Home at real size, scaled down */}
      <div className="mx-auto rounded-[2.25rem] bg-slate-900 p-2.5 shadow-xl" style={{ width: PREVIEW_W + 20 }}>
        <div className="overflow-hidden rounded-[1.75rem] bg-white" style={{ width: PREVIEW_W, height: phone.h * scale }}>
          <div className="flex origin-top-left flex-col" style={{ width: phone.w, height: phone.h, transform: `scale(${scale})` }}>
            {/* Status bar */}
            <div className="flex shrink-0 items-end justify-between px-7 pb-1 text-[13px] font-semibold text-slate-800" style={{ height: phone.status }}>
              <span>9:41</span><span className="tracking-widest">•••</span>
            </div>
            {/* App header */}
            <div className="flex shrink-0 items-center gap-3 px-4 shadow-[0_2px_6px_rgba(0,0,0,0.08)]" style={{ height: APP.header }}>
              <Menu className="h-6 w-6 text-slate-700" />
              <img src="/icopedia-mark.svg" alt="" className="h-7 w-7" />
              <span className="text-lg font-semibold text-slate-800">iCOPEDIA</span>
            </div>
            {/* Home tiles */}
            <div className="shrink-0" style={{ padding: `${APP.tilesPadY}px ${APP.tilesPadX}px` }}>
              {tileRows.map((row, i) => (
                <div key={i} className="flex" style={{ gap: APP.tileGap, marginBottom: APP.tileGap }}>
                  {row.map((k) => (
                    <div key={k} className="flex flex-1 items-center gap-3 rounded-2xl bg-slate-100 px-4" style={{ height: APP.tile }}>
                      <div className="h-11 w-11 shrink-0 rounded-xl bg-slate-200" />
                      <span className="text-[15px] font-medium text-slate-600">{label(k)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {/* Ad area: exactly the space left */}
            <div className="relative min-h-0 flex-1" style={{ padding: `${APP.adPad.top}px ${APP.adPad.x}px ${APP.adPad.bottom}px` }}>
              {left <= 0 ? null : hidden ? (
                <div className="flex h-full items-center justify-center rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 px-4 text-center text-[13px] text-amber-800">
                  Ads hidden on this phone: {Math.max(0, Math.round(canvasH))} px left, needs {settings.min_height}
                </div>
              ) : (
                <div
                  ref={ref}
                  className="relative h-full w-full touch-none select-none"
                  style={{ cursor: drag?.mode === 'move' ? 'grabbing' : 'crosshair' }}
                  onPointerDown={(e) => begin(e, 'draw')}
                  onPointerMove={move}
                  onPointerUp={end}
                  onPointerCancel={() => setDrag(null)}
                >
                  {/* Empty cells */}
                  {Array.from({ length: rows * cols }).map((_, i) => (
                    <div key={i} className="pointer-events-none absolute rounded-md border border-dashed border-slate-300 bg-slate-50"
                      style={place({ x: i % cols, y: Math.floor(i / cols), w: 1, h: 1 })} />
                  ))}
                  {slots.map((s) => {
                    const live = drag && drag.id === s.id ? drag.rect : s;
                    const slotAds = ads.filter((a) => a.slot_id === s.id);
                    const count = slotAds.length;
                    const isSel = s.id === selected;
                    return (
                      <div
                        key={s.id}
                        className={cn(
                          'group absolute cursor-grab overflow-hidden rounded-xl border-2 bg-white',
                          isSel ? 'border-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.25)]' : 'border-slate-300',
                          !s.active && 'opacity-40',
                          drag?.id === s.id && dragBad && 'border-red-500',
                        )}
                        style={place(live)}
                        onPointerDown={(e) => begin(e, 'move', s)}
                      >
                        <SlotPreview ads={slotAds} scrollable={s.scrollable} settings={settings} />
                        {count > 1 && (
                          <span className="absolute right-1.5 top-1.5 rounded bg-black/60 px-1.5 text-[11px] font-medium text-white">
                            {s.scrollable ? `${count} rotating` : `1 of ${count}`}
                          </span>
                        )}
                        <span
                          className={cn('absolute bottom-0 right-0 h-5 w-5 cursor-nwse-resize rounded-tl-lg bg-blue-500', isSel ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}
                          onPointerDown={(e) => begin(e, 'resize', s)}
                        />
                      </div>
                    );
                  })}
                  {drag?.mode === 'draw' && drag.rect.w * drag.rect.h > 1 && (
                    <div className={cn('pointer-events-none absolute rounded-xl border-2 border-dashed', dragBad ? 'border-red-500 bg-red-50/70' : 'border-blue-500 bg-blue-50/70')}
                      style={place(drag.rect)} />
                  )}
                </div>
              )}
            </div>
            {/* Bottom navigation */}
            <div className="flex shrink-0 items-center justify-around border-t border-slate-100 bg-white shadow-[0_-5px_10px_rgba(0,0,0,0.05)]" style={{ height: APP.nav }}>
              {([['Home', Home], ['Alerts', Bell], ['Ustad', Sparkles]] as const).map(([name, Icon], i) => (
                <div key={name} className={cn('flex flex-col items-center gap-1 text-[12px] font-medium', i === 0 ? 'text-blue-600' : 'text-slate-500')}>
                  <Icon className="h-6 w-6" />
                  {name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500">
        {phone.note}. {left > 0 ? `${Math.round(Math.max(0, canvasH))} px left for ads` : 'No space left for ads'} on this phone. Home never scrolls; if less than {settings.min_height} px is left, ads are hidden.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" disabled={busy} onClick={() => addPreset({ x: 0, y: rows - 1, w: cols, h: 1 }, 'bottom bar')}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Bottom bar
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => addPreset({ x: 0, y: 0, w: cols, h: rows }, 'full box')}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Full box
        </Button>
      </div>
      {hidden && slots.length > 0 && (
        <p className="text-xs text-amber-700">Pick a bigger phone above to edit slots, or lower “Hide if less than” below.</p>
      )}
    </div>
  );
}

/** The ads the app would show in a slot right now: live, type switched on,
 * with media (Google ads aren't in the app yet). */
function showable(ads: Ad[], s: Settings) {
  const on = { direct: s.direct_enabled, sponsor: s.sponsor_enabled, google: s.google_enabled };
  return ads.filter((a) => adStatus(a).label === 'live' && on[a.type] && a.type !== 'google' && !!a.media_url);
}

const TYPE_SETTING: Record<AdType, 'direct_enabled' | 'sponsor_enabled' | 'google_enabled'> = {
  direct: 'direct_enabled', sponsor: 'sponsor_enabled', google: 'google_enabled',
};

/** Whether the app shows this ad right now, and if not, why. */
function rotationStatus(ad: Ad, slotAds: Ad[], scrollable: boolean, s: Settings): { label: string; tone: 'green' | 'amber' | 'slate' | 'red' } {
  const st = adStatus(ad);
  if (st.label !== 'live') return st;
  if (ad.type === 'google') return { label: 'Google ads not in the app yet', tone: 'slate' };
  if (!s[TYPE_SETTING[ad.type]]) return { label: `“${TYPE_GROUP[ad.type]}” switched off`, tone: 'amber' };
  if (!ad.media_url) return { label: 'no image', tone: 'red' };
  const shown = showable(slotAds, s);
  if (!scrollable && shown[0]?.id !== ad.id) return { label: 'not shown: slot not scrollable', tone: 'slate' };
  return { label: scrollable && shown.length > 1 ? 'in rotation' : 'showing', tone: 'green' };
}

/** A slot in the phone preview, rotating like the app: each ad for its own
 * duration, then the next, back to the first after the last. */
function SlotPreview({ ads, scrollable, settings }: { ads: Ad[]; scrollable: boolean; settings: Settings }) {
  const all = showable(ads, settings);
  const list = scrollable ? all : all.slice(0, 1);
  const [i, setI] = useState(0);
  const idx = list.length ? i % list.length : 0;
  const current = list[idx];
  const seconds = current?.duration_seconds ?? 0;
  const many = list.length > 1;

  useEffect(() => {
    if (!many) return;
    const t = setTimeout(() => setI((n) => n + 1), seconds * 1000);
    return () => clearTimeout(t);
  }, [i, many, seconds]);

  if (!current) {
    return (
      <div className="flex h-full items-center justify-center px-2 text-center text-[13px] font-medium text-slate-400">
        {ads.length ? 'No live ads (off, scheduled, or type switched off)' : 'Empty slot'}
      </div>
    );
  }
  return (
    <div className="relative h-full w-full">
      <AdThumb key={current.id} ad={current} />
      <span className="absolute left-1.5 top-1.5 rounded bg-black/55 px-1.5 text-[11px] font-semibold text-white">
        {current.type === 'sponsor' ? `Sponsored${current.sponsor_name ? ` · ${current.sponsor_name}` : ''}` : 'Ad'}
      </span>
      {many && (
        <div className="pointer-events-none absolute bottom-1.5 left-0 right-0 flex justify-center gap-1">
          {list.map((a, j) => (
            <span key={a.id} className={cn('h-1.5 rounded-full bg-white shadow', j === idx ? 'w-4 opacity-95' : 'w-1.5 opacity-60')} />
          ))}
        </div>
      )}
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
      <div className="mb-3 text-sm font-medium text-slate-900">Grid</div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="ad-cols">Columns</Label>
          <Input id="ad-cols" type="number" min={1} max={12} value={cols} onChange={(e) => setCols(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="ad-rows">Rows</Label>
          <Input id="ad-rows" type="number" min={1} max={24} value={rows} onChange={(e) => setRows(e.target.value)} className="mt-1" />
        </div>
        <div className="col-span-2">
          <Label htmlFor="ad-min">Hide ads if less than (px)</Label>
          <Input id="ad-min" type="number" min={40} max={600} value={minH} onChange={(e) => setMinH(e.target.value)} className="mt-1" />
          <p className="mt-1 text-xs text-slate-500">Phones with less space left than this show no ads.</p>
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

function SlotPanel({ slot, tiles, settings, slots, ads, onChanged, onDeleted }: {
  slot: Slot; tiles: HomeTile[] | null; settings: Settings; slots: Slot[]; ads: Ad[]; onChanged: () => void; onDeleted: () => void;
}) {
  const spec = creativeSpec(slot, settings, tiles);
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
          <div className="mb-2 text-sm font-medium text-slate-900">Position <span className="font-normal text-slate-500">(in grid cells)</span></div>
          <div className="grid max-w-md grid-cols-2 gap-3 sm:grid-cols-4">
            {([['x', 'Column'], ['y', 'Row'], ['w', 'Width'], ['h', 'Height']] as const).map(([k, label]) => (
              <div key={k}>
                <Label htmlFor={`slot-${k}`} className="text-xs text-slate-600">{label}</Label>
                <Input id={`slot-${k}`} type="number" min={1} value={pos[k]} onChange={(e) => setPos({ ...pos, [k]: e.target.value })} className="mt-1 h-9" />
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

        <CreativeSize spec={spec} shape={shapeName(slot, settings)} />

        <div className="grid gap-3 sm:grid-cols-2">
          <label htmlFor="slot-scroll" className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border border-slate-200 p-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-slate-900">Scrollable</div>
              <div className="text-xs text-slate-500">Rotate through all ads and let people swipe. Off shows only the first.</div>
            </div>
            <Switch id="slot-scroll" className="shrink-0" checked={slot.scrollable} disabled={busy} onCheckedChange={(v) => update({ scrollable: v })} />
          </label>
          <label htmlFor="slot-active" className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border border-slate-200 p-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-slate-900">Show slot</div>
              <div className="text-xs text-slate-500">Off hides the slot without deleting its ads.</div>
            </div>
            <Switch id="slot-active" className="shrink-0" checked={slot.active} disabled={busy} onCheckedChange={(v) => update({ active: v })} />
          </label>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium text-slate-900">Ads in this slot</div>
            <Button size="sm" onClick={() => setEditing('new')} className="bg-slate-900 text-white hover:bg-slate-800"><Plus className="mr-1 h-4 w-4" /> Add ad</Button>
          </div>
          {(['direct', 'sponsor'] as const)
            .filter((t) => !settings[TYPE_SETTING[t]] && ads.some((a) => a.type === t && a.active))
            .map((t) => (
              <div key={t} className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <span>“{TYPE_GROUP[t]}” is switched off at the top of this page, so those ads in this slot aren’t shown in the app.</span>
                <Button size="sm" variant="outline" className="h-7 bg-white" disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    const ok = await attempt(() => supabase.from('ad_settings').update({ [TYPE_SETTING[t]]: true }).eq('id', true), `${TYPE_GROUP[t]} turned on`);
                    setBusy(false);
                    if (ok) onChanged();
                  }}>
                  Turn on {TYPE_GROUP[t].toLowerCase()}
                </Button>
              </div>
            ))}
          {ads.length === 0 ? <Empty>No ads yet.</Empty> : (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {ads.map((ad, i) => {
                const st = rotationStatus(ad, ads, slot.scrollable, settings);
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
          target={spec.target}
          ad={editing === 'new' ? null : editing}
          nextSort={ads.length}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); onChanged(); }}
        />
      )}
    </Panel>
  );
}

function CreativeSize({ spec, shape }: { spec: ReturnType<typeof creativeSpec>; shape: string }) {
  const { target, safe, sizes } = spec;
  const brief = [
    `iCOPEDIA app ad (${shape})`,
    `Size: ${target.w} × ${target.h} px (ratio ${ratioText(target.w, target.h)})`,
    `Keep text and logos inside the middle ${safe.w} × ${safe.h} px; the edges can be cropped on some phones.`,
    'Format: JPG, PNG, WebP, GIF or MP4 video (plays muted, looping), up to 50 MB.',
    'A small "Ad" / "Sponsored" label sits in the top-left corner; keep that corner free of important text.',
  ].join('\n');

  async function copy() {
    try {
      await navigator.clipboard.writeText(brief);
      toast.success('Size brief copied');
    } catch {
      toast.error('Could not copy. Select the text and copy it instead.');
    }
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-900">Image size for this slot</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            {target.w} × {target.h} px
          </div>
          <div className="text-xs text-slate-600">
            Ratio {ratioText(target.w, target.h)} · keep text inside the middle {safe.w} × {safe.h} px
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={copy} className="bg-white">Copy brief for designer</Button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        {sizes.map((x) => (
          <div key={x.phone.key} className="rounded-md bg-white px-2.5 py-2 ring-1 ring-slate-200">
            <div className="font-medium text-slate-700">{x.phone.label}</div>
            <div className="text-slate-500">
              {x.hidden ? 'ads hidden' : `${Math.round(x.size.w)} × ${Math.round(x.size.h)} px on screen`}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Made at 3× the size it shows on a standard phone, so it stays sharp. The slot is a slightly different shape on each phone; with “Fill the slot” the edges outside the middle area may be cut off.
      </p>
    </div>
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

/** Width and height of an image or video, read in the browser. */
function mediaSize(src: string, video: boolean): Promise<Size | null> {
  return new Promise((resolve) => {
    if (video) {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.onloadedmetadata = () => resolve({ w: v.videoWidth, h: v.videoHeight });
      v.onerror = () => resolve(null);
      v.src = src;
    } else {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve(null);
      img.src = src;
    }
  });
}

function AdDialog({ slotId, target, ad, nextSort, onClose, onSaved }: {
  slotId: string; target: Size; ad: Ad | null; nextSort: number; onClose: () => void; onSaved: () => void;
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
  const [actual, setActual] = useState<Size | null>(null);

  useEffect(() => () => { if (fileUrl) URL.revokeObjectURL(fileUrl); }, [fileUrl]);

  const mediaType: MediaType = file ? mediaTypeOf(file) : ad?.media_type ?? 'image';
  const mediaSrc = fileUrl ?? ad?.media_url ?? null;

  useEffect(() => {
    let live = true;
    setActual(null);
    if (mediaSrc) mediaSize(mediaSrc, mediaType === 'video').then((sz) => { if (live) setActual(sz); });
    return () => { live = false; };
  }, [mediaSrc, mediaType]);

  // How far the file's shape is from the slot's (1 = same).
  const off = actual && actual.h > 0 ? (actual.w / actual.h) / (target.w / target.h) : 1;
  const shapeOk = off > 0.9 && off < 1.1;
  const small = actual ? actual.w < target.w * 0.66 : false;
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
              <p className="text-xs text-slate-500">
                Make it <span className="font-medium text-slate-700">{target.w} × {target.h} px</span> ({ratioText(target.w, target.h)}). Up to {MAX_MB} MB. Videos play muted and loop.
              </p>
              {actual && (
                <p className={cn('text-xs', shapeOk && !small ? 'text-emerald-700' : 'text-amber-700')}>
                  This file: {actual.w} × {actual.h} px ({ratioText(actual.w, actual.h)}).{' '}
                  {!shapeOk
                    ? (fit === 'cover'
                      ? `It’s ${off > 1 ? 'wider' : 'taller'} than the slot, so ${off > 1 ? 'the sides' : 'the top and bottom'} will be cut off. Use “Show all of it” or a ${target.w} × ${target.h} px file.`
                      : 'It will show with empty bands around it in the background colour.')
                    : small ? 'Right shape, but small: it may look blurry.' : 'Right shape for this slot.'}
                </p>
              )}
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
