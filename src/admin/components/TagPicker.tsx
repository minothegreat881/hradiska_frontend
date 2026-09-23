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
  const inputRef = useRef<HTMLInputElement>(null);

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

  /* Po pridaní sa ponuka NEZATVÁRA a pole sa len vyprázdni — štítky sa
     zvyknú písať viaceré za sebou a zakaždým znova otvárať ponuku bolo
     zdĺhavé. Zatvorí ju kliknutie mimo, Escape alebo tlačidlo „+ pridať…". */
  const add = (t: Tag) => {
    if (!value.some(v => v.documentId === t.documentId)) onChange([...value, t]);
    setQ('');
    inputRef.current?.focus();
  };

  const create = async (name: string) => {
    if (!token || !name.trim()) return;
    setBusy(true);
    try {
      add(await findOrCreateTag(token, name));
    } catch { /* chybu ukáže uloženie článku */ }
    finally { setBusy(false); }
  };

  /* Enter musí štítok pridať VŽDY, nielen keď je názov nový.
     Predtým platilo `if (… && !exact)`, takže po napísaní názvu, ktorý už
     existuje, Enter neurobil nič a štítok sa dal pridať len myšou zo zoznamu.
     Teraz: zhodný názov sa pridá zo zoznamu, nový sa vytvorí.
     Ak zoznam ešte nedobehol (napovedanie je oneskorené o 250 ms), rozhodne
     `findOrCreateTag` na serveri — ten existujúci štítok nájde, nezdvojí ho. */
  const commit = async () => {
    const name = q.trim();
    if (!name || busy) return;
    const hit = options.find(o => o.name.toLowerCase() === name.toLowerCase());
    if (hit) { add(hit); return; }
    await create(name);
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
            ref={inputRef}
            className="afld" autoFocus value={q} onChange={e => setQ(e.target.value)}
            placeholder="Napíšte štítok a stlačte Enter…"
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); commit(); }
              if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
              // Backspace v prázdnom poli odoberie posledný pridaný štítok.
              if (e.key === 'Backspace' && !q && value.length) onChange(value.slice(0, -1));
            }}
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
              className="abtn" onClick={() => commit()} disabled={busy}
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
