'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Upload, X, Loader2, Check } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { listFiles, uploadFiles, fileUrl, PAGE, type MediaFile } from '../api/media';

/**
 * Dialóg na výber obrázka z knižnice alebo nahranie nového.
 * Zdieľa ho cover panel aj obrázkový blok.
 *
 * Načítava po dávkach (`start`/`limit`) — knižnica má 5 424 položiek a jeden
 * neobmedzený dotaz váži 7,4 MB.
 */
export function MediaPicker({
  onPick, onClose, multiple = false,
}: {
  onPick: (files: MediaFile[]) => void;
  onClose: () => void;
  multiple?: boolean;
}) {
  const { token } = useAuth();
  const [items, setItems] = useState<MediaFile[]>([]);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<MediaFile[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async (start: number, reset: boolean) => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const batch = await listFiles({ token, start, limit: PAGE, q: debouncedQ });
      setItems(prev => (reset ? batch : [...prev, ...batch]));
      setMore(batch.length === PAGE);
    } catch (e: any) {
      setError(e?.message || 'Knižnicu sa nepodarilo načítať.');
    } finally {
      setLoading(false);
    }
  }, [token, debouncedQ]);

  useEffect(() => { load(0, true); }, [load]);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length || !token) return;
    setUploading(true);
    setError('');
    try {
      const up = await uploadFiles(token, Array.from(list));
      setItems(prev => [...up, ...prev]);
      if (!multiple && up[0]) { onPick([up[0]]); onClose(); }
    } catch (e: any) {
      setError(e?.message || 'Nahranie zlyhalo.');
    } finally {
      setUploading(false);
    }
  };

  const toggle = (f: MediaFile) => {
    if (!multiple) { onPick([f]); onClose(); return; }
    setSelected(s => s.some(x => x.id === f.id) ? s.filter(x => x.id !== f.id) : [...s, f]);
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(30,22,12,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div
        className="acard admin"
        onClick={e => e.stopPropagation()}
        style={{ width: 'min(980px, 96vw)', height: 'min(680px, 90vh)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {/* Hlavička */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderBottom: '1px solid var(--ad-line)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Knižnica médií</h2>
          <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
            <Search className="w-4 h-4" style={{ position: 'absolute', left: 10, top: 10, color: 'var(--ad-muted)' }} />
            <input className="afld" value={q} onChange={e => setQ(e.target.value)}
                   placeholder="Hľadať podľa názvu…" style={{ paddingLeft: 32, padding: '8px 12px 8px 32px' }} />
          </div>
          <div style={{ flex: 1 }} />
          <button className="abtn" onClick={() => fileInput.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Nahrávam…' : 'Nahrať'}
          </button>
          <input ref={fileInput} type="file" accept="image/*" multiple={multiple} hidden
                 onChange={e => onFiles(e.target.files)} />
          <button className="abtn abtn-icon" onClick={onClose} aria-label="Zavrieť"><X className="w-4 h-4" /></button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: '#fbeae8', color: 'var(--ad-danger)', fontSize: 13 }}>{error}</div>
        )}

        {/* Mriežka */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))', gap: 12 }}>
            {items.map(f => {
              const on = selected.some(x => x.id === f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => toggle(f)}
                  style={{
                    position: 'relative', padding: 0, cursor: 'pointer', textAlign: 'left',
                    background: 'var(--ad-surface)', borderRadius: 9, overflow: 'hidden',
                    border: `2px solid ${on ? 'var(--ad-amber)' : 'var(--ad-line)'}`,
                  }}
                >
                  <div style={{ aspectRatio: '4 / 3', background: '#efe6d0' }}>
                    <img src={fileUrl(f, 'thumbnail')} alt="" loading="lazy"
                         style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                  {on && (
                    <span style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 999, background: 'var(--ad-amber)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                  <div style={{ padding: '6px 8px' }}>
                    <div style={{ fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--ad-muted)' }}>
                      {f.width}×{f.height} · {Math.round(f.size)} KB
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--ad-secondary)' }}>
              <Loader2 className="w-5 h-5 animate-spin" style={{ display: 'inline' }} /> Načítavam…
            </div>
          )}
          {!loading && items.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--ad-secondary)' }}>
              Nič sa nenašlo.
            </div>
          )}
          {!loading && more && items.length > 0 && (
            <div style={{ textAlign: 'center', paddingTop: 16 }}>
              <button className="abtn" onClick={() => load(items.length, false)}>Načítať ďalšie</button>
            </div>
          )}
        </div>

        {/* Pätka pri viacnásobnom výbere */}
        {multiple && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderTop: '1px solid var(--ad-line)', background: 'var(--ad-surface)' }}>
            <span style={{ fontSize: 13, color: 'var(--ad-secondary)' }}>vybraných: {selected.length}</span>
            <div style={{ flex: 1 }} />
            <button className="abtn" onClick={onClose}>Zrušiť</button>
            <button className="abtn abtn-primary" disabled={!selected.length}
                    onClick={() => { onPick(selected); onClose(); }}>
              Použiť výber
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
