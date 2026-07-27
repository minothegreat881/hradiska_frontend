/**
 * Moderácia komentárov k FOTKÁM (galéria) v admine — paralela k comments.ts.
 *
 * Kolekcia photo-comment má statusy len visible/hidden/spam (žiadne waiting/
 * reported), viaže sa na fotku cez fileId (nie na článok). Staff (Authenticated)
 * vidí cez controller všetky statusy a smie meniť status / mazať.
 */

import { strapiFetch } from './client';
import type { AdminComment, CommentStatus, CommentListResult } from './comments';

export async function listPhotoComments(opts: {
  token: string;
  page?: number;
  pageSize?: number;
  status?: CommentStatus | 'all';
  q?: string;
}): Promise<CommentListResult> {
  const { token, page = 1, pageSize = 30, status = 'all', q } = opts;
  const parts = [
    'sort=createdAt:desc',
    `pagination[page]=${page}`,
    `pagination[pageSize]=${pageSize}`,
  ];
  if (status !== 'all') parts.push(`filters[status][$eq]=${status}`);
  if (q) parts.push(`filters[content][$containsi]=${encodeURIComponent(q)}`);

  const res = await strapiFetch<any>(`/api/photo-comments?${parts.join('&')}`, { token });
  const items: AdminComment[] = (res.data ?? []).map((c: any) => ({
    documentId: c.documentId,
    content: c.content ?? '',
    authorName: c.authorName ?? 'Člen',
    status: (c.status ?? 'visible') as CommentStatus,
    likes: 0,
    createdAt: c.createdAt,
    postTitle: c.fileId ? `Fotka #${c.fileId}` : 'Fotka (galéria)',
    postDocumentId: null,
    source: 'photo',
    fileId: c.fileId,
  }));
  return {
    items,
    total: res.meta?.pagination?.total ?? items.length,
    pageCount: res.meta?.pagination?.pageCount ?? 1,
  };
}

/** Počty podľa statusu (photo-comment nemá waiting/reported). */
export async function photoCommentCounts(token: string) {
  const one = (extra: string) =>
    strapiFetch<any>(`/api/photo-comments?${extra}pagination[pageSize]=1`, { token })
      .then(r => r.meta?.pagination?.total ?? 0);
  const [all, visible, hidden, spam] = await Promise.all([
    one(''),
    one('filters[status][$eq]=visible&'),
    one('filters[status][$eq]=hidden&'),
    one('filters[status][$eq]=spam&'),
  ]);
  return { all, waiting: 0, reported: 0, visible, hidden, spam };
}

export async function setPhotoCommentStatus(token: string, documentId: string, status: CommentStatus) {
  return strapiFetch(`/api/photo-comments/${documentId}`, { method: 'PUT', token, body: { data: { status } } });
}

export async function deletePhotoComment(token: string, documentId: string) {
  return strapiFetch(`/api/photo-comments/${documentId}`, { method: 'DELETE', token });
}
