/**
 * Správa členov v admine (blokovanie účtov).
 *
 * Používa endpoint plugin::users-permissions.user — admin (rola Authenticated)
 * dostal find/update. Blokovanie = `blocked: true`; Strapi potom pri login
 * takého používateľa odmietne.
 *
 * ⚠️ users-permissions `find` vracia HOLÉ POLE (bez data/meta), rovnako ako
 * upload API. Stránkuje sa cez `pagination` v query, ale bez meta počtu.
 */

import { strapiFetch } from './client';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  displayName?: string | null;
  confirmed: boolean;
  blocked: boolean;
  blockedReason?: string | null;
  blockedAt?: string | null;
  createdAt: string;
  roleName?: string;
}

export async function listUsers(token: string, q?: string): Promise<AdminUser[]> {
  const parts = ['populate=role', 'sort=createdAt:desc', 'pagination[limit]=200'];
  if (q?.trim()) parts.push(`filters[$or][0][username][$containsi]=${encodeURIComponent(q.trim())}`,
                            `filters[$or][1][email][$containsi]=${encodeURIComponent(q.trim())}`);
  const res = await strapiFetch<any>(`/api/users?${parts.join('&')}`, { token });
  const arr = Array.isArray(res) ? res : (res.data ?? []);
  return arr.map((u: any) => ({
    id: u.id,
    username: u.username,
    email: u.email,
    displayName: u.displayName,
    confirmed: !!u.confirmed,
    blocked: !!u.blocked,
    blockedReason: u.blockedReason,
    blockedAt: u.blockedAt,
    createdAt: u.createdAt,
    roleName: u.role?.name,
  }));
}

export async function blockUser(token: string, id: number, reason: string) {
  return strapiFetch(`/api/users/${id}`, {
    method: 'PUT', token,
    body: { blocked: true, blockedReason: reason || 'Zablokované administrátorom', blockedAt: new Date().toISOString() },
  });
}

export async function unblockUser(token: string, id: number) {
  return strapiFetch(`/api/users/${id}`, {
    method: 'PUT', token,
    body: { blocked: false, blockedReason: null, blockedAt: null },
  });
}

/**
 * Úplne vymaže používateľa (DELETE /api/users/:id). Uvoľní e-mail aj meno,
 * takže sa nimi dá znovu zaregistrovať. Vyžaduje `destroy` permission pre
 * rolu Authenticated (nastavené na backende).
 */
export async function deleteUser(token: string, id: number) {
  return strapiFetch(`/api/users/${id}`, { method: 'DELETE', token });
}
