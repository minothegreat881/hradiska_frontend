/**
 * Prihlásenie voči Strapi Users & Permissions.
 *
 * POZOR na dva oddelené systémy účtov v Strapi:
 *   - `admin_users`  → prihlásenie do /admin panelu, endpoint /admin/login.
 *                      TÝMTO SA SEM PRIHLÁSIŤ NEDÁ.
 *   - `up_users`     → API používatelia, endpoint /api/auth/local. Tento používame.
 *
 * Účet a povolenia roly „Authenticated" boli nastavené 2026-07-20 a otestované
 * skutočným create/update/publish/delete cyklom.
 */

import { strapiFetch } from './client';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
}

export interface LoginResult {
  jwt: string;
  user: AdminUser;
}

export async function login(identifier: string, password: string): Promise<LoginResult> {
  return strapiFetch<LoginResult>('/api/auth/local', {
    method: 'POST',
    body: { identifier, password },
  });
}

/** Overí, či token ešte platí, a vráti prihláseného používateľa. */
export async function me(token: string): Promise<AdminUser> {
  return strapiFetch<AdminUser>('/api/users/me', { token });
}
