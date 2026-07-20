/**
 * Moderácia komentárov v admine.
 *
 * Admin sa hlási rolou Authenticated (= staff). Controller blog-comment vtedy:
 *   - find vráti VŠETKY statusy (nie len visible)
 *   - update smie meniť `status` (skryť / spam)
 *   - delete smie zmazať ktorýkoľvek komentár
 */

import { strapiFetch, STRAPI_URL } from './client';

export type CommentStatus = 'visible' | 'hidden' | 'spam';

export interface AdminComment {
  documentId: string;
  content: string;
  authorName: string;
  authorEmail?: string;
  status: CommentStatus;
  likes: number;
  createdAt: string;
  originalDate?: string;
  sourceBlogger?: boolean;
  postTitle: string | null;
  postDocumentId: string | null;
  userId?: number;
}

export interface CommentListResult {
  items: AdminComment[];
  total: number;
  pageCount: number;
}

export async function listComments(opts: {
  token: string;
  page?: number;
  pageSize?: number;
  status?: CommentStatus | 'all';
  q?: string;
  postDocumentId?: string;
}): Promise<CommentListResult> {
  const { token, page = 1, pageSize = 30, status = 'all', q, postDocumentId } = opts;
  const parts = [
    'populate[post][fields][0]=title',
    'populate[post][fields][1]=documentId',
    'populate[user][fields][0]=id',
    'sort=createdAt:desc',
    `pagination[page]=${page}`,
    `pagination[pageSize]=${pageSize}`,
  ];
  if (status !== 'all') parts.push(`filters[status][$eq]=${status}`);
  if (q) parts.push(`filters[content][$containsi]=${encodeURIComponent(q)}`);
  if (postDocumentId) parts.push(`filters[post][documentId][$eq]=${postDocumentId}`);

  const res = await strapiFetch<any>(`/api/blog-comments?${parts.join('&')}`, { token });
  const items: AdminComment[] = (res.data ?? []).map((c: any) => ({
    documentId: c.documentId,
    content: c.content ?? '',
    authorName: c.authorName ?? 'Anonym',
    authorEmail: c.authorEmail ?? undefined,
    status: c.status ?? 'visible',
    likes: c.likes ?? 0,
    createdAt: c.createdAt,
    originalDate: c.originalDate ?? undefined,
    sourceBlogger: c.sourceBlogger ?? false,
    postTitle: c.post?.title ?? null,
    postDocumentId: c.post?.documentId ?? null,
    userId: c.user?.id,
  }));
  return {
    items,
    total: res.meta?.pagination?.total ?? items.length,
    pageCount: res.meta?.pagination?.pageCount ?? 1,
  };
}

/** Počty podľa statusu — do filtračných chipov. */
export async function commentCounts(token: string) {
  const one = (extra: string) =>
    strapiFetch<any>(`/api/blog-comments?${extra}pagination[pageSize]=1`, { token })
      .then(r => r.meta?.pagination?.total ?? 0);
  const [all, visible, hidden, spam] = await Promise.all([
    one(''),
    one('filters[status][$eq]=visible&'),
    one('filters[status][$eq]=hidden&'),
    one('filters[status][$eq]=spam&'),
  ]);
  return { all, visible, hidden, spam };
}

export async function setCommentStatus(token: string, documentId: string, status: CommentStatus) {
  return strapiFetch(`/api/blog-comments/${documentId}`, { method: 'PUT', token, body: { data: { status } } });
}

export async function deleteComment(token: string, documentId: string) {
  return strapiFetch(`/api/blog-comments/${documentId}`, { method: 'DELETE', token });
}

export { STRAPI_URL };
