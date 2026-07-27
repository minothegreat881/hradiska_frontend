'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Search, Eye, EyeOff, Ban, Trash2, ExternalLink, Loader2, AlertCircle,
  Check, X, Reply, AlertTriangle, ShieldOff, Send,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import {
  listComments, commentCounts, setCommentStatus, deleteComment, replyToComment, sendWarning,
  type AdminComment, type CommentStatus, type WarningTemplate,
} from '../api/comments';
import { blockUser } from '../api/users';

const PAGE = 30;

const STATUS_CHIP: Record<CommentStatus, { label: string; style: React.CSSProperties }> = {
  visible: { label: 'Schválený', style: { color: '#3d5c40', background: '#e4ecdc', border: '1px solid #c5d4b8' } },
  waiting: { label: 'Čaká', style: { color: '#8a5316', background: '#f6ead0', border: '1px solid #e0cb95' } },
  reported: { label: 'Nahlásený', style: { color: '#a04338', background: '#f6e3dc', border: '1px solid #dcb3a4' } },
  hidden: { label: 'Skrytý', style: { color: '#7a6b56', background: '#efe6d0', border: '1px solid #d9c69a' } },
  spam: { label: 'Spam', style: { color: '#7a6b56', background: '#efe6d0', border: '1px solid #d9c69a' } },
};

// ľavá hrana karty podľa stavu
const LEFT_BORDER: Partial<Record<CommentStatus, string>> = {
  waiting: '4px solid #c8862f',
  reported: '4px solid #a04338',
};

const TEMPLATES: { id: WarningTemplate; label: string; text: string }[] = [
  { id: 'personal_attack', label: 'Osobné útoky — drž sa témy článku', text: 'Prosím, drž sa témy článku. Osobné útoky na ostatných diskutujúcich nie sú v súlade s pravidlami diskusie na Hradiská.sk.' },
  { id: 'inappropriate', label: 'Nevhodný jazyk', text: 'Tvoj komentár obsahuje nevhodný jazyk. Uprav prosím vyjadrovanie, aby diskusia ostala vecná a slušná.' },
  { id: 'spam', label: 'Spam — reklama', text: 'Tvoj komentár pôsobí ako reklama a bol skrytý. Diskusia slúži na tému článku, nie na propagáciu.' },
  { id: 'disinfo', label: 'Dezinformácie bez zdroja', text: 'Uvádzané tvrdenia nie sú podložené dôveryhodným zdrojom. Doplň prosím prameň, inak môže byť komentár skrytý.' },
  { id: 'custom', label: 'Vlastný text…', text: '' },
];

const chipStyle = (s: React.CSSProperties): React.CSSProperties => ({
  fontSize: 11, padding: '2px 9px', borderRadius: 999, fontWeight: 600, ...s,
});

export function CommentsScreen() {
  const { token } = useAuth();
  const [status, setStatus] = useState<CommentStatus | 'all'>('waiting');
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<AdminComment[]>([]);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [counts, setCounts] = useState({ all: 0, waiting: 0, reported: 0, visible: 0, hidden: 0, spam: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDel, setConfirmDel] = useState<AdminComment | null>(null);
  const [reload, setReload] = useState(0);

  // inline panel (Odpovedať / Upozornenie) pod jednou kartou
  const [panel, setPanel] = useState<{ id: string; mode: 'reply' | 'warn' } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [warnTpl, setWarnTpl] = useState<WarningTemplate>('personal_attack');
  const [warnText, setWarnText] = useState(TEMPLATES[0].text);
  const [warnPreMod, setWarnPreMod] = useState(false);
  const [panelBusy, setPanelBusy] = useState(false);

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

  const openPanel = (c: AdminComment, mode: 'reply' | 'warn') => {
    if (panel?.id === c.documentId && panel.mode === mode) { setPanel(null); return; }
    setPanel({ id: c.documentId, mode });
    if (mode === 'reply') setReplyText('');
    if (mode === 'warn') { setWarnTpl('personal_attack'); setWarnText(TEMPLATES[0].text); setWarnPreMod(false); }
  };

  const act = async (c: AdminComment, next: CommentStatus) => {
    if (!token) return;
    setRows(rs => rs.map(x => x.documentId === c.documentId ? { ...x, status: next } : x));
    try { await setCommentStatus(token, c.documentId, next); setReload(n => n + 1); }
    catch { setRows(rs => rs.map(x => x.documentId === c.documentId ? { ...x, status: c.status } : x)); }
  };

  const submitReply = async (c: AdminComment) => {
    if (!token || !c.postDocumentId || !replyText.trim()) return;
    setPanelBusy(true);
    try { await replyToComment(token, c.postDocumentId, c.documentId, replyText.trim()); setPanel(null); setReload(n => n + 1); }
    catch (e: any) { setError(e?.message || 'Odpoveď sa nepodarilo odoslať.'); }
    finally { setPanelBusy(false); }
  };

  const submitWarning = async (c: AdminComment) => {
    if (!token || !warnText.trim()) return;
    setPanelBusy(true);
    try {
      await sendWarning(token, { comment: c.documentId, template: warnTpl, text: warnText.trim(), preModerate: warnPreMod });
      setPanel(null); setReload(n => n + 1);
    } catch (e: any) { setError(e?.message || 'Upozornenie sa nepodarilo odoslať.'); }
    finally { setPanelBusy(false); }
  };

  const doBlock = async (c: AdminComment) => {
    if (!token || !c.userId) return;
    const reason = window.prompt(`Zablokovať autora „${c.authorName}"? Zadaj dôvod (uvidí ho pri pokuse o prihlásenie):`, 'Opakované porušovanie pravidiel diskusie');
    if (reason === null) return;
    try { await blockUser(token, c.userId, reason); setError(''); setReload(n => n + 1); }
    catch (e: any) { setError(e?.message || 'Blokovanie zlyhalo.'); }
  };

  const doDelete = async () => {
    if (!token || !confirmDel) return;
    try { await deleteComment(token, confirmDel.documentId); setConfirmDel(null); setReload(n => n + 1); }
    catch (e: any) { setError(e?.message || 'Mazanie zlyhalo.'); setConfirmDel(null); }
  };

  const chips: { id: CommentStatus | 'all'; label: string; n: number }[] = useMemo(() => [
    { id: 'waiting', label: 'Čaká na schválenie', n: counts.waiting },
    { id: 'reported', label: 'Nahlásené', n: counts.reported },
    { id: 'visible', label: 'Schválené', n: counts.visible },
    { id: 'hidden', label: 'Skryté', n: counts.hidden },
    { id: 'spam', label: 'Spam', n: counts.spam },
    { id: 'all', label: 'Všetky', n: counts.all },
  ], [counts]);

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Komentáre</h1>
        <p style={{ fontSize: 13.5, color: 'var(--ad-secondary)', margin: '6px 0 0' }}>
          {counts.waiting} čaká · {counts.reported} nahlásených · {counts.visible} schválených · {counts.all} spolu
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {chips.map(c => (
          <button key={c.id} className="abtn" onClick={() => { setStatus(c.id); setPage(1); }}
                  style={{ whiteSpace: 'nowrap', ...(status === c.id ? { borderColor: 'var(--ad-amber)', background: '#f6ead0' } : {}) }}>
            {c.label} <span className="ad-badge">{c.n}</span>
          </button>
        ))}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
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

      {loading ? (
        <div className="acard" style={{ textAlign: 'center', padding: 44, color: 'var(--ad-secondary)' }}>
          <Loader2 className="w-5 h-5 animate-spin" style={{ display: 'inline' }} /> Načítavam…
        </div>
      ) : rows.length === 0 ? (
        <div className="acard" style={{ textAlign: 'center', padding: 44, color: 'var(--ad-secondary)' }}>
          {status === 'waiting' ? 'Nič nečaká na schválenie. 🎉' : 'Žiadne komentáre v tejto sekcii.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map(c => (
            <div key={c.documentId} className="acard" style={{ borderLeft: LEFT_BORDER[c.status] }}>
              <div style={{ padding: '14px 16px', display: 'flex', gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: 13.5 }}>{c.authorName}</strong>
                    {!!c.warnsCount && c.warnsCount > 0 && (
                      <span style={chipStyle({ color: '#a04338', background: '#f6e3dc' })} title="Počet upozornení autora">
                        ⚠ {c.warnsCount}
                      </span>
                    )}
                    <span style={chipStyle(STATUS_CHIP[c.status].style)}>{STATUS_CHIP[c.status].label}</span>
                    {c.authorEmail && <span style={{ fontSize: 12, color: 'var(--ad-muted)' }}>· {c.authorEmail}</span>}
                    <span style={{ fontSize: 12, color: 'var(--ad-muted)' }}>· {c.likes} ♥</span>
                    <span style={{ fontSize: 12, color: 'var(--ad-muted)' }}>· {new Date(c.originalDate || c.createdAt).toLocaleDateString('sk-SK')}</span>
                  </div>
                  {c.postTitle && (
                    <div style={{ fontSize: 12, color: 'var(--ad-muted)', marginBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <ExternalLink className="w-3 h-3" /> Pod článkom: {c.postTitle}
                    </div>
                  )}
                  <div style={{ fontSize: 14.5, color: 'var(--ad-text)', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {c.content}
                  </div>
                </div>
              </div>

              {/* akčná lišta */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', padding: '10px 16px', borderTop: '1px solid var(--ad-line)', background: 'var(--ad-surface)' }}>
                {c.status !== 'visible' && (
                  <button className="abtn" onClick={() => act(c, 'visible')} style={{ color: '#3d5c40' }}>
                    <Check className="w-3.5 h-3.5" /> Schváliť
                  </button>
                )}
                {c.status !== 'hidden' && (
                  <button className="abtn" onClick={() => act(c, 'hidden')} style={{ color: '#a04338' }}>
                    <X className="w-3.5 h-3.5" /> Zamietnuť
                  </button>
                )}
                <button className="abtn" onClick={() => openPanel(c, 'reply')} disabled={!c.postDocumentId}>
                  <Reply className="w-3.5 h-3.5" /> Odpovedať
                </button>
                <button className="abtn" onClick={() => openPanel(c, 'warn')} disabled={!c.userId} style={{ color: '#8a5316' }}>
                  <AlertTriangle className="w-3.5 h-3.5" /> Upozornenie
                </button>
                {c.status !== 'spam' && (
                  <button className="abtn abtn-icon" title="Spam" onClick={() => act(c, 'spam')}><Ban className="w-3.5 h-3.5" /></button>
                )}
                <div style={{ flex: 1 }} />
                {c.userId && (
                  <button className="abtn" onClick={() => doBlock(c)} style={{ color: '#a04338' }}>
                    <ShieldOff className="w-3.5 h-3.5" /> Blokovať autora
                  </button>
                )}
                <button className="abtn abtn-icon abtn-danger" title="Zmazať" onClick={() => setConfirmDel(c)}><Trash2 className="w-3.5 h-3.5" /></button>
              </div>

              {/* inline: ODPOVEDAŤ */}
              {panel?.id === c.documentId && panel.mode === 'reply' && (
                <div style={{ padding: '14px 16px', borderTop: '1px solid var(--ad-line)' }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ad-secondary)', display: 'block', marginBottom: 6 }}>
                    Odpoveď správcu (zverejní sa pod komentárom)
                  </label>
                  <textarea className="afld" rows={3} value={replyText} onChange={e => setReplyText(e.target.value)}
                            style={{ resize: 'vertical', width: '100%' }} placeholder="Napíš odpoveď…" />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button className="abtn" onClick={() => submitReply(c)} disabled={panelBusy || !replyText.trim()}
                            style={{ background: 'var(--ad-amber)', color: '#fff', borderColor: 'var(--ad-amber)' }}>
                      <Send className="w-3.5 h-3.5" /> Odoslať odpoveď
                    </button>
                    <button className="abtn" onClick={() => setPanel(null)}>Zrušiť</button>
                  </div>
                </div>
              )}

              {/* inline: UPOZORNENIE */}
              {panel?.id === c.documentId && panel.mode === 'warn' && (
                <div style={{ padding: '14px 16px', borderTop: '1px solid var(--ad-line)', background: '#fdf6f2' }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#8a3a2e', display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                    <AlertTriangle className="w-3.5 h-3.5" /> Upozornenie pre autora (súkromné — uvidí ho vo svojom profile)
                  </label>
                  <select className="afld" value={warnTpl}
                          onChange={e => { const t = e.target.value as WarningTemplate; setWarnTpl(t); setWarnText(TEMPLATES.find(x => x.id === t)?.text ?? ''); }}
                          style={{ width: '100%', marginBottom: 8 }}>
                    {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                  <textarea className="afld" rows={3} value={warnText} onChange={e => setWarnText(e.target.value)}
                            style={{ resize: 'vertical', width: '100%' }} placeholder="Text upozornenia…" />
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--ad-secondary)', margin: '10px 0' }}>
                    <input type="checkbox" checked={warnPreMod} onChange={e => setWarnPreMod(e.target.checked)} />
                    Zapnúť schvaľovanie ďalších komentárov tohto autora (pre-moderácia)
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="abtn" onClick={() => submitWarning(c)} disabled={panelBusy || !warnText.trim()}
                            style={{ background: 'linear-gradient(180deg,#b0564a,#8a3a2e)', color: '#fff', borderColor: '#7c332a' }}>
                      <Send className="w-3.5 h-3.5" /> Odoslať upozornenie
                    </button>
                    <button className="abtn" onClick={() => setPanel(null)}>Zrušiť</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="acard" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', marginTop: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--ad-secondary)' }}>strana {page} z {pageCount} · {total} komentárov</span>
          <div style={{ flex: 1 }} />
          <button className="abtn abtn-icon" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
          <button className="abtn abtn-icon" disabled={page >= pageCount} onClick={() => setPage(p => p + 1)}>›</button>
        </div>
      )}

      {confirmDel && (
        <div onClick={() => setConfirmDel(null)}
             style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(30,22,12,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="acard" onClick={e => e.stopPropagation()} style={{ width: 'min(440px,92vw)', padding: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 10px' }}>Zmazať komentár?</h2>
            <p style={{ fontSize: 14, color: 'var(--ad-secondary)', lineHeight: 1.6, margin: '0 0 20px' }}>
              Komentár od <strong style={{ color: 'var(--ad-text)' }}>{confirmDel.authorName}</strong> sa
              zmaže natrvalo. Zvážte radšej „Zamietnuť" (skryť), ak si nie ste istí.
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
