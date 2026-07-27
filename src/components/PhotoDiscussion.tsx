'use client';

import { useEffect, useRef, useState } from 'react';
import { ThumbsUp, MessageCircle, Share2, Heart, Send, Loader2 } from 'lucide-react';
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

function countNodes(nodes: PhotoCommentNode[]): number {
  return nodes.reduce((n, c) => n + 1 + countNodes(c.replies), 0);
}

/** Relatívny čas v slovenčine (jednoduchý). */
function relTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const min = Math.round(diff / 60000);
  if (min < 1) return 'teraz';
  if (min < 60) return `pred ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `pred ${h} h`;
  const d = Math.round(h / 24);
  if (d < 7) return `pred ${d} d`;
  return new Date(iso).toLocaleDateString('sk-SK', { day: 'numeric', month: 'short' });
}

/** Deterministická farba avatara podľa mena. */
function avatarBg(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${h}, 42%, 42%)`;
}

function skloninaLajk(n: number): string {
  return n === 1 ? 'lajk' : n < 5 ? 'lajky' : 'lajkov';
}
function skloninaKom(n: number): string {
  return n === 1 ? 'komentár' : n < 5 ? 'komentáre' : 'komentárov';
}

/**
 * Reakcie + komentáre k fotke — vykresľuje sa v lightboxe (mobil karta / desktop panel).
 * Poradie: riadok reakcií → akčná lišta (Páči sa mi / Komentovať / Zdieľať) →
 * scrollovateľné komentáre → pilulkový vstup. Aktivita len pre prihlásených.
 */
export function PhotoDiscussion({ fileId, onShare }: { fileId: number; onShare?: () => void }) {
  const { member, token, isLoggedIn } = useMember();

  const [comments, setComments] = useState<PhotoCommentNode[]>([]);
  const [likeCount, setLikeCount] = useState(0);
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyBusy, setReplyBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const commentCount = countNodes(comments);
  const liked = !!myReaction;

  const toggleLike = async () => {
    if (!isLoggedIn || !token) { go('/prihlasenie'); return; }
    setMyReaction(liked ? null : 'pending');
    setLikeCount((n) => n + (liked ? -1 : 1));
    try {
      if (liked) await unlikePhoto(token, myReaction!);
      else setMyReaction(await likePhoto(token, fileId));
    } catch {
      setMyReaction(liked ? myReaction : null);
      setLikeCount((n) => n + (liked ? 1 : -1));
    }
  };

  const focusInput = () => {
    if (!isLoggedIn) { go('/prihlasenie'); return; }
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView({ block: 'nearest' });
  };

  const submit = async () => {
    if (!token || !text.trim()) return;
    setBusy(true);
    try { await addPhotoComment(token, fileId, text.trim()); setText(''); load(); }
    catch { /* ignore */ } finally { setBusy(false); }
  };

  const submitReply = async (parentDocId: string) => {
    if (!token || !replyText.trim()) return;
    setReplyBusy(true);
    try { await addPhotoComment(token, fileId, replyText.trim(), parentDocId); setReplyText(''); setReplyTo(null); load(); }
    catch { /* ignore */ } finally { setReplyBusy(false); }
  };

  const remove = async (id: string) => {
    if (!token) return;
    if (!window.confirm('Zmazať tento komentár?')) return;
    try { await deletePhotoComment(token, id); load(); } catch {}
  };

  const initial = (member?.displayName || member?.username || '?').charAt(0).toUpperCase();

  /* ── Jeden komentár (bublina) + odpovede ─────────────────────────────── */
  const renderComment = (c: PhotoCommentNode, depth = 0) => (
    <div key={c.documentId} style={{ marginLeft: depth > 0 ? 26 : 0, marginTop: depth > 0 ? 8 : 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div
          aria-hidden="true"
          style={{
            flexShrink: 0, width: 34, height: 34, borderRadius: 999, marginTop: 2,
            background: avatarBg(c.authorName), color: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700,
          }}
        >
          {c.authorName.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: 'var(--pl-bubble)', borderRadius: 14, padding: '9px 13px' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 700, color: 'var(--pl-title)' }}>
              {c.authorName}
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16.5, color: 'var(--pl-body)', lineHeight: 1.4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {c.content}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 4, paddingLeft: 6, fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--pl-muted-2)' }}>
            <span>{relTime(c.createdAt)}</span>
            {isLoggedIn && (
              <button
                onClick={() => { setReplyTo(replyTo === c.documentId ? null : c.documentId); setReplyText(''); }}
                className="pl-focusable"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--pl-muted-2)', fontFamily: 'var(--font-serif)', fontSize: 14 }}
              >
                Odpovedať
              </button>
            )}
            {c.mine && (
              <button
                onClick={() => remove(c.documentId)}
                className="pl-focusable"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--pl-bordo-2)', fontFamily: 'var(--font-serif)', fontSize: 14 }}
              >
                Zmazať
              </button>
            )}
          </div>

          {replyTo === c.documentId && isLoggedIn && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
              <input
                autoFocus
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitReply(c.documentId); } }}
                placeholder={`Odpoveď pre ${c.authorName}…`}
                maxLength={2000}
                style={pillInputStyle}
              />
              <button
                onClick={() => submitReply(c.documentId)}
                disabled={replyBusy || !replyText.trim()}
                aria-label="Odoslať odpoveď"
                className="pl-focusable"
                style={{ ...sendBtnStyle, opacity: replyBusy || !replyText.trim() ? 0.5 : 1 }}
              >
                {replyBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>
      {c.replies.map((r) => renderComment(r, depth + 1))}
    </div>
  );

  return (
    <div className="pl-discuss-inner" style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: '1 1 auto' }}>
      {/* Riadok reakcií — bez „0" (skryté, keď niet lajkov ani komentárov) */}
      {(likeCount > 0 || commentCount > 0) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 15px 9px', flexShrink: 0 }}>
          {likeCount > 0 && (
            <>
              <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <span style={reactChip('linear-gradient(135deg,#c8862f,#9a5d1f)')}><ThumbsUp className="w-3 h-3" style={{ color: '#fff' }} /></span>
                <span style={{ ...reactChip('linear-gradient(135deg,#a04338,#7c1f24)'), marginLeft: -7 }}><Heart className="w-3 h-3" style={{ color: '#fff' }} /></span>
              </span>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--pl-muted)' }}>
                {likeCount} {skloninaLajk(likeCount)}
              </span>
            </>
          )}
          {commentCount > 0 && (
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--pl-muted-2)' }}>
              {commentCount} {skloninaKom(commentCount)}
            </span>
          )}
        </div>
      )}

      {/* Akčná lišta */}
      <div style={{ display: 'flex', gap: 4, padding: '4px 10px', margin: '0 5px', borderTop: '1px solid var(--pl-border-soft)', flexShrink: 0 }}>
        <button className="pl-act pl-focusable" data-active={liked} onClick={toggleLike} aria-pressed={liked}>
          <ThumbsUp className="w-4.5 h-4.5" style={{ width: 18, height: 18, fill: liked ? 'currentColor' : 'transparent' }} /> Páči sa mi
        </button>
        <button className="pl-act pl-focusable" onClick={focusInput}>
          <MessageCircle style={{ width: 18, height: 18 }} /> Komentovať
        </button>
        <button className="pl-act pl-focusable" onClick={onShare}>
          <Share2 style={{ width: 18, height: 18 }} /> Zdieľať
        </button>
      </div>

      {/* Komentáre — scrollovateľná časť (na desktope má panel pevnú výšku) */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '4px 15px 8px' }}>
        {loading ? (
          <span style={{ color: 'var(--pl-muted-2)', fontFamily: 'var(--font-serif)', fontSize: 15 }}>
            <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ display: 'inline' }} /> Načítavam…
          </span>
        ) : comments.length === 0 ? (
          <p style={{ color: 'var(--pl-muted-2)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 15, margin: '8px 0' }}>
            Buď prvý, kto sa ozve ✦
          </p>
        ) : (
          comments.map((c) => renderComment(c))
        )}
      </div>

      {/* Vstup — safe-area vpravo dole kvôli nainštalovanej appke (home indicator) */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 14px calc(10px + env(safe-area-inset-bottom, 0px))', background: 'var(--pl-surface)', borderTop: '1px solid var(--pl-border-soft)', flexShrink: 0 }}>
        <div
          aria-hidden="true"
          style={{
            flexShrink: 0, width: 34, height: 34, borderRadius: 999,
            background: isLoggedIn ? 'linear-gradient(135deg,#a87437,#7d4f1d)' : '#e6d7b0',
            color: isLoggedIn ? '#fffdf8' : '#8a795e',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700,
          }}
        >
          {isLoggedIn ? initial : '?'}
        </div>
        {isLoggedIn ? (
          <>
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
              placeholder="Napíš komentár…"
              maxLength={2000}
              className="pl-focusable"
              style={pillInputStyle}
            />
            <button
              onClick={submit}
              disabled={busy || !text.trim()}
              aria-label="Odoslať komentár"
              className="pl-focusable"
              style={{ ...sendBtnStyle, opacity: busy || !text.trim() ? 0.5 : 1 }}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </>
        ) : (
          <button
            onClick={() => go('/prihlasenie')}
            className="pl-focusable"
            style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--pl-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0' }}
          >
            <strong style={{ color: 'var(--pl-amber-2)' }}>Prihláste sa</strong> a zapojte sa do diskusie
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Zdieľané štýly ─────────────────────────────────────────────────────── */
const pillInputStyle: React.CSSProperties = {
  flex: 1, minWidth: 0,
  background: '#fff', border: '1px solid var(--pl-field)', borderRadius: 999,
  padding: '9px 14px', color: 'var(--pl-title)',
  fontFamily: 'var(--font-serif)', fontSize: 16, outline: 'none',
};

const sendBtnStyle: React.CSSProperties = {
  flexShrink: 0, width: 38, height: 38, borderRadius: 999, cursor: 'pointer', border: 'none',
  background: 'linear-gradient(180deg,#b0813a,#8a5316)', color: '#fbf3e2',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

function reactChip(bg: string): React.CSSProperties {
  return {
    width: 22, height: 22, borderRadius: 999, background: bg,
    border: '1.5px solid var(--pl-card)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  };
}
