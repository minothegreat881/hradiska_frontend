'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Upload, Loader2, Trash2, AlertCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { listFiles, uploadFiles, deleteFile, fileUrl, PAGE, type MediaFile } from '../api/media';

export function MediaScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<MediaFile[]>([]);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState<MediaFile | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async (start: number, reset: boolean) => {
    if (!token) return;
    setLoading(true); setError('');
    try {
      const batch = await listFiles({ token, start, limit: PAGE, q: debouncedQ });
      setItems(prev => (reset ? batch : [...prev, ...batch]));
      setMore(batch.length === PAGE);
    } catch (e: any) {
      setError(e?.message || 'Knižnicu sa nepodarilo načítať.');
    } finally { setLoading(false); }
  }, [token, debouncedQ]);

  useEffect(() => { load(0, true); }, [load]);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length || !token) return;
    setUploading(true); setError('');
    try {
      const up = await uploadFiles(token, Array.from(list));
      setItems(prev => [...up, ...prev]);
    } catch (e: any) { setError(e?.message || 'Nahranie zlyhalo.'); }
    finally { setUploading(false); }
  };

  const doDelete = async () => {
    if (!token || !confirm) return;
    try {
      await deleteFile(token, confirm.id);
      setItems(prev => prev.filter(f => f.id !== confirm.id));
    } catch (e: any) { setError(e?.message || 'Mazanie zlyhalo.'); }
    finally { setConfirm(null); }
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Médiá</h1>
          <p style={{ fontSize: 13.5, color: 'var(--ad-secondary)', margin: '6px 0 0' }}>
            Načítava sa po dávkach — knižnica má cez 5 400 položiek
          </p>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative', minWidth: 240 }}>
          <Search className="w-4 h-4" style={{ position: 'absolute', left: 11, top: 11, color: 'var(--ad-muted)' }} />
          <input className="afld" value={q} onChange={e => setQ(e.target.value)}
                 placeholder="Hľadať podľa názvu…" style={{ paddingLeft: 34 }} />
        </div>
        <button className="abtn abtn-primary" onClick={() => fileInput.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Nahrávam…' : 'Nahrať'}
        </button>
        <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={e => onFiles(e.target.files)} />
      </div>

      {error && (
        <div className="acard" style={{ padding: '12px 16px', marginBottom: 14, display: 'flex', gap: 10, background: '#fbeae8', borderColor: '#e8c4bf' }}>
          <AlertCircle className="w-4 h-4" style={{ color: 'var(--ad-danger)', flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13.5, color: 'var(--ad-danger)' }}>{error}</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(158px, 1fr))', gap: 14 }}>
        {items.map(f => (
          <div key={f.id} className="acard" style={{ overflow: 'hidden', position: 'relative' }}>
            <div style={{ aspectRatio: '4 / 3', background: '#efe6d0' }}>
              <img src={fileUrl(f, 'thumbnail')} alt="" loading="lazy"
                   style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            <div style={{ padding: '8px 10px' }}>
              <div style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ad-muted)', marginTop: 2 }}>
                {f.width}×{f.height} · {Math.round(f.size)} KB
              </div>
            </div>
            <button className="abtn abtn-icon abtn-danger" onClick={() => setConfirm(f)}
                    title="Zmazať" style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(253,251,244,.92)' }}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 28, color: 'var(--ad-secondary)' }}>
          <Loader2 className="w-5 h-5 animate-spin" style={{ display: 'inline' }} /> Načítavam…
        </div>
      )}
      {!loading && more && items.length > 0 && (
        <div style={{ textAlign: 'center', paddingTop: 18 }}>
          <button className="abtn" onClick={() => load(items.length, false)}>Načítať ďalšie</button>
        </div>
      )}
      {!loading && items.length === 0 && (
        <div className="acard" style={{ padding: 40, textAlign: 'center', color: 'var(--ad-secondary)' }}>
          Nič sa nenašlo.
        </div>
      )}

      {confirm && (
        <div onClick={() => setConfirm(null)}
             style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(30,22,12,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="acard" onClick={e => e.stopPropagation()} style={{ width: 'min(440px,92vw)', padding: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 10px' }}>Zmazať obrázok?</h2>
            <p style={{ fontSize: 14, color: 'var(--ad-secondary)', lineHeight: 1.6, margin: '0 0 20px' }}>
              Súbor <strong style={{ color: 'var(--ad-text)' }}>{confirm.name}</strong> sa zmaže natrvalo.
              Ak ho používa nejaký článok, obrázok tam prestane fungovať.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="abtn" onClick={() => setConfirm(null)}>Zrušiť</button>
              <button className="abtn" onClick={doDelete}
                      style={{ background: 'var(--ad-danger)', color: '#fff', borderColor: 'var(--ad-danger)' }}>
                Zmazať natrvalo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
