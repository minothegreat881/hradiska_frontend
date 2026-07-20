'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Eye, EyeOff, Ban, Trash2, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';
import {
  listComments, commentCounts, setCommentStatus, deleteComment,
  type AdminComment, type CommentStatus,
} from '../api/comments';

const PAGE = 30;

const STATUS_CHIP: Record<CommentStatus, { label: string; cls: string }> = {
  visible: { label: 'Zobrazený', cls: 'achip-pub' },
  hidden: { label: 'Skrytý', cls: 'achip-draft' },
  spam: { label: 'Spam', cls: 'achip-draft' },
};

export function CommentsScreen() {
  const { token } = useAuth();
  const [status, setStatus] = useState<CommentStatus | 'all'>('all');
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<AdminComment[]>([]);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [counts, setCounts] = useState({ all: 0, visible: 0, hidden: 0, spam: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDel, setConfirmDel] = useState<AdminComment | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => { const t = setTimeout(() => { setDq(q); setPage(1); }, 350); return () => clearTimeout(t); }, [q]);

  useEffect(() => {
    if (!token) return;
    commentCounts(token).then(setCounts).catch(() => {});
  }, [token, reload]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true); setError('');
    listComments({ token, page, pageSize: PAGE, status, q: dq })
      .then(r => { if (!cancelled) { setRows(r.items); setTotal(r.total); setPageCount(r.pageCount); } })
      .catch(e => { if (!cancelled) setError(e?.message || 'Načítanie zlyhalo.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, page, status, dq, reload]);

  const act = async (c: AdminComment, next: CommentStatus) => {
    if (!token) return;
    // optimisticky
    setRows(rs => rs.map(x => x.documentId === c.documentId ? { ...x, status: next } : x));
    try { await setCommentStatus(token, c.documentId, next); setReload(n => n + 1); }
    catch { setRows(rs => rs.map(x => x.documentId === c.documentId ? { ...x, status: c.status } : x)); }
  };

  const doDelete = async () => {
    if (!token || !confirmDel) return;
    try { await deleteComment(token, confirmDel.documentId); setConfirmDel(null); setReload(n => n + 1); }
    catch (e: any) { setError(e?.message || 'Mazanie zlyhalo.'); setConfirmDel(null); }
  };

  const chips: { id: CommentStatus | 'all'; label: string; n: number }[] = useMemo(() => [
    { id: 'all', label: 'Všetky', n: counts.all },
    { id: 'visible', label: 'Zobrazené', n: counts.visible },
    { id: 'hidden', label: 'Skryté', n: counts.hidden },
    { id: 'spam', label: 'Spam', n: counts.spam },
  ], [counts]);

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Komentáre</h1>
        <p style={{ fontSize: 13.5, color: 'var(--ad-secondary)', margin: '6px 0 0' }}>
          {counts.all} spolu · {counts.visible} zobrazených · {counts.hidden} skrytých · {counts.spam} spam
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {chips.map(c => (
          <button key={c.id} className="abtn" onClick={() => { setStatus(c.id); setPage(1); }}
                  style={status === c.id ? { borderColor: 'var(--ad-amber)', background: '#f6ead0' } : undefined}>
            {c.label} <span className="ad-badge">{c.n}</span>
          </button>
        ))}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 200 }}>
          <Search className="w-4 h-4" style={{ position: 'absolute', left: 11, top: 11, color: 'var(--ad-muted)' }} />
          <input className="afld" value={q} onChange={e => setQ(e.target.value)}
                 placeholder="Hľadať v texte…" style={{ paddingLeft: 34 }} />
        </div>
      </div>

      {error && (
        <div className="acard" style={{ padding: '12px 16px', marginBottom: 14, display: 'flex', gap: 10, background: '#fbeae8', borderColor: '#e8c4bf' }}>
          <AlertCircle className="w-4 h-4" style={{ color: 'var(--ad-danger)', flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13.5, color: 'var(--ad-danger)' }}>{error}</div>
        </div>
      )}

      <div className="acard" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 44, color: 'var(--ad-secondary)' }}>
            <Loader2 className="w-5 h-5 animate-spin" style={{ display: 'inline' }} /> Načítavam…
          </div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 44, color: 'var(--ad-secondary)' }}>Žiadne komentáre.</div>
        ) : rows.map(c => (
          <div key={c.documentId} style={{ padding: '14px 16px', borderBottom: '1px solid var(--ad-line)', display: 'flex', gap: 14 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 13.5 }}>{c.authorName}</strong>
                <span className={`achip ${STATUS_CHIP[c.status].cls}`}>{STATUS_CHIP[c.status].label}</span>
                {c.sourceBlogger && <span style={{ fontSize: 11, color: 'var(--ad-muted)' }}>z Bloggeru</span>}
                <span style={{ fontSize: 12, color: 'var(--ad-muted)' }}>· {c.likes} ♥</span>
                <span style={{ fontSize: 12, color: 'var(--ad-muted)' }}>
                  · {new Date(c.originalDate || c.createdAt).toLocaleDateString('sk-SK')}
                </span>
              </div>
              <div style={{ fontSize: 14, color: 'var(--ad-text)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {c.content}
              </div>
              {c.postTitle && (
                <div style={{ fontSize: 12, color: 'var(--ad-muted)', marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <ExternalLink className="w-3 h-3" /> {c.postTitle}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 5, flexShrink: 0, alignItems: 'flex-start' }}>
              {c.status !== 'visible' && (
                <button className="abtn abtn-icon" title="Zobraziť" onClick={() => act(c, 'visible')}><Eye className="w-3.5 h-3.5" /></button>
              )}
              {c.status !== 'hidden' && (
                <button className="abtn abtn-icon" title="Skryť" onClick={() => act(c, 'hidden')}><EyeOff className="w-3.5 h-3.5" /></button>
              )}
              {c.status !== 'spam' && (
                <button className="abtn abtn-icon" title="Označiť ako spam" onClick={() => act(c, 'spam')}><Ban className="w-3.5 h-3.5" /></button>
              )}
              <button className="abtn abtn-icon abtn-danger" title="Zmazať" onClick={() => setConfirmDel(c)}><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}

        {!loading && rows.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'var(--ad-surface)' }}>
            <span style={{ fontSize: 13, color: 'var(--ad-secondary)' }}>strana {page} z {pageCount} · {total} komentárov</span>
            <div style={{ flex: 1 }} />
            <button className="abtn abtn-icon" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
            <button className="abtn abtn-icon" disabled={page >= pageCount} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
        )}
      </div>

      {confirmDel && (
        <div onClick={() => setConfirmDel(null)}
             style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(30,22,12,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="acard" onClick={e => e.stopPropagation()} style={{ width: 'min(440px,92vw)', padding: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 10px' }}>Zmazať komentár?</h2>
            <p style={{ fontSize: 14, color: 'var(--ad-secondary)', lineHeight: 1.6, margin: '0 0 20px' }}>
              Komentár od <strong style={{ color: 'var(--ad-text)' }}>{confirmDel.authorName}</strong> sa
              zmaže natrvalo. Zvážte radšej „skryť", ak si nie ste istí.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="abtn" onClick={() => setConfirmDel(null)}>Zrušiť</button>
              <button className="abtn" onClick={doDelete} style={{ background: 'var(--ad-danger)', color: '#fff', borderColor: 'var(--ad-danger)' }}>
                Zmazať natrvalo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
