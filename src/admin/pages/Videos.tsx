import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Film, ImagePlus, Pencil, Sparkles, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase';
import { attempt, Confirm, Empty, fmtDate, friendlyError, Loading, PageHeader, Panel, Spinner } from '../shared';

type Video = {
  id: string; title: string; description: string | null; transcription: string | null;
  video_url: string | null; thumbnail_url: string | null; duration_seconds: number | null; created_at: string;
};

const BUCKET = 'videos';
const MAX_VIDEO_MB = 500; // bucket limit
const PUBLIC_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;

const fmtDuration = (s?: number | null) => (s ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}` : '—');

/** supabase-js has no upload progress, so PUT the object with XHR. */
function uploadWithProgress(path: string, file: Blob, token: string, onProgress: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`)));
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(file);
  });
}

/** Grab a frame ~1s in (or 10% for short clips) and read the duration. */
function inspectVideo(file: File): Promise<{ duration: number; frame: Blob | null }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    v.playsInline = true;
    v.src = url;
    const done = (duration: number, frame: Blob | null) => { URL.revokeObjectURL(url); resolve({ duration, frame }); };
    v.onerror = () => done(0, null);
    v.onloadedmetadata = () => { v.currentTime = Math.min(1, (v.duration || 0) * 0.1); };
    v.onseeked = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 1280 / (v.videoWidth || 1280));
      canvas.width = Math.round((v.videoWidth || 1280) * scale);
      canvas.height = Math.round((v.videoHeight || 720) * scale);
      canvas.getContext('2d')!.drawImage(v, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => done(v.duration || 0, b), 'image/jpeg', 0.8);
    };
  });
}

/** Same look as the in-app "Generate" button: dark gradient, gold serif title. */
async function titleCard(title: string): Promise<Blob> {
  const W = 1280, H = 720;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#141E30'); g.addColorStop(1, '#243B55');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const r = ctx.createRadialGradient(W / 2, H / 2, W * 0.32, W / 2, H / 2, W * 0.8);
  r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, 'rgba(0,0,0,0.8)');
  ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,215,0,0.5)'; ctx.lineWidth = 20; ctx.strokeRect(0, 0, W, H);

  await document.fonts.load('bold 80px "Playfair Display"').catch(() => undefined);
  ctx.fillStyle = '#FFD700';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'black'; ctx.shadowBlur = 15; ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 5;
  let size = 84;
  const words = title.toUpperCase().split(/\s+/);
  let lines: string[] = [];
  for (; size >= 40; size -= 6) {
    ctx.font = `bold ${size}px "Playfair Display", Georgia, serif`;
    lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > W - 200 && line) { lines.push(line); line = w; } else line = test;
    }
    lines.push(line);
    if (lines.length <= 3) break;
  }
  const lh = size * 1.2;
  lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, W / 2, H / 2 + (i - (Math.min(lines.length, 3) - 1) / 2) * lh));
  return new Promise((res) => c.toBlob((b) => res(b!), 'image/png'));
}

export default function Videos() {
  const [rows, setRows] = useState<Video[] | null>(null);
  const [editing, setEditing] = useState<Video | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('tutorial_videos').select('*').order('created_at', { ascending: false });
    setRows((data as Video[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function remove(v: Video) {
    const ok = await attempt(() => supabase.from('tutorial_videos').delete().eq('id', v.id), 'Video deleted');
    if (!ok) return;
    // Clean up files we host; external URLs are left alone.
    const paths = [v.video_url, v.thumbnail_url].filter((u): u is string => !!u && u.startsWith(PUBLIC_PREFIX))
      .map((u) => decodeURIComponent(u.slice(PUBLIC_PREFIX.length)));
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
    load();
  }

  return (
    <>
      <PageHeader title="Tutorial videos" description="Videos shown in the app's Tutorials section." />
      <UploadForm onUploaded={load} />
      <Panel title={rows ? `${rows.length} videos` : 'Videos'}>
        {!rows ? <Loading /> : rows.length === 0 ? <Empty>No videos yet.</Empty> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((v) => (
              <div key={v.id} className="overflow-hidden rounded-lg border border-slate-200">
                <a href={v.video_url ?? '#'} target="_blank" rel="noreferrer" className="relative block aspect-video bg-slate-100">
                  {v.thumbnail_url
                    ? <img src={v.thumbnail_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    : <div className="flex h-full items-center justify-center"><Film className="h-8 w-8 text-slate-300" /></div>}
                  <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">{fmtDuration(v.duration_seconds)}</span>
                </a>
                <div className="p-3">
                  <div className="line-clamp-2 font-medium text-slate-900">{v.title}</div>
                  {v.description && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{v.description}</p>}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-400">{fmtDate(v.created_at, false)}</span>
                    <div className="flex">
                      <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => setEditing(v)}><Pencil className="h-4 w-4 text-slate-400" /></Button>
                      <Confirm
                        trigger={<Button variant="ghost" size="icon" aria-label="Delete"><Trash2 className="h-4 w-4 text-slate-400" /></Button>}
                        title={`Delete "${v.title}"?`} description="Removes it from the app and deletes the video file." confirmLabel="Delete" destructive
                        onConfirm={() => remove(v)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
      <EditDialog video={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
    </>
  );
}

function UploadForm({ onUploaded }: { onUploaded: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [transcription, setTranscription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [thumb, setThumb] = useState<Blob | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!thumb) { setThumbUrl(null); return; }
    const u = URL.createObjectURL(thumb);
    setThumbUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [thumb]);

  async function pickVideo(f: File | undefined) {
    if (!f) return;
    if (f.size > MAX_VIDEO_MB * 1024 * 1024) { toast.error(`Video must be under ${MAX_VIDEO_MB} MB`); return; }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
    const { duration, frame } = await inspectVideo(f);
    setDuration(duration);
    if (frame) setThumb(frame);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) return;
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) { toast.error('Session expired. Sign in again.'); return; }
    setProgress(0);
    try {
      const stamp = Date.now();
      const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
      const videoPath = `tutorial-videos/${stamp}.${ext}`;
      await uploadWithProgress(videoPath, file, token, setProgress);
      let thumbnail_url: string | null = null;
      if (thumb) {
        const tPath = `tutorial-thumbnails/${stamp}.${thumb.type === 'image/png' ? 'png' : 'jpg'}`;
        const { error } = await supabase.storage.from(BUCKET).upload(tPath, thumb, { contentType: thumb.type });
        if (error) throw error;
        thumbnail_url = supabase.storage.from(BUCKET).getPublicUrl(tPath).data.publicUrl;
      }
      const { error } = await supabase.from('tutorial_videos').insert({
        title: title.trim(), description: description.trim() || null, transcription: transcription.trim() || null,
        video_url: supabase.storage.from(BUCKET).getPublicUrl(videoPath).data.publicUrl,
        thumbnail_url, duration_seconds: Math.round(duration),
      });
      if (error) throw error;
      toast.success('Video published');
      setTitle(''); setDescription(''); setTranscription(''); setFile(null); setThumb(null); setDuration(0);
      if (videoInput.current) videoInput.current.value = '';
      onUploaded();
    } catch (err) {
      toast.error(friendlyError(err instanceof Error ? err.message : String(err)));
    } finally {
      setProgress(null);
    }
  }

  const busy = progress !== null;

  return (
    <Panel title="Upload a video" className="mb-6">
      <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 p-4 hover:bg-slate-50">
            <Upload className="h-5 w-5 text-slate-400" />
            <div className="min-w-0 text-sm">
              <div className="truncate font-medium text-slate-900">{file ? file.name : 'Choose a video file'}</div>
              <div className="text-xs text-slate-500">
                {file ? `${(file.size / 1048576).toFixed(1)} MB · ${fmtDuration(duration)}` : `MP4, MOV, WebM or MKV, up to ${MAX_VIDEO_MB} MB`}
              </div>
            </div>
            <input ref={videoInput} type="file" accept="video/mp4,video/quicktime,video/webm,video/x-matroska,video/x-msvideo"
              className="hidden" disabled={busy} onChange={(e) => pickVideo(e.target.files?.[0])} />
          </label>
          <div className="space-y-1.5"><Label>Title</Label><Input value={title} disabled={busy} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea rows={2} value={description} disabled={busy} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Transcription <span className="font-normal text-slate-400">(optional)</span></Label>
            <Textarea rows={3} value={transcription} disabled={busy} onChange={(e) => setTranscription(e.target.value)} /></div>
        </div>

        <div className="space-y-3">
          <Label>Thumbnail</Label>
          <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            {thumbUrl ? <img src={thumbUrl} alt="" className="h-full w-full object-cover" /> : <span className="text-xs text-slate-400">Picked from the video automatically</span>}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" className="flex-1" disabled={busy || !title.trim()}
              onClick={async () => setThumb(await titleCard(title.trim()))}>
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Title card
            </Button>
            <label className="inline-flex flex-1 cursor-pointer items-center justify-center rounded-md border border-slate-200 px-3 text-sm hover:bg-slate-50">
              <ImagePlus className="mr-1.5 h-3.5 w-3.5" /> Upload
              <input type="file" accept="image/jpeg,image/png" className="hidden" disabled={busy}
                onChange={(e) => e.target.files?.[0] && setThumb(e.target.files[0])} />
            </label>
          </div>
          <div className="pt-2">
            {busy ? (
              <div className="space-y-1.5">
                <Progress value={(progress ?? 0) * 100} />
                <p className="text-center text-xs text-slate-500">{progress! >= 1 ? 'Finishing…' : `Uploading ${Math.round(progress! * 100)}%`}</p>
              </div>
            ) : (
              <Button type="submit" className="w-full bg-slate-900 text-white hover:bg-slate-800" disabled={!file || !title.trim()}>
                Publish video
              </Button>
            )}
          </div>
        </div>
      </form>
    </Panel>
  );
}

function EditDialog({ video, onClose, onSaved }: { video: Video | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [transcription, setTranscription] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (video) { setTitle(video.title); setDescription(video.description ?? ''); setTranscription(video.transcription ?? ''); }
  }, [video]);

  async function save() {
    if (!video) return;
    setSaving(true);
    const ok = await attempt(() => supabase.from('tutorial_videos').update({
      title: title.trim(), description: description.trim() || null, transcription: transcription.trim() || null,
    }).eq('id', video.id), 'Saved');
    setSaving(false);
    if (ok) onSaved();
  }

  return (
    <Dialog open={!!video} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Edit video</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Transcription</Label><Textarea rows={5} value={transcription} onChange={(e) => setTranscription(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving || !title.trim()} className="bg-slate-900 text-white hover:bg-slate-800">
            {saving && <Spinner className="mr-2" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
