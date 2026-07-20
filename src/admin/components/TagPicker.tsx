'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { listTags, findOrCreateTag, type Tag } from '../api/tags';

/**
 * Výber štítkov. Napovedá existujúce, a keď zadaný názov neexistuje,
 * ponúkne ho vytvoriť (rola Authenticated má na blog-tag `create`).
 */
export function TagPicker({
  value, onChange,
}: { value: Tag[]; onChange: (next: Tag[]) => void }) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [options, setOptions] = useState<Tag[]>([]);
  const [busy, setBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token || !open) return;
    const t = setTimeout(() => {
      listTags(token, q).then(setOptions).catch(() => setOptions([]));
    }, 250);
    return () => clearTimeout(t);
  }, [token, q, open]);

  // Zavretie kliknutím mimo.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const add = (t: Tag) => {
    if (!value.some(v => v.documentId === t.documentId)) onChange([...value, t]);
    setQ('');
    setOpen(false);
  };

  const create = async () => {
    if (!token || !q.trim()) return;
    setBusy(true);
    try {
      add(await findOrCreateTag(token, q));
    } catch { /* chybu ukáže uloženie článku */ }
    finally { setBusy(false); }
  };

  const exact = options.some(o => o.name.toLowerCase() === q.trim().toLowerCase());
  const notPicked = options.filter(o => !value.some(v => v.documentId === o.documentId));

  return (
    <div style={{ position: 'relative' }} ref={boxRef}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {value.map(t => (
          <span key={t.documentId} className="achip achip-cat">
            {t.name}
            <button
              onClick={() => onChange(value.filter(v => v.documentId !== t.documentId))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
              aria-label={`Odstrániť ${t.name}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <button className="abtn" style={{ padding: '3px 10px', fontSize: 12 }} onClick={() => setOpen(o => !o)}>
          + pridať…
        </button>
      </div>

      {open && (
        <div
          className="acard"
          style={{ position: 'absolute', zIndex: 40, top: '100%', left: 0, right: 0, marginTop: 6, padding: 8, boxShadow: '0 12px 30px -14px rgba(60,40,15,.4)' }}
        >
          <input
            className="afld" autoFocus value={q} onChange={e => setQ(e.target.value)}
            placeholder="Hľadať alebo napísať nový…"
            onKeyDown={e => { if (e.key === 'Enter' && q.trim() && !exact) { e.preventDefault(); create(); } }}
            style={{ marginBottom: 6, padding: '7px 10px', fontSize: 13 }}
          />
          <div style={{ maxHeight: 190, overflowY: 'auto' }}>
            {notPicked.map(o => (
              <button
                key={o.documentId} onClick={() => add(o)}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, borderRadius: 6 }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--ad-surface)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {o.name}
              </button>
            ))}
            {!notPicked.length && !q.trim() && (
              <div style={{ padding: 8, fontSize: 12.5, color: 'var(--ad-muted)' }}>Začnite písať…</div>
            )}
          </div>

          {q.trim() && !exact && (
            <button
              className="abtn" onClick={create} disabled={busy}
              style={{ width: '100%', justifyContent: 'center', marginTop: 6, fontSize: 13 }}
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Vytvoriť „{q.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
