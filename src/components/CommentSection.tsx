'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { ThumbsUp, Reply, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';

interface Comment {
  id: string;
  documentId: string;
  inReplyTo?: string;
  author: string;
  content: string;
  date: string;
  likes: number;
  sourceBlogger?: boolean;
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
}

const LIKED_STORAGE_KEY = 'hradiska:liked-comments';

function getLikedSet(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(LIKED_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveLikedSet(set: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // ignore quota / privacy errors
  }
}

const FALLBACK_COMMENTS: Comment[] = [];

interface CommentItemProps {
  comment: Comment;
  depth?: number;
  onLike: (documentId: string) => void;
  onReply: (documentId: string, authorName: string) => void;
  likedSet: Set<string>;
  replyingToDocId: string | null;
}

function CommentItem({
  comment,
  depth = 0,
  onLike,
  onReply,
  likedSet,
  replyingToDocId,
}: CommentItemProps) {
  const liked = likedSet.has(comment.documentId);
  const isBeingRepliedTo = replyingToDocId === comment.documentId;
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
          </div>
        </div>
      </div>
      {comment.replies?.map((r) => (
        <CommentItem
          key={r.id}
          comment={r}
          depth={depth + 1}
          onLike={onLike}
          onReply={onReply}
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
  const [comments, setComments] = useState<Comment[]>(FALLBACK_COMMENTS);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [likedSet, setLikedSet] = useState<Set<string>>(() => getLikedSet());
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
      const res = await fetch(url.toString(), {
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const list: StrapiComment[] = json.data || [];
      // Build nested tree: replies sa zobrazia vnorené pod parent komentárom
      // (oddelené visually cez `depth` v CommentItem).
      setComments(buildCommentTree(list.map(mapStrapiComment)));
    } catch (e) {
      console.warn('[CommentSection] fetch failed:', e);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [postDocumentId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

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

  const canSubmit = !!postDocumentId && !!name.trim() && !!newComment.trim() && !submitting;

  const handleLike = useCallback(
    async (commentDocId: string) => {
      const wasLiked = likedSet.has(commentDocId);
      const action = wasLiked ? 'unlike' : 'like';
      const delta = wasLiked ? -1 : +1;

      // Optimistic update — UI hneď reaguje, server response zafixuje finálnu hodnotu.
      setLikedSet((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.delete(commentDocId);
        else next.add(commentDocId);
        saveLikedSet(next);
        return next;
      });
      setComments((prev) => bumpLikesInTree(prev, commentDocId, delta));

      try {
        const res = await fetch(
          `${STRAPI_URL}/api/blog-comments/${commentDocId}/${action}`,
          { method: 'POST', headers: { 'ngrok-skip-browser-warning': 'true' } },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const serverLikes = json?.data?.likes;
        if (typeof serverLikes === 'number') {
          setComments((prev) => setLikesInTree(prev, commentDocId, serverLikes));
        }
      } catch (e) {
        // Rollback optimistic update
        setLikedSet((prev) => {
          const next = new Set(prev);
          if (wasLiked) next.add(commentDocId);
          else next.delete(commentDocId);
          saveLikedSet(next);
          return next;
        });
        setComments((prev) => bumpLikesInTree(prev, commentDocId, -delta));
        toast.error(wasLiked ? 'Nepodarilo sa zrušiť reakciu.' : 'Nepodarilo sa zaznamenať reakciu.');
      }
    },
    [likedSet],
  );

  const handleReply = useCallback((commentDocId: string, authorName: string) => {
    setReplyingTo({ docId: commentDocId, author: authorName });
    // Scroll k formuláru
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }, []);

  const handleCancelReply = useCallback(() => setReplyingTo(null), []);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${STRAPI_URL}/api/blog-comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({
          data: {
            authorName: name.trim(),
            authorEmail: email.trim() || undefined,
            content: newComment.trim(),
            post: postDocumentId,
            inReplyTo: replyingTo?.docId,
          },
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`HTTP ${res.status}: ${t.slice(0, 200)}`);
      }
      setName('');
      setEmail('');
      setNewComment('');
      setReplyingTo(null);
      toast.success(
        'Komentár bol odoslaný. Po schválení administrátorom sa zobrazí v diskusii.',
      );
      // Komentár nepridávame do zoznamu — je v admin moderation queue, fetch vráti
      // len schválené. Užívateľ vidí toast a formulár sa vyčistí.
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[CommentSection] submit failed:', e);
      toast.error(`Nepodarilo sa odoslať komentár: ${msg.slice(0, 120)}`);
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
              likedSet={likedSet}
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
          border: replyingTo ? '1px solid #a87437' : '1px solid rgba(196,165,116,0.4)',
          borderRadius: 12,
          padding: 20,
          transition: 'border-color 0.2s',
        }}
      >
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
          {replyingTo ? `Odpovedať na ${replyingTo.author}` : 'Pridať komentár'}
        </h3>
        {replyingTo && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginTop: 10,
              padding: '8px 12px',
              background: 'rgba(196,165,116,0.12)',
              borderRadius: 8,
              fontFamily: 'Georgia, serif',
              fontSize: 13,
              color: '#5d3a14',
            }}
          >
            <span>
              Odpovedáte na komentár od <strong>{replyingTo.author}</strong>.
            </span>
            <button
              type="button"
              onClick={handleCancelReply}
              style={{
                marginLeft: 'auto',
                background: 'transparent',
                border: 0,
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'Georgia, serif',
                fontSize: 12,
                color: '#7a6b56',
                textDecoration: 'underline',
              }}
            >
              Zrušiť
            </button>
          </div>
        )}
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            marginTop: 16,
            opacity: postDocumentId ? 1 : 0.55,
            pointerEvents: postDocumentId ? 'auto' : 'none',
          }}
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Vaše meno *"
            maxLength={100}
            style={inputStyle}
            disabled={submitting}
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail (nezobrazí sa, slúži len adminovi)"
            maxLength={150}
            style={inputStyle}
            disabled={submitting}
          />
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
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 24px',
              background: canSubmit ? '#a87437' : 'rgba(168,116,55,0.3)',
              color: '#fffdf8',
              border: 0,
              borderRadius: 8,
              fontFamily: 'Georgia, serif',
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.05em',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s',
            }}
          >
            {submitting && <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />}
            {submitting ? 'Odosielam…' : 'Odoslať'}
          </button>
          <p
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 12,
              color: '#7a6b56',
              fontStyle: 'italic',
              margin: 0,
            }}
          >
            Komentár sa po odoslaní zobrazí až po schválení administrátorom.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
