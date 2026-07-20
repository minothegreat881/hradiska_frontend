'use client';

import { useEffect, useState } from 'react';
import { ThumbsUp, Send, Trash2, Loader2 } from 'lucide-react';
import { useMember } from '../auth/MemberAuth';
import {
  listPhotoComments, addPhotoComment, deletePhotoComment,
  getPhotoLikes, likePhoto, unlikePhoto, type PhotoComment,
} from '../lib/photoApi';

const go = (p: string) => { window.history.pushState({}, '', p); window.dispatchEvent(new PopStateEvent('popstate')); };

/**
 * Panel lajkov a komentárov k fotke v lightboxe.
 * Zobrazuje sa v info paneli vedľa obrázka. Aktivita len pre prihlásených.
 */
export function PhotoDiscussion({ fileId }: { fileId: number }) {
  const { member, token, isLoggedIn } = useMember();

  const [comments, setComments] = useState<PhotoComment[]>([]);
  const [likeCount, setLikeCount] = useState(0);
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      listPhotoComments(fileId),
      getPhotoLikes(fileId, token ?? undefined, member?.id),
    ])
      .then(([c, l]) => { setComments(c); setLikeCount(l.count); setMyReaction(l.myReactionId); })
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

  const remove = async (id: string) => {
    if (!token) return;
    try { await deletePhotoComment(token, id); setComments(cs => cs.filter(c => c.documentId !== id)); } catch {}
  };

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
        ) : comments.map(c => (
          <div key={c.documentId} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <span style={{ color: '#a87437', fontSize: 13, fontWeight: 600 }}>{c.authorName}</span>
              <span style={{ color: '#2d2418', fontSize: 13.5, marginLeft: 8, whiteSpace: 'pre-wrap' }}>{c.content}</span>
            </div>
            {member?.id && c.userId === member.id && (
              <button onClick={() => remove(c.documentId)} title="Zmazať"
                      style={{ background: 'none', border: 'none', color: '#a87437', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
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
