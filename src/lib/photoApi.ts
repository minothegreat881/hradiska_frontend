/**
 * Komentáre a lajky k fotkám (kolekcie photo-comment a reaction).
 *
 * Fotka nie je entita — viaže sa cez `fileId` (id v Media Library).
 * Komentovať a lajkovať môžu len prihlásení (rieši Strapi controller).
 */

const STRAPI_URL = import.meta.env.PROD ? (typeof window !== 'undefined' ? window.location.origin + '/strapi' : '/strapi') : (import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337');

export interface PhotoComment {
  documentId: string;
  content: string;
  authorName: string;
  createdAt: string;
  inReplyTo?: string | null;
  mine?: boolean;
  /** URL avatara autora (ak si ho nastavil) */
  authorAvatar?: string | null;
  /** počet lajkov komentára */
  likeCount?: number;
  /** documentId mojej reakcie (ak som lajkol) — na unlike; null ak nie */
  myLikeId?: string | null;
}

function authHeaders(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function listPhotoComments(fileId: number, token?: string): Promise<PhotoComment[]> {
  const url = new URL(`${STRAPI_URL}/api/photo-comments`);
  url.searchParams.set('filters[fileId][$eq]', String(fileId));
  url.searchParams.set('sort', 'createdAt:asc');
  url.searchParams.set('pagination[pageSize]', '100');
  // Token pošleme, ak je člen prihlásený: controller podľa neho doplní `mine`
  // (vlastník komentára → tlačidlo Zmazať). `authorName` doplní server vždy,
  // aj neprihlásenému (populate[user] cez verejné API Strapi zahadzuje).
  const r = await fetch(url.toString(), { headers: authHeaders(token) });
  if (!r.ok) return [];
  const j = await r.json();
  return (j.data || []).map((c: any) => ({
    documentId: c.documentId,
    content: c.content,
    authorName: c.authorName || 'Člen',
    createdAt: c.createdAt,
    inReplyTo: c.inReplyTo ?? null,
    mine: !!c.mine,
    authorAvatar: c.authorAvatar ?? null,
    likeCount: c.likeCount ?? 0,
    myLikeId: c.myLikeId ?? null,
  }));
}

/** Lajkne foto-komentár (reaction targetType='photo-comment'). Vráti documentId reakcie. */
export async function likePhotoComment(token: string, commentDocumentId: string): Promise<string> {
  const r = await fetch(`${STRAPI_URL}/api/reactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ data: { targetType: 'photo-comment', targetId: commentDocumentId } }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  return j.data.documentId;
}

/** Odoberie lajk foto-komentára (zmaže vlastnú reakciu). */
export async function unlikePhotoComment(token: string, reactionId: string): Promise<void> {
  const r = await fetch(`${STRAPI_URL}/api/reactions/${reactionId}`, {
    method: 'DELETE', headers: authHeaders(token),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
}

export async function addPhotoComment(
  token: string, fileId: number, content: string, inReplyTo?: string | null,
): Promise<void> {
  const r = await fetch(`${STRAPI_URL}/api/photo-comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ data: { fileId, content, inReplyTo: inReplyTo ?? null } }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
}

export async function deletePhotoComment(token: string, documentId: string): Promise<void> {
  const r = await fetch(`${STRAPI_URL}/api/photo-comments/${documentId}`, {
    method: 'DELETE', headers: authHeaders(token),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
}

// ── Lajky fotky (reaction targetType='photo', targetId=fileId) ────────────────

export interface PhotoLikeState {
  count: number;
  myReactionId: string | null;
}

export async function getPhotoLikes(fileId: number, token?: string, myUserId?: number): Promise<PhotoLikeState> {
  const url = new URL(`${STRAPI_URL}/api/reactions`);
  url.searchParams.set('filters[targetType][$eq]', 'photo');
  url.searchParams.set('filters[targetId][$eq]', String(fileId));
  url.searchParams.set('populate[user]', 'true');
  url.searchParams.set('pagination[pageSize]', '500');
  const r = await fetch(url.toString(), { headers: authHeaders(token) });
  if (!r.ok) return { count: 0, myReactionId: null };
  const j = await r.json();
  const data = j.data || [];
  const mine = myUserId ? data.find((x: any) => x.user?.id === myUserId) : null;
  return { count: data.length, myReactionId: mine?.documentId ?? null };
}

export async function likePhoto(token: string, fileId: number): Promise<string> {
  const r = await fetch(`${STRAPI_URL}/api/reactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ data: { targetType: 'photo', targetId: String(fileId) } }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  return j.data.documentId;
}

export async function unlikePhoto(token: string, reactionId: string): Promise<void> {
  const r = await fetch(`${STRAPI_URL}/api/reactions/${reactionId}`, {
    method: 'DELETE', headers: authHeaders(token),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
}
