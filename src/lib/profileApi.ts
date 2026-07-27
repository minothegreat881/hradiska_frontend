/**
 * Klient pre profil prihláseného čitateľa: notifikácie, moje komentáre,
 * obľúbené a zdieľané, profil + jeho nastavenia. Všetko vyžaduje JWT člena.
 *
 * Endpointy sú v Strapi pod /api/... (notification/share/reaction/account controllers).
 */
const STRAPI_URL = import.meta.env.PROD ? (typeof window !== 'undefined' ? window.location.origin + '/strapi' : '/strapi') : (import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337');

async function call<T>(path: string, token: string, opts?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`${STRAPI_URL}${path}`, {
    method: opts?.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(json?.error?.message || `Chyba ${res.status}`);
  return json as T;
}

/* ── Typy ─────────────────────────────────────────────────────────────── */
export type NotifType = 'reply' | 'like' | 'warning' | 'post';

export interface NotificationItem {
  documentId: string;
  type: NotifType;
  read: boolean;
  text: string | null;
  aggregateCount: number;
  createdAt: string;
  actor?: { username: string; displayName?: string | null } | null;
  post?: { title: string; slug: string } | null;
  comment?: { content: string; documentId: string } | null;
  aktualita?: { nazov: string } | null;
}

export interface MyComment {
  documentId: string;
  content: string;
  status: 'visible' | 'hidden' | 'spam' | 'waiting' | 'reported';
  likes: number;
  replyCount: number;
  editedAt: string | null;
  createdAt: string;
  post: { title: string; slug: string } | null;
}

export interface FavoritePost {
  documentId: string;
  title: string;
  slug: string;
  category?: { name: string; slug: string } | null;
  coverImage?: { url: string; formats?: Record<string, { url: string }> } | null;
}

export interface MyShare {
  documentId: string;
  channel: string | null;
  createdAt: string;
  post: { title: string; slug: string } | null;
}

export interface Profile {
  id: number;
  username: string;
  email: string;
  displayName: string | null;
  avatar: { url: string; formats?: Record<string, { url: string }> } | null;
  warnsCount: number;
  preModerated: boolean;
  joinedAt: string;
  prefs: { notifyReply: boolean; notifyLike: boolean; notifyPost: boolean; notifyEmail: boolean };
  stats: { comments: number; favorites: number; shares: number };
}

/* ── Notifikácie ──────────────────────────────────────────────────────── */
export const getNotifications = (token: string, page = 1) =>
  call<{ data: NotificationItem[]; meta: { pagination: { page: number; pageSize: number; total: number } } }>(
    `/api/notifications/mine?page=${page}`, token);

export const getUnreadCount = (token: string) =>
  call<{ count: number }>('/api/notifications/unread-count', token).then((r) => r.count);

export const markAllRead = (token: string) =>
  call<{ ok: boolean }>('/api/notifications/mark-all-read', token, { method: 'PUT' });

export const markNotifRead = (token: string, id: string) =>
  call<unknown>(`/api/notifications/${id}/read`, token, { method: 'PUT' });

/* ── Moje komentáre ───────────────────────────────────────────────────── */
export const getMyComments = (token: string) =>
  call<{ data: MyComment[] }>('/api/blog-comments/mine-all', token).then((r) => r.data);

export const editComment = (token: string, id: string, content: string) =>
  call<unknown>(`/api/blog-comments/${id}`, token, { method: 'PUT', body: { data: { content } } });

export const deleteComment = (token: string, id: string) =>
  call<unknown>(`/api/blog-comments/${id}`, token, { method: 'DELETE' });

/* ── Obľúbené a zdieľané ──────────────────────────────────────────────── */
export const getMyFavorites = (token: string) =>
  call<{ data: FavoritePost[] }>('/api/reactions/mine/posts', token).then((r) => r.data);

export const getMyShares = (token: string) =>
  call<{ data: MyShare[] }>('/api/shares/mine', token).then((r) => r.data);

/** Zaznamená zdieľanie článku prihláseným členom (pre počet a tab „Zdieľané"). */
export const recordShare = (token: string, postDocumentId: string, channel: string) =>
  call<unknown>('/api/shares', token, { method: 'POST', body: { data: { post: postDocumentId, channel } } });

/* ── Profil + nastavenia ──────────────────────────────────────────────── */
export const getProfile = (token: string) => call<Profile>('/api/account/me', token);

export const updateProfile = (
  token: string,
  data: Partial<{ displayName: string; notifyReply: boolean; notifyLike: boolean; notifyPost: boolean; notifyEmail: boolean; avatar: number }>,
) => call<{ ok: boolean; displayName: string | null }>('/api/account/me', token, { method: 'PUT', body: { data } });

/** Avatar: najprv upload súboru, potom updateProfile({ avatar: fileId }). */
export async function uploadAvatar(token: string, file: File): Promise<number> {
  const fd = new FormData();
  fd.append('files', file);
  const res = await fetch(`${STRAPI_URL}/api/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
  if (!res.ok) throw new Error('Nahranie avatara zlyhalo.');
  const arr = await res.json();
  return arr?.[0]?.id;
}
