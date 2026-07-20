'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Copy, Trash2, ImageOff, Search, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { listPosts, fetchCounts, listCategories, type PostListItem } from '../api/posts';
import { deletePost } from '../api/savePost';

type StateFilter = 'all' | 'published' | 'draft';
const PAGE_SIZE = 25;

export function ArticlesScreen({ onEdit }: { onEdit: (id: string | null) => void }) {
  const { token } = useAuth();

  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [cat, setCat] = useState('');
  const [state, setState] = useState<StateFilter>('all');
  const [noCover, setNoCover] = useState(false);
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<PostListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [counts, setCounts] = useState({ all: 0, published: 0, draft: 0, noCover: 0 });
  const [cats, setCats] = useState<{ slug: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<PostListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reload, setReload] = useState(0);

  const doDelete = async () => {
    if (!token || !confirmDelete) return;
    setDeleting(true);
    try {
      await deletePost(token, confirmDelete.documentId);
      setConfirmDelete(null);
      setReload(n => n + 1);
      fetchCounts(token).then(setCounts).catch(() => {});
    } catch (e: any) {
      setError(e?.message || 'Mazanie zlyhalo.');
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  // Hľadanie sa nespúšťa pri každom písmene.
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(q); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!token) return;
    Promise.all([fetchCounts(token), listCategories(token)])
      .then(([c, cs]) => { setCounts(c); setCats(cs); })
      .catch(() => { /* počty sú doplnkové, nezhadzujú obrazovku */ });
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    listPosts({ token, page, pageSize: PAGE_SIZE, q: debouncedQ, categorySlug: cat, state, noCover })
      .then(r => {
        if (cancelled) return;
        setRows(r.items); setTotal(r.total); setPageCount(r.pageCount);
      })
      .catch(e => { if (!cancelled) setError(e?.message || 'Načítanie zlyhalo.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, page, debouncedQ, cat, state, noCover, reload]);

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setPage(1); };
  const pages = useMemo(() => {
    const out: (number | '…')[] = [];
    for (let i = 1; i <= pageCount; i++) {
      if (i <= 2 || i > pageCount - 2 || Math.abs(i - page) <= 1) out.push(i);
      else if (out[out.length - 1] !== '…') out.push('…');
    }
    return out;
  }, [pageCount, page]);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Články</h1>
          <p style={{ fontSize: 13.5, color: 'var(--ad-secondary)', margin: '6px 0 0' }}>
            {counts.all} článkov · {counts.published} publikovaných · {counts.draft} konceptov
          </p>
        </div>
        <div style={{ flex: 1 }} />
        <button className="abtn abtn-primary" onClick={() => onEdit(null)}>
          <Plus className="w-4 h-4" /> Nový článok
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 220 }}>
          <Search className="w-4 h-4" style={{ position: 'absolute', left: 11, top: 11, color: 'var(--ad-muted)' }} />
          <input className="afld" value={q} onChange={e => setQ(e.target.value)}
                 placeholder="Hľadať v názve a excerpte…" style={{ paddingLeft: 34 }} />
        </div>
        <select className="afld" value={cat} onChange={e => resetPage(setCat)(e.target.value)} style={{ width: 'auto', minWidth: 190 }}>
          <option value="">Všetky kategórie</option>
          {cats.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <select className="afld" value={state} onChange={e => resetPage(setState)(e.target.value as StateFilter)} style={{ width: 'auto' }}>
          <option value="all">Všetky stavy</option>
          <option value="published">Publikované</option>
          <option value="draft">Koncepty</option>
        </select>
        <button className="abtn" onClick={() => resetPage(setNoCover)(!noCover)}
                style={noCover ? { borderColor: 'var(--ad-amber)', background: '#f6ead0' } : undefined}>
          <ImageOff className="w-4 h-4" /> Bez coveru
          <span className="ad-badge">{counts.noCover}</span>
        </button>
      </div>

      {error && (
        <div className="acard" style={{ padding: '12px 16px', marginBottom: 14, display: 'flex', gap: 10, background: '#fbeae8', borderColor: '#e8c4bf' }}>
          <AlertCircle className="w-4 h-4" style={{ color: 'var(--ad-danger)', flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13.5, color: 'var(--ad-danger)' }}>{error}</div>
        </div>
      )}

      <div className="acard" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="atable">
            <thead>
              <tr>
                <th style={{ width: 60 }}></th>
                <th>Názov</th>
                <th>Kategória</th>
                <th>Autor</th>
                <th>Dátum</th>
                <th>Stav</th>
                <th style={{ width: 116 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 44, color: 'var(--ad-secondary)' }}>
                  <Loader2 className="w-5 h-5 animate-spin" style={{ display: 'inline' }} /> Načítavam…
                </td></tr>
              )}

              {!loading && rows.map(a => (
                <tr key={a.documentId}>
                  <td>
                    <div style={{ width: 44, height: 32, borderRadius: 6, background: '#efe6d0', border: '1px solid var(--ad-line)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {a.coverThumbUrl
                        ? <img src={a.coverThumbUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                        : <ImageOff className="w-3.5 h-3.5" style={{ color: 'var(--ad-muted)' }} />}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--ad-muted)' }}>/{a.slug}</div>
                  </td>
                  <td>{a.categoryName ? <span className="achip achip-cat">{a.categoryName}</span>
                                      : <span style={{ fontSize: 12, color: 'var(--ad-muted)' }}>—</span>}</td>
                  <td style={{ color: 'var(--ad-secondary)' }}>{a.authorName || '—'}</td>
                  <td style={{ color: 'var(--ad-secondary)', whiteSpace: 'nowrap' }}>
                    {a.originalPublishedDate ? new Date(a.originalPublishedDate).toLocaleDateString('sk-SK') : '—'}
                  </td>
                  <td>
                    <span className={`achip ${a.published ? 'achip-pub' : 'achip-draft'}`}>
                      <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor' }} />
                      {a.published ? 'Publikovaný' : 'Koncept'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                      <button className="abtn abtn-icon" title="Upraviť" onClick={() => onEdit(a.documentId)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button className="abtn abtn-icon" title="Duplikovať"><Copy className="w-3.5 h-3.5" /></button>
                      <button className="abtn abtn-icon abtn-danger" title="Zmazať" onClick={() => setConfirmDelete(a)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && rows.length === 0 && !error && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 44, color: 'var(--ad-secondary)' }}>
                  Žiadny článok nezodpovedá filtrom.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderTop: '1px solid var(--ad-line)', background: 'var(--ad-surface)' }}>
          <span style={{ fontSize: 13, color: 'var(--ad-secondary)' }}>
            strana {page} z {pageCount} · {total} článkov
          </span>
          <div style={{ flex: 1 }} />
          <button className="abtn abtn-icon" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
          {pages.map((p, i) => p === '…'
            ? <span key={`e${i}`} style={{ color: 'var(--ad-muted)', padding: '0 4px' }}>…</span>
            : <button key={p} className="abtn abtn-icon" onClick={() => setPage(p)}
                      style={p === page ? { borderColor: 'var(--ad-amber)', background: '#f6ead0' } : undefined}>{p}</button>
          )}
          <button className="abtn abtn-icon" disabled={page >= pageCount} onClick={() => setPage(p => p + 1)}>›</button>
        </div>
      </div>

      {confirmDelete && (
        <div onClick={() => setConfirmDelete(null)}
             style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(30,22,12,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="acard" onClick={e => e.stopPropagation()} style={{ width: 'min(440px, 92vw)', padding: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 10px' }}>Zmazať článok?</h2>
            <p style={{ fontSize: 14, color: 'var(--ad-secondary)', lineHeight: 1.6, margin: '0 0 20px' }}>
              Článok <strong style={{ color: 'var(--ad-text)' }}>{confirmDelete.title}</strong> sa zmaže natrvalo
              aj s komentármi. Túto akciu nie je možné vrátiť.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="abtn" onClick={() => setConfirmDelete(null)}>Zrušiť</button>
              <button className="abtn" onClick={doDelete} disabled={deleting}
                      style={{ background: 'var(--ad-danger)', color: '#fff', borderColor: 'var(--ad-danger)' }}>
                {deleting ? 'Mažem…' : 'Zmazať natrvalo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
