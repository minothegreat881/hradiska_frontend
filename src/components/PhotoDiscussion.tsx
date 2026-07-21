'use client';

import { useEffect, useState } from 'react';
import { ThumbsUp, Send, Trash2, Reply, Loader2 } from 'lucide-react';
import { useMember } from '../auth/MemberAuth';
import {
  listPhotoComments, addPhotoComment, deletePhotoComment,
  getPhotoLikes, likePhoto, unlikePhoto, type PhotoComment,
} from '../lib/photoApi';

const go = (p: string) => { window.history.pushState({}, '', p); window.dispatchEvent(new PopStateEvent('popstate')); };

/** Komentár s vnorenými odpoveďami (strom podľa inReplyTo). */
interface PhotoCommentNode extends PhotoComment {
  replies: PhotoCommentNode[];
}

/** Z plochého zoznamu zostav strom podľa inReplyTo (rovnako ako pri článkoch). */
function buildTree(flat: PhotoComment[]): PhotoCommentNode[] {
  const byId = new Map<string, PhotoCommentNode>();
  for (const c of flat) byId.set(c.documentId, { ...c, replies: [] });
  const roots: PhotoCommentNode[] = [];
  for (const c of byId.values()) {
    if (c.inReplyTo && byId.has(c.inReplyTo)) byId.get(c.inReplyTo)!.replies.push(c);
    else roots.push(c);
  }
  return roots;
}

/**
 * Panel lajkov a komentárov k fotke v lightboxe.
 * Zobrazuje sa v info paneli vedľa obrázka. Aktivita len pre prihlásených.
 */
export function PhotoDiscussion({ fileId }: { fileId: number }) {
  const { member, token, isLoggedIn } = useMember();

  const [comments, setComments] = useState<PhotoCommentNode[]>([]);
  const [likeCount, setLikeCount] = useState(0);
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  // documentId komentára, na ktorý práve píšem odpoveď (alebo null)
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyBusy, setReplyBusy] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      listPhotoComments(fileId, token ?? undefined),
      getPhotoLikes(fileId, token ?? undefined, member?.id),
    ])
      .then(([c, l]) => { setComments(buildTree(c)); setLikeCount(l.count); setMyReaction(l.myReactionId); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [fileId, isLoggedIn]);

  const toggleLike = async () => {
    if (!isLoggedIn || !token) { go('/prihlasenie'); return; }
    const liked = !!myReaction;
    // optimisticky
    setMyReaction(liked ? null : 'pending');
    setLikeCount(n => n + (liked ? -1 : 1));
    try {
      if (liked) await unlikePhoto(token, myReaction!);
      else setMyReaction(await likePhoto(token, fileId));
    } catch {
      setMyReaction(liked ? myReaction : null);
      setLikeCount(n => n + (liked ? 1 : -1));
    }
  };

  const submit = async () => {
    if (!token || !text.trim()) return;
    setBusy(true);
    try {
      await addPhotoComment(token, fileId, text.trim());
      setText('');
      load();
    } catch { /* ignore */ } finally { setBusy(false); }
  };

  const submitReply = async (parentDocId: string) => {
    if (!token || !replyText.trim()) return;
    setReplyBusy(true);
    try {
      await addPhotoComment(token, fileId, replyText.trim(), parentDocId);
      setReplyText('');
      setReplyTo(null);
      load();
    } catch { /* ignore */ } finally { setReplyBusy(false); }
  };

  const remove = async (id: string) => {
    if (!token) return;
    if (!window.confirm('Zmazať tento komentár?')) return;
    try { await deletePhotoComment(token, id); load(); } catch {}
  };

  // Rekurzívne vykreslenie komentára aj s odpoveďami (odsadené cez depth).
  const renderComment = (c: PhotoCommentNode, depth = 0) => (
    <div key={c.documentId} style={{ marginLeft: depth > 0 ? 20 : 0, marginTop: depth > 0 ? 8 : 0 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <span style={{ color: '#a87437', fontSize: 13, fontWeight: 600 }}>{c.authorName}</span>
          <span style={{ color: '#2d2418', fontSize: 13.5, marginLeft: 8, whiteSpace: 'pre-wrap' }}>{c.content}</span>
          <div style={{ display: 'flex', gap: 12, marginTop: 3 }}>
            {isLoggedIn && (
              <button
                onClick={() => { setReplyTo(replyTo === c.documentId ? null : c.documentId); setReplyText(''); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
                  color: '#7a6b56', cursor: 'pointer', padding: 0, fontFamily: 'Georgia, serif', fontSize: 12 }}
              >
                <Reply className="w-3 h-3" /> Odpovedať
              </button>
            )}
            {c.mine && (
              <button onClick={() => remove(c.documentId)} title="Zmazať môj komentár"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
                        color: '#a04338', cursor: 'pointer', padding: 0, fontFamily: 'Georgia, serif', fontSize: 12 }}>
                <Trash2 className="w-3 h-3" /> Zmazať
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Inline pole odpovede pod komentárom */}
      {replyTo === c.documentId && isLoggedIn && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', marginTop: 6, marginLeft: 4 }}>
          <textarea
            autoFocus
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder={`Odpoveď pre ${c.authorName}…`}
            rows={2}
            maxLength={2000}
            style={{ flex: 1, resize: 'vertical', padding: '7px 10px', borderRadius: 8,
              background: '#fdfbf6', border: '1px solid #a87437', color: '#2d2418',
              fontFamily: 'Georgia, serif', fontSize: 13, outline: 'none' }}
          />
          <button
            onClick={() => submitReply(c.documentId)} disabled={replyBusy || !replyText.trim()}
            style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 8, cursor: 'pointer', border: 'none',
              background: 'linear-gradient(180deg,#b0813a,#8a5316)', color: '#fbf3e2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: replyBusy || !replyText.trim() ? 0.5 : 1 }}
          >
            {replyBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {c.replies.map(r => renderComment(r, depth + 1))}
    </div>
  );

  const S = {
    text: { fontFamily: 'Georgia, serif' } as React.CSSProperties,
  };

  return (
    <div style={{ ...S.text, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Lajk */}
      <button
        onClick={toggleLike}
        style={{
          alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '7px 14px', borderRadius: 999, cursor: 'pointer',
          border: `1px solid ${myReaction ? '#c8862f' : 'rgba(196,165,116,0.5)'}`,
          background: myReaction ? 'rgba(200,134,47,0.14)' : 'transparent',
          color: myReaction ? '#8a5316' : '#7a6b56', fontFamily: 'Georgia, serif', fontSize: 13,
        }}
      >
        <ThumbsUp className="w-4 h-4" style={{ fill: myReaction ? '#c8862f' : 'transparent' }} />
        {likeCount} {likeCount === 1 ? 'lajk' : likeCount < 5 ? 'lajky' : 'lajkov'}
      </button>

      {/* Komentáre */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <span style={{ color: '#7a6b56', fontSize: 13 }}>
            <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ display: 'inline' }} /> Načítavam…
          </span>
        ) : comments.length === 0 ? (
          <span style={{ color: '#7a6b56', fontSize: 13, fontStyle: 'italic' }}>
            Zatiaľ bez komentárov k tejto fotke.
          </span>
        ) : comments.map(c => renderComment(c))}
      </div>

      {/* Vstup */}
      {isLoggedIn ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Napíšte komentár…"
            rows={2}
            maxLength={2000}
            style={{
              flex: 1, resize: 'vertical', padding: '8px 11px', borderRadius: 8,
              background: '#fdfbf6', border: '1px solid rgba(196,165,116,0.5)',
              color: '#2d2418', fontFamily: 'Georgia, serif', fontSize: 13.5, outline: 'none',
            }}
          />
          <button
            onClick={submit} disabled={busy || !text.trim()}
            style={{
              flexShrink: 0, width: 38, height: 38, borderRadius: 8, cursor: 'pointer',
              border: 'none', background: 'linear-gradient(180deg,#b0813a,#8a5316)', color: '#fbf3e2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: busy || !text.trim() ? 0.5 : 1,
            }}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      ) : (
        <button
          onClick={() => go('/prihlasenie')}
          style={{
            alignSelf: 'flex-start', fontFamily: 'Georgia, serif', fontSize: 13,
            color: '#c8862f', background: 'none', border: 'none', cursor: 'pointer',
            textDecoration: 'underline', padding: 0,
          }}
        >
          Prihláste sa a zapojte sa do diskusie
        </button>
      )}
    </div>
  );
}
