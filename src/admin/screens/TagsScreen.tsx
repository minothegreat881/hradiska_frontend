'use client';

/**
 * Štítky.
 *
 * Predtým tu bol iba zástupný text. Štítky vznikajú pri písaní článku, nikto
 * ich nespravoval — vznikali dvojice, ktoré sa líšia len veľkosťou písmen
 * alebo diakritikou.
 *
 * Obrazovka vie: hľadať, filtrovať (nepoužité, s jedným článkom), premenovať
 * na mieste, hromadne vymazať a zlúčiť viac štítkov do jedného.
 */

import { useEffect, useMemo, useState } from 'react';
import { Search, Merge, Pencil, Loader2, Trash2, X, Check } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { listTags, updateTag, deleteTag, mergeTags, duplicatePairs, type Tag } from '../api/taxonomy';

type Filter = 'all' | 'unused' | 'single';

export function TagsScreen() {
  const { token } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [askDelete, setAskDelete] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try { setTags(await listTags(token)); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [token]);

  const dupes = useMemo(() => duplicatePairs(tags), [tags]);
  const counts = useMemo(() => ({
    all: tags.length,
    unused: tags.filter((t) => (t.posts ?? 0) === 0).length,
    single: tags.filter((t) => (t.posts ?? 0) === 1).length,
  }), [tags]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tags
      .filter((t) => (filter === 'all' ? true : filter === 'unused' ? (t.posts ?? 0) === 0 : (t.posts ?? 0) === 1))
      .filter((t) => !q || t.name.toLowerCase().includes(q) || t.slug.includes(q))
      .sort((a, b) => (b.posts ?? 0) - (a.posts ?? 0) || a.name.localeCompare(b.name, 'sk'));
  }, [tags, query, filter]);

  const maxPosts = Math.max(1, ...tags.map((t) => t.posts ?? 0));
  const picked = tags.filter((t) => selected.has(t.documentId));

  const toggle = (id: string) => setSelected((s) => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const rename = async (t: Tag) => {
    if (!token || !editValue.trim() || editValue === t.name) { setEditing(null); return; }
    setBusy(t.documentId);
    try {
      await updateTag(token, t.documentId, { name: editValue.trim() });
      setTags((prev) => prev.map((x) => (x.documentId === t.documentId ? { ...x, name: editValue.trim() } : x)));
      setMsg('Štítok premenovaný.');
    } catch (e: any) {
      setMsg(e?.message || 'Premenovanie zlyhalo.');
    } finally { setBusy(null); setEditing(null); }
  };

  const removeSelected = async () => {
    if (!token) return;
    setBusy('bulk');
    try {
      for (const t of picked) await deleteTag(token, t.documentId);
      setMsg(`Vymazaných ${picked.length}.`);
      setSelected(new Set());
      setAskDelete(false);
      await load();
    } catch (e: any) {
      setMsg(e?.message || 'Mazanie zlyhalo.');
    } finally { setBusy(null); }
  };

  const doMerge = async (targetId: string) => {
    if (!token) return;
    setBusy('bulk');
    try {
      const moved = await mergeTags(token, targetId, picked.map((t) => t.documentId));
      setMsg(`Zlúčené. Preradených článkov: ${moved}.`);
      setSelected(new Set());
      setMergeOpen(false);
      await load();
    } catch (e: any) {
      setMsg(e?.message || 'Zlúčenie zlyhalo.');
    } finally { setBusy(null); }
  };

  return (
    <div className="ad-page">
      <div className="ad-page-head">
        <div style={{ flex: 1 }}>
          <h1 className="ad-page-title">Štítky</h1>
          <div className="ad-page-sub">
            {loading ? 'Načítavam…' : `${tags.length} štítkov · vznikajú pri písaní článku`}
          </div>
        </div>
      </div>

      {msg && <div className="acard" role="status" style={{ padding: '10px 14px', fontSize: 13.5 }}>{msg}</div>}

      {dupes.length > 0 && (
        <div className="ad-notice">
          <Merge className="w-5 h-5" style={{ color: 'var(--ad-amber-deep)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <b>Podozrenie na duplikáty</b>
            <div className="ad-note">
              {dupes.slice(0, 3).map(([a, b]) => `„${a.name}" a „${b.name}"`).join(', ')}
              {dupes.length > 3 && ` a ďalšie…`} — líšia sa iba veľkosťou písmen alebo diakritikou.
            </div>
          </div>
          <button className="abtn" onClick={() => {
            setSelected(new Set(dupes.flat().map((t) => t.documentId)));
            setFilter('all'); setQuery('');
          }}>
            Označiť {dupes.length} {dupes.length === 1 ? 'pár' : dupes.length < 5 ? 'páry' : 'párov'}
          </button>
        </div>
      )}

      <div className="ad-toolbar">
        <div className="ad-search">
          <Search className="w-4 h-4" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Hľadať štítok…" />
          {query && <button onClick={() => setQuery('')} aria-label="Zrušiť hľadanie"><X className="w-3.5 h-3.5" /></button>}
        </div>
        <div className="ad-seg" role="group" aria-label="Filter štítkov">
          <button className={filter === 'all' ? 'is-on' : ''} onClick={() => setFilter('all')}>Všetky {counts.all}</button>
          <button className={filter === 'unused' ? 'is-on' : ''} onClick={() => setFilter('unused')}>Nepoužité {counts.unused}</button>
          <button className={filter === 'single' ? 'is-on' : ''} onClick={() => setFilter('single')}>S jedným článkom {counts.single}</button>
        </div>
      </div>

      <div className="acard">
        {loading && <div className="ad-empty-row"><Loader2 className="w-4 h-4 animate-spin" /> Načítavam štítky…</div>}
        {!loading && shown.length === 0 && <div className="ad-empty-row">Nič sa nenašlo.</div>}
        {!loading && shown.map((t) => (
          <div key={t.documentId} className={`ad-list-row ad-tag-row${selected.has(t.documentId) ? ' is-selected' : ''}`}>
            <input
              type="checkbox"
              checked={selected.has(t.documentId)}
              onChange={() => toggle(t.documentId)}
              aria-label={`Vybrať ${t.name}`}
            />
            {editing === t.documentId ? (
              <input
                className="afld" autoFocus value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') rename(t); if (e.key === 'Escape') setEditing(null); }}
                onBlur={() => rename(t)}
              />
            ) : (
              <span className="ad-tag-name">{t.name}</span>
            )}
            <span className="ad-tag-slug">/{t.slug}</span>
            <span className="ad-tag-bar">
              <span className="ad-bar"><i style={{ width: `${((t.posts ?? 0) / maxPosts) * 100}%` }} /></span>
              <span className="ad-tag-n">{t.posts ?? '—'}</span>
            </span>
            <button
              className="abtn abtn-icon" title="Premenovať" aria-label={`Premenovať ${t.name}`}
              onClick={() => { setEditing(t.documentId); setEditValue(t.name); }}
              disabled={busy === t.documentId}
            >
              {busy === t.documentId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pencil className="w-3.5 h-3.5" />}
            </button>
          </div>
        ))}
      </div>

      {selected.size > 0 && (
        <div className="ad-bulkbar">
          <span>{selected.size} vybrané</span>
          <button onClick={() => setMergeOpen(true)} disabled={selected.size < 2}>
            <Merge className="w-4 h-4" /> Zlúčiť do jedného
          </button>
          <button onClick={() => setAskDelete(true)}>
            <Trash2 className="w-4 h-4" /> Vymazať
          </button>
          <button onClick={() => setSelected(new Set())} aria-label="Zrušiť výber"><X className="w-4 h-4" /></button>
        </div>
      )}

      {mergeOpen && (
        <div className="ad-modal-wrap" onClick={() => setMergeOpen(false)}>
          <div className="acard ad-modal" onClick={(e) => e.stopPropagation()} style={{ width: 'min(460px, 92vw)' }}>
            <h2>Zlúčiť {picked.length} štítkov</h2>
            <p>Vyberte, ktorý názov ostane. Články z ostatných sa preradia pod neho a zvyšné štítky sa vymažú.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              {picked.map((t) => (
                <button key={t.documentId} className="ad-choice" onClick={() => doMerge(t.documentId)} disabled={busy === 'bulk'}>
                  <Check className="w-4 h-4" style={{ color: 'var(--ad-amber-deep)', flexShrink: 0 }} />
                  <span><b>{t.name}</b><i>{t.posts ?? 0} článkov · /{t.slug}</i></span>
                </button>
              ))}
            </div>
            <div><button className="abtn" onClick={() => setMergeOpen(false)}>Zrušiť</button></div>
          </div>
        </div>
      )}

      {askDelete && (
        <div className="ad-modal-wrap" onClick={() => setAskDelete(false)}>
          <div className="acard ad-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Vymazať {picked.length} {picked.length === 1 ? 'štítok' : 'štítkov'}?</h2>
            <p>
              Články sa nezmažú, len prídu o tieto štítky.
              {picked.some((t) => (t.posts ?? 0) > 0) && ' Niektoré sú pritom použité v článkoch.'}
            </p>
            <div>
              <button className="abtn" onClick={() => setAskDelete(false)}>Nechať</button>
              <button className="abtn abtn-danger" onClick={removeSelected} disabled={busy === 'bulk'}>
                {busy === 'bulk' && <Loader2 className="w-4 h-4 animate-spin" />} Vymazať
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
