'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { ThumbsUp, Reply, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMember } from '../auth/MemberAuth';

const STRAPI_URL = import.meta.env.PROD ? '/strapi' : (import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337');

const goTo = (path: string) => { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); };

interface Comment {
  id: string;
  documentId: string;
  inReplyTo?: string;
  author: string;
  content: string;
  date: string;
  likes: number;
  sourceBlogger?: boolean;
  mine?: boolean;   // patrí prihlásenému? (príznak zo servera)
  replies?: Comment[];
}

interface StrapiComment {
  id: number;
  documentId: string;
  authorName: string;
  authorEmail?: string;
  content: string;
  approved: boolean;
  sourceBlogger?: boolean;
  sourceBloggerId?: string;
  inReplyTo?: string;
  likes?: number;
  originalDate?: string;
  createdAt: string;
  mine?: boolean;
}

// Lajky sa už nedržia v localStorage — po prechode na účty ide každý lajk
// cez kolekciu `reaction` (jeden na účet). Viď handleLike.

const FALLBACK_COMMENTS: Comment[] = [];

interface CommentItemProps {
  comment: Comment;
  depth?: number;
  onLike: (documentId: string) => void;
  onReply: (documentId: string, authorName: string) => void;
  onCancelReply: () => void;
  onSubmitReply: (parentDocId: string, text: string) => Promise<void>;
  onDelete: (documentId: string) => void;
  isLoggedIn: boolean;
  // Set aj Map majú .has() — prijmeme oboje (member likes sú Map).
  likedSet: { has(k: string): boolean };
  replyingToDocId: string | null;
}

function CommentItem({
  comment,
  depth = 0,
  onLike,
  onReply,
  onCancelReply,
  onSubmitReply,
  onDelete,
  isLoggedIn,
  likedSet,
  replyingToDocId,
}: CommentItemProps) {
  const liked = likedSet.has(comment.documentId);
  const isBeingRepliedTo = replyingToDocId === comment.documentId;
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  return (
    <div style={{ marginLeft: depth > 0 ? 32 : 0, marginTop: 16 }}>
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
          background: '#fffdf8',
          border: `1px solid ${isBeingRepliedTo ? '#a87437' : 'rgba(196,165,116,0.4)'}`,
          borderRadius: 10,
          padding: 16,
          transition: 'border-color 0.2s',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 9999,
            background: 'linear-gradient(135deg, #c4a574 0%, #a87437 100%)',
            color: '#fffdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Georgia, serif',
            fontSize: 14,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {(comment.author || '?').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 10,
              marginBottom: 6,
              flexWrap: 'wrap',
            }}
          >
            <strong
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 14,
                color: '#2d1810',
              }}
            >
              {comment.author}
            </strong>
            <span
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 12,
                color: '#7a6b56',
              }}
            >
              {comment.date}
            </span>
            {comment.sourceBlogger && (
              <span
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 10,
                  color: '#a87437',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  background: 'rgba(196,165,116,0.15)',
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                z pôvodného blogu
              </span>
            )}
          </div>
          <p
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 14,
              lineHeight: 1.6,
              color: '#2d2418',
              margin: 0,
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
            }}
          >
            {comment.content}
          </p>
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginTop: 12,
            }}
          >
            <button
              type="button"
              onClick={() => onLike(comment.documentId)}
              title={liked ? 'Zrušiť reakciu' : 'Páči sa mi'}
              aria-pressed={liked}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'transparent',
                border: 0,
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'Georgia, serif',
                fontSize: 12,
                color: liked ? '#a87437' : '#7a6b56',
                fontWeight: liked ? 600 : 400,
                transition: 'color 0.15s',
              }}
            >
              <ThumbsUp
                style={{
                  width: 14,
                  height: 14,
                  fill: liked ? '#a87437' : 'transparent',
                  strokeWidth: liked ? 2.2 : 2,
                  transition: 'fill 0.15s',
                }}
              />
              {comment.likes || 0}
            </button>
            <button
              type="button"
              onClick={() => onReply(comment.documentId, comment.author)}
              title="Odpovedať na tento komentár"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'transparent',
                border: 0,
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'Georgia, serif',
                fontSize: 12,
                color: '#7a6b56',
              }}
            >
              <Reply style={{ width: 14, height: 14 }} />
              Odpovedať
            </button>
            {/* Mazať vidí len autor vlastného komentára */}
            {comment.mine && (
              <button
                type="button"
                onClick={() => onDelete(comment.documentId)}
                title="Zmazať môj komentár"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent',
                  border: 0, padding: 0, cursor: 'pointer', fontFamily: 'Georgia, serif',
                  fontSize: 12, color: '#a04338',
                }}
              >
                <Trash2 style={{ width: 13, height: 13 }} />
                Zmazať
              </button>
            )}
          </div>

          {/* Inline pole na odpoveď — otvorí sa priamo pod komentárom */}
          {isBeingRepliedTo && (
            isLoggedIn ? (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <textarea
                  autoFocus
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Odpoveď pre ${comment.author}…`}
                  rows={2}
                  maxLength={5000}
                  style={{
                    width: '100%', padding: '9px 12px', background: '#fdfbf6',
                    border: '1px solid #a87437', borderRadius: 8, outline: 'none',
                    fontFamily: 'Georgia, serif', fontSize: 14, color: '#2d2418', resize: 'vertical',
                  }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    disabled={!replyText.trim() || sending}
                    onClick={async () => {
                      setSending(true);
                      try { await onSubmitReply(comment.documentId, replyText.trim()); setReplyText(''); }
                      finally { setSending(false); }
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px',
                      background: replyText.trim() ? '#a87437' : 'rgba(168,116,55,0.3)', color: '#fffdf8',
                      border: 0, borderRadius: 8, fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 600,
                      cursor: replyText.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {sending && <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" />}
                    Odoslať odpoveď
                  </button>
                  <button type="button" onClick={onCancelReply}
                          style={{ background: 'transparent', border: 0, color: '#7a6b56', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 13, textDecoration: 'underline' }}>
                    Zrušiť
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 10, fontFamily: 'Georgia, serif', fontSize: 13, color: '#7a6b56' }}>
                <button type="button" onClick={() => goTo('/prihlasenie')}
                        style={{ color: '#a87437', background: 'none', border: 0, cursor: 'pointer', textDecoration: 'underline', padding: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>
                  Prihláste sa
                </button>{' '}a zapojte sa do diskusie.
              </div>
            )
          )}
        </div>
      </div>
      {comment.replies?.map((r) => (
        <CommentItem
          key={r.id}
          comment={r}
          depth={depth + 1}
          onLike={onLike}
          onReply={onReply}
          onCancelReply={onCancelReply}
          onSubmitReply={onSubmitReply}
          onDelete={onDelete}
          isLoggedIn={isLoggedIn}
          likedSet={likedSet}
          replyingToDocId={replyingToDocId}
        />
      ))}
    </div>
  );
}

function formatDate(iso?: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('sk-SK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso.slice(0, 10);
  }
}

function mapStrapiComment(c: StrapiComment): Comment {
  return {
    id: String(c.documentId || c.id),
    documentId: c.documentId,
    inReplyTo: c.inReplyTo,
    author: c.authorName || 'Anonym',
    content: c.content || '',
    date: formatDate(c.originalDate || c.createdAt),
    likes: c.likes ?? 0,
    sourceBlogger: c.sourceBlogger,
    mine: c.mine,
  };
}

/** Imutabilný update like-count v nested strome (recursion). */
function mapTree(tree: Comment[], fn: (c: Comment) => Comment): Comment[] {
  return tree.map((c) => ({
    ...fn(c),
    replies: c.replies ? mapTree(c.replies, fn) : c.replies,
  }));
}

function bumpLikesInTree(tree: Comment[], docId: string, delta: number): Comment[] {
  return mapTree(tree, (c) =>
    c.documentId === docId ? { ...c, likes: Math.max(0, (c.likes || 0) + delta) } : c,
  );
}

function setLikesInTree(tree: Comment[], docId: string, value: number): Comment[] {
  return mapTree(tree, (c) =>
    c.documentId === docId ? { ...c, likes: value } : c,
  );
}

/** Z plain list-u komentárov zostav nested tree podľa inReplyTo.
 *  inReplyTo obsahuje documentId parent komentára. Komentáre bez
 *  inReplyTo (alebo s neexistujúcim parentom) sú top-level. */
function buildCommentTree(flat: Comment[]): Comment[] {
  const byDocId = new Map<string, Comment>();
  for (const c of flat) byDocId.set(c.documentId, { ...c, replies: [] });
  const roots: Comment[] = [];
  for (const c of byDocId.values()) {
    if (c.inReplyTo && byDocId.has(c.inReplyTo)) {
      byDocId.get(c.inReplyTo)!.replies!.push(c);
    } else {
      roots.push(c);
    }
  }
  return roots;
}

interface CommentSectionProps {
  postDocumentId?: string;
}

export function CommentSection({ postDocumentId }: CommentSectionProps) {
  const { member, token, isLoggedIn } = useMember();

  const [comments, setComments] = useState<Comment[]>(FALLBACK_COMMENTS);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // documentId komentára → documentId reakcie (lajku prihláseného člena).
  // Prítomnosť v mape = člen dal lajk. Nahrádza localStorage prístup.
  const [myLikes, setMyLikes] = useState<Map<string, string>>(new Map());
  const [replyingTo, setReplyingTo] = useState<{ docId: string; author: string } | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  const fetchComments = useCallback(async () => {
    if (!postDocumentId) {
      setComments(FALLBACK_COMMENTS);
      return;
    }
    setLoading(true);
    try {
      const url = new URL(`${STRAPI_URL}/api/blog-comments`);
      url.searchParams.set('filters[post][documentId][$eq]', postDocumentId);
      url.searchParams.set('sort[0]', 'originalDate:desc');
      url.searchParams.set('sort[1]', 'createdAt:desc');
      url.searchParams.set('pagination[pageSize]', '100');
      // GET je verejný a ide BEZ tokenu — pri Member role Strapi sanitizácia
      // odmieta filter cez reláciu `post` („Invalid key post"). Príznak „môj
      // komentár" doťahujeme zvlášť cez /blog-comments/mine (nižšie).
      const res = await fetch(url.toString(), {
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const list: StrapiComment[] = json.data || [];

      // documentId vlastných komentárov (len ak je člen prihlásený) — server
      // vráti iba pole ID, žiadne údaje účtu.
      let mineSet = new Set<string>();
      if (token) {
        try {
          const mineUrl = new URL(`${STRAPI_URL}/api/blog-comments/mine`);
          mineUrl.searchParams.set('post', postDocumentId);
          const mineRes = await fetch(mineUrl.toString(), {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (mineRes.ok) {
            const mineJson = await mineRes.json();
            mineSet = new Set<string>(mineJson.data || []);
          }
        } catch { /* nevadí — bez príznaku sa len nezobrazí tlačidlo Zmazať */ }
      }

      // Build nested tree: replies sa zobrazia vnorené pod parent komentárom
      // (oddelené visually cez `depth` v CommentItem).
      setComments(buildCommentTree(list.map((c) => {
        const m = mapStrapiComment(c);
        m.mine = mineSet.has(m.documentId);
        return m;
      })));
    } catch (e) {
      console.warn('[CommentSection] fetch failed:', e);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [postDocumentId, token]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Načítaj, ktoré komentáre už prihlásený člen lajkol (z kolekcie reaction).
  useEffect(() => {
    if (!isLoggedIn || !member || !token) { setMyLikes(new Map()); return; }
    let cancelled = false;
    const url = new URL(`${STRAPI_URL}/api/reactions`);
    url.searchParams.set('filters[user][id][$eq]', String(member.id));
    url.searchParams.set('filters[targetType][$eq]', 'comment');
    url.searchParams.set('pagination[pageSize]', '200');
    fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(j => {
        if (cancelled) return;
        const m = new Map<string, string>();
        (j.data || []).forEach((r: any) => m.set(r.targetId, r.documentId));
        setMyLikes(m);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isLoggedIn, member, token, postDocumentId]);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: '#fdfbf6',
    border: '1px solid rgba(196,165,116,0.5)',
    borderRadius: 8,
    outline: 'none',
    fontFamily: 'Georgia, serif',
    fontSize: 14,
    color: '#2d2418',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };

  const canSubmit = !!postDocumentId && isLoggedIn && !!newComment.trim() && !submitting;

  // Lajky idú cez kolekciu `reaction` (jeden na účet). Len pre prihlásených.
  const handleLike = useCallback(
    async (commentDocId: string) => {
      if (!isLoggedIn || !token) {
        toast.error('Lajkovať môžu len prihlásení. Prihláste sa.');
        return;
      }
      const existingReaction = myLikes.get(commentDocId);
      const wasLiked = !!existingReaction;
      const delta = wasLiked ? -1 : +1;

      // Optimistický update — UI reaguje hneď.
      setMyLikes(prev => {
        const next = new Map(prev);
        if (wasLiked) next.delete(commentDocId);
        else next.set(commentDocId, 'pending');
        return next;
      });
      setComments(prev => bumpLikesInTree(prev, commentDocId, delta));

      try {
        if (wasLiked) {
          const res = await fetch(`${STRAPI_URL}/api/reactions/${existingReaction}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
        } else {
          const res = await fetch(`${STRAPI_URL}/api/reactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ data: { targetType: 'comment', targetId: commentDocId } }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          const rid = json?.data?.documentId;
          if (rid) setMyLikes(prev => new Map(prev).set(commentDocId, rid));
        }
      } catch {
        // Rollback
        setMyLikes(prev => {
          const next = new Map(prev);
          if (wasLiked) next.set(commentDocId, existingReaction!);
          else next.delete(commentDocId);
          return next;
        });
        setComments(prev => bumpLikesInTree(prev, commentDocId, -delta));
        toast.error(wasLiked ? 'Nepodarilo sa zrušiť lajk.' : 'Nepodarilo sa zaznamenať lajk.');
      }
    },
    [isLoggedIn, token, myLikes],
  );

  // Otvorí inline pole odpovede priamo pod komentárom (netreba scrollovať dole).
  const handleReply = useCallback((commentDocId: string, authorName: string) => {
    setReplyingTo({ docId: commentDocId, author: authorName });
  }, []);

  const handleCancelReply = useCallback(() => setReplyingTo(null), []);

  // Mazanie vlastného komentára (backend povolí len vlastný / staff).
  const handleDelete = useCallback(async (commentDocId: string) => {
    if (!token) return;
    if (!window.confirm('Zmazať tento komentár?')) return;
    try {
      const res = await fetch(`${STRAPI_URL}/api/blog-comments/${commentDocId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success('Komentár zmazaný.');
      fetchComments();
    } catch {
      toast.error('Nepodarilo sa zmazať komentár.');
    }
  }, [token, fetchComments]);

  // Odoslanie inline odpovede — komentár s inReplyTo na rodiča.
  const submitReply = useCallback(async (parentDocId: string, text: string) => {
    if (!token || !postDocumentId) return;
    try {
      const res = await fetch(`${STRAPI_URL}/api/blog-comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ data: { content: text, post: postDocumentId, inReplyTo: parentDocId } }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setReplyingTo(null);
      toast.success('Odpoveď pridaná.');
      fetchComments();
    } catch (e) {
      toast.error('Nepodarilo sa pridať odpoveď.');
    }
  }, [token, postDocumentId, fetchComments]);

  const handleSubmit = async () => {
    if (!canSubmit || !token) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${STRAPI_URL}/api/blog-comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          data: {
            content: newComment.trim(),
            post: postDocumentId,
            // spodný formulár = top-level komentár, bez inReplyTo
            // authorName/user nastaví server z prihláseného účtu.
          },
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`HTTP ${res.status}: ${t.slice(0, 200)}`);
      }
      setNewComment('');
      setReplyingTo(null);
      toast.success('Komentár pridaný.');
      // Komentár sa zobrazí HNEĎ (status=visible) — načítame zoznam nanovo,
      // aby sa zaradil na správne miesto (aj ako odpoveď).
      fetchComments();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[CommentSection] submit failed:', e);
      toast.error(`Nepodarilo sa pridať komentár: ${msg.slice(0, 120)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="discussion" style={{ margin: '48px 0 0', scrollMarginTop: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <h2
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 22,
            fontWeight: 600,
            color: '#2d1810',
            margin: 0,
          }}
        >
          Diskusia
        </h2>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 24,
            height: 24,
            padding: '0 8px',
            borderRadius: 9999,
            background: '#a87437',
            color: '#fffdf8',
            fontFamily: 'Georgia, serif',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {loading
            ? '…'
            : (function countAll(list: Comment[]): number {
                return list.reduce((sum, c) => sum + 1 + countAll(c.replies || []), 0);
              })(comments)}
        </span>
      </div>
      <hr
        style={{
          height: 1,
          background: 'linear-gradient(90deg, #c4a574 0%, rgba(196,165,116,0) 100%)',
          margin: '8px 0 24px',
          border: 0,
        }}
      />

      {/* Komentáre */}
      <div>
        {loading && comments.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: '#7a6b56',
              fontFamily: 'Georgia, serif',
              fontSize: 14,
              fontStyle: 'italic',
              padding: 16,
            }}
          >
            <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
            Načítavam komentáre…
          </div>
        ) : comments.length === 0 ? (
          <p
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 14,
              color: '#7a6b56',
              fontStyle: 'italic',
              padding: 16,
              background: '#fffdf8',
              border: '1px dashed rgba(196,165,116,0.4)',
              borderRadius: 10,
              margin: 0,
            }}
          >
            Zatiaľ tu nie sú žiadne komentáre. Buďte prvý, kto napíše svoj názor.
          </p>
        ) : (
          comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              onLike={handleLike}
              onReply={handleReply}
              onCancelReply={handleCancelReply}
              onSubmitReply={submitReply}
              onDelete={handleDelete}
              isLoggedIn={isLoggedIn}
              likedSet={myLikes}
              replyingToDocId={replyingTo?.docId || null}
            />
          ))
        )}
      </div>

      {/* Formulár */}
      <motion.div
        ref={formRef as React.Ref<HTMLDivElement>}
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{
          marginTop: 32,
          background: '#fffdf8',
          border: '1px solid rgba(196,165,116,0.4)',
          borderRadius: 12,
          padding: 20,
        }}
      >
        {/* Spodný formulár je len na NOVÝ komentár. Odpovede sa píšu inline
            priamo pod komentárom (tlačidlo „Odpovedať"). */}
        <h3
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 13,
            fontWeight: 600,
            color: '#a87437',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          Pridať komentár
        </h3>
        {!postDocumentId && (
          <p
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 13,
              color: '#a87437',
              fontStyle: 'italic',
              margin: '12px 0 0',
            }}
          >
            Komentovanie tohto článku nie je momentálne dostupné.
          </p>
        )}
        {isLoggedIn ? (
          <div
            style={{
              display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16,
              opacity: postDocumentId ? 1 : 0.55,
              pointerEvents: postDocumentId ? 'auto' : 'none',
            }}
          >
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 13, color: '#7a6b56' }}>
              Píšete ako <strong style={{ color: '#5d3a14' }}>{member?.displayName || member?.username}</strong>
            </div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Napíšte svoj komentár…"
              rows={4}
              maxLength={5000}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'Georgia, serif' }}
              disabled={submitting}
            />
            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              style={{
                alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 24px', background: canSubmit ? '#a87437' : 'rgba(168,116,55,0.3)',
                color: '#fffdf8', border: 0, borderRadius: 8, fontFamily: 'Georgia, serif',
                fontSize: 14, fontWeight: 600, letterSpacing: '0.05em',
                cursor: canSubmit ? 'pointer' : 'not-allowed', transition: 'background 0.2s',
              }}
            >
              {submitting && <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />}
              {submitting ? "Pridávam…" : "Pridať komentár"}
            </button>
          </div>
        ) : (
          <div
            style={{
              marginTop: 16, padding: '18px 20px', borderRadius: 10,
              background: 'rgba(196,165,116,0.10)', border: '1px dashed rgba(196,165,116,0.5)',
              textAlign: 'center', fontFamily: 'Georgia, serif',
            }}
          >
            <p style={{ margin: '0 0 12px', fontSize: 14.5, color: '#5d4a32' }}>
              Do diskusie sa môžu zapojiť prihlásení členovia.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => goTo('/prihlasenie')}
                style={{ padding: '9px 20px', borderRadius: 999, border: '1px solid #7c4a13',
                  background: 'linear-gradient(180deg,#b0813a,#8a5316)', color: '#fbf3e2',
                  fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Prihlásiť sa
              </button>
              <button
                onClick={() => goTo('/registracia')}
                style={{ padding: '9px 20px', borderRadius: 999, border: '1px solid #d9c69a',
                  background: 'transparent', color: '#9a5d1f', fontFamily: 'Georgia, serif',
                  fontSize: 14, cursor: 'pointer' }}
              >
                Zaregistrovať sa
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </section>
  );
}
