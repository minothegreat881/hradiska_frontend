/**
 * Správa členov v admine (blokovanie účtov).
 *
 * Blokovanie a mazanie ide cez plugin::users-permissions.user — admin (rola
 * Authenticated) na to dostal update/destroy. Blokovanie = `blocked: true`;
 * Strapi potom pri login takého používateľa odmietne.
 *
 * ⚠️ ZOZNAM sa ale NEČÍTA z `/api/users`. Ten reláciu `role` z výstupu
 * **zahadzuje** bez ohľadu na `populate` (overené: kľúč `role` v odpovedi vôbec
 * nie je), takže stĺpec Rola ostával prázdny („—"). Preto je na to vlastný
 * staff-only endpoint `/api/account/users`, ktorý rolu dopočíta na serveri
 * a vráti len bezpečné polia. Ten istý vzor ako pri autoroch komentárov.
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
  roleName?: string | null;
  roleType?: string | null;
  /** Rola `authenticated` = plné práva v admine (zobrazuje sa ako „Superadmin"). */
  isStaff: boolean;
  /** Účet prihláseného správcu — nesmie sám sebe zobraziť Blokovať/Vymazať. */
  isMe: boolean;
}

export async function listUsers(token: string, q?: string): Promise<AdminUser[]> {
  const suffix = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
  const res = await strapiFetch<{ data: AdminUser[] }>(`/api/account/users${suffix}`, { token });
  return res.data ?? [];
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
